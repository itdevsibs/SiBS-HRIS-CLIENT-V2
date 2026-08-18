import React, { useMemo } from "react";
import {
  Clock3,
  ExternalLink,
  FileText,
  History,
  UserRound,
  X,
} from "lucide-react";

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
  const safeCandidate =
    candidate && typeof candidate === "object" ? candidate : {};

  const rawTimeline =
    safeCandidate.timeline ||
    safeCandidate.movementHistory ||
    safeCandidate.movement_history ||
    safeCandidate.movementTimeline ||
    safeCandidate.movement_timeline ||
    safeCandidate.pipelineTimeline ||
    safeCandidate.pipeline_timeline ||
    safeCandidate.history ||
    safeCandidate.pipelineHistory ||
    safeCandidate.pipeline_history ||
    [];

  if (Array.isArray(rawTimeline)) return rawTimeline;
  if (typeof rawTimeline === "string") {
    try {
      const parsed = JSON.parse(rawTimeline);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }

  return [];
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

function getTimelineSources(item = {}) {
  return [item, item.extra].filter(
    (source) => source && typeof source === "object",
  );
}

function getFirstValue(item, keys) {
  for (const source of getTimelineSources(item)) {
    for (const key of keys) {
      if (source[key] !== null && source[key] !== undefined && cleanText(source[key])) {
        return source[key];
      }
    }
  }

  return "";
}

function getTimelineFiles(item = {}) {
  const files = getFirstValue(item, [
    "files",
    "attachments",
    "assessmentFiles",
    "assessment_files",
  ]);

  if (Array.isArray(files)) return files;

  const fileName = getFirstValue(item, [
    "assessmentAttachmentName",
    "assessment_attachment_name",
    "assessmentFileName",
    "assessment_file_name",
    "fileName",
    "filename",
  ]);

  const fileUrl = getFirstValue(item, [
    "assessmentAttachmentUrl",
    "assessment_attachment_url",
    "assessmentFileUrl",
    "assessment_file_url",
    "fileUrl",
    "file_url",
    "url",
  ]);

  if (fileName || fileUrl) {
    return [
      {
        name: fileName || "Assessment Attachment",
        url: fileUrl,
        size: getFirstValue(item, [
          "assessmentAttachmentSize",
          "assessment_attachment_size",
          "fileSize",
          "file_size",
          "size",
        ]),
        type: getFirstValue(item, [
          "assessmentAttachmentType",
          "assessment_attachment_type",
          "fileType",
          "file_type",
          "type",
        ]),
      },
    ];
  }

  return [];
}

function getTimelineLinks(item = {}) {
  const links = [];
  const directLink = getFirstValue(item, [
    "assessmentLink",
    "assessment_link",
    "link",
    "assessmentUrl",
    "assessment_url",
  ]);

  if (directLink) {
    links.push({
      label: "Assessment",
      url: directLink,
    });
  }

  const interviewLink = getFirstValue(item, [
    "interviewLink",
    "interview_link",
    "meetingLink",
    "meeting_link",
  ]);

  if (interviewLink) {
    links.push({
      label: "Interview",
      url: interviewLink,
    });
  }

  return links;
}

function formatFileSize(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeTimelineItem(rawItem = {}, index = 0, fallbackStage = "") {
  const item =
    rawItem && typeof rawItem === "object"
      ? rawItem
      : { reason: cleanText(rawItem) };

  const stage = getTimelineStage(item, fallbackStage);
  const reason = getTimelineReason(item);
  const rawDate = getTimelineDate(item);
  const updatedBy = getUpdatedBy(item);

  const remarks = getFirstValue(item, [
    "remarks",
    "notes",
    "comment",
    "comments",
  ]);

  const score = getFirstValue(item, [
    "score",
    "assessmentScore",
    "assessment_score",
    "finalScore",
    "final_score",
    "interviewScore",
    "interview_score",
  ]);

  const result = getFirstValue(item, [
    "result",
    "assessmentResult",
    "assessment_result",
    "finalResult",
    "final_result",
    "interviewResult",
    "interview_result",
  ]);

  const links = getTimelineLinks(item);
  const files = getTimelineFiles(item);

  return {
    id: `${stage}-${rawDate || index}-${index}`,
    stage,
    reason,
    rawDate,
    updatedBy,
    remarks: remarks && remarks !== reason ? remarks : "",
    details: {
      score,
      result,
      links,
      files,
    },
  };
}

export function getMovementHistoryItems(candidate = {}) {
  const stage = getCandidateStage(candidate);
  const rawTimeline = getRawTimeline(candidate);
  const timeline = getVisibleCandidateTimeline(rawTimeline, stage);

  return timeline
    .slice()
    .sort((a, b) => getSortableTime(b) - getSortableTime(a))
    .map((item, index) => normalizeTimelineItem(item, index, stage));
}

export default function CandidateMovementHistoryDrawer({
  open = false,
  candidate = {},
  onClose,
  triggerRef,
}) {
  const currentStage = getCandidateStage(candidate);
  const timeline = useMemo(() => getMovementHistoryItems(candidate), [candidate]);

  if (!open) return null;

  function handleClose() {
    onClose?.();

    window.requestAnimationFrame(() => {
      triggerRef?.current?.focus?.();
    });
  }

  return (
    <div
      className="sibs-modal-backdrop-in absolute inset-0 z-[100] flex justify-end overflow-hidden"
      aria-hidden={!open}
    >
      {/* Dimmed Backdrop over entire modal */}
      <button
        type="button"
        tabIndex={0}
        aria-label="Close Movement History"
        onClick={handleClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] transition-opacity duration-300"
      />

      {/* Drawer Panel */}
      <aside
        aria-label="Candidate Movement History"
        className="sibs-modal-pop-in relative z-10 flex h-full w-full max-w-[440px] flex-col border-l border-[#D7DEE8] bg-white shadow-2xl"
      >
        {/* Drawer Header */}
        <header className="shrink-0 bg-[#042C51] px-5 py-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF5C28] text-white shadow-sm">
                <History size={17} strokeWidth={2.4} />
              </span>

              <div className="min-w-0">
                <h3 className="truncate text-xs font-extrabold uppercase tracking-wide text-white">
                  Movement History
                </h3>
                <p className="truncate text-[10px] font-semibold text-blue-100">
                  Candidate Pipeline Audit Trail ({timeline.length})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/10 text-blue-100 transition hover:bg-white/20 hover:text-white"
              aria-label="Close Movement History"
              title="Close"
            >
              <X size={17} />
            </button>
          </div>
        </header>

        {/* Live Status Bar */}
        <div className="shrink-0 border-b border-[#E6ECF2] bg-[#F8FAFC] px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-wide text-[#042C51] sm:text-[10px]">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
              LIVE STATUS
            </span>

            <span
              className={`max-w-[190px] truncate rounded-full border px-2.5 py-1 text-[8.5px] font-extrabold uppercase tracking-wide ${getStageClass(
                currentStage,
              )}`}
              title={currentStage}
            >
              {currentStage}
            </span>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-5 py-5">
          {timeline.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D6E0EA] bg-[#F8FAFC] px-4 py-8 text-center">
              <History className="mx-auto text-[#98A2B3]" size={24} />
              <p className="mt-2 text-xs font-extrabold text-[#042C51]">
                No movement history recorded yet
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#667085]">
                Stage transitions, evaluations, and notes will appear here.
              </p>
            </div>
          ) : (
            <div className="relative pl-5 sm:pl-6">
              <div className="absolute bottom-2 left-2 top-2 w-[2px] bg-[#E6ECF2]" />

              <div className="space-y-4">
                {timeline.map((item, index) => {
                  const isLatest = index === 0;
                  const { stage, reason, rawDate, updatedBy, remarks, details } = item;

                  return (
                    <article key={item.id} className="relative">
                      <span
                        className={`absolute -left-[21px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 bg-white sm:-left-[25px] ${
                          isLatest
                            ? "border-[#FF5C28] ring-4 ring-[#FFF0EB]"
                            : "border-[#98A2B3]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isLatest ? "bg-[#FF5C28]" : "bg-[#98A2B3]"
                          }`}
                        />
                      </span>

                      <div
                        className={`rounded-xl border p-3 sm:p-3.5 ${
                          isLatest
                            ? "border-[#FFD7C8] bg-[#FFFBF9] shadow-xs"
                            : "border-[#E6ECF2] bg-white"
                        }`}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-extrabold text-[#042C51]">
                                {stage}
                              </span>

                              {isLatest ? (
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

                        {(details.score || details.result) && (
                          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {details.score ? (
                              <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                                <p className="text-[8px] font-extrabold uppercase tracking-wide text-[#174A78]">
                                  Score
                                </p>
                                <p className="mt-0.5 text-xs font-extrabold text-[#042C51]">
                                  {details.score}
                                </p>
                              </div>
                            ) : null}
                            {details.result ? (
                              <div className="rounded-lg border border-blue-100 bg-white px-3 py-2">
                                <p className="text-[8px] font-extrabold uppercase tracking-wide text-[#174A78]">
                                  Result
                                </p>
                                <p className="mt-0.5 text-xs font-extrabold text-[#042C51]">
                                  {details.result}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        )}

                        {details.links.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {details.links.map((link) => (
                              <button
                                key={`${link.label}-${link.url}`}
                                type="button"
                                onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")}
                                className="flex w-full items-center justify-between gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-left text-[10px] font-extrabold text-blue-700 underline"
                              >
                                <span className="truncate">Open {link.label}</span>
                                <ExternalLink size={13} className="shrink-0 no-underline" />
                              </button>
                            ))}
                          </div>
                        )}

                        {details.files.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {details.files.map((file, fileIndex) => {
                              const name = cleanText(file.name || file.fileName || file.filename || file.title || "Attachment");
                              const url = cleanText(file.url || file.fileUrl || file.file_url || file.path || "");
                              const meta = [cleanText(file.type || file.mimeType), formatFileSize(file.size || file.fileSize)].filter(Boolean).join(" • ");

                              return (
                                <div key={`${name}-${fileIndex}`} className="flex items-center justify-between gap-3 rounded-lg border border-blue-100 bg-[#F8FAFC] px-3 py-2.5">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <FileText size={17} className="shrink-0 text-[#FF5C28]" />
                                    <div className="min-w-0">
                                      <p className="truncate text-[10px] font-extrabold text-[#042C51]">{name}</p>
                                      {meta ? <p className="mt-0.5 text-[9px] font-semibold text-[#667085]">{meta}</p> : null}
                                    </div>
                                  </div>
                                  {url ? (
                                    <button type="button" onClick={() => window.open(url, "_blank", "noopener,noreferrer")} className="shrink-0 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-[9px] font-extrabold text-blue-700">
                                      Open File
                                    </button>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        )}
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
