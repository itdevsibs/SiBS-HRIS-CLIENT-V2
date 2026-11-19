import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, CheckCircle2, ChevronDown, ClipboardPaste, FileText, Folder,
  FolderOpen, Inbox, Keyboard, Monitor, MoveRight, Pencil, Save, Scissors, X,
} from 'lucide-react';
import SelectDropdown from '../ui/SelectDropdown';

const card = 'rounded-xl border border-sibs-border bg-white';
const button = 'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-sibs-border bg-white px-3 text-xs font-extrabold text-sibs-navy transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40';
const field = 'h-10 w-full rounded-lg border border-sibs-border bg-white px-3 text-xs text-sibs-navy outline-none focus:border-sibs-navy';
const event = (type, details) => ({ type, ...details });

function FileWorkspace({ info, answer, disabled, saving, onSave }) {
  const sourceFolder = 'Incoming Files';
  const folders = Array.isArray(info?.folders) ? info.folders : [];
  const [filename, setFilename] = useState(answer?.filename || info.sourceFilename || '');
  const [folder, setFolder] = useState(answer?.folder || sourceFolder);
  const [activeFolder, setActiveFolder] = useState(answer?.folder || sourceFolder);
  const [selected, setSelected] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [moveOpen, setMoveOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [cutFile, setCutFile] = useState(false);
  const [notification, setNotification] = useState('');
  const [events, setEvents] = useState(Array.isArray(answer?.simulation?.actions) ? answer.simulation.actions : []);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const renameRef = useRef(null);
  const hasRenamed = events.some(item => item.type === 'rename');
  const hasMoved = events.some(item => item.type === 'move');
  const ready = hasRenamed && hasMoved && filename.trim().length > 0 && folders.includes(folder);

  useEffect(() => { if (renaming) renameRef.current?.focus(); }, [renaming]);
  function beginRename() {
    if (disabled) return;
    setSelected(true); setNameDraft(filename); setMoveOpen(false); setContextOpen(false); setRenaming(true);
  }
  function applyRename() {
    const next = nameDraft.trim();
    if (!next || next === filename || next.includes('/') || next.includes('\\')) return;
    setFilename(next); setEvents(old => [...old, event('rename', { filename: next })].slice(-20));
    setDirty(true); setRenaming(false); setNotification('Rename action recorded. You may now move the file.');
  }
  function moveTo(next) {
    if (disabled || !folders.includes(next)) return;
    setFolder(next); setActiveFolder(next); setSelected(true); setMoveOpen(false); setContextOpen(false); setCutFile(false);
    setEvents(old => [...old, event('move', { folder: next })].slice(-20));
    setDirty(true); setNotification(`Move action recorded: ${next}.`);
  }
  function pasteInto(target) {
    if (disabled || !cutFile || !folders.includes(target)) return;
    moveTo(target);
  }
  async function save() {
    if (!ready || disabled || saving || submitting) return;
    setSubmitting(true);
    try { await onSave({ filename, folder, simulation: { version: 2, actions: events } }); setDirty(false); }
    catch { /* Assessment parent displays the save error. */ }
    finally { setSubmitting(false); }
  }
  const folderList = [sourceFolder, ...folders];
  const actionLabels = {rename: 'Renamed file', move: 'Moved file'};
  return <div className="space-y-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-sm font-extrabold text-sibs-navy">File and folder management</h3>
        <p className="mt-1 text-xs leading-5 text-sibs-muted">Use the simulated file manager to rename the document and move it to the correct department folder.</p></div>
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-sibs-surface px-2.5 py-1.5 text-[11px] font-semibold text-sibs-muted"><Keyboard size={13}/> F2 to rename</span>
    </div>
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-sibs-navy"><span className="font-extrabold">Work instruction</span><p className="mt-1 leading-5">{info.fileNameRule}</p></div>
    <section className={`${card} overflow-hidden`} aria-label="Simulated file manager">
      <div className="flex items-center justify-between gap-2 border-b border-sibs-border bg-sibs-surface px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-bold"><Monitor size={16}/> SiBS Workspace <span className="font-medium text-sibs-muted">/ File Manager</span></div>
        <span className="rounded-md border border-sibs-border bg-white px-2 py-1 text-[10px] font-semibold text-sibs-muted">Simulation only</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-sibs-border px-3 py-2">
        <button type="button" className={button} disabled={disabled || !selected || renaming || folder !== activeFolder} onClick={beginRename}><Pencil size={13}/> Rename <span className="text-[10px] text-sibs-muted">F2</span></button>
        <button type="button" className={button} disabled={disabled || !selected || folder !== activeFolder} onClick={() => { setCutFile(true);setNotification('File marked for moving. Open a destination folder and click Paste.'); }}><Scissors size={13}/> Cut</button>
        {cutFile && folders.includes(activeFolder) && <button type="button" className={button} disabled={disabled} onClick={() => pasteInto(activeFolder)}><ClipboardPaste size={13}/> Paste here</button>}
        <div className="relative">
          <button type="button" className={button} disabled={disabled || !selected || folder !== activeFolder} onClick={() => setMoveOpen(!moveOpen)} aria-expanded={moveOpen} aria-haspopup="menu"><MoveRight size={14}/> Move to <ChevronDown size={13}/></button>
          {moveOpen && <div role="menu" className="absolute left-0 top-full z-20 mt-1 min-w-48 overflow-hidden rounded-lg border border-sibs-border bg-white p-1 shadow-lg">
            {folders.map(name => <button role="menuitem" key={name} type="button" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold hover:bg-sibs-surface" onClick={() => moveTo(name)}><Folder size={14}/>{name}</button>)}
          </div>}
        </div>
        <p className="ml-auto text-[11px] text-sibs-muted">Select or right-click the file · Rename (F2) · Move or cut/paste.</p>
      </div>
      <div className="grid min-h-[245px] grid-cols-[minmax(115px,190px)_minmax(0,1fr)]">
        <nav aria-label="Simulated folders" className="border-r border-sibs-border bg-sibs-surface/60 p-2">
          <p className="px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">Folders</p>
          {folderList.map(name => <button key={name} type="button" onClick={() => { setActiveFolder(name); setSelected(false); setMoveOpen(false); setContextOpen(false); }}
            onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && cutFile) { e.preventDefault(); pasteInto(name); } }}
            onDragOver={e => { if (!disabled && name !== sourceFolder) e.preventDefault(); }}
            onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.getData('text/plain') === 'sibs-simulated-file') moveTo(name); }}
            className={`mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px] font-semibold transition ${activeFolder === name ? 'bg-white text-sibs-navy shadow-sm' : 'text-sibs-secondary hover:bg-white/80'} ${dragging && name !== sourceFolder ? 'ring-1 ring-blue-100' : ''}`}>
            {activeFolder === name ? <FolderOpen size={15} className="shrink-0"/> : <Folder size={15} className="shrink-0"/>}<span className="break-words">{name}</span>
          </button>)}
        </nav>
        <div className="min-w-0 p-3">
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-sibs-border pb-2 text-[11px] text-sibs-muted"><span>Shared Files / <strong className="text-sibs-navy">{activeFolder}</strong></span><span>{folder === activeFolder ? '1 file' : 'Empty folder'}</span></div>
          {folder === activeFolder ? <div draggable={!disabled && !renaming} onDragStart={e => { e.dataTransfer.setData('text/plain', 'sibs-simulated-file'); e.dataTransfer.effectAllowed = 'move'; setDragging(true); }} onDragEnd={() => setDragging(false)}
            role="button" tabIndex={0} aria-label={`Select ${filename}`} aria-pressed={selected}
            onClick={() => { setSelected(true); setContextOpen(false); }}
            onContextMenu={e => { e.preventDefault(); if (disabled) return; setSelected(true);setContextOpen(true);setMoveOpen(false); }}
            onDoubleClick={() => setPreviewOpen(true)}
            onKeyDown={e => { if (e.key === 'F2') { e.preventDefault(); beginRename(); }
              else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') { e.preventDefault(); setCutFile(true);setNotification('File marked for moving.'); }
              else if (e.key === 'Enter') { e.preventDefault(); setPreviewOpen(true); }
              else if (e.key === ' ') { e.preventDefault(); setSelected(true); } }}
            className={`relative flex cursor-pointer items-center gap-3 rounded-lg border p-3 outline-none transition ${selected ? 'border-blue-400 bg-blue-50' : 'border-sibs-border hover:bg-sibs-surface'} ${cutFile ? 'opacity-60' : ''}`}>
            {contextOpen && <div role="menu" onClick={e=>e.stopPropagation()} className="absolute right-3 top-11 z-30 min-w-44 rounded-lg border border-sibs-border bg-white p-1 shadow-xl">
              <button type="button" role="menuitem" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-sibs-surface" onClick={beginRename}><Pencil size={13}/> Rename (F2)</button>
              <button type="button" role="menuitem" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-sibs-surface" onClick={() => { setCutFile(true);setContextOpen(false);setNotification('File marked for moving.'); }}><Scissors size={13}/> Cut (Ctrl+X)</button>
              <button type="button" role="menuitem" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-sibs-surface" onClick={() => {setPreviewOpen(true);setContextOpen(false);}}><FileText size={13}/> File details</button>
              <button type="button" role="menuitem" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-sibs-surface" onClick={() => setContextOpen(false)}>Close menu</button>
            </div>}
            <div className="rounded-lg bg-blue-100 p-2 text-blue-800"><FileText size={21}/></div>
            <div className="min-w-0 flex-1">{renaming ? <div onClick={e => e.stopPropagation()} className="flex flex-wrap items-center gap-2">
              <input ref={renameRef} aria-label="New filename" className={`${field} max-w-64`} value={nameDraft} onChange={e => setNameDraft(e.target.value)} onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') applyRename(); if (e.key === 'Escape') setRenaming(false); }}/>
              <button className={button} type="button" onClick={applyRename}>Apply</button><button type="button" className={button} onClick={() => setRenaming(false)} aria-label="Cancel rename"><X size={13}/></button>
            </div> : <><p className="break-all text-xs font-extrabold text-sibs-navy">{filename}</p><p className="mt-1 text-[11px] text-sibs-muted">Text document · Drag onto a department folder to move</p></>}</div>
            {selected && !renaming && <CheckCircle2 size={17} className="shrink-0 text-blue-600"/>}
          </div> : <div className="flex min-h-28 flex-col items-center justify-center text-center text-[11px] text-sibs-muted"><Folder size={27} className="mb-2"/>There are no files in this folder.</div>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-sibs-border bg-sibs-surface px-3 py-2 text-[11px] font-semibold text-sibs-secondary">
        <span className={hasRenamed ? 'text-emerald-700' : ''}>{hasRenamed ? '✓' : '○'} Rename performed</span>
        <span className={hasMoved ? 'text-emerald-700' : ''}>{hasMoved ? '✓' : '○'} Move performed</span>
        <span className="ml-auto">Current folder: {folder}</span>
      </div>
    </section>
    {notification && <p role="status" className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 text-[11px] font-semibold text-sibs-navy">{notification}</p>}
    {events.length > 0 && <div className="rounded-lg border border-sibs-border px-3 py-2">
      <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">Workspace activity · recorded actions, not correctness</p>
      <ol className="space-y-1 text-[11px] text-sibs-secondary">{events.slice(-4).map((entry,i) => <li key={`${entry.type}-${i}`}>{actionLabels[entry.type] || 'Performed action'}: <span className="font-semibold text-sibs-navy">{entry.filename || entry.folder || 'File'}</span></li>)}</ol>
    </div>}
    {previewOpen && <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 p-4" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setPreviewOpen(false);}}><section role="dialog" aria-modal="true" aria-label="Simulated file details" className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
      <div className="mb-3 flex items-center justify-between"><strong className="flex items-center gap-2 text-sm text-sibs-navy"><FileText size={18}/> File details</strong><button type="button" className={button} onClick={()=>setPreviewOpen(false)} aria-label="Close file details"><X size={14}/></button></div>
      <dl className="space-y-3 text-xs"><div><dt className="font-semibold text-sibs-muted">Name</dt><dd className="mt-1 break-all font-bold text-sibs-navy">{filename}</dd></div><div><dt className="font-semibold text-sibs-muted">Folder</dt><dd className="mt-1 font-bold text-sibs-navy">{folder}</dd></div><div><dt className="font-semibold text-sibs-muted">Type</dt><dd className="mt-1 text-sibs-navy">Text document</dd></div></dl>
      <p className="mt-4 text-[11px] text-sibs-muted">This is a practice workspace. No actual files are opened or changed.</p>
    </section></div>}
    <div className="flex items-center justify-between gap-2">
      <p className="text-[11px] text-sibs-muted">Changes stay inside this simulated workspace; no real device files are changed. Any completed response is accepted for saving, even if it is not correct.</p>
      <button type="button" disabled={!ready || disabled || saving || submitting} onClick={save} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-sibs-navy px-4 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"><Save size={14}/> Save task</button>
    </div>
    {answer && !dirty && <p className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 size={14}/> File task saved</p>}
  </div>;
}

function CustomerWorkspace({ info, answer, disabled, saving, onSave }) {
  const source = info.source || {};
  const [opened, setOpened] = useState(Boolean(answer));
  const [values, setValues] = useState({customerName:answer?.customerName||'',accountNumber:answer?.accountNumber||'',callbackNumber:answer?.callbackNumber||'',category:answer?.category||'',notes:answer?.notes||''});
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [events, setEvents] = useState(Array.isArray(answer?.simulation?.actions) ? answer.simulation.actions : []);
  const ready = opened && ['customerName','accountNumber','callbackNumber','category','notes'].every(k => String(values[k]||'').trim()) && (info.categories||[]).includes(values.category);
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
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] text-sibs-muted">A completed record can be submitted even if some entries are inaccurate.</p><button type="button" disabled={!ready || disabled || saving || submitting} onClick={save} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-sibs-navy px-4 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"><Save size={14}/> Save case record</button></div>
    {answer && !dirty && <p className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 size={14}/> Customer case saved</p>}
  </div>;
}

/** Assessment-only desktop simulation. Neither task accesses the candidate's actual files or inbox. */
export default function CsrFitAdministrativeSimulation({ taskIndex, bank, answer, disabled=false, saving=false, onSave }) {
  if (!bank?.fileTask || !bank?.dataTask) return <div role="alert" className="rounded-lg border border-amber-200 p-4 text-xs">The administrative simulation could not be loaded. Please contact the assessment administrator.</div>;
  if (taskIndex === 0) return <FileWorkspace key="file" info={bank.fileTask} answer={answer} disabled={disabled} saving={saving} onSave={onSave}/>;
  return <CustomerWorkspace key="customer" info={bank.dataTask} answer={answer} disabled={disabled} saving={saving} onSave={onSave}/>;
}
