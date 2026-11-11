import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import chatSocket from "@/lib/axios/chatSocket";
import {
  AlertCircle, ArrowDown, CheckCircle2, FileText, Loader2, Paperclip,
  RefreshCcw, Reply, Send, X,
} from "lucide-react";
import {
  getChatAttachmentUrl,
  getChatMessages,
  getHelpdeskTicketDetails,
  markChatRead,
  sendChatMessage,
} from "@/lib/axios/sibsChat";

const PAGE_SIZE = 75;
const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const CHAT_TIME = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric",
  hour: "numeric", minute: "2-digit", hour12: true,
});
const PH_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit",
});
const clean = (value) => String(value ?? "").trim();
const toId = (value) => Number(value?.id || 0);
const sortMessages = (items) => [...items].sort((a, b) => toId(a) - toId(b));
const mergeMessages = (prior, incoming) => sortMessages(Array.from(
  new Map([...prior, ...incoming].filter((message) => toId(message) > 0).map((message) => [toId(message), message])).values(),
));
const formatChatDate = (date) => {
  const timestamp = new Date(date);
  return Number.isFinite(timestamp.getTime()) ? CHAT_TIME.format(timestamp) : "";
};
const getDay = (date) => {
  const timestamp = new Date(date);
  return Number.isFinite(timestamp.getTime()) ? PH_DAY.format(timestamp) : "";
};

/**
 * Show the same authenticated HRIS profile photos used by SiBS Chat. The
 * 160px preview is portaled above the Helpdesk modal (z-1600); a missing photo
 * falls back to employee initials rather than showing a broken image.
 */
function HelpdeskSenderAvatar({ employee, name, sibsId }) {
  const avatarRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [failedUrl, setFailedUrl] = useState("");
  const [position, setPosition] = useState(null);
  const source = clean(employee?.profilePictureUrl || employee?.profile_picture_url);
  const filename = clean(employee?.profileFilename || employee?.profile_filename || employee?.profilePicture || employee?.profile_picture);
  const imageUrl = source
    ? getChatAttachmentUrl(source)
    : filename ? getChatAttachmentUrl(`/api/employee-profile/file/${encodeURIComponent(filename)}`) : "";
  const initials = clean(employee?.initials) || clean(name).split(/[\s,]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || clean(sibsId).slice(0, 2) || "?";
  const showImage = Boolean(imageUrl) && failedUrl !== imageUrl;

  useEffect(() => { setFailedUrl(""); }, [imageUrl]);
  useEffect(() => {
    if (!visible) return undefined;
    const reposition = () => {
      const rect = avatarRef.current?.getBoundingClientRect();
      if (!rect) return;
      const below = rect.top < 188;
      setPosition({
        x: Math.min(Math.max(rect.left + rect.width / 2, 88), window.innerWidth - 88),
        y: below ? rect.bottom + 12 : rect.top - 12,
        below,
      });
    };
    reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [visible]);

  return (
    <>
      <button
        ref={avatarRef}
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        aria-label={`View ${name || `SiBS ID ${sibsId}`} profile photo`}
        className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sibs-navy text-[10px] font-extrabold text-white shadow-sm ring-1 ring-sibs-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-sibs-orange"
      >
        <span>{initials.slice(0, 2)}</span>
        {showImage && (
          <img src={imageUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" onError={() => setFailedUrl(imageUrl)} />
        )}
      </button>
      {visible && position && typeof document !== "undefined" && createPortal(
        <div
          className="pointer-events-none fixed z-[2000] rounded-2xl border border-sibs-border bg-white p-2 shadow-2xl"
          aria-hidden="true"
          style={{ left: position.x, top: position.y, transform: position.below ? "translate(-50%, 0)" : "translate(-50%, -100%)" }}
        >
          <div className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-xl bg-sibs-navy text-2xl font-extrabold text-white">
            <span>{initials.slice(0, 2)}</span>
            {showImage && <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" onError={() => setFailedUrl(imageUrl)} />}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

/**
 * The support desk reads and replies to a Helpdesk case here, independently of
 * the floating SiBS Chat window. All reads and writes still use authenticated
 * existing Chat endpoints, which enforce conversation membership server-side.
 * Closed tickets are historical, immutable conversations.
 */
export default function HelpdeskCaseConversation({
  conversation, ticket, currentSibsId, onMessagesChanged,
}) {
  const conversationId = Number(conversation?.id || 0);
  const status = clean(ticket?.status).toUpperCase();
  const isRejected = status === "REJECTED";
  const isClosed = status === "RESOLVED" || isRejected;
  const isAssignedSupport = Boolean(ticket?.acceptedBySibsId) &&
    clean(ticket.acceptedBySibsId) === clean(currentSibsId);
  const canReply = isAssignedSupport && ["IN_PROGRESS", "PENDING"].includes(status);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastReadIdRef = useRef(0);
  const fetchingRef = useRef(false);
  const lastMessageIdRef = useRef(0);
  const needScrollToBottomRef = useRef(true);
  const sendingRef = useRef(false);
  const previousCountRef = useRef(0);
  const onMessagesChangedRef = useRef(onMessagesChanged);
  onMessagesChangedRef.current = onMessagesChanged;

  // One mounted instance is always bound to a single case ID (keyed by parent).
  const loadLatest = useCallback(async ({ initial = false, manual = false } = {}) => {
    if (!conversationId || fetchingRef.current) return;
    fetchingRef.current = true;
    if (manual) setRefreshing(true);
    try {
      const result = sortMessages(await getChatMessages(conversationId, { limit: PAGE_SIZE }));
      const latestId = toId(result.at(-1));
      const pane = scrollRef.current;
      const wasNearBottom = !pane || pane.scrollHeight - pane.scrollTop - pane.clientHeight < 96;
      if (initial || wasNearBottom) needScrollToBottomRef.current = true;
      setMessages((previous) => {
        // Preserve earlier pages on refresh; replace current records by ID to
        // reflect edits/unsent status without inserting duplicate messages.
        const merged = mergeMessages(previous, result);
        return previous.length === merged.length && previous.every((item, index) =>
          toId(item) === toId(merged[index]) &&
          clean(item.messageText) === clean(merged[index].messageText) &&
          clean(item.messageType) === clean(merged[index].messageType)
        ) ? previous : merged;
      });
      if (initial) setHasOlder(result.length === PAGE_SIZE);
      if (latestId > lastMessageIdRef.current) {
        if (lastMessageIdRef.current > 0) onMessagesChangedRef.current?.({ refreshTicket: true });
        lastMessageIdRef.current = latestId;
      }
      // A case is marked read only while its detail modal is actively visible.
      if (latestId > lastReadIdRef.current && document.visibilityState === "visible") {
        try {
          await markChatRead(conversationId, latestId);
          lastReadIdRef.current = latestId;
          onMessagesChangedRef.current?.({ refreshConversationList: true });
        } catch { /* A failed read acknowledgement must not hide messages. */ }
      }
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load this case's conversation.");
    } finally {
      fetchingRef.current = false;
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  }, [conversationId]);

  useEffect(() => {
    // Socket.IO is the immediate path when both users are connected to the
    // same HRIS instance. Existing ChatContext owns the socket connection.
    // A short safety poll also catches localhost/production writes when their
    // servers do not share a Socket.IO adapter. Polling never requires focus.
    let active = true;
    void loadLatest({ initial: true });

    const onMessage = ({ conversationId: eventId, message } = {}) => {
      if (!active || Number(eventId) !== conversationId) return;
      if (toId(message)) {
        const pane = scrollRef.current;
        if (!pane || pane.scrollHeight - pane.scrollTop - pane.clientHeight < 96) {
          needScrollToBottomRef.current = true;
        }
        setMessages((previous) => mergeMessages(previous, [message]));
      }
      // Fetch the authenticated viewer-specific data (sender photo, reply
      // previews, attachment permissions) and mark the message read if visible.
      void loadLatest();
    };
    const onUnsent = ({ conversationId: eventId, message } = {}) => {
      if (!active || Number(eventId) !== conversationId) return;
      if (toId(message)) {
        setMessages((previous) => previous.map((item) => toId(item) === toId(message) ? message : item));
      }
      void loadLatest();
    };
    const onConversationUpdate = ({ conversationId: eventId, reason } = {}) => {
      if (!active || Number(eventId) !== conversationId) return;
      if (String(reason || "").startsWith("helpdesk-ticket-")) {
        onMessagesChangedRef.current?.({ refreshTicket: true, refreshConversationList: true });
      }
      void loadLatest();
    };
    const onFocus = () => { if (active) void loadLatest(); };
    const onVisibility = () => {
      if (active && document.visibilityState === "visible") void loadLatest();
    };

    chatSocket.on("chat:message", onMessage);
    chatSocket.on("chat:message-unsent", onUnsent);
    chatSocket.on("chat:conversation-updated", onConversationUpdate);
    chatSocket.on("connect", onFocus);
    const interval = window.setInterval(() => {
      if (active && !sendingRef.current && !isClosed) void loadLatest();
    }, 2000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      window.clearInterval(interval);
      chatSocket.off("chat:message", onMessage);
      chatSocket.off("chat:message-unsent", onUnsent);
      chatSocket.off("chat:conversation-updated", onConversationUpdate);
      chatSocket.off("connect", onFocus);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [conversationId, isClosed, loadLatest]);

  useLayoutEffect(() => {
    const pane = scrollRef.current;
    if (pane && needScrollToBottomRef.current && messages.length) {
      pane.scrollTop = pane.scrollHeight;
      needScrollToBottomRef.current = false;
    }
    previousCountRef.current = messages.length;
  }, [messages]);

  const loadEarlier = async () => {
    const firstId = toId(messages[0]);
    if (!hasOlder || !firstId || loadingOlder) return;
    setLoadingOlder(true);
    const pane = scrollRef.current;
    const previousHeight = pane?.scrollHeight || 0;
    const previousTop = pane?.scrollTop || 0;
    try {
      const older = await getChatMessages(conversationId, { before: firstId, limit: PAGE_SIZE });
      setHasOlder(older.length === PAGE_SIZE);
      setMessages((previous) => mergeMessages(older, previous));
      window.requestAnimationFrame(() => {
        if (pane) pane.scrollTop = previousTop + (pane.scrollHeight - previousHeight);
      });
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load earlier messages.");
    } finally {
      setLoadingOlder(false);
    }
  };

  const chooseFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selected.length) return;
    if (selected.length + files.length > MAX_FILES) {
      setError(`Only ${MAX_FILES} files may be attached to a message.`);
      return;
    }
    if (selected.some((file) => file.size > MAX_FILE_BYTES)) {
      setError("Each attachment must be 10 MB or smaller.");
      return;
    }
    setFiles((existing) => [...existing, ...selected]);
    setError("");
  };

  const send = async (event) => {
    event?.preventDefault?.();
    if (!canReply || sending || (!clean(draft) && !files.length)) return;
    setSending(true);
    sendingRef.current = true;
    setError("");
    try {
      // Recheck the authoritative ticket at submit time; an assigned support
      // member must never accidentally open a new case by replying to one
      // which another session has already resolved.
      const freshTicket = await getHelpdeskTicketDetails(conversationId);
      if (["RESOLVED", "REJECTED"].includes(clean(freshTicket?.status).toUpperCase()) ||
          clean(freshTicket?.acceptedBySibsId) !== clean(currentSibsId)) {
        onMessagesChangedRef.current?.({ refreshTicket: true, refreshConversationList: true });
        throw new Error("This request is finalized or no longer assigned to you. Refresh to continue.");
      }
      const sent = await sendChatMessage(conversationId, {
        message: draft.trim(), images: files,
        replyToMessageId: replyTo?.id || null,
      });
      // The server must not redirect a support response to a new case.
      if (sent?.conversationId && Number(sent.conversationId) !== conversationId) {
        throw new Error("This case has changed. Refresh its details before replying.");
      }
      if (sent?.id) setMessages((old) => mergeMessages(old, [sent]));
      setDraft("");
      setFiles([]);
      setReplyTo(null);
      needScrollToBottomRef.current = true;
      onMessagesChangedRef.current?.({ refreshTicket: true, refreshConversationList: true });
      await loadLatest({ manual: false });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to send the support reply.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sibs-border px-4 py-3">
        <div>
          <h3 className="sibs-modal-section-title">{isRejected ? "Request conversation" : "Case conversation"}</h3>
          {!isClosed && <p className="sibs-modal-section-subtitle mt-0.5">
            {canReply ? "Reply to the employee from this Helpdesk case" : "Case conversation · support access"}
          </p>}
        </div>
        <button type="button" onClick={() => void loadLatest({ manual: true })} disabled={loading || refreshing}
          className="sibs-modal-btn-secondary min-h-11 sm:min-h-0"
          title="Refresh messages"><RefreshCcw size={13} className={refreshing ? "motion-safe:animate-spin" : ""} /> Refresh</button>
      </div>
      <div ref={scrollRef} role="region" aria-label="Conversation messages" tabIndex={0}
        className="sibs-scrollbar min-h-44 max-h-[min(430px,45dvh)] flex-1 space-y-3 overflow-y-auto bg-sibs-surface px-3 py-4 sm:px-4 lg:min-h-[280px]"
        aria-live="polite" aria-busy={loading}>
        {loading && !messages.length ? (
          <div className="flex h-40 items-center justify-center gap-2 text-xs font-semibold text-sibs-muted"><Loader2 className="motion-safe:animate-spin" size={17} /> Loading messages…</div>
        ) : (
          <>
            {hasOlder && <div className="flex justify-center"><button type="button" onClick={() => void loadEarlier()} disabled={loadingOlder}
              className="rounded-lg bg-white px-3 py-1.5 text-[10px] font-bold text-sibs-navy shadow-xs hover:bg-sibs-surface disabled:opacity-50">
              {loadingOlder ? <Loader2 size={13} className="inline motion-safe:animate-spin" /> : <ArrowDown size={13} className="inline rotate-180" />} Load earlier messages
            </button></div>}
            {messages.map((message, index) => {
              const senderId = clean(message.senderSibsId);
              const mine = senderId === clean(currentSibsId);
              const member = (conversation?.members || []).find((item) => clean(item.sibsId) === senderId);
              const senderName = clean(member?.preferredName || member?.displayName || message.sender?.preferredName || message.sender?.displayName) || `SiBS ID ${senderId}`;
              const role = clean(conversation?.helpdeskSenderIdentifiers?.[senderId]);
              const type = clean(message.messageType).toUpperCase();
              const systemMessage = type === "MEMBER_ADDED" || type === "MEMBER_REMOVED";
              const unsent = message.unsent || type === "UNSENT";
              const day = getDay(message.createdAt);
              const previousDay = index ? getDay(messages[index - 1].createdAt) : "";
              const isOpeningMessage = Number(message.id) === Number(ticket?.firstMessageId || conversation?.caseFirstMessageId);
              const caseNumber = clean(ticket?.caseCode || conversation?.caseCode).split("-").at(-1);
              return (
                <div key={message.id}>
                  {day && day !== previousDay && <p className="my-2 text-center text-[10px] font-extrabold text-sibs-muted">{formatChatDate(message.createdAt)}</p>}
                  {isOpeningMessage && <p className="mx-auto mb-3 w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-center text-[10px] font-extrabold text-sibs-navy">Case Opened #{caseNumber || "—"} · {formatChatDate(ticket?.postedAt || message.createdAt)}</p>}
                  {systemMessage ? (
                    <p className="mx-auto max-w-[85%] rounded-full bg-slate-200/75 px-3 py-1 text-center text-[10px] text-sibs-muted">{clean(message.messageText)}</p>
                  ) : (
                    <div className={`group flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                      {!mine && <HelpdeskSenderAvatar employee={message.sender || member} name={senderName} sibsId={senderId} />}
                      <div className={`min-w-0 max-w-[80%] sm:max-w-[75%] ${mine ? "items-end" : "items-start"}`}>
                        <div className={`mb-1 flex flex-wrap items-center gap-1.5 ${mine ? "justify-end" : "justify-start"}`}>
                          <span className="sibs-text-xs font-extrabold text-sibs-navy">{mine ? "You" : senderName}</span>
                          {role && <span className="sibs-modal-section-subtitle rounded-md border border-sibs-border bg-white px-1.5 py-0.5">{role}</span>}
                        </div>
                        <div className={`sibs-text-xs rounded-2xl px-3 py-2 font-semibold leading-relaxed wrap-anywhere shadow-xs ${mine ? "rounded-br-sm bg-sibs-navy text-white" : "rounded-bl-sm border border-sibs-border bg-white text-sibs-navy"}`}>
                          {message.replyTo && <div className={`mb-2 rounded-lg border-l-[3px] px-2 py-1 text-[10px] ${mine ? "border-white/70 bg-white/10" : "border-sibs-orange bg-sibs-surface"}`}>
                            <b>{clean(message.replyTo.sender?.displayName) || `SiBS ID ${message.replyTo.senderSibsId}`}</b><p className="line-clamp-2">{clean(message.replyTo.messageText) || "Attachment"}</p>
                          </div>}
                          {unsent ? <span className="italic opacity-75">Message was unsent</span> : <>
                            {clean(message.messageText) && <p className="whitespace-pre-wrap break-words">{message.messageText}</p>}
                            {clean(message.gifUrl) && <a href={getChatAttachmentUrl(message.gifUrl)} target="_blank" rel="noreferrer"><img src={getChatAttachmentUrl(message.gifUrl)} alt="Shared GIF" className="mt-1 max-h-52 max-w-full rounded-lg object-contain" /></a>}
                            {(message.attachments || []).map((attachment) => {
                              const url = getChatAttachmentUrl(attachment.url);
                              if (!url) return null;
                              const attachmentName = clean(attachment.fileName || attachment.originalName || attachment.filename) || "Attachment";
                              const image = clean(attachment.mimeType).startsWith("image/");
                              return <a key={attachment.id || url} href={url} target="_blank" rel="noreferrer" className={`mt-1 block rounded-lg ${mine ? "text-white" : "text-sibs-navy"}`}>
                                {image ? <img src={url} alt={attachmentName} loading="lazy" className="max-h-56 max-w-full rounded-lg object-contain" />
                                  : <span className="flex items-center gap-1.5 underline"><FileText size={14} />{attachmentName}</span>}
                              </a>;
                            })}
                          </>}
                        </div>
                        <div className={`sibs-modal-section-subtitle mt-1 flex flex-wrap items-center gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                          <span>{formatChatDate(message.createdAt)}</span>
                          {canReply && !unsent && <button type="button" onClick={() => setReplyTo(message)} className="inline-flex items-center gap-1 hover:text-sibs-orange"><Reply size={11} />Reply</button>}
                        </div>
                      </div>
                      {mine && <HelpdeskSenderAvatar employee={message.sender || member} name={senderName} sibsId={senderId} />}
                    </div>
                  )}
                </div>
              );
            })}
            {status === "RESOLVED" && messages.length > 0 && <p className="mx-auto my-4 w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-center text-[10px] font-extrabold text-emerald-700">Case Closed #{clean(ticket?.caseCode).split("-").at(-1) || "—"} · {formatChatDate(ticket?.resolvedAt)}</p>}
            {!messages.length && !loading && <p className="py-14 text-center text-xs font-semibold text-sibs-muted">No messages have been sent in this case.</p>}
          </>
        )}
      </div>
      {error && <div role="alert" className="flex items-start gap-2 border-t border-red-100 bg-red-50 px-4 py-2 text-[11px] font-bold text-red-700"><AlertCircle size={14} className="shrink-0" />{error}</div>}
      {canReply ? (
        <form onSubmit={send} className="border-t border-sibs-border bg-white px-3 py-3">
          {replyTo && <div className="mb-2 flex items-center justify-between rounded-lg border-l-[3px] border-sibs-orange bg-sibs-surface px-2.5 py-2 text-[10px] text-sibs-navy">
            <span className="min-w-0 truncate"><b>Replying to {clean(replyTo.sender?.displayName) || `SiBS ID ${replyTo.senderSibsId}`}</b> · {clean(replyTo.messageText) || "Attachment"}</span>
            <button type="button" onClick={() => setReplyTo(null)} aria-label="Remove reply reference"><X size={13} /></button>
          </div>}
          {files.length > 0 && <div className="mb-2 flex flex-wrap gap-1.5">{files.map((file, i) => <span key={`${file.name}-${i}`} className="inline-flex items-center gap-1 rounded-md border border-sibs-border bg-sibs-surface px-2 py-1 text-[10px] font-semibold text-sibs-navy">{file.name}<button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles((old) => old.filter((_, n) => n !== i))}><X size={12} /></button></span>)}</div>}
          <div className="flex items-end gap-2">
            <input ref={fileInputRef} type="file" multiple hidden accept="image/*,.heic,.heif,.gif,.pdf,.doc,.docx,.xls,.xlsx,.csv,.mp4,.webm,.mp3,.wav" onChange={chooseFiles} />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={sending} title="Add attachments"
              className="mb-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sibs-border text-sibs-navy hover:border-sibs-orange hover:text-sibs-orange disabled:opacity-50"><Paperclip size={17} /></button>
            <textarea rows={2} value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Support reply" placeholder="Reply to this Helpdesk request…"
              onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }}
              disabled={sending} maxLength={10000}
              className="min-h-10 min-w-0 flex-1 resize-y rounded-xl border border-sibs-border bg-sibs-surface px-3 py-2.5 text-xs font-semibold text-sibs-navy outline-none focus:border-sibs-orange" />
            <button type="submit" disabled={sending || (!clean(draft) && !files.length)} aria-label="Send support reply"
              className="mb-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sibs-navy text-white transition hover:bg-sibs-navy-alt disabled:opacity-40">
              {sending ? <Loader2 size={16} className="motion-safe:animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] font-medium text-sibs-muted">Enter sends · Shift+Enter adds a new line · Up to five attachments</p>
        </form>
      ) : <div className="flex items-center gap-2 border-t border-sibs-border bg-sibs-surface px-4 py-3 text-[11px] font-bold text-sibs-muted">
        {isClosed ? <CheckCircle2 size={15} className="text-emerald-600" /> : <AlertCircle size={15} className="text-sibs-orange" />}
        {isClosed ? "Archived conversation. Replies are disabled." : status === "OPEN"
          ? "Accept the request before sending a support reply."
          : "Only the assigned support employee can reply to this request."}
      </div>}
    </div>
  );
}
