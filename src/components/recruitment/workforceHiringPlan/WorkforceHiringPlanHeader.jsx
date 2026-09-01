import React from "react";
import { ClipboardList, Sparkles } from "lucide-react";

import { useWorkforceHiring } from "../../../services/context/WorkforceHiringContext";
import WorkforceHiringOverviewFilters from "../workforceHiringOverview/WorkforceHiringOverviewFilters";

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
    <section
      className="sibs-page-header-in sibs-page-card-in sibs-card font-jakarta relative overflow-hidden rounded-2xl border border-sibs-border bg-white p-4 shadow-sm 2xl:p-6"
      style={{ animationDelay: "0ms", animationFillMode: "both" }}
    >
      <span className="sibs-top-accent" aria-hidden="true" />

      <div className="mt-0.5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 space-y-1 xl:max-w-[560px] xl:flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-normal text-sibs-navy">
              <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-sibs-orange" />
              <ClipboardList className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" strokeWidth={2.2} />
              Recruitment View
            </span>
          </div>

          <h1 className="font-heading break-words text-xl 2xl:text-3xl font-bold tracking-tight text-sibs-navy">
            Workforce Hiring Plan
          </h1>

          <p className="max-w-2xl sibs-text-sm font-semibold leading-relaxed text-sibs-muted">
            Review weekly workforce requirements, forecasted hiring gaps,
            recruitment pipeline volume, attrition, and six-week hiring plans
            for the selected scope.
          </p>
        </div>

        <div className="relative z-[100] w-full min-w-0 xl:w-auto xl:flex-none">
          <div className="flex flex-col gap-3 overflow-visible">
            <div className="flex justify-start xl:justify-end">
              <button
                type="button"
                onClick={handleOpenAiInsight}
                disabled={aiInsightLoading || accountsLoading}
                className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg border border-sibs-border-subtle bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-navy shadow-sm transition hover:border-sibs-orange/50 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-50"
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
      </div>
    </section>
  );
}
