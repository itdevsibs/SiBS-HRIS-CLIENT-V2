import React from "react";
import {
  CalendarDays,
  FileText,
  MapPin,
  Pencil,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { DataCard } from "@/components/ui";
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

function normalizeApprovalStatus(value = "") {
  const status = String(value || "")
    .trim()
    .toLowerCase();

  if (!status) {
    return "Approved";
  }

  if (
    status === "for approval" ||
    status === "pending" ||
    status === "for review"
  ) {
    return "For Approval";
  }

  if (
    status === "approved" ||
    status === "active" ||
    status === "open"
  ) {
    return "Approved";
  }

  if (status === "rejected" || status === "declined") {
    return "Rejected";
  }

  return String(value || "Approved").trim();
}

function getAvailablePositionApprovalStatus(position = {}) {
  const raw = position.raw || {};

  return normalizeApprovalStatus(
    position.approvalStatus ||
      position.approval_status ||
      position.recruitmentSettingsStatus ||
      position.recruitment_settings_status ||
      raw.approvalStatus ||
      raw.approval_status ||
      raw.recruitmentSettingsStatus ||
      raw.recruitment_settings_status ||
      "",
  );
}

function getUpdatedByDisplay(position = {}) {
  const value = String(
    getAvailablePositionUpdatedBy(position) || "",
  ).trim();

  if (!value || /^n\/?a$/i.test(value)) {
    return "System";
  }

  return formatPersonName(value);
}

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
  unlinked = false,
  jdLinkStatus = "Linked",
}) {
  const linkedJd = getAvailablePositionLinkedJd(position);
  const skillSummary = getAvailablePositionSkills(position, 3);
  const isActive = isSameStatus(position.status, activeStatus);
  const isInactive = isSameStatus(position.status, inactiveStatus);
  const positionId = formatAvailablePositionId(position.positionId, position.id);
  const approvalStatus = getAvailablePositionApprovalStatus(position);
  const updatedByDisplay = getUpdatedByDisplay(position);

  return (
    <DataCard
      className={unlinked ? "border-[#FFD1C4] bg-[#FFF8F5]" : ""}
    >
      <DataCard.Header
        title={position.positionTitle || "Untitled Position"}
        subtitle={
          <span className="truncate">
            <span className="font-extrabold text-[#FF5C28]">{positionId}</span> · {getAvailablePositionDepartment(position)}
          </span>
        }
        badge={
          <div className="flex shrink-0 flex-col items-end gap-1">
            <StatusBadge status={position.status} />
            {approvalStatus && (
              <StatusBadge status={approvalStatus} />
            )}
          </div>
        }
      />

      <DataCard.ContextRow>
        <span className="text-[11px] font-extrabold text-[#042C51]">
          {getAvailablePositionAccount(position) || "—"}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#667085]">
          <MapPin size={11} className="text-[#98A2B3]" />
          {position.locationSite || "—"}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${
            unlinked
              ? "border-[#FFB39F] bg-[#FFE1D8] text-[#D92D20]"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {unlinked ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
          {jdLinkStatus}
        </span>
      </DataCard.ContextRow>

      <div className="mt-2.5 rounded-[10px] border border-[#EEF2F6] bg-[#F8FAFC] p-2.5">
        <p className="flex items-center gap-1 text-[9px] font-extrabold uppercase text-[#98A2B3]">
          <FileText size={11} />
          Linked JD Manual
        </p>
        <p className="mt-0.5 truncate text-xs font-extrabold text-[#042C51]">
          {linkedJd.documentTitle}
        </p>
        <p className="truncate text-[9.5px] font-semibold text-[#667085]">
          {linkedJd.code}
        </p>
      </div>

      {skillSummary.visible.length > 0 && (
        <div className="mt-2.5">
          <p className="text-[9px] font-extrabold uppercase text-[#98A2B3]">
            Preferred Skills
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {skillSummary.visible.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-[#F2F6FA] px-2 py-0.5 text-[9px] font-extrabold text-[#475467]"
              >
                {skill}
              </span>
            ))}
            {skillSummary.hiddenCount > 0 && (
              <span className="rounded-md bg-[#EAF2FB] px-2 py-0.5 text-[9px] font-extrabold text-[#042C51]">
                +{skillSummary.hiddenCount} more
              </span>
            )}
          </div>
        </div>
      )}

      <DataCard.Footer>
        <div className="flex flex-col text-[10px] font-semibold text-[#667085]">
          <div className="flex items-center gap-1">
            <CalendarDays size={11} />
            <span>{formatDate(getAvailablePositionUpdatedAt(position))}</span>
          </div>
          {updatedByDisplay && (
            <span className="truncate text-[9.5px] text-[#98A2B3]">
              By: {updatedByDisplay}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit?.(position)}
            disabled={isSaving}
            className="inline-flex h-7 items-center justify-center gap-1 rounded-lg border border-[#D7DEE8] bg-white px-2.5 text-[10px] font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF7F3] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Pencil size={11} />
            Edit
          </button>

          {activeStatus ? (
            <button
              type="button"
              onClick={() => onSetStatus?.(position, activeStatus)}
              disabled={isSaving || isActive}
              className="inline-flex h-7 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[10px] font-extrabold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Active
            </button>
          ) : null}

          {inactiveStatus ? (
            <button
              type="button"
              onClick={() => onSetStatus?.(position, inactiveStatus)}
              disabled={isSaving || isInactive}
              className="inline-flex h-7 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2.5 text-[10px] font-extrabold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Inactive
            </button>
          ) : null}
        </div>
      </DataCard.Footer>
    </DataCard>
  );
}
