import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ACTION_ITEMS_STORAGE_KEY,
  OFFER_RECORDS_KEY,
  REPORTS_PER_PAGE,
  WEEKLY_REPORT_REFRESH_EVENTS,
  WEEKLY_REPORTS_STORAGE_KEY,
} from "../../lib/utils/weeklyReports/weeklyReportsConstants.js";
import {
  buildModuleContext,
  getModuleSignalCards,
} from "../../lib/utils/weeklyReports/weeklyReportsCalculations.js";
import { buildCurrentReportFromModules } from "../../lib/utils/weeklyReports/weeklyReportsGenerator.js";
import {
  safeReadArray,
  safeWriteArray,
} from "../../lib/utils/weeklyReports/weeklyReportsStorage.js";

import { getHiringNeeds } from "../../lib/axios/getHiringNeeds.js";
import { getCandidatePipelineCandidates } from "../../lib/axios/getCandidatePipeline.js";
import onboardingApi from "../../lib/axios/getOnboarding.js";
import { getSourcingAnalyticsData } from "../../lib/axios/getSourcingAnalytics.js";
import { getWorkforceHiringPlanAccounts } from "../../lib/axios/getWorkforceHiringPlan.js";

export default function useWeeklyReportsPage() {
  const mainRef = useRef(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [selectedReport, setSelectedReport] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [liveRecords, setLiveRecords] = useState(null);

  const [savedReports, setSavedReports] = useState(() => {
    return safeReadArray(WEEKLY_REPORTS_STORAGE_KEY, []);
  });

  const fetchLiveWeeklyReportData = useCallback(async () => {
    try {
      const [
        hiringNeedsRes,
        pipelineRes,
        onboardingRes,
        sourcingRes,
        workforceRes,
      ] = await Promise.allSettled([
        getHiringNeeds().catch(() => ({})),
        getCandidatePipelineCandidates().catch(() => ({})),
        onboardingApi.getOnboardingRecords().catch(() => ({})),
        getSourcingAnalyticsData().catch(() => ({})),
        getWorkforceHiringPlanAccounts().catch(() => ([])),
      ]);

      const hiringNeedsData =
        hiringNeedsRes.status === "fulfilled"
          ? Array.isArray(hiringNeedsRes.value?.data)
            ? hiringNeedsRes.value.data
            : Array.isArray(hiringNeedsRes.value)
              ? hiringNeedsRes.value
              : []
          : [];

      const pipelineData =
        pipelineRes.status === "fulfilled"
          ? Array.isArray(pipelineRes.value?.data)
            ? pipelineRes.value.data
            : Array.isArray(pipelineRes.value?.candidates)
              ? pipelineRes.value.candidates
              : Array.isArray(pipelineRes.value)
                ? pipelineRes.value
                : []
          : [];

      const onboardingData =
        onboardingRes.status === "fulfilled"
          ? Array.isArray(onboardingRes.value?.data)
            ? onboardingRes.value.data
            : Array.isArray(onboardingRes.value?.records)
              ? onboardingRes.value.records
              : Array.isArray(onboardingRes.value?.list)
                ? onboardingRes.value.list
                : []
          : [];

      const sourcingData =
        sourcingRes.status === "fulfilled"
          ? sourcingRes.value?.data || sourcingRes.value || {}
          : {};

      const workforceData =
        workforceRes.status === "fulfilled"
          ? Array.isArray(workforceRes.value?.data)
            ? workforceRes.value.data
            : Array.isArray(workforceRes.value)
              ? workforceRes.value
              : []
          : [];

      // Derive live offers from candidate pipeline
      const pipelineOffers = pipelineData
        .filter((cand) => {
          const stage = String(
            cand.stage || cand.pipelineStage || cand.currentStage || "",
          ).toLowerCase();
          const status = String(
            cand.status || cand.candidateStatus || "",
          ).toLowerCase();
          const offerStat = String(cand.offerStatus || "").toLowerCase();
          return (
            stage.includes("offer") ||
            status.includes("offer") ||
            offerStat.length > 0 ||
            Boolean(cand.offeredSalary || cand.basicPay)
          );
        })
        .map((cand) => ({
          id: cand.id || cand.candidateId,
          candidateName: cand.fullName || cand.candidateName || cand.name,
          role: cand.role || cand.position || cand.jobTitle,
          account: cand.account || cand.accountName || cand.finalAccount,
          status: cand.offerStatus || cand.status || "Pending Offer",
          approvalStatus:
            cand.approvalStatus || cand.offerApprovalStatus || "Pending",
          finalStatus: cand.finalStatus || cand.offerStatus || cand.status,
        }));

      const storedOffers = safeReadArray(OFFER_RECORDS_KEY, []);
      const combinedOffers = [...pipelineOffers];
      storedOffers.forEach((st) => {
        if (!combinedOffers.some((o) => o.id === st.id)) {
          combinedOffers.push(st);
        }
      });

      // Derive live action items from open hiring needs and onboarding items
      const storedActionItems = safeReadArray(ACTION_ITEMS_STORAGE_KEY, []);
      const systemActionItems = [];
      hiringNeedsData
        .filter((hn) =>
          String(hn.approvalStatus || hn.status || "")
            .toLowerCase()
            .includes("pending"),
        )
        .forEach((hn, idx) => {
          systemActionItems.push({
            id: `ACT-HN-${hn.id || idx}`,
            actionItem: `Follow up pending hiring need approval for ${hn.role || hn.position || "Staff"} (${hn.account || "Operations"})`,
            status: "Open",
            priority: "High",
          });
        });

      onboardingData
        .filter((ob) =>
          String(ob.status || ob.finalOutcome || "")
            .toLowerCase()
            .includes("pending"),
        )
        .forEach((ob, idx) => {
          systemActionItems.push({
            id: `ACT-OB-${ob.id || idx}`,
            actionItem: `Confirm onboarding start requirements for ${ob.candidateName || ob.name || "Candidate"}`,
            status: "Open",
            priority: "Medium",
          });
        });

      const combinedActionItems = [...storedActionItems];
      systemActionItems.forEach((act) => {
        if (
          !combinedActionItems.some(
            (item) => item.actionItem === act.actionItem,
          )
        ) {
          combinedActionItems.push(act);
        }
      });

      setLiveRecords({
        hiringNeeds: hiringNeedsData,
        pipelineCandidates: pipelineData,
        onboarding: onboardingData,
        publicSubmissions: Array.isArray(sourcingData?.publicSubmissions)
          ? sourcingData.publicSubmissions
          : [],
        internalCandidates: Array.isArray(sourcingData?.internalCandidates)
          ? sourcingData.internalCandidates
          : [],
        weeklyPlan: workforceData,
        offers: combinedOffers,
        actionItems: combinedActionItems,
      });
    } catch (err) {
      console.error("Failed to load live weekly report data:", err);
    }
  }, []);

  useEffect(() => {
    fetchLiveWeeklyReportData();
  }, [fetchLiveWeeklyReportData]);

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
      fetchLiveWeeklyReportData();
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
  }, [scrollToTopAfterRender, fetchLiveWeeklyReportData]);

  const moduleContext = useMemo(
    () => buildModuleContext(liveRecords),
    [liveRecords, refreshKey],
  );

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

  async function handleRefreshData() {
    if (isManualRefreshing) return;
    setIsManualRefreshing(true);
    try {
      await fetchLiveWeeklyReportData();
      setRefreshKey((previous) => previous + 1);
      setCurrentPage(1);
      scrollToTopAfterRender();
    } finally {
      setTimeout(() => setIsManualRefreshing(false), 400);
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
