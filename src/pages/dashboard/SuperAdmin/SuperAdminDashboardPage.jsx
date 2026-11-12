import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../../../components/layout/Header";
import { useUser } from "../../../services/context/UserContext";
import { usePagination } from "../../../services/context/PaginationContext";
import useRefetchOnFocus from "../../../hooks/useRefetchOnFocus";
import useRecentPendingLeaves from "./useRecentPendingLeaves";
import {
  getHrDashboardFeed,
  getHrDashboardOverview,
} from "../../../lib/axios/getHrDashboard";
import { getEmployee } from "../../../lib/axios/getEmployee";
import { getApprovalRequestCounts } from "../../../lib/axios/getApprovalRequest";
import {
  getActiveCandidateCountCacheKey,
  getActiveCandidatePipelineCount,
  getCachedActiveCandidatePipelineCount,
  subscribeActiveCandidatePipelineCount,
} from "../../../lib/axios/getCandidatePipeline";
import { getUserSettingsUsers } from "../../../lib/axios/userSettings";
import { normalizeDashboardOverview } from "../../../lib/utils/Dashboards/AdminDashboard/adminDashboardHelpers";
import {
  ACCESS_LEVELS,
  SUPER_ADMIN_PENDING_APPROVALS_PATH,
  getSuperAdminPendingLeavesState,
  SUPER_ADMIN_ROUTES,
  buildDynamicSnapshotCards,
  buildDynamicSummaryCards,
  deriveLiveExceptions,
  enrichActivityLogs,
  exportActivityLogsToCsv,
  filterSuperAdminActivity,
  filterSuperAdminAdmins,
  filterSuperAdminExceptions,
  getSuperAdminPageLimit,
  getUserDisplayName,
  normalizeAssignedAdminUsers,
  normalizeSuperAdminMetrics,
  normalizeSuperAdminQueueMetrics,
  paginateSuperAdminItems,
} from "../../../lib/utils/Dashboards/SuperAdminDashboard/superAdminDashboardHelpers.js";

import SuperAdminDashboardHeader from "../../../components/Dashboard/SuperAdminDashboard/SuperAdminDashboardHeader";
import SuperAdminDashboardStats from "../../../components/Dashboard/SuperAdminDashboard/SuperAdminDashboardStats";
import SuperAdminQuickActions from "../../../components/Dashboard/SuperAdminDashboard/SuperAdminQuickActions";
import SuperAdminTabs from "../../../components/Dashboard/SuperAdminDashboard/SuperAdminTabs";
import SuperAdminOverview from "../../../components/Dashboard/SuperAdminDashboard/SuperAdminOverview";
import SuperAdminExceptions from "../../../components/Dashboard/SuperAdminDashboard/SuperAdminExceptions";
import SuperAdminAccessGovernance from "../../../components/Dashboard/SuperAdminDashboard/SuperAdminAccessGovernance";
import SuperAdminSnapshot from "../../../components/Dashboard/SuperAdminDashboard/SuperAdminSnapshot";
import SuperAdminActivity from "../../../components/Dashboard/SuperAdminDashboard/SuperAdminActivity";
import SuperAdminToast from "../../../components/Dashboard/SuperAdminDashboard/SuperAdminToast";
import {
  SuperAdminDashboardStatsSkeleton,
  SuperAdminTabPanelSkeleton,
} from "../../../components/Dashboard/SuperAdminDashboard/SuperAdminDashboardSkeleton";
import StatutoryCoveragePanel from "../../../components/Dashboard/shared/StatutoryCoveragePanel";

const SUPER_ADMIN_ENTITY = "super-admin-dashboard";

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { metrics: leaveMetrics, refresh: refreshPendingLeaves } = useRecentPendingLeaves(user);
  const activeCountCacheKey = getActiveCandidateCountCacheKey(user);
  const subscribeToActiveCount = useCallback(
    (listener) => subscribeActiveCandidatePipelineCount(activeCountCacheKey, listener),
    [activeCountCacheKey],
  );
  const getActiveCountSnapshot = useCallback(
    () => getCachedActiveCandidatePipelineCount(activeCountCacheKey),
    [activeCountCacheKey],
  );
  const quickActiveCount = useSyncExternalStore(
    subscribeToActiveCount, getActiveCountSnapshot, () => null,
  );

  const {
    page,
    setPage,
    setPagination,
    setLoading,
    search,
    searchInput,
    setSearchInput,
    commitSearch,
    filterValues,
    setFilter,
  } = usePagination(SUPER_ADMIN_ENTITY);

  const [activeTab, setActiveTab] = useState("overview");
  const [adminUsers, setAdminUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [backendOverview, setBackendOverview] = useState(null);
  const [extraCounts, setExtraCounts] = useState({
    employeeTotal: null,
    departmentsTotal: null,
    approvalsTotal: null,
    approvalsLoading: true,
    recruitmentTotal: null,
  });
  const [notice, setNotice] = useState("");
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [initialSections, setInitialSections] = useState({
    metrics: true,
    admins: true,
    activity: true,
  });
  const pendingRequest = useRef(null);
  // Secondary governance and audit queries must never block the main dashboard.
  const isInitialLoading = initialSections.metrics;
  const statsLoading = initialSections.metrics;
  const activeSectionLoading = activeTab === "activity"
    ? initialSections.activity
    : activeTab === "access_roles"
      ? initialSections.admins
      : activeTab === "exceptions"
        ? initialSections.metrics
        : statsLoading;

  const accessLevel = filterValues?.accessLevel || "All Access Levels";
  const module = filterValues?.module || "All Modules";
  const account = filterValues?.account || "All Accounts";
  const status = filterValues?.status || "All Statuses";
  const fetchDashboardData = useCallback(
    function fetchDashboardData({ forceRefresh = false } = {}) {
      const pending = pendingRequest.current;
      if (pending) {
        // A manual request must still reach the server with refresh=1 after an
        // ordinary request finishes. Coalesce additional manual requests too.
        if (forceRefresh && !pending.forceRefresh) {
          pending.queuedForce ||= pending.promise.then(() =>
            fetchDashboardData({ forceRefresh: true }),
          );
          return pending.queuedForce;
        }
        return pending.promise;
      }

      const request = { forceRefresh, promise: null, queuedForce: null };
      pendingRequest.current = request;
      const finishSection = (section) => {
        setInitialSections((current) => current[section]
          ? { ...current, [section]: false }
          : current);
      };
      request.promise = (async () => {
        try {
          setLoading(true);
          const overviewPromise = getHrDashboardOverview({ forceRefresh }).then((value) => {
            if (value?.success === true) {
              const normalized = normalizeDashboardOverview(value);
              const attendance = (value.data && !value.metrics ? value.data : value).attendance;
              setBackendOverview({
                ...normalized,
                attendance: { ...normalized.attendance, present: attendance?.present ?? null },
              });
              setExtraCounts((current) => ({
                ...current,
                employeeTotal: normalized.metrics.employees,
                departmentsTotal: normalized.metrics.departments,
              }));
            } else {
              setBackendOverview(null);
              setExtraCounts((current) => ({ ...current, employeeTotal: null, departmentsTotal: null }));
            }
            return value;
          }).catch(() => {
            setBackendOverview(null);
            setExtraCounts((current) => ({ ...current, employeeTotal: null, departmentsTotal: null }));
            return null;
          });
          // The active candidate count uses the same lightweight, shared endpoint
          // as the sidebar, so activity-feed queries cannot delay the TA card.
          const countPromise = getActiveCandidatePipelineCount({
            cacheKey: activeCountCacheKey,
            forceRefresh,
          }).catch((error) => {
            // A feed count can still supply a fallback when the dedicated
            // count endpoint fails; never replace a verified count with zero.
            console.warn("Super Admin active pipeline count unavailable:", error?.message);
          });
          // Independent endpoints run concurrently, rather than in a waterfall
          // behind the (potentially slow) Kronos overview request.
          const feedPromise = getHrDashboardFeed({ forceRefresh })
            .then((value) => {
              // The overview's `interviewsToday` metric is NOT the active TA
              // pipeline. Reuse the active-candidate total already returned by
              // the feed: no extra API request or dashboard loading dependency.
              const activeCandidates = value?.notificationCounts?.activeCandidates;
              if (activeCandidates !== null && activeCandidates !== undefined && activeCandidates !== "") {
                const total = Number(activeCandidates);
                if (Number.isFinite(total) && total >= 0) {
                  setExtraCounts((current) => ({
                    ...current,
                    recruitmentTotal: total,
                  }));
                }
              }
              if (Array.isArray(value?.recentActivities) && value.recentActivities.length > 0) {
                setActivityLogs(enrichActivityLogs(value.recentActivities));
              }
            })
            .finally(() => finishSection("activity"));
          let employeePromise = null;
          const getEmployeeFallback = () => {
            employeePromise ||= getEmployee(1, "", "All", {
              includeDepartments: true,
              includeAccounts: true,
            });
            return employeePromise;
          };
          const assignedUsersPromise = getUserSettingsUsers({ limit: 100 });
          const approvalsPromise = getApprovalRequestCounts({ module: "Attrition", status: "Pending" })
            .then((result) => {
              const { approvalsTotal } = normalizeSuperAdminQueueMetrics(result);
              setExtraCounts((current) => ({ ...current, approvalsTotal, approvalsLoading: false }));
            });
          const adminsPromise = (async () => {
            const [assignedUsersData] = await Promise.allSettled([assignedUsersPromise]);
            if (
              assignedUsersData.status === "fulfilled" &&
              Array.isArray(assignedUsersData.value?.data) &&
              assignedUsersData.value.data.length > 0
            ) {
              setAdminUsers(normalizeAssignedAdminUsers(assignedUsersData.value.data));
              return;
            }

            // Only wait for employee data if assigned users cannot supply admins.
            const [employeeData] = await Promise.allSettled([getEmployeeFallback()]);
            if (
              employeeData.status === "fulfilled" &&
              Array.isArray(employeeData.value?.data) &&
              employeeData.value.data.length > 0
            ) {
              const liveAdmins = employeeData.value.data
                .filter((emp) =>
                  Number(emp.adminAccess || emp.admin_access || 0) > 0 ||
                  emp.role === "admin" || emp.role === "super_admin",
                )
                .map((emp, idx) => ({
                  id: emp.sibsId || emp.sibs_id || `ADM-${idx + 1}`,
                  name: emp.fullName || emp.name ||
                    `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "User",
                  email: emp.email || "—",
                  accessLevel: `${emp.adminAccess || emp.admin_access || 7} - ${emp.role || "Admin"}`,
                  department: emp.department || "Operations",
                  accountGroup: emp.account || "Internal HR Ops",
                  lastActive: "Today",
                  status: emp.employmentStatus || emp.status || "Active",
                }));
              if (liveAdmins.length > 0) setAdminUsers(liveAdmins);
            }
          })().finally(() => finishSection("admins"));

          const metricsPromise = overviewPromise.finally(() => finishSection("metrics"));

          await Promise.allSettled([
            metricsPromise,
            approvalsPromise,
            adminsPromise,
            feedPromise,
            countPromise,
          ]);
        } catch (err) {
          console.error("Super Admin Dashboard fetch error:", err);
        } finally {
          setLoading(false);
          // Also clear skeletons if setup itself failed before sections started.
          setInitialSections((current) => Object.values(current).some(Boolean)
            ? { metrics: false, admins: false, activity: false }
            : current);
          pendingRequest.current = null;
        }
      })();
      return request.promise;
    },
    [setLoading, activeCountCacheKey],
  );

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useRefetchOnFocus(fetchDashboardData);

  async function handleManualRefresh() {
    if (isManualRefreshing) return;
    setIsManualRefreshing(true);
    try {
      await Promise.all([
        fetchDashboardData({ forceRefresh: true }),
        refreshPendingLeaves({ forceRefresh: true }),
      ]);
      setNotice("Refresh finished. Check the cards for the latest source status.");
    } catch {
      setNotice("Failed to refresh dashboard data.");
    } finally {
      setIsManualRefreshing(false);
    }
  }

  const liveMetrics = useMemo(
    () =>
      normalizeSuperAdminMetrics(backendOverview, {
        ...extraCounts,
        ...leaveMetrics,
        recruitmentTotal: quickActiveCount ?? extraCounts.recruitmentTotal,
        adminCount: adminUsers.length,
      }),
    [backendOverview, extraCounts, leaveMetrics, adminUsers.length, quickActiveCount],
  );
  const { leavesTotal, leavesDateRange } = leaveMetrics;
  const exceptions = useMemo(
    () => deriveLiveExceptions({
      approvalsTotal: extraCounts.approvalsTotal,
      leavesTotal,
      leavesDateRange,
    }),
    [extraCounts.approvalsTotal, leavesTotal, leavesDateRange],
  );
  const queuesIncomplete = extraCounts.approvalsTotal === null || leavesTotal === null;

  const dynamicSummaryCards = useMemo(
    () => buildDynamicSummaryCards(liveMetrics),
    [liveMetrics],
  );

  useEffect(() => {
    if (!notice) return undefined;

    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredExceptions = useMemo(
    () => filterSuperAdminExceptions(exceptions, search, module),
    [exceptions, module, search],
  );

  const filteredAdmins = useMemo(
    () =>
      filterSuperAdminAdmins(
        adminUsers,
        search,
        accessLevel,
        account,
        status,
      ),
    [accessLevel, account, adminUsers, search, status],
  );

  const filteredLogs = useMemo(
    () => filterSuperAdminActivity(activityLogs, search, module, status),
    [activityLogs, module, search, status],
  );

  const activeItems = useMemo(() => {
    if (activeTab === "exceptions") return filteredExceptions;
    if (activeTab === "access_roles") return filteredAdmins;
    if (activeTab === "activity") return filteredLogs;
    return [];
  }, [activeTab, filteredAdmins, filteredExceptions, filteredLogs]);

  const activePagination = useMemo(
    () =>
      paginateSuperAdminItems(
        activeItems,
        page,
        getSuperAdminPageLimit(activeTab),
      ),
    [activeItems, activeTab, page],
  );

  useEffect(() => {
    setPagination({
      total: activePagination.totalItems,
      totalPages: activePagination.totalPages,
      currentPage: activePagination.currentPage,
      limit: activePagination.limit,
    });
  }, [activePagination, setPagination]);

  useEffect(() => {
    if (Number(page) !== activePagination.currentPage) {
      setPage(activePagination.currentPage);
    }
  }, [activePagination.currentPage, page, setPage]);

  const moduleOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...exceptions.map((item) => item.moduleTarget).filter(Boolean),
          ...activityLogs.map((item) => item.module).filter(Boolean),
        ]),
      )
        .filter((mod) => mod !== "All" && mod !== "All Modules")
        .sort((left, right) => left.localeCompare(right)),
    [activityLogs, exceptions],
  );

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...adminUsers.map((item) => item.status).filter(Boolean),
          ...activityLogs.map((item) => item.status).filter(Boolean),
        ]),
      )
        .filter((stat) => stat !== "All" && stat !== "All Statuses")
        .sort((left, right) => left.localeCompare(right)),
    [activityLogs, adminUsers],
  );

  const accountOptions = useMemo(
    () =>
      Array.from(
        new Set(
          adminUsers
            .map((item) => item.accountGroup)
            .filter(Boolean)
            .filter((acc) => acc !== "All" && acc !== "All Accounts"),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [adminUsers],
  );

  const dynamicSnapshotCards = useMemo(
    () =>
      buildDynamicSnapshotCards({
        metrics: liveMetrics,
        overview: backendOverview,
        accountCount: accountOptions.length,
        adminCount: adminUsers.length,
      }),
    [accountOptions.length, adminUsers.length, backendOverview, liveMetrics],
  );

  function handleSearchKeyDown(event) {
    if (event.key !== "Enter") return;

    event.preventDefault();
    commitSearch();
  }

  function handleTabChange(nextTab) {
    setActiveTab(nextTab);
    setPage(1);
  }

  const paginationProps = {
    currentPage: activePagination.currentPage,
    totalPages: activePagination.totalPages,
    totalItems: activePagination.totalItems,
    onPageChange: setPage,
  };

  const tabCounts = {
    exceptions: exceptions.length,
    access_roles: adminUsers.length,
    activity: activityLogs.length,
  };

  function handleMetricClick(metric) {
    if (!metric) return;
    if (metric.key === "admins") {
      handleTabChange("access_roles");
      return;
    }
    if (metric.key === "employees") {
      navigate(SUPER_ADMIN_ROUTES.employees);
      return;
    }
    if (metric.key === "approvals") {
      navigate(SUPER_ADMIN_PENDING_APPROVALS_PATH);
      return;
    }
    if (metric.key === "leaves") {
      if (leavesDateRange) {
        navigate("/leaves", { state: getSuperAdminPendingLeavesState(leavesDateRange) });
      }
      return;
    }
    if (metric.key === "recruitment") {
      navigate(SUPER_ADMIN_ROUTES.taDashboard);
    }
  }

  return (
    <div className="sibs-dashboard-shell">
      <Header />

      <main
        className="sibs-dashboard-main-wide pb-20 sm:pb-6"
        aria-busy={isInitialLoading}
      >
        <div className="mx-auto flex min-h-full w-full max-w-[1700px] flex-1 flex-col space-y-4 2xl:space-y-5">
          {isInitialLoading ? (
            <span className="sr-only" role="status" aria-live="polite">
              Loading Super Admin dashboard data.
            </span>
          ) : null}

          <SuperAdminDashboardHeader
            displayName={getUserDisplayName(user)}
            onOpenEmployees={() => navigate(SUPER_ADMIN_ROUTES.employees)}
            onRefresh={handleManualRefresh}
            isManualRefreshing={isManualRefreshing}
          />

          {statsLoading ? (
            <SuperAdminDashboardStatsSkeleton />
          ) : (
            <SuperAdminDashboardStats
              adminCount={adminUsers.length}
              liveMetrics={liveMetrics}
              onMetricClick={handleMetricClick}
            />
          )}

          <StatutoryCoveragePanel delay={240} />

          <SuperAdminQuickActions
            onNavigate={navigate}
            onTabChange={handleTabChange}
            delay={300}
          />

          <section
            className="sibs-page-card-in sibs-card relative overflow-hidden"
            style={{ animationDelay: "360ms", animationFillMode: "both" }}
          >
            <span className="sibs-top-accent" aria-hidden="true" />
            <SuperAdminTabs
              activeTab={activeTab}
              onChange={handleTabChange}
              counts={tabCounts}
            />

            <div
              key={activeTab}
              role="tabpanel"
              className="sibs-profile-tab-panel min-w-0 p-4 sm:p-5 lg:p-6"
            >
              {activeSectionLoading ? (
                <SuperAdminTabPanelSkeleton activeTab={activeTab} />
              ) : null}

              {!activeSectionLoading && activeTab === "overview" ? (
                <SuperAdminOverview
                  cards={dynamicSummaryCards}
                  exceptionsCount={exceptions.length}
                  queuesIncomplete={queuesIncomplete}
                  onNavigate={navigate}
                  onOpenExceptions={() => handleTabChange("exceptions")}
                />
              ) : null}

              {!activeSectionLoading && activeTab === "exceptions" ? (
                <SuperAdminExceptions
                  items={activePagination.items}
                  totalItems={filteredExceptions.length}
                  pagination={paginationProps}
                  onNavigate={navigate}
                  queuesIncomplete={queuesIncomplete}
                  searchInput={searchInput}
                  onSearchChange={setSearchInput}
                  onSearchKeyDown={handleSearchKeyDown}
                  module={module}
                  moduleOptions={moduleOptions}
                  onFilterChange={setFilter}
                />
              ) : null}

              {!activeSectionLoading && activeTab === "access_roles" ? (
                <SuperAdminAccessGovernance
                  admins={activePagination.items}
                  totalItems={filteredAdmins.length}
                  pagination={paginationProps}
                  searchInput={searchInput}
                  onSearchChange={setSearchInput}
                  onSearchKeyDown={handleSearchKeyDown}
                  accessLevel={accessLevel}
                  account={account}
                  status={status}
                  accessOptions={ACCESS_LEVELS}
                  accountOptions={accountOptions}
                  statusOptions={statusOptions}
                  onFilterChange={setFilter}
                />
              ) : null}

              {!activeSectionLoading && activeTab === "snapshot" ? (
                <SuperAdminSnapshot
                  cards={dynamicSnapshotCards}
                  onNavigate={navigate}
                />
              ) : null}

              {!activeSectionLoading && activeTab === "activity" ? (
                <SuperAdminActivity
                  items={activePagination.items}
                  totalItems={filteredLogs.length}
                  pagination={paginationProps}
                  onExport={() => {
                    const success = exportActivityLogsToCsv(filteredLogs);
                    if (success) {
                      setNotice(
                        `Exported ${filteredLogs.length} activity audit log records to CSV.`,
                      );
                    } else {
                      setNotice("No activity logs available to export.");
                    }
                  }}
                  searchInput={searchInput}
                  onSearchChange={setSearchInput}
                  onSearchKeyDown={handleSearchKeyDown}
                  module={module}
                  status={status}
                  moduleOptions={moduleOptions}
                  statusOptions={statusOptions}
                  onFilterChange={setFilter}
                />
              ) : null}
            </div>
          </section>
        </div>
      </main>

      <SuperAdminToast message={notice} onClose={() => setNotice("")} />
    </div>
  );
}
