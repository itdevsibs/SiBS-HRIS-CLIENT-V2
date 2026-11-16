/**
 * Pure utility functions for employee-scoped SiBS Chat UI state and draft persistence.
 *
 * All state is strictly namespaced by the authenticated employee's sibsId in sessionStorage,
 * ensuring:
 * 1. Drafts, window mode, and active conversation survive open/close, navigation, and page refreshes.
 * 2. No employee's drafts or conversations are ever exposed to another signed-in user on the same machine.
 * 3. Clearing or logging out wipes the client-side session state without modifying server-side history.
 */

export const CHAT_STORAGE_PREFIX = "sibs_chat_v2_";

/**
 * Returns the storage key for a specific employee's session chat state.
 *
 * @param {string} sibsId
 * @returns {string|null}
 */
export function getChatStorageKey(sibsId) {
  const cleanId = String(sibsId || "").trim();
  return cleanId ? `${CHAT_STORAGE_PREFIX}${cleanId}` : null;
}

/**
 * Loads the saved chat UI state for an employee.
 *
 * @param {string} sibsId
 * @returns {object|null}
 */
export function loadSavedChatState(sibsId) {
  if (typeof window === "undefined" || !sibsId) return null;
  const key = getChatStorageKey(sibsId);
  if (!key) return null;

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Saves a partial chat UI state for an employee.
 *
 * @param {string} sibsId
 * @param {object} partialState
 */
export function saveChatState(sibsId, partialState = {}) {
  if (typeof window === "undefined" || !sibsId) return;
  const key = getChatStorageKey(sibsId);
  if (!key) return;

  try {
    const current = loadSavedChatState(sibsId) || {};
    const merged = {
      ...current,
      ...partialState,
      updatedAt: Date.now(),
    };
    window.sessionStorage.setItem(key, JSON.stringify(merged));
  } catch {
    // Storage quota exceeded or disabled
  }
}

/**
 * Saves an unsent draft for a specific conversation.
 *
 * @param {string} sibsId
 * @param {number|string} conversationId
 * @param {string} draftText
 */
export function saveConversationDraft(sibsId, conversationId, draftText) {
  if (typeof window === "undefined" || !sibsId) return;
  const cid = String(conversationId || "general");
  const current = loadSavedChatState(sibsId) || {};
  const drafts = { ...(current.draftsByConversation || {}) };

  const cleanDraft = String(draftText || "");
  if (cleanDraft.trim()) {
    drafts[cid] = cleanDraft;
  } else {
    delete drafts[cid];
  }

  saveChatState(sibsId, { draftsByConversation: drafts });
}

/**
 * Retrieves an unsent draft for a specific conversation.
 *
 * @param {string} sibsId
 * @param {number|string} conversationId
 * @returns {string}
 */
export function getConversationDraft(sibsId, conversationId) {
  const current = loadSavedChatState(sibsId);
  if (!current?.draftsByConversation) return "";
  const cid = String(conversationId || "general");
  return String(current.draftsByConversation[cid] || "");
}

/**
 * Clears an unsent draft for a conversation (e.g. after message is sent).
 *
 * @param {string} sibsId
 * @param {number|string} conversationId
 */
export function clearConversationDraft(sibsId, conversationId) {
  saveConversationDraft(sibsId, conversationId, "");
}

/**
 * Clears the chat UI state for an employee, or for all employees if sibsId is omitted.
 *
 * @param {string} [sibsId]
 */
export function clearChatState(sibsId) {
  if (typeof window === "undefined") return;

  try {
    if (sibsId) {
      const key = getChatStorageKey(sibsId);
      if (key) window.sessionStorage.removeItem(key);
    } else {
      const keysToRemove = [];
      for (let i = 0; i < window.sessionStorage.length; i += 1) {
        const k = window.sessionStorage.key(i);
        if (k && k.startsWith(CHAT_STORAGE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
    }
  } catch {
    // Ignore
  }
}

/**
 * Purges any chat state keys belonging to other employees, ensuring complete account isolation.
 *
 * @param {string} currentSibsId
 */
export function cleanupOtherEmployeeChatStates(currentSibsId) {
  if (typeof window === "undefined" || !currentSibsId) return;
  const currentKey = getChatStorageKey(currentSibsId);

  try {
    const keysToRemove = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const k = window.sessionStorage.key(i);
      if (k && k.startsWith(CHAT_STORAGE_PREFIX) && k !== currentKey) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
  } catch {
    // Ignore
  }
}
