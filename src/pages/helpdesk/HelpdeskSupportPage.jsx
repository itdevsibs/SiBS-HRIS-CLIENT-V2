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
  MetricCard,
  MetricCardSkeleton,
  MetricGrid,
  ModalShell,
  PageHeaderHero,
  ResponsiveTableShell,
  SearchInput,
  SelectDropdown,
  StatusFilterTabs,
  TableEmptyRow,
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
    description: "Review technical concerns submitted by employees and coordinate responses with the IT support team.",
    empty: "No IT Support requests yet",
    tableTitle: "IT Support Requests",
    searchPlaceholder: "Search IT requests by employee, SIBS ID, location, or message...",
    recordLabel: "IT Support requests",
    icon: Headset,
  },
  TA_HR: {
    name: "TA/HR Concerns",
    kicker: "Talent Acquisition & HR · Helpdesk",
    description: "Review recruitment, employee, and HR concerns submitted to the TA/HR support team.",
    empty: "No TA/HR concerns yet",
    tableTitle: "TA/HR Concerns Requests",
    searchPlaceholder: "Search TA/HR concerns by employee, SIBS ID, location, or message...",
    recordLabel: "TA/HR concerns",
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
const ANIMATION = { summary: 60, table: 240, metric: 60 };

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

  // If there is no uploaded picture, render standard initials avatar without hover portal popup
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
        className="relative inline-flex shrink-0 outline-none cursor-pointer"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        onMouseEnter={() => { updatePreviewPosition(); setPreviewVisible(true); }}
        onMouseLeave={() => setPreviewVisible(false)}
        onFocus={() => { updatePreviewPosition(); setPreviewVisible(true); }}
        onBlur={() => setPreviewVisible(false)}
      >
        {avatarContent(false)}
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
function TicketStatusBadge({ status }) {
  if (!TICKET_STATUS_LABELS[status]) return <span className="text-[11px] text-sibs-muted">Loading status...</span>;
  const badgeClass =
    status === "RESOLVED"
      ? "sibs-badge-success"
      : status === "PENDING"
      ? "sibs-badge-warning"
      : status === "OPEN"
      ? "sibs-badge-info"
      : "inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-orange-800";

  const dotClass =
    status === "RESOLVED"
      ? "bg-emerald-500"
      : status === "PENDING"
      ? "bg-amber-500"
      : status === "OPEN"
      ? "bg-blue-500"
      : "bg-orange-500";

  return (
    <span className={badgeClass}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
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

function SectionHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="mb-3.5 flex items-start justify-between gap-3 border-b border-sibs-border pb-2.5 font-jakarta">
      <div className="min-w-0">
        <h3 className="flex items-center gap-2 sibs-modal-section-title">
          {Icon ? (
            <span className="flex h-6 w-6 2xl:h-6.5 2xl:w-6.5 shrink-0 items-center justify-center rounded-[8px] bg-sibs-surface-subtle text-sibs-navy">
              {React.createElement(Icon, { size: 14, className: "shrink-0 text-sibs-orange" })}
            </span>
          ) : null}
          <span>{title}</span>
        </h3>
        {subtitle ? (
          <p className="sibs-modal-section-subtitle mt-0.5">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function TicketTimestamp({ label, value, icon: Icon = Clock3 }) {
  return (
    <div className="rounded-xl border border-sibs-border bg-sibs-surface px-3 py-2.5 font-jakarta">
      <p className="flex items-center gap-1.5 text-[9px] 2xl:text-[9.5px] font-extrabold uppercase tracking-wide text-sibs-muted">
        {React.createElement(Icon, { size: 13, className: "text-sibs-orange shrink-0" })}
        {label}
      </p>
      <p className="mt-1 text-xs 2xl:text-[13px] font-bold text-sibs-navy tabular-nums">{formatDate(value)}</p>
    </div>
  );
}

function HelpdeskTicketModal({ conversation, ticket, loading, eligibility, eligibilityLoading, busy, error,
  currentSibsId, categoryConfig = HELPDESK_CONFIG.IT, onClose, onAccept, onUpdateStatus, onOpenChat }) {
  const requester = getRequester(conversation);
  const isAssignee = Boolean(ticket?.acceptedBySibsId) && safeText(ticket.acceptedBySibsId) === currentSibsId;
  const assignee = (conversation.members || []).find((m) => safeText(m.sibsId) === safeText(ticket?.acceptedBySibsId));
  const [now, setNow] = useState(() => Date.now());
  const [selectedStatusOverride, setSelectedStatusOverride] = useState(null);
  const selectedStatus = selectedStatusOverride ?? ticket?.status ?? "IN_PROGRESS";

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <ModalShell
      open={Boolean(conversation)}
      onClose={() => {
        if (!busy && !document.querySelector(".sibs-animated-dropdown.open")) onClose();
      }}
      hideCloseButton={busy}
      closeOnBackdrop={!busy}
      closeOnEscape={!busy}
      title={getCaseDisplayLabel(ticket, conversation)}
      subtitle={`${categoryConfig?.name || "Support"} · ${requester.name}`}
      icon={categoryConfig?.icon || ClipboardList}
      maxWidth="max-w-5xl"
      variant="navy"
      badge={ticket?.status ? TICKET_STATUS_LABELS[ticket.status] : undefined}
      bodyClassName="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-sibs-surface p-4 sm:p-5 2xl:p-6 font-jakarta"
      footerMeta={
        <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-sibs-muted">
          <ShieldCheck size={14} className="shrink-0 text-sibs-navy" />
          <span className="truncate">
            Case updates sync live across support queues and employee chat.
          </span>
        </div>
      }
      footer={
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="sibs-modal-btn-secondary"
        >
          Close Details
        </button>
      }
    >
      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
          {error}
        </div>
      )}
      {loading || !ticket ? (
        <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-sibs-muted">
          {loading ? <Loader2 size={20} className="animate-spin text-sibs-orange" /> : <AlertCircle size={20} className="text-sibs-orange" />}
          {loading ? "Loading request details..." : "Request details are unavailable. Close and retry."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)] items-start">
          <div className="space-y-4">
            {/* Request Details */}
            <div className="rounded-xl border border-sibs-border bg-white p-4 2xl:p-5 shadow-xs font-jakarta">
              <SectionHeader
                icon={FileText}
                title="Request Details"
                subtitle="Requester information, case milestones, and response metrics."
                action={<TicketStatusBadge status={ticket.status} />}
              />
              <div className="flex items-center gap-3 rounded-xl border border-sibs-border bg-sibs-surface p-3 font-jakarta">
                <RequesterAvatar requester={requester} />
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-sibs-navy">{requester.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-sibs-muted">
                    <span>SiBS ID: <strong className="text-sibs-navy">{requester.sibsId || "—"}</strong></span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} className="text-sibs-faint" />
                      {ticket.requesterSite || requester.location}
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <TicketTimestamp label="Case opened · first message" value={ticket.postedAt} icon={CalendarClock} />
                <TicketTimestamp label="Assigned" value={ticket.assignedAt} icon={UserRound} />
                <TicketTimestamp label="Accepted" value={ticket.acceptedAt} icon={CheckCircle2} />
                <TicketTimestamp label="First support reply" value={ticket.firstResponseAt} icon={MessageSquareText} />
                <TicketTimestamp label="Finished / resolved" value={ticket.resolvedAt} icon={CheckCircle2} />
              </div>
              <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {[
                  ["Queued before acceptance", getQueuedDisplay(ticket, now).text],
                  ["Response time · after acceptance", getResponseDisplay(ticket).text],
                  ["Total resolution", formatElapsed(ticket.secondsToResolve)],
                  ["Handling time", formatElapsed(ticket.secondsToFinish)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-sibs-border bg-sibs-surface p-2.5 2xl:p-3 text-center font-jakarta">
                    <span className="block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wider text-sibs-muted">
                      {label}
                    </span>
                    <span className="mt-1 block font-heading text-sm 2xl:text-base font-bold text-sibs-navy tabular-nums">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] font-medium text-sibs-muted">
                {ticket.acceptedAt
                  ? "Queued Time runs from the first message to acceptance. Response Time runs from acceptance to the first support reply."
                  : ticket.status === "OPEN"
                    ? "Waiting for acceptance. Queued Time is running. Response Time has not started."
                    : "No acceptance timestamp is available for this request."}
              </p>
            </div>

            {/* Activity Timeline */}
            <div className="rounded-xl border border-sibs-border bg-white p-4 2xl:p-5 shadow-xs font-jakarta">
              <SectionHeader
                icon={Clock3}
                title="Activity Timeline"
                subtitle="Chronological log of case submission, assignment, and status updates."
              />
              <div className="relative space-y-3.5 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-sibs-border">
                <div className="relative">
                  <span className="absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 ring-4 ring-white">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                  </span>
                  <p className="text-xs font-bold text-sibs-navy">Case opened · first message sent</p>
                  <p className="text-[10.5px] font-medium text-sibs-muted">{formatDate(ticket.postedAt)}</p>
                </div>
                {(ticket.history || []).map((entry, index) => {
                  const isAccept = entry.eventType === "ACCEPTED";
                  const isResolve = entry.eventType === "RESOLVED";
                  return (
                    <div key={`${entry.eventType}-${entry.occurredAt}-${index}`} className="relative">
                      <span className="absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-50 ring-4 ring-white">
                        <Clock3 size={13} className={isResolve ? "text-emerald-600" : isAccept ? "text-blue-600" : "text-sibs-orange"} />
                      </span>
                      <p className="text-xs font-bold text-sibs-navy">
                        {isAccept
                          ? "Accepted and assigned"
                          : isResolve
                          ? "Resolved"
                          : `Status changed to ${TICKET_STATUS_LABELS[entry.newStatus] || entry.newStatus}`}
                      </p>
                      <p className="text-[10.5px] font-medium text-sibs-muted">
                        {formatDate(entry.occurredAt)} · SiBS ID: {entry.actorSibsId}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Support Assignment */}
            <div className="rounded-xl border border-sibs-border bg-white p-4 2xl:p-5 shadow-xs font-jakarta">
              <SectionHeader
                icon={UserRoundCheck}
                title="Support Assignment"
                subtitle="Ticket ownership and lifecycle state."
              />
              <div className="space-y-3.5">
                <div>
                  <span className="sibs-modal-field-label">Current Status</span>
                  <div className="mt-1"><TicketStatusBadge status={ticket.status} /></div>
                </div>
                <div>
                  <span className="sibs-modal-field-label">Accepted By</span>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-sibs-border bg-sibs-surface p-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sibs-navy text-white text-[10px] font-bold">
                      {ticket.acceptedBySibsId ? safeText(assignee?.initials || "SP").slice(0, 2) : "—"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-sibs-navy">
                        {ticket.acceptedBySibsId
                          ? `${assignee?.displayName || `SiBS ID ${ticket.acceptedBySibsId}`}`
                          : "Unassigned"}
                      </p>
                      {ticket.acceptedBySibsId ? (
                        <p className="text-[10px] font-medium text-sibs-muted">SiBS ID: {ticket.acceptedBySibsId}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
                {ticket.status === "OPEN" && (
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={onAccept}
                      disabled={busy || eligibilityLoading || !eligibility?.eligible}
                      className="sibs-modal-btn-primary w-full"
                    >
                      {busy || eligibilityLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Accept Request
                    </button>
                    <p className="sibs-text-micro font-medium leading-relaxed text-sibs-muted">
                      {eligibilityLoading ? "Verifying today's Kronos attendance and assigned site..." : eligibility?.reason || "You are on duty and assigned to this site."}
                    </p>
                  </div>
                )}
                {isAssignee && ticket.status !== "RESOLVED" && (
                  <div className="pt-2 space-y-2">
                    <SelectDropdown
                      label="Update status"
                      labelClassName="sibs-modal-field-label"
                      value={selectedStatus}
                      options={["IN_PROGRESS", "PENDING", "RESOLVED"].map((status) => ({
                        value: status,
                        label: TICKET_STATUS_LABELS[status],
                      }))}
                      onChange={setSelectedStatusOverride}
                      clearable={false}
                      disabled={busy}
                      className="h-9 2xl:h-10 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(selectedStatus)}
                      disabled={busy || selectedStatus === ticket.status}
                      className="sibs-modal-btn-primary w-full"
                    >
                      Save Status
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Conversation */}
            <div className="rounded-xl border border-sibs-border bg-white p-4 2xl:p-5 shadow-xs font-jakarta">
              <SectionHeader
                icon={MessageSquareText}
                title="Latest Message"
                subtitle="Recent conversation snippet from SiBS Chat."
              />
              <div className="rounded-xl border border-sibs-border-subtle bg-sibs-surface p-3.5">
                <p className="line-clamp-4 text-xs font-semibold leading-relaxed text-sibs-navy italic">
                  "${safeText(conversation.lastMessageText) || "No messages yet. Open SiBS Chat to discuss the concern."}"
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenChat}
                disabled={busy}
                className="sibs-modal-btn-secondary mt-3.5 w-full"
              >
                <MessageCircle size={15} /> Open SiBS Chat <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
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
  const [clockNow, setClockNow] = useState(() => Date.now());
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

  const normCategory = safeText(category).toUpperCase();
  const allowed = !checkingAccess && !accessError && authorizedCategories.map((c) => safeText(c).toUpperCase()).includes(normCategory);
  const loadTicketSummaries = useCallback(async ({ signal } = {}) => {
    try {
      const entries = await getHelpdeskTicketSummaries(normCategory, { signal });
      if (signal?.aborted) return;
      setTicketSummaries(Object.fromEntries(entries.map((entry) => [Number(entry.conversationId), entry])));
      setTicketsError("");
    } catch (error) {
      if (!signal?.aborted) setTicketsError(error?.response?.data?.message || "Ticket status data is temporarily unavailable.");
    }
  }, [normCategory]);

  useEffect(() => {
    if (!allowed) { setTicketSummaries({}); return undefined; }
    const controller = new AbortController();
    void loadTicketSummaries({ signal: controller.signal });
    const timer = window.setInterval(() => {
      if (!document.hidden) void loadTicketSummaries({ signal: controller.signal });
    }, 30_000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [allowed, loadTicketSummaries, userViewKey]);

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
      try { setTicketDetails(await getHelpdeskTicketDetails(activeRequest.id)); } catch (refreshError) { void refreshError; }
    } finally { setTicketBusy(false); }
  };

  const requests = useMemo(() => (chat?.conversations || [])
    .filter((conversation) => conversation.isHelpdesk &&
      safeText(conversation.helpdeskCategory).toUpperCase() === normCategory &&
      Boolean(conversation.isHelpdeskSupportMember) &&
      // A category selected without a first message is only a DRAFT; it is
      // not a real case and must not count in the support request queue.
      Boolean(conversation.caseCode || ticketSummaries[Number(conversation.id)]?.caseCode))
    .sort((left, right) => {
      const a = Date.parse(left.lastMessageAt || left.updatedAt || left.createdAt || "") || 0;
      const b = Date.parse(right.lastMessageAt || right.updatedAt || right.createdAt || "") || 0;
      return b - a || Number(right.id || 0) - Number(left.id || 0);
    }), [chat?.conversations, normCategory, ticketSummaries]);

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
    { key: "All", label: normCategory === "TA_HR" ? "All Concerns" : "All Requests", icon: FileText, count: requests.length },
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
            <div className="sibs-page-card-in sibs-card flex gap-3 rounded-2xl border border-sibs-border bg-white p-6 font-jakarta" style={{ animationDelay: "60ms", animationFillMode: "both" }}>
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
                      <div className="w-full lg:w-[190px] 2xl:w-[210px] lg:flex-none">
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
                      <div className="w-full lg:w-[170px] lg:flex-none">
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
                      <div className="w-full lg:w-[190px] 2xl:w-[210px] lg:flex-none">
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
                                    <TableEmptyRow
                                      colSpan={9}
                                      icon={Inbox}
                                      title={emptyTitle}
                                      description={hasRequestFilters ? "Try adjusting your search or filters." : emptyDescription}
                                    />
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
                                        className="group cursor-pointer transition-colors duration-150 hover:bg-[#FFF7F3]/60 focus-visible:bg-[#FFF7F3]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sibs-orange/40"
                                      >
                                        <td className="whitespace-nowrap px-3 py-2.5 align-middle 2xl:px-4 2xl:py-3">
                                          <span className="block font-bold text-sibs-navy sibs-text-xs transition-colors group-hover:text-sibs-orange">{requester.sibsId || "—"}</span>
                                          <span className="mt-0.5 block text-[10px] font-bold text-sibs-muted" title="Case number within this Helpdesk category">{getCaseDisplayLabel(ticket, conversation)}</span>
                                        </td>
                                        <td className="px-3 py-2.5 align-middle 2xl:px-4 2xl:py-3">
                                          <div className="flex min-w-0 items-center gap-2.5">
                                            <RequesterAvatar requester={requester} />
                                            <div className="min-w-0">
                                              <p className="break-words sibs-text-xs font-extrabold leading-tight text-sibs-navy transition-colors group-hover:text-sibs-orange">{requester.name}</p>
                                              {unread ? <p className="mt-1 flex items-center gap-1.5 sibs-text-micro font-bold text-sibs-orange"><UnreadBadge count={unread} /> Unread messages</p> : null}
                                              {ticket?.status === "REJECTED" && <p className="mt-1 max-w-[300px] truncate text-[10px] font-semibold text-rose-700" title={ticket.rejectionReason || ""}>{ticket.rejectionReason || "Rejected"}</p>}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-3 py-2.5 align-middle 2xl:px-4 2xl:py-3">
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
                                        <td className="px-3 py-2.5 align-middle text-[11px] font-semibold text-sibs-muted 2xl:px-4 2xl:py-3">{getResolutionDisplay(ticket)}</td>
                                        <td className="px-3 py-2.5 align-middle 2xl:px-4 2xl:py-3">
                                          <span className="text-[11px] font-semibold text-sibs-muted">{formatDate(ticket?.postedAt)}</span>
                                        </td>
                                        <td className="px-3 py-2 text-right align-middle 2xl:px-4 2xl:py-2.5" onClick={(event) => event.stopPropagation()}>
                                          <button
                                            type="button"
                                            aria-label={`View details for ${requester.name}'s Helpdesk ticket`}
                                            onClick={() => openDetails(conversation)}
                                            onKeyDown={(event) => event.stopPropagation()}
                                            disabled={Boolean(openingId)}
                                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-sibs-border bg-white px-2.5 sibs-text-xs font-bold text-sibs-navy shadow-2xs transition hover:border-sibs-orange/40 hover:bg-sibs-cream-subtle hover:text-sibs-orange disabled:opacity-50"
                                          >
                                            <ArrowUpRight size={13} className={openingId === conversation.id ? "animate-pulse text-sibs-orange" : "text-sibs-orange"} />
                                            <span className="hidden xl:inline">View Details</span>
                                          </button>
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
          currentSibsId={safeText(user?.username || user?.sibs_id || user?.sibsId)}
          categoryConfig={config}
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
