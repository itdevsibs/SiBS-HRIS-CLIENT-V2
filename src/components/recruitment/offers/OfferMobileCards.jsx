import { Check, Eye, History, X } from "lucide-react";

import { getStatusClass } from "../../../lib/utils/offers/offerHelpers";
import {
  getLatestNegotiationSummary,
  getOfferEvaluationScores,
} from "../../../lib/utils/offers/offerEvaluationHistory";
import { useOffers } from "../../../services/context/OffersContext";

export default function OfferMobileCards({
  offersOverride = null,
  emptyMessage = "No offered candidates found from Candidate Pipeline.",
}) {
  const {
    filteredOffers = [],
    setSelectedOffer,
    handleApproval,
    canCurrentUserApproveOffer,
    getOfferApprovalStatus,
  } = useOffers();

  const displayedOffers = Array.isArray(offersOverride)
    ? offersOverride
    : filteredOffers;

  function openOffer(offer, section = "") {
    setSelectedOffer(
      section
        ? {
            ...offer,
            __openSection: section,
          }
        : offer,
    );
  }

  if (!displayedOffers.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#D6DEE8] bg-[#F8FAFC] px-4 py-10 text-center text-sm font-bold text-[#667085] lg:hidden">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:hidden">
      {displayedOffers.map((offer, index) => {
        const approvalStatus = getOfferApprovalStatus
          ? getOfferApprovalStatus(offer)
          : offer.offerApprovalStatus || offer.status || "For Review";
        const authorized =
          typeof canCurrentUserApproveOffer === "function"
            ? canCurrentUserApproveOffer(offer)
            : Boolean(canCurrentUserApproveOffer);
        const scores = getOfferEvaluationScores(offer);
        const negotiation = getLatestNegotiationSummary(offer);

        return (
          <article
            key={`mobile-${offer.offerId}-${offer.candidateApplicationId}-${offer.id}`}
            className="sibs-page-card-in rounded-2xl border border-[#D9E2EC] bg-white p-4 shadow-sm"
            style={{ animationDelay: `${index * 45}ms`, animationFillMode: "both" }}
          >
            <button
              type="button"
              onClick={() => openOffer(offer)}
              className="block w-full text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words font-jakarta text-sm font-extrabold text-[#042C51]">
                    {offer.candidateName || "—"}
                  </p>
                  <p className="mt-0.5 break-words font-jakarta text-[10px] font-semibold text-[#667085]">
                    {offer.offerId || "—"} • {offer.candidateId || "—"}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${getStatusClass(
                    approvalStatus,
                  )}`}
                >
                  {approvalStatus}
                </span>
              </div>
            </button>

            <div className="mt-3 grid grid-cols-1 gap-2.5 rounded-xl bg-[#F8FAFC] p-3 sm:grid-cols-2">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-wide text-[#667085]">
                  Final Role / Account
                </p>
                <p className="mt-0.5 break-words font-jakarta text-xs font-extrabold text-[#042C51]">
                  {offer.roleTitle || "—"}
                </p>
                <p className="mt-0.5 break-words font-jakarta text-[10px] font-semibold text-[#667085]">
                  {offer.account || "—"}
                </p>
              </div>

              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-wide text-[#667085]">
                  Owner
                </p>
                <p className="mt-0.5 break-words font-jakarta text-xs font-bold text-[#042C51]">
                  {offer.owner || "—"}
                </p>
              </div>
            </div>

            <section className="mt-3 rounded-xl border border-[#E6ECF2] bg-white p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
                Evaluation Scores
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  ["Assessment", scores.assessment.display],
                  ["Job Evaluation", scores.jobEvaluation.display],
                  ["Final Interview", scores.finalInterview.display],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-[#F8FAFC] p-2.5">
                    <p className="text-[10px] font-bold text-[#667085]">
                      {label}
                    </p>
                    <p className="mt-1 text-xs font-extrabold text-[#042C51]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  Negotiation
                </p>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold text-sibs-primary-1">
                  Version {negotiation.versionNumber}
                </span>
              </div>
              <p className="mt-2 text-xs font-bold text-[#475467]">
                {negotiation.hasNegotiation
                  ? negotiation.status
                  : "Original Offer"}
              </p>
              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#667085]">
                {negotiation.remark || "No negotiation history"}
              </p>
              <button
                type="button"
                onClick={() => openOffer(offer, "negotiation-history")}
                className="mt-2 inline-flex h-9 items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 text-xs font-extrabold text-sibs-primary-1"
              >
                <History size={14} />
                View History
              </button>
            </section>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => openOffer(offer)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
              >
                <Eye size={16} />
                View
              </button>

              {approvalStatus === "For Review" && authorized ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleApproval?.(offer, "Rejected")}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-extrabold text-red-600"
                  >
                    <X size={15} />
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproval?.(offer, "Approved")}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-4 text-xs font-extrabold text-white"
                  >
                    <Check size={15} />
                    Approve
                  </button>
                </>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
