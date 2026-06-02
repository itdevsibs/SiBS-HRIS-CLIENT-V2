import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays } from "lucide-react";

import Header from "../../components/layout/Header";
import { getSchedule } from "../../lib/axios/getSchedule";
import {
  usePagination,
} from "@/services/context/PaginationContext";
import ScheduleTable from "@/components/tables/Schedule/ScheduleTable";

const SCHEDULE_STATE_KEY = "schedulePageState";
const PAGE_LIMIT = 15;

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
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main
        ref={mainScrollRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6"
      >
        <div className="flex min-w-0 flex-col gap-6">
          <section className="sibs-page-header-in flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-3">
                <CalendarDays
                  size={34}
                  strokeWidth={2.2}
                  className="shrink-0 text-sibs-primary-1 transition-transform duration-300 group-hover:scale-105"
                />

                <h1 className="m-0 break-words text-[28px] font-bold leading-tight tracking-[-0.9px] text-sibs-primary-1 sm:text-[32px] xl:text-[38px]">
                  My Schedule
                </h1>
              </div>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                View your work schedule and assigned shift details.
              </p>
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