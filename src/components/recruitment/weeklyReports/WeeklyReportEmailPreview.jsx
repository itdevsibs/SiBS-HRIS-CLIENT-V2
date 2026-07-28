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

export default function WeeklyReportEmailPreview({
  open,
  emailPreview,
  report,
  onClose,
  onExport,
}) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  async function handleCopy() {
    try {
      await copyTextToClipboard(emailPreview || "");
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1600);
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
        className="sibs-inner-modal-pop-in flex max-h-[88dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="weekly-report-email-title"
      >
        <header className="shrink-0 border-b border-[#E6ECF2] bg-white px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Mail size={19} />
              </div>

              <div className="min-w-0">
                <h2
                  id="weekly-report-email-title"
                  className="text-lg font-extrabold text-sibs-primary-1"
                >
                  Weekly Report Email Preview
                </h2>
                <p className="mt-1 truncate text-sm font-semibold text-sibs-tertiary-5">
                  {report?.weekLabel || "Current Week"} · {report?.dateRange || ""}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-[#F1F5F9] hover:text-gray-700 active:scale-[0.98]"
              aria-label="Close email preview"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-[#F5F7FA] p-4 sm:p-5 sibs-scrollbar">
          <div className="overflow-hidden rounded-2xl border border-[#DCE5EE] bg-white shadow-sm">
            <div className="border-b border-[#E6ECF2] px-4 py-3.5 sm:px-5">
              <div className="grid grid-cols-[70px_minmax(0,1fr)] gap-3 text-sm">
                <span className="font-bold text-sibs-tertiary-5">Subject</span>
                <span className="min-w-0 font-extrabold text-[#344054]">
                  Weekly Hiring Report - {report?.weekLabel || "Current Week"}
                </span>
              </div>
            </div>

            <pre className="max-h-[58dvh] overflow-auto whitespace-pre-wrap break-words px-5 py-5 font-mono text-[12px] leading-6 text-[#344054] sm:px-6 sibs-scrollbar">
              {emailPreview || "No email preview is available."}
            </pre>
          </div>
        </main>

        <footer className="shrink-0 border-t border-[#E6ECF2] bg-white px-5 py-3 sm:px-6">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] active:scale-[0.98]"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-sibs-primary-1 transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy Email"}
            </button>

            {typeof onExport === "function" ? (
              <button
                type="button"
                onClick={onExport}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
              >
                <Download size={16} />
                Export TXT
              </button>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  );
}
