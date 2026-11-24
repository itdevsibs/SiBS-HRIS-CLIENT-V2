import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  ClipboardCheck, Menu, X, Clock, CalendarDays, AlertCircle,
  Eye, EyeOff, ChevronLeft,
} from 'lucide-react';
import portalApi from '../../lib/assessment-admin/portalApi';
import { createSystemDateTimeFormatter } from '../../lib/axios/dateFormatter';
import portalSocket from '../../lib/assessment-admin/portalSocket';
import PublicAssessmentApplicantsPage from '../recruitment/PublicAssessmentApplicantsPage';
import { GradientWave } from '../../components/ui/gradient-wave';
import SibsAssessmentBrand from './SibsAssessmentBrand';
import AssessmentAdminUserProfile from './AssessmentAdminUserProfile';

const ROOT = '/assessment-admin';
// Use the same locale, time zone and typography as the authenticated HRIS header.
const dateFormatter = createSystemDateTimeFormatter('en-PH', {
  timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
});
const mobileDateFormatter = createSystemDateTimeFormatter('en-PH', {
  timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric',
});
const timeFormatter = createSystemDateTimeFormatter('en-PH', {
  timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
});
const NAV = [
  { title: 'Public Assessment', path: `${ROOT}/public-assessment`, icon: ClipboardCheck },
];

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
      const response = await portalApi.post('/api/assessment-portal/login', { sibsId: sibsId.trim(), password });
      const user = response.data?.data?.user;
      if (!user) throw new Error('Unable to validate your staff account.');
      setPassword('');
      onLogin(user);
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

function Shell({ user, logout, onUnauthorized }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const dateDisplay = dateFormatter.format(now);
  const mobileDateDisplay = mobileDateFormatter.format(now);
  const timeDisplay = timeFormatter.format(now);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    const keydown = event => { if (event.key === 'Escape') setSidebarOpen(false); };
    document.addEventListener('keydown', keydown);
    return () => document.removeEventListener('keydown', keydown);
  }, []);

  return (
    <div className="min-h-dvh bg-sibs-tertiary-10 font-jakarta text-sibs-navy">
      <aside className={`fixed inset-y-0 left-0 z-[80] flex h-dvh flex-col border-r border-sibs-tertiary-2 bg-sibs-primary-1 text-white shadow-xl transition-[width,transform] duration-300 ${collapsed ? 'lg:w-[84px] 2xl:lg:w-[90px]' : 'lg:w-[245px] 2xl:lg:w-[260px]'} w-[245px] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className={`relative flex h-[74px] min-h-[74px] shrink-0 items-center border-b border-sibs-tertiary-2 transition-all duration-300 2xl:h-[86px] 2xl:min-h-[86px] ${collapsed ? 'lg:justify-center lg:px-0' : 'justify-between px-3.5 py-3 2xl:px-4'}`}>
          {collapsed ? (
            <button type="button" aria-label="Expand sidebar" title="Expand sidebar"
              onClick={() => setCollapsed(false)}
              className="hidden items-center justify-center rounded-lg p-1 text-slate-300 transition hover:bg-sibs-tertiary-2 hover:text-white focus-visible:outline-2 focus-visible:outline-sibs-orange lg:flex">
              <SibsAssessmentBrand collapsed isMobile={false}/>
            </button>
          ) : null}
          <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
            <SibsAssessmentBrand collapsed={false} isMobile={sidebarOpen}/>
          </div>
          <button type="button" className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-sibs-tertiary-2 hover:text-white active:scale-[0.98] lg:flex"
            aria-label="Collapse sidebar" title="Collapse sidebar" onClick={() => setCollapsed(true)} style={collapsed ? { display: 'none' } : undefined}>
            <ChevronLeft size={16} strokeWidth={2.2}/>
          </button>
          <button type="button" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-sibs-tertiary-2 hover:text-white active:scale-[0.98] lg:hidden"
            aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}><X size={18}/></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-4">
          <p className={`mb-3 px-2.5 font-heading text-xs font-bold uppercase tracking-wider text-slate-400 ${collapsed ? 'lg:hidden' : ''}`}>Core HR</p>
          <nav aria-label="Public Assessment Administration" className="space-y-1">
            {NAV.map(item => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path} title={collapsed ? item.title : undefined}
                  aria-current={active ? 'page' : undefined} onClick={() => setSidebarOpen(false)}
                  className={`group relative flex select-none items-center rounded-xl font-semibold transition-all duration-300 ${collapsed ? 'lg:mx-auto lg:h-10 lg:w-10 lg:justify-center lg:gap-0 lg:p-0' : 'w-full gap-2.5 px-3 py-2 2xl:py-2.5'} ${active ? 'bg-sibs-primary-2 font-bold text-white shadow-md shadow-sibs-primary-2/20' : 'text-slate-300 hover:bg-sibs-tertiary-2 hover:text-white'}`}>
                  <Icon size={19} strokeWidth={1.9} className={`shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-sibs-orange'}`}/>
                  <span className={`sibs-text-xs ${collapsed ? 'lg:hidden' : ''}`}>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      {sidebarOpen && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-[75] bg-black/50 backdrop-blur-xs lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className={`min-h-dvh transition-[padding] duration-300 ${collapsed ? 'lg:pl-[84px] 2xl:lg:pl-[90px]' : 'lg:pl-[245px] 2xl:lg:pl-[260px]'}`}>
        <header className="sibs-dashboard-header font-jakarta">
          <div className="sibs-dashboard-header-inner">
            <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sibs-tertiary-2 bg-sibs-primary-1 text-white shadow-xs lg:hidden">
              <Menu size={18}/>
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-heading text-lg font-bold text-sibs-navy">Public Assessment</h1>
              <p className="truncate text-[10px] font-medium text-sibs-muted">Administration</p>
            </div>
            <div
              className="hidden min-w-0 shrink-0 items-center gap-2 rounded-xl border border-sibs-border-subtle bg-white px-3 py-1.5 font-jakarta sm:flex"
              aria-label="Current Philippine date and time"
              title="Philippine Standard Time (UTC+8)"
            >
              <Clock className="h-4 w-4 shrink-0 text-sibs-orange" aria-hidden="true" />
              <div className="flex min-w-0 flex-col leading-tight text-left">
                <span className="whitespace-nowrap text-[10px] font-semibold text-sibs-muted">{dateDisplay}</span>
                <span className="whitespace-nowrap text-[12px] font-extrabold tabular-nums text-sibs-navy">
                  <time>{timeDisplay}</time>
                  <span className="ml-1.5 text-[9px] font-bold text-sibs-muted">PHT</span>
                </span>
              </div>
            </div>
            {/* Same slim separator used between HRIS header actions and the profile. */}
            <div aria-hidden="true" className="hidden h-5 w-px bg-sibs-border-subtle sm:block 2xl:h-6" />
            <AssessmentAdminUserProfile user={user} logout={logout}/>

          </div>
          <div className="flex w-full min-w-0 shrink-0 items-center gap-1.5 border-t border-sibs-border-subtle/70 pt-1.5 pb-1 font-jakarta sm:hidden" aria-label="Current Philippine date and time">
            <div className="flex shrink-0 items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-sibs-orange" aria-hidden="true" />
              <span className="whitespace-nowrap text-[10.5px] font-semibold text-sibs-muted">{mobileDateDisplay}</span>
            </div>
            <span className="select-none text-[11px] text-sibs-border-subtle" aria-hidden="true">•</span>
            <div className="flex shrink-0 items-center gap-1">
              <Clock className="h-3.5 w-3.5 shrink-0 text-sibs-orange" aria-hidden="true" />
              <time className="whitespace-nowrap text-[12px] font-extrabold tabular-nums text-sibs-navy">{timeDisplay}</time>
              <span className="rounded border border-sibs-border-subtle bg-white px-1 py-0.5 text-[8.5px] font-extrabold leading-none text-sibs-muted">PHT</span>
            </div>
          </div>
        </header>
        <main className="min-w-0 bg-sibs-tertiary-10 px-4 py-5 sm:px-6 lg:px-7">
          <Routes>
            <Route path={`${ROOT}/dashboard`} element={<Navigate to={`${ROOT}/public-assessment`} replace/>}/>
            <Route path={`${ROOT}/public-assessment`} element={<PublicAssessmentApplicantsPage portalMode onUnauthorized={onUnauthorized}/>}/>
            <Route path="*" element={<Navigate to={`${ROOT}/public-assessment`} replace/>}/>
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function AssessmentAdminApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const logout = useCallback(async () => {
    try {
      await portalApi.post('/api/assessment-portal/logout', {});
    } catch {
      window.alert('Unable to sign out of the assessment portal. Check your network connection and try again.');
      return;
    }
    portalSocket.disconnect();
    setUser(null);
    navigate(`${ROOT}/login`, { replace: true });
  }, [navigate]);
  const unauthorized = useCallback(() => {
    portalSocket.disconnect();
    setUser(null);
    navigate(`${ROOT}/login`, { replace: true });
  }, [navigate]);
  useEffect(() => {
    let current = true;
    void portalApi.get('/api/assessment-portal/me').then(response => {
      if (current) setUser(response.data?.data?.user || null);
    }).catch(() => { if (current) setUser(null); }).finally(() => {
      if (current) setChecking(false);
    });
    return () => { current = false; };
  }, []);
  if (checking) return <div className="flex min-h-dvh items-center justify-center bg-[#f2f6fb] text-sm font-semibold text-[#092e52]">Checking assessment portal access…</div>;
  if (!user) return location.pathname === `${ROOT}/login` ? <AdminLogin onLogin={next => {
    setUser(next);
    navigate(`${ROOT}/public-assessment`, { replace: true });
  }}/> : <Navigate to={`${ROOT}/login`} replace/>;
  if (location.pathname === `${ROOT}/login`) return <Navigate to={`${ROOT}/public-assessment`} replace/>;
  return <Shell user={user} logout={logout} onUnauthorized={unauthorized}/>;
}
