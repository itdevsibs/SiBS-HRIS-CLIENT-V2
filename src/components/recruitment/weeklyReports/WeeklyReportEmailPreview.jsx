import { useState } from "react";
import { Check, Copy, Download, Mail, X } from "lucide-react";

async function copyTextToClipboard(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) {
    throw new Error("Clipboard copy is not supported in this browser.");
  }
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function WeeklyReportEmailPreview({
  open,
  emailPreview,
  report,
  onClose,
  onExport,
}) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const requirement = toNumber(report?.totalRequirement);
  const filled = toNumber(report?.totalFilled);
  const fulfillment = requirement > 0 ? Math.round((filled / requirement) * 100) : 0;
  const roles = Array.isArray(report?.roles) ? report.roles : [];
  const actionItems = Array.isArray(report?.actionItems)
    ? report.actionItems.filter((item) => item && item !== "No open action items recorded for the current week.")
    : [];

  async function handleCopy() {
    try {
      await copyTextToClipboard(emailPreview || "");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.error("Copy failed:", error);
      alert("Failed to copy the email preview.");
    }
  }

  return (
    <div
      className="sibs-modal-blur fixed inset-0 z-[10000] flex h-dvh items-center justify-center p-3 sm:p-5"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        className="sibs-inner-modal-pop-in flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="weekly-report-email-title"
      >
        <header className="shrink-0 bg-[#042C51] px-5 py-4 text-white sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#FF5C28]">
                <Mail size={18} />
              </div>
              <div className="min-w-0">
                <h2 id="weekly-report-email-title" className="text-sm font-extrabold sm:text-base">
                  Formatted Management Email Digest Template
                </h2>
                <p className="mt-0.5 truncate text-[10px] font-semibold text-blue-200 sm:text-xs">
                  {report?.weekLabel || "Current Week"} · {report?.dateRange || ""}
                </p>
              </div>
            </div>

            <button type="button" onClick={onClose} className="sibs-modal-close-btn" aria-label="Close email preview">
              <X size={19} />
            </button>
          </div>
        </header>

        <div className="shrink-0 border-b border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 sm:px-5">
          <div className="space-y-1.5 text-[10px] sm:text-xs">
            <div className="grid grid-cols-[58px_minmax(0,1fr)] gap-2">
              <span className="font-bold text-[#667085]">Subject:</span>
              <span className="font-extrabold text-sibs-primary-1">
                Weekly Hiring Report - {report?.weekLabel || "Current Week"}
              </span>
            </div>
            <div className="grid grid-cols-[58px_minmax(0,1fr)] gap-2">
              <span className="font-bold text-[#667085]">From:</span>
              <span className="font-semibold text-[#344054]">{report?.generatedBy || "System"}</span>
            </div>
          </div>
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto bg-[#F1F5F9] p-4 sm:p-5 sibs-scrollbar">
          <article className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-[#DCE5EE] bg-white shadow-sm">
            <div className="border-b border-[#E6ECF2] px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#042C51] text-xs font-extrabold text-white">S</div>
                  <div>
                    <p className="text-xs font-extrabold text-sibs-primary-1">Siblings Solutions TA</p>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[#98A2B3]">Weekly Recruitment Digest</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-[#98A2B3]">{report?.dateRange || ""}</span>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="text-xs leading-5 text-[#344054]">
                <p className="font-extrabold text-sibs-primary-1">Dear Management Team,</p>
                <p className="mt-2">
                  Please find the weekly recruitment performance summary for <strong>{report?.weekLabel || "the current week"}</strong>.
                </p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-[#E9F0FC] p-3 text-[11px] leading-5 text-[#344054]">
                <strong className="text-sibs-primary-1">Executive Summary:</strong>{" "}
                {report?.summary || "No executive summary is available."}
              </div>

              <div className="overflow-hidden rounded-lg border border-[#E6ECF2]">
                <div className="grid grid-cols-4 bg-[#042C51] text-center text-[9px] font-extrabold uppercase text-white">
                  <div className="p-2.5">Headcount Target</div>
                  <div className="p-2.5">Total Filled</div>
                  <div className="p-2.5">Fulfillment</div>
                  <div className="p-2.5">Drop-offs</div>
                </div>
                <div className="grid grid-cols-4 text-center text-xs font-extrabold">
                  <div className="p-3 text-sibs-primary-1">{requirement}</div>
                  <div className="p-3 text-emerald-700">{filled}</div>
                  <div className="p-3 text-[#FF5C28]">{fulfillment}%</div>
                  <div className="p-3 text-red-700">{toNumber(report?.dropOffs)}</div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1">Role & Account Status</p>
                <div className="mt-2 space-y-1.5">
                  {roles.length > 0 ? roles.map((role, index) => (
                    <div key={role.id || `${role.role}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2 text-[10px]">
                      <span className="min-w-0 truncate text-[#344054]">
                        <strong>{role.role || "Not assigned"}</strong> ({role.account || "Not assigned"})
                      </span>
                      <span className="shrink-0 font-mono font-extrabold text-sibs-primary-1">
                        {toNumber(role.filled)}/{toNumber(role.requirement)} [{role.status || "On Track"}]
                      </span>
                    </div>
                  )) : (
                    <div className="rounded-lg border border-dashed border-[#D7E0E9] bg-[#F8FAFC] p-3 text-center text-[10px] font-semibold text-[#667085]">
                      No role/account breakdown is available.
                    </div>
                  )}
                </div>
              </div>

              {actionItems.length > 0 ? (
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1">Action Items for Next Week</p>
                  <ul className="mt-2 space-y-1 text-[10px] leading-4 text-[#344054]">
                    {actionItems.map((item, index) => (
                      <li key={`email-action-${index}`} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF5C28]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="border-t border-[#E6ECF2] pt-3 text-[10px] leading-4 text-[#667085]">
                <p>Best regards,</p>
                <p className="font-extrabold text-sibs-primary-1">{report?.generatedBy || "Talent Acquisition"}</p>
                <p>Talent Acquisition Operations | Siblings Solutions</p>
              </div>
            </div>
          </article>
        </main>

        <footer className="shrink-0 border-t border-[#E6ECF2] bg-white px-4 py-2.5 sm:px-5 2xl:px-6 2xl:py-3 font-jakarta">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-lg 2xl:rounded-xl bg-[#042C51] px-4 sibs-text-xs font-extrabold text-white transition hover:bg-[#FF5C28] active:scale-[0.98]"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied to Clipboard" : "Copy Email Content"}
            </button>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg 2xl:rounded-xl border border-[#D6DEE8] bg-white px-4 2xl:px-5 sibs-text-xs font-extrabold text-[#667085] transition hover:bg-[#F8FAFC] active:scale-[0.98]"
              >
                Close Preview
              </button>

              {typeof onExport === "function" ? (
                <button
                  type="button"
                  onClick={onExport}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-lg 2xl:rounded-xl border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#042C51] transition hover:bg-[#F8FAFC] active:scale-[0.98]"
                >
                  <Download size={14} />
                  Export TXT
                </button>
              ) : null}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
