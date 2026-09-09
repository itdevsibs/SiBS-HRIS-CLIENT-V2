import { FilterX, Gift, RefreshCw } from "lucide-react";
import { PageHeaderHero } from "@/components/ui";

export default function OfferHeader({
  routeFilterActive = false,
  routeCandidateLabel = "",
  onClearRouteFilter,
  onRefresh,
  isManualRefreshing = false,
}) {
  return (
    <div className="space-y-4">
      <PageHeaderHero
        kicker="Recruitment View"
        title="Offers"
        description="Review candidates currently in the Offered stage, track approval progress, and keep offer decisions synchronized with Candidate Pipeline."
        actions={
          typeof onRefresh === "function" ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isManualRefreshing}
              className="sibs-btn-icon"
              aria-label="Refresh offers data"
              title="Refresh offers"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                  isManualRefreshing ? "animate-spin text-sibs-orange" : ""
                }`}
              />
            </button>
          ) : null
        }
      />

      {routeFilterActive ? (
        <div className="flex flex-col gap-3 rounded-xl border border-sibs-orange/20 bg-sibs-cream-light p-3 sm:flex-row sm:items-center sm:justify-between">
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
            className="sibs-btn-secondary"
          >
            <FilterX size={15} />
            Clear Selected Candidate
          </button>
        </div>
      ) : null}
    </div>
  );
}