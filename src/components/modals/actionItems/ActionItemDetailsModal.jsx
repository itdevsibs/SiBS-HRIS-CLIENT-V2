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
    <div className="mb-3.5 flex items-start justify-between gap-3 border-b border-[#E6ECF2] pb-2.5 font-jakarta">
      <div className="min-w-0">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#042C51]">
          {Icon ? (
            <span className="flex h-6 w-6 2xl:h-6.5 2xl:w-6.5 shrink-0 items-center justify-center rounded-lg bg-[#E9F0FC] text-[#042C51]">
              <Icon size={14} className="shrink-0 text-[#FF5C28]" />
            </span>
          ) : null}
          {children}
        </h3>
        {helper ? (
          <p className="mt-0.5 text-[10px] font-semibold leading-4 text-[#667085] sm:text-xs sm:leading-5">
            {helper}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function MetricCell({ label, value, valueClass = "text-[#042C51]" }) {
  return (
    <div className="flex min-h-[48px] 2xl:min-h-[52px] flex-col items-center justify-center px-2 text-center font-jakarta">
      <span className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
        {label}
      </span>
      <span className={`mt-0.5 tabular-nums text-xs 2xl:text-sm font-extrabold ${valueClass}`}>
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
      className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[10000] flex h-dvh items-center justify-center p-2 font-jakarta sm:p-4"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        data-layout="action-item-details-modal-new-theme"
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-item-details-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="sibs-modal-pop-in flex max-h-[92dvh] w-full max-w-5xl 2xl:max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl"
      >
        <header className="shrink-0 bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-2.5 2xl:gap-3">
              <span className="flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
                <ClipboardCheck size={16} />
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-[#FF5C28] px-2 py-0.5 font-jakarta text-[8.5px] 2xl:text-[9px] font-extrabold uppercase text-white">
                    {item.actionId || "ACTION"}
                  </span>
                  <span className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-slate-300">
                    {sourceType} Action Item
                  </span>
                </div>

                <h2
                  id="action-item-details-title"
                  className="mt-1 line-clamp-2 text-base sm:text-lg 2xl:text-xl font-extrabold text-white leading-tight"
                  title={item.actionItem || "Action Item Details"}
                >
                  {item.actionItem || "Action Item Details"}
                </h2>

                <p className="mt-0.5 sibs-text-xs font-semibold text-white/75">
                  Review the linked hiring gap, accountability, progress, and
                  execution history.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-start gap-2">
              <div className="hidden flex-wrap justify-end gap-1.5 sm:flex">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide ${getStatusClass(
                    item.status,
                  )}`}
                >
                  {item.status || "Planned"}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide ${getRiskClass(
                    item.riskLevel,
                  )}`}
                >
                  {item.riskLevel || "Medium"} Risk
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Close Action Item details"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1.5 sm:hidden">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wide ${getStatusClass(
                item.status,
              )}`}
            >
              {item.status || "Planned"}
            </span>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wide ${getRiskClass(
                item.riskLevel,
              )}`}
            >
              {item.riskLevel || "Medium"} Risk
            </span>
          </div>
        </header>

        <main className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#F5F7FA] p-3.5 sm:p-4 2xl:p-5 font-jakarta">
          <div className="grid grid-cols-1 gap-3.5 2xl:gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] 2xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)] lg:items-start">
            <div className="space-y-3.5 2xl:space-y-4">
              <section className="rounded-xl border border-[#DDE5EE] bg-white p-3.5 shadow-sm sm:p-4 2xl:p-5">
                <SectionTitle
                  icon={FileText}
                  helper="Primary action description, remarks, and current execution state."
                >
                  Action Summary & Context
                </SectionTitle>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs 2xl:text-sm font-extrabold leading-5 2xl:leading-6 text-[#042C51]">
                      {item.actionItem || "No action description recorded."}
                    </p>
                    <p className="mt-1.5 text-[11px] 2xl:text-xs font-semibold leading-5 text-[#667085]">
                      {item.remarks || "No remarks have been recorded."}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-row sm:flex-col gap-2 sm:w-[190px]">
                    <div className="flex-1 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2">
                      <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">Source Type</p>
                      <p className="mt-0.5 text-[11px] 2xl:text-xs font-extrabold leading-tight text-[#042C51]">{sourceType}</p>
                    </div>
                    <div className="flex-1 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2">
                      <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">Linked Gap</p>
                      <p className="mt-0.5 text-[11px] 2xl:text-xs font-extrabold leading-tight text-[#042C51]">{item.linkedGap || "—"}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-[#DDE5EE] bg-white p-3.5 shadow-sm sm:p-4 2xl:p-5">
                <SectionTitle
                  icon={Target}
                  helper="The current hiring requirement and the source record linked to this action."
                >
                  Hiring Gap & Source Linkage
                </SectionTitle>

                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E6ECF2] overflow-hidden rounded-xl border border-[#E6ECF2] bg-[#F8FAFC]">
                  <div className="p-2.5 2xl:p-3">
                    <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">Source Module</p>
                    <p className="mt-0.5 text-[11px] 2xl:text-xs font-extrabold leading-tight text-[#042C51] truncate">{sourceModule}</p>
                  </div>
                  <div className="p-2.5 2xl:p-3">
                    <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">Reporting Week</p>
                    <p className="mt-0.5 text-[11px] 2xl:text-xs font-extrabold font-mono leading-tight text-[#042C51]">{item.reportingWeek || "—"}</p>
                  </div>
                  <div className="p-2.5 2xl:p-3">
                    <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">Source Record</p>
                    <p className="mt-0.5 text-[11px] 2xl:text-xs font-extrabold font-mono leading-tight text-[#042C51]">{item.sourceRecordId || item.weeklyPlanItemId || item.hiringNeedId || "—"}</p>
                  </div>
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
                    <span className="text-[9px] 2xl:text-[10px] font-bold text-[#667085]">
                      Current Fill Rate Progress
                    </span>
                    <span
                      className={`tabular-nums text-[10px] 2xl:text-xs font-extrabold ${
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
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
                    <p className="flex items-center gap-1.5 text-[9px] 2xl:text-[10px] font-black uppercase text-rose-700">
                      <AlertTriangle size={13} /> At-Risk Reason
                    </p>
                    <p className="mt-1 text-[11px] 2xl:text-xs font-semibold leading-5 text-rose-900">
                      {item.atRiskReason}
                    </p>
                  </div>
                ) : null}

                {item.latestStatusNote ? (
                  <div className="mt-3 rounded-xl border border-[#DDE5EE] bg-[#F8FAFC] px-3 py-2.5">
                    <p className="text-[9px] 2xl:text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                      Latest Source Status
                    </p>
                    <p className="mt-1 text-[11px] 2xl:text-xs font-semibold italic leading-5 text-[#475467]">
                      {item.latestStatusNote}
                    </p>
                  </div>
                ) : null}
              </section>

              <section className="rounded-xl border border-[#DDE5EE] bg-white p-3.5 shadow-sm sm:p-4 2xl:p-5">
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
                      className="h-8.5 2xl:h-10 min-w-0 flex-1 rounded-lg 2xl:rounded-xl border border-[#D0D5DD] bg-white px-3.5 sibs-text-xs font-semibold text-[#344054] outline-none transition focus:border-[#FF5C28] focus:ring-2 focus:ring-[#FF5C28]/20"
                    />
                    <button
                      type="button"
                      onClick={handleAddNote}
                      disabled={!note.trim()}
                      className="inline-flex h-8.5 2xl:h-10 shrink-0 items-center justify-center rounded-lg 2xl:rounded-xl bg-[#042C51] px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#073966] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
                    >
                      Add Note
                    </button>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-[#DDE5EE] bg-white p-3.5 shadow-sm sm:p-4 2xl:p-5">
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
                        className="flex flex-col gap-1 px-3.5 py-2.5 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] 2xl:text-xs font-bold leading-5 text-[#344054]">
                            {entry.action}
                          </p>
                          <p className="mt-0.5 text-[8.5px] 2xl:text-[9px] font-semibold text-[#98A2B3]">
                            By {entry.user || "System"}
                          </p>
                        </div>
                        <span className="shrink-0 font-jakarta text-[8.5px] 2xl:text-[9px] font-semibold text-[#667085]">
                          {formatDate(entry.date)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="px-3.5 py-4 text-center text-[11px] 2xl:text-xs font-semibold text-[#98A2B3]">
                      No history entries recorded.
                    </p>
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-3.5 2xl:space-y-4 lg:sticky lg:top-0">
              <section className="rounded-xl border border-[#DDE5EE] bg-white p-3.5 shadow-sm sm:p-4 2xl:p-5">
                <SectionTitle
                  icon={UserRound}
                  helper="The person accountable for delivery and the target completion date."
                >
                  Ownership & Deadline
                </SectionTitle>

                <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E6ECF2] text-[#FF5C28] shadow-2xs">
                      <UserRound size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                        Accountable Owner
                      </p>
                      <p
                        className="mt-0.5 break-words text-[11px] 2xl:text-xs font-extrabold leading-tight text-[#042C51]"
                        title={item.owner || "Unassigned"}
                      >
                        {item.owner || "Unassigned"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 border-t border-[#E6ECF2] pt-2">
                    <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E6ECF2] text-[#FF5C28] shadow-2xs">
                      <CalendarDays size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                        Target Deadline
                      </p>
                      <p className="mt-0.5 font-jakarta text-[11px] 2xl:text-xs font-extrabold leading-tight text-[#042C51]">
                        {formatDate(item.deadline)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 divide-y divide-[#E6ECF2] overflow-hidden rounded-xl border border-[#E6ECF2] bg-[#F8FAFC]">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">Account</span>
                    <span className="text-[11px] 2xl:text-xs font-extrabold text-[#042C51] text-right">{item.account || "—"}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3 px-3 py-2">
                    <span className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3] shrink-0">Role</span>
                    <span className="text-[11px] 2xl:text-xs font-extrabold text-[#042C51] text-right truncate max-w-[170px]" title={item.roleTitle || item.roleAccount}>{item.roleTitle || item.roleAccount || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">Created Date</span>
                    <span className="text-[11px] 2xl:text-xs font-extrabold text-[#042C51]">{formatDate(item.createdDate)}</span>
                  </div>
                  {item.completedDate ? (
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">Completed Date</span>
                      <span className="text-[11px] 2xl:text-xs font-extrabold text-[#042C51]">{formatDate(item.completedDate)}</span>
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="rounded-xl border border-[#DDE5EE] bg-white p-3.5 shadow-sm sm:p-4 2xl:p-5">
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
                        className={`h-7.5 2xl:h-8 rounded-lg border px-2 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide transition ${
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
                        className="col-span-3 inline-flex h-8 2xl:h-8.5 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-[10px] 2xl:text-[11px] font-extrabold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
                      >
                        <CheckCircle2 size={13} /> Mark Completed
                      </button>
                    ) : (
                      <div className="col-span-3 flex h-8 2xl:h-8.5 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-[10px] 2xl:text-[11px] font-extrabold text-emerald-700">
                        <CheckCircle2 size={13} /> Action Completed
                      </div>
                    )}
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/90 to-blue-50/40 p-3.5 sm:p-4 2xl:p-5">
                <SectionTitle
                  icon={ExternalLink}
                  helper="Open the originating hiring plan or need to review the source requirement."
                >
                  Linked Source Record
                </SectionTitle>

                <div className="mt-2.5">
                  {sourceRoute ? (
                    <button
                      type="button"
                      onClick={handleViewSource}
                      className="inline-flex h-8 2xl:h-8.5 w-full items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-3.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E04B1D] active:scale-[0.98]"
                    >
                      <ExternalLink size={13} /> View Source Record
                    </button>
                  ) : (
                    <div className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-center text-[10px] font-bold text-[#667085]">
                      No source route is configured for {sourceModule}.
                    </div>
                  )}
                </div>
              </section>
            </aside>
          </div>
        </main>

        <footer className="shrink-0 border-t border-[#DDE5EE] bg-[#F1F5F9] px-4 py-2.5 sm:px-5 2xl:px-6 2xl:py-3">
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
              className="inline-flex h-8.5 2xl:h-10 shrink-0 items-center justify-center rounded-lg 2xl:rounded-xl bg-[#042C51] px-4 2xl:px-5 sibs-text-xs font-extrabold text-white transition hover:bg-[#073966] active:scale-[0.98]"
            >
              Close Details
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}