import CsrFitActivityLog from '../../components/assessment/CsrFitActivityLog';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  RefreshCw, ExternalLink, Clock3,
  CheckCircle2, Users, AlertCircle, FileClock, X, UserRound,
  BriefcaseBusiness, Copy, Check,
} from 'lucide-react';
import Header from '../../components/layout/Header';
import api from '../../lib/axios/api-template';
import socket from '../../lib/axios/socket';
import portalSocket from '../../lib/assessment-admin/portalSocket';
import portalApi from '../../lib/assessment-admin/portalApi';
import ModalShell from '../../components/ui/ModalShell';
import { PageHeaderHero } from '../../components/ui';
import PageFallback from '../../components/ui/PageFallback';
import { TableSkeletonRows } from '../../components/ui/TableSkeleton';
import CsrFitAssessmentResultModal from '../../components/modals/candidatePipeline/CsrFitAssessmentResultModal';
import PublicCsrFitAssessmentResultModal from '../../components/modals/publicAssessment/PublicCsrFitAssessmentResultModal';
// Reuse the same HRIS controls used by Recruitment > Talent Pool.
import PaginationTable from '../../services/pagination/PaginationTable';
import StatusFilterTabs from '../../components/ui/StatusFilterTabs';
import DirectoryAvatarCircle from '../../components/ui/DirectoryAvatarCircle';

const STATUS_STYLES = {
  INVITED: 'border-slate-200 bg-slate-50 text-slate-700',
  IN_PROGRESS: 'border-orange-200 bg-orange-50 text-orange-800',
  SUBMITTED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  VOID: 'border-red-200 bg-red-50 text-red-700',
};
const STATUS_LABELS = {
  INVITED: 'Not started',
  IN_PROGRESS: 'In progress',
  SUBMITTED: 'Submitted',
  VOID: 'Void',
};
const safeScore = (value) => value !== null && value !== undefined && value !== '' &&
  Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100
  ? `${Number(value).toFixed(2)}%` : '—';
const readableDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric',
  }).format(date);
};
// Name comes from the public directory in HRIS surname-first format.
// Keep avatars in the normal SiBS HRIS given-name + surname initial order.
const applicantInitials = (name) => {
  const text = String(name ?? '').trim();
  if (!text) return 'A';

  const comma = text.indexOf(',');
  if (comma !== -1) {
    const surname = text.slice(0, comma).trim();
    const given = text.slice(comma + 1).trim();
    return `${given.slice(0, 1)}${surname.slice(0, 1)}`.toUpperCase() || 'A';
  }

  // The current API only omits the comma when a name part is missing.
  return text.slice(0, 1).toUpperCase();
};

// Match the Employee Directory avatar hover/focus preview. Public applicants
// have no profile photo in the directory payload, so preview the same initials.
function getApplicantAvatarPreviewPosition(element) {
  if (!element || typeof window === 'undefined') return null;

  const rect = element.getBoundingClientRect();
  const previewHeight = 176;
  const gap = 12;
  const placeBelow = rect.top < previewHeight + gap;
  // Keep the preview within the viewport when the first column is near an edge.
  const halfWidth = 89;
  const center = rect.left + rect.width / 2;
  const left = Math.min(Math.max(center, halfWidth + 4), Math.max(halfWidth + 4, window.innerWidth - halfWidth - 4));

  return {
    left,
    top: placeBelow ? rect.bottom + gap : rect.top - gap,
    placeBelow,
  };
}

function ApplicantAvatar({ applicant }) {
  const name = applicant.name || 'Unnamed applicant';
  const initials = applicantInitials(applicant.name);
  const avatarRef = useRef(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(null);

  const showPreview = () => {
    setPreviewPosition(getApplicantAvatarPreviewPosition(avatarRef.current));
    setPreviewVisible(true);
  };
  const hidePreview = () => setPreviewVisible(false);

  useEffect(() => {
    if (!previewVisible) return undefined;

    const updatePreviewPosition = () => {
      setPreviewPosition(getApplicantAvatarPreviewPosition(avatarRef.current));
    };
    window.addEventListener('resize', updatePreviewPosition);
    window.addEventListener('scroll', updatePreviewPosition, true);
    return () => {
      window.removeEventListener('resize', updatePreviewPosition);
      window.removeEventListener('scroll', updatePreviewPosition, true);
    };
  }, [previewVisible]);

  const preview = previewVisible && previewPosition && typeof document !== 'undefined'
    ? createPortal(
        <span
          className="employee-avatar-preview pointer-events-none fixed z-[9999] rounded-2xl border border-sibs-border bg-white p-2 shadow-[0_18px_45px_rgba(4,44,81,0.22)]"
          style={{
            left: previewPosition.left,
            top: previewPosition.top,
            transform: previewPosition.placeBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
          }}
          aria-hidden="true"
        >
          <DirectoryAvatarCircle name={name} initials={initials} size="preview" />
        </span>,
        document.body,
      )
    : null;

  return (
    <>
      <span
        ref={avatarRef}
        className="relative inline-flex shrink-0 outline-none"
        tabIndex={0}
        aria-label={`${name} avatar`}
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
        onFocus={showPreview}
        onBlur={hidePreview}
        onClick={event => event.stopPropagation()}
        onKeyDown={event => {
          event.stopPropagation();
          if (event.key === 'Escape') hidePreview();
        }}
      >
        <DirectoryAvatarCircle name={name} initials={initials} />
      </span>
      {preview}
    </>
  );
}

// Keep the copy action separate from the clickable applicant row.
function ApplicantEmail({ email }) {
  const address = String(email ?? '').trim();
  const [copiedEmail, setCopiedEmail] = useState('');
  const resetTimerRef = useRef(null);
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current);
    };
  }, []);
  const copied = Boolean(address) && copiedEmail === address;

  async function copyEmail(event) {
    event.stopPropagation();
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      if (!mountedRef.current) return;
      if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current);
      setCopiedEmail(address);
      resetTimerRef.current = window.setTimeout(() => {
        resetTimerRef.current = null;
        setCopiedEmail('');
      }, 2000);
    } catch {
      // Match the portal's existing manual-copy fallback for blocked clipboard access.
      if (mountedRef.current) window.prompt('Copy applicant email:', address);
    }
  }

  return (
    <div className="mt-1 flex min-w-0 items-center gap-1">
      <span className="min-w-0 truncate text-[10px] font-semibold text-sibs-muted" title={address || undefined}>
        {address || '—'}
      </span>
      {address && (
        <button
          type="button"
          onClick={copyEmail}
          onKeyDown={event => event.stopPropagation()}
          title={copied ? 'Email copied' : 'Copy email'}
          aria-label={copied ? 'Email copied' : `Copy email ${address}`}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sibs-muted transition-colors hover:bg-white hover:text-sibs-navy focus-visible:ring-2 focus-visible:ring-sibs-orange/30"
        >
          {copied ? <Check size={13} className="text-emerald-600" aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
        </button>
      )}
      <span role="status" className="sr-only">{copied ? 'Email copied to clipboard.' : ''}</span>
    </div>
  );
}

// This modal is read-only. All individual progress values come from the
// authorized public applicant directory API, never browser-side guesses.
const MODULE_NAMES = [
  'Cognitive & Logic Abilities',
  'Work Attitudes, Habits & Behavioral-Cognitive',
  'Real-Time Coaching & Active Listening Challenge',
  'Administrative Task Simulation',
  'Typing & Data Entry Test',
  'Audio Comprehension & Logging',
  'Computer Literacy & Essential Tools',
];
const displayValue = (value, fallback = '—') => {
  const text = String(value ?? '').trim();
  return text && !/^(?:n\s*\/?\s*a\.?|not\s+applicable|null|undefined)$/i.test(text) ? text : fallback;
};
const readableTimestamp = (value) => {
  if (value === null || value === undefined || value === '') return 'Not started';
  const millis = Number(value);
  if (!Number.isFinite(millis) || millis <= 0) return 'Not started';
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) return 'Not started';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(date);
};
const applicantProgress = (applicant) => {
  const status = applicant?.status;
  const completed = status === 'SUBMITTED' ? 7 : ['IN_PROGRESS','VOID'].includes(status)
    ? Math.max(0, Math.min(7, Math.trunc(Number(applicant?.completedModules) || 0))) : 0;
  const savedModule = Number(applicant?.currentModule);
  const current = ['IN_PROGRESS','VOID'].includes(status) && Number.isInteger(savedModule)
    && savedModule >= 1 && savedModule <= 7 ? savedModule : null;
  return { completed, current, status };
};


function StatusLabel({ value }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLES[value] || STATUS_STYLES.INVITED}`}>
    <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${value === 'SUBMITTED' ? 'bg-emerald-600' : value === 'IN_PROGRESS' ? 'bg-sibs-orange' : value==='VOID'?'bg-red-600':'bg-slate-500'}`} />
    {STATUS_LABELS[value] || 'Not started'}
  </span>;
}

function ProvisionalResults({ row }) {
  if(row.status==='VOID')return <span className="text-xs font-bold text-red-700">Void · No valid result</span>;
  if (row.status !== 'SUBMITTED') return <span className="text-[11px] text-sibs-muted">Available after submission</span>;
  return <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1 text-[11px] tabular-nums">
    <span className="text-sibs-secondary">Cognitive</span><span className="text-right font-extrabold text-sibs-navy">{safeScore(row.results?.cognitive)}</span>
    <span className="text-sibs-secondary">Behavioral</span><span className="text-right font-extrabold text-sibs-navy">{safeScore(row.results?.behavioral)}</span>
    <span className="text-sibs-secondary">Computer literacy</span><span className="text-right font-extrabold text-sibs-navy">{safeScore(row.results?.computerLiteracy)}</span>
  </div>;
}

function PendingApplicantModal({ applicant, onClose, assessmentApi, portalMode, onUnauthorized, liveSocket }) {
  const [activity,setActivity]=useState(null);
  const [activityLoading,setActivityLoading]=useState(false);
  const [activityError,setActivityError]=useState('');
  const [activityVerified,setActivityVerified]=useState(false);
  const id=applicant?.id;
  const statusValue=applicant?.status;
  const unauthorizedRef=useRef(onUnauthorized);
  unauthorizedRef.current=onUnauthorized;
  useEffect(()=>{
    setActivity(null); setActivityError(''); setActivityLoading(false); setActivityVerified(false);
  },[id]);
  useEffect(()=>{
    if(!id||!['IN_PROGRESS','SUBMITTED','VOID'].includes(statusValue))return;
    let active=true, inFlight=false, queued=false, denied=false, finished=false, debounce=null;
    const controller=new AbortController();
    const visible=()=>document.visibilityState==='visible'&&!document.hidden;
    const path=portalMode?`/api/assessment-portal/applicants/${encodeURIComponent(id)}/activity`:`/api/assessment/public-applicants/${encodeURIComponent(id)}/activity`;
    const refresh=async (force=false,queue=false)=>{
      if(!active||denied||finished||(!force&&!visible()))return;
      if(inFlight){if(queue)queued=true;return;}
      inFlight=true;
      try {
        const response=await assessmentApi.get(path,{signal:controller.signal});
        if(!active)return;
        const log=response.data?.data;
        if(!Array.isArray(log?.events))throw new Error('Invalid activity response.');
        setActivity(log);setActivityError('');setActivityVerified(true);
        finished=['SUBMITTED','VOID'].includes(statusValue)||log.events.some(event=>['ASSESSMENT_SUBMITTED','ASSESSMENT_VOIDED'].includes(event.type));
      } catch(cause) {
        if(!active)return;
        setActivityVerified(false);
        if([401,403].includes(Number(cause?.response?.status))){
          denied=true;setActivity(null);
          if(portalMode)unauthorizedRef.current?.();
        }
        setActivityError('Could not refresh activity logs. The last recorded activity may be outdated.');
      } finally {
        inFlight=false;
        if(active){
          setActivityLoading(false);
          if(queued){queued=false;void refresh();}
        }
      }
    };
    const invalidate=()=>{
      if(!active||denied||finished||!visible()||debounce!==null)return;
      debounce=window.setTimeout(()=>{debounce=null;void refresh(false,true);},150);
    };
    const onVisible=()=>{if(visible())void refresh(false,true);};
    setActivityLoading(true);void refresh(true);
    // The directory owns the authenticated room subscription. The modal only
    // listens for invalidations; it never disconnects the shared socket.
    liveSocket.on('assessment-activity:changed',invalidate);
    liveSocket.on('connect',onVisible);
    document.addEventListener('visibilitychange',onVisible);
    window.addEventListener('focus',onVisible);
    const recovery=window.setInterval(()=>void refresh(),5000);
    return ()=>{
      active=false;controller.abort();window.clearInterval(recovery);
      if(debounce!==null)window.clearTimeout(debounce);
      liveSocket.off('assessment-activity:changed',invalidate);
      liveSocket.off('connect',onVisible);
      document.removeEventListener('visibilitychange',onVisible);
      window.removeEventListener('focus',onVisible);
    };
  },[id,statusValue,assessmentApi,portalMode,liveSocket]);
  if (!applicant) return null;
  const { completed, current, status } = applicantProgress(activity?.voidedAtMs?{...applicant,status:'VOID'}:applicant);
  const isInProgress = status === 'IN_PROGRESS';
  const currentTitle = current ? MODULE_NAMES[current - 1] : 'Not started';

  return <ModalShell open={true} onClose={onClose} title="Public Assessment Applicant"
    subtitle={applicant.name || 'Applicant registration'} icon={UserRound}
    maxWidth="max-w-[720px]" autoDetectDirty={false} closeOnBackdrop={false}
    bodyClassName="bg-sibs-surface px-4 py-5 sm:px-6"
    footer={<button type="button" onClick={onClose} className="sibs-modal-btn-secondary">Close</button>}>
    <div className="space-y-4">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sibs-border bg-white p-4">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-extrabold text-sibs-navy">{displayValue(applicant.name, 'Unnamed applicant')}</h3>
          <p className="mt-1 break-all text-xs text-sibs-secondary">{displayValue(applicant.email)}</p>
        </div>
        <StatusLabel value={status}/>
      </section>

      <section aria-label="Applicant registration information" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [BriefcaseBusiness, 'Position', displayValue(applicant.desiredRole, 'Not assigned')],
          [FileClock, 'Registered', readableDate(applicant.createdAt)],
          [Clock3, 'Assessment started', readableTimestamp(applicant.startedAtMs)],
        ].map(([Icon, label, value]) => <div key={label} className="rounded-xl border border-sibs-border bg-white p-3.5">
          <div className="flex items-center gap-2 text-[11px] font-bold text-sibs-muted"><Icon size={14}/> {label}</div>
          <p className="mt-1.5 break-words text-xs font-extrabold text-sibs-navy">{value}</p>
        </div>)}
      </section>

      <section aria-label="Saved assessment progress" className="rounded-xl border border-sibs-border bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-extrabold text-sibs-navy">Assessment progress</h4>
            <p className="mt-1 text-xs text-sibs-secondary">{isInProgress
              ? `Module ${current ?? '—'} of 7 · ${currentTitle}`
              : status === 'SUBMITTED' ? 'All seven modules submitted' : status==='VOID'?'Assessment void · No valid result':'Assessment not started'}</p>
          </div>
          <span className="whitespace-nowrap rounded-md bg-sibs-surface px-2.5 py-1 text-xs font-extrabold tabular-nums text-sibs-navy">
            {completed} of 7 completed
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar"
          aria-label="Completed assessment modules" aria-valuemin={0} aria-valuemax={7} aria-valuenow={completed}>
          <div className="h-full rounded-full bg-sibs-orange transition-[width] duration-300"
            style={{ width: `${(completed / 7) * 100}%` }}/>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {MODULE_NAMES.map((name, index) => {
            const moduleNumber = index + 1;
            const done = moduleNumber <= completed;
            const active = isInProgress && moduleNumber === current;
            const voided = status==='VOID' && moduleNumber===current;
            const stage = done ? 'Completed' : voided?'Voided here':active ? 'Current module' : 'Not started';
            return <div key={moduleNumber}
              className={`flex min-w-0 items-start gap-2 rounded-lg border px-3 py-2.5 ${voided?'border-red-200 bg-red-50':active ? 'border-orange-200 bg-orange-50/60' : 'border-sibs-border bg-sibs-surface'}`}>
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold ${active ? 'bg-sibs-orange text-white' : done ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-sibs-muted'}`}>{moduleNumber}</span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold leading-4 text-sibs-navy">{name}</p>
                <p className={`mt-1 text-[10px] font-semibold ${active ? 'text-sibs-orange' : done ? 'text-emerald-700' : 'text-sibs-muted'}`}>{stage}</p>
              </div>
            </div>;
          })}
        </div>
      </section>
      {(status==='VOID'||activity?.voidedAtMs) && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">Assessment void · {activity?.violationCount??applicant.violationCount??5} recorded violations. { (activity?.reapplyAtMs||applicant.reapplyAtMs) ? `Reapply after ${readableDate(activity?.reapplyAtMs||applicant.reapplyAtMs)}.` : 'Six-month waiting period.'}</div>}
      {(isInProgress || status === 'SUBMITTED' || status==='VOID') && <CsrFitActivityLog publicAssessment key={id} log={activity} loading={activityLoading} error={activityError} live={isInProgress && !activity?.events?.some(event=>event.type==='ASSESSMENT_SUBMITTED')} verified={activityVerified}/>}
      <p className="text-[11px] leading-5 text-sibs-secondary">
        This view reflects the applicant's saved assessment status. Scores and detailed results become available after final submission.
      </p>
    </div>
  </ModalShell>;
}

export default function PublicAssessmentApplicantsPage({ portalMode = false, onUnauthorized, onInitialLoadSettled }) {
  const assessmentApi = portalMode ? portalApi : api;
  const liveSocket = portalMode ? portalSocket : socket;
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [initialLoadSettled, setInitialLoadSettled] = useState(false);
  const [error, setError] = useState('');
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [resultLoadingId, setResultLoadingId] = useState(null);
  const [resultError, setResultError] = useState('');
  const pageCount = Math.max(1, Math.ceil(total / 20));
  const [summary, setSummary] = useState({ registered: 0, inProgress: 0, submitted: 0, voided:0 });
  const statusTabs = [
    { value: 'ALL', label: 'All', icon: Users },
    { value: 'INVITED', label: 'Not started', icon: FileClock },
    { value: 'IN_PROGRESS', label: 'In progress', icon: Clock3, count: summary.inProgress },
    { value: 'SUBMITTED', label: 'Submitted', icon: CheckCircle2, count: summary.submitted },
    { value:'VOID',label:'Void',icon:AlertCircle,count:summary.voided,tone:'danger' },
  ];
  const requestSequenceRef = useRef(0);
  const debounceRef = useRef(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    const sequence = ++requestSequenceRef.current;
    if (!silent) setLoading(true);
    try {
      const response = await assessmentApi.get(portalMode ? '/api/assessment-portal/applicants' : '/api/assessment/public-applicants', {
        params: { page, limit: 20, search: query, status: statusFilter },
      });
      if (sequence !== requestSequenceRef.current) return;
      const result = response.data?.data || {};
      const newItems = Array.isArray(result.items) ? result.items : [];
      setItems(newItems);
      setSelectedApplicant(previous => {
        if (!previous) return previous;
        return newItems.find(item => item.id === previous.id) || previous;
      });
      setTotal(Number(result.total) || 0);
      if (result.summary) setSummary({
        registered: Number(result.summary.registered) || 0,
        inProgress: Number(result.summary.inProgress) || 0,
        submitted: Number(result.summary.submitted) || 0,
        voided: Number(result.summary.voided)||0,
      });
      setError('');
    } catch (cause) {
      if (portalMode && [401, 403].includes(Number(cause?.response?.status))) onUnauthorized?.();
      if (sequence === requestSequenceRef.current)
        setError(cause?.response?.data?.message || 'Unable to retrieve public assessment applicants.');
    } finally {
      if (sequence === requestSequenceRef.current) {
        setInitialLoadSettled(true);
        setLoading(false);
      }
    }
  }, [page, query, statusFilter, portalMode, onUnauthorized, assessmentApi]);

  useEffect(() => {
    // When a live update removes the last record on the current page, return
    // to the last existing page instead of showing a stale empty result.
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => {
    // SiBS Chat pattern: Socket.IO is the primary update transport. Only an
    // invalidation event is received; authorized HRIS GET supplies all details.
    const isVisible = () => document.visibilityState === 'visible' && !document.hidden;
    const refresh = () => {
      if (!isVisible()) return;
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        debounceRef.current = null;
        void load({ silent: true });
      }, 180);
    };
    const subscribe = () => {
      liveSocket.emit('public-assessment:subscribe', (ack) => {
        if (ack?.subscribed) refresh();
      });
    };
    const handleVisibility = () => { if (isVisible()) refresh(); };
    void load();
    liveSocket.on('connect', subscribe);
    liveSocket.on('public-assessment:changed', refresh);
    if (!liveSocket.connected) liveSocket.connect();
    else subscribe();
    // Recovery for missed events (e.g. different Socket.IO processes behind
    // the reverse proxy); do not repeatedly fetch while tab is hidden.
    const recovery = window.setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    return () => {
      liveSocket.off('connect', subscribe);
      liveSocket.off('public-assessment:changed', refresh);
      if (liveSocket.connected) liveSocket.emit('public-assessment:unsubscribe');
      window.clearInterval(recovery);
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      // Shared socket also carries notifications: do not disconnect it.
    };
  }, [load, liveSocket]);

  async function openApplicant(applicant) {
    if (!applicant || resultLoadingId !== null) return;
    setResultError('');
    if (applicant.status !== 'SUBMITTED') {
      setSelectedApplicant(applicant);
      return;
    }
    setResultLoadingId(applicant.id);
    try {
      const response = await assessmentApi.get(portalMode ? `/api/assessment-portal/applicants/${applicant.id}/result` : `/api/assessment/public-applicants/${applicant.id}/result`);
      const data = response.data?.data;
      if (!data?.available) throw new Error('The completed assessment result is not available.');
      setAssessmentResult({ ...data, publicApplicantId: applicant.id }); // Keep portal identity separate from Candidate Pipeline.
    } catch (cause) {
      if (portalMode && [401, 403].includes(Number(cause?.response?.status))) onUnauthorized?.();
      setResultError(cause?.response?.data?.message || cause?.message || 'Could not open assessment results.');
    } finally {
      setResultLoadingId(null);
    }
  }

  async function copyPublicUrl() {
    const url = `${window.location.origin}/public-assessment`;
    try {
      await navigator.clipboard.writeText(url);
      setResultError('');
    } catch {
      window.prompt('Copy public assessment URL:', url);
    }
  }

  // Signal the persistent portal skeleton before the browser paints the results.
  useLayoutEffect(() => {
    if (portalMode && initialLoadSettled) onInitialLoadSettled?.();
  }, [portalMode, initialLoadSettled, onInitialLoadSettled]);
  // The portal owns initial loading; retain the standalone fallback if embedded elsewhere.
  if (portalMode && loading && !initialLoadSettled) return onInitialLoadSettled ? null : <PageFallback />;

  return <div className={portalMode ? 'w-full' : 'sibs-dashboard-shell'}>
    {!portalMode && <div className="shrink-0"><Header /></div>}
    <main className={portalMode ? 'w-full px-1 py-1' : 'sibs-dashboard-main-wide'}>
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-4 sm:gap-5">
        <PageHeaderHero kicker={portalMode ? 'Assessment Administration' : 'Recruitment Pipeline'} title="Public Assessment"
          description="Public CSR-Fit registrations, assessment progress, and verified candidate results."
          actions={<div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => { void load(); }} className="sibs-btn-icon" title="Refresh records" aria-label="Refresh public assessment records">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button type="button" onClick={copyPublicUrl} className="sibs-btn-secondary inline-flex items-center gap-2">
              <ExternalLink size={15} /> Copy public link
            </button>
            <a href="/public-assessment" target="_blank" rel="noopener noreferrer"
              className="sibs-btn-primary inline-flex items-center gap-2"
              aria-label="Open public assessment in a new tab">
              <ExternalLink size={15} /> Open public assessment
            </a>
          </div>}
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [Users, 'Registered applicants', summary.registered, 'All matching records'],
            [Clock3, 'In progress', summary.inProgress, 'All matching records'],
            [CheckCircle2, 'Submitted', summary.submitted, 'All matching records'],
            [AlertCircle,'Void',summary.voided,'Five activity violations'],
          ].map(([Icon, label, value, note]) => <div key={label} className="flex items-center gap-3 rounded-xl border border-sibs-border bg-white px-4 py-3.5 shadow-sm">
            <div className={`rounded-lg p-2.5 ${label==='Void'?'bg-red-50 text-red-700':'bg-[#ecf3fa] text-sibs-navy'}`}><Icon size={19} /></div>
            <div><p className="text-[11px] font-bold text-sibs-secondary">{label}</p>
              <p className={`mt-0.5 text-2xl font-extrabold tabular-nums ${label==='Void'?'text-red-700':'text-sibs-navy'}`}>{value}</p>
              <p className="text-[10px] text-sibs-muted">{note}</p></div>
          </div>)}
        </div>

        {/* Same panel hierarchy, HRIS CSS classes and controls as Recruitment > Talent Pool. */}
        <section
          className="sibs-page-card-in sibs-card relative z-[10] flex flex-col overflow-hidden rounded-[14px] border border-sibs-border bg-white shadow-xs font-jakarta"
          aria-label="Public assessment applicant directory"
        >
          <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6">
            <div className="flex flex-col gap-0.5">
              <h2 className="sibs-card-title">Applicant Directory</h2>
              <p className="sibs-card-subtitle">
                Search applicants and review their saved assessment progress and results.
              </p>
            </div>
            <div className="relative z-[90] mt-3.5 overflow-visible 2xl:mt-4">
              <PaginationTable
                filterLayout="ta-inline"
                showFilterPanel={false}
                showFilterHeader={false}
                showPagination={false}
                searchValue={searchInput}
                searchLabel="Search"
                searchPlaceholder="Search applicant name or email..."
                onSearchChange={setSearchInput}
                onSearchKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    setPage(1);
                    setQuery(searchInput.trim());
                  }
                }}
                rightContent={
                  <div className="flex w-full items-center gap-2 xl:w-auto">
                    <button type="button" onClick={() => { setPage(1); setQuery(searchInput.trim()); }}
                      className="sibs-btn-primary inline-flex h-9 items-center justify-center px-4 text-xs 2xl:h-10">
                      Search
                    </button>
                    <button type="button" disabled={!query && !searchInput}
                      onClick={() => { setPage(1); setQuery(''); setSearchInput(''); }}
                      className="sibs-btn-secondary inline-flex h-9 items-center justify-center gap-1.5 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-40 2xl:h-10">
                      <X size={14} /> Clear
                    </button>
                  </div>
                }
                className="border-0 bg-transparent p-0 shadow-none"
              />
            </div>
          </div>

          <div className="flex flex-1 flex-col p-4 sm:p-5 2xl:p-6">
            <div className="flex flex-1 flex-col overflow-hidden rounded-[14px] border border-sibs-border bg-white shadow-xs">
              <StatusFilterTabs
                tabs={statusTabs}
                activeValue={statusFilter}
                layoutId="publicAssessmentApplicantStatusIndicator"
                onChange={value => { setPage(1); setStatusFilter(value); }}
              />
              {error && <div role="alert" className="m-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                <AlertCircle size={15} />{error}
              </div>}
              {resultError && <div role="alert" className="m-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                <span>{resultError}</span><button type="button" aria-label="Dismiss error" onClick={() => setResultError('')}><X size={15}/></button>
              </div>}

              <div className="max-h-[480px] overflow-x-auto overflow-y-auto bg-white sibs-scrollbar 2xl:max-h-[640px]">
                <table className="w-full min-w-[1160px] table-fixed border-separate border-spacing-0 text-left 2xl:min-w-[1250px]">
                  <thead className="sibs-data-table-head">
                    <tr className="sibs-data-table-head-row">
                      {[
                        ['Applicant', 'w-[23%] text-left'],
                        ['Position', 'w-[17%] text-left'],
                        ['Registered', 'w-[15%] text-center'],
                        ['Status', 'w-[13%] text-center'],
                        ['Current stage', 'w-[14%] text-center'],
                        ['Assessment results', 'w-[18%] text-left'],
                      ].map(([heading, width]) => <th key={heading}
                        className={`sibs-data-table-th ${width} px-3 py-2.5 sibs-text-micro font-black uppercase tracking-wider text-sibs-navy 2xl:px-4 2xl:py-3.5`}>
                        {heading}
                      </th>)}
                    </tr>
                  </thead>
                  <tbody aria-busy={loading}>
                    {loading && items.length === 0 && (portalMode
                      ? <TableSkeletonRows count={6} columns={6} />
                      : <tr><td colSpan={6} className="px-5 py-12 text-center sibs-text-xs font-semibold text-sibs-secondary">Loading applicants…</td></tr>)}
                    {!loading && items.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center sibs-text-xs font-semibold text-sibs-secondary">No public assessment applicants found.</td></tr>}
                    {items.map(applicant => <tr
                      key={applicant.id}
                      role="button"
                      tabIndex={0}
                      aria-busy={resultLoadingId === applicant.id}
                      onClick={() => void openApplicant(applicant)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          void openApplicant(applicant);
                        }
                      }}
                      className={`group ${resultLoadingId !== null ? 'cursor-wait' : 'cursor-pointer'} transition-colors ${applicant.status==='VOID'?'bg-red-50 hover:bg-red-100 text-red-700':'hover:bg-sibs-cream-light'} focus-visible:bg-sibs-cream-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sibs-orange/30`}
                    >
                      <td className="border-b border-sibs-border px-3 py-2 align-middle 2xl:px-4 2xl:py-2.5">
                        <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
                          <ApplicantAvatar applicant={applicant} />
                          <div className="min-w-0 flex-1">
                            <p className={`break-words sibs-text-xs font-extrabold leading-tight ${applicant.status==='VOID'?'text-red-700':'text-sibs-navy group-hover:text-sibs-orange'} transition-colors`} title={applicant.name}>
                              {applicant.name || 'Unnamed applicant'}
                            </p>
                            <ApplicantEmail email={applicant.email} />
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-sibs-border px-3 py-2 align-middle 2xl:px-4 2xl:py-2.5">
                        <p className="truncate sibs-text-xs font-extrabold text-sibs-navy" title={applicant.desiredRole || 'Not assigned'}>
                          {applicant.desiredRole || 'Not assigned'}
                        </p>
                      </td>
                      <td className="border-b border-sibs-border px-3 py-2 text-center align-middle 2xl:px-4 2xl:py-2.5">
                        <p className="whitespace-nowrap sibs-text-xs font-semibold tabular-nums text-sibs-secondary">{readableDate(applicant.createdAt)}</p>
                      </td>
                      <td className="border-b border-sibs-border px-3 py-2 text-center align-middle 2xl:px-4 2xl:py-2.5">
                        <StatusLabel value={applicant.status}/>
                      </td>
                      <td className="border-b border-sibs-border px-3 py-2 text-center align-middle 2xl:px-4 2xl:py-2.5">
                        <p className="sibs-text-xs font-semibold text-sibs-secondary">
                          {applicant.status === 'IN_PROGRESS' ? `Module ${applicant.currentModule || 1} of 7`
                            : applicant.status === 'SUBMITTED' ? '7 of 7 completed' : applicant.status==='VOID'?`Voided at module ${applicant.currentModule||'—'}`:'Not started'}
                        </p>
                        {applicant.status==='VOID' && <p className="mt-1 text-[10px] font-bold text-red-700">{applicant.violationCount||5} violations</p>}
                        {applicant.status === 'IN_PROGRESS' && <p className="mt-1 text-[10px] text-sibs-muted">{applicant.completedModules || 0} completed</p>}
                      </td>
                      <td className="border-b border-sibs-border px-3 py-2 align-middle 2xl:px-4 2xl:py-2.5">
                        <ProvisionalResults row={applicant}/>
                      </td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
              <div className="mt-auto px-4 pb-4 sm:px-5 sm:pb-5">
                <PaginationTable
                  showSearch={false}
                  showPagination
                  showCount
                  loading={loading}
                  currentPage={Math.min(page, pageCount)}
                  totalPages={pageCount}
                  loadedCount={items.length}
                  totalRecords={total}
                  recordLabel="applicants"
                  onPageChange={setPage}
                  className="border-0 bg-transparent p-0 shadow-none"
                />
              </div>
            </div>
          </div>
        </section>
        <p className="text-[11px] text-sibs-muted">Assessment scores are provisional and intended for authorized HR review. They do not determine hiring outcomes automatically.</p>
      </div>
    </main>
    <PendingApplicantModal key={selectedApplicant?.id||'none'} applicant={selectedApplicant} onClose={() => setSelectedApplicant(null)} assessmentApi={assessmentApi} portalMode={portalMode} onUnauthorized={onUnauthorized} liveSocket={liveSocket}/>
    {portalMode ?
      <PublicCsrFitAssessmentResultModal open={Boolean(assessmentResult)} data={assessmentResult} onClose={() => setAssessmentResult(null)}/> :
      <CsrFitAssessmentResultModal open={Boolean(assessmentResult)} data={assessmentResult} onClose={() => setAssessmentResult(null)}/>}
  </div>;
}
