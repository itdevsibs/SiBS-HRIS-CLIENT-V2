import React from "react";
import { Plus, ShieldCheck, CheckCircle2, Clock } from "lucide-react";

export default function QDSFollowUpQueue({
  requests = [],
  journeys = [],
  canManage = true,
  onCreateRequest,
  onResolveRequest,
  className = "",
}) {
  return (
    <section
      className={`sibs-card min-w-0 overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-xs p-4 sm:p-5 2xl:p-6 space-y-4 font-jakarta ${className}`.trim()}
      aria-label="Quality and Coaching Follow-up Queue"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-sibs-border pb-3.5 2xl:pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-sibs-orange shrink-0" />
            <h2 className="sibs-section-title font-extrabold text-sibs-navy">
              Quality &amp; Coaching Follow-up Queue
            </h2>
          </div>
          <p className="sibs-section-subtitle text-sibs-muted mt-0.5">
            Active QDS recheck requests, audit escalations, and trainer coaching follow-ups.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={onCreateRequest}
            className="sibs-btn-primary h-8.5 sm:h-9 text-xs font-bold gap-1.5 cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
            title="Create new quality follow-up request"
          >
            <Plus size={14} />
            <span>Create Follow-up</span>
          </button>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-sibs-border py-8 px-4 text-center">
          <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
          <p className="text-xs font-bold text-sibs-navy">No pending follow-up requests</p>
          <p className="sibs-text-micro text-sibs-muted mt-0.5">
            All quality rechecks and coaching interventions have been addressed.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const empJ = journeys.find(
              (j) => (j.sibsEmployeeId || j.id) === req.emp
            );
            const isClosed = req.status === "Closed";

            return (
              <div
                key={req.id}
                className="p-3.5 2xl:p-4 rounded-xl border border-sibs-border bg-sibs-surface/40 hover:bg-sibs-surface/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-orange bg-orange-50 border border-orange-100 rounded px-1.5 py-0.5">
                      {req.type}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isClosed
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <h3 className="text-xs font-extrabold text-sibs-navy truncate">
                    {empJ?.fullName || req.emp}
                    <span className="text-sibs-muted font-normal ml-2">
                      — Trainer: {req.trainer}
                    </span>
                  </h3>

                  <p className="text-xs text-sibs-muted leading-relaxed">
                    {req.notes}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-0.5">
                    <span className="sibs-text-micro text-slate-500 font-medium">
                      Assigned: <strong className="text-sibs-navy font-semibold">{req.assignedTo}</strong>
                    </span>
                    <span className="sibs-text-micro text-slate-400">•</span>
                    <span className="sibs-text-micro text-slate-500 font-medium flex items-center gap-1">
                      <Clock size={11} className="text-slate-400" />
                      Due: <strong className="text-sibs-navy font-semibold">{req.due}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {canManage && !isClosed && (
                    <button
                      type="button"
                      onClick={() => onResolveRequest?.(req.id)}
                      className="sibs-btn-secondary h-8 px-3 text-xs font-bold cursor-pointer"
                      title="Mark follow-up as resolved"
                    >
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
