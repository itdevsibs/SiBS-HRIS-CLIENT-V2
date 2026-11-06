import { it } from "node:test";
import assert from "node:assert/strict";
import { validateQdsRequest, validateAssessmentGrade, visibleTrainerJourneys } from "./trainerMonitoringValidation.js";
const trainees = [{ id: "T1", trainerName: "Trainer A" }, { id: "T2", trainerName: "Trainer B" }];
it("restricts trainer summaries to their assigned cohort and handles empty cohorts", () => {
  assert.equal(visibleTrainerJourneys(trainees, { role: "Trainer", name: "Trainer A" }).length, 1);
  assert.equal(visibleTrainerJourneys(trainees, { role: "Trainer", name: "Unknown" }).length, 0);
  assert.equal(visibleTrainerJourneys(trainees, { role: "HR" }).length, 2);
});
it("rejects cleared or stale QDS targets and blank required fields", () => {
  const valid = { trainees, target: "T1", type: "Trainer coaching review", notes: "Review call", due: "2026-11-10" };
  assert.equal(validateQdsRequest(valid), "");
  for (const invalid of [{ target: "" }, { target: "missing" }, { notes: " " }, { type: "" }, { due: "" }]) assert.ok(validateQdsRequest({ ...valid, ...invalid }));
});
it("validates raw assessment points, preserving zero and rejecting blank or excessive scores", () => {
  const valid = { trainees, target: "T1", assessments: [{ id: 1, status: "Published", max: 50 }], assessmentId: 1, score: 0 };
  assert.equal(validateAssessmentGrade(valid), "");
  for (const score of ["", " ", -1, 51, NaN]) assert.ok(validateAssessmentGrade({ ...valid, score }));
  assert.ok(validateAssessmentGrade({ ...valid, target: "other" }));
});
