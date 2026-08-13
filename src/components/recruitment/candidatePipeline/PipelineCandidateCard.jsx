import React from "react";
import {
  canScheduleInterview,
  getDisplayInterviewStatus,
  getDisplayInterviewType,
  getNextStage,
  getRoleTitle,
  getPipelineAccountLabel,
  getPipelineAccountValue,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";
import CandidateAvatar from "./CandidateAvatar";
import {
  ArrowRight,
  CalendarDays,
  CirclePlay,
  ClipboardCheck,
  Eye,
  GripVertical,
  Mail,
  X,
} from "lucide-react";
import { formatDateTime } from "../../../lib/axios/dateFormatter";
import { useNavigate } from "react-router-dom";
import { useCandidatePipeline } from "../../../services/context/CandidatePipelineContext";


function getReferencePrfStatusClass(value = "Review") {
  const normalized = String(value || "Review").trim().toLowerCase();

  if (normalized === "matched") {
    return "border-emerald-600 bg-emerald-600 text-white";
  }

  if (normalized === "not matched" || normalized === "unmatched") {
    return "border-rose-600 bg-rose-600 text-white";
  }

  return "border-amber-500 bg-amber-500 text-white";
}

function getCompactStatusTextClass(value = "") {
  const normalized = String(value || "").trim().toLowerCase();

  if (
    normalized.includes("fit") ||
    normalized.includes("taken") ||
    normalized.includes("completed") ||
    normalized.includes("passed")
  ) {
    return "text-emerald-700";
  }

  if (
    normalized.includes("scheduled") ||
    normalized.includes("progress") ||
    normalized.includes("assessment")
  ) {
    return "text-sky-700";
  }

  if (
    normalized.includes("cancel") ||
    normalized.includes("failed") ||
    normalized.includes("not fit")
  ) {
    return "text-red-600";
  }

  return "text-[#475467]";
}

const PipelineCandidateCard = ({
  candidate,
  accountLabel = "Initial Account",
  onViewCandidate,
  onOpenMoveModal,
  onOpenAssessmentModal,
  onOpenScheduleModal,
  onCancelInterview,
}) => {
  const { handleStartInterview, handleResendDropOffEmail } =
    useCandidatePipeline();

  const nextStage = getNextStage(candidate.currentStage);
  const navigate = useNavigate();

  const latestTimeline =
    Array.isArray(candidate.timeline) && candidate.timeline.length
      ? candidate.timeline[candidate.timeline.length - 1]
      : null;

  const assessmentLabel =
    candidate.assessmentResult || candidate.assessmentStatus || "Not Taken";

  const interviewStatus = getDisplayInterviewStatus(candidate);

  const showScheduleButton =
    candidate.currentStage === "Assessment Fit" && canScheduleInterview(candidate);
  const showAssessmentButton = candidate.currentStage === "Online Assessment";
  const showUpdateSchedule = candidate.currentStage === "Interview Scheduled";

  const showMoveButton =
    candidate.currentStage !== "Drop-off" &&
    candidate.currentStage !== "Accepted" &&
    candidate.currentStage !== "Online Assessment" &&
    candidate.currentStage !== "Assessment Fit" &&
    candidate.currentStage !== "Interview Scheduled" &&
    candidate.currentStage !== "Offered" &&
    Boolean(nextStage);

  const isInterviewInProgress =
    candidate.currentStage === "Interview Scheduled" &&
    interviewStatus === "Interview in Progress";

  const disabledActionClass =
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none";

  const isDropOff = candidate.currentStage === "Drop-off";
  const dropOffEmailStatus =
    candidate.dropOffEmailStatus ||
    candidate.drop_off_email_status ||
    "Not Sent";
  const dropOffEmailRecipient =
    candidate.dropOffEmailRecipient ||
    candidate.drop_off_email_recipient ||
    candidate.email ||
    "No email saved";
  const dropOffEmailLastActivity =
    candidate.dropOffEmailSentAt ||
    candidate.drop_off_email_sent_at ||
    candidate.dropOffEmailLastAttemptAt ||
    candidate.drop_off_email_last_attempt_at;
  const dropOffEmailStatusClass =
    dropOffEmailStatus === "Sent"
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : dropOffEmailStatus === "Failed"
        ? "border-red-100 bg-red-50 text-red-700"
        : dropOffEmailStatus === "Missing Email"
          ? "border-amber-100 bg-amber-50 text-amber-700"
          : "border-gray-200 bg-gray-50 text-gray-600";

  const resolvedAccountLabel = getPipelineAccountLabel(candidate) || accountLabel;

  function openCandidate() {
    onViewCandidate?.(candidate);
  }

  function handleCardKeyDown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openCandidate();
  }

  function stopActionPropagation(event) {
    event.stopPropagation();
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openCandidate}
      onKeyDown={handleCardKeyDown}
      aria-label={`Open Candidate Pipeline record for ${candidate.name || "candidate"}`}
      className="group cursor-pointer overflow-hidden rounded-xl border border-[#D7DEE8] bg-white p-3 font-jakarta shadow-[0_3px_9px_rgba(4,44,81,0.04)] outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-[#042C51]/25 hover:shadow-[0_8px_18px_rgba(4,44,81,0.08)] focus-visible:border-[#FF5C28]/50 focus-visible:ring-2 focus-visible:ring-[#FF5C28]/20"
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex min-w-0 flex-1 items-start gap-1.5">
          <GripVertical
            size={12}
            className="mt-0.5 shrink-0 text-[#C5D2E0] transition-colors group-hover:text-[#94A9C1]"
            aria-hidden="true"
          />

          <div className="min-w-0 flex-1">
            <h3
              title={candidate.name || "Unnamed candidate"}
              className="truncate text-[11px] font-extrabold uppercase leading-[1.4] text-[#042C51]"
            >
              {candidate.name || "Unnamed candidate"}
            </h3>
            <p
              title={candidate.email || "No email saved"}
              className="mt-0.5 truncate text-[9px] font-semibold text-[#91A4BE]"
            >
              {candidate.email || "No email saved"}
            </p>
          </div>
        </div>

        <CandidateAvatar candidate={candidate} />
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span
          title={`Acquisition source: ${candidate.source || "Pipeline"}`}
          className="inline-flex max-w-[120px] truncate rounded-md border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 text-[8.5px] font-extrabold uppercase tracking-tight text-blue-700"
        >
          {candidate.source || "Pipeline"}
        </span>

        <span
          title={`PRF status: ${candidate.prfStatus || "Review"}`}
          className={`inline-flex max-w-[118px] truncate rounded-md border px-2 py-0.5 text-[8.5px] font-extrabold uppercase tracking-tight ${getReferencePrfStatusClass(candidate.prfStatus || "Review")}`}
        >
          {candidate.prfStatus || "Review"}
        </span>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-lg border border-[#E9EEF4] bg-[#F8FAFC] px-2.5 py-2.5">
        <div className="min-w-0 border-r border-[#E1E8F0] pr-2">
          <p className="text-[8px] font-extrabold uppercase tracking-wide text-[#91A4BE]">
            Position
          </p>
          <p
            title={
              getRoleTitle(candidate.roleAccount) ||
              candidate.roleTitle ||
              candidate.currentAppliedRole ||
              "Not assigned yet"
            }
            className="mt-0.5 truncate text-[10px] font-extrabold text-[#042C51]"
          >
            {getRoleTitle(candidate.roleAccount) ||
              candidate.roleTitle ||
              candidate.currentAppliedRole ||
              "Not assigned yet"}
          </p>
        </div>

        <div className="min-w-0 pl-0.5">
          <p className="truncate text-[8px] font-extrabold uppercase tracking-wide text-[#91A4BE]">
            {resolvedAccountLabel}
          </p>
          <p
            title={getPipelineAccountValue(candidate) || "Not assigned yet"}
            className="mt-0.5 truncate text-[10px] font-extrabold text-[#042C51]"
          >
            {getPipelineAccountValue(candidate) || "Not assigned yet"}
          </p>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-1.5">
        <div
          title={`Assessment Status: ${assessmentLabel}`}
          className="flex min-w-0 items-center justify-between gap-1.5 truncate rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-2 py-1.5"
        >
          <span className="shrink-0 text-[7.5px] font-extrabold uppercase tracking-tight text-[#91A4BE]">
            Assess
          </span>
          <span
            className={`min-w-0 truncate text-[8.5px] font-extrabold ${getCompactStatusTextClass(
              assessmentLabel,
            )}`}
          >
            {assessmentLabel}
          </span>
        </div>

        <div
          title={`Interview Status: ${interviewStatus || "Pending"}`}
          className="flex min-w-0 items-center justify-between gap-1.5 truncate rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-2 py-1.5"
        >
          <span className="shrink-0 text-[7.5px] font-extrabold uppercase tracking-tight text-[#91A4BE]">
            Interview
          </span>
          <span
            className={`min-w-0 truncate text-[8.5px] font-extrabold ${getCompactStatusTextClass(
              interviewStatus,
            )}`}
          >
            {interviewStatus || "Pending"}
          </span>
        </div>
      </div>

      {candidate.interviewDate && (
        <div className="mt-2.5 rounded-lg border border-sky-100 bg-sky-50/70 px-2.5 py-2">
          <p className="flex items-center gap-1.5 text-[9px] font-extrabold text-[#042C51]">
            <CalendarDays size={12} className="text-[#FF5C28]" />
            {formatDateTime(candidate.interviewDate)}
          </p>
          <p className="mt-0.5 text-[8.5px] font-semibold text-[#667085]">
            {getDisplayInterviewType(candidate)}
          </p>
        </div>
      )}

      {isDropOff && (
        <div className="mt-2.5 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[8px] font-extrabold uppercase tracking-wide text-[#667085]">
              Email Notification
            </p>
            <span
              className={`rounded-full border px-2 py-0.5 text-[8px] font-extrabold ${dropOffEmailStatusClass}`}
            >
              {dropOffEmailStatus}
            </span>
          </div>
          <p className="mt-1 truncate text-[8.5px] font-semibold text-[#667085]">
            {dropOffEmailRecipient}
          </p>
          {dropOffEmailLastActivity && (
            <p className="mt-1 text-[8px] font-semibold text-[#98A2B3]">
              {formatDateTime(dropOffEmailLastActivity)}
            </p>
          )}
        </div>
      )}

      {latestTimeline?.reason && (
        <p
          title={latestTimeline.reason}
          className="mt-2.5 truncate rounded-lg border border-[#E9EEF4] bg-[#F8FAFC] px-2.5 py-1.5 text-[9px] font-semibold text-[#667085]"
        >
          <span className="mr-1 font-extrabold text-[#A5B4C5]">•</span>
          {latestTimeline.reason}
        </p>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[#E9EEF4] pt-2.5">
        <p
          title={candidate.candidateId || candidate.candidateApplicationId || "—"}
          className="min-w-0 max-w-[118px] truncate font-mono text-[8px] font-bold text-[#91A4BE]"
        >
          {candidate.candidateId || candidate.candidateApplicationId || "—"}
        </p>

        <div
          className="flex shrink-0 items-center gap-1"
          onClick={stopActionPropagation}
          onKeyDown={stopActionPropagation}
        >
          <button
            type="button"
            onClick={() => onViewCandidate?.(candidate)}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[#D6DEE8] bg-white text-[#042C51] transition hover:-translate-y-0.5 hover:border-[#042C51]/35 hover:bg-[#F8FAFC]"
            title="View Details"
            aria-label="View Details"
          >
            <Eye size={12} />
          </button>

          {isDropOff && (
            <button
              type="button"
              onClick={() => handleResendDropOffEmail(candidate)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-blue-100 bg-blue-50 text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100"
              title="Resend Drop-off Email"
              aria-label="Resend Drop-off Email"
            >
              <Mail size={12} />
            </button>
          )}

          {showAssessmentButton && (
            <button
              type="button"
              disabled={isInterviewInProgress}
              onClick={() => {
                if (isInterviewInProgress) return;
                onOpenAssessmentModal(candidate);
              }}
              className={`inline-flex h-6 w-6 items-center justify-center rounded-md border border-cyan-100 bg-cyan-50 text-cyan-700 transition hover:-translate-y-0.5 hover:bg-cyan-100 ${disabledActionClass}`}
              title="Update Assessment"
              aria-label="Update Assessment"
            >
              <ClipboardCheck size={12} />
            </button>
          )}

          {showScheduleButton && (
            <button
              type="button"
              disabled={isInterviewInProgress}
              onClick={() => {
                if (isInterviewInProgress) return;
                onOpenScheduleModal(candidate);
              }}
              className={`inline-flex h-6 w-6 items-center justify-center rounded-md border border-blue-100 bg-blue-50 text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100 ${disabledActionClass}`}
              title="Schedule Interview"
              aria-label="Schedule Interview"
            >
              <CalendarDays size={12} />
            </button>
          )}

          {showUpdateSchedule && (
            <>
              <button
                type="button"
                disabled={isInterviewInProgress}
                onClick={() => {
                  if (isInterviewInProgress) return;
                  onOpenScheduleModal(candidate);
                }}
                className={`inline-flex h-6 w-6 items-center justify-center rounded-md border border-blue-100 bg-blue-50 text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100 ${disabledActionClass}`}
                title="Update Interview Schedule"
                aria-label="Update Interview Schedule"
              >
                <CalendarDays size={12} />
              </button>

              <button
                type="button"
                disabled={isInterviewInProgress}
                onClick={() => {
                  if (isInterviewInProgress) return;
                  onCancelInterview(candidate);
                }}
                className={`inline-flex h-6 w-6 items-center justify-center rounded-md border border-red-100 bg-red-50 text-red-600 transition hover:-translate-y-0.5 hover:bg-red-100 ${disabledActionClass}`}
                title="Cancel Interview"
                aria-label="Cancel Interview"
              >
                <X size={12} />
              </button>

              {candidate.interviewStatus !== "Completed" && (
                <button
                  type="button"
                  disabled={isInterviewInProgress}
                  onClick={() => {
                    if (isInterviewInProgress) return;

                    handleStartInterview(candidate);

                    const positionId =
                      candidate.positionId ||
                      candidate.finalInterviewPositionId ||
                      candidate.offerDetails?.positionId ||
                      candidate.hiringRequirementId ||
                      "";

                    const formId =
                      candidate.finalInterviewFormId ||
                      (positionId ? `final-interview-${positionId}` : "");

                    navigate(
                      `/recruitment/final-interview-form?candidateId=${encodeURIComponent(
                        candidate.candidateId || "",
                      )}&candidateApplicationId=${encodeURIComponent(
                        candidate.candidateApplicationId || candidate.id || "",
                      )}&positionId=${encodeURIComponent(positionId)}&formId=${encodeURIComponent(
                        formId,
                      )}`,
                      {
                        state: {
                          candidate,
                        },
                      },
                    );
                  }}
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#042C51] text-white transition hover:-translate-y-0.5 hover:bg-[#063C69] ${disabledActionClass}`}
                  title="Start Interview"
                  aria-label="Start Interview"
                >
                  <CirclePlay size={12} />
                </button>
              )}
            </>
          )}

          {showMoveButton && (
            <button
              type="button"
              disabled={isInterviewInProgress}
              onClick={() => {
                if (isInterviewInProgress) return;
                onOpenMoveModal(candidate);
              }}
              className={`inline-flex h-6 items-center justify-center gap-0.5 rounded-md bg-[#FF5C28] px-2 text-[8.5px] font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#E94F1F] ${disabledActionClass}`}
              title={`Move to ${nextStage}`}
              aria-label={`Move to ${nextStage}`}
            >
              <span>Advance</span>
              <ArrowRight size={10} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default PipelineCandidateCard;
