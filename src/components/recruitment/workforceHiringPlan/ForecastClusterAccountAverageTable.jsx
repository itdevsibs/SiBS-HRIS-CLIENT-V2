import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Search, X } from "lucide-react";
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
import { DataCard, ResponsiveTableShell } from "@/components/ui";

function safeNumber(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function ClusterAccountMobileCard({ row }) {
  const hiringNeeded = safeNumber(row.hiringNeeded);

  return (
    <DataCard>
      <DataCard.Header
        title={row.account || "Unnamed Account"}
        subtitle={
          <span className="inline-flex items-center gap-1.5 font-bold text-sibs-muted">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-sibs-orange" />
            <span>{row.cluster || "No Cluster"}</span>
          </span>
        }
        badge={
          <span
            className={`inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold tabular-nums ${
              hiringNeeded > 0
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            Need: {formatOverviewNumber(hiringNeeded)}
          </span>
        }
      />

      <DataCard.Metrics cols={3}>
        <DataCard.MetricItem
          label="Req HC"
          value={formatOverviewNumber(row.requiredHeadcount)}
          tone="primary"
        />
        <DataCard.MetricItem
          label="Actual HC"
          value={formatOverviewNumber(row.actualHeadcount)}
        />
        <DataCard.MetricItem
          label="Net Actual"
          value={formatOverviewNumber(row.netActualHc)}
          tone="primary"
        />
        <DataCard.MetricItem
          label="Buffer %"
          value={formatOverviewPercent(row.bufferPercentage)}
        />
        <DataCard.MetricItem
          label="Hired / Rate"
          value={`${formatOverviewNumber(row.hiredCount)} (${formatOverviewPercent(row.hiringRate)})`}
          tone="orange"
        />
        <DataCard.MetricItem
          label="Go Live"
          value={formatOverviewNumber(row.goLive)}
          tone="emerald"
        />
      </DataCard.Metrics>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-sibs-border pt-2 text-[10.5px] font-semibold text-sibs-muted">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span>JO: <strong className="text-sibs-navy tabular-nums">{formatOverviewNumber(row.acceptedJo)}</strong></span>
          <span>NHO: <strong className="text-sibs-navy tabular-nums">{formatOverviewNumber(row.nho)}</strong></span>
          <span>FST: <strong className="text-sibs-navy tabular-nums">{formatOverviewNumber(row.fst)}</strong></span>
          <span>PST: <strong className="text-sibs-navy tabular-nums">{formatOverviewNumber(row.pst)}</strong></span>
          <span>Absent: <strong className="text-sibs-navy tabular-nums">{formatOverviewNumber(row.absenteeism)}</strong></span>
          <span>Attr: <strong className="text-sibs-navy tabular-nums">{formatOverviewNumber(row.attrition)}</strong></span>
        </div>
        <span className="shrink-0 text-[10.5px] font-extrabold text-purple-700 tabular-nums">
          Leads: {formatOverviewNumber(row.leadsToInterview)}
        </span>
      </div>
    </DataCard>
  );
}

function filterRows(rows = [], searchValue = "") {
  const keyword = String(searchValue || "")
    .trim()
    .toLowerCase();

  if (!keyword) return rows;

  return rows.filter((row) =>
    `${row.cluster} ${row.account}`.toLowerCase().includes(keyword),
  );
}

function ForecastClusterAccountTableView({
  filteredRows = [],
  hasRows = false,
  averageRows = [],
  totals = {},
  loading = false,
  fitToScreen = false,
  dragScrollRef,
  isDragging = false,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  containerClassName = "",
}) {
  return (
    <div
      ref={dragScrollRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      className={`sibs-data-table-shell !block overflow-auto sibs-scrollbar rounded-xl border border-slate-200 bg-white select-none ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      } ${containerClassName}`}
    >
      <table
        className={`table-fixed border-collapse font-jakarta whitespace-nowrap ${
          fitToScreen
            ? "w-full min-w-[1320px] text-[11px] 2xl:text-xs"
            : "w-[2105px] min-w-[2105px] text-xs"
        }`}
      >
        <colgroup>
          <col style={{ width: fitToScreen ? "9%" : "150px" }} />
          <col style={{ width: fitToScreen ? "11.5%" : "190px" }} />
          <col style={{ width: fitToScreen ? "5.5%" : "115px" }} />
          <col style={{ width: fitToScreen ? "5%" : "105px" }} />
          <col style={{ width: fitToScreen ? "5%" : "95px" }} />
          <col style={{ width: fitToScreen ? "6%" : "125px" }} />
          <col style={{ width: fitToScreen ? "5.5%" : "115px" }} />
          <col style={{ width: fitToScreen ? "6%" : "135px" }} />
          <col style={{ width: fitToScreen ? "6%" : "135px" }} />
          <col style={{ width: fitToScreen ? "5.5%" : "125px" }} />
          <col style={{ width: fitToScreen ? "5%" : "110px" }} />
          <col style={{ width: fitToScreen ? "5%" : "105px" }} />
          <col style={{ width: fitToScreen ? "5%" : "105px" }} />
          <col style={{ width: fitToScreen ? "4.5%" : "95px" }} />
          <col style={{ width: fitToScreen ? "5.5%" : "115px" }} />
          <col style={{ width: fitToScreen ? "5.5%" : "120px" }} />
          <col style={{ width: fitToScreen ? "8.5%" : "170px" }} />
        </colgroup>

        <thead className="bg-sibs-canvas">
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
            <WorkforceHeaderTh className="!text-center !font-black !text-sibs-navy">
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
            <WorkforceHeaderTh className="!text-center !font-black !text-sibs-navy">
              Net Actual HC
            </WorkforceHeaderTh>
            <WorkforceHeaderTh className="!text-center !font-black !text-rose-600">
              Hiring Needed
            </WorkforceHeaderTh>
            <WorkforceHeaderTh className="!text-center !font-black !text-sibs-navy">
              Accepted JO
            </WorkforceHeaderTh>
            <WorkforceHeaderTh className="!text-center">NHO Count</WorkforceHeaderTh>
            <WorkforceHeaderTh className="!text-center">FST Count</WorkforceHeaderTh>
            <WorkforceHeaderTh className="!text-center">PST Count</WorkforceHeaderTh>
            <WorkforceHeaderTh className="!text-center !font-black !text-emerald-700">
              Go Live
            </WorkforceHeaderTh>
            <WorkforceHeaderTh className="!text-center !font-black !text-sibs-navy">
              Hired
            </WorkforceHeaderTh>
            <WorkforceHeaderTh className="!text-center !font-black !text-sibs-orange">
              Hiring Rate
            </WorkforceHeaderTh>
            <WorkforceHeaderTh className="!text-center font-black !text-purple-700">
              Expected Leads
            </WorkforceHeaderTh>
            <WorkforceHeaderTh className="border-r-0 !text-center font-black !text-purple-700">
              Leads To Interview
            </WorkforceHeaderTh>
          </tr>
        </thead>

        <tbody className="sibs-data-table-body">
          {loading ? (
            <tr>
              <td colSpan={17} className="px-4 py-8 text-center text-xs font-semibold text-sibs-muted">
                Loading cluster and account details...
              </td>
            </tr>
          ) : !hasRows ? (
            <tr>
              <td colSpan={17} className="px-4 py-8 text-center text-xs font-semibold text-sibs-muted">
                {averageRows.length > 0
                  ? "No cluster or account matches your search."
                  : "No account-level forecast rows are available for this forecast period."}
              </td>
            </tr>
          ) : (
            filteredRows.map((row, index) => (
              <tr
                key={`${row.cluster}-${row.account}-${index}`}
                className="sibs-data-table-row transition-colors"
              >
                <WorkforceBodyTd className="text-left font-bold text-sibs-navy">
                  {row.cluster}
                </WorkforceBodyTd>

                <WorkforceBodyTd className="text-left font-semibold text-sibs-navy">
                  {row.account}
                </WorkforceBodyTd>

                <WorkforceBodyTd className={WORKFORCE_BOLD_NUMBER_CLASS}>
                  {formatOverviewNumber(row.requiredHeadcount)}
                </WorkforceBodyTd>

                <WorkforceBodyTd>
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

                <WorkforceBodyTd className="font-bold text-emerald-700">
                  {formatOverviewNumber(row.goLive)}
                </WorkforceBodyTd>

                <WorkforceBodyTd className={WORKFORCE_BOLD_NUMBER_CLASS}>
                  {formatOverviewNumber(row.hiredCount)}
                </WorkforceBodyTd>

                <WorkforceBodyTd className="font-black text-sibs-orange">
                  {formatOverviewPercent(row.hiringRate)}
                </WorkforceBodyTd>

                <WorkforceBodyTd className="font-bold text-purple-700">
                  {formatOverviewNumber(row.expectedLeads)}
                </WorkforceBodyTd>

                <WorkforceBodyTd className="border-r-0 font-black text-purple-700">
                  {formatOverviewNumber(row.leadsToInterview)}
                </WorkforceBodyTd>
              </tr>
            ))
          )}
        </tbody>

        {hasRows ? (
          <tfoot className="sibs-data-table-foot">
            <tr className="sibs-data-table-total-row">
              <WorkforceFooterTd className="text-left font-black text-sibs-navy">
                TOTAL
              </WorkforceFooterTd>

              <WorkforceFooterTd className="text-left font-extrabold text-sibs-muted">
                {filteredRows.length} Accounts
              </WorkforceFooterTd>

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

              <WorkforceFooterTd className="font-bold text-slate-700">
                <WorkforceMetricWithPercent
                  value={totals.absenteeism}
                  percent={totals.absenteeismPercentage}
                  percentClassName="text-orange-500"
                />
              </WorkforceFooterTd>

              <WorkforceFooterTd className="font-bold text-slate-700">
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

              <WorkforceFooterTd className="font-black text-sibs-orange">
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
  );
}

function ForecastClusterAccountAverageModal({
  open = false,
  onClose,
  filteredRows = [],
  hasRows = false,
  averageRows = [],
  totals = {},
  loading = false,
  error = "",
  searchValue = "",
  setSearchValue,
}) {
  const [fitToScreen, setFitToScreen] = useState(true);
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

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="forecast-cluster-expand-title"
      className="fixed inset-0 z-[140] flex items-center justify-center p-2 sm:p-4 2xl:p-6"
    >
      {/* Backdrop */}
      <div
        className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 bg-slate-900/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="sibs-modal-pop-in relative flex h-full max-h-[96vh] w-full max-w-[99vw] 2xl:max-w-[1850px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl font-jakarta">
        {/* Tier 1: Dark Navy Brand Header Bar */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-sibs-navy px-4 py-3 sm:px-5 sm:py-3.5 2xl:px-6 2xl:py-4 text-white">
          <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
            <div className="flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-sibs-orange text-white shadow-xs">
              <Maximize2 size={16} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="forecast-cluster-expand-title"
                  className="sibs-modal-title !text-white truncate"
                >
                  Details by Cluster / Account
                </h2>

                <span className="font-bold text-white/30">|</span>

                <span className="sibs-text-micro font-bold text-white/70">
                  Expanded View
                </span>

                <span className="rounded-full bg-sibs-orange px-2.5 py-0.5 text-xs font-extrabold text-white shadow-xs">
                  {loading
                    ? "Loading..."
                    : `${filteredRows.length} of ${averageRows.length} accounts`}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="sibs-modal-close-btn"
            aria-label="Close expanded view"
            title="Close modal (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tier 2: Controls Toolbar */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-sibs-border bg-sibs-canvas px-4 py-2 sm:px-5 2xl:px-6">
          <p className="sibs-modal-subtitle text-xs font-semibold text-sibs-muted">
            Average workforce capacity, hiring demand, and pipeline volume per
            cluster and account across the complete forecast period.
          </p>

          <div className="flex items-center gap-2.5">
            <div className="relative w-52 sm:w-64">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sibs-muted"
              />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue?.(e.target.value)}
                placeholder="Search in expanded view..."
                className="h-8.5 w-full rounded-lg border border-sibs-border bg-white px-3 pl-8.5 font-jakarta text-xs font-semibold text-sibs-navy outline-none transition placeholder:text-sibs-muted focus:border-sibs-orange focus:ring-2 focus:ring-sibs-orange/10"
              />
            </div>

            <button
              type="button"
              onClick={() => setFitToScreen((prev) => !prev)}
              className={`inline-flex h-8.5 items-center justify-center rounded-lg border px-3 text-xs font-bold transition ${
                fitToScreen
                  ? "border-sibs-orange bg-sibs-cream-light text-sibs-orange"
                  : "border-slate-200 bg-white text-sibs-navy hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange"
              }`}
            >
              {fitToScreen ? "Scroll View" : "Fit to Screen"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mx-6 mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
            Account-level forecast details are unavailable: {error}
          </div>
        ) : null}

        {/* Modal Body: Table Content */}
        <div className="flex flex-1 flex-col min-h-0 p-4 sm:p-5">
          <ForecastClusterAccountTableView
            filteredRows={filteredRows}
            hasRows={hasRows}
            averageRows={averageRows}
            totals={totals}
            loading={loading}
            fitToScreen={fitToScreen}
            dragScrollRef={dragScrollRef}
            isDragging={isDragging}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            containerClassName="flex-1 min-h-0"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function ForecastClusterAccountAverageTable({
  groups = [],
  forecastWeekCount = 0,
  loading = false,
  error = "",
}) {
  const [searchValue, setSearchValue] = useState("");
  const [isExpandedModalOpen, setIsExpandedModalOpen] = useState(false);

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
            <h3 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
              Details by Cluster / Account
            </h3>

            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 sibs-text-micro font-extrabold text-sibs-muted">
              {loading
                ? "Loading details..."
                : `${filteredRows.length} of ${averageRows.length} accounts`}
            </span>
          </div>

          <p className="mt-0.5 sibs-text-xs font-semibold text-sibs-muted">
            Average workforce capacity, hiring demand, and pipeline volume per
            cluster and account across the complete forecast period.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full lg:w-auto">
          <div className="group relative w-full lg:w-64 2xl:w-72">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sibs-muted transition-colors group-focus-within:text-sibs-orange"
            />
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search cluster or account..."
              className="h-8.5 2xl:h-10 w-full rounded-lg border border-sibs-border bg-sibs-canvas px-3 pl-8.5 font-jakarta sibs-text-xs font-semibold text-sibs-navy outline-none transition placeholder:text-sibs-muted hover:border-sibs-orange/40 hover:bg-white focus:border-sibs-orange focus:bg-white focus:ring-4 focus:ring-sibs-orange/10"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsExpandedModalOpen(true)}
            className="inline-flex h-8.5 2xl:h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 sibs-text-xs font-bold text-sibs-navy shadow-xs transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange active:scale-[0.98]"
            title="Expand view to show all columns at once"
          >
            <Maximize2 size={14} className="text-sibs-orange" />
            <span className="hidden sm:inline">Expand View</span>
          </button>
        </div>
      </div>

      {error ? (
        <div className="mx-4 mt-3.5 2xl:mx-5 2xl:mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
          Account-level forecast details are unavailable: {error}
        </div>
      ) : null}

      <div className="p-3.5 sm:p-4 2xl:p-5">
        <ResponsiveTableShell
          mobileContent={
            loading ? (
              <DataCard.Skeleton count={6} lines={3} />
            ) : !hasRows ? (
              <DataCard.Empty
                title="No accounts found"
                description={
                  averageRows.length > 0
                    ? "No cluster or account matches your search."
                    : "No account-level forecast rows are available for this forecast period."
                }
              />
            ) : (
              <div className="space-y-3">
                {filteredRows.map((row, index) => (
                  <ClusterAccountMobileCard
                    key={`${row.cluster}-${row.account}-${index}`}
                    row={row}
                  />
                ))}
              </div>
            )
          }
          desktopContent={
            <ForecastClusterAccountTableView
              filteredRows={filteredRows}
              hasRows={hasRows}
              averageRows={averageRows}
              totals={totals}
              loading={loading}
              dragScrollRef={dragScrollRef}
              isDragging={isDragging}
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              containerClassName="max-h-[480px] 2xl:max-h-[640px]"
            />
          }
        />
      </div>

      <ForecastClusterAccountAverageModal
        open={isExpandedModalOpen}
        onClose={() => setIsExpandedModalOpen(false)}
        filteredRows={filteredRows}
        hasRows={hasRows}
        averageRows={averageRows}
        totals={totals}
        loading={loading}
        error={error}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
      />
    </section>
  );
}
