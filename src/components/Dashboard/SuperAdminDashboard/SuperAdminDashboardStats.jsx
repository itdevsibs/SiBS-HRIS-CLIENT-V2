import React from "react";
import {
  AlertTriangle,
  Briefcase,
  Clock,
  ShieldCheck,
  Users,
  UserX,
} from "lucide-react";
import { MetricCard, MetricGrid } from "@/components/ui";

const METRICS = [
  {
    key: "employees",
    label: "Employees",
    value: "2,840",
    badge: "+12% MoM",
    description: "Across 18 active depts",
    icon: Users,
    tone: "orange",
  },
  {
    key: "admins",
    label: "Users with Access",
    badge: "10 Access Tiers",
    description: "TA, HR, Finance & Execs",
    icon: ShieldCheck,
    tone: "navy",
  },
  {
    key: "attendance",
    label: "Attendance Flags",
    value: "14",
    badge: "Needs Review",
    description: "Biometric timecard check",
    icon: AlertTriangle,
    tone: "green",
  },
  {
    key: "approvals",
    label: "Pending Approvals",
    value: "18",
    badge: "Cross-Module",
    description: "Leaves, offers & reqs",
    icon: Clock,
    tone: "amber",
  },
  {
    key: "leaves",
    label: "Leaves & Resignations",
    value: "18",
    badge: "14 Leave • 4 Resig",
    description: "Active clearance pipelines",
    icon: UserX,
    tone: "red",
  },
  {
    key: "recruitment",
    label: "Recruitment Funnel",
    value: "142",
    badge: "8 Offers Pending",
    description: "18 open requisitions",
    icon: Briefcase,
    tone: "indigo",
  },
];

export default function SuperAdminDashboardStats({
  adminCount,
  liveMetrics = null,
  onMetricClick,
}) {
  return (
    <MetricGrid columns={6}>
      {METRICS.map((metric, index) => {
        let val = metric.value;
        let desc = metric.description;

        if (liveMetrics) {
          if (metric.key === "employees" && liveMetrics.employees) {
            val = liveMetrics.employees;
            if (liveMetrics.departmentsCount) {
              desc = `Across ${liveMetrics.departmentsCount} active depts`;
            }
          } else if (metric.key === "admins") {
            val = String(liveMetrics.admins || adminCount || 0);
          } else if (metric.key === "attendance" && liveMetrics.attendanceFlags !== undefined) {
            val = String(liveMetrics.attendanceFlags);
          } else if (metric.key === "approvals" && liveMetrics.pendingApprovals !== undefined) {
            val = String(liveMetrics.pendingApprovals);
          } else if (metric.key === "leaves" && liveMetrics.leavesCount !== undefined) {
            val = String(liveMetrics.leavesCount);
          } else if (metric.key === "recruitment" && liveMetrics.recruitmentCount !== undefined) {
            val = String(liveMetrics.recruitmentCount);
          }
        } else if (metric.key === "admins") {
          val = String(adminCount || 0);
        }

        return (
          <MetricCard
            key={metric.key}
            label={metric.label}
            value={val}
            description={desc}
            badge={metric.badge}
            icon={metric.icon}
            tone={metric.tone}
            delay={index * 60}
            onClick={() => onMetricClick?.(metric)}
          />
        );
      })}
    </MetricGrid>
  );
}


