import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Info,
  } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { getVisibleTrendLabelIndexes, shortTrendLabel } from "./attritionTrendAxis.js";

function TrendsChart({ trends = [] }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const chartRef = useRef(null);
  const [pixelWidth, setPixelWidth] = useState(500);

  useEffect(() => {
    const element = chartRef.current;
    if (!element) return undefined;
    const measure = () => setPixelWidth(element.getBoundingClientRect().width || 500);
    measure();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [trends.length]);

  if (!trends || trends.length === 0) {
    return (
      <div className="flex h-52 flex-col items-center justify-center rounded-xl border border-dashed border-sibs-border bg-sibs-surface p-6 text-center text-xs font-bold text-sibs-muted">
        No trend data available for the selected period.
      </div>
    );
  }

  const maxCount = Math.max(1, ...trends.map((t) => Number(t.attritionCount || 0)));

  const width = 500;
  const height = 180;
  const paddingLeft = 35;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const stepX = trends.length > 1 ? chartWidth / (trends.length - 1) : chartWidth / 2;

  const points = trends.map((t, idx) => {
    const x = paddingLeft + (trends.length > 1 ? idx * stepX : chartWidth / 2);
    const y = paddingTop + chartHeight - (Number(t.attritionCount || 0) / maxCount) * chartHeight;
    return { x, y, ...t };
  });
  const visibleLabels = new Set(getVisibleTrendLabelIndexes(points.length, pixelWidth));

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD = points.length > 0
    ? `${pathD} L ${points.at(-1).x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : "";

  return (
    <div ref={chartRef} className="relative w-full font-jakarta">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible select-none"
      >
        <defs>
          <linearGradient id="attritionTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff5c28" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ff5c28" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((ratio) => {
          const y = paddingTop + chartHeight * (1 - ratio);
          return (
            <g key={ratio}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 6}
                y={y + 3}
                textAnchor="end"
                className="text-[9px] fill-slate-400 font-mono font-bold"
              >
                {Math.round(maxCount * ratio)}
              </text>
            </g>
          );
        })}

        {/* Gradient fill under trend line */}
        {areaD ? <path d={areaD} fill="url(#attritionTrendFill)" /> : null}

        {/* Main trend line */}
        {pathD ? (
          <path
            d={pathD}
            fill="none"
            stroke="#ff5c28"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Points and interaction */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hoverIndex === idx ? "5" : "3.5"}
              fill="#ffffff"
              stroke="#ff5c28"
              strokeWidth="2.5"
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHoverIndex(idx)}
              onMouseLeave={() => setHoverIndex(null)}
            />
            {/* X-axis label */}
            {visibleLabels.has(idx) ? (
              <text
                x={p.x}
                y={height - 10}
                textAnchor="middle"
                className="text-[9px] fill-slate-500 font-bold"
              >
                {shortTrendLabel(p)}
              </text>
            ) : null}
          </g>
        ))}
      </svg>

      {/* Floating Tooltip */}
      {hoverIndex !== null && points[hoverIndex] ? (
        <div
          className="absolute z-20 pointer-events-none rounded-lg border border-sibs-border bg-sibs-navy px-2.5 py-1.5 text-white shadow-lg text-[10px] -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(points[hoverIndex].x / width) * 100}%`,
            top: `${(points[hoverIndex].y / height) * 100 - 6}%`,
          }}
        >
          <p className="font-extrabold text-sibs-orange">{points[hoverIndex].label}</p>
          <p className="text-slate-300 font-mono">
            {points[hoverIndex].weekStart} to {points[hoverIndex].weekEnd}
          </p>
          <div className="mt-1 flex items-center justify-between gap-3 text-[11px] font-bold">
            <span>Separations:</span>
            <span className="text-white font-black">{points[hoverIndex].attritionCount}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[11px] font-bold">
            <span>Rate:</span>
            <span className="text-amber-300 font-black">{points[hoverIndex].attritionRate}%</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[10px] text-slate-300">
            <span>Headcount:</span>
            <span>{points[hoverIndex].actualHeadcount}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AttritionReportsAnalytics({
  data,
  loading = false,
  selectedAccount = "All",
  onSelectAccount,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-[14px] border border-sibs-border bg-white p-4 lg:col-span-5">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-44 w-full" />
        </div>
        <div className="rounded-[14px] border border-sibs-border bg-white p-4 lg:col-span-4">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-44 w-full" />
        </div>
        <div className="rounded-[14px] border border-sibs-border bg-white p-4 lg:col-span-3">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-44 w-full" />
        </div>
      </div>
    );
  }

  const trends = data?.trends || [];
  const byAccount = data?.byAccount || [];
  const breakdown = data?.breakdown || {};

  const maxAccountAttrition = Math.max(1, ...byAccount.map((a) => a.attritionCount));

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-12 font-jakarta">
      {/* LEFT — ATTRITION TRENDS (5 cols) */}
      <article className="sibs-page-card-in flex flex-col justify-between rounded-[14px] border border-sibs-border bg-white p-4 shadow-sm lg:col-span-5" style={{ animationDelay: "180ms", animationFillMode: "both" }}>
        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
              Attrition Trends
            </h3>
            <span className="text-[10px] font-bold text-sibs-muted">
              {trends.length} weekly periods
            </span>
          </div>
          <p className="mt-0.5 sibs-text-xs font-semibold text-sibs-muted">
            Separation volume and attrition rate trajectory across weeks.
          </p>
        </div>

        <div className="mt-3 flex-1 flex items-center">
          <TrendsChart trends={trends} />
        </div>

        <div className="mt-2.5 flex items-center justify-between border-t border-sibs-border/60 pt-2 text-[10px] font-extrabold text-sibs-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sibs-orange" />
            Separations
          </span>
          <span>Hover points for detail</span>
        </div>
      </article>

      {/* CENTER — ATTRITION BY ACCOUNT (4 cols) */}
      <article className="sibs-page-card-in flex flex-col justify-between rounded-[14px] border border-sibs-border bg-white p-4 shadow-sm lg:col-span-4" style={{ animationDelay: "220ms", animationFillMode: "both" }}>
        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
              Attrition by Account
            </h3>
            <span className="text-[10px] font-bold text-sibs-muted">
              Ranked highest
            </span>
          </div>
          <p className="mt-0.5 sibs-text-xs font-semibold text-sibs-muted">
            Accounts with highest recorded attrition. Click an account to filter records.
          </p>
          {selectedAccount && selectedAccount !== "All" ? (
            <div className="mt-2 flex items-center justify-between gap-1.5 rounded-lg border border-sibs-orange/30 bg-orange-50/50 px-2.5 py-1 text-xs">
              <span className="text-[11px] font-bold text-sibs-navy">
                Filtered: <span className="font-extrabold text-sibs-orange">{selectedAccount}</span>
              </span>
              <button
                type="button"
                onClick={() => onSelectAccount?.("All")}
                aria-label="Clear account filter"
                className="inline-flex items-center gap-1 text-[10px] font-extrabold text-sibs-orange hover:text-sibs-navy transition"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex-1 space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
          {byAccount.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-sibs-border bg-sibs-surface p-4 text-center text-xs font-bold text-sibs-muted">
              No account separations in this scope.
            </div>
          ) : (
            byAccount.map((acc) => {
              const barPercent = Math.min(100, Math.round((acc.attritionCount / maxAccountAttrition) * 100));
              return (
                <div
                  key={acc.accountId}
                  onClick={() => onSelectAccount?.(acc.accountName)}
                  className="group cursor-pointer rounded-lg border border-sibs-border/70 bg-white p-2.5 transition hover:border-sibs-orange hover:bg-orange-50/20 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-bold text-sibs-navy group-hover:text-sibs-orange">
                      {acc.accountName}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] font-extrabold text-sibs-navy">
                      <b className="text-rose-600">{acc.attritionCount}</b> loss ·{" "}
                      <span className="text-sibs-muted">{acc.attritionRate}%</span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sibs-navy to-sibs-orange transition-all duration-300"
                      style={{ width: `${barPercent}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-2.5 border-t border-sibs-border/60 pt-2 text-right text-[10px] font-bold text-sibs-muted">
          Showing top {Math.min(byAccount.length, 15)} accounts
        </div>
      </article>

      {/* RIGHT — ATTRITION BREAKDOWN (3 cols) */}
      <article className="sibs-page-card-in flex flex-col justify-between rounded-[14px] border border-sibs-border bg-white p-4 shadow-sm lg:col-span-3" style={{ animationDelay: "260ms", animationFillMode: "both" }}>
        <div>
          <h3 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
            Attrition Breakdown
          </h3>
          <p className="mt-0.5 sibs-text-xs font-semibold text-sibs-muted">
            Voluntary vs. Involuntary separation categories.
          </p>
        </div>

        <div className="my-3 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-sibs-border bg-sibs-surface p-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sibs-muted mb-2">
            <Info className="h-5 w-5" />
          </div>
          <p className="text-xs font-extrabold text-sibs-navy">
            Classification Not Available
          </p>
          <p className="mt-1 text-[10.5px] leading-relaxed font-semibold text-sibs-muted max-w-[220px]">
            {breakdown.emptyMessage ||
              "Separation classifications (Voluntary vs. Involuntary) are not tracked in the workforce weekly aggregate metrics."}
          </p>
        </div>

        <div className="border-t border-sibs-border/60 pt-2 text-[10px] font-bold text-sibs-muted">
          Source: Kronos Workforce Weekly Metrics
        </div>
      </article>
    </section>
  );
}
