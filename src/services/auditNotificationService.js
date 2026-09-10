const FULL_ACCESS_ROLES = new Set([
  "hr",
  "hr_admin",
  "hradmin",
  "super_admin",
  "superadmin",
  "super_administrator",
]);

const FULL_ACCESS_LEVELS = new Set([2, 3, 7]);
const MANAGER_ROLES = new Set(["manager"]);
const MANAGER_ACCESS_LEVELS = new Set([5]);
const TARGETED_NOTIFICATION_ROLES = new Set([
  "employee",
  "team_leader",
  "teamleader",
  "tl",
  "operations_manager",
  "senior_operations_manager",
  "som",
]);
const TARGETED_NOTIFICATION_ACCESS_LEVELS = new Set([8, 10]);

const RESIGNATION_WORKFLOW_ACTIONS = new Set([
  "RESIGN_SUBMITTED",
  "RESIGN_STATUS",
  "RESIGN_APPROVED",
  "RESIGN_DECLINED",
  "RESIGN_RETAINED",
  "RESIGN_REVIEW",
]);

const IMPORTANT_SUCCESS_ACTIONS = new Set([
  "APPROVE",
  "REJECT",
  "DELETE",
  "RESTORE",
  "STATUS_CHANGE",
  "UPLOAD",
]);

const IMPORTANT_CREATE_UPDATE_MODULES = new Set([
  "employees",
  "employee-profile",
  "users",
  "account-settings",
  "assigned-accounts",
]);

const MANAGER_ALLOWED_MODULES = new Set([
  "employees",
  "employee-profile",
  "attendance",
  "leaves",
  "resignation",
  "attrition",
  "hiring-needs",
  "weekly-hiring-plan",
  "workforce-hiring-plan",
  "approval-request",
  "job-description",
  "available-position",
  "candidate-pipeline",
  "talent-pool",
  "offers",
  "onboarding",
]);

const MODULE_CONFIG = {
  employees: {
    singular: "Employee",
    label: "Employee Records",
    targetPath: "/employee",
  },
  "employee-profile": {
    singular: "Employee Profile",
    label: "Employee Profiles",
    targetPath: "/employee",
  },
  attendance: {
    singular: "Attendance Record",
    label: "Attendance",
    targetPath: "/attendance",
  },
  leaves: {
    singular: "Leave Request",
    label: "Leave Requests",
    targetPath: "/leaves",
  },
  resignation: {
    singular: "Resignation",
    label: "Resignation Management",
    targetPath: "/resignation",
  },
  attrition: {
    singular: "Attrition Record",
    label: "Attrition",
    targetPath: "/resignation",
  },
  "hiring-needs": {
    singular: "Hiring Need",
    label: "Hiring Needs",
    targetPath: "/recruitment/hiring-needs",
  },
  "weekly-hiring-plan": {
    singular: "Hiring Plan",
    label: "Workforce & Hiring Plan",
    targetPath: "/recruitment/workforce-hiring-plan",
  },
  "workforce-hiring-plan": {
    singular: "Hiring Plan",
    label: "Workforce & Hiring Plan",
    targetPath: "/recruitment/workforce-hiring-plan",
  },
  "approval-request": {
    singular: "Approval Request",
    label: "Approval Requests",
    targetPath: "/approval-request",
  },
  "job-description": {
    singular: "Job Description",
    label: "Job Descriptions",
    targetPath: "/recruitment/job-description",
  },
  "available-position": {
    singular: "Available Position",
    label: "Available Positions",
    targetPath: "/recruitment/available-positions",
  },
  "candidate-pipeline": {
    singular: "Candidate Pipeline Record",
    label: "Candidate Pipeline",
    targetPath: "/recruitment/candidate-pipeline",
  },
  "talent-pool": {
    singular: "Talent Pool Record",
    label: "Talent Pool",
    targetPath: "/recruitment/talent-pool",
  },
  offers: {
    singular: "Offer",
    label: "Offers",
    targetPath: "/recruitment/offers",
  },
  onboarding: {
    singular: "Onboarding Record",
    label: "Onboarding",
    targetPath: "/recruitment/onboarding",
  },
  users: {
    singular: "User Access",
    label: "User Access",
    targetPath: "/settings/account-settings",
  },
  "resignation-management": {
    singular: "Resignation",
    label: "Resignation Management",
    targetPath: "/resignation",
  },
  "approval-requests": {
    singular: "Approval Request",
    label: "Approval Requests",
    targetPath: "/approval-request",
  },
  "applicant-leads": {
    singular: "Applicant Lead",
    label: "Applicant Leads",
    targetPath: "/recruitment/applicant-leads",
  },
  "recruitment-settings": {
    singular: "Recruitment Setting",
    label: "Recruitment Settings",
    targetPath: "/recruitment/settings",
  },
  "account-settings": {
    singular: "Account Setting",
    label: "Account Settings",
    targetPath: "/settings/account-settings",
  },
  "assigned-accounts": {
    singular: "Assigned Account",
    label: "Assigned Accounts",
    targetPath: "/settings/account-settings",
  },
};

const ACTION_LABELS = {
  CREATE: { noun: "Created", verb: "created", infinitive: "create", failure: "Create" },
  UPDATE: { noun: "Updated", verb: "updated", infinitive: "update", failure: "Update" },
  DELETE: { noun: "Deleted", verb: "deleted", infinitive: "delete", failure: "Delete" },
  APPROVE: { noun: "Approved", verb: "approved", infinitive: "approve", failure: "Approval" },
  REJECT: { noun: "Rejected", verb: "rejected", infinitive: "reject", failure: "Rejection" },
  RESTORE: { noun: "Restored", verb: "restored", infinitive: "restore", failure: "Restore" },
  STATUS_CHANGE: {
    noun: "Status Changed",
    verb: "changed the status of",
    infinitive: "change the status of",
    failure: "Status Change",
  },
  UPLOAD: {
    noun: "File Uploaded",
    verb: "uploaded a file to",
    infinitive: "upload a file to",
    failure: "Upload",
  },
  LOGIN: { noun: "Login", verb: "logged in to", infinitive: "log in to", failure: "Login" },
  LOGOUT: { noun: "Logout", verb: "logged out of", infinitive: "log out of", failure: "Logout" },
};

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeSibsId(value) {
  const cleaned = cleanText(value);
  if (!cleaned) return "";

  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? String(numeric) : cleaned;
}

function normalizeRole(value) {
  return cleanText(value).toLowerCase().replace(/[\s-]+/g, "_");
}

function getAccessValue(user = {}) {
  const raw =
    user?.adminAccess ??
    user?.admin_access ??
    user?.access ??
    user?.gy_user_access ??
    user?.gyUserAccess ??
    user?.adminLevel ??
    user?.admin_level ??
    0;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getAuditNotificationScope(user = {}) {
  const role = normalizeRole(user?.role || user?.userRole || user?.tokenType);
  const access = getAccessValue(user);

  if (FULL_ACCESS_ROLES.has(role) || FULL_ACCESS_LEVELS.has(access)) {
    return "full";
  }

  if (MANAGER_ROLES.has(role) || MANAGER_ACCESS_LEVELS.has(access)) {
    return "manager";
  }

  if (
    TARGETED_NOTIFICATION_ROLES.has(role) ||
    TARGETED_NOTIFICATION_ACCESS_LEVELS.has(access)
  ) {
    return "targeted";
  }

  return "none";
}

export function canViewAuditNotifications(user = {}) {
  return getAuditNotificationScope(user) !== "none";
}

function normalizeAuditStatus(value) {
  return cleanText(value).toUpperCase();
}

function normalizeAuditAction(value) {
  return cleanText(value).toUpperCase();
}

function normalizeAuditModule(value) {
  return cleanText(value).toLowerCase();
}

export function isNotificationWorthyAuditRow(row = {}) {
  const status = normalizeAuditStatus(row.status);
  const action = normalizeAuditAction(row.action);
  const moduleName = normalizeAuditModule(row.module);

  if (status !== "SUCCESS") return false;

  if (action === "LOGIN" || action === "LOGOUT") return false;

  // Filter out internal auth token refreshes or ping endpoints logged under users/auth
  const endpoint = cleanText(row.endpoint).toLowerCase();
  if (
    endpoint.includes("/refresh") ||
    endpoint.includes("/session") ||
    endpoint.includes("/ping")
  ) {
    return false;
  }

  let changes = row.changes_json;
  if (typeof changes === "string") {
    try {
      changes = JSON.parse(changes);
    } catch {}
  }
  if (changes && typeof changes === "object") {
    if (changes.reason === "server-token-expiring") {
      return false;
    }
  }

  if (IMPORTANT_SUCCESS_ACTIONS.has(action)) return true;

  if (
    moduleName === "resignation" &&
    RESIGNATION_WORKFLOW_ACTIONS.has(action)
  ) {
    return true;
  }

  return (
    (action === "CREATE" || action === "UPDATE") &&
    IMPORTANT_CREATE_UPDATE_MODULES.has(moduleName)
  );
}

function getUserSibsId(user = {}) {
  return cleanText(
    user?.sibsId ||
      user?.sibs_id ||
      user?.employeeSibsId ||
      user?.employee_sibs_id ||
      user?.username ||
      user?.gy_user_code ||
      user?.gy_emp_code ||
      user?.userCode ||
      user?.user_code,
  );
}

function canRowBeShownForScope(row = {}, scope = "none", user = {}) {
  const moduleName = normalizeAuditModule(row.module);
  const action = normalizeAuditAction(row.action);
  const userSibsId = getUserSibsId(user);
  const targetSibsId = cleanText(row.target_sibs_id || row.targetSibsId);
  const isResignationWorkflowNotification =
    moduleName === "resignation" && RESIGNATION_WORKFLOW_ACTIONS.has(action);

  // Resignation workflow notifications are recipient-specific. This prevents
  // employee/approver notifications from leaking into unrelated audit feeds.
  if (isResignationWorkflowNotification) {
    return Boolean(
      userSibsId && targetSibsId && normalizeSibsId(userSibsId) === normalizeSibsId(targetSibsId),
    );
  }

  if (scope === "full") return true;
  if (scope === "targeted") return false;
  if (scope !== "manager") return false;

  if (!MANAGER_ALLOWED_MODULES.has(moduleName)) return false;

  // Authentication/access-control failures are security events reserved for
  // HR/HR Admin/Super Admin. Managers only receive business workflow events.
  if (["users", "account-settings", "assigned-accounts"].includes(moduleName)) {
    return false;
  }

  // The audit table does not carry department/account scope. Until a scoped
  // target is stored, a manager may only see their own business audit events.
  const actorSibsId = cleanText(row.sibs_id || row.sibsId);

  return Boolean(userSibsId && actorSibsId && normalizeSibsId(userSibsId) === normalizeSibsId(actorSibsId));
}

function getModuleConfig(moduleName) {
  const normalized = normalizeAuditModule(moduleName);

  return (
    MODULE_CONFIG[normalized] || {
      singular: "HRIS Action",
      label: cleanText(moduleName) || "HRIS",
      targetPath: null,
    }
  );
}

function getActionConfig(action) {
  const normalized = normalizeAuditAction(action);

  return (
    ACTION_LABELS[normalized] || {
      noun: cleanText(action) || "Action",
      verb: "updated",
      infinitive: "update",
      failure: cleanText(action) || "Action",
    }
  );
}

function getTone(row = {}) {
  const status = normalizeAuditStatus(row.status);
  const action = normalizeAuditAction(row.action);

  if (status === "FAILED") return "danger";
  if (action === "DELETE" || action === "REJECT") return "warning";
  if (["APPROVE", "RESTORE", "STATUS_CHANGE"].includes(action)) return "action";
  return "info";
}

function normalizeOccurredAt(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? cleanText(value) : parsed.toISOString();
}

function toTitleCase(value = "") {
  return String(value || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatEmployeeName(employee = {}) {
  const firstName = cleanText(employee.firstName || employee.gy_emp_fname);
  const lastName = cleanText(employee.lastName || employee.gy_emp_lname);

  if (firstName && lastName) {
    return `${toTitleCase(firstName)} ${toTitleCase(lastName)}`;
  }
  if (firstName) return toTitleCase(firstName);
  if (lastName) return toTitleCase(lastName);

  const full = cleanText(
    employee.fullName ||
      employee.gy_emp_fullname ||
      employee.gy_full_name ||
      employee.employeeName ||
      employee.name,
  );

  if (full.includes(",")) {
    const parts = full.split(",").map((p) => p.trim());
    if (parts.length >= 2) {
      return `${toTitleCase(parts[1])} ${toTitleCase(parts[0])}`;
    }
  }

  return toTitleCase(full);
}

function formatPersonLabel(name, sibsId, fallback = "A system user") {
  const cleanName = cleanText(name);
  const cleanId = cleanText(sibsId);
  if (cleanName && cleanId) return `${cleanName} (SIBS ${cleanId})`;
  if (cleanName) return cleanName;
  if (cleanId) return `SIBS ${cleanId}`;
  return fallback;
}

async function getEmployeeDirectoryNameMap({
  rows = [],
  kronosDb,
  employeeTable,
  userTable,
} = {}) {
  const allSibsIds = [
    ...new Set(
      rows
        .flatMap((row) => {
          const changes = parseAuditChanges(row);

          return [
            cleanText(row.sibs_id || row.sibsId),
            cleanText(row.target_sibs_id || row.targetSibsId),
            cleanText(
              changes.employeeSibsId ||
                changes.employee_sibs_id ||
                changes.resignationEmployeeSibsId ||
                changes.resignation_employee_sibs_id,
            ),
          ];
        })
        .filter(Boolean),
    ),
  ];

  if (!kronosDb || allSibsIds.length === 0) {
    return new Map();
  }

  const nameMap = new Map();
  const placeholders = allSibsIds.map(() => "?").join(", ");

  // 1. Primary lookup in gy_employee
  if (employeeTable) {
    try {
      const [empRows] = await kronosDb.query(
        `
          SELECT
            TRIM(gy_emp_code) AS sibsId,
            gy_emp_lname AS lastName,
            gy_emp_fname AS firstName,
            gy_emp_mname AS middleName,
            gy_emp_fullname AS fullName
          FROM ${employeeTable}
          WHERE TRIM(gy_emp_code) IN (${placeholders})
        `,
        allSibsIds,
      );

      (Array.isArray(empRows) ? empRows : []).forEach((employee) => {
        const sibsId = cleanText(employee.sibsId || employee.gy_emp_code);
        const employeeName = formatEmployeeName(employee);

        if (sibsId && employeeName) {
          nameMap.set(sibsId, employeeName);
        }
      });
    } catch (error) {
      console.warn("[Audit Notifications] Employee table lookup failed:", {
        code: error?.code,
        message: error?.message,
      });
    }
  }

  // 2. Secondary fallback lookup in gy_user for any unmapped IDs
  const remainingIds = allSibsIds.filter((id) => !nameMap.has(id));
  if (remainingIds.length > 0 && userTable) {
    const userPlaceholders = remainingIds.map(() => "?").join(", ");
    try {
      const [userRows] = await kronosDb.query(
        `
          SELECT
            TRIM(gy_user_code) AS sibsId,
            gy_full_name AS fullName
          FROM ${userTable}
          WHERE TRIM(gy_user_code) IN (${userPlaceholders})
        `,
        remainingIds,
      );

      (Array.isArray(userRows) ? userRows : []).forEach((user) => {
        const sibsId = cleanText(user.sibsId || user.gy_user_code);
        const employeeName = formatEmployeeName({ fullName: user.fullName });

        if (sibsId && employeeName && !nameMap.has(sibsId)) {
          nameMap.set(sibsId, employeeName);
        }
      });
    } catch (error) {
      console.warn("[Audit Notifications] User table lookup failed:", {
        code: error?.code,
        message: error?.message,
      });
    }
  }

  return nameMap;
}

function buildAuditNotificationContent({
  row = {},
  actorName = "",
  targetName = "",
  moduleConfig,
  actionConfig,
  status,
  action,
  moduleName,
  httpStatus,
}) {
  const actorSibsId = cleanText(row.sibs_id || row.sibsId);
  const targetSibsId = cleanText(row.target_sibs_id || row.targetSibsId);

  let changes = row.changes_json;
  if (typeof changes === "string") {
    try {
      changes = JSON.parse(changes);
    } catch {}
  }
  changes = changes && typeof changes === "object" ? changes : {};

  const inlineTargetName = cleanText(
    changes.employeeName || changes.fullName || changes.candidateName || changes.name,
  );
  const resolvedTargetName = targetName || (inlineTargetName ? formatEmployeeName({ fullName: inlineTargetName }) : "");

  const actorLabel = formatPersonLabel(actorName, actorSibsId, "A system user");
  const targetLabel = formatPersonLabel(resolvedTargetName, targetSibsId, "");

  if (status === "FAILED") {
    const title = `${moduleConfig.singular} ${actionConfig.failure} Failed`;
    const message = `${actorLabel} attempted to ${actionConfig.infinitive} ${moduleConfig.label}. Request returned HTTP ${
      httpStatus || 500
    }.`;
    return { title, message };
  }

  // 1. Resignation & Resignation Management
  if (moduleName === "resignation" || moduleName === "resignation-management") {
    if (action === "UPLOAD") {
      return {
        title: "Resignation Document Uploaded",
        message: targetLabel
          ? `${actorLabel} uploaded a resignation document for ${targetLabel}.`
          : `${actorLabel} uploaded a resignation document.`,
      };
    }
    if (action === "APPROVE") {
      return {
        title: "Resignation Request Approved",
        message: targetLabel
          ? `${actorLabel} approved the resignation application for ${targetLabel}.`
          : `${actorLabel} approved a resignation application.`,
      };
    }
    if (action === "REJECT") {
      return {
        title: "Resignation Request Rejected",
        message: targetLabel
          ? `${actorLabel} rejected the resignation application for ${targetLabel}.`
          : `${actorLabel} rejected a resignation application.`,
      };
    }
  }

  // 2. Users & Account Access
  if (moduleName === "users" || moduleName === "account-settings") {
    if (action === "CREATE") {
      const accessLevel = cleanText(changes.accessLevel || changes.role || changes.access);
      const roleStr = accessLevel ? ` (${accessLevel})` : "";
      return {
        title: "User Access Granted",
        message: targetLabel
          ? `${actorLabel} granted user access${roleStr} to ${targetLabel}.`
          : `${actorLabel} granted user access${roleStr}.`,
      };
    }
    if (action === "UPDATE") {
      return {
        title: "User Access Updated",
        message: targetLabel
          ? `${actorLabel} updated user access for ${targetLabel}.`
          : `${actorLabel} updated user access settings.`,
      };
    }
    if (action === "DELETE") {
      return {
        title: "User Access Revoked",
        message: targetLabel
          ? `${actorLabel} revoked user access for ${targetLabel}.`
          : `${actorLabel} revoked user access.`,
      };
    }
  }

  // 3. Leaves
  if (moduleName === "leaves") {
    if (action === "APPROVE") {
      return {
        title: "Leave Request Approved",
        message: targetLabel
          ? `${actorLabel} approved leave request for ${targetLabel}.`
          : `${actorLabel} approved a leave request.`,
      };
    }
    if (action === "REJECT") {
      return {
        title: "Leave Request Rejected",
        message: targetLabel
          ? `${actorLabel} rejected leave request for ${targetLabel}.`
          : `${actorLabel} rejected a leave request.`,
      };
    }
    if (action === "UPLOAD") {
      return {
        title: "Leave Attachment Uploaded",
        message: targetLabel
          ? `${actorLabel} uploaded a leave supporting file for ${targetLabel}.`
          : `${actorLabel} uploaded a leave attachment.`,
      };
    }
  }

  // 4. Employee Records
  if (moduleName === "employees" || moduleName === "employee-profile") {
    if (action === "CREATE") {
      return {
        title: "New Employee Profile Created",
        message: targetLabel
          ? `${actorLabel} created an employee profile for ${targetLabel}.`
          : `${actorLabel} created an employee profile.`,
      };
    }
    if (action === "UPDATE") {
      return {
        title: "Employee Profile Updated",
        message: targetLabel
          ? `${actorLabel} updated employee records for ${targetLabel}.`
          : `${actorLabel} updated employee records.`,
      };
    }
    if (action === "UPLOAD") {
      return {
        title: "Employee Document Uploaded",
        message: targetLabel
          ? `${actorLabel} uploaded a document for ${targetLabel}.`
          : `${actorLabel} uploaded an employee document.`,
      };
    }
  }

  // 5. Recruitment & Pipeline
  if (moduleName === "candidate-pipeline" || moduleName === "talent-pool") {
    if (action === "CREATE") {
      const title = moduleName === "talent-pool" ? "Candidate Added to Talent Pool" : "Candidate Record Created";
      return {
        title,
        message: targetLabel
          ? `${actorLabel} added candidate ${targetLabel}.`
          : `${actorLabel} added a candidate record.`,
      };
    }
    if (action === "APPROVE") {
      return {
        title: "Candidate Stage Approved",
        message: targetLabel
          ? `${actorLabel} approved stage advancement for candidate ${targetLabel}.`
          : `${actorLabel} approved candidate stage advancement.`,
      };
    }
    if (action === "UPLOAD") {
      return {
        title: "Candidate Document Uploaded",
        message: targetLabel
          ? `${actorLabel} uploaded a candidate file for ${targetLabel}.`
          : `${actorLabel} uploaded a candidate document.`,
      };
    }
  }

  // 6. Hiring Needs & Requisitions
  if (moduleName === "hiring-needs") {
    if (action === "CREATE") {
      return {
        title: "Hiring Need Requisition Created",
        message: `${actorLabel} submitted a new hiring requisition.`,
      };
    }
    if (action === "APPROVE") {
      return {
        title: "Hiring Need Approved",
        message: `${actorLabel} approved a hiring requisition.`,
      };
    }
  }

  // 7. Job Descriptions
  if (moduleName === "job-description") {
    if (action === "CREATE") {
      return {
        title: "Job Description Created",
        message: `${actorLabel} published a new job description.`,
      };
    }
    if (action === "UPDATE") {
      return {
        title: "Job Description Revised",
        message: `${actorLabel} revised a job description.`,
      };
    }
  }

  // 8. Approval Requests
  if (moduleName === "approval-request" || moduleName === "approval-requests") {
    if (action === "APPROVE") {
      return {
        title: "Approval Request Approved",
        message: targetLabel
          ? `${actorLabel} approved the approval request for ${targetLabel}.`
          : `${actorLabel} approved an approval request.`,
      };
    }
    if (action === "REJECT") {
      return {
        title: "Approval Request Rejected",
        message: targetLabel
          ? `${actorLabel} rejected the approval request for ${targetLabel}.`
          : `${actorLabel} rejected an approval request.`,
      };
    }
  }

  // 9. General Contextual Fallback
  const title = `${moduleConfig.singular} ${actionConfig.noun}`;
  const message = targetLabel
    ? `${actorLabel} ${actionConfig.verb} ${moduleConfig.label} for ${targetLabel}.`
    : `${actorLabel} ${actionConfig.verb} ${moduleConfig.label}.`;

  return { title, message };
}


function parseAuditChanges(row = {}) {
  let changes = row.changes_json ?? row.changesJson ?? {};

  if (typeof changes === "string") {
    try {
      changes = JSON.parse(changes);
    } catch {
      changes = {};
    }
  }

  return changes && typeof changes === "object" ? changes : {};
}

function getApprovalRequestResignationContext(row = {}) {
  const moduleName = normalizeAuditModule(row.module);
  const action = normalizeAuditAction(row.action);

  if (
    !["approval-request", "approval-requests"].includes(moduleName) ||
    !["APPROVE", "REJECT"].includes(action)
  ) {
    return null;
  }

  const changes = parseAuditChanges(row);
  const endpoint = cleanText(row.endpoint).toLowerCase();
  const recordId = cleanText(row.record_id || row.recordId);
  const source = cleanText(
    changes.source || changes.requestSource || changes.request_source,
  ).toLowerCase();
  const explicitResignationId = cleanText(
    changes.resignationId || changes.resignation_id,
  );

  const recordIsResignation = /^res[-_:]/i.test(recordId);
  const sourceIsResignation = source.includes("resignation");
  if (
    !explicitResignationId &&
    !recordIsResignation &&
    !sourceIsResignation
  ) {
    return null;
  }

  let resignationId = explicitResignationId;

  if (!resignationId && recordIsResignation) {
    resignationId = recordId.replace(/^res[-_:]/i, "");
  }

  if (!resignationId && sourceIsResignation) {
    const endpointMatch = endpoint.match(
      /\/approval-requests\/(?:attrition\/)?(?:res[-_:])?([^/?#]+)\/(?:approve|reject)(?:[/?#]|$)/i,
    );
    resignationId = cleanText(endpointMatch?.[1]);
  }

  const employeeSibsId = cleanText(
    changes.employeeSibsId ||
      changes.employee_sibs_id ||
      changes.resignationEmployeeSibsId ||
      changes.resignation_employee_sibs_id ||
      row.target_sibs_id ||
      row.targetSibsId,
  );

  return {
    resignationId,
    employeeSibsId,
  };
}

function getResignationWorkflowContent({
  row = {},
  action = "",
  targetName = "",
} = {}) {
  const moduleName = normalizeAuditModule(row.module);

  if (
    moduleName !== "resignation" ||
    !RESIGNATION_WORKFLOW_ACTIONS.has(action)
  ) {
    return null;
  }

  const changes = parseAuditChanges(row);
  const status = cleanText(
    changes.status ||
      changes.resignationStatus ||
      changes.resignation_status ||
      changes.currentStatus ||
      changes.current_status,
  );
  const normalizedStatus = status.toLowerCase();

  const nextApproverRole = cleanText(
    changes.nextApproverRole ||
      changes.next_approver_role ||
      changes.approverRole ||
      changes.approver_role ||
      changes.nextApprover ||
      changes.next_approver,
  );

  const employeeLabel =
    cleanText(targetName) ||
    cleanText(
      changes.employeeName ||
        changes.employee_name ||
        changes.fullName ||
        changes.full_name,
    );

  if (action === "RESIGN_REVIEW") {
    return {
      tone: "action",
      title: "Resignation Approval Required",
      message: employeeLabel
        ? `The resignation request for ${employeeLabel} is waiting for your review${
            nextApproverRole ? ` as ${nextApproverRole}` : ""
          }.`
        : `A resignation request is waiting for your review${
            nextApproverRole ? ` as ${nextApproverRole}` : ""
          }.`,
      targetPath: "/resignation",
    };
  }

  if (action === "RESIGN_SUBMITTED") {
    return {
      tone: "info",
      title: "Resignation Submitted",
      message:
        "Your resignation request has been submitted and is awaiting approval.",
      targetPath: "/dashboard/employee",
    };
  }

  if (action === "RESIGN_DECLINED") {
    return {
      tone: "warning",
      title: "Resignation Declined",
      message:
        "Your resignation request was declined. Open the resignation details to review the latest status.",
      targetPath: "/dashboard/employee",
    };
  }

  if (action === "RESIGN_RETAINED") {
    return {
      tone: "warning",
      title: "Resignation Retained",
      message:
        "Your resignation request was updated as retained. Open the resignation details to review the latest status.",
      targetPath: "/dashboard/employee",
    };
  }

  if (action === "RESIGN_APPROVED") {
    const hasNextApprover = Boolean(nextApproverRole);

    return {
      tone: "action",
      title: hasNextApprover
        ? "Resignation Approval Updated"
        : "Resignation Approved",
      message: hasNextApprover
        ? `Your resignation request was approved at the current stage and is now awaiting ${nextApproverRole} approval.`
        : "Your resignation request has completed the approval workflow.",
      targetPath: "/dashboard/employee",
    };
  }

  if (action === "RESIGN_STATUS") {
    if (["approved", "completed"].includes(normalizedStatus)) {
      return {
        tone: "action",
        title: "Resignation Approved",
        message:
          "Your resignation request has completed the approval workflow.",
        targetPath: "/dashboard/employee",
      };
    }

    if (["declined", "rejected"].includes(normalizedStatus)) {
      return {
        tone: "warning",
        title: "Resignation Declined",
        message:
          "Your resignation request was declined. Open the resignation details to review the latest status.",
        targetPath: "/dashboard/employee",
      };
    }

    if (normalizedStatus === "retained") {
      return {
        tone: "warning",
        title: "Resignation Retained",
        message:
          "Your resignation request was updated as retained. Open the resignation details to review the latest status.",
        targetPath: "/dashboard/employee",
      };
    }

    if (
      ["pending", "for review", "for_review", "notice period", "notice_period"].includes(
        normalizedStatus,
      ) ||
      !normalizedStatus
    ) {
      return {
        tone: "info",
        title: "Resignation Status Updated",
        message: nextApproverRole
          ? `Your resignation request is awaiting ${nextApproverRole} approval.`
          : "Your resignation request is still in the approval workflow and is awaiting the next approval.",
        targetPath: "/dashboard/employee",
      };
    }

    return {
      tone: "info",
      title: "Resignation Status Updated",
      message: `Your resignation status is now ${status}.`,
      targetPath: "/dashboard/employee",
    };
  }

  return null;
}

export function normalizeAuditNotificationRow(row = {}) {
  const id = Number(row.id || 0);
  const actorSibsId = cleanText(row.sibs_id || row.sibsId);
  const targetSibsId = cleanText(row.target_sibs_id || row.targetSibsId);
  const actorEmployeeName = cleanText(row.actorEmployeeName || row.actor_employee_name);
  const targetEmployeeName = cleanText(row.targetEmployeeName || row.target_employee_name);
  const changes = parseAuditChanges(row);
  const approvalResignationContext = getApprovalRequestResignationContext(row);
  const rawModuleName = normalizeAuditModule(row.module);
  const moduleName = approvalResignationContext ? "resignation" : rawModuleName;
  const rawRecordId = cleanText(row.record_id || row.recordId);
  const resignationId = cleanText(
    approvalResignationContext?.resignationId ||
      changes.resignationId ||
      changes.resignation_id ||
      (approvalResignationContext && /^res[-_:]/i.test(rawRecordId)
        ? rawRecordId.replace(/^res[-_:]/i, "")
        : rawModuleName === "resignation"
          ? rawRecordId
          : ""),
  );
  const employeeSibsId = cleanText(
    approvalResignationContext?.employeeSibsId ||
      changes.employeeSibsId ||
      changes.employee_sibs_id ||
      changes.resignationEmployeeSibsId ||
      changes.resignation_employee_sibs_id,
  );
  const resignationEmployeeName = cleanText(
    row.resignationEmployeeName ||
      row.resignation_employee_name ||
      (approvalResignationContext ? targetEmployeeName : ""),
  );
  const action = normalizeAuditAction(row.action);
  const status = normalizeAuditStatus(row.status);
  const httpStatus = Number(row.http_status ?? row.httpStatus ?? 0) || 0;
  const moduleConfig = getModuleConfig(moduleName);
  const actionConfig = getActionConfig(action);
  const workflowContent = getResignationWorkflowContent({
    row,
    action,
    targetName: resignationEmployeeName || targetEmployeeName,
  });

  const { title, message } = workflowContent || buildAuditNotificationContent({
    row,
    actorName: actorEmployeeName,
    targetName: targetEmployeeName,
    moduleConfig,
    actionConfig,
    status,
    action,
    moduleName,
    httpStatus,
  });

  return {
    id: `audit:${id || cleanText(row.request_id || row.requestId) || "event"}`,
    auditLogId: id,
    module: moduleName,
    tone: workflowContent?.tone || getTone(row),
    title,
    message,
    actorSibsId,
    ...(actorEmployeeName ? { actorEmployeeName } : {}),
    ...(targetSibsId ? { targetSibsId } : {}),
    ...(targetEmployeeName ? { targetEmployeeName } : {}),
    ...(resignationEmployeeName ? { resignationEmployeeName } : {}),
    ...(resignationId ? { resignationId } : {}),
    ...(employeeSibsId ? { employeeSibsId } : {}),
    action,
    status,
    httpStatus,
    occurredAt: normalizeOccurredAt(row.created_at ?? row.createdAt),
    targetPath: workflowContent?.targetPath || moduleConfig.targetPath,
  };
}

function clampLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(50, Math.max(1, Math.trunc(parsed)));
}

export async function getAuditNotifications({
  user = {},
  limit = 20,
  db,
  kronosDb,
  kronosEmployeeTable,
  kronosUserTable,
} = {}) {
  const scope = getAuditNotificationScope(user);

  if (scope === "none") {
    const error = new Error("You are not allowed to view audit notifications.");
    error.statusCode = 403;
    throw error;
  }

  const safeLimit = clampLimit(limit);
  const queryLimit = Math.min(200, Math.max(safeLimit * 5, 50));

  let database = db;
  let employeeDatabase = kronosDb;
  let employeeTable = kronosEmployeeTable;
  let userTable = kronosUserTable;

  if (!database || !employeeDatabase || !employeeTable || !userTable) {
    const dbModule = await import("../config/db.js");
    database ||= dbModule.hrisDb;
    employeeDatabase ||= dbModule.kronosDb;
    employeeTable ||= dbModule.kronosTables?.employee;
    userTable ||= dbModule.kronosTables?.user;
  }

  const [rows] = await database.query(
    `
      SELECT
        id,
        request_id,
        sibs_id,
        target_sibs_id,
        record_id,
        endpoint,
        role,
        module,
        action,
        status,
        http_status,
        description,
        changes_json,
        created_at
      FROM sibs_hris_logs
      WHERE status = 'SUCCESS'
        AND created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 24 HOUR)
      ORDER BY id DESC
      LIMIT ?
    `,
    [queryLimit],
  );

  const notificationRows = (Array.isArray(rows) ? rows : [])
    .filter(isNotificationWorthyAuditRow)
    .filter((row) => canRowBeShownForScope(row, scope, user))
    .slice(0, safeLimit);

  const employeeNameMap = await getEmployeeDirectoryNameMap({
    rows: notificationRows,
    kronosDb: employeeDatabase,
    employeeTable,
    userTable,
  });

  const notifications = notificationRows.map((row) => {
    const actorSibsId = cleanText(row.sibs_id || row.sibsId);
    const targetSibsId = cleanText(row.target_sibs_id || row.targetSibsId);
    const changes = parseAuditChanges(row);
    const employeeSibsId = cleanText(
      changes.employeeSibsId ||
        changes.employee_sibs_id ||
        changes.resignationEmployeeSibsId ||
        changes.resignation_employee_sibs_id,
    );

    return normalizeAuditNotificationRow({
      ...row,
      actorEmployeeName: employeeNameMap.get(actorSibsId) || "",
      targetEmployeeName: employeeNameMap.get(targetSibsId) || "",
      resignationEmployeeName: employeeNameMap.get(employeeSibsId) || "",
    });
  });

  return {
    notifications,
    count: notifications.length,
    windowHours: 24,
  };
}
