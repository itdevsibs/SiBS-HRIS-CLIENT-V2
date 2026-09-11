import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
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
import { PageHeaderHero } from "@/components/ui";

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
        <div className="mx-auto w-full max-w-[1700px] space-y-4 sm:space-y-5">
          <PageHeaderHero
            kicker="Recruitment View"
            title="Sourcing Analytics"
            description="Analyze applicant channels, conversion performance, sourcing cost, and recruitment channel viability."
            className="relative z-[30]"
            actions={
              <>
                <button
                  type="button"
                  onClick={handleRefreshData}
                  disabled={refreshing}
                  aria-label="Refresh Sourcing Analytics"
                  title="Refresh Sourcing Analytics"
                  className="sibs-btn-icon"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                      refreshing ? "animate-spin text-sibs-orange" : ""
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddCostModal(true)}
                  className="sibs-btn-primary max-sm:flex-1"
                >
                  <Plus className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
                  Add Source Cost Entry
                </button>
              </>
            }
          />

          <SourcingSummaryCards totals={totals} />

          <SourcingAnalyticsCharts data={sourceRows} />

          <section
            className="sibs-profile-tab-panel sibs-page-card-in overflow-visible rounded-2xl border border-sibs-border bg-white font-jakarta shadow-sm"
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