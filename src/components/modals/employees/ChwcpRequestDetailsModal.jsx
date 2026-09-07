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
  X,
} from "lucide-react";

import { getChwcpRequestDetails } from "../../../lib/axios/getChwcp";

function safeText(value, fallback = "N/A") {
  const text = String(value ?? "").trim();
  return text || fallback;
}


const AVATAR_TONES = [
  "border-orange-100 bg-orange-50 text-[#FF5C28]",
  "border-emerald-100 bg-emerald-50 text-emerald-700",
  "border-blue-100 bg-blue-50 text-[#07355F]",
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
            className="employee-avatar-preview pointer-events-none fixed z-[11000] rounded-2xl border border-[#D9E6F2] bg-white p-2 shadow-[0_18px_45px_rgba(4,44,81,0.22)]"
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
              className={`relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-xl border text-[24px] font-extrabold ${getAvatarTone(
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
    month: "short",
    day: "2-digit",
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

  return "border-blue-200 bg-blue-50 text-[#042C51]";
}

function SectionCard({ title, subtitle, icon: Icon = FileText, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#DCE5EE] bg-white shadow-[0_1px_2px_rgba(4,44,81,0.04)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#E7EDF3] px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF4FA] text-[#07355F]">
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

        <span className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-[#07355F] sm:block" />
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function ReadOnlyField({ label, value, className = "", multiline = false }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#7B8DB3]">
        {label}
      </p>
      <div
        className={`rounded-lg border border-[#DCE5EE] bg-[#F8FAFC] px-3 py-2.5 text-xs font-extrabold leading-5 text-[#07355F] ${
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
    return <span className="text-xs font-semibold text-[#98A2B3]">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((item) => (
        <span
          key={item}
          className="inline-flex rounded-lg border border-[#FF5C28]/30 bg-[#FFF7F3] px-2.5 py-1.5 text-[11px] font-extrabold text-[#042C51]"
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
    return <p className="text-xs font-semibold text-[#98A2B3]">No supporting documents marked.</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {values.map((item) => (
        <div
          key={item}
          className="flex items-center gap-2 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2"
        >
          <BadgeCheck size={15} className="shrink-0 text-emerald-600" />
          <span className="text-[11px] font-bold text-[#344054]">{item}</span>
        </div>
      ))}
    </div>
  );
}

function AttachmentList({ attachments = [] }) {
  if (!attachments.length) {
    return <p className="text-xs font-semibold text-[#98A2B3]">No attached files found.</p>;
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id || `${attachment.fieldName}-${attachment.fileName}`}
          className="flex min-w-0 items-center gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2.5"
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#FF5C28] shadow-sm">
            <Paperclip size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-extrabold text-[#042C51]" title={attachment.fileName}>
              {safeText(attachment.fileName)}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold text-[#98A2B3]">
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
          className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-extrabold text-[#042C51]">{stage.label}</p>
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${statusClasses(
                stage.status,
              )}`}
            >
              {safeText(stage.status)}
            </span>
          </div>

          <p className="mt-2 text-[11px] font-semibold leading-5 text-[#667085]">
            {safeText(stage.remarks, "No remarks")}
          </p>

          {stage.date ? (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-[#98A2B3]">
              <CalendarDays size={12} />
              {formatDate(stage.date)}
            </div>
          ) : null}
        </div>
      ))}

      {workflow?.terminal ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5">
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
                className="rounded-2xl border border-[#E6ECF2] bg-[#FCFDFE] p-4"
              >
                {dependents.length > 1 ? (
                  <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-[#FF5C28]">
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
                  <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-[#7B8DB3]">
                    Supporting Documents
                  </p>
                  <SupportingDocuments items={dependent.supportingDocuments} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs font-semibold text-[#98A2B3]">
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
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-[#7B8DB3]">
              Type of Claim
            </p>
            <PillList items={form.claimTypes} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-[#7B8DB3]">
                Medical Benefit Type
              </p>
              <PillList items={form.medicalBenefitTypes} />
            </div>
            <div>
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-[#7B8DB3]">
                Prescribed Medication Type
              </p>
              <PillList items={form.prescribedMedicationTypes} />
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-[#7B8DB3]">
              Reimbursement Requests
            </p>
            {form.reimbursementRequests?.length ? (
              <div className="space-y-2">
                {form.reimbursementRequests.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2.5"
                  >
                    <span className="text-xs font-bold text-[#042C51]">{item.label}</span>
                    <span className="text-xs font-extrabold text-[#FF5C28]">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold text-[#98A2B3]">No reimbursement item found.</p>
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
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-[#7B8DB3]">
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
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-[#7B8DB3]">
              Type of Assistance
            </p>
            <PillList items={form.assistanceTypes} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ReadOnlyField label="Date of Incident/Event" value={formatDate(form.incidentDate)} />
            <ReadOnlyField label="Description of Incident or Reason for Request" value={form.reason} className="md:col-span-2" multiline />
          </div>

          <div>
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-[#7B8DB3]">
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
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

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

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="sibs-modal-blur fixed inset-0 z-[10000] flex items-center justify-center bg-[#031A2D]/72 p-3 font-jakarta backdrop-blur-[3px] sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="CHWCP request details"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl border border-[#D6E1EA] bg-[#F6F8FB] shadow-[0_28px_80px_rgba(0,20,38,0.36)] font-jakarta"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="shrink-0 bg-[#07355F] px-5 py-3 text-white sm:px-6 2xl:py-3.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
              <span className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
                <FileText size={18} />
              </span>

              <div className="min-w-0">
                <h2 className="sibs-modal-title truncate text-white">
                  CHWCP REQUEST DETAILS - {displayFormType.toUpperCase()}
                </h2>
                <p className="sibs-modal-subtitle mt-0.5 truncate text-white/80">
                  Comprehensive health and compliance request record
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close CHWCP request details"
              title="Close"
            >
              <X size={17} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F6F8FB] p-4 sibs-scrollbar sm:p-5">
          {loading ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-[#DCE5EE] bg-white text-center">
              <LoaderCircle size={32} className="animate-spin text-[#FF5C28]" />
              <p className="mt-3 text-sm font-extrabold text-[#07355F]">
                Loading CHWCP request...
              </p>
              <p className="mt-1 text-xs font-semibold text-[#98A2B3]">
                Fetching the complete form data.
              </p>
            </div>
          ) : error ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-[#DCE5EE] bg-white text-center">
              <RefreshCcw size={30} className="text-red-500" />
              <p className="mt-3 text-sm font-extrabold text-red-600">
                Unable to load request details
              </p>
              <p className="mt-1 max-w-lg text-xs font-semibold text-[#667085]">
                {error}
              </p>
            </div>
          ) : detail ? (
            <div className="space-y-4">
              <section
                data-testid="request-summary-strip"
                className="request-summary-strip overflow-hidden rounded-xl border border-[#DCE5EE] bg-white shadow-[0_1px_2px_rgba(4,44,81,0.04)]"
              >
                <div className="h-0.5 bg-gradient-to-r from-[#07355F] via-[#FF5C28] to-[#07355F]" />

                <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <EmployeeAvatar employee={summaryEmployee} size="lg" />

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="sibs-modal-section-title break-words text-[#07355F]">
                          {safeText(summaryEmployee.employeeName)}
                        </h3>

                        <span className="rounded-md border border-[#D7E2EC] bg-[#F8FAFC] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#536887]">
                          {safeText(detail.formType)}
                        </span>

                        <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#07355F]">
                          {safeText(detail.requestId || requestId)}
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-[#667085]">
                        <span className="font-extrabold text-[#FF5C28]">
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
        </div>

        <footer className="modal-footer flex shrink-0 items-center justify-between gap-4 border-t border-[#DCE5EE] bg-white px-5 py-3 sm:px-6">
          <div className="hidden items-center gap-2 text-[10px] font-semibold text-[#667085] sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#FF5C28]" />
            Read-only CHWCP form record.
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D7E2EC] bg-white px-4 2xl:px-5 font-jakarta sibs-text-xs font-extrabold text-[#07355F] transition hover:border-[#FF5C28]/50 hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
          >
            Close
          </button>
        </footer>
      </div>
    </div>,

    document.body,
  );
}
