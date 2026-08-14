import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  History,
  X,
} from "lucide-react";

import { getStatusClass } from "../../../lib/utils/offers/offerHelpers";
import {
  getLatestNegotiationSummary,
  getOfferEvaluationScores,
} from "../../../lib/utils/offers/offerEvaluationHistory";
import { useOffers } from "../../../services/context/OffersContext";

function ApprovalActionButtons({ offer, onApproveReject }) {
  return (
    <>
      <button
        type="button"
        onClick={() => onApproveReject?.(offer, "Rejected")}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
        title="Decline offer"
      >
        <X size={16} />
      </button>

      <button
        type="button"
        onClick={() => onApproveReject?.(offer, "Approved")}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sibs-primary-1 text-white transition hover:opacity-90"
        title="Approve offer"
      >
        <Check size={16} />
      </button>
    </>
  );
}

function EvaluationScoreLines({ offer }) {
  const scores = getOfferEvaluationScores(offer);

  return (
    <div className="min-w-0 space-y-1.5">
      {[
        ["Assessment", scores.assessment.display],
        ["Job Evaluation", scores.jobEvaluation.display],
        ["Final Interview", scores.finalInterview.display],
      ].map(([label, value]) => (
        <div key={label} className="flex min-w-0 items-center justify-between gap-3">
          <span className="truncate text-[11px] font-bold text-[#667085]">
            {label}
          </span>
          <span className="shrink-0 text-xs font-extrabold text-[#042C51]">
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
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold uppercase text-sibs-primary-1">
          Version {summary.versionNumber}
        </span>

        <span className="truncate text-[11px] font-extrabold text-[#475467]">
          {summary.hasNegotiation ? summary.status : "Original Offer"}
        </span>
      </div>

      <p
        title={summary.remark || "No negotiation history"}
        className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-[#667085]"
      >
        {summary.remark || "No negotiation history"}
      </p>

      <button
        type="button"
        onClick={onViewHistory}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-extrabold text-sibs-primary-1 transition hover:underline"
      >
        <History size={14} />
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
    <div className="hidden font-jakarta lg:block">
      <div className="overflow-x-auto rounded-2xl border border-[#D7E3F0] bg-white">
        <table className="min-w-[1380px] table-fixed border-separate border-spacing-0 text-left">
          <colgroup>
            <col className="w-[17%]" />
            <col className="w-[15%]" />
            <col className="w-[18%]" />
            <col className="w-[17%]" />
            <col className="w-[10%]" />
            <col className="w-[9%]" />
            <col className="w-[14%]" />
          </colgroup>

          <thead>
            <tr className="bg-[#F5F7FA] text-[11px] font-extrabold uppercase tracking-[0.04em] text-[#174A7C]">
              <th className="rounded-tl-2xl px-5 py-4">Candidate</th>
              <th className="px-5 py-4">Final Role / Account</th>
              <th className="px-5 py-4">Evaluation Scores</th>
              <th className="px-5 py-4">Negotiation</th>
              <th className="px-5 py-4">Approval</th>
              <th className="px-5 py-4">Owner</th>
              <th className="rounded-tr-2xl px-5 py-4 text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {displayedOffers.length > 0 ? (
              displayedOffers.map((offer, index) => {
                const approvalStatus = getApprovalStatus(offer);
                const isLastRow = index === displayedOffers.length - 1;
                const isAuthorizedApprover =
                  isAuthorizedApproverForOffer(offer);
                const rowBorderClass = isLastRow
                  ? ""
                  : "border-b border-[#E6ECF2]";

                return (
                  <tr
                    key={`${offer.offerId}-${offer.candidateApplicationId}-${offer.id}`}
                    className="sibs-page-card-in cursor-pointer align-middle transition hover:bg-[#FAFBFC]"
                    style={{ animationDelay: `${index * 35}ms`, animationFillMode: "both" }}
                    onClick={() => openOffer(offer)}
                  >
                    <td className={`px-5 py-4 ${rowBorderClass}`}>
                      <div className="min-w-0">
                        <p
                          title={offer.candidateName}
                          className="truncate whitespace-nowrap text-sm font-extrabold text-[#101828]"
                        >
                          {offer.candidateName || "—"}
                        </p>
                        <p className="mt-1 truncate whitespace-nowrap text-xs font-semibold text-[#475467]">
                          {offer.offerId || "—"} • {offer.candidateId || "—"}
                        </p>
                      </div>
                    </td>

                    <td className={`px-5 py-4 ${rowBorderClass}`}>
                      <div className="min-w-0">
                        <p
                          title={offer.roleTitle}
                          className="truncate whitespace-nowrap text-sm font-extrabold text-[#101828]"
                        >
                          {offer.roleTitle || "—"}
                        </p>
                        <p
                          title={offer.account}
                          className="mt-1 truncate whitespace-nowrap text-xs font-semibold text-[#475467]"
                        >
                          {offer.account || "—"}
                        </p>
                      </div>
                    </td>

                    <td className={`px-5 py-4 ${rowBorderClass}`}>
                      <EvaluationScoreLines offer={offer} />
                    </td>

                    <td className={`px-5 py-4 ${rowBorderClass}`}>
                      <NegotiationSummary
                        offer={offer}
                        onViewHistory={(event) => {
                          event.stopPropagation();
                          openOffer(offer, "negotiation-history");
                        }}
                      />
                    </td>

                    <td className={`px-5 py-4 ${rowBorderClass}`}>
                      <span
                        title={approvalStatus}
                        className={`inline-flex h-9 max-w-full items-center rounded-full border px-3 text-xs font-extrabold ${getStatusClass(
                          approvalStatus,
                        )}`}
                      >
                        <span className="truncate whitespace-nowrap">
                          {approvalStatus}
                        </span>
                      </span>
                    </td>

                    <td className={`px-5 py-4 ${rowBorderClass}`}>
                      <p
                        title={offer.owner}
                        className="truncate whitespace-nowrap text-sm font-bold text-[#344054]"
                      >
                        {offer.owner || "—"}
                      </p>
                    </td>

                    <td className={`px-5 py-4 text-right ${rowBorderClass}`}>
                      <div
                        className="flex min-w-0 items-center justify-end gap-2"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => openOffer(offer)}
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-primary-1 transition hover:bg-[#F8FAFC] hover:shadow-sm"
                          title="View offer details"
                        >
                          <Eye size={16} />
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
                            <span className="inline-flex h-10 max-w-[170px] items-center justify-center rounded-xl border border-amber-100 bg-amber-50 px-3 text-xs font-extrabold text-amber-700">
                              Waiting for approver
                            </span>
                          )}

                        {approvalStatus === "Approved" && (
                          <span className="inline-flex h-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 px-3 text-xs font-extrabold text-blue-700">
                            Ready in Pipeline
                          </span>
                        )}

                        {approvalStatus === "Rejected" && (
                          <span className="inline-flex h-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-extrabold text-red-700">
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
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-xs font-bold text-[#667085]"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
            className="sibs-pagination__button h-10 gap-1.5 px-3 sm:px-4"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>

          <span className="sibs-pagination__page is-active h-10 px-3 sm:px-4">
            Page 1
          </span>

          <button
            type="button"
            disabled
            className="sibs-pagination__button h-10 gap-1.5 px-3 sm:px-4"
            aria-label="Next page"
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
