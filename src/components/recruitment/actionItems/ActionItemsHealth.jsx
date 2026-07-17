import React from "react";
import { ListChecks } from "lucide-react";
import { useActionItems } from "../../../services/context/ActionItemsContext.jsx";

function ProgressBar({ label, value, total, helper, delay = 0 }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="sibs-page-card-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#344054]">{label}</p>
          <p className="truncate text-xs font-medium text-sibs-tertiary-5">
            {helper}
          </p>
        </div>
        <p className="shrink-0 text-sm font-bold text-sibs-primary-1">
          {percentage}%
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div
          className="h-full rounded-full bg-sibs-primary-1 transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function ActionItemsHealth() {
  const { stats } = useActionItems();

  return (
    <section
      className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
      style={{ animationDelay: "120ms" }}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#101828]">
            Recruitment Action Health
          </h2>
          <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
            Status and risk distribution across all action items.
          </p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
          <ListChecks size={22} />
        </div>
      </div>

      <div className="space-y-5">
        <ProgressBar
          label="Planned"
          value={stats.planned}
          total={stats.total}
          helper="Actions not yet started"
        />
        <ProgressBar
          label="Ongoing"
          value={stats.ongoing}
          total={stats.total}
          helper="Actions currently in progress"
          delay={60}
        />
        <ProgressBar
          label="Completed"
          value={stats.completed}
          total={stats.total}
          helper="Closed and ready for reporting"
          delay={120}
        />
        <ProgressBar
          label="High Risk"
          value={stats.highRisk}
          total={stats.total}
          helper="Items that need immediate movement"
          delay={180}
        />
        <ProgressBar
          label="Overdue"
          value={stats.overdue}
          total={stats.total}
          helper="Past deadline and still open"
          delay={240}
        />
      </div>
    </section>
  );
}
