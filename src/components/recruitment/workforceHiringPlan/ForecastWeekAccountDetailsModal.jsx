import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BarChart2, Search, X } from "lucide-react";
import {
  formatOverviewNumber,
  formatOverviewPercent,
} from "../../../lib/utils/workforceHiringOverview/workforceHiringOverviewHelpers";

function safeNumber(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getRowNumber(row = {}, keys = [], fallback = 0) {
  for (const key of keys) {
    const value = row?.[key];

    if (value !== null && value !== undefined && value !== "") {
      return safeNumber(value);
    }
  }

  return safeNumber(fallback);
}

function getRowText(row = {}, keys = [], fallback = "") {
  for (const key of keys) {
    const value = row?.[key];

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return fallback;
}

function getValueColor(value) {
  const numberValue = safeNumber(value);

  if (numberValue < 0) return "text-red-600";
  if (numberValue > 0) return "text-emerald-600";

  return "text-sibs-primary-90";
}

function getHiringNeededColor(value) {
  return safeNumber(value) > 0 ? "text-red-600" : "text-emerald-600";
}

import {
  WorkforceHeaderTh,
  WorkforceBodyTd,
  WorkforceFooterTd,
  WORKFORCE_BOLD_NUMBER_CLASS,
  WORKFORCE_SECONDARY_NUMBER_CLASS,
  WorkforceMetricWithPercent,
  WorkforceHiringNeededValue,
  getWorkforceValueColor,
} from "./WorkforceHiringTablePrimitives";

function ForecastMetricWithPercent({
  value,
  percent,
  percentClassName = "text-slate-500",
}) {
  return (
    <div className="leading-tight">
      <div>{formatOverviewNumber(value)}</div>
      <div
        className={["mt-0.5 text-[10px] font-extrabold", percentClassName].join(
          " ",
        )}
      >
        {formatOverviewPercent(percent)}
      </div>
    </div>
  );
}

function normalizeForecastAccountRow(row = {}) {
  const requiredHeadcount = getRowNumber(row, [
    "requiredHeadcount",
    "required_headcount",
  ]);

  const actualHeadcount = getRowNumber(row, [
    "actualHeadcount",
    "actual_headcount",
  ]);

  const absenteeism = getRowNumber(row, [
    "absenteeism",
    "absenteeismCount",
    "absenteeism_count",
    "averageAbsentHeadcount",
    "average_absent_headcount",
  ]);

  const attrition = getRowNumber(row, [
    "attrition",
    "attritionCount",
    "attrition_count",
    "attritionPastCount",
    "attrition_past_count",
  ]);

  const netActualHc = getRowNumber(
    row,
    [
      "netActualHc",
      "net_actual_hc",
      "netActualHeadcount",
      "net_actual_headcount",
    ],
    actualHeadcount - absenteeism - attrition,
  );

  const hiringNeeded = getRowNumber(
    row,
    [
      "hiringNeeded",
      "hiring_needed",
      "actualHeadcountNeeds",
      "actual_headcount_needs",
    ],
    Math.max(0, requiredHeadcount - netActualHc),
  );

  return {
    id: row?.id,
    cluster: getRowText(
      row,
      ["clusterName", "cluster_name", "cluster"],
      "Unassigned",
    ),
    account: getRowText(
      row,
      ["accountName", "account_name", "account", "ghlName", "ghl_name"],
      "Unassigned",
    ),

    requiredHeadcount,
    actualHeadcount,

    bufferPercentage: getRowNumber(row, [
      "bufferPercentage",
      "buffer_percentage",
      "bufferPercent",
      "buffer_percent",
    ]),

    absenteeism,
    absenteeismPercentage: getRowNumber(row, [
      "absenteeismPercentage",
      "absenteeism_percentage",
      "absenteeismPercent",
      "absenteeism_percent",
      "averageAbsenteeismPercent",
      "average_absenteeism_percent",
    ]),

    attrition,
    attritionPercentage: getRowNumber(row, [
      "attritionPercentage",
      "attrition_percentage",
      "attritionPercent",
      "attrition_percent",
      "attritionPastPercent",
      "attrition_past_percent",
    ]),

    netActualHc,
    hiringNeeded,

    acceptedJo: getRowNumber(row, [
      "acceptedJo",
      "acceptedJO",
      "accepted_jo",
      "acceptedJobOffer",
      "accepted_job_offer",
      "interviewCount",
      "interview_count",
    ]),

    nho: getRowNumber(row, ["nho", "nhoCount", "nho_count"]),
    fst: getRowNumber(row, ["fst", "fstCount", "fst_count"]),
    pst: getRowNumber(row, ["pst", "pstCount", "pst_count"]),

    goLive: getRowNumber(row, [
      "goLive",
      "go_live",
      "goLiveCount",
      "go_live_count",
      "projectedToBeEndorsed",
      "projected_to_be_endorsed",
    ]),

    hiredCount: getRowNumber(row, ["hiredCount", "hired_count", "hired"]),

    hiringRate: getRowNumber(row, [
      "hiringRate",
      "hiring_rate",
      "hiringPlanPercent",
      "hiring_plan_percent",
    ]),

    leadsToInterview: getRowNumber(row, [
      "leadsToInterview",
      "leads_to_interview",
      "targetLeads",
      "target_leads",
    ]),
  };
}

function buildTotalsFromRows(rows = []) {
  const safeRows = Array.isArray(rows) ? rows : [];

  const totals = safeRows.reduce(
    (acc, row) => {
      acc.requiredHeadcount += safeNumber(row.requiredHeadcount);
      acc.actualHeadcount += safeNumber(row.actualHeadcount);
      acc.absenteeism += safeNumber(row.absenteeism);
      acc.attrition += safeNumber(row.attrition);
      acc.acceptedJo += safeNumber(row.acceptedJo);
      acc.nho += safeNumber(row.nho);
      acc.fst += safeNumber(row.fst);
      acc.pst += safeNumber(row.pst);
      acc.goLive += safeNumber(row.goLive);
      acc.hiredCount += safeNumber(row.hiredCount);

      return acc;
    },
    {
      requiredHeadcount: 0,
      actualHeadcount: 0,
      absenteeism: 0,
      attrition: 0,
      acceptedJo: 0,
      nho: 0,
      fst: 0,
      pst: 0,
      goLive: 0,
      hiredCount: 0,
    },
  );

  const netActualHc = Math.max(
    0,
    totals.actualHeadcount - totals.absenteeism - totals.attrition,
  );

  const bufferPercentage =
    totals.requiredHeadcount > 0
      ? ((netActualHc - totals.requiredHeadcount) / totals.requiredHeadcount) *
        100
      : 0;

  const absenteeismPercentage =
    totals.actualHeadcount > 0
      ? (totals.absenteeism / totals.actualHeadcount) * 100
      : 0;

  const attritionPercentage =
    totals.actualHeadcount > 0
      ? (totals.attrition / totals.actualHeadcount) * 100
      : 0;

  const hiringNeeded = Math.max(0, totals.requiredHeadcount - netActualHc);

  const hiringRate =
    totals.acceptedJo > 0 ? (totals.fst / totals.acceptedJo) * 100 : 0;

  const hiringRateDecimal = hiringRate / 100;

  const leadsToInterview =
    hiringNeeded <= 0
      ? 0
      : hiringRateDecimal > 0
        ? Math.ceil(hiringNeeded / hiringRateDecimal)
        : hiringNeeded;

  return {
    ...totals,
    bufferPercentage,
    absenteeismPercentage,
    attritionPercentage,
    netActualHc,
    hiringNeeded,
    hiringRate,
    leadsToInterview,
  };
}

function getFilteredRows(rows = [], searchValue = "") {
  const cleanSearch = String(searchValue || "")
    .trim()
    .toLowerCase();

  if (!cleanSearch) return rows;

  return rows.filter((row) => {
    const haystack = [row.cluster, row.account].join(" ").toLowerCase();

    return haystack.includes(cleanSearch);
  });
}

export default function ForecastWeekAccountDetailsModal({
  open,
  forecastWeek,
  rows = [],
  onClose,
}) {
  const [searchValue, setSearchValue] = useState("");
  const dragScrollRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  function handleDragStart(event) {
    const container = dragScrollRef.current;
    if (!container) return;
    if (event.target.closest("button, input, select, textarea, a")) return;

    isDraggingRef.current = true;
    setIsDragging(true);
    startXRef.current = event.pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;
    container.style.userSelect = "none";
  }

  function handleDragMove(event) {
    const container = dragScrollRef.current;
    if (!container || !isDraggingRef.current) return;

    event.preventDefault();
    const x = event.pageX - container.offsetLeft;
    container.scrollLeft = scrollLeftRef.current - (x - startXRef.current);
  }

  function handleDragEnd() {
    const container = dragScrollRef.current;
    isDraggingRef.current = false;
    setIsDragging(false);
    if (container) container.style.userSelect = "";
  }

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, open]);

  useEffect(() => {
    if (open) {
      setSearchValue("");
    }
  }, [open, forecastWeek?.weekStart]);

  const normalizedRows = useMemo(
    () => rows.map(normalizeForecastAccountRow),
    [rows],
  );

  const filteredRows = useMemo(
    () => getFilteredRows(normalizedRows, searchValue),
    [normalizedRows, searchValue],
  );

  const totals = useMemo(
    () => buildTotalsFromRows(filteredRows),
    [filteredRows],
  );

  if (!open) return null;

  return createPortal(
    <div className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className="sibs-modal-pop-in flex max-h-[84vh] 2xl:max-h-[86vh] w-full max-w-[96vw] 2xl:max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white font-jakarta shadow-2xl">
        <div
          data-layout="forecast-week-details-header-v2"
          className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-700 bg-[#042C51] px-4 py-2.5 2xl:px-6 2xl:py-3.5 text-white"
        >
          <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
            <div className="flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
              <BarChart2 className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xs 2xl:text-sm font-extrabold uppercase tracking-wide text-white">
                  FORECAST WEEK DETAILS
                </h2>

                <span className="font-bold text-slate-400">|</span>

                <span className="sibs-text-micro font-bold text-slate-300">
                  Account / Cluster Breakdown
                </span>

                <span className="rounded-full bg-[#FF5C28] px-2 py-0.5 sibs-text-micro font-extrabold uppercase tracking-wider text-white shadow-sm">
                  {filteredRows.length} of {normalizedRows.length} rows
                </span>
              </div>

              <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono sibs-text-micro text-slate-300">
                <span className="font-extrabold text-blue-300">
                  {forecastWeek?.label || "Selected forecast week"}
                </span>

                {forecastWeek?.forecastBasisStart &&
                forecastWeek?.forecastBasisEnd ? (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="font-medium text-slate-300">
                      Forecast basis: {forecastWeek.forecastBasisStart} to{" "}
                      {forecastWeek.forecastBasisEnd}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7.5 w-7.5 2xl:h-8 2xl:w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white"
            aria-label="Close forecast details"
            title="Close Modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5 2xl:px-5 2xl:py-3">
          <p className="sibs-text-micro font-bold uppercase tracking-wide text-slate-500">
            Clicked forecast week rows are shown per account and cluster.
          </p>

          <div className="group relative w-full max-w-xs 2xl:max-w-md">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3] transition-colors group-focus-within:text-[#FF5C28]"
            />

            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search cluster or account..."
              className="h-8 2xl:h-8.5 w-full rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-3 pl-8.5 font-jakarta sibs-text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#8A98B8] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto sibs-scrollbar p-3 2xl:p-4">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div
              ref={dragScrollRef}
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              className={`max-h-[48vh] 2xl:max-h-[54vh] overflow-auto sibs-scrollbar ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
            >
              <table className="w-full min-w-[2100px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    <WorkforceHeaderTh className="!top-0 !text-left">Cluster</WorkforceHeaderTh>
                    <WorkforceHeaderTh className="!top-0 !text-left">Account</WorkforceHeaderTh>
                    <WorkforceHeaderTh className="!top-0 !text-center !font-black !text-[#042C51]">Required HC</WorkforceHeaderTh>
                    <WorkforceHeaderTh className="!top-0 !text-center">Actual HC</WorkforceHeaderTh>
                    <WorkforceHeaderTh className="!top-0 !text-center">Buffer %</WorkforceHeaderTh>
                    <WorkforceHeaderTh className="!top-0 !text-center">Absenteeism</WorkforceHeaderTh>
                    <WorkforceHeaderTh className="!top-0 !text-center">Attrition</WorkforceHeaderTh>
                    <WorkforceHeaderTh className="!top-0 !text-center !font-black !text-[#042C51]">Net Actual HC</WorkforceHeaderTh>
                    <WorkforceHeaderTh className="!top-0 !text-center !font-black !text-rose-600">Hiring Needed</WorkforceHeaderTh>
                    <WorkforceHeaderTh className="!top-0 !text-center !font-black !text-[#042C51]">Accepted JO</WorkforceHeaderTh>
                    <WorkforceHeaderTh className="!top-0 !text-center">NHO Count</WorkforceHeaderTh>
                    <WorkforceHeaderTh className="!top-0 !text-center">FST Count</WorkforceHeaderTh>
                    <WorkforceHeaderTh className="!top-0 !text-center">PST Count</WorkforceHeaderTh>
                    <WorkforceHeaderTh className="!top-0 !text-center !font-black !text-emerald-700">Go Live</WorkforceHeaderTh>
                    <WorkforceHeaderTh className="!top-0 !text-center !font-black !text-[#042C51]">Hired Count</WorkforceHeaderTh>
                    <WorkforceHeaderTh className="!top-0 !text-center !font-black !text-[#FF5C28]">Hiring Rate</WorkforceHeaderTh>
                    <WorkforceHeaderTh className="border-r-0 !top-0 !text-center !font-black !text-purple-700">Leads to Interview</WorkforceHeaderTh>
                  </tr>
                </thead>

                <tbody className="bg-white font-jakarta font-medium">
                  {filteredRows.length ? (
                    filteredRows.map((row, index) => (
                      <tr
                        key={`${row.cluster}-${row.account}-${row.id || index}`}
                        className="transition hover:bg-blue-50/40"
                      >
                        <WorkforceBodyTd align="left" className="font-bold text-[#042C51]">
                          {row.cluster}
                        </WorkforceBodyTd>
                        <WorkforceBodyTd align="left" className="font-medium text-slate-700">
                          {row.account}
                        </WorkforceBodyTd>
                        <WorkforceBodyTd className={WORKFORCE_BOLD_NUMBER_CLASS}>
                          {formatOverviewNumber(row.requiredHeadcount)}
                        </WorkforceBodyTd>
                        <WorkforceBodyTd className={WORKFORCE_SECONDARY_NUMBER_CLASS}>
                          {formatOverviewNumber(row.actualHeadcount)}
                        </WorkforceBodyTd>
                        <WorkforceBodyTd
                          className={`!font-black ${getWorkforceValueColor(
                            row.bufferPercentage,
                          )}`}
                        >
                          {formatOverviewPercent(row.bufferPercentage)}
                        </WorkforceBodyTd>
                        <WorkforceBodyTd>
                          <WorkforceMetricWithPercent
                            value={row.absenteeism}
                            percent={row.absenteeismPercentage}
                            percentClassName="text-orange-500"
                          />
                        </WorkforceBodyTd>
                        <WorkforceBodyTd>
                          <WorkforceMetricWithPercent
                            value={row.attrition}
                            percent={row.attritionPercentage}
                            percentClassName="text-red-500"
                          />
                        </WorkforceBodyTd>
                        <WorkforceBodyTd className={WORKFORCE_BOLD_NUMBER_CLASS}>
                          {formatOverviewNumber(row.netActualHc)}
                        </WorkforceBodyTd>
                        <WorkforceBodyTd>
                          <WorkforceHiringNeededValue value={row.hiringNeeded} />
                        </WorkforceBodyTd>
                        <WorkforceBodyTd className={WORKFORCE_BOLD_NUMBER_CLASS}>
                          {formatOverviewNumber(row.acceptedJo)}
                        </WorkforceBodyTd>
                        <WorkforceBodyTd className={WORKFORCE_SECONDARY_NUMBER_CLASS}>
                          {formatOverviewNumber(row.nho)}
                        </WorkforceBodyTd>
                        <WorkforceBodyTd className={WORKFORCE_SECONDARY_NUMBER_CLASS}>
                          {formatOverviewNumber(row.fst)}
                        </WorkforceBodyTd>
                        <WorkforceBodyTd className={WORKFORCE_SECONDARY_NUMBER_CLASS}>
                          {formatOverviewNumber(row.pst)}
                        </WorkforceBodyTd>
                        <WorkforceBodyTd className="!font-black !text-emerald-600">
                          {formatOverviewNumber(row.goLive)}
                        </WorkforceBodyTd>
                        <WorkforceBodyTd className={WORKFORCE_BOLD_NUMBER_CLASS}>
                          {formatOverviewNumber(row.hiredCount)}
                        </WorkforceBodyTd>
                        <WorkforceBodyTd className="!font-black !text-[#FF5C28]">
                          {formatOverviewPercent(row.hiringRate)}
                        </WorkforceBodyTd>
                        <WorkforceBodyTd className="border-r-0 !font-black !text-purple-700">
                          {formatOverviewNumber(row.leadsToInterview)}
                        </WorkforceBodyTd>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <WorkforceBodyTd colSpan={17} align="center">
                        No account-level forecast rows found for this week.
                      </WorkforceBodyTd>
                    </tr>
                  )}
                </tbody>

                {filteredRows.length ? (
                  <tfoot>
                    <tr>
                      <WorkforceFooterTd align="left" className="!font-black text-[#042C51]">
                        TOTAL / AVG.
                      </WorkforceFooterTd>
                      <WorkforceFooterTd />
                      <WorkforceFooterTd className={WORKFORCE_BOLD_NUMBER_CLASS}>
                        {formatOverviewNumber(totals.requiredHeadcount)}
                      </WorkforceFooterTd>
                      <WorkforceFooterTd className={WORKFORCE_SECONDARY_NUMBER_CLASS}>
                        {formatOverviewNumber(totals.actualHeadcount)}
                      </WorkforceFooterTd>
                      <WorkforceFooterTd
                        className={`!font-black ${getWorkforceValueColor(
                          totals.bufferPercentage,
                        )}`}
                      >
                        {formatOverviewPercent(totals.bufferPercentage)}
                      </WorkforceFooterTd>
                      <WorkforceFooterTd>
                        <WorkforceMetricWithPercent
                          value={totals.absenteeism}
                          percent={totals.absenteeismPercentage}
                          percentClassName="text-orange-500"
                        />
                      </WorkforceFooterTd>
                      <WorkforceFooterTd>
                        <WorkforceMetricWithPercent
                          value={totals.attrition}
                          percent={totals.attritionPercentage}
                          percentClassName="text-red-500"
                        />
                      </WorkforceFooterTd>
                      <WorkforceFooterTd className={WORKFORCE_BOLD_NUMBER_CLASS}>
                        {formatOverviewNumber(totals.netActualHc)}
                      </WorkforceFooterTd>
                      <WorkforceFooterTd>
                        <WorkforceHiringNeededValue value={totals.hiringNeeded} />
                      </WorkforceFooterTd>
                      <WorkforceFooterTd className={WORKFORCE_BOLD_NUMBER_CLASS}>
                        {formatOverviewNumber(totals.acceptedJo)}
                      </WorkforceFooterTd>
                      <WorkforceFooterTd className={WORKFORCE_SECONDARY_NUMBER_CLASS}>
                        {formatOverviewNumber(totals.nho)}
                      </WorkforceFooterTd>
                      <WorkforceFooterTd className={WORKFORCE_SECONDARY_NUMBER_CLASS}>
                        {formatOverviewNumber(totals.fst)}
                      </WorkforceFooterTd>
                      <WorkforceFooterTd className={WORKFORCE_SECONDARY_NUMBER_CLASS}>
                        {formatOverviewNumber(totals.pst)}
                      </WorkforceFooterTd>
                      <WorkforceFooterTd className="!font-black !text-emerald-600">
                        {formatOverviewNumber(totals.goLive)}
                      </WorkforceFooterTd>
                      <WorkforceFooterTd className={WORKFORCE_BOLD_NUMBER_CLASS}>
                        {formatOverviewNumber(totals.hiredCount)}
                      </WorkforceFooterTd>
                      <WorkforceFooterTd className="!font-black !text-[#FF5C28]">
                        {formatOverviewPercent(totals.hiringRate)}
                      </WorkforceFooterTd>
                      <WorkforceFooterTd className="border-r-0 !font-black !text-purple-700">
                        {formatOverviewNumber(totals.leadsToInterview)}
                      </WorkforceFooterTd>
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}