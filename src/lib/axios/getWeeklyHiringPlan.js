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

export async function getWeeklyHiringPlanAccounts(
  cluster,
  startDate,
  endDate
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

export default {
  getWeeklyHiringPlanWeeks,
  getWeeklyHiringPlanFilterOptions,
  getWeeklyHiringPlanAccounts,
};