import React, { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileCheck2,
  FileText,
  HelpCircle,
  Loader2,
  SkipForward,
  XCircle,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  getQuestionCategoryMeta,
  getQuestionReviewMeta,
} from "@/lib/utils/recruitment/resumeAnalysisClient";

const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "approved", label: "Shown" },
  { id: "rejected", label: "Hidden" },
  { id: "pending_review", label: "Pending" },
];

function extractSegmentRefs(question = {}) {
  const explicit = Array.isArray(question.evidenceSegmentIds)
    ? question.evidenceSegmentIds.filter(Boolean)
    : [];
  if (explicit.length > 0) return explicit;

  const excerpt = String(question.supportingExcerpt || "");
  const matches = excerpt.match(/\[?(seg_\d+)\]?/gi) || [];
  return [...new Set(matches.map((m) => m.replace(/[[\]]/g, "")))];
}

export default function GeneratedQuestionsWorkspace({
  questions = [],
  approvedJd = null,
  permissions = {},
  actionLoading = false,
  onReviewDecision,
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);
  const [guidanceExpanded, setGuidanceExpanded] = useState(false);
  const [bulkConfirmType, setBulkConfirmType] = useState(null); // "approve_pending" | "reject_all" | null
  const navButtonRefs = useRef(new Map());

  const counts = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    for (const q of questions) {
      const status = String(q?.reviewStatus || "pending_review").toLowerCase();
      if (status === "approved") approved += 1;
      else if (status === "rejected") rejected += 1;
      else pending += 1;
    }
    const total = questions.length;
    const reviewed = approved + rejected;
    return { total, approved, pending, rejected, reviewed };
  }, [questions]);

  const pendingQuestionIds = useMemo(
    () =>
      questions
        .filter(
          (q) =>
            String(q?.reviewStatus || "pending_review").toLowerCase() ===
            "pending_review"
        )
        .map((q) => q.questionId)
        .filter(Boolean),
    [questions]
  );

  const filteredEntries = useMemo(() => {
    return questions
      .map((question, originalIndex) => ({
        question,
        originalIndex,
        key: question.questionId || `q-${originalIndex}`,
      }))
      .filter(({ question }) => {
        if (statusFilter === "all") return true;
        const st = String(
          question?.reviewStatus || "pending_review"
        ).toLowerCase();
        return st === statusFilter;
      });
  }, [questions, statusFilter]);

  const selectedFilteredIndex = useMemo(() => {
    if (filteredEntries.length === 0) return -1;
    const idx = filteredEntries.findIndex(
      (entry) => entry.key === selectedQuestionId
    );
    return idx >= 0 ? idx : 0;
  }, [filteredEntries, selectedQuestionId]);

  const activeEntry =
    selectedFilteredIndex >= 0
      ? filteredEntries[selectedFilteredIndex]
      : null;
  const activeQuestion = activeEntry?.question || null;

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

  const nextPendingEntry = useMemo(() => {
    if (counts.pending === 0) return null;
    const currentOriginalIdx = activeEntry?.originalIndex ?? -1;
    const afterCurrent = questions.findIndex(
      (q, idx) =>
        idx > currentOriginalIdx &&
        String(q?.reviewStatus || "pending_review").toLowerCase() ===
          "pending_review"
    );
    const targetIdx =
      afterCurrent >= 0
        ? afterCurrent
        : questions.findIndex(
            (q, idx) =>
              idx !== currentOriginalIdx &&
              String(q?.reviewStatus || "pending_review").toLowerCase() ===
                "pending_review"
          );
    if (targetIdx < 0) return null;
    const targetQ = questions[targetIdx];
    return {
      key: targetQ.questionId || `q-${targetIdx}`,
      originalIndex: targetIdx,
    };
  }, [questions, counts.pending, activeEntry]);

  const handleSelectEntry = (key) => {
    setSelectedQuestionId(key);
  };

  const handleNavigatorKeyDown = (event, currentFilteredIdx) => {
    if (filteredEntries.length <= 1) return;
    let nextIdx = null;
    if (event.key === "ArrowDown") {
      nextIdx = (currentFilteredIdx + 1) % filteredEntries.length;
    } else if (event.key === "ArrowUp") {
      nextIdx =
        (currentFilteredIdx - 1 + filteredEntries.length) %
        filteredEntries.length;
    } else if (event.key === "Home") {
      nextIdx = 0;
    } else if (event.key === "End") {
      nextIdx = filteredEntries.length - 1;
    }
    if (nextIdx === null) return;
    event.preventDefault();
    const target = filteredEntries[nextIdx];
    if (!target) return;
    setSelectedQuestionId(target.key);
    const btn = navButtonRefs.current.get(target.key);
    btn?.focus();
  };

  const handleStepQuestion = (delta) => {
    if (filteredEntries.length === 0) return;
    const targetIdx = selectedFilteredIndex + delta;
    if (targetIdx < 0 || targetIdx >= filteredEntries.length) return;
    setSelectedQuestionId(filteredEntries[targetIdx].key);
  };

  const handleJumpNextPending = () => {
    if (!nextPendingEntry) return;
    if (statusFilter !== "all" && statusFilter !== "pending_review") {
      setStatusFilter("all");
    }
    setSelectedQuestionId(nextPendingEntry.key);
  };

  const handleConfirmBulkAction = async () => {
    if (!bulkConfirmType || actionLoading) return;
    const type = bulkConfirmType;
    setBulkConfirmType(null);
    if (type === "approve_pending") {
      const allPending = counts.pending === counts.total;
      await onReviewDecision({
        questionIds: allPending ? [] : pendingQuestionIds,
        reviewAll: allPending,
        decision: "approved",
      });
    } else if (type === "show_all") {
      await onReviewDecision({
        questionIds: [],
        reviewAll: true,
        decision: "approved",
      });
    } else if (type === "reject_all") {
      await onReviewDecision({
        questionIds: [],
        reviewAll: true,
        decision: "rejected",
      });
    }
  };

  if (questions.length === 0) return null;

  const approvedPercent =
    counts.total > 0 ? Math.round((counts.approved / counts.total) * 100) : 0;
  const rejectedPercent =
    counts.total > 0 ? Math.round((counts.rejected / counts.total) * 100) : 0;

  const activeCatMeta = activeQuestion
    ? getQuestionCategoryMeta(activeQuestion.category)
    : null;
  const activeRevMeta = activeQuestion
    ? getQuestionReviewMeta(activeQuestion.reviewStatus)
    : null;
  const activeReviewStatus = String(
    activeQuestion?.reviewStatus || "pending_review"
  ).toLowerCase();
  const segmentRefs = activeQuestion ? extractSegmentRefs(activeQuestion) : [];

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white"
      data-testid="generated-questions-workspace"
    >
      {/* Top Section Header & Context-Aware Bulk Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <FileCheck2 size={16} className="shrink-0 text-[#FF5C28]" />
            <h4 className="text-xs sm:text-sm font-bold text-[#042C51]">
              Generated Final Interview Questions
            </h4>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700">
              Generated Questions: {counts.total}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
            <span>
              Shown in Interview:{" "}
              <strong className="font-bold text-emerald-700">
                {counts.approved}
              </strong>
            </span>
            <span className="text-slate-300" aria-hidden="true">
              |
            </span>
            <span>
              Hidden:{" "}
              <strong className="font-bold text-rose-700">
                {counts.rejected}
              </strong>
            </span>
            {counts.pending > 0 ? (
              <>
                <span className="text-slate-300" aria-hidden="true">
                  |
                </span>
                <span>
                  Pending:{" "}
                  <strong className="font-bold text-amber-700">
                    {counts.pending}
                  </strong>
                </span>
              </>
            ) : null}
          </div>
        </div>

        {permissions.canReviewQuestions ? (
          <div className="flex flex-wrap items-center gap-2">
            {counts.pending > 0 ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setBulkConfirmType("approve_pending")}
                data-testid="approve-all-ai-questions-btn"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={13} />
                )}
                Approve All Pending ({counts.pending})
              </button>
            ) : counts.rejected > 0 ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setBulkConfirmType("show_all")}
                data-testid="show-all-ai-questions-btn"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={13} />
                )}
                Show All ({counts.total})
              </button>
            ) : null}

            {counts.rejected < counts.total ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setBulkConfirmType("reject_all")}
                data-testid="reject-all-ai-questions-btn"
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
              >
                <XCircle size={13} />
                Hide All
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Minimal Progress Bar + Completion Note */}
      <div className="border-b border-slate-100 px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="font-bold text-[#042C51]" data-testid="review-progress-label">
            {counts.reviewed} of {counts.total} Reviewed
          </span>
          {counts.pending === 0 ? (
            <span
              className="inline-flex items-center gap-1 font-semibold text-emerald-700"
              data-testid="all-questions-reviewed-banner"
            >
              <CheckCircle2 size={13} />
              All {counts.total} questions reviewed — {counts.approved} approved for Final Interview
            </span>
          ) : (
            <span className="text-slate-500">
              Select a question to inspect evidence and record your decision.
            </span>
          )}
        </div>
        <div
          className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={counts.reviewed}
          aria-valuemin={0}
          aria-valuemax={counts.total}
          aria-label={`${counts.reviewed} of ${counts.total} questions reviewed`}
        >
          {approvedPercent > 0 ? (
            <div
              className="h-full bg-emerald-500 transition-all duration-200"
              style={{ width: `${approvedPercent}%` }}
            />
          ) : null}
          {rejectedPercent > 0 ? (
            <div
              className="h-full bg-rose-400 transition-all duration-200"
              style={{ width: `${rejectedPercent}%` }}
            />
          ) : null}
        </div>
      </div>

      {/* Two-Panel Workspace: Navigator (Left) + Selected Question Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(250px,29%)_minmax(0,1fr)]">
        {/* Left Panel — Question Navigator */}
        <div className="flex flex-col border-b border-slate-200 bg-slate-50/40 lg:border-r lg:border-b-0">
          {/* Status Filters */}
          <div
            className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-3 py-2"
            role="tablist"
            aria-label="Filter questions by review status"
          >
            {FILTER_OPTIONS.filter(
              (opt) => opt.id !== "pending_review" || counts.pending > 0
            ).map((opt) => {
              const countForFilter =
                opt.id === "all"
                  ? counts.total
                  : opt.id === "pending_review"
                    ? counts.pending
                    : opt.id === "approved"
                      ? counts.approved
                      : counts.rejected;
              const isActive = statusFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setStatusFilter(opt.id)}
                  data-testid={`question-filter-${opt.id}`}
                  className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                    isActive
                      ? "bg-[#042C51] text-white"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {opt.label} ({countForFilter})
                </button>
              );
            })}
          </div>

          {/* Compact Vertical Question List */}
          <div
            className="max-h-56 divide-y divide-slate-200/70 overflow-y-auto sibs-scrollbar lg:max-h-[460px]"
            aria-label="Generated interview questions list"
          >
            {filteredEntries.length > 0 ? (
              filteredEntries.map(({ question, originalIndex, key }, idx) => {
                const isSelected = key === activeEntry?.key;
                const catMeta = getQuestionCategoryMeta(question.category);
                const revMeta = getQuestionReviewMeta(question.reviewStatus);
                const st = String(
                  question.reviewStatus || "pending_review"
                ).toLowerCase();

                return (
                  <button
                    key={key}
                    ref={(el) => {
                      if (el) navButtonRefs.current.set(key, el);
                      else navButtonRefs.current.delete(key);
                    }}
                    type="button"
                    onClick={() => handleSelectEntry(key)}
                    onKeyDown={(e) => handleNavigatorKeyDown(e, idx)}
                    aria-current={isSelected ? "true" : undefined}
                    data-testid={`question-nav-item-${originalIndex}`}
                    className={`w-full px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF5C28] ${
                      isSelected
                        ? "bg-[#EEF4FA] ring-1 ring-inset ring-[#042C51]/25"
                        : "bg-transparent hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          isSelected
                            ? "bg-[#042C51] text-white"
                            : "bg-slate-200/80 text-slate-700"
                        }`}
                      >
                        Q{originalIndex + 1}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${revMeta.badgeClass}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            st === "approved"
                              ? "bg-emerald-600"
                              : st === "rejected"
                                ? "bg-rose-600"
                                : "bg-amber-600"
                          }`}
                        />
                        {revMeta.label}
                      </span>
                    </div>

                    <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-snug text-[#042C51]">
                      {question.questionText}
                    </p>

                    <p className="mt-1 truncate text-[10px] font-medium text-slate-500">
                      {catMeta.label}
                    </p>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                No questions match this filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Panel — Selected Question Details */}
        <div
          className="flex min-w-0 flex-col justify-between p-4 sm:p-5"
          data-testid="selected-question-detail-panel"
        >
          {activeQuestion ? (
            <>
              <div className="space-y-4">
                {/* Question Hierarchy Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="space-y-0.5">
                    <p
                      className="text-xs font-bold text-[#042C51]"
                      data-testid="selected-question-counter"
                    >
                      Question {activeEntry.originalIndex + 1} of {questions.length}
                    </p>
                    <p className="text-[11px] font-medium text-slate-600">
                      Category: <span className="font-semibold text-slate-800">{activeCatMeta.label}</span>
                    </p>
                  </div>

                  <span
                    data-testid="selected-question-status-badge"
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${activeRevMeta.badgeClass}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    Status: {activeRevMeta.label}
                  </span>
                </div>

                {/* Prominent Interview Question Text */}
                <div>
                  <p className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                    Interview Question
                  </p>
                  <p
                    className="mt-1.5 text-[15px] sm:text-base font-bold leading-relaxed text-[#042C51]"
                    data-testid="selected-question-text"
                  >
                    {activeQuestion.questionText}
                  </p>
                </div>

                {/* Collapsible Supporting Sections */}
                <div className="space-y-2 pt-1">
                  {/* Source Evidence Accordion */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50/50">
                    <button
                      type="button"
                      aria-expanded={evidenceExpanded}
                      onClick={() => setEvidenceExpanded((prev) => !prev)}
                      data-testid="toggle-source-evidence-btn"
                      className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-xs font-bold text-[#042C51] transition hover:bg-slate-100/70"
                    >
                      <span className="inline-flex items-center gap-2">
                        <FileText size={14} className="text-[#FF5C28]" />
                        Source Evidence
                        <span className="font-normal text-slate-500">
                          (
                          {activeQuestion.sourceType === "resume_based"
                            ? "Resume-sourced evidence + JD"
                            : "Approved JD requirement"}
                          )
                        </span>
                      </span>
                      {evidenceExpanded ? (
                        <ChevronUp size={15} className="shrink-0 text-slate-500" />
                      ) : (
                        <ChevronDown size={15} className="shrink-0 text-slate-500" />
                      )}
                    </button>

                    {evidenceExpanded ? (
                      <div
                        className="space-y-2 border-t border-slate-200 bg-white px-3.5 py-3 text-xs text-slate-700"
                        data-testid="source-evidence-content"
                      >
                        <p className="text-[11px] font-semibold text-slate-600">
                          {activeQuestion.sourceType === "resume_based"
                            ? "Classification: Resume-sourced evidence (unverified applicant claim)"
                            : "Classification: Approved Job Description requirement"}
                        </p>

                        {activeQuestion.supportingExcerpt ? (
                          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-800">
                            {activeQuestion.supportingExcerpt}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">
                            No direct resume excerpt attached.
                          </p>
                        )}

                        {segmentRefs.length > 0 ? (
                          <p className="text-[11px] text-slate-600">
                            Source segment reference:{" "}
                            <span className="font-semibold text-[#042C51]">
                              {segmentRefs.join(", ")}
                            </span>
                          </p>
                        ) : null}

                        {activeQuestion.jdRequirementId ? (
                          <div className="rounded-md border border-emerald-200/80 bg-emerald-50/50 px-3 py-2 text-[11px] text-slate-700">
                            <span className="font-bold text-emerald-800">
                              Relevant JD Requirement ({activeQuestion.jdRequirementId}):
                            </span>{" "}
                            {matchedJdRequirement?.text ||
                              "Mapped to approved Job Description requirement."}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {/* Interviewer Guidance Accordion */}
                  {activeQuestion.interviewerGuidance ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50/50">
                      <button
                        type="button"
                        aria-expanded={guidanceExpanded}
                        onClick={() => setGuidanceExpanded((prev) => !prev)}
                        data-testid="toggle-interviewer-guidance-btn"
                        className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-xs font-bold text-[#042C51] transition hover:bg-slate-100/70"
                      >
                        <span className="inline-flex items-center gap-2">
                          <HelpCircle size={14} className="text-[#FF5C28]" />
                          Interviewer Guidance
                        </span>
                        {guidanceExpanded ? (
                          <ChevronUp size={15} className="shrink-0 text-slate-500" />
                        ) : (
                          <ChevronDown size={15} className="shrink-0 text-slate-500" />
                        )}
                      </button>

                      {guidanceExpanded ? (
                        <div
                          className="border-t border-slate-200 bg-white px-3.5 py-3 text-xs leading-relaxed text-slate-700"
                          data-testid="interviewer-guidance-content"
                        >
                          {activeQuestion.interviewerGuidance}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Bottom Controls: Question Approval Actions + Previous/Next Navigation */}
              <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-3.5 sm:flex-row sm:items-center sm:justify-between">
                {/* Per-Question Approval Controls */}
                {permissions.canReviewQuestions ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {activeReviewStatus === "pending_review" ? (
                      <>
                        <button
                          type="button"
                          disabled={actionLoading || !activeQuestion.questionId}
                          onClick={() =>
                            onReviewDecision({
                              questionIds: [activeQuestion.questionId],
                              reviewAll: false,
                              decision: "approved",
                            })
                          }
                          data-testid={`approve-question-btn-${activeEntry.originalIndex}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {actionLoading ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={13} />
                          )}
                          {actionLoading ? "Saving..." : "Approve"}
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading || !activeQuestion.questionId}
                          onClick={() =>
                            onReviewDecision({
                              questionIds: [activeQuestion.questionId],
                              reviewAll: false,
                              decision: "rejected",
                            })
                          }
                          data-testid={`reject-question-btn-${activeEntry.originalIndex}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                        >
                          <XCircle size={13} />
                          Reject
                        </button>
                      </>
                    ) : null}

                    {activeReviewStatus === "approved" ? (
                      <>
                        <span
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"
                          data-testid="selected-question-approved-state"
                        >
                          <CheckCircle2 size={13} />
                          Shown in Final Interview
                        </span>
                        <button
                          type="button"
                          disabled={actionLoading || !activeQuestion.questionId}
                          onClick={() =>
                            onReviewDecision({
                              questionIds: [activeQuestion.questionId],
                              reviewAll: false,
                              decision: "rejected",
                            })
                          }
                          data-testid={`reject-question-btn-${activeEntry.originalIndex}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                        >
                          {actionLoading ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <XCircle size={13} />
                          )}
                          Hide from Interview
                        </button>
                      </>
                    ) : null}

                    {activeReviewStatus === "rejected" ? (
                      <>
                        <span
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700"
                          data-testid="selected-question-rejected-state"
                        >
                          <XCircle size={13} />
                          Hidden from Interview
                        </span>
                        <button
                          type="button"
                          disabled={actionLoading || !activeQuestion.questionId}
                          onClick={() =>
                            onReviewDecision({
                              questionIds: [activeQuestion.questionId],
                              reviewAll: false,
                              decision: "approved",
                            })
                          }
                          data-testid={`approve-question-btn-${activeEntry.originalIndex}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                        >
                          {actionLoading ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={13} />
                          )}
                          Show in Interview
                        </button>
                      </>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-[11px] font-medium text-slate-500">
                    Read-only view
                  </span>
                )}

                {/* Question Navigation Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={selectedFilteredIndex <= 0}
                    onClick={() => handleStepQuestion(-1)}
                    data-testid="prev-question-btn"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#042C51] transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                    Previous Question
                  </button>

                  <button
                    type="button"
                    disabled={
                      selectedFilteredIndex < 0 ||
                      selectedFilteredIndex >= filteredEntries.length - 1
                    }
                    onClick={() => handleStepQuestion(1)}
                    data-testid="next-question-btn"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#042C51] transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next Question
                    <ChevronRight size={14} />
                  </button>

                  {nextPendingEntry ? (
                    <button
                      type="button"
                      onClick={handleJumpNextPending}
                      data-testid="next-pending-question-btn"
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                    >
                      <SkipForward size={13} />
                      Next Pending
                    </button>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-xs font-medium text-slate-600">
                No questions match the selected filter.
              </p>
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#042C51] hover:bg-slate-50"
              >
                Show All Questions
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compact Bulk Confirmation Modal */}
      <ConfirmModal
        open={Boolean(bulkConfirmType)}
        onClose={() => setBulkConfirmType(null)}
        onConfirm={handleConfirmBulkAction}
        loading={actionLoading}
        variant={bulkConfirmType === "reject_all" ? "danger" : "success"}
        closeOnEscape={true}
        title={
          bulkConfirmType === "reject_all"
            ? "Hide all generated questions?"
            : bulkConfirmType === "show_all"
              ? `Show all ${counts.total} questions in Final Interview?`
              : `Approve ${counts.pending} pending question${counts.pending === 1 ? "" : "s"}?`
        }
        description={
          bulkConfirmType === "reject_all"
            ? `This will hide all ${counts.total} generated interview question(s) from the Final Interview Form.`
            : bulkConfirmType === "show_all"
              ? `This will make all ${counts.total} generated interview question(s) visible in the Final Interview Form.`
              : `This will approve ${counts.pending} pending interview question${counts.pending === 1 ? "" : "s"} for the Final Interview Form. Already approved or rejected questions will not be changed.`
        }
        confirmLabel={
          bulkConfirmType === "reject_all"
            ? `Hide All (${counts.total})`
            : bulkConfirmType === "show_all"
              ? `Show All (${counts.total})`
              : `Approve ${counts.pending} Question${counts.pending === 1 ? "" : "s"}`
        }
        cancelLabel="Cancel"
      />
    </div>
  );
}
