import React, { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  ClipboardList,
  Loader2,
  SkipForward,
} from "lucide-react";
import RichTextViewer from "@/components/modals/jobDescription/RichTextViewer";

export default function FinalInterviewStandardWorkspace({
  questions = [],
  finalInterviewRatingScore = {},
  publicMode = false,
  isSubmittedView = false,
  databaseFormLoading = false,
  databaseFormError = "",
  emptyStateMessage = "",
  renderQuestionInputs,
  activeQuestionId: controlledQuestionId,
  onSelectQuestionId,
}) {
  const [internalQuestionId, setInternalQuestionId] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // "all" | "unanswered"
  const navRefs = useRef(new Map());

  const activeQuestionId =
    controlledQuestionId !== undefined
      ? controlledQuestionId
      : internalQuestionId;

  const setActiveQuestionId = (nextId) => {
    if (onSelectQuestionId) {
      onSelectQuestionId(nextId);
    } else {
      setInternalQuestionId(nextId);
    }
  };

  const filteredQuestions = useMemo(() => {
    if (filterMode === "unanswered") {
      return questions.filter((q) => !q.isCompleted);
    }
    return questions;
  }, [questions, filterMode]);

  const activeIndexInFiltered = useMemo(() => {
    if (filteredQuestions.length === 0) return -1;
    const idx = filteredQuestions.findIndex(
      (q) => q.questionKey === activeQuestionId
    );
    return idx >= 0 ? idx : 0;
  }, [filteredQuestions, activeQuestionId]);

  const activeItem =
    activeIndexInFiltered >= 0
      ? filteredQuestions[activeIndexInFiltered]
      : null;

  const nextUnansweredItem = useMemo(() => {
    const currentNumber = activeItem?.questionNumber ?? 0;
    const after = questions.find(
      (q) => q.questionNumber > currentNumber && !q.isCompleted
    );
    if (after) return after;
    return (
      questions.find(
        (q) => q.questionKey !== activeItem?.questionKey && !q.isCompleted
      ) || null
    );
  }, [questions, activeItem]);

  const completedCount = useMemo(
    () => questions.filter((q) => q.isCompleted).length,
    [questions]
  );

  const handleNavigatorKeyDown = (event, idx) => {
    if (filteredQuestions.length <= 1) return;
    let targetIdx = null;
    if (event.key === "ArrowDown") {
      targetIdx = (idx + 1) % filteredQuestions.length;
    } else if (event.key === "ArrowUp") {
      targetIdx =
        (idx - 1 + filteredQuestions.length) % filteredQuestions.length;
    } else if (event.key === "Home") {
      targetIdx = 0;
    } else if (event.key === "End") {
      targetIdx = filteredQuestions.length - 1;
    }
    if (targetIdx === null) return;
    event.preventDefault();
    const target = filteredQuestions[targetIdx];
    if (!target) return;
    setActiveQuestionId(target.questionKey);
    navRefs.current.get(target.questionKey)?.focus();
  };

  const handleStep = (delta) => {
    const nextIdx = activeIndexInFiltered + delta;
    if (nextIdx < 0 || nextIdx >= filteredQuestions.length) return;
    setActiveQuestionId(filteredQuestions[nextIdx].questionKey);
  };

  const handleNextUnanswered = () => {
    if (!nextUnansweredItem) return;
    setActiveQuestionId(nextUnansweredItem.questionKey);
  };

  return (
    <section
      data-testid="final-interview-standard-workspace"
      className="sibs-card overflow-hidden"
    >
      {/* Workspace Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sibs-border bg-sibs-surface px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ClipboardList size={16} className="shrink-0 text-[#FF5C28]" />
            <h2 className="sibs-card-title text-sibs-navy">
              Standard Interview Questions
            </h2>
          </div>
          {!publicMode && (
            <p className="mt-0.5 text-xs font-medium text-sibs-muted">
              Score:{" "}
              <strong className="font-bold text-sibs-navy">
                {finalInterviewRatingScore.totalScore || 0}/
                {finalInterviewRatingScore.maximumScore || 0}
              </strong>{" "}
              (
              {Number(finalInterviewRatingScore.percentageScore || 0).toFixed(0)}
              %) · Rated{" "}
              <strong className="font-bold text-sibs-navy">
                {finalInterviewRatingScore.answeredRatingFields || 0}/
                {finalInterviewRatingScore.totalRatingFields || 0}
              </strong>
            </p>
          )}
        </div>

        {questions.length > 0 && (
          <div
            className="flex items-center gap-1"
            role="tablist"
            aria-label="Filter standard questions"
          >
            <button
              type="button"
              role="tab"
              aria-selected={filterMode === "all"}
              onClick={() => setFilterMode("all")}
              data-testid="standard-filter-all"
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                filterMode === "all"
                  ? "bg-sibs-primary-1 text-white"
                  : "border border-sibs-border bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              All ({questions.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filterMode === "unanswered"}
              onClick={() => setFilterMode("unanswered")}
              data-testid="standard-filter-unanswered"
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                filterMode === "unanswered"
                  ? "bg-sibs-primary-1 text-white"
                  : "border border-sibs-border bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Unanswered ({questions.length - completedCount})
            </button>
          </div>
        )}
      </div>

      {databaseFormLoading && (
        <div className="m-4 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3.5 py-2.5 text-xs font-bold text-blue-700">
          <Loader2 size={14} className="animate-spin" />
          Loading the position&apos;s saved database questions...
        </div>
      )}

      {databaseFormError && (
        <div className="m-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-bold text-amber-800">
          {databaseFormError} The local form snapshot is being used as a
          fallback.
        </div>
      )}

      {questions.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm font-bold text-slate-600">
            {emptyStateMessage ||
              (isSubmittedView
                ? "No saved Final Interview questions were found for this submission."
                : "No Final Interview questions are configured for this position.")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,29%)_minmax(0,1fr)]">
          {/* Left Panel — Question Navigator */}
          <div className="border-b border-sibs-border bg-slate-50/50 lg:border-r lg:border-b-0">
            <div
              className="max-h-56 divide-y divide-slate-200/70 overflow-y-auto sibs-scrollbar lg:max-h-[540px]"
              aria-label="Standard interview questions navigator"
            >
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((item, idx) => {
                  const isSelected =
                    item.questionKey === activeItem?.questionKey;
                  return (
                    <button
                      key={item.questionKey}
                      ref={(el) => {
                        if (el) navRefs.current.set(item.questionKey, el);
                        else navRefs.current.delete(item.questionKey);
                      }}
                      type="button"
                      onClick={() => setActiveQuestionId(item.questionKey)}
                      onKeyDown={(e) => handleNavigatorKeyDown(e, idx)}
                      aria-current={isSelected ? "true" : undefined}
                      data-testid={`standard-nav-item-${item.questionNumber - 1}`}
                      className={`w-full px-3.5 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF5C28] ${
                        isSelected
                          ? "bg-[#EEF4FA] ring-1 ring-inset ring-[#042C51]/25"
                          : "bg-transparent hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            isSelected
                              ? "bg-sibs-primary-1 text-white"
                              : "bg-slate-200/80 text-slate-700"
                          }`}
                        >
                          Q{item.questionNumber}
                        </span>
                        {item.isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 size={11} />
                            {item.ratingValue ? `${item.ratingValue}/5` : "Done"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                            <CircleDot size={10} />
                            Pending
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-snug text-sibs-primary-1">
                        {item.previewText || "Untitled Final Interview question"}
                      </p>

                      <p className="mt-1 truncate text-[11px] font-semibold text-sibs-muted">
                        {item.sectionTitle}
                      </p>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  All standard questions have been completed.
                </div>
              )}
            </div>
          </div>

          {/* Right Panel — Active Question */}
          <div
            className="flex min-w-0 flex-col justify-between p-4 sm:p-6"
            data-testid="standard-active-question-panel"
          >
            {activeItem ? (
              <>
                <div className="space-y-4">
                  {/* Question Hierarchy Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <p
                        className="text-xs font-extrabold text-sibs-primary-1"
                        data-testid="standard-question-counter"
                      >
                        Question {activeItem.questionNumber} of{" "}
                        {questions.length}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-600">
                        {activeItem.sectionTitle}
                      </p>
                    </div>
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                      {activeItem.field?.type || "Text"}
                    </span>
                  </div>

                  {/* Prominent Question Text */}
                  <div className="text-[15px] sm:text-base font-bold leading-relaxed text-sibs-primary-1">
                    <RichTextViewer
                      value={activeItem.field?.label}
                      emptyText="Untitled Final Interview question"
                      className="text-sibs-primary-1"
                    />
                  </div>

                  {/* Preserved Answer & Rating Controls */}
                  <div className="pt-1">{renderQuestionInputs(activeItem)}</div>
                </div>

                {/* Question Navigation Controls */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-sibs-border pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={activeIndexInFiltered <= 0}
                      onClick={() => handleStep(-1)}
                      data-testid="standard-prev-question-btn"
                      className="inline-flex items-center gap-1 rounded-lg border border-sibs-border bg-white px-3 py-1.5 text-xs font-semibold text-sibs-primary-1 transition hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronLeft size={14} />
                      Previous Question
                    </button>
                    <button
                      type="button"
                      disabled={
                        activeIndexInFiltered < 0 ||
                        activeIndexInFiltered >= filteredQuestions.length - 1
                      }
                      onClick={() => handleStep(1)}
                      data-testid="standard-next-question-btn"
                      className="inline-flex items-center gap-1 rounded-lg border border-sibs-border bg-white px-3 py-1.5 text-xs font-semibold text-sibs-primary-1 transition hover:bg-slate-50 disabled:opacity-40"
                    >
                      Next Question
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {nextUnansweredItem ? (
                    <button
                      type="button"
                      onClick={handleNextUnanswered}
                      data-testid="standard-next-unanswered-btn"
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                    >
                      <SkipForward size={13} />
                      Next Unanswered
                    </button>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-xs font-medium text-slate-600">
                  All questions in this filter are complete.
                </p>
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className="mt-2 rounded-lg border border-sibs-border bg-white px-3 py-1.5 text-xs font-semibold text-sibs-primary-1 hover:bg-slate-50"
                >
                  Show All Questions
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
