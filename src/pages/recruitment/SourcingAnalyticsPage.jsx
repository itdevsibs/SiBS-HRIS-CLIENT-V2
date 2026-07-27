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
        className="sibs-dashboard-main-wide"
      >
        <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
          <section className="sibs-page-header-in sibs-page-card-in sibs-card relative overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-5 font-jakarta shadow-sm sm:p-6">
            <span
              className="sibs-top-accent"
              aria-hidden="true"
            />

            <div className="mt-1 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-normal text-[#042C51]">
                    <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
                    Recruitment Intelligence
                  </span>

                  <span className="inline-flex items-center rounded border border-orange-100 bg-[#FFF0EB] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-normal text-[#FF5C28]">
                    ROI & Conversion Analytics
                  </span>
                </div>

                <h1 className="break-words text-xl font-extrabold text-[#042C51] sm:text-2xl">
                  Sourcing Analytics
                </h1>

                <p className="max-w-3xl text-xs font-semibold leading-relaxed text-[#667085] sm:text-sm">
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
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    size={15}
                    className={
                      refreshing ? "animate-spin" : ""
                    }
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddCostModal(true)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] focus:outline-none focus:ring-4 focus:ring-[#FF5C28]/20"
                >
                  <Plus size={15} />
                  Add Source Cost Entry
                </button>
              </div>
            </div>
          </section>

          <SourcingSummaryCards totals={totals} />

          <SourcingAnalyticsCharts data={sourceRows} />

          <section
            className="sibs-profile-tab-panel sibs-page-card-in overflow-visible rounded-2xl border border-[#E6ECF2] bg-white font-jakarta shadow-sm"
            style={{ animationDelay: "180ms" }}
          >
            <SourcingAnalyticsFilters />

            <SourcingAnalyticsTable
              onView={setSelectedSource}
            />
          </section>

          <section
            className="sibs-profile-tab-panel rounded-xl border border-blue-100 bg-blue-50 p-4"
            style={{ animationDelay: "480ms" }}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white text-[#042C51] shadow-sm">
                <Target size={15} />
              </span>

              <div>
                <h3 className="text-xs font-extrabold text-[#042C51]">
                  Cost per Hire Process Note
                </h3>

                <p className="mt-1 text-xs font-semibold leading-5 text-[#042C51]/75">
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