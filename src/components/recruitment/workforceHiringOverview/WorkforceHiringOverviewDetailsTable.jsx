import { useRef, useState } from "react";
import { useWorkforceHiringView } from "../../../services/context/WorkforceHiringContextAdapter";
import {
  formatOverviewNumber,
  formatOverviewPercent,
} from "../../../lib/utils/workforceHiringOverview/workforceHiringOverviewHelpers";

function HeaderTh({
  children,
  rowSpan,
  colSpan,
  className = "",
  group = false,
}) {
  return (
    <th
      rowSpan={rowSpan}
      colSpan={colSpan}
      className={[
        "border border-slate-200 px-2 py-3 text-center align-middle text-[11px] font-extrabold uppercase leading-tight text-sibs-primary-90",
        group ? "bg-slate-100" : "bg-slate-50",
        className,
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function BodyTd({ children, className = "" }) {
  return (
    <td
      className={[
        "border border-slate-200 px-2 py-2 text-center align-middle text-[12px] font-semibold leading-tight text-sibs-primary-90",
        className,
      ].join(" ")}
    >
      {children}
    </td>
  );
}

function getBufferColor(value) {
  const numberValue = Number(value || 0);

  if (numberValue < 0) return "text-red-600";
  if (numberValue > 0) return "text-emerald-600";

  return "text-sibs-primary-90";
}

function getHiringNeededColor(value) {
  const numberValue = Number(value || 0);

  if (numberValue > 0) return "text-red-600";

  return "text-emerald-600";
}

export default function WorkforceHiringOverviewDetailsTable() {
  const {
    detailTable: { detailRows, totals },
  } = useWorkforceHiringView();

  const dragScrollRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const [isDragging, setIsDragging] = useState(false);

  const rows = [...detailRows, totals];

  function handleDragStart(event) {
    const container = dragScrollRef.current;

    if (!container) return;

    isDraggingRef.current = true;
    setIsDragging(true);

    startXRef.current = event.pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;

    container.style.userSelect = "none";
  }

  function handleDragMove(event) {
    const container = dragScrollRef.current;

    if (!container || !isDraggingRef.current) return;

    event.preventDefault();

    const x = event.pageX - container.offsetLeft;
    const walk = x - startXRef.current;

    container.scrollLeft = scrollLeftRef.current - walk;
  }

  function handleDragEnd() {
    const container = dragScrollRef.current;

    isDraggingRef.current = false;
    setIsDragging(false);

    if (!container) return;

    container.style.userSelect = "";
  }

  function handleTouchStart(event) {
    const container = dragScrollRef.current;

    if (!container) return;

    const touch = event.touches?.[0];

    if (!touch) return;

    isDraggingRef.current = true;
    setIsDragging(true);

    startXRef.current = touch.pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;
  }

  function handleTouchMove(event) {
    const container = dragScrollRef.current;

    if (!container || !isDraggingRef.current) return;

    const touch = event.touches?.[0];

    if (!touch) return;

    const x = touch.pageX - container.offsetLeft;
    const walk = x - startXRef.current;

    container.scrollLeft = scrollLeftRef.current - walk;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-base font-bold uppercase tracking-tight text-sibs-primary-90">
        Detailed Performance by Cluster / Account
      </h2>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div
          ref={dragScrollRef}
          className={[
            "overflow-x-auto",
            isDragging ? "cursor-grabbing" : "cursor-pointer",
          ].join(" ")}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleDragEnd}
        >
          <table className="w-full min-w-[1840px] border-collapse">
            <thead>
              <tr>
                <HeaderTh rowSpan={2}>Cluster</HeaderTh>
                <HeaderTh rowSpan={2}>Account</HeaderTh>

                <HeaderTh rowSpan={2}>
                  Required
                  <br />
                  Headcount
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Actual
                  <br />
                  Headcount
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Buffer
                  <br />%
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Absenteeism
                  <br />
                  (Current Week)
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Absenteeism
                  <br />%
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Attrition
                  <br />
                  (Current Week)
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Attrition
                  <br />%
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Net
                  <br />
                  Actual HC
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Hiring
                  <br />
                  Needed
                </HeaderTh>

                <HeaderTh colSpan={5} group>
                  Hiring Funnel Counts
                </HeaderTh>

                <HeaderTh colSpan={10} group>
                  Attrition Between Stages
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Hired
                  <br />
                  Count
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Hiring Rate
                  <br />
                  (Leads to JO)
                </HeaderTh>
              </tr>

              <tr>
                <HeaderTh>
                  Accepted
                  <br />
                  JO
                </HeaderTh>

                <HeaderTh>
                  NHO
                  <br />
                  Count
                </HeaderTh>

                <HeaderTh>
                  FST
                  <br />
                  Count
                </HeaderTh>

                <HeaderTh>
                  PST
                  <br />
                  Count
                </HeaderTh>

                <HeaderTh>
                  Go
                  <br />
                  Live
                </HeaderTh>

                <HeaderTh>
                  JO - NHO
                  <br />
                  Count
                </HeaderTh>

                <HeaderTh>%</HeaderTh>

                <HeaderTh>
                  NHO - FST
                  <br />
                  Count
                </HeaderTh>

                <HeaderTh>%</HeaderTh>

                <HeaderTh>
                  FST - PST
                  <br />
                  Count
                </HeaderTh>

                <HeaderTh>%</HeaderTh>

                <HeaderTh>
                  NHO - PST
                  <br />
                  Count
                </HeaderTh>

                <HeaderTh>%</HeaderTh>

                <HeaderTh>
                  PST - Go Live
                  <br />
                  Count
                </HeaderTh>

                <HeaderTh>%</HeaderTh>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => {
                const isTotalRow = index === detailRows.length;

                return (
                  <tr
                    key={`${row.cluster}-${row.account || "total"}-${index}`}
                    className={[
                      isTotalRow
                        ? "bg-slate-50 font-extrabold"
                        : index % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50/50",
                      !isTotalRow ? "hover:bg-blue-50/50" : "",
                    ].join(" ")}
                  >
                    <BodyTd
                      className={
                        isTotalRow
                          ? "text-left font-extrabold"
                          : "font-bold text-sibs-primary-80"
                      }
                    >
                      {row.cluster}
                    </BodyTd>

                    <BodyTd
                      className={
                        isTotalRow
                          ? "text-left font-extrabold"
                          : "text-left font-semibold"
                      }
                    >
                      {row.account}
                    </BodyTd>

                    <BodyTd>
                      {formatOverviewNumber(row.requiredHeadcount)}
                    </BodyTd>

                    <BodyTd>{formatOverviewNumber(row.actualHeadcount)}</BodyTd>

                    <BodyTd className={getBufferColor(row.bufferPercentage)}>
                      {formatOverviewPercent(row.bufferPercentage)}
                    </BodyTd>

                    <BodyTd>{formatOverviewNumber(row.absenteeism)}</BodyTd>

                    <BodyTd className="text-blue-600">
                      {formatOverviewPercent(row.absenteeismPercentage)}
                    </BodyTd>

                    <BodyTd>{formatOverviewNumber(row.attrition)}</BodyTd>

                    <BodyTd className="text-red-600">
                      {formatOverviewPercent(row.attritionPercentage)}
                    </BodyTd>

                    <BodyTd>{formatOverviewNumber(row.netActualHc)}</BodyTd>

                    <BodyTd className={getHiringNeededColor(row.hiringNeeded)}>
                      {formatOverviewNumber(row.hiringNeeded)}
                    </BodyTd>

                    <BodyTd>{formatOverviewNumber(row.acceptedJo)}</BodyTd>

                    <BodyTd>{formatOverviewNumber(row.nho)}</BodyTd>

                    <BodyTd>{formatOverviewNumber(row.fst)}</BodyTd>

                    <BodyTd>{formatOverviewNumber(row.pst)}</BodyTd>

                    <BodyTd className="text-emerald-700">
                      {formatOverviewNumber(row.goLive)}
                    </BodyTd>

                    <BodyTd>{formatOverviewNumber(row.joNhoCount)}</BodyTd>

                    <BodyTd>
                      {formatOverviewPercent(row.joNhoPercentage)}
                    </BodyTd>

                    <BodyTd>{formatOverviewNumber(row.nhoFstCount)}</BodyTd>

                    <BodyTd>
                      {formatOverviewPercent(row.nhoFstPercentage)}
                    </BodyTd>

                    <BodyTd>{formatOverviewNumber(row.fstPstCount)}</BodyTd>

                    <BodyTd>
                      {formatOverviewPercent(row.fstPstPercentage)}
                    </BodyTd>

                    <BodyTd>{formatOverviewNumber(row.nhoPstCount)}</BodyTd>

                    <BodyTd>
                      {formatOverviewPercent(row.nhoPstPercentage)}
                    </BodyTd>

                    <BodyTd>{formatOverviewNumber(row.pstGoLiveCount)}</BodyTd>

                    <BodyTd>
                      {formatOverviewPercent(row.pstGoLivePercentage)}
                    </BodyTd>

                    <BodyTd className="text-emerald-700">
                      {formatOverviewNumber(row.hiredCount)}
                    </BodyTd>

                    <BodyTd className="text-sibs-primary-90">
                      {formatOverviewPercent(row.hiringRate)}
                    </BodyTd>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
