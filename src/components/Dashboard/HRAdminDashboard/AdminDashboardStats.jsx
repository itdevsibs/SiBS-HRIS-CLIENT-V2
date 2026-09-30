import React from "react";
import { MetricCard, MetricGrid } from "@/components/ui";

export default function AdminDashboardStats({
  metrics = [],
  onMetricClick,
}) {
  return (
    <MetricGrid>
      {metrics.map((metric, index) => (
        <MetricCard
          key={metric.id}
          label={metric.label}
          value={metric.value}
          description={metric.description}
          badge={metric.badge}
          icon={metric.icon}
          tone={metric.tone}
          delay={index * 60}
          onClick={() => onMetricClick?.(metric)}
        />
      ))}
    </MetricGrid>
  );
}
