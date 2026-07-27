import React from "react";
import {
  CalendarDays,
  FileText,
  MapPin,
  Pencil,
} from "lucide-react";

import { formatDate } from "../../layout/FormatDateTime";
import {
  formatPersonName,
} from "../../../lib/utils/availablePositions/availablePositionsHelpers";
import { formatAvailablePositionId } from "../../../lib/utils/availablePositions/availablePositionId";
import { StatusBadge } from "../../../lib/utils/availablePositions/reactComponents/reactHelpers";
import {
  getAvailablePositionAccount,
  getAvailablePositionDepartment,
  getAvailablePositionLinkedJd,
  getAvailablePositionSkills,
  getAvailablePositionUpdatedAt,
  getAvailablePositionUpdatedBy,
} from "../../../lib/utils/availablePositions/availablePositionsPresentation";

function isSameStatus(left = "", right = "") {
  return (
    String(left || "")
      .trim()
      .toLowerCase() ===
    String(right || "")
      .trim()
      .toLowerCase()
  );
}

export default function PositionMobileCard({
  position,
  onEdit,
  onSetStatus,
  isSaving,
  activeStatus,
  inactiveStatus,
}) {
  const linkedJd =
    getAvailablePositionLinkedJd(position);
  const skillSummary =
    getAvailablePositionSkills(position, 3);
  const isActive = isSameStatus(
    position.status,
    activeStatus,
  );
  const isInactive = isSameStatus(
    position.status,
    inactiveStatus,
  );

  return (
    <article className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#FF5C28]">
            {formatAvailablePositionId(
              position.positionId,
              position.id,
            )}
          </p>

          <h3 className="mt-1 text-sm font-extrabold leading-5 text-[#042C51]">
            {position.positionTitle || "—"}
          </h3>

          <p className="mt-1 text-xs font-semibold text-[#667085]">
            {getAvailablePositionDepartment(position)}
          </p>

          <p className="mt-0.5 text-[10px] font-semibold text-[#98A2B3]">
            {getAvailablePositionAccount(position)}
          </p>
        </div>

        <StatusBadge status={position.status} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-[10px] border border-[#EEF2F6] bg-[#F8FAFC] p-3">
          <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase text-[#98A2B3]">
            <FileText size={12} />
            Linked JD
          </p>

          <p className="mt-1 truncate text-xs font-extrabold text-[#042C51]">
            {linkedJd.documentTitle}
          </p>

          <p className="mt-0.5 truncate text-[9px] font-semibold text-[#667085]">
            {linkedJd.code}
          </p>
        </div>

        <div className="rounded-[10px] border border-[#EEF2F6] bg-[#F8FAFC] p-3">
          <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase text-[#98A2B3]">
            <MapPin size={12} />
            Location
          </p>

          <p className="mt-1 text-xs font-extrabold text-[#042C51]">
            {position.locationSite || "—"}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[9px] font-extrabold uppercase text-[#98A2B3]">
          Preferred Skills
        </p>

        <div className="mt-2 flex flex-wrap gap-1">
          {skillSummary.visible.length > 0 ? (
            <>
              {skillSummary.visible.map((skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-[#F2F6FA] px-2 py-1 text-[9px] font-extrabold text-[#475467]"
                >
                  {skill}
                </span>
              ))}

              {skillSummary.hiddenCount > 0 ? (
                <span className="rounded-md bg-[#EAF2FB] px-2 py-1 text-[9px] font-extrabold text-[#042C51]">
                  +{skillSummary.hiddenCount} more
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-[10px] font-semibold text-[#98A2B3]">
              No skills listed
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-[#EEF2F6] pt-3 text-[10px] font-semibold text-[#667085]">
        <CalendarDays size={12} />

        <span>
          {formatDate(
            getAvailablePositionUpdatedAt(position),
          )}
        </span>

        <span className="text-[#CBD5E1]">•</span>

        <span className="min-w-0 truncate">
          By:{" "}
          {formatPersonName(
            getAvailablePositionUpdatedBy(position),
          )}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onEdit?.(position)}
          disabled={isSaving}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-[#D7DEE8] bg-white text-[10px] font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF7F3] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Pencil size={13} />
          Edit
        </button>

        {activeStatus ? (
          <button
            type="button"
            onClick={() =>
              onSetStatus?.(position, activeStatus)
            }
            disabled={isSaving || isActive}
            className="inline-flex h-9 items-center justify-center rounded-[10px] border border-emerald-200 bg-emerald-50 text-[10px] font-extrabold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Set Active
          </button>
        ) : null}

        {inactiveStatus ? (
          <button
            type="button"
            onClick={() =>
              onSetStatus?.(position, inactiveStatus)
            }
            disabled={isSaving || isInactive}
            className="inline-flex h-9 items-center justify-center rounded-[10px] border border-red-200 bg-red-50 text-[10px] font-extrabold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Set Inactive
          </button>
        ) : null}
      </div>
    </article>
  );
}
