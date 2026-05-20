import React from "react";
import {
  canScheduleInterview,
  getAccount,
  getAssessmentResultClass,
  getAssessmentStatusClass,
  getDisplayInterviewStatus,
  getDisplayInterviewType,
  getInterviewStatusClass,
  getNextStage,
  getPrfStatusClass,
  getRoleTitle,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";
import CandidateAvatar from "./CandidateAvatar";
import { ArrowRight, CalendarDays, ClipboardCheck, Eye, UserCheck, X } from "lucide-react";
import { formatDateTime } from "../../../lib/axios/dateFormatter";

const PipelineCandidateCard = ({
  candidate,
  onViewCandidate,
  onOpenMoveModal,
  onOpenAssessmentModal,
  onOpenScheduleModal,
  onCancelInterview,
  onCompleteInterview,
}) => {
  const nextStage = getNextStage(candidate.currentStage);
  const latestTimeline =
    Array.isArray(candidate.timeline) && candidate.timeline.length
      ? candidate.timeline[candidate.timeline.length - 1]
      : null;
  const assessmentLabel =
    candidate.assessmentResult || candidate.assessmentStatus || "Not Take";
  const interviewStatus = getDisplayInterviewStatus(candidate);
  const showScheduleButton =
    candidate.currentStage === "Online Assessment" &&
    canScheduleInterview(candidate);
  const showAssessmentButton = candidate.currentStage === "Online Assessment";
  const showUpdateSchedule = candidate.currentStage === "Interview Scheduled";
  const showMoveButton =
    candidate.currentStage !== "Drop-off" &&
    candidate.currentStage !== "Accepted" &&
    candidate.currentStage !== "Online Assessment" &&
    candidate.currentStage !== "Interview Scheduled" &&
    candidate.currentStage !== "Offered" &&
    Boolean(nextStage);

  return (
    <article
      className="group overflow-hidden rounded-md border border-[#D6DEE8] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-sibs-primary-1/30 hover:shadow-md"
      onClick={() => onViewCandidate(candidate)}
    >
      <div className="px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-[13px] font-extrabold leading-5 text-[#102A43]">
              {candidate.name}
            </h3>
            <p className="mt-1 truncate text-[11px] font-semibold text-[#667085]">
              {candidate.email || "No email saved"}
            </p>
          </div>

          <CandidateAvatar candidate={candidate} />
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="inline-flex rounded-[4px] bg-blue-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-blue-700">
            {candidate.source || "Pipeline"}
          </span>
          <span
            className={`inline-flex rounded-[4px] border px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${getPrfStatusClass(candidate.prfStatus || "Review")}`}
          >
            {candidate.prfStatus || "Review"}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-md bg-[#F8FAFC] px-2 py-2">
            <p className="text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
              Position
            </p>
            <p className="mt-1 line-clamp-1 text-[11px] font-bold text-[#344054]">
              {getRoleTitle(candidate.roleAccount) || "Not assigned yet"}
            </p>
          </div>

          <div className="rounded-md bg-[#F8FAFC] px-2 py-2">
            <p className="text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
              Account
            </p>
            <p className="mt-1 line-clamp-1 text-[11px] font-bold text-[#344054]">
              {getAccount(candidate.roleAccount) || "Not assigned yet"}
            </p>
          </div>
        </div>

        <div className="mt-2 space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="font-bold text-[#667085]">Assessment</span>
            <span
              className={`max-w-[140px] truncate rounded-full border px-2 py-0.5 
                    text-[10px] font-bold
                    ${
                      candidate.assessmentResult
                        ? getAssessmentResultClass(candidate.assessmentResult)
                        : getAssessmentStatusClass(
                            candidate.assessmentStatus || "Not Take",
                          )
                    }`}
            >
              {assessmentLabel}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="font-bold text-[#667085]">Interview</span>
            <span
              className={`max-w-[140px] truncate rounded-full border px-2 py-0.5 
                text-[10px] font-bold ${getInterviewStatusClass(interviewStatus)}`}
            >
              {interviewStatus || "—"}
            </span>
          </div>
        </div>

        {candidate.interviewDate && (
          <div className="mt-3 rounded-md border border-sky-100 bg-sky-50 px-2 py-2">
            <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-sibs-primary-1">
              <CalendarDays size={13} />
              {formatDateTime(candidate.interviewDate)}
            </p>
            <p className="mt-1 text-[10px] font-bold text-[#667085]">
              {getDisplayInterviewType(candidate)}
            </p>
          </div>
        )}

        {latestTimeline?.reason && (
          <p className="mt-3 line-clamp-2 rounded-md bg-[#F8FAFC] px-2 py-2 text-[11px] font-semibold leading-5 text-[#667085]">
            {latestTimeline.reason}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#EEF2F6] pt-3">
          <p className="truncate text-[10px] font-bold text-[#98A2B3]">
            {candidate.candidateId || candidate.candidateApplicationId || "—"}
          </p>

          <div
            className="flex items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => onViewCandidate(candidate)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#D6DEE8] bg-white text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
              title="View Details"
            >
              <Eye size={14} />
            </button>

            {showAssessmentButton && (
              <button
                type="button"
                onClick={() => onOpenAssessmentModal(candidate)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-cyan-100 bg-cyan-50 text-cyan-700 transition hover:bg-cyan-100"
                title="Update Assessment"
              >
                <ClipboardCheck size={14} />
              </button>
            )}

            {showScheduleButton && (
              <button
                type="button"
                onClick={() => onOpenScheduleModal(candidate)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-blue-100 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                title="Schedule Interview"
              >
                <CalendarDays size={14} />
              </button>
            )}

            {showUpdateSchedule && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenScheduleModal(candidate)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-blue-100 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                  title="Update Interview Schedule"
                >
                  <CalendarDays size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onCancelInterview(candidate)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-100 bg-red-50 text-sibs-primary-1 transition hover:bg-red-100"
                  title="Cancel Interview"
                >
                  <X size={14} />
                </button>
                {candidate.interviewStatus !== "Completed" && (
                  <button
                    type="button"
                    onClick={() => onCompleteInterview(candidate)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-emerald-100 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                    title="Mark Interview Completed"
                  >
                    <UserCheck size={14} />
                  </button>
                )}
              </>
            )}

            {showMoveButton && (
              <button
                type="button"
                onClick={() => onOpenMoveModal(candidate)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#D6DEE8] bg-white text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
                title={`Move to ${nextStage}`}
              >
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default PipelineCandidateCard;
