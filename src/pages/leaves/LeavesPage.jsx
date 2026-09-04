import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Header from "../../components/layout/Header";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
  UserRound,
  XCircle,
} from "lucide-react";

import { getLeaves, getLeavesSummary } from "@/lib/axios/getLeaves";
import { useUser } from "../../services/context/UserContext";
import { useSidebarNotifications } from "../../services/context/SidebarNotificationContext";
import { usePagination } from "@/services/context/PaginationContext";
import LeavesTable from "@/components/tables/Leaves/LeavesTable";
import { useLocation, useNavigate } from "react-router-dom";

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

function getAccessValue(user) {
  return Number(
    user?.admin_access ??
      user?.adminAccess ??
      user?.access ??
      user?.gy_user_access ??
      user?.gyUserAccess ??
      0,
  );
}

function isTeamLeaderUser(user) {
  const access = getAccessValue(user);

  if (access) return access === 8;

  const roles = [
    user?.role,
    user?.userRole,
    user?.accountType,
    user?.user_type,
    user?.gy_user_type,
  ].map(normalizeRole);

  return roles.some((role) =>
    ["team_leader", "teamleader", "tl"].includes(role),
  );
}

function isWfmUser(user) {
  const access = getAccessValue(user);

  if (access) return access === 9;

  const roles = [
    user?.role,
    user?.userRole,
    user?.accountType,
    user?.user_type,
    user?.gy_user_type,
  ].map(normalizeRole);

  return roles.some((role) =>
    ["wfm", "workforce_management"].includes(role),
  );
}

function canViewLeaveFilters(user) {
  if (isTeamLeaderUser(user) || isWfmUser(user)) return true;

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

function getRequestedLeaveStatusFromNavigationState(state = {}) {
  const source = String(state?.source || "")
    .trim()
    .toLowerCase();

  const requestedStatus = String(state?.leaveStatus || "")
    .trim()
    .toLowerCase();

  if (
    source === "pending-leave-notification" &&
    requestedStatus === "pending"
  ) {
    return "Pending";
  }

  return "";
}


function StatCard({
  title,
  value,
  description,
  icon,
  tone = "navy",
  delay = 0,
}) {
  const toneMap = {
    navy: {
      label: "text-[#042C51]",
      value: "text-[#042C51]",
      iconWrap: "bg-[#EAF2FB]",
      icon: "text-[#042C51]",
    },
    emerald: {
      label: "text-[#047857]",
      value: "text-[#047857]",
      iconWrap: "bg-[#ECFDF3]",
      icon: "text-[#059669]",
    },
    amber: {
      label: "text-[#B45309]",
      value: "text-[#F59E0B]",
      iconWrap: "bg-[#FFFBEB]",
      icon: "text-[#F59E0B]",
    },
    red: {
      label: "text-[#BE123C]",
      value: "text-[#E11D48]",
      iconWrap: "bg-[#FFF1F2]",
      icon: "text-[#E11D48]",
    },
    orange: {
      label: "text-[#C2410C]",
      value: "text-[#FF5C28]",
      iconWrap: "bg-[#FFF3ED]",
      icon: "text-[#FF5C28]",
    },
  };

  const currentTone = toneMap[tone] || toneMap.navy;
  const IconComponent = icon;

  return (
    <article
      className="sibs-metric-card sibs-page-card-in font-jakarta flex h-[104px] 2xl:h-[116px] min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
        <div className="min-w-0 flex-1 self-stretch">
          <p
            className={`m-0 truncate sibs-text-micro font-extrabold uppercase ${currentTone.label}`}
          >
            {title}
          </p>

          <p
            className={`font-heading mt-1.5 2xl:mt-2 text-2xl 2xl:text-3xl font-bold leading-none tabular-nums tracking-tight ${currentTone.value}`}
          >
            {value}
          </p>

          <p className="mt-1 line-clamp-1 truncate sibs-text-micro font-semibold leading-tight text-[#667085]">
            {description}
          </p>
        </div>

        <div
          className={`flex h-7.5 w-7.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full ${currentTone.iconWrap} ${currentTone.icon}`}
        >
          <IconComponent className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" strokeWidth={2} />
        </div>
      </div>
    </article>
  );
}

export default function LeavesPage() {
  const { user } = useUser();
  const { markNotificationSeen } = useSidebarNotifications() || {};
  const location = useLocation();
  const navigate = useNavigate();
  const mainScrollRef = useRef(null);
  const restoredRef = useRef(false);

  const [leaves, setLeaves] = useState([]);
  const [leaveSummary, setLeaveSummary] = useState(null);
  const [recordScope, setRecordScope] = useState("all");

  const [statusFilter, setStatusFilter] = useState(
    () =>
      getRequestedLeaveStatusFromNavigationState(
        location.state,
      ) || "All",
  );
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [accountFilter, setAccountFilter] = useState("All");
  const [departmentOptions, setDepartmentOptions] = useState([]);
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

  const showDepartmentFilter = canViewLeaveFilters(user);
  const showAccountFilter = canViewLeaveFilters(user);

  useEffect(() => {
    if (!user) return;

    markNotificationSeen?.("leaves");
  }, [user, markNotificationSeen]);

  function scrollPageToTop(behavior = "auto") {
    requestAnimationFrame(() => {
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
      }
    });
  }

  useLayoutEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    scrollPageToTop("auto");

    const timer = window.setTimeout(() => {
      scrollPageToTop("auto");
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  async function fetchLeaves({
    pageValue = page,
    searchValue = search,
    statusValue = statusFilter,
    departmentValue = departmentFilter,
    accountValue = accountFilter,
    dateFromValue = dateFrom,
    dateToValue = dateTo,
    shouldScrollTop = false,
  } = {}) {
    if (shouldScrollTop) {
      scrollPageToTop("auto");
    }

    setLoading(true);

    try {
      const [res, summaryRes] = await Promise.all([
        getLeaves({
          page: pageValue,
          limit: PAGE_LIMIT,
          search: searchValue,
          status: statusValue,
          department: showDepartmentFilter ? departmentValue : "All",
          account: showAccountFilter ? accountValue : "All",
          dateFrom: dateFromValue,
          dateTo: dateToValue,
          includeDepartments: showDepartmentFilter,
          includeAccounts: showAccountFilter,
        }),
        getLeavesSummary(),
      ]);

      if (summaryRes?.success && summaryRes?.data) {
        setLeaveSummary(summaryRes.data);
      }

      if (res?.success && Array.isArray(res.data)) {
        setLeaves(res.data);
        setRecordScope(res.scope || "all");

        if (Array.isArray(res.departmentOptions)) {
          setDepartmentOptions(res.departmentOptions);
        }

        if (Array.isArray(res.accountOptions)) {
          setAccountOptions(res.accountOptions);
        }

        if (
          showDepartmentFilter &&
          typeof res.selectedDepartment === "string" &&
          res.selectedDepartment !== departmentValue
        ) {
          setDepartmentFilter(res.selectedDepartment || "All");
        }

        if (
          showAccountFilter &&
          typeof res.selectedAccount === "string" &&
          res.selectedAccount !== accountValue
        ) {
          setAccountFilter(res.selectedAccount || "All");
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
        scrollPageToTop("auto");
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

        if (typeof parsed.department === "string") {
          setDepartmentFilter(parsed.department || "All");
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
        department: departmentFilter,
        account: accountFilter,
        dateFrom,
        dateTo,
      }),
    );
  }, [
    search,
    page,
    departmentFilter,
    accountFilter,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    const requestedStatus =
      getRequestedLeaveStatusFromNavigationState(
        location.state,
      );

    if (!requestedStatus) return;

    setStatusFilter(requestedStatus);
    setPage(1);

    navigate(
      `${location.pathname}${location.search}${location.hash}`,
      {
        replace: true,
        state: null,
      },
    );
  }, [
    location.hash,
    location.pathname,
    location.search,
    location.state,
    navigate,
    setPage,
  ]);

  useEffect(() => {
    if (!restoredRef.current) return;

    fetchLeaves({
      pageValue: page,
      searchValue: search,
      statusValue: statusFilter,
      departmentValue: departmentFilter,
      accountValue: accountFilter,
      dateFromValue: dateFrom,
      dateToValue: dateTo,
      shouldScrollTop: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    search,
    statusFilter,
    departmentFilter,
    accountFilter,
    dateFrom,
    dateTo,
  ]);

  function handleDepartmentSelect(departmentId) {
    const nextDepartment = departmentId || "All";

    if (nextDepartment === departmentFilter) return;

    setDepartmentFilter(nextDepartment);
    setAccountFilter("All");
    setAccountOptions([]);
    setPage(1);
  }

  function handleAccountSelect(accountName) {
    const nextAccount = accountName || "All";

    if (nextAccount === accountFilter) return;

    setAccountFilter(nextAccount);
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
    const pageTotalLeaves = paginatedLeaves.length;

    const pageApprovedLeaves = paginatedLeaves.filter(
      (item) => item.normalizedStatus === "Approved",
    ).length;

    const pagePendingLeaves = paginatedLeaves.filter(
      (item) => item.normalizedStatus === "Pending",
    ).length;

    const pageRejectedLeaves = paginatedLeaves.filter(
      (item) => item.normalizedStatus === "Rejected",
    ).length;

    const pageTotalLeaveDays = paginatedLeaves.reduce(
      (sum, item) => sum + Number(item.gy_leave_day || 0),
      0,
    );

    const totalRemaining = paginatedLeaves.reduce(
      (sum, item) => sum + Number(item.leave_remaining || 0),
      0,
    );

    const hasSummary =
      leaveSummary && typeof leaveSummary === "object";

    return {
      totalLeaves: hasSummary
        ? Number(leaveSummary.totalLeaves || 0)
        : pageTotalLeaves,
      approvedLeaves: hasSummary
        ? Number(leaveSummary.approvedLeaves || 0)
        : pageApprovedLeaves,
      pendingLeaves: hasSummary
        ? Number(leaveSummary.pendingLeaves || 0)
        : pagePendingLeaves,
      rejectedLeaves: hasSummary
        ? Number(leaveSummary.rejectedLeaves || 0)
        : pageRejectedLeaves,
      totalLeaveDays: hasSummary
        ? Number(leaveSummary.totalLeaveDays || 0)
        : pageTotalLeaveDays,
      totalRemaining,
    };
  }, [leaveSummary, paginatedLeaves]);

  const isPersonalView = isEmployeeAccount || recordScope === "personal";

  const departmentDropdownOptions = useMemo(() => {
    return (Array.isArray(departmentOptions) ? departmentOptions : [])
      .map((option) => {
        if (option && typeof option === "object") {
          return {
            label: String(option.label || option.name || option.value || "").trim(),
            value: String(option.value || option.id || "").trim(),
          };
        }

        const value = String(option || "").trim();
        return { label: value, value };
      })
      .filter((option) => option.label && option.value);
  }, [departmentOptions]);

  const accountDropdownOptions = useMemo(() => {
    return (Array.isArray(accountOptions) ? accountOptions : [])
      .map((account) => {
        if (account && typeof account === "object") {
          return {
            label: String(account.label || account.name || account.value || "").trim(),
            value: String(account.value || account.name || account.label || "").trim(),
          };
        }

        const value = String(account || "").trim();
        return { label: value, value };
      })
      .filter((option) => option.label && option.value);
  }, [accountOptions]);

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  async function handleManualRefresh() {
    setIsManualRefreshing(true);
    await fetchLeaves({
      pageValue: 1,
      searchValue: search,
      statusValue: statusFilter,
      departmentValue: departmentFilter,
      accountValue: accountFilter,
      dateFromValue: dateFrom,
      dateToValue: dateTo,
      shouldScrollTop: false,
    });
    setIsManualRefreshing(false);
  }

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main ref={mainScrollRef} className="sibs-dashboard-main-wide">
        <div className="mx-auto flex min-h-full w-full max-w-[1700px] flex-1 flex-col space-y-4 sm:space-y-5">
          <section
            className="sibs-page-header-in sibs-page-card-in sibs-card font-jakarta relative overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm 2xl:p-6"
            style={{ animationDelay: "0ms", animationFillMode: "both" }}
          >
            <span className="sibs-top-accent" aria-hidden="true" />

            <div className="mt-0.5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-navy">
                    <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-sibs-orange" />
                    Core HR View
                  </span>
                </div>

                <h1 className="font-heading break-words text-xl 2xl:text-3xl font-bold tracking-tight text-sibs-navy">
                  {isPersonalView ? "My Leaves" : "Leaves"}
                </h1>

                <p className="sibs-text-sm font-semibold leading-relaxed text-[#667085]">
                  {isPersonalView
                    ? "View your leave requests, credits, plotted leaves, and remaining balance."
                    : "Review employee leave requests, credits, plotted leaves, and remaining balances."}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 2xl:gap-2.5">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isManualRefreshing || loading}
                  title="Refresh Leaves Data"
                  className="inline-flex h-8.5 2xl:h-10 w-8.5 2xl:w-10 shrink-0 items-center justify-center rounded-lg border border-[#D6E0EA] bg-white text-[#042C51] shadow-xs outline-none transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                      isManualRefreshing ? "animate-spin text-[#FF5C28]" : ""
                    }`}
                  />
                </button>

                <span className="inline-flex h-8.5 2xl:h-10 shrink-0 items-center justify-center gap-1.5 2xl:gap-2 whitespace-nowrap rounded-lg bg-sibs-orange px-3 2xl:px-3.5 sibs-text-xs font-extrabold text-white shadow-xs">
                  <UserRound className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-white" />
                  {isPersonalView ? "Personal View" : "Administrative View"}
                </span>
              </div>
            </div>
          </section>

          <section
            className="grid grid-cols-2 gap-2.5 2xl:gap-3 md:grid-cols-3 xl:grid-cols-6"
          >
            <StatCard
              title="Total Leaves"
              value={loading ? "..." : formatNumber(pageStats.totalLeaves)}
              description="Accessible leave requests"
              icon={FileText}
              tone="navy"
              delay={0}
            />

            <StatCard
              title="Approved"
              value={loading ? "..." : formatNumber(pageStats.approvedLeaves)}
              description="Approved leave requests"
              icon={CheckCircle2}
              tone="emerald"
              delay={60}
            />

            <StatCard
              title="Pending"
              value={loading ? "..." : formatNumber(pageStats.pendingLeaves)}
              description="Awaiting review"
              icon={Clock}
              tone="amber"
              delay={120}
            />

            <StatCard
              title="Rejected"
              value={loading ? "..." : formatNumber(pageStats.rejectedLeaves)}
              description="Rejected leave requests"
              icon={XCircle}
              tone="red"
              delay={180}
            />

            <StatCard
              title="Leave Days"
              value={loading ? "..." : formatNumber(pageStats.totalLeaveDays)}
              description="Accessible leave days"
              icon={CalendarDays}
              tone="orange"
              delay={240}
            />

            <StatCard
              title="Page Remaining"
              value={loading ? "..." : formatNumber(pageStats.totalRemaining)}
              description="Remaining leave balance"
              icon={UserRound}
              tone="emerald"
              delay={300}
            />
          </section>

          <section className="flex flex-1 flex-col min-w-0">
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
              showDepartmentFilter={showDepartmentFilter}
              departmentFilter={departmentFilter}
              onDepartmentSelect={handleDepartmentSelect}
              departmentDropdownOptions={departmentDropdownOptions}
              showAccountFilter={showAccountFilter}
              accountFilter={accountFilter}
              onAccountSelect={handleAccountSelect}
              accountDropdownOptions={accountDropdownOptions}
              isPersonalView={isPersonalView}
              filterValues={filterValues}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
