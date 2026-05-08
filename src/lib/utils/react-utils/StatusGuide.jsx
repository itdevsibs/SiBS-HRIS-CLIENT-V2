import React from "react";

const StatusGuide = () => {
  return (
    <div className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
        Status Guide
      </p>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
          <p className="text-sm font-bold text-emerald-700">Existing</p>
          <p className="mt-0.5 text-xs font-semibold text-emerald-700/80">
            JD already exists and can be used for sourcing.
          </p>
        </div>

        <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
          <p className="text-sm font-bold text-amber-700">For Revision</p>
          <p className="mt-0.5 text-xs font-semibold text-amber-700/80">
            JD exists but needs updates before sourcing.
          </p>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
          <p className="text-sm font-bold text-blue-700">New Job Description</p>
          <p className="mt-0.5 text-xs font-semibold text-blue-700/80">
            New role or unlinked JD requiring a new JD document.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatusGuide;
