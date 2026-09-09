import { formatLogDetails } from "../SuperAdminDashboard/superAdminDashboardHelpers.js";

export const EMPTY_OVERVIEW = Object.freeze({
  generatedAt: null,
  metrics: {
    employees: 0,
    departments: 0,
    attendancePresent: 0,
    attendanceRate: 0,
    interviewsToday: 0,
    payrollEligible: 0,
  },
  attendance: {
    scheduled: 0,
    present: 0,
    onLeave: 0,
    late: 0,
    absent: 0,
    lastSync: null,
    shifts: [],
  },
  workforceKpi: {
    utilization: 0,
    absenteeismRate: 0,
    absenteeismBuffer: 0,
  },
  recentActivities: [],
  notifications: [],
  notificationCounts: {},
  reports: {
    distribution: [],
    conversion: [],
    forecast: "",
  },
});

const DETAIL_ENDPOINTS = Object.freeze({
  employees: "/api/hr-dashboard/employees",
  departments: "/api/hr-dashboard/departments",
  attendance: "/api/hr-dashboard/attendance",
  interviews: "/api/hr-dashboard/interviews",
  payroll: "/api/hr-dashboard/payroll-eligible",
});

function numberOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getDashboardDetailEndpoint(modalId) {
  return DETAIL_ENDPOINTS[modalId] || "";
}

export function normalizeDashboardOverview(payload = {}) {
  const data = payload?.data && !payload?.metrics ? payload.data : payload;
  const metrics = data?.metrics || {};
  const attendance = data?.attendance || {};
  const workforceKpi = data?.workforceKpi || {};
  const reports = data?.reports || {};

  return {
    generatedAt: data?.generatedAt || null,
    metrics: {
      employees: numberOrZero(metrics.employees),
      departments: numberOrZero(metrics.departments),
      attendancePresent: numberOrZero(metrics.attendancePresent),
      attendanceRate: numberOrZero(metrics.attendanceRate),
      interviewsToday: numberOrZero(metrics.interviewsToday),
      payrollEligible: numberOrZero(metrics.payrollEligible),
    },
    attendance: {
      scheduled: numberOrZero(attendance.scheduled),
      present: numberOrZero(attendance.present),
      onLeave: numberOrZero(attendance.onLeave),
      late: numberOrZero(attendance.late),
      absent: numberOrZero(attendance.absent),
      lastSync: attendance.lastSync || null,
      shifts: Array.isArray(attendance.shifts) ? attendance.shifts : [],
    },
    workforceKpi: {
      utilization: numberOrZero(workforceKpi.utilization),
      absenteeismRate: numberOrZero(workforceKpi.absenteeismRate),
      absenteeismBuffer: numberOrZero(workforceKpi.absenteeismBuffer),
    },
    recentActivities: Array.isArray(data?.recentActivities)
      ? data.recentActivities.map((act) => ({
          ...act,
          details: formatLogDetails(act?.details),
        }))
      : [],
    notifications: Array.isArray(data?.notifications)
      ? data.notifications
      : [],
    notificationCounts:
      data?.notificationCounts && typeof data.notificationCounts === "object"
        ? data.notificationCounts
        : {},
    reports: {
      distribution: Array.isArray(reports.distribution)
        ? reports.distribution
        : [],
      conversion: Array.isArray(reports.conversion) ? reports.conversion : [],
      forecast: String(reports.forecast || ""),
    },
  };
}
