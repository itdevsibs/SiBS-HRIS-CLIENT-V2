import { Check, CheckCircle2, ClipboardCheck, Loader2, ShieldCheck } from 'lucide-react';
import { CSR_FIT_MODULE_NAMES } from './csrFitModuleGuides';

const stages = [
  { label: 'Save responses', detail: 'Preserving your recorded answers' },
  { label: 'Verify completion', detail: 'Confirming progress with SiBS HRIS' },
  { label: 'Prepare next step', detail: 'Opening the next stage of your assessment' },
];

/**
 * Shared by Public and Online Assessment. The page controls phase based on actual API responses;
 * this is a visual transition, not a second timer or a source of progress truth.
 */
export default function PublicCsrFitModuleTransition({
  moduleNumber = 1,
  nextModuleNumber = null,
  phase = 'saving',
  assessmentLabel = 'SiBS CSR-Fit Public Assessment',
}) {
  const from = Math.min(7, Math.max(1, Number(moduleNumber) || 1));
  const next = Number(nextModuleNumber);
  const isFinal = !Number.isInteger(next) || next < 1 || next > 7;
  const ready = phase === 'ready';
  const currentStep = phase === 'saving' ? 0 : phase === 'preparing' ? 1 : 2;
  const currentName = CSR_FIT_MODULE_NAMES[from - 1] || `Module ${from}`;
  const nextName = !isFinal ? CSR_FIT_MODULE_NAMES[next - 1] || `Module ${next}` : null;
  const headline = ready
    ? isFinal ? 'Assessment successfully submitted' : `Module ${from} completed`
    : isFinal ? 'Submitting your completed assessment' : `Finishing Module ${from}`;
  const supporting = ready
    ? isFinal ? 'Your responses have been submitted. Opening the confirmation…'
      : `Your progress is saved. Preparing Module ${next}…`
    : 'Please keep this page open while we confirm your saved progress.';

  return (
    <div className="fixed inset-0 z-[1550] flex items-center justify-center overflow-y-auto bg-[#031b33]/75 p-4 backdrop-blur-[5px]"
      role="status" aria-label={headline} aria-live="polite" aria-busy={!ready}>
      <section className="w-full max-w-[510px] overflow-hidden rounded-[22px] border border-white/20 bg-white shadow-[0_24px_75px_rgba(2,22,44,0.28)]">
        <header className="relative overflow-hidden bg-[#082e53] px-6 pb-7 pt-7 text-center text-white sm:px-9">
          <div aria-hidden="true" className="pointer-events-none absolute -left-12 -top-16 h-44 w-44 rounded-full bg-white/5 blur-2xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -right-12 h-48 w-48 rounded-full bg-[#ff5c28]/15 blur-2xl" />
          <p className="relative text-[10px] font-extrabold uppercase tracking-[.16em] text-white/70">
            {assessmentLabel}
          </p>
          <div className="relative mx-auto mt-5 flex h-[94px] w-[94px] items-center justify-center" aria-hidden="true">
            {!ready && (
              <>
                <span className="absolute inset-0 rounded-full border-[3px] border-white/15" />
                <span className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#ff7348] border-r-[#ff7348] motion-safe:animate-spin" />
                <span className="absolute inset-2 rounded-full border border-white/20 motion-safe:animate-pulse" />
              </>
            )}
            {ready && (
              <>
                <span className="absolute inset-0 rounded-full border border-emerald-300/40 bg-emerald-400/10" />
                <span className="absolute inset-0 rounded-full bg-emerald-300/15 motion-safe:animate-ping" />
              </>
            )}
            <span className={`relative flex h-[66px] w-[66px] items-center justify-center rounded-full shadow-lg ${ready ? 'bg-white text-emerald-600' : 'bg-white/10 text-white'}`}>
              {ready ? <CheckCircle2 size={35} strokeWidth={2.3} /> : <ClipboardCheck size={31} strokeWidth={1.9} />}
            </span>
          </div>
          <h2 className="relative mt-4 text-lg font-extrabold leading-snug sm:text-xl">{headline}</h2>
          <p className="relative mt-2 text-xs leading-5 text-white/80">{supporting}</p>
        </header>

        <div className="px-6 pb-6 pt-6 sm:px-9">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">Completed module</p>
              <p className="mt-1 text-sm font-extrabold text-sibs-navy">{from}. {currentName}</p>
            </div>
            <span className="shrink-0 rounded-lg border border-sibs-border bg-sibs-surface px-3 py-2 text-xs font-extrabold text-sibs-navy">{from} / 7</span>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-1.5" aria-label={`${ready ? from : from - 1} of seven modules confirmed complete`}>
            {Array.from({ length: 7 }, (_, i) => {
              const done = i + 1 < from || (ready && i + 1 === from);
              const active = i + 1 === from && !ready;
              return <span key={i} className={`h-2 rounded-full transition-colors duration-500 ${done ? 'bg-emerald-500' : active ? 'bg-[#ff5c28] motion-safe:animate-pulse' : 'bg-slate-200'}`} />;
            })}
          </div>

          <div className="mt-6 space-y-3">
            {stages.map((stage, index) => {
              const complete = index < currentStep || ready;
              const active = index === currentStep && !ready;
              return (
                <div className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors duration-300 ${active ? 'border-[#ffc6b3] bg-[#fff4ee]' : complete ? 'border-emerald-100 bg-emerald-50/60' : 'border-sibs-border bg-white'}`} key={stage.label}>
                  <span aria-hidden="true" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${complete ? 'bg-emerald-600 text-white' : active ? 'bg-[#ff5c28] text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {complete ? <Check size={16} strokeWidth={3} /> : active ? <Loader2 size={17} className="motion-safe:animate-spin" /> : <span className="text-xs font-extrabold">{index + 1}</span>}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-extrabold ${active || complete ? 'text-sibs-navy' : 'text-sibs-muted'}`}>{isFinal && index === 2 ? 'Complete submission' : stage.label}</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-sibs-secondary">{isFinal && index === 2 ? 'Opening your submitted assessment confirmation' : stage.detail}</p>
                  </div>
                  {active && <span className="text-[10px] font-bold text-[#c44822]">Processing</span>}
                  {complete && <span className="text-[10px] font-bold text-emerald-700">Done</span>}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#d6e6f3] bg-[#f2f7fb] px-3.5 py-3">
            <ShieldCheck size={17} className="mt-0.5 shrink-0 text-sibs-navy" aria-hidden="true" />
            <p className="text-[11px] leading-5 text-sibs-secondary">
              {isFinal
                ? 'Final submission is being verified. Your saved answers and official assessment deadlines are not changed by this animation.'
                : <>Up next: <strong className="text-sibs-navy">Module {next} — {nextName}</strong>. The new module begins with its instructions. Existing deadlines continue unchanged.</>}
            </p>
          </div>
          <p className="mt-4 text-center text-[10px] font-semibold text-sibs-muted">Please do not refresh or close this tab during verification.</p>
        </div>
      </section>
    </div>
  );
}
