import { useEffect, useState } from "react";
import { Check, Loader2, X, XCircle } from "lucide-react";
import api from "../../../lib/axios/api-template";

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

function OfferApprovalLoadingOverlay({ action = "" }) {
  const isApproving = action === "Approved";

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-[2px]">
      <div
        role="status"
        aria-live="polite"
        aria-label={isApproving ? "Approving offer" : "Declining offer"}
        className="w-full max-w-md rounded-2xl border border-[#D6DEE8] bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FB] text-sibs-primary-1">
            <Loader2 size={22} className="animate-spin" />
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-sibs-primary-1">
              {isApproving ? "Approving Offer" : "Declining Offer"}
            </h3>

            <p className="mt-1 text-sm font-semibold leading-6 text-sibs-tertiary-5">
              {isApproving
                ? "Please wait while the approval is saved and the offer records are refreshed."
                : "Please wait while the decline decision is saved and the offer records are refreshed."}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3 animate-pulse">
          <div className="h-3 w-2/5 rounded-full bg-slate-200" />
          <div className="h-11 rounded-xl bg-slate-100" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 rounded-xl bg-slate-100" />
            <div className="h-16 rounded-xl bg-slate-100" />
          </div>
          <div className="h-3 w-3/5 rounded-full bg-slate-200" />
        </div>

        <p className="mt-5 text-center text-sm font-extrabold text-sibs-primary-1">
          {isApproving ? "Approving offer..." : "Declining offer..."}
        </p>
      </div>
    </div>
  );
}

export default function OfferDetailsModal({ open, offer, onClose }) {
  const {
    approvalUsers = [],
    getOfferApprovalStatus,
    getApprovalRecordForUser,
    handleApproval,
    canCurrentUserApproveOffer,
    refreshOffers,
    openStatusModal,
  } = useOffers();

  const [revisedBasicPay, setRevisedBasicPay] = useState("");
  const [revisedDeminimis, setRevisedDeminimis] = useState("");
  const [revisedRemarks, setRevisedRemarks] = useState("");
  const [savingRevision, setSavingRevision] = useState(false);
  const [approvalAction, setApprovalAction] = useState("");

  useEffect(() => {
    if (!offer) return;
    setRevisedBasicPay(String(offer.basicPay ?? ""));
    setRevisedDeminimis(String(offer.deminimisDailyRate ?? ""));
    setRevisedRemarks("");
    setApprovalAction("");
  }, [offer]);

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

  const isAuthorizedApprover =
    typeof canCurrentUserApproveOffer === "function"
      ? canCurrentUserApproveOffer(offer)
      : Boolean(canCurrentUserApproveOffer);

  const canReviewOffer =
    approvalStatus === "For Review" &&
    isAuthorizedApprover;

  const responseStatus =
    offer.offerResponseStatus ||
    offer.offer_response_status ||
    offer.candidateResponse ||
    offer.candidate_response ||
    offer.offerDecision ||
    offer.offer_decision ||
    "Pending";

  const negotiationMessage =
    offer.offerNegotiationMessage ||
    offer.offer_negotiation_message ||
    offer.offerDetails?.offerNegotiationMessage ||
    offer.offerDetails?.offer_negotiation_message ||
    "";

  const canSubmitRevision =
    responseStatus === "Negotiate" ||
    responseStatus === "Negotiation";

  const isProcessingApproval = Boolean(approvalAction);
  const isBusy = savingRevision || isProcessingApproval;

  function handleClose() {
    if (isBusy) return;
    onClose?.();
  }

  async function handleOfferApproval(status) {
    if (!canReviewOffer || isBusy || typeof handleApproval !== "function") {
      return;
    }

    setApprovalAction(status);

    try {
      const result = await handleApproval(offer, status);

      if (result?.success === false) {
        throw new Error(
          result?.message ||
            `Unable to ${status === "Approved" ? "approve" : "decline"} the offer.`,
        );
      }
    } catch (error) {
      openStatusModal?.({
        type: "error",
        title:
          status === "Approved"
            ? "Offer Approval Failed"
            : "Offer Decline Failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          `Unable to ${status === "Approved" ? "approve" : "decline"} the offer.`,
      });
    } finally {
      setApprovalAction("");
    }
  }

  async function submitRevision() {
    const pipelineId =
      offer.candidatePipelineId ||
      offer.candidate_pipeline_id ||
      offer.dbId ||
      offer.id;

    if (!pipelineId) return;

    setSavingRevision(true);

    try {
      const response = await api.post(
        `/api/candidate-pipeline/${encodeURIComponent(pipelineId)}/offer-revise`,
        {
          basicPay: Number(revisedBasicPay),
          deminimisDailyRate: Number(revisedDeminimis),
          remarks: revisedRemarks,
        },
        { withCredentials: true },
      );

      const payload = response?.data ?? response;

      if (payload?.success === false) {
        throw new Error(payload?.message || "Unable to save revised offer.");
      }

      await refreshOffers?.();

      openStatusModal?.({
        type: "success",
        title: "Revised Offer Submitted",
        message:
          payload?.message ||
          "The negotiated rates were returned for approver review.",
      });
    } catch (error) {
      openStatusModal?.({
        type: "error",
        title: "Revision Failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to save revised rates.",
      });
    } finally {
      setSavingRevision(false);
    }
  }

  return (
    <div
      className="sibs-modal-blur fixed inset-0 z-[9999] flex h-dvh items-center justify-center px-4 py-4"
      onClick={handleClose}
    >
      <div
        className="relative flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#D6DEE8] bg-white font-jakarta shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isProcessingApproval ? (
          <OfferApprovalLoadingOverlay action={approvalAction} />
        ) : null}

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
            onClick={handleClose}
            disabled={isBusy}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
                      {offer.roleTitle || "—"}
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

              {canSubmitRevision ? (
                <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                  <h3 className="text-sm font-extrabold text-amber-900">
                    Candidate Requested Negotiation
                  </h3>
                  <p className="mt-2 rounded-lg border border-amber-200 bg-white p-3 text-sm font-semibold text-amber-900">
                    {offer.offerNegotiationMessage || "No negotiation message was saved."}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-extrabold text-[#042C51]">
                      Revised Basic Daily Rate
                      <input type="number" min="0" step="0.01" value={revisedBasicPay} disabled={isBusy} onChange={(event) => setRevisedBasicPay(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3" />
                    </label>
                    <label className="text-xs font-extrabold text-[#042C51]">
                      Revised Daily De Minimis
                      <input type="number" min="0" step="0.01" value={revisedDeminimis} disabled={isBusy} onChange={(event) => setRevisedDeminimis(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3" />
                    </label>
                  </div>
                  <label className="mt-3 block text-xs font-extrabold text-[#042C51]">
                    Internal Remarks
                    <textarea rows={3} value={revisedRemarks} disabled={isBusy} onChange={(event) => setRevisedRemarks(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3" />
                  </label>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={submitRevision}
                    className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingRevision ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : null}
                    {savingRevision
                      ? "Submitting..."
                      : "Submit Revised Offer for Approval"}
                  </button>
                </section>
              ) : null}

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
                    value={responseStatus}
                  />

                  <DetailRow label="Owner" value={offer.owner} />
                </div>
              </section>
            </aside>
          </div>
        </div>

        <div className="border-t border-[#E6ECF2] bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isBusy}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-[#475467] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Close
            </button>

            {canReviewOffer ? (
              <>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleOfferApproval("Rejected")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-extrabold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {approvalAction === "Rejected" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <XCircle size={16} />
                  )}
                  {approvalAction === "Rejected"
                    ? "Declining..."
                    : "Decline"}
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleOfferApproval("Approved")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {approvalAction === "Approved" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  {approvalAction === "Approved"
                    ? "Approving..."
                    : "Approve"}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
