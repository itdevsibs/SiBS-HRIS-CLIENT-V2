import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  FileText,
  Fingerprint,
  IdCard,
  UserX,
} from "lucide-react";
import { ModalShell, StatusBadge } from "@/components/ui";

function formatModalDate(val) {
  if (!val) return "—";
  const str = String(val).slice(0, 10);
  const d = new Date(`${str}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return str;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function getEmployeeInitials(record = {}) {
  if (record.firstName || record.lastName) {
    const f = (record.firstName || "").trim();
    const l = (record.lastName || "").trim();
    if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
    if (f) return f.slice(0, 2).toUpperCase();
    if (l) return l.slice(0, 2).toUpperCase();
  }
  const cleanName = String(record.employeeName || "").replace(",", " ").trim();
  const tokens = cleanName.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
  }
  if (tokens.length === 1 && tokens[0].length >= 2) {
    return tokens[0].slice(0, 2).toUpperCase();
  }
  return "EM";
}

function ModalEmployeeAvatar({ record }) {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(null);
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const avatarRef = useRef(null);

  const profilePictureUrl = String(
    record?.profilePictureUrl || record?.profile_picture_url || "",
  ).trim();
  const showImage =
    Boolean(profilePictureUrl) && failedImageUrl !== profilePictureUrl;
  const initials = getEmployeeInitials(record);
  const displayName = record?.employeeName || "Employee";

  const showPreview = () => {
    const rect = avatarRef.current?.getBoundingClientRect();
    if (!rect) return;
    const gap = 12;
    const placeBelow = rect.top < 176 + gap;
    setPreviewPosition({
      left: rect.left + rect.width / 2,
      top: placeBelow ? rect.bottom + gap : rect.top - gap,
      placeBelow,
    });
    setPreviewVisible(true);
  };

  useEffect(() => {
    if (!previewVisible) return undefined;
    const reposition = () => {
      const rect = avatarRef.current?.getBoundingClientRect();
      if (!rect) return;
      const gap = 12;
      const placeBelow = rect.top < 176 + gap;
      setPreviewPosition({
        left: rect.left + rect.width / 2,
        top: placeBelow ? rect.bottom + gap : rect.top - gap,
        placeBelow,
      });
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [previewVisible]);

  const profileImage = (sizeClass, preview = false) => (
    <span
      className={`relative flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sibs-navy font-extrabold text-white ${
        preview ? "text-2xl" : "text-base shadow-sm"
      }`}
    >
      <span aria-hidden="true">{initials}</span>
      {showImage && (
        <img
          src={profilePictureUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailedImageUrl(profilePictureUrl)}
        />
      )}
    </span>
  );

  return (
    <>
      <span
        ref={avatarRef}
        className="relative inline-flex shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-sibs-orange focus-visible:ring-offset-2 rounded-xl"
        tabIndex={0}
        aria-label={`${displayName} profile picture`}
        onMouseEnter={showPreview}
        onMouseLeave={() => setPreviewVisible(false)}
        onFocus={showPreview}
        onBlur={() => setPreviewVisible(false)}
      >
        {profileImage("h-14 w-14")}
      </span>
      {previewVisible && previewPosition && typeof document !== "undefined" && createPortal(
        <span
          className="employee-avatar-preview pointer-events-none fixed z-[9999] rounded-2xl border border-sibs-border bg-white p-2 shadow-[0_18px_45px_rgba(4,44,81,0.22)]"
          style={{
            left: previewPosition.left,
            top: previewPosition.top,
            transform: previewPosition.placeBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)",
          }}
          aria-hidden="true"
        >
          {profileImage("h-40 w-40", true)}
        </span>,
        document.body,
      )}
    </>
  );
}

function SectionCard({ icon, title, subtitle, children, side }) {
  return (
    <section
      className="sibs-card overflow-hidden rounded-2xl border border-sibs-border bg-white p-4 shadow-sm sm:p-5"
      aria-label={title}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-sibs-border pb-3.5">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="sibs-tone-navy-icon inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
            {icon ? React.createElement(icon, { size: 17 }) : null}
          </span>
          <div>
            <h3 className="sibs-modal-section-title font-extrabold text-sibs-navy">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 sibs-modal-section-subtitle text-sibs-muted">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {side}
      </div>
      {children}
    </section>
  );
}

function Detail({ icon, label, value, hint }) {
  return (
    <div className="flex min-w-0 items-start gap-3 py-1.5">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-sibs-navy">
        {icon ? React.createElement(icon, { size: 17 }) : null}
      </span>
      <dl className="min-w-0">
        <dt className="text-[11px] font-semibold text-sibs-muted">{label}</dt>
        <dd className="mt-0.5 break-words text-xs font-extrabold text-sibs-navy sm:text-sm">
          {React.isValidElement(value) ? value : value || "—"}
        </dd>
        {hint && <dd className="mt-1 text-[10px] text-sibs-secondary">{hint}</dd>}
      </dl>
    </div>
  );
}

export default function AttritionRecordDetailModal({
  open = false,
  record = null,
  onClose,
}) {
  if (!record) return null;

  const orgSummary = [
    record.department && record.department !== "Unassigned" ? record.department : null,
    record.account,
  ].filter(Boolean).join(" · ") || "Separated Employee";

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Employee Attrition & Separation Audit"
      subtitle="Detailed separation record, organizational assignment, and service timeline"
      icon={UserX}
      maxWidth="max-w-6xl"
      variant="navy"
      className="rounded-[14px]"
      headerClassName="bg-sibs-navy"
      bodyClassName="bg-sibs-surface p-3 sm:p-4 2xl:p-5"
      footerMeta={
        record.sibsId ? (
          <span className="sibs-text-micro font-semibold text-sibs-muted">
            SiBS ID: {record.sibsId}
          </span>
        ) : null
      }
      footer={
        <button
          type="button"
          onClick={onClose}
          className="sibs-modal-btn-secondary px-5"
        >
          Close Panel
        </button>
      }
    >
      <div className="space-y-4 font-jakarta">
        {/* Top 2-Column Hero Card */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="sibs-card flex min-w-0 items-center gap-4 rounded-2xl border border-sibs-border bg-white px-4 py-5 sm:px-5">
            <ModalEmployeeAvatar record={record} />
            <div className="min-w-0">
              <h2 className="break-words text-base font-extrabold text-sibs-navy sm:text-lg">
                {record.employeeName}
              </h2>
              <p className="mt-1 text-xs font-semibold text-sibs-secondary">
                USER CODE (SIBS ID):{" "}
                <span className="font-extrabold text-sibs-navy">
                  {record.sibsId || "—"}
                </span>
              </p>
              <p className="mt-1 text-xs text-sibs-muted truncate">
                {orgSummary}
              </p>
            </div>
          </div>

          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-orange-200 bg-orange-50/70 p-4 sm:p-5">
            {/* Top row: Status & Classification Badges */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-orange-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sibs-muted">
                Separation Status
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <StatusBadge status={record.status || "Inactive"} />
                {record.separationClassification === "Voluntary" ? (
                  <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-700">
                    Voluntary
                  </span>
                ) : record.separationClassification === "Involuntary" ? (
                  <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-rose-700">
                    Involuntary
                  </span>
                ) : null}
              </div>
            </div>

            {/* Main Milestone Content: Last Working Day & Tenure */}
            <div className="mt-3 flex items-center gap-3.5">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-200 bg-white text-sibs-orange shadow-xs">
                <CalendarDays size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-sibs-muted whitespace-nowrap">
                  Last Working Day
                </p>
                <p className="mt-0.5 text-base sm:text-lg font-extrabold text-sibs-navy whitespace-nowrap tabular-nums">
                  {formatModalDate(record.lastWorkingDate)}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-sibs-secondary whitespace-nowrap">
                  Tenure: <span className="font-extrabold text-slate-700">{record.tenure || "—"}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Organizational & Role Assignment */}
        <SectionCard
          icon={IdCard}
          title="Organizational & Role Assignment"
          subtitle="Employee organizational hierarchy, account assignment, and position details"
        >
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <Detail icon={Fingerprint} label="SIBS ID" value={record.sibsId} />
            <Detail
              icon={Building2}
              label="Cluster"
              value={record.cluster && record.cluster !== "Unassigned" ? record.cluster : "Unassigned"}
            />
            <Detail
              icon={BriefcaseBusiness}
              label="Account"
              value={record.account || "—"}
            />
            <Detail
              icon={Building2}
              label="Department"
              value={record.department && record.department !== "Unassigned" ? record.department : "Unassigned"}
            />
            <Detail
              icon={IdCard}
              label="Position / Role"
              value={record.position && record.position !== "—" ? record.position : "—"}
            />
            <Detail
              icon={Clock3}
              label="Total Tenure"
              value={record.tenure || "—"}
            />
          </div>
        </SectionCard>

        {/* Section 2: Service Dates & Separation Timeline */}
        <SectionCard
          icon={CalendarDays}
          title="Service Dates & Separation Timeline"
          subtitle="Milestone dates from employment commencement through official separation"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-sibs-border bg-sibs-surface p-3.5">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-sibs-muted">
                Hire Date
              </span>
              <span className="mt-1 block font-mono text-xs sm:text-sm font-extrabold text-sibs-navy whitespace-nowrap">
                {formatModalDate(record.hireDate)}
              </span>
              <span className="mt-0.5 block text-[10px] text-slate-500">
                Employment commencement date
              </span>
            </div>

            <div className="rounded-xl border border-sibs-border bg-sibs-surface p-3.5">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-sibs-muted">
                Resignation Notice Filed
              </span>
              <span className="mt-1 block font-mono text-xs sm:text-sm font-extrabold text-sibs-navy whitespace-nowrap">
                {formatModalDate(record.resignationDate)}
              </span>
              <span className="mt-0.5 block text-[10px] text-slate-500">
                HRIS resignation submission
              </span>
            </div>

            <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-3.5">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-sibs-orange">
                Last Working Day
              </span>
              <span className="mt-1 block font-mono text-xs sm:text-sm font-extrabold text-sibs-navy whitespace-nowrap">
                {formatModalDate(record.lastWorkingDate)}
              </span>
              <span className="mt-0.5 block text-[10px] text-sibs-secondary">
                Official employee separation day
              </span>
            </div>
          </div>
        </SectionCard>

        {/* Section 3: Separation Classification & Reason */}
        <SectionCard
          icon={FileText}
          title="Separation Classification & Reason"
          subtitle="Documented grounds for separation and Kronos / HRIS audit justification"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-sibs-border bg-sibs-surface p-3.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-sibs-muted">
                  Classification Category
                </span>
                <div className="mt-1.5 flex items-center gap-2">
                  {record.separationClassification === "Voluntary" ? (
                    <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Voluntary Separation
                    </span>
                  ) : record.separationClassification === "Involuntary" ? (
                    <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      Involuntary Separation
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-500 italic">
                      {record.separationClassification || "Not available"}
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-sibs-border bg-sibs-surface p-3.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-sibs-muted">
                  Current Record Status
                </span>
                <div className="mt-1.5 flex items-center gap-2">
                  <StatusBadge status={record.status || "Inactive"} />
                  <span className="text-[11px] text-slate-500 font-medium">
                    Verified Separation Record
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Reason Box */}
            <div className="rounded-xl border border-sibs-border bg-slate-50/60 p-3.5">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-sibs-muted">
                Documented Separation Reason
              </span>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-sibs-navy italic">
                {record.separationReason && record.separationReason !== "Not available"
                  ? `"${record.separationReason}"`
                  : "No detailed separation reason recorded for this employee."}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </ModalShell>
  );
}
