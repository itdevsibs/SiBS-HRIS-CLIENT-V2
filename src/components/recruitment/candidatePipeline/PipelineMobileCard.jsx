import React from "react";
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  Mail,
  UserCheck,
  UserRound,
  X,
} from "lucide-react";
import { DataCard } from "@/components/ui";
import CandidateAvatar from "./CandidateAvatar";
import {
  canScheduleInterview,
  getAccount,
  getAssessmentResultClass,
  getAssessmentStatusClass,
  getDisplayInterviewStatus,
  getInterviewStatusClass,
  getNextStage,
  getPrfStatusClass,
  getRoleTitle,
  getStageClass,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";
import { formatDateTime } from "../../../lib/axios/dateFormatter";

function getCandidateActions(candidate) {
  const currentStage = candidate.currentStage || candidate.stage || "";
  const nextStage = getNextStage(currentStage);
  const showAssessmentButton = currentStage === "Online Assessment";
  const showScheduleButton =
    currentStage === "Assessment Fit" && canScheduleInterview(candidate);
  const showUpdateSchedule = currentStage === "Interview Scheduled";
  const showMoveButton =
    currentStage !== "Drop-off" &&
    currentStage !== "Accepted" &&
    currentStage !== "Online Assessment" &&
    currentStage !== "Assessment Fit" &&
    currentStage !== "Interview Scheduled" &&
    currentStage !== "Offered" &&
    Boolean(nextStage);

  return {
    nextStage,
    showAssessmentButton,
    showScheduleButton,
    showUpdateSchedule,
    showMoveButton,
  };
}

export default function PipelineMobileCard({
  candidate,
  index = 0,
  onViewCandidate,
  onOpenMoveModal,
  onOpenAssessmentModal,
  onOpenScheduleModal,
  onCancelInterview,
  onCompleteInterview,
}) {
  const currentStage =
    candidate.currentStage || candidate.stage || "Initial Screening";
  const interviewStatus = getDisplayInterviewStatus(candidate);
  const roleTitle = getRoleTitle(candidate.roleAccount);
  const account = getAccount(candidate.roleAccount);
  const candidateId =
    candidate.candidateId || candidate.candidateApplicationId || "—";
  const email = candidate.email;
  const owner = candidate.taOwner || candidate.owner || "Unassigned";

  const {
    nextStage,
    showAssessmentButton,
    showScheduleButton,
    showUpdateSchedule,
    showMoveButton,
  } = getCandidateActions(candidate);

  return (
    <DataCard
      interactive
      onClick={() => onViewCandidate?.(candidate)}
      aria-label={`View candidate ${candidate.name || "details"}`}
      style={{
        animationDelay: `${index * 35}ms`,
        animationFillMode: "both",
      }}
      className="font-jakarta"
    >
      <DataCard.Header
        avatar={<CandidateAvatar candidate={candidate} />}
        title={candidate.name || "Unnamed Candidate"}
        subtitle={
          <div className="mt-0.5 space-y-0.5">
            <span className="font-mono text-[10px] font-extrabold uppercase tracking-wide text-[#FF5C28]">
              {candidateId}
            </span>
            {email ? (
              <p className="flex items-center gap-1.5 truncate text-[11px] font-medium text-[#667085]">
                <Mail size={11} className="shrink-0 text-[#98A2B3]" />
                <span className="truncate">{email}</span>
              </p>
            ) : null}
          </div>
        }
        badge={
          <span
            className={`inline-flex max-w-[140px] shrink-0 items-center justify-center rounded-lg border px-2.5 py-1 text-center text-[10px] font-extrabold leading-4 ${getStageClass(
              currentStage,
            )}`}
          >
            <span className="truncate">{currentStage}</span>
          </span>
        }
      />

      <DataCard.ContextRow>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#8A98B8]">
            Position
          </p>
          <p className="mt-0.5 truncate text-xs font-bold text-[#042C51]">
            {roleTitle || "—"}
          </p>
        </div>
        <div className="min-w-0 flex-1 border-l border-[#E6ECF2] pl-2.5">
          <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#8A98B8]">
            Account
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold text-[#344054]">
            {account || "—"}
          </p>
        </div>
      </DataCard.ContextRow>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${getPrfStatusClass(
            candidate.prfStatus || "Review",
          )}`}
        >
          PRF: {candidate.prfStatus || "Review"}
        </span>

        <span
          className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${
            candidate.assessmentResult
              ? getAssessmentResultClass(candidate.assessmentResult)
              : getAssessmentStatusClass(
                  candidate.assessmentStatus || "Not Take",
                )
          }`}
        >
          Assessment: {candidate.assessmentResult || candidate.assessmentStatus || "Not Take"}
        </span>

        <span
          className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${getInterviewStatusClass(
            interviewStatus,
          )}`}
        >
          Interview: {interviewStatus || "—"}
        </span>

        {candidate.interviewDate && (
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700">
            <CalendarDays size={10} className="shrink-0 text-blue-600" />
            <span>{formatDateTime(candidate.interviewDate)}</span>
          </span>
        )}
      </div>

      <DataCard.Footer>
        <div className="flex w-full items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-[10px] font-semibold text-[#667085]">
              <UserRound size={11} className="shrink-0 text-[#98A2B3]" />
              <span className="truncate">TA: {owner}</span>
            </p>
            {(candidate.dateMoved || candidate.updatedAt) && (
              <p className="mt-0.5 truncate text-[9px] font-medium text-[#98A2B3]">
                Updated: {candidate.dateMoved || candidate.updatedAt}
              </p>
            )}
          </div>

          <div
            className="flex shrink-0 items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {showAssessmentButton && (
              <button
                type="button"
                onClick={() => onOpenAssessmentModal?.(candidate)}
                className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-cyan-200 bg-cyan-50 text-cyan-700 transition hover:bg-cyan-100 active:scale-95"
                title="Update Assessment"
                aria-label="Update Assessment"
              >
                <ClipboardCheck size={13} />
              </button>
            )}

            {showScheduleButton && (
              <button
                type="button"
                onClick={() => onOpenScheduleModal?.(candidate)}
                className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100 active:scale-95"
                title="Schedule Interview"
                aria-label="Schedule Interview"
              >
                <CalendarDays size={13} />
              </button>
            )}

            {showUpdateSchedule && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenScheduleModal?.(candidate)}
                  className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100 active:scale-95"
                  title="Update Interview Schedule"
                  aria-label="Update Interview Schedule"
                >
                  <CalendarDays size={13} />
                </button>

                {onCancelInterview && (
                  <button
                    type="button"
                    onClick={() => onCancelInterview?.(candidate)}
                    className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 active:scale-95"
                    title="Cancel Interview Schedule"
                    aria-label="Cancel Interview Schedule"
                  >
                    <X size={13} />
                  </button>
                )}

                {onCompleteInterview && (
                  <button
                    type="button"
                    onClick={() => onCompleteInterview?.(candidate)}
                    className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 active:scale-95"
                    title="Mark Interview Completed"
                    aria-label="Mark Interview Completed"
                  >
                    <UserCheck size={13} />
                  </button>
                )}
              </>
            )}

            {showMoveButton && (
              <button
                type="button"
                onClick={() => onOpenMoveModal?.(candidate)}
                className="inline-flex h-7.5 items-center gap-1 rounded-lg border border-[#D6E0EA] bg-white px-2 text-[10px] font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/35 hover:bg-[#FFF9F6] hover:text-[#FF5C28] active:scale-95"
                title={`Move to ${nextStage}`}
                aria-label={`Move to ${nextStage}`}
              >
                <span>Move</span>
                <ArrowRight size={11} />
              </button>
            )}
          </div>
        </div>
      </DataCard.Footer>
    </DataCard>
  );
}
