import React from "react";
import { ClipboardList, Sparkles } from "lucide-react";

import { useWorkforceHiring } from "../../../services/context/WorkforceHiringContext";
import WorkforceHiringOverviewFilters from "../workforceHiringOverview/WorkforceHiringOverviewFilters";
import { PageHeaderHero } from "@/components/ui";

export default function WorkforceHiringPlanHeader() {
  const { pageHeader = {} } = useWorkforceHiring();

  const aiInsightLoading = Boolean(pageHeader.aiInsightLoading);
  const accountsLoading = Boolean(pageHeader.accountsLoading);
  const hasAiSession = Boolean(pageHeader.hasAiSession);

  function handleOpenAiInsight() {
    if (typeof pageHeader.handleOpenAiInsight === "function") {
      pageHeader.handleOpenAiInsight();
    }
  }

  return (
    <PageHeaderHero
      kicker={
        <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-normal text-sibs-navy">
          <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-sibs-orange" />
          <ClipboardList className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" strokeWidth={2.2} />
          Recruitment View
        </span>
      }
      title="Workforce Hiring Plan"
      description="Review weekly workforce requirements, forecasted hiring gaps, recruitment pipeline volume, attrition, and six-week hiring plans for the selected scope."
      actions={
        <div className="relative z-[100] w-full min-w-0 xl:w-auto xl:flex-none">
          <div className="flex flex-col gap-3 overflow-visible">
            <div className="flex justify-start xl:justify-end">
              <button
                type="button"
                onClick={handleOpenAiInsight}
                disabled={aiInsightLoading || accountsLoading}
                className="sibs-btn-secondary gap-2"
              >
                <Sparkles className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-sibs-orange" />

                {aiInsightLoading
                  ? "Thinking..."
                  : hasAiSession
                    ? "Open AI"
                    : "Ask AI"}
              </button>
            </div>

            <WorkforceHiringOverviewFilters weekMode="forecast" />
          </div>
        </div>
      }
    />
  );
}
