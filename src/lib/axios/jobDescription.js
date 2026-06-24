import { data } from "react-router-dom";
import api from "./api-template";

function getApiErrorMessage(err, fallback) {
  return (
    err.response?.data?.message ||
    err.response?.data?.error ||
    err.message ||
    fallback
  );
}

function normalizeJdStatus(status) {
  if (status === "New JD") return "New Job Description";
  return status || "New Job Description";
}

function safeParseJson(value, fallback = []) {
  if (Array.isArray(value)) return value;

  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value);
    return parsed || fallback;
  } catch {
    return fallback;
  }
}

export function normalizeJobDescriptionResponseItem(item) {
  if (!item) return null;

  const revisionHistory = Array.isArray(item.revisionHistory)
    ? item.revisionHistory
    : Array.isArray(item.revisions)
      ? item.revisions
      : safeParseJson(item.revision_history_json, []);

  return {
    ...item,

    id: item.id,

    jdCode: item.jdCode || item.jd_code || "",

    existingJdId:
      item.existingJdId ||
      item.existing_jd_id ||
      item.linkedHiringRequirement ||
      item.linked_hiring_requirement ||
      "",

    linkedHiringRequirement:
      item.linkedHiringRequirement ||
      item.linked_hiring_requirement ||
      item.existingJdId ||
      item.existing_jd_id ||
      "",

    documentTitle:
      item.documentTitle ||
      item.document_title ||
      item.roleTitle ||
      item.role_title ||
      "",

    roleTitle:
      item.roleTitle ||
      item.role_title ||
      item.documentTitle ||
      item.document_title ||
      "",

    accountId: item.accountId || item.account_id || "",
    accountName: item.accountName || item.account_name || item.account || "",

    departmentId: item.departmentId || item.department_id || "",
    departmentName:
      item.departmentName || item.department_name || item.department || "",

    jdStatus: normalizeJdStatus(item.jdStatus || item.jd_status || item.status),

    approvedBy: item.approvedBy || item.approved_by || "",
    approveRemarks: item.approveRemarks || item.approve_remarks || "",
    approveDate: item.approveDate || item.approve_date || "",

    ownerSibsId: item.ownerSibsId || item.owner_sibs_id || "",
    requestedBySibsId:
      item.requestedBySibsId || item.requested_by_sibs_id || "",

    dateRequested: item.dateRequested || item.date_requested || "",

    description: item.description || "",
    responsibilities: item.responsibilities || "",
    qualifications: item.qualifications || "",

    personalityType:
      item.personalityType || item.personality_type || item.remarks || "",

    reportsTo: item.reportsTo || item.reports_to || "",
    supervisory: item.supervisory || "No",

    remarks: item.remarks || "",

    createdBySibsId: item.createdBySibsId || item.created_by_sibs_id || "",
    updatedBySibsId: item.updatedBySibsId || item.updated_by_sibs_id || "",

    createdAt: item.createdAt || item.created_at || "",
    updatedAt: item.updatedAt || item.updated_at || "",
    deletedAt: item.deletedAt || item.deleted_at || "",

    revisionNo: item.revisionNo || item.revision_no || "",
    changeDetails: Array.isArray(item.changeDetails)
      ? item.changeDetails
      : safeParseJson(item.change_details_json, []),

    revisionHistory,
  };
}

function normalizeJobDescriptionPayload(payload = {}) {
  const documentTitle = String(
    payload.documentTitle || payload.roleTitle || "",
  ).trim();

  const existingJdId =
    payload.existingJdId ||
    payload.existing_jd_id ||
    payload.linkedHiringRequirement ||
    payload.linked_hiring_requirement ||
    null;

  return {
    ...payload,

    existingJdId,
    linkedHiringRequirement: existingJdId,

    documentTitle,
    roleTitle: documentTitle,

    accountId: payload.accountId || payload.account_id || null,
    departmentId: payload.departmentId || payload.department_id || null,

    jdStatus: existingJdId
      ? normalizeJdStatus(payload.jdStatus || payload.jd_status || "Existing")
      : "New Job Description",

    ownerSibsId: payload.ownerSibsId || payload.owner_sibs_id || "",
    requestedBySibsId:
      payload.requestedBySibsId || payload.requested_by_sibs_id || "",

    dateRequested: payload.dateRequested || payload.date_requested || "",

    description: String(payload.description || "").trim(),
    responsibilities: String(payload.responsibilities || "").trim(),
    qualifications: String(payload.qualifications || "").trim(),

    personalityType: String(
      payload.personalityType || payload.personality_type || "",
    ).trim(),

    reportsTo: String(payload.reportsTo || payload.reports_to || "").trim(),
    supervisory: String(payload.supervisory || "No").trim(),

    remarks: String(payload.remarks || "").trim(),

    competencies: Array.isArray(payload.competencies)
      ? payload.competencies
      : [],
  };
}

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
        existingJobDescriptions: [],
        message: data?.message || "Failed to load dropdowns.",
      };
    }

    return {
      success: true,
      accounts: data.data?.accounts || [],
      departments: data.data?.departments || [],
      requestedByUsers: data.data?.requestedByUsers || [],
      existingJobDescriptions:
        data.data?.existingJobDescriptions ||
        data.data?.jobDescriptions ||
        data.data?.existingJds ||
        [],
    };
  } catch (err) {
    return {
      success: false,
      accounts: [],
      departments: [],
      requestedByUsers: [],
      existingJobDescriptions: [],
      message: getApiErrorMessage(err, "Failed to load dropdowns."),
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
      data: Array.isArray(data.data)
        ? data.data.map(normalizeJobDescriptionResponseItem)
        : [],
      pagination: data.pagination || null,
      message: data.message || "Job descriptions loaded successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: [],
      pagination: null,
      message: getApiErrorMessage(err, "Failed to load job descriptions."),
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
      data: normalizeJobDescriptionResponseItem(data.data),
      message: data.message || "Job description loaded successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message: getApiErrorMessage(err, "Failed to load job description."),
      status: err.response?.status || 500,
    };
  }
}

/* ================================
   GET revision history
================================ */
export async function getJobDescriptionRevisions(id) {
  try {
    const res = await api.get(`/api/job-description/${id}/revisions`, {
      withCredentials: true,
    });

    const data = res.data;

    if (!data?.success) {
      return {
        success: false,
        data: [],
        message: data?.message || "Failed to load revision history.",
      };
    }

    return {
      success: true,
      data: Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.revisions)
          ? data.revisions
          : [],
      message: data.message || "Revision history loaded successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: [],
      message: getApiErrorMessage(err, "Failed to load revision history."),
      status: err.response?.status || 500,
    };
  }
}

/* ================================
   CREATE job description
================================ */
export async function createJobDescription(payload) {
  try {
    const finalPayload = normalizeJobDescriptionPayload(payload);

    const res = await api.post("/api/job-description", finalPayload, {
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
      data: normalizeJobDescriptionResponseItem(data.data),
      message: data.message || "Job description created successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message: getApiErrorMessage(err, "Failed to create job description."),
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
    const finalPayload = normalizeJobDescriptionPayload(payload);

    const res = await api.put(`/api/job-description/${id}`, finalPayload, {
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
      data: normalizeJobDescriptionResponseItem(data.data),
      message: data.message || "Job description updated successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message: getApiErrorMessage(err, "Failed to update job description."),
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
    const finalPayload = {
      ...payload,

      changeDetails: Array.isArray(payload?.changeDetails)
        ? payload.changeDetails
        : Array.isArray(payload?.editedChangeDetails)
          ? payload.editedChangeDetails
          : [],

      comments: Array.isArray(payload?.comments)
        ? payload.comments
        : Array.isArray(payload?.revisionComments)
          ? payload.revisionComments
          : [],

      jdStatus: normalizeJdStatus(
        payload?.jdStatus || payload?.jd_status || "Existing",
      ),
    };

    const res = await api.put(
      `/api/job-description/${id}/revision`,
      finalPayload,
      {
        withCredentials: true,
      },
    );

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
      data: normalizeJobDescriptionResponseItem(data.data),
      message: data.message || "Job description revision saved successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message: getApiErrorMessage(
        err,
        "Failed to save job description revision.",
      ),
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
      message: getApiErrorMessage(err, "Failed to delete job description."),
      status: err.response?.status || 500,
    };
  }
}

/* ================================
   SAVE job description comments
================================ */
export async function saveJobDescriptionRevisionComments(id, comments = []) {
  try {
    const response = await api.post(
      `/api/job-description/${id}/revision-comments`,
      { comments },
      { withCredentials: true },
    );

    return response?.data || response;
  } catch (error) {
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save revision comments.",
    };
  }
}

/* ================================
   GET job description comments
================================ */
export async function getJobDescriptionRevisionComments(id, params = {}) {
  try {
    const response = await api.get(
      `/api/job-description/${id}/get-revision-comments`,
      {
        params,
        withCredentials: true,
      },
    );

    return response?.data || response;
  } catch (error) {
    return {
      success: false,
      data: [],
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load revision comments.",
    };
  }
}
