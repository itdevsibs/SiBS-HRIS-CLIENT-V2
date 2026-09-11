import React from "react";
import { AlertTriangle, CheckCircle2, MinusCircle } from "lucide-react";
import { DataCard } from "@/components/ui";
import {
  getHiringNeedsDateOrWeek,
  getHiringNeedsJdLinkStatus,
  getHiringNeedsRequestType,
  isHiringNeedUnlinkedFromJd,
} from "../../../lib/utils/hiringNeeds/hiringNeedsHelpers";

function getStatusClass(status) {
  switch (status) {
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Not Approved":
      return "border-red-200 bg-red-50 text-red-700";
    case "For Approval":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

export default function HiringNeedsMobileCard({ item, onView }) {
  const unlinked = isHiringNeedUnlinkedFromJd(item);
  const jdLinkStatus = getHiringNeedsJdLinkStatus(item);
  const linkNotApplicable = jdLinkStatus === "Not Applicable";
  const requestType = getHiringNeedsRequestType(item);
  const dateOrWeek = getHiringNeedsDateOrWeek(item);

  return (
    <DataCard
      interactive
      onClick={() => onView(item)}
      className={unlinked ? "border-[#FFD1C4] bg-[#FFF8F5]" : ""}
    >
      <DataCard.Header
        title={item.positionTitle || "Untitled Position"}
        subtitle={
          <span className="truncate">
            <span className="font-extrabold text-[#FF5C28]">{item.id}</span> ·{" "}
            {item.departmentAccount}
          </span>
        }
        badge={
          <span
            className={`inline-flex shrink-0 items-center justify-center rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${getStatusClass(
              item.approvalStatus,
            )}`}
          >
            {item.approvalStatus}
          </span>
        }
      />

      <DataCard.ContextRow>
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-[#F8FAFC] px-2 py-0.5 text-[9px] font-extrabold leading-none text-[#042C51]">
          {requestType}
        </span>
        <span className="text-[11px] font-semibold text-[#667085]">
          {item.locationSite || "—"}
        </span>
        {dateOrWeek && (
          <span className="text-[11px] font-semibold text-[#667085]">
            Target: {dateOrWeek}
          </span>
        )}
      </DataCard.ContextRow>

      <DataCard.Metrics cols={3}>
        <DataCard.MetricItem
          label="Headcount"
          value={item.headcount || 0}
          tone="primary"
        />
        <DataCard.MetricItem label="Request Type" value={requestType} />
        <DataCard.MetricItem
          label="Site"
          value={item.locationSite || "—"}
        />
      </DataCard.Metrics>

      {item.reasonForHiring ? (
        <div className="mt-2.5 rounded-lg border border-slate-100 bg-[#F8FAFC] px-2.5 py-1.5 text-left">
          <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
            Reason
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs font-semibold text-[#344054]">
            {item.reasonForHiring}
          </p>
        </div>
      ) : null}

      <DataCard.Footer>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${
            unlinked
              ? "border-[#FFB39F] bg-[#FFE1D8] text-[#D92D20]"
              : linkNotApplicable
                ? "border-slate-200 bg-slate-50 text-slate-500"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {unlinked ? (
            <AlertTriangle size={10} />
          ) : linkNotApplicable ? (
            <MinusCircle size={10} />
          ) : (
            <CheckCircle2 size={10} />
          )}
          {jdLinkStatus}
        </span>

        <span className="shrink-0 text-[10px] font-extrabold uppercase text-sibs-orange">
          View Details →
        </span>
      </DataCard.Footer>
    </DataCard>
  );
}
