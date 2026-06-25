import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../components/layout/Header";
import { ClipboardList } from "lucide-react";
import api from "../../lib/axios/api-template";
import StatusModal from "../../components/modals/StatusModal";
import PercentageRiskGraphTable from "../../components/tables/WeeklyHiringPlan/PercentageRiskGraphTable";
import WeeklyHiringAccountsTable from "../../components/tables/WeeklyHiringPlan/WeeklyHiringAccountsTable";
import WeeklyVersionTable from "../../components/tables/WeeklyHiringPlan/WeeklyVersionTable";
import HeadcountTable from "../../components/tables/WeeklyHiringPlan/HeadcountTable";
import ViewPlanModal from "../../components/modals/weeklyHiringPlan/ViewPlanModal";
import KPISnapshotModal from "../../components/modals/weeklyHiringPlan/KPISnapshotModal";

import {
  getWeeklyHiringPlanAccounts,
  getWeeklyHiringPlanWeeks,
  saveWeeklyHiringPlanActionItem,
} from "../../lib/axios/getWeeklyHiringPlan";

import { useUser } from "../../services/context/UserContext";

const FULL_WEEKLY_ACCESS_ROLES = [
  "ta",
  "talent_acquisition",
  "recruitment",
  "recruiter",
  "hr",
  "hr_admin",
  "hradmin",
  "hr_manager",
  "hr_staff",
  "human_resources",
  "human_resource",
  "human_resources_admin",
  "human_resource_admin",
  "super_admin",
  "superadmin",
];

const FLAT_PAGE_BG = "bg-[#F6F8FB]";
const APPROVAL_EDGE =
  "overflow-hidden rounded-[10px] border border-[#E1E7EF] bg-white shadow-sm";

const initialActionItemForm = {
  actionItem: "",
  owner: "",
  deadline: "",
  status: "Pending",
  actionItemRemarks: "",
};

function getText(value) {
  return String(value || "").trim();
}

function normalizeRoleKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getLocalStorageValue(keys = []) {
  if (typeof window === "undefined") return "";

  for (const key of keys) {
    const value = window.localStorage.getItem(key);

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }

  return "";
}

function getFirstFilledValue(values = []) {
  for (const value of values) {
    const cleanValue = String(value ?? "").trim();

    if (cleanValue) return cleanValue;
  }

  return "";
}

function getUserRoleCandidates(user) {
  return [
    user?.role,
    user?.userRole,
    user?.user_role,
    user?.adminRole,
    user?.admin_role,
    user?.roleName,
    user?.role_name,
    user?.userRoleName,
    user?.user_role_name,
    user?.position,
    user?.positionName,
    user?.position_name,
    user?.jobTitle,
    user?.job_title,
    user?.designation,
    user?.employeeRole,
    user?.employee_role,
    user?.department,
    user?.departmentName,
    user?.department_name,
    user?.deptName,
    user?.dept_name,
    getLocalStorageValue([
      "role",
      "userRole",
      "user_role",
      "adminRole",
      "admin_role",
      "roleName",
      "role_name",
      "userRoleName",
      "user_role_name",
      "position",
      "positionName",
      "position_name",
      "jobTitle",
      "job_title",
      "designation",
      "employeeRole",
      "employee_role",
      "department",
      "departmentName",
      "department_name",
      "deptName",
      "dept_name",
    ]),
  ].filter((value) => String(value ?? "").trim() !== "");
}

function getCurrentRoleKey(user) {
  return normalizeRoleKey(getFirstFilledValue(getUserRoleCandidates(user)));
}

function getCurrentAdminAccess(user) {
  const value =
    user?.adminAccess ??
    user?.admin_access ??
    user?.gy_user_access ??
    user?.access ??
    user?.adminLevel ??
    user?.admin_level ??
    user?.adminAccessLevel ??
    user?.admin_access_level ??
    user?.isAdmin ??
    user?.is_admin ??
    getLocalStorageValue([
      "adminAccess",
      "admin_access",
      "gy_user_access",
      "access",
      "adminLevel",
      "admin_level",
      "adminAccessLevel",
      "admin_access_level",
      "isAdmin",
      "is_admin",
    ]) ??
    0;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function isHrRoleValue(value) {
  const role = normalizeRoleKey(value);

  if (!role) return false;

  if (
    [
      "hr",
      "hr_admin",
      "hradmin",
      "hr_manager",
      "hr_staff",
      "human_resources",
      "human_resource",
      "human_resources_admin",
      "human_resource_admin",
      "super_admin",
      "superadmin",
    ].includes(role)
  ) {
    return true;
  }

  if (role.includes("human_resource")) return true;
  if (role.includes("human_resources")) return true;

  return role.startsWith("hr_") || role.endsWith("_hr");
}

function isHrEditorByUser(user) {
  const roleCandidates = getUserRoleCandidates(user);
  const adminAccess = getCurrentAdminAccess(user);

  return roleCandidates.some(isHrRoleValue) || adminAccess === 7;
}

function canManageHiringPlanByRole(user) {
  return isHrEditorByUser(user);
}

function getAccountIdFromAny(item) {
  return getText(
    item?.backendAccountId ||
      item?.accountId ||
      item?.account_id ||
      item?.gy_acc_id ||
      item?.id ||
      "",
  );
}

function getAccountNameFromAny(item) {
  return getText(
    item?.accountName ||
      item?.account ||
      item?.gy_acc_name ||
      item?.account_name ||
      "",
  );
}

function getGhlNameFromAny(item) {
  return getText(
    item?.ghlName || item?.gy_acc_ghl_name || item?.ghl_name || "",
  );
}

function getClusterFromAny(item) {
  const accountName = getAccountNameFromAny(item);
  const ghlName = getGhlNameFromAny(item);
  const text = `${accountName} ${ghlName}`.toLowerCase();

  if (
    text.includes("cd -") ||
    text.includes("cd-") ||
    text.includes("coast dental")
  ) {
    return "Coast Dental";
  }

  if (text.includes("us visa")) {
    return "US Visa";
  }

  if (
    text.includes("sme-") ||
    text.includes("sme -") ||
    text.includes("frontsteps") ||
    text.includes("front steps")
  ) {
    return "SME";
  }

  if (text.includes("yomdel")) {
    return "Yomdel";
  }

  const explicitCluster = getText(item?.clusterName || item?.cluster);

  if (explicitCluster) return explicitCluster;

  return "Corporate";
}

function getBackendNumber(record, keys, fallback = 0) {
  for (const key of keys) {
    const rawValue = record?.[key];

    if (rawValue !== undefined && rawValue !== null && rawValue !== "") {
      const numberValue = Number(rawValue);

      if (Number.isFinite(numberValue)) {
        return numberValue;
      }
    }
  }

  const fallbackNumber = Number(fallback || 0);

  return Number.isFinite(fallbackNumber) ? fallbackNumber : 0;
}

function normalizeStatusValue(value, fallback = "") {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) return fallback;

  const normalized = rawValue.toLowerCase();

  if (normalized === "approved") return "Approved";
  if (normalized === "rejected" || normalized === "declined") return "Rejected";
  if (normalized === "pending") return "Pending";

  return rawValue;
}

function getRecruitmentSettingsStatus(record = {}) {
  return normalizeStatusValue(
    record?.recruitmentSettingsStatus ||
      record?.recruitment_settings_status ||
      record?.recruitmentStatus ||
      record?.recruitment_status ||
      record?.baseHeadcountStatus ||
      record?.base_headcount_status ||
      record?.status ||
      "Kronos",
    "Kronos",
  );
}

function getUpdateHeadcountStatus(record = {}) {
  const rawStatus =
    record?.updateHeadcountStatus ||
    record?.update_headcount_status ||
    record?.managerUpdateStatus ||
    record?.manager_update_status ||
    "";

  if (!rawStatus) return "";

  return normalizeStatusValue(rawStatus, "");
}

function hasPendingUpdateHeadcountRequest(record = {}) {
  return String(getUpdateHeadcountStatus(record)).toLowerCase() === "pending";
}

function getHeadcountApprovalStatus(record = {}) {
  return (
    getUpdateHeadcountStatus(record) ||
    getRecruitmentSettingsStatus(record) ||
    "Kronos"
  );
}

function isApprovedRecruitmentSettingsRequest(item = {}) {
  return (
    String(getRecruitmentSettingsStatus(item)).trim().toLowerCase() ===
    "approved"
  );
}

function hasActiveRecruitmentSettingsRequest(items = []) {
  return (items || []).some((item) => {
    const recruitmentStatus = String(getRecruitmentSettingsStatus(item))
      .trim()
      .toLowerCase();

    const updateStatus = String(getUpdateHeadcountStatus(item))
      .trim()
      .toLowerCase();

    return recruitmentStatus === "pending" || updateStatus === "pending";
  });
}

function canManagerUpdateApprovedHeadcount({
  item,
  canEditRequiredHeadcount,
  weeklyAccess,
}) {
  if (!canEditRequiredHeadcount) return false;

  /*
    Important:
    HR / HR Admin have full weekly access, but they should NOT see the
    Update Headcount button in the Weekly Hiring Plan modal.
    The parent selectedPlanCanEditRequiredHeadcount check already blocks HR.
    This function only validates that the selected account has an approved
    Recruitment Settings base request.
  */
  if (!item || weeklyAccess?.hasFullAccess) {
    return false;
  }

  return isApprovedRecruitmentSettingsRequest(item);
}

function getDisplayRequiredHeadcount(record = {}) {
  const recruitmentStatus = getRecruitmentSettingsStatus(record);

  const kronosRequiredHeadcount = getBackendNumber(
    record,
    [
      "kronosRequiredHeadcount",
      "kronos_required_headcount",
      "kronosBasedRequiredHeadcount",
      "kronos_based_required_headcount",
      "kronosHeadcount",
      "kronos_headcount",
    ],
    getBackendNumber(record, ["requiredHeadcount", "required_headcount"]),
  );

  const approvedRequiredHeadcount = getBackendNumber(record, [
    "approvedRequiredHeadcount",
    "approved_required_headcount",
    "requiredHeadcount",
    "required_headcount",
  ]);

  /*
    required_headcount is the live/approved value.
    requested_required_headcount is only the pending manager request value.
    So while update_headcount_status is Pending, the table still shows the
    approved required_headcount.
  */
  if (String(recruitmentStatus).trim().toLowerCase() === "approved") {
    return approvedRequiredHeadcount;
  }

  return kronosRequiredHeadcount;
}

function getLoggedInOwnerDisplay(user) {
  const sibsId = String(
    user?.username ||
      user?.sibsId ||
      user?.sibs_id ||
      user?.gy_user_code ||
      getLocalStorageValue(["username", "sibsId", "sibs_id", "userCode"]) ||
      "",
  ).trim();

  const lastName = String(
    user?.gy_emp_lname || user?.lastName || user?.last_name || "",
  ).trim();

  const firstName = String(
    user?.gy_emp_fname || user?.firstName || user?.first_name || "",
  ).trim();

  const middleName = String(
    user?.gy_emp_mname || user?.middleName || user?.middle_name || "",
  ).trim();

  const fallbackFullName = getLocalStorageValue(["fullName", "full_name"]);

  const fullName =
    `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ""}`
      .replace(/\s+/g, " ")
      .trim() || fallbackFullName;

  if (!sibsId && !fullName) return "-";
  if (!fullName) return sibsId.toUpperCase();

  return `${sibsId} - ${fullName}`.toUpperCase();
}

function calculatePipelineStatus(item) {
  const requiredHeadcount = Number(item.requiredHeadcount || 0);
  const actualHeadcount = Number(item.actualHeadcount || 0);
  const leadsToInterview = Number(item.leadsToInterview || 0);
  const opsPrf = Number(item.opsPrf || 0);

  if (requiredHeadcount <= 0) return "Pending";

  if (opsPrf > 0 || leadsToInterview > 0) {
    return "At Risk";
  }

  if (actualHeadcount >= requiredHeadcount) {
    return "Completed";
  }

  const gap = requiredHeadcount - actualHeadcount;

  if (leadsToInterview === 0 && gap > 0) {
    return "Delayed";
  }

  return "On Track";
}

function buildWeekKey(week) {
  const startDate = String(week?.startDate || week?.weekStart || "").trim();
  const endDate = String(week?.endDate || week?.weekEnd || "").trim();

  return `${startDate}__${endDate}`;
}

function getWeekHiringPlanPercent(week) {
  const value =
    week?.hiringPlanPercent ??
    week?.hiring_plan_percent ??
    week?.hiringRate ??
    week?.hiring_rate ??
    5;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 5;
}

async function saveRequiredHeadcount(payload) {
  const res = await api.post("/api/weekly-hiring-plan/headcount", payload, {
    withCredentials: true,
  });

  return res.data;
}

async function lockWeeklyHiringPlanSnapshot(payload) {
  const res = await api.post(
    "/api/weekly-hiring-plan/headcount/lock-week",
    payload,
    {
      withCredentials: true,
    },
  );

  return res.data;
}

async function updateWeeklyHiringPlanFile(payload) {
  const formData = new FormData();

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (key === "uploadedFile") return;

    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  if (payload?.uploadedFile) {
    formData.append("uploadedFile", payload.uploadedFile);
  }

  const res = await api.post("/api/weekly-hiring-plan/headcount/file", formData, {
    withCredentials: true,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}

async function openWeeklyHiringPlanFile({ sibsId, filename }) {
  if (!sibsId || !filename) {
    throw new Error("Missing file information.");
  }

  const res = await api.get(
    `/api/weekly-hiring-plan/file/${encodeURIComponent(
      sibsId,
    )}/${encodeURIComponent(filename)}`,
    {
      responseType: "blob",
      withCredentials: true,
    },
  );

  const blobUrl = window.URL.createObjectURL(res.data);
  window.open(blobUrl, "_blank", "noopener,noreferrer");

  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 60_000);
}

function buildWeeklyAccess(user) {
  const role = getCurrentRoleKey(user);
  const hasFullAccess = FULL_WEEKLY_ACCESS_ROLES.includes(role);

  const assignedAccounts = Array.isArray(user?.assignedAccounts)
    ? user.assignedAccounts
    : [];

  const assignedAccountIds = new Set(
    assignedAccounts
      .map((account) => getAccountIdFromAny(account))
      .filter(Boolean),
  );

  const assignedAccountNames = new Set(
    assignedAccounts
      .map((account) => getAccountNameFromAny(account))
      .filter(Boolean),
  );

  const assignedClusterNames = new Set(
    assignedAccounts
      .map((account) => getClusterFromAny(account))
      .filter(Boolean),
  );

  return {
    role,
    hasFullAccess,
    assignedAccounts,
    assignedAccountIds,
    assignedAccountNames,
    assignedClusterNames,
  };
}

export default function WeeklyHiringPlanPage() {
  const { user } = useUser();

  const canManageHiringPlanPercent = canManageHiringPlanByRole(user);

  const mainScrollRef = useRef(null);
  const weekDropdownRef = useRef(null);
  const clusterDropdownRef = useRef(null);
  const accountDropdownRef = useRef(null);
  const editedRequiredInputsRef = useRef(new Set());

  const adminAccessValue = getCurrentAdminAccess(user);

  const assignedAccountAccessValues = Array.isArray(user?.assignedAccounts)
    ? user.assignedAccounts.map((account) =>
        Number(
          account?.adminAccess ?? account?.admin_access ?? account?.access ?? 0,
        ),
      )
    : [];

  const hasManagerAssignedAccess = assignedAccountAccessValues.includes(5);
  const userRoleValue = getCurrentRoleKey(user);

  const isHrOrHrAdmin = isHrEditorByUser(user);

  const isManagerOrOps =
    adminAccessValue === 5 ||
    hasManagerAssignedAccess ||
    userRoleValue.includes("manager") ||
    userRoleValue === "om" ||
    userRoleValue === "som" ||
    userRoleValue === "operation_manager" ||
    userRoleValue === "operations_manager" ||
    userRoleValue === "senior_operations_manager";

  const canEditRequiredHeadcount = Boolean(isHrOrHrAdmin || isManagerOrOps);

  const [weeklyVersions, setWeeklyVersions] = useState([]);
  const [activeWeekId, setActiveWeekId] = useState("");
  const [weeksLoading, setWeeksLoading] = useState(false);
  const [lockingWeeklyPlan, setLockingWeeklyPlan] = useState(false);
  const [databaseLockedWeekKeys, setDatabaseLockedWeekKeys] = useState(
    new Set(),
  );

  const [search, setSearch] = useState("");
  const [weekSearch, setWeekSearch] = useState("");
  const [showWeekDropdown, setShowWeekDropdown] = useState(false);

  const [selectedClusters, setSelectedClusters] = useState(["All"]);
  const [showClusterDropdown, setShowClusterDropdown] = useState(false);

  const [selectedAccounts, setSelectedAccounts] = useState(["All"]);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");

  const [selectedHiringPlanPercent, setSelectedHiringPlanPercent] =
    useState(5);

  const [accountOptions, setAccountOptions] = useState([
    {
      id: "All",
      accountName: "All Accounts",
      ghlName: "",
    },
  ]);

  const [remoteAccounts, setRemoteAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [actionItemTarget, setActionItemTarget] = useState(null);
  const [actionItemForm, setActionItemForm] = useState(initialActionItemForm);
  const [actionItemSubmitting, setActionItemSubmitting] = useState(false);
  const [showKpiSnapshot, setShowKpiSnapshot] = useState(false);

  const [requiredInputs, setRequiredInputs] = useState({});
  const [savingRequiredId, setSavingRequiredId] = useState("");
  const [weeklyPlanFiles, setWeeklyPlanFiles] = useState({});
  const [savingFileId, setSavingFileId] = useState("");
  const [openingFile, setOpeningFile] = useState(false);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const activeWeek =
    weeklyVersions.find((week) => week.id === activeWeekId) ||
    weeklyVersions[0];

  const activeWeekKey = buildWeekKey(activeWeek);

  const isWeekLockedForDisplay = Boolean(
    activeWeek?.locked ||
      activeWeek?.lockedByPreviousWeek ||
      activeWeek?.lockedByInheritedLatestRate,
  );

  const isHiringPlanSnapshotLocked = Boolean(
    activeWeek?.lockedByDatabase || databaseLockedWeekKeys.has(activeWeekKey),
  );

  const activeWeekStartDate = activeWeek?.startDate || "";
  const activeWeekEndDate = activeWeek?.endDate || "";

  const weeklyAccess = useMemo(() => buildWeeklyAccess(user), [user]);

  const userAccessReady = useMemo(() => {
    if (!user && !getLocalStorageValue(["role", "userRole", "adminRole"])) {
      return false;
    }

    const role = getCurrentRoleKey(user);

    if (FULL_WEEKLY_ACCESS_ROLES.includes(role)) {
      return true;
    }

    return Array.isArray(user?.assignedAccounts);
  }, [user]);

  const filteredWeeklyVersions = useMemo(() => {
    const keyword = weekSearch.trim().toLowerCase();

    if (!keyword) return weeklyVersions;

    return weeklyVersions.filter((week) => {
      const searchableText = [
        week.label,
        week.weekRange,
        week.startDate,
        week.endDate,
        week.locked ? "Locked" : "Editable",
        week.lockedByDatabase ? "Saved Snapshot" : "No Snapshot",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [weeklyVersions, weekSearch]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        weekDropdownRef.current &&
        !weekDropdownRef.current.contains(e.target)
      ) {
        setShowWeekDropdown(false);
      }

      if (
        clusterDropdownRef.current &&
        !clusterDropdownRef.current.contains(e.target)
      ) {
        setShowClusterDropdown(false);
      }

      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(e.target)
      ) {
        setShowAccountDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function fetchWeeklyVersions() {
      try {
        setWeeksLoading(true);

        const weeks = await getWeeklyHiringPlanWeeks();

        const formattedWeeks = (weeks || []).map((week, index) => {
          const startDate = week?.startDate || week?.weekStart || "";
          const endDate = week?.endDate || week?.weekEnd || "";
          const weekKey = `${startDate}__${endDate}`;

          const rawHiringPlanPercent = week?.hiring_plan_percent ?? null;

          const hasHiringPlanPercent =
            rawHiringPlanPercent !== null &&
            rawHiringPlanPercent !== undefined &&
            rawHiringPlanPercent !== "" &&
            Number(rawHiringPlanPercent) > 0;

          const displayHiringPlanPercent =
            week?.displayHiringPlanPercent ??
            week?.display_hiring_plan_percent ??
            week?.hiringPlanPercent ??
            week?.hiringRate ??
            5;

          const hiringPlanPercent = hasHiringPlanPercent
            ? Number(rawHiringPlanPercent)
            : getWeekHiringPlanPercent({
                hiringPlanPercent: displayHiringPlanPercent,
              });

          return {
            ...week,
            id: weekKey || week?.id || `week-${index}`,
            originalId: week?.id || "",
            startDate,
            endDate,
            weekKey,
            records: [],

            locked: Boolean(week?.locked),

            lockedByDatabase: Boolean(
              hasHiringPlanPercent ||
                week?.locked_by_database ||
                week?.is_hiring_plan_locked,
            ),

            isHiringPlanLocked: Boolean(
              hasHiringPlanPercent || week?.is_hiring_plan_locked,
            ),

            is_hiring_plan_locked: Boolean(
              hasHiringPlanPercent || week?.is_hiring_plan_locked,
            ),

            hasHiringPlanPercent,
            has_hiring_plan_percent: hasHiringPlanPercent,

            hasSavedSnapshot: Boolean(
              week?.hasSavedSnapshot ||
                week?.has_saved_snapshot ||
                Number(
                  week?.savedSnapshotCount || week?.saved_snapshot_count || 0,
                ) > 0,
            ),

            hiringPlanPercent,
            hiringRate: hiringPlanPercent,
            hiring_rate: hiringPlanPercent,

            hiring_plan_percent: hasHiringPlanPercent ? hiringPlanPercent : null,
          };
        });

        const initialDatabaseLockedWeekKeys = new Set(
          formattedWeeks
            .filter((week) => week.lockedByDatabase)
            .map((week) => buildWeekKey(week))
            .filter((key) => key && key !== "__"),
        );

        if (!ignore) {
          setWeeklyVersions(formattedWeeks);
          setDatabaseLockedWeekKeys(initialDatabaseLockedWeekKeys);
          setActiveWeekId(formattedWeeks[0]?.id || "");
        }
      } catch (error) {
        console.error("FETCH WEEKLY VERSIONS ERROR:", error);

        if (!ignore) {
          setWeeklyVersions([]);
          setActiveWeekId("");
          setDatabaseLockedWeekKeys(new Set());
        }
      } finally {
        if (!ignore) {
          setWeeksLoading(false);
        }
      }
    }

    fetchWeeklyVersions();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!activeWeek) return;

    const weekPercent = getWeekHiringPlanPercent(activeWeek);

    setSelectedHiringPlanPercent(weekPercent);
  }, [
    activeWeekId,
    activeWeek?.hiringPlanPercent,
    activeWeek?.hiring_plan_percent,
  ]);

  function isAllClustersSelected() {
    return selectedClusters.includes("All") || selectedClusters.length === 0;
  }

  function isAllAccountsSelected() {
    return selectedAccounts.includes("All") || selectedAccounts.length === 0;
  }

  function handleToggleCluster(cluster) {
    setSelectedClusters((prev) => {
      if (cluster === "All") {
        return ["All"];
      }

      const current = prev.includes("All") ? [] : prev;
      const alreadySelected = current.includes(cluster);

      const next = alreadySelected
        ? current.filter((item) => item !== cluster)
        : [...current, cluster];

      return next.length > 0 ? next : ["All"];
    });

    setSelectedAccounts(["All"]);
    setAccountSearch("");
  }

  function handleToggleAccount(accountName) {
    setSelectedAccounts((prev) => {
      if (accountName === "All") {
        return ["All"];
      }

      const current = prev.includes("All") ? [] : prev;
      const alreadySelected = current.includes(accountName);

      const next = alreadySelected
        ? current.filter((item) => item !== accountName)
        : [...current, accountName];

      return next.length > 0 ? next : ["All"];
    });
  }

  function markActiveWeekLocked(
    savedHiringPlanPercent = selectedHiringPlanPercent,
  ) {
    const selectedWeekKey = buildWeekKey(activeWeek);
    const cleanHiringPlanPercent = Number(savedHiringPlanPercent || 5);

    if (!selectedWeekKey || selectedWeekKey === "__") return;

    setDatabaseLockedWeekKeys((prev) => {
      const next = new Set(prev);
      next.add(selectedWeekKey);
      return next;
    });

    setWeeklyVersions((prev) =>
      prev.map((week) => {
        const sameWeek = buildWeekKey(week) === selectedWeekKey;

        if (!sameWeek) return week;

        return {
          ...week,
          locked: true,
          lockedByDatabase: true,
          isHiringPlanLocked: true,
          is_hiring_plan_locked: true,
          hasHiringPlanPercent: true,
          has_hiring_plan_percent: true,
          hasSavedSnapshot: true,
          hiringPlanPercent: cleanHiringPlanPercent,
          hiring_plan_percent: cleanHiringPlanPercent,
          hiringRate: cleanHiringPlanPercent,
          hiring_rate: cleanHiringPlanPercent,
        };
      }),
    );

    setSelectedHiringPlanPercent(cleanHiringPlanPercent);
  }

  async function fetchAccountsByCluster({ resetAccountFilter = true } = {}) {
    if (!activeWeekStartDate || !activeWeekEndDate) {
      return [];
    }

    if (!userAccessReady) {
      return [];
    }

    try {
      setAccountsLoading(true);

      let accounts = [];

      if (isAllClustersSelected()) {
        accounts = await getWeeklyHiringPlanAccounts(
          "All",
          activeWeekStartDate,
          activeWeekEndDate,
        );
      } else {
        const results = await Promise.all(
          selectedClusters.map((cluster) =>
            getWeeklyHiringPlanAccounts(
              cluster,
              activeWeekStartDate,
              activeWeekEndDate,
            ),
          ),
        );

        accounts = results.flat();
      }

      if (!weeklyAccess.hasFullAccess) {
        const assignedAccountIds = weeklyAccess.assignedAccountIds;
        const assignedAccountNames = weeklyAccess.assignedAccountNames;

        accounts = (accounts || []).filter((account) => {
          const accountId = getAccountIdFromAny(account);
          const accountName = getAccountNameFromAny(account);

          return (
            assignedAccountIds.has(accountId) ||
            assignedAccountNames.has(accountName)
          );
        });
      }

      const uniqueAccountsMap = new Map();

      (accounts || []).forEach((account, index) => {
        const rawAccountId = String(
          account?.id ||
            account?.accountId ||
            account?.account_id ||
            account?.backendAccountId ||
            account?.gy_acc_id ||
            "",
        ).trim();

        const accountName = String(
          account?.accountName ||
            account?.account ||
            account?.account_name ||
            account?.gy_acc_name ||
            "",
        ).trim();

        const clusterName = getClusterFromAny(account);

        if (!accountName) return;

        const key = `${
          rawAccountId || `manual-${index}`
        }-${accountName.toLowerCase()}-${clusterName.toLowerCase()}`;

        if (!uniqueAccountsMap.has(key)) {
          const recruitmentSettingsStatus =
            getRecruitmentSettingsStatus(account);
          const updateHeadcountStatus = getUpdateHeadcountStatus(account);
          const headcountStatus = getHeadcountApprovalStatus(account);

          const kronosRequiredHeadcount = getBackendNumber(
            account,
            [
              "kronosRequiredHeadcount",
              "kronos_required_headcount",
              "kronosBasedRequiredHeadcount",
              "kronos_based_required_headcount",
              "kronosHeadcount",
              "kronos_headcount",
            ],
            getBackendNumber(account, [
              "requiredHeadcount",
              "required_headcount",
            ]),
          );

          const requestedRequiredHeadcount = getBackendNumber(account, [
            "requestedRequiredHeadcount",
            "requested_required_headcount",
            "savedRequiredHeadcount",
            "saved_required_headcount",
            "pendingRequiredHeadcount",
            "pending_required_headcount",
          ]);

          const requiredHeadcount = getDisplayRequiredHeadcount(account);

          uniqueAccountsMap.set(key, {
            ...account,
            id: rawAccountId || account?.id || `manual-${index}`,
            accountId: rawAccountId || account?.accountId || "",
            backendAccountId:
              account?.backendAccountId ||
              account?.backend_account_id ||
              rawAccountId ||
              "",
            accountName,
            account: accountName,
            clusterName,
            cluster: clusterName,

            requiredHeadcount,
            required_headcount: requiredHeadcount,

            kronosRequiredHeadcount,
            kronos_required_headcount: kronosRequiredHeadcount,

            requestedRequiredHeadcount,
            requested_required_headcount: requestedRequiredHeadcount,

            recruitmentSettingsStatus,
            recruitment_settings_status: recruitmentSettingsStatus,

            updateHeadcountStatus,
            update_headcount_status: updateHeadcountStatus,

            headcountStatus,
            headcount_status: headcountStatus,

            canManagerUpdateHeadcount: isApprovedRecruitmentSettingsRequest({
              recruitmentSettingsStatus,
            }),
            can_manager_update_headcount: isApprovedRecruitmentSettingsRequest({
              recruitmentSettingsStatus,
            }),
          });
        }
      });

      accounts = Array.from(uniqueAccountsMap.values());

      const uniqueAccountOptionsMap = new Map();

      accounts.forEach((account, index) => {
        const rawAccountId = String(
          account?.id ||
            account?.accountId ||
            account?.account_id ||
            account?.backendAccountId ||
            account?.gy_acc_id ||
            "",
        ).trim();

        const accountName = String(
          account?.accountName ||
            account?.account ||
            account?.account_name ||
            account?.gy_acc_name ||
            "",
        ).trim();

        if (!accountName) return;

        const key = accountName.toLowerCase();

        if (!uniqueAccountOptionsMap.has(key)) {
          uniqueAccountOptionsMap.set(key, {
            ...account,
            id: rawAccountId || `manual-option-${index}`,
            accountName,
            account: accountName,
            clusterName: getClusterFromAny(account),
          });
        }
      });

      setRemoteAccounts(accounts || []);

      setAccountOptions([
        {
          id: "All",
          accountName: "All Accounts",
          ghlName: "",
        },
        ...Array.from(uniqueAccountOptionsMap.values()),
      ]);

      if (resetAccountFilter) {
        setSelectedAccounts(["All"]);
      }

      return accounts || [];
    } catch (error) {
      console.error("FETCH ACCOUNTS BY CLUSTER ERROR:", error);

      setRemoteAccounts([]);
      setAccountOptions([
        {
          id: "All",
          accountName: "All Accounts",
          ghlName: "",
        },
      ]);

      if (resetAccountFilter) {
        setSelectedAccounts(["All"]);
      }

      return [];
    } finally {
      setAccountsLoading(false);
    }
  }

  useEffect(() => {
    if (activeWeekStartDate && activeWeekEndDate && userAccessReady) {
      fetchAccountsByCluster();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedClusters,
    activeWeekStartDate,
    activeWeekEndDate,
    userAccessReady,
    user?.role,
    user?.adminAccess,
    user?.assignedAccounts,
  ]);

  const displayData = useMemo(() => {
    return (remoteAccounts || []).map((account, index) => {
      const accountName =
        account.accountName ||
        account.account ||
        account.gy_acc_name ||
        "Unassigned Account";

      const accountCluster =
        getClusterFromAny(account) ||
        (isAllClustersSelected()
          ? "Unassigned"
          : selectedClusters.length === 1
            ? selectedClusters[0]
            : "Unassigned");

      const recruitmentSettingsStatus = getRecruitmentSettingsStatus(account);
      const updateHeadcountStatus = getUpdateHeadcountStatus(account);
      const headcountStatus = getHeadcountApprovalStatus(account);

      const kronosRequiredHeadcount = getBackendNumber(
        account,
        [
          "kronosRequiredHeadcount",
          "kronos_required_headcount",
          "kronosBasedRequiredHeadcount",
          "kronos_based_required_headcount",
          "kronosHeadcount",
          "kronos_headcount",
        ],
        getBackendNumber(account, ["requiredHeadcount", "required_headcount"]),
      );

      const requestedRequiredHeadcount = getBackendNumber(account, [
        "requestedRequiredHeadcount",
        "requested_required_headcount",
        "savedRequiredHeadcount",
        "saved_required_headcount",
        "pendingRequiredHeadcount",
        "pending_required_headcount",
      ]);

      const requiredHeadcount = getDisplayRequiredHeadcount(account);

      const actualHeadcount = getBackendNumber(account, [
        "actualHeadcount",
        "actual_headcount",
      ]);

      const bufferHeadcount = getBackendNumber(account, [
        "bufferHeadcount",
        "buffer_headcount",
        "buffer_head_count",
      ]);

      const bufferPercent = getBackendNumber(account, [
        "bufferPercent",
        "buffer_percent",
      ]);

      const rawAbsenteeismCount = Number(account.absenteeismCount || 0);
      const absenteeismCount = rawAbsenteeismCount;

      const absenteeismPastSixWeeksAverage = getBackendNumber(
        account,
        [
          "absenteeismPastSixWeeksAverage",
          "absenteeism_past_six_weeks_average",
          "absenteeismOpsCount",
          "absenteeism_ops_count",
        ],
        Math.round(rawAbsenteeismCount / 6),
      );

      const attritionPastCount = Number(account.attritionPastCount || 0);

      const attritionPastSixWeeksAverage = getBackendNumber(
        account,
        [
          "attritionPastSixWeeksAverage",
          "attrition_past_six_weeks_average",
        ],
        Math.round(attritionPastCount / 6),
      );

      const actualHeadcountNeeds = getBackendNumber(account, [
        "actualHeadcountNeeds",
        "actual_headcount_needs",
      ]);

      const opsPrf = getBackendNumber(account, ["opsPrf", "ops_prf"]);

      const projectedEmployeeNeeds = getBackendNumber(
        account,
        [
          "projectedEmployeeNeeds",
          "projected_employee_needs",
          "projectedNeeds",
          "projected_needs",
        ],
        actualHeadcountNeeds || opsPrf,
      );

      const actionItem = account.actionItem || account.action_item || "";
      const actionItemOwner =
        account.actionItemOwner || account.action_item_owner || "";
      const actionItemOwnerSibsId =
        account.actionItemOwnerSibsId ||
        account.action_item_owner_sibs_id ||
        "";
      const actionItemDeadline =
        account.actionItemDeadline || account.action_item_deadline || "";
      const actionItemStatus =
        account.actionItemStatus || account.action_item_status || "Pending";
      const actionItemRemarks =
        account.actionItemRemarks || account.action_item_remarks || "";

      const actionItems =
        Array.isArray(account.actionItems) && account.actionItems.length
          ? account.actionItems
          : actionItem
            ? [
                {
                  actionItem,
                  action_item: actionItem,
                  owner: actionItemOwner,
                  actionItemOwner,
                  action_item_owner: actionItemOwner,
                  ownerSibsId: actionItemOwnerSibsId,
                  actionItemOwnerSibsId,
                  action_item_owner_sibs_id: actionItemOwnerSibsId,
                  deadline: actionItemDeadline,
                  actionItemDeadline,
                  action_item_deadline: actionItemDeadline,
                  status: actionItemStatus,
                  actionItemStatus,
                  action_item_status: actionItemStatus,
                  actionItemRemarks,
                  action_item_remarks: actionItemRemarks,
                },
              ]
            : [];

      const rowHiringPlanPercent = getBackendNumber(
        account,
        [
          "hiringPlanPercent",
          "hiring_plan_percent",
          "hiringRate",
          "hiring_rate",
        ],
        getWeekHiringPlanPercent(activeWeek),
      );

      const row = {
        id: String(
          account.id ||
            account.accountId ||
            account.account_id ||
            account.requiredHeadcountId ||
            account.required_headcount_id ||
            `db-${accountCluster}-${accountName}-${index}`,
        ),
        backendAccountId: account.id || account.accountId || account.gy_acc_id,
        accountId: account.id || account.accountId || account.gy_acc_id,
        week: activeWeek?.label || "Current Week",
        cluster: accountCluster,
        account: accountName,

        requiredHeadcount,
        required_headcount: requiredHeadcount,

        kronosRequiredHeadcount,
        kronos_required_headcount: kronosRequiredHeadcount,

        requestedRequiredHeadcount,
        requested_required_headcount: requestedRequiredHeadcount,

        recruitmentSettingsStatus,
        recruitment_settings_status: recruitmentSettingsStatus,

        updateHeadcountStatus,
        update_headcount_status: updateHeadcountStatus,

        headcountStatus,
        headcount_status: headcountStatus,

        canManagerUpdateHeadcount: isApprovedRecruitmentSettingsRequest({
          recruitmentSettingsStatus,
        }),
        can_manager_update_headcount: isApprovedRecruitmentSettingsRequest({
          recruitmentSettingsStatus,
        }),

        actualHeadcount,
        actual_headcount: actualHeadcount,

        bufferHeadcount,
        bufferPercent,
        missingHeadcount: requiredHeadcount + bufferHeadcount - actualHeadcount,

        scheduledCount: Number(account.scheduledCount || 0),
        presentCount: Number(account.presentCount || 0),

        absenteeismCount,
        absenteeismPercent: Number(account.absenteeismPercent || 0),
        absenteeismPastSixWeeksAverage,
        absenteeism_past_six_weeks_average: absenteeismPastSixWeeksAverage,

        attritionPastCount,
        attritionPastPercent: Number(account.attritionPastPercent || 0),
        attritionPastSixWeeksAverage,
        attrition_past_six_weeks_average: attritionPastSixWeeksAverage,

        absenteeismTrend:
          account.absenteeismTrend ||
          account.absenteeism_trend ||
          account.absenteeismPastSixWeeksTrend ||
          account.absenteeism_past_six_weeks_trend ||
          account.absenteeismWeeklyCounts ||
          account.absenteeism_weekly_counts ||
          account.absenteeismSixWeeksBreakdown ||
          account.absenteeism_six_weeks_breakdown ||
          account.absenteeismPastSixWeeksBreakdown ||
          account.absenteeism_past_six_weeks_breakdown ||
          account.weeklyAbsenteeism ||
          account.weekly_absenteeism ||
          [],

        attritionTrend:
          account.attritionTrend ||
          account.attrition_trend ||
          account.attritionPastSixWeeksTrend ||
          account.attrition_past_six_weeks_trend ||
          account.attritionWeeklyCounts ||
          account.attrition_weekly_counts ||
          account.attritionSixWeeksBreakdown ||
          account.attrition_six_weeks_breakdown ||
          account.attritionPastSixWeeksBreakdown ||
          account.attrition_past_six_weeks_breakdown ||
          account.weeklyAttrition ||
          account.weekly_attrition ||
          [],

        absenteeismWeek1:
          account.absenteeismWeek1 ||
          account.absenteeism_week_1 ||
          account.week1Absenteeism ||
          account.week_1_absenteeism ||
          account.w1Absenteeism ||
          account.absenteeismW1 ||
          0,
        absenteeismWeek2:
          account.absenteeismWeek2 ||
          account.absenteeism_week_2 ||
          account.week2Absenteeism ||
          account.week_2_absenteeism ||
          account.w2Absenteeism ||
          account.absenteeismW2 ||
          0,
        absenteeismWeek3:
          account.absenteeismWeek3 ||
          account.absenteeism_week_3 ||
          account.week3Absenteeism ||
          account.week_3_absenteeism ||
          account.w3Absenteeism ||
          account.absenteeismW3 ||
          0,
        absenteeismWeek4:
          account.absenteeismWeek4 ||
          account.absenteeism_week_4 ||
          account.week4Absenteeism ||
          account.week_4_absenteeism ||
          account.w4Absenteeism ||
          account.absenteeismW4 ||
          0,
        absenteeismWeek5:
          account.absenteeismWeek5 ||
          account.absenteeism_week_5 ||
          account.week5Absenteeism ||
          account.week_5_absenteeism ||
          account.w5Absenteeism ||
          account.absenteeismW5 ||
          0,
        absenteeismWeek6:
          account.absenteeismWeek6 ||
          account.absenteeism_week_6 ||
          account.week6Absenteeism ||
          account.week_6_absenteeism ||
          account.w6Absenteeism ||
          account.absenteeismW6 ||
          0,

        attritionWeek1:
          account.attritionWeek1 ||
          account.attrition_week_1 ||
          account.week1Attrition ||
          account.week_1_attrition ||
          account.w1Attrition ||
          account.attritionW1 ||
          0,
        attritionWeek2:
          account.attritionWeek2 ||
          account.attrition_week_2 ||
          account.week2Attrition ||
          account.week_2_attrition ||
          account.w2Attrition ||
          account.attritionW2 ||
          0,
        attritionWeek3:
          account.attritionWeek3 ||
          account.attrition_week_3 ||
          account.week3Attrition ||
          account.week_3_attrition ||
          account.w3Attrition ||
          account.attritionW3 ||
          0,
        attritionWeek4:
          account.attritionWeek4 ||
          account.attrition_week_4 ||
          account.week4Attrition ||
          account.week_4_attrition ||
          account.w4Attrition ||
          account.attritionW4 ||
          0,
        attritionWeek5:
          account.attritionWeek5 ||
          account.attrition_week_5 ||
          account.week5Attrition ||
          account.week_5_attrition ||
          account.w5Attrition ||
          account.attritionW5 ||
          0,
        attritionWeek6:
          account.attritionWeek6 ||
          account.attrition_week_6 ||
          account.week6Attrition ||
          account.week_6_attrition ||
          account.w6Attrition ||
          account.attritionW6 ||
          0,

        opsPrf,
        projectedEmployeeNeeds,
        projected_employee_needs: projectedEmployeeNeeds,

        actualHeadcountNeeds,
        actual_headcount_needs: actualHeadcountNeeds,

        attritionFstToPstCount: Number(account.attritionFstToPstCount || 0),
        attritionFstToPstPercent: Number(account.attritionFstToPstPercent || 0),

        attritionNhoToFstPstCount: Number(
          account.attritionNhoToFstPstCount || 0,
        ),
        attritionNhoToFstPstPercent: Number(
          account.attritionNhoToFstPstPercent || 0,
        ),

        attritionInterviewToNhoCount: Number(
          account.attritionInterviewToNhoCount || 0,
        ),
        attritionInterviewToNhoPercent: Number(
          account.attritionInterviewToNhoPercent || 0,
        ),

        leadsToInterview: getBackendNumber(account, [
          "leadsToInterview",
          "leads_to_interview",
        ]),
        leads_to_interview: getBackendNumber(account, [
          "leadsToInterview",
          "leads_to_interview",
        ]),

        hiringRate: rowHiringPlanPercent,
        hiring_rate: rowHiringPlanPercent,
        hiringPlanPercent: rowHiringPlanPercent,
        hiring_plan_percent: rowHiringPlanPercent,

        pipelineStatus: account.pipelineStatus || "Pending",
        statusNote: account.headcountRemarks || account.departmentName || "-",

        owner: actionItemOwner || account.owner || "-",

        actionItem,
        action_item: actionItem,

        actionItemOwner,
        action_item_owner: actionItemOwner,

        actionItemOwnerSibsId,
        action_item_owner_sibs_id: actionItemOwnerSibsId,

        actionItemDeadline,
        action_item_deadline: actionItemDeadline,

        actionItemStatus,
        action_item_status: actionItemStatus,

        actionItemRemarks,
        action_item_remarks: actionItemRemarks,

        actionItems,

        departmentName: account.departmentName || "",
        priorityLevel: account.priorityLevel || "",
        headcountRemarks: account.headcountRemarks || "",
        uploadedFile: account.uploadedFile || account.uploaded_file || "",
        uploadedBySibsId:
          account.uploadedBySibsId || account.uploaded_by_sibs_id || "",
        lastEditSibsId: account.lastEditSibsId || account.last_edit_sibs_id || "",
        lastEditName: account.lastEditName || account.last_edit_name || "",
      };

      return {
        ...row,
        pipelineStatus: account.pipelineStatus || calculatePipelineStatus(row),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeWeek?.label,
    activeWeek?.hiringPlanPercent,
    activeWeek?.hiring_plan_percent,
    selectedClusters,
    remoteAccounts,
  ]);

  const hiringPlanAdjustedData = useMemo(() => {
    const percent = isHiringPlanSnapshotLocked
      ? getWeekHiringPlanPercent(activeWeek)
      : Number(selectedHiringPlanPercent || 5);

    return displayData.map((item) => {
      const itemPercent = isHiringPlanSnapshotLocked
        ? getBackendNumber(
            item,
            [
              "hiringPlanPercent",
              "hiring_plan_percent",
              "hiringRate",
              "hiring_rate",
            ],
            percent,
          )
        : percent;

      const itemDecimalPercent = itemPercent > 0 ? itemPercent / 100 : 0.05;

      const actualHeadcountNeeds = Number(
        item.actualHeadcountNeeds ??
          item.actual_headcount_needs ??
          item.projectedEmployeeNeeds ??
          item.projected_employee_needs ??
          item.opsPrf ??
          item.ops_prf ??
          0,
      );

      const leadsToInterview =
        itemDecimalPercent > 0
          ? Math.round(actualHeadcountNeeds / itemDecimalPercent)
          : 0;

      return {
        ...item,

        hiringPlanPercent: itemPercent,
        hiring_plan_percent: itemPercent,

        actualHeadcountNeeds,
        actual_headcount_needs: actualHeadcountNeeds,

        projectedEmployeeNeeds: actualHeadcountNeeds,
        projected_employee_needs: actualHeadcountNeeds,

        leadsToInterview,
        leads_to_interview: leadsToInterview,

        hiringRate: itemPercent,
        hiring_rate: itemPercent,

        pipelineStatus: calculatePipelineStatus({
          ...item,
          actualHeadcountNeeds,
          projectedEmployeeNeeds: actualHeadcountNeeds,
          leadsToInterview,
          hiringRate: itemPercent,
        }),
      };
    });
  }, [
    displayData,
    selectedHiringPlanPercent,
    activeWeek,
    isHiringPlanSnapshotLocked,
  ]);

  const managerDisplayData = useMemo(() => {
    if (weeklyAccess.hasFullAccess) {
      return hiringPlanAdjustedData;
    }

    const assignedAccounts = weeklyAccess.assignedAccounts || [];

    if (!assignedAccounts.length) {
      return [];
    }

    const existingAccountKeys = new Set(
      hiringPlanAdjustedData
        .map((item) =>
          String(getAccountIdFromAny(item) || item.account || "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    );

    const emptyAssignedRows = assignedAccounts
      .map((account) => {
        const accountId = getAccountIdFromAny(account);
        const accountName = getAccountNameFromAny(account);
        const ghlName = getGhlNameFromAny(account);
        const cluster = getClusterFromAny(account);

        const activeHiringPlanPercent = isHiringPlanSnapshotLocked
          ? getWeekHiringPlanPercent(activeWeek)
          : Number(selectedHiringPlanPercent || 5);

        const accountKey = String(accountId || accountName)
          .trim()
          .toLowerCase();

        if (!accountName || existingAccountKeys.has(accountKey)) {
          return null;
        }

        return {
          id: `assigned-empty-${accountId || accountName}`,
          backendAccountId: accountId,
          accountId,
          isAssignedEmptyRow: true,

          week: activeWeek?.label || "Current Week",
          weekId: activeWeek?.id || activeWeekId || "",

          cluster,
          account: accountName,

          requiredHeadcount: 0,
          required_headcount: 0,

          kronosRequiredHeadcount: 0,
          kronos_required_headcount: 0,

          requestedRequiredHeadcount: 0,
          requested_required_headcount: 0,

          recruitmentSettingsStatus: "Kronos",
          recruitment_settings_status: "Kronos",

          updateHeadcountStatus: "",
          update_headcount_status: "",

          headcountStatus: "Kronos",
          headcount_status: "Kronos",

          canManagerUpdateHeadcount: false,
          can_manager_update_headcount: false,

          actualHeadcount: 0,
          actual_headcount: 0,
          bufferHeadcount: 0,
          bufferPercent: 0,
          missingHeadcount: 0,

          scheduledCount: 0,
          presentCount: 0,

          absenteeismCount: 0,
          absenteeismPercent: 0,
          absenteeismPastSixWeeksAverage: 0,
          absenteeism_past_six_weeks_average: 0,

          attritionPastCount: 0,
          attritionPastPercent: 0,
          attritionPastSixWeeksAverage: 0,
          attrition_past_six_weeks_average: 0,

          opsPrf: 0,
          ops_prf: 0,

          projectedEmployeeNeeds: 0,
          projected_employee_needs: 0,

          actualHeadcountNeeds: 0,
          actual_headcount_needs: 0,

          attritionFstToPstCount: 0,
          attritionFstToPstPercent: 0,
          attritionNhoToFstPstCount: 0,
          attritionNhoToFstPstPercent: 0,
          attritionInterviewToNhoCount: 0,
          attritionInterviewToNhoPercent: 0,

          leadsToInterview: 0,
          leads_to_interview: 0,

          hiringRate: activeHiringPlanPercent,
          hiring_rate: activeHiringPlanPercent,
          hiringPlanPercent: activeHiringPlanPercent,
          hiring_plan_percent: activeHiringPlanPercent,

          pipelineStatus: "Pending",
          statusNote: ghlName || "-",

          owner: "-",

          actionItem: "",
          action_item: "",
          actionItemOwner: "",
          action_item_owner: "",
          actionItemOwnerSibsId: "",
          action_item_owner_sibs_id: "",
          actionItemDeadline: "",
          action_item_deadline: "",
          actionItemStatus: "Pending",
          action_item_status: "Pending",
          actionItemRemarks: "",
          action_item_remarks: "",
          actionItems: [],

          departmentName: "",
          priorityLevel: "",
          headcountRemarks: "",
          uploadedFile: "",
          uploadedBySibsId: "",
          lastEditSibsId: "",
          lastEditName: "",
        };
      })
      .filter(Boolean);

    return [...hiringPlanAdjustedData, ...emptyAssignedRows];
  }, [
    activeWeek,
    activeWeekId,
    hiringPlanAdjustedData,
    isHiringPlanSnapshotLocked,
    selectedHiringPlanPercent,
    weeklyAccess,
  ]);

  useEffect(() => {
    setRequiredInputs((prev) => {
      const next = { ...prev };

      managerDisplayData.forEach((item) => {
        if (editedRequiredInputsRef.current.has(item.id)) return;

        next[item.id] = String(
          item.requiredHeadcount ?? item.required_headcount ?? 0,
        );
      });

      return next;
    });
  }, [managerDisplayData]);

  const filteredPlans = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const plans = managerDisplayData.filter((item) => {
      if (!isAllAccountsSelected()) {
        const accountName = item.account || item.accountName || "";

        if (!selectedAccounts.includes(accountName)) {
          return false;
        }
      }

      if (!keyword) return true;

      const searchableText = [
        item.account,
        item.accountName,
        item.cluster,
        item.clusterName,
        item.pipelineStatus,
        item.statusNote,
        item.departmentName,
        item.recruitmentSettingsStatus,
        item.recruitment_settings_status,
        item.updateHeadcountStatus,
        item.update_headcount_status,
        item.headcountStatus,
        item.headcount_status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });

    return plans;
  }, [managerDisplayData, search, selectedAccounts]);

  const previousWeekData = useMemo(() => {
    if (!weeklyVersions.length || !activeWeek) return [];

    const currentIndex = weeklyVersions.findIndex(
      (week) => week.id === activeWeek.id,
    );

    const previousWeek = weeklyVersions[currentIndex + 1];

    if (!previousWeek) return [];

    return previousWeek.records || [];
  }, [weeklyVersions, activeWeek]);

  const previousSelectedPlan = selectedPlan
    ? previousWeekData.find(
        (record) =>
          record.account === selectedPlan.account &&
          record.cluster === selectedPlan.cluster,
      )
    : null;

  useEffect(() => {
    if (!selectedPlan) return;

    const refreshedPlan = filteredPlans.find(
      (plan) => String(plan.id) === String(selectedPlan.id),
    );

    if (refreshedPlan) {
      setSelectedPlan((prev) => ({
        ...prev,
        ...refreshedPlan,
      }));
    }
  }, [filteredPlans, selectedPlan]);

  function openStatusModal({
    type = "success",
    title = "",
    message = "",
    closeViewModalOnSuccess = false,
  }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
      closeViewModalOnSuccess,
    });
  }

  function closeStatusModal() {
    const shouldCloseViewModal =
      statusModal.type === "success" && statusModal.closeViewModalOnSuccess;

    setStatusModal((prev) => ({
      ...prev,
      open: false,
    }));

    if (shouldCloseViewModal) {
      setSelectedPlan(null);
    }
  }

  async function handleLockWeeklyHiringPlan() {
    if (!canManageHiringPlanPercent) {
      openStatusModal({
        type: "error",
        title: "Permission Denied",
        message: "Only HR and HR Admin can lock the hiring plan percentage.",
      });
      return;
    }

    if (hasActiveRecruitmentSettingsRequest(filteredPlans)) {
      openStatusModal({
        type: "error",
        title: "Pending Headcount Request",
        message:
          "Please approve or reject pending Recruitment Settings or Update Headcount requests before locking the hiring plan percentage.",
      });
      return;
    }

    if (isHiringPlanSnapshotLocked) {
      openStatusModal({
        type: "error",
        title: "Already Locked",
        message:
          "This weekly hiring plan percentage is already locked for the selected week.",
      });
      return;
    }

    const recordsToSave = (filteredPlans || [])
      .filter((item) => item.account)
      .map((item) => {
        const cleanRequiredHeadcount = Number(
          item.requiredHeadcount || item.required_headcount || 0,
        );

        const cleanActualHeadcount = Number(
          item.actualHeadcount || item.actual_headcount || 0,
        );

        const cleanOpsPrf = Number(item.opsPrf || item.ops_prf || 0);

        const cleanActualHeadcountNeeds = Number(
          item.actualHeadcountNeeds || item.actual_headcount_needs || 0,
        );

        const cleanLeadsToInterview = Number(
          item.leadsToInterview || item.leads_to_interview || 0,
        );

        const recruitmentStatus = getRecruitmentSettingsStatus(item);

        return {
          weekNumber: activeWeek?.weekNumber || null,
          weekLabel: activeWeek?.label || null,
          weekStart: activeWeekStartDate,
          weekEnd: activeWeekEndDate,
          clusterName: item.cluster || item.clusterName || "",
          accountName: item.account || item.accountName || "",

          requiredHeadcount: cleanRequiredHeadcount,
          actualHeadcount: cleanActualHeadcount,
          opsPrf: cleanOpsPrf,
          actualHeadcountNeeds: cleanActualHeadcountNeeds,
          leadsToInterview: cleanLeadsToInterview,

          hiringPlanPercent: Number(selectedHiringPlanPercent || 5),
          hiring_plan_percent: Number(selectedHiringPlanPercent || 5),

          priorityLevel: item.priorityLevel || item.priority_level || "",

          remarks:
            item.headcountRemarks ||
            item.remarks ||
            item.statusNote ||
            `Locked hiring plan at ${selectedHiringPlanPercent}%`,

          uploadedFile: item.uploadedFile || item.uploaded_file || "",
          uploadedBySibsId:
            item.uploadedBySibsId || item.uploaded_by_sibs_id || "",

          status:
            String(recruitmentStatus).toLowerCase() === "approved"
              ? "Approved"
              : "Pending",
        };
      });

    if (!recordsToSave.length) {
      openStatusModal({
        type: "error",
        title: "No Records Found",
        message: "There are no affected account records to lock for this week.",
      });
      return;
    }

    try {
      setLockingWeeklyPlan(true);

      const result = await lockWeeklyHiringPlanSnapshot({
        weekNumber: activeWeek?.weekNumber || null,
        weekLabel: activeWeek?.label || null,
        weekStart: activeWeekStartDate,
        weekEnd: activeWeekEndDate,
        hiringPlanPercent: selectedHiringPlanPercent,
        records: recordsToSave,
      });

      if (!result?.success) {
        if (result?.locked) {
          markActiveWeekLocked(
            result?.data?.hiringPlanPercent || selectedHiringPlanPercent,
          );
        }

        openStatusModal({
          type: "error",
          title: result?.locked ? "Already Locked" : "Lock Failed",
          message: result?.message || "Failed to lock weekly hiring plan.",
        });

        return;
      }

      markActiveWeekLocked(
        result?.data?.hiringPlanPercent || selectedHiringPlanPercent,
      );

      await fetchAccountsByCluster({
        resetAccountFilter: false,
      });

      openStatusModal({
        type: "success",
        title: "Weekly Hiring Plan Locked",
        message:
          result?.message ||
          `Saved ${recordsToSave.length} affected account records for the selected week.`,
      });
    } catch (error) {
      console.error("LOCK WEEKLY HIRING PLAN ERROR:", error);

      const responseData = error?.response?.data;

      if (responseData?.locked) {
        markActiveWeekLocked(
          responseData?.data?.hiringPlanPercent || selectedHiringPlanPercent,
        );
      }

      openStatusModal({
        type: "error",
        title: responseData?.locked ? "Already Locked" : "Lock Failed",
        message:
          responseData?.message ||
          responseData?.error ||
          error?.message ||
          "Failed to lock weekly hiring plan.",
      });
    } finally {
      setLockingWeeklyPlan(false);
    }
  }

  function handleRequiredInputChange(itemId, value) {
    editedRequiredInputsRef.current.add(itemId);

    setRequiredInputs((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  }

  function handleWeeklyPlanFileChange(itemId, file) {
    setWeeklyPlanFiles((prev) => ({
      ...prev,
      [itemId]: file,
    }));
  }

  async function handleSaveRequiredHeadcount(item, options = {}) {
    const { silent = false, overrideRequiredHeadcount } = options;

    const canUpdateThisRequest =
      !isHrOrHrAdmin &&
      isManagerOrOps &&
      canManagerUpdateApprovedHeadcount({
        item,
        canEditRequiredHeadcount,
        weeklyAccess,
      });

    if (!canUpdateThisRequest) {
      if (!silent) {
        openStatusModal({
          type: "error",
          title: "Approval Required",
          message:
            "Manager updates are allowed only after the Recruitment Settings headcount request is approved.",
        });
      }

      return;
    }

    if (!activeWeekStartDate || !activeWeekEndDate) {
      if (!silent) {
        openStatusModal({
          type: "error",
          title: "Unable to Save",
          message:
            "Missing weekly date range. Please select a valid weekly version.",
        });
      }
      return;
    }

    const rawValue =
      overrideRequiredHeadcount !== undefined &&
      overrideRequiredHeadcount !== null &&
      overrideRequiredHeadcount !== ""
        ? overrideRequiredHeadcount
        : requiredInputs[item.id];

    const requiredHeadcount =
      rawValue === "" || rawValue === null || rawValue === undefined
        ? null
        : Number(rawValue);

    if (requiredHeadcount !== null && !Number.isFinite(requiredHeadcount)) {
      if (!silent) {
        openStatusModal({
          type: "error",
          title: "Invalid Input",
          message: "Invalid required headcount.",
        });
      }
      return;
    }

    try {
      setSavingRequiredId(item.id);

      await saveRequiredHeadcount({
        weekNumber: activeWeek?.weekNumber || null,
        weekLabel: activeWeek?.label || null,
        weekStart: activeWeekStartDate,
        weekEnd: activeWeekEndDate,
        clusterName: item.cluster || item.clusterName || item.cluster_name,
        accountName: item.account || item.accountName || item.account_name,
        requiredHeadcount,
        actualHeadcount: Number(
          item.actualHeadcount || item.actual_headcount || 0,
        ),
        opsPrf: Number(item.opsPrf || item.ops_prf || 0),
        actualHeadcountNeeds: Number(
          item.actualHeadcountNeeds || item.actual_headcount_needs || 0,
        ),
        priorityLevel: item.priorityLevel || item.priority_level || null,
        remarks:
          item.headcountRemarks || item.remarks || item.statusNote || null,
        status: "Pending",
      });

      setRequiredInputs((prev) => ({
        ...prev,
        [item.id]: String(item.requiredHeadcount ?? item.required_headcount ?? 0),
      }));

      editedRequiredInputsRef.current.delete(item.id);

      await fetchAccountsByCluster({ resetAccountFilter: false });

      if (!silent) {
        openStatusModal({
          type: "success",
          title: "Update Headcount Submitted",
          message: `Update Headcount request for ${item.account} was submitted for approval. The table will continue showing the approved headcount until the update is approved.`,
          closeViewModalOnSuccess: true,
        });
      }
    } catch (error) {
      console.error("SAVE REQUIRED HEADCOUNT ERROR:", error);

      if (!silent) {
        openStatusModal({
          type: "error",
          title: "Save Failed",
          message:
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            "Failed to save required headcount.",
        });
      }

      throw error;
    } finally {
      setSavingRequiredId("");
    }
  }

  async function handleUpdateWeeklyPlanFile(item, overrideRequiredHeadcount) {
    const canUpdateThisRequest =
      !isHrOrHrAdmin &&
      isManagerOrOps &&
      canManagerUpdateApprovedHeadcount({
        item,
        canEditRequiredHeadcount,
        weeklyAccess,
      });

    if (!canUpdateThisRequest) {
      openStatusModal({
        type: "error",
        title: "Approval Required",
        message:
          "Manager file updates are allowed only after the Recruitment Settings headcount request is approved.",
      });

      return;
    }

    const file = weeklyPlanFiles[item.id];

    if (!file) {
      openStatusModal({
        type: "error",
        title: "No File Selected",
        message: "Please select a file before uploading.",
      });
      return;
    }

    if (!activeWeekStartDate || !activeWeekEndDate) {
      openStatusModal({
        type: "error",
        title: "Unable to Upload",
        message:
          "Missing weekly date range. Please select a valid weekly version.",
      });
      return;
    }

    const rawRequiredValue =
      overrideRequiredHeadcount !== undefined &&
      overrideRequiredHeadcount !== null &&
      overrideRequiredHeadcount !== ""
        ? overrideRequiredHeadcount
        : requiredInputs[item.id] !== undefined &&
            requiredInputs[item.id] !== null &&
            requiredInputs[item.id] !== ""
          ? requiredInputs[item.id]
          : item.requiredHeadcount ?? item.required_headcount ?? 0;

    const requiredHeadcount = Number(rawRequiredValue);

    if (!Number.isFinite(requiredHeadcount)) {
      openStatusModal({
        type: "error",
        title: "Invalid Input",
        message: "Invalid required headcount.",
      });
      return;
    }

    try {
      setSavingFileId(item.id);

      await updateWeeklyHiringPlanFile({
        weekNumber: activeWeek?.weekNumber || null,
        weekLabel: activeWeek?.label || null,
        weekStart: activeWeekStartDate,
        weekEnd: activeWeekEndDate,
        clusterName: item.cluster || item.clusterName || item.cluster_name,
        accountName: item.account || item.accountName || item.account_name,
        requiredHeadcount,
        actualHeadcount: Number(
          item.actualHeadcount || item.actual_headcount || 0,
        ),
        opsPrf: Number(item.opsPrf || item.ops_prf || 0),
        actualHeadcountNeeds: Number(
          item.actualHeadcountNeeds || item.actual_headcount_needs || 0,
        ),
        priorityLevel: item.priorityLevel || item.priority_level || null,
        remarks:
          item.headcountRemarks || item.remarks || item.statusNote || null,
        status: "Pending",
        uploadedFile: file,
      });

      setRequiredInputs((prev) => ({
        ...prev,
        [item.id]: String(item.requiredHeadcount ?? item.required_headcount ?? 0),
      }));

      editedRequiredInputsRef.current.delete(item.id);

      await fetchAccountsByCluster({ resetAccountFilter: false });

      setWeeklyPlanFiles((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });

      openStatusModal({
        type: "success",
        title: "Update Submitted",
        message: `Weekly hiring plan update for ${item.account} was submitted for approval. The table will continue showing the approved headcount until the new update is approved.`,
        closeViewModalOnSuccess: true,
      });
    } catch (error) {
      console.error("UPDATE WEEKLY PLAN FILE ERROR:", error);

      openStatusModal({
        type: "error",
        title: "Upload Failed",
        message:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to upload weekly hiring plan file.",
      });

      throw error;
    } finally {
      setSavingFileId("");
    }
  }

  async function handleOpenUploadedFile({ sibsId, filename }) {
    try {
      setOpeningFile(true);

      await openWeeklyHiringPlanFile({
        sibsId,
        filename,
      });
    } catch (error) {
      console.error("OPEN WEEKLY PLAN FILE ERROR:", error);

      openStatusModal({
        type: "error",
        title: "Unable to Open File",
        message:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to open file.",
      });
    } finally {
      setOpeningFile(false);
    }
  }

  function handleOpenActionItemModal(item) {
    setActionItemTarget(item);

    setActionItemForm({
      ...initialActionItemForm,
      owner:
        item.actionItemOwner ||
        item.action_item_owner ||
        getLoggedInOwnerDisplay(user),
    });
  }

  function handleCloseActionItemModal() {
    setActionItemTarget(null);
    setActionItemForm(initialActionItemForm);
    setActionItemSubmitting(false);
  }

  async function handleSubmitActionItem(e) {
    e.preventDefault();

    if (!actionItemTarget || actionItemSubmitting) return;

    if (!actionItemForm.actionItem?.trim()) {
      openStatusModal({
        type: "error",
        title: "Missing Action Item",
        message: "Please enter an action item.",
      });
      return;
    }

    if (!actionItemForm.deadline) {
      openStatusModal({
        type: "error",
        title: "Missing Deadline",
        message: "Please select a deadline.",
      });
      return;
    }

    if (!activeWeekStartDate || !activeWeekEndDate) {
      openStatusModal({
        type: "error",
        title: "Missing Weekly Date",
        message: "Please select a valid weekly version.",
      });
      return;
    }

    try {
      setActionItemSubmitting(true);

      const result = await saveWeeklyHiringPlanActionItem({
        weekStart: activeWeekStartDate,
        weekEnd: activeWeekEndDate,
        clusterName: actionItemTarget.cluster || actionItemTarget.clusterName,
        accountName: actionItemTarget.account || actionItemTarget.accountName,
        actionItem: actionItemForm.actionItem,
        deadline: actionItemForm.deadline,
        status: actionItemForm.status || "Pending",
        actionItemRemarks: actionItemForm.actionItemRemarks || "",
      });

      if (!result?.success) {
        openStatusModal({
          type: "error",
          title: "Save Failed",
          message: result?.message || "Failed to save action item.",
        });
        return;
      }

      const savedActionItem = {
        actionItem: result.data?.actionItem || actionItemForm.actionItem,
        action_item: result.data?.action_item || actionItemForm.actionItem,

        owner:
          result.data?.owner ||
          result.data?.actionItemOwner ||
          result.data?.action_item_owner ||
          actionItemForm.owner,
        actionItemOwner:
          result.data?.actionItemOwner ||
          result.data?.action_item_owner ||
          actionItemForm.owner,
        action_item_owner:
          result.data?.action_item_owner ||
          result.data?.actionItemOwner ||
          actionItemForm.owner,

        ownerSibsId:
          result.data?.actionItemOwnerSibsId ||
          result.data?.action_item_owner_sibs_id ||
          "",
        actionItemOwnerSibsId:
          result.data?.actionItemOwnerSibsId ||
          result.data?.action_item_owner_sibs_id ||
          "",
        action_item_owner_sibs_id:
          result.data?.action_item_owner_sibs_id ||
          result.data?.actionItemOwnerSibsId ||
          "",

        deadline:
          result.data?.deadline ||
          result.data?.actionItemDeadline ||
          result.data?.action_item_deadline ||
          actionItemForm.deadline,
        actionItemDeadline:
          result.data?.actionItemDeadline ||
          result.data?.action_item_deadline ||
          actionItemForm.deadline,
        action_item_deadline:
          result.data?.action_item_deadline ||
          result.data?.actionItemDeadline ||
          actionItemForm.deadline,

        status:
          result.data?.status ||
          result.data?.actionItemStatus ||
          result.data?.action_item_status ||
          actionItemForm.status,
        actionItemStatus:
          result.data?.actionItemStatus ||
          result.data?.action_item_status ||
          actionItemForm.status,
        action_item_status:
          result.data?.action_item_status ||
          result.data?.actionItemStatus ||
          actionItemForm.status,

        actionItemRemarks:
          result.data?.actionItemRemarks ||
          result.data?.action_item_remarks ||
          actionItemForm.actionItemRemarks,
        action_item_remarks:
          result.data?.action_item_remarks ||
          result.data?.actionItemRemarks ||
          actionItemForm.actionItemRemarks,
      };

      const updatedItem = {
        ...actionItemTarget,
        actionItem: savedActionItem.actionItem,
        action_item: savedActionItem.action_item,
        actionItemOwner: savedActionItem.actionItemOwner,
        action_item_owner: savedActionItem.action_item_owner,
        owner: savedActionItem.owner,
        actionItemOwnerSibsId: savedActionItem.actionItemOwnerSibsId,
        action_item_owner_sibs_id: savedActionItem.action_item_owner_sibs_id,
        actionItemDeadline: savedActionItem.actionItemDeadline,
        action_item_deadline: savedActionItem.action_item_deadline,
        actionItemStatus: savedActionItem.actionItemStatus,
        action_item_status: savedActionItem.action_item_status,
        actionItemRemarks: savedActionItem.actionItemRemarks,
        action_item_remarks: savedActionItem.action_item_remarks,
        actionItems: [savedActionItem],
      };

      setSelectedPlan((prev) => {
        if (!prev) return prev;

        const sameAccount =
          String(prev.account || "").trim().toLowerCase() ===
          String(actionItemTarget.account || "").trim().toLowerCase();

        if (!sameAccount) return prev;

        return {
          ...prev,
          ...updatedItem,
        };
      });

      setRemoteAccounts((prev) =>
        prev.map((account) => {
          const sameAccount =
            String(account.accountName || account.account || "")
              .trim()
              .toLowerCase() ===
            String(actionItemTarget.account || "").trim().toLowerCase();

          if (!sameAccount) return account;

          return {
            ...account,
            ...updatedItem,
          };
        }),
      );

      handleCloseActionItemModal();

      openStatusModal({
        type: "success",
        title: "Action Item Saved",
        message: "The weekly hiring action item was saved successfully.",
      });
    } catch (error) {
      console.error("SAVE ACTION ITEM ERROR:", error);

      openStatusModal({
        type: "error",
        title: "Save Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to save action item.",
      });
    } finally {
      setActionItemSubmitting(false);
    }
  }

  const filteredAccountOptions = useMemo(() => {
    const keyword = accountSearch.trim().toLowerCase();

    return (accountOptions || [])
      .filter((account) => account.id !== "All")
      .filter((account) => {
        if (!keyword) return true;

        const searchableText = [
          account.accountName,
          account.gy_acc_name,
          account.ghlName,
          account.gy_acc_ghl_name,
          account.clusterName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(keyword);
      });
  }, [accountOptions, accountSearch]);

  const selectedPlanCanEditRequiredHeadcount = selectedPlan
    ? !isHrOrHrAdmin &&
      isManagerOrOps &&
      canManagerUpdateApprovedHeadcount({
        item: selectedPlan,
        canEditRequiredHeadcount,
        weeklyAccess,
      })
    : false;

  const hasPendingRecruitmentSettingsRequest =
    hasActiveRecruitmentSettingsRequest(filteredPlans);

  const canEditHiringPlanPercentNow =
    canManageHiringPlanPercent && !hasPendingRecruitmentSettingsRequest;

  return (
    <div
      className={`flex h-screen flex-1 flex-col ${FLAT_PAGE_BG} font-jakarta`}
    >
      <Header />

      <main
        ref={mainScrollRef}
        className="min-w-0 flex-1 overflow-y-scroll overflow-x-hidden px-3 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-6"
      >
        <div className="sibs-page-header-in mb-5 flex min-w-0 flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0 xl:max-w-[520px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <ClipboardList size={14} />
              Recruitment
            </div>

            <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
              Weekly Hiring Plan
            </h1>

            <p className="mt-1 text-sm font-medium leading-6 text-sibs-tertiary-5">
              Manage weekly manpower requirement, OPS PRF, hiring plan
              percentage, leads needed, and action items.
            </p>
          </div>

          <div className="w-full xl:flex xl:flex-1 xl:justify-end">
            <WeeklyVersionTable
              weekDropdownRef={weekDropdownRef}
              clusterDropdownRef={clusterDropdownRef}
              accountDropdownRef={accountDropdownRef}
              activeWeek={activeWeek}
              activeWeekId={activeWeekId}
              setActiveWeekId={setActiveWeekId}
              weeksLoading={weeksLoading}
              weekSearch={weekSearch}
              setWeekSearch={setWeekSearch}
              showWeekDropdown={showWeekDropdown}
              setShowWeekDropdown={setShowWeekDropdown}
              filteredWeeklyVersions={filteredWeeklyVersions}
              selectedClusters={selectedClusters}
              setSelectedClusters={setSelectedClusters}
              showClusterDropdown={showClusterDropdown}
              setShowClusterDropdown={setShowClusterDropdown}
              selectedAccounts={selectedAccounts}
              setSelectedAccounts={setSelectedAccounts}
              showAccountDropdown={showAccountDropdown}
              setShowAccountDropdown={setShowAccountDropdown}
              accountSearch={accountSearch}
              setAccountSearch={setAccountSearch}
              accountsLoading={accountsLoading}
              filteredAccountOptions={filteredAccountOptions}
              isAllClustersSelected={isAllClustersSelected}
              isAllAccountsSelected={isAllAccountsSelected}
              handleToggleCluster={handleToggleCluster}
              handleToggleAccount={handleToggleAccount}
              user={user}
              assignedAccounts={user?.assignedAccounts || []}
            />
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <section
            className={`relative z-[20] ${APPROVAL_EDGE}`}
            style={{ animationDelay: "60ms" }}
          >
            <HeadcountTable filteredPlans={filteredPlans} />
          </section>

          <section
            className={`relative z-[10] ${APPROVAL_EDGE}`}
            style={{ animationDelay: "120ms" }}
          >
            <PercentageRiskGraphTable filteredPlans={filteredPlans} />
          </section>

          <section
            key={`${activeWeekId}-${selectedClusters.join(
              "-",
            )}-${selectedAccounts.join(
              "-",
            )}-${search}-${selectedHiringPlanPercent}`}
            className={`relative z-[0] ${APPROVAL_EDGE}`}
            style={{ animationDelay: "180ms" }}
          >
            <WeeklyHiringAccountsTable
              accountsLoading={accountsLoading}
              filteredPlans={filteredPlans}
              onViewPlan={setSelectedPlan}
            />
          </section>
        </div>
      </main>

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={closeStatusModal}
      />

      <ViewPlanModal
        open={!!selectedPlan}
        item={selectedPlan}
        locked={isHiringPlanSnapshotLocked}
        canEditRequiredHeadcount={selectedPlanCanEditRequiredHeadcount}
        previousWeekItem={previousSelectedPlan}
        requiredInputValue={selectedPlan ? requiredInputs[selectedPlan.id] : ""}
        savingRequiredId={savingRequiredId}
        savingFileId={savingFileId}
        weeklyPlanFile={selectedPlan ? weeklyPlanFiles[selectedPlan.id] : null}
        existingUploadedFile={selectedPlan?.uploadedFile || ""}
        uploadedBySibsId={
          selectedPlan?.uploadedBySibsId || user?.username || user?.sibsId || ""
        }
        openingFile={openingFile}
        onRequiredInputChange={handleRequiredInputChange}
        onWeeklyPlanFileChange={handleWeeklyPlanFileChange}
        onSaveRequiredHeadcount={handleSaveRequiredHeadcount}
        onUpdateWeeklyPlanFile={handleUpdateWeeklyPlanFile}
        onOpenUploadedFile={handleOpenUploadedFile}
        onClose={() => setSelectedPlan(null)}
        onOpenActionItem={handleOpenActionItemModal}
        actionItemOpen={!!actionItemTarget}
        actionItemTarget={actionItemTarget}
        actionItemForm={actionItemForm}
        setActionItemForm={setActionItemForm}
        onCloseActionItem={handleCloseActionItemModal}
        onSubmitActionItem={handleSubmitActionItem}
        actionItemSubmitting={actionItemSubmitting}
      />

      <KPISnapshotModal
        open={showKpiSnapshot}
        week={activeWeek}
        records={filteredPlans}
        onClose={() => setShowKpiSnapshot(false)}
      />
    </div>
  );
}