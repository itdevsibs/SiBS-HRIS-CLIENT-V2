import React from "react";
import { Download, Plus, RefreshCw } from "lucide-react";
import { PageHeaderHero } from "@/components/ui";

export default function CandidateExperienceHeader({
  onAddManual,
  onRefresh,
  refreshing,
  onExport,
}) {
  return (
    <PageHeaderHero
      kicker="Recruitment View"
      title="Candidate Experience"
      description="Monitor completed and drop-off candidate journeys, survey delivery, response sources, ratings, and Voice of Candidate feedback."
      actions={
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Refresh Candidate Experience"
              title="Refresh Candidate Experience"
              className="sibs-btn-icon shrink-0"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                  refreshing ? "animate-spin text-sibs-orange" : ""
                }`}
              />
            </button>

            <button
              type="button"
              onClick={onExport}
              className="sibs-btn-secondary flex-1 sm:flex-none sm:w-auto whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-sibs-orange" />
              <span>Export CSV</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onAddManual}
            className="sibs-btn-primary w-full sm:w-auto whitespace-nowrap"
          >
            <Plus size={15} />
            <span>Add Manual Entry</span>
          </button>
        </div>
      }
    />
  );
}
