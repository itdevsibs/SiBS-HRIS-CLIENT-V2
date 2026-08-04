import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { getStatusClass } from "../../../lib/utils/offers/offerHelpers";
import { useOffers } from "../../../services/context/OffersContext";

const PAGE_SIZE = 10;

function getFinalAccount(offer = {}) {
  return (
    offer.finalAccount ||
    offer.final_account ||
    offer.accountName ||
    offer.account_name ||
    offer.account ||
    offer.offerDetails?.finalAccount ||
    offer.offerDetails?.final_account ||
    offer.offerDetails?.accountName ||
    offer.offerDetails?.account_name ||
    offer.offerDetails?.account ||
    "—"
  );
}


export default function OfferRecordsTable({
  offersOverride,
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

  const offers = useMemo(() => {
    if (Array.isArray(offersOverride)) return offersOverride;
    if (Array.isArray(filteredOffers)) return filteredOffers;
    return [];
  }, [filteredOffers, offersOverride]);

  const offerKey = useMemo(
    () =>
      offers
        .map(
          (offer) =>
            offer.offerId ||
            offer.candidateApplicationId ||
            offer.candidateId ||
            offer.candidateName ||
            "",
        )
        .join("|"),
    [offers],
  );

  const totalPages = Math.max(1, Math.ceil(offers.length / PAGE_SIZE));

  const [pageState, setPageState] = useState({
    key: offerKey,
    routeFilterActive,
    page: 1,
  });

  const currentPage =
    pageState.key === offerKey &&
    pageState.routeFilterActive === routeFilterActive
      ? Math.min(pageState.page, totalPages)
      : 1;

  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageOffers = offers.slice(pageStart, pageStart + PAGE_SIZE);
  const totalOfferRecords =
    !routeFilterActive && Array.isArray(offerList) && offerList.length > 0
      ? offerList.length
      : offers.length;

  function openOffer(offer) {
    setSelectedOffer(offer);
  }

  function handleRowKeyDown(event, offer) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openOffer(offer);
  }

  return (
    <div className="hidden font-jakarta lg:block">
      <div className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] table-fixed border-collapse text-left text-xs">
          <colgroup>
            <col className="w-[24%]" />
            <col className="w-[19%]" />
            <col className="w-[18%]" />
            <col className="w-[14%]" />
            <col className="w-[11%]" />
            <col className="w-[14%]" />
          </colgroup>

          <thead className="sibs-data-table-head">
            <tr className="sibs-data-table-head-row">
              <th className="sibs-data-table-th">Candidate</th>
              <th className="sibs-data-table-th">Final Role</th>
              <th className="sibs-data-table-th">Final Account</th>
              <th className="sibs-data-table-th">Approval</th>
              <th className="sibs-data-table-th">Owner</th>
              <th className="sibs-data-table-th text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E6ECF2]">
            {pageOffers.length > 0 ? (
              pageOffers.map((offer) => {
                const approvalStatus = getOfferApprovalStatus
                  ? getOfferApprovalStatus(offer)
                  : offer.offerApprovalStatus || offer.status || "For Review";

                const isAuthorizedApprover =
                  typeof canCurrentUserApproveOffer === "function"
                    ? canCurrentUserApproveOffer(offer)
                    : Boolean(canCurrentUserApproveOffer);

                return (
                  <tr
                    key={`${offer.offerId}-${offer.candidateApplicationId}`}
                    className="sibs-data-table-row align-middle"
                    role="button"
                    tabIndex={0}
                    onClick={() => openOffer(offer)}
                    onKeyDown={(event) => handleRowKeyDown(event, offer)}
                    aria-label={`View offer for ${offer.candidateName || "candidate"}`}
                  >
                    <td className="px-4 py-3.5 align-middle">
                      <p
                        title={offer.candidateName}
                        className="truncate text-xs font-extrabold text-[#042C51]"
                      >
                        {offer.candidateName || "—"}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] font-semibold text-[#667085]">
                        {offer.offerId || "—"} • {offer.candidateId || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 align-middle">
                      <p
                        title={offer.roleTitle}
                        className="truncate text-xs font-extrabold text-[#042C51]"
                      >
                        {offer.roleTitle || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 align-middle">
                      <p
                        title={getFinalAccount(offer)}
                        className="truncate text-xs font-bold text-[#344054]"
                      >
                        {getFinalAccount(offer)}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 align-middle">
                      <span
                        title={approvalStatus}
                        className={`inline-flex max-w-full items-center rounded-lg border px-2.5 py-1 text-[10px] font-extrabold ${getStatusClass(
                          approvalStatus,
                        )}`}
                      >
                        <span className="truncate">{approvalStatus}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3.5 align-middle">
                      <p className="truncate text-xs font-bold text-[#344054]">
                        {offer.owner || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 text-right align-middle">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => openOffer(offer)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6E0EA] bg-white text-[#042C51] transition hover:border-[#FF5C28]/35 hover:bg-[#FFF7F3] hover:text-[#FF5C28] focus:outline-none focus:ring-2 focus:ring-[#FF5C28]/20"
                          title="View offer details"
                        >
                          <Eye size={14} />
                        </button>

                        {approvalStatus === "For Review" &&
                        isAuthorizedApprover ? (
                          <ApprovalActionButtons
                            offer={offer}
                            onApproveReject={handleApproval}
                          />
                        ) : null}

                        {approvalStatus === "For Review" &&
                        !isAuthorizedApprover ? (
                          <span className="inline-flex h-8 max-w-[160px] items-center rounded-lg border border-amber-100 bg-amber-50 px-2.5 text-[10px] font-extrabold text-amber-700">
                            <span className="truncate">Waiting for approver</span>
                          </span>
                        ) : null}

                        {approvalStatus === "Approved" ? (
                          <span className="inline-flex h-8 max-w-[145px] items-center rounded-lg border border-blue-100 bg-blue-50 px-2.5 text-[10px] font-extrabold text-blue-700">
                            <span className="truncate">Ready in Pipeline</span>
                          </span>
                        ) : null}

                        {approvalStatus === "Rejected" ? (
                          <span className="inline-flex h-8 items-center rounded-lg border border-red-100 bg-red-50 px-2.5 text-[10px] font-extrabold text-red-700">
                            Rejected
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <p className="text-sm font-extrabold text-[#042C51]">
                    {emptyMessage}
                  </p>
                  {routeFilterActive ? (
                    <p className="mt-1 text-xs font-semibold text-[#98A2B3]">
                      Clear the selected candidate to return to all offers.
                    </p>
                  ) : null}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="sibs-pagination sibs-pagination--compact mt-4">
        <p className="sibs-pagination__summary">
          Showing <span>{pageOffers.length}</span> loaded{" "}
          {routeFilterActive ? "selected candidate offers" : "offered candidates"}
          {totalOfferRecords > 0 ? (
            <>
              {" "}
              out of <span>{totalOfferRecords}</span>
            </>
          ) : null}
        </p>

        <div className="sibs-pagination__controls">
          <button
            type="button"
            onClick={() =>
              setPageState({
                key: offerKey,
                routeFilterActive,
                page: Math.max(1, currentPage - 1),
              })
            }
            disabled={currentPage === 1}
            className="sibs-pagination__button h-10 gap-1.5 px-3 sm:px-4"
            aria-label="Go to previous page"
          >
            <ChevronLeft size={15} />
            <span>Previous</span>
          </button>

          <span className="sibs-pagination__page is-active h-10 px-3 sm:px-4">
            Page {currentPage}
            {totalPages > 1 ? ` of ${totalPages}` : ""}
          </span>

          <button
            type="button"
            onClick={() =>
              setPageState({
                key: offerKey,
                routeFilterActive,
                page: Math.min(totalPages, currentPage + 1),
              })
            }
            disabled={currentPage === totalPages}
            className="sibs-pagination__button h-10 gap-1.5 px-3 sm:px-4"
            aria-label="Go to next page"
          >
            <span>Next</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ApprovalActionButtons({ offer, onApproveReject }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap">
      <button
        type="button"
        onClick={() => onApproveReject(offer, "Approved")}
        className="inline-flex h-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[10px] font-extrabold text-emerald-700 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-200"
      >
        Approve
      </button>

      <button
        type="button"
        onClick={() => onApproveReject(offer, "Rejected")}
        className="inline-flex h-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2.5 text-[10px] font-extrabold text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200"
      >
        Reject
      </button>
    </span>
  );
}
