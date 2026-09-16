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
  UserRound,
  XCircle,
} from "lucide-react";

import Header from "@/components/layout/Header";
import RichTextEditor from "@/components/modals/jobDescription/RichTextEditor";
import {
  DataCard,
  ModalShell,
  PageHeaderHero,
  ResponsiveTableShell,
  TablePagination,
} from "@/components/ui";
import useEmailLogsPage from "@/hooks/emailLogs/useEmailLogsPage";
import { sendTestEmailDispatch } from "@/lib/axios/getEmailLogs";
import { EMAIL_STATUS_TABS } from "@/lib/utils/emailLogs/emailLogsData";
import { isEmailLogActivationKey } from "@/lib/utils/emailLogs/emailLogsHelpers";
import EmailLogDetailsDrawer from "./emailLogs/EmailLogDetailsDrawer";
import EmailLogCategoryDropdown from "./emailLogs/EmailLogCategoryDropdown";

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

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function MetricCard({ label, value, description, icon: Icon, tone = "navy", index = 0 }) {
  const tones = {
    navy: "bg-blue-50 text-blue-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    emerald: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-sibs-orange",
  };

  const values = {
    navy: "text-sibs-navy",
    blue: "text-blue-600",
    purple: "text-purple-600",
    emerald: "text-emerald-600",
    orange: "text-sibs-orange",
  };

  return (
    <div
      className="sibs-metric-card"
      style={{ animationDelay: `${index * 45}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`sibs-kpi-kicker ${tone === "orange" ? "text-sibs-orange" : ""}`}>{label}</p>
          <p className={`mt-4 sibs-kpi-value ${values[tone]}`}>{value}</p>
          <p className="mt-3 sibs-kpi-desc">{description}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>
          {createElement(Icon, { className: "h-4 w-4" })}
        </span>
      </div>
    </div>
  );
}

function DesktopTable({ records, onView }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1150px] w-full border-collapse text-left">
        <thead className="bg-sibs-surface">
          <tr className="border-b border-sibs-border">
            {[
              "Recipient & Message ID",
              "Email Address & Role",
              "Subject & Category",
              "Position & Account",
              "Status",
              "Dispatched By",
            ].map((label) => (
              <th key={label} className="px-4 py-3 text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted last:text-right">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-sibs-border">
          {records.map((record) => (
            <tr
              key={record.id}
              role="button"
              tabIndex={0}
              aria-label={`View email details for ${record.recipient}`}
              onClick={() => onView(record)}
              onKeyDown={(event) => {
                if (!isEmailLogActivationKey(event.key)) return;
                event.preventDefault();
                onView(record);
              }}
              className="cursor-pointer transition-colors hover:bg-[#FFF9F6] focus-visible:bg-[#FFF9F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sibs-orange/40"
            >
              <td className="w-[190px] px-4 py-3.5 align-middle">
                <p className="block max-w-[190px] truncate text-left text-[11px] font-extrabold text-sibs-orange">
                  {record.recipient}
                </p>
                <p className="mt-0.5 font-mono text-[9px] font-bold text-sibs-faint">LOG ID: {record.id}</p>
              </td>
              <td className="w-[220px] px-4 py-3.5 align-middle">
                <p className="flex items-center gap-1.5 truncate text-[10.5px] font-semibold text-sibs-secondary">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-sibs-tertiary-7" />
                  {record.email}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[9px] font-semibold text-sibs-faint">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-sibs-secondary">{record.role}</span>
                  <span className="truncate">{record.site}</span>
                </div>
              </td>
              <td className="w-[330px] px-4 py-3.5 align-middle">
                <span className={`inline-flex rounded px-2 py-0.5 text-[8.5px] font-extrabold uppercase ${CATEGORY_STYLES[record.category] || "bg-slate-100 text-slate-700"}`}>
                  {record.category}
                </span>
                <p className="mt-1 max-w-[320px] truncate text-[10.5px] font-bold text-sibs-navy">{record.subject}</p>
                <p className="mt-1 max-w-[320px] truncate text-[9px] font-medium text-sibs-faint">{record.preview}</p>
              </td>
              <td className="w-[210px] px-4 py-3.5 align-middle">
                <p className="max-w-[205px] truncate text-[10px] font-bold text-sibs-secondary">{record.position}</p>
                <p className="mt-1 max-w-[205px] truncate text-[9px] font-medium text-sibs-muted">Account: <span className="text-sibs-secondary">{record.account}</span></p>
              </td>
              <td className="w-[140px] px-4 py-3.5 align-middle">
                <StatusBadge status={record.status} />
                {record.statusDetail ? <p className="mt-1 max-w-[140px] truncate text-[8px] font-bold text-rose-600">{record.statusDetail}</p> : null}
              </td>
              <td className="w-[190px] px-4 py-3.5 align-middle">
                <p className="flex items-center gap-1.5 truncate text-[10px] font-extrabold text-sibs-navy">
                  <UserRound className="h-3.5 w-3.5 shrink-0 text-sibs-orange" />
                  {record.dispatchedBy}
                </p>
                <p className="mt-1 text-[9px] font-medium text-sibs-faint">{formatDispatchDate(record.dispatchedAt)}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileCards({ records, onView }) {
  return (
    <div className="space-y-3 p-3">
      {records.map((record, index) => (
        <DataCard key={record.id} index={index} interactive onClick={() => onView(record)}>
          <DataCard.Header
            kicker={record.id}
            title={record.recipient}
            subtitle={record.email}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className={`inline-flex rounded px-2 py-0.5 text-[9px] font-extrabold uppercase ${CATEGORY_STYLES[record.category] || "bg-slate-100 text-slate-700"}`}>
              {record.category}
            </span>
            <StatusBadge status={record.status} />
          </div>
          <div className="mt-2">
            <p className="mt-1.5 line-clamp-2 text-xs font-bold text-sibs-navy">{record.subject}</p>
          </div>
          <DataCard.ContextRow>
            <span className="min-w-0 truncate font-bold">{record.position}</span>
            <span className="shrink-0 text-sibs-muted">{record.account}</span>
          </DataCard.ContextRow>
          <DataCard.Footer>
            <span className="truncate">{record.dispatchedBy} · {formatDispatchDate(record.dispatchedAt)}</span>
            <span className="shrink-0 font-extrabold text-sibs-orange">View details</span>
          </DataCard.Footer>
        </DataCard>
      ))}
    </div>
  );
}

export default function EmailLogsPage() {
  const logs = useEmailLogsPage();
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

  const metricCards = useMemo(() => [
    { label: "Total Emails", value: logs.metrics.total, description: "Active Dispatch Roster", icon: Mail, tone: "navy" },
    { label: "Delivered", value: logs.metrics.delivered, description: "Delivery Confirmations", icon: CheckCircle2, tone: "blue" },
    { label: "Opened", value: logs.metrics.opened, description: "Recipient Open Events", icon: Eye, tone: "purple" },
    { label: "Clicked CTA", value: logs.metrics.clicked, description: "Offer & Assessment Links", icon: MousePointerClick, tone: "emerald" },
    { label: "Bounce Rate", value: `${logs.metrics.bounceRate}%`, description: `${logs.metrics.bounced + logs.metrics.failed} Bounced / Issues`, icon: AlertTriangle, tone: "orange" },
  ], [logs.metrics]);

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

        <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
          {metricCards.map((metric, index) => <MetricCard key={metric.label} {...metric} index={index} />)}
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-sibs-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="sibs-card-title">Email Communication Directory</h2>
              <p className="sibs-card-subtitle">Search and filter email dispatches by status, template category, position, account, and recipient.</p>
            </div>
            <span className="self-start rounded-lg border border-sibs-border bg-sibs-surface px-3 py-1.5 text-[10px] font-extrabold text-sibs-secondary sm:self-auto">
              Showing {logs.totalRecords} of {logs.records.length} emails
            </span>
          </div>

          <div className="grid gap-3 border-b border-sibs-border px-4 py-4 md:grid-cols-[minmax(280px,1fr)_190px_190px_auto] sm:px-5">
            <label className="block">
              <span className="sibs-field-label">Search</span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-faint" />
                <input
                  value={logs.search}
                  onChange={(event) => logs.setSearch(event.target.value)}
                  className="sibs-dashboard-input pl-9 pr-3"
                  placeholder="Search recipient, email, subject, position, account, message ID..."
                />
              </span>
            </label>
            <label className="block">
              <span className="sibs-field-label">Category</span>
              <select value={logs.category} onChange={(event) => logs.setCategory(event.target.value)} className="sibs-dashboard-input px-3">
                <option value="all">All Categories</option>
                {logs.categories.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="sibs-field-label">Account</span>
              <select value={logs.account} onChange={(event) => logs.setAccount(event.target.value)} className="sibs-dashboard-input px-3">
                <option value="all">All Accounts</option>
                {logs.accounts.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <button type="button" className="sibs-btn-secondary self-end" onClick={logs.clearFilters} disabled={!logs.hasActiveFilters}>
              <Filter className="h-4 w-4" /> Clear
            </button>
          </div>

          <div className="overflow-x-auto border-b border-sibs-border px-4 sm:px-5">
            <div className="flex min-w-max gap-5">
              {EMAIL_STATUS_TABS.map((tab) => {
                const active = logs.status === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => logs.setStatus(tab.value)}
                    className={`relative flex h-11 items-center gap-2 text-[10px] font-extrabold uppercase transition ${active ? "text-sibs-navy" : "text-sibs-muted hover:text-sibs-orange"}`}
                  >
                    {tab.value === "all" ? <Mail className="h-3.5 w-3.5" /> : null}
                    {tab.value === "delivered" ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                    {tab.value === "opened" ? <Eye className="h-3.5 w-3.5" /> : null}
                    {tab.value === "clicked" ? <MousePointerClick className="h-3.5 w-3.5" /> : null}
                    {tab.value === "bounced" ? <AlertTriangle className="h-3.5 w-3.5" /> : null}
                    {tab.value === "failed" ? <XCircle className="h-3.5 w-3.5" /> : null}
                    {tab.value === "internal" ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                    {tab.value === "relay" ? <RotateCcw className="h-3.5 w-3.5" /> : null}
                    {tab.label}
                    <span className={`rounded-full px-2 py-0.5 text-[9px] ${active ? "bg-sibs-navy text-white" : "bg-slate-100 text-sibs-muted"}`}>{logs.statusCounts[tab.value]}</span>
                    {active ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-sibs-orange" /> : null}
                  </button>
                );
              })}
            </div>
          </div>

          {logs.visibleRecords.length ? (
            <ResponsiveTableShell
              desktopContent={<DesktopTable records={logs.visibleRecords} onView={setSelectedRecord} />}
              mobileContent={<MobileCards records={logs.visibleRecords} onView={setSelectedRecord} />}
            />
          ) : (
            <div className="px-4 py-12 text-center">
              <Mail className="mx-auto h-9 w-9 text-sibs-tertiary-8" />
              <h3 className="mt-3 text-sm font-extrabold text-sibs-navy">No email logs found</h3>
              <p className="mt-1 text-xs font-semibold text-sibs-muted">Adjust your filters or clear them to restore all records.</p>
            </div>
          )}

          <div className="px-4 pb-4 sm:px-5">
            <TablePagination
              currentPage={logs.page}
              totalPages={logs.totalPages}
              totalRecords={logs.totalRecords}
              loadedCount={logs.visibleRecords.length ? `${showingStart}–${showingEnd}` : 0}
              recordLabel="email records"
              onPageChange={logs.setPage}
            />
          </div>
        </section>
      </main>

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
          }}
        />
      ) : null}

      <ModalShell
        open={testEmailOpen}
        onClose={closeTestEmailModal}
        title="Dispatch Test Email"
        subtitle="Send a real test message through the configured HRIS mail service and record the delivery result in Email Logs."
        icon={Send}
        badge="Live SMTP"
        footer={!testEmailSent ? null : <button type="button" className="sibs-btn-primary" onClick={closeTestEmailModal}>Done</button>}
      >
        {testEmailSent ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
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
          <form className="space-y-4" autoComplete="off" onSubmit={submitTestEmail}>
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
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{testEmailError}</span>
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="sibs-btn-secondary"
                onClick={closeTestEmailModal}
                disabled={testEmailSending}
              >
                Cancel
              </button>
              <button type="submit" className="sibs-btn-primary" disabled={testEmailSending}>
                <Send className={`h-4 w-4 ${testEmailSending ? "animate-pulse" : ""}`} />
                {testEmailSending ? "Sending..." : "Send Test Email"}
              </button>
            </div>
          </form>
        )}
      </ModalShell>
    </div>
  );
}
