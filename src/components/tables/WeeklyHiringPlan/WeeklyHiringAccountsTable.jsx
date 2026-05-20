import React, { useEffect, useRef } from "react";
import { Eye } from "lucide-react";

function formatPercent(value) {
  const numberValue = Number(value || 0);

  if (numberValue > 0 && numberValue <= 1) {
    return `${(numberValue * 100).toFixed(2)}%`;
  }

  return `${numberValue.toFixed(2)}%`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
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

export default function WeeklyHiringAccountsTable({
  accountsLoading = false,
  filteredPlans = [],
  onViewPlan,
}) {
  const tableScrollRef = useRef(null);
  const mobileScrollRef = useRef(null);

  useEffect(() => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [filteredPlans.length]);

  return (
    <div className="min-w-0 overflow-hidden rounded-xl bg-white">
      <div className="hidden lg:block">
        <div ref={tableScrollRef} className="max-h-[670px] overflow-auto">
          <table className="w-full min-w-[1580px] border-collapse bg-white text-sm text-sibs-primary-1">
            <thead className="sticky top-0 z-10 bg-[#f3f4f6]">
              <tr>
                <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-bold text-sibs-primary-1">
                  Account
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-center text-sm font-bold text-sibs-primary-1">
                  Required
                  <br />
                  Headcount
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-center text-sm font-bold text-sibs-primary-1">
                  Actual
                  <br />
                  Headcount
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-center text-sm font-bold text-sibs-primary-1">
                  Buffer
                  <br />
                  Count
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-center text-sm font-bold text-sibs-primary-1">
                  Buffer
                  <br />%
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-center text-sm font-bold text-sibs-primary-1">
                  Missing
                  <br />
                  Headcount
                  <div className="mt-0.5 text-[10px] font-bold normal-case leading-tight text-sibs-tertiary-5">
                    Required + Buffer Count - Actual Headcount
                  </div>
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-center text-sm font-bold text-sibs-primary-1">
                  OPS
                  <br />
                  PRF
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-center text-sm font-bold text-sibs-primary-1">
                  Projected
                  <br />
                  Employee Needs
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-center text-sm font-bold text-sibs-primary-1">
                  Leads to
                  <br />
                  Interview
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-center text-sm font-bold text-sibs-primary-1">
                  Hiring
                  <br />
                  Rate
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-center text-sm font-bold text-sibs-primary-1">
                  Status
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-bold text-sibs-primary-1">
                  Status Note
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-center text-sm font-bold text-sibs-primary-1">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {accountsLoading ? (
                <tr>
                  <td
                    className="p-6 text-center text-sm text-sibs-tertiary-5"
                    colSpan={13}
                  >
                    Loading weekly hiring plan records...
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td
                    className="p-6 text-center text-sm text-sibs-tertiary-5"
                    colSpan={13}
                  >
                    No weekly hiring plan records found.
                  </td>
                </tr>
              ) : (
                filteredPlans.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50">
                    <td className="h-[54px] min-w-[210px] border-t border-[#e6ecf2] px-3 text-left align-middle text-sm font-medium text-sibs-primary-1">
                      <div className="min-w-0">
                        <p className="m-0 max-w-[190px] truncate text-sm font-semibold text-sibs-primary-1">
                          {item.account || "--"}
                        </p>
                        <p className="mt-1 max-w-[190px] truncate text-xs font-medium text-sibs-tertiary-5">
                          {item.cluster || "--"}
                        </p>
                      </div>
                    </td>

                    <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-center text-sm font-medium text-sibs-primary-1">
                      {formatNumber(item.requiredHeadcount)}
                    </td>
                    <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-center text-sm font-medium text-sibs-primary-1">
                      {formatNumber(item.actualHeadcount)}
                    </td>
                    <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-center text-sm font-medium text-sibs-primary-1">
                      {formatNumber(item.bufferHeadcount)}
                    </td>
                    <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-center text-sm font-medium text-sibs-primary-1">
                      {formatPercent(item.bufferPercent)}
                    </td>
                    <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-center text-sm font-semibold text-cyan-700">
                      {formatNumber(item.missingHeadcount)}
                    </td>
                    <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-center text-sm font-medium text-sibs-primary-1">
                      {formatNumber(item.opsPrf)}
                    </td>
                    <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-center text-sm font-semibold text-violet-700">
                      {formatNumber(item.projectedEmployeeNeeds)}
                    </td>
                    <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-center text-sm font-medium text-sibs-primary-1">
                      {formatNumber(item.leadsToInterview)}
                    </td>
                    <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-center text-sm font-medium text-sibs-primary-1">
                      {formatPercent(item.hiringRate)}
                    </td>
                    <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClass(
                          item.pipelineStatus
                        )}`}
                      >
                        {item.pipelineStatus || "--"}
                      </span>
                    </td>
                    <td className="h-[54px] min-w-[210px] border-t border-[#e6ecf2] px-3 text-left text-sm font-normal text-sibs-primary-1">
                      <span className="line-clamp-2 max-w-[220px] leading-5">
                        {item.statusNote || "--"}
                      </span>
                    </td>
                    <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onViewPlan?.(item)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 py-2 text-sm font-semibold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="block lg:hidden">
        <div ref={mobileScrollRef} className="max-h-[670px] overflow-y-auto p-3">
          {accountsLoading ? (
            <div className="rounded-xl bg-white p-6 text-center text-sm text-sibs-tertiary-5">
              Loading weekly hiring plan records...
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center text-sm text-sibs-tertiary-5">
              No weekly hiring plan records found.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredPlans.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#e6ecf2] bg-white p-4 text-left shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onViewPlan?.(item)}
                      className="min-w-0 text-left"
                    >
                      <h3 className="m-0 text-sm font-semibold leading-tight text-sibs-primary-1">
                        {item.account || "--"}
                      </h3>
                      <p className="mt-1 text-xs font-medium text-sibs-tertiary-5">
                        {item.cluster || "--"}
                      </p>
                    </button>

                    <div className="shrink-0">
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClass(
                          item.pipelineStatus
                        )}`}
                      >
                        {item.pipelineStatus || "--"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MobileMetric
                      label="Required"
                      value={formatNumber(item.requiredHeadcount)}
                    />
                    <MobileMetric
                      label="Actual"
                      value={formatNumber(item.actualHeadcount)}
                    />
                    <MobileMetric
                      label="Buffer Count"
                      value={formatNumber(item.bufferHeadcount)}
                    />
                    <MobileMetric
                      label="Buffer %"
                      value={formatPercent(item.bufferPercent)}
                    />
                    <MobileMetric
                      label="Missing Headcount"
                      value={formatNumber(item.missingHeadcount)}
                      valueClassName="text-cyan-700"
                    />
                    <MobileMetric label="OPS PRF" value={formatNumber(item.opsPrf)} />
                    <MobileMetric
                      label="Projected Needs"
                      value={formatNumber(item.projectedEmployeeNeeds)}
                      valueClassName="text-violet-700"
                    />
                    <MobileMetric
                      label="Leads"
                      value={formatNumber(item.leadsToInterview)}
                    />
                    <MobileMetric
                      label="Hiring Rate"
                      value={formatPercent(item.hiringRate)}
                    />
                  </div>

                  <p className="mt-3 text-xs font-medium text-sibs-tertiary-5">
                    Status Note
                  </p>
                  <p className="mt-1 text-sm font-medium text-sibs-primary-1">
                    {item.statusNote || "--"}
                  </p>

                  <button
                    type="button"
                    onClick={() => onViewPlan?.(item)}
                    className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-semibold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
                  >
                    <Eye size={16} />
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileMetric({ label, value, valueClassName = "text-sibs-primary-1" }) {
  return (
    <div className="rounded-[10px] bg-sibs-tertiary-10 p-3">
      <p className="m-0 text-xs font-normal text-sibs-tertiary-5">{label}</p>
      <strong className={`mt-1 block text-sm font-medium ${valueClassName}`}>
        {value}
      </strong>
    </div>
  );
}
