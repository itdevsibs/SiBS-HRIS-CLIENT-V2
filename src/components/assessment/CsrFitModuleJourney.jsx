import { CheckCircle2, ClipboardList, Clock3, LockKeyhole, ShieldCheck } from 'lucide-react';
import {
  CSR_FIT_MODULE_GUIDES,
  CSR_FIT_MODULE_LIMITS,
  CSR_FIT_MODULE_NAMES,
  csrFitGuideText,
} from './csrFitModuleGuides';

/**
 * Display-only assessment roadmap. The active module is supplied by the
 * server-controlled session. This component must never navigate or let a
 * candidate select a later module.
 */
export default function CsrFitModuleJourney({
  activeModule = 1,
  preview = false,
  showDetails = true,
  compact = false,
  moduleOneCount = 70,
  moduleLimits = CSR_FIT_MODULE_LIMITS,
}) {
  const current = Math.min(7, Math.max(1, Number(activeModule) || 1));
  const guide = CSR_FIT_MODULE_GUIDES[current - 1];
  const durationLabel = index => index === 4
    ? '1 min × 2 rounds'
    : `${moduleLimits[index] ?? CSR_FIT_MODULE_LIMITS[index]} min`;
  const instructionItems = guide.sections.flatMap(section => section.items.map(item => ({
    ...item,
    section: section.title,
  })));
  const shownInstructions = compact ? instructionItems.slice(0, 4) : instructionItems;

  return <section className="rounded-xl border border-[#cbdceb] bg-white p-4 shadow-sm sm:p-5"
    aria-label="Seven-module assessment journey">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ff5c28] text-white shadow-sm">
          <ClipboardList size={19} aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold leading-5 text-sibs-navy sm:text-base">Your assessment journey</h3>
          <p className="mt-0.5 text-xs leading-5 text-sibs-secondary">Seven modules, completed one after another.</p>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-md border border-[#cbdceb] bg-[#eef5fb] px-2.5 py-1.5 text-[11px] font-bold text-[#082e53]">
        <LockKeyhole size={13} aria-hidden="true" /> In sequence · No skipping
      </span>
    </div>

    {/* Keep the original seven-step arrow progression, not the newer rectangular cards.
        On narrow screens, scroll the arrows horizontally rather than stacking or shrinking text. */}
    <div className="min-w-0 overflow-x-auto pb-1" aria-label="Assessment progress, left to right">
      <ol className="grid w-full min-w-[900px] list-none grid-cols-7 gap-1.5 p-0"
        aria-label="Assessment modules in order">
        {CSR_FIT_MODULE_NAMES.map((name, index) => {
          const number = index + 1;
          const active = number === current;
          const completed = !preview && number < current;
          const arrowTheme = active
            ? 'bg-[#082e53] text-white'
            : completed
              ? 'bg-[#dcfce7] text-[#166534]'
              : 'bg-[#eaf2fa] text-[#082e53]';
          const textTone = active ? 'text-white/90' : completed ? 'text-[#166534]' : 'text-[#36546e]';
          const arrowClip = index === 0
            ? 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%)'
            : 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%, 15px 50%)';
          return <li key={name} aria-current={active ? 'step' : undefined}
            style={{ clipPath: arrowClip }}
            className={`relative flex min-h-[152px] min-w-0 select-none flex-col justify-center py-3.5 pr-[20px] ${index === 0 ? 'pl-3.5' : 'pl-[22px]'} ${arrowTheme}`}>
            {active && <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[5px] bg-[#ff5c28]" />}
            <span className={`flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide ${active ? 'text-[#ffad87]' : completed ? 'text-[#166534]' : 'text-[#ec5825]'}`}>
              {completed ? <CheckCircle2 size={12} aria-hidden="true" /> : null}
              Step {number}
            </span>
            <h4 className="mt-1.5 break-words text-[11px] font-extrabold leading-[1.4]">{name}</h4>
            <span className={`mt-2 flex items-center gap-1 text-[10px] font-semibold ${textTone}`}>
              <Clock3 size={12} className="shrink-0" aria-hidden="true" /> {durationLabel(index)}
            </span>
          </li>;
        })}
      </ol>
    </div>

    {showDetails && <div className="mt-4 overflow-hidden rounded-lg border border-[#cbdceb] bg-[#f0f6fc]"
      aria-label={`Module ${current} overview and instructions`}>
      <div className="grid lg:grid-cols-2">
        <div className="px-4 py-4 sm:px-5 sm:py-5 lg:border-r lg:border-[#cbdceb]">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#ff5c28] px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
              {preview ? 'First module' : `Module ${current} of 7`}
            </span>
            <span className="text-[11px] font-semibold text-sibs-muted">Overview</span>
          </div>
          <h4 className="mt-3 text-base font-extrabold leading-6 text-sibs-navy">{CSR_FIT_MODULE_NAMES[current - 1]}</h4>
          <p className="mt-2 text-[12px] leading-5 text-sibs-secondary">{guide.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#bfd4e7] bg-white px-2.5 py-2 text-[11px] font-bold text-[#082e53]">
              <ClipboardList size={14} aria-hidden="true" /> {current === 1 ? `${moduleOneCount} questions` : guide.format}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#bfd4e7] bg-white px-2.5 py-2 text-[11px] font-bold text-[#082e53]">
              <Clock3 size={14} aria-hidden="true" /> {durationLabel(current - 1)}
            </span>
          </div>
        </div>
        <div className="border-t border-[#cbdceb] bg-white px-4 py-4 sm:px-5 sm:py-5 lg:border-t-0">
          <div className="flex items-center gap-2 text-sibs-navy">
            <ShieldCheck size={17} aria-hidden="true" />
            <h5 className="text-[13px] font-extrabold">What you need to know</h5>
          </div>
          <ul className="mt-3 space-y-2.5">
            {shownInstructions.map((item, index) => <li key={`${item.section}-${index}`} className="flex items-start gap-2.5 text-[12px] leading-5 text-sibs-secondary">
              <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff5c28]" />
              <span><strong className="font-bold text-sibs-navy">{item.label}{item.label ? ': ' : ''}</strong>{csrFitGuideText(item.text, moduleOneCount)}</span>
            </li>)}
          </ul>
          {compact && <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-5 text-sibs-muted">
            Complete module instructions will appear before you begin each step.
          </p>}
        </div>
      </div>
    </div>}
  </section>;
}
