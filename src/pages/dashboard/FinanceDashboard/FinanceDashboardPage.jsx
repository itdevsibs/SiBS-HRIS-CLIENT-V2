import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";

import Header from "../../../components/layout/Header";
import FinanceDashboardSkeleton from "../../../components/Dashboard/FinanceDashboard/FinanceDashboardSkeleton";
const StatutoryCoverageModal = lazy(() => import("../../../components/Dashboard/FinanceDashboard/StatutoryCoverageModal"));
import { MetricCard, MetricGrid, PageHeaderHero, ResponsiveTableShell, SearchInput, TablePagination } from "../../../components/ui";
import { getFinanceDashboardBootstrap } from "../../../lib/axios/getFinanceDashboard";
import { validateFinanceDashboardPayload } from "../../../lib/utils/finance/validateFinanceDashboardPayload";

const PAGE_SHELL_CLASS = "sibs-dashboard-shell";
const MAIN_SHELL_CLASS = "sibs-dashboard-main-wide";
const AUTO_REFRESH_INTERVAL_MS = 60_000;
const CACHE_KEY = "sibs.finance-dashboard.bootstrap.v4.statutory-presence";
const CACHE_TTL_MS = 45_000;
const PAGE_SIZE = 15;

const EMPTY_METRICS = {
  activeEmployees: 0,
  payrollReady: 0,
  incompleteProfiles: 0,
  readinessPercentage: 0,
  activeAccounts: 0,
  activeDepartments: 0,
  statutoryCoverage: {
    sss: { count: 0, missing: 0, percentage: 0 },
    philHealth: { count: 0, missing: 0, percentage: 0 },
    pagIbig: { count: 0, missing: 0, percentage: 0 },
    tin: { count: 0, missing: 0, percentage: 0 },
  },
};

function cleanText(value) {
  return String(value ?? "").trim();
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function formatPercent(value) {
  const number = Number(value || 0);
  return `${Number.isFinite(number) ? number.toFixed(1) : "0.0"}%`;
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function normalizeCoverage(value = {}) {
  return {
    count: Number(value.count || 0),
    missing: Number(value.missing || 0),
    percentage: Number(value.percentage || 0),
  };
}

function normalizeMetrics(payload = {}) {
  const metrics = payload?.metrics || {};
  const statutoryCoverage = metrics.statutoryCoverage || {};

  return {
    ...EMPTY_METRICS,
    ...metrics,
    activeEmployees: Number(metrics.activeEmployees || 0),
    payrollReady: Number(metrics.payrollReady || 0),
    incompleteProfiles: Number(metrics.incompleteProfiles || 0),
    readinessPercentage: Number(metrics.readinessPercentage || 0),
    activeAccounts: Number(metrics.activeAccounts || 0),
    activeDepartments: Number(metrics.activeDepartments || 0),
    statutoryCoverage: {
      sss: normalizeCoverage(statutoryCoverage.sss),
      philHealth: normalizeCoverage(statutoryCoverage.philHealth),
      pagIbig: normalizeCoverage(statutoryCoverage.pagIbig),
      tin: normalizeCoverage(statutoryCoverage.tin),
    },
  };
}

function normalizeAccount(row = {}) {
  return {
    account: cleanText(row.account) || "Unassigned",
    department: cleanText(row.department) || "Unassigned",
    activeEmployees: Number(row.activeEmployees || 0),
    payrollReady: Number(row.payrollReady || 0),
    incompleteProfiles: Number(row.incompleteProfiles || 0),
    readinessPercentage: Number(row.readinessPercentage || 0),
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

    return validateFinanceDashboardPayload(parsed.payload);
  } catch {
    try {
      window.sessionStorage.removeItem(CACHE_KEY);
    } catch {
      // Storage may be disabled; ignore.
    }
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

function FinanceDashboardErrorState({ message, onRetry }) {
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
          <h2 className="mt-4 font-heading text-lg font-extrabold text-sibs-navy">
            Unable to load Finance Dashboard
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-sibs-muted">
            {message}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex items-center gap-2 rounded-[10px] bg-sibs-navy hover:bg-sibs-tertiary-3 px-5 py-2.5 text-sm font-bold text-white transition"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </main>
    </div>
  );
}

// Match the Employee Directory's page-entry timing and shared MetricCard visuals.
const animationTiming = {
  summary: 60,
  summaryCardStagger: 60,
  details: 120,
  table: 180,
};

function getAnimationStyle(delay = 0) {
  return {
    animationDelay: `${delay}ms`,
    animationFillMode: "both",
  };
}

function CoverageRow({ label, coverage, onClick }) {
  const percentage = Math.min(Math.max(Number(coverage?.percentage || 0), 0), 100);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-xl border border-sibs-border bg-sibs-surface p-4 text-left font-jakarta transition-colors duration-200 hover:border-sibs-orange/40 hover:bg-sibs-cream-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sibs-orange/30"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-heading text-sm font-bold tracking-tight text-sibs-navy">{label}</p>
          <p className="mt-1 sibs-text-xs font-semibold text-sibs-muted">
            {formatNumber(coverage?.count)} employees complete · {formatNumber(coverage?.missing)} missing
          </p>
        </div>
        <span className="rounded-lg border border-sibs-border bg-white px-2.5 py-1 sibs-text-xs font-extrabold tabular-nums text-sibs-navy">
          {formatPercent(percentage)}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-sibs-border/60">
        <div
          className="h-full rounded-full bg-sibs-orange transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-3 sibs-text-micro font-extrabold uppercase tracking-wider text-sibs-muted transition-colors group-hover:text-sibs-orange">
        View complete and missing employees
      </p>
    </button>
  );
}

// eslint-disable-next-line no-unused-vars
function QuickAction({ title, description, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[92px] items-center gap-3 rounded-xl border border-sibs-border bg-sibs-surface p-3.5 text-left font-jakarta transition-colors duration-200 hover:border-sibs-orange/40 hover:bg-sibs-cream-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sibs-orange/30"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sibs-cream-light text-sibs-navy transition-colors group-hover:bg-white group-hover:text-sibs-orange">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-sm font-bold tracking-tight text-sibs-navy">{title}</span>
        <span className="mt-1 block sibs-text-xs font-semibold leading-4 text-sibs-muted">{description}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-sibs-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-sibs-orange" />
    </button>
  );
}

export default function FinanceDashboardPage() {
  const navigate = useNavigate();
  const cachedRef = useRef(readCachedDashboard());
  const cached = cachedRef.current;

  const [metrics, setMetrics] = useState(() =>
    cached ? normalizeMetrics(cached) : EMPTY_METRICS,
  );
  const [accounts, setAccounts] = useState(() =>
    Array.isArray(cached?.accounts) ? cached.accounts.map(normalizeAccount) : [],
  );
  const [initialLoading, setInitialLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const tableScrollRef = useRef(null);
  const [coverageModal, setCoverageModal] = useState(null);

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
        const payload = validateFinanceDashboardPayload(
          await getFinanceDashboardBootstrap({ forceRefresh }),
        );
        if (requestId !== requestIdRef.current) return false;

        setMetrics(normalizeMetrics(payload));
        setAccounts(
          Array.isArray(payload?.accounts)
            ? payload.accounts.map(normalizeAccount)
            : [],
        );
        setError("");
        writeCachedDashboard(payload);
        hasDataRef.current = true;
        return true;
      } catch (loadError) {
        if (requestId !== requestIdRef.current) return false;
        setError(
          getErrorMessage(loadError, "Unable to load Finance dashboard data."),
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

  const filteredAccounts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return accounts;

    return accounts.filter((row) =>
      [row.account, row.department]
        .some((value) => cleanText(value).toLowerCase().includes(keyword)),
    );
  }, [accounts, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageRows = filteredAccounts.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const handleTablePageChange = (nextPage) => {
    const page = Math.min(Math.max(Number(nextPage) || 1, 1), totalPages);
    if (page === safePage) return;

    // Show the first table row whenever pagination selects a different page.
    if (tableScrollRef.current) tableScrollRef.current.scrollTop = 0;
    setCurrentPage(page);
  };

  // Keep the Finance page header visible while only data-dependent sections load,
  // matching the Employee Directory's persistent header during skeleton loading.
  const financeHero = (
    <PageHeaderHero
      kicker="Finance View"
      title="Finance Dashboard"
      description="Company-wide payroll readiness, statutory coverage, and workforce finance visibility."
      actions={
        <div className="flex shrink-0 items-center gap-2 2xl:gap-2.5 max-sm:w-full">
          <button
            type="button"
            onClick={() =>
              loadDashboard({ forceRefresh: true, background: true })
            }
            disabled={refreshing || initialLoading}
            className="sibs-btn-icon"
            title="Refresh Finance Dashboard"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                refreshing ? "animate-spin text-sibs-orange" : ""
              }`}
            />
          </button>

          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 max-sm:flex-1">
            <ShieldCheck className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-emerald-600" />
            Statutory Coverage
          </span>
        </div>
      }
    />
  );

  if (initialLoading && !hasDataRef.current) {
    return <FinanceDashboardSkeleton hero={financeHero} />;
  }

  if (error && !hasDataRef.current) {
    return (
      <FinanceDashboardErrorState
        message={error}
        onRetry={() => loadDashboard({ forceRefresh: true })}
      />
    );
  }

  const coverage = metrics.statutoryCoverage;

  return (
    <div className={PAGE_SHELL_CLASS}>
      <Header />

      <main className={MAIN_SHELL_CLASS}>
        <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-8 sm:space-y-6 font-jakarta">
        {financeHero}

        <MetricGrid columns={3} className="w-full">
          <MetricCard
            delay={animationTiming.summary + 0 * animationTiming.summaryCardStagger}
            label="Active Employees"
            value={formatNumber(metrics.activeEmployees)}
            description="Employees included in Finance visibility"
            icon={Users}
          />
          <MetricCard
            delay={animationTiming.summary + 1 * animationTiming.summaryCardStagger}
            label="Payroll Ready"
            value={formatNumber(metrics.payrollReady)}
            description="SSS, PhilHealth, Pag-IBIG and TIN complete"
            icon={CheckCircle2}
            tone="emerald"
          />
          <MetricCard
            delay={animationTiming.summary + 2 * animationTiming.summaryCardStagger}
            label="Incomplete Payroll Profiles"
            value={formatNumber(metrics.incompleteProfiles)}
            description="Missing at least one statutory record"
            icon={AlertCircle}
            tone="amber"
          />
        </MetricGrid>

        <section
          className="sibs-page-card-in grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]"
          style={getAnimationStyle(animationTiming.details)}
        >
          <article className="sibs-card rounded-2xl border border-sibs-border bg-white p-4 shadow-xs font-jakarta sm:p-5 2xl:p-6">
            <div className="flex items-start gap-3 border-b border-sibs-border pb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sibs-cream-light text-sibs-navy">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-heading text-sm font-bold tracking-tight text-sibs-navy 2xl:text-base">
                  Statutory Coverage
                </h2>
                <p className="mt-1 sibs-text-xs font-semibold text-sibs-muted">
                  Completion counts only. Government ID values are not displayed on this dashboard.
                </p>
                <p className="mt-1 sibs-text-xs font-semibold text-sibs-muted">
                  {formatNumber(metrics.activeAccounts)} active accounts · {formatNumber(metrics.activeDepartments)} departments
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CoverageRow
                label="SSS"
                coverage={coverage.sss}
                onClick={() => setCoverageModal({ benefit: "sss", label: "SSS" })}
              />
              <CoverageRow
                label="PhilHealth (PHIC)"
                coverage={coverage.philHealth}
                onClick={() =>
                  setCoverageModal({ benefit: "philHealth", label: "PhilHealth (PHIC)" })
                }
              />
              <CoverageRow
                label="Pag-IBIG (HDMF)"
                coverage={coverage.pagIbig}
                onClick={() =>
                  setCoverageModal({ benefit: "pagIbig", label: "Pag-IBIG (HDMF)" })
                }
              />
              <CoverageRow
                label="TIN"
                coverage={coverage.tin}
                onClick={() => setCoverageModal({ benefit: "tin", label: "TIN" })}
              />
            </div>
          </article>

          <article className="sibs-card rounded-2xl border border-sibs-border bg-white p-4 shadow-xs font-jakarta sm:p-5 2xl:p-6">
            <div className="border-b border-sibs-border pb-4">
              <h2 className="font-heading text-sm font-bold tracking-tight text-sibs-navy 2xl:text-base">
                Finance Quick Access
              </h2>
              <p className="mt-1 sibs-text-xs font-semibold text-sibs-muted">
                Open the HRIS modules already available to Finance access.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <QuickAction
                title="Employee Directory"
                description="Review company employee records."
                icon={Users}
                onClick={() => navigate("/employee")}
              />
              <QuickAction
                title="Time & Attendance"
                description="Review employee time records."
                icon={Clock3}
                onClick={() => navigate("/attendance")}
              />
              <QuickAction
                title="Leaves"
                description="Review employee leave records."
                icon={CalendarDays}
                onClick={() => navigate("/leaves")}
              />
              <QuickAction
                title="Approval Requests"
                description="Open Finance-authorized approvals."
                icon={ClipboardCheck}
                onClick={() => navigate("/approval-request")}
              />
            </div>
          </article>
        </section>

        <section
          className="sibs-page-card-in sibs-card min-h-[420px] overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-xs font-jakarta"
          style={getAnimationStyle(animationTiming.table)}
        >
          <div className="flex flex-col gap-3 border-b border-sibs-border p-4 sm:p-5 2xl:p-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-heading text-sm font-bold tracking-tight text-sibs-navy 2xl:text-base">
                Payroll Readiness by Account
              </h2>
              <p className="mt-1 sibs-text-xs font-semibold text-sibs-muted">
                Active employee statutory readiness grouped by HRIS Account and Department.
              </p>
            </div>

            <div className="w-full lg:w-[340px]">
              <SearchInput
                label="Search"
                labelClassName="sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
                value={search}
                onChange={setSearch}
                placeholder="Search account or department..."
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 p-4 sm:p-5 2xl:p-6">
            <div className="overflow-hidden rounded-xl border border-sibs-border bg-white shadow-xs">
              <ResponsiveTableShell
                mobileContent={
                  <div className="space-y-3 p-3.5 sm:p-4">
                    {pageRows.length > 0 ? (
                      pageRows.map((row) => (
                        <article
                          key={`${row.department}-${row.account}`}
                          className="rounded-xl border border-sibs-border bg-white p-4 font-jakarta shadow-xs transition-colors hover:bg-sibs-cream-light"
                        >
                          <div className="flex items-start justify-between gap-3 border-b border-sibs-border pb-3">
                            <div className="min-w-0">
                              <h3 className="font-heading text-sm font-extrabold text-sibs-navy">
                                {row.account}
                              </h3>
                              <p className="mt-1 sibs-text-xs font-semibold text-sibs-muted">
                                {row.department}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-lg border border-sibs-border bg-sibs-surface px-2 py-1 sibs-text-xs font-extrabold tabular-nums text-sibs-navy">
                              {formatPercent(row.readinessPercentage)}
                            </span>
                          </div>
                          <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                            <div>
                              <dt className="sibs-text-micro font-extrabold uppercase text-sibs-muted">Employees</dt>
                              <dd className="mt-1 sibs-text-xs font-extrabold text-sibs-navy">{formatNumber(row.activeEmployees)}</dd>
                            </div>
                            <div>
                              <dt className="sibs-text-micro font-extrabold uppercase text-sibs-muted">Payroll Ready</dt>
                              <dd className="mt-1 sibs-text-xs font-extrabold text-emerald-700">{formatNumber(row.payrollReady)}</dd>
                            </div>
                            <div>
                              <dt className="sibs-text-micro font-extrabold uppercase text-sibs-muted">Incomplete</dt>
                              <dd className="mt-1 sibs-text-xs font-extrabold text-amber-700">{formatNumber(row.incompleteProfiles)}</dd>
                            </div>
                          </dl>
                        </article>
                      ))
                    ) : (
                      <div className="px-4 py-12 text-center">
                        <Building2 className="mx-auto h-6 w-6 text-sibs-faint" />
                        <p className="mt-2 text-sm font-extrabold text-sibs-navy">No matching accounts found</p>
                        <p className="mt-1 sibs-text-xs font-semibold text-sibs-muted">Adjust the account or department search.</p>
                      </div>
                    )}
                  </div>
                }
                desktopContent={
                  <div className="overflow-hidden bg-white">
                    <div ref={tableScrollRef} className="max-h-[480px] overflow-auto sibs-scrollbar 2xl:max-h-[640px]">
                      <table className="w-full min-w-[820px] table-fixed border-collapse text-left">
                        <thead className="sticky top-0 z-10 bg-sibs-surface">
                          <tr className="border-b border-sibs-border">
                            <th scope="col" className="w-[24%] px-3 py-2.5 sibs-text-micro font-extrabold uppercase tracking-wider text-sibs-muted 2xl:px-4 2xl:py-3">Account</th>
                            <th scope="col" className="w-[24%] px-3 py-2.5 sibs-text-micro font-extrabold uppercase tracking-wider text-sibs-muted 2xl:px-4 2xl:py-3">Department</th>
                            <th scope="col" className="w-[13%] px-3 py-2.5 text-center sibs-text-micro font-extrabold uppercase tracking-wider text-sibs-muted 2xl:px-4 2xl:py-3">Employees</th>
                            <th scope="col" className="w-[14%] px-3 py-2.5 text-center sibs-text-micro font-extrabold uppercase tracking-wider text-sibs-muted 2xl:px-4 2xl:py-3">Payroll Ready</th>
                            <th scope="col" className="w-[13%] px-3 py-2.5 text-center sibs-text-micro font-extrabold uppercase tracking-wider text-sibs-muted 2xl:px-4 2xl:py-3">Incomplete</th>
                            <th scope="col" className="w-[12%] px-3 py-2.5 text-right sibs-text-micro font-extrabold uppercase tracking-wider text-sibs-muted 2xl:px-4 2xl:py-3">Readiness</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sibs-border bg-white">
                          {pageRows.length > 0 ? (
                            pageRows.map((row) => (
                              <tr
                                key={`${row.department}-${row.account}`}
                                className="group sibs-text-xs text-sibs-muted transition-colors hover:bg-sibs-cream-light"
                              >
                                <td className="px-3 py-2 align-middle font-extrabold text-sibs-navy transition-colors group-hover:text-sibs-orange 2xl:px-4 2xl:py-2.5">
                                  {row.account}
                                </td>
                                <td className="px-3 py-2 align-middle font-semibold 2xl:px-4 2xl:py-2.5">
                                  {row.department}
                                </td>
                                <td className="px-3 py-2 text-center align-middle font-bold 2xl:px-4 2xl:py-2.5">
                                  {formatNumber(row.activeEmployees)}
                                </td>
                                <td className="px-3 py-2 text-center align-middle font-bold text-emerald-700 2xl:px-4 2xl:py-2.5">
                                  {formatNumber(row.payrollReady)}
                                </td>
                                <td className="px-3 py-2 text-center align-middle font-bold text-amber-700 2xl:px-4 2xl:py-2.5">
                                  {formatNumber(row.incompleteProfiles)}
                                </td>
                                <td className="px-3 py-2 text-right align-middle 2xl:px-4 2xl:py-2.5">
                                  <span className="inline-flex min-w-[68px] justify-center rounded-lg border border-sibs-border bg-sibs-surface px-2.5 py-1 font-extrabold tabular-nums text-sibs-navy">
                                    {formatPercent(row.readinessPercentage)}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-4 py-14 text-center">
                                <Building2 className="mx-auto h-6 w-6 text-sibs-faint" />
                                <p className="mt-2 text-sm font-extrabold text-sibs-navy">No matching accounts found</p>
                                <p className="mt-1 sibs-text-xs font-semibold text-sibs-muted">Adjust the account or department search.</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                }
              />
            </div>
          </div>

          <div className="shrink-0 px-4 pb-4 sm:px-5 sm:pb-5">
            <TablePagination
              currentPage={safePage}
              totalPages={totalPages}
              totalRecords={filteredAccounts.length}
              pageSize={PAGE_SIZE}
              loadedCount={pageRows.length}
              recordLabel="account / department groups"
              onPageChange={handleTablePageChange}
            />
          </div>
        </section>
        </div>
      </main>

      {coverageModal && (
        <Suspense fallback={null}>
          <StatutoryCoverageModal
            open={Boolean(coverageModal)}
            onClose={() => setCoverageModal(null)}
            benefit={coverageModal?.benefit}
            label={coverageModal?.label}
            coverage={
              coverageModal?.benefit
                ? coverage?.[coverageModal.benefit]
                : null
            }
          />
        </Suspense>
      )}
    </div>
  );
}
