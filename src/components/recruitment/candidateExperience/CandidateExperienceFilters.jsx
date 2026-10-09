import React from "react";
import { RotateCcw } from "lucide-react";
import PaginationTable from "../../../services/pagination/PaginationTable";
import {
  getResponseSourceLabel,
  getSurveyStatusLabel,
  SURVEY_STATUS_OPTIONS,
} from "../../../lib/utils/candidateExperience/index.js";

const OUTCOME_OPTIONS = [
  { label: "All Outcomes", value: "All" },
  { label: "Completed", value: "Completed" },
  { label: "Drop-off", value: "Drop-off" },
];

const SURVEY_OPTIONS = SURVEY_STATUS_OPTIONS.map((value) => ({
  label: value === "All" ? "All Survey Statuses" : getSurveyStatusLabel(value),
  value,
}));

const RESPONSE_SOURCE_OPTIONS = [
  { label: "All Response Sources", value: "All" },
  { label: getResponseSourceLabel("candidate_survey"), value: "candidate_survey" },
  { label: getResponseSourceLabel("ta_manual"), value: "ta_manual" },
];

const RATING_OPTIONS = [
  { label: "All Ratings", value: "All" },
  ...[5, 4, 3, 2, 1].map((val) => ({ label: `${val} Star`, value: String(val) })),
];

export default function CandidateExperienceFilters({ filters, onChange, onClear }) {
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.outcome !== "All" ||
      filters.surveyStatus !== "All" ||
      filters.responseSource !== "All" ||
      filters.rating !== "All"
  );

  return (
    <PaginationTable
      filterLayout="ta-inline"
      showFilterPanel={false}
      showFilterHeader={false}
      showPagination={false}
      searchValue={filters.search}
      searchPlaceholder="Search candidate, email, role, account, owner..."
      onSearchChange={(val) =>
        onChange("search", typeof val === "string" ? val : val?.target?.value ?? "")
      }
      className="border-0 bg-transparent p-0 shadow-none font-jakarta"
      filters={[
        {
          key: "outcome",
          value: filters.outcome,
          options: OUTCOME_OPTIONS,
          onChange: (val) => onChange("outcome", val),
          includeAll: false,
          allLabel: "All Outcomes",
          label: "Outcome",
          placeholder: "All Outcomes",
          searchable: false,
          className: "w-full xl:w-[140px] 2xl:w-[165px] xl:flex-none",
        },
        {
          key: "surveyStatus",
          value: filters.surveyStatus,
          options: SURVEY_OPTIONS,
          onChange: (val) => onChange("surveyStatus", val),
          includeAll: false,
          allLabel: "All Survey Statuses",
          label: "Survey Status",
          placeholder: "All Survey Statuses",
          searchable: false,
          className: "w-full xl:w-[175px] 2xl:w-[205px] xl:flex-none",
        },
        {
          key: "responseSource",
          value: filters.responseSource,
          options: RESPONSE_SOURCE_OPTIONS,
          onChange: (val) => onChange("responseSource", val),
          includeAll: false,
          allLabel: "All Response Sources",
          label: "Response Source",
          placeholder: "All Response Sources",
          searchable: false,
          className: "w-full xl:w-[185px] 2xl:w-[215px] xl:flex-none",
        },
        {
          key: "rating",
          value: filters.rating,
          options: RATING_OPTIONS,
          onChange: (val) => onChange("rating", val),
          includeAll: false,
          allLabel: "All Ratings",
          label: "Rating",
          placeholder: "All Ratings",
          searchable: false,
          className: "w-full xl:w-[130px] 2xl:w-[155px] xl:flex-none",
        },
      ]}
      rightContent={
        <button
          type="button"
          onClick={onClear}
          disabled={!hasActiveFilters}
          className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-sibs-border disabled:hover:bg-white disabled:hover:text-sibs-muted xl:w-auto"
        >
          <RotateCcw size={14} />
          Clear
        </button>
      }
    />
  );
}
