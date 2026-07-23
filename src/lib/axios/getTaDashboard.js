import api from "./api-template";

function forceRefreshParam(forceRefresh) {
  return forceRefresh ? "1" : undefined;
}

export async function getTaDashboardBootstrap({ forceRefresh = false } = {}) {
  const response = await api.get("/api/ta-dashboard/bootstrap", {
    params: {
      forceRefresh: forceRefreshParam(forceRefresh),
    },
    withCredentials: true,
  });

  return response.data;
}

export async function getTaDashboardOverview({ forceRefresh = false } = {}) {
  const response = await api.get("/api/ta-dashboard/overview", {
    params: {
      forceRefresh: forceRefreshParam(forceRefresh),
    },
    withCredentials: true,
  });

  return response.data;
}

export async function getTaDashboardRoles({
  page = 1,
  limit = 100,
  search = "",
  status = "All",
  forceRefresh = false,
} = {}) {
  const response = await api.get("/api/ta-dashboard/roles", {
    params: {
      page,
      limit,
      search: String(search || "").trim() || undefined,
      status: status && status !== "All" ? status : undefined,
      forceRefresh: forceRefreshParam(forceRefresh),
    },
    withCredentials: true,
  });

  return response.data;
}

export async function getTaDashboardRecruiters({ forceRefresh = false } = {}) {
  const response = await api.get("/api/ta-dashboard/recruiters", {
    params: {
      forceRefresh: forceRefreshParam(forceRefresh),
    },
    withCredentials: true,
  });

  return response.data;
}
