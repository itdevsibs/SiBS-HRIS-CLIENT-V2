import { BarChart3, ClipboardList } from "lucide-react";
import WorkforceHiringOverviewFilters from "./WorkforceHiringOverviewFilters";

export default function WorkforceHiringOverviewHeader() {
  return (
    <section className="sibs-page-header-in sibs-page-card-in sibs-card relative overflow-visible rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm sm:p-6">
      <span
        className="sibs-top-accent pointer-events-none absolute left-[1px] right-[1px] top-[1px] h-1 overflow-hidden rounded-t-[15px]"
        aria-hidden="true"
      >
        <span className="block h-full w-full bg-gradient-to-r from-[#042C51] via-[#FF5C28] to-[#042C51]" />
      </span>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-normal text-[#042C51]">
              <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
              Recruitment View
            </span>
          </div>

          <h1 className="break-words text-xl font-extrabold tracking-tight text-[#042C51] sm:text-2xl">
            Workforce &amp; Hiring Overview
          </h1>

          <p className="max-w-2xl text-xs font-semibold leading-relaxed text-[#667085] sm:text-sm">
            Review workforce capacity, hiring gaps, pipeline conversion,
            attrition, and six-week operating trends for the selected scope.
          </p>
        </div>

        <div className="w-full min-w-0 xl:w-auto xl:flex-none">
          <WorkforceHiringOverviewFilters />
        </div>
      </div>
    </section>
  );
}
