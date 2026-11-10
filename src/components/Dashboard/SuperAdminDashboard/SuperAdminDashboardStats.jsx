import React from "react";
import {
  CalendarCheck,
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
    label: "Recorded Attendance",
    value: "—",
    description: "Employees with an attendance record",
    icon: CalendarCheck,
    tone: "green",
  },
  {
    key: "approvals",
    label: "Pending Attrition Approvals",
    value: "—",
    description: "Pending status in your Attrition approval queue",
    icon: Clock,
    tone: "amber",
  },
  {
    key: "leaves",
    label: "Pending Leave Requests",
    value: "—",
    description: "Last 6 weeks in your leave scope",
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
          } else if (metric.key === "attendance" && liveMetrics.attendancePresent !== undefined) {
            val = liveMetrics.attendancePresent;
            if (liveMetrics.attendanceDate) desc += ` · ${liveMetrics.attendanceDate}`;
          } else if (metric.key === "approvals" && liveMetrics.pendingApprovals !== undefined) {
            val = String(liveMetrics.pendingApprovals);
          } else if (metric.key === "leaves" && liveMetrics.leavesCount !== undefined) {
            val = String(liveMetrics.leavesCount);
          }
        }

        const loading = (metric.key === "leaves" && liveMetrics?.leavesStatus === "updating") ||
          (metric.key === "approvals" && liveMetrics?.approvalsLoading);
        if (val === "—" && !loading) badge = "Unavailable";

        return (
          <MetricCard
            key={metric.key}
            label={metric.label}
            value={val}
            loading={loading}
            description={desc}
            badge={badge}
            icon={metric.icon}
            tone={metric.tone}
            delay={60 + index * 60}
            onClick={metric.key === "attendance" || (metric.key === "leaves" && !liveMetrics?.leavesDateRange)
              ? undefined : () => onMetricClick?.(metric)}
          />
        );
      })}
    </MetricGrid>
  );
}


