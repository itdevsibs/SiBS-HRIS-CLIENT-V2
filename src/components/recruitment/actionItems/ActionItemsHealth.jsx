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
          <p className="text-xs font-bold text-sibs-navy">{label}</p>
          <p className="truncate text-[10px] font-semibold text-sibs-faint">{helper}</p>
        </div>
        <span className="text-xs font-black text-sibs-navy">{percentage}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-sibs-surface-subtle">
        <div className="h-full rounded-full bg-sibs-navy transition-all duration-500" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default function ActionItemsHealth() {
  const { filteredActionItems } = useActionItemsReport();
  const stats = useMemo(() => getActionItemsStats(filteredActionItems), [filteredActionItems]);
  return (
    <section className="rounded-[10px] border border-sibs-border bg-sibs-surface p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">Recruitment Action Health</h3>
          <p className="mt-0.5 sibs-text-xs font-semibold text-sibs-muted">Distribution across the active reporting scope.</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-sibs-border bg-white text-sibs-navy shadow-xs"><ListChecks size={20} /></div>
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
