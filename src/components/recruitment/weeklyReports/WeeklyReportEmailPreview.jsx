import { useState } from "react";
import { Check, Copy, Download, Mail } from "lucide-react";
import ModalShell from "../../ui/ModalShell";

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
    <ModalShell
      open={open}
      onClose={onClose}
      variant="navy"
      maxWidth="max-w-4xl"
      className="rounded-[14px] text-slate-900"
      headerClassName="rounded-t-[14px]"
      icon={Mail}
      title="Management Email Digest"
      subtitle={`${report?.weekLabel || "Current Week"} · ${report?.dateRange || ""}`}
      bodyClassName="p-0 flex flex-col min-h-0 flex-1 overflow-hidden font-jakarta"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between font-jakarta">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-[10px] bg-sibs-navy px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-sibs-orange active:scale-[0.98]"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied to Clipboard" : "Copy Email Content"}
          </button>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange active:scale-[0.98]"
            >
              Close Preview
            </button>

            {typeof onExport === "function" ? (
              <button
                type="button"
                onClick={onExport}
                className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-navy transition hover:bg-sibs-surface active:scale-[0.98]"
              >
                <Download size={14} />
                Export TXT
              </button>
            ) : null}
          </div>
        </div>
      }
      footerClassName="shrink-0 border-t border-sibs-border bg-white rounded-b-[14px] px-5 py-3 2xl:py-3.5 sm:px-6 font-jakarta"
    >
      <div className="shrink-0 border-b border-sibs-border bg-sibs-surface px-4 py-3 sm:px-5">
        <div className="space-y-1.5 text-[10px] sm:text-xs">
          <div className="grid grid-cols-[58px_minmax(0,1fr)] gap-2">
            <span className="font-bold text-sibs-muted">Subject:</span>
            <span className="font-extrabold text-sibs-navy">
              Weekly Hiring Report - {report?.weekLabel || "Current Week"}
            </span>
          </div>
          <div className="grid grid-cols-[58px_minmax(0,1fr)] gap-2">
            <span className="font-bold text-sibs-muted">From:</span>
            <span className="font-semibold text-sibs-muted">{report?.generatedBy || "System"}</span>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-sibs-surface-subtle p-4 sm:p-5 sibs-scrollbar font-jakarta">
        <article className="mx-auto max-w-3xl overflow-hidden rounded-[10px] border border-sibs-border bg-white shadow-sm">
          <div className="border-b border-sibs-border px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-sibs-navy text-xs font-extrabold text-white">S</div>
                <div>
                  <p className="text-xs font-extrabold text-sibs-navy">Siblings Solutions TA</p>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-sibs-muted">Weekly Recruitment Digest</p>
                </div>
              </div>
              <span className="text-[9px] font-bold text-sibs-muted">{report?.dateRange || ""}</span>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div className="text-xs leading-5 text-sibs-muted">
              <p className="font-extrabold text-sibs-navy">Dear Management Team,</p>
              <p className="mt-2">
                Please find the weekly recruitment performance summary for <strong>{report?.weekLabel || "the current week"}</strong>.
              </p>
            </div>

            <div className="rounded-[10px] border border-blue-200 bg-sibs-surface-subtle p-3 text-[11px] leading-5 text-sibs-muted">
              <strong className="text-sibs-navy">Executive Summary:</strong>{" "}
              {report?.summary || "No executive summary is available."}
            </div>

            <div className="overflow-hidden rounded-[10px] border border-sibs-border">
              <div className="grid grid-cols-4 bg-sibs-navy text-center text-[9px] font-extrabold uppercase text-white">
                <div className="p-2.5">Headcount Target</div>
                <div className="p-2.5">Total Filled</div>
                <div className="p-2.5">Fulfillment</div>
                <div className="p-2.5">Drop-offs</div>
              </div>
              <div className="grid grid-cols-4 text-center text-xs font-extrabold">
                <div className="p-3 text-sibs-navy">{requirement}</div>
                <div className="p-3 text-emerald-700">{filled}</div>
                <div className="p-3 text-sibs-orange">{fulfillment}%</div>
                <div className="p-3 text-red-700">{toNumber(report?.dropOffs)}</div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-navy">Role & Account Status</p>
              <div className="mt-2 space-y-1.5">
                {roles.length > 0 ? roles.map((role, index) => (
                  <div key={role.id || `${role.role}-${index}`} className="flex items-center justify-between gap-3 rounded-[10px] border border-sibs-border bg-sibs-surface px-3 py-2 text-[10px]">
                    <span className="min-w-0 truncate text-sibs-muted">
                      <strong>{role.role || "Not assigned"}</strong> ({role.account || "Not assigned"})
                    </span>
                    <span className="shrink-0 font-mono font-extrabold text-sibs-navy">
                      {toNumber(role.filled)}/{toNumber(role.requirement)} [{role.status || "On Track"}]
                    </span>
                  </div>
                )) : (
                  <div className="rounded-[10px] border border-dashed border-sibs-border bg-sibs-surface p-3 text-center text-[10px] font-semibold text-sibs-muted">
                    No role/account breakdown is available.
                  </div>
                )}
              </div>
            </div>

            {actionItems.length > 0 ? (
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-navy">Action Items for Next Week</p>
                <ul className="mt-2 space-y-1 text-[10px] leading-4 text-sibs-muted">
                  {actionItems.map((item, index) => (
                    <li key={`email-action-${index}`} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sibs-orange" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="border-t border-sibs-border pt-3 text-[10px] leading-4 text-sibs-muted">
              <p>Best regards,</p>
              <p className="font-extrabold text-sibs-navy">{report?.generatedBy || "Talent Acquisition"}</p>
              <p>Talent Acquisition Operations | Siblings Solutions</p>
            </div>
          </div>
        </article>
      </div>
    </ModalShell>
  );
}
