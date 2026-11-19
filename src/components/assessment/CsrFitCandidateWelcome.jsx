import { useEffect, useState } from 'react';
import CsrFitModuleJourney from './CsrFitModuleJourney';
import {
  AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck,
  Clock3, Headphones, Keyboard, LockKeyhole, MonitorCheck, ShieldCheck,
} from 'lucide-react';

const readinessRules = [
  { title: 'I am using a desktop or laptop', detail: 'I have a working physical keyboard.', icon: Keyboard },
  { title: 'My equipment and surroundings are ready', detail: 'I have working audio, a quiet space and stable internet.', icon: Headphones },
  { title: 'I understand the assessment rules', detail: 'The overall timer cannot be paused; questions cannot be skipped.', icon: Clock3 },
  { title: 'I will complete the assessment independently', detail: 'Only permitted calculator/scratch paper in Module 1; no AI tools, solvers or other assistance.', icon: ShieldCheck },
];

function ReadonlyIdentity({ label, value, optional = false }) {
  return <label className="block min-w-0">
    <span className="mb-1.5 block text-[11px] font-bold text-sibs-navy">{label}</span>
    <span className="relative block">
      <input type="text" value={value || ''} readOnly aria-readonly="true"
        placeholder={optional ? 'Not provided' : undefined}
        className="h-11 w-full min-w-0 rounded-lg border border-sibs-border bg-slate-50 px-3 pr-9 text-[13px] font-semibold text-sibs-navy outline-none placeholder:text-slate-400" />
      <LockKeyhole size={14} aria-hidden="true" className="pointer-events-none absolute right-3 top-3.5 text-slate-400" />
    </span>
  </label>;
}

export default function CsrFitCandidateWelcome({ candidate, onStart, busy = false, error = '', mobile = false, overallLimitMinutes = 110 }) {
  const [step, setStep] = useState('identity');
  const [checks, setChecks] = useState([false, false, false, false]);
  const identityReady = Boolean(candidate?.firstName?.trim() && candidate?.lastName?.trim() && candidate?.email?.trim());
  const checksReady = checks.every(Boolean);
  useEffect(() => { setStep('identity'); setChecks([false, false, false, false]); }, [candidate?.candidateId]);

  return <section className="mx-auto mt-5 max-w-[1190px] overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-sm"
    aria-labelledby="csr-fit-welcome-title">
    <header className="border-b border-sibs-border px-5 py-5 sm:px-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-orange">Candidate assessment</p>
          <h2 id="csr-fit-welcome-title" className="mt-1 text-xl font-extrabold tracking-tight text-sibs-navy sm:text-2xl">SiBS CSR-Fit Online Assessment</h2>
          <p className="mt-1 text-xs leading-5 text-sibs-secondary">Review the seven assessment steps, verify your invitation, and check your equipment before you begin.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-sibs-border bg-slate-50 px-3 py-2 text-[11px] font-bold text-sibs-secondary">
          <ShieldCheck size={14} /> Invitation verified
        </span>
      </div>
    </header>

    {/* The journey appears above identity verification. Previews never alter exam progression. */}
    <div className="px-4 py-5 sm:px-7">
      <CsrFitModuleJourney preview />
    </div>

    <div className="border-t border-sibs-border px-5 py-6 sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-orange">Pre-assessment verification</p>
          <h3 className="mt-1 text-lg font-extrabold text-sibs-navy">{step === 'identity' ? 'Verify your information' : 'System readiness'}</h3>
        </div>
        <div className="flex items-center gap-2" aria-label={`Verification step ${step === 'identity' ? '1' : '2'} of 2`}>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sibs-navy"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-sibs-navy text-white">{step === 'ready' ? <CheckCircle2 size={13} /> : '1'}</span> Candidate details</span>
          <span className="h-px w-6 bg-slate-300" />
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${step === 'ready' ? 'text-sibs-navy' : 'text-sibs-muted'}`}><span className={`flex h-6 w-6 items-center justify-center rounded-full ${step === 'ready' ? 'bg-sibs-navy text-white' : 'bg-slate-100 text-slate-500'}`}>2</span> Readiness</span>
        </div>
      </div>
      <div className="mt-5">
        {step === 'identity' ? <>
          <div className="flex items-center gap-2"><ClipboardCheck size={17} className="text-sibs-navy" /><h4 className="text-sm font-extrabold">Your candidate details</h4></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <ReadonlyIdentity label="First name" value={candidate?.firstName} />
            <ReadonlyIdentity label="Middle name" value={candidate?.middleName} optional />
            <ReadonlyIdentity label="Last name" value={candidate?.lastName} />
          </div>
          <div className="mt-3 sm:max-w-lg"><ReadonlyIdentity label="Invitation email" value={candidate?.email} /></div>
          <p className="mt-4 flex gap-2 text-[11px] leading-5 text-sibs-muted"><LockKeyhole size={14} className="mt-0.5 shrink-0" />
            These details are read-only and come from your HRIS application. If anything is incorrect, contact the SiBS Career Team before starting.</p>
        </> : <>
          <div className="flex items-center gap-2"><MonitorCheck size={18} className="text-sibs-navy" /><h4 className="text-sm font-extrabold">Readiness checklist</h4></div>
          <p className="mt-1 text-xs text-sibs-muted">Complete all checks to start your assessment.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {readinessRules.map((rule, index) => {
              const Icon = rule.icon;
              return <label key={rule.title} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${checks[index] ? 'border-[#9cc6db] bg-[#f0f7fb]' : 'border-sibs-border bg-white hover:border-slate-300'}`}>
                <input type="checkbox" checked={checks[index]}
                  onChange={event => setChecks(previous => previous.map((checked, i) => i === index ? event.target.checked : checked))}
                  className="mt-1 h-4 w-4 accent-[#082e53]" />
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sibs-navy"><Icon size={16} /></span>
                <span className="min-w-0"><span className="block text-xs font-extrabold leading-5 text-sibs-navy">{rule.title}</span>
                  <span className="block text-[11px] leading-5 text-sibs-muted">{rule.detail}</span></span>
              </label>;
            })}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-sibs-muted">The {overallLimitMinutes}-minute overall timer continues through module instructions and disconnections. You cannot skip questions or restart a timed attempt.</p>
        </>}
      </div>
      {mobile && <div role="alert" className="mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><AlertCircle size={16} className="shrink-0" />A desktop or laptop is required for this assessment.</div>}
      {error && <div role="alert" className="mt-4 flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"><AlertCircle size={16} className="shrink-0" />{error}</div>}
      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-sibs-border pt-5">
        {step === 'ready' ? <button type="button" onClick={() => setStep('identity')} disabled={busy}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-sibs-border bg-white px-4 text-xs font-extrabold text-sibs-navy hover:bg-slate-50 disabled:opacity-50"><ArrowLeft size={14} /> Back</button> :
          <span className="text-[11px] text-sibs-muted">Step 1 of 2 · Candidate verification</span>}
        {step === 'identity' ? <button type="button" disabled={!identityReady || busy || mobile} onClick={() => setStep('ready')}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-sibs-navy px-5 text-xs font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-400">
          Continue <ArrowRight size={14}/></button> :
          <button type="button" disabled={!checksReady || !identityReady || busy || mobile} onClick={onStart}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-sibs-orange px-5 text-xs font-extrabold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-slate-400">
            {busy ? 'Starting assessment…' : 'Begin assessment'} <ArrowRight size={14}/></button>}
      </footer>
    </div>
  </section>;
}
