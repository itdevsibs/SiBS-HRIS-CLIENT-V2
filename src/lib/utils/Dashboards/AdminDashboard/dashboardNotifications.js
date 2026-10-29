/**
 * HR dashboard notifications share the Leaves sidebar's authenticated count.
 * Never reintroduce a different/global pending-leave figure from a cached feed.
 * A missing sidebar notification means unavailable, dismissed, or no pending
 * records; it must not be interpreted as a verified zero or replaced by a
 * stale dashboard value.
 */
export function buildScopedDashboardNotifications({
  dashboardNotifications = [],
  sidebarNotifications = [],
  icons = {},
} = {}) {
  const dashboardItems = (Array.isArray(dashboardNotifications) ? dashboardNotifications : [])
    .filter((item) =>
      item?.id !== "pending-leaves" &&
      item?.id !== "notif-leaves-pending" &&
      item?.title !== "Pending Leave Requests",
    )
    .map((item) => ({
      ...item,
      icon: icons[item.icon] || icons.info,
    }));

  const scopedLeave = (Array.isArray(sidebarNotifications) ? sidebarNotifications : [])
    .find((item) => item?.id === "notif-leaves-pending");
  if (!scopedLeave) return dashboardItems;

  return [{
    id: scopedLeave.id,
    type: "action",
    icon: icons.leave || icons.info,
    title: scopedLeave.title,
    message: scopedLeave.message,
    time: scopedLeave.time || "Current",
    actionLabel: "Open Leaves",
    path: scopedLeave.actionPath || "/leaves",
    actionState: scopedLeave.actionState,
  }, ...dashboardItems];
}
