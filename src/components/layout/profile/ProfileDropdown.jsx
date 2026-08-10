import { SquarePen } from "lucide-react";
import React from "react";

const ProfileDropdown = ({ openModal, openDropdown }) => {
  return (
    <div
      className="sibs-animated-dropdown-box w-[250px] 2xl:w-[260px] max-w-[calc(100vw-32px)] p-1.5 border border-[#D7DEE8] bg-white shadow-[0_16px_40px_rgba(4,44,81,0.16)] rounded-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-2.5 pb-1.5 pt-1">
        <p className="text-[10px] font-black uppercase tracking-wider text-sibs-tertiary-6">
          Additional Actions
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          openModal(true);
          openDropdown(false);
        }}
        className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 hover:bg-[#F1F5F9] focus:bg-[#F1F5F9] outline-none"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF0F7] text-sibs-primary-1 transition-transform duration-150 group-hover:scale-105">
          <SquarePen size={16} strokeWidth={2} />
        </div>

        <div className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-xs font-extrabold text-sibs-primary-1 leading-snug">
            Submit Resignation
          </span>

          <span className="block truncate text-[10px] font-medium text-sibs-tertiary-6 leading-tight">
            Employee resignation request
          </span>
        </div>
      </button>
    </div>
  );
};

export default ProfileDropdown;