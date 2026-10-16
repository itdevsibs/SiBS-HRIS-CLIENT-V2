let activeScrollLockCount = 0;
let savedBodyOverflow = "";
let savedHtmlOverflow = "";

/**
 * Increments the modal scroll-lock reference counter and locks body & documentElement scrolling
 * if this is the first active lock. Preserves prior inline styles for restoration.
 */
export function lockBodyScroll() {
  if (typeof document === "undefined") return;
  if (activeScrollLockCount === 0) {
    savedBodyOverflow = document.body.style.overflow;
    savedHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  }
  activeScrollLockCount += 1;
}

/**
 * Decrements the modal scroll-lock reference counter. When count drops to 0,
 * restores the exact body and documentElement overflow styles captured prior to the first lock.
 */
export function unlockBodyScroll() {
  if (typeof document === "undefined") return;
  activeScrollLockCount = Math.max(0, activeScrollLockCount - 1);
  if (activeScrollLockCount === 0) {
    document.body.style.overflow = savedBodyOverflow;
    document.documentElement.style.overflow = savedHtmlOverflow;
    savedBodyOverflow = "";
    savedHtmlOverflow = "";
  }
}

/**
 * Returns the current active scroll lock reference count (useful for diagnostics and assertions).
 */
export function getActiveScrollLockCount() {
  return activeScrollLockCount;
}

/**
 * Resets the scroll lock state and clears document styles. Intended for test suite teardown/setup.
 */
export function resetScrollLock() {
  activeScrollLockCount = 0;
  savedBodyOverflow = "";
  savedHtmlOverflow = "";
  if (typeof document !== "undefined") {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }
}
