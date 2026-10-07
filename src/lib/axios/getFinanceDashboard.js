import api from "./api-template";

export async function getFinanceDashboardBootstrap({ forceRefresh = false } = {}) {
  const response = await api.get("/api/finance-dashboard/bootstrap", {
    params: {
      forceRefresh: forceRefresh ? "1" : undefined,
    },
    withCredentials: true,
  });

  return response.data;
}
