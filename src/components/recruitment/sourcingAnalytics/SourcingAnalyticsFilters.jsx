import React from "react";
import { Filter, Search } from "lucide-react";
import { usePagination } from "../../../services/context/PaginationContext";
import { useSourcingAnalytics } from "../../../services/context/SourcingContext";

const sourcingOptions = [
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

function SearchFilterSelect({
  label,
  entityKey,
  filterKey,
  options,
  allLabel,
}) {
  const { filterValues, setFilter } = usePagination(entityKey);
  const currentValue = filterValues?.[filterKey] || "All";

  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-bold text-[#101828]">
        {label}
      </label>

      <select
        value={currentValue}
        onChange={(event) => setFilter(filterKey, event.target.value)}
        className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
      >
        <option value="All">{allLabel}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function SourcingAnalyticsFilters() {
  const {
    searchInput,
    setSearchInput,
    commitSearch,
    resetFilters,
    filterValues,
    setFilter,
  } = usePagination("sourcing-analytics");

  const { clearFilters } = useSourcingAnalytics();

  const hasActiveFilters =
    Boolean(searchInput?.trim()) ||
    (filterValues?.source && filterValues.source !== "All") ||
    (filterValues?.costStatus && filterValues.costStatus !== "All") ||
    (filterValues?.performance && filterValues.performance !== "All");

  function handleClearAll() {
    setSearchInput("");
    resetFilters();

    setFilter("source", "All");
    setFilter("costStatus", "All");
    setFilter("performance", "All");

    clearFilters?.();
  }

  return (
    <div className="border-b border-[#E6ECF2] bg-white px-4 py-5 sm:px-5 lg:px-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_280px_220px_220px_110px] xl:items-end">
        <div>
          <label className="mb-1.5 block text-sm font-bold text-[#101828]">
            Search
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
            />

            <input
              value={searchInput || ""}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitSearch();
              }}
              placeholder="Search source or latest applicant then press Enter..."
              className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </div>
        </div>

        <SearchFilterSelect
          label="Sourcing Option"
          entityKey="sourcing-analytics"
          filterKey="source"
          allLabel="All Sources"
          options={sourcingOptions}
        />

        <SearchFilterSelect
          label="Cost Status"
          entityKey="sourcing-analytics"
          filterKey="costStatus"
          allLabel="All Cost Status"
          options={["With Cost", "No Cost"]}
        />

        <SearchFilterSelect
          label="Performance"
          entityKey="sourcing-analytics"
          filterKey="performance"
          allLabel="All Performance"
          options={[
            "With Applicants",
            "No Applicants",
            "With Hires",
            "No Hires",
          ]}
        />

        <button
          type="button"
          onClick={handleClearAll}
          disabled={!hasActiveFilters}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Filter size={17} />
          Clear
        </button>
      </div>
    </div>
  );
}