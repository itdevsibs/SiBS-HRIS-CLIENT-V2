import {
  formatOverviewNumber,
  formatOverviewPercent,
} from "../../../lib/utils/workforceHiringOverview/workforceHiringOverviewHelpers";

function safeNumber(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
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
  const weekOneStart = new Date(`${year}-01-01T00:00:00`);
  const day = weekOneStart.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  weekOneStart.setDate(weekOneStart.getDate() + diffToMonday);
  weekOneStart.setHours(0, 0, 0, 0);

  const diffDays = Math.floor(
    (date.getTime() - weekOneStart.getTime()) / 86_400_000,
  );

  if (!Number.isFinite(diffDays) || diffDays < 0) return 0;

  return Math.floor(diffDays / 7) + 1;
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

function sumRows(rows = [], key) {
  return rows.reduce((total, row) => total + safeNumber(row?.[key]), 0);
}

function averageRows(rows = [], key) {
  if (!rows.length) return 0;

  return (
    rows.reduce((total, row) => total + safeNumber(row?.[key]), 0) / rows.length
  );
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

function normalizeGraphRow(row = {}) {
  return {
    ...row,

    acceptedJo: getRowNumber(row, [
      "acceptedJo",
      "acceptedJO",
      "accepted_jo",
      "acceptedJobOffer",
      "accepted_job_offer",
      "interviewCount",
      "interview_count",
      "interviewPopulationCount",
      "interview_population_count",
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

    acceptedJoToNhoCount: getRowNumber(row, [
      "acceptedJoToNhoCount",
      "accepted_jo_to_nho_count",
      "attritionInterviewToNhoCount",
      "attrition_interview_to_nho_count",
    ]),
    acceptedJoToNhoPercent: getRowNumber(row, [
      "acceptedJoToNhoPercent",
      "accepted_jo_to_nho_percent",
      "attritionInterviewToNhoPercent",
      "attrition_interview_to_nho_percent",
    ]),

    nhoToFstCount: getRowNumber(row, [
      "nhoToFstCount",
      "nho_to_fst_count",
      "attritionNhoToFstCount",
      "attrition_nho_to_fst_count",
    ]),
    nhoToFstPercent: getRowNumber(row, [
      "nhoToFstPercent",
      "nho_to_fst_percent",
      "attritionNhoToFstPercent",
      "attrition_nho_to_fst_percent",
    ]),

    fstToPstCount: getRowNumber(row, [
      "fstToPstCount",
      "fst_to_pst_count",
      "attritionFstToPstCount",
      "attrition_fst_to_pst_count",
    ]),
    fstToPstPercent: getRowNumber(row, [
      "fstToPstPercent",
      "fst_to_pst_percent",
      "attritionFstToPstPercent",
      "attrition_fst_to_pst_percent",
    ]),

    nhoToPstCount: getRowNumber(row, [
      "nhoToPstCount",
      "nho_to_pst_count",
      "attritionNhoToPstCount",
      "attrition_nho_to_pst_count",
      "attritionNhoToFstPstCount",
      "attrition_nho_to_fst_pst_count",
    ]),
    nhoToPstPercent: getRowNumber(row, [
      "nhoToPstPercent",
      "nho_to_pst_percent",
      "attritionNhoToPstPercent",
      "attrition_nho_to_pst_percent",
      "attritionNhoToFstPstPercent",
      "attrition_nho_to_fst_pst_percent",
    ]),

    pstToGoLiveCount: getRowNumber(row, [
      "pstToGoLiveCount",
      "pst_to_go_live_count",
      "attritionPstToGoLiveCount",
      "attrition_pst_to_go_live_count",
    ]),
    pstToGoLivePercent: getRowNumber(row, [
      "pstToGoLivePercent",
      "pst_to_go_live_percent",
      "attritionPstToGoLivePercent",
      "attrition_pst_to_go_live_percent",
    ]),
  };
}

function getNormalizedGraphRows(rows = []) {
  return (Array.isArray(rows) ? rows : []).map(normalizeGraphRow);
}

function getPipelineDrop(fromValue, toValue) {
  const count = Math.max(0, Math.round(fromValue - toValue));
  const percent = fromValue > 0 ? (count / fromValue) * 100 : 0;

  return {
    count,
    percent,
  };
}

function getPipelineSourceRow(rows = []) {
  if (!rows.length) return {};

  /*
    Match the forecast table TOTAL / AVG. row.

    The pipeline graph is a TOTAL (6 weeks) visual, so it must not use the
    last forecast week only. It uses the same Excel-style average:
    average the six weekly count columns first, round them, then derive drops.
  */
  const acceptedJo = Math.round(averageRows(rows, "acceptedJo"));
  const nho = Math.round(averageRows(rows, "nho"));
  const fst = Math.round(averageRows(rows, "fst"));
  const pst = Math.round(averageRows(rows, "pst"));
  const goLive = Math.round(averageRows(rows, "goLive"));
  const hiredCount = Math.round(averageRows(rows, "hiredCount"));
  const leadsToInterview = Math.round(averageRows(rows, "leadsToInterview"));

  const hiringRate = acceptedJo > 0 ? (fst / acceptedJo) * 100 : 0;

  const acceptedJoToNho = getPipelineDrop(acceptedJo, nho);
  const nhoToFst = getPipelineDrop(nho, fst);
  const fstToPst = getPipelineDrop(fst, pst);
  const nhoToPst = getPipelineDrop(nho, pst);
  const pstToGoLive = getPipelineDrop(pst, goLive);

  return {
    acceptedJo,
    nho,
    fst,
    pst,
    goLive,
    hiredCount,
    hiringRate,
    leadsToInterview,

    acceptedJoToNhoCount: acceptedJoToNho.count,
    acceptedJoToNhoPercent: acceptedJoToNho.percent,

    nhoToFstCount: nhoToFst.count,
    nhoToFstPercent: nhoToFst.percent,

    fstToPstCount: fstToPst.count,
    fstToPstPercent: fstToPst.percent,

    nhoToPstCount: nhoToPst.count,
    nhoToPstPercent: nhoToPst.percent,

    pstToGoLiveCount: pstToGoLive.count,
    pstToGoLivePercent: pstToGoLive.percent,
  };
}

function getTrendPointLabel(row = {}, index = 0) {
  const weekStart = getWeekStart(row);
  const weekNumber =
    row?.weekNumber || row?.week_number || getWeekNumberFromDate(weekStart);

  return weekNumber ? String(weekNumber) : String(index + 1);
}

function GraphCard({ title, children }) {
  return (
    <div className="flex h-[300px] min-h-[300px] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="shrink-0 text-sm font-extrabold uppercase tracking-tight text-sibs-primary-90">
        {title}
      </h3>

      <div className="mt-2 flex min-h-0 flex-1 flex-col justify-between">
        {children}
      </div>
    </div>
  );
}

function MiniPipelineFlowGraph({ rows = [] }) {
  const pipelineSourceRow = getPipelineSourceRow(rows);

  const stages = [
    {
      key: "acceptedJo",
      label: "Accepted\nJob Offer",
      color: "#1E5FC6",
    },
    {
      key: "nho",
      label: "NHO\nCount",
      color: "#6B4AA3",
    },
    {
      key: "fst",
      label: "FST\nCount",
      color: "#0C9297",
    },
    {
      key: "pst",
      label: "PST\nCount",
      color: "#F5820B",
    },
    {
      key: "goLive",
      label: "Go Live",
      color: "#4D9531",
    },
  ].map((stage) => ({
    ...stage,
    value: Math.round(safeNumber(pipelineSourceRow?.[stage.key])),
  }));

  const getDropCount = (fromValue, toValue, explicitKey) => {
    const explicitCount = Math.round(
      safeNumber(pipelineSourceRow?.[explicitKey]),
    );

    if (explicitCount > 0) return explicitCount;

    return Math.max(0, Math.round(fromValue - toValue));
  };

  const getDropPercent = (dropCount, fromValue, explicitKey) => {
    const explicitPercent = safeNumber(pipelineSourceRow?.[explicitKey]);

    if (explicitPercent > 0) return explicitPercent;

    return fromValue > 0 ? (dropCount / fromValue) * 100 : 0;
  };

  const drops = [
    {
      from: stages[0].value,
      to: stages[1].value,
      countKey: "acceptedJoToNhoCount",
      percentKey: "acceptedJoToNhoPercent",
    },
    {
      from: stages[1].value,
      to: stages[2].value,
      countKey: "nhoToFstCount",
      percentKey: "nhoToFstPercent",
    },
    {
      from: stages[2].value,
      to: stages[3].value,
      countKey: "fstToPstCount",
      percentKey: "fstToPstPercent",
    },
    {
      from: stages[3].value,
      to: stages[4].value,
      countKey: "pstToGoLiveCount",
      percentKey: "pstToGoLivePercent",
    },
  ].map((drop) => {
    const count = getDropCount(drop.from, drop.to, drop.countKey);

    return {
      ...drop,
      count,
      percent: getDropPercent(count, drop.from, drop.percentKey),
    };
  });

  const maxValue = Math.max(...stages.map((stage) => stage.value), 1);

  /*
    Tight SVG layout:
    - Smaller viewBox height removes the large blank space below the graph.
    - Footer/legend is outside the SVG and pinned at the bottom of the card.
    - The graph area is compact but still keeps labels, arrows, and drop values.
  */
  const chartWidth = 440;
  const chartHeight = 205;
  const baseY = 200;
  const minHeight = 62;
  const maxHeight = 160;
  const barWidth = 48;
  const gap = 40;
  const startX = 20;
  const connectorTopOffset = 0;
  const connectorBottomOffset = 0;

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex min-h-0 flex-1 items-end justify-center pb-1">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-[215px] w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {stages.map((stage, index) => {
            const x = startX + index * (barWidth + gap);
            const height =
              minHeight + (stage.value / maxValue) * (maxHeight - minHeight);
            const y = baseY - height;

            const nextX = startX + (index + 1) * (barWidth + gap);
            const nextStage = stages[index + 1];
            const nextHeight = nextStage
              ? minHeight +
                (nextStage.value / maxValue) * (maxHeight - minHeight)
              : height;
            const nextY = baseY - nextHeight;

            const drop = drops[index];
            const dropX = (x + barWidth + nextX) / 2;
            const connectorFill = nextY < y ? "#DDF5EB" : "#FAEEDC";
            const connectorStroke = nextY < y ? "#8ED7B5" : "#E8C89C";

            return (
              <g key={stage.key}>
                <text
                  x={x + barWidth / 2}
                  y="15"
                  textAnchor="middle"
                  className="fill-sibs-primary-90 text-[8.5px] font-extrabold"
                >
                  {stage.label.split("\n").map((line, lineIndex) => (
                    <tspan
                      key={line}
                      x={x + barWidth / 2}
                      dy={lineIndex ? 9 : 0}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>

                {index < stages.length - 1 ? (
                  <polygon
                    points={`${x + barWidth},${y + connectorTopOffset} ${
                      nextX
                    },${nextY + connectorTopOffset} ${nextX},${
                      nextY + nextHeight - connectorBottomOffset
                    } ${x + barWidth},${y + height - connectorBottomOffset}`}
                    fill={connectorFill}
                    stroke={connectorStroke}
                    strokeWidth="0.7"
                    opacity="0.95"
                  />
                ) : null}

                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={height}
                  rx="2"
                  fill={stage.color}
                />

                <text
                  x={x + barWidth / 2}
                  y={y + height / 2 + 4}
                  textAnchor="middle"
                  className="fill-white text-[12px] font-extrabold"
                >
                  {formatOverviewNumber(stage.value)}
                </text>

                <line
                  x1={x + barWidth / 2}
                  x2={x + barWidth / 2}
                  y1={baseY + 8}
                  y2={baseY + 17}
                  stroke="#A9B8C8"
                  strokeWidth="1"
                />
                <path
                  d={`M ${x + barWidth / 2 - 3.5} ${baseY + 12} L ${
                    x + barWidth / 2
                  } ${baseY + 8} L ${x + barWidth / 2 + 3.5} ${baseY + 12}`}
                  fill="none"
                  stroke="#A9B8C8"
                  strokeWidth="1"
                />

                {drop ? (
                  <text
                    x={dropX}
                    y={baseY + 27}
                    textAnchor="middle"
                    className="fill-red-600 text-[7.8px] font-extrabold"
                  >
                    <tspan x={dropX}>-{formatOverviewNumber(drop.count)}</tspan>
                    <tspan x={dropX} dy="9">
                      ({formatOverviewPercent(drop.percent)})
                    </tspan>
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-auto flex h-5 shrink-0 items-center justify-center pt-1 text-[9.5px] font-extrabold text-red-600">
        Drop = Attrition Count (% Attrition)
      </div>
    </div>
  );
}

function MiniAttritionStageGraph({ rows = [] }) {
  const pipelineSourceRow = getPipelineSourceRow(rows);

  function getStage({ label, countKey, percentKey }) {
    return {
      label,
      count: Math.round(safeNumber(pipelineSourceRow?.[countKey])),
      percent: safeNumber(pipelineSourceRow?.[percentKey]),
    };
  }

  /*
    Use the same averaged pipeline source as the Pipeline Flow graph.
    This keeps Attrition by Stage matched with the graph bars and the
    forecast table TOTAL / AVG. values.
  */
  const stages = [
    getStage({
      label: "Accepted JO → NHO",
      countKey: "acceptedJoToNhoCount",
      percentKey: "acceptedJoToNhoPercent",
    }),
    getStage({
      label: "NHO → FST",
      countKey: "nhoToFstCount",
      percentKey: "nhoToFstPercent",
    }),
    getStage({
      label: "FST → PST",
      countKey: "fstToPstCount",
      percentKey: "fstToPstPercent",
    }),
    getStage({
      label: "NHO → PST",
      countKey: "nhoToPstCount",
      percentKey: "nhoToPstPercent",
    }),
    getStage({
      label: "PST → Go Live",
      countKey: "pstToGoLiveCount",
      percentKey: "pstToGoLivePercent",
    }),
  ];

  const maxCount = Math.max(...stages.map((stage) => stage.count), 1);

  return (
    <div className="flex h-[220px] w-full flex-col overflow-hidden rounded-lg border border-slate-100">
      <div className="grid grid-cols-[1.5fr_0.75fr_0.75fr_0.7fr] bg-slate-50 px-3 py-2 text-[10px] font-extrabold text-sibs-primary-90">
        <span>Stage</span>
        <span className="text-center">Attrition Count</span>
        <span className="text-center">Attrition %</span>
        <span />
      </div>

      {stages.map((stage) => (
        <div
          key={stage.label}
          className="grid flex-1 grid-cols-[1.5fr_0.75fr_0.75fr_0.7fr] items-center border-t border-slate-100 px-3 text-[11px] font-semibold text-sibs-primary-90"
        >
          <span>{stage.label}</span>
          <span className="text-center font-extrabold text-red-600">
            {formatOverviewNumber(stage.count)}
          </span>
          <span className="text-center">
            {formatOverviewPercent(stage.percent)}
          </span>
          <span className="h-2 rounded-full bg-red-50">
            <span
              className="block h-2 rounded-full bg-red-600"
              style={{
                width:
                  stage.count > 0
                    ? `${Math.max(4, (stage.count / maxCount) * 100)}%`
                    : "2px",
              }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

function MiniLineTrendGraph({
  rows = [],
  legendLabel,
  valueKey,
  color = "#6D28D9",
  valueSuffix = "",
  yMax,
}) {
  const width = 360;
  const height = 168;
  const padLeft = 44;
  const padRight = 18;
  const padTop = 20;
  const padBottom = 30;

  const points = rows.map((row, index) => ({
    label: getTrendPointLabel(row, index),
    value: safeNumber(row?.[valueKey]),
  }));

  const maxValue = yMax || Math.max(...points.map((point) => point.value), 1);
  const minValue = 0;

  function getX(index) {
    if (points.length <= 1) return padLeft;

    return (
      padLeft + (index / (points.length - 1)) * (width - padLeft - padRight)
    );
  }

  function getY(value) {
    const range = maxValue - minValue || 1;

    return (
      padTop + ((maxValue - value) / range) * (height - padTop - padBottom)
    );
  }

  const path = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${getX(index)} ${getY(point.value)}`,
    )
    .join(" ");

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col justify-between">
      <div className="flex h-[220px] min-h-0 items-center justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padTop + ratio * (height - padTop - padBottom);
            const value = maxValue - ratio * (maxValue - minValue);

            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  x2={width - padRight}
                  y1={y}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-sibs-primary-90 text-[9px] font-bold"
                >
                  {valueSuffix === "%"
                    ? `${Math.round(value)}%`
                    : formatOverviewNumber(value)}
                </text>
              </g>
            );
          })}

          <path d={path} fill="none" stroke={color} strokeWidth="3" />

          {points.map((point, index) => {
            const x = getX(index);
            const y = getY(point.value);

            return (
              <g key={`${point.label}-${index}`}>
                <circle cx={x} cy={y} r="4" fill={color} />
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  className="fill-sibs-primary-90 text-[9px] font-extrabold"
                >
                  {valueSuffix === "%"
                    ? `${point.value.toFixed(1)}%`
                    : formatOverviewNumber(point.value)}
                </text>
                <text
                  x={x}
                  y={height - 7}
                  textAnchor="middle"
                  className="fill-sibs-primary-80 text-[9px] font-bold"
                >
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-auto flex h-5 shrink-0 items-center justify-center gap-2 pt-1 text-[11px] font-bold text-sibs-primary-90">
        <span
          className="h-2 w-5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span>{legendLabel}</span>
      </div>
    </div>
  );
}

export default function ForecastBottomGraphs({ rows = [] }) {
  const graphRows = getNormalizedGraphRows(rows);

  if (!graphRows.length) return null;

  return (
    <div className="bg-slate-50/50">
      <div className="grid grid-cols-1 items-stretch gap-3 xl:grid-cols-4">
        <GraphCard title="Pipeline Flow – Total (6 Weeks)">
          <MiniPipelineFlowGraph rows={graphRows} />
        </GraphCard>

        <GraphCard title="Attrition by Stage – Total (6 Weeks)">
          <MiniAttritionStageGraph rows={graphRows} />
        </GraphCard>

        <GraphCard title="Leads to Interview Trend">
          <MiniLineTrendGraph
            rows={graphRows}
            legendLabel="Leads to Interview (To Generate)"
            valueKey="leadsToInterview"
            color="#6D28D9"
          />
        </GraphCard>

        <GraphCard title="Hiring Rate Trend">
          <MiniLineTrendGraph
            rows={graphRows}
            legendLabel="Hiring Rate (Leads to JO)"
            valueKey="hiringRate"
            color="#0F5CC0"
            valueSuffix="%"
            yMax={Math.max(
              30,
              ...graphRows.map((row) => safeNumber(row.hiringRate)),
            )}
          />
        </GraphCard>
      </div>
    </div>
  );
}
