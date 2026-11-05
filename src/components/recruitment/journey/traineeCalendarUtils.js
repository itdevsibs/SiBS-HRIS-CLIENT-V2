function addCalendarDays(date, days) {
  const parsed = /* @__PURE__ */ new Date(date + "T12:00:00Z");
  if (Number.isNaN(parsed.getTime())) return date;
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}
function trainingDateBounds(startDate, simulatedDate) {
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return { min: simulatedDate, max: simulatedDate, linked: false };
  }
  return { min: startDate, max: addCalendarDays(startDate, 89), linked: true };
}
const dateWithinBounds = (date, bounds) => /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= bounds.min && date <= bounds.max;
const clampTrainingDate = (date, bounds) => dateWithinBounds(date, bounds) ? date : date < bounds.min ? bounds.min : bounds.max;
const clampCalendarMonth = (month, bounds) => month < bounds.min.slice(0, 7) ? bounds.min.slice(0, 7) : month > bounds.max.slice(0, 7) ? bounds.max.slice(0, 7) : month;
function moveCalendarMonth(month, delta) {
  const [year, m] = month.split("-").map(Number);
  if (!year || !m || m < 1 || m > 12) return month;
  return new Date(Date.UTC(year, m - 1 + delta, 1, 12)).toISOString().slice(0, 7);
}
function calendarMonthCells(month) {
  const [year, m] = month.split("-").map(Number);
  const firstWeekday = (new Date(Date.UTC(year, m - 1, 1)).getUTCDay() + 6) % 7;
  const lastDay = new Date(Date.UTC(year, m, 0)).getUTCDate();
  return Array.from({ length: Math.ceil((firstWeekday + lastDay) / 7) * 7 }, (_, idx) => {
    const day = idx - firstWeekday + 1;
    return day < 1 || day > lastDay ? null : `${month}-${String(day).padStart(2, "0")}`;
  });
}
const trainerForTask = (assignment, cohortTrainer) => assignment?.trainer?.trim() || cohortTrainer?.trim() || null;
function trainersForDay(items, cohortTrainer) {
  const explicit = items.length > 0 && items.every((item) => !!item.trainer?.trim());
  const names = Array.from(new Set(items.map((item) => trainerForTask(item, cohortTrainer)).filter((x) => !!x)));
  return { names: names.length ? names : cohortTrainer ? [cohortTrainer] : [], explicit };
}
function phaseOwnerForDay(startDate, date, trainer, teamLeader) {
  if (!startDate || date < startDate) return { phase: "Not started", owner: null };
  const elapsed = Math.floor((Date.parse(date + "T12:00:00Z") - Date.parse(startDate + "T12:00:00Z")) / 864e5) + 1;
  return elapsed <= 14 ? { phase: "FST \xB7 Days 1\u201314", owner: trainer || null } : elapsed <= 28 ? { phase: "PST \xB7 Days 15\u201328", owner: teamLeader || null } : { phase: `Supported journey \xB7 Day ${elapsed}`, owner: teamLeader || null };
}
function canCreateTrainingAssignment(role, actorTrainer, traineeTrainer, date, bounds, simulatedDate, finalOutcome) {
  if (!bounds.linked || !!finalOutcome || !dateWithinBounds(date, bounds) || date < simulatedDate || date > addCalendarDays(bounds.min, 89)) return false;
  const elapsed = Math.floor((Date.parse(date + "T12:00:00Z") - Date.parse(bounds.min + "T12:00:00Z")) / 864e5) + 1;
  if (role === "HR Admin" || role === "Super Admin") return true;
  if (role === "Trainer") return elapsed <= 14 && !!actorTrainer && actorTrainer === traineeTrainer;
  return (role === "Team Leader" || role === "Manager") && elapsed > 14;
}
export {
  addCalendarDays,
  calendarMonthCells,
  canCreateTrainingAssignment,
  clampCalendarMonth,
  clampTrainingDate,
  dateWithinBounds,
  moveCalendarMonth,
  phaseOwnerForDay,
  trainerForTask,
  trainersForDay,
  trainingDateBounds
};
