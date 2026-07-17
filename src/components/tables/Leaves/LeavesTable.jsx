import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, Search, X } from "lucide-react";

import PaginationTable from "@/services/pagination/PaginationTable";
import { PaginationDateRangeFilter } from "@/services/context/PaginationContext";

const PAGE_LIMIT = 15;

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

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f3f4f6] py-3 last:border-b-0">
      <p className="m-0 text-[11px] font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
        {label}
      </p>

      <strong className="max-w-[60%] break-words text-right text-sm font-bold text-[#344054] max-sm:max-w-full max-sm:text-left">
        {value || "—"}
      </strong>
    </div>
  );
}

function ApproverRow({ item }) {
  const approver = getApproverDisplay(item);

  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f3f4f6] py-3 last:border-b-0">
      <p className="m-0 text-[11px] font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
        Approver
      </p>

      <div className="max-w-[60%] text-right max-sm:max-w-full max-sm:text-left">
        <p className="m-0 text-sm font-extrabold text-[#344054]">
          SiBS ID: {approver.sibsId}
        </p>

        <p className="mt-1 text-sm font-bold leading-snug text-[#344054]">
          {approver.name}
        </p>
      </div>
    </div>
  );
}

function InlineDateRangeFilter({ visible }) {
  if (!visible) return null;

  return (
    <div className="leaves-date-filter-inline w-full lg:w-auto">
      <style>
        {`
          .leaves-date-filter-inline {
            width: 100%;
          }

          .leaves-date-filter-inline > div {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            align-items: center !important;
            gap: 12px !important;
            width: 100% !important;
          }

          .leaves-date-filter-inline > div > button,
          .leaves-date-filter-inline > div > div > button,
          .leaves-date-filter-inline > div > div > div > button,
          .leaves-date-filter-inline button[aria-haspopup="dialog"],
          .leaves-date-filter-inline button[data-state] {
            height: 44px !important;
            min-height: 44px !important;
            width: 100% !important;
            min-width: 0 !important;
            border-radius: 10px !important;
            border: 1px solid #D0D5DD !important;
            background: #FFFFFF !important;
            padding: 0 16px !important;
            color: #0D4676 !important;
            font-size: 14px !important;
            font-weight: 700 !important;
            box-shadow: none !important;
            outline: none !important;
            transition:
              border-color 180ms ease,
              background-color 180ms ease,
              box-shadow 180ms ease,
              transform 180ms ease !important;
          }

          .leaves-date-filter-inline > div > button:hover,
          .leaves-date-filter-inline > div > div > button:hover,
          .leaves-date-filter-inline > div > div > div > button:hover,
          .leaves-date-filter-inline button[aria-haspopup="dialog"]:hover,
          .leaves-date-filter-inline button[data-state]:hover {
            border-color: rgba(13, 70, 118, 0.3) !important;
            background: #F8FAFC !important;
          }

          .leaves-date-filter-inline > div > button:focus,
          .leaves-date-filter-inline > div > div > button:focus,
          .leaves-date-filter-inline > div > div > div > button:focus,
          .leaves-date-filter-inline button[aria-haspopup="dialog"]:focus,
          .leaves-date-filter-inline button[data-state="open"] {
            border-color: #0D4676 !important;
            box-shadow: 0 0 0 4px rgba(13, 70, 118, 0.10) !important;
          }

          .leaves-date-filter-inline > div > button:active,
          .leaves-date-filter-inline > div > div > button:active,
          .leaves-date-filter-inline > div > div > div > button:active,
          .leaves-date-filter-inline button[aria-haspopup="dialog"]:active {
            transform: scale(0.98) !important;
          }

          .leaves-date-filter-inline > div > button svg,
          .leaves-date-filter-inline > div > div > button svg,
          .leaves-date-filter-inline > div > div > div > button svg,
          .leaves-date-filter-inline button[aria-haspopup="dialog"] svg {
            color: #0D4676 !important;
          }

          .leaves-date-filter-inline > div > div,
          .leaves-date-filter-inline > div > div > div {
            width: 100% !important;
            min-width: 0 !important;
          }

          @media (max-width: 639px) {
            .leaves-date-filter-inline > div {
              grid-template-columns: minmax(0, 1fr) !important;
            }
          }

          .leaves-date-filter-inline [data-radix-popper-content-wrapper] {
            z-index: 999999 !important;
          }

          .leaves-date-filter-inline .rdp,
          .leaves-date-filter-inline [data-slot="calendar"],
          .leaves-date-filter-inline [role="dialog"] {
            border-radius: 16px !important;
            border: 1px solid #D9E2EC !important;
            background: #FFFFFF !important;
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14) !important;
            overflow: hidden !important;
          }

          .leaves-date-filter-inline .rdp-month_caption,
          .leaves-date-filter-inline .rdp-caption_label,
          .leaves-date-filter-inline [class*="caption_label"] {
            color: #0D4676 !important;
            font-size: 14px !important;
            font-weight: 800 !important;
          }

          .leaves-date-filter-inline .rdp-weekday {
            color: #174A7C !important;
            font-size: 12px !important;
            font-weight: 800 !important;
          }

          .leaves-date-filter-inline .rdp-day_button,
          .leaves-date-filter-inline [role="gridcell"] button {
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            border: 0 !important;
            border-radius: 9999px !important;
            background: transparent !important;
            color: #0D4676 !important;
            font-size: 14px !important;
            font-weight: 800 !important;
            box-shadow: none !important;
            padding: 0 !important;
            outline: none !important;
          }

          .leaves-date-filter-inline .rdp-day_button:hover,
          .leaves-date-filter-inline [role="gridcell"] button:hover {
            background: #EAF2FB !important;
            color: #0D4676 !important;
          }

          .leaves-date-filter-inline .rdp-selected .rdp-day_button,
          .leaves-date-filter-inline [aria-selected="true"] button,
          .leaves-date-filter-inline [data-selected="true"] button {
            background: #E7F0FA !important;
            color: #0D4676 !important;
          }

          .leaves-date-filter-inline .rdp-outside .rdp-day_button,
          .leaves-date-filter-inline [data-outside="true"] button {
            color: #98A7BA !important;
            background: transparent !important;
          }

          .leaves-date-filter-inline .rdp-nav button,
          .leaves-date-filter-inline button.rdp-button_previous,
          .leaves-date-filter-inline button.rdp-button_next,
          .leaves-date-filter-inline .rdp-button_previous,
          .leaves-date-filter-inline .rdp-button_next {
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            border: 0 !important;
            border-radius: 9999px !important;
            background: transparent !important;
            padding: 0 !important;
            box-shadow: none !important;
            color: #0D4676 !important;
          }

          .leaves-date-filter-inline .rdp-nav button:hover,
          .leaves-date-filter-inline button.rdp-button_previous:hover,
          .leaves-date-filter-inline button.rdp-button_next:hover,
          .leaves-date-filter-inline .rdp-button_previous:hover,
          .leaves-date-filter-inline .rdp-button_next:hover {
            background: #EAF2FB !important;
          }

          .leaves-date-filter-inline .rdp-footer button,
          .leaves-date-filter-inline [class*="footer"] button {
            height: auto !important;
            min-height: 0 !important;
            min-width: auto !important;
            border: 0 !important;
            border-radius: 8px !important;
            background: transparent !important;
            padding: 8px 10px !important;
            color: #0D4676 !important;
            font-size: 13px !important;
            font-weight: 800 !important;
            box-shadow: none !important;
          }

          .leaves-date-filter-inline .rdp-footer button:hover,
          .leaves-date-filter-inline [class*="footer"] button:hover {
            background: #F2F6FA !important;
          }
        `}
      </style>

      <PaginationDateRangeFilter entity="leaves" visible className="m-0" />
    </div>
  );
}

function LeaveDetailsModal({ open, item, onClose }) {
  const [isClosing, setIsClosing] = useState(false);

  const portalTarget =
    typeof document !== "undefined" ? document.body : null;

  if (!open || !item || !portalTarget) {
    return null;
  }

  function handleAnimatedClose() {
    if (isClosing) return;

    setIsClosing(true);

    window.setTimeout(() => {
      setIsClosing(false);
      onClose?.();
    }, 220);
  }

return createPortal(
  <div
    className={`fixed inset-0 z-[999999] flex h-dvh items-center justify-center bg-black/40 p-4 ${
      isClosing ? "sibs-modal-backdrop-out" : "sibs-modal-backdrop-in"
    }`}
    onClick={handleAnimatedClose}
  >
    <div
      className={`flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${
        isClosing ? "sibs-modal-pop-out" : "sibs-modal-pop-in"
      }`}
      onClick={(event) => event.stopPropagation()}
    >
        <div className="flex items-start justify-between gap-4 border-b border-[#f3f4f6] px-6 py-5 max-sm:px-4">
          <div>
            <h2 className="m-0 text-xl font-bold text-sibs-primary-1">
              Leave Details
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Employee leave request, credits, plotted leave, and remaining
              leave balance.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAnimatedClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-[0.98]"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 max-sm:p-4">
          <div className="grid grid-cols-[1fr_340px] gap-5 max-lg:grid-cols-1">
            <div className="flex flex-col gap-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex justify-between gap-4 max-lg:flex-col">
                  <div>
                    <h3 className="m-0 text-xl font-bold text-[#101828]">
                      {item.gy_full_name || item.gy_username || "Unknown User"}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                      User Code: {item.gy_user_code || "—"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className={getStatusClass(item.gy_leave_status)}>
                        {normalizeStatus(item.gy_leave_status)}
                      </Badge>

                      <Badge className="border-blue-200 bg-blue-50 text-sibs-primary-1">
                        {getLeaveTypeLabel(
                          item.gy_leave_type,
                          item.leave_type_label,
                        )}
                      </Badge>
                    </div>
                  </div>

                  <div className="min-w-[150px] rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-center">
                    <p className="m-0 text-[11px] font-bold uppercase text-sibs-primary-1/70">
                      Remaining
                    </p>

                    <strong className="mt-1 block text-3xl font-bold text-sibs-primary-1">
                      {formatNumber(item.leave_remaining)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Leave Request Information
                </h3>

                <DetailRow label="Leave ID" value={item.gy_leave_id} />
                <DetailRow
                  label="Filed Date"
                  value={formatDateTime(item.gy_leave_filed)}
                />
                <DetailRow
                  label="Leave Type"
                  value={getLeaveTypeLabel(
                    item.gy_leave_type,
                    item.leave_type_label,
                  )}
                />
                <DetailRow
                  label="Paid Leave"
                  value={formatNumber(item.gy_leave_paid)}
                />
                <DetailRow
                  label="Leave Day"
                  value={formatNumber(item.gy_leave_day)}
                />
                <DetailRow
                  label="Date From"
                  value={formatDate(item.gy_leave_date_from)}
                />
                <DetailRow
                  label="Date To"
                  value={formatDate(item.gy_leave_date_to)}
                />
                <DetailRow label="Reason" value={item.gy_leave_reason} />
                <DetailRow label="Remarks" value={item.gy_leave_remarks} />
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-slate-50 p-5">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Leave Balance
                </h3>

                <DetailRow
                  label="Available From"
                  value={formatDate(item.gy_leave_avail_date)}
                />
                <DetailRow
                  label="Available To"
                  value={formatDate(item.gy_leave_avail_dateto)}
                />
                <DetailRow
                  label="Approved Credits"
                  value={formatNumber(item.leave_credit)}
                />
                <DetailRow
                  label="Plotted Leaves"
                  value={formatNumber(item.leave_plotted)}
                />
                <DetailRow
                  label="Remaining Leaves"
                  value={formatNumber(item.leave_remaining)}
                />
                <DetailRow
                  label="Justification"
                  value={item.gy_leave_avail_justify}
                />
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Approval Information
                </h3>

                <DetailRow
                  label="Status"
                  value={normalizeStatus(item.gy_leave_status)}
                />
                <ApproverRow item={item} />
                <DetailRow
                  label="Date Approved"
                  value={formatDateTime(item.gy_leave_date_approved)}
                />
                <DetailRow label="Attachment" value={item.gy_leave_attachment} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#f3f4f6] px-6 py-4 max-sm:px-4">
          <button
            type="button"
            onClick={handleAnimatedClose}
            className="rounded-xl bg-sibs-primary-1 px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </div>
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
  showAccountFilter = false,
  accountFilter = "All",
  onAccountSelect,
  accountDropdownOptions = [],
  isPersonalView = false,
  filterValues = {},
}) {
  const tableScrollRef = useRef(null);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [searchSubmitVersion, setSearchSubmitVersion] = useState(0);

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
    if (loading || !pagination.hasPreviousPage) return;

    setPage((prev) => Math.max(Number(prev || 1) - 1, 1));
  }

  function handleNextPage() {
    if (loading || !pagination.hasNextPage) return;

    setPage((prev) => Number(prev || 1) + 1);
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
      <section
        className="sibs-profile-tab-panel min-w-0 overflow-visible rounded-xl bg-white shadow-sm"
        style={{ animationDelay: "80ms" }}
      >
        <div className="relative overflow-visible p-4 sm:p-5">
          <PaginationTable
            title={isPersonalView ? "My Leave Records" : "Leave Records"}
            subtitle={
              isPersonalView
                ? "Only your current page of leave records is loaded."
                : "Only 15 leave records are loaded from the backend per page."
            }
            loading={loading}
            searchValue={searchInput}
            searchPlaceholder="Search name"
            onSearchChange={(value) => setSearchInput(value)}
            onSearchKeyDown={handleSearchKeyDown}
            dropdownFilters={
              showAccountFilter
                ? [
                    {
                      key: "account",
                      value: accountFilter,
                      onChange: onAccountSelect,
                      options: accountDropdownOptions,
                      allLabel: "All Accounts",
                      placeholder: "Search accounts...",
                      className: "w-full min-w-0 xl:col-span-2",
                      searchable: true,
                      includeAll: true,
                    },
                  ]
                : []
            }
            filters={[
              {
                key: "status",
                value: statusFilter,
                onChange: onStatusChange,
                options: [
                  { label: "All Status", value: "All" },
                  { label: "Approved", value: "Approved" },
                  { label: "Pending", value: "Pending" },
                  { label: "Rejected", value: "Rejected" },
                ],
                className: "w-full min-w-0 xl:col-span-2",
                searchable: false,
              },
            ]}
            rightContent={<InlineDateRangeFilter visible />}
            controlsClassName="grid grid-cols-1 gap-3 overflow-visible sm:grid-cols-2 xl:grid-cols-12 xl:items-end"
            searchClassName="relative min-w-0 w-full sm:col-span-2 xl:col-span-4"
            rightContentClassName="flex min-w-0 w-full items-end sm:col-span-2 xl:col-span-4"
            showPagination={false}
            className="mb-3"
          />

          <div className="mb-5 block sm:hidden">
            <button
              type="button"
              onClick={runSearch}
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-4 text-sm font-bold text-white shadow-sm transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search size={17} />
              Search
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#E6ECF2]">
            <div ref={tableScrollRef} className="max-h-[580px] overflow-auto">
              <table className="w-full min-w-[1280px] border-collapse bg-white">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Employee
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Leave Type
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Filed
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Date From
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Date To
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Days
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Credits
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Plotted
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Remaining
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Status
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody
                  key={`${page}-${searchKeyword}-${searchSubmitVersion}-${statusFilter}-${accountFilter}-${dateFrom}-${dateTo}-${loading}`}
                >
                  {loading ? (
                    Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                      <tr key={index}>
                        <td
                          colSpan={11}
                          className="border-t border-[#f3f4f6] px-5 py-4"
                        >
                          <div className="h-5 w-full animate-sibs-pulse rounded bg-gray-200" />
                        </td>
                      </tr>
                    ))
                  ) : leaves.length > 0 ? (
                    leaves.map((item) => (
                      <tr
                        key={`${item.gy_leave_id}-${item.gy_user_id}`}
                        className="transition-all duration-200 hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm">
                          <p className="m-0 font-bold text-[#101828]">
                            {item.gy_full_name || item.gy_username || "—"}
                          </p>

                          <p className="mt-0.5 text-xs font-semibold text-sibs-tertiary-5">
                            {item.gy_user_code || "No user code"}
                          </p>
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-bold text-[#344054]">
                          {item.leaveTypeLabel ||
                            getLeaveTypeLabel(
                              item.gy_leave_type,
                              item.leave_type_label,
                            )}
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm text-[#344054]">
                          {formatDate(item.gy_leave_filed)}
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm text-[#344054]">
                          {formatDate(item.gy_leave_date_from)}
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm text-[#344054]">
                          {formatDate(item.gy_leave_date_to)}
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm font-bold text-sibs-primary-1">
                          {formatNumber(item.gy_leave_day)}
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm font-bold text-[#344054]">
                          {formatNumber(item.leave_credit)}
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm font-bold text-amber-600">
                          {formatNumber(item.leave_plotted)}
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm font-bold text-emerald-600">
                          {formatNumber(item.leave_remaining)}
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm">
                          <Badge className={getStatusClass(item.gy_leave_status)}>
                            {item.normalizedStatus ||
                              normalizeStatus(item.gy_leave_status)}
                          </Badge>
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedLeave(item)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 py-2 text-xs font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5 hover:shadow-sm active:scale-[0.98]"
                          >
                            <Eye size={15} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={11}
                        className="border-t border-[#f3f4f6] p-10 text-center text-sm font-bold text-gray-500"
                      >
                        No leave records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

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
          />
        </div>
      </section>

      <LeaveDetailsModal
        open={!!selectedLeave}
        item={selectedLeave}
        onClose={() => setSelectedLeave(null)}
      />
    </>
  );
}