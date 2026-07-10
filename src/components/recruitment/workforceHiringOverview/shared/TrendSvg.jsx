function TrendPoint({ x, y, value, colorClass, labelClass, labelOffset }) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r="4"
        className={`${colorClass} stroke-white stroke-[2]`}
      />
      <text
        x={x}
        y={y + labelOffset}
        textAnchor="middle"
        className={`${labelClass} text-[11px] font-semibold`}
      >
        {value}
      </text>
    </g>
  );
}

export default function TrendSvg({ weeks, trends }) {
  const width = 560;
  const height = 230;
  const left = 54;
  const right = 22;
  const top = 30;
  const bottom = 42;
  const chartW = width - left - right;
  const chartH = height - top - bottom;
  const minY = -12;
  const maxY = 12;

  const yScale = (value) => top + ((maxY - value) / (maxY - minY)) * chartH;
  const xScale = (index) => left + (chartW / (weeks.length - 1)) * index;

  const makePoints = (values) =>
    values.map((value, index) => `${xScale(index)},${yScale(value)}`).join(" ");

  const yTicks = [12, 8, 4, 0, -4, -8, -12];

  return (
    <svg className="block h-auto w-full" viewBox={`0 0 ${width} ${height}`}>
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
            x="18"
            y={yScale(tick) + 4}
            className="fill-slate-700 text-[11px] font-semibold"
          >
            {tick}%
          </text>
        </g>
      ))}

      <polyline
        points={makePoints(trends.absenteeism)}
        className="fill-none stroke-blue-600 stroke-[3] [stroke-linecap:round] [stroke-linejoin:round]"
      />
      <polyline
        points={makePoints(trends.attrition)}
        className="fill-none stroke-red-600 stroke-[3] [stroke-linecap:round] [stroke-linejoin:round]"
      />
      <polyline
        points={makePoints(trends.buffer)}
        className="fill-none stroke-green-600 stroke-[3] [stroke-linecap:round] [stroke-linejoin:round]"
      />

      {trends.absenteeism.map((value, index) => (
        <TrendPoint
          key={`abs-${weeks[index]}`}
          x={xScale(index)}
          y={yScale(value)}
          value={`${value.toFixed(1)}%`}
          colorClass="fill-blue-600"
          labelClass="fill-blue-600"
          labelOffset={20}
        />
      ))}

      {trends.attrition.map((value, index) => (
        <TrendPoint
          key={`att-${weeks[index]}`}
          x={xScale(index)}
          y={yScale(value)}
          value={`${value.toFixed(1)}%`}
          colorClass="fill-red-600"
          labelClass="fill-red-600"
          labelOffset={-10}
        />
      ))}

      {trends.buffer.map((value, index) => (
        <TrendPoint
          key={`buf-${weeks[index]}`}
          x={xScale(index)}
          y={yScale(value)}
          value={`${value.toFixed(1)}%`}
          colorClass="fill-green-600"
          labelClass="fill-green-600"
          labelOffset={18}
        />
      ))}

      {weeks.map((item, index) => (
        <text
          key={item}
          x={xScale(index)}
          y={height - 10}
          textAnchor="middle"
          className="fill-slate-700 text-[11px] font-semibold"
        >
          {item}
        </text>
      ))}
    </svg>
  );
}
