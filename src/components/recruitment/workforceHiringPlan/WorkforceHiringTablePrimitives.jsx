import React from "react";
import {
  formatOverviewNumber,
  formatOverviewPercent,
} from "../../../lib/utils/workforceHiringOverview/workforceHiringOverviewHelpers";

function joinClasses(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const WORKFORCE_BOLD_NUMBER_CLASS =
  "!font-black !text-[#042C51]";

export const WORKFORCE_SECONDARY_NUMBER_CLASS =
  "font-normal text-slate-600";

export function WorkforceGroupHeaderTh({
  children,
  className = "",
  ...props
}) {
  return (
    <th
      {...props}
      className={joinClasses(
        "sticky top-0 z-30 sibs-data-table-th border border-slate-200 !bg-[#EBF3FA] !px-3 !py-2 !text-[10px] !font-black !text-sibs-primary-1 text-center align-middle font-jakarta uppercase tracking-wider",
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
        "sticky top-[35px] z-20 sibs-data-table-th border border-slate-200 !bg-[#F8FAFC] !px-3 !py-2.5 !text-[10px] !font-extrabold !text-slate-500 text-center align-middle font-jakarta uppercase tracking-wider",
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
        "whitespace-nowrap border-b border-[#E6ECF2] px-3 py-2.5 align-middle text-xs leading-tight font-jakarta text-sibs-primary-1",
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
        "whitespace-nowrap border-t-2 border-[#D7DEE8] bg-[#EBF3FA] px-3 py-2.5 align-middle text-xs leading-tight font-jakarta font-medium text-[#042C51]",
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

  if (numberValue < 0) return "text-[#E74C3C]";
  if (numberValue > 0) return "text-emerald-600";

  return "text-[#042C51]";
}

export function getWorkforceHiringNeededColor(value) {
  return Number(value || 0) > 0
    ? "text-[#E74C3C]"
    : "text-emerald-600";
}

export function WorkforceHiringNeededValue({ value, summary = false }) {
  const numberValue = Number(value || 0);

  if (summary) {
    return (
      <span
        className={
          numberValue > 0
            ? "font-black text-[#E74C3C]"
            : "font-black text-emerald-600"
        }
      >
        {formatOverviewNumber(value)}
      </span>
    );
  }

  if (numberValue > 0) {
    return (
      <span className="inline-block rounded border border-rose-100 bg-rose-50 px-1.5 py-0.5 font-black text-[#E74C3C]">
        {formatOverviewNumber(value)}
      </span>
    );
  }

  return (
    <span className="font-normal text-slate-400">
      {formatOverviewNumber(value)}
    </span>
  );
}

export function WorkforceMetricWithPercent({
  value,
  percent,
  valueClassName = "font-normal text-slate-600",
  percentClassName = "text-slate-500",
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
