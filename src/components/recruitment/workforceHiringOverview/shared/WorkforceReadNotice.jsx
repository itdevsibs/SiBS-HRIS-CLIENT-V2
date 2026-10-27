import React from "react";

export default function WorkforceReadNotice({ error, empty, onRetry }) {
  return (
    <div role={error ? "alert" : "status"} className="rounded-xl border border-sibs-border bg-white px-4 py-5 text-sm text-sibs-navy">
      <p>{error || (empty ? "No workforce records match the selected scope and week." : "Select a week to load workforce metrics.")}</p>
      {error && <button type="button" onClick={onRetry} className="mt-3 rounded-lg bg-sibs-navy px-3 py-2 text-xs font-bold text-white">Retry</button>}
    </div>
  );
}
