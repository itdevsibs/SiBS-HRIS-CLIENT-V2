import React from "react";
import { Activity, Mail, Plus, RefreshCcw } from "lucide-react";
import { useActionItems } from "../../../services/context/ActionItemsContext.jsx";
import { useActionItemsReport } from "../../../services/context/ActionItemsReportContext.jsx";

export default function ActionItemsHeader() {
  const { openAddModal } = useActionItems();
  const { openEmailModal, refreshReportSignals } = useActionItemsReport();

  return (
    <section className="sibs-page-header-in sibs-page-card-in sibs-card relative overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-5 font-jakarta shadow-sm sm:p-6">
      <span className="sibs-top-accent" aria-hidden="true" />

      <div className="mt-1 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-normal text-[#042C51]">
              <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
              Recruitment View
            </span>
          </div>

          <h1 className="break-words text-xl font-extrabold text-[#042C51] sm:text-2xl">
            Action Items
          </h1>
          <p className="max-w-5xl text-xs font-semibold leading-relaxed text-[#667085] sm:text-sm">
            Weekly performance, current hiring status, accountable actions, and report delivery in one execution workflow.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:justify-end">
          <button
            type="button"
            onClick={openEmailModal}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#063B6B] hover:shadow-md active:scale-[0.98]"
          >
            <Mail size={15} className="text-[#FF5C28]" />
            Send Report via Email
          </button>

          <button
            type="button"
            onClick={refreshReportSignals}
            aria-label="Refresh recruitment signals"
            title="Refresh recruitment signals"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-[#042C51] shadow-sm transition hover:-translate-y-0.5 hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] active:scale-[0.98]"
          >
            <RefreshCcw size={15} />
            Refresh Signals
          </button>

          <button
            type="button"
            onClick={() => openAddModal()}
            className="sibs-button-primary inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#FF5C28] px-4 text-xs font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#E04F20] hover:shadow-md active:scale-[0.98]"
          >
            <Plus size={16} />
            Add Action Item
          </button>
        </div>
      </div>
    </section>
  );
}
