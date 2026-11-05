import React, { useEffect } from "react";
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  FileText,
  Mail,
  ShieldAlert,
  User,
  X,
} from "lucide-react";

function formatModalDate(val) {
  if (!val) return "—";
  const str = String(val).slice(0, 10);
  const d = new Date(`${str}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return str;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export default function AttritionRecordDetailModal({
  open = false,
  record = null,
  onClose,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !record) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-jakarta">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-2xl transition-all">
        {/* Top accent line */}
        <span className="sibs-top-accent" aria-hidden="true" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-sibs-border p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-sibs-border bg-sibs-surface">
              {record.profilePictureUrl ? (
                <img
                  src={record.profilePictureUrl}
                  alt={record.employeeName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-sibs-navy" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base 2xl:text-lg font-bold text-sibs-navy">
                  {record.employeeName}
                </h3>
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-extrabold text-slate-700">
                  {record.sibsId}
                </span>
              </div>
              <p className="text-xs font-semibold text-sibs-muted">
                {record.account} · {record.department}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-sibs-border bg-white text-sibs-muted hover:border-sibs-orange hover:text-sibs-orange transition active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[75vh] overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Status Alert Banner */}
          <div className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/60 p-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="text-xs font-extrabold text-rose-950">
                Separated Employee
              </span>
            </div>
            <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700">
              {record.status}
            </span>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-sibs-border bg-sibs-surface p-3 space-y-1">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-sibs-muted">
                Organizational Assignment
              </span>
              <p className="text-xs font-bold text-sibs-navy">
                Cluster: <span className="font-normal">{record.cluster}</span>
              </p>
              <p className="text-xs font-bold text-sibs-navy">
                Account: <span className="font-normal">{record.account}</span>
              </p>
              <p className="text-xs font-bold text-sibs-navy">
                Department: <span className="font-normal">{record.department}</span>
              </p>
            </div>

            <div className="rounded-xl border border-sibs-border bg-sibs-surface p-3 space-y-1">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-sibs-muted">
                Position &amp; Role
              </span>
              <p className="text-xs font-bold text-sibs-navy">
                Position: <span className="font-normal">{record.position}</span>
              </p>
              <p className="text-xs font-bold text-sibs-navy">
                Tenure: <span className="font-extrabold text-sibs-orange">{record.tenure}</span>
              </p>
            </div>
          </div>

          {/* Dates & Timeline */}
          <div className="rounded-xl border border-sibs-border bg-white p-3.5 space-y-2">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-sibs-muted">
              Service Dates &amp; Separation Timeline
            </span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                <span className="block text-[10px] font-bold text-slate-500">Hire Date</span>
                <span className="font-bold text-sibs-navy font-mono">
                  {formatModalDate(record.hireDate)}
                </span>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                <span className="block text-[10px] font-bold text-slate-500">Last Working Day</span>
                <span className="font-bold text-rose-600 font-mono">
                  {formatModalDate(record.lastWorkingDate)}
                </span>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                <span className="block text-[10px] font-bold text-slate-500">Resignation Filed</span>
                <span className="font-bold text-sibs-navy font-mono">
                  {formatModalDate(record.resignationDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Separation Details */}
          <div className="rounded-xl border border-sibs-border bg-white p-3.5 space-y-2">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-sibs-muted">
              Separation Classification &amp; Reason
            </span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                <span className="block text-[10px] font-bold text-slate-500">Classification</span>
                <span className={`font-bold ${record.separationClassification === "Not available" ? "italic text-slate-400" : "text-sibs-navy"}`}>
                  {record.separationClassification}
                </span>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                <span className="block text-[10px] font-bold text-slate-500">Separation Reason</span>
                <span className={`font-bold ${record.separationReason === "Not available" ? "italic text-slate-400" : "text-sibs-navy"}`}>
                  {record.separationReason}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-sibs-border p-3.5 sm:p-4 bg-sibs-surface">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] border border-sibs-border bg-white px-4 py-2 text-xs font-extrabold text-sibs-navy hover:bg-slate-50 active:scale-95 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
