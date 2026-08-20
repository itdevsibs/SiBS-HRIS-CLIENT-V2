import api from "./api-template";

function unwrapResponse(response) {
  return response?.data ?? response;
}

function getApiErrorMessage(error, fallback = "Request failed.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export async function getHiringNeeds() {
  try {
    const response = await api.get("/api/hiring-needs", {
      withCredentials: true,
    });

    return unwrapResponse(response);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch hiring needs."));
  }
}

export async function getHiringNeedJobDescriptions() {
  try {
    const response = await api.get("/api/hiring-needs/job-descriptions", {
      withCredentials: true,
    });

    return unwrapResponse(response);
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch job descriptions."),
    );
  }
}

export async function createHiringNeed(payload) {
  try {
    const isFormData =
      typeof FormData !== "undefined" && payload instanceof FormData;

    const response = await api.post("/api/hiring-needs", payload, {
      withCredentials: true,
      headers: isFormData
        ? {
            "Content-Type": "multipart/form-data",
          }
        : undefined,
    });

    return unwrapResponse(response);
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to create hiring need."),
    );
  }
}

export async function updateHiringNeedApproval(id, payload = {}) {
  try {
    const cleanId = String(id || "").trim();

    if (!cleanId) {
      throw new Error("Hiring need ID is required.");
    }

    const response = await api.post(
      `/api/hiring-needs/${encodeURIComponent(cleanId)}/approval`,
      {
        status: payload.status || payload.approvalStatus || "Approved",
        remarks: payload.remarks || payload.approvalRemarks || "",

        approvedBy:
          payload.approvedBy ||
          payload.approverName ||
          payload.approverSibsId ||
          "HR Admin",

        approverName:
          payload.approverName ||
          payload.approvedBy ||
          payload.approverSibsId ||
          "HR Admin",

        approverSibsId: payload.approverSibsId || "",
        approverRole: payload.approverRole || "",
        approverRoleName: payload.approverRoleName || "",
        approverAdminLevel: payload.approverAdminLevel ?? "",
        approverDepartment: payload.approverDepartment || "",
        approverAccount: payload.approverAccount || "",
        approverPosition: payload.approverPosition || "",
      },
      {
        withCredentials: true,
        skipAuthRedirect: true,
      },
    );

    return unwrapResponse(response);
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update hiring need approval."),
    );
  }
}

export async function relinkHiringNeedJobDescription(
  id,
  jobDescriptionId,
) {
  try {
    const cleanId = String(id || "").trim();
    const cleanJobDescriptionId = String(jobDescriptionId || "").trim();

    if (!cleanId) {
      throw new Error("Hiring need ID is required.");
    }

    if (!cleanJobDescriptionId) {
      throw new Error("Select an approved Job Description before relinking.");
    }

    const response = await api.patch(
      `/api/hiring-needs/${encodeURIComponent(cleanId)}/job-description`,
      {
        jobDescriptionId: cleanJobDescriptionId,
        job_description_id: cleanJobDescriptionId,
      },
      { withCredentials: true },
    );

    return unwrapResponse(response);
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Failed to relink the personnel requisition.",
      ),
    );
  }
}
