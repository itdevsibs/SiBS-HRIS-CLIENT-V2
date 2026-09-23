import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getDepartmentDetails,
  getDepartments,
} from "@/lib/axios/getDepartments";
import {
  normalizeDepartmentDetailsResponse,
  normalizeDepartmentDirectoryResponse,
} from "@/lib/utils/departments/departmentDirectory";

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
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
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
          page,
          limit: 6,
          search: debouncedSearch,
          status,
        });
        if (active) setDirectory(normalizeDepartmentDirectoryResponse(payload));
      } catch (requestError) {
        if (active) {
          setError(errorMessage(requestError, "Unable to load the department directory."));
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
  }, [debouncedSearch, page, refreshKey, status]);

  const setSearch = useCallback((value) => {
    setSearchValue(value);
    setPage(1);
  }, []);

  const setStatus = useCallback((value) => {
    setStatusValue(value);
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchValue("");
    setDebouncedSearch("");
    setStatusValue("all");
    setPage(1);
  }, []);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  const openDepartment = useCallback(async (department) => {
    setSelectedDepartment({ ...department, accounts: [] });
    setDetailsLoading(true);
    setDetailsError("");

    try {
      const payload = await getDepartmentDetails(department.id);
      setSelectedDepartment(normalizeDepartmentDetailsResponse(payload));
    } catch (requestError) {
      setDetailsError(errorMessage(requestError, "Unable to load department details."));
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const closeDepartment = useCallback(() => {
    setSelectedDepartment(null);
    setDetailsError("");
  }, []);

  const value = useMemo(() => ({
    ...directory,
    search,
    status,
    loading,
    refreshing,
    error,
    page,
    selectedDepartment,
    detailsLoading,
    detailsError,
    hasActiveFilters: Boolean(search.trim()) || status !== "all",
    setSearch,
    setStatus,
    setPage,
    clearFilters,
    refresh,
    openDepartment,
    closeDepartment,
  }), [
    directory,
    search,
    status,
    loading,
    refreshing,
    error,
    page,
    selectedDepartment,
    detailsLoading,
    detailsError,
    setSearch,
    setStatus,
    clearFilters,
    refresh,
    openDepartment,
    closeDepartment,
  ]);

  return (
    <DepartmentsContext.Provider value={value}>
      {children}
    </DepartmentsContext.Provider>
  );
}

export default DepartmentsContext;
