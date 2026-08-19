import React, { useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import {
  formatOverviewNumber,
  formatOverviewPercent,
} from "../../../lib/utils/workforceHiringOverview/workforceHiringOverviewHelpers";
import {
  buildForecastAccountAverageRows,
  buildForecastAccountTotals,
} from "../../../lib/utils/workforceHiringPlan/forecastAccountAverageHelpers";
import {
  WORKFORCE_BOLD_NUMBER_CLASS,
  WORKFORCE_SECONDARY_NUMBER_CLASS,
  WorkforceBodyTd,
  WorkforceFooterTd,
  WorkforceGroupHeaderTh,
  WorkforceHeaderTh,
  WorkforceHiringNeededValue,
  WorkforceMetricWithPercent,
  getWorkforceValueColor,
} from "./WorkforceHiringTablePrimitives";

function filterRows(rows = [], searchValue = "") {
  const keyword = String(searchValue || "")
    .trim()
    .toLowerCase();

  if (!keyword) return rows;

  return rows.filter((row) =>
    `${row.cluster} ${row.account}`.toLowerCase().includes(keyword),
  );
}

export default function ForecastClusterAccountAverageTable({
  groups = [],
  forecastWeekCount = 0,
  loading = false,
  error = "",
}) {
  const [searchValue, setSearchValue] = useState("");

  const averageRows = useMemo(
    () => buildForecastAccountAverageRows(groups, forecastWeekCount),
    [forecastWeekCount, groups],
  );

  const filteredRows = useMemo(
    () => filterRows(averageRows, searchValue),
    [averageRows, searchValue],
  );

  const totals = useMemo(
    () => buildForecastAccountTotals(filteredRows),
    [filteredRows],
  );

  const hasRows = filteredRows.length > 0;

  const dragScrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleDragStart = (e) => {
    if (!dragScrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - dragScrollRef.current.offsetLeft);
    setScrollLeft(dragScrollRef.current.scrollLeft);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragMove = (e) => {
    if (!isDragging || !dragScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - dragScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    dragScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <section className="sibs-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3.5 border-b border-slate-200 px-4 py-3.5 2xl:px-5 2xl:py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
              Details by Cluster / Account
            </h3>

            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 sibs-text-micro font-extrabold text-[#52637A]">
              {loading
                ? "Loading details..."
                : `${filteredRows.length} of ${averageRows.length} accounts`}
            </span>
          </div>

          <p className="mt-1 text-xs font-semibold text-[#667085]">
            Average workforce capacity, hiring demand, and pipeline volume per
            cluster and account across the complete forecast period.
          </p>
        </div>

        <div className="group relative w-full lg:max-w-xs 2xl:max-w-sm">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3] transition-colors group-focus-within:text-[#FF5C28]"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search cluster or account..."
            className="h-8.5 2xl:h-10 w-full rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-3 pl-8.5 font-jakarta sibs-text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#8A98B8] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10"
          />
        </div>
      </div>

      {error ? (
        <div className="mx-4 mt-3.5 2xl:mx-5 2xl:mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
          Account-level forecast details are unavailable: {error}
        </div>
      ) : null}

      <div className="p-3.5 sm:p-4 2xl:p-5">
        <div
          ref={dragScrollRef}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          className={`sibs-data-table-shell !block max-h-[480px] 2xl:max-h-[640px] overflow-auto sibs-scrollbar rounded-xl border border-slate-200 bg-white shadow-sm select-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          <table className="w-[2105px] min-w-[2105px] table-fixed border-collapse font-jakarta text-xs whitespace-nowrap">
            <colgroup>
              <col style={{ width: "150px" }} />
              <col style={{ width: "190px" }} />
              <col style={{ width: "115px" }} />
              <col style={{ width: "105px" }} />
              <col style={{ width: "95px" }} />
              <col style={{ width: "125px" }} />
              <col style={{ width: "115px" }} />
              <col style={{ width: "135px" }} />
              <col style={{ width: "135px" }} />
              <col style={{ width: "125px" }} />
              <col style={{ width: "110px" }} />
              <col style={{ width: "105px" }} />
              <col style={{ width: "105px" }} />
              <col style={{ width: "95px" }} />
              <col style={{ width: "115px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "170px" }} />
            </colgroup>

            <thead className="sibs-data-table-head bg-[#F8FAFC]">
              <tr className="sibs-data-table-head-row">
                <WorkforceGroupHeaderTh
                  rowSpan={2}
                  className="!text-left"
                >
                  Cluster
                </WorkforceGroupHeaderTh>
                <WorkforceGroupHeaderTh
                  rowSpan={2}
                  className="!text-left"
                >
                  Account
                </WorkforceGroupHeaderTh>
                <WorkforceGroupHeaderTh colSpan={7}>
                  Workforce Capacity &amp; Gap
                </WorkforceGroupHeaderTh>
                <WorkforceGroupHeaderTh colSpan={6}>
                  Recruitment Pipeline
                </WorkforceGroupHeaderTh>
                <WorkforceGroupHeaderTh colSpan={2} className="border-r-0">
                  Yield &amp; Demand
                </WorkforceGroupHeaderTh>
              </tr>

              <tr className="sibs-data-table-head-row">
                <WorkforceHeaderTh className="!text-center !font-black !text-[#042C51]">
                  Required HC
                </WorkforceHeaderTh>
                <WorkforceHeaderTh className="!text-center">
                  Actual HC
                </WorkforceHeaderTh>
                <WorkforceHeaderTh className="!text-center">
                  Buffer %
                </WorkforceHeaderTh>
                <WorkforceHeaderTh className="!text-center">
                  Absenteeism
                </WorkforceHeaderTh>
                <WorkforceHeaderTh className="!text-center">
                  Attrition
                </WorkforceHeaderTh>
                <WorkforceHeaderTh className="!text-center !font-black !text-[#042C51]">
                  Net Actual HC
                </WorkforceHeaderTh>
                <WorkforceHeaderTh className="!text-center !font-black !text-rose-600">
                  Hiring Needed
                </WorkforceHeaderTh>
                <WorkforceHeaderTh className="!text-center !font-black !text-[#042C51]">
                  Accepted JO
                </WorkforceHeaderTh>
                <WorkforceHeaderTh className="!text-center">NHO Count</WorkforceHeaderTh>
                <WorkforceHeaderTh className="!text-center">FST Count</WorkforceHeaderTh>
                <WorkforceHeaderTh className="!text-center">PST Count</WorkforceHeaderTh>
                <WorkforceHeaderTh className="!text-center !font-black !text-emerald-700">
                  Go Live
                </WorkforceHeaderTh>
                <WorkforceHeaderTh className="!text-center !font-black !text-[#042C51]">
                  Hired Count
                </WorkforceHeaderTh>
                <WorkforceHeaderTh className="!text-center !font-black !text-[#FF5C28]">
                  Hiring Rate
                </WorkforceHeaderTh>
                <WorkforceHeaderTh className="border-r-0 !text-center !font-black !text-purple-700">
                  Leads to Interview
                </WorkforceHeaderTh>
              </tr>
            </thead>

            <tbody className="bg-white font-jakarta font-medium">
              {hasRows ? (
                filteredRows.map((row, index) => (
                  <tr
                    key={`${row.cluster}-${row.account}-${index}`}
                    className="sibs-data-table-row !cursor-default hover:!bg-slate-50/80"
                  >
                    <WorkforceBodyTd
                      align="left"
                      numeric={false}
                      className="font-normal text-slate-500"
                    >
                      <span
                        className="block max-w-[130px] truncate"
                        title={row.cluster}
                      >
                        {row.cluster}
                      </span>
                    </WorkforceBodyTd>

                    <WorkforceBodyTd
                      align="left"
                      numeric={false}
                      className="font-black text-[#042C51]"
                    >
                      <span
                        className="block max-w-[170px] truncate"
                        title={row.account}
                      >
                        {row.account}
                      </span>
                    </WorkforceBodyTd>

                    <WorkforceBodyTd className={WORKFORCE_BOLD_NUMBER_CLASS}>
                      {formatOverviewNumber(row.requiredHeadcount)}
                    </WorkforceBodyTd>

                    <WorkforceBodyTd className={WORKFORCE_SECONDARY_NUMBER_CLASS}>
                      {formatOverviewNumber(row.actualHeadcount)}
                    </WorkforceBodyTd>

                    <WorkforceBodyTd
                      className={`font-black ${getWorkforceValueColor(
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

                    <WorkforceBodyTd className="font-black text-emerald-600">
                      {formatOverviewNumber(row.goLive)}
                    </WorkforceBodyTd>

                    <WorkforceBodyTd className={WORKFORCE_BOLD_NUMBER_CLASS}>
                      {formatOverviewNumber(row.hiredCount)}
                    </WorkforceBodyTd>

                    <WorkforceBodyTd className="font-black text-[#FF5C28]">
                      {formatOverviewPercent(row.hiringRate)}
                    </WorkforceBodyTd>

                    <WorkforceBodyTd className="border-r-0 font-black text-purple-700">
                      {formatOverviewNumber(row.leadsToInterview)}
                    </WorkforceBodyTd>
                  </tr>
                ))
              ) : (
                <tr>
                  <WorkforceBodyTd
                    colSpan={17}
                    align="center"
                    numeric={false}
                    className="border-r-0 py-12 font-semibold text-slate-400"
                  >
                    {loading
                      ? "Loading cluster and account forecast averages..."
                      : averageRows.length > 0
                        ? "No cluster or account matches your search."
                        : "No account-level forecast rows are available for this forecast period."}
                  </WorkforceBodyTd>
                </tr>
              )}
            </tbody>

            {hasRows ? (
              <tfoot>
                <tr>
                  <WorkforceFooterTd
                    align="left"
                    numeric={false}
                    className="font-black uppercase"
                  >
                    TOTAL / AVG.
                  </WorkforceFooterTd>
                  <WorkforceFooterTd />

                  <WorkforceFooterTd className={WORKFORCE_BOLD_NUMBER_CLASS}>
                    {formatOverviewNumber(totals.requiredHeadcount)}
                  </WorkforceFooterTd>

                  <WorkforceFooterTd className="font-bold text-slate-700">
                    {formatOverviewNumber(totals.actualHeadcount)}
                  </WorkforceFooterTd>

                  <WorkforceFooterTd
                    className={`font-black ${getWorkforceValueColor(
                      totals.bufferPercentage,
                    )}`}
                  >
                    {formatOverviewPercent(totals.bufferPercentage)}
                  </WorkforceFooterTd>

                  <WorkforceFooterTd>
                    <WorkforceMetricWithPercent
                      value={totals.absenteeism}
                      percent={totals.absenteeismPercentage}
                      valueClassName="font-bold text-slate-700"
                      percentClassName="text-orange-500"
                    />
                  </WorkforceFooterTd>

                  <WorkforceFooterTd>
                    <WorkforceMetricWithPercent
                      value={totals.attrition}
                      percent={totals.attritionPercentage}
                      valueClassName="font-bold text-slate-700"
                      percentClassName="text-red-500"
                    />
                  </WorkforceFooterTd>

                  <WorkforceFooterTd className={WORKFORCE_BOLD_NUMBER_CLASS}>
                    {formatOverviewNumber(totals.netActualHc)}
                  </WorkforceFooterTd>

                  <WorkforceFooterTd>
                    <WorkforceHiringNeededValue
                      value={totals.hiringNeeded}
                      summary
                    />
                  </WorkforceFooterTd>

                  <WorkforceFooterTd className={WORKFORCE_BOLD_NUMBER_CLASS}>
                    {formatOverviewNumber(totals.acceptedJo)}
                  </WorkforceFooterTd>

                  <WorkforceFooterTd className="font-bold text-slate-700">
                    {formatOverviewNumber(totals.nho)}
                  </WorkforceFooterTd>

                  <WorkforceFooterTd className="font-bold text-slate-700">
                    {formatOverviewNumber(totals.fst)}
                  </WorkforceFooterTd>

                  <WorkforceFooterTd className="font-bold text-slate-700">
                    {formatOverviewNumber(totals.pst)}
                  </WorkforceFooterTd>

                  <WorkforceFooterTd className="font-black text-emerald-700">
                    {formatOverviewNumber(totals.goLive)}
                  </WorkforceFooterTd>

                  <WorkforceFooterTd className={WORKFORCE_BOLD_NUMBER_CLASS}>
                    {formatOverviewNumber(totals.hiredCount)}
                  </WorkforceFooterTd>

                  <WorkforceFooterTd className="font-black text-[#FF5C28]">
                    {formatOverviewPercent(totals.hiringRate)}
                  </WorkforceFooterTd>

                  <WorkforceFooterTd className="border-r-0 font-black text-purple-700">
                    {formatOverviewNumber(totals.leadsToInterview)}
                  </WorkforceFooterTd>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>
    </section>
  );
}
