import { ArrowRight, FileSpreadsheet, RefreshCw } from "lucide-react";
import { PageHeaderHero } from "@/components/ui";

export default function TADashboardWelcome({
  onOpenHiringPlan,
  onRefresh,
  isManualRefreshing = false,
}) {
  return (
    <PageHeaderHero
      kicker="TA Central Station"
      title="Talent Acquisition Dashboard"
      description={
        <>
          Complete hiring overview across{" "}
          <span className="font-extrabold text-sibs-navy">
            all departments
          </span>{" "}
          and functional units.
        </>
      }
      actions={
        <div className="flex shrink-0 items-center gap-2 2xl:gap-2.5">
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
            className="sibs-btn-primary"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-white" />
            Hiring Plan View
            <ArrowRight className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" />
          </button>
        </div>
      }
    />
  );
}
