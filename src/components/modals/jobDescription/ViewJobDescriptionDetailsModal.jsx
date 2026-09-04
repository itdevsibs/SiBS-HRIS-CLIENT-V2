import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AlertTriangle, Eye, Loader2, X } from "lucide-react";
import Details from "../../layout/tabs/JobDescriptionView/Details";
import { normalizeJdStatus } from "../../../lib/utils/NormalizeJDStatus";
import RevisionHistory from "../../layout/tabs/JobDescriptionView/RevisionHistory";
import { useJobDescription } from "../../../services/context/JobDescriptionContext";
import { approveJobDescriptionRequest } from "../../../lib/axios/getApprovalRequest";

const detailTabs = ["Details", "Revision History"];

function getJobDescriptionDisplayTitle(item = {}) {
  return (
    item.documentTitle ||
    item.document_title ||
    item.raw?.documentTitle ||
    item.raw?.document_title ||
    item.roleTitle ||
    item.role_title ||
    item.raw?.roleTitle ||
    item.raw?.role_title ||
    "Job Description"
  );
}

export default function ViewJobDescriptionDetailsModal({
  open,
  onClose,
  approvalPage = false,
  onOpenRevision,
  onUpdated,
  onRefresh,
  onStatus,
}) {
  const [activeDetailTab, setActiveDetailTab] = useState("Details");
  const [hasEditedChanges, setHasEditedChanges] = useState(false);
  const [editedChangeDetails, setEditedChangeDetails] = useState([]);
  const [showEditedChanges, setShowEditedChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const tabRefs = useRef({});
  const [tabIndicator, setTabIndicator] = useState({
    left: 0,
    width: 0,
  });

  const {
    selectedJobDescription,
    updateSelectedJobDescription,
    revisionComments,
    setRevisionComments,
    loadRevisionComments,
    clearRevisionComments,
    saveRevisionComments,
    revisionCommentsLoading,
  } = useJobDescription();

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
    if (!open || !item) {
      clearRevisionComments();
      return;
    }

    const jdId = getJobDescriptionId();

    if (!jdId) {
      clearRevisionComments();
      return;
    }

    if (!shouldLoadRevisionComments()) {
      clearRevisionComments();
      return;
    }

    loadRevisionComments(jdId, {
      revisionNo: getSelectedRevisionNo(),
    });
  }, [
    open,
    item?.id,
    item?.rawId,
    item?.jdStatus,
    item?.status,
    item?.currentVersion,
    item?.revisionNo,
  ]);

  useEffect(() => {
    if (!open) return;

    setRevisionComments([]);
    setHasEditedChanges(false);
    setEditedChangeDetails([]);
    setShowEditedChanges(false);
    setSaving(false);
  }, [open, item?.id, item?.rawId]);

  useLayoutEffect(() => {
    if (approvalPage) return;

    const activeButton = tabRefs.current[activeDetailTab];

    if (!activeButton) return;

    setTabIndicator({
      left: activeButton.offsetLeft,
      width: activeButton.offsetWidth,
    });
  }, [activeDetailTab, open, approvalPage]);

  function getJdStatusClass(status) {
    switch (normalizeJdStatus(status)) {
      case "Approved":
      case "Existing":
      case "Active":
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
    return Number(item?.rawId || item?.raw?.id || item?.id || 0);
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
      onStatus?.({
        type: "error",
        title: "Invalid Job Description",
        message: "Unable to identify the selected job description.",
      });
      return;
    }

    if (!revisionComments.length) {
      onStatus?.({
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
        onStatus?.({
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

      updateSelectedJobDescription(updatedItem);
      onUpdated?.(updatedItem);
      await onRefresh?.();

      onStatus?.({
        type: "success",
        title: "Tagged for Revision",
        message:
          result.message ||
          "Revision comments saved and job description was tagged for revision.",
      });

      onClose?.();
    } finally {
      setSaving(false);
    }
  }

  async function handleApproveJobDescription() {
    if (saving) return;

    const jdId = getJobDescriptionId();

    if (!jdId) {
      onStatus?.({
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
        onStatus?.({
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

      updateSelectedJobDescription(updatedItem);
      onUpdated?.(updatedItem);
      await onRefresh?.();

      onStatus?.({
        type: "success",
        title: "Job Description Approved",
        message:
          result?.message || "Job description request approved successfully.",
      });

      onClose?.();
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
      onStatus?.({
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

    onOpenRevision?.(revisionTarget);
  }

  if (!open || !item) return null;

  const jdTitle = `${getJobDescriptionDisplayTitle(item)} - Version ${
    item.revisionNo || item.currentVersion || "1"
  }.0`;

  const revisionHistory = Array.isArray(item.revisionHistory)
    ? item.revisionHistory
    : [];

  const shouldShowDetails = approvalPage || activeDetailTab === "Details";
  const displayJdStatus = getDisplayJdStatus();

  return (
    <div
      className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[9999] flex h-dvh items-center justify-center px-2 py-2 font-jakarta sm:px-4 sm:py-4"
      onClick={saving ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-job-description-modal-title"
        className="sibs-modal-pop-in flex max-h-[92dvh] h-full w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl font-jakarta"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-[#D9E2EC] bg-white px-4 py-3 sm:px-6 2xl:py-3.5">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div className="min-w-0">
              <div className="sibs-kicker text-[#042C51]/80">
                Job Description Overview
              </div>

              <h2
                id="view-job-description-modal-title"
                className="mt-0.5 min-w-0 break-words font-heading text-lg 2xl:text-2xl font-bold leading-tight text-[#042C51]"
              >
                {jdTitle}
              </h2>

              <p className="mt-0.5 sibs-text-xs font-semibold text-[#667085]">
                {item.department || "—"} • {item.account || "—"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex w-fit min-w-[92px] shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-3 py-1 text-center text-[8.5px] font-extrabold leading-none ${getJdStatusClass(
                  displayJdStatus,
                )}`}
              >
                {getJdStatusLabel(displayJdStatus)}
              </span>

              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6DEE8] text-[#042C51] hover:bg-[#F8FAFC] transition active:scale-[0.98]"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {!approvalPage && (
            <div className="relative mt-2.5 flex gap-6 overflow-x-auto text-xs font-bold text-[#344054] no-scrollbar">
              <span
                className="absolute bottom-0 h-[2px] rounded-full bg-[#FF5C28] transition-all duration-300 ease-in-out"
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
                    className={`relative z-10 whitespace-nowrap px-3 pb-2 transition ${
                      isActive
                        ? "text-[#042C51] font-extrabold"
                        : "text-[#667085] hover:text-[#042C51]"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#EEF2F6]">
          <div className="sibs-scrollbar h-full overflow-y-auto px-3 py-3.5 sm:px-5 sm:py-5 lg:px-6">
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

            {!approvalPage && activeDetailTab === "Revision History" && (
              <div className="mx-auto w-full max-w-[900px] rounded-2xl bg-white p-4 shadow-sm sm:p-5">
                <RevisionHistory revisionHistory={revisionHistory} item={item} />
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-[#D9E2EC] bg-white px-4 py-2.5 sm:px-6 2xl:py-3">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
            {!hasRevisionComments && hasEditedChanges && (
              <div className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
                Tagged for revision
              </div>
            )}

            {!hasRevisionComments && hasEditedChanges && (
              <>
                <div className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#042C51]">
                  <AlertTriangle className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
                  New version changes
                </div>

                <button
                  type="button"
                  onClick={() => setShowEditedChanges(true)}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg border border-[#D7DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-bold text-[#042C51] shadow-sm transition hover:border-[#042C51] hover:bg-[#F8FAFC]"
                >
                  <Eye className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
                  View Changes
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#042C51] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {approvalPage ? "Cancel" : "Close"}
            </button>

            {approvalPage && (
              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={saving}
                title={primaryButtonTitle}
                className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  primaryButtonLabel
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {showEditedChanges && (
        <div className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[10000] flex items-center justify-center px-4">
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
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

            <div className="max-h-[60dvh] overflow-y-auto p-5">
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

            <div className="flex justify-end border-t border-[#E6ECF2] bg-[#F8FAFC] px-5 py-4">
              <button
                type="button"
                onClick={() => setShowEditedChanges(false)}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-90"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
