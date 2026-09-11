import { ArrowRight, RefreshCw, Users } from "lucide-react";
import { PageHeaderHero } from "@/components/ui";

export default function AdminDashboardWelcome({
  title,
  fullName,
  onOpenEmployees,
  onRefresh,
  isManualRefreshing = false,
  badge = "HR Admin View",
}) {
  return (
    <PageHeaderHero
      kicker={badge}
      title={title}
      description={
        <>
          Welcome back,{" "}
          <span className="font-extrabold text-sibs-navy">{fullName}</span>.
          You have administrative permissions.
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
            onClick={onOpenEmployees}
            className="sibs-btn-primary max-sm:flex-1"
          >
            <Users className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-white" />
            Launch Employee Directory
            <ArrowRight className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" />
          </button>
        </div>
      }
    />
  );
}
