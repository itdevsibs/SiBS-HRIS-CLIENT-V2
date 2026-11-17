import { ClipboardList, Target } from "lucide-react";
import { useState } from "react";
import { ModalShell, SelectDropdown, DatePicker } from "@/components/ui";
import { useJourney } from "./JourneyContext";


export default function EsepCoachingActions({ targetEmployee, actionOnly = false }) {
  const { journeys = [], esepSessions = [], esepEvaluations = [], simulatedCurrentDate, addEsepSession, addEsepEvaluation } = useJourney();
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const field = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));
  const open = (value) => { setForm({ emp: targetEmployee?.sibsEmployeeId || targetEmployee?.id || "", date: simulatedCurrentDate, due: simulatedCurrentDate, type: "Weekly 1:1" }); setError(""); setMode(value); };
  const textField = (key, label, type = "text") => <label className="block space-y-1.5"><span className="sibs-modal-field-label">{label}</span><input className="sibs-modal-input" type={type} required value={form[key] ?? ""} onChange={(event) => field(key, event.target.value)} /></label>;
  const notesField = (key, label) => <label className="block space-y-1.5"><span className="sibs-modal-field-label">{label}</span><textarea className="sibs-modal-textarea" rows={3} placeholder="Enter coaching details…" required value={form[key] || ""} onChange={(event) => field(key, event.target.value)} /></label>;
  const pending = esepSessions.filter((session) => !esepEvaluations.some((evaluation) => evaluation.sessionId === session.id));
  const save = (event) => {
    event.preventDefault();
    const required = mode === "grow" ? ["emp", "type", "facilitator", "date", "due", "goal", "reality", "options", "will"] : ["sessionId", "date", "owner", "source", "notes", "metric", "before", "after"];
    if (required.some((key) => !String(form[key] ?? "").trim())) { setError("Complete all required fields."); return; }
    if (mode === "grow") {
      if (!journeys.some((journey) => (journey.sibsEmployeeId || journey.id) === form.emp)) { setError("Select a valid coachee."); return; }
      if (form.due < form.date) { setError("The follow-up date must be on or after the session date."); return; }
      addEsepSession({ ...form, id: crypto.randomUUID(), facilitatorRole: "Team Leader", actionPlan: form.will, qaParameters: [] });
    } else {
      const session = pending.find((item) => String(item.id) === String(form.sessionId));
      if (!session || !Number.isFinite(Number(form.before)) || !Number.isFinite(Number(form.after))) { setError("Select a pending session and enter valid KPI numbers."); return; }
      if (form.date < session.date) { setError("Evaluation cannot precede the session date."); return; }
      addEsepEvaluation({ ...form, id: crypto.randomUUID(), sessionId: session.id, emp: session.emp, before: Number(form.before), after: Number(form.after) });
    }
    setNotice(mode === "grow" ? "GROW coaching record saved." : "Follow-up evaluation saved."); setMode(null);
  };
  const today = esepSessions.filter((session) => session.date === simulatedCurrentDate);
  return <>
    <div className="flex flex-wrap items-center justify-end gap-2">
      {!actionOnly && <button className="sibs-btn-secondary" onClick={() => open("eod")}>View TL EOD Summary</button>}
      {!actionOnly && <button className="sibs-btn-secondary" onClick={() => open("evaluation")} disabled={!pending.length}>Record Follow-Up Evaluation</button>}
      <button className="sibs-btn-primary" onClick={() => open("grow")} disabled={!journeys.length}>{actionOnly ? "+ Assign Action Item" : "Record GROW Coaching"}</button>
    </div>
    {notice && <p role="status" className="sibs-badge-success">{notice}</p>}
    <ModalShell
      open={Boolean(mode)}
      onClose={() => setMode(null)}
      title={mode === "grow" ? (actionOnly ? "Assign Coaching Action Item" : "Record GROW Coaching") : mode === "evaluation" ? "Record Follow-Up Evaluation" : "TL End-of-Day Summary"}
      icon={ClipboardList}
      badge="ESEP Coaching"
      subtitle="Document the coaching goal, development needs, and agreed follow-up actions."
      maxWidth="max-w-4xl"
      bodyClassName="overscroll-contain bg-sibs-surface p-4 sm:p-6"
      footer={
        <>
          <button type="button" className="sibs-modal-btn-secondary" onClick={() => setMode(null)}>Close</button>
          {mode !== "eod" && <button className="sibs-modal-btn-primary" type="submit" form="esep-record-form">Save Record</button>}
        </>
      }
    >
      {mode === "eod" ? <div className="space-y-3"><p className="sibs-text-xs text-sibs-muted">Coaching records for {simulatedCurrentDate}. Frontend summary only.</p><p className="font-bold text-sibs-navy">{today.length} sessions recorded</p>{today.map((session) => <div key={session.id} className="rounded-xl border border-sibs-border bg-white p-3 sibs-text-xs"><strong>{journeys.find((journey) => (journey.sibsEmployeeId || journey.id) === session.emp)?.fullName || session.emp}</strong><p>{session.facilitator} · {session.type}</p><p>{session.goal}</p></div>)}{!today.length && <p className="sibs-text-xs text-sibs-muted">No coaching sessions recorded for this date.</p>}</div> : <form id="esep-record-form" onSubmit={save} className="space-y-4">
        {error && <p role="alert" className="sibs-badge-danger">{error}</p>}
        {mode === "grow" ? <>
          <section className="sibs-card space-y-4 p-4 sm:p-5">
            <h3 className="sibs-modal-section-title flex items-center gap-2 border-b border-sibs-border pb-3">
              <ClipboardList size={16} aria-hidden="true" className="shrink-0 text-sibs-orange" />
              Session Details
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectDropdown labelClassName="sibs-modal-field-label" label="Coachee" value={form.emp || ""} onChange={(value) => field("emp", value)} searchable options={journeys.map((journey) => ({ value: journey.sibsEmployeeId || journey.id, label: journey.fullName }))} />
              <SelectDropdown labelClassName="sibs-modal-field-label" label="Session Type" value={form.type} onChange={(value) => field("type", value)} options={["Weekly 1:1", "QA-triggered", "Ad-hoc Support"]} />
              <div className="sm:col-span-2">{textField("facilitator", "Facilitator")}</div>
              <DatePicker labelClassName="sibs-modal-field-label" label="Session Date" value={form.date} onChange={(value) => field("date", value)} />
              <DatePicker labelClassName="sibs-modal-field-label" label="Follow-up Due Date" value={form.due} onChange={(value) => field("due", value)} />
            </div>
          </section>
          <section className="sibs-card space-y-4 p-4 sm:p-5">
            <div className="border-b border-sibs-border pb-3">
              <h3 className="sibs-modal-section-title flex items-center gap-2">
                <Target size={16} aria-hidden="true" className="shrink-0 text-sibs-orange" />
                GROW Coaching Plan
              </h3>
              <p className="sibs-modal-section-subtitle mt-1">Record the current situation and agree on practical next steps.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {notesField("goal", "G · Goal")}
              {notesField("reality", "R · Reality")}
              {notesField("options", "O · Options")}
              {notesField("will", "W · Way Forward / Agreed Action")}
            </div>
          </section>
        </> : <>
          <SelectDropdown label="Coaching Session" value={form.sessionId || ""} onChange={(value) => field("sessionId", value)} searchable options={pending.map((session) => ({ value: session.id, label: `${session.emp} · ${session.date} · ${session.goal}` }))} />
          <DatePicker label="Evaluation Date" value={form.date} onChange={(value) => field("date", value)} />
          {textField("owner", "Reviewer")}{textField("source", "Evidence / Source")}{textField("metric", "KPI / Metric")}{textField("unit", "Unit (e.g. %, seconds)")}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{textField("before", "Before", "number")}{textField("after", "After", "number")}</div>
          {notesField("notes", "Follow-up Findings")}
        </>}
      </form>}
    </ModalShell>
  </>;
}
