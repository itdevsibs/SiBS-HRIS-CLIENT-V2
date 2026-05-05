import api from "./api-template";

export async function getMyAttritions(page = 1, search = "") {
  try {
    const res = await api.get("/api/attrition", {
      params: {
        page,
        search,
      },
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    console.error("GET MY ATTRITIONS ERROR:", error);

    return {
      success: false,
      data: [],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        total: 0,
      },
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load attrition records",
      status: error?.response?.status || 500,
    };
  }
}

export async function saveAttrition({
  employeeSibsId,
  reason,
  specifyOthers,
  uploadedFile,
  attritionDate,
  lastWorkingDate,
  remarks,
}) {
  try {
    const formData = new FormData();

    formData.append("employeeSibsId", employeeSibsId || "");
    formData.append("reason", reason || "");
    formData.append("specifyOthers", specifyOthers || "");
    formData.append("attritionDate", attritionDate || "");
    formData.append("lastWorkingDate", lastWorkingDate || "");
    formData.append("remarks", remarks || "");

    if (uploadedFile) {
      formData.append("uploadedFile", uploadedFile);
    }

    const res = await api.post("/api/attrition", formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  } catch (error) {
    console.error("SAVE ATTRITION ERROR:", error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to submit attrition",
    };
  }
}

export async function updateAttrition(id, payload) {
  try {
    const res = await api.put(
      `/api/attrition/${id}`,
      {
        employeeSibsId: payload.employeeSibsId || "",

        tlIsApproved: Number(payload.tlIsApproved ?? 0),
        tlIsDeclined: Number(payload.tlIsDeclined ?? 0),
        tlRemarks: payload.tlRemarks || "",

        omIsApproved: Number(payload.omIsApproved ?? 0),
        omIsDeclined: Number(payload.omIsDeclined ?? 0),
        omRemarks: payload.omRemarks || "",

        somIsApproved: Number(payload.somIsApproved ?? 0),
        somIsDeclined: Number(payload.somIsDeclined ?? 0),
        somRemarks: payload.somRemarks || "",
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return res.data;
  } catch (error) {
    return {
      success: false,
      message:
        error?.response?.data?.message || "Failed to update attrition.",
    };
  }
}