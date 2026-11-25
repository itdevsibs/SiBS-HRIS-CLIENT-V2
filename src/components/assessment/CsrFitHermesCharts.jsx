import { BarChart3, BrainCircuit, Gauge, Keyboard, ShieldCheck } from 'lucide-react';
import { buildCsrFitVerifiedChartData, CSR_FIT_CHART_DEFINITIONS, resolveCsrFitChartPlan } from '@/lib/utils/csrFitHermesChartDataClient';

const NAVY = '#082e53';
const ORANGE = '#ff5b30';
const TEAL = '#0f948a';
const safeValue = value => Number.isFinite(value) ? Number(value.toFixed(2)) : null;
const percentText = value => value === null ? 'Not recorded' : `${safeValue(value).toFixed(2)}%`;

function ChartFrame({ title, subtitle, insight, children, icon: Icon = BarChart3 }) {
  return <article className="min-w-0 overflow-hidden rounded-lg border border-sibs-border bg-white" aria-label={title}>
    <header className="flex items-start gap-2 border-b border-sibs-border bg-sibs-surface/70 px-3 py-3 sm:px-4">
      <div className="rounded-md bg-sibs-navy p-2 text-white"><Icon size={15} aria-hidden="true" /></div>
      <div className="min-w-0 flex-1"><h4 className="text-xs font-extrabold text-sibs-navy">{title}</h4><p className="mt-1 text-[10px] leading-4 text-sibs-muted">{subtitle}</p></div>
    </header>
    <div className="p-3 sm:p-4">{children}</div>
    {insight && <div className="border-t border-sibs-border bg-blue-50/45 px-3 py-3 text-[11px] leading-5 text-sibs-secondary sm:px-4">
      <span className="font-extrabold text-sibs-navy">SiBS AI insight: </span>{insight}
    </div>}
  </article>;
}

function RadarChart({ rows }) {
  const cx = 160, cy = 145, radius = 110;
  const point = (index, value) => {
    const angle = -Math.PI / 2 + index * 2 * Math.PI / rows.length;
    return [cx + Math.cos(angle) * radius * value, cy + Math.sin(angle) * radius * value];
  };
  const polygon = level => rows.map((_,i) => point(i,level).map(n => n.toFixed(1)).join(',')).join(' ');
  const dataPoints = rows.map((row,i) => point(i,row.percent/100));
  return <div className="flex flex-col items-center gap-3">
    <svg viewBox="0 0 320 295" role="img" aria-label={`Radar plot of ${rows.length} cognitive categories, ranging from zero to one hundred percent`} className="h-auto w-full max-w-[360px]">
      {[0.25,0.5,0.75,1].map(v => <polygon key={v} points={polygon(v)} stroke="#d7e1ec" strokeWidth="1" fill={v===1?'#f5f8fc':'none'}/>) }
      {rows.map((row,i) => { const [x,y] = point(i,1); const [lx,ly] = point(i,1.14); return <g key={`${row.label}-${i}`}>
        <line x1={cx} y1={cy} x2={x} y2={y} stroke="#dae3ed" strokeWidth="1" />
        <text x={lx} y={ly+4} fontSize="12" fontWeight="700" textAnchor="middle" fill={NAVY}>{i+1}</text>
      </g>; })}
      <polygon points={dataPoints.map(p=>p.map(n=>n.toFixed(1)).join(',')).join(' ')} fill="#0f948a" fillOpacity="0.18" stroke={TEAL} strokeWidth="2.6" strokeLinejoin="round" />
      {dataPoints.map(([x,y],i) => <circle key={i} cx={x} cy={y} r="4" fill={ORANGE} stroke="white" strokeWidth="1.5"><title>{`${rows[i].label}: ${percentText(rows[i].percent)}`}</title></circle>)}
      <text x={cx+4} y={cy-2} fontSize="10" fill="#8294a8">0</text>
      <text x={cx+4} y={cy-radius/2-2} fontSize="10" fill="#8294a8">50</text>
      <text x={cx+4} y={cy-radius-3} fontSize="10" fill="#8294a8">100%</text>
    </svg>
    <div className="grid w-full gap-x-3 gap-y-2 sm:grid-cols-2">
      {rows.map((row,index)=><div key={`${index}-${row.label}`} className="flex min-w-0 items-start gap-2 text-[10px] leading-4">
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-sibs-surface font-bold text-sibs-navy">{index+1}</span>
        <div className="min-w-0 flex-1"><div className="font-semibold text-sibs-secondary">{row.label}</div>{row.correct!==null && row.total!==null && <div className="text-sibs-muted">{row.correct}/{row.total} correct</div>}</div>
        <span className="shrink-0 font-extrabold tabular-nums text-sibs-navy">{percentText(row.percent)}</span>
      </div>)}
    </div>
  </div>;
}

function HorizontalBars({ rows }) {
  return <div className="space-y-4">
    {rows.map((row,i) => <div key={`${row.label}-${i}`}>
      <div className="mb-1.5 flex flex-wrap justify-between gap-x-3 gap-y-1 text-[11px]">
        <span className="max-w-[80%] font-semibold leading-4 text-sibs-secondary">{row.label}</span>
        <span className="font-extrabold tabular-nums text-sibs-navy">{percentText(row.percent)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-sm bg-slate-100" role="progressbar" aria-label={row.label}
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={row.percent}>
        <div className="h-full rounded-sm" style={{width:`${row.percent}%`,background:i%2===0?NAVY:TEAL}}/>
      </div>
      {row.items !== null && <p className="mt-1 text-[10px] text-sibs-muted">{row.items} scored items · Provisional descriptive index</p>}
    </div>)}
  </div>;
}

function PracticalBars({ rows, audio }) {
  return <div className="space-y-3">
    {rows.map((row,i) => <div key={`${row.label}-${i}`} className="rounded-md border border-sibs-border p-2.5">
      <div className="flex items-center justify-between gap-2 text-[11px]"><span className="font-semibold text-sibs-navy">M{row.module} · {row.label}</span>
        <span className="font-extrabold tabular-nums text-sibs-navy">{row.correct}/{row.total}</span></div>
      <div className="mt-2 h-2 overflow-hidden rounded-sm bg-slate-100">
        <div className="h-full" style={{width:`${row.total?row.correct/row.total*100:0}%`,background:row.correct===row.total?TEAL:ORANGE}} />
      </div>
    </div>)}
    {(audio.fieldsCorrect !== null || audio.choicesCorrect !== null) && <div className="rounded-md border border-sibs-border bg-sibs-surface/50 px-3 py-2.5">
      <p className="text-[11px] font-extrabold text-sibs-navy">M6 · Audio logging</p>
      <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-sibs-secondary">
        {audio.fieldsCorrect !== null && <span>Verified text fields: <strong className="text-sibs-navy">{audio.fieldsCorrect} correct</strong></span>}
        {audio.choicesCorrect !== null && <span>Option selections: <strong className="text-sibs-navy">{audio.choicesCorrect} correct</strong></span>}
      </div>
      <p className="mt-1 text-[10px] text-sibs-muted">Raw counts, not percentages; unverified denominators are not inferred.</p>
    </div>}
  </div>;
}

function BenchmarkBars({ rows }) {
  const maxWpm = Math.max(60,Math.ceil(Math.max(40,...rows.map(row=>row.wpm ?? 0))/10)*10);
  return <div className="space-y-4">
    {rows.map(row => <div key={row.passage} className="rounded-md border border-sibs-border p-3">
      <h5 className="mb-3 text-[11px] font-extrabold text-sibs-navy">Passage {row.passage}</h5>
      {[
        {label:'Speed',value:row.wpm,max:maxWpm,target:row.wpmBenchmark,unit:'WPM'},
        {label:'Accuracy',value:row.accuracy,max:100,target:row.accuracyBenchmark,unit:'%'},
      ].map(metric => <div key={metric.label} className="mb-3 last:mb-0">
        <div className="mb-1 flex justify-between text-[11px]"><span className="font-semibold text-sibs-secondary">{metric.label}</span>
          <span className="font-extrabold tabular-nums text-sibs-navy">{metric.value===null?'Not recorded':`${safeValue(metric.value).toFixed(1)} ${metric.unit}`}</span></div>
        <div className="relative h-3 bg-slate-100">
          <div className="h-full" style={{width:`${Math.min(100,100*(metric.value??0)/metric.max)}%`,background:TEAL}}/>
          <div className="absolute top-[-4px] h-[20px] w-[2px] bg-orange-500" style={{left:`${100*metric.target/metric.max}%`}} aria-hidden="true"/>
        </div>
        <p className="mt-1 text-[10px] text-sibs-muted">Benchmark: {metric.target} {metric.unit} · Orange marker</p>
      </div>)}
    </div>)}
  </div>;
}

/** AI designs the chart plan and qualitative insights; HRIS provides values. */
export default function CsrFitHermesCharts({ assessment, hermesReport, hermesStatus }) {
  const chartData = buildCsrFitVerifiedChartData(assessment);
  const plan = resolveCsrFitChartPlan(hermesReport,chartData);
  if (!plan.length) return null;
  const chartIcon = {cognitive_radar:BrainCircuit,behavioral_bars:BarChart3,practical_tasks:ShieldCheck,typing_benchmarks:Keyboard};
  const subtitles = {
    cognitive_radar:'Module 1 · Correct-answer percentages · Provisional answer key',
    behavioral_bars:'Module 2 · Provisional self-report indices · Not clinical scores',
    practical_tasks:'Modules 3, 4, 6 and 7 · Different tasks; no combined total',
    typing_benchmarks:'Module 5 · Actual WPM and accuracy against configured benchmarks',
  };
  return <section className="rounded-xl border border-sibs-border bg-white p-3 sm:p-4" aria-label="SiBS AI-guided CSR-Fit assessment charts">
    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
      <div><h3 className="flex items-center gap-2 text-sm font-extrabold text-sibs-navy"><Gauge size={17} className="text-sibs-orange"/> Assessment visual analysis</h3>
        <p className="mt-1 text-[11px] text-sibs-muted">SiBS AI selects charts and insights · Every plotted value comes from verified HRIS results</p></div>
      <span className="rounded border border-sibs-border bg-sibs-surface px-2 py-1 text-[10px] font-bold text-sibs-secondary">
        {hermesStatus==='READY' && hermesReport?.chartPlan?.length ? 'SiBS AI-guided' : 'Verified data · AI insights pending'}
      </span>
    </div>
    <div className="grid gap-3 lg:grid-cols-2">
      {plan.map(item => <ChartFrame key={item.id} title={CSR_FIT_CHART_DEFINITIONS[item.id].title}
        subtitle={subtitles[item.id]} insight={item.insight} icon={chartIcon[item.id]}>
        {item.id==='cognitive_radar' && <RadarChart rows={chartData.cognitive} />}
        {item.id==='behavioral_bars' && <HorizontalBars rows={chartData.behavioral} />}
        {item.id==='practical_tasks' && <PracticalBars rows={chartData.practical} audio={chartData.audio} />}
        {item.id==='typing_benchmarks' && <BenchmarkBars rows={chartData.typing} />}
      </ChartFrame>)}
    </div>
    <p className="mt-3 text-[10px] leading-4 text-sibs-muted">Provisional results for authorized HR review only. Graphs do not represent population norms, validated predictions or an automatic hiring decision.</p>
  </section>;
}
