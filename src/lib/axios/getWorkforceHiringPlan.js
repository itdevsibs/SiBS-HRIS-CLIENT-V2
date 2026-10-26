import api from "./api-template";

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
}) {
  const key = stableRequestKey(name, params);
  const now = Date.now();
  const cached = workforceReadCache.get(key);

  if (cached && now - cached.createdAt <= ttlMs) {
    return cached.value;
  }

  if (workforceReadInflight.has(key)) {
    return workforceReadInflight.get(key);
  }

  const request = Promise.resolve()
    .then(loader)
    .then((value) => {
      workforceReadCache.set(key, {
        createdAt: Date.now(),
        value,
      });

      return value;
    })
    .finally(() => {
      workforceReadInflight.delete(key);
    });

  workforceReadInflight.set(key, request);
  return request;
}

// A large Kronos snapshot should never keep a single browser request open
// for minutes: the proxy or server can close that connection with Axios
// `Network Error` even if the calculation is still running. Start one job
// and poll it with short, independently recoverable HTTP requests.
const WORKFORCE_JOB_POLL_MS = 2500;
const WORKFORCE_JOB_MAX_MS = 10 * 60 * 1000;
function sleepWorkforceJob(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function getWorkforceJobResult(path, params) {
  const start = await api.get(path, {
    params,
    withCredentials: true,
    timeout: 15000,
  });
  if (!start.data?.success || !start.data?.jobId) {
    throw new Error(start.data?.message || "Unable to start workforce data request.");
  }
  const jobId = start.data.jobId;
  const started = Date.now();
  let consecutiveNetworkFailures = 0;
  while (Date.now() - started < WORKFORCE_JOB_MAX_MS) {
    await sleepWorkforceJob(WORKFORCE_JOB_POLL_MS);
    let response;
    try {
      response = await api.get(`${path}/${encodeURIComponent(jobId)}`, {
        withCredentials: true,
        timeout: 15000,
      });
      consecutiveNetworkFailures = 0;
    } catch (error) {
      // Transient network failures during a long job shouldn't trigger
      // another full Kronos snapshot. A lost/restarted server is still an
      // error after a few attempts, and must not appear as zero workforce.
      const retriable = !error?.response && (error?.code === "ERR_NETWORK" || error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT");
      if (retriable && ++consecutiveNetworkFailures <= 3) continue;
      throw error;
    }
    const payload = response.data;
    if (!payload?.success) throw new Error(payload?.message || "Invalid workforce job response.");
    if (payload.status === "ready") {
      if (payload.result?.success === false) {
        const issue = new Error(payload.result?.error || payload.result?.message || "Workforce API source failed.");
        issue.code = payload.result?.code || null;
        throw issue;
      }
      return payload.result;
    }
    if (payload.status === "failed") {
      const issue = new Error(payload.result?.error || payload.result?.message || "Workforce data could not be loaded.");
      issue.code = payload.result?.code || null;
      throw issue;
    }
    if (!["queued", "running"].includes(payload.status)) throw new Error("Unexpected workforce job status.");
  }
  throw new Error("Workforce data processing exceeded 10 minutes. Check the Kronos API and backend logs.");
}

function clearWorkforceHiringPlanReadCache() {
  workforceReadCache.clear();
}


/* =========================================
   WORKFORCE HIRING PLAN API
========================================= */

export async function getWorkforceHiringPlanWeeks() {
  try {
    return await getCachedWorkforceRead({
      name: "weeks",
      ttlMs: 30000,
      loader: async () => {
        const res = await api.get("/api/weekly-hiring-plan/weeks", {
          withCredentials: true,
        });

        console.log("getWorkforceHiringPlanWeeks res:", res.data);
        return res.data?.data || [];
      },
    });
  } catch (err) {
    console.error(
      "Axios getWorkforceHiringPlanWeeks API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return [];
  }
}

export async function getWorkforceHiringPlanFilterOptions() {
  try {
    return await getCachedWorkforceRead({
      name: "filter-options",
      ttlMs: 30000,
      loader: async () => {
        const res = await api.get("/api/weekly-hiring-plan/filter-options", {
          withCredentials: true,
        });

        console.log("getWorkforceHiringPlanFilterOptions res:", res.data);

        return {
          clusters: res.data?.clusters || [],
          accounts: res.data?.accounts || [],
        };
      },
    });
  } catch (err) {
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
) {
  const params = { cluster };

  try {
    return await getCachedWorkforceRead({
      name: "account-options",
      params,
      ttlMs: 15000,
      loader: async () => {
        const res = await api.get("/api/weekly-hiring-plan/account-options", {
          params,
          withCredentials: true,
        });

        return res.data?.data || [];
      },
    });
  } catch (err) {
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
  failOnError = false,
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
      ttlMs: 10000,
      loader: async () => {
        const res = { data: await getWorkforceJobResult("/api/weekly-hiring-plan/accounts/jobs", params) };

        if (res.data?.success === false) {
          const responseError = new Error(res.data?.error || res.data?.message || "Workforce accounts request failed.");
          responseError.code = res.data?.code || null;
          throw responseError;
        }

        return res.data?.data || [];
      },
    });
  } catch (err) {
    console.error(
      "Axios getWorkforceHiringPlanAccounts API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    // The Overview cannot treat a failed 500 response as a genuine zero-HC
    // week. Preserve existing empty-list behavior for legacy consumers.
    if (failOnError) {
      const issue = new Error(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Workforce account data is temporarily unavailable.",
      );
      issue.status = err?.response?.status || err?.status || null;
      issue.code = err?.response?.data?.code || err?.code || null;
      throw issue;
    }

    return [];
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

  try {
    return await getCachedWorkforceRead({
      name: "account-trends",
      params,
      ttlMs: 15000,
      loader: async () => {
        return getWorkforceJobResult("/api/weekly-hiring-plan/accounts/trends/jobs", params);
      },
    });
  } catch (error) {
    console.error(
      "Axios getWorkforceHiringPlanAccountTrends API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return {
      success: false,
      labels: [],
      trends: {
        absenteeism: [],
        attrition: [],
        buffer: [],
      },
      data: [],
      weeklyResults: [],
      averages: {},
      totals: {},
      summary: {},
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to fetch 6-week trends.",
    };
  }
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
