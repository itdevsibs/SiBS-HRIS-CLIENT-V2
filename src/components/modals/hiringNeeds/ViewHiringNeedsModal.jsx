import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MapPin,
  Users,
  X,
  XCircle,
} from "lucide-react";

const API_BASE_URL = String(
  import.meta.env.VITE_API_URL || "http://localhost:5000",
)
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

function cleanText(value) {
  return String(value ?? "").trim();
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateRange(startDate, endDate) {
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  if (start !== "—" && end !== "—") {
    return `${start} - ${end}`;
  }

  if (start !== "—") return start;
  if (end !== "—") return end;

  return "—";
}

function normalizeStatus(status) {
  if (!status) return "For Approval";

  const value = cleanText(status);
  const lowerValue = value.toLowerCase();

  if (
    lowerValue === "pending" ||
    lowerValue === "for validation" ||
    lowerValue === "under review" ||
    lowerValue === "for review" ||
    lowerValue === "for approval"
  ) {
    return "For Approval";
  }

  if (lowerValue === "approved") return "Approved";

  if (
    lowerValue === "rejected" ||
    lowerValue === "declined" ||
    lowerValue === "not approved"
  ) {
    return "Not Approved";
  }

  return value;
}

function isFinalStatus(status) {
  const normalized = normalizeStatus(status);

  return (
    normalized === "Approved" ||
    normalized === "Not Approved"
  );
}

function getStatusClass(status) {
  switch (normalizeStatus(status)) {
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Not Approved":
      return "border-red-200 bg-red-50 text-red-700";
    case "For Approval":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getApprovalIcon(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "Approved") {
    return (
      <CheckCircle2
        size={17}
        className="text-emerald-600"
      />
    );
  }

  if (normalized === "Not Approved") {
    return <XCircle size={17} className="text-red-600" />;
  }

  return <Clock size={17} className="text-amber-500" />;
}

function getRequestType(item = {}) {
  const type = cleanText(
    item?.requestType || item?.request_type,
  ).toLowerCase();

  if (type === "downsize") return "Downsize";
  if (type === "requisition") return "Requisition";

  return "Requisition";
}

function getRequestTypeClass(type) {
  if (type === "Downsize") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-blue-100 bg-blue-50 text-sibs-primary-1";
}

function getWeekRange(item = {}) {
  const safeItem = item || {};

  return (
    cleanText(
      safeItem.weeklyWeekDateRange ||
        safeItem.weekly_week_date_range,
    ) ||
    formatDateRange(
      safeItem.weeklyWeekStart || safeItem.weekly_week_start,
      safeItem.weeklyWeekEnd || safeItem.weekly_week_end,
    )
  );
}

function getDepartmentAccount(item = {}) {
  const safeItem = item || {};

  return (
    cleanText(
      safeItem.departmentAccount || safeItem.department_account,
    ) ||
    [
      safeItem.departmentName ||
        safeItem.department_name ||
        safeItem.department,
      safeItem.accountName || safeItem.account_name || safeItem.account,
    ]
      .map(cleanText)
      .filter(Boolean)
      .join(" / ") ||
    "—"
  );
}

function getAccountName(item = {}) {
  const safeItem = item || {};

  return (
    cleanText(safeItem.accountName || safeItem.account_name) ||
    cleanText(safeItem.account) ||
    "—"
  );
}

function getHeadcount(item = {}) {
  const safeItem = item || {};

  return (
    safeItem.headcount ??
    safeItem.requiredHeadcount ??
    safeItem.required_headcount ??
    safeItem.approvedRequirement ??
    safeItem.approved_requirement ??
    "—"
  );
}

function getPreviousRequiredHeadcount(item = {}) {
  const safeItem = item || {};

  return (
    safeItem.previousRequiredHeadcount ??
    safeItem.previous_required_headcount ??
    safeItem.approvedRequirement ??
    safeItem.approved_requirement ??
    "0"
  );
}

function getDownsizeReason(item = {}) {
  const safeItem = item || {};

  return (
    cleanText(safeItem.downsizeReason || safeItem.downsize_reason) ||
    cleanText(
      safeItem.reasonForHiring || safeItem.reason_for_hiring,
    ) ||
    cleanText(safeItem.reason) ||
    "—"
  );
}

function getSupportingFileUrl(item = {}) {
  const safeItem = item || {};

  const rawPath = cleanText(
    safeItem.supportingFilePath ||
      safeItem.supporting_file_path ||
      safeItem.supportingFileUrl ||
      safeItem.supporting_file_url,
  );

  if (!rawPath) return "";

  const normalizedPath = rawPath.replace(/\\/g, "/");

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith("/uploads")) {
    return `${API_BASE_URL}${normalizedPath}`;
  }

  if (normalizedPath.startsWith("uploads")) {
    return `${API_BASE_URL}/${normalizedPath}`;
  }

  return `${API_BASE_URL}/${normalizedPath.replace(
    /^\/+/,
    "",
  )}`;
}

function getSupportingFileName(item = {}) {
  const safeItem = item || {};

  return (
    cleanText(
      safeItem.supportingFileName ||
        safeItem.supporting_file_name,
    ) || "Supporting file"
  );
}

function isImageFile(item = {}) {
  const safeItem = item || {};

  const mimeType = cleanText(
    safeItem.supportingFileMimeType ||
      safeItem.supporting_file_mime_type,
  ).toLowerCase();

  const fileName = getSupportingFileName(item).toLowerCase();

  return (
    mimeType.startsWith("image/") ||
    /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(fileName)
  );
}

function InfoItem({
  label,
  value,
  icon: Icon,
  className = "",
}) {
  return (
    <div
      className={`group min-w-0 rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-4 transition hover:border-[#C9D7E8] hover:bg-white ${className}`}
    >
      <div className="mb-2 flex items-center gap-2">
        {Icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EAF2FB] text-sibs-primary-1">
            <Icon size={14} />
          </span>
        )}

        <p className="min-w-0 break-words text-[11px] font-extrabold uppercase leading-4 tracking-wide text-[#215789]">
          {label}
        </p>
      </div>

      <p className="break-words text-sm font-bold leading-6 text-[#344054]">
        {value || "—"}
      </p>
    </div>
  );
}

function DetailSection({ title, subtitle, children }) {
  return (
    <section className="sibs-page-card-in rounded-3xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 min-w-0">
        <h3 className="break-words text-base font-extrabold text-[#101828]">
          {title}
        </h3>

        {subtitle && (
          <p className="mt-1 break-words text-sm font-semibold leading-6 text-sibs-tertiary-5">
            {subtitle}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function SummaryMetric({
  label,
  value,
  icon: Icon,
  tone = "blue",
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-blue-100 bg-blue-50 text-sibs-primary-1";

  return (
    <div
      className={`flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 ${toneClass}`}
    >
      {Icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/70">
          <Icon size={18} />
        </span>
      )}

      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-wide opacity-80">
          {label}
        </p>

        <p className="mt-0.5 break-words text-lg font-extrabold leading-tight">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function SupportingFilePreview({ url, fileName, image }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!url) return null;

  if (image && !imageFailed) {
    return (
      <div className="flex w-full justify-center">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex justify-center"
        >
          <img
            src={url}
            alt={fileName}
            onError={() => setImageFailed(true)}
            className="max-h-80 max-w-full rounded-2xl border border-[#E6ECF2] bg-white object-contain shadow-sm"
          />
        </a>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 py-3 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
    >
      <FileText size={18} />
      {fileName}
    </a>
  );
}

export default function ViewHiringNeedsModal({
  open,
  item,
  onClose,
  onStatus,
  canApprove = false,
  approvalAccessLoading = false,
  onDecision,
}) {
  const [remarks, setRemarks] = useState("");
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionAction, setDecisionAction] = useState("");

  /*
   * Keep hooks unconditional while protecting every calculation from
   * the brief render where the modal is closed and item is null.
   */
  const safeItem = item || {};

  useEffect(() => {
    if (!open) return;

    setRemarks("");
    setDecisionLoading(false);
    setDecisionAction("");
  }, [item?.id, open]);

  const status = normalizeStatus(
    safeItem.approvalStatus || safeItem.approval_status,
  );

  const requestType = getRequestType(safeItem);
  const isDownsize = requestType === "Downsize";
  const weekRange = getWeekRange(safeItem);
  const supportingFileUrl = getSupportingFileUrl(safeItem);
  const supportingFileName = getSupportingFileName(safeItem);
  const finalStatus = isFinalStatus(status);

  const canShowDecisionControls =
    canApprove &&
    !approvalAccessLoading &&
    !finalStatus;

  const jobDescriptionDisplay =
    safeItem.jobDescriptionText ||
    safeItem.jobDescriptionTitle ||
    safeItem.jobDescriptionName ||
    safeItem.documentTitle ||
    safeItem.jdTitle ||
    safeItem.jobDescriptionId ||
    safeItem.job_description_title ||
    safeItem.job_description_id ||
    "";

  const titleDisplay = isDownsize
    ? getAccountName(safeItem)
    : safeItem.positionTitle ||
      safeItem.position_title ||
      safeItem.roleTitle ||
      safeItem.role_title ||
      "—";

  const subtitleDisplay = isDownsize
    ? getDepartmentAccount(safeItem)
    : safeItem.departmentAccount ||
      safeItem.department_account ||
      "—";

  const recordedApprovalRemarks =
    safeItem.approvalRemarks ||
    safeItem.approval_remarks ||
    "—";

  const decisionDescription = useMemo(() => {
    if (approvalAccessLoading) {
      return "Checking your Hiring Needs approval access...";
    }

    if (finalStatus) {
      return "This request already has a final decision.";
    }

    if (!canApprove) {
      return "You can review this request, but only configured Hiring Needs approvers can approve or reject it.";
    }

    return "You are configured as a Hiring Needs approver. Add optional remarks, then approve or reject this request.";
  }, [
    approvalAccessLoading,
    canApprove,
    finalStatus,
  ]);

  if (!open || !item) return null;

  async function handleDecision(action) {
    if (!canShowDecisionControls || decisionLoading) return;

    if (typeof onDecision !== "function") {
      onStatus?.({
        type: "error",
        title: "Approval Action Unavailable",
        message:
          "The approval action is not connected to the page.",
      });

      return;
    }

    try {
      setDecisionLoading(true);
      setDecisionAction(action);

      await onDecision({
        action,
        item,
        remarks,
      });
    } finally {
      setDecisionLoading(false);
      setDecisionAction("");
    }
  }

  return (
    <div
      className="sibs-modal-backdrop-in fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/65 p-2 font-jakarta backdrop-blur-[2px] sm:p-4"
      onClick={() => {
        if (!decisionLoading) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-hiring-needs-title"
        className="sibs-modal-pop-in flex max-h-[94dvh] w-full max-w-[1050px] flex-col overflow-hidden rounded-2xl border border-[#9FB3C8] bg-[#F7F9FC] shadow-[0_30px_90px_rgba(2,26,48,0.42)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="shrink-0 bg-[#07365F] px-4 py-4 text-white sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#FF5C28]">
                <FileText size={20} />
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="view-hiring-needs-title"
                    className="text-base font-extrabold text-white"
                  >
                    Personnel Requisition Details
                  </h2>

                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${getRequestTypeClass(
                      requestType,
                    )}`}
                  >
                    {requestType}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${getStatusClass(
                      status,
                    )}`}
                  >
                    {getApprovalIcon(status)}
                    {status}
                  </span>
                </div>

                <p className="mt-1 text-[10px] font-semibold text-blue-100">
                  Request ID: {safeItem.id || "—"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={decisionLoading}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-blue-100 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close Personnel Requisition dossier"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto bg-[#F7F9FC] p-3 sm:p-5">
          <div className="space-y-4">
            <section className="overflow-hidden rounded-2xl border border-[#DCE6F1] bg-white shadow-[0_8px_24px_rgba(4,44,81,0.04)]">
              <div className="bg-gradient-to-br from-white via-white to-[#F3F8FF] p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#215789]">
                      {isDownsize
                        ? "Account / Downsize Requirement"
                        : "Position / Personnel Requirement"}
                    </p>

                    <h3 className="mt-2 break-words text-xl font-extrabold leading-tight text-[#101828] sm:text-2xl">
                      {titleDisplay}
                    </h3>

                    <p className="mt-1 break-words text-xs font-bold leading-5 text-[#667085]">
                      {subtitleDisplay}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold text-[#042C51]">
                        <MapPin size={12} />
                        {safeItem.locationSite ||
                          safeItem.location_site ||
                          "—"}
                      </span>

                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D7DEE8] bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-extrabold text-[#475467]">
                        {getDepartmentAccount(safeItem)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                    <SummaryMetric
                      label={
                        isDownsize
                          ? "Headcount to Downsize"
                          : "Required Headcount"
                      }
                      value={getHeadcount(safeItem)}
                      icon={Users}
                    />

                    <SummaryMetric
                      label={
                        isDownsize
                          ? "Selected Week"
                          : "Date Needed"
                      }
                      value={
                        isDownsize
                          ? weekRange
                          : formatDate(
                              safeItem.dateNeeded ||
                                safeItem.date_needed,
                            )
                      }
                      icon={CalendarDays}
                      tone="amber"
                    />
                  </div>
                </div>
              </div>
            </section>

            {isDownsize ? (
              <DetailSection
                title="Downsize Details"
                subtitle="Selected Weekly Hiring Plan account, previous required headcount, adjustment, and business reason."
              >
                <InfoItem
                  label="Account"
                  value={getAccountName(safeItem)}
                />

                <InfoItem
                  label="Department / Account"
                  value={getDepartmentAccount(safeItem)}
                />

                <InfoItem
                  label="Week Range"
                  value={weekRange}
                  icon={CalendarDays}
                  className="md:col-span-2"
                />

                <InfoItem
                  label="Previous Required Headcount"
                  value={getPreviousRequiredHeadcount(
                    safeItem,
                  )}
                  icon={Users}
                />

                <InfoItem
                  label="Headcount to Downsize"
                  value={getHeadcount(safeItem)}
                  icon={Users}
                />

                <InfoItem
                  label="Reason"
                  value={getDownsizeReason(safeItem)}
                  className="md:col-span-2"
                />
              </DetailSection>
            ) : (
              <DetailSection
                title="Position Details"
                subtitle="Position, account alignment, linked Job Description, assignment, site, and hiring reason."
              >
                <InfoItem
                  label="Position Title"
                  value={
                    safeItem.positionTitle ||
                    safeItem.position_title
                  }
                />

                <InfoItem
                  label="Department / Account"
                  value={getDepartmentAccount(safeItem)}
                />

                <InfoItem
                  label="Job Description"
                  value={
                    jobDescriptionDisplay ||
                    "Not selected"
                  }
                  icon={FileText}
                  className="md:col-span-2"
                />

                <InfoItem
                  label="Reason for Hiring"
                  value={
                    safeItem.reasonForHiring ||
                    safeItem.reason_for_hiring ||
                    safeItem.reason
                  }
                />

                <InfoItem
                  label="Assignment"
                  value={
                    safeItem.assignment === "Other"
                      ? safeItem.assignmentOther ||
                        safeItem.assignment_other ||
                        "Other"
                      : safeItem.assignment
                  }
                />

                <InfoItem
                  label="Location / Site"
                  value={
                    safeItem.locationSite ||
                    safeItem.location_site
                  }
                />
              </DetailSection>
            )}

            {isDownsize && supportingFileUrl ? (
              <DetailSection
                title="Supporting File"
                subtitle="Uploaded supporting image or document for this Downsize request."
              >
                <div className="md:col-span-2">
                  <SupportingFilePreview
                    url={supportingFileUrl}
                    fileName={supportingFileName}
                    image={isImageFile(safeItem)}
                  />
                </div>
              </DetailSection>
            ) : null}

            <DetailSection
              title="Request Details"
              subtitle="Submitted ownership and staffing information."
            >
              <InfoItem
                label={
                  isDownsize
                    ? "Headcount to Downsize"
                    : "Headcount"
                }
                value={getHeadcount(safeItem)}
                icon={Users}
              />

              <InfoItem
                label={
                  isDownsize
                    ? "Week Range"
                    : "Date Needed"
                }
                value={
                  isDownsize
                    ? weekRange
                    : formatDate(
                        safeItem.dateNeeded ||
                          safeItem.date_needed,
                      )
                }
                icon={CalendarDays}
              />

              <InfoItem
                label="SIBS ID Manager"
                value={
                  safeItem.sibsIdManager ||
                  safeItem.sibs_id_manager ||
                  safeItem.preparedById
                }
              />

              <InfoItem
                label="Hiring Manager"
                value={
                  safeItem.hiringManager ||
                  safeItem.hiring_manager ||
                  safeItem.preparedBy
                }
              />

              <InfoItem
                label="Submitted Date"
                value={formatDate(
                  safeItem.createdAt ||
                    safeItem.created_at,
                )}
              />
            </DetailSection>

            <DetailSection
              title="Approval Details"
              subtitle="Current approval status and recorded decision information."
            >
              <InfoItem
                label="Approval Status"
                value={status}
              />

              <InfoItem
                label="Approval Date"
                value={formatDate(
                  safeItem.approvalDate ||
                    safeItem.approval_date,
                )}
              />

              <InfoItem
                label="Approved By"
                value={
                  safeItem.approvedBy ||
                  safeItem.approved_by
                }
              />

              <InfoItem
                label="Approval Remarks"
                value={recordedApprovalRemarks}
                className="md:col-span-2"
              />
            </DetailSection>

            <section className="rounded-2xl border border-[#DCE6F1] bg-white p-4 shadow-[0_8px_24px_rgba(4,44,81,0.04)] sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#EAF2FB] text-[#042C51]">
                  <Clock size={15} />
                </span>

                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
                    Approval Action
                  </h3>

                  <p className="mt-1 text-xs font-semibold leading-5 text-[#667085]">
                    {decisionDescription}
                  </p>
                </div>
              </div>

              {canShowDecisionControls ? (
                <div className="mt-4">
                  <label
                    htmlFor="hiring-needs-approval-remarks"
                    className="mb-1.5 block text-xs font-extrabold text-[#042C51]"
                  >
                    Decision Remarks{" "}
                    <span className="font-semibold text-[#98A2B3]">
                      (Optional)
                    </span>
                  </label>

                  <textarea
                    id="hiring-needs-approval-remarks"
                    value={remarks}
                    onChange={(event) =>
                      setRemarks(event.target.value)
                    }
                    disabled={decisionLoading}
                    rows={4}
                    placeholder="Add remarks for this approval decision..."
                    className="w-full resize-none rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] px-3 py-2.5 text-xs font-semibold text-[#344054] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7]"
                  />
                </div>
              ) : null}
            </section>
          </div>
        </div>

        <footer className="shrink-0 border-t border-[#E6ECF2] bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
              Request status:{" "}
              <span className="text-[#042C51]">{status}</span>
            </p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onClose}
                disabled={decisionLoading}
                className="inline-flex h-10 w-full items-center justify-center rounded-[10px] border border-[#D7DEE8] bg-white px-5 text-xs font-extrabold text-[#042C51] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Close
              </button>

              {canShowDecisionControls ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      handleDecision("reject")
                    }
                    disabled={decisionLoading}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-red-200 bg-red-50 px-5 text-xs font-extrabold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {decisionLoading &&
                    decisionAction === "reject" ? (
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                    ) : (
                      <XCircle size={15} />
                    )}
                    Reject Request
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDecision("approve")
                    }
                    disabled={decisionLoading}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-emerald-600 px-5 text-xs font-extrabold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {decisionLoading &&
                    decisionAction === "approve" ? (
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                    ) : (
                      <CheckCircle2 size={15} />
                    )}
                    Approve Request
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
