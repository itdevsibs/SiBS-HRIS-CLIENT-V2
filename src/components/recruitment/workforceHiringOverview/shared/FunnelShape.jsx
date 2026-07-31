const FALLBACK_COLORS = [
  "#042C51",
  "#2563EB",
  "#0D9488",
  "#EA580C",
  "#15803D",
];

function getStageLabel(stage = {}, index = 0) {
  const label = String(stage.short || stage.stage || `Stage ${index + 1}`).trim();

  if (/accepted/i.test(label)) return "Accepted JO";
  if (/go live|live/i.test(label)) return "Live";

  return label;
}

export default function FunnelShape({ pipeline = [] }) {
  const safePipeline = Array.isArray(pipeline) ? pipeline.slice(0, 5) : [];
  const width = 340;
  const height = 235;
  const centerX = width / 2;
  const segmentHeight = 40;
  const gap = 4;
  const topWidths = [320, 264, 208, 152, 96];
  const bottomWidths = [270, 214, 158, 102, 70];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full max-w-[260px]"
      role="img"
      aria-label="Hiring funnel"
    >
      {safePipeline.map((stage, index) => {
        const y = index * (segmentHeight + gap) + 8;
        const topWidth = topWidths[index] || 96;
        const bottomWidth = bottomWidths[index] || 70;
        const x1 = centerX - topWidth / 2;
        const x2 = centerX + topWidth / 2;
        const x3 = centerX + bottomWidth / 2;
        const x4 = centerX - bottomWidth / 2;
        const label = getStageLabel(stage, index);
        const count = Number(stage.count || 0).toLocaleString("en-US");

        return (
          <g key={stage.stage || `${label}-${index}`}>
            <polygon
              points={`${x1},${y} ${x2},${y} ${x3},${
                y + segmentHeight
              } ${x4},${y + segmentHeight}`}
              fill={stage.color || FALLBACK_COLORS[index]}
            />

            <text
              x={centerX}
              y={y + segmentHeight / 2 + 4}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              className="text-[13px] font-extrabold"
            >
              {label}: {count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
