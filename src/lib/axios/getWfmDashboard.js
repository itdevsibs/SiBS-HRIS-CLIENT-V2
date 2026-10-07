import api from "./api-template";

export async function getWfmDashboardBootstrap({ forceRefresh = false } = {}) {
  const response = await api.get("/api/wfm-dashboard/bootstrap", {
    params: {
      forceRefresh: forceRefresh ? "1" : undefined,
    },
    withCredentials: true,
  });

  return response.data;
}
