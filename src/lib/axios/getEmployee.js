import api from "./api-template";

export async function getEmployee(page = 1, search = "") {
  try {
    const res = await api.get("/api/employees", {
      params: {
        page,
        search,
      },
      withCredentials: true,
    });

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || [],
      pagination: res.data?.pagination || {
        totalPages: 1,
        currentPage: 1,
        total: 0,
      },
      message: res.data?.message || "",
      status: res.status,
    };
  } catch (err) {
    console.error(
      "Axios getEmployee API error:",
      err?.response?.status,
      err?.message
    );

    return {
      success: false,
      data: [],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        total: 0,
      },
      message:
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to fetch employees",
      status: err.response?.status || 500,
      error: err,
    };
  }
}

export async function getEmployeeById(sibsId) {
  try {
    const res = await api.get(`/api/employees/${sibsId}`, {
      withCredentials: true,
    });

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || null,
      message: res.data?.message || "",
      status: res.status,
    };
  } catch (err) {
    console.error(
      "Axios getEmployeeById API error:",
      err?.response?.status,
      err?.message
    );

    return {
      success: false,
      data: null,
      message:
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to fetch employee",
      status: err.response?.status || 500,
      error: err,
    };
  }
}

export async function getSupervisorResignations() {
  try {
    const res = await api.get("/api/employees/supervisor/list", {
      withCredentials: true,
    });

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || [],
      message: res.data?.message || "",
      status: res.status,
    };
  } catch (error) {
    console.error(
      "Axios getSupervisorResignations API error:",
      error?.response?.status,
      error?.message
    );

    return {
      success: false,
      data: [],
      message:
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to load resignation records",
      status: error.response?.status || 500,
      error,
    };
  }
}

export async function updateSupervisorResignation({
  id,
  commentSpoken,
  commentRetain,
  employeeRetained,
}) {
  try {
    const res = await api.put(
      `/api/resignation/supervisor/${id}`,
      {
        commentSpoken,
        commentRetain,
        employeeRetained,
      },
      {
        withCredentials: true,
      }
    );

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || null,
      message: res.data?.message || "Resignation updated successfully",
      status: res.status,
    };
  } catch (error) {
    console.error(
      "Axios updateSupervisorResignation API error:",
      error?.response?.status,
      error?.response?.data || error?.message
    );

    return {
      success: false,
      data: null,
      message:
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to update resignation",
      status: error.response?.status || 500,
      error,
    };
  }
}

export async function getSupervisorAttritions() {
  try {
    const res = await api.get("/api/attrition", {
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.error(
      "GETSUPERVISORATTRITIONS ERROR:",
      err.response?.data || err.message
    );

    return {
      success: false,
      data: [],
      message:
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to load attritions",
      error: err,
      status: err.response?.status || 500,
    };
  }
}