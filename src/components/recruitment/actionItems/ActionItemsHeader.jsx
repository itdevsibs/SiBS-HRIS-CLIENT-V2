import React, { useState } from "react";
import { Mail, Plus, RefreshCw } from "lucide-react";
import { useActionItems } from "../../../services/context/ActionItemsContext.jsx";
import { useActionItemsReport } from "../../../services/context/ActionItemsReportContext.jsx";
import { PageHeaderHero } from "@/components/ui";

export default function ActionItemsHeader() {
  const { openAddModal } = useActionItems();
  const { openEmailModal, refreshReportSignals } = useActionItemsReport();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.resolve(refreshReportSignals?.());
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  return (
    <PageHeaderHero
      kicker="Recruitment View"
      title="Action Items"
      description="Weekly performance, current hiring status, accountable actions, and report delivery in one execution workflow."
      actions={
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh recruitment signals"
              title="Refresh recruitment signals"
              className="sibs-btn-icon shrink-0"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                  isRefreshing ? "animate-spin text-sibs-orange" : ""
                }`}
              />
            </button>

            <button
              type="button"
              onClick={openEmailModal}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg bg-sibs-navy px-3.5 2xl:px-4 text-[11.5px] 2xl:text-[12px] font-extrabold text-white shadow-xs transition hover:bg-sibs-tertiary-2 active:scale-[0.98] flex-1 sm:flex-none sm:w-auto whitespace-nowrap"
            >
              <Mail className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-sibs-orange" />
              Send Report via Email
            </button>
          </div>

          <button
            type="button"
            onClick={() => openAddModal()}
            className="sibs-btn-primary w-full sm:w-auto whitespace-nowrap"
          >
            <Plus size={15} />
            Add Action Item
          </button>
        </div>
      }
    />
  );
}
