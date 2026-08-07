import assert from "node:assert/strict";
import test from "node:test";
import { resolveCalendarSelectionChange } from "./calendarDateSelection.js";

test("keeps the selected day active when changing the year", () => {
  const nextDate = resolveCalendarSelectionChange({
    selectedDate: new Date(2008, 7, 13),
    displayDate: new Date(2008, 7, 1),
    nextYear: 2005,
  });

  assert.equal(nextDate.getFullYear(), 2005);
  assert.equal(nextDate.getMonth(), 7);
  assert.equal(nextDate.getDate(), 13);
});

test("keeps the selected day active when changing the month", () => {
  const nextDate = resolveCalendarSelectionChange({
    selectedDate: new Date(2008, 7, 13),
    displayDate: new Date(2008, 7, 1),
    nextMonth: 3,
  });

  assert.equal(nextDate.getFullYear(), 2008);
  assert.equal(nextDate.getMonth(), 3);
  assert.equal(nextDate.getDate(), 13);
});

test("clamps selected day when the target month has fewer days", () => {
  const nextDate = resolveCalendarSelectionChange({
    selectedDate: new Date(2008, 0, 31),
    displayDate: new Date(2008, 0, 1),
    nextMonth: 1,
  });

  assert.equal(nextDate.getFullYear(), 2008);
  assert.equal(nextDate.getMonth(), 1);
  assert.equal(nextDate.getDate(), 29);
});
