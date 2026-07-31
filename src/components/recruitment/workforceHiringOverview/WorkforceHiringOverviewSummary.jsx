import {
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

  const metrics = [
    {
      title: "Required HC",
      value: summary.requiredHeadcount,
      subtitle: "Approved baseline",
      icon: Users,
      tone: "navy",
    },
    {
      title: "Actual HC",
      value: summary.actualHeadcount,
      subtitle: "Roster count",
      icon: Users,
      tone: "navy",
    },
    {
      title: "Buffer %",
      value: `${Number(summary.bufferPercentage || 0).toFixed(2)}%`,
      subtitle: "VS required HC",
      icon: Gauge,
      tone: Number(summary.bufferPercentage || 0) < 0 ? "red" : "green",
    },
    {
      title: "Absenteeism",
      value: `${Number(summary.absenteeismPercentage || 0).toFixed(2)}%`,
      subtitle: "Absenteeism%",
      icon: CalendarX2,
      tone: "amber",
    },
    {
      title: "Attrition",
      value: `${Number(summary.attritionPercentage || 0).toFixed(2)}%`,
      subtitle: "Attrition%",
      icon: UserRoundX,
      tone: "red",
    },
    {
      title: "Net Actual HC",
      value: Math.round(summary.netActualHc),
      subtitle: "Floor Availability",
      icon: Users,
      tone: "navy",
    },
    {
      title: "Hiring Needed",
      value: Math.round(summary.hiringNeeded),
      subtitle: "Total Coverage Gap",
      icon: UserPlus,
      tone: "indigo",
    },
    {
      title: "Hiring Rate",
      value: `${Number(summary.hiringRate || 0).toFixed(1)}%`,
      subtitle: "Leads yield",
      icon: TrendingUp,
      tone: "teal",
    },
    {
      title: "Hired Count",
      value: summary.hiredCount,
      subtitle: "Current deployed hiring output",
      icon: CheckCircle2,
      tone: "green",
    },
  ];

  return (
    <section className="space-y-3">


      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-9">
        {metrics.map((metric, index) => (
          <KpiCard
            key={metric.title}
            {...metric}
            delay={60 + index * 45}
          />
        ))}
      </div>
    </section>
  );
}




