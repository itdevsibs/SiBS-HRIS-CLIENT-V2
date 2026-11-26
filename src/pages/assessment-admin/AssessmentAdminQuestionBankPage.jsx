import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, BookOpen, CheckCircle2, ClipboardList, FileClock, FilePlus2, FileText, FolderOpen, Headphones, Keyboard, MessagesSquare, Monitor, Plus, RefreshCw, Upload, UploadCloud, X } from 'lucide-react';
import portalApi from '../../lib/assessment-admin/portalApi';
import ModalShell from '../../components/ui/ModalShell';
import TablePagination from '../../components/ui/TablePagination';
import StatusFilterTabs from '../../components/ui/StatusFilterTabs';
import SelectDropdown from '../../components/ui/SelectDropdown';
import SearchInput from '../../components/ui/SearchInput';
import PageHeaderHero from '../../components/ui/PageHeaderHero';
import PageFallback from '../../components/ui/PageFallback';
import { TableSkeletonRows } from '../../components/ui/TableSkeleton';
import AssessmentAdminPracticalQuestionDetails, { AssessmentAdminCoachingVideoPreview } from './AssessmentAdminPracticalQuestionDetails';
import './AssessmentAdminQuestionBankPage.css';

const KEYS = ['A','B','C','D'];
const PAGE_SIZE = 10;
const MODULE_KEYS = Array.from({length:7},(_,index)=>`module${index+1}`);
const MODULE_DISPLAY = [
  {title:'Cognitive & Logic Abilities',icon:BookOpen},
  {title:'Work Attitudes, Habits & Behavioral-Cognitive',icon:ClipboardList},
  {title:'Real-Time Coaching & Active Listening Challenge',icon:MessagesSquare},
  {title:'Administrative Task Simulation',icon:FolderOpen},
  {title:'Typing & Data Entry Test',icon:Keyboard},
  {title:'Audio Comprehension & Logging',icon:Headphones},
  {title:'Computer Literacy & Essential Tools',icon:Monitor},
];
const BEHAVIOR_TYPES=['frequency','comfort','truth','agreement','self-image','scenario'];
const toOptions=values=>values.map(value=>({value,label:value}));
const emptyForm = (module='module1') => ({module,category:'',stem:'',title:'',section:'',pillar:'',instructions:'',scores:{},options:KEYS.map(key=>({key,text:''})),correctKey:''});
const moduleLabel=module=>`Module ${module?.slice(-1)||'1'}`;
const isChoice=module=>['module1','module2','module7'].includes(module);
const isPractical=module=>['module3','module4','module6'].includes(module);
const dropdownClass='sibs-question-bank-category-filter';
const fieldClass = 'w-full rounded-lg border border-sibs-border bg-sibs-surface px-3 py-2.5 text-xs font-semibold text-sibs-navy focus-visible:outline-2 focus-visible:outline-sibs-orange disabled:opacity-60';
const labelClass = 'block mb-1.5 text-xs font-extrabold text-sibs-navy';
const primary = 'sibs-btn-primary inline-flex min-h-9 items-center justify-center gap-2 px-4 text-xs font-extrabold disabled:opacity-50';
const secondary = 'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-sibs-border bg-white px-3 text-xs font-extrabold text-sibs-navy transition hover:bg-sibs-surface disabled:opacity-50';
const statusTone = {DRAFT:'border-orange-200 bg-orange-50 text-orange-800',PUBLISHED:'border-emerald-200 bg-emerald-50 text-emerald-800',EXCLUDED:'border-slate-200 bg-slate-50 text-slate-600'};
const getError = error => error?.response?.data?.message || 'Unable to complete the request. Please try again.';
const BANK_API = '/api/assessment-portal/questions';
// The admin API supplies the multi-select key for the original coaching item.
// Keep the existing single-answer behavior for other modules.
function isCorrectOption(question, key) {
  if (question.module === 'module3' && question.source === 'ORIGINAL' && Number(question.id) === 1) {
    return Array.isArray(question.correctKeys) && question.correctKeys.includes(key);
  }
  return key === question.correctKey;
}

function QuestionStatus({status, table = false}) {
  const label = status === 'PUBLISHED' ? 'Published' : status === 'DRAFT' ? 'Draft' : 'Excluded';
  const tone = statusTone[status] || statusTone.EXCLUDED;
  if (table) return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1 text-[11px] font-bold ${tone}`}>
    <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${status === 'PUBLISHED' ? 'bg-emerald-600' : status === 'DRAFT' ? 'bg-sibs-orange' : 'bg-slate-500'}`} />
    {label}
  </span>;
  return <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-extrabold ${tone}`}>{label}</span>;
}

// Resolve the creator only when reviewing a saved question; never substitute
// the currently signed-in employee for a different creator.
function QuestionCreator({question}) {
  const [displayName, setDisplayName] = useState('');
  const [accessLabel, setAccessLabel] = useState('');
  const { id, module, createdBy, publishedBy } = question;
  useEffect(() => {
    if (!createdBy) return;
    const controller = new AbortController();
    setDisplayName('');
    setAccessLabel('');
    portalApi.get(`${BANK_API}/${encodeURIComponent(id)}/creator`, {
      params: { module }, signal: controller.signal,
    }).then(response => {
      const creator = response.data?.data;
      if (!controller.signal.aborted && String(creator?.sibsId ?? '') === String(createdBy).trim()) {
        setDisplayName(creator?.displayName || '');
        setAccessLabel(creator?.accessLabel || '');
      }
    }).catch(() => { /* Preserve the stored SiBS ID if name lookup is unavailable. */ });
    return () => controller.abort();
  }, [id, module, createdBy]);
  return (
    <div className="space-y-1 text-xs text-sibs-muted">
      <p>Created By <strong className="font-bold">SiBS ID: {createdBy}{displayName ? ` - ${displayName.toUpperCase()}` : ''}</strong></p>
      {accessLabel ? <p>Access: <strong className="font-bold">{accessLabel}</strong></p> : null}
      {publishedBy ? <p>Published by: {publishedBy}</p> : null}
    </div>
  );
}

export default function AssessmentAdminQuestionBankPage({onUnauthorized, onInitialLoadSettled}) {
  const [bank,setBank] = useState(null);
  const [loading,setLoading] = useState(true);
  const [initialLoadSettled,setInitialLoadSettled] = useState(false);
  const [error,setError] = useState('');
  const [message,setMessage] = useState('');
  const [searchInput,setSearchInput] = useState('');
  const [search,setSearch] = useState('');
  const submitSearch = () => {setSearch(searchInput.trim());setPage(1);};
  const clearSearch = () => {setSearchInput('');setSearch('');setPage(1);};
  const [category,setCategory] = useState('');
  const [module,setModule] = useState('module1');
  const [importState,setImportState]=useState(null);
  const uploadInputRef=useRef(null);
  const [dragging,setDragging]=useState(false);
  const [status,setStatus] = useState('ALL');
  const [page,setPage] = useState(1);
  const [form,setForm] = useState(null);
  const [view,setView] = useState(null);
  const [publishing,setPublishing] = useState(null);
  const [working,setWorking] = useState(false);
  const [modalError,setModalError] = useState('');
  const load = useCallback(async signal => {
    setLoading(true);setError('');
    try {
      const response = await portalApi.get(BANK_API,{signal});
      if (!Array.isArray(response.data?.data?.items)) throw new Error('Invalid question bank response.');
      if (!signal?.aborted) setBank(response.data.data);
    } catch (failure) {
      if (signal?.aborted) return;
      if ([401,403].includes(failure?.response?.status)) onUnauthorized?.();
      else {setBank(null);setError(getError(failure));}
    } finally {if (!signal?.aborted) {setInitialLoadSettled(true);setLoading(false);}}
  },[onUnauthorized]);
  useEffect(() => {
    const controller = new AbortController();
    // A replayed StrictMode effect is cleaned up before its microtask runs.
    queueMicrotask(() => { if (!controller.signal.aborted) void load(controller.signal); });
    return () => controller.abort();
  }, [load]);
  useLayoutEffect(() => {
    if (initialLoadSettled) onInitialLoadSettled?.();
  }, [initialLoadSettled, onInitialLoadSettled]);
  const items = useMemo(()=>(bank?.items || [])
    .filter(q=>q.module===module)
    .sort((a,b)=>Number(a.id)-Number(b.id)),[bank,module]);
  const moduleOptions=(bank?.modules||[]).map(m=>({value:m.key,label:m.name}));
  const moduleTabs=useMemo(()=>MODULE_KEYS.map((key,index)=>({
    key,
    label:moduleLabel(key),
    title:bank?.modules?.find(m=>m.key===key)?.name?.replace(/^Module\s+\d+\s*[-–—:]\s*/i,'') || MODULE_DISPLAY[index].title,
    icon:MODULE_DISPLAY[index].icon,
    count:bank?(bank.items||[]).filter(q=>q.module===key).length:null,
  })),[bank]);
  const categoryOptions = toOptions([...new Set(items.map(q=>q.category).filter(Boolean))]);
  const formCategoryOptions=toOptions(form?.module==='module2'?BEHAVIOR_TYPES:form?.module==='module7'?(bank?.knowledgeCategories||[]):(bank?.categories||[]));
  const changeModule=value=>{
    if(!MODULE_KEYS.includes(value)||value===module)return;
    setModule(value);setCategory('');setSearchInput('');setSearch('');setStatus('ALL');setPage(1);
  };
  const updateForm=(key,value)=>setForm(f=>({...f,[key]:value}));
  const changeFormCategory=value=>setForm(f=>({...f,category:value,correctKey:'',scores:{},options:Array.from({length:f.module==='module2'?(value==='comfort'?3:value==='scenario'?4:5):4},(_,i)=>({key:'ABCDE'[i],text:''}))}));
  const filtered = useMemo(()=>items.filter(q =>
    (status==='ALL'||q.status===status) && (!category||q.category===category) &&
    (!search.trim()||`${q.id} ${q.stem} ${q.category}`.toLowerCase().includes(search.trim().toLowerCase()))),[items,status,category,search]);
  const pages = Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const currentPage = Math.min(page,pages);
  const visible = filtered.slice((currentPage-1)*PAGE_SIZE,currentPage*PAGE_SIZE);
  const tabs = [{key:'ALL',label:'All',icon:BookOpen,count:items.length},{key:'DRAFT',label:'Draft',count:items.filter(q=>q.status==='DRAFT').length},{key:'PUBLISHED',label:'Published',icon:CheckCircle2,count:items.filter(q=>q.status==='PUBLISHED').length},{key:'EXCLUDED',label:'Excluded',count:items.filter(q=>q.status==='EXCLUDED').length}];
  const close = () => {if(!working){setDragging(false);setForm(null);setView(null);setPublishing(null);setImportState(null);setModalError('');}};
  async function save(event) {
    event.preventDefault();if(working||!form)return;
    if (isChoice(form.module)&&!form.category) {
      setModalError('Please select a category.');
      return;
    }
    setWorking(true);setModalError('');setMessage('');
    try {
      await portalApi.post(BANK_API,form);
      setModule(form.module);setForm(null);setStatus('DRAFT');setSearchInput('');setSearch('');setCategory('');setPage(1);
      setMessage('Question saved as a draft. It must be published before it can appear in a new public assessment.');
      await load();
    } catch(failure) {if(failure?.response?.status===401)onUnauthorized?.();else setModalError(getError(failure));}
    finally {setWorking(false);}
  }
  async function publish() {
    if(working||!publishing)return;
    setWorking(true);setModalError('');setMessage('');
    try {
      await portalApi.post(`${BANK_API}/${publishing.id}/publish`,{module:publishing.module});
      setModule(publishing.module);setPublishing(null);setView(null);setStatus('PUBLISHED');setSearchInput('');setSearch('');setCategory('');setPage(1);
      setMessage('Question published. It is now eligible for future public assessment draws.');await load();
    } catch(failure) {if(failure?.response?.status===401)onUnauthorized?.();else setModalError(getError(failure));}
    finally {setWorking(false);}
  }
  function selectDocument(file){
    if(working||!file)return;
    setModalError('');
    if(!/\.(pdf|docx|doc)$/i.test(file.name)||file.size>5*1024*1024||file.size===0){setModalError('Choose a non-empty PDF, DOCX or DOC file up to 5 MB.');return;}
    setImportState(s=>({...s,file,text:'',preview:null}));
  }
  async function importPreview(upload=false){
    if(working||!importState)return;
    setWorking(true);setModalError('');
    try{
      let response;
      if(upload){if(!importState.file)throw new Error('Choose a document.');const body=new FormData();body.append('file',importState.file);body.append('defaultModule',importState.defaultModule);response=await portalApi.post(`${BANK_API}/import/preview`,body,{timeout:45000});}
      else response=await portalApi.post(`${BANK_API}/import/validate`,{text:importState.text,defaultModule:importState.defaultModule},{timeout:45000});
      const data=response.data.data;setImportState(s=>({...s,text:upload?data.text:s.text,preview:data,validatedText:upload?data.text:s.text,validatedModule:s.defaultModule}));
    }catch(failure){if(failure?.response?.status===401)onUnauthorized?.();else setModalError(failure.response?getError(failure):failure.message||getError(failure));}finally{setWorking(false);}
  }
  async function saveImport(){if(working||!importState?.preview?.items?.length||importState.preview.errors.length||importState.text!==importState.validatedText||importState.defaultModule!==importState.validatedModule)return;setWorking(true);setModalError('');try{const result=await portalApi.post(`${BANK_API}/import`,{text:importState.text,defaultModule:importState.defaultModule},{timeout:60000});const importedModules=MODULE_KEYS.filter(key=>result.data.data.items?.some(item=>item.module===key));setImportState(null);setModule(importedModules.includes(module)?module:(importedModules[0]||module));setCategory('');setSearchInput('');setSearch('');setStatus('DRAFT');setPage(1);setMessage(`${result.data.data.count} questions/tasks imported as drafts.${importedModules.length>1?' Switch module tabs to review the other imported drafts.':''}`);await load();}catch(failure){if(failure?.response?.status===401)onUnauthorized?.();else setModalError(getError(failure));}finally{setWorking(false);}}
  const importReady=Boolean(importState?.preview?.items?.length&&!importState.preview.errors.length&&importState.text===importState.validatedText&&importState.defaultModule===importState.validatedModule);
  // Use the HRIS page skeleton only for the initial load; preserve open forms and filters on refresh.
  if (loading && !initialLoadSettled) return onInitialLoadSettled ? null : <PageFallback />;
  return <div className="w-full px-1 py-1 font-jakarta text-sibs-navy">
    <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-4 sm:gap-5">
    <PageHeaderHero
      kicker="Assessment Administration"
      title="Question Bank"
      description="Manage questions for the Public CSR-Fit Assessment."
      actions={<div className="flex flex-wrap items-center gap-2">
        <button type="button" className="sibs-btn-secondary inline-flex items-center gap-2 disabled:opacity-50" disabled={!bank||loading||working} onClick={()=>{setImportState({defaultModule:'',file:null,text:'',preview:null});setModalError('');}}><Upload size={15}/> Import Questions</button>
        <button type="button" className="sibs-btn-primary inline-flex items-center gap-2 disabled:opacity-50" disabled={!bank||loading||working} onClick={()=>{setForm(emptyForm(module||'module1'));setModalError('');setMessage('');}}><Plus size={15}/> Add Question</button>
      </div>}
    />
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Selected module question totals">
      {[
        [BookOpen, 'Original questions', items.filter(q=>q.source==='ORIGINAL').length],
        [FilePlus2, 'Added questions', items.filter(q=>q.source==='CUSTOM').length],
        [FileClock, 'Draft questions', items.filter(q=>q.status==='DRAFT').length],
        [CheckCircle2, 'Published questions', items.filter(q=>q.status==='PUBLISHED').length],
      ].map(([Icon,label,count])=><div key={label} className="flex items-center gap-3 rounded-xl border border-sibs-border bg-white px-4 py-3.5 shadow-sm">
        <div className="shrink-0 rounded-lg bg-[#ecf3fa] p-2.5 text-sibs-navy"><Icon size={19}/></div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-sibs-secondary">{label}</p>
          <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-sibs-navy">{bank?count:'—'}</p>
          <p className="text-[10px] text-sibs-muted">{moduleLabel(module)} records</p>
        </div>
      </div>)}
    </div>
    <section className="sibs-page-card-in sibs-card relative z-[10] flex flex-col overflow-hidden rounded-[14px] border border-sibs-border bg-white shadow-xs font-jakarta" aria-label="Question directory">
      <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6">
        <div className="flex flex-col gap-0.5">
          <h2 className="sibs-card-title">Question Directory</h2>
          <p className="sibs-card-subtitle">Select an assessment module, then click any question row to view its details.</p>
        </div>
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-xs leading-relaxed"><strong>All seven assessment modules</strong><p className="mt-1 text-sibs-muted">New items are saved as drafts. HR Admin or Super Admin can publish Modules 1, 2, 5 and 7 for future public attempts. Modules 3, 4 and 6 require media or simulation integration and are draft-only. Existing attempts are unchanged.</p></div>
        <div className="sibs-question-bank-module-picker mt-4">
          <h3 className="mb-2 text-xs font-extrabold text-sibs-navy">Assessment Modules</h3>
          <div className="sibs-question-bank-module-grid" role="group" aria-label="Select assessment module">
            {moduleTabs.map(({key,label,title,icon:Icon,count})=>{
              const selected=module===key;
              return (
                <button key={key} type="button" className="sibs-question-bank-module-card" aria-pressed={selected}
                  aria-label={`${label}: ${title}${count===null?'':`, ${count} ${count===1?'item':'items'}`}`}
                  onClick={()=>changeModule(key)}>
                  <span className="sibs-question-bank-module-card-top">
                    <span className="sibs-question-bank-module-icon"><Icon size={17} aria-hidden="true"/></span>
                    <span className="sibs-question-bank-module-number">{label}</span>
                    {selected&&<CheckCircle2 size={15} className="sibs-question-bank-module-check" aria-hidden="true"/>}
                  </span>
                  <span className="sibs-question-bank-module-title">{title}</span>
                  <span className="sibs-question-bank-module-count">{count===null?'Loading…':`${count} ${count===1?'item':'items'}`}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="sibs-question-bank-filter-row">
          <SearchInput
            label="Search"
            labelClassName="sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
            value={searchInput}
            onChange={setSearchInput}
            onClear={clearSearch}
            onKeyDown={event=>{
              if(event.key==='Enter'&&!event.nativeEvent?.isComposing){event.preventDefault();submitSearch();}
            }}
            placeholder="Search question or ID…"
          />
          <div className="min-w-0"><SelectDropdown
            className={dropdownClass}
            label="Category"
            labelClassName="sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
            value={category}
            options={categoryOptions}
            onChange={value=>{setCategory(value);setPage(1);}}
            placeholder="All Categories"
            clearable
            searchable
            searchPlaceholder="Search categories..."
          /></div>
          <button type="button" onClick={submitSearch}
            className="sibs-btn-primary inline-flex h-9 items-center justify-center px-4 text-xs 2xl:h-10">
            Search
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5 2xl:p-6">
        {error&&<div role="alert" className="mb-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"><AlertCircle size={15}/>{error}</div>}
        {message&&<div role="status" className="mb-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"><CheckCircle2 size={15}/>{message}</div>}
        <div className="flex flex-1 flex-col overflow-hidden rounded-[14px] border border-sibs-border bg-white shadow-xs">
          <StatusFilterTabs tabs={tabs} activeValue={status} onChange={value=>{setStatus(value);setPage(1);}} layoutId="assessmentQuestionBankTabIndicator"/>
          <div className="max-h-[480px] overflow-x-auto overflow-y-auto bg-white sibs-scrollbar 2xl:max-h-[640px]">
            <table className="w-full min-w-[1020px] table-fixed border-separate border-spacing-0 text-left 2xl:min-w-[1100px]">
              <thead className="sibs-data-table-head">
                <tr className="sibs-data-table-head-row">
                  {[
                    ['Module', 'w-[8%] text-left'],
                    ['Item No.', 'w-[7%] text-left'],
                    ['Question', 'w-[42%] text-left'],
                    ['Category', 'w-[23%] text-left'],
                    ['Source', 'w-[9%] text-left'],
                    ['Status', 'w-[11%] text-center'],
                  ].map(([heading, width]) => <th key={heading} scope="col"
                    className={`sibs-data-table-th ${width} px-3 py-2.5 sibs-text-micro font-black uppercase tracking-wider text-sibs-navy 2xl:px-4 2xl:py-3.5`}>
                    {heading}
                  </th>)}
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading ? <TableSkeletonRows count={6} columns={6} />
                  : visible.length === 0 ? <tr><td colSpan={6} className="px-5 py-12 text-center sibs-text-xs font-semibold text-sibs-secondary">{error ? 'Question bank unavailable.' : `No matching questions in ${moduleLabel(module)}.`}</td></tr>
                  : visible.map(q => <tr key={`${q.module}:${q.source}:${q.id}`} className="group cursor-pointer transition-colors hover:bg-sibs-cream-light focus-within:bg-sibs-cream-light"
                      onClick={()=>{setView(q);setModalError('');}}>
                    <td className="border-b border-sibs-border px-3 py-2 align-middle 2xl:px-4 2xl:py-2.5">
                      <p className="whitespace-nowrap sibs-text-xs font-extrabold text-sibs-orange">{moduleLabel(q.module)}</p>
                    </td>
                    <td className="border-b border-sibs-border px-3 py-2 align-middle 2xl:px-4 2xl:py-2.5">
                      <p className="break-words sibs-text-xs font-extrabold tabular-nums text-sibs-orange">{q.id}</p>
                    </td>
                    <td className="border-b border-sibs-border px-3 py-2 align-middle 2xl:px-4 2xl:py-2.5">
                      <button type="button"
                        aria-label={`View ${moduleLabel(q.module)} question ${q.id}: ${q.stem}`}
                        className="block min-h-8 w-full cursor-pointer break-words rounded-sm text-left sibs-text-xs font-extrabold leading-tight text-sibs-navy transition-colors group-hover:text-sibs-orange focus-visible:outline-2 focus-visible:outline-sibs-orange focus-visible:outline-offset-2">
                        {q.stem}
                      </button>
                    </td>
                    <td className="border-b border-sibs-border px-3 py-2 align-middle 2xl:px-4 2xl:py-2.5">
                      <p className="break-words sibs-text-xs font-semibold text-sibs-secondary">{q.category}</p>
                    </td>
                    <td className="border-b border-sibs-border px-3 py-2 align-middle 2xl:px-4 2xl:py-2.5">
                      <p className="sibs-text-xs font-semibold text-sibs-secondary">{q.source === 'ORIGINAL' ? 'Original' : 'Added'}</p>
                    </td>
                    <td className="border-b border-sibs-border px-3 py-2 text-center align-middle 2xl:px-4 2xl:py-2.5">
                      <QuestionStatus status={q.status} table />
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
          <div className="mt-auto px-4 pb-4 sm:px-5 sm:pb-5">
            <TablePagination currentPage={currentPage} totalPages={pages} totalRecords={filtered.length} pageSize={PAGE_SIZE} loadedCount={visible.length} onPageChange={setPage} recordLabel="questions" loading={loading} className="mt-3 2xl:mt-5 pt-2.5 2xl:pt-4"/>
          </div>
        </div>
      </div>
    </section>
    </div>
    {form&&<ModalShell open onClose={close} title="Add Question" subtitle={bank.modules.find(m=>m.key===form.module)?.name} icon={Plus} maxWidth="max-w-[760px]" closeDisabled={working} closeOnBackdrop={false} isDirty={Boolean(form.category || form.stem || form.title || form.instructions || form.correctKey || form.options.some(option=>option.text))} footer={<><button type="button" disabled={working} className="sibs-modal-btn-secondary" onClick={close}>Cancel</button><button type="submit" form="assessment-add-question" disabled={working} className="sibs-modal-btn-primary">{working?'Saving…':'Save Draft'}</button></>}>
      <form id="assessment-add-question" onSubmit={save} className="space-y-4 p-1">
        {modalError&&<p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{modalError}</p>}
        <SelectDropdown className={dropdownClass} label="Assessment Module" labelClassName={labelClass} searchPlaceholder="Search modules..." value={form.module} options={moduleOptions} disabled={working} required clearable={false} searchable onChange={value=>{if(value!==form.module){setModalError('');setForm(emptyForm(value));}}}/>
        {isChoice(form.module)&&<SelectDropdown className={dropdownClass} label="Category" labelClassName={labelClass} value={form.category} options={formCategoryOptions} disabled={working} required clearable={false} searchable placeholder="Select category" searchPlaceholder="Search categories..." onChange={changeFormCategory}/>}
        {form.module==='module2'&&<div className="grid gap-3 sm:grid-cols-2"><SelectDropdown className={dropdownClass} labelClassName={labelClass} label="Source section" placeholder="Select section" value={form.section} options={Array.from({length:9},(_,i)=>({value:String(i+1),label:`Section ${i+1}`}))} required clearable={false} disabled={working} onChange={v=>updateForm('section',v)}/><SelectDropdown className={dropdownClass} labelClassName={labelClass} label="Scoring pillar" placeholder="Select pillar" value={form.pillar} options={toOptions(bank.pillars||[])} required clearable={false} disabled={working} onChange={v=>updateForm('pillar',v)}/></div>}
        {form.module==='module5'&&<label className="block"><span className={labelClass}>Passage title</span><input required maxLength={150} className={fieldClass} value={form.title} disabled={working} onChange={e=>updateForm('title',e.target.value)}/></label>}
        <label className="block"><span className={labelClass}>{form.module==='module5'?'Typing passage':isPractical(form.module)?'Task / scenario':'Question'}</span><textarea required rows={form.module==='module5'?6:3} maxLength={form.module==='module5'?4000:form.module==='module1'?1000:2000} className={fieldClass} value={form.stem} disabled={working} onChange={e=>updateForm('stem',e.target.value)} placeholder="Enter question, task or passage…"/></label>
        {isChoice(form.module)&&<fieldset className="space-y-2"><legend className={labelClass}>{form.module==='module2'?'Response Options — enter explicit scoring weights':'Answer Options — select the correct answer'}</legend>{form.module==='module2'&&form.category==='scenario'&&<SelectDropdown className={dropdownClass} labelClassName={labelClass} label="Number of options" value={String(form.options.length)} options={toOptions(['3','4','5'])} clearable={false} disabled={working} onChange={v=>setForm(f=>({...f,options:Array.from({length:Number(v)},(_,i)=>({key:'ABCDE'[i],text:f.options[i]?.text||''})),scores:{}}))}/>}{form.options.map((o,i)=><div key={o.key} className="flex items-center gap-2">{form.module!=='module2'&&<input type="radio" name="correct-answer" value={o.key} checked={form.correctKey===o.key} required disabled={working} aria-label={`Mark option ${o.key} correct`} onChange={()=>updateForm('correctKey',o.key)} className="accent-sibs-orange"/>}<label htmlFor={`option-${o.key}`} className="w-6 shrink-0 text-xs font-extrabold">{o.key}</label><input id={`option-${o.key}`} required maxLength={500} className={fieldClass} value={o.text} disabled={working} placeholder={`Option ${o.key}`} onChange={e=>setForm(f=>({...f,options:f.options.map((entry,n)=>n===i?{...entry,text:e.target.value}:entry)}))}/>{form.module==='module2'&&<input type="number" required min={1} max={form.category==='comfort'?3:5} aria-label={`Score for ${o.key}`} className={`${fieldClass} !w-20 shrink-0`} placeholder="Score" value={form.scores[o.key]??''} disabled={working} onChange={e=>setForm(f=>({...f,scores:{...f.scores,[o.key]:e.target.value}}))}/>}</div>)}</fieldset>}
        {isPractical(form.module)&&<><label className="block"><span className={labelClass}>Scenario instructions, expected responses, scoring and media references</span><textarea required rows={6} maxLength={5000} className={fieldClass} value={form.instructions} disabled={working} onChange={e=>updateForm('instructions',e.target.value)} /></label><p className="rounded-lg bg-orange-50 p-3 text-xs text-orange-800">Draft only: requires a validated media or simulation contract before publication.</p></>}
        <p className="text-xs text-sibs-muted">Drafts are not included in candidate assessments.</p>
      </form>
    </ModalShell>}
    {view&&!publishing&&<ModalShell open onClose={close} closeOnBackdrop={false} title={`${view.module==='module5'?'Passage': ['module4','module6'].includes(view.module)?'Task':'Question'} #${view.id}`} subtitle={`${moduleLabel(view.module)} · ${view.category}`} icon={BookOpen} maxWidth={['module3','module4','module5','module6'].includes(view.module)?"max-w-[820px]":"max-w-[720px]"} autoDetectDirty={false} footer={view.status==='DRAFT'&&bank?.canPublish&&bank?.publishable?.includes(view.module)?<button type="button" className="sibs-modal-btn-primary" onClick={()=>{setPublishing(view);setModalError('');}}>Publish Question</button>:null}><div className="space-y-3"><QuestionStatus status={view.status}/>{view.module==='module3'&&view.source==='ORIGINAL'&&Number(view.id)===1&&<AssessmentAdminCoachingVideoPreview/>}{['module4','module5','module6'].includes(view.module)?<AssessmentAdminPracticalQuestionDetails key={`${view.module}:${view.id}`} question={view}/>:<><p className="whitespace-pre-wrap break-words text-sm font-extrabold">{view.stem}</p>{view.options?.map(o=><div key={o.key} className={`rounded-lg border p-3 text-xs ${isCorrectOption(view, o.key)?'border-emerald-200 bg-emerald-50 text-emerald-800':'border-sibs-border bg-white'}`}><strong>{o.key}. </strong>{o.text}{isCorrectOption(view, o.key)&&<span className="ml-2 font-bold">✓ Correct answer</span>}</div>)}{view.metadata?.title&&<p className="text-xs font-bold">Title: {view.metadata.title}</p>}{view.metadata?.pillar&&<div className="rounded-lg border border-sibs-border p-3 text-xs"><p>Section: {view.metadata.section} · Pillar: {view.metadata.pillar}</p><p>Scoring: {Object.entries(view.metadata.scores||{}).map(([k,v])=>`${k}: ${v}`).join(' · ')}</p></div>}{view.metadata?.instructions&&<p className="whitespace-pre-wrap break-words rounded-lg border border-sibs-border p-3 text-xs">{view.metadata.instructions}</p>}</>}{view.status==='DRAFT'&&!bank?.publishable?.includes(view.module)&&<p className="text-xs font-semibold text-orange-700">Draft only — media/simulation validation required.</p>}{view.createdBy&&<QuestionCreator key={`${view.module}:${view.id}:${view.createdBy}`} question={view}/>}</div></ModalShell>}
    {publishing&&<ModalShell open onClose={close} title="Publish Question?" subtitle={`Question #${publishing.id}`} icon={CheckCircle2} maxWidth="max-w-[520px]" autoDetectDirty={false} closeDisabled={working} closeOnBackdrop={false} footer={<><button type="button" disabled={working} className="sibs-modal-btn-secondary" onClick={()=>{setPublishing(null);setModalError('');}}>Cancel</button><button type="button" disabled={working} className="sibs-modal-btn-primary" onClick={()=>void publish()}>{working?'Publishing…':'Confirm Publish'}</button></>}><p className="text-sm leading-relaxed">Confirm the question and its correct answer have been reviewed. Published questions are immutable and eligible for future public assessment draws. Existing attempts will not change.</p>{modalError&&<p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{modalError}</p>}</ModalShell>}
    {importState&&<ModalShell open onClose={close} title="Import Questions" subtitle="PDF or Word document · review before saving" icon={Upload} maxWidth="max-w-[900px]" closeDisabled={working} closeOnBackdrop={false} isDirty={Boolean(importState.text)} footer={<><button type="button" disabled={working} className="sibs-modal-btn-secondary" onClick={close}>Cancel</button><button type="button" disabled={working||!importReady} className="sibs-modal-btn-primary" onClick={()=>void saveImport()}>{working?'Processing…':'Save All Drafts'}</button></>}><div className="space-y-4">
      {modalError&&<p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{modalError}</p>}
      <SelectDropdown className={dropdownClass} labelClassName={labelClass} searchPlaceholder="Search modules..." label="Default module (if document has no module headings)" value={importState.defaultModule} options={moduleOptions} clearable searchable disabled={working} placeholder="Detect from module headings" onChange={v=>setImportState(s=>({...s,defaultModule:v||'',preview:null}))}/>
      <div className="space-y-3">
        <span className={labelClass}>Assessment document</span>
        <input ref={uploadInputRef} type="file" accept=".pdf,.doc,.docx" disabled={working} className="hidden" onChange={e=>{selectDocument(e.target.files?.[0]);e.target.value='';}} />
        <div className={`rounded-[10px] border border-dashed p-5 transition ${dragging?'border-sibs-orange bg-sibs-cream-light':'border-sibs-border bg-sibs-surface'}`} onDragOver={e=>{e.preventDefault();if(!working)setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);if(e.dataTransfer.files.length===1)selectDocument(e.dataTransfer.files[0]);else setModalError('Upload one document at a time.');}}>
          <div className="flex flex-col items-center gap-2 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-[10px] border border-sibs-border bg-white text-sibs-navy shadow-xs"><UploadCloud size={23}/></div><p className="text-xs font-extrabold">Drag and drop your assessment document</p><p className="text-xs font-semibold text-sibs-muted">PDF, DOCX or DOC · Maximum 5 MB</p><button type="button" disabled={working} className={secondary} onClick={()=>uploadInputRef.current?.click()}>Browse Files</button></div>
        </div>
        {importState.file&&<div className="flex items-center gap-3 rounded-[10px] border border-sibs-border bg-white p-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sibs-surface"><FileText size={18}/></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold" title={importState.file.name}>{importState.file.name}</p><p className="text-[10px] font-semibold text-sibs-muted">{(importState.file.size/1024).toFixed(1)} KB</p></div><button type="button" disabled={working} aria-label="Remove document" className="rounded-md p-2 text-sibs-muted hover:bg-sibs-cream-light hover:text-sibs-orange" onClick={()=>setImportState(s=>({...s,file:null,text:'',preview:null}))}><X size={16}/></button></div>}
        <div className="flex justify-end"><button type="button" disabled={working||!importState.file} className={primary} onClick={()=>void importPreview(true)}><Upload size={15}/> {working?'Processing…':'Extract & Preview'}</button></div>
      </div>
      <details className="rounded-lg border border-sibs-border p-3 text-xs"><summary className="cursor-pointer font-extrabold">Supported document format</summary><pre className="mt-2 whitespace-pre-wrap text-xs text-sibs-muted">{`Module 1
Category: Verbal Analogies
Question 1: Enter question here
A. Option A
B. Option B
C. Option C
D. Option D
Answer: B

Module 5
Passage: Enter the full typing passage here (100+ characters)
Title: Passage title

Module 2: use Category: frequency, Section: 1, Pillar: conscientiousness, A–E options and Scores: A=5, B=4, C=3, D=2, E=1.
Modules 3, 4, 6: Task: ... followed by Instructions: ...
Module 7: use the Module 1 format with a computer literacy category.`}</pre></details>
      {importState.text&&<><label className="block"><span className={labelClass}>Extracted text (review and correct formatting)</span><textarea className={fieldClass} rows={9} maxLength={300000} value={importState.text} disabled={working} onChange={e=>setImportState(s=>({...s,text:e.target.value,preview:null}))}/></label><button type="button" disabled={working} className={secondary} onClick={()=>void importPreview(false)}><RefreshCw size={15}/> Validate text</button></>}
      {importState.preview&&<div className="space-y-3"><p className="font-extrabold text-sm">{importState.preview.items.length} valid items · {importState.preview.errors.length} issues</p>{importState.preview.errors.length>0&&<div className="max-h-44 overflow-auto rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{importState.preview.errors.map((e,i)=><p key={i}>Line {e.line}: {e.message}</p>)}</div>}<div className="max-h-64 overflow-auto divide-y divide-sibs-border rounded-lg border border-sibs-border">{importState.preview.items.map((q,i)=><div className="p-3 text-xs" key={i}><p className="font-extrabold">{moduleLabel(q.module)} · {q.category||'Practical item'}</p><p className="mt-1 break-words">{q.stem}</p>{q.options?.map(o=><p key={o.key} className="mt-1 text-sibs-muted">{o.key}. {o.text}{o.key===q.correctKey?' (Correct)':''}{q.scores?.[o.key]!==undefined?` · ${q.scores[o.key]} points`:''}</p>)}</div>)}</div></div>}
      <p className="text-xs text-sibs-muted">All items are saved as drafts in one transaction. Missing or unclear answers and unrecognized text must be corrected first. No AI-generated answer keys.</p>
    </div></ModalShell>}
  </div>;
}
