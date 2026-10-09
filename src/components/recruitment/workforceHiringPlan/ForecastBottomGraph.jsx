import React, { useMemo, useRef, useState } from "react";
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

  return weekNumber ? `Week ${weekNumber}` : `Week ${index + 1}`;
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
    <article className="flex h-full min-h-[360px] 2xl:min-h-[390px] flex-col overflow-hidden rounded-[14px] border border-sibs-border bg-white p-3.5 2xl:p-4 shadow-sm">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-sibs-border pb-2.5">
        <div className="min-w-0">
          <h3 className="truncate font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
            {title}
          </h3>
          <p className="mt-0.5 truncate sibs-text-xs font-semibold text-sibs-muted">
            {subtitle}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 sibs-text-micro font-extrabold ${badgeClassName}`}
        >
          {badge}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col py-3 2xl:py-4">{children}</div>

      <div className="mt-auto flex shrink-0 items-center justify-between gap-3 border-t border-sibs-border pt-2.5 sibs-text-micro font-bold">
        <span className="font-semibold text-sibs-muted">{footerLabel}:</span>
        <strong className={`text-right font-extrabold ${footerValueClassName}`}>
          {footerValue}
        </strong>
      </div>
    </article>
  );
}

function PipelineFlowVisual({ pipeline }) {
  const stages = [
    { key: "acceptedJo", lines: ["Accepted", "Job Offer"], color: "var(--color-sibs-navy, sibs-navy)" },
    { key: "nho", lines: ["NHO", "Count"], color: "var(--tw-colors-blue-600, blue)" },
    { key: "fst", lines: ["FST", "Count"], color: "var(--tw-colors-teal-600, teal)" },
    { key: "pst", lines: ["PST", "Count"], color: "var(--tw-colors-orange-500, orange)" },
    { key: "goLive", lines: ["Go", "Live"], color: "var(--tw-colors-green-700, green)" },
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
              fill="var(--color-sibs-navy, sibs-navy)"
              fontSize="10"
              fontWeight="800"
            >
              <tspan x={x + barWidth / 2}>{stage.lines[0]}</tspan>
              <tspan x={x + barWidth / 2} dy="11" fill="var(--tw-colors-sibs-faint, lightslategray)" fontSize="8.5">
                {stage.lines[1]}
              </tspan>
            </text>

            {nextStage ? (
              <polygon
                points={`${x + barWidth},${y} ${nextX},${nextY} ${nextX},${baseY} ${x + barWidth},${baseY}`}
                fill="var(--tw-colors-red-50, mistyrose)"
                stroke="var(--tw-colors-red-200, lightpink)"
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
              fill="var(--tw-colors-white, white)"
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
              stroke="var(--tw-colors-slate-400, slategray)"
              strokeWidth="0.9"
            />
            <path
              d={`M ${x + barWidth / 2 - 3} ${baseY + 13} L ${x + barWidth / 2} ${baseY + 7} L ${x + barWidth / 2 + 3} ${baseY + 9}`}
              fill="none"
              stroke="var(--tw-colors-slate-400, slategray)"
              strokeWidth="0.9"
            />

            {drop ? (
              <text
                x={dropX}
                y={baseY + 27}
                textAnchor="middle"
                fill="var(--tw-colors-red-600, red)"
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
        fill="var(--tw-colors-red-600, red)"
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
          className="flex items-center justify-between gap-3 rounded-[10px] border border-sibs-border bg-sibs-surface px-3 py-3"
        >
          <span className="text-[11px] font-semibold text-sibs-navy">
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
  const [pointerPos, setPointerPos] = useState(null);
  const containerRef = useRef(null);

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

  function handleMouseMove(e) {
    if (!containerRef.current || !rows.length) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = ((e.clientX - rect.left) / rect.width) * width;
    const chartW = width - padLeft - padRight;
    const normalized = Math.min(Math.max((relativeX - padLeft) / chartW, 0), 1);
    const nearestIndex = Math.round(normalized * (rows.length - 1));

    setActiveIndex(nearestIndex);
    setPointerPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    });
  }

  function handleMouseLeave() {
    setActiveIndex(null);
    setPointerPos(null);
  }

  const tooltipStyle = useMemo(() => {
    if (!pointerPos || activeIndex === null) return {};
    const cardWidth = 175;
    const cardHeight = 115;

    const activeXPixels = (getX(activeIndex) / width) * pointerPos.width;
    let left = activeXPixels + 14;

    if (left + cardWidth > pointerPos.width - 12) {
      left = activeXPixels - cardWidth - 14;
    }
    left = Math.max(12, Math.min(left, pointerPos.width - cardWidth - 12));

    let top = pointerPos.y - cardHeight / 2;
    top = Math.max(12, Math.min(top, pointerPos.height - cardHeight - 12));

    return {
      left: `${left}px`,
      top: `${top}px`,
    };
  }, [pointerPos, activeIndex]);

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
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex min-h-0 flex-1 flex-col"
    >
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
                stroke="var(--tw-colors-sibs-border, lightgray)"
                strokeWidth="1"
              />
              <text
                x={padLeft - 7}
                y={y + 3}
                textAnchor="end"
                fill="var(--tw-colors-slate-900, darkslategray)"
                fontSize="10"
                fontWeight="700"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {activeIndex !== null ? (
          <line
            x1={getX(activeIndex)}
            x2={getX(activeIndex)}
            y1={padTop - 10}
            y2={height - padBottom}
            stroke="var(--color-sibs-navy, sibs-navy)"
            strokeWidth="1.3"
            strokeDasharray="4 4"
            pointerEvents="none"
          />
        ) : null}

        <path
          d={leadPath}
          fill="none"
          stroke="var(--tw-colors-purple-400, mediumpurple)"
          strokeWidth="2"
          strokeDasharray="4 3"
          opacity="0.65"
        />

        <path
          d={interviewPath}
          fill="none"
          stroke="var(--tw-colors-violet-600, blueviolet)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {rows.map((row, index) => {
          const x = getX(index);
          const y = getY(row.interviewsCompleted);
          const isActive = activeIndex === index;

          return (
            <g key={`${row.weekLabel}-${index}`} className="cursor-pointer">
              <rect
                x={x - 16}
                y={padTop - 10}
                width="32"
                height={height - padTop - padBottom + 18}
                fill="transparent"
              />
              <text
                x={x}
                y={y - (isActive ? 10 : 8)}
                textAnchor="middle"
                fill={isActive ? "var(--tw-colors-violet-600, blueviolet)" : "var(--tw-colors-slate-900, darkslategray)"}
                fontSize={isActive ? "12" : "11"}
                fontWeight="800"
              >
                {formatOverviewNumber(row.interviewsCompleted)}
              </text>
              <circle
                cx={x}
                cy={y}
                r={isActive ? "6.5" : "5"}
                fill="var(--tw-colors-violet-600, blueviolet)"
                stroke="var(--tw-colors-white, white)"
                strokeWidth={isActive ? "2" : "1.5"}
              />
              <text
                x={x}
                y={height - 5}
                textAnchor="middle"
                fill={isActive ? "var(--color-sibs-navy, sibs-navy)" : "var(--tw-colors-slate-500, slategray)"}
                fontSize="10"
                fontWeight={isActive ? "800" : "700"}
              >
                {row.weekLabel}
              </text>
            </g>
          );
        })}
      </svg>

      {activeRow ? (
        <div
          style={tooltipStyle}
          className="pointer-events-none absolute z-20 min-w-[165px] rounded-[14px] border border-[var(--tw-colors-sibs-navy-light, steelblue)] bg-sibs-navy/95 p-3 text-xs font-semibold text-white shadow-2xl backdrop-blur-sm transition-all duration-75"
        >
          <p className="border-b border-[var(--tw-colors-sibs-navy-light, steelblue)] pb-1.5 font-jakarta text-[11px] font-extrabold uppercase tracking-wide text-[var(--tw-colors-sibs-border, lightgray)]">
            {activeRow.weekLabel.toUpperCase()} DETAILS
          </p>
          <div className="mt-2 space-y-1.5 text-[11px]">
            <p className="flex items-center justify-between gap-3">
              <span className="text-[var(--tw-colors-sibs-border, lightgray)]">Interviews:</span>
              <strong className="font-extrabold text-violet-300">
                {formatOverviewNumber(activeRow.interviewsCompleted)}
              </strong>
            </p>
            <p className="flex items-center justify-between gap-3">
              <span className="text-[var(--tw-colors-sibs-border, lightgray)]">Total Leads:</span>
              <strong className="font-extrabold text-slate-200">
                {formatOverviewNumber(activeRow.leadsToInterview)}
              </strong>
            </p>
            <p className="flex items-center justify-between gap-3">
              <span className="text-[var(--tw-colors-sibs-border, lightgray)]">Yield %:</span>
              <strong className="font-extrabold text-emerald-400">
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
  const [pointerPos, setPointerPos] = useState(null);
  const containerRef = useRef(null);

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

  function handleMouseMove(e) {
    if (!containerRef.current || !rows.length) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = ((e.clientX - rect.left) / rect.width) * width;
    const chartW = width - padLeft - padRight;
    const normalized = Math.min(Math.max((relativeX - padLeft) / chartW, 0), 1);
    const nearestIndex = Math.round(normalized * (rows.length - 1));

    setActiveIndex(nearestIndex);
    setPointerPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    });
  }

  function handleMouseLeave() {
    setActiveIndex(null);
    setPointerPos(null);
  }

  const tooltipStyle = useMemo(() => {
    if (!pointerPos || activeIndex === null) return {};
    const cardWidth = 175;
    const cardHeight = 115;

    const activeXPixels = (getX(activeIndex) / width) * pointerPos.width;
    let left = activeXPixels + 14;

    if (left + cardWidth > pointerPos.width - 12) {
      left = activeXPixels - cardWidth - 14;
    }
    left = Math.max(12, Math.min(left, pointerPos.width - cardWidth - 12));

    let top = pointerPos.y - cardHeight / 2;
    top = Math.max(12, Math.min(top, pointerPos.height - cardHeight - 12));

    return {
      left: `${left}px`,
      top: `${top}px`,
    };
  }, [pointerPos, activeIndex]);

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
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex min-h-0 flex-1 flex-col"
    >
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
                stroke="var(--tw-colors-sibs-border, lightgray)"
                strokeWidth="1"
              />
              <text
                x={padLeft - 7}
                y={y + 3}
                textAnchor="end"
                fill="var(--tw-colors-slate-900, darkslategray)"
                fontSize="10"
                fontWeight="700"
              >
                {Math.round(tick)}%
              </text>
            </g>
          );
        })}

        {activeIndex !== null ? (
          <line
            x1={getX(activeIndex)}
            x2={getX(activeIndex)}
            y1={padTop - 10}
            y2={height - padBottom}
            stroke="var(--color-sibs-navy, sibs-navy)"
            strokeWidth="1.3"
            strokeDasharray="4 4"
            pointerEvents="none"
          />
        ) : null}

        <line
          x1={padLeft}
          y1={targetY}
          x2={width - padRight}
          y2={targetY}
          stroke="var(--tw-colors-amber-500, orange)"
          strokeWidth="1.8"
          strokeDasharray="3 2"
        />

        <path
          d={ratePath}
          fill="none"
          stroke="var(--tw-colors-teal-600, teal)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {rows.map((row, index) => {
          const x = getX(index);
          const y = getY(row.hiringRate);
          const isActive = activeIndex === index;

          return (
            <g key={`${row.weekLabel}-${index}`} className="cursor-pointer">
              <rect
                x={x - 16}
                y={padTop - 10}
                width="32"
                height={height - padTop - padBottom + 18}
                fill="transparent"
              />
              <text
                x={x}
                y={y - (isActive ? 10 : 8)}
                textAnchor="middle"
                fill={isActive ? "var(--tw-colors-teal-600, teal)" : "var(--tw-colors-slate-900, darkslategray)"}
                fontSize={isActive ? "12" : "11"}
                fontWeight="800"
              >
                {formatPercent(row.hiringRate, 1)}
              </text>
              <circle
                cx={x}
                cy={y}
                r={isActive ? "6.5" : "5"}
                fill="var(--tw-colors-teal-600, teal)"
                stroke="var(--tw-colors-white, white)"
                strokeWidth={isActive ? "2" : "1.5"}
              />
              <text
                x={x}
                y={height - 5}
                textAnchor="middle"
                fill={isActive ? "var(--color-sibs-navy, sibs-navy)" : "var(--tw-colors-slate-500, slategray)"}
                fontSize="10"
                fontWeight={isActive ? "800" : "700"}
              >
                {row.weekLabel}
              </text>
            </g>
          );
        })}
      </svg>

      {activeRow ? (
        <div
          style={tooltipStyle}
          className="pointer-events-none absolute z-20 min-w-[165px] rounded-[14px] border border-[var(--tw-colors-sibs-navy-light, steelblue)] bg-sibs-navy/95 p-3 text-xs font-semibold text-white shadow-2xl backdrop-blur-sm transition-all duration-75"
        >
          <p className="border-b border-[var(--tw-colors-sibs-navy-light, steelblue)] pb-1.5 font-jakarta text-[11px] font-extrabold uppercase tracking-wide text-[var(--tw-colors-sibs-border, lightgray)]">
            {activeRow.weekLabel.toUpperCase()} YIELD DETAILS
          </p>
          <div className="mt-2 space-y-1.5 text-[11px]">
            <p className="flex items-center justify-between gap-3">
              <span className="text-[var(--tw-colors-sibs-border, lightgray)]">Hiring Rate:</span>
              <strong className="font-extrabold text-teal-300">
                {formatPercent(activeRow.hiringRate, 1)}
              </strong>
            </p>
            <p className="flex items-center justify-between gap-3">
              <span className="text-[var(--tw-colors-sibs-border, lightgray)]">Target Floor:</span>
              <strong className="font-extrabold text-amber-300">
                {formatPercent(activeRow.targetFloor, 0)}
              </strong>
            </p>
            <p className="flex items-center justify-between gap-3">
              <span className="text-[var(--tw-colors-sibs-border, lightgray)]">Deployed Hires:</span>
              <strong className="font-extrabold text-emerald-400">
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
        iconBoxClassName="bg-sibs-navy"
        iconClassName="text-white"
        title="Pipeline Flow – Total (6 Weeks)"
        subtitle="6-Week Cumulative Training Funnel"
        badge={`${formatOverviewNumber(pipeline.acceptedJo)} JO`}
        badgeClassName="border-blue-100 bg-blue-50 text-blue-700"
        footerLabel="Overall Conversion"
        footerValue={`${formatPercent(pipeline.overallConversion, 1)} (JO to Live)`}
        footerValueClassName="text-sibs-orange"
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
            <strong className="text-[20px] font-black leading-none text-sibs-navy">
              {formatOverviewNumber(totalInterviews)}
            </strong>
            <span className="ml-1 text-[8px] font-bold uppercase text-sibs-muted">
              Interviews
            </span>
          </div>
          <strong className="text-[10px] font-extrabold text-violet-600">
            {formatPercent(averageYield, 1)} Avg Yield
          </strong>
        </div>

        <div className="mb-1 flex items-center justify-between gap-3 border-b border-sibs-border pb-1.5 text-[8px] font-bold">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-violet-700">
              <span className="h-2 w-2 rounded-full bg-violet-600" />
              Interviews Completed
            </span>
            <span className="inline-flex items-center gap-1 text-[var(--tw-colors-violet-400, mediumpurple)]">
              <span className="w-3 border-t border-dashed border-[var(--tw-colors-purple-400, mediumpurple)]" />
              Leads Vol (Ref)
            </span>
          </div>
          <span className="text-sibs-muted">6-Wk Trend</span>
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
            <span className="ml-1 text-[8px] font-bold uppercase text-sibs-muted">
              JO Yield
            </span>
          </div>
          <strong className="text-[10px] font-extrabold text-emerald-600">
            {formatOverviewNumber(deployedCount)} Deployed
          </strong>
        </div>

        <div className="mb-1 flex items-center justify-between gap-3 border-b border-sibs-border pb-1.5 text-[8px] font-bold">
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
          <span className="text-sibs-muted">6-Wk Trend</span>
        </div>

        <HiringRateTrendChart rows={graphRows} />
      </AnalyticsCard>
      </div>
    </section>
  );
}