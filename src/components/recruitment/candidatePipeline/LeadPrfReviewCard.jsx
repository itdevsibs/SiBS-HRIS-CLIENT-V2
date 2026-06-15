import React from "react";
import { ChevronDown } from "lucide-react";

import { prfStatusOptions } from "../../../lib/utils/candidatePipeline/candidatePipelineConstants";
import { getPrfStatusClass } from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";

const LeadPrfReviewCard = ({ candidate, onUpdatePrfStatus }) => {
  const currentStatus = candidate?.prfStatus || "Unmatched";

  function handleStatusChange(event) {
    const nextStatus = event.target.value;

    if (!nextStatus || nextStatus === currentStatus) return;

    onUpdatePrfStatus?.(candidate, nextStatus);
  }

  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#101828]">PRF Review</h3>

          <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
            Select the lead PRF status before moving forward.
          </p>
        </div>

        <span
          className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${getPrfStatusClass(
            currentStatus,
          )}`}
        >
          Current: {currentStatus}
        </span>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
          PRF Status
        </label>

        <div className="relative">
          <select
            value={currentStatus}
            onChange={handleStatusChange}
            className="h-12 w-full appearance-none rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-4 pr-11 text-sm font-extrabold text-sibs-primary-1 outline-none transition hover:bg-white focus:border-sibs-primary-1 focus:bg-white focus:ring-4 focus:ring-sibs-primary-1/10"
          >
            {prfStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <ChevronDown
            size={18}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sibs-primary-1"
          />
        </div>

        <p className="mt-2 text-xs font-semibold leading-5 text-sibs-tertiary-5">
          Changing this value will immediately update the candidate PRF review
          status.
        </p>
      </div>
    </div>
  );
};

export default LeadPrfReviewCard;
