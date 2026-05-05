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
    <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--sibs-primary-1)] text-white">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-sibs-tertiary-5">{label}</p>
        <h2 className="text-lg font-bold text-sibs-primary-1">{value}</h2>
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
    <div className="flex-1 flex flex-col bg-[var(--sibs-tertiary-10)]">
      <Header />

      <main
        ref={mainScrollRef}
        className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6"
      >
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Users size={28} className="shrink-0 text-sibs-primary-1" />

            <h1 className="min-w-0 break-words text-2xl font-bold text-sibs-primary-1 sm:text-4xl">
              Employees
            </h1>
          </div>

          <p className="mt-1 text-sm text-sibs-tertiary-5">
            Manage employees, access requests, and CHWCP records
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard label="Employees" value="0" icon={UserRoundCheck} />
          <SummaryCard label="Access Requests" value="5" icon={ShieldCheck} />
          <SummaryCard label="CHWCP" value="2" icon={FileCheck2} />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="overflow-x-auto no-scrollbar">
            <div className="inline-flex min-w-max gap-2 rounded-full bg-[#F2F4F7] p-1 shadow-sm">
              {employeeTabs.map(({ label, count }) => {
                const isActive = activeEmployeeTab === label;

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setActiveEmployeeTab(label)}
                    className={`relative inline-flex items-center justify-center whitespace-nowrap rounded-full px-5 py-3 text-sm font-medium transition-colors duration-300 ${
                      isActive
                        ? "bg-[var(--sibs-primary-1)] text-white shadow-sm"
                        : "text-[#344054]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{label}</span>

                      {label !== "Employees" && count > 0 && (
                        <span
                          className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none shadow ${
                            isActive
                              ? "bg-white text-[var(--sibs-primary-1)]"
                              : "bg-[var(--sibs-primary-1)] text-white"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {activeEmployeeTab === "Employees" && (
            <div className="relative w-full lg:w-[320px]">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
              />

              <input
                type="text"
                placeholder="Search employees..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="search-input w-full"
              />
            </div>
          )}
        </div>

        {activeEmployeeTab === "Employees" && (
          <section className="overflow-hidden rounded-xl bg-white shadow-sm">
            <EmployeeTable />
          </section>
        )}

        {activeEmployeeTab === "Access Requests" && (
          <section className="overflow-hidden rounded-xl bg-white shadow-sm">
            <AccessRequestTable />
          </section>
        )}

        {activeEmployeeTab === "CHWCP" && (
          <section className="overflow-hidden rounded-xl bg-white shadow-sm">
            <ChwcpTable />
          </section>
        )}
      </main>
    </div>
  );
}