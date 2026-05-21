import React from "react";

const PipelineInfoTile = ({ label, value, children }) => {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>
      {children || (
        <p className="mt-2 break-words text-sm font-extrabold leading-5 text-[#344054]">
          {value || "—"}
        </p>
      )}
    </div>
  );
};

export default PipelineInfoTile;
