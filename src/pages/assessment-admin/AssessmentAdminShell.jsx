import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ClipboardCheck, Menu, X, Clock, CalendarDays, ChevronLeft, BookOpen } from 'lucide-react';
import { createSystemDateTimeFormatter } from '../../lib/axios/dateFormatter';
import PageFallback from '../../components/ui/PageFallback';
import SibsAssessmentBrand from './SibsAssessmentBrand';
import AssessmentAdminUserProfile from './AssessmentAdminUserProfile';
import { readPortalHeader } from '../../lib/assessment-admin/portalHeaderCache';
import { PORTAL_SESSION_KEY, readPortalSession } from '../../lib/assessment-admin/portalSession';
import './AssessmentAdminShell.css';

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
  { title: 'Question Bank', path: `${ROOT}/question-bank`, icon: BookOpen },
];

export default function AssessmentAdminShell({ children, user = null, logout, checking = false }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [cachedHeader, setCachedHeader] = useState(() => checking ? readPortalHeader() : null);
  useEffect(() => {
    if (!checking) { setCachedHeader(null); return; }
    const sync = () => setCachedHeader(readPortalHeader());
    const onStorage = event => { if (event.key === PORTAL_SESSION_KEY || event.key === null) sync(); };
    sync();
    window.addEventListener('storage', onStorage);
    // Also hide expired cached identity if a slow session check crosses expiry.
    const timer = window.setInterval(sync, 1000);
    return () => { window.removeEventListener('storage', onStorage); window.clearInterval(timer); };
  }, [checking]);
  const headerUser = checking ? cachedHeader : user;
  const headerSessionId = readPortalSession()?.sessionId || "";
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
      <aside inert={checking || undefined} className={`fixed inset-y-0 left-0 z-[80] flex h-dvh flex-col border-r border-sibs-tertiary-2 bg-sibs-primary-1 text-white shadow-xl transition-[width,transform] duration-300 ${collapsed ? 'lg:w-[84px] 2xl:lg:w-[90px]' : 'lg:w-[245px] 2xl:lg:w-[260px]'} w-[245px] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
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
        <header inert={checking || undefined} className="sibs-dashboard-header font-jakarta">
          <div className="sibs-dashboard-header-inner">
            <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sibs-tertiary-2 bg-sibs-primary-1 text-white shadow-xs lg:hidden">
              <Menu size={18}/>
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-heading text-lg font-bold text-sibs-navy">{NAV.find(item=>item.path===location.pathname)?.title || 'Public Assessment'}</h1>
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
            {headerUser ? (
              <AssessmentAdminUserProfile key={`${headerSessionId}:${headerUser.sibsId}`} user={headerUser} logout={logout} displayOnly={checking} />
            ) : checking ? (
              <div className="relative z-[9999] min-w-0 shrink-0" aria-label="Loading user profile">
                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 sm:hidden" />
                <div className="hidden h-10 w-52 animate-pulse rounded bg-gray-200 sm:block" />
              </div>
            ) : null}

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
        <main className="assessment-admin-content min-w-0 bg-sibs-tertiary-10 px-4 py-5 sm:px-6 lg:px-7">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Only layout chrome and a session-bound display cache are mounted before verification. */
export function AssessmentAdminStartupFallback() {
  const { pathname } = useLocation();
  // Login has no authenticated navigation; never mount the staff shell there.
  if (pathname.replace(/\/+$/, '') === `${ROOT}/login`) {
    return <div className="min-h-dvh w-full bg-sibs-tertiary-10"><PageFallback /></div>;
  }
  return (
    <AssessmentAdminShell checking>
      <PageFallback />
    </AssessmentAdminShell>
  );
}
