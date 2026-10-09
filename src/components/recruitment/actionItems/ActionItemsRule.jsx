import React from "react";
import { Plus, Timer } from "lucide-react";
import { useActionItems } from "../../../services/context/ActionItemsContext.jsx";

export default function ActionItemsRule() {
  const { openAddModal } = useActionItems();
  return (
    <section
      className="sibs-page-card-in rounded-[10px] border border-sibs-border bg-gradient-to-r from-blue-50/90 via-blue-50/40 to-white/70 p-3.5 sm:p-4 2xl:p-5 shadow-xs"
      style={{ animationDelay: "360ms", animationFillMode: "both" }}
    >
      <div className="flex flex-col gap-3.5 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 2xl:h-10 2xl:w-10 shrink-0 items-center justify-center rounded-[10px] border border-sibs-border bg-white text-sibs-navy shadow-2xs">
            <Timer size={18} className="text-sibs-orange" />
          </div>
          <div>
            <h3 className="text-xs 2xl:text-sm font-black text-sibs-navy">
              Action Items Rule
            </h3>
            <p className="mt-1 max-w-5xl text-[11px] 2xl:text-xs font-semibold leading-5 text-sibs-muted">
              Every role or account that is not fully hired must have at least one action item. The item must be linked to the correct gap: Pipeline, Screening, Interview, Offer, JD, Approval, Capacity / Manpower, Onboarding, or Reporting.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openAddModal()}
          className="inline-flex h-8.5 2xl:h-10 shrink-0 items-center justify-center gap-1.5 rounded-[10px] bg-sibs-orange px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-sibs-orange-hover active:scale-[0.98]"
        >
          <Plus size={15} /> Add Missing Action
        </button>
      </div>
    </section>
  );
}
