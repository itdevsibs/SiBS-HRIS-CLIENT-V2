/** Only accept the current balance returned by the verified Kronos employee lookup. */
export function normalizeVerifiedPersonalBalance(response, sibsId) {
  const expected = String(sibsId ?? "").trim();
  const payload = response?.data;
  if (!expected || response?.success !== true || payload?.available !== true ||
      String(payload.gy_emp_code ?? "").trim() !== expected ||
      payload.source !== "gy_employee") return null;

  // Zero is a real balance. Negative credits may also be valid in Kronos.
  // Null, undefined, or empty must never be converted to zero.
  if (payload.total_leave_credits == null || String(payload.total_leave_credits).trim() === "" ||
      payload.leave_remaining == null || String(payload.leave_remaining).trim() === "") return null;
  const credits = Number(payload.total_leave_credits);
  const remaining = Number(payload.leave_remaining);
  if (!Number.isFinite(credits) || !Number.isFinite(remaining) || credits !== remaining) return null;
  // Kronos employee detail does not provide aggregate plotted leave credits.
  return { total_leave_credits: credits, total_plotted_leaves: null,
    leave_remaining: remaining, snapshot_date: null };
}
