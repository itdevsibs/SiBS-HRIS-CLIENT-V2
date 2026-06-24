import React, { useEffect, useMemo, useRef, useState } from "react";
import { ListChecks } from "lucide-react";

import PaginationTable from "@/services/pagination/PaginationTable";

const PAGE_LIMIT = 15;

function getNumberValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      const numberValue = Number(value);

      if (Number.isFinite(numberValue)) {
        return numberValue;
      }
    }
  }

  return 0;
}

function safeDivide(numerator, denominator) {
  const cleanNumerator = Number(numerator || 0);
  const cleanDenominator = Number(denominator || 0);

  if (!Number.isFinite(cleanNumerator) || !Number.isFinite(cleanDenominator)) {
    return 0;
  }

  if (cleanDenominator === 0) return 0;

  return cleanNumerator / cleanDenominator;
}

function formatPercent(value) {
  const numberValue = Number(value || 0);

  if (Math.abs(numberValue) > 0 && Math.abs(numberValue) <= 1) {
    return `${(numberValue * 100).toFixed(2)}%`;
  }

  return `${numberValue.toFixed(2)}%`;
}

function formatNumber(value, maximumFractionDigits = 0) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits,
  });
}

function getStatusClass(status) {
  switch (status) {
    case "On Track":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "At Risk":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Delayed":
      return "border-red-200 bg-red-50 text-red-700";
    case "Completed":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "In Progress":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case "Pending":
      return "border-gray-200 bg-gray-50 text-gray-700";
    case "Not Started":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function calculatePipelineStatus(metrics) {
  const requiredHeadcount = Number(metrics.requiredHeadcount || 0);
  const hiringNeeded = Number(metrics.hiringNeeded || 0);
  const leadsToInterview = Number(metrics.leadsToInterview || 0);
  const interviewCount = Number(metrics.interviewCount || 0);

  if (requiredHeadcount <= 0) return "Pending";
  if (hiringNeeded <= 0) return "Completed";
  if (interviewCount <= 0 && hiringNeeded > 0) return "Not Started";
  if (leadsToInterview > 0) return "At Risk";

  return "On Track";
}

function getRowMetrics(item) {
  const requiredHeadcount = getNumberValue(
    item.requiredHeadcount,
    item.required_headcount,
  );

  const actualHeadcount = getNumberValue(
    item.actualHeadcount,
    item.actual_headcount,
  );

  const absenteeismSixWeeks = getNumberValue(
    item.absenteeismSixWeeks,
    item.absenteeism_6_weeks,
    item.absenteeismPastSixWeeks,
    item.absenteeism_past_six_weeks,
    item.absenteeismCount,
    item.absenteeism_count,
    item.absenteeismPastCount,
    item.absenteeism_past_count,
    item.absenteeismPastSixWeeksAverage,
    item.absenteeism_past_six_weeks_average,
  );

  const attritionSixWeeks = getNumberValue(
    item.attritionSixWeeks,
    item.attrition_6_weeks,
    item.attritionPastSixWeeks,
    item.attrition_past_six_weeks,
    item.attritionPastCount,
    item.attrition_past_count,
    item.attritionCount,
    item.attrition_count,
    item.attritionPastSixWeeksAverage,
    item.attrition_past_six_weeks_average,
  );

  const netActualHeadcount =
    actualHeadcount - absenteeismSixWeeks - attritionSixWeeks;

  const bufferPercentage = safeDivide(
    netActualHeadcount - requiredHeadcount,
    requiredHeadcount,
  );

  const absenteeismPercentage = safeDivide(
    absenteeismSixWeeks,
    actualHeadcount,
  );

  const attritionPercentage = safeDivide(attritionSixWeeks, actualHeadcount);

  const hiringNeeded = Math.max(0, requiredHeadcount - netActualHeadcount);

  const interviewCount = getNumberValue(
    item.interviewCount,
    item.interview_count,
    item.interviewPopulationCount,
    item.interview_population_count,
  );

  const nhoCount = getNumberValue(
    item.nhoCount,
    item.nho_count,
    item.nhoPopulationCount,
    item.nho_population_count,
  );

  const fstCount = getNumberValue(
    item.fstCount,
    item.fst_count,
    item.fstPopulationCount,
    item.fst_population_count,
  );

  const pstCount = getNumberValue(
    item.pstCount,
    item.pst_count,
    item.pstPopulationCount,
    item.pst_population_count,
  );

  const attritionInterviewToNhoCount = Math.max(0, interviewCount - nhoCount);

  const attritionInterviewToNhoPercent = safeDivide(
    attritionInterviewToNhoCount,
    interviewCount,
  );

  const attritionNhoToFstCount = Math.max(0, nhoCount - fstCount);

  const attritionNhoToFstPercent = safeDivide(
    attritionNhoToFstCount,
    nhoCount,
  );

  const attritionFstToPstCount = Math.max(0, fstCount - pstCount);

  const attritionFstToPstPercent = safeDivide(
    attritionFstToPstCount,
    fstCount,
  );

  const attritionNhoToPstCount = Math.max(0, nhoCount - pstCount);

  const attritionNhoToPstPercent = safeDivide(
    attritionNhoToPstCount,
    nhoCount,
  );

  const hiredCount = fstCount + pstCount;

  const hiringRate = safeDivide(hiredCount, interviewCount);

  const leadsToInterview =
    hiringNeeded <= 0
      ? 0
      : hiringRate > 0
        ? Math.ceil(hiringNeeded / hiringRate)
        : hiringNeeded;

  const pipelineStatus = calculatePipelineStatus({
    requiredHeadcount,
    hiringNeeded,
    leadsToInterview,
    interviewCount,
  });

  return {
    requiredHeadcount,
    actualHeadcount,

    absenteeismSixWeeks,
    absenteeismPercentage,

    attritionSixWeeks,
    attritionPercentage,

    netActualHeadcount,
    bufferPercentage,
    hiringNeeded,

    interviewCount,
    nhoCount,
    fstCount,
    pstCount,

    attritionInterviewToNhoCount,
    attritionInterviewToNhoPercent,

    attritionNhoToFstCount,
    attritionNhoToFstPercent,

    attritionFstToPstCount,
    attritionFstToPstPercent,

    attritionNhoToPstCount,
    attritionNhoToPstPercent,

    hiredCount,
    hiringRate,
    leadsToInterview,

    pipelineStatus,
  };
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

      <p className={`mt-1 text-sm font-extrabold ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}

function HeaderCell({ children, note, className = "" }) {
  return (
    <th
      className={`sticky top-0 z-20 bg-[#F5F7FA] px-5 py-4 text-center align-top ${className}`}
    >
      <div className="leading-tight">{children}</div>

      {note && (
        <div className="mx-auto mt-1 max-w-[190px] text-[10px] font-bold normal-case leading-tight text-sibs-tertiary-5">
          ({note})
        </div>
      )}
    </th>
  );
}

function ColumnGroup() {
  return (
    <colgroup>
      <col style={{ width: "240px" }} />
      <col style={{ width: "150px" }} />
      <col style={{ width: "150px" }} />
      <col style={{ width: "170px" }} />
      <col style={{ width: "170px" }} />
      <col style={{ width: "170px" }} />
      <col style={{ width: "160px" }} />
      <col style={{ width: "160px" }} />
      <col style={{ width: "170px" }} />
      <col style={{ width: "170px" }} />
      <col style={{ width: "160px" }} />
      <col style={{ width: "140px" }} />
      <col style={{ width: "140px" }} />
      <col style={{ width: "140px" }} />
      <col style={{ width: "210px" }} />
      <col style={{ width: "210px" }} />
      <col style={{ width: "190px" }} />
      <col style={{ width: "190px" }} />
      <col style={{ width: "190px" }} />
      <col style={{ width: "190px" }} />
      <col style={{ width: "190px" }} />
      <col style={{ width: "190px" }} />
      <col style={{ width: "150px" }} />
      <col style={{ width: "150px" }} />
      <col style={{ width: "170px" }} />
      <col style={{ width: "170px" }} />
      <col style={{ width: "280px" }} />
    </colgroup>
  );
}

function DesktopTableHeader() {
  return (
    <table className="w-full table-fixed border-separate border-spacing-0 bg-white text-left">
      <ColumnGroup />

      <thead>
        <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
          <th className="px-5 py-4 text-left align-top first:rounded-tl-2xl">
            Account
          </th>

          <HeaderCell>Required Headcount</HeaderCell>

          <HeaderCell>Actual Headcount</HeaderCell>

          <HeaderCell note="((Actual HC - Absenteeism - Attrition) - Required HC) ÷ Required HC">
            Buffer %
          </HeaderCell>

          <HeaderCell>Absenteeism 6 Weeks</HeaderCell>

          <HeaderCell note="Absenteeism 6 Weeks ÷ Actual HC">
            Absenteeism %
          </HeaderCell>

          <HeaderCell>Attrition 6 Weeks</HeaderCell>

          <HeaderCell note="Attrition 6 Weeks ÷ Actual HC">
            Attrition %
          </HeaderCell>

          <HeaderCell note="Actual HC - Absenteeism - Attrition">
            Net Actual HC
          </HeaderCell>

          <HeaderCell note="MAX(0, Required HC - Net Actual HC)">
            Hiring Needed
          </HeaderCell>

          <HeaderCell>Interview Count</HeaderCell>

          <HeaderCell>NHO Count</HeaderCell>

          <HeaderCell>FST Count</HeaderCell>

          <HeaderCell>PST Count</HeaderCell>

          <HeaderCell note="MAX(0, Interview - NHO)">
            Attrition Count Interview to NHO
          </HeaderCell>

          <HeaderCell note="Attrition Interview to NHO ÷ Interview">
            Attrition % Interview to NHO
          </HeaderCell>

          <HeaderCell note="MAX(0, NHO - FST)">
            Attrition Count NHO to FST
          </HeaderCell>

          <HeaderCell note="Attrition NHO to FST ÷ NHO">
            Attrition % NHO to FST
          </HeaderCell>

          <HeaderCell note="MAX(0, FST - PST)">
            Attrition Count FST to PST
          </HeaderCell>

          <HeaderCell note="Attrition FST to PST ÷ FST">
            Attrition % FST to PST
          </HeaderCell>

          <HeaderCell note="MAX(0, NHO - PST)">
            Attrition Count NHO to PST
          </HeaderCell>

          <HeaderCell note="Attrition NHO to PST ÷ NHO">
            Attrition % NHO to PST
          </HeaderCell>

          <HeaderCell note="FST Count + PST Count">Hired Count</HeaderCell>

          <HeaderCell note="Hired Count ÷ Interview Count">
            Hiring Rate
          </HeaderCell>

          <HeaderCell note="If Hiring Rate is 0, use Hiring Needed. Otherwise ROUNDUP(Hiring Needed ÷ Hiring Rate)">
            Leads to Interview
          </HeaderCell>

          <HeaderCell>Status</HeaderCell>

          <th className="px-5 py-4 text-left align-top last:rounded-tr-2xl">
            Status Note
          </th>
        </tr>
      </thead>
    </table>
  );
}

export default function WeeklyHiringAccountsTable({
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
  const [statusFilter, setStatusFilter] = useState("All");

  const safePlans = Array.isArray(filteredPlans) ? filteredPlans : [];

  const computedPlans = useMemo(() => {
    return safePlans.map((item) => {
      const metrics = getRowMetrics(item);

      return {
        ...item,

        requiredHeadcount: metrics.requiredHeadcount,
        required_headcount: metrics.requiredHeadcount,

        actualHeadcount: metrics.actualHeadcount,
        actual_headcount: metrics.actualHeadcount,

        absenteeismSixWeeks: metrics.absenteeismSixWeeks,
        absenteeism_6_weeks: metrics.absenteeismSixWeeks,
        absenteeismPercentage: metrics.absenteeismPercentage,
        absenteeism_percentage: metrics.absenteeismPercentage,

        attritionSixWeeks: metrics.attritionSixWeeks,
        attrition_6_weeks: metrics.attritionSixWeeks,
        attritionPercentage: metrics.attritionPercentage,
        attrition_percentage: metrics.attritionPercentage,

        netActualHeadcount: metrics.netActualHeadcount,
        net_actual_headcount: metrics.netActualHeadcount,

        bufferPercentage: metrics.bufferPercentage,
        buffer_percentage: metrics.bufferPercentage,
        bufferPercent: metrics.bufferPercentage,
        buffer_percent: metrics.bufferPercentage,

        hiringNeeded: metrics.hiringNeeded,
        hiring_needed: metrics.hiringNeeded,
        actualHeadcountNeeds: metrics.hiringNeeded,
        actual_headcount_needs: metrics.hiringNeeded,

        interviewCount: metrics.interviewCount,
        interview_count: metrics.interviewCount,

        nhoCount: metrics.nhoCount,
        nho_count: metrics.nhoCount,

        fstCount: metrics.fstCount,
        fst_count: metrics.fstCount,

        pstCount: metrics.pstCount,
        pst_count: metrics.pstCount,

        attritionInterviewToNhoCount: metrics.attritionInterviewToNhoCount,
        attrition_interview_to_nho_count:
          metrics.attritionInterviewToNhoCount,
        attritionInterviewToNhoPercent:
          metrics.attritionInterviewToNhoPercent,
        attrition_interview_to_nho_percent:
          metrics.attritionInterviewToNhoPercent,

        attritionNhoToFstCount: metrics.attritionNhoToFstCount,
        attrition_nho_to_fst_count: metrics.attritionNhoToFstCount,
        attritionNhoToFstPercent: metrics.attritionNhoToFstPercent,
        attrition_nho_to_fst_percent: metrics.attritionNhoToFstPercent,

        attritionFstToPstCount: metrics.attritionFstToPstCount,
        attrition_fst_to_pst_count: metrics.attritionFstToPstCount,
        attritionFstToPstPercent: metrics.attritionFstToPstPercent,
        attrition_fst_to_pst_percent: metrics.attritionFstToPstPercent,

        attritionNhoToPstCount: metrics.attritionNhoToPstCount,
        attrition_nho_to_pst_count: metrics.attritionNhoToPstCount,
        attritionNhoToPstPercent: metrics.attritionNhoToPstPercent,
        attrition_nho_to_pst_percent: metrics.attritionNhoToPstPercent,

        hiredCount: metrics.hiredCount,
        hired_count: metrics.hiredCount,

        hiringRate: metrics.hiringRate,
        hiring_rate: metrics.hiringRate,

        leadsToInterview: metrics.leadsToInterview,
        leads_to_interview: metrics.leadsToInterview,

        pipelineStatus: metrics.pipelineStatus,
        pipeline_status: metrics.pipelineStatus,

        excelMetrics: metrics,
      };
    });
  }, [safePlans]);

  const statusOptions = useMemo(() => {
    const statuses = new Set();

    computedPlans.forEach((item) => {
      const value = String(item.pipelineStatus || "").trim();
      if (value) statuses.add(value);
    });

    return [
      { label: "All Status", value: "All" },
      ...Array.from(statuses)
        .sort()
        .map((value) => ({
          label: value,
          value,
        })),
    ];
  }, [computedPlans]);

  const displayPlans = useMemo(() => {
    const keyword = String(search || "").trim().toLowerCase();

    return computedPlans.filter((item) => {
      const status = String(item.pipelineStatus || "").trim();

      const matchesStatus =
        statusFilter === "All" ||
        status.toLowerCase() === statusFilter.toLowerCase();

      const metrics = item.excelMetrics || getRowMetrics(item);

      const searchableText = [
        item.id,
        item.week,
        item.account,
        item.cluster,
        item.pipelineStatus,
        item.statusNote,
        metrics.requiredHeadcount,
        metrics.actualHeadcount,
        metrics.bufferPercentage,
        metrics.absenteeismSixWeeks,
        metrics.absenteeismPercentage,
        metrics.attritionSixWeeks,
        metrics.attritionPercentage,
        metrics.netActualHeadcount,
        metrics.hiringNeeded,
        metrics.interviewCount,
        metrics.nhoCount,
        metrics.fstCount,
        metrics.pstCount,
        metrics.attritionInterviewToNhoCount,
        metrics.attritionInterviewToNhoPercent,
        metrics.attritionNhoToFstCount,
        metrics.attritionNhoToFstPercent,
        metrics.attritionFstToPstCount,
        metrics.attritionFstToPstPercent,
        metrics.attritionNhoToPstCount,
        metrics.attritionNhoToPstPercent,
        metrics.hiredCount,
        metrics.hiringRate,
        metrics.leadsToInterview,
      ]
        .filter((value) => value !== undefined && value !== null)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [computedPlans, search, statusFilter]);

  const totalRecords = displayPlans.length;
  const totalPages = Math.max(Math.ceil(totalRecords / PAGE_LIMIT), 1);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const paginatedPlans = useMemo(() => {
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const startIndex = (safePage - 1) * PAGE_LIMIT;

    return displayPlans.slice(startIndex, startIndex + PAGE_LIMIT);
  }, [displayPlans, currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredPlans, search, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({
        left: 0,
        behavior: "smooth",
      });
    }

    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [currentPage, search, statusFilter]);

  function handlePreviousPage() {
    if (accountsLoading || !hasPreviousPage) return;
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }

  function handleNextPage() {
    if (accountsLoading || !hasNextPage) return;
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }

  function handleSearchKeyDown(e) {
    if (e.key !== "Enter") return;

    setSearch(searchInput);
    setCurrentPage(1);
  }

  function handleStatusChange(nextStatus) {
    setStatusFilter(nextStatus);
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

  return (
    <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
      <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <ListChecks size={14} />
              Account Plan
            </div>
          </div>

          <div className="inline-flex w-fit rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#344054]">
            Records: {totalRecords}
          </div>
        </div>

        <div className="mt-4">
          <PaginationTable
            title="Weekly Hiring Accounts"
            subtitle="Excel-based computation: Net Actual HC, Hiring Needed, Stage Attrition, Hiring Rate, and Leads to Interview."
            loading={accountsLoading}
            searchValue={searchInput}
            searchPlaceholder="Search account then press Enter"
            onSearchChange={(value) => setSearchInput(value)}
            onSearchKeyDown={handleSearchKeyDown}
            filters={[
              {
                key: "pipelineStatus",
                value: statusFilter,
                onChange: handleStatusChange,
                options: statusOptions,
              },
            ]}
            showPagination={false}
          />
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="hidden lg:block">
          <div
            ref={tableScrollRef}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            className={`max-h-[670px] overflow-auto rounded-2xl border border-[#D9E2EC] bg-white select-none ${
              isDraggingTable ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            <table className="w-full min-w-[4100px] table-fixed border-separate border-spacing-0 bg-white text-left">
              <ColumnGroup />

              <thead>
                <tr className="text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                  <th className="sticky top-0 z-20 bg-[#F5F7FA] px-5 py-4 text-left align-top first:rounded-tl-2xl">
                    Account
                  </th>

                  <HeaderCell>Required Headcount</HeaderCell>

                  <HeaderCell>Actual Headcount</HeaderCell>

                  <HeaderCell note="((Actual HC - Absenteeism - Attrition) - Required HC) ÷ Required HC">
                    Buffer %
                  </HeaderCell>

                  <HeaderCell>Absenteeism 6 Weeks</HeaderCell>

                  <HeaderCell note="Absenteeism 6 Weeks ÷ Actual HC">
                    Absenteeism %
                  </HeaderCell>

                  <HeaderCell>Attrition 6 Weeks</HeaderCell>

                  <HeaderCell note="Attrition 6 Weeks ÷ Actual HC">
                    Attrition %
                  </HeaderCell>

                  <HeaderCell note="Actual HC - Absenteeism - Attrition">
                    Net Actual HC
                  </HeaderCell>

                  <HeaderCell note="MAX(0, Required HC - Net Actual HC)">
                    Hiring Needed
                  </HeaderCell>

                  <HeaderCell>Interview Count</HeaderCell>

                  <HeaderCell>NHO Count</HeaderCell>

                  <HeaderCell>FST Count</HeaderCell>

                  <HeaderCell>PST Count</HeaderCell>

                  <HeaderCell note="MAX(0, Interview - NHO)">
                    Attrition Count Interview to NHO
                  </HeaderCell>

                  <HeaderCell note="Attrition Interview to NHO ÷ Interview">
                    Attrition % Interview to NHO
                  </HeaderCell>

                  <HeaderCell note="MAX(0, NHO - FST)">
                    Attrition Count NHO to FST
                  </HeaderCell>

                  <HeaderCell note="Attrition NHO to FST ÷ NHO">
                    Attrition % NHO to FST
                  </HeaderCell>

                  <HeaderCell note="MAX(0, FST - PST)">
                    Attrition Count FST to PST
                  </HeaderCell>

                  <HeaderCell note="Attrition FST to PST ÷ FST">
                    Attrition % FST to PST
                  </HeaderCell>

                  <HeaderCell note="MAX(0, NHO - PST)">
                    Attrition Count NHO to PST
                  </HeaderCell>

                  <HeaderCell note="Attrition NHO to PST ÷ NHO">
                    Attrition % NHO to PST
                  </HeaderCell>

                  <HeaderCell note="FST Count + PST Count">Hired Count</HeaderCell>

                  <HeaderCell note="Hired Count ÷ Interview Count">
                    Hiring Rate
                  </HeaderCell>

                  <HeaderCell note="If Hiring Rate is 0, use Hiring Needed. Otherwise ROUNDUP(Hiring Needed ÷ Hiring Rate)">
                    Leads to Interview
                  </HeaderCell>

                  <HeaderCell>Status</HeaderCell>

                  <th className="sticky top-0 z-20 bg-[#F5F7FA] px-5 py-4 text-left align-top last:rounded-tr-2xl">
                    Status Note
                  </th>
                </tr>
              </thead>

              <tbody key={`${currentPage}-${search}-${statusFilter}-${accountsLoading}`}>
                {accountsLoading ? (
                  Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                    <tr key={index}>
                      <td
                        className="border-b border-[#E6ECF2] px-5 py-5"
                        colSpan={27}
                      >
                        <div className="h-5 w-full animate-sibs-pulse rounded bg-gray-200" />
                      </td>
                    </tr>
                  ))
                ) : paginatedPlans.length === 0 ? (
                  <tr>
                    <td
                      className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                      colSpan={27}
                    >
                      No weekly hiring plan records found.
                    </td>
                  </tr>
                ) : (
                  paginatedPlans.map((item) => {
                    const metrics = item.excelMetrics || getRowMetrics(item);

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
                          <p className="max-w-[220px] truncate text-sm font-extrabold text-[#101828]">
                            {item.account || "--"}
                          </p>

                          <p className="mt-1 max-w-[220px] truncate text-xs font-semibold text-sibs-tertiary-5">
                            {item.cluster || "--"}
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
                          className={`border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold ${
                            metrics.bufferPercentage < 0
                              ? "text-red-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {formatPercent(metrics.bufferPercentage)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
                          {formatNumber(metrics.absenteeismSixWeeks)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
                          {formatPercent(metrics.absenteeismPercentage)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
                          {formatNumber(metrics.attritionSixWeeks)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
                          {formatPercent(metrics.attritionPercentage)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-sibs-primary-1">
                          {formatNumber(metrics.netActualHeadcount)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-violet-700">
                          {formatNumber(metrics.hiringNeeded)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
                          {formatNumber(metrics.interviewCount)}
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

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-red-700">
                          {formatNumber(metrics.attritionInterviewToNhoCount)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-red-700">
                          {formatPercent(metrics.attritionInterviewToNhoPercent)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-red-700">
                          {formatNumber(metrics.attritionNhoToFstCount)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-red-700">
                          {formatPercent(metrics.attritionNhoToFstPercent)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-red-700">
                          {formatNumber(metrics.attritionFstToPstCount)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-red-700">
                          {formatPercent(metrics.attritionFstToPstPercent)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-red-700">
                          {formatNumber(metrics.attritionNhoToPstCount)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-red-700">
                          {formatPercent(metrics.attritionNhoToPstPercent)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-sibs-primary-1">
                          {formatNumber(metrics.hiredCount)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-sibs-primary-1">
                          {formatPercent(metrics.hiringRate)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-violet-700">
                          {formatNumber(metrics.leadsToInterview)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
                          <span
                            className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                              item.pipelineStatus,
                            )}`}
                          >
                            {item.pipelineStatus || "--"}
                          </span>
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5">
                          <p className="line-clamp-2 max-w-[260px] text-sm font-semibold leading-5 text-[#344054]">
                            {item.statusNote || "--"}
                          </p>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
            Hold left click and drag left or right to scroll the table. Click any row to
            view details.
          </p>
        </div>

        <div className="block lg:hidden">
          <div ref={mobileScrollRef} className="max-h-[670px] overflow-y-auto">
            {accountsLoading ? (
              <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-10 text-center text-sm font-bold text-gray-500">
                Loading weekly hiring plan records...
              </div>
            ) : paginatedPlans.length === 0 ? (
              <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-10 text-center text-sm font-bold text-gray-500">
                No weekly hiring plan records found.
              </div>
            ) : (
              <div
                key={`${currentPage}-${search}-${statusFilter}`}
                className="space-y-3"
              >
                {paginatedPlans.map((item) => {
                  const metrics = item.excelMetrics || getRowMetrics(item);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onViewPlan?.(item)}
                      className="w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-extrabold leading-tight text-[#101828]">
                            {item.account || "--"}
                          </h3>

                          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                            {item.cluster || "--"}
                          </p>

                          {item.week && (
                            <p className="mt-1 text-[11px] font-bold text-[#667085]">
                              {item.week}
                            </p>
                          )}
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
                            item.pipelineStatus,
                          )}`}
                        >
                          {item.pipelineStatus || "--"}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
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
                          value={formatPercent(metrics.bufferPercentage)}
                          valueClassName={
                            metrics.bufferPercentage < 0
                              ? "text-red-700"
                              : "text-emerald-700"
                          }
                        />

                        <MobileMetric
                          label="Absenteeism 6 Weeks"
                          value={formatNumber(metrics.absenteeismSixWeeks)}
                        />

                        <MobileMetric
                          label="Absenteeism %"
                          value={formatPercent(metrics.absenteeismPercentage)}
                        />

                        <MobileMetric
                          label="Attrition 6 Weeks"
                          value={formatNumber(metrics.attritionSixWeeks)}
                        />

                        <MobileMetric
                          label="Attrition %"
                          value={formatPercent(metrics.attritionPercentage)}
                        />

                        <MobileMetric
                          label="Net Actual HC"
                          value={formatNumber(metrics.netActualHeadcount)}
                        />

                        <MobileMetric
                          label="Hiring Needed"
                          value={formatNumber(metrics.hiringNeeded)}
                          valueClassName="text-violet-700"
                        />

                        <MobileMetric
                          label="Interview Count"
                          value={formatNumber(metrics.interviewCount)}
                        />

                        <MobileMetric
                          label="NHO Count"
                          value={formatNumber(metrics.nhoCount)}
                        />

                        <MobileMetric
                          label="FST Count"
                          value={formatNumber(metrics.fstCount)}
                        />

                        <MobileMetric
                          label="PST Count"
                          value={formatNumber(metrics.pstCount)}
                        />

                        <MobileMetric
                          label="Attrition Interview to NHO"
                          value={formatNumber(
                            metrics.attritionInterviewToNhoCount,
                          )}
                          valueClassName="text-red-700"
                        />

                        <MobileMetric
                          label="Attrition % Interview to NHO"
                          value={formatPercent(
                            metrics.attritionInterviewToNhoPercent,
                          )}
                          valueClassName="text-red-700"
                        />

                        <MobileMetric
                          label="Attrition NHO to FST"
                          value={formatNumber(metrics.attritionNhoToFstCount)}
                          valueClassName="text-red-700"
                        />

                        <MobileMetric
                          label="Attrition % NHO to FST"
                          value={formatPercent(
                            metrics.attritionNhoToFstPercent,
                          )}
                          valueClassName="text-red-700"
                        />

                        <MobileMetric
                          label="Attrition FST to PST"
                          value={formatNumber(metrics.attritionFstToPstCount)}
                          valueClassName="text-red-700"
                        />

                        <MobileMetric
                          label="Attrition % FST to PST"
                          value={formatPercent(
                            metrics.attritionFstToPstPercent,
                          )}
                          valueClassName="text-red-700"
                        />

                        <MobileMetric
                          label="Attrition NHO to PST"
                          value={formatNumber(metrics.attritionNhoToPstCount)}
                          valueClassName="text-red-700"
                        />

                        <MobileMetric
                          label="Attrition % NHO to PST"
                          value={formatPercent(
                            metrics.attritionNhoToPstPercent,
                          )}
                          valueClassName="text-red-700"
                        />

                        <MobileMetric
                          label="Hired Count"
                          value={formatNumber(metrics.hiredCount)}
                        />

                        <MobileMetric
                          label="Hiring Rate"
                          value={formatPercent(metrics.hiringRate)}
                        />

                        <MobileMetric
                          label="Leads to Interview"
                          value={formatNumber(metrics.leadsToInterview)}
                          valueClassName="text-violet-700"
                        />
                      </div>

                      <div className="mt-4 rounded-xl bg-[#F8FAFC] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                          Status Note
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#344054]">
                          {item.statusNote || "--"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <PaginationTable
          loading={accountsLoading}
          showSearch={false}
          showPagination
          currentPage={currentPage}
          totalPages={totalPages}
          loadedCount={paginatedPlans.length}
          totalRecords={totalRecords}
          recordLabel="weekly hiring account records"
          onPrevious={handlePreviousPage}
          onNext={handleNextPage}
        />
      </div>
    </section>
  );
}