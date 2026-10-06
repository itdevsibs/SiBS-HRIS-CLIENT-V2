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

function getDepartmentErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export async function createDepartmentRequest(departmentName) {
  try {
    const response = await api.post(
      "/api/departments",
      { departmentName },
      { withCredentials: true },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getDepartmentErrorMessage(error, "Failed to submit department request."),
    );
  }
}

export async function getDepartmentApprovalRequests() {
  try {
    const response = await api.get("/api/departments/approval-requests", {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      getDepartmentErrorMessage(
        error,
        "Failed to load pending department requests.",
      ),
    );
  }
}

export async function getDepartmentApprovalAccess() {
  try {
    const response = await api.get("/api/departments/approval-access", {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      getDepartmentErrorMessage(error, "Failed to check Department approval access."),
    );
  }
}

export async function approveDepartmentRequest(departmentId, notes = "") {
  try {
    const response = await api.post(
      `/api/departments/${encodeURIComponent(departmentId)}/approve`,
      { notes },
      { withCredentials: true },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getDepartmentErrorMessage(error, "Failed to approve department request."),
    );
  }
}

export async function rejectDepartmentRequest(departmentId, notes) {
  try {
    const response = await api.post(
      `/api/departments/${encodeURIComponent(departmentId)}/reject`,
      { notes },
      { withCredentials: true },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getDepartmentErrorMessage(error, "Failed to reject department request."),
    );
  }
}
