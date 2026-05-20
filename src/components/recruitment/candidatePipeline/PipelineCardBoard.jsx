import React, { useMemo, useRef, useState } from "react";
import { pipelineStages } from "../../../lib/utils/candidatePipeline/candidatePipelineConstants";
import { List, SlidersHorizontal } from "lucide-react";
import PipelineCandidateCard from "./PipelineCandidateCard";

const PipelineCardsBoard = ({
  candidates,
  stageCounts,
  activeStage,
  setActiveStage,
  onViewCandidate,
  onOpenMoveModal,
  onOpenAssessmentModal,
  onOpenScheduleModal,
  onCancelInterview,
  onCompleteInterview,
}) => {
  const [boardViewMode, setBoardViewMode] = useState("board");

  const candidatesByStage = useMemo(() => {
    return pipelineStages.reduce((acc, stage) => {
      acc[stage] = candidates.filter(
        (candidate) => candidate.currentStage === stage,
      );
      return acc;
    }, {});
  }, [candidates]);

  const scrollRef = useRef(null);
  const [isDraggingBoard, setIsDraggingBoard] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartScrollLeft, setDragStartScrollLeft] = useState(0);

  function handleBoardMouseDown(e) {
    if (!scrollRef.current) return;

    setIsDraggingBoard(true);
    setDragStartX(e.pageX - scrollRef.current.offsetLeft);
    setDragStartScrollLeft(scrollRef.current.scrollLeft);
  }

  function handleBoardMouseMove(e) {
    if (!isDraggingBoard || !scrollRef.current) return;

    e.preventDefault();

    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = x - dragStartX;

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
          className={`overflow-x-auto bg-[#F5F7FA] p-4 select-none ${
            isDraggingBoard ? "cursor-grabbing" : ""
          }`}
        >
          <div className="flex min-w-max gap-4">
            {pipelineStages.map((stage) => {
              const stageCandidates = candidatesByStage[stage] || [];
              //   const isActive = activeStage === stage;

              return (
                <div
                  key={stage}
                  className={`flex max-h-[calc(100vh-360px)] min-h-[520px] w-[292px] shrink-0 flex-col rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] transition`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveStage(stage)}
                    className="flex h-[54px] items-center justify-between rounded-t-md gap-3 border-b border-[#E6ECF2] bg-[#F8FAFC] px-3 text-left transition hover:bg-white"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-extrabold uppercase tracking-wide text-[#344054]">
                        {stage}
                      </p>
                      <p className="mt-0.5 text-[10px] font-bold text-[#98A2B3]">
                        {stage === "Initial Screening"
                          ? "PRF review"
                          : stage === "Online Assessment"
                            ? "Assessment"
                            : stage === "Interview Scheduled"
                              ? "Calendar"
                              : stage === "Interviewed"
                                ? "Interview done"
                                : stage === "Offered"
                                  ? "Offer approval"
                                  : stage === "Accepted"
                                    ? "Converted"
                                    : "Closed"}
                      </p>
                    </div>

                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-extrabold text-[#475467] shadow-sm">
                      {stageCounts[stage] || stageCandidates.length}
                    </span>
                  </button>

                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                    {stageCandidates.length > 0 ? (
                      stageCandidates.map((candidate) => (
                        <PipelineCandidateCard
                          key={candidate.id}
                          candidate={candidate}
                          onViewCandidate={onViewCandidate}
                          onOpenMoveModal={onOpenMoveModal}
                          onOpenAssessmentModal={onOpenAssessmentModal}
                          onOpenScheduleModal={onOpenScheduleModal}
                          onCancelInterview={onCancelInterview}
                          onCompleteInterview={onCompleteInterview}
                        />
                      ))
                    ) : (
                      <div className="rounded-md border border-dashed border-[#D6DEE8] bg-white px-3 py-8 text-center">
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
};

export default PipelineCardsBoard;
