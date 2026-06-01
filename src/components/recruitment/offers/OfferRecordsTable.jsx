import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import {
  getOfferApprovalSummary,
  getStatusClass,
} from "../../../lib/utils/offers/offerHelpers";
import { useOffers } from "../../../services/context/OffersContext";

export default function OfferRecordsTable() {
  const {
    filteredOffers,
    offerList,
    setSelectedOffer,
    handleApproval,
    canCurrentUserApproveOffer,
  } = useOffers();

  return (
    <div className="hidden lg:block">
      <div className="overflow-hidden rounded-[24px] border border-[#D9E2EC] bg-white">
        <table className="w-full table-fixed border-separate border-spacing-0 text-left">
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[26%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[18%]" />
          </colgroup>

          <thead>
            <tr className="bg-[#F5F7FA] text-xs font-extrabold uppercase tracking-[0.04em] text-[#174A7C]">
              <th className="rounded-tl-[24px] px-6 py-5">Candidate</th>
              <th className="px-6 py-5">Final Role / Account</th>
              <th className="px-6 py-5">Approval</th>
              <th className="px-6 py-5">Owner</th>
              <th className="rounded-tr-[24px] px-6 py-5 text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredOffers.length > 0 ? (
              filteredOffers.map((offer, index) => {
                const approvalStatus = getOfferApprovalSummary(offer);
                const isLastRow = index === filteredOffers.length - 1;

                const isAuthorizedApprover =
                  typeof canCurrentUserApproveOffer === "function"
                    ? canCurrentUserApproveOffer(offer)
                    : !!canCurrentUserApproveOffer;

                const rowBorderClass = isLastRow
                  ? ""
                  : "border-b border-[#E6ECF2]";

                return (
                  <tr
                    key={`${offer.offerId}-${offer.candidateApplicationId}`}
                    className="cursor-pointer align-middle transition hover:bg-[#FAFBFC]"
                    onClick={() => setSelectedOffer(offer)}
                  >
                    <td className={`px-6 py-5 ${rowBorderClass}`}>
                      <div className="min-w-0">
                        <p
                          title={offer.candidateName}
                          className="truncate whitespace-nowrap text-[15px] font-extrabold text-[#101828]"
                        >
                          {offer.candidateName || "—"}
                        </p>

                        <p
                          title={`${offer.offerId || "—"} • ${
                            offer.candidateId || "—"
                          }`}
                          className="mt-1 truncate whitespace-nowrap text-xs font-semibold text-[#475467]"
                        >
                          {offer.offerId || "—"} • {offer.candidateId || "—"}
                        </p>
                      </div>
                    </td>

                    <td className={`px-6 py-5 ${rowBorderClass}`}>
                      <div className="min-w-0">
                        <p
                          title={offer.roleTitle}
                          className="truncate whitespace-nowrap text-[15px] font-extrabold text-[#101828]"
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

                    <td className={`px-6 py-5 ${rowBorderClass}`}>
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

                    <td className={`px-6 py-5 ${rowBorderClass}`}>
                      <p
                        title={offer.owner}
                        className="truncate whitespace-nowrap text-sm font-bold text-[#344054]"
                      >
                        {offer.owner || "—"}
                      </p>
                    </td>

                    <td className={`px-6 py-5 text-right ${rowBorderClass}`}>
                      <div
                        className="flex min-w-0 items-center justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedOffer(offer)}
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-primary-1 transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm"
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
                            <span
                              title="Waiting for authorized approver"
                              className="inline-flex h-10 max-w-[180px] items-center justify-center rounded-xl border border-amber-100 bg-amber-50 px-3 text-xs font-extrabold text-amber-700"
                            >
                              <span className="truncate whitespace-nowrap">
                                Waiting for approver
                              </span>
                            </span>
                          )}

                        {approvalStatus === "Approved" && (
                          <span
                            title="Ready in Pipeline"
                            className="inline-flex h-10 max-w-[150px] items-center justify-center rounded-xl border border-blue-100 bg-blue-50 px-3 text-xs font-extrabold text-blue-700"
                          >
                            <span className="truncate whitespace-nowrap">
                              Ready in Pipeline
                            </span>
                          </span>
                        )}

                        {approvalStatus === "Rejected" && (
                          <span
                            title="Rejected"
                            className="inline-flex h-10 max-w-[120px] items-center justify-center rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-extrabold text-red-700"
                          >
                            <span className="truncate whitespace-nowrap">
                              Rejected
                            </span>
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
                  colSpan={5}
                  className="px-6 py-14 text-center text-sm font-bold text-[#667085]"
                >
                  No offered candidates found from Candidate Pipeline.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <p className="text-sm font-semibold text-[#475467]">
          Showing {filteredOffers.length} of {offerList.length} offered
          candidates
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white text-gray-500 transition hover:bg-gray-50"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-sibs-primary-1 text-sm font-bold text-white"
          >
            1
          </button>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white text-gray-500 transition hover:bg-gray-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ApprovalActionButtons({ offer, onApproveReject }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">
      <button
        type="button"
        onClick={() => onApproveReject(offer, "Approved")}
        className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-extrabold text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-sm"
      >
        Approve
      </button>

      <button
        type="button"
        onClick={() => onApproveReject(offer, "Rejected")}
        className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-extrabold text-red-700 transition hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm"
      >
        Reject
      </button>
    </span>
  );
}
