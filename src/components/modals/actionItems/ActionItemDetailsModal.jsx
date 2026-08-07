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

function SectionTitle({ icon: Icon, children, helper = "" }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3 border-b border-[#E9EEF4] pb-3 font-jakarta">
      <div className="min-w-0">
        <h3 className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-[#042C51]">
          <Icon size={14} className="shrink-0 text-[#FF5C28]" />
          {children}
        </h3>
        {helper ? (
          <p className="mt-1 text-[10px] font-semibold leading-4 text-[#667085]">
            {helper}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function InfoBox({ label, value, className = "" }) {
  const displayValue =
    value === 0 || value === "0" ? "0" : value || "—";

  return (
    <div
      className={`min-w-0 rounded-xl border border-[#DDE5EE] bg-[#F8FAFC] px-3 py-2.5 font-jakarta ${className}`}
    >
      <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#667085]">
        {label}
      </p>
      <p
        className="mt-1 break-words text-xs font-extrabold leading-5 text-[#042C51]"
        title={String(displayValue)}
      >
        {displayValue}
      </p>
    </div>
  );
}

function MetricCell({ label, value, valueClass = "text-[#042C51]" }) {
  return (
    <div className="flex min-h-[56px] flex-col items-center justify-center px-2 text-center font-jakarta">
      <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#667085]">
        {label}
      </span>
      <span className={`mt-1 tabular-nums text-base font-extrabold ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}

export default function ActionItemDetailsModal({
  open,
  item,
  onClose,
  onComplete,
}) {
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
  const sourceRoute =
    ACTION_ITEM_SOURCE_ROUTES[sourceModule] ||
    ACTION_ITEM_SOURCE_ROUTES[item?.module];
  const systemGenerated =
    Boolean(item?.systemGenerated) ||
    String(item?.sourceType || "")
      .toLowerCase()
      .includes("system");
  const progress = useMemo(
    () => getCompletionPercent(item?.filled, item?.requirement),
    [item?.filled, item?.requirement],
  );
  const history = Array.isArray(item?.history) ? item.history : [];

  if (!open || !item) return null;

  const requirement = Number(item.requirement || 0);
  const filled = Number(item.filled || 0);
  const remainingGap = Math.max(requirement - filled, 0);
  const sourceType = systemGenerated ? "System Suggested" : "Manual";

  function handleViewSource() {
    if (!sourceRoute) return;
    const params = new URLSearchParams();
    if (item.sourceRecordId)
      params.set("sourceRecordId", item.sourceRecordId);
    if (item.weeklyPlanItemId)
      params.set("weeklyPlanItemId", item.weeklyPlanItemId);
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
      className="sibs-modal-blur fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-slate-950/65 p-3 font-jakarta backdrop-blur-sm sm:p-5"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        data-layout="action-item-details-modal-new-theme"
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-item-details-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="sibs-modal-pop-in flex max-h-[94dvh] w-full max-w-[1020px] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl"
      >
        <header className="shrink-0 bg-[#042C51] px-5 py-3.5 text-white sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-2.5">
              <ClipboardCheck
                size={19}
                className="mt-0.5 shrink-0 text-[#FF5C28]"
              />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-[#FF5C28] px-2 py-0.5 font-jakarta text-[9px] font-extrabold uppercase text-white">
                    {item.actionId || "ACTION"}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-[0.04em] text-slate-300">
                    {sourceType} Action Item
                  </span>
                </div>

                <h2
                  id="action-item-details-title"
                  className="mt-1 line-clamp-2 text-sm font-black leading-5 sm:text-base"
                  title={item.actionItem || "Action Item Details"}
                >
                  {item.actionItem || "Action Item Details"}
                </h2>

                <p className="mt-0.5 text-[10px] font-medium leading-4 text-slate-300">
                  Review the linked hiring gap, accountability, progress, and
                  execution history.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-start gap-2">
              <div className="hidden flex-wrap justify-end gap-1.5 sm:flex">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${getStatusClass(
                    item.status,
                  )}`}
                >
                  {item.status || "Planned"}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${getRiskClass(
                    item.riskLevel,
                  )}`}
                >
                  {item.riskLevel || "Medium"} Risk
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white active:scale-[0.98]"
                aria-label="Close Action Item details"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 sm:hidden">
            <span
              className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${getStatusClass(
                item.status,
              )}`}
            >
              {item.status || "Planned"}
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${getRiskClass(
                item.riskLevel,
              )}`}
            >
              {item.riskLevel || "Medium"} Risk
            </span>
          </div>
        </header>

        <main className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#F5F7FA] p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)] lg:items-start">
            <div className="space-y-4">
              <section className="rounded-xl border border-[#DDE5EE] bg-white p-4 shadow-sm sm:p-5">
                <SectionTitle
                  icon={FileText}
                  helper="Primary action description, remarks, and current execution state."
                >
                  Action Summary & Context
                </SectionTitle>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold leading-6 text-[#042C51]">
                      {item.actionItem || "No action description recorded."}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold leading-5 text-[#667085]">
                      {item.remarks || "No remarks have been recorded."}
                    </p>
                  </div>

                  <div className="grid shrink-0 grid-cols-2 gap-2 sm:w-[230px]">
                    <InfoBox label="Source Type" value={sourceType} />
                    <InfoBox label="Linked Gap" value={item.linkedGap} />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-[#DDE5EE] bg-white p-4 shadow-sm sm:p-5">
                <SectionTitle
                  icon={Target}
                  helper="The current hiring requirement and the source record linked to this action."
                >
                  Hiring Gap & Source Linkage
                </SectionTitle>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <InfoBox label="Source Module" value={sourceModule} />
                  <InfoBox
                    label="Reporting Week"
                    value={item.reportingWeek || "—"}
                    mono
                  />
                  <InfoBox
                    label="Source Record"
                    value={
                      item.sourceRecordId ||
                      item.weeklyPlanItemId ||
                      item.hiringNeedId ||
                      "—"
                    }
                    mono
                  />
                </div>

                <div className="mt-3 grid grid-cols-3 divide-x divide-[#DDE5EE] rounded-xl border border-[#DDE5EE] bg-[#F8FAFC] px-1 py-1.5">
                  <MetricCell label="Requirement" value={requirement} />
                  <MetricCell
                    label="Filled / Accepted"
                    value={filled}
                    valueClass="text-emerald-600"
                  />
                  <MetricCell
                    label="Remaining Gap"
                    value={remainingGap}
                    valueClass="text-rose-600"
                  />
                </div>

                <div className="mt-3">
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="text-[9px] font-bold text-[#667085]">
                      Current Fill Rate Progress
                    </span>
                    <span
                      className={`tabular-nums text-[10px] font-extrabold ${
                        progress >= 80
                          ? "text-emerald-600"
                          : progress >= 50
                            ? "text-amber-600"
                            : "text-rose-600"
                      }`}
                    >
                      {progress}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full border border-[#DDE5EE] bg-[#EEF2F6]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        progress >= 80
                          ? "bg-emerald-500"
                          : progress >= 50
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                    />
                  </div>
                </div>

                {item.atRiskReason ? (
                  <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
                    <p className="flex items-center gap-1.5 text-[9px] font-black uppercase text-rose-700">
                      <AlertTriangle size={12} /> At-Risk Reason
                    </p>
                    <p className="mt-1 text-[10px] font-semibold leading-4 text-rose-900">
                      {item.atRiskReason}
                    </p>
                  </div>
                ) : null}

                {item.latestStatusNote ? (
                  <div className="mt-3 rounded-xl border border-[#DDE5EE] bg-[#F8FAFC] px-3 py-2.5">
                    <p className="text-[8px] font-black uppercase tracking-[0.04em] text-[#667085]">
                      Latest Source Status
                    </p>
                    <p className="mt-1 text-[10px] font-semibold italic leading-4 text-[#475467]">
                      {item.latestStatusNote}
                    </p>
                  </div>
                ) : null}
              </section>

              <section className="rounded-xl border border-[#DDE5EE] bg-white p-4 shadow-sm sm:p-5">
                <SectionTitle
                  icon={MessageSquarePlus}
                  helper="Record a concise update for the next JIT or weekly hiring review."
                >
                  Operational Progress Notes
                </SectionTitle>

                {systemGenerated ? (
                  <div className="rounded-xl border border-purple-100 bg-purple-50 p-3 text-[10px] font-semibold leading-4 text-purple-700">
                    System-suggested action notes are read-only. Update the
                    source record so the generated action and its context remain
                    authoritative.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Add a progress note for the next JIT or weekly call..."
                      className="h-10 min-w-0 flex-1 rounded-lg border border-[#D0D5DD] bg-white px-3 text-xs font-semibold text-[#344054] outline-none transition focus:border-[#042C51] focus:ring-4 focus:ring-[#042C51]/10"
                    />
                    <button
                      type="button"
                      onClick={handleAddNote}
                      className="h-10 rounded-lg bg-[#042C51] px-4 text-xs font-black text-white transition hover:bg-[#073966]"
                    >
                      Add Note
                    </button>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-[#DDE5EE] bg-white p-4 shadow-sm sm:p-5">
                <SectionTitle
                  icon={ClipboardCheck}
                  helper="Chronological changes and progress entries recorded for this action."
                >
                  History Trail
                </SectionTitle>

                <div className="divide-y divide-[#E6ECF2] overflow-hidden rounded-xl border border-[#E6ECF2] bg-[#F8FAFC]">
                  {history.length ? (
                    history.map((entry, index) => (
                      <div
                        key={`${entry.date}-${index}`}
                        className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold leading-4 text-[#344054]">
                            {entry.action}
                          </p>
                          <p className="mt-0.5 text-[9px] font-semibold text-[#98A2B3]">
                            By {entry.user || "System"}
                          </p>
                        </div>
                        <span className="shrink-0 font-jakarta text-[9px] font-semibold text-[#667085]">
                          {formatDate(entry.date)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="px-3 py-5 text-center text-[11px] font-semibold text-[#98A2B3]">
                      No history entries recorded.
                    </p>
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-0">
              <section className="rounded-xl border border-[#DDE5EE] bg-white p-4 shadow-sm sm:p-5">
                <SectionTitle
                  icon={UserRound}
                  helper="The person accountable for delivery and the target completion date."
                >
                  Ownership & Deadline
                </SectionTitle>

                <div className="rounded-xl border border-[#DDE5EE] bg-[#F8FAFC] p-3">
                  <div className="flex items-start gap-2.5">
                    <UserRound
                      size={16}
                      className="mt-0.5 shrink-0 text-[#FF5C28]"
                    />
                    <div className="min-w-0">
                      <p className="text-[8px] font-black uppercase tracking-[0.04em] text-[#98A2B3]">
                        Accountable Owner
                      </p>
                      <p
                        className="mt-1 break-words text-xs font-bold leading-5 text-[#344054]"
                        title={item.owner || "Unassigned"}
                      >
                        {item.owner || "Unassigned"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-start gap-2.5 border-t border-[#DDE5EE] pt-3">
                    <CalendarDays
                      size={16}
                      className="mt-0.5 shrink-0 text-[#FF5C28]"
                    />
                    <div className="min-w-0">
                      <p className="text-[8px] font-black uppercase tracking-[0.04em] text-[#98A2B3]">
                        Target Deadline
                      </p>
                      <p className="mt-1 font-jakarta text-xs font-extrabold text-[#042C51]">
                        {formatDate(item.deadline)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <InfoBox label="Account" value={item.account} />
                  <InfoBox
                    label="Role"
                    value={item.roleTitle || item.roleAccount}
                  />
                  <InfoBox
                    label="Created Date"
                    value={formatDate(item.createdDate)}
                  />
                  <InfoBox
                    label="Completed Date"
                    value={formatDate(item.completedDate)}
                  />
                </div>
              </section>

              <section className="rounded-xl border border-[#DDE5EE] bg-white p-4 shadow-sm sm:p-5">
                <SectionTitle
                  icon={CheckCircle2}
                  helper="Manual action items can be advanced through the execution lifecycle."
                >
                  Update Status
                </SectionTitle>

                {systemGenerated ? (
                  <div className="rounded-xl border border-purple-100 bg-purple-50 p-3 text-[10px] font-semibold leading-4 text-purple-700">
                    System-suggested actions are controlled by their source
                    condition and resolve when the underlying risk clears.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {["Planned", "Ongoing", "Completed"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleStatus(status)}
                        className={`h-9 rounded-lg border px-2 text-[9px] font-black transition ${
                          item.status === status
                            ? "border-[#042C51] bg-[#042C51] text-white"
                            : "border-[#D0D5DD] bg-white text-[#475467] hover:bg-[#F8FAFC]"
                        }`}
                      >
                        {status}
                      </button>
                    ))}

                    {item.status !== "Completed" ? (
                      <button
                        type="button"
                        onClick={() => onComplete?.(item)}
                        className="col-span-3 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-[10px] font-black text-white transition hover:bg-emerald-700"
                      >
                        <CheckCircle2 size={13} /> Mark Completed
                      </button>
                    ) : (
                      <div className="col-span-3 flex h-10 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-[10px] font-black text-emerald-700">
                        <CheckCircle2 size={13} /> Action Completed
                      </div>
                    )}
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#042C51] shadow-sm">
                    <ExternalLink size={16} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-[#042C51]">
                      Linked Source Record
                    </p>
                    <p className="mt-1 text-[10px] font-semibold leading-4 text-[#174A7C]">
                      Open the originating hiring plan or hiring need to review
                      the requirement that created this action.
                    </p>

                    {sourceRoute ? (
                      <button
                        type="button"
                        onClick={handleViewSource}
                        className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#FF5C28] px-3 text-[10px] font-black text-white transition hover:bg-[#E04B1D]"
                      >
                        <ExternalLink size={13} /> View Source Record
                      </button>
                    ) : (
                      <div className="mt-3 rounded-lg border border-blue-200 bg-white px-3 py-2 text-center text-[9px] font-bold text-[#667085]">
                        No source route is configured for {sourceModule}.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </main>

        <footer className="shrink-0 border-t border-[#DDE5EE] bg-[#F1F5F9] px-5 py-3 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2 text-[9px] font-semibold text-[#667085]">
              <Target size={13} className="shrink-0 text-[#042C51]" />
              <span className="truncate">
                Linked to {sourceModule} · {item.linkedGap || "General"} gap ·
                {" "}
                {remainingGap} remaining
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-[#042C51] px-5 text-xs font-black text-white transition hover:bg-[#073966] active:scale-[0.98]"
            >
              Close Details
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}