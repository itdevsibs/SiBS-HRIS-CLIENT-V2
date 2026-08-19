import { ArrowRight } from "lucide-react";

export default function TADashboardWelcome({ onOpenHiringPlan }) {
  return (
    <section
      className="sibs-page-header-in sibs-page-card-in sibs-card font-jakarta relative overflow-hidden p-4 2xl:p-6"
      style={{ animationDelay: "0ms", animationFillMode: "both" }}
    >
      <span className="sibs-top-accent" aria-hidden="true" />

      <div className="mt-0.5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 lg:pr-4 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-wide text-[#042C51]">
              <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
              TA Central Station
            </span>
          </div>

          <h1 className="break-words text-lg 2xl:text-2xl font-extrabold tracking-tight text-[#042C51]">
            Talent Acquisition Dashboard
          </h1>

          <p className="sibs-text-sm font-semibold leading-relaxed text-[#667085]">
            Complete hiring overview across{" "}
            <span className="font-extrabold text-[#042C51]">
              all departments
            </span>{" "}
            and functional units.
          </p>
        </div>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={onOpenHiringPlan}
            className="inline-flex h-8.5 2xl:h-10 shrink-0 items-center justify-center gap-1.5 2xl:gap-2 whitespace-nowrap rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-3 2xl:px-3.5 sibs-text-micro 2xl:sibs-text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
          >
            Hiring Plan View
            <ArrowRight className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
