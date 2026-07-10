export default function FunnelShape({ pipeline }) {
  const width = 170;
  const height = 230;
  const centerX = width / 2;

  const topWidths = [138, 122, 106, 90, 74];
  const bottomWidths = [122, 106, 90, 74, 62];
  const segmentHeight = 42;
  const gap = 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[230px] w-[170px]"
      aria-label="Hiring funnel"
    >
      {pipeline.map((stage, index) => {
        const y = index * (segmentHeight + gap);
        const topW = topWidths[index];
        const bottomW = bottomWidths[index];

        const x1 = centerX - topW / 2;
        const x2 = centerX + topW / 2;
        const x3 = centerX + bottomW / 2;
        const x4 = centerX - bottomW / 2;

        const cy = y + segmentHeight / 2 + 2;

        return (
          <g key={stage.stage}>
            <polygon
              points={`${x1},${y} ${x2},${y} ${x3},${y + segmentHeight} ${x4},${y + segmentHeight}`}
              fill={stage.color}
            />
            <text
              x={centerX}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              className="text-[14px] font-bold"
            >
              {stage.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
