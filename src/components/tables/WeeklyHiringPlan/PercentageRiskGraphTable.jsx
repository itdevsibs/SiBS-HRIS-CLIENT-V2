import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ClipboardList,
} from "lucide-react";

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
      (item) =>
        Number(item.actualHeadcount || 0) >=
        Number(item.requiredHeadcount || 0)
    );

  if (completed) return "COMPLETED";

  return "ON TRACK";
}

function getOverallStatusClass(status) {
  if (status === "AT RISK") {
    return "border-orange-200 bg-orange-50 text-orange-600";
  }

  if (status === "COMPLETED") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getBarColor(value) {
  if (value >= 20) return "bg-red-500";
  if (value >= 10) return "bg-orange-400";
  return "bg-emerald-500";
}

export default function PercentageRiskGraphTable({ filteredPlans = [] }) {
  const [openMetric, setOpenMetric] = useState("");

  const maxActualPercent = 100;
  const maxDisplayPercent = 25;

  const percentageMetrics = [
    {
      countKey: "absenteeismCount",
      percentKey: "absenteeismPercent",
      denominatorKey: "scheduledCount",
      label: "Absenteeism",
      description: "Attendance risk against scheduled headcount",
    },
    {
      countKey: "attritionPastCount",
      percentKey: "attritionPastPercent",
      label: "Attrition - Past 6 Weeks",
      description: "Recent attrition trend from the last six weeks",
    },
    {
      countKey: "attritionFstToPstCount",
      percentKey: "attritionFstToPstPercent",
      label: "Attrition - FST to PST / c/o QDS",
      description: "Conversion risk from FST to PST",
    },
    {
      countKey: "attritionNhoToFstPstCount",
      percentKey: "attritionNhoToFstPstPercent",
      label: "Attrition - NHO to FST-PST / c/o TA",
      description: "Conversion risk from NHO to FST/PST",
    },
    {
      countKey: "attritionInterviewToNhoCount",
      percentKey: "attritionInterviewToNhoPercent",
      label: "Attrition - Interview to NHO / c/o TA",
      description: "Conversion risk from interview to NHO",
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

  const overallStatus = useMemo(
    () => getOverallStatus(filteredPlans),
    [filteredPlans]
  );

  const graphData = useMemo(() => {
    return percentageMetrics.map((metric) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPlans]);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
      <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <BarChart3 size={14} />
              Risk Graph
            </div>

            <h2 className="mt-3 text-base font-extrabold text-[#101828]">
              Percentage Risk Graph
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Absenteeism and attrition risks are displayed using a 25% maximum
              risk scale.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#344054]">
              <ClipboardList size={17} className="text-sibs-primary-1" />
              Accounts Included: {filteredPlans.length}
            </div>

            <div
              className={`inline-flex w-fit items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${getOverallStatusClass(
                overallStatus
              )}`}
            >
              <AlertTriangle size={17} />
              Overall Status: {overallStatus}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
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
                  className="overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm transition hover:border-sibs-primary-1/20 hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMetric(isOpen ? "" : metric.percentKey)
                    }
                    className="w-full p-4 text-left transition hover:bg-[#F8FAFC] sm:p-5"
                  >
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
                          <ChevronDown
                            size={19}
                            className={`transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-[#101828]">
                            {metric.label}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                            {metric.description}
                          </p>

                          <p className="mt-2 text-xs font-bold text-[#344054]">
                            Total Count: {formatNumber(metric.totalCount)}
                            {metric.denominatorKey
                              ? ` / Scheduled: ${formatNumber(
                                  filteredPlans.reduce(
                                    (sum, item) =>
                                      sum +
                                      Number(
                                        item?.[metric.denominatorKey] || 0
                                      ),
                                    0
                                  )
                                )}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-left sm:text-right">
                        <p className="text-lg font-extrabold text-sibs-primary-1">
                          {formatGraphPercent(metric.displayPercent)}
                        </p>

                        <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                          25% Scale
                        </p>
                      </div>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-[#E6ECF2]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getBarColor(
                          metric.displayPercent
                        )}`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-[#E6ECF2] bg-white p-4 sm:p-5">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
                          <thead>
                            <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                              <th className="px-5 py-4 first:rounded-tl-2xl">
                                Account
                              </th>
                              <th className="px-5 py-4">Cluster</th>
                              <th className="px-5 py-4 text-center">Count</th>

                              {metric.denominatorKey && (
                                <th className="px-5 py-4 text-center">
                                  Scheduled
                                </th>
                              )}

                              <th className="px-5 py-4 text-center last:rounded-tr-2xl">
                                Percentage
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {filteredPlans.map((item) => {
                              const rowActualPercent = getItemPercent(
                                item,
                                metric
                              );
                              const rowDisplayPercent =
                                scaleToDisplayPercent(rowActualPercent);

                              return (
                                <tr
                                  key={`${metric.percentKey}-${item.id}`}
                                  className="transition hover:bg-[#FAFBFC]"
                                >
                                  <td className="border-b border-[#E6ECF2] px-5 py-4">
                                    <p className="text-sm font-bold text-[#101828]">
                                      {item.account}
                                    </p>
                                  </td>

                                  <td className="border-b border-[#E6ECF2] px-5 py-4">
                                    <p className="text-sm font-semibold text-[#344054]">
                                      {item.cluster}
                                    </p>
                                  </td>

                                  <td className="border-b border-[#E6ECF2] px-5 py-4 text-center text-sm font-semibold text-[#344054]">
                                    {formatNumber(item?.[metric.countKey])}
                                  </td>

                                  {metric.denominatorKey && (
                                    <td className="border-b border-[#E6ECF2] px-5 py-4 text-center text-sm font-semibold text-[#344054]">
                                      {formatNumber(
                                        item?.[metric.denominatorKey]
                                      )}
                                    </td>
                                  )}

                                  <td className="border-b border-[#E6ECF2] px-5 py-4 text-center">
                                    <span
                                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                                        rowDisplayPercent >= 20
                                          ? "bg-red-50 text-red-600"
                                          : rowDisplayPercent >= 10
                                            ? "bg-orange-50 text-orange-600"
                                            : "bg-emerald-50 text-emerald-600"
                                      }`}
                                    >
                                      {formatGraphPercent(rowDisplayPercent)}
                                    </span>
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
          <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-12 text-center text-sm font-bold text-gray-500">
            No graph data available for the selected filter.
          </div>
        )}
      </div>
    </section>
  );
}