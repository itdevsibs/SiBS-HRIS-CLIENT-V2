import api from "./api-template";

/* =========================================
   AVAILABLE POSITION API
========================================= */

function normalizeApiError(err, fallbackMessage) {
  return {
    success: false,
    data: null,
    message:
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      fallbackMessage,
  };
}

export async function getAvailablePositionMeta() {
  try {
    const res = await api.get("/api/available-position/meta", {
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios getAvailablePositionMeta API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: {
        statusOptions: [],
        departments: [],
        accounts: [],
      },
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load available position metadata.",
    };
  }
}

export async function getAvailablePositions({
  page = 1,
  limit = 500,
  search = "",
  status = "All",
  departmentId = "All",
  accountId = "All",
} = {}) {
  try {
    const res = await api.get("/api/available-position", {
      params: {
        page,
        limit,
        search,
        status,
        departmentId,
        accountId,
      },
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios getAvailablePositions API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: [],
      counts: {
        total: 0,
      },
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 1,
      },
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load available positions.",
    };
  }
}

export async function getActiveAvailablePositions() {
  try {
    const res = await api.get("/api/available-position/active", {
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios getActiveAvailablePositions API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: [],
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load active available positions.",
    };
  }
}

export async function getAvailablePositionById(id) {
  try {
    const res = await api.get(`/api/available-position/${id}`, {
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios getAvailablePositionById API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return normalizeApiError(err, "Failed to load available position.");
  }
}

export async function createAvailablePosition(payload) {
  try {
    const res = await api.post("/api/available-position", payload, {
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios createAvailablePosition API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return normalizeApiError(err, "Failed to save available position.");
  }
}

export async function updateAvailablePosition(id, payload) {
  try {
    const res = await api.put(`/api/available-position/${id}`, payload, {
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios updateAvailablePosition API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return normalizeApiError(err, "Failed to update available position.");
  }
}

export async function updateAvailablePositionStatus(id, payload) {
  try {
    const res = await api.patch(`/api/available-position/${id}/status`, payload, {
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios updateAvailablePositionStatus API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return normalizeApiError(
      err,
      "Failed to update available position status.",
    );
  }
}

export async function deleteAvailablePosition(id, payload = {}) {
  try {
    const res = await api.delete(`/api/available-position/${id}`, {
      data: payload,
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios deleteAvailablePosition API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return normalizeApiError(err, "Failed to archive available position.");
  }
}

export default {
  getAvailablePositionMeta,
  getAvailablePositions,
  getActiveAvailablePositions,
  getAvailablePositionById,
  createAvailablePosition,
  updateAvailablePosition,
  updateAvailablePositionStatus,
  deleteAvailablePosition,
};