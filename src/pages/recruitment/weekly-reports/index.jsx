import React, { useMemo, useState } from "react";
import Header from "../../../components/layout/Header";
import {
  Mail,
  Search,
  Eye,
  Copy,
  Download,
  Send,
  X,
  CalendarDays,
  FileText,
  FileClock,
  BarChart3,
  ListChecks,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  ClipboardList,
} from "lucide-react";

const weeklyReports = [
  {
    id: 1,
    reportId: "WR-2026-W18",
    weekLabel: "Week 18, 2026",
    dateRange: "Apr 29 - May 5, 2026",
    status: "Generated",
    generatedDate: "2026-05-06",
    generatedBy: "System",
    totalOpenRoles: 5,
    totalRequirement: 35,
    totalFilled: 20,
    atRiskRoles: 2,
    delayedRoles: 2,
    dropOffs: 32,
    sourced: 181,
    screened: 103,
    interviewed: 49,
    offered: 21,
    accepted: 15,
    hired: 20,
    missingDataCount: 2,
    actionItemsCount: 5,
    summary:
      "Hiring delivery is progressing but CSR, QA, and System Developer roles require immediate action due to risk and delay flags.",
    roles: [
      {
        role: "CSR",
        account: "SIBS Operations",
        requirement: 20,
        filled: 12,
        status: "At Risk",
        owner: "Maria Reyes",
      },
      {
        role: "QA Specialist",
        account: "SIBS Operations",
        requirement: 5,
        filled: 2,
        status: "Delayed",
        owner: "John Dela Cruz",
      },
      {
        role: "RCM Analyst",
        account: "SIBS RCM",
        requirement: 5,
        filled: 3,
        status: "On Track",
        owner: "Kim Domingo",
      },
    ],
    actionItems: [
      "Add 50 sourced candidates for CSR role before Friday.",
      "Schedule pending QA interviews within 48 hours.",
      "Review compensation range for System Developer applicants.",
    ],
    missingData: [
      "QA interview feedback is incomplete for 2 candidates.",
      "System Developer offer decline reason needs confirmation.",
    ],
  },
  {
    id: 2,
    reportId: "WR-2026-W17",
    weekLabel: "Week 17, 2026",
    dateRange: "Apr 22 - Apr 28, 2026",
    status: "Sent",
    generatedDate: "2026-04-29",
    generatedBy: "System",
    totalOpenRoles: 4,
    totalRequirement: 28,
    totalFilled: 16,
    atRiskRoles: 2,
    delayedRoles: 1,
    dropOffs: 26,
    sourced: 150,
    screened: 92,
    interviewed: 41,
    offered: 18,
    accepted: 12,
    hired: 16,
    missingDataCount: 1,
    actionItemsCount: 4,
    summary:
      "Previous week showed stronger sourcing volume but interview conversion remained a concern.",
    roles: [
      {
        role: "CSR",
        account: "SIBS Operations",
        requirement: 18,
        filled: 10,
        status: "At Risk",
        owner: "Maria Reyes",
      },
      {
        role: "QA Specialist",
        account: "SIBS Operations",
        requirement: 5,
        filled: 1,
        status: "Delayed",
        owner: "John Dela Cruz",
      },
    ],
    actionItems: [
      "Increase sourcing for QA role.",
      "Review interview schedule delays.",
    ],
    missingData: ["One candidate drop-off reason was not categorized."],
  },
  {
    id: 3,
    reportId: "WR-2026-W16",
    weekLabel: "Week 16, 2026",
    dateRange: "Apr 15 - Apr 21, 2026",
    status: "Archived",
    generatedDate: "2026-04-22",
    generatedBy: "System",
    totalOpenRoles: 3,
    totalRequirement: 20,
    totalFilled: 14,
    atRiskRoles: 1,
    delayedRoles: 1,
    dropOffs: 18,
    sourced: 120,
    screened: 74,
    interviewed: 35,
    offered: 15,
    accepted: 10,
    hired: 14,
    missingDataCount: 0,
    actionItemsCount: 3,
    summary:
      "Hiring progress was stable with fewer missing data issues compared to later weeks.",
    roles: [
      {
        role: "CSR",
        account: "SIBS Operations",
        requirement: 15,
        filled: 11,
        status: "On Track",
        owner: "Maria Reyes",
      },
    ],
    actionItems: ["Maintain CSR sourcing pipeline."],
    missingData: [],
  },
];

const statusOptions = ["All Status", "Generated", "Sent", "Archived"];

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusClass(status) {
  switch (status) {
    case "Generated":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Sent":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Archived":
      return "border-gray-200 bg-gray-50 text-gray-600";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getRoleStatusClass(status) {
  switch (status) {
    case "On Track":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "At Risk":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Delayed":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--sibs-primary-1)] text-white">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs text-sibs-tertiary-5">{title}</p>
        <h2 className="text-lg font-bold text-sibs-primary-1">{value}</h2>
        {description && (
          <p className="truncate text-xs text-sibs-tertiary-5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function MovementBar({ label, value, max }) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="min-w-0 truncate text-sm font-bold text-[#344054]">
          {label}
        </p>
        <p className="shrink-0 text-sm font-bold text-sibs-primary-1">
          {value}
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div
          className="h-full rounded-full bg-[var(--sibs-primary-1)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className="max-w-[60%] break-words text-right text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}

function buildEmailPreview(report) {
  if (!report) return "";

  const roleSummary = report.roles
    .map(
      (role) =>
        `- ${role.role} / ${role.account}: ${role.filled}/${role.requirement} filled, ${role.status}, Owner: ${role.owner}`
    )
    .join("\n");

  const actionItems = report.actionItems.map((item) => `- ${item}`).join("\n");

  const missingData =
    report.missingData.length > 0
      ? report.missingData.map((item) => `- ${item}`).join("\n")
      : "- No missing data recorded.";

  return `Subject: Weekly Hiring Report - ${report.weekLabel}

Hi Team,

Please see the auto-generated weekly hiring report for ${report.dateRange}.

1. Summary
${report.summary}

2. Hiring Plan Snapshot
Total Open Roles: ${report.totalOpenRoles}
Approved Hiring Requirement: ${report.totalRequirement}
Current Filled: ${report.totalFilled}
At-Risk Roles: ${report.atRiskRoles}
Delayed Roles: ${report.delayedRoles}

3. Weekly KPI Snapshot
Sourced: ${report.sourced}
Screened: ${report.screened}
Interviewed: ${report.interviewed}
Offered: ${report.offered}
Accepted: ${report.accepted}
Hired: ${report.hired}
Drop-offs: ${report.dropOffs}

4. Current Status by Role / Account
${roleSummary}

5. Action Items
${actionItems}

6. Missing Data Explanation
${missingData}

Thank you.`;
}

function WeeklyReportMobileCard({ report, onView }) {
  return (
    <button
      type="button"
      onClick={onView}
      className="w-full rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-[var(--sibs-primary-1)]/40 hover:bg-[#F8FAFC]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-sibs-primary-1">
            {report.reportId}
          </p>
          <h3 className="mt-1 text-sm font-bold text-[#101828]">
            {report.weekLabel}
          </h3>
          <p className="mt-1 break-words text-xs font-semibold text-sibs-tertiary-5">
            {report.dateRange}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
            report.status
          )}`}
        >
          {report.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Requirement
          </p>
          <p className="mt-1 text-xs font-bold text-[#344054]">
            {report.totalRequirement}
          </p>
        </div>

        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Filled
          </p>
          <p className="mt-1 text-xs font-bold text-emerald-600">
            {report.totalFilled}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
          {report.atRiskRoles} At Risk
        </span>

        <span className="inline-flex rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">
          {report.delayedRoles} Delayed
        </span>

        <span className="inline-flex rounded-full border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-bold text-[#344054]">
          {formatDate(report.generatedDate)}
        </span>
      </div>

      <div className="mt-4">
        <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-3 py-2 text-xs font-bold text-sibs-primary-1">
          <Eye size={15} />
          Preview Report
        </span>
      </div>
    </button>
  );
}

function ReportDetailsModal({ open, report, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!open || !report) return null;

  const maxMovement = Math.max(
    report.sourced,
    report.screened,
    report.interviewed,
    report.offered,
    report.accepted,
    report.hired,
    report.dropOffs
  );

  const emailPreview = buildEmailPreview(report);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(emailPreview);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch (err) {
      console.error("Copy failed:", err);
      alert("Failed to copy email preview");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Weekly Report Preview
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Auto-generated weekly hiring report and email format.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_430px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-[#101828] sm:text-xl">
                      {report.weekLabel}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                      {report.dateRange}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                          report.status
                        )}`}
                      >
                        {report.status}
                      </span>

                      <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
                        Auto-generated
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1/70">
                      Filled
                    </p>
                    <p className="mt-1 text-2xl font-bold text-sibs-primary-1">
                      {report.totalFilled}/{report.totalRequirement}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-5 text-sm font-bold text-[#101828]">
                  Weekly KPI Snapshot
                </h3>

                <div className="space-y-4">
                  <MovementBar
                    label="Sourced"
                    value={report.sourced}
                    max={maxMovement}
                  />
                  <MovementBar
                    label="Screened"
                    value={report.screened}
                    max={maxMovement}
                  />
                  <MovementBar
                    label="Interviewed"
                    value={report.interviewed}
                    max={maxMovement}
                  />
                  <MovementBar
                    label="Offered"
                    value={report.offered}
                    max={maxMovement}
                  />
                  <MovementBar
                    label="Accepted"
                    value={report.accepted}
                    max={maxMovement}
                  />
                  <MovementBar
                    label="Hired"
                    value={report.hired}
                    max={maxMovement}
                  />
                  <MovementBar
                    label="Drop-offs"
                    value={report.dropOffs}
                    max={maxMovement}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Role / Account Summary
                </h3>

                <div className="space-y-3">
                  {report.roles.map((role, index) => (
                    <div
                      key={`${role.role}-${index}`}
                      className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                    >
                      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#101828]">
                            {role.role}
                          </p>
                          <p className="text-xs font-semibold text-sibs-tertiary-5">
                            {role.account} · Owner: {role.owner}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-[#E6ECF2] bg-white px-3 py-1 text-xs font-bold text-[#344054]">
                            {role.filled}/{role.requirement} filled
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${getRoleStatusClass(
                              role.status
                            )}`}
                          >
                            {role.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Report Generation Rule
                </h3>
                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  Weekly reports should be generated from Hiring Needs, Weekly
                  Hiring Plan, Candidate Pipeline, Offers, Onboarding, Missing
                  Data, and Action Items. Do not manually reconstruct the weekly
                  report.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Report Summary
                </h3>

                <div className="mt-4">
                  <DetailRow label="Report ID" value={report.reportId} />
                  <DetailRow label="Week" value={report.weekLabel} />
                  <DetailRow label="Date Range" value={report.dateRange} />
                  <DetailRow label="Status" value={report.status} />
                  <DetailRow
                    label="Generated Date"
                    value={formatDate(report.generatedDate)}
                  />
                  <DetailRow label="Generated By" value={report.generatedBy} />
                  <DetailRow
                    label="Action Items"
                    value={report.actionItemsCount}
                  />
                  <DetailRow
                    label="Missing Data"
                    value={report.missingDataCount}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#101828]">
                      Email Preview
                    </h3>
                    <p className="text-xs font-semibold text-sibs-tertiary-5">
                      Copy-ready weekly report format.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-3 py-2 text-xs font-bold text-sibs-primary-1 transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5"
                  >
                    <Copy size={14} />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-xs leading-6 text-[#344054]">
                  {emailPreview}
                </pre>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-bold text-sibs-primary-1 transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5"
                >
                  <Download size={16} />
                  Export
                </button>

                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
                >
                  <Send size={16} />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[var(--sibs-primary-1)] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WeeklyReportsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [selectedReport, setSelectedReport] = useState(null);

  const filteredReports = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return weeklyReports.filter((report) => {
      const matchesSearch =
        !keyword ||
        report.reportId.toLowerCase().includes(keyword) ||
        report.weekLabel.toLowerCase().includes(keyword) ||
        report.dateRange.toLowerCase().includes(keyword) ||
        report.status.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "All Status" || report.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const stats = useMemo(() => {
    const current = weeklyReports[0];

    const totalReports = weeklyReports.length;
    const generated = weeklyReports.filter(
      (report) => report.status === "Generated"
    ).length;
    const sent = weeklyReports.filter((report) => report.status === "Sent")
      .length;
    const archived = weeklyReports.filter(
      (report) => report.status === "Archived"
    ).length;

    return {
      current,
      totalReports,
      generated,
      sent,
      archived,
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[var(--sibs-tertiary-10)]">
      <Header />

      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <FileClock size={28} className="shrink-0 text-sibs-primary-1" />

            <h1 className="min-w-0 break-words text-2xl font-bold text-sibs-primary-1 sm:text-4xl">
              Weekly Reports
            </h1>
          </div>

          <p className="mt-1 text-sm text-sibs-tertiary-5">
            Auto-generated weekly hiring reports and email preview.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard
            title="Reports"
            value={stats.totalReports}
            icon={FileText}
            description="Weekly reports created"
          />

          <StatCard
            title="Generated"
            value={stats.generated}
            icon={Clock3}
            description="Pending send"
          />

          <StatCard
            title="Sent"
            value={stats.sent}
            icon={CheckCircle2}
            description="Already distributed"
          />

          <StatCard
            title="Archived"
            value={stats.archived}
            icon={ClipboardList}
            description="Historical reports"
          />

          <StatCard
            title="Action Items"
            value={stats.current.actionItemsCount}
            icon={ListChecks}
            description="Current week actions"
          />

          <StatCard
            title="Missing Data"
            value={stats.current.missingDataCount}
            icon={AlertTriangle}
            description="Needs explanation"
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_420px]">
          <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-sibs-primary-1">
                  Current Weekly Report Snapshot
                </h2>
                <p className="text-sm text-sibs-tertiary-5">
                  Hiring plan, KPI snapshot, current status, and action items.
                </p>
              </div>

              <BarChart3 size={20} className="shrink-0 text-gray-400" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Requirement
                </p>
                <p className="mt-2 text-2xl font-bold text-sibs-primary-1">
                  {stats.current.totalRequirement}
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Filled
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {stats.current.totalFilled}
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Drop-offs
                </p>
                <p className="mt-2 text-2xl font-bold text-red-600">
                  {stats.current.dropOffs}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
              <h3 className="text-sm font-bold text-[#101828]">
                Current Week Summary
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#344054]">
                {stats.current.summary}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white p-3 text-sibs-primary-1">
                <Mail size={22} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-sibs-primary-1">
                  Weekly Email Requirement
                </h3>
                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  The system should automatically generate the weekly report
                  format with summary per role/account, hiring plan snapshot,
                  weekly KPI snapshot, current status, action items, and missing
                  data explanations.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-semibold text-sibs-primary-1">
              Weekly Report Records
            </h3>

            <p className="text-sm text-sibs-tertiary-5">
              Generated reports, email previews, and historical archive.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
          >
            <RefreshCcw size={18} />
            Generate Current Week
          </button>
        </div>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_320px_170px] xl:items-center">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-sibs-primary-1">
                  Weekly Report List
                </h2>
                <p className="text-sm text-sibs-tertiary-5">
                  Search and filter weekly report records.
                </p>
              </div>

              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search report, week, status..."
                  className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="space-y-3 lg:hidden">
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <WeeklyReportMobileCard
                    key={report.id}
                    report={report}
                    onView={() => setSelectedReport(report)}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                  No weekly reports found.
                </div>
              )}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-[#E6ECF2] lg:block">
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full min-w-[1180px] border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                    <tr className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      <th className="px-5 py-4">Report ID</th>
                      <th className="px-5 py-4">Week</th>
                      <th className="px-5 py-4">Date Range</th>
                      <th className="px-5 py-4">Generated Date</th>
                      <th className="px-5 py-4 text-center">Req.</th>
                      <th className="px-5 py-4 text-center">Filled</th>
                      <th className="px-5 py-4 text-center">At Risk</th>
                      <th className="px-5 py-4 text-center">Delayed</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredReports.length > 0 ? (
                      filteredReports.map((report) => (
                        <tr
                          key={report.id}
                          className="transition hover:bg-[#F8FAFC]"
                        >
                          <td className="px-5 py-4 text-sm font-bold text-sibs-primary-1">
                            {report.reportId}
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-[#101828]">
                              {report.weekLabel}
                            </p>
                            <p className="text-xs font-semibold text-sibs-tertiary-5">
                              Generated by {report.generatedBy}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                            {report.dateRange}
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                            <div className="flex items-center gap-2">
                              <CalendarDays
                                size={15}
                                className="text-gray-400"
                              />
                              {formatDate(report.generatedDate)}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-center text-sm font-bold text-[#344054]">
                            {report.totalRequirement}
                          </td>

                          <td className="px-5 py-4 text-center text-sm font-bold text-emerald-600">
                            {report.totalFilled}
                          </td>

                          <td className="px-5 py-4 text-center text-sm font-bold text-amber-600">
                            {report.atRiskRoles}
                          </td>

                          <td className="px-5 py-4 text-center text-sm font-bold text-red-600">
                            {report.delayedRoles}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                report.status
                              )}`}
                            >
                              {report.status}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedReport(report)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 py-2 text-xs font-bold text-sibs-primary-1 transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5"
                            >
                              <Eye size={15} />
                              Preview
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                        >
                          No weekly reports found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <p className="text-sm font-semibold text-sibs-tertiary-5">
                Showing 1 to {filteredReports.length} of {weeklyReports.length}{" "}
                weekly reports
              </p>

              <div className="flex items-center gap-2">
                <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50">
                  <ChevronLeft size={16} />
                </button>

                <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--sibs-primary-1)] text-sm font-bold text-white">
                  1
                </button>

                <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-sm font-bold text-gray-600 transition hover:bg-gray-50">
                  2
                </button>

                <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h3 className="text-sm font-bold text-sibs-primary-1">
            Weekly Reports Rule
          </h3>
          <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
            The weekly hiring email should be auto-generated from raw HRIS data:
            Hiring Plan snapshot, Weekly KPI Snapshot, Current Status, Action
            Items, and Missing Data explanations.
          </p>
        </section>
      </main>

      <ReportDetailsModal
        open={!!selectedReport}
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
}