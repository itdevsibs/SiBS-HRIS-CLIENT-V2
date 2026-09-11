export function sanitizeMiddleName(value) {
  const cleaned = String(value ?? "").trim();

  if (
    /^n\s*(?:\/|\.)\s*a\.?$/i.test(cleaned) ||
    /^not\s+applicable$/i.test(cleaned)
  ) {
    return "";
  }

  return cleaned;
}

export function sanitizeDisplayFullName(value) {
  const cleaned = String(value ?? "").trim();
  if (!cleaned) return "";

  return cleaned
    .replace(/(^|[\s,])n\s*(?:\/|\.)\s*a\.?(?=$|[\s,])/gi, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,+/g, ",")
    .replace(/,\s*$/g, "")
    .trim();
}

export function sanitizeEmployeeNameFields(employee = {}) {
  if (!employee || typeof employee !== "object") return employee;

  const rawMiddleName =
    employee.middleName ??
    employee.middle_name ??
    employee.gy_emp_mname ??
    "";
  const middleName = sanitizeMiddleName(rawMiddleName);

  const next = {
    ...employee,
    middleName,
  };

  if ("middle_name" in employee) next.middle_name = middleName;
  if ("gy_emp_mname" in employee) next.gy_emp_mname = middleName;

  for (const key of ["fullName", "full_name", "gy_emp_fullname", "name"]) {
    if (key in next && next[key] != null) {
      next[key] = sanitizeDisplayFullName(next[key]);
    }
  }

  return next;
}
