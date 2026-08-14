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
import { useHiringNeeds } from "@/services/context/HiringNeedsContext";

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

function MetricCard({ item, value, delay = 0 }) {
  return (
    <article
      className="sibs-metric-card"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex h-full items-start justify-between gap-3 2xl:gap-4">
        <div className="min-w-0 flex-1 self-stretch">
          <p
            className={`truncate sibs-text-micro font-extrabold uppercase tracking-normal sibs-tone-${item.tone}-label`}
          >
            {item.title}
          </p>

          <p
            className={`mt-1.5 2xl:mt-2 text-2xl 2xl:text-3xl font-extrabold leading-none tabular-nums tracking-normal sibs-tone-${item.tone}-label`}
          >
            {value.toLocaleString("en-PH")}
          </p>

          <p className="mt-1 line-clamp-2 sibs-text-micro font-bold leading-4 text-[#667085]">
            {item.description}
          </p>
        </div>

        <span
          className={`flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full sibs-tone-${item.tone}-icon`}
        >
          {React.createElement(item.icon, { className: "h-4 w-4 2xl:h-4.5 2xl:w-4.5", strokeWidth: 2 })}
        </span>
      </div>
    </article>
  );
}

export default function HiringNeedsStats() {
  const {
    stats,
    requisitionByReason,
    requisitionByDepartment,
  } = useHiringNeeds();

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metricConfig.map((item, index) => (
          <MetricCard
            key={item.key}
            item={item}
            value={getStatValue(stats, item.key)}
            delay={index * 60}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ReasonForHiringTable
          data={requisitionByReason}
          delay={metricConfig.length * 60}
        />
        <RequisitionByDepartmentTable
          data={requisitionByDepartment}
          delay={(metricConfig.length + 1) * 60}
        />
      </div>
    </section>
  );
}
