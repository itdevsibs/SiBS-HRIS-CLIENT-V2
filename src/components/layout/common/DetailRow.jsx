import React from "react";

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#EEF2F6] py-2.5 font-jakarta last:border-b-0">
      <p className="font-jakarta sibs-kicker text-[#98A2B3]">
        {label}
      </p>

      <div className="max-w-[65%] break-words text-right font-jakarta sibs-text-xs font-extrabold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}

export default DetailRow;
