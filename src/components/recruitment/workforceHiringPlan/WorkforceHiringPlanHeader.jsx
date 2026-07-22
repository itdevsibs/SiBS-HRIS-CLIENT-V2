import React from "react";
import { ClipboardList, Sparkles } from "lucide-react";
import WeeklyVersionTable from "../../tables/WorkforceHiringPlan/WeeklyVersionTable";
import { useWorkforceHiring } from "../../../services/context/WorkforceHiringContext";
import ForecastWeeklyVersionTable from "../../tables/WorkforceHiringPlan/ForecastWeeklyVersionTable";

export default function WorkforceHiringPlanHeader() {
  const { pageHeader } = useWorkforceHiring();

  return (
    <div className="sibs-page-header-in mb-5 flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="min-w-0 xl:max-w-[520px]">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
          <ClipboardList size={14} />
          Recruitment
        </div>

        <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
          Workforce Hiring Plan
        </h1>

        <p className="mt-1 text-sm font-medium leading-6 text-sibs-tertiary-5">
          Manage weekly manpower requirement, OPS PRF, hiring plan percentage,
          leads needed, and action items.
        </p>
      </div>

      <div className="w-full xl:flex xl:flex-1 xl:flex-col xl:items-end">
        <button
          type="button"
          onClick={pageHeader.handleOpenAiInsight}
          disabled={pageHeader.aiInsightLoading || pageHeader.accountsLoading}
          className="mb-3 inline-flex h-9 items-center justify-center gap-2 rounded-full border border-[#D9E2EC] bg-white px-3.5 text-xs font-extrabold text-sibs-primary-1 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Sparkles size={14} />
          {pageHeader.aiInsightLoading
            ? "Thinking..."
            : pageHeader.hasAiSession
              ? "Open AI"
              : "Ask AI"}
        </button>

        <ForecastWeeklyVersionTable />
      </div>
    </div>
  );
}
