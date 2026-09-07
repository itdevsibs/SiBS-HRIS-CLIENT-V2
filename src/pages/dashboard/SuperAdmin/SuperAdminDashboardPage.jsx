import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../../../components/layout/Header";
import { useUser } from "../../../services/context/UserContext";
import { usePagination } from "../../../services/context/PaginationContext";
import useRefetchOnFocus from "../../../hooks/useRefetchOnFocus";
import {
  getHrDashboardFeed,
  getHrDashboardOverview,
} from "../../../lib/axios/getHrDashboard";
import { getEmployee } from "../../../lib/axios/getEmployee";
import { getApprovalRequests } from "../../../lib/axios/getApprovalRequest";
import { getLeaves } from "../../../lib/axios/getLeaves";
import { getAccountSettingsUsers } from "../../../lib/axios/accountSettings";
import { normalizeDashboardOverview } from "../../../lib/utils/Dashboards/AdminDashboard/adminDashboardHelpers";
import {
  ACCESS_LEVELS,
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
import SuperAdminAddUserModal from "../../../components/Dashboard/SuperAdminDashboard/SuperAdminAddUserModal";
import SuperAdminToast from "../../../components/Dashboard/SuperAdminDashboard/SuperAdminToast";
import {
  SuperAdminDashboardStatsSkeleton,
  SuperAdminTabPanelSkeleton,
} from "../../../components/Dashboard/SuperAdminDashboard/SuperAdminDashboardSkeleton";

const SUPER_ADMIN_ENTITY = "super-admin-dashboard";

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useUser();

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
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [backendOverview, setBackendOverview] = useState(null);
  const [extraCounts, setExtraCounts] = useState({
    employeeTotal: null,
    departmentsTotal: null,
    approvalsTotal: null,
    leavesTotal: null,
  });
  const [notice, setNotice] = useState("");
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const accessLevel = filterValues?.accessLevel || "All Access Levels";
  const module = filterValues?.module || "All Modules";
  const account = filterValues?.account || "All Accounts";
  const status = filterValues?.status || "All Statuses";

  const fetchDashboardData = useCallback(
    async ({ forceRefresh = false, completesInitialLoad = false } = {}) => {
      try {
        setLoading(true);
        const [
          overviewData,
          feedData,
          employeeData,
          assignedUsersData,
          approvalsData,
          leavesData,
        ] = await Promise.allSettled([
          getHrDashboardOverview({ forceRefresh }),
          getHrDashboardFeed({ forceRefresh }),
          getEmployee(1, "", "All", {
            includeDepartments: true,
            includeAccounts: true,
          }),
          getAccountSettingsUsers({ limit: 100 }),
          getApprovalRequests({ status: "Pending", limit: 50 }),
          getLeaves({ status: "Pending", limit: 50 }),
        ]);

        if (overviewData.status === "fulfilled" && overviewData.value) {
          const normOverview = normalizeDashboardOverview(overviewData.value);
          setBackendOverview(normOverview);
        }

        let empTotal = null;
        let deptTotal = null;
        if (employeeData.status === "fulfilled" && employeeData.value) {
          const empVal = employeeData.value;
          empTotal = empVal.pagination?.total ?? null;
          deptTotal = Array.isArray(empVal.departmentOptions)
            ? empVal.departmentOptions.length
            : null;
        }

        if (
          assignedUsersData.status === "fulfilled" &&
          Array.isArray(assignedUsersData.value?.data) &&
          assignedUsersData.value.data.length > 0
        ) {
          const liveAdmins = normalizeAssignedAdminUsers(
            assignedUsersData.value.data,
          );
          setAdminUsers(liveAdmins);
        } else if (
          employeeData.status === "fulfilled" &&
          Array.isArray(employeeData.value?.data) &&
          employeeData.value.data.length > 0
        ) {
          const liveAdmins = employeeData.value.data
            .filter(
              (emp) =>
                Number(emp.adminAccess || emp.admin_access || 0) > 0 ||
                emp.role === "admin" ||
                emp.role === "super_admin",
            )
            .map((emp, idx) => ({
              id: emp.sibsId || emp.sibs_id || `ADM-${idx + 1}`,
              name:
                emp.fullName ||
                emp.name ||
                `${emp.firstName || ""} ${emp.lastName || ""}`.trim() ||
                "Admin User",
              email: emp.email || "admin@thesiblingssolutions.com",
              accessLevel: `${emp.adminAccess || emp.admin_access || 7} - ${emp.role || "Admin"}`,
              department: emp.department || "Operations",
              accountGroup: emp.account || "Internal HR Ops",
              lastActive: "Today",
              status: emp.employmentStatus || emp.status || "Active",
            }));

          if (liveAdmins.length > 0) {
            setAdminUsers(liveAdmins);
          }
        }

        let appTotal = null;
        if (approvalsData.status === "fulfilled" && approvalsData.value) {
          appTotal =
            approvalsData.value.counts?.pending ??
            approvalsData.value.total ??
            null;
        }

        let lvsTotal = null;
        if (leavesData.status === "fulfilled" && leavesData.value) {
          lvsTotal =
            leavesData.value.pagination?.total ?? leavesData.value.total ?? null;
        }

        setExtraCounts({
          employeeTotal: empTotal,
          departmentsTotal: deptTotal,
          approvalsTotal: appTotal,
          leavesTotal: lvsTotal,
        });

        const liveExceptions = deriveLiveExceptions({
          employeeData:
            employeeData.status === "fulfilled" ? employeeData.value : null,
          approvalsData:
            approvalsData.status === "fulfilled" ? approvalsData.value : null,
          leavesData:
            leavesData.status === "fulfilled" ? leavesData.value : null,
          overviewData:
            overviewData.status === "fulfilled" ? overviewData.value : null,
        });
        setExceptions(liveExceptions);

        if (
          feedData.status === "fulfilled" &&
          Array.isArray(feedData.value?.recentActivities) &&
          feedData.value.recentActivities.length > 0
        ) {
          const mappedLogs = enrichActivityLogs(feedData.value.recentActivities);
          setActivityLogs(mappedLogs);
        }
      } catch (err) {
        console.error("Super Admin Dashboard fetch error:", err);
      } finally {
        setLoading(false);
        if (completesInitialLoad) {
          setIsInitialLoading(false);
        }
      }
    },
    [setLoading],
  );

  useEffect(() => {
    fetchDashboardData({ completesInitialLoad: true });
  }, [fetchDashboardData]);

  useRefetchOnFocus(fetchDashboardData);

  async function handleManualRefresh() {
    if (isManualRefreshing) return;
    setIsManualRefreshing(true);
    try {
      await fetchDashboardData({ forceRefresh: true });
      setNotice("Super Admin dashboard data refreshed from server.");
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
        adminCount: adminUsers.length,
      }),
    [backendOverview, extraCounts, adminUsers.length],
  );

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
    setLoading(false);
  }, [activePagination, setLoading, setPagination]);

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

  function addAdmin(newAdmin) {
    setAdminUsers((current) => [newAdmin, ...current]);
    setActivityLogs((current) => [
      {
        id: `LOG-${String(Date.now()).slice(-6)}`,
        timestamp: new Date().toLocaleString("en-PH"),
        actor: user?.email || "Super Admin",
        accessLevel: "7 - Super Admin",
        module: "Access Governance",
        action: "CREATED_ADMIN_USER",
        details: `Created ${newAdmin.accessLevel} access for ${newAdmin.email}.`,
        status: "Success",
      },
      ...current,
    ]);
    setIsAddAdminOpen(false);
    setNotice(`Added administrator account for ${newAdmin.email}.`);
    setActiveTab("access_roles");
    setPage(1);
  }

  function resolveException(id) {
    const target = exceptions.find((item) => item.id === id);
    setExceptions((current) => current.filter((item) => item.id !== id));
    setNotice(`Resolved exception: ${target?.title || id}.`);
  }

  function handleEditAccess(item) {
    setNotice(`Navigating to access editor for ${item.name || item.email}...`);
    navigate(SUPER_ADMIN_ROUTES.accessSettings);
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
    if (metric.key === "attendance") {
      navigate("/attendance");
      return;
    }
    if (metric.key === "approvals") {
      navigate(SUPER_ADMIN_ROUTES.approvals);
      return;
    }
    if (metric.key === "leaves") {
      navigate("/leaves");
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
        className="sibs-dashboard-main-wide"
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
            onAddUser={() => setIsAddAdminOpen(true)}
            onOpenEmployees={() => navigate(SUPER_ADMIN_ROUTES.employees)}
            onRefresh={handleManualRefresh}
            isManualRefreshing={isManualRefreshing}
          />

          {isInitialLoading ? (
            <SuperAdminDashboardStatsSkeleton />
          ) : (
            <SuperAdminDashboardStats
              adminCount={adminUsers.length}
              liveMetrics={liveMetrics}
              onMetricClick={handleMetricClick}
            />
          )}

          <SuperAdminQuickActions
            onNavigate={navigate}
            onAddUser={() => setIsAddAdminOpen(true)}
            onTabChange={handleTabChange}
          />

          <section className="sibs-page-card-in sibs-card overflow-hidden">
            <SuperAdminTabs
              activeTab={activeTab}
              onChange={handleTabChange}
              counts={tabCounts}
            />

            <div
              key={activeTab}
              role="tabpanel"
              className="sibs-page-card-in min-w-0 p-4 sm:p-5 lg:p-6"
            >
              {isInitialLoading ? (
                <SuperAdminTabPanelSkeleton activeTab={activeTab} />
              ) : null}

              {!isInitialLoading && activeTab === "overview" ? (
                <SuperAdminOverview
                  cards={dynamicSummaryCards}
                  exceptionsCount={exceptions.length}
                  onNavigate={navigate}
                  onOpenExceptions={() => handleTabChange("exceptions")}
                />
              ) : null}

              {!isInitialLoading && activeTab === "exceptions" ? (
                <SuperAdminExceptions
                  items={activePagination.items}
                  totalItems={filteredExceptions.length}
                  pagination={paginationProps}
                  onNavigate={navigate}
                  onResolve={resolveException}
                  searchInput={searchInput}
                  onSearchChange={setSearchInput}
                  onSearchKeyDown={handleSearchKeyDown}
                  module={module}
                  moduleOptions={moduleOptions}
                  onFilterChange={setFilter}
                />
              ) : null}

              {!isInitialLoading && activeTab === "access_roles" ? (
                <SuperAdminAccessGovernance
                  admins={activePagination.items}
                  totalItems={filteredAdmins.length}
                  pagination={paginationProps}
                  onAddUser={() => setIsAddAdminOpen(true)}
                  onEditAccess={handleEditAccess}
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

              {!isInitialLoading && activeTab === "snapshot" ? (
                <SuperAdminSnapshot
                  cards={dynamicSnapshotCards}
                  onNavigate={navigate}
                />
              ) : null}

              {!isInitialLoading && activeTab === "activity" ? (
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

      <SuperAdminAddUserModal
        open={isAddAdminOpen}
        onClose={() => setIsAddAdminOpen(false)}
        onSave={addAdmin}
      />

      <SuperAdminToast message={notice} onClose={() => setNotice("")} />
    </div>
  );
}
