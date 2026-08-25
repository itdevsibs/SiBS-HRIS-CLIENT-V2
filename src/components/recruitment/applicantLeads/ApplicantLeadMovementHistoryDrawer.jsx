import React from "react";
import {
  Clock3,
  History,
  Loader2,
  MessageSquareText,
  UserRound,
  X,
} from "lucide-react";

function cleanText(value) {
  return String(value ?? "").trim();
}

function formatLeadHistoryDateTime(value) {
  if (!value) return "Unknown time";

  const text = String(value).trim();
  const normalizedValue = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)
    ? `${text.replace(" ", "T")}+08:00`
    : text;
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) return text;

  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getHistoryDisplayValue(value) {
  const text = cleanText(value);
  return text || "—";
}

function formatApplicantLeadHistoryActor(item = {}) {
  const sibsId = cleanText(item.actorSibsId || item.actor_sibs_id);
  const name = cleanText(item.actorName || item.actor_name);

  if (sibsId && name) return `${sibsId} - ${name}`;
  if (sibsId) return sibsId;
  return name || "System";
}

function getLeadStatus(lead = {}) {
  return cleanText(lead.status || lead.leadStatus || lead.lead_status) || "Lead";
}

export default function ApplicantLeadMovementHistoryDrawer({
  open = false,
  lead = {},
  history = [],
  isLoading = false,
  error = "",
  onClose,
  triggerRef,
}) {
  if (!open) return null;

  const items = Array.isArray(history) ? history : [];
  const currentStatus = getLeadStatus(lead);

  function handleClose() {
    onClose?.();

    window.requestAnimationFrame(() => {
      triggerRef?.current?.focus?.();
    });
  }

  return (
    <div
      className="sibs-modal-backdrop-in absolute inset-0 z-[100] flex justify-end overflow-hidden"
      aria-hidden={!open}
    >
      <button
        type="button"
        tabIndex={0}
        aria-label="Close Movement History"
        onClick={handleClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] transition-opacity duration-300"
      />

      <aside
        aria-label="Applicant Lead Movement History"
        className="sibs-modal-pop-in relative z-10 flex h-full w-full max-w-[440px] flex-col border-l border-[#D7DEE8] bg-white shadow-2xl"
      >
        <header className="shrink-0 bg-[#042C51] px-5 py-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="inline-flex h-10 w-10 2xl:h-11 2xl:w-11 shrink-0 items-center justify-center rounded-xl bg-[#FF5C28] text-white shadow-sm">
                <History size={18} strokeWidth={2.4} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-white/60">
                    Audit Trail
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white/90">
                    {items.length} {items.length === 1 ? "Record" : "Records"}
                  </span>
                </div>

                <h3 className="mt-0.5 break-words text-base font-extrabold text-white sm:text-lg">
                  Movement History
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="sibs-modal-close-btn"
              aria-label="Close Movement History"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="shrink-0 border-b border-[#E6ECF2] bg-[#F8FAFC] px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-wide text-[#042C51] sm:text-[10px]">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
              LIVE STATUS
            </span>

            <span
              className="max-w-[190px] truncate rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[8.5px] font-extrabold uppercase tracking-wide text-[#174A78]"
              title={currentStatus}
            >
              {currentStatus}
            </span>
          </div>
        </div>

        <div className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-5 py-5">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] py-8 text-xs font-bold text-[#667085]">
              <Loader2 size={16} className="animate-spin text-[#FF5C28]" />
              Loading movement history...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-xs font-bold text-red-600">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D6E0EA] bg-[#F8FAFC] px-4 py-8 text-center">
              <History className="mx-auto text-[#98A2B3]" size={24} />
              <p className="mt-2 text-xs font-extrabold text-[#042C51]">
                No movement history recorded yet
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#667085]">
                Views, edits, comments, status changes, and application activity will appear here.
              </p>
            </div>
          ) : (
            <div className="relative pl-5 sm:pl-6">
              <div className="absolute bottom-2 left-2 top-2 w-[2px] bg-[#E6ECF2]" />

              <div className="space-y-4">
                {items.map((item, index) => {
                  const isLatest = index === 0;
                  const actorLabel = formatApplicantLeadHistoryActor(item);

                  return (
                    <article key={item.id || `${item.activityLabel}-${index}`} className="relative">
                      <span
                        className={`absolute -left-[21px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 bg-white sm:-left-[25px] ${
                          isLatest
                            ? "border-[#FF5C28] ring-4 ring-[#FFF0EB]"
                            : "border-[#98A2B3]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isLatest ? "bg-[#FF5C28]" : "bg-[#98A2B3]"
                          }`}
                        />
                      </span>

                      <div
                        className={`rounded-xl border p-3 sm:p-3.5 ${
                          isLatest
                            ? "border-[#FFD7C8] bg-[#FFFBF9] shadow-xs"
                            : "border-[#E6ECF2] bg-white"
                        }`}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-extrabold text-[#042C51]">
                                {item.activityLabel || "Activity"}
                              </span>

                              {isLatest ? (
                                <span className="rounded bg-[#FF5C28] px-1.5 py-0.5 text-[7px] font-extrabold uppercase tracking-wide text-white sm:text-[8px]">
                                  LATEST
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-semibold text-[#667085]">
                              <span className="inline-flex items-center gap-1">
                                <UserRound size={11} className="text-[#98A2B3]" />
                                {actorLabel}
                              </span>

                              {item.createdAt ? (
                                <span className="inline-flex items-center gap-1">
                                  <Clock3 size={11} className="text-[#98A2B3]" />
                                  {formatLeadHistoryDateTime(item.createdAt)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {item.description ? (
                          <div className="mt-3 rounded-lg border border-[#E6ECF2] bg-white px-3 py-2.5 text-[10px] font-semibold leading-4 text-[#475467] sm:text-[11px] sm:leading-5">
                            {item.description}
                          </div>
                        ) : null}

                        {item.comment ? (
                          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
                            <div className="mb-1 flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wide text-[#174A78]">
                              <MessageSquareText size={11} />
                              Comment
                            </div>
                            <p className="text-[10px] font-semibold leading-4 text-[#344054] sm:text-[11px] sm:leading-5">
                              {item.comment}
                            </p>
                          </div>
                        ) : null}

                        {Array.isArray(item.changedFields) && item.changedFields.length ? (
                          <div className="mt-3 space-y-2">
                            {item.changedFields.map((change, changeIndex) => (
                              <div
                                key={`${item.id}-${change.field}-${changeIndex}`}
                                className="overflow-hidden rounded-lg border border-[#E6ECF2] bg-[#F8FAFC]"
                              >
                                <div className="border-b border-[#E6ECF2] px-3 py-2 text-[9px] font-extrabold text-[#042C51] sm:text-[10px]">
                                  {change.field || "Updated Field"}
                                </div>
                                <div className="grid grid-cols-[68px_minmax(0,1fr)] gap-2 px-3 py-2 text-[9px] sm:text-[10px]">
                                  <span className="font-extrabold text-[#667085]">From:</span>
                                  <span className="min-w-0 break-words font-semibold text-[#344054]">
                                    {getHistoryDisplayValue(change.from)}
                                  </span>
                                  <span className="font-extrabold text-[#667085]">To:</span>
                                  <span className="min-w-0 break-words font-semibold text-[#042C51]">
                                    {getHistoryDisplayValue(change.to)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
