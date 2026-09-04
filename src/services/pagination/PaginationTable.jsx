import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const EDGE = "rounded-[10px]";
const INLINE_CONTROLS_CLASS =
  "flex flex-col gap-3 overflow-visible xl:flex-row xl:items-end";
const INLINE_SEARCH_CLASS =
  "relative w-full min-w-0 xl:min-w-[180px] xl:flex-[1_1_220px] 2xl:min-w-[280px] 2xl:flex-[1_1_360px]";
const INLINE_FILTER_CLASS = "w-full xl:w-[135px] 2xl:w-[180px] xl:flex-none";
const INLINE_SEARCHABLE_FILTER_CLASS = "w-full xl:w-[150px] 2xl:w-[210px] xl:flex-none";
const INLINE_RIGHT_CONTENT_CLASS =
  "flex w-full min-w-0 items-end xl:w-auto xl:flex-none";

function AnimatedDropdown({ open, children, className = "" }) {
  return (
    <div
      className={`absolute left-0 right-0 top-full z-[9999] mt-2 grid transition-all duration-200 ease-out ${
        open
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0"
      } ${className}`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`overflow-hidden ${EDGE} border border-[#D7DEE8] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] transition-all duration-200 ease-out ${
            open
              ? "translate-y-0 scale-100"
              : "-translate-y-1 scale-[0.99]"
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

function getSelectedDropdownValues(filter) {
  if (!filter?.multiple) return [];

  const values = Array.isArray(filter.value) ? filter.value : [];

  return [...new Set(
    values
      .map((value) => String(value ?? "").trim())
      .filter(Boolean),
  )];
}

function FieldLabel({ children }) {
  return (
    <label className="mb-1 block font-jakarta sibs-text-micro font-extrabold tracking-normal text-[#101828]">
      {children}
    </label>
  );
}

function DateFilterField({ filter }) {
  return (
    <div className={`flex w-full flex-col ${filter.className || ""}`}>
      {filter.label ? <FieldLabel>{filter.label}</FieldLabel> : null}

      <div className="group relative">
        <CalendarDays
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3] transition-colors group-focus-within:text-[#FF5C28]"
        />

        <input
          type="date"
          value={filter.value || ""}
          onChange={(event) => filter.onChange?.(event.target.value, event)}
          min={filter.min}
          max={filter.max}
          disabled={filter.disabled}
          className={`h-11 w-full ${EDGE} border border-[#E6ECF2] bg-[#F8FAFC] px-3 pl-9 font-jakarta text-xs font-bold text-[#042C51] outline-none transition hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:opacity-50`}
        />
      </div>
    </div>
  );
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
  searchLabel = "",

  filters = [],
  dropdownFilters = [],
  dateFilters = [],
  dateFrom = null,
  dateTo = null,
  rightContent = null,

  filterTitle = "Refine Filters",
  resetLabel = "Reset all",
  onReset,
  showFilterHeader,
  showFilterPanel,
  filtersPanelClassName = "",
  filterLayout = "panel",

  showPagination = true,
  showCount = true,
  currentPage = 1,
  totalPages = 1,
  loadedCount = 0,
  totalRecords = 0,
  recordLabel = "records",
  onPrevious,
  onNext,

  controlsClassName = "",
  searchClassName = "",
  rightContentClassName = "",
  className = "",
}) {
  const dropdownRefs = useRef({});
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const [dropdownSearch, setDropdownSearch] = useState({});

  const safeCurrentPage = Math.max(Number(currentPage) || 1, 1);
  const safeTotalPages = Math.max(Number(totalPages) || 1, 1);

  const hasPreviousPage = safeCurrentPage > 1;
  const hasNextPage = safeCurrentPage < safeTotalPages;
  const isTaInlineLayout = filterLayout === "ta-inline";

  const visibleFilters = useMemo(() => {
    return filters.filter((filter) => filter && filter.show !== false);
  }, [filters]);

  const visibleDropdownFilters = useMemo(() => {
    return dropdownFilters.filter(
      (filter) => filter && filter.show !== false,
    );
  }, [dropdownFilters]);

  const combinedDropdownFilters = useMemo(() => {
    const normalFilters = visibleFilters.map((filter) => ({
      ...filter,
      searchable: filter.searchable ?? false,
      includeAll: filter.includeAll ?? false,
      placeholder: filter.placeholder || "Select...",
      allLabel: filter.allLabel || "All",
      className:
        filter.className ||
        (isTaInlineLayout ? INLINE_FILTER_CLASS : "sm:min-w-[190px]"),
    }));

    const searchableFilters = visibleDropdownFilters.map((filter) => ({
      ...filter,
      searchable: filter.searchable ?? true,
      includeAll: filter.includeAll ?? true,
      placeholder: filter.placeholder || "Search...",
      allLabel: filter.allLabel || "All",
      className:
        filter.className ||
        (isTaInlineLayout
          ? INLINE_SEARCHABLE_FILTER_CLASS
          : "sm:min-w-[220px]"),
    }));

    return [...searchableFilters, ...normalFilters];
  }, [isTaInlineLayout, visibleFilters, visibleDropdownFilters]);

  const visibleDateFilters = useMemo(() => {
    const suppliedDates = [
      ...(Array.isArray(dateFilters) ? dateFilters : []),
      dateFrom ? { key: "dateFrom", ...dateFrom } : null,
      dateTo ? { key: "dateTo", ...dateTo } : null,
    ];

    return suppliedDates.filter(
      (filter) => filter && filter.show !== false,
    );
  }, [dateFilters, dateFrom, dateTo]);

  const hasFilterControls =
    showSearch ||
    combinedDropdownFilters.length > 0 ||
    visibleDateFilters.length > 0 ||
    Boolean(rightContent);

  const shouldShowFilterHeader = isTaInlineLayout
    ? false
    : showFilterHeader ??
      (combinedDropdownFilters.length > 0 ||
        visibleDateFilters.length > 0 ||
        Boolean(onReset));

  const shouldShowFilterPanel = isTaInlineLayout
    ? false
    : showFilterPanel ??
      (combinedDropdownFilters.length > 0 ||
        visibleDateFilters.length > 0 ||
        Boolean(onReset));

  const hasTopControls =
    Boolean(title) || Boolean(subtitle) || hasFilterControls;

  useEffect(() => {
    function handleClickOutside(event) {
      if (!openDropdownKey) return;

      const activeRef = dropdownRefs.current?.[openDropdownKey];

      if (activeRef && !activeRef.contains(event.target)) {
        setOpenDropdownKey(null);
        setDropdownSearch((previous) => ({
          ...previous,
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

  function handleReset() {
    if (loading) return;

    setOpenDropdownKey(null);
    setDropdownSearch({});
    onReset?.();
  }

  function getDropdownLabel(filter) {
    if (filter?.multiple) {
      const selectedValues = getSelectedDropdownValues(filter);

      if (selectedValues.length === 0) {
        return filter?.allLabel || filter?.placeholder || "All";
      }

      if (selectedValues.length === 1) {
        const selectedValue = selectedValues[0];
        const matchedOption = (filter.options || []).find((option) => {
          return String(getOptionValue(option) ?? "") === selectedValue;
        });

        return matchedOption ? getOptionLabel(matchedOption) : selectedValue;
      }

      return `${selectedValues.length} selected`;
    }

    if (
      !filter?.value ||
      filter.value === "All" ||
      filter.value === filter.allLabel ||
      filter.value === "All Modules" ||
      filter.value === "All Accounts" ||
      filter.value === "All Statuses" ||
      filter.value === "All Access Levels"
    ) {
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

  function getDropdownControlLabel(filter) {
    if (filter?.label || filter?.title) {
      return filter.label || filter.title;
    }

    if (filter?.allLabel) {
      return filter.allLabel.replace(/^All\s+/i, "");
    }

    if (filter?.key) {
      return String(filter.key)
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, (letter) => letter.toUpperCase());
    }

    return "";
  }

  function getFilteredDropdownOptions(filter) {
    const rawOptions = Array.isArray(filter?.options) ? filter.options : [];
    const options = filter.includeAll
      ? rawOptions.filter((opt) => {
          const val = String(getOptionValue(opt) ?? "").trim().toLowerCase();
          const lbl = String(getOptionLabel(opt) ?? "").trim().toLowerCase();
          const allLbl = String(filter.allLabel || "All").trim().toLowerCase();
          return val !== "all" && val !== allLbl && lbl !== "all" && lbl !== allLbl;
        })
      : rawOptions;

    const keyword = String(dropdownSearch?.[filter.key] || "")
      .trim()
      .toLowerCase();

    if (!keyword || filter.searchable === false) {
      return options;
    }

    return options.filter((option) => {
      const optionLabel = getOptionLabel(option);

      return String(optionLabel || "")
        .toLowerCase()
        .includes(keyword);
    });
  }

  function openDropdown(filterKey) {
    setOpenDropdownKey(filterKey);
    setDropdownSearch((previous) => ({
      ...previous,
      [filterKey]: "",
    }));
  }

  function closeDropdown(filterKey) {
    setOpenDropdownKey(null);
    setDropdownSearch((previous) => ({
      ...previous,
      [filterKey]: "",
    }));
  }

  function toggleDropdown(filterKey) {
    if (openDropdownKey === filterKey) {
      closeDropdown(filterKey);
      return;
    }

    openDropdown(filterKey);
  }

  function selectDropdownValue(filter, value) {
    if (filter?.multiple) {
      if (value === "All") {
        filter.onChange?.([]);
        closeDropdown(filter.key);
        return;
      }

      const cleanValue = String(value ?? "").trim();
      if (!cleanValue) return;

      const selectedValues = getSelectedDropdownValues(filter);
      const nextValues = selectedValues.includes(cleanValue)
        ? selectedValues.filter((item) => item !== cleanValue)
        : [...selectedValues, cleanValue];

      filter.onChange?.(nextValues);
      return;
    }

    filter.onChange?.(value);
    closeDropdown(filter.key);
  }

  function renderControls() {
    return (
      <div
        className={
          controlsClassName ||
          (isTaInlineLayout
            ? INLINE_CONTROLS_CLASS
            : "grid grid-cols-1 gap-4 overflow-visible sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5")
        }
      >
        {showSearch ? (
          <div
            className={
              searchClassName ||
              (isTaInlineLayout
                ? INLINE_SEARCH_CLASS
                : "relative w-full sm:col-span-2 xl:col-span-1")
            }
          >
            {(searchLabel || isTaInlineLayout) ? (
              <FieldLabel>{searchLabel || "Search"}</FieldLabel>
            ) : null}

            <div className="group relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3] transition-colors group-focus-within:text-[#FF5C28]"
              />

              <input
                type="text"
                value={searchValue}
                onChange={(event) =>
                  onSearchChange?.(event.target.value, event)
                }
                onKeyDown={onSearchKeyDown}
                placeholder={searchPlaceholder}
                className={`w-full ${EDGE} border border-[#E6ECF2] bg-[#F8FAFC] px-3 pl-9 font-jakarta sibs-text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#8A98B8] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 ${
                  isTaInlineLayout ? "h-8.5 sm:h-9 2xl:h-10" : "h-9 2xl:h-11"
                }`}
              />
            </div>
          </div>
        ) : null}

        {combinedDropdownFilters.map((filter) => {
          const isOpen = openDropdownKey === filter.key;
          const options = getFilteredDropdownOptions(filter);
          const selectedLabel = getDropdownLabel(filter);
          const isSearchable = filter.searchable !== false;
          const label = getDropdownControlLabel(filter);
          const selectedValues = getSelectedDropdownValues(filter);

          return (
            <div
              key={filter.key}
              ref={(node) => {
                dropdownRefs.current[filter.key] = node;
              }}
              className={`relative w-full overflow-visible ${
                isOpen ? "z-[90]" : "z-[60]"
              } ${
                filter.className || ""
              }`}
            >
              {label ? (
                <FieldLabel>{label}</FieldLabel>
              ) : null}

              {isSearchable ? (
                <div className="group relative overflow-visible">
                  <input
                    type="text"
                    value={
                      isOpen
                        ? dropdownSearch?.[filter.key] || ""
                        : selectedLabel
                    }
                    onChange={(event) => {
                      setDropdownSearch((previous) => ({
                        ...previous,
                        [filter.key]: event.target.value,
                      }));
                      setOpenDropdownKey(filter.key);
                    }}
                    onFocus={() => openDropdown(filter.key)}
                    placeholder={filter.placeholder || "Search..."}
                    autoComplete="off"
                    disabled={filter.disabled}
                    className={`w-full ${EDGE} border border-[#E6ECF2] bg-[#F8FAFC] px-3 pr-10 font-jakarta sibs-text-xs font-bold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:opacity-50 ${
                      isTaInlineLayout ? "h-8.5 sm:h-9 2xl:h-10" : "h-9 2xl:h-11"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => toggleDropdown(filter.key)}
                    disabled={filter.disabled}
                    className="absolute right-2 top-1/2 flex h-6.5 w-6.5 2xl:h-7 2xl:w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#667085] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Toggle ${label || filter.key} dropdown`}
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleDropdown(filter.key)}
                  disabled={filter.disabled}
                  className={`flex w-full items-center justify-between ${EDGE} border border-[#E6ECF2] bg-[#F8FAFC] px-3 text-left font-jakarta sibs-text-xs font-bold text-[#042C51] outline-none transition hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:opacity-50 ${
                    isTaInlineLayout ? "h-8.5 sm:h-9 2xl:h-10" : "h-9 2xl:h-11"
                  }`}
                  aria-expanded={isOpen}
                >
                  <span className="block min-w-0 truncate">
                    {selectedLabel}
                  </span>

                  <ChevronDown
                    size={17}
                    className={`shrink-0 text-[#667085] transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              )}

              <AnimatedDropdown open={isOpen}>
                <div className="max-h-64 overflow-y-auto py-2 sibs-scrollbar">
                  {filter.includeAll ?? false ? (
                    <button
                      type="button"
                      onClick={() =>
                        selectDropdownValue(filter, "All")
                      }
                      className={`block w-full px-3 py-2 2xl:px-4 2xl:py-2.5 text-left sibs-text-xs transition ${
                        (filter.multiple
                          ? selectedValues.length === 0
                          : (!filter.value ||
                             filter.value === "All" ||
                             filter.value === filter.allLabel ||
                             filter.value === "All Modules" ||
                             filter.value === "All Accounts" ||
                             filter.value === "All Statuses" ||
                             filter.value === "All Access Levels"))
                          ? "bg-[#FFF0EB] font-extrabold text-[#FF5C28]"
                          : "font-semibold text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                      }`}
                    >
                      <span className="block truncate">
                        {filter.allLabel || "All"}
                      </span>
                    </button>
                  ) : null}

                  {options.length > 0 ? (
                    options.map((option, index) => {
                      const optionValue = getOptionValue(option);
                      const optionLabel = getOptionLabel(option);
                      const cleanOptionValue = String(optionValue ?? "");
                      const checked = filter.multiple
                        ? selectedValues.includes(cleanOptionValue)
                        : filter.value === optionValue;

                      return (
                        <button
                          key={`${filter.key}-${optionValue}-${index}`}
                          type="button"
                          onClick={() =>
                            selectDropdownValue(filter, optionValue)
                          }
                          className={`flex w-full items-center gap-2 px-3 py-2 2xl:px-4 2xl:py-2.5 text-left sibs-text-xs transition ${
                            checked
                              ? "bg-[#FFF0EB] font-extrabold text-[#FF5C28]"
                              : "font-semibold text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                          }`}
                        >
                          {filter.multiple ? (
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                checked
                                  ? "border-[#FF5C28] bg-[#FF5C28] text-white"
                                  : "border-[#D0D5DD] bg-white text-transparent"
                              }`}
                              aria-hidden="true"
                            >
                              <Check size={11} strokeWidth={3} />
                            </span>
                          ) : null}

                          <span className="block min-w-0 flex-1 truncate">
                            {optionLabel}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-4 text-xs font-semibold text-[#667085]">
                      No options found.
                    </div>
                  )}
                </div>
              </AnimatedDropdown>
            </div>
          );
        })}

        {visibleDateFilters.map((filter, index) => (
          <DateFilterField
            key={filter.key || `date-filter-${index}`}
            filter={filter}
          />
        ))}

        {rightContent ? (
          <div
            className={
              rightContentClassName ||
              (isTaInlineLayout
                ? INLINE_RIGHT_CONTENT_CLASS
                : "flex w-full items-end xl:w-auto")
            }
          >
            {rightContent}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`relative overflow-visible font-jakarta text-[#042C51] ${className}`}>
      {hasTopControls ? (
        <div className="relative z-[50] overflow-visible">
          {title || subtitle ? (
            <div className="mb-4 min-w-0">
              {title ? (
                <h2 className="sibs-section-title">
                  {title}
                </h2>
              ) : null}

              {subtitle ? (
                <p className="sibs-section-subtitle">
                  {subtitle}
                </p>
              ) : null}
            </div>
          ) : null}

          {shouldShowFilterPanel ? (
            <div
              className={`relative overflow-visible rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5 ${filtersPanelClassName}`}
            >
              {shouldShowFilterHeader ? (
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <SlidersHorizontal
                      size={16}
                      className="shrink-0 text-[#042C51]"
                    />
              <span className="truncate font-jakarta text-xs font-extrabold uppercase tracking-normal text-[#042C51]">
                      {filterTitle}
                    </span>
                  </div>

                  {onReset ? (
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={loading}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-extrabold text-[#FF5C28] transition hover:bg-[#FFF0EB] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RefreshCw size={13} />
                      {resetLabel}
                    </button>
                  ) : null}
                </div>
              ) : null}

              {renderControls()}
            </div>
          ) : (
            renderControls()
          )}
        </div>
      ) : null}

      {showPagination ? (
        <div className="mt-3 2xl:mt-5 flex flex-col gap-2.5 border-t border-[#F1F5F9] pt-2.5 2xl:pt-4 sm:flex-row sm:items-center sm:justify-between">
          {showCount ? (
            <p className="m-0 text-center font-jakarta sibs-text-micro font-semibold leading-relaxed text-[#667085] sm:text-left">
              Showing{" "}
              <span className="font-extrabold text-[#042C51]">
                {loadedCount}
              </span>{" "}
              loaded {recordLabel}
              {Number(totalRecords || 0) > 0 ? (
                <>
                  {" "}
                  out of{" "}
                  <span className="font-extrabold text-[#042C51]">
                    {totalRecords}
                  </span>
                </>
              ) : null}
            </p>
          ) : (
            <span />
          )}

          <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 sm:w-auto">
            <button
              type="button"
              disabled={loading || !hasPreviousPage}
              onClick={handlePrevious}
              className={`inline-flex h-8 2xl:h-10 min-w-0 items-center justify-center gap-1.5 ${EDGE} border border-[#D6DEE8] bg-white px-2.5 2xl:px-4 font-jakarta sibs-text-xs font-extrabold text-[#042C51] transition hover:-translate-y-0.5 hover:border-[#FF5C28]/50 hover:bg-[#FFF0EB] hover:text-[#FF5C28] hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:border-[#D6DEE8] disabled:hover:bg-white disabled:hover:text-[#042C51]`}
            >
              <ChevronLeft className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 shrink-0" />
              <span className="truncate">Previous</span>
            </button>

            <span
              className={`inline-flex h-8 2xl:h-10 items-center justify-center whitespace-nowrap ${EDGE} border border-[#FF5C28] bg-[#FF5C28] px-3 2xl:px-4 font-jakarta sibs-text-xs font-extrabold text-white shadow-sm`}
            >
              {safeCurrentPage}
            </span>

            <button
              type="button"
              disabled={loading || !hasNextPage}
              onClick={handleNext}
              className={`inline-flex h-8 2xl:h-10 min-w-0 items-center justify-center gap-1.5 ${EDGE} border border-[#D6DEE8] bg-white px-2.5 2xl:px-4 font-jakarta sibs-text-xs font-extrabold text-[#042C51] transition hover:-translate-y-0.5 hover:border-[#FF5C28]/50 hover:bg-[#FFF0EB] hover:text-[#FF5C28] hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:border-[#D6DEE8] disabled:hover:bg-white disabled:hover:text-[#042C51]`}
            >
              <span className="truncate">Next</span>
              <ChevronRight className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 shrink-0" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
