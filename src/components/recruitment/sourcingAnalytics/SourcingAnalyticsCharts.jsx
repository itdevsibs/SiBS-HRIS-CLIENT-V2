import React, { useMemo, useState } from "react";
import { Activity, ReceiptText, UsersRound } from "lucide-react";

function formatCurrency(value) {
  const amount = Number(value || 0);

  return amount.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildCompactLabel(value, index) {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const initials = words
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return initials || `S${index + 1}`;
}

function normalizeChartData(data = []) {
  return (Array.isArray(data) ? data : [])
    .map((source, index) => ({
      id: source?.id || `${source?.source || "source"}-${index}`,
      source: source?.source || "Unnamed Source",
      label: buildCompactLabel(source?.source, index),
      volume: Number(source?.volume || 0),
      conversionRate: Number(source?.conversionRate || 0),
      sourceCost: Number(source?.sourceCost || 0),
    }))
    .sort((left, right) => right.volume - left.volume);
}

function EmptyChart({ message }) {
  return (
    <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-[#D7DEE8] bg-[#F8FAFC] px-5 text-center">
      <p className="text-xs font-bold text-[#98A2B3]">{message}</p>
    </div>
  );
}

function NativeSvgBarChart({ items = [], getValue, formatValue, activeColor = "#FF5C28", defaultColor = "#042C51" }) {
  const [hoveredItem, setHoveredItem] = useState(null);

  const maxValue = Math.max(1, ...items.map(getValue));
  const svgWidth = 380;
  const svgHeight = 180;
  const paddingBottom = 28;
  const paddingTop = 20;
  const chartHeight = svgHeight - paddingBottom - paddingTop;
  const count = items.length || 1;
  const barWidth = Math.min(32, Math.max(12, (svgWidth - count * 8) / count));

  return (
    <div className="relative h-[200px] w-full font-jakarta">
      {hoveredItem ? (
        <div className="pointer-events-none absolute right-2 top-0 z-10 max-w-[200px] rounded-lg border border-[#042C51]/20 bg-[#042C51] px-2.5 py-1.5 text-white shadow-lg">
          <p className="truncate text-[10px] font-extrabold">{hoveredItem.source}</p>
          <p className="text-xs font-extrabold text-[#FFB49B]">{formatValue(getValue(hoveredItem))}</p>
        </div>
      ) : null}

      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="h-full w-full overflow-visible">
        {/* Horizontal grid lines */}
        {[0, 0.33, 0.66, 1].map((ratio) => {
          const y = paddingTop + chartHeight * (1 - ratio);
          return (
            <line
              key={ratio}
              x1="0"
              y1={y}
              x2={svgWidth}
              y2={y}
              stroke="#E6ECF2"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          );
        })}

        {/* Bars */}
        {items.map((item, index) => {
          const val = getValue(item);
          const barHeight = Math.max(4, (val / maxValue) * chartHeight);
          const x = (index + 0.5) * (svgWidth / count) - barWidth / 2;
          const y = paddingTop + (chartHeight - barHeight);
          const isHighest = val === maxValue && val > 0;
          const fillColor = isHighest ? activeColor : defaultColor;

          return (
            <g
              key={item.id}
              className="cursor-pointer transition-opacity hover:opacity-80"
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={fillColor}
                className="transition-all duration-300"
              />
              <text
                x={x + barWidth / 2}
                y={svgHeight - 8}
                textAnchor="middle"
                fill="#667085"
                fontSize="9"
                fontWeight="700"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ChartCard({ title, description, icon: Icon, children, delay = 0 }) {
  return (
    <section
      className="sibs-page-card-in sibs-card rounded-2xl border border-[#E6ECF2] bg-white p-4 font-jakarta shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
            {title}
          </h2>
          <p className="mt-1 text-xs font-semibold leading-4 text-[#667085]">
            {description}
          </p>
        </div>

        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#EAF2FB] text-[#042C51]">
          <Icon size={15} />
        </span>
      </div>

      {children}
    </section>
  );
}

export default function SourcingAnalyticsCharts({ data = [] }) {
  const chartData = useMemo(() => normalizeChartData(data), [data]);
  const hasData = chartData.length > 0;

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ChartCard
        title="Applicant Volume"
        description="Current public submissions by sourcing channel"
        icon={UsersRound}
        delay={60}
      >
        {hasData ? (
          <NativeSvgBarChart
            items={chartData}
            getValue={(item) => item.volume}
            formatValue={(val) => `${val.toLocaleString("en-PH")} applicants`}
            activeColor="#FF5C28"
            defaultColor="#042C51"
          />
        ) : (
          <EmptyChart message="No applicant-volume data found." />
        )}
      </ChartCard>

      <ChartCard
        title="Conversion to Hire"
        description="Hired candidates divided by applicant volume"
        icon={Activity}
        delay={120}
      >
        {hasData ? (
          <NativeSvgBarChart
            items={chartData}
            getValue={(item) => item.conversionRate}
            formatValue={(val) => `${val.toFixed(1)}% conversion`}
            activeColor="#10B981"
            defaultColor="#042C51"
          />
        ) : (
          <EmptyChart message="No conversion data found." />
        )}
      </ChartCard>

      <ChartCard
        title="Sourcing Channel Cost"
        description="Recorded sourcing expenses by channel"
        icon={ReceiptText}
        delay={180}
      >
        {hasData ? (
          <NativeSvgBarChart
            items={chartData}
            getValue={(item) => item.sourceCost}
            formatValue={(val) => formatCurrency(val)}
            activeColor="#FF5C28"
            defaultColor="#F59E0B"
          />
        ) : (
          <EmptyChart message="No sourcing-cost data found." />
        )}
      </ChartCard>
    </section>
  );
}