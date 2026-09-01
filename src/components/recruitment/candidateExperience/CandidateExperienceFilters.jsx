import { Filter, Search, X } from "lucide-react";
import ThemedDropdown from "@/components/layout/dropdown/ThemedDropdown.jsx";
import { getResponseSourceLabel, getSurveyStatusLabel, SURVEY_STATUS_OPTIONS } from "@/lib/utils/candidateExperience/index.js";

const labelClass = "mb-1 block font-jakarta sibs-text-micro font-extrabold tracking-normal text-sibs-navy";

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
    <div className="bg-white font-jakarta">
      <div className="flex flex-col gap-2.5 overflow-visible sm:flex-row sm:flex-wrap sm:items-end">
        {/* Search Field */}
        <div className="relative w-full min-w-0 sm:min-w-[220px] sm:flex-1">
          <label className={labelClass}>Search</label>
          <div className="group relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sibs-faint transition-colors group-focus-within:text-sibs-orange"
            />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onChange("search", e.target.value)}
              placeholder="Search candidate, email, role, account, owner..."
              className="h-8.5 2xl:h-10 w-full rounded-lg 2xl:rounded-xl border border-sibs-border-subtle bg-white px-3 pl-8.5 pr-8 sibs-text-xs font-semibold text-sibs-navy outline-none transition focus:border-sibs-orange focus:ring-2 focus:ring-sibs-orange/20"
            />
            {filters.search ? (
              <button
                type="button"
                onClick={() => onChange("search", "")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sibs-faint hover:text-sibs-navy"
              >
                <X size={13} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Outcome Filter */}
        <div className="w-full min-w-0 sm:w-[140px]">
          <label className={labelClass}>Outcome</label>
          <ThemedDropdown
            value={filters.outcome}
            options={OUTCOME_OPTIONS}
            onChange={(val) => onChange("outcome", val)}
            searchable={false}
            showPlaceholderOption={false}
            className="w-full"
          />
        </div>

        {/* Survey Status Filter */}
        <div className="w-full min-w-0 sm:w-[155px]">
          <label className={labelClass}>Survey Status</label>
          <ThemedDropdown
            value={filters.surveyStatus}
            options={SURVEY_OPTIONS}
            onChange={(val) => onChange("surveyStatus", val)}
            searchable={false}
            showPlaceholderOption={false}
            className="w-full"
          />
        </div>

        {/* Response Source Filter */}
        <div className="w-full min-w-0 sm:w-[165px]">
          <label className={labelClass}>Response Source</label>
          <ThemedDropdown
            value={filters.responseSource}
            options={RESPONSE_SOURCE_OPTIONS}
            onChange={(val) => onChange("responseSource", val)}
            searchable={false}
            showPlaceholderOption={false}
            className="w-full"
          />
        </div>

        {/* Rating Filter */}
        <div className="w-full min-w-0 sm:w-[125px]">
          <label className={labelClass}>Rating</label>
          <ThemedDropdown
            value={filters.rating}
            options={RATING_OPTIONS}
            onChange={(val) => onChange("rating", val)}
            searchable={false}
            showPlaceholderOption={false}
            className="w-full"
          />
        </div>

        {/* Clear Action Button */}
        <div className="flex w-full min-w-0 items-end sm:w-auto sm:flex-none">
          <button
            type="button"
            onClick={onClear}
            disabled={!hasActiveFilters}
            className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-1.5 rounded-lg 2xl:rounded-xl border border-sibs-border-subtle bg-white px-3.5 sibs-text-xs font-extrabold text-sibs-secondary transition hover:bg-sibs-surface disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Filter size={14} />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
