// Ephemeral, tab-local visual event. It is never an authorization signal.
export const LOGIN_ENTRANCE_EVENT = "sibs:login:entrance";
export const LOGIN_ENTRANCE_DURATION_MS = 1450;
const LOGOUT_START_EVENT = "sibs-auth-logout-start";

export function announceSuccessfulLogin(target = window) {
  target.dispatchEvent(new Event(LOGIN_ENTRANCE_EVENT));
}

export function subscribeToLoginEntrance(onChange, target = window) {
  let timer = null;
  let sequence = 0;
  const motion = target.matchMedia?.("(prefers-reduced-motion: reduce)");

  function clearTimer() {
    if (timer !== null) target.clearTimeout(timer);
    timer = null;
  }

  function stop() {
    clearTimer();
    onChange(null);
  }

  function start() {
    clearTimer();
    if (motion?.matches) {
      onChange(null);
      return;
    }
    onChange(++sequence);
    timer = target.setTimeout(stop, LOGIN_ENTRANCE_DURATION_MS);
  }

  function onMotionChange(event) {
    if (event.matches) stop();
  }

  target.addEventListener(LOGIN_ENTRANCE_EVENT, start);
  target.addEventListener(LOGOUT_START_EVENT, stop);
  motion?.addEventListener?.("change", onMotionChange);
  return () => {
    clearTimer();
    target.removeEventListener(LOGIN_ENTRANCE_EVENT, start);
    target.removeEventListener(LOGOUT_START_EVENT, stop);
    motion?.removeEventListener?.("change", onMotionChange);
  };
}
