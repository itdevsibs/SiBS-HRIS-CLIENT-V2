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
import { useHiringNeeds } from "../../../services/context/HiringNeedsContext";

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
    valueClassName: "text-[#042C51]",
    iconClassName: "bg-[#EAF2FB] text-[#042C51]",
  },
  {
    key: "totalHeadcount",
    title: "Headcount",
    description: "Total personnel",
    icon: CalendarDays,
    valueClassName: "text-[#042C51]",
    iconClassName: "bg-[#EAF2FB] text-[#042C51]",
  },
  {
    key: "forApproval",
    title: "For Approval",
    description: "Pending review",
    icon: Clock3,
    valueClassName: "text-[#F59E0B]",
    iconClassName: "bg-amber-50 text-[#042C51]",
  },
  {
    key: "approved",
    title: "Approved",
    description: "Ready for hiring",
    icon: CheckCircle2,
    valueClassName: "text-emerald-600",
    iconClassName: "bg-emerald-50 text-[#042C51]",
  },
  {
    key: "notApproved",
    title: "Not Approved",
    description: "Rejected/closed",
    icon: XCircle,
    valueClassName: "text-red-600",
    iconClassName: "bg-red-50 text-[#042C51]",
  },
];

function MetricCard({ item, value, delay = 0 }) {
  return (
    <article
      className="sibs-metric-card"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex h-full items-start justify-between gap-4">
        <div className="min-w-0 flex-1 self-stretch">
          <p className="sibs-kicker">{item.title}</p>

          <p
            className={`mt-2 text-3xl font-extrabold leading-none tabular-nums tracking-normal ${item.valueClassName}`}
          >
            {value.toLocaleString("en-PH")}
          </p>

          <p className="mt-1.5 line-clamp-2 text-xs font-bold leading-4 text-[#667085]">
            {item.description}
          </p>
        </div>

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.iconClassName}`}
        >
          {React.createElement(item.icon, { size: 17, strokeWidth: 2 })}
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
