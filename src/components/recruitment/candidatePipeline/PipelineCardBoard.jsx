import React, { useMemo, useRef, useState } from "react";
import { pipelineStages } from "../../../lib/utils/candidatePipeline/candidatePipelineConstants";
import { getPipelineStageTheme } from "../../../lib/utils/candidatePipeline/candidatePipelineStageThemes";
import PipelineCandidateCard from "./PipelineCandidateCard";
import PipelineListView from "./PipelineListView";

const BOARD_SCROLLBAR_CLASS =
  "sibs-scrollbar [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full " +
  "[&::-webkit-scrollbar-track]:bg-[#E6ECF2] [&::-webkit-scrollbar-thumb]:rounded-full " +
  "[&::-webkit-scrollbar-thumb]:bg-[#94A9C1] [&::-webkit-scrollbar-thumb:hover]:bg-[#6B88A8]";

const COLUMN_SCROLLBAR_CLASS =
  "sibs-scrollbar [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent";

const REFERENCE_STAGE_THEMES = {
  "Initial Screening": {
    dot: "bg-amber-500",
    header: "border-amber-200/90 bg-amber-50/90 text-amber-900",
    badge: "bg-amber-500 text-white",
  },
  "Online Assessment": {
    dot: "bg-indigo-500",
    header: "border-indigo-200/90 bg-indigo-50/90 text-indigo-900",
    badge: "bg-indigo-500 text-white",
  },
  "Assessment Fit": {
    dot: "bg-sky-500",
    header: "border-sky-200/90 bg-sky-50/90 text-sky-900",
    badge: "bg-sky-500 text-white",
  },
  "Interview Scheduled": {
    dot: "bg-blue-500",
    header: "border-blue-200/90 bg-blue-50/90 text-blue-900",
    badge: "bg-blue-500 text-white",
  },
  Interviewed: {
    dot: "bg-teal-500",
    header: "border-teal-200/90 bg-teal-50/90 text-teal-900",
    badge: "bg-teal-500 text-white",
  },
  Offered: {
    dot: "bg-orange-500",
    header: "border-orange-200/90 bg-orange-50/90 text-orange-900",
    badge: "bg-orange-500 text-white",
  },
  Accepted: {
    dot: "bg-emerald-500",
    header: "border-emerald-200/90 bg-emerald-50/90 text-emerald-900",
    badge: "bg-emerald-500 text-white",
  },
  "For NHO": {
    dot: "bg-cyan-500",
    header: "border-cyan-200/90 bg-cyan-50/90 text-cyan-900",
    badge: "bg-cyan-500 text-white",
  },
  "Drop-off": {
    dot: "bg-rose-500",
    header: "border-rose-200/90 bg-rose-50/90 text-rose-900",
    badge: "bg-rose-600 text-white",
  },
};

function getCandidateStage(candidate = {}) {
  return (
    candidate.currentStage ||
    candidate.currentPipelineStage ||
    candidate.pipelineStage ||
    candidate.stage ||
    "Initial Screening"
  );
}

function getCandidateKey(candidate = {}, index = 0) {
  return (
    candidate.candidateApplicationId ||
    candidate.applicationId ||
    candidate.candidateId ||
    candidate.id ||
    `${candidate.name || "candidate"}-${index}`
  );
}

function getAccountLabelByStage(stage = "") {
  const finalAccountStages = ["Offered", "Accepted", "For NHO", "Hired"];

  return finalAccountStages.includes(stage) ? "Final Account" : "Initial Account";
}

export default function PipelineCardsBoard({
  candidates = [],
  dropOffCandidates = [],
  stageCounts = {},
  activeStage,
  onViewCandidate,
  onOpenMoveModal,
  onOpenAssessmentModal,
  onOpenScheduleModal,
  onCancelInterview,
  onCompleteInterview,
  viewMode = "board",
}) {
  const candidatesByStage = useMemo(() => {
    return pipelineStages.reduce((acc, stage) => {
      acc[stage] = candidates.filter(
        (candidate) => getCandidateStage(candidate) === stage,
      );
      return acc;
    }, {});
  }, [candidates]);

  const scrollRef = useRef(null);
  const [isDraggingBoard, setIsDraggingBoard] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartScrollLeft, setDragStartScrollLeft] = useState(0);

  function isInteractiveTarget(target) {
    return Boolean(
      target.closest(
        "button, a, input, textarea, select, [role='button'], [data-no-board-drag='true']",
      ),
    );
  }

  function handleBoardMouseDown(event) {
    if (!scrollRef.current) return;
    if (isInteractiveTarget(event.target)) return;

    setIsDraggingBoard(true);
    setDragStartX(event.pageX - scrollRef.current.offsetLeft);
    setDragStartScrollLeft(scrollRef.current.scrollLeft);
  }

  function handleBoardMouseMove(event) {
    if (!isDraggingBoard || !scrollRef.current) return;

    event.preventDefault();
    const x = event.pageX - scrollRef.current.offsetLeft;
    const walk = (x - dragStartX) * 1.25;
    scrollRef.current.scrollLeft = dragStartScrollLeft - walk;
  }

  function handleBoardMouseUp() {
    setIsDraggingBoard(false);
  }

  function handleBoardMouseLeave() {
    setIsDraggingBoard(false);
  }

  if (viewMode === "list") {
    return (
      <div className="w-full min-w-0">
        <PipelineListView
          candidates={candidates}
          dropOffCandidates={dropOffCandidates}
          stageCounts={stageCounts}
          activeStage={activeStage}
          onViewCandidate={onViewCandidate}
          onOpenMoveModal={onOpenMoveModal}
          onOpenAssessmentModal={onOpenAssessmentModal}
          onOpenScheduleModal={onOpenScheduleModal}
          onCancelInterview={onCancelInterview}
          onCompleteInterview={onCompleteInterview}
        />
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onMouseDown={handleBoardMouseDown}
      onMouseMove={handleBoardMouseMove}
      onMouseUp={handleBoardMouseUp}
      onMouseLeave={handleBoardMouseLeave}
      className={`overflow-x-auto bg-[#E6EAF0] p-1.5 pb-3 select-none sm:p-2 sm:pb-4 ${BOARD_SCROLLBAR_CLASS} ${
        isDraggingBoard ? "cursor-grabbing" : "cursor-default"
      }`}
    >
      <div className="flex min-w-max gap-3 2xl:gap-4">
        {pipelineStages.map((stage, stageIndex) => {
          const stageCandidates = candidatesByStage[stage] || [];
          const count = stageCounts[stage] ?? stageCandidates.length;
          const theme =
            REFERENCE_STAGE_THEMES[stage] || getPipelineStageTheme(stage);

          return (
            <div
              key={stage}
              style={{ animationDelay: `${stageIndex * 60}ms` }}
              className="sibs-page-card-in flex h-[600px] w-[292px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#D7DEE8] bg-[#EEF3F8] shadow-[0_7px_18px_rgba(4,44,81,0.035)] transition 2xl:h-[760px]"
            >
              <div
                className={`mx-1.5 mt-1.5 flex min-h-[44px] items-center justify-between gap-3 rounded-xl border px-3 text-left shadow-[0_1px_2px_rgba(4,44,81,0.025)] ${theme.header}`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${theme.dot}`}
                  />
                  <p className="truncate text-[10px] font-extrabold uppercase tracking-tight 2xl:text-[11px]">
                    {stage}
                  </p>
                </div>

                <span
                  className={`inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-2 text-[10px] font-extrabold shadow-sm ${theme.badge}`}
                >
                  {count}
                </span>
              </div>

              <div
                className={`min-h-0 flex-1 space-y-3 overflow-y-auto p-1.5 pt-3 2xl:p-2 2xl:pt-3 ${COLUMN_SCROLLBAR_CLASS}`}
              >
                {stageCandidates.length > 0 ? (
                  stageCandidates.map((candidate, index) => (
                    <div
                      key={getCandidateKey(candidate, index)}
                      data-no-board-drag="true"
                      className="sibs-page-card-in"
                      style={{
                        animationDelay: `${stageIndex * 50 + index * 40}ms`,
                      }}
                    >
                      <PipelineCandidateCard
                        candidate={candidate}
                        accountLabel={getAccountLabelByStage(stage)}
                        onViewCandidate={onViewCandidate}
                        onOpenMoveModal={onOpenMoveModal}
                        onOpenAssessmentModal={onOpenAssessmentModal}
                        onOpenScheduleModal={onOpenScheduleModal}
                        onCancelInterview={onCancelInterview}
                        onCompleteInterview={onCompleteInterview}
                      />
                    </div>
                  ))
                ) : (
                  <div className="mx-0.5 flex min-h-[112px] items-center justify-center rounded-xl border border-dashed border-[#D6E0EA] bg-white/70 px-4 text-center">
                    <div>
                      <p className="sibs-text-xs font-extrabold text-[#667085]">
                        No candidates
                      </p>
                      <p className="mt-1 text-[9px] font-semibold text-[#98A2B3]">
                        This stage is currently empty.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
