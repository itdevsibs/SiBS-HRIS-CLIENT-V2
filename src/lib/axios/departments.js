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
    return [];
  }

  try {
    const response = await api.get(
      `${BASE_PATH}/accounts/${encodeURIComponent(cleanAccountId)}/employees`,
      { withCredentials: true },
    );

    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Unable to load active employees for this account."),
    );
  }
}
