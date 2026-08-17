import assert from "node:assert/strict";
import test from "node:test";
import { shouldPrepareBirthdayCelebration } from "./birthdayCelebrationGatePolicy.js";

const event = { id: "birthday-login-1", userId: "42", issuedAt: 1 };
const user = { gy_emp_id: 42, birthdate: "1990-08-17" };
const now = new Date("2026-08-16T16:30:00.000Z");

test("prepares only an enabled matching interactive login on a private route", () => {
  assert.equal(shouldPrepareBirthdayCelebration({ enabled: true, event, user, pathname: "/dashboard/employee", now }), true);
  assert.equal(shouldPrepareBirthdayCelebration({ enabled: false, event, user, pathname: "/dashboard/employee", now }), false);
  assert.equal(shouldPrepareBirthdayCelebration({ enabled: true, event: null, user, pathname: "/dashboard/employee", now }), false);
  assert.equal(shouldPrepareBirthdayCelebration({ enabled: true, event, user, pathname: "/login", now }), false);
});

test("rejects an event for a different authenticated identity", () => {
  assert.equal(shouldPrepareBirthdayCelebration({ enabled: true, event, user: { ...user, gy_emp_id: 99 }, pathname: "/dashboard/employee", now }), false);
});
