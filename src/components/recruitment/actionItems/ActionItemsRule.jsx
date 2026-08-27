import React from "react";
import { Plus, Timer } from "lucide-react";
import { useActionItems } from "../../../services/context/ActionItemsContext.jsx";

export default function ActionItemsRule() {
  const { openAddModal } = useActionItems();
  return (
    <section
      className="sibs-page-card-in rounded-xl 2xl:rounded-2xl border border-[#D6E2F0] bg-gradient-to-r from-blue-50/90 via-blue-50/40 to-white/70 p-3.5 sm:p-4 2xl:p-5 shadow-xs"
      style={{ animationDelay: "360ms", animationFillMode: "both" }}
    >
      <div className="flex flex-col gap-3.5 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 2xl:h-10 2xl:w-10 shrink-0 items-center justify-center rounded-xl border border-[#D6E2F0] bg-white text-[#042C51] shadow-2xs">
            <Timer size={18} className="text-[#FF5C28]" />
          </div>
          <div>
            <h3 className="text-xs 2xl:text-sm font-black text-[#042C51]">
              Action Items Rule
            </h3>
            <p className="mt-1 max-w-5xl text-[11px] 2xl:text-xs font-semibold leading-5 text-[#475467]">
              Every role or account that is not fully hired must have at least one action item. The item must be linked to the correct gap: Pipeline, Screening, Interview, Offer, JD, Approval, Capacity / Manpower, Onboarding, or Reporting.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openAddModal()}
          className="inline-flex h-8.5 2xl:h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E04B1D] active:scale-[0.98]"
        >
          <Plus size={15} /> Add Missing Action
        </button>
      </div>
    </section>
  );
}
