import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, RefreshCw } from "lucide-react";

import Header from "../../components/layout/Header";
import { getSchedule } from "../../lib/axios/getSchedule";
import { usePagination } from "@/services/context/PaginationContext";
import ScheduleTable from "@/components/tables/Schedule/ScheduleTable";
import { PageHeaderHero } from "@/components/ui";

const SCHEDULE_STATE_KEY = "schedulePageState";
const PAGE_LIMIT = 15;

function getAnimationStyle(delay = 0) {
  return {
    animationDelay: `${delay}ms`,
    animationFillMode: "both",
  };
}

export default function SchedulePage() {
  const [schedule, setSchedule] = useState([]);

  const paginationContext = usePagination("schedule");

  const {
    page = 1,
    search = "",
    searchInput = "",
    loading,
    setLoading,
    setSearchInput,
    setSearch,
    pagination,
    setPagination,
    filterValues,
    setPage,
    setDateRange,
  } = paginationContext;

  const restoredRef = useRef(false);
  const mainScrollRef = useRef(null);

  const dateFrom = filterValues?.dateFrom || "";
  const dateTo = filterValues?.dateTo || "";

  useEffect(() => {
    if (restoredRef.current) return;

    try {
      const savedState = sessionStorage.getItem(SCHEDULE_STATE_KEY);

      if (savedState) {
        const parsed = JSON.parse(savedState);

        if (typeof parsed.search === "string") {
          setSearchInput(parsed.search);
          setSearch(parsed.search);
        }

        if (typeof parsed.page === "number" && parsed.page > 0) {
          setPage(parsed.page);
        }

        if (
          typeof setDateRange === "function" &&
          (typeof parsed.dateFrom === "string" ||
            typeof parsed.dateTo === "string")
        ) {
          setDateRange({
            dateFrom: parsed.dateFrom || "",
            dateTo: parsed.dateTo || "",
          });
        }
      }
    } catch (err) {
      console.error("Schedule state restore error:", err);
    } finally {
      restoredRef.current = true;
    }
  }, [setDateRange, setPage, setSearch, setSearchInput]);

  useEffect(() => {
    if (!restoredRef.current) return;

    sessionStorage.setItem(
      SCHEDULE_STATE_KEY,
      JSON.stringify({
        search,
        page,
        dateFrom,
        dateTo,
      }),
    );
  }, [search, page, dateFrom, dateTo]);

  async function fetchSchedule(showLoading = true) {
    if (showLoading) setLoading(true);

    try {
      const result = await getSchedule(page, search, {
        dateFrom,
        dateTo,
      });

      if (!result?.success) {
        setSchedule([]);

        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalRecords: 0,
          total: 0,
          limit: PAGE_LIMIT,
          hasPreviousPage: false,
          hasNextPage: false,
        });

        return;
      }

      setSchedule(result.data || []);

      setPagination(
        result.pagination || {
          currentPage: page,
          totalPages: 1,
          totalRecords: result.data?.length || 0,
          total: result.data?.length || 0,
          limit: PAGE_LIMIT,
          hasPreviousPage: page > 1,
          hasNextPage: false,
        },
      );
    } catch (err) {
      console.error("Schedule fetch error:", err);

      setSchedule([]);

      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        total: 0,
        limit: PAGE_LIMIT,
        hasPreviousPage: false,
        hasNextPage: false,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!restoredRef.current) return;

    fetchSchedule(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, dateFrom, dateTo]);

  useEffect(() => {
    const handleFocus = () => {
      fetchSchedule(false);
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, dateFrom, dateTo]);

  function handleSetSearchKeyword(value) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main ref={mainScrollRef} className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-4 sm:space-y-5">
          <PageHeaderHero
            kicker="Core HR View"
            title="My Schedule"
            description="View your work schedule and assigned shift details."
            actions={
              <>
                <button
                  type="button"
                  onClick={() => fetchSchedule(true)}
                  disabled={loading}
                  title="Refresh Schedule Data"
                  className="sibs-btn-icon"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                      loading ? "animate-spin text-sibs-orange" : ""
                    }`}
                  />
                </button>

                <span className="sibs-btn-primary pointer-events-none max-sm:flex-1">
                  <CalendarDays className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-white" />
                  Schedule Records
                </span>
              </>
            }
          />

          <ScheduleTable
            schedule={schedule}
            loading={loading}
            page={page}
            searchInput={searchInput}
            searchKeyword={search}
            setSearchInput={setSearchInput}
            setSearchKeyword={handleSetSearchKeyword}
            setPage={setPage}
            pagination={pagination}
            filterValues={filterValues}
          />
        </div>
      </main>
    </div>
  );
}
