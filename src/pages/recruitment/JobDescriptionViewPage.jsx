import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Eye,
  Loader2,
  Printer,
  Trash2,
} from "lucide-react";

import StatusModal from "../../components/modals/StatusModal";
import Details from "../../components/layout/tabs/JobDescriptionView/Details";
import RevisionHistory from "../../components/layout/tabs/JobDescriptionView/RevisionHistory";
import ReviseJobDescriptionModal from "../../components/modals/jobDescription/ReviseJobDescriptionModal";

import useJobDescriptionDeletion from "../../hooks/jobDescription/useJobDescriptionDeletion";
import useApprovalRuleRevision from "../../hooks/useApprovalRuleRevision";

import { normalizeJdStatus } from "../../lib/utils/NormalizeJDStatus";
import { useJobDescription } from "../../services/context/JobDescriptionContext";
import { useUser } from "../../services/context/UserContext";
import { approveJobDescriptionRequest } from "../../lib/axios/getApprovalRequest";
import { getJobDescriptionApprovalUsers } from "../../lib/axios/getJobDescriptionApprovalSettings";
import {
  archiveJobDescription,
  deleteJobDescription,
  getJobDescriptionById,
  restoreJobDescription,
  saveJobDescriptionRevision,
} from "../../lib/axios/getJobDescription";
import DeleteJobDescriptionModal from "../../components/modals/jobDescription/DeleteJobDescription";

const detailTabs = ["Details", "Revision History"];

/* =====================================================
USER ACCESS
===================================================== */

function normalizeUserRole(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getUserAdminAccess(user = {}) {
  const value =
    user?.adminAccess ??
    user?.admin_access ??
    user?.gy_user_access ??
    user?.access ??
    user?.adminLevel ??
    user?.admin_level ??
    0;

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function getUserRoleCandidates(user = {}) {
  return [
    user?.role,
    user?.userRole,
    user?.user_role,
    user?.adminRole,
    user?.admin_role,
    user?.roleName,
    user?.role_name,
  ]
    .map(normalizeUserRole)
    .filter(Boolean);
}

function getJobDescriptionActionAccess(user = {}) {
  const adminAccess = getUserAdminAccess(user);

  const roles = getUserRoleCandidates(user);

  const isSuperAdmin =
    adminAccess === 7 ||
    roles.some((role) =>
      ["super_admin", "superadmin", "super_administrator"].includes(role),
    );

  const isHrManager =
    adminAccess === 5 ||
    roles.some((role) => ["manager", "hr_manager"].includes(role));

  return {
    canArchive: isSuperAdmin || isHrManager,
    canRestore: isSuperAdmin || isHrManager,
    canDelete: isSuperAdmin,
  };
}

function normalizeSibsId(value) {
  const cleanValue = String(value ?? "")
    .trim()
    .replace(/^SIBS[-_ ]?/i, "");
  const numericValue = Number(cleanValue);

  return cleanValue && Number.isFinite(numericValue)
    ? String(numericValue)
    : cleanValue.toLowerCase();
}

function getCurrentUserSibsId(user = {}) {
  return normalizeSibsId(
    user?.sibsId ||
      user?.sibs_id ||
      user?.employeeSibsId ||
      user?.employee_sibs_id ||
      user?.gy_emp_code ||
      user?.gy_user_code ||
      user?.userCode ||
      user?.user_code ||
      user?.employeeCode ||
      user?.employee_code ||
      user?.username ||
      "",
  );
}

function getApprovalUsers(response = {}) {
  const rows =
    response?.data?.users ||
    response?.data?.rows ||
    response?.data ||
    response?.users ||
    response?.rows ||
    response;

  return Array.isArray(rows) ? rows : [];
}

function getApprovalUserSibsId(user = {}) {
  return normalizeSibsId(
    user?.sibsId ||
      user?.sibs_id ||
      user?.employeeSibsId ||
      user?.employee_sibs_id ||
      user?.gy_emp_code ||
      user?.gy_user_code ||
      user?.userCode ||
      user?.user_code ||
      user?.username ||
      "",
  );
}

/* =====================================================
ANIMATION STYLES
===================================================== */

const jdViewAnimationStyles = `
@keyframes jdViewPageFadeIn {
from {
opacity: 0;
}

to {
opacity: 1;
}
}

@keyframes jdViewHeaderContentIn {
from {
opacity: 0;
transform: translateY(-12px);
}

to {
opacity: 1;
transform: translateY(0);
}
}

@keyframes jdViewContentIn {
from {
opacity: 0;
transform: translateY(14px) scale(0.992);
filter: blur(2px);
}

to {
opacity: 1;
transform: translateY(0) scale(1);
filter: blur(0);
}
}

@keyframes jdViewFooterIn {
from {
opacity: 0;
transform: translateY(12px);
}

to {
opacity: 1;
transform: translateY(0);
}
}

@keyframes jdViewEmptyCardIn {
from {
opacity: 0;
transform: translateY(14px) scale(0.98);
}

to {
opacity: 1;
transform: translateY(0) scale(1);
}
}

@keyframes jdViewOverlayIn {
from {
opacity: 0;
}

to {
opacity: 1;
}
}

@keyframes jdViewDialogIn {
from {
opacity: 0;
transform: translateY(18px) scale(0.96);
}

to {
opacity: 1;
transform: translateY(0) scale(1);
}
}

.jd-view-page-shell {
animation: jdViewPageFadeIn 180ms ease-out both;
}

.jd-view-header-content {
animation: jdViewHeaderContentIn 280ms ease-out both;
}

.jd-view-content-panel {
animation: jdViewContentIn 260ms ease-out both;
will-change: opacity, transform;
}

.jd-view-footer {
animation: jdViewFooterIn 260ms ease-out 80ms both;
}

.jd-view-empty-card {
animation: jdViewEmptyCardIn 260ms ease-out both;
}

.jd-view-overlay {
animation: jdViewOverlayIn 160ms ease-out both;
}

.jd-view-dialog {
animation: jdViewDialogIn 220ms ease-out both;
transform-origin: center;
}

.jd-view-tab-button {
transition:
color 180ms ease,
transform 180ms ease;
}

.jd-view-tab-button {
transform: translateY(-1px);
}

.jd-view-action-button {
transition:
transform 180ms ease,
border-color 180ms ease,
background-color 180ms ease,
opacity 180ms ease;
}

.jd-view-page-shell button {
cursor: pointer;
}

@media (max-width: 640px) {
.jd-view-page-shell {
min-width: 0;
}

.jd-view-content-panel {
transform-origin: top center;
}
}

@media (prefers-reduced-motion: reduce) {
.jd-view-page-shell,
.jd-view-header-content,
.jd-view-content-panel,
.jd-view-footer,
.jd-view-empty-card,
.jd-view-overlay,
.jd-view-dialog {
animation: none !important;
}

.jd-view-tab-button,
.jd-view-action-button {
transition: none !important;
}
}
`;

/* =====================================================
NORMALIZATION
===================================================== */

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

function mapJobDescriptionApprovalToViewItem(request = {}) {
  const raw = request?.raw || {};

  const competencies = Array.isArray(request?.competencies)
    ? request.competencies
    : Array.isArray(request?.desiredCompetencies)
      ? request.desiredCompetencies
      : Array.isArray(raw?.competencies)
        ? raw.competencies
        : Array.isArray(raw?.desiredCompetencies)
          ? raw.desiredCompetencies
          : [];

  return {
    ...request,

    raw,

    rawId: request?.rawId || request?.raw_id || raw?.id || request?.id,

    id: request?.rawId || request?.raw_id || raw?.id || request?.id,

    jdCode: request?.jdCode || raw?.jdCode || request?.id || "—",

    roleTitle:
      request?.roleTitle ||
      raw?.roleTitle ||
      request?.title ||
      raw?.title ||
      "Job Description",

    title:
      request?.roleTitle ||
      raw?.roleTitle ||
      request?.title ||
      raw?.title ||
      "Job Description",

    jdStatus: request?.jdStatus || raw?.jdStatus || request?.status,

    jd_status: request?.jd_status || raw?.jd_status || request?.status,

    status: request?.status || raw?.status,

    department:
      request?.departmentName ||
      request?.department ||
      raw?.departmentName ||
      raw?.department ||
      raw?.departmentId ||
      "—",

    locationWorkSetup:
      request?.locationWorkSetup ||
      request?.location_work_setup ||
      raw?.locationWorkSetup ||
      raw?.location_work_setup ||
      "",

    account:
      request?.accountName ||
      request?.account ||
      raw?.accountName ||
      raw?.account ||
      raw?.accountId ||
      "—",

    linkedHiringRequirement:
      request?.linkedHiringRequirement || raw?.linkedHiringRequirement || "—",

    dateRequested:
      request?.dateRequested ||
      request?.requestDate ||
      raw?.dateRequested ||
      raw?.createdAt ||
      "",

    createdBy:
      request?.createdByName ||
      request?.createdBy ||
      raw?.createdByName ||
      raw?.createdBy ||
      raw?.createdBySibsId ||
      request?.requester ||
      "—",

    owner:
      request?.ownerName ||
      request?.owner ||
      raw?.ownerName ||
      raw?.owner ||
      raw?.ownerSibsId ||
      request?.approver ||
      "—",

    preparedFor:
      request?.preparedFor ||
      raw?.preparedFor ||
      request?.accountName ||
      request?.account ||
      raw?.accountName ||
      raw?.account ||
      "—",

    reportsTo: request?.reportsTo || raw?.reportsTo || "—",

    supervisory: request?.supervisory || raw?.supervisory || "No",

    version:
      request?.version ||
      request?.jdVersion ||
      request?.currentVersion ||
      raw?.version ||
      raw?.jdVersion ||
      raw?.currentVersion ||
      "1",

    currentVersion:
      request?.currentVersion ||
      request?.jdVersion ||
      request?.version ||
      raw?.currentVersion ||
      raw?.jdVersion ||
      raw?.version ||
      "1",

    revisionNo:
      request?.revisionNo ||
      request?.revision_no ||
      raw?.revisionNo ||
      raw?.revision_no ||
      request?.currentVersion ||
      raw?.currentVersion ||
      "1",

    effectiveDate: request?.effectiveDate || raw?.effectiveDate || "",

    lastUpdated:
      request?.approveDate ||
      request?.updatedAt ||
      raw?.approveDate ||
      raw?.updatedAt ||
      request?.dateRequested ||
      "",

    description: request?.description || raw?.description || "",

    responsibilities: request?.responsibilities || raw?.responsibilities || "",

    qualifications: request?.qualifications || raw?.qualifications || "",

    education: request?.education || raw?.education || "",

    experience: request?.experience || raw?.experience || "",

    certificationsAffiliations:
      request?.certificationsAffiliations ||
      request?.certifications_affiliations ||
      raw?.certificationsAffiliations ||
      raw?.certifications_affiliations ||
      "",

    personalityType:
      request?.personalityType ||
      request?.personality_type ||
      request?.preferredPersonalityType ||
      request?.preferred_personality_type ||
      raw?.personalityType ||
      raw?.personality_type ||
      raw?.preferredPersonalityType ||
      raw?.preferred_personality_type ||
      "",

    remarks: request?.jdRemarks || request?.remarks || raw?.remarks || "",

    revisionHistory:
      request?.revisionHistory ||
      raw?.revisionHistory ||
      parseRevisionHistoryJson(
        request?.revisionHistoryJson || raw?.revisionHistoryJson,
      ),

    competencies,

    desiredCompetencies: competencies,
  };
}

function normalizePageJobDescription(item, approvalPage = false) {
  if (!item) return null;

  if (
    approvalPage ||
    item?.module === "Job Description" ||
    item?.type === "Job Description"
  ) {
    return mapJobDescriptionApprovalToViewItem(item);
  }

  return item;
}

function getFirstValue(...values) {
  return values.find((value) => String(value ?? "").trim()) || "";
}

function normalizeRevisionDate(value = "") {
  const text = String(value || "").trim();

  if (!text || text === "—") return "";

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  const parsed = new Date(text);

  if (Number.isNaN(parsed.getTime())) return text;

  const year = parsed.getFullYear();

  const month = String(parsed.getMonth() + 1).padStart(2, "0");

  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeRevisionCompetenciesForPayload(competencies = []) {
  if (!Array.isArray(competencies)) return [];

  return competencies
    .map((competency) => {
      const title = String(
        competency?.title ||
          competency?.competency ||
          competency?.competencyName ||
          competency?.label ||
          "",
      ).trim();

      const description = String(
        competency?.description ||
          competency?.details ||
          competency?.competencyDescription ||
          competency?.definition ||
          "",
      ).trim();

      const rawLevel = String(
        competency?.level ||
          competency?.proficiencyLevel ||
          competency?.selectedLevel ||
          "",
      )
        .trim()
        .toLowerCase();

      const level =
        rawLevel === "average"
          ? "Average"
          : rawLevel === "proficient"
            ? "Proficient"
            : rawLevel === "excellent"
              ? "Excellent"
              : Number(competency?.average) === 1 ||
                  competency?.average === true
                ? "Average"
                : Number(competency?.proficient) === 1 ||
                    competency?.proficient === true
                  ? "Proficient"
                  : Number(competency?.excellent) === 1 ||
                      competency?.excellent === true
                    ? "Excellent"
                    : "";

      return {
        id: competency?.id || null,

        title,

        description,

        level,

        average: level === "Average" ? 1 : 0,

        proficient: level === "Proficient" ? 1 : 0,

        excellent: level === "Excellent" ? 1 : 0,
      };
    })
    .filter((competency) => competency.title || competency.description);
}

function buildFallbackRevisionDraftPayload(
  item = {},
  editedChangeDetails = [],
) {
  const raw = item?.raw || {};

  const documentTitle = getFirstValue(
    item.documentTitle,
    item.document_title,
    raw.documentTitle,
    raw.document_title,
  );

  const roleTitle = getFirstValue(
    item.roleTitle,
    item.role_title,
    raw.roleTitle,
    raw.role_title,
    documentTitle,
  );

  const accountId = getFirstValue(
    item.accountId,
    item.account_id,
    raw.accountId,
    raw.account_id,
  );

  const departmentId = getFirstValue(
    item.departmentId,
    item.department_id,
    raw.departmentId,
    raw.department_id,
  );

  return {
    existingJdId: getFirstValue(
      item.existingJdId,
      item.existing_jd_id,
      raw.existingJdId,
      raw.existing_jd_id,
      item.linkedHiringRequirement,
      item.linked_hiring_requirement,
      raw.linkedHiringRequirement,
      raw.linked_hiring_requirement,
    ),

    documentTitle,

    document_title: documentTitle,

    roleTitle,

    role_title: roleTitle,

    accountId,

    account_id: accountId,

    account: getFirstValue(
      item.account,
      item.preparedFor,
      raw.account,
      raw.preparedFor,
    ),

    preparedFor: getFirstValue(
      item.preparedFor,
      item.account,
      raw.preparedFor,
      raw.account,
    ),

    prepared_for: getFirstValue(
      item.prepared_for,
      item.account,
      raw.prepared_for,
      raw.account,
    ),

    departmentId,

    department_id: departmentId,

    department: getFirstValue(item.department, raw.department),

    effectiveDate: normalizeRevisionDate(
      getFirstValue(
        item.effectiveDate,
        item.effective_date,
        raw.effectiveDate,
        raw.effective_date,
      ),
    ),

    effective_date: normalizeRevisionDate(
      getFirstValue(
        item.effectiveDate,
        item.effective_date,
        raw.effectiveDate,
        raw.effective_date,
      ),
    ),

    reportsTo: getFirstValue(
      item.reportsTo,
      item.reports_to,
      raw.reportsTo,
      raw.reports_to,
    ),

    reports_to: getFirstValue(
      item.reports_to,
      item.reportsTo,
      raw.reports_to,
      raw.reportsTo,
    ),

    supervisory: getFirstValue(item.supervisory, raw.supervisory, "No"),

    description: getFirstValue(item.description, raw.description),

    responsibilities: getFirstValue(
      item.responsibilities,
      raw.responsibilities,
    ),

    qualifications: getFirstValue(item.qualifications, raw.qualifications),

    personalityType: getFirstValue(
      item.personalityType,
      item.personality_type,
      item.preferredPersonalityType,
      item.preferred_personality_type,
      raw.personalityType,
      raw.personality_type,
    ),

    personality_type: getFirstValue(
      item.personality_type,
      item.personalityType,
      raw.personality_type,
      raw.personalityType,
    ),

    remarks: getFirstValue(item.remarks, raw.remarks),

    competencies: normalizeRevisionCompetenciesForPayload(
      item.competencies ||
        item.desiredCompetencies ||
        raw.competencies ||
        raw.desiredCompetencies ||
        [],
    ),

    changeDetails: editedChangeDetails,
  };
}

const HIDDEN_EDIT_CHANGE_KEYS = new Set([
  "departmentId",
  "accountId",
  "preparedForId",
  "existingJdId",
  "jdCode",
  "currentVersion",
  "dateRequested",
  "createdBy",
  "lastUpdated",
]);

function getVisibleEditedChanges(changes = []) {
  return Array.isArray(changes)
    ? changes.filter((change) => {
        const key = String(change?.key || "").trim();

        return key && !HIDDEN_EDIT_CHANGE_KEYS.has(key);
      })
    : [];
}

/* =====================================================
PAGE
===================================================== */

export default function JobDescriptionViewPage() {
  const navigate = useNavigate();

  const location = useLocation();

  const { id } = useParams();

  const { user } = useUser();

  const { canArchive, canRestore, canDelete } =
    getJobDescriptionActionAccess(user);

  /* =====================================================
     NEW - PERMANENT DELETION HOOK
  ===================================================== */

  const deletion = useJobDescriptionDeletion();

  const approvalPage =
    location.pathname.includes("/approval-request/job-description/view") ||
    location.pathname.includes("/approval-requests/job-description/view");

  const [activeDetailTab, setActiveDetailTab] = useState("Details");

  const [hasEditedChanges, setHasEditedChanges] = useState(false);

  const [editedChangeDetails, setEditedChangeDetails] = useState([]);

  const [showEditedChanges, setShowEditedChanges] = useState(false);

  const [saving, setSaving] = useState(false);

  const [canApproveJobDescription, setCanApproveJobDescription] =
    useState(false);
  const approvalRuleRevision = useApprovalRuleRevision("jobDescription");

  const [pageReady, setPageReady] = useState(false);

  const [revisionEditorOpen, setRevisionEditorOpen] = useState(false);

  const [revisionForm, setRevisionForm] = useState({
    revisionRemarks: "",
  });

  const [revisionDraftPayload, setRevisionDraftPayload] = useState(null);

  const [saveAsNewVersionModal, setSaveAsNewVersionModal] = useState({
    open: false,
    revisionRemarks: "",
  });

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
    onCloseAction: null,
  });

  const [recordActionModal, setRecordActionModal] = useState({
    open: false,
    action: "archive",
    pending: false,
  });

  const tabRefs = useRef({});

  const contentScrollRef = useRef(null);

  const lastScrollTopRef = useRef(0);

  const [tabIndicator, setTabIndicator] = useState({
    left: 0,
    width: 0,
  });

  const [headerHidden, setHeaderHidden] = useState(false);

  const {
    selectedJobDescription,
    updateSelectedJobDescription,
    closeJobDescriptionDetails,
    revisionComments,
    setRevisionComments,
    loadRevisionComments,
    clearRevisionComments,
    saveRevisionComments,
    revisionCommentsLoading,
  } = useJobDescription();

  const stateItem =
    location.state?.jobDescription ||
    location.state?.item ||
    location.state?.selectedJobDescription ||
    null;

  /* =====================================================
  INITIALIZE
  ===================================================== */

  useEffect(() => {
    const normalizedItem = normalizePageJobDescription(stateItem, approvalPage);

    if (normalizedItem) {
      updateSelectedJobDescription?.(normalizedItem);

      setPageReady(true);

      return;
    }

    if (selectedJobDescription) {
      setPageReady(true);
    }

    // selectedJobDescription intentionally omitted here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateItem, approvalPage, updateSelectedJobDescription]);

  useEffect(() => {
    return () => {
      clearRevisionComments?.();

      setRevisionComments?.([]);

      closeJobDescriptionDetails?.();

      updateSelectedJobDescription?.(null);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const item = selectedJobDescription;

  useEffect(() => {
    const currentUserSibsId = getCurrentUserSibsId(user);
    let cancelled = false;

    if (!currentUserSibsId) {
      setCanApproveJobDescription(false);
      return undefined;
    }

    async function loadApprovalAccess() {
      try {
        const result = await getJobDescriptionApprovalUsers();
        const isConfiguredApprover = getApprovalUsers(result).some(
          (approvalUser) =>
            getApprovalUserSibsId(approvalUser) === currentUserSibsId,
        );

        if (!cancelled) {
          setCanApproveJobDescription(isConfiguredApprover);
        }
      } catch (error) {
        console.error("CHECK JD APPROVAL ACCESS ERROR:", error);

        if (!cancelled) {
          setCanApproveJobDescription(false);
        }
      }
    }

    loadApprovalAccess();

    return () => {
      cancelled = true;
    };
  }, [approvalRuleRevision, user]);

  /* =====================================================
  LOAD COMPLETE JD
  ===================================================== */

  useEffect(() => {
    if (!pageReady || !item) return;

    const jdId = getJobDescriptionId();

    if (!jdId) return;

    let cancelled = false;

    async function loadFullJobDescription() {
      const result = await getJobDescriptionById(jdId);

      if (cancelled || !result?.success || !result?.data) {
        return;
      }

      updateSelectedJobDescription?.(
        normalizePageJobDescription(result.data, approvalPage),
      );
    }

    loadFullJobDescription();

    return () => {
      cancelled = true;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageReady, item?.id, item?.rawId]);

  const hasRevisionComments = revisionComments.length > 0;

  const primaryButtonLabel = hasRevisionComments
    ? "Save"
    : hasEditedChanges
      ? "Save as New Version"
      : "Approve";

  const primaryButtonTitle = hasRevisionComments
    ? "Save this job description as tagged for revision."
    : hasEditedChanges
      ? "Save the edited job description as a new version."
      : "Approve job description.";

  /* =====================================================
  REVISION COMMENTS
  ===================================================== */

  useEffect(() => {
    if (!pageReady || !item) {
      clearRevisionComments?.();

      return;
    }

    const jdId = getJobDescriptionId();

    if (!jdId) {
      clearRevisionComments?.();

      return;
    }

    if (!shouldLoadRevisionComments()) {
      clearRevisionComments?.();

      return;
    }

    loadRevisionComments?.(jdId, {
      revisionNo: getSelectedRevisionNo(),
    });
  }, [
    pageReady,
    item?.id,
    item?.rawId,
    item?.jdStatus,
    item?.status,
    item?.currentVersion,
    item?.revisionNo,
  ]);

  useEffect(() => {
    if (!pageReady) return;

    setRevisionComments?.([]);

    setHasEditedChanges(false);

    setEditedChangeDetails([]);

    setShowEditedChanges(false);

    setSaving(false);

    setRevisionEditorOpen(false);

    setRevisionForm({
      revisionRemarks: "",
    });

    setRevisionDraftPayload(null);

    setSaveAsNewVersionModal({
      open: false,
      revisionRemarks: "",
    });
  }, [pageReady, item?.id, item?.rawId]);

  /* =====================================================
  TAB
  ===================================================== */

  useLayoutEffect(() => {
    const activeButton = tabRefs.current[activeDetailTab];

    if (!activeButton) return;

    setTabIndicator({
      left: activeButton.offsetLeft,
      width: activeButton.offsetWidth,
    });
  }, [activeDetailTab, pageReady, item?.id, item?.rawId, headerHidden]);

  useEffect(() => {
    setHeaderHidden(false);

    lastScrollTopRef.current = 0;

    contentScrollRef.current?.scrollTo?.({
      top: 0,
      left: 0,
    });
  }, [activeDetailTab, item?.id, item?.rawId]);

  /* =====================================================
  STATUS MODAL
  ===================================================== */

  function openStatus({
    type = "success",
    title = "",
    message = "",
    onCloseAction = null,
  }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
      onCloseAction,
    });
  }

  function closeStatusModal() {
    const action = statusModal.onCloseAction;

    setStatusModal({
      open: false,
      type: "success",
      title: "",
      message: "",
      onCloseAction: null,
    });

    if (action) {
      action();
    }
  }

  /* =====================================================
  NAVIGATION
  ===================================================== */

  function handleBack() {
    clearRevisionComments?.();

    setRevisionComments?.([]);

    closeJobDescriptionDetails?.();

    updateSelectedJobDescription?.(null);

    if (approvalPage) {
      navigate("/approval-request", {
        replace: true,
        state: {
          activeModule: "Job Description",
        },
      });

      return;
    }

    navigate(-1);
  }

  /* =====================================================
  RECORD ACTIONS
  ===================================================== */

  function openRecordAction(action) {
    setRecordActionModal({
      open: true,
      action,
      pending: false,
    });
  }

  function closeRecordAction() {
    if (recordActionModal.pending) {
      return;
    }

    setRecordActionModal({
      open: false,
      action: "archive",
      pending: false,
    });
  }

  async function confirmRecordAction() {
    if (recordActionModal.pending) {
      return;
    }

    const jdId = getJobDescriptionId();

    const action = recordActionModal.action;

    const isDelete = action === "delete";

    const isRestore = action === "restore";

    if (!jdId) {
      setRecordActionModal({
        open: false,
        action: "archive",
        pending: false,
      });

      openStatus({
        type: "error",
        title: "Invalid Job Description",
        message: "Unable to identify the selected job description.",
      });

      return;
    }

    setRecordActionModal((current) => ({
      ...current,
      pending: true,
    }));

    try {
      const result = isDelete
        ? await deleteJobDescription(jdId)
        : isRestore
          ? await restoreJobDescription(jdId)
          : await archiveJobDescription(jdId);

      setRecordActionModal({
        open: false,
        action: "archive",
        pending: false,
      });

      if (!result?.success) {
        openStatus({
          type: "error",

          title: isDelete
            ? "Delete Failed"
            : isRestore
              ? "Restore Failed"
              : "Archive Failed",

          message:
            result?.message ||
            `Failed to ${
              isDelete ? "delete" : isRestore ? "restore" : "archive"
            } the job description.`,
        });

        return;
      }

      if (isRestore) {
        const freshResult = await getJobDescriptionById(jdId);

        if (freshResult?.success && freshResult?.data) {
          updateSelectedJobDescription?.(
            normalizePageJobDescription(freshResult.data, approvalPage),
          );
        } else if (result?.data) {
          updateSelectedJobDescription?.({
            ...item,

            ...result.data,

            jdStatus:
              result.data.jdStatus ||
              result.data.jd_status ||
              result.data.status ||
              "Existing",

            jd_status:
              result.data.jd_status ||
              result.data.jdStatus ||
              result.data.status ||
              "Existing",

            status:
              result.data.status ||
              result.data.jdStatus ||
              result.data.jd_status ||
              "Existing",

            raw: {
              ...(item?.raw || {}),
              ...(result.data || {}),
            },
          });
        }

        openStatus({
          type: "success",
          title: "Job Description Restored",
          message:
            result?.message || "The job description was restored successfully.",
        });

        return;
      }

      openStatus({
        type: "success",

        title: isDelete
          ? "Job Description Deleted"
          : "Job Description Archived",

        message:
          result?.message ||
          `The job description was ${
            isDelete ? "deleted" : "archived"
          } successfully.`,

        onCloseAction: handleBack,
      });
    } catch (error) {
      setRecordActionModal({
        open: false,
        action: "archive",
        pending: false,
      });

      openStatus({
        type: "error",

        title: isDelete
          ? "Delete Failed"
          : isRestore
            ? "Restore Failed"
            : "Archive Failed",

        message:
          error?.response?.data?.message ||
          error?.message ||
          `Something went wrong while ${
            isDelete ? "deleting" : isRestore ? "restoring" : "archiving"
          } the job description.`,
      });
    }
  }

  /* =====================================================
     NEW - OPEN STRICT PERMANENT DELETION
  ===================================================== */

  async function handleOpenPermanentDeletion() {
    const jdId = getJobDescriptionId();

    if (!jdId) {
      openStatus({
        type: "error",
        title: "Invalid Job Description",
        message: "Unable to identify the selected job description.",
      });

      return;
    }

    const result = await deletion.openDeletionModal(jdId);

    if (!result?.success) {
      openStatus({
        type: "error",
        title: "Unable to Load Deletion Details",
        message:
          result?.message ||
          "Failed to inspect linked Job Description records.",
      });
    }
  }

  /* =====================================================
     NEW - PERMANENT DELETE
  ===================================================== */

  async function handlePermanentDelete({
    confirmation,
    acknowledgePermanentDeletion,
    acknowledgeLinkedRecords,
    reason = "",
  }) {
    const jdId = getJobDescriptionId();

    if (!jdId) {
      openStatus({
        type: "error",
        title: "Invalid Job Description",
        message: "Unable to identify the selected job description.",
      });

      return;
    }

    const result = await deletion.permanentlyDelete(jdId, {
      confirmation,
      acknowledgePermanentDeletion,
      acknowledgeLinkedRecords,
      reason,
    });

    if (!result?.success) {
      openStatus({
        type: "error",
        title: "Permanent Deletion Failed",
        message:
          result?.message ||
          "Failed to permanently delete the Job Description.",
      });

      return;
    }

    openStatus({
      type: "success",
      title: "Job Description Permanently Deleted",
      message:
        result?.message ||
        "The Job Description was permanently deleted and recorded in the deletion audit log.",
      onCloseAction: handleBack,
    });
  }

  /* =====================================================
     NEW - ARCHIVE INSTEAD FROM STRICT DELETE MODAL

     Reuses your existing archive flow.
  ===================================================== */

  function handleArchiveInsteadFromDeleteModal() {
    deletion.closeDeletionModal();

    openRecordAction("archive");
  }

  /* =====================================================
  PRINT
  ===================================================== */

  function handlePrintJobDescription() {
    const docNode = document.querySelector(".jd-details-document");

    if (!docNode) {
      window.print();

      return;
    }

    const printRoot = document.createElement("div");

    printRoot.id = "jd-print-root";

    printRoot.style.cssText = "display:none;";

    const clone = docNode.cloneNode(true);

    clone
      .querySelectorAll(
        "button, [data-print-hide], .jd-mobile-actions-row, textarea, input, select",
      )
      .forEach((el) => el.remove());

    clone.querySelectorAll("style").forEach((el) => el.remove());

    clone.querySelectorAll("span.inline-flex").forEach((wrapperSpan) => {
      wrapperSpan.classList.remove(
        "inline-flex",
        "items-center",
        "gap-1",
        "align-middle",
      );

      wrapperSpan.classList.add("inline");
    });

    printRoot.appendChild(clone);

    document.body.appendChild(printRoot);

    const isolationStyle = document.createElement("style");

    isolationStyle.id = "jd-print-isolation-style";

    isolationStyle.textContent = [
      "@media print {",
      "  body > *:not(#jd-print-root) { display: none !important; }",
      "  #jd-print-root {",
      "    display: block !important;",
      "    position: static !important;",
      "    background: white !important;",
      "    padding: 0 !important;",
      "    margin: 0 !important;",
      "  }",
      "  #jd-print-root .jd-details-document {",
      "    box-shadow: none !important;",
      "    border-radius: 0 !important;",
      "    max-width: 100% !important;",
      "    width: 100% !important;",
      "    padding: 0 !important;",
      "    overflow: visible !important;",
      "    background: white !important;",
      "    min-height: 0 !important;",
      "    height: auto !important;",
      "  }",
      "  #jd-print-root table, #jd-print-root tr {",
      "    break-inside: avoid !important;",
      "    page-break-inside: avoid !important;",
      "  }",
      "  #jd-print-root .grid > div {",
      "    break-inside: avoid !important;",
      "    page-break-inside: avoid !important;",
      "  }",
      "  #jd-print-root h1, #jd-print-root h2, #jd-print-root h3 {",
      "    break-after: avoid !important;",
      "    page-break-after: avoid !important;",
      "  }",
      '  #jd-print-root [class*="border-amber"][class*="bg-amber"] {',
      "    display: none !important;",
      "  }",
      "  #jd-print-root span[title] {",
      "    background: transparent !important;",
      "    box-shadow: none !important;",
      "    border-radius: 0 !important;",
      "    padding: 0 !important;",
      "  }",
      "  @page { size: A4 portrait; margin: 18mm 16mm; }",
      "}",
    ].join("\n");

    document.head.appendChild(isolationStyle);

    function cleanupPrint() {
      printRoot.remove();

      isolationStyle.remove();

      window.removeEventListener("afterprint", cleanupPrint);
    }

    window.addEventListener("afterprint", cleanupPrint);

    window.print();
  }

  /* =====================================================
  SCROLL
  ===================================================== */

  function handleContentScroll(e) {
    const scrollPanel = e.currentTarget;

    const nextScrollTop = Number(scrollPanel?.scrollTop || 0);

    const previousScrollTop = Number(lastScrollTopRef.current || 0);

    const scrollDelta = nextScrollTop - previousScrollTop;

    const distanceFromBottom = Math.max(
      0,
      Number(scrollPanel?.scrollHeight || 0) -
        Number(scrollPanel?.clientHeight || 0) -
        nextScrollTop,
    );

    if (nextScrollTop <= 16) {
      setHeaderHidden(false);

      lastScrollTopRef.current = nextScrollTop;

      return;
    }

    // Keep the chrome hidden at the end of the document. Showing it changes
    // the panel height and can otherwise create a scroll-clamping feedback loop.
    if (distanceFromBottom <= 24) {
      setHeaderHidden(true);

      lastScrollTopRef.current = nextScrollTop;

      return;
    }

    if (Math.abs(scrollDelta) < 8) {
      lastScrollTopRef.current = nextScrollTop;

      return;
    }

    setHeaderHidden(scrollDelta > 0);

    lastScrollTopRef.current = nextScrollTop;
  }

  /* =====================================================
  STATUS
  ===================================================== */

  function getJdStatusClass(status) {
    switch (normalizeJdStatus(status)) {
      case "Existing":
      case "Active":
      case "Approved":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      case "For Approval":
        return "border-[#FFBFA8] bg-[#FFF3ED] text-sibs-primary-2";

      case "New Job Description":
      case "New JD":
      case "Draft":
        return "border-[#B7D4FF] bg-[#EEF6FF] text-[#1454D9]";

      case "For Revision":
        return "border-[#F6C84C] bg-[#FFF8E6] text-[#9A6400]";

      case "Returned for Revision":
      case "Rejected":
      case "Declined":
        return "border-red-200 bg-red-50 text-red-700";

      case "Archived":
      case "Archived JD":
        return "border-[#D6DEE8] bg-[#F8FAFC] text-[#475467]";

      default:
        return "border-gray-200 bg-gray-50 text-gray-600";
    }
  }

  function getJdStatusLabel(status) {
    const normalizedStatus = normalizeJdStatus(status);

    switch (normalizedStatus) {
      case "Existing":
        return "Existing";

      case "Active":
        return "Active";

      case "Approved":
        return "Approved";

      case "For Revision":
        return "For Revision";

      case "For Approval":
        return "For Approval";

      case "New Job Description":
      case "New JD":
        return "New Job Description";

      case "Draft":
        return "Draft";

      case "Returned for Revision":
        return "Returned for Revision";

      case "Rejected":
        return "Rejected";

      case "Declined":
        return "Declined";

      case "Archived":
      case "Archived JD":
        return "Archived";

      default:
        return normalizedStatus || "—";
    }
  }

  function getDisplayJdStatus() {
    return normalizeJdStatus(
      item?.jdStatus ||
        item?.jd_status ||
        item?.raw?.jdStatus ||
        item?.raw?.jd_status ||
        item?.status ||
        "",
    );
  }

  /* =====================================================
  IDS
  ===================================================== */

  function normalizeViewJdId(value = "") {
    const text = String(value || "").trim();

    if (!text) return 0;

    const withoutPrefix = text.replace(/^JD[-_ ]?/i, "");

    if (/^\d+$/.test(withoutPrefix)) {
      return Number(withoutPrefix);
    }

    return Number(text) || 0;
  }

  function getJobDescriptionId() {
    return (
      normalizeViewJdId(item?.rawId) ||
      normalizeViewJdId(item?.raw_id) ||
      normalizeViewJdId(item?.raw?.id) ||
      normalizeViewJdId(item?.id) ||
      normalizeViewJdId(id) ||
      0
    );
  }

  function getSelectedRevisionNo() {
    return (
      item?.currentVersion ||
      item?.revisionNo ||
      item?.raw?.currentVersion ||
      item?.raw?.revisionNo ||
      ""
    );
  }

  function shouldLoadRevisionComments() {
    const status = normalizeJdStatus(
      item?.jdStatus || item?.raw?.jdStatus || item?.status || "",
    );

    return status === "For Revision";
  }

  /* =====================================================
  SAVE COMMENTS
  ===================================================== */

  async function handleSaveRevisionComments() {
    if (saving || revisionCommentsLoading) {
      return;
    }

    const jdId = getJobDescriptionId();

    if (!jdId) {
      openStatus({
        type: "error",
        title: "Invalid Job Description",
        message: "Unable to identify the selected job description.",
      });

      return;
    }

    if (!revisionComments.length) {
      openStatus({
        type: "error",
        title: "No Revision Comments",
        message: "Please add at least one revision comment.",
      });

      return;
    }

    setSaving(true);

    try {
      const result = await saveRevisionComments(jdId, revisionComments);

      if (!result?.success) {
        openStatus({
          type: "error",
          title: "Save Failed",
          message: result?.message || "Failed to save revision comments.",
        });

        return;
      }

      const updatedItem = {
        ...item,

        jdStatus: "For Revision",

        jd_status: "For Revision",

        status: "For Revision",

        raw: {
          ...(item.raw || {}),

          jdStatus: "For Revision",

          jd_status: "For Revision",

          status: "For Revision",
        },
      };

      updateSelectedJobDescription?.(updatedItem);

      openStatus({
        type: "success",
        title: "Tagged for Revision",
        message:
          result.message ||
          "Revision comments saved and job description was tagged for revision.",
      });
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
  APPROVE
  ===================================================== */

  async function handleApproveJobDescription() {
    if (saving) return;

    const jdId = getJobDescriptionId();

    if (!jdId) {
      openStatus({
        type: "error",
        title: "Invalid Job Description",
        message: "Unable to identify the selected job description.",
      });

      return;
    }

    setSaving(true);

    try {
      const result = await approveJobDescriptionRequest(jdId, {
        remarks: "",
        module: "Job Description",
        type: "Job Description",
      });

      if (!result?.success) {
        openStatus({
          type: "error",
          title: "Approval Failed",
          message: result?.message || "Failed to approve job description.",
        });

        return;
      }

      const updatedItem = {
        ...item,

        jdStatus: "Approved",

        jd_status: "Approved",

        status: "Approved",

        approvalStatus: "Approved",

        approval_status: "Approved",

        approvedBy: result?.data?.approvedBy || result?.data?.approved_by || "",

        approved_by:
          result?.data?.approved_by || result?.data?.approvedBy || "",

        approveRemarks:
          result?.data?.approveRemarks || result?.data?.approve_remarks || "",

        approve_remarks:
          result?.data?.approve_remarks || result?.data?.approveRemarks || "",

        raw: {
          ...(item.raw || {}),

          jdStatus: "Approved",

          jd_status: "Approved",

          status: "Approved",

          approvalStatus: "Approved",

          approval_status: "Approved",

          approvedBy:
            result?.data?.approvedBy || result?.data?.approved_by || "",

          approved_by:
            result?.data?.approved_by || result?.data?.approvedBy || "",

          approveRemarks:
            result?.data?.approveRemarks || result?.data?.approve_remarks || "",

          approve_remarks:
            result?.data?.approve_remarks || result?.data?.approveRemarks || "",
        },
      };

      updateSelectedJobDescription?.(updatedItem);

      openStatus({
        type: "success",
        title: "Job Description Approved",
        message:
          result?.message || "Job description request approved successfully.",
        onCloseAction: handleBack,
      });

      setTimeout(() => {
        setStatusModal({
          open: false,
          type: "success",
          title: "",
          message: "",
          onCloseAction: null,
        });

        handleBack();
      }, 1500);
    } catch (error) {
      openStatus({
        type: "error",
        title: "Approval Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong while approving the job description.",
      });
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
  REVISION
  ===================================================== */

  function handleRevisionDraftChange(nextPayload) {
    setRevisionDraftPayload(nextPayload || null);
  }

  function openSaveAsNewVersionModal() {
    if (!hasEditedChanges) {
      openStatus({
        type: "error",
        title: "No Changes Found",
        message:
          "Please edit and save at least one section before saving a new version.",
      });

      return;
    }

    setSaveAsNewVersionModal({
      open: true,
      revisionRemarks: "",
    });
  }

  function closeSaveAsNewVersionModal() {
    if (saving) return;

    setSaveAsNewVersionModal({
      open: false,
      revisionRemarks: "",
    });
  }

  async function handleSaveAsNewVersion() {
    if (saving) return;

    const jdId = getJobDescriptionId();

    if (!jdId) {
      openStatus({
        type: "error",
        title: "Invalid Job Description",
        message: "Unable to identify the selected job description.",
      });

      return;
    }

    const revisionRemarks =
      String(saveAsNewVersionModal.revisionRemarks || "").trim() ||
      "Saved as new revision version.";

    const finalPayload = {
      ...buildFallbackRevisionDraftPayload(item, editedChangeDetails),

      ...(revisionDraftPayload || {}),

      revisionRemarks,

      revision_remarks: revisionRemarks,

      changeDetails: editedChangeDetails,

      editedChangeDetails,

      revisionComments,
    };

    setSaving(true);

    try {
      const result = await saveJobDescriptionRevision(jdId, finalPayload);

      if (!result?.success) {
        openStatus({
          type: "error",
          title: "Save Failed",
          message:
            result?.message || "Failed to save the job description revision.",
        });

        return;
      }

      const freshResult = await getJobDescriptionById(jdId);

      const updatedItem = normalizePageJobDescription(
        freshResult?.success && freshResult?.data
          ? freshResult.data
          : result.data,
        approvalPage,
      );

      if (updatedItem) {
        updateSelectedJobDescription?.(updatedItem);
      }

      setHasEditedChanges(false);

      setEditedChangeDetails([]);

      setShowEditedChanges(false);

      setRevisionDraftPayload(null);

      setRevisionComments?.([]);

      setSaveAsNewVersionModal({
        open: false,
        revisionRemarks: "",
      });

      setActiveDetailTab("Revision History");

      openStatus({
        type: "success",
        title: "New Version Saved",
        message:
          result?.message ||
          `Job description revision ${
            result?.revisionNo || ""
          } has been saved successfully.`,
      });
    } catch (error) {
      openStatus({
        type: "error",
        title: "Save Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong while saving the job description revision.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handlePrimaryAction() {
    if (hasRevisionComments) {
      await handleSaveRevisionComments();

      return;
    }

    if (hasEditedChanges) {
      openSaveAsNewVersionModal();

      return;
    }

    await handleApproveJobDescription();
  }

  function handleOpenRevisionFromDetails(targetItem) {
    const revisionTarget = targetItem || item;

    if (!revisionTarget) return;

    updateSelectedJobDescription?.(revisionTarget);

    setRevisionForm({
      revisionRemarks: "",
    });

    setRevisionEditorOpen(true);
  }

  function handleCloseRevisionEditor() {
    setRevisionEditorOpen(false);
  }

  function handleRevisionSaved(result) {
    setRevisionEditorOpen(false);

    openStatus({
      type: "success",
      title: "Revision Saved",
      message:
        result?.message ||
        "Job description revision has been saved successfully.",
    });
  }

  /* =====================================================
  EMPTY
  ===================================================== */

  if (!pageReady || !item) {
    return (
      <div className="jd-view-page-shell fixed inset-0 z-[9999] flex flex-col bg-[#EEF2F6] font-jakarta">
        <style>{jdViewAnimationStyles}</style>

        <main className="flex min-h-0 flex-1 items-center justify-center p-6">
          <div className="jd-view-empty-card w-full max-w-3xl rounded-2xl border border-[#E6ECF2] bg-white p-6 shadow-sm">
            <button
              type="button"
              onClick={handleBack}
              className="jd-view-action-button mb-5 inline-flex h-10 items-center gap-2 rounded-lg border border-[#D7DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <h1 className="text-xl font-extrabold text-sibs-primary-1">
              Job description not loaded
            </h1>

            <p className="mt-2 text-sm font-medium leading-6 text-sibs-tertiary-5">
              Please open this page from the Job Description table.
            </p>
          </div>
        </main>
      </div>
    );
  }

  /* =====================================================
  DISPLAY VALUES
  ===================================================== */

  const jdCode =
    item.jdCode ||
    item.jd_code ||
    item.raw?.jdCode ||
    item.raw?.jd_code ||
    "JD";

  const jdDisplayTitle =
    item.documentTitle ||
    item.document_title ||
    item.raw?.documentTitle ||
    item.raw?.document_title ||
    item.roleTitle ||
    item.role_title ||
    item.raw?.roleTitle ||
    item.raw?.role_title ||
    "Job Description";

  const revisionHistory = Array.isArray(item.revisionHistory)
    ? item.revisionHistory
    : [];

  const visibleEditedChangeDetails =
    getVisibleEditedChanges(editedChangeDetails);

  const shouldShowDetails = activeDetailTab === "Details";

  const displayJdStatus = getDisplayJdStatus();

  const normalizedDisplayStatus = normalizeJdStatus(displayJdStatus);

  const isArchived = normalizedDisplayStatus === "Archived";

  const isApproved = normalizedDisplayStatus === "Approved";

  const canShowApprovalAction =
    canApproveJobDescription && normalizedDisplayStatus === "For Approval";

  const canReviewJobDescription =
    normalizedDisplayStatus === "For Approval" && canApproveJobDescription;

  const footerVersion =
    item?.currentVersion ||
    item?.current_version ||
    item?.revisionNo ||
    item?.revision_no ||
    item?.version ||
    "1";

  /* =====================================================
  RENDER
  ===================================================== */

  return (
    <div className="jd-view-page-shell fixed inset-0 z-[9999] flex min-h-0 flex-col overflow-hidden bg-[#EEF2F6] font-jakarta text-sibs-primary-1">
      <style>{jdViewAnimationStyles}</style>

      {/* =================================================
          TOP EDGE HOVER AREA
      ================================================= */}

      <div
        aria-hidden="true"
        onMouseEnter={() => setHeaderHidden(false)}
        className="fixed inset-x-0 top-0 z-[10010] h-5"
      />

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        data-jd-header
        className={`shrink-0 overflow-hidden border-b bg-white transition-all duration-300 ease-in-out ${
          headerHidden
            ? "max-h-0 -translate-y-full border-transparent px-3 py-0 opacity-0 sm:px-6"
            : "max-h-[230px] translate-y-0 border-[#D9E2EC] px-3 pt-3 opacity-100 sm:max-h-[210px] sm:px-6 sm:pt-4"
        }`}
      >
        <div className="jd-view-header-content mx-auto flex w-full max-w-[1760px] flex-col gap-3 sm:gap-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
            <div className="min-w-0">
              <div className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1/80">
                Job Description Overview
              </div>

              <h1 className="mt-1 min-w-0 break-words text-sm font-extrabold leading-tight text-sibs-primary-1 sm:text-xl">
                {jdCode} • {jdDisplayTitle}
              </h1>

              <p className="mt-1 text-xs font-semibold text-[#475467] sm:text-sm">
                {item.department || "—"} • {item.account || "—"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <span
                className={`inline-flex w-fit min-w-[92px] shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-3 py-1.5 text-center text-[11px] font-extrabold leading-none sm:px-3.5 sm:text-xs ${getJdStatusClass(
                  displayJdStatus,
                )}`}
              >
                {getJdStatusLabel(displayJdStatus)}
              </span>
            </div>
          </div>

          <div className="relative flex gap-5 overflow-x-auto text-sm font-bold text-[#344054] no-scrollbar sm:gap-8">
            <span
              className="absolute bottom-0 h-[2px] rounded-full bg-blue-500 transition-all duration-300 ease-in-out"
              style={{
                left: `${tabIndicator.left}px`,
                width: `${tabIndicator.width}px`,
              }}
            />

            {detailTabs.map((tab) => {
              const isActive = activeDetailTab === tab;

              return (
                <button
                  key={tab}
                  ref={(el) => {
                    tabRefs.current[tab] = el;
                  }}
                  type="button"
                  onClick={() => setActiveDetailTab(tab)}
                  className={`jd-view-tab-button relative z-10 whitespace-nowrap px-2 pb-3 transition sm:px-4 ${
                    isActive
                      ? "text-blue-600"
                      : "text-[#344054] hover:text-blue-600"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#EEF2F6]">
        {shouldShowDetails && (
          <div
            data-jd-print-fab
            className="pointer-events-none absolute right-3 top-3 z-[30] sm:right-6 sm:top-5"
          >
            <PrintApprovalAction
              onClick={handlePrintJobDescription}
              disabled={saving}
            />
          </div>
        )}

        <div
          ref={contentScrollRef}
          data-jd-scroll-panel
          onScroll={handleContentScroll}
          className="thin-scroll h-full overscroll-contain overflow-y-auto px-2.5 py-4 sm:px-5 sm:py-7 lg:px-8"
        >
          <div key={activeDetailTab} className="jd-view-content-panel">
            {shouldShowDetails && (
              <Details
                onOpenRevision={handleOpenRevisionFromDetails}
                hasEditedChanges={hasEditedChanges}
                onEditedChange={setHasEditedChanges}
                editedChangeDetails={editedChangeDetails}
                setEditedChangeDetails={setEditedChangeDetails}
                onRevisionDraftChange={handleRevisionDraftChange}
                approvalPage={canReviewJobDescription}
                interactivePage={
                  canReviewJobDescription ||
                  normalizedDisplayStatus === "For Revision"
                }
              />
            )}

            {activeDetailTab === "Revision History" && (
              <div className="mx-auto w-full max-w-[900px] rounded-2xl bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-6">
                <RevisionHistory
                  revisionHistory={revisionHistory}
                  item={item}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =================================================
          FOOTER
      ================================================= */}

      <div
        className={`jd-view-footer shrink-0 overflow-hidden border-t bg-white transition-all duration-300 ease-in-out ${
          headerHidden
            ? "max-h-0 translate-y-full border-transparent px-5 py-0 opacity-0 sm:px-7"
            : "max-h-[140px] translate-y-0 border-[#D9E2EC] px-5 py-3 opacity-100 [padding-bottom:calc(0.75rem+env(safe-area-inset-bottom))] sm:px-7"
        }`}
      >
        <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="whitespace-nowrap text-[11px] font-medium text-[#667085] sm:text-xs">
              Document Code:{" "}
              <span className="font-extrabold text-sibs-primary-1">
                {jdCode}
              </span>
              <span className="mx-1 text-[#98A2B3]">•</span>
              Version:{" "}
              <span className="font-extrabold text-sibs-primary-1">
                v{footerVersion}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {!hasRevisionComments && hasEditedChanges && (
              <>
                <div className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-amber-200 bg-amber-50 px-3 text-xs font-extrabold text-amber-700">
                  <AlertTriangle size={15} />
                  Tagged for revision
                </div>

                <button
                  type="button"
                  onClick={() => setShowEditedChanges(true)}
                  className="jd-view-action-button inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-[#D7DEE8] bg-white px-3 text-xs font-extrabold text-sibs-primary-1 shadow-sm hover:border-sibs-primary-1 hover:bg-[#F8FAFC]"
                >
                  <Eye size={15} />
                  View Changes
                </button>
              </>
            )}

            {canRestore && isArchived && (
              <button
                type="button"
                onClick={() => openRecordAction("restore")}
                disabled={recordActionModal.pending || saving}
                className="jd-view-action-button inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-[#D7DEE8] bg-white px-3.5 text-xs font-extrabold text-sibs-primary-1 shadow-sm hover:border-emerald-400 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArchiveRestore size={15} className="text-emerald-700" />
                Restore
              </button>
            )}

            {canArchive && isApproved && (
              <button
                type="button"
                onClick={() => openRecordAction("archive")}
                disabled={recordActionModal.pending || saving}
                className="jd-view-action-button inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[#D7DEE8] bg-white px-3.5 text-xs font-extrabold text-sibs-primary-1 shadow-sm transition hover:border-[#FFB000] hover:bg-[#FFFDF5] hover:text-[#042C51] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Archive size={15} className="text-[#FF7A00]" />
                Archive
              </button>
            )}

            {/* =================================================
                CHANGED ONLY:
                DELETE NOW OPENS STRICT DELETION MODAL
            ================================================= */}

            {canDelete && (
              <button
                type="button"
                onClick={handleOpenPermanentDeletion}
                disabled={recordActionModal.pending || saving}
                className="jd-view-action-button inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-red-200 bg-white px-3.5 text-xs font-extrabold text-red-600 shadow-sm hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={15} />
                Delete
              </button>
            )}

            {canShowApprovalAction && (
              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={saving}
                title={primaryButtonTitle}
                className={`jd-view-action-button inline-flex h-9 items-center justify-center gap-2 rounded-[10px] px-4 text-xs font-extrabold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-70 ${
                  hasRevisionComments
                    ? "bg-sibs-primary-2 hover:opacity-90"
                    : "bg-sibs-primary-1 hover:opacity-90"
                }`}
              >
                {saving && <Loader2 size={15} className="animate-spin" />}

                {saving ? "Saving..." : primaryButtonLabel}
              </button>
            )}

            <div className="mx-1 hidden h-8 w-px bg-[#D9E2EC] sm:block" />

            <button
              type="button"
              onClick={handleBack}
              disabled={saving}
              className="jd-view-action-button inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] px-4 text-xs font-extrabold text-sibs-primary-1 shadow-sm hover:border-sibs-primary-1 hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowLeft size={15} />
              Back to Job Descriptions
            </button>
          </div>
        </div>
      </div>

      {/* =================================================
          EDITED CHANGES
      ================================================= */}

      {showEditedChanges && (
        <div className="jd-view-overlay sibs-modal-blur fixed inset-0 z-[10000] flex items-end justify-center px-3 pb-3 pt-6 sm:items-center sm:px-4 sm:py-4">
          <div
            className="jd-view-dialog max-h-[94dvh] w-full max-w-3xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#E6ECF2] px-5 py-4">
              <div>
                <h3 className="text-base font-extrabold text-[#101828]">
                  Edited Changes
                </h3>

                <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                  Review the fields that will be saved as a new version.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowEditedChanges(false)}
                className="rounded-lg px-3 py-1 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
              >
                Close
              </button>
            </div>

            <div className="thin-scroll max-h-[65dvh] overflow-y-auto p-4 sm:p-5">
              {visibleEditedChangeDetails.length > 0 ? (
                <div className="space-y-3">
                  {visibleEditedChangeDetails.map((change) => (
                    <div
                      key={change.key}
                      className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                    >
                      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <h4 className="text-sm font-extrabold text-[#101828]">
                          {change.label}
                        </h4>

                        <span className="w-fit rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold text-sibs-primary-1">
                          Edited
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-[#E6ECF2] bg-white p-3">
                          <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70">
                            Previous Value
                          </p>

                          <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-[#667085]">
                            {change.oldValue || "—"}
                          </p>
                        </div>

                        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                          <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70">
                            New Value
                          </p>

                          <p className="mt-2 whitespace-pre-line text-sm font-bold leading-6 text-sibs-primary-1">
                            {change.newValue || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-6 text-center">
                  <p className="text-sm font-semibold text-sibs-tertiary-5">
                    No edited changes detected.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-[#E6ECF2] bg-[#F8FAFC] px-4 py-4 sm:px-5">
              <button
                type="button"
                onClick={() => setShowEditedChanges(false)}
                className="jd-view-action-button inline-flex h-10 w-full items-center justify-center rounded-lg bg-sibs-primary-1 px-5 text-sm font-extrabold text-white hover:opacity-90 sm:w-auto"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          SAVE AS NEW VERSION
      ================================================= */}

      {saveAsNewVersionModal.open && (
        <div className="jd-view-overlay sibs-modal-blur fixed inset-0 z-[10000] flex items-end justify-center px-3 pb-3 pt-6 sm:items-center sm:px-4 sm:py-4">
          <div
            className="jd-view-dialog max-h-[94dvh] w-full max-w-xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#E6ECF2] px-5 py-4">
              <div>
                <h3 className="text-base font-extrabold text-[#101828]">
                  Save as New Version
                </h3>

                <p className="mt-1 text-sm font-medium leading-6 text-sibs-tertiary-5">
                  Add a short note explaining what changed in this revision.
                  This is optional.
                </p>
              </div>

              <button
                type="button"
                onClick={closeSaveAsNewVersionModal}
                disabled={saving}
                className="rounded-lg px-3 py-1 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 px-4 py-4 sm:px-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-sm font-bold leading-6 text-sibs-primary-1">
                  This will create a new revision history entry, update the JD
                  record with your saved edits, and resolve open revision
                  comments for this JD.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-extrabold text-sibs-primary-1">
                  Revision Remarks{" "}
                  <span className="text-sibs-tertiary-5">(optional)</span>
                </label>

                <textarea
                  value={saveAsNewVersionModal.revisionRemarks}
                  onChange={(event) =>
                    setSaveAsNewVersionModal((prev) => ({
                      ...prev,

                      revisionRemarks: event.target.value,
                    }))
                  }
                  rows={5}
                  placeholder="Example: Updated record information and revised responsibilities based on reviewer comments."
                  className="w-full resize-none rounded-xl border border-[#D7DEE8] bg-white px-4 py-3 text-sm font-semibold leading-6 text-sibs-primary-1 outline-none transition placeholder:text-slate-400 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                />
              </div>

              {visibleEditedChangeDetails.length > 0 && (
                <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70">
                    Changes to save
                  </p>

                  <p className="mt-1 text-sm font-bold text-sibs-primary-1">
                    {visibleEditedChangeDetails.length} edited field
                    {visibleEditedChangeDetails.length > 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[#E6ECF2] bg-[#F8FAFC] px-4 py-4 sm:flex-row sm:justify-end sm:px-5">
              <button
                type="button"
                onClick={closeSaveAsNewVersionModal}
                disabled={saving}
                className="jd-view-action-button inline-flex h-10 w-full items-center justify-center rounded-lg border border-[#D7DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveAsNewVersion}
                disabled={saving}
                className="jd-view-action-button inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-sibs-primary-1 px-5 text-sm font-extrabold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}

                {saving ? "Saving..." : "Save as New Version"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          REVISION EDITOR
      ================================================= */}

      <ReviseJobDescriptionModal
        open={revisionEditorOpen}
        item={item}
        form={revisionForm}
        setForm={setRevisionForm}
        onClose={handleCloseRevisionEditor}
        onSubmit={handleRevisionSaved}
      />

      {/* =================================================
          NEW - STRICT PERMANENT DELETION MODAL
      ================================================= */}

      <DeleteJobDescriptionModal
        open={deletion.open}
        loading={deletion.loading}
        deleting={deletion.deleting}
        impact={deletion.impact}
        onClose={deletion.closeDeletionModal}
        onArchiveInstead={handleArchiveInsteadFromDeleteModal}
        onPermanentDelete={handlePermanentDelete}
      />

      {/* =================================================
          ARCHIVE / RESTORE / OLD DELETE FLOW

          Kept untouched.
          The normal Delete button no longer opens the old delete
          confirmation, but the existing logic remains here.
      ================================================= */}

      <StatusModal
        open={recordActionModal.open}
        type={recordActionModal.pending ? "loading" : "confirm"}
        title={
          recordActionModal.pending
            ? recordActionModal.action === "delete"
              ? "Deleting Job Description"
              : recordActionModal.action === "restore"
                ? "Restoring Job Description"
                : "Archiving Job Description"
            : recordActionModal.action === "delete"
              ? "Delete Job Description?"
              : recordActionModal.action === "restore"
                ? "Restore Job Description?"
                : "Archive Job Description?"
        }
        message={
          recordActionModal.pending
            ? recordActionModal.action === "restore"
              ? "Please wait while the job description is being restored."
              : "Please wait while the job description is being updated."
            : recordActionModal.action === "delete"
              ? "This job description will be removed from active records. This action is limited to Super Admin users."
              : recordActionModal.action === "restore"
                ? "This archived job description will be restored and returned to the active Job Description records."
                : "This job description will remain available in history with an Archived status."
        }
        confirmLabel={
          recordActionModal.action === "delete"
            ? "Delete"
            : recordActionModal.action === "restore"
              ? "Restore"
              : "Archive"
        }
        confirmTone={recordActionModal.action === "delete" ? "danger" : "brand"}
        onConfirm={confirmRecordAction}
        onCancel={closeRecordAction}
        lockScroll
      />

      {/* =================================================
          GENERAL STATUS
      ================================================= */}

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={closeStatusModal}
      />
    </div>
  );
}

/* =====================================================
PRINT ACTION
===================================================== */

function PrintApprovalAction({ onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="pointer-events-auto flex h-12 w-12 flex-col items-center justify-center gap-1 rounded-2xl border border-[#DDE7F3] bg-white text-sibs-primary-1 shadow-[0_10px_24px_rgba(4,44,81,0.12)] transition hover:-translate-y-0.5 hover:border-sibs-primary-1 hover:shadow-[0_18px_36px_rgba(4,44,81,0.18)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:h-[74px] sm:w-[74px] sm:gap-2 sm:shadow-[0_14px_30px_rgba(4,44,81,0.14)]"
      title="Print job description"
    >
      <Printer
        size={18}
        strokeWidth={2.2}
        className="sm:h-[22px] sm:w-[22px]"
      />

      <span className="text-[10px] font-extrabold leading-none sm:text-xs">
        Print
      </span>
    </button>
  );
}
