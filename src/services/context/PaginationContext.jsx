import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";

import DatePicker from "../../components/ui/DatePicker.jsx";

const PaginationContext = createContext(null);

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

function DateRangeInput({ label, topLabel, value, min, onChange }) {
  return (
    <DatePicker
      label={topLabel || label}
      hideLabel={!topLabel}
      leadingLabel={label}
      value={value}
      min={min}
      onChange={onChange}
      placeholder="Select date"
      clearable
      showToday
    />
  );
}

export function PaginationDateRangeFilter({
  entity,
  visible = false,
  className = "",
  showTopLabels = false,
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
      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:max-w-[430px]">
        <DateRangeInput
          label="From"
          topLabel={showTopLabels ? "From Date" : null}
          value={dateFrom}
          onChange={handleDateFromChange}
        />

        <DateRangeInput
          label="To"
          topLabel={showTopLabels ? "To Date" : null}
          value={dateTo}
          min={dateFrom || undefined}
          onChange={handleDateToChange}
        />
      </div>
    </div>
  );
}

export default PaginationContext;
