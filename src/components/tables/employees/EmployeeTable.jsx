import { useEffect, useMemo, useRef, useState } from "react";
import {
  Briefcase,
  Building2,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  UserRound,
  UserRoundCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getEmployee } from "@/lib/axios/getEmployee";
import { useUser } from "@/services/context/UserContext";
import { usePagination } from "@/services/context/PaginationContext";
import PaginationTable from "@/services/pagination/PaginationTable";

const ENTITY = "employees";
const PAGE_LIMIT = 15;

const columns = [
  "SIBS ID",
  "EMPLOYEE NAME",
  "ACCOUNT / SITE",
  "DEPARTMENT / POSITION",
  "CONTACT & EMAIL",
  "HR METADATA",
];

const defaultDirectoryTabs = [
  {
    label: "Employees",
    count: 0,
    icon: UserRoundCheck,
    description: "Employee master records",
  },
];

const AVATAR_TONES = [
  "border-orange-100 bg-orange-50 text-[#FF5C28]",
  "border-emerald-100 bg-emerald-50 text-emerald-700",
  "border-blue-100 bg-blue-50 text-[#042C51]",
  "border-pink-100 bg-pink-50 text-pink-700",
  "border-violet-100 bg-violet-50 text-violet-700",
];

function getCleanValue(...values) {
  const match = values.find((value) => {
    return value !== undefined && value !== null && String(value).trim() !== "";
  });

  return match === undefined || match === null ? "" : String(match).trim();
}

function normalizeRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function canViewEmployeeFilters(user) {
  const roles = [
    user?.role,
    user?.tokenType,
    user?.userRole,
    user?.accountType,
    user?.user_type,
    user?.gy_user_type,
  ].map(normalizeRole);

  const access = Number(
    user?.admin_access ??
      user?.adminAccess ??
      user?.access ??
      user?.gy_user_access ??
      user?.gyUserAccess ??
      0,
  );

  return (
    access === 1 ||
    roles.some((role) =>
      [
        "hr_admin",
        "hradmin",
        "super_admin",
        "superadmin",
        "super_administrator",
      ].includes(role),
    )
  );
}

function normalizeDepartmentOption(option) {
  if (typeof option === "string" || typeof option === "number") {
    return {
      label: String(option),
      value: String(option),
    };
  }

  return {
    label:
      getCleanValue(
        option?.label,
        option?.name_department,
        option?.departmentName,
        option?.name,
      ) || "Unnamed Department",
    value: String(
      getCleanValue(
        option?.value,
        option?.id_department,
        option?.departmentId,
        option?.id,
      ),
    ),
  };
}

function normalizeAccountOption(option) {
  if (typeof option === "string" || typeof option === "number") {
    return {
      label: String(option),
      value: String(option),
    };
  }

  return {
    label:
      getCleanValue(
        option?.label,
        option?.account,
        option?.accountName,
        option?.gy_acc_name,
      ) || "Unnamed Account",
    value: String(
      getCleanValue(
        option?.value,
        option?.account,
        option?.accountName,
        option?.gy_acc_name,
      ),
    ),
  };
}

function getNameParts(employee = {}) {
  return {
    firstName: getCleanValue(
      employee.firstName,
      employee.first_name,
      employee.gy_emp_fname,
    ),
    middleName: getCleanValue(
      employee.middleName,
      employee.middle_name,
      employee.gy_emp_mname,
    ),
    lastName: getCleanValue(
      employee.lastName,
      employee.last_name,
      employee.gy_emp_lname,
    ),
  };
}

function getEmployeeName(employee = {}) {
  const { firstName, middleName, lastName } = getNameParts(employee);

  if (firstName || middleName || lastName) {
    const givenNames = [firstName, middleName].filter(Boolean).join(" ");

    return [lastName ? lastName.toUpperCase() : "", givenNames]
      .filter(Boolean)
      .join(lastName && givenNames ? ", " : "")
      .replace(/\s+/g, " ")
      .trim();
  }

  return (
    getCleanValue(
      employee.fullName,
      employee.full_name,
      employee.gy_emp_fullname,
      employee.name,
    ) || "Unnamed Employee"
  );
}

function getInitials(employee = {}) {
  const { firstName, lastName } = getNameParts(employee);

  if (firstName || lastName) {
    return `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase();
  }

  const tokens = getEmployeeName(employee)
    .replace(",", " ")
    .split(/\s+/)
    .filter(Boolean);

  return `${tokens[0]?.[0] || "E"}${tokens[1]?.[0] || ""}`.toUpperCase();
}

function getAvatarTone(employee = {}) {
  const seed = getEmployeeName(employee)
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return AVATAR_TONES[seed % AVATAR_TONES.length];
}

function getSibsId(employee = {}) {
  return getCleanValue(
    employee.sibsId,
    employee.sibs_id,
    employee.employeeId,
    employee.employee_id,
    employee.gy_emp_id,
    employee.username,
  );
}

function getPreferredName(employee = {}) {
  return getCleanValue(
    employee.preferredName,
    employee.preferred_name,
    employee.nickname,
    employee.nickName,
  );
}

function getDepartment(employee = {}) {
  return (
    getCleanValue(
      employee.department,
      employee.departmentName,
      employee.department_name,
      employee.name_department,
      employee.gy_dept_name,
    ) || "Unassigned"
  );
}

function getAccount(employee = {}) {
  return (
    getCleanValue(
      employee.account,
      employee.accountName,
      employee.account_name,
      employee.gy_acc_name,
    ) || "Unassigned"
  );
}

function getPosition(employee = {}) {
  return (
    getCleanValue(
      employee.position,
      employee.positionTitle,
      employee.position_title,
      employee.jobTitle,
      employee.job_title,
      employee.role,
      employee.gy_pos_name,
    ) || "No position"
  );
}

function getAssignedSite(employee = {}) {
  const raw = getCleanValue(
    employee.site,
    employee.assignedSite,
    employee.assigned_site,
    employee.location,
    employee.gy_assignedloc,
    employee.assigned_loc,
  );

  if (!raw) return "N/A";
  if (raw === "0") return "Tagum";
  if (raw === "1") return "Davao";
  if (raw === "2") return "Both Tagum and Davao";
  if (raw === "3") return "Hybrid";

  return raw;
}

function getEmail(employee = {}) {
  return (
    getCleanValue(
      employee.email,
      employee.emailAddress,
      employee.email_address,
      employee.gy_emp_email,
    ) || "No email"
  );
}

function getContact(employee = {}) {
  return (
    getCleanValue(
      employee.contact,
      employee.mobileNumber,
      employee.mobile_number,
      employee.phone,
      employee.phoneNumber,
      employee.phone_number,
      employee.gy_emp_mobile,
    ) || "No contact"
  );
}

function getGender(employee = {}) {
  return getCleanValue(employee.gender, employee.gy_emp_gender) || "N/A";
}

function getCivilStatus(employee = {}) {
  return (
    getCleanValue(
      employee.civilStatus,
      employee.civil_status,
      employee.maritalStatus,
      employee.marital_status,
      employee.gy_emp_civilstatus,
    ) || "N/A"
  );
}

function getHireDate(employee = {}) {
  return getCleanValue(
    employee.hireDate,
    employee.hire_date,
    employee.dateHired,
    employee.date_hired,
    employee.gy_emp_hiredate,
  );
}

function formatCompactDate(value) {
  const raw = getCleanValue(value);

  if (!raw) return "N/A";

  const isoDate = raw.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (isoDate) return isoDate;

  const parsedDate = new Date(raw);
  if (Number.isNaN(parsedDate.getTime())) return raw;

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsedDate);
}

function EmployeeAvatar({ employee, size = "md" }) {
  const sizeClass = size === "lg" ? "h-11 w-11" : "h-9 w-9";

  return (
    <span
      className={`inline-flex ${sizeClass} shrink-0 items-center justify-center rounded-full border text-xs font-extrabold shadow-inner ${getAvatarTone(
        employee,
      )}`}
      aria-hidden="true"
    >
      {getInitials(employee)}
    </span>
  );
}

function EmptyState({ loading, message }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF2FB] text-[#042C51]">
        <UserRoundCheck size={22} />
      </div>

      <h3 className="mt-3 text-sm font-extrabold text-[#042C51]">
        {loading ? "Loading employees..." : "No employees found"}
      </h3>

      <p className="mt-1 max-w-xl text-xs font-bold leading-4 text-[#667085]">
        {loading
          ? "Fetching the latest employee directory records."
          : message ||
            "Try adjusting the search or refresh the employee directory."}
      </p>
    </div>
  );
}

function DetailLine({ icon, children, breakAll = false }) {
  const DetailIcon = icon;

  return (
    <span className="flex min-w-0 items-start gap-1.5 text-[11px] font-semibold leading-4 text-[#667085]">
      <DetailIcon size={13} className="mt-0.5 shrink-0 text-[#98A2B3]" />
      <span className={breakAll ? "min-w-0 break-all" : "min-w-0 break-words"}>
        {children}
      </span>
    </span>
  );
}

function MobileEmployeeCard({ employee, onOpen }) {
  const preferredName = getPreferredName(employee);

  return (
    <button
      type="button"
      onClick={() => onOpen(employee)}
      className="sibs-card w-full rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#FF5C28]/40 hover:bg-[#FFF9F6] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#FF5C28]/30"
      aria-label={`Open employee profile for ${getEmployeeName(employee)}`}
    >
      <div className="flex items-start gap-3">
        <EmployeeAvatar employee={employee} size="lg" />

        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#FF5C28]">
            {getSibsId(employee) || "N/A"}
          </span>

          <h3 className="mt-1 break-words text-sm font-extrabold leading-tight text-[#042C51]">
            {getEmployeeName(employee)}
          </h3>

          {preferredName ? (
            <p className="mt-1 text-[11px] font-semibold text-[#667085]">
              Preferred: {preferredName}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
            Account / Site
          </p>
          <p className="mt-1 text-xs font-extrabold text-[#042C51]">
            {getAccount(employee)}
          </p>
          <DetailLine icon={MapPin}>{getAssignedSite(employee)}</DetailLine>
        </div>

        <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
            Department / Position
          </p>
          <p className="mt-1 break-words text-xs font-extrabold text-[#042C51]">
            {getPosition(employee)}
          </p>
          <DetailLine icon={Building2}>{getDepartment(employee)}</DetailLine>
        </div>

        <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
            Contact & Email
          </p>
          <div className="mt-1 space-y-1">
            <DetailLine icon={Mail} breakAll>
              {getEmail(employee)}
            </DetailLine>
            <DetailLine icon={Phone}>{getContact(employee)}</DetailLine>
          </div>
        </div>

        <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
            HR Metadata
          </p>
          <div className="mt-1 space-y-1 text-[11px] font-semibold text-[#667085]">
            <p>Gender: {getGender(employee)}</p>
            <p>Civil: {getCivilStatus(employee)}</p>
            <p>Hired: {formatCompactDate(getHireDate(employee))}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function EmployeeTable({
  tabs = defaultDirectoryTabs,
  activeTab = "Employees",
  onTabChange,
}) {
  const { user } = useUser();
  const navigate = useNavigate();
  const showEmployeeFilters = canViewEmployeeFilters(user);

  const tableScrollRef = useRef(null);
  const mobileScrollRef = useRef(null);
  const loadedDepartmentOptionsRef = useRef(false);
  const loadedAccountOptionsKeyRef = useRef("");

  const [employees, setEmployees] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [accountFilter, setAccountFilter] = useState("All");
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [accountOptions, setAccountOptions] = useState([]);

  const {
    page = 1,
    setPage,
    search = "",
    searchInput = "",
    setSearch,
    setSearchInput,
    commitSearch,
    handleSearchKeyDown,
    loading,
    setLoading,
    pagination,
    setPagination,
  } = usePagination(ENTITY);

  const safePagination = useMemo(
    () => ({
      currentPage: Number(pagination?.currentPage || page || 1),
      totalPages: Math.max(Number(pagination?.totalPages || 1), 1),
      total: Number(pagination?.total || 0),
      limit: Number(pagination?.limit || PAGE_LIMIT),
    }),
    [page, pagination],
  );

  const currentPage = safePagination.currentPage;
  const totalPages = safePagination.totalPages;
  const totalRecords = safePagination.total;

  const departmentDropdownOptions = useMemo(() => {
    return (Array.isArray(departmentOptions) ? departmentOptions : [])
      .map(normalizeDepartmentOption)
      .filter((option) => option.value && option.label)
      .sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }, [departmentOptions]);

  const accountDropdownOptions = useMemo(() => {
    const backendOptions = (Array.isArray(accountOptions) ? accountOptions : [])
      .map(normalizeAccountOption)
      .filter((option) => option.value && option.label);

    const loadedOptions = employees
      .map((employee) => getAccount(employee))
      .filter((account) => account && account !== "Unassigned")
      .map((account) => ({ label: account, value: account }));

    const optionMap = new Map();

    [...backendOptions, ...loadedOptions].forEach((option) => {
      if (!option.value) return;
      optionMap.set(option.value, option);
    });

    return [...optionMap.values()].sort((a, b) =>
      String(a.label).localeCompare(String(b.label)),
    );
  }, [accountOptions, employees]);

  useEffect(() => {
    if (showEmployeeFilters) return;

    setDepartmentFilter("All");
    setAccountFilter("All");
    setDepartmentOptions([]);
    setAccountOptions([]);
    loadedDepartmentOptionsRef.current = false;
    loadedAccountOptionsKeyRef.current = "";
  }, [showEmployeeFilters]);

  useEffect(() => {
    let cancelled = false;

    async function loadEmployees() {
      try {
        setLoading?.(true);

        const accountOptionsKey = `${departmentFilter || "All"}`;
        const shouldLoadDepartments =
          showEmployeeFilters && !loadedDepartmentOptionsRef.current;
        const shouldLoadAccounts =
          showEmployeeFilters &&
          loadedAccountOptionsKeyRef.current !== accountOptionsKey;

        const result = await getEmployee(
          page,
          search,
          showEmployeeFilters ? accountFilter : "All",
          {
            department: showEmployeeFilters ? departmentFilter : "All",
            includeDepartments: shouldLoadDepartments,
            includeAccounts: shouldLoadAccounts,
          },
        );

        if (cancelled) return;

        if (!result?.success) {
          if (result?.status === 401) {
            navigate("/login");
            return;
          }

          setEmployees([]);
          setPagination?.({
            currentPage: 1,
            totalPages: 1,
            total: 0,
            limit: PAGE_LIMIT,
          });
          return;
        }

        const records = Array.isArray(result.data) ? result.data : [];
        setEmployees(records);

        if (
          showEmployeeFilters &&
          shouldLoadDepartments &&
          Array.isArray(result.departmentOptions)
        ) {
          setDepartmentOptions(result.departmentOptions);
          loadedDepartmentOptionsRef.current = true;
        }

        if (
          showEmployeeFilters &&
          shouldLoadAccounts &&
          Array.isArray(result.accountOptions)
        ) {
          setAccountOptions(result.accountOptions);
          loadedAccountOptionsKeyRef.current = accountOptionsKey;
        }

        setPagination?.({
          ...(result.pagination || {}),
          total: Number(result.pagination?.total || records.length || 0),
          currentPage: Number(result.pagination?.currentPage || page || 1),
          totalPages: Math.max(Number(result.pagination?.totalPages || 1), 1),
          limit: Number(result.pagination?.limit || PAGE_LIMIT),
        });
      } catch (error) {
        if (cancelled) return;

        console.error("Employee directory load error:", error);
        setEmployees([]);
        setPagination?.({
          currentPage: 1,
          totalPages: 1,
          total: 0,
          limit: PAGE_LIMIT,
        });
      } finally {
        if (!cancelled) {
          setLoading?.(false);
        }
      }
    }

    loadEmployees();

    return () => {
      cancelled = true;
    };
  }, [
    accountFilter,
    departmentFilter,
    navigate,
    page,
    search,
    setLoading,
    setPagination,
    showEmployeeFilters,
  ]);

  useEffect(() => {
    tableScrollRef.current?.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });

    mobileScrollRef.current?.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, [accountFilter, currentPage, departmentFilter, search]);

  function goToEmployee(employee) {
    const sibsId = getSibsId(employee);

    try {
      if (sibsId) {
        sessionStorage.setItem("selectedEmployeeId", sibsId);
      }
    } catch (error) {
      console.error("Unable to save selected employee:", error);
    }

    navigate("/employee/employee-data", {
      state: {
        employee,
        sibsId,
      },
    });
  }

  function submitSearch() {
    setPage?.(1);

    if (typeof commitSearch === "function") {
      commitSearch();
      return;
    }

    setSearch?.(searchInput);
  }

  function handleEmployeeSearchKeyDown(event) {
    if (typeof handleSearchKeyDown === "function") {
      handleSearchKeyDown(event);
    }

    if (event.key === "Enter") {
      event.preventDefault();
      submitSearch();
    }
  }

  function resetToFirstPage() {
    setPage?.(1);
  }

  function handleDepartmentChange(value) {
    setDepartmentFilter(value);
    setAccountFilter("All");
    setAccountOptions([]);
    loadedAccountOptionsKeyRef.current = "";
    resetToFirstPage();
  }

  function handleAccountChange(value) {
    setAccountFilter(value);
    resetToFirstPage();
  }

  function handleRowKeyDown(event, employee) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToEmployee(employee);
    }
  }

  return (
    <div className="flex h-full min-h-[520px] min-w-0 flex-col bg-white font-jakarta">
      <div className="relative overflow-visible p-4 sm:p-5">
        <PaginationTable
          filterLayout="ta-inline"
          showFilterPanel={false}
          showFilterHeader={false}
          showPagination={false}
          loading={loading}
          searchValue={searchInput}
          searchPlaceholder="Search by employee, SIBS ID, department, or account..."
          onSearchChange={(value) => setSearchInput?.(value)}
          onSearchKeyDown={handleEmployeeSearchKeyDown}
          dropdownFilters={
            showEmployeeFilters
              ? [
                  {
                    key: "department",
                    value: departmentFilter,
                    options: departmentDropdownOptions,
                    onChange: handleDepartmentChange,
                    includeAll: true,
                    allLabel: "All Departments",
                    label: "Department",
                    placeholder: "Search departments...",
                    searchable: true,
                  },
                  {
                    key: "account",
                    value: accountFilter,
                    options: accountDropdownOptions,
                    onChange: handleAccountChange,
                    includeAll: true,
                    allLabel: "All Accounts",
                    label: "Account",
                    placeholder: "Search accounts...",
                    searchable: true,
                  },
                ]
              : []
          }
          className="border-0 bg-transparent p-0 shadow-none"
        />
      </div>

      <div className="min-h-0 flex-1 px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
        {tabs.length > 1 ? (
          <div className="mb-0 overflow-hidden rounded-t-xl border border-b-0 border-[#E6ECF2] bg-white">
            <div className="flex overflow-x-auto border-b border-[#E6ECF2] bg-[#F8FAFC] px-3 pt-3 no-scrollbar sm:px-4">
              {tabs.map((tab) => {
                const TabIcon = tab.icon || UserRoundCheck;
                const isActive = activeTab === tab.label;

                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => onTabChange?.(tab.label)}
                    className={`inline-flex h-10 shrink-0 items-center gap-2 border-b-2 px-4 text-[10px] font-extrabold uppercase tracking-wide transition ${
                      isActive
                        ? "rounded-t-xl border-[#FF5C28] bg-white text-[#042C51]"
                        : "border-transparent text-[#667085] hover:text-[#042C51]"
                    }`}
                  >
                    <TabIcon size={15} className="shrink-0" />
                    <span className="truncate">{tab.label}</span>

                    {Number(tab.count || 0) > 0 ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold tabular-nums ${
                          isActive
                            ? "bg-[#042C51] text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {tab.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div ref={mobileScrollRef} className="lg:hidden">
          {loading ? (
            <EmptyState loading />
          ) : employees.length === 0 ? (
            <EmptyState loading={false} />
          ) : (
            <div className="space-y-3">
              {employees.map((employee, index) => (
                <MobileEmployeeCard
                  key={getSibsId(employee) || `${getEmployeeName(employee)}-${index}`}
                  employee={employee}
                  onOpen={goToEmployee}
                />
              ))}
            </div>
          )}
        </div>

        <div
          className={`hidden overflow-hidden border border-[#E6ECF2] bg-white lg:block ${
            tabs.length > 1 ? "rounded-b-xl border-t-0" : "rounded-xl"
          }`}
        >
          <div ref={tableScrollRef} className="max-h-[670px] overflow-auto">
            <table className="w-full min-w-[1180px] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                <tr className="border-b border-[#E6ECF2]">
                  {columns.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#7B8DB3]"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#EEF2F6]">
                {loading ? (
                  Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                    <tr key={`employee-skeleton-${index}`}>
                      <td colSpan={columns.length} className="px-4 py-4">
                        <div className="h-7 w-full animate-sibs-pulse rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length}>
                      <EmptyState loading={false} />
                    </td>
                  </tr>
                ) : (
                  employees.map((employee, index) => {
                    const preferredName = getPreferredName(employee);

                    return (
                      <tr
                        key={getSibsId(employee) || `${getEmployeeName(employee)}-${index}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => goToEmployee(employee)}
                        onKeyDown={(event) => handleRowKeyDown(event, employee)}
                        aria-label={`Open employee profile for ${getEmployeeName(employee)}`}
                        className="group cursor-pointer transition-colors hover:bg-[#FFF9F6] focus-visible:bg-[#FFF9F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF5C28]/30"
                      >
                        <td className="whitespace-nowrap px-4 py-4 align-middle text-xs font-extrabold text-[#FF5C28]">
                          {getSibsId(employee) || "N/A"}
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="flex min-w-[230px] items-center gap-3">
                            <EmployeeAvatar employee={employee} />

                            <div className="min-w-0">
                              <p className="break-words text-xs font-extrabold leading-tight text-[#042C51] transition-colors group-hover:text-[#FF5C28]">
                                {getEmployeeName(employee)}
                              </p>

                              {preferredName ? (
                                <p className="mt-1 text-[10px] font-semibold text-[#8A98B8]">
                                  Preferred: {preferredName}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="min-w-[170px]">
                            <span className="inline-flex max-w-full rounded border border-blue-100 bg-[#EFF6FF] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#042C51]">
                              <span className="truncate">{getAccount(employee)}</span>
                            </span>

                            <div className="mt-1">
                              <DetailLine icon={MapPin}>{getAssignedSite(employee)}</DetailLine>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="min-w-[210px]">
                            <p className="break-words text-xs font-extrabold leading-tight text-[#042C51]">
                              {getPosition(employee)}
                            </p>
                            <div className="mt-1">
                              <DetailLine icon={Briefcase}>{getDepartment(employee)}</DetailLine>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="min-w-[250px] space-y-1">
                            <DetailLine icon={Mail} breakAll>
                              {getEmail(employee)}
                            </DetailLine>
                            <DetailLine icon={Phone}>{getContact(employee)}</DetailLine>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="min-w-[135px] space-y-0.5 text-[10px] font-semibold leading-4 text-[#7B8DB3]">
                            <p>Gender: {getGender(employee)}</p>
                            <p>Civil: {getCivilStatus(employee)}</p>
                            <p>
                              Hired:{" "}
                              <span className="font-extrabold text-[#536887]">
                                {formatCompactDate(getHireDate(employee))}
                              </span>
                            </p>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="shrink-0 px-4 pb-4 sm:px-5 sm:pb-5">
        <PaginationTable
          loading={loading}
          showSearch={false}
          currentPage={currentPage}
          totalPages={totalPages}
          loadedCount={employees.length}
          totalRecords={totalRecords}
          recordLabel="employee records"
          onPrevious={() => setPage?.(Math.max(currentPage - 1, 1))}
          onNext={() => setPage?.(Math.min(currentPage + 1, totalPages))}
          showCount
          className="border-0 bg-transparent p-0 shadow-none"
        />
      </div>
    </div>
  );
}
