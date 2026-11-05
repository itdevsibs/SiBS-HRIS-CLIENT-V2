import api from "./api-template";

/**
 * Return the current Manila week and five preceding weeks, through today.
 */
export function getDefaultAttritionDateRange() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  const todayKey = `${get("year")}-${get("month")}-${get("day")}`;
  const to = new Date(`${todayKey}T00:00:00.000Z`);
  const mondayOffset = (to.getUTCDay() + 6) % 7;
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - mondayOffset - 35);

  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: todayKey,
  };
}

/**
 * Fetch filter reference options for Attrition Reports:
 * clusters, accounts, departments, reporting periods.
 */
export async function getAttritionFilterOptions(signal) {
  const response = await api.get("/api/attrition-reports/filter-options", {
    signal,
    timeout: 20000,
  });
  return response.data;
}

/**
 * Fetch workforce attrition summary KPIs, trends, by-account rankings,
 * and recruitment-stage drop-off analytics.
 */
export async function getAttritionSummary(params = {}, signal) {
  const cleanParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      cleanParams[key] = value;
    }
  }

  const response = await api.get("/api/attrition-reports/summary", {
    params: cleanParams,
    signal,
    timeout: 30000,
  });
  return response.data;
}

/**
 * Fetch paginated detailed employee separation records from Kronos + HRIS.
 */
export async function getAttritionRecords(params = {}, signal) {
  const cleanParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      cleanParams[key] = value;
    }
  }

  const response = await api.get("/api/attrition-reports/records", {
    params: cleanParams,
    signal,
    timeout: 30000,
  });
  return response.data;
}

/**
 * Trigger CSV export download for current filtered scope.
 */
export async function downloadAttritionReportCsv(params = {}) {
  const cleanParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      cleanParams[key] = value;
    }
  }

  const response = await api.get("/api/attrition-reports/export", {
    params: cleanParams,
    responseType: "blob",
    timeout: 45000,
  });

  const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const period = params.period || "last_6_weeks";
  const dateStr = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.setAttribute("download", `sibs-attrition-report-${period}-${dateStr}.csv`);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
  return true;
}
