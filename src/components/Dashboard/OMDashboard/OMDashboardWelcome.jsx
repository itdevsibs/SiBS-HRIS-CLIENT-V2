import { ArrowRight, FileSpreadsheet, RefreshCw } from "lucide-react";
import { PageHeaderHero } from "@/components/ui";

export default function OMDashboardWelcome({
  departmentBadge,
  scopeText,
  onOpenHiringPlan,
  onRefresh,
  isManualRefreshing = false,
}) {
  return (
    <PageHeaderHero
      kicker="Operations Manager View"
      title="Operations Dashboard"
      description={
        <>
          Hiring overview filtered by your department and assigned accounts:{" "}
          <strong className="font-extrabold text-sibs-navy">
            {scopeText || "No scope label available"}
          </strong>
          .
        </>
      }
      actions={
        <div className="flex shrink-0 items-center gap-2 2xl:gap-2.5 max-sm:w-full">
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isManualRefreshing}
              title="Refresh Dashboard Data"
              className="sibs-btn-icon"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                  isManualRefreshing ? "animate-spin text-sibs-orange" : ""
                }`}
              />
            </button>
          ) : null}

          <button
            type="button"
            onClick={onOpenHiringPlan}
            className="sibs-btn-primary max-sm:flex-1"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-white" />
            Return to Hiring Plan
            <ArrowRight className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" />
          </button>
        </div>
      }
    />
  );
}
