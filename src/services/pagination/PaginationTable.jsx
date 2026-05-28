import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function AnimatedDropdown({ open, children, className = "" }) {
  return (
    <div
      className={`absolute left-0 right-0 top-full mt-2 grid transition-all duration-300 ease-out ${
        open
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0"
      } ${className}`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl transition-all duration-300 ease-out ${
            open ? "translate-y-0 scale-100" : "-translate-y-2 scale-[0.98]"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function getOptionValue(option) {
  return typeof option === "object" ? option.value : option;
}

function getOptionLabel(option) {
  return typeof option === "object" ? option.label : option;
}

export default function PaginationTable({
  title = "",
  subtitle = "",
  loading = false,

  searchValue = "",
  searchPlaceholder = "Search then press Enter",
  onSearchChange,
  onSearchKeyDown,
  showSearch = true,

  filters = [],
  dropdownFilters = [],
  rightContent = null,

  showPagination = true,
  showCount = true,
  currentPage = 1,
  totalPages = 1,
  loadedCount = 0,
  totalRecords = 0,
  recordLabel = "records",
  onPrevious,
  onNext,

  className = "",
}) {
  const dropdownRefs = useRef({});
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const [dropdownSearch, setDropdownSearch] = useState({});

  const safeCurrentPage = Math.max(Number(currentPage) || 1, 1);
  const safeTotalPages = Math.max(Number(totalPages) || 1, 1);

  const hasPreviousPage = safeCurrentPage > 1;
  const hasNextPage = safeCurrentPage < safeTotalPages;

  const visibleFilters = useMemo(() => {
    return filters.filter((filter) => filter && filter.show !== false);
  }, [filters]);

  const visibleDropdownFilters = useMemo(() => {
    return dropdownFilters.filter((filter) => filter && filter.show !== false);
  }, [dropdownFilters]);

  const combinedDropdownFilters = useMemo(() => {
    const normalFilters = visibleFilters.map((filter) => ({
      ...filter,
      searchable: filter.searchable ?? false,
      includeAll: false,
      placeholder: filter.placeholder || "Select...",
      allLabel: filter.allLabel || "All",
      className: filter.className || "sm:w-[220px]",
    }));

    const searchableFilters = visibleDropdownFilters.map((filter) => ({
      ...filter,
      searchable: filter.searchable ?? true,
      includeAll: filter.includeAll ?? true,
      placeholder: filter.placeholder || "Search...",
      allLabel: filter.allLabel || "All",
      className: filter.className || "sm:w-[280px]",
    }));

    return [...searchableFilters, ...normalFilters];
  }, [visibleFilters, visibleDropdownFilters]);

  const hasTopControls =
    title ||
    subtitle ||
    showSearch ||
    combinedDropdownFilters.length > 0 ||
    rightContent;

  useEffect(() => {
    function handleClickOutside(e) {
      if (!openDropdownKey) return;

      const activeRef = dropdownRefs.current?.[openDropdownKey];

      if (activeRef && !activeRef.contains(e.target)) {
        setOpenDropdownKey(null);
        setDropdownSearch((prev) => ({
          ...prev,
          [openDropdownKey]: "",
        }));
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdownKey]);

  function handlePrevious() {
    if (loading || !hasPreviousPage) return;
    onPrevious?.();
  }

  function handleNext() {
    if (loading || !hasNextPage) return;
    onNext?.();
  }

  function getDropdownLabel(filter) {
    if (!filter?.value || filter.value === "All") {
      return filter?.allLabel || filter?.placeholder || "All";
    }

    const matchedOption = (filter.options || []).find((option) => {
      return getOptionValue(option) === filter.value;
    });

    if (matchedOption) {
      return getOptionLabel(matchedOption);
    }

    return filter.value;
  }

  function getFilteredDropdownOptions(filter) {
    const options = Array.isArray(filter?.options) ? filter.options : [];
    const keyword = String(dropdownSearch?.[filter.key] || "")
      .trim()
      .toLowerCase();

    if (!keyword || filter.searchable === false) return options;

    return options.filter((option) => {
      const optionLabel = getOptionLabel(option);
      return String(optionLabel || "").toLowerCase().includes(keyword);
    });
  }

  function openDropdown(filterKey) {
    setOpenDropdownKey(filterKey);
    setDropdownSearch((prev) => ({
      ...prev,
      [filterKey]: "",
    }));
  }

  function closeDropdown(filterKey) {
    setOpenDropdownKey(null);
    setDropdownSearch((prev) => ({
      ...prev,
      [filterKey]: "",
    }));
  }

  function selectDropdownValue(filter, value) {
    filter.onChange?.(value);
    closeDropdown(filter.key);
  }

  return (
    <div className={className}>
      {hasTopControls && (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-bold text-[#101828]">{title}</h2>
            )}

            {subtitle && (
              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
            {showSearch && (
              <div className="relative w-full sm:w-[340px]">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                />

                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value, e)}
                  onKeyDown={onSearchKeyDown}
                  placeholder={searchPlaceholder}
                  className="h-11 w-full rounded-full border border-sibs-tertiary-8 bg-white px-4 pl-11 text-sm text-sibs-primary-1 outline-none transition-all duration-200 placeholder:text-sibs-tertiary-5 hover:border-sibs-primary-1/30 hover:shadow-sm focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                />
              </div>
            )}

            {combinedDropdownFilters.map((filter) => {
              const isOpen = openDropdownKey === filter.key;
              const options = getFilteredDropdownOptions(filter);
              const selectedLabel = getDropdownLabel(filter);
              const isSearchable = filter.searchable !== false;

              return (
                <div
                  key={filter.key}
                  ref={(node) => {
                    dropdownRefs.current[filter.key] = node;
                  }}
                  className={`relative z-50 w-full ${filter.className}`}
                >
                  {isSearchable ? (
                    <>
                      <Search
                        size={17}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                      />

                      <input
                        type="text"
                        value={
                          isOpen
                            ? dropdownSearch?.[filter.key] || ""
                            : selectedLabel
                        }
                        onChange={(e) => {
                          setDropdownSearch((prev) => ({
                            ...prev,
                            [filter.key]: e.target.value,
                          }));
                          setOpenDropdownKey(filter.key);
                        }}
                        onFocus={() => openDropdown(filter.key)}
                        placeholder={filter.placeholder || "Search..."}
                        autoComplete="off"
                        className="h-11 w-full rounded-full border border-sibs-tertiary-8 bg-white px-4 pl-10 pr-10 text-sm font-bold text-sibs-primary-1 outline-none transition-all duration-200 placeholder:text-sibs-tertiary-5 hover:border-sibs-primary-1/30 hover:shadow-sm focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                      />
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (isOpen) {
                          closeDropdown(filter.key);
                        } else {
                          openDropdown(filter.key);
                        }
                      }}
                      className="flex h-11 w-full items-center justify-between rounded-full border border-sibs-tertiary-8 bg-white px-4 pl-5 pr-10 text-left text-sm font-bold text-sibs-primary-1 outline-none transition-all duration-200 hover:border-sibs-primary-1/30 hover:shadow-sm focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                    >
                      <span className="block min-w-0 truncate">
                        {selectedLabel}
                      </span>
                    </button>
                  )}

                  <ChevronDown
                    size={17}
                    onClick={() => {
                      if (isOpen) {
                        closeDropdown(filter.key);
                      } else {
                        openDropdown(filter.key);
                      }
                    }}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-sibs-tertiary-5 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />

                  <AnimatedDropdown open={isOpen}>
                    <div className="max-h-64 overflow-y-auto py-2 sibs-scrollbar">
                      {(filter.includeAll ?? false) && (
                        <button
                          type="button"
                          onClick={() => selectDropdownValue(filter, "All")}
                          className={`block w-full px-4 py-3 text-left text-sm transition ${
                            filter.value === "All"
                              ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                              : "text-[#344054] hover:bg-[#F8FAFC]"
                          }`}
                        >
                          {filter.allLabel || "All"}
                        </button>
                      )}

                      {options.length > 0 ? (
                        options.map((option, index) => {
                          const optionValue = getOptionValue(option);
                          const optionLabel = getOptionLabel(option);
                          const checked = filter.value === optionValue;

                          return (
                            <button
                              key={`${filter.key}-${optionValue}-${index}`}
                              type="button"
                              onClick={() =>
                                selectDropdownValue(filter, optionValue)
                              }
                              className={`block w-full px-4 py-3 text-left text-sm transition ${
                                checked
                                  ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                                  : "text-[#344054] hover:bg-[#F8FAFC]"
                              }`}
                            >
                              <span className="block truncate">
                                {optionLabel}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-4 py-4 text-sm font-semibold text-sibs-tertiary-5">
                          No options found.
                        </div>
                      )}
                    </div>
                  </AnimatedDropdown>
                </div>
              );
            })}

            {rightContent}
          </div>
        </div>
      )}

      {showPagination && (
        <div className="mt-5 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
          {showCount ? (
            <p className="m-0 text-sm font-semibold text-sibs-tertiary-5">
              Showing {loadedCount} loaded {recordLabel}
              {Number(totalRecords || 0) > 0 ? ` out of ${totalRecords}` : ""}
            </p>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2 max-sm:justify-center">
            <button
              type="button"
              disabled={loading || !hasPreviousPage}
              onClick={handlePrevious}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className="inline-flex h-10 items-center justify-center rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-[#344054]">
              Page {safeCurrentPage}
            </span>

            <button
              type="button"
              disabled={loading || !hasNextPage}
              onClick={handleNext}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}