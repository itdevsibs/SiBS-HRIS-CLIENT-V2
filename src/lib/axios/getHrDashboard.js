import api from "./api-template";
import { getDashboardDetailEndpoint } from "../utils/Dashboards/AdminDashboard/adminDashboardHelpers";

function refreshParams(forceRefresh) {
  return forceRefresh
    ? {
      refresh: 1,
      _t: Date.now(),
    }
    : undefined;
}

export async function getHrDashboardOverview({ forceRefresh = false } = {}) {
  const response = await api.get("/api/hr-dashboard/overview", {
    params: refreshParams(forceRefresh),
    withCredentials: true,
  });

  return response.data;
}

export async function getHrDashboardFeed({ forceRefresh = false } = {}) {
  const response = await api.get("/api/hr-dashboard/feed", {
    params: refreshParams(forceRefresh),
    withCredentials: true,
  });

  return response.data;
}

export async function getHrDashboardDetail(
  detailType,
  { page = 1, limit = 15, search = "" } = {},
) {
  const endpoint = getDashboardDetailEndpoint(detailType);

  if (!endpoint) {
    throw new Error(`Unsupported HR dashboard detail type: ${detailType}`);
  }

  const response = await api.get(endpoint, {
    params: {
      page,
      limit,
      search: String(search || "").trim() || undefined,
    },
    withCredentials: true,
  });

  return response.data;
}
