import React, { useRef, useState } from "react";
import { useActionItemsReport } from "../../../services/context/ActionItemsReportContext.jsx";
import { WorkforceBodyTd } from "../workforceHiringPlan/WorkforceHiringTablePrimitives.jsx";

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
      className="sibs-page-card-in overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm"
      style={{ animationDelay: "120ms", animationFillMode: "both" }}
    >
      <header className="flex flex-col gap-2 border-b border-[#E6ECF2] bg-white px-4 py-3.5 sm:px-5 2xl:px-6 2xl:py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="sibs-section-title">
            Weekly Performance - Previous Sprint Results
          </h2>
          <p className="sibs-section-subtitle">
            Master account-level candidate movement and delivery for {previousWeekLabel}.
          </p>
        </div>
        <span className="inline-flex w-fit shrink-0 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 sibs-text-micro font-extrabold text-[#042C51]">
          {filteredWeeklyPerformanceRows.length} Records
        </span>
      </header>

      <div className="p-3.5 sm:p-4 2xl:p-5">
        <div className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
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
</section>
  );
}
