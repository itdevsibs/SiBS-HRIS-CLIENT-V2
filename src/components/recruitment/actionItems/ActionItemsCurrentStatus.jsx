import React, { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Plus,
  RefreshCw,
} from "lucide-react";

import { useActionItems } from "../../../services/context/ActionItemsContext.jsx";
import { useActionItemsReport } from "../../../services/context/ActionItemsReportContext.jsx";
import { formatDate } from "../../../lib/utils/actionItems/actionItemsHelpers.js";
import { getActionCoverageForRow } from "../../../lib/utils/actionItems/actionItemsCoverageHelpers.js";
import { WorkforceBodyTd } from "../workforceHiringPlan/WorkforceHiringTablePrimitives.jsx";

const RECENT_COMPLETED_ACTION_DAYS = 14;

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function safeText(value, fallback = "—") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function getFillRate(row = {}) {
  const suppliedRate = Number(row.fillRate);

  if (Number.isFinite(suppliedRate)) {
    return Math.max(0, Math.round(suppliedRate));
  }

  const required = Number(row.requiredHiring || 0);
  const accepted = Number(row.accepted || 0);

  return required > 0 ? Math.round((accepted / required) * 100) : 0;
}

function getRiskBadge(row = {}) {
  return row.atRisk
    ? "border-rose-600 bg-rose-600 text-white"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getFillRateClass(rate) {
  if (rate >= 80) return "bg-emerald-50 text-emerald-700";
  if (rate >= 50) return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-600";
}

function CoverageControl({ row, coverage, onCreateAction }) {
  if (coverage.state === "assigned") {
    return (
      <span
        className="inline-flex h-7 w-[130px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2 text-[9.5px] font-extrabold text-blue-700"
        title={
          coverage.activeAction?.actionItem ||
          "A Planned or Ongoing action currently covers this requirement."
        }
      >
        <CheckCircle2 size={12} />
        Action Assigned
      </span>
    );
  }

  if (coverage.state === "follow-up") {
    const actionId =
      coverage.latestCompletedAction?.actionId ||
      coverage.latestCompletedAction?.id ||
      "completed action";

    return (
      <div className="flex flex-col items-end justify-center gap-1 text-right">
        <span
          className="inline-flex h-6 w-[130px] shrink-0 items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 text-[9px] font-extrabold text-amber-700"
          title={`${actionId} was completed, but the hiring gap remains open.`}
        >
          <RefreshCw size={10} />
          Follow-up Needed
        </span>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onCreateAction?.(row);
          }}
          className="inline-flex h-7 w-[130px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 text-[9.5px] font-extrabold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
          title={`Create a follow-up action after ${actionId}.`}
        >
          <Plus size={11} />
          Create Follow-up
        </button>
      </div>
    );
  }

  if (coverage.state === "missing") {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onCreateAction?.(row);
        }}
        className="inline-flex h-7 w-[130px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2 text-[9.5px] font-extrabold text-red-700 transition hover:border-red-300 hover:bg-red-100"
        title="No Planned or Ongoing action covers this at-risk requirement."
      >
        <Plus size={12} />
        Missing Action
      </button>
    );
  }

  return (
    <span className="inline-flex h-7 w-[130px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-[9.5px] font-extrabold text-emerald-700">
      <CheckCircle2 size={12} />
      No Action Needed
    </span>
  );
}

function RequirementMobileCard({ row, onCreateAction }) {
  const fillRate = getFillRate(row);

  return (
    <article className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-extrabold text-[#042C51]">
            {safeText(row.account, "Unassigned Account")}
          </h3>
          <p className="mt-1 text-[10px] font-semibold uppercase text-[#667085]">
            {safeText(row.role, "Unassigned Role")}
          </p>
          <p className="mt-1 text-[9px] font-semibold uppercase text-[#98A2B3]">
            TA: {safeText(row.taOwner, "Unassigned")}
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${getRiskBadge(
            row,
          )}`}
        >
          <CircleAlert size={11} />
          {row.atRisk ? "Yes" : "No"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[
          ["Required", formatNumber(row.requiredHiring)],
          ["Accepted", formatNumber(row.accepted)],
          ["Fill Rate", `${fillRate}%`],
          ["Qualified", formatNumber(row.qualifiedPipeline)],
          ["Screened", formatNumber(row.screened)],
          ["Interviewed", formatNumber(row.interviewed)],
          ["Offers", formatNumber(row.offers)],
          ["Days Open", `${formatNumber(row.daysOpen)}d`],
          ["Due Date", formatDate(row.dueDate)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] p-2.5"
          >
            <p className="text-[8px] font-extrabold uppercase text-[#98A2B3]">
              {label}
            </p>
            <p className="mt-1 text-xs font-extrabold text-[#042C51]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50/60 p-3">
        <p className="text-[8px] font-extrabold uppercase text-rose-500">
          Risk Reason
        </p>
        <p className="mt-1 text-[10px] font-bold leading-4 text-rose-700">
          {safeText(row.reason, "No active risk trigger")}
        </p>
      </div>

      <div className="mt-3 flex flex-col gap-3 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10px] font-semibold leading-4 text-[#667085]">
          {safeText(row.latestStatusNotes, "No status note recorded.")}
        </p>
        <CoverageControl
          row={row}
          coverage={row.actionCoverage}
          onCreateAction={onCreateAction}
        />
      </div>
    </article>
  );
}

export default function ActionItemsCurrentStatus() {
  const { combinedItems } = useActionItems();
  const {
    filteredCurrentStatusRows,
    openAddModalForStatusRow,
    selectReportRow,
  } = useActionItemsReport();

  const rows = useMemo(
    () =>
      (Array.isArray(filteredCurrentStatusRows)
        ? filteredCurrentStatusRows
        : []
      ).map((row) => ({
        ...row,
        actionCoverage: getActionCoverageForRow(row, combinedItems, {
          recentCompletedDays: RECENT_COMPLETED_ACTION_DAYS,
        }),
      })),
    [filteredCurrentStatusRows, combinedItems],
  );

  const dragScrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleDragStart = (e) => {
    if (!dragScrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - dragScrollRef.current.offsetLeft);
    setScrollLeft(dragScrollRef.current.scrollLeft);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragMove = (e) => {
    if (!isDragging || !dragScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - dragScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    dragScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <section
      className="sibs-page-card-in overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm"
      style={{ animationDelay: "180ms", animationFillMode: "both" }}
    >
      <header className="flex flex-col gap-2 border-b border-[#E6ECF2] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="sibs-section-title">
            Current Status – Active Open Requirements
          </h2>
          <p className="sibs-section-subtitle">
            Master account-level capacity ledger across active open requirements,
            fill rates, at-risk reasons, and action coverage.
          </p>
        </div>

        <span className="inline-flex w-fit shrink-0 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold text-[#042C51]">
          {rows.length} Records
        </span>
      </header>

      <div className="p-4 font-jakarta sm:p-5">
        <div className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
          <div
            ref={dragScrollRef}
            tabIndex={0}
            role="region"
            aria-label="Current Status table scroll area"
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            className={`hidden overflow-x-auto sibs-scrollbar focus:outline-none focus:ring-2 focus:ring-[#FF5C28]/20 lg:block ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
        <table className="w-full min-w-[1850px] border-collapse font-jakarta text-xs whitespace-nowrap text-left">
          <thead className="bg-[#F8FAFC]">
            <tr className="border-b border-[#E6ECF2]">
              {[
                ["Role / Account", "text-left"],
                ["Open Date", "text-center"],
                ["Due Date", "text-center"],
                ["Required Hiring", "text-center"],
                ["Fill Rate", "text-center"],
                ["Days Open", "text-center"],
                ["Qualified Pipeline", "text-center"],
                ["Screened", "text-center"],
                ["Interviewed", "text-center"],
                ["Offers", "text-center"],
                ["Accepted", "text-center"],
                ["At Risk", "text-center"],
                ["Reason", "text-left"],
                ["Latest Status / Notes & Action", "text-left"],
              ].map(([label, alignment], idx, arr) => (
                <th
                  key={label}
                  className={`border-r border-[#E6ECF2] px-3 py-3 text-[10px] font-extrabold uppercase tracking-wider text-[#667085] ${
                    idx === arr.length - 1 ? "border-r-0" : ""
                  } ${alignment}`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E6ECF2]">
            {rows.length ? (
              rows.map((row, index) => {
                const fillRate = getFillRate(row);

                return (
                  <tr
                    key={row.id || row.roleAccountKey}
                    className="sibs-page-card-in transition hover:bg-[#F8FAFC]"
                    style={{ animationDelay: `${index * 35}ms`, animationFillMode: "both" }}
                  >
                    <td className="border-r border-[#E6ECF2] px-3.5 py-3">
                      <p className="text-sm font-extrabold text-[#042C51] truncate">
                        {safeText(row.account, "Unassigned Account")}
                      </p>
                      <p className="mt-1 text-[9px] font-semibold uppercase leading-4 text-[#667085] truncate">
                        {safeText(row.role, "Unassigned Role")}
                      </p>
                      <p className="mt-1 text-[8px] font-semibold uppercase text-[#98A2B3] truncate">
                        TA: {safeText(row.taOwner, "Unassigned")}
                      </p>
                    </td>

                    <WorkforceBodyTd align="center">
                      <span className="font-semibold text-[#536887]">
                        {formatDate(row.openDate)}
                      </span>
                    </WorkforceBodyTd>
                    <WorkforceBodyTd align="center">
                      <span className="font-semibold text-[#536887]">
                        {formatDate(row.dueDate)}
                      </span>
                    </WorkforceBodyTd>
                    <WorkforceBodyTd className="!font-extrabold !text-[#042C51]">
                      {formatNumber(row.requiredHiring)}
                    </WorkforceBodyTd>
                    <td className="border-r border-[#E6ECF2] px-3 py-3 text-center align-middle">
                      <span
                        className={`inline-flex rounded px-2 py-1 text-[10px] font-extrabold ${getFillRateClass(
                          fillRate,
                        )}`}
                      >
                        {fillRate}%
                      </span>
                    </td>
                    <WorkforceBodyTd className="!font-bold !text-[#536887]">
                      {formatNumber(row.daysOpen)}d
                    </WorkforceBodyTd>
                    
                    {["qualifiedPipeline", "screened", "interviewed", "offers"].map(
                      (field) => (
                        <WorkforceBodyTd key={field} className="!font-semibold !text-[#315779]">
                          {formatNumber(row[field])}
                        </WorkforceBodyTd>
                      ),
                    )}
                    
                    <WorkforceBodyTd className="!font-extrabold !text-[#042C51]">
                      {formatNumber(row.accepted)}
                    </WorkforceBodyTd>
                    <td className="border-r border-[#E6ECF2] px-3 py-3 text-center align-middle">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${getRiskBadge(
                          row,
                        )}`}
                      >
                        <CircleAlert size={11} />
                        {row.atRisk ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="min-w-[240px] border-r border-[#E6ECF2] px-3.5 py-3 whitespace-normal align-middle">
                      <p className="text-[10px] font-bold leading-4 text-rose-600">
                        {safeText(row.reason, "No active risk trigger")}
                      </p>
                    </td>
                    <td className="min-w-[360px] px-3.5 py-3 whitespace-normal align-middle">
                      <div className="flex items-center justify-between gap-3">
                        <p
                          className="min-w-0 flex-1 text-[10px] font-semibold leading-4 text-[#667085]"
                          title={safeText(
                            row.latestStatusNotes,
                            "No status note recorded.",
                          )}
                        >
                          {safeText(
                            row.latestStatusNotes,
                            "No status note recorded.",
                          )}
                        </p>

                        <div className="flex shrink-0 w-[140px] items-center justify-end text-right font-jakarta">
                          <CoverageControl
                            row={row}
                            coverage={row.actionCoverage}
                            onCreateAction={openAddModalForStatusRow}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={14}
                  className="px-5 py-12 text-center text-sm font-semibold text-[#98A2B3]"
                >
                  No active hiring requirements match the selected reporting scope.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>

      <div className="space-y-3 p-3 lg:hidden">
        {rows.length ? (
          rows.map((row) => (
            <RequirementMobileCard
              key={row.id || row.roleAccountKey}
              row={row}
              onCreateAction={openAddModalForStatusRow}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-[#D9E2EC] p-8 text-center text-sm font-semibold text-[#98A2B3]">
            No active hiring requirements match the selected reporting scope.
          </div>
        )}
      </div>
    </section>
  );
}