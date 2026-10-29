// Keep legacy Kronos schedule updates out of the HRIS notification bell.
// Other notifications, including interview scheduling, remain visible.
export function isScheduleUpdatedNotification(notification = {}) {
  const title = String(notification?.title ?? "").trim().toLowerCase();
  const moduleName = String(notification?.module ?? "").trim().toLowerCase();
  const action = String(notification?.action ?? "").trim().toUpperCase();

  return (
    title === "schedule updated" ||
    title === "employee schedule updated" ||
    (moduleName === "schedule" && action === "UPDATE")
  );
}
