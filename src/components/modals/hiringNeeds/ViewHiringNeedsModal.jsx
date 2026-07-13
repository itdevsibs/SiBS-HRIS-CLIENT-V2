import React, { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
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

  if (start !== "—" && end !== "—") return `${start} - ${end}`;
  if (start !== "—") return start;
  if (end !== "—") return end;

  return "—";
}

function normalizeStatus(status) {
  if (!status) return "For Approval";

  const value = String(status).trim();
  const lowerValue = value.toLowerCase();

  if (
    lowerValue === "pending" ||
    lowerValue === "for validation" ||
    lowerValue === "under review" ||
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
    return <CheckCircle2 size={17} className="text-emerald-600" />;
  }

  if (normalized === "Not Approved") {
    return <XCircle size={17} className="text-red-600" />;
  }

  return <Clock size={17} className="text-amber-500" />;
}

function getRequestType(item = {}) {
  const type = cleanText(item.requestType || item.request_type).toLowerCase();

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
  return (
    cleanText(item.weeklyWeekDateRange || item.weekly_week_date_range) ||
    formatDateRange(
      item.weeklyWeekStart || item.weekly_week_start,
      item.weeklyWeekEnd || item.weekly_week_end,
    )
  );
}

function getDepartmentAccount(item = {}) {
  return (
    cleanText(item.departmentAccount || item.department_account) ||
    [
      item.departmentName || item.department_name || item.department,
      item.accountName || item.account_name || item.account,
    ]
      .map(cleanText)
      .filter(Boolean)
      .join(" / ") ||
    "—"
  );
}

function getAccountName(item = {}) {
  return (
    cleanText(item.accountName || item.account_name) ||
    cleanText(item.account) ||
    "—"
  );
}

function getHeadcount(item = {}) {
  return (
    item.headcount ??
    item.requiredHeadcount ??
    item.required_headcount ??
    item.approvedRequirement ??
    item.approved_requirement ??
    "—"
  );
}

function getPreviousRequiredHeadcount(item = {}) {
  return (
    item.previousRequiredHeadcount ??
    item.previous_required_headcount ??
    item.approvedRequirement ??
    item.approved_requirement ??
    "0"
  );
}

function getDownsizeReason(item = {}) {
  return (
    cleanText(item.downsizeReason || item.downsize_reason) ||
    cleanText(item.reasonForHiring || item.reason_for_hiring) ||
    cleanText(item.reason) ||
    "—"
  );
}

function getSupportingFileUrl(item = {}) {
  const rawPath = cleanText(
    item.supportingFilePath ||
      item.supporting_file_path ||
      item.supportingFileUrl ||
      item.supporting_file_url ||
      "",
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

  return `${API_BASE_URL}/${normalizedPath.replace(/^\/+/, "")}`;
}

function getSupportingFileName(item = {}) {
  return (
    cleanText(item.supportingFileName || item.supporting_file_name) ||
    "Supporting file"
  );
}

function isImageFile(item = {}) {
  const mimeType = cleanText(
    item.supportingFileMimeType || item.supporting_file_mime_type,
  ).toLowerCase();

  const fileName = getSupportingFileName(item).toLowerCase();

  return (
    mimeType.startsWith("image/") ||
    /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(fileName)
  );
}

function InfoItem({ label, value, icon: Icon, className = "" }) {
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function SummaryMetric({ label, value, icon: Icon, tone = "blue" }) {
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

export default function ViewHiringNeedsModal({ open, item, onClose }) {
  if (!open || !item) return null;

  const status = normalizeStatus(item?.approvalStatus || item?.approval_status);
  const requestType = getRequestType(item);
  const isDownsize = requestType === "Downsize";
  const weekRange = getWeekRange(item);
  const supportingFileUrl = getSupportingFileUrl(item);
  const supportingFileName = getSupportingFileName(item);

  const jobDescriptionDisplay =
    item.jobDescriptionText ||
    item.jobDescriptionTitle ||
    item.jobDescriptionName ||
    item.documentTitle ||
    item.jdTitle ||
    item.jobDescriptionId ||
    item.job_description_title ||
    item.job_description_id ||
    "";

  const titleDisplay = isDownsize
    ? getAccountName(item)
    : item.positionTitle ||
      item.position_title ||
      item.roleTitle ||
      item.role_title ||
      "—";

  const subtitleDisplay = isDownsize
    ? getDepartmentAccount(item)
    : item.departmentAccount || item.department_account || "—";

  return (
    <div
      className="sibs-modal-backdrop-in fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-3 py-3 sm:px-4 sm:py-4"
      onClick={onClose}
    >
      <div
        className="sibs-modal-pop-in flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] bg-white px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="mt-3 break-words text-xl font-extrabold tracking-tight text-sibs-primary-1 sm:text-2xl">
              {isDownsize ? "Downsize Request" : "Personnel Requisition"}
            </h2>

            <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
              Review all request information and recorded approval details.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-6">
          <div className="space-y-5">
            <section className="sibs-page-card-in overflow-hidden rounded-3xl border border-[#E6ECF2] bg-white shadow-sm">
              <div className="bg-gradient-to-br from-white via-white to-[#F3F8FF] p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-[#215789]">
                      {isDownsize ? "Account" : "Position Title"}
                    </p>

                    <h3 className="mt-2 break-words text-2xl font-extrabold leading-tight text-[#101828] sm:text-3xl">
                      {titleDisplay}
                    </h3>

                    <p className="mt-2 break-words text-sm font-bold leading-6 text-sibs-tertiary-5">
                      {subtitleDisplay}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold ${getRequestTypeClass(
                          requestType,
                        )}`}
                      >
                        {requestType}
                      </span>

                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold ${getStatusClass(
                          status,
                        )}`}
                      >
                        {getApprovalIcon(status)}
                        {status}
                      </span>

                      <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-sibs-primary-1">
                        <MapPin size={14} />
                        {item.locationSite || item.location_site || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <SummaryMetric
                      label={isDownsize ? "Headcount to Downsize" : "Headcount"}
                      value={getHeadcount(item)}
                      icon={Users}
                    />

                    <SummaryMetric
                      label={isDownsize ? "Week Range" : "Date Needed"}
                      value={
                        isDownsize
                          ? weekRange
                          : formatDate(item.dateNeeded || item.date_needed)
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
                subtitle="Selected weekly hiring plan account, previous required headcount, and downsize reason."
              >
                <InfoItem label="Account" value={getAccountName(item)} />

                <InfoItem
                  label="Department / Account"
                  value={getDepartmentAccount(item)}
                />

                <InfoItem
                  label="Week Range"
                  value={weekRange}
                  icon={CalendarDays}
                  className="md:col-span-2"
                />

                <InfoItem
                  label="Previous Required Headcount"
                  value={getPreviousRequiredHeadcount(item)}
                  icon={Users}
                />

                <InfoItem
                  label="Headcount to Downsize"
                  value={getHeadcount(item)}
                  icon={Users}
                />

                <InfoItem
                  label="Reason"
                  value={getDownsizeReason(item)}
                  className="md:col-span-2"
                />
              </DetailSection>
            ) : (
              <DetailSection
                title="Position Details"
                subtitle="Position, role alignment, job description, site, and reason for hiring."
              >
                <InfoItem
                  label="Position Title"
                  value={item.positionTitle || item.position_title}
                />

                <InfoItem
                  label="Department / Account"
                  value={item.departmentAccount || item.department_account}
                />

                <InfoItem
                  label="Job Description"
                  value={jobDescriptionDisplay || "Not selected"}
                  icon={FileText}
                  className="md:col-span-2"
                />

                <InfoItem
                  label="Reason for Hiring"
                  value={
                    item.reasonForHiring || item.reason_for_hiring || item.reason
                  }
                />

                <InfoItem
                  label="Assignment"
                  value={
                    item.assignment === "Other"
                      ? item.assignmentOther || item.assignment_other || "Other"
                      : item.assignment
                  }
                />

                <InfoItem
                  label="Location / Site"
                  value={item.locationSite || item.location_site}
                />
              </DetailSection>
            )}

            {isDownsize && supportingFileUrl && (
              <DetailSection
                title="Supporting File"
                subtitle="Uploaded supporting image or document for this downsize request."
              >
                <div className="md:col-span-2">
                  <SupportingFilePreview
                    url={supportingFileUrl}
                    fileName={supportingFileName}
                    image={isImageFile(item)}
                  />
                </div>
              </DetailSection>
            )}

            <DetailSection
              title="Request Details"
              subtitle="Submitted request information and staffing requirement."
            >
              <InfoItem
                label={isDownsize ? "Headcount to Downsize" : "Headcount"}
                value={getHeadcount(item)}
                icon={Users}
              />

              <InfoItem
                label={isDownsize ? "Week Range" : "Date Needed"}
                value={
                  isDownsize
                    ? weekRange
                    : formatDate(item.dateNeeded || item.date_needed)
                }
                icon={CalendarDays}
              />

              <InfoItem
                label="SIBS ID Manager"
                value={
                  item.sibsIdManager ||
                  item.sibs_id_manager ||
                  item.preparedById
                }
              />

              <InfoItem
                label="Hiring Manager"
                value={
                  item.hiringManager || item.hiring_manager || item.preparedBy
                }
              />

              <InfoItem
                label="Submitted Date"
                value={formatDate(item.createdAt || item.created_at)}
              />
            </DetailSection>

            <DetailSection
              title="Approval Details"
              subtitle="Current approval information and recorded decision details."
            >
              <InfoItem label="Approval Status" value={status} />

              <InfoItem
                label="Approval Date"
                value={formatDate(item.approvalDate || item.approval_date)}
              />

              <InfoItem
                label="Approved By"
                value={item.approvedBy || item.approved_by}
              />

              <InfoItem
                label="Approval Remarks"
                value={item.approvalRemarks || item.approval_remarks}
                className="md:col-span-2"
              />
            </DetailSection>
          </div>
        </div>

        <div className="border-t border-[#E6ECF2] bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold text-sibs-tertiary-5">
              Request status: {status}
            </p>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#D0D5DD] bg-white px-6 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] sm:w-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}