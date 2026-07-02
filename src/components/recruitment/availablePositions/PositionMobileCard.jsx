import React from "react";
import { Pencil } from "lucide-react";
import { StatusBadge } from "../../../lib/utils/availablePositions/reactComponents/reactHelpers";

const PositionMobileCard = ({
  position,
  onEdit,
  onSetStatus,
  isSaving,
  activeStatus,
  inactiveStatus,
}) => {
  return (
    <div className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-sibs-primary-1">
            {position.positionId}
          </p>

          <h3 className="mt-1 text-sm font-bold text-[#101828]">
            {position.positionTitle}
          </h3>

          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
            {position.department}
          </p>
        </div>

        <StatusBadge status={position.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Account
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">
            {position.accountName || "—"}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Location
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">
            {position.locationSite || "—"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onEdit(position)}
          disabled={isSaving}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Pencil size={14} />
          Edit
        </button>

        {activeStatus && (
          <button
            type="button"
            onClick={() => onSetStatus(position, activeStatus)}
            disabled={isSaving || position.status === activeStatus}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Set {activeStatus}
          </button>
        )}

        {inactiveStatus && (
          <button
            type="button"
            onClick={() => onSetStatus(position, inactiveStatus)}
            disabled={isSaving || position.status === inactiveStatus}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Set {inactiveStatus}
          </button>
        )}
      </div>
    </div>
  );
};

export default PositionMobileCard;
