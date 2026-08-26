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
  BriefcaseBusiness,
  Clock3,
  LoaderCircle,
  RefreshCw,
  Target,
  TrendingDown,
} from "lucide-react";

import Header from "../../../components/layout/Header";
import { getOmDashboardBootstrap } from "../../../lib/axios/getOmDashboard";

import OMDashboardWelcome from "../../../components/Dashboard/OMDashboard/OMDashboardWelcome";
import OMDashboardStats from "../../../components/Dashboard/OMDashboard/OMDashboardStats";
import OMWeeklyMovement from "../../../components/Dashboard/OMDashboard/OMWeeklyMovement";
import OMRequirementProgress from "../../../components/Dashboard/OMDashboard/OMRequirementProgress";
import OMRecruiterLoad from "../../../components/Dashboard/OMDashboard/OMRecruiterLoad";
import OMRoleHiringStatus from "../../../components/Dashboard/OMDashboard/OMRoleHiringStatus";
import OMRoleDetailsModal from "../../../components/Dashboard/OMDashboard/OMRoleDetailsModal";
import OMDashboardSkeleton from "../../../components/Dashboard/OMDashboard/OMDashboardSkeleton";
import OMDashboardError from "../../../components/Dashboard/OMDashboard/OMDashboardError";

import {
  cleanText,
  formatNumber,
  normalizeMetrics,
  normalizeRecruiter,
  normalizeRole,
  readCachedDashboard,
  writeCachedDashboard,
  EMPTY_METRICS,
} from "../../../lib/utils/Dashboards/OMDashboard/omDashboardHelpers.js";

const PAGE_SHELL_CLASS = "sibs-dashboard-shell";
const MAIN_SHELL_CLASS = "sibs-dashboard-main-wide";
const HIRING_PLAN_ROUTE = "/recruitment/workforce-hiring-overview";
const AUTO_REFRESH_INTERVAL_MS = 60_000;

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export default function OMDashboardPage() {
  const navigate = useNavigate();
  const cachedRef = useRef(readCachedDashboard());
  const cached = cachedRef.current;

  const [roles, setRoles] = useState(() =>
    Array.isArray(cached?.roles) ? cached.roles.map(normalizeRole) : [],
  );
  const [recruiters, setRecruiters] = useState(() =>
    Array.isArray(cached?.recruiters)
      ? cached.recruiters.map(normalizeRecruiter)
      : [],
  );
  const [metrics, setMetrics] = useState(() =>
    cached ? normalizeMetrics(cached) : EMPTY_METRICS,
  );
  const [scope, setScope] = useState(cached?.scope || {});
  const [initialLoading, setInitialLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRole, setSelectedRole] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);
  const hasDataRef = useRef(Boolean(cached));

  const loadDashboard = useCallback(async ({ forceRefresh = false, background = false } = {}) => {
    if (loadingRef.current) return false;
    loadingRef.current = true;
    const requestId = ++requestIdRef.current;
    background ? setRefreshing(true) : setInitialLoading(true);

    try {
      const payload = await getOmDashboardBootstrap({ forceRefresh });
      if (requestId !== requestIdRef.current) return false;
      setRoles(Array.isArray(payload?.roles) ? payload.roles.map(normalizeRole) : []);
      setRecruiters(Array.isArray(payload?.recruiters) ? payload.recruiters.map(normalizeRecruiter) : []);
      setMetrics(normalizeMetrics(payload));
      setScope(payload?.scope || {});
      setError("");
      writeCachedDashboard(payload);
      hasDataRef.current = true;
      return true;
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return false;
      setError(getErrorMessage(loadError, "Unable to load manager-scoped hiring data."));
      return false;
    } finally {
      if (requestId === requestIdRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadDashboard({ background: hasDataRef.current });
  }, [loadDashboard]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") {
        loadDashboard({ background: true });
      }
    };
    const interval = window.setInterval(refresh, AUTO_REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadDashboard]);

  const filteredRoles = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return roles.filter((role) => {
      const matchesStatus = statusFilter === "All" || role.status === statusFilter;
      if (!matchesStatus) return false;
      if (!keyword) return true;
      return [role.roleTitle, role.roleAccount, role.account, role.department, role.taOwner, role.status]
        .some((value) => cleanText(value).toLowerCase().includes(keyword));
    });
  }, [roles, search, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRoles = filteredRoles.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  );
  const scopeDepartments = Array.isArray(scope.departmentNames) ? scope.departmentNames : [];
  const scopeAccounts = Array.isArray(scope.accountNames) ? scope.accountNames : [];
  const departmentBadge = scopeDepartments[0] || "Assigned Scope";
  const scopeText = [scopeDepartments.join(", "), scopeAccounts.join(", ")]
    .filter(Boolean)
    .join(" · ");

  const metricCards = [
    { label: "Total Open Roles", value: formatNumber(metrics.totalOpenRoles), description: "Accessible roles needing staff", icon: BriefcaseBusiness, tone: "navy" },
    { label: "Requirement vs Filled", value: `${formatNumber(metrics.totalFilled)} / ${formatNumber(metrics.totalRequirement)}`, description: `${Math.round(metrics.filledPercentage)}% filled`, icon: Target, tone: "navy" },
    { label: "At-Risk Roles", value: formatNumber(metrics.atRiskRoles), description: "Require intervention", icon: AlertCircle, tone: "amber" },
    { label: "Delayed Roles", value: formatNumber(metrics.delayedRoles), description: "Due dates missed", icon: Clock3, tone: "red" },
    { label: "Weekly Movement", value: `+${formatNumber(metrics.weeklyHired)}`, description: "Hired this cycle", icon: Activity, tone: "indigo" },
    { label: "Drop-Offs", value: formatNumber(metrics.dropOffs), description: "Candidate attrition", icon: TrendingDown, tone: "orange" },
    { label: "Aging Roles", value: formatNumber(metrics.agingRoles), description: "15 days or older", icon: Clock3, tone: "slate" },
  ];

  const hasActiveRoleFilters = Boolean(search.trim() || (statusFilter && statusFilter !== "All"));

  const clearRoleFilters = () => {
    setSearch("");
    setStatusFilter("All");
  };

  if (initialLoading && roles.length === 0) {
    return <OMDashboardSkeleton />;
  }

  if (error && roles.length === 0) {
    return (
      <OMDashboardError
        error={error}
        onRetry={() => loadDashboard({ forceRefresh: true })}
      />
    );
  }

  return (
    <div className={PAGE_SHELL_CLASS}>
      <Header />
      <main className={MAIN_SHELL_CLASS}>
        <div className="mx-auto flex min-h-full w-full max-w-[1600px] flex-1 flex-col space-y-4 2xl:space-y-5">
          <OMDashboardWelcome
            departmentBadge={departmentBadge}
            scopeText={scopeText}
            onOpenHiringPlan={() => navigate(HIRING_PLAN_ROUTE)}
            onRefresh={() => loadDashboard({ forceRefresh: true, background: true })}
            isManualRefreshing={refreshing}
          />

          {error ? (
            <section className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
              <span>Dashboard refresh warning: {error}. The last successful values remain visible.</span>
              <button
                type="button"
                onClick={() => loadDashboard({ forceRefresh: true, background: true })}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 font-black"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </section>
          ) : null}

          {refreshing ? (
            <div className="flex justify-end gap-2 text-xs font-bold text-[#667085]">
              <LoaderCircle className="h-4 w-4 animate-spin text-[#FF5C28]" />
              Refreshing manager-scoped data...
            </div>
          ) : null}

          <OMDashboardStats metrics={metricCards} />

          <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
            <OMRequirementProgress roles={roles} delay={120} />
            <OMWeeklyMovement movement={metrics.funnel} delay={180} />
          </section>

          <section className="grid grid-cols-1 items-stretch gap-5 2xl:grid-cols-12">
            <div className="2xl:col-span-8">
              <OMRoleHiringStatus
                roles={paginatedRoles}
                totalRoles={filteredRoles.length}
                scopeText={scopeText}
                loading={initialLoading}
                searchInput={search}
                onSearchChange={setSearch}
                onSearchKeyDown={() => {}}
                status={statusFilter}
                onStatusChange={setStatusFilter}
                hasActiveFilters={hasActiveRoleFilters}
                onClearFilters={clearRoleFilters}
                onViewRole={setSelectedRole}
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
                onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                delay={240}
              />
            </div>

            <aside className="2xl:col-span-4">
              <OMRecruiterLoad recruiters={recruiters} delay={300} />
            </aside>
          </section>
        </div>
      </main>

      <OMRoleDetailsModal
        role={selectedRole}
        onClose={() => setSelectedRole(null)}
      />
    </div>
  );
}
