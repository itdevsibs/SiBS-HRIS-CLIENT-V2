import React from "react";
import { Search } from "lucide-react";

import { SelectDropdown } from "@/components/ui";
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

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:items-end">
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
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
              className="h-12 w-full rounded-xl border border-[#DDE6F0] bg-white pl-10 pr-4 text-sm font-medium text-sibs-primary-1 outline-none transition placeholder:text-[#8C98AA] focus:border-sibs-orange focus:ring-4 focus:ring-sibs-orange/10"
            />
          </div>

          {filters.map((filter) => (
            <div
              key={filter.key}
              className={filter.wrapperClassName || "w-full sm:w-[220px]"}
            >
              <SelectDropdown
                label={filter.label}
                hideLabel={!filter.label}
                value={filterValues?.[filter.key] ?? filter.defaultValue ?? ""}
                onChange={(selectedValue) => setFilter(filter.key, selectedValue)}
                options={filter.options || []}
                placeholder={filter.placeholder || "Choose option"}
                searchable={Boolean(filter.searchable)}
                searchPlaceholder={filter.searchPlaceholder || "Search..."}
                clearable={filter.clearable ?? false}
                disabled={Boolean(filter.disabled)}
                buttonClassName={filter.className || "!h-12"}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TableHeader;
