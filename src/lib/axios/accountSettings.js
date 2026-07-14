import api from "./api-template";

const BASE_PATH = "/api/assigned-accounts";

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage
  );
}

function throwApiError(error, fallbackMessage) {
  const wrappedError = new Error(getErrorMessage(error, fallbackMessage));
  wrappedError.status = error?.response?.status || 500;
  wrappedError.response = error?.response;
  wrappedError.cause = error;
  throw wrappedError;
}

export async function getAccountSettingsSummary() {
  try {
    const response = await api.get(`${BASE_PATH}/summary`, {
      withCredentials: true,
    });

    return response.data?.data || {};
  } catch (error) {
    throwApiError(error, "Unable to load the account-access summary.");
  }
}

export async function getAccountSettingsUsers(params = {}) {
  try {
    const response = await api.get(`${BASE_PATH}/users`, {
      params,
      withCredentials: true,
    });

    return {
      data: Array.isArray(response.data?.data) ? response.data.data : [],
      accountOptions: Array.isArray(response.data?.accountOptions)
        ? response.data.accountOptions
        : [],
      departmentOptions: Array.isArray(response.data?.departmentOptions)
        ? response.data.departmentOptions
        : [],
      pagination: response.data?.pagination || {
        page: 1,
        limit: Number(params.limit || 10),
        total: 0,
        totalPages: 1,
      },
    };
  } catch (error) {
    throwApiError(error, "Unable to load assigned users.");
  }
}

export async function getAccountSettingsAccounts() {
  try {
    const response = await api.get(`${BASE_PATH}/accounts`, {
      withCredentials: true,
    });

    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    throwApiError(error, "Unable to load active Kronos accounts.");
  }
}

export async function getAccountSettingsDepartments() {
  try {
    const response = await api.get(`${BASE_PATH}/departments`, {
      withCredentials: true,
    });

    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    throwApiError(error, "Unable to load Kronos departments.");
  }
}

export async function searchAccountSettingsEmployees(search) {
  const keyword = String(search || "").trim();

  if (keyword.length < 2) {
    return [];
  }

  try {
    const response = await api.get(`${BASE_PATH}/employee-search`, {
      params: { search: keyword },
      withCredentials: true,
    });

    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    throwApiError(error, "Unable to search Kronos employees.");
  }
}

export async function createAccountSettingsUser(payload) {
  try {
    const response = await api.post(`${BASE_PATH}/users`, payload, {
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    throwApiError(error, "Unable to add user account access.");
  }
}

export async function updateAccountSettingsUser(id, payload) {
  try {
    const response = await api.put(`${BASE_PATH}/users/${id}`, payload, {
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    throwApiError(error, "Unable to update user account access.");
  }
}

export async function deleteAccountSettingsUser(id) {
  try {
    const response = await api.delete(`${BASE_PATH}/users/${id}`, {
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    throwApiError(error, "Unable to remove user account access.");
  }
}
