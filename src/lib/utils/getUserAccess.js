import api from "../axios/api-template";

function getErrorResponse(err, fallbackMessage = "An error occurred") {
  return {
    success: false,
    status: err?.response?.status || 500,
    message:
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      fallbackMessage,
  };
}

function normalizeAccountIds(payload = {}) {
  if (Array.isArray(payload.accountIds) && payload.accountIds.length > 0) {
    return payload.accountIds
      .map((accountId) => String(accountId || "").trim())
      .filter(Boolean);
  }

  if (Array.isArray(payload.accounts) && payload.accounts.length > 0) {
    return payload.accounts
      .map((accountId) => String(accountId || "").trim())
      .filter(Boolean);
  }

  if (payload.accountId) {
    return [String(payload.accountId).trim()].filter(Boolean);
  }

  return [];
}

export async function getUserAccess(page = 1, search = "") {
  try {
    const res = await api.get("/api/assigned-accounts/users", {
      params: {
        page,
        search,
      },
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios getUserAccess API Error:",
      err?.response?.status,
      err?.message
    );

    return getErrorResponse(err, "Failed to fetch user access records.");
  }
}

export async function searchUserAccessEmployees(search = "") {
  try {
    const res = await api.get("/api/assigned-accounts/employee-search", {
      params: {
        search,
      },
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios searchUserAccessEmployees API Error:",
      err?.response?.status,
      err?.message
    );

    return getErrorResponse(err, "Failed to search employees.");
  }
}

export async function addUserAccess(payload = {}) {
  try {
    const accountIds = normalizeAccountIds(payload);

    const cleanPayload = {
      gyEmpId: payload.gyEmpId,
      sibsId: payload.sibsId,
      accountId: accountIds[0] || payload.accountId || "",
      accountIds,
      departmentId: payload.departmentId,
      adminAccess: payload.adminAccess,
    };

    const res = await api.post("/api/assigned-accounts/users", cleanPayload);

    return res.data;
  } catch (err) {
    console.error(
      "Axios addUserAccess API Error:",
      err?.response?.status,
      err?.message
    );

    return getErrorResponse(err, "Failed to add user access.");
  }
}

export async function updateUserAccess(id, payload = {}) {
  try {
    const accountIds = normalizeAccountIds(payload);

    const cleanPayload = {
      adminAccess: payload.adminAccess,
      status: payload.status,
      departmentId: payload.departmentId,
      accountId: accountIds[0] || payload.accountId || "",
      accountIds,
    };

    const res = await api.put(
      `/api/assigned-accounts/users/${id}`,
      cleanPayload
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios updateUserAccess API Error:",
      err?.response?.status,
      err?.message
    );

    return getErrorResponse(err, "Failed to update user access.");
  }
}

export async function deleteUserAccess(id) {
  try {
    const res = await api.delete(`/api/assigned-accounts/users/${id}`);

    return res.data;
  } catch (err) {
    console.error(
      "Axios deleteUserAccess API Error:",
      err?.response?.status,
      err?.message
    );

    return getErrorResponse(err, "Failed to delete user access.");
  }
}