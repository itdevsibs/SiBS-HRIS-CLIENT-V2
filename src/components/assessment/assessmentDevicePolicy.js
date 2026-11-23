/**
 * Public CSR-Fit registration and assessment require a desktop/laptop layout.
 * Do not rely on the User-Agent alone: Chrome DevTools phone emulation can
 * retain a desktop UA, and iPad desktop-mode browsers also obscure device type.
 *
 * Browser checks are UX/accessibility gates. They cannot cryptographically
 * prove physical hardware: an intentionally spoofed client can still pretend
 * to be a desktop. The server separately denies recognized mobile UAs.
 */
export const CSR_FIT_MIN_DESKTOP_WIDTH = 1024;

export function isMobileAssessmentDevice(browserNavigator = typeof navigator !== 'undefined' ? navigator : null) {
  if (!browserNavigator) return false;
  if (browserNavigator.userAgentData?.mobile === true) return true;
  const platform = String(browserNavigator.userAgentData?.platform || '');
  if (/android|ios|ipados/i.test(platform)) return true;
  const ua = String(browserNavigator.userAgent || '');
  if (/android|iphone|ipad|ipod|windows phone|iemobile|blackberry|bb10|webos|opera mini|mobile|tablet|kindle|silk\//i.test(ua)) return true;
  // Modern iPadOS sometimes impersonates desktop Safari on a Mac.
  if (/macintosh/i.test(ua) && Number(browserNavigator.maxTouchPoints || 0) > 1) return true;
  return false;
}

/**
 * The 1024 CSS-pixel minimum also prevents cramped/tiny desktop windows and
 * phone emulators with desktop User-Agent strings. Desktop users can maximize
 * their window; mobile/tablet users must use a computer.
 */
export function isAssessmentDesktopUnavailable(
  browserNavigator = typeof navigator !== 'undefined' ? navigator : null,
  browserWindow = typeof window !== 'undefined' ? window : null,
) {
  if (isMobileAssessmentDevice(browserNavigator)) return true;
  if (!browserWindow) return false;

  const dimensions = [
    Number(browserWindow.innerWidth),
    Number(browserWindow.visualViewport?.width),
  ].filter(width => Number.isFinite(width) && width > 0);
  const viewportWidth = dimensions.length ? Math.min(...dimensions) : 0;

  if (viewportWidth > 0 && viewportWidth < CSR_FIT_MIN_DESKTOP_WIDTH) return true;

  // On some tablets, the UA is desktop-like and the viewport is wide. Unlike
  // ordinary touch-enabled laptops, the primary pointer is coarse/no-hover.
  if (typeof browserWindow.matchMedia === 'function') {
    const touchFirst = browserWindow.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (touchFirst) return true;
  }
  return false;
}
