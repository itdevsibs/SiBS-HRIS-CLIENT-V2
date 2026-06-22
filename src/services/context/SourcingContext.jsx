import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  createSourceCostEntry as createSourceCostEntryApi,
  getSourcingAnalyticsData,
  loadSourcingSampleData,
} from "../../lib/axios/getSourcingAnalytics";
import {
  buildSourceRows,
  buildSourcingTotals,
} from "../../lib/utils/sourcing/sourcingCalculations";

const SourcingContext = createContext(null);

export function SourcingProvider({ children }) {
  const [publicSubmissions, setPublicSubmissions] = useState([]);
  const [costEntries, setCostEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchList = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getSourcingAnalyticsData();

      setPublicSubmissions(response?.publicSubmissions || []);
      setCostEntries(response?.sourceCostEntries || []);
      setCurrentPage(1);

      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSourceCostEntry = useCallback(
    async (payload) => {
      const response = await createSourceCostEntryApi(payload);

      await fetchList();

      return response;
    },
    [fetchList],
  );

  const addSourceCost = createSourceCostEntry;

  const loadSampleData = useCallback(async () => {
    setLoading(true);

    try {
      const response = await loadSourcingSampleData();

      setPublicSubmissions(response?.publicSubmissions || []);
      setCostEntries(response?.sourceCostEntries || []);
      setCurrentPage(1);

      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setCurrentPage(1);
  }, []);

  const sourceRows = useMemo(() => {
    return buildSourceRows(publicSubmissions, costEntries);
  }, [publicSubmissions, costEntries]);

  const totals = useMemo(() => {
    return buildSourcingTotals(sourceRows, costEntries);
  }, [sourceRows, costEntries]);

  const value = useMemo(
    () => ({
      loading,

      publicSubmissions,
      costEntries,
      sourceRows,
      totals,

      search,
      setSearch,
      currentPage,
      setCurrentPage,

      fetchList,
      clearFilters,
      createSourceCostEntry,
      addSourceCost,
      loadSampleData,
    }),
    [
      loading,
      publicSubmissions,
      costEntries,
      sourceRows,
      totals,
      search,
      currentPage,
      fetchList,
      clearFilters,
      createSourceCostEntry,
      addSourceCost,
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
    throw new Error("useSourcing must be used within SourcingProvider.");
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