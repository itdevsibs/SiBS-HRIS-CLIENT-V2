import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import DOMPurify from "dompurify";
import {
  CheckCircle2,
  Clock3,
  Code2,
  Copy,
  Eye,
  FileText,
  Mail,
  Paperclip,
  RefreshCw,
  X,
} from "lucide-react";

import {
  buildDeliveryAudit,
  buildPlainTextEmail,
  buildRenderedEmail,
  buildSmtpHeaders,
  getEmailLogRenderedHtml,
} from "@/lib/utils/emailLogs/emailLogsHelpers";

const TABS = [
  { value: "preview", label: "Rendered Preview", icon: Eye },
  { value: "audit", label: "Delivery Audit", icon: Clock3 },
  { value: "headers", label: "SMTP Headers", icon: Code2 },
  { value: "plain", label: "Plain Text", icon: FileText },
];

const STATUS_LABELS = {
  delivered: "Delivered",
  opened: "Opened",
  clicked: "Clicked CTA",
  bounced: "Bounced",
  failed: "Failed",
};

function formatDrawerDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function MetadataPanel({ record }) {
  const attachments = record.attachments || [];

  return (
    <section className="rounded-xl border border-sibs-border bg-white p-4 shadow-xs">
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold text-sibs-faint">Sender:</p>
          <p className="text-[11px] font-extrabold text-sibs-navy">{record.dispatchedBy}</p>
          <p className="truncate font-mono text-[9px] text-sibs-muted">&lt;{record.senderEmail || "careers@thesiblingssolutions.com"}&gt;</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-sibs-faint">Reply-To:</p>
          <p className="truncate font-mono text-[9px] font-bold text-sibs-secondary">{record.replyTo || "recruitment@thesiblingssolutions.com"}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-sibs-faint">Position &amp; Account:</p>
          <p className="text-[11px] font-extrabold text-sibs-navy">{record.position}</p>
          <p className="text-[10px] font-semibold text-sibs-muted">({record.account})</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-sibs-faint">Campus Site:</p>
          <p className="text-[11px] font-extrabold text-sibs-secondary">{record.site}</p>
        </div>
      </div>

      <div className="mt-3 border-t border-sibs-border pt-3">
        <p className="text-[10px] font-bold text-sibs-muted">Attachments ({attachments.length}):</p>
        {attachments.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <span key={attachment.name} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-sibs-border bg-sibs-surface px-2.5 py-1 text-[9px] font-extrabold text-sibs-navy">
                <Paperclip className="h-3 w-3 shrink-0 text-sibs-orange" />
                <span className="truncate">{attachment.name}</span>
                <span className="shrink-0 font-semibold text-sibs-faint">({attachment.size})</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-[10px] font-semibold text-sibs-faint">No attachments included</p>
        )}
      </div>
    </section>
  );
}

function RenderedPreview({ record, preview }) {
  const storedHtml = getEmailLogRenderedHtml(record);
  const sanitizedHtml = useMemo(
    () => (storedHtml ? DOMPurify.sanitize(storedHtml) : ""),
    [storedHtml],
  );
  const fullTextBody = String(record.textBody ?? record.text_body ?? "").trim();

  if (sanitizedHtml) {
    return (
      <section className="overflow-hidden rounded-xl border border-sibs-border bg-white shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b border-sibs-border px-4 py-3">
          <p className="text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">Rendered Email Content</p>
          <p className="text-[9px] font-extrabold uppercase text-emerald-600">Saved HTML Body</p>
        </div>
        <div className="overflow-x-auto bg-white p-3 sm:p-4">
          <style>{`
            .email-log-rendered-html p:not([style]) {
              margin: 0 0 14px;
              line-height: 1.65;
            }
            .email-log-rendered-html p:not([style]):empty::before {
              content: "\\00a0";
            }
            .email-log-rendered-html ol:not([style]),
            .email-log-rendered-html ul:not([style]) {
              display: block !important;
              margin: 12px 0 16px !important;
              padding-left: 32px !important;
              list-style-position: outside !important;
            }
            .email-log-rendered-html ol:not([style]) {
              list-style-type: decimal !important;
            }
            .email-log-rendered-html ul:not([style]) {
              list-style-type: disc !important;
            }
            .email-log-rendered-html ol:not([style]) ol:not([style]) {
              list-style-type: lower-alpha !important;
            }
            .email-log-rendered-html ol:not([style]) ol:not([style]) ol:not([style]) {
              list-style-type: lower-roman !important;
            }
            .email-log-rendered-html ul:not([style]) ul:not([style]) {
              list-style-type: circle !important;
            }
            .email-log-rendered-html ul:not([style]) ul:not([style]) ul:not([style]) {
              list-style-type: square !important;
            }
            .email-log-rendered-html li:not([style]) {
              display: list-item !important;
              margin: 0 0 8px;
              padding-left: 6px;
              line-height: 1.65;
            }
            .email-log-rendered-html li > p:not([style]) {
              display: inline;
              margin: 0;
            }
            .email-log-rendered-html strong:not([style]),
            .email-log-rendered-html b:not([style]) {
              font-weight: 700;
            }
            .email-log-rendered-html em:not([style]),
            .email-log-rendered-html i:not([style]) {
              font-style: italic;
            }
            .email-log-rendered-html u:not([style]) {
              text-decoration: underline;
            }
            .email-log-rendered-html s:not([style]),
            .email-log-rendered-html strike:not([style]) {
              text-decoration: line-through;
            }
            .email-log-rendered-html a:not([style]) {
              color: #0b5cad;
              text-decoration: underline;
              overflow-wrap: anywhere;
            }
          `}</style>
          <div
            className="email-log-rendered-html min-w-0 overflow-hidden rounded-xl border border-sibs-border bg-white"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        </div>
      </section>
    );
  }

  if (fullTextBody) {
    return (
      <section className="overflow-hidden rounded-xl border border-sibs-border bg-white shadow-xs">
        <div className="border-b border-sibs-border px-4 py-3">
          <p className="text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">Rendered Email Content</p>
        </div>
        <pre className="whitespace-pre-wrap break-words p-5 font-sans text-xs leading-relaxed text-sibs-secondary">
          {fullTextBody}
        </pre>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-sibs-border bg-white shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b border-sibs-border px-4 py-3">
        <p className="text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">Rendered Email Content</p>
        <p className="text-[9px] font-extrabold uppercase text-sibs-faint">Preview Only</p>
      </div>
      <div className="p-3 sm:p-4">
        <div className="overflow-hidden rounded-xl border border-sibs-border">
          <div className="bg-sibs-navy px-5 py-6 text-white">
            <p className="text-base font-extrabold tracking-wide">SiBS TALENT ACQUISITION</p>
            <p className="mt-1 text-[10px] font-medium text-blue-100">Official Candidate Communication System</p>
          </div>
          <div className="space-y-5 bg-white px-5 py-6 text-xs leading-relaxed text-sibs-secondary">
            <div>
              <h3 className="text-base font-semibold text-sibs-navy">{preview.heading}</h3>
              <p className="mt-1">{record.preview}</p>
            </div>
            <div className="space-y-3 rounded-lg border border-sibs-border bg-sibs-surface p-4">
              {preview.facts.map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <span className="text-sibs-muted">{label}:</span>
                  <strong className="text-right text-sibs-navy">{value}</strong>
                </div>
              ))}
            </div>
            <p>Please review the information above and follow the instructions included in this communication.</p>
            <div className="border-t border-sibs-border pt-4 text-[10px] text-sibs-faint">
              This is an automated recruitment communication from SiBS HRIS.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AuditView({ events, record }) {
  return (
    <section className="rounded-xl border border-sibs-border bg-white p-5 shadow-xs">
      <h3 className="text-xs font-extrabold text-sibs-navy">Delivery Journey</h3>
      <div className="mt-5 space-y-0">
        {events.map((event, index) => (
          <div key={event.label} className="relative flex gap-3 pb-5 last:pb-0">
            {index < events.length - 1 ? <span className="absolute left-[11px] top-6 h-full w-px bg-emerald-200" /> : null}
            <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-[11px] font-extrabold text-sibs-navy">{event.label}</p>
              <p className="mt-0.5 text-[9px] font-semibold text-sibs-faint">{event.timestamp ? formatDrawerDate(event.timestamp) : "Timestamp unavailable"}</p>
              {index === events.length - 1 && record.statusDetail ? <p className="mt-1 text-[10px] font-bold text-rose-600">{record.statusDetail}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HeadersView({ headers }) {
  return (
    <section className="overflow-hidden rounded-xl border border-sibs-border bg-[#071D31] shadow-xs">
      <div className="border-b border-white/10 px-4 py-3 text-[9px] font-extrabold uppercase tracking-wide text-blue-200">SMTP Message Headers</div>
      <dl className="divide-y divide-white/10 px-4">
        {Object.entries(headers).map(([label, value]) => (
          <div key={label} className="grid gap-1 py-3 sm:grid-cols-[110px_1fr]">
            <dt className="font-mono text-[10px] font-bold text-orange-300">{label}</dt>
            <dd className="break-all font-mono text-[10px] leading-relaxed text-slate-200">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function EmailLogDetailsDrawer({ record, onClose, onResend }) {
  const [activeTab, setActiveTab] = useState("preview");
  const [resendPrepared, setResendPrepared] = useState(false);
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const auditEvents = useMemo(() => buildDeliveryAudit(record), [record]);
  const renderedEmail = useMemo(() => buildRenderedEmail(record), [record]);
  const smtpHeaders = useMemo(() => buildSmtpHeaders(record), [record]);
  const plainText = useMemo(() => buildPlainTextEmail(record), [record]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusable = Array.from(
        drawerRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && (document.activeElement === first || !drawerRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !drawerRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [onClose]);

  const prepareResend = () => {
    onResend(record.id);
    setResendPrepared(true);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end" role="dialog" aria-modal="true" aria-label={`Email details for ${record.recipient}`}>
      <button type="button" className="absolute inset-0 cursor-default bg-sibs-navy/45 backdrop-blur-[2px]" aria-label="Close email details" onClick={onClose} />
      <aside ref={drawerRef} className="sibs-modal-pop-in relative z-10 flex h-dvh w-full max-w-[680px] flex-col overflow-hidden border-l border-sibs-border bg-sibs-surface shadow-2xl">
        <header className="bg-sibs-navy px-5 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-blue-600 px-2 py-0.5 text-[9px] font-extrabold uppercase">{record.category}</span>
                <span className="rounded-full border border-purple-300 bg-purple-50 px-2.5 py-0.5 text-[9px] font-extrabold uppercase text-purple-700">{STATUS_LABELS[record.status] || record.status}</span>
              </div>
              <h2 className="mt-2 truncate font-heading text-lg font-bold tracking-tight">{record.subject}</h2>
              <p className="mt-1 text-[10px] font-medium text-blue-100">
                To: <strong className="text-white">{record.recipient}</strong> ({record.email}) <span className="mx-2">•</span> {formatDrawerDate(record.dispatchedAt)}
              </p>
            </div>
            <button ref={closeButtonRef} type="button" onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-blue-100 hover:bg-white/10 hover:text-white" aria-label="Close drawer">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <nav className="overflow-x-auto border-b border-sibs-border bg-white px-4" aria-label="Email detail views">
          <div className="flex min-w-max gap-5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.value;
              return (
                <button key={tab.value} type="button" onClick={() => setActiveTab(tab.value)} className={`relative flex h-11 items-center gap-1.5 text-[10px] font-extrabold transition ${active ? "text-sibs-navy" : "text-sibs-muted hover:text-sibs-orange"}`}>
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}{tab.value === "audit" ? ` (${auditEvents.length})` : ""}
                  {active ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-sibs-orange" /> : null}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {resendPrepared ? (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Re-send prepared locally. No email was transmitted.
            </div>
          ) : null}
          {activeTab === "preview" ? <div className="space-y-4"><MetadataPanel record={record} /><RenderedPreview record={record} preview={renderedEmail} /></div> : null}
          {activeTab === "audit" ? <AuditView events={auditEvents} record={record} /> : null}
          {activeTab === "headers" ? <HeadersView headers={smtpHeaders} /> : null}
          {activeTab === "plain" ? <pre className="whitespace-pre-wrap rounded-xl border border-sibs-border bg-white p-5 font-mono text-[11px] leading-relaxed text-sibs-secondary shadow-xs">{plainText}</pre> : null}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-sibs-border bg-white px-4 py-3 sm:px-5">
          <button type="button" className="sibs-btn-secondary" onClick={onClose}>Close Drawer</button>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="sibs-btn-secondary" onClick={() => navigator.clipboard?.writeText(record.email)}>
              <Copy className="h-4 w-4" /> Copy Address
            </button>
            <button type="button" className="sibs-btn-primary bg-sibs-navy! hover:bg-sibs-tertiary-3!" onClick={prepareResend}>
              <RefreshCw className="h-4 w-4" /> Re-send to Recipient
            </button>
          </div>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
