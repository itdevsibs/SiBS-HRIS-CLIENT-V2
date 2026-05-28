import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  Briefcase,
  Building2,
  CalendarDays,
  UserRound,
} from "lucide-react";

import { getEmployee } from "../../../lib/axios/getEmployee";
import { formatDate } from "../../../lib/axios/dateFormatter";
import { usePagination } from "@/services/context/PaginationContext";
import TableFooter from "../footer/TableFooter";

const EMPLOYEE_STATE_KEY = "employeePageState";

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

function MobileInfoItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[10px] bg-sibs-tertiary-10 p-3">
      <div className="flex items-start gap-2">
        <Icon size={14} className="mt-0.5 shrink-0 text-sibs-tertiary-5" />

        <div className="min-w-0">
          <p className="m-0 text-xs font-normal text-sibs-tertiary-5">
            {label}
          </p>

          <strong className="mt-1 block break-words text-sm font-medium leading-snug text-sibs-primary-1">
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
      className="block w-full cursor-pointer rounded-xl border border-[#e6ecf2] bg-white p-4 text-left shadow-sm transition hover:bg-slate-50 hover:shadow-md"
    >
      <div className="min-w-0">
        <p className="m-0 text-xs font-medium text-sibs-tertiary-5">
          {emp.sibsId || "N/A"}
        </p>

        <h3 className="mt-1 text-sm font-semibold leading-tight text-sibs-primary-1">
          {fullName}
        </h3>
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

  const { page, search, loading, setLoading, setPagination } =
    usePagination("employees");

  const navigate = useNavigate();

  const tableScrollRef = useRef(null);
  const mobileScrollRef = useRef(null);

  const navigateRef = useRef(navigate);
  const setLoadingRef = useRef(setLoading);
  const setPaginationRef = useRef(setPagination);

  useEffect(() => {
    navigateRef.current = navigate;
    setLoadingRef.current = setLoading;
    setPaginationRef.current = setPagination;
  }, [navigate, setLoading, setPagination]);

  useEffect(() => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollTo({
        top: 0,
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
            totalPages: 1,
            currentPage: 1,
            total: 0,
          });

          return;
        }

        setEmployees(result.data || []);

        setPaginationRef.current?.(
          result.pagination || {
            totalPages: 1,
            currentPage: 1,
            total: 0,
          },
        );
      } catch (err) {
        if (cancelled) return;

        console.error("Fetch employees error:", err);

        setEmployees([]);
        setPaginationRef.current?.({
          totalPages: 1,
          currentPage: 1,
          total: 0,
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

  const handleOpenEmployee = (emp) => {
    sessionStorage.setItem("selectedEmployeeId", emp.sibsId);
    sessionStorage.setItem(EMPLOYEE_STATE_KEY, JSON.stringify({ page }));
    navigate("/employee/employee-data");
  };

  return (
    <div className="min-w-0 overflow-hidden rounded-xl bg-white">
      <div className="hidden lg:block">
        <div ref={tableScrollRef} className="max-h-[670px] overflow-auto">
          <table className="w-full min-w-[1400px] border-collapse bg-white text-sm text-sibs-primary-1">
            <thead className="sticky top-0 z-10 bg-[#f3f4f6]">
              <tr>
                <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-bold text-sibs-primary-1">
                  SiBS ID
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-bold text-sibs-primary-1">
                  Full Name
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-bold text-sibs-primary-1">
                  Email
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-bold text-sibs-primary-1">
                  Gender
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-bold text-sibs-primary-1">
                  Birthdate
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-bold text-sibs-primary-1">
                  Civil Status
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-bold text-sibs-primary-1">
                  Account
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-bold text-sibs-primary-1">
                  Department
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-bold text-sibs-primary-1">
                  Contact
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-bold text-sibs-primary-1">
                  Hire Date
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="10"
                    className="p-6 text-center text-sibs-tertiary-5"
                  >
                    Loading...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="p-6 text-center text-sibs-tertiary-5"
                  >
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((emp, index) => (
                  <tr
                    key={emp.sibsId || index}
                    onClick={() => handleOpenEmployee(emp)}
                    className="cursor-pointer transition hover:bg-slate-50"
                  >
                    <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-left text-sm font-normal text-sibs-primary-1">
                      {emp.sibsId || "N/A"}
                    </td>

                    <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-left text-sm font-medium text-sibs-primary-1">
                      {formatEmployeeName(emp)}
                    </td>

                    <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-left text-sm font-normal text-sibs-primary-1">
                      {emp.email || "N/A"}
                    </td>

                    <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-left text-sm font-normal text-sibs-primary-1">
                      {emp.gender || "N/A"}
                    </td>

                    <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-left text-sm font-normal text-sibs-primary-1">
                      {formatDate(emp.birthdate)}
                    </td>

                    <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-left text-sm font-normal text-sibs-primary-1">
                      {emp.civilStatus || "N/A"}
                    </td>

                    <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-left text-sm font-normal text-sibs-primary-1">
                      {emp.account || "N/A"}
                    </td>

                    <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-left text-sm font-normal text-sibs-primary-1">
                      {emp.department || "N/A"}
                    </td>

                    <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-left text-sm font-normal text-sibs-primary-1">
                      {emp.contact || "N/A"}
                    </td>

                    <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-left text-sm font-normal text-sibs-primary-1">
                      {formatDate(emp.hireDate)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="block lg:hidden">
        <div ref={mobileScrollRef} className="max-h-[670px] overflow-y-auto p-3">
          {loading ? (
            <div className="rounded-xl bg-white p-6 text-center text-sm text-sibs-tertiary-5">
              Loading...
            </div>
          ) : employees.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center text-sm text-sibs-tertiary-5">
              No employees found
            </div>
          ) : (
            <div className="flex flex-col gap-3">
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

      <TableFooter tableEntity="employees" totalLabel="Total Employees" />
    </div>
  );
}