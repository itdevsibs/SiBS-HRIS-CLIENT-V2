export function createBirthdayLoginEvent({ sequence, user, issuedAt = Date.now() }) {
  const userId = String(user?.gy_emp_id || user?.sibs_id || "").trim();
  if (!userId) return null;
  return {
    id: `birthday-login-${sequence}`,
    userId,
    issuedAt,
  };
}
