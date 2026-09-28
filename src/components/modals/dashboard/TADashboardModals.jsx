import React from "react";
import {
  CheckCircle2,
  Link2,
  ShieldAlert,
  Target,
} from "lucide-react";

import { ModalShell } from "../../ui";
import {
  formatDate,
  safePercentage,
} from "../../../lib/utils/Dashboards/TADashboard/taDashboardHelpers.js";

const movementStages = [
  ["Sourced", "sourced"],
  ["Screened", "screened"],
  ["Interviewed", "interviewed"],
  ["Offered", "offered"],
  ["Accepted", "accepted"],
  ["Hired", "hired"],
];

function safeValue(value, fallback = "—") {
  return value === null || value === undefined || value === ""
    ? fallback
    : value;
}

function getStatusClass(status) {
  if (status === "On Track") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "At Risk") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "Delayed") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getRiskClass(riskFlag) {
  if (riskFlag === "High") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (riskFlag === "Medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (riskFlag === "Low") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function DeliveryDetail({ label, value }) {
  return (
    <div className="rounded-xl border border-sibs-border bg-white p-3 font-jakarta">
      <span className="block font-jakarta text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
        {label}
      </span>
      <span className="mt-1 block break-words font-heading font-bold text-sm 2xl:text-base text-sibs-navy">
        {safeValue(value)}
      </span>
    </div>
  );
}

export function RoleKpiDetailsModal({ open, role, onClose, onToast }) {
  if (!open || !role) return null;

  const progress = safePercentage(role.filled, role.req);

  const handleShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("role", role.id || "selected-role");

      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(url.toString());
      onToast?.({
        title: "Role Link Copied",
        message: `${safeValue(role.role, "Selected role")} was copied to the clipboard.`,
      });
    } catch {
      onToast?.({
        title: "Share Link Ready",
        message:
          "Clipboard access is unavailable. Copy the current browser URL manually.",
      });
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      variant="navy"
      icon={Target}
      title="Role KPI Details"
      subtitle="Recruitment dashboard analytics"
      maxWidth="max-w-4xl 2xl:max-w-5xl"
      className="flex flex-col max-h-[calc(100dvh-1rem)] sm:max-h-[88vh]"
      bodyClassName="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 text-sibs-navy"
      footerClassName="justify-between sm:flex-row sm:items-center px-4 py-2.5 2xl:py-3 sm:px-6"
      footer={
        <>
          <p className="text-center font-jakarta text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint sm:text-left">
            Frontend-only TA data. Values remain unchanged after applying the new theme.
          </p>
          <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto">
            <button
              type="button"
              onClick={handleShare}
              className="sibs-btn-secondary !h-8.5 2xl:!h-10 w-full sm:w-auto !px-3.5 2xl:!px-4 sibs-text-xs"
            >
              <Link2 size={13} />
              Share Link
            </button>
            <button
              type="button"
              onClick={onClose}
              className="sibs-btn-primary !h-8.5 2xl:!h-10 w-full sm:w-auto !px-3.5 2xl:!px-4 sibs-text-xs"
            >
              <CheckCircle2 size={13} />
              Close Details
            </button>
          </div>
        </>
      }
    >
      <div className="space-y-5">
        <section className="flex flex-col gap-3 rounded-xl border border-sibs-border bg-sibs-surface p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="min-w-0">
            <h3 className="sibs-modal-section-title font-heading text-base sm:text-lg font-bold tracking-tight text-sibs-navy break-words">
              {safeValue(role.role, "Untitled Role")}
            </h3>
            <p className="font-jakarta mt-1 break-words text-xs font-semibold leading-relaxed text-sibs-muted">
              {safeValue(role.roleAccount, role.account)}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <span
                className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${getStatusClass(
                  role.status,
                )}`}
              >
                {safeValue(role.status, "Unknown")}
              </span>
              <span
                className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${getRiskClass(
                  role.riskFlag,
                )}`}
              >
                Risk: {safeValue(role.riskFlag, "None")}
              </span>
            </div>
          </div>

          <div className="shrink-0 text-left sm:text-right">
            <span className="block font-jakarta text-xs font-extrabold uppercase text-sibs-muted">
              Progress
            </span>
            <span className="mt-1 block font-heading text-3xl font-bold tabular-nums text-sibs-orange">
              {progress}%
            </span>
          </div>
        </section>

        <section>
          <h3 className="sibs-modal-section-title font-heading text-sm 2xl:text-base font-bold tracking-tight text-sibs-navy">
            Weekly Movement Breakdown
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-3 lg:grid-cols-6">
            {movementStages.map(([label, key]) => (
              <div
                key={key}
                className="rounded-lg border border-sibs-border bg-sibs-surface p-2.5"
              >
                <span className="block font-jakarta text-[10px] font-bold uppercase leading-none text-sibs-muted">
                  {label}
                </span>
                <span className="mt-1.5 block font-heading text-base font-bold tabular-nums text-sibs-navy">
                  {Number(role.movement?.[key] || 0)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-blue-200/60 bg-blue-50/60 p-3.5">
          <span className="sibs-modal-section-subtitle block font-jakarta text-[10px] font-extrabold uppercase text-blue-600">
            Current Action Item
          </span>
          <p className="mt-1 font-jakarta text-xs font-semibold leading-relaxed text-blue-950">
            {safeValue(role.actionItem, "No action item has been assigned.")}
          </p>
        </section>

        <section className="rounded-xl border border-sibs-border bg-sibs-surface/60 p-3.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-sibs-orange" />
            <span className="sibs-modal-section-title block font-heading text-sm 2xl:text-base font-bold tracking-tight text-sibs-navy">
              Role Delivery Details
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <DeliveryDetail
              label="Role / Account"
              value={safeValue(role.roleAccount, role.account)}
            />
            <DeliveryDetail label="TA Owner" value={role.taOwner} />
            <DeliveryDetail
              label="Due Date"
              value={formatDate(role.dueDate)}
            />
            <DeliveryDetail
              label="Aging"
              value={`${Number(role.aging || 0)} days`}
            />
            <DeliveryDetail label="Risk Flag" value={role.riskFlag} />
            <DeliveryDetail label="Status" value={role.status} />
          </div>
        </section>

        <section className="rounded-xl border border-sibs-border bg-sibs-surface/60 p-3.5">
          <span className="sibs-modal-section-title block font-heading text-sm 2xl:text-base font-bold tracking-tight text-sibs-navy">
            Role Snapshot KPI Matrix
          </span>
          <div className="mt-3 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            {[
              ["Requisition", role.req, "text-sibs-navy"],
              ["Filled", role.filled, "text-emerald-600"],
              ["Pending", role.open, "text-sibs-orange"],
              ["Drop-Offs", role.dropOffs, "text-rose-500"],
            ].map(([label, value, tone]) => (
              <div key={label} className="rounded-lg border border-sibs-border bg-white p-3">
                <span className="block font-jakarta text-[10px] font-bold text-sibs-muted">
                  {label}
                </span>
                <span
                  className={`mt-1 block font-heading text-base 2xl:text-lg font-bold tabular-nums ${tone}`}
                >
                  {Number(value || 0)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ModalShell>
  );
}
