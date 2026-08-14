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
    <section className="sibs-page-header-in sibs-page-card-in sibs-card relative mb-4 2xl:mb-5 overflow-visible rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm 2xl:p-6">
      <span
        className="sibs-top-accent pointer-events-none absolute left-[1px] right-[1px] top-[1px] h-1 overflow-hidden rounded-t-[15px]"
        aria-hidden="true"
      >
        <span className="block h-full w-full bg-gradient-to-r from-[#042C51] via-[#FF5C28] to-[#042C51]" />
      </span>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 space-y-1 xl:max-w-[560px] xl:flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-normal text-[#042C51]">
              <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
              <ClipboardList className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" strokeWidth={2.2} />
              Recruitment View
            </span>
          </div>

          <h1 className="break-words text-lg 2xl:text-2xl font-extrabold tracking-tight text-[#042C51]">
            Workforce Hiring Plan
          </h1>

          <p className="max-w-2xl sibs-text-sm font-semibold leading-relaxed text-[#667085]">
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
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-[#042C51] shadow-sm transition hover:-translate-y-0.5 hover:border-[#FF5C28]/50 hover:bg-[#FFF7F3] hover:text-[#FF5C28] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:border-[#D6DEE8] disabled:hover:bg-white disabled:hover:text-[#042C51] disabled:hover:shadow-sm"
              >
                <Sparkles size={15} />

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
