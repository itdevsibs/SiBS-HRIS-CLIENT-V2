// Portal-only session metadata. No JWT or HRIS authentication cache is stored here.
export const PORTAL_SESSION_KEY = 'sibsAssessmentPortalSession';
export const PORTAL_ACTIVITY_EVENTS = ['pointerdown', 'click', 'keydown', 'input', 'change', 'scroll', 'wheel', 'touchstart'];
export const PORTAL_ACTIVITY_THROTTLE_MS = 1000;
export const PORTAL_REFRESH_TIMEOUT_MS = 15000;

export function parsePortalSession(value) {
  if (!value || typeof value.sessionId !== 'string' || !value.sessionId) return null;
  const expiresAt = Number(value.expiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= 0) return null;
  return { sessionId: value.sessionId, expiresAt };
}
export function readPortalSession() {
  try { return parsePortalSession(JSON.parse(localStorage.getItem(PORTAL_SESSION_KEY))); }
  catch { return null; }
}
export function writePortalSession(session) {
  try { localStorage.setItem(PORTAL_SESSION_KEY, JSON.stringify(session)); } catch { /* Storage can be unavailable. */ }
}
export function clearPortalSession(sessionId) {
  try {
    if (readPortalSession()?.sessionId === sessionId) localStorage.removeItem(PORTAL_SESSION_KEY);
  } catch { /* Cookie remains authoritative. */ }
}
export function isPortalAuthFailure(error) {
  return [401, 403].includes(Number(error?.response?.status));
}
// Serialize cookie-changing operations across portal tabs where Web Locks is
// available. Never acquire the main HRIS session lock or touch its cookies.
export function withPortalSessionLock(operation) {
  return typeof navigator !== 'undefined' && navigator.locks?.request
    ? navigator.locks.request('sibs-assessment-portal-session', operation)
    : Promise.resolve().then(operation);
}
