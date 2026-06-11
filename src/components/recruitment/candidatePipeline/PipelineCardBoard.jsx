import React, { useMemo, useRef, useState } from "react";
import { List, SlidersHorizontal } from "lucide-react";

import { pipelineStages } from "../../../lib/utils/candidatePipeline/candidatePipelineConstants";
import PipelineCandidateCard from "./PipelineCandidateCard";
import PipelineListView from "./PipelineListView";

const BOARD_SCROLLBAR_CLASS =
  "scrollbar-thin scrollbar-track-[#E6ECF2] scrollbar-thumb-sibs-primary-1 " +
  "[&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 " +
  "[&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#E6ECF2] " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sibs-primary-1 " +
  "[&::-webkit-scrollbar-thumb:hover]:bg-[#082F50]";

const COLUMN_SCROLLBAR_CLASS =
  "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-sibs-primary-1 " +
  "[&::-webkit-scrollbar]:w-2 " +
  "[&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sibs-primary-1 " +
  "[&::-webkit-scrollbar-thumb:hover]:bg-[#082F50]";

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

function getStageDescription(stage) {
  switch (stage) {
    case "Initial Screening":
      return "PRF review";
    case "Online Assessment":
      return "Assessment";
    case "Interview Scheduled":
      return "Calendar";
    case "Interviewed":
      return "Interview done";
    case "Offered":
      return "Offer approval";
    case "Accepted":
      return "Converted";
    case "For NHO":
      return "NHO schedule";
    case "Drop-off":
    case "Drop-offs":
      return "Closed";
    default:
      return "Pipeline";
  }
}

export default function PipelineCardsBoard({
  candidates = [],
  stageCounts = {},
  activeStage,
  setActiveStage,
  onViewCandidate,
  onOpenMoveModal,
  onOpenAssessmentModal,
  onOpenScheduleModal,
  onCancelInterview,
  onCompleteInterview,
}) {
  const [boardViewMode, setBoardViewMode] = useState("board");

  const candidatesByStage = useMemo(() => {
    return pipelineStages.reduce((acc, stage) => {
      acc[stage] = candidates.filter((candidate) => {
        const candidateStage = getCandidateStage(candidate);
        return candidateStage === stage;
      });

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

    const currentX = event.pageX - scrollRef.current.offsetLeft;
    const walk = currentX - dragStartX;

    scrollRef.current.scrollLeft = dragStartScrollLeft - walk;
  }

  function handleBoardMouseUp() {
    setIsDraggingBoard(false);
  }

  function handleBoardMouseLeave() {
    setIsDraggingBoard(false);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
      <div className="border-b border-[#E6ECF2] bg-white px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-[#101828]">Board</h2>

            <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
              Switch between compact board cards and a detailed list view.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] p-1">
              <button
                type="button"
                onClick={() => setBoardViewMode("board")}
                className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-xs font-extrabold transition ${
                  boardViewMode === "board"
                    ? "bg-sibs-primary-1 text-white shadow-sm"
                    : "text-sibs-primary-1 hover:bg-white"
                }`}
              >
                <SlidersHorizontal size={15} />
                Board
              </button>

              <button
                type="button"
                onClick={() => setBoardViewMode("list")}
                className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-xs font-extrabold transition ${
                  boardViewMode === "list"
                    ? "bg-sibs-primary-1 text-white shadow-sm"
                    : "text-sibs-primary-1 hover:bg-white"
                }`}
              >
                <List size={15} />
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {boardViewMode === "list" ? (
        <div className="bg-[#F5F7FA] p-4">
          <PipelineListView
            candidates={candidates}
            activeStage={activeStage}
            onViewCandidate={onViewCandidate}
            onOpenMoveModal={onOpenMoveModal}
            onOpenAssessmentModal={onOpenAssessmentModal}
            onOpenScheduleModal={onOpenScheduleModal}
            onCancelInterview={onCancelInterview}
            onCompleteInterview={onCompleteInterview}
          />
        </div>
      ) : (
        <div
          ref={scrollRef}
          onMouseDown={handleBoardMouseDown}
          onMouseMove={handleBoardMouseMove}
          onMouseUp={handleBoardMouseUp}
          onMouseLeave={handleBoardMouseLeave}
          className={`overflow-x-auto bg-[#F5F7FA] p-4 pb-5 select-none ${BOARD_SCROLLBAR_CLASS} ${
            isDraggingBoard ? "cursor-grabbing" : "cursor-default"
          }`}
        >
          <div className="flex min-w-max gap-4">
            {pipelineStages.map((stage) => {
              const stageCandidates = candidatesByStage[stage] || [];
              const isActive = activeStage === stage;
              const count = stageCounts[stage] ?? stageCandidates.length;

              return (
                <div
                  key={stage}
                  className={`flex h-[600px] w-[292px] shrink-0 flex-col overflow-hidden rounded-xl border bg-[#F8FAFC] transition border-[#E6ECF2]`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveStage(stage)}
                    className={`flex h-[58px] items-center justify-between gap-3 border-b px-3 text-left transition bg-white border-[#E6ECF2]`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                        {stage}
                      </p>

                      <p className="mt-0.5 truncate text-[10px] font-bold text-[#98A2B3]">
                        {getStageDescription(stage)}
                      </p>
                    </div>

                    <span className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-white px-2 text-[11px] font-extrabold text-[#475467] shadow-sm">
                      {count}
                    </span>
                  </button>

                  <div
                    className={`min-h-0 flex-1 space-y-3 overflow-y-auto p-3 pr-2 ${COLUMN_SCROLLBAR_CLASS}`}
                  >
                    {stageCandidates.length > 0 ? (
                      stageCandidates.map((candidate, index) => (
                        <div
                          key={getCandidateKey(candidate, index)}
                          data-no-board-drag="true"
                        >
                          <PipelineCandidateCard
                            candidate={candidate}
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
                      <div className="rounded-xl border border-dashed border-[#D6DEE8] bg-white px-3 py-8 text-center">
                        <p className="text-xs font-extrabold text-[#98A2B3]">
                          No cards
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
