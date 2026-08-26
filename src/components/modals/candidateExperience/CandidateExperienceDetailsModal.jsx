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
      className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[10000] flex h-dvh items-center justify-center p-2 font-jakarta sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Candidate Experience Details"
        className="sibs-modal-pop-in flex max-h-[90dvh] w-full max-w-4xl 2xl:max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl font-jakarta"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="shrink-0 bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5 font-jakarta">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
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

              <h2 className="mt-1.5 truncate text-base sm:text-lg 2xl:text-xl font-extrabold text-white">
                {record.candidateName || "Candidate Experience Details"}
              </h2>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 sibs-text-xs font-semibold text-white/75">
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
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-[8.5px] 2xl:text-[9.5px] font-extrabold uppercase tracking-wide text-blue-100">
                  OVERALL RATING:
                </span>
                <RatingStars rating={record.experienceRating} size={13} />
                <span className="text-[9.5px] 2xl:text-[10.5px] font-black text-amber-300">
                  ({Number(record.experienceRating || 0).toFixed(1)} / 5.0)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F9FC] p-3.5 sm:p-4 2xl:p-5 sibs-scrollbar font-jakarta">
          <div className="space-y-3.5 2xl:space-y-4">
            <section className="rounded-xl border border-[#E6ECF2] bg-white p-3 2xl:p-4 shadow-sm">
              <h3 className="text-[10px] 2xl:text-[11px] font-black uppercase tracking-wide text-[#042C51]">
                EVENT & EXIT OVERVIEW
              </h3>

              <div className="mt-2 grid grid-cols-2 gap-2.5 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] p-3 sm:grid-cols-5">
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

            <section className="rounded-xl border border-orange-200 bg-[#FFF7F3] p-3.5 2xl:p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="inline-flex items-center gap-1.5 text-[10px] 2xl:text-[11px] font-black uppercase tracking-wide text-[#FF5C28]">
                  <MessageSquareText size={14} />
                  CANDIDATE QUALITATIVE FEEDBACK (VOICE OF CANDIDATE)
                </h3>

                <span className="text-[9px] font-mono font-black text-[#FF5C28]">
                  Direct Raw Quote
                </span>
              </div>

              <blockquote className="mt-2.5 border-l-2 border-[#FF5C28] pl-3 text-[11px] font-semibold italic leading-4.5 text-[#173B5E] 2xl:text-xs">
                “{record.feedback || "No candidate qualitative feedback recorded."}”
              </blockquote>

              <div className="mt-2.5 rounded-lg border border-orange-200/80 bg-white/90 p-2.5 text-[10px] 2xl:text-[11px] leading-4 text-[#274A6B]">
                <strong className="font-black text-[#042C51]">
                  Root Cause Description:
                </strong>{" "}
                {rootCause}
              </div>
            </section>

            <CandidateJourney record={record} />

            <section className="flex flex-col gap-2 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-2.5 2xl:p-3 text-[10px] 2xl:text-[11px] sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex min-w-0 items-center gap-2 text-[#64748B]">
                <UserRound size={13} className="shrink-0 text-[#042C51]" />
                <span>
                  Assigned TA Recruiter:{" "}
                  <strong className="font-black text-[#042C51]">
                    {record.owner || record.recordedBy || "Unassigned"}
                  </strong>
                </span>
              </div>

              <div className="inline-flex min-w-0 items-center gap-2 font-mono text-[#64748B]">
                <FileText size={12} className="shrink-0 text-[#91A4BE]" />
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

        <footer className="flex shrink-0 items-center justify-end border-t border-[#DDE5EE] bg-[#F1F5F9] px-5 py-3 2xl:py-3.5 sm:px-6 font-jakarta">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#667085] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28]"
          >
            Close Experience Record
          </button>
        </footer>
      </div>
    </div>
  );
}