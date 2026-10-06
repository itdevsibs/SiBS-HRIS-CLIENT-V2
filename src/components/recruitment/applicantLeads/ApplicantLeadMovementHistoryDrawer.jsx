import React from "react";
import {
  ArrowLeft,
  Clock3,
  History,
  Loader2,
  MessageSquareText,
  UserRound,
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
    month: "long",
    day: "numeric",
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

  if (sibsId && name) return `SiBS ID ${sibsId} - ${name}`;
  if (sibsId) return `SiBS ID ${sibsId}`;
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
      <aside
        aria-label="Applicant Lead Movement History"
        aria-hidden={!open}
        className="relative z-10 flex h-full w-full flex-col overflow-hidden rounded-xl bg-white"
      >
        <header className="shrink-0 border-b border-sibs-border bg-white px-4 py-2.5 text-sibs-navy">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <History size={15} strokeWidth={2.4} className="shrink-0 text-amber-600" />
              <h3 className="truncate text-xs font-extrabold text-sibs-navy sm:text-sm">
                Audit Trail <span className="font-semibold text-sibs-muted">— {items.length} Records</span>
              </h3>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sibs-muted transition hover:bg-slate-100 hover:text-sibs-navy"
              aria-label="Back to Applicant Lead"
              title="Back"
            >
              <ArrowLeft size={15} />
            </button>
          </div>
        </header>

        <div className="shrink-0 border-b border-sibs-border bg-white px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[8px] font-extrabold uppercase tracking-wide text-sibs-navy sm:text-[9px]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 ring-3 ring-emerald-100" />
              LIVE STATUS
            </span>

            <span
              className="max-w-[170px] truncate rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[7.5px] font-extrabold uppercase tracking-wide text-blue-800"
              title={currentStatus}
            >
              {currentStatus}
            </span>
          </div>
        </div>

        <div className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain bg-sibs-surface px-3 py-3">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-sibs-border bg-sibs-surface py-8 text-xs font-bold text-sibs-muted">
              <Loader2 size={16} className="animate-spin text-sibs-orange" />
              Loading movement history...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-xs font-bold text-red-600">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-sibs-border bg-sibs-surface px-4 py-8 text-center">
              <History className="mx-auto text-sibs-muted" size={24} />
              <p className="mt-2 text-xs font-extrabold text-sibs-navy">
                No movement history recorded yet
              </p>
              <p className="mt-1 text-[11px] font-semibold text-sibs-muted">
                Views, edits, comments, status changes, and application activity will appear here.
              </p>
            </div>
          ) : (
            <div className="relative pl-5 sm:pl-6">
              <div className="space-y-3">
                {items.map((item, index) => {
                  const isLatest = index === 0;
                  const actorLabel = formatApplicantLeadHistoryActor(item);
                  const hasNextItem = index < items.length - 1;

                  return (
                    <article key={item.id || `${item.activityLabel}-${index}`} className="relative">
                      {hasNextItem ? (
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute -left-[15px] top-[13px] bottom-[-25px] z-0 w-[2px] bg-sibs-border sm:-left-[19px]"
                        />
                      ) : null}

                      <span
                        className={`absolute -left-[21px] top-1.5 z-20 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 bg-white sm:-left-[25px] ${
                          isLatest
                            ? "border-sibs-orange ring-4 ring-sibs-cream-light"
                            : "border-sibs-muted"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isLatest ? "bg-sibs-orange" : "bg-sibs-muted"
                          }`}
                        />
                      </span>

                      <div
                        className={`rounded-lg border p-2.5 sm:p-3 ${
                          isLatest
                            ? "border-sibs-orange/30 bg-sibs-cream-light/40 shadow-xs"
                            : "border-sibs-border bg-white"
                        }`}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-extrabold text-sibs-navy">
                                {item.activityLabel || "Activity"}
                              </span>

                              {isLatest ? (
                                <span className="rounded bg-sibs-orange px-1.5 py-0.5 text-[7px] font-extrabold uppercase tracking-wide text-white sm:text-[8px]">
                                  LATEST
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-semibold text-sibs-muted">
                              <span className="inline-flex items-center gap-1">
                                <UserRound size={11} className="text-sibs-muted" />
                                {actorLabel}
                              </span>

                              {item.createdAt ? (
                                <span className="inline-flex items-center gap-1">
                                  <Clock3 size={11} className="text-sibs-muted" />
                                  {formatLeadHistoryDateTime(item.createdAt)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {item.description ? (
                          <div className="mt-2 rounded-md border border-sibs-border bg-white px-2.5 py-2 text-[9px] font-semibold leading-4 text-sibs-navy sm:text-[10px] sm:leading-4">
                            {item.description}
                          </div>
                        ) : null}

                        {item.comment ? (
                          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
                            <div className="mb-1 flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wide text-blue-800">
                              <MessageSquareText size={11} />
                              Comment
                            </div>
                            <p className="text-[10px] font-semibold leading-4 text-sibs-navy sm:text-[11px] sm:leading-5">
                              {item.comment}
                            </p>
                          </div>
                        ) : null}

                        {Array.isArray(item.changedFields) && item.changedFields.length ? (
                          <div className="mt-3 space-y-2">
                            {item.changedFields.map((change, changeIndex) => (
                              (() => {
                                const isHrNote =
                                  cleanText(change.field).toLowerCase() ===
                                  "hr notes";

                                return (
                                  <div
                                    key={`${item.id}-${change.field}-${changeIndex}`}
                                    className="relative z-10 overflow-hidden rounded-lg border border-sibs-border bg-sibs-surface"
                                  >
                                    <div className="border-b border-sibs-border px-3 py-2 text-[9px] font-extrabold text-sibs-navy sm:text-[10px]">
                                       {change.field || "Updated Field"}
                                    </div>
                                    {isHrNote ? (
                                      <div className="grid grid-cols-[68px_minmax(0,1fr)] gap-2 px-3 py-2 text-[9px] sm:text-[10px]">
                                        <span className="font-extrabold text-sibs-muted">Author:</span>
                                        <span className="min-w-0 break-words font-semibold text-sibs-navy">
                                          {actorLabel}
                                        </span>
                                        <span className="font-extrabold text-sibs-muted">Message:</span>
                                        <span className="min-w-0 break-words font-semibold text-sibs-navy">
                                          {getHistoryDisplayValue(change.to)}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-[68px_minmax(0,1fr)] gap-2 px-3 py-2 text-[9px] sm:text-[10px]">
                                        <span className="font-extrabold text-sibs-muted">From:</span>
                                        <span className="min-w-0 break-words font-semibold text-sibs-navy">
                                          {getHistoryDisplayValue(change.from)}
                                        </span>
                                        <span className="font-extrabold text-sibs-muted">To:</span>
                                        <span className="min-w-0 break-words font-semibold text-sibs-navy">
                                          {getHistoryDisplayValue(change.to)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()
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
  );
}
