import assert from "node:assert/strict";
import test from "node:test";
import { createBirthdayCelebrationClaimer } from "./claimBirthdayCelebration.js";

test("returns the server show decision with non-critical request options", async () => {
  const calls = [];
  const claim = createBirthdayCelebrationClaimer({
    async post(url, body, config) {
      calls.push({ url, body, config });
      return { data: { success: true, show: true } };
    },
  });
  assert.deepEqual(await claim(), { success: true, show: true });
  assert.equal(calls[0].url, "/api/users/me/birthday-celebration/claim");
  assert.equal(calls[0].config.skipAuthRedirect, true);
  assert.equal(calls[0].config.timeout, 3500);
});

test("fails closed when the request fails", async () => {
  const claim = createBirthdayCelebrationClaimer({
    async post() { throw new Error("offline"); },
  });
  assert.deepEqual(await claim(), { success: false, show: false });
});
