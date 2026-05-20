import React from "react";
import { prfStatusOptions } from "../../../lib/utils/candidatePipeline/candidatePipelineConstants";
import { getPrfStatusClass } from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";

const LeadPrfReviewCard = ({ candidate, onUpdatePrfStatus }) => {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#101828]">PRF Review</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
            Tag the lead as Review, Matched, or Unmatched before moving forward.
          </p>
        </div>

        <span
          className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${getPrfStatusClass(
            candidate.prfStatus || "Review",
          )}`}
        >
          Current: {candidate.prfStatus || "Review"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {prfStatusOptions.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onUpdatePrfStatus(candidate, status)}
            className={`group inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border px-4 text-sm font-extrabold shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sibs-primary-1/10 ${getPrfStatusClass(
              status,
            )}`}
          >
            <span className="transition group-hover:tracking-wide">
              Set as {status}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LeadPrfReviewCard;
