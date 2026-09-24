import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  EyeOff,
  ImagePlus,
  Loader2,
  Maximize2,
  MessageCircleMore,
  Minimize2,
  MoreHorizontal,
  Music,
  Pencil,
  Plus,
  Reply,
  Palette,
  Search,
  Send,
  Smile,
  Settings2,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";

import {
  getChatAttachmentUrl,
  getChatParticipants,
  getChatThemeImageBlob,
} from "@/lib/axios/sibsChat";
import {
  getTrendingChatGifs,
  searchChatGifs,
} from "@/lib/axios/gifSearch";
import ChatVideoPlayer from "@/components/chat/ChatVideoPlayer";
import ChatAudioPlayer from "@/components/chat/ChatAudioPlayer";
import ChatTypingIndicator from "@/components/chat/ChatTypingIndicator";
import ChatThemeModal from "@/components/chat/ChatThemeModal";
import { useChat } from "@/services/context/ChatContext";
import { useUser } from "@/services/context/UserContext";
import { ensureSibsChatSystemNotifications } from "@/lib/sibsChatSystemNotifications";
import { calculateSeenMembersByMessageId } from "@/lib/utils/chat/chatSeenReceipts";
import {
  getChatLayoutFlip,
  getExpandedChatBounds,
} from "@/lib/utils/chat/chatWindowLayout";
import {
  calculatePixelLuminanceIsDark,
  getChatThemeBackgroundStyle,
  isChatThemeCustom,
  isChatThemeDark,
} from "@/lib/utils/chat/chatTheme";
import {
  calculatePrependScrollTop,
  checkIsNearBottom,
  shouldSnapToBottom,
} from "@/lib/utils/chat/chatScroll";

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENTS_PER_MESSAGE = 5;

function getFileExtension(value) {
  const name = String(value ?? "").trim().toLowerCase();
  const dotIndex = name.lastIndexOf(".");
  return dotIndex >= 0 ? name.slice(dotIndex) : "";
}

function bytesToAscii(bytes, start, length) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

function hasJpegEndMarker(bytes) {
  const start = Math.max(2, bytes.length - 4096);
  for (let index = bytes.length - 2; index >= start; index -= 1) {
    if (bytes[index] === 0xff && bytes[index + 1] === 0xd9) return true;
  }
  return false;
}

function detectSupportedAttachmentMime(bytes, file = {}) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 4) return "";

  const declaredMime = cleanText(file?.type).toLowerCase();
  const extension = getFileExtension(file?.name);

  // JPEG: SOI + EOI marker. This rejects truncated/corrupt .jpg files.
  if (
    bytes.length >= 4 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff &&
    hasJpegEndMarker(bytes)
  ) {
    return "image/jpeg";
  }

  // PNG: signature + IHDR + IEND.
  if (
    bytes.length >= 33 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a &&
    bytesToAscii(bytes, 12, 4) === "IHDR" &&
    bytesToAscii(bytes, bytes.length - 8, 4) === "IEND"
  ) {
    return "image/png";
  }

  // GIF87a / GIF89a + trailer.
  if (
    bytes.length >= 14 &&
    ["GIF87a", "GIF89a"].includes(bytesToAscii(bytes, 0, 6)) &&
    bytes[bytes.length - 1] === 0x3b
  ) {
    return "image/gif";
  }

  // WEBP = RIFF....WEBP + a valid VP8 family chunk.
  if (
    bytes.length >= 16 &&
    bytesToAscii(bytes, 0, 4) === "RIFF" &&
    bytesToAscii(bytes, 8, 4) === "WEBP" &&
    ["VP8 ", "VP8L", "VP8X"].includes(bytesToAscii(bytes, 12, 4))
  ) {
    return "image/webp";
  }

  // WAV = RIFF....WAVE.
  if (
    bytes.length >= 12 &&
    bytesToAscii(bytes, 0, 4) === "RIFF" &&
    bytesToAscii(bytes, 8, 4) === "WAVE"
  ) {
    return "audio/wav";
  }

  // OGG container. Keep the user's declared category when available.
  if (bytesToAscii(bytes, 0, 4) === "OggS") {
    return declaredMime.startsWith("video/") || extension === ".ogv"
      ? "video/ogg"
      : "audio/ogg";
  }

  // FLAC.
  if (bytesToAscii(bytes, 0, 4) === "fLaC") {
    return "audio/flac";
  }

  // MP3: ID3 tag or MPEG audio frame sync.
  if (
    bytesToAscii(bytes, 0, 3) === "ID3" ||
    (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0 && extension === ".mp3")
  ) {
    return "audio/mpeg";
  }

  // AAC ADTS.
  if (
    bytes.length >= 7 &&
    bytes[0] === 0xff &&
    (bytes[1] & 0xf6) === 0xf0 &&
    (declaredMime === "audio/aac" || extension === ".aac")
  ) {
    return "audio/aac";
  }

  // WEBM / Matroska EBML header.
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  ) {
    return declaredMime.startsWith("audio/")
      ? "audio/webm"
      : "video/webm";
  }

  // ISO Base Media: MP4 / M4A / MOV / M4V.
  if (bytes.length >= 12 && bytesToAscii(bytes, 4, 4) === "ftyp") {
    if (declaredMime.startsWith("audio/") || extension === ".m4a") {
      return "audio/mp4";
    }
    if (extension === ".mov" || declaredMime === "video/quicktime") {
      return "video/quicktime";
    }
    if (extension === ".m4v" || declaredMime === "video/x-m4v") {
      return "video/x-m4v";
    }
    return "video/mp4";
  }

  return "";
}

async function validateAttachmentBeforeSelection(file) {
  if (!file || Number(file.size || 0) <= 0) return "";

  try {
    const buffer = await file.arrayBuffer();
    return detectSupportedAttachmentMime(new Uint8Array(buffer), file);
  } catch {
    return "";
  }
}

const CHAT_EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
  "😊", "🙂", "🙃", "😉", "😍", "🥰", "😘", "😎",
  "🤩", "🥳", "😇", "🤗", "🤭", "🫡", "🤔", "😴",
  "😢", "😭", "😤", "😡", "🤯", "😱", "🥺", "😬",
  "👍", "👎", "👏", "🙌", "🙏", "💪", "👌", "✌️",
  "🤝", "👋", "❤️", "🧡", "💛", "💚", "💙", "💜",
  "🖤", "🤍", "💯", "🔥", "✨", "🎉", "🎊", "✅",
  "⭐", "💡", "📌", "🚀", "👀", "💬", "😊", "🤍",
];

const MESSAGE_REACTIONS = [
  "👍", "❤️", "😂", "😮", "😢", "😡",
  "😍", "🥰", "😆", "🤔", "🙏", "👏",
  "🎉", "🔥", "💯", "👎", "😎", "🤩",
];

function cleanText(value) {
  return String(value ?? "").trim();
}

function isMobileChatDevice() {
  if (typeof navigator === "undefined") return false;

  if (navigator.userAgentData?.mobile === true) return true;

  const userAgent = String(navigator.userAgent || "");
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)) return true;

  return /Macintosh/i.test(userAgent) && Number(navigator.maxTouchPoints || 0) > 1;
}

function getChatMemberDisplayName(member = {}) {
  return (
    cleanText(member?.chatNickname || member?.chat_nickname) ||
    cleanText(member?.preferredName || member?.preferred_name) ||
    cleanText(member?.displayName) ||
    (cleanText(member?.sibsId) ? `SIBS ID ${cleanText(member.sibsId)}` : "Employee")
  );
}

function getChatMemberFullName(member = {}) {
  return (
    cleanText(member?.displayName) ||
    (cleanText(member?.sibsId) ? `SIBS ID ${cleanText(member.sibsId)}` : "Employee")
  );
}

function getReplySenderName(message = {}, currentSibsId = "") {
  if (!message || message?.unavailable) return "Original message";

  const senderSibsId = cleanText(message?.senderSibsId);
  if (senderSibsId && senderSibsId === cleanText(currentSibsId)) return "You";

  return getChatMemberDisplayName(message?.sender || { sibsId: senderSibsId });
}

function getReplyPreviewLabel(message = {}) {
  if (!message || message?.unavailable) return "Original message is unavailable";
  if (message?.unsent || cleanText(message?.messageType).toUpperCase() === "UNSENT") {
    return "Message was unsent";
  }

  const text = cleanText(message?.messageText);
  if (text) {
    return text.length > 100 ? `${text.slice(0, 100)}…` : text;
  }

  const type = cleanText(message?.messageType).toUpperCase();
  if (type === "GIF" || cleanText(message?.gifUrl)) return "GIF";

  const attachments = Array.isArray(message?.attachments) ? message.attachments : [];
  if (attachments.length) {
    const mimeTypes = attachments.map((item) => cleanText(item?.mimeType).toLowerCase());
    const hasVideo = mimeTypes.some((value) => value.startsWith("video/"));
    const hasAudio = mimeTypes.some((value) => value.startsWith("audio/"));
    const hasImage = mimeTypes.some((value) => value.startsWith("image/"));
    const kinds = [hasVideo, hasAudio, hasImage].filter(Boolean).length;

    if (kinds > 1 || attachments.length > 1) return "Media attachment";
    if (hasVideo) return "Video";
    if (hasAudio) return "Audio";
    if (hasImage) return "Image";
    return "Attachment";
  }

  if (type.includes("VIDEO")) return "Video";
  if (type.includes("AUDIO")) return "Audio";
  if (type.includes("IMAGE") || type.includes("MEDIA")) return "Media attachment";

  return "Message";
}

function getChatMentionLabel(member = {}) {
  if (member?.mentionEveryone === true) return "everyone";

  return (
    cleanText(member?.preferredName || member?.preferred_name) ||
    cleanText(member?.firstName || member?.first_name || member?.gy_emp_fname) ||
    cleanText(member?.displayName) ||
    cleanText(member?.sibsId)
  );
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderChatMessageText(value, members = [], mine = false) {
  const text = String(value ?? "");
  if (!text) return null;

  const groupMembers = Array.isArray(members) ? members : [];
  const mentionLabels = [...new Set(
    [
      ...(groupMembers.length ? ["everyone"] : []),
      ...groupMembers.map((member) => getChatMentionLabel(member)),
    ].filter(Boolean),
  )].sort((first, second) => second.length - first.length);

  if (!mentionLabels.length) return text;

  const mentionLookup = new Set(
    mentionLabels.map((label) => `@${label}`.toLowerCase()),
  );
  const pattern = mentionLabels.map(escapeRegExp).join("|");
  const parts = text.split(
    new RegExp(`(@(?:${pattern}))(?=$|\\s|[.,!?;:()\\[\\]{}])`, "gi"),
  );

  return parts.map((part, index) => {
    if (!mentionLookup.has(part.toLowerCase())) {
      return <span key={`text-${index}`}>{part}</span>;
    }

    return (
      <span
        key={`mention-${index}`}
        className={
          mine
            ? "rounded bg-white/20 px-0.5 font-extrabold text-white underline decoration-white/50 underline-offset-2"
            : "rounded bg-sibs-cream-light px-1 font-extrabold text-sibs-orange border border-sibs-orange/20"
        }
      >
        {part}
      </span>
    );
  });
}

function getReactionPeopleLabel(reaction = {}) {
  const reactors = Array.isArray(reaction?.reactors) ? reaction.reactors : [];
  const names = reactors
    .map((reactor) =>
      reactor?.reactedByMe ? "You" : getChatMemberDisplayName(reactor),
    )
    .filter(Boolean);

  if (names.length) return names.join(", ");

  const count = Number(reaction?.count || 0);
  return `${count} ${count === 1 ? "person" : "people"}`;
}

function isEmojiOnlyMessage(value) {
  const text = cleanText(value);
  if (!text) return false;

  // Remove complete emoji sequences, then check whether anything except
  // whitespace remains. This supports common emoji, skin tones, ZWJ
  // combinations, flags, variation selectors, and keycap emoji.
  const remaining = text
    .replace(
      /[\p{Extended_Pictographic}\p{Emoji_Presentation}](?:\uFE0E|\uFE0F)?(?:\p{Emoji_Modifier})?(?:\u200D[\p{Extended_Pictographic}\p{Emoji_Presentation}](?:\uFE0E|\uFE0F)?(?:\p{Emoji_Modifier})?)*/gu,
      "",
    )
    .replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, "")
    .replace(/[0-9#*]\uFE0F?\u20E3/gu, "")
    .replace(/[\uFE0E\uFE0F\u200D]/g, "")
    .replace(/\s+/g, "");

  return remaining.length === 0;
}

function getEmojiOnlySizeClass(value) {
  const text = cleanText(value);
  if (!text) return "text-[40px]";

  let emojiCount = Array.from(text).filter((value) => value.trim()).length;

  try {
    if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
      const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
      emojiCount = Array.from(segmenter.segment(text)).filter((part) =>
        cleanText(part.segment),
      ).length;
    }
  } catch {
    // Array.from fallback above is sufficient for display sizing.
  }

  if (emojiCount <= 1) return "text-[46px]";
  if (emojiCount <= 3) return "text-[40px]";
  return "text-[32px]";
}

function getMessageBubbleRadiusClass({ mine, groupStart, groupEnd }) {
  if (groupStart && groupEnd) return "rounded-[18px]";

  if (mine) {
    if (groupStart) return "rounded-[18px] rounded-br-md";
    if (groupEnd) return "rounded-[18px] rounded-tr-md";
    return "rounded-[18px] rounded-r-md";
  }

  if (groupStart) return "rounded-[18px] rounded-bl-md";
  if (groupEnd) return "rounded-[18px] rounded-tl-md";
  return "rounded-[18px] rounded-l-md";
}

function formatClock(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function isFreshChatTimestamp(value, nowMs = Date.now()) {
  if (!value) return false;

  const date = new Date(value);
  const timestamp = date.getTime();
  if (Number.isNaN(timestamp)) return false;

  const elapsedMs = Number(nowMs) - timestamp;

  // Allow a tiny clock-skew tolerance, but do not hide a real timezone mismatch.
  return elapsedMs >= -5000 && elapsedMs < 60_000;
}

function getManilaDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function formatMessageTime(value, nowMs = Date.now()) {
  if (isFreshChatTimestamp(value, nowMs)) return "Now";

  const clock = formatClock(value);
  if (!clock) return "";

  const date = new Date(value);
  const timestamp = date.getTime();
  if (Number.isNaN(timestamp)) return clock;

  const elapsedMs = Math.max(0, Number(nowMs) - timestamp);
  const minutesAgo = Math.max(1, Math.floor(elapsedMs / 60_000));

  if (minutesAgo < 60) {
    return `${clock} · ${minutesAgo}m ago`;
  }

  const hoursAgo = Math.floor(elapsedMs / 3_600_000);
  if (hoursAgo < 24) {
    return `${clock} · ${hoursAgo}h ago`;
  }

  const daysAgo = Math.floor(elapsedMs / 86_400_000);
  return `${clock} · ${daysAgo}d ago`;
}

function formatChatLastSeen(value, nowMs = Date.now()) {
  if (!value) return "";

  const date = new Date(value);
  const timestamp = date.getTime();
  if (Number.isNaN(timestamp)) return "";

  const elapsedMs = Math.max(0, Number(nowMs) - timestamp);
  const minutesAgo = Math.max(1, Math.floor(elapsedMs / 60_000));

  if (minutesAgo < 60) {
    return `${minutesAgo}m ago`;
  }

  const hoursAgo = Math.floor(elapsedMs / 3_600_000);
  if (hoursAgo < 24) {
    return `${hoursAgo}h ago`;
  }

  const daysAgo = Math.floor(elapsedMs / 86_400_000);
  return `${daysAgo}d ago`;
}

function formatConversationTime(value, nowMs = Date.now()) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  if (isFreshChatTimestamp(value, nowMs)) return "Now";

  const sameDate = getManilaDateKey(date) === getManilaDateKey(new Date(nowMs));

  if (sameDate) return formatClock(value);

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatMessageDay(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getUserSibsId(user = {}) {
  return cleanText(
    user?.sibsId ||
      user?.sibs_id ||
      user?.username ||
      user?.gy_emp_code ||
      user?.employeeId ||
      user?.employee_id,
  );
}

function isSameDay(firstValue, secondValue) {
  if (!firstValue || !secondValue) return false;
  const first = new Date(firstValue);
  const second = new Date(secondValue);

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function formatMessengerCenterTimestamp(currentValue, previousValue) {
  if (!currentValue) return "";
  const date = new Date(currentValue);
  if (Number.isNaN(date.getTime())) return "";

  const clock = formatClock(currentValue);
  if (!clock) return "";

  // If there is a previous message on the same calendar day, this header was triggered by a >= 15m gap
  if (previousValue && isSameDay(previousValue, currentValue)) {
    return clock;
  }

  // Cross-day or first message: include date context
  const now = new Date();
  if (isSameDay(date, now)) {
    return `Today · ${clock}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return `Yesterday · ${clock}`;
  }

  const elapsedDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (elapsedDays >= 0 && elapsedDays < 7) {
    const weekday = new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      weekday: "short",
    }).format(date);
    return `${weekday} · ${clock}`;
  }

  const sameYear = date.getFullYear() === now.getFullYear();
  const dateStr = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);

  return `${dateStr} · ${clock}`;
}

function getChatProfilePictureUrl(employee = {}) {
  const directUrl = cleanText(
    employee?.profilePictureUrl || employee?.profile_picture_url,
  );

  if (directUrl) {
    return getChatAttachmentUrl(directUrl);
  }

  const filename = cleanText(
    employee?.profileFilename ||
      employee?.profile_filename ||
      employee?.profilePicture ||
      employee?.profile_picture,
  );

  if (!filename) return "";

  return getChatAttachmentUrl(
    `/api/employee-profile/file/${encodeURIComponent(filename)}`,
  );
}

function getChatAvatarPreviewPosition(element) {
  if (!element || typeof window === "undefined") return null;

  const rect = element.getBoundingClientRect();
  const previewHeight = 176;
  const gap = 12;
  const viewportPadding = 8;
  const availableAbove = rect.top - gap;
  const placeBelow = availableAbove < previewHeight;

  return {
    left: Math.max(
      viewportPadding + 88,
      Math.min(
        rect.left + rect.width / 2,
        window.innerWidth - viewportPadding - 88,
      ),
    ),
    top: placeBelow ? rect.bottom + gap : rect.top - gap,
    placeBelow,
  };
}

function ChatAvatar({
  employee = null,
  initials = "U",
  online = false,
  group = false,
  size = "md",
}) {
  const sizeClass = {
    xs: "h-[18px] w-[18px] text-[7px]",
    chat: "h-7 w-7 text-[10px]",
    sm: "h-9 w-9 text-[11px]",
    md: "h-11 w-11 text-xs",
    lg: "h-12 w-12 text-sm",
  }[size] || "h-11 w-11 text-xs";

  const onlineDotClass =
    size === "xs" || size === "chat"
      ? "h-2.5 w-2.5 border-[1.5px]"
      : "h-3 w-3 border-2";

  const avatarRef = useRef(null);
  const profilePictureUrl = group ? "" : getChatProfilePictureUrl(employee);
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(null);
  const canShowProfilePicture =
    Boolean(profilePictureUrl) && failedImageUrl !== profilePictureUrl;

  useEffect(() => {
    setFailedImageUrl("");
  }, [profilePictureUrl]);

  function showPreview() {
    if (group) return;
    setPreviewPosition(getChatAvatarPreviewPosition(avatarRef.current));
    setPreviewVisible(true);
  }

  function hidePreview() {
    setPreviewVisible(false);
  }

  useEffect(() => {
    if (!previewVisible || group) return undefined;

    const updatePreviewPosition = () => {
      setPreviewPosition(getChatAvatarPreviewPosition(avatarRef.current));
    };

    window.addEventListener("resize", updatePreviewPosition);
    window.addEventListener("scroll", updatePreviewPosition, true);

    return () => {
      window.removeEventListener("resize", updatePreviewPosition);
      window.removeEventListener("scroll", updatePreviewPosition, true);
    };
  }, [group, previewVisible]);

  const preview =
    !group &&
    previewVisible &&
    previewPosition &&
    typeof document !== "undefined"
      ? createPortal(
          <span
            className="pointer-events-none fixed z-[9999] rounded-2xl border border-sibs-border bg-white p-2 shadow-2xl"
            style={{
              left: previewPosition.left,
              top: previewPosition.top,
              transform: previewPosition.placeBelow
                ? "translate(-50%, 0)"
                : "translate(-50%, -100%)",
            }}
            aria-hidden="true"
          >
            <span className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-xl bg-sibs-navy text-[24px] font-extrabold text-white">
              <span>{cleanText(initials).slice(0, 2)}</span>
              {canShowProfilePicture ? (
                <img
                  src={profilePictureUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={() => setFailedImageUrl(profilePictureUrl)}
                />
              ) : null}
            </span>
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={avatarRef}
        className="relative inline-flex shrink-0"
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
      >
        <span
          className={`relative inline-flex ${sizeClass} items-center justify-center overflow-hidden rounded-full bg-sibs-navy font-extrabold text-white shadow-sm`}
        >
          {group ? (
            <UsersRound size={18} />
          ) : (
            <>
              <span aria-hidden="true">{cleanText(initials).slice(0, 2)}</span>
              {canShowProfilePicture ? (
                <img
                  src={profilePictureUrl}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={() => setFailedImageUrl(profilePictureUrl)}
                />
              ) : null}
            </>
          )}
        </span>
        {!group && online ? (
          <span
            className={`absolute bottom-0 right-0 rounded-full border-white bg-emerald-500 ${onlineDotClass}`}
          />
        ) : null}
      </span>
      {preview}
    </>
  );
}

function EmptyChatState({ onNewChat }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-sibs-canvas px-8 text-center">
      <div className="max-w-sm">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-sibs-cream-light border border-sibs-orange/20 text-sibs-orange">
          <MessageCircleMore size={27} />
        </span>
        <h3 className="mt-4 font-heading text-lg font-extrabold text-sibs-navy">
          SiBS Chat
        </h3>
        <p className="mt-2 text-sm font-medium leading-6 text-sibs-muted">
          Send a private message or create a group chat with other HRIS users.
        </p>
        <button
          type="button"
          onClick={onNewChat}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sibs-orange px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:brightness-95"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>
    </div>
  );
}

function NewChatOverlay({
  open,
  onClose,
  onPrivateChat,
  onCreateGroup,
  busy,
}) {
  const [mode, setMode] = useState("private");
  const [query, setQuery] = useState("");
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;

    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);

      try {
        const result = await getChatParticipants(query, 0);
        if (active) {
          setParticipants(result);
          setError("");
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              "Unable to search HRIS users.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 220);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  useEffect(() => {
    if (!open) {
      setMode("private");
      setQuery("");
      setSelectedIds([]);
      setGroupName("");
      setError("");
    }
  }, [open]);

  if (!open) return null;

  function toggleMember(sibsId) {
    setSelectedIds((current) =>
      current.includes(sibsId)
        ? current.filter((id) => id !== sibsId)
        : [...current, sibsId],
    );
  }

  async function handleCreateGroup() {
    if (!cleanText(groupName)) {
      setError("Enter a group name.");
      return;
    }

    if (!selectedIds.length) {
      setError("Select at least one employee for the group.");
      return;
    }

    try {
      setError("");
      await onCreateGroup({
        name: groupName,
        memberSibsIds: selectedIds,
      });
      onClose();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to create the group chat.",
      );
    }
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-white">
      <header className="flex items-center gap-3 border-b border-sibs-border bg-white px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-sibs-muted transition hover:bg-sibs-surface hover:text-sibs-navy"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-base font-extrabold text-sibs-navy">
            New Chat
          </h3>
          <p className="text-[11px] font-semibold text-sibs-muted">
            Private message or group conversation
          </p>
        </div>
      </header>

      <div className="border-b border-sibs-border px-4 py-3">
        <div className="grid grid-cols-2 rounded-xl bg-sibs-surface p-1">
          <button
            type="button"
            onClick={() => setMode("private")}
            className={`rounded-lg px-3 py-2 text-xs font-extrabold transition ${
              mode === "private"
                ? "bg-white text-sibs-navy shadow-sm"
                : "text-sibs-muted"
            }`}
          >
            Private Message
          </button>
          <button
            type="button"
            onClick={() => setMode("group")}
            className={`rounded-lg px-3 py-2 text-xs font-extrabold transition ${
              mode === "group"
                ? "bg-white text-sibs-navy shadow-sm"
                : "text-sibs-muted"
            }`}
          >
            Group Chat
          </button>
        </div>

        {mode === "group" ? (
          <input
            type="text"
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            maxLength={120}
            placeholder="Group name"
            className="mt-3 h-10 w-full rounded-xl border border-sibs-border bg-white px-3 text-sm font-semibold text-sibs-navy outline-none transition focus:border-sibs-orange focus:ring-2 focus:ring-sibs-orange/10"
          />
        ) : null}

        <label className="relative mt-3 block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sibs-faint"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, SIBS ID, or email..."
            className="h-10 w-full rounded-xl border border-sibs-border bg-sibs-surface pl-9 pr-3 text-sm font-semibold text-sibs-navy outline-none transition focus:border-sibs-orange focus:bg-white focus:ring-2 focus:ring-sibs-orange/10"
          />
        </label>
      </div>

      {error ? (
        <div className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <div className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sibs-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : participants.length ? (
          participants.map((participant) => {
            const selected = selectedIds.includes(participant.sibsId);

            return (
              <button
                key={participant.sibsId}
                type="button"
                disabled={busy}
                onClick={() => {
                  if (mode === "group") {
                    toggleMember(participant.sibsId);
                    return;
                  }

                  void (async () => {
                    try {
                      setError("");
                      await onPrivateChat(participant.sibsId);
                      onClose();
                    } catch (requestError) {
                      setError(
                        requestError?.response?.data?.message ||
                          requestError?.message ||
                          "Unable to start the private chat.",
                      );
                    }
                  })();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-sibs-surface disabled:opacity-50"
              >
                <ChatAvatar
                  employee={participant}
                  initials={participant.initials}
                  online={participant.online}
                  size="sm"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-sibs-navy">
                    {participant.displayName}
                  </span>
                  <span className="block truncate text-[11px] font-semibold text-sibs-muted">
                    SIBS ID {participant.sibsId}
                    {participant.account ? ` · ${participant.account}` : ""}
                  </span>
                </span>

                {mode === "group" ? (
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full border transition ${
                      selected
                        ? "border-sibs-orange bg-sibs-orange text-white"
                        : "border-sibs-border bg-white text-transparent"
                    }`}
                  >
                    <Check size={13} />
                  </span>
                ) : null}
              </button>
            );
          })
        ) : (
          <div className="flex h-full items-center justify-center px-8 text-center text-xs font-semibold text-sibs-muted">
            No HRIS users found.
          </div>
        )}
      </div>

      {mode === "group" ? (
        <footer className="border-t border-sibs-border bg-white px-4 py-3">
          <button
            type="button"
            onClick={handleCreateGroup}
            disabled={busy || !selectedIds.length || !cleanText(groupName)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-sibs-orange text-sm font-extrabold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <UsersRound size={16} />}
            Create Group ({selectedIds.length})
          </button>
        </footer>
      ) : null}
    </div>
  );
}

function GroupInfoOverlay({
  conversation,
  currentSibsId,
  presence,
  open,
  onClose,
  onRename,
  onAddMembers,
  onRemoveMember,
  onLeave,
}) {
  const [name, setName] = useState("");
  const [addingMembers, setAddingMembers] = useState(false);
  const [query, setQuery] = useState("");
  const [participants, setParticipants] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const members = useMemo(
    () => conversation?.members || [],
    [conversation?.members],
  );
  const isAdmin = cleanText(conversation?.currentUserRole).toUpperCase() === "ADMIN";
  const isCreator =
    cleanText(conversation?.createdBySibsId) === cleanText(currentSibsId);

  useEffect(() => {
    setName(conversation?.name || conversation?.title || "");
  }, [conversation?.id, conversation?.name, conversation?.title]);

  useEffect(() => {
    if (!open || !addingMembers) return undefined;

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const result = await getChatParticipants(query, 0);
        const existing = new Set(members.map((member) => member.sibsId));
        if (active) {
          setParticipants(result.filter((participant) => !existing.has(participant.sibsId)));
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              "Unable to search employees.",
          );
        }
      }
    }, 220);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [addingMembers, members, open, query]);

  if (!open || !conversation?.isGroup) return null;

  async function saveName() {
    if (!isAdmin || cleanText(name) === cleanText(conversation.name)) return;

    try {
      setBusy(true);
      setError("");
      await onRename(conversation.id, name);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to rename the group.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function addSelectedMembers() {
    if (!isCreator || !selectedIds.length) return;

    try {
      setBusy(true);
      setError("");
      await onAddMembers(conversation.id, selectedIds);
      setSelectedIds([]);
      setQuery("");
      setAddingMembers(false);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to add group members.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(sibsId) {
    if (!isCreator) return;

    try {
      setBusy(true);
      setError("");
      await onRemoveMember(conversation.id, sibsId);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to remove the group member.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function leaveGroup() {
    try {
      setBusy(true);
      setError("");
      await onLeave(conversation.id);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to leave the group.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white">
      <header className="flex items-center gap-3 border-b border-sibs-border px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-sibs-muted transition hover:bg-sibs-surface hover:text-sibs-navy"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h3 className="font-heading text-base font-extrabold text-sibs-navy">
            Group Info
          </h3>
          <p className="text-[11px] font-semibold text-sibs-muted">
            {members.length} member{members.length === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      <div className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {error ? (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="rounded-2xl border border-sibs-border bg-sibs-surface p-4">
          <label className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-sibs-faint">
            Group Name
          </label>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={!isAdmin || busy}
              maxLength={120}
              className="h-10 min-w-0 flex-1 rounded-xl border border-sibs-border bg-white px-3 text-sm font-bold text-sibs-navy outline-none disabled:bg-slate-100 disabled:text-sibs-muted"
            />
            {isAdmin ? (
              <button
                type="button"
                onClick={saveName}
                disabled={busy || !cleanText(name)}
                className="rounded-xl bg-sibs-navy px-4 text-xs font-extrabold text-white disabled:opacity-40"
              >
                Save
              </button>
            ) : null}
          </div>
        </section>

        <section className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-extrabold text-sibs-navy">Members</p>
            {isCreator ? (
              <button
                type="button"
                onClick={() => setAddingMembers((current) => !current)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold text-sibs-orange transition hover:bg-sibs-cream-light"
              >
                <UserPlus size={14} />
                Add Member
              </button>
            ) : null}
          </div>

          {addingMembers ? (
            <div className="mb-3 rounded-2xl border border-sibs-border bg-white p-3 shadow-sm">
              <label className="relative block">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-faint" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search employees..."
                  className="h-9 w-full rounded-xl border border-sibs-border bg-sibs-surface pl-9 pr-3 text-xs font-semibold outline-none focus:border-sibs-orange"
                />
              </label>

              <div className="mt-2 max-h-48 overflow-y-auto">
                {participants.map((participant) => {
                  const selected = selectedIds.includes(participant.sibsId);
                  return (
                    <button
                      key={participant.sibsId}
                      type="button"
                      onClick={() =>
                        setSelectedIds((current) =>
                          selected
                            ? current.filter((id) => id !== participant.sibsId)
                            : [...current, participant.sibsId],
                        )
                      }
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-sibs-surface"
                    >
                      <ChatAvatar
                        employee={participant}
                        initials={participant.initials}
                        online={participant.online}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-extrabold text-sibs-navy">
                          {getChatMemberDisplayName(participant)}
                        </span>
                        <span className="block text-[10px] font-semibold text-sibs-muted">
                          SIBS ID {participant.sibsId}
                        </span>
                      </span>
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${selected ? "border-sibs-orange bg-sibs-orange text-white" : "border-sibs-border text-transparent"}`}>
                        <Check size={11} />
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={addSelectedMembers}
                disabled={busy || !selectedIds.length}
                className="mt-2 h-9 w-full rounded-xl bg-sibs-orange text-xs font-extrabold text-white disabled:opacity-40"
              >
                Add Selected ({selectedIds.length})
              </button>
            </div>
          ) : null}

          <div className="space-y-1">
            {members.map((member) => {
              const online = presence?.[member.sibsId] ?? member.online;
              const isCurrent = member.sibsId === currentSibsId;

              return (
                <div
                  key={member.sibsId}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-sibs-surface"
                >
                  <ChatAvatar
                    employee={member}
                    initials={member.initials}
                    online={online}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold text-sibs-navy">
                      {getChatMemberDisplayName(member)}
                      {isCurrent ? " (You)" : ""}
                    </p>
                    <p className="text-[10px] font-semibold text-sibs-muted">
                      SIBS ID {member.sibsId}
                      {member.memberRole === "ADMIN" ? " · Admin" : ""}
                    </p>
                  </div>

                  {isCreator && !isCurrent && member.memberRole !== "ADMIN" ? (
                    <button
                      type="button"
                      onClick={() => void removeMember(member.sibsId)}
                      disabled={busy}
                      title="Remove member"
                      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-extrabold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <footer className="border-t border-sibs-border px-4 py-3">
        <button
          type="button"
          onClick={() => void leaveGroup()}
          disabled={busy}
          className="h-10 w-full rounded-xl border border-red-200 bg-red-50 text-xs font-extrabold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
        >
          Leave Group
        </button>
      </footer>
    </div>
  );
}

function MembershipNoticeCard({ notice, onOpenGroup, onDismiss }) {
  if (!notice) return null;

  const added = cleanText(notice.action).toLowerCase() === "added";

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full rounded-2xl border border-sibs-border bg-white p-3 shadow-xl"
    >
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            added
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {added ? <UserPlus size={17} /> : <UsersRound size={17} />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold text-sibs-navy">
            {added ? "Added to group" : "Removed from group"}
          </p>
          <p className="mt-0.5 break-words text-[11px] font-semibold leading-4 text-sibs-muted">
            {notice.message}
          </p>

          {added ? (
            <button
              type="button"
              onClick={onOpenGroup}
              className="mt-2 inline-flex h-8 items-center justify-center rounded-lg bg-sibs-orange px-3 text-[10px] font-extrabold text-white transition hover:brightness-95"
            >
              Open Group
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss group notification"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sibs-faint transition hover:bg-sibs-surface hover:text-sibs-navy"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

export default function SiBSChat({
  enabled = true,
  isOpen: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}) {
  const location = useLocation();
  const { user, loading: userLoading } = useUser() || {};
  const chat = useChat();
  const refreshChatConversations = chat?.refreshConversations;
  const selectChatConversation = chat?.selectConversation;

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedBounds, setExpandedBounds] = useState(null);
  const chatPanelRef = useRef(null);
  const layoutStartRef = useRef(null);
  const layoutAnimationRef = useRef(null);

  const setOpen = useCallback(
    (nextOpen) => {
      const resolvedOpen =
        typeof nextOpen === "function" ? nextOpen(open) : nextOpen;
      if (!isControlled) {
        setInternalOpen(resolvedOpen);
      }
      onOpenChange?.(resolvedOpen);
    },
    [isControlled, open, onOpenChange],
  );
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [conversationSearch, setConversationSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [sending, setSending] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const [attachmentNotice, setAttachmentNotice] = useState("");
  const [presenceClockMs, setPresenceClockMs] = useState(() => Date.now());
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [gifSearch, setGifSearch] = useState("");
  const [gifResults, setGifResults] = useState([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [gifError, setGifError] = useState("");
  const [chatClockMs, setChatClockMs] = useState(() => Date.now());
  const [messageActionId, setMessageActionId] = useState(null);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState(null);
  const [reactingMessageId, setReactingMessageId] = useState(null);
  const [unsendingMessageId, setUnsendingMessageId] = useState(null);
  const [unsendConfirmMessage, setUnsendConfirmMessage] = useState(null);
  const [conversationActionId, setConversationActionId] = useState(null);
  const [conversationActionBusyId, setConversationActionBusyId] = useState(null);
  const [deleteConversationConfirm, setDeleteConversationConfirm] = useState(null);
  const [nicknameConversation, setNicknameConversation] = useState(null);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [launcherPosition, setLauncherPosition] = useState(null);
  const [launcherDragging, setLauncherDragging] = useState(false);
  const [mentionStart, setMentionStart] = useState(null);
  const [mentionEnd, setMentionEnd] = useState(null);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionActiveIndex, setMentionActiveIndex] = useState(0);

  const messageScrollRef = useRef(null);
  const messagesListContentRef = useRef(null);
  const messageEndRef = useRef(null);
  const isInitialConversationLoadRef = useRef(true);
  const isNearBottomRef = useRef(true);
  const prevLoadingOlderRef = useRef(false);
  const olderMessagesScrollHeightRef = useRef(0);
  const olderMessagesScrollTopRef = useRef(0);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const gifPickerRef = useRef(null);
  const gifButtonRef = useRef(null);
  const gifSearchInputRef = useRef(null);
  const selectedImagesRef = useRef([]);
  const typingStopTimerRef = useRef(null);
  const typingLastSentAtRef = useRef(0);
  const typingConversationIdRef = useRef(null);
  const previousOpenRef = useRef(false);
  const launcherRef = useRef(null);
  const launcherDragRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
    moved: false,
  });
  const suppressLauncherClickRef = useRef(false);

  const currentSibsId = getUserSibsId(user);
  const visible =
    enabled &&
    !userLoading &&
    Boolean(user) &&
    Boolean(chat) &&
    chat?.chatAllowed === true;
  const conversationTheme = chat?.activeConversation?.theme;
  const [imageLuminanceIsDark, setImageLuminanceIsDark] = useState(null);

  useEffect(() => {
    if (conversationTheme?.type !== "IMAGE" || !conversationTheme?.imageUrl) {
      setImageLuminanceIsDark(null);
      return;
    }

    let isMounted = true;
    let objectUrl = null;

    async function analyzeWallpaperLuminance() {
      try {
        const timestamp = conversationTheme.updatedAt
          ? new Date(conversationTheme.updatedAt).getTime()
          : "";
        const separator = conversationTheme.imageUrl.includes("?") ? "&" : "?";
        const cacheBustedPath =
          timestamp && !conversationTheme.imageUrl.includes("t=") && !conversationTheme.imageUrl.includes("v=")
            ? `${conversationTheme.imageUrl}${separator}t=${timestamp}`
            : conversationTheme.imageUrl;

        const blob = await getChatThemeImageBlob(cacheBustedPath);
        if (!isMounted || !blob) return;

        objectUrl = URL.createObjectURL(blob);
        const img = new Image();

        img.onload = () => {
          if (!isMounted) return;
          try {
            const canvas = document.createElement("canvas");
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) return;
            ctx.drawImage(img, 0, 0, 32, 32);
            const data = ctx.getImageData(0, 0, 32, 32).data;
            setImageLuminanceIsDark(calculatePixelLuminanceIsDark(data));
          } catch {
            setImageLuminanceIsDark(false);
          } finally {
            if (objectUrl) {
              URL.revokeObjectURL(objectUrl);
              objectUrl = null;
            }
          }
        };

        img.onerror = () => {
          if (isMounted) setImageLuminanceIsDark(false);
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
          }
        };

        img.src = objectUrl;
      } catch {
        if (isMounted) setImageLuminanceIsDark(false);
      }
    }

    void analyzeWallpaperLuminance();

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [conversationTheme?.imageUrl, conversationTheme?.type, conversationTheme?.updatedAt]);

  const themeBackgroundStyle = useMemo(
    () => getChatThemeBackgroundStyle(conversationTheme),
    [conversationTheme],
  );

  const updateExpandedBounds = useCallback(() => {
    const pageHeaderCard = document.querySelector("main .sibs-page-header-in");
    const pageContentBounds =
      pageHeaderCard?.closest("main .mx-auto[class*='max-w-']") ||
      document.querySelector("main .mx-auto[class*='max-w-']");
    const contentBounds =
      pageContentBounds ||
      pageHeaderCard ||
      document.querySelector(".sibs-dashboard-header-inner") ||
      document.querySelector(".app-header-inner") ||
      document.querySelector("main");
    const headerBounds =
      pageHeaderCard ||
      document.querySelector(".sibs-dashboard-header") ||
      document.querySelector(".sibs-dashboard-header-skeleton") ||
      document.querySelector(".app-header");
    const contentRect = contentBounds?.getBoundingClientRect();
    const headerRect = headerBounds?.getBoundingClientRect();
    const workspace = contentRect
      ? { left: contentRect.left, width: contentRect.width }
      : { left: 0, width: window.innerWidth };

    setExpandedBounds(
      getExpandedChatBounds({
        workspace,
        top: pageContentBounds
          ? contentRect?.top ?? headerRect?.top ?? 0
          : pageHeaderCard
          ? headerRect?.top ?? 0
          : headerRect?.bottom ?? 0,
        viewportHeight: window.innerHeight,
        gutter: contentRect ? 0 : 16,
      }),
    );
  }, []);

  useEffect(() => {
    if (!isExpanded || !open) return undefined;

    const pageHeaderCard = document.querySelector("main .sibs-page-header-in");
    const pageContentBounds =
      pageHeaderCard?.closest("main .mx-auto[class*='max-w-']") ||
      document.querySelector("main .mx-auto[class*='max-w-']");
    const contentBounds =
      pageContentBounds ||
      pageHeaderCard ||
      document.querySelector(".sibs-dashboard-header-inner") ||
      document.querySelector(".app-header-inner") ||
      document.querySelector("main");
    const headerBounds =
      pageHeaderCard ||
      document.querySelector(".sibs-dashboard-header") ||
      document.querySelector(".sibs-dashboard-header-skeleton") ||
      document.querySelector(".app-header");
    updateExpandedBounds();
    window.addEventListener("resize", updateExpandedBounds);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateExpandedBounds)
        : null;
    if (contentBounds) resizeObserver?.observe(contentBounds);
    if (headerBounds && headerBounds !== contentBounds) {
      resizeObserver?.observe(headerBounds);
    }

    return () => {
      window.removeEventListener("resize", updateExpandedBounds);
      resizeObserver?.disconnect();
    };
  }, [isExpanded, location.pathname, open, updateExpandedBounds]);

  useEffect(() => {
    if (!open) {
      setIsExpanded(false);
      setExpandedBounds(null);
    }
  }, [open]);

  useLayoutEffect(() => {
    const panel = chatPanelRef.current;
    const from = layoutStartRef.current;
    if (!panel || !from) return;

    layoutStartRef.current = null;
    const to = panel.getBoundingClientRect();
    if (
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ||
      typeof panel.animate !== "function"
    ) {
      return;
    }

    const { translateX, translateY, scaleX, scaleY } = getChatLayoutFlip(from, to);
    const styles = window.getComputedStyle(panel);
    const duration = Number.parseFloat(styles.getPropertyValue("--resize-dur")) || 300;
    const easing =
      styles.getPropertyValue("--resize-ease").trim() ||
      "cubic-bezier(0.22, 1, 0.36, 1)";

    layoutAnimationRef.current = panel.animate(
      [
        {
          transformOrigin: "top left",
          transform: `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`,
        },
        {
          transformOrigin: "top left",
          transform: "translate(0px, 0px) scale(1, 1)",
        },
      ],
      { duration, easing },
    );
    layoutAnimationRef.current.onfinish = () => {
      layoutAnimationRef.current = null;
    };
  }, [expandedBounds, isExpanded]);

  const toggleExpanded = useCallback(() => {
    const panel = chatPanelRef.current;
    layoutStartRef.current = panel?.getBoundingClientRect() ?? null;
    layoutAnimationRef.current?.cancel();
    layoutAnimationRef.current = null;

    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    updateExpandedBounds();
    setIsExpanded(true);
  }, [isExpanded, updateExpandedBounds]);

  useEffect(() => {
    setReplyingToMessage(null);
  }, [chat?.activeConversationId]);

  useEffect(() => {
    if (!launcherPosition) return undefined;

    function keepLauncherInsideViewport() {
      const element = launcherRef.current;
      if (!element) return;

      const margin = 8;
      const maxLeft = Math.max(margin, window.innerWidth - element.offsetWidth - margin);
      const maxTop = Math.max(margin, window.innerHeight - element.offsetHeight - margin);

      setLauncherPosition((current) => {
        if (!current) return current;

        const left = Math.min(Math.max(margin, current.left), maxLeft);
        const top = Math.min(Math.max(margin, current.top), maxTop);

        if (left === current.left && top === current.top) return current;
        return { left, top };
      });
    }

    window.addEventListener("resize", keepLauncherInsideViewport);
    return () => window.removeEventListener("resize", keepLauncherInsideViewport);
  }, [launcherPosition]);

  useEffect(() => {
    chat?.setChatWindowOpen?.(open);

    if (typeof window !== "undefined") {
      window.__SIBS_CHAT_OPEN__ = Boolean(open);
      window.dispatchEvent(
        new CustomEvent("sibs-chat-open-change", {
          detail: { open: Boolean(open) },
        }),
      );
    }
  }, [chat?.setChatWindowOpen, open]);

  useEffect(() => {
    return () => {
      chat?.setChatWindowOpen?.(false);

      if (typeof window !== "undefined") {
        window.__SIBS_CHAT_OPEN__ = false;
        window.dispatchEvent(
          new CustomEvent("sibs-chat-open-change", {
            detail: { open: false },
          }),
        );
      }
    };
  }, [chat?.setChatWindowOpen]);

  useEffect(() => {
    if (typeof document === "undefined" || !isMobileChatDevice()) {
      return undefined;
    }

    const handleMobileVisibilityChange = () => {
      if (document.visibilityState === "visible") return;

      // Locking/sleeping the phone should end the current "viewed" session.
      // When the user wakes the phone, the unread badge stays until SiBS Chat
      // is deliberately opened again.
      setOpen(false);
      chat?.setChatWindowOpen?.(false);
    };

    document.addEventListener("visibilitychange", handleMobileVisibilityChange);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleMobileVisibilityChange,
      );
    };
  }, [chat?.setChatWindowOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    let cancelled = false;

    const openChatConversation = async (conversationId) => {
      const id = Number(conversationId || 0);
      if (!id || cancelled) return;

      setOpen(true);
      setNewChatOpen(false);
      setGroupInfoOpen(false);

      try {
        await refreshChatConversations?.();

        if (!cancelled) {
          await selectChatConversation?.(id);
        }
      } catch {
        // The user can still open SiBS Chat manually if navigation fails.
      }
    };

    const handleServiceWorkerMessage = (event) => {
      const payload = event?.data || {};

      if (payload?.type !== "SIBS_CHAT_OPEN_CONVERSATION") return;
      void openChatConversation(payload?.conversationId);
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener(
        "message",
        handleServiceWorkerMessage,
      );
    }

    const currentUrl = new URL(window.location.href);
    const shouldOpenFromNotification =
      currentUrl.searchParams.get("sibsChat") === "1";
    const notificationConversationId = Number(
      currentUrl.searchParams.get("conversationId") || 0,
    );

    if (shouldOpenFromNotification && notificationConversationId) {
      currentUrl.searchParams.delete("sibsChat");
      currentUrl.searchParams.delete("conversationId");

      window.history.replaceState(
        window.history.state,
        "",
        `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
      );

      void openChatConversation(notificationConversationId);
    }

    return () => {
      cancelled = true;

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener(
          "message",
          handleServiceWorkerMessage,
        );
      }
    };
  }, [refreshChatConversations, selectChatConversation]);

  useEffect(() => {
    if (!open) return;

    // If permission was already granted, refresh/save the Push subscription
    // whenever SiBS Chat opens. The launcher click below remains the user
    // gesture that can request permission the first time.
    void ensureSibsChatSystemNotifications();
  }, [open]);

  useEffect(() => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      void ensureSibsChatSystemNotifications();
    }
  }, []);

  useEffect(() => {
    const justOpened = open && !previousOpenRef.current;
    previousOpenRef.current = open;

    if (!justOpened || !chat?.activeConversationId) return;

    // Re-load the visible conversation when the panel is opened. This is the
    // point where its unread messages become read. Messages received while
    // the panel is closed remain unread and keep the notification badge.
    void chat.selectConversation(chat.activeConversationId);
  }, [chat?.activeConversationId, chat?.selectConversation, open]);

  useEffect(() => {
    if (!open) return undefined;

    setChatClockMs(Date.now());

    const timer = window.setInterval(() => {
      setChatClockMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [open]);

  useEffect(() => {
    if (!messageActionId) return undefined;

    function closeMessageActions(event) {
      if (event.key === "Escape") {
        setMessageActionId(null);
        return;
      }

      if (event.type === "pointerdown") {
        const element = event.target?.closest?.("[data-chat-message-actions]");
        if (!element) setMessageActionId(null);
      }
    }

    document.addEventListener("pointerdown", closeMessageActions);
    document.addEventListener("keydown", closeMessageActions);

    return () => {
      document.removeEventListener("pointerdown", closeMessageActions);
      document.removeEventListener("keydown", closeMessageActions);
    };
  }, [messageActionId]);

  useEffect(() => {
    if (!conversationActionId) return undefined;

    function closeConversationActions(event) {
      if (event.key === "Escape") {
        setConversationActionId(null);
        return;
      }

      if (event.type === "pointerdown") {
        const element = event.target?.closest?.("[data-chat-conversation-actions]");
        if (!element) setConversationActionId(null);
      }
    }

    document.addEventListener("pointerdown", closeConversationActions);
    document.addEventListener("keydown", closeConversationActions);

    return () => {
      document.removeEventListener("pointerdown", closeConversationActions);
      document.removeEventListener("keydown", closeConversationActions);
    };
  }, [conversationActionId]);

  useEffect(() => {
    if (!deleteConversationConfirm) return undefined;

    function handleDeleteConversationKeyDown(event) {
      if (event.key === "Escape" && !conversationActionBusyId) {
        setDeleteConversationConfirm(null);
      }
    }

    document.addEventListener("keydown", handleDeleteConversationKeyDown);
    return () => document.removeEventListener("keydown", handleDeleteConversationKeyDown);
  }, [conversationActionBusyId, deleteConversationConfirm]);

  useEffect(() => {
    if (!nicknameConversation) return undefined;

    function handleNicknameKeyDown(event) {
      if (event.key === "Escape" && !nicknameSaving) {
        setNicknameConversation(null);
        setNicknameDraft("");
      }
    }

    document.addEventListener("keydown", handleNicknameKeyDown);
    return () => document.removeEventListener("keydown", handleNicknameKeyDown);
  }, [nicknameConversation, nicknameSaving]);

  useEffect(() => {
    if (!reactionPickerMessageId) return undefined;

    function closeReactionPicker(event) {
      if (event.key === "Escape") {
        setReactionPickerMessageId(null);
        return;
      }

      if (event.type === "pointerdown") {
        const element = event.target?.closest?.("[data-chat-reaction-picker]");
        if (!element) setReactionPickerMessageId(null);
      }
    }

    document.addEventListener("pointerdown", closeReactionPicker);
    document.addEventListener("keydown", closeReactionPicker);

    return () => {
      document.removeEventListener("pointerdown", closeReactionPicker);
      document.removeEventListener("keydown", closeReactionPicker);
    };
  }, [reactionPickerMessageId]);

  useEffect(() => {
    if (!unsendConfirmMessage) return undefined;

    function handleUnsendModalKeyDown(event) {
      if (event.key === "Escape" && !unsendingMessageId) {
        setUnsendConfirmMessage(null);
      }
    }

    document.addEventListener("keydown", handleUnsendModalKeyDown);
    return () => document.removeEventListener("keydown", handleUnsendModalKeyDown);
  }, [unsendConfirmMessage, unsendingMessageId]);

  useEffect(() => {
    if (!emojiPickerOpen) return undefined;

    function handleEmojiPickerPointerDown(event) {
      const target = event.target;

      if (emojiPickerRef.current?.contains(target)) return;
      if (emojiButtonRef.current?.contains(target)) return;

      setEmojiPickerOpen(false);
    }

    function handleEmojiPickerKeyDown(event) {
      if (event.key === "Escape") {
        setEmojiPickerOpen(false);
        window.requestAnimationFrame(() => textareaRef.current?.focus());
      }
    }

    document.addEventListener("mousedown", handleEmojiPickerPointerDown);
    document.addEventListener("keydown", handleEmojiPickerKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleEmojiPickerPointerDown);
      document.removeEventListener("keydown", handleEmojiPickerKeyDown);
    };
  }, [emojiPickerOpen]);

  useEffect(() => {
    if (!gifPickerOpen) return undefined;

    function handleGifPickerPointerDown(event) {
      const target = event.target;

      if (gifPickerRef.current?.contains(target)) return;
      if (gifButtonRef.current?.contains(target)) return;

      setGifPickerOpen(false);
    }

    function handleGifPickerKeyDown(event) {
      if (event.key === "Escape") {
        setGifPickerOpen(false);
        window.requestAnimationFrame(() => textareaRef.current?.focus());
      }
    }

    document.addEventListener("mousedown", handleGifPickerPointerDown);
    document.addEventListener("keydown", handleGifPickerKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleGifPickerPointerDown);
      document.removeEventListener("keydown", handleGifPickerKeyDown);
    };
  }, [gifPickerOpen]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, 40), 112);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > 112 ? "auto" : "hidden";
  }, [draft]);

  useEffect(() => {
    if (!gifPickerOpen) return undefined;

    const controller = new AbortController();
    const query = cleanText(gifSearch);

    const timer = window.setTimeout(async () => {
      try {
        setGifLoading(true);
        setGifError("");

        const results = query
          ? await searchChatGifs(query, { signal: controller.signal })
          : await getTrendingChatGifs({ signal: controller.signal });

        setGifResults(results);
      } catch (error) {
        if (error?.name === "AbortError") return;
        setGifResults([]);
        setGifError(error?.message || "Unable to load online GIFs.");
      } finally {
        if (!controller.signal.aborted) {
          setGifLoading(false);
        }
      }
    }, query ? 350 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [gifPickerOpen, gifSearch]);

  useEffect(() => {
    if (open) return;
    setEmojiPickerOpen(false);
    setGifPickerOpen(false);
  }, [open]);

  const filteredConversations = useMemo(() => {
    const query = cleanText(conversationSearch).toLowerCase();
    if (!query) return chat?.conversations || [];

    return (chat?.conversations || []).filter((conversation) => {
      const haystack = [
        conversation.title,
        conversation.name,
        ...(conversation.members || []).flatMap((member) => [
          member.displayName,
          member.sibsId,
          member.email,
        ]),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [chat?.conversations, conversationSearch]);

  const activeConversation = chat?.activeConversation || null;

  const activeTypingMembers = useMemo(() => {
    const conversationId = Number(activeConversation?.id || 0);
    if (!conversationId) return [];

    const typingIds = Array.isArray(chat?.typingByConversation?.[conversationId])
      ? chat.typingByConversation[conversationId]
      : [];

    const members = Array.isArray(activeConversation?.members)
      ? activeConversation.members
      : [];

    return typingIds
      .map((sibsId) =>
        members.find(
          (member) => cleanText(member?.sibsId) === cleanText(sibsId),
        ),
      )
      .filter(Boolean)
      .filter((member) => cleanText(member?.sibsId) !== currentSibsId);
  }, [
    activeConversation,
    chat?.typingByConversation,
    currentSibsId,
  ]);

  const typingLabel = useMemo(() => {
    const names = activeTypingMembers
      .map((member) => getChatMemberDisplayName(member))
      .filter(Boolean);

    if (!names.length) return "";
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;

    return `${names[0]}, ${names[1]}, and ${names.length - 2} other${
      names.length - 2 === 1 ? "" : "s"
    } are typing...`;
  }, [activeTypingMembers]);

  const mentionCandidates = useMemo(() => {
    if (!activeConversation?.isGroup || mentionStart === null) return [];

    const query = cleanText(mentionQuery).toLowerCase();
    const members = Array.isArray(activeConversation?.members)
      ? activeConversation.members
      : [];

    const everyoneCandidate = {
      mentionEveryone: true,
      sibsId: "__everyone__",
      displayName: "Everyone",
      initials: "ALL",
    };

    const candidates = [
      everyoneCandidate,
      ...members.filter((member) => cleanText(member?.sibsId) !== currentSibsId),
    ];

    return candidates
      .filter((member) => {
        if (!query) return true;

        const haystack = member?.mentionEveryone
          ? "everyone all group members"
          : [
              getChatMentionLabel(member),
              getChatMemberDisplayName(member),
              member?.sibsId,
              member?.email,
            ]
              .map(cleanText)
              .join(" ")
              .toLowerCase();

        return haystack.includes(query);
      })
      .slice(0, 8);
  }, [
    activeConversation?.isGroup,
    activeConversation?.members,
    currentSibsId,
    mentionQuery,
    mentionStart,
  ]);

  const seenMembersByMessageId = useMemo(
    () =>
      calculateSeenMembersByMessageId({
        members: activeConversation?.members,
        currentMessages: chat?.messages,
        currentSibsId,
      }),
    [activeConversation?.members, chat?.messages, currentSibsId],
  );

  const membersBySibsId = useMemo(() => {
    const map = new Map();
    const members = Array.isArray(activeConversation?.members)
      ? activeConversation.members
      : [];

    members.forEach((member) => {
      const sibsId = cleanText(member?.sibsId);
      if (sibsId) {
        map.set(sibsId, member);
      }
    });

    if (activeConversation?.otherMember?.sibsId) {
      map.set(
        cleanText(activeConversation.otherMember.sibsId),
        activeConversation.otherMember,
      );
    }

    return map;
  }, [activeConversation?.members, activeConversation?.otherMember]);

  useEffect(() => {
    if (!open || chat?.activeConversationId || !chat?.conversations?.length) return;

    // On mobile, keep the conversation list visible until the user chooses a chat.
    // Without this guard, pressing the mobile Back button clears the active chat,
    // then this effect immediately re-opens the first conversation.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 639px)").matches
    ) {
      return;
    }

    void chat.selectConversation(chat.conversations[0].id);
  }, [chat, open]);

  const scrollToLatest = useCallback(() => {
    const scroller = messageScrollRef.current;
    if (!scroller) return;
    scroller.scrollTop = scroller.scrollHeight;
  }, []);

  function navigateToLatestMessageAfterSend() {
    isInitialConversationLoadRef.current = false;
    isNearBottomRef.current = true;
    window.requestAnimationFrame(scrollToLatest);
  }

  // When active conversation changes, mark as initial load and lock nearBottom
  useEffect(() => {
    isInitialConversationLoadRef.current = true;
    isNearBottomRef.current = true;
  }, [chat?.activeConversationId]);

  // Adjust scroll position after prepending older messages
  useEffect(() => {
    if (prevLoadingOlderRef.current && !chat?.loadingOlderMessages) {
      const scroller = messageScrollRef.current;
      if (scroller && olderMessagesScrollHeightRef.current > 0) {
        scroller.scrollTop = calculatePrependScrollTop(
          olderMessagesScrollTopRef.current,
          olderMessagesScrollHeightRef.current,
          scroller.scrollHeight,
        );
      }
    }
    prevLoadingOlderRef.current = Boolean(chat?.loadingOlderMessages);
  }, [chat?.loadingOlderMessages]);

  const latestMessageId = Number(
    chat?.messages?.[chat.messages.length - 1]?.id || 0,
  );

  // Synchronous and multi-pass bottom anchoring effect on message updates
  useEffect(() => {
    if (!open || chat?.messagesLoading || !latestMessageId) return undefined;

    let cancelled = false;

    const performScroll = () => {
      if (cancelled) return;
      if (shouldSnapToBottom(isInitialConversationLoadRef.current, isNearBottomRef.current)) {
        scrollToLatest();
      }
    };

    // Immediate attempt
    performScroll();

    // Multi-frame settling
    const frameId1 = window.requestAnimationFrame(() => {
      performScroll();
      const frameId2 = window.requestAnimationFrame(performScroll);
      return () => window.cancelAnimationFrame(frameId2);
    });

    const timer1 = window.setTimeout(performScroll, 60);
    const timer2 = window.setTimeout(performScroll, 180);
    const timer3 = window.setTimeout(performScroll, 350);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId1);
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
      window.clearTimeout(timer3);
    };
  }, [
    chat?.activeConversationId,
    chat?.messagesLoading,
    latestMessageId,
    open,
    scrollToLatest,
  ]);

  // ResizeObserver to track asynchronous height shifts (images, GIFs, media decoding, reactions)
  useEffect(() => {
    const contentEl = messagesListContentRef.current;
    const scrollerEl = messageScrollRef.current;
    if (!contentEl || !scrollerEl) return undefined;

    const resizeObserver = new ResizeObserver(() => {
      if (shouldSnapToBottom(isInitialConversationLoadRef.current, isNearBottomRef.current)) {
        scrollerEl.scrollTop = scrollerEl.scrollHeight;
      }
    });

    resizeObserver.observe(contentEl);

    return () => {
      resizeObserver.disconnect();
    };
  }, [chat?.activeConversationId, chat?.messages?.length]);

  const handleMessagesScroll = useCallback((event) => {
    const target = event.currentTarget;
    if (!target) return;

    const nearBottom = checkIsNearBottom(
      target.scrollTop,
      target.scrollHeight,
      target.clientHeight,
      80,
    );
    isNearBottomRef.current = nearBottom;

    if (!nearBottom) {
      isInitialConversationLoadRef.current = false;
    }
  }, []);

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    if (!open && typingConversationIdRef.current) {
      stopTypingIndicator(typingConversationIdRef.current);
    }
  }, [open]);

  useEffect(() => {
    const currentTypingConversationId = Number(
      typingConversationIdRef.current || 0,
    );
    const nextConversationId = Number(activeConversation?.id || 0);

    if (
      currentTypingConversationId &&
      currentTypingConversationId !== nextConversationId
    ) {
      stopTypingIndicator(currentTypingConversationId);
    }
  }, [activeConversation?.id]);

  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((item) =>
        URL.revokeObjectURL(item.previewUrl),
      );
    };
  }, []);

  useEffect(() => {
    setMentionStart(null);
    setMentionEnd(null);
    setMentionQuery("");
    setMentionActiveIndex(0);
  }, [chat?.activeConversationId]);

  useEffect(() => {
    if (!attachmentNotice) return undefined;

    const timer = window.setTimeout(() => {
      setAttachmentNotice("");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [attachmentNotice]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPresenceClockMs(Date.now());
    }, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  if (!visible) return null;

  function isMemberOnline(member) {
    if (!member?.sibsId) return false;
    return chat.presence?.[member.sibsId] ?? member.online ?? false;
  }

  function stopTypingIndicator(conversationId = null) {
    if (typingStopTimerRef.current) {
      window.clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }

    const targetConversationId = Number(
      conversationId ||
        typingConversationIdRef.current ||
        activeConversation?.id ||
        0,
    );

    if (targetConversationId) {
      void chat?.setTypingStatus?.(targetConversationId, false);
    }

    typingConversationIdRef.current = null;
    typingLastSentAtRef.current = 0;
  }

  function updateTypingIndicator(nextValue) {
    const conversationId = Number(activeConversation?.id || 0);
    if (!conversationId) return;

    if (!String(nextValue ?? "").length) {
      stopTypingIndicator(conversationId);
      return;
    }

    const now = Date.now();
    const changedConversation =
      Number(typingConversationIdRef.current || 0) !== conversationId;
    const heartbeatDue =
      now - Number(typingLastSentAtRef.current || 0) >= 800;

    if (changedConversation || heartbeatDue) {
      typingConversationIdRef.current = conversationId;
      typingLastSentAtRef.current = now;
      void chat?.setTypingStatus?.(conversationId, true);
    }

    if (typingStopTimerRef.current) {
      window.clearTimeout(typingStopTimerRef.current);
    }

    typingStopTimerRef.current = window.setTimeout(() => {
      stopTypingIndicator(conversationId);
    }, 2200);
  }

  async function handleFiles(event) {
    const incoming = Array.from(event.target.files || []);
    event.target.value = "";

    if (!incoming.length) return;

    setLocalError("");

    const availableSlots = MAX_ATTACHMENTS_PER_MESSAGE - selectedImages.length;
    const accepted = [];

    for (const file of incoming.slice(0, availableSlots)) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
        const message =
          `${file.name} is ${sizeInMb} MB. Maximum file size is 10 MB.`;

        setLocalError(message);
        setAttachmentNotice(message);
        continue;
      }

      const detectedMimeType = await validateAttachmentBeforeSelection(file);
      if (!detectedMimeType) {
        setLocalError(
          `${file.name} is not a supported or valid image, audio, or video file.`,
        );
        continue;
      }

      accepted.push({
        file,
        detectedMimeType,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (incoming.length > availableSlots) {
      setLocalError(`You can attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files per message.`);
    }

    if (accepted.length) {
      setSelectedImages((current) => [...current, ...accepted]);
    }
  }

  function removeSelectedImage(index) {
    setSelectedImages((current) => {
      const target = current[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  function closeMentionPicker() {
    setMentionStart(null);
    setMentionEnd(null);
    setMentionQuery("");
    setMentionActiveIndex(0);
  }

  function updateMentionPicker(nextValue, cursorPosition) {
    if (!activeConversation?.isGroup) {
      closeMentionPicker();
      return;
    }

    const cursor = Math.max(0, Number(cursorPosition ?? nextValue.length));
    const beforeCursor = nextValue.slice(0, cursor);
    const match = /(^|\s)@([^\s@]*)$/.exec(beforeCursor);

    if (!match) {
      closeMentionPicker();
      return;
    }

    const query = match[2] || "";
    const atIndex = beforeCursor.length - query.length - 1;

    setMentionStart(atIndex);
    setMentionEnd(cursor);
    setMentionQuery(query);
    setMentionActiveIndex(0);
  }

  function insertMention(member) {
    if (mentionStart === null) return;

    const label = getChatMentionLabel(member);
    if (!label) return;

    const end = Number.isFinite(Number(mentionEnd))
      ? Number(mentionEnd)
      : mentionStart + 1 + mentionQuery.length;
    const replacement = `@${label} `;
    const nextDraft = `${draft.slice(0, mentionStart)}${replacement}${draft.slice(end)}`.slice(0, 5000);
    const nextCaret = Math.min(mentionStart + replacement.length, nextDraft.length);

    setDraft(nextDraft);
    updateTypingIndicator(nextDraft);
    closeMentionPicker();

    window.requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function insertEmoji(emoji) {
    const input = textareaRef.current;
    const selectionStart = input?.selectionStart ?? draft.length;
    const selectionEnd = input?.selectionEnd ?? selectionStart;

    const nextDraft = `${draft.slice(0, selectionStart)}${emoji}${draft.slice(selectionEnd)}`.slice(0, 5000);
    const nextCaret = Math.min(selectionStart + emoji.length, nextDraft.length);

    setDraft(nextDraft);
    updateTypingIndicator(nextDraft);

    window.requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.focus();
      textarea.setSelectionRange(nextCaret, nextCaret);
    });
  }

  async function submitGif(gif) {
    const gifUrl = cleanText(gif?.gifUrl);
    if (!gifUrl || sending || !activeConversation) return;

    try {
      setSending(true);
      setLocalError("");

      await chat.sendMessage({
        gifUrl,
        replyToMessageId: replyingToMessage?.id || null,
      });

      navigateToLatestMessageAfterSend();
      setReplyingToMessage(null);
      stopTypingIndicator(activeConversation.id);
      setGifPickerOpen(false);
      setGifSearch("");
      setGifResults([]);
      window.requestAnimationFrame(() => textareaRef.current?.focus());
    } catch (requestError) {
      setLocalError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to send the GIF.",
      );
    } finally {
      setSending(false);
    }
  }

  async function submitMessage() {
    const text = cleanText(draft);
    if ((!text && !selectedImages.length) || sending || !activeConversation) return;

    try {
      setSending(true);
      setLocalError("");
      await chat.sendMessage({
        message: text,
        images: selectedImages.map((item) => item.file),
        replyToMessageId: replyingToMessage?.id || null,
      });

      navigateToLatestMessageAfterSend();
      setReplyingToMessage(null);
      selectedImages.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setSelectedImages([]);
      setDraft("");
      stopTypingIndicator(activeConversation.id);
      setEmojiPickerOpen(false);
      setGifPickerOpen(false);
      window.requestAnimationFrame(() => textareaRef.current?.focus());
    } catch (requestError) {
      setLocalError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to send the message.",
      );
    } finally {
      setSending(false);
    }
  }

  function handleComposerKeyDown(event) {
    if (mentionStart !== null && mentionCandidates.length) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setMentionActiveIndex((current) =>
          (current + 1) % mentionCandidates.length,
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setMentionActiveIndex((current) =>
          (current - 1 + mentionCandidates.length) % mentionCandidates.length,
        );
        return;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        insertMention(
          mentionCandidates[
            Math.min(mentionActiveIndex, mentionCandidates.length - 1)
          ],
        );
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeMentionPicker();
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  }

  function handleReplyMessage(message) {
    if (!message?.id || message?.unsent) return;

    const messageType = cleanText(message?.messageType).toUpperCase();
    if (messageType === "MEMBER_ADDED" || messageType === "MEMBER_REMOVED") {
      return;
    }

    setReplyingToMessage(message);
    setMessageActionId(null);
    setReactionPickerMessageId(null);
    setEmojiPickerOpen(false);
    setGifPickerOpen(false);
    closeMentionPicker();

    window.requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function scrollToRepliedMessage(messageId) {
    const targetId = Number(messageId || 0);
    const scroller = messageScrollRef.current;
    if (!targetId || !scroller) return;

    const target = scroller.querySelector(`[data-chat-message-id="${targetId}"]`);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleMessageReaction(message, reaction) {
    if (!message?.id || message?.unsent || !chat?.reactToMessage) return;

    const messageType = cleanText(message.messageType).toUpperCase();
    if (messageType === "MEMBER_ADDED" || messageType === "MEMBER_REMOVED") {
      return;
    }

    const selectedReaction = cleanText(reaction);
    const myReaction = (Array.isArray(message.reactions) ? message.reactions : []).find(
      (item) => Boolean(item?.reactedByMe),
    )?.reaction;
    const nextReaction = myReaction === selectedReaction ? "" : selectedReaction;

    try {
      setReactingMessageId(Number(message.id));
      setLocalError("");
      await chat.reactToMessage(message.id, nextReaction);
      setReactionPickerMessageId(null);
    } catch (requestError) {
      setLocalError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to react to the message.",
      );
    } finally {
      setReactingMessageId(null);
    }
  }

  function handleUnsendMessage(message) {
    if (
      !message?.id ||
      cleanText(message.senderSibsId) !== currentSibsId ||
      message?.unsent
    ) {
      return;
    }

    setMessageActionId(null);
    setUnsendConfirmMessage(message);
  }

  async function confirmUnsendMessage() {
    const message = unsendConfirmMessage;
    if (!message?.id || Number(unsendingMessageId) === Number(message.id)) return;

    try {
      setUnsendingMessageId(Number(message.id));
      setLocalError("");
      await chat.unsendMessage(message.id);
      setUnsendConfirmMessage(null);
    } catch (requestError) {
      setLocalError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to unsend the message.",
      );
    } finally {
      setUnsendingMessageId(null);
    }
  }

  function handleSetNickname(conversation) {
    if (!conversation?.id || conversation?.isGroup) return;

    setConversationActionId(null);
    setNicknameConversation(conversation);
    setNicknameDraft(
      cleanText(
        conversation?.otherMember?.chatNickname ||
          conversation?.otherMember?.chat_nickname,
      ),
    );
  }

  async function savePrivateNickname() {
    const conversationId = Number(nicknameConversation?.id || 0);
    if (
      !conversationId ||
      nicknameConversation?.isGroup ||
      nicknameSaving ||
      !chat?.setPrivateNickname
    ) {
      return;
    }

    try {
      setNicknameSaving(true);
      setLocalError("");
      await chat.setPrivateNickname(conversationId, nicknameDraft);
      setNicknameConversation(null);
      setNicknameDraft("");
    } catch (requestError) {
      setLocalError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to update the nickname.",
      );
    } finally {
      setNicknameSaving(false);
    }
  }

  async function handleHideConversation(conversation) {
    const conversationId = Number(conversation?.id || 0);
    if (!conversationId || conversation?.isGroup || !chat?.hidePrivateConversation) return;

    try {
      setConversationActionBusyId(conversationId);
      setLocalError("");
      await chat.hidePrivateConversation(conversationId);
      setConversationActionId(null);
    } catch (requestError) {
      setLocalError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to hide the conversation.",
      );
    } finally {
      setConversationActionBusyId(null);
    }
  }

  function handleDeleteConversation(conversation) {
    if (!conversation?.id || conversation?.isGroup) return;
    setConversationActionId(null);
    setDeleteConversationConfirm(conversation);
  }

  async function confirmDeleteConversation() {
    const conversation = deleteConversationConfirm;
    const conversationId = Number(conversation?.id || 0);

    if (
      !conversationId ||
      conversation?.isGroup ||
      Number(conversationActionBusyId) === conversationId ||
      !chat?.deletePrivateConversation
    ) {
      return;
    }

    try {
      setConversationActionBusyId(conversationId);
      setLocalError("");
      await chat.deletePrivateConversation(conversationId);
      setDeleteConversationConfirm(null);
    } catch (requestError) {
      setLocalError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to delete the conversation.",
      );
    } finally {
      setConversationActionBusyId(null);
    }
  }

  async function runAction(action) {
    try {
      setActionBusy(true);
      setLocalError("");
      return await action();
    } catch (requestError) {
      setLocalError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to complete the chat action.",
      );
      throw requestError;
    } finally {
      setActionBusy(false);
    }
  }

  function clampLauncherPosition(left, top) {
    const element = launcherRef.current;
    const margin = 8;
    const width = element?.offsetWidth || 140;
    const height = element?.offsetHeight || 52;
    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - height - margin);

    return {
      left: Math.min(Math.max(margin, left), maxLeft),
      top: Math.min(Math.max(margin, top), maxTop),
    };
  }

  function handleLauncherPointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const rect = event.currentTarget.getBoundingClientRect();

    launcherDragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: rect.left,
      startTop: rect.top,
      moved: false,
    };

    suppressLauncherClickRef.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleLauncherPointerMove(event) {
    const drag = launcherDragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (!drag.moved && Math.hypot(deltaX, deltaY) < 5) return;

    drag.moved = true;
    suppressLauncherClickRef.current = true;
    setLauncherDragging(true);
    setLauncherPosition(
      clampLauncherPosition(drag.startLeft + deltaX, drag.startTop + deltaY),
    );
  }

  function finishLauncherDrag(event) {
    const drag = launcherDragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    launcherDragRef.current = {
      ...drag,
      active: false,
      pointerId: null,
    };
    setLauncherDragging(false);
  }

  function handleLauncherClick(event) {
    if (suppressLauncherClickRef.current) {
      suppressLauncherClickRef.current = false;
      event.preventDefault();
      return;
    }

    if (!open) {
      void ensureSibsChatSystemNotifications();
    }

    setOpen((current) => !current);
  }

  async function openMembershipNoticeGroup() {
    const notice = chat?.membershipNotice;
    const conversationId = Number(notice?.conversationId || 0);

    if (!conversationId || cleanText(notice?.action).toLowerCase() !== "added") {
      chat?.dismissMembershipNotice?.();
      return;
    }

    setOpen(true);
    setNewChatOpen(false);
    setGroupInfoOpen(false);

    try {
      await chat.refreshConversations?.();
      await chat.selectConversation?.(conversationId);
    } finally {
      chat?.dismissMembershipNotice?.();
    }
  }

  const activeOtherMember = activeConversation?.otherMember;
  const activePrivateOnline = activeOtherMember
    ? isMemberOnline(activeOtherMember)
    : false;
  const activePrivateNickname = cleanText(
    activeOtherMember?.chatNickname || activeOtherMember?.chat_nickname,
  );
  const activePrivateFullName = activeOtherMember
    ? getChatMemberFullName(activeOtherMember)
    : "";
  const activePrivateLastSeen = formatChatLastSeen(
    activeOtherMember?.lastSeenAt || activeOtherMember?.last_seen_at,
    presenceClockMs,
  );
  const activePrivateStatus = activePrivateOnline
    ? "Active now"
    : activePrivateLastSeen
      ? `Offline · ${activePrivateLastSeen}`
      : "Offline";

  const isCustomTheme = isChatThemeCustom(conversationTheme);
  const isThemeDark = isChatThemeDark(conversationTheme, imageLuminanceIsDark);


  return (
    <>
      {chat?.membershipNotice && !open ? (
        <div
          className="fixed right-4 z-[88] w-[min(340px,calc(100vw-2rem))] sm:right-6"
          style={{
            bottom: hideTrigger
              ? "calc(4.75rem + env(safe-area-inset-bottom, 0px))"
              : "calc(9.75rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <MembershipNoticeCard
            notice={chat.membershipNotice}
            onOpenGroup={() => void openMembershipNoticeGroup()}
            onDismiss={() => chat.dismissMembershipNotice?.()}
          />
        </div>
      ) : null}

      {!hideTrigger && !open ? (
        <button
          ref={launcherRef}
          type="button"
          onClick={handleLauncherClick}
          onPointerDown={handleLauncherPointerDown}
          onPointerMove={handleLauncherPointerMove}
          onPointerUp={finishLauncherDrag}
          onPointerCancel={finishLauncherDrag}
          aria-label={chat.totalUnread > 0 ? `Open SiBS Chat, ${chat.totalUnread} unread message${chat.totalUnread === 1 ? "" : "s"}` : "Open SiBS Chat"}
          aria-expanded={open}
          className={`fixed z-[88] inline-flex select-none items-center gap-2 rounded-2xl border border-white/10 bg-sibs-navy px-3 py-2.5 font-jakarta text-sm font-extrabold text-white shadow-xl transition hover:bg-sibs-tertiary-2 ${
            launcherPosition ? "" : "right-4 sm:right-6"
          } ${launcherDragging ? "cursor-grabbing" : "cursor-grab"} ${
            open ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={
            launcherPosition
              ? {
                  left: `${launcherPosition.left}px`,
                  top: `${launcherPosition.top}px`,
                  right: "auto",
                  bottom: "auto",
                  touchAction: "none",
                }
              : {
                  bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))",
                  touchAction: "none",
                }
          }
        >
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sibs-orange">
            <MessageCircleMore size={17} />
            {chat.totalUnread > 0 ? (
              <span className="absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[9px] font-black text-white">
                {chat.totalUnread > 99 ? "99+" : chat.totalUnread}
              </span>
            ) : null}
          </span>
          <span className="hidden sm:inline">SiBS Chat</span>
        </button>
      ) : null}

      <section
        ref={chatPanelRef}
        id="sibs-chat-panel"
        aria-label="SiBS Chat"
        data-expanded={isExpanded}
        className={`font-jakarta t-resize fixed right-4 z-[89] flex ${
          hideTrigger
            ? "h-[min(720px,calc(100vh-3rem))]"
            : "h-[min(720px,calc(100vh-9rem))]"
        } w-[min(960px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-2xl sm:right-6 ${
          hideTrigger ? "" : "bottom-24"
        } ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-3 scale-[0.98] opacity-0"
        }`}
        style={
          isExpanded && expandedBounds
            ? {
                left: `${expandedBounds.left}px`,
                right: "auto",
                top: `${expandedBounds.top}px`,
                bottom: "auto",
                width: `${expandedBounds.width}px`,
                height: `${expandedBounds.height}px`,
              }
            : hideTrigger
            ? {
                bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
              }
            : undefined
        }
      >
        {chat?.membershipNotice && open ? (
          <div className="pointer-events-none absolute left-1/2 top-3 z-50 w-[min(340px,90%)] -translate-x-1/2">
            <div className="pointer-events-auto">
              <MembershipNoticeCard
                notice={chat.membershipNotice}
                onOpenGroup={() => void openMembershipNoticeGroup()}
                onDismiss={() => chat.dismissMembershipNotice?.()}
              />
            </div>
          </div>
        ) : null}

        <aside className={`w-[300px] shrink-0 flex-col border-r border-sibs-border bg-white max-sm:w-full max-sm:border-r-0 ${
          activeConversation || newChatOpen ? "max-sm:hidden sm:flex" : "flex"
        }`}>
          <header className="border-b border-white/10 bg-sibs-navy px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sibs-orange text-white shadow-xs">
                <MessageCircleMore size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-base font-extrabold text-white">SiBS Chat</h2>
                  {chat.totalUnread > 0 ? (
                    <span className="rounded-full bg-sibs-orange px-2 py-0.5 text-[10px] font-extrabold text-white">
                      {chat.totalUnread}
                    </span>
                  ) : null}
                </div>
                <p className="text-[10px] font-semibold text-white/70">
                  Private & group messaging
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewChatOpen(true)}
                title="New chat"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                <Plus size={17} />
              </button>
              <button
                type="button"
                onClick={toggleExpanded}
                title={isExpanded ? "Restore chat size" : "Expand chat"}
                aria-label={isExpanded ? "Restore chat size" : "Expand chat"}
                aria-expanded={isExpanded}
                aria-controls="sibs-chat-panel"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Close"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                <X size={17} />
              </button>
            </div>
          </header>

          <div className="border-b border-sibs-border px-3 py-3">
            <label className="relative block">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sibs-faint" />
              <input
                type="search"
                value={conversationSearch}
                onChange={(event) => setConversationSearch(event.target.value)}
                placeholder="Search chats..."
                className="h-10 w-full rounded-xl border border-sibs-border bg-sibs-surface pl-9 pr-3 text-xs font-semibold text-sibs-navy outline-none transition placeholder:text-sibs-faint hover:border-sibs-border focus:border-sibs-orange focus:bg-white focus:ring-2 focus:ring-sibs-orange/10"
              />
            </label>
          </div>

          <div className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
            {chat.conversationsLoading && !chat.conversations.length ? (
              <div className="flex h-full items-center justify-center text-sibs-muted">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : filteredConversations.length ? (
              filteredConversations.map((conversation) => {
                const selected = Number(chat.activeConversationId) === Number(conversation.id);
                const otherMember = conversation.otherMember;
                const online = otherMember ? isMemberOnline(otherMember) : false;
                const conversationTypingIds = Array.isArray(
                  chat?.typingByConversation?.[Number(conversation.id)],
                )
                  ? chat.typingByConversation[Number(conversation.id)]
                  : [];

                const conversationMembers = Array.isArray(conversation?.members)
                  ? conversation.members
                  : [];

                const conversationTypingNames = conversationTypingIds
                  .map((sibsId) =>
                    conversationMembers.find(
                      (member) =>
                        cleanText(member?.sibsId) === cleanText(sibsId),
                    ),
                  )
                  .filter(Boolean)
                  .filter(
                    (member) =>
                      cleanText(member?.sibsId) !== cleanText(currentSibsId),
                  )
                  .map((member) => getChatMemberDisplayName(member))
                  .filter(Boolean);

                const conversationTypingLabel =
                  conversationTypingNames.length === 1
                    ? `${conversationTypingNames[0]} is typing...`
                    : conversationTypingNames.length === 2
                      ? `${conversationTypingNames[0]} and ${conversationTypingNames[1]} are typing...`
                      : conversationTypingNames.length > 2
                        ? `${conversationTypingNames[0]}, ${conversationTypingNames[1]}, and ${
                            conversationTypingNames.length - 2
                          } other${
                            conversationTypingNames.length - 2 === 1 ? "" : "s"
                          } are typing...`
                        : "";

                const preview =
                  conversationTypingLabel ||
                  conversation.lastMessageText ||
                  (conversation.lastMessageType?.includes("VIDEO")
                    ? "Sent a video"
                    : conversation.lastMessageType?.includes("MEDIA")
                      ? "Sent media"
                      : conversation.lastMessageType?.includes("IMAGE")
                        ? "Sent an image"
                        : conversation.lastMessageType === "GIF"
                          ? "GIF"
                          : "No messages yet");

                const actionMenuOpen =
                  Number(conversationActionId) === Number(conversation.id);
                const actionBusy =
                  Number(conversationActionBusyId) === Number(conversation.id);

                return (
                  <div
                    key={conversation.id}
                    className={`group relative mb-1 flex w-full items-center rounded-xl border-l-[3px] transition ${
                      selected
                        ? "border-l-sibs-orange bg-sibs-cream-subtle border-y border-r border-sibs-border/60"
                        : "border-l-transparent hover:bg-sibs-surface"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setConversationActionId(null);
                        void chat.selectConversation(conversation.id);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left"
                    >
                      <ChatAvatar
                        employee={conversation.isGroup ? null : otherMember}
                        initials={conversation.initials}
                        online={online}
                        group={conversation.isGroup}
                        size="md"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-bold text-sibs-navy">
                            {!conversation.isGroup
                              ? cleanText(
                                  otherMember?.chatNickname ||
                                    otherMember?.chat_nickname,
                                ) ||
                                cleanText(otherMember?.displayName) ||
                                conversation.title
                              : conversation.title}
                          </span>
                          <span className="shrink-0 text-[11px] font-medium text-sibs-faint">
                            {formatConversationTime(conversation.lastMessageAt || conversation.updatedAt, chatClockMs)}
                          </span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-2">
                          <span
                            className={`min-w-0 flex-1 truncate text-xs ${
                              conversationTypingLabel
                                ? "font-extrabold text-sibs-orange"
                                : conversation.unreadCount
                                  ? "font-extrabold text-sibs-navy"
                                  : "font-normal text-sibs-muted"
                            }`}
                          >
                            {preview}
                          </span>
                          {conversation.unreadCount > 0 ? (
                            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-sibs-orange px-1.5 py-0.5 text-[9px] font-black text-white">
                              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </button>

                    {!conversation.isGroup ? (
                      <div
                        data-chat-conversation-actions
                        className="relative mr-1.5 shrink-0"
                      >
                        <button
                          type="button"
                          aria-label={`Conversation options for ${conversation.title}`}
                          aria-haspopup="menu"
                          aria-expanded={actionMenuOpen}
                          disabled={actionBusy}
                          onClick={() =>
                            setConversationActionId((current) =>
                              Number(current) === Number(conversation.id)
                                ? null
                                : conversation.id,
                            )
                          }
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-sibs-faint transition hover:bg-white hover:text-sibs-navy disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionBusy ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <MoreHorizontal size={16} />
                          )}
                        </button>

                        {actionMenuOpen ? (
                          <div
                            role="menu"
                            className="absolute right-0 top-8 z-40 w-44 overflow-hidden rounded-xl border border-sibs-border bg-white p-1.5 shadow-[0_12px_32px_rgba(4,44,81,0.18)]"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              disabled={actionBusy}
                              onClick={() => handleSetNickname(conversation)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[10px] font-extrabold text-sibs-navy transition hover:bg-sibs-surface disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Pencil size={14} />
                              Set nickname
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              disabled={actionBusy}
                              onClick={() => void handleHideConversation(conversation)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[10px] font-extrabold text-sibs-navy transition hover:bg-sibs-surface disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <EyeOff size={14} />
                              Hide conversation
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              disabled={actionBusy}
                              onClick={() => handleDeleteConversation(conversation)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[10px] font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                              Delete conversation
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="flex h-full items-center justify-center px-5 text-center">
                <div>
                  <MessageCircleMore size={24} className="mx-auto text-sibs-faint" />
                  <p className="mt-2 text-xs font-extrabold text-sibs-navy">No chats yet</p>
                  <button
                    type="button"
                    onClick={() => setNewChatOpen(true)}
                    className="mt-2 text-[11px] font-extrabold text-sibs-orange"
                  >
                    Start a conversation
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className={`relative min-w-0 flex-1 flex-col max-sm:w-full ${
          activeConversation || newChatOpen ? "flex" : "max-sm:hidden sm:flex"
        }`}>
          {activeConversation ? (
            <>
              <header className="flex h-[68px] shrink-0 items-center gap-3 border-b border-white/10 bg-sibs-navy px-4 text-white shadow-xs">
                <button
                  type="button"
                  onClick={() => void chat.selectConversation(null)}
                  className="hidden h-9 w-9 items-center justify-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white max-sm:inline-flex"
                >
                  <ArrowLeft size={18} />
                </button>
                <ChatAvatar
                  employee={activeConversation.isGroup ? null : activeOtherMember}
                  initials={activeConversation.initials}
                  online={activePrivateOnline}
                  group={activeConversation.isGroup}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-heading text-sm sm:text-base font-extrabold text-white">
                    {activeConversation.title}
                  </h3>
                  {activeConversation.isGroup ? (
                    <button
                      type="button"
                      onClick={() => setGroupInfoOpen(true)}
                      title="View group members"
                      className="mt-0.5 inline-flex items-center gap-1 text-left text-[10px] font-semibold text-white/75 transition hover:text-white"
                    >
                      <span>
                        {activeConversation.members?.length || 0} member
                        {(activeConversation.members?.length || 0) === 1 ? "" : "s"}
                      </span>
                    </button>
                  ) : (
                    <p className="truncate text-[10px] font-semibold text-white/75">
                      {activePrivateStatus}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setThemeModalOpen(true)}
                  title="Chat theme & wallpaper"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white"
                >
                  <Palette size={17} />
                </button>
                {activeConversation.isGroup ? (
                  <button
                    type="button"
                    onClick={() => setGroupInfoOpen(true)}
                    title="Group info"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white"
                  >
                    <Settings2 size={17} />
                  </button>
                ) : (
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/50">
                    <MoreHorizontal size={18} />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={17} />
                </button>
              </header>

              {(localError || chat.error) ? (
                <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-[11px] font-semibold text-red-700">
                  {localError || chat.error}
                </div>
              ) : null}

              <div
                data-chat-custom-theme={isCustomTheme ? "true" : "false"}
                data-chat-theme-dark={isThemeDark ? "true" : "false"}
                className={`relative flex min-h-0 flex-1 flex-col overflow-hidden transition-colors duration-300 ${
                  isCustomTheme ? "" : "bg-sibs-canvas"
                }`}
                style={themeBackgroundStyle}
              >
                {isCustomTheme ? (
                  <div
                    className="pointer-events-none absolute inset-0 bg-slate-900/10 dark:bg-slate-950/20 backdrop-blur-[0.5px]"
                    aria-hidden="true"
                  />
                ) : null}

                <div
                  ref={messageScrollRef}
                  onScroll={handleMessagesScroll}
                  className="sibs-scrollbar relative z-10 min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-5 [overflow-anchor:auto]"
                >
                {chat.messagesLoading ? (
                  <div className="flex h-full items-center justify-center text-sibs-muted">
                    <Loader2 size={22} className="animate-spin" />
                  </div>
                ) : chat.messages.length ? (
                  <div ref={messagesListContentRef} className="flex flex-col">
                    {chat.hasMoreMessages ? (
                      <div className="mb-3 flex justify-center [overflow-anchor:none]">
                        <button
                          type="button"
                          onClick={() => {
                            const scroller = messageScrollRef.current;
                            if (scroller) {
                              olderMessagesScrollHeightRef.current = scroller.scrollHeight;
                              olderMessagesScrollTopRef.current = scroller.scrollTop;
                            }
                            void chat.loadOlderMessages();
                          }}
                          disabled={chat.loadingOlderMessages}
                          className="inline-flex items-center gap-2 rounded-full border border-sibs-border bg-white px-3 py-1.5 text-[10px] font-extrabold text-sibs-muted shadow-sm transition hover:text-sibs-navy disabled:opacity-50"
                        >
                          {chat.loadingOlderMessages ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : null}
                          Load earlier messages
                        </button>
                      </div>
                    ) : null}
                    {chat.messages.map((message, index) => {
                      const mine = cleanText(message.senderSibsId) === currentSibsId;
                      const previous = chat.messages[index - 1];
                      const next = chat.messages[index + 1];
                      const showDate =
                        !previous || !isSameDay(previous.createdAt, message.createdAt);
                      const prevTimestamp = previous ? new Date(previous.createdAt).getTime() : 0;
                      const currTimestamp = new Date(message.createdAt).getTime();
                      const timeGapMs =
                        prevTimestamp && currTimestamp
                          ? Math.max(0, currTimestamp - prevTimestamp)
                          : 0;
                      const isSignificantGap = timeGapMs >= 15 * 60 * 1000;
                      const shouldShowCenterTime = showDate || isSignificantGap;
                      const normalizedMessageType = cleanText(
                        message.messageType,
                      ).toUpperCase();
                      const membershipActivity =
                        normalizedMessageType === "MEMBER_ADDED" ||
                        normalizedMessageType === "MEMBER_REMOVED";
                      const previousMessageType = cleanText(
                        previous?.messageType,
                      ).toUpperCase();
                      const nextMessageType = cleanText(
                        next?.messageType,
                      ).toUpperCase();
                      const previousMembershipActivity =
                        previousMessageType === "MEMBER_ADDED" ||
                        previousMessageType === "MEMBER_REMOVED";
                      const nextMembershipActivity =
                        nextMessageType === "MEMBER_ADDED" ||
                        nextMessageType === "MEMBER_REMOVED";
                      const sameSenderAsPrevious =
                        Boolean(previous) &&
                        !showDate &&
                        !isSignificantGap &&
                        !membershipActivity &&
                        !previousMembershipActivity &&
                        cleanText(previous?.senderSibsId) ===
                          cleanText(message.senderSibsId);
                      const nextTimestamp = next ? new Date(next.createdAt).getTime() : 0;
                      const nextGapMs =
                        nextTimestamp && currTimestamp
                          ? Math.max(0, nextTimestamp - currTimestamp)
                          : 0;
                      const nextSignificantGap = nextGapMs >= 15 * 60 * 1000;
                      const sameSenderAsNext =
                        Boolean(next) &&
                        !membershipActivity &&
                        !nextMembershipActivity &&
                        !nextSignificantGap &&
                        isSameDay(message.createdAt, next?.createdAt) &&
                        cleanText(next?.senderSibsId) ===
                          cleanText(message.senderSibsId);
                      const groupStart = !sameSenderAsPrevious;
                      const groupEnd = !sameSenderAsNext;
                      const showSender =
                        activeConversation.isGroup &&
                        !mine &&
                        groupStart;
                      const unsent =
                        Boolean(message.unsent) ||
                        normalizedMessageType === "UNSENT";
                      const canUnsend =
                        mine &&
                        !unsent &&
                        !membershipActivity;
                      const canReact = !unsent && !membershipActivity;
                      const canReply = !unsent && !membershipActivity;
                      const reactions = Array.isArray(message.reactions)
                        ? message.reactions.filter((item) => Number(item?.count || 0) > 0)
                        : [];
                      const myReaction = reactions.find((item) => item?.reactedByMe)?.reaction || "";
                      const gifUrl =
                        !unsent &&
                        cleanText(message.messageType).toUpperCase() === "GIF"
                          ? cleanText(message.gifUrl)
                          : "";
                      const gifOnly = Boolean(gifUrl);
                      const emojiOnly =
                        !unsent &&
                        !gifOnly &&
                        !message.attachments?.length &&
                        isEmojiOnlyMessage(message.messageText);
                      const seenMembers =
                        seenMembersByMessageId.get(Number(message.id)) || [];
                      const senderEmployee =
                        membersBySibsId.get(cleanText(message.senderSibsId)) ||
                        message.sender ||
                        null;
                      const senderDisplayName =
                        cleanText(
                          senderEmployee?.preferredName ||
                            senderEmployee?.preferred_name ||
                            message.sender?.preferredName ||
                            message.sender?.preferred_name,
                        ) ||
                        senderEmployee?.displayName ||
                        message.sender?.displayName ||
                        `SIBS ID ${message.senderSibsId}`;
                      const senderInitials =
                        senderEmployee?.initials ||
                        cleanText(senderDisplayName).slice(0, 2).toUpperCase() ||
                        "U";

                      return (
                        <div
                          key={message.id}
                          data-chat-message-id={message.id}
                          className={
                            membershipActivity
                              ? "my-2"
                              : groupStart
                                ? "mt-2.5"
                                : "mt-0.5"
                          }
                        >
                          {shouldShowCenterTime ? (
                            <div className="my-2.5 flex items-center justify-center">
                              <span className="chat-theme-date-pill">
                                {formatMessengerCenterTimestamp(message.createdAt, previous?.createdAt)}
                              </span>
                            </div>
                          ) : null}

                          {membershipActivity ? (
                            <div className="my-2 flex justify-center px-3">
                              <div className="inline-flex max-w-[92%] items-center gap-1.5 rounded-full border border-sibs-border bg-white px-3 py-1.5 text-center text-[10px] font-semibold text-sibs-muted shadow-sm">
                                {normalizedMessageType === "MEMBER_ADDED" ? (
                                  <UserPlus size={12} className="shrink-0 text-sibs-orange" />
                                ) : (
                                  <Trash2 size={12} className="shrink-0 text-sibs-faint" />
                                )}
                                <span className="break-words">
                                  {message.messageText}
                                </span>
                                <span className="shrink-0 text-[9px] text-sibs-faint">
                                  · {formatMessageTime(message.createdAt, chatClockMs)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div
                                className={`group/message flex items-end gap-2 ${
                                  mine ? "justify-end" : "justify-start"
                                }`}
                              >
                            {/* Avatar on LEFT for incoming messages */}
                            {!mine ? (
                              <div className="flex h-7 w-7 shrink-0 items-end self-end mb-0.5">
                                {groupEnd ? (
                                  <ChatAvatar
                                    employee={senderEmployee}
                                    initials={senderInitials}
                                    size="chat"
                                  />
                                ) : null}
                              </div>
                            ) : null}

                            {/* Message content container */}
                            <div className={`max-w-[70%] sm:max-w-[68%] flex flex-col ${mine ? "items-end" : "items-start"}`}>
                              {showSender ? (
                                <p className="chat-theme-sender-name truncate">
                                  {senderDisplayName}
                                </p>
                              ) : null}

                              {message.replyTo ? (
                                <button
                                  type="button"
                                  onClick={() => scrollToRepliedMessage(message.replyTo.id)}
                                  className={`mb-1.5 block max-w-full overflow-hidden rounded-xl border-l-[3px] px-2.5 py-2 text-left shadow-sm transition hover:brightness-[0.98] ${
                                    mine
                                      ? "border-sibs-orange bg-orange-50 text-sibs-navy"
                                      : "border-sibs-navy bg-slate-100 text-sibs-navy"
                                  }`}
                                  title="Go to replied message"
                                >
                                  <span className="block truncate text-[9px] font-extrabold text-sibs-orange">
                                    {getReplySenderName(message.replyTo, currentSibsId)}
                                  </span>
                                  <span className="mt-0.5 block truncate text-[10px] font-semibold text-sibs-muted">
                                    {getReplyPreviewLabel(message.replyTo)}
                                  </span>
                                </button>
                              ) : null}

                              {/* Bubble + Actions Flex Row */}
                              <div className={`flex items-center gap-1.5 ${mine ? "justify-end" : "justify-start"}`}>
                                {/* Actions on LEFT for outgoing messages */}
                                {mine && (canReact || canReply || canUnsend) ? (
                                  <div
                                    className={`flex items-center gap-0.5 shrink-0 transition ${
                                      Number(reactionPickerMessageId) === Number(message.id) ||
                                      Number(messageActionId) === Number(message.id) ||
                                      myReaction
                                        ? "opacity-100"
                                        : "opacity-0 group-hover/message:opacity-100 group-focus-within/message:opacity-100"
                                    }`}
                                  >
                                    {canUnsend ? (
                                      <div
                                        className="relative shrink-0"
                                        data-chat-message-actions
                                      >
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setMessageActionId((current) =>
                                              Number(current) === Number(message.id)
                                                ? null
                                                : Number(message.id),
                                            )
                                          }
                                          disabled={
                                            Number(unsendingMessageId) === Number(message.id)
                                          }
                                          className={`chat-theme-action-btn disabled:opacity-40 ${
                                            Number(messageActionId) === Number(message.id)
                                              ? "bg-white text-sibs-navy shadow-sm"
                                              : ""
                                          }`}
                                          title="Message options"
                                          aria-label="Message options"
                                        >
                                          {Number(unsendingMessageId) === Number(message.id) ? (
                                            <Loader2 size={14} className="animate-spin" />
                                          ) : (
                                            <MoreHorizontal size={15} />
                                          )}
                                        </button>

                                        {Number(messageActionId) === Number(message.id) ? (
                                          <div className="absolute bottom-full right-0 z-30 mb-1 min-w-[118px] rounded-xl border border-sibs-border bg-white p-1.5 shadow-xl">
                                            <button
                                              type="button"
                                              onClick={() => void handleUnsendMessage(message)}
                                              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-[11px] font-extrabold text-sibs-navy transition hover:bg-sibs-surface"
                                            >
                                              Unsend message
                                            </button>
                                          </div>
                                        ) : null}
                                      </div>
                                    ) : null}

                                    {canReply ? (
                                      <button
                                        type="button"
                                        onClick={() => handleReplyMessage(message)}
                                        className="chat-theme-action-btn shrink-0"
                                        title="Reply"
                                        aria-label="Reply to message"
                                      >
                                        <Reply size={15} />
                                      </button>
                                    ) : null}

                                    {canReact ? (
                                      <div
                                        className="relative shrink-0"
                                        data-chat-reaction-picker
                                      >
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setReactionPickerMessageId((current) =>
                                              Number(current) === Number(message.id)
                                                ? null
                                                : Number(message.id),
                                            )
                                          }
                                          disabled={
                                            Number(reactingMessageId) === Number(message.id)
                                          }
                                          className={`chat-theme-action-btn disabled:opacity-40 ${
                                            Number(reactionPickerMessageId) === Number(message.id) || myReaction
                                              ? "bg-white text-sibs-orange shadow-sm"
                                              : ""
                                          }`}
                                          title={myReaction ? `Your reaction: ${myReaction}` : "React"}
                                          aria-label="React to message"
                                        >
                                          {Number(reactingMessageId) === Number(message.id) ? (
                                            <Loader2 size={14} className="animate-spin" />
                                          ) : myReaction ? (
                                            <span className="text-sm leading-none">{myReaction}</span>
                                          ) : (
                                            <Smile size={15} />
                                          )}
                                        </button>

                                        {Number(reactionPickerMessageId) === Number(message.id) ? (
                                          <div className="absolute bottom-full right-0 z-40 mb-1 grid w-[224px] grid-cols-6 gap-1 rounded-2xl border border-sibs-border bg-white p-2 shadow-xl">
                                            {MESSAGE_REACTIONS.map((reaction) => (
                                              <button
                                                key={reaction}
                                                type="button"
                                                onClick={() => void handleMessageReaction(message, reaction)}
                                                disabled={
                                                  Number(reactingMessageId) === Number(message.id)
                                                }
                                                className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none transition hover:scale-110 hover:bg-sibs-surface disabled:opacity-40 ${
                                                  myReaction === reaction
                                                    ? "bg-sibs-cream-light ring-1 ring-sibs-orange/40"
                                                    : ""
                                                }`}
                                                title={
                                                  myReaction === reaction
                                                    ? `Remove ${reaction} reaction`
                                                    : `React ${reaction}`
                                                }
                                              >
                                                {reaction}
                                              </button>
                                            ))}
                                          </div>
                                        ) : null}
                                      </div>
                                    ) : null}
                                  </div>
                                ) : null}

                                {unsent ? (
                                <div
                                  title={formatMessageTime(message.createdAt, chatClockMs)}
                                  className="rounded-2xl border border-sibs-border bg-white px-3 py-2 text-[11px] font-semibold italic text-sibs-muted"
                                >
                                  {mine
                                    ? "You unsent a message"
                                    : "This message was unsent"}
                                </div>
                              ) : gifOnly ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    window.open(gifUrl, "_blank", "noopener,noreferrer")
                                  }
                                  className="block max-w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm"
                                  title={formatMessageTime(message.createdAt, chatClockMs)}
                                >
                                  <img
                                    src={gifUrl}
                                    alt="GIF"
                                    className="max-h-64 w-auto max-w-full object-contain"
                                    loading="lazy"
                                    onLoad={() => {
                                      if (shouldSnapToBottom(isInitialConversationLoadRef.current, isNearBottomRef.current)) {
                                        scrollToLatest();
                                      }
                                    }}
                                  />
                                </button>
                              ) : emojiOnly ? (
                                <div
                                  title={formatMessageTime(message.createdAt, chatClockMs)}
                                  className="px-0.5 py-0.5"
                                >
                                  <p
                                    className={`leading-none ${getEmojiOnlySizeClass(
                                      message.messageText,
                                    )}`}
                                    aria-label={message.messageText}
                                  >
                                    {message.messageText}
                                  </p>
                                </div>
                              ) : (
                                <div
                                  title={formatMessageTime(message.createdAt, chatClockMs)}
                                  className={`overflow-hidden min-w-[34px] ${getMessageBubbleRadiusClass({
                                    mine,
                                    groupStart,
                                    groupEnd,
                                  })} ${
                                    mine
                                      ? "bg-sibs-orange text-white"
                                      : "border border-sibs-border bg-white text-sibs-navy shadow-xs"
                                  } ${message.attachments?.length ? "p-1.5" : "px-3 py-2"}`}
                                >
                                  {message.attachments?.length ? (
                                    <div className={`grid gap-1 ${message.attachments.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                                      {message.attachments.map((attachment) => {
                                        const attachmentUrl = getChatAttachmentUrl(attachment.url);
                                        const attachmentMimeType = cleanText(attachment.mimeType)
                                          .toLowerCase();
                                        const isVideo = attachmentMimeType.startsWith("video/");
                                        const isAudio = attachmentMimeType.startsWith("audio/");

                                        if (isVideo) {
                                          return (
                                            <ChatVideoPlayer
                                              key={attachment.id}
                                              attachment={attachment}
                                            />
                                          );
                                        }

                                        if (isAudio) {
                                          return (
                                            <ChatAudioPlayer
                                              key={attachment.id}
                                              attachment={attachment}
                                              mine={mine}
                                            />
                                          );
                                        }

                                        return (
                                          <button
                                            key={attachment.id}
                                            type="button"
                                            onClick={() => window.open(attachmentUrl, "_blank", "noopener,noreferrer")}
                                            className="overflow-hidden rounded-xl bg-slate-100"
                                            title={attachment.originalName || "Open image"}
                                          >
                                            <img
                                              src={attachmentUrl}
                                              alt={attachment.originalName || "Chat attachment"}
                                              className="max-h-56 w-full object-cover"
                                              loading="lazy"
                                              onLoad={() => {
                                                if (shouldSnapToBottom(isInitialConversationLoadRef.current, isNearBottomRef.current)) {
                                                  scrollToLatest();
                                                }
                                              }}
                                            />
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : null}

                                  {message.messageText ? (
                                    <p className={`whitespace-pre-wrap break-words text-xs font-semibold leading-5 ${message.attachments?.length ? "px-1.5 pb-1 pt-2" : ""}`}>
                                      {renderChatMessageText(
                                        message.messageText,
                                        activeConversation?.members || [],
                                        mine,
                                      )}
                                    </p>
                                  ) : null}
                                </div>
                              )}

                              {/* Actions on RIGHT for incoming messages */}
                              {!mine && (canReact || canReply) ? (
                                <div
                                  className={`flex items-center gap-0.5 shrink-0 transition ${
                                    Number(reactionPickerMessageId) === Number(message.id) ||
                                    Number(messageActionId) === Number(message.id) ||
                                    myReaction
                                      ? "opacity-100"
                                      : "opacity-0 group-hover/message:opacity-100 group-focus-within/message:opacity-100"
                                  }`}
                                >
                                  {canReact ? (
                                    <div
                                      className="relative shrink-0"
                                      data-chat-reaction-picker
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setReactionPickerMessageId((current) =>
                                            Number(current) === Number(message.id)
                                              ? null
                                              : Number(message.id),
                                          )
                                        }
                                        disabled={
                                          Number(reactingMessageId) === Number(message.id)
                                        }
                                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-white hover:text-sibs-orange hover:shadow-sm disabled:opacity-40 ${
                                          Number(reactionPickerMessageId) === Number(message.id) || myReaction
                                            ? "bg-white text-sibs-orange shadow-sm"
                                            : "text-sibs-faint"
                                        }`}
                                        title={myReaction ? `Your reaction: ${myReaction}` : "React"}
                                        aria-label="React to message"
                                      >
                                        {Number(reactingMessageId) === Number(message.id) ? (
                                          <Loader2 size={14} className="animate-spin" />
                                        ) : myReaction ? (
                                          <span className="text-sm leading-none">{myReaction}</span>
                                        ) : (
                                          <Smile size={15} />
                                        )}
                                      </button>

                                      {Number(reactionPickerMessageId) === Number(message.id) ? (
                                        <div className="absolute bottom-full left-0 z-40 mb-1 grid w-[224px] grid-cols-6 gap-1 rounded-2xl border border-sibs-border bg-white p-2 shadow-xl">
                                          {MESSAGE_REACTIONS.map((reaction) => (
                                            <button
                                              key={reaction}
                                              type="button"
                                              onClick={() => void handleMessageReaction(message, reaction)}
                                              disabled={
                                                Number(reactingMessageId) === Number(message.id)
                                              }
                                              className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none transition hover:scale-110 hover:bg-sibs-surface disabled:opacity-40 ${
                                                myReaction === reaction
                                                  ? "bg-sibs-cream-light ring-1 ring-sibs-orange/40"
                                                  : ""
                                              }`}
                                              title={
                                                myReaction === reaction
                                                  ? `Remove ${reaction} reaction`
                                                  : `React ${reaction}`
                                              }
                                            >
                                              {reaction}
                                            </button>
                                          ))}
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : null}

                                  {canReply ? (
                                    <button
                                      type="button"
                                      onClick={() => handleReplyMessage(message)}
                                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sibs-faint transition hover:bg-white hover:text-sibs-navy hover:shadow-sm"
                                      title="Reply"
                                      aria-label="Reply to message"
                                    >
                                      <Reply size={15} />
                                    </button>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>

                              {reactions.length ? (
                                <div
                                  className={`mt-1 flex flex-wrap items-center gap-1 ${
                                    mine ? "justify-end" : "justify-start"
                                  }`}
                                >
                                  {reactions.map((item) => {
                                    const reactedBy = getReactionPeopleLabel(item);

                                    return (
                                      <div
                                        key={item.reaction}
                                        className="group/reaction relative"
                                      >
                                        <button
                                          type="button"
                                          onClick={() => void handleMessageReaction(message, item.reaction)}
                                          disabled={
                                            Number(reactingMessageId) === Number(message.id)
                                          }
                                          className={`inline-flex h-6 items-center gap-1 rounded-full border bg-white px-2 text-[10px] font-bold shadow-sm transition hover:border-sibs-orange/50 disabled:opacity-40 ${
                                            item.reactedByMe
                                              ? "border-sibs-orange/40 bg-sibs-cream-subtle text-sibs-orange"
                                              : "border-sibs-border text-sibs-muted"
                                          }`}
                                          aria-label={`${item.reaction} reacted by ${reactedBy}`}
                                        >
                                          <span className="text-sm leading-none">{item.reaction}</span>
                                          {Number(item.count || 0) > 1 ? (
                                            <span>{Number(item.count || 0)}</span>
                                          ) : null}
                                        </button>

                                        <div
                                          role="tooltip"
                                          className={`pointer-events-none absolute bottom-full z-50 mb-2 hidden w-max max-w-[220px] whitespace-normal break-words rounded-lg bg-sibs-navy px-2.5 py-1.5 text-center text-[10px] font-semibold leading-4 text-white shadow-xl group-hover/reaction:block ${
                                            mine ? "right-0" : "left-0"
                                          }`}
                                        >
                                          <span className="mr-1">{item.reaction}</span>
                                          <span>{reactedBy}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : null}

                            </div>
                          </div>

                          {(mine || activeConversation?.isGroup) && seenMembers.length ? (
                            <div
                              className="mt-1 flex items-center justify-end"
                              title={`Seen by ${seenMembers
                                .map((member) =>
                                  cleanText(
                                    member?.preferredName ||
                                      member?.preferred_name ||
                                      member?.displayName ||
                                      member?.sibsId,
                                  ),
                                )
                                .filter(Boolean)
                                .join(", ")}`}
                            >
                              <span className="flex items-center -space-x-1.5">
                                {seenMembers.slice(0, 5).map((member) => {
                                  const memberName = cleanText(
                                    member?.preferredName ||
                                      member?.preferred_name ||
                                      member?.displayName ||
                                      member?.sibsId,
                                  );

                                  return (
                                    <span
                                      key={`seen-${message.id}-${member.sibsId}`}
                                      className="relative inline-flex rounded-full ring-1 ring-sibs-canvas"
                                      title={memberName}
                                    >
                                      <ChatAvatar
                                        employee={member}
                                        initials={
                                          member?.initials ||
                                          cleanText(member?.sibsId)
                                            .slice(0, 2)
                                            .toUpperCase() ||
                                          "U"
                                        }
                                        online={false}
                                        size="xs"
                                      />
                                    </span>
                                  );
                                })}
                                {seenMembers.length > 5 ? (
                                  <span className="relative z-10 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-sibs-canvas bg-sibs-navy px-1 text-[7px] font-extrabold text-white">
                                    +{seenMembers.length - 5}
                                  </span>
                                ) : null}
                              </span>
                            </div>
                          ) : null}
                        </>
                      )}
                        </div>
                      );
                    })}
                    <ChatTypingIndicator
                      activeTypingMembers={activeTypingMembers}
                      typingLabel={typingLabel}
                      renderAvatar={(member) => (
                        <ChatAvatar
                          employee={member}
                          initials={member?.initials}
                          online={
                            chat.presence?.[member?.sibsId] ??
                            member?.online ??
                            false
                          }
                          size="xs"
                        />
                      )}
                      className="mt-2"
                    />
                    <div
                      ref={messageEndRef}
                      aria-hidden="true"
                      className="h-px w-full"
                    />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-center">
                    <div>
                      <ChatAvatar
                        employee={activeConversation.isGroup ? null : activeOtherMember}
                        initials={activeConversation.initials}
                        online={activePrivateOnline}
                        group={activeConversation.isGroup}
                        size="lg"
                      />
                      <p className="chat-theme-empty-title mt-3 text-sm font-extrabold text-sibs-navy">
                        {activeConversation.title}
                      </p>
                      {!activeConversation.isGroup &&
                      activePrivateNickname &&
                      activePrivateFullName &&
                      activePrivateNickname !== activePrivateFullName ? (
                        <p className="chat-theme-empty-subtitle mt-1 text-[11px] font-semibold text-sibs-muted">
                          {activePrivateFullName}
                        </p>
                      ) : null}
                      <p className="chat-theme-empty-subtitle mt-1 text-[11px] font-semibold text-sibs-muted">
                        Start the conversation.
                      </p>
                      <ChatTypingIndicator
                        activeTypingMembers={activeTypingMembers}
                        typingLabel={typingLabel}
                        renderAvatar={(member) => (
                          <ChatAvatar
                            employee={member}
                            initials={member?.initials}
                            online={
                              chat.presence?.[member?.sibsId] ??
                              member?.online ??
                              false
                            }
                            size="xs"
                          />
                        )}
                        className="mt-4 justify-center"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

              <footer className="shrink-0 border-t border-sibs-border bg-white px-3 py-3 max-sm:px-2 max-sm:py-2">
                {attachmentNotice ? (
                  <div
                    role="alert"
                    className="mb-2 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-semibold leading-4 text-red-700 shadow-sm"
                  >
                    <span className="min-w-0 flex-1">
                      {attachmentNotice}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachmentNotice("")}
                      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-red-500 transition hover:bg-red-100 hover:text-red-700"
                      aria-label="Dismiss file size notification"
                      title="Dismiss"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : null}

                {replyingToMessage ? (
                  <div className="mb-2 flex items-center gap-2 rounded-xl border border-sibs-border bg-sibs-surface px-3 py-2">
                    <div className="min-w-0 flex-1 border-l-[3px] border-sibs-orange pl-2.5">
                      <p className="truncate text-[10px] font-extrabold text-sibs-orange">
                        Replying to {getReplySenderName(replyingToMessage, currentSibsId)}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] font-semibold text-sibs-muted">
                        {getReplyPreviewLabel(replyingToMessage)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingToMessage(null)}
                      aria-label="Cancel reply"
                      title="Cancel reply"
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sibs-faint transition hover:bg-white hover:text-sibs-navy"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : null}

                {selectedImages.length ? (
                  <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                    {selectedImages.map((item, index) => {
                      const isAudio = cleanText(item.detectedMimeType || item.file.type).toLowerCase().startsWith("audio/");
                      const isVideo = cleanText(item.detectedMimeType || item.file.type).toLowerCase().startsWith("video/");

                      if (isAudio) {
                        return (
                          <div
                            key={`${item.file.name}-${index}`}
                            className="relative flex h-16 min-w-[200px] max-w-[260px] shrink-0 items-center gap-2.5 rounded-xl border border-sibs-border bg-white px-3 py-2 shadow-xs"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-sibs-orange">
                              <Music size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-sibs-navy" title={item.file.name}>
                                {item.file.name}
                              </p>
                              <p className="text-[10px] font-semibold text-sibs-muted">
                                {(item.file.size / 1024 / 1024).toFixed(2)} MB · Audio
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSelectedImage(index)}
                              className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`${item.file.name}-${index}`}
                          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-sibs-border bg-sibs-surface"
                        >
                          {isVideo ? (
                            <video
                              src={item.previewUrl}
                              muted
                              playsInline
                              preload="metadata"
                              className="h-full w-full bg-black object-cover"
                            />
                          ) : (
                            <img
                              src={item.previewUrl}
                              alt={item.file.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => removeSelectedImage(index)}
                            className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                <div className="relative flex items-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,audio/mpeg,audio/wav,audio/ogg,audio/webm,audio/mp4,audio/aac,audio/flac,video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v"
                    multiple
                    onChange={handleFiles}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending || selectedImages.length >= MAX_ATTACHMENTS_PER_MESSAGE}
                    title="Add attachment · up to 5 files, 10 MB each"
                    aria-label="Add attachment"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sibs-orange transition hover:bg-sibs-cream-light active:scale-[0.96] disabled:opacity-40"
                  >
                    <Plus size={19} />
                  </button>

                  <div className="relative h-10 shrink-0">
                    <button
                      ref={emojiButtonRef}
                      type="button"
                      onClick={() => {
                        setGifPickerOpen(false);
                        setEmojiPickerOpen((current) => !current);
                      }}
                      disabled={sending}
                      title="Choose emoji"
                      aria-label="Choose emoji"
                      aria-expanded={emojiPickerOpen}
                      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition active:scale-[0.96] disabled:opacity-40 ${
                        emojiPickerOpen
                          ? "bg-sibs-cream-subtle text-sibs-orange border border-sibs-orange/30"
                          : "text-sibs-muted hover:bg-sibs-cream-light hover:text-sibs-orange"
                      }`}
                    >
                      <Smile size={19} />
                    </button>

                    {emojiPickerOpen ? (
                      <div
                        ref={emojiPickerRef}
                        className="absolute bottom-[calc(100%+10px)] left-0 z-[160] w-[300px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-2xl"
                      >
                        <div className="flex items-center justify-between border-b border-sibs-border px-3 py-2.5">
                          <div>
                            <p className="text-[11px] font-extrabold text-sibs-navy">Emoji</p>
                            <p className="mt-0.5 text-[9px] font-semibold text-sibs-faint">Choose an emoji to add to your message</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEmojiPickerOpen(false);
                              window.requestAnimationFrame(() => textareaRef.current?.focus());
                            }}
                            aria-label="Close emoji picker"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-sibs-muted transition hover:bg-sibs-surface hover:text-sibs-navy"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div className="grid max-h-[260px] grid-cols-8 gap-1 overflow-y-auto p-2.5">
                          {CHAT_EMOJIS.map((emoji, index) => (
                            <button
                              key={`${emoji}-${index}`}
                              type="button"
                              onClick={() => insertEmoji(emoji)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[20px] leading-none transition hover:bg-sibs-cream-light hover:scale-110"
                              title={`Insert ${emoji}`}
                              aria-label={`Insert ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="relative h-10 shrink-0">
                    <button
                      ref={gifButtonRef}
                      type="button"
                      onClick={() => {
                        setEmojiPickerOpen(false);
                        setGifPickerOpen((current) => {
                          const next = !current;
                          if (next) {
                            window.requestAnimationFrame(() =>
                              gifSearchInputRef.current?.focus(),
                            );
                          }
                          return next;
                        });
                      }}
                      disabled={sending}
                      title="Search GIFs online"
                      aria-label="Search GIFs online"
                      aria-expanded={gifPickerOpen}
                      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition active:scale-[0.96] disabled:opacity-40 ${
                        gifPickerOpen
                          ? "bg-sibs-cream-subtle text-sibs-orange border border-sibs-orange/30"
                          : "text-sibs-muted hover:bg-sibs-cream-light hover:text-sibs-orange"
                      }`}
                    >
                      <span className="text-[11px] font-black tracking-[-0.03em]">GIF</span>
                    </button>

                    {gifPickerOpen ? (
                      <div
                        ref={gifPickerRef}
                        className="absolute bottom-[calc(100%+10px)] left-0 z-[160] w-[340px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-2xl"
                      >
                        <div className="flex items-center justify-between border-b border-sibs-border px-3 py-2.5">
                          <div>
                            <p className="text-[11px] font-extrabold text-sibs-navy">GIFs</p>
                            <p className="mt-0.5 text-[9px] font-semibold text-sibs-faint">Search online GIFs and send instantly</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setGifPickerOpen(false);
                              window.requestAnimationFrame(() => textareaRef.current?.focus());
                            }}
                            aria-label="Close GIF picker"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-sibs-muted transition hover:bg-sibs-surface hover:text-sibs-navy"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div className="border-b border-sibs-border p-2.5">
                          <div className="flex h-9 items-center gap-2 rounded-xl border border-sibs-border bg-sibs-surface px-3 focus-within:border-sibs-orange focus-within:bg-white">
                            <Search size={14} className="shrink-0 text-sibs-faint" />
                            <input
                              ref={gifSearchInputRef}
                              value={gifSearch}
                              onChange={(event) => setGifSearch(event.target.value.slice(0, 50))}
                              placeholder="Search GIFs..."
                              className="min-w-0 flex-1 bg-transparent text-[11px] font-semibold text-sibs-navy outline-none placeholder:text-sibs-faint"
                            />
                            {gifSearch ? (
                              <button
                                type="button"
                                onClick={() => setGifSearch("")}
                                aria-label="Clear GIF search"
                                className="text-sibs-faint hover:text-sibs-navy"
                              >
                                <X size={13} />
                              </button>
                            ) : null}
                          </div>
                        </div>

                        <div className="sibs-scrollbar max-h-[310px] overflow-y-auto p-2.5">
                          {gifLoading ? (
                            <div className="flex min-h-36 items-center justify-center text-sibs-muted">
                              <Loader2 size={20} className="animate-spin" />
                            </div>
                          ) : gifError ? (
                            <div className="flex min-h-36 items-center justify-center px-4 text-center text-[10px] font-semibold leading-4 text-red-600">
                              {gifError}
                            </div>
                          ) : gifResults.length ? (
                            <div className="grid grid-cols-2 gap-1.5">
                              {gifResults.map((gif) => (
                                <button
                                  key={gif.id}
                                  type="button"
                                  onClick={() => void submitGif(gif)}
                                  disabled={sending}
                                  title={gif.title || "Send GIF"}
                                  className="group relative overflow-hidden rounded-xl bg-slate-100 disabled:opacity-50"
                                >
                                  <img
                                    src={gif.previewUrl}
                                    alt={gif.title || "GIF"}
                                    className="h-28 w-full object-cover transition duration-150 group-hover:scale-[1.03]"
                                    loading="lazy"
                                  />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="flex min-h-36 items-center justify-center text-center text-[10px] font-semibold text-sibs-faint">
                              No GIFs found.
                            </div>
                          )}
                        </div>

                        <div className="border-t border-sibs-border px-3 py-2 text-center text-[9px] font-extrabold tracking-wide text-sibs-faint">
                          Online GIF search
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="relative min-w-0 flex-1 self-end">
                    {activeConversation?.isGroup &&
                    mentionStart !== null &&
                    mentionCandidates.length ? (
                      <div className="absolute bottom-[calc(100%+8px)] left-0 z-[175] w-[min(320px,calc(100vw-5rem))] overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-[0_18px_50px_rgba(4,44,81,0.20)]">
                        <div className="border-b border-sibs-border px-3 py-2">
                          <p className="text-[10px] font-extrabold text-sibs-navy">
                            Tag a group member
                          </p>
                          <p className="text-[9px] font-semibold text-sibs-faint">
                            Type @ then a name, SIBS ID, or everyone
                          </p>
                        </div>
                        <div className="sibs-scrollbar max-h-56 overflow-y-auto p-1.5">
                          {mentionCandidates.map((member, index) => (
                            <button
                              key={`mention-${member.sibsId}`}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => insertMention(member)}
                              className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition ${
                                index === mentionActiveIndex
                                  ? "bg-sibs-cream-light text-sibs-orange font-bold"
                                  : "hover:bg-sibs-surface text-sibs-navy"
                              }`}
                            >
                              {member?.mentionEveryone ? (
                                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sibs-navy text-white shadow-sm">
                                  <UsersRound size={17} />
                                </span>
                              ) : (
                                <ChatAvatar
                                  employee={member}
                                  initials={member.initials}
                                  online={
                                    chat.presence?.[member.sibsId] ??
                                    member.online ??
                                    false
                                  }
                                  size="sm"
                                />
                              )}
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[11px] font-extrabold text-sibs-navy">
                                  @{getChatMentionLabel(member)}
                                </span>
                                <span className="block truncate text-[9px] font-semibold text-sibs-muted">
                                  {member?.mentionEveryone
                                    ? "Tag all members in this group"
                                    : `${getChatMemberDisplayName(member)} · SIBS ID ${member.sibsId}`}
                                </span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <textarea
                      ref={textareaRef}
                      value={draft}
                      onChange={(event) => {
                        const nextValue = event.target.value.slice(0, 5000);
                        setDraft(nextValue);
                        updateTypingIndicator(nextValue);
                        updateMentionPicker(
                          nextValue,
                          Math.min(event.target.selectionStart ?? nextValue.length, nextValue.length),
                        );
                      }}
                      onClick={(event) =>
                        updateMentionPicker(
                          draft,
                          event.currentTarget.selectionStart ?? draft.length,
                        )
                      }
                      onKeyUp={(event) => {
                        if (["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"].includes(event.key)) {
                          return;
                        }
                        updateMentionPicker(
                          draft,
                          event.currentTarget.selectionStart ?? draft.length,
                        );
                      }}
                      onKeyDown={handleComposerKeyDown}
                      onBlur={() => stopTypingIndicator(activeConversation?.id)}
                      rows={1}
                      placeholder={
                        activeConversation?.isGroup
                          ? "Type a message... use @ to tag"
                          : "Type a message..."
                      }
                      className="block max-h-28 min-h-10 w-full resize-none rounded-xl border border-sibs-border-subtle bg-sibs-surface px-3.5 py-2 text-xs font-medium leading-5 text-sibs-navy outline-none transition placeholder:text-sibs-faint hover:border-sibs-border focus:border-sibs-orange focus:bg-white focus:ring-2 focus:ring-sibs-orange/10 overflow-y-hidden no-scrollbar sibs-no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={submitMessage}
                    disabled={sending || (!cleanText(draft) && !selectedImages.length)}
                    className="relative z-[1] inline-flex h-10 w-10 shrink-0 self-end items-center justify-center rounded-xl bg-sibs-orange text-white shadow-xs transition hover:bg-sibs-button-hover active:scale-[0.96] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-sibs-faint disabled:shadow-none disabled:opacity-100"
                  >
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </footer>
            </>
          ) : (
            <EmptyChatState onNewChat={() => setNewChatOpen(true)} />
          )}

          <NewChatOverlay
            open={newChatOpen}
            busy={actionBusy}
            onClose={() => setNewChatOpen(false)}
            onPrivateChat={(sibsId) =>
              runAction(() => chat.startPrivateConversation(sibsId))
            }
            onCreateGroup={(payload) =>
              runAction(() => chat.startGroupConversation(payload))
            }
          />

          <GroupInfoOverlay
            conversation={activeConversation}
            currentSibsId={currentSibsId}
            presence={chat.presence}
            open={groupInfoOpen}
            onClose={() => setGroupInfoOpen(false)}
            onRename={(conversationId, name) =>
              runAction(() => chat.renameGroup(conversationId, name))
            }
            onAddMembers={(conversationId, memberSibsIds) =>
              runAction(() => chat.addGroupMembers(conversationId, memberSibsIds))
            }
            onRemoveMember={(conversationId, sibsId) =>
              runAction(() => chat.removeGroupMember(conversationId, sibsId))
            }
            onLeave={(conversationId) =>
              runAction(async () => {
                await chat.leaveGroup(conversationId);
                setGroupInfoOpen(false);
              })
            }
          />

          <ChatThemeModal
            open={themeModalOpen}
            onClose={() => setThemeModalOpen(false)}
            conversation={activeConversation}
          />
        </div>
      </section>

      {nicknameConversation && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[1px]"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget && !nicknameSaving) {
                  setNicknameConversation(null);
                  setNicknameDraft("");
                }
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="chat-nickname-title"
                className="w-full max-w-[390px] overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-[0_24px_70px_rgba(4,44,81,0.28)] font-jakarta"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="px-5 pb-4 pt-5">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EA] text-sibs-orange">
                      <Pencil size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3
                        id="chat-nickname-title"
                        className="font-heading text-sm font-extrabold text-sibs-navy"
                      >
                        Set nickname
                      </h3>
                      <p className="mt-1 text-[11px] font-semibold leading-5 text-sibs-muted">
                        This nickname is only for your personal chat with {nicknameConversation?.otherMember?.displayName || nicknameConversation?.title}. Group chats continue using the employee&apos;s SiBS HRIS nickname.
                      </p>
                    </div>
                  </div>

                  <label className="mt-4 block text-[10px] font-extrabold uppercase tracking-wide text-sibs-faint">
                    Nickname
                  </label>
                  <input
                    type="text"
                    autoFocus
                    maxLength={60}
                    value={nicknameDraft}
                    onChange={(event) => setNicknameDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void savePrivateNickname();
                      }
                    }}
                    placeholder={
                      cleanText(
                        nicknameConversation?.otherMember?.preferredName ||
                          nicknameConversation?.otherMember?.preferred_name,
                      ) || "Enter nickname"
                    }
                    className="mt-1.5 h-10 w-full rounded-xl border border-sibs-border bg-white px-3 text-xs font-bold text-sibs-navy outline-none transition focus:border-sibs-orange focus:ring-2 focus:ring-orange-100"
                  />
                  <div className="mt-1.5 flex items-center justify-between gap-3 text-[9px] font-semibold text-sibs-faint">
                    <span>Leave it empty to use the employee&apos;s regular HRIS name.</span>
                    <span>{nicknameDraft.length}/60</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-sibs-border bg-[#F8FAFC] px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      setNicknameConversation(null);
                      setNicknameDraft("");
                    }}
                    disabled={nicknameSaving}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-sibs-border bg-white px-4 text-[11px] font-extrabold text-sibs-navy transition hover:bg-sibs-surface disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void savePrivateNickname()}
                    disabled={nicknameSaving}
                    className="inline-flex h-9 min-w-[92px] items-center justify-center gap-2 rounded-xl bg-sibs-orange px-4 text-[11px] font-extrabold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {nicknameSaving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : null}
                    Save
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {deleteConversationConfirm && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[1px]"
              role="presentation"
              onMouseDown={(event) => {
                if (
                  event.target === event.currentTarget &&
                  !conversationActionBusyId
                ) {
                  setDeleteConversationConfirm(null);
                }
              }}
            >
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="chat-delete-conversation-title"
                aria-describedby="chat-delete-conversation-description"
                className="w-full max-w-[390px] overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-[0_24px_70px_rgba(4,44,81,0.28)] font-jakarta"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="px-5 pb-4 pt-5">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                      <Trash2 size={19} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3
                        id="chat-delete-conversation-title"
                        className="font-heading text-sm font-extrabold text-sibs-navy"
                      >
                        Delete conversation?
                      </h3>
                      <p
                        id="chat-delete-conversation-description"
                        className="mt-1.5 text-[11px] font-semibold leading-5 text-sibs-muted"
                      >
                        This removes your current personal chat history with {deleteConversationConfirm.title}. It does not remove the other employee&apos;s copy. New messages can make the conversation appear again.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-sibs-border bg-[#F8FAFC] px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setDeleteConversationConfirm(null)}
                    disabled={Boolean(conversationActionBusyId)}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-sibs-border bg-white px-4 text-[11px] font-extrabold text-sibs-navy transition hover:bg-sibs-surface disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmDeleteConversation()}
                    disabled={Boolean(conversationActionBusyId)}
                    className="inline-flex h-9 min-w-[86px] items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-[11px] font-extrabold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {conversationActionBusyId ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : null}
                    Delete
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {unsendConfirmMessage && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[1px]"
              role="presentation"
              onMouseDown={(event) => {
                if (
                  event.target === event.currentTarget &&
                  !unsendingMessageId
                ) {
                  setUnsendConfirmMessage(null);
                }
              }}
            >
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="chat-unsend-title"
                aria-describedby="chat-unsend-description"
                className="w-full max-w-[390px] overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-[0_24px_70px_rgba(4,44,81,0.28)] font-jakarta"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="px-5 pb-4 pt-5">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sibs-cream-light border border-sibs-orange/20 text-sibs-orange">
                      <MessageCircleMore size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3
                        id="chat-unsend-title"
                        className="font-heading text-sm font-extrabold text-sibs-navy"
                      >
                        Unsend message?
                      </h3>
                      <p
                        id="chat-unsend-description"
                        className="mt-1.5 text-[11px] font-semibold leading-5 text-sibs-muted"
                      >
                        This message will be removed from the chat for everyone.
                        The record will remain in the system for audit purposes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-sibs-border bg-sibs-surface px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setUnsendConfirmMessage(null)}
                    disabled={Boolean(unsendingMessageId)}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-sibs-border bg-white px-4 text-[11px] font-extrabold text-sibs-navy transition hover:bg-sibs-surface disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmUnsendMessage()}
                    disabled={Boolean(unsendingMessageId)}
                    className="inline-flex h-9 min-w-[86px] items-center justify-center gap-2 rounded-xl bg-sibs-orange px-4 text-[11px] font-extrabold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {unsendingMessageId ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : null}
                    Unsend
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
