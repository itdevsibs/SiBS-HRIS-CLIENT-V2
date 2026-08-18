import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays } from "lucide-react";

import Header from "../../components/layout/Header";
import { getSchedule } from "../../lib/axios/getSchedule";
import { usePagination } from "@/services/context/PaginationContext";
import ScheduleTable from "@/components/tables/Schedule/ScheduleTable";

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

  const navigate = useNavigate();
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
        if (result?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

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
        <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
          <section
            className="sibs-page-header-in sibs-page-card-in sibs-card relative overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm sm:p-6"
            style={getAnimationStyle(0)}
          >
            <span className="sibs-top-accent" aria-hidden="true" />

            <div className="mt-1 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#042C51]">
                    <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
                    Schedule View
                  </span>
                </div>

                <h1 className="break-words text-xl font-extrabold text-[#042C51] sm:text-2xl">
                  My Schedule
                </h1>

                <p className="text-xs font-semibold leading-relaxed text-[#667085] sm:text-sm">
                  View your work schedule and assigned shift details.
                </p>
              </div>

              <span className="inline-flex h-10 w-max shrink-0 items-center justify-center gap-2 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-3.5 text-xs font-extrabold text-[#042C51]">
                <CalendarDays size={15} className="text-[#FF5C28]" />
                Schedule Records
              </span>
            </div>
          </section>

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
