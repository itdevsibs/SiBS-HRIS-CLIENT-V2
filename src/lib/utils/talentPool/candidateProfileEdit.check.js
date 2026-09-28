import test from "node:test";
import assert from "node:assert/strict";
import {
  getTalentPoolEditableSectionLabel,
  getTalentPoolCandidateEditValidationError,
  updateTalentPoolCandidateEducationDetails,
} from "./candidateProfileEdit.js";

test("maps candidate data tabs to the draft save-bar labels", () => {
  assert.equal(getTalentPoolEditableSectionLabel("personal.basic"), "Basic Information");
  assert.equal(getTalentPoolEditableSectionLabel("application.overview"), "Application Overview");
  assert.equal(getTalentPoolEditableSectionLabel("application.readiness"), "Application Readiness");
  assert.equal(getTalentPoolEditableSectionLabel("training"), "Education & Training");
  assert.equal(getTalentPoolEditableSectionLabel("application.readiness"), "Application Readiness");
  assert.equal(getTalentPoolEditableSectionLabel("training"), "Education & Training");
  assert.equal(getTalentPoolEditableSectionLabel("experience"), "Work Experience");
  assert.equal(getTalentPoolEditableSectionLabel("skills.skills"), "Skills & Language");
  assert.equal(getTalentPoolEditableSectionLabel("answers"), "Application Responses");
  assert.equal(getTalentPoolEditableSectionLabel("notes"), "Candidate Notes");
});

test("keeps workflow and audit tabs read-only", () => {
  assert.equal(getTalentPoolEditableSectionLabel("application.pipeline"), null);
  assert.equal(getTalentPoolEditableSectionLabel("personal.ids"), null);
  assert.equal(getTalentPoolEditableSectionLabel("application.history"), null);
  assert.equal(getTalentPoolEditableSectionLabel("movement-history"), null);
  assert.equal(getTalentPoolEditableSectionLabel("documents.vault"), null);
});

test("edit validation requires only the server-required identity fields", () => {
  assert.equal(
    getTalentPoolCandidateEditValidationError({ firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" }),
    "",
  );
  assert.match(
    getTalentPoolCandidateEditValidationError({ firstName: "Ada", lastName: "Lovelace", email: "" }),
    /first name, last name, and email/i,
  );
});

test("editing one education field preserves the other school records and fields", () => {
  const current = {
    elementary: { schoolName: "Old Elementary", address: "Davao City" },
    highSchool: { schoolName: "North High", schoolYearGraduated: "2020-2021" },
  };

  const updated = updateTalentPoolCandidateEducationDetails(
    current,
    "elementary",
    "schoolName",
    "New Elementary",
  );

  assert.deepEqual(updated, {
    elementary: { schoolName: "New Elementary", address: "Davao City" },
    highSchool: { schoolName: "North High", schoolYearGraduated: "2020-2021" },
  });
  assert.equal(current.elementary.schoolName, "Old Elementary");
});
