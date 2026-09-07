import { BarChart3, ClipboardList } from "lucide-react";
import WorkforceHiringOverviewFilters from "./WorkforceHiringOverviewFilters";
import { PageHeaderHero } from "@/components/ui";

export default function WorkforceHiringOverviewHeader() {
  return (
    <PageHeaderHero
      kicker={
        <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-normal text-sibs-navy">
          <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-sibs-orange" />
          <ClipboardList className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" strokeWidth={2.2} />
          Recruitment View
        </span>
      }
      title="Workforce & Hiring Overview"
      description="Review workforce capacity, hiring gaps, pipeline conversion, attrition, and six-week operating trends for the selected scope."
      actions={
        <div className="w-full min-w-0 xl:w-auto xl:flex-none">
          <WorkforceHiringOverviewFilters />
        </div>
      }
    />
  );
}
