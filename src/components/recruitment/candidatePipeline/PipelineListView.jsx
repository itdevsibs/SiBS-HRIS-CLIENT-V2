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
      className="sibs-page-card-in flex min-h-full flex-1 flex-col space-y-0"
      style={{ animationDelay: "240ms", animationFillMode: "both" }}
    >
      <PipelineStageTabs
        activeTab={selectedTab}
        onChange={setSelectedTab}
        counts={tabCounts}
      />

      <div className="rounded-b-2xl border border-[#E6ECF2] bg-white p-4 shadow-xs sm:p-5 2xl:p-6">
        {!visibleCandidates.length ? (
          <div className="sibs-empty-panel">
            <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-center text-[#667085]">
              <UsersRound size={34} className="text-[#C8D3DF]" />
              <p className="text-sm font-extrabold text-[#042C51]">
                No candidates found in {selectedTab}
              </p>
              <p className="text-xs font-semibold">
                There are currently no candidate records matching the selected stage and search filters.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Card List View */}
            <div className="space-y-3 lg:hidden">
              {visibleCandidates.map((candidate, index) => {
                const currentStage = candidate.currentStage || candidate.stage || "Initial Screening";
                const interviewStatus = getDisplayInterviewStatus(candidate);

                return (
                  <article
                    key={candidate.id || `${candidate.name}-${index}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => openCandidate(candidate)}
                    onKeyDown={(event) => handleRowKeyDown(event, candidate)}
                    className="sibs-page-card-in cursor-pointer rounded-2xl border border-[#D7DEE8] bg-white p-4 shadow-sm outline-none transition hover:-translate-y-0.5 hover:border-[#FF5C28]/35 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#FF5C28]/25"
                    style={{
                      animationDelay: `${index * 40}ms`,
                      animationFillMode: "both",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <CandidateAvatar candidate={candidate} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate sibs-text-sm font-extrabold text-[#042C51]">
                          {candidate.name}
                        </p>
                        <p className="mt-0.5 truncate sibs-text-xs font-semibold text-[#667085]">
                          {candidate.email || "No email saved"}
                        </p>
                        <p className="mt-1 font-mono text-[9px] font-bold text-[#98A2B3]">
                          {candidate.candidateId ||
                            candidate.candidateApplicationId ||
                            "—"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-extrabold ${getStageClass(
                          currentStage,
                        )}`}
                      >
                        {currentStage}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="sibs-info-tile">
                        <p className="sibs-kicker">Position</p>
                        <p className="mt-1 truncate text-[11px] font-extrabold text-[#042C51]">
                          {getRoleTitle(candidate.roleAccount) ||
                            "Not assigned yet"}
                        </p>
                      </div>
                      <div className="sibs-info-tile">
                        <p className="sibs-kicker">Account</p>
                        <p className="mt-1 truncate text-[11px] font-extrabold text-[#042C51]">
                          {getAccount(candidate.roleAccount) ||
                            "Not assigned yet"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-full border px-2 py-1 text-[9px] font-extrabold ${getPrfStatusClass(
                          candidate.prfStatus || "Review",
                        )}`}
                      >
                        PRF: {candidate.prfStatus || "Review"}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-1 text-[9px] font-extrabold ${
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
                      <span
                        className={`rounded-full border px-2 py-1 text-[9px] font-extrabold ${getInterviewStatusClass(
                          interviewStatus,
                        )}`}
                      >
                        {interviewStatus || "—"}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#EEF2F6] pt-3">
                      <p className="truncate text-[10px] font-semibold text-[#667085]">
                        {candidate.taOwner ||
                          candidate.owner ||
                          "Unassigned owner"}
                      </p>
                      <PipelineActionButtons
                        candidate={candidate}
                        onOpenMoveModal={onOpenMoveModal}
                        onOpenAssessmentModal={onOpenAssessmentModal}
                        onOpenScheduleModal={onOpenScheduleModal}
                        onCancelInterview={onCancelInterview}
                        onCompleteInterview={onCompleteInterview}
                      />
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="sibs-data-table-shell hidden lg:block overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
              <div className="overflow-x-auto sibs-scrollbar">
                <table className="w-full min-w-[1180px] border-collapse">
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
                          className="sibs-data-table-th whitespace-nowrap px-3.5 2xl:px-4 py-2.5 2xl:py-3 text-left"
                        >
                          {heading}
                        </th>
                      ))}
                      <th className="sibs-data-table-th whitespace-nowrap px-3.5 2xl:px-4 py-2.5 2xl:py-3 text-right">
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
                          <td className="sibs-data-table-td px-3.5 2xl:px-4 py-2.5 2xl:py-3">
                            <div className="flex items-center gap-3">
                              <CandidateAvatar candidate={candidate} />
                              <div className="min-w-0">
                                <p className="max-w-[220px] truncate font-extrabold text-[#042C51]">
                                  {candidate.name}
                                </p>
                                <p className="mt-0.5 max-w-[220px] truncate text-[10px] font-semibold text-[#667085]">
                                  {candidate.email || "No email saved"}
                                </p>
                                <p className="mt-0.5 font-mono text-[9px] font-bold text-[#98A2B3]">
                                  {candidate.candidateId ||
                                    candidate.candidateApplicationId ||
                                    "—"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="sibs-data-table-td px-3.5 2xl:px-4 py-2.5 2xl:py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${getStageClass(
                                currentStage,
                              )}`}
                            >
                              {currentStage}
                            </span>
                          </td>

                          <td className="sibs-data-table-td px-3.5 2xl:px-4 py-2.5 2xl:py-3">
                            <p className="max-w-[210px] truncate font-extrabold text-[#344054]">
                              {getRoleTitle(candidate.roleAccount) ||
                                "Not assigned yet"}
                            </p>
                            <p className="mt-0.5 max-w-[210px] truncate text-[10px] font-semibold text-[#667085]">
                              {getAccount(candidate.roleAccount) ||
                                "Not assigned yet"}
                            </p>
                          </td>

                          <td className="sibs-data-table-td px-3.5 2xl:px-4 py-2.5 2xl:py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${getPrfStatusClass(
                                candidate.prfStatus || "Review",
                              )}`}
                            >
                              {candidate.prfStatus || "Review"}
                            </span>
                          </td>

                          <td className="sibs-data-table-td px-3.5 2xl:px-4 py-2.5 2xl:py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${
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

                          <td className="sibs-data-table-td px-3.5 2xl:px-4 py-2.5 2xl:py-3 whitespace-nowrap">
                            <p className="font-extrabold text-[#344054]">
                              {formatDateTime(candidate.interviewDate)}
                            </p>
                            <span
                              className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${getInterviewStatusClass(
                                interviewStatus,
                              )}`}
                            >
                              {interviewStatus || "—"}
                            </span>
                          </td>

                          <td className="sibs-data-table-td px-3.5 2xl:px-4 py-2.5 2xl:py-3 whitespace-nowrap">
                            <p className="max-w-[150px] truncate font-extrabold text-[#344054]">
                              {candidate.taOwner || candidate.owner || "—"}
                            </p>
                            <p className="mt-0.5 text-[9px] font-semibold text-[#98A2B3]">
                              {candidate.dateMoved ||
                                candidate.updatedAt ||
                                "—"}
                            </p>
                          </td>

                          <td className="sibs-data-table-td px-3.5 2xl:px-4 py-2.5 2xl:py-3 text-right whitespace-nowrap">
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
          </>
        )}
      </div>
    </div>
  );
};

export default PipelineListView;
