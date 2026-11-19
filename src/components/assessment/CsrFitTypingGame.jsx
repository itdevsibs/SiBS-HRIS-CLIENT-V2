import { useMemo, useRef } from 'react';
import { CheckCircle2, Clock3, Keyboard, RotateCcw, Target, Zap } from 'lucide-react';

// Match the HRIS Server's exact-position typing score: spaces, case, and
// punctuation count, and one standard word is five correctly typed characters.
export function calculateTypingGameStats(reference = '', typed = '', elapsedMs = 0) {
  const targetChars = Array.from(String(reference || ''));
  const typedChars = Array.from(String(typed || ''));
  const correct = typedChars.reduce((total, character, index) => total + (character === targetChars[index] ? 1 : 0), 0);
  const mistakes = typedChars.length - correct;
  const accuracy = typedChars.length ? Math.round(correct / typedChars.length * 10000) / 100 : 0;
  const seconds = Math.min(60, Math.max(0, Number(elapsedMs) / 1000));
  const wpm = seconds > 0 ? Math.round((correct / 5) / (seconds / 60) * 100) / 100 : 0;
  const progress = targetChars.length ? Math.min(100, typedChars.length / targetChars.length * 100) : 0;
  return { correct, mistakes, accuracy, wpm, progress, typedChars, targetChars, completed: typedChars.length >= targetChars.length };
}

function Metric({ icon: Icon, label, value, suffix, detail, valueColor = 'text-sibs-navy' }) {
  return <div className="rounded-xl border border-sibs-border bg-white px-3 py-3 sm:px-4">
    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-sibs-muted"><Icon size={13}/>{label}</div>
    <div className={`mt-1.5 flex items-baseline gap-1 text-xl font-extrabold tabular-nums sm:text-2xl ${valueColor}`}>{value}<span className="text-[11px] font-bold text-sibs-muted">{suffix}</span></div>
    {detail && <p className="mt-0.5 text-[10px] font-medium text-sibs-muted">{detail}</p>}
  </div>;
}

/**
 * Purely visual/interaction layer for Module 5.
 * The existing HRIS API remains authoritative for starts, 60-second deadlines,
 * autosaved text, module advancement, and final grading.
 */
export default function CsrFitTypingGame({
  title = '', reference = '', value = '', onChange,
  startedAtMs = 0, timeLeftMs = 60000, disabled = false, onIntegrityEvent = () => {},
}) {
  const inputRef = useRef(null);
  const typed = String(value || '');
  const timeRemaining = Math.max(0, Number(timeLeftMs) || 0);
  const isStarted = Number(startedAtMs) > 0;
  const isFinished = isStarted && timeRemaining <= 0;
  const elapsedMs = isStarted ? Math.min(60000, Math.max(0, 60000 - timeRemaining)) : 0;
  const stats = useMemo(() => calculateTypingGameStats(reference, typed, elapsedMs), [reference, typed, elapsedMs]);
  const canType = !disabled && !isFinished;
  const showResult = isStarted && (typed.length > 0 || isFinished);
  const accuracyPass = stats.accuracy >= 90;
  const wpmPass = stats.wpm >= 40;
  const timeText = `${String(Math.floor(Math.ceil(timeRemaining / 1000) / 60)).padStart(2, '0')}:${String(Math.ceil(timeRemaining / 1000) % 60).padStart(2, '0')}`;
  const currentIndex = stats.typedChars.length;

  const handleKeyboard = event => {
    if ((event.ctrlKey || event.metaKey) && ['v', 'c', 'x'].includes(event.key.toLowerCase())) {
      event.preventDefault();
      onIntegrityEvent('PASTE_BLOCKED');
    }
  };

  return <section aria-label={`${title} interactive typing test`} className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2"><span className="rounded-lg bg-blue-50 p-2 text-sibs-navy"><Keyboard size={18}/></span>
        <div><h3 className="text-sm font-extrabold sm:text-base">{title}</h3><p className="text-[11px] text-sibs-muted">Interactive typing challenge · 60 seconds per passage</p></div>
      </div>
      <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-extrabold tabular-nums ${timeRemaining <= 10000 ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-sibs-border bg-sibs-surface text-sibs-navy'}`}>
        <Clock3 size={14}/>{timeText}
      </span>
    </div>

    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Metric icon={Zap} label="Live speed" value={showResult ? stats.wpm.toFixed(1) : '—'} suffix="WPM" detail="Target: 40 WPM" valueColor={showResult && wpmPass ? 'text-emerald-700' : 'text-sibs-navy'}/>
      <Metric icon={Target} label="Accuracy" value={showResult ? stats.accuracy.toFixed(1) : '—'} suffix="%" detail="Target: 90%" valueColor={showResult ? accuracyPass ? 'text-emerald-700' : 'text-rose-700' : 'text-sibs-navy'}/>
      <Metric icon={RotateCcw} label="Mistakes" value={stats.mistakes} suffix="errors" detail="Correct with Backspace" valueColor={stats.mistakes > 0 ? 'text-rose-700' : 'text-sibs-navy'}/>
      <Metric icon={Keyboard} label="Progress" value={Math.round(stats.progress)} suffix="%" detail={`${stats.typedChars.length} of ${stats.targetChars.length} characters`}/>
    </div>

    <div className="overflow-hidden rounded-xl border border-sibs-border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sibs-border bg-sibs-surface px-4 py-3">
        <span className="text-xs font-extrabold text-sibs-navy">Follow the highlighted text</span>
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-sibs-muted">
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-emerald-400"/>Correct</span>
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-rose-400"/>Incorrect</span>
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-orange-400"/>Current</span>
        </div>
      </div>
      <div className="px-4 py-5 text-[15px] font-medium leading-8 tracking-[0.005em] text-slate-500 sm:px-5" aria-label="Reference passage">
        <div className="whitespace-pre-wrap break-words select-none">
          {stats.targetChars.map((character, index) => {
            const wasTyped = index < currentIndex;
            const correct = wasTyped && stats.typedChars[index] === character;
            const incorrect = wasTyped && !correct;
            const current = index === currentIndex && !isFinished;
            const display = character === ' ' && (incorrect || current) ? '\u00a0' : character;
            const style = correct ? 'rounded-sm bg-emerald-50 text-emerald-800' : incorrect ? 'rounded-sm bg-rose-200 font-bold text-rose-800 underline decoration-rose-500 decoration-2 underline-offset-4' : current ? 'border-l-2 border-sibs-orange bg-orange-100 text-sibs-navy animate-pulse' : 'text-slate-500';
            return <span key={index} className={style}>{display}</span>;
          })}
        </div>
      </div>
      <div className="h-1.5 w-full bg-slate-100" role="progressbar" aria-label="Typing progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(stats.progress)}>
        <div className="h-full bg-[#082e53] transition-[width] duration-150" style={{width:`${stats.progress}%`}}/>
      </div>
    </div>

    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><label htmlFor="csr-fit-typing-input" className="text-xs font-extrabold">Type here using your keyboard</label>
        <span className="text-[11px] font-semibold text-sibs-muted">{!isStarted ? 'Timer starts on your first key press' : isFinished ? 'Time completed' : 'Typing test in progress'}</span>
      </div>
      <textarea id="csr-fit-typing-input" ref={inputRef} value={typed} maxLength={stats.targetChars.length} onChange={event => canType && onChange(event.target.value)}
        disabled={!canType} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
        onKeyDown={handleKeyboard}
        onPaste={event => {event.preventDefault();onIntegrityEvent('PASTE_BLOCKED');}}
        onCopy={event => {event.preventDefault();onIntegrityEvent('COPY_BLOCKED');}}
        onCut={event => {event.preventDefault();onIntegrityEvent('COPY_BLOCKED');}}
        onDrop={event => {event.preventDefault();onIntegrityEvent('PASTE_BLOCKED');}}
        onContextMenu={event => {event.preventDefault();onIntegrityEvent('CONTEXT_MENU_BLOCKED');}}
        aria-describedby="csr-fit-typing-feedback" aria-label="Typing test input"
        placeholder="Click here and type the highlighted passage. Mistakes appear in red above."
        className={`min-h-28 w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm leading-7 text-sibs-navy outline-none transition focus:ring-2 focus:ring-sibs-navy/10 disabled:cursor-not-allowed disabled:bg-slate-50 ${stats.mistakes > 0 ? 'border-rose-300 focus:border-rose-400' : 'border-sibs-border focus:border-sibs-navy'}`}/>
      <div id="csr-fit-typing-feedback" className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <span className={stats.mistakes ? 'font-bold text-rose-700' : 'font-semibold text-sibs-muted'}>
          {isFinished ? 'Time is up. Your typed text has been saved for assessment scoring.' : stats.mistakes ? 'Red highlights indicate mismatches. Use Backspace to correct mistakes.' : 'Keep typing. Correct characters turn green as you go.'}
        </span>
        {stats.completed && <span className="inline-flex items-center gap-1 font-bold text-emerald-700"><CheckCircle2 size={13}/> Passage completed</span>}
      </div>
    </div>
  </section>;
}
