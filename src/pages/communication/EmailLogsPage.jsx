import { createSystemDateTimeFormatter } from "@/lib/axios/dateFormatter";
import { createElement, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  Filter,
  Mail,
  MousePointerClick,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  XCircle,
} from "lucide-react";

import Header from "@/components/layout/Header";
import RichTextEditor from "@/components/modals/jobDescription/RichTextEditor";
import {
  DataCard,
  EmptyStatePanel,
  MetricCard,
  MetricGrid,
  MetricGridSkeleton,
  ModalShell,
  PageHeaderHero,
  ResponsiveTableShell,
  SearchInput,
  SelectDropdown,
  StatusFilterTabs,
  TablePagination,
  TableSkeletonRows,
} from "@/components/ui";
import PaginationTable from "@/services/pagination/PaginationTable";
import useEmailLogsPage from "@/hooks/emailLogs/useEmailLogsPage";
import { sendTestEmailDispatch } from "@/lib/axios/getEmailLogs";
import { EMAIL_STATUS_TABS } from "@/lib/utils/emailLogs/emailLogsData";
import { isEmailLogActivationKey } from "@/lib/utils/emailLogs/emailLogsHelpers";
import EmailLogDetailsDrawer from "./emailLogs/EmailLogDetailsDrawer";
import EmailLogCategoryDropdown from "./emailLogs/EmailLogCategoryDropdown";
import CandidateEmailHistoryDrawer from "./emailLogs/CandidateEmailHistoryDrawer";

const STATUS_STYLES = {
  delivered: {
    label: "Delivered",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  opened: {
    label: "Opened",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  clicked: {
    label: "Clicked CTA",
    className: "border-purple-200 bg-purple-50 text-purple-700",
    dot: "bg-purple-500",
  },
  bounced: {
    label: "Bounced",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  failed: {
    label: "Failed",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  },
};

const CATEGORY_STYLES = {
  "Job Offer": "bg-emerald-100 text-emerald-800",
  Interview: "bg-blue-100 text-blue-800",
  "Approval Needed": "bg-purple-100 text-purple-800",
  "Intake Form": "bg-sky-100 text-sky-800",
  Assessment: "bg-amber-100 text-amber-800",
  "NHO Schedule": "bg-indigo-100 text-indigo-800",
  "Weekly Digest": "bg-slate-200 text-slate-700",
  "Talent Pool": "bg-rose-100 text-rose-800",
};

const STATUS_FILTER_TABS = [
  { key: "all", label: "All Emails", icon: Mail },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
  { key: "opened", label: "Opened", icon: Eye },
  { key: "clicked", label: "Clicked CTA", icon: MousePointerClick },
  { key: "bounced", label: "Bounced", icon: AlertTriangle, tone: "alert" },
  { key: "failed", label: "Failed", icon: XCircle, tone: "danger" },
  { key: "internal", label: "Internal Approvals", icon: CheckCircle2 },
  { key: "relay", label: "Relay Status", icon: RotateCcw },
];

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.delivered;

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase ${style.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

function formatDispatchDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return createSystemDateTimeFormatter("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function DesktopTable({ candidates, onView }) {
  return (
    <div className="sibs-data-table-shell overflow-x-auto max-h-[480px] 2xl:max-h-[640px] overflow-y-auto sibs-scrollbar">
      <table className="w-full min-w-[1080px] 2xl:min-w-[1160px] table-fixed border-separate border-spacing-0 text-left font-jakarta">
        <thead className="sibs-data-table-head sticky top-0 z-10 bg-sibs-surface">
          <tr className="sibs-data-table-head-row">
            <th className="sibs-data-table-th w-[20%] px-3 py-2.5 2xl:px-4 2xl:py-3.5 text-left text-[10px] 2xl:text-[10.5px] font-extrabold uppercase tracking-wide text-sibs-muted">
              Candidate
            </th>
            <th className="sibs-data-table-th w-[20%] px-3 py-2.5 2xl:px-4 2xl:py-3.5 text-left text-[10px] 2xl:text-[10.5px] font-extrabold uppercase tracking-wide text-sibs-muted">
              Email Address
            </th>
            <th className="sibs-data-table-th w-[18%] px-3 py-2.5 2xl:px-4 2xl:py-3.5 text-left text-[10px] 2xl:text-[10.5px] font-extrabold uppercase tracking-wide text-sibs-muted">
              Position & Account
            </th>
            <th className="sibs-data-table-th w-[22%] px-3 py-2.5 2xl:px-4 2xl:py-3.5 text-left text-[10px] 2xl:text-[10.5px] font-extrabold uppercase tracking-wide text-sibs-muted">
              Email Activity
            </th>
            <th className="sibs-data-table-th w-[10%] px-3 py-2.5 2xl:px-4 2xl:py-3.5 text-center text-[10px] 2xl:text-[10.5px] font-extrabold uppercase tracking-wide text-sibs-muted">
              Latest Status
            </th>
            <th className="sibs-data-table-th w-[10%] px-3 py-2.5 2xl:px-4 2xl:py-3.5 text-right text-[10px] 2xl:text-[10.5px] font-extrabold uppercase tracking-wide text-sibs-muted">
              Last Email
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sibs-border">
          {candidates.map((candidate, index) => {
            const latestRecord = candidate.latestRecord;

            return (
              <tr
                key={candidate.key}
                role="button"
                tabIndex={0}
                aria-label={`View all emails for ${candidate.candidateName}`}
                onClick={() => onView(candidate)}
                onKeyDown={(event) => {
                  if (!isEmailLogActivationKey(event.key)) return;
                  event.preventDefault();
                  onView(candidate);
                }}
                className="sibs-data-table-row sibs-page-card-in group cursor-pointer transition-colors hover:bg-sibs-cream-light focus-visible:bg-sibs-cream-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sibs-orange/40"
                style={{
                  animationDelay: `${index * 35}ms`,
                  animationFillMode: "both",
                }}
              >
                <td className="border-b border-sibs-border px-3 py-2 2xl:px-4 2xl:py-2.5 align-middle">
                  <p className="block max-w-[215px] truncate text-left sibs-text-xs font-extrabold text-sibs-navy transition-colors group-hover:text-sibs-orange tracking-tight">
                    {candidate.candidateName}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[8.5px] font-bold text-sibs-muted">
                    <span className="rounded bg-sibs-surface-subtle px-1.5 py-0.5 font-jakarta text-[9px] font-extrabold text-sibs-navy">{candidate.role || "Candidate"}</span>
                    {candidate.candidateId ? <span className="font-mono text-[9.5px] 2xl:text-[10px] font-semibold text-sibs-muted tabular-nums">ID: {candidate.candidateId}</span> : null}
                  </div>
                </td>
                <td className="border-b border-sibs-border px-3 py-2 2xl:px-4 2xl:py-2.5 align-middle">
                  <div className="space-y-1">
                    {(candidate.emailAddresses?.length
                      ? candidate.emailAddresses
                      : [candidate.email]
                    ).map((email) => (
                      <p
                        key={email}
                        className="flex items-center gap-1.5 truncate text-[10.5px] font-semibold text-sibs-navy"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0 text-sibs-tertiary-7" />
                        {email}
                      </p>
                    ))}
                  </div>
                  <p className="mt-1 truncate text-[9.5px] font-medium text-sibs-muted">{candidate.site}</p>
                </td>
                <td className="border-b border-sibs-border px-3 py-2 2xl:px-4 2xl:py-2.5 align-middle">
                  <p className="max-w-[205px] truncate sibs-text-xs font-extrabold text-sibs-navy">{candidate.position}</p>
                  <p className="mt-1 max-w-[205px] truncate text-[9.5px] font-medium text-sibs-muted">Account: <span className="font-semibold text-sibs-navy">{candidate.account}</span></p>
                </td>
                <td className="border-b border-sibs-border px-3 py-2 2xl:px-4 2xl:py-2.5 align-middle">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-sibs-navy px-2 py-0.5 text-[9px] font-extrabold text-white">
                      {candidate.emailCount}
                    </span>
                    <span className="text-[10px] font-extrabold text-sibs-navy">
                      {candidate.emailCount === 1 ? "email" : "emails"}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-[9.5px] font-medium text-sibs-muted">
                    Latest: <span className="font-semibold text-sibs-navy">{latestRecord.subject}</span>
                  </p>
                </td>
                <td className="border-b border-sibs-border px-3 py-2 2xl:px-4 2xl:py-2.5 text-center align-middle">
                  <StatusBadge status={latestRecord.status} />
                </td>
                <td className="border-b border-sibs-border px-3 py-2 2xl:px-4 2xl:py-2.5 text-right align-middle">
                  <p className="sibs-text-xs font-extrabold tabular-nums text-sibs-navy whitespace-nowrap">{formatDispatchDate(candidate.lastDispatchedAt)}</p>
                  <p className="mt-1 truncate text-[9.5px] font-semibold text-sibs-muted">{latestRecord.dispatchedBy}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MobileCards({ candidates, onView }) {
  return (
    <div className="space-y-3 p-3">
      {candidates.map((candidate, index) => (
        <DataCard
          key={candidate.key}
          index={index}
          interactive
          onClick={() => onView(candidate)}
          className="sibs-page-card-in"
          style={{
            animationDelay: `${index * 35}ms`,
            animationFillMode: "both",
          }}
        >
          <DataCard.Header
            kicker={`${candidate.emailCount} ${candidate.emailCount === 1 ? "EMAIL" : "EMAILS"}`}
            title={candidate.candidateName}
            subtitle={(candidate.emailAddresses?.length
              ? candidate.emailAddresses
              : [candidate.email]
            ).join(" • ")}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className={`inline-flex rounded px-2 py-0.5 text-[9px] font-extrabold uppercase ${CATEGORY_STYLES[candidate.latestRecord.category] || "bg-slate-100 text-slate-700"}`}>
              {candidate.latestRecord.category}
            </span>
            <StatusBadge status={candidate.latestRecord.status} />
          </div>
          <div className="mt-2">
            <p className="mt-1.5 line-clamp-2 text-xs font-bold text-sibs-navy">{candidate.latestRecord.subject}</p>
          </div>
          <DataCard.ContextRow>
            <span className="min-w-0 truncate font-bold">{candidate.position}</span>
            <span className="shrink-0 text-sibs-muted">{candidate.account}</span>
          </DataCard.ContextRow>
          <DataCard.Footer>
            <span className="truncate">Last email · {formatDispatchDate(candidate.lastDispatchedAt)}</span>
            <span className="shrink-0 font-extrabold text-sibs-orange">View all emails</span>
          </DataCard.Footer>
        </DataCard>
      ))}
    </div>
  );
}


export default function EmailLogsPage() {
  const logs = useEmailLogsPage();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [testEmailSent, setTestEmailSent] = useState(false);
  const [testEmailCategory, setTestEmailCategory] = useState("Interview");
  const [testEmailRecipient, setTestEmailRecipient] = useState("");
  const [testEmailSubject, setTestEmailSubject] = useState("SiBS Test Email Dispatch");
  const [testEmailMessageHtml, setTestEmailMessageHtml] = useState("");
  const [testEmailMessageText, setTestEmailMessageText] = useState("");
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailError, setTestEmailError] = useState("");
  const [testEmailResult, setTestEmailResult] = useState(null);
  const showingStart = logs.totalRecords ? (logs.page - 1) * logs.pageSize + 1 : 0;
  const showingEnd = Math.min(logs.page * logs.pageSize, logs.totalRecords);

  const visibleStatusCounts = useMemo(() => {
    if (!logs.statusCounts) return {};
    return Object.fromEntries(
      Object.entries(logs.statusCounts).filter(([, count]) => Number(count || 0) > 0),
    );
  }, [logs.statusCounts]);

  const countKeys = useMemo(
    () => Object.keys(visibleStatusCounts),
    [visibleStatusCounts],
  );

  const handlePageChange = (nextPage) => {
    logs.setPage(nextPage);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const downloadCsvTemplate = () => {
    const content = "recipient_email,recipient_name,subject,category,position,account\n";
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "sibs-email-dispatch-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const openTestEmailModal = () => {
    setTestEmailOpen(true);
    setTestEmailSent(false);
    setTestEmailCategory("Interview");
    setTestEmailRecipient("");
    setTestEmailSubject("SiBS Test Email Dispatch");
    setTestEmailMessageHtml("");
    setTestEmailMessageText("");
    setTestEmailSending(false);
    setTestEmailError("");
    setTestEmailResult(null);
  };

  const closeTestEmailModal = () => {
    if (testEmailSending) return;
    setTestEmailOpen(false);
  };

  const submitTestEmail = async (event) => {
    event.preventDefault();

    if (testEmailSending) return;

    setTestEmailSending(true);
    setTestEmailError("");

    try {
      const result = await sendTestEmailDispatch({
        recipientEmail: testEmailRecipient,
        category: testEmailCategory,
        subject: testEmailSubject,
        messageHtml: testEmailMessageHtml,
        messageText: testEmailMessageText,
      });

      if (!result?.success) {
        throw new Error(result?.message || "Unable to send the test email.");
      }

      setTestEmailResult(result);
      setTestEmailSent(true);
      logs.refresh();
    } catch (error) {
      const responseData = error?.response?.data;
      setTestEmailError(
        responseData?.error ||
          responseData?.message ||
          error?.message ||
          "Unable to send the test email.",
      );
    } finally {
      setTestEmailSending(false);
    }
  };

  return (
    <div className="sibs-dashboard-shell">
      <Header />

      <main className="sibs-dashboard-main-wide">
        <PageHeaderHero
          kicker="Communication & Workflows"
          title="Email Logs & Delivery Tracking"
          description="Audit trail, dispatch status, candidate correspondence, and delivery tracking across automated and manual recruitment communications."
          className="mb-5"
          actions={
            <>
              <button type="button" className="sibs-btn-icon" title="Refresh email logs" onClick={logs.refresh} disabled={logs.refreshing}>
                <RefreshCw className={`h-4 w-4 ${logs.refreshing ? "animate-spin text-sibs-orange" : ""}`} />
              </button>
              <button type="button" className="sibs-btn-secondary" onClick={downloadCsvTemplate}>
                <Download className="h-4 w-4" /> CSV Template
              </button>
              <button type="button" className="sibs-btn-primary" onClick={openTestEmailModal}>
                <Send className="h-4 w-4" /> Dispatch Test Email
              </button>
            </>
          }
        />

        {logs.loading ? (
          <MetricGridSkeleton
            columns={5}
            count={5}
            labels={["Total Emails", "Delivered", "Opened", "Clicked CTA", "Bounce Rate"]}
            ariaLabel="Loading email metrics"
          />
        ) : (
          <MetricGrid columns={5}>
            <MetricCard
              title="Total Emails"
              value={logs.metrics.total}
              description="Active Dispatch Roster"
              icon={Mail}
              tone="navy"
              index={0}
            />
            <MetricCard
              title="Delivered"
              value={logs.metrics.delivered}
              description="Delivery Confirmations"
              icon={CheckCircle2}
              tone="blue"
              index={1}
            />
            <MetricCard
              title="Opened"
              value={logs.metrics.opened}
              description="Recipient Open Events"
              icon={Eye}
              tone="purple"
              index={2}
            />
            <MetricCard
              title="Clicked CTA"
              value={logs.metrics.clicked}
              description="Offer & Assessment Links"
              icon={MousePointerClick}
              tone="emerald"
              index={3}
            />
            <MetricCard
              title="Bounce Rate"
              value={`${logs.metrics.bounceRate}%`}
              description={`${logs.metrics.bounced + logs.metrics.failed} Bounced / Issues`}
              icon={AlertTriangle}
              tone="coral"
              index={4}
            />
          </MetricGrid>
        )}

        <section
          className="sibs-page-card-in sibs-card mt-5 overflow-visible rounded-[14px] border border-sibs-border bg-white font-jakarta shadow-xs"
          style={{ animationDelay: "240ms", animationFillMode: "both" }}
        >
          <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6 font-jakarta">
            <div>
              <h2 className="sibs-card-title">Candidate Email Directory</h2>
              <p className="sibs-card-subtitle">One row per candidate. Open a candidate to review their complete email communication history.</p>
            </div>

            <div className="relative z-[90] mt-3.5 2xl:mt-4 overflow-visible">
              <PaginationTable
                filterLayout="ta-inline"
                showFilterPanel={false}
                showFilterHeader={false}
                showPagination={false}
                loading={logs.loading}
                searchValue={logs.search}
                searchPlaceholder="Search candidate, email, subject, position, account..."
                onSearchChange={(val) => logs.setSearch(typeof val === "string" ? val : val?.target?.value ?? "")}
                className="border-0 bg-transparent p-0 shadow-none font-jakarta"
                filters={[
                  {
                    key: "category",
                    value: logs.category,
                    options: [
                      { label: "All Categories", value: "all" },
                      ...logs.categories.map((value) => ({ label: value, value })),
                    ],
                    onChange: (val) => logs.setCategory(val || "all"),
                    includeAll: false,
                    allLabel: "All Categories",
                    label: "Category",
                    placeholder: "All Categories",
                    searchable: true,
                    disabled: logs.loading,
                    className: "w-full xl:w-[210px] 2xl:w-[240px] xl:flex-none",
                  },
                  {
                    key: "account",
                    value: logs.account,
                    options: [
                      { label: "All Accounts", value: "all" },
                      ...logs.accounts.map((value) => ({ label: value, value })),
                    ],
                    onChange: (val) => logs.setAccount(val || "all"),
                    includeAll: false,
                    allLabel: "All Accounts",
                    label: "Account",
                    placeholder: "All Accounts",
                    searchable: true,
                    disabled: logs.loading,
                    className: "w-full xl:w-[210px] 2xl:w-[240px] xl:flex-none",
                  },
                ]}
                rightContent={
                  logs.hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={logs.clearFilters}
                      disabled={logs.loading}
                      className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange xl:w-auto"
                    >
                      <RotateCcw size={14} />
                      Clear
                    </button>
                  ) : null
                }
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 p-4 sm:p-5 2xl:p-6 font-jakarta">
            <div className="overflow-hidden rounded-[10px] border border-sibs-border bg-white shadow-xs">
              <StatusFilterTabs
                tabs={STATUS_FILTER_TABS}
                activeValue={logs.status}
                onChange={logs.setStatus}
                counts={visibleStatusCounts}
                countKeys={countKeys}
                layoutId="emailLogsStatusTabIndicator"
              />

              {logs.visibleCandidates.length ? (
                <ResponsiveTableShell
                  desktopContent={<DesktopTable candidates={logs.visibleCandidates} onView={setSelectedCandidate} />}
                  mobileContent={<MobileCards candidates={logs.visibleCandidates} onView={setSelectedCandidate} />}
                />
              ) : (
                <div className="p-8 sm:p-12">
                  <EmptyStatePanel
                    icon={Mail}
                    title="No candidates found"
                    description="Adjust your filters or clear them to restore the candidate email directory."
                    action={
                      logs.hasActiveFilters ? (
                        <button
                          type="button"
                          onClick={logs.clearFilters}
                          className="sibs-btn-primary !h-8.5 text-xs font-extrabold"
                        >
                          Reset Search & Filters
                        </button>
                      ) : null
                    }
                  />
                </div>
              )}
            </div>

            <div className="pt-4">
              <TablePagination
                currentPage={logs.page}
                totalPages={logs.totalPages}
                totalRecords={logs.totalRecords}
                loadedCount={logs.visibleCandidates.length ? `${showingStart}–${showingEnd}` : 0}
                recordLabel="candidates"
                onPageChange={handlePageChange}
                showCount
              />
            </div>
          </div>
        </section>

      </main>

      {selectedCandidate ? (
        <CandidateEmailHistoryDrawer
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onViewEmail={setSelectedRecord}
        />
      ) : null}

      {selectedRecord ? (
        <EmailLogDetailsDrawer
          key={selectedRecord.id}
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onResend={(recordId) => {
            logs.retryDelivery(recordId);
            setSelectedRecord((current) => (
              current && current.id === recordId && ["bounced", "failed"].includes(current.status)
                ? { ...current, status: "delivered", statusDetail: undefined }
                : current
            ));
            setSelectedCandidate((current) => {
              if (!current) return current;

              const nextRecords = current.records.map((record) => (
                record.id === recordId && ["bounced", "failed"].includes(record.status)
                  ? { ...record, status: "delivered", statusDetail: undefined }
                  : record
              ));

              return {
                ...current,
                records: nextRecords,
                latestRecord: nextRecords[0] || current.latestRecord,
              };
            });
          }}
        />
      ) : null}

      <ModalShell
        open={testEmailOpen}
        onClose={closeTestEmailModal}
        variant="navy"
        title="Dispatch Test Email"
        subtitle="Send a real test message through the configured HRIS mail service and record the delivery result in Email Logs."
        icon={Send}
        badge="Live SMTP"
        footer={
          testEmailSent ? (
            <button type="button" className="sibs-btn-primary" onClick={closeTestEmailModal}>
              Done
            </button>
          ) : (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="sibs-btn-secondary"
                onClick={closeTestEmailModal}
                disabled={testEmailSending}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="dispatch-test-email-form"
                className="sibs-btn-primary"
                disabled={testEmailSending}
              >
                <Send className={`h-4 w-4 ${testEmailSending ? "animate-pulse" : ""}`} />
                {testEmailSending ? "Sending..." : "Send Test Email"}
              </button>
            </div>
          )
        }
      >
        {testEmailSent ? (
          <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 p-5 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <p className="mt-3 text-sm font-extrabold text-emerald-800">Test email sent</p>
            <p className="mt-1 text-xs font-semibold text-emerald-700">
              Delivered to {testEmailResult?.recipientEmail || testEmailRecipient} through the configured HRIS mail service.
            </p>
            {testEmailResult?.messageId ? (
              <p className="mt-2 break-all font-mono text-[10px] font-semibold text-emerald-700/80">
                Message ID: {testEmailResult.messageId}
              </p>
            ) : null}
          </div>
        ) : (
          <form id="dispatch-test-email-form" className="space-y-4" autoComplete="off" onSubmit={submitTestEmail}>
            <label className="block">
              <span className="sibs-field-label">Recipient Email</span>
              <input
                required
                type="email"
                name="recipient_email"
                autoComplete="email"
                className="sibs-dashboard-input px-3"
                placeholder="name@example.com"
                value={testEmailRecipient}
                onChange={(event) => setTestEmailRecipient(event.target.value)}
                disabled={testEmailSending}
              />
            </label>
            <EmailLogCategoryDropdown
              categories={logs.categories}
              value={testEmailCategory}
              onChange={setTestEmailCategory}
            />
            <label className="block">
              <span className="sibs-field-label">Subject</span>
              <input
                required
                type="text"
                name="subject"
                className="sibs-dashboard-input px-3"
                value={testEmailSubject}
                onChange={(event) => setTestEmailSubject(event.target.value)}
                disabled={testEmailSending}
              />
            </label>

            <div className="block">
              <span className="sibs-field-label">Message Body</span>
              <p className="mb-2 text-[10px] font-semibold text-sibs-muted">
                Paste formatted content here. Paragraphs, line breaks, bold, italic, lists, and supported links are preserved. Leave blank to use the selected category template.
              </p>
              <div className={testEmailSending ? "pointer-events-none opacity-60" : ""}>
                <RichTextEditor
                  id="email-test-message-body"
                  value={testEmailMessageHtml}
                  onChange={(html, text) => {
                    setTestEmailMessageHtml(html);
                    setTestEmailMessageText(text);
                  }}
                  placeholder="Write or paste the email message body..."
                  minHeight={170}
                />
              </div>
            </div>

            {testEmailError ? (
              <div className="flex items-start gap-2 rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{testEmailError}</span>
              </div>
            ) : null}
          </form>
        )}
      </ModalShell>
    </div>
  );
}
