import api from "./api-template";

/* ================================
   GET all hiring needs
================================ */
export async function getHiringNeeds({
  page = 1,
  limit = 100,
  search = "",
  status = "",
} = {}) {
  try {
    const res = await api.get("/api/recruitment/hiring-needs", {
      params: {
        page,
        limit,
        search,
        status,
      },
      withCredentials: true,
    });

    const data = res.data;

    if (!data) {
      return {
        success: false,
        data: [],
        message: "Failed to load hiring needs.",
      };
    }

    return {
      success: true,
      data: Array.isArray(data) ? data : data.data || [],
      message: "Hiring needs loaded successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: [],
      message:
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to load hiring needs.",
      status: err.response?.status || 500,
    };
  }
}

/* ================================
   GET single hiring need
================================ */
export async function getHiringNeedById(id) {
  try {
    const res = await api.get(`/api/recruitment/hiring-needs/${id}`, {
      withCredentials: true,
    });

    const data = res.data;

    if (!data?.success && !data?.data) {
      return {
        success: false,
        data: null,
        message: "Failed to load hiring need.",
      };
    }

    return {
      success: true,
      data: data.data || data,
      message: "Hiring need loaded successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message:
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to load hiring need.",
      status: err.response?.status || 500,
    };
  }
}

/* ================================
   CREATE hiring need
================================ */
export async function createHiringNeed(payload) {
  try {
    const res = await api.post(
      "/api/recruitment/hiring-needs",
      payload,
      {
        withCredentials: true,
      }
    );

    const data = res.data;

    if (!data?.success && !data?.id) {
      return {
        success: false,
        data: null,
        message: data?.message || "Failed to create hiring need.",
      };
    }

    return {
      success: true,
      data: data,
      message: data.message || "Hiring need created successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message:
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to create hiring need.",
      errors: err.response?.data?.errors || [],
      status: err.response?.status || 500,
    };
  }
}

/* ================================
   UPDATE hiring need
================================ */
export async function updateHiringNeed(id, payload) {
  try {
    const res = await api.put(
      `/api/recruitment/hiring-needs/${id}`,
      payload,
      {
        withCredentials: true,
      }
    );

    const data = res.data;

    if (!data?.success) {
      return {
        success: false,
        data: null,
        message: data?.message || "Failed to update hiring need.",
      };
    }

    return {
      success: true,
      data: data,
      message: data.message || "Hiring need updated successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message:
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to update hiring need.",
      errors: err.response?.data?.errors || [],
      status: err.response?.status || 500,
    };
  }
}

/* ================================
   UPDATE hiring need status
================================ */
export async function updateHiringNeedStatus(id, status) {
  try {
    const res = await api.put(
      `/api/recruitment/hiring-needs/${id}/status`,
      { approval_status: status },
      {
        withCredentials: true,
      }
    );

    const data = res.data;

    if (!data?.success) {
      return {
        success: false,
        message: data?.message || "Failed to update status.",
      };
    }

    return {
      success: true,
      message: data.message || "Status updated successfully.",
    };
  } catch (err) {
    return {
      success: false,
      message:
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to update status.",
      status: err.response?.status || 500,
    };
  }
}

/* ================================
   DELETE hiring need
================================ */
export async function deleteHiringNeed(id) {
  try {
    const res = await api.delete(
      `/api/recruitment/hiring-needs/${id}`,
      {
        withCredentials: true,
      }
    );

    const data = res.data;

    if (!data?.success) {
      return {
        success: false,
        message: data?.message || "Failed to delete hiring need.",
      };
    }

    return {
      success: true,
      message: data.message || "Hiring need deleted successfully.",
    };
  } catch (err) {
    return {
      success: false,
      message:
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to delete hiring need.",
      status: err.response?.status || 500,
    };
  }
}

export async function getHiringNeedsJobDescriptions() {
  try {
    const res = await api.get("/api/recruitment/hiring-needs/job-descriptions", {
      withCredentials: true,
    });

    return {
      success: true,
      data: Array.isArray(res.data) ? res.data : res.data.data || [],
    };
  } catch (err) {
    return {
      success: false,
      data: [],
      message:
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to load job descriptions.",
    };
  }
}