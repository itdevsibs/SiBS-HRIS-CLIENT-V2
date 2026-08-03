import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FileCheck2, UserRoundCheck } from "lucide-react";

import Header from "../../components/layout/Header";
import EmployeeDirectoryContent from "../../components/employee/directory/EmployeeDirectoryContent.jsx";
import EmployeeDirectoryHeader from "../../components/employee/directory/EmployeeDirectoryHeader.jsx";
import EmployeeDirectoryStats from "../../components/employee/directory/EmployeeDirectoryStats.jsx";
import { usePagination } from "@/services/context/PaginationContext";

const EMPLOYEE_STATE_KEY = "employeePageState";

const animationTiming = {
  header: 0,
  summary: 60,
  table: 120,
};

const employeeTabs = [
  {
    label: "Employees",
    count: 0,
    icon: UserRoundCheck,
    description: "Employee master records",
    tone: "navy",
  },
  {
    label: "CHWCP",
    count: 2,
    icon: FileCheck2,
    description: "Health and compliance records",
    tone: "emerald",
  },
];

function getAnimationStyle(delay = 0) {
  return {
    animationDelay: `${delay}ms`,
    animationFillMode: "both",
  };
}

export default function EmployeesPage() {
  const { setSearch, setSearchInput, setPage, pagination } =
    usePagination("employees");

  const [activeEmployeeTab, setActiveEmployeeTab] = useState("Employees");

  const restoredRef = useRef(false);
  const didMountTabRef = useRef(false);
  const mainScrollRef = useRef(null);

  const directoryTabs = employeeTabs.map((tab) =>
    tab.label === "Employees"
      ? { ...tab, count: Number(pagination?.total || 0) }
      : tab,
  );

  const activeTab =
    directoryTabs.find((tab) => tab.label === activeEmployeeTab) ||
    directoryTabs[0];

  function scrollToTop(behavior = "auto") {
    requestAnimationFrame(() => {
      mainScrollRef.current?.scrollTo({
        top: 0,
        left: 0,
        behavior,
      });
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
          directoryTabs.some((tab) => tab.label === parsed.activeTab)
        ) {
          setActiveEmployeeTab(parsed.activeTab);
        } else if (parsed?.activeTab) {
          setActiveEmployeeTab("Employees");
        }
      }

      setSearch?.("");
      setSearchInput?.("");
    } catch (error) {
      console.error("Employee directory state restore error:", error);
    }

    // This restoration intentionally runs once on mount.
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
    setPage?.(1);

    try {
      sessionStorage.setItem(
        EMPLOYEE_STATE_KEY,
        JSON.stringify({
          page: 1,
          activeTab: tabLabel,
        }),
      );
    } catch (error) {
      console.error("Employee directory tab state save error:", error);
    }
  }

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main ref={mainScrollRef} className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
          <div style={getAnimationStyle(animationTiming.header)}>
            <EmployeeDirectoryHeader />
          </div>

          <div style={getAnimationStyle(animationTiming.summary)}>
            <EmployeeDirectoryStats tabs={directoryTabs} />
          </div>

          <section
            className="sibs-profile-tab-panel sibs-page-card-in sibs-card min-h-[520px] overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm"
            style={getAnimationStyle(animationTiming.table)}
          >
            <div className="border-b border-[#E6ECF2] bg-white px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <h2 className="sibs-section-title">
                    {activeTab.label === "Employees"
                      ? "Employee Records"
                      : `${activeTab.label} Records`}
                  </h2>

                  <p className="sibs-section-subtitle">
                    {activeTab.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="sibs-page-card-in" style={getAnimationStyle(60)}>
              <EmployeeDirectoryContent
                tabs={directoryTabs}
                activeTab={activeEmployeeTab}
                onTabChange={handleTabChange}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
