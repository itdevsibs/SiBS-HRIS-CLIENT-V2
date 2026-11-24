import { Activity, BarChart3, Scale } from 'lucide-react';

const validPercent = value => value !== null && value !== undefined && value !== '' &&
  Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100;
const fmt = value => validPercent(value) ? Number(value).toFixed(2) : '—';

/** Public Assessment only. All numeric values come from the server-issued
 * weightedSummary. This component never regrades or invents module scores. */
export default function PublicCsrFitVisualDashboard({ summary }) {
  const modules = Array.isArray(summary?.modules) && summary.modules.length === 7 ? summary.modules : [];
  if (!modules.length) return <section className="rounded-xl border border-sibs-border bg-white p-4">
    <h3 className="text-sm font-extrabold text-sibs-navy">Seven-module performance</h3>
    <p className="mt-2 text-xs text-sibs-muted">Verified module results are not available for this assessment.</p>
  </section>;
  const known = modules.filter(m => validPercent(m.rawScorePct)).length;
  const overall = validPercent(summary.overallScorePct) ? `${Number(summary.overallScorePct).toFixed(2)}%` : 'Pending review';
  const weightSum = modules.reduce((n, m) => n + (Number(m.weightPct) || 0), 0);
  return <section className="space-y-4 rounded-xl border border-sibs-border bg-white p-4 sm:p-5" aria-label="Verified seven-module performance visualizations">
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-sibs-border pb-3">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-sibs-navy"><BarChart3 size={17} className="text-sibs-orange"/> Seven-module visual scorecard</h3>
        <p className="mt-1 text-[11px] leading-5 text-sibs-muted">HRIS-verified scores and weighted contributions only. No model-generated numerical values.</p>
      </div>
      <div className="rounded-lg border border-sibs-border bg-sibs-surface px-3 py-2 text-right">
        <p className="text-[10px] font-bold text-sibs-muted">Provisional overall score</p>
        <p className="text-xl font-extrabold text-sibs-navy tabular-nums">{overall}</p>
        <p className="text-[10px] text-sibs-muted">{known} of 7 scored modules</p>
      </div>
    </header>
    <div className="grid gap-4 lg:grid-cols-2">
      <div aria-label="Module raw performance">
        <h4 className="flex items-center gap-2 text-xs font-extrabold text-sibs-navy"><Activity size={15} className="text-sibs-orange" /> Module scores</h4>
        <p className="mt-1 text-[10px] text-sibs-muted">Raw percentage within each module · 0–100% scale</p>
        <div className="mt-3 space-y-3">
          {modules.map((item, i) => <div key={item.key || i}>
            <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
              <span className="max-w-[80%] font-bold leading-4 text-sibs-secondary" title={item.name}>{i+1}. {item.name}</span>
              <span className="shrink-0 font-extrabold tabular-nums text-sibs-navy">{validPercent(item.rawScorePct) ? `${fmt(item.rawScorePct)}%` : 'Unscored'}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200" role={validPercent(item.rawScorePct) ? 'progressbar' : undefined}
              aria-label={`${item.name} raw module score`} aria-valuemin={validPercent(item.rawScorePct) ? 0 : undefined}
              aria-valuemax={validPercent(item.rawScorePct) ? 100 : undefined}
              aria-valuenow={validPercent(item.rawScorePct) ? Number(item.rawScorePct) : undefined}>
              {validPercent(item.rawScorePct) && <div className="h-full rounded-full bg-sibs-navy" style={{width:`${Number(item.rawScorePct)}%`}} />}
            </div>
          </div>)}
        </div>
      </div>
      <div aria-label="Weighted module contributions">
        <h4 className="flex items-center gap-2 text-xs font-extrabold text-sibs-navy"><Scale size={15} className="text-sibs-orange" /> Contribution to overall score</h4>
        <p className="mt-1 text-[10px] text-sibs-muted">Earned percentage points against each module's official weight.</p>
        <div className="mt-3 space-y-3">
          {modules.map((item, i) => {
            const weight = Number(item.weightPct);
            const eligible = validPercent(item.weightedContributionPct) && Number.isFinite(weight) && weight > 0;
            const earned = eligible ? Math.min(weight, Number(item.weightedContributionPct)) : 0;
            return <div key={item.key || i}>
              <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                <span className="max-w-[80%] font-bold leading-4 text-sibs-secondary" title={item.name}>M{i+1} · Weight {Number.isFinite(weight) ? weight : '—'}%</span>
                <span className="shrink-0 font-extrabold tabular-nums text-sibs-navy">{eligible ? `${earned.toFixed(2)} / ${weight.toFixed(0)} pts` : 'Unscored'}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200" role={eligible ? 'progressbar' : undefined}
                aria-label={`${item.name} contribution`} aria-valuemin={eligible ? 0 : undefined}
                aria-valuemax={eligible ? weight : undefined} aria-valuenow={eligible ? earned : undefined}>
                {eligible && <div className="h-full rounded-full bg-sibs-orange" style={{width:`${earned / weight * 100}%`}} />}
              </div>
            </div>;
          })}
        </div>
      </div>
    </div>
    <p className="border-t border-sibs-border pt-3 text-[11px] leading-5 text-sibs-muted">Official configured weights total {weightSum}%.
      {weightSum !== 100 ? ' The recorded weights require validation.' : ''} No missing score is treated as zero. All results are provisional and require human HR review.</p>
  </section>;
}
