import { X } from "lucide-react";

import DetailRow from "../../recruitment/offers/common/DetailRow";

import { getStatusClass } from "../../../lib/utils/offers/offerHelpers";
import { formatCurrency } from "../../../lib/utils/offers/offerFormatters";
import { useOffers } from "../../../services/context/OffersContext";

function cleanText(value) {
  return String(value ?? "").trim();
}

function getApprovalLabel(user = {}) {
  return cleanText(user.displayName || user.display_name || user.name).toUpperCase();
}

export default function OfferDetailsModal({ open, offer, onClose }) {
  const {
    approvalUsers = [],
    getOfferApprovalStatus,
    getApprovalRecordForUser,
  } = useOffers();

  if (!open || !offer) return null;

  const approvalStatus = getOfferApprovalStatus
    ? getOfferApprovalStatus(offer)
    : offer.offerApprovalStatus || offer.status || "For Review";

  const approvedBy = approvalUsers.filter((approver) => {
    const approval = getApprovalRecordForUser?.(offer, approver);

    return approval?.status === "Approved";
  });

  const rejectedBy = approvalUsers.filter((approver) => {
    const approval = getApprovalRecordForUser?.(offer, approver);

    return approval?.status === "Rejected";
  });

  return (
    <div
      className="sibs-modal-blur fixed inset-0 z-[9999] flex h-dvh items-center justify-center px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#D6DEE8] bg-white font-jakarta shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] bg-[#042C51] px-5 py-4 text-white sm:px-6">
          <div>
            <h2 className="text-lg font-extrabold tracking-normal sm:text-xl">
              Offer Details
            </h2>

            <p className="mt-1 text-xs font-semibold text-white/75 sm:text-sm">
              Approval details from the Candidate Pipeline offered stage.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              <section className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-normal text-[#FF5C28]">
                      {offer.offerId}
                    </p>

                    <h3 className="mt-1 text-xl font-extrabold tracking-normal text-[#042C51] sm:text-2xl">
                      {offer.candidateName}
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-[#667085] sm:text-sm">
                      {offer.roleTitle} / {offer.account}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                      approvalStatus,
                    )}`}
                  >
                    {approvalStatus}
                  </span>
                </div>
              </section>

              <section className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#042C51]">
                      Offer Approval
                    </h3>

                    <p className="mt-1 text-xs font-semibold leading-5 text-[#667085] sm:text-sm">
                      Managed by database approval users from Recruitment
                      Settings.
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full border px-3 py-1 text-xs font-extrabold ${getStatusClass(
                      approvalStatus,
                    )}`}
                  >
                    {approvalStatus}
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-normal text-[#667085]">
                    Required Approvers
                  </p>

                  <p className="mt-2 text-sm font-bold leading-6 text-sibs-primary-1">
                    {approvalUsers.length > 0
                      ? approvalUsers.map(getApprovalLabel).join(", ")
                      : "No approval users configured"}
                  </p>
                </div>

                <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-normal text-[#667085]">
                    Approved By
                  </p>

                  <p className="mt-2 text-sm font-bold leading-6 text-sibs-primary-1">
                    {approvedBy.length > 0
                      ? approvedBy.map(getApprovalLabel).join(", ")
                      : "Waiting for approval"}
                  </p>

                  {rejectedBy.length > 0 && (
                    <>
                      <p className="mt-4 text-[10px] font-extrabold uppercase tracking-normal text-red-600">
                        Rejected By
                      </p>

                      <p className="mt-2 text-sm font-bold leading-6 text-red-600">
                        {rejectedBy.map(getApprovalLabel).join(", ")}
                      </p>
                    </>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-[#042C51]">
                  Remarks
                </h3>

                <p className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm font-semibold leading-6 text-[#344054]">
                  {offer.remarks || "—"}
                </p>
              </section>
            </div>

            <aside className="space-y-5">
              <section className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-extrabold text-[#042C51]">
                  Offer Summary
                </h3>

                <div className="mt-4">
                  <DetailRow label="Candidate ID" value={offer.candidateId} />

                  <DetailRow
                    label="Hiring Requirement"
                    value={offer.hiringRequirementId}
                  />

                  <DetailRow label="Final Role" value={offer.roleTitle} />

                  <DetailRow label="Final Account" value={offer.account} />

                  <DetailRow
                    label="Basic Pay"
                    value={formatCurrency(offer.basicPay)}
                  />

                  <DetailRow
                    label="Deminimis / Daily Rate"
                    value={formatCurrency(offer.deminimisDailyRate)}
                  />

                  <DetailRow
                    label="Total Daily Rate"
                    value={formatCurrency(offer.dailyRate)}
                  />

                  <DetailRow
                    label="Contract Sent"
                    value={offer.contractSent ? "Yes" : "No"}
                  />

                  <DetailRow
                    label="Candidate Response"
                    value={offer.candidateResponse}
                  />

                  <DetailRow label="Owner" value={offer.owner} />
                </div>
              </section>
            </aside>
          </div>
        </div>

        <div className="border-t border-[#E6ECF2] px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-5 text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
