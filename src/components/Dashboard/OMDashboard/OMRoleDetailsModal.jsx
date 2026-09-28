import React from "react";
import { Target } from "lucide-react";

import { ModalShell } from "@/components/ui";
import {
  formatDate,
  safePercentage,
} from "../../../lib/utils/Dashboards/OMDashboard/omDashboardHelpers.js";

function getStatusClass(status) {
  if (status === "Delayed") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (status === "At Risk") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export default function OMRoleDetailsModal({ role, onClose }) {
  if (!role) return null;

  const progress = safePercentage(role.filled, role.req);

  return (
    <ModalShell
      open={Boolean(role)}
      onClose={onClose}
      variant="navy"
      icon={Target}
      title="Role KPI Details"
      subtitle="Manager-accessible recruitment analytics"
      maxWidth="max-w-[700px] 2xl:max-w-3xl"
      className="flex flex-col max-h-[88vh]"
      bodyClassName="flex-1 space-y-2.5 2xl:space-y-3.5 overflow-y-auto p-3.5 2xl:p-5 text-sibs-navy"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="sibs-btn-primary !h-8.5 2xl:!h-10 w-full sm:w-auto !px-4 sibs-text-xs"
        >
          Close Details
        </button>
      }
    >
      <div className="flex flex-col justify-between gap-2.5 rounded-xl border border-sibs-border bg-sibs-surface p-3 2xl:p-3.5 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h3 className="sibs-modal-section-title font-heading text-sm 2xl:text-base font-bold tracking-tight text-sibs-navy break-words">
            {role.roleTitle}
          </h3>
          <p className="font-jakarta mt-0.5 break-words sibs-text-micro font-semibold text-sibs-muted">
            {role.account} · {role.department}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="block font-jakarta sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-muted">
            Progress
          </span>
          <p className="font-heading text-lg 2xl:text-xl font-bold tabular-nums text-sibs-orange">
            {progress}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Requirement", role.req],
          ["Filled", role.filled],
          ["Open", role.open],
          ["Aging", `${role.aging}d`],
        ].map(([label, value]) => (
          <div key={label} className="sibs-info-tile rounded-xl border border-sibs-border bg-white p-2 2xl:p-2.5 text-center shadow-2xs">
            <span className="block font-jakarta sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-muted">{label}</span>
            <p className="font-heading mt-0.5 text-base 2xl:text-lg font-bold tabular-nums text-sibs-navy">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div>
        <p className="sibs-modal-section-title font-heading mb-1.5 text-sm 2xl:text-base font-bold tracking-tight text-sibs-navy uppercase">
          Movement Pipeline Stages
        </p>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          {Object.entries(role.movement || {}).map(([label, value]) => (
            <div key={label} className="sibs-info-tile rounded-lg border border-sibs-border bg-sibs-surface p-2 text-center">
              <span className="block truncate font-jakarta sibs-text-micro font-extrabold uppercase tracking-wider text-sibs-muted">
                {label}
              </span>
              <p className="font-heading mt-0.5 text-xs 2xl:text-sm font-bold tabular-nums text-sibs-navy">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3">
          <p className="sibs-modal-section-subtitle font-jakarta sibs-text-micro font-extrabold uppercase tracking-wider text-blue-700">
            Current Action Item
          </p>
          <p className="font-jakarta mt-1 sibs-text-xs font-semibold leading-relaxed text-blue-950">
            {role.actionItem}
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
          <p className="sibs-modal-section-subtitle font-jakarta sibs-text-micro font-extrabold uppercase tracking-wider text-amber-700">
            Delivery Status
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex rounded border px-2 py-0.5 sibs-text-micro font-extrabold uppercase tracking-wide ${getStatusClass(
                role.status,
              )}`}
            >
              {role.status}
            </span>
            <span className="font-jakarta sibs-text-xs font-bold text-amber-900">
              Risk: {role.riskFlag}
            </span>
          </div>
          <p className="font-jakarta mt-1.5 sibs-text-xs font-semibold text-amber-900">
            Due: <strong className="font-heading font-bold">{formatDate(role.dueDate)}</strong> · TA Owner: <strong className="font-heading font-bold">{role.taOwner}</strong>
          </p>
        </div>
      </div>
    </ModalShell>
  );
}
