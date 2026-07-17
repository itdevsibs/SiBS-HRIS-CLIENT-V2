import {
  CalendarDays,
  CalendarX,
  CalendarX2,
  CheckCircle2,
  Gauge,
  TrendingUp,
  UserPlus,
  UserRoundX,
  Users,
} from "lucide-react";
import { useWorkforceHiringView } from "../../../services/context/WorkforceHiringContextAdapter";
import KpiCard from "./shared/KpiCard";

export default function WorkforceHiringOverviewSummary() {
  const {
    overview: { summary },
  } = useWorkforceHiringView();

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h2 className="text-base font-bold uppercase tracking-tight text-slate-900">
          Workforce Plan Overview (Aggregated)
        </h2>
        <p className="mt-1 text-sm font-medium text-sibs-primary-70">
          Aggregated workforce hiring plan metrics based on the selected week,
          cluster, and account filters.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-9">
        <KpiCard
          title="Required Headcount"
          value={summary.requiredHeadcount}
          icon={Users}
          tone="blue"
        />
        <KpiCard
          title="Actual Headcount"
          value={summary.actualHeadcount}
          icon={Users}
          tone="blue"
        />
        <KpiCard
          title="Buffer Percentage"
          value={`${summary.bufferPercentage.toFixed(2)}%`}
          icon={Gauge}
          subtitle="vs Required HC"
          tone="green2"
          // tone={summary.bufferPercentage < 0 ? "red" : "green"}
        />
        <KpiCard
          title="Absenteeism"
          value={Math.round(summary.absenteeism)}
          sideValue={`${summary.absenteeismPercentage.toFixed(2)}%`}
          icon={CalendarX2}
          subtitle="Absenteeism %"
          tone="orange"
        />
        <KpiCard
          title="Attrition"
          value={summary.attrition}
          sideValue={`${summary.attritionPercentage.toFixed(2)}%`}
          icon={UserRoundX}
          subtitle="Attrition %"
          tone="red"
        />
        <KpiCard
          title="Net Actual HC"
          value={Math.round(summary.netActualHc)}
          icon={Users}
          tone="blue"
        />
        <KpiCard
          title="Hiring Needed"
          value={Math.round(summary.hiringNeeded)}
          icon={UserPlus}
          tone="purple"
        />
        <KpiCard
          title="Hiring Rate"
          value={`${summary.hiringRate.toFixed(1)}%`}
          icon={TrendingUp}
          subtitle="Leads to JO"
          tone="teal"
        />
        <KpiCard
          title="Hired Count"
          value={summary.hiredCount}
          icon={CheckCircle2}
          tone="green"
        />
      </div>
    </section>
  );
}
