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