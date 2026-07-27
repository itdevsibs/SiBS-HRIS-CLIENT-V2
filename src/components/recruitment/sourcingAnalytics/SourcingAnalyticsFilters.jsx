import { useMemo } from "react";
import { RotateCcw } from "lucide-react";

import { usePagination } from "../../../services/context/PaginationContext";
import PaginationTable from "../../../services/pagination/PaginationTable";
import { useSourcingAnalytics } from "../../../services/context/SourcingContext";

const SOURCING_ENTITY = "sourcing-analytics";

const FALLBACK_SOURCING_OPTIONS = [
  "Employee Referral Program",
  "Print Ads (Billboards, Brochures, Flyers, Posters)",
  "Social Media Pages",
  "Social Media Ads",
  "Online Job Portals",
  "Walk In",
  "Word of Mouth",
  "Institutional Partnership",
  "External Referral Listings",
  "Job Fairs",
  "Employee Retention Program",
  "Others",
];

const COST_STATUS_OPTIONS = [
  { label: "All Cost Status", value: "All" },
  { label: "With Cost", value: "With Cost" },
  { label: "No Cost", value: "No Cost" },
];

const PERFORMANCE_OPTIONS = [
  { label: "All Performance", value: "All" },
  {
    label: "With Applicants",
    value: "With Applicants",
  },
  {
    label: "No Applicants",
    value: "No Applicants",
  },
  { label: "With Hires", value: "With Hires" },
  { label: "No Hires", value: "No Hires" },
];

function normalizeSourcingOption(option) {
  if (
    typeof option === "string" ||
    typeof option === "number"
  ) {
    return String(option).trim();
  }

  return String(
    option?.value ||
      option?.optionValue ||
      option?.option_value ||
      option?.label ||
      option?.optionLabel ||
      option?.option_label ||
      option?.name ||
      "",
  ).trim();
}

export default function SourcingAnalyticsFilters() {
  const {
    searchInput,
    setSearchInput,
    commitSearch,
    resetFilters,
    filterValues,
    setFilter,
  } = usePagination(SOURCING_ENTITY);

  const {
    sourcingOptions = [],
    clearFilters,
  } = useSourcingAnalytics();

  const sourceOptions = useMemo(() => {
    const normalized = [
      ...new Set(
        (Array.isArray(sourcingOptions)
          ? sourcingOptions
          : []
        )
          .map(normalizeSourcingOption)
          .filter(Boolean),
      ),
    ].sort((left, right) =>
      left.localeCompare(right),
    );

    const values =
      normalized.length > 0
        ? normalized
        : FALLBACK_SOURCING_OPTIONS;

    return [
      { label: "All Sources", value: "All" },
      ...values.map((value) => ({
        label: value,
        value,
      })),
    ];
  }, [sourcingOptions]);

  const source = filterValues?.source || "All";
  const costStatus =
    filterValues?.costStatus || "All";
  const performance =
    filterValues?.performance || "All";

  const hasActiveFilters =
    Boolean(String(searchInput || "").trim()) ||
    source !== "All" ||
    costStatus !== "All" ||
    performance !== "All";

  function handleSearchKeyDown(event) {
    if (event.key !== "Enter") return;

    event.preventDefault();
    commitSearch();
  }

  function handleClearAll() {
    setSearchInput("");
    resetFilters();
    setFilter("source", "All");
    setFilter("costStatus", "All");
    setFilter("performance", "All");
    clearFilters?.();
  }

  return (
    <>
      <div className="rounded-t-2xl border-b border-[#E6ECF2] bg-white px-4 py-5 font-jakarta sm:px-5">
        <h2 className="sibs-section-title">
          Sourcing Channel Performance Directory
        </h2>

        <p className="sibs-section-subtitle">
          Search and filter sourcing channels by source,
          applicant activity, cost status, and hiring
          performance.
        </p>
      </div>

      <div className="relative overflow-visible p-4 font-jakarta sm:p-5">
        <PaginationTable
          filterLayout="ta-inline"
          showFilterPanel={false}
          showFilterHeader={false}
          showPagination={false}
          searchValue={searchInput}
          searchPlaceholder="Search by source or latest applicant..."
          onSearchChange={setSearchInput}
          onSearchKeyDown={handleSearchKeyDown}
          controlsClassName="flex flex-col gap-3 overflow-visible sm:flex-row sm:items-center"
          searchClassName="relative min-w-0 flex-1"
          className="border-0 bg-transparent p-0 shadow-none"
          filters={[
            {
              key: "source",
              value: source,
              options: sourceOptions,
              onChange: (value) =>
                setFilter("source", value),
              searchable: true,
              includeAll: false,
              allLabel: "All Sources",
              placeholder: "Search sources...",
              className:
                "w-full sm:w-[210px] xl:w-[245px]",
            },
            {
              key: "costStatus",
              value: costStatus,
              options: COST_STATUS_OPTIONS,
              onChange: (value) =>
                setFilter("costStatus", value),
              searchable: false,
              includeAll: false,
              allLabel: "All Cost Status",
              placeholder: "All Cost Status",
              className:
                "w-full sm:w-[165px] xl:w-[185px]",
            },
            {
              key: "performance",
              value: performance,
              options: PERFORMANCE_OPTIONS,
              onChange: (value) =>
                setFilter("performance", value),
              searchable: false,
              includeAll: false,
              allLabel: "All Performance",
              placeholder: "All Performance",
              className:
                "w-full sm:w-[175px] xl:w-[195px]",
            },
          ]}
          onReset={handleClearAll}
          resetLabel={
            hasActiveFilters ? "Reset filters" : "Clear"
          }
          rightContent={
            <button
              type="button"
              onClick={handleClearAll}
              disabled={!hasActiveFilters}
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#E6ECF2] bg-white px-3 text-xs font-extrabold text-[#98A2B3] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF7F3] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#E6ECF2] disabled:hover:bg-white disabled:hover:text-[#98A2B3] sm:w-auto"
            >
              <RotateCcw size={14} />
              Clear
            </button>
          }
        />
      </div>
    </>
  );
}