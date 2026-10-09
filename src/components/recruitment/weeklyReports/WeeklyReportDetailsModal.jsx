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
  Target,
  Users,
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

function SectionTitle({ icon: Icon, children, helper = "", iconColor = "text-sibs-orange" }) {
  return (
    <div className="mb-2 flex items-start justify-between gap-2.5 border-b border-sibs-border pb-1.5 font-jakarta">
      <div className="min-w-0">
        <h3 className="flex items-center gap-1.5 sibs-modal-section-title text-sibs-navy">
          <span className="flex h-5.5 w-5.5 2xl:h-6.5 2xl:w-6.5 shrink-0 items-center justify-center rounded-[10px] 2xl:rounded-[10px] bg-sibs-surface-subtle text-sibs-navy shadow-2xs">
            <Icon size={12} className={`shrink-0 ${iconColor}`} />
          </span>
          {children}
        </h3>
        {helper ? (
          <p className="sibs-modal-section-subtitle mt-0.5 text-sibs-muted">
            {helper}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function MetricCard({ label, value, maximum, tone = "navy" }) {
  const pct = safePercent(value, maximum);
  const toneMap = {
    navy: "text-sibs-navy bg-blue-600",
    indigo: "text-indigo-800 bg-indigo-600",
    purple: "text-purple-800 bg-purple-600",
    teal: "text-teal-800 bg-teal-600",
    cyan: "text-cyan-800 bg-cyan-600",
    green: "text-emerald-800 bg-emerald-600",
    red: "text-red-800 bg-red-600",
  };
  const [textClass, barClass] = (toneMap[tone] || toneMap.navy).split(" ");

  return (
    <div className="rounded-[10px] border border-sibs-border bg-sibs-surface p-2 2xl:p-2.5 font-jakarta">
      <p className="text-[8.5px] 2xl:text-[9.5px] font-bold uppercase tracking-wider text-sibs-muted">{label}</p>
      <p className={`mt-0.5 text-sm 2xl:text-base font-extrabold tabular-nums ${textClass}`}>{toNumber(value)}</p>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-sibs-border">
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
    <article className="rounded-[10px] border border-sibs-border bg-sibs-surface p-2.5 2xl:p-3 font-jakarta">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <p className="text-[11px] 2xl:text-xs font-extrabold text-sibs-navy">
            {role?.role || `Role ${index + 1}`}
          </p>
          <p className="mt-0.5 text-[9px] 2xl:text-[10px] font-semibold text-sibs-muted">
            {role?.account || "Not assigned"}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] 2xl:text-[9px] font-extrabold uppercase ${getRoleStatusClass(role?.status)}`}>
          {role?.status || "On Track"}
        </span>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-sibs-border pt-2">
        <p className="text-[9px] 2xl:text-[10px] font-semibold text-sibs-muted">
          Owner: <strong className="text-sibs-muted">{role?.owner || "Unassigned"}</strong>
        </p>
        <p className="font-mono text-[9px] 2xl:text-[10px] font-extrabold text-sibs-navy">
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
    <section className="space-y-1.5 font-jakarta">
      <SectionTitle
        icon={Icon}
        iconColor={isDanger ? "text-red-600" : "text-sibs-orange"}
      >
        {title}
      </SectionTitle>

      {safeItems.length > 0 ? (
        <div className={`space-y-1 rounded-[10px] border p-2.5 2xl:p-3 ${isDanger ? "border-red-200 bg-red-50/70" : "border-orange-100 bg-orange-50/40"}`}>
          {safeItems.map((item, index) => (
            <div key={`${title}-${index}`} className="flex items-start gap-1.5 text-[11px] 2xl:text-xs font-semibold leading-4.5 text-sibs-muted">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${isDanger ? "bg-red-500" : "bg-sibs-orange"}`} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[10px] border border-dashed border-sibs-border bg-sibs-surface px-3.5 py-3 text-center text-[11px] 2xl:text-xs font-semibold text-sibs-muted">
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
        className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[9999] flex h-dvh items-center justify-center p-2 font-jakarta sm:p-4"
        onMouseDown={onClose}
        role="presentation"
      >
        <div
          className="sibs-modal-pop-in flex max-h-[90dvh] w-full max-w-6xl flex-col overflow-hidden rounded-[14px] bg-white shadow-2xl font-jakarta"
          onMouseDown={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="weekly-report-modal-title"
        >
          <header className="shrink-0 bg-sibs-navy rounded-t-[14px] px-5 py-3 text-white sm:px-6 2xl:py-3.5 font-jakarta">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 2xl:gap-2">
                  <span className="rounded-[10px] bg-sibs-orange px-2 py-0.5 2xl:px-2.5 2xl:py-1 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-white">
                    Weekly Performance Report Details
                  </span>
                  <span className={`rounded-[10px] border px-2 py-0.5 2xl:px-2.5 2xl:py-1 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase ${getReportStatusClass(report.status)}`}>
                    {report.status}
                  </span>
                  {report.generatedFromModules ? (
                    <span className="rounded-[10px] border border-blue-400/20 bg-white/10 px-2 py-0.5 2xl:px-2.5 2xl:py-1 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase text-blue-100">
                      Multi-Module Signal Aggregated
                    </span>
                  ) : null}
                </div>

                <h2 id="weekly-report-modal-title" className="sibs-modal-title mt-1.5 truncate text-white">
                  {report.weekLabel}
                </h2>
                <p className="sibs-modal-subtitle mt-0.5 truncate text-white/75">
                  Report ID: <strong className="font-mono text-white">{report.reportId}</strong>
                  <span className="mx-2 text-white/40">|</span>
                  Date Range: {report.dateRange}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="sibs-modal-close-btn"
                aria-label="Close weekly report details"
                className="sibs-modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto bg-sibs-surface p-3 sm:p-3.5 2xl:p-5 sibs-scrollbar font-jakarta">
            <div className="space-y-3 2xl:space-y-4">
              <div className="grid grid-cols-1 gap-3 2xl:gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
                <section className="flex flex-col justify-between rounded-[10px] border border-sibs-border bg-white p-3 2xl:p-4 shadow-sm">
                  <div>
                    <SectionTitle icon={FileText} helper="Executive highlights and key achievements.">
                      Executive Narrative Summary
                    </SectionTitle>
                    <p className="text-[11px] font-medium leading-4.5 text-sibs-muted 2xl:text-xs 2xl:leading-5">
                      {report.summary || "No weekly report summary is available."}
                    </p>
                  </div>
                </section>

                <section className="flex flex-col justify-between rounded-[10px] border border-orange-200 bg-sibs-cream-light p-3 2xl:p-4 shadow-sm">
                  <div>
                    <SectionTitle icon={Target} helper="Total filled vs. target requirement.">
                      Headcount Target vs. Actual
                    </SectionTitle>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-sibs-navy 2xl:text-2xl">{filled}</span>
                      <span className="text-sm font-bold text-sibs-faint 2xl:text-base">/</span>
                      <span className="text-sm font-extrabold text-sibs-muted 2xl:text-base">{requirement}</span>
                      <span className="ml-1 text-[10px] font-extrabold text-sibs-orange 2xl:text-xs">({fulfillment}% Filled)</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-orange-100">
                      <div className="h-full rounded-full bg-sibs-orange" style={{ width: `${Math.max(0, Math.min(100, fulfillment))}%` }} />
                    </div>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1 border-t border-orange-200/70 pt-2 2xl:gap-1.5">
                    <span className="rounded-[10px] bg-blue-50 px-1.5 py-0.5 text-[8.5px] font-extrabold text-sibs-navy 2xl:text-[9.5px]">{toNumber(report.totalOpenRoles)} Open</span>
                    <span className="rounded-[10px] bg-amber-100 px-1.5 py-0.5 text-[8.5px] font-extrabold text-amber-800 2xl:text-[9.5px]">{toNumber(report.atRiskRoles)} At Risk</span>
                    <span className="rounded-[10px] bg-red-100 px-1.5 py-0.5 text-[8.5px] font-extrabold text-red-800 2xl:text-[9.5px]">{toNumber(report.delayedRoles)} Delayed</span>
                  </div>
                </section>
              </div>

              <section className="rounded-[10px] border border-sibs-border bg-white p-3 2xl:p-4 shadow-sm">
                <SectionTitle
                  icon={BarChart3}
                  iconColor="text-emerald-600"
                  helper="Candidate movement from sourcing through hiring."
                >
                  Weekly Funnel Conversion KPI Snapshot
                </SectionTitle>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:gap-2.5">
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

              <section className="rounded-[10px] border border-sibs-border bg-white p-3 2xl:p-4 shadow-sm">
                <SectionTitle icon={BriefcaseBusiness}>
                  Role / Account Requirement Breakdown
                </SectionTitle>

                {roles.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 2xl:gap-2.5">
                    {roles.map((role, index) => (
                      <RoleCard key={role.id || `${role.role}-${role.account}-${index}`} role={role} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="sibs-empty-panel">No role or account records are available.</div>
                )}
              </section>

              <div className="grid grid-cols-1 gap-3 2xl:gap-4 lg:grid-cols-2">
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

              <section className="rounded-[10px] border border-sibs-border bg-sibs-surface p-2.5 2xl:p-3 text-[9px] 2xl:text-[10px] font-semibold text-sibs-muted">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>Generated By: <strong className="text-sibs-muted">{report.generatedBy || "System"}</strong></span>
                  <span>Generated Date: <strong className="text-sibs-muted">{formatDate(report.generatedDate)}</strong></span>
                </div>
                <div className="mt-1.5 border-t border-sibs-border pt-1.5">
                  Current Signals: {toNumber(report.publicApplicants)} Public Applicants · {toNumber(report.talentPoolCount)} Talent Pool · {toNumber(report.pendingOffers)} Pending Offers · {toNumber(report.pendingOnboarding)} Pending Onboarding
                </div>
              </section>
            </div>
          </main>

          <footer className="shrink-0 border-t border-sibs-border bg-white rounded-b-[14px] px-3.5 py-2 sm:px-4 2xl:px-6 2xl:py-3 font-jakarta">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1.5 sm:flex-row">
                <button
                  type="button"
                  onClick={handleExport}
                  className="inline-flex h-8 2xl:h-9.5 items-center justify-center gap-1.5 rounded-[10px] border border-sibs-border bg-white px-3 2xl:px-4 text-[11px] 2xl:text-xs font-extrabold text-sibs-navy transition hover:bg-sibs-surface active:scale-[0.98]"
                >
                  <Download size={14} />
                  Export Report (.txt)
                </button>

                <button
                  type="button"
                  onClick={() => setEmailPreviewOpen(true)}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-[10px] border border-blue-200 bg-sibs-surface-subtle px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-navy transition hover:bg-blue-100 active:scale-[0.98]"
                >
                  <Mail size={14} className="text-sibs-orange" />
                  View Formatted Email Digest
                </button>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange active:scale-[0.98]"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => typeof onMarkSent === "function" && onMarkSent(report)}
                  disabled={report.status === "Sent"}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-[10px] bg-emerald-600 px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {report.status === "Sent" ? <CheckCircle2 size={14} /> : <Send size={14} />}
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
