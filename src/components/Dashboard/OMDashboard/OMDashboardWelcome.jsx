import { ArrowRight } from "lucide-react";

export default function OMDashboardWelcome({
  departmentBadge,
  scopeText,
  onOpenHiringPlan,
}) {
  return (
    <section className="sibs-page-header-in sibs-card relative overflow-hidden p-5 sm:p-6">
      <span className="sibs-top-accent" aria-hidden="true" />

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-normal text-[#042C51]">
              <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
              Operations Manager View
            </span>

            <span className="inline-flex max-w-full rounded border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-normal text-[#FF5C28]">
              <span className="truncate">Dept: {departmentBadge}</span>
            </span>
          </div>

          <h1 className="mt-3 text-xl font-extrabold tracking-tight text-[#042C51] sm:text-2xl">
            Operations Dashboard
          </h1>

          <p className="mt-1 text-xs font-semibold leading-relaxed text-[#667085] sm:text-sm">
            Hiring overview filtered by your department and assigned accounts:{" "}
            <strong className="text-[#042C51]">
              {scopeText || "No scope label available"}
            </strong>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenHiringPlan}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-3.5 text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
        >
          Return to Hiring Plan
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
