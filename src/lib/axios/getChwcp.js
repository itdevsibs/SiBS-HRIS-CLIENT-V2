import api from "./api-template";

function getApiErrorMessage(error, fallback = "Request failed.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export async function getChwcpRequests(params = {}) {
  try {
    const response = await api.get("/api/chwcp/requests", {
      params: {
        page: params.page || 1,
        limit: params.limit || 25,
        search: params.search || "",
        stage: params.stage || "all",
        _t: Date.now(),
      },
      withCredentials: true,
    });

    const rows = Array.isArray(response.data?.data) ? response.data.data : [];

    return {
      success: Boolean(response.data?.success ?? true),
      data: rows,
      summary: response.data?.summary || { totalVisible: rows.length },
      pagination: response.data?.pagination || {
        page: params.page || 1,
        currentPage: params.page || 1,
        limit: params.limit || 25,
        total: rows.length,
        totalPages: 1,
      },
      access: response.data?.access || {
        canViewAll: false,
        scope: "personal",
      },
      filters: response.data?.filters || {},
      message: response.data?.message || "CHWCP requests loaded.",
    };
  } catch (error) {
    const wrappedError = new Error(
      getApiErrorMessage(error, "Failed to load CHWCP requests."),
    );

    wrappedError.status = error?.response?.status;
    wrappedError.response = error?.response;
    throw wrappedError;
  }
}

export async function getChwcpRequestDetails(requestId) {
  const normalizedRequestId = String(requestId || "").trim();

  if (!normalizedRequestId) {
    throw new Error("CHWCP request ID is required.");
  }

  try {
    const response = await api.get(
      `/api/chwcp/requests/${encodeURIComponent(normalizedRequestId)}`,
      {
        params: {
          _t: Date.now(),
        },
        withCredentials: true,
      },
    );

    return {
      success: Boolean(response.data?.success ?? true),
      data: response.data?.data || null,
      access: response.data?.access || {
        canViewAll: false,
        scope: "personal",
      },
      message: response.data?.message || "CHWCP request details loaded.",
    };
  } catch (error) {
    const wrappedError = new Error(
      getApiErrorMessage(error, "Failed to load CHWCP request details."),
    );

    wrappedError.status = error?.response?.status;
    wrappedError.response = error?.response;
    throw wrappedError;
  }
}

export async function getMyChwcpCoverage() {
  try {
    const response = await api.get("/api/chwcp/me/coverage", {
      params: {
        _t: Date.now(),
      },
      withCredentials: true,
    });

    return {
      success: Boolean(response.data?.success ?? true),
      data: response.data?.data || null,
      message: response.data?.message || "CHWCP coverage loaded.",
    };
  } catch (error) {
    const wrappedError = new Error(
      getApiErrorMessage(error, "Failed to load CHWCP coverage."),
    );

    wrappedError.status = error?.response?.status;
    wrappedError.response = error?.response;
    throw wrappedError;
  }
}

export async function getEmployeeChwcpCoverage(sibsId) {
  const normalizedSibsId = String(sibsId || "").trim();

  if (!normalizedSibsId) {
    throw new Error("Employee SIBS ID is required.");
  }

  try {
    const response = await api.get(
      `/api/chwcp/employees/${encodeURIComponent(normalizedSibsId)}/coverage`,
      {
        params: {
          _t: Date.now(),
        },
        withCredentials: true,
      },
    );

    return {
      success: Boolean(response.data?.success ?? true),
      data: response.data?.data || null,
      message: response.data?.message || "Employee CHWCP coverage loaded.",
    };
  } catch (error) {
    const wrappedError = new Error(
      getApiErrorMessage(error, "Failed to load employee CHWCP coverage."),
    );

    wrappedError.status = error?.response?.status;
    wrappedError.response = error?.response;
    throw wrappedError;
  }
}
