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

const CHAT_RECEIVE_SOUND_URL =
  `${import.meta.env.BASE_URL}mama-rene-baterbonia-first-3-seconds.mp3`;

let chatReceiveAudioContext = null;
let chatReceiveAudioBuffer = null;
let chatReceiveAudioBufferPromise = null;

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
  try {
    const audioContext = getChatReceiveAudioContext();
    if (!audioContext) return;

    if (audioContext.state === "suspended") {
      await audioContext.resume().catch(() => {});
    }

    const audioBuffer = await getChatReceiveAudioBuffer(audioContext);
    if (!audioBuffer) return;

    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();

    source.buffer = audioBuffer;
    gain.gain.value = 1;

    source.connect(gain);
    gain.connect(audioContext.destination);

    // Play only as a receive-message popup tone. No visible media player.
    source.start(0);
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
  const [typingByConversation, setTypingByConversation] = useState({});
  const [error, setError] = useState("");
  const [membershipNotice, setMembershipNotice] = useState(null);

  const activeConversationIdRef = useRef(null);
  const mountedRef = useRef(true);
  const chatWindowOpenRef = useRef(false);
  const messagesRef = useRef([]);
  const fallbackSyncBusyRef = useRef(false);
  const typingSyncBusyRef = useRef(false);
  const typingExpiryTimersRef = useRef(new Map());

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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
      if (!silent && mountedRef.current) {
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

      if (newIncomingMessages.length) {
        playChatReceiveSound();
      }

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
      if (latestMessageId) {
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

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncChatWithoutRefresh();
      }
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
    }, 1000);

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
