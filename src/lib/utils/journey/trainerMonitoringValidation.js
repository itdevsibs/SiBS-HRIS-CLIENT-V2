export function visibleTrainerJourneys(journeys, user) {
  if (user?.role !== "Trainer") return journeys;
  const names = [user.trainerName, user.name].filter(Boolean).map((name) => name.trim().toLowerCase());
  return journeys.filter((journey) => names.includes(journey.trainerName?.trim().toLowerCase()));
}

export function validateQdsRequest({ trainees, target, type, notes, due }) {
  if (!target || !trainees.some((item) => (item.sibsEmployeeId || item.id) === target)) return "Select a trainee from the current cohort.";
  if (!["Trainer coaching review", "Independent QA recheck", "Targeted trainee support"].includes(type)) return "Select a request type.";
  if (!String(notes || "").trim()) return "Enter observation and instructions.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due || "") || Number.isNaN(Date.parse(due))) return "Select a valid due date.";
  return "";
}

export function validateAssessmentGrade({ trainees, target, assessments, assessmentId, score }) {
  if (!target || !trainees.some((item) => (item.sibsEmployeeId || item.id) === target)) return "Select a trainee from the current cohort.";
  const assessment = assessments.find((item) => item.id === assessmentId && item.status === "Published");
  if (!assessment) return "Select a published assessment.";
  if (String(score).trim() === "" || !Number.isFinite(Number(score)) || Number(score) < 0 || Number(score) > Number(assessment.max)) return `Enter a score between 0 and ${assessment.max} points.`;
  return "";
}
