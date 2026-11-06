import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildOnboardingRoster, filterOnboardingRoster } from "./onboardingRoster.js";

describe("combined onboarding roster", () => {
  it("does not let email override an explicit employee link or resolve ambiguous email matches", () => {
    const records = [{ id: 1, convertedEmployeeId: "E-2", candidateEmail: "shared@example.test" }];
    const journeys = [{ id: "J-1", sibsEmployeeId: "E-1", email: "shared@example.test" }, { id: "J-2", sibsEmployeeId: "E-2" }];
    assert.equal(buildOnboardingRoster(records, journeys)[0].journey.id, "J-2");
    assert.equal(buildOnboardingRoster([{ id: 2, candidateEmail: "shared@example.test" }], [journeys[0], { ...journeys[0], id: "J-3" }])[0].journey, undefined);
  });
  const journey = { id: "J-1", sibsEmployeeId: "E-1", fullName: "Alex Cruz", email: "alex@example.test", account: "Support", trainerName: "Trainer A", daysElapsed: 30, day30Handoff: { status: "Submitted" } };

  it("joins the same candidate once and preserves the original record for actions", () => {
    const record = { id: 12, candidateName: "Alex Cruz", candidateEmail: "ALEX@example.test", finalOutcome: "True Hire" };
    const rows = buildOnboardingRoster([record], [journey]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].record, record);
    assert.equal(rows[0].journey, journey);
    assert.equal(rows[0].handoffDue, true);
  });

  it("does not join people only because they have the same name or empty identifiers", () => {
    const rows = buildOnboardingRoster([{ id: 12, candidateName: "Alex Cruz" }], [{ ...journey, email: "" }]);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].journey, undefined);
  });

  it("matches explicit employee IDs and leaves standalone journey outcomes unset", () => {
    const record = { id: 12, convertedEmployeeId: "E-1" };
    assert.equal(buildOnboardingRoster([record], [journey]).length, 1);
    const [row] = buildOnboardingRoster([], [journey]);
    assert.equal(row.outcome, "");
    assert.equal(row.record, undefined);
  });

  it("combines search, trainer, and handoff filters without changing source data", () => {
    const rows = buildOnboardingRoster([], [journey, { ...journey, id: "J-2", sibsEmployeeId: "E-2", trainerName: "Trainer B", day30Handoff: { status: "Accepted" } }]);
    assert.equal(filterOnboardingRoster(rows, { search: "e-1", trainer: "Trainer A", action: "handoff" }).length, 1);
    assert.equal(filterOnboardingRoster(rows, { outcome: "True Hire" }).length, 0);
    assert.equal(filterOnboardingRoster(rows, { action: "handoff" }).length, 1);
    assert.equal(journey.day30Handoff.status, "Submitted");
    assert.deepEqual(buildOnboardingRoster(), []);
  });
});
