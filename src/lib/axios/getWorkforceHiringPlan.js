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
} = {}) {
  try {
    const res = await api.get("/api/weekly-hiring-plan/accounts/trends", {
      params: {
        cluster,
        account,
        weekStart,
        weekEnd,
        startDate,
        endDate,
      },
      withCredentials: true,
    });

    console.log("getWorkforceHiringPlanTrends res:", res.data);

    return res.data || null;
  } catch (err) {
    console.error(
      "Axios getWorkforceHiringPlanTrends API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return null;
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

export default {
  getWorkforceHiringPlanWeeks,
  getWorkforceHiringPlanFilterOptions,
  getWorkforceHiringPlanAccounts,

  getWorkforceHiringPlanTrends,
  getWorkforceHiringPlanAccountTrends,

  saveWorkforceHiringPlanActionItem,
  saveRequiredHeadcount,
  lockWorkforceHiringPlanSnapshot,
  updateWorkforceHiringPlanFile,
  openWorkforceHiringPlanFile,
};
