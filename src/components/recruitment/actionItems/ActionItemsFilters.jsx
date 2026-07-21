import React from "react";
import { Filter, Search } from "lucide-react";
import { usePagination } from "../../../services/context/PaginationContext.jsx";
import {
  GAP_OPTIONS,
  MODULE_OPTIONS,
  OWNER_OPTIONS,
  RISK_OPTIONS,
  STATUS_OPTIONS,
} from "../../../lib/utils/actionItems/actionItemsConstants.js";

const ENTITY_KEY = "action-items";

function FilterSelect({ label, filterKey, options }) {
  const { filterValues, setFilter } = usePagination(ENTITY_KEY);
  const currentValue = filterValues?.[filterKey] || options[0];

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
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ActionItemsFilters() {
  const {
    searchInput,
    setSearchInput,
    commitSearch,
    resetFilters,
    setFilter,
    filterValues,
  } = usePagination(ENTITY_KEY);

  const hasActiveFilters = Boolean(
    searchInput ||
      (filterValues?.status && filterValues.status !== "All Status") ||
      (filterValues?.risk && filterValues.risk !== "All Risk") ||
      (filterValues?.module && filterValues.module !== "All Modules") ||
      (filterValues?.gap && filterValues.gap !== "All Gaps") ||
      (filterValues?.owner && filterValues.owner !== "All Owners"),
  );

  function handleClearAll() {
    setSearchInput("");
    resetFilters();
    setFilter("status", "All Status");
    setFilter("risk", "All Risk");
    setFilter("module", "All Modules");
    setFilter("gap", "All Gaps");
    setFilter("owner", "All Owners");
  }

  return (
    <div className="border-b border-[#E6ECF2] bg-white px-4 py-5 sm:px-5 lg:px-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-sibs-primary-1">
            Action Item List
          </h2>
          <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
            Search and filter manual and system-suggested actions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-[1fr_170px_150px_200px_190px_190px_110px] 2xl:items-end">
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
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && commitSearch()}
              placeholder="Search then press Enter..."
              className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </div>
        </div>

        <FilterSelect label="Status" filterKey="status" options={STATUS_OPTIONS} />
        <FilterSelect label="Risk" filterKey="risk" options={RISK_OPTIONS} />
        <FilterSelect label="Module" filterKey="module" options={MODULE_OPTIONS} />
        <FilterSelect label="Gap" filterKey="gap" options={GAP_OPTIONS} />
        <FilterSelect label="Owner" filterKey="owner" options={OWNER_OPTIONS} />

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
