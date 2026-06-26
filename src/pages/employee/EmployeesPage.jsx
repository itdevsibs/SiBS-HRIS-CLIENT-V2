import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  summary: 60,
  table: 120,

  summaryCardBase: 0,
  summaryCardStagger: 60,
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
      className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md"
      style={getAnimationStyle(delay)}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
            {label}
          </p>

          <p className="mt-3 truncate text-3xl font-extrabold leading-none text-sibs-primary-1">
            {value}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const { setSearch, setSearchInput, setPage } = usePagination("employees");

  const [activeEmployeeTab, setActiveEmployeeTab] = useState("Employees");

  const restoredRef = useRef(false);
  const didMountTabRef = useRef(false);
  const mainScrollRef = useRef(null);

  const employeeTabs = [
    {
      label: "Employees",
      count: 0,
      icon: UserRoundCheck,
    },
    {
      label: "Access Requests",
      count: 5,
      icon: ShieldCheck,
    },
    {
      label: "CHWCP",
      count: 2,
      icon: FileCheck2,
    },
  ];

  const activeTabIndex = Math.max(
    0,
    employeeTabs.findIndex((tab) => tab.label === activeEmployeeTab),
  );

  function scrollToTop(behavior = "auto") {
    requestAnimationFrame(() => {
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
      }
    });
  }

  useLayoutEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    scrollToTop("auto");

    const timer = window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (restoredRef.current) return;

    restoredRef.current = true;

    try {
      const savedState = sessionStorage.getItem(EMPLOYEE_STATE_KEY);

      if (savedState) {
        const parsed = JSON.parse(savedState);

        if (parsed?.page && Number(parsed.page) > 0) {
          setPage?.(Number(parsed.page));
        }

        if (
          parsed?.activeTab &&
          ["Employees", "Access Requests", "CHWCP"].includes(parsed.activeTab)
        ) {
          setActiveEmployeeTab(parsed.activeTab);
        }
      }

      setSearch?.("");
      setSearchInput?.("");
    } catch (err) {
      console.error("State restore error:", err);
    }

    // Run only once on mount.
    // Do not add pagination setters to dependencies because they may change per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!didMountTabRef.current) {
      didMountTabRef.current = true;
      return;
    }

    scrollToTop("smooth");
  }, [activeEmployeeTab]);

  function handleTabChange(tabLabel) {
    if (tabLabel === activeEmployeeTab) return;

    setActiveEmployeeTab(tabLabel);

    try {
      sessionStorage.setItem(
        EMPLOYEE_STATE_KEY,
        JSON.stringify({
          page: 1,
          activeTab: tabLabel,
        }),
      );
    } catch (err) {
      console.error("Employee tab state save error:", err);
    }
  }

  function getTableTitle() {
    if (activeEmployeeTab === "Employees") return "Employee Records";
    if (activeEmployeeTab === "Access Requests") return "Access Requests";
    if (activeEmployeeTab === "CHWCP") return "CHWCP Records";

    return activeEmployeeTab;
  }

  function getTableSubtitle() {
    if (activeEmployeeTab === "Employees") {
      return "Only 15 employee records are loaded from the backend per page.";
    }

    if (activeEmployeeTab === "Access Requests") {
      return "Review and manage employee access requests.";
    }

    if (activeEmployeeTab === "CHWCP") {
      return "View and manage CHWCP records.";
    }

    return "";
  }

  function renderActiveTable() {
    if (activeEmployeeTab === "Employees") {
      return <EmployeeTable />;
    }

    if (activeEmployeeTab === "Access Requests") {
      return <AccessRequestTable />;
    }

    if (activeEmployeeTab === "CHWCP") {
      return <ChwcpTable />;
    }

    return null;
  }

  return (
    <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main
        ref={mainScrollRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6"
      >
        <div className="mx-auto max-w-[1600px] space-y-5">
          <section
            className="sibs-page-header-in"
            style={getAnimationStyle(animationTiming.header)}
          >
            <div className="flex min-w-0 items-center gap-3">
              <Users
                size={34}
                strokeWidth={2.2}
                className="shrink-0 text-sibs-primary-1"
              />

              <h1 className="m-0 min-w-0 break-words text-[28px] font-bold leading-tight tracking-[-0.9px] text-sibs-primary-1 sm:text-[32px] xl:text-[38px]">
                Employees
              </h1>
            </div>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Manage employees, access requests, and CHWCP records
            </p>
          </section>

          <section
            className="sibs-profile-tab-panel"
            style={getAnimationStyle(animationTiming.summary)}
          >
            <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#101828]">
                    Employee Summary
                  </h2>

                  <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                    Overview of employee records, access requests, and CHWCP
                    requests.
                  </p>
                </div>

                <span className="inline-flex w-max items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
                  {activeEmployeeTab}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
              </div>
            </div>
          </section>

          <section
  className="sibs-profile-tab-panel min-h-[520px] overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm transition-all duration-200 hover:border-sibs-primary-1/20 hover:shadow-md"
  style={getAnimationStyle(animationTiming.table)}
>
  <div className="border-b border-[#E6ECF2] bg-white px-4 py-4 sm:px-5">
  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
    <div className="min-w-0">
      <h2 className="text-base font-bold text-[#101828]">
        {getTableTitle()}
      </h2>

      <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
        {getTableSubtitle()}
      </p>
    </div>

    <div className="min-w-0 overflow-x-auto no-scrollbar">
      <div
        className="relative grid w-full min-w-[520px] overflow-hidden rounded-full border border-[#E6ECF2] bg-[#F2F4F7] p-1 shadow-sm xl:w-[560px]"
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

        {employeeTabs.map(({ label, count, icon: Icon }) => {
          const isActive = activeEmployeeTab === label;

          return (
            <button
              key={label}
              type="button"
              onClick={() => handleTabChange(label)}
              className={`relative z-[1] inline-flex min-h-10 min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-bold transition-all duration-300 ease-out active:scale-[0.97] ${
                isActive
                  ? "text-white"
                  : "text-[#344054] hover:bg-white/80 hover:text-sibs-primary-1"
              }`}
            >
              <Icon size={15} className="shrink-0" />

              <span className="truncate">{label}</span>

              {count > 0 && (
                <span
                  className={`inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[9px] font-extrabold leading-none transition-all duration-300 ${
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
  </div>
</div>
  <div className="sibs-page-card-in" style={getAnimationStyle(60)}>
    {renderActiveTable()}
  </div>
</section>
        </div>
      </main>
    </div>
  );
}