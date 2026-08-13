import React, { useMemo } from "react";
import { Clock3, History, UserRound, X } from "lucide-react";

import { formatDateTime } from "../../../lib/utils/candidatePipeline/candidatePipelineFormatters";
import { getStageClass } from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";
import { getVisibleCandidateTimeline } from "../../../lib/utils/candidatePipeline/candidatePipelineStageVisibility";

function cleanText(value) {
  return String(value ?? "").trim();
}

function getCandidateStage(candidate = {}) {
  return cleanText(
    candidate.currentStage ||
      candidate.currentPipelineStage ||
      candidate.pipelineStage ||
      candidate.stage ||
      "Initial Screening",
  );
}

function getRawTimeline(candidate = {}) {
  const timeline =
    candidate.timeline ||
    candidate.movementHistory ||
    candidate.movement_history ||
    candidate.history ||
    [];

  return Array.isArray(timeline) ? timeline : [];
}

function getTimelineDate(item = {}) {
  return (
    item.date ||
    item.createdAt ||
    item.created_at ||
    item.updatedAt ||
    item.updated_at ||
    item.timestamp ||
    ""
  );
}

function getTimelineStage(item = {}, fallbackStage = "") {
  return cleanText(
    item.stage ||
      item.currentStage ||
      item.current_stage ||
      item.pipelineStage ||
      item.pipeline_stage ||
      item.status ||
      fallbackStage ||
      "Pipeline Update",
  );
}

function getTimelineReason(item = {}) {
  return cleanText(
    item.reason ||
      item.description ||
      item.message ||
      item.action ||
      item.remarks ||
      item.note ||
      "Candidate pipeline record updated.",
  );
}

function getUpdatedBy(item = {}) {
  return cleanText(
    item.updatedBy ||
      item.updated_by ||
      item.createdBy ||
      item.created_by ||
      item.user ||
      item.actor ||
      "System",
  );
}

function getSortableTime(item = {}) {
  const value = getTimelineDate(item);
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getMovementHistoryItems(candidate = {}) {
  const currentStage = getCandidateStage(candidate);
  const rawTimeline = getRawTimeline(candidate);

  let visibleTimeline = rawTimeline;

  try {
    visibleTimeline = getVisibleCandidateTimeline(rawTimeline, currentStage);
  } catch {
    visibleTimeline = rawTimeline;
  }

  return [...visibleTimeline]
    .filter(Boolean)
    .sort((first, second) => getSortableTime(second) - getSortableTime(first));
}

export default function CandidateMovementHistoryDrawer({
  open = false,
  candidate = {},
  onClose,
  triggerRef,
}) {
  const currentStage = getCandidateStage(candidate);
  const timeline = useMemo(() => getMovementHistoryItems(candidate), [candidate]);

  function handleClose() {
    onClose?.();

    window.requestAnimationFrame(() => {
      triggerRef?.current?.focus?.();
    });
  }

  return (
    <div
      className={`absolute inset-0 z-[80] overflow-hidden transition ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close Movement History"
        onClick={handleClose}
        className={`absolute inset-0 bg-[#042C51]/20 backdrop-blur-[1px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        aria-label="Candidate Movement History"
        className={`absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col border-l border-[#D7DEE8] bg-white shadow-[-18px_0_40px_rgba(4,44,81,0.18)] transition-transform duration-300 ease-out max-sm:max-w-none ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="shrink-0 bg-[#042C51] px-4 py-4 text-white sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF5C28] text-white shadow-sm">
                <History size={17} strokeWidth={2.4} />
              </span>

              <div className="min-w-0">
                <h3 className="truncate text-xs font-extrabold uppercase tracking-wide">
                  Movement History
                </h3>
                <p className="mt-0.5 truncate text-[9px] font-semibold text-white/65 sm:text-[10px]">
                  Candidate Pipeline Audit Trail
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Close Movement History"
            >
              <X size={17} />
            </button>
          </div>
        </header>

        <div className="shrink-0 border-b border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-wide text-[#042C51] sm:text-[10px]">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
              LIVE STATUS
            </span>

            <span
              className={`max-w-[190px] truncate rounded-full border px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-wide sm:text-[9px] ${getStageClass(
                currentStage,
              )}`}
              title={currentStage}
            >
              {currentStage}
            </span>
          </div>
        </div>

        <div className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-4 py-4 sm:px-5 sm:py-5">
          {timeline.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D6E0EA] bg-[#F8FAFC] px-4 py-8 text-center">
              <History className="mx-auto text-[#98A2B3]" size={24} />
              <p className="mt-3 text-xs font-extrabold text-[#042C51]">
                No movement history yet
              </p>
              <p className="mt-1 text-[10px] font-semibold leading-4 text-[#667085]">
                Candidate stage movements will appear here.
              </p>
            </div>
          ) : (
            <div className="relative">
              <span
                aria-hidden="true"
                className="absolute bottom-4 left-[11px] top-4 w-px bg-[#D7E3F0]"
              />

              <div className="space-y-4">
                {timeline.map((item, index) => {
                  const latest = index === 0;
                  const stage = getTimelineStage(item, currentStage);
                  const reason = getTimelineReason(item);
                  const updatedBy = getUpdatedBy(item);
                  const rawDate = getTimelineDate(item);
                  const remarks = cleanText(
                    item.remarks || item.remark || item.notes || "",
                  );

                  return (
                    <article
                      key={
                        item.id ||
                        item.timelineId ||
                        `${stage}-${rawDate}-${index}`
                      }
                      className="relative pl-8"
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute left-0 top-3 z-10 inline-flex h-[23px] w-[23px] items-center justify-center rounded-full border-4 border-white shadow-sm ${
                          latest ? "bg-[#FF5C28]" : "bg-[#94A9C1]"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      </span>

                      <div
                        className={`rounded-xl border p-3.5 transition sm:p-4 ${
                          latest
                            ? "border-orange-200 bg-[#FFF9F6] shadow-[0_8px_20px_rgba(255,92,40,0.08)]"
                            : "border-[#E6ECF2] bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-[11px] font-extrabold text-[#042C51] sm:text-xs">
                                {stage}
                              </h4>

                              {latest ? (
                                <span className="rounded bg-[#FF5C28] px-1.5 py-0.5 text-[7px] font-extrabold uppercase tracking-wide text-white sm:text-[8px]">
                                  LATEST
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-semibold text-[#667085]">
                              <span className="inline-flex items-center gap-1">
                                <UserRound size={11} className="text-[#98A2B3]" />
                                {updatedBy}
                              </span>

                              {rawDate ? (
                                <span className="inline-flex items-center gap-1">
                                  <Clock3 size={11} className="text-[#98A2B3]" />
                                  {formatDateTime(rawDate) || rawDate}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 rounded-lg border border-[#E6ECF2] bg-white px-3 py-2.5 text-[10px] font-semibold leading-4 text-[#475467] sm:text-[11px] sm:leading-5">
                          {reason}
                        </div>

                        {remarks && remarks !== reason ? (
                          <p className="mt-2 text-[9px] font-semibold leading-4 text-[#667085] sm:text-[10px]">
                            {remarks}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
