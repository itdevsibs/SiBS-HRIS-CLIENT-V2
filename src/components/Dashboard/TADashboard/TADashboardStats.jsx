import React from "react";
import { MetricCard, MetricGrid } from "@/components/ui";

export default function TADashboardStats({ metrics = [] }) {
  return (
    <MetricGrid>
      {metrics.map((item, index) => (
        <MetricCard
          key={item.id || item.label}
          label={item.label}
          value={item.value}
          description={item.description}
          icon={item.icon}
          tone={item.tone === "rose" ? "red" : item.tone === "slate" ? "navy" : item.tone}
          delay={index * 60}
        />
      ))}
    </MetricGrid>
  );
}
