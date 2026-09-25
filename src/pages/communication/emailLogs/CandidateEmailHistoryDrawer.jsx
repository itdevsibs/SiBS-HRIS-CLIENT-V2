import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import DOMPurify from "dompurify";
import {
  BriefcaseBusiness,
  Mail,
  Send,
  MapPin,
  UserRound,
  X,
} from "lucide-react";

import {
  getCandidateEmailReplies,
  getGmailReplyConnectUrl,
  getGmailReplyConnectionStatus,
} from "@/lib/axios/getEmailLogs";
import {
  getEmailLogRenderedHtml,
  normalizeEmailLogRecord,
} from "@/lib/utils/emailLogs/emailLogsHelpers";

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
  reply: {
    label: "Candidate Reply",
    className: "border-sky-200 bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
  },
};

const SIBS_EMAIL_LOGO_PREVIEW_URL = `${String(
  import.meta.env.BASE_URL || "/",
).replace(/\/?$/, "/")}SiBSLogoNavy.png`;

function resolveStoredEmailInlineImages(html = "") {
  return String(html).replace(/<img\b[^>]*>/gi, (tag) => {
    const sourceMatch = tag.match(/\bsrc\s*=\s*(["'])(.*?)\1/i);
    if (!sourceMatch) return tag;

    const source = String(sourceMatch[2] || "").trim();
    if (!/^cid:/i.test(source)) return tag;

    const altMatch = tag.match(/\balt\s*=\s*(["'])(.*?)\1/i);
    const identity = `${source} ${String(altMatch?.[2] || "")}`;

    if (!/(sibs|logo|candidate-outcome)/i.test(identity)) return tag;

    return tag.replace(sourceMatch[0], `src="${SIBS_EMAIL_LOGO_PREVIEW_URL}"`);
  });
}

function ensureStoredEmailHasSibsLogo(html = "") {
  const resolvedHtml = resolveStoredEmailInlineImages(html);
  if (!resolvedHtml) return "";

  if (typeof DOMParser === "undefined") return resolvedHtml;

  try {
    const parser = new DOMParser();
    const document = parser.parseFromString(resolvedHtml, "text/html");
    const existingLogo = Array.from(document.querySelectorAll("img")).some((image) => {
      const identity = `${image.getAttribute("src") || ""} ${image.getAttribute("alt") || ""}`;
      return /(sibs|logo)/i.test(identity);
    });

    if (existingLogo) return document.body.innerHTML;

    const logoImage = document.createElement("img");
    logoImage.setAttribute("src", SIBS_EMAIL_LOGO_PREVIEW_URL);
    logoImage.setAttribute("alt", "SiBS");
    logoImage.setAttribute("width", "300");
    logoImage.setAttribute(
      "style",
      "display:block;width:100%;max-width:300px;height:auto;margin:0 auto 24px;border:0;outline:none;text-decoration:none;",
    );

    const wrapper = document.createElement("div");
    wrapper.setAttribute("style", "text-align:center;margin:0;");
    wrapper.appendChild(logoImage);

    const firstBodyElement = document.body.firstElementChild;
    let contentContainer = firstBodyElement;

    if (firstBodyElement?.tagName === "DIV") {
      contentContainer = firstBodyElement.firstElementChild?.tagName === "DIV"
        ? firstBodyElement.firstElementChild
        : firstBodyElement;
    } else if (firstBodyElement?.tagName === "TABLE") {
      contentContainer = firstBodyElement.querySelector("td") || firstBodyElement;
    }

    if (contentContainer) {
      contentContainer.insertBefore(wrapper, contentContainer.firstChild);
    } else {
      document.body.appendChild(wrapper);
    }

    return document.body.innerHTML;
  } catch {
    return resolvedHtml;
  }
}

function removeStoredEmailShellBackgrounds(html = "") {
  const markup = String(html || "").trim();
  if (!markup || typeof DOMParser === "undefined") return markup;

  const clearBackground = (element) => {
    if (!element || typeof element.getAttribute !== "function") return;

    element.removeAttribute("bgcolor");
    element.removeAttribute("background");

    const styleValue = element.getAttribute("style");
    if (!styleValue) return;

    const cleanedStyle = styleValue
      .split(";")
      .map((rule) => rule.trim())
      .filter(Boolean)
      .filter((rule) => {
        const property = rule.split(":", 1)[0]?.trim().toLowerCase();
        return !["background", "background-color", "background-image"].includes(property);
      })
      .join(";");

    if (cleanedStyle) element.setAttribute("style", `${cleanedStyle};`);
    else element.removeAttribute("style");
  };

  const clearTableShell = (table) => {
    if (!table) return;
    clearBackground(table);

    Array.from(table.children).forEach((section) => {
      const tag = section.tagName?.toLowerCase();
      if (["tbody", "thead", "tfoot"].includes(tag)) {
        clearBackground(section);
        Array.from(section.children).forEach((row) => {
          clearBackground(row);
          Array.from(row.children).forEach((cell) => {
            if (["td", "th"].includes(cell.tagName?.toLowerCase())) clearBackground(cell);
          });
        });
      } else if (tag === "tr") {
        clearBackground(section);
        Array.from(section.children).forEach((cell) => {
          if (["td", "th"].includes(cell.tagName?.toLowerCase())) clearBackground(cell);
        });
      }
    });
  };

  try {
    const parser = new DOMParser();
    const document = parser.parseFromString(markup, "text/html");
    clearBackground(document.body);

    const tables = Array.from(document.body.querySelectorAll("table"));
    clearTableShell(tables[0]);
    clearTableShell(tables[1]);

    const firstElement = document.body.firstElementChild;
    if (firstElement?.tagName?.toLowerCase() === "div") {
      clearBackground(firstElement);
      if (firstElement.firstElementChild?.tagName?.toLowerCase() === "div") {
        clearBackground(firstElement.firstElementChild);
      }
    }

    return document.body.innerHTML.trim() || markup;
  } catch {
    return markup;
  }
}

function ThreadEmailBody({ record }) {
  const storedHtml = getEmailLogRenderedHtml(record);
  const renderedHtml = useMemo(() => {
    if (!storedHtml) return "";

    const isIncomingReply =
      record?.direction === "incoming" || Boolean(record?.isCandidateReply);
    const prepared = removeStoredEmailShellBackgrounds(
      isIncomingReply ? storedHtml : ensureStoredEmailHasSibsLogo(storedHtml),
    );
    return DOMPurify.sanitize(prepared);
  }, [storedHtml]);

  const textBody = String(record.textBody ?? record.text_body ?? "").trim();

  if (renderedHtml) {
    return (
      <div className="border-t border-slate-100 px-4 py-5 sm:px-5">
        <style>{`
          .candidate-thread-email-html {
            width: 100%;
            max-width: 100%;
            overflow: hidden;
            background: transparent !important;
          }
          .candidate-thread-email-html img {
            max-width: 100%;
            height: auto;
          }
          .candidate-thread-email-html table {
            max-width: 100%;
          }
          .candidate-thread-email-html a {
            overflow-wrap: anywhere;
          }
        `}</style>
        <div
          className="candidate-thread-email-html min-w-0 text-[12px] leading-relaxed text-sibs-secondary"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>
    );
  }

  return (
    <div className="border-t border-slate-100 px-4 py-5 sm:px-5">
      {textBody ? (
        <pre className="whitespace-pre-wrap break-words font-sans text-[11px] leading-6 text-sibs-secondary">
          {textBody}
        </pre>
      ) : (
        <p className="whitespace-pre-wrap break-words text-[11px] leading-6 text-sibs-secondary">
          {record.preview || "No email content available."}
        </p>
      )}
    </div>
  );
}

function formatDispatchDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || {
    label: status || "Unknown",
    className: "border-slate-200 bg-slate-50 text-slate-700",
    dot: "bg-slate-400",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase ${style.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

export default function CandidateEmailHistoryDrawer({ candidate, onClose }) {
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const [gmailReplies, setGmailReplies] = useState([]);
  const [gmailReplyState, setGmailReplyState] = useState({
    connected: null,
    requiresReconnect: false,
    mailbox: "",
    reason: "",
  });
  const [gmailConnecting, setGmailConnecting] = useState(false);
  const records = useMemo(() => candidate?.records || [], [candidate]);
  const emailAddresses = useMemo(() => {
    const addresses = candidate?.emailAddresses?.length
      ? candidate.emailAddresses
      : [candidate?.email];

    const seen = new Set();
    return addresses
      .map((email) => String(email ?? "").trim())
      .filter((email) => {
        const key = email.toLowerCase();
        if (!email || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [candidate]);

  const providerMessageIds = useMemo(() => {
    const seen = new Set();

    return records
      .map((record) => String(record?.providerMessageId ?? "").trim())
      .filter((messageId) => {
        const key = messageId.toLowerCase();
        if (!messageId || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [records]);

  const outboundMessages = useMemo(
    () => records.map((record) => ({
      id: String(record?.id ?? "").trim(),
      providerMessageId: String(record?.providerMessageId ?? "").trim(),
      subject: String(record?.subject ?? "").trim(),
      dispatchedAt: record?.dispatchedAt ?? "",
      recipientEmail: String(record?.email ?? "").trim(),
    })),
    [records],
  );

  const threadRecords = useMemo(() => {
    const normalizeMessageId = (value) => String(value ?? "")
      .trim()
      .replace(/^<+|>+$/g, "")
      .toLowerCase();

    const seen = new Set();
    const outbound = records
      .filter((record) => {
        const key = String(record?.id || record?.providerMessageId || "").trim();
        if (!key || seen.has(`out:${key}`)) return false;
        seen.add(`out:${key}`);
        return true;
      })
      .sort((left, right) => {
        const leftTime = Date.parse(left?.dispatchedAt) || 0;
        const rightTime = Date.parse(right?.dispatchedAt) || 0;
        return rightTime - leftTime;
      });

    const repliesByParent = new Map();
    const unmatchedReplies = [];

    for (const reply of gmailReplies) {
      const replyKey = String(
        reply?.gmailMessageId || reply?.providerMessageId || reply?.id || "",
      ).trim();
      if (!replyKey || seen.has(`reply:${replyKey}`)) continue;
      seen.add(`reply:${replyKey}`);

      const parentKey = normalizeMessageId(reply?.matchedProviderMessageId);
      if (!parentKey) {
        unmatchedReplies.push(reply);
        continue;
      }

      if (!repliesByParent.has(parentKey)) repliesByParent.set(parentKey, []);
      repliesByParent.get(parentKey).push(reply);
    }

    const result = [];
    for (const record of outbound) {
      result.push(record);
      const parentKey = normalizeMessageId(record?.providerMessageId);
      const replies = repliesByParent.get(parentKey) || [];
      replies.sort((left, right) => {
        const leftTime = Date.parse(left?.dispatchedAt) || 0;
        const rightTime = Date.parse(right?.dispatchedAt) || 0;
        return leftTime - rightTime;
      });
      result.push(...replies);
      repliesByParent.delete(parentKey);
    }

    const remaining = [
      ...unmatchedReplies,
      ...Array.from(repliesByParent.values()).flat(),
    ].sort((left, right) => {
      const leftTime = Date.parse(left?.dispatchedAt) || 0;
      const rightTime = Date.parse(right?.dispatchedAt) || 0;
      return rightTime - leftTime;
    });

    return [...result, ...remaining];
  }, [records, gmailReplies]);

  useEffect(() => {
    let cancelled = false;

    setGmailReplies([]);
    setGmailReplyState({ connected: null, requiresReconnect: false, mailbox: "", reason: "" });

    if (!candidate || !providerMessageIds.length || !emailAddresses.length) {
      return () => {
        cancelled = true;
      };
    }

    void getCandidateEmailReplies({
      providerMessageIds,
      candidateEmails: emailAddresses,
      outboundMessages,
    })
      .then((result) => {
        if (cancelled) return;

        const nextReplies = Array.isArray(result?.records)
          ? result.records.map((record) =>
              normalizeEmailLogRecord({
                ...record,
                direction: "incoming",
                isCandidateReply: true,
              }),
            )
          : [];

        setGmailReplies(nextReplies);
        setGmailReplyState({
          connected: Boolean(result?.connected),
          requiresReconnect: Boolean(result?.requiresReconnect),
          mailbox: String(result?.mailbox || "").trim(),
          reason: String(result?.reason || "").trim(),
        });
      })
      .catch((error) => {
        if (cancelled) return;
        const message = String(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Unable to load candidate Gmail replies.",
        ).trim();
        setGmailReplyState((current) => ({
          ...current,
          connected: false,
          reason: message,
        }));
        console.error(
          "Unable to load candidate Gmail replies:",
          error?.response?.data || error?.message || error,
        );
      });

    return () => {
      cancelled = true;
    };
  }, [candidate, emailAddresses, outboundMessages, providerMessageIds]);

  const connectGmailReplies = () => {
    const popup = window.open(
      getGmailReplyConnectUrl(),
      "sibs-gmail-replies-connect",
      "popup=yes,width=620,height=760,resizable=yes,scrollbars=yes",
    );

    if (!popup) {
      setGmailReplyState((current) => ({
        ...current,
        reason: "Allow pop-ups for SiBS HRIS, then try connecting Gmail replies again.",
      }));
      return;
    }

    setGmailConnecting(true);
  };

  useEffect(() => {
    const handleGoogleMessage = async (event) => {
      if (!["GOOGLE_GMAIL_REPLIES_CONNECTED", "GOOGLE_GMAIL_REPLIES_FAILED"].includes(event?.data?.type)) {
        return;
      }

      setGmailConnecting(false);

      if (event.data.type === "GOOGLE_GMAIL_REPLIES_FAILED") {
        setGmailReplyState((current) => ({
          ...current,
          connected: false,
          reason: "Gmail reply connection failed. Please try again.",
        }));
        return;
      }

      try {
        const status = await getGmailReplyConnectionStatus();
        setGmailReplyState((current) => ({
          ...current,
          connected: Boolean(status?.connected),
          requiresReconnect: false,
          mailbox: String(status?.googleEmail || "").trim(),
          reason: "",
        }));

        const result = await getCandidateEmailReplies({
          providerMessageIds,
          candidateEmails: emailAddresses,
          outboundMessages,
        });
        const nextReplies = Array.isArray(result?.records)
          ? result.records.map((record) =>
              normalizeEmailLogRecord({
                ...record,
                direction: "incoming",
                isCandidateReply: true,
              }),
            )
          : [];
        setGmailReplies(nextReplies);
      } catch (error) {
        setGmailReplyState((current) => ({
          ...current,
          reason: String(error?.message || "Unable to refresh Gmail replies after connecting."),
        }));
      }
    };

    window.addEventListener("message", handleGoogleMessage);
    return () => window.removeEventListener("message", handleGoogleMessage);
  }, [emailAddresses, outboundMessages, providerMessageIds]);

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
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (
        event.shiftKey &&
        (document.activeElement === first || !drawerRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !drawerRef.current.contains(document.activeElement))
      ) {
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

  if (!candidate) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9900] flex justify-end" role="dialog" aria-modal="true" aria-label={`Email history for ${candidate.candidateName}`}>
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-sibs-navy/45 backdrop-blur-[2px]"
        aria-label="Close candidate email history"
        onClick={onClose}
      />

      <aside
        ref={drawerRef}
        className="sibs-modal-pop-in relative z-10 flex h-dvh w-full max-w-[760px] flex-col overflow-hidden border-l border-sibs-border bg-sibs-surface shadow-2xl"
      >
        <header className="bg-sibs-navy px-5 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-sibs-orange px-2 py-0.5 text-[9px] font-extrabold uppercase text-white">
                  Candidate Email History
                </span>
                <span className="rounded-full border border-blue-300/40 bg-white/10 px-2.5 py-0.5 text-[9px] font-extrabold uppercase text-blue-100">
                  {threadRecords.length} {threadRecords.length === 1 ? "Email" : "Emails"}
                </span>
              </div>
              <h2 className="mt-2 truncate font-heading text-xl font-bold tracking-tight">
                {candidate.candidateName}
              </h2>
              <div className="mt-1 space-y-1">
                {emailAddresses.map((email) => (
                  <p
                    key={email}
                    className="flex items-start gap-1.5 text-[10px] font-medium text-blue-100"
                  >
                    <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0 break-all">{email}</span>
                  </p>
                ))}
              </div>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-blue-100 hover:bg-white/10 hover:text-white"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="border-b border-sibs-border bg-white px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-sibs-border bg-sibs-surface px-3 py-3">
              <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
                <BriefcaseBusiness className="h-3.5 w-3.5" /> Position
              </p>
              <p className="mt-1 truncate text-[11px] font-extrabold text-sibs-navy">{candidate.position}</p>
            </div>
            <div className="rounded-xl border border-sibs-border bg-sibs-surface px-3 py-3">
              <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
                <UserRound className="h-3.5 w-3.5" /> Account
              </p>
              <p className="mt-1 truncate text-[11px] font-extrabold text-sibs-navy">{candidate.account}</p>
            </div>
            <div className="rounded-xl border border-sibs-border bg-sibs-surface px-3 py-3">
              <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
                <MapPin className="h-3.5 w-3.5" /> Site
              </p>
              <p className="mt-1 truncate text-[11px] font-extrabold text-sibs-navy">{candidate.site}</p>
            </div>
          </div>

          {candidate.candidateId || candidate.candidatePipelineId ? (
            <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-bold text-sibs-muted">
              {candidate.candidateId ? (
                <span className="rounded-md bg-slate-100 px-2 py-1">Candidate ID: {candidate.candidateId}</span>
              ) : null}
              {candidate.candidatePipelineId ? (
                <span className="rounded-md bg-slate-100 px-2 py-1">Pipeline ID: {candidate.candidatePipelineId}</span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-extrabold text-sibs-navy">All Email Communications</h3>
              <p className="mt-0.5 text-[10px] font-semibold text-sibs-muted">
                Complete email history for this candidate, newest first. Candidate Gmail replies are included automatically.
              </p>
              {!gmailReplyState.connected ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p className="text-[9px] font-bold text-amber-600">
                    {gmailReplyState.reason || "Connect the SiBS recruitment Gmail mailbox to display candidate replies."}
                  </p>
                  <button
                    type="button"
                    onClick={connectGmailReplies}
                    disabled={gmailConnecting}
                    className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-[9px] font-extrabold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {gmailConnecting ? "Connecting…" : "Connect Gmail Replies"}
                  </button>
                </div>
              ) : gmailReplyState.mailbox ? (
                <p className="mt-1 text-[9px] font-bold text-emerald-600">
                  Gmail replies synced from {gmailReplyState.mailbox}
                </p>
              ) : null}
            </div>
          </div>

          <div className="relative pl-10">
            {threadRecords.length > 1 ? (
              <span
                aria-hidden="true"
                className="absolute bottom-5 left-[17px] top-5 w-px bg-slate-200"
              />
            ) : null}

            <div className="space-y-4">
              {threadRecords.map((record, index) => {
                const incomingReply =
                  record?.direction === "incoming" || Boolean(record?.isCandidateReply);

                return (
                <div key={record.id} className="relative">
                  <span
                    aria-hidden="true"
                    className={`absolute -left-10 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border-4 border-sibs-surface shadow-sm ${
                      incomingReply
                        ? "bg-sky-600 text-white"
                        : index === 0
                          ? "bg-sibs-navy text-white"
                          : "bg-white text-sibs-muted"
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </span>

                  <article className="w-full overflow-hidden rounded-xl border border-sibs-border bg-white text-left shadow-xs">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
                          <Send className="h-3 w-3" />
                          {incomingReply
                            ? "Candidate reply"
                            : index === 0
                              ? "Latest email"
                              : "SiBS email"}
                        </span>
                        <span className="rounded bg-white px-2 py-0.5 text-[8.5px] font-extrabold uppercase text-sibs-secondary ring-1 ring-slate-200">
                          {record.category}
                        </span>
                        <StatusBadge status={record.status} />
                      </div>
                      <span className="shrink-0 text-[9px] font-semibold text-sibs-faint">
                        {formatDispatchDate(record.dispatchedAt)}
                      </span>
                    </div>

                    <div className="px-4 py-4 sm:px-5">
                      <p className="text-[12px] font-extrabold leading-5 text-sibs-navy">
                        {record.subject}
                      </p>
                      <div className="mt-2 grid gap-1 text-[9px] font-semibold text-sibs-faint sm:grid-cols-[1fr_auto] sm:items-start">
                        <div className="min-w-0">
                          <p className="break-all">
                            <span className="text-sibs-muted">From:</span>{" "}
                            {incomingReply
                              ? record.senderName || record.dispatchedBy || record.senderEmail || "Candidate"
                              : record.dispatchedBy || "SiBS HRIS"}
                            {record.senderEmail ? ` <${record.senderEmail}>` : ""}
                          </p>
                          <p className="mt-0.5 break-all">
                            <span className="text-sibs-muted">To:</span>{" "}
                            {incomingReply
                              ? record.toAddress || record.recipient || record.email || "SiBS Recruitment"
                              : `${record.recipient} · ${record.email}`}
                          </p>
                        </div>
                        <span className="font-mono sm:text-right">LOG ID: {record.id}</span>
                      </div>
                    </div>

                    <ThreadEmailBody record={record} />
                  </article>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
