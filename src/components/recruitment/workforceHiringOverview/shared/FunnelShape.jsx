import React from "react";

const FALLBACK_FILL_CLASSES = [
  "fill-sibs-navy",
  "fill-blue-600",
  "fill-teal-600",
  "fill-sibs-orange",
  "fill-emerald-600",
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
              className={stage.fillClass || FALLBACK_FILL_CLASSES[index] || "fill-sibs-navy"}
              style={stage.color ? { fill: stage.color } : undefined}
            />

            <text
              x={centerX}
              y={y + segmentHeight / 2 + 4}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="currentColor"
              className="text-[11px] font-extrabold text-white"
            >
              {label}: {count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
