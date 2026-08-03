import React, { useMemo, useState } from "react";
import {
  ShieldAlert,
  TrendingUp,
  UsersRound,
  Workflow,
} from "lucide-react";
import {
  formatOverviewNumber,
} from "../../../lib/utils/workforceHiringOverview/workforceHiringOverviewHelpers";

function safeNumber(value) {
  const numberValue = Number(String(value ?? 0).replace(/,/g, "").replace(/%/g, ""));
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatPercent(value, decimals = 1) {
  return `${safeNumber(value).toFixed(decimals)}%`;
}

function getDateValue(row = {}, keys = []) {
  for (const key of keys) {
    const value = row?.[key];

    if (value) return String(value).slice(0, 10);
  }

  return "";
}

function parseDate(value) {
  if (!value) return null;

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getWeekNumberFromDate(value) {
  const date = parseDate(value);

  if (!date) return 0;

  const year = date.getFullYear();
  const firstDate = new Date(year, 0, 1);
  const firstDay = firstDate.getDay();
  const diffToMonday = firstDay === 0 ? -6 : 1 - firstDay;

  firstDate.setDate(firstDate.getDate() + diffToMonday);
  firstDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor(
    (date.getTime() - firstDate.getTime()) / 86_400_000,
  );

  return diffDays >= 0 ? Math.floor(diffDays / 7) + 1 : 0;
}

function getWeekStart(row = {}) {
  return getDateValue(row, [
    "weekStart",
    "week_start",
    "startDate",
    "start_date",
    "dateStart",
    "date_start",
    "weekStartDate",
    "week_start_date",
  ]);
}

function getWeekLabel(row = {}, index = 0) {
  const weekStart = getWeekStart(row);
  const weekNumber =
    row?.weekNumber || row?.week_number || getWeekNumberFromDate(weekStart);

  return weekNumber ? `W${weekNumber}` : `W${index + 1}`;
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

function averageRows(rows = [], key) {
  if (!rows.length) return 0;

  return rows.reduce((total, row) => total + safeNumber(row?.[key]), 0) /
    rows.length;
}

function sumRows(rows = [], key) {
  return rows.reduce((total, row) => total + safeNumber(row?.[key]), 0);
}

function normalizeGraphRow(row = {}, index = 0) {
  const acceptedJo = getRowNumber(row, [
    "acceptedJo",
    "acceptedJO",
    "accepted_jo",
    "acceptedJobOffer",
    "accepted_job_offer",
  ]);

  const leadsToInterview = getRowNumber(row, [
    "leadsToInterview",
    "leads_to_interview",
    "targetLeads",
    "target_leads",
  ]);

  const interviewsCompleted = getRowNumber(
    row,
    [
      "interviewsCompleted",
      "interviews_completed",
      "interviewCount",
      "interview_count",
      "interviewPopulationCount",
      "interview_population_count",
    ],
    acceptedJo,
  );

  const hiringRate = getRowNumber(
    row,
    [
      "hiringRate",
      "hiring_rate",
      "hiringPlanPercent",
      "hiring_plan_percent",
    ],
    leadsToInterview > 0 ? (acceptedJo / leadsToInterview) * 100 : 0,
  );

  const yieldPct = getRowNumber(
    row,
    ["yieldPct", "yield_pct", "interviewYield", "interview_yield"],
    leadsToInterview > 0
      ? (interviewsCompleted / leadsToInterview) * 100
      : 0,
  );

  const goLive = getRowNumber(row, [
    "goLive",
    "go_live",
    "goLiveCount",
    "go_live_count",
    "projectedToBeEndorsed",
    "projected_to_be_endorsed",
  ]);

  return {
    ...row,
    weekLabel: getWeekLabel(row, index),
    acceptedJo,
    nho: getRowNumber(row, ["nho", "nhoCount", "nho_count"]),
    fst: getRowNumber(row, ["fst", "fstCount", "fst_count"]),
    pst: getRowNumber(row, ["pst", "pstCount", "pst_count"]),
    goLive,
    hiredCount: getRowNumber(
      row,
      ["hiredCount", "hired_count", "hired"],
      goLive,
    ),
    leadsToInterview,
    interviewsCompleted,
    hiringRate,
    yieldPct,
    targetFloor: getRowNumber(
      row,
      ["targetFloor", "target_floor", "hiringRateTarget", "hiring_rate_target"],
      20,
    ),
  };
}

function getNormalizedRows(rows = []) {
  return (Array.isArray(rows) ? rows : []).map(normalizeGraphRow);
}

function getPipelineDrop(fromValue, toValue) {
  const count = Math.max(0, Math.round(safeNumber(fromValue) - safeNumber(toValue)));
  const percent = fromValue > 0 ? (count / fromValue) * 100 : 0;

  return { count, percent };
}

function getPipelineSummary(rows = []) {
  if (!rows.length) {
    return {
      acceptedJo: 0,
      nho: 0,
      fst: 0,
      pst: 0,
      goLive: 0,
      drops: [],
      totalLosses: 0,
      overallConversion: 0,
      cumulativeLossRate: 0,
    };
  }

  const acceptedJo = Math.round(averageRows(rows, "acceptedJo"));
  const nho = Math.round(averageRows(rows, "nho"));
  const fst = Math.round(averageRows(rows, "fst"));
  const pst = Math.round(averageRows(rows, "pst"));
  const goLive = Math.round(averageRows(rows, "goLive"));

  const drops = [
    { label: "JO → NHO", ...getPipelineDrop(acceptedJo, nho) },
    { label: "NHO → FST", ...getPipelineDrop(nho, fst) },
    { label: "FST → PST", ...getPipelineDrop(fst, pst) },
    { label: "PST → Go Live", ...getPipelineDrop(pst, goLive) },
  ];

  const totalLosses = Math.max(0, acceptedJo - goLive);
  const overallConversion = acceptedJo > 0 ? (goLive / acceptedJo) * 100 : 0;
  const cumulativeLossRate = acceptedJo > 0 ? (totalLosses / acceptedJo) * 100 : 0;

  return {
    acceptedJo,
    nho,
    fst,
    pst,
    goLive,
    drops,
    totalLosses,
    overallConversion,
    cumulativeLossRate,
  };
}

function AnalyticsCard({
  icon: Icon,
  iconClassName,
  iconBoxClassName,
  title,
  subtitle,
  badge,
  badgeClassName,
  children,
  footerLabel,
  footerValue,
  footerValueClassName,
}) {
  return (
    <article className="flex h-full min-h-[390px] flex-col overflow-hidden rounded-[18px] border border-[#DDE5EE] bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.08)]">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#E9EEF4] pb-3">
        <div className="min-w-0">
          <h3 className="truncate text-xs font-extrabold leading-5 text-[#042C51]">
            {title}
          </h3>
          <p className="truncate text-[10px] font-semibold leading-4 text-[#6B88A8]">
            {subtitle}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${badgeClassName}`}
        >
          {badge}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col py-4">{children}</div>

      <div className="mt-auto flex shrink-0 items-center justify-between gap-3 border-t border-[#E9EEF4] pt-3 text-[10px]">
        <span className="font-medium text-[#6B88A8]">{footerLabel}:</span>
        <strong className={`text-right font-extrabold ${footerValueClassName}`}>
          {footerValue}
        </strong>
      </div>
    </article>
  );
}

function PipelineFlowVisual({ pipeline }) {
  const stages = [
    { key: "acceptedJo", lines: ["Accepted", "Job Offer"], color: "#042C51" },
    { key: "nho", lines: ["NHO", "Count"], color: "#2563EB" },
    { key: "fst", lines: ["FST", "Count"], color: "#0D9488" },
    { key: "pst", lines: ["PST", "Count"], color: "#F97316" },
    { key: "goLive", lines: ["Go", "Live"], color: "#15803D" },
  ].map((stage) => ({
    ...stage,
    value: safeNumber(pipeline?.[stage.key]),
  }));

  const maxValue = Math.max(...stages.map((stage) => stage.value), 1);
  const width = 760;
  const height = 255;
  const baseY = 174;
  const barWidth = 70;
  const gap = 80;
  const startX = 25;
  const minHeight = 72;
  const maxHeight = 118;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[245px] w-full">
      {stages.map((stage, index) => {
        const x = startX + index * (barWidth + gap);
        const barHeight =
          minHeight + (stage.value / maxValue) * (maxHeight - minHeight);
        const y = baseY - barHeight;
        const nextStage = stages[index + 1];
        const nextX = startX + (index + 1) * (barWidth + gap);
        const nextHeight = nextStage
          ? minHeight + (nextStage.value / maxValue) * (maxHeight - minHeight)
          : barHeight;
        const nextY = baseY - nextHeight;
        const drop = pipeline.drops[index];
        const dropX = (x + barWidth + nextX) / 2;

        return (
          <g key={stage.key}>
            <text
              x={x + barWidth / 2}
              y="18"
              textAnchor="middle"
              fill="#042C51"
              fontSize="10"
              fontWeight="800"
            >
              <tspan x={x + barWidth / 2}>{stage.lines[0]}</tspan>
              <tspan x={x + barWidth / 2} dy="11" fill="#6B88A8" fontSize="8.5">
                {stage.lines[1]}
              </tspan>
            </text>

            {nextStage ? (
              <polygon
                points={`${x + barWidth},${y} ${nextX},${nextY} ${nextX},${baseY} ${x + barWidth},${baseY}`}
                fill="#FDEAEA"
                stroke="#F8CACA"
                strokeWidth="0.6"
              />
            ) : null}

            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx="4"
              fill={stage.color}
            />

            <text
              x={x + barWidth / 2}
              y={y + barHeight / 2 + 4}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="14"
              fontWeight="900"
            >
              {formatOverviewNumber(stage.value)}
            </text>

            <line
              x1={x + barWidth / 2}
              x2={x + barWidth / 2}
              y1={baseY + 7}
              y2={baseY + 18}
              stroke="#94A3B8"
              strokeWidth="0.9"
            />
            <path
              d={`M ${x + barWidth / 2 - 3} ${baseY + 13} L ${x + barWidth / 2} ${baseY + 7} L ${x + barWidth / 2 + 3} ${baseY + 9}`}
              fill="none"
              stroke="#94A3B8"
              strokeWidth="0.9"
            />

            {drop ? (
              <text
                x={dropX}
                y={baseY + 27}
                textAnchor="middle"
                fill="#DC2626"
                fontSize="8.5"
                fontWeight="800"
              >
                -{formatOverviewNumber(drop.count)} (-{drop.percent.toFixed(2)}%)
              </text>
            ) : null}
          </g>
        );
      })}

      <text
        x={width / 2}
        y={height - 10}
        textAnchor="middle"
        fill="#DC2626"
        fontSize="10"
        fontWeight="800"
      >
        Drop = Attrition Count (% Attrition)
      </text>
    </svg>
  );
}

function AttritionStageList({ drops = [] }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-3">
      {drops.map((drop) => (
        <div
          key={drop.label}
          className="flex items-center justify-between gap-3 rounded-[7px] border border-[#E9EEF4] bg-[#F8FAFC] px-3 py-3"
        >
          <span className="text-[11px] font-semibold text-[#344054]">
            {drop.label}:
          </span>
          <strong className="text-right text-[10px] font-extrabold text-rose-600">
            {formatOverviewNumber(drop.count)} candidates ({formatPercent(drop.percent, 1)})
          </strong>
        </div>
      ))}
    </div>
  );
}

function LeadsTrendChart({ rows = [] }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const width = 760;
  const height = 250;
  const padLeft = 46;
  const padRight = 24;
  const padTop = 38;
  const padBottom = 34;

  const maxInterview = Math.max(
    1,
    ...rows.map((row) => safeNumber(row.interviewsCompleted)),
  );
  const maxLead = Math.max(1, ...rows.map((row) => safeNumber(row.leadsToInterview)));
  const yMax = Math.max(100, Math.ceil(maxInterview / 25) * 25);
  const leadScale = maxLead > 0 ? maxLead / yMax : 1;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) =>
    Math.round(yMax * ratio),
  );

  function getX(index) {
    if (rows.length <= 1) return padLeft;

    return padLeft + (index / (rows.length - 1)) * (width - padLeft - padRight);
  }

  function getY(value) {
    return (
      height -
      padBottom -
      (safeNumber(value) / yMax) * (height - padTop - padBottom)
    );
  }

  const interviewPath = rows
    .map(
      (row, index) =>
        `${index === 0 ? "M" : "L"} ${getX(index)} ${getY(row.interviewsCompleted)}`,
    )
    .join(" ");

  const leadPath = rows
    .map(
      (row, index) =>
        `${index === 0 ? "M" : "L"} ${getX(index)} ${getY(row.leadsToInterview / leadScale)}`,
    )
    .join(" ");

  const activeRow = activeIndex !== null ? rows[activeIndex] : null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[245px] w-full">
        {ticks.map((tick) => {
          const y = getY(tick);

          return (
            <g key={tick}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#E8EDF3"
                strokeWidth="1"
              />
              <text
                x={padLeft - 7}
                y={y + 3}
                textAnchor="end"
                fill="#0F172A"
                fontSize="10"
                fontWeight="700"
              >
                {tick}
              </text>
            </g>
          );
        })}

        <path
          d={leadPath}
          fill="none"
          stroke="#C084FC"
          strokeWidth="2"
          strokeDasharray="4 3"
          opacity="0.65"
        />

        <path
          d={interviewPath}
          fill="none"
          stroke="#7C3AED"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {rows.map((row, index) => {
          const x = getX(index);
          const y = getY(row.interviewsCompleted);

          return (
            <g
              key={`${row.weekLabel}-${index}`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className="cursor-pointer"
            >
              <rect
                x={x - 16}
                y={padTop - 10}
                width="32"
                height={height - padTop - padBottom + 18}
                fill="transparent"
              />
              <text
                x={x}
                y={y - 8}
                textAnchor="middle"
                fill="#0F172A"
                fontSize="11"
                fontWeight="800"
              >
                {formatOverviewNumber(row.interviewsCompleted)}
              </text>
              <circle cx={x} cy={y} r="5" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="1.5" />
              <text
                x={x}
                y={height - 5}
                textAnchor="middle"
                fill="#64748B"
                fontSize="10"
                fontWeight="700"
              >
                {row.weekLabel}
              </text>
            </g>
          );
        })}
      </svg>

      {activeRow ? (
        <div className="pointer-events-none absolute right-0 top-0 min-w-[124px] rounded-[8px] border border-purple-700 bg-[#042C51] px-2.5 py-2 text-[8px] font-semibold text-white shadow-xl">
          <p className="border-b border-purple-700/70 pb-1 font-extrabold text-purple-300">
            {activeRow.weekLabel} Details
          </p>
          <div className="mt-1 space-y-1 font-mono">
            <p className="flex justify-between gap-3">
              <span className="text-purple-300">Interviews:</span>
              <strong>{formatOverviewNumber(activeRow.interviewsCompleted)}</strong>
            </p>
            <p className="flex justify-between gap-3">
              <span className="text-slate-300">Total Leads:</span>
              <strong>{formatOverviewNumber(activeRow.leadsToInterview)}</strong>
            </p>
            <p className="flex justify-between gap-3">
              <span className="text-emerald-300">Yield %:</span>
              <strong className="text-emerald-400">
                {formatPercent(activeRow.yieldPct, 1)}
              </strong>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HiringRateTrendChart({ rows = [] }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const width = 760;
  const height = 250;
  const padLeft = 50;
  const padRight = 24;
  const padTop = 38;
  const padBottom = 34;

  const minRate = Math.min(10, ...rows.map((row) => safeNumber(row.hiringRate)));
  const maxRate = Math.max(
    25,
    ...rows.map((row) => safeNumber(row.hiringRate)),
    ...rows.map((row) => safeNumber(row.targetFloor)),
  );
  const yMin = Math.floor(minRate / 5) * 5;
  const yMax = Math.ceil(maxRate / 5) * 5;
  const range = Math.max(5, yMax - yMin);
  const tickStep = range / 3;
  const ticks = [0, 1, 2, 3].map((index) => yMin + tickStep * index);

  function getX(index) {
    if (rows.length <= 1) return padLeft;

    return padLeft + (index / (rows.length - 1)) * (width - padLeft - padRight);
  }

  function getY(value) {
    return (
      height -
      padBottom -
      ((safeNumber(value) - yMin) / range) * (height - padTop - padBottom)
    );
  }

  const ratePath = rows
    .map(
      (row, index) =>
        `${index === 0 ? "M" : "L"} ${getX(index)} ${getY(row.hiringRate)}`,
    )
    .join(" ");

  const targetFloor = rows.length
    ? averageRows(rows, "targetFloor") || 20
    : 20;
  const targetY = getY(targetFloor);
  const activeRow = activeIndex !== null ? rows[activeIndex] : null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[245px] w-full">
        {ticks.map((tick) => {
          const y = getY(tick);

          return (
            <g key={tick}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#E8EDF3"
                strokeWidth="1"
              />
              <text
                x={padLeft - 7}
                y={y + 3}
                textAnchor="end"
                fill="#0F172A"
                fontSize="10"
                fontWeight="700"
              >
                {Math.round(tick)}%
              </text>
            </g>
          );
        })}

        <line
          x1={padLeft}
          y1={targetY}
          x2={width - padRight}
          y2={targetY}
          stroke="#F59E0B"
          strokeWidth="1.8"
          strokeDasharray="3 2"
        />

        <path
          d={ratePath}
          fill="none"
          stroke="#0D9488"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {rows.map((row, index) => {
          const x = getX(index);
          const y = getY(row.hiringRate);

          return (
            <g
              key={`${row.weekLabel}-${index}`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className="cursor-pointer"
            >
              <rect
                x={x - 16}
                y={padTop - 10}
                width="32"
                height={height - padTop - padBottom + 18}
                fill="transparent"
              />
              <text
                x={x}
                y={y - 8}
                textAnchor="middle"
                fill="#0F172A"
                fontSize="11"
                fontWeight="800"
              >
                {formatPercent(row.hiringRate, 1)}
              </text>
              <circle cx={x} cy={y} r="5" fill="#0D9488" stroke="#FFFFFF" strokeWidth="1.5" />
              <text
                x={x}
                y={height - 5}
                textAnchor="middle"
                fill="#64748B"
                fontSize="10"
                fontWeight="700"
              >
                {row.weekLabel}
              </text>
            </g>
          );
        })}
      </svg>

      {activeRow ? (
        <div className="pointer-events-none absolute right-0 top-0 min-w-[128px] rounded-[8px] border border-teal-700 bg-[#042C51] px-2.5 py-2 text-[8px] font-semibold text-white shadow-xl">
          <p className="border-b border-teal-700/70 pb-1 font-extrabold text-teal-300">
            {activeRow.weekLabel} Yield Details
          </p>
          <div className="mt-1 space-y-1 font-mono">
            <p className="flex justify-between gap-3">
              <span className="text-teal-300">Hiring Rate:</span>
              <strong>{formatPercent(activeRow.hiringRate, 1)}</strong>
            </p>
            <p className="flex justify-between gap-3">
              <span className="text-amber-300">Target Floor:</span>
              <strong className="text-amber-200">
                {formatPercent(activeRow.targetFloor, 0)}
              </strong>
            </p>
            <p className="flex justify-between gap-3">
              <span className="text-emerald-300">Deployed Hires:</span>
              <strong className="text-emerald-400">
                {formatOverviewNumber(activeRow.hiredCount)}
              </strong>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ForecastBottomGraphs({ rows = [] }) {
  const graphRows = useMemo(() => getNormalizedRows(rows), [rows]);
  const pipeline = useMemo(() => getPipelineSummary(graphRows), [graphRows]);

  if (!graphRows.length) return null;

  const totalLeads = Math.round(sumRows(graphRows, "leadsToInterview"));
  const totalInterviews = Math.round(sumRows(graphRows, "interviewsCompleted"));
  const averageYield =
    totalLeads > 0 ? (totalInterviews / totalLeads) * 100 : averageRows(graphRows, "yieldPct");
  const weeklyAverageLeads = graphRows.length
    ? Math.round(totalLeads / graphRows.length)
    : 0;
  const averageHiringRate = averageRows(graphRows, "hiringRate");
  const averageTargetFloor = averageRows(graphRows, "targetFloor") || 20;
  const deployedCount = pipeline.goLive;
  const isOnTarget = averageHiringRate >= averageTargetFloor;

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-10">
        <div className="xl:col-span-7">
      <AnalyticsCard
        icon={Workflow}
        iconBoxClassName="bg-[#042C51]"
        iconClassName="text-white"
        title="Pipeline Flow – Total (6 Weeks)"
        subtitle="6-Week Cumulative Training Funnel"
        badge={`${formatOverviewNumber(pipeline.acceptedJo)} JO`}
        badgeClassName="border-blue-100 bg-blue-50 text-blue-700"
        footerLabel="Overall Conversion"
        footerValue={`${formatPercent(pipeline.overallConversion, 1)} (JO to Live)`}
        footerValueClassName="text-[#F97316]"
      >
        <PipelineFlowVisual pipeline={pipeline} />
      </AnalyticsCard>
        </div>

        <div className="xl:col-span-3">
          <AnalyticsCard
        icon={ShieldAlert}
        iconBoxClassName="bg-rose-50"
        iconClassName="text-rose-600"
        title="Attrition by Stage – Total (6 Weeks)"
        subtitle="Stage Drop-off Loss Breakdown"
        badge={`${formatOverviewNumber(pipeline.totalLosses)} Losses`}
        badgeClassName="border-rose-100 bg-rose-50 text-rose-600"
        footerLabel="Cumulative Loss Rate"
        footerValue={`${formatPercent(pipeline.cumulativeLossRate, 1)} Total Drop`}
        footerValueClassName="text-rose-600"
      >
        <AttritionStageList drops={pipeline.drops} />
      </AnalyticsCard>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnalyticsCard
        icon={UsersRound}
        iconBoxClassName="bg-violet-50"
        iconClassName="text-violet-600"
        title="Leads to Interview Trend"
        subtitle="6-Week Sourcing Volume & Yield"
        badge={`${formatOverviewNumber(totalLeads)} Leads`}
        badgeClassName="border-violet-100 bg-violet-50 text-violet-700"
        footerLabel="Weekly Avg Sourcing"
        footerValue={`${formatOverviewNumber(weeklyAverageLeads)} Leads / Wk`}
        footerValueClassName="text-violet-700"
      >
        <div className="mb-1 flex items-end justify-between gap-3">
          <div>
            <strong className="text-[20px] font-black leading-none text-[#042C51]">
              {formatOverviewNumber(totalInterviews)}
            </strong>
            <span className="ml-1 text-[8px] font-bold uppercase text-[#6B88A8]">
              Interviews
            </span>
          </div>
          <strong className="text-[10px] font-extrabold text-violet-600">
            {formatPercent(averageYield, 1)} Avg Yield
          </strong>
        </div>

        <div className="mb-1 flex items-center justify-between gap-3 border-b border-[#E9EEF4] pb-1.5 text-[8px] font-bold">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-violet-700">
              <span className="h-2 w-2 rounded-full bg-violet-600" />
              Interviews Completed
            </span>
            <span className="inline-flex items-center gap-1 text-[#A78BFA]">
              <span className="w-3 border-t border-dashed border-[#C084FC]" />
              Leads Vol (Ref)
            </span>
          </div>
          <span className="text-[#94A3B8]">6-Wk Trend</span>
        </div>

        <LeadsTrendChart rows={graphRows} />
      </AnalyticsCard>

      <AnalyticsCard
        icon={TrendingUp}
        iconBoxClassName="bg-teal-50"
        iconClassName="text-teal-600"
        title="Hiring Rate Trend"
        subtitle="6-Week Lead-to-JO Yield %"
        badge={`${formatPercent(averageHiringRate, 1)} Avg`}
        badgeClassName="border-teal-100 bg-teal-50 text-teal-700"
        footerLabel="6-Wk Target Status"
        footerValue={
          isOnTarget
            ? `On Target (≥ ${formatPercent(averageTargetFloor, 0)})`
            : `Below Target (< ${formatPercent(averageTargetFloor, 0)})`
        }
        footerValueClassName={isOnTarget ? "text-teal-700" : "text-rose-600"}
      >
        <div className="mb-1 flex items-end justify-between gap-3">
          <div>
            <strong className="text-[20px] font-black leading-none text-teal-600">
              {formatPercent(averageHiringRate, 1)}
            </strong>
            <span className="ml-1 text-[8px] font-bold uppercase text-[#6B88A8]">
              JO Yield
            </span>
          </div>
          <strong className="text-[10px] font-extrabold text-emerald-600">
            {formatOverviewNumber(deployedCount)} Deployed
          </strong>
        </div>

        <div className="mb-1 flex items-center justify-between gap-3 border-b border-[#E9EEF4] pb-1.5 text-[8px] font-bold">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-teal-700">
              <span className="h-2 w-2 rounded-full bg-teal-600" />
              Hiring Rate %
            </span>
            <span className="inline-flex items-center gap-1 text-amber-600">
              <span className="w-3 border-t border-dashed border-amber-500" />
              Target Floor (20%)
            </span>
          </div>
          <span className="text-[#94A3B8]">6-Wk Trend</span>
        </div>

        <HiringRateTrendChart rows={graphRows} />
      </AnalyticsCard>
      </div>
    </section>
  );
}