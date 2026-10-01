import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Header from "../../components/layout/Header";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
  UserRound,
  XCircle,
} from "lucide-react";

import { getLeaves } from "@/lib/axios/getLeaves";
import { useUser } from "../../services/context/UserContext";
import { useSidebarNotifications } from "../../services/context/SidebarNotificationContext";
import { usePagination } from "@/services/context/PaginationContext";
import LeavesTable from "@/components/tables/Leaves/LeavesTable";
import {
  MetricCard,
  MetricGrid,
  MetricGridSkeleton,
  PageHeaderHero,
} from "@/components/ui";
import {
  PAGE_LIMIT,
  calculateLeavePageStats,
  canViewLeaveFilters,
  formatNumber,
  getLeaveTypeLabel,
  normalizeStatus,
} from "@/lib/utils/leaves/leaveHelpers";

export default function LeavesPage() {
  const { user } = useUser();
  const { markNotificationSeen } = useSidebarNotifications() || {};
  const location = useLocation();
  const navigate = useNavigate();
  const mainScrollRef = useRef(null);
  const initializedRef = useRef(false);
  const leavesRequestRef = useRef(0);
  const [filtersReady, setFiltersReady] = useState(false);

  const [leaves, setLeaves] = useState([]);
  const [recordScope, setRecordScope] = useState("all");

  const [statusFilter, setStatusFilter] = useState("All");
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

    const requestId = leavesRequestRef.current + 1;
    leavesRequestRef.current = requestId;

    setLoading(true);

    try {
      const res = await getLeaves({
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
      });

      // Ignore stale responses from an older search/filter request.
      // This prevents a previous unfiltered request from overwriting the
      // latest filtered search results when requests finish out of order.
      if (leavesRequestRef.current !== requestId) return;

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
      if (leavesRequestRef.current !== requestId) return;

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
      if (leavesRequestRef.current === requestId) {
        setLoading(false);

        if (shouldScrollTop) {
          scrollPageToTop("auto");
        }
      }
    }
  }

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const notificationState =
      location.state?.source === "pending-leave-notification"
        ? location.state
        : null;
    const initialStatus =
      String(notificationState?.leaveStatus || "").trim() || "All";

    setFiltersReady(false);
    setSearchInput("");
    setSearch("");
    setPage(1);
    setStatusFilter(initialStatus);
    setDepartmentFilter("All");
    setAccountFilter("All");
    setAccountOptions([]);

    if (typeof setDateRange === "function") {
      setDateRange({
        dateFrom: "",
        dateTo: "",
      });
    }

    setFiltersReady(true);

    if (notificationState) {
      navigate(location.pathname, {
        replace: true,
        state: null,
      });
    }
  }, [
    location.key,
    location.pathname,
    location.state,
    navigate,
    setDateRange,
    setPage,
    setSearch,
    setSearchInput,
  ]);

  useEffect(() => {
    if (!filtersReady) return;

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
    filtersReady,
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
    return calculateLeavePageStats(paginatedLeaves);
  }, [paginatedLeaves]);

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
          <PageHeaderHero
            badgeText="Core HR View"
            badgePulse
            title={isPersonalView ? "My Leaves" : "Leaves"}
            subtitle={
              isPersonalView
                ? "View your leave requests, credits, plotted leaves, and remaining balance."
                : "Review employee leave requests, credits, plotted leaves, and remaining balances."
            }
            actions={
              <div className="flex shrink-0 items-center gap-2 2xl:gap-2.5">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isManualRefreshing || loading}
                  title="Refresh Leaves Data"
                  className="sibs-btn-icon"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                      isManualRefreshing ? "animate-spin text-sibs-orange" : ""
                    }`}
                  />
                </button>

                <span className="sibs-btn-primary pointer-events-none max-sm:flex-1">
                  <UserRound className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-white" />
                  {isPersonalView ? "Personal View" : "Administrative View"}
                </span>
              </div>
            }
          />

          {loading ? (
            <MetricGridSkeleton
              count={6}
              labels={[
                "Loaded Leaves",
                "Approved",
                "Pending",
                "Rejected",
                "Page Leave Days",
                "Page Remaining",
              ]}
              ariaLabel="Loading leaves metrics"
              className="grid grid-cols-2 gap-2.5 2xl:gap-3 md:grid-cols-3 xl:grid-cols-6"
            />
          ) : (
            <MetricGrid columns={6}>
              <MetricCard
                label="Loaded Leaves"
                value={formatNumber(pageStats.totalLeaves)}
                description="Records loaded on this page"
                icon={FileText}
                tone="navy"
                delay={0}
              />

              <MetricCard
                label="Approved"
                value={formatNumber(pageStats.approvedLeaves)}
                description="Approved leave requests"
                icon={CheckCircle2}
                tone="emerald"
                delay={60}
              />

              <MetricCard
                label="Pending"
                value={formatNumber(pageStats.pendingLeaves)}
                description="Awaiting review"
                icon={Clock}
                tone="amber"
                delay={120}
              />

              <MetricCard
                label="Rejected"
                value={formatNumber(pageStats.rejectedLeaves)}
                description="Rejected leave requests"
                icon={XCircle}
                tone="rose"
                delay={180}
              />

              <MetricCard
                label="Page Leave Days"
                value={formatNumber(pageStats.totalLeaveDays)}
                description="Leave days on this page"
                icon={CalendarDays}
                tone="orange"
                delay={240}
              />

              <MetricCard
                label="Page Remaining"
                value={formatNumber(pageStats.totalRemaining)}
                description="Remaining leave balance"
                icon={UserRound}
                tone="emerald"
                delay={300}
              />
            </MetricGrid>
          )}

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
