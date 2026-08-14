import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

const PaginationContext = createContext(null);

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const createDefaultPaginationState = () => ({
  page: 1,
  search: "",
  searchInput: "",
  loading: true,
  pagination: {
    totalPages: 1,
    currentPage: 1,
    total: 0,
    limit: 15,
  },
  header: {
    title: "",
    description: "",
    searchPlaceholder: "Search...",
    filters: [],
  },
  filterValues: {
    dateFrom: "",
    dateTo: "",
  },
});

const isSameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function toDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(value) {
  if (!value) return null;

  const [year, month, day] = String(value).split("-").map(Number);

  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function formatDisplayDate(value) {
  const date = parseDateKey(value);

  if (!date) return "Select date";

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getCalendarCells(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return date;
  });
}

export const PaginationProvider = ({ children }) => {
  const [entities, setEntities] = useState({});

  const getEntityState = useCallback(
    (entity) => entities[entity] || createDefaultPaginationState(),
    [entities],
  );

  const updateEntity = useCallback((entity, updates) => {
    setEntities((prev) => {
      const current = prev[entity] || createDefaultPaginationState();
      const resolvedUpdates =
        typeof updates === "function" ? updates(current) : updates || {};

      const nextState = {
        ...current,
        ...resolvedUpdates,
        pagination: {
          ...current.pagination,
          ...(resolvedUpdates.pagination || {}),
        },
        header: {
          ...current.header,
          ...(resolvedUpdates.header || {}),
        },
        filterValues: {
          ...current.filterValues,
          ...(resolvedUpdates.filterValues || {}),
        },
      };

      if (isSameJson(current, nextState)) {
        return prev;
      }

      return {
        ...prev,
        [entity]: nextState,
      };
    });
  }, []);

  const setPage = useCallback(
    (entity, page) => {
      updateEntity(entity, {
        page,
        loading: true,
      });
    },
    [updateEntity],
  );

  const setPagination = useCallback(
    (entity, pagination) => {
      updateEntity(entity, { pagination });
    },
    [updateEntity],
  );

  const setLoading = useCallback(
    (entity, loading) => {
      updateEntity(entity, { loading });
    },
    [updateEntity],
  );

  const setSearch = useCallback(
    (entity, value) => {
      updateEntity(entity, {
        search: value,
        searchInput: value,
        page: 1,
        loading: true,
      });
    },
    [updateEntity],
  );

  const setSearchInput = useCallback((entity, value) => {
    setEntities((prev) => {
      const current = prev[entity] || createDefaultPaginationState();
      const cleanValue = String(value ?? "");

      const nextState = {
        ...current,
        searchInput: cleanValue,
        ...(cleanValue.trim() === ""
          ? {
              search: "",
              page: 1,
              loading: true,
            }
          : {}),
      };

      if (isSameJson(current, nextState)) {
        return prev;
      }

      return {
        ...prev,
        [entity]: nextState,
      };
    });
  }, []);

  const commitSearch = useCallback((entity) => {
    setEntities((prev) => {
      const current = prev[entity] || createDefaultPaginationState();

      const nextState = {
        ...current,
        search: current.searchInput.trim(),
        page: 1,
        loading: true,
      };

      if (isSameJson(current, nextState)) {
        return prev;
      }

      return {
        ...prev,
        [entity]: nextState,
      };
    });
  }, []);

  const handleSearchKeyDown = useCallback((entity, e) => {
    if (e.key !== "Enter") return;

    setEntities((prev) => {
      const current = prev[entity] || createDefaultPaginationState();

      const nextState = {
        ...current,
        search: current.searchInput.trim(),
        page: 1,
        loading: true,
      };

      if (isSameJson(current, nextState)) {
        return prev;
      }

      return {
        ...prev,
        [entity]: nextState,
      };
    });
  }, []);

  const setTableHeader = useCallback((entity, header) => {
    setEntities((prev) => {
      const current = prev[entity] || createDefaultPaginationState();

      const nextHeader = {
        ...current.header,
        ...(header || {}),
      };

      if (isSameJson(current.header, nextHeader)) {
        return prev;
      }

      return {
        ...prev,
        [entity]: {
          ...current,
          header: nextHeader,
        },
      };
    });
  }, []);

  const setFilter = useCallback(
    (entity, key, value) => {
      updateEntity(entity, (current) => ({
        filterValues: {
          ...current.filterValues,
          [key]: value,
        },
        page: 1,
        loading: true,
      }));
    },
    [updateEntity],
  );

  const setDateRange = useCallback(
    (entity, nextRange = {}) => {
      updateEntity(entity, (current) => {
        let dateFrom = String(
          nextRange.dateFrom ?? current.filterValues?.dateFrom ?? "",
        ).trim();

        let dateTo = String(
          nextRange.dateTo ?? current.filterValues?.dateTo ?? "",
        ).trim();

        if (dateFrom && dateTo && dateTo < dateFrom) {
          dateTo = dateFrom;
        }

        return {
          filterValues: {
            ...current.filterValues,
            dateFrom,
            dateTo,
          },
          page: 1,
          loading: true,
        };
      });
    },
    [updateEntity],
  );

  const resetFilters = useCallback(
    (entity) => {
      updateEntity(entity, {
        filterValues: {
          dateFrom: "",
          dateTo: "",
        },
        page: 1,
        loading: true,
      });
    },
    [updateEntity],
  );

  const resetPagination = useCallback((entity) => {
    setEntities((prev) => {
      const nextState = createDefaultPaginationState();

      if (isSameJson(prev[entity], nextState)) {
        return prev;
      }

      return {
        ...prev,
        [entity]: nextState,
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      getEntityState,
      setPage,
      setPagination,
      setLoading,
      setSearch,
      setSearchInput,
      commitSearch,
      handleSearchKeyDown,
      setTableHeader,
      setFilter,
      setDateRange,
      resetFilters,
      resetPagination,
    }),
    [
      getEntityState,
      setPage,
      setPagination,
      setLoading,
      setSearch,
      setSearchInput,
      commitSearch,
      handleSearchKeyDown,
      setTableHeader,
      setFilter,
      setDateRange,
      resetFilters,
      resetPagination,
    ],
  );

  return (
    <PaginationContext.Provider value={value}>
      {children}
    </PaginationContext.Provider>
  );
};

export const usePagination = (entity) => {
  const context = useContext(PaginationContext);

  if (!context) {
    throw new Error("usePagination must be used within PaginationProvider");
  }

  const {
    getEntityState,
    setPage: contextSetPage,
    setPagination: contextSetPagination,
    setLoading: contextSetLoading,
    setSearch: contextSetSearch,
    setSearchInput: contextSetSearchInput,
    commitSearch: contextCommitSearch,
    handleSearchKeyDown: contextHandleSearchKeyDown,
    setTableHeader: contextSetTableHeader,
    setFilter: contextSetFilter,
    setDateRange: contextSetDateRange,
    resetFilters: contextResetFilters,
    resetPagination: contextResetPagination,
  } = context;

  const state = getEntityState(entity);

  const setPage = useCallback(
    (page) => contextSetPage(entity, page),
    [contextSetPage, entity],
  );

  const setPagination = useCallback(
    (pagination) => contextSetPagination(entity, pagination),
    [contextSetPagination, entity],
  );

  const setLoading = useCallback(
    (loading) => contextSetLoading(entity, loading),
    [contextSetLoading, entity],
  );

  const setSearch = useCallback(
    (value) => contextSetSearch(entity, value),
    [contextSetSearch, entity],
  );

  const setSearchInput = useCallback(
    (value) => contextSetSearchInput(entity, value),
    [contextSetSearchInput, entity],
  );

  const commitSearch = useCallback(
    () => contextCommitSearch(entity),
    [contextCommitSearch, entity],
  );

  const handleSearchKeyDown = useCallback(
    (e) => contextHandleSearchKeyDown(entity, e),
    [contextHandleSearchKeyDown, entity],
  );

  const setTableHeader = useCallback(
    (header) => contextSetTableHeader(entity, header),
    [contextSetTableHeader, entity],
  );

  const setFilter = useCallback(
    (key, value) => contextSetFilter(entity, key, value),
    [contextSetFilter, entity],
  );

  const setDateRange = useCallback(
    (dateRange) => contextSetDateRange(entity, dateRange),
    [contextSetDateRange, entity],
  );

  const resetFilters = useCallback(
    () => contextResetFilters(entity),
    [contextResetFilters, entity],
  );

  const resetPagination = useCallback(
    () => contextResetPagination(entity),
    [contextResetPagination, entity],
  );

  return useMemo(
    () => ({
      page: state.page,
      search: state.search,
      searchInput: state.searchInput,
      loading: state.loading,
      pagination: state.pagination,
      header: state.header,
      filterValues: state.filterValues,
      setPage,
      setPagination,
      setLoading,
      setSearch,
      setSearchInput,
      commitSearch,
      handleSearchKeyDown,
      setTableHeader,
      setFilter,
      setDateRange,
      resetFilters,
      resetPagination,
    }),
    [
      state.page,
      state.search,
      state.searchInput,
      state.loading,
      state.pagination,
      state.header,
      state.filterValues,
      setPage,
      setPagination,
      setLoading,
      setSearch,
      setSearchInput,
      commitSearch,
      handleSearchKeyDown,
      setTableHeader,
      setFilter,
      setDateRange,
      resetFilters,
      resetPagination,
    ],
  );
};

function AnimatedCalendarDropdown({ open, children }) {
  return (
    <div
      className={`sibs-animated-dropdown absolute right-0 z-[99999] mt-2 w-[250px] 2xl:w-[300px] max-[380px]:right-auto max-[380px]:left-0 max-[380px]:w-[calc(100vw-48px)] ${
        open ? "open" : "closed"
      }`}
    >
      <div className="sibs-animated-dropdown-inner">
        <div className="max-h-[min(430px,calc(100dvh-180px))] overflow-y-auto rounded-xl border border-[#D7E3F0] bg-white shadow-[0_16px_34px_rgba(4,44,81,0.14)] sibs-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

function MiniCalendar({ value, min, onSelect, onClose }) {
  const selectedDate = parseDateKey(value);
  const minDate = parseDateKey(min);
  const today = new Date();

  const [viewDate, setViewDate] = useState(selectedDate || minDate || today);

  const cells = useMemo(() => getCalendarCells(viewDate), [viewDate]);

  function goPreviousMonth() {
    setViewDate((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() - 1);
      return next;
    });
  }

  function goNextMonth() {
    setViewDate((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + 1);
      return next;
    });
  }

  function handleSelect(date) {
    if (min && toDateKey(date) < min) return;
    onSelect?.(toDateKey(date));
    onClose?.();
  }

  function handleToday() {
    if (min && toDateKey(today) < min) return;
    onSelect?.(toDateKey(today));
    onClose?.();
  }

  function handleClear() {
    onSelect?.("");
    onClose?.();
  }

  return (
    <div className="w-full font-jakarta">
      <div className="flex items-center justify-between border-b border-[#E6ECF2] px-3 py-2 2xl:px-4 2xl:py-2.5">
        <button
          type="button"
          onClick={goPreviousMonth}
          className="inline-flex h-7 w-7 2xl:h-8 2xl:w-8 items-center justify-center rounded-full text-sibs-primary-1 transition hover:bg-[#EAF2FB] active:scale-[0.96]"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" />
        </button>

        <span className="sibs-text-xs font-extrabold text-[#042C51]">
          {MONTH_LABELS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>

        <button
          type="button"
          onClick={goNextMonth}
          className="inline-flex h-7 w-7 2xl:h-8 2xl:w-8 items-center justify-center rounded-full text-sibs-primary-1 transition hover:bg-[#EAF2FB] active:scale-[0.96]"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" />
        </button>
      </div>

      <div className="px-2.5 py-2 2xl:px-4 2xl:py-3">
        <div className="grid grid-cols-7 gap-0.5 2xl:gap-1">
          {WEEKDAY_LABELS.map((day) => (
            <div
              key={day}
              className="flex h-6 2xl:h-8 items-center justify-center sibs-text-micro font-extrabold text-[#7B8DB3]"
            >
              {day}
            </div>
          ))}

          {cells.map((date) => {
            const dateKey = toDateKey(date);
            const isCurrentMonth = date.getMonth() === viewDate.getMonth();
            const isSelected = value && dateKey === value;
            const isToday = dateKey === toDateKey(today);
            const disabled = min && dateKey < min;

            return (
              <button
                key={dateKey}
                type="button"
                disabled={disabled}
                onClick={() => handleSelect(date)}
                className={`flex h-7 2xl:h-8.5 items-center justify-center rounded-lg sibs-text-xs font-bold transition active:scale-[0.96] ${
                  isSelected
                    ? "bg-[#FF5C28] text-white shadow-sm hover:bg-[#E94F1F]"
                    : isToday
                      ? "bg-[#FFF0EB] text-[#FF5C28] font-extrabold"
                      : isCurrentMonth
                        ? "text-[#042C51] hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
                        : "text-slate-400 hover:bg-slate-50"
                } ${
                  disabled
                    ? "cursor-not-allowed bg-slate-50 text-slate-300 hover:bg-slate-50"
                    : ""
                }`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-[#E6ECF2] pt-2">
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full px-2.5 py-1 sibs-text-micro font-extrabold text-[#667085] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={handleToday}
            disabled={min && toDateKey(today) < min}
            className="rounded-full px-2.5 py-1 sibs-text-micro font-extrabold text-[#042C51] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
          >
            Today
          </button>
        </div>
      </div>
    </div>
  );
}

function DateRangeInput({ label, value, min, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    function handleEscape(e) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative h-8.5 sm:h-9 2xl:h-10 w-full min-w-0">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        data-state={open ? "open" : "closed"}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-8.5 sm:h-9 2xl:h-10 w-full items-center justify-between gap-2 rounded-lg border bg-[#F8FAFC] px-3 text-left sibs-text-xs font-extrabold text-[#042C51] outline-none transition-all duration-200 active:scale-[0.99] ${
          open
            ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10"
            : "border-[#E6ECF2] hover:border-[#FF5C28]/40 hover:bg-white"
        }`}
      >
        <span className="flex min-w-0 items-center gap-1.5 2xl:gap-2">
          <CalendarDays className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 shrink-0 text-[#FF5C28]" />

          <span className="shrink-0">{label}</span>

          <span
            className={`truncate ${
              value ? "text-sibs-primary-1" : "text-sibs-tertiary-5"
            }`}
          >
            {formatDisplayDate(value)}
          </span>
        </span>

        <ChevronDown
          className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 shrink-0 text-[#6B88A8] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatedCalendarDropdown open={open}>
        <MiniCalendar
          value={value}
          min={min}
          onSelect={onChange}
          onClose={() => setOpen(false)}
        />
      </AnimatedCalendarDropdown>
    </div>
  );
}

export function PaginationDateRangeFilter({
  entity,
  visible = false,
  className = "",
}) {
  const { filterValues, setDateRange } = usePagination(entity);

  const allowedDateRangeEntities = ["attendance", "schedule", "leaves"];

  if (!visible || !allowedDateRangeEntities.includes(entity)) return null;

  const dateFrom = filterValues?.dateFrom || "";
  const dateTo = filterValues?.dateTo || "";

  function handleDateFromChange(value) {
    setDateRange({
      dateFrom: value,
      dateTo: dateTo && value && dateTo < value ? value : dateTo,
    });
  }

  function handleDateToChange(value) {
    setDateRange({
      dateFrom,
      dateTo: value,
    });
  }

  return (
    <div className={`flex w-full justify-end ${className}`}>
      <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 lg:max-w-[430px]">
        <DateRangeInput
          label="From"
          value={dateFrom}
          onChange={handleDateFromChange}
        />

        <DateRangeInput
          label="To"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={handleDateToChange}
        />
      </div>
    </div>
  );
}

export default PaginationContext;
