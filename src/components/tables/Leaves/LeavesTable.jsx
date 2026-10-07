import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronDown,
  Loader2,
  Paperclip,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";

import { PaginationDateRangeFilter } from "@/services/context/PaginationContext";
import {
  DataCard,
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

function SectionHeading({ children }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h3 className="sibs-modal-section-title shrink-0 text-sibs-navy">
        {children}
      </h3>

      <span className="h-px flex-1 bg-slate-200" />
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
      <p className="text-[9px] font-extrabold uppercase leading-4 tracking-wide text-sibs-muted">
        {label}
      </p>

      {children || (
        <p
          className={`mt-0.5 break-words text-xs font-extrabold leading-5 ${
            accent ? "text-sibs-orange" : "text-sibs-navy"
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
      className={`rounded-xl border border-sibs-border bg-sibs-surface px-3 py-2.5 text-center ${className}`}
    >
      <p className="text-[8px] font-extrabold uppercase tracking-wide text-sibs-muted">
        {label}
      </p>

      <p
        className={`mt-1 break-words text-sm font-extrabold tabular-nums ${
          accent ? "text-sibs-orange" : "text-slate-600"
        }`}
      >
        {value || "—"}
      </p>
    </div>
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

function LeavesDirectoryFilterDropdown({
  label,
  value,
  options = [],
  onChange,
  placeholder = "All",
  searchPlaceholder = "Search...",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const anchorRef = useRef(null);
  const inputRef = useRef(null);

  const normalizedOptions = useMemo(
    () =>
      (Array.isArray(options) ? options : [])
        .map((option) => ({
          value: String(option?.value ?? option ?? ""),
          label: String(option?.label ?? option?.value ?? option ?? ""),
        }))
        .filter((option) => option.value && option.label),
    [options],
  );

  const allOption = normalizedOptions.find(
    (option) => option.value === "All",
  );

  const regularOptions = normalizedOptions.filter(
    (option) => option.value !== "All",
  );

  const selectedLabel = useMemo(
    () =>
      normalizedOptions.find(
        (option) => option.value === String(value ?? ""),
      )?.label ||
      (value && value !== "All"
        ? String(value)
        : allOption?.label || placeholder),
    [allOption?.label, normalizedOptions, placeholder, value],
  );

  const filteredOptions = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    if (!keyword) return regularOptions;

    return regularOptions.filter((option) =>
      option.label.toLowerCase().includes(keyword),
    );
  }, [regularOptions, searchQuery]);

  function openMenu() {
    if (disabled) return;

    setOpen(true);
    setSearchQuery("");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function closeMenu() {
    setOpen(false);
    setSearchQuery("");
  }

  function toggleMenu() {
    if (disabled) return;

    if (open) {
      closeMenu();
      return;
    }

    openMenu();
  }

  function selectValue(nextValue) {
    onChange?.(nextValue);
    closeMenu();
  }

  const allSelected = !value || value === "All";

  return (
    <div ref={anchorRef} className="relative w-full min-w-0 font-jakarta">
      <label className="mb-1 block sibs-text-xs font-bold text-sibs-navy">
        {label}
      </label>

      <div className="group relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={label}
          disabled={disabled}
          value={open ? searchQuery : selectedLabel}
          placeholder={open ? searchPlaceholder : placeholder}
          autoComplete="off"
          onFocus={openMenu}
          onClick={openMenu}
          onChange={(event) => {
            if (!open) setOpen(true);
            setSearchQuery(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closeMenu();
              inputRef.current?.blur();
            }
          }}
          className={`h-8.5 sm:h-9 2xl:h-10 w-full rounded-[10px] border bg-[#F8FAFC] px-3 pr-10 font-jakarta sibs-text-xs font-bold text-[#042C51] shadow-sm outline-none transition placeholder:text-[#98A2B3] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 ${
            open
              ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10"
              : "border-[#E6ECF2] hover:border-[#FF5C28]/40"
          }`}
          style={{ outline: "none", boxShadow: open ? undefined : "none" }}
        />

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label={`Toggle ${label} dropdown`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={toggleMenu}
          className="absolute right-2 top-1/2 flex h-6.5 w-6.5 2xl:h-7 2xl:w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#667085] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 transition-transform duration-300 ${
              open ? "rotate-180 text-[#FF5C28]" : ""
            }`}
          />
        </button>
      </div>

      <DropdownPortal
        open={open && !disabled}
        anchorRef={anchorRef}
        onClose={closeMenu}
        maxHeight={320}
        offset={6}
        className="!rounded-[10px] !border-[#D7DEE8]"
      >
        <div className="sibs-scrollbar max-h-[320px] overflow-y-auto py-1">
          {allOption ? (
            <button
              type="button"
              role="option"
              aria-selected={allSelected}
              onClick={() => selectValue("All")}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left sibs-text-xs transition ${
                allSelected
                  ? "bg-[#FFF0EB] font-extrabold text-[#FF5C28]"
                  : "font-semibold text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
              }`}
            >
              <span className="truncate">{allOption.label}</span>
              {allSelected ? (
                <Check size={14} className="shrink-0 text-[#FF5C28]" />
              ) : null}
            </button>
          ) : null}

          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const selected = String(value ?? "") === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectValue(option.value)}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-left sibs-text-xs transition ${
                    selected
                      ? "bg-[#FFF0EB] font-extrabold text-[#FF5C28]"
                      : "font-semibold text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                  }`}
                >
                  <span className="block min-w-0 flex-1 truncate">
                    {option.label}
                  </span>

                  {selected ? (
                    <Check size={14} className="shrink-0 text-[#FF5C28]" />
                  ) : null}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-4 text-center sibs-text-xs font-semibold text-[#667085]">
              No options found.
            </div>
          )}
        </div>
      </DropdownPortal>
    </div>
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
      onClose={onClose}
      title="Leave Request & Ledger Audit"
      subtitle="Detailed ledger breakdown, leave balances, and approval sign-off"
      icon={CalendarDays}
      maxWidth="max-w-3xl"
      footer={
        <div className="flex w-full items-center justify-between gap-3 font-jakarta">
          <span className="sibs-text-micro font-semibold text-sibs-muted">
            {item.gy_user_code ? `SiBS ID: ${item.gy_user_code}` : ""}
          </span>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="sibs-btn-secondary"
          >
            Close Panel
          </button>
        </div>
      }
    >
      <div className="space-y-3.5 2xl:space-y-4">
        <section className="flex flex-col gap-3 rounded-xl border border-sibs-border bg-sibs-surface p-3 2xl:p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
            <div className="flex h-9 w-9 2xl:h-10 2xl:w-10 shrink-0 items-center justify-center rounded-full bg-sibs-navy sibs-text-micro font-extrabold text-white">
              {getInitials(item)}
            </div>

            <div className="min-w-0">
              <h3 className="sibs-modal-section-title break-words text-sibs-navy">
                {item.gy_full_name || item.gy_username || "Unknown User"}
              </h3>

              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span className="sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-muted">
                  User Code (SiBS ID):
                </span>

                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono sibs-text-micro font-extrabold text-sibs-navy">
                  {item.gy_user_code || "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
            <div className="text-right">
              <p className="sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-muted">
                Remaining Balance
              </p>

              <p className="mt-0.5 text-base 2xl:text-lg font-extrabold tabular-nums text-sibs-orange">
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
          <SectionHeading>Leave Request Information</SectionHeading>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
            <CompactField
              label="Leave ID"
              value={item.gy_leave_id}
            />

            <CompactField
              label="Filed Date"
              value={formatDateTime(item.gy_leave_filed)}
            />

            <CompactField label="Paid Status">
              <p className="mt-0.5 flex items-center gap-1.5 sibs-text-xs font-extrabold text-sibs-navy">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    getPaidLeaveLabel(item.gy_leave_paid) === "Paid Leave"
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
              <div className="mt-1 min-h-[38px] rounded-lg border border-sibs-border bg-sibs-surface px-2.5 py-1.5 sibs-text-xs font-semibold leading-relaxed text-slate-600">
                {item.gy_leave_reason || "No specification provided."}
              </div>
            </CompactField>

            <CompactField label="Supervisor Remarks">
              <div className="mt-1 min-h-[38px] rounded-lg border border-sibs-border bg-sibs-surface px-2.5 py-1.5 sibs-text-xs font-semibold leading-relaxed text-slate-600">
                {item.gy_leave_remarks || "No comments filed."}
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
              <div className="mt-1 rounded-lg border border-sibs-border bg-sibs-surface px-2.5 py-1.5 sibs-text-xs font-medium italic leading-relaxed text-sibs-muted">
                “
                {item.gy_leave_avail_justify ||
                  "No balance justification recorded."}
                ”
              </div>
            </CompactField>
          </div>
        </section>

        <section>
          <SectionHeading>Approval Context &amp; Security</SectionHeading>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="space-y-2">
              <CompactField
                label="Approver Name"
                value={approver.name}
              />

              <CompactField
                label="Approver SiBS ID"
                value={approver.sibsId}
              />

              <CompactField
                label="Date Approved / Processed"
                value={formatDateTime(item.gy_leave_date_approved)}
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
                <div className="mt-1 rounded-lg border border-sibs-border bg-sibs-surface px-2.5 py-2 sibs-text-xs font-semibold text-sibs-muted">
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
                  <h3 className="sibs-modal-section-title text-sibs-navy">
                    Pending Approval Action
                  </h3>

                  <p className="sibs-modal-section-subtitle mt-0.5 leading-tight text-sibs-muted">
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
                    className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 font-jakarta sibs-text-xs font-extrabold uppercase tracking-wide text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {decisionAction === "approve" ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Check size={13} />
                    )}
                    Approve Request
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDecision("reject")}
                    disabled={busy}
                    className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3.5 font-jakarta sibs-text-xs font-extrabold uppercase tracking-wide text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {decisionAction === "reject" ? (
                      <Loader2 size={13} className="animate-spin" />
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
    </ModalShell>
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

  const hasActiveFilters = Boolean(
    String(searchInput || "").trim() ||
    (statusFilter && statusFilter !== "All") ||
    (departmentFilter && departmentFilter !== "All") ||
    (accountFilter && accountFilter !== "All") ||
    dateFrom ||
    dateTo
  );

  function handleClearLeavesFilters() {
    setSearchInput?.("");
    if (typeof setSearchKeyword === "function") setSearchKeyword("");
    if (typeof onStatusChange === "function") onStatusChange("All");
    if (typeof onDepartmentSelect === "function") onDepartmentSelect("All");
    if (typeof onAccountSelect === "function") onAccountSelect("All");
    setPage?.(1);
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
        className="sibs-profile-tab-panel sibs-page-card-in sibs-card flex min-h-full flex-1 flex-col justify-between min-w-0 overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-xs"
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

          <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-end">
            <div className="min-w-0 flex-1 xl:flex-[1_1_220px] 2xl:flex-[1_1_360px]">
              <SearchInput
                label="Search"
                value={searchInput}
                onChange={(e) => setSearchInput(typeof e === "string" ? e : e?.target?.value ?? "")}
                onClear={() => {
                  setSearchInput("");
                  if (typeof setSearchKeyword === "function") setSearchKeyword("");
                  setPage(1);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search by employee, SiBS ID, leave type, or status..."
                ariaLabel="Search leave records"
                disabled={loading}
                className="w-full"
              />
            </div>

            <div className="w-full sm:w-44 xl:w-[150px] 2xl:w-[170px] xl:flex-none">
              <SelectDropdown
                label="Status"
                value={statusFilter || "All"}
                onChange={onStatusChange}
                options={[
                  { label: "All Statuses", value: "All" },
                  { label: "Approved", value: "Approved" },
                  { label: "Pending", value: "Pending" },
                  { label: "Rejected", value: "Rejected" },
                ]}
                placeholder="All Statuses"
                clearable={false}
                disabled={loading}
              />
            </div>

            {showDepartmentFilter ? (
              <div className="w-full sm:w-48 xl:w-[170px] 2xl:w-[200px] xl:flex-none">
                <LeavesDirectoryFilterDropdown
                  label="Department"
                  value={departmentFilter || "All"}
                  onChange={onDepartmentSelect}
                  options={[
                    { label: "All Departments", value: "All" },
                    ...departmentDropdownOptions,
                  ]}
                  placeholder="All Departments"
                  searchPlaceholder="Search departments..."
                  disabled={loading}
                />
              </div>
            ) : null}

            {showAccountFilter ? (
              <div className="w-full sm:w-48 xl:w-[170px] 2xl:w-[200px] xl:flex-none">
                <LeavesDirectoryFilterDropdown
                  label="Account"
                  value={accountFilter || "All"}
                  onChange={onAccountSelect}
                  options={[
                    { label: "All Accounts", value: "All" },
                    ...accountDropdownOptions,
                  ]}
                  placeholder="All Accounts"
                  searchPlaceholder="Search accounts..."
                  disabled={loading}
                />
              </div>
            ) : null}

            <div className="w-full xl:w-auto xl:flex-none">
              <InlineDateRangeFilter visible />
            </div>

            {hasActiveFilters && (
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={handleClearLeavesFilters}
                  disabled={loading}
                  className="inline-flex h-8.5 2xl:h-10 w-full xl:w-auto items-center justify-center gap-1.5 rounded-lg border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw size={14} />
                  Clear
                </button>
              </div>
            )}
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
                            className="sibs-data-table-row sibs-page-card-in hover:bg-sibs-cream-subtle transition-colors cursor-pointer"
                            style={{
                              animationDelay: `${index * 35}ms`,
                              animationFillMode: "both",
                            }}
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
