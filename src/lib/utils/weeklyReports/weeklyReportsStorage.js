export function safeReadArray(key, fallback = []) {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : fallback;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function safeWriteArray(key, value) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      key,
      JSON.stringify(Array.isArray(value) ? value : []),
    );
  } catch {
    // Preserve the original frontend-only fallback behavior.
  }
}
