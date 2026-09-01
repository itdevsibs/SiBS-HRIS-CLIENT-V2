import React, { useState } from "react";
import { Mail, Plus, RefreshCw } from "lucide-react";
import { useActionItems } from "../../../services/context/ActionItemsContext.jsx";
import { useActionItemsReport } from "../../../services/context/ActionItemsReportContext.jsx";

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
    <section
      className="sibs-page-header-in sibs-page-card-in sibs-card relative overflow-hidden rounded-2xl border border-sibs-border bg-white p-4 font-jakarta shadow-sm 2xl:p-6"
      style={{ animationDelay: "0ms", animationFillMode: "both" }}
    >
      <span className="sibs-top-accent" aria-hidden="true" />

      <div className="mt-0.5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-normal text-sibs-navy">
              <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-sibs-orange" />
              Recruitment View
            </span>
          </div>

          <h1 className="font-heading break-words text-xl 2xl:text-3xl font-bold tracking-tight text-sibs-navy">
            Action Items
          </h1>
          <p className="max-w-5xl sibs-text-sm font-semibold leading-relaxed text-sibs-muted">
            Weekly performance, current hiring status, accountable actions, and report delivery in one execution workflow.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2.5 xl:w-auto xl:justify-end">
          <button
            type="button"
            onClick={openEmailModal}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg bg-sibs-navy px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-sibs-tertiary-2 active:scale-[0.98]"
          >
            <Mail className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-sibs-orange" />
            Send Report via Email
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh recruitment signals"
            title="Refresh recruitment signals"
            className="inline-flex h-8.5 2xl:h-10 w-8.5 2xl:w-10 items-center justify-center rounded-lg border border-sibs-border-subtle bg-white text-sibs-navy shadow-sm outline-none transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange focus-visible:ring-2 focus-visible:ring-sibs-orange/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${isRefreshing ? "animate-spin text-sibs-orange" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => openAddModal()}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg bg-sibs-orange px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-sibs-button-hover active:scale-[0.98]"
          >
            <Plus size={15} />
            Add Action Item
          </button>
        </div>
      </div>
    </section>
  );
}
