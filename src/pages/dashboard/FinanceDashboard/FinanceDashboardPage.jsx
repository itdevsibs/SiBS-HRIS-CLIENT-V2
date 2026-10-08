import {
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
  Layers3,
  Percent,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import Header from "../../../components/layout/Header";
import FinanceDashboardSkeleton from "../../../components/Dashboard/FinanceDashboard/FinanceDashboardSkeleton";
import StatutoryCoverageModal from "../../../components/Dashboard/FinanceDashboard/StatutoryCoverageModal";
import { getFinanceDashboardBootstrap } from "../../../lib/axios/getFinanceDashboard";

const PAGE_SHELL_CLASS = "sibs-dashboard-shell";
const MAIN_SHELL_CLASS = "sibs-dashboard-main-wide";
const AUTO_REFRESH_INTERVAL_MS = 60_000;
const CACHE_KEY = "sibs.finance-dashboard.bootstrap.v1";
const CACHE_TTL_MS = 10 * 60_000;
const PAGE_SIZE = 10;

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

function FinanceDashboardErrorState({ message, onRetry }) {
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
            Unable to load Finance Dashboard
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
    green: {
      label: "text-emerald-800",
      value: "text-emerald-700",
      icon: "bg-emerald-50 text-emerald-600",
    },
    amber: {
      label: "text-amber-800",
      value: "text-amber-700",
      icon: "bg-amber-50 text-amber-600",
    },
    violet: {
      label: "text-violet-800",
      value: "text-violet-700",
      icon: "bg-violet-50 text-violet-600",
    },
  };

  const selectedTone = tones[tone] || tones.navy;

  return (
    <article className="rounded-2xl border border-[#DCE5EE] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[10px] font-extrabold uppercase tracking-wide ${selectedTone.label}`}>
            {label}
          </p>
          <p className={`mt-2 text-2xl font-black ${selectedTone.value}`}>
            {value}
          </p>
          <p className="mt-1 line-clamp-1 text-[11px] font-medium text-[#667085]">
            {description}
          </p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${selectedTone.icon}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function CoverageRow({ label, coverage, onClick }) {
  const percentage = Math.min(Math.max(Number(coverage?.percentage || 0), 0), 100);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-xl border border-[#E6ECF2] bg-[#FBFCFE] p-4 text-left transition hover:border-[#FFB59C] hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C28]/15"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-extrabold text-[#042C51]">{label}</p>
          <p className="mt-0.5 text-[11px] font-medium text-[#667085]">
            {formatNumber(coverage?.count)} employees complete · {formatNumber(coverage?.missing)} missing
          </p>
        </div>
        <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-black text-[#042C51] shadow-sm ring-1 ring-[#E6ECF2]">
          {formatPercent(percentage)}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8EEF5]">
        <div
          className="h-full rounded-full bg-[#FF5C28] transition-[width] duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-3 text-[10px] font-extrabold uppercase tracking-wide text-[#98A2B3] transition group-hover:text-[#FF5C28]">
        View complete and missing employees
      </p>
    </button>
  );
}

function QuickAction({ title, description, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[92px] items-center gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-left transition hover:border-[#FFB59C] hover:bg-white hover:shadow-sm"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#042C51] shadow-sm ring-1 ring-[#E6ECF2] transition group-hover:text-[#FF5C28]">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold text-[#042C51]">{title}</span>
        <span className="mt-1 block text-[11px] font-medium leading-4 text-[#667085]">
          {description}
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-[#98A2B3] transition group-hover:translate-x-0.5 group-hover:text-[#FF5C28]" />
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
        const payload = await getFinanceDashboardBootstrap({ forceRefresh });
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

  if (initialLoading && !hasDataRef.current) {
    return <FinanceDashboardSkeleton />;
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

      <main className={`${MAIN_SHELL_CLASS} space-y-4 pb-8`}>
        <section className="relative overflow-hidden rounded-2xl border border-[#DCE5EE] bg-white px-5 py-5 shadow-sm sm:px-6">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#042C51] via-[#FF5C28] to-[#042C51]" />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#DCE5EE] bg-[#F3F7FB] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#042C51]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF5C28]" />
                Finance View
              </span>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-[#042C51]">
                Finance Dashboard
              </h1>
              <p className="mt-1 max-w-3xl text-sm font-medium text-[#667085]">
                Company-wide payroll readiness, statutory coverage, and workforce finance visibility.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start lg:self-auto">
              <span className="hidden rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-extrabold text-emerald-700 sm:inline-flex">
                Read-only company view
              </span>
              <button
                type="button"
                onClick={() =>
                  loadDashboard({ forceRefresh: true, background: true })
                }
                disabled={refreshing}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE5EE] bg-white text-[#042C51] shadow-sm transition hover:border-[#FFB59C] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-60"
                title="Refresh Finance Dashboard"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <MetricCard
            label="Active Employees"
            value={formatNumber(metrics.activeEmployees)}
            description="Employees included in Finance visibility"
            icon={Users}
          />
          <MetricCard
            label="Payroll Ready"
            value={formatNumber(metrics.payrollReady)}
            description="SSS, PhilHealth, Pag-IBIG and TIN complete"
            icon={CheckCircle2}
            tone="green"
          />
          <MetricCard
            label="Incomplete Profiles"
            value={formatNumber(metrics.incompleteProfiles)}
            description="Missing at least one statutory record"
            icon={AlertCircle}
            tone="amber"
          />
          <MetricCard
            label="Readiness Rate"
            value={formatPercent(metrics.readinessPercentage)}
            description="Company-wide statutory readiness"
            icon={Percent}
            tone="violet"
          />
          <MetricCard
            label="Active Accounts"
            value={formatNumber(metrics.activeAccounts)}
            description="Accounts represented by active employees"
            icon={Building2}
          />
          <MetricCard
            label="Departments"
            value={formatNumber(metrics.activeDepartments)}
            description="Departments represented in the workforce"
            icon={Layers3}
          />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-2xl border border-[#DCE5EE] bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3 border-b border-[#EEF2F6] pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9F0FC] text-[#042C51]">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-black text-[#042C51]">
                  Statutory Coverage
                </h2>
                <p className="mt-1 text-xs font-medium text-[#667085]">
                  Completion counts only. Government ID values are not displayed on this dashboard.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
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

          <article className="rounded-2xl border border-[#DCE5EE] bg-white p-5 shadow-sm">
            <div className="border-b border-[#EEF2F6] pb-4">
              <h2 className="text-base font-black text-[#042C51]">
                Finance Quick Access
              </h2>
              <p className="mt-1 text-xs font-medium text-[#667085]">
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

        <section className="overflow-hidden rounded-2xl border border-[#DCE5EE] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#EEF2F6] px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-base font-black text-[#042C51]">
                Payroll Readiness by Account
              </h2>
              <p className="mt-1 text-xs font-medium text-[#667085]">
                Active employee statutory readiness grouped by HRIS Account and Department.
              </p>
            </div>

            <label className="block w-full lg:w-[340px]">
              <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-[#344054]">
                Search
              </span>
              <span className="flex h-10 items-center gap-2 rounded-xl border border-[#D6E0EA] bg-[#F8FAFC] px-3 transition focus-within:border-[#FF5C28] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#FF5C28]/10">
                <Search className="h-4 w-4 shrink-0 text-[#98A2B3]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search account or department..."
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#042C51] outline-none placeholder:font-medium placeholder:text-[#98A2B3]"
                />
              </span>
            </label>
          </div>

          <div className="overflow-x-auto px-5 py-4">
            <div className="min-w-[820px] overflow-hidden rounded-xl border border-[#E6ECF2]">
              <table className="w-full border-collapse text-left">
                <thead className="bg-[#F8FAFC]">
                  <tr className="text-[10px] font-extrabold uppercase tracking-wide text-[#344054]">
                    <th className="px-4 py-3">Account</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3 text-center">Employees</th>
                    <th className="px-4 py-3 text-center">Payroll Ready</th>
                    <th className="px-4 py-3 text-center">Incomplete</th>
                    <th className="px-4 py-3 text-right">Readiness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F6] bg-white">
                  {pageRows.length > 0 ? (
                    pageRows.map((row) => (
                      <tr key={`${row.department}-${row.account}`} className="text-xs text-[#344054] hover:bg-[#FBFCFE]">
                        <td className="px-4 py-3.5 font-extrabold text-[#042C51]">
                          {row.account}
                        </td>
                        <td className="px-4 py-3.5 font-semibold">
                          {row.department}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold">
                          {formatNumber(row.activeEmployees)}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-emerald-700">
                          {formatNumber(row.payrollReady)}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-amber-700">
                          {formatNumber(row.incompleteProfiles)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="inline-flex min-w-[68px] justify-center rounded-lg border border-[#DCE5EE] bg-[#F8FAFC] px-2.5 py-1 font-black text-[#042C51]">
                            {formatPercent(row.readinessPercentage)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-14 text-center">
                        <Building2 className="mx-auto h-6 w-6 text-[#98A2B3]" />
                        <p className="mt-2 text-sm font-extrabold text-[#042C51]">
                          No matching accounts found
                        </p>
                        <p className="mt-1 text-xs font-medium text-[#667085]">
                          Adjust the account or department search.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#EEF2F6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-[#667085]">
              Showing {pageRows.length ? (safePage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(safePage * PAGE_SIZE, filteredAccounts.length)} of {formatNumber(filteredAccounts.length)} accounts
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                disabled={safePage <= 1}
                className="rounded-lg border border-[#DCE5EE] bg-white px-3 py-2 text-xs font-bold text-[#042C51] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="rounded-lg bg-[#FF5C28] px-3 py-2 text-xs font-black text-white">
                {safePage}
              </span>
              <span className="text-xs font-semibold text-[#667085]">
                of {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(page + 1, totalPages))
                }
                disabled={safePage >= totalPages}
                className="rounded-lg border border-[#DCE5EE] bg-white px-3 py-2 text-xs font-bold text-[#042C51] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </main>

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
    </div>
  );
}
