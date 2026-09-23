/**
 * Pure utility functions for deterministic chat scroll anchoring and calculations.
 */

/**
 * Determines whether the user's scroll position is within a specified threshold from the bottom.
 *
 * @param {number} scrollTop - Current scroll offset from top
 * @param {number} scrollHeight - Total scrollable height of the content
 * @param {number} clientHeight - Visible viewport height
 * @param {number} [threshold=80] - Distance in pixels from bottom considered "near bottom"
 * @returns {boolean} True if within threshold or if content fits completely inside client
 */
export function checkIsNearBottom(
  scrollTop = 0,
  scrollHeight = 0,
  clientHeight = 0,
  threshold = 80,
) {
  const safeScrollTop = Math.max(0, Number(scrollTop) || 0);
  const safeScrollHeight = Math.max(0, Number(scrollHeight) || 0);
  const safeClientHeight = Math.max(0, Number(clientHeight) || 0);

  // If content is shorter than or equal to visible viewport, user is by definition at the bottom
  if (safeScrollHeight <= safeClientHeight) {
    return true;
  }

  const distanceFromBottom = safeScrollHeight - (safeScrollTop + safeClientHeight);
  return distanceFromBottom <= Math.max(0, threshold);
}

/**
 * Determines whether the scroll container should snap to the bottom.
 *
 * Snapping occurs if either:
 * 1. This is an initial conversation load / switch (`isInitialLoad === true`).
 * 2. The user was already near the bottom before the layout/resize happened (`isNearBottom === true`).
 *
 * @param {boolean} isInitialLoad
 * @param {boolean} isNearBottom
 * @returns {boolean}
 */
export function shouldSnapToBottom(isInitialLoad = false, isNearBottom = false) {
  return Boolean(isInitialLoad || isNearBottom);
}

/**
 * Computes the new scrollTop position when older messages are prepended to the top of the chat,
 * preserving the exact reading position relative to previously visible messages.
 *
 * @param {number} prevScrollTop
 * @param {number} prevScrollHeight
 * @param {number} nextScrollHeight
 * @returns {number} The updated scrollTop value
 */
export function calculatePrependScrollTop(
  prevScrollTop = 0,
  prevScrollHeight = 0,
  nextScrollHeight = 0,
) {
  const safePrevScrollTop = Math.max(0, Number(prevScrollTop) || 0);
  const safePrevHeight = Math.max(0, Number(prevScrollHeight) || 0);
  const safeNextHeight = Math.max(0, Number(nextScrollHeight) || 0);

  const delta = safeNextHeight - safePrevHeight;
  if (delta <= 0) {
    return safePrevScrollTop;
  }

  return safePrevScrollTop + delta;
}
