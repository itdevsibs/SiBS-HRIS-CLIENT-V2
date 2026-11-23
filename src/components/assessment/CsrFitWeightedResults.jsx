import { Scale, ShieldAlert } from 'lucide-react';

const known = number => number !== null && number !== undefined && number !== '' &&
  Number.isFinite(Number(number)) && Number(number) >= 0 && Number(number) <= 100;
const pct = value => known(value) ? `${Number(value).toFixed(2)}%` : 'Unscored';

/** Server-authoritative module contributions. Never recompute the weighted score in the browser. */
export default function CsrFitWeightedResults({ summary }) {
  if (!summary || !Array.isArray(summary.modules) || summary.modules.length !== 7) return null;
  const finished = summary.status === 'PROVISIONAL_COMPLETE' && known(summary.overallScorePct);
  return <section className="rounded-xl border border-sibs-border bg-white p-4 sm:p-5" aria-label="Seven-module weighted assessment summary">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sibs-border pb-4">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-sibs-navy"><Scale size={17} className="text-sibs-orange"/> Seven-module weighted assessment</h3>
        <p className="mt-1 text-[11px] text-sibs-muted">Official module weights · Server-computed provisional results</p>
      </div>
      <div className="rounded-lg border border-sibs-border bg-sibs-surface px-4 py-2.5 text-right">
        <p className="text-[10px] font-bold uppercase tracking-wider text-sibs-muted">Weighted total / 100</p>
        <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-sibs-navy">{finished ? pct(summary.overallScorePct) : 'Pending'}</p>
        <p className="text-[10px] text-sibs-muted">{finished ? 'Provisional, not a hiring decision' : `${summary.unscoredWeightPct ?? '—'}% weight awaiting a valid score`}</p>
      </div>
    </div>
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[660px] border-separate border-spacing-0 text-left text-[11px]" aria-label="Module weight, score and contribution">
        <thead><tr className="bg-sibs-surface text-sibs-secondary">
          <th scope="col" className="rounded-l-lg px-3 py-2 font-extrabold">Module</th>
          <th scope="col" className="px-3 py-2 text-right font-extrabold">Weight</th>
          <th scope="col" className="px-3 py-2 text-right font-extrabold">Module score</th>
          <th scope="col" className="rounded-r-lg px-3 py-2 text-right font-extrabold">Contribution / 100</th>
        </tr></thead>
        <tbody>{summary.modules.map((item, index) => <tr key={item.key || index} className="border-b border-sibs-border">
          <td className="border-b border-sibs-border px-3 py-2.5"><div className="font-bold text-sibs-navy">{index+1}. {item.name}</div><div className="mt-0.5 text-[10px] text-sibs-muted">{item.scoringNote}</div></td>
          <td className="border-b border-sibs-border px-3 py-2.5 text-right font-extrabold tabular-nums text-sibs-navy">{item.weightPct}%</td>
          <td className="border-b border-sibs-border px-3 py-2.5 text-right tabular-nums text-sibs-secondary">{pct(item.rawScorePct)}</td>
          <td className="border-b border-sibs-border px-3 py-2.5 text-right font-extrabold tabular-nums text-sibs-navy">{known(item.weightedContributionPct) ? `${Number(item.weightedContributionPct).toFixed(2)} pts` : 'Pending'}</td>
        </tr>)}</tbody>
        <tfoot><tr className="bg-sibs-surface font-extrabold text-sibs-navy"><th scope="row" className="rounded-l-lg px-3 py-3">Total</th>
          <td className="px-3 py-3 text-right">{summary.totalWeightPct}%</td>
          <td className="px-3 py-3 text-right">{summary.knownWeightPct}% scored weight</td>
          <td className="rounded-r-lg px-3 py-3 text-right tabular-nums">{finished ? `${Number(summary.overallScorePct).toFixed(2)} pts` : 'Pending'}</td>
        </tr></tfoot>
      </table>
    </div>
    <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-sibs-muted"><ShieldAlert size={14} className="mt-0.5 shrink-0 text-sibs-orange"/>
      Unscored modules are never treated as zero. Module 1 uses a provisional answer key; Module 2 is descriptive self-report; practical scoring is provisional. Human HR validation is required before using this result for any employment decision.
    </p>
  </section>;
}
