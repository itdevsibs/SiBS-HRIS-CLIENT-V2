import React from "react";
import {
  formatOverviewNumber,
  formatOverviewPercent,
} from "../../../lib/utils/workforceHiringOverview/workforceHiringOverviewHelpers";

function joinClasses(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const WORKFORCE_BOLD_NUMBER_CLASS =
  "!font-black !text-sibs-navy";

export const WORKFORCE_SECONDARY_NUMBER_CLASS =
  "font-normal text-sibs-muted";

export function WorkforceGroupHeaderTh({
  children,
  className = "",
  ...props
}) {
  return (
    <th
      {...props}
      className={joinClasses(
        "sticky -top-px 2xl:-top-px z-30 sibs-data-table-th border border-sibs-border !bg-sibs-surface h-[26px] 2xl:h-[30px] !px-2.5 !py-1 2xl:!px-3 2xl:!py-1.5 !text-[9px] 2xl:!text-[10px] !font-black !text-sibs-primary-1 text-center align-middle font-jakarta uppercase tracking-wider leading-tight",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function WorkforceHeaderTh({
  children,
  className = "",
  ...props
}) {
  return (
    <th
      {...props}
      className={joinClasses(
        "sticky top-[24px] 2xl:top-[28px] z-20 sibs-data-table-th border border-sibs-border !bg-sibs-surface h-[28px] 2xl:h-[32px] !px-2.5 !py-1 2xl:!px-3 2xl:!py-1.5 !text-[9px] 2xl:!text-[10px] !font-extrabold !text-sibs-muted text-center align-middle font-jakarta uppercase tracking-wider leading-tight",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function WorkforceBodyTd({
  children,
  className = "",
  align = "center",
  numeric = true,
  ...props
}) {
  const alignmentClass =
    align === "left"
      ? "text-left"
      : align === "right"
        ? "text-right"
        : "text-center";

  return (
    <td
      {...props}
      className={joinClasses(
        "whitespace-nowrap border-b border-sibs-border px-2.5 py-1.5 2xl:px-3 2xl:py-2 align-middle text-xs leading-tight font-jakarta text-sibs-primary-1",
        numeric ? "tabular-nums" : "",
        alignmentClass,
        className,
      )}
    >
      {children}
    </td>
  );
}

export function WorkforceFooterTd({
  children,
  className = "",
  align = "center",
  numeric = true,
  ...props
}) {
  const alignmentClass =
    align === "left"
      ? "text-left"
      : align === "right"
        ? "text-right"
        : "text-center";

  return (
    <td
      {...props}
      className={joinClasses(
        "whitespace-nowrap border-t-2 border-sibs-border bg-sibs-surface px-2.5 py-1.5 2xl:px-3 2xl:py-2 align-middle text-xs leading-tight font-jakarta font-medium text-sibs-navy",
        numeric ? "tabular-nums" : "",
        alignmentClass,
        className,
      )}
    >
      {children}
    </td>
  );
}

export function getWorkforceValueColor(value) {
  const numberValue = Number(value || 0);

  if (numberValue < 0) return "text-rose-600";
  if (numberValue > 0) return "text-emerald-600";

  return "text-sibs-navy";
}

export function getWorkforceHiringNeededColor(value) {
  return Number(value || 0) > 0
    ? "text-rose-600"
    : "text-emerald-600";
}

export function WorkforceHiringNeededValue({ value, summary = false }) {
  const numberValue = Number(value || 0);

  if (summary) {
    return (
      <span
        className={
          numberValue > 0
            ? "font-black text-rose-600"
            : "font-black text-emerald-600"
        }
      >
        {formatOverviewNumber(value)}
      </span>
    );
  }

  if (numberValue > 0) {
    return (
      <span className="inline-block rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 font-black text-rose-600">
        {formatOverviewNumber(value)}
      </span>
    );
  }

  return (
    <span className="font-normal text-sibs-muted">
      {formatOverviewNumber(value)}
    </span>
  );
}

export function WorkforceMetricWithPercent({
  value,
  percent,
  valueClassName = "font-normal text-sibs-muted",
  percentClassName = "text-sibs-muted",
}) {
  return (
    <div className="leading-tight">
      <div className={valueClassName}>{formatOverviewNumber(value)}</div>
      <div
        className={joinClasses(
          "mt-0.5 text-[10px] font-extrabold",
          percentClassName,
        )}
      >
        {formatOverviewPercent(percent)}
      </div>
    </div>
  );
}
