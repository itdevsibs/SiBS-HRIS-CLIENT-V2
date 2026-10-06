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

export async function getDepartmentDirectoryData() {
  try {
    const [departmentsResponse, accountsResponse] = await Promise.all([
      api.get(`${BASE_PATH}/departments`, { withCredentials: true }),
      api.get(`${BASE_PATH}/accounts`, { withCredentials: true }),
    ]);

    return {
      departments: Array.isArray(departmentsResponse.data?.data)
        ? departmentsResponse.data.data
        : [],
      accounts: Array.isArray(accountsResponse.data?.data)
        ? accountsResponse.data.data
        : [],
    };
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to load Kronos departments and active accounts.",
      ),
    );
  }
}

export async function getDepartmentAccountEmployees(accountId) {
  const cleanAccountId = String(accountId ?? "").trim();

  if (!cleanAccountId) {
    return {
      employees: [],
      summary: { totalEmployees: 0, activeEmployees: 0, inactiveEmployees: 0 },
    };
  }

  try {
    const response = await api.get(
      `/api/departments/accounts/${encodeURIComponent(cleanAccountId)}/employees`,
      { withCredentials: true },
    );

    return {
      employees: Array.isArray(response.data?.data) ? response.data.data : [],
      summary: response.data?.summary || {
        totalEmployees: 0,
        activeEmployees: 0,
        inactiveEmployees: 0,
      },
    };
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Unable to load employees for this account."),
    );
  }
}

export async function getAccountLobs(accountId, { includeInactive = false } = {}) {
  const cleanAccountId = String(accountId ?? "").trim();
  if (!cleanAccountId) return { lobs: [], account: null };

  try {
    const response = await api.get(
      `/api/departments/accounts/${encodeURIComponent(cleanAccountId)}/lobs`,
      {
        params: includeInactive ? { includeInactive: 1 } : undefined,
        withCredentials: true,
      },
    );

    return {
      lobs: Array.isArray(response.data?.data) ? response.data.data : [],
      account: response.data?.account || null,
    };
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Unable to load Lines of Business for this account."),
    );
  }
}

export async function createAccountLob(accountId, payload = {}) {
  try {
    const response = await api.post(
      `/api/departments/accounts/${encodeURIComponent(accountId)}/lobs`,
      payload,
      { withCredentials: true },
    );
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to add Line of Business."));
  }
}

export async function updateAccountLob(lobId, payload = {}) {
  try {
    const response = await api.patch(
      `/api/departments/lobs/${encodeURIComponent(lobId)}`,
      payload,
      { withCredentials: true },
    );
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to update Line of Business."));
  }
}

export async function setAccountLobStatus(lobId, isActive) {
  try {
    const response = await api.patch(
      `/api/departments/lobs/${encodeURIComponent(lobId)}/status`,
      { isActive: Boolean(isActive) },
      { withCredentials: true },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Unable to change Line of Business status."),
    );
  }
}

export async function assignEmployeeLob(accountId, sibsId, lobIds) {
  const normalizedLobIds = Array.isArray(lobIds)
    ? lobIds.filter((value) => value !== null && value !== undefined && value !== "")
    : lobIds === null || lobIds === undefined || lobIds === ""
      ? []
      : [lobIds];

  try {
    const response = await api.put(
      `/api/departments/accounts/${encodeURIComponent(accountId)}/employees/${encodeURIComponent(sibsId)}/lob`,
      { lobIds: normalizedLobIds },
      { withCredentials: true },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Unable to update the employee LOB assignments."),
    );
  }
}
