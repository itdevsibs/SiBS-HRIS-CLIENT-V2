import React, { useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useActionItemsReport } from "../../../services/context/ActionItemsReportContext.jsx";
import { WorkforceBodyTd } from "../workforceHiringPlan/WorkforceHiringTablePrimitives.jsx";

function WeeklyPerformanceMobileCard({ row, index = 0 }) {
  const isTargetMet = Number(row.hired || 0) >= Number(row.targetHires || 0);

  return (
    <article
      className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-xs"
      style={{ animationDelay: `${index * 35}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <h3 className="break-words font-jakarta text-sm font-extrabold text-[#042C51]">
            {row.account || "Unassigned Account"}
          </h3>
          <p className="mt-0.5 text-[10px] font-semibold uppercase text-[#667085]">
            {row.role || "Unassigned Role"}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[9px] font-extrabold text-blue-700">
            {row.weekCovered}
          </span>
          {row.hasHistoricalData && row.progressVsPlan && (
            <span
              className={`inline-flex rounded px-2 py-0.5 text-[9px] font-extrabold ${
                isTargetMet
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {row.progressVsPlan}
            </span>
          )}
        </div>
      </div>

      {!row.hasHistoricalData ? (
        <div className="mt-3 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-4 text-center text-xs font-semibold italic text-[#98A2B3]">
          — No historical data for this period
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Target Hires", row.targetHires ?? "—", "text-[#042C51] font-bold"],
              ["Hired", row.hired ?? "—", "text-emerald-700 font-black"],
              ["Starting Pipeline", row.startingPipeline ?? "—", "text-[#042C51] font-bold"],
              ["New Sourced", row.newSourced ?? "—", "text-blue-700 font-bold"],
              ["Screened", row.screened ?? "—", "text-[#344054] font-semibold"],
              ["Interviewed", row.interviewed ?? "—", "text-[#344054] font-semibold"],
              ["Offers", row.offers ?? "—", "text-[#344054] font-semibold"],
              ["Accepted", row.accepted ?? "—", "text-[#042C51] font-bold"],
              ["Drop-offs", row.dropOffs ?? "—", "text-rose-600 font-bold"],
              ["Ending Pipeline", row.endingPipeline ?? "—", "text-[#042C51] font-black"],
            ].map(([label, value, valueClass]) => (
              <div
                key={label}
                className="rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] p-2"
              >
                <p className="truncate text-[8px] font-extrabold uppercase text-[#98A2B3]">
                  {label}
                </p>
                <p className={`mt-0.5 truncate text-xs tabular-nums ${valueClass}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {row.keyIssueLastWeek && (
            <div className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/50 p-2.5">
              <div className="flex items-start gap-1.5">
                <AlertCircle size={13} className="mt-0.5 shrink-0 text-amber-600" />
                <div className="min-w-0">
                  <p className="text-[8px] font-extrabold uppercase text-amber-700">
                    Key Issue Last Week
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold leading-snug text-amber-900">
                    {row.keyIssueLastWeek}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </article>
  );
}

export default function ActionItemsWeeklyPerformance() {
  const {
    filteredWeeklyPerformanceRows,
    selectedRoleAccount,
    selectReportRow,
    previousWeekLabel,
  } = useActionItemsReport();

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
      className="sibs-page-card-in overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-sm"
      style={{ animationDelay: "120ms", animationFillMode: "both" }}
    >
      <header className="flex flex-col gap-2 border-b border-sibs-border bg-white px-4 py-3.5 sm:px-5 2xl:px-6 2xl:py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="sibs-card-title">
            Weekly Performance - Previous Sprint Results
          </h2>
          <p className="sibs-card-subtitle">
            Master account-level candidate movement and delivery for {previousWeekLabel}.
          </p>
        </div>
        <span className="inline-flex w-fit shrink-0 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 sibs-text-micro font-extrabold text-sibs-navy">
          {filteredWeeklyPerformanceRows.length} Records
        </span>
      </header>

      <div className="hidden p-3.5 sm:p-4 2xl:p-5 lg:block">
        <div className="overflow-hidden rounded-xl border border-sibs-border bg-white">
          <div
            ref={dragScrollRef}
            tabIndex={0}
            role="region"
            aria-label="Weekly Performance table scroll area"
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            className={`sibs-scrollbar overflow-x-auto focus:outline-none focus:ring-2 focus:ring-[#FF5C28]/20 ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
        <table className="w-full min-w-[1750px] border-collapse font-jakarta text-xs whitespace-nowrap text-left">

          <thead className="bg-[#F8FAFC]">
            <tr className="border-b border-[#E6ECF2]">
              {[
                ["Role / Account", "text-left"],
                ["Week Covered", "text-center"],
                ["Starting Pipeline", "text-center"],
                ["New Sourced", "text-center"],
                ["Screened", "text-center"],
                ["Interviewed", "text-center"],
                ["Offers", "text-center"],
                ["Accepted", "text-center"],
                ["Hired", "text-center"],
                ["Drop-offs", "text-center"],
                ["Ending Pipeline", "text-center"],
                ["Target Hires", "text-center"],
                ["Progress vs Plan", "text-center"],
                ["Key Issue Last Week", "text-left"],
              ].map(([label, alignment], idx, arr) => (
                <th
                  key={label}
                  className={`border-r border-[#E6ECF2] px-2.5 py-2 2xl:px-3 2xl:py-3 text-[10px] font-extrabold uppercase tracking-wider text-[#667085] ${
                    idx === arr.length - 1 ? "border-r-0" : ""
                  } ${alignment}`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E6ECF2]">
            {filteredWeeklyPerformanceRows.length ? (
              filteredWeeklyPerformanceRows.map((row, index) => {
                return (
                  <tr
                    key={row.id}
                    className="sibs-page-card-in hover:bg-[#F8FAFC] transition"
                    style={{ animationDelay: `${index * 35}ms`, animationFillMode: "both" }}
                  >
                    <td className="border-r border-[#E6ECF2] px-2.5 py-2 2xl:px-3.5 2xl:py-3">
                      <p className="text-sm font-extrabold text-[#042C51] truncate">
                        {row.account || "Unassigned Account"}
                      </p>
                      <p className="mt-1 text-[9px] font-semibold uppercase leading-4 text-[#667085] truncate">
                        {row.role || "Unassigned Role"}
                      </p>
                    </td>
                    <WorkforceBodyTd align="center">
                      <span className="font-semibold text-[#536887]">
                        {row.weekCovered}
                      </span>
                    </WorkforceBodyTd>

                    {!row.hasHistoricalData ? (
                      <td
                        colSpan={12}
                        className="border-r border-[#E6ECF2] bg-[#F8FAFC] px-3 py-3 text-center text-[11px] font-semibold italic text-[#98A2B3]"
                      >
                        — No historical data
                      </td>
                    ) : (
                      <>
                        <WorkforceBodyTd>{row.startingPipeline ?? "—"}</WorkforceBodyTd>
                        <WorkforceBodyTd className="!font-bold !text-blue-700">
                          {row.newSourced ?? "—"}
                        </WorkforceBodyTd>
                        <WorkforceBodyTd>{row.screened ?? "—"}</WorkforceBodyTd>
                        <WorkforceBodyTd>{row.interviewed ?? "—"}</WorkforceBodyTd>
                        <WorkforceBodyTd>{row.offers ?? "—"}</WorkforceBodyTd>

                        <WorkforceBodyTd className="!font-bold !text-[#042C51]">
                          {row.accepted ?? "—"}
                        </WorkforceBodyTd>
                        <WorkforceBodyTd className="!font-black !text-emerald-700">
                          {row.hired ?? "—"}
                        </WorkforceBodyTd>
                        <WorkforceBodyTd className="!font-bold !text-rose-600">
                          {row.dropOffs ?? "—"}
                        </WorkforceBodyTd>
                        <WorkforceBodyTd className="!font-black !text-[#042C51]">
                          {row.endingPipeline ?? "—"}
                        </WorkforceBodyTd>

                        <WorkforceBodyTd className="!font-bold">
                          {row.targetHires ?? "—"}
                        </WorkforceBodyTd>

                        <td className="min-w-[180px] border-r border-[#E6ECF2] px-3.5 py-3 text-center align-middle">
                          <span
                            className={`inline-flex rounded px-2.5 py-1 text-[10px] font-extrabold ${
                              Number(row.hired || 0) >= Number(row.targetHires || 0)
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {row.progressVsPlan}
                          </span>
                        </td>

                        <td className="min-w-[320px] px-3.5 py-3 text-[10px] font-bold leading-4 text-[#667085] whitespace-normal align-middle">
                          <span
                            title={row.keyIssueLastWeek}
                          >
                            {row.keyIssueLastWeek}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={14}
                  className="px-5 py-12 text-center text-sm font-semibold text-[#98A2B3]"
                >
                  No weekly performance rows match the current reporting scope.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>

      <div className="space-y-3 p-3 lg:hidden">
        {filteredWeeklyPerformanceRows.length ? (
          filteredWeeklyPerformanceRows.map((row, index) => (
            <WeeklyPerformanceMobileCard
              key={row.id}
              row={row}
              index={index}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-[#D9E2EC] p-8 text-center text-sm font-semibold text-[#98A2B3]">
            No weekly performance rows match the current reporting scope.
          </div>
        )}
      </div>
</section>
  );
}
