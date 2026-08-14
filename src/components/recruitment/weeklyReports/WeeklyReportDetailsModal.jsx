import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  CheckSquare,
  Download,
  FileText,
  Mail,
  Send,
  X,
} from "lucide-react";
import {
  formatDate,
  getRoleStatusClass,
} from "../../../lib/utils/weeklyReports/weeklyReportsHelpers.js";
import { buildEmailPreview } from "../../../lib/utils/weeklyReports/weeklyReportsGenerator.js";
import WeeklyReportEmailPreview from "./WeeklyReportEmailPreview.jsx";


function getReportStatusClass(status) {
  if (status === "Generated") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "Sent") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Archived") return "border-slate-300 bg-slate-100 text-slate-600";
  return "border-white/20 bg-white/10 text-white";
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safePercent(value, maximum) {
  const base = Math.max(toNumber(maximum), 1);
  return Math.max(0, Math.min(100, Math.round((toNumber(value) / base) * 100)));
}

function MetricCard({ label, value, maximum, tone = "navy" }) {
  const pct = safePercent(value, maximum);
  const toneMap = {
    navy: "text-[#042C51] bg-blue-600",
    indigo: "text-indigo-800 bg-indigo-600",
    purple: "text-purple-800 bg-purple-600",
    teal: "text-teal-800 bg-teal-600",
    cyan: "text-cyan-800 bg-cyan-600",
    green: "text-emerald-800 bg-emerald-600",
    red: "text-red-800 bg-red-600",
  };
  const [textClass, barClass] = (toneMap[tone] || toneMap.navy).split(" ");

  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3">
      <p className="text-[9px] font-extrabold uppercase tracking-wide text-[#667085]">{label}</p>
      <p className={`mt-1 text-lg font-extrabold tabular-nums ${textClass}`}>{toNumber(value)}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E6ECF2]">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RoleCard({ role, index }) {
  const requirement = toNumber(role?.requirement);
  const filled = toNumber(role?.filled);
  const fulfillment = requirement > 0 ? Math.round((filled / requirement) * 100) : 0;

  return (
    <article className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-sibs-primary-1">
            {role?.role || `Role ${index + 1}`}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-[#667085]">
            {role?.account || "Not assigned"}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase ${getRoleStatusClass(role?.status)}`}>
          {role?.status || "On Track"}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#E6ECF2] pt-2.5">
        <p className="text-[10px] font-semibold text-[#667085]">
          Owner: <strong className="text-[#344054]">{role?.owner || "Unassigned"}</strong>
        </p>
        <p className="font-mono text-[10px] font-extrabold text-sibs-primary-1">
          {filled}/{requirement} HC · {fulfillment}%
        </p>
      </div>
    </article>
  );
}

function FollowUpBlock({ title, icon: Icon, items, tone = "orange", emptyText }) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  const isDanger = tone === "red";

  return (
    <section className="space-y-2">
      <h4 className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide ${isDanger ? "text-red-700" : "text-sibs-primary-1"}`}>
        <Icon size={14} className={isDanger ? "text-red-600" : "text-[#FF5C28]"} />
        {title}
      </h4>

      {safeItems.length > 0 ? (
        <div className={`space-y-1.5 rounded-xl border p-3 ${isDanger ? "border-red-200 bg-red-50/70" : "border-orange-100 bg-orange-50/40"}`}>
          {safeItems.map((item, index) => (
            <div key={`${title}-${index}`} className="flex items-start gap-2 text-xs font-medium leading-5 text-[#344054]">
              <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${isDanger ? "bg-red-500" : "bg-[#FF5C28]"}`} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#D7E0E9] bg-[#F8FAFC] px-4 py-4 text-center text-xs font-semibold text-[#667085]">
          {emptyText}
        </div>
      )}
    </section>
  );
}

export default function WeeklyReportDetailsModal({
  open,
  report,
  onClose,
  onMarkSent,
}) {
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmailPreviewOpen(false);
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key !== "Escape") return;

      if (emailPreviewOpen) {
        setEmailPreviewOpen(false);
        return;
      }

      onClose();
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, emailPreviewOpen, onClose]);

  const emailPreview = useMemo(
    () => (report ? buildEmailPreview(report) : ""),
    [report],
  );

  if (!open || !report) return null;

  const requirement = toNumber(report.totalRequirement);
  const filled = toNumber(report.totalFilled);
  const fulfillment = requirement > 0 ? Math.round((filled / requirement) * 100) : 0;
  const maxMovement = Math.max(
    toNumber(report.sourced),
    toNumber(report.screened),
    toNumber(report.interviewed),
    toNumber(report.offered),
    toNumber(report.accepted),
    toNumber(report.hired),
    1,
  );

  const actionItems = Array.isArray(report.actionItems)
    ? report.actionItems.filter((item) => item && item !== "No open action items recorded for the current week.")
    : [];

  const missingData = Array.isArray(report.missingData)
    ? report.missingData.filter((item) => item && item !== "No missing data recorded.")
    : [];

  const roles = Array.isArray(report.roles) ? report.roles : [];

  function handleExport() {
    try {
      const blob = new Blob([emailPreview], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const safeReportId = String(report.reportId || "weekly-report")
        .trim()
        .replace(/[^a-zA-Z0-9-_]+/g, "-");

      anchor.href = url;
      anchor.download = `${safeReportId}.txt`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Weekly report export failed:", error);
      alert("Failed to export the weekly report.");
    }
  }

  return (
    <>
      <div
        className="sibs-modal-blur fixed inset-0 z-[9999] flex h-dvh items-center justify-center p-3 sm:p-5"
        onMouseDown={onClose}
        role="presentation"
      >
        <div
          className="sibs-modal-pop-in flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          onMouseDown={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="weekly-report-modal-title"
        >
          <header className="shrink-0 bg-[#042C51] px-5 py-4 text-white sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[#FF5C28] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-white">
                    Weekly Performance Report Details
                  </span>
                  <span className={`rounded-md border px-2.5 py-1 text-[9px] font-extrabold uppercase ${getReportStatusClass(report.status)}`}>
                    {report.status}
                  </span>
                  {report.generatedFromModules ? (
                    <span className="rounded-md border border-blue-400/20 bg-white/10 px-2.5 py-1 text-[9px] font-extrabold uppercase text-blue-100">
                      Multi-Module Signal Aggregated
                    </span>
                  ) : null}
                </div>

                <h2 id="weekly-report-modal-title" className="mt-2.5 text-lg font-extrabold sm:text-xl">
                  {report.weekLabel}
                </h2>
                <p className="mt-1 text-xs font-semibold text-blue-200">
                  Report ID: <strong className="font-mono text-white">{report.reportId}</strong>
                  <span className="mx-2 text-blue-500">|</span>
                  Date Range: {report.dateRange}
                </p>
              </div>

              <button type="button" onClick={onClose} className="sibs-modal-close-btn" aria-label="Close weekly report details">
                <X size={19} />
              </button>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto bg-[#F7F9FC] p-4 sm:p-5 sibs-scrollbar">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_330px]">
                <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
                  <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                    <FileText size={14} className="text-[#FF5C28]" />
                    Executive Narrative Summary
                  </p>
                  <p className="mt-2 text-xs font-medium leading-5 text-[#344054] sm:text-sm sm:leading-6">
                    {report.summary || "No weekly report summary is available."}
                  </p>
                </section>

                <section className="rounded-xl border border-orange-200 bg-[#FFF7F3] p-4 shadow-sm">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#FF5C28]">Headcount Target vs. Actual</p>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-sibs-primary-1">{filled}</span>
                    <span className="text-lg font-bold text-[#98A2B3]">/</span>
                    <span className="text-lg font-extrabold text-[#667085]">{requirement}</span>
                    <span className="ml-1 text-xs font-extrabold text-[#FF5C28]">({fulfillment}% Filled)</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-orange-100">
                    <div className="h-full rounded-full bg-[#FF5C28]" style={{ width: `${Math.max(0, Math.min(100, fulfillment))}%` }} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-orange-200/70 pt-3">
                    <span className="rounded-md bg-blue-50 px-2 py-1 text-[9px] font-extrabold text-sibs-primary-1">{toNumber(report.totalOpenRoles)} Open</span>
                    <span className="rounded-md bg-amber-100 px-2 py-1 text-[9px] font-extrabold text-amber-800">{toNumber(report.atRiskRoles)} At Risk</span>
                    <span className="rounded-md bg-red-100 px-2 py-1 text-[9px] font-extrabold text-red-800">{toNumber(report.delayedRoles)} Delayed</span>
                  </div>
                </section>
              </div>

              <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                      <BarChart3 size={15} className="text-emerald-600" />
                      Weekly Funnel Conversion KPI Snapshot
                    </h3>
                    <p className="mt-1 text-[10px] font-semibold text-[#667085]">Candidate movement from sourcing through hiring.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <MetricCard label="Sourced Leads" value={report.sourced} maximum={maxMovement} tone="navy" />
                  <MetricCard label="Initial Screened" value={report.screened} maximum={maxMovement} tone="indigo" />
                  <MetricCard label="Interviewed" value={report.interviewed} maximum={maxMovement} tone="purple" />
                  <MetricCard label="Offers Made" value={report.offered} maximum={maxMovement} tone="cyan" />
                  <MetricCard label="Offers Accepted" value={report.accepted} maximum={maxMovement} tone="teal" />
                  <MetricCard label="Hired Candidates" value={report.hired} maximum={maxMovement} tone="green" />
                  <MetricCard label="Drop-offs" value={report.dropOffs} maximum={maxMovement} tone="red" />
                  <MetricCard label="Pending Onboarding" value={report.pendingOnboarding} maximum={Math.max(toNumber(report.pendingOnboarding), 1)} tone="navy" />
                </div>
              </section>

              <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  <BriefcaseBusiness size={15} className="text-[#FF5C28]" />
                  Role / Account Requirement Breakdown
                </h3>

                {roles.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                    {roles.map((role, index) => (
                      <RoleCard key={role.id || `${role.role}-${role.account}-${index}`} role={role} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="sibs-empty-panel">No role or account records are available.</div>
                )}
              </section>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <FollowUpBlock
                  title="Action Items & Active Escalations"
                  icon={CheckSquare}
                  items={actionItems}
                  emptyText="No active action items logged for this report period."
                  tone="orange"
                />

                <FollowUpBlock
                  title="Missing Data & Delayed Role Explanations"
                  icon={AlertTriangle}
                  items={missingData}
                  emptyText="All report inputs are complete with no missing-data alerts."
                  tone="red"
                />
              </div>

              <section className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3.5 text-[10px] font-semibold text-[#667085]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>Generated By: <strong className="text-[#344054]">{report.generatedBy || "System"}</strong></span>
                  <span>Generated Date: <strong className="text-[#344054]">{formatDate(report.generatedDate)}</strong></span>
                </div>
                <div className="mt-2 border-t border-[#E6ECF2] pt-2">
                  Current Signals: {toNumber(report.publicApplicants)} Public Applicants · {toNumber(report.talentPoolCount)} Talent Pool · {toNumber(report.pendingOffers)} Pending Offers · {toNumber(report.pendingOnboarding)} Pending Onboarding
                </div>
              </section>
            </div>
          </main>

          <footer className="shrink-0 border-t border-[#E6ECF2] bg-white px-5 py-3 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleExport}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-sibs-primary-1 transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
                >
                  <Download size={15} />
                  Export Report (.txt)
                </button>

                <button
                  type="button"
                  onClick={() => setEmailPreviewOpen(true)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-[#E9F0FC] px-4 text-xs font-extrabold text-sibs-primary-1 transition hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm active:scale-[0.98]"
                >
                  <Mail size={15} className="text-[#FF5C28]" />
                  View Formatted Email Digest
                </button>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-xs font-extrabold text-[#667085] transition hover:bg-[#F8FAFC] active:scale-[0.98]"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => typeof onMarkSent === "function" && onMarkSent(report)}
                  disabled={report.status === "Sent"}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {report.status === "Sent" ? <CheckCircle2 size={15} /> : <Send size={15} />}
                  {report.status === "Sent" ? "Report Status: SENT" : "Mark as Sent"}
                </button>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <WeeklyReportEmailPreview
        open={emailPreviewOpen}
        emailPreview={emailPreview}
        report={report}
        onClose={() => setEmailPreviewOpen(false)}
        onExport={handleExport}
      />
    </>
  );
}
