import React from "react";
import {
  formatDate,
  getGapClass,
  getModuleClass,
  getRiskClass,
  getStatusClass,
} from "../../../lib/utils/actionItems/actionItemsHelpers.js";

export default function ActionItemMobileCard({ item, onView }) {
  return (
    <button
      type="button"
      onClick={() => onView(item)}
      className="sibs-page-card-in w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold text-sibs-primary-1">
              {item.actionId}
            </p>
            {item.systemGenerated ? (
              <span className="inline-flex rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                Suggested
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-[#101828]">
            {item.actionItem}
          </h3>
          <p className="mt-1 break-words text-xs font-semibold text-sibs-tertiary-5">
            {item.roleTitle || "—"} / {item.account || "—"}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
            item.status,
          )}`}
        >
          {item.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Owner
          </p>
          <p className="mt-1 truncate text-xs font-bold text-[#344054]">
            {item.owner}
          </p>
        </div>
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Deadline
          </p>
          <p className="mt-1 text-xs font-bold text-[#344054]">
            {formatDate(item.deadline)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getModuleClass(
            item.module,
          )}`}
        >
          {item.module || "Recruitment"}
        </span>
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getRiskClass(
            item.riskLevel,
          )}`}
        >
          {item.riskLevel} Risk
        </span>
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getGapClass(
            item.linkedGap,
          )}`}
        >
          {item.linkedGap}
        </span>
      </div>
    </button>
  );
}
