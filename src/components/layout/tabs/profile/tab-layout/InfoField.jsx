import React from "react";

function InfoField({ label, value }) {
  return (
    <div className="w-full min-w-0">
      <label className="mb-2 block text-[14px] font-medium text-sibs-primary-1">
        {label}
      </label>

      <div
        className="min-h-[52px] rounded-[10px] border border-[#8FA9C8] px-4 py-3 text-[15px]
        text-[#2F5E93] flex items-center bg-sibs-tertiary-10"
      >
        <span className="break-words">{value || "N/A"}</span>
      </div>
    </div>
  );
}

export default InfoField;
