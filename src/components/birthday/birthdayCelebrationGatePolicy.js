import {
  isBirthdayCelebrationRoute,
  isPossibleBirthday,
} from "../../lib/utils/birthdayCelebration.js";

export function shouldPrepareBirthdayCelebration({
  enabled = true,
  event,
  user,
  pathname,
  now = new Date(),
}) {
  if (!enabled || !event || !user) return false;
  const userId = String(user.gy_emp_id || user.sibs_id || "").trim();
  if (!userId || userId !== event.userId) return false;
  if (!isBirthdayCelebrationRoute(pathname)) return false;
  return isPossibleBirthday(user.birthdate, now);
}
