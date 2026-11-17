/**
 * SiBS Chat UI preferences and unsent drafts for the signed-in employee.
 * Messages and the conversation roster remain server-owned; only the small
 * window state and text drafts are cached in this browser.
 *
 * The HRIS logout event calls clearChatState() to remove all saved employees'
 * chat state from the browser. Never use an unscoped shared draft key.
 */
const STORAGE_PREFIX = "sibs:hris:chat:ui:v1:";

function getStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function employeePrefix(sibsId) {
  const id = String(sibsId ?? "").trim();
  if (!id || id.length > 128) return "";
  return `${STORAGE_PREFIX}${encodeURIComponent(id)}:`;
}

function draftKey(sibsId, conversationId) {
  const prefix = employeePrefix(sibsId);
  const id = Number(conversationId);
  return prefix && Number.isSafeInteger(id) && id > 0 ? `${prefix}draft:${id}` : "";
}

export function loadSavedChatState(sibsId) {
  const storage = getStorage();
  const prefix = employeePrefix(sibsId);
  if (!storage || !prefix) return null;
  try {
    const saved = storage.getItem(`${prefix}state`);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return parsed && !Array.isArray(parsed) && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function saveChatState(sibsId, changes = {}) {
  const storage = getStorage();
  const prefix = employeePrefix(sibsId);
  if (!storage || !prefix || !changes || typeof changes !== "object" || Array.isArray(changes)) return;
  try {
    const previous = loadSavedChatState(sibsId) || {};
    // Partial updates must not erase unrelated chat window preferences.
    storage.setItem(`${prefix}state`, JSON.stringify({ ...previous, ...changes }));
  } catch {
    // Storage may be unavailable or full; Chat continues without persistence.
  }
}

export function getConversationDraft(sibsId, conversationId) {
  const storage = getStorage();
  const key = draftKey(sibsId, conversationId);
  if (!storage || !key) return "";
  try {
    return storage.getItem(key) || "";
  } catch {
    return "";
  }
}

export function saveConversationDraft(sibsId, conversationId, text) {
  const storage = getStorage();
  const key = draftKey(sibsId, conversationId);
  if (!storage || !key) return;
  try {
    const draft = String(text ?? "").slice(0, 10000);
    if (!draft) storage.removeItem(key);
    else storage.setItem(key, draft);
  } catch {
    // Never block typing or sending because browser storage failed.
  }
}

export function clearConversationDraft(sibsId, conversationId) {
  const storage = getStorage();
  const key = draftKey(sibsId, conversationId);
  if (!storage || !key) return;
  try {
    storage.removeItem(key);
  } catch {
    // Best-effort cleanup for browsers with restricted storage.
  }
}

function clearKeysExcept(prefixToKeep = "") {
  const storage = getStorage();
  if (!storage) return;
  try {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key?.startsWith(STORAGE_PREFIX) &&
          (!prefixToKeep || !key.startsWith(prefixToKeep))) {
        storage.removeItem(key);
      }
    }
  } catch {
    // Restricted storage must not affect the active HRIS session.
  }
}

export function cleanupOtherEmployeeChatStates(sibsId) {
  const prefix = employeePrefix(sibsId);
  if (prefix) clearKeysExcept(prefix);
}

export function clearChatState() {
  clearKeysExcept();
}
