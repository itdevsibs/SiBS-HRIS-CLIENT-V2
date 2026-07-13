import api from "./api-template";

const BASE_PATH = "/api/available-position-approval-settings";

function getResponseData(response) {
  return response?.data ?? response;
}

function getApiError(error, fallbackMessage) {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage;

  const wrappedError = new Error(message);

  wrappedError.status = error?.response?.status;
  wrappedError.data = error?.response?.data;

  return wrappedError;
}

export async function getAvailablePositionApprovalUsers() {
  try {
    const response = await api.get(`${BASE_PATH}/users`, {
      withCredentials: true,
    });

    return getResponseData(response);
  } catch (error) {
    throw getApiError(
      error,
      "Failed to load Available Position approval users.",
    );
  }
}

export async function searchAvailablePositionApprovalEmployees(search = "") {
  try {
    const response = await api.get(`${BASE_PATH}/employees`, {
      params: {
        search: String(search || "").trim(),
      },
      withCredentials: true,
    });

    return getResponseData(response);
  } catch (error) {
    throw getApiError(
      error,
      "Failed to search employees for Available Position approval.",
    );
  }
}

export async function addAvailablePositionApprovalUser(payload = {}) {
  try {
    const response = await api.post(`${BASE_PATH}/users`, payload, {
      withCredentials: true,
    });

    return getResponseData(response);
  } catch (error) {
    throw getApiError(
      error,
      "Failed to add the Available Position approval user.",
    );
  }
}

export async function removeAvailablePositionApprovalUser(sibsId) {
  const cleanSibsId = String(sibsId || "").trim();

  if (!cleanSibsId) {
    throw new Error("SIBS ID is required to remove an approval user.");
  }

  try {
    const response = await api.delete(
      `${BASE_PATH}/users/${encodeURIComponent(cleanSibsId)}`,
      {
        withCredentials: true,
      },
    );

    return getResponseData(response);
  } catch (error) {
    throw getApiError(
      error,
      "Failed to remove the Available Position approval user.",
    );
  }
}