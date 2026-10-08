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


export async function getStatutoryCoverageSummary({ forceRefresh = false } = {}) {
  const response = await api.get("/api/finance-dashboard/statutory-coverage", {
    params: {
      forceRefresh: forceRefresh ? "1" : undefined,
    },
    withCredentials: true,
  });

  return response.data;
}

export async function getFinanceStatutoryEmployees({
  benefit,
  status = "complete",
  search = "",
  page = 1,
  limit = 15,
} = {}) {
  const response = await api.get("/api/finance-dashboard/statutory-employees", {
    params: {
      benefit,
      status,
      search: search || undefined,
      page,
      limit,
    },
    withCredentials: true,
  });

  return response.data;
}
