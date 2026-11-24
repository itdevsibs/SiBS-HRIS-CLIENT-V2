/** Presentation only: retain every sentence of the stored report. Never infer,
 * rescore, paraphrase or drop a caveat from an older interpretation. */
export function splitReportSentences(value) {
  if (typeof value !== 'string' || !value.trim()) return [];
  const text = value.trim();
  if (typeof Intl.Segmenter !== 'function') return [text];
  return Array.from(new Intl.Segmenter('en', { granularity: 'sentence' }).segment(text),
    entry => entry.segment.trim()).filter(Boolean);
}

export default function CsrFitReportText({ text, empty = null }) {
  const sentences = splitReportSentences(text);
  if (!sentences.length) return empty;
  return <div className="min-w-0 space-y-2 break-words text-xs leading-relaxed text-sibs-secondary">
    {sentences.map((sentence,index) => <p key={index}>{sentence}</p>)}
  </div>;
}

export function ReportPoints({ items, empty = 'No additional findings recorded.' }) {
  const points = (Array.isArray(items) ? items : []).filter(item => typeof item === 'string' && item.trim());
  if (!points.length) return <p className="text-xs leading-relaxed text-sibs-muted">{empty}</p>;
  return <ul className="space-y-2.5 text-xs leading-relaxed text-sibs-secondary">
    {points.map((point,index) => <li key={index} className="flex min-w-0 items-start gap-2">
      <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sibs-orange" />
      <span className="min-w-0 break-words">{point}</span>
    </li>)}
  </ul>;
}
