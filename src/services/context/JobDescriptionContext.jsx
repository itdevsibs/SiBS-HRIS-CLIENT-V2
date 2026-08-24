import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  getJobDescriptionRevisionComments,
  saveJobDescriptionRevision,
  saveJobDescriptionRevisionComments,
} from "../../lib/axios/getJobDescription";

const JobDescriptionContext = createContext(null);

export const jdStatusOptions = [
  { value: "For Approval", label: "For Approval" },
  { value: "For Revision", label: "For Revision" },
  { value: "Existing", label: "Existing" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

const initialJobDescriptionForm = {
  existingJdId: "",
  linkedHiringRequirement: "",

  documentTitle: "",
  roleTitle: "",

  accountId: "",
  account: "",

  departmentId: "",
  department: "",
  locationWorkSetup: "",

  jdStatus: "For Approval",

  personalityType: "",
  personalityTypes: [],

  ownerSibsId: "",
  owner: "",

  requestedBySibsId: "",
  requestedBy: "",

  dateRequested: "",
  effectiveDate: "",

  reportsTo: "",
  supervisory: "No",

  description: "",
  responsibilities: "",
  qualifications: "",
  education: "",
  experience: "",
  certificationsAffiliations: "",
  remarks: "",
};

function cleanText(value = "") {
  return String(value ?? "").trim();
}

function parseRevisionHistoryJson(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeId(value) {
  const text = cleanText(value);

  if (!text) return "";

  const withoutPrefix = text.replace(/^JD[-_ ]?/i, "");

  if (/^\d+$/.test(withoutPrefix)) {
    return Number(withoutPrefix);
  }

  return value;
}

function getPersonalityTypeValue(source = {}) {
  const raw = source?.raw || {};

  return cleanText(
    source?.personalityType ||
    source?.personality_type ||
    source?.preferredPersonalityType ||
    source?.preferred_personality_type ||
    source?.personality ||
    source?.preferredPersonality ||
    source?.preferred_personality ||
    raw?.personalityType ||
    raw?.personality_type ||
    raw?.preferredPersonalityType ||
    raw?.preferred_personality_type ||
    raw?.personality ||
    raw?.preferredPersonality ||
    raw?.preferred_personality ||
    "",
  );
}

function splitPersonalityTypes(value = "") {
  return cleanText(value)
    .split(/[,;\n|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeCompetencies(source = {}) {
  const raw = source?.raw || {};

  if (Array.isArray(source?.competencies)) return source.competencies;
  if (Array.isArray(source?.desiredCompetencies))
    return source.desiredCompetencies;
  if (Array.isArray(source?.desired_competencies))
    return source.desired_competencies;
  if (Array.isArray(raw?.competencies)) return raw.competencies;
  if (Array.isArray(raw?.desiredCompetencies)) return raw.desiredCompetencies;
  if (Array.isArray(raw?.desired_competencies)) return raw.desired_competencies;

  return [];
}

export function normalizeJobDescriptionViewItem(source = {}) {
  const raw = source?.raw || {};
  const { raw: _ignoredRaw, ...sourceWithoutRaw } = source || {};

  const resolvedId =
    raw?.id || source?.rawId || source?.raw_id || normalizeId(source?.id) || "";

  const jdCode =
    source?.jdCode ||
    source?.jd_code ||
    raw?.jdCode ||
    raw?.jd_code ||
    (cleanText(source?.id).toUpperCase().startsWith("JD")
      ? source.id
      : resolvedId
        ? `JD-${String(resolvedId).padStart(3, "0")}`
        : "—");

  const roleTitle =
    source?.roleTitle ||
    source?.role_title ||
    source?.documentTitle ||
    source?.document_title ||
    raw?.roleTitle ||
    raw?.role_title ||
    raw?.documentTitle ||
    raw?.document_title ||
    source?.title ||
    raw?.title ||
    "Job Description";

  const personalityType = getPersonalityTypeValue(source);
  const personalityTypes = splitPersonalityTypes(personalityType);
  const competencies = normalizeCompetencies(source);

  const revisionHistory =
    source?.revisionHistory ||
    source?.revision_history ||
    raw?.revisionHistory ||
    raw?.revision_history ||
    parseRevisionHistoryJson(
      source?.revisionHistoryJson ||
      source?.revision_history_json ||
      raw?.revisionHistoryJson ||
      raw?.revision_history_json,
    );

  const normalized = {
    ...source,

    id: resolvedId,
    rawId: source?.rawId || source?.raw_id || raw?.id || resolvedId,
    raw_id: source?.raw_id || source?.rawId || raw?.id || resolvedId,

    requestId: source?.requestId || source?.request_id || source?.id || jdCode,
    request_id: source?.request_id || source?.requestId || source?.id || jdCode,

    jdCode,
    jd_code: jdCode,

    existingJdId:
      source?.existingJdId ||
      source?.existing_jd_id ||
      raw?.existingJdId ||
      raw?.existing_jd_id ||
      "",

    existing_jd_id:
      source?.existing_jd_id ||
      source?.existingJdId ||
      raw?.existing_jd_id ||
      raw?.existingJdId ||
      "",

    linkedHiringRequirement:
      source?.linkedHiringRequirement ||
      source?.linked_hiring_requirement ||
      source?.existingJdId ||
      source?.existing_jd_id ||
      raw?.linkedHiringRequirement ||
      raw?.linked_hiring_requirement ||
      raw?.existingJdId ||
      raw?.existing_jd_id ||
      "—",

    linked_hiring_requirement:
      source?.linked_hiring_requirement ||
      source?.linkedHiringRequirement ||
      source?.existing_jd_id ||
      source?.existingJdId ||
      raw?.linked_hiring_requirement ||
      raw?.linkedHiringRequirement ||
      raw?.existing_jd_id ||
      raw?.existingJdId ||
      "—",

    documentTitle:
      source?.documentTitle ||
      source?.document_title ||
      raw?.documentTitle ||
      raw?.document_title ||
      roleTitle,

    document_title:
      source?.document_title ||
      source?.documentTitle ||
      raw?.document_title ||
      raw?.documentTitle ||
      roleTitle,

    roleTitle,
    role_title: roleTitle,
    title: source?.title || raw?.title || roleTitle,

    accountId:
      source?.accountId ||
      source?.account_id ||
      raw?.accountId ||
      raw?.account_id ||
      "",

    account_id:
      source?.account_id ||
      source?.accountId ||
      raw?.account_id ||
      raw?.accountId ||
      "",

    account:
      source?.accountName ||
      source?.account_name ||
      source?.account ||
      raw?.accountName ||
      raw?.account_name ||
      raw?.account ||
      raw?.accountId ||
      "—",

    preparedFor:
      source?.preparedFor ||
      source?.prepared_for ||
      source?.accountName ||
      source?.account_name ||
      source?.account ||
      raw?.preparedFor ||
      raw?.prepared_for ||
      raw?.accountName ||
      raw?.account_name ||
      raw?.account ||
      "—",

    prepared_for:
      source?.prepared_for ||
      source?.preparedFor ||
      source?.account_name ||
      source?.accountName ||
      source?.account ||
      raw?.prepared_for ||
      raw?.preparedFor ||
      raw?.account_name ||
      raw?.accountName ||
      raw?.account ||
      "—",

    departmentId:
      source?.departmentId ||
      source?.department_id ||
      raw?.departmentId ||
      raw?.department_id ||
      "",

    department_id:
      source?.department_id ||
      source?.departmentId ||
      raw?.department_id ||
      raw?.departmentId ||
      "",

    department:
      source?.departmentName ||
      source?.department_name ||
      source?.department ||
      raw?.departmentName ||
      raw?.department_name ||
      raw?.department ||
      raw?.departmentId ||
      "—",

    jdStatus:
      source?.jdStatus ||
      source?.jd_status ||
      raw?.jdStatus ||
      raw?.jd_status ||
      source?.status ||
      "New Job Description",

    jd_status:
      source?.jd_status ||
      source?.jdStatus ||
      raw?.jd_status ||
      raw?.jdStatus ||
      source?.status ||
      "New Job Description",

    status: source?.status || raw?.status || "Pending",

    approvalStatus:
      source?.approvalStatus ||
      source?.approval_status ||
      raw?.approvalStatus ||
      raw?.approval_status ||
      source?.status ||
      "Pending",

    approval_status:
      source?.approval_status ||
      source?.approvalStatus ||
      raw?.approval_status ||
      raw?.approvalStatus ||
      source?.status ||
      "Pending",

    requestedBySibsId:
      source?.requestedBySibsId ||
      source?.requested_by_sibs_id ||
      raw?.requestedBySibsId ||
      raw?.requested_by_sibs_id ||
      source?.employeeSibsId ||
      raw?.employeeSibsId ||
      "",

    requested_by_sibs_id:
      source?.requested_by_sibs_id ||
      source?.requestedBySibsId ||
      raw?.requested_by_sibs_id ||
      raw?.requestedBySibsId ||
      source?.employeeSibsId ||
      raw?.employeeSibsId ||
      "",

    requestedBy:
      source?.requestedBy ||
      source?.requested_by ||
      source?.requester ||
      raw?.requestedBy ||
      raw?.requested_by ||
      raw?.requester ||
      "—",

    requested_by:
      source?.requested_by ||
      source?.requestedBy ||
      source?.requester ||
      raw?.requested_by ||
      raw?.requestedBy ||
      raw?.requester ||
      "—",

    createdBySibsId:
      source?.createdBySibsId ||
      source?.created_by_sibs_id ||
      raw?.createdBySibsId ||
      raw?.created_by_sibs_id ||
      "",

    created_by_sibs_id:
      source?.created_by_sibs_id ||
      source?.createdBySibsId ||
      raw?.created_by_sibs_id ||
      raw?.createdBySibsId ||
      "",

    createdBy:
      source?.createdByName ||
      source?.created_by_name ||
      source?.createdBy ||
      source?.created_by ||
      source?.requestedBy ||
      source?.requested_by ||
      source?.requester ||
      raw?.createdByName ||
      raw?.created_by_name ||
      raw?.createdBy ||
      raw?.created_by ||
      raw?.requestedBy ||
      raw?.requested_by ||
      raw?.requester ||
      "—",

    created_by:
      source?.created_by ||
      source?.createdBy ||
      source?.requested_by ||
      source?.requestedBy ||
      source?.requester ||
      raw?.created_by ||
      raw?.createdBy ||
      raw?.requested_by ||
      raw?.requestedBy ||
      raw?.requester ||
      "—",

    ownerSibsId:
      source?.ownerSibsId ||
      source?.owner_sibs_id ||
      raw?.ownerSibsId ||
      raw?.owner_sibs_id ||
      "",

    owner_sibs_id:
      source?.owner_sibs_id ||
      source?.ownerSibsId ||
      raw?.owner_sibs_id ||
      raw?.ownerSibsId ||
      "",

    owner:
      source?.ownerName ||
      source?.owner_name ||
      source?.owner ||
      raw?.ownerName ||
      raw?.owner_name ||
      raw?.owner ||
      source?.approver ||
      raw?.approver ||
      "—",

    dateRequested:
      source?.dateRequested ||
      source?.date_requested ||
      source?.requestDate ||
      raw?.dateRequested ||
      raw?.date_requested ||
      raw?.requestDate ||
      raw?.createdAt ||
      raw?.created_at ||
      "",

    date_requested:
      source?.date_requested ||
      source?.dateRequested ||
      source?.requestDate ||
      raw?.date_requested ||
      raw?.dateRequested ||
      raw?.requestDate ||
      raw?.created_at ||
      raw?.createdAt ||
      "",

    effectiveDate:
      source?.effectiveDate ||
      source?.effective_date ||
      raw?.effectiveDate ||
      raw?.effective_date ||
      "",

    effective_date:
      source?.effective_date ||
      source?.effectiveDate ||
      raw?.effective_date ||
      raw?.effectiveDate ||
      "",

    lastReviewed:
      source?.lastReviewed ||
      source?.last_reviewed ||
      source?.approveDate ||
      source?.approve_date ||
      source?.updatedAt ||
      source?.updated_at ||
      raw?.lastReviewed ||
      raw?.last_reviewed ||
      raw?.approveDate ||
      raw?.approve_date ||
      raw?.updatedAt ||
      raw?.updated_at ||
      "",

    last_reviewed:
      source?.last_reviewed ||
      source?.lastReviewed ||
      source?.approve_date ||
      source?.approveDate ||
      source?.updated_at ||
      source?.updatedAt ||
      raw?.last_reviewed ||
      raw?.lastReviewed ||
      raw?.approve_date ||
      raw?.approveDate ||
      raw?.updated_at ||
      raw?.updatedAt ||
      "",

    version:
      source?.version ||
      source?.jdVersion ||
      source?.jd_version ||
      source?.currentVersion ||
      source?.current_version ||
      raw?.version ||
      raw?.jdVersion ||
      raw?.jd_version ||
      raw?.currentVersion ||
      raw?.current_version ||
      "1",

    currentVersion:
      source?.currentVersion ||
      source?.current_version ||
      source?.revisionNo ||
      source?.revision_no ||
      source?.jdVersion ||
      source?.jd_version ||
      source?.version ||
      raw?.currentVersion ||
      raw?.current_version ||
      raw?.revisionNo ||
      raw?.revision_no ||
      raw?.jdVersion ||
      raw?.jd_version ||
      raw?.version ||
      "1",

    current_version:
      source?.current_version ||
      source?.currentVersion ||
      source?.revision_no ||
      source?.revisionNo ||
      source?.jd_version ||
      source?.jdVersion ||
      source?.version ||
      raw?.current_version ||
      raw?.currentVersion ||
      raw?.revision_no ||
      raw?.revisionNo ||
      raw?.jd_version ||
      raw?.jdVersion ||
      raw?.version ||
      "1",

    revisionNo:
      source?.revisionNo ||
      source?.revision_no ||
      source?.currentVersion ||
      source?.current_version ||
      raw?.revisionNo ||
      raw?.revision_no ||
      raw?.currentVersion ||
      raw?.current_version ||
      "1",

    revision_no:
      source?.revision_no ||
      source?.revisionNo ||
      source?.current_version ||
      source?.currentVersion ||
      raw?.revision_no ||
      raw?.revisionNo ||
      raw?.current_version ||
      raw?.currentVersion ||
      "1",

    description: source?.description || raw?.description || "",

    responsibilities: source?.responsibilities || raw?.responsibilities || "",

    qualifications: source?.qualifications || raw?.qualifications || "",

    locationWorkSetup:
      source?.locationWorkSetup ||
      source?.location_work_setup ||
      raw?.locationWorkSetup ||
      raw?.location_work_setup ||
      "",
    location_work_setup:
      source?.location_work_setup ||
      source?.locationWorkSetup ||
      raw?.location_work_setup ||
      raw?.locationWorkSetup ||
      "",

    education: source?.education || raw?.education || "",
    experience: source?.experience || raw?.experience || "",
    certificationsAffiliations:
      source?.certificationsAffiliations ||
      source?.certifications_affiliations ||
      raw?.certificationsAffiliations ||
      raw?.certifications_affiliations ||
      "",
    certifications_affiliations:
      source?.certifications_affiliations ||
      source?.certificationsAffiliations ||
      raw?.certifications_affiliations ||
      raw?.certificationsAffiliations ||
      "",

    personalityType,
    personality_type: personalityType,
    preferredPersonalityType: personalityType,
    preferred_personality_type: personalityType,
    personalityTypes,
    personality_types: personalityTypes,

    reportsTo:
      source?.reportsTo ||
      source?.reports_to ||
      raw?.reportsTo ||
      raw?.reports_to ||
      "",

    reports_to:
      source?.reports_to ||
      source?.reportsTo ||
      raw?.reports_to ||
      raw?.reportsTo ||
      "",

    supervisory: source?.supervisory || raw?.supervisory || "No",

    remarks:
      source?.jdRemarks ||
      source?.remarks ||
      source?.remarks_raw ||
      raw?.jdRemarks ||
      raw?.remarks ||
      raw?.remarks_raw ||
      "",

    jdRemarks:
      source?.jdRemarks ||
      source?.remarks ||
      source?.remarks_raw ||
      raw?.jdRemarks ||
      raw?.remarks ||
      raw?.remarks_raw ||
      "",

    revisionHistory,
    revision_history: revisionHistory,

    competencies,
    desiredCompetencies: competencies,
    desired_competencies: competencies,
  };

  return {
    ...normalized,
    raw: {
      ...raw,
      ...sourceWithoutRaw,
      ...normalized,
    },
  };
}

function isCompetencySection(sectionKey = "") {
  const key = String(sectionKey || "").toLowerCase();

  return key.includes("competenc") || key.includes("desired");
}

function normalizeRevisionCommentPayload(comment = {}) {
  const sectionKey = String(
    comment.sectionKey || comment.section_key || "",
  ).trim();

  const sectionTitle = String(
    comment.sectionTitle || comment.section_title || "",
  ).trim();

  const selectedText = String(
    comment.selectedText || comment.selected_text || "",
  ).trim();

  const commentText = String(comment.comment || "").trim();

  const rawCompetencyId =
    comment.competencyId ||
    comment.competency_id ||
    comment.jdCompetencyId ||
    comment.jd_competency_id ||
    null;

  const competencyId = rawCompetencyId ? Number(rawCompetencyId) : null;

  return {
    sectionKey,
    sectionTitle,
    competencyId:
      isCompetencySection(sectionKey) && competencyId ? competencyId : null,
    selectedText,
    comment: commentText,
    status: String(comment.status || "Open").trim() || "Open",
  };
}

function normalizeRevisionCommentsPayload(comments = []) {
  return comments.map(normalizeRevisionCommentPayload).filter((comment) => {
    if (!comment.sectionKey || !comment.comment) return false;

    if (isCompetencySection(comment.sectionKey)) {
      return Boolean(comment.competencyId || comment.selectedText);
    }

    return true;
  });
}

function normalizeRevisionCommentFromApi(comment = {}) {
  return {
    id: comment.id,
    jdId: comment.jdId || comment.jd_id || "",
    revisionId: comment.revisionId || comment.revision_id || "",
    revisionNo: comment.revisionNo || comment.revision_no || "",
    sectionKey: comment.sectionKey || comment.section_key || "",
    sectionTitle: comment.sectionTitle || comment.section_title || "",
    competencyId:
      comment.competencyId || comment.competency_id
        ? Number(comment.competencyId || comment.competency_id)
        : null,
    selectedText: comment.selectedText || comment.selected_text || "",
    comment: comment.comment || "",
    status: comment.status || "Open",
    createdBySibsId:
      comment.createdBySibsId || comment.created_by_sibs_id || "",
    resolvedBySibsId:
      comment.resolvedBySibsId || comment.resolved_by_sibs_id || "",
    resolvedAt: comment.resolvedAt || comment.resolved_at || null,
    createdAt: comment.createdAt || comment.created_at || null,
    updatedAt: comment.updatedAt || comment.updated_at || null,
  };
}

function normalizeRevisionCompetenciesPayload(competencies = []) {
  if (!Array.isArray(competencies)) return [];

  return competencies
    .map((item) => {
      const level = cleanText(item.level);

      return {
        id: item.id || null,
        competencyId:
          item.competencyId || item.competency_id || item.id || null,
        competency_id:
          item.competency_id || item.competencyId || item.id || null,

        title: cleanText(item.title),
        description: cleanText(item.description),

        level,
        average: level === "Average" ? 1 : 0,
        proficient: level === "Proficient" ? 1 : 0,
        excellent: level === "Excellent" ? 1 : 0,
      };
    })
    .filter((item) => item.title || item.description);
}

function normalizeRevisionSubmitPayload(form = {}, comments = []) {
  const existingJdId = cleanText(
    form.existingJdId ||
    form.existing_jd_id ||
    form.linkedHiringRequirement ||
    form.linked_hiring_requirement ||
    "",
  );

  const personalityType = cleanText(
    form.personalityType ||
    form.personality_type ||
    (Array.isArray(form.personalityTypes)
      ? form.personalityTypes.join(", ")
      : ""),
  );

  const payloadComments = normalizeRevisionCommentsPayload(comments);

  return {
    existingJdId: existingJdId || null,
    existing_jd_id: existingJdId || null,
    linkedHiringRequirement: existingJdId,
    linked_hiring_requirement: existingJdId,

    documentTitle: cleanText(form.documentTitle || form.document_title),
    document_title: cleanText(form.document_title || form.documentTitle),

    roleTitle: cleanText(form.roleTitle || form.role_title),
    role_title: cleanText(form.role_title || form.roleTitle),

    accountId: form.accountId || form.account_id || form.preparedForId || null,
    account_id: form.account_id || form.accountId || form.preparedForId || null,
    account: cleanText(form.account || form.preparedFor || form.prepared_for),
    preparedFor: cleanText(
      form.preparedFor || form.prepared_for || form.account,
    ),
    prepared_for: cleanText(
      form.prepared_for || form.preparedFor || form.account,
    ),

    departmentId: form.departmentId || form.department_id || null,
    department_id: form.department_id || form.departmentId || null,
    department: cleanText(
      form.department || form.departmentName || form.department_name,
    ),
    locationWorkSetup: cleanText(
      form.locationWorkSetup || form.location_work_setup,
    ),
    location_work_setup: cleanText(
      form.location_work_setup || form.locationWorkSetup,
    ),

    jdStatus: "For Approval",
    jd_status: "For Approval",
    status: "For Approval",
    approvalStatus: "Pending",
    approval_status: "Pending",

    dateRequested: form.dateRequested || form.date_requested || "",
    date_requested: form.date_requested || form.dateRequested || "",

    effectiveDate: form.effectiveDate || form.effective_date || "",
    effective_date: form.effective_date || form.effectiveDate || "",

    description: cleanText(form.description),
    responsibilities: cleanText(form.responsibilities),
    qualifications: cleanText(form.qualifications),
    education: cleanText(form.education),
    experience: cleanText(form.experience),
    certificationsAffiliations: cleanText(
      form.certificationsAffiliations || form.certifications_affiliations,
    ),
    certifications_affiliations: cleanText(
      form.certifications_affiliations || form.certificationsAffiliations,
    ),

    personalityType,
    personality_type: personalityType,
    personalityTypes: splitPersonalityTypes(personalityType),
    personality_types: splitPersonalityTypes(personalityType),

    reportsTo: cleanText(form.reportsTo || form.reports_to),
    reports_to: cleanText(form.reports_to || form.reportsTo),

    supervisory: cleanText(form.supervisory || "No") || "No",

    remarks: cleanText(form.remarks),

    revisionRemarks: cleanText(form.revisionRemarks || form.revision_remarks),
    revision_remarks: cleanText(form.revision_remarks || form.revisionRemarks),

    changeDetails: Array.isArray(form.changeDetails)
      ? form.changeDetails
      : Array.isArray(form.change_details)
        ? form.change_details
        : [],

    comments: payloadComments,
    revisionComments: payloadComments,

    competencies: normalizeRevisionCompetenciesPayload(form.competencies),
    desiredCompetencies: normalizeRevisionCompetenciesPayload(
      form.competencies,
    ),
    desired_competencies: normalizeRevisionCompetenciesPayload(
      form.competencies,
    ),
  };
}

export function useJobDescription() {
  const context = useContext(JobDescriptionContext);

  if (!context) {
    throw new Error(
      "useJobDescription must be used within JobDescriptionProvider",
    );
  }

  return context;
}

export default function JobDescriptionProvider({ children }) {
  const [form, setForm] = useState({
    ...initialJobDescriptionForm,
    dateRequested: getTodayDate(),
    effectiveDate: getTodayDate(),
  });

  const [accounts, setAccounts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [requestedByUsers, setRequestedByUsers] = useState([]);

  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [dropdownError, setDropdownError] = useState("");

  const [competencies, setCompetencies] = useState([]);

  const [selectedJobDescription, setSelectedJobDescription] = useState(null);

  const [revisionComments, setRevisionComments] = useState([]);
  const [revisionCommentsLoading, setRevisionCommentsLoading] = useState(false);
  const [revisionCommentsError, setRevisionCommentsError] = useState("");

  const [revisionSaving, setRevisionSaving] = useState(false);
  const [revisionSaveError, setRevisionSaveError] = useState("");
  const [revisionSaveMessage, setRevisionSaveMessage] = useState("");

  const linkedRequirementOptions = useMemo(
    () => [
      {
        value: "",
        label: "No Existing Job Description — New Job Description",
      },
    ],
    [],
  );

  const hasLinkedHiringRequirement = !!String(
    form.existingJdId || form.linkedHiringRequirement || "",
  ).trim();

  const selectedLinkedRequirement =
    linkedRequirementOptions.find((option) => {
      const currentValue = String(
        form.existingJdId || form.linkedHiringRequirement || "",
      );

      return String(option.value) === currentValue;
    })?.label || "";

  const selectedJdStatus =
    jdStatusOptions.find(
      (option) => option.value === String(form.jdStatus || ""),
    )?.label || "";

  const resetJobDescriptionForm = useCallback((overrides = {}) => {
    setForm({
      ...initialJobDescriptionForm,
      jdStatus: "For Approval",
      dateRequested: getTodayDate(),
      effectiveDate: getTodayDate(),
      ...overrides,
    });

    setCompetencies([]);
  }, []);

  const handleRequirementChange = useCallback((value = "") => {
    const nextValue = String(value || "").trim();

    setForm((prev) => ({
      ...prev,

      existingJdId: nextValue,
      linkedHiringRequirement: nextValue,

      documentTitle: "",
      roleTitle: "",

      accountId: "",
      account: "",

      departmentId: "",
      department: "",
      locationWorkSetup: "",

      jdStatus: "For Approval",

      requestedBySibsId: "",
      requestedBy: "",

      description: "",
      responsibilities: "",
      qualifications: "",
      education: "",
      experience: "",
      certificationsAffiliations: "",
      remarks: "",

      personalityType: "",
      personalityTypes: [],

      reportsTo: "",
      supervisory: "No",
      effectiveDate: prev.effectiveDate || getTodayDate(),
    }));

    setCompetencies([]);
  }, []);

  const clearRevisionComments = useCallback(() => {
    setRevisionComments([]);
    setRevisionCommentsError("");
    setRevisionCommentsLoading(false);
  }, []);

  const openJobDescriptionDetails = useCallback((source = {}) => {
    const normalizedItem = normalizeJobDescriptionViewItem(source);

    setSelectedJobDescription(normalizedItem);

    return normalizedItem;
  }, []);

  const updateSelectedJobDescription = useCallback((nextItemOrUpdater) => {
    setSelectedJobDescription((prev) => {
      const nextItem =
        typeof nextItemOrUpdater === "function"
          ? nextItemOrUpdater(prev)
          : nextItemOrUpdater;

      if (!nextItem) return null;

      return normalizeJobDescriptionViewItem(nextItem);
    });
  }, []);

  const closeJobDescriptionDetails = useCallback(() => {
    setSelectedJobDescription(null);
    clearRevisionComments();
  }, [clearRevisionComments]);

  const loadRevisionComments = useCallback(async (jdId, params = {}) => {
    const resolvedJdId = Number(jdId || 0);

    if (!resolvedJdId) {
      setRevisionComments([]);
      setRevisionCommentsError("");
      return {
        success: false,
        data: [],
        message: "Invalid job description ID.",
      };
    }

    setRevisionCommentsLoading(true);
    setRevisionCommentsError("");

    try {
      const result = await getJobDescriptionRevisionComments(
        resolvedJdId,
        params,
      );

      if (!result?.success) {
        setRevisionComments([]);
        setRevisionCommentsError(
          result?.message || "Failed to load revision comments.",
        );

        return result;
      }

      const normalizedComments = Array.isArray(result.data)
        ? result.data.map(normalizeRevisionCommentFromApi)
        : [];

      setRevisionComments(normalizedComments);

      return {
        ...result,
        data: normalizedComments,
      };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load revision comments.";

      setRevisionComments([]);
      setRevisionCommentsError(message);

      return {
        success: false,
        data: [],
        message,
      };
    } finally {
      setRevisionCommentsLoading(false);
    }
  }, []);

  const saveRevisionComments = useCallback(async (jdId, comments = []) => {
    const resolvedJdId = Number(jdId || 0);

    if (!resolvedJdId) {
      return {
        success: false,
        message: "Invalid job description ID.",
      };
    }

    const payloadComments = normalizeRevisionCommentsPayload(comments);

    if (!payloadComments.length) {
      return {
        success: false,
        message:
          "At least one valid revision comment is required. For competency comments, highlight text or include competencyId.",
      };
    }

    setRevisionCommentsLoading(true);
    setRevisionCommentsError("");

    try {
      const result = await saveJobDescriptionRevisionComments(
        resolvedJdId,
        payloadComments,
      );

      if (!result?.success) {
        setRevisionCommentsError(
          result?.message || "Failed to save revision comments.",
        );

        return result;
      }

      const normalizedSavedComments = Array.isArray(result.data)
        ? result.data.map(normalizeRevisionCommentFromApi)
        : payloadComments;

      setRevisionComments(normalizedSavedComments);

      return {
        ...result,
        data: normalizedSavedComments,
      };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save revision comments.";

      setRevisionCommentsError(message);

      return {
        success: false,
        message,
      };
    } finally {
      setRevisionCommentsLoading(false);
    }
  }, []);

  const saveRevision = useCallback(
    async (jdId, revisionForm = {}) => {
      const resolvedJdId = Number(normalizeId(jdId) || 0);

      if (!resolvedJdId) {
        return {
          success: false,
          message: "Invalid job description ID.",
        };
      }

      const revisionRemarks = cleanText(
        revisionForm.revisionRemarks || revisionForm.revision_remarks,
      );

      if (!revisionRemarks) {
        return {
          success: false,
          message: "Revision remarks are required before saving.",
        };
      }

      const payload = normalizeRevisionSubmitPayload(
        revisionForm,
        revisionComments,
      );

      setRevisionSaving(true);
      setRevisionSaveError("");
      setRevisionSaveMessage("");

      try {
        const result = await saveJobDescriptionRevision(resolvedJdId, payload);

        if (!result?.success) {
          const message =
            result?.message || "Failed to save job description revision.";

          setRevisionSaveError(message);

          return {
            ...result,
            success: false,
            message,
          };
        }

        const normalizedItem = normalizeJobDescriptionViewItem(
          result.data || {
            ...selectedJobDescription,
            ...payload,
            id: resolvedJdId,
            rawId: resolvedJdId,
            raw_id: resolvedJdId,
            revisionNo: result.revisionNo,
            revision_no: result.revisionNo,
            currentVersion: result.revisionNo,
            current_version: result.revisionNo,
          },
        );

        setSelectedJobDescription(normalizedItem);
        setRevisionComments([]);
        setRevisionSaveMessage(
          result?.message || "Job description revision saved successfully.",
        );

        return {
          ...result,
          success: true,
          data: normalizedItem,
        };
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to save job description revision.";

        setRevisionSaveError(message);

        return {
          success: false,
          message,
        };
      } finally {
        setRevisionSaving(false);
      }
    },
    [revisionComments, selectedJobDescription],
  );

  const value = useMemo(
    () => ({
      form,
      setForm,

      accounts,
      setAccounts,

      departments,
      setDepartments,

      requestedByUsers,
      setRequestedByUsers,

      dropdownLoading,
      setDropdownLoading,

      dropdownError,
      setDropdownError,

      competencies,
      setCompetencies,

      selectedJobDescription,
      setSelectedJobDescription,
      openJobDescriptionDetails,
      closeJobDescriptionDetails,
      updateSelectedJobDescription,
      normalizeJobDescriptionViewItem,

      revisionComments,
      setRevisionComments,

      revisionCommentsLoading,
      setRevisionCommentsLoading,

      revisionCommentsError,
      setRevisionCommentsError,

      loadRevisionComments,
      clearRevisionComments,
      saveRevisionComments,

      jdStatusOptions,
      linkedRequirementOptions,

      hasLinkedHiringRequirement,
      selectedLinkedRequirement,
      selectedJdStatus,

      resetJobDescriptionForm,
      handleRequirementChange,

      revisionSaving,
      setRevisionSaving,

      revisionSaveError,
      setRevisionSaveError,

      revisionSaveMessage,
      setRevisionSaveMessage,

      saveRevision,
    }),
    [
      form,
      accounts,
      departments,
      requestedByUsers,
      dropdownLoading,
      dropdownError,
      competencies,
      selectedJobDescription,
      openJobDescriptionDetails,
      closeJobDescriptionDetails,
      updateSelectedJobDescription,
      revisionComments,
      revisionCommentsLoading,
      revisionCommentsError,
      loadRevisionComments,
      clearRevisionComments,
      saveRevisionComments,
      linkedRequirementOptions,
      hasLinkedHiringRequirement,
      selectedLinkedRequirement,
      selectedJdStatus,
      resetJobDescriptionForm,
      handleRequirementChange,

      revisionSaving,
      revisionSaveError,
      revisionSaveMessage,
      saveRevision,
    ],
  );

  return (
    <JobDescriptionContext.Provider value={value}>
      {children}
    </JobDescriptionContext.Provider>
  );
}
