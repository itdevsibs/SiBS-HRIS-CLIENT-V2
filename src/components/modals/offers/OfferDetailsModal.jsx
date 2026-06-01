import { X } from "lucide-react";
import DetailRow from "../../recruitment/offers/common/DetailRow";
import {
  getOfferApprovalSummary,
  getStatusClass,
} from "../../../lib/utils/offers/offerHelpers";
import { formatCurrency } from "../../../lib/utils/offers/offerFormatters";
import { getOfferApprovalUsers } from "../../../lib/utils/offers/offerApprovalSettings";
// import { offerApprovers } from "../../../lib/utils/offers/offerConstants";

export default function OfferDetailsModal({ open, offer, onClose }) {
  if (!open || !offer) return null;

  const approvalStatus = getOfferApprovalSummary(offer);

  const approvalUsers = getOfferApprovalUsers();

  const approvedBy = approvalUsers.filter(
    (approver) => offer.approvals?.[approver]?.status === "Approved",
  );

  const rejectedBy = approvalUsers.filter(
    (approver) => offer.approvals?.[approver]?.status === "Rejected",
  );

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-extrabold text-sibs-primary-1 sm:text-xl">
              Offer Details
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Approval details from the Candidate Pipeline offered stage.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-bold text-sibs-primary-1">
                      {offer.offerId}
                    </p>

                    <h3 className="mt-1 text-2xl font-extrabold text-[#101828]">
                      {offer.candidateName}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                      {offer.roleTitle} / {offer.account}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                      offer.status,
                    )}`}
                  >
                    {offer.status}
                  </span>
                </div>
              </section>

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#101828]">
                      Offer Approval
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                      Managed by required approvers.
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
                  <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                    Approved By
                  </p>

                  <p className="mt-2 text-sm font-bold leading-6 text-sibs-primary-1">
                    {approvedBy.length > 0
                      ? approvedBy.join(", ")
                      : "Waiting for approval"}
                  </p>

                  {rejectedBy.length > 0 && (
                    <>
                      <p className="mt-4 text-xs font-extrabold uppercase tracking-wide text-red-500">
                        Rejected By
                      </p>

                      <p className="mt-2 text-sm font-bold leading-6 text-red-600">
                        {rejectedBy.join(", ")}
                      </p>
                    </>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-[#101828]">
                  Remarks
                </h3>

                <p className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm font-semibold leading-6 text-[#344054]">
                  {offer.remarks || "—"}
                </p>
              </section>
            </div>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-extrabold text-[#101828]">
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

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
