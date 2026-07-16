import { BarChart3, Mail } from "lucide-react";

export default function WeeklyReportSnapshot({ report }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <section
        className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
        style={{ animationDelay: "120ms" }}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#101828]">
              Current Weekly Report Snapshot
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Hiring plan, KPI snapshot, current status, and action items.
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
            <BarChart3 size={22} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
              Requirement
            </p>

            <p className="mt-2 text-2xl font-bold text-sibs-primary-1">
              {report?.totalRequirement || 0}
            </p>
          </div>

          <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
              Filled
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {report?.totalFilled || 0}
            </p>
          </div>

          <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
              Drop-offs
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600">
              {report?.dropOffs || 0}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
          <h3 className="text-sm font-bold text-[#101828]">
            Current Week Summary
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#344054]">
            {report?.summary || "No weekly report data available."}
          </p>
        </div>
      </section>

      <section
        className="sibs-profile-tab-panel rounded-xl border border-blue-100 bg-blue-50 p-5 shadow-sm sm:p-6"
        style={{ animationDelay: "180ms" }}
      >
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-white p-3 text-sibs-primary-1">
            <Mail size={22} />
          </div>

          <div>
            <h3 className="text-lg font-bold text-sibs-primary-1">
              Weekly Email Requirement
            </h3>

            <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
              The system should automatically generate the weekly report format
              with summary per role/account, hiring plan snapshot, weekly KPI
              snapshot, current status, action items, and missing data
              explanations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
