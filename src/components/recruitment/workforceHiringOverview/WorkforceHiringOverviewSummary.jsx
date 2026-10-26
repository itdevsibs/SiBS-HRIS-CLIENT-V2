import React from "react";
import {
  CalendarX2,
  CheckCircle2,
  Gauge,
  TrendingUp,
  UserPlus,
  UserRoundX,
  Users,
} from "lucide-react";
import { useWorkforceHiringView } from "@/services/context/WorkforceHiringContextAdapter";
import { MetricGridSkeleton, MetricCardSkeleton } from "@/components/ui";
import KpiCard from "./shared/KpiCard";
import { WORKFORCE_OVERVIEW_METRIC_LABELS } from "../../../lib/utils/workforceHiringOverview/workforceHiringOverviewConstants";

export default function WorkforceHiringOverviewSummary() {
  const {
    overview,
    status,
  } = useWorkforceHiringView();
  const summary = overview?.summary || {};

  if (status?.isLoading) {
    const preview = status?.rosterPreview;
    if (preview && Number.isFinite(preview.actualHeadcount)) {
      return (
        <section aria-label="Workforce roster preview" className="space-y-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-9 xl:gap-3 2xl:gap-4">
            {WORKFORCE_OVERVIEW_METRIC_LABELS.map((label) =>
              label === "Actual HC" ? (
                <KpiCard
                  key={label}
                  title={label}
                  value={preview.actualHeadcount}
                  subtitle="Roster preview"
                  icon={Users}
                  tone="navy"
                />
              ) : (
                <MetricCardSkeleton key={label} label={label} />
              ),
            )}
          </div>
          <p role="status" className="px-1 text-xs text-sibs-muted">
            Roster preview as of {preview.asOfDate}. Attendance, attrition, and hiring metrics are still being calculated from Kronos; no unavailable value is shown as zero.
          </p>
        </section>
      );
    }
    return (
      <MetricGridSkeleton
        labels={WORKFORCE_OVERVIEW_METRIC_LABELS}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-9 xl:gap-3 2xl:gap-4"
        testId="workforce-summary-skeleton"
        ariaLabel="Loading workforce hiring summary metrics"
      />
    );
  }

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
      subtitle: "Deployed Hires",
      icon: CheckCircle2,
      tone: "green",
    },
  ];

  return (
    <section className="space-y-3">


      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-9 xl:gap-3 2xl:gap-4">
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






