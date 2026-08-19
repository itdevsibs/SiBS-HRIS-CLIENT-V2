import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  BarChart3,
  Plus,
  RefreshCw,
  Target,
} from "lucide-react";

import Header from "../../components/layout/Header";
import { useSourcingAnalytics } from "../../services/context/SourcingContext";

import SourcingAnalyticsFilters from "../../components/recruitment/sourcingAnalytics/SourcingAnalyticsFilters";
import SourcingAnalyticsCharts from "../../components/recruitment/sourcingAnalytics/SourcingAnalyticsCharts";
import SourcingAnalyticsTable from "../../components/recruitment/sourcingAnalytics/SourcingAnalyticsTable";
import SourcingSummaryCards from "../../components/recruitment/sourcingAnalytics/SourcingSummaryCards";

import AddSourceCostModal from "../../components/modals/sourcingAnalytics/AddSourceCostModal";
import SourceDetailsModal from "../../components/modals/sourcingAnalytics/SourceDetailsModal";
import StatusModal from "../../components/modals/StatusModal";

export default function SourcingAnalyticsPage() {
  const mainRef = useRef(null);

  const {
    fetchList,
    sourceRows,
    totals,
  } = useSourcingAnalytics();

  const [selectedSource, setSelectedSource] =
    useState(null);
  const [showAddCostModal, setShowAddCostModal] =
    useState(false);
  const [refreshing, setRefreshing] =
    useState(false);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const showStatusModal = useCallback((payload) => {
    setStatusModal({
      open: true,
      type: payload?.type || "success",
      title: payload?.title || "",
      message: payload?.message || "",
    });
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSourcingAnalytics() {
      try {
        await fetchList?.();
      } catch (error) {
        if (!active) return;

        showStatusModal({
          type: "error",
          title: "Unable to Load Data",
          message:
            error?.message ||
            "Unable to load sourcing analytics data.",
        });
      }
    }

    loadSourcingAnalytics();

    return () => {
      active = false;
    };
  }, [fetchList, showStatusModal]);

  const handleRefreshData = useCallback(async () => {
    if (refreshing) return;

    try {
      setRefreshing(true);
      await fetchList?.();

      showStatusModal({
        type: "success",
        title: "Data Refreshed",
        message:
          "Sourcing analytics data has been refreshed successfully.",
      });
    } catch (error) {
      showStatusModal({
        type: "error",
        title: "Refresh Failed",
        message:
          error?.message ||
          "Unable to refresh sourcing analytics data.",
      });
    } finally {
      setRefreshing(false);
    }
  }, [fetchList, refreshing, showStatusModal]);

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main
        ref={mainRef}
        className="sibs-dashboard-main-wide min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-7"
      >
        <div className="mx-auto w-full max-w-[1700px] space-y-4 sm:space-y-5">
          <section
            className="sibs-page-header-in sibs-page-card-in relative z-[30] overflow-visible rounded-2xl border border-[#E6ECF2] bg-white p-4 font-jakarta shadow-sm 2xl:p-6"
            style={{ animationDelay: "0ms", animationFillMode: "both" }}
          >
            <span
              className="sibs-top-accent pointer-events-none absolute left-[1px] right-[1px] top-[1px] h-1 overflow-hidden rounded-t-[15px]"
              aria-hidden="true"
            >
              <span className="block h-full w-full bg-gradient-to-r from-[#042C51] via-[#FF5C28] to-[#042C51]" />
            </span>

            <div className="mt-0.5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-normal text-[#042C51]">
                    <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
                    <BarChart3 className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" strokeWidth={2.2} />
                    Recruitment View
                  </span>
                </div>

                <h1 className="break-words text-lg 2xl:text-2xl font-extrabold tracking-tight text-[#042C51]">
                  Sourcing Analytics
                </h1>

                <p className="max-w-3xl sibs-text-sm font-semibold leading-relaxed text-[#667085]">
                  Analyze applicant channels, conversion
                  performance, sourcing cost, and recruitment
                  channel viability.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 self-end md:self-auto">
                <button
                  type="button"
                  onClick={handleRefreshData}
                  disabled={refreshing}
                  aria-label="Refresh Sourcing Analytics"
                  title="Refresh Sourcing Analytics"
                  className="inline-flex h-8.5 2xl:h-10 w-8.5 2xl:w-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white text-[#042C51] shadow-sm transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                      refreshing ? "animate-spin text-[#FF5C28]" : ""
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddCostModal(true)}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E04F20] focus:outline-none focus:ring-4 focus:ring-[#FF5C28]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
                  Add Source Cost Entry
                </button>
              </div>
            </div>
          </section>

          <SourcingSummaryCards totals={totals} />

          <SourcingAnalyticsCharts data={sourceRows} />

          <section
            className="sibs-profile-tab-panel sibs-page-card-in overflow-visible rounded-2xl border border-[#E6ECF2] bg-white font-jakarta shadow-sm"
            style={{ animationDelay: "180ms", animationFillMode: "both" }}
          >
            <SourcingAnalyticsFilters />

            <SourcingAnalyticsTable
              onView={setSelectedSource}
            />
          </section>

          <section
            className="sibs-profile-tab-panel sibs-process-note"
            style={{ animationDelay: "480ms", animationFillMode: "both" }}
          >
            <div className="flex items-start gap-2.5 sm:gap-3">
              <span className="sibs-process-note__icon">
                <Target className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
              </span>

              <div className="min-w-0">
                <h3 className="sibs-process-note__title">
                  Cost per Hire Process Note
                </h3>

                <p className="sibs-process-note__body">
                  Applicant volume is counted from public
                  application source selections. Recorded
                  sourcing expenses are grouped by the same
                  sourcing option. Cost per Hire is calculated
                  as total source cost divided by hired
                  candidates from that source.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <AddSourceCostModal
        open={showAddCostModal}
        onClose={() => setShowAddCostModal(false)}
        onStatus={showStatusModal}
      />

      <SourceDetailsModal
        open={Boolean(selectedSource)}
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
      />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        onClose={() =>
          setStatusModal((current) => ({
            ...current,
            open: false,
          }))
        }
        title={statusModal.title}
        message={statusModal.message}
      />
    </div>
  );
}