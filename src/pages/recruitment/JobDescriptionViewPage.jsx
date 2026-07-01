import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  Loader2,
  Printer,
} from "lucide-react";

import StatusModal from "../../components/modals/StatusModal";
import Details from "../../components/layout/tabs/JobDescriptionView/Details";
import RevisionHistory from "../../components/layout/tabs/JobDescriptionView/RevisionHistory";
import ReviseJobDescriptionModal from "../../components/modals/jobDescription/ReviseJobDescriptionModal";
import { normalizeJdStatus } from "../../lib/utils/NormalizeJDStatus";
import { useJobDescription } from "../../services/context/JobDescriptionContext";
import { approveJobDescriptionRequest } from "../../lib/axios/getApprovalRequest";

const detailTabs = ["Details", "Revision History"];

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

  .jd-view-tab-button:hover {
    transform: translateY(-1px);
  }

  .jd-view-action-button {
    transition:
      transform 180ms ease,
      border-color 180ms ease,
      background-color 180ms ease,
      opacity 180ms ease;
  }

  .jd-view-action-button:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .jd-view-action-button:active:not(:disabled) {
    transform: scale(0.98);
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
    responsibilities:
      request?.responsibilities || raw?.responsibilities || "",
    qualifications: request?.qualifications || raw?.qualifications || "",
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

export default function JobDescriptionViewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const approvalPage =
    location.pathname.includes("/approval-request/job-description/view") ||
    location.pathname.includes("/approval-requests/job-description/view");

  const [activeDetailTab, setActiveDetailTab] = useState("Details");
  const [hasEditedChanges, setHasEditedChanges] = useState(false);
  const [editedChangeDetails, setEditedChangeDetails] = useState([]);
  const [showEditedChanges, setShowEditedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [revisionEditorOpen, setRevisionEditorOpen] = useState(false);
  const [revisionForm, setRevisionForm] = useState({
    revisionRemarks: "",
  });

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
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

  useEffect(() => {
    const normalizedItem = normalizePageJobDescription(stateItem, approvalPage);

    if (normalizedItem) {
      updateSelectedJobDescription?.(normalizedItem);
      setPageReady(true);
      return;
    }

    setPageReady(Boolean(selectedJobDescription));
  }, [stateItem, approvalPage, updateSelectedJobDescription]);

  useEffect(() => {
    return () => {
      clearRevisionComments?.();
      setRevisionComments?.([]);
      closeJobDescriptionDetails?.();
      updateSelectedJobDescription?.(null);
    };
    // Run only when leaving this full-page view.
    // This prevents the old JD modal from opening again when returning back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const item = selectedJobDescription;
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
  }, [pageReady, item?.id, item?.rawId]);

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
    contentScrollRef.current?.scrollTo?.({ top: 0, left: 0 });
  }, [activeDetailTab, item?.id, item?.rawId]);

  function openStatus({ type = "success", title = "", message = "" }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
  }

  function closeStatusModal() {
    setStatusModal({
      open: false,
      type: "success",
      title: "",
      message: "",
    });
  }

  function handleBack() {
    clearRevisionComments?.();
    setRevisionComments?.([]);
    closeJobDescriptionDetails?.();
    updateSelectedJobDescription?.(null);

    if (approvalPage) {
      navigate("/approval-request", {
        replace: true,
        state: { activeModule: "Job Description" },
      });
      return;
    }

    navigate(-1);
  }

  function handlePrintJobDescription() {
    window.print();
  }

  function handleContentScroll(e) {
    const nextScrollTop = Number(e.currentTarget?.scrollTop || 0);
    const previousScrollTop = Number(lastScrollTopRef.current || 0);
    const scrollDelta = nextScrollTop - previousScrollTop;

    if (nextScrollTop <= 16) {
      setHeaderHidden(false);
      lastScrollTopRef.current = nextScrollTop;
      return;
    }

    if (Math.abs(scrollDelta) < 8) return;

    setHeaderHidden(scrollDelta > 0);
    lastScrollTopRef.current = nextScrollTop;
  }

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

  function getJobDescriptionId() {
    return Number(item?.rawId || item?.raw?.id || item?.id || id || 0);
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

  async function handleSaveRevisionComments() {
    if (saving || revisionCommentsLoading) return;

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
        approved_by: result?.data?.approved_by || result?.data?.approvedBy || "",
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
      });
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

  async function handlePrimaryAction() {
    if (hasRevisionComments) {
      await handleSaveRevisionComments();
      return;
    }

    if (hasEditedChanges) {
      openStatus({
        type: "info",
        title: "Not Yet Connected",
        message: "Save as New Version action is not connected yet.",
      });
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

  const jdTitle = `${item.roleTitle || "Job Description"} - Version ${
    item.revisionNo || item.currentVersion || "1"
  }.0`;

  const jdCode = item.jdCode || item.jd_code || item.raw?.jdCode || item.raw?.jd_code || "JD";
  const jdScreenTitle = `${jdCode} • ${item.roleTitle || "Job Description"}`;

  const revisionHistory = Array.isArray(item.revisionHistory)
    ? item.revisionHistory
    : [];

  const shouldShowDetails = activeDetailTab === "Details";
  const displayJdStatus = getDisplayJdStatus();

  return (
    <div className="jd-view-page-shell fixed inset-0 z-[9999] flex min-h-0 flex-col overflow-hidden bg-[#EEF2F6] font-jakarta text-sibs-primary-1">
      <style>{jdViewAnimationStyles}</style>
      <div
        className={`shrink-0 overflow-hidden border-b bg-white transition-all duration-300 ease-in-out ${
          headerHidden
            ? "max-h-0 border-transparent px-3 py-0 opacity-0 -translate-y-full sm:px-6"
            : "max-h-[230px] border-[#D9E2EC] px-3 pt-3 opacity-100 translate-y-0 sm:max-h-[210px] sm:px-6 sm:pt-4"
        }`}
      >
        <div className="jd-view-header-content mx-auto flex w-full max-w-[1760px] flex-col gap-3 sm:gap-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
            <div className="min-w-0">
              <div className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1/80">
                Job Description Overview
              </div>

              <h1 className="mt-1 min-w-0 break-words text-sm font-extrabold leading-tight text-sibs-primary-1 sm:text-xl">
                {jdScreenTitle}
              </h1>

              <p className="mt-1 text-xs font-semibold text-[#475467] sm:text-sm">
                {item.department || "—"} • {item.account || "—"}
              </p>
            </div>

            <span
              className={`inline-flex w-fit min-w-[92px] shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-3 py-1.5 text-center text-[11px] font-extrabold leading-none sm:px-3.5 sm:text-xs ${getJdStatusClass(
                displayJdStatus,
              )}`}
            >
              {getJdStatusLabel(displayJdStatus)}
            </span>
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

      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#EEF2F6]">
        {approvalPage && (
          <div className="pointer-events-none absolute right-3 top-3 z-[30] sm:right-6 sm:top-5">
            <PrintApprovalAction
              onClick={handlePrintJobDescription}
              disabled={saving}
            />
          </div>
        )}

        <div
          ref={contentScrollRef}
          onScroll={handleContentScroll}
          className="thin-scroll h-full overflow-y-auto px-2.5 py-4 pb-24 sm:px-5 sm:py-7 sm:pb-28 lg:px-8"
        >
          <div key={activeDetailTab} className="jd-view-content-panel">
            {shouldShowDetails && (
              <Details
                onOpenRevision={handleOpenRevisionFromDetails}
                hasEditedChanges={hasEditedChanges}
                onEditedChange={setHasEditedChanges}
                editedChangeDetails={editedChangeDetails}
                setEditedChangeDetails={setEditedChangeDetails}
                approvalPage={approvalPage}
              />
            )}

            {activeDetailTab === "Revision History" && (
              <div className="mx-auto w-full max-w-[900px] rounded-2xl bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-6">
                <RevisionHistory revisionHistory={revisionHistory} item={item} />
              </div>
            )}
          </div>
        </div>
      </div>


      <div className="jd-view-footer shrink-0 border-t border-[#D9E2EC] bg-white px-3 py-3 [padding-bottom:calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
        <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          {!hasRevisionComments && hasEditedChanges && (
            <div className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-extrabold text-amber-700 sm:w-auto sm:py-0">
              <AlertTriangle size={16} />
              Tagged for revision
            </div>
          )}

          {!hasRevisionComments && hasEditedChanges && (
            <>
              <div className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-extrabold text-sibs-primary-1 sm:w-auto sm:py-0">
                <AlertTriangle size={16} />
                New version changes
              </div>

              <button
                type="button"
                onClick={() => setShowEditedChanges(true)}
                className="jd-view-action-button inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#D7DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:border-sibs-primary-1 hover:bg-[#F8FAFC] sm:w-auto"
              >
                <Eye size={16} />
                View Changes
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleBack}
            disabled={saving}
            className="jd-view-action-button inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#D7DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:border-sibs-primary-1 hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {approvalPage && (
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={saving}
              title={primaryButtonTitle}
              className={`jd-view-action-button inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-5 text-sm font-extrabold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto ${
                hasRevisionComments
                  ? "bg-sibs-primary-2 hover:opacity-90"
                  : "bg-sibs-primary-1 hover:opacity-90"
              }`}
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? "Saving..." : primaryButtonLabel}
            </button>
          )}
        </div>
      </div>

      {showEditedChanges && (
        <div className="jd-view-overlay fixed inset-0 z-[10000] flex items-end justify-center bg-black/40 px-3 pb-3 pt-6 sm:items-center sm:px-4 sm:py-4">
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
              {editedChangeDetails.length > 0 ? (
                <div className="space-y-3">
                  {editedChangeDetails.map((change) => (
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
                className="jd-view-action-button inline-flex h-10 w-full items-center justify-center rounded-lg bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-90 sm:w-auto"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <ReviseJobDescriptionModal
        open={revisionEditorOpen}
        item={item}
        form={revisionForm}
        setForm={setRevisionForm}
        onClose={handleCloseRevisionEditor}
        onSubmit={handleRevisionSaved}
      />

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

function PrintApprovalAction({ onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="pointer-events-auto flex h-12 w-12 flex-col items-center justify-center gap-1 rounded-2xl border border-[#DDE7F3] bg-white text-sibs-primary-1 shadow-[0_10px_24px_rgba(4,44,81,0.12)] transition hover:-translate-y-0.5 hover:border-sibs-primary-1 hover:shadow-[0_18px_36px_rgba(4,44,81,0.18)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:h-[74px] sm:w-[74px] sm:gap-2 sm:shadow-[0_14px_30px_rgba(4,44,81,0.14)]"
      title="Print job description"
    >
      <Printer size={18} strokeWidth={2.2} className="sm:h-[22px] sm:w-[22px]" />
      <span className="text-[10px] font-extrabold leading-none sm:text-xs">Print</span>
    </button>
  );
}
