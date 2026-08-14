import { AlertTriangle, CheckSquare, Eye } from "lucide-react";
import WeeklyReportMobileCard from "./WeeklyReportMobileCard.jsx";


function getReportStatusClass(status) {
  if (status === "Generated") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "Sent") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Archived") return "border-slate-200 bg-slate-100 text-slate-600";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getFulfillment(report) {
  const requirement = toNumber(report?.totalRequirement);
  const filled = toNumber(report?.totalFilled);
  return requirement > 0 ? Math.max(0, Math.round((filled / requirement) * 100)) : 0;
}

export default function WeeklyReportsTable({ reports, onView }) {
  const safeReports = Array.isArray(reports) ? reports : [];

  return (
    <>
      <div className="space-y-3 lg:hidden">
        {safeReports.length > 0 ? (
          safeReports.map((report, index) => (
            <WeeklyReportMobileCard
              key={report.reportId}
              report={report}
              onView={() => onView(report)}
              delay={index * 45}
            />
          ))
        ) : (
          <div className="sibs-empty-panel">No weekly reports found.</div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-[#E6ECF2] bg-white lg:block">
        <div className="overflow-x-auto sibs-scrollbar">
          <table className="w-full min-w-[1020px] border-collapse bg-white">
            <thead className="sibs-data-table-head">
              <tr className="sibs-data-table-head-row">
                <th className="sibs-data-table-th px-2.5 py-2 2xl:px-4 2xl:py-3.5 whitespace-nowrap text-left">Week & Date Range</th>
                <th className="sibs-data-table-th px-2.5 py-2 2xl:px-4 2xl:py-3.5 whitespace-nowrap text-left">Report ID & Author</th>
                <th className="sibs-data-table-th px-2.5 py-2 2xl:px-4 2xl:py-3.5 whitespace-nowrap text-center">Requirement vs. Filled</th>
                <th className="sibs-data-table-th px-2.5 py-2 2xl:px-4 2xl:py-3.5 whitespace-nowrap text-center">Status</th>
                <th className="sibs-data-table-th px-2.5 py-2 2xl:px-4 2xl:py-3.5 whitespace-nowrap text-center">Action Items & Alerts</th>
                <th className="sibs-data-table-th px-2.5 py-2 2xl:px-4 2xl:py-3.5 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F1F5F9]">
              {safeReports.length > 0 ? (
                safeReports.map((report, index) => {
                  const actionCount = toNumber(report.actionItemsCount);
                  const alertCount = toNumber(report.missingDataCount);
                  const fulfillment = getFulfillment(report);

                  return (
                    <tr
                      key={report.reportId}
                      tabIndex={0}
                      onClick={() => onView(report)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onView(report);
                        }
                      }}
                      className="sibs-data-table-row sibs-page-card-in group transition-colors"
                      style={{ animationDelay: `${index * 35}ms`, animationFillMode: "both" }}
                    >
                      <td className="whitespace-nowrap px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 sibs-text-xs font-extrabold text-[#042C51]">
                        <p className="font-extrabold text-[#042C51]">{report.weekLabel}</p>
                        <p className="mt-0.5 sibs-text-micro font-semibold text-[#667085]">{report.dateRange}</p>
                      </td>

                      <td className="whitespace-nowrap px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 sibs-text-xs font-semibold text-[#344054]">
                        <p className="font-mono font-extrabold text-[#042C51]">{report.reportId}</p>
                        <p className="mt-0.5 max-w-[220px] truncate sibs-text-micro font-semibold text-[#667085]">
                          {report.generatedBy || "System"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 text-center sibs-text-xs font-extrabold">
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-2 py-1 sibs-text-micro font-extrabold">
                          <span className="text-emerald-700">{toNumber(report.totalFilled)}</span>
                          <span className="text-[#98A2B3]">/</span>
                          <span className="text-[#042C51]">{toNumber(report.totalRequirement)}</span>
                          <span className="ml-1 text-[#667085]">({fulfillment}%)</span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 text-center sibs-text-xs">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 sibs-text-micro font-extrabold uppercase ${getReportStatusClass(report.status)}`}>
                          {report.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 text-center sibs-text-xs">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2 py-0.5 sibs-text-micro font-extrabold text-orange-700">
                            <CheckSquare size={12} className="text-[#FF5C28]" />
                            {actionCount} Tasks
                          </span>

                          {alertCount > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 sibs-text-micro font-extrabold text-red-700">
                              <AlertTriangle size={12} />
                              {alertCount} Alerts
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 text-right sibs-text-xs">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onView(report);
                          }}
                          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#D6E0EA] bg-white px-3 sibs-text-micro font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/35 hover:bg-[#FFF7F3] hover:text-[#FF5C28] active:scale-[0.98]"
                        >
                          <Eye size={13} />
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center sibs-text-xs font-bold text-[#98A2B3]">
                    No weekly performance report entries match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
