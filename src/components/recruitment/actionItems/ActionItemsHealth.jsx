import React, { useMemo } from "react";
import { ListChecks } from "lucide-react";
import { useActionItemsReport } from "../../../services/context/ActionItemsReportContext.jsx";
import { getActionItemsStats } from "../../../lib/utils/actionItems/actionItemsHelpers.js";

function ProgressBar({ label, value, total, helper }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#344054]">{label}</p>
          <p className="truncate text-[10px] font-semibold text-[#98A2B3]">{helper}</p>
        </div>
        <span className="text-xs font-black text-[#042C51]">{percentage}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div className="h-full rounded-full bg-[#042C51] transition-all duration-500" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default function ActionItemsHealth() {
  const { filteredActionItems } = useActionItemsReport();
  const stats = useMemo(() => getActionItemsStats(filteredActionItems), [filteredActionItems]);
  return (
    <section className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-[#042C51]">Recruitment Action Health</h3>
          <p className="mt-1 text-[11px] font-semibold text-[#667085]">Distribution across the active reporting scope.</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#042C51]"><ListChecks size={20} /></div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <ProgressBar label="Planned" value={stats.planned} total={stats.total} helper="Not started" />
        <ProgressBar label="Ongoing" value={stats.ongoing} total={stats.total} helper="In progress" />
        <ProgressBar label="Completed" value={stats.completed} total={stats.total} helper="Resolved" />
        <ProgressBar label="High Risk" value={stats.highRisk} total={stats.total} helper="Immediate movement" />
        <ProgressBar label="Overdue" value={stats.overdue} total={stats.total} helper="Past deadline" />
      </div>
    </section>
  );
}
