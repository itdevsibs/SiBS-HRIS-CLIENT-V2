/**
 * Lightweight SiBS HRIS animated favicon (orange + blue).
 *
 * The old version serialized a canvas PNG every 180ms, causing
 * unnecessary main-thread work. These pre-rendered PNG frames live in /public
 * and are cached once. Each timed callback now only switches favicon URLs.
 *
 * No index.html or main.jsx changes are required.
 */
const FRAME_COUNT = 12;
const FRAME_INTERVAL_MS = 300;
const FRAME_URLS = Array.from(
  { length: FRAME_COUNT },
  (_, index) => `/sibs-hris-animated/frame-${String(index).padStart(2, "0")}.png`,
);

let activeCleanup = null;

/** Called once from main.jsx. Restores original icons when torn down. */
export function startAnimatedHrisFavicon() {
  if (typeof window === "undefined" || typeof document === "undefined") return () => {};

  // Avoid duplicate timers during Vite hot reloading or multiple bootstraps.
  activeCleanup?.();

  const links = Array.from(document.querySelectorAll('link[rel="icon"]'));
  if (!links.length) return () => {};

  const originals = links.map((link) => ({
    link,
    href: link.getAttribute("href"),
    type: link.getAttribute("type"),
    sizes: link.getAttribute("sizes"),
  }));

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  let alive = true;
  let loaded = false;
  let timer = null;
  let frameIndex = 0;
  let showingAnimation = false;
  // Retain decoded images so the browser can reuse them from memory/cache.
  let cachedImages = [];

  function stopTimer() {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  }

  function restoreStaticIcon() {
    if (!showingAnimation) return;
    for (const { link, href, type, sizes } of originals) {
      if (href === null) link.removeAttribute("href");
      else link.setAttribute("href", href);
      if (type === null) link.removeAttribute("type");
      else link.setAttribute("type", type);
      if (sizes === null) link.removeAttribute("sizes");
      else link.setAttribute("sizes", sizes);
    }
    showingAnimation = false;
  }

  function paintNextFrame() {
    timer = null;
    if (!alive || !loaded || document.hidden || reducedMotion?.matches) return;

    const url = FRAME_URLS[frameIndex];
    // Traverse the existing frames in reverse to rotate the gradient clockwise.
    frameIndex = (frameIndex - 1 + FRAME_COUNT) % FRAME_COUNT;
    // No canvas painting, PNG encoding, or image generation on this timer.
    for (const link of links) {
      link.setAttribute("type", "image/png");
      link.setAttribute("href", url);
    }
    showingAnimation = true;
    timer = window.setTimeout(paintNextFrame, FRAME_INTERVAL_MS);
  }

  function syncPlayback() {
    stopTimer();
    if (!alive || !loaded || document.hidden || reducedMotion?.matches) {
      restoreStaticIcon();
      return;
    }
    paintNextFrame();
  }

  function cleanup() {
    if (!alive) return;
    alive = false;
    stopTimer();
    restoreStaticIcon();
    cachedImages = [];
    document.removeEventListener("visibilitychange", syncPlayback);
    reducedMotion?.removeEventListener?.("change", syncPlayback);
    window.removeEventListener("pagehide", cleanup);
    if (activeCleanup === cleanup) activeCleanup = null;
  }

  activeCleanup = cleanup;
  document.addEventListener("visibilitychange", syncPlayback);
  reducedMotion?.addEventListener?.("change", syncPlayback);
  window.addEventListener("pagehide", cleanup);

  // Preload once; if even one file is missing, preserve the static favicon.
  // There are no repeated downloads or canvas PNG encodes during animation.
  Promise.all(
    FRAME_URLS.map((url) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Missing favicon frame: ${url}`));
      img.src = url;
    })),
  ).then((images) => {
    if (!alive) return;
    cachedImages = images;
    loaded = true;
    syncPlayback();
  }).catch(() => {
    // Missing icon assets: keep the unchanged index.html favicon references.
    cleanup();
  });

  return cleanup;
}
