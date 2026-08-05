import React, { useLayoutEffect, useRef } from "react";
import Header from "../../components/layout/Header";
import ActionItemsHeader from "../../components/recruitment/actionItems/ActionItemsHeader.jsx";
import ActionItemsReportingScope from "../../components/recruitment/actionItems/ActionItemsReportingScope.jsx";
import ActionItemsStats from "../../components/recruitment/actionItems/ActionItemsStats.jsx";
import ActionItemsWeeklyPerformance from "../../components/recruitment/actionItems/ActionItemsWeeklyPerformance.jsx";
import ActionItemsCurrentStatus from "../../components/recruitment/actionItems/ActionItemsCurrentStatus.jsx";
import ActionItemsHealth from "../../components/recruitment/actionItems/ActionItemsHealth.jsx";
import ActionItemsPriorityWatchlist from "../../components/recruitment/actionItems/ActionItemsPriorityWatchlist.jsx";
import ActionItemsModuleSignals from "../../components/recruitment/actionItems/ActionItemsModuleSignals.jsx";
import ActionItemsFilters from "../../components/recruitment/actionItems/ActionItemsFilters.jsx";
import ActionItemsTable from "../../components/recruitment/actionItems/ActionItemsTable.jsx";
import ActionItemsRule from "../../components/recruitment/actionItems/ActionItemsRule.jsx";
import AddActionItemModal from "../../components/modals/actionItems/AddActionItemModal.jsx";
import ActionItemDetailsModal from "../../components/modals/actionItems/ActionItemDetailsModal.jsx";
import SendActionItemsReportModal from "../../components/modals/actionItems/SendActionItemsReportModal.jsx";
import { useActionItems } from "../../services/context/ActionItemsContext.jsx";
import { ActionItemsReportProvider } from "../../services/context/ActionItemsReportContext.jsx";

function ActionItemsContent() {
  const { selectedItem, setSelectedItem, completeActionItem } = useActionItems();

  return (
    <>
      <ActionItemsHeader />
      <ActionItemsReportingScope />
      <ActionItemsStats />
      <ActionItemsWeeklyPerformance />
      <ActionItemsCurrentStatus />

      <section className="sibs-page-card-in overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm">
        <header className="flex flex-col gap-2 border-b border-[#E6ECF2] bg-white px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-[#042C51] sm:text-base">
              Action Items – JIT Delivery Focus Registry
            </h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-[#667085]">
              Accountable actions linked to the current reporting scope. Open a record to review source details and progress.
            </p>
          </div>
        </header>
        <div className="p-4 sm:p-5 font-jakarta space-y-4">
          <ActionItemsFilters />
          <ActionItemsTable />
        </div>
      </section>

      <section className="sibs-profile-tab-panel rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-[#042C51]">Operational Insights & Supporting Analytics</h2>
          <p className="mt-1 text-xs font-semibold text-[#667085]">
            Supporting health distribution, SLA watchlist, and module-level signals.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-8">
            <ActionItemsHealth />
            <ActionItemsPriorityWatchlist />
          </div>
          <div className="lg:col-span-4">
            <ActionItemsModuleSignals />
          </div>
        </div>
      </section>

      <ActionItemsRule />
      <AddActionItemModal />
      <SendActionItemsReportModal />
      <ActionItemDetailsModal
        open={Boolean(selectedItem)}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onComplete={completeActionItem}
      />
    </>
  );
}

export default function ActionItemsPage() {
  const mainRef = useRef(null);

  useLayoutEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    requestAnimationFrame(() => {
      mainRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, []);

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0"><Header /></div>
      <main ref={mainRef} className="sibs-dashboard-main">
        <div className="mx-auto w-full max-w-[1600px] space-y-5">
          <ActionItemsReportProvider>
            <ActionItemsContent />
          </ActionItemsReportProvider>
        </div>
      </main>
    </div>
  );
}
