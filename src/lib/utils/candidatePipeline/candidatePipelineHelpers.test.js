import assert from "node:assert/strict";
import test from "node:test";

import {
  getPipelineStageClass,
  getPipelineStageTheme,
} from "./candidatePipelineStageThemes.js";

test("maps pipeline stages to their semantic workflow phase", () => {
  const expectedPhases = {
    "Initial Screening": "review",
    "Online Assessment": "active",
    "Assessment Fit": "success",
    "Interview Scheduled": "active",
    Interviewed: "success",
    Offered: "pending",
    Accepted: "success",
    "For NHO": "handoff",
    "Drop-off": "negative",
  };

  Object.entries(expectedPhases).forEach(([stage, expectedPhase]) => {
    assert.equal(getPipelineStageTheme(stage).phase, expectedPhase);
  });
});

test("uses the canonical stage theme for every stage pill", () => {
  [
    "Initial Screening",
    "Online Assessment",
    "Assessment Fit",
    "Interview Scheduled",
    "Interviewed",
    "Offered",
    "Accepted",
    "For NHO",
    "Drop-off",
    "Unknown Stage",
  ].forEach((stage) => {
    assert.equal(
      getPipelineStageClass(stage),
      getPipelineStageTheme(stage).pill,
    );
  });
});
