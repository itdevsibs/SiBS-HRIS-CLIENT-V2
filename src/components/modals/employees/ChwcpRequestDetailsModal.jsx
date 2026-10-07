import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BadgeCheck,
  CalendarDays,
  FileText,
  LoaderCircle,
  Paperclip,
  RefreshCcw,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import ModalShell from "@/components/ui/ModalShell";
import { getChwcpRequestDetails } from "../../../lib/axios/getChwcp";

function safeText(value, fallback = "N/A") {
  const text = String(value ?? "").trim();
  return text || fallback;
}


const AVATAR_TONES = [
  "border-orange-100 bg-orange-50 text-sibs-orange",
  "border-emerald-100 bg-emerald-50 text-emerald-700",
  "border-blue-100 bg-blue-50 text-sibs-navy",
  "border-pink-100 bg-pink-50 text-pink-700",
  "border-violet-100 bg-violet-50 text-violet-700",
];

function getEmployeeDisplayName(employee = {}) {
  return safeText(
    employee.employeeName ||
      employee.name ||
      employee.fullName ||
      employee.full_name,
    "Employee",
  );
}

function getEmployeeInitials(employee = {}) {
  const firstName = String(
    employee.firstName || employee.first_name || "",
  ).trim();
  const lastName = String(
    employee.lastName || employee.last_name || "",
  ).trim();

  if (firstName || lastName) {
    return `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase();
  }

  const displayName = getEmployeeDisplayName(employee)
    .replace(",", " ")
    .split(/\s+/)
    .filter(Boolean);

  return `${displayName[0]?.[0] || "E"}${
    displayName[1]?.[0] || ""
  }`.toUpperCase();
}

function getAvatarTone(employee = {}) {
  const seed = getEmployeeDisplayName(employee)
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return AVATAR_TONES[seed % AVATAR_TONES.length];
}

function getEmployeeProfilePictureUrl(employee = {}) {
  return String(
    employee.profilePictureUrl ||
      employee.profile_picture_url ||
      "",
  ).trim();
}

function getEmployeeAvatarPreviewPosition(element) {
  if (!element || typeof window === "undefined") return null;

  const rect = element.getBoundingClientRect();
  const previewHeight = 176;
  const gap = 12;
  const placeBelow = rect.top < previewHeight + gap;

  return {
    left: rect.left + rect.width / 2,
    top: placeBelow ? rect.bottom + gap : rect.top - gap,
    placeBelow,
  };
}

function EmployeeAvatar({ employee, size = "md" }) {
  const sizeClass = size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const profilePictureUrl = getEmployeeProfilePictureUrl(employee);
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(null);
  const avatarRef = useRef(null);
  const canShowProfilePicture =
    Boolean(profilePictureUrl) && failedImageUrl !== profilePictureUrl;
  const employeeName = getEmployeeDisplayName(employee);
  const initials = getEmployeeInitials(employee);

  const showPreview = () => {
    setPreviewPosition(getEmployeeAvatarPreviewPosition(avatarRef.current));
    setPreviewVisible(true);
  };

  const hidePreview = () => {
    setPreviewVisible(false);
  };

  useEffect(() => {
    if (!previewVisible) return undefined;

    const updatePreviewPosition = () => {
      setPreviewPosition(getEmployeeAvatarPreviewPosition(avatarRef.current));
    };

    window.addEventListener("resize", updatePreviewPosition);
    window.addEventListener("scroll", updatePreviewPosition, true);

    return () => {
      window.removeEventListener("resize", updatePreviewPosition);
      window.removeEventListener("scroll", updatePreviewPosition, true);
    };
  }, [previewVisible]);

  const preview =
    previewVisible && previewPosition && typeof document !== "undefined"
      ? createPortal(
          <span
            className="employee-avatar-preview pointer-events-none fixed z-[11000] rounded-[14px] border border-sibs-border bg-white p-2 shadow-[0_18px_45px_rgba(4,44,81,0.22)]"
            style={{
              left: previewPosition.left,
              top: previewPosition.top,
              transform: previewPosition.placeBelow
                ? "translate(-50%, 0)"
                : "translate(-50%, -100%)",
            }}
            aria-hidden="true"
          >
            <span
              className={`relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-[10px] border text-[24px] font-extrabold ${getAvatarTone(
                employee,
              )}`}
            >
              <span>{initials}</span>

              {canShowProfilePicture ? (
                <img
                  src={profilePictureUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={() => setFailedImageUrl(profilePictureUrl)}
                />
              ) : null}
            </span>
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={avatarRef}
        className="relative inline-flex shrink-0 outline-none"
        tabIndex={0}
        aria-label={`${employeeName} profile picture`}
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
        onFocus={showPreview}
        onBlur={hidePreview}
      >
        <span
          className={`relative inline-flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border text-xs font-extrabold shadow-inner ${getAvatarTone(
            employee,
          )}`}
        >
          <span aria-hidden="true">{initials}</span>

          {canShowProfilePicture ? (
            <img
              src={profilePictureUrl}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setFailedImageUrl(profilePictureUrl)}
            />
          ) : null}
        </span>
      </span>
      {preview}
    </>
  );
}

function getFormTypeFromRequestId(requestId) {
  const prefix = String(requestId || "")
    .trim()
    .charAt(0)
    .toUpperCase();

  return ["A", "B", "C"].includes(prefix) ? `Form ${prefix}` : "CHWCP";
}

function formatDate(value) {
  if (!value) return "N/A";

  const raw = String(value).trim();
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? `${raw}T00:00:00+08:00`
    : raw;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatCurrency(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "₱0.00";

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function prettifyFieldName(value) {
  return safeText(value, "Attachment")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClasses(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("declined") || normalized.includes("canceled")) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (normalized.includes("approved")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized.includes("pending")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-blue-200 bg-blue-50 text-sibs-navy";
}

function SectionCard({ title, subtitle, icon: Icon = FileText, children }) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-sibs-border bg-white shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b border-sibs-border px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-blue-50 text-sibs-navy">
            <Icon size={16} />
          </span>
          <div className="min-w-0">
            <h3 className="sibs-modal-section-title">
              {title}
            </h3>
            {subtitle ? (
              <p className="sibs-modal-section-subtitle mt-0.5">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <span className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-sibs-navy sm:block" />
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function ReadOnlyField({ label, value, className = "", multiline = false }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
        {label}
      </p>
      <div
        className={`rounded-[10px] border border-sibs-border bg-sibs-surface px-3 py-2.5 text-xs font-extrabold leading-5 text-sibs-navy ${
          multiline ? "min-h-[88px] whitespace-pre-wrap" : "min-h-10"
        }`}
      >
        {safeText(value)}
      </div>
    </div>
  );
}

function PillList({ items = [], emptyLabel = "None" }) {
  const values = Array.isArray(items) ? items.filter(Boolean) : [];

  if (!values.length) {
    return <span className="text-xs font-semibold text-sibs-faint">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((item) => (
        <span
          key={item}
          className="inline-flex rounded-[10px] border border-sibs-orange/30 bg-sibs-cream-light px-2.5 py-1.5 text-[11px] font-extrabold text-sibs-navy"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function SupportingDocuments({ items = [] }) {
  const values = Array.isArray(items) ? items.filter(Boolean) : [];

  if (!values.length) {
    return <p className="text-xs font-semibold text-sibs-faint">No supporting documents marked.</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {values.map((item) => (
        <div
          key={item}
          className="flex items-center gap-2 rounded-[10px] border border-sibs-border bg-sibs-surface px-3 py-2"
        >
          <BadgeCheck size={15} className="shrink-0 text-emerald-600" />
          <span className="text-[11px] font-bold text-sibs-secondary">{item}</span>
        </div>
      ))}
    </div>
  );
}

function AttachmentList({ attachments = [] }) {
  if (!attachments.length) {
    return <p className="text-xs font-semibold text-sibs-faint">No attached files found.</p>;
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id || `${attachment.fieldName}-${attachment.fileName}`}
          className="flex min-w-0 items-center gap-3 rounded-[10px] border border-sibs-border bg-sibs-surface px-3 py-2.5"
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white text-sibs-orange shadow-xs">
            <Paperclip size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-extrabold text-sibs-navy" title={attachment.fileName}>
              {safeText(attachment.fileName)}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold text-sibs-faint">
              {prettifyFieldName(attachment.fieldName)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkflowRemarks({ workflow }) {
  const stages = Array.isArray(workflow?.stages) ? workflow.stages : [];

  return (
    <div className="space-y-3">
      {stages.map((stage) => (
        <div
          key={stage.key}
          className="rounded-[10px] border border-sibs-border bg-sibs-surface p-3.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-extrabold text-sibs-navy">{stage.label}</p>
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${statusClasses(
                stage.status,
              )}`}
            >
              {safeText(stage.status)}
            </span>
          </div>

          <p className="mt-2 text-[11px] font-semibold leading-5 text-sibs-muted">
            {safeText(stage.remarks, "No remarks")}
          </p>

          {stage.date ? (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-sibs-faint">
              <CalendarDays size={12} />
              {formatDate(stage.date)}
            </div>
          ) : null}
        </div>
      ))}

      {workflow?.terminal ? (
        <div className="rounded-[10px] border border-red-200 bg-red-50 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-extrabold text-red-700">Final Status</p>
            <span className="rounded-full border border-red-200 bg-white px-2.5 py-1 text-[10px] font-extrabold text-red-700">
              {workflow.terminal.status}
            </span>
          </div>
          <p className="mt-2 text-[11px] font-semibold leading-5 text-red-700/80">
            {safeText(workflow.terminal.remarks, "No remarks")}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function EmployeeInformation({ employee, showEmploymentStatus = false }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ReadOnlyField label="Employee Name" value={employee?.name} />
      <ReadOnlyField label="Employee ID No." value={employee?.sibsId} />
      <ReadOnlyField label="Department" value={employee?.department} />
      <ReadOnlyField label="Account" value={employee?.account} />
      {showEmploymentStatus ? (
        <ReadOnlyField
          label="Employee Status"
          value={employee?.employmentStatus}
          className="md:col-span-2 xl:col-span-1"
        />
      ) : null}
    </div>
  );
}

function FormAContent({ detail }) {
  const dependents = Array.isArray(detail?.form?.dependents)
    ? detail.form.dependents
    : [];

  return (
    <>
      <SectionCard title="Employee Information" icon={UserRound}>
        <EmployeeInformation employee={detail.employee} />
      </SectionCard>

      <SectionCard
        title="New Covered Dependent Information"
        subtitle={`${dependents.length} dependent record${dependents.length === 1 ? "" : "s"}`}
        icon={ShieldCheck}
      >
        {dependents.length ? (
          <div className="space-y-5">
            {dependents.map((dependent, index) => (
              <div
                key={dependent.id || index}
                className="rounded-[14px] border border-sibs-border bg-white p-4"
              >
                {dependents.length > 1 ? (
                  <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-sibs-orange">
                    Dependent {index + 1}
                  </p>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <ReadOnlyField label="Name of Covered Dependent" value={dependent.name} />
                  <ReadOnlyField label="Relationship" value={dependent.relationship} />
                  <ReadOnlyField label="Date of Birth" value={formatDate(dependent.dateOfBirth)} />
                  <ReadOnlyField label="Gender" value={dependent.gender} />
                  <ReadOnlyField label="Type" value={dependent.type} />
                  <ReadOnlyField label="Type of Document (if Others)" value={dependent.otherDocumentType} />
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
                    Supporting Documents
                  </p>
                  <SupportingDocuments items={dependent.supportingDocuments} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs font-semibold text-sibs-faint">
            No dependent information found for this request.
          </p>
        )}
      </SectionCard>
    </>
  );
}

function FormBContent({ detail }) {
  const form = detail.form || {};

  return (
    <>
      <SectionCard title="Employee Information" icon={UserRound}>
        <EmployeeInformation employee={detail.employee} />
      </SectionCard>

      <SectionCard title="Claim Details" icon={ShieldCheck}>
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
              Type of Claim
            </p>
            <PillList items={form.claimTypes} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
                Medical Benefit Type
              </p>
              <PillList items={form.medicalBenefitTypes} />
            </div>
            <div>
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
                Prescribed Medication Type
              </p>
              <PillList items={form.prescribedMedicationTypes} />
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
              Reimbursement Requests
            </p>
            {form.reimbursementRequests?.length ? (
              <div className="space-y-2">
                {form.reimbursementRequests.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-[10px] border border-sibs-border bg-sibs-surface px-3 py-2.5"
                  >
                    <span className="text-xs font-bold text-sibs-navy">{item.label}</span>
                    <span className="text-xs font-extrabold text-sibs-orange">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold text-sibs-faint">No reimbursement item found.</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ReadOnlyField label="Date of Service" value={formatDate(form.dateOfService)} />
            <ReadOnlyField label="Name of Employee/Dependent" value={form.claimantName} />
            <ReadOnlyField label="Amount Claimed" value={formatCurrency(form.amountClaimed)} />
            <ReadOnlyField label="Diagnosis" value={form.diagnosis} className="md:col-span-2 xl:col-span-3" multiline />
            <ReadOnlyField label="Name of Healthcare Facility" value={form.healthcareFacility} />
            <ReadOnlyField label="Address of Healthcare Facility" value={form.healthcareFacilityAddress} className="md:col-span-1 xl:col-span-2" />
            <ReadOnlyField label="Description of Services/Items" value={form.servicesItems} className="md:col-span-2 xl:col-span-3" multiline />
            <ReadOnlyField label="Type of Document (if Others)" value={form.otherDocumentType} className="md:col-span-2 xl:col-span-3" />
          </div>

          <div>
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
              Supporting Documents
            </p>
            <SupportingDocuments items={form.supportingDocuments} />
          </div>
        </div>
      </SectionCard>
    </>
  );
}

function FormCContent({ detail }) {
  const form = detail.form || {};

  return (
    <>
      <SectionCard title="Employee Information" icon={UserRound}>
        <EmployeeInformation employee={detail.employee} showEmploymentStatus />
      </SectionCard>

      <SectionCard title="Request Details" icon={ShieldCheck}>
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
              Type of Assistance
            </p>
            <PillList items={form.assistanceTypes} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ReadOnlyField label="Date of Incident/Event" value={formatDate(form.incidentDate)} />
            <ReadOnlyField label="Description of Incident or Reason for Request" value={form.reason} className="md:col-span-2" multiline />
          </div>

          <div>
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
              Supporting Documents
            </p>
            <SupportingDocuments items={form.supportingDocuments} />
          </div>

          <ReadOnlyField label="Type of Document (if Others)" value={form.otherDocumentType} />
        </div>
      </SectionCard>
    </>
  );
}

function DetailContent({ detail }) {
  if (detail.formType === "Form A") {
    return <FormAContent detail={detail} />;
  }

  if (detail.formType === "Form B") {
    return <FormBContent detail={detail} />;
  }

  return <FormCContent detail={detail} />;
}

export default function ChwcpRequestDetailsModal({ requestId, employee, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isOpen = Boolean(requestId);
  const workflow = useMemo(() => detail?.form?.workflow || null, [detail]);
  const displayFormType =
    detail?.formType || getFormTypeFromRequestId(requestId);
  const summaryEmployee = useMemo(
    () => ({
      ...(detail?.employee || {}),
      ...(employee || {}),
      name:
        detail?.employee?.name ||
        employee?.employeeName ||
        employee?.name ||
        employee?.fullName ||
        employee?.full_name ||
        "Employee",
      employeeName:
        detail?.employee?.name ||
        employee?.employeeName ||
        employee?.name ||
        employee?.fullName ||
        employee?.full_name ||
        "Employee",
      sibsId:
        detail?.employee?.sibsId ||
        employee?.sibsId ||
        employee?.sibs_id ||
        "",
    }),
    [detail?.employee, employee],
  );

  useEffect(() => {
    if (!requestId) {
      setDetail(null);
      setError("");
      return;
    }

    let cancelled = false;

    async function loadDetail() {
      setLoading(true);
      setError("");

      try {
        const result = await getChwcpRequestDetails(requestId);

        if (cancelled) return;
        setDetail(result.data || null);
      } catch (loadError) {
        if (cancelled) return;
        setDetail(null);
        setError(loadError?.message || "Failed to load CHWCP request details.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [requestId]);

  if (!isOpen) {
    return null;
  }

  return (
    <ModalShell
      open={isOpen}
      onClose={onClose}
      variant="navy"
      icon={FileText}
      title={`CHWCP REQUEST DETAILS - ${displayFormType.toUpperCase()}`}
      subtitle="Comprehensive health and compliance request record"
      maxWidth="max-w-[1400px]"
      bodyClassName="bg-sibs-surface p-4 sm:p-5"
      footer={
        <div className="flex w-full items-center justify-between gap-4">
          <div className="hidden items-center gap-2 text-[10px] font-semibold text-sibs-muted sm:flex">
            <span className="h-2 w-2 rounded-full bg-sibs-orange" />
            Read-only CHWCP form record.
          </div>

          <button
            type="button"
            onClick={onClose}
            className="sibs-btn-secondary !h-8.5 2xl:!h-10 ml-auto px-4 2xl:px-5"
          >
            Close
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[10px] border border-sibs-border bg-white text-center">
          <LoaderCircle size={32} className="animate-spin text-sibs-orange" />
          <p className="mt-3 text-sm font-extrabold text-sibs-navy">
            Loading CHWCP request...
          </p>
          <p className="mt-1 text-xs font-semibold text-sibs-faint">
            Fetching the complete form data.
          </p>
        </div>
      ) : error ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[10px] border border-sibs-border bg-white text-center">
          <RefreshCcw size={30} className="text-red-500" />
          <p className="mt-3 text-sm font-extrabold text-red-600">
            Unable to load request details
          </p>
          <p className="mt-1 max-w-lg text-xs font-semibold text-sibs-muted">
            {error}
          </p>
        </div>
      ) : detail ? (
        <div className="space-y-4">
          <section
            data-testid="request-summary-strip"
            className="request-summary-strip overflow-hidden rounded-[10px] border border-sibs-border bg-white shadow-xs"
          >
            <div className="h-0.5 bg-gradient-to-r from-sibs-navy via-sibs-orange to-sibs-navy" />

            <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <EmployeeAvatar employee={summaryEmployee} size="lg" />

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="sibs-modal-section-title break-words text-sibs-navy">
                      {safeText(summaryEmployee.employeeName)}
                    </h3>

                    <span className="rounded-[10px] border border-sibs-border bg-sibs-surface px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-sibs-secondary">
                      {safeText(detail.formType)}
                    </span>

                    <span className="rounded-[10px] border border-blue-100 bg-blue-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-sibs-navy">
                      {safeText(detail.requestId || requestId)}
                    </span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-sibs-muted">
                    <span className="font-extrabold text-sibs-orange">
                      {safeText(detail.service)}
                    </span>

                    <span className="inline-flex items-center gap-1">
                      <UserRound size={11} />
                      SIBS ID: {safeText(summaryEmployee.sibsId)}
                    </span>

                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={11} />
                      Request: {formatDate(detail.requestDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-extrabold ${statusClasses(
                    detail.status,
                  )}`}
                >
                  {safeText(detail.status)}
                </span>
              </div>
            </div>
          </section>

          <DetailContent detail={detail} />

          <SectionCard title="Attach File" icon={Paperclip}>
            <AttachmentList attachments={detail.attachments || []} />
          </SectionCard>

          <SectionCard title="Important Remarks" icon={BadgeCheck}>
            <WorkflowRemarks workflow={workflow} />
          </SectionCard>
        </div>
      ) : null}
    </ModalShell>
  );
}
