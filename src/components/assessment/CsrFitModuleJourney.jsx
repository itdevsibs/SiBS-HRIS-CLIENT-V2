import { useState } from 'react';
import { CheckCircle2, ClipboardList, Clock3, LockKeyhole } from 'lucide-react';
import {
  CSR_FIT_MODULE_GUIDES,
  CSR_FIT_MODULE_LIMITS,
  CSR_FIT_MODULE_NAMES,
  csrFitGuideText,
} from './csrFitModuleGuides';

// The arrow steps provide an informational preview before an attempt starts.
// During a timed attempt, progression is read-only and is always sourced from
// the Server's session.current. This component never changes the exam module.
const ARROW_SHAPE_FIRST = 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%)';
const ARROW_SHAPE = 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%, 15px 50%)';

export default function CsrFitModuleJourney({ activeModule = 1, preview = false, showDetails = true, compact = false, moduleOneCount = 70, moduleLimits = CSR_FIT_MODULE_LIMITS }) {
  const [previewModule, setPreviewModule] = useState(1);
  const current = Math.min(7, Math.max(1, Number(activeModule) || 1));
  const selected = preview ? previewModule : current;
  const guide = CSR_FIT_MODULE_GUIDES[selected - 1];

  return <section className="rounded-2xl border border-sibs-border bg-white p-4 shadow-sm sm:p-5" aria-label="Assessment module journey">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <ClipboardList size={16} className="text-sibs-navy" />
        <h3 className="text-sm font-extrabold text-sibs-navy">Your assessment journey</h3>
      </div>
      <p className="text-[11px] font-medium text-sibs-muted">
        {preview ? 'Select a step to preview its instructions · Preview only' : 'Modules are completed in sequence · No skipping'}
      </p>
    </div>
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-7" role={preview ? 'tablist' : 'list'} aria-label="Seven assessment modules">
      {CSR_FIT_MODULE_NAMES.map((title, index) => {
        const number = index + 1;
        const selectedStep = number === selected;
        const done = !preview && number < current;
        const future = !preview && number > current;
        const colors = selectedStep ? 'bg-[#082e53] text-white' : done ? 'bg-[#e8f2ed] text-[#155b43]' : 'bg-[#f1f4f7] text-sibs-navy';
        const content = <>
          <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide">
            {done ? <CheckCircle2 size={12} /> : future ? <LockKeyhole size={11} /> : null}
            Step {number}
          </span>
          <span className="mt-1 break-words text-[11px] font-extrabold leading-4">{title}</span>
          <span className={`mt-1 text-[10px] font-semibold ${selectedStep ? 'text-white/75' : 'text-sibs-muted'}`}>
            {index===4?'1 min × 2 rounds':`${moduleLimits[index]} min`}
          </span>
        </>;
        const arrowClasses = `flex min-h-[150px] w-full flex-col items-start justify-center py-3 pl-5 pr-5 text-left transition-colors ${colors}`;
        const shape = { clipPath: index === 0 ? ARROW_SHAPE_FIRST : ARROW_SHAPE };
        return preview ? <button
          type="button" role="tab" id={`csr-fit-preview-tab-${number}`} aria-controls="csr-fit-journey-detail"
          aria-selected={selectedStep} key={title} onClick={() => setPreviewModule(number)}
          className={`${arrowClasses} cursor-pointer hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sibs-orange`}
          style={shape} title={`Preview Module ${number}: ${title}`}>
          {content}
        </button> : <div key={title} role="listitem" aria-current={selectedStep ? 'step' : undefined}
          className={`${arrowClasses} ${future ? 'opacity-65' : ''}`} style={shape}>
          {content}
        </div>;
      })}
    </div>
    {showDetails && <div id="csr-fit-journey-detail" role={preview ? 'tabpanel' : undefined}
      aria-labelledby={preview ? `csr-fit-preview-tab-${selected}` : undefined}
      className="mt-4 rounded-xl border border-sibs-border bg-[#f8fafc] px-4 py-4 sm:px-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-orange">{preview ? 'Module preview' : 'Current module'} · Step {selected} of 7</p>
          <h4 className="mt-1 text-sm font-extrabold text-sibs-navy">{CSR_FIT_MODULE_NAMES[selected - 1]}</h4>
          <p className="mt-1.5 text-xs leading-5 text-sibs-secondary">{guide.description}</p>
          {guide.note && <p className="mt-2 text-[11px] leading-5 text-sibs-secondary">{guide.note}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-sibs-navy">
            <span className="flex items-center gap-1.5"><ClipboardList size={13} /> {selected === 1 ? `${moduleOneCount} multiple-choice questions` : guide.format}</span>
            <span className="flex items-center gap-1.5"><Clock3 size={13} /> {selected===5?'1 min per round (×2)':`${moduleLimits[selected - 1]} min max`}</span>
          </div>
        </div>
        <div className="lg:border-l lg:border-sibs-border lg:pl-5">
          <p className="text-[11px] font-extrabold text-sibs-navy">{guide.heading}</p>
          <div className="mt-2 space-y-3">
            {(compact ? guide.sections.slice(0, 1) : guide.sections).map(section => <section key={section.title}>
              <h5 className="text-[11px] font-extrabold text-sibs-navy">{section.title}</h5>
              <ul className="mt-1 space-y-1.5">
                {(compact ? section.items.slice(0, 2) : section.items).map((item, i) => <li key={`${section.title}-${i}`} className="flex gap-2 text-[11px] leading-5 text-sibs-secondary">
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sibs-navy" />
                  <span><strong className="font-extrabold text-sibs-navy">{item.label}{item.label ? ': ' : ''}</strong>{csrFitGuideText(item.text, moduleOneCount)}</span>
                </li>)}
              </ul>
            </section>)}
          </div>
          {preview && <p className="mt-3 text-[10px] font-semibold text-sibs-muted">Viewing instructions does not start a module or unlock later questions.</p>}
        </div>
      </div>
    </div>}
  </section>;
}
