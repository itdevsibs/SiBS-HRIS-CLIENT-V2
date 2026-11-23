/**
 * Save public CSR-Fit assessment credentials for same-browser recovery.
 *
 * A first/last name and email address are NOT authentication. Resume requires a
 * previously issued bearer token already stored in this browser, then server
 * validation against the persisted applicant identity and attempt status.
 * Never send saved tokens in search/analytics or log them.
 */
const KEY = 'sibs:csr-fit:public:resume:v1';
const TOKEN_RE = /^[0-9a-f]{64}$/;
const MAX_ENTRIES = 5;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const normalized = value => String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
const normalizedEmail = value => normalized(value);
const identityFrom = source => ({
  firstName: normalized(source?.firstName),
  middleName: normalized(source?.middleName),
  lastName: normalized(source?.lastName),
  email: normalizedEmail(source?.email),
});

const sameIdentity = (a, b) => {
  const x = identityFrom(a), y = identityFrom(b);
  return Boolean(x.firstName && x.lastName && x.email) &&
    x.firstName === y.firstName && x.middleName === y.middleName &&
    x.lastName === y.lastName && x.email === y.email;
};

function readEntries() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed.filter(e => TOKEN_RE.test(String(e?.token || '')) &&
      e?.identity?.email && Number.isFinite(Number(e?.savedAt)) &&
      Number(e.savedAt) <= now && now - Number(e.savedAt) <= MAX_AGE_MS);
  } catch {
    return [];
  }
}

function writeEntries(entries) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
    return true;
  } catch {
    return false;
  }
}

export function rememberPublicCsrFitSession(token, person) {
  if (!TOKEN_RE.test(String(token || ''))) return false;
  const identity = identityFrom(person);
  if (!identity.firstName || !identity.lastName || !identity.email) return false;
  const existing = readEntries().filter(e => e.token !== token && e.identity.email !== identity.email);
  return writeEntries([{ token, identity, savedAt: Date.now() }, ...existing]);
}

export function getPublicCsrFitResumeSession(person) {
  const identity = identityFrom(person);
  if (!identity.firstName || !identity.lastName || !identity.email) return null;
  return readEntries().find(e => sameIdentity(e.identity, identity)) || null;
}

export function forgetPublicCsrFitResumeSession(token) {
  if (!TOKEN_RE.test(String(token || ''))) return;
  writeEntries(readEntries().filter(e => e.token !== token));
}

export function matchesPublicCsrFitIdentity(a, b) {
  return sameIdentity(a, b);
}
