import React, { useMemo, useState } from "react";
import {
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  Award,
  Calendar,
  Clock,
  UserCheck,
  FileText,
  Percent,
} from "lucide-react";

import {
  DataCard,
  ModalShell,
  ResponsiveTableShell,
  TableEmptyRow,
  TablePagination,
  TableSkeletonRows,
} from "@/components/ui";
import PaginationTable from "@/services/pagination/PaginationTable";

import {
  filterQdsTrainees,
  paginateQdsTrainees,
  calculateTraineeQualityScore,
} from "@/lib/utils/Dashboards/QDSDashboard/qdsDashboardHelpers";

const PHASE_OPTIONS = [
  { label: "All Phases", value: "All" },
  { label: "NHO", value: "NHO" },
  { label: "FST", value: "FST" },
  { label: "PST", value: "PST" },
  { label: "Day 30 Nesting", value: "Day 30 Nesting" },
  { label: "Floor Ready", value: "Floor Ready" },
];

function getPhaseBadgeColor(phase = "") {
  const p = String(phase).toLowerCase();
  if (p.includes("floor") || p.includes("ready")) {
    return "sibs-badge-success";
  }
  if (p.includes("nesting") || p.includes("day 30")) {
    return "sibs-badge-warning";
  }
  if (p.includes("pst")) {
    return "sibs-badge-info";
  }
  return "sibs-badge-neutral";
}

function getVarianceBadge(gap) {
  if (gap === null || gap === undefined || !Number.isFinite(Number(gap))) {
    return (
      <span className="sibs-badge-neutral font-bold">
        —
      </span>
    );
  }

  const numGap = Number(gap);
  const formatted = numGap > 0 ? `+${numGap} pp` : `${numGap} pp`;

  if (Math.abs(numGap) >= 10) {
    return (
      <span className="sibs-badge-danger font-bold">
        <AlertCircle className="h-3 w-3 shrink-0" />
        {formatted}
      </span>
    );
  }

  if (Math.abs(numGap) <= 5) {
    return (
      <span className="sibs-badge-success font-bold">
        <CheckCircle2 className="h-3 w-3 shrink-0" />
        {formatted}
      </span>
    );
  }

  return (
    <span className="sibs-badge-warning font-bold">
      <AlertTriangle className="h-3 w-3 shrink-0" />
      {formatted}
    </span>
  );
}

/**
 * TraineeScorecardModal
 * Drill-down inspector for comprehensive trainee evaluation.
 */
function TraineeScorecardModal({ trainee, onClose }) {
  if (!trainee) return null;

  const scoreDetails = calculateTraineeQualityScore(trainee);
  const trainerScore = scoreDetails.trainerScore ?? trainee.trainerScore ?? "—";
  const qaScore = scoreDetails.qaScore ?? trainee.qaScore ?? "—";
  const simScore = scoreDetails.simScore ?? trainee.simScore ?? "—";
  const composite = scoreDetails.composite ?? trainee.composite ?? "—";
  const gap = scoreDetails.calibrationGap ?? trainee.calibrationGap;

  const isLargeGap = gap !== null && Math.abs(gap) >= 10;
  const isCalibrated = gap !== null && Math.abs(gap) <= 5;

  return (
    <ModalShell
      open={Boolean(trainee)}
      onClose={onClose}
      variant="navy"
      icon={Award}
      title="Trainee Quality Scorecard & Audit Breakdown"
      subtitle={`${trainee.fullName} (${trainee.sibsEmployeeId || trainee.id || "N/A"}) · ${trainee.account || "Unassigned"}`}
      maxWidth="max-w-[700px] 2xl:max-w-3xl"
      className="flex flex-col max-h-[90vh]"
      bodyClassName="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5 text-sibs-navy font-jakarta"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="sibs-btn-secondary w-full sm:w-auto"
        >
          Close Scorecard
        </button>
      }
    >
      {/* Trainee Meta Snapshot */}
      <div className="flex flex-col gap-3 rounded-xl border border-sibs-border bg-sibs-surface p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-base font-bold text-sibs-navy">
              {trainee.fullName}
            </h3>
            <span className="font-mono text-xs font-extrabold text-sibs-orange">
              {trainee.sibsEmployeeId || trainee.id}
            </span>
          </div>
          <p className="mt-0.5 text-xs font-semibold text-sibs-muted">
            {trainee.account} · Assigned Trainer: <strong className="text-sibs-navy">{trainee.trainerName || "Unassigned"}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={getPhaseBadgeColor(trainee.trainingPhase)}>
            {trainee.trainingPhase || "Training"}
          </span>
        </div>
      </div>

      {/* 4 Score Pillars */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-xl border border-sibs-border bg-white p-3 text-center shadow-2xs">
          <span className="block sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-muted">
            Trainer Score
          </span>
          <span className="font-heading text-xl font-extrabold tabular-nums text-sibs-navy mt-1 block">
            {trainerScore !== "—" ? `${trainerScore}%` : "—"}
          </span>
          <span className="text-[10px] font-semibold text-sibs-faint block mt-0.5">Weight: 35%</span>
        </div>

        <div className="rounded-xl border border-sibs-border bg-white p-3 text-center shadow-2xs">
          <span className="block sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-muted">
            Independent QA
          </span>
          <span className="font-heading text-xl font-extrabold tabular-nums text-sibs-orange mt-1 block">
            {qaScore !== "—" ? `${qaScore}%` : "—"}
          </span>
          <span className="text-[10px] font-semibold text-sibs-faint block mt-0.5">Weight: 40%</span>
        </div>

        <div className="rounded-xl border border-sibs-border bg-white p-3 text-center shadow-2xs">
          <span className="block sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-muted">
            Work Simulation
          </span>
          <span className="font-heading text-xl font-extrabold tabular-nums text-sibs-navy mt-1 block">
            {simScore !== "—" ? `${simScore}%` : "—"}
          </span>
          <span className="text-[10px] font-semibold text-sibs-faint block mt-0.5">Weight: 25%</span>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-center shadow-2xs">
          <span className="block sibs-text-micro font-extrabold uppercase tracking-wide text-emerald-800">
            Composite Score
          </span>
          <span className="font-heading text-xl font-extrabold tabular-nums text-emerald-700 mt-1 block">
            {composite !== "—" ? `${composite}%` : "—"}
          </span>
          <span className="text-[10px] font-semibold text-emerald-700/80 block mt-0.5">Target: &gt;= 85%</span>
        </div>
      </div>

      {/* Calibration Gap & Variance Analysis */}
      <div
        className={`rounded-xl border p-4 ${
          isLargeGap
            ? "border-rose-200 bg-rose-50/60"
            : isCalibrated
            ? "border-emerald-200 bg-emerald-50/60"
            : "border-amber-200 bg-amber-50/60"
        }`}
      >
        <div className="flex items-start gap-3">
          {isLargeGap ? (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          ) : isCalibrated ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          )}

          <div className="min-w-0 flex-1">
            <h4
              className={`font-heading text-sm font-bold ${
                isLargeGap
                  ? "text-rose-800"
                  : isCalibrated
                  ? "text-emerald-800"
                  : "text-amber-800"
              }`}
            >
              Trainer vs QDS QA Variance: {gap !== null ? `${gap > 0 ? `+${gap}` : gap} pp` : "No Variance Logged"}
            </h4>
            <p className="sibs-text-xs mt-1 leading-relaxed text-sibs-text-secondary">
              {isLargeGap
                ? "Discrepancy exceeds the strict 10 percentage point calibration threshold. A joint calibration sync between the assigned trainer and QDS quality lead is recommended to reconcile assessment grading criteria."
                : isCalibrated
                ? "Assessment criteria are well-calibrated within the acceptable ±5 percentage point operational tolerance window."
                : "Moderate assessment variance observed. Review scorecard rubric items to ensure alignment prior to floor handover."}
            </p>
          </div>
        </div>
      </div>

      {/* Operational Adherence & Evidence */}
      <div className="rounded-xl border border-sibs-border bg-white p-4 shadow-2xs space-y-3">
        <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-sibs-muted">
          Operational Adherence & Audit Logs
        </h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
          <div>
            <span className="text-sibs-muted block font-medium">Attendance Rate</span>
            <span className="font-heading font-extrabold text-sibs-navy text-sm tabular-nums">
              {trainee.attendanceRate ?? 95}%
            </span>
          </div>
          <div>
            <span className="text-sibs-muted block font-medium">Audit Status</span>
            <span className="font-semibold text-sibs-navy">
              {trainee.auditStatus || "Completed"}
            </span>
          </div>
          <div>
            <span className="text-sibs-muted block font-medium">Coaching Status</span>
            <span className="font-semibold text-sibs-navy">
              {trainee.coachingStatus || "None"}
            </span>
          </div>
          <div>
            <span className="text-sibs-muted block font-medium">Last Audit Date</span>
            <span className="font-semibold text-sibs-navy">
              {trainee.lastAuditDate || "2026-10-24"}
            </span>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

/**
 * QDSTraineeAuditTable Component
 * Tier 4 Tactical Operations Data Grid.
 */
export default function QDSTraineeAuditTable({
  trainees = [],
  loading = false,
  pageSize = 6,
  className = "",
}) {
  const [search, setSearch] = useState("");
  const [trainerFilter, setTrainerFilter] = useState("All");
  const [phaseFilter, setPhaseFilter] = useState("All");
  const [accountFilter, setAccountFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTrainee, setSelectedTrainee] = useState(null);

  // Distinct Trainers
  const trainerOptions = useMemo(() => {
    const list = [{ label: "All Trainers", value: "All" }];
    trainees.forEach((t) => {
      if (t.trainerName && !list.some((opt) => opt.value === t.trainerName)) {
        list.push({ label: t.trainerName, value: t.trainerName });
      }
    });
    return list;
  }, [trainees]);

  // Distinct Accounts
  const accountOptions = useMemo(() => {
    const list = [{ label: "All Accounts", value: "All" }];
    trainees.forEach((t) => {
      if (t.account && !list.some((opt) => opt.value === t.account)) {
        list.push({ label: t.account, value: t.account });
      }
    });
    return list;
  }, [trainees]);

  const hasActiveFilters = Boolean(
    search.trim() ||
      trainerFilter !== "All" ||
      phaseFilter !== "All" ||
      accountFilter !== "All",
  );

  const handleClearFilters = () => {
    setSearch("");
    setTrainerFilter("All");
    setPhaseFilter("All");
    setAccountFilter("All");
    setCurrentPage(1);
  };

  // Filter trainees
  const filteredTrainees = useMemo(() => {
    return filterQdsTrainees(trainees, {
      search,
      trainer: trainerFilter,
      phase: phaseFilter,
      account: accountFilter,
    });
  }, [trainees, search, trainerFilter, phaseFilter, accountFilter]);

  // Paginate trainees
  const { items: paginatedTrainees, pagination } = useMemo(() => {
    return paginateQdsTrainees(filteredTrainees, currentPage, pageSize);
  }, [filteredTrainees, currentPage, pageSize]);

  return (
    <section
      className={`sibs-card min-w-0 overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-xs font-jakarta ${className}`.trim()}
    >
      {/* Card Header & Dedicated Filter Bar */}
      <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6 font-jakarta">
        <div>
          <h3 className="sibs-section-title">Trainee Quality Audit Matrix</h3>
          <p className="sibs-section-subtitle mt-0.5">
            Comprehensive quality scorecards, work simulation, attendance adherence, and calibration logs.
          </p>
        </div>

        <PaginationTable
          filterLayout="ta-inline"
          showFilterPanel={false}
          showFilterHeader={false}
          showPagination={false}
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search trainee, SIBS ID, trainer, or account..."
          filters={[
            {
              key: "trainer",
              label: "Trainer",
              value: trainerFilter,
              options: trainerOptions,
              allLabel: "All Trainers",
              includeAll: false,
              searchable: true,
              onChange: (val) => {
                setTrainerFilter(val);
                setCurrentPage(1);
              },
            },
            {
              key: "phase",
              label: "Training Phase",
              value: phaseFilter,
              options: PHASE_OPTIONS,
              allLabel: "All Phases",
              includeAll: false,
              searchable: false,
              onChange: (val) => {
                setPhaseFilter(val);
                setCurrentPage(1);
              },
            },
            {
              key: "account",
              label: "Account",
              value: accountFilter,
              options: accountOptions,
              allLabel: "All Accounts",
              includeAll: false,
              searchable: true,
              onChange: (val) => {
                setAccountFilter(val);
                setCurrentPage(1);
              },
            },
          ]}
          className="mt-3.5 border-0 bg-transparent p-0 shadow-none 2xl:mt-4"
          rightContent={
            <button
              type="button"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-sibs-border disabled:hover:bg-white disabled:hover:text-sibs-muted xl:w-auto"
              title="Reset active search and filters"
            >
              <RotateCcw size={14} />
              <span>Clear</span>
            </button>
          }
        />
      </div>

      {/* Body: Responsive Table & Mobile Cards */}
      <div className="p-3 sm:p-5 2xl:p-6 font-jakarta">
        <ResponsiveTableShell
          desktopContent={
            <div className="overflow-hidden rounded-xl border border-sibs-border bg-white">
              <div className="max-h-[520px] overflow-auto sibs-scrollbar">
                <table className="w-full min-w-[1020px] border-collapse bg-white text-left text-xs">
                  <thead className="sibs-data-table-head sticky top-0 z-10 bg-sibs-surface">
                    <tr className="sibs-data-table-head-row">
                      <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">
                        Trainee
                      </th>
                      <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">
                        Trainer
                      </th>
                      <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">
                        Training Phase
                      </th>
                      <th className="sibs-data-table-th text-center px-3 2xl:px-4 py-2.5 2xl:py-3">
                        Trainer Score
                      </th>
                      <th className="sibs-data-table-th text-center px-3 2xl:px-4 py-2.5 2xl:py-3">
                        Independent QA
                      </th>
                      <th className="sibs-data-table-th text-center px-3 2xl:px-4 py-2.5 2xl:py-3">
                        Work Simulation
                      </th>
                      <th className="sibs-data-table-th text-center px-3 2xl:px-4 py-2.5 2xl:py-3">
                        Composite Score
                      </th>
                      <th className="sibs-data-table-th text-center px-3 2xl:px-4 py-2.5 2xl:py-3">
                        QA Variance
                      </th>
                      <th className="sibs-data-table-th text-center px-3 2xl:px-4 py-2.5 2xl:py-3">
                        Attendance Rate
                      </th>
                      <th className="sibs-data-table-th text-center px-3 2xl:px-4 py-2.5 2xl:py-3">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-sibs-border">
                    {loading ? (
                      <TableSkeletonRows count={pageSize} columns={10} />
                    ) : paginatedTrainees.length === 0 ? (
                      <TableEmptyRow
                        colSpan={10}
                        title="No Trainees Found"
                        description="Try adjusting your search criteria or filter selections."
                        actionLabel={hasActiveFilters ? "Clear Filters" : undefined}
                        onAction={hasActiveFilters ? handleClearFilters : undefined}
                      />
                    ) : (
                      paginatedTrainees.map((trainee, index) => {
                        const scoreData = calculateTraineeQualityScore(trainee);
                        const trScore = scoreData.trainerScore ?? trainee.trainerScore;
                        const qaScore = scoreData.qaScore ?? trainee.qaScore;
                        const simScore = scoreData.simScore ?? trainee.simScore;
                        const composite = scoreData.composite ?? trainee.composite;
                        const gap = scoreData.calibrationGap ?? trainee.calibrationGap;

                        return (
                          <tr
                            key={trainee.id || trainee.sibsEmployeeId || index}
                            onClick={() => setSelectedTrainee(trainee)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedTrainee(trainee);
                              }
                            }}
                            tabIndex={0}
                            role="button"
                            className="sibs-data-table-row cursor-pointer transition-colors hover:bg-sibs-surface/70"
                          >
                            {/* Trainee */}
                            <td className="sibs-data-table-td px-3 2xl:px-4 py-2.5 2xl:py-3">
                              <div className="font-extrabold text-sibs-navy">
                                {trainee.fullName}
                              </div>
                              <div className="mt-0.5 flex items-center gap-1.5">
                                <span className="font-mono text-[10px] font-bold text-sibs-orange">
                                   {trainee.sibsEmployeeId || trainee.id}
                                </span>
                                <span className="text-[10px] text-sibs-muted">
                                  · {trainee.account}
                                </span>
                              </div>
                            </td>

                            {/* Trainer */}
                            <td className="sibs-data-table-td px-3 2xl:px-4 py-2.5 2xl:py-3 font-semibold text-sibs-navy">
                              {trainee.trainerName || "Unassigned"}
                            </td>

                            {/* Phase */}
                            <td className="sibs-data-table-td px-3 2xl:px-4 py-2.5 2xl:py-3">
                              <span className={getPhaseBadgeColor(trainee.trainingPhase)}>
                                {trainee.trainingPhase || "Training"}
                              </span>
                            </td>

                            {/* Trainer Score */}
                            <td className="sibs-data-table-td px-3 2xl:px-4 py-2.5 2xl:py-3 text-center font-heading font-extrabold tabular-nums text-sibs-navy">
                              {trScore !== null && trScore !== undefined ? `${trScore}%` : "—"}
                            </td>

                            {/* Independent QA */}
                            <td className="sibs-data-table-td px-3 2xl:px-4 py-2.5 2xl:py-3 text-center font-heading font-extrabold tabular-nums text-sibs-orange">
                              {qaScore !== null && qaScore !== undefined ? `${qaScore}%` : "—"}
                            </td>

                            {/* Work Simulation */}
                            <td className="sibs-data-table-td px-3 2xl:px-4 py-2.5 2xl:py-3 text-center font-heading font-extrabold tabular-nums text-sibs-navy">
                              {simScore !== null && simScore !== undefined ? `${simScore}%` : "—"}
                            </td>

                            {/* Composite Score */}
                            <td className="sibs-data-table-td px-3 2xl:px-4 py-2.5 2xl:py-3 text-center font-heading text-sm font-extrabold tabular-nums text-emerald-700">
                              {composite !== null && composite !== undefined ? `${composite}%` : "—"}
                            </td>

                            {/* QA Variance */}
                            <td className="sibs-data-table-td px-3 2xl:px-4 py-2.5 2xl:py-3 text-center">
                              {getVarianceBadge(gap)}
                            </td>

                            {/* Attendance Rate */}
                            <td className="sibs-data-table-td px-3 2xl:px-4 py-2.5 2xl:py-3 text-center font-heading font-bold tabular-nums text-sibs-navy">
                              {trainee.attendanceRate ?? 95}%
                            </td>

                            {/* Actions */}
                            <td
                              className="sibs-data-table-td px-3 2xl:px-4 py-2.5 2xl:py-3 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedTrainee(trainee)}
                                className="sibs-btn-secondary h-8 px-3 text-xs font-bold"
                                title="Inspect audit scorecard"
                              >
                                <Eye size={12} className="text-sibs-orange" />
                                Scorecard
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          }
          mobileContent={
            loading ? (
              <DataCard.Skeleton count={pageSize} lines={3} />
            ) : paginatedTrainees.length === 0 ? (
              <DataCard.Empty
                title="No Trainees Found"
                description="Try adjusting your search criteria or filter selections."
              />
            ) : (
              <div className="space-y-3">
                {paginatedTrainees.map((trainee, idx) => {
                  const scoreData = calculateTraineeQualityScore(trainee);
                  const trScore = scoreData.trainerScore ?? trainee.trainerScore;
                  const qaScore = scoreData.qaScore ?? trainee.qaScore;
                  const simScore = scoreData.simScore ?? trainee.simScore;
                  const composite = scoreData.composite ?? trainee.composite;
                  const gap = scoreData.calibrationGap ?? trainee.calibrationGap;

                  return (
                    <DataCard
                      key={trainee.id || trainee.sibsEmployeeId || idx}
                      interactive
                      onClick={() => setSelectedTrainee(trainee)}
                    >
                      <DataCard.Header
                        title={trainee.fullName}
                        subtitle={`${trainee.sibsEmployeeId || trainee.id} · ${trainee.account}`}
                        badge={
                          <span className={getPhaseBadgeColor(trainee.trainingPhase)}>
                            {trainee.trainingPhase}
                          </span>
                        }
                      />

                      <DataCard.Metrics cols={4}>
                        <DataCard.MetricItem
                          label="Trainer"
                          value={trScore !== null && trScore !== undefined ? `${trScore}%` : "—"}
                          tone="navy"
                        />
                        <DataCard.MetricItem
                          label="QA Audit"
                          value={qaScore !== null && qaScore !== undefined ? `${qaScore}%` : "—"}
                          tone="orange"
                        />
                        <DataCard.MetricItem
                          label="Work Sim"
                          value={simScore !== null && simScore !== undefined ? `${simScore}%` : "—"}
                          tone="secondary"
                        />
                        <DataCard.MetricItem
                          label="Composite"
                          value={composite !== null && composite !== undefined ? `${composite}%` : "—"}
                          tone="emerald"
                        />
                      </DataCard.Metrics>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-sibs-border pt-2.5 text-[10.5px] font-semibold text-sibs-muted">
                        <div>
                          <span>
                            Trainer: <strong className="text-sibs-navy">{trainee.trainerName || "Unassigned"}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Adherence: <strong className="text-sibs-navy">{trainee.attendanceRate ?? 95}%</strong></span>
                          {getVarianceBadge(gap)}
                        </div>
                      </div>
                    </DataCard>
                  );
                })}
              </div>
            )
          }
        />

        {/* Table Pagination */}
        <div className="mt-4 2xl:mt-5">
          <TablePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalRecords={pagination.total}
            pageSize={pagination.limit}
            onPageChange={setCurrentPage}
            recordLabel="trainees"
            loading={loading}
          />
        </div>
      </div>

      {/* Trainee Scorecard Modal Drilldown */}
      <TraineeScorecardModal
        trainee={selectedTrainee}
        onClose={() => setSelectedTrainee(null)}
      />
    </section>
  );
}
