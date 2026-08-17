import assert from "node:assert/strict";
import test from "node:test";
import {
  isBirthdayCelebrationRoute,
  isPossibleBirthday,
} from "./birthdayCelebration.js";

test("prechecks against the Asia/Manila date", () => {
  assert.equal(
    isPossibleBirthday("1990-08-17", new Date("2026-08-16T16:30:00.000Z")),
    true,
  );
  assert.equal(
    isPossibleBirthday("1990-08-18", new Date("2026-08-16T16:30:00.000Z")),
    false,
  );
});

test("uses February 28 for leap-day birthdays in non-leap years", () => {
  assert.equal(
    isPossibleBirthday("1992-02-29", new Date("2026-02-27T16:30:00.000Z")),
    true,
  );
});

test("rejects login and public paths", () => {
  assert.equal(isBirthdayCelebrationRoute("/login"), false);
  assert.equal(isBirthdayCelebrationRoute("/public/offer-response/token"), false);
  assert.equal(isBirthdayCelebrationRoute("/dashboard/employee"), true);
  assert.equal(isBirthdayCelebrationRoute("/recruitment/candidate-pipeline"), true);
});
