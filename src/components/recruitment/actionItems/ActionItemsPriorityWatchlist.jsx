import React, { useMemo } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useActionItems } from "../../../services/context/ActionItemsContext.jsx";
import { useActionItemsReport } from "../../../services/context/ActionItemsReportContext.jsx";
import { formatDate, getDaysLeft, sortActionItems } from "../../../lib/utils/actionItems/actionItemsHelpers.js";

export default function ActionItemsPriorityWatchlist() {
  const { setSelectedItem } = useActionItems();
  const { filteredActionItems } = useActionItemsReport();
  const risks = useMemo(
    () => sortActionItems(filteredActionItems.filter((item) => item.status !== "Completed" && item.status !== "Cancelled")).slice(0, 4),
    [filteredActionItems],
  );

  return (
    <section className="rounded-xl border border-rose-100 bg-rose-50/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 font-heading text-sm 2xl:text-base font-bold tracking-tight text-rose-700"><AlertTriangle size={16} /> Priority Watchlist</h3>
          <p className="mt-0.5 sibs-text-xs font-semibold text-rose-700/80">Most urgent open actions by risk and deadline.</p>
        </div>
        <span className="rounded border border-rose-200 bg-white px-2 py-1 text-[9px] font-black uppercase text-rose-700">Action Required</span>
      </div>

      <div className="divide-y divide-rose-100 rounded-xl border border-rose-100 bg-white">
        {risks.length ? risks.map((item) => (
          <button
            type="button"
            key={`${item.sourceType}-${item.id}-${item.actionId}`}
            onClick={() => setSelectedItem(item)}
            className="flex w-full flex-col gap-2 px-3 py-3 text-left transition hover:bg-[#F8FAFC] sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="line-clamp-1 text-xs font-extrabold text-[#042C51]">{item.actionItem}</p>
              <p className="mt-1 text-[10px] font-semibold text-[#667085]">{item.account} · {item.roleTitle || item.roleAccount} · Owner: {item.owner}</p>
            </div>
            <div className="shrink-0 text-left sm:text-right font-jakarta">
              <p className="text-[10px] font-extrabold text-rose-700">{formatDate(item.deadline)}</p>
              <p className="mt-0.5 text-[9px] font-bold text-rose-600">{getDaysLeft(item.deadline)}</p>
            </div>
          </button>
        )) : (
          <div className="p-6 text-center">
            <CheckCircle2 size={25} className="mx-auto text-emerald-600" />
            <p className="mt-2 text-xs font-black text-emerald-700">No open priority items in this scope.</p>
          </div>
        )}
      </div>
    </section>
  );
}
