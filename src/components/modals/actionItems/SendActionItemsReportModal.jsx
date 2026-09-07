import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Eye,
  Mail,
  RefreshCw,
  Send,
  X,
} from "lucide-react";
import { useActionItemsReport } from "../../../services/context/ActionItemsReportContext.jsx";
import {
  buildActionItemsReportPayload,
  buildPlainTextReport,
} from "../../../lib/utils/actionItems/actionItemsReportHelpers.js";
import {
  downloadActionItemsReportPdf,
  sendActionItemsReport,
} from "../../../services/api/actionItemsReportApi.js";

const SYSTEM_SENDER = import.meta.env?.VITE_RECRUITMENT_REPORT_SENDER || "recruitment-reports@mysibs.info";
const DEFAULT_TO = import.meta.env?.VITE_RECRUITMENT_REPORT_DEFAULT_TO || "";
const DEFAULT_CC = import.meta.env?.VITE_RECRUITMENT_REPORT_DEFAULT_CC || "";

function splitRecipients(value) {
  return String(value || "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function PreviewTable({ title, headers, rows, emptyMessage }) {
  return (
    <section className="space-y-2">
      <h4 className="border-l-4 border-[#FF5C28] pl-2 text-[10px] font-black uppercase tracking-wider text-[#042C51]">{title}</h4>
      <div className="overflow-x-auto rounded-lg border border-[#D9E2EC]">
        <table className="w-full min-w-[600px] text-left text-[9px]">
          <thead className="bg-[#042C51] text-white">
            <tr>{headers.map((header) => <th key={header} className="px-2 py-2 font-black uppercase">{header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-[#E6ECF2]">
            {rows.length ? rows.map((cells, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 ? "bg-[#F8FAFC]" : "bg-white"}>
                {cells.map((cell, cellIndex) => <td key={cellIndex} className="px-2 py-2 align-top font-semibold text-[#475467]">{cell}</td>)}
              </tr>
            )) : (
              <tr><td colSpan={headers.length} className="px-3 py-6 text-center font-semibold text-[#98A2B3]">{emptyMessage}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function SendActionItemsReportModal() {
  const {
    showEmailModal,
    closeEmailModal,
    reportingScope,
    previousWeekLabel,
    filteredWeeklyPerformanceRows,
    filteredCurrentStatusRows,
    filteredActionItems,
  } = useActionItemsReport();
  const [toValue, setToValue] = useState(DEFAULT_TO);
  const [ccValue, setCcValue] = useState(DEFAULT_CC);
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState(
    "Hi Team, please review the attached weekly recruitment execution report covering weekly performance, current hiring status, and action items requiring management attention.",
  );
  const [tab, setTab] = useState("formatted");
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!showEmailModal) return;
    setSubject(`[TA-HRIS Report] Weekly Recruitment Execution & Action Items - ${reportingScope.weekLabel || "Current Week"}`);
  }, [showEmailModal, reportingScope.weekLabel]);

  useEffect(() => {
    if (!showEmailModal) return undefined;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !sending && !downloading) closeEmailModal();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showEmailModal, closeEmailModal, sending, downloading]);

  const payload = useMemo(
    () => ({
      ...buildActionItemsReportPayload({
        scope: reportingScope,
        previousWeekLabel,
        weeklyPerformanceRows: filteredWeeklyPerformanceRows,
        currentStatusRows: filteredCurrentStatusRows,
        actionItems: filteredActionItems,
        recipients: { to: splitRecipients(toValue), cc: splitRecipients(ccValue), bcc: [] },
        subject,
        note,
        requestedBy: "Current User",
      }),
      delivery: {
        sender: SYSTEM_SENDER,
        includeHtmlSummary: true,
        attachPdf: true,
      },
    }),
    [
      reportingScope,
      previousWeekLabel,
      filteredWeeklyPerformanceRows,
      filteredCurrentStatusRows,
      filteredActionItems,
      toValue,
      ccValue,
      subject,
      note,
    ],
  );
  const plainText = useMemo(() => buildPlainTextReport(payload), [payload]);

  if (!showEmailModal) return null;

  function validateRecipients() {
    const to = splitRecipients(toValue);
    const cc = splitRecipients(ccValue);
    if (!to.length) return "Enter at least one To recipient.";
    const invalid = [...to, ...cc].find((email) => !isValidEmail(email));
    return invalid ? `Invalid email address: ${invalid}` : "";
  }

  async function handleSend() {
    const validation = validateRecipients();
    if (validation) {
      setFeedback({ type: "error", message: validation });
      return;
    }
    setSending(true);
    setFeedback(null);
    try {
      const result = await sendActionItemsReport(payload);
      setFeedback({
        type: "success",
        message: result?.message || `Report sent from ${SYSTEM_SENDER} with the formatted summary and PDF attachment.`,
      });
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    } finally {
      setSending(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    setFeedback(null);
    try {
      const result = await downloadActionItemsReportPdf(payload);
      setFeedback({ type: "success", message: `PDF generated: ${result.filename}` });
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setFeedback({ type: "error", message: "Clipboard access was blocked by the browser." });
    }
  }

  const totalRequired = filteredCurrentStatusRows.reduce((sum, row) => sum + Number(row.requiredHiring || 0), 0);
  const totalAccepted = filteredCurrentStatusRows.reduce((sum, row) => sum + Number(row.accepted || 0), 0);
  const fillRate = totalRequired > 0 ? Math.round((totalAccepted / totalRequired) * 100) : 0;

  return (
    <div
      className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[9999] flex h-dvh items-center justify-center p-2 font-jakarta sm:p-4"
      onMouseDown={() => !sending && !downloading && closeEmailModal()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-action-report-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="sibs-modal-pop-in flex max-h-[92dvh] w-full max-w-5xl 2xl:max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5">
          <div className="flex min-w-0 items-start gap-2.5 2xl:gap-3">
            <div className="flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
              <Mail size={16} />
            </div>
            <div className="min-w-0">
              <h2 id="send-action-report-title" className="sibs-modal-title text-white">
                Send Recruitment Report by Email &amp; PDF
              </h2>
              <p className="sibs-modal-subtitle mt-0.5 text-white/75">
                System sender: {SYSTEM_SENDER}. The email includes an HTML summary and the complete PDF report.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeEmailModal}
            disabled={sending || downloading}
            className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            aria-label="Close email report modal"
          >
            <X size={18} />
          </button>
        </header>

        <div className="sibs-scrollbar grid min-h-0 flex-1 grid-cols-1 gap-4 2xl:gap-5 overflow-y-auto bg-[#F8FAFC] p-3.5 sm:p-4 2xl:p-5 lg:grid-cols-12 font-jakarta">
          <div className="space-y-3.5 2xl:space-y-4 lg:col-span-5">
            <section className="rounded-xl border border-[#E6ECF2] bg-white p-3.5 2xl:p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between border-b border-[#E6ECF2] pb-2.5">
                <h3 className="flex items-center gap-1.5 sibs-modal-section-title text-[#042C51]">
                  <Send size={13} className="text-[#FF5C28]" /> Email Dispatch Details
                </h3>
                <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[8.5px] 2xl:text-[9px] font-extrabold text-blue-700">{reportingScope.weekLabel}</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">System sender</label>
                  <input readOnly value={SYSTEM_SENDER} className="h-8.5 2xl:h-10 w-full rounded-xl border border-[#E6ECF2] bg-[#F2F4F7] px-3 2xl:px-3.5 sibs-text-xs font-semibold text-[#475467] outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">To recipients <span className="text-[#FF5C28]">*</span></label>
                  <input value={toValue} onChange={(event) => setToValue(event.target.value)} placeholder="hr@company.com; operations@company.com" className="h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-white px-3 2xl:px-3.5 sibs-text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10" />
                  <p className="mt-1 text-[8.5px] 2xl:text-[9px] font-semibold text-[#98A2B3]">Separate multiple recipients using commas or semicolons.</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">CC</label>
                  <input value={ccValue} onChange={(event) => setCcValue(event.target.value)} placeholder="manager@company.com" className="h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-white px-3 2xl:px-3.5 sibs-text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">Subject</label>
                  <input value={subject} onChange={(event) => setSubject(event.target.value)} className="h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-white px-3 2xl:px-3.5 sibs-text-xs font-semibold text-[#042C51] outline-none transition focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">Intro message</label>
                  <textarea rows={4} value={note} onChange={(event) => setNote(event.target.value)} className="w-full resize-none rounded-xl border border-[#D7DEE8] bg-white px-3 2xl:px-3.5 py-2.5 sibs-text-xs font-semibold leading-5 text-[#042C51] outline-none transition placeholder:text-[#98A2B3] focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10" />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[#E6ECF2] bg-white p-3.5 2xl:p-4 shadow-sm">
              <h3 className="mb-2.5 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">Report actions</h3>
              <button type="button" onClick={handleSend} disabled={sending || downloading} className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
                {sending ? <><RefreshCw size={14} className="animate-spin" /> Sending HTML + PDF...</> : <><Send size={14} /> Send System Email</>}
              </button>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button type="button" onClick={handleDownload} disabled={sending || downloading} className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-lg border border-[#D6DEE8] bg-white px-3 sibs-text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] disabled:opacity-60">
                  {downloading ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} className="text-[#FF5C28]" />} Download PDF
                </button>
                <button type="button" onClick={handleCopy} className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-lg border border-[#D6DEE8] bg-white px-3 sibs-text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28]">
                  {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />} {copied ? "Copied" : "Copy Text"}
                </button>
              </div>
              {feedback ? (
                <div className={`mt-3 rounded-lg border px-3 py-2 text-[10px] font-bold ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                  {feedback.message}
                </div>
              ) : null}
            </section>

            <div className="rounded-xl border border-blue-100 bg-[#E9F0FC] p-3 text-[10px] font-semibold leading-5 text-[#315779]">
              <strong className="block font-black uppercase text-[#042C51]">Active scope</strong>
              Cluster: {reportingScope.cluster} · Account: {reportingScope.account} · Role: {reportingScope.role} · Owner: {reportingScope.owner}
            </div>
          </div>

          <section className="flex min-h-[500px] flex-col overflow-hidden rounded-xl border border-[#E6ECF2] bg-white shadow-sm lg:col-span-7">
            <div className="flex items-center justify-between border-b border-[#E6ECF2] bg-[#F2F4F7] px-4 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-[#042C51]"><Eye size={14} className="text-[#FF5C28]" /> Report Live Preview</div>
              <div className="flex rounded-lg border border-[#D0D5DD] bg-white p-1">
                <button type="button" onClick={() => setTab("formatted")} className={`rounded-md px-2.5 py-1 text-[9px] font-black ${tab === "formatted" ? "bg-[#042C51] text-white" : "text-[#667085]"}`}>Formatted Email &amp; PDF</button>
                <button type="button" onClick={() => setTab("plain")} className={`rounded-md px-2.5 py-1 text-[9px] font-black ${tab === "plain" ? "bg-[#042C51] text-white" : "text-[#667085]"}`}>Plain Text Draft</button>
              </div>
            </div>

            <div className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
              {tab === "formatted" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl bg-[#042C51] p-4 text-white">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-[#FF5C28]">SiBS Talent Acquisition</p>
                      <h3 className="mt-1 text-sm font-black">Weekly Recruitment SLA &amp; Execution Report</h3>
                      <p className="mt-1 text-[9px] font-semibold text-slate-300">Confidential management report · {reportingScope.weekLabel}</p>
                    </div>
                    <span className="rounded bg-[#FF5C28] px-2 py-1 text-[9px] font-black">PDF attached</span>
                  </div>
                  {note ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[10px] font-semibold leading-4 text-amber-900"><strong className="block font-black">Note from sender</strong>{note}</div> : null}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      ["Active Roles", filteredCurrentStatusRows.length],
                      ["Required Hires", totalRequired],
                      ["Accepted / Filled", totalAccepted],
                      ["Fill Rate", `${fillRate}%`],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] p-2">
                        <p className="text-[7px] font-black uppercase text-[#98A2B3]">{label}</p>
                        <p className="mt-1 font-mono text-sm font-black text-[#042C51]">{value}</p>
                      </div>
                    ))}
                  </div>
                  <PreviewTable
                    title="Section A: Weekly Performance Snapshot"
                    headers={["Account & Role", "Pipeline", "Sourced", "Screened", "Interview", "Offers", "Accepted", "Hired"]}
                    rows={filteredWeeklyPerformanceRows.map((row) => [
                      <span><strong>{row.account}</strong><br />{row.role}</span>,
                      row.hasHistoricalData ? row.startingPipeline ?? "—" : "No data",
                      row.hasHistoricalData ? row.newSourced ?? "—" : "—",
                      row.hasHistoricalData ? row.screened ?? "—" : "—",
                      row.hasHistoricalData ? row.interviewed ?? "—" : "—",
                      row.hasHistoricalData ? row.offers ?? "—" : "—",
                      row.hasHistoricalData ? row.accepted ?? "—" : "—",
                      row.hasHistoricalData ? row.hired ?? "—" : "—",
                    ])}
                    emptyMessage="No weekly performance data in this scope."
                  />
                  <PreviewTable
                    title="Section B: Current Account Hiring Status"
                    headers={["Account & Role", "Owner", "Target", "Accepted", "Fill Rate", "Status / Coverage"]}
                    rows={filteredCurrentStatusRows.map((row) => [
                      <span><strong>{row.account}</strong><br />{row.role}</span>,
                      row.taOwner,
                      row.requiredHiring,
                      row.accepted,
                      `${row.fillRate}%`,
                      <span className={row.atRisk ? "font-black text-rose-700" : "font-black text-emerald-700"}>{row.atRisk ? `AT RISK · ${row.missingAction ? "Missing Action" : "Covered"}` : "ON TRACK"}</span>,
                    ])}
                    emptyMessage="No current status data in this scope."
                  />
                  <PreviewTable
                    title="Section C: Action Items - JIT Delivery Focus"
                    headers={["ID", "Action Item", "Role & Account", "Owner", "Deadline", "Status"]}
                    rows={filteredActionItems.map((item) => [
                      item.actionId,
                      item.actionItem,
                      <span><strong>{item.account}</strong><br />{item.roleTitle || item.roleAccount}</span>,
                      item.owner,
                      item.deadline,
                      `${item.status} · ${item.riskLevel}`,
                    ])}
                    emptyMessage="No action items in this scope."
                  />
                </div>
              ) : (
                <pre className="whitespace-pre-wrap rounded-xl bg-slate-900 p-4 font-mono text-[10px] leading-5 text-emerald-300">{plainText}</pre>
              )}
            </div>
          </section>
        </div>

        <footer className="flex shrink-0 flex-col gap-2 border-t border-[#E6ECF2] bg-white px-5 py-3 2xl:py-3.5 text-[10px] font-semibold text-[#667085] sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">{filteredWeeklyPerformanceRows.length} weekly rows · {filteredCurrentStatusRows.length} status rows · {filteredActionItems.length} action items</span>
          <button type="button" onClick={closeEmailModal} disabled={sending || downloading} className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] disabled:opacity-50">Close</button>
        </footer>
      </div>
    </div>
  );
}
