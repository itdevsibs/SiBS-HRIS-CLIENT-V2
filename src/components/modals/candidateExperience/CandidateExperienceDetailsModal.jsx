import {
  BriefcaseBusiness,
  Building2,
  FileText,
  Mail,
  MessageSquareText,
  UserRound,
  X,
} from "lucide-react";
import { RatingStars, formatExperienceDate } from "../../recruitment/candidateExperience/presentation.jsx";

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
      badge: "bg-[#FF5C28] text-white",
      text: "text-[#FF5C28]",
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
      dot: "bg-[#FF5C28]",
      badge: "bg-[#FFE5DC] text-[#D84616]",
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

function OverviewItem({ label, value, valueClassName = "text-[#042C51]", pill = false }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-black uppercase tracking-wide text-[#91A4BE]">
        {label}
      </p>

      {pill ? (
        <span className="mt-1 inline-flex max-w-full rounded border border-blue-200 bg-[#E9F0FC] px-1.5 py-0.5 text-[10px] font-bold text-[#174A7C]">
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
  const timeline = Array.isArray(record.stageTimeline) ? record.stageTimeline : [];

  return (
    <section>
      <h3 className="text-[10px] font-black uppercase tracking-wide text-[#637A9A]">
        STAGE TIMELINE CASCADE (CANDIDATE JOURNEY)
      </h3>

      <div className="mt-2 rounded-xl border border-[#D7E0EB] bg-[#F8FAFC] px-4 py-3">
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
                      <span className="absolute left-1/2 top-5 bottom-[-4px] w-px -translate-x-1/2 bg-[#D7E0EB]" />
                    ) : null}

                    <span
                      className={`relative z-10 mt-1.5 h-3 w-3 rounded-full border-2 border-white shadow-sm ${tone.dot}`}
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 items-center justify-between gap-3 py-1.5">
                    <div className="min-w-0">
                      <span className="text-[11px] font-black text-[#042C51]">
                        {item.stage || "Unknown Stage"}
                      </span>
                      <span className="ml-2 text-[9px] font-bold text-[#A0AEC0]">
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
    <div
      className="sibs-modal-blur fixed inset-0 z-[10000] flex h-dvh items-center justify-center overflow-y-auto bg-[#042C51]/55 p-3 backdrop-blur-sm sm:p-5"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Candidate Experience Details"
        className="my-auto flex max-h-[94dvh] w-full max-w-[760px] flex-col overflow-hidden rounded-[18px] border border-white/70 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="bg-[#073A68] px-5 py-5 text-white sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-white/10 px-2.5 py-1 text-[9px] font-mono font-bold text-slate-100 ring-1 ring-white/15">
                  Record ID: {record.id || "—"}
                  {record.candidateId ? ` (${record.candidateId})` : ""}
                </span>

                <span
                  className={`rounded px-2.5 py-1 text-[9px] font-black uppercase ${outcome.badge}`}
                >
                  {outcome.label}
                </span>

                <span className="rounded bg-[#0A487F] px-2.5 py-1 text-[9px] font-mono font-bold text-blue-100">
                  Recorded: {formatRecordedDate(recordedDate)}
                </span>
              </div>

              <h2 className="mt-3 truncate text-[18px] font-black tracking-tight text-white sm:text-[19px]">
                {record.candidateName || "Candidate Experience Details"}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-slate-200 sm:text-[11px]">
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={13} className="text-slate-300" />
                  {record.candidateEmail || "—"}
                </span>

                <span className="hidden text-slate-400 sm:inline">•</span>

                <span className="inline-flex items-center gap-1.5">
                  <BriefcaseBusiness size={13} className="text-slate-300" />
                  {record.roleTitle || "—"}
                </span>

                <span className="hidden text-slate-400 sm:inline">•</span>

                <span className="inline-flex items-center gap-1.5">
                  <Building2 size={13} className="text-slate-300" />
                  {record.account || "—"}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-wide text-blue-100">
                  OVERALL RATING:
                </span>
                <RatingStars rating={record.experienceRating} size={14} />
                <span className="text-[10px] font-black text-amber-300">
                  ({Number(record.experienceRating || 0).toFixed(1)} / 5.0)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-blue-100 transition hover:bg-white/10 hover:text-white"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-white px-5 py-5 sm:px-6 sm:py-6">
          <div className="space-y-5">
            <section>
              <h3 className="text-[10px] font-black uppercase tracking-wide text-[#637A9A]">
                EVENT & EXIT OVERVIEW
              </h3>

              <div className="mt-2 grid grid-cols-2 gap-3 rounded-xl border border-[#D7E0EB] bg-[#F8FAFC] px-4 py-3 sm:grid-cols-5">
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

            <section className="rounded-xl border border-[#FFCAB8] bg-[#FFF0EB] px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-[#FF5C28]">
                  <MessageSquareText size={14} />
                  CANDIDATE QUALITATIVE FEEDBACK (VOICE OF CANDIDATE)
                </h3>

                <span className="text-[9px] font-mono font-black text-[#FF7A50]">
                  Direct Raw Quote
                </span>
              </div>

              <blockquote className="mt-3 border-l-2 border-[#FF5C28] pl-3 text-[11px] font-semibold italic leading-5 text-[#173B5E]">
                “{record.feedback || "No candidate qualitative feedback recorded."}”
              </blockquote>

              <div className="mt-3 rounded-lg border border-[#FFD7CA] bg-white/80 px-3 py-2 text-[10px] leading-4 text-[#274A6B]">
                <strong className="font-black text-[#073A68]">
                  Root Cause Description:
                </strong>{" "}
                {rootCause}
              </div>
            </section>

            <CandidateJourney record={record} />

            <section className="flex flex-col gap-3 rounded-xl border border-[#D7E0EB] bg-[#F8FAFC] px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex min-w-0 items-center gap-2 text-[#64748B]">
                <UserRound size={14} className="shrink-0 text-[#073A68]" />
                <span>
                  Assigned TA Recruiter:{" "}
                  <strong className="font-black text-[#073A68]">
                    {record.owner || record.recordedBy || "Unassigned"}
                  </strong>
                </span>
              </div>

              <div className="inline-flex min-w-0 items-center gap-2 font-mono text-[#64748B]">
                <FileText size={13} className="shrink-0 text-[#91A4BE]" />
                <span>
                  System Record ID:{" "}
                  <strong className="font-black text-[#425B78]">
                    {record.id || "—"}
                  </strong>
                </span>
              </div>
            </section>
          </div>
        </div>

        <footer className="flex justify-end bg-white px-5 pb-5 pt-1 sm:px-6 sm:pb-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#042C51] px-5 text-[11px] font-black text-white shadow-sm transition hover:bg-[#073A68] active:scale-[0.98]"
          >
            Close Experience Record
          </button>
        </footer>
      </div>
    </div>
  );
}