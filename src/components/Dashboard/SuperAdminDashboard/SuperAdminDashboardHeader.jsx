import React from "react";
import { ArrowRight, RefreshCw, UserPlus, Users } from "lucide-react";
import { PageHeaderHero } from "@/components/ui";

function getSafeDisplayName(value) {
  if (typeof value === "string") {
    const cleanValue = value.trim();
    return cleanValue || "Super Admin";
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "Super Admin";
}

export default function SuperAdminDashboardHeader({
  displayName,
  onAddUser,
  onOpenEmployees,
  onRefresh,
  isManualRefreshing = false,
}) {
  const safeDisplayName = getSafeDisplayName(displayName);

  return (
    <PageHeaderHero
      kicker="Super Admin Operations View"
      title="Whole-System HRIS Operations & Governance"
      description={
        <>
          Welcome back,{" "}
          <span className="font-extrabold text-sibs-navy">
            {safeDisplayName}
          </span>.
          You have whole-system administrative permissions across all HRIS modules.
        </>
      }
      actions={
        <>
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
            onClick={onAddUser}
            className="sibs-btn-secondary max-sm:flex-1"
          >
            <UserPlus className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-sibs-orange" />
            Add Admin / User
          </button>

          <button
            type="button"
            onClick={onOpenEmployees}
            className="sibs-btn-primary max-sm:w-full"
          >
            <Users className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-white" />
            Launch Employee Directory
            <ArrowRight className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" />
          </button>
        </>
      }
    />
  );
}
