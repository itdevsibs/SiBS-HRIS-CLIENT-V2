import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle,
  CheckCircle2,
  Clock3,
  ClipboardList,
  FolderOpen,
  Ban,
  Loader2,
  X,
  Headset,
  HeartHandshake,
  Inbox,
  MapPin,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

import Header from "@/components/layout/Header";
import {
  DataCard,
  PageHeaderHero,
  ResponsiveTableShell,
  SearchInput,
  SelectDropdown,
  StatusFilterTabs,
  TablePagination,
  TableSkeletonRows,
} from "@/components/ui";
import { useChat } from "@/services/context/ChatContext";
import { useUser } from "@/services/context/UserContext";
import HelpdeskCaseConversation from "@/components/helpdesk/HelpdeskCaseConversation";
import {
  getChatAttachmentUrl,
  getChatHelpdeskSupportScope,
  getHelpdeskTicketSummaries,
  getHelpdeskTicketDetails,
  getHelpdeskTicketEligibility,
  acceptHelpdeskTicket,
  updateHelpdeskTicketStatus,
} from "@/lib/axios/sibsChat";

const PAGE_SIZE = 15;
const HELPDESK_CONFIG = {
  IT: {
    name: "IT Support",
    kicker: "IT Operations · Helpdesk",
    tableTitle: "IT Support Requests",
    searchPlaceholder: "Search IT requests by employee, SIBS ID, location, or message...",
    recordLabel: "IT Support requests",
    description: "Review technical concerns submitted by employees and coordinate responses with the IT support team.",
    empty: "No IT Support requests yet",
    icon: Headset,
  },
  TA_HR: {
    name: "TA/HR Concerns",
    kicker: "Talent Acquisition & HR · Helpdesk",
    tableTitle: "TA/HR Concerns Requests",
    searchPlaceholder: "Search TA/HR concerns by employee, SIBS ID, location, or message...",
    recordLabel: "TA/HR concerns",
    description: "Review recruitment, employee, and HR concerns submitted to the TA/HR support team.",
    empty: "No TA/HR concerns yet",
    icon: HeartHandshake,
  },
};
const DATE_FORMATTER = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
const ANIMATION = { table: 240 };

// Open cases are requests that still need support action. A selected Helpdesk
// category without a first message is a draft and never enters these counts.
const ACTIVE_CASE_STATUSES = new Set(["OPEN", "IN_PROGRESS", "PENDING"]);
function getCaseStatus(ticket, conversation = {}) {
  const status = safeText(ticket?.status || conversation?.caseStatus).toUpperCase();
  // Accept old CLOSED values in case the conversation cache predates the
  // ticket API's RESOLVED status without changing persistent records.
  return status === "CLOSED" ? "RESOLVED" : status;
}

function safeText(value) {
  return String(value ?? "").trim();
}

function getRequester(conversation = {}) {
  const sibsId = safeText(conversation.createdBySibsId || conversation.requester?.sibsId);
  const member = (conversation.members || []).find((item) => safeText(item.sibsId) === sibsId);
  const info = conversation.requester || member || {};
  const savedName = safeText(conversation.name).split(" · ").slice(1).join(" · ").trim();
  return {
    ...info,
    sibsId,
    name: safeText(info.displayName) || savedName || `SIBS ID ${sibsId || "Unknown"}`,
    location: safeText(info.assignedLocationLabel) || "Not assigned",
    initials: safeText(info.initials) || "EMP",
  };
}

function formatDate(value) {
  const time = Date.parse(value || "");
  return Number.isFinite(time) ? DATE_FORMATTER.format(time) : "—";
}

// The database case code is internal to the category (IT-1 / THR-1).
// Display the same human-readable case number used by SiBS Chat.
function getCaseNumber(ticket, conversation = {}) {
  const raw = safeText(ticket?.caseCode || conversation?.caseCode);
  const match = /^(?:IT|THR)-([1-9]\d*)$/i.exec(raw);
  return match ? Number(match[1]) : null;
}

function getCaseDisplayLabel(ticket, conversation = {}) {
  const caseNumber = getCaseNumber(ticket, conversation);
  const status = getCaseStatus(ticket, conversation);
  if (status === "REJECTED") return "Rejected request";
  if (!caseNumber) return "Case pending";
  return `Case ${status === "RESOLVED" ? "Closed" : "Opened"} #${caseNumber}`;
}

// Response Time is separate from queue wait: acceptance -> the FIRST real
// reply sent by a support member. Do not use secondsToAccept here (that is
// Queued Time). Never fabricate a response from a case's acceptedAt timestamp.
function getResponseDisplay(ticket) {
  if (!ticket) return { text: "—", pending: false };
  if (!ticket.acceptedAt) return { text: "Not accepted", pending: false };

  // v8 backend returns secondsToFirstResponse and firstResponseAt, derived
  // from real chat_messages. Avoid treating old/cached API rows as replies.
  const serverSeconds = ticket.secondsToFirstResponse;
  const hasServerSeconds = serverSeconds !== null && serverSeconds !== undefined
    && serverSeconds !== "" && Number.isFinite(Number(serverSeconds));
  const acceptedAtMs = Date.parse(ticket.acceptedAt || "");
  const firstResponseAtMs = Date.parse(ticket.firstResponseAt || "");
  const fallbackSeconds = Number.isFinite(acceptedAtMs) && Number.isFinite(firstResponseAtMs)
    && firstResponseAtMs >= acceptedAtMs
      ? Math.floor((firstResponseAtMs - acceptedAtMs) / 1000)
      : null;
  const responseSeconds = hasServerSeconds ? Number(serverSeconds) : fallbackSeconds;
  if (responseSeconds !== null && Number.isFinite(responseSeconds)) {
    return { text: formatElapsed(responseSeconds), pending: false };
  }

  // No actual support reply after acceptance: don't substitute queue time.
  return safeText(ticket.status).toUpperCase() === "RESOLVED"
    ? { text: "No reply", pending: false }
    : { text: "Awaiting reply", pending: true };
}

// Queued Time is strictly the waiting period BEFORE a support member accepts:
// opened_at (the first message) -> accepted_at (the acceptance action).
// Do not keep increasing it once the case is accepted, pending, or closed.
// Use the server-calculated duration to avoid client clock/timezone drift.
function getQueuedDisplay(ticket, nowMs) {
  if (!ticket?.postedAt) return { text: "—", pending: false, accepted: false };

  if (ticket.acceptedAt) {
    const serverSeconds = ticket.secondsToAccept;
    const start = Date.parse(ticket.postedAt);
    const end = Date.parse(ticket.acceptedAt);
    const elapsedSeconds = serverSeconds !== null && serverSeconds !== undefined && serverSeconds !== ""
      && Number.isFinite(Number(serverSeconds))
      ? Math.max(0, Number(serverSeconds))
      : Number.isFinite(start) && Number.isFinite(end)
        ? Math.max(0, Math.floor((end - start) / 1000))
        : null;
    return { text: formatElapsed(elapsedSeconds), pending: false, accepted: true };
  }

  // An unaccepted request is still queued only while its status is OPEN.
  // Older/inconsistent tickets with non-OPEN status and no acceptance timestamp
  // must not be made to look as though they're waiting for acceptance forever.
  if (safeText(ticket.status).toUpperCase() !== "OPEN") {
    return { text: "—", pending: false, accepted: false };
  }
  const opened = Date.parse(ticket.postedAt);
  if (!Number.isFinite(opened) || !Number.isFinite(nowMs)) {
    return { text: "—", pending: true, accepted: false };
  }
  return {
    text: formatElapsed(Math.max(0, Math.floor((nowMs - opened) / 1000))),
    pending: true,
    accepted: false,
  };
}

function getResolutionDisplay(ticket) {
  return ticket?.resolvedAt ? formatElapsed(ticket.secondsToResolve) : "Pending";
}

const AVATAR_TONES = [
  "border-orange-100 bg-orange-50 text-sibs-orange",
  "border-emerald-100 bg-emerald-50 text-emerald-700",
  "border-blue-100 bg-blue-50 text-sibs-navy",
  "border-violet-100 bg-violet-50 text-violet-700",
  "border-rose-100 bg-rose-50 text-rose-700",
];

function RequesterAvatar({ requester }) {
  const photo = safeText(requester?.profilePictureUrl || requester?.profile_picture_url);
  const url = photo ? getChatAttachmentUrl(photo) : "";
  const [failedUrl, setFailedUrl] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(null);
  const elementRef = useRef(null);
  const initials = safeText(requester.initials).slice(0, 2) || "EM";
  const toneIndex = [...safeText(requester.sibsId)].reduce((sum, character) => sum + character.charCodeAt(0), 0) % AVATAR_TONES.length;
  const tone = AVATAR_TONES[toneIndex];
  const showImage = Boolean(url) && failedUrl !== url;

  const updatePreviewPosition = useCallback(() => {
    const rect = elementRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = rect.top < 188;
    setPreviewPosition({
      top: below ? rect.bottom + 10 : rect.top - 10,
      left: rect.left + rect.width / 2,
      below,
    });
  }, []);

  useEffect(() => {
    if (!previewVisible || !showImage) return undefined;
    window.addEventListener("scroll", updatePreviewPosition, true);
    window.addEventListener("resize", updatePreviewPosition);
    return () => {
      window.removeEventListener("scroll", updatePreviewPosition, true);
      window.removeEventListener("resize", updatePreviewPosition);
    };
  }, [previewVisible, showImage, updatePreviewPosition]);

  const avatarContent = (large = false) => (
    <span className={`relative flex ${large ? "h-36 w-36 rounded-xl text-2xl" : "h-9 w-9 rounded-full text-xs"} shrink-0 items-center justify-center overflow-hidden border font-extrabold shadow-inner ${tone}`}>
      {initials}
      {showImage ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailedUrl(url)}
        />
      ) : null}
    </span>
  );

  // If there is no picture, retain the initials avatar without a blank hover preview.
  if (!showImage) {
    return (
      <span className="relative inline-flex shrink-0 select-none">
        {avatarContent(false)}
      </span>
    );
  }

  return (
    <>
      <span
        ref={elementRef}
        tabIndex={0}
        aria-label={`${requester.name} profile picture`}
        className="relative inline-flex shrink-0 cursor-pointer outline-none"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        onMouseEnter={() => { updatePreviewPosition(); setPreviewVisible(true); }}
        onMouseLeave={() => setPreviewVisible(false)}
        onFocus={() => { updatePreviewPosition(); setPreviewVisible(true); }}
        onBlur={() => setPreviewVisible(false)}
      >
        {avatarContent()}
      </span>
      {previewVisible && previewPosition && typeof document !== "undefined" ? createPortal(
        <span
          className="pointer-events-none fixed z-[9999] rounded-2xl border border-sibs-border bg-white p-2 shadow-[0_18px_45px_rgba(4,44,81,0.22)]"
          style={{
            top: previewPosition.top,
            left: previewPosition.left,
            transform: previewPosition.below ? "translate(-50%, 0)" : "translate(-50%, -100%)",
          }}
          aria-hidden="true"
        >
          {avatarContent(true)}
        </span>, document.body,
      ) : null}
    </>
  );
}

function UnreadBadge({ count }) {
  return count > 0 ? (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-sibs-orange px-1.5 py-0.5 text-[10px] font-black text-white">
      {count > 99 ? "99+" : count}
    </span>
  ) : null;
}

function MobileRequestCard({ conversation, requester, ticket, onOpen, opening, index, nowMs }) {
  const unread = Number(conversation.unreadCount || 0);
  const queued = getQueuedDisplay(ticket, nowMs);
  return (
    <DataCard
      interactive
      index={index}
      onClick={onOpen}
      aria-label={`Open ${requester.name}'s Helpdesk request`}
      className={opening ? "opacity-60" : ""}
    >
      <div className="flex items-start gap-2.5">
        <RequesterAvatar requester={requester} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="break-words text-[13px] font-extrabold text-sibs-navy">{requester.name}</p>
            <UnreadBadge count={unread} />
          </div>
          <p className="mt-1 sibs-text-micro font-bold text-sibs-navy">SiBS ID: {requester.sibsId || "—"} · <span className="text-sibs-muted">{getCaseDisplayLabel(ticket, conversation)}</span></p>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-sibs-muted"><MapPin size={12} />{requester.location}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-sibs-border pt-2.5">
        <span className="flex items-center gap-1.5"><TicketStatusBadge status={ticket?.status} /></span>
        <span className="text-[10px] font-semibold text-sibs-muted">Response: {getResponseDisplay(ticket).text}</span>
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-sibs-muted">
        <span>Time waiting for acceptance: <span className={queued.pending ? "font-extrabold text-sibs-orange" : "font-bold text-sibs-navy"}>{queued.text}</span></span>
        {queued.pending ? <span className="text-[10px] text-sibs-orange">Waiting for acceptance</span> : null}
      </p>
      <p className="mt-2 text-[11px] font-semibold text-sibs-muted">Opened: {formatDate(ticket?.postedAt)}</p>
      <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-sibs-muted">
        <span>{formatDate(conversation.lastMessageAt || conversation.updatedAt || conversation.createdAt)}</span>
        <span className="inline-flex items-center gap-1 font-bold text-sibs-navy">View details <ArrowUpRight size={13} /></span>
      </div>
    </DataCard>
  );
}


const TICKET_STATUS_LABELS = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  PENDING: "Pending",
  RESOLVED: "Closed",
  REJECTED: "Rejected",
};
const TICKET_STATUS_COLORS = {
  OPEN: "bg-blue-50 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-orange-50 text-orange-700 border-orange-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
};

function TicketStatusBadge({ status }) {
  if (!TICKET_STATUS_LABELS[status]) return <span className="text-[11px] text-sibs-muted">Loading status...</span>;
  const statusDotColors = {
    OPEN: "bg-blue-500",
    IN_PROGRESS: "bg-orange-500",
    PENDING: "bg-amber-500",
    RESOLVED: "bg-emerald-500",
    REJECTED: "bg-rose-500",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${TICKET_STATUS_COLORS[status]}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotColors[status]}`} aria-hidden="true" />
      {TICKET_STATUS_LABELS[status]}
    </span>
  );
}

function formatElapsed(value) {
  if (value === null || value === undefined || value === "") return "—";
  const seconds = Math.max(0, Number(value) || 0);
  if (seconds < 60) return "< 1 min";
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours < 1) return `${minutes} min`;
  return `${hours} hr${hours === 1 ? "" : "s"}${minutes % 60 ? ` ${minutes % 60} min` : ""}`;
}

// Compact date/value line for Request details: no individual timestamp cards.
// Keep the full event history but use a simple list with subtle separators.
function TicketTimestamp({ label, value }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2.5">
      <dt className="text-[11px] font-semibold text-sibs-muted">{label}</dt>
      <dd className="m-0 text-xs font-bold text-sibs-navy">{formatDate(value)}</dd>
    </div>
  );
}

function HelpdeskTicketModal({ conversation, ticket, loading, eligibility, eligibilityLoading, busy, error,
  currentSibsId, onClose, onAccept, onUpdateStatus, onMessagesChanged }) {
  const requester = getRequester(conversation);
  const isAssignee = Boolean(ticket?.acceptedBySibsId) && safeText(ticket.acceptedBySibsId) === currentSibsId;
  const assignee = (conversation.members || []).find((m) => safeText(m.sibsId) === safeText(ticket?.acceptedBySibsId));
  const [now, setNow] = useState(Date.now());
  const [selectedStatus, setSelectedStatus] = useState("IN_PROGRESS");
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => { setSelectedStatus(ticket?.status || "IN_PROGRESS"); }, [ticket?.status]);
  useEffect(() => {
    if (["RESOLVED", "REJECTED"].includes(ticket?.status)) {
      setConfirmClose(false);
      setConfirmReject(false);
      setRejectionReason("");
    }
  }, [ticket?.status]);
  useEffect(() => {
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event) => {
      if (event.key !== "Escape" || busy) return;
      if (confirmClose) { setConfirmClose(false); return; }
      if (confirmReject) { setConfirmReject(false); return; }
      if (document.querySelector(".sibs-animated-dropdown.open")) return;
      onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => { document.body.style.overflow = priorOverflow; window.removeEventListener("keydown", handleEscape); };
  }, [busy, onClose, confirmClose, confirmReject]);

  // The SiBS HRIS modal is intentionally not dismissed by backdrop clicks.
  // Saving/closing a case is a separate, confirmed support action.
  const modalContent = (
    <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-[3px] sm:p-6"
      role="presentation" onMouseDown={(event) => event.stopPropagation()}>
      <section role="dialog" aria-modal="true" aria-label="Helpdesk case conversation and details"
        className="flex max-h-[94vh] w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl font-jakarta"
        onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-t-[3px] border-sibs-orange bg-sibs-navy px-5 py-4 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sibs-orange"><ClipboardList size={20} /></span>
            <div className="min-w-0">
              <h2 className="truncate font-heading text-lg font-bold">{getCaseDisplayLabel(ticket, conversation)}</h2>
              <p className="truncate text-xs font-semibold text-blue-100">{safeText(conversation.helpdeskCategory) === "IT" ? "IT Support" : "TA/HR Concerns"} · {requester.name}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close case details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50"><X size={18} /></button>
        </div>
        <div className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#f7f9fc] px-4 py-4 sm:px-6">
          {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">{error}</div>}
          {loading || !ticket ? <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-sibs-muted">
            {loading ? <Loader2 size={20} className="animate-spin" /> : <AlertCircle size={20} />}
            {loading ? "Loading request details..." : "Request details are unavailable. Close and retry."}
          </div> : (
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(310px,1fr)]">
              <div className="min-w-0 space-y-4">
                <HelpdeskCaseConversation
                  key={conversation.id}
                  conversation={conversation}
                  ticket={ticket}
                  currentSibsId={currentSibsId}
                  onMessagesChanged={onMessagesChanged}
                />
                <div className="rounded-2xl border border-sibs-border bg-white p-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sibs-border pb-3">
                    <h3 className="font-heading text-sm font-bold text-sibs-navy">Request details</h3>
                    <TicketStatusBadge status={ticket.status} />
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <RequesterAvatar requester={requester} />
                    <div className="min-w-0">
                      <p className="break-words text-sm font-extrabold text-sibs-navy">{requester.name}</p>
                      <p className="text-[11px] font-semibold text-sibs-muted">SiBS ID: {requester.sibsId} · Assigned site: {ticket.requesterSite || requester.location}</p>
                    </div>
                  </div>
                  <dl className="mt-3 divide-y divide-sibs-border border-t border-sibs-border">
                    <TicketTimestamp label={ticket.status === "REJECTED" ? "Received" : "Opened"} value={ticket.postedAt} />
                    <TicketTimestamp label="Assigned" value={ticket.assignedAt} />
                    <TicketTimestamp label="Accepted" value={ticket.acceptedAt} />
                    <TicketTimestamp label="First support reply" value={ticket.firstResponseAt} />
                    {ticket.status === "REJECTED"
                      ? <TicketTimestamp label="Rejected" value={ticket.rejectedAt} />
                      : <TicketTimestamp label="Closed" value={ticket.resolvedAt} />}
                  </dl>
                  {ticket.status === "REJECTED" && (
                    <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3">
                      <p className="text-[10px] font-extrabold uppercase text-rose-700">Rejection reason</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-xs font-semibold text-sibs-navy">{ticket.rejectionReason || "Not recorded"}</p>
                      <p className="mt-1 text-[10px] font-medium text-sibs-muted">Rejected by SiBS ID {ticket.rejectedBySibsId || "—"}</p>
                    </div>
                  )}
                                  </div>
              </div>
              <div className="min-w-0 space-y-4">
                <div className="rounded-2xl border border-sibs-border bg-white p-4 shadow-xs">
                  <h3 className="border-b border-sibs-border pb-3 font-heading text-sm font-bold text-sibs-navy">Ticket properties</h3>
                  <p className="mt-3 text-[10px] font-extrabold uppercase text-sibs-muted">Status</p>
                  <div className="mt-2"><TicketStatusBadge status={ticket.status} /></div>
                  <p className="mt-3 text-[10px] font-extrabold uppercase text-sibs-muted">Accepted by</p>
                  <p className="mt-1 break-words text-xs font-bold text-sibs-navy">{ticket.acceptedBySibsId
                    ? `${assignee?.displayName || `SiBS ID ${ticket.acceptedBySibsId}`} (${ticket.acceptedBySibsId})`
                    : "Unassigned"}</p>
                  {ticket.status === "OPEN" && (
                    <div className="mt-4 space-y-2">
                      <button type="button" onClick={onAccept} disabled={busy || eligibilityLoading || !eligibility?.eligible}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-sibs-orange px-4 py-2.5 text-xs font-extrabold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50">
                        {busy || eligibilityLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Accept Request
                      </button>
                      <p className="text-[11px] font-semibold leading-relaxed text-sibs-muted">{eligibilityLoading ? "Verifying today's Kronos attendance and assigned site..." : eligibility?.reason || "You are eligible to accept this request."}</p>
                      <button type="button" onClick={() => { setRejectionReason(""); setConfirmReject(true); }}
                        disabled={busy || eligibilityLoading || !eligibility?.eligible}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-xs font-extrabold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50">
                        <Ban size={14} /> Reject Request
                      </button>
                    </div>
                  )}
                  {isAssignee && !["RESOLVED", "REJECTED"].includes(ticket.status) && (
                    <div className="mt-4 space-y-2">
                      <SelectDropdown label="Update status" labelClassName="text-[10px] font-extrabold uppercase text-sibs-muted"
                        value={selectedStatus}
                        options={["IN_PROGRESS", "PENDING", "RESOLVED", "REJECTED"].map((status) => ({ value: status, label: TICKET_STATUS_LABELS[status] }))}
                        onChange={setSelectedStatus} clearable={false} disabled={busy} className="h-10 rounded-lg" />
                      <button type="button"
                        onClick={() => {
                          if (selectedStatus === "RESOLVED") setConfirmClose(true);
                          else if (selectedStatus === "REJECTED") { setRejectionReason(""); setConfirmReject(true); }
                          else onUpdateStatus(selectedStatus);
                        }}
                        disabled={busy || selectedStatus === ticket.status}
                        className="w-full rounded-lg bg-sibs-orange px-4 py-2.5 text-xs font-extrabold text-white hover:brightness-95 disabled:opacity-50">
                        {busy ? "Saving…" : selectedStatus === "RESOLVED" ? "Close Case" : selectedStatus === "REJECTED" ? "Reject Request" : "Save status"}
                      </button>
                    </div>
                  )}
                  {ticket.status === "RESOLVED" && <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700">This case is closed. Its conversation is archived and read-only.</p>}
                  {ticket.status === "REJECTED" && <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700">This request was rejected and is not included in open or closed case counts. The conversation is read-only.</p>}
                </div>
                {ticket.status !== "REJECTED" && <div className="rounded-2xl border border-sibs-border bg-white p-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sibs-border pb-3">
                    <h3 className="font-heading text-sm font-bold text-sibs-navy">Case durations</h3>
                    {ticket.status === "RESOLVED" && <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-extrabold text-emerald-700">Final</span>}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[ ["Queued before acceptance", getQueuedDisplay(ticket, now).text],
                      ["Response after acceptance", getResponseDisplay(ticket).text],
                      ["Total resolution", getResolutionDisplay(ticket)],
                      ["Handling after acceptance", ticket.resolvedAt ? formatElapsed(ticket.secondsToFinish) : "Pending"]
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-sibs-border bg-sibs-surface px-2.5 py-3 text-center">
                        <p className="text-[10px] font-bold leading-relaxed text-sibs-muted">{label}</p>
                        <p className="mt-1.5 text-sm font-extrabold text-sibs-navy">{value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] font-medium leading-relaxed text-sibs-muted">
                    Queue: first message → acceptance. Response: acceptance → first actual support reply.
                    Resolution: opening → closure. Handling: acceptance → closure.
                    {ticket.status === "RESOLVED" ? " All values are final." : " Unfinished durations are pending."}
                  </p>
                </div>}
                <div className="rounded-2xl border border-sibs-border bg-white p-4 shadow-xs">
                  <h3 className="font-heading text-sm font-bold text-sibs-navy">Activity timeline</h3>
                  <ol className="mt-3 space-y-3">
                    <li className="flex gap-2.5 text-xs text-sibs-navy"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" /><span><b>{ticket.status === "REJECTED" ? "Request received · first message sent" : "Case opened · first message sent"}</b><span className="block text-sibs-muted">{formatDate(ticket.postedAt)}</span></span></li>
                    {(ticket.history || []).map((entry, index) => (
                      <li key={`${entry.eventType}-${entry.occurredAt}-${index}`} className="flex gap-2.5 text-xs text-sibs-navy">
                        <Clock3 size={16} className="mt-0.5 shrink-0 text-sibs-orange" />
                        <span><b>{entry.eventType === "ACCEPTED" ? "Accepted and assigned" : entry.eventType === "RESOLVED" ? "Case closed" : entry.eventType === "REJECTED" ? "Request rejected" : `Status changed to ${TICKET_STATUS_LABELS[entry.newStatus] || entry.newStatus}`}</b>
                          <span className="block text-sibs-muted">{formatDate(entry.occurredAt)} · SiBS ID: {entry.actorSibsId}</span>
                          {entry.reason && <span className="mt-0.5 block whitespace-pre-wrap break-words text-rose-700">Reason: {entry.reason}</span>}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex shrink-0 justify-end border-t border-sibs-border bg-white px-5 py-3">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-sibs-border bg-white px-5 py-2 text-xs font-extrabold text-sibs-navy hover:bg-sibs-surface">Close</button>
        </div>
      </section>
      {confirmClose && ticket?.status !== "RESOLVED" && isAssignee && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-[2px]" role="presentation" onMouseDown={(event) => event.stopPropagation()}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="support-close-confirm-title"
            aria-describedby="support-close-confirm-description"
            className="w-full max-w-[410px] overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-[0_24px_70px_rgba(4,44,81,0.3)]">
            <div className="border-t-[4px] border-sibs-orange bg-sibs-navy px-5 py-4 text-white">
              <h3 id="support-close-confirm-title" className="font-heading text-sm font-extrabold">Close this case?</h3>
              <p className="mt-1 text-xs text-white/75">Confirm that the employee's concern is resolved.</p>
            </div>
            <p id="support-close-confirm-description" className="px-5 py-4 text-xs font-semibold leading-relaxed text-sibs-muted">Only close the case when the problem is fixed. This action cannot be undone, and the conversation will become read-only.</p>
            <div className="flex justify-end gap-2 border-t border-sibs-border bg-sibs-surface px-5 py-3">
              <button type="button" onClick={() => setConfirmClose(false)} disabled={busy}
                className="rounded-xl border border-sibs-border bg-white px-4 py-2.5 text-xs font-extrabold text-sibs-navy">Cancel</button>
              <button type="button" onClick={() => onUpdateStatus("RESOLVED")} disabled={busy}
                className="rounded-xl bg-sibs-orange px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50">{busy ? "Closing…" : "Close Case"}</button>
            </div>
          </section>
        </div>
      )}
      {confirmReject && ticket?.status !== "REJECTED" && (isAssignee || (ticket?.status === "OPEN" && eligibility?.eligible)) && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-[2px]" role="presentation" onMouseDown={(event) => event.stopPropagation()}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="support-reject-confirm-title"
            aria-describedby="support-reject-confirm-description"
            className="w-full max-w-[450px] overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-[0_24px_70px_rgba(4,44,81,0.3)]">
            <div className="border-t-[4px] border-sibs-orange bg-sibs-navy px-5 py-4 text-white">
              <h3 id="support-reject-confirm-title" className="font-heading text-sm font-extrabold">Reject this request?</h3>
              <p className="mt-1 text-xs text-white/75">A reason is required and will be visible in the request record.</p>
            </div>
            <div className="space-y-2 px-5 py-4">
              <p id="support-reject-confirm-description" className="text-xs font-semibold leading-relaxed text-sibs-muted">
                Use Rejected only for requests that cannot be actioned by this Helpdesk team. Rejected requests do not count as open or closed cases.
              </p>
              <label htmlFor="support-rejection-reason" className="block text-[11px] font-extrabold text-sibs-navy">Reason for rejection *</label>
              <textarea id="support-rejection-reason" value={rejectionReason} maxLength={1000} rows={4}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Explain why this request cannot be processed (e.g. unrelated to workplace support)."
                disabled={busy} autoFocus
                className="w-full resize-y rounded-xl border border-sibs-border bg-white px-3 py-2 text-xs text-sibs-navy outline-none focus:border-sibs-orange focus:ring-2 focus:ring-sibs-orange/20" />
              <p className="text-[10px] text-sibs-muted">{rejectionReason.trim().length}/1000 characters · minimum 1</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-sibs-border bg-sibs-surface px-5 py-3">
              <button type="button" onClick={() => setConfirmReject(false)} disabled={busy}
                className="rounded-xl border border-sibs-border bg-white px-4 py-2.5 text-xs font-extrabold text-sibs-navy">Cancel</button>
              <button type="button" onClick={() => onUpdateStatus("REJECTED", rejectionReason.trim())}
                disabled={busy || rejectionReason.trim().length < 1 || rejectionReason.trim().length > 1000}
                className="rounded-xl bg-sibs-orange px-4 py-2.5 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Rejecting…" : "Reject Request"}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
  return createPortal(modalContent, document.body);
}

export default function HelpdeskSupportPage({ category = "IT" }) {
  const config = HELPDESK_CONFIG[category] || HELPDESK_CONFIG.IT;
  const chat = useChat();
  const { user } = useUser();
  const userViewKey = `${safeText(user?.username || user?.sibsId || user?.sibs_id)}:${safeText(user?.role)}`;
  const mainScrollRef = useRef(null);
  const tableScrollRef = useRef(null);

  const [authorizedCategories, setAuthorizedCategories] = useState([]);
  const [authorizedLocationsByCategory, setAuthorizedLocationsByCategory] = useState({});
  const [checkingAccess, setCheckingAccess] = useState(true);
  // A route entry always gets a brief, visible skeleton animation, even when
  // the shared chat cache already contains all requests. The real page header
  // remains outside the skeleton and renders immediately.
  const [entrySkeletonVisible, setEntrySkeletonVisible] = useState(true);
  const [accessError, setAccessError] = useState("");
  const [search, setSearch] = useState("");
  const [assignedSite, setAssignedSite] = useState("All");
  const [sortBy, setSortBy] = useState("Recent");
  const [activeTab, setActiveTab] = useState("CaseOpen");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  
  const [openError, setOpenError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ticketSummaries, setTicketSummaries] = useState({});
  const [ticketsError, setTicketsError] = useState("");
  const [activeRequest, setActiveRequest] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketEligibility, setTicketEligibility] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const [ticketBusy, setTicketBusy] = useState(false);
  const [clockNow, setClockNow] = useState(Date.now());
  const detailControllerRef = useRef(null);

  useEffect(() => {
    // Route keys in router.jsx remount this component for every IT <-> TA/HR
    // switch. Ensure a cached/fast API response cannot skip the animation.
    // Reduced-motion users never receive an artificial animation delay.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      setEntrySkeletonVisible(false);
      return undefined;
    }
    const timeout = window.setTimeout(() => setEntrySkeletonVisible(false), 350);
    return () => window.clearTimeout(timeout);
  }, []);

  // Update only the visible open-case waiting duration once per minute.
  // Elapsed time is always calculated from the first actual message (postedAt).
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!document.hidden) setClockNow(Date.now());
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const loadAccess = useCallback(async ({ signal, quiet = false } = {}) => {
    if (!quiet) setCheckingAccess(true);
    setAccessError("");
    try {
      const scope = await getChatHelpdeskSupportScope({ signal });
      if (!signal?.aborted) {
        setAuthorizedCategories(scope.categories);
        setAuthorizedLocationsByCategory(scope.locationsByCategory);
      }
    } catch (error) {
      if (!signal?.aborted) {
        setAuthorizedCategories([]);
        setAuthorizedLocationsByCategory({});
        setAccessError(error?.response?.data?.message || "Unable to verify Helpdesk support access. Please retry.");
      }
    } finally {
      if (!signal?.aborted && !quiet) setCheckingAccess(false);
    }
  }, []);

  useEffect(() => {
    // An account may switch Admin <-> Employee without changing its SIBS ID.
    // Drop old access immediately; never display a privileged queue from the
    // previous view while its new signed session is being verified.
    setAuthorizedCategories([]);
    setAuthorizedLocationsByCategory({});
    setCheckingAccess(true);
    const controller = new AbortController();
    void loadAccess({ signal: controller.signal });
    return () => controller.abort();
  }, [loadAccess, userViewKey]);

  useLayoutEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [category]);

  useEffect(() => {
    setSearch("");
    setAssignedSite("All");
    setSortBy("Recent");
    setActiveTab("CaseOpen");
    setPage(1);
    setOpenError("");
    setStatusFilter("All");
    setActiveRequest(null);
    detailControllerRef.current?.abort();
  }, [category]);

  const allowed = !checkingAccess && !accessError && authorizedCategories.includes(category);
  const loadTicketSummaries = useCallback(async ({ signal } = {}) => {
    try {
      const entries = await getHelpdeskTicketSummaries(category, { signal });
      if (signal?.aborted) return;
      setTicketSummaries(Object.fromEntries(entries.map((entry) => [Number(entry.conversationId), entry])));
      setTicketsError("");
    } catch (error) {
      if (!signal?.aborted) setTicketsError(error?.response?.data?.message || "Ticket status data is temporarily unavailable.");
    }
  }, [category]);

  useEffect(() => {
    if (!allowed) { setTicketSummaries({}); return undefined; }
    const controller = new AbortController();
    void loadTicketSummaries({ signal: controller.signal });
    const timer = window.setInterval(() => {
      if (!document.hidden) void loadTicketSummaries({ signal: controller.signal });
    }, 30_000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [allowed, loadTicketSummaries, userViewKey]);

  // ChatContext already synchronizes conversations over Socket.IO with a
  // database-backed safety poll. Refresh the Helpdesk ticket summary when a
  // conversation in this support queue changes, rather than waiting up to
  // 30 seconds for case status, first reply, and unread figures to catch up.
  // No polling is added for unrelated private/group chats.
  const helpdeskSyncMarker = useMemo(() => (chat?.conversations || [])
    .filter((conversation) => conversation.isHelpdesk &&
      safeText(conversation.helpdeskCategory) === category &&
      conversation.isHelpdeskSupportMember === true)
    .map((conversation) => [
      conversation.id,
      conversation.lastMessageId || 0,
      conversation.lastMessageAt || "",
      conversation.updatedAt || "",
      conversation.caseStatus || "",
      conversation.unreadCount || 0,
    ].join(":"))
    .sort()
    .join("|"), [chat?.conversations, category]);
  const lastHelpdeskSyncMarkerRef = useRef(null);
  useEffect(() => {
    if (!allowed) {
      lastHelpdeskSyncMarkerRef.current = null;
      return;
    }
    if (lastHelpdeskSyncMarkerRef.current === null) {
      lastHelpdeskSyncMarkerRef.current = helpdeskSyncMarker;
      return;
    }
    if (lastHelpdeskSyncMarkerRef.current === helpdeskSyncMarker) return;
    lastHelpdeskSyncMarkerRef.current = helpdeskSyncMarker;
    void loadTicketSummaries();
  }, [allowed, helpdeskSyncMarker, loadTicketSummaries]);

  const closeDetails = useCallback(() => {
    detailControllerRef.current?.abort();
    detailControllerRef.current = null;
    setActiveRequest(null);
    setTicketDetails(null);
    setTicketEligibility(null);
    setTicketError("");
  }, []);

  const openDetails = async (conversation) => {
    if (!allowed) return;
    detailControllerRef.current?.abort();
    const controller = new AbortController();
    detailControllerRef.current = controller;
    setActiveRequest(conversation);
    setTicketDetails(null);
    setTicketEligibility(null);
    setTicketError("");
    setTicketLoading(true);
    setEligibilityLoading(false);
    void getHelpdeskTicketDetails(conversation.id, { signal: controller.signal })
      .then((details) => {
        if (controller.signal.aborted) return;
        setTicketDetails(details);
        // Resolved/assigned requests never require a costly Kronos duty check.
        if (details?.status !== "OPEN") return;
        setEligibilityLoading(true);
        void getHelpdeskTicketEligibility(conversation.id, { signal: controller.signal })
          .then((result) => { if (!controller.signal.aborted) setTicketEligibility(result); })
          .catch((error) => { if (!controller.signal.aborted) setTicketEligibility({ eligible: false, reason: error?.response?.data?.message || "Unable to verify duty or site eligibility." }); })
          .finally(() => { if (!controller.signal.aborted) setEligibilityLoading(false); });
      })
      .catch((error) => { if (!controller.signal.aborted) setTicketError(error?.response?.data?.message || "Unable to load this request."); })
      .finally(() => { if (!controller.signal.aborted) setTicketLoading(false); });
  };

  const runTicketAction = async (action, status = "", reason = "") => {
    if (!activeRequest || ticketBusy) return;
    setTicketBusy(true);
    setTicketError("");
    try {
      const next = action === "ACCEPT"
        ? await acceptHelpdeskTicket(activeRequest.id)
        : await updateHelpdeskTicketStatus(activeRequest.id, status, reason);
      setTicketDetails(next);
      setTicketEligibility({ eligible: false, reason: "Request already assigned." });
      await loadTicketSummaries();
      void chat?.refreshConversations?.({ silent: true });
    } catch (error) {
      setTicketError(error?.response?.data?.message || "Unable to update request. Refresh and retry.");
      try { setTicketDetails(await getHelpdeskTicketDetails(activeRequest.id)); } catch {}
    } finally { setTicketBusy(false); }
  };

  const requests = useMemo(() => (chat?.conversations || [])
    .filter((conversation) => conversation.isHelpdesk &&
      safeText(conversation.helpdeskCategory) === category &&
      conversation.isHelpdeskSupportMember === true &&
      // A category selected without a first message is only a DRAFT; it is
      // not a real case and must not count in the support request queue.
      Boolean(conversation.caseCode || ticketSummaries[Number(conversation.id)]?.caseCode))
    .sort((left, right) => {
      const a = Date.parse(left.lastMessageAt || left.updatedAt || left.createdAt || "") || 0;
      const b = Date.parse(right.lastMessageAt || right.updatedAt || right.createdAt || "") || 0;
      return b - a || Number(right.id || 0) - Number(left.id || 0);
    }), [chat?.conversations, category, ticketSummaries]);

  // Counts are scoped to this Helpdesk category and the conversations already
  // authorized by the server (including site and active-view restrictions).
  const { openCases, closedCases, rejectedRequests } = useMemo(() => requests.reduce((counts, conversation) => {
    const status = getCaseStatus(ticketSummaries[Number(conversation.id)], conversation);
    if (ACTIVE_CASE_STATUSES.has(status)) counts.openCases += 1;
    else if (status === "RESOLVED") counts.closedCases += 1;
    else if (status === "REJECTED") counts.rejectedRequests += 1;
    return counts;
  }, { openCases: 0, closedCases: 0, rejectedRequests: 0 }), [requests, ticketSummaries]);

  // Options reflect verified HRIS department/manager access, not only sites
  // represented in today's cases. Only the two approved operational locations
  // are shown; Mabini is intentionally excluded.
  const siteOptions = useMemo(() => [
    { value: "All", label: "All Locations" },
    ...["Davao", "Tagum"]
      .filter((location) => authorizedCategories.includes(category) &&
        (authorizedLocationsByCategory[category] || []).includes(location))
      .map((location) => ({ value: location, label: location })),
  ], [category, authorizedCategories, authorizedLocationsByCategory]);

  const filtered = useMemo(() => requests.filter((conversation) => {
    const requester = getRequester(conversation);
    const caseStatus = getCaseStatus(ticketSummaries[Number(conversation.id)], conversation);
    // Rejected is a separate request outcome and never enters either case tab.
    if (activeTab === "Rejected") {
      if (caseStatus !== "REJECTED") return false;
    } else if (activeTab === "CaseClosed") {
      if (caseStatus !== "RESOLVED") return false;
    } else if (!ACTIVE_CASE_STATUSES.has(caseStatus)) {
      return false;
    }
    if (statusFilter !== "All" && caseStatus !== statusFilter) return false;
    if (assignedSite !== "All" && requester.location !== assignedSite) return false;
    const searchable = [requester.name, requester.sibsId, requester.location,
      conversation.caseCode, ticketSummaries[Number(conversation.id)]?.caseCode,
      getCaseDisplayLabel(ticketSummaries[Number(conversation.id)], conversation),
      conversation.name, conversation.lastMessageText].map(safeText).join(" ").toLowerCase();
    return searchable.includes(search.trim().toLowerCase());
  }), [requests, search, assignedSite, activeTab, statusFilter, ticketSummaries]);

  const sortedFiltered = useMemo(() => {
    if (sortBy === "Recent") return filtered;
    const next = [...filtered];
    if (sortBy === "UnreadFirst") {
      next.sort((a, b) => Number(b.unreadCount || 0) - Number(a.unreadCount || 0)
        || (Date.parse(b.lastMessageAt || b.updatedAt || b.createdAt || "") || 0)
        - (Date.parse(a.lastMessageAt || a.updatedAt || a.createdAt || "") || 0));
    } else {
      next.reverse(); // Requests are already sorted newest first.
    }
    return next;
  }, [filtered, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = sortedFiltered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  // Only the requests table participates in skeleton loading.
  // The category title/description/actions above remain visible throughout.
  const showSkeleton = entrySkeletonVisible || checkingAccess || Boolean(chat?.conversationsLoading && !requests.length);

  const changePage = (next) => {
    setPage(Math.min(Math.max(Number(next) || 1, 1), totalPages));
    // Match Employee Directory: reset both inner table and main viewport.
    window.requestAnimationFrame(() => {
      tableScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
      mainScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
  };

  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setOpenError("");
    try {
      await loadAccess({ quiet: true });
      await chat?.refreshConversations?.({ silent: true });
      await loadTicketSummaries();
    } catch (error) {
      setOpenError(error?.response?.data?.message || "Unable to refresh Helpdesk requests.");
    } finally {
      setRefreshing(false);
    }
  };


  // Rejected requests have their own tab and are excluded from both case counts.
  const statusTabs = [
    { key: "CaseOpen", label: "Case Open", icon: FolderOpen, count: openCases },
    { key: "CaseClosed", label: "Case Closed", icon: CheckCircle, count: closedCases },
    { key: "Rejected", label: "Rejected", icon: Ban, count: rejectedRequests },
  ];

  // Keep the Status dropdown consistent with the selected case tab and avoid
  // retaining a conflicting value (e.g. Closed + In Progress).
  const statusOptions = [
    { value: "All", label: "All Statuses" },
    ...Object.entries(TICKET_STATUS_LABELS)
      .filter(([status]) => activeTab === "CaseOpen" ? ACTIVE_CASE_STATUSES.has(status)
        : activeTab === "CaseClosed" ? status === "RESOLVED" : status === "REJECTED")
      .map(([value, label]) => ({ value, label })),
  ];
  const selectRequestTab = (value) => {
    setActiveTab(value);
    setStatusFilter("All");
    setPage(1);
    tableScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  };
  const hasRequestFilters = Boolean(search.trim()) || assignedSite !== "All" || statusFilter !== "All";
  const emptyTitle = hasRequestFilters ? "No matching requests"
    : activeTab === "Rejected" ? "No rejected requests"
    : activeTab === "CaseClosed" ? "No closed cases" : "No open cases";
  const emptyDescription = activeTab === "Rejected"
    ? "Rejected concerns appear here separately and do not count as cases."
    : activeTab === "CaseClosed"
      ? "Cases marked Closed appear here."
      : "Open, In Progress, and Pending cases appear here.";

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0"><Header /></div>
      <main ref={mainScrollRef} className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6 pb-8">
          {/* Permanent page identity: never replace this hero with a skeleton. */}
          <PageHeaderHero
            kicker={config.kicker}
            title={config.name}
            description={config.description}
            actions={
              <button
                type="button"
                onClick={refresh}
                disabled={refreshing || checkingAccess}
                title={`Refresh ${config.name} requests`}
                aria-label={`Refresh ${config.name} requests`}
                className="sibs-btn-icon"
              >
                <RefreshCcw size={15} className={refreshing ? "animate-spin text-sibs-orange" : ""} />
              </button>
            }
          />

          {accessError ? (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
              <AlertCircle size={19} className="shrink-0" />{accessError}
            </div>
          ) : !checkingAccess && !allowed ? (
            <div className="sibs-page-card-in sibs-card flex gap-3 rounded-2xl border border-sibs-border bg-white p-6 font-jakarta">
              <ShieldCheck size={21} className="shrink-0 text-sibs-orange" />
              <div>
                <h2 className="text-sm font-extrabold text-sibs-navy">Support-team access required</h2>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-sibs-muted">
                  Only authorized {config.name} support staff, their department managers, and Super Admins can access this page. Helpdesk permissions are checked by the HRIS server.
                </p>
              </div>
            </div>
          ) : (
            <>
              <section
                className="sibs-page-card-in sibs-card min-h-[520px] overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-xs font-jakarta"
                style={{ animationDelay: `${ANIMATION.table}ms`, animationFillMode: "both" }}
              >
                <div className="flex h-full min-h-[520px] min-w-0 flex-col bg-white font-jakarta">
                  <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6">
                    <h2 className="font-heading text-sm font-bold tracking-tight text-sibs-navy 2xl:text-base">{config.tableTitle}</h2>
                    <p className="mt-1 sibs-text-xs font-semibold text-sibs-muted">Review queued time (before acceptance), response time (acceptance to first reply), and resolution.</p>
                    <div className="mt-4 flex flex-col gap-3 overflow-visible xl:flex-row xl:items-end">
                      <div className="relative w-full min-w-0 xl:min-w-[180px] xl:flex-[1_1_220px] 2xl:min-w-[280px] 2xl:flex-[1_1_360px]">
                        <SearchInput
                          label="Search"
                          labelClassName="sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
                          value={search}
                          placeholder={config.searchPlaceholder}
                          onChange={(value) => { setSearch(value); setPage(1); }}
                        />
                      </div>
                      <div className="w-full xl:w-[190px] 2xl:w-[210px] xl:flex-none">
                        <SelectDropdown
                          className="sibs-employee-directory-filter"
                          label="Assigned Location"
                          labelClassName="sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
                          options={siteOptions}
                          value={assignedSite}
                          onChange={(value) => { setAssignedSite(value); setPage(1); }}
                          searchable
                          searchPlaceholder="Search locations..."
                          clearable={false}
                          disabled={showSkeleton}
                        />
                      </div>
                      <div className="w-full xl:w-[170px] xl:flex-none">
                        <SelectDropdown
                          className="sibs-employee-directory-filter"
                          label="Status"
                          labelClassName="sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
                          options={statusOptions}
                          value={statusFilter}
                          onChange={(value) => { setStatusFilter(value); setPage(1); }}
                          clearable={false}
                          disabled={showSkeleton}
                        />
                      </div>
                      <div className="w-full xl:w-[190px] 2xl:w-[210px] xl:flex-none">
                        <SelectDropdown
                          className="sibs-employee-directory-filter"
                          label="Sort By"
                          labelClassName="sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
                          value={sortBy}
                          options={[{ value: "Recent", label: "Newest First" }, { value: "Oldest", label: "Oldest First" }, { value: "UnreadFirst", label: "Unread First" }]}
                          onChange={(value) => { setSortBy(value); setPage(1); }}
                          clearable={false}
                          disabled={showSkeleton}
                        />
                      </div>
                    </div>
                  </div>

                  {ticketsError ? <div role="alert" className="mx-4 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800 sm:mx-5">{ticketsError}</div> : null}
                  {openError ? (
                    <div role="alert" className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 sm:mx-5">{openError}</div>
                  ) : null}

                  <div className="min-h-0 flex-1 p-4 sm:p-5 2xl:p-6">
                    <div className="overflow-hidden rounded-xl border border-sibs-border bg-white shadow-xs">
                      <StatusFilterTabs
                        tabs={statusTabs}
                        activeValue={activeTab}
                        onChange={selectRequestTab}
                        layoutId={`helpdeskRequestsTabIndicator-${category}`}
                      />
                      <ResponsiveTableShell
                        desktopContent={
                          <div className="overflow-hidden bg-white">
                            <div ref={tableScrollRef} className="max-h-[480px] overflow-auto sibs-scrollbar 2xl:max-h-[640px]">
                              <table className="w-full min-w-[1120px] table-fixed border-collapse text-left">
                                <thead className="sticky top-0 z-10 bg-sibs-surface">
                                  <tr className="border-b border-sibs-border">
                                    {[
                                      ["SIBS ID", "w-[9%]"],
                                      ["EMPLOYEE NAME", "w-[21%]"],
                                      ["ASSIGNED SITE", "w-[11%]"],
                                      ["STATUS", "w-[10%]"],
                                      ["QUEUED TIME", "w-[10%]"],
                                      ["RESPONSE TIME", "w-[12%]"],
                                      ["RESOLUTION TIME", "w-[13%]"],
                                      ["POSTED", "w-[14%]"],
                                    ].map(([label, width]) => (
                                      <th key={label} scope="col" className={`${width} px-3 py-2.5 sibs-text-micro font-extrabold uppercase tracking-wider text-sibs-muted 2xl:px-4 2xl:py-3`}>{label}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-sibs-border" aria-busy={showSkeleton}>
                                  {showSkeleton ? (
                                    <TableSkeletonRows count={PAGE_SIZE} columns={8} />
                                  ) : !visible.length ? (
                                    <tr><td colSpan={8}>
                                      <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
                                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sibs-surface text-sibs-navy"><Inbox size={22} /></span>
                                        <h3 className="mt-3 text-sm font-extrabold text-sibs-navy">{emptyTitle}</h3>
                                        <p className="mt-1 max-w-xl text-xs font-semibold text-sibs-muted">{emptyDescription}</p>
                                      </div>
                                    </td></tr>
                                  ) : visible.map((conversation) => {
                                    const requester = getRequester(conversation);
                                    const unread = Number(conversation.unreadCount || 0);
                                    const ticket = ticketSummaries[Number(conversation.id)];
                                    const queued = getQueuedDisplay(ticket, clockNow);
                                    const response = getResponseDisplay(ticket);
                                    return (
                                      <tr
                                        key={conversation.id}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`View ${requester.name}'s Helpdesk ticket`}
                                        title="Click to view request details"
                                        onClick={() => openDetails(conversation)}
                                        onKeyDown={(event) => {
                                          if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            openDetails(conversation);
                                          }
                                        }}
                                        className="group cursor-pointer transition-colors hover:bg-sibs-cream-light focus-visible:bg-sibs-cream-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sibs-orange/30"
                                      >
                                        <td className="whitespace-nowrap px-3 py-2 align-middle sibs-text-xs font-extrabold text-sibs-orange 2xl:px-4 2xl:py-2.5">
                                          <span className="block">{requester.sibsId || "—"}</span>
                                          <span className="mt-0.5 block text-[10px] font-bold text-sibs-navy" title="Case number within this Helpdesk category">{getCaseDisplayLabel(ticket, conversation)}</span>
                                        </td>
                                        <td className="px-3 py-2 align-middle 2xl:px-4 2xl:py-2.5">
                                          <div className="flex min-w-0 items-center gap-2.5">
                                            <RequesterAvatar requester={requester} />
                                            <div className="min-w-0">
                                              <p className="break-words sibs-text-xs font-extrabold leading-tight text-sibs-navy transition-colors group-hover:text-sibs-orange">{requester.name}</p>
                                              {unread ? <p className="mt-1 flex items-center gap-1.5 sibs-text-micro font-bold text-sibs-orange"><UnreadBadge count={unread} /> Unread messages</p> : null}
                                              {ticket?.status === "REJECTED" && <p className="mt-1 max-w-[300px] truncate text-[10px] font-semibold text-rose-700" title={ticket.rejectionReason || ""}>{ticket.rejectionReason || "Rejected"}</p>}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-3 py-2 align-middle 2xl:px-4 2xl:py-2.5">
                                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sibs-muted"><MapPin size={13} className="shrink-0 text-sibs-faint" />{requester.location}</span>
                                        </td>
                                        <td className="px-3 py-2 align-middle 2xl:px-4 2xl:py-2.5"><TicketStatusBadge status={ticket?.status} /></td>
                                        <td className="px-3 py-2 align-middle text-[11px] font-semibold text-sibs-muted 2xl:px-4 2xl:py-2.5">
                                          <span title="Time elapsed from first message until support acceptance" className={queued.pending ? "font-extrabold text-sibs-orange" : ""}>{ticket?.status === "REJECTED" ? "—" : queued.text}</span>
                                          {ticket?.status !== "REJECTED" && queued.pending && <span className="mt-0.5 block text-[10px] text-sibs-orange">Waiting for acceptance</span>}
                                        </td>
                                        <td className="px-3 py-2 align-middle text-[11px] font-semibold text-sibs-muted 2xl:px-4 2xl:py-2.5">
                                          <span title="Time between request acceptance and first actual support reply" className={response.pending ? "font-bold text-sibs-orange" : ""}>{ticket?.status === "REJECTED" ? "—" : response.text}</span>
                                        </td>
                                        <td className="px-3 py-2 align-middle text-[11px] font-semibold text-sibs-muted 2xl:px-4 2xl:py-2.5">{ticket?.status === "REJECTED" ? "—" : getResolutionDisplay(ticket)}</td>
                                        <td className="px-3 py-2 align-middle 2xl:px-4 2xl:py-2.5">
                                          <span className="text-[11px] font-semibold text-sibs-muted">{formatDate(ticket?.postedAt)}</span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        }
                        mobileContent={
                          <div className="space-y-3 p-3.5 sm:p-4">
                            {showSkeleton ? <DataCard.Skeleton count={5} lines={3} />
                              : visible.length ? visible.map((conversation, index) => (
                                <MobileRequestCard
                                  key={conversation.id}
                                  conversation={conversation}
                                  index={index}
                                  requester={getRequester(conversation)}
                                  ticket={ticketSummaries[Number(conversation.id)]}
                                  opening={false}
                                  nowMs={clockNow}
                                  onOpen={() => openDetails(conversation)}
                                />
                              )) : <DataCard.Empty title={emptyTitle}
                                description={hasRequestFilters ? "Try adjusting your search or filters." : emptyDescription} />}
                          </div>
                        }
                      />
                    </div>
                  </div>

                  <div className="shrink-0 px-4 pb-4 sm:px-5 sm:pb-5">
                    <TablePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalRecords={filtered.length}
                      pageSize={PAGE_SIZE}
                      loadedCount={visible.length}
                      onPageChange={changePage}
                      recordLabel={config.recordLabel}
                      loading={showSkeleton}
                    />
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
      {activeRequest && (
        <HelpdeskTicketModal
          conversation={activeRequest}
          ticket={ticketDetails}
          loading={ticketLoading}
          eligibility={ticketEligibility}
          eligibilityLoading={eligibilityLoading}
          busy={ticketBusy}
          error={ticketError}
          currentSibsId={safeText(chat?.currentSibsId || user?.username || user?.sibs_id || user?.sibsId)}
          onClose={closeDetails}
          onAccept={() => runTicketAction("ACCEPT")}
          onUpdateStatus={(status, reason = "") => runTicketAction("STATUS", status, reason)}
          onMessagesChanged={({ refreshTicket = false, refreshConversationList = false } = {}) => {
            if (refreshTicket && activeRequest) {
              void getHelpdeskTicketDetails(activeRequest.id)
                .then((details) => {
                  if (detailControllerRef.current && !detailControllerRef.current.signal.aborted && details) {
                    setTicketDetails(details);
                  }
                }).catch(() => {});
              void loadTicketSummaries();
            }
            if (refreshConversationList) void chat?.refreshConversations?.({ silent: true });
          }}
        />
      )}
    </div>
  );
}
