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
    <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6 font-jakarta">
      <h2 className="sibs-card-title">
        Sourcing Channel Performance Directory
      </h2>

      <p className="sibs-card-subtitle">
        Search and filter sourcing channels by source,
        applicant activity, cost status, and hiring
        performance.
      </p>

      <div className="relative z-[90] mt-3.5 2xl:mt-4 overflow-visible">
        <PaginationTable
          filterLayout="ta-inline"
          showFilterPanel={false}
          showFilterHeader={false}
          showPagination={false}
          searchValue={searchInput}
          searchPlaceholder="Search by source or latest applicant..."
          onSearchChange={setSearchInput}
          onSearchKeyDown={handleSearchKeyDown}
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
              label: "Source",
              placeholder: "Search sources...",
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
              label: "Cost Status",
              placeholder: "All Cost Status",
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
              label: "Performance",
              placeholder: "All Performance",
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
              className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-sibs-border disabled:hover:bg-white disabled:hover:text-sibs-muted xl:w-auto"
            >
              <RotateCcw size={14} />
              Clear
            </button>
          }
        />
      </div>
    </div>
  );
}
