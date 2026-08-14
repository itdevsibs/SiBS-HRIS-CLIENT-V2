import assert from "node:assert/strict";
import test from "node:test";

import { getRequiredPopoverScroll } from "./calendarPositioning.js";

test("scrolls only by the amount a calendar would overflow below the viewport", () => {
  assert.equal(
    getRequiredPopoverScroll({
      anchorBottom: 400,
      popoverHeight: 367,
      viewportHeight: 768,
      gap: 6,
      viewportMargin: 12,
    }),
    17,
  );

  assert.equal(
    getRequiredPopoverScroll({
      anchorBottom: 300,
      popoverHeight: 367,
      viewportHeight: 768,
      gap: 6,
      viewportMargin: 12,
    }),
    0,
  );
});
