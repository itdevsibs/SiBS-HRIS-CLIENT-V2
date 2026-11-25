import React, { useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  Loader2,
  RefreshCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import {
  getQuestionCategoryMeta,
  getQuestionReviewMeta,
} from "@/lib/utils/recruitment/resumeAnalysisClient";

function extractSegmentRefs(question = {}) {
  const explicit = Array.isArray(question.evidenceSegmentIds)
    ? question.evidenceSegmentIds.filter(Boolean)
    : [];
  if (explicit.length > 0) return explicit;
  const excerpt = String(question.supportingExcerpt || "");
  const matches = excerpt.match(/\[?(seg_\d+)\]?/gi) || [];
  return [...new Set(matches.map((m) => m.replace(/[[\]]/g, "")))];
}

export default function FinalInterviewAiWorkspace({
  approvedQuestions = [],
  allQuestions = [],
  approvedJd = null,
  questionSetSummary = null,
  resumeDocument = null,
  answers = {},
  savedSubmission = null,
  permissions = {},
  loading = false,
  reviewBusy = false,
  isSubmittedView = false,
  requestedViewMode = false,
  isSubmitting = false,
  selectedQuestionId: controlledQuestionId,
  onSelectQuestionId,
  onChangeRemarks,
  onReviewDecision,
  onRegenerate,
}) {
  const [manageVisibility, setManageVisibility] = useState(false);
  const [internalQuestionId, setInternalQuestionId] = useState("");
  const selectedQuestionId =
    controlledQuestionId !== undefined
      ? controlledQuestionId
      : internalQuestionId;
  const setSelectedQuestionId = (nextId) => {
    if (onSelectQuestionId) onSelectQuestionId(nextId);
    else setInternalQuestionId(nextId);
  };
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [jdOpen, setJdOpen] = useState(false);
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const navRefs = useRef(new Map());

  const visibleList = useMemo(() => {
    if (manageVisibility && allQuestions.length > 0) {
      return allQuestions;
    }
    return approvedQuestions;
  }, [manageVisibility, allQuestions, approvedQuestions]);

  const activeIndex = useMemo(() => {
    if (visibleList.length === 0) return -1;
    const idx = visibleList.findIndex(
      (q, i) => (q.questionId || `ai_${i + 1}`) === selectedQuestionId
    );
    return idx >= 0 ? idx : 0;
  }, [visibleList, selectedQuestionId]);

  const activeQuestion =
    activeIndex >= 0 ? visibleList[activeIndex] : null;
  const activeQId = activeQuestion
    ? activeQuestion.questionId || `ai_${activeIndex + 1}`
    : "";

  const matchedJdRequirement = useMemo(() => {
    if (!activeQuestion?.jdRequirementId || !approvedJd?.requirements?.length) {
      return null;
    }
    return (
      approvedJd.requirements.find(
        (req) =>
          String(req?.requirement_id || "").toLowerCase() ===
          String(activeQuestion.jdRequirementId || "").toLowerCase()
      ) || null
    );
  }, [activeQuestion, approvedJd]);

  const handleNavigatorKeyDown = (event, idx) => {
    if (visibleList.length <= 1) return;
    let targetIdx = null;
    if (event.key === "ArrowDown") {
      targetIdx = (idx + 1) % visibleList.length;
    } else if (event.key === "ArrowUp") {
      targetIdx = (idx - 1 + visibleList.length) % visibleList.length;
    } else if (event.key === "Home") {
      targetIdx = 0;
    } else if (event.key === "End") {
      targetIdx = visibleList.length - 1;
    }
    if (targetIdx === null) return;
    event.preventDefault();
    const q = visibleList[targetIdx];
    const key = q.questionId || `ai_${targetIdx + 1}`;
    setSelectedQuestionId(key);
    navRefs.current.get(key)?.focus();
  };

  const handleStep = (delta) => {
    const nextIdx = activeIndex + delta;
    if (nextIdx < 0 || nextIdx >= visibleList.length) return;
    const q = visibleList[nextIdx];
    setSelectedQuestionId(q.questionId || `ai_${nextIdx + 1}`);
  };

  const activeCatMeta = activeQuestion
    ? getQuestionCategoryMeta(activeQuestion.category)
    : null;
  const activeRevMeta = activeQuestion
    ? getQuestionReviewMeta(activeQuestion.reviewStatus || "approved")
    : null;
  const activeReviewStatus = String(
    activeQuestion?.reviewStatus || "approved"
  ).toLowerCase();
  const segmentRefs = activeQuestion ? extractSegmentRefs(activeQuestion) : [];

  const savedResponse = activeQId
    ? savedSubmission?.aiQuestionResponses?.[activeQId] || null
    : null;
  const remarksKey = `ai_q_remarks_${activeQId}`;
  const noteKey = `ai_q_note_${activeQId}`;
  const currentRemarks =
    answers[remarksKey] ?? savedResponse?.interviewerRemarks ?? "";
  const currentNote =
    answers[noteKey] ?? savedResponse?.supplementaryNote ?? "";

  const isReadOnly = requestedViewMode || isSubmittedView || isSubmitting;

  return (
    <section
      data-testid="final-interview-ai-questions-section"
      className="sibs-card overflow-hidden"
    >
      {/* Workspace Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sibs-border bg-sibs-surface px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles size={16} className="shrink-0 text-[#FF5C28]" />
            <h2 className="sibs-card-title text-sibs-navy">
              AI Interview Questions
            </h2>
            <span className="sibs-badge-neutral">
              Supplementary · Non-Scored
            </span>
          </div>
          <p className="mt-0.5 text-xs font-medium text-sibs-muted">
            Tailored to the candidate&apos;s resume and approved Job Description.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isSubmittedView &&
            permissions.canReviewQuestions &&
            allQuestions.length > 0 && (
              <button
                type="button"
                onClick={() => setManageVisibility((prev) => !prev)}
                data-testid="toggle-inline-hr-question-review-btn"
                className="inline-flex items-center gap-1.5 rounded-lg border border-sibs-border bg-white px-3 py-1.5 text-xs font-bold text-sibs-primary-1 transition hover:bg-slate-50"
              >
                {manageVisibility ? <EyeOff size={13} /> : <Eye size={13} />}
                {manageVisibility
                  ? "Done Managing"
                  : `Manage Shown (${approvedQuestions.length}/${allQuestions.length})`}
              </button>
            )}

          {!isSubmittedView &&
            permissions.canReviewQuestions &&
            resumeDocument && (
              <button
                type="button"
                disabled={reviewBusy}
                onClick={onRegenerate}
                data-testid="inline-generate-ai-questions-btn"
                className="inline-flex items-center gap-1.5 rounded-lg border border-sibs-border bg-white px-3 py-1.5 text-xs font-bold text-sibs-primary-1 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {reviewBusy ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <RefreshCcw size={13} />
                )}
                {reviewBusy
                  ? "Generating..."
                  : (questionSetSummary?.totalCount || 0) > 0
                    ? "Regenerate"
                    : "Generate AI Questions"}
              </button>
            )}
        </div>
      </div>

      {loading ? (
        <div className="m-4 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3.5 py-2.5 text-xs font-bold text-blue-700">
          <Loader2 size={14} className="animate-spin" />
          Loading AI interview questions...
        </div>
      ) : visibleList.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm font-bold text-slate-700">
            No active AI-generated interview questions for this application.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Standard Final Interview evaluation remains fully available.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,29%)_minmax(0,1fr)]">
          {/* Left Panel — AI Question Navigator */}
          <div className="border-b border-sibs-border bg-slate-50/50 lg:border-r lg:border-b-0">
            {manageVisibility && permissions.canReviewQuestions && (
              <div className="flex items-center justify-between gap-2 border-b border-sibs-border bg-slate-100/70 px-3 py-2 text-[11px]">
                <span className="font-bold text-sibs-primary-1">
                  Select questions to show
                </span>
                <button
                  type="button"
                  disabled={reviewBusy}
                  onClick={() =>
                    onReviewDecision({
                      reviewAll: true,
                      decision: "approved",
                    })
                  }
                  data-testid="inline-approve-all-ai-questions-btn"
                  className="rounded border border-emerald-300 bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Show All
                </button>
              </div>
            )}

            <div
              className="max-h-56 divide-y divide-slate-200/70 overflow-y-auto sibs-scrollbar lg:max-h-[540px]"
              aria-label="AI interview questions navigator"
            >
              {visibleList.map((aiQ, idx) => {
                const qId = aiQ.questionId || `ai_${idx + 1}`;
                const isSelected = qId === activeQId;
                const catMeta = getQuestionCategoryMeta(aiQ.category);
                const st = String(aiQ.reviewStatus || "approved").toLowerCase();
                const hasNote = Boolean(
                  String(
                    answers[`ai_q_remarks_${qId}`] ??
                      savedSubmission?.aiQuestionResponses?.[qId]
                        ?.interviewerRemarks ??
                      ""
                  ).trim()
                );

                return (
                  <button
                    key={qId}
                    ref={(el) => {
                      if (el) navRefs.current.set(qId, el);
                      else navRefs.current.delete(qId);
                    }}
                    type="button"
                    onClick={() => setSelectedQuestionId(qId)}
                    onKeyDown={(e) => handleNavigatorKeyDown(e, idx)}
                    aria-current={isSelected ? "true" : undefined}
                    data-testid={`ai-nav-item-${idx}`}
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
                        AI Q{idx + 1}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {manageVisibility ? (
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                              st === "approved"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : st === "rejected"
                                  ? "border-rose-200 bg-rose-50 text-rose-700"
                                  : "border-amber-200 bg-amber-50 text-amber-800"
                            }`}
                          >
                            {st === "approved"
                              ? "Shown"
                              : st === "rejected"
                                ? "Hidden"
                                : "Pending"}
                          </span>
                        ) : null}
                        {hasNote ? (
                          <CheckCircle2
                            size={12}
                            className="text-emerald-600"
                            aria-label="Remarks recorded"
                          />
                        ) : null}
                      </div>
                    </div>

                    <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-snug text-sibs-primary-1">
                      {aiQ.questionText}
                    </p>
                    <p className="mt-1 truncate text-[11px] font-semibold text-sibs-muted">
                      {catMeta.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel — Selected AI Question */}
          <div
            className="flex min-w-0 flex-col justify-between p-4 sm:p-6"
            data-testid={`final-interview-ai-question-card-${activeIndex}`}
          >
            {activeQuestion ? (
              <>
                <div className="space-y-4">
                  {/* Question Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <p className="text-xs font-extrabold text-sibs-primary-1">
                        AI Question {activeIndex + 1} of {visibleList.length}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-600">
                        {activeCatMeta?.label} ·{" "}
                        {activeQuestion.sourceType === "resume_based"
                          ? "Resume-sourced evidence + JD"
                          : "Approved JD requirement"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {manageVisibility ? (
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${activeRevMeta?.badgeClass}`}
                        >
                          {activeRevMeta?.label}
                        </span>
                      ) : null}

                      {!isSubmittedView &&
                        permissions.canReviewQuestions &&
                        activeQuestion.questionId && (
                          <button
                            type="button"
                            disabled={reviewBusy}
                            onClick={() =>
                              onReviewDecision({
                                questionIds: [activeQuestion.questionId],
                                decision:
                                  activeReviewStatus === "approved"
                                    ? "rejected"
                                    : "approved",
                              })
                            }
                            data-testid="ai-toggle-visibility-btn"
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-50 ${
                              activeReviewStatus === "approved"
                                ? "border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {activeReviewStatus === "approved" ? (
                              <>
                                <XCircle size={12} />
                                Hide from Interview
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={12} />
                                Show in Interview
                              </>
                            )}
                          </button>
                        )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-[15px] sm:text-base font-bold leading-relaxed text-sibs-primary-1">
                    {activeQuestion.questionText}
                  </p>

                  {/* Collapsible Supporting Panels */}
                  <div className="space-y-2">
                    {activeQuestion.supportingExcerpt ? (
                      <div className="rounded-lg border border-sibs-border bg-slate-50/50">
                        <button
                          type="button"
                          aria-expanded={evidenceOpen}
                          onClick={() => setEvidenceOpen((prev) => !prev)}
                          className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-xs font-bold text-sibs-primary-1 hover:bg-slate-100/70"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <FileText size={13} className="text-[#FF5C28]" />
                            Source Evidence
                            <span className="font-normal text-slate-500">
                              (Resume-sourced, unverified)
                            </span>
                          </span>
                          {evidenceOpen ? (
                            <ChevronUp size={14} className="text-slate-500" />
                          ) : (
                            <ChevronDown size={14} className="text-slate-500" />
                          )}
                        </button>
                        {evidenceOpen ? (
                          <div className="space-y-1.5 border-t border-sibs-border bg-white px-3.5 py-2.5 text-xs text-slate-700">
                            <p className="leading-relaxed">
                              {activeQuestion.supportingExcerpt}
                            </p>
                            {segmentRefs.length > 0 ? (
                              <p className="text-[11px] font-semibold text-slate-500">
                                Segment reference: {segmentRefs.join(", ")}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {activeQuestion.jdRequirementId ? (
                      <div className="rounded-lg border border-sibs-border bg-slate-50/50">
                        <button
                          type="button"
                          aria-expanded={jdOpen}
                          onClick={() => setJdOpen((prev) => !prev)}
                          className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-xs font-bold text-sibs-primary-1 hover:bg-slate-100/70"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <BookOpen size={13} className="text-[#FF5C28]" />
                            Job Description Reference (
                            {activeQuestion.jdRequirementId})
                          </span>
                          {jdOpen ? (
                            <ChevronUp size={14} className="text-slate-500" />
                          ) : (
                            <ChevronDown size={14} className="text-slate-500" />
                          )}
                        </button>
                        {jdOpen ? (
                          <div className="border-t border-sibs-border bg-white px-3.5 py-2.5 text-xs text-slate-700">
                            {matchedJdRequirement?.text ||
                              `Mapped to approved JD requirement ${activeQuestion.jdRequirementId}.`}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {activeQuestion.interviewerGuidance ? (
                      <div className="rounded-lg border border-sibs-border bg-slate-50/50">
                        <button
                          type="button"
                          aria-expanded={guidanceOpen}
                          onClick={() => setGuidanceOpen((prev) => !prev)}
                          className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-xs font-bold text-sibs-primary-1 hover:bg-slate-100/70"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <HelpCircle size={13} className="text-[#FF5C28]" />
                            Interviewer Guidance
                          </span>
                          {guidanceOpen ? (
                            <ChevronUp size={14} className="text-slate-500" />
                          ) : (
                            <ChevronDown size={14} className="text-slate-500" />
                          )}
                        </button>
                        {guidanceOpen ? (
                          <div className="border-t border-sibs-border bg-white px-3.5 py-2.5 text-xs leading-relaxed text-slate-700">
                            {activeQuestion.interviewerGuidance}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {/* Interviewer Remarks & Supplementary Notes */}
                  <div className="grid grid-cols-1 gap-3 pt-1 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor={remarksKey}
                        className="sibs-field-label block"
                      >
                        Interviewer Remarks / Candidate Response
                      </label>
                      <textarea
                        id={remarksKey}
                        rows={3}
                        value={currentRemarks}
                        disabled={isReadOnly}
                        onChange={(e) =>
                          onChangeRemarks(remarksKey, e.target.value)
                        }
                        placeholder="Record the candidate's response and verification details..."
                        className="sibs-modal-textarea mt-1.5 min-h-[84px] text-[11.5px] 2xl:text-[12px]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={noteKey}
                        className="sibs-field-label block"
                      >
                        Supplementary Notes (Non-Scored)
                      </label>
                      <textarea
                        id={noteKey}
                        rows={3}
                        value={currentNote}
                        disabled={isReadOnly}
                        onChange={(e) =>
                          onChangeRemarks(noteKey, e.target.value)
                        }
                        placeholder="Optional follow-up observations..."
                        className="sibs-modal-textarea mt-1.5 min-h-[84px] text-[11.5px] 2xl:text-[12px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Question Navigation */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-sibs-border pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={activeIndex <= 0}
                      onClick={() => handleStep(-1)}
                      data-testid="ai-prev-question-btn"
                      className="inline-flex items-center gap-1 rounded-lg border border-sibs-border bg-white px-3 py-1.5 text-xs font-semibold text-sibs-primary-1 transition hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronLeft size={14} />
                      Previous Question
                    </button>
                    <button
                      type="button"
                      disabled={
                        activeIndex < 0 || activeIndex >= visibleList.length - 1
                      }
                      onClick={() => handleStep(1)}
                      data-testid="ai-next-question-btn"
                      className="inline-flex items-center gap-1 rounded-lg border border-sibs-border bg-white px-3 py-1.5 text-xs font-semibold text-sibs-primary-1 transition hover:bg-slate-50 disabled:opacity-40"
                    >
                      Next Question
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
