import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  createSourceCostEntry as createSourceCostEntryApi,
  deleteSourceCostEntry as deleteSourceCostEntryApi,
  getSourcingAnalyticsData,
  getSourcingOptions as getSourcingOptionsApi,
  updateSourceCostEntry as updateSourceCostEntryApi,
} from "../../lib/axios/getSourcingAnalytics";
import {
  buildSourceRows,
  buildSourcingTotals,
} from "../../lib/utils/sourcing/sourcingCalculations";

const SourcingContext = createContext(null);

function getResponseArray(response, keys = []) {
  for (const key of keys) {
    const directValue = response?.[key];

    if (Array.isArray(directValue)) {
      return directValue;
    }

    const nestedValue = response?.data?.[key];

    if (Array.isArray(nestedValue)) {
      return nestedValue;
    }
  }

  return [];
}

export function SourcingProvider({ children }) {
  const [publicSubmissions, setPublicSubmissions] = useState([]);
  const [costEntries, setCostEntries] = useState([]);
  const [sourcingOptions, setSourcingOptions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const applyAnalyticsResponse = useCallback((response) => {
    const nextPublicSubmissions = getResponseArray(response, [
      "publicSubmissions",
      "public_submissions",
    ]);

    const nextCostEntries = getResponseArray(response, [
      "sourceCostEntries",
      "source_cost_entries",
      "costEntries",
    ]);

    const nextSourcingOptions = getResponseArray(response, [
      "sourcingOptions",
      "sourcing_options",
      "options",
    ]);

    setPublicSubmissions(nextPublicSubmissions);
    setCostEntries(nextCostEntries);

    if (nextSourcingOptions.length > 0) {
      setSourcingOptions(nextSourcingOptions);
    }

    setCurrentPage(1);

    return {
      publicSubmissions: nextPublicSubmissions,
      costEntries: nextCostEntries,
      sourcingOptions: nextSourcingOptions,
    };
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getSourcingAnalyticsData();

      applyAnalyticsResponse(response);

      return response;
    } catch (requestError) {
      const message =
        requestError?.message ||
        "Failed to load sourcing analytics.";

      setError(message);

      throw requestError;
    } finally {
      setLoading(false);
    }
  }, [applyAnalyticsResponse]);

  const fetchSourcingOptions = useCallback(async () => {
    setError("");

    try {
      const response = await getSourcingOptionsApi();

      const options = getResponseArray(response, [
        "sourcingOptions",
        "sourcing_options",
        "options",
      ]);

      setSourcingOptions(options);

      return response;
    } catch (requestError) {
      const message =
        requestError?.message ||
        "Failed to load sourcing options.";

      setError(message);

      throw requestError;
    }
  }, []);

  const createSourceCostEntry = useCallback(
    async (payload) => {
      setMutating(true);
      setError("");

      try {
        const response =
          await createSourceCostEntryApi(payload);

        await fetchList();

        return response;
      } catch (requestError) {
        const message =
          requestError?.message ||
          "Failed to add source cost entry.";

        setError(message);

        throw requestError;
      } finally {
        setMutating(false);
      }
    },
    [fetchList],
  );

  const updateSourceCostEntry = useCallback(
    async (id, payload) => {
      setMutating(true);
      setError("");

      try {
        const response =
          await updateSourceCostEntryApi(id, payload);

        await fetchList();

        return response;
      } catch (requestError) {
        const message =
          requestError?.message ||
          "Failed to update source cost entry.";

        setError(message);

        throw requestError;
      } finally {
        setMutating(false);
      }
    },
    [fetchList],
  );

  const deleteSourceCostEntry = useCallback(
    async (id) => {
      setMutating(true);
      setError("");

      try {
        const response =
          await deleteSourceCostEntryApi(id);

        await fetchList();

        return response;
      } catch (requestError) {
        const message =
          requestError?.message ||
          "Failed to remove source cost entry.";

        setError(message);

        throw requestError;
      } finally {
        setMutating(false);
      }
    },
    [fetchList],
  );

  const addSourceCost = createSourceCostEntry;
  const editSourceCost = updateSourceCostEntry;
  const removeSourceCost = deleteSourceCostEntry;

  /*
   * Temporary compatibility for the current page.
   * This no longer inserts local sample data.
   * It simply reloads the database-backed analytics.
   */
  const loadSampleData = useCallback(async () => {
    return fetchList();
  }, [fetchList]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setCurrentPage(1);
  }, []);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  const sourceRows = useMemo(() => {
    return buildSourceRows(
      publicSubmissions,
      costEntries,
    );
  }, [publicSubmissions, costEntries]);

  const totals = useMemo(() => {
    return buildSourcingTotals(
      sourceRows,
      costEntries,
    );
  }, [sourceRows, costEntries]);

  const value = useMemo(
    () => ({
      loading,
      mutating,
      error,

      publicSubmissions,
      costEntries,
      sourcingOptions,
      sourceRows,
      totals,

      search,
      setSearch,
      currentPage,
      setCurrentPage,

      fetchList,
      refresh: fetchList,
      fetchSourcingOptions,

      clearFilters,
      clearError,

      createSourceCostEntry,
      addSourceCost,

      updateSourceCostEntry,
      editSourceCost,

      deleteSourceCostEntry,
      removeSourceCost,

      // Temporary compatibility until the page button is removed.
      loadSampleData,
    }),
    [
      loading,
      mutating,
      error,
      publicSubmissions,
      costEntries,
      sourcingOptions,
      sourceRows,
      totals,
      search,
      currentPage,
      fetchList,
      fetchSourcingOptions,
      clearFilters,
      clearError,
      createSourceCostEntry,
      addSourceCost,
      updateSourceCostEntry,
      editSourceCost,
      deleteSourceCostEntry,
      removeSourceCost,
      loadSampleData,
    ],
  );

  return (
    <SourcingContext.Provider value={value}>
      {children}
    </SourcingContext.Provider>
  );
}

export function useSourcing() {
  const context = useContext(SourcingContext);

  if (!context) {
    throw new Error(
      "useSourcing must be used within SourcingProvider.",
    );
  }

  return context;
}

export function useSourcingAnalytics() {
  const context = useContext(SourcingContext);

  if (!context) {
    throw new Error(
      "useSourcingAnalytics must be used within SourcingProvider.",
    );
  }

  return context;
}

export default SourcingContext;
