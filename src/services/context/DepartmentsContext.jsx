import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getDepartments } from "@/lib/axios/getDepartments";
import { normalizeDepartmentDirectoryResponse } from "@/lib/utils/departments/departmentDirectory";

const DepartmentsContext = createContext(null);

const EMPTY_DIRECTORY = normalizeDepartmentDirectoryResponse();

function errorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export function DepartmentsProvider({ children }) {
  const [directory, setDirectory] = useState(EMPTY_DIRECTORY);
  const [search, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatusValue] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      300,
    );
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    let active = true;

    async function load() {
      setError("");
      if (refreshKey > 0) setRefreshing(true);
      else setLoading(true);

      try {
        const payload = await getDepartments({
          page: 1,
          limit: 50,
          search: debouncedSearch,
          status,
        });

        if (active) {
          setDirectory(normalizeDepartmentDirectoryResponse(payload));
        }
      } catch (requestError) {
        if (active) {
          setError(
            errorMessage(
              requestError,
              "Unable to load the department directory.",
            ),
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [debouncedSearch, refreshKey, status]);

  const setSearch = useCallback((value) => {
    setSearchValue(value);
  }, []);

  const setStatus = useCallback((value) => {
    setStatusValue(value);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchValue("");
    setDebouncedSearch("");
    setStatusValue("all");
  }, []);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  const value = useMemo(
    () => ({
      ...directory,
      search,
      status,
      loading,
      refreshing,
      error,
      page: 1,
      hasActiveFilters: Boolean(search.trim()) || status !== "all",
      setSearch,
      setStatus,
      setPage: () => {},
      clearFilters,
      refresh,
    }),
    [
      directory,
      search,
      status,
      loading,
      refreshing,
      error,
      setSearch,
      setStatus,
      clearFilters,
      refresh,
    ],
  );

  return (
    <DepartmentsContext.Provider value={value}>
      {children}
    </DepartmentsContext.Provider>
  );
}

export default DepartmentsContext;
