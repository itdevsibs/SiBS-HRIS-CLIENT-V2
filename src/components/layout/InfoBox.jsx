import React from "react";

const InfoBox = ({ label, value }) => {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className="break-words text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
};

export default InfoBox;
