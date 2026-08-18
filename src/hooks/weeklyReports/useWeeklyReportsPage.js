import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  REPORTS_PER_PAGE,
  WEEKLY_REPORT_REFRESH_EVENTS,
  WEEKLY_REPORTS_STORAGE_KEY,
} from "../../lib/utils/weeklyReports/weeklyReportsConstants.js";
import { fallbackWeeklyReports } from "../../lib/utils/weeklyReports/weeklyReportsFallbackData.js";
import {
  buildModuleContext,
  getModuleSignalCards,
} from "../../lib/utils/weeklyReports/weeklyReportsCalculations.js";
import { buildCurrentReportFromModules } from "../../lib/utils/weeklyReports/weeklyReportsGenerator.js";
import {
  safeReadArray,
  safeWriteArray,
} from "../../lib/utils/weeklyReports/weeklyReportsStorage.js";

export default function useWeeklyReportsPage() {
  const mainRef = useRef(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [selectedReport, setSelectedReport] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [savedReports, setSavedReports] = useState(() => {
    const stored = safeReadArray(WEEKLY_REPORTS_STORAGE_KEY, []);
    return stored.length > 0 ? stored : fallbackWeeklyReports;
  });

  const scrollToTop = useCallback((behavior = "auto") => {
    requestAnimationFrame(() => {
      if (mainRef.current) {
        mainRef.current.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
      }
    });
  }, []);

  const scrollToTopAfterRender = useCallback(() => {
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
  }, [scrollToTop]);

  useLayoutEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    scrollToTop("auto");

    const timer = window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [scrollToTop]);

  useEffect(() => {
    safeWriteArray(WEEKLY_REPORTS_STORAGE_KEY, savedReports);
  }, [savedReports]);

  useEffect(() => {
    function refreshFromStorage() {
      setRefreshKey((previous) => previous + 1);
      scrollToTopAfterRender();
    }

    WEEKLY_REPORT_REFRESH_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, refreshFromStorage);
    });

    return () => {
      WEEKLY_REPORT_REFRESH_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, refreshFromStorage);
      });
    };
  }, [scrollToTopAfterRender]);

  const moduleContext = useMemo(() => buildModuleContext(), [refreshKey]);

  const generatedCurrentReport = useMemo(
    () => buildCurrentReportFromModules(moduleContext),
    [moduleContext],
  );

  const reports = useMemo(() => {
    if (!generatedCurrentReport) return savedReports;

    const withoutSameWeek = savedReports.filter(
      (report) => report.reportId !== generatedCurrentReport.reportId,
    );

    return [generatedCurrentReport, ...withoutSameWeek];
  }, [generatedCurrentReport, savedReports]);

  const moduleSignalCards = useMemo(
    () => getModuleSignalCards(moduleContext),
    [moduleContext],
  );

  const filteredReports = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return reports.filter((report) => {
      const reportId = String(report.reportId || "").toLowerCase();
      const weekLabel = String(report.weekLabel || "").toLowerCase();
      const dateRange = String(report.dateRange || "").toLowerCase();
      const status = String(report.status || "").toLowerCase();

      const matchesSearch =
        !keyword ||
        reportId.includes(keyword) ||
        weekLabel.includes(keyword) ||
        dateRange.includes(keyword) ||
        status.includes(keyword);

      const matchesStatus =
        statusFilter === "All Status" || report.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reports, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReports.length / REPORTS_PER_PAGE),
  );

  const paginatedReports = useMemo(() => {
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const start = (safePage - 1) * REPORTS_PER_PAGE;
    const end = start + REPORTS_PER_PAGE;

    return filteredReports.slice(start, end);
  }, [filteredReports, currentPage, totalPages]);

  const showingFrom =
    filteredReports.length > 0 ? (currentPage - 1) * REPORTS_PER_PAGE + 1 : 0;

  const showingTo = Math.min(
    currentPage * REPORTS_PER_PAGE,
    filteredReports.length,
  );

  useEffect(() => {
    setCurrentPage(1);
    scrollToTopAfterRender();
  }, [search, statusFilter, scrollToTopAfterRender]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
      scrollToTop("auto");
    }
  }, [currentPage, totalPages, scrollToTop]);

  const stats = useMemo(() => {
    const current = reports[0];

    return {
      current,
      totalReports: reports.length,
      generated: reports.filter((report) => report.status === "Generated").length,
      sent: reports.filter((report) => report.status === "Sent").length,
      archived: reports.filter((report) => report.status === "Archived").length,
    };
  }, [reports]);

  function handlePageChange(nextPage) {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);

    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }

    scrollToTopAfterRender();
  }

  function handleGenerateCurrentWeek() {
    const report = buildCurrentReportFromModules(moduleContext);

    if (!report) {
      alert("No recruitment module data is available to generate a weekly report.");
      scrollToTop("auto");
      return;
    }

    setSavedReports((previous) => [
      report,
      ...previous.filter((item) => item.reportId !== report.reportId),
    ]);

    setSelectedReport(report);
    setCurrentPage(1);
    scrollToTopAfterRender();
  }

  function handleMarkSent(report) {
    const updated = {
      ...report,
      status: "Sent",
    };

    setSavedReports((previous) => [
      updated,
      ...previous.filter((item) => item.reportId !== report.reportId),
    ]);

    setSelectedReport(updated);
    setCurrentPage(1);
    scrollToTopAfterRender();
  }

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("All Status");
    setCurrentPage(1);
    scrollToTopAfterRender();
  }

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  async function handleRefreshData() {
    if (isManualRefreshing) return;
    setIsManualRefreshing(true);
    try {
      setRefreshKey((previous) => previous + 1);
      setCurrentPage(1);
      scrollToTopAfterRender();
      // brief debounce for natural tactile feedback
      await new Promise((resolve) => setTimeout(resolve, 300));
    } finally {
      setIsManualRefreshing(false);
    }
  }

  return {
    mainRef,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    selectedReport,
    setSelectedReport,
    currentPage,
    totalPages,
    filteredReports,
    paginatedReports,
    showingFrom,
    showingTo,
    stats,
    moduleSignalCards,
    isManualRefreshing,
    handlePageChange,
    handleGenerateCurrentWeek,
    handleMarkSent,
    handleClearFilters,
    handleRefreshData,
  };
}
