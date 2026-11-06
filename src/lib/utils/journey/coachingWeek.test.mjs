import { it } from "node:test";
import assert from "node:assert/strict";
import { inCoachingWeek } from "./coachingWeek.js";
it("counts only the Monday–Sunday week containing the selected date", () => {
  assert.equal(inCoachingWeek("2026-11-02", "2026-11-05"), true);
  assert.equal(inCoachingWeek("2026-11-08", "2026-11-05"), true);
  assert.equal(inCoachingWeek("2026-11-01", "2026-11-05"), false);
  assert.equal(inCoachingWeek("2026-11-09", "2026-11-05"), false);
  assert.equal(inCoachingWeek("invalid", "2026-11-05"), false);
});
