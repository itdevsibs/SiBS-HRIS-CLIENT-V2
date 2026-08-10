import { FilterX, Gift } from "lucide-react";

export default function OfferHeader({
  routeFilterActive = false,
  routeCandidateLabel = "",
  onClearRouteFilter,
}) {
  return (
    <section className="sibs-page-header-in sibs-page-card-in sibs-card relative overflow-hidden p-4 font-jakarta 2xl:p-6">
      <span className="sibs-top-accent" aria-hidden="true" />

      <div className="mt-0.5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1">
          <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-normal text-[#042C51]">
            <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
            Recruitment View
          </span>

          <h1 className="break-words text-lg 2xl:text-2xl font-extrabold text-[#042C51]">
            Offers
          </h1>

          <p className="max-w-6xl sibs-text-sm font-semibold leading-relaxed text-[#667085]">
            Review candidates currently in the Offered stage, track approval
            progress, and keep offer decisions synchronized with Candidate
            Pipeline.
          </p>
        </div>
      </div>

      {routeFilterActive ? (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#FF5C28]/20 bg-[#FFF7F3] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="sibs-kicker text-[#FF5C28]">Selected Candidate</p>
            <p className="mt-1 truncate text-xs font-extrabold text-[#042C51] sm:text-sm">
              {routeCandidateLabel || "Candidate from Pipeline"}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#667085]">
              The directory is temporarily narrowed to this candidate.
            </p>
          </div>

          <button
            type="button"
            onClick={onClearRouteFilter}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#D6DEE8] bg-white px-3 text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/45 hover:bg-[#FFF0EB] hover:text-[#FF5C28] focus:outline-none focus:ring-2 focus:ring-[#FF5C28]/20"
          >
            <FilterX size={15} />
            Clear Selected Candidate
          </button>
        </div>
      ) : null}
    </section>
  );
}