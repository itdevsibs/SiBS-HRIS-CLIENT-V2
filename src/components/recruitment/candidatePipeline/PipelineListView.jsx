import React, { useMemo, useState } from "react";
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
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  UserCheck,
  X,
  UsersRound,
} from "lucide-react";
import CandidateAvatar from "./CandidateAvatar";
import PipelineStageTabs, { PIPELINE_STAGE_TABS } from "./PipelineStageTabs";
import { DataCard, ResponsiveTableShell } from "@/components/ui";
import PipelineMobileCard from "./PipelineMobileCard";

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

function PipelineActionButtons({
  candidate,
  onOpenMoveModal,
  onOpenAssessmentModal,
  onOpenScheduleModal,
  onCancelInterview,
  onCompleteInterview,
}) {
  const {
    nextStage,
    showAssessmentButton,
    showScheduleButton,
    showUpdateSchedule,
    showMoveButton,
  } = getCandidateActions(candidate);

  return (
    <div
      className="flex flex-wrap items-center justify-end gap-1.5"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {showAssessmentButton && (
        <button
          type="button"
          onClick={() => onOpenAssessmentModal?.(candidate)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-100 bg-cyan-50 text-cyan-700 transition hover:-translate-y-0.5 hover:bg-cyan-100 hover:shadow-sm"
          title="Update Assessment"
          aria-label="Update Assessment"
        >
          <ClipboardCheck size={14} />
        </button>
      )}

      {showScheduleButton && (
        <button
          type="button"
          onClick={() => onOpenScheduleModal?.(candidate)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm"
          title="Schedule Interview"
          aria-label="Schedule Interview"
        >
          <CalendarDays size={14} />
        </button>
      )}

      {showUpdateSchedule && (
        <>
          <button
            type="button"
            onClick={() => onOpenScheduleModal?.(candidate)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm"
            title="Update Interview Schedule"
            aria-label="Update Interview Schedule"
          >
            <CalendarDays size={14} />
          </button>

          {onCancelInterview && (
            <button
              type="button"
              onClick={() => onCancelInterview?.(candidate)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm"
              title="Cancel Interview Schedule"
              aria-label="Cancel Interview Schedule"
            >
              <X size={14} />
            </button>
          )}

          {onCompleteInterview && (
            <button
              type="button"
              onClick={() => onCompleteInterview?.(candidate)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-sm"
              title="Mark Interview Completed"
              aria-label="Mark Interview Completed"
            >
              <UserCheck size={14} />
            </button>
          )}
        </>
      )}

      {showMoveButton && (
        <button
          type="button"
          onClick={() => onOpenMoveModal?.(candidate)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6E0EA] bg-white text-[#042C51] transition hover:-translate-y-0.5 hover:border-[#FF5C28]/35 hover:bg-[#FFF9F6] hover:text-[#FF5C28] hover:shadow-sm"
          title={`Move to ${nextStage}`}
          aria-label={`Move to ${nextStage}`}
        >
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

const PipelineListView = ({
  candidates = [],
  dropOffCandidates = [],
  activeStage = "All",
  onViewCandidate,
  onOpenMoveModal,
  onOpenAssessmentModal,
  onOpenScheduleModal,
  onCancelInterview,
  onCompleteInterview,
}) => {
  const [selectedTab, setSelectedTab] = useState(PIPELINE_STAGE_TABS.ALL);

  const tabCounts = useMemo(() => {
    const list = Array.isArray(candidates) ? candidates : [];
    const dropList = Array.isArray(dropOffCandidates) ? dropOffCandidates : [];

    return {
      [PIPELINE_STAGE_TABS.ALL]: list.length,
      [PIPELINE_STAGE_TABS.INITIAL_SCREENING]: list.filter(
        (c) => (c.currentStage || c.stage) === "Initial Screening",
      ).length,
      [PIPELINE_STAGE_TABS.ONLINE_ASSESSMENT]: list.filter(
        (c) => (c.currentStage || c.stage) === "Online Assessment",
      ).length,
      [PIPELINE_STAGE_TABS.ASSESSMENT_FIT]: list.filter(
        (c) => (c.currentStage || c.stage) === "Assessment Fit",
      ).length,
      [PIPELINE_STAGE_TABS.INTERVIEW_SCHEDULED]: list.filter(
        (c) => (c.currentStage || c.stage) === "Interview Scheduled",
      ).length,
      [PIPELINE_STAGE_TABS.INTERVIEWED]: list.filter(
        (c) => (c.currentStage || c.stage) === "Interviewed",
      ).length,
      [PIPELINE_STAGE_TABS.OFFERED]: list.filter(
        (c) => (c.currentStage || c.stage) === "Offered",
      ).length,
      [PIPELINE_STAGE_TABS.ACCEPTED]: list.filter(
        (c) => (c.currentStage || c.stage) === "Accepted",
      ).length,
      [PIPELINE_STAGE_TABS.FOR_NHO]: list.filter(
        (c) => (c.currentStage || c.stage) === "For NHO",
      ).length,
      [PIPELINE_STAGE_TABS.DROP_OFF]: dropList.length,
    };
  }, [candidates, dropOffCandidates]);

  const visibleCandidates = useMemo(() => {
    if (selectedTab === PIPELINE_STAGE_TABS.DROP_OFF) {
      return Array.isArray(dropOffCandidates) ? dropOffCandidates : [];
    }

    const list = Array.isArray(candidates) ? candidates : [];

    if (selectedTab === PIPELINE_STAGE_TABS.ALL) {
      return list;
    }

    return list.filter(
      (candidate) => (candidate.currentStage || candidate.stage) === selectedTab,
    );
  }, [candidates, dropOffCandidates, selectedTab]);

  function openCandidate(candidate) {
    onViewCandidate?.(candidate);
  }

  function handleRowKeyDown(event, candidate) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openCandidate(candidate);
  }

  return (
    <div
      className="sibs-page-card-in flex min-h-full flex-1 flex-col space-y-0 overflow-hidden rounded-xl border border-sibs-border bg-white shadow-xs"
      style={{ animationDelay: "240ms", animationFillMode: "both" }}
    >
      <PipelineStageTabs
        activeTab={selectedTab}
        onChange={setSelectedTab}
        counts={tabCounts}
      />

      <div className="p-4 sm:p-5 2xl:p-6">
        {!visibleCandidates.length ? (
          <DataCard.Empty
            icon={<UsersRound size={28} />}
            title={`No candidates found in ${selectedTab}`}
            description="There are currently no candidate records matching the selected stage and search filters."
          />
        ) : (
          <ResponsiveTableShell
            mobileContent={
              <div className="space-y-3">
                {visibleCandidates.map((candidate, index) => (
                  <PipelineMobileCard
                    key={candidate.id || `${candidate.name}-${index}`}
                    candidate={candidate}
                    index={index}
                    onViewCandidate={openCandidate}
                    onOpenMoveModal={onOpenMoveModal}
                    onOpenAssessmentModal={onOpenAssessmentModal}
                    onOpenScheduleModal={onOpenScheduleModal}
                    onCancelInterview={onCancelInterview}
                    onCompleteInterview={onCompleteInterview}
                  />
                ))}
              </div>
            }
            desktopContent={
              <div className="sibs-data-table-shell overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
                <div className="overflow-x-auto sibs-scrollbar">
                  <table className="w-full min-w-[1080px] 2xl:min-w-[1180px] border-collapse">
                  <thead className="sibs-data-table-head bg-[#F8FAFC]">
                    <tr className="sibs-data-table-head-row">
                      {[
                        "Candidate",
                        "Stage",
                        "Position / Account",
                        "PRF",
                        "Assessment",
                        "Interview",
                        "Owner",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="sibs-data-table-th whitespace-nowrap px-2.5 2xl:px-3.5 py-2 2xl:py-2.5 text-left sibs-text-micro font-black uppercase tracking-wider text-sibs-navy"
                        >
                          {heading}
                        </th>
                      ))}
                      <th className="sibs-data-table-th whitespace-nowrap px-2.5 2xl:px-3.5 py-2 2xl:py-2.5 text-right sibs-text-micro font-black uppercase tracking-wider text-sibs-navy">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#F1F5F9]">
                    {visibleCandidates.map((candidate, index) => {
                      const currentStage =
                        candidate.currentStage ||
                        candidate.stage ||
                        "Initial Screening";
                      const interviewStatus =
                        getDisplayInterviewStatus(candidate);

                      return (
                        <tr
                          key={candidate.id || `${candidate.name}-${index}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => openCandidate(candidate)}
                          onKeyDown={(event) =>
                            handleRowKeyDown(event, candidate)
                          }
                          className="sibs-data-table-row sibs-page-card-in cursor-pointer transition hover:bg-[#F8FAFC]"
                          style={{
                            animationDelay: `${index * 35}ms`,
                            animationFillMode: "both",
                          }}
                        >
                          <td className="sibs-data-table-td px-2.5 2xl:px-3.5 py-2 2xl:py-2.5">
                            <div className="flex items-center gap-2.5">
                              <CandidateAvatar candidate={candidate} />
                              <div className="min-w-0">
                                <p className="max-w-[220px] truncate sibs-text-xs font-extrabold tracking-tight text-sibs-navy">
                                  {candidate.name}
                                </p>
                                <p className="mt-0.5 max-w-[220px] truncate text-[10px] font-semibold text-[#667085]">
                                  {candidate.email || "No email saved"}
                                </p>
                                <p className="mt-0.5 font-mono text-[10px] 2xl:text-[11px] font-semibold text-sibs-text-muted">
                                  {candidate.candidateId ||
                                    candidate.candidateApplicationId ||
                                    "—"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="sibs-data-table-td px-2.5 2xl:px-3.5 py-2 2xl:py-2.5 whitespace-nowrap">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[9px] font-extrabold ${getStageClass(
                                currentStage,
                              )}`}
                            >
                              {currentStage}
                            </span>
                          </td>

                          <td className="sibs-data-table-td px-2.5 2xl:px-3.5 py-2 2xl:py-2.5">
                            <p className="max-w-[210px] truncate sibs-text-xs font-bold text-sibs-navy">
                              {getRoleTitle(candidate.roleAccount) ||
                                ""}
                            </p>
                            <p className="mt-0.5 max-w-[210px] truncate text-[10px] font-semibold text-[#667085]">
                              {getAccount(candidate.roleAccount) ||
                                ""}
                            </p>
                          </td>

                          <td className="sibs-data-table-td px-2.5 2xl:px-3.5 py-2 2xl:py-2.5 whitespace-nowrap">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[9px] font-extrabold ${getPrfStatusClass(
                                candidate.prfStatus || "Review",
                              )}`}
                            >
                              {candidate.prfStatus || "Review"}
                            </span>
                          </td>

                          <td className="sibs-data-table-td px-2.5 2xl:px-3.5 py-2 2xl:py-2.5 whitespace-nowrap">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[9px] font-extrabold ${
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

                          <td className="sibs-data-table-td px-2.5 2xl:px-3.5 py-2 2xl:py-2.5 whitespace-nowrap">
                            <p className="sibs-text-xs font-bold text-sibs-navy">
                              {formatDateTime(candidate.interviewDate)}
                            </p>
                            <span
                              className={`mt-0.5 inline-flex rounded-full border px-2 py-0.5 text-[8.5px] font-extrabold ${getInterviewStatusClass(
                                interviewStatus,
                              )}`}
                            >
                              {interviewStatus || "—"}
                            </span>
                          </td>

                          <td className="sibs-data-table-td px-2.5 2xl:px-3.5 py-2 2xl:py-2.5 whitespace-nowrap">
                            <p className="max-w-[150px] truncate sibs-text-xs font-bold text-sibs-navy">
                              {candidate.taOwner || candidate.owner || "—"}
                            </p>
                            <p className="mt-0.5 text-[9px] font-semibold text-[#98A2B3]">
                              {candidate.dateMoved ||
                                candidate.updatedAt ||
                                "—"}
                            </p>
                          </td>

                          <td className="sibs-data-table-td px-2.5 2xl:px-3.5 py-2 2xl:py-2.5 text-right whitespace-nowrap">
                            <PipelineActionButtons
                              candidate={candidate}
                              onOpenMoveModal={onOpenMoveModal}
                              onOpenAssessmentModal={onOpenAssessmentModal}
                              onOpenScheduleModal={onOpenScheduleModal}
                              onCancelInterview={onCancelInterview}
                              onCompleteInterview={onCompleteInterview}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            }
          />
        )}
      </div>
    </div>
  );
};

export default PipelineListView;
