import api from "./api-template";

/* =========================================
   WORKFORCE HIRING PLAN API
========================================= */

export async function getWorkforceHiringPlanWeeks() {
  try {
    const res = await api.get("/api/weekly-hiring-plan/weeks", {
      withCredentials: true,
    });

    console.log("getWorkforceHiringPlanWeeks res:", res.data);
    return res.data?.data || [];
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
    const res = await api.get("/api/weekly-hiring-plan/filter-options", {
      withCredentials: true,
    });

    console.log("getWorkforceHiringPlanFilterOptions res:", res.data);

    return {
      clusters: res.data?.clusters || [],
      accounts: res.data?.accounts || [],
    };
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

export async function getWorkforceHiringPlanAccounts(
  cluster,
  startDate,
  endDate,
) {
  try {
    const res = await api.get("/api/weekly-hiring-plan/accounts", {
      params: {
        cluster,
        startDate,
        endDate,
      },
      withCredentials: true,
    });

    console.log("getWorkforceHiringPlanAccounts res:", res.data);

    return res.data?.data || [];
  } catch (err) {
    console.error(
      "Axios getWorkforceHiringPlanAccounts API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

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
  try {
    const response = await api.get("/api/weekly-hiring-plan/accounts/trends", {
      params: {
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
      },
      withCredentials: true,
    });

    return response.data;
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
  try {
    const response = await api.get(
      "/api/weekly-hiring-plan/accounts/six-week-table",
      {
        params: {
          cluster,
          account,
          weekStart,
          weekEnd,
          startDate,
          endDate,
          rangeStartDate,
          rangeEndDate,
        },
        withCredentials: true,
      },
    );

    return response.data;
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
  try {
    const response = await api.get(
      "/api/weekly-hiring-plan/accounts/forecast",
      {
        params: {
          cluster,
          account,
          weekStart,
          weekEnd,
          startDate,
          endDate,
          basisWeeks,
          forecastWeeks,
        },
        withCredentials: true,
      },
    );

    return response.data;
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
