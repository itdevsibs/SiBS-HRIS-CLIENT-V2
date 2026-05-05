import api from "./api-template";

export async function getMyResignations() {
  try {
    const res = await api.get("/api/resignation", {
      withCredentials: true,
    });

    const data = res.data;

    if (!data?.success) {
      return {
        success: false,
        data: [],
        message: data?.message || "Failed to load resignation records",
      };
    }

    return {
      success: true,
      data: data.data || [],
    };
  } catch (err) {
    return {
      success: false,
      data: [],
      message:
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to load resignation records",
      status: err.response?.status || 500,
    };
  }
}

export async function saveResignation(payload) {
  try {
    const formData = new FormData();

    formData.append("resignationType", payload.resignationType || "");
    formData.append("reason", payload.reason || "");
    formData.append("specifyOthers", payload.specifyOthers || "");
    formData.append("resignationDate", payload.resignationDate || "");
    formData.append("lastWorkingDate", payload.lastWorkingDate || "");
    formData.append("remarks", payload.remarks || "");

    if (payload.uploadedFile) {
      formData.append("uploadedFile", payload.uploadedFile);
    }

    const res = await api.post("/api/resignation/save", formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  } catch (err) {
    return {
      success: false,
      status: err.response?.status || 500,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to save resignation",
    };
  }
}

export async function getMyResignation(
  page = 1,
  limit = 25,
  search = "",
  status = "",
) {
  try {
    const res = await api.get("/api/resignation/my-list", {
      params: {
        page,
        limit,
        search,
        status,
      },
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    return {
      success: false,
      status: err.response?.status || 500,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to load resignation record",
    };
  }
}

export async function getEditResignationData(params) {
  try {
    const res = await api.get(`/api/resignation/my-data/${params.id}`, {
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    return {
      success: false,
      status: err.response?.status || 500,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to load resignation record",
    };
  }
}

export async function updateResignation(id, payload) {
  try {
    const res = await api.post(
      `/api/resignation/my-data/update/${id}`,
      {
        newLastWorkingDate: payload.newLastWorkingDate || "",
        reasonForExtending: payload.reasonForExtending || "",
      },
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    return {
      success: false,
      status: err.response?.status || 500,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to update resignation",
    };
  }
}

export async function retractResignation(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/resignation/my-data/retract/${id}`,
      {
        retractReason: payload.retractReason || "",
      },
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    return {
      success: false,
      status: err.response?.status || 500,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to retract resignation",
    };
  }
}
