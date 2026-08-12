import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Info,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  UploadCloud,
  Users,
  X,
} from "lucide-react";

import { useHiringNeeds } from "../../../services/context/HiringNeedsContext";
import { useUser } from "../../../services/context/UserContext";
import { createHiringNeed } from "../../../lib/axios/getHiringNeeds";
import { getTalentPoolOpenPositions } from "../../../lib/axios/getTalentPool";
import {
  getWorkforceHiringPlanAccounts,
  getWorkforceHiringPlanWeeks,
} from "../../../lib/axios/getWorkforceHiringPlan";

const VALID_LOCATION_SITES = ["Davao Site", "Tagum Site", "Mabini Site"];

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

function TextInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`h-10 w-full rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:border-[#D7DEE8] disabled:bg-[#F2F4F7] disabled:text-[#667085] ${className}`}
    />
  );
}

function TextArea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={`min-h-28 w-full resize-none rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] px-3 py-2.5 text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:border-[#D7DEE8] disabled:bg-[#F2F4F7] disabled:text-[#667085] ${className}`}
    />
  );
}


function FormSection({
  title,
  subtitle,
  icon: SectionIcon,
  children,
}) {
  return (
    <section className="rounded-2xl border border-[#D6E0EA] bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-2.5 border-b border-[#EEF2F6] pb-3">
        {React.createElement(SectionIcon, {
          size: 17,
          className: "mt-0.5 shrink-0 text-[#FF5C28]",
          "aria-hidden": "true",
        })}

        <div className="min-w-0">
          <h3 className="text-xs font-extrabold uppercase tracking-normal text-[#042C51]">
            {title}
          </h3>

          <p className="mt-1 text-xs font-semibold leading-5 text-[#667085]">
            {subtitle}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

function hideKronosStatus(value) {
  const status = cleanText(value);

  if (status.toLowerCase() === "kronos") return "";

  return status;
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeAccessRole(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getUserAdminAccess(user = {}) {
  const directAccess = Number(
    user.adminAccess ??
      user.admin_access ??
      user.gy_user_access ??
      user.access ??
      user.adminLevel ??
      user.admin_level ??
      0,
  );

  const assignments = Array.isArray(user.assignedAccounts)
    ? user.assignedAccounts
    : Array.isArray(user.assigned_accounts)
      ? user.assigned_accounts
      : Array.isArray(user.assignments)
        ? user.assignments
        : [];

  const assignmentAccess = assignments
    .map((item) =>
      Number(
        item?.adminAccess ??
          item?.admin_access ??
          item?.access ??
          0,
      ),
    )
    .filter((value) => Number.isFinite(value));

  if (Number.isFinite(directAccess) && directAccess > 0) {
    return directAccess;
  }

  return assignmentAccess.length
    ? Math.max(...assignmentAccess)
    : 0;
}

function getUserRoleName(user = {}) {
  return normalizeAccessRole(
    user.role ||
      user.userRole ||
      user.user_role ||
      user.adminRole ||
      user.admin_role ||
      "",
  );
}

function getUserPositionAssignments(user = {}) {
  const sourceAssignments = Array.isArray(user.assignedAccounts)
    ? user.assignedAccounts
    : Array.isArray(user.assigned_accounts)
      ? user.assigned_accounts
      : Array.isArray(user.assignments)
        ? user.assignments
        : [];

  const normalizedAssignments = sourceAssignments
    .map((assignment) => ({
      departmentId: cleanText(
        assignment?.departmentId ||
          assignment?.department_id ||
          assignment?.gy_dept_id ||
          "",
      ),
      departmentName: cleanText(
        assignment?.departmentName ||
          assignment?.department_name ||
          assignment?.department ||
          assignment?.name_department ||
          "",
      ),
      accountId: cleanText(
        assignment?.accountId ||
          assignment?.account_id ||
          assignment?.gy_acc_id ||
          "",
      ),
      accountName: cleanText(
        assignment?.accountName ||
          assignment?.account_name ||
          assignment?.account ||
          assignment?.gy_acc_name ||
          "",
      ),
    }))
    .filter(
      (assignment) =>
        (assignment.departmentId || assignment.departmentName) &&
        (assignment.accountId || assignment.accountName),
    );

  if (normalizedAssignments.length) {
    return normalizedAssignments;
  }

  const fallback = {
    departmentId: cleanText(
      user.departmentId ||
        user.department_id ||
        user.gy_dept_id ||
        "",
    ),
    departmentName: cleanText(
      user.departmentName ||
        user.department_name ||
        user.department ||
        user.name_department ||
        "",
    ),
    accountId: cleanText(
      user.accountId ||
        user.account_id ||
        user.gy_acc_id ||
        "",
    ),
    accountName: cleanText(
      user.accountName ||
        user.account_name ||
        user.account ||
        user.gy_acc_name ||
        "",
    ),
  };

  return (
    (fallback.departmentId || fallback.departmentName) &&
    (fallback.accountId || fallback.accountName)
  )
    ? [fallback]
    : [];
}

function valuesMatchByIdOrName(
  firstId,
  secondId,
  firstName,
  secondName,
) {
  const leftId = cleanText(firstId).toLowerCase();
  const rightId = cleanText(secondId).toLowerCase();

  if (leftId && rightId) {
    return leftId === rightId;
  }

  const leftName = cleanText(firstName).toLowerCase();
  const rightName = cleanText(secondName).toLowerCase();

  return Boolean(
    leftName &&
      rightName &&
      leftName === rightName,
  );
}

function canViewAllHiringNeedPositions(user = {}) {
  const access = getUserAdminAccess(user);
  const role = getUserRoleName(user);

  return (
    access === 3 ||
    access === 7 ||
    role === "hr_admin" ||
    role === "hradmin" ||
    role === "super_admin" ||
    role === "superadmin"
  );
}

function isManagerUser(user = {}) {
  const access = getUserAdminAccess(user);
  const role = getUserRoleName(user);

  return access === 5 || role === "manager";
}

function filterHiringNeedPositionsForUser(positions = [], user = {}) {
  if (canViewAllHiringNeedPositions(user)) {
    return positions;
  }

  if (!isManagerUser(user)) {
    return positions;
  }

  const assignments = getUserPositionAssignments(user);

  if (!assignments.length) {
    return [];
  }

  return positions.filter((position) =>
    assignments.some((assignment) => {
      const departmentMatches = valuesMatchByIdOrName(
        position.departmentId,
        assignment.departmentId,
        position.department,
        assignment.departmentName,
      );

      const accountMatches = valuesMatchByIdOrName(
        position.accountId,
        assignment.accountId,
        position.accountName,
        assignment.accountName,
      );

      return departmentMatches && accountMatches;
    }),
  );
}

function upperText(value) {
  return cleanText(value).toUpperCase();
}

function stripLeadingSibsId(value) {
  return cleanText(value).replace(/^\d+\s*-\s*/i, "").trim();
}

function normalizeLocationSite(value) {
  const raw = cleanText(value);
  const lower = raw.toLowerCase();

  if (!lower) return "Davao Site";

  if (lower === "davao" || lower === "davao site") return "Davao Site";
  if (lower === "tagum" || lower === "tagum site") return "Tagum Site";
  if (lower === "mabini" || lower === "mabini site") return "Mabini Site";

  return raw;
}

function normalizeDbId(value) {
  if (value === null || value === undefined || value === "") return "";

  const raw = cleanText(value);

  if (!raw) return "";

  const numericValue = Number(raw);

  if (Number.isNaN(numericValue) || numericValue <= 0) return "";

  return String(numericValue);
}

function normalizeHeadcountValue(value) {
  if (value === null || value === undefined || value === "") return 0;

  const rawValue = String(value).replace(/,/g, "").replace(/%/g, "").trim();
  const numericValue = Number(rawValue);

  if (!Number.isFinite(numericValue) || numericValue < 0) return 0;

  return numericValue;
}

function getNumberValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      const numberValue = normalizeHeadcountValue(value);

      if (Number.isFinite(numberValue)) {
        return numberValue;
      }
    }
  }

  return 0;
}

function formatNumber(value, maximumFractionDigits = 0) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits,
  });
}

function normalizeStatusValue(value, fallback = "") {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) return fallback;

  const normalized = rawValue.toLowerCase();

  if (normalized === "approved") return "Approved";
  if (normalized === "rejected" || normalized === "declined") return "Rejected";
  if (normalized === "pending") return "Pending";
  if (normalized === "kronos") return "Kronos";

  return rawValue;
}

function getWeeklyRecruitmentSettingsStatus(record = {}) {
  return normalizeStatusValue(
    record.recruitmentSettingsStatus ||
    record.recruitment_settings_status ||
    record.recruitmentStatus ||
    record.recruitment_status ||
    record.baseHeadcountStatus ||
    record.base_headcount_status ||
    record.status ||
    "Kronos",
    "Kronos",
  );
}

function getWeeklyUpdateHeadcountStatus(record = {}) {
  const rawStatus =
    record.updateHeadcountStatus ||
    record.update_headcount_status ||
    record.managerUpdateStatus ||
    record.manager_update_status ||
    "";

  if (!rawStatus) return "";

  return normalizeStatusValue(rawStatus, "");
}

function getWeeklyHeadcountStatus(record = {}) {
  return (
    getWeeklyUpdateHeadcountStatus(record) ||
    getWeeklyRecruitmentSettingsStatus(record) ||
    "Kronos"
  );
}

function getWeeklyTableRequiredHeadcount(record = {}) {
  /*
    Keep this aligned with WeeklyHiringAccountsTable: that table reads
    requiredHeadcount / required_headcount after the weekly API has already
    resolved approved HRIS values vs Kronos fallback values.
  */
  return getNumberValue(
    record.requiredHeadcount,
    record.required_headcount,
    record.approvedRequiredHeadcount,
    record.approved_required_headcount,
    record.kronosRequiredHeadcount,
    record.kronos_required_headcount,
    record.kronosBasedRequiredHeadcount,
    record.kronos_based_required_headcount,
    record.kronosHeadcount,
    record.kronos_headcount,
    record.actualHeadcount,
    record.actual_headcount,
  );
}

function getWeeklyAccountName(record = {}) {
  return cleanText(
    record.account ||
    record.accountName ||
    record.account_name ||
    record.gy_acc_name ||
    "",
  );
}


function normalizeWeekDate(value) {
  const raw = cleanText(value);

  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) return "";

  return toDateInputValue(parsed);
}

function getWeeklyWeekKey(weekStart, weekEnd) {
  const start = normalizeWeekDate(weekStart);
  const end = normalizeWeekDate(weekEnd);

  if (start || end) return `${start}__${end}`;

  return "default-week";
}

function getWeeklyWeekLabel(weekStart, weekEnd) {
  const start = normalizeWeekDate(weekStart);
  const end = normalizeWeekDate(weekEnd);

  if (start && end) {
    return `${formatShortDate(start)} - ${formatShortDate(end)}`;
  }

  if (start) return `Week of ${formatShortDate(start)}`;
  if (end) return `Until ${formatShortDate(end)}`;

  return "Current / Default Week";
}

function getWeeklyWeekDateRange(weekStart, weekEnd) {
  const start = normalizeWeekDate(weekStart);
  const end = normalizeWeekDate(weekEnd);

  if (start && end) {
    return `${formatShortDate(start)} - ${formatShortDate(end)}`;
  }

  if (start) return `Starts ${formatShortDate(start)}`;
  if (end) return `Ends ${formatShortDate(end)}`;

  return "";
}

function getWeeklyWeekDisplayLabel(row = {}, weekStart = "", weekEnd = "") {
  const rawLabel = cleanText(row.label || row.weekLabel || row.week_label || "");
  const dateRange = getWeeklyWeekDateRange(weekStart, weekEnd);

  if (!rawLabel) {
    return dateRange || getWeeklyWeekLabel(weekStart, weekEnd);
  }

  if (!dateRange) return rawLabel;

  if (rawLabel.toLowerCase().includes(dateRange.toLowerCase())) {
    return rawLabel;
  }

  return `${rawLabel} • ${dateRange}`;
}

function normalizeWeeklyWeek(row = {}, index = 0) {
  const weekStart = normalizeWeekDate(
    row.startDate ||
    row.start_date ||
    row.weekStart ||
    row.week_start ||
    row.fromDate ||
    row.from_date ||
    "",
  );

  const weekEnd = normalizeWeekDate(
    row.endDate ||
    row.end_date ||
    row.weekEnd ||
    row.week_end ||
    row.toDate ||
    row.to_date ||
    "",
  );

  const weekKey = getWeeklyWeekKey(weekStart, weekEnd);
  const weekDateRange = getWeeklyWeekDateRange(weekStart, weekEnd);
  const weekLabel = getWeeklyWeekDisplayLabel(row, weekStart, weekEnd);

  return {
    raw: row,
    value: weekKey || row.id || `week-${index}`,
    id: weekKey || row.id || `week-${index}`,
    originalId: row.id || "",
    label: weekLabel,
    weekLabel,
    weekDateRange,
    dateRange: weekDateRange,
    weekKey,
    weekStart,
    weekEnd,
    startDate: weekStart,
    endDate: weekEnd,
    locked: Boolean(row.locked),
    lockedByDatabase: Boolean(
      row.lockedByDatabase ||
      row.locked_by_database ||
      row.isHiringPlanLocked ||
      row.is_hiring_plan_locked ||
      row.hasSavedSnapshot ||
      row.has_saved_snapshot,
    ),
  };
}

function normalizeWeeklyAccount(row = {}, index = 0, selectedWeek = {}) {
  const accountId = cleanText(
    row.backendAccountId ||
    row.backend_account_id ||
    row.accountId ||
    row.account_id ||
    row.gy_acc_id ||
    "",
  );

  const weeklyHiringPlanHeadcountId = cleanText(
    row.weeklyHiringPlanHeadcountId ||
    row.weekly_hiring_plan_headcount_id ||
    row.headcountId ||
    row.headcount_id ||
    row.id ||
    "",
  );

  const accountName = getWeeklyAccountName(row);
  const cluster = cleanText(row.cluster || row.clusterName || row.cluster_name || "");
  const department = cleanText(
    row.department || row.departmentName || row.department_name || "",
  );
  const departmentId = cleanText(
    row.departmentId || row.department_id || row.gy_dept_id || "",
  );
  const requiredHeadcount = getWeeklyTableRequiredHeadcount(row);
  const status = getWeeklyHeadcountStatus(row);

  const weekStart = normalizeWeekDate(
    row.weekStart ||
    row.week_start ||
    row.startDate ||
    row.start_date ||
    selectedWeek.weekStart ||
    selectedWeek.startDate ||
    "",
  );

  const weekEnd = normalizeWeekDate(
    row.weekEnd ||
    row.week_end ||
    row.endDate ||
    row.end_date ||
    selectedWeek.weekEnd ||
    selectedWeek.endDate ||
    "",
  );

  const weekKey = getWeeklyWeekKey(weekStart, weekEnd);
  const weekDateRange =
    selectedWeek.weekDateRange ||
    selectedWeek.dateRange ||
    getWeeklyWeekDateRange(weekStart, weekEnd);
  const weekLabel =
    selectedWeek.weekLabel ||
    selectedWeek.label ||
    weekDateRange ||
    getWeeklyWeekLabel(weekStart, weekEnd);
  const uniqueValue = [
    weekKey,
    weeklyHiringPlanHeadcountId || accountId || accountName.toLowerCase(),
    cluster.toLowerCase(),
    index,
  ]
    .filter(Boolean)
    .join("-");

  return {
    raw: row,
    value: uniqueValue,
    weeklyHiringPlanHeadcountId,
    accountId,
    accountName,
    cluster,
    department,
    departmentId,
    departmentAccount: [department, accountName].filter(Boolean).join(" / ") || accountName,
    previousRequiredHeadcount: requiredHeadcount,
    requiredHeadcount,
    status,
    requiredHeadcountSource:
      row.requiredHeadcountSource ||
      row.required_headcount_source ||
      row.headcountStatus ||
      row.headcount_status ||
      status,
    weekStart,
    weekEnd,
    weekKey,
    weekLabel,
    weekDateRange,
    dateRange: weekDateRange,
  };
}

function getPositionRequiredHeadcount(row = {}) {
  return normalizeHeadcountValue(
    row.previousRequiredHeadcount ||
    row.previous_required_headcount ||
    row.requiredHeadcount ||
    row.required_headcount ||
    row.approvedRequirement ||
    row.approved_requirement ||
    row.headcount ||
    row.requiredCount ||
    row.required_count ||
    row.currentHeadcount ||
    row.current_headcount ||
    row.totalHeadcount ||
    row.total_headcount ||
    0,
  );
}

function getJobDescriptionDbId(row = {}) {
  return normalizeDbId(
    row.jobDescriptionDbId ||
    row.job_description_db_id ||
    row.jobDescriptionId ||
    row.job_description_id ||
    row.jdId ||
    row.jd_id ||
    row.jdDbId ||
    row.jd_db_id ||
    row.jdID ||
    row.job_description?.id ||
    row.jobDescription?.id ||
    "",
  );
}

function getJobDescriptionCode(row = {}) {
  return cleanText(
    row.jobDescriptionCode ||
    row.job_description_code ||
    row.jdCode ||
    row.jd_code ||
    row.job_description?.jdCode ||
    row.job_description?.jd_code ||
    row.jobDescription?.jdCode ||
    row.jobDescription?.jd_code ||
    row.code ||
    row.positionCode ||
    row.position_code ||
    row.positionId ||
    row.position_id ||
    "",
  );
}

function getJobDescriptionTitle(row = {}) {
  return cleanText(
    row.jobDescriptionTitle ||
    row.job_description_title ||
    row.jdRoleTitle ||
    row.jd_role_title ||
    row.jdTitle ||
    row.jd_title ||
    row.job_description?.roleTitle ||
    row.job_description?.document_title ||
    row.jobDescription?.roleTitle ||
    row.jobDescription?.document_title ||
    row.positionTitle ||
    row.position_title ||
    row.title ||
    row.name ||
    "",
  );
}

function getUserSibsId(user = {}) {
  return cleanText(
    user.sibsId ||
    user.sibs_id ||
    user.userCode ||
    user.user_code ||
    user.employeeId ||
    user.employee_id ||
    user.empCode ||
    user.emp_code ||
    user.gyEmpCode ||
    user.gy_emp_code ||
    user.sibs_id_creator ||
    user.username ||
    "",
  );
}

function getUserDisplayName(user = {}) {
  const lastName = cleanText(
    user.lastName ||
    user.last_name ||
    user.lastname ||
    user.surname ||
    "",
  );

  const firstName = cleanText(
    user.firstName ||
    user.first_name ||
    user.firstname ||
    user.givenName ||
    user.given_name ||
    "",
  );

  const middleName = cleanText(
    user.middleName ||
    user.middle_name ||
    user.middlename ||
    user.middleInitial ||
    user.middle_initial ||
    "",
  );

  if (lastName || firstName || middleName) {
    return upperText(
      `${lastName}${lastName && firstName ? ", " : ""}${firstName}${middleName ? ` ${middleName}` : ""
      }`,
    );
  }

  const fullName = stripLeadingSibsId(
    user.fullName ||
    user.full_name ||
    user.employeeName ||
    user.employee_name ||
    user.name ||
    "",
  );

  if (fullName.includes(",")) {
    return upperText(fullName);
  }

  const nameParts = fullName.split(/\s+/).filter(Boolean);

  if (nameParts.length >= 2) {
    const fallbackLastName = nameParts[nameParts.length - 1];
    const fallbackFirstName = nameParts[0];
    const fallbackMiddleName = nameParts.slice(1, -1).join(" ");

    return upperText(
      `${fallbackLastName}, ${fallbackFirstName}${fallbackMiddleName ? ` ${fallbackMiddleName}` : ""
      }`,
    );
  }

  return upperText(fullName || user.username || "SYSTEM USER");
}

function formatPreparedByUser(user = {}) {
  const sibsId = getUserSibsId(user);
  const displayName = getUserDisplayName(user);

  return upperText([sibsId, displayName].filter(Boolean).join(" - "));
}

function formatShortDate(value) {
  if (!value) return "";

  const [year, month, day] = String(value).split("-").map(Number);

  if (!year || !month || !day) return "";

  const parsed = new Date(year, month - 1, day);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCalendarDays(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const calendarStart = new Date(year, month, 1 - startDay);

  return Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    return date;
  });
}

function isSameDate(firstDate, secondDate) {
  if (!firstDate || !secondDate) return false;

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function normalizePosition(row = {}) {
  const positionTitle =
    row.positionTitle ||
    row.position_title ||
    row.title ||
    row.name ||
    "";

  const positionId =
    row.positionId ||
    row.position_id ||
    row.code ||
    row.positionCode ||
    row.position_code ||
    "";

  const accountName =
    row.accountName ||
    row.account_name ||
    row.accountGhlName ||
    row.account_ghl_name ||
    row.account ||
    "";

  const department =
    row.department || row.departmentName || row.department_name || "";

  const departmentAccount = [department, accountName]
    .map(cleanText)
    .filter(Boolean)
    .join(" / ");

  const jobDescriptionDbId = getJobDescriptionDbId(row);
  const jobDescriptionCode = getJobDescriptionCode(row);
  const jobDescriptionTitle = getJobDescriptionTitle(row);
  const previousRequiredHeadcount = getPositionRequiredHeadcount(row);

  return {
    raw: row,

    id: row.id || row.openPositionId || row.open_position_id || positionId,
    openPositionDbId: row.id || row.openPositionId || row.open_position_id || "",

    positionId,
    positionTitle,

    department,
    departmentId: row.departmentId || row.department_id || "",
    accountId: row.accountId || row.account_id || "",
    accountName,
    accountGhlName: row.accountGhlName || row.account_ghl_name || "",

    locationSite: normalizeLocationSite(row.locationSite || row.location_site),
    previousRequiredHeadcount,

    jobDescriptionDbId,
    jobDescriptionId: jobDescriptionDbId,
    jobDescriptionCode,
    jobDescriptionTitle,

    status: row.status || "Active",
    departmentAccount,
    description: row.description || "",
    preferredSkills: row.preferredSkills || row.preferred_skills || "",
    remarks: row.remarks || "",
  };
}

function unwrapOpenPositionsPayload(response) {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.positions)) return payload.positions;
  if (Array.isArray(payload?.openPositions)) return payload.openPositions;
  if (Array.isArray(payload?.open_positions)) return payload.open_positions;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.records)) return payload.data.records;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.positions)) return payload.data.positions;

  return [];
}

function DropdownPortal({
  open,
  anchorRef,
  children,
  onClose,
  maxHeight = 256,
  matchAnchorWidth = true,
  width,
  offset = 8,
  className = "",
  innerClassName = "overflow-y-auto py-2 sibs-scrollbar",
}) {
  const dropdownRef = useRef(null);
  const [style, setStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight,
  });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    function updatePosition() {
      const rect = anchorRef.current.getBoundingClientRect();
      const viewportPadding = 12;
      const availableWidth = window.innerWidth - viewportPadding * 2;
      const panelWidth = Math.min(
        width || (matchAnchorWidth ? rect.width : Math.max(rect.width, 280)),
        availableWidth,
      );
      const panelMaxHeight = Math.min(
        maxHeight,
        window.innerHeight - viewportPadding * 2,
      );
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
      const spaceAbove = rect.top - viewportPadding;
      const shouldOpenUp =
        spaceBelow < panelMaxHeight && spaceAbove > spaceBelow;
      const top = shouldOpenUp
        ? Math.max(viewportPadding, rect.top - panelMaxHeight - offset)
        : Math.min(rect.bottom + offset, window.innerHeight - viewportPadding);
      const left = Math.min(
        Math.max(viewportPadding, rect.left),
        window.innerWidth - panelWidth - viewportPadding,
      );

      setStyle({
        top,
        left,
        width: panelWidth,
        maxHeight: panelMaxHeight,
      });
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorRef, matchAnchorWidth, maxHeight, offset, width]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      const clickedAnchor = anchorRef.current?.contains(e.target);
      const clickedDropdown = dropdownRef.current?.contains(e.target);

      if (!clickedAnchor && !clickedDropdown) {
        onClose?.();
      }
    }

    function handleEscape(e) {
      if (e.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, anchorRef, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dropdownRef}
      className={`fixed z-[999999] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl ${className}`}
      style={{
        top: `${style.top}px`,
        left: `${style.left}px`,
        width: `${style.width}px`,
      }}
    >
      <div
        className={innerClassName}
        style={{ maxHeight: style.maxHeight }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function CustomSelect({
  value,
  options = [],
  onChange,
  placeholder = "Select",
  disabled = false,
  optionValue = (option) => option,
  optionLabel = (option) => option,
  optionDescription = null,
  searchable = false,
  searchPlaceholder = "Search...",
  loading = false,
  loadingMessage = "Loading...",
  emptyMessage = "No matching record found.",
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const anchorRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = options.find(
    (option) => String(optionValue(option)) === String(value),
  );

  const selectedLabel = selectedOption ? optionLabel(selectedOption) : "";

  const selectableOptions = useMemo(() => {
    return searchable ? options.filter((option) => !option.disabled) : options;
  }, [options, searchable]);

  const filteredOptions = useMemo(() => {
    const query = cleanText(searchQuery).toLowerCase();

    if (!searchable || !query) return selectableOptions;

    return selectableOptions.filter((option) => {
      const label = cleanText(optionLabel(option)).toLowerCase();

      const description = cleanText(
        optionDescription ? optionDescription(option) : "",
      ).toLowerCase();

      const positionTitle = cleanText(
        option.positionTitle || option.raw?.positionTitle,
      ).toLowerCase();

      const positionId = cleanText(
        option.positionId || option.raw?.positionId,
      ).toLowerCase();

      const jobDescriptionCode = cleanText(
        option.jobDescriptionCode || option.raw?.jobDescriptionCode,
      ).toLowerCase();

      const jobDescriptionTitle = cleanText(
        option.jobDescriptionTitle || option.raw?.jobDescriptionTitle,
      ).toLowerCase();

      const accountName = cleanText(
        option.accountName || option.raw?.accountName,
      ).toLowerCase();

      const accountId = cleanText(
        option.accountId || option.raw?.accountId,
      ).toLowerCase();

      const department = cleanText(
        option.department || option.raw?.department,
      ).toLowerCase();

      const departmentAccount = cleanText(
        option.departmentAccount || option.raw?.departmentAccount,
      ).toLowerCase();

      const cluster = cleanText(
        option.cluster || option.raw?.cluster,
      ).toLowerCase();

      return (
        label.includes(query) ||
        description.includes(query) ||
        positionTitle.includes(query) ||
        positionId.includes(query) ||
        jobDescriptionCode.includes(query) ||
        jobDescriptionTitle.includes(query) ||
        accountName.includes(query) ||
        accountId.includes(query) ||
        department.includes(query) ||
        departmentAccount.includes(query) ||
        cluster.includes(query)
      );
    });
  }, [
    searchable,
    searchQuery,
    selectableOptions,
    optionDescription,
    optionLabel,
  ]);

  function handleOpen() {
    if (disabled) return;

    if (!open && searchable) {
      setSearchQuery("");
    }

    setOpen(true);

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  function handleClose() {
    setOpen(false);
    setSearchQuery("");
  }

  if (searchable) {
    return (
      <div ref={anchorRef} className="relative">
        <div
          onClick={handleOpen}
          className={`flex h-10 w-full items-center gap-2 rounded-[10px] border px-3 transition-all duration-200 ${disabled
              ? "cursor-not-allowed border-[#D0D5DD] bg-[#F2F4F7] text-[#667085]"
              : open
                ? "border-[#FF5C28] bg-white text-[#344054] ring-4 ring-[#FF5C28]/10"
                : "border-[#D0D5DD] bg-white text-[#344054] hover:border-[#FF5C28]/40 hover:bg-white"
            }`}
        >
          <Search size={17} className="shrink-0 text-sibs-tertiary-5" />

          <input
            ref={inputRef}
            type="text"
            disabled={disabled}
            value={open ? searchQuery : selectedLabel}
            onFocus={handleOpen}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                handleClose();
              }

              if (e.key === "Enter") {
                e.preventDefault();

                const firstOption = filteredOptions[0];

                if (firstOption) {
                  onChange(optionValue(firstOption), firstOption);
                  handleClose();
                }
              }
            }}
            placeholder={open ? searchPlaceholder : placeholder}
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#344054] outline-none placeholder:text-sibs-tertiary-5"
          />

          <ChevronDown
            size={18}
            className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${open ? "rotate-180" : ""
              }`}
          />
        </div>

        <DropdownPortal
          open={open && !disabled}
          anchorRef={anchorRef}
          onClose={handleClose}
          maxHeight={280}
        >
          {loading ? (
            <div className="px-4 py-4 text-sm font-semibold text-sibs-tertiary-5">
              {loadingMessage}
            </div>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const currentValue = optionValue(option);
              const currentLabel = optionLabel(option);
              const currentDescription = optionDescription
                ? optionDescription(option)
                : "";
              const selected = String(value) === String(currentValue);

              return (
                <button
                  key={currentValue || currentLabel}
                  type="button"
                  onClick={() => {
                    onChange(currentValue, option);
                    handleClose();
                  }}
                  className={`block w-full px-4 py-3 text-left text-sm transition ${selected
                      ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                      : "text-[#344054] hover:bg-[#F8FAFC]"
                    }`}
                >
                  <span className="block truncate">{currentLabel}</span>

                  {currentDescription && (
                    <span className="mt-1 block truncate text-xs font-semibold text-sibs-tertiary-5">
                      {currentDescription}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="px-4 py-4 text-sm font-semibold text-sibs-tertiary-5">
              {emptyMessage}
            </div>
          )}
        </DropdownPortal>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-10 w-full items-center justify-between rounded-[10px] border px-3 text-left text-sm font-bold outline-none transition-all duration-200 ${disabled
            ? "cursor-not-allowed border-[#D0D5DD] bg-[#F2F4F7] text-[#667085]"
            : open
              ? "border-[#FF5C28] bg-white text-[#344054] ring-4 ring-[#FF5C28]/10"
              : "border-[#D0D5DD] bg-white text-[#344054] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10"
          }`}
      >
        <span
          className={`truncate ${selectedOption ? "text-[#344054]" : "text-sibs-tertiary-5"
            }`}
        >
          {selectedLabel || placeholder}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${open ? "rotate-180" : ""
            }`}
        />
      </button>

      <DropdownPortal
        open={open && !disabled}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
      >
        {options.length > 0 ? (
          options.map((option) => {
            const currentValue = optionValue(option);
            const currentLabel = optionLabel(option);
            const currentDescription = optionDescription
              ? optionDescription(option)
              : "";
            const selected = String(value) === String(currentValue);

            return (
              <button
                key={currentValue || currentLabel}
                type="button"
                disabled={option.disabled}
                onClick={() => {
                  if (option.disabled) return;

                  onChange(currentValue, option);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-3 text-left text-sm transition ${option.disabled
                    ? "cursor-not-allowed text-sibs-tertiary-5"
                    : selected
                      ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                      : "text-[#344054] hover:bg-[#F8FAFC]"
                  }`}
              >
                <span className="block truncate">{currentLabel}</span>

                {currentDescription && (
                  <span className="mt-1 block truncate text-xs font-semibold text-sibs-tertiary-5">
                    {currentDescription}
                  </span>
                )}
              </button>
            );
          })
        ) : (
          <div className="px-4 py-4 text-sm font-semibold text-sibs-tertiary-5">
            No options available.
          </div>
        )}
      </DropdownPortal>
    </div>
  );
}

function DateDropdown({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const selectedDate = useMemo(() => {
    if (!value) return null;

    const [year, month, day] = String(value).split("-").map(Number);

    if (!year || !month || !day) return null;

    const parsed = new Date(year, month - 1, day);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [value]);

  const [viewDate, setViewDate] = useState(() => selectedDate || new Date());

  const calendarDays = useMemo(() => getCalendarDays(viewDate), [viewDate]);
  const today = new Date();

  useEffect(() => {
    if (selectedDate) {
      // Keep the calendar viewport aligned when an existing value is edited.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

  function goToPreviousMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function handleSelectDate(date) {
    onChange(toDateInputValue(date));
    setOpen(false);
  }

  function handleTodayClick() {
    const currentDate = new Date();

    onChange(toDateInputValue(currentDate));
    setViewDate(currentDate);
    setOpen(false);
  }

  const monthTitle = viewDate.toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });

  const displayValue = value ? formatShortDate(value) : placeholder;

  return (
    <div ref={anchorRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-10 w-full items-center justify-between rounded-[10px] border px-3 text-left text-sm font-bold outline-none transition-all duration-200 ${disabled
            ? "cursor-not-allowed border-[#D0D5DD] bg-[#F2F4F7] text-[#667085]"
            : open
              ? "border-[#FF5C28] bg-white text-[#344054] ring-4 ring-[#FF5C28]/10"
              : "border-[#E6ECF2] bg-white text-[#344054] hover:border-sibs-primary-1/30 hover:bg-slate-50 focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10"
          }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays size={17} className="shrink-0 text-sibs-tertiary-5" />

          <span
            className={`truncate ${value ? "text-[#344054]" : "text-sibs-tertiary-5"
              }`}
          >
            {displayValue}
          </span>
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${open ? "rotate-180" : ""
            }`}
        />
      </button>

      <DropdownPortal
        open={open && !disabled}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
        maxHeight={420}
        matchAnchorWidth={false}
        width={280}
        className="rounded-2xl border-[#D7DEE8]"
        innerClassName="p-3"
      >
        <div className="mb-3 flex items-center justify-between rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FF5C28]/35 hover:bg-[#FFF7F3] hover:text-[#FF5C28] hover:shadow-sm active:scale-[0.98]"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>

          <p className="text-xs font-extrabold text-sibs-primary-1">
            {monthTitle}
          </p>

          <button
            type="button"
            onClick={goToNextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FF5C28]/35 hover:bg-[#FFF7F3] hover:text-[#FF5C28] hover:shadow-sm active:scale-[0.98]"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((day) => (
            <div
              key={day}
              className="py-1.5 text-center text-[10px] font-extrabold uppercase tracking-normal text-[#98A2B3]"
            >
              {day}
            </div>
          ))}

          {calendarDays.map((date) => {
            const currentMonth = date.getMonth() === viewDate.getMonth();
            const active = selectedDate && isSameDate(date, selectedDate);
            const isToday = isSameDate(date, today);

            return (
              <button
                key={toDateInputValue(date)}
                type="button"
                onClick={() => handleSelectDate(date)}
                className={`flex h-8 items-center justify-center rounded-lg text-xs font-extrabold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${active
                    ? "bg-[#FF5C28] text-white shadow-sm"
                    : isToday
                      ? "border border-[#B9D7FF] bg-[#EFF6FF] text-[#042C51]"
                      : currentMonth
                        ? "border border-transparent bg-white text-[#042C51] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                        : "border border-transparent bg-white text-[#C7D2E0] hover:bg-[#F8FAFC]"
                  }`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#E6ECF2] pt-3">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white px-3 text-xs font-extrabold text-sibs-tertiary-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FF5C28]/35 hover:bg-[#FFF7F3] hover:text-[#FF5C28] hover:shadow-sm active:scale-[0.98]"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={handleTodayClick}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-sibs-primary-1 px-3 text-xs font-extrabold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D4676] hover:shadow-md active:scale-[0.98]"
          >
            Today
          </button>
        </div>
      </DropdownPortal>
    </div>
  );
}

const initialForm = {
  requestType: "", // requisition | downsize

  openPositionDbId: "",
  positionId: "",
  positionTitle: "",
  departmentAccount: "",
  accountId: "",
  departmentId: "",
  accountName: "",
  department: "",
  locationSite: "Davao Site",
  downsizeAccountKey: "",
  downsizeCluster: "",
  previousRequiredHeadcount: "",
  previousRequiredHeadcountStatus: "",
  previousRequiredHeadcountSource: "",
  weeklyHiringPlanHeadcountId: "",
  weeklyWeekKey: "",
  weeklyWeekLabel: "",
  weeklyWeekDateRange: "",
  weeklyWeekStart: "",
  weeklyWeekEnd: "",

  jobDescriptionDbId: "",
  jobDescriptionId: "",
  jobDescriptionCode: "",
  jobDescriptionTitle: "",

  headcount: "",
  reasonForHiring: "",
  downsizeReason: "",
  assignment: "Probationary",
  assignmentOther: "",
  dateNeeded: "",
  preparedBy: "",
  preparedById: "",
  sibsIdManager: "",
  hiringManager: "",
  approvalStatus: "For Approval",
};

export default function AddHiringNeedsModal({ open, onClose, onStatus }) {
  const { user } = useUser();
  const { fetchList, reasonForHiringOptions } = useHiringNeeds();

  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openPositions, setOpenPositions] = useState([]);
  const [positionLoading, setPositionLoading] = useState(false);
  const [weeklyWeeks, setWeeklyWeeks] = useState([]);
  const [weeklyWeeksLoading, setWeeklyWeeksLoading] = useState(false);
  const [weeklyAccounts, setWeeklyAccounts] = useState([]);
  const [weeklyAccountsLoading, setWeeklyAccountsLoading] = useState(false);
  const [downsizeFile, setDownsizeFile] = useState(null);
  const [downsizeFilePreviewUrl, setDownsizeFilePreviewUrl] = useState("");

  useEffect(() => {
    if (!downsizeFile) {
      setDownsizeFilePreviewUrl("");
      return;
    }

    const previewUrl = URL.createObjectURL(downsizeFile);
    setDownsizeFilePreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [downsizeFile]);

  const downsizeFileIsImage = downsizeFile?.type?.startsWith("image/");

  useEffect(() => {
    if (!open || !user) return;

    const sibsId = getUserSibsId(user);
    const hiringManager = getUserDisplayName(user);
    const preparedBy = formatPreparedByUser(user);

    setForm((prev) => ({
      ...prev,
      locationSite: normalizeLocationSite(prev.locationSite),
      preparedBy,
      preparedById: sibsId,
      sibsIdManager: sibsId,
      hiringManager,
    }));
  }, [open, user]);

  useEffect(() => {
    let isActive = true;

    async function loadOpenPositions() {
      if (!open) return;

      setPositionLoading(true);

      try {
        const response = await getTalentPoolOpenPositions({
          page: 1,
          limit: 500,
          status: "Active",
        });

        if (!isActive) return;

        const rows = unwrapOpenPositionsPayload(response)
          .map(normalizePosition)
          .filter((item) => item.positionTitle);

        const visibleRows = filterHiringNeedPositionsForUser(
          rows,
          user || {},
        );

        setOpenPositions(visibleRows);
      } catch (error) {
        if (!isActive) return;

        setOpenPositions([]);

        onStatus?.({
          type: "error",
          title: "Unable to Load Positions",
          message:
            error?.message ||
            "Failed to load positions from talent_pool_open_positions.",
        });
      } finally {
        if (isActive) {
          setPositionLoading(false);
        }
      }
    }

    loadOpenPositions();

    return () => {
      isActive = false;
    };
  }, [open, onStatus, user]);

  useEffect(() => {
    let isActive = true;

    async function loadWeeklyWeeks() {
      if (!open) return;

      setWeeklyWeeksLoading(true);

      try {
        const rows = await getWorkforceHiringPlanWeeks();

        if (!isActive) return;

        const normalizedWeeks = (Array.isArray(rows) ? rows : [])
          .map(normalizeWeeklyWeek)
          .filter((item) => item.weekKey && item.weekKey !== "default-week");

        setWeeklyWeeks(normalizedWeeks);
      } catch (error) {
        if (!isActive) return;

        setWeeklyWeeks([]);

        onStatus?.({
          type: "error",
          title: "Unable to Load Weeks",
          message:
            error?.message ||
            "Failed to load weeks from the Weekly Hiring Plan.",
        });
      } finally {
        if (isActive) {
          setWeeklyWeeksLoading(false);
        }
      }
    }

    loadWeeklyWeeks();

    return () => {
      isActive = false;
    };
  }, [open, onStatus]);

  useEffect(() => {
    if (!open || form.requestType !== "downsize") return;
    if (form.weeklyWeekKey || weeklyWeeks.length === 0) return;

    const firstWeek = weeklyWeeks[0];

    setForm((prev) => ({
      ...prev,
      weeklyWeekKey: firstWeek.value || firstWeek.weekKey || "",
      weeklyWeekLabel: firstWeek.label || firstWeek.weekLabel || "",
      weeklyWeekDateRange:
        firstWeek.weekDateRange ||
        firstWeek.dateRange ||
        getWeeklyWeekDateRange(firstWeek.weekStart, firstWeek.weekEnd),
      weeklyWeekStart: firstWeek.weekStart || "",
      weeklyWeekEnd: firstWeek.weekEnd || "",
    }));
  }, [open, form.requestType, form.weeklyWeekKey, weeklyWeeks]);

  useEffect(() => {
    let isActive = true;

    async function loadWeeklyAccounts() {
      if (!open || form.requestType !== "downsize" || !form.weeklyWeekKey) {
        setWeeklyAccounts([]);
        return;
      }

      setWeeklyAccountsLoading(true);

      const selectedWeek = weeklyWeeks.find(
        (week) => String(week.value) === String(form.weeklyWeekKey),
      ) || {
        weekKey: form.weeklyWeekKey,
        weekLabel: form.weeklyWeekLabel,
        weekDateRange: form.weeklyWeekDateRange,
        dateRange: form.weeklyWeekDateRange,
        weekStart: form.weeklyWeekStart,
        weekEnd: form.weeklyWeekEnd,
        startDate: form.weeklyWeekStart,
        endDate: form.weeklyWeekEnd,
      };

      try {
        const rows = await getWorkforceHiringPlanAccounts(
          "All",
          selectedWeek.weekStart || form.weeklyWeekStart,
          selectedWeek.weekEnd || form.weeklyWeekEnd,
        );

        if (!isActive) return;

        const normalizedRows = (Array.isArray(rows) ? rows : [])
          .map((row, index) => normalizeWeeklyAccount(row, index, selectedWeek))
          .filter((item) => item.accountName);

        setWeeklyAccounts(normalizedRows);
      } catch (error) {
        if (!isActive) return;

        setWeeklyAccounts([]);

        onStatus?.({
          type: "error",
          title: "Unable to Load Weekly Accounts",
          message:
            error?.message ||
            "Failed to load accounts from the selected Weekly Hiring Plan week.",
        });
      } finally {
        if (isActive) {
          setWeeklyAccountsLoading(false);
        }
      }
    }

    loadWeeklyAccounts();

    return () => {
      isActive = false;
    };
  }, [
    open,
    form.requestType,
    form.weeklyWeekKey,
    form.weeklyWeekLabel,
    form.weeklyWeekDateRange,
    form.weeklyWeekStart,
    form.weeklyWeekEnd,
    weeklyWeeks,
    onStatus,
  ]);

  if (!open) return null;

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: field === "locationSite" ? normalizeLocationSite(value) : value,
    }));
  }

  function handleRequestTypeChange(value) {
    const sibsId = getUserSibsId(user);
    const hiringManager = getUserDisplayName(user);
    const preparedBy = formatPreparedByUser(user);

    setDownsizeFile(null);

    setForm({
      ...initialForm,
      requestType: value,
      locationSite: "Davao Site",
      preparedBy,
      preparedById: sibsId,
      sibsIdManager: sibsId,
      hiringManager,
    });
  }

  function handleReset() {
    const sibsId = getUserSibsId(user);
    const hiringManager = getUserDisplayName(user);
    const preparedBy = formatPreparedByUser(user);

    setDownsizeFile(null);

    setForm({
      ...initialForm,
      locationSite: "Davao Site",
      preparedBy,
      preparedById: sibsId,
      sibsIdManager: sibsId,
      hiringManager,
    });
  }

  function handlePositionChange(positionKey, selectedPosition) {
    const position =
      selectedPosition ||
      openPositions.find((item) => String(item.id) === String(positionKey));

    if (!position) {
      handleReset();
      return;
    }

    const jobDescriptionDbId = normalizeDbId(
      position.jobDescriptionDbId || position.jobDescriptionId || "",
    );

    setForm((prev) => ({
      ...prev,

      openPositionDbId: position.openPositionDbId || position.id || "",
      positionId: position.positionId || "",
      positionTitle: position.positionTitle || "",

      department: position.department || "",
      departmentId: position.departmentId || "",
      accountId: position.accountId || "",
      accountName: position.accountName || "",
      departmentAccount: position.departmentAccount || "",

      locationSite: normalizeLocationSite(
        position.locationSite || prev.locationSite || "Davao Site",
      ),

      jobDescriptionDbId,
      jobDescriptionId: jobDescriptionDbId,

      jobDescriptionCode: position.jobDescriptionCode || position.positionId || "",
      jobDescriptionTitle:
        position.jobDescriptionTitle || position.positionTitle || "",
    }));
  }

  function handleWeeklyWeekChange(weekKey, selectedWeek) {
    setWeeklyAccounts([]);

    setForm((prev) => ({
      ...prev,
      weeklyWeekKey: weekKey || "",
      weeklyWeekLabel: selectedWeek?.label || selectedWeek?.weekLabel || "",
      weeklyWeekDateRange:
        selectedWeek?.weekDateRange ||
        selectedWeek?.dateRange ||
        getWeeklyWeekDateRange(selectedWeek?.weekStart, selectedWeek?.weekEnd),
      weeklyWeekStart: selectedWeek?.weekStart || "",
      weeklyWeekEnd: selectedWeek?.weekEnd || "",

      downsizeAccountKey: "",
      accountId: "",
      accountName: "",
      department: "",
      departmentId: "",
      departmentAccount: "",
      downsizeCluster: "",
      previousRequiredHeadcount: "",
      previousRequiredHeadcountStatus: "",
      previousRequiredHeadcountSource: "",
      weeklyHiringPlanHeadcountId: "",
    }));
  }

  function handleDownsizeAccountChange(accountKey, selectedAccount) {
    const account =
      selectedAccount ||
      accountOptions.find((item) => String(item.value) === String(accountKey));

    if (!account) {
      setForm((prev) => ({
        ...prev,
        downsizeAccountKey: "",
        accountId: "",
        accountName: "",
        department: "",
        departmentId: "",
        departmentAccount: "",
        downsizeCluster: "",
        previousRequiredHeadcount: "",
        previousRequiredHeadcountStatus: "",
        previousRequiredHeadcountSource: "",
        weeklyHiringPlanHeadcountId: "",
      }));
      return;
    }

    const accountName = cleanText(account.accountName || account.label || "");
    const department = cleanText(account.department || "");
    const departmentAccount =
      account.departmentAccount ||
      [department, accountName].filter(Boolean).join(" / ") ||
      accountName;

    setForm((prev) => ({
      ...prev,
      downsizeAccountKey: account.value || accountKey,
      accountId: account.accountId || "",
      accountName,
      department,
      departmentId: account.departmentId || "",
      departmentAccount,
      downsizeCluster: account.cluster || "",
      previousRequiredHeadcount: String(account.previousRequiredHeadcount ?? 0),
      previousRequiredHeadcountStatus: hideKronosStatus(account.status),
      previousRequiredHeadcountSource: account.requiredHeadcountSource || "",
      weeklyHiringPlanHeadcountId: account.weeklyHiringPlanHeadcountId || "",
      weeklyWeekKey: account.weekKey || prev.weeklyWeekKey || "",
      weeklyWeekLabel: account.weekLabel || prev.weeklyWeekLabel || "",
      weeklyWeekDateRange:
        account.weekDateRange ||
        account.dateRange ||
        prev.weeklyWeekDateRange ||
        getWeeklyWeekDateRange(account.weekStart, account.weekEnd),
      weeklyWeekStart: account.weekStart || prev.weeklyWeekStart || "",
      weeklyWeekEnd: account.weekEnd || prev.weeklyWeekEnd || "",
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.requestType) {
      onStatus?.({
        type: "error",
        title: "Required",
        message: "Please select Request Type.",
      });
      return;
    }

    if (form.requestType === "downsize") {
      if (!form.weeklyWeekKey) {
        onStatus?.({
          type: "error",
          title: "Required",
          message: "Please select a week.",
        });
        return;
      }

      if (!form.downsizeAccountKey && !form.accountId && !form.accountName) {
        onStatus?.({
          type: "error",
          title: "Required",
          message: "Account is required for downsize requests.",
        });
        return;
      }

      if (!form.headcount || Number(form.headcount) <= 0) {
        onStatus?.({
          type: "error",
          title: "Invalid",
          message: "Required Headcount must be greater than 0.",
        });
        return;
      }

      if (!cleanText(form.downsizeReason)) {
        onStatus?.({
          type: "error",
          title: "Required",
          message: "Reason for downsize is required.",
        });
        return;
      }

      if (!downsizeFile) {
        onStatus?.({
          type: "error",
          title: "Required",
          message: "Please upload a supporting image or file.",
        });
        return;
      }

      setIsSubmitting(true);

      try {
        const payload = new FormData();

        const downsizeTitle = form.accountName
          ? `DOWNSIZE REQUEST - ${form.accountName}`
          : "DOWNSIZE REQUEST";

        payload.append("requestType", "Downsize");
        payload.append("request_type", "Downsize");
        payload.append("positionTitle", downsizeTitle);
        payload.append("roleTitle", downsizeTitle);
        payload.append("accountId", form.accountId || "");
        payload.append("account_id", form.accountId || "");
        payload.append("accountName", form.accountName || "");
        payload.append("account_name", form.accountName || "");
        payload.append("department", form.department || "");
        payload.append("departmentId", form.departmentId || "");
        payload.append("department_id", form.departmentId || "");
        payload.append("departmentAccount", form.departmentAccount || form.accountName || "");
        payload.append("department_account", form.departmentAccount || form.accountName || "");
        payload.append("cluster", form.downsizeCluster || "");
        payload.append("clusterName", form.downsizeCluster || "");
        payload.append("cluster_name", form.downsizeCluster || "");
        payload.append("previousRequiredHeadcount", form.previousRequiredHeadcount || "0");
        payload.append("previous_required_headcount", form.previousRequiredHeadcount || "0");
        payload.append("previousRequiredHeadcountStatus", form.previousRequiredHeadcountStatus || "");
        payload.append("previous_required_headcount_status", form.previousRequiredHeadcountStatus || "");
        payload.append("previousRequiredHeadcountSource", form.previousRequiredHeadcountSource || "");
        payload.append("previous_required_headcount_source", form.previousRequiredHeadcountSource || "");
        payload.append("weeklyHiringPlanHeadcountId", form.weeklyHiringPlanHeadcountId || "");
        payload.append("weekly_hiring_plan_headcount_id", form.weeklyHiringPlanHeadcountId || "");
        payload.append("weeklyWeekKey", form.weeklyWeekKey || "");
        payload.append("weekly_week_key", form.weeklyWeekKey || "");
        payload.append("weeklyWeekLabel", form.weeklyWeekLabel || "");
        payload.append("weekly_week_label", form.weeklyWeekLabel || "");
        payload.append("weeklyWeekDateRange", form.weeklyWeekDateRange || "");
        payload.append("weekly_week_date_range", form.weeklyWeekDateRange || "");
        payload.append("weeklyWeekStart", form.weeklyWeekStart || "");
        payload.append("weekly_week_start", form.weeklyWeekStart || "");
        payload.append("weeklyWeekEnd", form.weeklyWeekEnd || "");
        payload.append("weekly_week_end", form.weeklyWeekEnd || "");
        payload.append("requiredHeadcount", form.headcount);
        payload.append("required_headcount", form.headcount);
        payload.append("headcount", form.headcount);
        payload.append("approvedRequirement", form.headcount);
        payload.append("reasonForHiring", form.downsizeReason);
        payload.append("reason", form.downsizeReason);
        payload.append("downsizeReason", form.downsizeReason);
        payload.append("preparedBy", form.preparedBy || formatPreparedByUser(user));
        payload.append("preparedById", form.preparedById || getUserSibsId(user));
        payload.append("sibsIdManager", form.sibsIdManager || getUserSibsId(user));
        payload.append("sibs_id_manager", form.sibsIdManager || getUserSibsId(user));
        payload.append("hiringManager", form.hiringManager || getUserDisplayName(user));
        payload.append("hiring_manager", form.hiringManager || getUserDisplayName(user));
        payload.append("approvalStatus", form.approvalStatus || "For Approval");
        payload.append("approval_status", form.approvalStatus || "For Approval");
        payload.append("supportingFile", downsizeFile);

        const res = await createHiringNeed(payload);

        if (res?.success || res?.id || res?.data?.id) {
          onStatus?.({
            type: "success",
            title: "Submitted",
            message: "Downsize request submitted successfully.",
          });

          fetchList();
          handleReset();
          onClose();
        } else {
          throw new Error(res?.message || "Failed to submit downsize request.");
        }
      } catch (err) {
        onStatus?.({
          type: "error",
          title: "Submission Failed",
          message: err?.message || "Failed to submit downsize request.",
        });
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    if (!form.openPositionDbId && !form.positionId && !form.positionTitle) {
      onStatus?.({
        type: "error",
        title: "Required",
        message: "Position Title is required.",
      });
      return;
    }

    if (!form.headcount || Number(form.headcount) <= 0) {
      onStatus?.({
        type: "error",
        title: "Invalid",
        message: "Headcount must be greater than 0.",
      });
      return;
    }

    if (!form.reasonForHiring) {
      onStatus?.({
        type: "error",
        title: "Required",
        message: "Reason for Hiring is required.",
      });
      return;
    }

    if (!form.dateNeeded) {
      onStatus?.({
        type: "error",
        title: "Required",
        message: "Date Needed is required.",
      });
      return;
    }

    if (form.assignment === "Other" && !cleanText(form.assignmentOther)) {
      onStatus?.({
        type: "error",
        title: "Required",
        message: "Please enter other assignment information.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const jobDescriptionDbId = normalizeDbId(
        form.jobDescriptionDbId || form.jobDescriptionId || "",
      );

      const payload = {
        ...form,

        requestType: "Requisition",
        request_type: "Requisition",

        locationSite: normalizeLocationSite(form.locationSite),

        preparedBy: form.preparedBy || formatPreparedByUser(user),
        preparedById: form.preparedById || getUserSibsId(user),
        sibsIdManager: form.sibsIdManager || form.preparedById || getUserSibsId(user),
        sibs_id_manager: form.sibsIdManager || form.preparedById || getUserSibsId(user),
        hiringManager: form.hiringManager || getUserDisplayName(user),
        hiring_manager: form.hiringManager || getUserDisplayName(user),

        jobDescriptionDbId,
        jobDescriptionId: jobDescriptionDbId,
        jobDescriptionCode: form.jobDescriptionCode || form.positionId,
        jobDescriptionTitle: form.jobDescriptionTitle || form.positionTitle,

        departmentAccount:
          form.departmentAccount ||
          [form.department, form.accountName].filter(Boolean).join(" / "),
      };

      const res = await createHiringNeed(payload);

      if (res?.success || res?.id || res?.data?.id) {
        onStatus?.({
          type: "success",
          title: "Submitted",
          message: "Personnel Requisition submitted successfully.",
        });

        fetchList();
        handleReset();
        onClose();
      } else {
        throw new Error(res?.message || "Failed to submit request.");
      }
    } catch (err) {
      onStatus?.({
        type: "error",
        title: "Submission Failed",
        message: err?.message || "Failed to submit personnel requisition.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAssignmentChange(value) {
    setForm((prev) => ({
      ...prev,
      assignment: value,
      assignmentOther: value === "Other" ? prev.assignmentOther : "",
    }));
  }

  const requestTypeOptions = [
    {
      value: "",
      label: "Select Request Type",
      disabled: true,
    },
    {
      value: "requisition",
      label: "Requisition",
    },
    {
      value: "downsize",
      label: "Downsize",
    },
  ];

  const currentLocationSite = normalizeLocationSite(form.locationSite);

  const positionOptions = [
    {
      value: "",
      label: positionLoading ? "Loading positions..." : "Select Position Title",
      description: "",
      disabled: true,
    },
    ...openPositions.map((item) => ({
      value: item.id,
      label: item.positionTitle,
      description:
        item.departmentAccount ||
        item.locationSite ||
        item.accountName ||
        item.department ||
        "",
      raw: item,
    })),
  ];

  const weeklyWeekOptions = [
    {
      value: "",
      label: weeklyWeeksLoading ? "Loading weeks..." : "Select Week",
      disabled: true,
    },
    ...weeklyWeeks.map((week) => ({
      ...week,
      value: week.value || week.weekKey,
      label: week.label || week.weekLabel,
      description:
        week.weekDateRange ||
        week.dateRange ||
        getWeeklyWeekDateRange(week.weekStart, week.weekEnd),
    })),
  ];

  const accountOptions = [
    {
      value: "",
      label: weeklyAccountsLoading
        ? "Loading accounts..."
        : form.weeklyWeekKey
          ? ""
          : "Select week first",
      description: "",
      disabled: true,
    },
    ...weeklyAccounts.map((account) => {
      const status = hideKronosStatus(account.status);

      return {
        ...account,
        label: account.accountName || account.accountId,
        description: `${account.cluster || "Weekly Hiring"} • ${account.weekDateRange ||
          account.dateRange ||
          getWeeklyWeekDateRange(account.weekStart, account.weekEnd) ||
          form.weeklyWeekDateRange ||
          "Selected Week"
          } • Required Headcount: ${formatNumber(account.previousRequiredHeadcount)}${status ? ` • ${status}` : ""
          }`,
      };
    }),
  ];

  const reasonOptions = [
    {
      value: "",
      label: "Select Reason",
    },
    ...reasonForHiringOptions.map((reason) => ({
      value: reason,
      label: reason,
    })),
  ];

  const assignmentOptions = [
    {
      value: "Probationary",
      label: "Probationary",
    },
    {
      value: "Permanent/Regular",
      label: "Permanent / Regular",
    },
    {
      value: "Other",
      label: "Other",
    },
  ];

  const locationOptions = [
    {
      value: "Davao Site",
      label: "Davao Site",
    },
    {
      value: "Tagum Site",
      label: "Tagum Site",
    },
    {
      value: "Mabini Site",
      label: "Mabini Site",
    },
    ...(currentLocationSite &&
      !VALID_LOCATION_SITES.includes(currentLocationSite)
      ? [
        {
          value: currentLocationSite,
          label: currentLocationSite,
        },
      ]
      : []),
  ];

  return (
    <div
      className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[99999] flex h-dvh items-center justify-center p-2 font-jakarta sm:p-4"
      onClick={() => {
        if (!isSubmitting) onClose?.();
      }}
    >
      <form
        id="add-hiring-needs-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-hiring-needs-title"
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="sibs-modal-pop-in flex max-h-[92dvh] w-full max-w-[1050px] flex-col overflow-hidden rounded-2xl border border-[#9FB3C8] bg-[#F7F9FC] shadow-[0_30px_90px_rgba(2,26,48,0.42)]"
      >
        <header className="shrink-0 bg-[#07365F] px-4 py-4 text-white sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#FF5C28]">
                <FileText size={20} />
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="add-hiring-needs-title"
                    className="text-base font-extrabold text-white"
                  >
                    New Personnel Requisition
                  </h2>

                  <span className="inline-flex rounded bg-[#FF5C28] px-2.5 py-1 text-[9px] font-extrabold uppercase text-white">
                    {form.requestType === "downsize"
                      ? "Downsize"
                      : form.requestType === "requisition"
                        ? "Requisition"
                        : "New Request"}
                  </span>
                </div>

                <p className="mt-0.5 text-xs font-semibold leading-relaxed text-blue-100">
                  Create a Requisition or Downsize request and route it for approval.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-white/10 bg-white/10 px-3 text-[10px] font-extrabold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={14} />
                Reset
              </button>

              <button
                type="submit"
                form="add-hiring-needs-form"
                disabled={isSubmitting}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-[#FF5C28] px-3.5 text-[10px] font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#E95324] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Save size={14} />
                )}
                {isSubmitting ? "Submitting..." : "Submit for Approval"}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-blue-100 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close Personnel Requisition modal"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#F7F9FC] p-3 sm:p-5">
          <div className="space-y-4">
            <section className="rounded-2xl border border-blue-200 bg-[#EEF5FF] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#245BFF] text-white">
                    <Info size={16} />
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xs font-extrabold text-[#042C51]">
                        Personnel Request Guide
                      </h3>

                      <span className="rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-indigo-700">
                        {!form.requestType
                          ? "Select Request Type"
                          : form.requestType === "downsize"
                            ? "Downsize Mode"
                            : "Requisition Mode"}
                      </span>
                    </div>

                    <p className="mt-1 text-xs font-semibold leading-relaxed text-[#667085]">
                      {!form.requestType
                        ? "Select whether this request adds or reduces required headcount."
                        : form.requestType === "downsize"
                          ? "Select a Weekly Hiring Plan week and account, review the previous required headcount, then provide the adjustment and supporting evidence."
                          : "Select an active Talent Pool position, then complete the personnel requirement and ownership details."}
                    </p>
                  </div>
                </div>

                <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded bg-[#07365F] px-2.5 py-1 text-[9px] font-extrabold uppercase text-white">
                  <ShieldCheck size={12} className="text-[#FF5C28]" />
                  For Approval
                </span>
              </div>
            </section>

            {!form.requestType ? (
              <FormSection
                title="Request Type & Position"
                subtitle="Choose the personnel request workflow before completing its required fields."
                icon={SlidersHorizontal}
              >
                <div className="max-w-md">
                  <FieldLabel required>Request Type</FieldLabel>
                  <CustomSelect
                    value={form.requestType || ""}
                    options={requestTypeOptions}
                    onChange={handleRequestTypeChange}
                    placeholder="Select Request Type"
                    disabled={isSubmitting}
                    optionValue={(option) => option.value}
                    optionLabel={(option) => option.label}
                  />
                </div>
              </FormSection>
            ) : null}

            {form.requestType === "requisition" ? (
              <>
                <FormSection
                  title="Request Type & Position"
                  subtitle="Link the request to an active Talent Pool position and retain its current JD, department, account, and site references."
                  icon={BriefcaseBusiness}
                >
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                    <div>
                      <FieldLabel required>Request Type</FieldLabel>
                      <CustomSelect
                        value={form.requestType || ""}
                        options={requestTypeOptions}
                        onChange={handleRequestTypeChange}
                        placeholder="Select Request Type"
                        disabled={isSubmitting}
                        optionValue={(option) => option.value}
                        optionLabel={(option) => option.label}
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <FieldLabel required>Position Title</FieldLabel>
                      <CustomSelect
                        value={form.openPositionDbId || ""}
                        options={positionOptions}
                        onChange={(value, option) =>
                          handlePositionChange(value, option?.raw)
                        }
                        disabled={positionLoading || isSubmitting}
                        placeholder={
                          positionLoading
                            ? "Loading positions..."
                            : "Search position title..."
                        }
                        optionValue={(option) => option.value}
                        optionLabel={(option) => option.label}
                        optionDescription={(option) =>
                          option.description
                        }
                        searchable
                        searchPlaceholder="Search position title..."
                        loading={positionLoading}
                        loadingMessage="Loading positions..."
                        emptyMessage="No matching position found."
                      />

                      {!positionLoading &&
                        openPositions.length === 0 ? (
                        <p className="mt-2 rounded-[10px] border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                          No active positions were returned from
                          talent_pool_open_positions.
                        </p>
                      ) : null}
                    </div>

                    <div className="lg:col-span-3">
                      <FieldLabel required>
                        Department / Account
                      </FieldLabel>
                      <TextInput
                        value={form.departmentAccount || ""}
                        readOnly
                        disabled
                        placeholder="Auto-populated after selecting position"
                      />
                    </div>

                  </div>
                </FormSection>

                <FormSection
                  title="Personnel Requirement"
                  subtitle="Define the requested slots, business reason, assignment, site, and target date."
                  icon={Users}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <FieldLabel required>Headcount</FieldLabel>
                      <TextInput
                        type="number"
                        min="1"
                        value={form.headcount || ""}
                        onChange={(event) =>
                          updateField(
                            "headcount",
                            event.target.value,
                          )
                        }
                        placeholder="Enter requested headcount"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <FieldLabel required>
                        Reason for Hiring
                      </FieldLabel>
                      <CustomSelect
                        value={form.reasonForHiring || ""}
                        options={reasonOptions}
                        onChange={(value) =>
                          updateField("reasonForHiring", value)
                        }
                        placeholder="Select Reason"
                        disabled={isSubmitting}
                        optionValue={(option) => option.value}
                        optionLabel={(option) => option.label}
                      />
                    </div>

                    <div>
                      <FieldLabel required>Assignment</FieldLabel>
                      <CustomSelect
                        value={
                          form.assignment || "Probationary"
                        }
                        options={assignmentOptions}
                        onChange={handleAssignmentChange}
                        placeholder="Select Assignment"
                        disabled={isSubmitting}
                        optionValue={(option) => option.value}
                        optionLabel={(option) => option.label}
                      />
                    </div>

                    <div>
                      <FieldLabel required>
                        Location / Site
                      </FieldLabel>
                      <CustomSelect
                        value={currentLocationSite}
                        options={locationOptions}
                        onChange={(value) =>
                          updateField("locationSite", value)
                        }
                        placeholder="Select Location"
                        disabled={isSubmitting}
                        optionValue={(option) => option.value}
                        optionLabel={(option) => option.label}
                      />
                    </div>

                    <div>
                      <FieldLabel required>Date Needed</FieldLabel>
                      <DateDropdown
                        value={form.dateNeeded || ""}
                        onChange={(value) =>
                          updateField("dateNeeded", value)
                        }
                        placeholder="Select Date Needed"
                        disabled={isSubmitting}
                      />
                    </div>

                    {form.assignment === "Other" ? (
                      <div>
                        <FieldLabel required>
                          Other Assignment Information
                        </FieldLabel>
                        <TextInput
                          value={form.assignmentOther || ""}
                          onChange={(event) =>
                            updateField(
                              "assignmentOther",
                              event.target.value,
                            )
                          }
                          placeholder="Enter assignment information"
                          disabled={isSubmitting}
                        />
                      </div>
                    ) : null}
                  </div>
                </FormSection>

                <FormSection
                  title="Request Ownership & Approval"
                  subtitle="The request owner is derived from the logged-in user and the record will be routed for approval."
                  icon={ShieldCheck}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <FieldLabel required>
                        SIBS ID Manager
                      </FieldLabel>
                      <TextInput
                        value={
                          form.sibsIdManager ||
                          form.preparedById ||
                          ""
                        }
                        readOnly
                        disabled
                        placeholder="Logged-in SIBS ID"
                      />
                    </div>

                    <div>
                      <FieldLabel required>
                        Hiring Manager
                      </FieldLabel>
                      <TextInput
                        value={form.hiringManager || ""}
                        readOnly
                        disabled
                        placeholder="Logged-in manager name"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <FieldLabel>Approval Status</FieldLabel>
                      <div className="flex items-center justify-between rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2.5">
                        <div>
                          <p className="text-xs font-extrabold text-amber-700">
                            {form.approvalStatus ||
                              "For Approval"}
                          </p>
                          <p className="mt-0.5 text-[10px] font-semibold text-amber-600">
                            Submission routes this request through
                            the configured approval workflow.
                          </p>
                        </div>
                        <Clock
                          size={17}
                          className="shrink-0 text-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </FormSection>
              </>
            ) : null}

            {form.requestType === "downsize" ? (
              <>
                <FormSection
                  title="Week & Account"
                  subtitle="Select the Weekly Hiring Plan period and account that will receive the required-headcount reduction."
                  icon={CalendarDays}
                >
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                    <div>
                      <FieldLabel required>Request Type</FieldLabel>
                      <CustomSelect
                        value={form.requestType || ""}
                        options={requestTypeOptions}
                        onChange={handleRequestTypeChange}
                        placeholder="Select Request Type"
                        disabled={isSubmitting}
                        optionValue={(option) => option.value}
                        optionLabel={(option) => option.label}
                      />
                    </div>

                    <div>
                      <FieldLabel required>Week</FieldLabel>
                      <CustomSelect
                        value={form.weeklyWeekKey || ""}
                        options={weeklyWeekOptions}
                        onChange={(value, option) =>
                          handleWeeklyWeekChange(value, option)
                        }
                        disabled={isSubmitting}
                        placeholder="Select Week"
                        optionValue={(option) => option.value}
                        optionLabel={(option) => option.label}
                        optionDescription={(option) =>
                          option.description
                        }
                        loading={weeklyWeeksLoading}
                        loadingMessage="Loading weeks..."
                      />
                    </div>

                    <div>
                      <FieldLabel required>Account</FieldLabel>
                      <CustomSelect
                        value={form.downsizeAccountKey || ""}
                        options={accountOptions}
                        onChange={(value, option) =>
                          handleDownsizeAccountChange(
                            value,
                            option,
                          )
                        }
                        disabled={
                          !form.weeklyWeekKey || isSubmitting
                        }
                        placeholder={
                          form.weeklyWeekKey
                            ? "Search accounts..."
                            : "Select week first"
                        }
                        optionValue={(option) => option.value}
                        optionLabel={(option) => option.label}
                        optionDescription={(option) =>
                          option.description
                        }
                        searchable
                        searchPlaceholder="Search accounts..."
                        loading={weeklyAccountsLoading}
                        loadingMessage="Loading accounts..."
                        emptyMessage="No matching account found."
                      />
                    </div>

                    <div className="lg:col-span-3">
                      <FieldLabel>
                        Previous Required Headcount
                      </FieldLabel>

                      <div className="overflow-hidden rounded-[10px] border border-[#D7DEE8] bg-white">
                        <table className="w-full table-fixed border-separate border-spacing-0 text-left">
                          <thead>
                            <tr className="bg-[#F5F7FA] text-[10px] font-extrabold uppercase tracking-wide text-[#174A7C]">
                              <th className="px-4 py-3">
                                Account / Week
                              </th>
                              <th className="px-4 py-3 text-center">
                                Required Headcount
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border-t border-[#E6ECF2] px-4 py-4">
                                <p className="text-xs font-extrabold text-[#101828]">
                                  {form.accountName || "—"}
                                </p>
                                <p className="mt-1 text-[10px] font-semibold text-[#667085]">
                                  {form.downsizeCluster ||
                                    "Weekly Hiring Account"}
                                </p>
                                <p className="mt-1 text-[10px] font-semibold text-[#98A2B3]">
                                  {form.weeklyWeekDateRange ||
                                    getWeeklyWeekDateRange(
                                      form.weeklyWeekStart,
                                      form.weeklyWeekEnd,
                                    ) ||
                                    "—"}
                                </p>
                              </td>
                              <td className="border-t border-[#E6ECF2] px-4 py-4 text-center text-sm font-extrabold tabular-nums text-[#042C51]">
                                {formatNumber(
                                  form.previousRequiredHeadcount ||
                                  0,
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </FormSection>

                <FormSection
                  title="Headcount Adjustment"
                  subtitle="Enter the number of slots to reduce and provide the business reason for the Downsize request."
                  icon={SlidersHorizontal}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[240px_minmax(0,1fr)]">
                    <div>
                      <FieldLabel required>
                        Required Headcount to Downsize
                      </FieldLabel>
                      <TextInput
                        type="number"
                        min="1"
                        value={form.headcount || ""}
                        onChange={(event) =>
                          updateField(
                            "headcount",
                            event.target.value,
                          )
                        }
                        placeholder="Enter headcount"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <FieldLabel required>Reason</FieldLabel>
                      <TextArea
                        value={form.downsizeReason || ""}
                        onChange={(event) =>
                          updateField(
                            "downsizeReason",
                            event.target.value,
                          )
                        }
                        placeholder="Explain the downsize requirement."
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </FormSection>

                <FormSection
                  title="Supporting Evidence & Approval"
                  subtitle="Attach the required supporting file and verify the auto-assigned request owner before submission."
                  icon={UploadCloud}
                >
                  <div className="space-y-3">
                    <div>
                      <FieldLabel required>
                        Upload Image or File
                      </FieldLabel>

                      <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-[#D7DEE8] bg-[#F8FAFC] px-4 py-5 text-center transition hover:border-[#FF5C28]/40 hover:bg-white">
                        {downsizeFile ? (
                          <div className="flex w-full flex-col items-center gap-3">
                            {downsizeFileIsImage &&
                              downsizeFilePreviewUrl ? (
                              <img
                                src={downsizeFilePreviewUrl}
                                alt={downsizeFile.name}
                                className="max-h-52 w-auto max-w-full rounded-[10px] border border-[#E6ECF2] bg-white object-contain shadow-sm"
                              />
                            ) : (
                              <span className="flex h-16 w-16 items-center justify-center rounded-xl border border-[#D7DEE8] bg-white text-[#042C51] shadow-sm">
                                <FileText size={27} />
                              </span>
                            )}

                            <div>
                              <p className="break-all text-xs font-extrabold text-[#042C51]">
                                {downsizeFile.name}
                              </p>
                              <p className="mt-1 text-[10px] font-semibold text-[#667085]">
                                {(
                                  downsizeFile.size /
                                  1024 /
                                  1024
                                ).toFixed(2)}{" "}
                                MB
                              </p>
                              <p className="mt-1 text-[10px] font-extrabold text-[#FF5C28]">
                                Click to change file
                              </p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload
                              size={24}
                              className="mb-2 text-[#FF5C28]"
                            />
                            <span className="text-xs font-extrabold text-[#042C51]">
                              Click to upload supporting file
                            </span>
                            <span className="mt-1 text-[10px] font-semibold text-[#667085]">
                              Images, PDF, Word, and Excel files
                              are supported.
                            </span>
                          </>
                        )}

                        <input
                          type="file"
                          className="hidden"
                          required
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                          disabled={isSubmitting}
                          onChange={(event) =>
                            setDownsizeFile(
                              event.target.files?.[0] || null,
                            )
                          }
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <FieldLabel required>
                          SIBS ID Manager
                        </FieldLabel>
                        <TextInput
                          value={
                            form.sibsIdManager ||
                            form.preparedById ||
                            ""
                          }
                          readOnly
                          disabled
                          placeholder="Logged-in SIBS ID"
                        />
                      </div>

                      <div>
                        <FieldLabel required>
                          Hiring Manager
                        </FieldLabel>
                        <TextInput
                          value={form.hiringManager || ""}
                          readOnly
                          disabled
                          placeholder="Logged-in manager name"
                        />
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Approval Status</FieldLabel>
                      <div className="flex items-center justify-between rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2.5">
                        <div>
                          <p className="text-xs font-extrabold text-amber-700">
                            {form.approvalStatus ||
                              "For Approval"}
                          </p>
                          <p className="mt-0.5 text-[10px] font-semibold text-amber-600">
                            This Downsize request will be routed
                            through the configured approval workflow.
                          </p>
                        </div>
                        <Clock
                          size={17}
                          className="shrink-0 text-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </FormSection>
              </>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
}
