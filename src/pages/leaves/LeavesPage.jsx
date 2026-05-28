import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../components/layout/Header";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Search,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import { getLeaves } from "@/lib/axios/getLeaves";
import { useUser } from "../../services/context/UserContext";

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
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function canViewAccountFilter(user) {
  const roles = [
    user?.role,
    user?.tokenType,
    user?.userRole,
    user?.accountType,
    user?.user_type,
    user?.gy_user_type,
  ].map(normalizeRole);

  return roles.some((role) =>
    [
      "hr_admin",
      "hradmin",
      "super_admin",
      "superadmin",
      "super_administrator",
    ].includes(role),
  );
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

function StatCard({
  title,
  value,
  icon: Icon,
  valueClassName = "text-sibs-primary-1",
  iconClassName = "bg-[#F2F6FA] text-sibs-primary-1",
  delay = 0,
}) {
  return (
    <div
      className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
            {title}
          </p>

          <p
            className={`mt-3 truncate text-3xl font-extrabold leading-none ${valueClassName}`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function AnimatedDropdown({ open, children, className = "" }) {
  return (
    <div
      className={`absolute left-0 right-0 top-full mt-2 grid transition-all duration-300 ease-out ${
        open
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0"
      } ${className}`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl transition-all duration-300 ease-out ${
            open ? "translate-y-0 scale-100" : "-translate-y-2 scale-[0.98]"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
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

function LeaveDetailsModal({ open, item, onClose }) {
  const [isClosing, setIsClosing] = useState(false);

  if (!open || !item) return null;

  function handleAnimatedClose() {
    if (isClosing) return;

    setIsClosing(true);

    window.setTimeout(() => {
      setIsClosing(false);
      onClose?.();
    }, 220);
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 p-4 ${
        isClosing ? "sibs-modal-backdrop-out" : "sibs-modal-backdrop-in"
      }`}
      onClick={handleAnimatedClose}
    >
      <div
        className={`flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${
          isClosing ? "sibs-modal-pop-out" : "sibs-modal-pop-in"
        }`}
        onClick={(e) => e.stopPropagation()}
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
    </div>
  );
}

export default function LeavesPage() {
  const { user } = useUser();
  const mainScrollRef = useRef(null);
  const accountDropdownRef = useRef(null);

  const [leaves, setLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [accountFilter, setAccountFilter] = useState("All");
  const [accountOptions, setAccountOptions] = useState([]);
  const [accountSearch, setAccountSearch] = useState("");
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [recordScope, setRecordScope] = useState("all");

  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: PAGE_LIMIT,
    returned: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  const isEmployeeAccount =
    String(user?.role || "").toLowerCase() === "employee";

  const showAccountFilter = canViewAccountFilter(user);

  const filteredAccountOptions = useMemo(() => {
    const keyword = accountSearch.trim().toLowerCase();

    if (!keyword) return accountOptions;

    return accountOptions.filter((account) =>
      String(account || "").toLowerCase().includes(keyword),
    );
  }, [accountOptions, accountSearch]);

  function getAccountFilterLabel() {
    if (!accountFilter || accountFilter === "All") return "All Accounts";
    return accountFilter;
  }

  function handleAccountSelect(accountName) {
    setAccountFilter(accountName);
    setAccountSearch("");
    setShowAccountDropdown(false);
    setCurrentPage(1);

    fetchLeaves({
      pageValue: 1,
      searchValue: searchKeyword,
      statusValue: statusFilter,
      accountValue: accountName,
      shouldScrollTop: true,
    });
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(e.target)
      ) {
        setShowAccountDropdown(false);
        setAccountSearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function scrollPageToTop() {
    requestAnimationFrame(() => {
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTo({
          top: 0,
          left: 0,
          behavior: "auto",
        });
      }

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    });
  }

  async function fetchLeaves({
    pageValue = currentPage,
    searchValue = searchKeyword,
    statusValue = statusFilter,
    accountValue = accountFilter,
    shouldScrollTop = false,
  } = {}) {
    if (shouldScrollTop) {
      scrollPageToTop();
    }

    setLoading(true);

    try {
      const res = await getLeaves({
        page: pageValue,
        limit: PAGE_LIMIT,
        search: searchValue,
        status: statusValue,
        account: showAccountFilter ? accountValue : "All",
      });

      if (res?.success && Array.isArray(res.data)) {
        setLeaves(res.data);
        setRecordScope(res.scope || "all");

        if (Array.isArray(res.accountOptions)) {
          setAccountOptions(res.accountOptions);
        }

        setPagination(
          res.pagination || {
            currentPage: pageValue,
            limit: PAGE_LIMIT,
            returned: res.data.length,
            hasPreviousPage: pageValue > 1,
            hasNextPage: false,
          },
        );
      } else {
        setLeaves([]);
        setPagination({
          currentPage: pageValue,
          limit: PAGE_LIMIT,
          returned: 0,
          hasPreviousPage: pageValue > 1,
          hasNextPage: false,
        });
      }
    } catch (err) {
      console.error("FETCH LEAVES ERROR:", err);

      setLeaves([]);
      setPagination({
        currentPage: pageValue,
        limit: PAGE_LIMIT,
        returned: 0,
        hasPreviousPage: pageValue > 1,
        hasNextPage: false,
      });
    } finally {
      setLoading(false);

      if (shouldScrollTop) {
        scrollPageToTop();
      }
    }
  }

  function runSearch() {
    const keyword = searchInput.trim();

    setSearchKeyword(keyword);
    setCurrentPage(1);

    fetchLeaves({
      pageValue: 1,
      searchValue: keyword,
      statusValue: statusFilter,
      accountValue: accountFilter,
      shouldScrollTop: true,
    });
  }

  function handleSearchKeyDown(e) {
    if (e.key === "Enter") {
      runSearch();
    }
  }

  function handleStatusChange(e) {
    const nextStatus = e.target.value;

    setStatusFilter(nextStatus);
    setCurrentPage(1);

    fetchLeaves({
      pageValue: 1,
      searchValue: searchKeyword,
      statusValue: nextStatus,
      accountValue: accountFilter,
      shouldScrollTop: true,
    });
  }

  function handlePreviousPage() {
    if (loading || currentPage <= 1) return;

    const nextPage = currentPage - 1;

    setCurrentPage(nextPage);

    fetchLeaves({
      pageValue: nextPage,
      searchValue: searchKeyword,
      statusValue: statusFilter,
      accountValue: accountFilter,
      shouldScrollTop: true,
    });
  }

  function handleNextPage() {
    if (loading || !pagination.hasNextPage) return;

    const nextPage = currentPage + 1;

    setCurrentPage(nextPage);

    fetchLeaves({
      pageValue: nextPage,
      searchValue: searchKeyword,
      statusValue: statusFilter,
      accountValue: accountFilter,
      shouldScrollTop: true,
    });
  }

  useEffect(() => {
    fetchLeaves({
      pageValue: 1,
      searchValue: "",
      statusValue: "All",
      accountValue: "All",
      shouldScrollTop: true,
    });
  }, []);

  useEffect(() => {
    scrollPageToTop();
  }, [currentPage, searchKeyword, statusFilter, accountFilter]);

  const paginatedLeaves = useMemo(() => {
    return leaves.map((item) => {
      const leaveCredit = Number(
        item.leave_credit || item.gy_leave_avail_approved || 0,
      );

      const leavePlotted = Number(
        item.leave_plotted || item.gy_leave_avail_plotted || 0,
      );

      const leaveRemaining =
        item.leave_remaining !== undefined && item.leave_remaining !== null
          ? Number(item.leave_remaining || 0)
          : leaveCredit - leavePlotted;

      return {
        ...item,
        leave_credit: leaveCredit,
        leave_plotted: leavePlotted,
        leave_remaining: leaveRemaining,
        normalizedStatus: normalizeStatus(item.gy_leave_status),
        leaveTypeLabel: getLeaveTypeLabel(
          item.gy_leave_type,
          item.leave_type_label,
        ),
      };
    });
  }, [leaves]);

  const pageStats = useMemo(() => {
    const totalLeaves = paginatedLeaves.length;

    const approvedLeaves = paginatedLeaves.filter(
      (item) => item.normalizedStatus === "Approved",
    ).length;

    const pendingLeaves = paginatedLeaves.filter(
      (item) => item.normalizedStatus === "Pending",
    ).length;

    const rejectedLeaves = paginatedLeaves.filter(
      (item) => item.normalizedStatus === "Rejected",
    ).length;

    const totalLeaveDays = paginatedLeaves.reduce(
      (sum, item) => sum + Number(item.gy_leave_day || 0),
      0,
    );

    const totalRemaining = paginatedLeaves.reduce(
      (sum, item) => sum + Number(item.leave_remaining || 0),
      0,
    );

    return {
      totalLeaves,
      approvedLeaves,
      pendingLeaves,
      rejectedLeaves,
      totalLeaveDays,
      totalRemaining,
    };
  }, [paginatedLeaves]);

  const isPersonalView = isEmployeeAccount || recordScope === "personal";

  return (
    <div className="flex h-screen flex-1 flex-col bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main
        ref={mainScrollRef}
        className="min-w-0 flex-1 overflow-y-scroll overflow-x-hidden bg-sibs-tertiary-10 px-4 py-6 sm:px-6 lg:px-8"
      >
        <div className="flex min-w-0 flex-col gap-6">
          <section className="sibs-page-header-in flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-3">
                <CalendarDays
                  size={34}
                  strokeWidth={2.2}
                  className="shrink-0 text-sibs-primary-1 transition-transform duration-300 group-hover:scale-105"
                />

                <h1 className="m-0 break-words text-[28px] font-bold leading-tight tracking-[-0.9px] text-sibs-primary-1 sm:text-[32px] xl:text-[38px]">
                  Leaves
                </h1>
              </div>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                {isPersonalView
                  ? "View your personal leave requests, leave credits, plotted leaves, and remaining leave balance."
                  : "View employee leave requests, leave credits, plotted leaves, and remaining leave balance."}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-[#101828]">
                  {isPersonalView
                    ? "My Current Page Summary"
                    : "Current Page Summary"}
                </h2>

                <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                  These totals are based only on the current 15 records loaded
                  for this page.
                </p>
              </div>

              {isPersonalView && (
                <Badge className="border-blue-200 bg-blue-50 text-sibs-primary-1">
                  Personal View
                </Badge>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <StatCard
                title="Loaded Leaves"
                value={loading ? "..." : formatNumber(pageStats.totalLeaves)}
                icon={FileText}
                delay={0}
              />

              <StatCard
                title="Approved"
                value={
                  loading ? "..." : formatNumber(pageStats.approvedLeaves)
                }
                icon={CheckCircle2}
                valueClassName="text-emerald-600"
                iconClassName="bg-emerald-50 text-emerald-600"
                delay={60}
              />

              <StatCard
                title="Pending"
                value={loading ? "..." : formatNumber(pageStats.pendingLeaves)}
                icon={Clock}
                valueClassName="text-amber-500"
                iconClassName="bg-amber-50 text-amber-600"
                delay={120}
              />

              <StatCard
                title="Rejected"
                value={loading ? "..." : formatNumber(pageStats.rejectedLeaves)}
                icon={XCircle}
                valueClassName="text-red-600"
                iconClassName="bg-red-50 text-red-600"
                delay={180}
              />

              <StatCard
                title="Page Leave Days"
                value={loading ? "..." : formatNumber(pageStats.totalLeaveDays)}
                icon={CalendarDays}
                delay={240}
              />

              <StatCard
                title="Page Remaining"
                value={loading ? "..." : formatNumber(pageStats.totalRemaining)}
                icon={UserRound}
                valueClassName="text-emerald-600"
                iconClassName="bg-emerald-50 text-emerald-600"
                delay={300}
              />
            </div>
          </section>

          <section
            className="sibs-profile-tab-panel min-w-0 overflow-hidden rounded-xl bg-white shadow-sm"
            style={{ animationDelay: "80ms" }}
          >
            <div className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#101828]">
                    {isPersonalView ? "My Leave Records" : "Leave Records"}
                  </h2>

                  <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                    {isPersonalView
                      ? "Only your current page of leave records is loaded."
                      : "Only 15 leave records are loaded from the backend per page."}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
                  <div className="relative w-full sm:w-[340px]">
                    <Search
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                    />

                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Search then press Enter"
                      className="h-11 w-full rounded-full border border-sibs-tertiary-8 bg-white px-4 pl-11 text-sm text-sibs-primary-1 outline-none transition-all duration-200 placeholder:text-sibs-tertiary-5 hover:border-sibs-primary-1/30 hover:shadow-sm focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                    />
                  </div>

                  {showAccountFilter && (
                    <div
                      ref={accountDropdownRef}
                      className="relative z-50 w-full sm:w-[280px]"
                    >
                      <Search
                        size={17}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                      />

                      <input
                        type="text"
                        value={
                          showAccountDropdown
                            ? accountSearch
                            : getAccountFilterLabel()
                        }
                        onChange={(e) => {
                          setAccountSearch(e.target.value);
                          setShowAccountDropdown(true);
                        }}
                        onFocus={() => {
                          setShowAccountDropdown(true);
                          setAccountSearch("");
                        }}
                        placeholder="Search accounts..."
                        autoComplete="off"
                        className="h-11 w-full rounded-full border border-sibs-tertiary-8 bg-white px-4 pl-10 pr-10 text-sm font-bold text-sibs-primary-1 outline-none transition-all duration-200 placeholder:text-sibs-tertiary-5 hover:border-sibs-primary-1/30 hover:shadow-sm focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                      />

                      <ChevronDown
                        size={17}
                        onClick={() => {
                          setShowAccountDropdown((prev) => !prev);
                          setAccountSearch("");
                        }}
                        className={`absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-sibs-tertiary-5 transition-transform duration-300 ${
                          showAccountDropdown ? "rotate-180" : ""
                        }`}
                      />

                      <AnimatedDropdown open={showAccountDropdown}>
                        <div className="max-h-64 overflow-y-auto py-2 sibs-scrollbar">
                          <button
                            type="button"
                            onClick={() => handleAccountSelect("All")}
                            className={`block w-full px-4 py-3 text-left text-sm transition ${
                              accountFilter === "All"
                                ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                                : "text-[#344054] hover:bg-[#F8FAFC]"
                            }`}
                          >
                            All Accounts
                          </button>

                          {filteredAccountOptions.length > 0 ? (
                            filteredAccountOptions.map((account, index) => {
                              const checked = accountFilter === account;

                              return (
                                <button
                                  key={`${account}-${index}`}
                                  type="button"
                                  onClick={() => handleAccountSelect(account)}
                                  className={`block w-full px-4 py-3 text-left text-sm transition ${
                                    checked
                                      ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                                      : "text-[#344054] hover:bg-[#F8FAFC]"
                                  }`}
                                >
                                  <span className="block truncate">
                                    {account}
                                  </span>
                                </button>
                              );
                            })
                          ) : (
                            <div className="px-4 py-4 text-sm font-semibold text-sibs-tertiary-5">
                              No accounts found.
                            </div>
                          )}
                        </div>
                      </AnimatedDropdown>
                    </div>
                  )}

                  <select
                    value={statusFilter}
                    onChange={handleStatusChange}
                    className="h-11 rounded-full border border-sibs-tertiary-8 bg-white px-4 text-sm font-bold text-sibs-primary-1 outline-none transition-all duration-200 hover:border-sibs-primary-1/30 hover:shadow-sm focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                  >
                    <option value="All">All Status</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-[#E6ECF2]">
                <div className="max-h-[580px] overflow-auto">
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
                      key={`${currentPage}-${searchKeyword}-${statusFilter}-${accountFilter}-${loading}`}
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
                      ) : paginatedLeaves.length > 0 ? (
                        paginatedLeaves.map((item) => (
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
                              {item.leaveTypeLabel}
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
                              <Badge
                                className={getStatusClass(
                                  item.gy_leave_status,
                                )}
                              >
                                {item.normalizedStatus}
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

              <div className="mt-5 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
                <p className="m-0 text-sm font-semibold text-sibs-tertiary-5">
                  Showing {paginatedLeaves.length} loaded leave records
                </p>

                <div className="flex items-center gap-2 max-sm:justify-center">
                  <button
                    type="button"
                    disabled={!pagination.hasPreviousPage || loading}
                    onClick={handlePreviousPage}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <span className="inline-flex h-10 items-center justify-center rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-[#344054]">
                    Page {pagination.currentPage}
                  </span>

                  <button
                    type="button"
                    disabled={!pagination.hasNextPage || loading}
                    onClick={handleNextPage}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <LeaveDetailsModal
        open={!!selectedLeave}
        item={selectedLeave}
        onClose={() => setSelectedLeave(null)}
      />
    </div>
  );
}