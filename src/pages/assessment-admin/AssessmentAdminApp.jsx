import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle, Eye, EyeOff,
} from 'lucide-react';
import portalApi from '../../lib/assessment-admin/portalApi';
import portalSocket from '../../lib/assessment-admin/portalSocket';
import {
  PORTAL_SESSION_KEY, PORTAL_ACTIVITY_EVENTS, PORTAL_ACTIVITY_THROTTLE_MS,
  PORTAL_REFRESH_TIMEOUT_MS, parsePortalSession, readPortalSession,
  writePortalSession, clearPortalSession, isPortalAuthFailure, withPortalSessionLock,
} from '../../lib/assessment-admin/portalSession';
import { GradientWave } from '../../components/ui/gradient-wave';
import AssessmentAdminShell, { AssessmentAdminStartupFallback } from './AssessmentAdminShell';
import { writePortalHeader, clearPortalHeader } from '../../lib/assessment-admin/portalHeaderCache';
import PageFallback from '../../components/ui/PageFallback';
const ROOT = '/assessment-admin';
const PublicAssessmentApplicantsPage = lazy(() => import('../recruitment/PublicAssessmentApplicantsPage'));
const AssessmentAdminQuestionBankPage = lazy(() => import('./AssessmentAdminQuestionBankPage'));

const AssessmentAdminUsersPage = lazy(() => import('./AssessmentAdminUsersPage'));

// Keep the same skeleton DOM mounted from session verification through the
// lazy page import and first data request. Never mount a protected page while
// checking authentication, even if a cached display profile is present.
function AssessmentAdminContentLoading({ checking, children }) {
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);
  const pending = checking || !ready;
  return <>
    {pending && <PageFallback />}
    {!checking && <div hidden={pending} className={pending ? undefined : 'contents'}>
      <Suspense fallback={null}>{children(markReady)}</Suspense>
    </div>}
  </>;
}

function AdminLogin({ onLogin }) {
  // Use the same full-bleed animated login background as SiBS HRIS.
  useLayoutEffect(() => {
    document.documentElement.classList.add('sibs-login-full-bleed');
    return () => document.documentElement.classList.remove('sibs-login-full-bleed');
  }, []);

  const [sibsId, setSibsId] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const inputStyle = 'h-12 w-full rounded-lg border border-sibs-border bg-sibs-surface pl-3 pr-3 text-base text-sibs-navy transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sibs-orange disabled:opacity-70';

  const submit = async (event) => {
    event.preventDefault();
    if (working) return;
    if (!sibsId.trim() || !password) {
      setError('Enter your SiBS ID and password.');
      return;
    }
    setWorking(true);
    setError('');
    try {
      await withPortalSessionLock(async () => {
        const response = await portalApi.post('/api/assessment-portal/login', { sibsId: sibsId.trim(), password });
        const data = response.data?.data;
        if (!data?.user || !parsePortalSession(data)) throw new Error('Unable to validate your staff session.');
        setPassword('');
        onLogin(data);
      });
    } catch (failure) {
      setError(failure?.response?.data?.message || failure?.message || 'Unable to sign in.');
      setPassword('');
    } finally {
      setWorking(false);
    }
  };

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-sibs-auth-bg p-4 font-jakarta sm:p-6">
      <GradientWave />
      <section aria-label="SiBS Assessment Administration sign in" className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-sibs-navy p-5 shadow-2xl sm:p-8">
        <div className="mb-6 text-center">
          <img src="/SiBS_Login_Logo.svg" alt="SiBS HRIS" draggable={false}
            className="mx-auto block h-auto w-64 max-w-full select-none object-contain sm:w-72" />
          <p className="mt-2 text-xs font-semibold tracking-wide text-white/80">Assessment Administration</p>
        </div>
        {error && (
          <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-900">
            <AlertCircle aria-hidden="true" size={17} className="mt-0.5 shrink-0" />
            <p className="m-0 text-sm font-medium leading-5">{error}</p>
          </div>
        )}
        <form onSubmit={submit} noValidate className="space-y-4">
          <div>
            <label htmlFor="assessment-admin-sibs-id" className="mb-1.5 block text-sm font-semibold text-white">SIBS ID</label>
            <input id="assessment-admin-sibs-id" type="text" name="sibsId" autoComplete="username"
              autoCapitalize="none" spellCheck={false} required value={sibsId} disabled={working}
              onChange={event => { setSibsId(event.target.value); setError(''); }}
              className={inputStyle} />
          </div>
          <div>
            <label htmlFor="assessment-admin-password" className="mb-1.5 block text-sm font-semibold text-white">Password</label>
            <div className="relative">
              <input id="assessment-admin-password" type={visible ? 'text' : 'password'} name="password"
                autoComplete="current-password" required value={password} disabled={working}
                onChange={event => { setPassword(event.target.value); setError(''); }}
                className={`${inputStyle} pr-14`} />
              <button type="button" disabled={working} aria-label={visible ? 'Hide password' : 'Show password'}
                onClick={() => setVisible(value => !value)}
                className="absolute right-0.5 top-0.5 flex size-11 items-center justify-center rounded-md text-sibs-navy transition-colors hover:bg-sibs-canvas focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sibs-navy disabled:opacity-60">
                {visible ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </div>
          <button type="submit" disabled={working}
            className="mt-1 min-h-12 w-full rounded-lg bg-sibs-orange px-4 py-3 text-base font-extrabold text-white transition-colors hover:bg-sibs-button-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70">
            {working ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function AssessmentAdminApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const sessionRef = useRef(null);
  const timerRef = useRef(null);
  const refreshRef = useRef(null);
  const lastActivityRef = useRef(0);
  const signingOutRef = useRef(false);
  const expiryCheckRef = useRef(null);

  const stopTimer = useCallback(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);
  const endSession = useCallback(({ publish = true } = {}) => {
    const session = sessionRef.current;
    sessionRef.current = null;
    clearPortalHeader();
    stopTimer();
    if (publish && session) clearPortalSession(session.sessionId);
    portalSocket.disconnect();
    setUser(null);
    navigateRef.current(`${ROOT}/login`, { replace: true });
  }, [stopTimer]);
  const unauthorized = useCallback(() => {
    if (sessionRef.current && !signingOutRef.current) endSession();
  }, [endSession]);
  const scheduleExpiry = useCallback(() => {
    stopTimer();
    const session = sessionRef.current;
    if (!session || signingOutRef.current) return;
    const shared = readPortalSession();
    if (shared?.sessionId === session.sessionId && shared.expiresAt > session.expiresAt) {
      sessionRef.current = shared;
    }
    timerRef.current = window.setTimeout(() => expiryCheckRef.current?.(),
      Math.min(2147483647, Math.max(0, sessionRef.current.expiresAt - Date.now())));
  }, [stopTimer]);
  const validateExpiry = useCallback(async () => {
    const session = sessionRef.current;
    if (!session || signingOutRef.current) return false;
    const shared = readPortalSession();
    if (shared && shared.sessionId !== session.sessionId) {
      endSession({ publish: false });
      return false;
    }
    if (shared?.expiresAt > session.expiresAt) sessionRef.current = shared;
    if (sessionRef.current.expiresAt > Date.now()) { scheduleExpiry(); return true; }
    // Let a refresh that began before expiry finish, then recheck its deadline.
    if (refreshRef.current) {
      await refreshRef.current;
      if (sessionRef.current?.sessionId !== session.sessionId || signingOutRef.current) return false;
      const latest = readPortalSession();
      if (latest?.sessionId === session.sessionId && latest.expiresAt > sessionRef.current.expiresAt) sessionRef.current = latest;
      if (sessionRef.current.expiresAt > Date.now()) { scheduleExpiry(); return true; }
    }
    endSession();
    return false;
  }, [endSession, scheduleExpiry]);
  expiryCheckRef.current = validateExpiry;

  const acceptSession = useCallback((data) => {
    const session = parsePortalSession(data);
    if (!session || session.expiresAt <= Date.now() || !data?.user) return false;
    sessionRef.current = session;
    lastActivityRef.current = 0;
    writePortalSession(session);
    writePortalHeader(session, data.user);
    setUser(data.user);
    scheduleExpiry();
    return true;
  }, [scheduleExpiry]);

  const refreshFromActivity = useCallback(async (event) => {
    if (event?.isTrusted === false || signingOutRef.current || !sessionRef.current) return;
    const now = Date.now();
    if (now - lastActivityRef.current < PORTAL_ACTIVITY_THROTTLE_MS || refreshRef.current) return;
    lastActivityRef.current = now;
    if (!(await validateExpiry()) || refreshRef.current || signingOutRef.current) return;
    const sessionId = sessionRef.current?.sessionId;
    if (!sessionId) return;
    const promise = withPortalSessionLock(async () => {
      if (signingOutRef.current || sessionRef.current?.sessionId !== sessionId) return;
      const shared = readPortalSession();
      if (shared && shared.sessionId !== sessionId) { endSession({ publish: false }); return; }
      // Re-read the deadline after acquiring the cross-tab lock. Never renew an expired JWT.
      if (shared?.expiresAt > sessionRef.current.expiresAt) sessionRef.current = shared;
      if (sessionRef.current.expiresAt <= Date.now()) { endSession(); return; }
      try {
        const response = await portalApi.post('/api/assessment-portal/refresh', { reason: 'user-activity', sessionId },
          { timeout: PORTAL_REFRESH_TIMEOUT_MS });
        const next = parsePortalSession(response.data?.data);
        if (!next || next.sessionId !== sessionId || next.expiresAt <= Date.now()) throw new Error('Invalid session expiration.');
        if (sessionRef.current?.sessionId !== sessionId) return;
        sessionRef.current = next;
        writePortalSession(next);
        scheduleExpiry();
      } catch (error) {
        if (isPortalAuthFailure(error)) unauthorized();
        else { lastActivityRef.current = 0; }
      }
    });
    refreshRef.current = promise;
    try { await promise; }
    catch { lastActivityRef.current = 0; }
    finally { if (refreshRef.current === promise) refreshRef.current = null; }
  }, [endSession, scheduleExpiry, unauthorized, validateExpiry]);

  const logout = useCallback(async () => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    try {
      await refreshRef.current?.catch(() => {});
      await withPortalSessionLock(async () => {
        const shared = readPortalSession();
        if (shared && shared.sessionId !== sessionRef.current?.sessionId) {
          endSession({ publish: false }); return;
        }
        await portalApi.post('/api/assessment-portal/logout', {});
        endSession();
      });
    } catch {
      window.alert('Unable to sign out of the assessment portal. Check your network connection and try again.');
    } finally {
      signingOutRef.current = false;
      scheduleExpiry();
    }
  }, [endSession, scheduleExpiry]);

  useEffect(() => {
    let current = true;
    const interceptor = portalApi.interceptors.response.use(response => response, error => {
      const url = String(error?.config?.url || '');
      if (isPortalAuthFailure(error) && !/\/(login|logout|refresh|me)$/.test(url)) unauthorized();
      return Promise.reject(error);
    });
    // Skip the discarded first effect during React StrictMode's setup/cleanup replay.
    queueMicrotask(() => {
      if (!current) return;
      void portalApi.get('/api/assessment-portal/me').then(response => {
        if (current && !acceptSession(response.data?.data)) clearPortalHeader();
      }).catch(() => { if (current) { clearPortalHeader(); setUser(null); } }).finally(() => {
        if (current) setChecking(false);
      });
    });
    return () => { current = false; stopTimer(); portalApi.interceptors.response.eject(interceptor); };
  }, [acceptSession, stopTimer, unauthorized]);

  useEffect(() => {
    if (!user) return;
    const onFocus = () => { void validateExpiry(); };
    const onVisibility = () => { if (document.visibilityState === 'visible') onFocus(); };
    const onStorage = event => {
      if (event.key !== PORTAL_SESSION_KEY && event.key !== null) return;
      const session = sessionRef.current;
      if (!session) return;
      const shared = readPortalSession();
      if (!shared || shared.sessionId !== session.sessionId) { endSession({ publish: false }); return; }
      if (shared.expiresAt > session.expiresAt) sessionRef.current = shared;
      void validateExpiry();
    };
    PORTAL_ACTIVITY_EVENTS.forEach(name => window.addEventListener(name, refreshFromActivity, { passive: true }));
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisibility);
    scheduleExpiry();
    return () => {
      PORTAL_ACTIVITY_EVENTS.forEach(name => window.removeEventListener(name, refreshFromActivity));
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisibility);
      stopTimer();
    };
  }, [user, endSession, refreshFromActivity, scheduleExpiry, stopTimer, validateExpiry]);
  // Match HRIS navigation activity; background polling and clock ticks do not renew sessions.
  useEffect(() => { if (user) void refreshFromActivity(); }, [user, location.pathname, location.search, refreshFromActivity]);

  const isLogin = location.pathname.replace(/\/+$/, '') === `${ROOT}/login`;
  if (checking && isLogin) return <AssessmentAdminStartupFallback />;
  if (!checking && !user) return isLogin ? <AdminLogin onLogin={data => {
    if (acceptSession(data)) navigate(`${ROOT}/public-assessment`, { replace: true });
  }}/> : <Navigate to={`${ROOT}/login`} replace/>;
  if (!checking && isLogin) return <Navigate to={`${ROOT}/public-assessment`} replace/>;
  return (
    <AssessmentAdminShell checking={checking} user={user} logout={logout}>
      <AssessmentAdminContentLoading key={location.pathname} checking={checking}>
        {onInitialLoadSettled => <Routes>
          <Route path={`${ROOT}/dashboard`} element={<Navigate to={`${ROOT}/public-assessment`} replace/>}/>
          <Route path={`${ROOT}/public-assessment`} element={<PublicAssessmentApplicantsPage portalMode onUnauthorized={unauthorized} onInitialLoadSettled={onInitialLoadSettled}/>}/>
          <Route path={`${ROOT}/question-bank`} element={<AssessmentAdminQuestionBankPage onUnauthorized={unauthorized} onInitialLoadSettled={onInitialLoadSettled}/>}/>
          <Route path={`${ROOT}/users`} element={<AssessmentAdminUsersPage onUnauthorized={unauthorized} onInitialLoadSettled={onInitialLoadSettled}/>}/>
          <Route path="*" element={<Navigate to={`${ROOT}/public-assessment`} replace/>}/>
        </Routes>}
      </AssessmentAdminContentLoading>
    </AssessmentAdminShell>
  );
}
