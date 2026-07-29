export function normalizeEmployeeRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function canEditProfileDetails(user) {
  const access = Number(
    user?.admin_access ??
      user?.adminAccess ??
      user?.access ??
      user?.gy_user_access ??
      user?.gyUserAccess ??
      0,
  );

  const roles = [
    user?.role,
    user?.tokenType,
    user?.userRole,
    user?.accountType,
    user?.user_type,
    user?.gy_user_type,
  ].map(normalizeEmployeeRole);

  return (
    (access >= 1 && access <= 7) ||
    roles.some((role) =>
      [
        "admin",
        "hr",
        "hr_admin",
        "hradmin",
        "super_admin",
        "superadmin",
        "super_administrator",
      ].includes(role),
    )
  );
}
