import React from "react";
import {
  BriefcaseBusiness,
  Building2,
  FileText,
  Mail,
  MessageSquareText,
  UserRound,
} from "lucide-react";
import { RatingStars, formatExperienceDate } from "../../recruitment/candidateExperience/presentation.jsx";
// ModalShell provides canonical .sibs-modal-close-btn
import { ModalShell } from "@/components/ui";

function formatRecordedDate(value) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function outcomeStyles(outcome) {
  return outcome === "Drop-off"
    ? {
      badge: "bg-sibs-orange text-white",
      text: "text-sibs-orange",
      label: "DROP-OFF",
    }
    : {
      badge: "bg-emerald-500 text-white",
      text: "text-emerald-600",
      label: "COMPLETED",
    };
}

function timelineStyles(status) {
  const normalized = String(status || "").toLowerCase();

  if (
    normalized.includes("drop") ||
    normalized.includes("failed") ||
    normalized.includes("withdraw")
  ) {
    return {
      dot: "bg-sibs-orange",
      badge: "bg-orange-100 text-sibs-orange",
    };
  }

  if (normalized.includes("pending") || normalized.includes("scheduled")) {
    return {
      dot: "bg-amber-400",
      badge: "bg-amber-100 text-amber-700",
    };
  }

  return {
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
  };
}

function OverviewItem({ label, value, valueClassName = "text-sibs-navy", pill = false }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-black uppercase tracking-wide text-sibs-faint">
        {label}
      </p>

      {pill ? (
        <span className="mt-1 inline-flex max-w-full rounded border border-sibs-border bg-sibs-cream-light px-1.5 py-0.5 text-[10px] font-bold text-sibs-navy">
          <span className="truncate">{value || "—"}</span>
        </span>
      ) : (
        <p className={`mt-1 break-words text-[11px] font-black leading-4 ${valueClassName}`}>
          {value || "—"}
        </p>
      )}
    </div>
  );
}

function CandidateJourney({ record }) {
  const timeline = Array.isArray(record?.stageTimeline) ? record.stageTimeline : [];

  return (
    <section>
      <h3 className="sibs-modal-section-title text-sibs-navy">
        STAGE TIMELINE CASCADE (CANDIDATE JOURNEY)
      </h3>

      <div className="mt-2 rounded-[14px] border border-sibs-border bg-sibs-surface px-4 py-3">
        {timeline.length > 0 ? (
          <div className="relative space-y-0">
            {timeline.map((item, index) => {
              const tone = timelineStyles(item.status);
              const isLast = index === timeline.length - 1;

              return (
                <div
                  key={item.id || `${item.stage}-${index}`}
                  className="relative flex min-h-8 items-center gap-3 pl-0"
                >
                  <div className="relative flex w-4 shrink-0 self-stretch justify-center">
                    {!isLast ? (
                      <span className="absolute left-1/2 top-5 bottom-[-4px] w-px -translate-x-1/2 bg-sibs-border" />
                    ) : null}

                    <span
                      className={`relative z-10 mt-1.5 h-3 w-3 rounded-full border-2 border-white shadow-sm ${tone.dot}`}
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 items-center justify-between gap-3 py-1.5">
                    <div className="min-w-0">
                      <span className="text-[11px] font-black text-sibs-navy">
                        {item.stage || "Unknown Stage"}
                      </span>
                      <span className="ml-2 text-[9px] font-bold text-sibs-faint">
                        ({item.date ? formatExperienceDate(item.date) : "Recent"})
                      </span>
                    </div>

                    <span
                      className={`shrink-0 rounded px-2.5 py-1 text-[9px] font-black uppercase ${tone.badge}`}
                    >
                      {item.status || "Completed"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-3 text-center text-[11px] font-semibold text-slate-400">
            No candidate journey timeline recorded.
          </div>
        )}
      </div>
    </section>
  );
}

export default function CandidateExperienceDetailsModal({ record, onClose }) {
  if (!record) return null;

  const outcome = outcomeStyles(record.outcome);
  const recordedDate =
    record.dateRecorded ||
    record.surveySubmittedAt ||
    record.updatedAt ||
    record.createdAt;

  const reasonCategory =
    record.dropOffCategory || record.feedbackCategory || "—";

  const rootCause =
    record.dropOffReason ||
    record.internalNote ||
    "No root cause description recorded.";

  return (
    <ModalShell
      open={Boolean(record)}
      onClose={onClose}
      variant="navy"
      maxWidth="max-w-4xl 2xl:max-w-5xl"
      title={record.candidateName || "Candidate Experience Details"}
      headerMeta={
        <div className="flex flex-wrap items-center gap-1.5 2xl:gap-2">
          <span className="rounded bg-white/10 px-2 py-0.5 2xl:px-2.5 2xl:py-1 text-[8.5px] 2xl:text-[9.5px] font-mono font-bold text-slate-100 ring-1 ring-white/15">
            Record ID: {record.id || "—"}
            {record.candidateId ? ` (${record.candidateId})` : ""}
          </span>

          <span
            className={`rounded px-2 py-0.5 2xl:px-2.5 2xl:py-1 text-[8.5px] 2xl:text-[9.5px] font-black uppercase ${outcome.badge}`}
          >
            {outcome.label}
          </span>

          <span className="rounded bg-white/10 px-2 py-0.5 2xl:px-2.5 2xl:py-1 text-[8.5px] 2xl:text-[9.5px] font-mono font-bold text-blue-100">
            Recorded: {formatRecordedDate(recordedDate)}
          </span>
        </div>
      }
      subtitle={
        <span className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 text-white/75">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 sibs-text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5">
              <Mail size={12} className="text-slate-300" />
              {record.candidateEmail || "—"}
            </span>

            <span className="hidden text-slate-400 sm:inline">•</span>

            <span className="inline-flex items-center gap-1.5">
              <BriefcaseBusiness size={12} className="text-slate-300" />
              {record.roleTitle || "—"}
            </span>

            <span className="hidden text-slate-400 sm:inline">•</span>

            <span className="inline-flex items-center gap-1.5">
              <Building2 size={12} className="text-slate-300" />
              {record.account || "—"}
            </span>
          </span>

          <span className="hidden text-slate-400 sm:inline">•</span>

          <span className="inline-flex items-center gap-2">
            <span className="text-[8.5px] 2xl:text-[9.5px] font-extrabold uppercase tracking-wide text-blue-100">
              OVERALL RATING:
            </span>
            <RatingStars rating={record.experienceRating} size={13} />
            <span className="text-[9.5px] 2xl:text-[10.5px] font-black text-amber-300">
              ({Number(record.experienceRating || 0).toFixed(1)} / 5.0)
            </span>
          </span>
        </span>
      }
      bodyClassName="bg-sibs-surface p-3.5 sm:p-4 2xl:p-5"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange"
        >
          Close Experience Record
        </button>
      }
    >
      <div className="space-y-3.5 2xl:space-y-4 font-jakarta">
        <section className="rounded-[10px] border border-sibs-border bg-white p-3 2xl:p-4 shadow-sm">
          <h3 className="sibs-modal-section-title text-sibs-navy">
            EVENT & EXIT OVERVIEW
          </h3>

          <div className="mt-2 grid grid-cols-2 gap-2.5 rounded-[10px] border border-sibs-border bg-sibs-surface p-3 sm:grid-cols-5">
            <OverviewItem label="Event Type" value={record.eventType} />
            <OverviewItem
              label="Final Status"
              value={outcome.label}
              valueClassName={outcome.text}
            />
            <OverviewItem label="Exit Stage" value={record.finalStage} />
            <OverviewItem label="Reason Category" value={reasonCategory} />
            <OverviewItem label="Feedback Tag" value={record.feedbackTag} pill />
          </div>
        </section>

        <section className="rounded-[10px] border border-sibs-orange/30 bg-sibs-cream-light p-3.5 2xl:p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="inline-flex items-center gap-1.5 sibs-modal-section-title text-sibs-orange">
              <MessageSquareText size={14} />
              CANDIDATE QUALITATIVE FEEDBACK (VOICE OF CANDIDATE)
            </h3>

            <span className="text-[9px] font-mono font-black text-sibs-orange">
              Direct Raw Quote
            </span>
          </div>

          <blockquote className="mt-2.5 border-l-2 border-sibs-orange pl-3 text-[11px] font-semibold italic leading-4.5 text-sibs-navy 2xl:text-xs">
            “{record.feedback || "No candidate qualitative feedback recorded."}”
          </blockquote>

          <div className="mt-2.5 rounded-[10px] border border-sibs-orange/20 bg-white/90 p-2.5 text-[10px] 2xl:text-[11px] leading-4 text-sibs-muted">
            <strong className="font-black text-sibs-navy">
              Root Cause Description:
            </strong>{" "}
            {rootCause}
          </div>
        </section>

        <CandidateJourney record={record} />

        <section className="flex flex-col gap-2 rounded-[10px] border border-sibs-border bg-sibs-surface p-2.5 2xl:p-3 text-[10px] 2xl:text-[11px] sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex min-w-0 items-center gap-2 text-sibs-muted">
            <UserRound size={13} className="shrink-0 text-sibs-navy" />
            <span>
              Assigned TA Recruiter:{" "}
              <strong className="font-black text-sibs-navy">
                {record.owner || record.recordedBy || "Unassigned"}
              </strong>
            </span>
          </div>

          <div className="inline-flex min-w-0 items-center gap-2 font-mono text-sibs-muted">
            <FileText size={12} className="shrink-0 text-sibs-faint" />
            <span>
              System Record ID:{" "}
              <strong className="font-black text-sibs-navy">
                {record.id || "—"}
              </strong>
            </span>
          </div>
        </section>
      </div>
    </ModalShell>
  );
}