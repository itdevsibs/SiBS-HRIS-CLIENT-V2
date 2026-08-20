import test from "node:test";
import assert from "node:assert/strict";
import { parseTalentPoolResumeFilename } from "./talentPoolResume.js";

test("parses a quoted PDF response filename", () => {
  assert.equal(
    parseTalentPoolResumeFilename(
      'inline; filename="Ana_Santos_SiBS_Profile.pdf"',
      "Candidate_SiBS_Profile.pdf",
    ),
    "Ana_Santos_SiBS_Profile.pdf",
  );
});

test("parses an unquoted PDF response filename", () => {
  assert.equal(
    parseTalentPoolResumeFilename(
      "inline; filename=Ana_Santos_SiBS_Profile.pdf",
      "Candidate_SiBS_Profile.pdf",
    ),
    "Ana_Santos_SiBS_Profile.pdf",
  );
});

test("parses UTF-8 encoded filename", () => {
  assert.equal(
    parseTalentPoolResumeFilename(
      "inline; filename*=UTF-8''Ana_Santos_SiBS_Profile.pdf",
      "Candidate_SiBS_Profile.pdf",
    ),
    "Ana_Santos_SiBS_Profile.pdf",
  );
});

test("uses a safe fallback for missing or invalid response filenames", () => {
  assert.equal(
    parseTalentPoolResumeFilename("", "Candidate_SiBS_Profile.pdf"),
    "Candidate_SiBS_Profile.pdf",
  );
  assert.equal(
    parseTalentPoolResumeFilename(
      'inline; filename="../../bad.txt"',
      "Candidate_SiBS_Profile.pdf",
    ),
    "Candidate_SiBS_Profile.pdf",
  );
  assert.equal(
    parseTalentPoolResumeFilename(
      'inline; filename="something.exe"',
      "Candidate_SiBS_Profile.pdf",
    ),
    "Candidate_SiBS_Profile.pdf",
  );
});
