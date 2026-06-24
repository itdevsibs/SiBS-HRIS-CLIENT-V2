import api from "./api-template";

/* =========================================
   WEEKLY HIRING PLAN API
========================================= */

export async function getWeeklyHiringPlanWeeks() {
  try {
    const res = await api.get("/api/weekly-hiring-plan/weeks", {
      withCredentials: true,
    });

    return res.data?.data || [];
  } catch (err) {
    console.error(
      "Axios getWeeklyHiringPlanWeeks API error:",
      err?.response?.status,
      err?.response?.data || err?.message
    );

    return [];
  }
}

export async function getWeeklyHiringPlanFilterOptions() {
  try {
    const res = await api.get("/api/weekly-hiring-plan/filter-options", {
      withCredentials: true,
    });

    return {
      clusters: res.data?.clusters || [],
      accounts: res.data?.accounts || [],
    };
  } catch (err) {
    console.error(
      "Axios getWeeklyHiringPlanFilterOptions API error:",
      err?.response?.status,
      err?.response?.data || err?.message
    );

    return {
      clusters: [],
      accounts: [],
    };
  }
}

export async function getWeeklyHiringPlanAccounts(cluster, startDate, endDate) {
  try {
    const res = await api.get("/api/weekly-hiring-plan/accounts", {
      params: {
        cluster,
        startDate,
        endDate,
      },
      withCredentials: true,
    });

    return res.data?.data || [];
  } catch (err) {
    console.error(
      "Axios getWeeklyHiringPlanAccounts API error:",
      err?.response?.status,
      err?.response?.data || err?.message
    );

    return [];
  }
}

/* =========================================
   SAVE ACTION ITEM
   Saves action item fields into weekly_hiring_plan_headcount
========================================= */

export async function saveWeeklyHiringPlanActionItem(payload) {
  try {
    const res = await api.post(
      "/api/weekly-hiring-plan/headcount/action-item",
      payload,
      {
        withCredentials: true,
      }
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios saveWeeklyHiringPlanActionItem API error:",
      err?.response?.status,
      err?.response?.data || err?.message
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

export default {
  getWeeklyHiringPlanWeeks,
  getWeeklyHiringPlanFilterOptions,
  getWeeklyHiringPlanAccounts,
  saveWeeklyHiringPlanActionItem,
};