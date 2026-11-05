import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveTableShell,
  SelectDropdown,
  TableEmptyRow,
  TableSkeletonRows,
  DataCard,
} from "@/components/ui";

/**
 * QDSTrainerCalibration Component
 * Tier 3 Strategic Analytics (left column of dual-column layout).
 * Evaluates variance between trainer self-assessment and QDS independent audits in an enterprise-grade table.
 */
export default function QDSTrainerCalibration({
  trainerSummaries = [],
  loading = false,
  selectedTrainer: controlledTrainer,
  onTrainerSelect,
  className = "",
}) {
  const [internalTrainer, setInternalTrainer] = useState("All");
  const activeTrainer = controlledTrainer !== undefined ? controlledTrainer : internalTrainer;

  const handleTrainerChange = (val) => {
    setInternalTrainer(val);
    onTrainerSelect?.(val);
  };

  const trainerOptions = useMemo(() => {
    const list = [
      { label: "All Trainers", value: "All" },
    ];
    trainerSummaries.forEach((ts) => {
      if (ts.trainerName && !list.some((opt) => opt.value === ts.trainerName)) {
        list.push({
          label: ts.trainerName,
          value: ts.trainerName,
        });
      }
    });
    return list;
  }, [trainerSummaries]);

  const filteredSummaries = useMemo(() => {
    if (!activeTrainer || activeTrainer === "All") {
      return trainerSummaries;
    }
    return trainerSummaries.filter((ts) => ts.trainerName === activeTrainer);
  }, [trainerSummaries, activeTrainer]);

  return (
    <div
      className={`sibs-card min-w-0 p-4 sm:p-5 2xl:p-6 font-jakarta rounded-2xl border border-sibs-border bg-white shadow-xs ${className}`.trim()}
    >
      {/* Header with Title, Subtitle, and Interactive Trainer Filter */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between border-b border-sibs-border pb-4 mb-4">
        <div>
          <h3 className="sibs-section-title">
            Trainer Calibration & Audit Dispersion
          </h3>
          <p className="sibs-section-subtitle">
            Variance between trainer self-assessed grades and QDS independent quality audits.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="w-full sm:w-[190px] 2xl:w-[220px]">
            <SelectDropdown
              label="Filter Trainer"
              hideLabel
              value={activeTrainer}
              options={trainerOptions}
              onChange={handleTrainerChange}
              disabled={loading}
              clearable={false}
              className="w-full"
            />
          </div>
          {activeTrainer !== "All" && (
            <button
              type="button"
              onClick={() => handleTrainerChange("All")}
              className="sibs-btn-secondary h-8.5 px-2.5 text-xs font-bold"
              title="Reset trainer filter"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Responsive Table Shell: Desktop Table + Mobile Cards */}
      <ResponsiveTableShell
        desktopContent={
          <div className="overflow-hidden rounded-xl border border-sibs-border bg-white">
            <div className="max-h-[460px] overflow-auto sibs-scrollbar">
              <table className="w-full min-w-[620px] border-collapse bg-white text-left text-xs font-jakarta">
                <thead className="sibs-data-table-head sticky top-0 z-10 bg-sibs-surface">
                  <tr className="sibs-data-table-head-row">
                    <th className="sibs-data-table-th text-left px-3 py-2.5 2xl:px-4 2xl:py-3">
                      Trainer / Cohort
                    </th>
                    <th className="sibs-data-table-th text-center px-2 py-2.5 2xl:px-3 2xl:py-3">
                      Trainer Score
                    </th>
                    <th className="sibs-data-table-th text-center px-2 py-2.5 2xl:px-3 2xl:py-3">
                      QA Audit
                    </th>
                    <th className="sibs-data-table-th text-center px-3 py-2.5 2xl:px-4 2xl:py-3">
                      Calibration Gap
                    </th>
                    <th className="sibs-data-table-th text-center px-2 py-2.5 2xl:px-3 2xl:py-3">
                      Composite
                    </th>
                    <th className="sibs-data-table-th text-center px-2 py-2.5 2xl:px-3 2xl:py-3">
                      Adherence
                    </th>
                    <th className="sibs-data-table-th text-center px-2 py-2.5 2xl:px-3 2xl:py-3">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-sibs-border">
                  {loading ? (
                    <TableSkeletonRows count={3} columns={7} />
                  ) : filteredSummaries.length === 0 ? (
                    <TableEmptyRow
                      colSpan={7}
                      title="No Trainer Calibration Data"
                      description="No trainer metrics match the active filter. Please select All Trainers or check trainee assignments."
                      actionLabel={activeTrainer !== "All" ? "Reset Filter" : undefined}
                      onAction={activeTrainer !== "All" ? () => handleTrainerChange("All") : undefined}
                    />
                  ) : (
                    filteredSummaries.map((summary, idx) => {
                      const gap = summary.calibrationGap;
                      const hasGap = gap !== null && Number.isFinite(gap);
                      const isLargeGap = hasGap && Math.abs(gap) >= 10;
                      const isWellCalibrated = hasGap && Math.abs(gap) <= 5;
                      const isSelected = activeTrainer === summary.trainerName;

                      let badgeClass = "sibs-badge-warning font-bold";
                      let badgeIcon = <AlertTriangle className="h-3 w-3 shrink-0" />;
                      let badgeText = `${gap > 0 ? `+${gap}` : gap} pp · Moderate Variance`;

                      if (isLargeGap) {
                        badgeClass = "sibs-badge-danger font-extrabold";
                        badgeIcon = <AlertCircle className="h-3 w-3 shrink-0" />;
                        badgeText = `${gap > 0 ? `+${gap}` : gap} pp · Calibration review recommended`;
                      } else if (isWellCalibrated) {
                        badgeClass = "sibs-badge-success font-bold";
                        badgeIcon = <CheckCircle className="h-3 w-3 shrink-0" />;
                        badgeText = `${gap > 0 ? `+${gap}` : gap} pp · Well Calibrated`;
                      } else if (!hasGap) {
                        badgeClass = "sibs-badge-neutral font-bold";
                        badgeIcon = null;
                        badgeText = "Awaiting Audits";
                      }

                      return (
                        <tr
                          key={summary.trainerName || idx}
                          onClick={() => handleTrainerChange(isSelected ? "All" : summary.trainerName)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleTrainerChange(isSelected ? "All" : summary.trainerName);
                            }
                          }}
                          tabIndex={0}
                          role="button"
                          className={`sibs-data-table-row cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-sibs-orange/5 font-semibold hover:bg-sibs-orange/10"
                              : "hover:bg-sibs-surface/70"
                          }`}
                          title="Click to filter trainee table by this trainer"
                        >
                          {/* Trainer / Cohort */}
                          <td className="sibs-data-table-td px-3 py-2.5 2xl:px-4 2xl:py-3">
                            <div className="font-extrabold text-sibs-navy">
                              {summary.trainerName}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                              <span className="sibs-badge-neutral font-bold">
                                {summary.traineeCount} {summary.traineeCount === 1 ? "Trainee" : "Trainees"}
                              </span>
                              <span className="text-[10px] text-sibs-muted font-medium">
                                · {summary.scoredCount} evaluated cohorts
                              </span>
                            </div>
                          </td>

                          {/* Trainer Self-Score */}
                          <td className="sibs-data-table-td px-2 py-2.5 2xl:px-3 2xl:py-3 text-center font-heading font-extrabold tabular-nums text-sibs-navy">
                            {summary.meanTr !== null ? `${summary.meanTr}%` : "—"}
                          </td>

                          {/* QA Audit */}
                          <td className="sibs-data-table-td px-2 py-2.5 2xl:px-3 2xl:py-3 text-center font-heading font-extrabold tabular-nums text-sibs-orange">
                            {summary.meanQa !== null ? `${summary.meanQa}%` : "—"}
                          </td>

                          {/* Calibration Gap */}
                          <td className="sibs-data-table-td px-3 py-2.5 2xl:px-4 2xl:py-3 text-center">
                            <span className={badgeClass}>
                              {badgeIcon}
                              <span>{badgeText}</span>
                            </span>
                          </td>

                          {/* Composite */}
                          <td className="sibs-data-table-td px-2 py-2.5 2xl:px-3 2xl:py-3 text-center font-heading text-sm font-extrabold tabular-nums text-emerald-700">
                            {summary.meanComposite !== null ? `${summary.meanComposite}%` : "—"}
                          </td>

                          {/* Adherence */}
                          <td className="sibs-data-table-td px-2 py-2.5 2xl:px-3 2xl:py-3 text-center font-heading font-bold tabular-nums text-sibs-navy">
                            {summary.avgAttendance ?? 95}%
                          </td>

                          {/* Action */}
                          <td
                            className="sibs-data-table-td px-2 py-2.5 2xl:px-3 2xl:py-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleTrainerChange(isSelected ? "All" : summary.trainerName)}
                              className={`h-7 px-2.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-sibs-orange text-white hover:bg-orange-600 shadow-2xs"
                                  : "sibs-btn-secondary"
                              }`}
                              title={isSelected ? "Show all trainers" : `Filter by ${summary.trainerName}`}
                            >
                              {isSelected ? "Active" : "Filter"}
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
            <DataCard.Skeleton count={3} lines={3} />
          ) : filteredSummaries.length === 0 ? (
            <DataCard.Empty
              title="No Trainer Calibration Data"
              description="No trainer metrics match the active filter. Please select All Trainers or check trainee assignments."
            />
          ) : (
            <div className="space-y-3">
              {filteredSummaries.map((summary, idx) => {
                const gap = summary.calibrationGap;
                const hasGap = gap !== null && Number.isFinite(gap);
                const isLargeGap = hasGap && Math.abs(gap) >= 10;
                const isWellCalibrated = hasGap && Math.abs(gap) <= 5;
                const isSelected = activeTrainer === summary.trainerName;

                let badgeClass = "sibs-badge-warning font-bold";
                let badgeIcon = <AlertTriangle className="h-3 w-3 shrink-0" />;
                let badgeText = `${gap > 0 ? `+${gap}` : gap} pp · Moderate Variance`;

                if (isLargeGap) {
                  badgeClass = "sibs-badge-danger font-extrabold";
                  badgeIcon = <AlertCircle className="h-3 w-3 shrink-0" />;
                  badgeText = `${gap > 0 ? `+${gap}` : gap} pp · Calibration review recommended`;
                } else if (isWellCalibrated) {
                  badgeClass = "sibs-badge-success font-bold";
                  badgeIcon = <CheckCircle className="h-3 w-3 shrink-0" />;
                  badgeText = `${gap > 0 ? `+${gap}` : gap} pp · Well Calibrated`;
                } else if (!hasGap) {
                  badgeClass = "sibs-badge-neutral font-bold";
                  badgeIcon = null;
                  badgeText = "Awaiting Audits";
                }

                return (
                  <DataCard
                    key={summary.trainerName || idx}
                    interactive
                    onClick={() => handleTrainerChange(isSelected ? "All" : summary.trainerName)}
                    className={isSelected ? "border-sibs-orange/60 shadow-xs" : ""}
                  >
                    <DataCard.Header
                      title={summary.trainerName}
                      subtitle={`${summary.traineeCount} Trainees · ${summary.scoredCount} evaluated cohorts`}
                      badge={
                        <span className={badgeClass}>
                          {badgeIcon}
                          <span>{badgeText}</span>
                        </span>
                      }
                    />
                    <DataCard.Metrics cols={4}>
                      <DataCard.MetricItem
                        label="Trainer"
                        value={summary.meanTr !== null ? `${summary.meanTr}%` : "—"}
                        tone="navy"
                      />
                      <DataCard.MetricItem
                        label="QA Audit"
                        value={summary.meanQa !== null ? `${summary.meanQa}%` : "—"}
                        tone="orange"
                      />
                      <DataCard.MetricItem
                        label="Composite"
                        value={summary.meanComposite !== null ? `${summary.meanComposite}%` : "—"}
                        tone="emerald"
                      />
                      <DataCard.MetricItem
                        label="Adherence"
                        value={`${summary.avgAttendance ?? 95}%`}
                        tone="secondary"
                      />
                    </DataCard.Metrics>
                  </DataCard>
                );
              })}
            </div>
          )
        }
      />
    </div>
  );
}
