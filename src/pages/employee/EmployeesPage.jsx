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
    <div className="flex min-w-0 items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-sibs-primary-1 text-white">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="m-0 text-xs font-normal text-sibs-tertiary-5">
          {label}
        </p>

        <h2 className="m-0 text-xl font-bold leading-tight text-sibs-primary-1">
          {value}
        </h2>
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
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main
        ref={mainScrollRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6"
      >
        <section className="mb-6 min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <Users size={28} className="shrink-0 text-sibs-primary-1" />

            <h1 className="m-0 min-w-0 break-words text-[28px] font-extrabold leading-tight tracking-[-0.9px] text-sibs-primary-1 sm:text-[32px] xl:text-[38px]">
              Employees
            </h1>
          </div>

          <p className="mt-1 text-sm font-normal text-sibs-tertiary-5">
            Manage employees, access requests, and CHWCP records
          </p>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard label="Employees" value="0" icon={UserRoundCheck} />
          <SummaryCard label="Access Requests" value="5" icon={ShieldCheck} />
          <SummaryCard label="CHWCP" value="2" icon={FileCheck2} />
        </section>

        <section className="mb-6 grid min-w-0 grid-cols-1 items-center gap-4 lg:grid-cols-[1fr_auto]">
          <div className="min-w-0 overflow-x-auto no-scrollbar">
            <div className="inline-flex w-max gap-2 rounded-full bg-[#f2f4f7] p-1 shadow-sm">
              {employeeTabs.map(({ label, count }) => {
                const isActive = activeEmployeeTab === label;

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setActiveEmployeeTab(label)}
                    className={`inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-medium transition ${
                      isActive
                        ? "bg-sibs-primary-1 text-white shadow-sm"
                        : "bg-transparent text-[#344054] hover:bg-white/70"
                    }`}
                  >
                    <span>{label}</span>

                    {label !== "Employees" && count > 0 && (
                      <span
                        className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none shadow-sm ${
                          isActive
                            ? "bg-white text-sibs-primary-1"
                            : "bg-sibs-primary-1 text-white"
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
            <div className="relative w-full shrink-0 lg:w-80">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
              />

              <input
                type="text"
                placeholder="Search employees..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="h-11 w-full rounded-full border border-[#e6ecf2] bg-white px-4 pl-11 text-sm font-normal text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              />
            </div>
          )}
        </section>

        {activeEmployeeTab === "Employees" && (
          <section className="min-w-0 overflow-hidden rounded-xl bg-white shadow-sm">
            <EmployeeTable />
          </section>
        )}

        {activeEmployeeTab === "Access Requests" && (
          <section className="min-w-0 overflow-hidden rounded-xl bg-white shadow-sm">
            <AccessRequestTable />
          </section>
        )}

        {activeEmployeeTab === "CHWCP" && (
          <section className="min-w-0 overflow-hidden rounded-xl bg-white shadow-sm">
            <ChwcpTable />
          </section>
        )}
      </main>
    </div>
  );
}