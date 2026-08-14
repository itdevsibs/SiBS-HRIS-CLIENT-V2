export function normalizeEmployeeRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getEmployeeAdminAccess(user) {
  return Number(
    user?.admin_access ??
      user?.adminAccess ??
      user?.access ??
      user?.gy_user_access ??
      user?.gyUserAccess ??
      0,
  );
}

export function canEditProfileDetails(user) {
  const access = getEmployeeAdminAccess(user);

  if ([2, 3, 7].includes(access)) {
    return true;
  }

  const roles = [
    user?.role,
    user?.userRole,
    user?.accountType,
    user?.user_type,
    user?.gy_user_type,
  ].map(normalizeEmployeeRole);

  return roles.some((role) =>
    [
      "hr",
      "hr_admin",
      "hradmin",
      "super_admin",
      "superadmin",
      "super_administrator",
    ].includes(role),
  );
}
