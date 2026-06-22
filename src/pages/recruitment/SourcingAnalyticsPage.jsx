import React, { useCallback, useEffect, useRef, useState } from "react";
import Header from "../../components/layout/Header";
import { Activity, BarChart3, Plus, ReceiptText } from "lucide-react";

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

  const { fetchList, loadSampleData, sourceRows, totals } = useSourcingAnalytics();

  const [selectedSource, setSelectedSource] = useState(null);
  const [showAddCostModal, setShowAddCostModal] = useState(false);

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
    fetchList?.();
  }, [fetchList]);

  async function handleRefreshData() {
    try {
      await fetchList?.();

      showStatusModal({
        type: "success",
        title: "Data Refreshed",
        message: "Sourcing analytics data has been refreshed successfully.",
      });
    } catch (error) {
      showStatusModal({
        type: "error",
        title: "Refresh Failed",
        message: error?.message || "Unable to refresh sourcing analytics data.",
      });
    }
  }

  async function handleLoadSampleData() {
    try {
      await loadSampleData?.();

      showStatusModal({
        type: "success",
        title: "Sample Data Loaded",
        message: "Sample sourcing data has been loaded successfully.",
      });
    } catch (error) {
      showStatusModal({
        type: "error",
        title: "Load Failed",
        message: error?.message || "Unable to load sample sourcing data.",
      });
    }
  }

  return (
    <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main
        ref={mainRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6"
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6"
      >
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="sibs-page-header-in flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                <BarChart3 size={14} />
                Recruitment
              </div>

              <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
                Sourcing Analytics
              </h1>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Track candidate source volume, conversion, source cost, and cost
                per hire from public application form submissions.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleRefreshData}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.98]"
              >
                <Activity size={18} />
                Refresh Data
              </button>

              <button
                type="button"
                onClick={handleLoadSampleData}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.98]"
              >
                <ReceiptText size={18} />
                Load Sample Data
              </button>

              <button
                type="button"
                onClick={() => setShowAddCostModal(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
              >
                <Plus size={18} />
                Add Source Cost
              </button>
            </div>
          </div>

          
          <SourcingSummaryCards totals={totals} />
          <SourcingAnalyticsCharts data={sourceRows} />

          <section
            className="sibs-profile-tab-panel overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm"
            style={{ animationDelay: "180ms" }}
          >
            <SourcingAnalyticsFilters />
            <SourcingAnalyticsTable onView={setSelectedSource} />
          </section>

          <section
            className="sibs-profile-tab-panel rounded-2xl border border-blue-100 bg-blue-50 p-5"
            style={{ animationDelay: "420ms" }}
          >
            <h3 className="text-sm font-bold text-sibs-primary-1">
              Cost per Hire Rule
            </h3>

            <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
              Candidate volume is counted from the public application form
              source selection. Source cost is added separately and tagged to the
              same sourcing option. Cost per Hire is calculated as{" "}
              <span className="font-extrabold">
                Total Cost Tagged to Source / Hired Candidates From That Source
              </span>
              .
            </p>
          </section>
        </div>
      </main>

      <AddSourceCostModal
        open={showAddCostModal}
        onClose={() => setShowAddCostModal(false)}
        onStatus={showStatusModal}
      />

      <SourceDetailsModal
        open={!!selectedSource}
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
      />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        onClose={() => setStatusModal((prev) => ({ ...prev, open: false }))}
        title={statusModal.title}
        message={statusModal.message}
      />
    </div>
  );
}