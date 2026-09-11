import React from "react";
import { CalendarDays, MessageSquareText } from "lucide-react";
import { DataCard } from "@/components/ui";
import {
  OutcomeBadge,
  RatingStars,
  ResponseSourceBadge,
  SurveyStatusBadge,
  formatExperienceDate,
} from "./presentation.jsx";

export default function CandidateExperienceMobileCards({
  records = [],
  onSelect,
  loading = false,
}) {
  if (loading) {
    return <DataCard.Skeleton count={4} lines={3} />;
  }

  if (!records.length) {
    return (
      <DataCard.Empty
        title="No candidate experience records found"
        hint="No candidate feedback entries match the current filter selection."
      />
    );
  }

  return (
    <div className="space-y-3 font-jakarta">
      {records.map((record, index) => {
        const initials = String(record.candidateName || "C")
          .trim()
          .slice(0, 2)
          .toUpperCase();
        const candidateId = record.candidateId || record.id;
        const feedbackExcerpt = record.candidateFeedback || record.feedback;

        return (
          <DataCard
            key={record.id || `${candidateId}-${index}`}
            index={index}
            onClick={() => onSelect?.(record)}
          >
            <DataCard.Header
              avatar={
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#042C51] text-xs font-bold text-white shadow-xs">
                  {initials}
                </span>
              }
              title={record.candidateName || "Unnamed Candidate"}
              subtitle={
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#667085]">
                  <span>{candidateId}</span>
                  {record.candidateEmail && (
                    <>
                      <span>•</span>
                      <span className="truncate">{record.candidateEmail}</span>
                    </>
                  )}
                </span>
              }
              badge={
                <div className="flex flex-col items-end gap-1">
                  <OutcomeBadge outcome={record.outcome} />
                  {record.surveyStatus && (
                    <SurveyStatusBadge status={record.surveyStatus} />
                  )}
                </div>
              }
            />

            <DataCard.ContextRow>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-extrabold text-[#042C51]">
                  {record.roleTitle || "—"}
                </span>
                <span className="text-[#98A2B3]">•</span>
                <span className="font-semibold text-[#475467]">
                  {record.account || "—"}
                </span>
                {record.responseSource && (
                  <span className="ml-auto">
                    <ResponseSourceBadge source={record.responseSource} />
                  </span>
                )}
              </div>
            </DataCard.ContextRow>

            <DataCard.Metrics cols={3}>
              <DataCard.MetricItem
                label="Final Stage"
                value={record.finalStage || "—"}
                tone="secondary"
              />
              <DataCard.MetricItem
                label="Category"
                value={record.feedbackCategory || record.dropOffCategory || "—"}
                tone="default"
              />
              <div className="flex flex-col items-center justify-center py-1">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#667085]">
                  Rating
                </span>
                <div className="mt-1 flex items-center gap-1">
                  <RatingStars rating={record.experienceRating} />
                  <span className="font-mono text-xs font-bold text-[#042C51]">
                    {record.experienceRating ? `${record.experienceRating}/5` : "—"}
                  </span>
                </div>
              </div>
            </DataCard.Metrics>

            {feedbackExcerpt && (
              <div className="mt-2.5 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] p-2.5">
                <div className="flex items-start gap-1.5 text-xs italic text-[#475467]">
                  <MessageSquareText
                    size={13}
                    className="mt-0.5 shrink-0 text-[#FF5C28]"
                  />
                  <p className="line-clamp-2 leading-relaxed">
                    “{feedbackExcerpt}”
                  </p>
                </div>
              </div>
            )}

            <DataCard.Footer
              meta={
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#667085]">
                  <CalendarDays size={12} className="text-[#98A2B3]" />
                  {formatExperienceDate(
                    record.surveySubmittedAt || record.dateRecorded || record.createdAt
                  )}
                </span>
              }
              actionText="Details"
            />
          </DataCard>
        );
      })}
    </div>
  );
}

