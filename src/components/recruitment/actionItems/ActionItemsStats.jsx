import React from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  Target,
} from "lucide-react";
import { useActionItems } from "@/services/context/ActionItemsContext.jsx";

function SummaryCard({
  title,
  value,
  icon: Icon,
  description,
  tone = "navy",
  delay = 0,
}) {
  return (
    <div
      className="sibs-metric-card"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className={`truncate text-[10px] font-extrabold uppercase tracking-normal sibs-tone-${tone}-label`}>
            {title}
          </p>
          <p className={`mt-2.5 truncate text-3xl font-extrabold leading-none tabular-nums sibs-tone-${tone}-label`}>
            {value}
          </p>
          <p className="mt-1.5 truncate text-xs font-semibold text-[#667085]">
            {description}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sibs-tone-${tone}-icon`}
        >
          <Icon size={17} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

export default function ActionItemsStats() {
  const { stats, moduleRiskTotal } = useActionItems();

  return (
    <section
      className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
      style={{ animationDelay: "60ms" }}
    >
      <h2 className="text-base font-bold text-[#101828]">Action Items Summary</h2>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
        <SummaryCard
          title="Total Actions"
          value={stats.total}
          icon={FileText}
          description="Manual + suggested"
          tone="navy"
        />
        <SummaryCard
          title="Active"
          value={stats.active}
          icon={Activity}
          description="Needs movement"
          tone="indigo"
          delay={60}
        />
        <SummaryCard
          title="Planned"
          value={stats.planned}
          icon={Clock3}
          description="Not started"
          tone="amber"
          delay={120}
        />
        <SummaryCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          description={`${stats.completionRate}% complete`}
          tone="green"
          delay={180}
        />
        <SummaryCard
          title="High Risk"
          value={stats.highRisk}
          icon={AlertTriangle}
          description="Priority"
          tone="red"
          delay={240}
        />
        <SummaryCard
          title="Overdue"
          value={stats.overdue}
          icon={CircleAlert}
          description="Needs review"
          tone="red"
          delay={300}
        />
        <SummaryCard
          title="Module Signals"
          value={moduleRiskTotal}
          icon={Target}
          description="Recruitment data"
          tone="navy"
          delay={360}
        />
      </div>
    </section>
  );
}
