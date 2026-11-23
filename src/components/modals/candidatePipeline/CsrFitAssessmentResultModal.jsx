import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ClipboardCheck, Eye, FileQuestion, CheckCircle2, Download, Loader2, BrainCircuit, RefreshCw, Mail, AlertCircle } from 'lucide-react';
import ModalShell from '@/components/ui/ModalShell';
import api from '@/lib/axios/api-template';
import SelectDropdown from '@/components/ui/SelectDropdown';
import { downloadCsrFitAssessmentPdf } from '@/lib/utils/csrFitAssessmentPdfClient';
import { CSR_FIT_MODULE_NAMES } from '@/components/assessment/csrFitModuleGuides';
import CsrFitReadOnlyResponse from './CsrFitReadOnlyResponse';
import CsrFitHermesCharts from '@/components/assessment/CsrFitHermesCharts';
import CsrFitWeightedResults from '@/components/assessment/CsrFitWeightedResults';
import CsrFitWorkplaceInsights from '@/components/assessment/CsrFitWorkplaceInsights';

const MODULE_LABELS = Object.fromEntries(
  CSR_FIT_MODULE_NAMES.map((title, index) => [`module${index + 1}`, title])
);
const RESPONSE_FILTER_OPTIONS = [
  { value: 'all', label: 'All questions' },
  { value: 'answered', label: 'Answered' },
  { value: 'unanswered', label: 'Unanswered' },
];
const formatPercentage = (value) => value == null || !Number.isFinite(Number(value))
  ? 'Pending review' : `${Number(value).toFixed(2)}%`;
const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(Number(value));
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-PH', {
    timeZone:'Asia/Manila', month:'long',day:'numeric',year:'numeric',
    hour:'numeric',minute:'2-digit',hour12:true,
  }).format(date);
};

const isValidPercentage = value => value !== null && value !== undefined && value !== '' &&
  Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100;

/** Derive completion from this attempt's actual questions and saved counts.
 *  Never use a hardcoded denominator: older attempts have different item sets.
 */
function assessmentProgress(data) {
  const keys = data?.sevenModule
    ? ['module1', 'module2', 'module3', 'module4', 'module5', 'module6', 'module7']
    : ['module1', 'module2'];
  return keys.reduce((result, key) => {
    const records = data?.modules?.[key];
    const recorded = data?.answered?.[key];
    const declared = data?.moduleDefinitions?.find?.((item) => item.key === key);
    const reportedTotal = recorded && typeof recorded === 'object' ? Number(recorded.total) : NaN;
    const definedTotal = Number(declared?.count);
    const total = Array.isArray(records) ? records.length
      : Number.isFinite(reportedTotal) && reportedTotal >= 0 ? reportedTotal
      : Number.isFinite(definedTotal) && definedTotal >= 0 ? definedTotal : 0;
    const reportedDone = recorded && typeof recorded === 'object' ? Number(recorded.done) : Number(recorded);
    const observedDone = Array.isArray(records)
      ? records.filter((item) => Boolean(item.selectedKey)).length : 0;
    const done = Number.isFinite(reportedDone) && reportedDone >= 0 ? reportedDone : observedDone;
    return {
      completed: result.completed + Math.min(total, Math.max(0, Math.trunc(done))),
      total: result.total + Math.max(0, Math.trunc(total)),
    };
  }, { completed: 0, total: 0 });
}

/** A score is only graphed when the stored result is numerically valid. */
function MetricGraph({ label, value, note = '', accent = 'navy', compact = false }) {
  const valid = isValidPercentage(value);
  const percent = valid ? Number(value) : 0;
  return (
    <div className={`h-full rounded-xl border border-sibs-border bg-sibs-surface ${compact ? 'p-3' : 'p-3.5'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold leading-5 text-sibs-navy">{label}</p>
          {note && <p className="mt-0.5 text-[11px] leading-4 text-sibs-muted">{note}</p>}
        </div>
        <span className="shrink-0 text-xs font-extrabold tabular-nums text-sibs-navy">
          {valid ? `${percent.toFixed(2)}%` : 'Pending review'}
        </span>
      </div>
      {valid && <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200" role="progressbar"
        aria-label={`${label} score`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full ${accent === 'orange' ? 'bg-sibs-orange' : 'bg-sibs-navy'}`}
          style={{ width: `${percent}%` }} />
      </div>}
    </div>
  );
}

/** Quantities have an explicit axis. These are not score percentages. */
function QuantityGraph({ label, value, scale, unit = '', benchmark = null, note = '' }) {
  const parsed = Number(value);
  const valid = value !== null && value !== undefined && value !== '' &&
    Number.isFinite(parsed) && parsed >= 0 && Number.isFinite(scale) && scale > 0;
  const percent = valid ? Math.min(100, (parsed / scale) * 100) : 0;
  return (
    <div className="rounded-lg border border-sibs-border bg-sibs-surface p-3">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-bold text-sibs-navy">{label}</span>
        <span className="shrink-0 font-extrabold tabular-nums text-sibs-navy">
          {valid ? `${parsed.toFixed(unit === 'WPM' ? 1 : unit === '%' ? 1 : 0)}${unit === '%' ? '%' : ` ${unit}`.trimEnd()}` : 'Not recorded'}
        </span>
      </div>
      <div className="relative mt-3 h-2.5 overflow-visible rounded-full bg-slate-200"
        role={valid ? 'meter' : undefined} aria-label={`${label} ${unit}`}
        aria-valuenow={valid ? parsed : undefined} aria-valuemin={0} aria-valuemax={scale}>
        {valid && <div className="h-full rounded-full bg-sibs-navy" style={{width:`${percent}%`}}/>}
        {benchmark !== null && <span aria-hidden="true"
          className="absolute -top-1 h-[18px] w-0.5 bg-orange-500"
          style={{left:`${Math.min(100,Number(benchmark)/scale*100)}%`}}/>}
      </div>
      <p className="mt-2 text-[10px] leading-4 text-sibs-muted">
        {note || (benchmark !== null ? `Orange marker: ${benchmark} ${unit} benchmark` : `Scale: 0–${scale} ${unit}`)}
      </p>
    </div>
  );
}

/** Submitted candidate answers only — no editable inputs or server write actions. */
export default function CsrFitAssessmentResultModal({ open, data, onClose }) {
  const [module, setModule] = useState('module1');
  const [filter, setFilter] = useState('all');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [emailDelivery, setEmailDelivery] = useState(null);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [hermesState, setHermesState] = useState(null);
  const [hermesRetryBusy, setHermesRetryBusy] = useState(false);
  const [hermesError, setHermesError] = useState('');
  const [hermesPollCycle, setHermesPollCycle] = useState(0);

  const responseScrollRef = useRef(null);
  const responsesSectionRef = useRef(null);
  const previousModuleRef = useRef(module);

  // Opening another candidate's attempt must not retain the previous candidate's selected module.
  useEffect(() => {
    if (!open) return;
    setModule('module1');
    setFilter('all');
    setHermesState(data?.aiInterpretation || null);
    setEmailDelivery(data?.email || null);
    setEmailError('');
    setHermesError('');
  }, [open, data?.attemptId]);

  // Poll only while the candidate result is open. Never silently spin forever:
  // after repeated transport failures, offer an explicit Check status action.
  useEffect(() => {
    const id = Number(data?.candidatePipelineId);
    if (!open || !Number.isSafeInteger(id) || id < 1) return;
    let cancelled = false;
    let timer;
    let refreshing = false;
    let failures = 0;
    const refresh = async () => {
      if (cancelled || refreshing) return;
      refreshing = true;
      let terminal = false;
      try {
        const response = await api.get(`/api/assessment/candidate/${id}/result/hermes-interpretation`);
        if (cancelled) return;
        const next = response?.data?.data;
        if (!next || typeof next.status !== 'string') throw new Error('Invalid status response');
        failures = 0;
        setHermesError('');
        setHermesState(next);
        terminal = ['READY', 'FAILED', 'DISABLED', 'NOT_SUBMITTED'].includes(next.status);
      } catch (error) {
        if (cancelled) return;
        failures += 1;
        const code = Number(error?.response?.status || 0);
        if ([401, 403].includes(code) || failures >= 3) {
          terminal = true;
          setHermesState(current => current?.status === 'READY' ? current : { status: 'UNAVAILABLE' });
          setHermesError(code === 403 ? 'Your account is not authorized to view this interpretation.'
            : code === 401 ? 'Your HRIS session has expired. Sign in to view the interpretation.'
            : 'Could not refresh the Hermes status. Check the server connection, then select Check status.');
        }
      } finally {
        refreshing = false;
        if (!cancelled && !terminal) timer = setTimeout(refresh, 12_000);
      }
    };
    void refresh();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [open, data?.candidatePipelineId, data?.attemptId, hermesPollCycle]);

  const checkEmailStatus = async (retry = false) => {
    const id = Number(data?.attemptId);
    if (!Number.isSafeInteger(id) || id < 1 || emailBusy) return;
    setEmailBusy(true);
    setEmailError('');
    try {
      const url = `/api/assessment/completion-email/${id}/${retry ? 'retry' : 'status'}`;
      const response = retry ? await api.post(url) : await api.get(url);
      setEmailDelivery(response?.data?.data || {status:'NOT_QUEUED'});
    } catch (error) {
      setEmailError(error?.response?.data?.message || 'Could not check report email delivery.');
    } finally {
      setEmailBusy(false);
    }
  };

  const retryHermes = async () => {
    const id = Number(data?.candidatePipelineId);
    if (!Number.isSafeInteger(id) || id < 1 || hermesRetryBusy) return;
    setHermesRetryBusy(true);
    setHermesError('');
    try {
      const response = await api.post(`/api/assessment/candidate/${id}/result/hermes-interpretation`, { retry: true });
      setHermesState(response?.data?.data || { status: 'PENDING' });
      // A previous polling cycle may have stopped on FAILED; restart it now.
      setHermesPollCycle(value => value + 1);
    } catch (error) {
      setHermesError(error?.response?.data?.message || 'Unable to request a Hermes review.');
    } finally { setHermesRetryBusy(false); }
  };

  const hermesProcessing = ['PENDING', 'RUNNING'].includes(hermesState?.status);
  const hermesSlow = hermesProcessing && Number(hermesState?.ageSeconds || 0) >= 90;
  const refreshHermes = () => {
    setHermesError('');
    setHermesPollCycle(value => value + 1);
  };

  const selectModule = (nextModule) => {
    if (!MODULE_LABELS[nextModule]) return;
    setFilter('all');
    if (nextModule === module) {
      if (responseScrollRef.current) responseScrollRef.current.scrollTop = 0;
      return;
    }
    setModule(nextModule);
  };

  // An actual tab change must show the newly selected module's FIRST response,
  // not the old module's preserved scroll offset in the nested results panel.
  useLayoutEffect(() => {
    if (!open) return;
    if (responseScrollRef.current) responseScrollRef.current.scrollTop = 0;
    if (previousModuleRef.current === module) return;
    previousModuleRef.current = module;
    const section = responsesSectionRef.current;
    const outerScroll = section?.parentElement?.closest('.sibs-scrollbar');
    if (section && outerScroll) {
      const offset = section.getBoundingClientRect().top - outerScroll.getBoundingClientRect().top;
      outerScroll.scrollTop = Math.max(0, outerScroll.scrollTop + offset - 12);
    }
  }, [module, filter, open]);
  const handlePdfDownload = async () => {
    if (pdfBusy || !data?.available) return;
    setPdfBusy(true);setPdfError('');
    try { await downloadCsrFitAssessmentPdf({...data, aiInterpretation:hermesState}); }
    catch (error) { setPdfError(error?.message || 'Unable to export the assessment PDF.'); }
    finally { setPdfBusy(false); }
  };
  const questions = Array.isArray(data?.modules?.[module]) ? data.modules[module] : [];
  const availableModules = data?.sevenModule ? Object.entries(MODULE_LABELS) : Object.entries(MODULE_LABELS).slice(0,2);
  const itemProgress = (key) => { const v=data?.answered?.[key];return typeof v==='object'?`${v.done||0}/${v.total||0}`:`${v||0}/50`; };
  const { completed: totalProgress, total: totalMaximum } = assessmentProgress(data);
  const completionPercent = totalMaximum > 0 ? Math.min(100, totalProgress / totalMaximum * 100) : 0;
  const cognitiveProgress = data?.answered?.module1;
  const cognitiveSaved = typeof cognitiveProgress === 'object'
    ? Number(cognitiveProgress?.done ?? 0) : Number(cognitiveProgress ?? 0);
  const visible = questions.filter((question) => filter === 'all' ||
    (filter === 'answered' ? Boolean(question.selectedKey) : !question.selectedKey));
  const score = data?.score || {};
  const answered = data?.answered || {};
  if (!open || !data?.available) return null;

  return (
    <ModalShell open={open} onClose={onClose} closeOnBackdrop={false} autoDetectDirty={false}
      title="CSR-Fit Assessment Results" subtitle={`${data.candidate?.name || 'Candidate'} · Submitted exam`}
      icon={ClipboardCheck} maxWidth="max-w-[1050px]" zIndex="z-[15000]"
      bodyClassName="bg-sibs-surface px-4 py-4 sm:px-6" 
      footer={<div className="flex flex-wrap items-center justify-end gap-2">
        <button type="button" disabled={pdfBusy} onClick={handlePdfDownload}
          className="sibs-modal-btn-primary inline-flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-60">
          {pdfBusy ? <Loader2 size={15} className="animate-spin"/> : <Download size={15}/>}
          {pdfBusy ? 'Generating PDF…' : 'Download Answered Assessment (PDF)'}
        </button>
        <button type="button" onClick={onClose} className="sibs-modal-btn-secondary">Close Results</button>
      </div>}>
      <div className="space-y-4">
        {pdfError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700">{pdfError}</div>}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sibs-border bg-white p-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2"><Eye size={16} className="text-sibs-navy"/>
            <span className="text-xs font-extrabold text-sibs-navy">View only · Submitted answers cannot be changed</span></div>
          <span className="text-[11px] font-semibold text-sibs-muted">Submitted {formatDate(data.submittedAtMs)}</span>
        </div>
        {data.sevenModule && <section className="rounded-xl border border-sibs-border bg-white px-4 py-3" aria-label="Candidate PDF email delivery status">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2">
              <Mail size={16} className="mt-0.5 shrink-0 text-sibs-navy"/>
              <div>
                <h3 className="text-xs font-extrabold text-sibs-navy">Candidate report PDF email</h3>
                <p className="mt-1 text-[11px] text-sibs-secondary">
                  {emailDelivery?.status === 'SENT' ? 'Accepted by SMTP for delivery. Check recipient inbox or spam folder.' :
                    emailDelivery?.status === 'SENDING' ? 'Email delivery in progress.' :
                    emailDelivery?.status === 'FAILED' ? `Delivery failed after ${emailDelivery.attempts ?? 0} attempt(s).` :
                    emailDelivery?.status === 'PENDING' ? 'Queued for delivery; please check status.' :
                    'No delivery job found for this submitted assessment.'}
                </p>
                {emailDelivery?.status === 'FAILED' && emailDelivery?.error &&
                  <p className="mt-1 max-w-[720px] break-words text-[11px] text-rose-700">Server response: {emailDelivery.error}</p>}
                {emailError && <p role="alert" className="mt-1 flex items-start gap-1 text-[11px] font-semibold text-rose-700"><AlertCircle size={12} className="mt-0.5 shrink-0"/>{emailError}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" disabled={emailBusy} onClick={() => void checkEmailStatus(false)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-sibs-border px-3 py-2 text-[11px] font-bold text-sibs-navy disabled:opacity-50">
                {emailBusy ? <Loader2 size={13} className="animate-spin"/> : <RefreshCw size={13}/>} Check status
              </button>
              {['FAILED','NOT_QUEUED'].includes(emailDelivery?.status) &&
                <button type="button" disabled={emailBusy} onClick={() => void checkEmailStatus(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sibs-navy px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">
                  <Mail size={13}/> Send report PDF
                </button>}
            </div>
          </div>
        </section>}
        <section className="overflow-hidden rounded-xl border border-sibs-border bg-white" aria-label="Hermes HR assessment interpretation">
          <header className="flex flex-wrap items-start justify-between gap-3 bg-sibs-navy px-4 py-3 text-white">
            <div className="flex items-center gap-2"><BrainCircuit size={19} aria-hidden="true"/>
              <div><h3 className="text-sm font-extrabold">Hermes AI · HR assessment interpretation</h3>
                <p className="mt-0.5 text-[11px] text-white/75">Documentation-guided · Human HR review required</p></div>
            </div>
            <span className="rounded-md border border-white/20 px-2 py-1 text-[10px] font-bold">Advisory only</span>
          </header>
          <div className="space-y-3 p-4">
            {hermesState?.status === 'READY' && hermesState.report ? <>
              <p className="text-xs leading-6 text-sibs-secondary">{hermesState.report.executiveSummary || 'Interpretation available for HR review.'}</p>
              <CsrFitWorkplaceInsights assessment={data} report={hermesState.report} />
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Assessment limitations', hermesState.report.assessmentLimitations, 'border-sibs-border bg-sibs-surface'],
                  ['Suggested interview follow-ups', hermesState.report.interviewerQuestions, 'border-sibs-border bg-white'],
                ].map(([heading,items,style]) => <div key={heading} className={`rounded-lg border p-3 ${style}`}>
                  <h4 className="text-[11px] font-extrabold text-sibs-navy">{heading}</h4>
                  {Array.isArray(items) && items.length ? <ul className="mt-2 space-y-2 text-[11px] leading-5 text-sibs-secondary">
                    {items.map((item,index)=><li key={index} className="flex gap-2"><span className="mt-0.5 text-sibs-orange">•</span><span>{item}</span></li>)}
                  </ul> : <p className="mt-2 text-[11px] text-sibs-muted">No additional findings recorded.</p>}
                </div>)}
              </div>
              {hermesState.report.methodology && <p className="border-t border-sibs-border pt-3 text-[11px] leading-5 text-sibs-muted">Methodology: {hermesState.report.methodology}</p>}
              <p className="text-[10px] font-semibold text-sibs-muted">Model: {hermesState.modelName || 'Hermes'} · No automatic hiring decision</p>
            </> : hermesState?.status === 'DISABLED' ?
              <p className="text-xs text-sibs-muted">Hermes assessment interpretation is not enabled on this HRIS environment. Stored module scores and answers remain available below.</p>
            : <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2 text-xs text-sibs-secondary">
                  {hermesProcessing && !hermesSlow && <Loader2 size={15} className="shrink-0 animate-spin text-sibs-orange"/>}
                  <span>{hermesState?.status === 'UNAVAILABLE' ? 'The interpretation status could not be refreshed. Your stored assessment scores remain available.' :
                    hermesState?.status === 'FAILED' ? (hermesState?.message || 'Hermes could not complete the interpretation.') :
                    hermesState?.status === 'NOT_SUBMITTED' ? 'No submitted assessment was found for this candidate.' :
                    hermesSlow ? 'Hermes is taking longer than expected. The server will stop an unresponsive request and allow a retry.' :
                    hermesState?.status === 'RUNNING' ? 'Hermes is interpreting the completed assessment.' :
                    'Hermes analysis is queued. Verified scores are available below.'}</span>
                </div>
                {hermesState?.status === 'FAILED' && <button type="button" disabled={hermesRetryBusy}
                  onClick={retryHermes} className="inline-flex items-center gap-2 rounded-lg bg-sibs-navy px-3 py-2 text-[11px] font-bold text-white disabled:opacity-60">
                  {hermesRetryBusy ? <Loader2 size={13} className="animate-spin"/> : <RefreshCw size={13}/>}
                  Retry analysis
                </button>}
                {(['UNAVAILABLE', 'PENDING', 'RUNNING'].includes(hermesState?.status) || !hermesState) &&
                  <button type="button" onClick={refreshHermes} disabled={hermesRetryBusy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-sibs-border bg-white px-3 py-2 text-[11px] font-bold text-sibs-navy hover:bg-sibs-surface disabled:opacity-50">
                    <RefreshCw size={13}/> Check status
                  </button>}
              </div>}
            {hermesError && <p role="alert" className="text-[11px] font-semibold text-rose-700">{hermesError}</p>}
          </div>
        </section>
        {data.sevenModule && <CsrFitWeightedResults summary={score.weightedSummary} />}
        <section className="rounded-xl border border-sibs-border bg-white p-4">
          <h3 className="text-sm font-extrabold text-sibs-navy">Additional assessment metrics</h3>
          <p className="mt-1 text-[11px] text-sibs-muted">Stored assessment results · Read only</p>
          <div className="mt-3 grid items-stretch gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <MetricGraph label={CSR_FIT_MODULE_NAMES[0]} value={score.module1Score}
                note="Provisional PDF answer key · Requires HR review" />
              <div className="rounded-lg border border-sibs-border bg-white px-3 py-2 text-[11px] text-sibs-secondary">
                <span className="font-bold text-sibs-navy">
                  {score.module1Correct != null && Number.isFinite(Number(score.module1Total))
                    ? `${score.module1Correct} / ${score.module1Total} correct`
                    : `${cognitiveSaved} answers saved`}
                </span>
                {score.module1Answered != null && <span> · {score.module1Answered} submitted answers</span>}
                {Array.isArray(score.module1DisputedQuestionIds) && score.module1DisputedQuestionIds.length > 0 &&
                  <p className="mt-1 text-orange-700">Question 119 is flagged for answer-key review.</p>}
              </div>
            </div>
            <MetricGraph label={CSR_FIT_MODULE_NAMES[1]} value={score.behavioralComposite}
              note="Provisional behavioral score · Requires HR review" />
            {data.sevenModule && <MetricGraph label={CSR_FIT_MODULE_NAMES[6]} value={score.module7Score}
              note="Provisional knowledge-test score · Requires HR review" accent="orange"/>}
            <div className="h-full rounded-xl border border-sibs-border bg-sibs-surface p-3.5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-bold leading-5 text-sibs-navy">Assessment completion</p>
                <p className="shrink-0 text-xs font-extrabold tabular-nums text-sibs-navy">
                  {totalMaximum > 0 ? `${totalProgress} / ${totalMaximum} items` : 'Not available'}
                </p>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200"
                role={totalMaximum > 0 ? 'progressbar' : undefined}
                aria-label="Saved assessment items (completion only; not a test score)"
                aria-valuenow={totalMaximum > 0 ? totalProgress : undefined}
                aria-valuemin={totalMaximum > 0 ? 0 : undefined}
                aria-valuemax={totalMaximum > 0 ? totalMaximum : undefined}>
                <div className="h-full rounded-full bg-sibs-navy" style={{width:`${completionPercent}%`}}/>
              </div>
              <p className="mt-2 text-[11px] leading-4 text-sibs-muted">
                Completion, not a grade · Result email: {data.email?.status === 'SENT' ? 'Sent' : data.email?.status === 'FAILED' ? 'Retry scheduled' : 'Queued'}
              </p>
            </div>
          </div>
        </section>
        <CsrFitHermesCharts assessment={data} hermesReport={hermesState?.status === 'READY' ? hermesState.report : null} hermesStatus={hermesState?.status} />
        {Array.isArray(score.module1Categories) && score.module1Categories.length > 0 && (
          <details className="rounded-xl border border-sibs-border bg-white p-4" aria-label="Cognitive competency breakdown">
            <summary className="cursor-pointer text-sm font-extrabold text-sibs-navy">View cognitive category scores (tabular breakdown)</summary>
            <p className="mt-1 text-[11px] text-sibs-muted">Provisional PDF key · Score shown only to authorized HR reviewers</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {score.module1Categories.map((item)=>(
                <MetricGraph key={item.category} label={item.category} value={item.score}
                  note={`${item.correct} of ${item.total} correct`} compact />
              ))}
            </div>
          </details>
        )}
        {Array.isArray(score.behavioralPillars) && score.behavioralPillars.length > 0 && (
          <details className="rounded-xl border border-sibs-border bg-white p-4">
            <summary className="cursor-pointer text-sm font-extrabold text-sibs-navy">View behavioral pillar scores (tabular breakdown)</summary>
            <p className="mt-1 text-[11px] text-sibs-muted">Provisional descriptive indices · Individual values remain available below.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {score.behavioralPillars.map((pillar, index) => (
                <MetricGraph key={pillar.key || `${pillar.name}-${index}`}
                  label={pillar.name} value={pillar.score}
                  note={`${pillar.items ?? '—'} scored items`} compact />
              ))}
            </div>
          </details>
        )}
        {data.sevenModule && (
          <>
            <section className="rounded-xl border border-sibs-border bg-white p-4">
              <h3 className="text-sm font-extrabold text-sibs-navy">Typing performance</h3>
              <p className="mt-1 text-[11px] text-sibs-muted">Separate speed and accuracy graphs for each passage.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(Array.isArray(data.objective?.module5) ? data.objective.module5 : []).map((entry,index) => {
                  const wpms = data.objective.module5.map(item => Number(item.wpm)).filter(Number.isFinite);
                  const wpmScale = Math.max(60,Math.ceil(Math.max(40,...wpms)/10)*10);
                  return <div key={index} className="rounded-xl border border-sibs-border p-3">
                    <p className="mb-3 text-xs font-extrabold text-sibs-navy">Passage {index+1}</p>
                    <div className="space-y-3">
                      <QuantityGraph label="Typing speed" value={entry.wpm} scale={wpmScale} unit="WPM" benchmark={40}/>
                      <QuantityGraph label="Accuracy" value={entry.accuracy} scale={100} unit="%" benchmark={90}/>
                    </div>
                  </div>;
                })}
              </div>
              {!(Array.isArray(data.objective?.module5) && data.objective.module5.length) &&
                <p className="mt-3 text-xs text-sibs-muted">No verified typing metrics recorded.</p>}
            </section>
            <section className="rounded-xl border border-sibs-border bg-white p-4">
              <h3 className="text-sm font-extrabold text-sibs-navy">Recorded assessment activity</h3>
              <p className="mt-1 text-[11px] text-sibs-muted">These are counts, not skill scores or hiring decisions.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <QuantityGraph label="Integrity events" value={Number(data.integrityEvents) || 0}
                  scale={Math.max(5,Math.ceil((Number(data.integrityEvents)||0)/5)*5)} unit="events"
                  note="Data-derived display scale · Not a score" />
                <QuantityGraph label="Timed-out modules" value={(data.timedOutModules || []).length}
                  scale={7} unit="modules" note={`Out of 7 modules · ${data.timedOutModules?.join(', ') || 'None'}`} />
              </div>
            </section>
          </>
        )}
        <section ref={responsesSectionRef} className="overflow-hidden rounded-xl border border-sibs-border bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sibs-border px-4 py-3">
            <div>
              <h3 className="text-sm font-extrabold text-sibs-navy">Candidate Exam Responses</h3>
              <p className="text-[11px] text-sibs-muted">Original question order from the candidate’s randomized attempt</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-sibs-border bg-sibs-surface px-2.5 py-1 text-[10px] font-bold text-sibs-muted"><FileQuestion size={12}/> Read only</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sibs-border bg-sibs-surface px-4 py-3">
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Assessment modules">
              {availableModules.map(([key,label])=>(
                <button key={key} role="tab" type="button" aria-selected={module===key} aria-controls="csr-fit-exam-response-panel" id={`csr-fit-tab-${key}`}
                  onClick={()=>selectModule(key)}
                  className={`rounded-lg border px-3 py-2 text-[11px] font-extrabold ${module===key?'border-sibs-navy bg-sibs-navy text-white':'border-sibs-border bg-white text-sibs-navy hover:border-sibs-navy'}`}>
                  {label} ({itemProgress(key)})
                </button>
              ))}
            </div>
            <div className="w-full sm:w-[170px]">
              <SelectDropdown
                label="Filter exam responses"
                hideLabel
                value={filter}
                options={RESPONSE_FILTER_OPTIONS}
                onChange={setFilter}
                clearable={false}
                buttonClassName="h-9 rounded-lg bg-white px-3 text-xs font-bold"
              />
            </div>
          </div>
          <div key={module} ref={responseScrollRef} id="csr-fit-exam-response-panel" aria-labelledby={`csr-fit-tab-${module}`} className="sibs-scrollbar max-h-[min(440px,48dvh)] space-y-3 overflow-y-auto bg-sibs-surface p-3 sm:p-4" role="tabpanel">
            {visible.map((question) => (
              <article key={`${module}:${question.bankQuestionId}`} className="rounded-xl border border-sibs-border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-extrabold text-sibs-muted">Question {question.number} <span className="font-medium">· {question.category}</span></p>
                  {module === 'module1' && typeof question.answerCorrect === 'boolean'
                    ? <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${question.answerCorrect ? 'text-emerald-700' : 'text-orange-700'}`}>
                        {question.answerCorrect ? <CheckCircle2 size={12}/> : <FileQuestion size={12}/>}
                        {question.answerCorrect ? 'Correct · Provisional' : 'Incorrect · Provisional'}
                      </span>
                    : question.selectedKey ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700"><CheckCircle2 size={12}/> Answered</span>
                    : <span className="text-[10px] font-bold text-sibs-muted">Not answered</span>}
                </div>
                <h4 className="mt-2 whitespace-pre-wrap text-sm font-bold leading-6 text-sibs-navy">{question.stem}</h4>
                <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {(question.options||[]).map((option) => {
                    const chosen=option.key===question.selectedKey || (Array.isArray(question.recordedResponse) && question.recordedResponse.includes(option.key));
                    return <div key={option.key} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${chosen?'border-blue-200 bg-blue-50 font-bold text-sibs-navy':'border-sibs-border bg-sibs-surface text-sibs-secondary'}`}>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] ${chosen?'border-sibs-navy bg-sibs-navy text-white':'border-sibs-border bg-white'}`}>{chosen?'✓':option.key}</span>
                      <span className="min-w-0 break-words">{option.text}</span>
                    </div>;
                  })}
                </div>
                <CsrFitReadOnlyResponse module={module} question={question} typingMetrics={data.objective?.module5}/>
              </article>
            ))}
            {!visible.length && <p className="p-6 text-center text-xs font-semibold text-sibs-muted">No responses match this filter.</p>}
          </div>
        </section>
        <p className="text-[11px] leading-5 text-sibs-muted">Module 1 and behavioral scores are provisional pending HR validation. Practical modules are summarized separately. These results do not constitute an automatic hiring decision.</p>
      </div>
    </ModalShell>
  );
}
