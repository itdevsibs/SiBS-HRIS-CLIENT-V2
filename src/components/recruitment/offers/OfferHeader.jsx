import { FilterX, Gift, RefreshCw } from "lucide-react";

export default function OfferHeader({
  routeFilterActive = false,
  routeCandidateLabel = "",
  onClearRouteFilter,
  onRefresh,
  isManualRefreshing = false,
}) {
  return (
    <section
      className="sibs-page-header-in sibs-page-card-in sibs-card relative overflow-hidden p-4 font-jakarta 2xl:p-6"
      style={{ animationDelay: "0ms", animationFillMode: "both" }}
    >
      <span className="sibs-top-accent" aria-hidden="true" />

      <div className="mt-0.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-normal text-sibs-navy">
            <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-sibs-orange" />
            Recruitment View
          </span>

          <h1 className="font-heading break-words text-xl 2xl:text-3xl font-bold tracking-tight text-sibs-navy">
            Offers
          </h1>

          <p className="max-w-6xl sibs-text-sm font-semibold leading-relaxed text-sibs-muted">
            Review candidates currently in the Offered stage, track approval
            progress, and keep offer decisions synchronized with Candidate
            Pipeline.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {typeof onRefresh === "function" ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isManualRefreshing}
              className="inline-flex h-8.5 2xl:h-10 w-8.5 2xl:w-10 items-center justify-center rounded-lg border border-sibs-border-subtle bg-white text-sibs-navy shadow-sm outline-none transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Refresh offers data"
              title="Refresh offers"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                  isManualRefreshing ? "animate-spin text-sibs-orange" : ""
                }`}
              />
            </button>
          ) : null}
        </div>
      </div>

      {routeFilterActive ? (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-sibs-orange/20 bg-sibs-cream-light p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="sibs-kicker text-sibs-orange">Selected Candidate</p>
            <p className="mt-1 truncate text-xs font-extrabold text-sibs-navy sm:text-sm">
              {routeCandidateLabel || "Candidate from Pipeline"}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-sibs-muted">
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