import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  X,
  UserX,
  Eye,
  CalendarDays,
  ClipboardCheck,
  Mail,
  ChevronDown,
  CirclePlay,
  UploadCloud,
  FileText,
} from "lucide-react";

import DetailRow from "../../layout/common/DetailRow";
import CandidateAvatar from "../../recruitment/candidatePipeline/CandidateAvatar";
import CandidateTalentPoolDetailsPanel from "../../recruitment/candidatePipeline/CandidateTalentPoolDetailsPanel";
import LeadPrfReviewCard from "../../recruitment/candidatePipeline/LeadPrfReviewCard";

import {
  offerApprovers,
  offerDecisionOptions,
} from "../../../lib/utils/candidatePipeline/candidatePipelineConstants";

import {
  formatDateTime,
  formatCurrency,
} from "../../../lib/utils/candidatePipeline/candidatePipelineFormatters";

import {
  getNextStage,
  hasInterviewSchedule,
  getAssessmentResult,
  getDisplayInterviewStatus,
  getDisplayInterviewType,
  canScheduleInterview,
  getStageClass,
  getPrfStatusClass,
  getInterviewStatusClass,
  getAssessmentResultClass,
  getOfferApprovalClass,
  getOfferDecisionClass,
  getOfferApprovalSummary,
  isOfferApproved,
  buildOfferContractLink,
  getUploadFileIcon,
  formatFileSize,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";

import { useNavigate } from "react-router-dom";
import { useCandidatePipeline } from "../../../services/context/CandidatePipelineContext";
import NhoUploadModal from "./NhoUploadModal";
import GetAssessmentTimelineFiles from "../../../lib/utils/candidatePipeline/react-utils/GetAssessmentTimelineFiles";

const PRE_EMPLOYMENT_REQUIREMENTS_TOTAL = 14;

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizePrfStatus(value) {
  const text = cleanText(value);

  if (!text) return "Review";

  const key = text.toLowerCase();

  if (
    key === "matched" ||
    key === "match" ||
    key === "prf matched" ||
    key === "approved"
  ) {
    return "Matched";
  }

  if (
    key === "not matched" ||
    key === "unmatched" ||
    key === "not_match" ||
    key === "not-match"
  ) {
    return "Not Matched";
  }

  if (
    key === "review" ||
    key === "for review" ||
    key === "pending" ||
    key === "prf review"
  ) {
    return "Review";
  }

  return text;
}

function getCurrentTimestamp() {
  return new Date().toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CandidatePipelineModal = ({
  open,
  candidate,
  onClose,
  onUpdatePrfStatus,
  onOpenScheduleModal,
  onOpenMoveModal,
  onOpenAssessmentModal,
  onOpenDropOffModal,
  onSendAssessmentEmail,
  onCancelInterview,
  onSendOfferEmail,
  onOfferDecision,
}) => {
  const [showTalentPoolDetails, setShowTalentPoolDetails] = useState(false);
  const [interviewNotesDraft, setInterviewNotesDraft] = useState("");
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [candidateFilesById, setCandidateFilesById] = useState({});
  const [localCandidate, setLocalCandidate] = useState(null);

  const { handleStartInterview, handleScheduleNhoAuto } =
    useCandidatePipeline();

  const navigate = useNavigate();

  useEffect(() => {
    setShowTalentPoolDetails(false);
    setInterviewNotesDraft(candidate?.interviewNotes || "");
    setShowFileUploadModal(false);
    setLocalCandidate(candidate || null);
  }, [
    candidate?.id,
    candidate?.candidateId,
    candidate?.candidateApplicationId,
    candidate?.prfStatus,
    candidate?.prf_status,
    candidate?.currentStage,
    open,
  ]);

  const activeCandidate = useMemo(() => {
    return {
      ...(candidate || {}),
      ...(localCandidate || {}),
    };
  }, [candidate, localCandidate]);

  const activePrfStatus = normalizePrfStatus(
    activeCandidate.prfStatus || activeCandidate.prf_status,
  );

  const candidateUploadKey =
    activeCandidate?.candidateId ||
    activeCandidate?.candidateApplicationId ||
    activeCandidate?.id;

  const candidateFiles = useMemo(() => {
    if (!candidateUploadKey) return [];
    return candidateFilesById[candidateUploadKey] || [];
  }, [candidateFilesById, candidateUploadKey]);

  const nhoUploadProgress = useMemo(() => {
    const uploadedRequirements = new Set(
      candidateFiles.map((file) => file?.requirement).filter(Boolean),
    );

    const completed = Math.min(
      uploadedRequirements.size || candidateFiles.length || 0,
      PRE_EMPLOYMENT_REQUIREMENTS_TOTAL,
    );

    const percent = PRE_EMPLOYMENT_REQUIREMENTS_TOTAL
      ? Math.round((completed / PRE_EMPLOYMENT_REQUIREMENTS_TOTAL) * 100)
      : 0;

    return {
      completed,
      total: PRE_EMPLOYMENT_REQUIREMENTS_TOTAL,
      percent,
      isComplete: percent >= 100,
    };
  }, [candidateFiles]);

  const latestUploadedFile = candidateFiles?.[0] || null;

  const candidateNhoUploadId =
    activeCandidate?.dbId ||
    activeCandidate?.id ||
    activeCandidate?.candidateId ||
    activeCandidate?.candidateApplicationId ||
    "";

  const previousEmploymentEnabledForUpload = Boolean(
    activeCandidate?.metadata?.previousEmploymentEnabled ||
      activeCandidate?.previousEmploymentEnabled ||
      activeCandidate?.nhoPreviousEmploymentEnabled,
  );

  const nhoScheduleDetails = useMemo(() => {
    const schedule = activeCandidate?.nhoSchedule || {};

    return {
      startDate:
        schedule.startDate ||
        schedule.date ||
        activeCandidate?.nhoStartDate ||
        activeCandidate?.nhoDate ||
        "",
      account:
        schedule.account ||
        activeCandidate?.nhoAccount ||
        activeCandidate?.offerDetails?.account ||
        activeCandidate?.roleAccount ||
        "—",
      trainer:
        schedule.trainer ||
        activeCandidate?.nhoTrainer ||
        activeCandidate?.trainer ||
        "—",
      updatedShiftSchedule:
        schedule.updatedShiftSchedule ||
        schedule.shiftSchedule ||
        activeCandidate?.updatedShiftSchedule ||
        activeCandidate?.nhoShiftSchedule ||
        "—",
      endorsementStatus:
        schedule.endorsementStatus ||
        activeCandidate?.endorsementStatus ||
        activeCandidate?.nhoEndorsementStatus ||
        "Pending",
      location:
        schedule.location ||
        activeCandidate?.nhoLocation ||
        activeCandidate?.workLocation ||
        "—",
      remarks: schedule.remarks || activeCandidate?.nhoRemarks || "",
      status:
        schedule.status ||
        activeCandidate?.nhoStatus ||
        (schedule.startDate ||
        schedule.date ||
        activeCandidate?.nhoStartDate ||
        activeCandidate?.nhoDate
          ? "Scheduled"
          : "Not Scheduled"),
    };
  }, [activeCandidate]);

  const hasNhoSchedule = useMemo(() => {
    return Boolean(
      nhoScheduleDetails.startDate && nhoScheduleDetails.startDate !== "—",
    );
  }, [nhoScheduleDetails]);

  if (!open || !candidate) return null;

  const nextStage = getNextStage(activeCandidate.currentStage);

  const isLeadStage = false;
  const isInitialScreening =
    activeCandidate.currentStage === "Initial Screening";
  const isOnlineAssessment =
    activeCandidate.currentStage === "Online Assessment";
  const isInterviewScheduled =
    activeCandidate.currentStage === "Interview Scheduled";
  const isOffered = activeCandidate.currentStage === "Offered";
  const isAccepted =
    activeCandidate.currentStage === "Accepted" ||
    activeCandidate.currentStage === "Accepted (For NHO)";
  const forNHO = activeCandidate.currentStage === "For NHO";

  const canShowNhoUploads = forNHO;

  const candidateHasSchedule = hasInterviewSchedule(activeCandidate);
  const modalStatus = getDisplayInterviewStatus(activeCandidate);
  const isInterviewInProgress =
    isInterviewScheduled && modalStatus === "Interview in Progress";

  async function handleLocalPrfStatusUpdate(firstArg, secondArg) {
    const nextPrfStatus =
      secondArg ||
      firstArg?.prfStatus ||
      firstArg?.prf_status ||
      firstArg ||
      "Review";

    const normalizedStatus = normalizePrfStatus(nextPrfStatus);

    const currentTimeline = Array.isArray(activeCandidate.timeline)
      ? activeCandidate.timeline
      : [];

    const movementReason =
      normalizedStatus === "Matched"
        ? "PRF status changed to Matched. Candidate is ready to move to Online Assessment."
        : `PRF status set to ${normalizedStatus}.`;

    const nextCandidate = {
      ...activeCandidate,
      ...(typeof firstArg === "object" && firstArg !== null ? firstArg : {}),
      prfStatus: normalizedStatus,
      prf_status: normalizedStatus,
      prfReviewed: normalizedStatus === "Matched",
      prf_reviewed: normalizedStatus === "Matched",
      prfReviewedAt:
        normalizedStatus === "Matched"
          ? new Date().toISOString()
          : activeCandidate.prfReviewedAt,
      prf_reviewed_at:
        normalizedStatus === "Matched"
          ? new Date().toISOString()
          : activeCandidate.prf_reviewed_at,
      currentStage: "Initial Screening",
      currentPipelineStage: "Initial Screening",
      pipelineStage: "Initial Screening",
      stage: "Initial Screening",
      reasonForMovement: movementReason,
      timeline: [
        ...currentTimeline,
        {
          stage: "Initial Screening",
          owner: "Current User",
          source: "PRF Review",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: `PRF Status: ${normalizedStatus}`,
        },
      ],
    };

    setLocalCandidate(nextCandidate);

    try {
      const response = await onUpdatePrfStatus?.(
        nextCandidate,
        normalizedStatus,
      );

      if (response === null || response?.success === false) {
        setLocalCandidate(activeCandidate);
      }

      return response;
    } catch (error) {
      console.error("Update PRF status from modal error:", error);
      setLocalCandidate(activeCandidate);
      return null;
    }
  }

  function handleMoveToNextStage() {
    const candidateForMove = {
      ...activeCandidate,
      prfStatus: activePrfStatus,
      prf_status: activePrfStatus,
      prfReviewed: activePrfStatus === "Matched",
      prf_reviewed: activePrfStatus === "Matched",
      currentStage: activeCandidate.currentStage || "Initial Screening",
      currentPipelineStage:
        activeCandidate.currentPipelineStage ||
        activeCandidate.currentStage ||
        "Initial Screening",
      pipelineStage:
        activeCandidate.pipelineStage ||
        activeCandidate.currentStage ||
        "Initial Screening",
      stage: activeCandidate.stage || activeCandidate.currentStage,
    };

    onOpenMoveModal?.(candidateForMove);
  }

  const handleSaveCandidateFiles = ({ files }) => {
    if (!candidateUploadKey) return;

    setCandidateFilesById((prev) => ({
      ...prev,
      [candidateUploadKey]: files || [],
    }));
  };

  const handleTagAsIncomplete = () => {
    onOpenMoveModal?.(
      {
        ...activeCandidate,
        requestedStage: "Incomplete Requirements",
        targetStage: "Incomplete Requirements",
        reasonForMovement:
          "Candidate has incomplete pre-employment requirements.",
      },
      "Incomplete Requirements",
    );
  };

  const handleMoveToOnboarding = () => {
    onOpenMoveModal?.(
      {
        ...activeCandidate,
        requestedStage: "Onboarding",
        targetStage: "Onboarding",
        reasonForMovement:
          "Candidate completed all pre-employment requirements and is ready for onboarding.",
      },
      "Onboarding",
    );
  };

  const handleScheduleNhoClick = async () => {
    await handleScheduleNhoAuto(activeCandidate);
    onClose?.();
  };

  const handleStartOrContinueInterview = async () => {
    if (!isInterviewInProgress) {
      await handleStartInterview(activeCandidate);
    }

    if (activeCandidate.onlineInterviewLink) {
      window.open(
        activeCandidate.onlineInterviewLink,
        "_blank",
        "noopener,noreferrer",
      );
    }

    onClose?.();

    const positionId =
      activeCandidate.positionId ||
      activeCandidate.finalInterviewPositionId ||
      activeCandidate.offerDetails?.positionId ||
      activeCandidate.hiringRequirementId ||
      "";

    const formId =
      activeCandidate.finalInterviewFormId ||
      (positionId ? `final-interview-${positionId}` : "");

    navigate(
      `/recruitment/final-interview-form?candidateId=${encodeURIComponent(
        activeCandidate.candidateId || "",
      )}&candidateApplicationId=${encodeURIComponent(
        activeCandidate.candidateApplicationId || activeCandidate.id || "",
      )}&positionId=${encodeURIComponent(positionId)}&formId=${encodeURIComponent(
        formId,
      )}`,
      {
        state: {
          candidate: activeCandidate,
        },
      },
    );
  };

  const uploadedFilesSection = (
    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-sibs-primary-1">
            Uploaded Pre-Employment Files
          </h3>

          <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-sibs-tertiary-5">
            View and upload candidate pre-employment files.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-white p-3">
        <div className="mb-2 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
          <span>Completion</span>
          <span>
            {nhoUploadProgress.completed} / {nhoUploadProgress.total}
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[#EEF4FA]">
          <div
            className="h-full rounded-full bg-sibs-primary-1 transition-all duration-300"
            style={{ width: `${nhoUploadProgress.percent}%` }}
          />
        </div>
      </div>

      {candidateFiles.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-[#C9D6E4] bg-white p-5 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#F8FAFC] text-sibs-primary-1 shadow-sm">
            <FileText size={22} />
          </div>

          <p className="mt-3 text-sm font-bold text-[#101828]">
            No uploaded files yet
          </p>

          <p className="mt-1 text-xs font-medium leading-5 text-[#667085]">
            Click Upload Files to add pre-employment requirements, contracts,
            COE, IDs, or supporting documents.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {candidateFiles.slice(0, 3).map((file) => {
            const Icon = getUploadFileIcon(file.fileName);

            return (
              <div
                key={file.id}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-[#E6ECF2] bg-white p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8FAFC] text-sibs-primary-1 shadow-sm">
                  <Icon size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    title={file.fileName}
                    className="truncate text-sm font-bold text-[#101828]"
                  >
                    {file.fileName}
                  </p>

                  <p
                    title={`${file.requirement || "Uploaded file"} • ${formatFileSize(
                      file.fileSize,
                    )}`}
                    className="mt-0.5 truncate text-xs font-medium text-[#667085]"
                  >
                    {file.requirement || "Uploaded file"} •{" "}
                    {formatFileSize(file.fileSize)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFileUploadModal(true)}
                  className="shrink-0 rounded-lg p-2 text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
                  title="View uploaded files"
                >
                  <Eye size={17} />
                </button>
              </div>
            );
          })}

          {candidateFiles.length > 3 && (
            <button
              type="button"
              onClick={() => setShowFileUploadModal(true)}
              className="inline-flex w-full items-center justify-center rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
            >
              View all {candidateFiles.length} uploaded files
            </button>
          )}
        </div>
      )}
    </div>
  );

  const nhoScheduleSection = (
    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-sibs-primary-1">
            NHO Schedule
          </h3>

          <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-sibs-tertiary-5">
            Review and manage the candidate’s new hire onboarding schedule.
          </p>
        </div>

        <span
          className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
            hasNhoSchedule
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {nhoScheduleDetails.status}
        </span>
      </div>

      {hasNhoSchedule ? (
        <>
          <div className="mt-4 rounded-xl bg-white p-4">
            <DetailRow
              label="Start Date"
              value={formatDateTime(nhoScheduleDetails.startDate) || "—"}
            />
            <DetailRow label="Account" value={nhoScheduleDetails.account} />
            <DetailRow label="Trainer" value={nhoScheduleDetails.trainer} />
            <DetailRow
              label="Updated Shift Schedule"
              value={nhoScheduleDetails.updatedShiftSchedule}
            />
            <DetailRow
              label="Endorsement Status"
              value={nhoScheduleDetails.endorsementStatus}
            />
            <DetailRow label="Location" value={nhoScheduleDetails.location} />
          </div>

          {nhoScheduleDetails.remarks && (
            <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-white p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Remarks
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-[#475467]">
                {nhoScheduleDetails.remarks}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-[#C9D6E4] bg-white p-5 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#F8FAFC] text-sibs-primary-1 shadow-sm">
            <CalendarDays size={22} />
          </div>

          <p className="mt-3 text-sm font-bold text-[#101828]">
            NHO schedule not set
          </p>

          <p className="mt-1 text-xs font-medium leading-5 text-[#667085]">
            Set the candidate’s start date, trainer, and schedule details for
            onboarding.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
        onClick={onClose}
      >
        <div
          className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
            <div>
              <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
                Candidate Pipeline Details
              </h2>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                View candidate movement, online assessment, and interview
                status.
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
            <div
              className={`grid grid-cols-1 gap-5 ${
                isLeadStage || isInitialScreening
                  ? ""
                  : "xl:grid-cols-[1fr_360px]"
              }`}
            >
              <div className="min-w-0 space-y-5">
                <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <CandidateAvatar candidate={activeCandidate} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="break-words text-xl font-bold text-[#101828]">
                            {activeCandidate.name}
                          </h3>

                          <p className="mt-1 break-words text-sm font-semibold text-sibs-tertiary-5">
                            {activeCandidate.email}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setShowTalentPoolDetails((prev) => !prev)
                          }
                          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                        >
                          Talent Details
                          <ChevronDown
                            size={16}
                            className={`transition-transform ${
                              showTalentPoolDetails ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStageClass(
                            activeCandidate.currentStage,
                          )}`}
                        >
                          {activeCandidate.currentStage}
                        </span>

                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPrfStatusClass(
                            activePrfStatus,
                          )}`}
                        >
                          PRF: {activePrfStatus}
                        </span>

                        {modalStatus && (
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getInterviewStatusClass(
                              modalStatus,
                            )}`}
                          >
                            {modalStatus}
                          </span>
                        )}

                        {!isLeadStage && activeCandidate.assessmentResult && (
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getAssessmentResultClass(
                              activeCandidate.assessmentResult,
                            )}`}
                          >
                            {activeCandidate.assessmentResult}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {showTalentPoolDetails && (
                  <CandidateTalentPoolDetailsPanel
                    candidate={activeCandidate}
                  />
                )}

                {isInitialScreening && (
                  <LeadPrfReviewCard
                    candidate={{
                      ...activeCandidate,
                      prfStatus: activePrfStatus,
                      prf_status: activePrfStatus,
                    }}
                    onUpdatePrfStatus={handleLocalPrfStatusUpdate}
                  />
                )}

                <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-[#101828]">
                    Movement Timeline
                  </h3>

                  <div className="mt-5 space-y-4">
                    {(activeCandidate.timeline || []).map((item, index) => {
                      const savedFormFullLink = item.savedFormLink
                        ? `${window.location.origin}${item.savedFormLink}`
                        : "";

                      return (
                        <div
                          key={`${item.stage}-${index}`}
                          className="flex min-w-0 gap-4"
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${getStageClass(
                              item.stage,
                            )}`}
                          >
                            {index + 1}
                          </div>

                          <div className="min-w-0 flex-1 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-[#101828]">
                                  {item.stage}
                                </p>
                                <p className="truncate text-xs font-semibold text-sibs-tertiary-5">
                                  {item.timestamp}
                                </p>
                              </div>

                              <span className="w-fit shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600">
                                {item.owner}
                              </span>
                            </div>

                            <p className="mt-3 text-sm leading-6 text-[#344054]">
                              {item.reason}
                            </p>

                            {item.remarks && (
                              <p className="mt-3 rounded-lg bg-white p-3 text-xs font-semibold leading-5 text-[#475467]">
                                {item.remarks}
                              </p>
                            )}

                            <GetAssessmentTimelineFiles
                              item={item}
                              candidate={activeCandidate}
                            />

                            {item.savedFormLink && (
                              <div className="mt-3">
                                <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                                  Job Evaluation Link
                                </p>

                                <button
                                  type="button"
                                  title={savedFormFullLink}
                                  onClick={() => {
                                    window.open(
                                      item.savedFormLink,
                                      "_blank",
                                      "noopener,noreferrer",
                                    );
                                  }}
                                  className="mt-2 block w-full min-w-0 truncate rounded-lg border border-blue-100 bg-white px-3 py-2 text-left text-xs font-semibold text-blue-600 underline transition hover:cursor-pointer hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                >
                                  {savedFormFullLink}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {isLeadStage && (
                  <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-[#101828]">
                      Reason for Movement
                    </h3>

                    <p className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]">
                      {activeCandidate.reasonForMovement || "—"}
                    </p>
                  </div>
                )}
              </div>

              {!isLeadStage && !isInitialScreening && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                    <h3 className="text-sm font-bold text-sibs-primary-1">
                      Online Assessment
                    </h3>

                    <div className="mt-4 rounded-xl bg-white p-4">
                      <DetailRow
                        label="Assessment Result"
                        value={getAssessmentResult(activeCandidate) || "—"}
                      />
                      <DetailRow
                        label="Email Sent"
                        value={
                          activeCandidate.assessmentEmailSent ? "Yes" : "No"
                        }
                      />
                      <DetailRow
                        label="Email Sent At"
                        value={activeCandidate.assessmentEmailSentAt}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                    <h3 className="text-sm font-bold text-[#101828]">
                      Interview Details
                    </h3>

                    <div className="mt-4 rounded-xl bg-white p-4">
                      <DetailRow
                        label="Candidate ID"
                        value={activeCandidate.candidateId}
                      />
                      <DetailRow
                        label="Role / Account"
                        value={activeCandidate.roleAccount}
                      />
                      <DetailRow
                        label="Interview Date"
                        value={formatDateTime(activeCandidate.interviewDate)}
                      />
                      <DetailRow
                        label="Interview Type"
                        value={getDisplayInterviewType(activeCandidate)}
                      />
                      <DetailRow
                        label="Interview Status"
                        value={getDisplayInterviewStatus(activeCandidate) || "—"}
                      />

                      <div className="mt-4 flex items-center justify-between gap-4 text-[12px]">
                        <span className="shrink-0 font-bold uppercase text-sibs-tertiary-5">
                          Interview Link
                        </span>

                        <span
                          title={activeCandidate.onlineInterviewLink}
                          className={`block max-w-[60%] min-w-0 overflow-hidden truncate text-right ${
                            activeCandidate.onlineInterviewLink
                              ? "text-blue-600 underline hover:cursor-pointer"
                              : "text-sm font-bold text-[#344054]"
                          }`}
                          onClick={() => {
                            if (activeCandidate.onlineInterviewLink) {
                              window.open(
                                activeCandidate.onlineInterviewLink,
                                "_blank",
                              );
                            }
                          }}
                        >
                          <span className="inline-block max-w-full overflow-hidden truncate align-bottom">
                            {activeCandidate.onlineInterviewLink || "—"}
                          </span>
                        </span>
                      </div>

                      {activeCandidate.interviewStatus === "Cancelled" && (
                        <DetailRow
                          label="Cancellation Reason"
                          value={activeCandidate.cancellationReason || "—"}
                        />
                      )}
                    </div>

                    {isInterviewScheduled && candidateHasSchedule && (
                      <div className="mt-4 grid grid-cols-1 gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenScheduleModal(activeCandidate)}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                        >
                          <CalendarDays size={16} />
                          Update Interview Schedule
                        </button>

                        <button
                          type="button"
                          onClick={() => onCancelInterview(activeCandidate)}
                          className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-red-100 bg-red-50 text-sm font-bold text-sibs-primary-1 transition hover:bg-red-100"
                        >
                          Cancel Interview
                        </button>
                      </div>
                    )}
                  </div>

                  {(isOffered || isAccepted || forNHO) && (
                    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                      <h3 className="text-sm font-bold text-sibs-primary-1">
                        Offer and Approval
                      </h3>

                      <div className="mt-4 rounded-xl bg-white p-4">
                        <DetailRow
                          label="Offer Role"
                          value={
                            activeCandidate.offerDetails?.roleTitle ||
                            activeCandidate.roleTitle
                          }
                        />
                        <DetailRow
                          label="Hiring Requirement"
                          value={
                            activeCandidate.offerDetails?.hiringRequirementId ||
                            activeCandidate.hiringRequirementId
                          }
                        />
                        <DetailRow
                          label="Final Role"
                          value={
                            activeCandidate.offerDetails?.roleTitle ||
                            activeCandidate.roleTitle
                          }
                        />
                        <DetailRow
                          label="Final Account"
                          value={activeCandidate.offerDetails?.account}
                        />
                        <DetailRow
                          label="Basic Pay"
                          value={formatCurrency(
                            activeCandidate.offerDetails?.basicPay,
                          )}
                        />
                        <DetailRow
                          label="Deminimis / Daily Rate"
                          value={formatCurrency(
                            activeCandidate.offerDetails?.deminimisDailyRate,
                          )}
                        />
                        <DetailRow
                          label="Approval Status"
                          value={
                            activeCandidate.offerApprovalStatus ||
                            getOfferApprovalSummary(activeCandidate)
                          }
                        />
                        <DetailRow
                          label="Offer Email Sent"
                          value={activeCandidate.offerEmailSent ? "Yes" : "No"}
                        />
                        <DetailRow
                          label="Candidate Response"
                          value={activeCandidate.offerDecision || "—"}
                        />
                      </div>

                      {isOffered && (
                        <p className="mt-4 rounded-xl border border-blue-100 bg-white p-4 text-sm font-semibold leading-6 text-sibs-primary-1">
                          Offer approval is managed in the Offers page. Once
                          Raul Nadela and Haasanor approve, TA/user can send or
                          manually open the offer email here.
                        </p>
                      )}

                      {isOffered && (
                        <div className="mt-4 space-y-4">
                          {(() => {
                            const approvedBy = offerApprovers.filter(
                              (approver) => {
                                const approval =
                                  activeCandidate.offerApprovals?.[approver];
                                return approval?.status === "Approved";
                              },
                            );

                            const isRejected = offerApprovers.some(
                              (approver) => {
                                const approval =
                                  activeCandidate.offerApprovals?.[approver];
                                return approval?.status === "Rejected";
                              },
                            );

                            const approvalStatus =
                              activeCandidate.offerApprovalStatus ||
                              getOfferApprovalSummary(activeCandidate);

                            return (
                              <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                                      Offer Approval
                                    </p>

                                    <h4 className="mt-1 text-base font-extrabold text-[#101828]">
                                      {approvalStatus === "Approved"
                                        ? "Offer Approved"
                                        : isRejected
                                          ? "Offer Rejected"
                                          : "For Review"}
                                    </h4>
                                  </div>

                                  <span
                                    className={`w-fit rounded-full border px-3 py-1 text-xs font-extrabold ${getOfferApprovalClass(
                                      approvalStatus || "For Review",
                                    )}`}
                                  >
                                    {approvalStatus || "For Review"}
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
                                </div>

                                {approvalStatus !== "Approved" &&
                                  !isRejected && (
                                    <p className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm font-semibold leading-6 text-sibs-primary-1">
                                      Offer is still for review. The email
                                      button will be enabled once all required
                                      approvals are completed in the Offers
                                      page.
                                    </p>
                                  )}

                                {isRejected && (
                                  <p className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-600">
                                    Offer approval was rejected. Please review
                                    the approval details in the Offers page.
                                  </p>
                                )}
                              </div>
                            );
                          })()}

                          {isOfferApproved(activeCandidate) &&
                            !activeCandidate.offerEmailSent && (
                              <button
                                type="button"
                                onClick={() =>
                                  onSendOfferEmail(activeCandidate)
                                }
                                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 text-sm font-bold text-white transition hover:opacity-90"
                              >
                                <Mail size={16} />
                                Send Offer Email to Candidate
                              </button>
                            )}

                          {isOfferApproved(activeCandidate) && (
                            <button
                              type="button"
                              onClick={() =>
                                window.open(
                                  buildOfferContractLink(activeCandidate),
                                  "_blank",
                                  "noopener,noreferrer",
                                )
                              }
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                            >
                              <Eye size={16} />
                              Open Candidate Offer Link Manually
                            </button>
                          )}

                          {activeCandidate.offerEmailSent && (
                            <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
                              <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                                Candidate Offer Response
                              </p>
                              <p className="mt-2 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                                Use these buttons only when the candidate cannot
                                access the email link or TA needs to record the
                                response manually.
                              </p>
                              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                {offerDecisionOptions.map((decision) => (
                                  <button
                                    key={decision}
                                    type="button"
                                    onClick={() =>
                                      onOfferDecision(activeCandidate, decision)
                                    }
                                    className={`inline-flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-bold transition ${getOfferDecisionClass(
                                      decision,
                                    )}`}
                                  >
                                    {decision}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {(isAccepted || forNHO) && nhoScheduleSection}

                  {canShowNhoUploads && uploadedFilesSection}
                </div>
              )}
            </div>

            <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#101828]">
                Reason for Movement
              </h3>

              <p className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]">
                {activeCandidate.reasonForMovement || "—"}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
            <div className="flex flex-col justify-end gap-2 sm:flex-row">
              {activeCandidate.currentStage !== "Drop-off" && (
                <button
                  type="button"
                  onClick={() => onOpenDropOffModal(activeCandidate)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-500 transition hover:bg-red-100"
                >
                  <UserX size={16} />
                  Mark Drop-off
                </button>
              )}

              {canShowNhoUploads &&
                nhoUploadProgress.percent > 0 &&
                !nhoUploadProgress.isComplete && (
                  <button
                    type="button"
                    onClick={handleTagAsIncomplete}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 text-sm font-bold text-amber-700 transition hover:bg-amber-100"
                  >
                    <ClipboardCheck size={16} />
                    Tag as Incomplete
                  </button>
                )}

              {canShowNhoUploads && !nhoUploadProgress.isComplete && (
                <button
                  type="button"
                  onClick={() => setShowFileUploadModal(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
                >
                  <UploadCloud size={16} />
                  Upload Files
                </button>
              )}

              {canShowNhoUploads && nhoUploadProgress.isComplete && (
                <button
                  type="button"
                  onClick={handleMoveToOnboarding}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
                >
                  <ArrowRight size={16} />
                  Move to Onboarding
                </button>
              )}

              {isAccepted && (
                <button
                  type="button"
                  onClick={handleScheduleNhoClick}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
                >
                  <CalendarDays size={16} />
                  Schedule NHO
                </button>
              )}

              {isOnlineAssessment && (
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSendAssessmentEmail(activeCandidate)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cyan-100 bg-white px-5 text-sm font-bold text-cyan-700 transition hover:bg-cyan-50"
                  >
                    <Mail size={16} />
                    Resend Assessment Email
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenAssessmentModal(activeCandidate)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-bold text-white transition hover:bg-cyan-700"
                  >
                    <ClipboardCheck size={16} />
                    Update Assessment
                  </button>
                </div>
              )}

              {isOnlineAssessment && canScheduleInterview(activeCandidate) && (
                <button
                  type="button"
                  onClick={() => onOpenScheduleModal(activeCandidate)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
                >
                  <CalendarDays size={16} />
                  Schedule Interview
                </button>
              )}

              {isInterviewScheduled && candidateHasSchedule && (
                <button
                  type="button"
                  onClick={handleStartOrContinueInterview}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
                >
                  <CirclePlay size={16} />
                  {isInterviewInProgress
                    ? "Continue Interview"
                    : "Start Interview"}
                </button>
              )}

              {!isLeadStage &&
                !isInitialScreening &&
                !isOnlineAssessment &&
                !isInterviewScheduled &&
                !isOffered &&
                !isAccepted &&
                !forNHO &&
                nextStage && (
                  <button
                    type="button"
                    onClick={handleMoveToNextStage}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
                  >
                    <ArrowRight size={16} />
                    Move to {nextStage}
                  </button>
                )}

              {isInitialScreening && nextStage && (
                <button
                  type="button"
                  onClick={handleMoveToNextStage}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
                >
                  <ArrowRight size={16} />
                  Move to Online Assessment
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {canShowNhoUploads && (
        <NhoUploadModal
          open={showFileUploadModal}
          onClose={() => setShowFileUploadModal(false)}
          candidateId={candidateNhoUploadId}
          candidateName={activeCandidate?.name || "Candidate"}
          candidateEmail={activeCandidate?.email || ""}
          initialFiles={candidateFiles}
          currentFile={latestUploadedFile}
          previousEmploymentEnabled={previousEmploymentEnabledForUpload}
          onSave={handleSaveCandidateFiles}
        />
      )}
    </>
  );
};

export default CandidatePipelineModal;