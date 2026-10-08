import React from "react";
import RoleDashboardSkeleton from "../shared/RoleDashboardSkeleton";

export default function TADashboardSkeleton({ hero = null }) {
  return <RoleDashboardSkeleton kind="ta" hero={hero} />;
}
