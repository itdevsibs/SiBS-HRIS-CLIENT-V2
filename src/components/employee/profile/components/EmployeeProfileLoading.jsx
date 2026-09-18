import React from "react";
import EmployeeProfileSkeleton from "./EmployeeProfileSkeleton.jsx";

export default function EmployeeProfileLoading({ notFound = false }) {
  if (notFound) {
    return (
      <div className="sibs-page-card-in sibs-card p-6 text-sm font-semibold text-[#667085]">
        Profile not found.
      </div>
    );
  }

  return <EmployeeProfileSkeleton />;
}
