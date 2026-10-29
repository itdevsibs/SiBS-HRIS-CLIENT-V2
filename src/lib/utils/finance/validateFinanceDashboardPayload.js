/**
 * The Finance summary cards and grouped table must describe the same snapshot.
 * Never show inconsistent cached or freshly returned aggregates as facts.
 */
export const FINANCE_RECONCILED_DATA_VERSION = "finance-reconciled-v3";

const keys = ["sss", "philHealth", "pagIbig", "tin"];
const numeric = (value) => Number.isSafeInteger(Number(value)) && Number(value) >= 0;

export function validateFinanceDashboardPayload(payload) {
  const metrics = payload?.metrics;
  const rows = payload?.accounts;
  if (payload?.dataVersion !== FINANCE_RECONCILED_DATA_VERSION ||
      !metrics || !Array.isArray(rows)) {
    throw new Error("Finance dashboard requires the updated reconciled Server response. Restart HRIS Server.");
  }

  const fields = ["activeEmployees", "payrollReady", "incompleteProfiles"];
  const totals = Object.fromEntries(fields.map((field) => [field, 0]));
  const benefitTotals = Object.fromEntries(keys.map((key) => [key, 0]));
  const activeAccounts = new Set();
  const activeDepartments = new Set();

  for (const row of rows) {
    if (fields.some((field) => !numeric(row?.[field])) ||
        Number(row.activeEmployees) !== Number(row.payrollReady) + Number(row.incompleteProfiles)) {
      throw new Error("Finance account rows contain inconsistent employee counts.");
    }
    for (const field of fields) totals[field] += Number(row[field]);
    const account = String(row.account ?? "").trim();
    const department = String(row.department ?? "").trim();
    if (account && account !== "Unassigned") activeAccounts.add(account);
    if (department && department !== "Unassigned") activeDepartments.add(department);
    for (const key of keys) {
      const benefit = row?.statutoryCoverage?.[key];
      if (!numeric(benefit?.count) || !numeric(benefit?.missing) ||
          Number(benefit.count) + Number(benefit.missing) !== Number(row.activeEmployees)) {
        throw new Error("Finance account statutory coverage does not reconcile.");
      }
      benefitTotals[key] += Number(benefit.count);
    }
  }
  if (fields.some((field) => !numeric(metrics[field]) || Number(metrics[field]) !== totals[field]) ||
      !numeric(metrics.activeAccounts) || Number(metrics.activeAccounts) !== activeAccounts.size ||
      !numeric(metrics.activeDepartments) || Number(metrics.activeDepartments) !== activeDepartments.size ||
      (payload.accountDepartmentGroupCount !== undefined &&
        Number(payload.accountDepartmentGroupCount) !== rows.length)) {
    throw new Error("Finance dashboard totals do not match the account/department table. Refresh required.");
  }
  for (const key of keys) {
    const benefit = metrics?.statutoryCoverage?.[key];
    if (!numeric(benefit?.count) || !numeric(benefit?.missing) ||
        Number(benefit.count) !== benefitTotals[key] ||
        Number(benefit.count) + Number(benefit.missing) !== totals.activeEmployees) {
      throw new Error("Finance statutory summary does not match the account/department table.");
    }
  }
  return payload;
}
