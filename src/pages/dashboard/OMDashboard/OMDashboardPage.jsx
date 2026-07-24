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
  Clock3,
  Eye,
  LoaderCircle,
  RefreshCw,
  Search,
  Target,
  TrendingDown,
  UserRoundCheck,
  UserX,
  X,
} from "lucide-react";

import Header from "../../../components/layout/Header";
import { getOmDashboardBootstrap } from "../../../lib/axios/getOmDashboard";

const PAGE_SHELL_CLASS = "sibs-dashboard-shell";
const MAIN_SHELL_CLASS = "sibs-dashboard-main";
const HIRING_PLAN_ROUTE = "/recruitment/workforce-hiring-overview";
const AUTO_REFRESH_INTERVAL_MS = 60_000;
const CACHE_KEY = "sibs.om-dashboard.bootstrap.v1";
const CACHE_TTL_MS = 10 * 60_000;

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

function getAnimationStyle(delay = 0) {
  return {
    animationDelay: `${delay}ms`,
    animationFillMode: "both",
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

function normalizeRole(role = {}) {
  return {
    id: role.id,
    role: cleanText(role.role || role.roleTitle) || "Unassigned Role",
    roleTitle: cleanText(role.roleTitle || role.role) || "Unassigned Role",
    roleAccount:
      cleanText(role.roleAccount) ||
      [role.roleTitle || role.role, role.account].filter(Boolean).join(" - "),
    department: cleanText(role.department) || "Unassigned",
    account: cleanText(role.account) || "Unassigned",
    req: Number(role.req || 0),
    filled: Number(role.filled || 0),
    open: Number(role.open || 0),
    dueDate: role.dueDate || null,
    status: cleanText(role.status) || "On Track",
    taOwner: cleanText(role.taOwner) || "Unassigned",
    riskFlag: cleanText(role.riskFlag) || "None",
    aging: Number(role.aging || 0),
    dropOffs: Number(role.dropOffs || 0),
    weeklyHired: Number(role.weeklyHired || 0),
    actionItem:
      cleanText(role.actionItem) ||
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
  const metrics = payload.metrics || {};
  const funnel = metrics.funnel || payload.funnel || {};
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

function OMDashboardLoadingState() {
  return (
    <div className={PAGE_SHELL_CLASS}>
      <main
        className={`${MAIN_SHELL_CLASS} flex min-h-screen items-center justify-center`}
      >
        <div
          className="flex w-full max-w-sm flex-col items-center justify-center px-6 py-10 text-center"
          role="status"
          aria-live="polite"
          aria-label="Loading OM dashboard"
        >
          <div className="relative flex h-16 w-16 items-center justify-center">
            <span
              className="absolute inset-0 animate-ping rounded-full border-2 border-orange-400/25"
              aria-hidden="true"
            />
            <span
              className="absolute inset-1 rounded-full border border-orange-400/30"
              aria-hidden="true"
            />
            <LoaderCircle
              className="relative h-9 w-9 animate-spin text-orange-500"
              aria-hidden="true"
            />
          </div>

          <h1 className="mt-6 text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Loading OM Dashboard
          </h1>

          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading your assigned departments, accounts, and hiring movement...
          </p>

          <div
            className="mt-6 flex items-center justify-center gap-2"
            aria-hidden="true"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400 [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-300 [animation-delay:300ms]" />
          </div>
        </div>
      </main>
    </div>
  );
}

function OMDashboardErrorState({ message, onRetry }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#e9eef4] px-6">
      <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white px-7 py-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-extrabold text-[#042c51]">
          Unable to load OM Dashboard
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
  );
}

function MetricCard({ item, delay = 0 }) {
  const Icon = item.icon;
  return (
    <article
      className="sibs-metric-card flex min-h-[112px] flex-col justify-between rounded-2xl border border-[#E1E8F0] bg-white p-4 shadow-sm"
      style={getAnimationStyle(delay)}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[10px] font-black uppercase tracking-wide text-[#174A7C]">
          {item.label}
        </span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${item.iconClass}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div>
        <p className={`text-[28px] font-black leading-none ${item.valueClass}`}>
          {item.value}
        </p>
        <p className="mt-2 text-[11px] font-semibold text-[#667085]">
          {item.description}
        </p>
      </div>
    </article>
  );
}

function StatusBadge({ status }) {
  const className =
    status === "Delayed"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : status === "At Risk"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return (
    <span className={`inline-flex rounded border px-2 py-1 text-[9px] font-black uppercase ${className}`}>
      {status}
    </span>
  );
}

function RoleDetailsModal({ role, onClose }) {
  if (!role) return null;
  const progress = role.req > 0 ? Math.round((role.filled / role.req) * 100) : 0;
  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-[#042C51]/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-4 bg-[#042C51] px-5 py-4 text-white">
          <div>
            <h2 className="text-base font-black">Role KPI Details</h2>
            <p className="mt-1 text-xs text-slate-300">Manager-accessible recruitment analytics</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg bg-white/10 p-2 hover:bg-white/20">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="space-y-5 p-5">
          <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-black text-[#042C51]">{role.roleTitle}</h3>
              <p className="mt-1 text-sm text-[#667085]">{role.account} · {role.department}</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-black uppercase text-[#667085]">Progress</span>
              <p className="text-2xl font-black text-[#FF5C28]">{progress}%</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Requirement", role.req],
              ["Filled", role.filled],
              ["Open", role.open],
              ["Aging", `${role.aging}d`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[#E6ECF2] p-3 text-center">
                <span className="text-[9px] font-black uppercase text-[#667085]">{label}</span>
                <p className="mt-1 text-xl font-black text-[#042C51]">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {Object.entries(role.movement).map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] p-2 text-center">
                <span className="text-[8px] font-black uppercase text-[#667085]">{label}</span>
                <p className="mt-1 text-sm font-black text-[#042C51]">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-[10px] font-black uppercase text-blue-700">Current Action Item</p>
              <p className="mt-2 text-sm font-medium leading-6 text-blue-950">{role.actionItem}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-[10px] font-black uppercase text-amber-700">Delivery Status</p>
              <div className="mt-2 flex items-center gap-2"><StatusBadge status={role.status} /><span className="text-xs font-bold text-amber-900">Risk: {role.riskFlag}</span></div>
              <p className="mt-3 text-xs text-amber-900">Due {formatDate(role.dueDate)} · TA Owner: {role.taOwner}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
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
    { label: "Total Open Roles", value: formatNumber(metrics.totalOpenRoles), description: "Accessible roles needing staff", icon: BriefcaseBusiness, valueClass: "text-[#042C51]", iconClass: "bg-[#EEF4FA] text-[#042C51]" },
    { label: "Requirement vs Filled", value: `${formatNumber(metrics.totalFilled)} / ${formatNumber(metrics.totalRequirement)}`, description: `${Math.round(metrics.filledPercentage)}% filled`, icon: Target, valueClass: "text-[#042C51]", iconClass: "bg-[#EEF4FA] text-[#042C51]" },
    { label: "At-Risk Roles", value: formatNumber(metrics.atRiskRoles), description: "Require intervention", icon: AlertCircle, valueClass: "text-amber-600", iconClass: "bg-amber-50 text-amber-600" },
    { label: "Delayed Roles", value: formatNumber(metrics.delayedRoles), description: "Due dates missed", icon: Clock3, valueClass: "text-rose-600", iconClass: "bg-rose-50 text-rose-600" },
    { label: "Weekly Movement", value: `+${formatNumber(metrics.weeklyHired)}`, description: "Hired this cycle", icon: Activity, valueClass: "text-indigo-600", iconClass: "bg-indigo-50 text-indigo-600" },
    { label: "Drop-Offs", value: formatNumber(metrics.dropOffs), description: "Candidate attrition", icon: TrendingDown, valueClass: "text-[#FF5C28]", iconClass: "bg-orange-50 text-[#FF5C28]" },
    { label: "Aging Roles", value: formatNumber(metrics.agingRoles), description: "15 days or older", icon: Clock3, valueClass: "text-slate-700", iconClass: "bg-slate-100 text-slate-700" },
  ];

  if (initialLoading && roles.length === 0) return <OMDashboardLoadingState />;
  if (error && roles.length === 0) {
    return <OMDashboardErrorState message={error} onRetry={() => loadDashboard({ forceRefresh: true })} />;
  }

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
        <div className="mx-auto w-full max-w-[1700px] space-y-5 sm:space-y-6">
          <section className="sibs-page-header-in rounded-2xl border border-[#E1E8F0] border-t-[4px] border-t-[#042C51] bg-white px-5 py-5 shadow-sm sm:px-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-black uppercase text-[#042C51]">● Operations Manager View</span>
                  <span className="rounded border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase text-[#FF5C28]">Dept: {departmentBadge}</span>
                </div>
                <h1 className="mt-3 text-2xl font-black tracking-tight text-[#042C51]">Operations Dashboard</h1>
                <p className="mt-1 text-sm font-medium text-[#667085]">Hiring overview filtered by your department and assigned accounts: <strong className="text-[#042C51]">{scopeText || "No scope label available"}</strong>.</p>
              </div>
              <button type="button" onClick={() => navigate(HIRING_PLAN_ROUTE)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE5EE] bg-[#F8FAFC] px-4 py-2.5 text-xs font-black text-[#042C51] transition hover:border-[#FF5C28] hover:text-[#FF5C28]">
                Return to Hiring Plan <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          {error ? (
            <section className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
              <span>Dashboard refresh warning: {error}. The last successful values remain visible.</span>
              <button type="button" onClick={() => loadDashboard({ forceRefresh: true, background: true })} className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 font-black"><RefreshCw className="h-3.5 w-3.5" /> Retry</button>
            </section>
          ) : null}

          {refreshing ? <div className="flex justify-end gap-2 text-xs font-bold text-[#667085]"><LoaderCircle className="h-4 w-4 animate-spin text-[#FF5C28]" /> Refreshing manager-scoped data...</div> : null}

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            {metricCards.map((item, index) => (
              <MetricCard
                key={item.label}
                item={item}
                delay={80 + index * 55}
              />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <article
              className="sibs-page-card-in rounded-2xl border border-[#E1E8F0] bg-white p-5 shadow-sm"
              style={getAnimationStyle(210)}
            >
              <h2 className="text-base font-black text-[#042C51]">Approved Requirement vs Filled Progress</h2>
              <p className="mt-1 text-sm text-[#667085]">Current hiring progress for manager-accessible roles</p>
              <div className="mt-5 space-y-4">
                {roles.slice(0, 6).map((role) => {
                  const percent = role.req > 0 ? Math.round((role.filled / role.req) * 100) : 0;
                  return <div key={role.id}>
                    <div className="flex justify-between gap-3 text-xs"><span className="font-black text-[#042C51]">{role.roleTitle} <span className="font-medium text-[#98A2B3]">({role.account})</span></span><span className="font-black text-[#FF5C28]">{role.filled} / {role.req} <span className="text-[#98A2B3]">({percent}%)</span></span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EEF2F6]"><div className={`h-full rounded-full ${role.status === "Delayed" ? "bg-rose-500" : role.status === "At Risk" ? "bg-amber-400" : "bg-[#FF5C28]"}`} style={{ width: `${Math.min(percent, 100)}%` }} /></div>
                  </div>;
                })}
                {roles.length === 0 ? <p className="py-8 text-center text-sm font-semibold text-[#667085]">No accessible hiring roles were found.</p> : null}
              </div>
            </article>

            <article
              className="sibs-page-card-in rounded-2xl border border-[#E1E8F0] bg-white p-5 shadow-sm"
              style={getAnimationStyle(260)}
            >
              <h2 className="text-base font-black text-[#042C51]">Weekly Movement Pipeline</h2>
              <p className="mt-1 text-sm text-[#667085]">Candidate progression for the manager’s accessible hiring scope</p>
              <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {funnelStages.map(([label, value, className]) => <div key={label} className={`rounded-xl border p-3 text-center ${className}`}><span className="text-[9px] font-black uppercase">{label}</span><p className="mt-2 text-lg font-black">{formatNumber(value)}</p></div>)}
              </div>
              <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-xs leading-6 text-[#667085]">Conversion from Sourced to Hired is <strong className="text-[#042C51]">{metrics.funnel.sourced > 0 ? Math.round((metrics.funnel.hired / metrics.funnel.sourced) * 100) : 0}%</strong>. Roles marked At Risk or Delayed require additional sourcing buffers before the next hiring call.</div>
            </article>
          </section>

          <section className="grid grid-cols-1 items-start gap-5 2xl:grid-cols-12">
            <article
              className="sibs-page-card-in rounded-2xl border border-[#E1E8F0] bg-white p-5 shadow-sm 2xl:col-span-8"
              style={getAnimationStyle(310)}
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div><h2 className="text-base font-black text-[#042C51]">Role Hiring Status</h2><p className="mt-1 text-sm text-[#667085]">Role-level delivery, risk status, aging, and ownership</p></div>
                <span className="w-fit rounded border border-amber-300 bg-amber-50 px-2.5 py-1 text-[9px] font-black uppercase text-amber-800">Manager Restricted View</span>
              </div>
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-bold text-[#042C51]">Viewing only: {scopeText || "manager-assigned scope"}</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px]">
                <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by role, account, department, or owner..." className="h-11 w-full rounded-xl border border-[#D6E0EA] bg-[#F8FAFC] pl-10 pr-4 text-xs font-semibold outline-none focus:border-[#FF5C28]" /></div>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-[#D6E0EA] bg-white px-3 text-xs font-bold text-[#042C51] outline-none"><option>All</option><option>On Track</option><option>At Risk</option><option>Delayed</option></select>
              </div>
              <div className="mt-4 overflow-x-auto rounded-xl border border-[#E6ECF2]">
                <table className="min-w-[950px] w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[10px] font-black uppercase text-[#667085]"><tr><th className="p-3">Role / Account</th><th className="p-3 text-center">Req.</th><th className="p-3 text-center">Filled</th><th className="p-3 text-center">Open</th><th className="p-3">Due Date</th><th className="p-3">Status</th><th className="p-3">TA Owner</th><th className="p-3 text-center">Aging</th><th className="p-3 text-center">Action</th></tr></thead>
                  <tbody className="divide-y divide-[#EEF2F6]">
                    {paginatedRoles.length === 0 ? <tr><td colSpan={9} className="p-8 text-center font-semibold text-[#667085]">No roles match the current filters.</td></tr> : paginatedRoles.map((role) => <tr key={role.id} className="hover:bg-[#FAFBFC]"><td className="p-3"><strong className="block text-[#042C51]">{role.roleTitle}</strong><span className="mt-1 block text-[10px] text-[#667085]">{role.account}</span></td><td className="p-3 text-center font-bold">{role.req}</td><td className="p-3 text-center font-black text-emerald-600">{role.filled}</td><td className="p-3 text-center font-black text-[#FF5C28]">{role.open}</td><td className="p-3 text-[#667085]">{formatDate(role.dueDate)}</td><td className="p-3"><StatusBadge status={role.status} /></td><td className="p-3 text-[#667085]">{role.taOwner}</td><td className="p-3 text-center font-bold text-[#667085]">{role.aging}d</td><td className="p-3 text-center"><button type="button" onClick={() => setSelectedRole(role)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#D6E0EA] bg-white px-3 py-1.5 text-[10px] font-black text-[#042C51] hover:border-[#FF5C28] hover:text-[#FF5C28]"><Eye className="h-3.5 w-3.5" /> View</button></td></tr>)}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-[#667085]"><span>{filteredRoles.length} accessible role{filteredRoles.length === 1 ? "" : "s"}</span><div className="flex items-center gap-2"><button type="button" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="rounded-lg border px-3 py-2 disabled:opacity-40">Previous</button><span>Page {safeCurrentPage} of {totalPages}</span><button type="button" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="rounded-lg border px-3 py-2 disabled:opacity-40">Next</button></div></div>
            </article>

            <aside
              className="sibs-page-card-in rounded-2xl border border-[#E1E8F0] bg-white p-5 shadow-sm 2xl:col-span-4"
              style={getAnimationStyle(360)}
            >
              <h2 className="text-base font-black text-[#042C51]">Recruiter Load</h2><p className="mt-1 text-sm text-[#667085]">Active accessible roles versus recruiter output</p>
              <div className="mt-4 space-y-3">
                {recruiters.length === 0 ? <p className="py-8 text-center text-sm font-semibold text-[#667085]">No recruiter ownership data is available.</p> : recruiters.map((row) => <div key={row.name} className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"><div className="flex items-start justify-between gap-3"><div><strong className="text-sm text-[#042C51]">{row.name}</strong><p className="mt-1 text-[11px] text-[#667085]">{row.activeRoles} active roles handled</p></div><span className={`rounded border px-2 py-1 text-[9px] font-black uppercase ${row.loadStatus === "High" ? "border-rose-200 bg-rose-50 text-rose-700" : row.loadStatus === "Medium" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{row.loadStatus} Load</span></div><div className="mt-3 grid grid-cols-3 border-t border-[#E6ECF2] pt-3 text-center"><div><span className="text-[8px] font-black uppercase text-[#98A2B3]">Sourced</span><p className="text-sm font-black text-[#042C51]">{row.output.sourced}</p></div><div><span className="text-[8px] font-black uppercase text-[#98A2B3]">Interviewed</span><p className="text-sm font-black text-[#042C51]">{row.output.interviewed}</p></div><div><span className="text-[8px] font-black uppercase text-[#98A2B3]">Hired</span><p className="text-sm font-black text-emerald-600">{row.output.hired}</p></div></div></div>)}
              </div>
            </aside>
          </section>

          <footer className="rounded-xl border border-[#DCE5EE] bg-[#F3F6F9] px-4 py-3 text-center text-[10px] font-black uppercase tracking-wide text-[#667085]">Operations Manager Dashboard Rule: restricted to the logged-in manager’s department or assigned accounts.</footer>
        </div>
      </main>
      <RoleDetailsModal role={selectedRole} onClose={() => setSelectedRole(null)} />
    </div>
  );
}
