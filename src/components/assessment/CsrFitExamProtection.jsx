import { useCallback, useEffect, useRef, useState } from 'react';
import { LockKeyhole, Monitor } from 'lucide-react';

// Fullscreen the document (not a question element), so portaled dropdowns and
// dialogs remain visible. A browser always retains control over leaving fullscreen.
// Only document-element fullscreen qualifies. macOS native window fullscreen
// is not the same as DOM fullscreen. Do not infer it from screen dimensions.
const isExamFullscreen = () => {
  const root = document.documentElement;
  const element = document.fullscreenElement || document.webkitFullscreenElement || document.webkitCurrentFullScreenElement;
  return element === root;
};
const fullscreenEvents = ['fullscreenchange', 'webkitfullscreenchange'];
const fullscreenErrorEvents = ['fullscreenerror', 'webkitfullscreenerror'];
const waitForFullscreen = async () => {
  // Older WebKit request methods return void before the transition finishes.
  for (let attempt = 0; attempt < 20 && !isExamFullscreen(); attempt += 1) {
    await new Promise(resolve => window.setTimeout(resolve, 100));
  }
  return isExamFullscreen();
};
const isForeground = () => document.visibilityState !== 'hidden' && document.hasFocus();
const isEditable = target => Boolean(target?.closest?.('input, textarea, [contenteditable="true"], [role="textbox"]'));
const inSimulation = target => Boolean(target?.closest?.('.swin-shell'));

export function useCsrFitExamProtection({ active, moduleNumber, record }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [interrupted, setInterrupted] = useState(false);
  const [message, setMessage] = useState('');
  const [requesting, setRequesting] = useState(false);
  const ownsFullscreen = useRef(false);
  const wasFullscreen = useRef(false);
  const mounted = useRef(false);
  const requestingRef = useRef(false);
  const activeRef = useRef(active);
  const reportRef = useRef(record);
  const moduleRef = useRef(moduleNumber);
  const lockedRef = useRef(false);
  const lastEvents = useRef(new Map());
  activeRef.current = active;
  reportRef.current = record;
  moduleRef.current = moduleNumber;
  const locked = active && (!fullscreen || interrupted || !isExamFullscreen());
  lockedRef.current = locked;

  const leaveFullscreen = useCallback(() => {
    if (!ownsFullscreen.current) return;
    ownsFullscreen.current = false;
    if (isExamFullscreen()) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen || document.webkitCancelFullScreen;
      try { if (exit) void Promise.resolve(exit.call(document)).catch(() => {}); } catch { /* Already exited. */ }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; leaveFullscreen(); };
  }, [leaveFullscreen]);

  // Call directly from a user gesture, before awaiting any server request.
  const enterFullscreen = useCallback(async () => {
    if (requestingRef.current) return false;
    requestingRef.current = true;
    setRequesting(true);
    setMessage('');
    try {
      if (!isExamFullscreen()) {
        const root = document.documentElement;
        const request = (document.fullscreenEnabled !== false && root.requestFullscreen) ||
          (document.webkitFullscreenEnabled !== false && (root.webkitRequestFullscreen || root.webkitRequestFullScreen));
        if (!request) {
          throw new Error('Fullscreen is not available in this browser. Use a supported desktop browser and allow fullscreen.');
        }
        await Promise.resolve(request.call(root));
        if (!await waitForFullscreen()) throw new Error('Fullscreen was not activated. Please try again.');
        ownsFullscreen.current = true;
      }
      if (!mounted.current) { leaveFullscreen(); return false; }
      const full = isExamFullscreen();
      const focused = isForeground();
      if (full) wasFullscreen.current = true;
      setFullscreen(full);
      const returning = activeRef.current && lockedRef.current && full && focused;
      lockedRef.current = !full || !focused;
      setInterrupted(!full || !focused);
      if (returning) reportRef.current?.('FULLSCREEN_RESUMED');
      if (!full || !focused) throw new Error('Return to the assessment window and enable fullscreen to continue.');
      return true;
    } catch (error) {
      if (mounted.current) {
        lockedRef.current = true;
        setFullscreen(isExamFullscreen());
        setInterrupted(true);
        setMessage(error?.name === 'TypeError' || error?.name === 'NotAllowedError'
          ? 'Fullscreen was blocked by your browser. Allow fullscreen and try again.'
          : error?.message || 'Unable to enter fullscreen. Please try again.');
      }
      return false;
    } finally {
      requestingRef.current = false;
      if (mounted.current) setRequesting(false);
    }
  }, [leaveFullscreen]);

  useEffect(() => {
    if (!active) { setInterrupted(false); return undefined; }
    lastEvents.current.clear();
    wasFullscreen.current = isExamFullscreen();
    // Progressive enhancement: capture only Escape, not the entire keyboard.
    // Permission may be denied, and a browser-controlled emergency exit remains.
    const keyboard = navigator.keyboard;
    let escapeLockRequested = false;
    const requestEscapeLock = () => {
      if (escapeLockRequested || !isExamFullscreen() || typeof keyboard?.lock !== 'function') return;
      escapeLockRequested = true;
      try {
        Promise.resolve(keyboard.lock(['Escape'])).catch(() => {
          // Continue with fullscreenchange enforcement when lock is unavailable.
        });
      } catch { /* Unsupported or denied; fullscreen exit is still monitored. */ }
    };
    const releaseEscapeLock = () => {
      if (!escapeLockRequested) return;
      escapeLockRequested = false;
      try { keyboard?.unlock?.(); } catch { /* Browser already released the lock. */ }
    };
    setFullscreen(wasFullscreen.current);
    if (!wasFullscreen.current || !isForeground()) setInterrupted(true);
    const report = (type, options) => {
      const now = Date.now();
      if (type !== 'FULLSCREEN_EXIT' && now - (lastEvents.current.get(type) || 0) < 1500) return;
      lastEvents.current.set(type, now);
      reportRef.current?.(type, options);
    };
    const interrupt = (type, options) => {
      lockedRef.current = true;
      setInterrupted(true);
      report(type, options);
    };
    const onFullscreen = () => {
      if (!activeRef.current) return;
      const full = isExamFullscreen();
      setFullscreen(full);
      if (full) requestEscapeLock();
      else {
        releaseEscapeLock();
        // Latch the interruption even if the browser missed its exit event.
        // Merely returning to fullscreen cannot clear this interruption.
        lockedRef.current = true;
        setInterrupted(true);
        if (wasFullscreen.current) interrupt('FULLSCREEN_EXIT');
      }
      wasFullscreen.current = full;
    };
    const onFullscreenError = () => { onFullscreen(); };
    const verifyAccess = () => {
      onFullscreen();
      if (!isForeground()) {
        lockedRef.current = true;
        setInterrupted(true);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') interrupt('TAB_HIDDEN', { keepalive: true });
      else report('TAB_VISIBLE');
      onFullscreen();
    };
    const onBlur = () => { interrupt('WINDOW_BLUR'); onFullscreen(); };
    const onFocus = () => { verifyAccess(); report('WINDOW_FOCUS'); };
    // macOS fullscreen animations and browser UI exits may not dispatch the
    // standard event. Resize/focus and polling are fallback checks, not proof
    // of fullscreen. Each interaction also verifies the live DOM state.
    const fullscreenWatchdog = window.setInterval(verifyAccess, 200);
    const onPageHide = () => { if (activeRef.current) report('PAGE_DEPARTURE', { keepalive: true }); };
    const onPageShow = event => { verifyAccess(); if (event.persisted) report('EXAM_VIEW_OPENED'); };
    // Defer initial view logging so Strict Mode's disposable effect cannot duplicate it.
    const initialReport = window.setTimeout(() => {
      const nav = performance.getEntriesByType?.('navigation')?.[0];
      report(nav?.type === 'reload' ? 'PAGE_RELOADED' : 'EXAM_VIEW_OPENED');
    },0);
    const block = (event, type) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      report(type);
    };
    const onClipboard = event => block(event, event.type === 'paste' ? 'PASTE_BLOCKED' : 'COPY_BLOCKED');
    const onContextMenu = event => {
      verifyAccess();
      // A virtual Windows context menu is a tested Module 4 skill. Suppress
      // the browser menu, but let its simulated event handler run.
      event.preventDefault();
      if (moduleRef.current === 4 && inSimulation(event.target) && !lockedRef.current) return;
      event.stopImmediatePropagation();
      report('CONTEXT_MENU_BLOCKED');
    };
    const onDrop = event => {
      verifyAccess();
      const types = Array.from(event.dataTransfer?.types || []);
      if (moduleRef.current === 4 && !lockedRef.current && inSimulation(event.target) && types.includes('application/x-sibs-virtual-file')) return;
      block(event, 'PASTE_BLOCKED');
    };
    const outsideProtection = event => {
      verifyAccess();
      return lockedRef.current && !event.target?.closest?.('[data-csr-fit-protection]');
    };
    const onLockedInteraction = event => {
      if (outsideProtection(event)) { event.preventDefault(); event.stopImmediatePropagation(); }
    };
    const onEscapeKey = event => {
      if (event.key !== 'Escape' && event.code !== 'Escape' && event.key !== 'Esc') return false;
      event.preventDefault();
      event.stopImmediatePropagation();
      return true;
    };
    const onKeyUp = event => { if (!onEscapeKey(event)) onLockedInteraction(event); else verifyAccess(); };
    const onKeyDown = event => {
      if (onEscapeKey(event)) { verifyAccess(); if (!event.repeat) report('ESCAPE_BLOCKED'); return; }
      if (outsideProtection(event)) {
        event.preventDefault(); event.stopImmediatePropagation();
        document.getElementById('csr-fit-resume-fullscreen')?.focus();
        return;
      }
      const key = event.key.toLowerCase();
      const modifier = event.ctrlKey || event.metaKey;
      const virtual = moduleRef.current === 4 && inSimulation(event.target) && !isEditable(event.target) && !lockedRef.current;
      // Allow only the virtual file-system's keyboard operations. A bubble
      // listener below still cancels browser default behavior.
      if (virtual && modifier && (key === 'x' || key === 'v' || (event.shiftKey && key === 'n'))) return;
      if ((modifier && ['c','x','v','insert'].includes(key)) || (event.shiftKey && ['insert','delete'].includes(key))) {
        block(event, key === 'v' || (event.shiftKey && key === 'insert') ? 'PASTE_BLOCKED' : 'COPY_BLOCKED');
        return;
      }
      // Best effort only; reserved browser/OS shortcuts may never reach JS.
      if ((modifier && ['t','n','w','l','r','tab','pageup','pagedown'].includes(key)) ||
          (event.altKey && ['arrowleft','arrowright','tab'].includes(key)) || key === 'f5') {
        event.preventDefault(); event.stopImmediatePropagation(); report('BROWSER_SHORTCUT_BLOCKED'); return;
      }
      if (lockedRef.current && event.key === 'Tab') {
        event.preventDefault(); document.getElementById('csr-fit-resume-fullscreen')?.focus();
      }
    };
    const onVirtualKeyDefault = event => {
      if (moduleRef.current === 4 && inSimulation(event.target) && !isEditable(event.target) && (event.ctrlKey || event.metaKey)) {
        const key = event.key.toLowerCase();
        if (key === 'x' || key === 'v' || (event.shiftKey && key === 'n')) event.preventDefault();
      }
    };
    const onFocusIn = event => {
      if (outsideProtection(event)) {
        document.getElementById('csr-fit-resume-fullscreen')?.focus();
      }
    };
    for (const type of fullscreenEvents) document.addEventListener(type, onFullscreen);
    for (const type of fullscreenErrorEvents) document.addEventListener(type, onFullscreenError);
    window.addEventListener('resize', verifyAccess);
    const interactionEvents = ['pointerdown', 'pointerup', 'click', 'dblclick', 'touchstart', 'touchend', 'beforeinput', 'input', 'change', 'submit', 'dragstart'];
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    for (const type of ['copy', 'cut', 'paste']) window.addEventListener(type, onClipboard, true);
    window.addEventListener('contextmenu', onContextMenu, true);
    window.addEventListener('drop', onDrop, true);
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    for (const type of interactionEvents) window.addEventListener(type, onLockedInteraction, { capture: true, passive: false });
    window.addEventListener('keydown', onVirtualKeyDefault);
    document.addEventListener('focusin', onFocusIn);
    // The start button may have entered fullscreen before the attempt became active.
    requestEscapeLock();
    return () => {
      for (const type of fullscreenEvents) document.removeEventListener(type, onFullscreen);
      for (const type of fullscreenErrorEvents) document.removeEventListener(type, onFullscreenError);
      window.removeEventListener('resize', verifyAccess);
      window.clearInterval(fullscreenWatchdog);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      window.clearTimeout(initialReport);
      for (const type of ['copy', 'cut', 'paste']) window.removeEventListener(type, onClipboard, true);
      window.removeEventListener('contextmenu', onContextMenu, true);
      window.removeEventListener('drop', onDrop, true);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      for (const type of interactionEvents) window.removeEventListener(type, onLockedInteraction, true);
      window.removeEventListener('keydown', onVirtualKeyDefault);
      document.removeEventListener('focusin', onFocusIn);
      releaseEscapeLock();
      leaveFullscreen();
    };
  }, [active, leaveFullscreen]);

  return { locked, enterFullscreen, leaveFullscreen, message, requesting };
}

export function CsrFitExamProtectionOverlay({ protection }) {
  const buttonRef = useRef(null);
  useEffect(() => { if (protection.locked) buttonRef.current?.focus(); }, [protection.locked]);
  if (!protection.locked) return null;
  return <div data-csr-fit-protection className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-sibs-navy p-5 font-jakarta text-sibs-navy">
    <section role="dialog" aria-modal="true" aria-labelledby="csr-fit-protection-title" aria-describedby="csr-fit-protection-description"
      className="w-full max-w-md rounded-2xl border border-sibs-border bg-white p-6 text-center shadow-2xl sm:p-8">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-sibs-orange"><LockKeyhole size={27}/></span>
      <h2 id="csr-fit-protection-title" className="mt-4 text-xl font-extrabold">Fullscreen required</h2>
      <p id="csr-fit-protection-description" className="mt-2 text-xs leading-6 text-sibs-secondary">Stay in the assessment window. Return to fullscreen to continue. Your original assessment timer keeps running and saved answers are retained.</p>
      {protection.message && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{protection.message}</p>}
      <button ref={buttonRef} id="csr-fit-resume-fullscreen" type="button" disabled={protection.requesting}
        onClick={()=>void protection.enterFullscreen()} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-sibs-orange px-4 text-xs font-extrabold text-white disabled:opacity-50">
        <Monitor size={16}/> {protection.requesting ? 'Entering fullscreen…' : 'Return to fullscreen'}
      </button>
      <p className="mt-3 text-[11px] text-sibs-muted">If fullscreen is unavailable, contact the SiBS Career Team.</p>
    </section>
  </div>;
}
