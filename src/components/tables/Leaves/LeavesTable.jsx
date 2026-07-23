import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Search, X } from "lucide-react";

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

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f3f4f6] py-3 last:border-b-0">
      <p className="m-0 text-[11px] font-bold uppercase text-sibs-tertiary-5">
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
      <p className="m-0 text-[11px] font-bold uppercase text-sibs-tertiary-5">
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
    <div className="leaves-date-filter-inline w-full sm:w-auto">
      <PaginationDateRangeFilter entity="leaves" visible className="m-0 w-full" />
    </div>
  );
}

function LeaveDetailsModal({ open, item, onClose }) {
  const [isClosing, setIsClosing] = useState(false);
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const handleAnimatedClose = useCallback(() => {
    if (isClosing) return;

    setIsClosing(true);

    window.setTimeout(() => {
      setIsClosing(false);
      onClose?.();
    }, 220);
  }, [isClosing, onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        handleAnimatedClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [handleAnimatedClose, open]);

  if (!open || !item || !portalTarget) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[999999] flex h-dvh items-center justify-center bg-[#042C51]/80 p-2 backdrop-blur-sm sm:p-5 ${
        isClosing ? "sibs-modal-backdrop-out" : "sibs-modal-backdrop-in"
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleAnimatedClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-details-title"
        className={`flex max-h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-[#042C51] font-jakarta shadow-2xl sm:max-h-[90vh] sm:rounded-2xl ${
          isClosing ? "sibs-modal-pop-out" : "sibs-modal-pop-in"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 bg-[#042C51] px-4 py-3.5 text-white sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28]">
              <CalendarDays size={18} />
            </span>

            <div className="min-w-0">
              <h2
                id="leave-details-title"
                className="truncate text-base font-extrabold"
              >
                Leave Details
              </h2>
              <p className="mt-0.5 truncate text-xs text-slate-300">
                Leave request, balance, and approval information
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAnimatedClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close leave details"
          >
            <X size={17} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white p-3 text-[#101828] sm:p-6">
          <div className="space-y-5">
            <section className="flex flex-col gap-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="break-words text-base font-extrabold text-[#042C51] sm:text-lg">
                  {item.gy_full_name || item.gy_username || "Unknown User"}
                </h3>

                <p className="mt-1 text-xs font-semibold text-[#667085]">
                  SiBS ID: {item.gy_user_code || "—"}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className={getStatusClass(item.gy_leave_status)}>
                    {normalizeStatus(item.gy_leave_status)}
                  </Badge>

                  <Badge className="border-orange-200 bg-[#FFF0EB] text-[#FF5C28]">
                    {getLeaveTypeLabel(
                      item.gy_leave_type,
                      item.leave_type_label,
                    )}
                  </Badge>
                </div>
              </div>

              <div className="shrink-0 rounded-xl border border-orange-200 bg-[#FFF0EB] px-5 py-4 text-left sm:min-w-[150px] sm:text-center">
                <p className="m-0 text-[10px] font-extrabold uppercase text-[#C2410C]">
                  Remaining
                </p>
                <strong className="mt-1 block text-3xl font-extrabold tabular-nums text-[#FF5C28]">
                  {formatNumber(item.leave_remaining)}
                </strong>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
              <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
                <h3 className="mb-2 text-sm font-extrabold text-[#042C51]">
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
              </section>

              <div className="space-y-5">
                <section className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 sm:p-5">
                  <h3 className="mb-2 text-sm font-extrabold text-[#042C51]">
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
                </section>

                <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
                  <h3 className="mb-2 text-sm font-extrabold text-[#042C51]">
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
                  <DetailRow
                    label="Attachment"
                    value={item.gy_leave_attachment}
                  />
                </section>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 justify-end border-t border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={handleAnimatedClose}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-[#042C51] px-4 text-xs font-extrabold text-white transition hover:bg-[#FF5C28]"
          >
            Close Details
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
        className="sibs-profile-tab-panel sibs-page-card-in sibs-card min-w-0 overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm"
        style={{ animationDelay: "80ms", animationFillMode: "both" }}
      >
        <div className="border-b border-[#E6ECF2] bg-white px-4 py-4 sm:px-5">
          <h2 className="sibs-section-title">
            {isPersonalView ? "My Leave Records" : "Leave Records"}
          </h2>
          <p className="sibs-section-subtitle">
            {isPersonalView
              ? "Only your current page of leave records is loaded."
              : "Only 15 leave records are loaded from the backend per page."}
          </p>
        </div>

        <div className="relative overflow-visible p-4 sm:p-5">
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
            controlsClassName="flex flex-col gap-3 overflow-visible sm:flex-row sm:items-center"
            searchClassName="relative min-w-0 flex-1"
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
                className: "w-full sm:w-[165px] xl:w-[180px]",
                searchable: false,
                includeAll: false,
              },
              ...(showAccountFilter
                ? [
                    {
                      key: "account",
                      value: accountFilter,
                      onChange: onAccountSelect,
                      options: accountDropdownOptions,
                      allLabel: "All Accounts",
                      placeholder: "Search accounts...",
                      className: "w-full sm:w-[190px] xl:w-[210px]",
                      searchable: true,
                      includeAll: true,
                    },
                  ]
                : []),
            ]}
            rightContent={<InlineDateRangeFilter visible />}
            rightContentClassName="flex min-w-0 w-full items-end sm:w-auto"
            className="border-0 bg-transparent p-0 shadow-none"
          />

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

          <div className="mt-5 overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
            <div
              ref={tableScrollRef}
              className="max-h-[580px] overflow-auto sibs-scrollbar"
            >
              <table className="w-full min-w-[1220px] border-collapse bg-white">
                <thead className="sibs-data-table-head">
                  <tr className="sibs-data-table-head-row">
                    <th className="sibs-data-table-th whitespace-nowrap py-3 text-left">
                      Employee
                    </th>
                    <th className="sibs-data-table-th whitespace-nowrap py-3 text-left">
                      Leave Type
                    </th>
                    <th className="sibs-data-table-th whitespace-nowrap py-3 text-center">
                      Filed
                    </th>
                    <th className="sibs-data-table-th whitespace-nowrap py-3 text-center">
                      Date From
                    </th>
                    <th className="sibs-data-table-th whitespace-nowrap py-3 text-center">
                      Date To
                    </th>
                    <th className="sibs-data-table-th whitespace-nowrap py-3 text-center">
                      Days
                    </th>
                    <th className="sibs-data-table-th whitespace-nowrap py-3 text-center">
                      Credits
                    </th>
                    <th className="sibs-data-table-th whitespace-nowrap py-3 text-center">
                      Plotted
                    </th>
                    <th className="sibs-data-table-th whitespace-nowrap py-3 text-center">
                      Remaining
                    </th>
                    <th className="sibs-data-table-th whitespace-nowrap py-3 text-center">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody
                  key={`${page}-${searchKeyword}-${searchSubmitVersion}-${statusFilter}-${accountFilter}-${dateFrom}-${dateTo}-${loading}`}
                  className="divide-y divide-[#F1F5F9]"
                >
                  {loading ? (
                    Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                      <tr key={index}>
                        <td colSpan={10} className="px-4 py-3.5">
                          <div className="h-5 w-full animate-sibs-pulse rounded bg-[#E6ECF2]" />
                        </td>
                      </tr>
                    ))
                  ) : leaves.length > 0 ? (
                    leaves.map((item) => (
                      <tr
                        key={`${item.gy_leave_id}-${item.gy_user_id}`}
                        role="button"
                        tabIndex={0}
                        title="Open leave details"
                        onClick={() => setSelectedLeave(item)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedLeave(item);
                          }
                        }}
                        className="sibs-data-table-row"
                      >
                        <td className="whitespace-nowrap px-4 py-3.5 text-xs">
                          <p className="m-0 font-extrabold text-[#042C51]">
                            {item.gy_full_name || item.gy_username || "—"}
                          </p>
                          <p className="mt-0.5 text-[10px] font-bold text-[#FF5C28]">
                            {item.gy_user_code || "No user code"}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3.5 text-xs font-bold text-[#344054]">
                          {item.leaveTypeLabel ||
                            getLeaveTypeLabel(
                              item.gy_leave_type,
                              item.leave_type_label,
                            )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3.5 text-center text-xs font-semibold text-[#52637A]">
                          {formatDate(item.gy_leave_filed)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-center text-xs font-semibold text-[#52637A]">
                          {formatDate(item.gy_leave_date_from)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-center text-xs font-semibold text-[#52637A]">
                          {formatDate(item.gy_leave_date_to)}
                        </td>
                        <td className="whitespace-nowrap bg-[#F8FAFC]/60 px-4 py-3.5 text-center text-xs font-extrabold tabular-nums text-[#042C51]">
                          {formatNumber(item.gy_leave_day)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-center text-xs font-extrabold tabular-nums text-[#344054]">
                          {formatNumber(item.leave_credit)}
                        </td>
                        <td className="whitespace-nowrap bg-amber-50/30 px-4 py-3.5 text-center text-xs font-extrabold tabular-nums text-amber-600">
                          {formatNumber(item.leave_plotted)}
                        </td>
                        <td className="whitespace-nowrap bg-emerald-50/30 px-4 py-3.5 text-center text-xs font-extrabold tabular-nums text-emerald-600">
                          {formatNumber(item.leave_remaining)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-center text-xs">
                          <Badge className={getStatusClass(item.gy_leave_status)}>
                            {item.normalizedStatus ||
                              normalizeStatus(item.gy_leave_status)}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-12 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-[#667085]">
                          <CalendarDays size={34} className="text-[#C8D3DF]" />
                          <p className="text-sm font-extrabold text-[#042C51]">
                            No leave records found
                          </p>
                          <p className="text-xs font-semibold">
                            Adjust the search, status, account, or date range filters.
                          </p>
                        </div>
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
        open={Boolean(selectedLeave)}
        item={selectedLeave}
        onClose={() => setSelectedLeave(null)}
      />
    </>
  );
}
