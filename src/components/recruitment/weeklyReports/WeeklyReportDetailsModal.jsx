import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  FileText,
  ListChecks,
  Mail,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  formatDate,
  getRoleStatusClass,
  getStatusClass,
} from "../../../lib/utils/weeklyReports/weeklyReportsHelpers.js";
import { buildEmailPreview } from "../../../lib/utils/weeklyReports/weeklyReportsGenerator.js";
import WeeklyReportEmailPreview from "./WeeklyReportEmailPreview.jsx";

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDisplayValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  return value;
}

function getPercentage(value, maximum) {
  const safeValue = toNumber(value);
  const safeMaximum = Math.max(toNumber(maximum), 1);

  return Math.min(
    100,
    Math.max(0, Math.round((safeValue / safeMaximum) * 100)),
  );
}

function KpiProgressRow({ label, value, maximum }) {
  const percentage = getPercentage(value, maximum);

  return (
    <div className="py-2.5 first:pt-0 last:pb-0">
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-[#344054]">{label}</p>
        <p className="shrink-0 text-sm font-extrabold text-sibs-primary-1">
          {toNumber(value)}
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[#EAF0F5]">
        <div
          className="h-full rounded-full bg-sibs-primary-1 transition-[width] duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function InformationRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#E8EDF2] py-3 last:border-b-0">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.05em] text-sibs-tertiary-5">
        {label}
      </p>

      <p className="max-w-[64%] break-words text-right text-sm font-bold text-[#344054]">
        {getDisplayValue(value)}
      </p>
    </div>
  );
}

function FollowUpList({ items, emptyText, tone }) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  const isDanger = tone === "red";

  if (safeItems.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#D7E0E9] bg-[#F8FAFC] px-4 py-5 text-center text-xs font-semibold text-sibs-tertiary-5">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {safeItems.map((item, index) => (
        <div
          key={`${tone}-${index}`}
          className="flex items-start gap-3 rounded-xl border border-[#E3EAF1] bg-[#F8FAFC] px-3.5 py-3"
        >
          <span
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
              isDanger ? "bg-red-500" : "bg-amber-500"
            }`}
          />

          <p className="text-xs font-semibold leading-5 text-[#344054]">
            {item}
          </p>
        </div>
      ))}
    </div>
  );
}

function RoleSummary({ roles }) {
  const safeRoles = Array.isArray(roles) ? roles : [];

  return (
    <section className="h-full rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-[#101828]">
            Role / Account Summary
          </h3>

          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
            Headcount progress and current delivery status.
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2F6FA] text-sibs-primary-1">
          <BriefcaseBusiness size={18} />
        </div>
      </div>

      <div className="space-y-2.5">
        {safeRoles.length > 0 ? (
          safeRoles.map((role, index) => (
            <article
              key={`${role.role}-${role.account}-${index}`}
              className="rounded-xl border border-[#E3EAF1] bg-[#F8FAFC] p-3.5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#101828]">
                    {role.role || "Not assigned"}
                  </p>

                  <p className="mt-0.5 truncate text-[11px] font-semibold text-sibs-tertiary-5">
                    {role.account || "Not assigned"} · Owner:{" "}
                    {role.owner || "Unassigned"}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#DCE5EE] bg-white px-2.5 py-1 text-[10px] font-extrabold text-[#344054]">
                    {toNumber(role.filled)}/{toNumber(role.requirement)} filled
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getRoleStatusClass(
                      role.status,
                    )}`}
                  >
                    {role.status || "On Track"}
                  </span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-[#D7E0E9] bg-[#F8FAFC] px-4 py-8 text-center text-sm font-semibold text-sibs-tertiary-5">
            No role or account records are available.
          </div>
        )}
      </div>
    </section>
  );
}

function EmailPreviewAction({ report, onOpen }) {
  return (
    <section className="h-full rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="flex h-full flex-col">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#101828]">Email Preview</h3>

            <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
              Review the generated email before distribution.
            </p>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Mail size={18} />
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between gap-4 rounded-xl border border-[#E3EAF1] bg-[#F8FAFC] p-3.5 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.05em] text-sibs-tertiary-5">
              Email subject
            </p>

            <p className="mt-1 break-words text-sm font-bold text-[#101828]">
              Weekly Hiring Report — {report.weekLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpen}
            className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-bold text-sibs-primary-1 transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98] sm:w-auto"
          >
            <Eye size={15} />
            View Email
          </button>
        </div>
      </div>
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

  const maxMovement = useMemo(() => {
    if (!report) return 1;

    return Math.max(
      toNumber(report.sourced),
      toNumber(report.screened),
      toNumber(report.interviewed),
      toNumber(report.offered),
      toNumber(report.accepted),
      toNumber(report.hired),
      toNumber(report.dropOffs),
      1,
    );
  }, [report]);

  if (!open || !report) return null;

  const actionItems = Array.isArray(report.actionItems)
    ? report.actionItems.filter(
        (item) =>
          item && item !== "No open action items recorded for the current week.",
      )
    : [];

  const missingData = Array.isArray(report.missingData)
    ? report.missingData.filter(
        (item) => item && item !== "No missing data recorded.",
      )
    : [];

  const movementItems = [
    { label: "Sourced", value: report.sourced },
    { label: "Screened", value: report.screened },
    { label: "Interviewed", value: report.interviewed },
    { label: "Offered", value: report.offered },
    { label: "Accepted", value: report.accepted },
    { label: "Hired", value: report.hired },
    { label: "Drop-offs", value: report.dropOffs },
  ];

  function handleExport() {
    try {
      const blob = new Blob([emailPreview], {
        type: "text/plain;charset=utf-8",
      });
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

  function handleMarkAsSent() {
    if (typeof onMarkSent === "function") {
      onMarkSent(report);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 p-3 sm:p-5"
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
          <header className="shrink-0 border-b border-[#E6ECF2] bg-white px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-extrabold ${getStatusClass(
                      report.status,
                    )}`}
                  >
                    {report.status}
                  </span>

                  {report.generatedFromModules ? (
                    <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-extrabold text-sibs-primary-1">
                      Generated from Recruitment Data
                    </span>
                  ) : null}
                </div>

                <h2
                  id="weekly-report-modal-title"
                  className="mt-3 text-xl font-extrabold text-sibs-primary-1"
                >
                  Weekly Report Preview
                </h2>

                <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                  Review the hiring summary, pipeline movement, follow-ups, and
                  email before distribution.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-[#F1F5F9] hover:text-gray-700 active:scale-[0.98]"
                aria-label="Close weekly report preview"
              >
                <X size={20} />
              </button>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto bg-[#F5F7FA] p-4 sm:p-5 sibs-scrollbar">
            <div className="space-y-4">
              <section className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-sibs-primary-1">
                      <span>{report.weekLabel}</span>
                      <span className="text-sibs-tertiary-8">•</span>
                      <span>{report.dateRange}</span>
                      <span className="text-sibs-tertiary-8">•</span>
                      <span>{report.reportId}</span>
                    </div>

                    <p className="mt-3 max-w-3xl text-sm leading-6 text-[#344054]">
                      {report.summary ||
                        "No weekly report summary is available."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-[#DCE5EE] bg-[#F8FAFC] px-3 py-1 text-[11px] font-bold text-[#344054]">
                        {toNumber(report.totalOpenRoles)} Open Roles
                      </span>

                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
                        {toNumber(report.atRiskRoles)} At Risk
                      </span>

                      <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-bold text-red-700">
                        {toNumber(report.delayedRoles)} Delayed
                      </span>
                    </div>
                  </div>

                  <div className="w-full shrink-0 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 sm:w-[170px]">
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70">
                      Filled Headcount
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-sibs-primary-1">
                      {toNumber(report.totalFilled)}/
                      {toNumber(report.totalRequirement)}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-sibs-primary-1/70">
                      Current versus requirement
                    </p>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-stretch">
                <div className="h-full">
                  <section className="h-full rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-[#101828]">
                          Weekly KPI Snapshot
                        </h3>

                        <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                          Candidate movement from sourcing through hiring.
                        </p>
                      </div>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2F6FA] text-sibs-primary-1">
                        <BarChart3 size={18} />
                      </div>
                    </div>

                    <div className="divide-y divide-[#EEF2F6]">
                      {movementItems.map((item) => (
                        <KpiProgressRow
                          key={item.label}
                          label={item.label}
                          value={item.value}
                          maximum={maxMovement}
                        />
                      ))}
                    </div>
                  </section>
                </div>

                <div className="h-full">
                  <section className="h-full rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-[#101828]">
                          Report Summary
                        </h3>

                        <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                          Generation and recruitment signal details.
                        </p>
                      </div>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2F6FA] text-sibs-primary-1">
                        <FileText size={18} />
                      </div>
                    </div>

                    <InformationRow label="Report ID" value={report.reportId} />
                    <InformationRow label="Status" value={report.status} />
                    <InformationRow
                      label="Generated Date"
                      value={formatDate(report.generatedDate)}
                    />
                    <InformationRow
                      label="Generated By"
                      value={report.generatedBy || "System"}
                    />
                    <InformationRow
                      label="Action Items"
                      value={toNumber(report.actionItemsCount)}
                    />
                    <InformationRow
                      label="Missing Data"
                      value={toNumber(report.missingDataCount)}
                    />
                    <InformationRow
                      label="Public Applicants"
                      value={toNumber(report.publicApplicants)}
                    />
                    <InformationRow
                      label="Pending Offers"
                      value={toNumber(report.pendingOffers)}
                    />
                    <InformationRow
                      label="Pending Onboarding"
                      value={toNumber(report.pendingOnboarding)}
                    />
                  </section>

                  
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-stretch">
                <RoleSummary roles={report.roles} />

                <EmailPreviewAction
                  report={report}
                  onOpen={() => setEmailPreviewOpen(true)}
                />
              </div>

              <section className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sibs-primary-1 shadow-sm">
                    <ShieldCheck size={18} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-sibs-primary-1">
                      Report Generation Rule
                    </h3>

                    <p className="mt-1 text-xs font-semibold leading-5 text-sibs-primary-1/75">
                      This weekly report is generated from Hiring Needs, Weekly
                      Hiring Plan, Candidate Pipeline, Offers, Onboarding,
                      Missing Data, and Action Items.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </main>

          <footer className="shrink-0 border-t border-[#E6ECF2] bg-white px-5 py-3 sm:px-6">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] active:scale-[0.98]"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleExport}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
              >
                <Download size={16} />
                Export
              </button>

              <button
                type="button"
                onClick={handleMarkAsSent}
                disabled={report.status === "Sent"}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {report.status === "Sent" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Send size={16} />
                )}
                {report.status === "Sent" ? "Already Sent" : "Mark as Sent"}
              </button>
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
