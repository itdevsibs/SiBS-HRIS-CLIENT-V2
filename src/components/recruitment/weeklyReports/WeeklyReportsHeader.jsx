import React from "react";
import { RefreshCw, Zap } from "lucide-react";
import { PageHeaderHero } from "@/components/ui";

export default function WeeklyReportsHeader({ onRefresh, onGenerate, isManualRefreshing = false }) {
  return (
    <PageHeaderHero
      kicker="Recruitment View"
      title="Weekly Recruitment Reports"
      description="Overview of weekly hiring reports compiled from Hiring Needs, Candidate Pipeline, Offers, Onboarding, Action Items, Talent Pool, and the Weekly Hiring Plan."
      actions={
        <>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isManualRefreshing}
            title="Refresh weekly reports data"
            aria-label="Refresh weekly reports data"
            className="sibs-btn-icon"
          >
            <RefreshCw className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${isManualRefreshing ? "animate-spin text-sibs-orange" : ""}`} />
          </button>

          <button
            type="button"
            onClick={onGenerate}
            className="sibs-btn-primary max-sm:flex-1"
            title="Generate the current weekly recruitment report"
          >
            <Zap size={15} />
            Generate Current Week
          </button>
        </>
      }
    />
  );
}
