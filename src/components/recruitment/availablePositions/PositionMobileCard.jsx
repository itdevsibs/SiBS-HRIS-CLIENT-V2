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
      className={unlinked ? "border-orange-200 bg-orange-50/60" : ""}
    >
      <DataCard.Header
        title={position.positionTitle || "Untitled Position"}
        subtitle={
          <span className="truncate">
            <span className="font-extrabold text-sibs-orange">{positionId}</span> · {getAvailablePositionDepartment(position)}
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
        <span className="text-[11px] font-extrabold text-sibs-navy">
          {getAvailablePositionAccount(position) || "—"}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sibs-muted">
          <MapPin size={11} className="text-sibs-muted" />
          {position.locationSite || "—"}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${
            unlinked
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {unlinked ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
          {jdLinkStatus}
        </span>
      </DataCard.ContextRow>

      <div className="mt-2.5 rounded-[10px] border border-sibs-border bg-slate-50 p-2.5">
        <p className="flex items-center gap-1 text-[9px] font-extrabold uppercase text-sibs-muted">
          <FileText size={11} />
          Linked JD Manual
        </p>
        <p className="mt-0.5 truncate text-xs font-extrabold text-sibs-navy">
          {linkedJd.documentTitle}
        </p>
        <p className="truncate text-[9.5px] font-semibold text-sibs-muted">
          {linkedJd.code}
        </p>
      </div>

      {skillSummary.visible.length > 0 && (
        <div className="mt-2.5">
          <p className="text-[9px] font-extrabold uppercase text-sibs-muted">
            Preferred Skills
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {skillSummary.visible.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-extrabold text-sibs-muted"
              >
                {skill}
              </span>
            ))}
            {skillSummary.hiddenCount > 0 && (
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[9px] font-extrabold text-sibs-navy">
                +{skillSummary.hiddenCount} more
              </span>
            )}
          </div>
        </div>
      )}

      <DataCard.Footer>
        <div className="flex flex-col text-[10px] font-semibold text-sibs-muted">
          <div className="flex items-center gap-1">
            <CalendarDays size={11} />
            <span>{formatDate(getAvailablePositionUpdatedAt(position))}</span>
          </div>
          {updatedByDisplay && (
            <span className="truncate text-[9.5px] text-sibs-muted">
              By: {updatedByDisplay}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit?.(position)}
            disabled={isSaving}
            className="inline-flex h-7 items-center justify-center gap-1 rounded-lg border border-sibs-border bg-white px-2.5 text-[10px] font-extrabold text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-orange-50/50 hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-50"
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
