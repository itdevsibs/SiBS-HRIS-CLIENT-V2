function isVisibleToAccess(item, adminAccess) {
  return !item.allowedUsers || item.allowedUsers.includes(adminAccess);
}

export function getVisibleSidebarGroups(groups, adminAccess) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => isVisibleToAccess(item, adminAccess)),
    }))
    .filter((group) => group.items.length > 0);
}

export function isSidebarGroupActive(group, pathname) {
  return group.items.some(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  );
}

export function hasSidebarGroupAttention(group, notifications = {}) {
  return group.items.some((item) => {
    if (String(item.badge || "").trim()) return true;

    const notification =
      notifications[item.alertNotificationKey] ||
      notifications[item.notificationKey];

    return Number(notification?.count || 0) > 0;
  });
}

export function isSidebarGroupOpen(
  group,
  pathname,
  openGroupIds = {},
  closedActiveGroup = null,
) {
  if (!isSidebarGroupActive(group, pathname)) {
    return Boolean(openGroupIds[group.id]);
  }

  return !(
    closedActiveGroup?.groupId === group.id &&
    closedActiveGroup?.pathname === pathname
  );
}
