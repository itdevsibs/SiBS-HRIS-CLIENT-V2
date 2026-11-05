import { useState } from "react";
import { Plus, Trash2, GraduationCap } from "lucide-react";
import { NHO_QUIZ_QUESTIONS, NHO_QUIZ_STAGES } from "./nhoInitialData";
function OrientationQuizEditor({ config, onChange }) {
  const stages = config.quizStages ?? NHO_QUIZ_STAGES;
  const questions = config.quizQuestions ?? NHO_QUIZ_QUESTIONS;
  const [selectedPartId, setSelectedPartId] = useState(stages[0].id);
  const stage = stages.find((s) => s.id === selectedPartId) || stages[0];
  const partQuestions = questions.filter((q) => q.stageId === stage.id);
  const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-sibs-navy focus:outline-none focus:ring-2 focus:ring-sibs-orange";
  const updateQuestions = (next) => onChange({
    ...config,
    quizQuestions: next,
    quizStages: stages.map((s) => ({ ...s, questionCount: next.filter((q) => q.stageId === s.id).length }))
  });
  const updateQuestion = (id, patch) => {
    updateQuestions(questions.map((q) => q.id === id ? { ...q, ...patch } : q));
  };
  const addQuestion = (list = questions) => {
    const id = Math.max(0, ...list.map((q) => q.id)) + 1;
    return [...list, { id, stageId: stage.id, question: "", options: ["", "", "", ""], correctOptionIndex: 0, explanation: "" }];
  };
  const setQuestionCount = (count) => {
    if (!Number.isInteger(count) || count < 1 || count > 50) return;
    let next = [...questions];
    while (next.filter((q) => q.stageId === stage.id).length < count) next = addQuestion(next);
    const removedIds = new Set(partQuestions.slice(count).map((q) => q.id));
    updateQuestions(next.filter((q) => !removedIds.has(q.id)));
  };
  return <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-sibs-navy"><GraduationCap className="w-5 h-5" />Quiz by orientation part</h3>
          <p className="mt-1 text-xs text-slate-600">Choose a part, set when its quiz appears, and edit the questions and answer key. Publish to update the applicant portal.</p>
        </div>
        <span className="text-xs font-semibold text-sibs-navy">{questions.length} questions · {config.passingScorePct}% benchmark</span>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2" aria-label="Orientation quiz parts">
        {stages.map((s, index) => <button type="button" key={s.id} aria-pressed={stage.id === s.id} onClick={() => setSelectedPartId(s.id)} className={`rounded-xl border p-3 text-left text-xs ${stage.id === s.id ? "border-sibs-navy bg-sibs-navy text-white" : "border-slate-200 bg-white text-sibs-navy"}`}>
            <span className="block font-bold">Part {index + 1}</span>
            <span className="block mt-1">After slide {s.triggerAfterSlide} · {questions.filter((q) => q.stageId === s.id).length} questions</span>
          </button>)}
      </div>
      <div className="grid sm:grid-cols-2 gap-3 bg-white border border-slate-200 rounded-xl p-4">
        <label className="sm:col-span-2 text-xs font-semibold text-sibs-navy">Part title
          <input className={`${field} mt-1`} value={stage.title} onChange={(e) => onChange({ ...config, quizStages: stages.map((s) => s.id === stage.id ? { ...s, title: e.target.value } : s) })} />
        </label>
        <label className="text-xs font-semibold text-sibs-navy">Show this part’s quiz after slide
          <select className={`${field} mt-1`} value={stage.triggerAfterSlide} onChange={(e) => onChange({ ...config, quizStages: stages.map((s) => s.id === stage.id ? { ...s, triggerAfterSlide: Number(e.target.value) } : s) })}>
            {config.slides.map((slide) => <option key={slide.num} value={slide.num}>{slide.num}. {slide.title}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-sibs-navy">Number of questions in this part
          <input className={`${field} mt-1`} type="number" min={1} max={50} value={partQuestions.length} onChange={(e) => setQuestionCount(Number(e.target.value))} />
        </label>
        <p className="sm:col-span-2 text-[11px] text-slate-500">Checkpoints must follow slide order. The last part ends after the final slide. Increasing the count adds blank questions; decreasing it removes the last questions in this draft.</p>
      </div>
      {partQuestions.map((q, index) => <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-sibs-navy">Question {index + 1}</h4>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600">Move to
                <select className="ml-2 border border-slate-300 rounded-lg p-1.5 text-xs" aria-label={`Move question ${index + 1} to part`} value={q.stageId} onChange={(e) => updateQuestion(q.id, { stageId: Number(e.target.value) })}>
                  {stages.map((s, i) => <option key={s.id} value={s.id}>Part {i + 1}</option>)}
                </select>
              </label>
              <button type="button" disabled={partQuestions.length <= 1} aria-label={`Delete question ${index + 1}`} onClick={() => updateQuestions(questions.filter((item) => item.id !== q.id))} className="p-2 text-red-700 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
          <label className="block text-xs font-semibold text-sibs-navy">Question text
            <textarea rows={2} className={`${field} mt-1`} value={q.question} onChange={(e) => updateQuestion(q.id, { question: e.target.value })} />
          </label>
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold text-sibs-navy mb-2">Answer choices · select the correct answer</legend>
            {q.options.map((option, optionIndex) => <div key={optionIndex} className="flex items-center gap-2">
                <input type="radio" name={`correct-${q.id}`} aria-label={`Question ${index + 1}: option ${String.fromCharCode(65 + optionIndex)} is correct`} checked={q.correctOptionIndex === optionIndex} onChange={() => updateQuestion(q.id, { correctOptionIndex: optionIndex })} className="accent-sibs-navy" />
                <input aria-label={`Question ${index + 1}: answer ${String.fromCharCode(65 + optionIndex)}`} className={field} value={option} onChange={(e) => updateQuestion(q.id, { options: q.options.map((o, i) => i === optionIndex ? e.target.value : o) })} />
                <button type="button" disabled={q.options.length <= 2} aria-label={`Remove answer ${String.fromCharCode(65 + optionIndex)} from question ${index + 1}`} className="p-1 text-red-700 disabled:opacity-30" onClick={() => updateQuestion(q.id, { options: q.options.filter((_, i) => i !== optionIndex), correctOptionIndex: q.correctOptionIndex === optionIndex ? 0 : q.correctOptionIndex > optionIndex ? q.correctOptionIndex - 1 : q.correctOptionIndex })}><Trash2 className="w-3.5 h-3.5" /></button>
              </div>)}
            <button type="button" onClick={() => updateQuestion(q.id, { options: [...q.options, ""] })} className="text-xs font-semibold text-sibs-navy underline">Add answer choice</button>
          </fieldset>
          <label className="block text-xs font-semibold text-sibs-navy">Answer explanation / takeaway
            <textarea rows={2} className={`${field} mt-1`} value={q.explanation} onChange={(e) => updateQuestion(q.id, { explanation: e.target.value })} />
          </label>
        </div>)}
      <button type="button" onClick={() => updateQuestions(addQuestion())} className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-sibs-navy"><Plus className="w-4 h-4" />Add question to this part</button>
    </section>;
}
export {
  OrientationQuizEditor as default
};
