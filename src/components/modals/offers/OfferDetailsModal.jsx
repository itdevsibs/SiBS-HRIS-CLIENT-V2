import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  FileText,
  History,
  Loader2,
  X,
  XCircle,
} from "lucide-react";
import api from "../../../lib/axios/api-template";

import DetailRow from "../../recruitment/offers/common/DetailRow";

import { getStatusClass } from "../../../lib/utils/offers/offerHelpers";
import { formatCurrency } from "../../../lib/utils/offers/offerFormatters";
import {
  formatOfferVersionDate,
  getOfferEvaluationScores,
  getOfferHistory,
} from "../../../lib/utils/offers/offerEvaluationHistory";
import { useOffers } from "../../../services/context/OffersContext";

function cleanText(value) {
  return String(value ?? "").trim();
}


function getRateDisplay(value) {
  return value === null || value === undefined || value === ""
    ? "—"
    : formatCurrency(value);
}

function getVersionTone(status = "") {
  const key = cleanText(status).toLowerCase();

  if (key.includes("approved") || key.includes("accepted")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (key.includes("reject") || key.includes("declin")) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (key.includes("review") || key.includes("pending")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-blue-100 bg-blue-50 text-sibs-primary-1";
}

function EvaluationResultItem({ label, value, detail = "" }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-2.5 2xl:p-3">
      <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
        {label}
      </p>
      <p className="mt-0.5 sibs-text-xs 2xl:sibs-text-sm font-extrabold text-[#042C51]">
        {value || "—"}
      </p>
      {detail ? (
        <p className="mt-0.5 sibs-text-micro font-semibold leading-4 text-[#667085]">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function VersionRateChange({ label, previousValue, currentValue }) {
  const hasPrevious =
    previousValue !== null &&
    previousValue !== undefined &&
    previousValue !== "";

  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-2.5 2xl:p-3">
      <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
        {label}
      </p>

      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {hasPrevious ? (
          <>
            <span className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
              Previous Offer
            </span>
            <span className="sibs-text-xs 2xl:sibs-text-sm font-bold text-[#667085] tabular-nums">
              {getRateDisplay(previousValue)}
            </span>
            <ArrowRight size={14} className="text-[#FF5C28]" />
          </>
        ) : null}
        <span className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
          Current Offer
        </span>
        <span className="sibs-text-xs 2xl:sibs-text-sm font-extrabold text-[#042C51] tabular-nums">
          {getRateDisplay(currentValue)}
        </span>
      </div>
    </div>
  );
}

export default function OfferDetailsModal({ open, offer, onClose }) {
  const {
    getOfferApprovalStatus,
    handleApproval,
    canCurrentUserApproveOffer,
    isSubmittingApproval = false,
    refreshOffers,
    openStatusModal,
    setSelectedOffer,
  } = useOffers();

  const historySectionRef = useRef(null);
  const [revisedBasicPay, setRevisedBasicPay] = useState("");
  const [revisedDeminimis, setRevisedDeminimis] = useState("");
  const [revisedRemarks, setRevisedRemarks] = useState("");
  const [savingRevision, setSavingRevision] = useState(false);
  const [approvalAction, setApprovalAction] = useState("");
  const [loadedOfferVersions, setLoadedOfferVersions] = useState([]);
  const [loadingOfferHistory, setLoadingOfferHistory] = useState(false);

  useEffect(() => {
    if (!offer) return;

    /*
     * A negotiated offer must be entered explicitly. Do not prefill the
     * current approved compensation because that can be submitted by mistake.
     */
    setRevisedBasicPay("");
    setRevisedDeminimis("");
    setRevisedRemarks("");
    setApprovalAction("");
    setLoadedOfferVersions([]);
  }, [offer]);

  useEffect(() => {
    if (!open || !offer) return undefined;

    const pipelineId =
      offer.candidatePipelineId ||
      offer.candidate_pipeline_id ||
      offer.dbId ||
      offer.id;

    if (!pipelineId) return undefined;

    let active = true;
    const controller = new AbortController();

    async function loadOfferHistory() {
      setLoadingOfferHistory(true);

      try {
        const response = await api.get(
          `/api/candidate-pipeline/${encodeURIComponent(pipelineId)}/offer-versions`,
          {
            withCredentials: true,
            signal: controller.signal,
            params: { _t: Date.now() },
          },
        );

        const payload = response?.data ?? response;
        const versions = Array.isArray(payload?.offerVersions)
          ? payload.offerVersions
          : Array.isArray(payload?.versions)
            ? payload.versions
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

        if (active) {
          setLoadedOfferVersions(versions);
        }
      } catch (error) {
        if (
          active &&
          error?.code !== "ERR_CANCELED" &&
          error?.name !== "CanceledError"
        ) {
          setLoadedOfferVersions([]);
        }
      } finally {
        if (active) setLoadingOfferHistory(false);
      }
    }

    loadOfferHistory();

    return () => {
      active = false;
      controller.abort();
    };
  }, [open, offer?.candidatePipelineId, offer?.candidate_pipeline_id, offer?.dbId, offer?.id]);

  useEffect(() => {
    if (!open || offer?.__openSection !== "negotiation-history") return;

    const frame = window.requestAnimationFrame(() => {
      historySectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, offer?.__openSection, offer?.id]);

  const evaluationScores = useMemo(
    () => getOfferEvaluationScores(offer || {}),
    [offer],
  );

  const offerHistory = useMemo(
    () =>
      getOfferHistory({
        ...(offer || {}),
        offerVersions:
          loadedOfferVersions.length > 0
            ? loadedOfferVersions
            : offer?.offerVersions || offer?.offer_versions,
      }),
    [loadedOfferVersions, offer],
  );

  /*
   * The newest offer version is the single source of truth for this modal.
   * Older versions remain stored for audit purposes but are intentionally not
   * displayed here, so the left offer card and right Offer Summary can never
   * show values from different revisions.
   */
  const latestOfferVersion = offerHistory[0] || null;

  const displayedOfferHistory = latestOfferVersion
    ? [latestOfferVersion]
    : [];

  if (!open || !offer) return null;

  const approvalStatus =
    latestOfferVersion?.approvalStatus ||
    (
      getOfferApprovalStatus
        ? getOfferApprovalStatus(offer)
        : offer.offerApprovalStatus || offer.status || "For Review"
    );

  const isAuthorizedApprover =
    typeof canCurrentUserApproveOffer === "function"
      ? canCurrentUserApproveOffer(offer)
      : Boolean(canCurrentUserApproveOffer);

  const canReviewOffer =
    approvalStatus === "For Review" && isAuthorizedApprover;

  const responseStatus =
    latestOfferVersion?.candidateResponse ||
    offer.offerResponseStatus ||
    offer.offer_response_status ||
    offer.candidateResponse ||
    offer.candidate_response ||
    offer.offerDecision ||
    offer.offer_decision ||
    "Pending";

  const negotiationMessage =
    latestOfferVersion?.candidateMessage ||
    offer.offerNegotiationMessage ||
    offer.offer_negotiation_message ||
    offer.offerDetails?.offerNegotiationMessage ||
    offer.offerDetails?.offer_negotiation_message ||
    "";

  const canSubmitRevision = ["negotiate", "negotiation"].includes(
    cleanText(responseStatus).toLowerCase(),
  );

  const isProcessingApproval = Boolean(isSubmittingApproval);
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

      if (status === "Approved") {
        onClose?.();
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

  function preventCompensationWheel(event) {
    event.preventDefault();
    event.currentTarget.blur();
  }

  function preventCompensationArrowChange(event) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
    }
  }

  async function submitRevision() {
    const pipelineId =
      offer.candidatePipelineId ||
      offer.candidate_pipeline_id ||
      offer.dbId ||
      offer.id;

    if (!pipelineId || isBusy) return;

    if (String(revisedBasicPay).trim() === "") {
      openStatusModal?.({
        type: "error",
        title: "New Basic Daily Rate Required",
        message: "Please enter the new Basic Daily Rate.",
      });
      return;
    }

    if (String(revisedDeminimis).trim() === "") {
      openStatusModal?.({
        type: "error",
        title: "New Daily De Minimis Required",
        message: "Please enter the new Daily De Minimis.",
      });
      return;
    }

    const nextBasicPay = Number(revisedBasicPay);
    const nextDeminimis = Number(revisedDeminimis);

    if (!Number.isFinite(nextBasicPay) || nextBasicPay < 0) {
      openStatusModal?.({
        type: "error",
        title: "Invalid New Basic Daily Rate",
        message: "Enter a valid non-negative new Basic Daily Rate.",
      });
      return;
    }

    if (!Number.isFinite(nextDeminimis) || nextDeminimis < 0) {
      openStatusModal?.({
        type: "error",
        title: "Invalid New Daily De Minimis",
        message: "Enter a valid non-negative new Daily De Minimis.",
      });
      return;
    }

    setSavingRevision(true);

    try {
      const response = await api.post(
        `/api/candidate-pipeline/${encodeURIComponent(pipelineId)}/offer-revisions`,
        {
          basicDailyRate: nextBasicPay,
          dailyDeMinimis: nextDeminimis,
          remarks: revisedRemarks,
        },
        { withCredentials: true },
      );

      const payload = response?.data ?? response;

      if (payload?.success === false) {
        throw new Error(payload?.message || "Unable to save revised offer.");
      }

      const refreshedCandidates = await refreshOffers?.();
      const responseCandidate =
        payload?.candidate || payload?.data?.candidate || payload?.data;

      if (responseCandidate && typeof setSelectedOffer === "function") {
        setSelectedOffer(responseCandidate);
      } else if (Array.isArray(refreshedCandidates)) {
        const refreshedOffer = refreshedCandidates.find(
          (candidate) =>
            String(
              candidate.candidatePipelineId || candidate.dbId || candidate.id,
            ) === String(pipelineId),
        );

        if (refreshedOffer && typeof setSelectedOffer === "function") {
          setSelectedOffer(refreshedOffer);
        }
      }

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
      className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[9999] flex h-dvh items-center justify-center px-4 py-4 font-jakarta"
      onClick={handleClose}
    >
      <div
        className="sibs-modal-pop-in relative flex max-h-[92dvh] w-full max-w-5xl 2xl:max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#D6DEE8] bg-white font-jakarta shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5">
          <div>
            <h2 className="text-base sm:text-lg 2xl:text-xl font-extrabold tracking-tight">
              Offer Details
            </h2>
            <p className="mt-0.5 sibs-text-xs font-semibold text-white/75 2xl:text-sm">
              Approval, evaluation results, and complete offer negotiation history.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isBusy}
            className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close offer details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 2xl:p-6">
          <div className="grid grid-cols-1 gap-4 2xl:gap-5 lg:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-5">
              <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#FF5C28]">
                      {offer.offerId}
                    </p>
                    <h3 className="mt-1 text-lg 2xl:text-xl font-extrabold tracking-tight text-[#042C51]">
                      {offer.candidateName}
                    </h3>
                    <p className="mt-0.5 sibs-text-xs font-semibold text-[#667085]">
                      {offer.roleTitle || "—"}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full border px-3 py-1 sibs-text-xs font-extrabold ${getStatusClass(
                      approvalStatus,
                    )}`}
                  >
                    {approvalStatus}
                  </span>
                </div>
              </section>

              {canSubmitRevision ? (
                <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5 shadow-sm">
                  <h3 className="sibs-text-sm font-extrabold text-amber-900">
                    Candidate Requested Negotiation
                  </h3>
                  <p className="mt-2 rounded-lg border border-amber-200 bg-white p-3 sibs-text-xs font-semibold text-amber-900">
                    {negotiationMessage || "No negotiation message was saved."}
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                      New Basic Daily Rate
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={revisedBasicPay}
                        disabled={isBusy}
                        onWheel={preventCompensationWheel}
                        onKeyDown={preventCompensationArrowChange}
                        onChange={(event) =>
                          setRevisedBasicPay(event.target.value)
                        }
                        placeholder="Enter new basic daily rate"
                        className="mt-1.5 h-8.5 2xl:h-10 w-full rounded-xl border border-[#D6DEE8] bg-white px-3 sibs-text-xs font-bold outline-none transition [appearance:textfield] placeholder:text-slate-400 focus:border-[#FF5C28] disabled:cursor-not-allowed disabled:bg-slate-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </label>

                    <label className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                      New Daily De Minimis
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={revisedDeminimis}
                        disabled={isBusy}
                        onWheel={preventCompensationWheel}
                        onKeyDown={preventCompensationArrowChange}
                        onChange={(event) =>
                          setRevisedDeminimis(event.target.value)
                        }
                        placeholder="Enter new daily de minimis"
                        className="mt-1.5 h-8.5 2xl:h-10 w-full rounded-xl border border-[#D6DEE8] bg-white px-3 sibs-text-xs font-bold outline-none transition [appearance:textfield] placeholder:text-slate-400 focus:border-[#FF5C28] disabled:cursor-not-allowed disabled:bg-slate-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </label>
                  </div>

                  <label className="mt-3 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                    Internal Remarks
                    <textarea
                      rows={3}
                      value={revisedRemarks}
                      disabled={isBusy}
                      onChange={(event) => setRevisedRemarks(event.target.value)}
                      className="mt-1.5 w-full resize-none rounded-xl border border-[#D6DEE8] bg-white p-3 sibs-text-xs font-semibold outline-none focus:border-[#FF5C28]"
                    />
                  </label>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={submitRevision}
                    className="mt-4 inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-3.5 2xl:px-5 sibs-text-xs font-extrabold text-white transition hover:bg-[#E94F1F] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingRevision ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : null}
                    {savingRevision
                      ? "Submitting..."
                      : "Submit New Offer for Approval"}
                  </button>
                </section>
              ) : null}

              <section
                ref={historySectionRef}
                className="scroll-mt-5 rounded-xl border border-[#E6ECF2] bg-white p-4 sm:p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <History size={16} className="text-[#FF5C28]" />
                      <h3 className="sibs-text-sm font-extrabold text-[#042C51]">
                        Negotiation History
                      </h3>
                    </div>
                    <p className="mt-0.5 sibs-text-xs font-semibold leading-relaxed text-[#667085]">
                      Current offer compared with the previous offer.
                    </p>
                  </div>

                  <span className="w-fit rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase text-[#042C51]">
                    Current Offer
                  </span>
                </div>

                {loadingOfferHistory ? (
                  <div className="mt-5 space-y-3 animate-pulse">
                    <div className="h-4 w-1/3 rounded-full bg-slate-200" />
                    <div className="h-40 rounded-2xl bg-slate-100" />
                  </div>
                ) : null}

                <div className="mt-4 space-y-3.5">
                  {displayedOfferHistory.map((version) => (
                    <article
                      key={`${version.id || "version"}-${version.versionNumber}`}
                      className="rounded-2xl border border-[#D9E2EC] bg-white p-3.5 2xl:p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#042C51] px-2.5 py-0.5 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase text-white">
                              Current Offer
                            </span>
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase ${getVersionTone(
                                version.approvalStatus,
                              )}`}
                            >
                              {version.approvalStatus || "For Review"}
                            </span>
                            <span className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase text-[#667085]">
                              Previous Offer → Current Offer
                            </span>
                          </div>

                          <p className="mt-1.5 sibs-text-micro font-semibold text-[#667085]">
                            Submitted: {formatOfferVersionDate(version.submittedAt)}
                          </p>
                          <p className="mt-0.5 sibs-text-micro font-semibold text-[#667085]">
                            Submitted by: {version.submittedBy || "—"}
                          </p>
                        </div>

                        <span className="w-fit rounded-full border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-0.5 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase text-[#475467]">
                          Candidate: {version.candidateResponse || "Pending"}
                        </span>
                      </div>

                      <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
                        <VersionRateChange
                          label="Basic Daily Rate"
                          previousValue={version.previousBasicDailyRate}
                          currentValue={version.basicDailyRate}
                        />
                        <VersionRateChange
                          label="Daily De Minimis"
                          previousValue={version.previousDailyDeMinimis}
                          currentValue={version.dailyDeMinimis}
                        />
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-amber-100 bg-amber-50 p-2.5 2xl:p-3">
                          <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-amber-700">
                            Candidate Remark
                          </p>
                          <p className="mt-1.5 whitespace-pre-wrap sibs-text-xs font-semibold leading-relaxed text-amber-900">
                            {version.candidateMessage || "—"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-2.5 2xl:p-3">
                          <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#042C51]">
                            Internal Remark
                          </p>
                          <p className="mt-1.5 whitespace-pre-wrap sibs-text-xs font-semibold leading-relaxed text-[#344054]">
                            {version.internalRemarks || "—"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-2.5 2xl:p-3">
                          <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                            Approval Decision
                          </p>
                          <p className="mt-0.5 sibs-text-micro 2xl:sibs-text-xs font-extrabold text-[#042C51]">
                            {version.approvedBy
                              ? `Approved by ${version.approvedBy}`
                              : version.rejectedBy
                                ? `Rejected by ${version.rejectedBy}`
                                : "Waiting for approval"}
                          </p>
                          <p className="mt-0.5 sibs-text-micro font-semibold text-[#667085]">
                            {formatOfferVersionDate(
                              version.approvedAt || version.rejectedAt,
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-2.5 2xl:p-3">
                          <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                            Approval Remarks
                          </p>
                          <p className="mt-0.5 sibs-text-micro 2xl:sibs-text-xs font-bold leading-relaxed text-[#475467]">
                            {version.approvalRemarks || "—"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-2.5 2xl:p-3">
                          <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                            Offer Email
                          </p>
                          <p className="mt-0.5 sibs-text-micro 2xl:sibs-text-xs font-extrabold text-[#042C51]">
                            {version.offerEmailSent ? "Sent" : "Not Sent"}
                          </p>
                          <p className="mt-0.5 sibs-text-micro font-semibold text-[#667085]">
                            {formatOfferVersionDate(version.offerSentAt)}
                          </p>
                        </div>
                      </div>

                      {version.pdfAvailable || version.pdfFilename ? (
                        <button
                          type="button"
                          onClick={() => {
                            const pipelineId =
                              offer.candidatePipelineId ||
                              offer.candidate_pipeline_id ||
                              offer.dbId ||
                              offer.id;
                            const baseUrl = cleanText(api.defaults?.baseURL).replace(/\/$/, "");
                            const pdfUrl = `${baseUrl}/api/candidate-pipeline/${encodeURIComponent(
                              pipelineId,
                            )}/offer-versions/${encodeURIComponent(
                              version.versionNumber,
                            )}/pdf`;
                            window.open(pdfUrl, "_blank", "noopener,noreferrer");
                          }}
                          className="mt-3 inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#042C51] transition hover:bg-blue-100"
                        >
                          <FileText size={15} />
                          Open Employment Offer PDF
                        </button>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 sm:p-5 shadow-sm">
                <h3 className="sibs-text-sm font-extrabold text-[#042C51]">
                  Remarks
                </h3>
                <p className="mt-2.5 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3.5 sibs-text-xs font-semibold leading-relaxed text-[#344054]">
                  {offer.remarks || "—"}
                </p>
              </section>
            </div>

            <aside className="space-y-4 2xl:space-y-5 lg:sticky lg:top-0 lg:self-start">
              <section className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 2xl:p-5">
                <h3 className="sibs-text-sm font-extrabold text-[#042C51]">
                  Offer Summary
                </h3>

                <div className="mt-3">
                  <DetailRow label="Candidate ID" value={offer.candidateId} />
                  <DetailRow
                    label="Hiring Requirement"
                    value={offer.hiringRequirementId}
                  />
                  <DetailRow
                    label="Final Role"
                    value={
                      latestOfferVersion?.roleTitle ||
                      offer.roleTitle
                    }
                  />
                  <DetailRow
                    label="Final Account"
                    value={
                      latestOfferVersion?.account ||
                      offer.account
                    }
                  />
                  <DetailRow
                    label="Basic Pay"
                    value={formatCurrency(
                      latestOfferVersion?.basicDailyRate ??
                        offer.basicPay,
                    )}
                  />
                  <DetailRow
                    label="Deminimis / Daily Rate"
                    value={formatCurrency(
                      latestOfferVersion?.dailyDeMinimis ??
                        offer.deminimisDailyRate,
                    )}
                  />
                  <DetailRow
                    label="Total Daily Rate"
                    value={formatCurrency(
                      latestOfferVersion?.totalDailyRate ??
                        (
                          Number(
                            latestOfferVersion?.basicDailyRate ??
                              offer.basicPay ??
                              0,
                          ) +
                          Number(
                            latestOfferVersion?.dailyDeMinimis ??
                              offer.deminimisDailyRate ??
                              0,
                          )
                        ),
                    )}
                  />
                  <DetailRow
                    label="Contract Sent"
                    value={
                      latestOfferVersion?.offerEmailSent ||
                      offer.contractSent ||
                      offer.offerEmailSent
                        ? "Yes"
                        : "No"
                    }
                  />
                  <DetailRow
                    label="Candidate Response"
                    value={responseStatus}
                  />
                  <DetailRow
                    label="Owner"
                    value={
                      latestOfferVersion?.submittedBy ||
                      offer.owner
                    }
                  />
                </div>
              </section>

              <section className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 2xl:p-5">
                <h3 className="sibs-text-sm font-extrabold text-[#042C51]">
                  Evaluation Results
                </h3>
                <p className="mt-0.5 sibs-text-xs font-semibold leading-relaxed text-[#667085]">
                  Scores carried forward from Candidate Pipeline.
                </p>

                <div className="mt-3 space-y-2.5">
                  <EvaluationResultItem
                    label="Assessment Score"
                    value={evaluationScores.assessment.display}
                    detail={evaluationScores.assessment.result}
                  />
                  <EvaluationResultItem
                    label="Job Evaluation Score"
                    value={evaluationScores.jobEvaluation.display}
                    detail={
                      evaluationScores.jobEvaluation.rank
                        ? `Rank ${evaluationScores.jobEvaluation.rank}`
                        : ""
                    }
                  />
                  <EvaluationResultItem
                    label="Final Interview Score"
                    value={evaluationScores.finalInterview.display}
                    detail={[
                      evaluationScores.finalInterview.result,
                      evaluationScores.finalInterview.passingScore !== null
                        ? `Passing score: ${evaluationScores.finalInterview.passingScore}`
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                </div>
              </section>
            </aside>
          </div>
        </div>

        <div className="border-t border-[#E6ECF2] bg-white px-5 py-3 sm:px-6 2xl:py-4">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isBusy}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#475467] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Close
            </button>

            {canReviewOffer ? (
              <>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleOfferApproval("Rejected")}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {approvalAction === "Rejected" ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <XCircle size={15} />
                  )}
                  {approvalAction === "Rejected" ? "Declining..." : "Decline"}
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleOfferApproval("Approved")}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg bg-sibs-primary-1 px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {approvalAction === "Approved" ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Check size={15} />
                  )}
                  {approvalAction === "Approved" ? "Approving..." : "Approve"}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
