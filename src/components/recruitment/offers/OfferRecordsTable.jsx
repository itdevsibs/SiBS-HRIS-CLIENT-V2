import { useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Check, X, History, FileText } from "lucide-react";
import { useOffers } from "../../../services/context/OffersContext";
import { getStatusClass } from "../../../lib/utils/offers/offerHelpers";
import {
  getLatestNegotiationSummary,
  getOfferEvaluationScores,
} from "../../../lib/utils/offers/offerEvaluationHistory";

function ApprovalActionButtons({ offer, onApproveReject }) {
  return (
    <>
      <button
        type="button"
        onClick={() => onApproveReject?.(offer, "Rejected")}
        className="inline-flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
        title="Decline offer"
      >
        <X size={15} />
      </button>

      <button
        type="button"
        onClick={() => onApproveReject?.(offer, "Approved")}
        className="inline-flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#042C51] text-white transition hover:bg-[#063b6d]"
        title="Approve offer"
      >
        <Check size={15} />
      </button>
    </>
  );
}

function EvaluationScoreLines({ offer }) {
  const scores = getOfferEvaluationScores(offer);

  return (
    <div className="min-w-0 space-y-1">
      {[
        ["Assessment", scores.assessment.display],
        ["Job Evaluation", scores.jobEvaluation.display],
        ["Final Interview", scores.finalInterview.display],
      ].map(([label, value]) => (
        <div key={label} className="flex min-w-0 items-center justify-between gap-3">
          <span className="truncate text-[10px] font-bold text-[#667085]">
            {label}
          </span>
          <span className="shrink-0 text-[11px] font-extrabold text-[#042C51]">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function NegotiationSummary({ offer, onViewHistory }) {
  const summary = getLatestNegotiationSummary(offer);

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-blue-100 bg-[#EAF2FB] px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#042C51]">
          Version {summary.versionNumber}
        </span>

        <span className="truncate text-[10px] font-extrabold text-[#475467]">
          {summary.hasNegotiation ? summary.status : "Original Offer"}
        </span>
      </div>

      <p
        title={summary.remark || "No negotiation history"}
        className="mt-1 line-clamp-2 text-[10px] font-semibold leading-4 text-[#667085]"
      >
        {summary.remark || "No negotiation history"}
      </p>

      <button
        type="button"
        onClick={onViewHistory}
        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-extrabold text-[#042C51] transition hover:text-[#FF5C28]"
      >
        <History size={12} />
        View History
      </button>
    </div>
  );
}

export default function OfferRecordsTable({
  offersOverride = null,
  routeFilterActive = false,
  emptyMessage = "No offered candidates found from Candidate Pipeline.",
}) {
  const {
    filteredOffers = [],
    offerList = [],
    setSelectedOffer,
    handleApproval,
    canCurrentUserApproveOffer,
    getOfferApprovalStatus,
  } = useOffers();

  const displayedOffers = Array.isArray(offersOverride)
    ? offersOverride
    : filteredOffers;

  const totalOffers = routeFilterActive
    ? displayedOffers.length
    : offerList.length;

  function getApprovalStatus(offer) {
    return getOfferApprovalStatus
      ? getOfferApprovalStatus(offer)
      : offer.offerApprovalStatus || offer.status || "For Review";
  }

  function isAuthorizedApproverForOffer(offer) {
    return typeof canCurrentUserApproveOffer === "function"
      ? canCurrentUserApproveOffer(offer)
      : Boolean(canCurrentUserApproveOffer);
  }

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

  return (
    <div className="p-4 font-jakarta sm:p-5">
      <div className="hidden lg:block">
        <div className="overflow-x-auto rounded-xl border border-[#E6ECF2] bg-white">
          <table className="w-full min-w-[1180px] table-fixed border-separate border-spacing-0 text-left">
            <thead className="sibs-data-table-head sticky top-0 z-10 bg-[#F8FAFC]">
              <tr className="sibs-data-table-head-row">
                <th className="sibs-data-table-th px-3 2xl:px-4 py-2.5 2xl:py-3 w-[18%] text-left">Candidate</th>
                <th className="sibs-data-table-th px-3 2xl:px-4 py-2.5 2xl:py-3 w-[15%] text-left">Final Role / Account</th>
                <th className="sibs-data-table-th px-3 2xl:px-4 py-2.5 2xl:py-3 w-[14%] text-left">Evaluation Scores</th>
                <th className="sibs-data-table-th px-3 2xl:px-4 py-2.5 2xl:py-3 w-[17%] text-left">Negotiation</th>
                <th className="sibs-data-table-th px-3 2xl:px-4 py-2.5 2xl:py-3 w-[10%] text-center">Status</th>
                <th className="sibs-data-table-th px-3 2xl:px-4 py-2.5 2xl:py-3 w-[9%] text-left">Owner</th>
                <th className="sibs-data-table-th px-3 2xl:px-4 py-2.5 2xl:py-3 w-[17%] text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {displayedOffers.length > 0 ? (
                displayedOffers.map((offer, index) => {
                  const approvalStatus = getApprovalStatus(offer);
                  const isAuthorizedApprover =
                    isAuthorizedApproverForOffer(offer);

                  return (
                    <tr
                      key={`${offer.offerId}-${offer.candidateApplicationId}-${offer.id}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => openOffer(offer)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openOffer(offer);
                        }
                      }}
                      className="sibs-page-card-in cursor-pointer transition hover:bg-[#FFF9F6] focus-visible:bg-[#FFF9F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF5C28]/25"
                      style={{ animationDelay: `${index * 30}ms`, animationFillMode: "both" }}
                    >
                      <td className="border-b border-[#E6ECF2] px-3 2xl:px-4 py-2.5 2xl:py-3 align-middle">
                        <div className="min-w-0">
                          <p
                            title={offer.candidateName}
                            className="min-w-0 truncate text-xs font-extrabold text-[#042C51]"
                          >
                            {offer.candidateName || "—"}
                          </p>
                          <p
                            title={`${offer.offerId || "—"} • ${offer.candidateId || "—"}`}
                            className="mt-0.5 truncate text-[11px] font-semibold text-[#667085]"
                          >
                            {offer.offerId || "—"} • {offer.candidateId || "—"}
                          </p>
                        </div>
                      </td>

                      <td className="border-b border-[#E6ECF2] px-4 py-3.5 align-middle">
                        <p
                          title={offer.roleTitle}
                          className="truncate text-xs font-bold text-[#344054]"
                        >
                          {offer.roleTitle || "—"}
                        </p>
                        <p
                          title={offer.account}
                          className="mt-0.5 truncate text-[11px] font-semibold text-[#667085]"
                        >
                          {offer.account || "—"}
                        </p>
                      </td>

                      <td className="border-b border-[#E6ECF2] px-4 py-3.5 align-middle">
                        <EvaluationScoreLines offer={offer} />
                      </td>

                      <td className="border-b border-[#E6ECF2] px-4 py-3.5 align-middle">
                        <NegotiationSummary
                          offer={offer}
                          onViewHistory={(event) => {
                            event.stopPropagation();
                            openOffer(offer, "negotiation-history");
                          }}
                        />
                      </td>

                      <td className="border-b border-[#E6ECF2] px-4 py-3.5 text-center align-middle">
                        <span
                          title={approvalStatus}
                          className={`mx-auto inline-flex h-7 max-w-[195px] items-center justify-center rounded-lg border px-2.5 text-center text-[10px] font-extrabold leading-none ${getStatusClass(
                            approvalStatus,
                          )}`}
                        >
                          <span className="line-clamp-2 break-words">
                            {approvalStatus}
                          </span>
                        </span>
                      </td>

                      <td className="border-b border-[#E6ECF2] px-4 py-3.5 align-middle">
                        <p
                          title={offer.owner}
                          className="truncate text-xs font-semibold text-[#344054]"
                        >
                          {offer.owner || "—"}
                        </p>
                      </td>

                      <td className="border-b border-[#E6ECF2] px-4 py-3.5 text-right align-middle">
                        <div
                          className="flex min-w-0 items-center justify-end gap-1.5"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => openOffer(offer)}
                            className="inline-flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg border border-[#D6E0EA] bg-white text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28]"
                            title="View offer details"
                          >
                            <Eye size={15} />
                          </button>

                          {approvalStatus === "For Review" &&
                            isAuthorizedApprover && (
                              <ApprovalActionButtons
                                offer={offer}
                                onApproveReject={handleApproval}
                              />
                            )}

                          {approvalStatus === "For Review" &&
                            !isAuthorizedApprover && (
                              <span className="inline-flex h-7 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-amber-200 bg-amber-50 px-2.5 text-[10px] font-extrabold leading-none text-amber-700">
                                Waiting for approver
                              </span>
                            )}

                          {approvalStatus === "Approved" && (
                            <span className="inline-flex h-7 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[10px] font-extrabold leading-none text-emerald-700">
                              Ready in Pipeline
                            </span>
                          )}

                          {approvalStatus === "Rejected" && (
                            <span className="inline-flex h-7 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-2.5 text-[10px] font-extrabold leading-none text-red-700">
                              Rejected
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12">
                    <div className="flex flex-col items-center text-center text-[#667085]">
                      <FileText className="h-6 w-6" />
                      <p className="mt-2 text-[13px] font-extrabold">
                        No offer records found
                      </p>
                      <p className="mt-1 text-xs font-medium">
                        {emptyMessage}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sibs-pagination sibs-pagination--compact mt-4">
        <p className="sibs-pagination__summary">
          Showing <span>{displayedOffers.length}</span> loaded offered candidates
          {totalOffers > 0 ? (
            <>
              {" "}out of <span>{totalOffers}</span>
            </>
          ) : null}
        </p>

        {totalOffers > 0 ? (
          <div className="sibs-pagination__controls">
            <button
              type="button"
              disabled
              aria-label="Go to previous page"
              className="sibs-pagination__button h-10 gap-1.5 px-3 sm:px-4"
            >
              <ChevronLeft size={15} />
              <span>Previous</span>
            </button>

            <span className="sibs-pagination__page is-active h-10 px-3 sm:px-4">
              Page 1
            </span>

            <button
              type="button"
              disabled
              aria-label="Go to next page"
              className="sibs-pagination__button h-10 gap-1.5 px-3 sm:px-4"
            >
              <span>Next</span>
              <ChevronRight size={15} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
