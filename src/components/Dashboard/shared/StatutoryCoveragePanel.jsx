import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";

const StatutoryCoverageModal = lazy(() => import("../FinanceDashboard/StatutoryCoverageModal"));
import { getStatutoryCoverageSummary } from "../../../lib/axios/getFinanceDashboard";

const EMPTY_COVERAGE = Object.freeze({
  sss: { count: 0, missing: 0, percentage: 0 },
  philHealth: { count: 0, missing: 0, percentage: 0 },
  pagIbig: { count: 0, missing: 0, percentage: 0 },
  tin: { count: 0, missing: 0, percentage: 0 },
});

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function formatPercent(value) {
  const number = Number(value || 0);
  return `${Number.isFinite(number) ? number.toFixed(1) : "0.0"}%`;
}

function normalizeCoverage(value = {}) {
  return {
    count: Number(value.count || 0),
    missing: Number(value.missing || 0),
    percentage: Number(value.percentage || 0),
  };
}

function normalizePayload(payload = {}) {
  const coverage = payload?.metrics?.statutoryCoverage || payload?.statutoryCoverage || {};

  return {
    activeEmployees: Number(payload?.metrics?.activeEmployees || payload?.activeEmployees || 0),
    statutoryCoverage: {
      sss: normalizeCoverage(coverage.sss),
      philHealth: normalizeCoverage(coverage.philHealth),
      pagIbig: normalizeCoverage(coverage.pagIbig),
      tin: normalizeCoverage(coverage.tin),
    },
  };
}

function CoverageRow({ label, coverage, onClick }) {
  const percentage = Math.min(
    Math.max(Number(coverage?.percentage || 0), 0),
    100,
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-[10px] border border-sibs-border bg-sibs-surface p-4 text-left transition hover:border-sibs-orange/40 hover:bg-white hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-sibs-orange/15 font-jakarta"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="sibs-text-sm font-extrabold text-sibs-navy">{label}</p>
          <p className="mt-0.5 sibs-text-micro font-medium text-sibs-muted">
            {formatNumber(coverage?.count)} employees complete · {formatNumber(coverage?.missing)} missing
          </p>
        </div>
        <span className="rounded-[10px] bg-white px-2.5 py-1 sibs-text-xs font-black text-sibs-navy shadow-xs ring-1 ring-sibs-border">
          {formatPercent(percentage)}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-sibs-border-subtle">
        <div
          className="h-full rounded-full bg-sibs-orange transition-[width] duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-3 sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-faint transition group-hover:text-sibs-orange">
        View complete and missing employees
      </p>
    </button>
  );
}

function CoverageSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[10px] border border-sibs-border bg-sibs-surface p-4"
        >
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-52 rounded bg-slate-100" />
          <div className="mt-4 h-2 w-full rounded-full bg-slate-200" />
          <div className="mt-3 h-3 w-44 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function StatutoryCoverageSkeleton({ className = "" }) {
  return (
    <article
      data-testid="statutory-coverage-skeleton"
      aria-hidden="true"
      className={`sibs-card sibs-page-card-in rounded-[14px] border border-sibs-border bg-white p-4 sm:p-5 shadow-xs font-jakarta ${className}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-sibs-border pb-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-[10px] bg-slate-100 animate-pulse" />
          <div className="space-y-1.5 pt-0.5">
            <div className="h-4 w-36 rounded bg-slate-200 animate-pulse" />
            <div className="h-3 w-64 max-w-[60vw] rounded bg-slate-100 animate-pulse" />
          </div>
        </div>
        <div className="h-9 w-9 shrink-0 rounded-[10px] bg-slate-100 animate-pulse" />
      </div>

      <div className="mt-4">
        <CoverageSkeleton />
      </div>
    </article>
  );
}

export default function StatutoryCoveragePanel({
  className = "",
  modalBadge = "HRIS · Active Employees",
}) {
  const [coverage, setCoverage] = useState(EMPTY_COVERAGE);
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [coverageModal, setCoverageModal] = useState(null);
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadCoverage = useCallback(async ({ forceRefresh = false } = {}) => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    if (forceRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const payload = await getStatutoryCoverageSummary({ forceRefresh });
      if (!mountedRef.current) return;

      const normalized = normalizePayload(payload);
      setCoverage(normalized.statutoryCoverage);
      setActiveEmployees(normalized.activeEmployees);
      setError("");
    } catch (loadError) {
      if (!mountedRef.current) return;
      setError(
        loadError?.response?.data?.message ||
          loadError?.message ||
          "Unable to load statutory coverage.",
      );
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadCoverage();
  }, [loadCoverage]);

  return (
    <>
      <article
        className={`sibs-card sibs-page-card-in rounded-[14px] border border-sibs-border bg-white p-4 sm:p-5 shadow-xs font-jakarta ${className}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-sibs-border pb-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-blue-50 text-sibs-navy">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="sibs-card-title text-sibs-navy">
                Statutory Coverage
              </h2>
              <p className="sibs-card-subtitle mt-0.5 text-sibs-muted">
                Completion counts only. Government ID values are not displayed on this dashboard.
              </p>
              {!loading && !error && activeEmployees > 0 ? (
                <p className="mt-1 sibs-text-micro font-semibold text-sibs-faint">
                  {formatNumber(activeEmployees)} active employees included.
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadCoverage({ forceRefresh: true })}
            disabled={loading || refreshing}
            title="Refresh statutory coverage"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-sibs-border bg-white text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="mt-4">
          {loading ? <CoverageSkeleton /> : null}

          {!loading && error ? (
            <div className="flex min-h-[150px] flex-col items-center justify-center rounded-[10px] border border-amber-200 bg-amber-50 px-5 text-center">
              <AlertCircle className="h-6 w-6 text-amber-600" />
              <p className="mt-2 text-sm font-extrabold text-sibs-navy">
                Unable to load statutory coverage
              </p>
              <p className="mt-1 max-w-xl text-xs font-medium text-sibs-muted">
                {error}
              </p>
              <button
                type="button"
                onClick={() => loadCoverage({ forceRefresh: true })}
                className="mt-3 rounded-[10px] border border-sibs-border bg-white px-3 py-2 text-xs font-extrabold text-sibs-navy hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange"
              >
                Retry
              </button>
            </div>
          ) : null}

          {!loading && !error ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <CoverageRow
                label="SSS"
                coverage={coverage.sss}
                onClick={() => setCoverageModal({ benefit: "sss", label: "SSS" })}
              />
              <CoverageRow
                label="PhilHealth (PHIC)"
                coverage={coverage.philHealth}
                onClick={() =>
                  setCoverageModal({
                    benefit: "philHealth",
                    label: "PhilHealth (PHIC)",
                  })
                }
              />
              <CoverageRow
                label="Pag-IBIG (HDMF)"
                coverage={coverage.pagIbig}
                onClick={() =>
                  setCoverageModal({
                    benefit: "pagIbig",
                    label: "Pag-IBIG (HDMF)",
                  })
                }
              />
              <CoverageRow
                label="TIN"
                coverage={coverage.tin}
                onClick={() => setCoverageModal({ benefit: "tin", label: "TIN" })}
              />
            </div>
          ) : null}
        </div>
      </article>

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
            badge={modalBadge}
          />
        </Suspense>
      )}
    </>
  );
}
