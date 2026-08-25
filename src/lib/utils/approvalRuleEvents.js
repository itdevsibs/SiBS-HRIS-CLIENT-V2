export const APPROVAL_RULES_CHANGED_EVENT = "sibs:approval-rules-changed";

const APPROVAL_RULES_STORAGE_KEY = "sibs:approval-rules-revision";

export function notifyApprovalRulesChanged(moduleKey) {
  if (typeof window === "undefined") return;

  const detail = {
    moduleKey,
    changedAt: Date.now(),
  };

  window.dispatchEvent(
    new CustomEvent(APPROVAL_RULES_CHANGED_EVENT, { detail }),
  );

  try {
    window.localStorage.setItem(
      APPROVAL_RULES_STORAGE_KEY,
      JSON.stringify(detail),
    );
  } catch {
    // The in-page event still keeps the current session synchronized.
  }
}

export function subscribeToApprovalRuleChanges(moduleKey, listener) {
  if (typeof window === "undefined") return () => {};

  const matchesModule = (changedModuleKey) =>
    !changedModuleKey || changedModuleKey === moduleKey;

  const handleRuleChange = (event) => {
    if (matchesModule(event?.detail?.moduleKey)) listener();
  };

  const handleStorage = (event) => {
    if (event.key !== APPROVAL_RULES_STORAGE_KEY || !event.newValue) return;

    try {
      const payload = JSON.parse(event.newValue);
      if (matchesModule(payload?.moduleKey)) listener();
    } catch {
      listener();
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") listener();
  };

  window.addEventListener(APPROVAL_RULES_CHANGED_EVENT, handleRuleChange);
  window.addEventListener("storage", handleStorage);
  window.addEventListener("focus", listener);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    window.removeEventListener(APPROVAL_RULES_CHANGED_EVENT, handleRuleChange);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("focus", listener);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}
