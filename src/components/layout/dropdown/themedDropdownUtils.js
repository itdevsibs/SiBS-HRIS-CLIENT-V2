export function getThemedDropdownOptionLabel(option) {
  if (typeof option !== "object" || option === null) return String(option || "");

  return (
    option.label ||
    option.name ||
    option.gy_acc_name ||
    option.name_department ||
    option.account ||
    option.department ||
    option.fullName ||
    option.employeeName ||
    ""
  );
}

export function getThemedDropdownOptionValue(option) {
  if (typeof option !== "object" || option === null) return String(option || "");

  return (
    option.value ||
    option.id ||
    option.accountId ||
    option.account_id ||
    option.gy_acc_id ||
    option.departmentId ||
    option.department_id ||
    option.id_department ||
    option.sibsId ||
    option.sibs_id ||
    getThemedDropdownOptionLabel(option)
  );
}
