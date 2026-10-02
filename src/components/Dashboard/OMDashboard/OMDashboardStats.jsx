import React from "react";
import { MetricCard, MetricGrid } from "@/components/ui";

function mapTone(tone = "navy") {
  if (tone === "rose") return "red";
  if (tone === "slate") return "navy";
  return tone || "navy";
}

export default function OMDashboardStats({ metrics = [] }) {
  return (
    <MetricGrid columns={7}>
      {metrics.map((item, index) => (
        <MetricCard
          key={item.id || item.label}
          label={item.label}
          value={item.value}
          description={item.description}
          icon={item.icon}
          tone={mapTone(item.tone)}
          delay={index * 60}
        />
      ))}
    </MetricGrid>
  );
}
