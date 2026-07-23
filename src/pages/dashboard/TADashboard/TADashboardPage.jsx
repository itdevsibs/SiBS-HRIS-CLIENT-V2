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
import useClientPagination from "../../../hooks/useClientPagination";
import { getTaDashboardBootstrap } from "../../../lib/axios/getTaDashboard";
import {
  RecruiterLoadPanel,
  RequirementProgressPanel,
  RoleHiringStatusPanel,
  TADashboardToast,
  TAMetricCard,
  TAWelcomeCard,
  WeeklyMovementPanel,
} from "./TADashboardComponents";
import { RoleKpiDetailsModal } from "../../../components/modals/dashboard/TADashboardModals";

const HIRING_PLAN_ROUTE = "/recruitment/workforce-hiring-overview";
const PAGE_SHELL_CLASS = "sibs-dashboard-shell";
const MAIN_SHELL_CLASS = "sibs-dashboard-main";
const AUTO_REFRESH_INTERVAL_MS = 60_000;
const TA_DASHBOARD_CACHE_KEY = "sibs.ta-dashboard.bootstrap.v2";
const TA_DASHBOARD_CACHE_TTL_MS = 10 * 60_000;

function readCachedDashboard() {
  try {
    const raw = window.sessionStorage.getItem(TA_DASHBOARD_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const cachedAt = Number(parsed?.cachedAt || 0);

    if (!cachedAt || Date.now() - cachedAt > TA_DASHBOARD_CACHE_TTL_MS) {
      window.sessionStorage.removeItem(TA_DASHBOARD_CACHE_KEY);
      return null;
    }

    return parsed?.payload && typeof parsed.payload === "object"
      ? parsed.payload
      : null;
  } catch {
    return null;
  }
}

function writeCachedDashboard(payload) {
  try {
    window.sessionStorage.setItem(
      TA_DASHBOARD_CACHE_KEY,
      JSON.stringify({ cachedAt: Date.now(), payload }),
    );
  } catch {
    // The dashboard remains functional when session storage is unavailable.
  }
}

const EMPTY_FUNNEL = {
  sourced: 0,
  screened: 0,
  interviewed: 0,
  offered: 0,
  accepted: 0,
  hired: 0,
};

const EMPTY_METRICS = {
  totalOpenRoles: 0,
  totalRequirement: 0,
  totalFilled: 0,
  filledPercentage: 0,
  atRiskRoles: 0,
  delayedRoles: 0,
  weeklyHired: 0,
  dropOffs: 0,
  recruiterLoad: 0,
  agingRoles: 0,
  funnel: EMPTY_FUNNEL,
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function safeText(value) {
  return String(value || "");
}

function normalizeRoleRow(role = {}) {
  return {
    id: role.id,
    role: safeText(role.role || role.roleTitle) || "Unassigned Role",
    roleTitle: safeText(role.roleTitle || role.role) || "Unassigned Role",
    roleAccount:
      safeText(role.roleAccount) ||
      [role.roleTitle || role.role, role.account].filter(Boolean).join(" - "),
    account: safeText(role.account),
    department: safeText(role.department || role.account) || "Unassigned",
    req: Number(role.req || 0),
    filled: Number(role.filled || 0),
    open: Number(role.open || 0),
    dueDate: role.dueDate || null,
    status: safeText(role.status) || "On Track",
    taOwner: safeText(role.taOwner) || "Unassigned",
    riskFlag: safeText(role.riskFlag) || "None",
    aging: Number(role.aging || 0),
    dropOffs: Number(role.dropOffs || 0),
    weeklyHired: Number(role.weeklyHired || 0),
    actionItem:
      safeText(role.actionItem) ||
      "Maintain current pipeline movement and recruiter follow-up.",
    movement: {
      sourced: Number(role.movement?.sourced || 0),
      screened: Number(role.movement?.screened || 0),
      interviewed: Number(role.movement?.interviewed || 0),
      offered: Number(role.movement?.offered || 0),
      accepted: Number(role.movement?.accepted || 0),
      hired: Number(role.movement?.hired || 0),
    },
  };
}

function normalizeRecruiterRow(recruiter = {}) {
  return {
    name: safeText(recruiter.name) || "Unassigned",
    activeRoles: Number(recruiter.activeRoles || 0),
    hiredCount: Number(recruiter.hiredCount || 0),
    loadStatus: safeText(recruiter.loadStatus) || "Normal",
    output: {
      sourced: Number(recruiter.output?.sourced || 0),
      interviewed: Number(recruiter.output?.interviewed || 0),
      hired: Number(recruiter.output?.hired || 0),
    },
  };
}

function normalizeMetrics(payload = {}) {
  const metrics = payload?.metrics || {};
  const funnel = metrics.funnel || payload?.funnel || {};

  return {
    totalOpenRoles: Number(metrics.totalOpenRoles || 0),
    totalRequirement: Number(metrics.totalRequirement || 0),
    totalFilled: Number(metrics.totalFilled || 0),
    filledPercentage: Number(metrics.filledPercentage || 0),
    atRiskRoles: Number(metrics.atRiskRoles || 0),
    delayedRoles: Number(metrics.delayedRoles || 0),
    weeklyHired: Number(metrics.weeklyHired || 0),
    dropOffs: Number(metrics.dropOffs || 0),
    recruiterLoad: Number(metrics.recruiterLoad || 0),
    agingRoles: Number(metrics.agingRoles || 0),
    funnel: {
      sourced: Number(funnel.sourced || 0),
      screened: Number(funnel.screened || 0),
      interviewed: Number(funnel.interviewed || 0),
      offered: Number(funnel.offered || 0),
      accepted: Number(funnel.accepted || 0),
      hired: Number(funnel.hired || 0),
    },
  };
}

function TADashboardLoadingState() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#e9eef4] px-6">
      <div
        className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-[#dfe7ef] bg-white px-8 py-10 text-center shadow-sm"
        role="status"
        aria-live="polite"
        aria-label="Loading TA dashboard"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
          <LoaderCircle
            className="h-8 w-8 animate-spin text-[#ff5c28]"
            aria-hidden="true"
          />
        </div>

        <h2 className="mt-5 text-lg font-extrabold text-[#042c51]">
          Loading TA Dashboard
        </h2>

        <p className="mt-2 text-sm font-medium leading-5 text-[#667085]">
          Loading current hiring requirements and candidate movement...
        </p>
      </div>
    </div>
  );
}

function TADashboardErrorState({ message, onRetry }) {
  return (
    <div className={PAGE_SHELL_CLASS}>
      <Header />

      <main className={MAIN_SHELL_CLASS}>
        <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-[1700px] items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white px-7 py-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-lg font-extrabold text-[#042c51]">
              Unable to load TA Dashboard
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#667085]">
              {message}
            </p>

            <button
              type="button"
              onClick={onRetry}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#042c51] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TADashboardPage() {
  const navigate = useNavigate();
  const cachedDashboardRef = useRef(readCachedDashboard());
  const cachedDashboard = cachedDashboardRef.current;

  const [rolesData, setRolesData] = useState(() =>
    Array.isArray(cachedDashboard?.roles)
      ? cachedDashboard.roles.map(normalizeRoleRow)
      : [],
  );
  const [recruiters, setRecruiters] = useState(() =>
    Array.isArray(cachedDashboard?.recruiters)
      ? cachedDashboard.recruiters.map(normalizeRecruiterRow)
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRole, setSelectedRole] = useState(null);
  const [toast, setToast] = useState(null);

  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);
  const hasLoadedDataRef = useRef(Boolean(cachedDashboard));

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

        const nextRoles = Array.isArray(payload?.roles)
          ? payload.roles.map(normalizeRoleRow)
          : [];
        const nextRecruiters = Array.isArray(payload?.recruiters)
          ? payload.recruiters.map(normalizeRecruiterRow)
          : [];

        setOverviewMetrics(normalizeMetrics(payload));
        setRolesData(nextRoles);
        setRecruiters(nextRecruiters);
        setGeneratedAt(payload?.generatedAt || null);
        setWarnings(
          Array.isArray(payload?.warnings)
            ? [...new Set(payload.warnings.filter(Boolean))]
            : [],
        );
        writeCachedDashboard(payload);
        setLoadError("");
        hasLoadedDataRef.current = true;
        return true;
      } catch (error) {
        if (requestId !== requestIdRef.current) return false;

        const message = getErrorMessage(
          error,
          "Unable to load current recruitment dashboard data.",
        );
        setLoadError(message);

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

  const summaryMetrics = useMemo(() => {
    const fallbackFunnel = rolesData.reduce(
      (totals, role) => ({
        sourced: totals.sourced + Number(role.movement?.sourced || 0),
        screened: totals.screened + Number(role.movement?.screened || 0),
        interviewed:
          totals.interviewed + Number(role.movement?.interviewed || 0),
        offered: totals.offered + Number(role.movement?.offered || 0),
        accepted: totals.accepted + Number(role.movement?.accepted || 0),
        hired: totals.hired + Number(role.movement?.hired || 0),
      }),
      { ...EMPTY_FUNNEL },
    );

    const totalRequirement = rolesData.reduce(
      (sum, role) => sum + Number(role.req || 0),
      0,
    );
    const totalFilled = rolesData.reduce(
      (sum, role) => sum + Number(role.filled || 0),
      0,
    );

    const hasBackendMetrics = Boolean(generatedAt);

    return {
      totalOpenRoles: hasBackendMetrics
        ? overviewMetrics.totalOpenRoles
        : rolesData.filter((role) => Number(role.open || 0) > 0).length,
      totalReq: hasBackendMetrics
        ? overviewMetrics.totalRequirement
        : totalRequirement,
      totalFilled: hasBackendMetrics
        ? overviewMetrics.totalFilled
        : totalFilled,
      filledPercentage: hasBackendMetrics
        ? Math.round(overviewMetrics.filledPercentage)
        : totalRequirement > 0
          ? Math.round((totalFilled / totalRequirement) * 100)
          : 0,
      atRisk: hasBackendMetrics
        ? overviewMetrics.atRiskRoles
        : rolesData.filter((role) => role.status === "At Risk").length,
      delayed: hasBackendMetrics
        ? overviewMetrics.delayedRoles
        : rolesData.filter((role) => role.status === "Delayed").length,
      weeklyHired: hasBackendMetrics
        ? overviewMetrics.weeklyHired
        : rolesData.reduce(
            (sum, role) => sum + Number(role.weeklyHired || 0),
            0,
          ),
      dropOffs: hasBackendMetrics
        ? overviewMetrics.dropOffs
        : rolesData.reduce(
            (sum, role) => sum + Number(role.dropOffs || 0),
            0,
          ),
      recruiterLoad: hasBackendMetrics
        ? overviewMetrics.recruiterLoad
        : recruiters.length,
      agingRoles: hasBackendMetrics
        ? overviewMetrics.agingRoles
        : rolesData.filter((role) => Number(role.aging || 0) >= 15).length,
      funnel: hasBackendMetrics ? overviewMetrics.funnel : fallbackFunnel,
    };
  }, [generatedAt, overviewMetrics, recruiters.length, rolesData]);

  const filteredRoles = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return rolesData.filter((role) => {
      const matchesSearch =
        !query ||
        safeText(role.role).toLowerCase().includes(query) ||
        safeText(role.roleAccount).toLowerCase().includes(query) ||
        safeText(role.account).toLowerCase().includes(query) ||
        safeText(role.taOwner).toLowerCase().includes(query) ||
        safeText(role.status).toLowerCase().includes(query) ||
        safeText(role.riskFlag).toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "All" || role.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rolesData, searchTerm, statusFilter]);

  const paginatedRoles = useClientPagination(filteredRoles, 6);

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

  if (initialLoading && rolesData.length === 0) {
    return <TADashboardLoadingState />;
  }

  if (loadError && rolesData.length === 0) {
    return (
      <TADashboardErrorState
        message={loadError}
        onRetry={() => loadDashboard({ forceRefresh: true })}
      />
    );
  }

  return (
    <div className={PAGE_SHELL_CLASS}>
      <Header />

      <main className={MAIN_SHELL_CLASS}>
        <div className="mx-auto w-full max-w-[1700px] space-y-5 sm:space-y-6">
          <TAWelcomeCard
            onOpenHiringPlan={() => navigate(HIRING_PLAN_ROUTE)}
          />

          {loadError ? (
            <section className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
              <span>
                Dashboard refresh warning: {loadError}. The last successful
                values remain visible.
              </span>
              <button
                type="button"
                onClick={() =>
                  loadDashboard({ forceRefresh: true, background: true })
                }
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-bold text-amber-900"
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
              <LoaderCircle className="h-3.5 w-3.5 animate-spin text-[#ff5c28]" />
              Refreshing live recruitment data...
            </div>
          ) : null}

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
            {metricCards.map((item, index) => (
              <TAMetricCard
                key={item.id}
                item={item}
                delay={80 + index * 55}
              />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <RequirementProgressPanel roles={rolesData} delay={210} />
            <WeeklyMovementPanel funnel={summaryMetrics.funnel} delay={260} />
          </section>

          <section className="grid grid-cols-1 items-stretch gap-5 2xl:grid-cols-12">
            <div className="flex 2xl:col-span-8">
              <RoleHiringStatusPanel
                roles={paginatedRoles.items}
                totalRoles={rolesData.length}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                onSearchChange={setSearchTerm}
                onStatusChange={setStatusFilter}
                onViewRole={setSelectedRole}
                delay={310}
                pagination={paginatedRoles.pagination}
              />
            </div>

            <aside className="flex 2xl:col-span-4">
              <RecruiterLoadPanel recruiters={recruiters} delay={360} />
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
