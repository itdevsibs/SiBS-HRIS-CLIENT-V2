import { useEffect, useRef, useState } from "react";
import {
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

const animationTiming = {
  header: 0,

  summaryCardBase: 0,
  summaryCardStagger: 60,

  tabs: 90,
  table: 150,
};

function getAnimationStyle(delay = 0) {
  return {
    animationDelay: `${delay}ms`,
    animationFillMode: "both",
  };
}

function SummaryCard({ label, value, icon: Icon, delay = 0 }) {
  return (
    <div
      className="sibs-page-card-in flex min-w-0 items-center gap-4 rounded-xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={getAnimationStyle(delay)}
    >
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
  const { setSearch, setSearchInput, setPage } = usePagination("employees");

  const [activeEmployeeTab, setActiveEmployeeTab] = useState("Employees");

  const restoredRef = useRef(false);
  const mainScrollRef = useRef(null);

  const employeeTabs = [
    { label: "Employees", count: 0 },
    { label: "Access Requests", count: 5 },
    { label: "CHWCP", count: 2 },
  ];

  const activeTabIndex = Math.max(
    0,
    employeeTabs.findIndex((tab) => tab.label === activeEmployeeTab),
  );

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

  function renderActiveTable() {
    if (activeEmployeeTab === "Employees") {
      return (
        <section className="min-w-0 overflow-hidden rounded-xl bg-white shadow-sm">
          <EmployeeTable />
        </section>
      );
    }

    if (activeEmployeeTab === "Access Requests") {
      return (
        <section className="min-w-0 overflow-hidden rounded-xl bg-white shadow-sm">
          <AccessRequestTable />
        </section>
      );
    }

    if (activeEmployeeTab === "CHWCP") {
      return (
        <section className="min-w-0 overflow-hidden rounded-xl bg-white shadow-sm">
          <ChwcpTable />
        </section>
      );
    }

    return null;
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main
        ref={mainScrollRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6"
      >
        <section
          className="sibs-page-header-in mb-6 min-w-0"
          style={getAnimationStyle(animationTiming.header)}
        >
          <div className="flex min-w-0 items-center gap-2">
            <Users
              size={28}
              className="shrink-0 text-sibs-primary-1 transition-transform duration-300 hover:scale-110"
            />

            <h1 className="m-0 min-w-0 break-words text-[28px] font-bold leading-tight tracking-[-0.9px] text-sibs-primary-1 sm:text-[32px] xl:text-[38px]">
              Employees
            </h1>
          </div>

          <p className="mt-1 text-sm font-normal text-sibs-tertiary-5">
            Manage employees, access requests, and CHWCP records
          </p>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            label="Employees"
            value="0"
            icon={UserRoundCheck}
            delay={
              animationTiming.summaryCardBase +
              0 * animationTiming.summaryCardStagger
            }
          />

          <SummaryCard
            label="Access Requests"
            value="5"
            icon={ShieldCheck}
            delay={
              animationTiming.summaryCardBase +
              1 * animationTiming.summaryCardStagger
            }
          />

          <SummaryCard
            label="CHWCP"
            value="2"
            icon={FileCheck2}
            delay={
              animationTiming.summaryCardBase +
              2 * animationTiming.summaryCardStagger
            }
          />
        </section>

        <section
          className="sibs-page-card-in mb-6 min-w-0"
          style={getAnimationStyle(animationTiming.tabs)}
        >
          <div className="min-w-0 overflow-x-auto no-scrollbar">
            <div
              className="relative grid min-w-[520px] overflow-hidden rounded-full bg-[#f2f4f7] p-1 shadow-sm sm:w-max"
              style={{
                gridTemplateColumns: `repeat(${employeeTabs.length}, minmax(0, 1fr))`,
              }}
            >
              <div
                className="absolute bottom-1 top-1 rounded-full bg-sibs-primary-1 shadow-sm transition-all duration-300 ease-out"
                style={{
                  width: `calc((100% - 8px) / ${employeeTabs.length})`,
                  left: `calc(4px + ${activeTabIndex} * ((100% - 8px) / ${employeeTabs.length}))`,
                }}
              />

              {employeeTabs.map(({ label, count }) => {
                const isActive = activeEmployeeTab === label;

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setActiveEmployeeTab(label)}
                    className={`relative z-[1] inline-flex min-h-11 min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-medium transition-all duration-300 ease-out active:scale-[0.97] ${
                      isActive
                        ? "text-white"
                        : "text-[#344054] hover:bg-white/70 hover:text-sibs-primary-1"
                    }`}
                  >
                    <span className="truncate">{label}</span>

                    {label !== "Employees" && count > 0 && (
                      <span
                        className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none shadow-sm transition-all duration-300 ${
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
        </section>

        <div
          key={activeEmployeeTab}
          className="sibs-profile-tab-panel"
          style={getAnimationStyle(animationTiming.table)}
        >
          {renderActiveTable()}
        </div>
      </main>
    </div>
  );
}