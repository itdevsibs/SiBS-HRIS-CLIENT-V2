import api from "./api-template";

export async function getSomDashboardBootstrap({ forceRefresh = false } = {}) {
  const response = await api.get("/api/som-dashboard/bootstrap", {
    params: {
      forceRefresh: forceRefresh ? "1" : undefined,
    },
    withCredentials: true,
  });

  return response.data;
}
