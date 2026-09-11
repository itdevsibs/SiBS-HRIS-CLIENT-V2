import React from "react";
import { AlertTriangle, CheckSquare, Eye } from "lucide-react";
import { DataCard, ResponsiveTableShell } from "@/components/ui";
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
    <ResponsiveTableShell
      mobileContent={
        <div className="space-y-3 font-jakarta">
          {safeReports.length > 0 ? (
            safeReports.map((report, index) => (
              <WeeklyReportMobileCard
                key={report.reportId}
                report={report}
                index={index}
                onView={() => onView(report)}
              />
            ))
          ) : (
            <DataCard.Empty
              title="No weekly reports found"
              hint="No weekly performance report entries match the selected filters."
            />
          )}
        </div>
      }
      desktopContent={
        <div className="overflow-hidden rounded-xl border border-sibs-border bg-white">
          <div className="overflow-x-auto sibs-scrollbar">
            <table className="w-full min-w-[1020px] border-collapse bg-white">
              <thead className="sibs-data-table-head">
                <tr className="sibs-data-table-head-row">

                <th className="sibs-data-table-th px-3 2xl:px-4 py-2 2xl:py-2.5 whitespace-nowrap text-left text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wider text-sibs-navy">Week & Date Range</th>
                <th className="sibs-data-table-th px-3 2xl:px-4 py-2 2xl:py-2.5 whitespace-nowrap text-left text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wider text-sibs-navy">Report ID & Author</th>
                <th className="sibs-data-table-th px-3 2xl:px-4 py-2 2xl:py-2.5 whitespace-nowrap text-center text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wider text-sibs-navy">Requirement vs. Filled</th>
                <th className="sibs-data-table-th px-3 2xl:px-4 py-2 2xl:py-2.5 whitespace-nowrap text-center text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wider text-sibs-navy">Status</th>
                <th className="sibs-data-table-th px-3 2xl:px-4 py-2 2xl:py-2.5 whitespace-nowrap text-center text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wider text-sibs-navy">Action Items & Alerts</th>
                <th className="sibs-data-table-th px-3 2xl:px-4 py-2 2xl:py-2.5 whitespace-nowrap text-right text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wider text-sibs-navy">Actions</th>
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
                      <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle sibs-text-xs font-extrabold text-sibs-navy">
                        <p className="font-extrabold text-sibs-navy">{report.weekLabel}</p>
                        <p className="mt-0.5 text-[10px] 2xl:text-[10.5px] font-semibold tabular-nums text-sibs-muted">{report.dateRange}</p>
                      </td>

                      <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle sibs-text-xs font-semibold text-sibs-secondary">
                        <p className="font-mono font-extrabold tabular-nums text-sibs-navy">{report.reportId}</p>
                        <p className="mt-0.5 max-w-[220px] truncate text-[10px] 2xl:text-[10.5px] font-semibold text-sibs-muted">
                          {report.generatedBy || "System"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle text-center sibs-text-xs font-extrabold">
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-sibs-border bg-sibs-surface px-2 py-1 text-[10px] 2xl:text-[10.5px] font-extrabold tabular-nums">
                          <span className="text-emerald-700">{toNumber(report.totalFilled)}</span>
                          <span className="text-sibs-faint">/</span>
                          <span className="text-sibs-navy">{toNumber(report.totalRequirement)}</span>
                          <span className="ml-1 text-sibs-muted">({fulfillment}%)</span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle text-center sibs-text-xs">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase ${getReportStatusClass(report.status)}`}>
                          {report.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle text-center sibs-text-xs">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2 py-0.5 text-[9px] font-extrabold tabular-nums text-orange-700">
                            <CheckSquare size={12} className="text-sibs-orange" />
                            {actionCount} Tasks
                          </span>

                          {alertCount > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[9px] font-extrabold tabular-nums text-red-700">
                              <AlertTriangle size={12} />
                              {alertCount} Alerts
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle text-right sibs-text-xs">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onView(report);
                          }}
                          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-sibs-border-subtle bg-white px-3 text-[10px] 2xl:text-[10.5px] font-extrabold text-sibs-navy transition hover:border-sibs-orange/35 hover:bg-[#FFF7F3] hover:text-sibs-orange active:scale-[0.98]"
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
                  <td colSpan={6} className="px-5 py-12 text-center sibs-text-xs font-bold text-sibs-faint">
                    No weekly performance report entries match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    }
  />
  );
}

