import React from "react";
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

export default function ViewHiringNeedsModal({ open, item, onClose }) {
  if (!open || !item) return null;

  const status = normalizeStatus(item?.approvalStatus);

  const jobDescriptionDisplay =
    item.jobDescriptionText ||
    item.jobDescriptionTitle ||
    item.jobDescriptionName ||
    item.documentTitle ||
    item.jdTitle ||
    item.jobDescriptionId ||
    "";

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
              Personnel Requisition
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
                      Position Title
                    </p>

                    <h3 className="mt-2 break-words text-2xl font-extrabold leading-tight text-[#101828] sm:text-3xl">
                      {item.positionTitle || "—"}
                    </h3>

                    <p className="mt-2 break-words text-sm font-bold leading-6 text-sibs-tertiary-5">
                      {item.departmentAccount || "—"}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
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
                        {item.locationSite || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <SummaryMetric
                      label="Headcount"
                      value={item.headcount}
                      icon={Users}
                    />

                    <SummaryMetric
                      label="Date Needed"
                      value={formatDate(item.dateNeeded)}
                      icon={CalendarDays}
                      tone="amber"
                    />
                  </div>
                </div>
              </div>
            </section>

            <DetailSection
              title="Position Details"
              subtitle="Position, role alignment, job description, site, and reason for hiring."
            >
              <InfoItem label="Position Title" value={item.positionTitle} />

              <InfoItem
                label="Department / Account"
                value={item.departmentAccount}
              />

              <InfoItem
                label="Job Description"
                value={jobDescriptionDisplay || "Not selected"}
                icon={FileText}
                className="md:col-span-2"
              />

              <InfoItem label="Reason for Hiring" value={item.reasonForHiring} />

              <InfoItem
                label="Assignment"
                value={
                  item.assignment === "Other"
                    ? item.assignmentOther || "Other"
                    : item.assignment
                }
              />

              <InfoItem label="Location / Site" value={item.locationSite} />
            </DetailSection>

            <DetailSection
              title="Request Details"
              subtitle="Submitted request information and staffing requirement."
            >
              <InfoItem label="Headcount" value={item.headcount} icon={Users} />

              <InfoItem
                label="Date Needed"
                value={formatDate(item.dateNeeded)}
                icon={CalendarDays}
              />

              <InfoItem
                label="SIBS ID Manager"
                value={item.sibsIdManager || item.preparedById}
              />

              <InfoItem
                label="Hiring Manager"
                value={item.hiringManager || item.preparedBy}
              />

              <InfoItem label="Submitted Date" value={formatDate(item.createdAt)} />
            </DetailSection>

            <DetailSection
              title="Approval Details"
              subtitle="Current approval information and recorded decision details."
            >
              <InfoItem label="Approval Status" value={status} />

              <InfoItem
                label="Approval Date"
                value={formatDate(item.approvalDate)}
              />

              <InfoItem label="Approved By" value={item.approvedBy} />

              <InfoItem
                label="Approval Remarks"
                value={item.approvalRemarks}
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
