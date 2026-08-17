import assert from "node:assert/strict";
import test from "node:test";
import { createBirthdayLoginEvent } from "./birthdayLoginEvent.js";

test("creates an opaque event without DOB or employee name", () => {
  const event = createBirthdayLoginEvent({
    sequence: 3,
    user: { gy_emp_id: 42, firstName: "Ana", birthdate: "1990-08-17" },
    issuedAt: 1000,
  });
  assert.deepEqual(event, { id: "birthday-login-3", userId: "42", issuedAt: 1000 });
  assert.equal("birthdate" in event, false);
  assert.equal("firstName" in event, false);
});
