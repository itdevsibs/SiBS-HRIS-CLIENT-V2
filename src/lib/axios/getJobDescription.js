import api from "./api-template";

function cleanText(value = "") {
  return String(value ?? "").trim();
}

function getApiErrorMessage(err, fallback) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
}

function normalizeJdStatus(status) {
  const value = cleanText(status);

  if (value === "New JD") {
    return "New Job Description";
  }

  if (value === "Archived JD") {
    return "Archived";
  }

  return value || "New Job Description";
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

function splitPersonalityTypes(value = "") {
  return cleanText(value)
    .split(/[,;\n|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizePersonalityTypePayload(payload = {}) {
  if (Array.isArray(payload.personalityTypes)) {
    return payload.personalityTypes.map(cleanText).filter(Boolean).join(", ");
  }

  if (Array.isArray(payload.personality_types)) {
    return payload.personality_types.map(cleanText).filter(Boolean).join(", ");
  }

  return cleanText(payload.personalityType || payload.personality_type);
}

function normalizeRevisionHistory(item = {}) {
  if (Array.isArray(item.revisionHistory)) return item.revisionHistory;
  if (Array.isArray(item.revision_history)) return item.revision_history;
  if (Array.isArray(item.revisions)) return item.revisions;

  return safeParseJson(
    item.revisionHistoryJson ||
      item.revision_history_json ||
      item.raw?.revisionHistoryJson ||
      item.raw?.revision_history_json,
    [],
  );
}

function normalizeChangeDetails(item = {}) {
  if (Array.isArray(item.changeDetails)) return item.changeDetails;
  if (Array.isArray(item.change_details)) return item.change_details;

  return safeParseJson(
    item.changeDetailsJson ||
      item.change_details_json ||
      item.raw?.changeDetailsJson ||
      item.raw?.change_details_json,
    [],
  );
}

function normalizeCompetencies(item = {}) {
  if (Array.isArray(item.competencies)) return item.competencies;
  if (Array.isArray(item.desiredCompetencies)) return item.desiredCompetencies;
  if (Array.isArray(item.desired_competencies))
    return item.desired_competencies;

  if (Array.isArray(item.raw?.competencies)) return item.raw.competencies;
  if (Array.isArray(item.raw?.desiredCompetencies))
    return item.raw.desiredCompetencies;
  if (Array.isArray(item.raw?.desired_competencies))
    return item.raw.desired_competencies;

  return [];
}

export function normalizeJobDescriptionResponseItem(item) {
  if (!item) return null;

  const raw = item.raw || {};

  const documentTitle =
    item.documentTitle ||
    item.document_title ||
    raw.documentTitle ||
    raw.document_title ||
    "";

  const roleTitle =
    item.roleTitle || item.role_title || raw.roleTitle || raw.role_title || "";

  const personalityType =
    item.personalityType ||
    item.personality_type ||
    item.preferredPersonalityType ||
    item.preferred_personality_type ||
    raw.personalityType ||
    raw.personality_type ||
    raw.preferredPersonalityType ||
    raw.preferred_personality_type ||
    "";

  const competencies = normalizeCompetencies(item);
  const revisionHistory = normalizeRevisionHistory(item);
  const changeDetails = normalizeChangeDetails(item);

  return {
    ...item,

    id: item.id || item.rawId || item.raw_id || raw.id || "",

    rawId: item.rawId || item.raw_id || raw.id || item.id || "",
    raw_id: item.raw_id || item.rawId || raw.id || item.id || "",

    requestId: item.requestId || item.request_id || item.id || "",
    request_id: item.request_id || item.requestId || item.id || "",

    jdCode: item.jdCode || item.jd_code || raw.jdCode || raw.jd_code || "",
    jd_code: item.jd_code || item.jdCode || raw.jd_code || raw.jdCode || "",

    existingJdId:
      item.existingJdId ||
      item.existing_jd_id ||
      item.linkedHiringRequirement ||
      item.linked_hiring_requirement ||
      raw.existingJdId ||
      raw.existing_jd_id ||
      "",

    existing_jd_id:
      item.existing_jd_id ||
      item.existingJdId ||
      item.linked_hiring_requirement ||
      item.linkedHiringRequirement ||
      raw.existing_jd_id ||
      raw.existingJdId ||
      "",

    linkedHiringRequirement:
      item.linkedHiringRequirement ||
      item.linked_hiring_requirement ||
      item.existingJdId ||
      item.existing_jd_id ||
      raw.linkedHiringRequirement ||
      raw.linked_hiring_requirement ||
      raw.existingJdId ||
      raw.existing_jd_id ||
      "",

    linked_hiring_requirement:
      item.linked_hiring_requirement ||
      item.linkedHiringRequirement ||
      item.existing_jd_id ||
      item.existingJdId ||
      raw.linked_hiring_requirement ||
      raw.linkedHiringRequirement ||
      raw.existing_jd_id ||
      raw.existingJdId ||
      "",

    documentTitle,
    document_title: documentTitle,

    roleTitle,
    role_title: roleTitle,
    title: roleTitle || documentTitle,

    accountId:
      item.accountId ||
      item.account_id ||
      raw.accountId ||
      raw.account_id ||
      "",
    account_id:
      item.account_id ||
      item.accountId ||
      raw.account_id ||
      raw.accountId ||
      "",

    accountName:
      item.accountName ||
      item.account_name ||
      item.account ||
      item.preparedFor ||
      item.prepared_for ||
      raw.accountName ||
      raw.account_name ||
      raw.account ||
      raw.preparedFor ||
      raw.prepared_for ||
      "",

    account:
      item.account ||
      item.accountName ||
      item.account_name ||
      item.preparedFor ||
      item.prepared_for ||
      raw.account ||
      raw.accountName ||
      raw.account_name ||
      raw.preparedFor ||
      raw.prepared_for ||
      "",

    preparedFor:
      item.preparedFor ||
      item.prepared_for ||
      item.account ||
      item.accountName ||
      item.account_name ||
      raw.preparedFor ||
      raw.prepared_for ||
      raw.account ||
      raw.accountName ||
      raw.account_name ||
      "",

    prepared_for:
      item.prepared_for ||
      item.preparedFor ||
      item.account ||
      item.account_name ||
      item.accountName ||
      raw.prepared_for ||
      raw.preparedFor ||
      raw.account ||
      raw.account_name ||
      raw.accountName ||
      "",

    departmentId:
      item.departmentId ||
      item.department_id ||
      raw.departmentId ||
      raw.department_id ||
      "",

    department_id:
      item.department_id ||
      item.departmentId ||
      raw.department_id ||
      raw.departmentId ||
      "",

    departmentName:
      item.departmentName ||
      item.department_name ||
      item.department ||
      raw.departmentName ||
      raw.department_name ||
      raw.department ||
      "",

    department:
      item.department ||
      item.departmentName ||
      item.department_name ||
      raw.department ||
      raw.departmentName ||
      raw.department_name ||
      "",

    jdStatus: normalizeJdStatus(
      item.jdStatus || item.jd_status || raw.jdStatus || raw.jd_status,
    ),

    jd_status: normalizeJdStatus(
      item.jd_status || item.jdStatus || raw.jd_status || raw.jdStatus,
    ),

    status:
      item.status ||
      item.approvalStatus ||
      item.approval_status ||
      raw.status ||
      raw.approvalStatus ||
      raw.approval_status ||
      normalizeJdStatus(item.jdStatus || item.jd_status),

    approvalStatus:
      item.approvalStatus ||
      item.approval_status ||
      item.status ||
      raw.approvalStatus ||
      raw.approval_status ||
      raw.status ||
      "",

    approval_status:
      item.approval_status ||
      item.approvalStatus ||
      item.status ||
      raw.approval_status ||
      raw.approvalStatus ||
      raw.status ||
      "",

    approvedBy:
      item.approvedBy ||
      item.approved_by ||
      raw.approvedBy ||
      raw.approved_by ||
      "",
    approved_by:
      item.approved_by ||
      item.approvedBy ||
      raw.approved_by ||
      raw.approvedBy ||
      "",

    approvedByName:
      item.approvedByName ||
      item.approved_by_name ||
      raw.approvedByName ||
      raw.approved_by_name ||
      "",

    approved_by_name:
      item.approved_by_name ||
      item.approvedByName ||
      raw.approved_by_name ||
      raw.approvedByName ||
      "",

    approveRemarks:
      item.approveRemarks ||
      item.approve_remarks ||
      raw.approveRemarks ||
      raw.approve_remarks ||
      "",

    approve_remarks:
      item.approve_remarks ||
      item.approveRemarks ||
      raw.approve_remarks ||
      raw.approveRemarks ||
      "",

    approveDate:
      item.approveDate ||
      item.approve_date ||
      raw.approveDate ||
      raw.approve_date ||
      "",

    approve_date:
      item.approve_date ||
      item.approveDate ||
      raw.approve_date ||
      raw.approveDate ||
      "",

    ownerSibsId:
      item.ownerSibsId ||
      item.owner_sibs_id ||
      raw.ownerSibsId ||
      raw.owner_sibs_id ||
      "",

    owner_sibs_id:
      item.owner_sibs_id ||
      item.ownerSibsId ||
      raw.owner_sibs_id ||
      raw.ownerSibsId ||
      "",

    owner: item.owner || raw.owner || "",

    requestedBySibsId:
      item.requestedBySibsId ||
      item.requested_by_sibs_id ||
      raw.requestedBySibsId ||
      raw.requested_by_sibs_id ||
      "",

    requested_by_sibs_id:
      item.requested_by_sibs_id ||
      item.requestedBySibsId ||
      raw.requested_by_sibs_id ||
      raw.requestedBySibsId ||
      "",

    requestedBy:
      item.requestedBy ||
      item.requested_by ||
      item.requester ||
      raw.requestedBy ||
      raw.requested_by ||
      raw.requester ||
      "",

    requested_by:
      item.requested_by ||
      item.requestedBy ||
      item.requester ||
      raw.requested_by ||
      raw.requestedBy ||
      raw.requester ||
      "",

    createdBySibsId:
      item.createdBySibsId ||
      item.created_by_sibs_id ||
      raw.createdBySibsId ||
      raw.created_by_sibs_id ||
      "",

    created_by_sibs_id:
      item.created_by_sibs_id ||
      item.createdBySibsId ||
      raw.created_by_sibs_id ||
      raw.createdBySibsId ||
      "",

    createdBy:
      item.createdBy ||
      item.created_by ||
      raw.createdBy ||
      raw.created_by ||
      item.requestedBy ||
      item.requested_by ||
      "",

    created_by:
      item.created_by ||
      item.createdBy ||
      raw.created_by ||
      raw.createdBy ||
      item.requested_by ||
      item.requestedBy ||
      "",

    updatedBySibsId:
      item.updatedBySibsId ||
      item.updated_by_sibs_id ||
      raw.updatedBySibsId ||
      raw.updated_by_sibs_id ||
      "",

    updated_by_sibs_id:
      item.updated_by_sibs_id ||
      item.updatedBySibsId ||
      raw.updated_by_sibs_id ||
      raw.updatedBySibsId ||
      "",

    updatedBy:
      item.updatedBy ||
      item.updated_by ||
      raw.updatedBy ||
      raw.updated_by ||
      "",

    updated_by:
      item.updated_by ||
      item.updatedBy ||
      raw.updated_by ||
      raw.updatedBy ||
      "",

    dateRequested:
      item.dateRequested ||
      item.date_requested ||
      item.requestDate ||
      raw.dateRequested ||
      raw.date_requested ||
      raw.requestDate ||
      "",

    date_requested:
      item.date_requested ||
      item.dateRequested ||
      item.requestDate ||
      raw.date_requested ||
      raw.dateRequested ||
      raw.requestDate ||
      "",

    effectiveDate:
      item.effectiveDate ||
      item.effective_date ||
      raw.effectiveDate ||
      raw.effective_date ||
      "",

    effective_date:
      item.effective_date ||
      item.effectiveDate ||
      raw.effective_date ||
      raw.effectiveDate ||
      "",

    lastUpdated:
      item.lastUpdated ||
      item.last_updated ||
      item.updatedAt ||
      item.updated_at ||
      raw.lastUpdated ||
      raw.last_updated ||
      raw.updatedAt ||
      raw.updated_at ||
      "",

    last_updated:
      item.last_updated ||
      item.lastUpdated ||
      item.updated_at ||
      item.updatedAt ||
      raw.last_updated ||
      raw.lastUpdated ||
      raw.updated_at ||
      raw.updatedAt ||
      "",

    lastReviewed:
      item.lastReviewed ||
      item.last_reviewed ||
      item.approveDate ||
      item.approve_date ||
      item.updatedAt ||
      item.updated_at ||
      raw.lastReviewed ||
      raw.last_reviewed ||
      raw.approveDate ||
      raw.approve_date ||
      raw.updatedAt ||
      raw.updated_at ||
      "",

    last_reviewed:
      item.last_reviewed ||
      item.lastReviewed ||
      item.approve_date ||
      item.approveDate ||
      item.updated_at ||
      item.updatedAt ||
      raw.last_reviewed ||
      raw.lastReviewed ||
      raw.approve_date ||
      raw.approveDate ||
      raw.updated_at ||
      raw.updatedAt ||
      "",

    description: item.description || raw.description || "",
    responsibilities: item.responsibilities || raw.responsibilities || "",
    qualifications: item.qualifications || raw.qualifications || "",

    personalityType,
    personality_type: personalityType,
    preferredPersonalityType: personalityType,
    preferred_personality_type: personalityType,
    personalityTypes: Array.isArray(item.personalityTypes)
      ? item.personalityTypes
      : splitPersonalityTypes(personalityType),
    personality_types: Array.isArray(item.personality_types)
      ? item.personality_types
      : splitPersonalityTypes(personalityType),

    reportsTo:
      item.reportsTo ||
      item.reports_to ||
      raw.reportsTo ||
      raw.reports_to ||
      "",
    reports_to:
      item.reports_to ||
      item.reportsTo ||
      raw.reports_to ||
      raw.reportsTo ||
      "",

    supervisory: item.supervisory || raw.supervisory || "No",

    remarks: item.remarks || raw.remarks || "",
    jdRemarks:
      item.jdRemarks || item.jd_remarks || item.remarks || raw.remarks || "",

    createdAt:
      item.createdAt ||
      item.created_at ||
      raw.createdAt ||
      raw.created_at ||
      "",
    created_at:
      item.created_at ||
      item.createdAt ||
      raw.created_at ||
      raw.createdAt ||
      "",

    updatedAt:
      item.updatedAt ||
      item.updated_at ||
      raw.updatedAt ||
      raw.updated_at ||
      "",
    updated_at:
      item.updated_at ||
      item.updatedAt ||
      raw.updated_at ||
      raw.updatedAt ||
      "",

    deletedAt:
      item.deletedAt ||
      item.deleted_at ||
      raw.deletedAt ||
      raw.deleted_at ||
      "",
    deleted_at:
      item.deleted_at ||
      item.deletedAt ||
      raw.deleted_at ||
      raw.deletedAt ||
      "",

    revisionId:
      item.revisionId ||
      item.revision_id ||
      item.latestRevisionId ||
      item.latest_revision_id ||
      raw.revisionId ||
      raw.revision_id ||
      raw.latestRevisionId ||
      raw.latest_revision_id ||
      "",

    revision_id:
      item.revision_id ||
      item.revisionId ||
      item.latest_revision_id ||
      item.latestRevisionId ||
      raw.revision_id ||
      raw.revisionId ||
      raw.latest_revision_id ||
      raw.latestRevisionId ||
      "",

    revisionNo:
      item.revisionNo ||
      item.revision_no ||
      item.currentVersion ||
      item.current_version ||
      raw.revisionNo ||
      raw.revision_no ||
      raw.currentVersion ||
      raw.current_version ||
      "",

    revision_no:
      item.revision_no ||
      item.revisionNo ||
      item.current_version ||
      item.currentVersion ||
      raw.revision_no ||
      raw.revisionNo ||
      raw.current_version ||
      raw.currentVersion ||
      "",

    currentVersion:
      item.currentVersion ||
      item.current_version ||
      item.revisionNo ||
      item.revision_no ||
      raw.currentVersion ||
      raw.current_version ||
      raw.revisionNo ||
      raw.revision_no ||
      "",

    current_version:
      item.current_version ||
      item.currentVersion ||
      item.revision_no ||
      item.revisionNo ||
      raw.current_version ||
      raw.currentVersion ||
      raw.revision_no ||
      raw.revisionNo ||
      "",

    changeDetails,
    change_details: changeDetails,

    revisionHistory,
    revision_history: revisionHistory,

    competencies,
    desiredCompetencies: competencies,
    desired_competencies: competencies,

    raw: {
      ...raw,
      ...item,
    },
  };
}

function normalizeJobDescriptionPayload(payload = {}) {
  const existingJdId = cleanText(
    payload.existingJdId ||
      payload.existing_jd_id ||
      payload.linkedHiringRequirement ||
      payload.linked_hiring_requirement ||
      "",
  );

  const documentTitle = cleanText(
    payload.documentTitle || payload.document_title,
  );

  const roleTitle = cleanText(payload.roleTitle || payload.role_title);

  const accountId =
    payload.accountId || payload.account_id || payload.preparedForId || null;

  const departmentId = payload.departmentId || payload.department_id || null;

  const personalityType = normalizePersonalityTypePayload(payload);

  return {
    ...payload,

    existingJdId: existingJdId || null,
    existing_jd_id: existingJdId || null,
    linkedHiringRequirement: existingJdId || "",
    linked_hiring_requirement: existingJdId || "",

    documentTitle,
    document_title: documentTitle,

    roleTitle,
    role_title: roleTitle,

    accountId,
    account_id: accountId,

    account: cleanText(
      payload.account || payload.preparedFor || payload.prepared_for,
    ),
    preparedFor: cleanText(
      payload.preparedFor || payload.prepared_for || payload.account,
    ),
    prepared_for: cleanText(
      payload.prepared_for || payload.preparedFor || payload.account,
    ),

    departmentId,
    department_id: departmentId,
    department: cleanText(
      payload.department || payload.departmentName || payload.department_name,
    ),

    jdStatus: "For Approval",
    jd_status: "For Approval",
    status: "For Approval",
    approvalStatus: "Pending",
    approval_status: "Pending",

    ownerSibsId: cleanText(payload.ownerSibsId || payload.owner_sibs_id),
    owner_sibs_id: cleanText(payload.owner_sibs_id || payload.ownerSibsId),

    requestedBySibsId: cleanText(
      payload.requestedBySibsId || payload.requested_by_sibs_id,
    ),
    requested_by_sibs_id: cleanText(
      payload.requested_by_sibs_id || payload.requestedBySibsId,
    ),

    dateRequested: payload.dateRequested || payload.date_requested || "",
    date_requested: payload.date_requested || payload.dateRequested || "",

    effectiveDate: payload.effectiveDate || payload.effective_date || "",
    effective_date: payload.effective_date || payload.effectiveDate || "",

    description: cleanText(payload.description),
    responsibilities: cleanText(payload.responsibilities),
    qualifications: cleanText(payload.qualifications),

    personalityType,
    personality_type: personalityType,
    personalityTypes: Array.isArray(payload.personalityTypes)
      ? payload.personalityTypes
      : splitPersonalityTypes(personalityType),
    personality_types: Array.isArray(payload.personality_types)
      ? payload.personality_types
      : splitPersonalityTypes(personalityType),

    reportsTo: cleanText(payload.reportsTo || payload.reports_to),
    reports_to: cleanText(payload.reports_to || payload.reportsTo),

    supervisory: cleanText(payload.supervisory || "No") || "No",

    remarks: cleanText(payload.remarks),

    competencies: Array.isArray(payload.competencies)
      ? payload.competencies
      : [],
    desiredCompetencies: Array.isArray(payload.desiredCompetencies)
      ? payload.desiredCompetencies
      : Array.isArray(payload.competencies)
        ? payload.competencies
        : [],
    desired_competencies: Array.isArray(payload.desired_competencies)
      ? payload.desired_competencies
      : Array.isArray(payload.competencies)
        ? payload.competencies
        : [],
  };
}

function normalizeRevisionPayload(payload = {}) {
  const basePayload = normalizeJobDescriptionPayload(payload);

  return {
    ...basePayload,

    revisionRemarks: cleanText(
      payload.revisionRemarks ||
        payload.revision_remarks ||
        payload.revisionNote ||
        payload.revision_note,
    ),

    revision_remarks: cleanText(
      payload.revision_remarks ||
        payload.revisionRemarks ||
        payload.revisionNote ||
        payload.revision_note,
    ),

    changeDetails: Array.isArray(payload.changeDetails)
      ? payload.changeDetails
      : Array.isArray(payload.editedChangeDetails)
        ? payload.editedChangeDetails
        : Array.isArray(payload.change_details)
          ? payload.change_details
          : [],

    comments: Array.isArray(payload.comments)
      ? payload.comments
      : Array.isArray(payload.revisionComments)
        ? payload.revisionComments
        : [],
  };
}

function normalizeRevisionCommentFromApi(comment = {}) {
  return {
    ...comment,

    id: comment.id,

    jdId: comment.jdId || comment.jd_id || "",
    jd_id: comment.jd_id || comment.jdId || "",

    revisionId: comment.revisionId || comment.revision_id || "",
    revision_id: comment.revision_id || comment.revisionId || "",

    revisionNo: comment.revisionNo || comment.revision_no || "",
    revision_no: comment.revision_no || comment.revisionNo || "",

    sectionKey: comment.sectionKey || comment.section_key || "",
    section_key: comment.section_key || comment.sectionKey || "",

    sectionTitle: comment.sectionTitle || comment.section_title || "",
    section_title: comment.section_title || comment.sectionTitle || "",

    competencyId:
      comment.competencyId || comment.competency_id
        ? Number(comment.competencyId || comment.competency_id)
        : null,

    competency_id:
      comment.competency_id || comment.competencyId
        ? Number(comment.competency_id || comment.competencyId)
        : null,

    selectedText: comment.selectedText || comment.selected_text || "",
    selected_text: comment.selected_text || comment.selectedText || "",

    comment: comment.comment || "",
    status: comment.status || "Open",

    createdBySibsId:
      comment.createdBySibsId || comment.created_by_sibs_id || "",

    created_by_sibs_id:
      comment.created_by_sibs_id || comment.createdBySibsId || "",

    resolvedBySibsId:
      comment.resolvedBySibsId || comment.resolved_by_sibs_id || "",

    resolved_by_sibs_id:
      comment.resolved_by_sibs_id || comment.resolvedBySibsId || "",

    resolvedAt: comment.resolvedAt || comment.resolved_at || null,
    resolved_at: comment.resolved_at || comment.resolvedAt || null,

    createdAt: comment.createdAt || comment.created_at || null,
    created_at: comment.created_at || comment.createdAt || null,

    updatedAt: comment.updatedAt || comment.updated_at || null,
    updated_at: comment.updated_at || comment.updatedAt || null,
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

    const responseData = res.data;

    if (!responseData?.success) {
      return {
        success: false,
        accounts: [],
        departments: [],
        requestedByUsers: [],
        existingJobDescriptions: [],
        message: responseData?.message || "Failed to load dropdowns.",
      };
    }

    const existingJobDescriptions =
      responseData.data?.existingJobDescriptions ||
      responseData.data?.jobDescriptions ||
      responseData.data?.existingJds ||
      [];

    return {
      success: true,
      accounts: responseData.data?.accounts || [],
      departments: responseData.data?.departments || [],
      requestedByUsers: responseData.data?.requestedByUsers || [],
      existingJobDescriptions: existingJobDescriptions.map(
        normalizeJobDescriptionResponseItem,
      ),
    };
  } catch (err) {
    return {
      success: false,
      accounts: [],
      departments: [],
      requestedByUsers: [],
      existingJobDescriptions: [],
      message: getApiErrorMessage(err, "Failed to load dropdowns."),
      status: err?.response?.status || 500,
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

    const responseData = res.data;

    if (!responseData?.success) {
      return {
        success: false,
        data: [],
        pagination: null,
        message: responseData?.message || "Failed to load job descriptions.",
      };
    }

    return {
      success: true,
      data: Array.isArray(responseData.data)
        ? responseData.data.map(normalizeJobDescriptionResponseItem)
        : [],
      pagination: responseData.pagination || null,
      message: responseData.message || "Job descriptions loaded successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: [],
      pagination: null,
      message: getApiErrorMessage(err, "Failed to load job descriptions."),
      status: err?.response?.status || 500,
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

    const responseData = res.data;

    if (!responseData?.success) {
      return {
        success: false,
        data: null,
        message: responseData?.message || "Failed to load job description.",
      };
    }

    return {
      success: true,
      data: normalizeJobDescriptionResponseItem(responseData.data),
      message: responseData.message || "Job description loaded successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message: getApiErrorMessage(err, "Failed to load job description."),
      status: err?.response?.status || 500,
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

    const responseData = res.data;

    if (!responseData?.success) {
      return {
        success: false,
        data: [],
        message: responseData?.message || "Failed to load revision history.",
      };
    }

    const revisions = Array.isArray(responseData.data)
      ? responseData.data
      : Array.isArray(responseData.revisions)
        ? responseData.revisions
        : [];

    return {
      success: true,
      data: revisions,
      revisions,
      message: responseData.message || "Revision history loaded successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: [],
      revisions: [],
      message: getApiErrorMessage(err, "Failed to load revision history."),
      status: err?.response?.status || 500,
    };
  }
}

/* ================================
   CREATE job description
================================ */
export async function createJobDescription(payload = {}) {
  try {
    const finalPayload = normalizeJobDescriptionPayload(payload);

    const res = await api.post("/api/job-description", finalPayload, {
      withCredentials: true,
    });

    const responseData = res.data;

    if (!responseData?.success) {
      return {
        success: false,
        data: null,
        message: responseData?.message || "Failed to create job description.",
      };
    }

    return {
      success: true,
      data: normalizeJobDescriptionResponseItem(responseData.data),
      message: responseData.message || "Job description created successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message: getApiErrorMessage(err, "Failed to create job description."),
      errors: err?.response?.data?.errors || [],
      status: err?.response?.status || 500,
    };
  }
}

/* ================================
   UPDATE job description
================================ */
export async function updateJobDescription(id, payload = {}) {
  try {
    const finalPayload = normalizeJobDescriptionPayload(payload);

    const res = await api.put(`/api/job-description/${id}`, finalPayload, {
      withCredentials: true,
    });

    const responseData = res.data;

    if (!responseData?.success) {
      return {
        success: false,
        data: null,
        message: responseData?.message || "Failed to update job description.",
      };
    }

    return {
      success: true,
      data: normalizeJobDescriptionResponseItem(responseData.data),
      message: responseData.message || "Job description updated successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message: getApiErrorMessage(err, "Failed to update job description."),
      errors: err?.response?.data?.errors || [],
      status: err?.response?.status || 500,
    };
  }
}

/* ================================
   SAVE new job description revision
   Backend endpoint:
   POST /api/job-description/:id/revisions
================================ */
export async function saveJobDescriptionRevision(id, payload = {}) {
  try {
    const finalPayload = normalizeRevisionPayload(payload);

    const res = await api.post(
      `/api/job-description/${id}/revisions`,
      finalPayload,
      {
        withCredentials: true,
      },
    );

    const responseData = res.data;

    if (!responseData?.success) {
      return {
        success: false,
        data: null,
        revisionId: null,
        revisionNo: null,
        resolvedCommentsCount: 0,
        changeDetails: [],
        message:
          responseData?.message || "Failed to save job description revision.",
      };
    }

    return {
      success: true,
      data: normalizeJobDescriptionResponseItem(responseData.data),
      revisionId: responseData.revisionId || null,
      revisionNo: responseData.revisionNo || null,
      resolvedCommentsCount: Number(responseData.resolvedCommentsCount || 0),
      changeDetails: Array.isArray(responseData.changeDetails)
        ? responseData.changeDetails
        : [],
      message:
        responseData.message || "Job description revision saved successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      revisionId: null,
      revisionNo: null,
      resolvedCommentsCount: 0,
      changeDetails: [],
      message: getApiErrorMessage(
        err,
        "Failed to save job description revision.",
      ),
      errors: err?.response?.data?.errors || [],
      status: err?.response?.status || 500,
    };
  }
}

/* ================================
   LEGACY save revision and tag as Existing
   Old backend endpoint:
   PUT /api/job-description/:id/revision
================================ */
export async function saveJobDescriptionRevisionAsExisting(id, payload = {}) {
  try {
    const finalPayload = normalizeRevisionPayload(payload);

    const res = await api.put(
      `/api/job-description/${id}/revision`,
      finalPayload,
      {
        withCredentials: true,
      },
    );

    const responseData = res.data;

    if (!responseData?.success) {
      return {
        success: false,
        data: null,
        message:
          responseData?.message || "Failed to save job description revision.",
      };
    }

    return {
      success: true,
      data: normalizeJobDescriptionResponseItem(responseData.data),
      message:
        responseData.message || "Job description revision saved successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message: getApiErrorMessage(
        err,
        "Failed to save job description revision.",
      ),
      errors: err?.response?.data?.errors || [],
      status: err?.response?.status || 500,
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

    const responseData = res.data;

    if (!responseData?.success) {
      return {
        success: false,
        message: responseData?.message || "Failed to delete job description.",
      };
    }

    return {
      success: true,
      message: responseData.message || "Job description deleted successfully.",
    };
  } catch (err) {
    return {
      success: false,
      message: getApiErrorMessage(err, "Failed to delete job description."),
      status: err?.response?.status || 500,
    };
  }
}

/* ================================
   SAVE job description revision comments
================================ */
export async function saveJobDescriptionRevisionComments(id, comments = []) {
  try {
    const response = await api.post(
      `/api/job-description/${id}/revision-comments`,
      { comments },
      { withCredentials: true },
    );

    const responseData = response?.data || response;

    if (!responseData?.success) {
      return {
        success: false,
        data: [],
        message: responseData?.message || "Failed to save revision comments.",
      };
    }

    return {
      ...responseData,
      data: Array.isArray(responseData.data)
        ? responseData.data.map(normalizeRevisionCommentFromApi)
        : [],
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save revision comments.",
      status: error?.response?.status || 500,
    };
  }
}

/* ================================
   GET job description revision comments
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

    const responseData = response?.data || response;

    if (!responseData?.success) {
      return {
        success: false,
        data: [],
        message: responseData?.message || "Failed to load revision comments.",
      };
    }

    return {
      ...responseData,
      data: Array.isArray(responseData.data)
        ? responseData.data.map(normalizeRevisionCommentFromApi)
        : [],
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load revision comments.",
      status: error?.response?.status || 500,
    };
  }
}

export async function getApprovedJobDescriptions({
  page = 1,
  limit = 500,
  search = "",
} = {}) {
  try {
    const res = await api.get("/api/job-description/jd-approved", {
      params: {
        page,
        limit,
        search,
      },
      withCredentials: true,
    });

    const responseData = res.data;

    if (!responseData?.success) {
      return {
        success: false,
        data: [],
        pagination: null,
        message:
          responseData?.message || "Failed to load approved job descriptions.",
      };
    }

    return {
      success: true,
      data: Array.isArray(responseData.data)
        ? responseData.data.map(normalizeJobDescriptionResponseItem)
        : [],
      pagination: responseData.pagination || null,
      message:
        responseData.message ||
        "Approved job descriptions loaded successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: [],
      pagination: null,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load approved job descriptions.",
      status: err?.response?.status || 500,
    };
  }
}

/* ================================
   ARCHIVE job description
================================ */
export async function archiveJobDescription(id) {
  try {
    const res = await api.patch(
      `/api/job-description/${id}/archive`,
      {},
      { withCredentials: true },
    );

    const responseData = res.data;

    if (!responseData?.success) {
      return {
        success: false,
        message: responseData?.message || "Failed to archive job description.",
      };
    }

    return {
      success: true,
      data: responseData.data || null,
      message: responseData.message || "Job description archived successfully.",
    };
  } catch (err) {
    return {
      success: false,
      message: getApiErrorMessage(err, "Failed to archive job description."),
      status: err?.response?.status || 500,
    };
  }
}

/* ================================
RESTORE archived job description
================================ */
export async function restoreJobDescription(id) {
  try {
    const res = await api.patch(
      `/api/job-description/${id}/restore`,
      {},
      {
        withCredentials: true,
      },
    );

    const responseData = res.data;

    if (!responseData?.success) {
      return {
        success: false,
        data: null,
        restoredStatus: null,
        message: responseData?.message || "Failed to restore job description.",
      };
    }

    return {
      success: true,
      data: responseData.data
        ? normalizeJobDescriptionResponseItem(responseData.data)
        : null,
      restoredStatus:
        responseData.restoredStatus ||
        responseData.restored_status ||
        responseData.data?.jdStatus ||
        responseData.data?.jd_status ||
        null,
      message: responseData.message || "Job description restored successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      restoredStatus: null,
      message: getApiErrorMessage(err, "Failed to restore job description."),
      status: err?.response?.status || 500,
    };
  }
}

export async function getJobDescriptionDeletionImpact(id) {
  try {
    const res = await api.get(`/api/job-description/${id}/deletion-impact`, {
      withCredentials: true,
    });

    if (!res.data?.success) {
      return {
        success: false,
        data: null,
        message: res.data?.message || "Failed to load deletion impact.",
      };
    }

    return {
      success: true,
      data: res.data.data || null,
      message: res.data.message || "",
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message:
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load deletion impact.",
      status: err?.response?.status || 500,
    };
  }
}

export async function permanentlyDeleteJobDescription(id, payload = {}) {
  try {
    const res = await api.delete(`/api/job-description/${id}/permanent`, {
      data: payload,
      withCredentials: true,
    });

    if (!res.data?.success) {
      return {
        success: false,
        data: null,
        message:
          res.data?.message || "Failed to permanently delete job description.",
      };
    }

    return {
      success: true,
      data: res.data.data || null,
      message:
        res.data.message || "Job description permanently deleted successfully.",
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message:
        err?.response?.data?.message ||
        err?.message ||
        "Failed to permanently delete job description.",
      status: err?.response?.status || 500,
    };
  }
}
