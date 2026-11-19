import { CheckCircle2, ClipboardList, Loader2, LockKeyhole } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

/** Uses the same pulse skeletons as the SiBS Candidate Pipeline loading state. */
export default function CsrFitAssessmentLoading({
  mode = 'skeleton', label = 'Loading your assessment…',
  moduleNumber = 1, nextModuleNumber = null, phase = 'saving',
}) {
  if (mode === 'module-transition') {
    const last = nextModuleNumber === null;
    const confirmed = phase === 'ready';
    const heading = confirmed
      ? last ? 'Assessment submitted' : `Module ${moduleNumber} finished`
      : last ? 'Submitting your assessment…' : `Finishing Module ${moduleNumber}…`;
    const detail = confirmed
      ? last ? 'Your assessment has been received. Opening your confirmation…'
        : `Preparing Module ${nextModuleNumber} instructions…`
      : 'Finalizing your answers and verifying your saved progress…';
    return <div className="fixed inset-0 z-[1550] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[3px]" role="status" aria-live="polite" aria-busy="true" aria-label={heading}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-2xl">
        <div className="border-b border-sibs-border px-6 py-5 text-center sm:px-7">
          <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${confirmed ? 'bg-emerald-50 text-emerald-700' : 'bg-[#e9f2fa] text-sibs-navy'}`}>
            {confirmed ? <CheckCircle2 size={29}/> : <Loader2 size={29} className="animate-spin"/>}
          </span>
          <h2 className="mt-4 text-lg font-extrabold text-sibs-navy">{heading}</h2>
          <p className="mt-1.5 text-xs leading-5 text-sibs-secondary">{detail}</p>
        </div>
        <div className="px-6 py-5 sm:px-7">
          <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-bold text-sibs-secondary">
            <span>Assessment progress</span>
            <span>Module {moduleNumber} of 7</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5" aria-label="Seven-module progress">
            {Array.from({length:7}, (_,i) => <span key={i} className={`h-2 rounded-full ${i+1 < moduleNumber || (confirmed && i+1 === moduleNumber) ? 'bg-emerald-600' : i+1 === moduleNumber ? 'bg-sibs-orange' : 'bg-slate-200'}`}/>)}
          </div>
          {!last && <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-sibs-border bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-bold text-sibs-navy"><ClipboardList size={17}/> Next: Module {nextModuleNumber}</div>
            <LockKeyhole size={15} className="text-sibs-muted" aria-hidden="true"/>
          </div>}
          <p className="mt-4 text-center text-[11px] text-sibs-muted">Please keep this page open. Your assessment timer continues.</p>
        </div>
      </div>
    </div>;
  }
  if (mode === 'overlay') {
    return <div className="fixed inset-0 z-[1550] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]" role="status" aria-live="polite" aria-busy="true">
      <div className="w-full max-w-xs rounded-2xl border border-sibs-border bg-white px-6 py-6 text-center shadow-2xl">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#e9f2fa] text-sibs-navy"><Loader2 size={26} className="animate-spin"/></span>
        <p className="mt-4 text-sm font-extrabold text-sibs-navy">{label}</p>
        <p className="mt-1 text-xs text-sibs-muted">Preserving your saved progress</p>
        <div className="mt-4 flex justify-center gap-1.5">
          {[0,1,2].map(n=><span key={n} className="h-1.5 w-9 animate-sibs-pulse rounded-full bg-sibs-tertiary-9" style={{animationDelay:`${n*160}ms`}}/>) }
        </div>
      </div>
    </div>;
  }
  return <section className="mt-5 rounded-2xl border border-sibs-border bg-white p-5 shadow-sm sm:p-7" role="status" aria-live="polite" aria-busy="true" aria-label="Loading CSR-Fit assessment">
    <div className="flex items-center gap-3 border-b border-sibs-border pb-5">
      <span className="rounded-xl bg-[#e9f2fa] p-3 text-sibs-navy"><ClipboardList size={21}/></span>
      <div className="flex flex-1 flex-col gap-2"><Skeleton className="h-4 w-52 max-w-full"/><Skeleton className="h-3 w-40 max-w-full"/></div>
      <Loader2 className="animate-spin text-sibs-navy" size={20}/>
    </div>
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      {[0,1,2].map(n=><div key={n} className="rounded-xl border border-sibs-border p-4"><Skeleton className="h-3 w-24"/><Skeleton className="mt-3 h-5 w-4/5"/><Skeleton className="mt-3 h-3 w-2/3"/></div>)}
    </div>
    <div className="mt-7 space-y-4"><Skeleton className="h-4 w-1/3"/><Skeleton className="h-11 w-full"/><Skeleton className="h-11 w-full"/><Skeleton className="h-11 w-3/4"/></div>
    <p className="mt-5 text-center text-xs text-sibs-muted">Loading your secure assessment…</p>
  </section>;
}
