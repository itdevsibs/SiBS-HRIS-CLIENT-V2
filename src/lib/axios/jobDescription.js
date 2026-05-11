import api from "./api-template";

/* ================================
   GET dropdowns
================================ */
export async function getJobDescriptionDropdowns() {
  try {
    const res = await api.get("/api/job-description/dropdowns", {
      withCredentials: true,
    });

    const data = res.data;

    if (!data?.success) {
      return {
        success: false,
        accounts: [],
        departments: [],
        requestedByUsers: [],
        message: data?.message || "Failed to load dropdowns.",
      };
    }

    return {
      success: true,
      accounts: data.data?.accounts || [],
      departments: data.data?.departments || [],
      requestedByUsers: data.data?.requestedByUsers || [],
    };
  } catch (err) {
    return {
      success: false,
      accounts: [],
      departments: [],
      requestedByUsers: [],
      message:
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to load dropdowns.",
      status: err.response?.status || 500,
    };
  }
}

/* ================================
   GET job descriptions
================================ */
export async function getJobDescriptions({
  page = 1,
  limit = 100,
  search = "",
  status = "",
} = {}) {
  try {
    const res = await api.get("/api/job-description/get-job-description", {
      params: {
        page,
        limit,
        search,
        status,
      },
      withCredentials: true,
    });

    const data = res.data;

    if (!data?.success) {
      return {
        success: false,
        data: [],
        pagination: null,
        message: data?.message || "Failed to load job descriptions.",
      };
    }

    return {
      success: true,
      data: data.data || [],
      pagination: data.pagination || null,
      message: data.message || "Job descriptions loaded successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: [],
      pagination: null,
      message:
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to load job descriptions.",
      status: err.response?.status || 500,
    };
  }
}

/* ================================
   GET single job description
================================ */
export async function getJobDescriptionById(id) {
  try {
    const res = await api.get(`/api/job-description/${id}`, {
      withCredentials: true,
    });

    const data = res.data;

    if (!data?.success) {
      return {
        success: false,
        data: null,
        message: data?.message || "Failed to load job description.",
      };
    }

    return {
      success: true,
      data: data.data || null,
      message: data.message || "Job description loaded successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message:
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to load job description.",
      status: err.response?.status || 500,
    };
  }
}

/* ================================
   CREATE job description
================================ */
export async function createJobDescription(payload) {
  try {
    const res = await api.post("/api/job-description", payload, {
      withCredentials: true,
    });

    const data = res.data;

    if (!data?.success) {
      return {
        success: false,
        data: null,
        message: data?.message || "Failed to create job description.",
      };
    }

    return {
      success: true,
      data: data.data,
      message: data.message || "Job description created successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message:
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to create job description.",
      errors: err.response?.data?.errors || [],
      status: err.response?.status || 500,
    };
  }
}

/* ================================
   UPDATE job description
================================ */
export async function updateJobDescription(id, payload) {
  try {
    const res = await api.put(`/api/job-description/${id}`, payload, {
      withCredentials: true,
    });

    const data = res.data;

    if (!data?.success) {
      return {
        success: false,
        data: null,
        message: data?.message || "Failed to update job description.",
      };
    }

    return {
      success: true,
      data: data.data,
      message: data.message || "Job description updated successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message:
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to update job description.",
      errors: err.response?.data?.errors || [],
      status: err.response?.status || 500,
    };
  }
}

/* ================================
   SAVE revision and tag as Existing
================================ */
export async function saveJobDescriptionRevision(id, payload) {
  try {
    const res = await api.put(`/api/job-description/${id}/revision`, payload, {
      withCredentials: true,
    });

    const data = res.data;

    if (!data?.success) {
      return {
        success: false,
        data: null,
        message: data?.message || "Failed to save job description revision.",
      };
    }

    return {
      success: true,
      data: data.data,
      message: data.message || "Job description revision saved successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message:
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to save job description revision.",
      errors: err.response?.data?.errors || [],
      status: err.response?.status || 500,
    };
  }
}

/* ================================
   DELETE job description
================================ */
export async function deleteJobDescription(id) {
  try {
    const res = await api.delete(`/api/job-description/${id}`, {
      withCredentials: true,
    });

    const data = res.data;

    if (!data?.success) {
      return {
        success: false,
        message: data?.message || "Failed to delete job description.",
      };
    }

    return {
      success: true,
      message: data.message || "Job description deleted successfully.",
    };
  } catch (err) {
    return {
      success: false,
      message:
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to delete job description.",
      status: err.response?.status || 500,
    };
  }
}
