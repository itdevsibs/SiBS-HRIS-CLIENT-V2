/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  addGroupChatMembers,
  createGroupChat,
  createHelpdeskChat,
  createPrivateChat,
  deletePrivateChat,
  getChatConversations,
  getChatTypingStatus,
  hidePrivateChat,
  getChatMessages,
  leaveGroupChat,
  markChatRead,
  removeGroupChatMember,
  renameGroupChat,
  resetChatConversationTheme,
  sendChatMessage,
  sendChatTypingStatus,
  setChatConversationTheme,
  setPrivateChatNickname,
  setChatMessageReaction,
  unsendChatMessage,
  uploadChatThemeImage,
} from "@/lib/axios/sibsChat";
import chatSocket from "@/lib/axios/chatSocket";
import { showSibsChatSystemNotification } from "@/lib/sibsChatSystemNotifications";
import { useUser } from "./UserContext";

const ChatContext = createContext(null);

function cleanText(value) {
  return String(value ?? "").trim();
}

function getCurrentSibsId(user = {}) {
  return cleanText(
    user?.sibsId ||
      user?.sibs_id ||
      user?.username ||
      user?.gy_emp_code ||
      user?.employeeId ||
      user?.employee_id,
  );
}

const CHAT_RECEIVE_SOUND_URL =
  `${import.meta.env.BASE_URL}snapchat-sound.mp3`;

let chatReceiveAudioContext = null;
const chatReceiveAudioBuffers = new Map();
const chatReceiveAudioBufferPromises = new Map();
let chatReceiveActiveSource = null;
let chatReceivePlayRequestId = 0;

function getChatReceiveAudioContext() {
  if (typeof window === "undefined") return null;

  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) return null;

  if (!chatReceiveAudioContext) {
    chatReceiveAudioContext = new AudioContextClass();
  }

  return chatReceiveAudioContext;
}

async function getChatReceiveAudioBuffer(audioContext, soundUrl) {
  if (!audioContext || !soundUrl) return null;

  if (chatReceiveAudioBuffers.has(soundUrl)) {
    return chatReceiveAudioBuffers.get(soundUrl);
  }

  if (!chatReceiveAudioBufferPromises.has(soundUrl)) {
    const bufferPromise = fetch(soundUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Unable to load chat receive sound: ${response.status}`,
          );
        }

        return response.arrayBuffer();
      })
      .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
      .then((decodedBuffer) => {
        chatReceiveAudioBuffers.set(soundUrl, decodedBuffer);
        return decodedBuffer;
      })
      .catch((error) => {
        chatReceiveAudioBufferPromises.delete(soundUrl);
        throw error;
      });

    chatReceiveAudioBufferPromises.set(soundUrl, bufferPromise);
  }

  return chatReceiveAudioBufferPromises.get(soundUrl);
}

async function playChatReceiveSound() {
  const requestId = ++chatReceivePlayRequestId;
  const selectedSoundUrl = CHAT_RECEIVE_SOUND_URL;

  try {
    // SiBS Chat uses snapchat-sound.mp3 for every incoming notification.
    // If another message arrives while the sound is still playing, stop the
    // previous sound immediately and play the newest notification sound.
    if (chatReceiveActiveSource) {
      try {
        chatReceiveActiveSource.stop();
      } catch {
        // The previous source may already have ended.
      }

      chatReceiveActiveSource = null;
    }

    const audioContext = getChatReceiveAudioContext();
    if (!audioContext || !selectedSoundUrl) return;

    if (audioContext.state === "suspended") {
      await audioContext.resume().catch(() => {});
    }

    const audioBuffer = await getChatReceiveAudioBuffer(
      audioContext,
      selectedSoundUrl,
    );
    if (!audioBuffer || requestId !== chatReceivePlayRequestId) return;

    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();

    source.buffer = audioBuffer;
    gain.gain.value = 1;

    source.connect(gain);
    gain.connect(audioContext.destination);

    chatReceiveActiveSource = source;

    source.onended = () => {
      if (chatReceiveActiveSource === source) {
        chatReceiveActiveSource = null;
      }
    };

    source.start(0);
  } catch {
    // Chat must continue working even if the browser blocks audio playback.
  }
}

function getChatSystemNotificationPreview(message = {}) {
  const text = cleanText(message?.messageText);
  if (text) {
    return text.length > 180 ? `${text.slice(0, 180)}…` : text;
  }

  const type = cleanText(message?.messageType).toUpperCase();
  const attachments = Array.isArray(message?.attachments)
    ? message.attachments
    : [];

  if (type === "GIF" || cleanText(message?.gifUrl)) return "Sent a GIF";

  if (attachments.length) {
    const mimeTypes = attachments.map((item) =>
      cleanText(item?.mimeType || item?.mime_type).toLowerCase(),
    );

    if (mimeTypes.some((value) => value.startsWith("video/"))) {
      return attachments.length > 1 ? "Sent videos" : "Sent a video";
    }

    if (mimeTypes.some((value) => value.startsWith("audio/"))) {
      return attachments.length > 1 ? "Sent audio files" : "Sent an audio message";
    }

    if (mimeTypes.some((value) => value.startsWith("image/"))) {
      return attachments.length > 1 ? "Sent images" : "Sent an image";
    }

    return attachments.length > 1 ? "Sent attachments" : "Sent an attachment";
  }

  if (type.includes("VIDEO")) return "Sent a video";
  if (type.includes("AUDIO")) return "Sent an audio message";
  if (type.includes("IMAGE") || type.includes("MEDIA")) return "Sent media";

  return "New message";
}

function sortConversations(items = []) {
  return [...items].sort((a, b) => {
    const aTime = new Date(a?.lastMessageAt || a?.updatedAt || 0).getTime();
    const bTime = new Date(b?.lastMessageAt || b?.updatedAt || 0).getTime();
    return bTime - aTime || Number(b?.id || 0) - Number(a?.id || 0);
  });
}

// Cross-instance presence heartbeats update every active employee's
// last_seen_at every 10 seconds on the server. The chat UI displays these
// values with *minute* precision; comparing raw timestamps caused the entire
// message list to repaint on virtually every 2-second safety poll whenever
// several employees were online. Expiry timestamps similarly do not affect
// the displayed typing indicator (the separate isTyping value does).
function chatUiSnapshotValue(key, value) {
  if (key === "typingExpiresAt") return undefined;
  if (key === "lastSeenAt" || key === "last_seen_at") {
    return typeof value === "string" ? value.slice(0, 16) : value;
  }
  return value;
}

function sameChatSnapshot(previous, incoming) {
  if (previous === incoming) return true;
  if (!Array.isArray(previous) || !Array.isArray(incoming)) return false;
  if (previous.length !== incoming.length) return false;
  return JSON.stringify(previous, chatUiSnapshotValue) ===
    JSON.stringify(incoming, chatUiSnapshotValue);
}

// Presence timestamps and the calculated online flag can also appear in
// message sender / reaction / reply profile objects. Those volatile fields
// must not make an otherwise unchanged message timeline look new. All message
// content, attachments, reactions, reply data, and profile display fields
// remain part of the comparison.
function messageUiSnapshotValue(key, value) {
  if (
    key === "online" ||
    key === "lastSeenAt" ||
    key === "last_seen_at" ||
    key === "isTyping" ||
    key === "typingExpiresAt"
  ) return undefined;
  return value;
}

function sameMessageTimeline(previous, incoming) {
  if (previous === incoming) return true;
  if (!Array.isArray(previous) || !Array.isArray(incoming)) return false;
  if (previous.length !== incoming.length) return false;
  return JSON.stringify(previous, messageUiSnapshotValue) ===
    JSON.stringify(incoming, messageUiSnapshotValue);
}

// Keep a lightweight cross-instance check every 2 seconds so new messages
// appear promptly. Full message data is only required when the conversation
// changed or for a slower reconciliation of reactions/unsends on different
// Socket.IO processes (which do not always bump conversation.updatedAt).
const CHAT_TIMELINE_RECONCILE_MS = 20_000;
function timelineVersion(conversation) {
  return [
    Number(conversation?.lastMessageId || 0),
    String(conversation?.lastMessageUnsentAt || ""),
    String(conversation?.updatedAt || ""),
  ].join("|");
}

export function ChatProvider({ children }) {
  const { user, loading: userLoading } = useUser() || {};
  const currentSibsId = useMemo(() => getCurrentSibsId(user), [user]);
  // Chat is available to every authenticated HRIS employee with a SIBS ID,
  // regardless of their department, account, or assigned role.
  const chatAllowed = Boolean(user && currentSibsId);

  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [presence, setPresence] = useState({});
  const [typingByConversation, setTypingByConversation] = useState({});
  const [error, setError] = useState("");
  const [membershipNotice, setMembershipNotice] = useState(null);
  const [isChatWindowOpen, setIsChatWindowOpen] = useState(false);

  const activeConversationIdRef = useRef(null);
  const mountedRef = useRef(true);
  const chatWindowUiOpenRef = useRef(false);
  // This flag is also cleared when the page is hidden, so backgrounded chats
  // can receive messages without being marked read.
  const chatWindowOpenRef = useRef(false);
  const messagesRef = useRef([]);
  const conversationsRef = useRef([]);
  // A departed/removed member must not keep polling a forbidden thread.
  const revokedConversationIdsRef = useRef(new Set());
  // Avoid another read-write every two seconds for an unchanged timeline.
  const acknowledgedReadIdsRef = useRef(new Map());
  const fallbackSyncBusyRef = useRef(false);
  const typingSyncBusyRef = useRef(false);
  const typingExpiryTimersRef = useRef(new Map());
  const notifiedMessageIdsRef = useRef(new Set());
  const conversationLastMessageIdsRef = useRef(new Map());
  const conversationToneBaselineReadyRef = useRef(false);
  // Tracks when the visible timeline was last fetched successfully. Resetting
  // this on a thread switch avoids showing stale data from a previous chat.
  const timelineSyncRef = useRef({ conversationId: 0, version: "", at: 0 });

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);


  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const unlockChatReceiveSound = () => {
      try {
        const audioContext = getChatReceiveAudioContext();
        if (!audioContext) return;

        if (audioContext.state === "suspended") {
          void audioContext.resume().catch(() => {});
        }

        void getChatReceiveAudioBuffer(
          audioContext,
          CHAT_RECEIVE_SOUND_URL,
        ).catch(() => {});
      } catch {
        // Ignore audio initialization errors.
      }
    };

    window.addEventListener("pointerdown", unlockChatReceiveSound, { once: true });
    window.addEventListener("keydown", unlockChatReceiveSound, { once: true });
    window.addEventListener("touchstart", unlockChatReceiveSound, {
      once: true,
      passive: true,
    });

    return () => {
      window.removeEventListener("pointerdown", unlockChatReceiveSound);
      window.removeEventListener("keydown", unlockChatReceiveSound);
      window.removeEventListener("touchstart", unlockChatReceiveSound);
    };
  }, []);

  const setChatWindowOpen = useCallback((isOpen) => {
    const nextState = Boolean(isOpen);
    chatWindowUiOpenRef.current = nextState;
    chatWindowOpenRef.current = nextState;
    setIsChatWindowOpen(nextState);
  }, []);

  const appendMessageToTimeline = useCallback((message) => {
    const messageId = Number(message?.id || 0);
    if (!messageId) return;

    const current = messagesRef.current || [];
    if (current.some((item) => Number(item?.id || 0) === messageId)) return;

    const next = [...current, message].sort(
      (first, second) => Number(first?.id || 0) - Number(second?.id || 0),
    );
    messagesRef.current = next;
    setMessages(next);
  }, []);

  const dismissMembershipNotice = useCallback(() => {
    setMembershipNotice(null);
  }, []);

  const handleConversationAccessRevoked = useCallback((conversationId) => {
    const id = Number(conversationId || 0);
    if (!id) return;

    revokedConversationIdsRef.current.add(id);
    acknowledgedReadIdsRef.current.delete(id);
    conversationLastMessageIdsRef.current.delete(id);
    conversationsRef.current = conversationsRef.current.filter(
      (item) => Number(item?.id || 0) !== id,
    );
    setConversations((current) => {
      const next = current.filter((item) => Number(item?.id || 0) !== id);
      return next.length === current.length ? current : next;
    });
    setTypingByConversation((current) => {
      if (!Object.prototype.hasOwnProperty.call(current, id)) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });

    if (Number(activeConversationIdRef.current || 0) === id) {
      activeConversationIdRef.current = null;
      messagesRef.current = [];
      setActiveConversationId(null);
      timelineSyncRef.current = { conversationId: 0, version: "", at: 0 };
      setMessages([]);
      setMessagesLoading(false);
      setHasMoreMessages(false);
      setError("");
    }
  }, []);

  const handleForbiddenConversationError = useCallback((conversationId, error) => {
    if (Number(error?.response?.status) !== 403) return false;
    handleConversationAccessRevoked(conversationId);
    return true;
  }, [handleConversationAccessRevoked]);

  const markReadOnce = useCallback(async (conversationId, messageId) => {
    const id = Number(conversationId || 0);
    const latest = Number(messageId || 0);
    if (!id || !latest || revokedConversationIdsRef.current.has(id)) return;

    if (latest <= Number(acknowledgedReadIdsRef.current.get(id) || 0)) return;
    // Mark optimistically while the request is in flight to deduplicate
    // overlapping socket events and the DB-backed 2-second safety poll.
    acknowledgedReadIdsRef.current.set(id, latest);
    try {
      await markChatRead(id, latest);
    } catch (error) {
      if (acknowledgedReadIdsRef.current.get(id) === latest) {
        acknowledgedReadIdsRef.current.delete(id);
      }
      handleForbiddenConversationError(id, error);
      throw error;
    }
  }, [handleForbiddenConversationError]);

  const refreshPresence = useCallback((items = []) => {
    if (!chatSocket.connected) return;

    const ids = [
      ...new Set(
        (items || [])
          .flatMap((conversation) => conversation?.members || [])
          .map((member) => cleanText(member?.sibsId))
          .filter(Boolean),
      ),
    ];

    if (!ids.length) return;

    chatSocket.emit("chat:presence:request", ids, (result) => {
      if (!mountedRef.current || !result || typeof result !== "object") return;

      setPresence((current) => {
        const changed = Object.entries(result).some(
          ([id, value]) => current[id] !== value,
        );
        return changed ? { ...current, ...result } : current;
      });
    });
  }, []);

  const notifyIncomingMessage = useCallback(
    (conversationId, message) => {
      const id = Number(conversationId || 0);
      const messageId = Number(message?.id || 0);
      const senderSibsId = cleanText(
        message?.senderSibsId || message?.sender_sibs_id,
      );
      const messageType = cleanText(message?.messageType).toUpperCase();
      const isMembershipActivity =
        messageType === "MEMBER_ADDED" || messageType === "MEMBER_REMOVED";

      if (
        !id ||
        !message ||
        !senderSibsId ||
        senderSibsId === currentSibsId ||
        isMembershipActivity
      ) {
        return false;
      }

      const notificationKey = messageId ? `${id}:${messageId}` : "";

      if (notificationKey) {
        if (notifiedMessageIdsRef.current.has(notificationKey)) {
          return false;
        }

        notifiedMessageIdsRef.current.add(notificationKey);

        // Keep the de-duplication set bounded during long-running HRIS sessions.
        if (notifiedMessageIdsRef.current.size > 1000) {
          const oldestKey = notifiedMessageIdsRef.current.values().next().value;
          if (oldestKey) notifiedMessageIdsRef.current.delete(oldestKey);
        }
      }

      void playChatReceiveSound();

      const conversation = conversationsRef.current.find(
        (item) => Number(item?.id || 0) === id,
      );
      const sender = message?.sender || {};

      const privateDisplayName =
        cleanText(
          conversation?.otherMember?.chatNickname ||
            conversation?.otherMember?.chat_nickname,
        ) ||
        cleanText(
          conversation?.otherMember?.preferredName ||
            conversation?.otherMember?.preferred_name,
        ) ||
        cleanText(conversation?.otherMember?.displayName);

      const senderDisplayName =
        cleanText(sender?.preferredName || sender?.preferred_name) ||
        cleanText(sender?.displayName) ||
        `SIBS ID ${senderSibsId}`;

      const notificationTitle = conversation?.isGroup
        ? `${senderDisplayName} · ${cleanText(conversation?.title) || "Group Chat"}`
        : privateDisplayName || senderDisplayName || "SiBS Chat";

      void showSibsChatSystemNotification({
        title: notificationTitle,
        body: getChatSystemNotificationPreview(message),
        conversationId: id,
        messageId,
      });

      return true;
    },
    [currentSibsId],
  );

  const refreshConversations = useCallback(async ({ silent = false } = {}) => {
    if (!currentSibsId || !chatAllowed) {
      setConversations([]);
      return [];
    }

    if (!silent) {
      setConversationsLoading(true);
    }

    try {
      const nextConversations = sortConversations(await getChatConversations());
      conversationsRef.current = nextConversations;

      const allowedIds = new Set(
        nextConversations.map((item) => Number(item?.id || 0)),
      );
      // A successfully fetched list is the authoritative membership snapshot.
      // Do not mistake a network error for revoked access (the catch below
      // retains the existing list).
      for (const id of allowedIds) revokedConversationIdsRef.current.delete(id);
      const activeId = Number(activeConversationIdRef.current || 0);
      if (activeId && !allowedIds.has(activeId)) {
        handleConversationAccessRevoked(activeId);
      }

      // Local and production can be connected to separate Socket.IO processes.
      // Use the shared DB-backed conversation list as a change detector. When a
      // conversation's last message advances, fetch that conversation and play
      // one tone for every newly received message, even if the chat panel is
      // closed or several messages arrived within one polling interval.
      const previousLastMessageIds = new Map(conversationLastMessageIdsRef.current);
      const baselineReady = conversationToneBaselineReadyRef.current;

      nextConversations.forEach((conversation) => {
        const conversationId = Number(conversation?.id || 0);
        if (!conversationId) return;

        conversationLastMessageIdsRef.current.set(
          conversationId,
          Number(conversation?.lastMessageId || 0),
        );
      });

      if (!baselineReady) {
        conversationToneBaselineReadyRef.current = true;
      } else {
        const changedIncomingConversations = nextConversations.filter(
          (conversation) => {
            const conversationId = Number(conversation?.id || 0);
            const lastMessageId = Number(conversation?.lastMessageId || 0);
            const previousLastMessageId = Number(
              previousLastMessageIds.get(conversationId) || 0,
            );
            const lastMessageSenderSibsId = cleanText(
              conversation?.lastMessageSenderSibsId,
            );

            return (
              conversationId &&
              lastMessageId > previousLastMessageId &&
              lastMessageSenderSibsId &&
              lastMessageSenderSibsId !== currentSibsId
            );
          },
        );

        await Promise.all(
          changedIncomingConversations.map(async (conversation) => {
            const conversationId = Number(conversation?.id || 0);
            const previousLastMessageId = Number(
              previousLastMessageIds.get(conversationId) || 0,
            );
            const latestLastMessageId = Number(conversation?.lastMessageId || 0);

            try {
              const latestMessages = await getChatMessages(conversationId, {
                limit: 75,
              });

              (latestMessages || [])
                .filter((message) => {
                  const messageId = Number(message?.id || 0);
                  return (
                    messageId > previousLastMessageId &&
                    messageId <= latestLastMessageId
                  );
                })
                .sort((a, b) => Number(a?.id || 0) - Number(b?.id || 0))
                .forEach((message) => {
                  notifyIncomingMessage(conversationId, message);
                });
            } catch (error) {
              handleForbiddenConversationError(conversationId, error);
              // A temporary network issue can retry on the next sync.
            }
          }),
        );
      }

      // A 403 may have arrived while the snapshot was being processed.
      // Never reinsert those threads into the visible list during this sync.
      const visibleConversations = nextConversations.filter(
        (item) => !revokedConversationIdsRef.current.has(Number(item?.id || 0)),
      );
      conversationsRef.current = visibleConversations;
      if (mountedRef.current) {
        setConversations((current) =>
          sameChatSnapshot(current, visibleConversations) ? current : visibleConversations,
        );

        // Cross-instance fallback: the conversations endpoint also carries the
        // current DB-backed typing state. This makes local <-> production
        // typing work even when each environment is connected to a different
        // Socket.IO process or the dedicated typing poll misses a request.
        setTypingByConversation((current) => {
          const next = {};

          visibleConversations.forEach((conversation) => {
            const conversationId = Number(conversation?.id || 0);
            if (!conversationId) return;

            const payloadTypingIds = Array.isArray(conversation?.typingSibsIds)
              ? conversation.typingSibsIds
              : [];

            const memberTypingIds = Array.isArray(conversation?.members)
              ? conversation.members
                  .filter((member) => Boolean(member?.isTyping))
                  .map((member) => member?.sibsId)
              : [];

            const typingIds = [
              ...new Set(
                [...payloadTypingIds, ...memberTypingIds]
                  .map((value) => cleanText(value))
                  .filter(
                    (value) =>
                      Boolean(value) && value !== currentSibsId,
                  ),
              ),
            ];

            if (typingIds.length) next[conversationId] = typingIds;
          });

          const keys = Object.keys(next);
          const oldKeys = Object.keys(current);
          if (
            keys.length === oldKeys.length &&
            keys.every((id) =>
              Array.isArray(current[id]) &&
              current[id].length === next[id].length &&
              current[id].every((member, index) => member === next[id][index]),
            )
          ) {
            return current;
          }
          return next;
        });

        setError("");
      }

      refreshPresence(visibleConversations);
      return visibleConversations;
    } catch (requestError) {
      if (mountedRef.current) {
        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Unable to load SiBS Chat conversations.",
        );
      }
      return [];
    } finally {
      if (!silent && mountedRef.current) {
        setConversationsLoading(false);
      }
    }
  }, [
    chatAllowed,
    currentSibsId,
    handleConversationAccessRevoked,
    handleForbiddenConversationError,
    notifyIncomingMessage,
    refreshPresence,
  ]);

  const loadConversationMessages = useCallback(
    async (conversationId) => {
      if (!conversationId || !currentSibsId) {
        setMessages([]);
        return [];
      }

      setMessagesLoading(true);

      try {
        const nextMessages = await getChatMessages(conversationId, {
          limit: 75,
        });

        if (mountedRef.current && Number(activeConversationIdRef.current) === Number(conversationId)) {
          messagesRef.current = nextMessages;
          setMessages((current) => sameMessageTimeline(current, nextMessages) ? current : nextMessages);
          setHasMoreMessages(nextMessages.length >= 75);
          timelineSyncRef.current = {
            conversationId: Number(conversationId),
            version: timelineVersion(conversationsRef.current.find(
              (item) => Number(item?.id || 0) === Number(conversationId),
            )),
            at: Date.now(),
          };
          setError("");
        }

        const latestId = Number(nextMessages.at(-1)?.id || 0);
        const isActivelyViewed =
          typeof document !== "undefined" &&
          document.visibilityState === "visible" &&
          chatWindowOpenRef.current &&
          Number(activeConversationIdRef.current) === Number(conversationId);

        // Loading/syncing a conversation in the background must never clear
        // its unread badge. A conversation becomes read only after SiBS Chat
        // is actually open and that conversation is the one being viewed.
        if (isActivelyViewed) {
          await markReadOnce(conversationId, latestId).catch(() => {});

          if (mountedRef.current) {
            setConversations((current) => {
              if (!current.some((item) =>
                Number(item.id) === Number(conversationId) && Number(item.unreadCount || 0) > 0
              )) return current;
              return current.map((conversation) =>
                Number(conversation.id) === Number(conversationId)
                  ? { ...conversation, unreadCount: 0 }
                  : conversation,
              );
            });
          }
        }

        return nextMessages;
      } catch (requestError) {
        if (handleForbiddenConversationError(conversationId, requestError)) {
          return [];
        }
        if (mountedRef.current) {
          setError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              "Unable to load chat messages.",
          );
        }
        return [];
      } finally {
        if (mountedRef.current) {
          setMessagesLoading(false);
        }
      }
    },
    [currentSibsId, handleForbiddenConversationError, markReadOnce],
  );

  const selectConversation = useCallback(
    async (conversationId) => {
      const id = Number(conversationId || 0) || null;
      // Only a newly selected conversation can undo a prior local revocation;
      // its server-side membership will still be checked by the messages API.
      if (id) revokedConversationIdsRef.current.delete(id);
      activeConversationIdRef.current = id;
      timelineSyncRef.current = { conversationId: 0, version: "", at: 0 };
      setActiveConversationId(id);
      messagesRef.current = [];
      setMessages([]);
      setHasMoreMessages(false);

      if (id) {
        await loadConversationMessages(id);
      }
    },
    [loadConversationMessages],
  );


  const loadOlderMessages = useCallback(async () => {
    const conversationId = Number(activeConversationIdRef.current || 0);
    if (!conversationId || loadingOlderMessages || !hasMoreMessages) return [];

    const before = Number(messages[0]?.id || 0);
    if (!before) return [];

    setLoadingOlderMessages(true);

    try {
      const older = await getChatMessages(conversationId, {
        before,
        limit: 75,
      });

      if (mountedRef.current && Number(activeConversationIdRef.current) === conversationId) {
        setMessages((current) => {
          const existingIds = new Set(current.map((item) => Number(item.id)));
          return [
            ...older.filter((item) => !existingIds.has(Number(item.id))),
            ...current,
          ];
        });
        setHasMoreMessages(older.length >= 75);
      }

      return older;
    } catch (requestError) {
      if (mountedRef.current) {
        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Unable to load earlier chat messages.",
        );
      }
      return [];
    } finally {
      if (mountedRef.current) {
        setLoadingOlderMessages(false);
      }
    }
  }, [hasMoreMessages, loadingOlderMessages, messages]);

  const startPrivateConversation = useCallback(
    async (sibsId) => {
      const conversation = await createPrivateChat(sibsId);
      const id = Number(conversation?.id || 0);
      await refreshConversations();

      if (id) {
        await selectConversation(id);
      }

      return conversation;
    },
    [refreshConversations, selectConversation],
  );

  const startGroupConversation = useCallback(
    async ({ name, memberSibsIds }) => {
      const conversation = await createGroupChat({ name, memberSibsIds });
      const id = Number(conversation?.id || 0);
      await refreshConversations();

      if (id) {
        await selectConversation(id);
      }

      return conversation;
    },
    [refreshConversations, selectConversation],
  );

  const startHelpdeskConversation = useCallback(
    async (category) => {
      const conversation = await createHelpdeskChat(category);
      const id = Number(conversation?.id || 0);
      await refreshConversations();
      if (id) await selectConversation(id);
      return conversation;
    },
    [refreshConversations, selectConversation],
  );

  const sendMessage = useCallback(
    async ({ message = "", images = [], gifUrl = "", replyToMessageId = null } = {}) => {
      const conversationId = Number(activeConversationIdRef.current || 0);
      if (!conversationId) return null;

      const sentMessage = await sendChatMessage(conversationId, {
        message,
        images,
        gifUrl,
        replyToMessageId,
      });

      if (sentMessage && mountedRef.current) {
        appendMessageToTimeline(sentMessage);
      }

      // The conversation list can refresh independently; don't keep the
      // sender's text in the composer while an unrelated list request runs.
      void refreshConversations({ silent: true });
      return sentMessage;
    },
    [appendMessageToTimeline, refreshConversations],
  );

  const unsendMessage = useCallback(
    async (messageId) => {
      const conversationId = Number(activeConversationIdRef.current || 0);
      const targetMessageId = Number(messageId || 0);

      if (!conversationId || !targetMessageId) return null;

      const updatedMessage = await unsendChatMessage(
        conversationId,
        targetMessageId,
      );

      if (updatedMessage && mountedRef.current) {
        setMessages((current) =>
          current.map((message) =>
            Number(message.id) === Number(updatedMessage.id)
              ? updatedMessage
              : message,
          ),
        );
      }

      await refreshConversations();
      return updatedMessage;
    },
    [refreshConversations],
  );

  const reactToMessage = useCallback(
    async (messageId, reaction = "") => {
      const conversationId = Number(activeConversationIdRef.current || 0);
      const targetMessageId = Number(messageId || 0);

      if (!conversationId || !targetMessageId) return null;

      const updatedMessage = await setChatMessageReaction(
        conversationId,
        targetMessageId,
        reaction,
      );

      if (updatedMessage && mountedRef.current) {
        setMessages((current) =>
          current.map((message) =>
            Number(message.id) === Number(updatedMessage.id)
              ? updatedMessage
              : message,
          ),
        );
      }

      return updatedMessage;
    },
    [],
  );

  const renameGroup = useCallback(
    async (conversationId, name) => {
      const result = await renameGroupChat(conversationId, name);
      await refreshConversations();
      return result;
    },
    [refreshConversations],
  );

  const addGroupMembers = useCallback(
    async (conversationId, memberSibsIds) => {
      const result = await addGroupChatMembers(conversationId, memberSibsIds);
      const targetConversationId = Number(conversationId || 0);

      const activityMessage =
        result?.activityMessage ||
        result?.data?.activityMessage ||
        null;

      if (
        activityMessage &&
        targetConversationId &&
        Number(activeConversationIdRef.current) === targetConversationId
      ) {
        setMessages((current) => {
          if (
            current.some(
              (message) =>
                Number(message?.id || 0) === Number(activityMessage?.id || 0),
            )
          ) {
            return current;
          }

          return [...current, activityMessage];
        });
      }

      await refreshConversations();

      /*
       * The membership activity is persisted in the conversation JSON by
       * the server. Reload the active conversation after an add operation so
       * the "X added Y to the group" system message is guaranteed to appear
       * even if the Socket.IO event or axios response shape was missed.
       */
      if (
        targetConversationId &&
        Number(activeConversationIdRef.current) === targetConversationId
      ) {
        await loadConversationMessages(targetConversationId);
      }

      return result;
    },
    [loadConversationMessages, refreshConversations],
  );

  const removeGroupMember = useCallback(
    async (conversationId, sibsId) => {
      const result = await removeGroupChatMember(conversationId, sibsId);
      await refreshConversations();
      return result;
    },
    [refreshConversations],
  );

  const leaveGroup = useCallback(
    async (conversationId) => {
      await leaveGroupChat(conversationId);

      handleConversationAccessRevoked(conversationId);
      await refreshConversations();
    },
    [handleConversationAccessRevoked, refreshConversations],
  );

  const hidePrivateConversation = useCallback(
    async (conversationId) => {
      await hidePrivateChat(conversationId);

      if (Number(activeConversationIdRef.current) === Number(conversationId)) {
        activeConversationIdRef.current = null;
        setActiveConversationId(null);
        setMessages([]);
        setHasMoreMessages(false);
      }

      await refreshConversations();
    },
    [refreshConversations],
  );

  const deletePrivateConversation = useCallback(
    async (conversationId) => {
      await deletePrivateChat(conversationId);

      if (Number(activeConversationIdRef.current) === Number(conversationId)) {
        activeConversationIdRef.current = null;
        setActiveConversationId(null);
        setMessages([]);
        setHasMoreMessages(false);
      }

      await refreshConversations();
    },
    [refreshConversations],
  );

  const setPrivateNickname = useCallback(
    async (conversationId, nickname = "") => {
      const targetConversationId = Number(conversationId || 0);
      if (!targetConversationId) return null;

      const result = await setPrivateChatNickname(
        targetConversationId,
        nickname,
      );

      await refreshConversations();

      if (
        Number(activeConversationIdRef.current) === targetConversationId &&
        chatWindowOpenRef.current
      ) {
        await loadConversationMessages(targetConversationId);
      }

      return result;
    },
    [loadConversationMessages, refreshConversations],
  );

  const setConversationTheme = useCallback(
    async (conversationId, themePayload) => {
      const targetId = Number(conversationId || 0);
      if (!targetId) return null;

      const result = await setChatConversationTheme(targetId, themePayload);

      if (result) {
        setConversations((current) =>
          current.map((c) =>
            Number(c.id) === targetId ? { ...c, theme: result } : c
          )
        );
      }

      await refreshConversations();
      return result;
    },
    [refreshConversations],
  );

  const uploadConversationThemeImage = useCallback(
    async (conversationId, file) => {
      const targetId = Number(conversationId || 0);
      if (!targetId || !file) return null;

      const result = await uploadChatThemeImage(targetId, file);

      if (result) {
        setConversations((current) =>
          current.map((c) =>
            Number(c.id) === targetId ? { ...c, theme: result } : c
          )
        );
      }

      await refreshConversations();
      return result;
    },
    [refreshConversations],
  );

  const resetConversationTheme = useCallback(
    async (conversationId) => {
      const targetId = Number(conversationId || 0);
      if (!targetId) return null;

      const result = await resetChatConversationTheme(targetId);

      if (result) {
        setConversations((current) =>
          current.map((c) =>
            Number(c.id) === targetId ? { ...c, theme: result } : c
          )
        );
      }

      await refreshConversations();
      return result;
    },
    [refreshConversations],
  );

  const clearTypingMember = useCallback((conversationId, sibsId) => {
    const id = Number(conversationId || 0);
    const memberId = cleanText(sibsId);
    if (!id || !memberId) return;

    const timerKey = `${id}:${memberId}`;
    const timerId = typingExpiryTimersRef.current.get(timerKey);

    if (timerId) {
      window.clearTimeout(timerId);
      typingExpiryTimersRef.current.delete(timerKey);
    }

    setTypingByConversation((current) => {
      const currentIds = Array.isArray(current?.[id]) ? current[id] : [];
      const nextIds = currentIds.filter(
        (value) => cleanText(value) !== memberId,
      );

      if (nextIds.length === currentIds.length) {
        return current;
      }

      const next = { ...current };

      if (nextIds.length) {
        next[id] = nextIds;
      } else {
        delete next[id];
      }

      return next;
    });
  }, []);

  const setTypingStatus = useCallback(
    async (conversationId, isTyping) => {
      const id = Number(conversationId || 0);
      if (
        !id || !chatAllowed || !currentSibsId ||
        revokedConversationIdsRef.current.has(id)
      ) return null;

      try {
        return await sendChatTypingStatus(id, Boolean(isTyping));
      } catch (error) {
        handleForbiddenConversationError(id, error);
        return null;
      }
    },
    [chatAllowed, currentSibsId, handleForbiddenConversationError],
  );

  const syncTypingWithoutRefresh = useCallback(async () => {
    const conversationId = Number(activeConversationIdRef.current || 0);

    if (
      typingSyncBusyRef.current ||
      !mountedRef.current ||
      !currentSibsId ||
      !chatAllowed ||
      !chatWindowOpenRef.current ||
      !conversationId ||
      revokedConversationIdsRef.current.has(conversationId)
    ) {
      return;
    }

    typingSyncBusyRef.current = true;

    try {
      const result = await getChatTypingStatus(conversationId);
      const typingIds = Array.isArray(result?.sibsIds)
        ? result.sibsIds
            .map((value) => cleanText(value))
            .filter(
              (value) =>
                Boolean(value) && value !== currentSibsId,
            )
        : [];

      if (
        !mountedRef.current ||
        Number(activeConversationIdRef.current) !== conversationId
      ) {
        return;
      }

      setTypingByConversation((current) => {
        const currentIds = Array.isArray(current?.[conversationId])
          ? current[conversationId]
          : [];

        const currentKey = currentIds.map(cleanText).filter(Boolean).sort().join("|");
        const nextKey = [...typingIds].sort().join("|");

        if (currentKey === nextKey) return current;

        const next = { ...current };

        if (typingIds.length) {
          next[conversationId] = typingIds;
        } else {
          delete next[conversationId];
        }

        return next;
      });
    } catch (error) {
      if (!handleForbiddenConversationError(conversationId, error)) {
        // Socket.IO remains primary. Temporary network failures can retry.
      }
    } finally {
      typingSyncBusyRef.current = false;
    }
  }, [chatAllowed, currentSibsId, handleForbiddenConversationError]);

  const syncChatWithoutRefresh = useCallback(async () => {
    if (
      fallbackSyncBusyRef.current ||
      !mountedRef.current ||
      !currentSibsId ||
      !chatAllowed
    ) {
      return;
    }

    fallbackSyncBusyRef.current = true;
    let polledConversationId = 0;

    try {
      await refreshConversations({ silent: true });

      const conversationId = Number(activeConversationIdRef.current || 0);
      polledConversationId = conversationId;
      const visibleConversation = conversationsRef.current.find(
        (item) => Number(item?.id || 0) === conversationId,
      );
      if (
        !conversationId || !chatWindowUiOpenRef.current ||
        revokedConversationIdsRef.current.has(conversationId) ||
        !visibleConversation
      ) return;

      // Typing is polled independently every 1.2 seconds; don't start a
      // second request here every 2 seconds as well.
      const syncVersion = timelineVersion(visibleConversation);
      const previousSync = timelineSyncRef.current;
      if (
        previousSync.conversationId === conversationId &&
        previousSync.version === syncVersion &&
        Date.now() - previousSync.at < CHAT_TIMELINE_RECONCILE_MS
      ) {
        return;
      }

      const nextMessages = await getChatMessages(conversationId, {
        limit: 75,
      });

      if (
        !mountedRef.current ||
        Number(activeConversationIdRef.current) !== conversationId
      ) {
        return;
      }

      const currentMessages = messagesRef.current || [];
      const currentIds = new Set(
        currentMessages.map((item) => Number(item?.id || 0)).filter(Boolean),
      );

      const newIncomingMessages = (nextMessages || []).filter((message) => {
        const messageId = Number(message?.id || 0);
        const senderSibsId = cleanText(
          message?.senderSibsId || message?.sender_sibs_id,
        );
        const messageType = cleanText(message?.messageType).toUpperCase();
        const isMembershipActivity =
          messageType === "MEMBER_ADDED" || messageType === "MEMBER_REMOVED";

        return (
          messageId &&
          !currentIds.has(messageId) &&
          senderSibsId &&
          senderSibsId !== currentSibsId &&
          !isMembershipActivity
        );
      });

      newIncomingMessages.forEach((message) => {
        notifyIncomingMessage(conversationId, message);
      });

      // Keep socket-delivered messages that arrived while this request was in
      // flight, and retain any older page already loaded in the timeline.
      // The REST response remains authoritative for records it includes.
      const reconciledById = new Map(
        (nextMessages || []).map((message) => [Number(message?.id || 0), message]),
      );
      currentMessages.forEach((message) => {
        const messageId = Number(message?.id || 0);
        if (messageId && !reconciledById.has(messageId)) {
          reconciledById.set(messageId, message);
        }
      });
      const reconciledMessages = [...reconciledById.values()].sort(
        (first, second) => Number(first?.id || 0) - Number(second?.id || 0),
      );

      // The server reconstructs sender/reaction objects for every response.
      // Compare the full meaningful timeline rather than forcing an update
      // from freshly allocated objects or periodically refreshed presence.
      if (!sameMessageTimeline(currentMessages, reconciledMessages)) {
        messagesRef.current = reconciledMessages;
        setMessages(reconciledMessages);
      }

      timelineSyncRef.current = {
        conversationId,
        version: syncVersion,
        at: Date.now(),
      };

      const latestMessageId = Number(nextMessages?.at(-1)?.id || 0);
      const isStillActivelyViewed =
        typeof document !== "undefined" &&
        document.visibilityState === "visible" &&
        chatWindowOpenRef.current &&
        Number(activeConversationIdRef.current) === conversationId;

      if (latestMessageId && isStillActivelyViewed) {
        await markReadOnce(conversationId, latestMessageId).catch(() => {});

        if (mountedRef.current) {
          setConversations((current) => {
            if (!current.some((item) =>
              Number(item.id) === conversationId && Number(item.unreadCount || 0) > 0
            )) return current;
            return current.map((conversation) =>
              Number(conversation.id) === conversationId
                ? { ...conversation, unreadCount: 0 }
                : conversation,
            );
          });
        }
      }
    } catch (error) {
      // A reply for an old thread must never revoke a newly selected thread.
      handleForbiddenConversationError(polledConversationId, error);
      // The next Socket.IO event / fallback sync retries transient failures.
    } finally {
      fallbackSyncBusyRef.current = false;
    }
  }, [
    chatAllowed,
    currentSibsId,
    handleForbiddenConversationError,
    markReadOnce,
    notifyIncomingMessage,
    refreshConversations,
  ]);

  useEffect(() => {
    if (userLoading || !currentSibsId || !chatAllowed) {
      setConversations([]);
      conversationsRef.current = [];
      revokedConversationIdsRef.current.clear();
      acknowledgedReadIdsRef.current.clear();
      setMessages([]);
      messagesRef.current = [];
      setHasMoreMessages(false);
      setActiveConversationId(null);
      activeConversationIdRef.current = null;
      setPresence({});
      setTypingByConversation({});
      typingExpiryTimersRef.current.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      typingExpiryTimersRef.current.clear();
      notifiedMessageIdsRef.current.clear();
      conversationLastMessageIdsRef.current.clear();
      conversationToneBaselineReadyRef.current = false;
      timelineSyncRef.current = { conversationId: 0, version: "", at: 0 };
      setMembershipNotice(null);
      chatSocket.disconnect();
      return undefined;
    }

    const handleConnect = () => {
      void syncChatWithoutRefresh();
    };

    const handleDisconnect = () => {
      void syncChatWithoutRefresh();
    };

    const handleConnectError = () => {
      void syncChatWithoutRefresh();
    };

    const handlePresence = ({ sibsId, online } = {}) => {
      const id = cleanText(sibsId);
      if (!id) return;

      setPresence((current) =>
        current[id] === Boolean(online)
          ? current
          : { ...current, [id]: Boolean(online) },
      );
    };

    const handleTyping = ({ conversationId, sibsId, isTyping } = {}) => {
      const id = Number(conversationId || 0);
      const memberId = cleanText(sibsId);

      if (!id || !memberId || memberId === currentSibsId) return;

      const timerKey = `${id}:${memberId}`;
      const previousTimer = typingExpiryTimersRef.current.get(timerKey);

      if (previousTimer) {
        window.clearTimeout(previousTimer);
        typingExpiryTimersRef.current.delete(timerKey);
      }

      if (!isTyping) {
        clearTypingMember(id, memberId);
        return;
      }

      setTypingByConversation((current) => {
        const currentIds = Array.isArray(current?.[id]) ? current[id] : [];

        if (currentIds.some((value) => cleanText(value) === memberId)) {
          return current;
        }

        return {
          ...current,
          [id]: [...currentIds, memberId],
        };
      });

      const timerId = window.setTimeout(() => {
        clearTypingMember(id, memberId);
      }, 5000);

      typingExpiryTimersRef.current.set(timerKey, timerId);
    };

    const handleConversationUpdate = () => {
      void syncChatWithoutRefresh();
    };

    const handleThemeUpdate = ({ conversationId, theme } = {}) => {
      const targetId = Number(conversationId || 0);
      if (!targetId || !theme) return;

      setConversations((current) => {
        const target = current.find((c) => Number(c.id) === targetId);
        if (!target || JSON.stringify(target.theme) === JSON.stringify(theme)) {
          return current;
        }
        return current.map((c) =>
          Number(c.id) === targetId ? { ...c, theme } : c,
        );
      });
    };

    const handleMembershipNotification = (payload = {}) => {
      const action = cleanText(payload?.action).toLowerCase();
      const conversationId = Number(payload?.conversationId || 0);
      const groupName = cleanText(payload?.groupName) || "Group Chat";

      if (!conversationId || !["added", "removed"].includes(action)) return;

      const actorDisplayName =
        cleanText(payload?.actorDisplayName) || "The group creator";
      const message =
        cleanText(payload?.message) ||
        (action === "added"
          ? `${actorDisplayName} added you to ${groupName}.`
          : `${actorDisplayName} removed you from ${groupName}.`);

      setMembershipNotice({
        action,
        conversationId,
        groupName,
        actorDisplayName,
        message,
      });

      playChatReceiveSound();

      if (action === "removed") {
        handleConversationAccessRevoked(conversationId);
      }

      void syncChatWithoutRefresh();
    };

    const handleNewMessage = ({ conversationId, message } = {}) => {
      const id = Number(conversationId || 0);
      const senderSibsId = cleanText(
        message?.senderSibsId || message?.sender_sibs_id,
      );
      const messageType = cleanText(message?.messageType).toUpperCase();
      const isMembershipActivity =
        messageType === "MEMBER_ADDED" || messageType === "MEMBER_REMOVED";

      if (id && senderSibsId) {
        clearTypingMember(id, senderSibsId);
      }

      if (
        message &&
        senderSibsId &&
        senderSibsId !== currentSibsId &&
        !isMembershipActivity
      ) {
        notifyIncomingMessage(id, message);
      }

      const isActiveConversation =
        id && Number(activeConversationIdRef.current) === id;
      const isActivelyViewed =
        Boolean(isActiveConversation) &&
        typeof document !== "undefined" &&
        document.visibilityState === "visible" &&
        chatWindowOpenRef.current;

      if (isActiveConversation && message) {
        appendMessageToTimeline(message);

        if (isActivelyViewed) {
          setConversations((current) => {
            if (!current.some((conversation) =>
              Number(conversation.id) === id && Number(conversation.unreadCount || 0) > 0
            )) return current;
            return current.map((conversation) =>
              Number(conversation.id) === id
                ? { ...conversation, unreadCount: 0 }
                : conversation,
            );
          });

          void markReadOnce(id, message.id)
            .then(() => refreshConversations({ silent: true }))
            .catch(() => {});
        } else {
          // Keep the message visible in the selected conversation, but don't
          // mark it read if the page is hidden or chat hasn't been reopened.
          void syncChatWithoutRefresh();
        }
      } else {
        // The chat window is closed, or the message belongs to another
        // conversation. Keep it unread so the floating SiBS Chat button and
        // conversation list can show the notification count.
        void syncChatWithoutRefresh();
      }
    };

    const handleMessageUnsent = ({ conversationId, message } = {}) => {
      const id = Number(conversationId || 0);

      if (
        id &&
        message &&
        Number(activeConversationIdRef.current) === id
      ) {
        setMessages((current) =>
          current.map((item) =>
            Number(item.id) === Number(message.id) ? message : item,
          ),
        );
      }

      void syncChatWithoutRefresh();
    };

    const handleRead = ({ conversationId, sibsId, messageId } = {}) => {
      const id = Number(conversationId || 0);
      const readerSibsId = cleanText(sibsId);
      const lastReadMessageId = Number(messageId || 0);

      if (!id || !readerSibsId || !lastReadMessageId) return;

      setConversations((current) => {
        let changed = false;
        const next = current.map((conversation) => {
          if (Number(conversation?.id || 0) !== id) return conversation;

          const updateMemberReadState = (member) => {
            if (cleanText(member?.sibsId) !== readerSibsId) return member;
            if (Number(member?.lastReadMessageId || 0) >= lastReadMessageId) {
              return member;
            }
            return { ...member, lastReadMessageId };
          };

          const oldMembers = Array.isArray(conversation?.members) ? conversation.members : [];
          const nextMembers = oldMembers.map(updateMemberReadState);
          const nextOtherMember = conversation?.otherMember
            ? updateMemberReadState(conversation.otherMember)
            : conversation?.otherMember;
          if (
            nextOtherMember === conversation?.otherMember &&
            nextMembers.every((member, index) => member === oldMembers[index])
          ) return conversation;

          changed = true;
          return { ...conversation, members: nextMembers, otherMember: nextOtherMember };
        });
        return changed ? next : current;
      });
    };

    const handleReaction = ({ conversationId, messageId } = {}) => {
      const id = Number(conversationId || 0);
      const targetMessageId = Number(messageId || 0);

      if (
        !id ||
        !targetMessageId ||
        Number(activeConversationIdRef.current) !== id
      ) {
        return;
      }

      // Reaction state is user-specific because `reactedByMe` depends on the
      // viewer. Re-fetch only the changed message instead of broadcasting a
      // message object built for the user who reacted.
      void getChatMessages(id, {
        before: targetMessageId + 1,
        limit: 1,
      })
        .then((result) => {
          const updatedMessage = result?.[0];
          if (!updatedMessage || !mountedRef.current) return;

          setMessages((current) =>
            current.map((item) =>
              Number(item.id) === targetMessageId ? updatedMessage : item,
            ),
          );
        })
        .catch(() => {});
    };

    const handleWindowFocus = () => {
      void syncChatWithoutRefresh();
    };

    const markChatWindowNotViewed = () => {
      // Mobile browsers can preserve React state while the phone is locked.
      // Once the page is hidden, the previously-open chat must no longer be
      // treated as actively viewed. Otherwise a message received while the
      // phone is asleep can be marked read immediately when the phone wakes.
      chatWindowOpenRef.current = false;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        markChatWindowNotViewed();
        return;
      }

      // Refresh unread counts after wake/resume, but do not mark anything read.
      // The user must explicitly open SiBS Chat again.
      void syncChatWithoutRefresh();
    };

    const handlePageHide = () => {
      markChatWindowNotViewed();
    };

    chatSocket.on("connect", handleConnect);
    chatSocket.on("disconnect", handleDisconnect);
    chatSocket.on("connect_error", handleConnectError);
    chatSocket.on("chat:presence", handlePresence);
    chatSocket.on("chat:typing", handleTyping);
    chatSocket.on("chat:conversation-updated", handleConversationUpdate);
    chatSocket.on("chat:membership-notification", handleMembershipNotification);
    chatSocket.on("chat:message", handleNewMessage);
    chatSocket.on("chat:message-unsent", handleMessageUnsent);
    chatSocket.on("chat:reaction", handleReaction);
    chatSocket.on("chat:read", handleRead);
    chatSocket.on("chat:conversation:theme", handleThemeUpdate);

    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Socket.IO is still the primary realtime transport. The lightweight
    // 2-second safety sync guarantees that a dropped/missed socket event never
    // forces the user to refresh the browser to see a new chat or unread count.
    const fallbackInterval = window.setInterval(() => {
      void syncChatWithoutRefresh();
    }, 2000);

    // Typing status is also persisted briefly in the shared HRIS database.
    // The 1.2-second fallback catches cross-instance typing activity while
    // limiting database/network pressure; local Socket.IO stays immediate.
    const typingFallbackInterval = window.setInterval(() => {
      void syncTypingWithoutRefresh();
    }, 1200);

    if (!chatSocket.connected) {
      chatSocket.connect();
      void syncChatWithoutRefresh();
    } else {
      handleConnect();
    }

    return () => {
      window.clearInterval(fallbackInterval);
      window.clearInterval(typingFallbackInterval);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      chatSocket.off("connect", handleConnect);
      chatSocket.off("disconnect", handleDisconnect);
      chatSocket.off("connect_error", handleConnectError);
      chatSocket.off("chat:presence", handlePresence);
      chatSocket.off("chat:typing", handleTyping);
      chatSocket.off("chat:conversation-updated", handleConversationUpdate);
      chatSocket.off("chat:membership-notification", handleMembershipNotification);
      chatSocket.off("chat:message", handleNewMessage);
      chatSocket.off("chat:message-unsent", handleMessageUnsent);
      chatSocket.off("chat:reaction", handleReaction);
      chatSocket.off("chat:read", handleRead);
      chatSocket.off("chat:conversation:theme", handleThemeUpdate);

      typingExpiryTimersRef.current.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      typingExpiryTimersRef.current.clear();

      chatSocket.disconnect();
    };
  }, [
    appendMessageToTimeline,
    chatAllowed,
    clearTypingMember,
    currentSibsId,
    handleConversationAccessRevoked,
    markReadOnce,
    notifyIncomingMessage,
    refreshConversations,
    syncChatWithoutRefresh,
    syncTypingWithoutRefresh,
    userLoading,
  ]);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) =>
          Number(conversation.id) === Number(activeConversationId),
      ) || null,
    [activeConversationId, conversations],
  );

  const totalUnread = useMemo(
    () =>
      conversations.reduce(
        (total, conversation) => total + Number(conversation.unreadCount || 0),
        0,
      ),
    [conversations],
  );

  const value = useMemo(
    () => ({
      currentSibsId,
      chatAllowed,
      conversations,
      conversationsLoading,
      activeConversationId,
      activeConversation,
      messages,
      messagesLoading,
      loadingOlderMessages,
      hasMoreMessages,
      presence,
      typingByConversation,
      totalUnread,
      error,
      membershipNotice,
      clearError: () => setError(""),
      dismissMembershipNotice,
      isChatWindowOpen,
      setChatWindowOpen,
      setTypingStatus,
      refreshConversations,
      selectConversation,
      loadOlderMessages,
      startPrivateConversation,
      startGroupConversation,
      startHelpdeskConversation,
      sendMessage,
      unsendMessage,
      reactToMessage,
      renameGroup,
      addGroupMembers,
      removeGroupMember,
      leaveGroup,
      hidePrivateConversation,
      deletePrivateConversation,
      setPrivateNickname,
      setConversationTheme,
      uploadConversationThemeImage,
      resetConversationTheme,
    }),
    [
      activeConversation,
      activeConversationId,
      addGroupMembers,
      conversations,
      conversationsLoading,
      currentSibsId,
      chatAllowed,
      dismissMembershipNotice,
      error,
      isChatWindowOpen,
      leaveGroup,
      hidePrivateConversation,
      deletePrivateConversation,
      setPrivateNickname,
      setConversationTheme,
      uploadConversationThemeImage,
      resetConversationTheme,
      membershipNotice,
      messages,
      messagesLoading,
      loadingOlderMessages,
      hasMoreMessages,
      loadOlderMessages,
      presence,
      setChatWindowOpen,
      setTypingStatus,
      typingByConversation,
      refreshConversations,
      removeGroupMember,
      renameGroup,
      selectConversation,
      sendMessage,
      unsendMessage,
      reactToMessage,
      startGroupConversation,
      startHelpdeskConversation,
      startPrivateConversation,
      totalUnread,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  return useContext(ChatContext);
}
