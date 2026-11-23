import { BrainCircuit, BriefcaseBusiness, CircleAlert, Lightbulb, MessagesSquare, Target } from 'lucide-react';

const pct = value => value != null && value !== '' && Number.isFinite(Number(value)) &&
  Number(value) >= 0 && Number(value) <= 100 ? Number(value) : null;

/** Uses five actual behavioral pillars, NOT the Criteria population baseline. */
function CompetencyProfile({ pillars }) {
  const rows = (Array.isArray(pillars) ? pillars : [])
    .map(item => ({ label: String(item?.name || ''), score: pct(item?.score), items: item?.items }))
    .filter(item => item.label && item.score !== null);
  if (rows.length < 3) return <p className="text-xs text-sibs-muted">Insufficient scored competencies to draw a profile.</p>;
  const size = 310, center = 155, radius = 95;
  const point = (i, score) => {
    const angle = -Math.PI/2 + i*2*Math.PI/rows.length;
    return [center + Math.cos(angle)*radius*score, center + Math.sin(angle)*radius*score];
  };
  const ring = level => rows.map((_,i) => point(i,level).join(',')).join(' ');
  return <div className="grid items-center gap-4 md:grid-cols-[minmax(0,300px)_1fr]">
    <svg className="mx-auto h-auto w-full max-w-[300px]" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Radar profile of recorded behavioral competency indices, each from zero to 100 percent">
      {[0.25,0.5,0.75,1].map(level => <polygon key={level} points={ring(level)} fill={level===1?'#f8fafc':'none'} stroke="#dce5ed" strokeWidth="1" />)}
      {rows.map((row,i)=>{const outer=point(i,1);return <line key={row.label} x1={center} y1={center} x2={outer[0]} y2={outer[1]} stroke="#e1e7ed"/>;})}
      <polygon points={rows.map((row,i)=>point(i,row.score/100).join(',')).join(' ')} fill="#0a3458" fillOpacity="0.19" stroke="#0a3458" strokeWidth="2.8" strokeLinejoin="round"/>
      {rows.map((row,i)=>{const [x,y]=point(i,row.score/100);return <circle key={row.label} cx={x} cy={y} r="4" fill="#f45c24" stroke="#fff" strokeWidth="1.5"><title>{`${row.label}: ${row.score.toFixed(1)}%`}</title></circle>;})}
    </svg>
    <div className="space-y-2.5">{rows.map((row,i) => <div key={`${row.label}-${i}`} className="flex items-start justify-between gap-3 border-b border-sibs-border pb-2 text-[11px]">
      <div><p className="font-bold text-sibs-navy">{i+1}. {row.label}</p><p className="text-[10px] text-sibs-muted">{row.items ?? '—'} mapped items · Descriptive index</p></div>
      <span className="shrink-0 font-extrabold tabular-nums text-sibs-navy">{row.score.toFixed(2)}%</span>
    </div>)}</div>
  </div>;
}

const sections = [
  ['Motivation & stressors','motivationAndStressors',Target],
  ['Thinking style','thinkingStyle',BrainCircuit],
  ['Work style','workStyle',BriefcaseBusiness],
  ['Interaction style','interactionStyle',MessagesSquare],
];
const Findings = ({ title, icon: Icon, items }) => <div className="rounded-lg border border-sibs-border bg-sibs-surface/50 p-3.5">
  <h5 className="flex items-center gap-2 text-xs font-extrabold text-sibs-navy"><Icon size={15} className="text-sibs-orange"/>{title}</h5>
  {Array.isArray(items) && items.length ? <ul className="mt-2 space-y-2 text-[11px] leading-5 text-sibs-secondary">
    {items.map((item,i)=><li key={i} className="flex items-start gap-2"><span aria-hidden="true" className="text-sibs-orange">•</span><span>{item}</span></li>)}
  </ul> : <p className="mt-2 text-[11px] text-sibs-muted">No supported findings recorded.</p>}
</div>;

export default function CsrFitWorkplaceInsights({ assessment, report }) {
  if (!report) return null;
  const insights = report.workplaceInsights || {};
  return <div className="space-y-4">
    <div className="rounded-xl border border-sibs-border bg-sibs-surface/50 p-4">
      <h4 className="text-xs font-extrabold text-sibs-navy">Competency profile</h4>
      <p className="mt-1 text-[11px] text-sibs-muted">Five HRIS-recorded work-attitude pillars; not population norms or validated personality percentiles</p>
      <div className="mt-3"><CompetencyProfile pillars={assessment?.score?.behavioralPillars}/></div>
      {insights.competencyStrength && <p className="mt-3 border-t border-sibs-border pt-3 text-[11px] leading-5 text-sibs-secondary"><strong className="text-sibs-navy">Competency strength: </strong>{insights.competencyStrength}</p>}
    </div>
    <div><h4 className="text-xs font-extrabold text-sibs-navy">Leveraging strengths & development suggestions</h4>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{sections.map(([title,key,Icon])=><div key={key} className="rounded-lg border border-sibs-border bg-white p-3.5">
        <h5 className="flex items-center gap-2 text-[11px] font-extrabold text-sibs-navy"><Icon size={15} className="text-sibs-orange" />{title}</h5>
        <p className="mt-2 text-[11px] leading-5 text-sibs-secondary">{insights[key] || 'Available evidence does not support a reliable interpretation of this aspect. Verify through a structured HR interview.'}</p>
      </div>)}</div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <Findings title="Recorded strengths" icon={Lightbulb} items={report.observedCompetencies}/>
      <Findings title="Potential challenges / areas for review" icon={CircleAlert} items={report.areasForReview}/>
    </div>
  </div>;
}
