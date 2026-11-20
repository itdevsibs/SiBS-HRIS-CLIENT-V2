import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, RefreshCw, ExternalLink, Eye, Clock3,
  CheckCircle2, Mail, Users, AlertCircle, FileClock, X, UserRound,
  MapPin, BriefcaseBusiness,
} from 'lucide-react';
import Header from '../../components/layout/Header';
import api from '../../lib/axios/api-template';
import ModalShell from '../../components/ui/ModalShell';
import { PageHeaderHero } from '../../components/ui';
import CsrFitAssessmentResultModal from '../../components/modals/candidatePipeline/CsrFitAssessmentResultModal';

const STATUS_STYLES = {
  INVITED: 'border-slate-200 bg-slate-50 text-slate-700',
  IN_PROGRESS: 'border-orange-200 bg-orange-50 text-orange-800',
  SUBMITTED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};
const STATUS_LABELS = {
  INVITED: 'Invitation sent',
  IN_PROGRESS: 'In progress',
  SUBMITTED: 'Submitted',
};
const FILTERS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'INVITED', label: 'Invitation sent' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'SUBMITTED', label: 'Submitted' },
];
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
const initials = (name) => String(name || '').split(/\s+/).filter(Boolean).slice(0, 2)
  .map(part => part[0].toUpperCase()).join('') || 'PA';

function StatusLabel({ value }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLES[value] || STATUS_STYLES.INVITED}`}>
    <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${value === 'SUBMITTED' ? 'bg-emerald-600' : value === 'IN_PROGRESS' ? 'bg-sibs-orange' : 'bg-slate-500'}`} />
    {STATUS_LABELS[value] || 'Not started'}
  </span>;
}

function ProvisionalResults({ row }) {
  if (row.status !== 'SUBMITTED') return <span className="text-[11px] text-sibs-muted">Available after submission</span>;
  return <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1 text-[11px] tabular-nums">
    <span className="text-sibs-secondary">Cognitive</span><span className="text-right font-extrabold text-sibs-navy">{safeScore(row.results?.cognitive)}</span>
    <span className="text-sibs-secondary">Behavioral</span><span className="text-right font-extrabold text-sibs-navy">{safeScore(row.results?.behavioral)}</span>
    <span className="text-sibs-secondary">Computer literacy</span><span className="text-right font-extrabold text-sibs-navy">{safeScore(row.results?.computerLiteracy)}</span>
  </div>;
}

function PendingApplicantModal({ applicant, onClose }) {
  return <ModalShell open={Boolean(applicant)} onClose={onClose} title="Public Assessment Applicant"
    subtitle={applicant?.name || 'Applicant registration'} icon={UserRound}
    maxWidth="max-w-[650px]" autoDetectDirty={false} closeOnBackdrop={false}
    bodyClassName="bg-sibs-surface px-4 py-5 sm:px-6"
    footer={<button type="button" onClick={onClose} className="sibs-modal-btn-secondary">Close</button>}>
    {applicant && <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sibs-border bg-white p-4">
        <div><h3 className="text-sm font-extrabold text-sibs-navy">{applicant.name}</h3>
          <p className="mt-1 text-xs text-sibs-secondary">{applicant.email}</p></div>
        <StatusLabel value={applicant.status} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          [BriefcaseBusiness, 'Desired role', applicant.desiredRole || '—'],
          [MapPin, 'Location', applicant.location || 'Not specified'],
          [FileClock, 'Registered', readableDate(applicant.createdAt)],
          [Clock3, 'Assessment stage', applicant.status === 'IN_PROGRESS'
            ? `Module ${applicant.currentModule || 1} of 7 · ${applicant.completedModules || 0} completed`
            : 'Not started'],
        ].map(([Icon, label, value]) => <div key={label} className="rounded-xl border border-sibs-border bg-white p-3.5">
          <div className="flex items-center gap-2 text-[11px] font-bold text-sibs-muted"><Icon size={14} /> {label}</div>
          <p className="mt-1.5 break-words text-xs font-extrabold text-sibs-navy">{value}</p>
        </div>)}
      </div>
      <p className="rounded-lg border border-sibs-border bg-white px-3 py-3 text-xs leading-5 text-sibs-secondary">
        Assessment answers and scores become available only after the applicant submits the completed exam.
      </p>
    </div>}
  </ModalShell>;
}

export default function PublicAssessmentApplicantsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [resultLoadingId, setResultLoadingId] = useState(null);
  const [resultError, setResultError] = useState('');
  const pageCount = Math.max(1, Math.ceil(total / 20));
  const pageStats = useMemo(() => ({
    progress: items.filter(item => item.status === 'IN_PROGRESS').length,
    submitted: items.filter(item => item.status === 'SUBMITTED').length,
  }), [items]);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get('/api/assessment/public-applicants', {
        params: { page, limit: 20, search: query, status: statusFilter },
      });
      setItems(Array.isArray(response.data?.data?.items) ? response.data.data.items : []);
      setTotal(Number(response.data?.data?.total) || 0);
      setError('');
    } catch (cause) {
      setError(cause?.response?.data?.message || 'Unable to retrieve public assessment applicants.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, query, statusFilter]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible' && !document.hidden) void load({ silent: true });
    }, 15000);
    return () => window.clearInterval(interval);
  }, [load]);

  async function openApplicant(applicant) {
    if (!applicant || resultLoadingId !== null) return;
    setResultError('');
    if (applicant.status !== 'SUBMITTED') {
      setSelectedApplicant(applicant);
      return;
    }
    setResultLoadingId(applicant.id);
    try {
      const response = await api.get(`/api/assessment/public-applicants/${applicant.id}/result`);
      const data = response.data?.data;
      if (!data?.available) throw new Error('The completed assessment result is not available.');
      setAssessmentResult(data); // EXACT same read-only Candidate Pipeline results modal.
    } catch (cause) {
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

  return <div className="sibs-dashboard-shell">
    <div className="shrink-0"><Header /></div>
    <main className="sibs-dashboard-main-wide">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-4 sm:gap-5">
        <PageHeaderHero kicker="Recruitment Pipeline" title="Public Assessment"
          description="Public CSR-Fit registrations, assessment progress, and verified candidate results."
          actions={<div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => { void load(); }} className="sibs-btn-icon" title="Refresh records" aria-label="Refresh public assessment records">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button type="button" onClick={copyPublicUrl} className="sibs-btn-secondary inline-flex items-center gap-2">
              <ExternalLink size={15} /> Copy public link
            </button>
            <button type="button" onClick={() => navigate('/public-assessment')} className="sibs-btn-primary inline-flex items-center gap-2">
              <ExternalLink size={15} /> Open public assessment
            </button>
          </div>}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            [Users, 'Registered applicants', total, 'All matching records'],
            [Clock3, 'In progress', pageStats.progress, 'Current page'],
            [CheckCircle2, 'Submitted', pageStats.submitted, 'Current page'],
          ].map(([Icon, label, value, note]) => <div key={label} className="flex items-center gap-3 rounded-xl border border-sibs-border bg-white px-4 py-3.5 shadow-sm">
            <div className="rounded-lg bg-[#ecf3fa] p-2.5 text-sibs-navy"><Icon size={19} /></div>
            <div><p className="text-[11px] font-bold text-sibs-secondary">{label}</p>
              <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-sibs-navy">{value}</p>
              <p className="text-[10px] text-sibs-muted">{note}</p></div>
          </div>)}
        </div>

        <section className="overflow-hidden rounded-xl border border-sibs-border bg-white shadow-sm" aria-label="Public assessment applicant directory">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-sibs-border px-4 py-4 sm:px-5">
            <div><h2 className="text-sm font-extrabold text-sibs-navy">Applicant Directory</h2>
              <p className="mt-1 text-[11px] text-sibs-muted">Click an applicant to view their record and, once submitted, the complete CSR-Fit results.</p></div>
            <form className="flex flex-wrap items-center gap-2" onSubmit={event => {event.preventDefault();setPage(1);setQuery(searchInput.trim());}}>
              <label className="flex h-10 items-center gap-2 rounded-lg border border-sibs-border px-3">
                <Search size={15} className="text-sibs-muted" />
                <input type="search" aria-label="Search public applicants" value={searchInput}
                  onChange={event => setSearchInput(event.target.value)} placeholder="Search applicant or position"
                  className="w-[170px] bg-transparent text-xs text-sibs-navy outline-none sm:w-[220px]" />
              </label>
              <label className="sr-only" htmlFor="public-assessment-status">Filter by assessment status</label>
              <select id="public-assessment-status" value={statusFilter}
                onChange={event => {setPage(1);setStatusFilter(event.target.value);}}
                className="h-10 rounded-lg border border-sibs-border bg-white px-3 text-xs font-bold text-sibs-navy">
                {FILTERS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <button type="submit" className="sibs-btn-primary h-10 px-4 text-xs">Search</button>
              {query && <button type="button" onClick={() => {setQuery('');setSearchInput('');setPage(1);}} className="sibs-btn-secondary h-10 px-3" aria-label="Clear search"><X size={14} /></button>}
            </form>
          </div>
          {error && <div role="alert" className="m-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            <AlertCircle size={15} />{error}
          </div>}
          {resultError && <div role="alert" className="m-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            <span>{resultError}</span><button type="button" aria-label="Dismiss error" onClick={() => setResultError('')}><X size={15}/></button>
          </div>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1090px] border-collapse text-left">
              <thead className="bg-[#f2f6fb] text-[11px] uppercase tracking-wide text-sibs-navy">
                <tr>
                  <th className="px-4 py-3 font-extrabold sm:px-5">Applicant</th>
                  <th className="px-4 py-3 font-extrabold">Position / Location</th>
                  <th className="px-4 py-3 font-extrabold">Registered</th>
                  <th className="px-4 py-3 font-extrabold">Status</th>
                  <th className="px-4 py-3 font-extrabold">Current stage</th>
                  <th className="px-4 py-3 font-extrabold">Assessment results</th>
                  <th className="px-4 py-3 text-right font-extrabold">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sibs-border text-xs">
                {loading && items.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-sibs-secondary">Loading applicants…</td></tr>}
                {!loading && items.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-sibs-secondary">No public assessment applicants found.</td></tr>}
                {items.map(applicant => <tr key={applicant.id} onClick={() => void openApplicant(applicant)}
                  className="cursor-pointer transition-colors hover:bg-[#f6faff]">
                  <td className="px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-2.5">
                      <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#cfdfef] bg-[#edf4fb] text-[11px] font-extrabold text-sibs-navy">{initials(applicant.name)}</span>
                      <div className="min-w-0">
                        <button type="button" onClick={event => {event.stopPropagation();void openApplicant(applicant);}}
                          className="text-left text-xs font-extrabold text-sibs-navy hover:text-sibs-orange hover:underline">
                          {applicant.name || 'Unnamed applicant'}
                        </button>
                        <p className="mt-1 flex items-center gap-1 text-[10px] text-sibs-muted"><Mail size={11}/>{applicant.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><p className="font-bold text-sibs-navy">{applicant.desiredRole || '—'}</p><p className="mt-1 text-[11px] text-sibs-muted">{applicant.location || 'Not specified'}</p></td>
                  <td className="whitespace-nowrap px-4 py-3 text-sibs-secondary">{readableDate(applicant.createdAt)}</td>
                  <td className="px-4 py-3"><StatusLabel value={applicant.status}/></td>
                  <td className="px-4 py-3 text-sibs-secondary">
                    {applicant.status === 'IN_PROGRESS' ? `Module ${applicant.currentModule || 1} of 7`
                      : applicant.status === 'SUBMITTED' ? '7 of 7 completed' : 'Not started'}
                    {applicant.status === 'IN_PROGRESS' && <p className="mt-1 text-[10px] text-sibs-muted">{applicant.completedModules || 0} completed</p>}
                  </td>
                  <td className="px-4 py-3"><ProvisionalResults row={applicant}/></td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" disabled={resultLoadingId !== null}
                      onClick={event => {event.stopPropagation();void openApplicant(applicant);}}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-sibs-border bg-white px-3 py-2 text-[11px] font-bold text-sibs-navy shadow-sm hover:border-sibs-orange hover:text-sibs-orange disabled:cursor-wait disabled:opacity-50">
                      <Eye size={14}/>{resultLoadingId === applicant.id ? 'Opening…' : applicant.status === 'SUBMITTED' ? 'View results' : 'View details'}
                    </button>
                  </td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sibs-border px-4 py-3 text-xs text-sibs-secondary sm:px-5">
            <span>{total} matching applicant{total === 1 ? '' : 's'} · Page {Math.min(page, pageCount)} of {pageCount}</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage(value => Math.max(1, value - 1))}
                className="rounded-lg border border-sibs-border px-3 py-2 font-bold disabled:opacity-40">Previous</button>
              <button type="button" disabled={page >= pageCount} onClick={() => setPage(value => value + 1)}
                className="rounded-lg border border-sibs-border px-3 py-2 font-bold disabled:opacity-40">Next</button>
            </div>
          </div>
        </section>
        <p className="text-[11px] text-sibs-muted">Assessment scores are provisional and intended for authorized HR review. They do not determine hiring outcomes automatically.</p>
      </div>
    </main>
    <PendingApplicantModal applicant={selectedApplicant} onClose={() => setSelectedApplicant(null)}/>
    <CsrFitAssessmentResultModal open={Boolean(assessmentResult)} data={assessmentResult} onClose={() => setAssessmentResult(null)}/>
  </div>;
}
