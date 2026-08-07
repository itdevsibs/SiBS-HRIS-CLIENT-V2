import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizePhoneNumberForSubmit,
  normalizePhoneNumberInput,
} from "./phoneNumber.js";

test("normalizes phone input to digits capped at 11 characters", () => {
  assert.equal(normalizePhoneNumberInput("0917-123-456789"), "09171234567");
});

test("normalizes submitted phone values to the same 11-character limit", () => {
  assert.equal(normalizePhoneNumberForSubmit("0999123456789"), "09991234567");
});

test("removes non-phone characters from phone input", () => {
  assert.equal(normalizePhoneNumberInput("CALL ME"), "");
});
