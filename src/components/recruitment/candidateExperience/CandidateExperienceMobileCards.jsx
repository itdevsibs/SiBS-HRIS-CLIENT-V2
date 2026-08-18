import { CalendarDays } from "lucide-react";
import { OutcomeBadge, RatingStars, ResponseSourceBadge, SurveyStatusBadge, formatExperienceDate } from "./presentation.jsx";

export default function CandidateExperienceMobileCards({ records, onSelect }) {
  if (!records.length) {
    return (
      <div className="md:hidden rounded-xl border border-dashed border-sibs-subtle-border bg-sibs-surface p-8 text-center text-xs font-bold text-sibs-tertiary-6 font-jakarta">
        No candidate experience records match the current filters.
      </div>
    );
  }

  return (
    <div className="space-y-3 md:hidden font-jakarta">
      {records.map((record, index) => (
        <button
          key={record.id}
          type="button"
          onClick={() => onSelect(record)}
          className="sibs-page-card-in w-full rounded-2xl border border-sibs-subtle-border bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-tertiary-8 hover:shadow-md active:scale-[0.99]"
          style={{ animationDelay: `${index * 45}ms`, animationFillMode: "both" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-extrabold text-sibs-primary-1">
                {record.candidateName || "Unnamed Candidate"}
              </h3>
              <p className="mt-0.5 truncate text-[10px] font-mono text-sibs-tertiary-6">
                {record.candidateEmail || record.candidateId || "—"}
              </p>
            </div>
            <OutcomeBadge outcome={record.outcome} />
          </div>

          <p className="mt-3 text-xs font-bold text-[#344054]">
            {record.roleTitle || "—"}
            <span className="font-normal text-sibs-tertiary-6"> / </span>
            {record.account || "—"}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Tile label="Final Stage" value={record.finalStage || "—"} />

            <div className="rounded-xl bg-sibs-surface p-3 border border-sibs-subtle-border/60">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-sibs-tertiary-6">
                Survey Status
              </p>
              <div className="mt-1">
                <SurveyStatusBadge status={record.surveyStatus} />
              </div>
            </div>

            <div className="rounded-xl bg-sibs-surface p-3 border border-sibs-subtle-border/60">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-sibs-tertiary-6">
                Response Source
              </p>
              <div className="mt-1">
                <ResponseSourceBadge source={record.responseSource} />
              </div>
            </div>

            <div className="rounded-xl bg-sibs-surface p-3 border border-sibs-subtle-border/60">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-sibs-tertiary-6">
                Rating
              </p>
              <div className="mt-1">
                <RatingStars rating={record.experienceRating} />
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-sibs-subtle-border/60 pt-3 text-[10px] text-sibs-tertiary-6">
            <span className="font-bold text-sibs-primary-1">
              {record.feedbackCategory || "No category yet"}
            </span>
            <span className="inline-flex items-center gap-1 font-mono">
              <CalendarDays size={12} />
              {formatExperienceDate(record.surveySubmittedAt || record.dateRecorded)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

function Tile({ label, value }) {
  return (
    <div className="rounded-xl bg-sibs-surface p-3 border border-sibs-subtle-border/60">
      <p className="text-[9px] font-extrabold uppercase tracking-wider text-sibs-tertiary-6">{label}</p>
      <p className="mt-1 truncate text-xs font-bold text-[#344054]">{value}</p>
    </div>
  );
}
