import api from "./api-template";
import { isCancellation } from "./cancellation";

/*
  Workforce Hiring read-request cache / in-flight dedupe.

  Why this exists:
  - React StrictMode in development can replay mount effects.
  - Workforce endpoints are expensive because they aggregate employee,
    attendance, attrition, and recruitment pipeline data.
  - Two identical requests arriving together should share one Promise instead
    of making the server calculate the same dashboard twice.

  The cache is intentionally short-lived so normal refreshes still get fresh
  HRIS/Kronos data.
*/
const workforceReadCache = new Map();
const workforceReadInflight = new Map();

function stableRequestKey(name, params = {}) {
  const normalized = Object.keys(params || {})
    .sort()
    .map((key) => [key, params[key] ?? ""]);

  return `${name}:${JSON.stringify(normalized)}`;
}

async function getCachedWorkforceRead({
  name,
  params = {},
  ttlMs = 5000,
  loader,
  signal,
}) {
  if (signal?.aborted) throw new DOMException("Request cancelled", "AbortError");
  const key = stableRequestKey(name, params);
  const now = Date.now();
  const cached = workforceReadCache.get(key);

  if (ttlMs > 0 && cached && now - cached.createdAt <= ttlMs) {
    return cached.value;
  }

  let pending = workforceReadInflight.get(key);
  if (!pending) {
    const controller = new AbortController();
    pending = { controller, consumers: 0 };
    const entry = pending;
    entry.promise = Promise.resolve()
    .then(() => loader(controller.signal))
    .then((value) => {
      if (ttlMs > 0) workforceReadCache.set(key, {
        createdAt: Date.now(),
        value,
      });

      return value;
    })
    .finally(() => {
      if (workforceReadInflight.get(key) === entry) workforceReadInflight.delete(key);
    });
    workforceReadInflight.set(key, entry);
  }
  pending.consumers += 1;
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      pending.consumers -= 1;
      callback(value);
    };
    const onAbort = () => {
      finish(reject, new DOMException("Request cancelled", "AbortError"));
      queueMicrotask(() => {
        if (pending.consumers === 0) {
          if (workforceReadInflight.get(key) === pending) workforceReadInflight.delete(key);
          pending.controller.abort();
        }
      });
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    pending.promise.then((value) => finish(resolve, value), (error) => finish(reject, error));
  });
}

function clearWorkforceHiringPlanReadCache() {
  workforceReadCache.clear();
}

if (typeof window !== "undefined") {
  window.addEventListener("sibs-auth-logout-start", () => {
    clearWorkforceHiringPlanReadCache();
    for (const request of workforceReadInflight.values()) request.controller.abort();
    workforceReadInflight.clear();
  });
}


/* =========================================
   WORKFORCE HIRING PLAN API
========================================= */

export async function getWorkforceHiringPlanWeeks({ signal } = {}) {
  try {
    return await getCachedWorkforceRead({
      name: "weeks",
      ttlMs: 30000,
      signal,
      loader: async (requestSignal) => {
        const res = await api.get("/api/weekly-hiring-plan/weeks", {
          withCredentials: true,
          signal: requestSignal,
        });

        if (res.data?.success !== true || !Array.isArray(res.data.data)) throw new Error(res.data?.message || "Failed to load workforce weeks.");
        return res.data.data;
      },
    });
  } catch (err) {
    if (isCancellation(err)) throw err;
    console.error(
      "Axios getWorkforceHiringPlanWeeks API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    throw new Error(err?.response?.data?.message || err.message || "Failed to load workforce weeks.", { cause: err });
  }
}

export async function getWorkforceHiringPlanFilterOptions({ signal } = {}) {
  try {
    return await getCachedWorkforceRead({
      name: "filter-options",
      ttlMs: 30000,
      signal,
      loader: async (requestSignal) => {
        const res = await api.get("/api/weekly-hiring-plan/filter-options", {
          withCredentials: true,
          signal: requestSignal,
        });

        console.log("getWorkforceHiringPlanFilterOptions res:", res.data);

        return {
          clusters: res.data?.clusters || [],
          accounts: res.data?.accounts || [],
        };
      },
    });
  } catch (err) {
    if (isCancellation(err)) {
      return {
        clusters: [],
        accounts: [],
      };
    }
    console.error(
      "Axios getWorkforceHiringPlanFilterOptions API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      clusters: [],
      accounts: [],
    };
  }
}

export async function getWorkforceHiringPlanAccountOptions(
  cluster = "All",
  { signal } = {},
) {
  const params = { cluster };

  try {
    return await getCachedWorkforceRead({
      name: "account-options",
      params,
      ttlMs: 15000,
      signal,
      loader: async (requestSignal) => {
        const res = await api.get("/api/weekly-hiring-plan/account-options", {
          params,
          withCredentials: true,
          signal: requestSignal,
        });

        return res.data?.data || [];
      },
    });
  } catch (err) {
    if (isCancellation(err)) return [];
    console.error(
      "Axios getWorkforceHiringPlanAccountOptions API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return [];
  }
}

// Quick, independent roster-only read. Other weekly KPIs require the full
// report and must stay in loading state until that report is verified.
// A missing route is an HRIS client/server version mismatch, not an empty roster.
// Avoid repeatedly requesting it until the page is reloaded after deployment.
let rosterPreviewRouteMissing = false;
const unavailableRosterPreview = Object.freeze({ success: false, preliminary: false, unavailable: true });
export async function getWorkforceHiringPlanRosterPreview(cluster, startDate, endDate, account) {
  if (rosterPreviewRouteMissing) return unavailableRosterPreview;
  return getCachedWorkforceRead({
    name: "roster-preview",
    params: { cluster, startDate, endDate, account },
    ttlMs: 30_000,
    loader: async () => {
      try {
        const response = await api.get("/api/weekly-hiring-plan/accounts/roster-preview", {
          params: { cluster, startDate, endDate, account },
          withCredentials: true,
          timeout: 20_000,
        });
        if (!response.data?.success) throw new Error(response.data?.message || "Roster preview failed");
        return response.data;
      } catch (error) {
        if (error?.response?.status === 404) {
          rosterPreviewRouteMissing = true;
          console.warn("[Workforce] Roster preview route is missing on the running HRIS server; apply the matching server patch and restart the backend.");
          return unavailableRosterPreview;
        }
        throw error;
      }
    },
  });
}

export async function getWorkforceHiringPlanAccounts(
  cluster = "All",
  startDate = "",
  endDate = "",
  account = "All",
  includeWeeklySeries = true,
  { signal } = {},
) {
  const params = {
    cluster,
    account,
    startDate,
    endDate,
    includeWeeklySeries: includeWeeklySeries ? 1 : 0,
  };

  try {
    return await getCachedWorkforceRead({
      name: "accounts",
      params,
      ttlMs: 0,
      signal,
      loader: async (requestSignal) => {
        const res = await api.get("/api/weekly-hiring-plan/accounts", {
          params,
          withCredentials: true,
          signal: requestSignal,
        });
        if (res.data?.success !== true || !Array.isArray(res.data.data)) {
          throw new Error(res.data?.message || "Failed to fetch workforce accounts.");
        }
        return res.data.data;
      },
    });
  } catch (err) {
    if (isCancellation(err)) throw err;
    throw new Error(err?.response?.data?.message || err.message || "Failed to fetch workforce accounts.", { cause: err });
  }
}

/* =========================================
   GET 6-WEEK TRENDS
========================================= */

export async function getWorkforceHiringPlanTrends({
  cluster = "All",
  account = "All",
  weekStart = "",
  weekEnd = "",
  startDate = "",
  endDate = "",
  rangeStartDate = "",
  rangeEndDate = "",
  signal,
} = {}) {
  const params = {
    cluster,
    account,
    weekStart,
    weekEnd,
    startDate,
    endDate,

    /*
      Only modal filter sends these.
      Dashboard default should NOT send these.
    */
    rangeStartDate,
    rangeEndDate,
  };

  return getCachedWorkforceRead({
    name: "account-trends",
    params,
    ttlMs: 0,
    signal,
    loader: async (requestSignal) => {
      const response = await api.get(
        "/api/weekly-hiring-plan/accounts/trends",
        {
          params,
          withCredentials: true,
          signal: requestSignal,
        },
      );

      if (response.data?.success !== true) {
        throw new Error(response.data?.message || "Failed to fetch 6-week trends.");
      }
      return response.data;
    },
  }).catch((error) => {
    if (isCancellation(error) || error.name === "AbortError" || signal?.aborted) throw error;
    throw new Error(error?.response?.data?.message || error.message || "Failed to fetch 6-week trends.", { cause: error });
  });
}

/*
  Alias name.

  Keep this so both names work:
  - getWorkforceHiringPlanTrends
  - getWorkforceHiringPlanAccountTrends
*/
export const getWorkforceHiringPlanAccountTrends = getWorkforceHiringPlanTrends;

/* =========================================
   SAVE ACTION ITEM
   Saves action item fields into workforce_hiring_plan_headcount
========================================= */

export async function saveWorkforceHiringPlanActionItem(payload) {
  try {
    const res = await api.post(
      "/api/weekly-hiring-plan/headcount/action-item",
      payload,
      {
        withCredentials: true,
      },
    );

    clearWorkforceHiringPlanReadCache();
    return res.data;
  } catch (err) {
    console.error(
      "Axios saveWorkforceHiringPlanActionItem API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to save action item.",
    };
  }
}

export async function saveRequiredHeadcount(payload) {
  const res = await api.post("/api/weekly-hiring-plan/headcount", payload, {
    withCredentials: true,
  });

  clearWorkforceHiringPlanReadCache();
  return res.data;
}

export async function lockWorkforceHiringPlanSnapshot(payload) {
  const res = await api.post(
    "/api/weekly-hiring-plan/headcount/lock-week",
    payload,
    {
      withCredentials: true,
    },
  );

  clearWorkforceHiringPlanReadCache();
  return res.data;
}

export async function updateWorkforceHiringPlanFile(payload) {
  const formData = new FormData();

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (key === "uploadedFile") return;

    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  if (payload?.uploadedFile) {
    formData.append("uploadedFile", payload.uploadedFile);
  }

  const res = await api.post(
    "/api/weekly-hiring-plan/headcount/file",
    formData,
    {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  clearWorkforceHiringPlanReadCache();
  return res.data;
}

export async function openWorkforceHiringPlanFile({ sibsId, filename }) {
  if (!sibsId || !filename) {
    throw new Error("Missing file information.");
  }

  const res = await api.get(
    `/api/weekly-hiring-plan/file/${encodeURIComponent(
      sibsId,
    )}/${encodeURIComponent(filename)}`,
    {
      responseType: "blob",
      withCredentials: true,
    },
  );

  const blobUrl = window.URL.createObjectURL(res.data);
  window.open(blobUrl, "_blank", "noopener,noreferrer");

  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 60_000);
}

export async function getWorkforceHiringPlanSixWeekTable({
  cluster = "All",
  account = "All",
  weekStart = "",
  weekEnd = "",
  startDate = "",
  endDate = "",
  rangeStartDate = "",
  rangeEndDate = "",
} = {}) {
  const params = {
    cluster,
    account,
    weekStart,
    weekEnd,
    startDate,
    endDate,
    rangeStartDate,
    rangeEndDate,
  };

  try {
    return await getCachedWorkforceRead({
      name: "six-week-table",
      params,
      ttlMs: 15000,
      loader: async () => {
        const response = await api.get(
          "/api/weekly-hiring-plan/accounts/six-week-table",
          {
            params,
            withCredentials: true,
          },
        );

        return response.data;
      },
    });
  } catch (error) {
    console.error(
      "Axios getWorkforceHiringPlanSixWeekTable API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return {
      success: false,
      data: [],
      summary: {},
      totals: {},
      weeks: [],
      labels: [],
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to fetch six-week table.",
    };
  }
}

export async function getWorkforceHiringPlanForecast({
  cluster = "All",
  account = "All",
  weekStart = "",
  weekEnd = "",
  startDate = "",
  endDate = "",
  basisWeeks = 6,
  forecastWeeks = 6,
} = {}) {
  const params = {
    cluster,
    account,
    weekStart,
    weekEnd,
    startDate,
    endDate,
    basisWeeks,
    forecastWeeks,
  };

  try {
    return await getCachedWorkforceRead({
      name: "forecast",
      params,
      ttlMs: 15000,
      loader: async () => {
        const response = await api.get(
          "/api/weekly-hiring-plan/accounts/forecast",
          {
            params,
            withCredentials: true,
          },
        );

        return response.data;
      },
    });
  } catch (error) {
    console.error(
      "Axios getWorkforceHiringPlanForecast API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return {
      success: false,
      data: [],
      summary: {},
      totals: {},
      weeks: [],
      labels: [],
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to fetch workforce hiring forecast.",
    };
  }
}

export default {
  getWorkforceHiringPlanWeeks,
  getWorkforceHiringPlanFilterOptions,
  getWorkforceHiringPlanAccountOptions,
  getWorkforceHiringPlanAccounts,
  getWorkforceHiringPlanSixWeekTable,
  getWorkforceHiringPlanForecast,

  getWorkforceHiringPlanTrends,
  getWorkforceHiringPlanAccountTrends,

  saveWorkforceHiringPlanActionItem,
  saveRequiredHeadcount,
  lockWorkforceHiringPlanSnapshot,
  updateWorkforceHiringPlanFile,
  openWorkforceHiringPlanFile,
};
