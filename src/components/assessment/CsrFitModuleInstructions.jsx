import { useEffect, useState } from 'react';
import {
  ArrowRight, Check, CircleHelp, Clock3, Headphones,
  Keyboard, LockKeyhole, MousePointerClick, ShieldCheck,
  Volume2,
} from 'lucide-react';
import {
  CSR_FIT_MODULE_GUIDES as GUIDES,
  CSR_FIT_MODULE_NAMES as names,
  CSR_FIT_MODULE_LIMITS as limits,
  csrFitGuideText,
} from './csrFitModuleGuides';

// Candidate-facing examples are not scored or submitted.

function Practice({ example }) {
  const [answer, setAnswer] = useState('');
  if (!example) return null;
  return <section className="rounded-xl border border-sibs-border bg-[#f8fafc] p-4 sm:p-5" aria-label="Unscored practice question">
    <div className="mb-2 flex items-center gap-2 text-xs font-extrabold text-sibs-navy"><CircleHelp size={16} /> Try an example</div>
    <p className="text-sm font-semibold leading-6 text-sibs-navy">{example.prompt}</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {example.choices.map(choice => <button type="button" key={choice.key} aria-pressed={answer === choice.key}
        className={`flex min-h-11 items-center gap-2 rounded-lg border p-3 text-left text-xs font-semibold transition ${answer === choice.key ? 'border-[#225b8d] bg-[#eaf3ff] text-sibs-navy' : 'border-sibs-border bg-white text-sibs-secondary hover:border-[#94b8d9]'}`}
        onClick={() => setAnswer(choice.key)}>
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${answer === choice.key ? 'border-sibs-navy bg-sibs-navy text-white' : 'border-sibs-border bg-slate-50'}`}>{answer === choice.key ? <Check size={13} /> : choice.key}</span>
        {choice.text}
      </button>)}
    </div>
    <p className="mt-3 text-[11px] text-sibs-muted">{example.note} Your selection here will not be saved.</p>
  </section>;
}

function AudioReadiness({ media }) {
  const [testSound, setTestSound] = useState('');
  const [keyboardTest, setKeyboardTest] = useState('');
  useEffect(() => { setTestSound(''); setKeyboardTest(''); }, [media]);
  if (media === 'keyboard') return <div className="rounded-xl border border-sibs-border bg-[#f8fafc] p-4">
    <label htmlFor="csr-fit-keyboard-check" className="mb-2 flex items-center gap-2 text-xs font-bold"><Keyboard size={16}/> Check your keyboard</label>
    <input id="csr-fit-keyboard-check" autoComplete="off" value={keyboardTest} onChange={event => setKeyboardTest(event.target.value)}
      className="h-11 w-full rounded-lg border border-sibs-border bg-white px-3 text-sm focus:border-sibs-navy focus:outline-none"
      placeholder="Type here to test your keyboard (not scored)" />
    <p className="mt-2 text-[11px] text-sibs-muted">This practice field does not start either passage timer.</p>
  </div>;
  if (!media) return null;
  return <div className="rounded-xl border border-sibs-border bg-[#f8fafc] p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs font-bold"><Headphones size={17}/> Check your sound before you start</div>
      <button type="button" className="inline-flex h-9 items-center gap-2 rounded-lg border border-sibs-border bg-white px-3 text-xs font-bold hover:bg-slate-50" onClick={async () => {
        try {
          if (!window.AudioContext && !window.webkitAudioContext) throw new Error('Audio is not supported in this browser.');
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          const ctx = new AudioContextClass();
          const oscillator = ctx.createOscillator(); const volume = ctx.createGain();
          volume.gain.value = 0.06; oscillator.frequency.value = 523.25;
          oscillator.connect(volume); volume.connect(ctx.destination);
          await ctx.resume(); oscillator.start(); oscillator.stop(ctx.currentTime + 0.18);
          oscillator.onended = () => { void ctx.close(); };
          setTestSound('Sound test played.');
        } catch { setTestSound('Sound could not play. Check your device volume and browser permissions.'); }
      }}><Volume2 size={15}/> Play test sound</button>
    </div>
    {testSound && <p className="mt-2 text-[11px] text-sibs-secondary" role="status">{testSound}</p>}
    {media === 'video' && <p className="mt-2 text-[11px] text-sibs-muted">Your video briefing unlocks its question after the complete video is viewed.</p>}
  </div>;
}

/** Pre-module tutorial screen. Question content and timers are owned by the Server. */
export default function CsrFitModuleInstructions({ moduleNumber, moduleOneCount = 70, moduleLimits = limits, totalRemainingMs, overallLimitMinutes = 110, candidateName, starting, onBegin, error = '' }) {
  const moduleIndex = Math.min(6, Math.max(0, Number(moduleNumber || 1) - 1));
  const guide = GUIDES[moduleIndex];
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(false); }, [moduleIndex]);
  const remainingMinutes = Math.max(0, Math.ceil((Number(totalRemainingMs) || 0) / 60_000));
  const totalExpired = Number(totalRemainingMs) <= 0;

  return <section className="mt-5 w-full overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-sm" aria-labelledby="csr-fit-module-title">
    <div className="border-b border-sibs-border bg-[#f8fafc] px-5 py-5 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-extrabold text-sibs-navy"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sibs-navy text-white">{moduleNumber}</span> Module {moduleNumber} of 7</span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-sibs-border bg-white px-3 py-2 text-[11px] font-bold text-sibs-secondary"><LockKeyhole size={14}/> Instructions · Not yet started</span>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1.5" aria-label={`Module ${moduleNumber} of seven`}>
        {names.map((name, i) => <span key={name} aria-label={`Module ${i + 1}${i < moduleIndex ? ' completed' : i === moduleIndex ? ' current' : ' upcoming'}`} className={`h-1.5 rounded-full ${i < moduleIndex ? 'bg-[#2e7d5b]' : i === moduleIndex ? 'bg-sibs-orange' : 'bg-slate-200'}`} />)}
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-wide text-sibs-orange">Before you begin</p>
      <h2 id="csr-fit-module-title" className="mt-1 text-xl font-extrabold leading-tight text-sibs-navy sm:text-2xl">{names[moduleIndex]}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-sibs-navy">{guide.welcome}</p>
      <p className="mt-2 text-sm leading-6 text-sibs-secondary">{guide.description}</p>
      {guide.note && <p className="mt-2 text-xs leading-5 text-sibs-secondary">{guide.note}</p>}
    </div>

    <div className="space-y-5 px-5 py-6 sm:px-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-sibs-border p-3"><Clock3 size={19} className="shrink-0 text-sibs-navy"/><div><p className="text-[10px] font-bold uppercase text-sibs-muted">Module time</p><p className="mt-1 text-sm font-extrabold">{moduleIndex===4?'1 minute per typing round':`${moduleLimits[moduleIndex]} minutes`}</p></div></div>
        <div className="flex items-center gap-3 rounded-xl border border-sibs-border p-3"><ClipboardIcon/><div><p className="text-[10px] font-bold uppercase text-sibs-muted">Assessment</p><p className="mt-1 text-xs font-extrabold leading-5">{moduleIndex === 0 ? `${moduleOneCount} multiple-choice questions` : guide.format}</p></div></div>
        <div className="flex items-center gap-3 rounded-xl border border-sibs-border p-3"><ShieldCheck size={19} className="shrink-0 text-sibs-navy"/><div><p className="text-[10px] font-bold uppercase text-sibs-muted">Total time left</p><p className="mt-1 text-sm font-extrabold">{remainingMinutes} min</p></div></div>
      </div>
      <div className="space-y-5" aria-label="Module instructions and rules">
        {guide.sections.map(section => <section key={section.title}>
          <h3 className="text-sm font-extrabold text-sibs-navy">{section.title}</h3>
          {section.intro && <p className="mt-2 text-xs leading-5 text-sibs-secondary">{section.intro}</p>}
          <ul className="mt-3 space-y-3">
            {section.items.map((item, index) => <li key={`${section.title}-${index}`} className="flex gap-3 text-sm leading-6 text-sibs-secondary">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sibs-navy" />
              <span><strong className="font-extrabold text-sibs-navy">{item.label}{item.label ? ': ' : ''}</strong>{csrFitGuideText(item.text, moduleOneCount)}</span>
            </li>)}
          </ul>
        </section>)}
      </div>
      <Practice key={moduleNumber} example={guide.example}/>
      <AudioReadiness media={guide.media}/>
      <div className="flex gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3 text-xs leading-5 text-sibs-secondary">
        <Clock3 size={18} className="mt-0.5 shrink-0 text-sibs-navy"/>
        <div><strong className="text-sibs-navy">Timing:</strong> {moduleIndex===4?<>Each 60-second typing round begins on its own first keystroke. Clicking <strong>Start Module 5</strong> does not start either round. The assessment's overall</>:<>This module's timer begins when you select <strong>Start Module {moduleNumber}</strong>. The assessment's overall</>} {overallLimitMinutes}-minute timer is already running and cannot be paused. After a timer expires, any unfinished items are recorded as timed out.</div>
      </div>
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p>}
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-sibs-border p-3 text-sm text-sibs-secondary">
        <input type="checkbox" checked={ready} onChange={event => setReady(event.target.checked)} className="mt-1 h-4 w-4 accent-[#082e53]"/>
        <span>I have read the instructions, tested my equipment if needed, and am ready to begin this timed module.</span>
      </label>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sibs-border bg-[#f8fafc] px-5 py-4 sm:px-8">
      <span className="text-[11px] text-sibs-muted">{candidateName ? `Candidate: ${candidateName}` : 'SiBS CSR-Fit Assessment'} · Questions cannot be skipped</span>
      <button type="button" onClick={onBegin} disabled={!ready || starting || totalExpired}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sibs-navy px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#174a75] disabled:cursor-not-allowed disabled:opacity-40">
        {starting ? 'Starting module…' : <>Start Module {moduleNumber} <ArrowRight size={16}/></>}
      </button>
    </div>
  </section>;
}

function ClipboardIcon() { return <MousePointerClick size={19} className="shrink-0 text-sibs-navy"/>; }
