import React from "react";
import DashboardLoadingSkeleton from "./DashboardLoadingSkeleton";

const ROLE_LABELS = {
  ta: "Loading Talent Acquisition Dashboard",
  om: "Loading Operations Dashboard",
  wfm: "Loading WFM Dashboard",
  som: "Loading Senior Operations Dashboard",
};

export default function RoleDashboardSkeleton({ kind = "om", hero = null }) {
  return (
    <DashboardLoadingSkeleton
      ariaLabel={ROLE_LABELS[kind] || ROLE_LABELS.om}
      hero={hero}
    />
  );
}
