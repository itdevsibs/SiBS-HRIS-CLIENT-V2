import { useEffect, useRef, useState } from "react";
import {
  getUatStatus, getUatCatalog, getUatMonitoring, getOwnUatFeedback,
  submitUatFeedback, reviewUatFeedback, runUatBenchmark,
} from "@/lib/axios/hris-uat";
import { getAiErrorMessage } from "@/lib/utils/ai/aiAssistantHelpers";

const fieldClass = "w-full rounded-lg border border-sibs-border bg-white p-2 text-xs text-sibs-navy";
const buttonClass = "rounded-lg bg-sibs-navy px-3 py-2 text-xs font-bold text-white disabled:opacity-50";

function ReviewRecord({ record, busy, onReview }) {
  const [decision, setDecision] = useState("NEEDS_FOLLOW_UP");
  const [comment, setComment] = useState("");
  const [defectReference, setDefectReference] = useState(record.defectReference || "");
  return (
    <form className="space-y-2 rounded-lg border border-sibs-border p-2" onSubmit={(event) => {
      event.preventDefault();
      void onReview(record.recordId, { decision, comment, defectReference });
    }}>
      <p>{record.scenarioId} · {record.role} · {record.executionStatus} · Review: {record.reviewerStatus}</p>
      <p>Expected capability: {record.expectedCapability || "None"}; reported: {record.actualCapability || "Unavailable"}</p>
      <p>Data comparison: {record.dataComparison}; citations: {record.citationVerification}</p>
      <p>{record.sanitizedComment}</p>
      <p>Evidence binding: {record.sourceStatus || "Legacy participant report"}. Comparison checks remain human-reported.</p>
      {record.historicalReviewAssessment?.startsWith("REASSESS") ? <p>Prior review requires reassessment: {record.historicalReviewAssessment}</p> : null}
      {record.evidenceReference ? <p>Evidence reference: {record.evidenceReference}</p> : null}
      {record.completionStatus ? <p>Completion: {record.completionStatus}</p> : null}
      {record.defect ? <p>Defect: {record.defect.severity}; {record.defect.resolutionStatus}. Expected: {record.defect.expectedBehavior}. Actual: {record.defect.actualBehavior}. Reproduce: {record.defect.reproductionSteps}. Proposed owner: {record.defect.assignedOwner || "Unassigned"}.</p> : null}
      {record.reviewerComment ? <p>Reviewer: {record.reviewerComment}</p> : null}
      <label className="block">Review decision
        <select className={fieldClass} value={decision} disabled={busy} onChange={(e) => setDecision(e.target.value)}>
          <option value="NEEDS_FOLLOW_UP">Needs follow-up</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </label>
      <label className="block">Reviewer comment
        <textarea className={fieldClass} maxLength={800} value={comment} disabled={busy} onChange={(e) => setComment(e.target.value)} />
      </label>
      <label className="block">Review defect reference
        <input className={fieldClass} maxLength={80} value={defectReference} disabled={busy} onChange={(e) => setDefectReference(e.target.value)} />
      </label>
      <button className={buttonClass} disabled={busy}>Save review</button>
    </form>
  );
}

export default function HrisUatPanel({ onRunScenario, submitting }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sibs_uat_panel_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [access, setAccess] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [scenarioId, setScenarioId] = useState("");
  const [execution, setExecution] = useState(null);
  const [outcome, setOutcome] = useState("NOT_TESTED");
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
  const [dataComparison, setDataComparison] = useState("NOT_TESTED");
  const [citationVerification, setCitationVerification] = useState("NOT_TESTED");
  const [defectReference, setDefectReference] = useState("");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [defectSeverity, setDefectSeverity] = useState("Medium");
  const [defectExpected, setDefectExpected] = useState("");
  const [defectActual, setDefectActual] = useState("");
  const [defectSteps, setDefectSteps] = useState("");
  const [defectOwner, setDefectOwner] = useState("");
  const [monitoring, setMonitoring] = useState(null);
  const [ownRecords, setOwnRecords] = useState(null);
  const [benchmark, setBenchmark] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const lifetime = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    async function load() {
      try {
        const status = await getUatStatus(controller.signal);
        if (controller.signal.aborted) return;
        setAccess(status);
        // Never fetch reviewer evidence based on a client-side HRIS role.
        if (status.participant === true) {
          const catalog = await getUatCatalog(controller.signal);
          if (!controller.signal.aborted) setScenarios(catalog.scenarios);
        }
      } catch (failure) {
        if (!controller.signal.aborted) {
          setAccess(null);
          setError(getAiErrorMessage(failure));
        }
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  async function perform(action) {
    if (busy || submitting || lifetime.current?.signal.aborted) return;
    const signal = lifetime.current.signal;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action(signal);
    } catch (failure) {
      if (!signal.aborted) {
        setError(getAiErrorMessage(failure));
        if ([401, 403].includes(failure?.response?.status)) {
          setAccess(null);
          setMonitoring(null);
          setOwnRecords(null);
        }
      }
    } finally {
      if (!signal.aborted) setBusy(false);
    }
  }

  const participant = access?.participant === true;
  const reviewer = access?.reviewer === true;
  const selected = scenarios.find((item) => item.id === scenarioId);
  const disabled = busy || submitting;

  if (!participant && !reviewer) {
    return error ? <p role="status" className="mb-3 text-xs text-sibs-muted">Development UAT unavailable: {error}</p> : null;
  }

  return (
    <section aria-label="Development UAT" className="mb-4 space-y-3 rounded-xl border border-sibs-border bg-white p-3 text-xs text-sibs-navy">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Development UAT</h3>
        <button
          type="button"
          aria-expanded={!collapsed}
          className="rounded border border-sibs-border px-2 py-0.5 text-[11px] font-medium text-sibs-muted hover:bg-sibs-surface hover:text-sibs-navy transition cursor-pointer"
          onClick={() => {
            const next = !collapsed;
            setCollapsed(next);
            try {
              localStorage.setItem("sibs_uat_panel_collapsed", String(next));
            } catch {}
          }}
        >
          {collapsed ? "Show UAT" : "Hide UAT"}
        </button>
      </div>
      {collapsed ? null : (
        <>
          <p>Record your own checks against official HRIS records. Leave unverified checks as Not tested. Do not include personal data in comments.</p>
          {participant ? <>
            <button type="button" className={buttonClass} disabled={disabled} onClick={() => void perform(async (signal) => {
              const result = await getOwnUatFeedback(signal);
              if (!signal.aborted) setOwnRecords(result.records);
            })}>View my UAT records</button>
            {ownRecords ? <div aria-label="My UAT records">{ownRecords.length ? ownRecords.map((record) => <p key={record.recordId}>{record.scenarioId}: {record.executionStatus}; review {record.reviewerStatus}; evidence {record.evidenceReference || "Not provided"}</p>) : <p>No saved UAT records for this participant.</p>}</div> : null}
            <label className="block">UAT scenario
              <select className={fieldClass} value={scenarioId} disabled={disabled} onChange={(event) => {
                setScenarioId(event.target.value); setExecution(null); setOutcome("NOT_TESTED");
                setDataComparison("NOT_TESTED"); setCitationVerification("NOT_TESTED");
                setComment(""); setRating(""); setDefectReference(""); setBenchmark(null); setNotice("");
                setEvidenceReference(""); setDefectExpected(""); setDefectActual(""); setDefectSteps(""); setDefectOwner(""); setDefectSeverity("Medium");
              }}>
                <option value="">Select an assigned scenario</option>
                {scenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.id}: {scenario.question}</option>)}
              </select>
            </label>
            {selected ? <p>{selected.question}</p> : null}
            <button type="button" className={buttonClass} disabled={!selected || disabled} onClick={() => void perform(async (signal) => {
              setExecution(null);
              setOutcome("NOT_TESTED");
              setDataComparison("NOT_TESTED");
              setCitationVerification("NOT_TESTED");
              const result = await onRunScenario(selected);
              if (signal.aborted) return;
              if (!result) throw new Error("The scenario did not complete. Review the chat error or record a blocked result.");
              if (!result.executionRecordId) throw new Error("The backend did not provide a server-bound UAT receipt. Reload the development backend before recording an executed outcome.");
              setExecution({ ...result, scenarioId: selected.id });
              setNotice(result.completionStatus === "error" ? "Backend execution recorded with an error. Review it before choosing an outcome." : "Scenario response received. Verify it before choosing an outcome.");
            })}>Run UAT scenario</button>
            {execution ? <p>Response received · {execution.latencyMs} ms · Request: {execution.correlationId || "Unavailable"}</p> : null}
            <form className="space-y-2" onSubmit={(event) => {
              event.preventDefault();
              if (!selected) return;
              void perform(async (signal) => {
                const result = await submitUatFeedback({
                  scenarioId, executionStatus: outcome, category: selected.domain,
                  rating: rating ? Number(rating) : null, comment, dataComparison, citationVerification, defectReference,
                  correlationId: execution?.correlationId || "",
                  actualCapability: execution?.actualCapability || null,
                  latencyMs: execution?.latencyMs ?? null,
                  completionStatus: execution?.completionStatus || null,
                  executionRecordId: execution?.executionRecordId || null,
                  uatEvidence: execution?.uatEvidence || null,
                  evidenceReference,
                  ...(defectReference ? { defect: { severity: defectSeverity, expectedBehavior: defectExpected, actualBehavior: defectActual, reproductionSteps: defectSteps, assignedOwner: defectOwner } } : {}),
                }, signal);
                if (!signal.aborted) setNotice(`Feedback saved for ${result.record.scenarioId}; awaiting independent review.`);
              });
            }}>
              <label className="block">Execution outcome
                <select className={fieldClass} value={outcome} disabled={disabled} onChange={(e) => setOutcome(e.target.value)}>
                  <option value="NOT_TESTED">Not tested</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="PENDING_REVIEW" disabled={!execution}>Pending review</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="PASS" disabled={!execution}>Pass</option>
                  <option value="FAIL" disabled={!execution}>Fail</option>
                </select>
              </label>
              <label className="block">Rating (optional)
                <select className={fieldClass} value={rating} disabled={disabled} onChange={(e) => setRating(e.target.value)}>
                  <option value="">Unrated</option>
                  {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              {[
                ["Data comparison", dataComparison, setDataComparison],
                ["Citation verification", citationVerification, setCitationVerification],
              ].map(([label, value, update]) => <label key={label} className="block">{label}
                <select className={fieldClass} value={value} disabled={disabled} onChange={(e) => update(e.target.value)}>
                  <option value="NOT_TESTED">Not tested</option><option value="PASS">Pass</option><option value="FAIL">Fail</option>
                </select>
              </label>)}
              <label className="block">UAT comment
                <textarea className={fieldClass} value={comment} maxLength={800} disabled={disabled} onChange={(e) => setComment(e.target.value)} />
              </label>
              <label className="block">Defect reference
                <input className={fieldClass} value={defectReference} maxLength={80} disabled={disabled} onChange={(e) => setDefectReference(e.target.value)} />
              </label>
              <label className="block">Evidence reference (no confidential data)
                <input className={fieldClass} maxLength={160} value={evidenceReference} disabled={disabled} onChange={(e) => setEvidenceReference(e.target.value)} />
              </label>
              {defectReference ? <fieldset className="space-y-2">
                <legend>Defect details</legend>
                <label className="block">Defect severity<select className={fieldClass} value={defectSeverity} disabled={disabled} onChange={(e) => setDefectSeverity(e.target.value)}>
                  {["Critical", "High", "Medium", "Low"].map((severity) => <option key={severity}>{severity}</option>)}
                </select></label>
                {[["Expected behavior", defectExpected, setDefectExpected], ["Actual behavior", defectActual, setDefectActual], ["Reproduction steps", defectSteps, setDefectSteps], ["Proposed defect owner", defectOwner, setDefectOwner]].map(([label, value, update]) => <label className="block" key={label}>{label}<textarea className={fieldClass} maxLength={800} disabled={disabled} value={value} onChange={(e) => update(e.target.value)} /></label>)}
                <p>Defects are recorded open. A proposed owner does not imply acceptance or resolution.</p>
              </fieldset> : null}
              <button className={buttonClass} disabled={!selected || disabled || (["PASS", "FAIL", "PENDING_REVIEW"].includes(outcome) && !execution)}>Save UAT feedback</button>
            </form>
            {access.benchmarkEnabled === true ? <>
              <button type="button" className={buttonClass} disabled={!selected || disabled} onClick={() => void perform(async (signal) => {
                const result = await runUatBenchmark([scenarioId], signal);
                if (!signal.aborted) setBenchmark(result);
              })}>Run live benchmark for selected scenario</button>
              {benchmark ? <div role="status">
                <p>Benchmark collected {benchmark.sampleSize} sample(s); p50 {benchmark.p50Ms ?? "Unavailable"} ms; p95 {benchmark.p95Ms ?? "Unavailable"} ms.</p>
                <p>{benchmark.sampleWarning}</p>
                {benchmark.results?.map((result, index) => <p key={index}>{result.scenarioId}: {result.completionStatus}{result.errorCategory ? ` (${result.errorCategory})` : ""}</p>)}
              </div> : null}
            </> : null}
          </> : null}
          {reviewer ? <div className="space-y-2">
            <h4 className="font-bold">UAT reviewer monitoring</h4>
            <button type="button" className={buttonClass} disabled={disabled} onClick={() => void perform(async (signal) => {
              const result = await getUatMonitoring(signal);
              if (!signal.aborted) setMonitoring(result);
            })}>Refresh UAT monitoring</button>
            {monitoring ? <>
              <p>{monitoring.summary.executedScenarioCount} of {monitoring.summary.scenarioCount} scenarios reported; {monitoring.summary.pendingReviewCount} records awaiting review.</p>
              <p>Reported outcomes: {monitoring.summary.passedCount} pass, {monitoring.summary.failedCount} fail, {monitoring.summary.blockedCount} blocked, {monitoring.summary.notTestedCount} not tested.</p>
              <p>These are participant-reported checks. Formal business acceptance remains pending.</p>
              {monitoring.membership ? <p>{monitoring.membership.configuredParticipantCount} configured participants; {monitoring.summary.observedParticipantCount} observed submitting feedback. Configuration alone does not certify a participant.</p> : null}
              {monitoring.summary.countsByRole ? <table className="w-full text-left">
                <caption>Coverage by authenticated role</caption>
                <thead><tr>{["Role", "Assigned", "Executed", "Pass", "Fail", "Blocked", "Pending"].map((label) => <th key={label}>{label}</th>)}</tr></thead>
                <tbody>{Object.entries(monitoring.summary.countsByRole).map(([role, counts]) => <tr key={role}>
                  <td>{role}</td>{[counts.catalogued, counts.executed, counts.passed, counts.failed, counts.blocked, counts.pending].map((count, index) => <td key={index}>{count}</td>)}
                </tr>)}</tbody>
              </table> : null}
              {monitoring.summary.openDefectReferences?.length ? <p>Open defect references: {monitoring.summary.openDefectReferences.join(", ")}</p> : null}
              {monitoring.knowledgeGovernance ? <p>Knowledge approval gaps: {monitoring.knowledgeGovernance.filter((doc) => !doc.corporateApprovalVerified).length} documents require corporate approval verification.</p> : null}
              {monitoring.exitCriteria ? <p>Exit criteria: {monitoring.exitCriteria.status}. {monitoring.exitCriteria.reason}</p> : null}
              {monitoring.records.map((record) => record.recordType === "benchmark"
                ? <div key={record.recordId}><p>Benchmark: {record.sampleSize} sample(s); p50 {record.p50Ms ?? "Unavailable"} ms; p95 {record.p95Ms ?? "Unavailable"} ms. {record.sampleWarning}</p>
                  {record.results?.map((result, index) => <p key={index}>{result.scenarioId}: {result.completionStatus}; {result.totalBackendMs ?? "Unavailable"} ms; model {result.model || "Unavailable"}; HTTP {result.httpStatus ?? "Unavailable"}</p>)}
                </div>
                : <ReviewRecord key={record.recordId} record={record} busy={disabled} onReview={(id, data) => perform(async (signal) => {
                  await reviewUatFeedback(id, data, signal);
                  if (signal.aborted) return;
                  const result = await getUatMonitoring(signal);
                  if (!signal.aborted) { setMonitoring(result); setNotice("Review saved."); }
                })} />)}
            </> : null}
          </div> : null}
        </>
      )}
      {error ? <p role="alert">{error}</p> : null}
      {notice ? <p role="status">{notice}</p> : null}
    </section>
  );
}
