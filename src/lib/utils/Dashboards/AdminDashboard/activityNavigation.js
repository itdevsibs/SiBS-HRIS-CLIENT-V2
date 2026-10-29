// Keep HR activity navigation aligned with the Leaves notification deep link.
// In particular, clearing the date range is necessary for future-dated and
// older requests that cannot appear in the default seven-day Leaves view.
export function normalizeActivityLeaveStatus(value) {
  const status = String(value ?? "").trim().toLowerCase();
  if (["1", "approved", "approve"].includes(status)) return "Approved";
  if (["2", "rejected", "declined", "not approved", "not_approved"].includes(status)) {
    return "Rejected";
  }
  return "Pending";
}

export function resolveActivityNavigationTarget(entry, { pendingCount } = {}) {
  const pathname = typeof entry?.path === "string" ? entry.path.trim() : "";
  // Only navigate to internal, absolute application paths.
  if (!pathname.startsWith("/") || pathname.startsWith("//") || pathname.includes("\\")) {
    return null;
  }
  if (pathname !== "/leaves" || entry?.type !== "leave") {
    return { pathname };
  }

  const status = normalizeActivityLeaveStatus(entry.leaveStatus);
  const state = {
    // Existing LeavesPage initialization logic recognizes this state shape.
    source: "pending-leave-notification",
    leaveStatus: status,
    allDates: true,
  };

  const verifiedCount = pendingCount == null ? NaN : Number(pendingCount);
  if (status === "Pending" && Number.isSafeInteger(verifiedCount) && verifiedCount >= 0) {
    state.pendingCount = verifiedCount;
  }

  return { pathname: "/leaves", state };
}
