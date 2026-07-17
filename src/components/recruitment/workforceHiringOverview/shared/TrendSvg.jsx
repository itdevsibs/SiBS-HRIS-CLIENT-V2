function formatWeekAxisLabel(value) {
  const cleanValue = String(value || "").trim();

  const match = cleanValue.match(/(?:week|wk)\s*-?\s*(\d+)/i);

  if (match?.[1]) return match[1];

  return cleanValue
    .replace(/^wk\s*/i, "")
    .replace(/^week\s*/i, "")
    .trim();
}

function getLabelPosition({ x, y, index, total, labelOffset }) {
  if (index === 0) {
    return {
      x: x + 14,
      y: y + labelOffset,
      textAnchor: "start",
    };
  }

  if (index === total - 1) {
    return {
      x: x - 10,
      y: y + labelOffset,
      textAnchor: "end",
    };
  }

  return {
    x,
    y: y + labelOffset,
    textAnchor: "middle",
  };
}

function TrendPoint({
  x,
  y,
  value,
  colorClass,
  labelClass,
  labelOffset,
  animationKey,
  index,
  total,
  delay = "0.55s",
}) {
  const labelPosition = getLabelPosition({
    x,
    y,
    index,
    total,
    labelOffset,
  });

  return (
    <g key={`${animationKey}-${x}-${y}-${value}`} opacity="0">
      <animate
        attributeName="opacity"
        from="0"
        to="1"
        dur="0.35s"
        begin={delay}
        fill="freeze"
      />

      <circle
        cx={x}
        cy={y}
        r="4.5"
        className={`${colorClass} stroke-white stroke-[2]`}
      />

      <text
        x={labelPosition.x}
        y={labelPosition.y}
        textAnchor={labelPosition.textAnchor}
        className={`${labelClass} text-[11px] font-bold`}
        style={{
          paintOrder: "stroke",
          stroke: "white",
          strokeWidth: 5,
          strokeLinejoin: "round",
        }}
      >
        {value}
      </text>
    </g>
  );
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
  const offsets = {
    absenteeism: [],
    attrition: [],
    buffer: [],
  };

  const maxLength = Math.max(
    safeTrends.absenteeism.length,
    safeTrends.attrition.length,
    safeTrends.buffer.length,
  );

  for (let index = 0; index < maxLength; index += 1) {
    const blueValue = safeTrends.absenteeism[index];
    const redValue = safeTrends.attrition[index];
    const greenValue = safeTrends.buffer[index];

    const blueY = Number.isFinite(blueValue) ? yScale(blueValue) : null;
    const redY = Number.isFinite(redValue) ? yScale(redValue) : null;
    const greenY = Number.isFinite(greenValue) ? yScale(greenValue) : null;

    let blueOffset = -14;
    let redOffset = 22;
    let greenOffset = 24;

    const blueAndRedAreClose =
      blueY !== null && redY !== null && Math.abs(blueY - redY) < 34;

    if (blueAndRedAreClose) {
      if (blueValue >= redValue) {
        blueOffset = -18;
        redOffset = 28;
      } else {
        redOffset = -18;
        blueOffset = 28;
      }
    }

    const blueAndGreenAreClose =
      blueY !== null && greenY !== null && Math.abs(blueY - greenY) < 30;

    const redAndGreenAreClose =
      redY !== null && greenY !== null && Math.abs(redY - greenY) < 30;

    if (blueAndGreenAreClose || redAndGreenAreClose) {
      if (
        Number.isFinite(greenValue) &&
        ((Number.isFinite(blueValue) && greenValue >= blueValue) ||
          (Number.isFinite(redValue) && greenValue >= redValue))
      ) {
        greenOffset = -22;
      } else {
        greenOffset = 34;
      }
    }

    offsets.absenteeism[index] = blueOffset;
    offsets.attrition[index] = redOffset;
    offsets.buffer[index] = greenOffset;
  }

  return offsets;
}

export default function TrendSvg({ weeks = [], trends = {} }) {
  const width = 760;
  const height = 305;

  const left = 70;
  const right = 44;
  const top = 25;
  const bottom = 68;

  const chartW = width - left - right;
  const chartH = height - top - bottom;

  const safeWeeks = Array.isArray(weeks) && weeks.length ? weeks : [];

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
  );

  const allValues = [
    ...safeTrends.absenteeism,
    ...safeTrends.attrition,
    ...safeTrends.buffer,
  ].filter(Number.isFinite);

  const minValue = Math.min(-16, ...allValues);
  const maxValue = Math.max(16, ...allValues);

  const yPadding = 4;

  const chartMin = Math.floor((minValue - yPadding) / 4) * 4;
  const chartMax = Math.ceil((maxValue + yPadding) / 4) * 4;

  const range = chartMax - chartMin || 1;

  const yScale = (value) => {
    const cleanValue = Number(value || 0);
    return top + ((chartMax - cleanValue) / range) * chartH;
  };

  const xScale = (index) => {
    if (weekCount <= 1) return left;
    return left + (chartW / (weekCount - 1)) * index;
  };

  const makePoints = (values) => {
    if (!Array.isArray(values) || values.length === 0) return "";

    return values
      .map((value, index) => `${xScale(index)},${yScale(value)}`)
      .join(" ");
  };

  const yTicks = [];

  for (let tick = chartMax; tick >= chartMin; tick -= 4) {
    yTicks.push(tick);
  }

  const labelOffsets = getStableLabelOffsets({
    safeTrends,
    yScale,
  });

  const animationKey = JSON.stringify({
    weeks: safeWeeks,
    absenteeism: safeTrends.absenteeism,
    attrition: safeTrends.attrition,
    buffer: safeTrends.buffer,
  });

  const weekAxisY = height - 34;
  const weekTickBottomY = weekAxisY + 6;
  const weekLabelY = height - 10;

  return (
    <svg
      className="block h-auto w-full"
      viewBox={`0 0 ${width} ${height}`}
      overflow="visible"
    >
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={left}
            x2={width - right}
            y1={yScale(tick)}
            y2={yScale(tick)}
            className="stroke-slate-200 stroke-[1]"
          />

          <text
            x="20"
            y={yScale(tick) + 4}
            className="fill-slate-700 text-[11px] font-semibold"
          >
            {tick}%
          </text>
        </g>
      ))}

      <AnimatedPolyline
        animationKey={`abs-line-${animationKey}`}
        points={makePoints(safeTrends.absenteeism)}
        className="fill-none stroke-blue-600 stroke-[3.2] [stroke-linecap:round] [stroke-linejoin:round]"
        duration="0.95s"
      />

      <AnimatedPolyline
        animationKey={`att-line-${animationKey}`}
        points={makePoints(safeTrends.attrition)}
        className="fill-none stroke-red-600 stroke-[3.2] [stroke-linecap:round] [stroke-linejoin:round]"
        duration="0.95s"
        delay="0.08s"
      />

      <AnimatedPolyline
        animationKey={`buf-line-${animationKey}`}
        points={makePoints(safeTrends.buffer)}
        className="fill-none stroke-green-600 stroke-[3.2] [stroke-linecap:round] [stroke-linejoin:round]"
        duration="0.95s"
        delay="0.16s"
      />

      {safeTrends.absenteeism.map((value, index) => (
        <TrendPoint
          key={`abs-${safeWeeks[index] || "week"}-${index}`}
          animationKey={`abs-point-${animationKey}`}
          x={xScale(index)}
          y={yScale(value)}
          value={`${value.toFixed(1)}%`}
          colorClass="fill-blue-600"
          labelClass="fill-blue-600"
          labelOffset={labelOffsets.absenteeism[index] ?? -14}
          index={index}
          total={weekCount}
          delay="0.65s"
        />
      ))}

      {safeTrends.attrition.map((value, index) => (
        <TrendPoint
          key={`att-${safeWeeks[index] || "week"}-${index}`}
          animationKey={`att-point-${animationKey}`}
          x={xScale(index)}
          y={yScale(value)}
          value={`${value.toFixed(1)}%`}
          colorClass="fill-red-600"
          labelClass="fill-red-600"
          labelOffset={labelOffsets.attrition[index] ?? 22}
          index={index}
          total={weekCount}
          delay="0.75s"
        />
      ))}

      {safeTrends.buffer.map((value, index) => (
        <TrendPoint
          key={`buf-${safeWeeks[index] || "week"}-${index}`}
          animationKey={`buf-point-${animationKey}`}
          x={xScale(index)}
          y={yScale(value)}
          value={`${value.toFixed(1)}%`}
          colorClass="fill-green-600"
          labelClass="fill-green-600"
          labelOffset={labelOffsets.buffer[index] ?? 24}
          index={index}
          total={weekCount}
          delay="0.85s"
        />
      ))}

      <g>
        <line
          x1={left}
          x2={width - right}
          y1={weekAxisY}
          y2={weekAxisY}
          className="stroke-slate-200 stroke-[1.2]"
        />

        <text
          x={10}
          y={weekLabelY}
          textAnchor="start"
          className="fill-slate-500 text-[11px] font-semibold"
        >
          Week No.
        </text>

        {safeWeeks.map((item, index) => {
          const x = xScale(index);

          return (
            <g key={`${item}-${index}`}>
              <line
                x1={x}
                x2={x}
                y1={weekAxisY}
                y2={weekTickBottomY}
                className="stroke-slate-300 stroke-[1]"
              />

              <text
                x={x}
                y={weekLabelY}
                textAnchor="middle"
                className="fill-slate-700 text-[10px] font-bold"
              >
                {formatWeekAxisLabel(item)}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
