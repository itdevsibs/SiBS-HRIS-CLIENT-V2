import WorkforceHiringOverviewFilters from "./WorkforceHiringOverviewFilters";
import { PageHeaderHero } from "@/components/ui";

export default function WorkforceHiringOverviewHeader() {
  return (
    <PageHeaderHero
      kicker="Recruitment View"
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
