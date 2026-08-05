import React from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckSquare,
  Clock3,
  Layers3,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useActionItemsReport } from "../../../services/context/ActionItemsReportContext.jsx";

function SummaryCard({ title, value, icon: Icon, description, tone = "navy", delay = 0, featured = false }) {
  return (
    <article
      className={`sibs-metric-card sibs-page-card-in flex min-h-[110px] flex-col justify-between ${
        featured ? "!border-transparent !bg-gradient-to-br !from-[#042C51] !to-[#0A467E] text-white" : ""
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={`min-w-0 truncate text-[10px] font-extrabold uppercase tracking-normal ${featured ? "text-white" : `sibs-tone-${tone}-label`}`}>
          {title}
        </p>

        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${featured ? "bg-white/10 text-[#FF5C28]" : `sibs-tone-${tone}-icon`}`}>
          <Icon size={17} strokeWidth={2} />
        </span>
      </div>

      <div className="mt-2">
        <p className={`text-3xl font-extrabold leading-none tabular-nums tracking-normal ${featured ? "text-white" : `sibs-tone-${tone}-label`}`}>
          {value}
        </p>
        <p className={`mt-1.5 text-xs font-bold ${featured ? "text-slate-200" : "text-[#667085]"}`}>
          {description}
        </p>
      </div>
    </article>
  );
}

export default function ActionItemsStats() {
  const { executionMetrics } = useActionItemsReport();

  return (
    <section className="sibs-profile-tab-panel" style={{ animationDelay: "60ms" }}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <SummaryCard title="At-Risk Accounts" value={executionMetrics.atRiskAccounts} icon={ShieldAlert} description="Critical attention" tone="red" />
        <SummaryCard title="Missing Action" value={executionMetrics.missingActionAccounts} icon={AlertCircle} description="Uncovered gaps" tone="amber" delay={50} />
        <SummaryCard title="Planned" value={executionMetrics.planned} icon={Layers3} description="Queued actions" tone="indigo" delay={100} />
        <SummaryCard title="Ongoing" value={executionMetrics.ongoing} icon={Clock3} description="In progress" tone="amber" delay={150} />
        <SummaryCard title="Overdue" value={executionMetrics.overdue} icon={AlertTriangle} description="Breached deadline" tone="red" delay={200} />
        <SummaryCard title="Completed" value={executionMetrics.completed} icon={CheckSquare} description="Resolved actions" tone="green" delay={250} />
        <SummaryCard title="System Suggested" value={executionMetrics.systemSuggested} icon={Sparkles} description="Signals + auto tasks" featured delay={300} />
      </div>
    </section>
  );
}
