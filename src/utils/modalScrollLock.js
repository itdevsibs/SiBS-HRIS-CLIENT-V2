let activeScrollLockCount = 0;
let savedBodyOverflow = "";
let savedHtmlOverflow = "";
let lockedPortalScroller = null;
let savedPortalOverflowY = "";

/**
 * Reference-counted modal scroll locking. Assessment Admin owns its scroll
 * container; lock that element without changing the document's overflow.
 * All other HRIS routes retain the existing document lock behavior.
 */
export function lockBodyScroll() {
  if (typeof document === "undefined") return;
  if (activeScrollLockCount === 0) {
    lockedPortalScroller = document.querySelector("[data-assessment-admin-scroll]");
    if (lockedPortalScroller) {
      savedPortalOverflowY = lockedPortalScroller.style.overflowY;
      lockedPortalScroller.style.overflowY = "hidden";
    } else {
      savedBodyOverflow = document.body.style.overflow;
      savedHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }
  }
  activeScrollLockCount += 1;
}

/** Restore only the original lock target after the final modal closes. */
export function unlockBodyScroll() {
  if (typeof document === "undefined" || activeScrollLockCount === 0) return;
  activeScrollLockCount -= 1;
  if (activeScrollLockCount !== 0) return;
  if (lockedPortalScroller) {
    lockedPortalScroller.style.overflowY = savedPortalOverflowY;
    lockedPortalScroller = null;
    savedPortalOverflowY = "";
  } else {
    document.body.style.overflow = savedBodyOverflow;
    document.documentElement.style.overflow = savedHtmlOverflow;
    savedBodyOverflow = "";
    savedHtmlOverflow = "";
  }
}

/** Returns the current active scroll lock reference count. */
export function getActiveScrollLockCount() {
  return activeScrollLockCount;
}

/** Resets scroll lock state; intended for test suite teardown/setup. */
export function resetScrollLock() {
  if (lockedPortalScroller) lockedPortalScroller.style.overflowY = savedPortalOverflowY;
  lockedPortalScroller = null;
  savedPortalOverflowY = "";
  activeScrollLockCount = 0;
  savedBodyOverflow = "";
  savedHtmlOverflow = "";
  if (typeof document !== "undefined") {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }
}
