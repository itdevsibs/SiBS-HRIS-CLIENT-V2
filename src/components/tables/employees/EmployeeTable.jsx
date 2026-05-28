import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  Briefcase,
  Building2,
  CalendarDays,
  UserRound,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { getEmployee } from "../../../lib/axios/getEmployee";
import { formatDate } from "../../../lib/axios/dateFormatter";
import { usePagination } from "@/services/context/PaginationContext";

const EMPLOYEE_STATE_KEY = "employeePageState";
const PAGE_LIMIT = 15;

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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
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
  const [employees, setEmployees] = useState([]);
  const [isDraggingTable, setIsDraggingTable] = useState(false);

  const paginationContext = usePagination("employees");

  const {
    page = 1,
    search = "",
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

  useEffect(() => {
    navigateRef.current = navigate;
    setLoadingRef.current = setLoading;
    setPaginationRef.current = setPagination;
  }, [navigate, setLoading, setPagination]);

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
  }, [page]);

  useEffect(() => {
    let cancelled = false;

    const fetchEmployees = async () => {
      try {
        setLoadingRef.current?.(true);

        const result = await getEmployee(page, search);

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
    };

    fetchEmployees();

    return () => {
      cancelled = true;
    };
  }, [page, search]);

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
    if (loading || currentPage <= 1) return;
    goToPage(currentPage - 1);
  }

  function handleNextPage() {
    if (loading || currentPage >= totalPages) return;
    goToPage(currentPage + 1);
  }

  function handleDragStart(e) {
    if (e.button !== 0) return;

    const target = e.target;
    const isInteractiveElement = target.closest(
      "button, a, input, select, textarea",
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
            <table className="w-full min-w-[1550px] border-collapse bg-white">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    SiBS ID
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

              <tbody key={`${page}-${search}-${loading}`}>
                {loading ? (
                  Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                    <tr key={index}>
                      <td
                        colSpan={11}
                        className="border-t border-[#f3f4f6] px-5 py-4"
                      >
                        <div className="h-5 w-full animate-sibs-pulse rounded bg-gray-200" />
                      </td>
                    </tr>
                  ))
                ) : employees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
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
          <div
            ref={mobileScrollRef}
            className="max-h-[670px] overflow-y-auto"
          >
            {loading ? (
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-6 text-center text-sm font-bold text-gray-500">
                Loading...
              </div>
            ) : employees.length === 0 ? (
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-6 text-center text-sm font-bold text-gray-500">
                No employees found.
              </div>
            ) : (
              <div key={`${page}-${search}`} className="flex flex-col gap-3">
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

        <div className="mt-5 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
          <p className="m-0 text-sm font-semibold text-sibs-tertiary-5">
            Showing {employees.length} loaded employee records
            {totalRecords > 0 ? ` out of ${totalRecords}` : ""}
          </p>

          <div className="flex items-center gap-2 max-sm:justify-center">
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={handlePreviousPage}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className="inline-flex h-10 items-center justify-center rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-[#344054]">
              Page {currentPage}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={handleNextPage}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}