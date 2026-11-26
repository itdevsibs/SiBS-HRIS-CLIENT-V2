import { Activity, Clock3 } from 'lucide-react';
import { useState } from 'react';

const LABELS = {
  ASSESSMENT_STARTED:'Assessment session created', MODULE_STARTED:'Module started', MODULE_COMPLETED:'Module completed', MODULE_TIMED_OUT:'Module timed out', ASSESSMENT_SUBMITTED:'Assessment submitted',
  EXAM_VIEW_OPENED:'Assessment page opened', PAGE_RELOADED:'Assessment page refreshed', PAGE_DEPARTURE:'Assessment page left (closed, refreshed or navigated away)',
  TAB_HIDDEN:'Assessment tab hidden', TAB_VISIBLE:'Assessment tab visible again', WINDOW_BLUR:'Assessment window lost focus', WINDOW_FOCUS:'Assessment window regained focus',
  FULLSCREEN_EXIT:'Fullscreen exited', FULLSCREEN_RESUMED:'Returned to fullscreen', ESCAPE_BLOCKED:'Escape key blocked', BROWSER_SHORTCUT_BLOCKED:'Browser shortcut blocked',
  COPY_BLOCKED:'Copy or cut blocked', PASTE_BLOCKED:'Paste or external drop blocked', CONTEXT_MENU_BLOCKED:'Browser right-click blocked',
};
const attention = new Set(['PAGE_DEPARTURE','PAGE_RELOADED','TAB_HIDDEN','WINDOW_BLUR','FULLSCREEN_EXIT','ESCAPE_BLOCKED','BROWSER_SHORTCUT_BLOCKED','COPY_BLOCKED','PASTE_BLOCKED','CONTEXT_MENU_BLOCKED']);
const format = new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Manila',dateStyle:'medium',timeStyle:'medium'});
export default function CsrFitActivityLog({ log, loading=false, error='', onRefresh, live=false, verified=false }) {
  // Page 1 always contains the newest events. Sort a filtered copy, not the input log.
  const [page,setPage]=useState(1);
  const events=Array.isArray(log?.events)?log.events.filter(event=>LABELS[event?.type]&&Number.isFinite(event.atMs)&&event.atMs>0).reverse().sort((a,b)=>b.atMs-a.atMs):[];
  const pageCount=Math.max(1,Math.ceil(events.length/10)), current=Math.min(page,pageCount);
  return <section className="overflow-hidden rounded-xl border border-sibs-border bg-white" aria-label="Applicant activity logs">
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-sibs-border px-4 py-3">
      <div className="flex min-w-0 items-center gap-2"><Activity size={18} className="shrink-0 text-sibs-orange"/><div><h3 className="text-sm font-extrabold text-sibs-navy">Activity Logs</h3><p className="mt-0.5 text-[11px] text-sibs-secondary">Recorded assessment activity · Philippine time (PHT)</p></div></div>
      {live && <span role="status" className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold ${verified&&!error?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-sibs-secondary'}`}><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${verified&&!error?'bg-emerald-600':'bg-slate-400'}`}/>{error?'Reconnecting':verified?'Live updates':'Connecting…'}</span>}
      {!live && onRefresh && <button type="button" disabled={loading} onClick={onRefresh} className="rounded-lg border border-sibs-border px-3 py-2 text-[11px] font-bold text-sibs-navy disabled:opacity-50">{loading?'Checking…':'Check latest'}</button>}
    </header>
    {error && <p role="alert" className="px-4 py-3 text-xs text-rose-700">{error}</p>}
    <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-sibs-surface text-[10px] font-extrabold uppercase text-sibs-navy"><tr><th scope="col" className="px-4 py-3">Date &amp; Time</th><th scope="col" className="px-4 py-3">Module</th><th scope="col" className="px-4 py-3">Activity</th><th scope="col" className="px-4 py-3">Source</th></tr></thead><tbody className="divide-y divide-sibs-border">
    {events.slice((current-1)*10,current*10).map((event,index)=><tr key={`${event.atMs}-${event.type}-${index}`} className="hover:bg-orange-50/40"><td className="whitespace-nowrap px-4 py-3 text-sibs-secondary"><span className="inline-flex items-center gap-1.5"><Clock3 size={12}/>{format.format(event.atMs)}</span></td><td className="whitespace-nowrap px-4 py-3 font-bold text-sibs-navy">{event.module?`Module ${event.module}`:'—'}</td><td className="min-w-[180px] px-4 py-3"><span className={`font-bold ${attention.has(event.type)?'text-amber-700':'text-sibs-navy'}`}>{LABELS[event.type]}</span></td><td className="px-4 py-3 text-sibs-secondary">{event.source==='SERVER'?'Server':'Browser'}</td></tr>)}
    {!events.length && <tr><td colSpan={4} className="px-4 py-7 text-center text-sibs-muted">{loading?'Loading activity logs…':error?'Activity could not be verified.':'No activity records available.'}</td></tr>}
    </tbody></table></div>
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-sibs-border px-4 py-3 text-[11px] text-sibs-secondary"><span>{events.length} recorded events</span>{pageCount>1&&<div className="flex items-center gap-2"><button type="button" disabled={current===1} onClick={()=>setPage(current-1)} className="rounded-lg border border-sibs-border px-2 py-1 disabled:opacity-40">Previous</button><span>Page {current} of {pageCount}</span>{live&&current!==1&&<button type="button" onClick={()=>setPage(1)} className="rounded-lg border border-sibs-border px-2 py-1 font-bold text-sibs-navy">Latest</button>}<button type="button" disabled={current===pageCount} onClick={()=>setPage(current+1)} className="rounded-lg border border-sibs-border px-2 py-1 disabled:opacity-40">Next</button></div>}</div>
    <div className="space-y-1 border-t border-sibs-border bg-sibs-surface px-4 py-3 text-[11px] leading-5 text-sibs-muted">
      {log?.legacyCoverage && <p>Earlier attempts may contain only basic integrity events; missing history cannot be reconstructed.</p>}
      {log?.truncated && <p>Activity recording reached its storage limit; additional events may be missing.</p>}
      <p>Browser-reported events are best effort. They do not identify other tabs or applications and are not proof of misconduct. Unexpected exits or lost connections may not be recorded.</p>
    </div>
  </section>;
}
