import React from "react";
import { useActionItems } from "../../../services/context/ActionItemsContext.jsx";
import { Filter, Search } from "lucide-react";
import { usePagination } from "../../../services/context/PaginationContext.jsx";
import {
  GAP_OPTIONS,
  MODULE_OPTIONS,
  RISK_OPTIONS,
  STATUS_OPTIONS,
} from "../../../lib/utils/actionItems/actionItemsConstants.js";
import ThemedDropdown from "../../layout/dropdown/ThemedDropdown.jsx";

const ENTITY_KEY = "action-items";

function FilterSelect({ label, filterKey, options }) {
  const { filterValues, setFilter } = usePagination(ENTITY_KEY);
  const currentValue = filterValues?.[filterKey] || options[0];

  const formattedOptions = (options || []).map((opt) => ({
    label: opt,
    value: opt,
  }));

  return (
    <div className="w-full min-w-0 flex-[1_1_180px]">
      <label className="mb-1.5 block font-jakarta text-xs font-extrabold tracking-normal text-[#101828]">
        {label}
      </label>
      <ThemedDropdown
        value={currentValue}
        options={formattedOptions}
        onChange={(val) => setFilter(filterKey, val)}
        searchable={false}
        showPlaceholderOption={false}
        className="w-full"
      />
    </div>
  );
}

export default function ActionItemsFilters() {
  const { ownerOptions } = useActionItems();
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
    <div className="bg-white font-jakarta">
      <div className="flex flex-col gap-3 overflow-visible xl:flex-row xl:items-end">
        <div className="relative w-full min-w-0 xl:min-w-[280px] xl:flex-[1_1_360px]">
          <label className="mb-1.5 block font-jakarta text-xs font-extrabold tracking-normal text-[#101828]">
            Search
          </label>
          <div className="group relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3] transition-colors group-focus-within:text-[#FF5C28]"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && commitSearch()}
              placeholder="Search action, role, account, owner..."
              className="h-10 w-full rounded-xl border border-[#D0D5DD] bg-white px-3.5 pl-9 text-xs font-semibold text-[#101828] outline-none transition focus:border-[#FF5C28] focus:ring-2 focus:ring-[#FF5C28]/20"
            />
          </div>
        </div>

        <FilterSelect label="Status" filterKey="status" options={STATUS_OPTIONS} />
        <FilterSelect label="Risk" filterKey="risk" options={RISK_OPTIONS} />
        <FilterSelect label="Module" filterKey="module" options={MODULE_OPTIONS} />
        <FilterSelect label="Gap" filterKey="gap" options={GAP_OPTIONS} />
        <FilterSelect label="Owner" filterKey="owner" options={ownerOptions} />

        <div className="flex w-full min-w-0 items-end xl:w-auto xl:flex-none">
          <button
            type="button"
            onClick={handleClearAll}
            disabled={!hasActiveFilters}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#D0D5DD] bg-white px-4 text-xs font-extrabold text-[#344054] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50 xl:w-auto"
          >
            <Filter size={15} />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
