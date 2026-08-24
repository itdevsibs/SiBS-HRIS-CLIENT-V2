import { CalendarDays } from "lucide-react";
import { OutcomeBadge, RatingStars, ResponseSourceBadge, SurveyStatusBadge, formatExperienceDate } from "./presentation.jsx";

export default function CandidateExperienceMobileCards({ records, onSelect }) {
  if (!records.length) {
    return (
      <div className="md:hidden rounded-xl border border-dashed border-[#D6DEE8] bg-[#F8FAFC] p-8 text-center text-xs font-bold text-[#667085] font-jakarta">
        No candidate experience records match the current filters.
      </div>
    );
  }

  return (
    <div className="space-y-2.5 md:hidden font-jakarta">
      {records.map((record, index) => (
        <button
          key={record.id}
          type="button"
          onClick={() => onSelect(record)}
          className="sibs-page-card-in w-full rounded-xl border border-[#E6ECF2] bg-white p-3.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
          style={{ animationDelay: `${index * 40}ms`, animationFillMode: "both" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-xs 2xl:text-sm font-extrabold text-[#042C51]">
                {record.candidateName || "Unnamed Candidate"}
              </h3>
              <p className="mt-0.5 truncate text-[10px] font-mono text-[#667085]">
                {record.candidateEmail || record.candidateId || "—"}
              </p>
            </div>
            <OutcomeBadge outcome={record.outcome} />
          </div>

          <p className="mt-2.5 text-xs font-bold text-[#344054]">
            {record.roleTitle || "—"}
            <span className="font-normal text-[#667085]"> / </span>
            {record.account || "—"}
          </p>

          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <Tile label="Final Stage" value={record.finalStage || "—"} />

            <div className="rounded-lg bg-[#F8FAFC] p-2.5 border border-[#E6ECF2]">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#667085]">
                Survey Status
              </p>
              <div className="mt-1">
                <SurveyStatusBadge status={record.surveyStatus} />
              </div>
            </div>

            <div className="rounded-lg bg-[#F8FAFC] p-2.5 border border-[#E6ECF2]">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#667085]">
                Response Source
              </p>
              <div className="mt-1">
                <ResponseSourceBadge source={record.responseSource} />
              </div>
            </div>

            <div className="rounded-lg bg-[#F8FAFC] p-2.5 border border-[#E6ECF2]">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#667085]">
                Rating
              </p>
              <div className="mt-1">
                <RatingStars rating={record.experienceRating} />
              </div>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between border-t border-[#E6ECF2] pt-2.5 text-[10px] text-[#667085]">
            <span className="font-bold text-[#042C51]">
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
    <div className="rounded-lg bg-[#F8FAFC] p-2.5 border border-[#E6ECF2]">
      <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#667085]">{label}</p>
      <p className="mt-1 truncate text-xs font-bold text-[#344054]">{value}</p>
    </div>
  );
}
