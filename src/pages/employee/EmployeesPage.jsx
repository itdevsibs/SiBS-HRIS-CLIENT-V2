import {
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

function getMetricTone(tone) {
  if (tone === "emerald") {
    return {
      label: "text-[#047857]",
      value: "text-[#047857]",
      iconWrap: "bg-[#ECFDF3]",
      icon: "text-[#059669]",
    };
  }

  return {
    label: "text-[#042C51]",
    value: "text-[#042C51]",
    iconWrap: "bg-[#EAF2FB]",
    icon: "text-[#042C51]",
  };
}

function SummaryCard({
  label,
  value,
  description,
  icon,
  tone = "navy",
  delay = 0,
}) {
  const metricTone = getMetricTone(tone);
  const CardIcon = icon;

  return (
    <article
      className="sibs-metric-card"
      style={getAnimationStyle(delay)}
    >
      <div className="flex h-full items-start justify-between gap-4">
        <div className="min-w-0 flex-1 self-stretch">
          <p
            className={`m-0 truncate text-[10px] font-extrabold uppercase tracking-normal ${metricTone.label}`}
          >
            {label}
          </p>

          <p
            className={`mt-2 text-3xl font-extrabold leading-none tabular-nums tracking-normal ${metricTone.value}`}
          >
            {Number(value || 0).toLocaleString("en-PH")}
          </p>

          <p className="mt-1.5 line-clamp-2 text-xs font-bold leading-4 text-[#667085]">
            {description}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${metricTone.iconWrap} ${metricTone.icon}`}
        >
          <CardIcon size={17} strokeWidth={2} />
        </div>
      </div>
    </article>
  );
}

export default function EmployeesPage() {
  const { setSearch, setSearchInput, setPage, pagination } =
    usePagination("employees");

  const [activeEmployeeTab, setActiveEmployeeTab] = useState("Employees");
  const [chwcpTotal, setChwcpTotal] = useState(0);
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

  const activeTabIndex = Math.max(
    0,
    directoryTabs.findIndex((tab) => tab.label === activeEmployeeTab),
  );

  const activeTab = directoryTabs[activeTabIndex] || directoryTabs[0];

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
      if (!silent) setSummaryRefreshing(false);
    }
  }, []);

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
          <section
            className="sibs-page-header-in sibs-page-card-in sibs-card relative overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm sm:p-6"
            style={getAnimationStyle(animationTiming.header)}
          >
            <span className="sibs-top-accent" aria-hidden="true" />

            <div className="mt-1 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#042C51]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF5C28] animate-sibs-pulse" />
                    Employee Directory View
                  </span>
                </div>

                <h1 className="break-words text-xl font-extrabold text-[#042C51] sm:text-2xl">
                  Employee Directory
                </h1>

                <p className="text-xs font-semibold leading-relaxed text-[#667085] sm:text-sm">
                  Manage employee records and CHWCP compliance information.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSummaryRefresh}
                disabled={summaryRefreshing}
                title="Refresh employee directory summary"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-[#042C51] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCcw
                  size={16}
                  className={summaryRefreshing ? "animate-spin" : ""}
                />
              </button>
            </div>
          </section>

          <section
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            style={getAnimationStyle(animationTiming.summary)}
          >
            {directoryTabs.map((tab, index) => (
              <SummaryCard
                key={tab.label}
                label={tab.label}
                value={tab.count}
                description={tab.description}
                icon={tab.icon}
                tone={tab.tone}
                delay={
                  animationTiming.summaryCardBase +
                  index * animationTiming.summaryCardStagger
                }
              />
            ))}
          </section>

          <section
            className="sibs-profile-tab-panel sibs-page-card-in sibs-card min-h-[520px] overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm"
            style={getAnimationStyle(animationTiming.table)}
          >
            <div className="border-b border-[#E6ECF2] bg-white px-4 py-4 sm:px-5">
              <h2 className="sibs-section-title">
                {activeTab.label === "Employees"
                  ? "Employee Records"
                  : "CHWCP Records"}
              </h2>
              <p className="sibs-section-subtitle">{activeTab.description}</p>
            </div>

            {renderActiveTable()}
          </section>
        </div>
      </main>
    </div>
  );
}
