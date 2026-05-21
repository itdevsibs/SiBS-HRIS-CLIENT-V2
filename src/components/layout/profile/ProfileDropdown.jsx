import { SquarePen } from "lucide-react";
import React from "react";

const ProfileDropdown = ({ openModal, openDropdown }) => {
  return (
    <div
      className="w-[260px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-2 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 pb-2 pt-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sibs-tertiary-5">
          Additional Actions
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          openModal(true);
          openDropdown(false);
        }}
        className="group flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-sibs-tertiary-10"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sibs-tertiary-10 text-sibs-primary-1 transition group-hover:bg-white">
          <SquarePen size={18} />
        </div>

        <div className="min-w-0 flex-1 leading-tight">
          <span className="block text-sm font-bold text-sibs-primary-1">
            Submit Resignation
          </span>

          <span className="mt-1 block text-[11px] font-medium text-sibs-tertiary-5">
            Employee resignation request
          </span>
        </div>
      </button>
    </div>
  );
};

export default ProfileDropdown;