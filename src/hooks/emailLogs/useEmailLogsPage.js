import { useCallback, useEffect, useMemo, useState } from "react";

import { getEmailLogs } from "@/lib/axios/getEmailLogs";
import {
  buildEmailLogCategories,
  buildEmailLogMetrics,
  filterEmailLogs,
  normalizeEmailLogRecord,
  paginateEmailLogs,
  retryEmailDelivery,
} from "@/lib/utils/emailLogs/emailLogsHelpers";

const PAGE_SIZE = 8;

export default function useEmailLogsPage() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [account, setAccount] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecords = useCallback(async () => {
    setRefreshing(true);

    try {
      const result = await getEmailLogs({ limit: 2000 });
      const nextRecords = Array.isArray(result?.records)
        ? result.records.map(normalizeEmailLogRecord)
        : [];

      setRecords(nextRecords);
    } catch (error) {
      console.error(
        "Unable to load email logs:",
        error?.response?.data || error?.message || error,
      );
      setRecords([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const resetPage = useCallback((setter) => (value) => {
    setter(value);
    setPage(1);
  }, []);

  const filteredRecords = useMemo(
    () => filterEmailLogs(records, { search, category, account, status }),
    [records, search, category, account, status],
  );

  const pagination = useMemo(
    () => paginateEmailLogs(filteredRecords, page, PAGE_SIZE),
    [filteredRecords, page],
  );

  const metrics = useMemo(() => buildEmailLogMetrics(records), [records]);

  const statusCounts = useMemo(() => ({
    all: records.length,
    delivered: metrics.delivered,
    opened: metrics.opened,
    clicked: metrics.clicked,
    bounced: metrics.bounced,
    failed: metrics.failed,
    internal: records.filter((record) => record.category === "Approval Needed").length,
    relay: metrics.bounced + metrics.failed,
  }), [metrics, records]);

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
    setRecords((current) => retryEmailDelivery(current, recordId));
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
    visibleRecords: pagination.records,
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
