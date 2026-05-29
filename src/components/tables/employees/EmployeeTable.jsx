import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  Briefcase,
  Building2,
  CalendarDays,
  UserRound,
  MapPin,
} from "lucide-react";

import { getEmployee } from "../../../lib/axios/getEmployee";
import { formatDate } from "../../../lib/axios/dateFormatter";
import { usePagination } from "@/services/context/PaginationContext";
import PaginationTable from "@/services/pagination/PaginationTable";
import { useUser } from "../../../services/context/UserContext";

const EMPLOYEE_STATE_KEY = "employeePageState";
const PAGE_LIMIT = 15;
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

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

function formatEmployeeName(emp) {
  const lastName = String(emp?.lastName || emp?.gy_emp_lname || "").trim();
  const firstName = String(emp?.firstName || emp?.gy_emp_fname || "").trim();
  const middleName = String(emp?.middleName || emp?.gy_emp_mname || "").trim();

  if (lastName || firstName || middleName) {
    return `${lastName}${lastName && firstName ? ", " : ""}${firstName}${
      middleName ? ` ${middleName}` : ""
    }`
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }

  return (
    String(emp?.fullName || emp?.gy_emp_fullname || "")
      .trim()
      .toUpperCase() || "N/A"
  );
}

function getAccountManager(emp) {
  return (
    emp?.accountManager ||
    emp?.account_manager ||
    emp?.manager ||
    emp?.managerName ||
    emp?.accountManagerName ||
    emp?.gy_acc_manager ||
    emp?.gy_emp_om ||
    emp?.gy_emp_supervisor ||
    "N/A"
  );
}

function getProfileImageUrl(emp) {
  const directUrl =
    emp?.profilePictureUrl ||
    emp?.profile_picture_url ||
    emp?.profileUrl ||
    emp?.profile_url ||
    "";

  if (directUrl) return directUrl;

  const filename =
    emp?.profile_filename ||
    emp?.profileFilename ||
    emp?.profilePicture ||
    emp?.profile_picture ||
    "";

  if (!filename) return "";

  if (String(filename).startsWith("http")) return filename;

  return `${API_URL}/api/employee-profile/file/${encodeURIComponent(filename)}`;
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
      option?.label ||
      option?.name_department ||
      option?.departmentName ||
      option?.name ||
      "N/A",
    value: String(
      option?.value ||
        option?.id_department ||
        option?.departmentId ||
        option?.id ||
        "",
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
    label: option?.label || option?.account || option?.gy_acc_name || "N/A",
    value: String(option?.value || option?.account || option?.gy_acc_name || ""),
  };
}

function getAssignedSite(emp) {
  const value =
    emp?.site ??
    emp?.assignedSite ??
    emp?.location ??
    emp?.gy_assignedloc ??
    emp?.assigned_loc ??
    "";

  const raw = String(value ?? "").trim();

  if (!raw) return "N/A";

  if (raw === "0") return "Tagum";
  if (raw === "1") return "Davao";
  if (raw === "2") return "Both Tagum and Davao";
  if (raw === "3") return "Hybrid";

  return raw;
}

function ProfileAvatar({ emp, size = "md" }) {
  const imageUrl = getProfileImageUrl(emp);

  const sizeClass =
    size === "lg"
      ? "h-12 w-12"
      : size === "sm"
        ? "h-9 w-9"
        : "h-10 w-10";

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D9E2EC] bg-[#F2F6FA] shadow-sm`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Profile"
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const fallback = e.currentTarget.nextElementSibling;
            if (fallback) fallback.style.display = "flex";
          }}
        />
      ) : null}

      <div
        className="flex h-full w-full items-center justify-center text-sibs-primary-1"
        style={{ display: imageUrl ? "none" : "flex" }}
      >
        <UserRound size={size === "lg" ? 24 : 20} />
      </div>
    </div>
  );
}

function MobileInfoItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-slate-50 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">
      <div className="flex items-start gap-2">
        <Icon size={14} className="mt-0.5 shrink-0 text-sibs-tertiary-5" />

        <div className="min-w-0">
          <p className="m-0 text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
            {label}
          </p>

          <strong className="mt-1 block break-words text-sm font-bold leading-snug text-sibs-primary-1">
            {value || "N/A"}
          </strong>
        </div>
      </div>
    </div>
  );
}

function MobileEmployeeCard({ emp, onOpen }) {
  const fullName = formatEmployeeName(emp);

  return (
    <button
      type="button"
      onClick={() => onOpen(emp)}
      className="sibs-page-card-in block w-full cursor-pointer rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <ProfileAvatar emp={emp} size="lg" />

        <div className="min-w-0 flex-1">
          <p className="m-0 text-xs font-semibold text-sibs-tertiary-5">
            {emp.sibsId || "N/A"}
          </p>

          <h3 className="mt-1 text-sm font-bold leading-tight text-sibs-primary-1">
            {fullName}
          </h3>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <MobileInfoItem icon={Mail} label="Email" value={emp.email} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MobileInfoItem icon={UserRound} label="Gender" value={emp.gender} />

          <MobileInfoItem
            icon={CalendarDays}
            label="Birthdate"
            value={formatDate(emp.birthdate)}
          />

          <MobileInfoItem
            icon={Briefcase}
            label="Civil Status"
            value={emp.civilStatus}
          />

          <MobileInfoItem icon={Briefcase} label="Account" value={emp.account} />

          <MobileInfoItem
            icon={MapPin}
            label="Site"
            value={getAssignedSite(emp)}
          />

          <MobileInfoItem
            icon={UserRound}
            label="Account Manager"
            value={getAccountManager(emp)}
          />

          <MobileInfoItem
            icon={Building2}
            label="Department"
            value={emp.department || "N/A"}
          />

          <MobileInfoItem icon={Phone} label="Contact" value={emp.contact} />
        </div>

        <MobileInfoItem
          icon={CalendarDays}
          label="Hire Date"
          value={formatDate(emp.hireDate)}
        />
      </div>
    </button>
  );
}

export default function EmployeeTable() {
  const { user } = useUser();
  const showEmployeeFilters = canViewEmployeeFilters(user);

  const [employees, setEmployees] = useState([]);
  const [isDraggingTable, setIsDraggingTable] = useState(false);

  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [accountFilter, setAccountFilter] = useState("All");

  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [accountOptions, setAccountOptions] = useState([]);

  const loadedDepartmentOptionsRef = useRef(false);
  const loadedAccountOptionsKeyRef = useRef("");

  const paginationContext = usePagination("employees");

  const {
    page = 1,
    search = "",
    searchInput = "",
    setSearchInput,
    handleSearchKeyDown,
    loading,
    setLoading,
    setPagination,
    pagination,
    setPage,
    setCurrentPage,
    handlePageChange,
  } = paginationContext;

  const navigate = useNavigate();

  const tableScrollRef = useRef(null);
  const mobileScrollRef = useRef(null);

  const dragStateRef = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  const navigateRef = useRef(navigate);
  const setLoadingRef = useRef(setLoading);
  const setPaginationRef = useRef(setPagination);

  const safePagination = pagination || {
    currentPage: page || 1,
    totalPages: 1,
    total: 0,
    limit: PAGE_LIMIT,
  };

  const currentPage = Number(safePagination.currentPage || page || 1);
  const totalPages = Number(safePagination.totalPages || 1);
  const totalRecords = Number(safePagination.total || 0);

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const departmentDropdownOptions = useMemo(() => {
    return (Array.isArray(departmentOptions) ? departmentOptions : [])
      .map(normalizeDepartmentOption)
      .filter((item) => item.value && item.label);
  }, [departmentOptions]);

  const accountDropdownOptions = useMemo(() => {
    const backendOptions = (Array.isArray(accountOptions) ? accountOptions : [])
      .map(normalizeAccountOption)
      .filter((item) => item.value && item.label);

    const loadedOptions = employees
      .map((emp) => String(emp?.account || "").trim())
      .filter(Boolean)
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
    navigateRef.current = navigate;
    setLoadingRef.current = setLoading;
    setPaginationRef.current = setPagination;
  }, [navigate, setLoading, setPagination]);

  useEffect(() => {
    if (!showEmployeeFilters) {
      if (departmentFilter !== "All") setDepartmentFilter("All");
      if (accountFilter !== "All") setAccountFilter("All");

      loadedDepartmentOptionsRef.current = false;
      loadedAccountOptionsKeyRef.current = "";
    }
  }, [showEmployeeFilters, departmentFilter, accountFilter]);

  useEffect(() => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }

    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }
  }, [page, search, departmentFilter, accountFilter]);

  useEffect(() => {
    let cancelled = false;

    async function fetchEmployees() {
      try {
        setLoadingRef.current?.(true);

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
            navigateRef.current("/login");
            return;
          }

          setEmployees([]);
          setPaginationRef.current?.({
            currentPage: 1,
            totalPages: 1,
            total: 0,
            limit: PAGE_LIMIT,
          });

          return;
        }

        setEmployees(result.data || []);

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

        setPaginationRef.current?.(
          result.pagination || {
            currentPage: page,
            totalPages: 1,
            total: result.data?.length || 0,
            limit: PAGE_LIMIT,
          },
        );
      } catch (err) {
        if (cancelled) return;

        console.error("Fetch employees error:", err);

        setEmployees([]);
        setPaginationRef.current?.({
          currentPage: 1,
          totalPages: 1,
          total: 0,
          limit: PAGE_LIMIT,
        });
      } finally {
        if (!cancelled) {
          setLoadingRef.current?.(false);
        }
      }
    }

    fetchEmployees();

    return () => {
      cancelled = true;
    };
  }, [page, search, departmentFilter, accountFilter, showEmployeeFilters]);

  function goToPage(nextPage) {
    const cleanPage = Math.max(Number(nextPage) || 1, 1);

    if (typeof setPage === "function") {
      setPage(cleanPage);
      return;
    }

    if (typeof setCurrentPage === "function") {
      setCurrentPage(cleanPage);
      return;
    }

    if (typeof handlePageChange === "function") {
      handlePageChange(cleanPage);
      return;
    }

    console.error(
      "Pagination context does not expose setPage, setCurrentPage, or handlePageChange.",
    );
  }

  function handlePreviousPage() {
    if (loading || !hasPreviousPage) return;
    goToPage(currentPage - 1);
  }

  function handleNextPage() {
    if (loading || !hasNextPage) return;
    goToPage(currentPage + 1);
  }

  function handleEmployeeSearchKeyDown(e) {
    if (typeof handleSearchKeyDown === "function") {
      handleSearchKeyDown(e);
    }

    if (e.key === "Enter") {
      goToPage(1);
    }
  }

  function handleDepartmentSelect(nextDepartment) {
    const cleanDepartment = nextDepartment || "All";

    setDepartmentFilter(cleanDepartment);
    setAccountFilter("All");
    setAccountOptions([]);
    loadedAccountOptionsKeyRef.current = "";

    goToPage(1);
  }

  function handleAccountSelect(nextAccount) {
    setAccountFilter(nextAccount || "All");
    goToPage(1);
  }

  function handleDragStart(e) {
    if (e.button !== 0) return;

    const target = e.target;
    const isInteractiveElement = target.closest(
      "button, a, input, select, textarea, [data-no-table-drag='true']",
    );

    if (isInteractiveElement) return;

    const container = tableScrollRef.current;
    if (!container) return;

    dragStateRef.current = {
      isDown: true,
      startX: e.pageX - container.offsetLeft,
      scrollLeft: container.scrollLeft,
      moved: false,
    };

    setIsDraggingTable(true);
  }

  function handleDragMove(e) {
    const container = tableScrollRef.current;
    const dragState = dragStateRef.current;

    if (!dragState.isDown || !container) return;

    e.preventDefault();

    const x = e.pageX - container.offsetLeft;
    const walk = (x - dragState.startX) * 1.4;

    if (Math.abs(walk) > 4) {
      dragStateRef.current.moved = true;
    }

    container.scrollLeft = dragState.scrollLeft - walk;
  }

  function handleDragEnd() {
    dragStateRef.current.isDown = false;

    window.setTimeout(() => {
      setIsDraggingTable(false);
      dragStateRef.current.moved = false;
    }, 0);
  }

  function handleOpenEmployee(emp) {
    if (dragStateRef.current.moved) return;

    sessionStorage.setItem("selectedEmployeeId", emp.sibsId);
    sessionStorage.setItem(EMPLOYEE_STATE_KEY, JSON.stringify({ page }));

    navigate("/employee/employee-data");
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-xl bg-white">
      <div className="p-4 sm:p-5">
        <PaginationTable
          title="Employee Records"
          subtitle="Only 15 employee records are loaded from the backend per page."
          loading={loading}
          searchValue={searchInput}
          searchPlaceholder="Search employee then press Enter"
          onSearchChange={(value) => setSearchInput?.(value)}
          onSearchKeyDown={handleEmployeeSearchKeyDown}
          dropdownFilters={
            showEmployeeFilters
              ? [
                  {
                    key: "department",
                    value: departmentFilter,
                    onChange: handleDepartmentSelect,
                    options: departmentDropdownOptions,
                    allLabel: "All Departments",
                    placeholder: "Search departments...",
                    className: "sm:w-[280px]",
                    searchable: true,
                    includeAll: true,
                  },
                  {
                    key: "account",
                    value: accountFilter,
                    onChange: handleAccountSelect,
                    options: accountDropdownOptions,
                    allLabel: "All Accounts",
                    placeholder: "Search accounts...",
                    className: "sm:w-[320px]",
                    searchable: true,
                    includeAll: true,
                  },
                ]
              : []
          }
          showPagination={false}
          className="mb-5"
        />

        <div className="hidden overflow-hidden rounded-xl border border-[#E6ECF2] lg:block">
          <div
            ref={tableScrollRef}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            className={`max-h-[670px] overflow-auto select-none ${
              isDraggingTable ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            <table className="w-full min-w-[1750px] border-collapse bg-white">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    SiBS ID
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Profile
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Full Name
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Email
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Gender
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Birthdate
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Civil Status
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Account
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Site
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Account Manager
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Department
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Contact
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Hire Date
                  </th>
                </tr>
              </thead>

              <tbody
                key={`${page}-${search}-${departmentFilter}-${accountFilter}-${loading}`}
              >
                {loading ? (
                  Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                    <tr key={index}>
                      <td
                        colSpan={13}
                        className="border-t border-[#f3f4f6] px-5 py-4"
                      >
                        <div className="h-5 w-full animate-sibs-pulse rounded bg-gray-200" />
                      </td>
                    </tr>
                  ))
                ) : employees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={13}
                      className="border-t border-[#f3f4f6] p-10 text-center text-sm font-bold text-gray-500"
                    >
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp, index) => (
                    <tr
                      key={emp.sibsId || index}
                      onClick={() => handleOpenEmployee(emp)}
                      className="cursor-pointer transition-all duration-200 hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-sibs-primary-1">
                        {emp.sibsId || "N/A"}
                      </td>

                      <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4">
                        <div className="flex justify-center">
                          <ProfileAvatar emp={emp} />
                        </div>
                      </td>

                      <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-bold text-[#101828]">
                        {formatEmployeeName(emp)}
                      </td>

                      <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                        {emp.email || "N/A"}
                      </td>

                      <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                        {emp.gender || "N/A"}
                      </td>

                      <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                        {formatDate(emp.birthdate)}
                      </td>

                      <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                        {emp.civilStatus || "N/A"}
                      </td>

                      <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                        {emp.account || "N/A"}
                      </td>

                      <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                        {getAssignedSite(emp)}
                      </td>

                      <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                        {getAccountManager(emp)}
                      </td>

                      <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                        {emp.department || "N/A"}
                      </td>

                      <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                        {emp.contact || "N/A"}
                      </td>

                      <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                        {formatDate(emp.hireDate)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
            Hold left click and drag left or right to scroll the table.
          </p>
        </div>

        <div className="block lg:hidden">
          <div ref={mobileScrollRef} className="max-h-[670px] overflow-y-auto">
            {loading ? (
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-6 text-center text-sm font-bold text-gray-500">
                Loading...
              </div>
            ) : employees.length === 0 ? (
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-6 text-center text-sm font-bold text-gray-500">
                No employees found.
              </div>
            ) : (
              <div
                key={`${page}-${search}-${departmentFilter}-${accountFilter}`}
                className="flex flex-col gap-3"
              >
                {employees.map((emp, index) => (
                  <MobileEmployeeCard
                    key={emp.sibsId || index}
                    emp={emp}
                    onOpen={handleOpenEmployee}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <PaginationTable
          loading={loading}
          showSearch={false}
          showPagination
          currentPage={currentPage}
          totalPages={totalPages}
          loadedCount={employees.length}
          totalRecords={totalRecords}
          recordLabel="employee records"
          onPrevious={handlePreviousPage}
          onNext={handleNextPage}
        />
      </div>
    </div>
  );
}