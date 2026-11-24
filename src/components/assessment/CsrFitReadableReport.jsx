import { BookOpen, ChevronDown, CircleAlert, ClipboardList, MessageSquare, ScanText } from 'lucide-react';
import { CSR_FIT_MODULE_NAMES } from '@/components/assessment/csrFitModuleGuides';
import CsrFitWorkplaceInsights from '@/components/assessment/CsrFitWorkplaceInsights';
import CsrFitHermesCharts from '@/components/assessment/CsrFitHermesCharts';
import ReportText, { ReportPoints } from '@/components/assessment/CsrFitReportText';

const SHORT_MODULE_NAMES = ['Reasoning & logic', 'Work attitudes (self-report)', 'Coaching & listening', 'Administrative tasks', 'Typing', 'Audio comprehension & logging', 'Computer literacy'];
const hasItems = items => Array.isArray(items) && items.some(item => typeof item === 'string' && item.trim());

function SectionTitle({ icon: Icon, children }) {
  return <h4 className="flex items-center gap-2 text-sm font-bold text-sibs-navy"><Icon size={16} className="shrink-0 text-sibs-orange" aria-hidden="true"/>{children}</h4>;
}
function DetailSection({ title, subtitle, children }) {
  return <details className="group min-w-0 overflow-hidden rounded-xl border border-sibs-border bg-white">
    <summary className="flex cursor-pointer list-none items-center gap-3 bg-sibs-surface/60 p-3.5 focus-visible:outline-2 focus-visible:outline-sibs-orange [&::-webkit-details-marker]:hidden">
      <div className="min-w-0 flex-1"><h4 className="text-sm font-bold text-sibs-navy">{title}</h4>{subtitle && <p className="mt-1 text-xs text-sibs-muted">{subtitle}</p>}</div>
      <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-sibs-muted transition-transform group-open:rotate-180" />
    </summary>
    <div className="space-y-3 border-t border-sibs-border p-3.5">{children}</div>
  </details>;
}
function PointsCard({ title, items, icon = ClipboardList }) {
  return <section className="min-w-0 space-y-2.5 rounded-xl border border-sibs-border bg-white p-3.5"><SectionTitle icon={icon}>{title}</SectionTitle><ReportPoints items={items}/></section>;
}

/** Shared read-only presentation; scores and all narrative text come from
 * the existing stored interpretation, not a second scoring or AI process. */
export default function CsrFitReadableReport({ assessment, report, modelName, showCharts = false }) {
  if (!report) return null;
  const modules = Array.isArray(report.moduleAnalyses) ? report.moduleAnalyses : [];
  return <div className="min-w-0 space-y-4">
    <section className="space-y-3 rounded-xl border border-sibs-border bg-sibs-surface/50 p-4">
      <SectionTitle icon={ScanText}>Assessment at a glance</SectionTitle>
      <ReportText text={report.executiveSummary} empty={<p className="text-xs text-sibs-muted">Interpretation available for HR review.</p>}/>
      <div className="flex items-start gap-2 rounded-lg border border-sibs-border bg-white p-3 text-xs leading-relaxed text-sibs-secondary">
        <CircleAlert size={16} className="mt-0.5 shrink-0 text-sibs-orange" aria-hidden="true"/>
        <p><strong className="text-sibs-navy">How to read this report:</strong> Test results describe performance on the assessment. Work-attitude answers are self-reported, not proof of workplace behavior. Cognitive scoring is provisional and requires HR review. This report does not make hiring decisions.</p>
      </div>
    </section>
    <CsrFitWorkplaceInsights assessment={assessment} report={report}/>
    {modules.length > 0 && <section className="space-y-3">
      <SectionTitle icon={ClipboardList}>Results by module</SectionTitle>
      <p className="text-xs leading-relaxed text-sibs-muted">Each card describes the recorded task. Open the evidence for more detail.</p>
      <div className="grid items-start gap-3 lg:grid-cols-2">
        {modules.map((entry,index) => {
          const number = Number(entry.module);
          const title = SHORT_MODULE_NAMES[number-1] || 'Assessment evidence';
          return <article key={`${entry.module}-${index}`} className="min-w-0 space-y-3 rounded-xl border border-sibs-border bg-white p-3.5">
            <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sibs-navy text-xs font-bold text-white">{entry.module}</span><div className="min-w-0"><h5 className="text-xs font-bold text-sibs-navy">{title}</h5><p className="text-[11px] text-sibs-muted">{CSR_FIT_MODULE_NAMES[number-1] || 'Recorded assessment task'}</p></div></div>
            <ReportText text={entry.finding}/>
            {entry.limitation && <div className="space-y-1 rounded-md bg-sibs-surface px-3 py-2"><p className="text-[11px] font-bold text-sibs-navy">What this cannot tell us</p><ReportText text={entry.limitation}/></div>}
            {entry.hrFollowUp && <div className="space-y-1"><p className="text-[11px] font-bold text-sibs-navy">Suggested HR follow-up</p><ReportText text={entry.hrFollowUp}/></div>}
            {entry.supportingEvidence && <DetailSection title="View supporting evidence"><ReportText text={entry.supportingEvidence}/></DetailSection>}
          </article>;
        })}
      </div>
    </section>}
    <div className="grid items-start gap-3 sm:grid-cols-2">
      <PointsCard title="What to verify before relying on results" items={report.assessmentLimitations} icon={CircleAlert}/>
      <PointsCard title="Questions to ask in the interview" items={report.interviewerQuestions} icon={MessageSquare}/>
    </div>
    {hasItems(report.developmentTopics) && <PointsCard title="Suggested practice topics" items={report.developmentTopics}/>}
    {hasItems(report.crossModuleObservations) && <DetailSection title="Patterns across modules" subtitle="Compare recorded results across different tasks"><ReportPoints items={report.crossModuleObservations}/></DetailSection>}
    {hasItems(report.dataQualityFlags) && <PointsCard title="Data and scoring notes" items={report.dataQualityFlags} icon={CircleAlert}/>}
    {showCharts && <DetailSection title="Assessment charts" subtitle="Verified scores and SiBS AI explanations"><CsrFitHermesCharts assessment={assessment} hermesReport={report} hermesStatus="READY"/></DetailSection>}
    {(report.methodology || modelName) && <DetailSection title="How this report was prepared"><ReportText text={report.methodology}/>{modelName && <p className="text-xs text-sibs-muted">Model: {modelName}</p>}</DetailSection>}
    <p className="flex items-center gap-2 text-xs leading-relaxed text-sibs-muted"><BookOpen size={14} aria-hidden="true" className="shrink-0"/> SiBS AI provides advisory interpretation. Human HR review is required.</p>
  </div>;
}
