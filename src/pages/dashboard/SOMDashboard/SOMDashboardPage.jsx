import { formatHrisDateLocalized } from "@/lib/axios/dateFormatter";
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
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  RefreshCw,
  Target,
  TrendingDown,
  Users,
} from "lucide-react";

import Header from "../../../components/layout/Header";
import RoleDashboardSkeleton from "../../../components/Dashboard/shared/RoleDashboardSkeleton";
import { PageHeaderHero } from "../../../components/ui";
import { getSomDashboardBootstrap } from "../../../lib/axios/getSomDashboard";

const PAGE_SHELL_CLASS = "sibs-dashboard-shell";
const MAIN_SHELL_CLASS = "sibs-dashboard-main-wide";
const AUTO_REFRESH_INTERVAL_MS = 60_000;
const CACHE_KEY = "sibs.som-dashboard.bootstrap.v1";
const CACHE_TTL_MS = 10 * 60_000;
const HIRING_OVERVIEW_ROUTE = "/recruitment/workforce-hiring-overview";
const HIRING_NEEDS_ROUTE = "/recruitment/hiring-needs";
const WEEKLY_REPORTS_ROUTE = "/recruitment/weekly-reports";

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

function cleanText(value) {
  return String(value ?? "").trim();
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return formatHrisDateLocalized(date, "en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

function normalizeRole(role = {}) {
  return {
    id: role.id ?? `${role.roleTitle || role.role}-${role.account || ""}`,
    roleTitle: cleanText(role.roleTitle || role.role) || "Unassigned Role",
    department: cleanText(role.department) || "Unassigned",
    account: cleanText(role.account) || "Unassigned",
    req: Number(role.req || 0),
    filled: Number(role.filled || 0),
    open: Number(role.open || 0),
    dueDate: role.dueDate || null,
    status: cleanText(role.status) || "On Track",
    taOwner: cleanText(role.taOwner) || "Unassigned",
    aging: Number(role.aging || 0),
    weeklyHired: Number(role.weeklyHired || 0),
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

function normalizeRecruiter(row = {}) {
  return {
    name: cleanText(row.name) || "Unassigned",
    activeRoles: Number(row.activeRoles || 0),
    hiredCount: Number(row.hiredCount || 0),
    loadStatus: cleanText(row.loadStatus) || "Normal",
    output: {
      sourced: Number(row.output?.sourced || 0),
      interviewed: Number(row.output?.interviewed || 0),
      hired: Number(row.output?.hired || 0),
    },
  };
}

function normalizeMetrics(payload = {}) {
  const metrics = payload?.metrics || {};
  const funnel = metrics.funnel || payload?.funnel || {};

  return {
    ...EMPTY_METRICS,
    ...metrics,
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

function readCachedDashboard() {
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.cachedAt || Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      window.sessionStorage.removeItem(CACHE_KEY);
      return null;
    }

    return parsed.payload && typeof parsed.payload === "object"
      ? parsed.payload
      : null;
  } catch {
    return null;
  }
}

function writeCachedDashboard(payload) {
  try {
    window.sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ cachedAt: Date.now(), payload }),
    );
  } catch {
    // Session storage is optional.
  }
}

function SomDashboardErrorState({ message, onRetry }) {
  return (
    <div className={PAGE_SHELL_CLASS}>
      <Header />
      <main
        className={`${MAIN_SHELL_CLASS} flex min-h-[calc(100vh-76px)] items-center justify-center bg-sibs-surface px-6 py-10`}
      >
        <div className="w-full max-w-md rounded-[14px] border border-rose-200 bg-white px-7 py-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[10px] bg-rose-50 text-rose-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-extrabold text-sibs-navy">
            Unable to load SOM Dashboard
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-sibs-muted">
            {message}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex items-center gap-2 rounded-[10px] bg-sibs-navy px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sibs-tertiary-3"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon,
  tone = "navy",
  onClick,
  actionLabel = "Open related records",
}) {
  const Icon = icon;
  const tones = {
    navy: {
      label: "text-sibs-navy",
      value: "text-sibs-navy",
      icon: "bg-sibs-cream-light text-sibs-navy",
    },
    amber: {
      label: "text-amber-800",
      value: "text-amber-600",
      icon: "bg-amber-50 text-amber-600",
    },
    red: {
      label: "text-rose-800",
      value: "text-rose-600",
      icon: "bg-rose-50 text-rose-600",
    },
    indigo: {
      label: "text-indigo-800",
      value: "text-indigo-600",
      icon: "bg-indigo-50 text-indigo-600",
    },
    orange: {
      label: "text-sibs-orange",
      value: "text-sibs-orange",
      icon: "bg-orange-50 text-sibs-orange",
    },
    slate: {
      label: "text-slate-700",
      value: "text-slate-700",
      icon: "bg-slate-100 text-slate-700",
    },
  };

  const classes = tones[tone] || tones.navy;

  return (
    <button
      type="button"
      onClick={onClick}
      className="sibs-metric-card group flex min-h-[112px] w-full flex-col justify-between overflow-hidden p-3.5 text-left transition hover:-translate-y-0.5 hover:border-sibs-orange/35 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sibs-orange/20"
      title={actionLabel}
      aria-label={`${label}: ${actionLabel}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`text-[10px] font-extrabold uppercase tracking-normal ${classes.label}`}>
          {label}
        </span>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition group-hover:scale-105 ${classes.icon}`}>
          <Icon size={17} strokeWidth={2} />
        </span>
      </div>
      <div className="mt-2">
        <p className={`text-3xl font-extrabold leading-none tabular-nums tracking-tight ${classes.value}`}>
          {value}
        </p>
        <div className="mt-1.5 flex items-end justify-between gap-2">
          <p className="text-xs font-bold leading-4 text-sibs-muted">
            {description}
          </p>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-sibs-faint transition group-hover:translate-x-0.5 group-hover:text-sibs-orange" />
        </div>
      </div>
    </button>
  );
}

function StatusBadge({ status }) {
  const classes =
    status === "Delayed"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : status === "At Risk"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <span className={`inline-flex whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-extrabold uppercase ${classes}`}>
      {status}
    </span>
  );
}

export default function SOMDashboardPage() {
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

  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);
  const hasDataRef = useRef(Boolean(cached));

  const loadDashboard = useCallback(
    async ({ forceRefresh = false, background = false } = {}) => {
      if (loadingRef.current) return false;

      loadingRef.current = true;
      const requestId = ++requestIdRef.current;
      background ? setRefreshing(true) : setInitialLoading(true);

      try {
        const payload = await getSomDashboardBootstrap({ forceRefresh });
        if (requestId !== requestIdRef.current) return false;

        setRoles(
          Array.isArray(payload?.roles)
            ? payload.roles.map(normalizeRole)
            : [],
        );
        setRecruiters(
          Array.isArray(payload?.recruiters)
            ? payload.recruiters.map(normalizeRecruiter)
            : [],
        );
        setMetrics(normalizeMetrics(payload));
        setScope(payload?.scope || {});
        setError("");
        writeCachedDashboard(payload);
        hasDataRef.current = true;
        return true;
      } catch (loadError) {
        if (requestId !== requestIdRef.current) return false;
        setError(
          getErrorMessage(
            loadError,
            "Unable to load Senior Operations Manager dashboard data.",
          ),
        );
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

  const topRoles = useMemo(
    () =>
      [...roles]
        .sort((a, b) => {
          if (b.open !== a.open) return b.open - a.open;
          if (b.aging !== a.aging) return b.aging - a.aging;
          return a.roleTitle.localeCompare(b.roleTitle);
        })
        .slice(0, 10),
    [roles],
  );

  const requirementRoles = useMemo(
    () =>
      [...roles]
        .filter((role) => role.req > 0)
        .sort((a, b) => b.req - a.req)
        .slice(0, 6),
    [roles],
  );

  const topRecruiters = useMemo(
    () => recruiters.slice(0, 6),
    [recruiters],
  );

  const scopeDepartments = Array.isArray(scope?.departmentNames)
    ? scope.departmentNames
    : [];
  const scopeAccounts = Array.isArray(scope?.accountNames)
    ? scope.accountNames
    : [];
  const scopeText = [scopeDepartments.join(", "), scopeAccounts.join(", ")]
    .filter(Boolean)
    .join(" · ");

  const dashboardHero = (
    <PageHeaderHero
      kicker="Senior Operations Manager View"
      title="Senior Operations Dashboard"
      description={`Senior operations workforce and hiring visibility across your assigned departments and accounts${
        scopeText ? `: ${scopeText}.` : "."
      }`}
      actions={
        <div className="flex shrink-0 items-center gap-2 2xl:gap-2.5 max-sm:w-full">
          <button
            type="button"
            onClick={() => loadDashboard({ forceRefresh: true, background: true })}
            disabled={initialLoading || refreshing}
            className="sibs-btn-icon"
            title="Refresh SOM dashboard"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                refreshing ? "animate-spin text-sibs-orange" : ""
              }`}
            />
          </button>
          <button
            type="button"
            onClick={() => navigate(HIRING_OVERVIEW_ROUTE)}
            className="sibs-btn-primary max-sm:flex-1"
          >
            Workforce & Hiring
            <ArrowRight className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" />
          </button>
        </div>
      }
    />
  );

  if (initialLoading && roles.length === 0) {
    return <RoleDashboardSkeleton kind="som" hero={dashboardHero} />;
  }

  if (error && roles.length === 0) {
    return (
      <SomDashboardErrorState
        message={error}
        onRetry={() => loadDashboard({ forceRefresh: true })}
      />
    );
  }

  const metricCards = [
    {
      label: "Open Hiring Roles",
      value: formatNumber(metrics.totalOpenRoles),
      description: "Assigned-scope roles needing staff",
      icon: BriefcaseBusiness,
      tone: "navy",
      path: HIRING_OVERVIEW_ROUTE,
      actionLabel: "Open Workforce & Hiring Overview",
    },
    {
      label: "Requirement vs Filled",
      value: `${formatNumber(metrics.totalFilled)} / ${formatNumber(metrics.totalRequirement)}`,
      description: `${Math.round(metrics.filledPercentage)}% filled`,
      icon: Target,
      tone: "navy",
      path: HIRING_OVERVIEW_ROUTE,
      actionLabel: "Review requirement versus filled details",
    },
    {
      label: "At-Risk Roles",
      value: formatNumber(metrics.atRiskRoles),
      description: "Require senior operations attention",
      icon: AlertCircle,
      tone: "amber",
      path: HIRING_OVERVIEW_ROUTE,
      actionLabel: "Review at-risk hiring roles",
    },
    {
      label: "Delayed Roles",
      value: formatNumber(metrics.delayedRoles),
      description: "Due dates already missed",
      icon: Clock3,
      tone: "red",
      path: HIRING_OVERVIEW_ROUTE,
      actionLabel: "Review delayed hiring roles",
    },
    {
      label: "Weekly Hires",
      value: `+${formatNumber(metrics.weeklyHired)}`,
      description: "Hired in the current cycle",
      icon: Activity,
      tone: "indigo",
      path: WEEKLY_REPORTS_ROUTE,
      actionLabel: "Open Weekly Reports",
    },
    {
      label: "Drop-Offs",
      value: formatNumber(metrics.dropOffs),
      description: "Candidate attrition",
      icon: TrendingDown,
      tone: "orange",
      path: WEEKLY_REPORTS_ROUTE,
      actionLabel: "Review weekly candidate drop-offs",
    },
    {
      label: "Aging Roles",
      value: formatNumber(metrics.agingRoles),
      description: "15 days or older",
      icon: Clock3,
      tone: "slate",
      path: HIRING_OVERVIEW_ROUTE,
      actionLabel: "Review aging hiring roles",
    },
  ];

  const quickLinks = [
    {
      label: "Employee Directory",
      description: "Employee records within your accessible scope",
      path: "/employee",
      icon: Users,
    },
    {
      label: "Time & Attendance",
      description: "Attendance and work-hour monitoring",
      path: "/attendance",
      icon: Clock3,
    },
    {
      label: "Leaves",
      description: "Leave records within your accessible scope",
      path: "/leaves",
      icon: CalendarDays,
    },
    {
      label: "Departments",
      description: "View departments, accounts, and LOBs",
      path: "/departments",
      icon: Building2,
    },
    {
      label: "Workforce & Hiring",
      description: "Headcount and hiring within your accessible scope",
      path: HIRING_OVERVIEW_ROUTE,
      icon: Target,
    },
  ];

  const funnelStages = [
    ["Sourced", metrics.funnel.sourced, "border-blue-200 bg-blue-50 text-blue-700"],
    ["Screened", metrics.funnel.screened, "border-cyan-200 bg-cyan-50 text-cyan-700"],
    ["Interviewed", metrics.funnel.interviewed, "border-amber-200 bg-amber-50 text-amber-700"],
    ["Offered", metrics.funnel.offered, "border-orange-200 bg-orange-50 text-orange-700"],
    ["Accepted", metrics.funnel.accepted, "border-indigo-200 bg-indigo-50 text-indigo-700"],
    ["Hired", metrics.funnel.hired, "border-emerald-200 bg-emerald-50 text-emerald-700"],
  ];

  return (
    <div className={PAGE_SHELL_CLASS}>
      <Header />
      <main className={MAIN_SHELL_CLASS}>
        <div className="mx-auto flex min-h-full w-full max-w-[1700px] flex-1 flex-col space-y-4 2xl:space-y-5">
          {dashboardHero}

          {error ? (
            <section className="flex items-center justify-between gap-4 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
              <span>
                Dashboard refresh warning: {error}. The last successful values remain visible.
              </span>
              <button
                type="button"
                onClick={() => loadDashboard({ forceRefresh: true, background: true })}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 font-black"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            </section>
          ) : null}

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            {metricCards.map((item) => (
              <MetricCard
                key={item.label}
                {...item}
                onClick={() => navigate(item.path)}
              />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <article className="sibs-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="sibs-section-title">Requirement vs Filled Progress</h2>
                  <p className="sibs-section-subtitle">
                    Largest approved hiring requirements within your assigned SOM scope.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/departments")}
                  className="group inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-[9px] font-black uppercase text-sibs-navy transition hover:border-sibs-orange/35 hover:bg-sibs-cream-light hover:text-sibs-orange focus:outline-none focus:ring-2 focus:ring-sibs-orange/20"
                  title="View assigned departments, accounts, and LOBs"
                >
                  Assigned Scope
                  <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {requirementRoles.length === 0 ? (
                  <p className="py-10 text-center text-sm font-semibold text-sibs-muted">
                    No approved hiring requirements are available.
                  </p>
                ) : (
                  requirementRoles.map((role) => {
                    const percent = role.req > 0
                      ? Math.round((role.filled / role.req) * 100)
                      : 0;

                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => navigate(HIRING_NEEDS_ROUTE)}
                        className="group block w-full rounded-[10px] p-2 text-left transition hover:bg-sibs-cream-light focus:outline-none focus:ring-2 focus:ring-sibs-orange/20"
                        title={`Open Hiring Needs for ${role.roleTitle}`}
                      >
                        <div className="flex justify-between gap-3 text-xs">
                          <span className="min-w-0 font-black text-sibs-navy">
                            {role.roleTitle}
                            <span className="ml-1 font-medium text-sibs-faint">
                              ({role.account})
                            </span>
                          </span>
                          <span className="shrink-0 font-black text-sibs-orange">
                            {role.filled} / {role.req}
                            <span className="ml-1 text-sibs-faint">({percent}%)</span>
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-sibs-surface">
                          <div
                            className={`h-full rounded-full ${
                              role.status === "Delayed"
                                ? "bg-rose-500"
                                : role.status === "At Risk"
                                  ? "bg-amber-400"
                                  : "bg-sibs-orange"
                            }`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                        <div className="mt-1 flex justify-end">
                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase text-sibs-faint transition group-hover:text-sibs-orange">
                            Open Hiring Needs
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </article>

            <article className="sibs-card p-5 sm:p-6">
              <h2 className="sibs-section-title">Weekly Movement Pipeline</h2>
              <p className="sibs-section-subtitle">
                Candidate progression within your assigned SOM scope.
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {funnelStages.map(([label, value, className]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => navigate(WEEKLY_REPORTS_ROUTE)}
                    className={`group rounded-[10px] border p-3 text-center transition hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-sibs-orange/20 ${className}`}
                    title={`Open Weekly Reports for ${label} movement`}
                  >
                    <span className="text-[9px] font-black uppercase">{label}</span>
                    <p className="mt-2 text-lg font-black">{formatNumber(value)}</p>
                    <span className="mt-1 inline-flex items-center gap-1 text-[8px] font-black uppercase opacity-60 transition group-hover:opacity-100">
                      View report
                      <ArrowRight className="h-2.5 w-2.5" />
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => navigate(WEEKLY_REPORTS_ROUTE)}
                className="group mt-4 flex w-full items-center justify-between gap-3 rounded-[10px] border border-sibs-border bg-sibs-surface p-4 text-left text-xs leading-6 text-sibs-muted transition hover:border-sibs-orange/35 hover:bg-sibs-cream-light focus:outline-none focus:ring-2 focus:ring-sibs-orange/20"
                title="Open Weekly Reports"
              >
                <span>
                  Conversion from Sourced to Hired within your assigned SOM scope is{" "}
                  <strong className="text-sibs-navy">
                    {metrics.funnel.sourced > 0
                      ? Math.round((metrics.funnel.hired / metrics.funnel.sourced) * 100)
                      : 0}%
                  </strong>.
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-sibs-faint transition group-hover:translate-x-0.5 group-hover:text-sibs-orange" />
              </button>
            </article>
          </section>

          <section className="sibs-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="sibs-section-title">SOM Quick Access</h2>
                <p className="sibs-section-subtitle">
                  Open the operational records available to Senior Operations Management.
                </p>
              </div>
              <span className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase text-emerald-700">
                Read-only where applicable
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className="group flex min-h-[92px] items-center gap-3 rounded-[10px] border border-sibs-border bg-sibs-surface p-4 text-left transition hover:border-sibs-orange/35 hover:bg-sibs-cream-light"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white text-sibs-navy shadow-sm group-hover:text-sibs-orange">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-xs font-extrabold text-sibs-navy">
                        {item.label}
                      </strong>
                      <span className="mt-1 block text-[11px] font-medium leading-4 text-sibs-muted">
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grid grid-cols-1 items-start gap-5 2xl:grid-cols-12">
            <article className="sibs-card p-5 sm:p-6 2xl:col-span-8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="sibs-section-title">Role Hiring Status</h2>
                  <p className="sibs-section-subtitle">
                    Highest-priority open and aging hiring roles within your SOM scope.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(HIRING_OVERVIEW_ROUTE)}
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-sibs-border bg-white px-3 py-2 text-[10px] font-extrabold text-sibs-navy transition hover:border-sibs-orange/40 hover:text-sibs-orange"
                >
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-4 overflow-x-auto rounded-[10px] border border-sibs-border bg-white">
                <table className="w-full min-w-[880px] border-collapse text-left text-xs">
                  <thead className="bg-sibs-surface text-[10px] font-extrabold uppercase tracking-normal text-sibs-muted">
                    <tr>
                      <th className="p-3">Role / Account</th>
                      <th className="p-3">Department</th>
                      <th className="p-3 text-center">Req.</th>
                      <th className="p-3 text-center">Filled</th>
                      <th className="p-3 text-center">Open</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Aging</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sibs-border">
                    {topRoles.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-10 text-center font-semibold text-sibs-muted">
                          No hiring roles are available within your assigned SOM scope.
                        </td>
                      </tr>
                    ) : (
                      topRoles.map((role) => (
                        <tr
                          key={role.id}
                          className="cursor-pointer text-sibs-muted transition hover:bg-sibs-cream-light"
                          onClick={() => navigate(HIRING_NEEDS_ROUTE)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              navigate(HIRING_NEEDS_ROUTE);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          title={`Open Hiring Needs for ${role.roleTitle}`}
                        >
                          <td className="p-3">
                            <strong className="block text-xs font-extrabold text-sibs-navy">
                              {role.roleTitle}
                            </strong>
                            <span className="mt-0.5 block text-[11px] font-semibold text-sibs-muted">
                              {role.account}
                            </span>
                          </td>
                          <td className="p-3 font-semibold">{role.department}</td>
                          <td className="p-3 text-center font-extrabold tabular-nums text-sibs-navy">{role.req}</td>
                          <td className="p-3 text-center font-extrabold tabular-nums text-emerald-600">{role.filled}</td>
                          <td className="p-3 text-center font-extrabold tabular-nums text-sibs-orange">{role.open}</td>
                          <td className="p-3 font-bold">{formatDate(role.dueDate)}</td>
                          <td className="p-3"><StatusBadge status={role.status} /></td>
                          <td className="p-3 text-center font-extrabold tabular-nums">{role.aging}d</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <aside className="sibs-card p-5 sm:p-6 2xl:col-span-4">
              <h2 className="sibs-section-title">Recruiter Load</h2>
              <p className="sibs-section-subtitle">
                Active roles versus recruiter output within your assigned SOM scope.
              </p>

              <div className="mt-4 space-y-3">
                {topRecruiters.length === 0 ? (
                  <p className="py-10 text-center text-sm font-semibold text-sibs-muted">
                    No recruiter ownership data is available.
                  </p>
                ) : (
                  topRecruiters.map((row) => (
                    <button
                      key={row.name}
                      type="button"
                      onClick={() => navigate(WEEKLY_REPORTS_ROUTE)}
                      className="group w-full rounded-[10px] border border-sibs-border bg-sibs-surface p-4 text-left transition hover:border-sibs-orange/35 hover:bg-sibs-cream-light focus:outline-none focus:ring-2 focus:ring-sibs-orange/20"
                      title={`Open Weekly Reports for ${row.name}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <strong className="text-sm text-sibs-navy">{row.name}</strong>
                          <p className="mt-1 text-[11px] text-sibs-muted">
                            {row.activeRoles} active roles handled
                          </p>
                        </div>
                        <span
                          className={`rounded border px-2 py-1 text-[9px] font-black uppercase ${
                            row.loadStatus === "High"
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : row.loadStatus === "Medium"
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {row.loadStatus} Load
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 border-t border-sibs-border pt-3 text-center">
                        <div>
                          <span className="text-[8px] font-black uppercase text-sibs-faint">Sourced</span>
                          <p className="text-sm font-black text-sibs-navy">{row.output.sourced}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black uppercase text-sibs-faint">Interviewed</span>
                          <p className="text-sm font-black text-sibs-navy">{row.output.interviewed}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black uppercase text-sibs-faint">Hired</span>
                          <p className="text-sm font-black text-emerald-600">{row.output.hired}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase text-sibs-faint transition group-hover:text-sibs-orange">
                          View report
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </aside>
          </section>

          <footer className="rounded-[10px] border border-sibs-border bg-sibs-surface px-4 py-3 text-center text-[10px] font-black uppercase tracking-wide text-sibs-muted">
            Senior Operations Dashboard: assigned-scope visibility for operational workforce and hiring oversight.
          </footer>
        </div>
      </main>
    </div>
  );
}
