import React from "react";
import { Search } from "lucide-react";
import { usePagination } from "@/services/context/PaginationContext";

const TableHeader = ({ tableEntity }) => {
  const {
    header,
    searchInput,
    setSearchInput,
    handleSearchKeyDown,
    commitSearch,
    filterValues,
    setFilter,
  } = usePagination(tableEntity);

  const {
    title = "",
    description = "",
    searchPlaceholder = "Search...",
    filters = [],
  } = header || {};

  return (
    <div className="border-b border-[#DDE6F0] bg-white px-3 py-4 sm:px-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          {title && (
            <h2 className="text-lg font-bold text-sibs-primary-1">{title}</h2>
          )}

          {description && (
            <p className="mt-1 text-sm text-sibs-primary-1">{description}</p>
          )}
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:items-center">
          <div className="relative w-full sm:w-[320px] lg:w-[360px]">
            <button
              type="button"
              onClick={commitSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-primary-1"
            >
              <Search size={18} />
            </button>

            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
              className="h-12 w-full rounded-xl border border-[#DDE6F0] bg-white pl-10 pr-4 text-sm font-medium text-sibs-primary-1 outline-none transition placeholder:text-[#8C98AA] focus:border-sibs-primary-1"
            />
          </div>

          {filters.map((filter) => (
            <select
              key={filter.key}
              value={filterValues?.[filter.key] ?? filter.defaultValue ?? ""}
              onChange={(e) => setFilter(filter.key, e.target.value)}
              className={
                filter.className ||
                "h-12 w-full rounded-xl border border-[#DDE6F0] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1 sm:w-[220px]"
              }
            >
              {(filter.options || []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TableHeader;