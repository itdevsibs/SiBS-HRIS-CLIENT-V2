import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  FileCheck2,
  RefreshCcw,
  UserRoundCheck,
} from "lucide-react";

import Header from "../../components/layout/Header";
import ChwcpTable from "../../components/tables/employees/ChwcpTable";
import EmployeeTable from "../../components/tables/employees/EmployeeTable";
import { getChwcpRequests } from "../../lib/axios/getChwcp";
import { usePagination } from "@/services/context/PaginationContext";
import {
  MetricCard,
  MetricGrid,
  MetricCardSkeleton,
  PageHeaderHero,
} from "@/components/ui";

const EMPLOYEE_STATE_KEY = "employeePageState";

const animationTiming = {
  header: 0,
  summary: 60,
  table: 120,
  summaryCardBase: 0,
  summaryCardStagger: 60,
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
    label: "CHWCP Requests",
    count: 0,
    icon: FileCheck2,
    description: "Health and compliance requests",
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
  const {
    setSearch,
    setSearchInput,
    setPage,
    pagination,
    loading: employeesLoading,
  } = usePagination("employees");

  const [activeEmployeeTab, setActiveEmployeeTab] = useState("Employees");
  const [chwcpTotal, setChwcpTotal] = useState(0);
  const [chwcpLoading, setChwcpLoading] = useState(true);
  const [summaryRefreshing, setSummaryRefreshing] = useState(false);
  const [chwcpReloadKey, setChwcpReloadKey] = useState(0);

  const restoredRef = useRef(false);
  const mainScrollRef = useRef(null);

  const directoryTabs = employeeTabs.map((tab) => {
    if (tab.label === "Employees") {
      return {
        ...tab,
        count: Number(pagination?.total || 0),
      };
    }

    if (tab.label === "CHWCP Requests") {
      return {
        ...tab,
        count: Number(chwcpTotal || 0),
      };
    }

    return tab;
  });

  const loadChwcpCount = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setSummaryRefreshing(true);

    try {
      const result = await getChwcpRequests({
        page: 1,
        limit: 1,
        search: "",
        stage: "all",
      });

      setChwcpTotal(Number(result.summary?.totalVisible || 0));
      return true;
    } catch (error) {
      console.error("LOAD CHWCP SUMMARY COUNT ERROR:", error);
      return false;
    } finally {
      setChwcpLoading(false);
      if (!silent) setSummaryRefreshing(false);
    }
  }, []);

  const summaryLoading = employeesLoading || chwcpLoading || summaryRefreshing;

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
    loadChwcpCount({ silent: true });
  }, [loadChwcpCount]);

  useEffect(() => {
    if (restoredRef.current) return;

    restoredRef.current = true;
    setActiveEmployeeTab("Employees");

    try {
      const savedState = sessionStorage.getItem(EMPLOYEE_STATE_KEY);

      if (savedState) {
        const parsed = JSON.parse(savedState);

        if (parsed?.page && Number(parsed.page) > 0) {
          setPage?.(Number(parsed.page));
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

  function handleTabChange(tabLabel) {
    if (tabLabel === activeEmployeeTab) return;

    setActiveEmployeeTab(tabLabel);
    setPage?.(1);

    try {
      sessionStorage.setItem(
        EMPLOYEE_STATE_KEY,
        JSON.stringify({
          page: 1,
        }),
      );
    } catch (error) {
      console.error("Employee directory tab state save error:", error);
    }
  }

  async function handleSummaryRefresh() {
    const refreshed = await loadChwcpCount();

    if (refreshed && activeEmployeeTab === "CHWCP Requests") {
      setChwcpReloadKey((current) => current + 1);
    }
  }

  function renderActiveTable() {
    if (activeEmployeeTab === "Employees") {
      return (
        <EmployeeTable
          tabs={directoryTabs}
          activeTab={activeEmployeeTab}
          onTabChange={handleTabChange}
        />
      );
    }

    if (activeEmployeeTab === "CHWCP Requests") {
      return (
        <ChwcpTable
          key={chwcpReloadKey}
          tabs={directoryTabs}
          activeTab={activeEmployeeTab}
          onTabChange={handleTabChange}
          onTotalChange={setChwcpTotal}
        />
      );
    }

    return null;
  }

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main
        ref={mainScrollRef}
        className="sibs-dashboard-main-wide"
      >
        <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
          <PageHeaderHero
            kicker="Employee Directory View"
            title="Employee Directory"
            description="Manage employee records and CHWCP compliance information."
            actions={
              <button
                type="button"
                onClick={handleSummaryRefresh}
                disabled={summaryRefreshing}
                title="Refresh employee directory summary"
                className="sibs-btn-icon"
              >
                <RefreshCcw
                  className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${summaryRefreshing ? "animate-spin text-sibs-orange" : ""}`}
                />
              </button>
            }
          />

          <MetricGrid
            columns={2}
            className="w-full"
            style={getAnimationStyle(animationTiming.summary)}
          >
            {summaryLoading ? (
              <>
                <MetricCardSkeleton label="Employees" />
                <MetricCardSkeleton label="CHWCP Requests" />
              </>
            ) : (
              directoryTabs.map((tab, index) => (
                <MetricCard
                  key={tab.label}
                  label={tab.label}
                  value={Number(tab.count || 0).toLocaleString("en-PH")}
                  description={tab.description}
                  icon={tab.icon}
                  tone={tab.tone === "emerald" ? "emerald" : "navy"}
                  delay={
                    animationTiming.summaryCardBase +
                    index * animationTiming.summaryCardStagger
                  }
                />
              ))
            )}
          </MetricGrid>

          <section
            className="sibs-profile-tab-panel sibs-page-card-in sibs-card min-h-[520px] overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-sm"
            style={getAnimationStyle(animationTiming.table)}
          >
            {renderActiveTable()}
          </section>
        </div>
      </main>
    </div>
  );
}
