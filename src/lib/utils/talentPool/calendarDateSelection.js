function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function resolveCalendarSelectionChange({
  selectedDate,
  displayDate,
  nextMonth,
  nextYear,
}) {
  const baseDate =
    selectedDate instanceof Date && !Number.isNaN(selectedDate.getTime())
      ? selectedDate
      : displayDate;
  const fallbackDate =
    displayDate instanceof Date && !Number.isNaN(displayDate.getTime())
      ? displayDate
      : new Date();

  const targetYear = Number(
    nextYear ?? baseDate?.getFullYear() ?? fallbackDate.getFullYear(),
  );
  const targetMonth = Number(
    nextMonth ?? baseDate?.getMonth() ?? fallbackDate.getMonth(),
  );
  const targetDay = baseDate?.getDate() ?? 1;
  const clampedDay = Math.min(
    targetDay,
    getDaysInMonth(targetYear, targetMonth),
  );

  return new Date(targetYear, targetMonth, clampedDay);
}
