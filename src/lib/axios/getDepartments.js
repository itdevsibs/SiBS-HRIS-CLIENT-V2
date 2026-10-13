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

// Only HR Admin and Super Admin can retrieve approved department choices
// and create accounts through these protected HRIS routes.
export async function getAccountCreationDepartments() {
  try {
    const response = await api.get("/api/departments/account-creation-departments", {
      withCredentials: true,
    });
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    throw new Error(getDepartmentErrorMessage(error, "Failed to load approved departments."));
  }
}

export async function createDepartmentAccount({ departmentId, accountName, ghlName = "" }) {
  try {
    const response = await api.post(
      "/api/departments/accounts",
      { departmentId, accountName, ghlName },
      { withCredentials: true },
    );
    return response.data;
  } catch (error) {
    throw new Error(getDepartmentErrorMessage(error, "Failed to create account."));
  }
}

// Account requests do not enter sibs_accounts until an approved reviewer acts.
export async function getAccountApprovalRequests() {
  try {
    const response = await api.get("/api/departments/account-approval-requests", { withCredentials: true });
    return response.data;
  } catch (error) {
    throw new Error(getDepartmentErrorMessage(error, "Failed to load pending Account requests."));
  }
}

export async function approveAccountRequest(requestId, notes = "") {
  try {
    const response = await api.post(
      `/api/departments/account-approval-requests/${encodeURIComponent(requestId)}/approve`,
      { notes }, { withCredentials: true },
    );
    return response.data;
  } catch (error) {
    throw new Error(getDepartmentErrorMessage(error, "Failed to approve Account request."));
  }
}

export async function rejectAccountRequest(requestId, notes = "") {
  try {
    const response = await api.post(
      `/api/departments/account-approval-requests/${encodeURIComponent(requestId)}/reject`,
      { notes }, { withCredentials: true },
    );
    return response.data;
  } catch (error) {
    throw new Error(getDepartmentErrorMessage(error, "Failed to reject Account request."));
  }
}
