import api from "./api-template";

export async function getManagedEmployees({
  page = 1,
  search = "",
  limit = 15,
} = {}) {
  try {
    const response = await api.get("/api/resignation-management/employees", {
      params: {
        page,
        search,
        limit,
      },
    });

    return response.data;
  } catch (error) {
    console.error("GET MANAGED EMPLOYEES ERROR:", error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load employees under management.",
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        total: 0,
        limit,
      },
    };
  }
}

export async function getSupervisorResignations() {
  try {
    const response = await api.get("/api/resignation-management");

    return response.data;
  } catch (error) {
    console.error("GET SUPERVISOR RESIGNATIONS ERROR:", error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load resignation records.",
      data: [],
    };
  }
}

export async function getResignationCase({
  resignationId = "",
  employeeSibsId = "",
} = {}) {
  const cleanResignationId = String(resignationId || "").trim();
  const cleanEmployeeSibsId = String(employeeSibsId || "").trim();

  if (!cleanResignationId && !cleanEmployeeSibsId) {
    return {
      success: false,
      message: "A resignation ID or employee SIBS ID is required.",
      data: null,
    };
  }

  async function requestCase(params) {
    const response = await api.get("/api/resignation-management", { params });
    const payload = response.data || {};
    const rows = Array.isArray(payload.data) ? payload.data : [];

    return {
      ...payload,
      data: rows[0] || null,
    };
  }

  try {
    const primary = await requestCase({
      ...(cleanResignationId ? { resignationId: cleanResignationId } : {}),
      ...(cleanEmployeeSibsId ? { employeeSibsId: cleanEmployeeSibsId } : {}),
    });

    if (primary?.data || !cleanResignationId || !cleanEmployeeSibsId) {
      return primary;
    }

    // Older audit notifications can contain a stale/missing record ID.
    // Fall back to the employee's newest visible resignation case.
    return await requestCase({ employeeSibsId: cleanEmployeeSibsId });
  } catch (error) {
    console.error("GET RESIGNATION CASE ERROR:", error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load the selected resignation case.",
      data: null,
    };
  }
}

export async function saveSupervisorResignation(payload = {}) {
  try {
    const formData = new FormData();

    formData.append("employeeSibsId", payload.employeeSibsId || "");
    formData.append("employeeName", payload.employeeName || "");
    formData.append("resignationDate", payload.resignationDate || "");
    formData.append("lastWorkingDate", payload.lastWorkingDate || "");
    formData.append("resignationType", payload.resignationType || "");
    formData.append("reason", payload.reason || "");
    formData.append("remarks", payload.remarks || "");
    formData.append("specifyOthers", payload.specifyOthers || "");

    if (payload.uploadedFile) {
      formData.append("uploadedFile", payload.uploadedFile);
    }

    const response = await api.post("/api/resignation-management", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("SAVE SUPERVISOR RESIGNATION ERROR:", error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to submit resignation.",
    };
  }
}