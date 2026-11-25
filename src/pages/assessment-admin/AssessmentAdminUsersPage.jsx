import { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Users, Clock3, CheckCircle2, HelpCircle, MapPin, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import portalApi from '../../lib/assessment-admin/portalApi';
import portalSocket from '../../lib/assessment-admin/portalSocket';
import PageFallback from '../../components/ui/PageFallback';
import PageHeaderHero from '../../components/ui/PageHeaderHero';
import SearchInput from '../../components/ui/SearchInput';
import SelectDropdown from '../../components/ui/SelectDropdown';
import StatusFilterTabs from '../../components/ui/StatusFilterTabs';
import TablePagination from '../../components/ui/TablePagination';
import DirectoryAvatarCircle from '../../components/ui/DirectoryAvatarCircle';

const PAGE_SIZE = 15;
// Match AttendanceTable: socket invalidations first, 5s without a subscription,
// and a slower safety check for tracker changes outside the observer snapshot.
const ATTENDANCE_LIVE_REFRESH_MS = 5_000;
const ATTENDANCE_SOCKET_FALLBACK_MS = 30_000;
const DUTY_FRESHNESS_MS = 75_000;
// Compare server timestamps only with other server timestamps. Elapsed client
// time is monotonic; a workstation/server wall-clock difference is irrelevant.
function dutyAgeAtReceipt(result) {
  const checkedAt = Date.parse(result.checkedAt);
  const serverTime = Date.parse(result.serverTime);
  if (!Number.isFinite(checkedAt)) throw new Error('Invalid attendance verification timestamp.');
  // Older server releases generate checkedAt immediately before returning the
  // roster. The cache-busting request also supports those releases.
  if (result.serverTime == null) return 0;
  if (!Number.isFinite(serverTime) || serverTime < checkedAt) return Infinity;
  return serverTime - checkedAt;
}
function isDutyStale(data, now) {
  return Boolean(data && data.ageAtReceiptMs + Math.max(0, now - data.receivedAtMs) > DUTY_FRESHNESS_MS);
}
const ROLES = ['HR Admin', 'HR', 'Talent Acquisition', 'Super Admin'];
// Display ordering only; the server remains responsible for access permissions.
const accessOrder = role => {
  const index = ROLES.indexOf(role === 'TA' ? 'Talent Acquisition' : role);
  return index === -1 ? ROLES.length : index;
};
const compareAccessRows = (a, b) => accessOrder(a.access) - accessOrder(b.access);
const EMPTY = { total: 0, onDuty: 0, offDuty: 0, unavailable: 0 };
const statusOf = row => row.dutyStatus === 'CLOCKED_IN' ? 'ON_DUTY' : ['CLOCKED_OUT','NO_CLOCK_IN'].includes(row.dutyStatus) ? 'OFF_DUTY' : 'UNAVAILABLE';
const cell = 'border-b border-sibs-border px-3 py-2 align-middle 2xl:px-4 2xl:py-2.5';
function DutyBadge({ row }) {
  const status = statusOf(row);
  const [label, tone, detail] = status === 'ON_DUTY'
    ? ['On duty', 'border-emerald-200 bg-emerald-50 text-emerald-800', 'Clocked in']
    : status === 'OFF_DUTY' ? ['Off duty', 'border-slate-200 bg-slate-50 text-slate-600', row.dutyStatus === 'CLOCKED_OUT' ? 'Clocked out' : 'No clock-in recorded']
    : ['Unavailable', 'border-amber-200 bg-amber-50 text-amber-800', 'Duty could not be verified'];
  return <div className="flex flex-col items-start gap-1 sm:items-center">
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 sibs-text-micro font-bold ${tone}`}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{label}</span>
    <span className="sibs-text-micro text-sibs-muted">{detail}</span>
  </div>;
}
// Share one authenticated blob per visible staff member between desktop and
// mobile layouts. Duty refreshes do not change this key or restart photos.
function useDirectoryPhotos(rows) {
  const signature = JSON.stringify(rows.filter(row => row.photoVersion)
    .map(row => [String(row.sibsId), row.photoVersion]).sort((a,b) => a[0].localeCompare(b[0])));
  const [photos, setPhotos] = useState({});
  useEffect(() => {
    const entries = JSON.parse(signature);
    const controller = new AbortController();
    const urls = new Set();
    let active = true;
    setPhotos({});
    // Avoid starting requests on the discarded Strict Mode effect.
    queueMicrotask(() => {
      if (!active) return;
      for (const [id, version] of entries) {
        const key = JSON.stringify([id, version]);
        portalApi.get(`/api/assessment-portal/users/${encodeURIComponent(id)}/profile-photo`, {
          responseType: 'blob', signal: controller.signal,
        }).then(({ data }) => {
          if (!active || !data?.size || !/^image\/(jpeg|png|webp|gif)$/i.test(data.type)) return;
          const url = URL.createObjectURL(data);
          urls.add(url);
          setPhotos(previous => ({ ...previous, [key]: url }));
        }).catch(() => { /* A missing or unavailable photo keeps the initials. */ });
      }
    });
    return () => {
      active = false;
      controller.abort();
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [signature]);
  return photos;
}
function getAvatarPreviewPosition(anchor) {
  if (!anchor || typeof window === 'undefined' || !anchor.getClientRects().length) return null;
  const rect = anchor.getBoundingClientRect();
  const size = 178, gap = 12, inset = 8;
  const left = Math.max(inset + size / 2, Math.min(rect.left + rect.width / 2, window.innerWidth - inset - size / 2));
  const placeBelow = rect.top < size + gap;
  return { left, top: placeBelow ? rect.bottom + gap : rect.top - gap, placeBelow };
}
function AssessmentUserAvatar({ row, photoUrl }) {
  const anchor = useRef(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [position, setPosition] = useState(null);
  const [failedUrl, setFailedUrl] = useState('');
  const show = () => { setPosition(getAvatarPreviewPosition(anchor.current)); setPreviewVisible(true); };
  const hide = () => setPreviewVisible(false);
  useEffect(() => {
    if (!previewVisible) return;
    const update = () => setPosition(getAvatarPreviewPosition(anchor.current));
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [previewVisible]);
  const picture = () => photoUrl && failedUrl !== photoUrl ? <img src={photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" onError={() => setFailedUrl(photoUrl)}/> : null;
  return <>
    <span ref={anchor} className="relative inline-flex shrink-0 outline-none" tabIndex={0}
      aria-label={`${row.name || 'Employee'} profile picture`} onMouseEnter={show} onMouseLeave={hide}
      onFocus={show} onBlur={hide} onKeyDown={event => { if (event.key === 'Escape') hide(); }}>
      <DirectoryAvatarCircle name={row.name} initials={row.initials}>{picture()}</DirectoryAvatarCircle>
    </span>
    {previewVisible && position && typeof document !== 'undefined' ? createPortal(
      <span className="employee-avatar-preview pointer-events-none fixed z-[9999] rounded-2xl border border-sibs-border bg-white p-2 shadow-[0_18px_45px_rgba(4,44,81,0.22)]"
        style={{ left: position.left, top: position.top, transform: position.placeBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)' }} aria-hidden="true">
        <DirectoryAvatarCircle name={row.name} initials={row.initials} size="preview">{picture()}</DirectoryAvatarCircle>
      </span>, document.body) : null}
  </>;
}
function Identity({ row, photoUrl }) {
  return <div className="flex min-w-0 items-center gap-2.5">
    <AssessmentUserAvatar row={row} photoUrl={photoUrl}/>
    <div className="min-w-0"><p className="break-words sibs-text-xs font-extrabold leading-tight text-sibs-navy transition-colors group-hover:text-sibs-orange">{row.name}</p>
      {row.email && <p className="mt-1 break-all sibs-text-micro font-medium text-sibs-muted">{row.email}</p>}</div>
  </div>;
}
export default function AssessmentAdminUsersPage({ onUnauthorized, onInitialLoadSettled }) {
  const [data, setData] = useState(null);
  const [settled, setSettled] = useState(false);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(performance.now()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    let active = true, pending = false, queued = false;
    let subscriptionConfirmed = false, hasConnectedOnce = portalSocket.connected;
    let lastFallbackCheck = Date.now(), eventVerificationTimer = null;
    const controller = new AbortController();
    const load = async (queueIfPending = false) => {
      if (!active || document.visibilityState === 'hidden') return;
      if (pending) { if (queueIfPending) queued = true; return; }
      pending = true;
      try {
        const response = await portalApi.get('/api/assessment-portal/users', { timeout: 90000, signal: controller.signal, params: { _fresh: Date.now() } });
        const result = response.data?.data;
        if (!Array.isArray(result?.items) || !result?.summary || !result.checkedAt) throw new Error('Invalid staff directory response.');
        const ageAtReceiptMs = dutyAgeAtReceipt(result);
        const receivedAtMs = performance.now();
        if (active) { setNow(receivedAtMs); setData({ ...result, ageAtReceiptMs, receivedAtMs }); setError(''); }
      } catch (cause) {
        if (!active) return;
        if ([401,403].includes(Number(cause?.response?.status))) onUnauthorized?.();
        setError(cause?.response?.data?.message || 'Unable to verify assessment users and duty status.');
        // Do not display a previously authorized roster or stale duty as current.
        setData(null);
      } finally {
        pending = false;
        if (active) {
          setSettled(true);
          if (queued) { queued = false; void load(); }
        }
      }
    };
    const handleAttendanceEvent = () => {
      if (!active || document.visibilityState === 'hidden') return;
      lastFallbackCheck = Date.now();
      void load(true);
      // An event can arrive just before a short server-side duty cache expires.
      // Coalesce a trailing verification so that such a change is not missed.
      if (eventVerificationTimer === null) {
        eventVerificationTimer = window.setTimeout(() => {
          eventVerificationTimer = null;
          lastFallbackCheck = Date.now();
          void load(true);
        }, ATTENDANCE_LIVE_REFRESH_MS);
      }
    };
    const subscribe = () => {
      subscriptionConfirmed = false;
      portalSocket.emit('attendance:subscribe', reply => {
        if (active && portalSocket.connected) subscriptionConfirmed = reply?.subscribed === true;
      });
      if (hasConnectedOnce) handleAttendanceEvent();
      hasConnectedOnce = true;
    };
    const disconnected = () => { subscriptionConfirmed = false; };
    // Defer startup to avoid duplicate initial requests on Strict Mode remount.
    queueMicrotask(() => {
      if (!active) return;
      void load();
      portalSocket.on('attendance:changed', handleAttendanceEvent);
      portalSocket.on('attendance-updated', handleAttendanceEvent);
      portalSocket.on('connect', subscribe);
      portalSocket.on('disconnect', disconnected);
      if (portalSocket.connected) subscribe(); else portalSocket.connect();
    });
    const timer = window.setInterval(() => {
      if (!active || document.visibilityState === 'hidden') return;
      const time = Date.now();
      const delay = portalSocket.connected && subscriptionConfirmed
        ? ATTENDANCE_SOCKET_FALLBACK_MS : ATTENDANCE_LIVE_REFRESH_MS;
      if (time - lastFallbackCheck < delay) return;
      lastFallbackCheck = time;
      void load();
    }, ATTENDANCE_LIVE_REFRESH_MS);
    const visible = () => {
      if (document.visibilityState === 'visible') {
        setNow(performance.now());
        lastFallbackCheck = Date.now();
        void load(true);
      }
    };
    document.addEventListener('visibilitychange', visible);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(timer);
      if (eventVerificationTimer !== null) window.clearTimeout(eventVerificationTimer);
      document.removeEventListener('visibilitychange', visible);
      portalSocket.off('attendance:changed', handleAttendanceEvent);
      portalSocket.off('attendance-updated', handleAttendanceEvent);
      portalSocket.off('connect', subscribe);
      portalSocket.off('disconnect', disconnected);
      if (portalSocket.connected) portalSocket.emit('attendance:unsubscribe');
      // The portal socket is shared with Public Assessment; do not disconnect it.
    };
  }, [onUnauthorized, retry]);
  useEffect(() => { if (settled) onInitialLoadSettled?.(); }, [settled, onInitialLoadSettled]);
  const stale = isDutyStale(data, now);
  const rows = useMemo(() => (data?.items || []).map(row => stale ? {...row, dutyStatus: 'UNAVAILABLE'} : row), [data, stale]);
  const summary = stale ? { total: rows.length, onDuty: 0, offDuty: 0, unavailable: rows.length } : data?.summary || EMPTY;
  const scoped = useMemo(() => rows.filter(row => (!role || row.access === role) && (!query || [row.name,row.sibsId,row.email].some(value=>String(value || '').toLowerCase().includes(query.toLowerCase())))), [rows,role,query]);
  // Stable sort preserves the existing duty/name order within each access role.
  const filtered = scoped.filter(row => status === 'ALL' || statusOf(row) === status).sort(compareAccessRows);
  const pages = Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const currentPage = Math.min(page,pages);
  const visible = filtered.slice((currentPage-1)*PAGE_SIZE,currentPage*PAGE_SIZE);
  const photos = useDirectoryPhotos(visible);
  const photoFor = row => photos[JSON.stringify([String(row.sibsId), row.photoVersion])];
  const tabs = [ ['ALL','All',Users], ['ON_DUTY','On duty',CheckCircle2], ['OFF_DUTY','Off duty',Clock3], ['UNAVAILABLE','Unavailable',HelpCircle] ].map(([value,label,icon])=>({ value,label,icon,count:scoped.filter(row=>value==='ALL'||statusOf(row)===value).length }));
  if (!settled) return onInitialLoadSettled ? null : <PageFallback/>;
  return <div className="space-y-4 font-jakarta">
    <PageHeaderHero kicker="Assessment Administration" title="Assessment Users" description="Review staff with Assessment Administration access and their verified current duty status."/>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[[Users,'Authorized users','total'],[CheckCircle2,'On duty','onDuty'],[Clock3,'Off duty','offDuty'],[HelpCircle,'Unavailable','unavailable']].map(([Icon,label,key])=><div key={key} className="flex items-center gap-3 rounded-xl border border-sibs-border bg-white px-4 py-3.5 shadow-sm">
        <div className="rounded-lg bg-[#ecf3fa] p-2.5 text-sibs-navy"><Icon size={19}/></div><div><p className="text-[11px] font-bold text-sibs-secondary">{label}</p><p className="mt-0.5 text-2xl font-extrabold tabular-nums text-sibs-navy">{data ? summary[key] : '—'}</p><p className="text-[10px] text-sibs-muted">Assessment portal staff</p></div>
      </div>)}
    </div>
    <section className="sibs-page-card-in sibs-card relative flex flex-col rounded-[14px] border border-sibs-border bg-white shadow-xs" aria-label="Assessment user directory">
      <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6">
        <h2 className="sibs-card-title">User Directory</h2><p className="sibs-card-subtitle">Active Kronos accounts with TA, HR, HR Admin or Super Admin access.</p>
        <form className="mt-4 flex flex-col gap-3 md:flex-row md:items-end" onSubmit={event=>{event.preventDefault();setQuery(searchInput.trim());setPage(1);}}>
          <div className="min-w-0 flex-1"><SearchInput label="Search" value={searchInput} onChange={setSearchInput} onClear={()=>{setSearchInput('');setQuery('');setPage(1);}} placeholder="Search employee, SiBS ID or email..."/></div>
          <div className="w-full md:w-[230px]"><SelectDropdown label="Access" value={role} options={[{label:'All Access',value:''},...ROLES.map(r=>({label:r,value:r}))]} onChange={value=>{setRole(value||'');setPage(1);}} placeholder="All Access" clearable={false}/></div>
          <button className="sibs-btn-primary inline-flex h-9 items-center justify-center px-4 text-xs 2xl:h-10" type="submit">Search</button>
        </form>
      </div>
      <div className="p-4 sm:p-5 2xl:p-6">
        {stale && <p role="status" className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Duty information is awaiting verification. Last known status is not shown as current.</p>}
        {error && <div role="alert" className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700"><AlertCircle size={16}/><span className="flex-1">{error}</span><button type="button" className="sibs-btn-secondary inline-flex items-center gap-1" onClick={()=>setRetry(v=>v+1)}><RefreshCw size={14}/> Retry</button></div>}
        <div className="overflow-hidden rounded-[14px] border border-sibs-border bg-white shadow-xs">
          <StatusFilterTabs tabs={tabs} activeValue={status} onChange={v=>{setStatus(v);setPage(1);}} layoutId="assessmentUsersStatusTabs"/>
          <div className="hidden max-h-[480px] overflow-auto sibs-scrollbar lg:block 2xl:max-h-[640px]">
            <table className="w-full min-w-[820px] table-fixed border-separate border-spacing-0 text-left"><thead className="sibs-data-table-head"><tr className="sibs-data-table-head-row">{[['SiBS ID','w-[12%]'],['Employee name','w-[38%]'],['Access','w-[18%]'],['Location','w-[15%]'],['Status','w-[17%] text-center']].map(([label,width])=><th key={label} scope="col" className={`sibs-data-table-th ${width} px-3 py-2.5 sibs-text-micro font-black uppercase tracking-wider text-sibs-navy 2xl:px-4 2xl:py-3.5`}>{label}</th>)}</tr></thead>
            <tbody>{visible.map(row=><tr key={row.sibsId} className="group transition-colors hover:bg-sibs-cream-light"><td className={`${cell} sibs-text-xs font-extrabold text-sibs-orange`}>{row.sibsId}</td><td className={cell}><Identity row={row} photoUrl={photoFor(row)}/></td><td className={`${cell} sibs-text-xs font-bold text-sibs-navy`}>{row.access}</td><td className={`${cell} sibs-text-xs text-sibs-secondary`}><span className="inline-flex items-center gap-1"><MapPin size={13}/>{row.site}</span></td><td className={`${cell} text-center`}><DutyBadge row={row}/></td></tr>)}{!visible.length&&<tr><td colSpan={5} className="px-5 py-12 text-center sibs-text-xs text-sibs-muted">{error?'User directory unavailable.':'No matching assessment users.'}</td></tr>}</tbody></table>
          </div>
          <div className="space-y-3 p-3 lg:hidden">{visible.map(row=><div key={row.sibsId} className="group space-y-3 rounded-xl border border-sibs-border p-3"><Identity row={row} photoUrl={photoFor(row)}/><div className="grid grid-cols-2 gap-2 text-xs"><div><p className="text-sibs-muted">SiBS ID</p><p className="font-bold text-sibs-orange">{row.sibsId}</p></div><div><p className="text-sibs-muted">Access</p><p className="font-bold text-sibs-navy">{row.access}</p></div><div><p className="text-sibs-muted">Location</p><p className="font-bold text-sibs-navy">{row.site}</p></div><DutyBadge row={row}/></div></div>)}{!visible.length&&<p className="p-5 text-center text-xs text-sibs-muted">{error?'User directory unavailable.':'No matching assessment users.'}</p>}</div>
          <div className="px-4 pb-4 sm:px-5"><TablePagination currentPage={currentPage} totalPages={pages} totalRecords={filtered.length} pageSize={PAGE_SIZE} loadedCount={visible.length} onPageChange={setPage} recordLabel="users" className="mt-3 pt-2.5"/></div>
        </div>
      </div>
    </section>
    <p className="flex items-center gap-1.5 text-xs text-sibs-muted"><ShieldCheck size={14}/> Duty status is informational only; it does not change access, chat availability or assessment permissions.</p>
  </div>;
}
