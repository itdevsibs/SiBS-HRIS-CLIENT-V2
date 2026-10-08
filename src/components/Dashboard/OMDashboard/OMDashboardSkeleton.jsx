import React from "react";
import RoleDashboardSkeleton from "../shared/RoleDashboardSkeleton";

export default function OMDashboardSkeleton({ hero = null }) {
  return <RoleDashboardSkeleton kind="om" hero={hero} />;
}
