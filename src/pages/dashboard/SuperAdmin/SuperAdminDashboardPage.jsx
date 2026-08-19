import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../../../components/layout/Header";
import { useUser } from "../../../services/context/UserContext";
import { usePagination } from "../../../services/context/PaginationContext";
import {
  ACCESS_LEVELS,
  ACCOUNT_GROUPS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_ADMIN_USERS,
  INITIAL_EXCEPTIONS,
  SNAPSHOT_CARDS,
  SUMMARY_CARDS,
  SUPER_ADMIN_ROUTES,
  filterSuperAdminActivity,
  filterSuperAdminAdmins,
  filterSuperAdminExceptions,
  getSuperAdminPageLimit,
  getUserDisplayName,
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
  const [adminUsers, setAdminUsers] = useState(() => [
    ...INITIAL_ADMIN_USERS,
  ]);
  const [exceptions, setExceptions] = useState(() => [...INITIAL_EXCEPTIONS]);
  const [activityLogs, setActivityLogs] = useState(() => [
    ...INITIAL_ACTIVITY_LOGS,
  ]);
  const [notice, setNotice] = useState("");
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const accessLevel = filterValues?.accessLevel || "All Access Levels";
  const module = filterValues?.module || "All Modules";
  const account = filterValues?.account || "All Accounts";
  const status = filterValues?.status || "All Statuses";

  async function handleManualRefresh() {
    if (isManualRefreshing) return;
    setIsManualRefreshing(true);
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 400));
      setNotice("Super Admin dashboard data refreshed.");
    } finally {
      setIsManualRefreshing(false);
      setLoading(false);
    }
  }

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
    () => [
      "All Modules",
      ...Array.from(
        new Set([
          ...exceptions.map((item) => item.moduleTarget),
          ...activityLogs.map((item) => item.module),
        ]),
      ).sort((left, right) => left.localeCompare(right)),
    ],
    [activityLogs, exceptions],
  );

  const statusOptions = useMemo(
    () => [
      "All Statuses",
      ...Array.from(
        new Set([
          ...adminUsers.map((item) => item.status),
          ...activityLogs.map((item) => item.status),
        ]),
      ).sort((left, right) => left.localeCompare(right)),
    ],
    [activityLogs, adminUsers],
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
    setNotice(`Opening access editor for ${item.email}.`);
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

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto flex min-h-full w-full max-w-[1600px] flex-1 flex-col space-y-4 2xl:space-y-5">
          <SuperAdminDashboardHeader
            displayName={getUserDisplayName(user)}
            onAddUser={() => setIsAddAdminOpen(true)}
            onOpenEmployees={() => navigate(SUPER_ADMIN_ROUTES.employees)}
            onRefresh={handleManualRefresh}
            isManualRefreshing={isManualRefreshing}
          />

          <SuperAdminDashboardStats
            adminCount={adminUsers.length}
            onMetricClick={handleMetricClick}
          />

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
              {activeTab === "overview" ? (
                <SuperAdminOverview
                  cards={SUMMARY_CARDS}
                  exceptionsCount={exceptions.length}
                  onNavigate={navigate}
                  onOpenExceptions={() => handleTabChange("exceptions")}
                />
              ) : null}

              {activeTab === "exceptions" ? (
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

              {activeTab === "access_roles" ? (
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
                  accessOptions={["All Access Levels", ...ACCESS_LEVELS]}
                  accountOptions={["All Accounts", ...ACCOUNT_GROUPS]}
                  statusOptions={statusOptions}
                  onFilterChange={setFilter}
                />
              ) : null}

              {activeTab === "snapshot" ? (
                <SuperAdminSnapshot cards={SNAPSHOT_CARDS} onNavigate={navigate} />
              ) : null}

              {activeTab === "activity" ? (
                <SuperAdminActivity
                  items={activePagination.items}
                  totalItems={filteredLogs.length}
                  pagination={paginationProps}
                  onExport={() =>
                    setNotice("Activity log export prepared for frontend preview.")
                  }
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
