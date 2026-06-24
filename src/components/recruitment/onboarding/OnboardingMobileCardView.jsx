import React from "react";
import { Eye } from "lucide-react";

export default function OnboardingMobileCardView({
  record,
  onView,
  formatDate,
  getShowStatusClass,
  getOutcomeClass
}) {
  return (
    <button
      type="button"
      onClick={onView}
      className="sibs-page-card-in w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-sibs-primary-1">
            {record.onboardingId}
          </p>

          <h3 className="mt-1 text-sm font-bold text-[#101828]">
            {record.candidateName}
          </h3>

          <p className="mt-1 break-words text-xs font-semibold text-sibs-tertiary-5">
            {record.roleTitle} / {record.account}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getShowStatusClass(
            record.showStatus,
          )}`}
        >
          {record.showStatus}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Expected
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">
            {formatDate(record.expectedStartDate)}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Actual
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">
            {formatDate(record.actualStartDate)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getOutcomeClass(
            record.finalOutcome,
          )}`}
        >
          {record.finalOutcome}
        </span>

        <span className="inline-flex rounded-full border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-bold text-[#344054]">
          {record.owner}
        </span>
      </div>

      {(record.showStatus === "No Show" || record.showStatus === "Withdrawn") &&
        record.withdrawalReason && (
          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold leading-5 text-red-700">
            {record.withdrawalReason}
          </div>
        )}

      <div className="mt-4">
        <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-3 py-2 text-xs font-bold text-sibs-primary-1">
          <Eye size={15} />
          View Details
        </span>
      </div>
    </button>
  );
}