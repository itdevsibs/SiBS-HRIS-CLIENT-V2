import {
  CheckCircle2,
  Clock3,
  Loader2,
  XCircle,
} from "lucide-react";

function formatSqlDateTime(value) {
  const text = String(value || "").trim();
  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/,
  );

  if (!match) return text || "-";

  const [, year, month, day, hour, minute] = match;
  const monthName = new Intl.DateTimeFormat("en-US", { month: "long" }).format(
    new Date(2000, Number(month) - 1, 1),
  );
  const hourNumber = Number(hour);
  const displayHour = hourNumber % 12 || 12;
  const meridiem = hourNumber >= 12 ? "PM" : "AM";

  return `${monthName} ${Number(day)}, ${year} at ${displayHour}:${minute} ${meridiem} GMT+8`;
}

export default function DepartmentApprovalRequests({
  requests = [],
  loading = false,
  canApprove = false,
  processingId = "",
  onApprove,
  onReject,
}) {
  if (!loading && requests.length === 0) return null;

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sibs-border px-4 py-4 sm:px-5">
        <div>
          <h2 className="sibs-card-title">Pending Department Approvals</h2>
          <p className="sibs-card-subtitle">
            New departments remain unavailable across HRIS until they are approved. Lines of Business are managed separately per Account.
          </p>
        </div>
        <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-extrabold text-amber-700">
          {requests.length} pending
        </span>
      </div>

      {loading ? (
        <div className="flex min-h-28 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-sibs-orange" />
        </div>
      ) : (
        <div className="divide-y divide-sibs-border">
          {requests.map((request) => {
            const busy = String(processingId) === String(request.id);

            return (
              <div
                key={request.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-extrabold text-sibs-navy">
                      {request.departmentName || request.department_name}
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-amber-700">
                      <Clock3 className="h-3 w-3" /> Pending
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs font-semibold text-sibs-muted">
                    Requested by{" "}
                    {request.requestedByDisplay ||
                      request.requested_by_display ||
                      request.requestedBy ||
                      "System"}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold text-sibs-tertiary-5">
                    {formatSqlDateTime(
                      request.requestedAt || request.requested_at,
                    )}
                  </p>
                </div>

                {canApprove ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 text-xs font-extrabold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                      onClick={() => onReject?.(request)}
                      disabled={busy}
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      Reject
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-extrabold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      onClick={() => onApprove?.(request)}
                      disabled={busy}
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Approve
                    </button>
                  </div>
                ) : (
                  <span className="shrink-0 rounded-lg bg-sibs-surface px-3 py-1.5 text-[10px] font-extrabold text-sibs-muted">
                    Awaiting approver
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
