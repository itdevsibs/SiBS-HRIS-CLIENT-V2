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
    <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main
        ref={mainRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6"
      >
        <div className="mx-auto max-w-[1600px] space-y-5">
          <ActionItemsHeader />
          <ActionItemsStats />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <ActionItemsHealth />
            <ActionItemsPriorityWatchlist />
          </div>

          <ActionItemsModuleSignals />

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
