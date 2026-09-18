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
  getChatConversations,
  getChatMessages,
  leaveGroupChat,
  markChatRead,
  removeGroupChatMember,
  renameGroupChat,
  sendChatMessage,
  setChatMessageReaction,
  unsendChatMessage,
} from "@/lib/axios/sibsChat";
import chatSocket from "@/lib/axios/chatSocket";
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

const CHAT_ALLOWED_DEPARTMENT_ID = 3;

function getCurrentDepartmentId(user = {}) {
  const value =
    user?.departmentId ??
    user?.department_id ??
    user?.deptId ??
    user?.gy_dept_id ??
    user?.gyDeptId ??
    null;

  const departmentId = Number(value);
  return Number.isFinite(departmentId) ? departmentId : null;
}

let chatReceiveAudioContext = null;

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

function scheduleChatReceiveSound(audioContext) {
  if (!audioContext) return;

  const now = audioContext.currentTime;
  const masterGain = audioContext.createGain();

  masterGain.gain.setValueAtTime(0.0001, now);
  masterGain.gain.exponentialRampToValueAtTime(0.12, now + 0.012);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  masterGain.connect(audioContext.destination);

  const tones = [
    { frequency: 740, start: 0, duration: 0.12 },
    { frequency: 980, start: 0.065, duration: 0.14 },
  ];

  tones.forEach(({ frequency, start, duration }) => {
    const oscillator = audioContext.createOscillator();
    const toneGain = audioContext.createGain();
    const startAt = now + start;
    const stopAt = startAt + duration;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startAt);

    toneGain.gain.setValueAtTime(0.0001, startAt);
    toneGain.gain.exponentialRampToValueAtTime(0.9, startAt + 0.01);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, stopAt);

    oscillator.connect(toneGain);
    toneGain.connect(masterGain);

    oscillator.start(startAt);
    oscillator.stop(stopAt + 0.01);
  });
}

function playChatReceiveSound() {
  try {
    const audioContext = getChatReceiveAudioContext();
    if (!audioContext) return;

    if (audioContext.state === "suspended") {
      void audioContext
        .resume()
        .then(() => scheduleChatReceiveSound(audioContext))
        .catch(() => {});
      return;
    }

    scheduleChatReceiveSound(audioContext);
  } catch {
    // Chat must continue working even if the browser blocks audio playback.
  }
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
  const chatAllowed = useMemo(
    () => getCurrentDepartmentId(user) === CHAT_ALLOWED_DEPARTMENT_ID,
    [user],
  );

  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [presence, setPresence] = useState({});
  const [error, setError] = useState("");
  const [membershipNotice, setMembershipNotice] = useState(null);

  const activeConversationIdRef = useRef(null);
  const mountedRef = useRef(true);
  const chatWindowOpenRef = useRef(false);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

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
        if (audioContext?.state === "suspended") {
          void audioContext.resume().catch(() => {});
        }
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

  const refreshConversations = useCallback(async () => {
    if (!currentSibsId || !chatAllowed) {
      setConversations([]);
      return [];
    }

    setConversationsLoading(true);

    try {
      const nextConversations = sortConversations(await getChatConversations());

      if (mountedRef.current) {
        setConversations(nextConversations);
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
      if (mountedRef.current) {
        setConversationsLoading(false);
      }
    }
  }, [chatAllowed, currentSibsId, refreshPresence]);

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
        await markChatRead(conversationId, latestId || null).catch(() => {});

        setConversations((current) =>
          current.map((conversation) =>
            Number(conversation.id) === Number(conversationId)
              ? { ...conversation, unreadCount: 0 }
              : conversation,
          ),
        );

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
    async ({ message = "", images = [], gifUrl = "" } = {}) => {
      const conversationId = Number(activeConversationIdRef.current || 0);
      if (!conversationId) return null;

      const sentMessage = await sendChatMessage(conversationId, {
        message,
        images,
        gifUrl,
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
      await refreshConversations();
      return result;
    },
    [refreshConversations],
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

  useEffect(() => {
    if (userLoading || !currentSibsId || !chatAllowed) {
      setConversations([]);
      setMessages([]);
      setHasMoreMessages(false);
      setActiveConversationId(null);
      activeConversationIdRef.current = null;
      setPresence({});
      setMembershipNotice(null);
      chatSocket.disconnect();
      return undefined;
    }

    const handleConnect = () => {
      void refreshConversations();
    };

    const handlePresence = ({ sibsId, online } = {}) => {
      const id = cleanText(sibsId);
      if (!id) return;

      setPresence((current) => ({
        ...current,
        [id]: Boolean(online),
      }));
    };

    const handleConversationUpdate = () => {
      void refreshConversations();
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

      void refreshConversations();
    };

    const handleNewMessage = ({ conversationId, message } = {}) => {
      const id = Number(conversationId || 0);
      const senderSibsId = cleanText(
        message?.senderSibsId || message?.sender_sibs_id,
      );
      const messageType = cleanText(message?.messageType).toUpperCase();
      const isMembershipActivity =
        messageType === "MEMBER_ADDED" || messageType === "MEMBER_REMOVED";

      if (
        message &&
        senderSibsId &&
        senderSibsId !== currentSibsId &&
        !isMembershipActivity
      ) {
        playChatReceiveSound();
      }

      const isActiveConversation =
        id && Number(activeConversationIdRef.current) === id;
      const isActivelyViewed =
        Boolean(isActiveConversation) && chatWindowOpenRef.current;

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
        void refreshConversations();
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

      void refreshConversations();
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

    chatSocket.on("connect", handleConnect);
    chatSocket.on("chat:presence", handlePresence);
    chatSocket.on("chat:conversation-updated", handleConversationUpdate);
    chatSocket.on("chat:membership-notification", handleMembershipNotification);
    chatSocket.on("chat:message", handleNewMessage);
    chatSocket.on("chat:message-unsent", handleMessageUnsent);
    chatSocket.on("chat:reaction", handleReaction);

    if (!chatSocket.connected) {
      chatSocket.connect();
    } else {
      handleConnect();
    }

    return () => {
      chatSocket.off("connect", handleConnect);
      chatSocket.off("chat:presence", handlePresence);
      chatSocket.off("chat:conversation-updated", handleConversationUpdate);
      chatSocket.off("chat:membership-notification", handleMembershipNotification);
      chatSocket.off("chat:message", handleNewMessage);
      chatSocket.off("chat:message-unsent", handleMessageUnsent);
      chatSocket.off("chat:reaction", handleReaction);
      chatSocket.disconnect();
    };
  }, [chatAllowed, currentSibsId, refreshConversations, userLoading]);

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
      totalUnread,
      error,
      membershipNotice,
      clearError: () => setError(""),
      dismissMembershipNotice,
      setChatWindowOpen,
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
      membershipNotice,
      messages,
      messagesLoading,
      loadingOlderMessages,
      hasMoreMessages,
      loadOlderMessages,
      presence,
      setChatWindowOpen,
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
