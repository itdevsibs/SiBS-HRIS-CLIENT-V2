import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useActionItems } from "../../../services/context/ActionItemsContext.jsx";
import {
  getDaysLeft,
  getRiskClass,
} from "../../../lib/utils/actionItems/actionItemsHelpers.js";

export default function ActionItemsPriorityWatchlist() {
  const { topRisks, setSelectedItem } = useActionItems();

  return (
    <section
      className="sibs-profile-tab-panel rounded-xl border border-red-100 bg-red-50 p-5 shadow-sm sm:p-6"
      style={{ animationDelay: "180ms" }}
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-red-600">
          <AlertTriangle size={22} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-red-700">Priority Watchlist</h3>
          <p className="mt-1 text-sm font-medium leading-6 text-red-700/80">
            Most urgent open items based on risk level and deadline.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {topRisks.length > 0 ? (
          topRisks.map((item, index) => (
            <button
              type="button"
              key={`${item.sourceType}-${item.id}-${item.actionId}`}
              onClick={() => setSelectedItem(item)}
              className="sibs-page-card-in w-full rounded-xl border border-red-100 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FAFBFC] hover:shadow-sm active:scale-[0.98]"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-red-600">
                    {item.actionId} · {item.module || "Recruitment"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-[#101828]">
                    {item.actionItem}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getRiskClass(
                    item.riskLevel,
                  )}`}
                >
                  {item.riskLevel}
                </span>
              </div>
              <p className="mt-2 text-xs font-bold text-sibs-tertiary-5">
                {getDaysLeft(item.deadline)}
              </p>
            </button>
          ))
        ) : (
          <div className="rounded-xl border border-emerald-100 bg-white p-5 text-center">
            <CheckCircle2 className="mx-auto text-emerald-600" size={28} />
            <p className="mt-2 text-sm font-bold text-emerald-700">
              No open high-priority items.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
