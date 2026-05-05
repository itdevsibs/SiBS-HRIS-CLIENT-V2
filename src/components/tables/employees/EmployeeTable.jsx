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
    <div className="employee-mobile-info-item">
      <div className="employee-mobile-info-row">
        <Icon size={14} className="employee-mobile-info-icon" />

        <div className="employee-mobile-info-text">
          <p>{label}</p>
          <strong>{value || "N/A"}</strong>
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
      className="employee-mobile-card"
    >
      <div className="employee-mobile-card-heading">
        <p>{emp.sibsId || "N/A"}</p>
        <h3>{fullName || "N/A"}</h3>
      </div>

      <div className="employee-mobile-card-body">
        <MobileInfoItem icon={Mail} label="Email" value={emp.email} />

        <div className="employee-mobile-info-grid">
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

  const routerRef = useRef(router);
  const setLoadingRef = useRef(setLoading);
  const setPaginationRef = useRef(setPagination);

  useEffect(() => {
    routerRef.current = router;
    setLoadingRef.current = setLoading;
    setPaginationRef.current = setPagination;
  }, [router, setLoading, setPagination]);

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
        setLoadingRef.current?.(true);

        const result = await getEmployee(page, search);

        if (cancelled) return;

        if (!result?.success) {
          if (result?.status === 401) {
            navigate("/login");
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
  }, [page, search, navigate, setLoading, setPagination]);

  const handleOpenEmployee = (emp) => {
    sessionStorage.setItem("selectedEmployeeId", emp.sibsId);
    sessionStorage.setItem(EMPLOYEE_STATE_KEY, JSON.stringify({ page: 1 }));
    navigate("/employee/employee-data");
  };

  return (
    <div className="employee-table">
      <div className="employee-table-desktop">
        <div ref={tableScrollRef} className="employee-table-scroll">
          <table className="employee-table-main">
            <thead>
              <tr>
                <th>SiBS ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Gender</th>
                <th>Birthdate</th>
                <th>Civil Status</th>
                <th>Account</th>
                <th>Department</th>
                <th>Contact</th>
                <th>Hire Date</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="employee-table-empty">
                    Loading...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="10" className="employee-table-empty">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((emp, index) => (
                  <tr
                    key={emp.sibsId || index}
                    onClick={() => handleOpenEmployee(emp)}
                    className="employee-table-row"
                  >
                    <td>{emp.sibsId}</td>

                    <td className="employee-name-cell">
                      {[emp.firstName, emp.middleName, emp.lastName]
                        .filter(Boolean)
                        .join(" ")
                        .toUpperCase()}
                    </td>

                    <td>{emp.email}</td>
                    <td>{emp.gender}</td>
                    <td>{formatDate(emp.birthdate)}</td>
                    <td>{emp.civilStatus}</td>
                    <td>{emp.account}</td>
                    <td>{emp.department || "N/A"}</td>
                    <td>{emp.contact}</td>
                    <td>{formatDate(emp.hireDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="employee-table-mobile">
        <div ref={tableScrollRef} className="employee-mobile-scroll">
          {loading ? (
            <div className="employee-mobile-empty">Loading...</div>
          ) : employees.length === 0 ? (
            <div className="employee-mobile-empty">No employees found</div>
          ) : (
            <div className="employee-mobile-list">
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
