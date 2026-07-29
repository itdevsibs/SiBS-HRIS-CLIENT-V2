import { ArrowRight } from "lucide-react";

export default function TADashboardWelcome({ onOpenHiringPlan }) {
  return (
    <section className="sibs-page-header-in sibs-card relative overflow-hidden p-5 sm:p-6">
      <span className="sibs-top-accent" aria-hidden="true" />

      <div className="mt-1 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#042C51]">
              <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
              TA Central Station
            </span>
          </div>

          <h1 className="text-xl font-extrabold tracking-tight text-[#042C51] sm:text-2xl">
            Talent Acquisition Dashboard
          </h1>

          <p className="text-xs font-semibold leading-relaxed text-[#667085] sm:text-sm">
            Complete hiring overview across{" "}
            <span className="font-extrabold text-[#042C51]">
              all departments
            </span>{" "}
            and functional units.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenHiringPlan}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-3.5 text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
        >
          Hiring Plan View
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}
