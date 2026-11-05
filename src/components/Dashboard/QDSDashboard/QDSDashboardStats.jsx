import React from "react";
import { Users, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { MetricCard, MetricGrid } from "@/components/ui";

/**
 * QDSDashboardStats Component
 * Tier 2 Executive Horizon MetricGrid displaying high-signal KPIs
 * for Quality Development Specialists (QDS).
 */
export default function QDSDashboardStats({
  metrics = {},
  loading = false,
  onMetricClick,
}) {
  // Support both object payload and pre-formatted array payloads
  if (Array.isArray(metrics)) {
    return (
      <MetricGrid columns={4}>
        {metrics.map((metric, index) => (
          <MetricCard
            key={metric.id || metric.label || index}
            label={metric.label}
            value={metric.value}
            description={metric.description || metric.subtitle}
            icon={metric.icon}
            tone={metric.tone}
            delay={index * 60}
            loading={loading}
            onClick={onMetricClick ? () => onMetricClick(metric) : undefined}
          />
        ))}
      </MetricGrid>
    );
  }

  const totalTrainees =
    metrics.totalTrainees ??
    metrics.traineesCount ??
    metrics.funnel?.activeTrainees ??
    (Array.isArray(metrics.trainees) ? metrics.trainees.length : 0);

  const rawPassRate =
    metrics.qaPassRate ??
    metrics.passRate ??
    0;
  const qaPassRate =
    typeof rawPassRate === "number"
      ? `${Math.round(rawPassRate)}%`
      : String(rawPassRate).includes("%")
      ? rawPassRate
      : `${rawPassRate}%`;

  const calibrationGaps =
    metrics.calibrationGaps ??
    metrics.gapCount ??
    0;

  const pendingAudits =
    metrics.pendingAudits ??
    metrics.pendingQualityAudits ??
    0;

  const statItems = [
    {
      id: "trainees-in-oversight",
      label: "TRAINEES IN OVERSIGHT",
      value: Number(totalTrainees || 0).toLocaleString(),
      subtitle: "Active in NHO, FST & PST cohorts",
      tone: "orange",
      icon: Users,
    },
    {
      id: "independent-qa-pass-rate",
      label: "INDEPENDENT QA PASS RATE",
      value: qaPassRate,
      subtitle: "Met quality benchmark threshold",
      tone: "green",
      icon: CheckCircle2,
    },
    {
      id: "calibration-gaps",
      label: "CALIBRATION GAPS",
      value: Number(calibrationGaps || 0).toLocaleString(),
      subtitle: "Trainer vs QDS score variance >= 10pp",
      tone: calibrationGaps > 0 ? "red" : "amber",
      icon: AlertTriangle,
    },
    {
      id: "pending-quality-audits",
      label: "PENDING QUALITY AUDITS",
      value: Number(pendingAudits || 0).toLocaleString(),
      subtitle: "Awaiting QDS sign-off & evaluation",
      tone: "navy",
      icon: ShieldCheck,
    },
  ];

  return (
    <MetricGrid columns={4}>
      {statItems.map((item, index) => (
        <MetricCard
          key={item.id}
          label={item.label}
          value={item.value}
          description={item.subtitle}
          icon={item.icon}
          tone={item.tone}
          delay={index * 60}
          loading={loading}
          onClick={onMetricClick ? () => onMetricClick(item) : undefined}
        />
      ))}
    </MetricGrid>
  );
}
