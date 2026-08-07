import assert from "node:assert/strict";
import test from "node:test";

import {
  canRemoveTrainingEntryRow,
  ensureTrainingEntryRows,
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

test("keeps blank editable rows while rendering training inputs", () => {
  assert.deepEqual(ensureTrainingEntryRows(["Product Training", ""]), [
    "Product Training",
    "",
  ]);
});

test("only allows completed training rows before the add row to be removed", () => {
  assert.equal(canRemoveTrainingEntryRow(0, 1), false);
  assert.equal(canRemoveTrainingEntryRow(0, 3), true);
  assert.equal(canRemoveTrainingEntryRow(1, 3), true);
  assert.equal(canRemoveTrainingEntryRow(2, 3), false);
});
