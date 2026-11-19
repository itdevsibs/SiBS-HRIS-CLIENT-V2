import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ClipboardCheck, Eye, FileQuestion, CheckCircle2, Download, Loader2 } from 'lucide-react';
import ModalShell from '@/components/ui/ModalShell';
import SelectDropdown from '@/components/ui/SelectDropdown';
import { downloadCsrFitAssessmentPdf } from '@/lib/utils/csrFitAssessmentPdfClient';
import { CSR_FIT_MODULE_NAMES } from '@/components/assessment/csrFitModuleGuides';
import CsrFitReadOnlyResponse from './CsrFitReadOnlyResponse';

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
  const responseScrollRef = useRef(null);
  const responsesSectionRef = useRef(null);
  const previousModuleRef = useRef(module);

  // Opening another candidate's attempt must not retain the previous candidate's selected module.
  useEffect(() => {
    if (!open) return;
    setModule('module1');
    setFilter('all');
  }, [open, data?.attemptId]);

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
    try { await downloadCsrFitAssessmentPdf(data); }
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
        <section className="rounded-xl border border-sibs-border bg-white p-4">
          <h3 className="text-sm font-extrabold text-sibs-navy">Assessment score overview</h3>
          <p className="mt-1 text-[11px] text-sibs-muted">Stored assessment results · Read only</p>
          <div className="mt-3 grid items-stretch gap-3 sm:grid-cols-2">
            <div className="h-full rounded-xl border border-sibs-border bg-sibs-surface p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-xs font-bold leading-5 text-sibs-navy">{CSR_FIT_MODULE_NAMES[0]}</p>
                <span className="inline-flex rounded-md border border-sibs-border bg-white px-2 py-1 text-[10px] font-bold text-sibs-secondary">Pending review</span>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-sibs-muted">Answers are recorded. A grade will be available only after the cognitive answer key is approved.</p>
              {Number.isFinite(cognitiveSaved) && cognitiveSaved >= 0 && <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-sibs-navy">
                <CheckCircle2 size={13} className="text-emerald-700"/> {cognitiveSaved} answers saved
              </p>}
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
        {Array.isArray(score.behavioralPillars) && score.behavioralPillars.length > 0 && (
          <section className="rounded-xl border border-sibs-border bg-white p-4">
            <h3 className="text-sm font-extrabold text-sibs-navy">Behavioral competency scores</h3>
            <p className="mt-1 text-[11px] text-sibs-muted">Every competency has its own label, value, and graph.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {score.behavioralPillars.map((pillar, index) => (
                <MetricGraph key={pillar.key || `${pillar.name}-${index}`}
                  label={pillar.name} value={pillar.score}
                  note={`${pillar.items ?? '—'} scored items`} compact />
              ))}
            </div>
          </section>
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
                  {question.selectedKey ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700"><CheckCircle2 size={12}/> Answered</span>
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
        <p className="text-[11px] leading-5 text-sibs-muted">The behavioral score remains provisional, and the cognitive module has not been graded. Practical modules are summarized separately. Neither the results nor these responses constitute an automatic hiring decision.</p>
      </div>
    </ModalShell>
  );
}
