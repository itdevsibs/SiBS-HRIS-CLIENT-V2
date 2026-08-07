import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeTrainingEntries,
  serializeTrainingEntries,
} from "./trainingEntries.js";

test("normalizes training entries from arrays, JSON strings, and legacy text", () => {
  assert.deepEqual(
    normalizeTrainingEntries(["  Leadership 101 ", "", "Safety Training"]),
    ["LEADERSHIP 101", "SAFETY TRAINING"],
  );

  assert.deepEqual(
    normalizeTrainingEntries('["Compliance"," Product Training "]'),
    ["COMPLIANCE", "PRODUCT TRAINING"],
  );

  assert.deepEqual(
    normalizeTrainingEntries("Excel Basics\nCustomer Service; Data Privacy"),
    ["EXCEL BASICS", "CUSTOMER SERVICE", "DATA PRIVACY"],
  );
});

test("serializes training entries as JSON array text", () => {
  assert.equal(
    serializeTrainingEntries(["  Leadership 101 ", "", "Safety Training"]),
    '["LEADERSHIP 101","SAFETY TRAINING"]',
  );
});
