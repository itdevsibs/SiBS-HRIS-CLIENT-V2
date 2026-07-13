import { Send } from "lucide-react";
import WorkforceHiringOverviewFilters from "./WorkforceHiringOverviewFilters";

export default function WorkforceHiringOverviewHeader() {
  return (
    <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-sibs-primary-70 shadow-sm">
          <Send className="h-3.5 w-3.5" strokeWidth={2.3} />
          Recruitment
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-sibs-primary-90">
          Workforce Hiring Overview
        </h1>

        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-sibs-primary-70 sm:text-base">
          Manage weekly manpower requirement, OPS PRF, hiring plan percentage,
          leads needed, and action items.
        </p>
      </div>

      <WorkforceHiringOverviewFilters />
    </div>
  );
}
