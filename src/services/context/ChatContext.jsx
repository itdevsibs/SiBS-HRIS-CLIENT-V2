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
  sendChatMessage,
  sendChatTypingStatus,
  setPrivateChatNickname,
  setChatMessageReaction,
  unsendChatMessage,
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
  `${import.meta.env.BASE_URL}mama-rene-baterbonia-first-3-seconds.mp3`;

let chatReceiveAudioContext = null;
let chatReceiveAudioBuffer = null;
let chatReceiveAudioBufferPromise = null;
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

async function getChatReceiveAudioBuffer(audioContext) {
  if (!audioContext) return null;
  if (chatReceiveAudioBuffer) return chatReceiveAudioBuffer;

  if (!chatReceiveAudioBufferPromise) {
    chatReceiveAudioBufferPromise = fetch(CHAT_RECEIVE_SOUND_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load chat receive sound: ${response.status}`);
        }

        return response.arrayBuffer();
      })
      .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
      .then((decodedBuffer) => {
        chatReceiveAudioBuffer = decodedBuffer;
        return decodedBuffer;
      })
      .catch((error) => {
        chatReceiveAudioBufferPromise = null;
        throw error;
      });
  }

  return chatReceiveAudioBufferPromise;
}

async function playChatReceiveSound() {
  const requestId = ++chatReceivePlayRequestId;

  try {
    // A new incoming chat always interrupts the tone that is currently
    // playing. This makes the notification behave like a real message alert:
    // stop the old tone immediately, then restart from the beginning for the
    // newest received message.
    if (chatReceiveActiveSource) {
      try {
        chatReceiveActiveSource.stop();
      } catch {
        // The previous source may already have ended.
      }

      chatReceiveActiveSource = null;
    }

    const audioContext = getChatReceiveAudioContext();
    if (!audioContext) return;

    if (audioContext.state === "suspended") {
      await audioContext.resume().catch(() => {});
    }

    const audioBuffer = await getChatReceiveAudioBuffer(audioContext);
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

export function ChatProvider({ children }) {
  const { user, loading: userLoading } = useUser() || {};
  const currentSibsId = useMemo(() => getCurrentSibsId(user), [user]);
  // SiBS Chat is available to every authenticated HRIS user regardless of
  // department, role, or access level. The authenticated SIBS ID is the only
  // requirement for loading and using chat.
  const chatAllowed = useMemo(
    () => Boolean(currentSibsId),
    [currentSibsId],
  );

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

  const activeConversationIdRef = useRef(null);
  const mountedRef = useRef(true);
  const chatWindowOpenRef = useRef(false);
  const messagesRef = useRef([]);
  const conversationsRef = useRef([]);
  const fallbackSyncBusyRef = useRef(false);
  const typingSyncBusyRef = useRef(false);
  const typingExpiryTimersRef = useRef(new Map());
  const notifiedMessageIdsRef = useRef(new Set());
  const conversationLastMessageIdsRef = useRef(new Map());
  const conversationToneBaselineReadyRef = useRef(false);

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

        void getChatReceiveAudioBuffer(audioContext).catch(() => {});
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
    chatWindowOpenRef.current = Boolean(isOpen);
  }, []);

  const dismissMembershipNotice = useCallback(() => {
    setMembershipNotice(null);
  }, []);

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

      setPresence((current) => ({
        ...current,
        ...result,
      }));
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
            } catch {
              // The next 2-second refresh can retry without breaking chat.
            }
          }),
        );
      }

      if (mountedRef.current) {
        setConversations(nextConversations);

        // Cross-instance fallback: the conversations endpoint also carries the
        // current DB-backed typing state. This makes local <-> production
        // typing work even when each environment is connected to a different
        // Socket.IO process or the dedicated typing poll misses a request.
        setTypingByConversation((current) => {
          const next = { ...current };

          nextConversations.forEach((conversation) => {
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

            if (typingIds.length) {
              next[conversationId] = typingIds;
            } else {
              delete next[conversationId];
            }
          });

          return next;
        });

        setError("");
      }

      refreshPresence(nextConversations);
      return nextConversations;
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
  }, [chatAllowed, currentSibsId, notifyIncomingMessage, refreshPresence]);

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
          setMessages(nextMessages);
          setHasMoreMessages(nextMessages.length >= 75);
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
          await markChatRead(conversationId, latestId || null).catch(() => {});

          if (mountedRef.current) {
            setConversations((current) =>
              current.map((conversation) =>
                Number(conversation.id) === Number(conversationId)
                  ? { ...conversation, unreadCount: 0 }
                  : conversation,
              ),
            );
          }
        }

        return nextMessages;
      } catch (requestError) {
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
    [currentSibsId],
  );

  const selectConversation = useCallback(
    async (conversationId) => {
      const id = Number(conversationId || 0) || null;
      activeConversationIdRef.current = id;
      setActiveConversationId(id);
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
        setMessages((current) => {
          if (current.some((item) => Number(item.id) === Number(sentMessage.id))) {
            return current;
          }
          return [...current, sentMessage];
        });
      }

      await refreshConversations();
      return sentMessage;
    },
    [refreshConversations],
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
      if (!id || !chatAllowed || !currentSibsId) return null;

      try {
        return await sendChatTypingStatus(id, Boolean(isTyping));
      } catch {
        return null;
      }
    },
    [chatAllowed, currentSibsId],
  );

  const syncTypingWithoutRefresh = useCallback(async () => {
    const conversationId = Number(activeConversationIdRef.current || 0);

    if (
      typingSyncBusyRef.current ||
      !mountedRef.current ||
      !currentSibsId ||
      !chatAllowed ||
      !chatWindowOpenRef.current ||
      !conversationId
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
    } catch {
      // Socket.IO remains primary. The next lightweight typing poll retries.
    } finally {
      typingSyncBusyRef.current = false;
    }
  }, [chatAllowed, currentSibsId]);

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

    try {
      await refreshConversations({ silent: true });

      const conversationId = Number(activeConversationIdRef.current || 0);
      if (!conversationId || !chatWindowOpenRef.current) return;

      void syncTypingWithoutRefresh();

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

      const currentFingerprint = currentMessages
        .map((item) =>
          [
            Number(item?.id || 0),
            cleanText(item?.messageText),
            cleanText(item?.messageType),
            cleanText(item?.unsentAt || item?.unsent_at),
            JSON.stringify(item?.reactions || []),
            JSON.stringify(item?.replyTo || null),
          ].join(":"),
        )
        .join("|");

      const nextFingerprint = (nextMessages || [])
        .map((item) =>
          [
            Number(item?.id || 0),
            cleanText(item?.messageText),
            cleanText(item?.messageType),
            cleanText(item?.unsentAt || item?.unsent_at),
            JSON.stringify(item?.reactions || []),
            JSON.stringify(item?.replyTo || null),
          ].join(":"),
        )
        .join("|");

      if (currentFingerprint !== nextFingerprint) {
        messagesRef.current = nextMessages;
        setMessages(nextMessages);
      }

      const latestMessageId = Number(nextMessages?.at(-1)?.id || 0);
      const isStillActivelyViewed =
        typeof document !== "undefined" &&
        document.visibilityState === "visible" &&
        chatWindowOpenRef.current &&
        Number(activeConversationIdRef.current) === conversationId;

      if (latestMessageId && isStillActivelyViewed) {
        await markChatRead(conversationId, latestMessageId).catch(() => {});

        if (mountedRef.current) {
          setConversations((current) =>
            current.map((conversation) =>
              Number(conversation.id) === conversationId
                ? { ...conversation, unreadCount: 0 }
                : conversation,
            ),
          );
        }
      }
    } catch {
      // The next Socket.IO event / fallback sync will retry automatically.
    } finally {
      fallbackSyncBusyRef.current = false;
    }
  }, [
    chatAllowed,
    currentSibsId,
    notifyIncomingMessage,
    refreshConversations,
    syncTypingWithoutRefresh,
  ]);

  useEffect(() => {
    if (userLoading || !currentSibsId || !chatAllowed) {
      setConversations([]);
      setMessages([]);
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

      setPresence((current) => ({
        ...current,
        [id]: Boolean(online),
      }));
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

      if (
        action === "removed" &&
        Number(activeConversationIdRef.current) === conversationId
      ) {
        activeConversationIdRef.current = null;
        setActiveConversationId(null);
        setMessages([]);
        setHasMoreMessages(false);
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

      if (isActivelyViewed && message) {
        setMessages((current) => {
          if (current.some((item) => Number(item.id) === Number(message.id))) {
            return current;
          }

          return [...current, message];
        });

        setConversations((current) =>
          current.map((conversation) =>
            Number(conversation.id) === id
              ? { ...conversation, unreadCount: 0 }
              : conversation,
          ),
        );

        void markChatRead(id, message.id)
          .then(() => refreshConversations())
          .catch(() => {});
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

      setConversations((current) =>
        current.map((conversation) => {
          if (Number(conversation?.id || 0) !== id) return conversation;

          const updateMemberReadState = (member) => {
            if (cleanText(member?.sibsId) !== readerSibsId) return member;

            return {
              ...member,
              lastReadMessageId: Math.max(
                Number(member?.lastReadMessageId || 0),
                lastReadMessageId,
              ),
            };
          };

          return {
            ...conversation,
            members: Array.isArray(conversation?.members)
              ? conversation.members.map(updateMemberReadState)
              : [],
            otherMember: conversation?.otherMember
              ? updateMemberReadState(conversation.otherMember)
              : conversation?.otherMember,
          };
        }),
      );
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
    // Polling it once per second lets a local/dev HRIS instance and the
    // production HRIS instance see each other's typing indicator even when
    // they are connected to different Socket.IO server processes.
    const typingFallbackInterval = window.setInterval(() => {
      void syncTypingWithoutRefresh();
    }, 600);

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

      typingExpiryTimersRef.current.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      typingExpiryTimersRef.current.clear();

      chatSocket.disconnect();
    };
  }, [
    chatAllowed,
    clearTypingMember,
    currentSibsId,
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
      setChatWindowOpen,
      setTypingStatus,
      refreshConversations,
      selectConversation,
      loadOlderMessages,
      startPrivateConversation,
      startGroupConversation,
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
      leaveGroup,
      hidePrivateConversation,
      deletePrivateConversation,
      setPrivateNickname,
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
      startPrivateConversation,
      totalUnread,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  return useContext(ChatContext);
}
