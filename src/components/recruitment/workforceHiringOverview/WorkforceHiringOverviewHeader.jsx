import { ClipboardList, Send } from "lucide-react";
import WorkforceHiringOverviewFilters from "./WorkforceHiringOverviewFilters";

export default function WorkforceHiringOverviewHeader() {
  return (
    <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#EEF6FF] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-sibs-primary-70">
          <ClipboardList className="h-3.5 w-3.5" strokeWidth={2.3} />
          Recruitment
        </div>

        <h1 className="text-[32px] font-extrabold leading-tight tracking-[-0.04em] text-sibs-primary-90 md:text-[36px]">
          Workforce Hiring Dashboard
        </h1>

        <p className="mt-2 max-w-3xl text-[16px] font-medium leading-relaxed text-sibs-primary-80">
          Manage weekly manpower requirement, OPS PRF, hiring plan percentage,
          leads needed, and action items.
        </p>
      </div>

      <WorkforceHiringOverviewFilters />
    </div>
  );
}
