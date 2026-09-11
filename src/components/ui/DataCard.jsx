import React from "react";
import { ChevronRight, FileQuestion } from "lucide-react";

/**
 * Universal compound mobile card component for tabular records.
 * Standardizes visual hierarchy, touch feedback, 44px tap targets,
 * metrics grids, shimmer loading states, and zero-state empties across SiBS HRIS.
 */
export default function DataCard({
  children,
  onClick,
  interactive = false,
  className = "",
  style,
  index = 0,
  interactive,
  ...props
}) {
  const isClickable =
    interactive !== undefined
      ? Boolean(interactive && typeof onClick === "function")
      : typeof onClick === "function";

  const handleKeyDown = isClickable
    ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick(event);
        }
      }
    : undefined;

  const animationStyle = style || (index !== undefined
    ? {
        animationDelay: `${Math.min(index, 10) * 35}ms`,
        animationFillMode: "both",
      }
    : undefined);

  return (
    <article
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      style={animationStyle}
      className={`sibs-page-card-in group relative overflow-hidden rounded-xl border border-[#E6ECF2] bg-white p-3.5 shadow-xs transition-all duration-200 ${
        isInteractive
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-[#FF5C28]/40 hover:shadow-md active:scale-[0.99]"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </article>
  );
}

function DataCardHeader({
  avatar,
  kicker,
  title,
  subtitle,
  badge,
  action,
  children,
  className = "",
}) {
  return (
    <div className={`flex items-start justify-between gap-2.5 ${className}`}>
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {avatar && (
          <div
            className="shrink-0"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {avatar}
          </div>
        )}
        <div className="min-w-0 flex-1">
          {kicker && (
            <div className="text-[10px] font-mono font-extrabold text-[#FF5C28]">
              {kicker}
            </div>
          )}
          {title && (
            <h3 className="m-0 truncate font-jakarta text-[13px] sm:text-sm font-extrabold text-[#042C51] transition-colors group-hover:text-[#FF5C28]">
              {title}
            </h3>
          )}
          {subtitle && (
            <div className="mt-0.5 truncate text-[11px] font-semibold text-[#667085]">
              {subtitle}
            </div>
          )}
          {children}
        </div>
      </div>

      {(badge || action) && (
        <div
          className="flex shrink-0 items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {badge}
          {action}
        </div>
      )}
    </div>
  );
}

function DataCardContextRow({ children, className = "" }) {
  return (
    <div
      className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E6ECF2]/80 bg-[#F8FAFC] px-2.5 py-2 text-[11px] leading-snug text-[#344054] ${className}`}
    >
      {children}
    </div>
  );
}

function DataCardMetrics({ children, cols = 4, className = "" }) {
  const colClass =
    cols === 2
      ? "grid-cols-2"
      : cols === 3
      ? "grid-cols-3"
      : cols === 4
      ? "grid-cols-4"
      : "grid-cols-2 sm:grid-cols-4";

  return (
    <div
      className={`mt-2.5 grid ${colClass} divide-x divide-[#E6ECF2] rounded-lg border border-[#E6ECF2] bg-white py-1.5 text-center ${className}`}
    >
      {children}
    </div>
  );
}

function DataCardMetricItem({
  label,
  value,
  tone = "default",
  className = "",
  valueClassName = "",
}) {
  const toneClasses = {
    default: "text-[#042C51]",
    secondary: "text-[#344054]",
    muted: "text-[#667085]",
    dim: "text-[#7B8DB3]",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
    orange: "text-[#FF5C28]",
    blue: "text-blue-600",
    danger: "text-rose-600",
  };

  const selectedTone = toneClasses[tone] || toneClasses.default;

  return (
    <div className={`px-1 ${className}`}>
      <p className="truncate text-[9px] font-extrabold uppercase tracking-wider text-[#8A98B8]">
        {label}
      </p>
      <div
        className={`mt-0.5 truncate text-[11px] sm:text-xs font-extrabold tabular-nums ${selectedTone} ${valueClassName}`}
      >
        {value}
      </div>
    </div>
  );
}

function DataCardFooter({
  metadata,
  actionLabel = "Details",
  actionIcon,
  children,
  className = "",
}) {
  return (
    <div
      className={`mt-2.5 flex items-center justify-between border-t border-dashed border-[#E6ECF2] pt-2 text-[10px] font-semibold text-[#8A98B8] ${className}`}
    >
      {children || (
        <>
          <span className="truncate">
            {typeof metadata === "string" ? (
              metadata
            ) : (
              metadata
            )}
          </span>
          {actionLabel && (
            <span className="flex shrink-0 items-center gap-1 font-bold text-[#FF5C28] group-hover:underline">
              {actionLabel}
              {actionIcon || <ChevronRight size={12} />}
            </span>
          )}
        </>
      )}
    </div>
  );
}

function DataCardSkeleton({ count = 4, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`data-card-skeleton-${index}`}
          className="rounded-xl border border-[#E6ECF2] bg-white p-3.5 shadow-xs"
        >
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 animate-sibs-pulse rounded-full bg-[#E6ECF2]" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 animate-sibs-pulse rounded bg-[#E6ECF2]" />
                <div className="h-2.5 w-16 animate-sibs-pulse rounded bg-[#E6ECF2]" />
              </div>
            </div>
            <div className="h-5 w-16 animate-sibs-pulse rounded-full bg-[#E6ECF2]" />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] p-2">
            {Array.from({ length: 4 }).map((__, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="h-2 w-8 animate-sibs-pulse rounded bg-[#E6ECF2]" />
                <div className="h-3 w-6 animate-sibs-pulse rounded bg-[#E6ECF2]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DataCardEmpty({
  icon,
  title = "No records found",
  description = "Adjust your search or filter criteria to see results.",
  action,
  className = "",
}) {
  const renderedIcon = React.isValidElement(icon)
    ? icon
    : icon
      ? React.createElement(icon, { size: 22 })
      : <FileQuestion size={22} />;

  return (
    <div
      className={`rounded-xl border border-[#E6ECF2] bg-white p-8 text-center shadow-xs ${className}`}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0EB] text-[#FF5C28]">
        {renderedIcon}
      </div>
      <h4 className="mt-3 font-heading text-sm font-bold text-[#042C51]">
        {title}
      </h4>
      {description && (
        <p className="mx-auto mt-1 max-w-xs text-xs text-[#667085]">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function DataCardSection({
  label,
  children,
  className = "",
  contentClassName = "",
}) {
  return (
    <section
      className={`mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 ${className}`}
    >
      {label ? (
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#8A98B8]">
          {label}
        </p>
      ) : null}

      <div className={`${label ? "mt-2" : ""} ${contentClassName}`}>
        {children}
      </div>
    </section>
  );
}

function DataCardActions({ children, className = "" }) {
  return (
    <div
      className={`mt-3 flex flex-col gap-2 border-t border-[#E6ECF2] pt-3 sm:flex-row ${className}`}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {children}
    </div>
  );
}

// Compound component attachments
DataCard.Header = DataCardHeader;
DataCard.ContextRow = DataCardContextRow;
DataCard.Section = DataCardSection;
DataCard.Actions = DataCardActions;
DataCard.Metrics = DataCardMetrics;
DataCard.MetricItem = DataCardMetricItem;
DataCard.Footer = DataCardFooter;
DataCard.Skeleton = DataCardSkeleton;
DataCard.Empty = DataCardEmpty;
