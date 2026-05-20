import React, { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";

function formatGraphPercent(value) {
  const numberValue = Number(value || 0);
  return `${numberValue.toFixed(2)}%`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function getOverallStatus(records = []) {
  const delayed = records.some((item) => item.pipelineStatus === "Delayed");
  const atRisk = records.some((item) => item.pipelineStatus === "At Risk");

  if (delayed || atRisk) return "AT RISK";

  const completed =
    records.length > 0 &&
    records.every(
      (item) => Number(item.actualHeadcount) >= Number(item.requiredHeadcount)
    );

  if (completed) return "COMPLETED";

  return "ON TRACK";
}

export default function PercentageRiskGraphTable({ filteredPlans = [] }) {
  const [openMetric, setOpenMetric] = useState("absenteeismPercent");

  const overallStatus = getOverallStatus(filteredPlans);
  const maxActualPercent = 100;
  const maxDisplayPercent = 25;

  const percentageMetrics = [
    {
      countKey: "absenteeismCount",
      percentKey: "absenteeismPercent",
      denominatorKey: "scheduledCount",
      label: "Absenteeism",
    },
    {
      countKey: "attritionPastCount",
      percentKey: "attritionPastPercent",
      label: "Attrition - Past 6 Weeks",
    },
    {
      countKey: "attritionFstToPstCount",
      percentKey: "attritionFstToPstPercent",
      label: "Attrition - FST to PST / c/o QDS",
    },
    {
      countKey: "attritionNhoToFstPstCount",
      percentKey: "attritionNhoToFstPstPercent",
      label: "Attrition - NHO to FST-PST / c/o TA",
    },
    {
      countKey: "attritionInterviewToNhoCount",
      percentKey: "attritionInterviewToNhoPercent",
      label: "Attrition - Interview to NHO / c/o TA",
    },
  ];

  function scaleToDisplayPercent(actualPercent) {
    const safeActualPercent = Math.max(
      0,
      Math.min(Number(actualPercent || 0), 100)
    );

    return (safeActualPercent / maxActualPercent) * maxDisplayPercent;
  }

  function getItemPercent(item, metric) {
    const directPercent = Number(item?.[metric.percentKey] || 0);

    if (metric.denominatorKey) {
      const count = Number(item?.[metric.countKey] || 0);
      const denominator = Number(item?.[metric.denominatorKey] || 0);

      if (denominator > 0) {
        return (count / denominator) * 100;
      }

      return directPercent;
    }

    return directPercent;
  }

  function getBarColor(value) {
    if (value >= 20) return "bg-red-500";
    if (value >= 10) return "bg-orange-400";
    return "bg-emerald-500";
  }

  const graphData = percentageMetrics.map((metric) => {
    const totalCount = filteredPlans.reduce(
      (sum, item) => sum + Number(item?.[metric.countKey] || 0),
      0
    );

    let actualPercent = 0;

    if (metric.denominatorKey) {
      const totalDenominator = filteredPlans.reduce(
        (sum, item) => sum + Number(item?.[metric.denominatorKey] || 0),
        0
      );

      actualPercent =
        totalDenominator > 0 ? (totalCount / totalDenominator) * 100 : 0;
    } else {
      actualPercent =
        filteredPlans.length > 0
          ? filteredPlans.reduce(
              (sum, item) => sum + Number(item?.[metric.percentKey] || 0),
              0
            ) / filteredPlans.length
          : 0;
    }

    return {
      ...metric,
      totalCount,
      actualPercent: Number(actualPercent || 0),
      displayPercent: scaleToDisplayPercent(actualPercent),
    };
  });

  return (
    <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-base font-bold text-[#101828]">
            Percentage Risk Graph
          </h2>

          <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
            Absenteeism is scaled from actual percentage into a 25% maximum risk
            scale.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="inline-flex w-fit rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#344054]">
            Accounts Included: {filteredPlans.length}
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${
              overallStatus === "AT RISK"
                ? "border-orange-200 bg-orange-50 text-orange-600"
                : overallStatus === "COMPLETED"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            <AlertTriangle size={17} />
            Overall Status: {overallStatus}
          </div>
        </div>
      </div>

      {filteredPlans.length > 0 ? (
        <div className="space-y-3">
          {graphData.map((metric) => {
            const isOpen = openMetric === metric.percentKey;
            const width = Math.min(
              (metric.actualPercent / maxActualPercent) * 100,
              100
            );

            return (
              <div
                key={metric.percentKey}
                className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-[#F8FAFC]"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenMetric(isOpen ? "" : metric.percentKey)
                  }
                  className="w-full p-4 text-left transition hover:bg-white"
                >
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-sibs-primary-1 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#101828]">
                          {metric.label}
                        </p>

                        <p className="text-xs font-semibold text-sibs-tertiary-5">
                          Total Count: {formatNumber(metric.totalCount)}
                          {metric.denominatorKey
                            ? ` / Scheduled: ${formatNumber(
                                filteredPlans.reduce(
                                  (sum, item) =>
                                    sum +
                                    Number(item?.[metric.denominatorKey] || 0),
                                  0
                                )
                              )}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-sm font-bold text-sibs-primary-1">
                        {formatGraphPercent(metric.displayPercent)}
                      </p>

                      <p className="text-xs font-semibold text-sibs-tertiary-5">
                        25% Scale
                      </p>
                    </div>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-[#E6ECF2]">
                    <div
                      className={`h-full rounded-full ${getBarColor(
                        metric.displayPercent
                      )}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-[#E6ECF2] bg-white p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[620px] border-collapse text-left">
                        <thead>
                          <tr className="border-b border-[#E6ECF2] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                            <th className="px-3 py-3">Account</th>
                            <th className="px-3 py-3">Cluster</th>
                            <th className="px-3 py-3 text-center">Count</th>

                            {metric.denominatorKey && (
                              <th className="px-3 py-3 text-center">
                                Scheduled
                              </th>
                            )}

                            <th className="px-3 py-3 text-center">
                              Percentage
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-[#E6ECF2]">
                          {filteredPlans.map((item) => {
                            const rowActualPercent = getItemPercent(
                              item,
                              metric
                            );
                            const rowDisplayPercent =
                              scaleToDisplayPercent(rowActualPercent);

                            return (
                              <tr key={`${metric.percentKey}-${item.id}`}>
                                <td className="px-3 py-3 text-sm font-bold text-[#101828]">
                                  {item.account}
                                </td>

                                <td className="px-3 py-3 text-sm font-semibold text-[#344054]">
                                  {item.cluster}
                                </td>

                                <td className="px-3 py-3 text-center text-sm font-semibold text-[#344054]">
                                  {formatNumber(item?.[metric.countKey])}
                                </td>

                                {metric.denominatorKey && (
                                  <td className="px-3 py-3 text-center text-sm font-semibold text-[#344054]">
                                    {formatNumber(
                                      item?.[metric.denominatorKey]
                                    )}
                                  </td>
                                )}

                                <td className="px-3 py-3 text-center text-sm font-bold text-sibs-primary-1">
                                  {formatGraphPercent(rowDisplayPercent)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-10 text-center text-sm font-bold text-gray-500">
          No graph data available for the selected filter.
        </div>
      )}
    </section>
  );
}
