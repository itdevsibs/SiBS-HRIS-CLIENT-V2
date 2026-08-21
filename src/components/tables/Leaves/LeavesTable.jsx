import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CalendarDays,
  Check,
  Loader2,
  Paperclip,
  Search,
  X,
  XCircle,
} from "lucide-react";

import PaginationTable from "@/services/pagination/PaginationTable";
import { PaginationDateRangeFilter } from "@/services/context/PaginationContext";

const PAGE_LIMIT = 15;

const LEAVES_STATE_KEY = "leavesPageState";

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

function formatNumber(value) {
  if (value === "..." || value === null || value === undefined) return "...";

  const numberValue = Number(value || 0);

  return numberValue.toLocaleString("en-PH", {
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLeaveTypeLabel(type, fallbackLabel) {
  if (fallbackLabel) return fallbackLabel;

  const value = Number(type);

  switch (value) {
    case 1:
      return "Vacation / Personal";
    case 2:
      return "Sick";
    case 3:
      return "Maternal";
    case 4:
      return "Paternal";
    case 5:
      return "Solo Parent";
    case 6:
      return "Force";
    case 7:
      return "Indefinite";
    case 8:
      return "Quarantine";
    case 9:
      return "Emergency";
    default:
      return type ? `Leave Type ${type}` : "—";
  }
}

function getApproverDisplay(item) {
  const displayName = String(item?.approver_display_name || "").trim();

  const userCode = String(
    item?.approver_user_code ||
      displayName.split("-")[0] ||
      item?.gy_leave_approver ||
      "",
  )
    .trim()
    .toUpperCase();

  const lname = String(item?.approver_lname || "").trim().toUpperCase();
  const fname = String(item?.approver_fname || "").trim().toUpperCase();
  const mname = String(item?.approver_mname || "").trim().toUpperCase();

  let name = "";

  if (lname || fname || mname) {
    name = `${lname}, ${fname} ${mname}`.replace(/\s+/g, " ").trim();
  } else if (displayName) {
    const displayParts = displayName.split("-");
    name = String(displayParts.slice(1).join("-") || "")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }

  return {
    sibsId: userCode || "—",
    name: name || "—",
  };
}

function normalizeStatus(status) {
  const value = String(status || "").trim();

  if (!value) return "Pending";

  const lower = value.toLowerCase();

  if (["approved", "approve", "1"].includes(lower)) return "Approved";

  if (
    ["rejected", "declined", "not approved", "not_approved", "2"].includes(
      lower,
    )
  ) {
    return "Rejected";
  }

  if (["pending", "for approval", "for_approval", "0"].includes(lower)) {
    return "Pending";
  }

  return value;
}

function getStatusClass(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "Approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-600";
  }

  if (normalized === "Rejected") {
    return "border-red-200 bg-red-50 text-red-600";
  }

  return "border-amber-200 bg-amber-50 text-amber-600";
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

function SectionHeading({ children }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h3 className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#8A98B8]">
        {children}
      </h3>

      <span className="h-px flex-1 bg-[#9FB3C8]" />
    </div>
  );
}

function CompactField({
  label,
  value,
  accent = false,
  children,
  className = "",
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-[9px] font-extrabold uppercase leading-4 tracking-wide text-[#8A98B8]">
        {label}
      </p>

      {children || (
        <p
          className={`mt-0.5 break-words text-xs font-extrabold leading-5 ${
            accent ? "text-[#FF5C28]" : "text-[#042C51]"
          }`}
        >
          {value || "—"}
        </p>
      )}
    </div>
  );
}

function LedgerMetric({
  label,
  value,
  accent = false,
  className = "",
}) {
  return (
    <div
      className={`rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2.5 text-center ${className}`}
    >
      <p className="text-[8px] font-extrabold uppercase tracking-wide text-[#8A98B8]">
        {label}
      </p>

      <p
        className={`mt-1 break-words text-sm font-extrabold tabular-nums ${
          accent ? "text-[#FF5C28]" : "text-[#52637A]"
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

function getPaidLeaveLabel(value) {
  if (value === true) return "Paid Leave";
  if (value === false) return "Unpaid Leave";

  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (["paid", "paid leave", "yes", "true"].includes(normalized)) {
    return "Paid Leave";
  }

  if (["unpaid", "unpaid leave", "no", "false"].includes(normalized)) {
    return "Unpaid Leave";
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    return numericValue > 0 ? "Paid Leave" : "Unpaid Leave";
  }

  return normalized ? String(value) : "—";
}

const AVATAR_TONES = [
  "border-orange-100 bg-orange-50 text-[#FF5C28]",
  "border-emerald-100 bg-emerald-50 text-emerald-700",
  "border-blue-100 bg-blue-50 text-[#042C51]",
  "border-pink-100 bg-pink-50 text-pink-700",
  "border-violet-100 bg-violet-50 text-violet-700",
];

function getCleanValue(...values) {
  const match = values.find((value) => {
    return value !== undefined && value !== null && String(value).trim() !== "";
  });

  return match === undefined || match === null ? "" : String(match).trim();
}

function getNameParts(employee = {}) {
  return {
    firstName: getCleanValue(
      employee.firstName,
      employee.first_name,
      employee.gy_emp_fname,
    ),
    middleName: getCleanValue(
      employee.middleName,
      employee.middle_name,
      employee.gy_emp_mname,
    ),
    lastName: getCleanValue(
      employee.lastName,
      employee.last_name,
      employee.gy_emp_lname,
    ),
  };
}

function getEmployeeName(employee = {}) {
  const { firstName, middleName, lastName } = getNameParts(employee);

  if (firstName || middleName || lastName) {
    const givenNames = [firstName, middleName].filter(Boolean).join(" ");

    return [lastName ? lastName.toUpperCase() : "", givenNames]
      .filter(Boolean)
      .join(lastName && givenNames ? ", " : "")
      .replace(/\s+/g, " ")
      .trim();
  }

  return (
    getCleanValue(
      employee.fullName,
      employee.full_name,
      employee.gy_emp_fullname,
      employee.name,
    ) || "Unnamed Employee"
  );
}

function getInitials(employee = {}) {
  const { firstName, lastName } = getNameParts(employee);

  if (firstName || lastName) {
    return `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase();
  }

  const tokens = getEmployeeName(employee)
    .replace(",", " ")
    .split(/\s+/)
    .filter(Boolean);

  return `${tokens[0]?.[0] || "E"}${tokens[1]?.[0] || ""}`.toUpperCase();
}

function getAvatarTone(employee = {}) {
  const seed = getEmployeeName(employee)
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return AVATAR_TONES[seed % AVATAR_TONES.length];
}

function getEmployeeProfilePictureUrl(employee = {}) {
  return getCleanValue(
    employee.profilePictureUrl,
    employee.profile_picture_url,
  );
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
            className="employee-avatar-preview pointer-events-none fixed z-[9999] rounded-2xl border border-[#D9E6F2] bg-white p-2 shadow-[0_18px_45px_rgba(4,44,81,0.22)]"
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

function getApprovalResultFailed(result) {
  if (result === false) return true;

  if (result && typeof result === "object") {
    return result?.success === false || result?.ok === false;
  }

  return false;
}

function InlineDateRangeFilter({ visible }) {
  if (!visible) return null;

  return (
    <div className="leaves-date-filter-inline w-full sm:w-auto">
      <PaginationDateRangeFilter entity="leaves" visible className="m-0 w-full" />
    </div>
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
  const [isClosing, setIsClosing] = useState(false);
  const [decisionAction, setDecisionAction] = useState("");
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const normalizedStatus = normalizeStatus(item?.gy_leave_status);
  const isPending = normalizedStatus === "Pending";
  const approver = getApproverDisplay(item);
  const busy = Boolean(approvalLoading || decisionAction);

  const handleAnimatedClose = useCallback(() => {
    if (isClosing || busy) return;

    setIsClosing(true);

    window.setTimeout(() => {
      setIsClosing(false);
      onClose?.();
    }, 220);
  }, [busy, isClosing, onClose]);

  useEffect(() => {
    if (!open) return undefined;

    setDecisionAction("");

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape" && !busy) {
        handleAnimatedClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [busy, handleAnimatedClose, open]);

  if (!open || !item || !portalTarget) return null;

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

    const callback =
      action === "approve" ? onApproveLeave : onRejectLeave;

    try {
      setDecisionAction(action);

      const result = await callback(item);

      if (getApprovalResultFailed(result)) {
        return;
      }

      setIsClosing(true);

      window.setTimeout(() => {
        setIsClosing(false);
        setDecisionAction("");
        onClose?.();
      }, 220);
    } catch (error) {
      console.error(
        `Unable to ${action} leave request:`,
        error,
      );
    } finally {
      setDecisionAction("");
    }
  }

  return createPortal(
    <div
      className={`sibs-modal-blur fixed inset-0 z-[999999] flex h-dvh items-center justify-center p-2 font-jakarta sm:p-4 ${
        isClosing ? "sibs-modal-backdrop-out" : "sibs-modal-backdrop-in"
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleAnimatedClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-details-title"
        className={`flex max-h-[84vh] 2xl:max-h-[86vh] w-full max-w-[700px] 2xl:max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#9FB3C8] bg-white font-jakarta shadow-[0_30px_90px_rgba(2,26,48,0.42)] ${
          isClosing ? "sibs-modal-pop-out" : "sibs-modal-pop-in"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 bg-[#042C51] px-4 py-2.5 2xl:px-5 2xl:py-3.5 text-white">
          <div className="flex min-w-0 items-center gap-2 2xl:gap-2.5">
            <CalendarDays
              size={16}
              className="shrink-0 text-[#FF5C28]"
            />

            <h2
              id="leave-details-title"
              className="truncate text-xs 2xl:text-sm font-extrabold uppercase tracking-wide"
            >
              Leave Request &amp; Ledger Audit
            </h2>
          </div>

          <button
            type="button"
            onClick={handleAnimatedClose}
            disabled={busy}
            className="inline-flex h-7.5 w-7.5 2xl:h-8 2xl:w-8 shrink-0 items-center justify-center rounded-lg text-blue-100 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close leave details"
          >
            <X size={16} />
          </button>
        </header>

        <div className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-white p-3.5 2xl:p-5 text-[#101828]">
          <div className="space-y-3.5 2xl:space-y-4">
            <section className="flex flex-col gap-3 rounded-xl border border-[#DCE6F1] bg-[#F8FAFC] p-3 2xl:p-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
                <div className="flex h-9 w-9 2xl:h-10 2xl:w-10 shrink-0 items-center justify-center rounded-full bg-[#042C51] sibs-text-micro font-extrabold text-white">
                  {getInitials(item)}
                </div>

                <div className="min-w-0">
                  <h3 className="break-words text-xs 2xl:text-sm font-extrabold text-[#042C51]">
                    {item.gy_full_name ||
                      item.gy_username ||
                      "Unknown User"}
                  </h3>

                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="sibs-text-micro font-extrabold uppercase tracking-wide text-[#8A98B8]">
                      User Code (SiBS ID):
                    </span>

                    <span className="rounded bg-[#E6ECF2] px-1.5 py-0.5 font-mono sibs-text-micro font-extrabold text-[#042C51]">
                      {item.gy_user_code || "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                <div className="text-right">
                  <p className="sibs-text-micro font-extrabold uppercase tracking-wide text-[#8A98B8]">
                    Remaining Balance
                  </p>

                  <p className="mt-0.5 text-base 2xl:text-lg font-extrabold tabular-nums text-[#FF5C28]">
                    {formatNumber(item.leave_remaining)} Days
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="inline-flex justify-center rounded border border-blue-200 bg-blue-50 px-2 py-0.5 sibs-text-micro font-extrabold uppercase text-blue-700">
                    {leaveType}
                  </span>

                  <span
                    className={`inline-flex justify-center rounded border px-2 py-0.5 sibs-text-micro font-extrabold uppercase ${getStatusClass(
                      normalizedStatus,
                    )}`}
                  >
                    {normalizedStatus}
                  </span>
                </div>
              </div>
            </section>

            <section>
              <SectionHeading>
                Leave Request Information
              </SectionHeading>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
                <CompactField
                  label="Leave ID"
                  value={item.gy_leave_id}
                  mono
                />

                <CompactField
                  label="Filed Date"
                  value={formatDateTime(item.gy_leave_filed)}
                />

                <CompactField label="Paid Status">
                  <p className="mt-0.5 flex items-center gap-1.5 sibs-text-xs font-extrabold text-[#042C51]">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        getPaidLeaveLabel(item.gy_leave_paid) ===
                        "Paid Leave"
                          ? "bg-emerald-500"
                          : "bg-slate-400"
                      }`}
                    />

                    {getPaidLeaveLabel(item.gy_leave_paid)}
                  </p>
                </CompactField>

                <CompactField
                  label="Total Days"
                  value={`${formatNumber(item.gy_leave_day)} ${
                    Number(item.gy_leave_day) === 1 ? "Day" : "Days"
                  }`}
                />

                <CompactField
                  label="Date From"
                  value={formatDate(item.gy_leave_date_from)}
                />

                <CompactField
                  label="Date To"
                  value={formatDate(item.gy_leave_date_to)}
                />
              </div>

              <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <CompactField label="Reason">
                  <div className="mt-1 min-h-[38px] rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-1.5 sibs-text-xs font-semibold leading-relaxed text-[#52637A]">
                    {item.gy_leave_reason ||
                      "No specification provided."}
                  </div>
                </CompactField>

                <CompactField label="Supervisor Remarks">
                  <div className="mt-1 min-h-[38px] rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-1.5 sibs-text-xs font-semibold leading-relaxed text-[#52637A]">
                    {item.gy_leave_remarks ||
                      "No comments filed."}
                  </div>
                </CompactField>
              </div>
            </section>

            <section>
              <SectionHeading>Leave Balance Ledger</SectionHeading>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <LedgerMetric
                  label="Approved Credits"
                  value={formatNumber(item.leave_credit)}
                />

                <LedgerMetric
                  label="Plotted Leaves"
                  value={formatNumber(item.leave_plotted)}
                />

                <LedgerMetric
                  label="Remaining Leaves"
                  value={formatNumber(item.leave_remaining)}
                  accent
                />

                <LedgerMetric
                  label="Validity Window"
                  value={validityWindow}
                  className="col-span-2"
                />
              </div>

              <div className="mt-2.5">
                <CompactField label="Balance Justification">
                  <div className="mt-1 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-1.5 sibs-text-xs font-medium italic leading-relaxed text-[#667085]">
                    “
                    {item.gy_leave_avail_justify ||
                      "No balance justification recorded."}
                    ”
                  </div>
                </CompactField>
              </div>
            </section>

            <section>
              <SectionHeading>
                Approval Context &amp; Security
              </SectionHeading>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="space-y-2">
                  <CompactField
                    label="Approver Name"
                    value={approver.name}
                  />

                  <CompactField
                    label="Approver SiBS ID"
                    value={approver.sibsId}
                    mono
                  />

                  <CompactField
                    label="Date Approved / Processed"
                    value={formatDateTime(
                      item.gy_leave_date_approved,
                    )}
                  />
                </div>

                <CompactField label="Attachment File">
                  {attachmentName ? (
                    <div className="mt-1 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/50 px-2.5 py-2 sibs-text-micro font-extrabold text-blue-700">
                      <Paperclip size={13} className="shrink-0" />

                      <span className="min-w-0 flex-1 truncate">
                        {attachmentName}
                      </span>

                      <span className="shrink-0 text-[9px] text-blue-500">
                        Download
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-2 sibs-text-xs font-semibold text-[#8A98B8]">
                      No attachments provided.
                    </div>
                  )}
                </CompactField>
              </div>
            </section>

            {isPending ? (
              <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <AlertCircle
                      size={17}
                      className="mt-0.5 shrink-0 text-amber-500"
                    />

                    <div className="min-w-0">
                      <h3 className="sibs-text-micro font-extrabold uppercase tracking-wide text-[#042C51]">
                        Pending Approval Action
                      </h3>

                      <p className="mt-0.5 sibs-text-micro font-semibold leading-tight text-[#667085]">
                        {canRunApproval
                          ? "Sign off or reject this request with your configured administrative access."
                          : "This request is pending approval from an authorized leave approver."}
                      </p>
                    </div>
                  </div>

                  {canRunApproval ? (
                    <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleDecision("approve")}
                        disabled={busy}
                        className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 sibs-text-micro font-extrabold uppercase tracking-wide text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {decisionAction === "approve" ? (
                          <Loader2
                            size={13}
                            className="animate-spin"
                          />
                        ) : (
                          <Check size={13} />
                        )}
                        Approve Request
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDecision("reject")}
                        disabled={busy}
                        className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3.5 sibs-text-micro font-extrabold uppercase tracking-wide text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {decisionAction === "reject" ? (
                          <Loader2
                            size={13}
                            className="animate-spin"
                          />
                        ) : (
                          <XCircle size={13} />
                        )}
                        Reject Request
                      </button>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>
        </div>

        <footer className="flex shrink-0 justify-end border-t border-[#E6ECF2] bg-[#F8FAFC] px-4 py-2.5 2xl:py-3 sm:px-6">
          <button
            type="button"
            onClick={handleAnimatedClose}
            disabled={busy}
            className="inline-flex h-8 2xl:h-8.5 items-center justify-center rounded-lg bg-[#042C51] px-4 sibs-text-micro font-extrabold uppercase tracking-wider text-white transition hover:bg-[#021F3A] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Close Panel
          </button>
        </footer>
      </section>
    </div>,
    portalTarget,
  );
}

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
    setSearchInput("");
    setSearchKeyword("");

    return () => {
      clearPersistedLeavesSearch();
      setSearchInput("");
      setSearchKeyword("");
    };
    // Run only when the Leaves table enters/leaves the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dateFrom = filterValues?.dateFrom || "";
  const dateTo = filterValues?.dateTo || "";

  function runSearch() {
    const cleanSearch = String(searchInput || "").trim();
    const currentSearch = String(searchKeyword || "").trim();

    setPage(1);
    setSearchSubmitVersion((prev) => prev + 1);

    if (cleanSearch === currentSearch) {
      setSearchKeyword("");

      window.setTimeout(() => {
        setPage(1);
        setSearchKeyword(cleanSearch);
      }, 0);

      return;
    }

    setSearchKeyword(cleanSearch);
  }

  function handleSearchKeyDown(e) {
    if (e.key !== "Enter") return;

    e.preventDefault();
    runSearch();
  }

  function handlePreviousPage() {
    const currentPaginationPage = Number(pagination.currentPage || page || 1);

    if (loading || currentPaginationPage <= 1) return;

    setPage(Math.max(currentPaginationPage - 1, 1));
  }

  function handleNextPage() {
    const currentPaginationPage = Number(pagination.currentPage || page || 1);

    if (loading || !pagination.hasNextPage) return;

    setPage(currentPaginationPage + 1);
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
  ]);

  const currentPaginationPage = Number(pagination.currentPage || page || 1);
  const totalPages = pagination.hasNextPage
    ? currentPaginationPage + 1
    : currentPaginationPage;

  return (
    <>
      <style>{`
        @keyframes sibsLeavesRowReveal {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .sibs-leaves-row-reveal {
          animation: sibsLeavesRowReveal 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
          will-change: opacity, transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .sibs-leaves-row-reveal {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      <section
        className="sibs-profile-tab-panel sibs-page-card-in sibs-card flex min-h-full flex-1 flex-col justify-between min-w-0 overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-xs"
        style={{ animationDelay: "240ms", animationFillMode: "both" }}
      >
        <div className="border-b border-[#E6ECF2] p-4 sm:p-5 2xl:p-6">
          <h3 className="text-xs 2xl:text-sm font-extrabold uppercase tracking-wide text-[#042C51]">
            {isPersonalView ? "My Leave Records" : "Leave Records"}
          </h3>
          <p className="mt-1 text-xs font-semibold text-[#667085]">
            {isPersonalView
              ? "Review your filed leaves, approval statuses, justifications, and attachment context."
              : "Review employee leave requests, approval statuses, justifications, and attachment records."}
          </p>

          <PaginationTable
            filterLayout="ta-inline"
            showFilterPanel={false}
            showFilterHeader={false}
            showPagination={false}
            loading={loading}
            searchValue={searchInput}
            searchPlaceholder="Search by employee, SiBS ID, leave type, or status..."
            onSearchChange={(value) => setSearchInput(value)}
            onSearchKeyDown={handleSearchKeyDown}
            dropdownFilters={[]}
            filters={[
              {
                key: "status",
                value: statusFilter,
                onChange: onStatusChange,
                options: [
                  { label: "All Statuses", value: "All" },
                  { label: "Approved", value: "Approved" },
                  { label: "Pending", value: "Pending" },
                  { label: "Rejected", value: "Rejected" },
                ],
                label: "Status",
                searchable: false,
                includeAll: false,
              },
              ...(showDepartmentFilter
                ? [
                    {
                      key: "department",
                      value: departmentFilter,
                      onChange: onDepartmentSelect,
                      options: departmentDropdownOptions,
                      allLabel: "All Departments",
                      label: "Department",
                      placeholder: "Search departments...",
                      searchable: true,
                      includeAll: true,
                    },
                  ]
                : []),
              ...(showAccountFilter
                ? [
                    {
                      key: "account",
                      value: accountFilter,
                      onChange: onAccountSelect,
                      options: accountDropdownOptions,
                      allLabel: "All Accounts",
                      label: "Account",
                      placeholder: "Search accounts...",
                      searchable: true,
                      includeAll: true,
                    },
                  ]
                : []),
            ]}
            rightContent={<InlineDateRangeFilter visible />}
            className="mt-4 border-0 bg-transparent p-0 shadow-none"
          />
        </div>

        <div className="p-4 sm:p-5 2xl:p-6">
          <div className="mt-3 block sm:hidden">
            <button
              type="button"
              onClick={runSearch}
              disabled={loading}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-[#FF5C28] px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E64B1B] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search size={16} />
              Search Leave Records
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
            <div
              ref={tableScrollRef}
              className="max-h-[480px] 2xl:max-h-[640px] overflow-auto sibs-scrollbar"
            >
              <table className="w-full min-w-[1420px] border-collapse bg-white">
                <thead className="sibs-data-table-head sticky top-0 z-10 bg-[#F8FAFC]">
                  <tr className="sibs-data-table-head-row">
                    <th className="sibs-data-table-th whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-left">
                      SIBS ID
                    </th>
                    <th className="sibs-data-table-th whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-left">
                      Employee
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
                  className="divide-y divide-[#F1F5F9]"
                >
                  {loading ? (
                    Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                      <tr key={index}>
                        <td colSpan={12} className="px-3 2xl:px-4 py-2 2xl:py-2.5">
                          <div className="h-5 w-full animate-sibs-pulse rounded bg-[#E6ECF2]" />
                        </td>
                      </tr>
                    ))
                  ) : leaves.length > 0 ? (
                    leaves.map((item, index) => (
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
                        className="sibs-data-table-row sibs-page-card-in"
                        style={{
                          animationDelay: `${index * 35}ms`,
                          animationFillMode: "both",
                        }}
                      >
                        <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-xs">
                          <span className="font-extrabold text-[#FF5C28]">
                            {item.gy_user_code || "—"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-xs">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="shrink-0"
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
                            >
                              <EmployeeAvatar employee={item} />
                            </div>

                            <p className="m-0 max-w-[240px] truncate font-extrabold text-[#042C51]">
                              {item.gy_full_name || item.gy_username || "—"}
                            </p>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-xs font-bold text-[#344054]">
                          <span className="inline-flex max-w-[190px] truncate rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#164E7A]">
                            {item.gy_emp_account || "—"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-xs font-bold text-[#344054]">
                          {item.leaveTypeLabel ||
                            getLeaveTypeLabel(
                              item.gy_leave_type,
                              item.leave_type_label,
                            )}
                        </td>

                        <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-center text-xs font-semibold text-[#52637A]">
                          {formatDate(item.gy_leave_filed)}
                        </td>
                        <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-center text-xs font-semibold text-[#52637A]">
                          {formatDate(item.gy_leave_date_from)}
                        </td>
                        <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-center text-xs font-semibold text-[#52637A]">
                          {formatDate(item.gy_leave_date_to)}
                        </td>
                        <td className="whitespace-nowrap bg-[#F8FAFC]/60 px-3 2xl:px-4 py-2 2xl:py-2.5 text-center text-xs font-extrabold tabular-nums text-[#042C51]">
                          {formatNumber(item.gy_leave_day)}
                        </td>
                        <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-center text-xs font-extrabold tabular-nums text-[#344054]">
                          {formatNumber(item.leave_credit)}
                        </td>
                        <td className="whitespace-nowrap bg-amber-50/30 px-3 2xl:px-4 py-2 2xl:py-2.5 text-center text-xs font-extrabold tabular-nums text-amber-600">
                          {formatNumber(item.leave_plotted)}
                        </td>
                        <td className="whitespace-nowrap bg-emerald-50/30 px-3 2xl:px-4 py-2 2xl:py-2.5 text-center text-xs font-extrabold tabular-nums text-emerald-600">
                          {formatNumber(item.leave_remaining)}
                        </td>
                        <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-center text-xs">
                          <Badge className={getStatusClass(item.gy_leave_status)}>
                            {item.normalizedStatus ||
                              normalizeStatus(item.gy_leave_status)}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={12} className="p-12 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-[#667085]">
                          <CalendarDays size={34} className="text-[#C8D3DF]" />
                          <p className="text-sm font-extrabold text-[#042C51]">
                            No leave records found
                          </p>
                          <p className="text-xs font-semibold">
                            Adjust the search, status, department, account, or date range filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 2xl:mt-5">
            <PaginationTable
              loading={loading}
              showSearch={false}
              showPagination
              currentPage={currentPaginationPage}
              totalPages={totalPages}
              loadedCount={leaves.length}
              totalRecords={0}
              recordLabel="leave records"
              onPrevious={handlePreviousPage}
              onNext={handleNextPage}
              showCount
              className="border-0 bg-transparent p-0 shadow-none"
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
