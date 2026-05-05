import { useEffect, useRef, useState } from "react";
import {
  Search,
  Users,
  UserRoundCheck,
  ShieldCheck,
  FileCheck2,
} from "lucide-react";

import Header from "../../components/layout/Header";
import { usePagination } from "@/services/context/PaginationContext";
import EmployeeTable from "../../components/tables/employees/EmployeeTable";
import AccessRequestTable from "../../components/tables/employees/AccessRequestTable";
import ChwcpTable from "../../components/tables/employees/ChwcpTable";

const EMPLOYEE_STATE_KEY = "employeePageState";

function SummaryCard({ label, value, icon: Icon }) {
  return (
    <div className="employee-summary-card">
      <div className="employee-summary-icon">
        <Icon size={18} />
      </div>

      <div className="employee-summary-text">
        <p>{label}</p>
        <h2>{value}</h2>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const {
    searchInput,
    setSearch,
    setSearchInput,
    handleSearchKeyDown,
    setPage,
  } = usePagination("employees");

  const [activeEmployeeTab, setActiveEmployeeTab] = useState("Employees");

  const restoredRef = useRef(false);
  const mainScrollRef = useRef(null);

  const employeeTabs = [
    { label: "Employees", count: 0 },
    { label: "Access Requests", count: 5 },
    { label: "CHWCP", count: 2 },
  ];

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    try {
      const savedState = sessionStorage.getItem(EMPLOYEE_STATE_KEY);

      if (savedState) {
        const parsed = JSON.parse(savedState);

        if (parsed?.page) {
          setPage(parsed.page);
        }
      }

      setSearch("");
      setSearchInput("");
    } catch (err) {
      console.error("State restore error:", err);
    }
  }, [setPage, setSearch, setSearchInput]);

  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [activeEmployeeTab]);

  return (
    <div className="employee-page">
      <Header />

      <main ref={mainScrollRef} className="employee-main">
        <section className="employee-heading">
          <div className="employee-title-row">
            <Users size={28} className="employee-title-icon" />

            <h1>Employees</h1>
          </div>

          <p>Manage employees, access requests, and CHWCP records</p>
        </section>

        <section className="employee-summary-grid">
          <SummaryCard label="Employees" value="0" icon={UserRoundCheck} />
          <SummaryCard label="Access Requests" value="5" icon={ShieldCheck} />
          <SummaryCard label="CHWCP" value="2" icon={FileCheck2} />
        </section>

        <section className="employee-toolbar">
          <div className="employee-tabs-scroll no-scrollbar">
            <div className="employee-tabs">
              {employeeTabs.map(({ label, count }) => {
                const isActive = activeEmployeeTab === label;

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setActiveEmployeeTab(label)}
                    className={`employee-tab-button ${isActive ? "active" : ""}`}
                  >
                    <span>{label}</span>

                    {label !== "Employees" && count > 0 && (
                      <span
                        className={`employee-tab-count ${
                          isActive ? "active" : ""
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {activeEmployeeTab === "Employees" && (
            <div className="employee-search-wrap">
              <Search size={18} className="employee-search-icon" />

              <input
                type="text"
                placeholder="Search employees..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="employee-search-input"
              />
            </div>
          )}
        </section>

        {activeEmployeeTab === "Employees" && (
          <section className="employee-table-card">
            <EmployeeTable />
          </section>
        )}

        {activeEmployeeTab === "Access Requests" && (
          <section className="employee-table-card">
            <AccessRequestTable />
          </section>
        )}

        {activeEmployeeTab === "CHWCP" && (
          <section className="employee-table-card">
            <ChwcpTable />
          </section>
        )}
      </main>
    </div>
  );
}