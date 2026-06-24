import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../components/layout/Header";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  UserRound,
  XCircle,
} from "lucide-react";

import { getLeaves } from "@/lib/axios/getLeaves";
import { useUser } from "../../services/context/UserContext";
import { usePagination } from "@/services/context/PaginationContext";
import LeavesTable from "@/components/tables/Leaves/LeavesTable";

const PAGE_LIMIT = 15;
const LEAVES_STATE_KEY = "leavesPageState";

function formatNumber(value) {
  if (value === "..." || value === null || value === undefined) return "...";

  const numberValue = Number(value || 0);

  return numberValue.toLocaleString("en-PH", {
    maximumFractionDigits: 2,
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
      "admin",
      "administrator",
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

export default function LeavesPage() {
  const { user } = useUser();
  const mainScrollRef = useRef(null);
  const restoredRef = useRef(false);

  const [leaves, setLeaves] = useState([]);
  const [recordScope, setRecordScope] = useState("all");

  const [statusFilter, setStatusFilter] = useState("All");
  const [accountFilter, setAccountFilter] = useState("All");
  const [accountOptions, setAccountOptions] = useState([]);

  const paginationContext = usePagination("leaves");

  const {
    page = 1,
    search = "",
    searchInput = "",
    loading,
    setLoading,
    setSearchInput,
    setSearch,
    pagination,
    setPagination,
    filterValues,
    setPage,
    setDateRange,
  } = paginationContext;

  const dateFrom = filterValues?.dateFrom || "";
  const dateTo = filterValues?.dateTo || "";

  const isEmployeeAccount =
    String(user?.role || "").toLowerCase() === "employee";

  const showAccountFilter = canViewAccountFilter(user);

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
    pageValue = page,
    searchValue = search,
    statusValue = statusFilter,
    accountValue = accountFilter,
    dateFromValue = dateFrom,
    dateToValue = dateTo,
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
        dateFrom: dateFromValue,
        dateTo: dateToValue,
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

  useEffect(() => {
    if (restoredRef.current) return;

    try {
      const savedState = sessionStorage.getItem(LEAVES_STATE_KEY);

      if (savedState) {
        const parsed = JSON.parse(savedState);

        if (typeof parsed.search === "string") {
          setSearchInput(parsed.search);
          setSearch(parsed.search);
        }

        if (typeof parsed.status === "string") {
          setStatusFilter(parsed.status || "All");
        }

        if (typeof parsed.account === "string") {
          setAccountFilter(parsed.account || "All");
        }

        if (typeof parsed.page === "number" && parsed.page > 0) {
          setPage(parsed.page);
        }

        if (
          typeof setDateRange === "function" &&
          (typeof parsed.dateFrom === "string" ||
            typeof parsed.dateTo === "string")
        ) {
          setDateRange({
            dateFrom: parsed.dateFrom || "",
            dateTo: parsed.dateTo || "",
          });
        }
      }
    } catch (err) {
      console.error("Leaves state restore error:", err);
    } finally {
      restoredRef.current = true;
    }
  }, [setDateRange, setPage, setSearch, setSearchInput]);

  useEffect(() => {
    if (!restoredRef.current) return;

    sessionStorage.setItem(
      LEAVES_STATE_KEY,
      JSON.stringify({
        search,
        page,
        status: statusFilter,
        account: accountFilter,
        dateFrom,
        dateTo,
      }),
    );
  }, [search, page, statusFilter, accountFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (!restoredRef.current) return;

    fetchLeaves({
      pageValue: page,
      searchValue: search,
      statusValue: statusFilter,
      accountValue: accountFilter,
      dateFromValue: dateFrom,
      dateToValue: dateTo,
      shouldScrollTop: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, accountFilter, dateFrom, dateTo]);

  function handleAccountSelect(accountName) {
    setAccountFilter(accountName || "All");
    setPage(1);
  }

  function handleStatusChange(nextStatus) {
    setStatusFilter(nextStatus || "All");
    setPage(1);
  }

  function handleSetSearchKeyword(value) {
    setSearch(value);
    setPage(1);
  }

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

  const accountDropdownOptions = useMemo(() => {
    return accountOptions.map((account) => ({
      label: account,
      value: account,
    }));
  }, [accountOptions]);

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

          <LeavesTable
            leaves={paginatedLeaves}
            loading={loading}
            page={page}
            searchInput={searchInput}
            searchKeyword={search}
            setSearchInput={setSearchInput}
            setSearchKeyword={handleSetSearchKeyword}
            setPage={setPage}
            pagination={pagination}
            statusFilter={statusFilter}
            onStatusChange={handleStatusChange}
            showAccountFilter={showAccountFilter}
            accountFilter={accountFilter}
            onAccountSelect={handleAccountSelect}
            accountDropdownOptions={accountDropdownOptions}
            isPersonalView={isPersonalView}
            filterValues={filterValues}
          />
        </div>
      </main>
    </div>
  );
}