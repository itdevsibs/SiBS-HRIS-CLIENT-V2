import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, ArrowUp, CheckCircle2,
  ClipboardPaste, FileText, Folder, FolderPlus, HardDrive,
  Info, LayoutGrid, List, Maximize2, Monitor,
  Pencil, RefreshCw, Save, Scissors, Search, Trash2, X,
} from 'lucide-react';
import './CsrFitWindowsDesktop.css';

const ROOT = 'pc';
const SYSTEM_FOLDERS = [
  { id: 'desktop', name: 'Desktop' },
  { id: 'documents', name: 'Documents' },
  { id: 'downloads', name: 'Downloads' },
];
const trimName = (value) => String(value || '').trim();
// Keep the assessment's original wording and grading rules intact while
// displaying each action as a separate, numbered instruction.
function fileManagementSteps(instruction) {
  const text = trimName(instruction);
  if (!text) return [];
  const segments = text
    .replace(/,\s*then\s+(?=move it into\b)/i, ', ')
    .split(/,\s*(?=go to\b|create a folder named\b|rename the document to\b|move it into\b)/i)
    .map((segment) => segment.trim())
    .filter(Boolean);
  return segments.map((segment) => {
    const normalized = segment.charAt(0).toUpperCase() + segment.slice(1);
    return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
  });
}
const safeFolderName = (value) => {
  const name = trimName(value);
  return name.length > 0 && name.length <= 80 && name !== '.' && name !== '..' &&
    !/[\\/:*?"<>|\x00-\x1f]/.test(name) && !/[. ]$/.test(name);
};
const safeFileName = (value) => {
  const name = trimName(value);
  return name.length > 0 && name.length <= 180 && !/[\\/:*?"<>|\x00-\x1f]/.test(name);
};
function WindowsMark({ size = 16 }) {
  return <span className="swin-mark" style={{ width: size, height: size }} aria-hidden="true"><i/><i/><i/><i/></span>;
}
function LocationIcon({ id, size = 24 }) {
  if (id === 'pc') return <Monitor size={size} className="swin-pc-icon"/>;
  if (id === 'disk') return <HardDrive size={size} className="swin-disk-icon"/>;
  if (id === 'bin') return <Trash2 size={size} className="swin-bin-icon"/>;
  if (id === 'file') return <FileText size={size} className="swin-file-icon"/>;
  return <Folder size={size} className="swin-folder-icon" fill="currentColor" strokeWidth={1.2}/>;
}
function nameOf(id) {
  if (id === 'pc') return 'This PC';
  if (id === 'desktop') return 'Desktop';
  if (id === 'documents') return 'Documents';
  if (id === 'downloads') return 'Downloads';
  if (id === 'shared') return 'SiBS Shared Files';
  if (id === 'incoming') return 'Incoming Files';
  if (id === 'disk') return 'Local Disk (C:)';
  if (id === 'bin') return 'Recycle Bin';
  if (id.startsWith('dept:')) return id.slice(5);
  if (id.startsWith('user:')) return decodeURIComponent(id.split(':').slice(-1)[0]);
  return id;
}
function parentOf(id, created = []) {
  if (['pc', 'desktop', 'documents', 'downloads', 'disk', 'bin'].includes(id)) return 'pc';
  if (id === 'shared') return 'documents';
  if (id === 'incoming' || id.startsWith('dept:')) return 'shared';
  const entry = created.find((item) => item.id === id);
  return entry?.parent || 'shared';
}
function pathOf(id, created) {
  if (id === 'pc') return ['pc'];
  const path = [id];
  let cursor = id;
  for (let i = 0; i < 8 && cursor !== 'pc'; i += 1) {
    cursor = parentOf(cursor, created);
    path.unshift(cursor);
  }
  return path;
}
function makeFolderId(parent, name, departments) {
  if (parent === 'shared' && departments.includes(name)) return `dept:${name}`;
  return `user:${encodeURIComponent(parent)}:${encodeURIComponent(name)}`;
}
function storedFolders(answer, departments) {
  const actions = Array.isArray(answer?.simulation?.actions) ? answer.simulation.actions : [];
  return actions.filter(action => action?.type === 'create_folder' && safeFolderName(action.folder) && action.parent)
    .map(action => ({ parent: action.parent, name: action.folder, id: makeFolderId(action.parent, action.folder, departments) }));
}
function knownItems(location, departments, requiredFolder, createdFolders) {
  if (location === 'pc') return [...SYSTEM_FOLDERS, { id: 'disk', name: 'Local Disk (C:)' }];
  if (location === 'documents') return [{ id: 'shared', name: 'SiBS Shared Files' }];
  if (location === 'shared') {
    const standard = [{ id: 'incoming', name: 'Incoming Files' },
      ...departments.filter(name => name !== requiredFolder && !createdFolders.some(item => item.parent === 'shared' && item.name === name))
        .map(name => ({ id: `dept:${name}`, name }))];
    return [...standard, ...createdFolders.filter(item => item.parent === 'shared')];
  }
  return createdFolders.filter(item => item.parent === location);
}
function WindowsClock() {
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setTick(Date.now()), 30_000); return () => clearInterval(timer); }, []);
  const at = new Date(tick);
  const time = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' }).format(at);
  const date = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: 'numeric', day: 'numeric' }).format(at);
  return <span className="swin-clock"><span>{time}</span><span>{date}</span></span>;
}

/** All navigation, file operations, and window geometry are in React memory.
 * Never uses or exposes the candidate's real Windows filesystem. */
export default function CsrFitWindowsDesktop({ info, answer, disabled = false, saving = false, onSave }) {
  const departments = Array.isArray(info?.folders) ? info.folders.filter(safeFolderName) : [];
  const simulationVersion = Number(info?.simulationVersion) === 3 ? 3 : 2;
  // Support new snapshots and existing attempts created before folderToCreate was added.
  const requiredFolder = trimName(info?.folderToCreate || info?.fileNameRule?.match(/create a folder named\s+([^,.;]+)/i)?.[1]);
  const [fileName, setFileName] = useState(answer?.filename || info?.sourceFilename || 'Client_Report.txt');
  const [fileLocation, setFileLocation] = useState(answer?.folder && departments.includes(answer.folder) ? `dept:${answer.folder}` : 'incoming');
  const [actions, setActions] = useState(Array.isArray(answer?.simulation?.actions) ? answer.simulation.actions.slice(-20) : []);
  const [created, setCreated] = useState(() => storedFolders(answer, departments));
  const [windowMode, setWindowMode] = useState('closed');
  const [maximized, setMaximized] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [navigation, setNavigation] = useState(['pc']);
  const [navigationIndex, setNavigationIndex] = useState(0);
  const location = navigation[navigationIndex];
  const [selected, setSelected] = useState('');
  const [isCut, setIsCut] = useState(false);
  const [edit, setEdit] = useState(null); // {type:'new'|'rename', target?}
  const [draft, setDraft] = useState('');
  const [context, setContext] = useState(null);
  const [menuTab, setMenuTab] = useState('Home');
  const [view, setView] = useState('details');
  const [search, setSearch] = useState('');
  const [filePreview, setFilePreview] = useState(false);
  const committingRef = useRef(false);
  const [message, setMessage] = useState('');
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startMenu, setStartMenu] = useState(false);
  const desktopRef = useRef(null);
  const windowRef = useRef(null);
  const fileAreaRef = useRef(null);
  const editingRef = useRef(null);
  const dragRef = useRef(null);
  const saved = Boolean(answer) && !dirty;

  useEffect(() => { if (edit) editingRef.current?.focus(); }, [edit]);
  const folderItems = useMemo(() => knownItems(location, departments, requiredFolder, created),
    [location, departments.join('|'), requiredFolder, created, simulationVersion]);
  const visible = useMemo(() => {
    const entries = [...folderItems.map(item => ({ ...item, kind: 'folder' }))];
    if (fileLocation === location) entries.push({ id: 'file', name: fileName, kind: 'file' });
    return entries.filter(entry => entry.name.toLowerCase().includes(search.trim().toLowerCase()));
  }, [folderItems, location, fileLocation, fileName, search]);

  const lastRename = actions.findLast(action => action?.type === 'rename');
  const lastMove = actions.findLast(action => action?.type === 'move');
  // Final submission is independent from the candidate's correctness.
  // Saving is the candidate's FINAL answer, not a pass/fail correctness check.
  // Missing or incorrect file actions are assessed only after submission.
  const ready = !saved && !disabled && !saving && !submitting;

  function record(type, extra) {
    setActions(old => [...old, { type, ...extra }].slice(-20));
    setDirty(true);
  }
  function navigate(next) {
    if (disabled) return;
    setNavigation(old => [...old.slice(0, navigationIndex + 1), next].slice(-16));
    setNavigationIndex(old => Math.min(old + 1, 15));
    setSelected(''); setContext(null); setSearch(''); setEdit(null);
    setStartMenu(false);
  }
  function goBack() { if (navigationIndex > 0) { setNavigationIndex(i => i - 1); setSelected(''); setContext(null); setEdit(null); setSearch(''); } }
  function goForward() { if (navigationIndex + 1 < navigation.length) { setNavigationIndex(i => i + 1); setSelected(''); setContext(null); setEdit(null); setSearch(''); } }
  function openExplorer(where = 'pc') { setWindowMode('open'); setFilePreview(false); if (where !== location) navigate(where); setStartMenu(false); }
  function openItem(item) { if (item.kind === 'file') setFilePreview(true); else navigate(item.id); }
  function showMessage(next) { setMessage(next); }
  function beginNewFolder() {
    if (disabled || !['documents','downloads','shared','incoming'].includes(location) && !location.startsWith('dept:') && !location.startsWith('user:')) return;
    setContext(null); setDraft('New folder'); setEdit({ type: 'new' }); setSelected('');
  }
  function saveNewFolder() {
    if (!edit || edit.type !== 'new' || committingRef.current) return;
    const name = trimName(draft);
    const exists = folderItems.some(item => item.name.toLowerCase() === name.toLowerCase()) || (fileLocation === location && fileName.toLowerCase() === name.toLowerCase());
    if (!safeFolderName(name) || exists || created.length >= 16) {
      showMessage(exists ? 'A folder with that name already exists.' : 'Enter a valid folder name (up to 80 characters).'); return;
    }
    committingRef.current = true;
    const item = { parent: location, id: makeFolderId(location, name, departments), name };
    setCreated(old => [...old, item]); record('create_folder', { folder: name, parent: location });
    setEdit(null); setSelected(item.id); setSearch(''); showMessage(`Folder “${name}” created.`);
    queueMicrotask(() => { committingRef.current = false; });
  }
  function beginRenameFile() {
    if (disabled || selected !== 'file' || fileLocation !== location) return;
    setContext(null); setEdit({ type: 'rename' }); setDraft(fileName);
  }
  function saveRenameFile() {
    if (edit?.type !== 'rename') return;
    const name = trimName(draft);
    if (!safeFileName(name)) { showMessage('Enter a valid filename without Windows reserved characters.'); return; }
    if (name !== fileName) { setFileName(name); record('rename', { filename: name }); showMessage('Document renamed.'); }
    setEdit(null);
  }
  function moveFile(target) {
    if (disabled || target === 'pc' || target === fileLocation || target === 'disk' || target === 'bin') return;
    setFileLocation(target); record('move', { folder: nameOf(target) }); setIsCut(false);
    setSelected('file'); setContext(null); showMessage(`File moved to ${nameOf(target)}.`);
  }
  function paste() {
    if (disabled || !isCut || location === 'pc' || location === 'disk' || location === 'bin') return;
    moveFile(location);
  }
  function openContext(e, target) {
    if (disabled) return;
    e.preventDefault(); e.stopPropagation();
    const rect = fileAreaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(8, Math.min(e.clientX - rect.left, rect.width - 195));
    const y = Math.max(35, Math.min(e.clientY - rect.top, rect.height - 170));
    setSelected(target?.id || ''); setContext({ target, x, y });
  }
  function handleKeyDown(e) {
    if (disabled || windowMode !== 'open' || filePreview) return;
    if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
    if (e.key === 'F2' && selected === 'file' && fileLocation === location) { e.preventDefault(); beginRenameFile(); }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') { e.preventDefault(); beginNewFolder(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x' && selected === 'file' && fileLocation === location) { e.preventDefault(); setIsCut(true); showMessage('File ready to move. Open a folder and press Ctrl+V.'); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && isCut) { e.preventDefault(); paste(); }
    if (e.key === 'Escape') { setContext(null); setEdit(null); setFilePreview(false); }
    if (e.key === 'Backspace' && !edit && navigationIndex > 0) { e.preventDefault(); goBack(); }
  }
  function startWindowDrag(e) {
    if (maximized || e.button !== 0 || e.target.closest('button')) return;
    dragRef.current = { x: e.clientX, y: e.clientY, offset };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function draggingWindow(e) {
    if (!dragRef.current) return;
    const { x, y, offset: origin } = dragRef.current;
    const bounds = desktopRef.current?.getBoundingClientRect();
    setOffset({ x: Math.max(-55, Math.min((bounds?.width || 960) * .21, origin.x + e.clientX - x)),
      y: Math.max(0, Math.min((bounds?.height || 620) * .25, origin.y + e.clientY - y)) });
  }
  async function saveTask() {
    if (!ready || disabled || saving || submitting) return;
    setSubmitting(true);
    try {
      await onSave({ filename: fileName, folder: nameOf(fileLocation), simulation: { version: simulationVersion, actions } });
      setDirty(false); showMessage('Final answer submitted. This task cannot be edited or submitted again.');
    } catch { showMessage('Unable to save. Check the assessment message and retry.'); }
    finally { setSubmitting(false); }
  }
  function itemButton(item, variant = 'details') {
    const selectedItem = selected === item.id;
    return <button type="button" key={item.id}
      className={`swin-item swin-item-${variant}${selectedItem ? ' is-selected' : ''}${item.id === 'file' && isCut ? ' is-cut' : ''}`}
      title={`${item.name}${item.kind === 'folder' ? ' — double-click to open' : ' — select, F2 to rename'}`}
      aria-label={`${item.name}. ${item.kind === 'folder' ? 'Double-click to open folder.' : 'File. Select to rename or cut.'}`}
      onClick={() => { setSelected(item.id); setContext(null); }}
      onDoubleClick={() => openItem(item)}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); openItem(item); } }}
      onPointerUp={e => { if (e.pointerType === 'touch') openItem(item); }}
      onContextMenu={e => openContext(e, item)}
      draggable={!disabled && item.kind === 'file'}
      onDragStart={e => { e.dataTransfer.setData('application/x-sibs-virtual-file','file'); e.dataTransfer.effectAllowed='move'; setSelected('file'); }}
      onDragOver={e => { if (item.kind === 'folder') e.preventDefault(); }}
      onDrop={e => { e.preventDefault(); if (item.kind === 'folder' && e.dataTransfer.getData('application/x-sibs-virtual-file') === 'file') moveFile(item.id); }}>
      <span className="swin-item-art"><LocationIcon id={item.kind === 'file' ? 'file' : item.id} size={variant === 'icons' ? 34 : 21}/></span>
      <span className="swin-item-name">{item.name}</span>
      {variant === 'details' && <><span className="swin-item-kind">{item.kind === 'folder' ? 'File folder' : 'Text Document'}</span><span className="swin-item-size">{item.kind === 'file' ? '2 KB' : ''}</span></>}
    </button>;
  }
  function sideLink(id, level = 0) {
    return <button type="button" key={id} className={`swin-side-link${location === id ? ' is-current' : ''}`} style={{ paddingLeft: 10 + level * 13 }}
      onClick={() => navigate(id)}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); if (e.dataTransfer.getData('application/x-sibs-virtual-file') === 'file') moveFile(id); }}>
      <LocationIcon id={id} size={17}/> <span>{nameOf(id)}</span>
    </button>;
  }
  const bread = pathOf(location, created);
  return <div className="space-y-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-sm font-extrabold text-sibs-navy">File and folder management</h3>
        <p className="mt-1 text-xs leading-5 text-sibs-muted">Work inside the Windows-style desktop below. Open This PC and use File Explorer to complete the task.</p></div>
      <span className="rounded-lg bg-sibs-surface px-2.5 py-1.5 text-[11px] font-bold text-sibs-muted">Windows simulation · no real files affected</span>
    </div>
    <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs text-sibs-navy">
      <h4 className="font-extrabold">Work instructions</h4>
      <ol className="mt-2 grid gap-2" aria-label="File and folder management steps">
        {fileManagementSteps(info?.fileNameRule).map((instruction, index) => (
          <li key={`${index}-${instruction}`} className="flex items-start gap-3 rounded-lg border border-blue-100 bg-white px-3 py-2.5">
            <span className="shrink-0 rounded-md bg-[#0a3154] px-2 py-1 text-[11px] font-extrabold text-white">Step {index + 1}</span>
            <span className="min-w-0 pt-0.5 leading-5">{instruction}</span>
          </li>
        ))}
      </ol>
    </div>
    <section className="swin-shell" ref={desktopRef} tabIndex={0} onKeyDown={handleKeyDown} aria-label="Simulated Windows 10 desktop" onClick={() => { if(context) setContext(null); }}>
      <div className="swin-wallpaper" aria-hidden="true"><div className="swin-glow"/><div className="swin-orbit one"/><div className="swin-orbit two"/></div>
      <div className="swin-desktop-icons">
        {[{ id:'pc', title:'This PC' },{ id:'bin', title:'Recycle Bin' },{ id:'desktop', title:'Desktop' },{ id:'documents', title:'Documents' },{ id:'shared', title:'SiBS Shared Files' }].map(({id,title}) =>
          <button type="button" key={id} className="swin-desktop-icon" onDoubleClick={() => openExplorer(id)} onKeyDown={e => {if(e.key==='Enter') openExplorer(id);}}
            onPointerUp={e => {if(e.pointerType==='touch') openExplorer(id);}} title={`Double-click ${title}`}>
            <LocationIcon id={id} size={33}/><span>{title}</span></button>)}
      </div>
      {windowMode === 'open' && <div ref={windowRef} className={`swin-window${maximized ? ' is-maximized' : ''}`}
        style={maximized ? undefined : {transform:`translate(${offset.x}px, ${offset.y}px)`}}
        onContextMenu={e => openContext(e, null)} onClick={e => e.stopPropagation()}>
        <div className="swin-titlebar" onPointerDown={startWindowDrag} onPointerMove={draggingWindow} onPointerUp={e => { dragRef.current=null; if(e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }} onPointerCancel={() => {dragRef.current=null;}}>
          <span className="swin-title"><LocationIcon id={location} size={16}/>{nameOf(location)} — File Explorer</span>
          <span className="swin-window-controls"><button type="button" aria-label="Minimize File Explorer" title="Minimize" onClick={() => setWindowMode('minimized')}><span className="swin-min-line"/></button>
            <button type="button" aria-label={maximized ? 'Restore File Explorer' : 'Maximize File Explorer'} title={maximized?'Restore':'Maximize'} onClick={() => {setMaximized(v=>!v);setOffset({x:0,y:0});}}><Maximize2 size={12}/></button>
            <button type="button" aria-label="Close File Explorer" className="swin-close" title="Close" onClick={() => {setWindowMode('closed');setContext(null);}}><X size={15}/></button></span>
        </div>
        <div className="swin-tabs"><button type="button" onClick={() => setMenuTab('File')} className="swin-file-tab">File</button>
          {['Home','View'].map(tab => <button key={tab} type="button" className={menuTab===tab?'is-active':''} onClick={() => setMenuTab(tab)}>{tab}</button>)}</div>
        <div className="swin-ribbon">
          {menuTab === 'View' ? <><button type="button" onClick={()=>setView('details')} className={view==='details'?'is-active':''}><List size={18}/>Details</button><button type="button" onClick={()=>setView('icons')} className={view==='icons'?'is-active':''}><LayoutGrid size={18}/>Large icons</button></>
            : menuTab === 'File' ? <><button type="button" onClick={()=>setWindowMode('closed')}><X size={17}/>Close</button><button type="button" onClick={()=>setContext(null)}><Info size={17}/>Simulated files only</button></>
            : <><button type="button" disabled={disabled || !selected || selected!=='file' || fileLocation!==location} onClick={()=>setIsCut(true)}><Scissors size={18}/>Cut</button>
              <button type="button" disabled={disabled || !isCut || location ==='pc'} onClick={paste}><ClipboardPaste size={18}/>Paste</button>
              <span className="swin-ribbon-divider"/>
              <button type="button" disabled={disabled || location==='pc' || location==='disk' || location==='bin'} onClick={beginNewFolder}><FolderPlus size={20}/>New folder</button>
              <button type="button" disabled={disabled || selected!=='file' || fileLocation!==location} onClick={beginRenameFile}><Pencil size={18}/>Rename</button></>}
        </div>
        <div className="swin-address-row"><div className="swin-path-controls"><button type="button" disabled={navigationIndex===0} onClick={goBack} aria-label="Back"><ArrowLeft size={17}/></button><button type="button" disabled={navigationIndex>=navigation.length-1} onClick={goForward} aria-label="Forward"><ArrowRight size={17}/></button><button type="button" onClick={()=>navigate(parentOf(location,created))} disabled={location==='pc'} aria-label="Up one level"><ArrowUp size={17}/></button></div>
          <div className="swin-address" aria-label="Current folder">{bread.map((part,i)=><span key={`${part}-${i}`}><button type="button" onClick={()=>navigate(part)}>{i===0?<LocationIcon id="pc" size={14}/>:null}{nameOf(part)}</button>{i<bread.length-1&&<span className="swin-crumb">›</span>}</span>)}</div>
          <button type="button" className="swin-refresh" title="Refresh" onClick={()=>{setSearch('');setContext(null);}}><RefreshCw size={15}/></button>
          <label className="swin-search"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${nameOf(location)}`} aria-label="Search current folder"/></label>
        </div>
        <div className="swin-explorer-body"><aside className="swin-sidebar" aria-label="File Explorer navigation">
          <div className="swin-sidebar-heading">Quick access</div>
          {sideLink('desktop')}{sideLink('documents')}{sideLink('downloads')}
          <div className="swin-sidebar-heading">This PC</div>
          {sideLink('pc')}{sideLink('shared',1)}
          {sideLink('incoming',2)}
          {departments.filter(name => name !== requiredFolder && !created.some(item=>item.name===name && item.parent==='shared')).map(name=>sideLink(`dept:${name}`,2))}
          {created.filter(item=>item.parent==='shared' && (item.name===requiredFolder || !departments.includes(item.name))).map(item=>sideLink(item.id,2))}
        </aside><div className="swin-file-area" ref={fileAreaRef} onClick={e=>{if(e.target===e.currentTarget){setSelected('');setContext(null);}}} onContextMenu={e=>openContext(e,null)}>
          <div className="swin-location-heading">{location==='pc'?'Folders':location==='shared'?'Folders and documents':nameOf(location)}</div>
          {view==='details' && <div className="swin-list-header"><span>Name</span><span>Type</span><span>Size</span></div>}
          <div className={`swin-items swin-items-${view}`}>
            {visible.map(item => itemButton(item,view))}
            {edit?.type==='new' && <div className={`swin-item swin-item-${view} is-selected`}><LocationIcon id="folder" size={24}/><input ref={editingRef} className="swin-edit-field" value={draft} aria-label="New folder name" onChange={e=>setDraft(e.target.value)} onBlur={saveNewFolder} onKeyDown={e=>{e.stopPropagation();if(e.key==='Enter')saveNewFolder();if(e.key==='Escape')setEdit(null);}}/><span/></div>}
            {visible.length === 0 && !edit && <p className="swin-empty">This folder is empty.</p>}
          </div>
          {edit?.type==='rename' && <div className="swin-rename-overlay" role="dialog" aria-label="Rename document"><div>Rename document</div><input ref={editingRef} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{e.stopPropagation();if(e.key==='Enter')saveRenameFile();if(e.key==='Escape')setEdit(null);}} aria-label="File name"/><div><button type="button" onClick={saveRenameFile}>Rename</button><button type="button" onClick={()=>setEdit(null)}>Cancel</button></div></div>}
          {context && <div className="swin-context-menu" style={{left:context.x,top:context.y}} role="menu" onClick={e=>e.stopPropagation()}>
            {context.target?.kind==='file' ? <><button role="menuitem" type="button" onClick={()=>{setFilePreview(true);setContext(null);}}>Open</button><button role="menuitem" type="button" onClick={()=>{setIsCut(true);setContext(null);}}>Cut <small>Ctrl+X</small></button><button role="menuitem" type="button" onClick={beginRenameFile}>Rename <small>F2</small></button></>
              : context.target?.kind==='folder' ? <><button role="menuitem" type="button" onClick={()=>openItem(context.target)}>Open</button><button role="menuitem" type="button" onClick={()=>{if(isCut)moveFile(context.target.id);setContext(null);}} disabled={!isCut}>Paste into folder</button></>
                : <><button role="menuitem" type="button" disabled={location==='pc'} onClick={paste}>Paste <small>Ctrl+V</small></button><button role="menuitem" type="button" disabled={location==='pc'||location==='disk'||location==='bin'} onClick={beginNewFolder}>New folder <small>Ctrl+Shift+N</small></button><button role="menuitem" type="button" onClick={()=>{setView(view==='details'?'icons':'details');setContext(null);}}>Change view</button></>}
          </div>}
        </div></div>
        <div className="swin-status-bar"><span>{folderItems.length + Number(fileLocation===location)} item(s)</span><span>{selected==='file'?'1 item selected · Text Document':'Simulated Windows file system'}</span><span className="swin-view-actions"><button type="button" onClick={()=>setView('details')} aria-label="Details view"><List size={14}/></button><button type="button" onClick={()=>setView('icons')} aria-label="Large icons view"><LayoutGrid size={14}/></button></span></div>
        {filePreview && <div className="swin-notepad-overlay"><section className="swin-notepad" role="dialog" aria-label="Preview virtual text file"><header><FileText size={17}/> {fileName} — Notepad<button type="button" onClick={()=>setFilePreview(false)} aria-label="Close Notepad"><X size={16}/></button></header><div className="swin-note-menubar">File&nbsp;&nbsp; Edit&nbsp;&nbsp; Format&nbsp;&nbsp; View&nbsp;&nbsp; Help</div><div className="swin-note-paper"><p>Client report · Reference 4910</p><p>This is a simulated document for the SiBS assessment.</p><p>No actual device files are accessed.</p></div><footer>Windows (CRLF) &nbsp; UTF-8</footer></section></div>}
      </div>}
      {startMenu && <div className="swin-start-menu"><div className="swin-start-brand"><WindowsMark size={19}/> Windows</div><button type="button" onClick={()=>openExplorer('pc')}><Monitor size={18}/> This PC</button><button type="button" onClick={()=>openExplorer('documents')}><Folder size={18}/> File Explorer</button><button type="button" onClick={()=>{setStartMenu(false);showMessage('Only the assessment desktop is available here.');}}><Info size={18}/> About simulation</button></div>}
      <div className="swin-taskbar"><button type="button" className="swin-start" aria-label="Open Start menu" onClick={()=>setStartMenu(v=>!v)}><WindowsMark size={18}/></button>
        <button type="button" className="swin-taskbar-search" onClick={()=>openExplorer('pc')}><Search size={18}/> <span>Type here to search</span></button>
        <button type="button" className={`swin-taskbar-explorer${windowMode!=='closed'?' is-running':''}`} aria-label="Open File Explorer" onClick={()=>setWindowMode(v=>v==='open'?'minimized':'open')}><Folder size={22} className="swin-folder-icon" fill="currentColor"/></button>
        <span className="swin-taskbar-spacer"/><WindowsClock/><span className="swin-notifications"/></div>
    </section>
    {message && <p role="status" className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 text-[11px] font-semibold text-sibs-navy">{message}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sibs-border bg-white px-3 py-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-semibold text-sibs-secondary">
        {Boolean(requiredFolder) && <span className={created.some(item=>item.parent==='shared')?'text-emerald-700':''}>{created.some(item=>item.parent==='shared')?'✓':'○'} Create folder</span>}
        <span className={lastRename?'text-emerald-700':''}>{lastRename?'✓':'○'} Rename file</span>
        <span className={lastMove?'text-emerald-700':''}>{lastMove?'✓':'○'} Move file</span>
        {saved&&<span className="text-emerald-700"><CheckCircle2 size={13} className="inline"/> Saved</span>}
      </div>
      {!saved && <button type="button" disabled={!ready} onClick={saveTask} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-sibs-navy px-4 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"><Save size={15}/>{submitting||saving?'Saving...':'Save task · Final'}</button>}
    </div>
    <p className="text-[11px] leading-5 text-sibs-muted">Double-click folders to open them. Right-click for actions; press F2 to rename, Ctrl+X/Ctrl+V to move, or Ctrl+Shift+N to create a folder. Only simulated files are affected. Save Task is your final submission, even if your work is incorrect or incomplete. You cannot edit or save it again. The HRIS Server scores the submitted work afterward.</p>
  </div>;
}
