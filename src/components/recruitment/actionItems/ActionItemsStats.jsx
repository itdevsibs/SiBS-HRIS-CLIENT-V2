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
import { useActionItems } from "../../../services/context/ActionItemsContext.jsx";

function SummaryCard({
  title,
  value,
  icon: Icon,
  description,
  valueClassName = "text-sibs-primary-1",
  iconClassName = "bg-[#F2F6FA] text-sibs-primary-1",
  delay = 0,
}) {
  return (
    <div
      className="sibs-page-card-in group rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
            {title}
          </p>
          <p className={`mt-3 truncate text-3xl font-extrabold ${valueClassName}`}>
            {value}
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
            {description}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 ${iconClassName}`}
        >
          <Icon size={22} />
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
        />
        <SummaryCard
          title="Active"
          value={stats.active}
          icon={Activity}
          description="Needs movement"
          valueClassName="text-blue-600"
          iconClassName="bg-blue-50 text-blue-600"
          delay={60}
        />
        <SummaryCard
          title="Planned"
          value={stats.planned}
          icon={Clock3}
          description="Not started"
          valueClassName="text-amber-500"
          iconClassName="bg-amber-50 text-amber-600"
          delay={120}
        />
        <SummaryCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          description={`${stats.completionRate}% complete`}
          valueClassName="text-emerald-600"
          iconClassName="bg-emerald-50 text-emerald-600"
          delay={180}
        />
        <SummaryCard
          title="High Risk"
          value={stats.highRisk}
          icon={AlertTriangle}
          description="Priority"
          valueClassName="text-red-600"
          iconClassName="bg-red-50 text-red-600"
          delay={240}
        />
        <SummaryCard
          title="Overdue"
          value={stats.overdue}
          icon={CircleAlert}
          description="Needs review"
          valueClassName="text-red-600"
          iconClassName="bg-red-50 text-red-600"
          delay={300}
        />
        <SummaryCard
          title="Module Signals"
          value={moduleRiskTotal}
          icon={Target}
          description="Recruitment data"
          delay={360}
        />
      </div>
    </section>
  );
}
