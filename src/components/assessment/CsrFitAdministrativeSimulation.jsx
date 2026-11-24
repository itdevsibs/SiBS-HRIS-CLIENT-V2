import { useState } from 'react';
import { ArrowRight, CheckCircle2, FileText, FolderOpen, Inbox, Save } from 'lucide-react';
import CsrFitWindowsDesktop from './CsrFitWindowsDesktop';
import SelectDropdown from '../ui/SelectDropdown';

const card = 'rounded-xl border border-sibs-border bg-white';
const field = 'h-10 w-full rounded-lg border border-sibs-border bg-white px-3 text-xs text-sibs-navy outline-none focus:border-sibs-navy';
const event = (type, details) => ({ type, ...details });

function CustomerWorkspace({ info, answer, disabled, saving, onSave }) {
  const source = info.source || {};
  const [opened, setOpened] = useState(Boolean(answer));
  const [values, setValues] = useState({customerName:answer?.customerName||'',accountNumber:answer?.accountNumber||'',callbackNumber:answer?.callbackNumber||'',category:answer?.category||'',notes:answer?.notes||''});
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [events, setEvents] = useState(Array.isArray(answer?.simulation?.actions) ? answer.simulation.actions : []);
  // Candidate may finalize inaccurate or incomplete work. Correctness is graded separately.
  const ready = !answer && !disabled && !saving && !submitting;
  function openTicket() { if (disabled) return; setOpened(true); setEvents(old => [...old, event('open_request', { requestId: 'SIBS-INBOX-4910' })].slice(-20)); }
  function change(key, val) { setValues(old => ({...old,[key]:val})); setDirty(true); }
  async function save() { if (ready && !disabled && !saving && !submitting) {
    setSubmitting(true);
    try { await onSave({...values,simulation:{version:2,actions: events}}); setDirty(false); }
    catch { /* Assessment parent displays the save error. */ }
    finally { setSubmitting(false); }
  } }
  return <div className="space-y-3">
    <div><h3 className="text-sm font-extrabold text-sibs-navy">Customer support case entry</h3><p className="mt-1 text-xs leading-5 text-sibs-muted">Open the incoming request, review the details, and enter your own support case. The system records your work; accuracy is evaluated afterward.</p></div>
    <section className={`${card} overflow-hidden`} aria-label="Simulated support inbox">
      <div className="flex items-center justify-between border-b border-sibs-border bg-sibs-surface px-3 py-2 text-xs font-extrabold"><span className="flex items-center gap-2"><Inbox size={15}/> SiBS Support Inbox</span><span className="text-[10px] font-semibold text-sibs-muted">Simulation only</span></div>
      <div className="grid gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)]">
        <div className="border-b border-sibs-border p-3 lg:border-b-0 lg:border-r">
          <p className="mb-2 text-[10px] font-extrabold uppercase text-sibs-muted">Incoming requests · 1</p>
          <button type="button" disabled={disabled} onClick={openTicket} className={`w-full rounded-lg border p-3 text-left transition ${opened?'border-blue-400 bg-blue-50':'border-sibs-border hover:border-blue-300'}`}>
            <span className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold"><span>Internet connectivity issue</span><span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800">{opened?'Opened':'New'}</span></span>
            <span className="mt-2 block text-xs font-semibold">{source.customerName}</span>
            <span className="mt-1 block text-[11px] text-sibs-muted">Account ending {String(source.accountNumber||'').slice(-4)} · Customer request</span>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-blue-700">{opened?'Request opened':'Open request'} <ArrowRight size={12}/></span>
          </button>
          {!opened && <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-sibs-secondary">Open the request before entering customer details.</p>}
          {opened && <div className="mt-3 rounded-lg border border-sibs-border bg-sibs-surface p-3 text-xs leading-6">
            <p className="mb-1 font-extrabold text-sibs-navy">Customer's original request</p>
            <p><b>Name:</b> {source.customerName}</p><p><b>Account:</b> {source.accountNumber}</p><p><b>Callback:</b> {source.callbackNumber}</p>
            <p className="mt-2 border-t border-sibs-border pt-2">{source.issue}</p>
          </div>}
        </div>
        <div className="p-3"><div className="flex items-center gap-2 border-b border-sibs-border pb-3 text-xs font-extrabold"><FileText size={15}/> New Case Record</div>
          {opened ? <div className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">{[
              ['customerName','Customer full name'],['accountNumber','Account number'],['callbackNumber','Callback phone']
            ].map(([key,label])=><label key={key} className="block sm:col-span-1"><span className="mb-1 block text-[11px] font-bold">{label} *</span><input className={field} disabled={disabled} value={values[key]} onChange={e=>change(key,e.target.value)} autoComplete="off"/></label>)}</div>
            <div><p className="mb-1 text-[11px] font-bold">Issue category *</p><SelectDropdown label="Issue category" hideLabel value={values.category} clearable={false} placeholder="Select a category" options={(info.categories||[]).map(name=>({value:name,label:name}))} onChange={value=>change('category',value)} buttonClassName="min-h-10 rounded-lg bg-white text-xs"/></div>
            <label className="block"><span className="mb-1 block text-[11px] font-bold">Interaction notes *</span><textarea value={values.notes} onChange={e=>change('notes',e.target.value)} disabled={disabled} rows={3} className="w-full resize-y rounded-lg border border-sibs-border bg-white px-3 py-2 text-xs text-sibs-navy outline-none focus:border-sibs-navy" placeholder="Summarize the customer's request in one sentence"/></label>
          </div> : <div className="flex min-h-48 flex-col items-center justify-center gap-2 text-center text-xs text-sibs-muted"><FolderOpen size={28}/> Open the incoming customer request to begin.</div>}
        </div>
      </div>
    </section>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] text-sibs-muted">Save is final, including incorrect or incomplete entries. It cannot be edited after submission.</p>{!answer && <button type="button" disabled={!ready} onClick={save} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-sibs-navy px-4 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"><Save size={14}/> {submitting || saving ? 'Saving...' : 'Save case record · Final'}</button>}</div>
    {answer && !dirty && <p className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 size={14}/> Customer case saved</p>}
  </div>;
}

/** Assessment-only desktop simulation. Neither task accesses the candidate's actual files or inbox. */
export default function CsrFitAdministrativeSimulation({ taskIndex, bank, answer, disabled=false, saving=false, onSave, publicAssessment=false }) {
  if (!bank?.fileTask || !bank?.dataTask) return <div role="alert" className="rounded-lg border border-amber-200 p-4 text-xs">The administrative simulation could not be loaded. Please contact the assessment administrator.</div>;
  if (taskIndex === 0) return <CsrFitWindowsDesktop key="file" info={bank.fileTask} answer={answer} disabled={disabled} saving={saving} onSave={onSave} publicAssessment={publicAssessment}/>;
  return <CustomerWorkspace key="customer" info={bank.dataTask} answer={answer} disabled={disabled} saving={saving} onSave={onSave}/>;
}
