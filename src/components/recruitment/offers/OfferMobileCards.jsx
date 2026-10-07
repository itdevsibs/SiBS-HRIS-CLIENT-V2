import React from "react";
import { Check, Eye, History, UserRound, X } from "lucide-react";
import { DataCard } from "@/components/ui";
import { getStatusClass } from "../../../lib/utils/offers/offerHelpers";
import {
  getLatestNegotiationSummary,
  getOfferEvaluationScores,
  hasOfferApproverSignature,
} from "../../../lib/utils/offers/offerEvaluationHistory";
import { useOffers } from "../../../services/context/OffersContext";

export default function OfferMobileCards({
  offersOverride = null,
  emptyMessage = "No offered candidates found from Candidate Pipeline.",
  isLoading = false,
}) {
  const {
    filteredOffers = [],
    setSelectedOffer,
    handleApproval,
    canCurrentUserApproveOffer,
    getOfferApprovalStatus,
    getOfferDisplayStatus,
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

  if (isLoading) {
    return (
      <DataCard.Skeleton
        count={4}
        lines={3}
        className="space-y-3 font-jakarta"
      />
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
        const displayStatus = getOfferDisplayStatus
          ? getOfferDisplayStatus(offer)
          : approvalStatus;
        const authorized =
          typeof canCurrentUserApproveOffer === "function"
            ? canCurrentUserApproveOffer(offer)
            : Boolean(canCurrentUserApproveOffer);
        const scores = getOfferEvaluationScores(offer);
        const negotiation = getLatestNegotiationSummary(offer);
        const ownerDisplay =
          offer.ownerDisplay || offer.owner_display || offer.owner || "—";
        const ownerRoleLabel =
          offer.ownerRoleLabel || offer.owner_role_label || "";

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
                  <span className="font-mono text-[10px] font-extrabold uppercase tracking-wide text-sibs-orange">
                    {offer.offerId || "—"}
                  </span>
                  {offer.candidateId && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                      {offer.candidateId}
                    </span>
                  )}
                </div>
              }
              badge={
                <span
                  className={`inline-flex shrink-0 items-center justify-center rounded-[10px] border px-2.5 py-0.5 text-[10px] font-extrabold ${getStatusClass(
                    displayStatus,
                  )}`}
                >
                  {displayStatus}
                </span>
              }
            />

            <DataCard.ContextRow>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-sibs-muted">
                  Final Role / Account
                </p>
                <p className="mt-0.5 truncate text-xs font-bold text-sibs-navy">
                  {offer.roleTitle || "—"}
                </p>
                <p className="truncate text-[11px] font-semibold text-sibs-muted">
                  {offer.account || "—"}
                </p>
              </div>
              <div className="min-w-0 flex-1 border-l border-sibs-border pl-2.5">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-sibs-muted">
                  Owner
                </p>
                <div className="mt-1 flex min-w-0 flex-col items-start gap-1">
                  {ownerRoleLabel ? (
                    <span className="inline-flex w-fit items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-extrabold leading-none text-blue-700">
                      {ownerRoleLabel}
                    </span>
                  ) : null}
                  <p className="flex min-w-0 items-start gap-1 text-xs font-bold leading-4 text-sibs-navy">
                    <UserRound size={11} className="mt-0.5 shrink-0 text-sibs-muted" />
                    <span className="line-clamp-2 break-words">{ownerDisplay}</span>
                  </p>
                </div>
              </div>
            </DataCard.ContextRow>

            <DataCard.Metrics cols={3}>
              <DataCard.MetricItem
                label="Assessment"
                value={scores.assessment.display}
                valueClassName="text-xs font-extrabold text-sibs-navy"
              />
              <DataCard.MetricItem
                label="Job Eval"
                value={scores.jobEvaluation.display}
                valueClassName="text-xs font-extrabold text-sibs-navy"
              />
              <DataCard.MetricItem
                label="Interview"
                value={scores.finalInterview.display}
                valueClassName="text-xs font-extrabold text-sibs-navy"
              />
            </DataCard.Metrics>

            <div className="mt-2.5 rounded-[10px] border border-blue-100 bg-blue-50/70 p-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wide text-sibs-navy">
                  Negotiation
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-extrabold text-sibs-navy shadow-2xs">
                  Version {negotiation.versionNumber}
                </span>
              </div>
              <p className="mt-1 text-[11px] font-bold text-slate-700">
                {negotiation.hasNegotiation
                  ? negotiation.status
                  : "Original Offer"}
              </p>
              {negotiation.remark && (
                <p className="mt-0.5 line-clamp-2 text-[10px] font-medium text-sibs-muted">
                  {negotiation.remark}
                </p>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openOffer(offer, "negotiation-history");
                }}
                className="mt-2 inline-flex h-7.5 items-center gap-1.5 rounded-[10px] border border-blue-200 bg-white px-2.5 text-[10px] font-extrabold text-sibs-navy transition hover:bg-blue-50 active:scale-95"
              >
                <History size={12} className="text-sibs-orange" />
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
                  className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-sibs-border bg-white px-3 text-[11px] font-extrabold text-sibs-navy transition hover:border-sibs-orange/35 hover:bg-sibs-cream-light hover:text-sibs-orange active:scale-95"
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
                      className="inline-flex h-8 items-center gap-1 rounded-[10px] border border-red-200 bg-red-50 px-2.5 text-[10px] font-extrabold text-red-600 transition hover:bg-red-100 active:scale-95"
                    >
                      <X size={13} />
                      Decline
                    </button>
                    {hasOfferApproverSignature(offer) ? (
                      <button
                        type="button"
                        onClick={() => handleApproval?.(offer, "Approved")}
                        className="inline-flex h-8 items-center gap-1 rounded-[10px] bg-sibs-navy px-2.5 text-[10px] font-extrabold text-white transition hover:bg-sibs-navy-light active:scale-95"
                      >
                        <Check size={13} />
                        Approve
                      </button>
                    ) : null}
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
