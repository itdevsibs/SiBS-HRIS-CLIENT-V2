import { useMemo, useRef, useState } from "react";

function formatWeekAxisLabel(value) {
  const cleanValue = String(value || "").trim();
  const match = cleanValue.match(/(?:week|wk)\s*-?\s*(\d+)/i);

  if (match?.[1]) return `Week ${match[1]}`;

  return cleanValue || "Week";
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getLabelPosition({ x, y, index, total, labelOffset }) {
  if (index === 0) {
    return { x: x + 10, y: y + labelOffset, textAnchor: "start" };
  }

  if (index === total - 1) {
    return { x: x - 8, y: y + labelOffset, textAnchor: "end" };
  }

  return { x, y: y + labelOffset, textAnchor: "middle" };
}

function getNearestWeekIndex(pointerX, chartLeft, chartWidth, weekCount) {
  if (weekCount <= 1 || chartWidth <= 0) return 0;

  const normalizedPosition = clamp(
    (pointerX - chartLeft) / chartWidth,
    0,
    1,
  );

  return Math.round(normalizedPosition * (weekCount - 1));
}

function getCursorTooltipPosition({
  cursor,
  width,
  height,
  tooltipWidth,
  tooltipHeight,
}) {
  const safePadding = 8;
  const cursorGap = 14;

  let x = cursor.x + cursorGap;

  if (x + tooltipWidth > width - safePadding) {
    x = cursor.x - tooltipWidth - cursorGap;
  }

  let y = cursor.y - tooltipHeight / 2;

  return {
    x: clamp(x, safePadding, width - tooltipWidth - safePadding),
    y: clamp(y, safePadding, height - tooltipHeight - safePadding),
  };
}

function AnimatedPolyline({
  points,
  className,
  animationKey,
  duration = "0.9s",
  delay = "0s",
}) {
  if (!points) return null;

  return (
    <polyline
      key={animationKey}
      points={points}
      pathLength="1"
      strokeDasharray="1"
      strokeDashoffset="1"
      className={className}
    >
      <animate
        attributeName="stroke-dashoffset"
        from="1"
        to="0"
        dur={duration}
        begin={delay}
        calcMode="spline"
        keySplines="0.22 1 0.36 1"
        fill="freeze"
      />
    </polyline>
  );
}

function getStableLabelOffsets({ safeTrends, yScale }) {
  const offsets = { absenteeism: [], attrition: [], buffer: [] };
  const maxLength = Math.max(
    safeTrends.absenteeism.length,
    safeTrends.attrition.length,
    safeTrends.buffer.length,
  );

  for (let index = 0; index < maxLength; index += 1) {
    const blueValue = safeTrends.absenteeism[index];
    const orangeValue = safeTrends.attrition[index];
    const greenValue = safeTrends.buffer[index];

    const blueY = Number.isFinite(blueValue) ? yScale(blueValue) : null;
    const orangeY = Number.isFinite(orangeValue) ? yScale(orangeValue) : null;
    const greenY = Number.isFinite(greenValue) ? yScale(greenValue) : null;

    let blueOffset = -13;
    let orangeOffset = 19;
    let greenOffset = 19;

    if (
      blueY !== null &&
      orangeY !== null &&
      Math.abs(blueY - orangeY) < 28
    ) {
      blueOffset = -16;
      orangeOffset = 24;
    }

    if (
      greenY !== null &&
      ((blueY !== null && Math.abs(blueY - greenY) < 26) ||
        (orangeY !== null && Math.abs(orangeY - greenY) < 26))
    ) {
      greenOffset = greenValue >= Math.max(blueValue, orangeValue) ? -20 : 25;
    }

    offsets.absenteeism[index] = blueOffset;
    offsets.attrition[index] = orangeOffset;
    offsets.buffer[index] = greenOffset;
  }

  return offsets;
}

function TrendPoint({
  x,
  y,
  value,
  fill,
  textFill,
  labelOffset,
  index,
  total,
  active,
  showLabel = true,
}) {
  const labelPosition = getLabelPosition({
    x,
    y,
    index,
    total,
    labelOffset,
  });

  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={active ? 6.5 : 4.75}
        fill={fill}
        stroke="#ffffff"
        strokeWidth="2"
      />
      {showLabel ? (
        <text
          x={labelPosition.x}
          y={labelPosition.y}
          textAnchor={labelPosition.textAnchor}
          fill={textFill}
          className="text-[11px] font-extrabold"
          style={{
            paintOrder: "stroke",
            stroke: "white",
            strokeWidth: 4,
            strokeLinejoin: "round",
          }}
        >
          {value}
        </text>
      ) : null}
    </g>
  );
}

export default function TrendSvg({
  weeks = [],
  trends = {},
  variant = "dashboard",
  className = "block h-auto w-full",
}) {
  const isModal = variant === "modal";
  const graphSize = isModal
    ? {
        width: 760,
        height: 400,
        left: 64,
        right: 26,
        top: 42,
        bottom: 56,
      }
    : {
        width: 760,
        height: 440,
        left: 62,
        right: 26,
        top: 28,
        bottom: 36,
      };

  const { width, height, left, right, top, bottom } = graphSize;
  const chartW = width - left - right;
  const chartH = height - top - bottom;
  const svgRef = useRef(null);

  const safeWeeks = Array.isArray(weeks) ? weeks : [];
  const safeTrends = {
    absenteeism: Array.isArray(trends?.absenteeism)
      ? trends.absenteeism.map(Number).filter(Number.isFinite)
      : [],
    attrition: Array.isArray(trends?.attrition)
      ? trends.attrition.map(Number).filter(Number.isFinite)
      : [],
    buffer: Array.isArray(trends?.buffer)
      ? trends.buffer.map(Number).filter(Number.isFinite)
      : [],
  };

  const weekCount = Math.max(
    safeWeeks.length,
    safeTrends.absenteeism.length,
    safeTrends.attrition.length,
    safeTrends.buffer.length,
    1,
  );

  const denseLabelStride = weekCount <= 12 ? 1 : Math.ceil(weekCount / 8);

  const allValues = [
    ...safeTrends.absenteeism,
    ...safeTrends.attrition,
    ...safeTrends.buffer,
  ].filter(Number.isFinite);

  const rawMin = allValues.length ? Math.min(...allValues) : -8;
  const rawMax = allValues.length ? Math.max(...allValues) : 12;
  const chartMin = Math.min(-8, Math.floor((rawMin - 1) / 4) * 4);
  const chartMax = Math.max(12, Math.ceil((rawMax + 1) / 4) * 4);
  const range = chartMax - chartMin || 1;

  const yScale = (value) =>
    top + ((chartMax - Number(value || 0)) / range) * chartH;
  const xScale = (index) =>
    weekCount <= 1 ? left : left + (chartW / (weekCount - 1)) * index;

  const makePoints = (values) =>
    values.map((value, index) => `${xScale(index)},${yScale(value)}`).join(" ");

  const yTicks = [];
  for (let tick = chartMax; tick >= chartMin; tick -= 4) yTicks.push(tick);

  const labels = getStableLabelOffsets({ safeTrends, yScale });
  const animationKey = JSON.stringify({
    weeks: safeWeeks,
    absenteeism: safeTrends.absenteeism,
    attrition: safeTrends.attrition,
    buffer: safeTrends.buffer,
  });

  const [activeIndex, setActiveIndex] = useState(null);
  const [pointerPosition, setPointerPosition] = useState(null);

  const hasActivePoint = Number.isInteger(activeIndex);
  const safeActiveIndex = hasActivePoint
    ? Math.min(Math.max(activeIndex, 0), Math.max(weekCount - 1, 0))
    : null;

  const shouldShowDenseLabel = (index) =>
    index === 0 ||
    index === weekCount - 1 ||
    index % denseLabelStride === 0 ||
    (hasActivePoint && safeActiveIndex === index);

  const activePoint = useMemo(
    () =>
      safeActiveIndex === null
        ? null
        : {
            week: formatWeekAxisLabel(safeWeeks[safeActiveIndex]),
            absenteeism: safeTrends.absenteeism[safeActiveIndex],
            attrition: safeTrends.attrition[safeActiveIndex],
            buffer: safeTrends.buffer[safeActiveIndex],
            x: xScale(safeActiveIndex),
          },
    [
      safeActiveIndex,
      safeTrends.absenteeism,
      safeTrends.attrition,
      safeTrends.buffer,
      safeWeeks,
    ],
  );

  const zeroY = yScale(0);
  const tooltipWidth = 240;
  const tooltipHeight = 124;

  const tooltipAnchor = useMemo(() => {
    if (pointerPosition) return pointerPosition;
    if (!activePoint) return null;

    const activeValues = [
      activePoint.absenteeism,
      activePoint.attrition,
      activePoint.buffer,
    ].filter(Number.isFinite);

    const averageValue = activeValues.length
      ? activeValues.reduce((total, value) => total + value, 0) /
        activeValues.length
      : 0;

    return {
      x: activePoint.x,
      y: yScale(averageValue),
    };
  }, [activePoint, pointerPosition]);

  const tooltipPosition = useMemo(
    () =>
      tooltipAnchor
        ? getCursorTooltipPosition({
            cursor: tooltipAnchor,
            width,
            height,
            tooltipWidth,
            tooltipHeight,
          })
        : null,
    [tooltipAnchor],
  );

  function handlePointerMove(event) {
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = ((event.clientX - rect.left) / rect.width) * width;
    const y = ((event.clientY - rect.top) / rect.height) * height;

    setPointerPosition({
      x: clamp(x, 0, width),
      y: clamp(y, 0, height),
    });
    setActiveIndex(getNearestWeekIndex(x, left, chartW, weekCount));
  }

  function handlePointerLeave() {
    setActiveIndex(null);
    setPointerPosition(null);
  }

  function handleWeekFocus(index) {
    setActiveIndex(index);
    setPointerPosition(null);
  }

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      overflow="visible"
      role="img"
      aria-label={`Six-week workforce trend chart (${variant})`}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
    >
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={left}
            x2={width - right}
            y1={yScale(tick)}
            y2={yScale(tick)}
            stroke={tick === 0 ? "#EF4444" : "#D7E0EA"}
            strokeWidth={tick === 0 ? 1.5 : 1}
            strokeDasharray={tick === 0 ? "0" : "4 4"}
          />
          <text
            x={left - 12}
            y={yScale(tick) + 4}
            textAnchor="end"
            fill={tick === 0 ? "#EF4444" : "#52637A"}
            className="text-[10px] font-semibold"
          >
            {tick}%
          </text>
        </g>
      ))}

      {Array.from({ length: weekCount }, (_, index) =>
        shouldShowDenseLabel(index) ? (
          <line
            key={`vertical-${index}`}
            x1={xScale(index)}
            x2={xScale(index)}
            y1={top}
            y2={height - bottom}
            stroke="#D7E0EA"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ) : null,
      )}

      <line
        x1={left}
        x2={left}
        y1={top}
        y2={height - bottom}
        stroke="#042C51"
        strokeWidth="1.5"
      />
      <line
        x1={left}
        x2={width - right}
        y1={height - bottom}
        y2={height - bottom}
        stroke="#042C51"
        strokeWidth="1.5"
      />

      <text
        x={width - right - 8}
        y={zeroY - 7}
        textAnchor="end"
        fill="#EF4444"
        className="text-[9px] font-bold"
      >
        TARGET BUFFER FLOOR (0%)
      </text>

      <AnimatedPolyline
        animationKey={`abs-${animationKey}`}
        points={makePoints(safeTrends.absenteeism)}
        className="fill-none stroke-blue-600 stroke-[3.2] [stroke-linecap:round] [stroke-linejoin:round]"
      />
      <AnimatedPolyline
        animationKey={`att-${animationKey}`}
        points={makePoints(safeTrends.attrition)}
        className="fill-none stroke-orange-600 stroke-[3.2] [stroke-linecap:round] [stroke-linejoin:round]"
        delay="0.08s"
      />
      <AnimatedPolyline
        animationKey={`buf-${animationKey}`}
        points={makePoints(safeTrends.buffer)}
        className="fill-none stroke-green-600 stroke-[3.2] [stroke-linecap:round] [stroke-linejoin:round]"
        delay="0.16s"
      />

      {safeTrends.absenteeism.map((value, index) => (
        <TrendPoint
          key={`abs-${index}`}
          x={xScale(index)}
          y={yScale(value)}
          value={`${value.toFixed(1)}%`}
          fill="#2563EB"
          textFill="#1D4ED8"
          labelOffset={labels.absenteeism[index] ?? -13}
          index={index}
          total={weekCount}
          active={hasActivePoint && safeActiveIndex === index}
          showLabel={shouldShowDenseLabel(index)}
        />
      ))}

      {safeTrends.attrition.map((value, index) => (
        <TrendPoint
          key={`att-${index}`}
          x={xScale(index)}
          y={yScale(value)}
          value={`${value.toFixed(1)}%`}
          fill="#EA580C"
          textFill="#C2410C"
          labelOffset={labels.attrition[index] ?? 19}
          index={index}
          total={weekCount}
          active={hasActivePoint && safeActiveIndex === index}
          showLabel={shouldShowDenseLabel(index)}
        />
      ))}

      {safeTrends.buffer.map((value, index) => (
        <TrendPoint
          key={`buf-${index}`}
          x={xScale(index)}
          y={yScale(value)}
          value={`${value.toFixed(1)}%`}
          fill="#16A34A"
          textFill={value < 0 ? "#DC2626" : "#15803D"}
          labelOffset={labels.buffer[index] ?? 19}
          index={index}
          total={weekCount}
          active={hasActivePoint && safeActiveIndex === index}
          showLabel={shouldShowDenseLabel(index)}
        />
      ))}

      {Array.from({ length: weekCount }, (_, index) => {
        const detectorWidth = chartW / Math.max(weekCount - 1, 1);
        const detectorX = clamp(
          xScale(index) - detectorWidth / 2,
          left,
          width - right - detectorWidth,
        );

        return (
          <g key={`detector-${index}`}>
            <rect
              x={detectorX}
              y={top}
              width={detectorWidth}
              height={chartH}
              fill="transparent"
              className="cursor-crosshair"
              onFocus={() => handleWeekFocus(index)}
              onBlur={handlePointerLeave}
              tabIndex="0"
              style={{ outline: "none" }}
              aria-label={`Show ${formatWeekAxisLabel(
                safeWeeks[index],
              )} breakdown`}
            />
            {shouldShowDenseLabel(index) ? (
              <text
                x={xScale(index)}
                y={height - 20}
                textAnchor="middle"
                fill="#344054"
                className="text-[10px] font-bold"
              >
                {formatWeekAxisLabel(safeWeeks[index])}
              </text>
            ) : null}
          </g>
        );
      })}

      {activePoint && Number.isFinite(activePoint.x) ? (
        <line
          x1={activePoint.x}
          x2={activePoint.x}
          y1={top}
          y2={height - bottom}
          stroke="#042C51"
          strokeWidth="1.3"
          strokeDasharray="4 4"
          pointerEvents="none"
        />
      ) : null}

      {activePoint && tooltipPosition ? (
        <g pointerEvents="none">
          <rect
            x={tooltipPosition.x}
            y={tooltipPosition.y}
            width={tooltipWidth}
            height={tooltipHeight}
            rx="14"
            fill="#042C51"
            opacity="0.98"
          />
          <text
            x={tooltipPosition.x + 18}
            y={tooltipPosition.y + 26}
            fill="#D7E0EA"
            className="text-[12px] font-extrabold uppercase tracking-wide"
          >
            {activePoint.week || "Week Breakdown"} Breakdown
          </text>
          <line
            x1={tooltipPosition.x + 16}
            x2={tooltipPosition.x + tooltipWidth - 16}
            y1={tooltipPosition.y + 36}
            y2={tooltipPosition.y + 36}
            stroke="#315779"
            strokeWidth="1.2"
          />
          <text
            x={tooltipPosition.x + 18}
            y={tooltipPosition.y + 61}
            fill="#D7E0EA"
            className="text-[12px] font-bold"
          >
            Absenteeism (ABS):
          </text>
          <text
            x={tooltipPosition.x + tooltipWidth - 18}
            y={tooltipPosition.y + 61}
            textAnchor="end"
            fill="#60A5FA"
            className="text-[13px] font-black"
          >
            {Number(activePoint.absenteeism || 0).toFixed(1)}%
          </text>
          <text
            x={tooltipPosition.x + 18}
            y={tooltipPosition.y + 84}
            fill="#D7E0EA"
            className="text-[12px] font-bold"
          >
            Attrition (ATT):
          </text>
          <text
            x={tooltipPosition.x + tooltipWidth - 18}
            y={tooltipPosition.y + 84}
            textAnchor="end"
            fill="#FB923C"
            className="text-[13px] font-black"
          >
            {Number(activePoint.attrition || 0).toFixed(1)}%
          </text>
          <text
            x={tooltipPosition.x + 18}
            y={tooltipPosition.y + 107}
            fill="#D7E0EA"
            className="text-[12px] font-bold"
          >
            Buffer Cushion (BUF):
          </text>
          <text
            x={tooltipPosition.x + tooltipWidth - 18}
            y={tooltipPosition.y + 107}
            textAnchor="end"
            fill={
              Number(activePoint.buffer || 0) < 0 ? "#F87171" : "#4ADE80"
            }
            className="text-[13px] font-black"
          >
            {Number(activePoint.buffer || 0).toFixed(1)}%
          </text>
        </g>
      ) : null}
    </svg>
  );
}