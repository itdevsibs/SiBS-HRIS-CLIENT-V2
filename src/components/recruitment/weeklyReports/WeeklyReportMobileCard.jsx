import { Eye } from "lucide-react";
import {
  formatDate,
  getStatusClass,
} from "../../../lib/utils/weeklyReports/weeklyReportsHelpers.js";

export default function WeeklyReportMobileCard({ report, onView, delay = 0 }) {
  return (
    <button
      type="button"
      onClick={onView}
      className="sibs-page-card-in w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.98]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-sibs-primary-1">
            {report.reportId}
          </p>

          <h3 className="mt-1 text-sm font-bold text-[#101828]">
            {report.weekLabel}
          </h3>

          <p className="mt-1 break-words text-xs font-semibold text-sibs-tertiary-5">
            {report.dateRange}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
            report.status,
          )}`}
        >
          {report.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Requirement
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">
            {report.totalRequirement}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Filled
          </p>

          <p className="mt-1 text-xs font-bold text-emerald-600">
            {report.totalFilled}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
          {report.atRiskRoles} At Risk
        </span>

        <span className="inline-flex rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">
          {report.delayedRoles} Delayed
        </span>

        <span className="inline-flex rounded-full border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-bold text-[#344054]">
          {formatDate(report.generatedDate)}
        </span>
      </div>

      <div className="mt-4">
        <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-3 py-2 text-xs font-bold text-sibs-primary-1">
          <Eye size={15} />
          Preview Report
        </span>
      </div>
    </button>
  );
}
