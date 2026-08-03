import api from "./api-template";

function unwrapResponse(response) {
  return response?.data ?? response;
}

function getErrorMessage(err, fallback) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
}

function errorResponse(err, fallback, data = null) {
  return {
    success: false,
    data,
    candidate: null,
    message: getErrorMessage(err, fallback),
  };
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function isApprovedHiringNeed(item = {}) {
  const approvalStatus = cleanText(
    item.approval_status ||
      item.approvalStatus ||
      item.status ||
      item.hiringNeedStatus,
  ).toLowerCase();

  return approvalStatus === "approved";
}

function normalizeHiringNeed(item = {}) {
  return {
    ...item,
    id: item.id,

    account: item.account || "",
    accountName: item.accountName || item.account_name || item.account || "",
    account_name: item.account_name || item.accountName || item.account || "",

    department: item.department || "",
    departmentName:
      item.departmentName || item.department_name || item.department || "",
    department_name:
      item.department_name || item.departmentName || item.department || "",

    role_title: item.role_title || item.roleTitle || "",
    roleTitle: item.roleTitle || item.role_title || "",

    job_description_id: item.job_description_id ?? item.jobDescriptionId ?? "",
    jobDescriptionId: item.jobDescriptionId ?? item.job_description_id ?? "",

    jd_status: item.jd_status || item.jdStatus || "",
    jdStatus: item.jdStatus || item.jd_status || "",

    approved_requirement:
      item.approved_requirement ?? item.approvedRequirement ?? "",
    approvedRequirement:
      item.approvedRequirement ?? item.approved_requirement ?? "",

    reason: item.reason || "",

    requested_start_date:
      item.requested_start_date || item.requestedStartDate || "",
    requestedStartDate:
      item.requestedStartDate || item.requested_start_date || "",

    due_date: item.due_date || item.dueDate || "",
    dueDate: item.dueDate || item.due_date || "",

    hiring_manager: item.hiring_manager || item.hiringManager || "",
    hiringManager: item.hiringManager || item.hiring_manager || "",

    priority: item.priority || "",

    location_site: item.location_site || item.locationSite || "",
    locationSite: item.locationSite || item.location_site || "",

    approval_status: item.approval_status || item.approvalStatus || "",
    approvalStatus: item.approvalStatus || item.approval_status || "",

    approval_remarks: item.approval_remarks || item.approvalRemarks || "",
    approvalRemarks: item.approvalRemarks || item.approval_remarks || "",

    approved_by: item.approved_by || item.approvedBy || "",
    approvedBy: item.approvedBy || item.approved_by || "",

    approval_date: item.approval_date || item.approvalDate || "",
    approvalDate: item.approvalDate || item.approval_date || "",

    created_at: item.created_at || item.createdAt || "",
    createdAt: item.createdAt || item.created_at || "",

    updated_at: item.updated_at || item.updatedAt || "",
    updatedAt: item.updatedAt || item.updated_at || "",
  };
}

export async function getApprovedHiringNeeds() {
  try {
    const response = await api.get("/api/hiring-needs", {
      withCredentials: true,
    });

    const payload = unwrapResponse(response);

    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.hiringNeeds)
          ? payload.hiringNeeds
          : Array.isArray(payload?.rows)
            ? payload.rows
            : Array.isArray(payload?.items)
              ? payload.items
              : [];

    const approvedRows = rows
      .map(normalizeHiringNeed)
      .filter(isApprovedHiringNeed);

    return {
      success: true,
      data: approvedRows,
      hiringNeeds: approvedRows,
      rows: approvedRows,
    };
  } catch (err) {
    console.error(
      "Axios getApprovedHiringNeeds API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: [],
      hiringNeeds: [],
      rows: [],
      message: getErrorMessage(err, "Failed to fetch approved hiring needs."),
    };
  }
}

export async function getCandidatePipelineCandidates(params = {}) {
  try {
    const res = await api.get("/api/candidate-pipeline", {
      params: {
        _t: Date.now(),
        ...params,
      },
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios getCandidatePipelineCandidates API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: [],
      candidates: [],
      stageCounts: {},
      metrics: {},
      message: getErrorMessage(err, "Failed to load candidate pipeline."),
    };
  }
}

export async function getCandidatePipelineCandidate(id) {
  try {
    const res = await api.get(`/api/candidate-pipeline/${id}`, {
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios getCandidatePipelineCandidate API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return errorResponse(err, "Failed to load candidate.");
  }
}

export async function updateCandidatePipelineCandidate(id, payload = {}) {
  try {
    const res = await api.patch(`/api/candidate-pipeline/${id}`, payload, {
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios updateCandidatePipelineCandidate API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return errorResponse(err, "Failed to update candidate.");
  }
}

export async function moveCandidatePipelineStage(id, payload = {}) {
  try {
    const res = await api.post(`/api/candidate-pipeline/${id}/move`, payload, {
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios moveCandidatePipelineStage API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return errorResponse(err, "Failed to move candidate.");
  }
}

export async function updateCandidatePipelinePrfStatus(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/prf-status`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios updateCandidatePipelinePrfStatus API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return errorResponse(err, "Failed to update PRF status.");
  }
}

export async function proceedCandidatePipelineInitialScreening(
  id,
  payload = {},
) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${encodeURIComponent(id)}/initial-screening/proceed`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios proceedCandidatePipelineInitialScreening API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return errorResponse(
      err,
      "Failed to proceed with initial screening.",
    );
  }
}

export async function resendCandidatePipelineAssessmentEmail(
  id,
  payload = {},
) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${encodeURIComponent(id)}/assessment/send-email`,
      {
        ...payload,
        resend: true,
      },
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios resendCandidatePipelineAssessmentEmail API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return errorResponse(err, "Failed to resend assessment email.");
  }
}

export async function scheduleCandidatePipelineInterview(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/schedule-interview`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios scheduleCandidatePipelineInterview API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return errorResponse(err, "Failed to schedule interview.");
  }
}

export async function startCandidatePipelineInterview(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/interview/start`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios startCandidatePipelineInterview API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return errorResponse(err, "Failed to start interview.");
  }
}

export async function completeCandidatePipelineInterview(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/interview/complete`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios completeCandidatePipelineInterview API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return errorResponse(err, "Failed to complete interview.");
  }
}

export async function cancelCandidatePipelineInterview(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/interview/cancel`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios cancelCandidatePipelineInterview API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return errorResponse(err, "Failed to cancel interview.");
  }
}

export async function saveCandidatePipelineInterviewNotes(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/interview/notes`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios saveCandidatePipelineInterviewNotes API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return errorResponse(err, "Failed to save interview notes.");
  }
}

export async function sendCandidatePipelineAssessmentEmail(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/assessment/send-email`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios sendCandidatePipelineAssessmentEmail API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return errorResponse(err, "Failed to send assessment email.");
  }
}

export async function saveCandidatePipelineAssessment(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/assessment`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios saveCandidatePipelineAssessment API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return errorResponse(err, "Failed to save assessment.");
  }
}

export async function dropOffCandidatePipelineCandidate(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/drop-off`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios dropOffCandidatePipelineCandidate API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return errorResponse(err, "Failed to mark candidate as drop-off.");
  }
}

export async function resendCandidatePipelineDropOffEmail(id) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${encodeURIComponent(id)}/drop-off-email/resend`,
      {},
      { withCredentials: true },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios resendCandidatePipelineDropOffEmail API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return errorResponse(err, "Failed to resend the Drop-off email.");
  }
}

export async function saveCandidatePipelineOffer(id, payload = {}) {
  try {
    const res = await api.post(`/api/candidate-pipeline/${id}/offer`, payload, {
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios saveCandidatePipelineOffer API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return errorResponse(err, "Failed to save offer details.");
  }
}

export async function updateCandidatePipelineOfferApproval(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/offer-approval`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios updateCandidatePipelineOfferApproval API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return errorResponse(err, "Failed to update offer approval.");
  }
}

export async function sendCandidatePipelineOfferEmail(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/offer-send-email`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios sendCandidatePipelineOfferEmail API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return errorResponse(err, "Failed to send offer email.");
  }
}

export async function saveCandidatePipelineOfferDecision(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/offer-decision`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios saveCandidatePipelineOfferDecision API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return errorResponse(err, "Failed to save offer decision.");
  }
}


export async function getCandidatePipelineNhoFiles(id) {
  try {
    const res = await api.get(
      `/api/candidate-pipeline/${encodeURIComponent(
        id,
      )}/nho/files`,
      {
        withCredentials: true,
        params: {
          _t: Date.now(),
        },
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios getCandidatePipelineNhoFiles API error:",
      err?.response?.status,
      err?.response?.data ||
        err?.message,
    );

    return errorResponse(
      err,
      "Failed to load pre-employment files.",
      {
        files: [],
      },
    );
  }
}

export async function saveCandidatePipelineNhoFiles(
  id,
  formData,
) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${encodeURIComponent(
        id,
      )}/nho/files`,
      formData,
      {
        withCredentials: true,
        timeout: 90000,
        headers: {
          "Content-Type": undefined,
        },
        transformRequest: [
          (data, headers) => {
            if (headers?.delete) {
              headers.delete("Content-Type");
            } else if (headers) {
              delete headers["Content-Type"];
              delete headers["content-type"];
            }

            return data;
          },
        ],
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios saveCandidatePipelineNhoFiles API error:",
      err?.response?.status,
      err?.response?.data ||
        err?.message,
    );

    return errorResponse(
      err,
      "Failed to save pre-employment files.",
      {
        files: [],
      },
    );
  }
}

export async function scheduleCandidatePipelineNho(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/nho/schedule`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios scheduleCandidatePipelineNho API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return errorResponse(err, "Failed to schedule NHO.");
  }
}

const candidatePipelineApi = {
  getApprovedHiringNeeds,
  getCandidatePipelineCandidates,
  getCandidatePipelineCandidate,
  updateCandidatePipelineCandidate,
  moveCandidatePipelineStage,
  updateCandidatePipelinePrfStatus,
  proceedCandidatePipelineInitialScreening,
  resendCandidatePipelineAssessmentEmail,
  scheduleCandidatePipelineInterview,
  startCandidatePipelineInterview,
  completeCandidatePipelineInterview,
  cancelCandidatePipelineInterview,
  saveCandidatePipelineInterviewNotes,
  sendCandidatePipelineAssessmentEmail,
  saveCandidatePipelineAssessment,
  dropOffCandidatePipelineCandidate,
  resendCandidatePipelineDropOffEmail,
  saveCandidatePipelineOffer,
  updateCandidatePipelineOfferApproval,
  sendCandidatePipelineOfferEmail,
  saveCandidatePipelineOfferDecision,
  getCandidatePipelineNhoFiles,
  saveCandidatePipelineNhoFiles,
  scheduleCandidatePipelineNho,
};

export default candidatePipelineApi;