import { useCallback, useEffect, useMemo, useState } from "react";

import { getEmailLogs } from "@/lib/axios/getEmailLogs";
import {
  buildCandidateEmailGroups,
  buildEmailLogCategories,
  buildEmailLogMetrics,
  filterEmailLogs,
  normalizeEmailLogRecord,
  paginateEmailLogs,
  retryEmailDelivery,
} from "@/lib/utils/emailLogs/emailLogsHelpers";

const PAGE_SIZE = 8;
const EMAIL_LOGS_CACHE_KEY = "sibsEmailLogsCacheV1";

let emailLogsMemoryCache = null;

function readCachedRecords() {
  if (Array.isArray(emailLogsMemoryCache)) {
    return emailLogsMemoryCache;
  }

  if (typeof window === "undefined") return [];

  try {
    const raw = window.sessionStorage.getItem(EMAIL_LOGS_CACHE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    const records = Array.isArray(parsed?.records) ? parsed.records : [];

    emailLogsMemoryCache = records;
    return records;
  } catch (error) {
    console.error("Unable to restore cached email logs:", error);
    return [];
  }
}

function writeCachedRecords(records) {
  const safeRecords = Array.isArray(records) ? records : [];
  emailLogsMemoryCache = safeRecords;

  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      EMAIL_LOGS_CACHE_KEY,
      JSON.stringify({ records: safeRecords }),
    );
  } catch (error) {
    console.error("Unable to cache email logs:", error);
  }
}

export default function useEmailLogsPage() {
  const [records, setRecords] = useState(() => readCachedRecords());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [account, setAccount] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecords = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setRefreshing(true);

    try {
      const result = await getEmailLogs({ limit: 2000 });
      const nextRecords = Array.isArray(result?.records)
        ? result.records.map(normalizeEmailLogRecord)
        : [];

      writeCachedRecords(nextRecords);
      setRecords(nextRecords);
    } catch (error) {
      console.error(
        "Unable to load email logs:",
        error?.response?.data || error?.message || error,
      );

      // Keep the last successfully loaded records on screen if refresh fails.
      // This avoids clearing the directory while navigating back to the page.
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Restore cached records immediately, then silently revalidate in the
    // background. This matches the directory-style navigation experience:
    // returning to Email Logs does not wait on the API before showing data.
    void loadRecords({ silent: true });
  }, [loadRecords]);

  const resetPage = useCallback((setter) => (value) => {
    setter(value);
    setPage(1);
  }, []);

  const filteredRecords = useMemo(
    () => filterEmailLogs(records, { search, category, account, status }),
    [records, search, category, account, status],
  );

  const candidateGroups = useMemo(
    () => buildCandidateEmailGroups(filteredRecords, records),
    [filteredRecords, records],
  );

  const pagination = useMemo(
    () => paginateEmailLogs(candidateGroups, page, PAGE_SIZE),
    [candidateGroups, page],
  );

  const metrics = useMemo(() => buildEmailLogMetrics(records), [records]);

  const statusCounts = useMemo(() => {
    const baseFilters = { search, category, account };
    const candidateCountForStatus = (nextStatus) => {
      const matchingRecords = filterEmailLogs(records, {
        ...baseFilters,
        status: nextStatus,
      });

      return buildCandidateEmailGroups(matchingRecords, records).length;
    };

    return {
      all: candidateCountForStatus("all"),
      delivered: candidateCountForStatus("delivered"),
      opened: candidateCountForStatus("opened"),
      clicked: candidateCountForStatus("clicked"),
      bounced: candidateCountForStatus("bounced"),
      failed: candidateCountForStatus("failed"),
      internal: candidateCountForStatus("internal"),
      relay: candidateCountForStatus("relay"),
    };
  }, [records, search, category, account]);

  const categories = useMemo(
    () => buildEmailLogCategories(records),
    [records],
  );

  const accounts = useMemo(
    () => [...new Set(records.map((record) => record.account).filter((value) => value && value !== "—"))].sort(),
    [records],
  );

  const clearFilters = useCallback(() => {
    setSearch("");
    setCategory("all");
    setAccount("all");
    setStatus("all");
    setPage(1);
  }, []);

  const refresh = useCallback(() => {
    void loadRecords();
  }, [loadRecords]);

  const retryDelivery = useCallback((recordId) => {
    setRecords((current) => {
      const nextRecords = retryEmailDelivery(current, recordId);
      writeCachedRecords(nextRecords);
      return nextRecords;
    });
  }, []);

  return {
    records,
    metrics,
    statusCounts,
    categories,
    accounts,
    search,
    category,
    account,
    status,
    page: pagination.currentPage,
    pageSize: PAGE_SIZE,
    totalPages: pagination.totalPages,
    totalRecords: pagination.totalRecords,
    totalEmails: records.length,
    filteredEmailCount: filteredRecords.length,
    candidates: candidateGroups,
    visibleCandidates: pagination.records,
    refreshing,
    hasActiveFilters: Boolean(search || category !== "all" || account !== "all" || status !== "all"),
    setSearch: resetPage(setSearch),
    setCategory: resetPage(setCategory),
    setAccount: resetPage(setAccount),
    setStatus: resetPage(setStatus),
    setPage,
    clearFilters,
    refresh,
    retryDelivery,
  };
}
