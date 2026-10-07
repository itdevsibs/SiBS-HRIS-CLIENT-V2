import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  FileText,
  History,
  Loader2,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import api from "../../../lib/axios/api-template";
import EmploymentOfferPdfPreviewModal from "../common/EmploymentOfferPdfPreviewModal";
import { getStatusClass } from "../../../lib/utils/offers/offerHelpers";
import { formatCurrency } from "../../../lib/utils/offers/offerFormatters";
import {
  formatOfferVersionDate,
  getOfferEvaluationScores,
  getOfferHistory,
  hasOfferApproverSignature,
} from "../../../lib/utils/offers/offerEvaluationHistory";
import { useOffers } from "../../../services/context/OffersContext";
function cleanText(value) {
  return String(value ?? "").trim();
}
function getOfferOwnerDisplay(version = {}, offer = {}) {
  return (
    cleanText(
      version?.submittedByDisplay ||
        version?.submitted_by_display ||
        offer?.ownerDisplay ||
        offer?.owner_display ||
        version?.submittedBy ||
        version?.submitted_by ||
        offer?.owner,
    ) || "—"
  );
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
function getAlignedInternalRemarkLines(value) {
  const text = cleanText(value);
  if (!text) return [];
  const normalized = text
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n");
  if (normalized.includes("\n")) {
    return normalized
      .split("\n")
      .map((line) => cleanText(line))
      .filter(Boolean);
  }
  return normalized
    .split(/,\s*(?=[A-Z][A-Za-z0-9/() .#&-]*:)/)
    .map((line) => cleanText(line))
    .filter(Boolean);
}
function InternalRemarkContent({ value }) {
  const lines = getAlignedInternalRemarkLines(value);
  if (!lines.length) {
    return (
      <p className="mt-1.5 whitespace-pre-wrap sibs-text-xs font-semibold leading-relaxed text-slate-700">
        —
      </p>
    );
  }
  return (
    <div className="mt-1.5 space-y-1.5">
      {lines.map((line, index) => {
        const colonIndex = line.indexOf(":");
        const hasLabel = colonIndex > 0;
        const label = hasLabel ? cleanText(line.slice(0, colonIndex)) : "";
        const content = hasLabel ? cleanText(line.slice(colonIndex + 1)) : line;
        return (
          <div key={`${line}-${index}`} className="sibs-text-xs font-semibold leading-relaxed text-slate-700">
            {hasLabel ? (
              <>
                <span className="font-extrabold text-sibs-navy">{label}:</span>{" "}
                <span>{content || "—"}</span>
              </>
            ) : (
              <span>{content || "—"}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
function EvaluationResultItem({ label, value, detail = "" }) {
  return (
    <div className="rounded-[10px] border border-sibs-border bg-white p-2.5 2xl:p-3">
      <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
        {label}
      </p>
      <p className="mt-0.5 sibs-text-xs 2xl:sibs-text-sm font-extrabold text-sibs-navy">
        {value || "—"}
      </p>
      {detail ? (
        <p className="mt-0.5 sibs-text-micro font-semibold leading-4 text-sibs-muted">
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
    <div className="rounded-[10px] border border-sibs-border bg-slate-50 p-2.5 2xl:p-3">
      <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
        {label}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {hasPrevious ? (
          <>
            <span className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
              Previous Offer
            </span>
            <span className="sibs-text-xs 2xl:sibs-text-sm font-bold text-sibs-muted tabular-nums">
              {getRateDisplay(previousValue)}
            </span>
            <ArrowRight size={14} className="text-sibs-orange" />
          </>
        ) : null}
        <span className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
          Current Offer
        </span>
        <span className="sibs-text-xs 2xl:sibs-text-sm font-extrabold text-sibs-navy tabular-nums">
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

  const navigate = useNavigate();

  const historySectionRef = useRef(null);
  const [revisedBasicPay, setRevisedBasicPay] = useState("");
  const [revisedDeminimis, setRevisedDeminimis] = useState("");
  const [revisedRemarks, setRevisedRemarks] = useState("");
  const [savingRevision, setSavingRevision] = useState(false);
  const [approvalAction, setApprovalAction] = useState("");
  const [loadedOfferVersions, setLoadedOfferVersions] = useState([]);
  const [loadingOfferHistory, setLoadingOfferHistory] = useState(false);
  const [employmentOfferPreview, setEmploymentOfferPreview] = useState({
    open: false,
    filename: "",
    requestUrl: "",
  });
  const [activeDetailsTab, setActiveDetailsTab] = useState("breakdown");
  useEffect(() => {
    if (!offer) return;
    /*
     * A negotiated offer must be entered explicitly. Do not prefill the
     * current approved compensation because that can be submitted by mistake.
     */
    setRevisedBasicPay("");
    setRevisedDeminimis("");
    const currentOfferHistory = getOfferHistory(offer || {});
    setRevisedRemarks(cleanText(currentOfferHistory[0]?.internalRemarks));
    setApprovalAction("");
    setLoadedOfferVersions([]);
    setActiveDetailsTab("breakdown");
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
          const latestLoadedVersion = getOfferHistory({
            ...(offer || {}),
            offerVersions: versions,
          })[0];
          setRevisedRemarks((currentRemarks) =>
            cleanText(currentRemarks) || cleanText(latestLoadedVersion?.internalRemarks),
          );
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
    setActiveDetailsTab("breakdown");
    let secondFrame = null;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        historySectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame !== null) window.cancelAnimationFrame(secondFrame);
    };
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
   * Keep the newest offer version as the single source of truth for the
   * summary/current status, but display every saved offer version in the
   * Negotiation History for a complete audit trail.
   */
  const latestOfferVersion = offerHistory[0] || null;
  const displayedOfferHistory = offerHistory;
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

  const approverSignatureUploaded = hasOfferApproverSignature({
    ...(offer || {}),
    offerVersions:
      loadedOfferVersions.length > 0
        ? loadedOfferVersions
        : offer?.offerVersions || offer?.offer_versions || [],
  });

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

    if (status === "Approved" && !approverSignatureUploaded) {
      const pipelineId =
        offer.candidatePipelineId ||
        offer.candidate_pipeline_id ||
        offer.dbId ||
        offer.id;

      const currentVersionNumber = Math.max(
        Number(
          latestOfferVersion?.versionNumber ||
            latestOfferVersion?.version_number ||
            offer.offerVersion ||
            offer.offer_version ||
            1,
        ) || 1,
        1,
      );

      if (!pipelineId) {
        openStatusModal?.({
          type: "error",
          title: "Employment Offer Not Found",
          message:
            "The Candidate Pipeline record for this Employment Offer could not be found.",
        });
        return;
      }

      onClose?.();
      navigate(
        `/recruitment/offers/document/${encodeURIComponent(
          pipelineId,
        )}/${encodeURIComponent(
          currentVersionNumber,
        )}?approval=1`,
      );
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
      /*
       * Close Offer Details after a successful revised-offer submission.
       * The success modal is owned by OffersContext, so it remains visible
       * after this details modal is closed.
       *
       * Error paths intentionally do not close this modal so the user can
       * correct the values and try again.
       */
      onClose?.();
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
  const currentBasicDailyRate =
    latestOfferVersion?.basicDailyRate ?? offer.basicPay;
  const currentDailyDeMinimis =
    latestOfferVersion?.dailyDeMinimis ?? offer.deminimisDailyRate;
  const currentTotalDailyRate =
    latestOfferVersion?.totalDailyRate ??
    Number(currentBasicDailyRate || 0) + Number(currentDailyDeMinimis || 0);
  const currentRoleTitle = latestOfferVersion?.roleTitle || offer.roleTitle || "—";
  const currentAccount = latestOfferVersion?.account || offer.account || "—";
  const currentOwner = getOfferOwnerDisplay(latestOfferVersion || {}, offer);
  const candidateEmail =
    offer.candidateEmail || offer.email || latestOfferVersion?.candidateEmail || "—";
  const candidatePhone =
    offer.candidatePhone ||
    offer.phone ||
    offer.contactNumber ||
    offer.contact_number ||
    "—";
  const departmentName =
    offer.department ||
    offer.departmentName ||
    offer.department_name ||
    offer.offerDetails?.department ||
    "";
  const requisitionId =
    offer.requisitionId ||
    offer.requisition_id ||
    offer.hiringRequirementId ||
    offer.hiring_requirement_id ||
    "—";
  function normalizeBenefitList(value) {
    if (Array.isArray(value)) {
      return value.map((item) => cleanText(item?.label || item?.name || item)).filter(Boolean);
    }
    const text = cleanText(value);
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => cleanText(item?.label || item?.name || item))
          .filter(Boolean);
      }
    } catch {
      // Keep plain-text benefits compatible with older offer records.
    }
    return text
      .split(/[,\n]+/)
      .map((item) => cleanText(item))
      .filter(Boolean);
  }
  const benefitList = normalizeBenefitList(
    latestOfferVersion?.benefits ||
      latestOfferVersion?.offerBenefits ||
      offer.benefits ||
      offer.offerBenefits ||
      offer.offer_benefits ||
      offer.offerDetails?.benefits,
  );
  const rawApprovers = Array.isArray(latestOfferVersion?.approvers)
    ? latestOfferVersion.approvers
    : Array.isArray(offer.approvers)
      ? offer.approvers
      : Array.isArray(offer.approvalUsers)
        ? offer.approvalUsers
        : Array.isArray(offer.approval_users)
          ? offer.approval_users
          : [];
  const approvalRows = rawApprovers.length
    ? rawApprovers.map((approver, index) => ({
        id: approver.id || approver.userId || approver.user_id || `approver-${index}`,
        name:
          cleanText(
            approver.name ||
              approver.fullName ||
              approver.full_name ||
              approver.displayName ||
              approver.display_name ||
              approver.approverName ||
              approver.approver_name,
          ) || "Approver",
        role:
          cleanText(
            approver.role ||
              approver.roleName ||
              approver.role_name ||
              approver.approverRole ||
              approver.approver_role,
          ) || "Approver",
        email: cleanText(approver.email || approver.userEmail || approver.user_email),
        status:
          cleanText(
            approver.status ||
              approver.decision ||
              approver.approvalStatus ||
              approver.approval_status,
          ) || "Pending",
        votedAt:
          approver.votedAt ||
          approver.voted_at ||
          approver.approvedAt ||
          approver.approved_at ||
          approver.rejectedAt ||
          approver.rejected_at ||
          "",
      }))
    : [
        {
          id: "latest-approval",
          name:
            cleanText(
              latestOfferVersion?.approvedBy ||
                latestOfferVersion?.rejectedBy ||
                offer.approvedBy ||
                offer.rejectedBy ||
                currentOwner,
            ) || "Assigned Approver",
          role: "Approver",
          email: cleanText(
            latestOfferVersion?.approvedByEmail ||
              latestOfferVersion?.approved_by_email ||
              latestOfferVersion?.rejectedByEmail ||
              latestOfferVersion?.rejected_by_email ||
              offer.approverEmail ||
              offer.approver_email,
          ),
          status: approvalStatus,
          votedAt:
            latestOfferVersion?.approvedAt ||
            latestOfferVersion?.rejectedAt ||
            offer.approvedAt ||
            offer.rejectedAt ||
            "",
        },
      ];
  const currentPdfVersion =
    displayedOfferHistory.find(
      (version) => version?.pdfAvailable || version?.pdfFilename || version?.pdf_filename,
    ) || null;
  function openEmploymentOfferPdf(version = currentPdfVersion) {
    const pipelineId =
      offer.candidatePipelineId ||
      offer.candidate_pipeline_id ||
      offer.dbId ||
      offer.id;
    if (!pipelineId || !version?.versionNumber) return;
    setEmploymentOfferPreview({
      open: true,
      filename:
        version.pdfFilename ||
        version.pdf_filename ||
        `Employment Offer Version ${version.versionNumber}.pdf`,
      requestUrl: `/api/candidate-pipeline/${encodeURIComponent(
        pipelineId,
      )}/offer-versions/${encodeURIComponent(version.versionNumber)}/pdf`,
    });
  }
  function getApprovalRowTone(status = "") {
    const key = cleanText(status).toLowerCase();
    if (key.includes("approved") || key.includes("accepted")) {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    if (key.includes("reject") || key.includes("declin")) {
      return "border-red-200 bg-red-50 text-red-700";
    }
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return (
    <>
      <div
        className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[12000] flex h-dvh items-center justify-center bg-slate-950/50 p-2 backdrop-blur-[2px] sm:p-4 font-jakarta"
        onClick={handleClose}
      >
        <div
          className="sibs-modal-pop-in flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[14px] border border-sibs-border bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] font-jakarta 2xl:max-w-6xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-sibs-navy px-5 py-4 text-white sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-white/15 bg-white/10 text-sibs-orange">
                <FileText size={19} />
              </span>
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h2 className="truncate text-base font-extrabold tracking-tight text-white sm:text-lg">
                    {offer.candidateName || "Offer Details"}
                  </h2>
                  {offer.offerId ? (
                    <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white/80">
                      {offer.offerId}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-semibold text-white/65 sm:text-xs">
                  <span>{currentRoleTitle}</span>
                  <span className="text-white/30">•</span>
                  <span>Candidate ID: {offer.candidateId || "—"}</span>
                  {offer.hiringRequirementId ? (
                    <>
                      <span className="text-white/30">•</span>
                      <span>Hiring Requirement: {offer.hiringRequirementId}</span>
                    </>
                  ) : null}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isBusy}
              className="sibs-modal-close-btn"
              aria-label="Close offer details"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex shrink-0 flex-col gap-2 border-b border-sibs-border bg-slate-50 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex min-w-0 items-center gap-4 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveDetailsTab("breakdown")}
                className={`whitespace-nowrap border-b-2 py-3 text-[11px] font-extrabold transition sm:text-xs ${
                  activeDetailsTab === "breakdown"
                    ? "border-sibs-orange text-sibs-navy"
                    : "border-transparent text-sibs-muted hover:text-slate-600"
                }`}
              >
                Compensation & Approval Breakdown
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailsTab("contract")}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 py-3 text-[11px] font-extrabold transition sm:text-xs ${
                  activeDetailsTab === "contract"
                    ? "border-sibs-orange text-sibs-navy"
                    : "border-transparent text-sibs-muted hover:text-slate-600"
                }`}
              >
                <FileText size={14} />
                Generated Contract Document
              </button>
            </div>
            <div className="flex items-center gap-2 pb-2 sm:pb-0">
              <span className="text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                Consensus:
              </span>
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getStatusClass(
                  approvalStatus,
                )}`}
              >
                {approvalStatus}
              </span>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-5 2xl:p-6">
            {activeDetailsTab === "breakdown" ? (
              <div className="space-y-4 2xl:space-y-5">
                <section className="rounded-[14px] border border-sibs-border bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-3 border-b border-sibs-border pb-2.5">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-navy">
                      Candidate & Requisition Profile
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-x-8 gap-y-1.5 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] items-start gap-3 text-xs">
                        <span className="font-medium text-sibs-muted">Candidate Name:</span>
                        <span className="text-right font-extrabold text-sibs-navy">{offer.candidateName || "—"}</span>
                      </div>
                      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] items-start gap-3 text-xs">
                        <span className="font-medium text-sibs-muted">Email Address:</span>
                        <span className="break-all text-right font-semibold text-sibs-navy">{candidateEmail}</span>
                      </div>
                      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] items-start gap-3 text-xs">
                        <span className="font-medium text-sibs-muted">Phone Contact:</span>
                        <span className="text-right font-extrabold text-sibs-navy tabular-nums">{candidatePhone}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] items-start gap-3 text-xs">
                        <span className="font-medium text-sibs-muted">Position Title:</span>
                        <span className="text-right font-extrabold text-sibs-navy">{currentRoleTitle}</span>
                      </div>
                      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] items-start gap-3 text-xs">
                        <span className="font-medium text-sibs-muted">Account / Department:</span>
                        <span className="text-right font-extrabold text-sibs-navy">
                          {currentAccount}
                          {departmentName ? ` (${departmentName})` : ""}
                        </span>
                      </div>
                      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] items-start gap-3 text-xs">
                        <span className="font-medium text-sibs-muted">Requisition ID:</span>
                        <span className="text-right font-extrabold text-sibs-navy">{requisitionId}</span>
                      </div>
                    </div>
                  </div>
                </section>
                <section className="rounded-[14px] border border-sibs-border bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-3 flex flex-col gap-2 border-b border-sibs-border pb-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-navy">
                      Compensation & Benefits Breakdown
                    </h3>
                    <span className="w-fit rounded-[10px] border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-extrabold text-sibs-navy tabular-nums">
                      Total Value: {formatCurrency(currentTotalDailyRate)} / day
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[10px] border border-sibs-border bg-slate-50 p-3.5">
                      <p className="text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                        Basic Daily Rate
                      </p>
                      <p className="mt-1 text-lg font-extrabold text-sibs-navy tabular-nums">
                        {getRateDisplay(currentBasicDailyRate)}
                      </p>
                    </div>
                    <div className="rounded-[10px] border border-sibs-border bg-slate-50 p-3.5">
                      <p className="text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                        Daily De Minimis
                      </p>
                      <p className="mt-1 text-lg font-extrabold text-sibs-navy tabular-nums">
                        {getRateDisplay(currentDailyDeMinimis)}
                      </p>
                    </div>
                  </div>
                  {benefitList.length ? (
                    <div className="mt-3">
                      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
                        Contract Perks & Benefits:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {benefitList.map((benefit, index) => (
                          <span
                            key={`${benefit}-${index}`}
                            className="inline-flex items-center gap-1 rounded-[10px] border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800"
                          >
                            <Check size={12} className="text-emerald-600" />
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
                <section className="rounded-[14px] border border-sibs-border bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-3 flex flex-col gap-2 border-b border-sibs-border pb-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-sibs-navy">
                      <ShieldCheck size={14} className="text-sibs-orange" />
                      Multi-User Approval Workflow Matrix
                    </h3>
                    <span className="text-[10px] font-medium italic text-sibs-muted">
                      Consensus: All configured votes required
                    </span>
                  </div>
                  <div className="space-y-2">
                    {approvalRows.map((approver) => (
                      <div
                        key={approver.id}
                        className="flex flex-col gap-3 rounded-[10px] border border-sibs-border bg-slate-50 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-extrabold text-sibs-navy">{approver.name}</p>
                            <span className="rounded-[10px] bg-slate-200/60 px-2 py-0.5 text-[9px] font-extrabold text-sibs-navy">
                              {approver.role}
                            </span>
                          </div>
                          {approver.email ? (
                            <p className="mt-1 truncate text-[10px] font-semibold text-sibs-muted">
                              {approver.email}
                            </p>
                          ) : null}
                        </div>
                        <div className="shrink-0 text-left sm:text-right">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getApprovalRowTone(
                              approver.status,
                            )}`}
                          >
                            <Check size={12} />
                            {approver.status}
                          </span>
                          {approver.votedAt ? (
                            <p className="mt-1 text-[9px] font-semibold text-sibs-muted">
                              {formatOfferVersionDate(approver.votedAt)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                {canSubmitRevision ? (
                  <section className="rounded-[14px] border border-amber-200 bg-amber-50 p-4 shadow-sm sm:p-5">
                    <h3 className="text-sm font-extrabold text-amber-900">
                      Candidate Requested Negotiation
                    </h3>
                    <p className="mt-2 rounded-[10px] border border-amber-200 bg-white p-3 text-xs font-semibold leading-5 text-amber-900">
                      {negotiationMessage || "No negotiation message was saved."}
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
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
                          onChange={(event) => setRevisedBasicPay(event.target.value)}
                          placeholder="Enter new basic daily rate"
                          className="mt-1.5 h-10 w-full rounded-[10px] border border-sibs-border bg-white px-3 text-xs font-bold text-sibs-navy outline-none transition [appearance:textfield] placeholder:text-slate-400 focus:border-sibs-orange focus:ring-4 focus:ring-sibs-orange/10 disabled:cursor-not-allowed disabled:bg-slate-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </label>
                      <label className="text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
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
                          onChange={(event) => setRevisedDeminimis(event.target.value)}
                          placeholder="Enter new daily de minimis"
                          className="mt-1.5 h-10 w-full rounded-[10px] border border-sibs-border bg-white px-3 text-xs font-bold text-sibs-navy outline-none transition [appearance:textfield] placeholder:text-slate-400 focus:border-sibs-orange focus:ring-4 focus:ring-sibs-orange/10 disabled:cursor-not-allowed disabled:bg-slate-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </label>
                    </div>
                    <label className="mt-3 block text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                      Internal Remarks
                      <textarea
                        rows={3}
                        value={revisedRemarks}
                        disabled={isBusy}
                        onChange={(event) => setRevisedRemarks(event.target.value)}
                        className="mt-1.5 w-full resize-none rounded-[10px] border border-sibs-border bg-white p-3 text-xs font-semibold leading-5 text-sibs-navy outline-none transition focus:border-sibs-orange focus:ring-4 focus:ring-sibs-orange/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={submitRevision}
                      className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-sibs-navy px-4 text-xs font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingRevision ? <Loader2 size={15} className="animate-spin" /> : null}
                      {savingRevision ? "Submitting..." : "Submit New Offer for Approval"}
                    </button>
                  </section>
                ) : null}
                <section className="rounded-[14px] border border-sibs-border bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-3 border-b border-sibs-border pb-2.5">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-navy">
                      Evaluation Results
                    </h3>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
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
                <section
                  ref={historySectionRef}
                  className="scroll-mt-5 rounded-[14px] border border-sibs-border bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex flex-col gap-3 border-b border-sibs-border pb-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <History size={15} className="text-sibs-orange" />
                      <h3 className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-navy">
                        Negotiation History
                      </h3>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-extrabold text-sibs-navy">
                      {displayedOfferHistory.length} Offer Version
                      {displayedOfferHistory.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {loadingOfferHistory ? (
                    <div className="mt-4 space-y-3 animate-pulse">
                      <div className="h-4 w-1/3 rounded-full bg-slate-200" />
                      <div className="h-28 rounded-[10px] bg-slate-100" />
                    </div>
                  ) : null}
                  {!loadingOfferHistory && displayedOfferHistory.length === 0 ? (
                    <div className="mt-4 rounded-[10px] border border-dashed border-sibs-border bg-slate-50 px-5 py-8 text-center text-xs font-bold text-sibs-muted">
                      No offer versions are available yet.
                    </div>
                  ) : null}
                  <div className="mt-4 space-y-3">
                    {displayedOfferHistory.map((version, versionIndex) => {
                      const isCurrentVersion = versionIndex === 0;
                      return (
                        <article
                          key={`${version.id || "version"}-${version.versionNumber}`}
                          className="rounded-[10px] border border-sibs-border bg-slate-50 p-3.5"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-sibs-navy px-2.5 py-0.5 text-[9px] font-extrabold uppercase text-white">
                                  Offer Version {version.versionNumber || displayedOfferHistory.length - versionIndex}
                                </span>
                                <span
                                  className={`rounded-full border px-2.5 py-0.5 text-[9px] font-extrabold uppercase ${getVersionTone(
                                    version.approvalStatus,
                                  )}`}
                                >
                                  {version.approvalStatus || "For Review"}
                                </span>
                                <span className="text-[9px] font-extrabold uppercase text-sibs-muted">
                                  {isCurrentVersion ? "Current Offer" : "Previous Offer"}
                                </span>
                              </div>
                              <p className="mt-1.5 text-[10px] font-semibold text-sibs-muted">
                                Submitted: {formatOfferVersionDate(version.submittedAt)} · Submitted by: {getOfferOwnerDisplay(version, offer)}
                              </p>
                            </div>
                            <span className="w-fit rounded-full border border-sibs-border bg-white px-2.5 py-0.5 text-[9px] font-extrabold uppercase text-slate-600">
                              Candidate: {version.candidateResponse || "Pending"}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                          {(version.candidateMessage || version.internalRemarks) ? (
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-[10px] border border-amber-100 bg-amber-50 p-3">
                                <p className="text-[9px] font-extrabold uppercase tracking-wide text-amber-700">
                                  Candidate Remark
                                </p>
                                <p className="mt-1.5 whitespace-pre-wrap text-xs font-semibold leading-5 text-amber-900">
                                  {version.candidateMessage || "—"}
                                </p>
                              </div>
                              <div className="rounded-[10px] border border-blue-100 bg-blue-50 p-3">
                                <p className="text-[9px] font-extrabold uppercase tracking-wide text-sibs-navy">
                                  Internal Remark
                                </p>
                                <InternalRemarkContent value={version.internalRemarks} />
                              </div>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </section>
              </div>
            ) : (
              <div className="space-y-4">
                <section className="rounded-[14px] border border-sibs-border bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-sibs-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-sibs-navy">
                        Generated Contract Document
                      </h3>
                      <p className="mt-1 text-xs font-semibold leading-5 text-sibs-muted">
                        Employment Offer PDF generated from the current approved offer version.
                      </p>
                    </div>
                    <span className={`w-fit rounded-full border px-3 py-1 text-[10px] font-extrabold ${getStatusClass(approvalStatus)}`}>
                      {approvalStatus}
                    </span>
                  </div>
                  {currentPdfVersion ? (
                    <div className="mt-5 rounded-[14px] border border-sibs-border bg-slate-50 p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-sibs-navy text-sibs-orange">
                            <FileText size={20} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-extrabold text-sibs-navy">
                              {currentPdfVersion.pdfFilename ||
                                currentPdfVersion.pdf_filename ||
                                `Employment Offer Version ${currentPdfVersion.versionNumber}.pdf`}
                            </p>
                            <p className="mt-1 text-[10px] font-semibold text-sibs-muted">
                              Offer Version {currentPdfVersion.versionNumber} · {formatOfferVersionDate(currentPdfVersion.submittedAt)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openEmploymentOfferPdf(currentPdfVersion)}
                          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-sibs-navy px-4 text-xs font-extrabold text-white transition hover:opacity-90"
                        >
                          <FileText size={15} className="text-sibs-orange" />
                          Open Employment Offer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-[10px] border border-dashed border-sibs-border bg-slate-50 px-5 py-10 text-center">
                      <FileText size={30} className="mx-auto text-sibs-muted" />
                      <p className="mt-3 text-sm font-extrabold text-sibs-navy">No generated contract PDF yet</p>
                      <p className="mt-1 text-xs font-semibold text-sibs-muted">
                        The document will appear here once an Employment Offer PDF is generated for an offer version.
                      </p>
                    </div>
                  )}
                </section>
                {displayedOfferHistory.filter(
                  (version) => version?.pdfAvailable || version?.pdfFilename || version?.pdf_filename,
                ).length > 1 ? (
                  <section className="rounded-[14px] border border-sibs-border bg-white p-5 shadow-sm">
                    <div className="mb-3 border-b border-sibs-border pb-2.5">
                      <h3 className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-navy">
                        Previous Generated Documents
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {displayedOfferHistory
                        .filter(
                          (version) => version?.pdfAvailable || version?.pdfFilename || version?.pdf_filename,
                        )
                        .slice(1)
                        .map((version) => (
                          <button
                            key={`pdf-${version.versionNumber}`}
                            type="button"
                            onClick={() => openEmploymentOfferPdf(version)}
                            className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-sibs-border bg-slate-50 px-4 py-3 text-left transition hover:border-sibs-orange/40 hover:bg-white"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-extrabold text-sibs-navy">
                                {version.pdfFilename || version.pdf_filename || `Employment Offer Version ${version.versionNumber}.pdf`}
                              </span>
                              <span className="mt-0.5 block text-[10px] font-semibold text-sibs-muted">
                                Offer Version {version.versionNumber} · {formatOfferVersionDate(version.submittedAt)}
                              </span>
                            </span>
                            <FileText size={16} className="shrink-0 text-sibs-orange" />
                          </button>
                        ))}
                    </div>
                  </section>
                ) : null}
              </div>
            )}
          </div>
          <div className="shrink-0 border-t border-sibs-border bg-white px-5 py-3 sm:px-6 2xl:py-4">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                disabled={isBusy}
                className="inline-flex h-10 items-center justify-center rounded-[10px] border border-sibs-border bg-white px-4 text-xs font-extrabold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Close
              </button>
              {canReviewOffer ? (
                <>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleOfferApproval("Rejected")}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-red-200 bg-red-50 px-4 text-xs font-extrabold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-sibs-navy px-4 text-xs font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {approvalAction === "Approved" ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Check size={15} className="text-sibs-orange" />
                    )}
                    {approvalAction === "Approved" ? "Approving..." : "Approve"}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <EmploymentOfferPdfPreviewModal
        open={employmentOfferPreview.open}
        filename={employmentOfferPreview.filename}
        requestUrl={employmentOfferPreview.requestUrl}
        onClose={() =>
          setEmploymentOfferPreview({
            open: false,
            filename: "",
            requestUrl: "",
          })
        }
      />
    </>
  );
}
