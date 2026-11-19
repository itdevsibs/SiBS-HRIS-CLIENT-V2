import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, ClipboardList, Clock3, Loader2, LockKeyhole, Save, Send, ShieldCheck } from 'lucide-react';
import api from '../../lib/axios/api-template';
import { CSR_FIT_MODULE_NAMES } from '../../components/assessment/csrFitModuleGuides';

const text=(value)=>String(value??'').trim();
const errorMessage=(error)=>error?.response?.data?.message||error?.message||'Unable to complete the request. Please retry.';
const keyFor=(module,id)=>`${module}:${id}`;
const pad=(value)=>String(value).padStart(2,'0');
function timeLabel(ms){const sec=Math.max(0,Math.ceil(ms/1000));return `${pad(Math.floor(sec/3600))}:${pad(Math.floor(sec/60)%60)}:${pad(sec%60)}`;}
const MODULES=[{key:'module1',title:CSR_FIT_MODULE_NAMES[0],duration:'50 questions · 60 minutes'},{key:'module2',title:CSR_FIT_MODULE_NAMES[1],duration:'50 questions · approximately 20–25 minutes'}];

export default function CsrFitAssessmentPage(){
  const [params]=useSearchParams();
  const token=text(params.get('token'));
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [module,setModule]=useState('module1');
  const [cursor,setCursor]=useState({module1:0,module2:0});
  const [answers,setAnswers]=useState({});
  const [clock,setClock]=useState(Date.now());
  const [lastSaved,setLastSaved]=useState('');
  const [showConfirm,setShowConfirm]=useState(false);
  const saveEpoch=useRef(0);
  const latestSave=useRef(Promise.resolve());

  useEffect(()=>{
    const timer=window.setInterval(()=>setClock(Date.now()),1000);
    return()=>window.clearInterval(timer);
  },[]);
  const retrieve=useCallback(async()=>{
    setLoading(true);setError('');
    try{
      if(!/^[a-f0-9]{64}$/.test(token))throw new Error('The assessment invitation is invalid. Open the link from your email.');
      const result=await api.get(`/api/assessment/public/${token}`,{withCredentials:false});
      if(result.data?.success===false)throw new Error(result.data.message);
      setData(result.data);setAnswers(result.data?.answers||{});
    }catch(e){setError(errorMessage(e));}
    finally{setLoading(false);}
  },[token]);
  useEffect(()=>{void retrieve();},[retrieve]);

  const questions=data?.questions||{module1:[],module2:[]};
  const totalAnswered=useMemo(()=>Object.fromEntries(MODULES.map(m=>[m.key,(questions[m.key]||[]).filter(q=>Boolean(answers[keyFor(m.key,q.id)])).length])),[questions,answers]);
  const remaining=(data?.cognitiveDeadlineMs||0)-clock;
  const cognitiveEnded=Boolean(data?.cognitiveDeadlineMs)&&remaining<=0;
  const canEnterModule2=Boolean(data?.status==='IN_PROGRESS'&&(cognitiveEnded||totalAnswered.module1===50));
  const currentQuestions=questions[module]||[];
  const index=Math.min(cursor[module]||0,Math.max(0,currentQuestions.length-1));
  const question=currentQuestions[index];
  const answered=totalAnswered[module]||0;
  const firstMissingIndex=currentQuestions.findIndex(q=>!answers[keyFor(module,q.id)]);
  const lastAllowedIndex=firstMissingIndex===-1?currentQuestions.length-1:firstMissingIndex;
  const module1Locked=module==='module1'&&cognitiveEnded;
  const canSubmit=data?.status==='IN_PROGRESS'&&totalAnswered.module2===50&&(totalAnswered.module1===50||cognitiveEnded);

  async function begin(){
    if(busy)return;setBusy(true);setError('');
    try{
      const result=await api.post(`/api/assessment/public/${token}/start`,{}, {withCredentials:false});
      setData(result.data);setAnswers(result.data?.answers||{});setModule('module1');
    }catch(e){setError(errorMessage(e));}finally{setBusy(false);}
  }

  function choose(choice){
    if(!question||module1Locked||busy)return;
    const key=keyFor(module,question.id);
    setAnswers(old=>({...old,[key]:choice}));setLastSaved('Saving…');
    const id=++saveEpoch.current;
    // Serial writes prevent a slower, older request from overwriting a newer choice.
    latestSave.current=latestSave.current.catch(()=>{}).then(async()=>{
      const result=await api.put(`/api/assessment/public/${token}/answer`,{key,choice},{withCredentials:false});
      if(id===saveEpoch.current&&result.data?.success!==false)setLastSaved('Saved');
    }).catch(e=>{setLastSaved('Not saved');setError(`Unable to save an answer: ${errorMessage(e)}`);});
  }
  function move(delta){setError('');setCursor(old=>({...old,[module]:Math.min(Math.max((old[module]||0)+delta,0),currentQuestions.length-1)}));window.scrollTo({top:0,behavior:'smooth'});}
  function switchModule(next){
    if(next==='module2'&&!canEnterModule2)return;
    setError('');setModule(next);window.scrollTo({top:0,behavior:'smooth'});
  }
  async function submit(){
    if(!canSubmit||busy)return;
    setBusy(true);setError('');setShowConfirm(false);
    try{
      await latestSave.current.catch(()=>{});
      const result=await api.post(`/api/assessment/public/${token}/submit`,{answers},{withCredentials:false});
      if(result.data?.success===false)throw new Error(result.data.message);
      setData(old=>({...old,status:'SUBMITTED'}));
    }catch(e){setError(errorMessage(e));}finally{setBusy(false);}
  }

  return <main className="min-h-screen bg-[#f5f7fa] px-4 py-6 font-jakarta text-sibs-navy sm:px-6 sm:py-10">
    <div className="mx-auto max-w-5xl">
      <header className="flex items-center gap-3 rounded-2xl bg-[#082e53] px-5 py-4 text-white shadow-sm sm:px-7">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10"><ClipboardList size={24}/></span>
        <div className="min-w-0 flex-1"><h1 className="text-lg font-extrabold sm:text-xl">SiBS CSR-Fit Online Assessment</h1><p className="mt-0.5 text-xs font-semibold text-white/70">Recruitment · Candidate assessment</p></div>
        <span className="hidden items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"><ShieldCheck size={14}/> Secure assessment</span>
      </header>
      {loading?<div className="flex min-h-80 items-center justify-center gap-3"><Loader2 className="animate-spin" size={24}/><span className="text-sm font-semibold">Loading your invitation…</span></div>
      : error&&(!data||data?.status==='NOT_STARTED')?<div role="alert" className="mt-5 rounded-2xl border border-rose-200 bg-white p-6"><div className="flex items-center gap-2 text-rose-700"><AlertCircle size={19}/><strong>Unable to open assessment</strong></div><p className="mt-2 text-sm">{error}</p></div>
      : data?.status==='SUBMITTED'?<div className="mt-5 rounded-2xl border border-sibs-border bg-white px-6 py-14 text-center shadow-sm"><CheckCircle2 className="mx-auto text-emerald-600" size={46}/><h2 className="mt-4 text-2xl font-extrabold">Assessment submitted</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-sibs-muted">Thank you. Your responses were saved and sent for Talent Acquisition review. No further action is needed.</p></div>
      : data?.status==='NOT_STARTED'?<div className="mt-5 overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-sm">
        <div className="border-b border-sibs-border p-6 sm:p-8"><p className="text-[11px] font-bold uppercase tracking-wide text-sibs-orange">Candidate invitation</p><h2 className="mt-1 text-2xl font-extrabold">Welcome, {data.candidate.name}</h2><p className="mt-2 text-sm text-sibs-muted">Your CSR-Fit assessment contains two modules with 50 questions each, selected randomly from the approved test banks.</p></div>
        <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">{MODULES.map((m,i)=><section key={m.key} className="rounded-xl border border-sibs-border bg-[#f8fafc] p-5"><p className="text-xs font-bold text-sibs-orange">Module {i+1}</p><h3 className="mt-2 text-base font-extrabold">{m.title}</h3><p className="mt-1 text-xs font-semibold text-sibs-muted">{m.duration}</p><ul className="mt-4 space-y-2 text-xs leading-5 text-sibs-secondary">{(data.instructions?.[m.key]?.notes||[]).map(note=><li key={note}>• {note}</li>)}</ul></section>)}</div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sibs-border bg-sibs-surface p-6 sm:px-8"><p className="max-w-lg text-xs text-sibs-muted">Your order is fixed once started. The cognitive module timer starts immediately and continues after refresh.</p><button type="button" disabled={busy} onClick={begin} className="inline-flex h-11 items-center gap-2 rounded-lg bg-sibs-navy px-6 text-sm font-extrabold text-white hover:opacity-90 disabled:opacity-60">{busy?<Loader2 size={17} className="animate-spin"/>:<ArrowRight size={17}/>} Start Assessment</button></div>
      </div>
      : data?.status==='IN_PROGRESS'? <>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">{MODULES.map((m,i)=>{const locked=m.key==='module2'&&!canEnterModule2;return <button key={m.key} type="button" onClick={()=>switchModule(m.key)} disabled={locked} className={`rounded-xl border p-4 text-left transition ${module===m.key?'border-sibs-navy bg-white shadow-sm':'border-sibs-border bg-white/60 hover:bg-white'} disabled:cursor-not-allowed disabled:opacity-50`}><div className="flex items-center justify-between gap-3"><span className="text-[11px] font-bold uppercase tracking-wide text-sibs-orange">Module {i+1}</span>{locked?<LockKeyhole size={15}/>:<span className="text-xs font-extrabold tabular-nums">{totalAnswered[m.key]||0}/50</span>}</div><h2 className="mt-1 text-sm font-extrabold">{m.title}</h2><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#092f57]" style={{width:`${(totalAnswered[m.key]||0)*2}%`}}/></div></button>})}</div>
        {error&&<div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700"><AlertCircle size={16} className="shrink-0"/>{error}</div>}
        <section className="mt-4 overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sibs-border px-5 py-4 sm:px-7"><div><p className="text-[11px] font-bold uppercase tracking-wide text-sibs-muted">{module==='module1'?'Cognitive module':'Behavioral module'}</p><h2 className="mt-1 text-base font-extrabold">Question {index+1} of {currentQuestions.length}</h2></div><div className="flex flex-wrap items-center gap-3 text-xs font-bold"><span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 ${module==='module1'&&remaining<300000?'bg-rose-50 text-rose-700':'bg-slate-100 text-sibs-navy'}`}><Clock3 size={14}/>{module==='module1'?timeLabel(remaining):'Untimed'}</span><span className="inline-flex items-center gap-1 text-sibs-muted"><Save size={13}/>{lastSaved||'Autosave on selection'}</span></div></div>
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_195px]">
            <div className="min-w-0">
              {module1Locked?<div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">The cognitive module has reached its 60-minute limit. Saved answers are retained. Continue to Module 2.</div>:null}
              {question?<><p className="text-[11px] font-bold text-sibs-muted">{question.category}</p><h3 className="mt-3 whitespace-pre-wrap text-base font-extrabold leading-7 sm:text-lg">{question.stem}</h3><fieldset disabled={module1Locked} className="mt-6 space-y-2.5"><legend className="sr-only">Select one answer</legend>{question.options.map(o=>{const active=answers[keyFor(module,question.id)]===o.key;return <label key={o.key} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${active?'border-sibs-navy bg-blue-50/60':'border-sibs-border bg-white hover:border-slate-400'} ${module1Locked?'cursor-not-allowed opacity-65':''}`}><input type="radio" className="sr-only" name={`answer-${module}-${question.id}`} checked={active} onChange={()=>choose(o.key)} disabled={module1Locked}/><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-extrabold ${active?'border-sibs-navy bg-sibs-navy text-white':'border-sibs-border bg-sibs-surface'}`}>{active?<Check size={16}/>:o.key}</span><span className="min-w-0 text-sm font-semibold leading-5">{o.text}</span></label>;})}</fieldset></>:<p>No questions available. Please contact Talent Acquisition.</p>}
            </div>
            <aside className="lg:border-l lg:border-sibs-border lg:pl-5"><h4 className="text-xs font-extrabold uppercase tracking-wide text-sibs-muted">Question navigator</h4><div className="mt-3 grid grid-cols-8 gap-1.5 sm:grid-cols-10 lg:grid-cols-5">{currentQuestions.map((q,i)=>{const selected=Boolean(answers[keyFor(module,q.id)]);return <button type="button" key={q.id} onClick={()=>setCursor(old=>({...old,[module]:i}))} disabled={i>lastAllowedIndex} aria-label={`Question ${i+1}${selected?' answered':''}`} aria-current={i===index?'step':undefined} className={`flex h-8 items-center disabled:cursor-not-allowed disabled:opacity-30 justify-center rounded-md border text-[11px] font-bold ${i===index?'border-sibs-orange bg-orange-50 text-sibs-orange':selected?'border-sibs-navy bg-sibs-navy text-white':'border-sibs-border bg-sibs-surface text-sibs-muted'}`}>{i+1}</button>;})}</div><p className="mt-3 text-[11px] font-semibold text-sibs-muted">{answered}/50 answered. The question sequence is randomized and preserved for your attempt.</p></aside>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sibs-border bg-sibs-surface px-5 py-4 sm:px-7"><button type="button" onClick={()=>move(-1)} disabled={index===0} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-sibs-border bg-white px-4 text-xs font-extrabold disabled:opacity-40"><ArrowLeft size={15}/> Previous</button><div className="ml-auto flex flex-wrap items-center gap-2">{module==='module1'&&canEnterModule2?<button type="button" onClick={()=>switchModule('module2')} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-sibs-navy bg-white px-4 text-xs font-extrabold">Proceed to Module 2 <ArrowRight size={15}/></button>:null}{index<currentQuestions.length-1?<button type="button" onClick={()=>move(1)} disabled={!answers[keyFor(module,question?.id)]} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-sibs-navy px-5 text-xs font-extrabold text-white">Next <ArrowRight size={15}/></button>:null}{module==='module2'&&canSubmit?<button type="button" onClick={()=>setShowConfirm(true)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-sibs-navy px-5 text-xs font-extrabold text-white"><Send size={15}/> Submit Assessment</button>:null}</div></div>
        </section>
      </>:null}
      {showConfirm&&<div role="presentation" className="fixed inset-0 z-[1500] flex items-center justify-center bg-slate-950/60 p-4"><section role="dialog" aria-modal="true" aria-labelledby="csr-confirm-title" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><h2 id="csr-confirm-title" className="text-lg font-extrabold">Submit assessment?</h2><p className="mt-2 text-sm leading-6 text-sibs-muted">You have answered {totalAnswered.module1} cognitive and {totalAnswered.module2} behavioral questions. After submission you cannot change your answers.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={()=>setShowConfirm(false)} className="rounded-lg border border-sibs-border px-4 py-2 text-sm font-bold">Review</button><button type="button" disabled={busy} onClick={submit} className="rounded-lg bg-sibs-navy px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{busy?'Submitting…':'Confirm Submit'}</button></div></section></div>}
      <p className="py-5 text-center text-[11px] text-sibs-muted">SiBS HRIS · CSR-Fit Assessment · For authorized candidates only</p>
    </div>
  </main>;
}
