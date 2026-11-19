import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3,
  Loader2, LockKeyhole, Monitor, Save, Send, ShieldCheck, ChevronRight,
} from 'lucide-react';
import api from '../../lib/axios/api-template';
import SelectDropdown from '../../components/ui/SelectDropdown';
import CsrFitLegacyAssessmentPage from './CsrFitLegacyAssessmentPage';
import CsrFitModuleInstructions from '../../components/assessment/CsrFitModuleInstructions';
import CsrFitCandidateWelcome from '../../components/assessment/CsrFitCandidateWelcome';
import CsrFitModuleJourney from '../../components/assessment/CsrFitModuleJourney';
import CsrFitAdministrativeSimulation from '../../components/assessment/CsrFitAdministrativeSimulation';
import CsrFitTypingGame from '../../components/assessment/CsrFitTypingGame';
import CsrFitOneTimeAudio from '../../components/assessment/CsrFitOneTimeAudio';
import CsrFitAssessmentLoading from '../../components/assessment/CsrFitAssessmentLoading';
import { CSR_FIT_MODULE_NAMES, CSR_FIT_MODULE_LIMITS, CSR_FIT_OVERALL_LIMIT_MINUTES } from '../../components/assessment/csrFitModuleGuides';

const titles = CSR_FIT_MODULE_NAMES;
const labels = ['70 questions','50 questions','1 video + 1 question','2 practical tasks','2 typing passages','1 audio + response form','15 questions'];
const itemKey = (module,id) => `${module}:${id}`;
const errorLabel = error => error?.response?.data?.message || error?.message || 'Unable to save your assessment. Please retry.';
const elapsedLabel = ms => {
  const secs=Math.max(0,Math.ceil(ms/1000));
  return `${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;
};
const makeEmpty = () => ({filename:'',folder:'',customerName:'',accountNumber:'',callbackNumber:'',category:'',notes:'',product:'',issue:'',action:''});
const btn = 'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-40';
const optionCls = selected => `flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-left text-sm transition ${selected ? 'border-[#1d5480] bg-blue-50 text-sibs-navy' : 'border-sibs-border bg-white text-sibs-secondary hover:border-slate-400'}`;
function FormText({label,value,onChange,placeholder='',required=true,readOnly=false}) {
  return <label className="block min-w-0"><span className="mb-1.5 block text-[11px] font-extrabold text-sibs-navy">{label}{required?' *':''}</span>
    <input required={required} value={value||''} placeholder={placeholder} readOnly={readOnly} onChange={e=>{if(!readOnly)onChange(e.target.value);}}
      className={`h-11 w-full rounded-lg border border-sibs-border px-3 text-sm text-sibs-navy outline-none focus:border-sibs-navy ${readOnly?'cursor-default bg-sibs-surface':'bg-white'}`} /></label>;
}
function FormChoice({label,value,options,onChange,disabled=false}) {
  return <div className="min-w-0"><span className="mb-1.5 block text-[11px] font-extrabold text-sibs-navy">{label} *</span>
    <SelectDropdown label={label} hideLabel value={value||''} clearable={false} disabled={disabled}
      placeholder="Select an option" options={options.map(o=>typeof o==='string'?{value:o,label:o}:{value:o.key,label:o.text})}
      onChange={onChange} buttonClassName="min-h-11 rounded-lg bg-white text-sm" /></div>;
}
function ChoiceGrid({options=[],value,onSelect,multiple=false,locked=false}) {
  const picked=multiple?(Array.isArray(value)?value:[]):[value];
  return <div className="mt-4 grid gap-2 sm:grid-cols-2">{options.map(o=>{
    const active=picked.includes(o.key);
    return <button type="button" disabled={locked} aria-pressed={active} key={o.key} onClick={()=>onSelect(o.key)}
      className={`${optionCls(active)} ${locked ? 'cursor-default disabled:cursor-default disabled:opacity-100' : ''}`}>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[10px] font-extrabold ${active?'border-sibs-navy bg-sibs-navy text-white':'border-sibs-border bg-sibs-surface'}`}>{active?<Check size={13}/>:o.key}</span>
      <span className="text-left leading-relaxed">{o.text}</span></button>;
  })}</div>;
}
function VideoScenario({info,onComplete,completed=false}) {
  const ref=useRef(null),watched=useRef(0);
  const [done,setDone]=useState(completed);
  useEffect(()=>{if(completed)setDone(true);},[completed]);
  return <div className="space-y-3"><p className="text-xs leading-5 text-sibs-secondary">{info.scenario}</p>
    <video ref={ref} controls playsInline preload="metadata" controlsList="nodownload noplaybackrate" src={info.videoUrl}
      className="aspect-video w-full rounded-xl bg-[#072b4c]"
      onTimeUpdate={e=>{watched.current=Math.max(watched.current,e.currentTarget.currentTime);}}
      onSeeking={e=>{const video=e.currentTarget;if(video.currentTime>watched.current+1)video.currentTime=watched.current;}}
      onRateChange={e=>{if(e.currentTarget.playbackRate!==1)e.currentTarget.playbackRate=1;}}
      onEnded={()=>{setDone(true);onComplete();}} />
    <p className="text-[11px] font-semibold text-sibs-muted">Watch the entire supervisor briefing. The response choices unlock after playback.</p>
    {!done&&<span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800"><LockKeyhole size={13}/> Briefing must finish before answering</span>}
    {done&&<span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 size={14}/> Briefing completed</span>}
  </div>;
}
export default function CsrFitAssessmentPage(){
  const [params]=useSearchParams();const token=String(params.get('token')||'').trim();
  const [data,setData]=useState(null),[busy,setBusy]=useState(false),[busyLabel,setBusyLabel]=useState(''),[loading,setLoading]=useState(true),
    [error,setError]=useState(''),[now,setNow]=useState(Date.now()),[cursor,setCursor]=useState(0),
    [answers,setAnswers]=useState({}),[saved,setSaved]=useState(''),[confirm,setConfirm]=useState(false),
    [intake,setIntake]=useState({firstName:'',middleName:'',lastName:'',email:'',yearOfBirth:'',gender:'',education:'',firstLanguage:'',industryBackground:''}),
    [draft,setDraft]=useState(makeEmpty),[typing,setTyping]=useState(null),[videoDone,setVideoDone]=useState(false),
    [mobile,setMobile]=useState(false),[moduleTransition,setModuleTransition]=useState(null),
    [forwardSelection,setForwardSelection]=useState(null);
  const writeQueue=useRef(Promise.resolve()),saveBusy=useRef(false),clockOffset=useRef(0),expiryBusy=useRef(false),transitionInFlight=useRef(false);
  const startedTyping=useRef(new Set()),lastTyped=useRef(''),pendingTyping=useRef(null),draftTouched=useRef(new Set());
  const activeModule=Number(data?.session?.current||1),module=`module${activeModule}`;
  // Modules 1 and 2: candidates may change the current unsaved choice.
  // Clicking Next commits the chosen answer once; saved questions are forward-only.
  const forwardOnly=activeModule===1||activeModule===2;
  const forwardSaveInFlight=useRef(false);
  const forwardSelectionRef=useRef(null);
  // A new module begins with its own tutorial. Previously started attempts
  // retain their existing timed question screen and are never restarted.
  const showingModuleInstructions=data?.status==='IN_PROGRESS' && !data?.session?.moduleStartedAtMs;
  const bank=data?.questions||{};
  const items=useMemo(()=>{
    if(module==='module1'||module==='module2'||module==='module7')return bank[module]||[];
    if(module==='module3')return bank.module3?[{id:1,stem:bank.module3.stem,options:bank.module3.options,category:'Multi-select'}]:[];
    if(module==='module4')return [{id:1,stem:'File & folder management'},{id:2,stem:'Customer data entry'}];
    if(module==='module5')return (bank.module5?.passages||[]).map(p=>({...p,stem:p.title}));
    if(module==='module6')return [{id:1,stem:'Customer voicemail logging'}];return [];
  },[bank,module]);
  const passageFinished = passage => {
    const startedAt = Number(data?.session?.typingStarts?.[passage.id] || 0);
    return startedAt > 0 && now - clockOffset.current >= startedAt + 60000;
  };
  // A partially typed passage is still in progress until its full 60 seconds
  // elapse. Do not show it as complete or unlock the next passage early.
  const countInfo={done:items.filter(p=>Boolean(answers[itemKey(module,p.id)]) &&
    (activeModule !== 5 || passageFinished(p))).length,total:items.length};
  const firstMissing=items.findIndex(p=>!answers[itemKey(module,p.id)]);
  const maxAllowed=firstMissing===-1?items.length-1:firstMissing;
  const index=Math.max(0,Math.min(cursor,items.length-1));
  const question=items[index],key=question?itemKey(module,question.id):'';
  const alreadyAnswered=Boolean(answers[key]);
  const currentAnswer=answers[key];
  const pendingForward=forwardOnly&&forwardSelection?.key===key?forwardSelection:null;
  const displayedAnswer=pendingForward?.choice??currentAnswer;
  const typingStartedAt=Number(data?.session?.typingStarts?.[question?.id]||0);
  const typingLeft=typingStartedAt?typingStartedAt+60000-(now-clockOffset.current):60000;
  const typingDone=Boolean(typingStartedAt)&&typingLeft<=0;
  // Module 5 has two independent passage clocks; each starts on that passage's
  // first key press, not when the typing module is opened.
  const limitMs=activeModule === 5
    ? (typingStartedAt ? typingLeft : 60000)
    : (data?.session?.moduleDeadlineMs||0)-(now-clockOffset.current);
  const totalMs=(data?.session?.totalDeadlineMs||0)-(now-clockOffset.current);
  // A finished typing round is NOT a module timeout. The next round must get
  // its own full 60 seconds, capped only by the global assessment deadline.
  const moduleExpired=activeModule===5 ? false : Boolean(data?.session?.moduleDeadlineMs)&&limitMs<=0;
  const overallExpired=Boolean(data?.session?.totalDeadlineMs)&&totalMs<=0;
  const allAnswered=items.length>0&&items.every(p=>Boolean(answers[itemKey(module,p.id)]));
  const forwardSelectionCommitted=Boolean(pendingForward && pendingForward.status!=='draft');
  const typingRoundWaiting=activeModule===5&&!typingStartedAt;
  const typingRoundFinished=activeModule===5&&typingStartedAt&&typingLeft<=0;
  const canChange=data?.status==='IN_PROGRESS'&&!busy&&!moduleExpired&&!overallExpired&&
    !(forwardOnly&&(alreadyAnswered||forwardSelectionCommitted||forwardSaveInFlight.current));
  const answerSaving=forwardOnly&&(pendingForward?.status==='saving'||saved==='Saving…');
  const showModule5Next=activeModule===5&&typingDone&&alreadyAnswered;

  const record=useCallback((type)=>{
    if(!token||!data||data.status!=='IN_PROGRESS')return;
    void api.post(`/api/assessment/public/${token}/integrity-event`,{type},{withCredentials:false}).catch(()=>{});
  },[data,token]);
  useEffect(()=>{const tick=setInterval(()=>setNow(Date.now()),1000);const resize=()=>setMobile(window.innerWidth<760);
    resize();window.addEventListener('resize',resize);return()=>{clearInterval(tick);window.removeEventListener('resize',resize);};},[]);
  useEffect(()=>{
    if(data?.status!=='IN_PROGRESS')return undefined;
    const visible=()=>{if(document.visibilityState==='hidden')record('TAB_HIDDEN');};
    const blur=()=>record('WINDOW_BLUR');
    document.addEventListener('visibilitychange',visible);window.addEventListener('blur',blur);
    return()=>{document.removeEventListener('visibilitychange',visible);window.removeEventListener('blur',blur);};
  },[data?.status,record]);
  const hydrate=useCallback(payload=>{
    const source=payload?.data?.status?payload.data:payload;
    if(source.serverNowMs)clockOffset.current=Date.now()-Number(source.serverNowMs);
    setData(source);setAnswers(source?.answers||{});
    // Candidate identity comes from the HRIS Server. Never derive editable
    // name fields from display text; the welcome screen renders them read-only.
    setIntake(old=>({...old,email:source?.candidate?.email||'',
      firstName:source?.candidate?.firstName||'',
      middleName:source?.candidate?.middleName||'',
      lastName:source?.candidate?.lastName||''}));
    const n=Number(source?.session?.current||1),bk=source?.questions||{};
    const keys=n===1||n===2||n===7?(bk[`module${n}`]||[]).map(q=>q.id):n===3||n===6?[1]:n===4?[1,2]:n===5?(bk.module5?.passages||[]).map(q=>q.id):[];
    const pos=keys.findIndex(id=>!source?.answers?.[`module${n}:${id}`]);
    setCursor(pos===-1?Math.max(0,keys.length-1):pos);
    forwardSaveInFlight.current=false;
    forwardSelectionRef.current=null;
    setForwardSelection(null);
    setVideoDone(Boolean(source?.session?.videoComplete));setTyping(null);setDraft(makeEmpty());draftTouched.current.clear();setSaved('');
  },[]);
  const retrieve=useCallback(async()=>{
    setLoading(true);setError('');
    try{if(!/^[a-f0-9]{64}$/.test(token))throw new Error('Open the secure assessment link from your email.');
      const response=await api.get(`/api/assessment/public/${token}`,{withCredentials:false});hydrate(response.data);
    }catch(e){setError(errorLabel(e));}finally{setLoading(false);}
  },[token,hydrate]);
  useEffect(()=>{void retrieve();},[retrieve]);
  async function start(){
    if(busy)return;setBusy(true);setBusyLabel('Preparing your assessment…');setError('');try{
      const r=await api.post(`/api/assessment/public/${token}/start`,{intake},{withCredentials:false});hydrate(r.data);
    }catch(e){setError(errorLabel(e));}finally{setBusy(false);}
  }
  function persist(keyValue,value){
    // The voicemail response is final after the first confirmed save. Do not
    // optimistically count it as completed: only the API can confirm success.
    const oneTimeResponse=keyValue==='module6:1';
    const forwardOnceAnswer=/^module[12]:/.test(keyValue);
    // For the first two modules, count an item as answered ONLY after a
    // successful Server save. An unsuccessful request must not unlock Next.
    if(!oneTimeResponse&&!forwardOnceAnswer)setAnswers(prev=>({...prev,[keyValue]:value}));
    setSaved('Saving…');
    const work=writeQueue.current.catch(()=>{}).then(async()=>{
      const r=await api.put(`/api/assessment/public/${token}/answer`,{key:keyValue,choice:value},{withCredentials:false});
      if(r.data?.success===false)throw new Error(r.data.message);
      if(oneTimeResponse){
        setAnswers(prev=>({...prev,[keyValue]:value}));
        setDraft({...makeEmpty(),...value});
        draftTouched.current.clear();
      }else if(forwardOnceAnswer){
        setAnswers(prev=>({...prev,[keyValue]:value}));
      }
      setError('');setSaved('Saved');
      return r.data;
    });
    writeQueue.current=work.catch(e=>{setSaved('Not saved');setError(`Unable to save: ${errorLabel(e)}`);});return work;
  }
  function select(value){
    if(!canChange) return;
    const existing=answers[key];
    const next=activeModule===3?(Array.isArray(existing)?existing:[]).includes(value)?existing.filter(x=>x!==value):[...(Array.isArray(existing)?existing:[]),value]:value;
    if(activeModule===3&&next.length===0){setAnswers(prev=>{const copy={...prev};delete copy[key];return copy;});return;}
    if(forwardOnly){
      // No API request is sent until Next is clicked. The candidate can
      // freely select a different option while the answer is only a draft.
      const previous=forwardSelectionRef.current;
      if(forwardSaveInFlight.current || (previous?.key===key && previous.status!=='draft'))return;
      const selection={key,choice:next,status:'draft'};
      forwardSelectionRef.current=selection;
      setForwardSelection(selection);
      setSaved('');
      setError('');
    }else{
      void persist(key,next);
    }
  }
  async function commitForwardAndNext(){
    if(!forwardOnly||busy||moduleExpired||overallExpired||forwardSaveInFlight.current)return;
    // Supports resuming an older attempt with a confirmed final response.
    if(alreadyAnswered){
      if(index===items.length-1){await advance();}
      else goNext();
      return;
    }
    const selection=forwardSelectionRef.current;
    if(!selection || selection.key!==key || !selection.choice)return;
    forwardSaveInFlight.current=true;
    const saving={...selection,status:'saving'};
    forwardSelectionRef.current=saving;
    setForwardSelection(saving);
    try{
      // Only Next commits the answer. The Server locks it permanently after
      // confirmation, and protects against duplicate or out-of-order writes.
      await persist(selection.key,selection.choice);
      const committed={...selection,status:'saved'};
      forwardSelectionRef.current=committed;
      setForwardSelection(committed);
      if(index===items.length-1){
        // All responses are now recorded on the Server before progression.
        await advance();
      }else{
        // Do not use maxAllowed here: it was calculated before this save.
        setCursor(n=>Math.min(n+1,items.length-1));
        setForwardSelection(null);
        setSaved('');
        setDraft(makeEmpty());draftTouched.current.clear();
        setTyping(null);lastTyped.current='';pendingTyping.current=null;
      }
    }catch{
      // Next was clicked, so the choice is now final even if the network
      // fails. The candidate can retry saving exactly the same selection.
      const failed={...selection,status:'failed'};
      forwardSelectionRef.current=failed;
      setForwardSelection(failed);
    }finally{
      forwardSaveInFlight.current=false;
    }
  }
  const formData=useMemo(()=>{const from=answers[key];return from&&typeof from==='object'&&!Array.isArray(from)?{...makeEmpty(),...from}:draft;},[answers,key,draft]);
  function changeDraft(name,value){draftTouched.current.add(name);setDraft(prev=>({...prev,[name]:value}));}
  function formValue(name){return draftTouched.current.has(name)?draft[name]:(formData[name]||'');}
  async function submitTask(){
    if(saveBusy.current || alreadyAnswered || !canChange)return;
    const fields=bank.module6.fields || [],choices=bank.module6.choices || [];
    const value=Object.fromEntries([...fields.map(f=>f.id),...choices.map(c=>c.id)].map(k=>[k,formValue(k)]));
    const incomplete=fields.some(f=>!String(value[f.id]??'').trim()) ||
      choices.some(c=>!c.options.some(opt=>opt.key===value[c.id]));
    if(incomplete){setError('Complete all six required voicemail fields before saving. Your entries have been kept.');return;}
    saveBusy.current=true;
    setError('');
    try{await persist(key,value);}catch{/* Preserve the draft; a failed save cannot complete the item. */}
    finally{saveBusy.current=false;}
  }
  async function ensureTypingStarted(passageId){
    if(startedTyping.current.has(passageId))return;
    startedTyping.current.add(passageId);
    try{
      const r=await api.post(`/api/assessment/public/${token}/typing-start`,{passageId},{withCredentials:false});
      // The typing passage has its own 60-second timer; starting it must NOT
      // overwrite the Server-issued deadline for the full Module 5.
      setData(old=>({...old,session:{...old.session,typingStarts:{...old.session.typingStarts,[passageId]:r.data.startedAtMs}}}));
    }catch(e){startedTyping.current.delete(passageId);setError(errorLabel(e));}
  }
  function onType(value){if(!canChange||typingDone)return;
    setTyping(value);lastTyped.current=value;
    if(!typingStartedAt&&!startedTyping.current.has(question.id))void ensureTypingStarted(question.id);
  }
  useEffect(()=>{
    if(activeModule!==5||!question||!typingStartedAt||typingDone||!typing)return undefined;
    const timer=setInterval(()=>{
      const v=lastTyped.current;
      if(v&&v!==pendingTyping.current){pendingTyping.current=v;void persist(itemKey('module5',question.id),{text:v,startedAtMs:typingStartedAt});}
    },1800);
    return()=>clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[activeModule,question?.id,typingStartedAt,typingDone,token,Boolean(typing?.length)]);
  useEffect(()=>{if(activeModule===5&&question&&typingStartedAt&&typingLeft<2500&&typingLeft>0&&lastTyped.current){
    const v=lastTyped.current;if(v!==pendingTyping.current){pendingTyping.current=v;void persist(key,{text:v,startedAtMs:typingStartedAt});}
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[activeModule,question?.id,typingStartedAt,typingLeft<2500]);
  async function beginModule(){
    if(busy)return;setBusy(true);setBusyLabel('Starting the module…');setError('');
    try{
      await api.post(`/api/assessment/public/${token}/begin-module`,{moduleNumber:activeModule},{withCredentials:false});
      const response=await api.get(`/api/assessment/public/${token}`,{withCredentials:false});
      hydrate(response.data);
      window.scrollTo({top:0,behavior:'smooth'});
    }catch(e){setError(errorLabel(e));}finally{setBusy(false);}
  }
  // Keep the completion loader visible for at least five seconds after each module, including
  // a module advanced automatically when its deadline expires. The Server is
  // authoritative for completion and progression; this overlay never advances
  // the candidate locally or resets any assessment timer.
  const allowTransitionToRender = async startedAt => {
    const remaining = 5000 - (Date.now() - startedAt);
    if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining));
  };
  async function advance(){
    if(busy || transitionInFlight.current)return;
    transitionInFlight.current=true;
    const previous=activeModule, nextNumber=previous+1, startedAt=Date.now();
    setModuleTransition({from:previous,to:nextNumber,phase:'saving'});
    setBusy(true);setError('');
    try{
      await writeQueue.current;
      setModuleTransition({from:previous,to:nextNumber,phase:'preparing'});
      const r=await api.post(`/api/assessment/public/${token}/advance`,{}, {withCredentials:false});
      if(r.data?.success===false)throw new Error(r.data.message);
      const next=await api.get(`/api/assessment/public/${token}`,{withCredentials:false});
      setModuleTransition({from:previous,to:nextNumber,phase:'ready'});
      await allowTransitionToRender(startedAt);
      hydrate(next.data);
      window.scrollTo({top:0,behavior:'instant'});
    }catch(e){setError(errorLabel(e));}
    finally{setModuleTransition(null);setBusy(false);transitionInFlight.current=false;}
  }
  async function submit(){
    if(busy || transitionInFlight.current)return;
    transitionInFlight.current=true;
    const startedAt=Date.now();
    setModuleTransition({from:7,to:null,phase:'saving'});
    setBusy(true);setError('');setConfirm(false);
    try{
      await writeQueue.current;
      const r=await api.post(`/api/assessment/public/${token}/submit`,{}, {withCredentials:false});
      if(r.data?.success===false)throw new Error(r.data.message);
      setModuleTransition({from:7,to:null,phase:'ready'});
      await allowTransitionToRender(startedAt);
      setData(old=>({...old,status:'SUBMITTED'}));
      window.scrollTo({top:0,behavior:'instant'});
    }catch(e){setError(errorLabel(e));}
    finally{setModuleTransition(null);setBusy(false);transitionInFlight.current=false;}
  }
  useEffect(()=>{
    if(data?.status!=='IN_PROGRESS'||expiryBusy.current||busy)return;
    if(!overallExpired&&!moduleExpired)return;
    expiryBusy.current=true;
    const operation=overallExpired?submit():activeModule===7?submit():advance();
    Promise.resolve(operation).finally(()=>{expiryBusy.current=false;});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[data?.status,activeModule,moduleExpired,overallExpired,busy]);
  function goNext(){
    if(index>=items.length-1||(forwardOnly&&(!alreadyAnswered||forwardSaveInFlight.current)))return;
    forwardSelectionRef.current=null;setForwardSelection(null);
    setCursor(n=>Math.min(n+1,maxAllowed));setSaved('');setDraft(makeEmpty());draftTouched.current.clear();setTyping(null);lastTyped.current='';pendingTyping.current=null;
  }
  function goPrev(){
    if(forwardOnly)return;
    setCursor(n=>Math.max(0,n-1));setDraft(makeEmpty());draftTouched.current.clear();setTyping(null);lastTyped.current='';pendingTyping.current=null;
  }
  const sectionTitle=<header className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#082e53] px-5 py-3 text-white shadow-sm sm:px-7 sm:py-4">
    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
      <div className="flex h-14 w-28 shrink-0 items-center justify-center rounded-xl bg-white px-2 py-1 shadow-sm sm:h-16 sm:w-36">
        <img src={`${import.meta.env.BASE_URL}SiBSLogoNavy.png`} alt="SiBS — Human Expertise. Technology Forward." className="h-full w-full object-contain" decoding="async" />
      </div>
      <div className="min-w-0">
        <h1 className="text-lg font-extrabold leading-tight sm:text-xl">SiBS CSR-Fit Online Assessment</h1>
        <p className="mt-1 text-[11px] font-semibold text-white/70">Candidate testing · 7 modules · {data?.overallLimitMinutes || CSR_FIT_OVERALL_LIMIT_MINUTES}-minute maximum</p>
      </div>
    </div>
    <div className="hidden items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold sm:flex"><ShieldCheck size={14}/> Secure session</div>
  </header>;
  // Keep the header and the content beneath it aligned at every stage.
  // Retain the wider live-exam layout for the right-hand timer and navigator.
  const layoutWidth = data?.status==='IN_PROGRESS' && !showingModuleInstructions ? 'max-w-[1340px]' : 'max-w-[1190px]';
  return <main className="min-h-screen bg-[#f5f7fa] px-3 py-5 font-jakarta text-sibs-navy sm:px-6 sm:py-8"><div className={`mx-auto w-full ${layoutWidth}`}> 
    {sectionTitle}
    {loading?<CsrFitAssessmentLoading mode="skeleton" />:
    error&&!data?<div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-white p-6 text-sm text-rose-700">{error}</div>:
    data?.legacy?<CsrFitLegacyAssessmentPage/>:
    data?.status==='SUBMITTED'?<section className="mt-5 rounded-xl border border-sibs-border bg-white p-12 text-center"><CheckCircle2 size={46} className="mx-auto text-emerald-600"/><h2 className="mt-3 text-xl font-extrabold">Assessment submitted</h2><p className="mt-2 text-sm text-sibs-muted">Your responses are saved for Talent Acquisition review. A results email will be sent to your invitation address.</p></section>:
    data?.status==='NOT_STARTED'?<CsrFitCandidateWelcome candidate={data.candidate}
      busy={busy} error={error} mobile={mobile} overallLimitMinutes={data.overallLimitMinutes || CSR_FIT_OVERALL_LIMIT_MINUTES}
      onStart={() => void start()} />:
        data?.status==='IN_PROGRESS'?<>
      {/* Show the module journey only between modules, never while answering a timed exam. */}
      {showingModuleInstructions && <div className="mt-5">
        <CsrFitModuleJourney activeModule={activeModule} moduleOneCount={bank.module1?.length} moduleLimits={(data.modules || []).length === 7 ? data.modules.map(m => Math.round(m.durationMs / 60000)) : CSR_FIT_MODULE_LIMITS} showDetails compact />
      </div>}
      {showingModuleInstructions?<CsrFitModuleInstructions key={activeModule} moduleNumber={activeModule} moduleOneCount={bank.module1?.length}
        moduleLimits={(data.modules || []).length === 7 ? data.modules.map(m => Math.round(m.durationMs / 60000)) : CSR_FIT_MODULE_LIMITS}
        overallLimitMinutes={data.overallLimitMinutes || CSR_FIT_OVERALL_LIMIT_MINUTES}
        candidateName={data.candidate?.name} totalRemainingMs={totalMs}
        starting={busy} onBegin={()=>void beginModule()} error={error}/>
    :<>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sibs-border bg-white px-4 py-3">
        <span className="text-xs font-semibold">{data.candidate?.name} · Module {activeModule} of 7</span>
      </div>
      {error&&<div role="alert" className="mt-3 flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700"><AlertCircle size={16}/>{error}</div>}
      <section className="mt-3 overflow-visible rounded-2xl border border-sibs-border bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-sibs-border px-5 py-4">
        <div><span className="text-[10px] font-bold text-sibs-orange">MODULE {activeModule}</span><h2 className="text-base font-extrabold sm:text-lg">{titles[activeModule-1]}</h2><p className="mt-0.5 text-[11px] text-sibs-muted">{activeModule === 1 ? `${items.length} questions` : labels[activeModule-1]} · Answer every item in sequence; skipping is disabled.</p></div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sibs-muted">{saved==='Saving…'?<Loader2 size={13} className="animate-spin"/>:<Save size={13}/>} {saved||(forwardOnly?(pendingForward?.status==='draft'?'Not saved yet · Click Next':'Saved on Next'):'Automatic save')}</span>
      </div>
      {moduleExpired&&<div className="mx-5 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">Module time has ended. Unanswered items are marked timed out; the assessment will move to the next module.</div>}
      <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_270px]"><div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-extrabold">{activeModule===5?'Passage':activeModule===4?'Task':'Question'} {index+1} of {items.length}</p><span className="text-[11px] font-semibold text-sibs-muted">{countInfo.done||0}/{countInfo.total||items.length} completed</span></div>
        {(activeModule===1||activeModule===2||activeModule===7)&&question?<div><p className="text-[11px] font-semibold text-sibs-muted">{question.category}</p><h3 className="mt-1 whitespace-pre-wrap text-base font-extrabold leading-7">{question.stem}</h3><ChoiceGrid options={question.options} value={displayedAnswer} onSelect={select} locked={!canChange}/>
          {forwardOnly&&<div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-sibs-border pt-4">
            <p role="status" aria-live="polite" className="flex items-center gap-1.5 text-[11px] font-semibold text-sibs-muted">
              {answerSaving?<Loader2 size={13} className="animate-spin"/>:<LockKeyhole size={13}/>}
              {alreadyAnswered?'Answer saved and locked. Continue to the next question.':
                pendingForward?.status==='failed'?'Saving failed. Your choice is locked; click Retry save to continue.':
                pendingForward?.status==='saving'?'Saving your final answer…':
                pendingForward?.status==='draft'?'You can change your answer until you click Next.':
                'Choose an answer. You can change it before clicking Next.'}
            </p>
            <button type="button" onClick={()=>void commitForwardAndNext()}
              disabled={(!alreadyAnswered&&!pendingForward?.choice)||busy||moduleExpired||overallExpired||answerSaving||forwardSaveInFlight.current}
              className={`${btn} ml-auto bg-sibs-navy text-white`}>
              {pendingForward?.status==='failed'?'Retry save':index===items.length-1?`Proceed to Module ${activeModule+1}`:'Next question'}
              <ArrowRight size={14}/>
            </button>
          </div>}
        </div>:null}
        {activeModule===3&&question?<div className="space-y-4"><VideoScenario info={bank.module3} completed={videoDone} onComplete={async()=>{
            try{
              await api.post(`/api/assessment/public/${token}/integrity-event`,{type:'VIDEO_COMPLETED'},{withCredentials:false});
              setVideoDone(true);
            }catch(e){setError(`Unable to confirm the completed briefing: ${errorLabel(e)}`);}
          }}/>
          {videoDone||alreadyAnswered?<div><h3 className="text-sm font-extrabold">{bank.module3.stem}</h3><p className="mt-1 text-[11px] text-sibs-muted">Select all applicable responses.</p><ChoiceGrid options={bank.module3.options} value={currentAnswer} multiple onSelect={select} locked={!canChange}/></div>:null}</div>:null}
        {activeModule===4&&question?<CsrFitAdministrativeSimulation
          key={`${module}:${question.id}`} taskIndex={index} bank={bank.module4}
          answer={currentAnswer} disabled={!canChange} saving={busy}
          onSave={value=>canChange ? persist(key,value) : Promise.reject(new Error("Module is no longer accepting answers."))}/>:null}
        {activeModule===5&&question?<CsrFitTypingGame
          key={`${module}:${question.id}`}
          title={question.title}
          reference={question.text}
          value={typing !== null ? typing : (currentAnswer?.text || '')}
          onChange={onType}
          startedAtMs={typingStartedAt}
          timeLeftMs={typingLeft}
          disabled={!canChange || typingDone}
          onIntegrityEvent={record}/>:null}
        {activeModule===6&&question?<div className="space-y-4"><h3 className="text-sm font-extrabold">Listen to the customer voicemail, then complete every field.</h3>
          <CsrFitOneTimeAudio token={token} startedAtMs={data.session?.audioStartedAtMs} disabled={!canChange}
            onClaim={at=>setData(old=>({...old,session:{...old.session,audioStartedAtMs:at}}))}
            onError={message=>setError(message)} />
          {alreadyAnswered&&<div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"><CheckCircle2 size={15}/> Response saved successfully · Read only · Saved once</div>}
          <div className="grid gap-3 sm:grid-cols-2">{bank.module6.fields.map(f=><FormText key={f.id} label={f.label} value={formValue(f.id)} onChange={v=>changeDraft(f.id,v)} readOnly={alreadyAnswered||saved==='Saving…'||!canChange}/>)}</div>
          {bank.module6.choices.map(f=><FormChoice key={f.id} label={f.label} options={f.options} value={formValue(f.id)} onChange={v=>changeDraft(f.id,v)} disabled={alreadyAnswered||saved==='Saving…'||!canChange}/>)}
          {!alreadyAnswered&&<button type="button" disabled={!canChange || !data.session?.audioStartedAtMs || saved==='Saving…'} onClick={()=>void submitTask()} className={`${btn} bg-sibs-navy text-white`}>{saved==='Saving…'?<Loader2 size={14} className="animate-spin"/>:<Check size={14}/>} {saved==='Saving…'?'Saving response…':'Save response form'}</button>}</div>:null}
      </div>
      <aside className="order-first min-w-0 space-y-5 lg:order-last lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto lg:border-l lg:border-sibs-border lg:pl-5 lg:pr-1" aria-label="Assessment timers and question navigator">
        {/* Prominent timers belong beside the active question, not in the narrow candidate strip. */}
        <div className={`sticky top-3 z-10 rounded-xl border p-4 shadow-sm ${!typingRoundWaiting && !typingRoundFinished && limitMs <= 60000 ? 'border-rose-300 bg-rose-50' : !typingRoundWaiting && !typingRoundFinished && limitMs <= 300000 ? 'border-amber-300 bg-amber-50' : 'border-sibs-border bg-slate-50'}`}>
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-sibs-secondary">
            <Clock3 size={16} aria-hidden="true" /> {activeModule===5 ? `Typing round ${index+1} of ${items.length}` : 'Module time left'}
          </div>
          <div role="timer" aria-live="off" aria-label={`Module ${activeModule} remaining time ${elapsedLabel(limitMs)}`}
            className={`mt-2 text-center text-4xl font-extrabold tracking-tight tabular-nums sm:text-[40px] ${!typingRoundWaiting && !typingRoundFinished && limitMs <= 60000 ? 'text-rose-700' : !typingRoundWaiting && !typingRoundFinished && limitMs <= 300000 ? 'text-amber-800' : 'text-sibs-navy'}`}>
            {elapsedLabel(limitMs)}
          </div>
          {typingRoundWaiting && <p className="mt-1 text-center text-[11px] font-bold text-sibs-muted">Starts on first keystroke</p>}
          {typingRoundFinished && <p className="mt-1 text-center text-[11px] font-bold text-emerald-700">Typing round completed</p>}
          {!typingRoundWaiting && !typingRoundFinished && limitMs < 60000 && <p className="mt-1 text-center text-[11px] font-bold text-rose-700">Less than 1 minute remaining</p>}
          <div className="mt-3 border-t border-slate-200 pt-3">
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-secondary">Total assessment time</div>
            <div role="timer" aria-live="off" aria-label={`Total assessment time remaining ${elapsedLabel(totalMs)}`}
              className={`mt-1 text-center text-2xl font-extrabold tabular-nums ${totalMs <= 300000 ? 'text-rose-700' : 'text-sibs-navy'}`}>
              {elapsedLabel(totalMs)}
            </div>
          </div>
        </div>
        <div><h3 className="text-xs font-extrabold uppercase text-sibs-muted">Question navigator</h3><div className="mt-3 grid grid-cols-8 gap-1.5 sm:grid-cols-12 lg:grid-cols-5">
        {items.map((q,i)=>{const completed=Boolean(answers[itemKey(module,q.id)]) &&
          (activeModule !== 5 || passageFinished(q));
          // Modules 1–2 use static progress markers, NOT clickable navigation.
          // This applies to completed, current, and future question numbers alike.
          if(forwardOnly)return <span key={`${module}-${q.id}`} role="img"
            aria-label={`Question ${i+1}: ${i===index?'current':completed?'completed and locked':'not yet available'}`}
            className={`flex h-8 items-center justify-center rounded-md border text-[11px] font-extrabold ${i===index?'border-sibs-orange bg-orange-50 text-sibs-orange':completed?'border-sibs-navy bg-sibs-navy text-white':'border-sibs-border bg-sibs-surface text-sibs-muted/60'}`}>{i+1}</span>;
          const locked=i>maxAllowed || (activeModule===5 && i>0 && !passageFinished(items[i-1]));
          return <button key={`${module}-${q.id}`} type="button" disabled={locked} onClick={()=>{setCursor(i);setDraft(makeEmpty());draftTouched.current.clear();setTyping(null);lastTyped.current='';pendingTyping.current=null;}}
            aria-label={`Item ${i+1}${locked?', locked':''}`} title={locked?'Complete earlier items first':''}
            className={`h-8 rounded-md border text-[11px] font-extrabold ${i===index?'border-sibs-orange bg-orange-50 text-sibs-orange':completed?'border-sibs-navy bg-sibs-navy text-white':'border-sibs-border bg-sibs-surface text-sibs-muted'} disabled:cursor-not-allowed disabled:opacity-35`}>{i+1}</button>;
        })}</div><p className="mt-3 text-[11px] leading-5 text-sibs-muted">{forwardOnly?'Progress only. Question numbers cannot be clicked; saved answers are final.':'You may review earlier answers, but cannot jump ahead to unanswered questions.'}</p></div></aside></div>
      {!forwardOnly&&<div className="flex flex-wrap items-center justify-between gap-2 rounded-b-2xl border-t border-sibs-border bg-sibs-surface px-4 py-4 sm:px-6">
        <button type="button" disabled={index===0||busy} onClick={goPrev} className={`${btn} border border-sibs-border bg-white text-sibs-navy`}><ArrowLeft size={14}/> Previous</button>
        <div className="ml-auto flex flex-wrap gap-2">
          {index<items.length-1?<button type="button" onClick={goNext} disabled={!alreadyAnswered||busy||answerSaving||(activeModule===5&&!showModule5Next)}
            className={`${btn} bg-sibs-navy text-white`}>Next <ArrowRight size={14}/></button>:
            activeModule<7?<button type="button" disabled={!allAnswered||busy||(activeModule===3&&!videoDone)||(activeModule===5&&!typingDone)} onClick={()=>void advance()} className={`${btn} bg-sibs-navy text-white`}>Proceed to Module {activeModule+1} <ChevronRight size={14}/></button>:
            <button type="button" disabled={!allAnswered||busy} onClick={()=>setConfirm(true)} className={`${btn} bg-sibs-navy text-white`}><Send size={14}/> Submit Assessment</button>}
        </div>
      </div>}</section>
    </>}
    </>:null}
    {mobile&&data?.status!=='SUBMITTED'?<div className="fixed inset-0 z-[1600] flex items-center justify-center bg-sibs-navy p-6 text-center text-white"><div className="max-w-sm"><Monitor size={48} className="mx-auto"/><h2 className="mt-4 text-xl font-extrabold">Desktop or laptop required</h2><p className="mt-3 text-sm leading-6">The assessment includes keyboard-based and timed activities. Return to a desktop or laptop with a physical keyboard. If already started, your original deadline continues.</p></div></div>:null}
    {confirm&&<div className="fixed inset-0 z-[1500] flex items-center justify-center bg-slate-950/60 p-4"><section role="dialog" aria-modal="true" aria-labelledby="assessment-submit-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 id="assessment-submit-title" className="text-lg font-extrabold">Submit completed assessment?</h2><p className="mt-2 text-xs leading-6 text-sibs-muted">Your seven modules will be submitted for HR review. Once submitted, answers cannot be changed.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={()=>setConfirm(false)} className={`${btn} border border-sibs-border bg-white`}>Review</button><button type="button" onClick={()=>void submit()} disabled={busy} className={`${btn} bg-sibs-navy text-white`}>Confirm Submit</button></div></section></div>}
    {busy && (moduleTransition
      ? <CsrFitAssessmentLoading mode="module-transition" moduleNumber={moduleTransition.from}
          nextModuleNumber={moduleTransition.to} phase={moduleTransition.phase} />
      : <CsrFitAssessmentLoading mode="overlay" label={busyLabel} />)}
    <p className="py-5 text-center text-[11px] text-sibs-muted">SiBS HRIS · CSR-Fit Assessment · Authorized candidates only</p>
  </div></main>;
}
