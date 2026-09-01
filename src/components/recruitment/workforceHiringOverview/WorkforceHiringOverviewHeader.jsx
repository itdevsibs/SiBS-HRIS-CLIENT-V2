import { BarChart3, ClipboardList } from "lucide-react";
import WorkforceHiringOverviewFilters from "./WorkforceHiringOverviewFilters";

export default function WorkforceHiringOverviewHeader() {
  return (
    <section className="sibs-page-header-in sibs-page-card-in sibs-card relative overflow-hidden rounded-2xl border border-sibs-border bg-white p-4 shadow-sm 2xl:p-6">
      <span className="sibs-top-accent" aria-hidden="true" />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-normal text-sibs-navy">
              <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-sibs-orange" />
              Recruitment View
            </span>
          </div>

          <h1 className="font-heading break-words text-xl 2xl:text-3xl font-bold tracking-tight text-sibs-navy">
            Workforce &amp; Hiring Overview
          </h1>

          <p className="max-w-2xl sibs-text-sm font-semibold leading-relaxed text-sibs-muted">
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
