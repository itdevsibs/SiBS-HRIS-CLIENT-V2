// Presentation only. Never use this cache for authentication, roles or API access.
// Store only the portal header identity in this tab, bound to a portal session ID.
import { readPortalSession } from './portalSession.js';

export const PORTAL_HEADER_KEY = 'sibsAssessmentPortalHeader';
const PORTAL_PHOTO_KEY = 'sibsAssessmentPortalHeaderPhoto';
const MAX_PHOTO_LENGTH = 220000;
const validPhoto = value => typeof value === 'string' && value.length <= MAX_PHOTO_LENGTH && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
const fields = ['sibsId', 'firstName', 'middleName', 'lastName', 'email'];
function displayUser(user) {
  if (!user || typeof user !== 'object') return null;
  const result = Object.fromEntries(fields.map(key => [key, typeof user[key] === 'string' || typeof user[key] === 'number' ? String(user[key]).trim() : '']));
  return result.sibsId ? result : null;
}
export function readPortalHeader(now = Date.now()) {
  try {
    const session = readPortalSession();
    const cached = JSON.parse(sessionStorage.getItem(PORTAL_HEADER_KEY));
    if (!session || session.expiresAt <= now || !cached || cached.sessionId !== session.sessionId) {
      clearPortalHeader();
      return null;
    }
    return displayUser(cached.user);
  } catch { clearPortalHeader(); return null; }
}
export function writePortalHeader(session, user) {
  try {
    const shared = readPortalSession();
    const safe = displayUser(user);
    if (!shared || !session || shared.sessionId !== session.sessionId || shared.expiresAt <= Date.now() || !safe) {
      clearPortalHeader(); return;
    }
    const previous = readPortalHeader();
    if (previous?.sibsId !== safe.sibsId) clearPortalPhoto();
    sessionStorage.setItem(PORTAL_HEADER_KEY, JSON.stringify({ sessionId: session.sessionId, user: safe }));
  } catch { clearPortalHeader(); }
}
// A small display thumbnail only; the private photo endpoint remains no-store.
// Bind the thumbnail to both portal session and employee, never to HRIS cookies.
function photoScope(sibsId, expectedSessionId) {
  const session = readPortalSession();
  const user = readPortalHeader();
  if (!session || session.expiresAt <= Date.now() || user?.sibsId !== String(sibsId || '') ||
      (expectedSessionId && session.sessionId !== expectedSessionId)) return null;
  return session.sessionId;
}
export function readPortalPhoto(sibsId, expectedSessionId) {
  try {
    const sessionId = photoScope(sibsId, expectedSessionId);
    const cached = JSON.parse(sessionStorage.getItem(PORTAL_PHOTO_KEY));
    return sessionId && cached?.sessionId === sessionId && cached?.sibsId === String(sibsId) && validPhoto(cached.src) ? cached.src : '';
  } catch { return ''; }
}
export function writePortalPhoto(sibsId, expectedSessionId, src) {
  try {
    const sessionId = photoScope(sibsId, expectedSessionId);
    if (!sessionId || !expectedSessionId || !validPhoto(src)) return false;
    sessionStorage.setItem(PORTAL_PHOTO_KEY, JSON.stringify({ sessionId, sibsId: String(sibsId), src }));
    return true;
  } catch { return false; }
}
export function clearPortalPhoto() {
  try { sessionStorage.removeItem(PORTAL_PHOTO_KEY); } catch { /* storage unavailable */ }
}
export function clearPortalHeader() {
  clearPortalPhoto();
  try { sessionStorage.removeItem(PORTAL_HEADER_KEY); } catch { /* storage unavailable */ }
}
