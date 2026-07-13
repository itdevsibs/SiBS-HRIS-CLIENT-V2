import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

const PAGE_LIMIT = 15;

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;

  const cleanValue = String(value).replace(/,/g, "").replace(/%/g, "").trim();
  const numberValue = Number(cleanValue);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getNumberValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      const numberValue = toNumber(value);

      if (Number.isFinite(numberValue)) return numberValue;
    }
  }

  return 0;
}

function getArrayValue(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string" && value.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function getSixWeekSeriesTotal(item, type = "absenteeism") {
  const arrayKeys =
    type === "absenteeism"
      ? [
          "absenteeismTrend",
          "absenteeism_trend",
          "absenteeismWeeklyCounts",
          "absenteeism_weekly_counts",
          "weeklyAbsenteeism",
          "weekly_absenteeism",
        ]
      : [
          "attritionTrend",
          "attrition_trend",
          "attritionWeeklyCounts",
          "attrition_weekly_counts",
          "weeklyAttrition",
          "weekly_attrition",
        ];

  for (const key of arrayKeys) {
    const series = getArrayValue(item?.[key]);

    if (series.length > 0) {
      return series.reduce((sum, value) => sum + toNumber(value), 0);
    }
  }

  const prefix = type === "absenteeism" ? "absenteeism" : "attrition";

  const keyedTotal = [1, 2, 3, 4, 5, 6].reduce(
    (sum, weekNumber) =>
      sum +
      getNumberValue(
        item?.[`${prefix}Week${weekNumber}`],
        item?.[`${prefix}_week_${weekNumber}`],
        item?.[
          `week${weekNumber}${type === "absenteeism" ? "Absenteeism" : "Attrition"}`
        ],
        item?.[`week_${weekNumber}_${type}`],
      ),
    0,
  );

  if (keyedTotal > 0) return keyedTotal;

  return type === "absenteeism"
    ? getNumberValue(
        item.absenteeismSixWeeks,
        item.absenteeism_6_weeks,
        item.absenteeismPastSixWeeks,
        item.absenteeism_past_six_weeks,
        item.totalAbsenteeism,
        item.total_absenteeism,
        item.absenteeismCount,
        item.absenteeism_count,
      )
    : getNumberValue(
        item.attritionSixWeeks,
        item.attrition_6_weeks,
        item.attritionPastSixWeeks,
        item.attrition_past_six_weeks,
        item.totalAttrition,
        item.total_attrition,
        item.attritionPastCount,
        item.attrition_past_count,
        item.attritionCount,
        item.attrition_count,
      );
}

function normalizeRate(value) {
  const cleanValue = toNumber(value);

  if (cleanValue <= 0) return 0;
  if (cleanValue > 1) return cleanValue / 100;

  return cleanValue;
}

function formatNumber(value, maximumFractionDigits = 0) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits,
  });
}

function formatPercent(value, decimals = 1) {
  return `${(Number(value || 0) * 100).toFixed(decimals)}%`;
}

function formatSignedPercentWhole(value, decimals = 2) {
  return `${Number(value || 0).toFixed(decimals)}%`;
}

function getSignedNumberClass(value = 0) {
  const numberValue = Number(value || 0);

  if (numberValue < 0) return "text-red-700";
  if (numberValue > 0) return "text-emerald-700";

  return "text-slate-700";
}

function getRequiredHeadcount(item = {}) {
  return getNumberValue(
    item.requiredHeadcount,
    item.required_headcount,
    item.requiredHC,
    item.required_hc,
  );
}

function getActualHeadcount(item = {}) {
  return getNumberValue(
    item.actualHeadcount,
    item.actual_headcount,
    item.actualHC,
    item.actual_hc,
    item.endorsedHeadcount,
    item.endorsed_headcount,
  );
}

function getAcceptedJobOffer(item = {}) {
  return getNumberValue(
    item.acceptedJobOffer,
    item.accepted_job_offer,
    item.acceptedJoCount,
    item.accepted_jo_count,
    item.acceptedJOCount,
    item.accepted_job_offer_count,
    item.interviewCount,
    item.interview_count,
    item.interviewPopulationCount,
    item.interview_population_count,
  );
}

function getNhoCount(item = {}) {
  return getNumberValue(
    item.nhoCount,
    item.nho_count,
    item.nhoPopulationCount,
    item.nho_population_count,
  );
}

function getFstCount(item = {}) {
  return getNumberValue(
    item.fstCount,
    item.fst_count,
    item.fstPopulationCount,
    item.fst_population_count,
  );
}

function getPstCount(item = {}) {
  return getNumberValue(
    item.pstCount,
    item.pst_count,
    item.pstPopulationCount,
    item.pst_population_count,
  );
}

function getGoLiveCount(item = {}) {
  const direct = getNumberValue(
    item.goLiveCount,
    item.go_live_count,
    item.goLive,
    item.go_live,
    item.liveCount,
    item.live_count,
    item.projectedToBeEndorsed,
    item.projected_to_be_endorsed,
    item.projectedEndorsed,
    item.projected_endorsed,
  );

  if (direct > 0) return direct;

  const pstCount = getPstCount(item);
  const fstToPstAttrition = getNumberValue(
    item.attritionFstToPstCount,
    item.attrition_fst_to_pst_count,
    item.fstToPstAttritionCount,
    item.fst_to_pst_attrition_count,
  );

  return Math.max(0, pstCount - fstToPstAttrition);
}

function getHiredCount(item = {}) {
  const direct = getNumberValue(
    item.actualHiredCount,
    item.actual_hired_count,
    item.hiredEmployeeCount,
    item.hired_employee_count,
    item.hiredCount,
    item.hired_count,
  );

  if (direct > 0) return direct;

  return getFstCount(item);
}

function getLeadsToInterview(item = {}) {
  return getNumberValue(
    item.leadsToInterview,
    item.leads_to_interview,
    item.leadsToInterviewCount,
    item.leads_to_interview_count,
    item.leadsNeeded,
    item.leads_needed,
  );
}

function getRowMetrics(item) {
  const requiredHeadcount = getRequiredHeadcount(item);
  const actualHeadcount = getActualHeadcount(item);
  const absenteeismSixWeeks = getSixWeekSeriesTotal(item, "absenteeism");
  const attritionSixWeeks = getSixWeekSeriesTotal(item, "attrition");
  const netActualHeadcount = Math.max(0, actualHeadcount - attritionSixWeeks);
  const bufferPercentage =
    requiredHeadcount > 0
      ? ((actualHeadcount - requiredHeadcount) / requiredHeadcount) * 100
      : 0;
  const hiringNeeded = Math.max(0, requiredHeadcount - netActualHeadcount);
  const acceptedJobOffer = getAcceptedJobOffer(item);
  const nhoCount = getNhoCount(item);
  const fstCount = getFstCount(item);
  const pstCount = getPstCount(item);
  const goLiveCount = getGoLiveCount(item);
  const hiredCount = getHiredCount(item);
  const directLeadsToInterview = getLeadsToInterview(item);
  const hiringRateFromLeads =
    acceptedJobOffer > 0 && directLeadsToInterview > 0
      ? acceptedJobOffer / directLeadsToInterview
      : 0;
  const hiringRate =
    hiringRateFromLeads || normalizeRate(item.hiringRate ?? item.hiring_rate);
  const leadsToInterviewToGenerate =
    hiringNeeded <= 0
      ? 0
      : hiringRate > 0
        ? Math.ceil(hiringNeeded / hiringRate)
        : hiringNeeded;

  return {
    requiredHeadcount,
    actualHeadcount,
    absenteeismSixWeeks,
    attritionSixWeeks,
    netActualHeadcount,
    bufferPercentage,
    hiringNeeded,
    acceptedJobOffer,
    nhoCount,
    fstCount,
    pstCount,
    goLiveCount,
    hiredCount,
    hiringRate,
    leadsToInterviewToGenerate,
  };
}

function HeaderCell({ children, className = "" }) {
  return (
    <th
      className={`sticky top-0 z-20 bg-[#F5F7FA] px-5 py-4 text-center align-top ${className}`}
    >
      <div className="leading-tight">{children}</div>
    </th>
  );
}

function ColumnGroup() {
  return (
    <colgroup>
      <col style={{ width: "210px" }} />
      <col style={{ width: "240px" }} />
      <col style={{ width: "150px" }} />
      <col style={{ width: "150px" }} />
      <col style={{ width: "150px" }} />
      <col style={{ width: "150px" }} />
      <col style={{ width: "150px" }} />
      <col style={{ width: "150px" }} />
      <col style={{ width: "130px" }} />
      <col style={{ width: "130px" }} />
      <col style={{ width: "130px" }} />
      <col style={{ width: "130px" }} />
      <col style={{ width: "130px" }} />
      <col style={{ width: "150px" }} />
      <col style={{ width: "180px" }} />
    </colgroup>
  );
}

function DesktopTableHeader() {
  return (
    <table className="w-full table-fixed border-separate border-spacing-0 bg-white text-left">
      <ColumnGroup />

      <thead>
        <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
          <th
            rowSpan={2}
            className="sticky top-0 z-20 bg-[#F5F7FA] px-5 py-4 text-left align-middle first:rounded-tl-2xl"
          >
            Cluster
          </th>
          <th
            rowSpan={2}
            className="sticky top-0 z-20 bg-[#F5F7FA] px-5 py-4 text-left align-middle"
          >
            Account
          </th>
          <HeaderCell>
            Required
            <br />
            Headcount
          </HeaderCell>
          <HeaderCell>
            Actual
            <br />
            Headcount
          </HeaderCell>
          <HeaderCell>
            Buffer
            <br />
            Percentage
          </HeaderCell>
          <HeaderCell>
            Net Actual
            <br />
            HC
          </HeaderCell>
          <HeaderCell>
            Hiring
            <br />
            Needed
          </HeaderCell>
          <th
            colSpan={5}
            className="sticky top-0 z-20 border-x border-[#DDE7F2] bg-[#F5F7FA] px-5 py-4 text-center align-top"
          >
            Pipeline Plan (Candidates)
          </th>
          <HeaderCell>
            Hired
            <br />
            Count
          </HeaderCell>
          <HeaderCell>
            Hiring Rate
            <br />
            (Leads to JO)
          </HeaderCell>
          <HeaderCell className="last:rounded-tr-2xl">
            Leads to Interview
            <br />
            (To Generate)
          </HeaderCell>
        </tr>

        <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
          <HeaderCell>
            Required
            <br />
            Headcount
          </HeaderCell>
          <HeaderCell>
            Actual
            <br />
            Headcount
          </HeaderCell>
          <HeaderCell>
            Buffer
            <br />
            Percentage
          </HeaderCell>
          <HeaderCell>
            Net Actual
            <br />
            HC
          </HeaderCell>
          <HeaderCell>
            Hiring
            <br />
            Needed
          </HeaderCell>
          <HeaderCell>
            Accepted
            <br />
            Job Offer
          </HeaderCell>
          <HeaderCell>
            NHO
            <br />
            Count
          </HeaderCell>
          <HeaderCell>
            FST
            <br />
            Count
          </HeaderCell>
          <HeaderCell>
            PST
            <br />
            Count
          </HeaderCell>
          <HeaderCell>Go Live</HeaderCell>
          <HeaderCell>
            Hired
            <br />
            Count
          </HeaderCell>
          <HeaderCell>
            Hiring Rate
            <br />
            (Leads to JO)
          </HeaderCell>
          <HeaderCell>
            Leads to Interview
            <br />
            (To Generate)
          </HeaderCell>
        </tr>
      </thead>
    </table>
  );
}

export default function WorkforceHiringAccountsTable({
  accountsLoading = false,
  filteredPlans = [],
  onViewPlan,
}) {
  const tableScrollRef = useRef(null);
  const mobileScrollRef = useRef(null);

  const dragStateRef = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  const [isDraggingTable, setIsDraggingTable] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const computedPlans = useMemo(() => {
    const safePlans = Array.isArray(filteredPlans) ? filteredPlans : [];

    return safePlans.map((item) => ({
      ...item,
      planMetrics: getRowMetrics(item),
    }));
  }, [filteredPlans]);

  const displayPlans = useMemo(() => {
    const keyword = String(search || "")
      .trim()
      .toLowerCase();

    return computedPlans.filter((item) => {
      const metrics = item.planMetrics || getRowMetrics(item);
      const searchableText = [
        item.id,
        item.week,
        item.account,
        item.accountName,
        item.cluster,
        item.clusterName,
        metrics.requiredHeadcount,
        metrics.actualHeadcount,
        formatSignedPercentWhole(metrics.bufferPercentage),
        metrics.netActualHeadcount,
        metrics.hiringNeeded,
        metrics.acceptedJobOffer,
        metrics.nhoCount,
        metrics.fstCount,
        metrics.pstCount,
        metrics.goLiveCount,
        metrics.hiredCount,
        formatPercent(metrics.hiringRate),
        metrics.leadsToInterviewToGenerate,
      ]
        .filter((value) => value !== undefined && value !== null)
        .join(" ")
        .toLowerCase();

      return !keyword || searchableText.includes(keyword);
    });
  }, [computedPlans, search]);

  const totals = useMemo(() => {
    const validRows = displayPlans.filter((item) => !item.isAssignedEmptyRow);

    const sum = validRows.reduce(
      (acc, item) => {
        const metrics = item.planMetrics || getRowMetrics(item);

        acc.requiredHeadcount += metrics.requiredHeadcount;
        acc.actualHeadcount += metrics.actualHeadcount;
        acc.netActualHeadcount += metrics.netActualHeadcount;
        acc.hiringNeeded += metrics.hiringNeeded;
        acc.acceptedJobOffer += metrics.acceptedJobOffer;
        acc.nhoCount += metrics.nhoCount;
        acc.fstCount += metrics.fstCount;
        acc.pstCount += metrics.pstCount;
        acc.goLiveCount += metrics.goLiveCount;
        acc.hiredCount += metrics.hiredCount;
        acc.leadsToInterviewToGenerate += metrics.leadsToInterviewToGenerate;

        return acc;
      },
      {
        requiredHeadcount: 0,
        actualHeadcount: 0,
        netActualHeadcount: 0,
        hiringNeeded: 0,
        acceptedJobOffer: 0,
        nhoCount: 0,
        fstCount: 0,
        pstCount: 0,
        goLiveCount: 0,
        hiredCount: 0,
        leadsToInterviewToGenerate: 0,
      },
    );

    const bufferPercentage =
      sum.requiredHeadcount > 0
        ? ((sum.actualHeadcount - sum.requiredHeadcount) /
            sum.requiredHeadcount) *
          100
        : 0;

    const hiringRate =
      sum.leadsToInterviewToGenerate > 0
        ? sum.hiringNeeded / sum.leadsToInterviewToGenerate
        : 0;

    return {
      ...sum,
      bufferPercentage,
      hiringRate,
    };
  }, [displayPlans]);

  const totalRecords = displayPlans.length;
  const totalPages = Math.max(Math.ceil(totalRecords / PAGE_LIMIT), 1);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const hasPreviousPage = safeCurrentPage > 1;
  const hasNextPage = safeCurrentPage < totalPages;

  const paginatedPlans = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_LIMIT;

    return displayPlans.slice(startIndex, startIndex + PAGE_LIMIT);
  }, [displayPlans, safeCurrentPage]);

  useEffect(() => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }

    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [safeCurrentPage, search]);

  function handlePreviousPage() {
    if (accountsLoading || !hasPreviousPage) return;
    setCurrentPage(Math.max(safeCurrentPage - 1, 1));
  }

  function handleNextPage() {
    if (accountsLoading || !hasNextPage) return;
    setCurrentPage(Math.min(safeCurrentPage + 1, totalPages));
  }

  function handleSearchKeyDown(e) {
    if (e.key !== "Enter") return;

    setSearch(searchInput);
    setCurrentPage(1);
  }

  function handleDragStart(e) {
    if (e.button !== 0) return;

    const target = e.target;
    const isInteractiveElement = target.closest(
      "button, a, input, select, textarea, [data-no-table-drag='true']",
    );

    if (isInteractiveElement) return;

    const container = tableScrollRef.current;
    if (!container) return;

    dragStateRef.current = {
      isDown: true,
      startX: e.pageX - container.offsetLeft,
      scrollLeft: container.scrollLeft,
      moved: false,
    };

    setIsDraggingTable(true);
  }

  function handleDragMove(e) {
    const container = tableScrollRef.current;
    const dragState = dragStateRef.current;

    if (!dragState.isDown || !container) return;

    e.preventDefault();

    const x = e.pageX - container.offsetLeft;
    const walk = (x - dragState.startX) * 1.4;

    if (Math.abs(walk) > 4) {
      dragStateRef.current.moved = true;
    }

    container.scrollLeft = dragState.scrollLeft - walk;
  }

  function handleDragEnd() {
    dragStateRef.current.isDown = false;

    window.setTimeout(() => {
      setIsDraggingTable(false);
      dragStateRef.current.moved = false;
    }, 0);
  }

  function handleRowClick(item) {
    if (dragStateRef.current.moved) return;
    onViewPlan?.(item);
  }

  function handleRowKeyDown(e, item) {
    if (e.key !== "Enter" && e.key !== " ") return;

    e.preventDefault();
    handleRowClick(item);
  }

  function renderRow(item) {
    const metrics = item.planMetrics || getRowMetrics(item);

    return (
      <tr
        key={item.id}
        role="button"
        tabIndex={0}
        onClick={() => handleRowClick(item)}
        onKeyDown={(e) => handleRowKeyDown(e, item)}
        className="cursor-pointer transition hover:bg-[#F3F7FB] focus:bg-[#F3F7FB] focus:outline-none"
      >
        <td className="border-b border-[#E6ECF2] px-5 py-5">
          <p className="max-w-[180px] truncate text-sm font-extrabold text-[#101828]">
            {item.cluster || item.clusterName || "--"}
          </p>
        </td>

        <td className="border-b border-[#E6ECF2] px-5 py-5">
          <p className="max-w-[220px] truncate text-sm font-extrabold text-[#101828]">
            {item.account || item.accountName || "--"}
          </p>

          {item.week && (
            <p className="mt-1 max-w-[220px] truncate text-[11px] font-bold text-[#667085]">
              {item.week}
            </p>
          )}
        </td>

        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
          {formatNumber(metrics.requiredHeadcount)}
        </td>

        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
          {formatNumber(metrics.actualHeadcount)}
        </td>

        <td
          className={`border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold ${getSignedNumberClass(metrics.bufferPercentage)}`}
        >
          {formatSignedPercentWhole(metrics.bufferPercentage)}
        </td>

        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-sibs-primary-1">
          {formatNumber(metrics.netActualHeadcount)}
        </td>

        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-red-600">
          {formatNumber(metrics.hiringNeeded)}
        </td>

        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
          {formatNumber(metrics.acceptedJobOffer)}
        </td>

        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
          {formatNumber(metrics.nhoCount)}
        </td>

        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
          {formatNumber(metrics.fstCount)}
        </td>

        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
          {formatNumber(metrics.pstCount)}
        </td>

        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-emerald-700">
          {formatNumber(metrics.goLiveCount)}
        </td>

        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-sibs-primary-1">
          {formatNumber(metrics.hiredCount)}
        </td>

        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-sibs-primary-1">
          {formatPercent(metrics.hiringRate)}
        </td>

        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-violet-700">
          {formatNumber(metrics.leadsToInterviewToGenerate)}
        </td>
      </tr>
    );
  }

  return (
    <section className="rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E6ECF2] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-extrabold uppercase tracking-wide text-sibs-primary-1">
            Details by Cluster / Account (6-Week Aggregated Plan)
          </h2>
          <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
            Account-level workforce plan and pipeline plan candidates.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <label className="relative block min-w-0 sm:w-[300px]">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search cluster or account..."
              className="h-10 w-full rounded-[10px] border border-[#D0D5DD] bg-white pl-9 pr-3 text-sm font-semibold text-[#344054] outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              setSearch(searchInput);
              setCurrentPage(1);
            }}
            disabled={accountsLoading}
            className="h-10 rounded-[10px] bg-sibs-primary-1 px-4 text-sm font-extrabold text-white transition hover:bg-sibs-primary-1/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Search
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="hidden lg:block">
          <div
            ref={tableScrollRef}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            className={`sibs-scrollbar max-h-[720px] overflow-auto rounded-2xl border border-[#E6ECF2] ${
              isDraggingTable ? "cursor-grabbing select-none" : "cursor-grab"
            }`}
          >
            <table className="w-full min-w-[2300px] table-fixed border-separate border-spacing-0 bg-white text-left">
              <ColumnGroup />

              <thead>
                <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                  <th
                    rowSpan={2}
                    className="sticky top-0 z-20 bg-[#F5F7FA] px-5 py-4 text-left align-middle first:rounded-tl-2xl"
                  >
                    Cluster
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky top-0 z-20 bg-[#F5F7FA] px-5 py-4 text-left align-middle"
                  >
                    Account
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky top-0 z-20 bg-[#F5F7FA] px-5 py-4 text-center align-middle"
                  >
                    Required
                    <br />
                    Headcount
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky top-0 z-20 bg-[#F5F7FA] px-5 py-4 text-center align-middle"
                  >
                    Actual
                    <br />
                    Headcount
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky top-0 z-20 bg-[#F5F7FA] px-5 py-4 text-center align-middle"
                  >
                    Buffer
                    <br />
                    Percentage
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky top-0 z-20 bg-[#F5F7FA] px-5 py-4 text-center align-middle"
                  >
                    Net Actual
                    <br />
                    HC
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky top-0 z-20 bg-[#F5F7FA] px-5 py-4 text-center align-middle"
                  >
                    Hiring
                    <br />
                    Needed
                  </th>
                  <th
                    colSpan={5}
                    className="sticky top-0 z-20 border-x border-[#DDE7F2] bg-[#F5F7FA] px-5 py-4 text-center align-top"
                  >
                    Pipeline Plan (Candidates)
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky top-0 z-20 bg-[#F5F7FA] px-5 py-4 text-center align-middle"
                  >
                    Hired
                    <br />
                    Count
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky top-0 z-20 bg-[#F5F7FA] px-5 py-4 text-center align-middle"
                  >
                    Hiring Rate
                    <br />
                    (Leads to JO)
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky top-0 z-20 bg-[#F5F7FA] px-5 py-4 text-center align-middle last:rounded-tr-2xl"
                  >
                    Leads to Interview
                    <br />
                    (To Generate)
                  </th>
                </tr>

                <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                  <th className="sticky top-[48px] z-20 bg-[#F5F7FA] px-5 py-4 text-center align-top">
                    Accepted
                    <br />
                    Job Offer
                  </th>
                  <th className="sticky top-[48px] z-20 bg-[#F5F7FA] px-5 py-4 text-center align-top">
                    NHO
                    <br />
                    Count
                  </th>
                  <th className="sticky top-[48px] z-20 bg-[#F5F7FA] px-5 py-4 text-center align-top">
                    FST
                    <br />
                    Count
                  </th>
                  <th className="sticky top-[48px] z-20 bg-[#F5F7FA] px-5 py-4 text-center align-top">
                    PST
                    <br />
                    Count
                  </th>
                  <th className="sticky top-[48px] z-20 bg-[#F5F7FA] px-5 py-4 text-center align-top">
                    Go Live
                  </th>
                </tr>
              </thead>

              <tbody key={`${safeCurrentPage}-${search}-${accountsLoading}`}>
                {accountsLoading ? (
                  Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                    <tr key={index}>
                      <td
                        className="border-b border-[#E6ECF2] px-5 py-5"
                        colSpan={15}
                      >
                        <div className="h-5 w-full animate-sibs-pulse rounded bg-gray-200" />
                      </td>
                    </tr>
                  ))
                ) : paginatedPlans.length === 0 ? (
                  <tr>
                    <td
                      className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                      colSpan={15}
                    >
                      No workforce hiring plan records found.
                    </td>
                  </tr>
                ) : (
                  paginatedPlans.map(renderRow)
                )}
              </tbody>

              {!accountsLoading && displayPlans.length > 0 && (
                <tfoot>
                  <tr className="bg-[#F8FAFC] text-sm font-extrabold text-sibs-primary-1">
                    <td className="px-5 py-4" colSpan={2}>
                      TOTAL / AVG.
                    </td>
                    <td className="px-5 py-4 text-center">
                      {formatNumber(totals.requiredHeadcount)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {formatNumber(totals.actualHeadcount)}
                    </td>
                    <td
                      className={`px-5 py-4 text-center ${getSignedNumberClass(totals.bufferPercentage)}`}
                    >
                      {formatSignedPercentWhole(totals.bufferPercentage)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {formatNumber(totals.netActualHeadcount)}
                    </td>
                    <td className="px-5 py-4 text-center text-red-600">
                      {formatNumber(totals.hiringNeeded)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {formatNumber(totals.acceptedJobOffer)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {formatNumber(totals.nhoCount)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {formatNumber(totals.fstCount)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {formatNumber(totals.pstCount)}
                    </td>
                    <td className="px-5 py-4 text-center text-emerald-700">
                      {formatNumber(totals.goLiveCount)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {formatNumber(totals.hiredCount)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {formatPercent(totals.hiringRate)}
                    </td>
                    <td className="px-5 py-4 text-center text-violet-700">
                      {formatNumber(totals.leadsToInterviewToGenerate)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
            Hold left click and drag left or right to scroll the table. Click
            any row to view details.
          </p>
        </div>

        <div ref={mobileScrollRef} className="space-y-3 lg:hidden">
          <DesktopTableHeader />

          {accountsLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-sibs-pulse rounded-2xl bg-gray-200"
              />
            ))
          ) : paginatedPlans.length === 0 ? (
            <div className="rounded-2xl border border-[#D9E2EC] bg-[#F8FAFC] px-5 py-12 text-center text-sm font-bold text-gray-500">
              No workforce hiring plan records found.
            </div>
          ) : (
            paginatedPlans.map((item) => {
              const metrics = item.planMetrics || getRowMetrics(item);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleRowClick(item)}
                  className="block w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-[#F8FAFC]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-[#101828]">
                        {item.account || item.accountName || "--"}
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
                        {item.cluster || item.clusterName || "--"}
                      </p>
                    </div>
                    <p className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
                      {formatNumber(metrics.hiringNeeded)} needed
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MobileMetric
                      label="Required HC"
                      value={formatNumber(metrics.requiredHeadcount)}
                    />
                    <MobileMetric
                      label="Actual HC"
                      value={formatNumber(metrics.actualHeadcount)}
                    />
                    <MobileMetric
                      label="Buffer %"
                      value={formatSignedPercentWhole(metrics.bufferPercentage)}
                      valueClassName={getSignedNumberClass(
                        metrics.bufferPercentage,
                      )}
                    />
                    <MobileMetric
                      label="Net Actual HC"
                      value={formatNumber(metrics.netActualHeadcount)}
                    />
                    <MobileMetric
                      label="Accepted JO"
                      value={formatNumber(metrics.acceptedJobOffer)}
                    />
                    <MobileMetric
                      label="NHO / FST / PST"
                      value={`${formatNumber(metrics.nhoCount)} / ${formatNumber(metrics.fstCount)} / ${formatNumber(metrics.pstCount)}`}
                    />
                    <MobileMetric
                      label="Go Live"
                      value={formatNumber(metrics.goLiveCount)}
                      valueClassName="text-emerald-700"
                    />
                    <MobileMetric
                      label="Leads to Interview"
                      value={formatNumber(metrics.leadsToInterviewToGenerate)}
                      valueClassName="text-violet-700"
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-[#E6ECF2] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-sibs-tertiary-5">
            Showing{" "}
            {totalRecords === 0 ? 0 : (safeCurrentPage - 1) * PAGE_LIMIT + 1}–
            {Math.min(safeCurrentPage * PAGE_LIMIT, totalRecords)} of{" "}
            {totalRecords} records
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePreviousPage}
              disabled={accountsLoading || !hasPreviousPage}
              className="h-10 rounded-[10px] border border-[#D0D5DD] bg-white px-4 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="rounded-[10px] border border-[#D0D5DD] bg-[#F8FAFC] px-4 py-2 text-sm font-extrabold text-sibs-primary-1">
              {safeCurrentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={accountsLoading || !hasNextPage}
              className="h-10 rounded-[10px] border border-[#D0D5DD] bg-white px-4 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function MobileMetric({
  label,
  value,
  valueClassName = "text-sibs-primary-1",
}) {
  return (
    <div className="rounded-xl bg-[#F8FAFC] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>
      <p className={`mt-1 text-sm font-extrabold ${valueClassName}`}>{value}</p>
    </div>
  );
}
