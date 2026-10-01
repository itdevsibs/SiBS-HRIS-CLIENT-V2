import React from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  XCircle,
} from "lucide-react";

import ReasonForHiringTable from "../../tables/HiringNeeds/ReasonForHiringTable";
import RequisitionByDepartmentTable from "../../tables/HiringNeeds/RequisitionByDepartmentTable";
import { MetricCard, MetricGrid, MetricGridSkeleton } from "@/components/ui";
import { useHiringNeeds } from "@/services/context/HiringNeedsContext";

const HIRING_NEEDS_METRIC_LABELS = [
  "Total PRF",
  "Headcount",
  "For Approval",
  "Approved",
  "Not Approved",
];

function getStatValue(stats, key) {
  const value = Number(stats?.[key] || 0);
  return Number.isFinite(value) ? value : 0;
}

const metricConfig = [
  {
    key: "total",
    title: "Total PRF",
    description: "Total requests",
    icon: FileText,
    tone: "navy",
  },
  {
    key: "totalHeadcount",
    title: "Headcount",
    description: "Total personnel",
    icon: CalendarDays,
    tone: "indigo",
  },
  {
    key: "forApproval",
    title: "For Approval",
    description: "Pending review",
    icon: Clock3,
    tone: "amber",
  },
  {
    key: "approved",
    title: "Approved",
    description: "Ready for hiring",
    icon: CheckCircle2,
    tone: "green",
  },
  {
    key: "notApproved",
    title: "Not Approved",
    description: "Rejected/closed",
    icon: XCircle,
    tone: "red",
  },
];

export default function HiringNeedsStats() {
  const {
    stats,
    loading,
    requisitionByReason,
    requisitionByDepartment,
  } = useHiringNeeds();

  return (
    <section className="space-y-4">
      {loading ? (
        <MetricGridSkeleton
          count={5}
          labels={HIRING_NEEDS_METRIC_LABELS}
          ariaLabel="Loading hiring needs metrics"
          className="grid grid-cols-1 gap-2.5 2xl:gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        />
      ) : (
        <MetricGrid columns={5}>
          {metricConfig.map((item, index) => (
            <MetricCard
              key={item.key}
              label={item.title}
              value={getStatValue(stats, item.key).toLocaleString("en-PH")}
              description={item.description}
              icon={item.icon}
              tone={item.tone}
              delay={index * 60}
            />
          ))}
        </MetricGrid>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ReasonForHiringTable
          data={requisitionByReason}
          loading={loading}
          delay={metricConfig.length * 60}
        />
        <RequisitionByDepartmentTable
          data={requisitionByDepartment}
          loading={loading}
          delay={(metricConfig.length + 1) * 60}
        />
      </div>
    </section>
  );
}
