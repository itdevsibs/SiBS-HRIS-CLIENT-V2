import React from "react";
import { BarChart3 } from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-[14px] border border-sibs-border bg-white p-3.5 2xl:p-4 shadow-xs">
      <p className="mb-1 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
        {label}
      </p>

      <div className="font-heading text-base 2xl:text-lg font-bold text-sibs-navy tabular-nums">{value ?? "—"}</div>
    </div>
  );
}

export default function KPISnapshotModal({ open, week, records = [], onClose }) {
  if (!open || !week) return null;

  const required = records.reduce(
    (sum, item) => sum + Number(item.requiredHeadcount || 0),
    0
  );

  const actual = records.reduce(
    (sum, item) => sum + Number(item.actualHeadcount || 0),
    0
  );

  const opsPrf = records.reduce(
    (sum, item) => sum + Number(item.opsPrf || 0),
    0
  );

  const leads = records.reduce(
    (sum, item) => sum + Number(item.leadsToInterview || 0),
    0
  );

  return (
    <ModalShell
      open={Boolean(open)}
      onClose={onClose}
      variant="navy"
      icon={BarChart3}
      title="Weekly KPI Snapshot"
      subtitle="Weekly manpower requirement, OPS PRF, and leads needed."
      badge={week?.label || "Snapshot"}
      maxWidth="max-w-4xl"
      bodyClassName="p-4 sm:p-5 2xl:p-6 bg-sibs-surface"
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-orange-50 hover:text-sibs-orange sibs-modal-close-btn"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="mb-5 rounded-[14px] border border-blue-100 bg-blue-50 px-4 py-3 sm:px-5 sm:py-3.5">
        <p className="sibs-text-xs font-extrabold text-sibs-navy">
          {week?.label || "Selected Week"}
        </p>
        <p className="mt-0.5 sibs-text-micro font-semibold text-sibs-navy/70">
          {week?.weekRange ||
            [week?.startDate, week?.endDate].filter(Boolean).join(" - ") ||
            "Workforce hiring plan snapshot"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoBox label="Required Headcount" value={formatNumber(required)} />
        <InfoBox label="Actual Headcount" value={formatNumber(actual)} />
        <InfoBox label="OPS PRF" value={formatNumber(opsPrf)} />
        <InfoBox label="Leads to Interview" value={formatNumber(leads)} />
      </div>
    </ModalShell>
  );
}
