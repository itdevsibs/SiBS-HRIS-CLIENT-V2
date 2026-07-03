import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Eye,
  FileCheck2,
  Filter,
  ListChecks,
  Loader2,
  Mail,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

import FormBuilderCard from "../../components/recruitment/settings/FormBuilderCard";
import FormLaunchRulesCard from "../../components/recruitment/settings/FormLaunchRulesCard";
import PlaceholderSettingsPanel from "../../components/recruitment/settings/PlaceholderSettingsPanel";
import RelatedRecruitmentSettingsCard from "../../components/recruitment/settings/RelatedRecruitmentSettingsCard";
import SettingsInfoCards from "../../components/recruitment/settings/SettingsInfoCards";
import ApprovalRulesSettings from "../../components/recruitment/settings/ApprovalRulesSettings";
import StatusModal from "../../components/modals/StatusModal";

import api from "../../lib/axios/api-template";
import { useUser } from "../../services/context/UserContext";
import { useRecruitmentSettings } from "../../services/context/RecruitmentSettingsContext";
import Header from "../../components/layout/Header";

const tabIconMap = {
  "Update Headcounts": ClipboardList,
  "Final Interview Form": ClipboardCheck,
  "Pipeline Settings": SlidersHorizontal,
  "Assessment Settings": FileCheck2,
  "Email Templates": Mail,
  "Approval Rules": ShieldCheck,
};

const RECRUITMENT_HEADCOUNT_PAGE_LIMIT = 8;

const RECRUITMENT_HEADCOUNT_CLUSTER_OPTIONS = [
  { label: "All Clusters", value: "All" },
  { label: "Coast Dental", value: "Coast Dental" },
  { label: "US Visa", value: "US Visa" },
  { label: "SME", value: "SME" },
  { label: "Yomdel", value: "Yomdel" },
  { label: "Corporate", value: "Corporate" },
];

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

function canEditRequiredHeadcountByRole(user) {
  const roleCandidates = getUserRoleCandidates(user);
  const adminAccess = getCurrentAdminAccess(user);

  return roleCandidates.some(isHrRoleValue) || adminAccess === 7;
}

function normalizeStatusValue(value, fallback = "Pending") {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) return fallback;

  const normalized = rawValue.toLowerCase();

  if (normalized === "approved") return "Approved";
  if (normalized === "rejected" || normalized === "declined") return "Rejected";
  if (normalized === "pending") return "Pending";
  if (normalized === "for review") return "For Review";
  if (normalized === "no request") return "No Request";
  if (normalized === "kronos") return "Kronos";

  return rawValue;
}

function getRecruitmentSettingsStatus(item = {}) {
  return normalizeStatusValue(
    item?.recruitmentSettingsStatus ||
      item?.recruitment_settings_status ||
      item?.recruitmentStatus ||
      item?.recruitment_status ||
      item?.baseHeadcountStatus ||
      item?.base_headcount_status ||
      item?.status ||
      "Pending",
    "Pending",
  );
}

function getStatusClass(status) {
  switch (status) {
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "Pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "For Review":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Kronos":
      return "border-slate-200 bg-slate-50 text-slate-600";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function StatusPill({ status, fallback = "Pending" }) {
  const displayStatus = status || fallback;

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
        displayStatus,
      )}`}
    >
      {displayStatus}
    </span>
  );
}

function inputClass(extra = "") {
  return `h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function AnimatedDropdown({ open, children, className = "" }) {
  return (
    <div
      className={`absolute left-0 right-0 top-full mt-2 grid transition-all duration-300 ease-out ${
        open
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0"
      } ${className}`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl transition-all duration-300 ease-out ${
            open ? "translate-y-0 scale-100" : "-translate-y-2 scale-[0.98]"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function CustomSelect({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Select",
  zIndex = "z-30",
  disabled = false,
  loading = false,
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption =
    options.find((option) => String(option.value) === String(value)) || null;

  const displayValue = loading
    ? "Loading..."
    : selectedOption?.label || placeholder;

  useEffect(() => {
    if (disabled || loading) {
      setOpen(false);
    }
  }, [disabled, loading]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${zIndex}`}>
      <label className="mb-1 block text-sm font-bold text-[#101828]">
        {label}
      </label>

      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => {
          if (disabled || loading) return;
          setOpen((prev) => !prev);
        }}
        className="flex h-12 w-full items-center justify-between rounded-xl border border-[#D0D5DD] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition-all duration-200 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
      >
        <span className="truncate">{displayValue}</span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatedDropdown open={open}>
        <div className="max-h-64 overflow-y-auto py-2 sibs-scrollbar">
          {options.length > 0 ? (
            options.map((option) => {
              const selected = String(value) === String(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange?.(option.value, option);
                    setOpen(false);
                  }}
                  className={`block w-full px-4 py-3 text-left text-sm transition ${
                    selected
                      ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                      : "text-[#344054] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span className="block truncate">{option.label}</span>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-3 text-sm font-bold text-sibs-tertiary-5">
              No options available.
            </div>
          )}
        </div>
      </AnimatedDropdown>
    </div>
  );
}

function formatDateOnly(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRecruitmentWeekOption(week = {}) {
  const label =
    week.label ||
    week.weekLabel ||
    week.week_label ||
    (week.year && week.weekNumber
      ? `${week.year} Week ${week.weekNumber}`
      : "Weekly Version");

  const range =
    week.weekRange ||
    week.week_range ||
    (week.startDate || week.weekStart
      ? `${formatDateOnly(week.startDate || week.weekStart)} - ${formatDateOnly(
          week.endDate || week.weekEnd,
        )}`
      : "");

  return range ? `${label} — ${range}` : label;
}

function getActualHeadcount(item) {
  return item?.actualHeadcount ?? item?.actual_headcount ?? 0;
}

function getOpsPrf(item) {
  return item?.opsPrf ?? item?.ops_prf ?? 0;
}

function getActualHeadcountNeeds(item) {
  return item?.actualHeadcountNeeds ?? item?.actual_headcount_needs ?? 0;
}

async function saveRequiredHeadcountOverride(item, requiredHeadcount) {
  const cleanRequiredHeadcount = Number(requiredHeadcount);

  if (!Number.isFinite(cleanRequiredHeadcount) || cleanRequiredHeadcount < 0) {
    throw new Error("Invalid required headcount.");
  }

  const payload = {
    weekNumber: item?.weekNumber || item?.week_number || null,
    weekLabel: item?.weekLabel || item?.week_label || null,
    weekStart: item?.weekStart || item?.week_start || null,
    weekEnd: item?.weekEnd || item?.week_end || null,
    clusterName: item?.clusterName || item?.cluster || item?.cluster_name,
    accountName: item?.accountName || item?.account || item?.account_name,
    requiredHeadcount: cleanRequiredHeadcount,
    actualHeadcount: Number(getActualHeadcount(item)),
    opsPrf: Number(getOpsPrf(item)),
    actualHeadcountNeeds: Number(getActualHeadcountNeeds(item)),
    priorityLevel: item?.priorityLevel || item?.priority_level || null,
    remarks:
      item?.remarks ||
      item?.headcountRemarks ||
      item?.headcount_remarks ||
      null,
    status: "Approved",
  };

  const res = await api.put("/api/recruitment-settings/headcount", payload, {
    withCredentials: true,
  });

  return res?.data || res;
}

function getHeadcountNumberValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      const numberValue = Number(value);

      if (Number.isFinite(numberValue)) {
        return numberValue;
      }
    }
  }

  return 0;
}

function formatHeadcountPercent(value) {
  const numberValue = Number(value || 0);

  if (Math.abs(numberValue) > 0 && Math.abs(numberValue) <= 1) {
    return `${(numberValue * 100).toFixed(2)}%`;
  }

  return `${numberValue.toFixed(2)}%`;
}

function formatHeadcountNumber(value, maximumFractionDigits = 0) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits,
  });
}

function getActualBufferClass(value) {
  return Number(value || 0) < 0 ? "text-red-700" : "text-emerald-700";
}

function getRecruitmentAccountName(item = {}) {
  return String(
    item.accountName ||
      item.account ||
      item.account_name ||
      item.gy_acc_name ||
      "Unassigned Account",
  ).trim();
}

function getRecruitmentClusterName(item = {}) {
  const accountName = getRecruitmentAccountName(item);
  const ghlName = String(
    item.ghlName || item.gy_acc_ghl_name || item.ghl_name || "",
  ).trim();

  const combinedText = `${accountName} ${ghlName}`.toLowerCase();

  if (
    combinedText.includes("cd -") ||
    combinedText.includes("cd-") ||
    combinedText.includes("coast dental")
  ) {
    return "Coast Dental";
  }

  if (combinedText.includes("us visa")) {
    return "US Visa";
  }

  if (
    combinedText.includes("sme-") ||
    combinedText.includes("sme -") ||
    combinedText.includes("frontsteps") ||
    combinedText.includes("front steps")
  ) {
    return "SME";
  }

  if (combinedText.includes("yomdel")) {
    return "Yomdel";
  }

  return String(
    item.clusterName || item.cluster || item.cluster_name || "Corporate",
  ).trim();
}

function getRecruitmentWeekPercent(week = {}) {
  const value =
    week.hiringPlanPercent ??
    week.hiring_plan_percent ??
    week.displayHiringPlanPercent ??
    week.display_hiring_plan_percent ??
    week.hiringRate ??
    week.hiring_rate ??
    5;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 5;
}

function getRecruitmentStatusForHeadcountTable(item = {}) {
  const hasExplicitStatus = Boolean(
    item?.recruitmentSettingsStatus ||
    item?.recruitment_settings_status ||
    item?.recruitmentStatus ||
    item?.recruitment_status ||
    item?.baseHeadcountStatus ||
    item?.base_headcount_status ||
    item?.status,
  );

  if (!hasExplicitStatus) return "Kronos";

  return getRecruitmentSettingsStatus(item);
}

function getRecruitmentHeadcountMetrics(item = {}) {
  const requiredHeadcount = getHeadcountNumberValue(
    item.requiredHeadcount,
    item.required_headcount,
    item.kronosRequiredHeadcount,
    item.kronos_required_headcount,
  );

  const actualHeadcount = getHeadcountNumberValue(
    item.actualHeadcount,
    item.actual_headcount,
  );

  const requiredBufferHeadcount = getHeadcountNumberValue(
    item.requiredBufferHeadcount,
    item.required_buffer_headcount,
    item.bufferHeadcount,
    item.buffer_headcount,
    Math.round(requiredHeadcount * 0.1),
  );

  const requiredBufferPercent = getHeadcountNumberValue(
    item.requiredBufferPercent,
    item.required_buffer_percent,
    item.bufferPercent,
    item.buffer_percent,
    requiredHeadcount > 0
      ? (requiredBufferHeadcount / requiredHeadcount) * 100
      : 0,
  );

  const actualBufferCount = getHeadcountNumberValue(
    item.actualBufferCount,
    item.actual_buffer_count,
    item.missingHeadcount,
    item.missing_headcount,
    actualHeadcount - requiredHeadcount,
  );

  const actualBufferPercent = getHeadcountNumberValue(
    item.actualBufferPercent,
    item.actual_buffer_percent,
    requiredHeadcount > 0 ? (actualBufferCount / requiredHeadcount) * 100 : 0,
  );

  const requiredActualHeadcountWithBuffer = getHeadcountNumberValue(
    item.requiredActualHeadcountWithBuffer,
    item.required_actual_headcount_with_buffer,
    requiredHeadcount + requiredBufferHeadcount,
  );

  const absenteeismPastSixWeeksAverage = getHeadcountNumberValue(
    item.absenteeismPastSixWeeksAverage,
    item.absenteeism_past_six_weeks_average,
    item.absenteeismOpsCount,
    item.absenteeism_ops_count,
    item.absenteeismCount,
    item.absenteeism_count,
  );

  const attritionPastSixWeeksAverage = getHeadcountNumberValue(
    item.attritionPastSixWeeksAverage,
    item.attrition_past_six_weeks_average,
    item.attritionPastCount,
    item.attrition_past_count,
  );

  const opsPrf = getHeadcountNumberValue(item.opsPrf, item.ops_prf);

  const actualHeadcountNeeds = getHeadcountNumberValue(
    item.actualHeadcountNeeds,
    item.actual_headcount_needs,
    requiredBufferHeadcount +
      absenteeismPastSixWeeksAverage +
      attritionPastSixWeeksAverage +
      opsPrf,
  );

  const hiringRate = getHeadcountNumberValue(
    item.hiringRate,
    item.hiring_rate,
    item.hiringPlanPercent,
    item.hiring_plan_percent,
    5,
  );

  const leadsToInterview = getHeadcountNumberValue(
    item.leadsToInterview,
    item.leads_to_interview,
    actualHeadcountNeeds > 0 && hiringRate > 0
      ? Math.round(actualHeadcountNeeds / (hiringRate / 100))
      : 0,
  );

  return {
    requiredHeadcount,
    actualHeadcount,
    requiredBufferHeadcount,
    requiredBufferPercent,
    actualBufferCount,
    actualBufferPercent,
    requiredActualHeadcountWithBuffer,
    absenteeismPastSixWeeksAverage,
    attritionPastSixWeeksAverage,
    opsPrf,
    actualHeadcountNeeds,
    leadsToInterview,
    hiringRate,
  };
}

function RecruitmentHeadcountMobileMetric({
  label,
  value,
  valueClassName = "text-sibs-primary-1",
}) {
  return (
    <div className="rounded-xl bg-[#F8FAFC] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className={`mt-1 text-sm font-extrabold ${valueClassName}`}>
        {value}
      </div>
    </div>
  );
}

function FinalInterviewDropdownDesignFix() {
  return (
    <style>
      {`
        [data-final-interview-panel="true"] select {
          height: 48px !important;
          width: 100% !important;
          appearance: none !important;
          -webkit-appearance: none !important;
          border-radius: 12px !important;
          border: 1px solid #D0D5DD !important;
          background-color: #FFFFFF !important;
          color: #344054 !important;
          font-size: 14px !important;
          font-weight: 800 !important;
          padding: 0 44px 0 16px !important;
          outline: none !important;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06) !important;
          transition: border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease !important;
          background-image:
            linear-gradient(45deg, transparent 50%, #0D4676 50%),
            linear-gradient(135deg, #0D4676 50%, transparent 50%) !important;
          background-position:
            calc(100% - 21px) calc(50% - 2px),
            calc(100% - 15px) calc(50% - 2px) !important;
          background-size:
            6px 6px,
            6px 6px !important;
          background-repeat: no-repeat !important;
        }

        [data-final-interview-panel="true"] select:hover {
          border-color: rgba(13, 70, 118, 0.3) !important;
          background-color: #F8FAFC !important;
        }

        [data-final-interview-panel="true"] select:focus,
        [data-final-interview-panel="true"] select:focus-visible {
          border-color: #0D4676 !important;
          color: #0D4676 !important;
          box-shadow: 0 0 0 4px rgba(13, 70, 118, 0.10) !important;
        }

        [data-final-interview-panel="true"] label {
          color: #101828;
          font-weight: 800;
        }
      `}
    </style>
  );
}

function UpdateHeadcountsPanel() {
  const { user } = useUser();
  const canEditRequiredHeadcount = canEditRequiredHeadcountByRole(user);

  const [weeks, setWeeks] = useState([]);
  const [activeWeekId, setActiveWeekId] = useState("");
  const [weeksLoading, setWeeksLoading] = useState(false);

  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);

  const [selectedCluster, setSelectedCluster] = useState("All");
  const [selectedAccount, setSelectedAccount] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [savingRequiredId, setSavingRequiredId] = useState("");
  const [requiredDrafts, setRequiredDrafts] = useState({});

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const activeWeek =
    weeks.find((week) => String(week.id) === String(activeWeekId)) || weeks[0];

  const activeWeekStartDate =
    activeWeek?.startDate ||
    activeWeek?.weekStart ||
    activeWeek?.week_start ||
    "";

  const activeWeekEndDate =
    activeWeek?.endDate || activeWeek?.weekEnd || activeWeek?.week_end || "";

  const activeWeekPercent = getRecruitmentWeekPercent(activeWeek);

  const weekOptions = useMemo(() => {
    return (weeks || []).map((week) => ({
      label: formatRecruitmentWeekOption(week),
      value: week.id,
      data: week,
    }));
  }, [weeks]);

  const clusterOptions = useMemo(() => {
    return RECRUITMENT_HEADCOUNT_CLUSTER_OPTIONS;
  }, []);

  const normalizedAccounts = useMemo(() => {
    return (accounts || []).map((account, index) => {
      const accountName = getRecruitmentAccountName(account);
      const clusterName = getRecruitmentClusterName(account);
      const recruitmentSettingsStatus =
        getRecruitmentStatusForHeadcountTable(account);

      const baseRow = {
        ...account,

        id: String(
          account.id ||
            account.accountId ||
            account.account_id ||
            account.backendAccountId ||
            account.gy_acc_id ||
            `${clusterName}-${accountName}-${index}`,
        ),

        weekNumber: activeWeek?.weekNumber || activeWeek?.week_number || "",
        week_number: activeWeek?.weekNumber || activeWeek?.week_number || "",

        weekLabel:
          activeWeek?.label ||
          activeWeek?.weekLabel ||
          activeWeek?.week_label ||
          "",
        week_label:
          activeWeek?.label ||
          activeWeek?.weekLabel ||
          activeWeek?.week_label ||
          "",

        weekStart: activeWeekStartDate,
        week_start: activeWeekStartDate,

        weekEnd: activeWeekEndDate,
        week_end: activeWeekEndDate,

        account: accountName,
        accountName,
        account_name: accountName,

        cluster: clusterName,
        clusterName,
        cluster_name: clusterName,

        hiringRate: activeWeekPercent,
        hiring_rate: activeWeekPercent,
        hiringPlanPercent: activeWeekPercent,
        hiring_plan_percent: activeWeekPercent,

        recruitmentSettingsStatus,
        recruitment_settings_status: recruitmentSettingsStatus,

        statusNote:
          account.statusNote ||
          account.status_note ||
          account.headcountRemarks ||
          account.headcount_remarks ||
          account.remarks ||
          account.departmentName ||
          account.department_name ||
          "-",
      };

      const metrics = getRecruitmentHeadcountMetrics(baseRow);

      return {
        ...baseRow,

        requiredHeadcount: metrics.requiredHeadcount,
        required_headcount: metrics.requiredHeadcount,

        actualHeadcount: metrics.actualHeadcount,
        actual_headcount: metrics.actualHeadcount,

        requiredBufferHeadcount: metrics.requiredBufferHeadcount,
        required_buffer_headcount: metrics.requiredBufferHeadcount,

        requiredBufferPercent: metrics.requiredBufferPercent,
        required_buffer_percent: metrics.requiredBufferPercent,

        actualBufferCount: metrics.actualBufferCount,
        actual_buffer_count: metrics.actualBufferCount,

        actualBufferPercent: metrics.actualBufferPercent,
        actual_buffer_percent: metrics.actualBufferPercent,

        requiredActualHeadcountWithBuffer:
          metrics.requiredActualHeadcountWithBuffer,
        required_actual_headcount_with_buffer:
          metrics.requiredActualHeadcountWithBuffer,

        absenteeismPastSixWeeksAverage: metrics.absenteeismPastSixWeeksAverage,
        absenteeism_past_six_weeks_average:
          metrics.absenteeismPastSixWeeksAverage,

        attritionPastSixWeeksAverage: metrics.attritionPastSixWeeksAverage,
        attrition_past_six_weeks_average: metrics.attritionPastSixWeeksAverage,

        opsPrf: metrics.opsPrf,
        ops_prf: metrics.opsPrf,

        actualHeadcountNeeds: metrics.actualHeadcountNeeds,
        actual_headcount_needs: metrics.actualHeadcountNeeds,

        leadsToInterview: metrics.leadsToInterview,
        leads_to_interview: metrics.leadsToInterview,
      };
    });
  }, [
    accounts,
    activeWeek,
    activeWeekPercent,
    activeWeekStartDate,
    activeWeekEndDate,
  ]);

  const accountOptions = useMemo(() => {
    const accountMap = new Map();

    normalizedAccounts.forEach((item) => {
      const accountName = String(item.accountName || item.account || "").trim();

      if (!accountName) return;

      const key = accountName.toLowerCase();

      if (!accountMap.has(key)) {
        accountMap.set(key, {
          label: accountName,
          value: accountName,
        });
      }
    });

    return [
      { label: "All Accounts", value: "All" },
      ...Array.from(accountMap.values()).sort((a, b) =>
        a.label.localeCompare(b.label),
      ),
    ];
  }, [normalizedAccounts]);

  const statusOptions = useMemo(() => {
    const statuses = new Set();

    normalizedAccounts.forEach((item) => {
      const value = String(
        item.recruitmentSettingsStatus ||
          item.recruitment_settings_status ||
          "",
      ).trim();

      if (value) statuses.add(value);
    });

    return [
      { label: "All Status", value: "All" },
      ...Array.from(statuses)
        .sort()
        .map((value) => ({
          label: value,
          value,
        })),
    ];
  }, [normalizedAccounts]);

  const filteredAccounts = useMemo(() => {
    const keyword = String(search || "")
      .trim()
      .toLowerCase();

    return normalizedAccounts.filter((item) => {
      const recruitmentSettingsStatus = String(
        item.recruitmentSettingsStatus ||
          item.recruitment_settings_status ||
          "",
      ).trim();

      const accountName = String(item.accountName || item.account || "").trim();

      const matchesAccount =
        selectedAccount === "All" ||
        accountName.toLowerCase() === selectedAccount.toLowerCase();

      const matchesStatus =
        statusFilter === "All" ||
        recruitmentSettingsStatus.toLowerCase() === statusFilter.toLowerCase();

      const metrics = getRecruitmentHeadcountMetrics(item);

      const searchableText = [
        item.id,
        item.account,
        item.accountName,
        item.cluster,
        item.clusterName,
        item.statusNote,
        item.recruitmentSettingsStatus,
        item.recruitment_settings_status,
        metrics.requiredHeadcount,
        metrics.actualHeadcount,
        metrics.requiredBufferHeadcount,
        metrics.requiredBufferPercent,
        metrics.actualBufferCount,
        metrics.actualBufferPercent,
        metrics.requiredActualHeadcountWithBuffer,
        metrics.absenteeismPastSixWeeksAverage,
        metrics.attritionPastSixWeeksAverage,
        metrics.opsPrf,
        metrics.actualHeadcountNeeds,
        metrics.leadsToInterview,
        metrics.hiringRate,
      ]
        .filter((value) => value !== undefined && value !== null)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);

      return matchesAccount && matchesStatus && matchesSearch;
    });
  }, [normalizedAccounts, search, selectedAccount, statusFilter]);

  const totalRecords = filteredAccounts.length;
  const totalPages = Math.max(
    Math.ceil(totalRecords / RECRUITMENT_HEADCOUNT_PAGE_LIMIT),
    1,
  );

  const paginatedAccounts = useMemo(() => {
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const startIndex = (safePage - 1) * RECRUITMENT_HEADCOUNT_PAGE_LIMIT;

    return filteredAccounts.slice(
      startIndex,
      startIndex + RECRUITMENT_HEADCOUNT_PAGE_LIMIT,
    );
  }, [filteredAccounts, currentPage, totalPages]);

  const showingFrom =
    totalRecords > 0
      ? (currentPage - 1) * RECRUITMENT_HEADCOUNT_PAGE_LIMIT + 1
      : 0;

  const showingTo = Math.min(
    currentPage * RECRUITMENT_HEADCOUNT_PAGE_LIMIT,
    totalRecords,
  );

  function openStatusModal({ type = "success", title = "", message = "" }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
  }

  function closeStatusModal() {
    setStatusModal((previous) => ({
      ...previous,
      open: false,
    }));
  }

  async function fetchWeeks() {
    try {
      setWeeksLoading(true);

      const res = await api.get("/api/weekly-hiring-plan/weeks", {
        withCredentials: true,
      });

      const weekRows = Array.isArray(res.data?.data) ? res.data.data : [];

      const formattedWeeks = weekRows.map((week, index) => {
        const startDate = week.startDate || week.weekStart || "";
        const endDate = week.endDate || week.weekEnd || "";
        const weekKey = `${startDate}__${endDate}`;

        return {
          ...week,
          id: weekKey || week.id || `week-${index}`,
          startDate,
          endDate,
          weekStart: startDate,
          weekEnd: endDate,
        };
      });

      setWeeks(formattedWeeks);
      setActiveWeekId((previous) => previous || formattedWeeks[0]?.id || "");
    } catch (error) {
      console.error("FETCH RECRUITMENT HEADCOUNT WEEKS ERROR:", error);

      setWeeks([]);

      openStatusModal({
        type: "error",
        title: "Load Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to load weekly versions.",
      });
    } finally {
      setWeeksLoading(false);
    }
  }

  async function fetchAccounts() {
    if (!activeWeekStartDate || !activeWeekEndDate) {
      setAccounts([]);
      return;
    }

    try {
      setAccountsLoading(true);

      const res = await api.get("/api/weekly-hiring-plan/accounts", {
        params: {
          cluster: selectedCluster,
          startDate: activeWeekStartDate,
          endDate: activeWeekEndDate,
          _t: Date.now(),
        },
        withCredentials: true,
      });

      const accountRows = Array.isArray(res.data?.data) ? res.data.data : [];

      setAccounts(accountRows);

      setRequiredDrafts((previous) => {
        const next = { ...previous };

        accountRows.forEach((account, index) => {
          const accountName = getRecruitmentAccountName(account);
          const clusterName = getRecruitmentClusterName(account);

          const id = String(
            account.id ||
              account.accountId ||
              account.account_id ||
              account.backendAccountId ||
              account.gy_acc_id ||
              `${clusterName}-${accountName}-${index}`,
          );

          next[id] = String(
            getHeadcountNumberValue(
              account.requiredHeadcount,
              account.required_headcount,
              account.kronosRequiredHeadcount,
              account.kronos_required_headcount,
            ),
          );
        });

        return next;
      });
    } catch (error) {
      console.error("FETCH RECRUITMENT HEADCOUNT ACCOUNTS ERROR:", error);

      setAccounts([]);

      openStatusModal({
        type: "error",
        title: "Load Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to load headcount accounts.",
      });
    } finally {
      setAccountsLoading(false);
    }
  }

  useEffect(() => {
    fetchWeeks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAccounts();
    setSelectedAccount("All");
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWeekId, selectedCluster]);

  useEffect(() => {
    const accountStillExists = accountOptions.some(
      (option) => String(option.value) === String(selectedAccount),
    );

    if (!accountStillExists) {
      setSelectedAccount("All");
    }
  }, [accountOptions, selectedAccount]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedAccount, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function handleClearFilters() {
    setSearch("");
    setSelectedCluster("All");
    setSelectedAccount("All");
    setStatusFilter("All");
    setCurrentPage(1);
  }

  function handlePageChange(nextPage) {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);

    setCurrentPage(safePage);
  }

  function handleRequiredDraftChange(id, value) {
    setRequiredDrafts((previous) => ({
      ...previous,
      [id]: value,
    }));
  }

  async function handleSaveRequiredHeadcount(item) {
    if (!canEditRequiredHeadcount) {
      openStatusModal({
        type: "error",
        title: "Permission Denied",
        message: "Only HR or HR Admin can update required headcount here.",
      });
      return;
    }

    if (!item?.id || savingRequiredId) return;

    const rawValue =
      requiredDrafts[item.id] !== undefined
        ? requiredDrafts[item.id]
        : item.requiredHeadcount;

    const requiredHeadcount = Number(rawValue);

    if (!Number.isFinite(requiredHeadcount) || requiredHeadcount < 0) {
      openStatusModal({
        type: "error",
        title: "Invalid Required HC",
        message: "Please enter a valid required headcount.",
      });
      return;
    }

    try {
      setSavingRequiredId(item.id);

      await saveRequiredHeadcountOverride(item, requiredHeadcount);

      setRequiredDrafts((previous) => ({
        ...previous,
        [item.id]: String(requiredHeadcount),
      }));

      setAccounts((previousAccounts) =>
        previousAccounts.map((account, index) => {
          const accountName = getRecruitmentAccountName(account);
          const clusterName = getRecruitmentClusterName(account);

          const accountId = String(
            account.id ||
              account.accountId ||
              account.account_id ||
              account.backendAccountId ||
              account.gy_acc_id ||
              `${clusterName}-${accountName}-${index}`,
          );

          const sameRow =
            String(accountId) === String(item.id) ||
            (accountName.toLowerCase() ===
              String(item.accountName || item.account || "").toLowerCase() &&
              clusterName.toLowerCase() ===
                String(item.clusterName || item.cluster || "").toLowerCase());

          if (!sameRow) return account;

          return {
            ...account,
            requiredHeadcount,
            required_headcount: requiredHeadcount,
            kronosRequiredHeadcount: requiredHeadcount,
            kronos_required_headcount: requiredHeadcount,
            recruitmentSettingsStatus: "Approved",
            recruitment_settings_status: "Approved",
            status: "Approved",
          };
        }),
      );

      openStatusModal({
        type: "success",
        title: "Headcount Updated",
        message: "Required headcount was updated successfully.",
      });
    } catch (error) {
      console.error("SAVE RECRUITMENT REQUIRED HEADCOUNT ERROR:", error);

      openStatusModal({
        type: "error",
        title: "Save Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to save required headcount.",
      });
    } finally {
      setSavingRequiredId("");
    }
  }

  return (
    <div className="bg-[#F5F7FA] p-4">
      <section
        className="relative z-[80] sibs-profile-tab-panel overflow-visible rounded-2xl border border-[#D9E2EC] bg-white shadow-sm"
        style={{ animationDelay: "300ms" }}
      >
        <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <ListChecks size={14} />
                Account Headcount
              </div>

              <h2 className="mt-3 text-lg font-bold text-sibs-primary-1">
                Update Headcounts
              </h2>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Review and update account-level required headcount.
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
              {totalRecords} Records
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 2xl:grid-cols-[1fr_280px_210px_260px_210px_auto] 2xl:items-end">
            <div>
              <label className="mb-1 block text-sm font-bold text-[#101828]">
                Search
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search account, cluster, status..."
                  className={inputClass("pl-11 pr-4")}
                />
              </div>
            </div>

            <CustomSelect
              label="Weekly Version"
              value={activeWeekId}
              options={weekOptions}
              placeholder="Select weekly version"
              loading={weeksLoading}
              disabled={accountsLoading}
              onChange={(nextWeekId) => {
                setActiveWeekId(nextWeekId);
                setCurrentPage(1);
              }}
              zIndex="z-60"
            />

            <CustomSelect
              label="Cluster"
              value={selectedCluster}
              options={clusterOptions}
              placeholder="All Clusters"
              disabled={accountsLoading}
              onChange={(nextCluster) => {
                setSelectedCluster(nextCluster);
                setSelectedAccount("All");
                setCurrentPage(1);
              }}
              zIndex="z-50"
            />

            <CustomSelect
              label="Account"
              value={selectedAccount}
              options={accountOptions}
              placeholder="All Accounts"
              loading={accountsLoading}
              disabled={weeksLoading}
              onChange={(nextAccount) => {
                setSelectedAccount(nextAccount);
                setCurrentPage(1);
              }}
              zIndex="z-40"
            />

            <CustomSelect
              label="Recruitment Settings Status"
              value={statusFilter}
              options={statusOptions}
              placeholder="All Status"
              disabled={accountsLoading}
              onChange={(nextStatus) => {
                setStatusFilter(nextStatus);
                setCurrentPage(1);
              }}
              zIndex="z-30"
            />

            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
            >
              <Filter size={17} />
              Clear
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="space-y-3 lg:hidden">
            {accountsLoading || weeksLoading ? (
              <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                Loading recruitment headcount records...
              </div>
            ) : paginatedAccounts.length > 0 ? (
              paginatedAccounts.map((item, index) => {
                const metrics = getRecruitmentHeadcountMetrics(item);
                const requiredInputValue =
                  requiredDrafts[item.id] !== undefined
                    ? requiredDrafts[item.id]
                    : String(metrics.requiredHeadcount);

                const isSaving = savingRequiredId === item.id;

                return (
                  <div
                    key={item.id || index}
                    className="sibs-page-card-in w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] hover:shadow-md"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-sibs-primary-1">
                          {item.cluster || "—"}
                        </p>

                        <h3 className="mt-1 text-sm font-bold text-[#101828]">
                          {item.account || "—"}
                        </h3>

                        <p className="mt-1 break-words text-xs font-semibold text-sibs-tertiary-5">
                          HC Needs:{" "}
                          {formatHeadcountNumber(
                            metrics.actualHeadcountNeeds,
                            2,
                          )}{" "}
                          / Leads:{" "}
                          {formatHeadcountNumber(metrics.leadsToInterview)}
                        </p>
                      </div>

                      <StatusPill
                        status={
                          item.recruitmentSettingsStatus ||
                          item.recruitment_settings_status ||
                          "Kronos"
                        }
                        fallback="Kronos"
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <RecruitmentHeadcountMobileMetric
                        label="Required HC"
                        value={
                          canEditRequiredHeadcount ? (
                            <input
                              type="number"
                              min="0"
                              value={requiredInputValue}
                              onChange={(e) =>
                                handleRequiredDraftChange(
                                  item.id,
                                  e.target.value,
                                )
                              }
                              className="h-10 w-full rounded-[10px] border border-[#D0D5DD] bg-white px-3 text-sm font-extrabold text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                            />
                          ) : (
                            formatHeadcountNumber(metrics.requiredHeadcount)
                          )
                        }
                      />

                      <RecruitmentHeadcountMobileMetric
                        label="Actual HC"
                        value={formatHeadcountNumber(metrics.actualHeadcount)}
                        valueClassName="text-[#344054]"
                      />

                      <RecruitmentHeadcountMobileMetric
                        label="Required Buffer"
                        value={formatHeadcountNumber(
                          metrics.requiredBufferHeadcount,
                          2,
                        )}
                      />

                      <RecruitmentHeadcountMobileMetric
                        label="Buffer %"
                        value={formatHeadcountPercent(
                          metrics.requiredBufferPercent,
                        )}
                        valueClassName="text-[#344054]"
                      />

                      <RecruitmentHeadcountMobileMetric
                        label="Actual Buffer"
                        value={formatHeadcountNumber(metrics.actualBufferCount)}
                        valueClassName={getActualBufferClass(
                          metrics.actualBufferCount,
                        )}
                      />

                      <RecruitmentHeadcountMobileMetric
                        label="Actual Buffer %"
                        value={formatHeadcountPercent(
                          metrics.actualBufferPercent,
                        )}
                        valueClassName={getActualBufferClass(
                          metrics.actualBufferPercent,
                        )}
                      />

                      <RecruitmentHeadcountMobileMetric
                        label="OPS PRF"
                        value={formatHeadcountNumber(metrics.opsPrf)}
                      />

                      <RecruitmentHeadcountMobileMetric
                        label="Hiring Rate"
                        value={formatHeadcountPercent(metrics.hiringRate)}
                        valueClassName="text-[#344054]"
                      />
                    </div>

                    <div className="mt-3 rounded-xl bg-[#F8FAFC] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                        Status Note
                      </p>

                      <p className="mt-1 line-clamp-3 text-sm font-bold text-[#344054]">
                        {item.statusNote || "—"}
                      </p>
                    </div>

                    {canEditRequiredHeadcount && (
                      <button
                        type="button"
                        onClick={() => handleSaveRequiredHeadcount(item)}
                        disabled={isSaving || accountsLoading}
                        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-100 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Save size={16} />
                        )}
                        Save Required Headcount
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                No recruitment headcount records found.
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <div className="overflow-x-auto p-0 sibs-scrollbar">
              <table className="w-full min-w-[1400px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
                <thead>
                  <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                    <th className="px-5 py-4 first:rounded-tl-2xl">Account</th>
                    <th className="px-5 py-4">Required / Actual HC</th>
                    <th className="px-5 py-4">Buffer</th>
                    <th className="px-5 py-4">Averages</th>
                    <th className="px-5 py-4">OPS PRF</th>
                    <th className="px-5 py-4">HC Needs / Leads</th>
                    <th className="px-5 py-4">Hiring Rate</th>
                    <th className="px-5 py-4">Recruitment Settings Status</th>
                    <th className="px-5 py-4">Status Note</th>
                    <th className="px-5 py-4 text-right last:rounded-tr-2xl">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {accountsLoading || weeksLoading ? (
                    Array.from({
                      length: RECRUITMENT_HEADCOUNT_PAGE_LIMIT,
                    }).map((_, index) => (
                      <tr key={index}>
                        <td
                          colSpan={10}
                          className="border-b border-[#E6ECF2] px-5 py-5"
                        >
                          <div className="h-5 w-full animate-sibs-pulse rounded bg-gray-200" />
                        </td>
                      </tr>
                    ))
                  ) : paginatedAccounts.length > 0 ? (
                    paginatedAccounts.map((item, index) => {
                      const metrics = getRecruitmentHeadcountMetrics(item);
                      const requiredInputValue =
                        requiredDrafts[item.id] !== undefined
                          ? requiredDrafts[item.id]
                          : String(metrics.requiredHeadcount);

                      const isSaving = savingRequiredId === item.id;

                      return (
                        <tr
                          key={item.id || index}
                          className="transition-all duration-200 hover:bg-[#FAFBFC]"
                        >
                          <td className="border-b border-[#E6ECF2] px-5 py-5">
                            <p className="max-w-[260px] truncate text-sm font-bold text-[#101828]">
                              {item.account || "—"}
                            </p>

                            <p className="mt-1 max-w-[260px] truncate text-xs font-semibold text-sibs-tertiary-5">
                              {item.cluster || "—"}
                            </p>
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5">
                            {canEditRequiredHeadcount ? (
                              <div>
                                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                                  Required
                                </p>

                                <input
                                  type="number"
                                  min="0"
                                  value={requiredInputValue}
                                  onChange={(e) =>
                                    handleRequiredDraftChange(
                                      item.id,
                                      e.target.value,
                                    )
                                  }
                                  className="h-10 w-28 rounded-xl border border-[#D0D5DD] bg-white px-3 text-center text-sm font-extrabold text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                                />
                              </div>
                            ) : (
                              <p className="text-sm font-bold text-[#344054]">
                                Required:{" "}
                                <span className="text-sibs-primary-1">
                                  {formatHeadcountNumber(
                                    metrics.requiredHeadcount,
                                  )}
                                </span>
                              </p>
                            )}

                            <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
                              Actual:{" "}
                              {formatHeadcountNumber(metrics.actualHeadcount)}
                            </p>
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5">
                            <p className="text-sm font-bold text-sibs-primary-1">
                              Req. Buffer:{" "}
                              {formatHeadcountNumber(
                                metrics.requiredBufferHeadcount,
                                2,
                              )}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-[#344054]">
                              Req. Buffer %:{" "}
                              {formatHeadcountPercent(
                                metrics.requiredBufferPercent,
                              )}
                            </p>

                            <p
                              className={`mt-1 text-xs font-bold ${getActualBufferClass(
                                metrics.actualBufferCount,
                              )}`}
                            >
                              Actual Buffer:{" "}
                              {formatHeadcountNumber(metrics.actualBufferCount)}{" "}
                              /{" "}
                              {formatHeadcountPercent(
                                metrics.actualBufferPercent,
                              )}
                            </p>
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5">
                            <p className="text-sm font-bold text-[#344054]">
                              Absenteeism:{" "}
                              {formatHeadcountNumber(
                                metrics.absenteeismPastSixWeeksAverage,
                              )}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                              Attrition:{" "}
                              {formatHeadcountNumber(
                                metrics.attritionPastSixWeeksAverage,
                              )}
                            </p>
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-bold text-sibs-primary-1">
                            {formatHeadcountNumber(metrics.opsPrf)}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5">
                            <p className="text-sm font-bold text-violet-700">
                              Needs:{" "}
                              {formatHeadcountNumber(
                                metrics.actualHeadcountNeeds,
                                2,
                              )}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-[#344054]">
                              Leads:{" "}
                              {formatHeadcountNumber(metrics.leadsToInterview)}
                            </p>
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                            {formatHeadcountPercent(metrics.hiringRate)}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5">
                            <StatusPill
                              status={
                                item.recruitmentSettingsStatus ||
                                item.recruitment_settings_status ||
                                "Kronos"
                              }
                              fallback="Kronos"
                            />
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5">
                            <p className="line-clamp-2 max-w-[260px] text-sm font-semibold leading-5 text-[#344054]">
                              {item.statusNote || "—"}
                            </p>
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-right">
                            {canEditRequiredHeadcount ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSaveRequiredHeadcount(item)
                                }
                                disabled={isSaving || accountsLoading}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 text-xs font-bold text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-100 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isSaving ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : (
                                  <Save size={15} />
                                )}
                                Save
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-sibs-tertiary-5">
                                View only
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                      >
                        No recruitment headcount records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <p className="text-sm font-semibold text-sibs-tertiary-5">
              Showing {showingFrom} to {showingTo} of {totalRecords} headcount
              records
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || accountsLoading || weeksLoading}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1;
                const active = currentPage === pageNumber;

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => handlePageChange(pageNumber)}
                    disabled={accountsLoading || weeksLoading}
                    className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
                      active
                        ? "bg-sibs-primary-1 text-white shadow-sm"
                        : "border border-[#E6ECF2] bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={
                  currentPage >= totalPages || accountsLoading || weeksLoading
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={closeStatusModal}
      />
    </div>
  );
}

export default function RecruitmentSettingsPage() {
  const mainRef = useRef(null);

  const {
    activeTab,
    setActiveTab,
    recruitmentTabs,
    saveStatus,
    handleResetFields,
    handleSaveSettings,
  } = useRecruitmentSettings();

  const [pageStatusModal, setPageStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const settingsTabs = useMemo(() => {
    const tabs = Array.isArray(recruitmentTabs) ? recruitmentTabs : [];

    return [
      "Update Headcounts",
      ...tabs.filter(
        (tab) => tab !== "Update Headcounts" && tab !== "Headcount Requests",
      ),
    ];
  }, [recruitmentTabs]);

  function openPageStatusModal({ type = "success", title = "", message = "" }) {
    setPageStatusModal({
      open: true,
      type,
      title,
      message,
    });
  }

  function closePageStatusModal() {
    setPageStatusModal((previous) => ({
      ...previous,
      open: false,
    }));
  }

  async function handlePageResetFields() {
    try {
      const result = handleResetFields?.();

      if (result && typeof result.then === "function") {
        await result;
      }

      openPageStatusModal({
        type: "success",
        title: "Settings Reset",
        message: "Recruitment settings fields were reset successfully.",
      });
    } catch (error) {
      console.error("RESET RECRUITMENT SETTINGS ERROR:", error);

      openPageStatusModal({
        type: "error",
        title: "Reset Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to reset recruitment settings.",
      });
    }
  }

  async function handlePageSaveSettings() {
    try {
      const result = handleSaveSettings?.();

      if (result && typeof result.then === "function") {
        await result;
      }

      openPageStatusModal({
        type: "success",
        title: "Settings Saved",
        message: "Recruitment settings were saved successfully.",
      });
    } catch (error) {
      console.error("SAVE RECRUITMENT SETTINGS ERROR:", error);

      openPageStatusModal({
        type: "error",
        title: "Save Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to save recruitment settings.",
      });
    }
  }

  function handlePreviewForm() {
    openPageStatusModal({
      type: "error",
      title: "Preview Not Available",
      message:
        "Preview Form is not configured yet. Please finish the form setup first.",
    });
  }

  function scrollToTop(behavior = "auto") {
    requestAnimationFrame(() => {
      if (mainRef.current) {
        mainRef.current.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
      }
    });
  }

  function forceScrollToTop() {
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
  }

  useLayoutEffect(() => {
    if (
      typeof window !== "undefined" &&
      "scrollRestoration" in window.history
    ) {
      window.history.scrollRestoration = "manual";
    }

    forceScrollToTop();
  }, []);

  useEffect(() => {
    setActiveTab("Update Headcounts");
  }, [setActiveTab]);

  return (
    <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main
        ref={mainRef}
        data-recruitment-settings-main="true"
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6"
      >
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="sibs-page-header-in flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                <Settings size={14} />
                Recruitment Setup
              </div>

              <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
                Recruitment Settings
              </h1>

              <p className="mt-1 max-w-5xl text-sm font-medium leading-6 text-sibs-tertiary-5">
                Configure recruitment forms, final interview scoring, pipeline
                stages, email templates, approvals, headcount updates, and
                candidate workflow rules.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handlePageResetFields}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.98]"
              >
                <RotateCcw size={18} />
                Reset
              </button>

              <button
                type="button"
                onClick={handlePreviewForm}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.98]"
              >
                <Eye size={18} />
                Preview Form
              </button>

              <button
                type="button"
                onClick={handlePageSaveSettings}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95 active:scale-[0.98]"
              >
                <Save size={18} />
                {saveStatus === "Saved" ? "Saved" : "Save Settings"}
              </button>
            </div>
          </div>

          <section
            className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
            style={{ animationDelay: "60ms" }}
          >
            <SettingsInfoCards />
          </section>

          <section
            className="sibs-profile-tab-panel overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm"
            style={{ animationDelay: "120ms" }}
          >
            <div className="border-b border-[#E6ECF2] bg-white px-4 sm:px-5">
              <div className="flex min-w-0 gap-8 overflow-x-auto">
                {settingsTabs.map((tab) => {
                  const isActive = activeTab === tab;
                  const TabIcon = tabIconMap[tab] || Settings;

                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab);
                      }}
                      className={`relative inline-flex h-12 shrink-0 items-center justify-center gap-2 border-b-2 px-1 text-sm font-extrabold transition ${
                        isActive
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-[#344054] hover:border-[#D0D5DD] hover:text-sibs-primary-1"
                      }`}
                    >
                      <TabIcon
                        size={16}
                        strokeWidth={2.4}
                        className={
                          isActive ? "text-blue-600" : "text-sibs-tertiary-5"
                        }
                      />

                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeTab === "Update Headcounts" ? (
              <UpdateHeadcountsPanel />
            ) : activeTab === "Final Interview Form" ? (
              <div
                data-final-interview-panel="true"
                className="space-y-5 bg-[#F5F7FA] p-4"
              >
                <FinalInterviewDropdownDesignFix />

                <FormBuilderCard />

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <FormLaunchRulesCard />
                  <RelatedRecruitmentSettingsCard />
                </div>
              </div>
            ) : activeTab === "Approval Rules" ? (
              <div className="space-y-5 bg-[#F5F7FA] p-4">
                <ApprovalRulesSettings />
              </div>
            ) : (
              <PlaceholderSettingsPanel activeTab={activeTab} />
            )}
          </section>
        </div>
      </main>

      <StatusModal
        open={pageStatusModal.open}
        type={pageStatusModal.type}
        title={pageStatusModal.title}
        message={pageStatusModal.message}
        variant="center"
        onClose={closePageStatusModal}
        lockScroll
      />
    </div>
  );
}
