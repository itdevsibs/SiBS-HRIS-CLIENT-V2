import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";

import StatutoryCoverageModal from "../FinanceDashboard/StatutoryCoverageModal";
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

function CoverageSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-xl border border-[#E6ECF2] bg-[#FBFCFE] p-4"
        >
          <div className="h-4 w-32 rounded bg-[#DDE6EF]" />
          <div className="mt-2 h-3 w-52 rounded bg-[#E7EDF3]" />
          <div className="mt-4 h-2 w-full rounded-full bg-[#E1E8F0]" />
          <div className="mt-3 h-3 w-44 rounded bg-[#E7EDF3]" />
        </div>
      ))}
    </div>
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
        className={`rounded-2xl border border-[#DCE5EE] bg-white p-5 shadow-sm ${className}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#EEF2F6] pb-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E9F0FC] text-[#042C51]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-[#042C51]">
                Statutory Coverage
              </h2>
              <p className="mt-1 text-xs font-medium text-[#667085]">
                Completion counts only. Government ID values are not displayed on this dashboard.
              </p>
              {!loading && !error && activeEmployees > 0 ? (
                <p className="mt-1 text-[11px] font-semibold text-[#98A2B3]">
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
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#DCE5EE] bg-white text-[#042C51] transition hover:border-[#FFB59C] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="mt-4">
          {loading ? <CoverageSkeleton /> : null}

          {!loading && error ? (
            <div className="flex min-h-[150px] flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-5 text-center">
              <AlertCircle className="h-6 w-6 text-amber-600" />
              <p className="mt-2 text-sm font-extrabold text-[#042C51]">
                Unable to load statutory coverage
              </p>
              <p className="mt-1 max-w-xl text-xs font-medium text-[#667085]">
                {error}
              </p>
              <button
                type="button"
                onClick={() => loadCoverage({ forceRefresh: true })}
                className="mt-3 rounded-lg border border-[#DCE5EE] bg-white px-3 py-2 text-xs font-extrabold text-[#042C51] hover:border-[#FFB59C] hover:text-[#FF5C28]"
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
    </>
  );
}
