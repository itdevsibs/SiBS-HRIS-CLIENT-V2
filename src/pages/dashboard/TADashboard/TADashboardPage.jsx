import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  Briefcase,
  Clock,
  LoaderCircle,
  RefreshCw,
  Target,
  TrendingDown,
  UsersRound,
} from "lucide-react";

import Header from "../../../components/layout/Header";
import { getTaDashboardBootstrap } from "../../../lib/axios/getTaDashboard";
import { usePagination } from "../../../services/context/PaginationContext";
import { RoleKpiDetailsModal } from "../../../components/modals/dashboard/TADashboardModals";
import {
  EMPTY_METRICS,
  buildSummaryMetrics,
  cleanText,
  formatNumber,
  getErrorMessage,
  normalizeMetrics,
  normalizeRecruiter,
  normalizeRole,
  readCachedDashboard,
  writeCachedDashboard,
} from "../../../lib/utils/Dashboards/TADashboard/taDashboardHelpers.js";
import TADashboardWelcome from "../../../components/Dashboard/TADashboard/TADashboardWelcome";
import TADashboardStats from "../../../components/Dashboard/TADashboard/TADashboardStats";
import TARequirementProgress from "../../../components/Dashboard/TADashboard/TARequirementProgress";
import TAWeeklyMovement from "../../../components/Dashboard/TADashboard/TAWeeklyMovement";
import TARoleHiringStatus from "../../../components/Dashboard/TADashboard/TARoleHiringStatus";
import TARecruiterLoad from "../../../components/Dashboard/TADashboard/TARecruiterLoad";
import TADashboardSkeleton from "../../../components/Dashboard/TADashboard/TADashboardSkeleton";
import TADashboardError from "../../../components/Dashboard/TADashboard/TADashboardError";
import TADashboardToast from "../../../components/Dashboard/TADashboard/TADashboardToast";

const TA_ROLES_ENTITY = "ta-dashboard-roles";
const HIRING_PLAN_ROUTE = "/recruitment/workforce-hiring-overview";
const AUTO_REFRESH_INTERVAL_MS = 60_000;
const ROLE_PAGE_SIZE = 6;
const TA_DASHBOARD_CACHE_KEY = "sibs.ta-dashboard.bootstrap.v2";
const TA_DASHBOARD_CACHE_TTL_MS = 10 * 60_000;

export default function TADashboardPage() {
  const navigate = useNavigate();
  const cachedDashboardRef = useRef(
    readCachedDashboard(
      TA_DASHBOARD_CACHE_KEY,
      TA_DASHBOARD_CACHE_TTL_MS,
    ),
  );
  const cachedDashboard = cachedDashboardRef.current;

  const [rolesData, setRolesData] = useState(() =>
    Array.isArray(cachedDashboard?.roles)
      ? cachedDashboard.roles.map(normalizeRole)
      : [],
  );
  const [recruiters, setRecruiters] = useState(() =>
    Array.isArray(cachedDashboard?.recruiters)
      ? cachedDashboard.recruiters.map(normalizeRecruiter)
      : [],
  );
  const [overviewMetrics, setOverviewMetrics] = useState(() =>
    cachedDashboard ? normalizeMetrics(cachedDashboard) : EMPTY_METRICS,
  );
  const [generatedAt, setGeneratedAt] = useState(
    cachedDashboard?.generatedAt || null,
  );
  const [warnings, setWarnings] = useState(() =>
    Array.isArray(cachedDashboard?.warnings)
      ? cachedDashboard.warnings.filter(Boolean)
      : [],
  );
  const [initialLoading, setInitialLoading] = useState(!cachedDashboard);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [toast, setToast] = useState(null);

  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);
  const hasLoadedDataRef = useRef(Boolean(cachedDashboard));

  const {
    page,
    setPage,
    setPagination,
    search,
    searchInput,
    setSearchInput,
    handleSearchKeyDown,
    filterValues,
    setFilter,
    resetFilters,
    resetPagination,
  } = usePagination(TA_ROLES_ENTITY);

  const statusFilter = filterValues?.status || "All";

  const loadDashboard = useCallback(
    async ({ forceRefresh = false, background = false } = {}) => {
      if (loadingRef.current) return false;

      loadingRef.current = true;
      const requestId = ++requestIdRef.current;

      if (background) {
        setRefreshing(true);
      } else {
        setInitialLoading(true);
      }

      try {
        const payload = await getTaDashboardBootstrap({ forceRefresh });

        if (requestId !== requestIdRef.current) return false;

        setRolesData(
          Array.isArray(payload?.roles)
            ? payload.roles.map(normalizeRole)
            : [],
        );
        setRecruiters(
          Array.isArray(payload?.recruiters)
            ? payload.recruiters.map(normalizeRecruiter)
            : [],
        );
        setOverviewMetrics(normalizeMetrics(payload));
        setGeneratedAt(payload?.generatedAt || null);
        setWarnings(
          Array.isArray(payload?.warnings)
            ? [...new Set(payload.warnings.filter(Boolean))]
            : [],
        );
        writeCachedDashboard(TA_DASHBOARD_CACHE_KEY, payload);
        setLoadError("");
        hasLoadedDataRef.current = true;
        return true;
      } catch (error) {
        if (requestId !== requestIdRef.current) return false;

        setLoadError(
          getErrorMessage(
            error,
            "Unable to load current recruitment dashboard data.",
          ),
        );

        if (background && hasLoadedDataRef.current) {
          setToast({
            title: "Refresh Failed",
            message: "The last successful TA dashboard values remain visible.",
          });
        }

        return false;
      } finally {
        if (requestId === requestIdRef.current) {
          setInitialLoading(false);
          setRefreshing(false);
        }
        loadingRef.current = false;
      }
    },
    [],
  );

  useEffect(() => {
    loadDashboard({ background: hasLoadedDataRef.current });
  }, [loadDashboard]);

  useEffect(() => {
    const refreshVisibleDashboard = () => {
      if (document.visibilityState !== "visible") return;
      loadDashboard({ background: true });
    };

    const interval = window.setInterval(
      refreshVisibleDashboard,
      AUTO_REFRESH_INTERVAL_MS,
    );

    document.addEventListener("visibilitychange", refreshVisibleDashboard);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener(
        "visibilitychange",
        refreshVisibleDashboard,
      );
    };
  }, [loadDashboard]);

  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    return () => {
      resetPagination();
    };
  }, [resetPagination]);

  const summaryMetrics = useMemo(
    () =>
      buildSummaryMetrics({
        roles: rolesData,
        recruiters,
        overviewMetrics,
        generatedAt,
      }),
    [generatedAt, overviewMetrics, recruiters, rolesData],
  );

  const filteredRoles = useMemo(() => {
    const keyword = String(search || "").trim().toLowerCase();

    return rolesData.filter((role) => {
      const matchesStatus =
        statusFilter === "All" || role.status === statusFilter;

      if (!matchesStatus) return false;
      if (!keyword) return true;

      return [
        role.role,
        role.roleTitle,
        role.roleAccount,
        role.account,
        role.department,
        role.taOwner,
        role.status,
        role.riskFlag,
      ].some((value) => cleanText(value).toLowerCase().includes(keyword));
    });
  }, [rolesData, search, statusFilter]);

  const totalPages = Math.max(
    Math.ceil(filteredRoles.length / ROLE_PAGE_SIZE),
    1,
  );
  const safeCurrentPage = Math.min(
    Math.max(Number(page) || 1, 1),
    totalPages,
  );

  const paginatedRoles = useMemo(() => {
    const start = (safeCurrentPage - 1) * ROLE_PAGE_SIZE;
    return filteredRoles.slice(start, start + ROLE_PAGE_SIZE);
  }, [filteredRoles, safeCurrentPage]);

  useEffect(() => {
    setPagination({
      total: filteredRoles.length,
      totalPages,
      currentPage: safeCurrentPage,
      limit: ROLE_PAGE_SIZE,
    });
  }, [
    filteredRoles.length,
    safeCurrentPage,
    setPagination,
    totalPages,
  ]);

  useEffect(() => {
    if (Number(page) !== safeCurrentPage) {
      setPage(safeCurrentPage);
    }
  }, [page, safeCurrentPage, setPage]);

  const metricCards = [
    {
      id: "total-open",
      label: "Total Open Roles",
      value: formatNumber(summaryMetrics.totalOpenRoles),
      description: "Roles with remaining open slots",
      icon: Briefcase,
      tone: "navy",
    },
    {
      id: "requirement-filled",
      label: "Requirement vs Filled",
      value: `${formatNumber(summaryMetrics.totalFilled)} / ${formatNumber(
        summaryMetrics.totalReq,
      )}`,
      description: `${summaryMetrics.filledPercentage}% filled`,
      icon: Target,
      tone: "navy",
    },
    {
      id: "at-risk",
      label: "At-Risk Roles",
      value: formatNumber(summaryMetrics.atRisk),
      description: "Roles that may miss due date",
      icon: AlertCircle,
      tone: "amber",
    },
    {
      id: "delayed",
      label: "Delayed Roles",
      value: formatNumber(summaryMetrics.delayed),
      description: "Roles already behind plan",
      icon: Clock,
      tone: "rose",
    },
    {
      id: "weekly-movement",
      label: "Weekly Movement",
      value: `+${formatNumber(summaryMetrics.weeklyHired)}`,
      description: "Total hired this week",
      icon: Activity,
      tone: "indigo",
    },
    {
      id: "drop-offs",
      label: "Drop-Offs",
      value: formatNumber(summaryMetrics.dropOffs),
      description: "Candidate exits across stages",
      icon: TrendingDown,
      tone: "orange",
    },
    {
      id: "recruiter-load",
      label: "Recruiter Load",
      value: formatNumber(summaryMetrics.recruiterLoad),
      description: "Active TA owners",
      icon: UsersRound,
      tone: "navy",
    },
    {
      id: "aging-roles",
      label: "Aging Roles",
      value: formatNumber(summaryMetrics.agingRoles),
      description: "Roles aging 15+ days",
      icon: Clock,
      tone: "slate",
    },
  ];

  const hasActiveRoleFilters =
    Boolean(String(searchInput || "").trim()) || statusFilter !== "All";

  function clearRoleFilters() {
    setSearchInput("");
    resetFilters();
    setFilter("status", "All");
  }

  if (initialLoading && rolesData.length === 0) {
    return <TADashboardSkeleton />;
  }

  if (loadError && rolesData.length === 0) {
    return (
      <div className="sibs-dashboard-shell">
        <Header />
        <main className="sibs-dashboard-main flex min-h-[calc(100vh-9rem)] items-center justify-center">
          <TADashboardError
            message={loadError}
            onRetry={() => loadDashboard({ forceRefresh: true })}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="sibs-dashboard-shell">
      <Header />

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto flex min-h-full w-full max-w-[1600px] flex-1 flex-col space-y-4 2xl:space-y-5">
          <TADashboardWelcome
            onOpenHiringPlan={() => navigate(HIRING_PLAN_ROUTE)}
          />

          {loadError ? (
            <section className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Dashboard refresh warning: {loadError}. The last successful
                values remain visible.
              </span>
              <button
                type="button"
                onClick={() =>
                  loadDashboard({ forceRefresh: true, background: true })
                }
                className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 font-extrabold text-amber-900"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            </section>
          ) : null}

          {!loadError && warnings.length > 0 ? (
            <section className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-900">
              {warnings[0]}
            </section>
          ) : null}

          {refreshing ? (
            <div className="flex items-center justify-end gap-2 text-xs font-bold text-[#667085]">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin text-[#FF5C28]" />
              Refreshing live recruitment data...
            </div>
          ) : null}

          <TADashboardStats metrics={metricCards} />

          <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
            <TARequirementProgress roles={rolesData} delay={120} />
            <TAWeeklyMovement funnel={summaryMetrics.funnel} delay={180} />
          </section>

          <section className="grid grid-cols-1 items-stretch gap-5 2xl:grid-cols-12">
            <div className="2xl:col-span-8">
              <TARoleHiringStatus
                roles={paginatedRoles}
                totalRoles={filteredRoles.length}
                searchInput={searchInput}
                onSearchChange={setSearchInput}
                onSearchKeyDown={handleSearchKeyDown}
                status={statusFilter}
                onStatusChange={(value) => setFilter("status", value)}
                hasActiveFilters={hasActiveRoleFilters}
                onClearFilters={clearRoleFilters}
                onViewRole={setSelectedRole}
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                onPrevious={() =>
                  setPage(Math.max(safeCurrentPage - 1, 1))
                }
                onNext={() =>
                  setPage(Math.min(safeCurrentPage + 1, totalPages))
                }
                delay={240}
              />
            </div>

            <aside className="2xl:col-span-4">
              <TARecruiterLoad recruiters={recruiters} delay={300} />
            </aside>
          </section>
        </div>
      </main>

      <RoleKpiDetailsModal
        open={Boolean(selectedRole)}
        role={selectedRole}
        onClose={() => setSelectedRole(null)}
        onToast={setToast}
      />

      <TADashboardToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
