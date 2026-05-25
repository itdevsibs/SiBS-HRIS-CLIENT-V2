import React, { useEffect, useRef, useState } from "react";
import { Eye, ListChecks } from "lucide-react";

function getNumberValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      const numberValue = Number(value);

      if (Number.isFinite(numberValue)) {
        return numberValue;
      }
    }
  }

  return 0;
}

function formatPercent(value) {
  const numberValue = Number(value || 0);

  if (Math.abs(numberValue) > 0 && Math.abs(numberValue) <= 1) {
    return `${(numberValue * 100).toFixed(2)}%`;
  }

  return `${numberValue.toFixed(2)}%`;
}

function formatNumber(value, maximumFractionDigits = 0) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits,
  });
}

function getStatusClass(status) {
  switch (status) {
    case "On Track":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "At Risk":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Delayed":
      return "border-red-200 bg-red-50 text-red-700";
    case "Completed":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "In Progress":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case "Pending":
      return "border-gray-200 bg-gray-50 text-gray-700";
    case "Not Started":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getRowMetrics(item) {
  const requiredHeadcount = getNumberValue(
    item.requiredHeadcount,
    item.required_headcount
  );

  const actualHeadcount = getNumberValue(
    item.actualHeadcount,
    item.actual_headcount
  );

  const requiredBufferHeadcount = getNumberValue(
    item.requiredBufferHeadcount,
    item.required_buffer_headcount,
    item.bufferHeadcount,
    item.buffer_headcount
  );

  const requiredBufferPercent = getNumberValue(
    item.requiredBufferPercent,
    item.required_buffer_percent,
    item.bufferPercent,
    item.buffer_percent
  );

  const actualBufferCount = getNumberValue(
    item.actualBufferCount,
    item.actual_buffer_count,
    item.missingHeadcount,
    item.missing_headcount
  );

  const actualBufferPercent = getNumberValue(
    item.actualBufferPercent,
    item.actual_buffer_percent
  );

  const requiredActualHeadcountWithBuffer = getNumberValue(
    item.requiredActualHeadcountWithBuffer,
    item.required_actual_headcount_with_buffer,
    requiredHeadcount + requiredBufferHeadcount
  );

  const absenteeismPastSixWeeksAverage = getNumberValue(
    item.absenteeismPastSixWeeksAverage,
    item.absenteeism_past_six_weeks_average,
    item.absenteeismOpsCount,
    item.absenteeism_ops_count,
    item.absenteeismCount,
    item.absenteeism_count
  );

  const attritionPastSixWeeksAverage = getNumberValue(
    item.attritionPastSixWeeksAverage,
    item.attrition_past_six_weeks_average,
    item.attritionPastCount,
    item.attrition_past_count
  );

  const opsPrf = getNumberValue(item.opsPrf, item.ops_prf);

  const actualHeadcountNeeds = getNumberValue(
    item.actualHeadcountNeeds,
    item.actual_headcount_needs,
    requiredBufferHeadcount +
      absenteeismPastSixWeeksAverage +
      attritionPastSixWeeksAverage +
      opsPrf
  );

  const leadsToInterview = getNumberValue(
    item.leadsToInterview,
    item.leads_to_interview
  );

  const hiringRate = getNumberValue(item.hiringRate, item.hiring_rate, 5);

  return {
    requiredHeadcount,
    actualHeadcount,
    requiredBufferHeadcount,
    requiredBufferPercent,
    actualBufferCount,
    actualBufferPercent,
    requiredActualHeadcountWithBuffer,
    absenteeismPastSixWeeksAverage,
    attritionPastSixWeeksAverage,
    opsPrf,
    actualHeadcountNeeds,
    leadsToInterview,
    hiringRate,
  };
}

function MobileMetric({
  label,
  value,
  valueClassName = "text-sibs-primary-1",
}) {
  return (
    <div className="rounded-xl bg-[#F8FAFC] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <p className={`mt-1 text-sm font-extrabold ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}

function HeaderCell({ children, note, className = "" }) {
  return (
    <th className={`px-5 py-4 text-center align-top ${className}`}>
      <div className="leading-tight">{children}</div>

      {note && (
        <div className="mt-1 max-w-[170px] text-[10px] font-bold normal-case leading-tight text-sibs-tertiary-5">
          ({note})
        </div>
      )}
    </th>
  );
}

export default function WeeklyHiringAccountsTable({
  accountsLoading = false,
  filteredPlans = [],
  onViewPlan,
}) {
  const tableScrollRef = useRef(null);
  const mobileScrollRef = useRef(null);

  const dragStateRef = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  const [isDraggingTable, setIsDraggingTable] = useState(false);

  useEffect(() => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [filteredPlans.length]);

  function handleDragStart(e) {
    if (e.button !== 0) return;

    const target = e.target;
    const isInteractiveElement = target.closest(
      "button, a, input, select, textarea"
    );

    if (isInteractiveElement) return;

    const container = tableScrollRef.current;
    if (!container) return;

    dragStateRef.current = {
      isDown: true,
      startX: e.pageX - container.offsetLeft,
      scrollLeft: container.scrollLeft,
      moved: false,
    };

    setIsDraggingTable(true);
  }

  function handleDragMove(e) {
    const container = tableScrollRef.current;
    const dragState = dragStateRef.current;

    if (!dragState.isDown || !container) return;

    e.preventDefault();

    const x = e.pageX - container.offsetLeft;
    const walk = (x - dragState.startX) * 1.4;

    if (Math.abs(walk) > 4) {
      dragStateRef.current.moved = true;
    }

    container.scrollLeft = dragState.scrollLeft - walk;
  }

  function handleDragEnd() {
    dragStateRef.current.isDown = false;

    window.setTimeout(() => {
      setIsDraggingTable(false);
      dragStateRef.current.moved = false;
    }, 0);
  }

  function handleViewClick(item) {
    if (dragStateRef.current.moved) return;
    onViewPlan?.(item);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
      <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <ListChecks size={14} />
              Account Plan
            </div>

            <h2 className="mt-3 text-base font-extrabold text-[#101828]">
              Weekly Hiring Accounts
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Review Excel-based hiring plan computation per account, including
              buffer, actual buffer, headcount needs, OPS PRF, and leads.
            </p>
          </div>

          <div className="inline-flex w-fit rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#344054]">
            Records: {filteredPlans.length}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="hidden lg:block">
          <div
            ref={tableScrollRef}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            className={`max-h-[670px] overflow-auto select-none ${
              isDraggingTable ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            <table className="w-full min-w-[2200px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white text-left">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                  <th className="px-5 py-4 text-left align-top first:rounded-tl-2xl">
                    Account
                  </th>

                  <HeaderCell>Required Headcount</HeaderCell>

                  <HeaderCell>Actual Headcount</HeaderCell>

                  <HeaderCell note="Required Headcount × 10%">
                    Required Buffer Headcount
                  </HeaderCell>

                  <HeaderCell note="Required Buffer Headcount ÷ Required Headcount">
                    Required Buffer %
                  </HeaderCell>

                  <HeaderCell note="Actual Headcount - Required Headcount">
                    Actual Buffer Count
                  </HeaderCell>

                  <HeaderCell note="Actual Buffer Count ÷ Required Headcount">
                    Actual Buffer %
                  </HeaderCell>

                  <HeaderCell note="Required Headcount + Required Buffer Headcount">
                    Required Actual HC with Buffer
                  </HeaderCell>

                  <HeaderCell>Absenteeism Past 6 Weeks Average</HeaderCell>

                  <HeaderCell>Attrition Past 6 Weeks Average</HeaderCell>

                  <HeaderCell>OPS PRF</HeaderCell>

                  <HeaderCell note="Required Buffer + Absenteeism Avg + Attrition Avg + OPS PRF">
                    Actual Headcount Needs
                  </HeaderCell>

                  <HeaderCell>Leads to Interview</HeaderCell>

                  <HeaderCell>Hiring Rate</HeaderCell>

                  <HeaderCell>Status</HeaderCell>

                  <th className="px-5 py-4 text-left align-top">
                    Status Note
                  </th>

                  <th className="px-5 py-4 text-right align-top last:rounded-tr-2xl">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {accountsLoading ? (
                  <tr>
                    <td
                      className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                      colSpan={17}
                    >
                      Loading weekly hiring plan records...
                    </td>
                  </tr>
                ) : filteredPlans.length === 0 ? (
                  <tr>
                    <td
                      className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                      colSpan={17}
                    >
                      No weekly hiring plan records found.
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map((item) => {
                    const metrics = getRowMetrics(item);

                    return (
                      <tr
                        key={item.id}
                        className="transition hover:bg-[#FAFBFC]"
                      >
                        <td className="border-b border-[#E6ECF2] px-5 py-5">
                          <p className="max-w-[220px] truncate text-sm font-extrabold text-[#101828]">
                            {item.account || "--"}
                          </p>

                          <p className="mt-1 max-w-[220px] truncate text-xs font-semibold text-sibs-tertiary-5">
                            {item.cluster || "--"}
                          </p>
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
                          {formatNumber(metrics.requiredHeadcount)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
                          {formatNumber(metrics.actualHeadcount)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-sibs-primary-1">
                          {formatNumber(metrics.requiredBufferHeadcount, 2)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
                          {formatPercent(metrics.requiredBufferPercent)}
                        </td>

                        <td
                          className={`border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold ${
                            metrics.actualBufferCount < 0
                              ? "text-red-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {formatNumber(metrics.actualBufferCount)}
                        </td>

                        <td
                          className={`border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold ${
                            metrics.actualBufferPercent < 0
                              ? "text-red-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {formatPercent(metrics.actualBufferPercent)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-sibs-primary-1">
                          {formatNumber(
                            metrics.requiredActualHeadcountWithBuffer,
                            2
                          )}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
                          {formatNumber(
                            metrics.absenteeismPastSixWeeksAverage
                          )}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
                          {formatNumber(metrics.attritionPastSixWeeksAverage)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-sibs-primary-1">
                          {formatNumber(metrics.opsPrf)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-violet-700">
                          {formatNumber(metrics.actualHeadcountNeeds, 2)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
                          {formatNumber(metrics.leadsToInterview)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
                          {formatPercent(metrics.hiringRate)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
                          <span
                            className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                              item.pipelineStatus
                            )}`}
                          >
                            {item.pipelineStatus || "--"}
                          </span>
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5">
                          <p className="line-clamp-2 max-w-[260px] text-sm font-semibold leading-5 text-[#344054]">
                            {item.statusNote || "--"}
                          </p>
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-right">
                          <button
                            type="button"
                            onClick={() => handleViewClick(item)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 py-2 text-sm font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
                          >
                            <Eye size={16} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
            Hold left click and drag left or right to scroll the table.
          </p>
        </div>

        <div className="block lg:hidden">
          <div ref={mobileScrollRef} className="max-h-[670px] overflow-y-auto">
            {accountsLoading ? (
              <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-10 text-center text-sm font-bold text-gray-500">
                Loading weekly hiring plan records...
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-10 text-center text-sm font-bold text-gray-500">
                No weekly hiring plan records found.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPlans.map((item) => {
                  const metrics = getRowMetrics(item);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onViewPlan?.(item)}
                      className="w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-extrabold leading-tight text-[#101828]">
                            {item.account || "--"}
                          </h3>

                          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                            {item.cluster || "--"}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
                            item.pipelineStatus
                          )}`}
                        >
                          {item.pipelineStatus || "--"}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <MobileMetric
                          label="Required HC"
                          value={formatNumber(metrics.requiredHeadcount)}
                        />

                        <MobileMetric
                          label="Actual HC"
                          value={formatNumber(metrics.actualHeadcount)}
                        />

                        <MobileMetric
                          label="Required Buffer HC"
                          value={formatNumber(
                            metrics.requiredBufferHeadcount,
                            2
                          )}
                        />

                        <MobileMetric
                          label="Required Buffer %"
                          value={formatPercent(metrics.requiredBufferPercent)}
                        />

                        <MobileMetric
                          label="Actual Buffer Count"
                          value={formatNumber(metrics.actualBufferCount)}
                          valueClassName={
                            metrics.actualBufferCount < 0
                              ? "text-red-700"
                              : "text-emerald-700"
                          }
                        />

                        <MobileMetric
                          label="Actual Buffer %"
                          value={formatPercent(metrics.actualBufferPercent)}
                          valueClassName={
                            metrics.actualBufferPercent < 0
                              ? "text-red-700"
                              : "text-emerald-700"
                          }
                        />

                        <MobileMetric
                          label="Required Actual HC + Buffer"
                          value={formatNumber(
                            metrics.requiredActualHeadcountWithBuffer,
                            2
                          )}
                        />

                        <MobileMetric
                          label="Absenteeism Avg"
                          value={formatNumber(
                            metrics.absenteeismPastSixWeeksAverage
                          )}
                        />

                        <MobileMetric
                          label="Attrition Avg"
                          value={formatNumber(
                            metrics.attritionPastSixWeeksAverage
                          )}
                        />

                        <MobileMetric
                          label="OPS PRF"
                          value={formatNumber(metrics.opsPrf)}
                        />

                        <MobileMetric
                          label="Actual HC Needs"
                          value={formatNumber(
                            metrics.actualHeadcountNeeds,
                            2
                          )}
                          valueClassName="text-violet-700"
                        />

                        <MobileMetric
                          label="Leads"
                          value={formatNumber(metrics.leadsToInterview)}
                        />

                        <MobileMetric
                          label="Hiring Rate"
                          value={formatPercent(metrics.hiringRate)}
                        />
                      </div>

                      <div className="mt-4 rounded-xl bg-[#F8FAFC] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                          Status Note
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#344054]">
                          {item.statusNote || "--"}
                        </p>
                      </div>

                      <div className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1">
                        <Eye size={16} />
                        View Details
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}