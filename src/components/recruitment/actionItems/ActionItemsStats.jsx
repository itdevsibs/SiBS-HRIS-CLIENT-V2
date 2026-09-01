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
      className={`sibs-metric-card sibs-page-card-in flex h-[104px] 2xl:h-[116px] min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden p-2.5 2xl:p-3.5 font-jakarta ${
        featured ? "!border-transparent !bg-gradient-to-br !from-[#042C51] !to-[#0A467E] text-white" : ""
      }`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex h-full items-start justify-between gap-2 2xl:gap-3">
        <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
          <div>
            <p
              className={`m-0 truncate sibs-text-micro font-extrabold uppercase ${
                featured ? "text-white" : `sibs-tone-${tone}-label`
              }`}
            >
              {title}
            </p>

            <p
              className={`font-heading mt-1.5 2xl:mt-2 text-xl 2xl:text-3xl font-bold leading-none tabular-nums tracking-tight ${
                featured ? "text-white" : `sibs-tone-${tone}-label`
              }`}
            >
              {value}
            </p>
          </div>

          <p
            className={`line-clamp-1 truncate sibs-text-micro font-bold ${
              featured ? "text-slate-200" : "text-[#667085]"
            }`}
          >
            {description}
          </p>
        </div>

        <span
          className={`flex h-7.5 w-7.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full ${
            featured ? "bg-white/10 text-[#FF5C28]" : `sibs-tone-${tone}-icon`
          }`}
        >
          <Icon className="h-3.5 w-3.5 2xl:h-4.5 2xl:w-4.5" strokeWidth={2} />
        </span>
      </div>
    </article>
  );
}

export default function ActionItemsStats() {
  const { executionMetrics } = useActionItemsReport();

  return (
    <section>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7">
        <SummaryCard title="At-Risk Accounts" value={executionMetrics.atRiskAccounts} icon={ShieldAlert} description="Critical attention" tone="red" delay={0} />
        <SummaryCard title="Missing Action" value={executionMetrics.missingActionAccounts} icon={AlertCircle} description="Uncovered gaps" tone="amber" delay={45} />
        <SummaryCard title="Planned" value={executionMetrics.planned} icon={Layers3} description="Queued actions" tone="indigo" delay={90} />
        <SummaryCard title="Ongoing" value={executionMetrics.ongoing} icon={Clock3} description="In progress" tone="amber" delay={135} />
        <SummaryCard title="Overdue" value={executionMetrics.overdue} icon={AlertTriangle} description="Breached deadline" tone="red" delay={180} />
        <SummaryCard title="Completed" value={executionMetrics.completed} icon={CheckSquare} description="Resolved actions" tone="green" delay={225} />
        <SummaryCard title="System Suggested" value={executionMetrics.systemSuggested} icon={Sparkles} description="Signals + auto tasks" featured delay={270} />
      </div>
    </section>
  );
}
