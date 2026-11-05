export function inCoachingWeek(date, asOf) {
  const end = new Date(`${asOf}T12:00:00Z`);
  const current = new Date(`${date}T12:00:00Z`);
  if (!Number.isFinite(+end) || !Number.isFinite(+current)) return false;
  const offset = (end.getUTCDay() + 6) % 7;
  end.setUTCDate(end.getUTCDate() - offset);
  const start = end.toISOString().slice(0, 10);
  end.setUTCDate(end.getUTCDate() + 6);
  return date >= start && date <= end.toISOString().slice(0, 10);
}
