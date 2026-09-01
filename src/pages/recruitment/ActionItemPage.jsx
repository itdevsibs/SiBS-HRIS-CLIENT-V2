import React, { useLayoutEffect, useRef } from "react";
import Header from "../../components/layout/Header";
import ActionItemsHeader from "../../components/recruitment/actionItems/ActionItemsHeader.jsx";
import ActionItemsStats from "../../components/recruitment/actionItems/ActionItemsStats.jsx";
import ActionItemsHealth from "../../components/recruitment/actionItems/ActionItemsHealth.jsx";
import ActionItemsPriorityWatchlist from "../../components/recruitment/actionItems/ActionItemsPriorityWatchlist.jsx";
import ActionItemsModuleSignals from "../../components/recruitment/actionItems/ActionItemsModuleSignals.jsx";
import ActionItemsFilters from "../../components/recruitment/actionItems/ActionItemsFilters.jsx";
import ActionItemsTable from "../../components/recruitment/actionItems/ActionItemsTable.jsx";
import ActionItemsRule from "../../components/recruitment/actionItems/ActionItemsRule.jsx";
import AddActionItemModal from "../../components/modals/actionItems/AddActionItemModal.jsx";
import ActionItemDetailsModal from "../../components/modals/actionItems/ActionItemDetailsModal.jsx";
import { useActionItems } from "../../services/context/ActionItemsContext.jsx";

export default function ActionItemsPage() {
  const mainRef = useRef(null);
  const { selectedItem, setSelectedItem, completeActionItem } = useActionItems();

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
      <div className="shrink-0">
        <Header />
      </div>

      <main ref={mainRef} className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-3.5 sm:space-y-4 2xl:space-y-5">
          <ActionItemsHeader />
          <ActionItemsStats />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-8">
              <ActionItemsHealth />
              <ActionItemsPriorityWatchlist />
            </div>

            <ActionItemsModuleSignals />
          </div>

          <section
            className="sibs-profile-tab-panel overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm"
            style={{ animationDelay: "300ms" }}
          >
            <ActionItemsFilters />
            <ActionItemsTable />
          </section>

          <ActionItemsRule />
        </div>
      </main>

      <AddActionItemModal />

      <ActionItemDetailsModal
        open={Boolean(selectedItem)}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onComplete={completeActionItem}
      />
    </div>
  );
}
