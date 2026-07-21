import React from "react";
import { Plus, Timer } from "lucide-react";
import { useActionItems } from "../../../services/context/ActionItemsContext.jsx";

export default function ActionItemsRule() {
  const { openAddModal } = useActionItems();

  return (
    <section
      className="sibs-profile-tab-panel rounded-xl border border-blue-100 bg-blue-50 p-5"
      style={{ animationDelay: "360ms" }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-white p-3 text-sibs-primary-1">
            <Timer size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-sibs-primary-1">
              Action Items Rule
            </h3>
            <p className="mt-2 max-w-5xl text-sm leading-6 text-sibs-primary-1/80">
              Every role or account that is not fully hired must have at least
              one action item. The item must be linked to the correct gap:
              Pipeline, Screening, Interview, Offer, JD, Approval, Capacity /
              Manpower, Onboarding, or Reporting.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
        >
          <Plus size={18} />
          Add Missing Action
        </button>
      </div>
    </section>
  );
}
