import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Header from "../../components/layout/Header";
import AttritionReportsHeader from "../../components/recruitment/attritionReports/AttritionReportsHeader.jsx";
import AttritionReportsKpiSummary from "../../components/recruitment/attritionReports/AttritionReportsKpiSummary.jsx";
import AttritionReportsAnalytics from "../../components/recruitment/attritionReports/AttritionReportsAnalytics.jsx";
import AttritionReportsRecruitmentStage from "../../components/recruitment/attritionReports/AttritionReportsRecruitmentStage.jsx";
import AttritionReportsTable from "../../components/recruitment/attritionReports/AttritionReportsTable.jsx";
import AttritionRecordDetailModal from "../../components/recruitment/attritionReports/AttritionRecordDetailModal.jsx";

import {
  getAttritionFilterOptions,
  getAttritionSummary,
  getAttritionRecords,
  downloadAttritionReportCsv,
  getDefaultAttritionDateRange,
} from "../../lib/axios/getAttritionReports.js";

function createDefaultFilters() {
  const range = getDefaultAttritionDateRange();
  return {
    dateFrom: range.dateFrom,
    dateTo: range.dateTo,
    cluster: "All",
    account: "All",
    department: "All",
    classification: "All",
    status: "All",
    search: "",
  };
}

export default function AttritionReportsPage() {
  const mainRef = useRef(null);

  const [filters, setFilters] = useState(createDefaultFilters);
  const [filterOptions, setFilterOptions] = useState({
    clusters: ["All"],
    accounts: [],
    departments: ["All"],
  });

  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 15,
  });
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState("");
  const [summaryReloadKey, setSummaryReloadKey] = useState(0);
  const [recordsReloadKey, setRecordsReloadKey] = useState(0);

  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  useLayoutEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    requestAnimationFrame(() => {
      mainRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, []);

  // Load filter options on mount
  useEffect(() => {
    const controller = new AbortController();
    getAttritionFilterOptions(controller.signal)
      .then((res) => {
        if (res?.success) {
          setFilterOptions({
            clusters: res.clusters || ["All"],
            accounts: res.accounts || [],
            departments: res.departments || ["All"],
          });
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.warn("[AttritionReports] Filter options error:", err?.message);
        }
      });

    return () => controller.abort();
  }, []);

  // Load summary KPIs & analytics
  useEffect(() => {
    const controller = new AbortController();
    setSummaryLoading(true);
    setSummaryError("");

    getAttritionSummary(
      {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        cluster: filters.cluster,
        account: filters.account,
        department: filters.department,
      },
      controller.signal,
    )
      .then((res) => {
        if (res?.success) {
          setSummaryData(res);
        } else {
          setSummaryData(null);
          setSummaryError(res?.message || "Failed to load summary.");
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setSummaryData(null);
          setSummaryError(
            err?.response?.data?.message || err?.message || "Failed to load summary.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSummaryLoading(false);
        }
      });

    return () => controller.abort();
  }, [
    filters.dateFrom,
    filters.dateTo,
    filters.cluster,
    filters.account,
    filters.department,
    summaryReloadKey,
  ]);

  // Load detailed employee records
  useEffect(() => {
    const controller = new AbortController();
    setRecordsLoading(true);
    setRecordsError("");

    getAttritionRecords(
      {
        page,
        limit: 15,
        search: filters.search,
        cluster: filters.cluster,
        account: filters.account,
        department: filters.department,
        classification: filters.classification,
        status: filters.status,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      },
      controller.signal,
    )
      .then((res) => {
        if (res?.success) {
          setRecords(res.data || []);
          if (res.pagination) {
            setPagination(res.pagination);
          }
        } else {
          setRecords([]);
          setPagination({ currentPage: 1, totalPages: 1, total: 0, limit: 15 });
          setRecordsError(res?.message || "Failed to load employee records.");
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setRecords([]);
          setPagination({ currentPage: 1, totalPages: 1, total: 0, limit: 15 });
          setRecordsError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load employee records.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setRecordsLoading(false);
        }
      });

    return () => controller.abort();
  }, [
    page,
    filters.search,
    filters.cluster,
    filters.account,
    filters.department,
    filters.classification,
    filters.status,
    filters.dateFrom,
    filters.dateTo,
    recordsReloadKey,
  ]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPage(1);
  }, []);

  const handleExport = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportError("");
    try {
      await downloadAttritionReportCsv({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        cluster: filters.cluster,
        account: filters.account,
        department: filters.department,
        classification: filters.classification,
        status: filters.status,
        search: filters.search,
      });
    } catch (err) {
      console.error("[AttritionReports] Export failed:", err);
      setExportError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to export attrition CSV report. Please try again.",
      );
    } finally {
      setIsExporting(false);
    }
  }, [filters, isExporting]);

  const handleSelectAccountFromChart = useCallback((accountName) => {
    if (accountName) {
      setFilters((prev) => ({ ...prev, account: accountName }));
      setPage(1);
    }
  }, []);

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main ref={mainRef} className="sibs-dashboard-main-wide min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-7">
        <div className="mx-auto flex min-h-full w-full max-w-[1700px] flex-col gap-3.5 sm:gap-4 2xl:gap-5">
          {/* SECTION 1 — HEADER */}
          <AttritionReportsHeader
            filters={filters}
            filterOptions={filterOptions}
            onFilterChange={handleFilterChange}
            onExport={handleExport}
            isExporting={isExporting}
          />

          {exportError ? (
            <div
              role="alert"
              className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-900"
            >
              <span>{exportError}</span>
              <button
                type="button"
                onClick={() => setExportError("")}
                className="text-rose-700 hover:text-rose-950 font-extrabold text-sm ml-2"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          ) : null}

          {/* SECTION 2 — ATTRITION KPI SUMMARY */}
          {summaryError && !summaryLoading ? (
            <div role="alert" className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-900">
              <span>Unable to load attrition summary: {summaryError}</span>
              <button
                type="button"
                onClick={() => setSummaryReloadKey((k) => k + 1)}
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-rose-300 bg-white px-3.5 py-1.5 text-xs font-extrabold text-rose-800 shadow-xs hover:bg-rose-50 transition active:scale-95"
              >
                Retry Summary
              </button>
            </div>
          ) : (
            <>
              <AttritionReportsKpiSummary data={summaryData} loading={summaryLoading} />
              {/* SECTION 4 — ATTRITION ANALYTICS (Trends, By Account, Breakdown) */}
              <AttritionReportsAnalytics
                data={summaryData}
                loading={summaryLoading}
                selectedAccount={filters.account}
                onSelectAccount={handleSelectAccountFromChart}
              />
              {/* SECTION 5 — RECRUITMENT-STAGE ATTRITION */}
              <AttritionReportsRecruitmentStage data={summaryData} loading={summaryLoading} />
            </>
          )}

          {/* SECTION 6 — DETAILED EMPLOYEE ATTRITION REPORT */}
          <AttritionReportsTable
            records={records}
            pagination={pagination}
            loading={recordsLoading}
            error={recordsError}
            filters={filters}
            onFilterChange={handleFilterChange}
            onPageChange={setPage}
            onViewRecord={setSelectedRecord}
            onRetry={() => setRecordsReloadKey((k) => k + 1)}
          />

          {/* VIEW DETAIL MODAL */}
          <AttritionRecordDetailModal
            open={Boolean(selectedRecord)}
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
          />
        </div>
      </main>
    </div>
  );
}
