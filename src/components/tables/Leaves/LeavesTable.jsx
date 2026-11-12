import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  FileText,
  Fingerprint,
  Loader2,
  Paperclip,
  RotateCcw,
  Search,
  ShieldCheck,
  UsersRound,
  XCircle,
} from "lucide-react";

import { usePagination, PaginationDateRangeFilter } from "@/services/context/PaginationContext";
import {
  DataCard,
  DatePicker,
  ModalShell,
  ResponsiveTableShell,
  SearchInput,
  SelectDropdown,
  TableEmptyRow,
  TablePagination,
  TableSkeletonRows,
} from "@/components/ui";
import DropdownPortal from "@/components/ui/DropdownPortal.jsx";
import {
  LEAVES_STATE_KEY,
  PAGE_LIMIT,
  formatDate,
  formatDateTime,
  formatNumber,
  getApprovalResultFailed,
  getApproverDisplay,
  getAvatarTone,
  getEmployeeName,
  getInitials,
  getLeavesInitialDateRange,
  LEAVES_MIN_DATE,
  sanitizeLeavesDateRange,
  getLeaveTypeLabel,
  getPaidLeaveLabel,
  getStatusClass,
  normalizeStatus,
} from "@/lib/utils/leaves/leaveHelpers";

function clearPersistedLeavesSearch() {
  if (typeof window === "undefined") return;

  try {
    const savedState = window.sessionStorage.getItem(LEAVES_STATE_KEY);

    if (!savedState) return;

    const parsed = JSON.parse(savedState);

    window.sessionStorage.setItem(
      LEAVES_STATE_KEY,
      JSON.stringify({
        ...(parsed && typeof parsed === "object" ? parsed : {}),
        search: "",
      }),
    );
  } catch {
    // Ignore malformed or unavailable session storage.
  }
}

function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${className}`}
    >
      {children}
    </span>
  );
}

const clean = (value) => {
  const text = String(value ?? "").trim();
  return text && !["n/a", "null", "undefined", "0000-00-00", "0000-00-00 00:00:00"].includes(text.toLowerCase())
    ? text
    : "—";
};

function Detail({ icon, label, value, hint }) {
  return (
    <div className="flex min-w-0 items-start gap-3 py-1.5">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-sibs-navy">
        {icon ? React.createElement(icon, { size: 17 }) : null}
      </span>
      <dl className="min-w-0">
        <dt className="text-[11px] font-semibold text-sibs-muted">{label}</dt>
        <dd className="mt-0.5 break-words text-xs font-extrabold text-sibs-navy sm:text-sm">
          {React.isValidElement(value) ? value : clean(value)}
        </dd>
        {hint && <dd className="mt-1 text-[10px] text-sibs-secondary">{hint}</dd>}
      </dl>
    </div>
  );
}

function LedgerTile({ label, value, highlight = false, accent = false }) {
  return (
    <div
      className={`min-w-0 rounded-xl border px-3.5 py-3 ${
        accent
          ? "border-orange-200 bg-orange-50/60"
          : highlight
            ? "border-blue-200 bg-blue-50/60"
            : "border-sibs-border bg-sibs-surface"
      }`}
    >
      <dt className="text-[10px] font-bold uppercase tracking-wide text-sibs-muted">{label}</dt>
      <dd
        className={`mt-1 text-sm font-extrabold tabular-nums sm:text-base ${
          accent ? "text-sibs-orange" : "text-sibs-navy"
        }`}
      >
        {value || "—"}
      </dd>
    </div>
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
            <h3 className="sibs-modal-section-title font-extrabold text-sibs-navy">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 sibs-modal-section-subtitle text-sibs-muted">{subtitle}</p>
            )}
          </div>
        </div>
        {side}
      </div>
      {children}
    </section>
  );
}

function LeaveStatusBadge({ status }) {
  const normalized = normalizeStatus(status);
  const key = String(normalized ?? "").toLowerCase();
  const tone =
    key === "approved"
      ? { wrap: "border-emerald-200 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" }
      : key === "pending"
        ? { wrap: "border-amber-200 bg-amber-50 text-amber-700", dot: "bg-amber-500" }
        : key === "rejected" || key === "disapproved"
          ? { wrap: "border-rose-200 bg-rose-50 text-rose-700", dot: "bg-rose-500" }
          : key === "cancelled" || key === "canceled"
            ? { wrap: "border-slate-200 bg-slate-50 text-slate-600", dot: "bg-slate-400" }
            : { wrap: "border-sibs-border bg-white text-sibs-secondary", dot: "bg-sibs-secondary" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${tone.wrap}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {normalized || "—"}
    </span>
  );
}

function getEmployeeProfilePictureUrl(employee = {}) {
  const values = [
    employee.profilePictureUrl,
    employee.profile_picture_url,
  ];
  const match = values.find((val) => val !== undefined && val !== null && String(val).trim() !== "");
  return match ? String(match).trim() : "";
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
  const employeeName = getEmployeeName(employee);
  const initials = getInitials(employee);

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
            className="employee-avatar-preview pointer-events-none fixed z-[9999] rounded-2xl border border-sibs-border bg-white p-2 shadow-2xl"
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
        aria-label={`${employeeName || "Employee"} profile picture`}
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
        onFocus={showPreview}
        onBlur={hidePreview}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
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

function InlineDateRangeFilter({ visible }) {
  if (!visible) return null;

  return (
    <div className="leaves-date-filter-inline w-full sm:w-auto">
      <PaginationDateRangeFilter entity="leaves" visible showTopLabels className="m-0 w-full" />
    </div>
  );
}

function LeaveModalEmployeeAvatar({ item }) {
  const profilePictureUrl = getEmployeeProfilePictureUrl(item);
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(null);
  const avatarRef = useRef(null);
  const initials = getInitials(item);
  const displayName = getEmployeeName(item) || "Employee";
  const showImage = Boolean(profilePictureUrl) && failedImageUrl !== profilePictureUrl;

  const updatePreviewPosition = () => {
    const rect = avatarRef.current?.getBoundingClientRect();
    if (!rect) return;
    const previewHeight = 176;
    const gap = 12;
    const placeBelow = rect.top < previewHeight + gap;
    setPreviewPosition({
      left: rect.left + rect.width / 2,
      top: placeBelow ? rect.bottom + gap : rect.top - gap,
      placeBelow,
    });
  };

  const showPreview = () => {
    updatePreviewPosition();
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

function LeaveDetailsModal({
  open,
  item,
  onClose,
  canApproveLeave = false,
  approvalLoading = false,
  onApproveLeave,
  onRejectLeave,
}) {
  const [decisionAction, setDecisionAction] = useState("");

  const normalizedStatus = normalizeStatus(item?.gy_leave_status);
  const isPending = normalizedStatus === "Pending";
  const approver = getApproverDisplay(item);
  const busy = Boolean(approvalLoading || decisionAction);

  if (!open || !item) return null;

  const leaveType = getLeaveTypeLabel(
    item.gy_leave_type,
    item.leaveTypeLabel || item.leave_type_label,
  );

  const attachmentName =
    item.gy_leave_attachment ||
    item.leave_attachment ||
    item.attachment_name ||
    "";

  const availableFrom = formatDate(item.gy_leave_avail_date);
  const availableTo = formatDate(item.gy_leave_avail_dateto);
  const validityWindow =
    availableFrom !== "—" || availableTo !== "—"
      ? `${availableFrom} — ${availableTo}`
      : "—";

  const canRunApproval =
    isPending &&
    canApproveLeave &&
    typeof onApproveLeave === "function" &&
    typeof onRejectLeave === "function";

  async function handleDecision(action) {
    if (!canRunApproval || busy) return;

    const callback = action === "approve" ? onApproveLeave : onRejectLeave;

    try {
      setDecisionAction(action);

      const result = await callback(item);

      if (getApprovalResultFailed(result)) {
        return;
      }

      setDecisionAction("");
      onClose?.();
    } catch (error) {
      console.error(`Unable to ${action} leave request:`, error);
    } finally {
      setDecisionAction("");
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={() => {
        if (!busy) onClose?.();
      }}
      closeOnBackdrop={!busy}
      closeOnEscape={!busy}
      title="Leave Request & Ledger Audit"
      subtitle="Detailed ledger breakdown, leave balances, and approval sign-off"
      icon={CalendarDays}
      maxWidth="max-w-6xl"
      variant="navy"
      className="rounded-[14px]"
      headerClassName="bg-sibs-navy"
      bodyClassName="bg-sibs-surface p-3 sm:p-4 2xl:p-5"
      footerMeta={
        item.gy_user_code ? (
          <span className="sibs-text-micro font-semibold text-sibs-muted">
            SiBS ID: {item.gy_user_code}
          </span>
        ) : null
      }
      footer={
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="sibs-modal-btn-secondary px-5"
        >
          Close Panel
        </button>
      }
    >
      <div className="space-y-4">
        {/* Top 2-Column Hero Card */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="sibs-card flex min-w-0 items-center gap-4 rounded-2xl border border-sibs-border bg-white px-4 py-5 sm:px-5">
            <LeaveModalEmployeeAvatar item={item} />
            <div className="min-w-0">
              <h2 className="break-words text-base font-extrabold text-sibs-navy sm:text-lg">
                {item.gy_full_name || item.gy_username || "Unknown User"}
              </h2>
              <p className="mt-1 text-xs font-semibold text-sibs-secondary">
                USER CODE (SIBS ID):{" "}
                <span className="font-extrabold text-sibs-navy">
                  {item.gy_user_code || "—"}
                </span>
              </p>
              <p className="mt-1 text-xs text-sibs-muted">
                {[item.department, item.gy_emp_account].filter(Boolean).join(" · ") || "Leave Applicant"}
              </p>
            </div>
          </div>

          <div className="relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-orange-200 bg-orange-50/70 p-4 sm:p-5">
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-200 bg-white text-sibs-orange">
                <CalendarDays size={21} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-sibs-muted">Remaining Balance</p>
                <p className="mt-0.5 text-base sm:text-lg font-extrabold text-sibs-orange tabular-nums">
                  {formatNumber(item.leave_remaining)} Days
                </p>
                <p className="mt-0.5 text-[11px] text-sibs-secondary">Leave allowance balance</p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-blue-700">
                {leaveType}
              </span>
              <LeaveStatusBadge status={normalizedStatus} />
            </div>
          </div>
        </div>

        {/* Section 1: Leave Request Information */}
        <SectionCard
          icon={FileText}
          title="Leave Request Information"
          subtitle="Leave dates, filing schedule, and request context"
        >
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <Detail
              icon={Fingerprint}
              label="Leave ID"
              value={item.gy_leave_id}
            />
            <Detail
              icon={CalendarDays}
              label="Filed Date"
              value={formatDateTime(item.gy_leave_filed)}
            />
            <Detail
              icon={CreditCard}
              label="Paid Status"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      getPaidLeaveLabel(item.gy_leave_paid) === "Paid Leave"
                        ? "bg-emerald-500"
                        : "bg-slate-400"
                    }`}
                  />
                  {getPaidLeaveLabel(item.gy_leave_paid)}
                </span>
              }
            />
            <Detail
              icon={Clock3}
              label="Total Days"
              value={`${formatNumber(item.gy_leave_day)} ${
                Number(item.gy_leave_day) === 1 ? "Day" : "Days"
              }`}
            />
            <Detail
              icon={CalendarDays}
              label="Date From"
              value={formatDate(item.gy_leave_date_from)}
            />
            <Detail
              icon={CalendarDays}
              label="Date To"
              value={formatDate(item.gy_leave_date_to)}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-sibs-border pt-4 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold text-sibs-muted">Reason</dt>
              <dd className="mt-1 min-h-[44px] rounded-xl border border-sibs-border bg-sibs-surface p-3 text-xs font-semibold leading-relaxed text-sibs-navy">
                {item.gy_leave_reason || "No specification provided."}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="text-[11px] font-semibold text-sibs-muted">Supervisor Remarks</dt>
              <dd className="mt-1 min-h-[44px] rounded-xl border border-sibs-border bg-sibs-surface p-3 text-xs font-semibold leading-relaxed text-sibs-navy">
                {item.gy_leave_remarks || "No comments filed."}
              </dd>
            </div>
          </div>
        </SectionCard>

        {/* Section 2: Leave Balance Ledger */}
        <SectionCard
          icon={CalendarCheck}
          title="Leave Balance Ledger"
          subtitle="Credit entitlement breakdown, plotted bookings, and eligibility window"
        >
          <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <LedgerTile
              label="Approved Credits"
              value={formatNumber(item.leave_credit)}
            />
            <LedgerTile
              label="Plotted Leaves"
              value={formatNumber(item.leave_plotted)}
            />
            <LedgerTile
              label="Remaining Leaves"
              value={formatNumber(item.leave_remaining)}
              accent
            />
            <LedgerTile
              label="Validity Window"
              value={validityWindow}
              highlight
            />
          </dl>

          <div className="mt-3.5 rounded-xl border border-sibs-border bg-sibs-surface p-3">
            <dt className="text-[11px] font-semibold text-sibs-muted">Balance Justification</dt>
            <dd className="mt-1 text-xs font-medium italic text-sibs-secondary">
              “{item.gy_leave_avail_justify || "No balance justification recorded."}”
            </dd>
          </div>
        </SectionCard>

        {/* Section 3: Approval Context & Security */}
        <SectionCard
          icon={ShieldCheck}
          title="Approval Context & Security"
          subtitle="Sign-off audit trail, officer verification, and attached documentation"
        >
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <Detail
              icon={UsersRound}
              label="Approver Name"
              value={approver.name}
            />
            <Detail
              icon={Fingerprint}
              label="Approver SiBS ID"
              value={approver.sibsId}
            />
            <Detail
              icon={CalendarDays}
              label="Date Approved / Processed"
              value={formatDateTime(item.gy_leave_date_approved)}
            />
          </div>

          <div className="mt-4 border-t border-sibs-border pt-4">
            <dt className="text-[11px] font-semibold text-sibs-muted mb-1.5">Attachment File</dt>
            <dd>
              {attachmentName ? (
                <div className="inline-flex max-w-full items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-2 text-xs font-extrabold text-blue-700">
                  <Paperclip size={15} className="shrink-0 text-blue-600" />
                  <span className="min-w-0 truncate font-mono text-[11.5px]">
                    {attachmentName}
                  </span>
                  <a
                    href={`/api/leaves/${item.gy_leave_id}/attachment`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={attachmentName}
                    className="shrink-0 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-blue-700"
                  >
                    Download
                  </a>
                </div>
              ) : (
                <div className="rounded-xl border border-sibs-border bg-sibs-surface px-3 py-2 text-xs font-semibold text-sibs-muted">
                  No attachments provided.
                </div>
              )}
            </dd>
          </div>
        </SectionCard>

        {/* Section 4: Pending Approval Action (if isPending) */}
        {isPending ? (
          canRunApproval ? (
            <section
              className="sibs-card overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5 shadow-xs"
              aria-label="Pending Approval Action"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white text-amber-600">
                    <AlertCircle size={18} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="sibs-modal-section-title font-extrabold text-sibs-navy">
                      Pending Approval Action
                    </h3>
                    <p className="mt-0.5 sibs-modal-section-subtitle text-amber-800">
                      Sign off or reject this request with your configured administrative access.
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleDecision("approve")}
                    disabled={busy}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-extrabold uppercase tracking-wide text-white shadow-xs transition hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {decisionAction === "approve" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    Approve Request
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDecision("reject")}
                    disabled={busy}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-rose-600 px-4 text-xs font-extrabold uppercase tracking-wide text-white shadow-xs transition hover:bg-rose-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {decisionAction === "reject" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <XCircle size={14} />
                    )}
                    Reject Request
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs font-semibold text-amber-800">
              <AlertCircle size={17} className="shrink-0 text-amber-600" />
              <span>This request is pending approval from an authorized leave approver.</span>
            </div>
          )
        ) : null}
      </div>
    </ModalShell>
  );
}

export { LeaveDetailsModal };

export default function LeavesTable({
  leaves = [],
  loading = false,
  page = 1,
  searchInput = "",
  searchKeyword = "",
  setSearchInput,
  setSearchKeyword,
  setPage,
  pagination = {
    currentPage: 1,
    limit: PAGE_LIMIT,
    returned: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  },
  statusFilter = "All",
  onStatusChange,
  showDepartmentFilter = false,
  departmentFilter = "All",
  onDepartmentSelect,
  departmentDropdownOptions = [],
  showAccountFilter = false,
  accountFilter = "All",
  onAccountSelect,
  accountDropdownOptions = [],
  isPersonalView = false,
  filterValues = {},
  allDatesView = false,
  maxDateRangeDays,
  onDateFilterChange,
  canApproveLeave = false,
  approvalLoading = false,
  onApproveLeave,
  onRejectLeave,
}) {
  const tableScrollRef = useRef(null);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [searchSubmitVersion, setSearchSubmitVersion] = useState(0);

  useEffect(() => {
    clearPersistedLeavesSearch();
    setSearchInput?.("");
    setSearchKeyword?.("");

    return () => {
      clearPersistedLeavesSearch();
      setSearchInput?.("");
      setSearchKeyword?.("");
    };
    // Run only when the Leaves table enters/leaves the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { setDateRange: setLeavesDateRange } = usePagination("leaves");
  const initialDateRange = useMemo(
    () => getLeavesInitialDateRange(isPersonalView),
    [isPersonalView],
  );
  const safeRange = sanitizeLeavesDateRange(
    { dateFrom: filterValues?.dateFrom ?? initialDateRange.dateFrom,
      dateTo: filterValues?.dateTo ?? initialDateRange.dateTo },
    { allowEmpty: allDatesView || isPersonalView, maxDays: maxDateRangeDays },
  );
  const dateFrom = allDatesView ? "" : safeRange.dateFrom;
  const dateTo = allDatesView ? "" : safeRange.dateTo;

  function handleLeavesDateFromChange(value) {
    onDateFilterChange?.();
    setLeavesDateRange?.(sanitizeLeavesDateRange(
      { dateFrom: value, dateTo },
      { changed: "from", maxDays: maxDateRangeDays },
    ));
  }

  function handleLeavesDateToChange(value) {
    onDateFilterChange?.();
    setLeavesDateRange?.(sanitizeLeavesDateRange(
      { dateFrom, dateTo: value },
      { changed: "to", maxDays: maxDateRangeDays },
    ));
  }

  function runSearch() {
    const cleanSearch = String(searchInput || "").trim();
    const currentSearch = String(searchKeyword || "").trim();

    setPage(1);
    setSearchSubmitVersion((prev) => prev + 1);

    if (cleanSearch !== currentSearch) {
      setSearchKeyword(cleanSearch);
    } else if (typeof onDateFilterChange === "function") {
      onDateFilterChange();
    }
  }

  function handleSearchKeyDown(e) {
    if (e.key !== "Enter") return;

    e.preventDefault();
    runSearch();
  }

  const hasCustomDateRange =
    dateFrom !== initialDateRange.dateFrom ||
    dateTo !== initialDateRange.dateTo;

  const hasActiveFilters = Boolean(
    String(searchInput || "").trim() ||
    (statusFilter && statusFilter !== "All") ||
    (departmentFilter && departmentFilter !== "All") ||
    (accountFilter && accountFilter !== "All") ||
    hasCustomDateRange ||
    allDatesView
  );

  function handleClearLeavesFilters() {
    onDateFilterChange?.();
    setSearchInput?.("");
    if (typeof setSearchKeyword === "function") setSearchKeyword("");
    if (typeof onStatusChange === "function") onStatusChange("All");
    if (typeof onDepartmentSelect === "function") onDepartmentSelect("All");
    if (typeof onAccountSelect === "function") onAccountSelect("All");
    setLeavesDateRange?.(initialDateRange);
    setPage?.(1);
  }

  useEffect(() => {
    if (!tableScrollRef.current) return;

    tableScrollRef.current.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, [
    page,
    searchKeyword,
    searchSubmitVersion,
    statusFilter,
    departmentFilter,
    accountFilter,
    dateFrom,
    dateTo,
    allDatesView,
  ]);

  const currentPaginationPage = Number(pagination.currentPage || page || 1);
  const totalPages = pagination.totalPages
    ? Number(pagination.totalPages)
    : pagination.hasNextPage
      ? currentPaginationPage + 1
      : currentPaginationPage;
  const totalRecords =
    pagination.totalRecords !== undefined
      ? Number(pagination.totalRecords)
      : pagination.total !== undefined
        ? Number(pagination.total)
        : (pagination.hasNextPage ? undefined : (currentPaginationPage - 1) * PAGE_LIMIT + leaves.length);

  return (
    <>
      <section
        className="sibs-page-card-in sibs-card flex min-h-full flex-1 flex-col justify-between min-w-0 overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-xs font-jakarta"
        style={{ animationDelay: "240ms", animationFillMode: "both" }}
      >
        <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6 font-jakarta">
          <h3 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
            {isPersonalView ? "My Leave Records" : "Leave Records"}
          </h3>
          <p className="mt-1 sibs-text-xs font-semibold text-sibs-muted">
            {isPersonalView
              ? "Review your filed leaves, approval statuses, justifications, and attachment context."
              : "Review employee leave requests, approval statuses, justifications, and attachment records."}
          </p>

          <div className="mt-3.5 2xl:mt-4 flex flex-col gap-3 overflow-visible xl:flex-row xl:items-end">
            <div className="relative w-full min-w-0 xl:min-w-[180px] xl:flex-[1_1_220px] 2xl:min-w-[280px] 2xl:flex-[1_1_360px]">
              <SearchInput
                label="Search"
                labelClassName="sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
                value={searchInput}
                placeholder="Search by employee, SiBS ID, leave type, or status..."
                onChange={(e) => setSearchInput(typeof e === "string" ? e : e?.target?.value ?? "")}
                onKeyDown={handleSearchKeyDown}
                disabled={loading}
              />
            </div>

            <div className="w-full xl:w-[135px] 2xl:w-[180px] xl:flex-none">
              <SelectDropdown
                label="Status"
                labelClassName="sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
                value={statusFilter || "All"}
                options={[
                  { label: "All Statuses", value: "All" },
                  { label: "Approved", value: "Approved" },
                  { label: "Pending", value: "Pending" },
                  { label: "Rejected", value: "Rejected" },
                ]}
                onChange={onStatusChange}
                placeholder="All Statuses"
                clearable={false}
                disabled={loading}
              />
            </div>

            {showDepartmentFilter ? (
              <div className="w-full xl:w-[150px] 2xl:w-[210px] xl:flex-none">
                <SelectDropdown
                  className="sibs-leaves-directory-filter"
                  label="Department"
                  labelClassName="sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
                  value={departmentFilter || "All"}
                  options={[
                    { label: "All Departments", value: "All" },
                    ...departmentDropdownOptions,
                  ]}
                  onChange={onDepartmentSelect}
                  searchable
                  placeholder="All Departments"
                  clearable={false}
                  disabled={loading}
                />
              </div>
            ) : null}

            {showAccountFilter ? (
              <div className="w-full xl:w-[150px] 2xl:w-[210px] xl:flex-none">
                <SelectDropdown
                  className="sibs-leaves-directory-filter"
                  label="Account"
                  labelClassName="sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
                  value={accountFilter || "All"}
                  options={[
                    { label: "All Accounts", value: "All" },
                    ...accountDropdownOptions,
                  ]}
                  onChange={onAccountSelect}
                  searchable
                  placeholder="All Accounts"
                  clearable={false}
                  disabled={loading}
                />
              </div>
            ) : null}

            <div className="w-full xl:w-[165px] 2xl:w-[195px] xl:flex-none">
              <label className="mb-1 block font-jakarta sibs-text-micro font-extrabold tracking-normal text-sibs-navy">
                From Date
              </label>
              <DatePicker
                value={dateFrom || ""}
                min={LEAVES_MIN_DATE}
                max={dateTo || undefined}
                onChange={(val) => handleLeavesDateFromChange(val)}
                disabled={loading}
                hideLabel
                placeholder="Select date"
                clearable
                showToday
              />
            </div>

            <div className="w-full xl:w-[165px] 2xl:w-[195px] xl:flex-none">
              <label className="mb-1 block font-jakarta sibs-text-micro font-extrabold tracking-normal text-sibs-navy">
                To Date
              </label>
              <DatePicker
                value={dateTo || ""}
                min={dateFrom && dateFrom >= LEAVES_MIN_DATE ? dateFrom : LEAVES_MIN_DATE}
                onChange={(val) => handleLeavesDateToChange(val)}
                disabled={loading}
                hideLabel
                placeholder="Select date"
                clearable
                showToday
              />
            </div>

            {hasActiveFilters ? (
              <div className="flex w-full min-w-0 items-end xl:w-auto xl:flex-none">
                <button
                  type="button"
                  onClick={handleClearLeavesFilters}
                  disabled={loading}
                  className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-50 xl:w-auto"
                >
                  <RotateCcw size={14} />
                  Clear
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={runSearch}
            disabled={loading}
            className="mt-3 sibs-btn-primary !h-10 w-full text-xs font-extrabold lg:hidden"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Search size={15} />
            )}
            Apply Search
          </button>
        </div>

        <div className="p-3 sm:p-5 2xl:p-6 font-jakarta">
          <ResponsiveTableShell
            desktopContent={
              <div className="sibs-data-table-shell">
                <div
                  ref={tableScrollRef}
                  className="max-h-[480px] 2xl:max-h-[640px] overflow-auto sibs-scrollbar"
                >
                  <table className="w-full min-w-[1420px] border-collapse bg-white">
                    <thead className="sibs-data-table-head sticky top-0 z-10 bg-sibs-surface">
                      <tr className="sibs-data-table-head-row">
                        <th className="sibs-data-table-th whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-left">
                          SIBS ID
                        </th>
                        <th className="sibs-data-table-th whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-left">
                          Employee Name
                        </th>
                        <th className="sibs-data-table-th whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-left">
                          Account
                        </th>
                        <th className="sibs-data-table-th whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-left">
                          Leave Type
                        </th>
                        <th className="sibs-data-table-th whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-center">
                          Filed
                        </th>
                        <th className="sibs-data-table-th whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-center">
                          Date From
                        </th>
                        <th className="sibs-data-table-th whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-center">
                          Date To
                        </th>
                        <th className="sibs-data-table-th whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-center">
                          Days
                        </th>
                        <th className="sibs-data-table-th whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-center">
                          Credits
                        </th>
                        <th className="sibs-data-table-th whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-center">
                          Plotted
                        </th>
                        <th className="sibs-data-table-th whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-center">
                          Remaining
                        </th>
                        <th className="sibs-data-table-th whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-center">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody
                      key={`${page}-${searchKeyword}-${searchSubmitVersion}-${statusFilter}-${departmentFilter}-${accountFilter}-${dateFrom}-${dateTo}-${loading}`}
                      className="divide-y divide-sibs-border"
                    >
                      {loading ? (
                        <TableSkeletonRows
                          count={PAGE_LIMIT}
                          columns={12}
                          cellClassName="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle"
                        />
                      ) : leaves.length > 0 ? (
                        leaves.map((item) => (
                          <tr
                            key={`${item.gy_leave_id}-${item.gy_user_id}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedLeave(item)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setSelectedLeave(item);
                              }
                            }}
                            className="sibs-data-table-row hover:bg-sibs-cream-subtle transition-colors cursor-pointer"
                          >
                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-extrabold text-sibs-orange tabular-nums">
                              {item.gy_user_code || "—"}
                            </td>

                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="shrink-0"
                                  onClick={(event) => event.stopPropagation()}
                                  onKeyDown={(event) => event.stopPropagation()}
                                >
                                  <EmployeeAvatar employee={item} />
                                </div>

                                <p className="m-0 max-w-[240px] truncate sibs-text-xs font-extrabold text-sibs-navy">
                                  {item.gy_full_name || item.gy_username || "—"}
                                </p>
                              </div>
                            </td>

                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-semibold text-slate-700">
                              <span className="inline-flex max-w-[190px] truncate rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 sibs-text-micro font-extrabold uppercase text-sibs-navy">
                                {item.gy_emp_account || "—"}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-semibold text-slate-700">
                              {item.leaveTypeLabel ||
                                getLeaveTypeLabel(
                                  item.gy_leave_type,
                                  item.leave_type_label,
                                )}
                            </td>

                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-center sibs-text-xs font-semibold text-slate-600">
                              {formatDate(item.gy_leave_filed)}
                            </td>
                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-center sibs-text-xs font-semibold text-slate-600">
                              {formatDate(item.gy_leave_date_from)}
                            </td>
                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-center sibs-text-xs font-semibold text-slate-600">
                              {formatDate(item.gy_leave_date_to)}
                            </td>
                            <td className="whitespace-nowrap bg-slate-50/60 px-3 2xl:px-4 py-2 2xl:py-2.5 text-center sibs-text-xs font-extrabold tabular-nums text-sibs-navy">
                              {formatNumber(item.gy_leave_day)}
                            </td>
                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-center sibs-text-xs font-extrabold tabular-nums text-slate-700">
                              {formatNumber(item.leave_credit)}
                            </td>
                            <td className="whitespace-nowrap bg-amber-50/30 px-3 2xl:px-4 py-2 2xl:py-2.5 text-center sibs-text-xs font-extrabold tabular-nums text-amber-600">
                              {formatNumber(item.leave_plotted)}
                            </td>
                            <td className="whitespace-nowrap bg-emerald-50/30 px-3 2xl:px-4 py-2 2xl:py-2.5 text-center sibs-text-xs font-extrabold tabular-nums text-emerald-600">
                              {formatNumber(item.leave_remaining)}
                            </td>
                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-center sibs-text-xs">
                              <Badge className={getStatusClass(item.gy_leave_status)}>
                                {item.normalizedStatus ||
                                  normalizeStatus(item.gy_leave_status)}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <TableEmptyRow
                          colSpan={12}
                          icon={CalendarDays}
                          title="No leave records found"
                          description="Adjust the search, status, department, account, or date range filters."
                        />
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            }
            mobileContent={
              <div className="space-y-3">
                {loading ? (
                  <DataCard.Skeleton count={4} />
                ) : leaves.length > 0 ? (
                  leaves.map((item, index) => {
                    const normalizedStatus =
                      item.normalizedStatus ||
                      normalizeStatus(item.gy_leave_status);
                    const leaveType =
                      item.leaveTypeLabel ||
                      getLeaveTypeLabel(
                        item.gy_leave_type,
                        item.leave_type_label,
                      );

                    return (
                      <DataCard
                        key={`mobile-card-${item.gy_leave_id}-${item.gy_user_id}`}
                        onClick={() => setSelectedLeave(item)}
                        index={index}
                      >
                        {/* Top Row: Avatar + Employee Name & SiBS ID + Status Badge */}
                        <DataCard.Header
                          avatar={<EmployeeAvatar employee={item} />}
                          title={item.gy_full_name || item.gy_username || "—"}
                          subtitle={
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-extrabold text-sibs-orange">
                                {item.gy_user_code || "—"}
                              </span>
                              {item.gy_emp_account && (
                                <>
                                  <span className="text-[10px] text-slate-300">•</span>
                                  <span className="truncate text-[10px] font-bold uppercase text-sibs-navy">
                                    {item.gy_emp_account}
                                  </span>
                                </>
                              )}
                            </div>
                          }
                          badge={
                            <Badge className={getStatusClass(item.gy_leave_status)}>
                              {normalizedStatus}
                            </Badge>
                          }
                        />

                        {/* Middle Row: Leave Type & Dates Span */}
                        <DataCard.ContextRow>
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span className="inline-flex items-center rounded border border-blue-200/60 bg-white px-2 py-0.5 text-[10px] font-bold text-sibs-navy shadow-2xs">
                              {leaveType}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                            <CalendarDays size={13} className="shrink-0 text-sibs-muted" />
                            <span>
                              {formatDate(item.gy_leave_date_from)}
                              {item.gy_leave_date_to &&
                              item.gy_leave_date_to !== item.gy_leave_date_from
                                ? ` → ${formatDate(item.gy_leave_date_to)}`
                                : ""}
                            </span>
                          </div>
                        </DataCard.ContextRow>

                        {/* Metric Pills Grid: Days | Credits | Plotted | Remaining */}
                        <DataCard.Metrics cols={4}>
                          <DataCard.MetricItem
                            label="Days"
                            value={formatNumber(item.gy_leave_day)}
                            tone="default"
                          />
                          <DataCard.MetricItem
                            label="Credits"
                            value={formatNumber(item.leave_credit)}
                            tone="secondary"
                          />
                          <DataCard.MetricItem
                            label="Plotted"
                            value={formatNumber(item.leave_plotted)}
                            tone="amber"
                          />
                          <DataCard.MetricItem
                            label="Remaining"
                            value={formatNumber(item.leave_remaining)}
                            tone="emerald"
                          />
                        </DataCard.Metrics>

                        {/* Card Footer: Filed date + Details link hint */}
                        <DataCard.Footer
                          metadata={
                            <>
                              Filed:{" "}
                              <strong className="text-slate-600">
                                {formatDate(item.gy_leave_filed)}
                              </strong>
                            </>
                          }
                          actionLabel="Details"
                        />
                      </DataCard>
                    );
                  })
                ) : (
                  <DataCard.Empty
                    icon={<CalendarDays size={22} />}
                    title="No leave records found"
                    description="Adjust the search, status, department, account, or date range filters."
                  />
                )}
              </div>
            }
          />

          <div className="mt-4 2xl:mt-5">
            <TablePagination
              currentPage={currentPaginationPage}
              totalPages={totalPages}
              totalRecords={totalRecords}
              loadedCount={leaves.length}
              pageSize={PAGE_LIMIT}
              onPageChange={(nextPage) => setPage(nextPage)}
              recordLabel="leave records"
              loading={loading}
            />
          </div>
        </div>
      </section>

      <LeaveDetailsModal
        open={Boolean(selectedLeave)}
        item={selectedLeave}
        onClose={() => setSelectedLeave(null)}
        canApproveLeave={canApproveLeave}
        approvalLoading={approvalLoading}
        onApproveLeave={onApproveLeave}
        onRejectLeave={onRejectLeave}
      />
    </>
  );
}
