import React from "react";

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-sibs-border py-2.5 font-jakarta last:border-b-0">
      <p className="font-jakarta sibs-kicker text-slate-400">
        {label}
      </p>

      <div className="max-w-[65%] break-words text-right font-jakarta sibs-text-xs font-extrabold text-sibs-text-secondary">
        {value || "—"}
      </div>
    </div>
  );
}

export default DetailRow;
