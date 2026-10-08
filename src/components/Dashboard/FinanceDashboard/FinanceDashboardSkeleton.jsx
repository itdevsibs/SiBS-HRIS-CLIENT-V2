import React from "react";
import DashboardLoadingSkeleton from "../shared/DashboardLoadingSkeleton";

export default function FinanceDashboardSkeleton({ hero = null }) {
  return (
    <DashboardLoadingSkeleton
      ariaLabel="Loading Finance Dashboard"
      hero={hero}
    />
  );
}
