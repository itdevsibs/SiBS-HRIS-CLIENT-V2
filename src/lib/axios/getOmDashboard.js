import api from "./api-template";

export async function getOmDashboardBootstrap({ forceRefresh = false } = {}) {
  const response = await api.get("/api/om-dashboard/bootstrap", {
    params: {
      forceRefresh: forceRefresh ? "1" : undefined,
    },
    withCredentials: true,
  });

  return response.data;
}
