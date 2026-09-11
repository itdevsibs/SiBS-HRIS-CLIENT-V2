import React from "react";
import { Check, Eye, History, UserRound, X } from "lucide-react";
import { DataCard } from "@/components/ui";
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
      <DataCard.Empty
        title="No offer records found"
        description={emptyMessage}
      />
    );
  }

  return (
    <div className="space-y-3 font-jakarta">
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
          <DataCard
            key={`mobile-${offer.offerId}-${offer.candidateApplicationId}-${offer.id}`}
            interactive
            onClick={() => openOffer(offer)}
            aria-label={`View offer for ${offer.candidateName || "candidate"}`}
            style={{
              animationDelay: `${index * 35}ms`,
              animationFillMode: "both",
            }}
            className="font-jakarta"
          >
            <DataCard.Header
              title={offer.candidateName || "—"}
              subtitle={
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[10px] font-extrabold uppercase tracking-wide text-[#FF5C28]">
                    {offer.offerId || "—"}
                  </span>
                  {offer.candidateId && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#667085]">
                      {offer.candidateId}
                    </span>
                  )}
                </div>
              }
              badge={
                <span
                  className={`inline-flex shrink-0 items-center justify-center rounded-lg border px-2.5 py-0.5 text-[10px] font-extrabold ${getStatusClass(
                    approvalStatus,
                  )}`}
                >
                  {approvalStatus}
                </span>
              }
            />

            <DataCard.ContextRow>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#8A98B8]">
                  Final Role / Account
                </p>
                <p className="mt-0.5 truncate text-xs font-bold text-[#042C51]">
                  {offer.roleTitle || "—"}
                </p>
                <p className="truncate text-[11px] font-semibold text-[#667085]">
                  {offer.account || "—"}
                </p>
              </div>
              <div className="min-w-0 flex-1 border-l border-[#E6ECF2] pl-2.5">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#8A98B8]">
                  Owner
                </p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-bold text-[#042C51]">
                  <UserRound size={11} className="shrink-0 text-[#98A2B3]" />
                  <span className="truncate">{offer.owner || "—"}</span>
                </p>
              </div>
            </DataCard.ContextRow>

            <DataCard.Metrics cols={3}>
              <DataCard.MetricItem
                label="Assessment"
                value={scores.assessment.display}
                valueClassName="text-xs font-extrabold text-[#042C51]"
              />
              <DataCard.MetricItem
                label="Job Eval"
                value={scores.jobEvaluation.display}
                valueClassName="text-xs font-extrabold text-[#042C51]"
              />
              <DataCard.MetricItem
                label="Interview"
                value={scores.finalInterview.display}
                valueClassName="text-xs font-extrabold text-[#042C51]"
              />
            </DataCard.Metrics>

            <div className="mt-2.5 rounded-xl border border-blue-100 bg-blue-50/70 p-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wide text-[#042C51]">
                  Negotiation
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-extrabold text-[#042C51] shadow-2xs">
                  Version {negotiation.versionNumber}
                </span>
              </div>
              <p className="mt-1 text-[11px] font-bold text-[#344054]">
                {negotiation.hasNegotiation
                  ? negotiation.status
                  : "Original Offer"}
              </p>
              {negotiation.remark && (
                <p className="mt-0.5 line-clamp-2 text-[10px] font-medium text-[#667085]">
                  {negotiation.remark}
                </p>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openOffer(offer, "negotiation-history");
                }}
                className="mt-2 inline-flex h-7.5 items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 text-[10px] font-extrabold text-[#042C51] transition hover:bg-blue-50 active:scale-95"
              >
                <History size={12} className="text-[#FF5C28]" />
                View History
              </button>
            </div>

            <DataCard.Footer>
              <div className="flex w-full items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openOffer(offer);
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#D6DEE8] bg-white px-3 text-[11px] font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/35 hover:bg-[#FFF9F6] hover:text-[#FF5C28] active:scale-95"
                >
                  <Eye size={13} />
                  View Details
                </button>

                {approvalStatus === "For Review" && authorized ? (
                  <div
                    className="flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleApproval?.(offer, "Rejected")}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 text-[10px] font-extrabold text-red-600 transition hover:bg-red-100 active:scale-95"
                    >
                      <X size={13} />
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproval?.(offer, "Approved")}
                      className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#042C51] px-2.5 text-[10px] font-extrabold text-white transition hover:bg-[#063b6d] active:scale-95"
                    >
                      <Check size={13} />
                      Approve
                    </button>
                  </div>
                ) : null}
              </div>
            </DataCard.Footer>
          </DataCard>
        );
      })}
    </div>
  );
}
