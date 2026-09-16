import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  ChevronUp,
  Layers3,
  Loader2,
  RefreshCw,
  Search,
  UsersRound,
  X,
} from "lucide-react";

import Header from "../../components/layout/Header";
import { PageHeaderHero, TablePagination } from "@/components/ui";
import {
  getDepartmentAccountEmployees,
  getDepartmentDirectoryData,
} from "../../lib/axios/departments";
import {
  buildDepartmentDirectory,
  filterDepartmentDirectory,
  getDepartmentDirectorySummary,
} from "../../lib/utils/departments/departmentDirectory";

const PAGE_LIMIT = 15;
const DEFAULT_VISIBLE_ACCOUNTS = 6;
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5001"
).replace(/\/+$/, "");

function safeText(value) {
  return String(value ?? "").trim();
}

function cleanMiddleName(value) {
  const middleName = safeText(value);

  if (!middleName || /^(?:n\/?a|none|null|undefined)$/i.test(middleName)) {
    return "";
  }

  return middleName;
}

function getEmployeeName(employee = {}) {
  const parts = [
    safeText(employee.firstName),
    cleanMiddleName(employee.middleName),
    safeText(employee.lastName),
  ].filter(Boolean);

  return parts.join(" ") || "Unknown Employee";
}

const AVATAR_TONES = [
  "border-orange-100 bg-orange-50 text-[#FF5C28]",
  "border-emerald-100 bg-emerald-50 text-emerald-700",
  "border-blue-100 bg-blue-50 text-[#042C51]",
  "border-pink-100 bg-pink-50 text-pink-700",
  "border-violet-100 bg-violet-50 text-violet-700",
];

function getEmployeeAvatarName(employee = {}) {
  const firstName = safeText(
    employee.firstName || employee.first_name || employee.gy_emp_fname,
  );
  const middleName = safeText(
    employee.middleName || employee.middle_name || employee.gy_emp_mname,
  );
  const lastName = safeText(
    employee.lastName || employee.last_name || employee.gy_emp_lname,
  );

  if (firstName || middleName || lastName) {
    const givenNames = [firstName, middleName].filter(Boolean).join(" ");

    return [lastName ? lastName.toUpperCase() : "", givenNames]
      .filter(Boolean)
      .join(lastName && givenNames ? ", " : "")
      .replace(/\s+/g, " ")
      .trim();
  }

  return (
    safeText(
      employee.fullName ||
        employee.full_name ||
        employee.gy_emp_fullname ||
        employee.name,
    ) || "Unnamed Employee"
  );
}

function getInitials(employee = {}) {
  const firstName = safeText(
    employee.firstName || employee.first_name || employee.gy_emp_fname,
  );
  const lastName = safeText(
    employee.lastName || employee.last_name || employee.gy_emp_lname,
  );

  if (firstName || lastName) {
    return `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase();
  }

  const tokens = getEmployeeAvatarName(employee)
    .replace(",", " ")
    .split(/\s+/)
    .filter(Boolean);

  return `${tokens[0]?.[0] || "E"}${tokens[1]?.[0] || ""}`.toUpperCase();
}

function getAvatarTone(employee = {}) {
  const seed = getEmployeeAvatarName(employee)
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return AVATAR_TONES[seed % AVATAR_TONES.length];
}

function getEmployeeProfileUrl(employee = {}) {
  const value = safeText(
    employee.profilePictureUrl || employee.profile_picture_url,
  );

  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;

  return `${API_URL}${value.startsWith("/") ? "" : "/"}${value}`;
}

function getEmployeeAvatarPreviewPosition(element) {
  if (!element || typeof window === "undefined") return null;

  const rect = element.getBoundingClientRect();
  const previewHeight = 176;
  const gap = 12;
  const placeBelow = rect.top < previewHeight + gap;

  return {
    left: rect.left + rect.width / 2,
    top: placeBelow ? rect.bottom + gap : rect.top - gap,
    placeBelow,
  };
}

function EmployeeAvatar({ employee, size = "md" }) {
  const sizeClass = size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const profilePictureUrl = getEmployeeProfileUrl(employee);
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(null);
  const avatarRef = useRef(null);
  const canShowProfilePicture =
    Boolean(profilePictureUrl) && failedImageUrl !== profilePictureUrl;
  const employeeName = getEmployeeAvatarName(employee);
  const initials = getInitials(employee);

  const showPreview = () => {
    setPreviewPosition(getEmployeeAvatarPreviewPosition(avatarRef.current));
    setPreviewVisible(true);
  };

  const hidePreview = () => {
    setPreviewVisible(false);
  };

  useEffect(() => {
    if (!previewVisible) return undefined;

    const updatePreviewPosition = () => {
      setPreviewPosition(getEmployeeAvatarPreviewPosition(avatarRef.current));
    };

    window.addEventListener("resize", updatePreviewPosition);
    window.addEventListener("scroll", updatePreviewPosition, true);

    return () => {
      window.removeEventListener("resize", updatePreviewPosition);
      window.removeEventListener("scroll", updatePreviewPosition, true);
    };
  }, [previewVisible]);

  const preview =
    previewVisible && previewPosition && typeof document !== "undefined"
      ? createPortal(
          <span
            className="employee-avatar-preview pointer-events-none fixed z-[100000] rounded-2xl border border-[#D9E6F2] bg-white p-2 shadow-[0_18px_45px_rgba(4,44,81,0.22)]"
            style={{
              left: previewPosition.left,
              top: previewPosition.top,
              transform: previewPosition.placeBelow
                ? "translate(-50%, 0)"
                : "translate(-50%, -100%)",
            }}
            aria-hidden="true"
          >
            <span
              className={`relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-xl border text-[24px] font-extrabold ${getAvatarTone(
                employee,
              )}`}
            >
              <span>{initials}</span>

              {canShowProfilePicture ? (
                <img
                  src={profilePictureUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={() => setFailedImageUrl(profilePictureUrl)}
                />
              ) : null}
            </span>
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={avatarRef}
        className="relative inline-flex shrink-0 outline-none"
        tabIndex={0}
        aria-label={`${employeeName || "Employee"} profile picture`}
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
        onFocus={showPreview}
        onBlur={hidePreview}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <span
          className={`relative inline-flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border text-xs font-extrabold shadow-inner ${getAvatarTone(
            employee,
          )}`}
        >
          <span aria-hidden="true">{initials}</span>

          {canShowProfilePicture ? (
            <img
              src={profilePictureUrl}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setFailedImageUrl(profilePictureUrl)}
            />
          ) : null}
        </span>
      </span>
      {preview}
    </>
  );
}

function HoverEmployeeAvatar({ employee }) {
  return <EmployeeAvatar employee={employee} />;
}

function SummaryCard({ icon, label, value, description, tone = "blue" }) {
  const tones = {
    blue: "bg-[#EAF2FB] text-[#042C51]",
    cyan: "bg-cyan-50 text-cyan-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };

  return (
    <article className="sibs-metric-card sibs-card p-4">
      <div className="flex h-full items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="sibs-text-micro font-extrabold uppercase tracking-normal text-[#042C51]">
            {label}
          </p>
          <p className="font-heading mt-2 text-2xl font-bold leading-none tabular-nums tracking-tight text-[#042C51] 2xl:text-3xl">
            {Number(value || 0).toLocaleString("en-PH")}
          </p>
          <p className="mt-1 sibs-text-micro font-semibold leading-tight text-[#667085]">
            {description}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tones[tone] || tones.blue}`}
        >
          {createElement(icon, { size: 17, strokeWidth: 2 })}
        </div>
      </div>
    </article>
  );
}

function AccountItem({ account, onClick }) {
  const employeeCount = Number(account.employeeCount || 0);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2.5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#FF5C28]/35 hover:bg-[#FFF9F6] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C28]/30"
      aria-label={`View active employees in ${account.accountName || "this account"}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-extrabold text-[#042C51]">
            {account.accountName || "Unnamed Account"}
          </p>
        </div>

        <span className="inline-flex shrink-0 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-[#174A7C]">
          Active
        </span>
      </div>

      {account.ghlName && (
        <p className="mt-2 truncate text-[10px] font-semibold text-[#8A98B8]">
          {account.ghlName}
        </p>
      )}

      {account.clusterName && (
        <p className="mt-1 truncate text-[10px] font-bold text-[#667085]">
          {account.clusterName}
        </p>
      )}

      <p className="mt-1 text-[10px] font-extrabold text-[#174A7C]">
        {employeeCount.toLocaleString("en-PH")} {
          employeeCount === 1 ? "Employee" : "Employees"
        }
      </p>
    </button>
  );
}

function DepartmentCard({
  department,
  expanded,
  onToggle,
  onSelectAccount,
}) {
  const accountCount = department.accounts.length;
  const canExpand = accountCount > DEFAULT_VISIBLE_ACCOUNTS;
  const visibleAccounts = expanded
    ? department.accounts
    : department.accounts.slice(0, DEFAULT_VISIBLE_ACCOUNTS);

  return (
    <article className="sibs-card overflow-hidden rounded-2xl border border-[#E1E7EF] bg-white">
      <div className="border-b border-[#E6ECF2] bg-white px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FB] text-[#042C51]">
              <Building2 size={19} />
            </span>

            <div className="min-w-0">
              <h2 className="truncate text-sm font-extrabold text-[#042C51] sm:text-base">
                {department.departmentName}
              </h2>
            </div>
          </div>

          <span className="inline-flex shrink-0 rounded-full border border-orange-100 bg-[#FFF3ED] px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#FF5C28]">
            {accountCount} {accountCount === 1 ? "Account" : "Accounts"}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {visibleAccounts.length ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {visibleAccounts.map((account) => (
              <AccountItem
                key={`${department.departmentId}-${account.accountId}`}
                account={account}
                onClick={() => onSelectAccount(account)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#D6DEE8] bg-[#F8FAFC] px-4 py-8 text-center">
            <BriefcaseBusiness className="mx-auto h-6 w-6 text-[#8A98B8]" />
            <p className="mt-2 text-xs font-bold text-[#667085]">
              No active Kronos accounts under this department.
            </p>
          </div>
        )}

        {canExpand && (
          <button
            type="button"
            onClick={onToggle}
            className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-[#042C51] transition hover:bg-[#F8FAFC]"
          >
            {expanded ? (
              <>
                <ChevronUp size={15} />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown size={15} />
                Show All {accountCount} Accounts
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
}

function AccountEmployeesModal({
  account,
  employees,
  loading,
  errorMessage,
  search,
  onSearchChange,
  onClose,
}) {
  const open = Boolean(account);

  const filteredEmployees = useMemo(() => {
    const keyword = safeText(search).toLowerCase();

    if (!keyword) return employees;

    return employees.filter((employee) =>
      [
        employee.sibsId,
        getEmployeeName(employee),
        employee.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [employees, search]);

  useEffect(() => {
    if (!open) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;

  const employeeCount = Number(account.employeeCount || 0);

  return createPortal(
    <div className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[99999] flex h-dvh items-center justify-center p-2 font-jakarta sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="department-account-employees-title"
        className="sibs-modal-pop-in flex max-h-[88dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#F8FAFC] shadow-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 bg-[#042C51] px-5 py-4 text-white sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
              <UsersRound size={18} />
            </span>

            <div className="min-w-0">
              <h2
                id="department-account-employees-title"
                className="truncate text-base font-extrabold text-white sm:text-lg"
              >
                {account.accountName || "Account Employees"}
              </h2>
              <p className="mt-1 text-xs font-semibold text-white/75">
                {employeeCount.toLocaleString("en-PH")} active{" "}
                {employeeCount === 1 ? "employee" : "employees"} in Kronos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white"
            aria-label="Close account employees"
          >
            <X size={19} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden p-4 sm:p-5">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A98B8]"
            />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search employee, SIBS ID, or email..."
              className="h-10 w-full rounded-lg border border-[#D9E2EC] bg-white pl-10 pr-4 text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#8A98B8] focus:border-[#042C51] focus:ring-4 focus:ring-[#042C51]/10"
            />
          </div>

          <div className="mt-4 flex h-[min(58dvh,560px)] min-h-[280px] flex-col overflow-hidden rounded-xl border border-[#E1E7EF] bg-white">
            <div className="grid shrink-0 grid-cols-[64px_110px_minmax(180px,1fr)_minmax(190px,1.2fr)_90px] gap-3 border-b border-[#E6ECF2] bg-[#F8FAFC] px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-wide text-[#667085] max-md:hidden">
              <span>Profile</span>
              <span>SIBS ID</span>
              <span>Employee</span>
              <span>Email</span>
              <span>Status</span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto sibs-scrollbar">
              {loading ? (
                <div className="flex h-full min-h-[220px] items-center justify-center gap-2 text-sm font-bold text-[#667085]">
                  <Loader2 size={18} className="animate-spin text-[#042C51]" />
                  Loading active employees...
                </div>
              ) : errorMessage ? (
                <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
                  {errorMessage}
                </div>
              ) : filteredEmployees.length ? (
                filteredEmployees.map((employee) => (
                  <div
                    key={`${employee.gyEmpId || employee.sibsId}-${employee.sibsId}`}
                    className="grid grid-cols-1 gap-2 border-b border-[#EEF2F6] px-4 py-3 last:border-b-0 md:grid-cols-[64px_110px_minmax(180px,1fr)_minmax(190px,1.2fr)_90px] md:items-center md:gap-3"
                  >
                    <div className="flex items-center gap-3 md:block">
                      <HoverEmployeeAvatar employee={employee} />
                      <div className="min-w-0 md:hidden">
                        <p className="truncate text-xs font-extrabold text-[#101828]">
                          {getEmployeeName(employee)}
                        </p>
                        <p className="mt-0.5 text-[10px] font-semibold text-[#667085]">
                          SIBS ID: {employee.sibsId || "—"}
                        </p>
                      </div>
                    </div>

                    <p className="hidden text-xs font-extrabold text-[#FF5C28] md:block">
                      {employee.sibsId || "—"}
                    </p>

                    <p className="hidden truncate text-xs font-extrabold text-[#101828] md:block">
                      {getEmployeeName(employee)}
                    </p>

                    <p className="truncate text-[11px] font-semibold text-[#667085] md:text-xs">
                      {employee.email || "No email available"}
                    </p>

                    <div>
                      <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                        Active
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center px-6 text-center">
                  <UsersRound size={28} className="text-[#8A98B8]" />
                  <p className="mt-3 text-sm font-extrabold text-[#042C51]">
                    {search ? "No matching employees" : "No active employees"}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#667085]">
                    {search
                      ? "Try a different employee search."
                      : "Kronos has no active employees assigned to this account."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}

function LoadingCards() {
  return Array.from({ length: 6 }).map((_, index) => (
    <div
      key={index}
      className="sibs-card h-64 animate-sibs-pulse rounded-2xl bg-gray-100"
    />
  ));
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedDepartmentIds, setExpandedDepartmentIds] = useState(
    () => new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountEmployees, setAccountEmployees] = useState([]);
  const [accountEmployeesLoading, setAccountEmployeesLoading] = useState(false);
  const [accountEmployeesError, setAccountEmployeesError] = useState("");
  const [accountEmployeeSearch, setAccountEmployeeSearch] = useState("");
  const accountEmployeeRequestRef = useRef(0);

  const loadDirectory = useCallback(async ({ refresh = false } = {}) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      setErrorMessage("");
      const result = await getDepartmentDirectoryData();
      setDepartments(result.departments);
      setAccounts(result.accounts);
    } catch (error) {
      setDepartments([]);
      setAccounts([]);
      setErrorMessage(
        error?.message || "Unable to load the Kronos department directory.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  const directory = useMemo(
    () => buildDepartmentDirectory(departments, accounts),
    [accounts, departments],
  );

  const summary = useMemo(
    () => getDepartmentDirectorySummary(directory),
    [directory],
  );

  const filteredDirectory = useMemo(
    () => filterDepartmentDirectory(directory, search),
    [directory, search],
  );

  const totalPages = Math.max(
    Math.ceil(filteredDirectory.length / PAGE_LIMIT),
    1,
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedDepartments = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_LIMIT;
    return filteredDirectory.slice(start, start + PAGE_LIMIT);
  }, [filteredDirectory, safeCurrentPage]);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedDepartmentIds(new Set());
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function toggleDepartment(departmentId) {
    setExpandedDepartmentIds((previous) => {
      const next = new Set(previous);
      if (next.has(departmentId)) next.delete(departmentId);
      else next.add(departmentId);
      return next;
    });
  }

  function clearSearch() {
    setSearch("");
    setCurrentPage(1);
  }

  async function openAccountEmployees(account) {
    const requestId = accountEmployeeRequestRef.current + 1;
    accountEmployeeRequestRef.current = requestId;

    setSelectedAccount(account);
    setAccountEmployees([]);
    setAccountEmployeesError("");
    setAccountEmployeeSearch("");
    setAccountEmployeesLoading(true);

    try {
      const employees = await getDepartmentAccountEmployees(account.accountId);

      if (accountEmployeeRequestRef.current === requestId) {
        setAccountEmployees(employees);
      }
    } catch (error) {
      if (accountEmployeeRequestRef.current === requestId) {
        setAccountEmployees([]);
        setAccountEmployeesError(
          error?.message || "Unable to load active employees for this account.",
        );
      }
    } finally {
      if (accountEmployeeRequestRef.current === requestId) {
        setAccountEmployeesLoading(false);
      }
    }
  }

  function closeAccountEmployees() {
    accountEmployeeRequestRef.current += 1;
    setSelectedAccount(null);
    setAccountEmployees([]);
    setAccountEmployeesError("");
    setAccountEmployeeSearch("");
    setAccountEmployeesLoading(false);
  }

  return (
    <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-5">
          <PageHeaderHero
            kicker="Administration"
            title="Departments"
            description="View Kronos departments and the active accounts assigned under each department."
            actions={
              <button
                type="button"
                onClick={() => loadDirectory({ refresh: true })}
                disabled={refreshing || loading}
                className="sibs-btn-icon"
                title="Refresh departments"
                aria-label="Refresh departments"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
            }
          />

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard
              icon={Building2}
              label="Departments"
              value={summary.totalDepartments}
              description="Kronos departments"
            />
            <SummaryCard
              icon={BriefcaseBusiness}
              label="Active Accounts"
              value={summary.totalActiveAccounts}
              description="Active Kronos accounts"
              tone="cyan"
            />
            <SummaryCard
              icon={Layers3}
              label="With Accounts"
              value={summary.departmentsWithAccounts}
              description="Departments with active accounts"
              tone="emerald"
            />
          </section>

          <section className="sibs-card overflow-hidden rounded-2xl">
            <div className="border-b border-[#E6ECF2] bg-white px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="sibs-section-title">Department Directory</h2>
                  <p className="sibs-section-subtitle">
                    Display-only directory synchronized from Kronos.
                  </p>
                </div>

                <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-extrabold uppercase text-[#174A7C]">
                  {filteredDirectory.length} Result
                  {filteredDirectory.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-[10px] font-bold text-[#101828]">
                    Search
                  </label>
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                    />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search department or account..."
                      className="h-10 w-full rounded-lg border border-[#D9E2EC] bg-[#F8FAFC] pl-10 pr-4 text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#8A98B8] hover:border-[#042C51]/30 focus:border-[#042C51] focus:bg-white focus:ring-4 focus:ring-[#042C51]/10"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearSearch}
                  disabled={!search}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-[#042C51] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear
                </button>
              </div>

              {errorMessage ? (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                {loading ? (
                  <LoadingCards />
                ) : paginatedDepartments.length ? (
                  paginatedDepartments.map((department) => {
                    const departmentKey =
                      department.departmentId || department.departmentName;
                    return (
                      <DepartmentCard
                        key={departmentKey}
                        department={department}
                        expanded={expandedDepartmentIds.has(departmentKey)}
                        onToggle={() => toggleDepartment(departmentKey)}
                        onSelectAccount={openAccountEmployees}
                      />
                    );
                  })
                ) : (
                  <div className="col-span-full rounded-2xl border border-dashed border-[#D6DEE8] bg-[#F8FAFC] px-6 py-14 text-center">
                    {loading ? (
                      <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#042C51]" />
                    ) : (
                      <Building2 className="mx-auto h-8 w-8 text-[#8A98B8]" />
                    )}
                    <p className="mt-3 text-sm font-extrabold text-[#042C51]">
                      No departments found
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#667085]">
                      Try a different department or account search.
                    </p>
                  </div>
                )}
              </div>

              <TablePagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                totalRecords={filteredDirectory.length}
                loadedCount={paginatedDepartments.length}
                recordLabel="departments"
                onPageChange={(nextPage) => {
                  setCurrentPage(nextPage);
                  setExpandedDepartmentIds(new Set());
                }}
                loading={loading}
              />
            </div>
          </section>
        </div>
      </main>

      <AccountEmployeesModal
        account={selectedAccount}
        employees={accountEmployees}
        loading={accountEmployeesLoading}
        errorMessage={accountEmployeesError}
        search={accountEmployeeSearch}
        onSearchChange={setAccountEmployeeSearch}
        onClose={closeAccountEmployees}
      />
    </div>
  );
}
