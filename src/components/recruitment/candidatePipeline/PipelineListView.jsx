import React, { useMemo } from "react";
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
import { ArrowRight, CalendarDays, ClipboardCheck, Eye } from "lucide-react";
import CandidateAvatar from "./CandidateAvatar";

const PipelineListView = ({
  candidates,
  activeStage,
  onViewCandidate,
  onOpenMoveModal,
  onOpenAssessmentModal,
  onOpenScheduleModal,
  onCancelInterview,
  onCompleteInterview,
}) => {
  const visibleCandidates = useMemo(() => {
    if (activeStage === "All") return candidates;
    return candidates.filter(
      (candidate) => candidate.currentStage === activeStage,
    );
  }, [candidates, activeStage]);

  return (
    <div className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[1180px] w-full border-collapse">
          <thead>
            <tr className="border-b border-[#E6ECF2] bg-[#F8FAFC]">
              <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wide text-[#667085]">
                Candidate
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wide text-[#667085]">
                Stage
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wide text-[#667085]">
                Position / Account
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wide text-[#667085]">
                PRF
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wide text-[#667085]">
                Assessment
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wide text-[#667085]">
                Interview
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wide text-[#667085]">
                Owner
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-wide text-[#667085]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {visibleCandidates.length > 0 ? (
              visibleCandidates.map((candidate) => {
                const nextStage = getNextStage(candidate.currentStage);
                const interviewStatus = getDisplayInterviewStatus(candidate);
                const showAssessmentButton =
                  candidate.currentStage === "Online Assessment";
                const showScheduleButton =
                  candidate.currentStage === "Online Assessment" &&
                  canScheduleInterview(candidate);
                const showUpdateSchedule =
                  candidate.currentStage === "Interview Scheduled";
                const showMoveButton =
                  candidate.currentStage !== "Drop-off" &&
                  candidate.currentStage !== "Accepted" &&
                  candidate.currentStage !== "Online Assessment" &&
                  candidate.currentStage !== "Interview Scheduled" &&
                  candidate.currentStage !== "Offered" &&
                  Boolean(nextStage);

                return (
                  <tr
                    key={candidate.id}
                    className="border-b border-[#EEF2F6] transition hover:bg-[#F8FAFC]"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <CandidateAvatar candidate={candidate} />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onViewCandidate(candidate)}
                            className="block max-w-[230px] truncate text-left text-sm font-extrabold text-[#101828] transition hover:text-sibs-primary-1 hover:underline"
                          >
                            {candidate.name}
                          </button>
                          <p className="mt-0.5 max-w-[230px] truncate text-xs font-semibold text-[#667085]">
                            {candidate.email || "No email saved"}
                          </p>
                          <p className="mt-0.5 text-[11px] font-bold text-[#98A2B3]">
                            {candidate.candidateId ||
                              candidate.candidateApplicationId ||
                              "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStageClass(
                          candidate.currentStage,
                        )}`}
                      >
                        {candidate.currentStage}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <p className="max-w-[220px] truncate text-sm font-bold text-[#344054]">
                        {getRoleTitle(candidate.roleAccount) ||
                          "Not assigned yet"}
                      </p>
                      <p className="mt-0.5 max-w-[220px] truncate text-xs font-semibold text-[#667085]">
                        {getAccount(candidate.roleAccount) ||
                          "Not assigned yet"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPrfStatusClass(
                          candidate.prfStatus || "Review",
                        )}`}
                      >
                        {candidate.prfStatus || "Review"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                          candidate.assessmentResult
                            ? getAssessmentResultClass(
                                candidate.assessmentResult,
                              )
                            : getAssessmentStatusClass(
                                candidate.assessmentStatus || "Not Take",
                              )
                        }`}
                      >
                        {candidate.assessmentResult ||
                          candidate.assessmentStatus ||
                          "Not Take"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-[#344054]">
                        {formatDateTime(candidate.interviewDate)}
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getInterviewStatusClass(
                          interviewStatus,
                        )}`}
                      >
                        {interviewStatus || "—"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <p className="max-w-[160px] truncate text-sm font-bold text-[#344054]">
                        {candidate.taOwner || candidate.owner || "—"}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-[#98A2B3]">
                        {candidate.dateMoved || candidate.updatedAt || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewCandidate(candidate)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white text-sibs-primary-1 transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>

                        {showAssessmentButton && (
                          <button
                            type="button"
                            onClick={() => onOpenAssessmentModal(candidate)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-100 bg-cyan-50 text-cyan-700 transition hover:-translate-y-0.5 hover:bg-cyan-100 hover:shadow-sm"
                            title="Update Assessment"
                          >
                            <ClipboardCheck size={15} />
                          </button>
                        )}

                        {showScheduleButton && (
                          <button
                            type="button"
                            onClick={() => onOpenScheduleModal(candidate)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm"
                            title="Schedule Interview"
                          >
                            <CalendarDays size={15} />
                          </button>
                        )}

                        {showUpdateSchedule && (
                          <>
                            <button
                              type="button"
                              onClick={() => onOpenScheduleModal(candidate)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm"
                              title="Update Interview Schedule"
                            >
                              <CalendarDays size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => onCancelInterview(candidate)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-sibs-primary-1 transition hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm"
                              title="Cancel Interview"
                            >
                              <X size={15} />
                            </button>

                            {candidate.interviewStatus !== "Completed" && (
                              <button
                                type="button"
                                onClick={() => onCompleteInterview(candidate)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-sm"
                                title="Mark Interview Completed"
                              >
                                <UserCheck size={15} />
                              </button>
                            )}
                          </>
                        )}

                        {showMoveButton && (
                          <button
                            type="button"
                            onClick={() => onOpenMoveModal(candidate)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white text-sibs-primary-1 transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm"
                            title={`Move to ${nextStage}`}
                          >
                            <ArrowRight size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-5 py-14 text-center">
                  <p className="text-sm font-extrabold text-[#98A2B3]">
                    No candidates found.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PipelineListView;
