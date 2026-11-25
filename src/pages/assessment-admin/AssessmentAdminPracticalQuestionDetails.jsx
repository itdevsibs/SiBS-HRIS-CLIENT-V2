import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, FileText, Folder, Headphones, Keyboard, Play } from 'lucide-react';
import portalApi from '../../lib/assessment-admin/portalApi';

const sectionClass = 'space-y-3 rounded-xl border border-sibs-border bg-white p-4';
const valueClass = 'whitespace-pre-wrap break-words text-xs font-semibold leading-relaxed text-sibs-navy';
const missing = 'Not available';

function Section({ title, icon: Icon, children }) {
  return <section className={sectionClass}>
    <h4 className="flex items-center gap-2 text-sm font-extrabold text-sibs-navy">{Icon && <Icon size={16} className="shrink-0 text-sibs-orange" />}{title}</h4>
    {children}
  </section>;
}

function Details({ items }) {
  return <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
    {items.map(([label, value]) => <div key={label} className="min-w-0 rounded-lg border border-sibs-border bg-sibs-surface p-3">
      <dt className="mb-1 text-[11px] font-bold text-sibs-muted">{label}</dt>
      <dd className={valueClass}>{value ?? missing}</dd>
    </div>)}
  </dl>;
}

function Expected({ children }) {
  return <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold leading-relaxed text-emerald-800">
    <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
    <div className="min-w-0 break-words">{children}</div>
  </div>;
}

function VoicemailPreview() {
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(null);
  const objectUrl = useRef('');
  useEffect(() => () => {
    request.current?.abort();
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);
  async function loadAudio() {
    if (request.current || audioUrl) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true); setError('');
    try {
      const response = await portalApi.get('/api/assessment-portal/questions/module6/voicemail', { responseType: 'blob', signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!response.data?.size || !String(response.data.type).startsWith('audio/')) throw new Error('Invalid audio response');
      objectUrl.current = URL.createObjectURL(response.data);
      setAudioUrl(objectUrl.current);
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure?.response?.status === 401 || failure?.response?.status === 403 ? 'Sign in again to preview the recording.' : 'Unable to load the recording. Please try again.');
    } finally {
      if (request.current === controller) request.current = null;
      if (!controller.signal.aborted) setLoading(false);
    }
  }
  return <Section title="Voicemail recording" icon={Headphones}>
    {audioUrl ? <audio controls preload="metadata" src={audioUrl} className="w-full" onError={()=>setError('The recording could not be played.')} aria-label="Reviewer voicemail preview" /> : <button type="button" className="sibs-btn-secondary inline-flex items-center gap-2 disabled:opacity-50" disabled={loading} onClick={loadAudio}><Play size={15}/>{loading ? 'Loading recording…' : 'Load audio preview'}</button>}
    {error && <p role="alert" className="text-xs font-semibold text-rose-700">{error}</p>}
    <p className="text-xs text-sibs-muted">Reviewer preview only. Candidate playback remains limited to one listen.</p>
  </Section>;
}

export default function AssessmentAdminPracticalQuestionDetails({ question }) {
  const { module, stem, source, metadata = {} } = question;
  const details = metadata || {};
  if (module === 'module5') {
    return <div className="space-y-3">
      <Section title={details.title || 'Typing passage'} icon={Keyboard}>
        <div className="rounded-lg border border-sibs-border bg-sibs-surface p-4">
          <p className="whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-sibs-navy">{stem}</p>
        </div>
      </Section>
      <Section title="Typing benchmarks" icon={CheckCircle2}>
        <Details items={[
          ['Time per passage', details.secondsPerPassage != null ? `${details.secondsPerPassage} seconds` : null],
          ['Target typing speed', details.benchmarkWpm != null ? `${details.benchmarkWpm} WPM` : null],
          ['Target accuracy', details.benchmarkAccuracy != null ? `${details.benchmarkAccuracy}%` : null],
        ]}/>
        <p className="text-xs text-sibs-muted">The passage is the reference text for typing accuracy; there is no multiple-choice answer.</p>
      </Section>
    </div>;
  }
  if (module === 'module4' && details.fileTask) {
    const task = details.fileTask;
    return <div className="space-y-3">
      <Section title={task.category || 'File and folder management'} icon={Folder}>
        <p className={valueClass}>{task.fileNameRule || stem}</p>
        <Details items={[
          ['Original filename', task.sourceFilename],
          ['Available folders', task.folders?.join(' · ')],
        ]}/>
      </Section>
      <Section title="Expected result" icon={CheckCircle2}>
        <Expected><strong>Required filename:</strong> {task.correctFilename || missing}</Expected>
        <Expected><strong>Destination folder:</strong> {task.correctFolder || missing}</Expected>
        <p className="text-xs text-sibs-muted">File-task scoring checks both the filename and the destination folder.</p>
      </Section>
    </div>;
  }
  if (module === 'module4' && details.dataTask) {
    const task = details.dataTask;
    const record = task.source || {};
    return <div className="space-y-3">
      <Section title={task.category || 'Customer data entry'} icon={FileText}>
        <p className={valueClass}>{record.issue || stem}</p>
        <Details items={[
          ['Customer name', record.customerName], ['Account number', record.accountNumber],
          ['Callback number', record.callbackNumber], ['Available categories', task.categories?.join(' · ')],
        ]}/>
      </Section>
      <Section title="Expected responses" icon={CheckCircle2}>
        <Expected><strong>Correct category:</strong> {record.correctCategory || missing}</Expected>
        <p className="text-xs text-sibs-muted">The three customer fields are checked against the source record; the selected category is scored separately.</p>
      </Section>
    </div>;
  }
  if (module === 'module6' && details.voicemail && source === 'ORIGINAL') {
    const voicemail = details.voicemail;
    return <div className="space-y-3">
      <VoicemailPreview />
      <Section title="Voicemail transcript" icon={FileText}><p className={valueClass}>{voicemail.script || missing}</p></Section>
      <Section title="Expected data entry" icon={CheckCircle2}>
        <Details items={(voicemail.fields || []).map(field => [field.label, field.answer])}/>
      </Section>
      <Section title="Response options and correct answers" icon={CheckCircle2}>
        {(voicemail.choices || []).map(choice => <div key={choice.id} className="space-y-2 rounded-lg border border-sibs-border p-3">
          <h5 className="text-xs font-extrabold">{choice.label}</h5>
          {(choice.options || []).map(option => <div key={option.key} className={`flex flex-wrap items-start gap-2 rounded-lg border p-2.5 text-xs ${option.key === choice.correctKey ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-sibs-border bg-sibs-surface'}`}>
            <span className="font-extrabold">{option.key}.</span><span className="min-w-0 flex-1 break-words">{option.text}</span>
            {option.key === choice.correctKey && <span className="inline-flex items-center gap-1 font-bold"><CheckCircle2 size={13}/> Correct answer</span>}
          </div>)}
        </div>)}
      </Section>
    </div>;
  }
  return <div className="space-y-3">
    <Section title="Task instructions" icon={FileText}><p className={valueClass}>{stem}</p></Section>
    {details.instructions ? <Section title="Scenario, scoring and media details"><p className={valueClass}>{details.instructions}</p></Section> : <p className="rounded-lg border border-sibs-border bg-sibs-surface p-3 text-xs text-sibs-muted">Detailed task reference is not available. Ensure the updated Question Bank server is running.</p>}
  </div>;
}
