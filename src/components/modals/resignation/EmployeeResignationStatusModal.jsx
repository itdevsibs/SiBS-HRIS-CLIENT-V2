import { createPortal } from "react-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

function cleanText(value, fallback = "N/A") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function formatDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return cleanText(value);

  return date.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "Pending";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return cleanText(value, "Pending");

  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusClass(status) {
  const key = String(status || "").trim().toLowerCase();

  if (key === "approved" || key === "completed" || key === "in notice period") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (key === "declined" || key === "rejected") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function StatusIcon({ status }) {
  const key = String(status || "").trim().toLowerCase();

  if (key === "approved" || key === "completed") {
    return <CheckCircle2 size={15} className="text-emerald-600" />;
  }

  if (key === "declined" || key === "rejected") {
    return <XCircle size={15} className="text-red-600" />;
  }

  return <Clock3 size={15} className="text-amber-600" />;
}

function DetailItem({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
        {Icon ? <Icon size={13} className="text-[#FF5C28]" /> : null}
        {label}
      </div>
      <p className="mt-1.5 break-words text-xs font-extrabold text-[#042C51]">
        {cleanText(value)}
      </p>
    </div>
  );
}

export default function EmployeeResignationStatusModal({
  open,
  resignation,
  onClose,
}) {
  if (!open || !resignation || typeof document === "undefined") return null;

  const approvalStages = Array.isArray(resignation.approvalStages)
    ? resignation.approvalStages
    : [];

  const filedBy = resignation.filedBy || {};
  const filedByText = [filedBy.access, filedBy.sibsId, filedBy.name]
    .filter((value) => String(value || "").trim())
    .join(" - ");

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-[#042C51]/45 p-3 backdrop-blur-[2px] sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="My resignation status"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[18px] border border-white/80 bg-white shadow-[0_24px_70px_rgba(4,44,81,0.30)]">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E6ECF2] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold text-[#042C51] sm:text-xl">
                My Resignation
              </h2>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getStatusClass(
                  resignation.status,
                )}`}
              >
                {cleanText(resignation.status, "For Approval")}
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold text-[#667085]">
              Track your resignation and approval progress.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#98A2B3] transition hover:bg-[#F2F6FA] hover:text-[#042C51]"
            aria-label="Close resignation status"
          >
            <X size={19} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DetailItem
              label="Resignation Type"
              value={resignation.resignationType}
              icon={FileText}
            />
            <DetailItem
              label="Filed Date"
              value={formatDate(resignation.resignationDate)}
              icon={CalendarDays}
            />
            <DetailItem
              label="Last Working Day"
              value={formatDate(resignation.lastWorkingDate)}
              icon={CalendarDays}
            />
            <DetailItem
              label="Current Stage"
              value={resignation.currentStage}
              icon={Clock3}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
                Reason
              </p>
              <p className="mt-2 whitespace-pre-wrap text-xs font-semibold leading-5 text-[#344054]">
                {cleanText(
                  resignation.specifyOthers || resignation.reason,
                  "No reason provided.",
                )}
              </p>
            </div>

            <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
                <UserRound size={13} className="text-[#FF5C28]" />
                Filed By
              </div>
              <p className="mt-2 text-xs font-extrabold text-[#042C51]">
                {cleanText(filedByText)}
              </p>
            </div>
          </div>

          <section className="mt-5 overflow-hidden rounded-xl border border-[#E6ECF2]">
            <div className="border-b border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3">
              <h3 className="text-xs font-extrabold text-[#042C51]">
                Approval Progress
              </h3>
            </div>

            {approvalStages.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#E6ECF2] bg-white">
                      <th className="px-4 py-2.5 text-[10px] font-extrabold uppercase text-[#8A98B8]">
                        Approval Stage
                      </th>
                      <th className="px-4 py-2.5 text-[10px] font-extrabold uppercase text-[#8A98B8]">
                        Designated Approver
                      </th>
                      <th className="px-4 py-2.5 text-[10px] font-extrabold uppercase text-[#8A98B8]">
                        Status
                      </th>
                      <th className="px-4 py-2.5 text-[10px] font-extrabold uppercase text-[#8A98B8]">
                        Processed
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvalStages.map((stage) => (
                      <tr
                        key={stage.key || stage.label}
                        className="border-b border-[#EEF2F6] last:border-b-0"
                      >
                        <td className="px-4 py-3 text-xs font-extrabold text-[#042C51]">
                          {cleanText(stage.label)}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-[#475467]">
                          {cleanText(
                            [stage.approverSibsId, stage.approverName]
                              .filter(Boolean)
                              .join(" - "),
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#344054]">
                            <StatusIcon status={stage.status} />
                            {cleanText(stage.status, "Pending")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-[#667085]">
                          {formatDateTime(stage.processedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-xs font-semibold text-[#667085]">
                Approval routing is still being prepared.
              </div>
            )}
          </section>

          {resignation.uploadedFile && resignation.uploadedFileUrl ? (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
                  Resignation Attachment
                </p>
                <p className="mt-1 truncate text-xs font-extrabold text-[#042C51]">
                  {resignation.uploadedFile}
                </p>
              </div>
              <a
                href={resignation.uploadedFileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-[#D7DEE8] bg-white px-3 text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5]"
              >
                View Attachment
              </a>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 justify-end border-t border-[#E6ECF2] bg-[#F8FAFC] px-5 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-[#042C51] px-4 text-xs font-extrabold text-white transition hover:bg-[#0A467A]"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
