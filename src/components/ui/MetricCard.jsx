import React from "react";
import { ChevronRight } from "lucide-react";
import { MetricCardSkeleton } from "./MetricCardSkeleton";

const TONE_MAP = {
  navy: {
    label: "sibs-tone-navy-label",
    icon: "sibs-tone-navy-icon",
    badge: "sibs-tone-navy-icon",
  },
  orange: {
    label: "sibs-tone-orange-label",
    icon: "sibs-tone-orange-icon",
    badge: "sibs-tone-orange-icon",
  },
  green: {
    label: "sibs-tone-green-label",
    icon: "sibs-tone-green-icon",
    badge: "sibs-tone-green-icon",
  },
  emerald: {
    label: "sibs-tone-green-label",
    icon: "sibs-tone-green-icon",
    badge: "sibs-tone-green-icon",
  },
  amber: {
    label: "sibs-tone-amber-label",
    icon: "sibs-tone-amber-icon",
    badge: "sibs-tone-amber-icon",
  },
  yellow: {
    label: "sibs-tone-amber-label",
    icon: "sibs-tone-amber-icon",
    badge: "sibs-tone-amber-icon",
  },
  red: {
    label: "sibs-tone-red-label",
    icon: "sibs-tone-red-icon",
    badge: "sibs-tone-red-icon",
  },
  rose: {
    label: "sibs-tone-red-label",
    icon: "sibs-tone-red-icon",
    badge: "sibs-tone-red-icon",
  },
  indigo: {
    label: "sibs-tone-indigo-label",
    icon: "sibs-tone-indigo-icon",
    badge: "sibs-tone-indigo-icon",
  },
  purple: {
    label: "sibs-tone-purple-label",
    icon: "sibs-tone-purple-icon",
    badge: "sibs-tone-purple-icon",
  },
};

export default function MetricCard({
  label,
  title,
  value,
  description,
  subtext,
  badge,
  trend = null,
  trendDirection = "up",
  icon: Icon,
  tone = "orange",
  delay = 0,
  loading = false,
  onClick,
  className = "",
}) {
  if (loading) {
    return <MetricCardSkeleton label={label || title} delay={delay} />;
  }

  const kickerText = label || title;
  const descText = description || subtext;
  const isInteractive = typeof onClick === "function";
  const toneConfig = TONE_MAP[tone] || TONE_MAP.orange;

  const Tag = isInteractive ? "button" : "article";

  return (
    <Tag
      type={isInteractive ? "button" : undefined}
      onClick={onClick}
      className={`group sibs-metric-card sibs-page-card-in font-jakarta relative flex h-[104px] 2xl:h-[116px] min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5 text-left active:translate-y-0 ${
        isInteractive ? "cursor-pointer" : ""
      } ${className}`.trim()}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
        <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
          <div>
            {kickerText && (
              <p className={`m-0 truncate sibs-kpi-kicker ${toneConfig.label}`}>
                {kickerText}
              </p>
            )}

            <div className="mt-1.5 2xl:mt-2 flex flex-wrap items-baseline gap-1.5 2xl:gap-2">
              <span className="sibs-kpi-value tabular-nums">
                {value ?? "0"}
              </span>

              {badge ? (
                <span
                  className={`rounded px-1.5 py-0.5 sibs-text-micro font-extrabold whitespace-nowrap ${toneConfig.badge}`}
                >
                  {badge}
                </span>
              ) : trend ? (
                <span
                  className={`inline-flex items-center text-[10px] font-bold ${
                    trendDirection === "up"
                      ? "text-emerald-600"
                      : trendDirection === "down"
                      ? "text-rose-600"
                      : "text-sibs-muted"
                  }`}
                >
                  {trend}
                </span>
              ) : null}
            </div>
          </div>

          {descText && (
            <p className="mt-1 line-clamp-1 truncate sibs-kpi-desc">
              {descText}
            </p>
          )}
        </div>

        {Icon && (
          <span
            className={`flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full ${toneConfig.icon}`}
          >
            <Icon className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" strokeWidth={2} />
          </span>
        )}
      </div>

      <ChevronRight className="absolute bottom-2.5 right-2.5 h-3.5 w-3.5 2xl:h-4 2xl:w-4 translate-x-1 text-sibs-orange opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
    </Tag>
  );
}

export function MetricGrid({ children, columns = 6, className = "" }) {
  let colClass = "";
  if (typeof columns === "string") {
    colClass = columns;
  } else if (columns === 7) {
    colClass = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7";
  } else if (columns === 6) {
    // 1080p (2xl: 1920x1080) -> 1 row (6 columns)
    // 768p (xl: 1366x768 / md: 1024x768) -> 2 rows of 3 columns (preserves full readability without truncation)
    // Tablet portrait (sm:) -> 3 rows of 2 columns
    // Mobile -> 1 column
    colClass = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6";
  } else if (columns === 5) {
    colClass = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";
  } else if (columns === 4) {
    colClass = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  } else if (columns === 3) {
    colClass = "grid-cols-1 sm:grid-cols-3";
  } else if (columns === 2) {
    colClass = "grid-cols-1 sm:grid-cols-2";
  } else {
    colClass = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6";
  }

  return (
    <section
      className={`grid gap-2.5 2xl:gap-3 ${colClass} ${className}`.trim()}
    >
      {children}
    </section>
  );
}
