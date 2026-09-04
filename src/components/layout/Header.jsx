import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CalendarDays,
  CircleUser,
  ClipboardCheck,
  ClipboardList,
  Clock,
  DollarSign,
  FileClock,
  FileCog,
  FileText,
  Gift,
  LayoutDashboard,
  Loader2,
  Mail,
  MapPin,
  PieChart,
  Search,
  Table2,
  UserCog,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useUser } from "../../services/context/UserContext";
import { getEmployee } from "../../lib/axios/getEmployee";
import { getMyEmployeeProfilePicture } from "../../lib/axios/employeeProfile";
import UserDropdown from "./dropdown/UserDropdown";
import NotificationDropdown from "./dropdown/NotificationDropdown";
import HeaderCalendarModal from "./HeaderCalendarModal";
import AuditNotificationBell from "./AuditNotificationBell";

const ADMIN_ROLES = [
  "admin",
  "ta",
  "hr",
  "hr_admin",
  "hradmin",
  "finance",
  "manager",
  "som",
  "executive",
  "super_admin",
  "superadmin",
  "super_administrator",
];

const ALL_ADMIN_ACCESS = [1, 2, 3, 4, 5, 6, 7, 10];

const HEADER_PROFILE_PICTURE_UPDATED_EVENT = "sibs:profile-picture-updated";


const SEARCHABLE_MODULES = [
  {
    label: "Dashboard",
    group: "Employee Access",
    description: "Employee dashboard and personal overview",
    path: "/dashboard/employee",
    scope: "employee",
    icon: LayoutDashboard,
    keywords: ["home", "employee dashboard", "my dashboard"],
  },
  {
    label: "My Profile",
    group: "Employee Access",
    description: "Personal employee profile",
    path: "/profile/user",
    scope: "employee",
    icon: CircleUser,
    keywords: ["profile", "personal details", "employee profile"],
  },
  {
    label: "My Schedule",
    group: "Employee Access",
    description: "Employee work schedule",
    path: "/schedule",
    scope: "employee",
    icon: CalendarDays,
    keywords: ["schedule", "shift", "roster"],
  },
  {
    label: "Dashboard",
    group: "Core HR",
    description: "System-wide control and governance dashboard",
    path: "/dashboard/super-admin",
    scope: "admin",
    allowedUsers: [7],
    icon: LayoutDashboard,
    keywords: ["super admin", "system dashboard", "governance", "command center"],
  },
  {
    label: "Dashboard",
    group: "Core HR",
    description: "HRIS administrative dashboard",
    path: "/dashboard/admin",
    scope: "admin",
    allowedUsers: [2, 3, 6],
    icon: LayoutDashboard,
    keywords: ["home", "hr dashboard", "admin dashboard"],
  },
  {
    label: "Dashboard",
    group: "Core HR",
    description: "Talent acquisition dashboard",
    path: "/recruitment/ta-dashboard",
    scope: "admin",
    allowedUsers: [1, 2, 3, 7],
    icon: LayoutDashboard,
    keywords: ["talent acquisition", "recruitment dashboard", "ta"],
  },
  {
    label: "Dashboard",
    group: "Core HR",
    description: "Operations management dashboard",
    path: "/recruitment/om-dashboard",
    scope: "admin",
    allowedUsers: [1, 2, 3, 7],
    icon: LayoutDashboard,
    keywords: ["operations manager", "operations dashboard", "om"],
  },
  {
    label: "Employees",
    group: "Core HR",
    description: "Employee Directory and employee records",
    path: "/employee",
    scope: "admin",
    allowedUsers: ALL_ADMIN_ACCESS,
    icon: Users,
    keywords: [
      "employee",
      "employees",
      "employee directory",
      "staff",
      "people",
      "profile",
    ],
  },
  {
    label: "Attendance",
    group: "Core HR",
    description: "Time and attendance records",
    path: "/attendance",
    scope: "all",
    icon: Clock,
    keywords: ["attendance", "time", "time and attendance", "timelog"],
  },
  {
    label: "Leaves",
    group: "Core HR",
    description: "Leave requests and time off",
    path: "/leaves",
    scope: "all",
    icon: Calendar,
    keywords: ["leave", "leaves", "time off", "vacation", "absence"],
  },
  {
    label: "Resignation Management",
    group: "Core HR",
    description: "Employee resignation records and workflows",
    path: "/resignation",
    scope: "all",
    icon: FileText,
    keywords: ["resignation", "attrition", "offboarding", "exit"],
  },
  {
    label: "Workforce & Hiring Overview",
    group: "Recruitment",
    description: "Hiring ramps and workforce overview",
    path: "/recruitment/workforce-hiring-overview",
    scope: "admin",
    allowedUsers: [1, 2, 3, 5, 6, 7, 10],
    icon: CalendarDays,
    keywords: ["workforce", "hiring", "overview", "ramps", "recruitment"],
  },
  {
    label: "Workforce & Hiring Plan",
    group: "Recruitment",
    description: "Weekly workforce and hiring plans",
    path: "/recruitment/workforce-hiring-plan",
    scope: "admin",
    allowedUsers: [1, 2, 3, 5, 6, 7, 10],
    icon: CalendarDays,
    keywords: ["workforce", "hiring plan", "weekly hiring", "recruitment"],
  },
  {
    label: "Job Description",
    group: "Recruitment",
    description: "Job descriptions and approval records",
    path: "/recruitment/job-description",
    scope: "admin",
    allowedUsers: [1, 2, 3, 6, 7],
    icon: ClipboardList,
    keywords: ["job description", "jd", "position description", "role"],
  },
  {
    label: "Hiring Needs Intake",
    group: "Recruitment",
    description: "Requisition and downsize requests",
    path: "/recruitment/hiring-needs",
    scope: "admin",
    allowedUsers: [1, 2, 3, 5, 6, 7, 10],
    icon: FileText,
    keywords: ["hiring needs", "requisition", "downsize", "headcount"],
  },
  {
    label: "Available Positions",
    group: "Recruitment",
    description: "Approved and open positions",
    path: "/recruitment/available-positions",
    scope: "admin",
    allowedUsers: [1, 2, 3, 7],
    icon: BriefcaseBusiness,
    keywords: ["available position", "open positions", "vacancies", "jobs"],
  },
  {
    label: "Sourcing Analytics",
    group: "Recruitment",
    description: "Candidate sourcing performance",
    path: "/recruitment/sourcing-analytics",
    scope: "admin",
    allowedUsers: [1, 2, 3, 6, 7],
    icon: BarChart3,
    keywords: ["sourcing", "analytics", "channels", "candidates"],
  },
  {
    label: "Talent Pool",
    group: "Recruitment",
    description: "Candidate and talent pool records",
    path: "/recruitment/talent-pool",
    scope: "admin",
    allowedUsers: [1, 2, 3, 6, 7],
    icon: Users,
    keywords: ["talent pool", "candidates", "applicants", "people"],
  },
  {
    label: "Candidate Pipeline",
    group: "Recruitment",
    description: "Candidate stage and pipeline management",
    path: "/recruitment/candidate-pipeline",
    scope: "admin",
    allowedUsers: [1, 2, 3, 6, 7],
    icon: Table2,
    keywords: ["candidate pipeline", "pipeline", "stages", "applicants"],
  },
  {
    label: "Offers",
    group: "Recruitment",
    description: "Job offer preparation and tracking",
    path: "/recruitment/offers",
    scope: "admin",
    allowedUsers: [1, 2, 3, 6, 7],
    icon: Gift,
    keywords: ["offers", "job offers", "offer letter"],
  },
  {
    label: "Onboarding",
    group: "Recruitment",
    description: "New hire onboarding activities",
    path: "/recruitment/onboarding",
    scope: "admin",
    allowedUsers: [1, 2, 3, 6, 7],
    icon: ClipboardList,
    keywords: ["onboarding", "new hire", "requirements"],
  },
  {
    label: "Action Items",
    group: "Recruitment",
    description: "Recruitment tasks and pending actions",
    path: "/recruitment/action-items",
    scope: "admin",
    allowedUsers: [1, 2, 3, 6, 7],
    icon: Activity,
    keywords: ["action items", "tasks", "pending actions"],
  },
  {
    label: "Weekly Reports",
    group: "Recruitment",
    description: "Weekly recruitment reports",
    path: "/recruitment/weekly-reports",
    scope: "admin",
    allowedUsers: [1, 2, 3, 5, 6, 7, 10],
    icon: FileClock,
    keywords: ["weekly reports", "reports", "weekly"],
  },
  {
    label: "Candidate Experience",
    group: "Recruitment",
    description: "Candidate feedback and experience",
    path: "/recruitment/candidate-experience",
    scope: "admin",
    allowedUsers: [1, 2, 3, 6, 7],
    icon: BookOpen,
    keywords: ["candidate experience", "feedback", "experience"],
  },
  {
    label: "Approval Requests",
    group: "Communications",
    description: "Pending HRIS approval workflows",
    path: "/approval-request",
    scope: "admin",
    allowedUsers: [3, 4, 5, 6, 7, 10],
    icon: ClipboardCheck,
    keywords: ["approval", "approvals", "requests", "workflow"],
  },
  {
    label: "Email Logs",
    group: "Communications",
    description: "System email delivery logs",
    path: "/email-logs",
    scope: "admin",
    allowedUsers: ALL_ADMIN_ACCESS,
    icon: Mail,
    keywords: ["email logs", "emails", "mail", "delivery"],
  },
  {
    label: "Reports",
    group: "Analytics",
    description: "HRIS reports and exports",
    path: "/reports",
    scope: "admin",
    allowedUsers: ALL_ADMIN_ACCESS,
    icon: BarChart3,
    keywords: ["reports", "reporting", "export"],
  },
  {
    label: "Analytics",
    group: "Analytics",
    description: "HRIS metrics and analytics",
    path: "/analytics",
    scope: "admin",
    allowedUsers: ALL_ADMIN_ACCESS,
    icon: PieChart,
    keywords: ["analytics", "metrics", "dashboard", "insights"],
  },
  {
    label: "Costs",
    group: "Analytics",
    description: "Workforce cost records",
    path: "/costs",
    scope: "admin",
    allowedUsers: [4, 5, 6, 7, 10],
    icon: DollarSign,
    keywords: ["costs", "expenses", "finance"],
  },
  {
    label: "Payroll",
    group: "Analytics",
    description: "Payroll records and processing",
    path: "/payroll",
    scope: "admin",
    allowedUsers: [4, 5, 6, 7, 10],
    icon: DollarSign,
    keywords: ["payroll", "salary", "pay"],
  },
  {
    label: "Departments",
    group: "Administration",
    description: "Department configuration",
    path: "/departments",
    scope: "admin",
    allowedUsers: [5, 6, 7, 10],
    icon: Building2,
    keywords: ["departments", "department", "organization"],
  },
  {
    label: "Office Locations",
    group: "Administration",
    description: "Office site and location configuration",
    path: "/locations",
    scope: "admin",
    allowedUsers: [5, 6, 7, 10],
    icon: MapPin,
    keywords: ["office locations", "locations", "sites", "office"],
  },
  {
    label: "Recruitment Settings",
    group: "Settings",
    description: "Recruitment rules and approval settings",
    path: "/settings/recruitment-settings",
    scope: "admin",
    allowedUsers: [1, 2, 3, 6, 7],
    icon: FileCog,
    keywords: ["recruitment settings", "settings", "approval settings"],
  },
  {
    label: "Account Settings",
    group: "Settings",
    description: "User access and account configuration",
    path: "/settings/account-settings",
    scope: "admin",
    allowedUsers: [7],
    icon: UserCog,
    keywords: ["account settings", "user access", "permissions", "settings"],
  },
];

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeRole(value) {
  return normalizeText(value).replace(/[\s-]+/g, "_");
}

function getUserAccess(user) {
  return Number(
    user?.admin_access ??
      user?.adminAccess ??
      user?.access ??
      user?.gy_user_access ??
      user?.gyUserAccess ??
      0,
  );
}

function isAdminUser(user) {
  return ADMIN_ROLES.includes(normalizeRole(user?.role));
}

function canAccessModule(moduleItem, user) {
  const role = normalizeRole(user?.role);
  const adminUser = isAdminUser(user);

  if (moduleItem.scope === "employee" && role !== "employee") return false;
  if (moduleItem.scope === "admin" && !adminUser) return false;

  if (
    Array.isArray(moduleItem.allowedUsers) &&
    !moduleItem.allowedUsers.includes(getUserAccess(user))
  ) {
    return false;
  }

  return true;
}

function canSearchEmployeeDirectory(user) {
  const role = normalizeRole(user?.role);
  return role !== "employee" && (isAdminUser(user) || getUserAccess(user) > 0);
}

function firstValue(...values) {
  return values.find((value) => String(value ?? "").trim()) || "";
}

function getEmployeeSibsId(employee) {
  return String(
    firstValue(
      employee?.sibsId,
      employee?.sibs_id,
      employee?.employeeSibsId,
      employee?.employee_sibs_id,
      employee?.gy_emp_code,
      employee?.gy_user_code,
      employee?.userCode,
      employee?.user_code,
      employee?.username,
    ),
  ).trim();
}

function formatEmployeeName(employee) {
  const lastName = String(
    firstValue(employee?.lastName, employee?.last_name, employee?.gy_emp_lname),
  ).trim();
  const firstName = String(
    firstValue(
      employee?.firstName,
      employee?.first_name,
      employee?.gy_emp_fname,
    ),
  ).trim();
  const middleName = String(
    firstValue(
      employee?.middleName,
      employee?.middle_name,
      employee?.gy_emp_mname,
    ),
  ).trim();

  if (lastName || firstName || middleName) {
    return `${lastName}${lastName && firstName ? ", " : ""}${firstName}${
      middleName ? ` ${middleName}` : ""
    }`
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }

  return String(
    firstValue(
      employee?.fullName,
      employee?.full_name,
      employee?.gy_emp_fullname,
      employee?.name,
      "Employee",
    ),
  )
    .trim()
    .toUpperCase();
}

function getEmployeeInitials(employee) {
  const name = formatEmployeeName(employee).replace(",", " ");

  return (
    name
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("") || "E"
  );
}

function getEmployeeDetails(employee) {
  const position = firstValue(
    employee?.position,
    employee?.jobTitle,
    employee?.job_title,
    employee?.roleTitle,
  );
  const department = firstValue(
    employee?.department,
    employee?.departmentName,
    employee?.department_name,
  );
  const account = firstValue(
    employee?.account,
    employee?.accountName,
    employee?.account_name,
  );

  return [position, department, account]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" • ");
}

function normalizeEmployeeResults(result, searchKeyword = "") {
  const rows = Array.isArray(result?.data)
    ? result.data
    : Array.isArray(result?.data?.data)
      ? result.data.data
      : Array.isArray(result?.data?.employees)
        ? result.data.employees
        : Array.isArray(result?.employees)
          ? result.employees
          : Array.isArray(result?.rows)
            ? result.rows
            : [];

  const cleanKeyword = String(searchKeyword ?? "").trim().toLowerCase();

  const mapped = rows
    .map((employee) => ({
      type: "employee",
      employee,
      sibsId: getEmployeeSibsId(employee),
      label: formatEmployeeName(employee),
      initials: getEmployeeInitials(employee),
      details: getEmployeeDetails(employee),
      breadcrumb: "Employees › Employee Data",
    }))
    .filter((item) => item.sibsId);

  if (!cleanKeyword) return mapped.slice(0, 6);

  return mapped
    .sort((a, b) => {
      const nameA = a.label.toLowerCase();
      const nameB = b.label.toLowerCase();
      const idA = a.sibsId.toLowerCase();
      const idB = b.sibsId.toLowerCase();

      const directA = nameA.includes(cleanKeyword) || idA.includes(cleanKeyword);
      const directB = nameB.includes(cleanKeyword) || idB.includes(cleanKeyword);

      if (directA && !directB) return -1;
      if (!directA && directB) return 1;
      return 0;
    })
    .slice(0, 6);
}

function scoreModule(moduleItem, query) {
  const label = normalizeText(moduleItem.label);
  const group = normalizeText(moduleItem.group);
  const description = normalizeText(moduleItem.description);
  const keywords = (moduleItem.keywords || []).map(normalizeText);

  if (label === query) return 0;
  if (label.startsWith(query)) return 1;
  if (keywords.some((keyword) => keyword === query)) return 2;
  if (keywords.some((keyword) => keyword.startsWith(query))) return 3;
  if (label.includes(query)) return 4;
  if (keywords.some((keyword) => keyword.includes(query))) return 5;
  if (group.includes(query)) return 6;
  if (description.includes(query)) return 7;

  return Number.POSITIVE_INFINITY;
}

function HighlightMatch({ text, query }) {
  const safeText = String(text ?? "");
  const cleanQuery = String(query ?? "").trim();

  if (!cleanQuery || !safeText) {
    return <span>{safeText}</span>;
  }

  const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = safeText.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span
            key={i}
            className="font-black text-sibs-orange underline decoration-sibs-orange/40"
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

function SearchResultButton({
  item,
  index,
  active,
  query,
  onHover,
  onSelect,
}) {
  const Icon = item.icon || UserRound;

  if (item.type === "employee") {
    return (
      <button
        id={`header-search-result-${index}`}
        type="button"
        role="option"
        aria-selected={active}
        onMouseEnter={() => onHover(index)}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onSelect(item)}
        className={[
          "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition",
          active ? "bg-sibs-cream-light ring-1 ring-sibs-orange/30" : "hover:bg-[#F8FAFC]",
        ].join(" ")}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#D7DEE8] bg-[#F4F7FA] text-xs font-black text-sibs-navy shadow-xs group-hover:border-sibs-orange/40 group-hover:text-sibs-orange">
          {item.initials}
        </span>

        <span className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-xs font-extrabold text-sibs-navy">
              <HighlightMatch text={item.label} query={query} />
            </span>
            <span className="inline-flex items-center rounded border border-[#B8E6CB] bg-[#EDFBF2] px-1.5 py-0.5 text-[8.5px] font-black uppercase text-[#1B804B]">
              <HighlightMatch text={item.sibsId} query={query} />
            </span>
          </div>

          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#667085]">
            {item.details ? (
              <span className="truncate">
                <HighlightMatch text={item.details} query={query} />
              </span>
            ) : (
              <span className="font-semibold text-sibs-primary-2">
                {item.breadcrumb}
              </span>
            )}
          </div>
        </span>

        <ArrowRight
          className={[
            "h-3.5 w-3.5 shrink-0 transition-transform",
            active
              ? "translate-x-0.5 text-sibs-orange"
              : "text-[#98A2B3] group-hover:text-sibs-navy",
          ].join(" ")}
        />
      </button>
    );
  }

  return (
    <button
      id={`header-search-result-${index}`}
      type="button"
      role="option"
      aria-selected={active}
      onMouseEnter={() => onHover(index)}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onSelect(item)}
      className={[
        "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition",
        active ? "bg-sibs-cream-light ring-1 ring-sibs-orange/30" : "hover:bg-[#F8FAFC]",
      ].join(" ")}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sibs-navy text-white shadow-xs group-hover:bg-sibs-orange">
        <Icon className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-xs font-extrabold text-sibs-navy">
            <HighlightMatch text={item.label} query={query} />
          </span>
          <span className="inline-flex items-center rounded bg-[#EEF4FA] px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase text-sibs-navy">
            {item.group || "Module"}
          </span>
        </div>
        <span className="mt-0.5 block truncate text-[10px] text-[#667085]">
          <HighlightMatch text={item.description} query={query} />
        </span>
      </span>

      <ArrowRight
        className={[
          "h-3.5 w-3.5 shrink-0 transition-transform",
          active
            ? "translate-x-0.5 text-sibs-orange"
            : "text-[#98A2B3] group-hover:text-sibs-navy",
        ].join(" ")}
      />
    </button>
  );
}

const RECENT_SEARCHES_STORAGE_KEY = "sibs_hris_recent_searches";
const RECENT_PROFILES_STORAGE_KEY = "sibs_hris_recent_profiles";

function getRecentSearchesFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveRecentSearchToStorage(term) {
  if (!term || typeof term !== "string" || typeof window === "undefined") return [];
  const cleanTerm = term.trim();
  if (cleanTerm.length < 2) return getRecentSearchesFromStorage();
  try {
    const existing = getRecentSearchesFromStorage().filter(
      (t) => String(t).toLowerCase() !== cleanTerm.toLowerCase(),
    );
    const updated = [cleanTerm, ...existing].slice(0, 5);
    localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return getRecentSearchesFromStorage();
  }
}

function removeRecentSearchFromStorage(term) {
  if (typeof window === "undefined") return [];
  try {
    const updated = getRecentSearchesFromStorage().filter(
      (t) => String(t).toLowerCase() !== String(term).toLowerCase(),
    );
    localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

function clearRecentSearchesFromStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

function getRecentProfilesFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_PROFILES_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.filter((p) => p && p.sibsId).slice(0, 4) : [];
  } catch {
    return [];
  }
}

function saveRecentProfileToStorage(profile) {
  if (!profile || !profile.sibsId || typeof window === "undefined") return [];
  try {
    const existing = getRecentProfilesFromStorage().filter(
      (p) => String(p.sibsId).toLowerCase() !== String(profile.sibsId).toLowerCase(),
    );
    const updated = [
      {
        sibsId: profile.sibsId,
        label: profile.label,
        initials: profile.initials,
        details: profile.details,
        timestamp: Date.now(),
      },
      ...existing,
    ].slice(0, 4);
    localStorage.setItem(RECENT_PROFILES_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return getRecentProfilesFromStorage();
  }
}

function removeRecentProfileFromStorage(sibsId) {
  if (typeof window === "undefined") return [];
  try {
    const updated = getRecentProfilesFromStorage().filter(
      (p) => String(p.sibsId).toLowerCase() !== String(sibsId).toLowerCase(),
    );
    localStorage.setItem(RECENT_PROFILES_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

function clearRecentProfilesFromStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RECENT_PROFILES_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

const QUICK_SEARCH_CATEGORIES = [
  {
    label: "Employees",
    description: "Directory & Records",
    path: "/employee/employee-data",
    icon: Users,
    color: "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100",
  },
  {
    label: "Positions",
    description: "Available Positions",
    path: "/recruitment/available-positions",
    icon: BriefcaseBusiness,
    color: "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100",
  },
  {
    label: "Pipeline",
    description: "Candidate Stages",
    path: "/recruitment/candidate-pipeline",
    icon: Table2,
    color: "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100",
  },
  {
    label: "Job Descriptions",
    description: "Canonical JDs",
    path: "/recruitment/job-description",
    icon: FileText,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100",
  },
];

export default function Header() {
  const { user, loading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const profileLookupKey = String(
    firstValue(
      user?.sibsId,
      user?.sibs_id,
      user?.username,
      user?.gy_user_code,
    ),
  ).trim();

  const [mounted, setMounted] = useState(false);
  const [timeStr, setTimeStr] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState(getRecentSearchesFromStorage);
  const [recentProfiles, setRecentProfiles] = useState(getRecentProfilesFromStorage);
  const [activeCategory, setActiveCategory] = useState("all");
  const [employeeResults, setEmployeeResults] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employeeError, setEmployeeError] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [compactSearch, setCompactSearch] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(max-width: 430px)").matches,
  );

  const searchRootRef = useRef(null);
  const searchInputRef = useRef(null);
  const employeeRequestRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!profileLookupKey) {
      setProfilePictureUrl("");
      return undefined;
    }

    let cancelled = false;

    // Never carry a previous user's image into a newly loaded session.
    setProfilePictureUrl("");

    async function loadHeaderProfilePicture() {
      const result = await getMyEmployeeProfilePicture();

      if (cancelled) return;

      const savedProfilePictureUrl = String(
        result?.data?.profilePictureUrl ||
          result?.data?.profile_picture_url ||
          "",
      ).trim();

      setProfilePictureUrl(savedProfilePictureUrl);
    }

    void loadHeaderProfilePicture();

    return () => {
      cancelled = true;
    };
  }, [profileLookupKey]);

  useEffect(() => {
    function handleProfilePictureUpdated(event) {
      const nextProfilePictureUrl = String(
        event?.detail?.profilePictureUrl ||
          event?.detail?.profile_picture_url ||
          "",
      ).trim();

      setProfilePictureUrl(nextProfilePictureUrl);
    }

    window.addEventListener(
      HEADER_PROFILE_PICTURE_UPDATED_EVENT,
      handleProfilePictureUpdated,
    );

    return () => {
      window.removeEventListener(
        HEADER_PROFILE_PICTURE_UPDATED_EVENT,
        handleProfilePictureUpdated,
      );
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 430px)");

    const handleChange = (event) => {
      setCompactSearch(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user && pathname !== "/login") {
      navigate("/login", { replace: true });
    }
  }, [mounted, loading, user, pathname, navigate]);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const updateClock = () => {
      setTimeStr(`${formatter.format(new Date())} GMT+8`);
    };

    updateClock();
    const interval = window.setInterval(updateClock, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        searchRootRef.current &&
        !searchRootRef.current.contains(event.target)
      ) {
        setSearchOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setActiveIndex(-1);
  }, [pathname]);

  useEffect(() => {
    function handleGlobalKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const normalizedQuery = normalizeText(query);

  const moduleResults = useMemo(() => {
    if (!normalizedQuery || !user) return [];

    return SEARCHABLE_MODULES.filter((moduleItem) =>
      canAccessModule(moduleItem, user),
    )
      .map((moduleItem) => ({
        ...moduleItem,
        type: "module",
        score: scoreModule(moduleItem, normalizedQuery),
      }))
      .filter((moduleItem) => Number.isFinite(moduleItem.score))
      .sort((a, b) => a.score - b.score || a.label.localeCompare(b.label))
      .slice(0, 7);
  }, [normalizedQuery, user]);

  const employeeSearchAllowed = canSearchEmployeeDirectory(user);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!employeeSearchAllowed || trimmedQuery.length < 2) {
      employeeRequestRef.current += 1;
      setEmployeeResults([]);
      setEmployeeLoading(false);
      setEmployeeError("");
      return undefined;
    }

    const requestNumber = employeeRequestRef.current + 1;
    employeeRequestRef.current = requestNumber;
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        setEmployeeLoading(true);
        setEmployeeError("");

        const result = await getEmployee(1, trimmedQuery, "All", {
          department: "All",
        });

        if (cancelled || employeeRequestRef.current !== requestNumber) return;

        setEmployeeResults(normalizeEmployeeResults(result, trimmedQuery));
      } catch (error) {
        if (cancelled || employeeRequestRef.current !== requestNumber) return;

        setEmployeeResults([]);
        setEmployeeError(
          error?.response?.data?.message || "Failed to search employee directory.",
        );
      } finally {
        if (!cancelled && employeeRequestRef.current === requestNumber) {
          setEmployeeLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [employeeSearchAllowed, query]);

  const allResults = useMemo(() => {
    if (!normalizedQuery) return [];
    return [...moduleResults, ...employeeResults];
  }, [normalizedQuery, moduleResults, employeeResults]);

  const displayedResults = useMemo(() => {
    if (activeCategory === "employees") return employeeResults;
    if (activeCategory === "modules") return moduleResults;
    return allResults;
  }, [activeCategory, employeeResults, moduleResults, allResults]);

  useEffect(() => {
    setActiveIndex(displayedResults.length > 0 ? 0 : -1);
  }, [normalizedQuery, displayedResults.length, activeCategory]);

  function closeSearch({ clear = false } = {}) {
    setSearchOpen(false);
    setActiveIndex(-1);

    if (clear) {
      setQuery("");
      setEmployeeResults([]);
      setEmployeeError("");
    }
  }

  function selectSearchResult(item) {
    if (!item) return;

    if (query.trim()) {
      const updated = saveRecentSearchToStorage(query.trim());
      setRecentSearches(updated);
    }

    closeSearch({ clear: true });

    if (item.type === "employee") {
      sessionStorage.setItem("selectedEmployeeId", item.sibsId);
      sessionStorage.removeItem("selectedCandidateId");
      const updatedProfiles = saveRecentProfileToStorage(item);
      setRecentProfiles(updatedProfiles);

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("sibs:selected-employee-changed", {
            detail: { sibsId: item.sibsId },
          }),
        );
      }

      navigate("/employee/employee-data", {
        state: {
          sibsId: item.sibsId,
          timestamp: Date.now(),
        },
      });
      return;
    }

    navigate(item.path);
  }

  function handleRecentSearchClick(term) {
    setQuery(term);
    setSearchOpen(true);
    saveRecentSearchToStorage(term);
    searchInputRef.current?.focus();
  }

  function handleRemoveRecent(term, event) {
    event.stopPropagation();
    const updated = removeRecentSearchFromStorage(term);
    setRecentSearches(updated);
  }

  function handleClearAllRecent() {
    clearRecentSearchesFromStorage();
    setRecentSearches([]);
  }

  function handleSearchKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!displayedResults.length) return;

      setSearchOpen(true);
      setActiveIndex((previous) =>
        previous >= displayedResults.length - 1 ? 0 : previous + 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!displayedResults.length) return;

      setSearchOpen(true);
      setActiveIndex((previous) =>
        previous <= 0 ? displayedResults.length - 1 : previous - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      if (!searchOpen || activeIndex < 0) return;

      event.preventDefault();
      selectSearchResult(displayedResults[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
      searchInputRef.current?.blur();
    }
  }

  if (!mounted) {
    return (
      <header className="h-[86px] shrink-0 border-b border-[#C9D6E4] bg-white px-4 shadow-sm sm:px-6">
        <div className="flex h-full items-center justify-between gap-4 pl-12 sm:pl-0">
          <div className="h-10 min-w-0 flex-1 animate-pulse rounded-lg bg-gray-200 sm:max-w-[460px]" />
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 sm:hidden" />
            <div className="hidden h-10 w-52 animate-pulse rounded bg-gray-200 sm:block" />
          </div>
        </div>
      </header>
    );
  }

  const avatar =
    user?.firstName
      ?.trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "U";

  const formattedName = (
    `${user?.lastName || ""}${user?.lastName ? ", " : ""}${
      user?.firstName || ""
    }${user?.middleName ? ` ${user.middleName}` : ""}`.trim() || "User"
  ).toUpperCase();

  const showSearchPanel = searchOpen;
  const isQueryEmpty = !query.trim();
  const noResults =
    !isQueryEmpty &&
    !employeeLoading &&
    moduleResults.length === 0 &&
    employeeResults.length === 0 &&
    (!employeeSearchAllowed || query.trim().length >= 2);

  return (
    <header className="relative z-[70] flex h-[74px] 2xl:h-[86px] shrink-0 items-center border-b border-[#D7E0E9] bg-[#FAFCFF] px-2 font-jakarta shadow-sm sm:px-5 2xl:px-6">
      <div className="flex h-full min-w-0 flex-1 items-center justify-between gap-1.5 pl-14 sm:pl-11 lg:gap-3 2xl:gap-4 lg:pl-0">
        <div
          ref={searchRootRef}
          className="relative z-[10000] min-w-[118px] flex-[1_1_auto] lg:max-w-[460px] 2xl:max-w-[560px]"
        >
          <div
            className={[
              "relative flex h-8.5 sm:h-9 2xl:h-10 min-w-0 items-center rounded-xl border bg-[#F1F5F9] transition-all duration-150",
              showSearchPanel
                ? "border-[#FF5C28] bg-white ring-2 ring-[#FF5C28]/10"
                : "border-transparent hover:border-[#FF5C28]/40 focus-within:border-[#FF5C28] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#FF5C28]/10",
            ].join(" ")}
          >
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-[#98A2B3]" />

            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => {
                setSearchOpen(true);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={
                compactSearch
                  ? "Search..."
                  : "Search employees, JD, positions, accounts, or modules (Ctrl+K)"
              }
              autoComplete="off"
              role="combobox"
              aria-expanded={showSearchPanel}
              aria-controls="header-global-search-results"
              aria-activedescendant={
                activeIndex >= 0
                  ? `header-search-result-${activeIndex}`
                  : undefined
              }
              className="h-full min-w-0 flex-1 bg-transparent pl-9 pr-14 sibs-text-xs font-semibold text-sibs-navy outline-none placeholder:font-medium placeholder:text-[#98A2B3] sm:pr-16"
            />

            <div className="absolute right-2 flex items-center gap-1">
              {employeeLoading ? (
                <span className="flex h-5 w-5 items-center justify-center text-sibs-orange" title="Searching directory...">
                  <Loader2 className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 animate-spin" />
                </span>
              ) : null}

              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    closeSearch({ clear: true });
                    searchInputRef.current?.focus();
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[#98A2B3] transition hover:bg-[#E7EDF4] hover:text-sibs-navy"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          {showSearchPanel ? (
            <div
              id="header-global-search-results"
              role="listbox"
              className="fixed inset-x-3 top-[70px] z-[9999] max-h-[80vh] overflow-hidden rounded-2xl border border-[#D7E0E9] bg-white p-3 shadow-2xl lg:absolute lg:inset-auto lg:left-0 lg:top-[calc(100%+10px)] lg:max-h-[540px] lg:w-[560px] lg:p-3.5 lg:shadow-[0_18px_50px_rgba(4,44,81,0.18)]"
            >
              {isQueryEmpty ? (
                <div className="space-y-4">
                  {recentProfiles.length > 0 ? (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#667085]">
                          Recently Viewed Profiles
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            clearRecentProfilesFromStorage();
                            setRecentProfiles([]);
                          }}
                          className="text-[10px] font-bold text-[#FF5C28] hover:underline"
                        >
                          Clear
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {recentProfiles.map((prof) => (
                          <div
                            key={prof.sibsId}
                            className="group flex items-center justify-between gap-2 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-2 transition hover:border-[#FF5C28]/40 hover:bg-[#FFF7F3]"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                selectSearchResult({
                                  type: "employee",
                                  sibsId: prof.sibsId,
                                  label: prof.label,
                                  initials: prof.initials,
                                  details: prof.details,
                                });
                              }}
                              className="flex min-w-0 flex-1 items-center gap-2 text-left"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#D7DEE8] bg-white text-[10px] font-black text-sibs-navy">
                                {prof.initials}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-extrabold text-sibs-navy group-hover:text-sibs-orange">
                                  {prof.label}
                                </span>
                                <span className="block truncate text-[9.5px] text-[#667085]">
                                  {prof.sibsId}
                                </span>
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const updated = removeRecentProfileFromStorage(prof.sibsId);
                                setRecentProfiles(updated);
                              }}
                              className="text-[#98A2B3] hover:text-sibs-navy"
                              aria-label={`Remove ${prof.label}`}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {recentSearches.length > 0 ? (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#667085]">
                          Recent Searches
                        </span>
                        <button
                          type="button"
                          onClick={handleClearAllRecent}
                          className="text-[10px] font-bold text-[#FF5C28] hover:underline"
                        >
                          Clear All
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((term) => (
                          <span
                            key={term}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-1 text-xs font-bold text-[#042C51] transition hover:bg-[#EEF4FA]"
                          >
                            <button
                              type="button"
                              onClick={() => handleRecentSearchClick(term)}
                              className="hover:underline"
                            >
                              {term}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleRemoveRecent(term, e)}
                              className="text-[#98A2B3] hover:text-[#042C51]"
                              aria-label={`Remove ${term}`}
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#667085]">
                        Popular Quick Categories
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {QUICK_SEARCH_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.label}
                            type="button"
                            onClick={() => {
                              navigate(cat.path);
                              setSearchOpen(false);
                            }}
                            className="flex flex-col items-center gap-1.5 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-2.5 text-center transition hover:-translate-y-0.5 hover:border-[#FF5C28]/40 hover:bg-[#FFF7F3] hover:shadow-sm sm:p-3"
                          >
                            <div className={`flex h-8 w-8 items-center justify-center rounded-xl border sm:h-9 sm:w-9 ${cat.color}`}>
                              <Icon size={17} />
                            </div>
                            <span className="text-[11px] font-extrabold text-[#042C51]">
                              {cat.label}
                            </span>
                            <span className="line-clamp-1 text-[9px] font-semibold text-[#667085]">
                              {cat.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="thin-scroll max-h-[500px] overflow-y-auto py-1">
                  <div className="mb-2 flex items-center gap-1.5 border-b border-[#E6ECF2] pb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory("all");
                        setActiveIndex(0);
                      }}
                      className={[
                        "rounded-lg px-2.5 py-1 text-[10px] font-extrabold transition",
                        activeCategory === "all"
                          ? "bg-sibs-navy text-white shadow-xs"
                          : "bg-[#F1F5F9] text-[#667085] hover:bg-[#E2E8F0] hover:text-sibs-navy",
                      ].join(" ")}
                    >
                      All ({allResults.length})
                    </button>

                    {employeeSearchAllowed ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCategory("employees");
                          setActiveIndex(0);
                        }}
                        className={[
                          "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-extrabold transition",
                          activeCategory === "employees"
                            ? "bg-sibs-orange text-white shadow-xs"
                            : "bg-[#F1F5F9] text-[#667085] hover:bg-[#E2E8F0] hover:text-sibs-navy",
                        ].join(" ")}
                      >
                        Employees ({employeeResults.length})
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory("modules");
                        setActiveIndex(0);
                      }}
                      className={[
                        "rounded-lg px-2.5 py-1 text-[10px] font-extrabold transition",
                        activeCategory === "modules"
                          ? "bg-sibs-navy text-white shadow-xs"
                          : "bg-[#F1F5F9] text-[#667085] hover:bg-[#E2E8F0] hover:text-sibs-navy",
                      ].join(" ")}
                    >
                      Modules ({moduleResults.length})
                    </button>
                  </div>

                  {displayedResults.length > 0 ? (
                    <div className="divide-y divide-[#EEF2F6]">
                      {displayedResults.map((item, index) => (
                        <SearchResultButton
                          key={item.type === "employee" ? `emp-${item.sibsId}` : `mod-${item.path}`}
                          item={item}
                          index={index}
                          active={activeIndex === index}
                          query={query}
                          onHover={setActiveIndex}
                          onSelect={selectSearchResult}
                        />
                      ))}
                    </div>
                  ) : null}

                  {employeeSearchAllowed && query.trim().length === 1 ? (
                    <div className="mx-3 my-2 flex items-center gap-2 rounded-lg bg-[#F7F9FC] px-3 py-2 text-[10px] font-semibold text-[#667085]">
                      <UserRound className="h-3.5 w-3.5 text-sibs-primary-1" />
                      Type one more character to search employees.
                    </div>
                  ) : null}

                  {noResults || (displayedResults.length === 0 && !employeeLoading && query.trim().length >= 2) ? (
                    <div className="px-5 py-8 text-center">
                      <Search className="mx-auto h-6 w-6 text-[#98A2B3]" />
                      <p className="mt-2 text-xs font-extrabold text-[#344054]">
                        No matching result
                      </p>
                      <p className="mt-1 text-[10px] leading-relaxed text-[#667085]">
                        Try a module name, employee name, SIBS ID, department, or
                        account.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="mt-2 hidden items-center justify-between border-t border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2 text-[9px] font-semibold text-[#667085] sm:flex">
                <span>↑ ↓ Navigate</span>
                <span>Enter Open</span>
                <span>Ctrl + K Focus</span>
                <span>Esc Close</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5 2xl:gap-3">
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className="group hidden h-8.5 2xl:h-10 items-center gap-1.5 2xl:gap-2 rounded-xl border border-transparent px-2.5 2xl:px-3 sibs-text-micro font-semibold text-[#667085] transition-all duration-150 hover:border-sibs-orange/30 hover:bg-sibs-cream-subtle hover:text-sibs-orange hover:shadow-xs xl:flex hover:cursor-pointer"
            aria-label="Open HR and talent acquisition calendar"
          >
            <CalendarDays className="h-3.5 w-3.5 text-[#98A2B3] transition-colors group-hover:text-sibs-orange" />
            <span className="whitespace-nowrap">{timeStr}</span>
          </button>

          <div className="hidden h-5 2xl:h-6 w-px bg-[#E0E6ED] xl:block" />

          <NotificationDropdown />

          <div className="hidden h-5 2xl:h-6 w-px bg-[#E0E6ED] sm:block" />

          <div className="relative z-[9999] min-w-0 shrink-0">
            {loading || !user ? (
              <>
                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 sm:hidden" />
                <div className="hidden h-10 w-52 animate-pulse rounded bg-gray-200 sm:block" />
              </>
            ) : (
              <UserDropdown
                avatar={avatar}
                profilePictureUrl={profilePictureUrl}
                formattedName={formattedName}
                email={user.email}
                mobileCompact
              />
            )}
          </div>
        </div>
      </div>

      <HeaderCalendarModal
        open={calendarOpen}
        user={user}
        onClose={() => setCalendarOpen(false)}
      />
    </header>
  );
}
