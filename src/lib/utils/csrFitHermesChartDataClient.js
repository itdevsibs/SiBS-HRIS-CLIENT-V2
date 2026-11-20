/**
 * CSR-Fit chart values are derived ONLY from authenticated HRIS assessment
 * results. Hermes may choose the visualizations and explain them, but it never
 * supplies chart values, denominators, thresholds or hiring recommendations.
 */
export const CSR_FIT_CHART_DEFINITIONS = Object.freeze({
  cognitive_radar: { title: 'Cognitive competency profile', type: 'radar', source: 'score.module1Categories' },
  behavioral_bars: { title: 'Behavioral competency profile', type: 'horizontal_bar', source: 'score.behavioralPillars' },
  practical_tasks: { title: 'Practical assessment evidence', type: 'task_comparison', source: 'objective' },
  typing_benchmarks: { title: 'Typing speed and accuracy', type: 'benchmark', source: 'objective.module5' },
});

export function csrFitSafePercent(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 100 ? number : null;
}
const safeCount = value => Number.isSafeInteger(Number(value)) && value !== '' && value != null && Number(value) >= 0
  ? Number(value) : null;
const safePositive = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0
  ? Number(value) : null;

export function buildCsrFitVerifiedChartData(data) {
  const score = data?.score || {};
  const objective = data?.objective || {};
  const cognitive = (Array.isArray(score.module1Categories) ? score.module1Categories : [])
    .map(item => ({label: String(item?.category || '').slice(0,100), percent: csrFitSafePercent(item?.score),
      correct: safeCount(item?.correct), total: safeCount(item?.total)}))
    .filter(item => item.label && item.percent !== null);
  const behavioral = (Array.isArray(score.behavioralPillars) ? score.behavioralPillars : [])
    .map(item => ({label: String(item?.name || '').slice(0,100), percent: csrFitSafePercent(item?.score),
      items: safeCount(item?.items)}))
    .filter(item => item.label && item.percent !== null);
  const practical = [];
  if (typeof objective.module3?.correct === 'boolean')
    practical.push({ label:'Coaching response', correct: Number(objective.module3.correct), total:1, module:3 });
  if (typeof objective.module4?.file === 'boolean')
    practical.push({label:'File organization', correct:Number(objective.module4.file), total:1, module:4});
  const dataFields = safeCount(objective.module4?.dataFieldsCorrect);
  if (dataFields !== null && dataFields <= 3)
    practical.push({label:'Customer data fields', correct:dataFields, total:3, module:4});
  if (typeof objective.module4?.categoryCorrect === 'boolean')
    practical.push({label:'Case categorization', correct:Number(objective.module4.categoryCorrect), total:1, module:4});
  const knowledge = safeCount(objective.module7?.correct);
  const knowledgeTotal = safeCount(objective.module7?.total);
  if (knowledge !== null && knowledgeTotal > 0 && knowledge <= knowledgeTotal)
    practical.push({label:'Computer literacy', correct:knowledge, total:knowledgeTotal, module:7});
  const audio = {
    fieldsCorrect: safeCount(objective.module6?.fieldsCorrect),
    choicesCorrect: safeCount(objective.module6?.choicesCorrect),
  }; // Source does not expose every denominator here: counts are not percentages.
  const typing = (Array.isArray(objective.module5) ? objective.module5 : [])
    .map((item,index) => ({passage:index+1, wpm:safePositive(item?.wpm), accuracy:csrFitSafePercent(item?.accuracy),
      wpmBenchmark:40, accuracyBenchmark:90}))
    .filter(item => item.wpm !== null || item.accuracy !== null);
  return {cognitive, behavioral, practical, audio, typing};
}

/** Hermes selects only chart IDs and narrative; IDs outside the allowlist are ignored. */
export function resolveCsrFitChartPlan(report, chartData) {
  const allowed = ['cognitive_radar', 'behavioral_bars', 'practical_tasks', 'typing_benchmarks']
    .filter(id => ({cognitive_radar:chartData.cognitive.length >= 3,
      behavioral_bars:chartData.behavioral.length > 0,
      practical_tasks:chartData.practical.length > 0 || chartData.audio.fieldsCorrect !== null || chartData.audio.choicesCorrect !== null,
      typing_benchmarks:chartData.typing.length > 0})[id]);
  const suggestions = Array.isArray(report?.chartPlan) ? report.chartPlan : [];
  const seen = new Set();
  const verified = suggestions.filter(item => {
    if (!item || !allowed.includes(item.id) || seen.has(item.id)) return false;
    seen.add(item.id);return true;
  }).map(item => ({id:item.id, insight:typeof item.insight === 'string' ? item.insight.trim() : ''}));
  // Verified graphs remain available even when Hermes is still processing or
  // its report did not request a particular view. No AI insights are invented.
  return [...verified, ...allowed.filter(id => !seen.has(id)).map(id => ({id, insight:''}))];
}
