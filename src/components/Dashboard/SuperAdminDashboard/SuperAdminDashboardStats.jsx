import React from "react";
import {
  AlertTriangle,
  Clock,
  Users,
  UserX,
} from "lucide-react";
import { MetricCard, MetricGrid } from "@/components/ui";

const METRICS = [
  {
    key: "employees",
    label: "Active Employees",
    value: "—",
    description: "Active employee records",
    icon: Users,
    tone: "orange",
  },
  {
    key: "attendance",
    label: "Attendance Flags",
    value: "—",
    description: "Biometric timecard check",
    icon: AlertTriangle,
    tone: "green",
  },
  {
    key: "approvals",
    label: "Pending Approvals",
    value: "—",
    description: "Leaves, offers & reqs",
    icon: Clock,
    tone: "amber",
  },
  {
    key: "leaves",
    label: "Pending Leaves",
    value: "—",
    description: "Leave requests awaiting review",
    icon: UserX,
    tone: "red",
  },
];

export default function SuperAdminDashboardStats({
  liveMetrics = null,
  onMetricClick,
}) {
  return (
    <MetricGrid columns={4}>
      {METRICS.map((metric, index) => {
        let val = metric.value;
        let desc = metric.description;
        let badge = metric.badge;

        if (liveMetrics) {
          if (metric.key === "employees" && liveMetrics.employees !== undefined) {
            val = liveMetrics.employees;
            if (liveMetrics.departmentsCount) {
              desc = `Across ${liveMetrics.departmentsCount} active depts`;
            }
          } else if (metric.key === "attendance" && liveMetrics.attendanceFlags !== undefined) {
            val = String(liveMetrics.attendanceFlags);
            badge = Number(val) > 0 ? "Needs Review" : "All Clear";
          } else if (metric.key === "approvals" && liveMetrics.pendingApprovals !== undefined) {
            val = String(liveMetrics.pendingApprovals);
            badge = Number(val) > 0 ? "Cross-Module" : "Queue Clear";
          } else if (metric.key === "leaves" && liveMetrics.leavesCount !== undefined) {
            val = String(liveMetrics.leavesCount);
            badge = Number(val) > 0 ? `${val} Active` : "None Active";
          }
        }

        return (
          <MetricCard
            key={metric.key}
            label={metric.label}
            value={val}
            description={desc}
            badge={badge}
            icon={metric.icon}
            tone={metric.tone}
            delay={60 + index * 60}
            onClick={() => onMetricClick?.(metric)}
          />
        );
      })}
    </MetricGrid>
  );
}


