import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
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

function HeaderTh({ children, className = "" }) {
  return (
    <th
      className={[
        "sticky top-0 z-10 border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-center align-middle text-[11px] font-extrabold uppercase leading-tight text-sibs-primary-90",
        className,
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function BodyTd({ children, className = "", ...props }) {
  return (
    <td
      {...props}
      className={[
        "border-b border-r border-slate-200 px-3 py-2.5 text-center align-middle text-sm font-bold text-sibs-primary-90",
        className,
      ].join(" ")}
    >
      {children}
    </td>
  );
}

function FooterTd({ children, className = "", ...props }) {
  return (
    <td
      {...props}
      className={[
        "border-t border-r border-slate-200 bg-slate-50 px-3 py-3 text-center align-middle text-sm font-extrabold text-sibs-primary-90",
        className,
      ].join(" ")}
    >
      {children}
    </td>
  );
}

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
    <div className="sibs-modal-blur fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="flex max-h-[92vh] w-full max-w-[96vw] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-extrabold uppercase tracking-tight text-sibs-primary-90">
                Forecast Week Details
              </h2>

              <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-extrabold uppercase text-purple-700">
                Account / Cluster Breakdown
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-500">
                {filteredRows.length} of {normalizedRows.length} rows
              </span>
            </div>

            <p className="mt-1 text-sm font-semibold text-sibs-primary-70">
              {forecastWeek?.label || "Selected forecast week"}
            </p>

            {forecastWeek?.forecastBasisStart &&
            forecastWeek?.forecastBasisEnd ? (
              <p className="mt-1 text-xs font-bold text-slate-500">
                Forecast basis: {forecastWeek.forecastBasisStart} to{" "}
                {forecastWeek.forecastBasisEnd}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-sibs-primary-90"
            aria-label="Close forecast details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Clicked forecast week rows are shown per account and cluster.
          </p>

          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sibs-primary-70" />

            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search cluster or account..."
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-sm font-semibold text-sibs-primary-90 outline-none transition placeholder:text-slate-400 focus:border-sibs-primary-70 focus:ring-4 focus:ring-blue-50"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="max-h-[62vh] overflow-auto">
              <table className="w-full min-w-[1760px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    <HeaderTh className="text-left">Cluster</HeaderTh>
                    <HeaderTh className="text-left">Account</HeaderTh>
                    <HeaderTh>
                      Required
                      <br />
                      Headcount
                    </HeaderTh>
                    <HeaderTh>
                      Actual
                      <br />
                      Headcount
                    </HeaderTh>
                    <HeaderTh>
                      Buffer
                      <br />
                      Percentage
                    </HeaderTh>
                    <HeaderTh>
                      Absenteeism
                      <br />
                      Count / %
                    </HeaderTh>
                    <HeaderTh>
                      Attrition
                      <br />
                      Count / %
                    </HeaderTh>
                    <HeaderTh>
                      Net Actual
                      <br />
                      HC
                    </HeaderTh>
                    <HeaderTh>
                      Hiring
                      <br />
                      Needed
                    </HeaderTh>
                    <HeaderTh>
                      Accepted
                      <br />
                      Job Offer
                    </HeaderTh>
                    <HeaderTh>
                      NHO
                      <br />
                      Count
                    </HeaderTh>
                    <HeaderTh>
                      FST
                      <br />
                      Count
                    </HeaderTh>
                    <HeaderTh>
                      PST
                      <br />
                      Count
                    </HeaderTh>
                    <HeaderTh>Go Live</HeaderTh>
                    <HeaderTh>
                      Hired
                      <br />
                      Count
                    </HeaderTh>
                    <HeaderTh>
                      Hiring Rate
                      <br />
                      (Leads to JO)
                    </HeaderTh>
                    <HeaderTh>
                      Leads to Interview
                      <br />
                      (To Generate)
                    </HeaderTh>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.length ? (
                    filteredRows.map((row, index) => (
                      <tr
                        key={`${row.cluster}-${row.account}-${row.id || index}`}
                        className="transition hover:bg-blue-50/40"
                      >
                        <BodyTd className="text-left whitespace-nowrap">
                          {row.cluster}
                        </BodyTd>
                        <BodyTd className="text-left whitespace-nowrap">
                          {row.account}
                        </BodyTd>
                        <BodyTd>
                          {formatOverviewNumber(row.requiredHeadcount)}
                        </BodyTd>
                        <BodyTd>
                          {formatOverviewNumber(row.actualHeadcount)}
                        </BodyTd>
                        <BodyTd className={getValueColor(row.bufferPercentage)}>
                          {formatOverviewPercent(row.bufferPercentage)}
                        </BodyTd>
                        <BodyTd className="text-orange-600">
                          <ForecastMetricWithPercent
                            value={row.absenteeism}
                            percent={row.absenteeismPercentage}
                            percentClassName="text-orange-500"
                          />
                        </BodyTd>
                        <BodyTd className="text-red-600">
                          <ForecastMetricWithPercent
                            value={row.attrition}
                            percent={row.attritionPercentage}
                            percentClassName="text-red-500"
                          />
                        </BodyTd>
                        <BodyTd>{formatOverviewNumber(row.netActualHc)}</BodyTd>
                        <BodyTd
                          className={getHiringNeededColor(row.hiringNeeded)}
                        >
                          {formatOverviewNumber(row.hiringNeeded)}
                        </BodyTd>
                        <BodyTd>{formatOverviewNumber(row.acceptedJo)}</BodyTd>
                        <BodyTd>{formatOverviewNumber(row.nho)}</BodyTd>
                        <BodyTd>{formatOverviewNumber(row.fst)}</BodyTd>
                        <BodyTd>{formatOverviewNumber(row.pst)}</BodyTd>
                        <BodyTd className="text-emerald-700">
                          {formatOverviewNumber(row.goLive)}
                        </BodyTd>
                        <BodyTd>{formatOverviewNumber(row.hiredCount)}</BodyTd>
                        <BodyTd>{formatOverviewPercent(row.hiringRate)}</BodyTd>
                        <BodyTd className="text-purple-700">
                          {formatOverviewNumber(row.leadsToInterview)}
                        </BodyTd>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <BodyTd colSpan={17}>
                        No account-level forecast rows found for this week.
                      </BodyTd>
                    </tr>
                  )}
                </tbody>

                {filteredRows.length ? (
                  <tfoot>
                    <tr>
                      <FooterTd className="text-left rounded-bl-xl">
                        TOTAL / AVG.
                      </FooterTd>
                      <FooterTd />
                      <FooterTd>
                        {formatOverviewNumber(totals.requiredHeadcount)}
                      </FooterTd>
                      <FooterTd>
                        {formatOverviewNumber(totals.actualHeadcount)}
                      </FooterTd>
                      <FooterTd
                        className={getValueColor(totals.bufferPercentage)}
                      >
                        {formatOverviewPercent(totals.bufferPercentage)}
                      </FooterTd>
                      <FooterTd className="text-orange-600">
                        <ForecastMetricWithPercent
                          value={totals.absenteeism}
                          percent={totals.absenteeismPercentage}
                          percentClassName="text-orange-500"
                        />
                      </FooterTd>
                      <FooterTd className="text-red-600">
                        <ForecastMetricWithPercent
                          value={totals.attrition}
                          percent={totals.attritionPercentage}
                          percentClassName="text-red-500"
                        />
                      </FooterTd>
                      <FooterTd>
                        {formatOverviewNumber(totals.netActualHc)}
                      </FooterTd>
                      <FooterTd
                        className={getHiringNeededColor(totals.hiringNeeded)}
                      >
                        {formatOverviewNumber(totals.hiringNeeded)}
                      </FooterTd>
                      <FooterTd>
                        {formatOverviewNumber(totals.acceptedJo)}
                      </FooterTd>
                      <FooterTd>{formatOverviewNumber(totals.nho)}</FooterTd>
                      <FooterTd>{formatOverviewNumber(totals.fst)}</FooterTd>
                      <FooterTd>{formatOverviewNumber(totals.pst)}</FooterTd>
                      <FooterTd className="text-emerald-700">
                        {formatOverviewNumber(totals.goLive)}
                      </FooterTd>
                      <FooterTd>
                        {formatOverviewNumber(totals.hiredCount)}
                      </FooterTd>
                      <FooterTd>
                        {formatOverviewPercent(totals.hiringRate)}
                      </FooterTd>
                      <FooterTd className="rounded-br-xl text-purple-700">
                        {formatOverviewNumber(totals.leadsToInterview)}
                      </FooterTd>
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
