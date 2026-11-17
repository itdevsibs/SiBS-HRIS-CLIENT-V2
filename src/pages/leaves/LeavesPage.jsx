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
  AlertCircle,
  RefreshCw,
  UserRound,
} from "lucide-react";

import { getLeaves, getMyLeaveBalance } from "@/lib/axios/getLeaves";
import { normalizeVerifiedPersonalBalance } from "@/lib/utils/leaves/leaveBalanceDisplayClient";
import { useUser } from "../../services/context/UserContext";
import { useSidebarNotifications } from "../../services/context/SidebarNotificationContext";
import { usePagination } from "@/services/context/PaginationContext";
import LeavesTable from "@/components/tables/Leaves/LeavesTable";
import { PageHeaderHero } from "@/components/ui";
import {
  PAGE_LIMIT,
  canViewLeaveFilters,
  getLeaveTypeLabel,
  formatDate,
  getLeavesInitialDateRange,
  sanitizeLeavesDateRange,
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
  const [loadError, setLoadError] = useState("");

  const [leaves, setLeaves] = useState([]);
  const [recordScope, setRecordScope] = useState("all");
  const [personalBalance, setPersonalBalance] = useState(null);
  const [personalBalanceLoading, setPersonalBalanceLoading] = useState(false);
  const [personalBalanceError, setPersonalBalanceError] = useState("");
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);
  const authenticatedSibsId = String(
    user?.username || user?.sibs_id || user?.sibsId || user?.gy_user_code || "",
  ).trim();

  const [statusFilter, setStatusFilter] = useState("All");
  const [allDatesView, setAllDatesView] = useState(false);
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

  const isEmployeeAccount =
    String(user?.role || "").toLowerCase() === "employee";

  const initialLeavesDateRange = useMemo(
    () => getLeavesInitialDateRange(isEmployeeAccount),
    [isEmployeeAccount],
  );
  // A pending-leave notification represents ALL dates. Empty date values must
  // stay empty, rather than being replaced by the default seven-day range.
  const storedDateFrom = filterValues?.dateFrom ?? initialLeavesDateRange.dateFrom;
  const storedDateTo = filterValues?.dateTo ?? initialLeavesDateRange.dateTo;
  const safeDateRange = sanitizeLeavesDateRange(
    { dateFrom: storedDateFrom, dateTo: storedDateTo },
    { allowEmpty: isEmployeeAccount || allDatesView },
  );
  const dateFrom = allDatesView ? "" : safeDateRange.dateFrom;
  const dateTo = allDatesView ? "" : safeDateRange.dateTo;

  useEffect(() => {
    if (allDatesView) return;
    if (storedDateFrom !== dateFrom || storedDateTo !== dateTo) {
      setDateRange({ dateFrom, dateTo });
    }
  }, [allDatesView, storedDateFrom, storedDateTo, dateFrom, dateTo, setDateRange]);

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
    setLoadError("");

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
        // The page always supplies its explicit date bounds. Never silently
        // reintroduce a seven-day range when a user clears either date.
        useDefaultDateRange: false,
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
        setLoadError(res?.message || "Unable to load leave records. Please try again.");
      }
    } catch (err) {
      if (leavesRequestRef.current !== requestId) return;

      console.error("FETCH LEAVES ERROR:", err);

      setLoadError(err?.message || "Unable to load leave records. Please try again.");
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
    const notificationState =
      location.state?.source === "pending-leave-notification"
        ? location.state
        : null;
    if (initializedRef.current && !notificationState) return;
    initializedRef.current = true;

    const fromNotification = Boolean(notificationState?.allDates);
    setAllDatesView(fromNotification);
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
      setDateRange(fromNotification ? { dateFrom: "", dateTo: "" } : initialLeavesDateRange);
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
    initialLeavesDateRange,
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

  const isPersonalView = isEmployeeAccount || recordScope === "personal";

  useEffect(() => {
    if (!isPersonalView || !authenticatedSibsId) {
      setPersonalBalance(null);
      setPersonalBalanceError("");
      setPersonalBalanceLoading(false);
      return;
    }

    let cancelled = false;
    setPersonalBalance(null);
    setPersonalBalanceError("");
    setPersonalBalanceLoading(true);
    getMyLeaveBalance().then((result) => {
      if (cancelled) return;
      const verified = normalizeVerifiedPersonalBalance(result, authenticatedSibsId);
      setPersonalBalance(verified);
      if (!verified) {
        setPersonalBalanceError(
          result?.success === true
            ? "Kronos has not returned a verifiable balance for your account."
            : result?.message || "Kronos leave credits are currently unavailable.",
        );
      }
    }).catch(() => {
      if (!cancelled) {
        setPersonalBalance(null);
        setPersonalBalanceError("Unable to retrieve your Kronos leave balance.");
      }
    }).finally(() => {
      if (!cancelled) setPersonalBalanceLoading(false);
    });
    return () => { cancelled = true; };
  }, [isPersonalView, authenticatedSibsId, balanceRefreshKey]);

  const paginatedLeaves = useMemo(() => {
    return leaves.map((item) => {
      const rawCredit = item.leave_credit ?? item.gy_leave_avail_approved;
      const rawPlotted = item.leave_plotted ?? item.gy_leave_avail_plotted;
      const leaveCredit = rawCredit === undefined || rawCredit === null ? null : Number(rawCredit);
      const leavePlotted = rawPlotted === undefined || rawPlotted === null ? null : Number(rawPlotted);
      const leaveRemaining = item.leave_remaining != null
        ? Number(item.leave_remaining)
        : leaveCredit !== null && leavePlotted !== null
          ? leaveCredit - leavePlotted
          : null;

      const normalized = {
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
      // Historical leave rows retain their per-transaction balance.
      return normalized;
    });
  }, [leaves]);

  const handleDateFilterChange = () => {
    setAllDatesView(false);
  };

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
    setBalanceRefreshKey((value) => value + 1);
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
            kicker="Core HR View"
            title={isPersonalView ? "My Leaves" : "Leaves"}
            description={
              isPersonalView
                ? "View leave requests and current leave credits from your Kronos employee record."
                : "Review employee leave requests, credits, plotted leaves, and remaining balances."
            }
            actions={
              <div className="flex shrink-0 items-center gap-2 2xl:gap-2.5 max-sm:w-full">
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

          {loadError ? (
            <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
              <div className="flex min-w-0 items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="sibs-text-xs font-bold">{loadError}</p>
              </div>
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={loading || isManualRefreshing}
                className="shrink-0 rounded-lg border border-rose-300 bg-white px-3 py-1.5 sibs-text-xs font-extrabold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
              >
                Retry
              </button>
            </div>
          ) : null}

          <section className="flex flex-1 flex-col min-w-0">
            <LeavesTable
              leaves={paginatedLeaves}
              loading={loading}
              error={loadError}
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
              remainingLeaveCredits={personalBalance?.leave_remaining ?? null}
              remainingLeaveCreditsLoading={personalBalanceLoading}
              remainingLeaveCreditsError={personalBalanceError}
              filterValues={filterValues}
              allDatesView={allDatesView}
              onDateFilterChange={handleDateFilterChange}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
