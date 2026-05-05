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

function MobileInfoItem({ icon: label, value }) {
  return (
    <div className="rounded-lg bg-[var(--sibs-tertiary-10)] p-3">
      <div className="flex items-start gap-2">
        <Icon size={14} className="mt-0.5 shrink-0 text-sibs-tertiary-5" />
        <div className="min-w-0">
          <p className="text-xs text-sibs-tertiary-5">{label}</p>
          <p className="mt-1 break-words text-sm font-medium text-sibs-primary-1">
            {value || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}

function MobileEmployeeCard({ emp, onOpen }) {
  const fullName = [emp.firstName, emp.middleName, emp.lastName]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  return (
    <button
      type="button"
      onClick={() => onOpen(emp)}
      className="w-full rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:bg-gray-50"
    >
      <div className="min-w-0">
        <p className="text-xs font-medium text-sibs-tertiary-5">
          {emp.sibsId || "N/A"}
        </p>
        <h3 className="mt-1 text-sm font-semibold text-sibs-primary-1">
          {fullName || "N/A"}
        </h3>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <MobileInfoItem icon={Mail} label="Email" value={emp.email} />

        <div className="grid grid-cols-2 gap-3">
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
          <MobileInfoItem
            icon={Briefcase}
            label="Account"
            value={emp.account}
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

  const { page, search, loading, setLoading, setPagination } =
    usePagination("employees");

  const navigate = useNavigate();
  const tableScrollRef = useRef(null);

  useEffect(() => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [page]);

  useEffect(() => {
    let cancelled = false;

    const fetchEmployees = async () => {
      try {
        const result = await getEmployee(page, search);

        if (cancelled) return;

        if (!result?.success) {
          if (result?.status === 401) {
            navigate("/login");
            return;
          }

          setEmployees([]);
          setPagination({
            totalPages: 1,
            currentPage: 1,
            total: 0,
          });
          return;
        }

        setEmployees(result.data || []);
        setPagination(
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
        setPagination({
          totalPages: 1,
          currentPage: 1,
          total: 0,
        });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchEmployees();

    return () => {
      cancelled = true;
    };
  }, [page, search, navigate, setLoading, setPagination]);

  const handleOpenEmployee = (emp) => {
    sessionStorage.setItem("selectedEmployeeId", emp.sibsId);
    sessionStorage.setItem(EMPLOYEE_STATE_KEY, JSON.stringify({ page: 1 }));
    navigate("/employee/employee-data");
  };

  return (
    <>
      <div className="hidden lg:block">
        <div ref={tableScrollRef} className="max-h-[670px] overflow-auto">
          <table className="w-full min-w-[1400px] text-sm">
            <thead className="sticky top-0 z-10 bg-gray-100">
              <tr>
                <th className="p-3 text-left">SiBS ID</th>
                <th className="p-3 text-left">Full Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Gender</th>
                <th className="p-3 text-left">Birthdate</th>
                <th className="p-3 text-left">Civil Status</th>
                <th className="p-3 text-left">Account</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Hire Date</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="p-6 text-center">
                    Loading...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-6 text-center">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((emp, index) => (
                  <tr
                    key={emp.sibsId || index}
                    onClick={() => handleOpenEmployee(emp)}
                    className="cursor-pointer border-t hover:bg-gray-50"
                  >
                    <td className="p-3">{emp.sibsId}</td>
                    <td className="p-3 font-medium">
                      {[emp.firstName, emp.middleName, emp.lastName]
                        .filter(Boolean)
                        .join(" ")
                        .toUpperCase()}
                    </td>
                    <td className="p-3">{emp.email}</td>
                    <td className="p-3">{emp.gender}</td>
                    <td className="p-3">{formatDate(emp.birthdate)}</td>
                    <td className="p-3">{emp.civilStatus}</td>
                    <td className="p-3">{emp.account}</td>
                    <td className="p-3">{emp.department || "N/A"}</td>
                    <td className="p-3">{emp.contact}</td>
                    <td className="p-3">{formatDate(emp.hireDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lg:hidden">
        <div ref={tableScrollRef} className="max-h-[670px] overflow-y-auto p-3">
          {loading ? (
            <div className="rounded-xl bg-white p-6 text-center text-sm">
              Loading...
            </div>
          ) : employees.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center text-sm">
              No employees found
            </div>
          ) : (
            <div className="space-y-3">
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
    </>
  );
}
