import React from "react";
import DashboardLoadingSkeleton from "../shared/DashboardLoadingSkeleton";

export default function AdminDashboardSkeleton({
  hero = null,
  showStatutoryCoverage = true,
}) {
  return (
    <DashboardLoadingSkeleton
      ariaLabel="Loading HR Dashboard"
      hero={hero}
      showStatutoryCoverage={showStatutoryCoverage}
    />
  );
}
