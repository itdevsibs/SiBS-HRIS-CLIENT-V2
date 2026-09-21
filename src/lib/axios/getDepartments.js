import api from "./api-template";

export async function getDepartments({ page = 1, limit = 6, search = "", status = "all" } = {}) {
  const response = await api.get("/api/departments", {
    params: {
      page,
      limit,
      search: String(search || "").trim() || undefined,
      status: status === "all" ? undefined : status,
    },
    withCredentials: true,
  });

  return response.data;
}

export async function getDepartmentDetails(departmentId) {
  const response = await api.get(`/api/departments/${departmentId}`, {
    withCredentials: true,
  });

  return response.data;
}
