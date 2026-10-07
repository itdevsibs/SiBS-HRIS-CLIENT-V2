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
  LoaderCircle,
  RefreshCw,
  Target,
  TrendingDown,
  Users,
} from "lucide-react";

import Header from "../../../components/layout/Header";
import { getWfmDashboardBootstrap } from "../../../lib/axios/getWfmDashboard";

const PAGE_SHELL_CLASS = "sibs-dashboard-shell";
const MAIN_SHELL_CLASS = "sibs-dashboard-main-wide";
const AUTO_REFRESH_INTERVAL_MS = 60_000;
const CACHE_KEY = "sibs.wfm-dashboard.bootstrap.v1";
const CACHE_TTL_MS = 10 * 60_000;
const HIRING_OVERVIEW_ROUTE = "/recruitment/workforce-hiring-overview";

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
  return date.toLocaleDateString("en-PH", {
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

function WfmDashboardLoadingState() {
  return (
    <div className={PAGE_SHELL_CLASS}>
      <Header />
      <main
        className={`${MAIN_SHELL_CLASS} flex min-h-[calc(100vh-76px)] items-center justify-center bg-[#e8eef5] px-6 py-10`}
      >
        <div
          className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-[#dfe7ef] bg-white px-8 py-10 text-center shadow-sm"
          role="status"
          aria-live="polite"
          aria-label="Loading WFM dashboard"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
            <LoaderCircle
              className="h-8 w-8 animate-spin text-[#ff5c28]"
              aria-hidden="true"
            />
          </div>
          <h2 className="mt-5 text-lg font-extrabold text-[#042c51]">
            Loading WFM Dashboard
          </h2>
          <p className="mt-2 max-w-[300px] text-sm font-medium leading-6 text-[#667085]">
            Loading company-wide workforce and hiring information.
          </p>
        </div>
      </main>
    </div>
  );
}

function WfmDashboardErrorState({ message, onRetry }) {
  return (
    <div className={PAGE_SHELL_CLASS}>
      <Header />
      <main
        className={`${MAIN_SHELL_CLASS} flex min-h-[calc(100vh-76px)] items-center justify-center bg-[#e8eef5] px-6 py-10`}
      >
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white px-7 py-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-extrabold text-[#042c51]">
            Unable to load WFM Dashboard
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
      </main>
    </div>
  );
}

function MetricCard({ label, value, description, icon: Icon, tone = "navy" }) {
  const tones = {
    navy: {
      label: "text-[#042C51]",
      value: "text-[#042C51]",
      icon: "bg-[#E9F0FC] text-[#042C51]",
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
      label: "text-[#C2410C]",
      value: "text-[#FF5C28]",
      icon: "bg-orange-50 text-[#FF5C28]",
    },
    slate: {
      label: "text-slate-700",
      value: "text-slate-700",
      icon: "bg-slate-100 text-slate-700",
    },
  };

  const classes = tones[tone] || tones.navy;

  return (
    <article className="sibs-metric-card flex min-h-[112px] flex-col justify-between overflow-hidden p-3.5">
      <div className="flex items-start justify-between gap-3">
        <span className={`text-[10px] font-extrabold uppercase tracking-normal ${classes.label}`}>
          {label}
        </span>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${classes.icon}`}>
          <Icon size={17} strokeWidth={2} />
        </span>
      </div>
      <div className="mt-2">
        <p className={`text-3xl font-extrabold leading-none tabular-nums tracking-tight ${classes.value}`}>
          {value}
        </p>
        <p className="mt-1.5 text-xs font-bold leading-4 text-[#667085]">
          {description}
        </p>
      </div>
    </article>
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

export default function WFMDashboardPage() {
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
        const payload = await getWfmDashboardBootstrap({ forceRefresh });
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
        setError("");
        writeCachedDashboard(payload);
        hasDataRef.current = true;
        return true;
      } catch (loadError) {
        if (requestId !== requestIdRef.current) return false;
        setError(
          getErrorMessage(
            loadError,
            "Unable to load company-wide WFM dashboard data.",
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

  if (initialLoading && roles.length === 0) {
    return <WfmDashboardLoadingState />;
  }

  if (error && roles.length === 0) {
    return (
      <WfmDashboardErrorState
        message={error}
        onRetry={() => loadDashboard({ forceRefresh: true })}
      />
    );
  }

  const metricCards = [
    {
      label: "Open Hiring Roles",
      value: formatNumber(metrics.totalOpenRoles),
      description: "Company-wide roles needing staff",
      icon: BriefcaseBusiness,
      tone: "navy",
    },
    {
      label: "Requirement vs Filled",
      value: `${formatNumber(metrics.totalFilled)} / ${formatNumber(metrics.totalRequirement)}`,
      description: `${Math.round(metrics.filledPercentage)}% filled`,
      icon: Target,
      tone: "navy",
    },
    {
      label: "At-Risk Roles",
      value: formatNumber(metrics.atRiskRoles),
      description: "Require WFM attention",
      icon: AlertCircle,
      tone: "amber",
    },
    {
      label: "Delayed Roles",
      value: formatNumber(metrics.delayedRoles),
      description: "Due dates already missed",
      icon: Clock3,
      tone: "red",
    },
    {
      label: "Weekly Hires",
      value: `+${formatNumber(metrics.weeklyHired)}`,
      description: "Hired in the current cycle",
      icon: Activity,
      tone: "indigo",
    },
    {
      label: "Drop-Offs",
      value: formatNumber(metrics.dropOffs),
      description: "Candidate attrition",
      icon: TrendingDown,
      tone: "orange",
    },
    {
      label: "Aging Roles",
      value: formatNumber(metrics.agingRoles),
      description: "15 days or older",
      icon: Clock3,
      tone: "slate",
    },
  ];

  const quickLinks = [
    {
      label: "Employee Directory",
      description: "Company-wide employee records",
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
      description: "Company-wide leave records",
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
      description: "Company-wide headcount and hiring",
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
          <section className="sibs-page-header-in sibs-card relative overflow-hidden p-5 sm:p-6">
            <span className="sibs-top-accent" aria-hidden="true" />
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-normal text-[#042C51]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF5C28]" />
                  Workforce Management View
                </span>
                <h1 className="mt-3 text-xl font-extrabold tracking-tight text-[#042C51] sm:text-2xl">
                  WFM Dashboard
                </h1>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-[#667085] sm:text-sm">
                  Company-wide workforce and hiring visibility across all departments and accounts.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadDashboard({ forceRefresh: true, background: true })}
                  disabled={refreshing}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#DCE5EE] bg-white text-[#042C51] transition hover:border-[#FF5C28]/40 hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-60"
                  title="Refresh WFM dashboard"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate(HIRING_OVERVIEW_ROUTE)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#ea4d1c]"
                >
                  Workforce & Hiring
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          {error ? (
            <section className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
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
              <MetricCard key={item.label} {...item} />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <article className="sibs-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="sibs-section-title">Requirement vs Filled Progress</h2>
                  <p className="sibs-section-subtitle">
                    Largest approved hiring requirements across the company.
                  </p>
                </div>
                <span className="rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-[9px] font-black uppercase text-[#042C51]">
                  Company-wide
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {requirementRoles.length === 0 ? (
                  <p className="py-10 text-center text-sm font-semibold text-[#667085]">
                    No approved hiring requirements are available.
                  </p>
                ) : (
                  requirementRoles.map((role) => {
                    const percent = role.req > 0
                      ? Math.round((role.filled / role.req) * 100)
                      : 0;

                    return (
                      <div key={role.id}>
                        <div className="flex justify-between gap-3 text-xs">
                          <span className="min-w-0 font-black text-[#042C51]">
                            {role.roleTitle}
                            <span className="ml-1 font-medium text-[#98A2B3]">
                              ({role.account})
                            </span>
                          </span>
                          <span className="shrink-0 font-black text-[#FF5C28]">
                            {role.filled} / {role.req}
                            <span className="ml-1 text-[#98A2B3]">({percent}%)</span>
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EEF2F6]">
                          <div
                            className={`h-full rounded-full ${
                              role.status === "Delayed"
                                ? "bg-rose-500"
                                : role.status === "At Risk"
                                  ? "bg-amber-400"
                                  : "bg-[#FF5C28]"
                            }`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </article>

            <article className="sibs-card p-5 sm:p-6">
              <h2 className="sibs-section-title">Weekly Movement Pipeline</h2>
              <p className="sibs-section-subtitle">
                Company-wide candidate progression through the hiring pipeline.
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {funnelStages.map(([label, value, className]) => (
                  <div
                    key={label}
                    className={`rounded-xl border p-3 text-center ${className}`}
                  >
                    <span className="text-[9px] font-black uppercase">{label}</span>
                    <p className="mt-2 text-lg font-black">{formatNumber(value)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-xs leading-6 text-[#667085]">
                Company-wide conversion from Sourced to Hired is{" "}
                <strong className="text-[#042C51]">
                  {metrics.funnel.sourced > 0
                    ? Math.round((metrics.funnel.hired / metrics.funnel.sourced) * 100)
                    : 0}%
                </strong>.
              </div>
            </article>
          </section>

          <section className="sibs-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="sibs-section-title">WFM Quick Access</h2>
                <p className="sibs-section-subtitle">
                  Open the company-wide records available to Workforce Management.
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
                    className="group flex min-h-[92px] items-center gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-left transition hover:border-[#FF5C28]/35 hover:bg-[#FFF8F5]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#042C51] shadow-sm group-hover:text-[#FF5C28]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-xs font-extrabold text-[#042C51]">
                        {item.label}
                      </strong>
                      <span className="mt-1 block text-[11px] font-medium leading-4 text-[#667085]">
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
                  <h2 className="sibs-section-title">Company-Wide Role Hiring Status</h2>
                  <p className="sibs-section-subtitle">
                    Highest-priority open and aging hiring roles visible to WFM.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(HIRING_OVERVIEW_ROUTE)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5EE] bg-white px-3 py-2 text-[10px] font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:text-[#FF5C28]"
                >
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-4 overflow-x-auto rounded-xl border border-[#E6ECF2] bg-white">
                <table className="w-full min-w-[880px] border-collapse text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[10px] font-extrabold uppercase tracking-normal text-[#667085]">
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
                  <tbody className="divide-y divide-[#EEF2F6]">
                    {topRoles.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-10 text-center font-semibold text-[#667085]">
                          No company-wide hiring roles are available.
                        </td>
                      </tr>
                    ) : (
                      topRoles.map((role) => (
                        <tr key={role.id} className="text-[#344054] hover:bg-[#FFF8F5]">
                          <td className="p-3">
                            <strong className="block text-xs font-extrabold text-[#042C51]">
                              {role.roleTitle}
                            </strong>
                            <span className="mt-0.5 block text-[11px] font-semibold text-[#667085]">
                              {role.account}
                            </span>
                          </td>
                          <td className="p-3 font-semibold">{role.department}</td>
                          <td className="p-3 text-center font-extrabold tabular-nums text-[#042C51]">{role.req}</td>
                          <td className="p-3 text-center font-extrabold tabular-nums text-emerald-600">{role.filled}</td>
                          <td className="p-3 text-center font-extrabold tabular-nums text-[#FF5C28]">{role.open}</td>
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
                Company-wide active roles versus recruiter output.
              </p>

              <div className="mt-4 space-y-3">
                {topRecruiters.length === 0 ? (
                  <p className="py-10 text-center text-sm font-semibold text-[#667085]">
                    No recruiter ownership data is available.
                  </p>
                ) : (
                  topRecruiters.map((row) => (
                    <div
                      key={row.name}
                      className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <strong className="text-sm text-[#042C51]">{row.name}</strong>
                          <p className="mt-1 text-[11px] text-[#667085]">
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
                      <div className="mt-3 grid grid-cols-3 border-t border-[#E6ECF2] pt-3 text-center">
                        <div>
                          <span className="text-[8px] font-black uppercase text-[#98A2B3]">Sourced</span>
                          <p className="text-sm font-black text-[#042C51]">{row.output.sourced}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black uppercase text-[#98A2B3]">Interviewed</span>
                          <p className="text-sm font-black text-[#042C51]">{row.output.interviewed}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black uppercase text-[#98A2B3]">Hired</span>
                          <p className="text-sm font-black text-emerald-600">{row.output.hired}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </section>

          <footer className="rounded-xl border border-[#DCE5EE] bg-[#F3F6F9] px-4 py-3 text-center text-[10px] font-black uppercase tracking-wide text-[#667085]">
            WFM Dashboard: company-wide visibility for workforce monitoring and planning.
          </footer>
        </div>
      </main>
    </div>
  );
}
