import React from "react";
import { CalendarDays, CheckCircle2, Eye, UserRound } from "lucide-react";
import {
  formatDate,
  getDaysLeft,
  getRiskClass,
  getStatusClass,
} from "../../../lib/utils/actionItems/actionItemsHelpers.js";

export default function ActionItemMobileCard({ item, delay = 0, onOpen, onComplete }) {
  const systemGenerated = item.systemGenerated || String(item.sourceType || "").toLowerCase().includes("system");
  return (
    <article
      className="sibs-card sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-[#F2F4F7] px-1.5 py-0.5 font-mono text-[9px] font-black text-[#042C51]">{item.actionId}</span>
            <span className={`rounded border px-1.5 py-0.5 text-[8px] font-black uppercase ${systemGenerated ? "border-purple-100 bg-purple-50 text-purple-700" : "border-blue-100 bg-blue-50 text-blue-700"}`}>
              {systemGenerated ? "System" : "Manual"}
            </span>
          </div>
          <h3 className="mt-2 text-sm font-extrabold leading-5 text-[#042C51]">{item.actionItem}</h3>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black ${getRiskClass(item.riskLevel)}`}>{item.riskLevel}</span>
      </div>

      <div className="mt-3 rounded-lg bg-[#F8FAFC] p-3">
        <p className="text-xs font-bold text-[#042C51]">{item.account || "—"}</p>
        <p className="mt-0.5 text-[10px] font-semibold text-[#667085]">{item.roleTitle || item.roleAccount || "—"}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-semibold text-[#667085]">
        <div className="flex items-center gap-1.5"><UserRound size={13} /> {item.owner || "—"}</div>
        <div className="flex items-center gap-1.5"><CalendarDays size={13} /> {formatDate(item.deadline)}</div>
        <span className={`w-fit rounded-full border px-2 py-1 font-black ${getStatusClass(item.status)}`}>{item.status}</span>
        <span className="text-right font-black text-[#667085]">
          {item.status === "Completed"
            ? `Completed${item.completedDate ? ` ${formatDate(item.completedDate)}` : ""}`
            : getDaysLeft(item.deadline)}
        </span>
      </div>

      {item.remarks ? <p className="mt-3 line-clamp-2 text-[11px] font-semibold leading-4 text-[#667085]">{item.remarks}</p> : null}

      <div className="mt-4 flex justify-end gap-2 border-t border-[#E6ECF2] pt-3">
        {!systemGenerated && item.status !== "Completed" ? (
          <button type="button" onClick={onComplete} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-black text-white">
            <CheckCircle2 size={13} /> Resolve
          </button>
        ) : null}
        <button type="button" onClick={onOpen} className="inline-flex items-center gap-1 rounded-lg bg-[#042C51] px-3 py-2 text-[10px] font-black text-white">
          <Eye size={13} /> Details
        </button>
      </div>
    </article>
  );
}
