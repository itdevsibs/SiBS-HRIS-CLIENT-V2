import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  MessageSquarePlus,
  Target,
  UserRound,
  X,
} from "lucide-react";
import { useActionItems } from "../../../services/context/ActionItemsContext.jsx";
import { ACTION_ITEM_SOURCE_ROUTES } from "../../../lib/utils/actionItems/actionItemsConstants.js";
import {
  formatDate,
  getCompletionPercent,
  getRiskClass,
  getStatusClass,
} from "../../../lib/utils/actionItems/actionItemsHelpers.js";

function InfoBox({ label, value, className = "" }) {
  return (
    <div className={`rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 ${className}`}>
      <p className="text-[9px] font-black uppercase tracking-wider text-[#98A2B3]">{label}</p>
      <p className="mt-1 break-words text-xs font-bold leading-5 text-[#344054]">{value ?? "—"}</p>
    </div>
  );
}

export default function ActionItemDetailsModal({ open, item, onClose, onComplete }) {
  const { updateActionItem, addActionProgressNote } = useActionItems();
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    setNote("");
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const sourceModule = item?.sourceModule || item?.module || "Recruitment";
  const sourceRoute = ACTION_ITEM_SOURCE_ROUTES[sourceModule] || ACTION_ITEM_SOURCE_ROUTES[item?.module];
  const systemGenerated = Boolean(item?.systemGenerated) || String(item?.sourceType || "").toLowerCase().includes("system");
  const progress = useMemo(() => getCompletionPercent(item?.filled, item?.requirement), [item?.filled, item?.requirement]);
  const history = Array.isArray(item?.history) ? item.history : [];

  if (!open || !item) return null;

  function handleViewSource() {
    if (!sourceRoute) return;
    const params = new URLSearchParams();
    if (item.sourceRecordId) params.set("sourceRecordId", item.sourceRecordId);
    if (item.weeklyPlanItemId) params.set("weeklyPlanItemId", item.weeklyPlanItemId);
    if (item.hiringNeedId) params.set("hiringNeedId", item.hiringNeedId);
    const query = params.toString();
    window.location.assign(`${sourceRoute}${query ? `?${query}` : ""}`);
  }

  function handleStatus(status) {
    if (systemGenerated) return;
    updateActionItem(item, {
      status,
      historyEntry: {
        action: `Status changed from ${item.status} to ${status}.`,
        user: item.owner || "Current User",
      },
    });
  }

  function handleAddNote() {
    if (!note.trim()) return;
    addActionProgressNote(item, note, item.owner || "Current User");
    setNote("");
  }

  return (
    <div
      className="sibs-modal-blur fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/50 p-3 sm:p-5"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        data-layout="action-item-details-modal-v3"
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-item-details-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="sibs-modal-pop-in flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 bg-[#042C51] px-5 py-4 text-white sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#FF5C28]/30 bg-[#FF5C28]/15 text-[#FF5C28]"><ClipboardCheck size={21} /></div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-[#FF5C28] px-2 py-0.5 font-mono text-[9px] font-black text-white">{item.actionId}</span>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-300">{systemGenerated ? "System Suggested" : "Manual"} Action Item</span>
              </div>
              <h2 id="action-item-details-title" className="mt-1 line-clamp-2 text-sm font-black leading-5 sm:text-base">{item.actionItem}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Close Action Item details"><X size={19} /></button>
        </header>

        <div className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-8">
              <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#042C51]"><FileText size={14} className="text-[#FF5C28]" /> Action Summary</h3>
                  <div className="flex gap-1.5">
                    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${getStatusClass(item.status)}`}>{item.status}</span>
                    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${getRiskClass(item.riskLevel)}`}>{item.riskLevel}</span>
                  </div>
                </div>
                <p className="text-sm font-extrabold leading-6 text-[#042C51]">{item.actionItem}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-[#667085]">{item.remarks || "No remarks have been recorded."}</p>
              </section>

              <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
                <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#042C51]"><Target size={14} className="text-[#FF5C28]" /> Hiring Gap &amp; Source Linkage</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <InfoBox label="Source Type" value={systemGenerated ? "System Suggested" : "Manual"} />
                  <InfoBox label="Source Module" value={sourceModule} />
                  <InfoBox label="Linked Gap" value={item.linkedGap} />
                  <InfoBox label="Reporting Week" value={item.reportingWeek || "—"} />
                  <InfoBox label="Requirement" value={item.requirement ?? 0} />
                  <InfoBox label="Filled / Accepted" value={item.filled ?? 0} />
                  <InfoBox label="Remaining Gap" value={Math.max(0, Number(item.requirement || 0) - Number(item.filled || 0))} />
                  <InfoBox label="Progress" value={`${progress}%`} />
                </div>
                {item.atRiskReason ? (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
                    <p className="flex items-center gap-1.5 text-[9px] font-black uppercase text-rose-700"><AlertTriangle size={12} /> At-Risk Reason</p>
                    <p className="mt-1 text-[11px] font-bold leading-4 text-rose-900">{item.atRiskReason}</p>
                  </div>
                ) : null}
                {item.latestStatusNote ? (
                  <div className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3">
                    <p className="text-[9px] font-black uppercase text-[#98A2B3]">Latest Source Status</p>
                    <p className="mt-1 text-[11px] font-semibold italic leading-4 text-[#475467]">{item.latestStatusNote}</p>
                  </div>
                ) : null}
                {sourceRoute ? (
                  <div className="mt-3 flex justify-end">
                    <button type="button" onClick={handleViewSource} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#FF5C28] px-3 text-[10px] font-black text-white transition hover:bg-[#E04B1D]"><ExternalLink size={13} /> View Source Record</button>
                  </div>
                ) : null}
              </section>

              <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
                <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#042C51]"><MessageSquarePlus size={14} className="text-[#FF5C28]" /> Operational Progress Notes</h3>
                {systemGenerated ? (
                  <div className="rounded-lg border border-purple-100 bg-purple-50 p-3 text-[10px] font-semibold leading-4 text-purple-700">
                    System-suggested action notes are read-only. Update the source record so the generated action and its context remain authoritative.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a progress note for the next JIT or weekly call..." className="h-10 flex-1 rounded-lg border border-[#D0D5DD] bg-white px-3 text-xs font-semibold text-[#344054] outline-none focus:border-[#042C51]" />
                    <button type="button" onClick={handleAddNote} className="h-10 rounded-lg bg-[#042C51] px-4 text-xs font-black text-white hover:bg-[#073966]">Add Note</button>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-[11px] font-black uppercase tracking-wider text-[#042C51]">History Trail</h3>
                <div className="divide-y divide-[#E6ECF2] overflow-hidden rounded-xl border border-[#E6ECF2] bg-[#F8FAFC]">
                  {history.length ? history.map((entry, index) => (
                    <div key={`${entry.date}-${index}`} className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[11px] font-bold leading-4 text-[#344054]">{entry.action}</p>
                        <p className="mt-0.5 text-[9px] font-semibold text-[#98A2B3]">By {entry.user || "System"}</p>
                      </div>
                      <span className="shrink-0 font-mono text-[9px] font-bold text-[#98A2B3]">{formatDate(entry.date)}</span>
                    </div>
                  )) : (
                    <p className="px-3 py-5 text-center text-[11px] font-semibold text-[#98A2B3]">No history entries recorded.</p>
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-4 lg:col-span-4">
              <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-[11px] font-black uppercase tracking-wider text-[#042C51]">Ownership &amp; Deadline</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2"><UserRound size={15} className="mt-0.5 text-[#FF5C28]" /><div><p className="text-[9px] font-black uppercase text-[#98A2B3]">Owner</p><p className="text-xs font-bold text-[#344054]">{item.owner || "Unassigned"}</p></div></div>
                  <div className="flex items-start gap-2"><CalendarDays size={15} className="mt-0.5 text-[#FF5C28]" /><div><p className="text-[9px] font-black uppercase text-[#98A2B3]">Deadline</p><p className="text-xs font-bold text-[#344054]">{formatDate(item.deadline)}</p></div></div>
                  <InfoBox label="Account" value={item.account} />
                  <InfoBox label="Role" value={item.roleTitle || item.roleAccount} />
                  <InfoBox label="Created Date" value={formatDate(item.createdDate)} />
                  <InfoBox label="Completed Date" value={formatDate(item.completedDate)} />
                </div>
              </section>

              <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-[11px] font-black uppercase tracking-wider text-[#042C51]">Update Status</h3>
                {systemGenerated ? (
                  <div className="rounded-lg border border-purple-100 bg-purple-50 p-3 text-[10px] font-semibold leading-4 text-purple-700">
                    System-suggested actions are controlled by their source condition and resolve when the underlying risk clears.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {["Planned", "Ongoing", "Completed"].map((status) => (
                      <button key={status} type="button" onClick={() => handleStatus(status)} className={`h-9 rounded-lg border text-[10px] font-black transition ${item.status === status ? "border-[#042C51] bg-[#042C51] text-white" : "border-[#D0D5DD] bg-white text-[#475467] hover:bg-[#F8FAFC]"}`}>{status}</button>
                    ))}
                    {item.status !== "Completed" ? (
                      <button type="button" onClick={() => onComplete?.(item)} className="col-span-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-[10px] font-black text-white hover:bg-emerald-700"><CheckCircle2 size={13} /> Mark Completed</button>
                    ) : null}
                  </div>
                )}
              </section>
            </aside>
          </div>
        </div>

        <footer className="flex shrink-0 justify-end border-t border-[#E6ECF2] bg-white px-5 py-3 sm:px-6">
          <button type="button" onClick={onClose} className="h-10 rounded-lg bg-[#042C51] px-5 text-xs font-black text-white hover:bg-[#073966]">Close Details</button>
        </footer>
      </div>
    </div>
  );
}
