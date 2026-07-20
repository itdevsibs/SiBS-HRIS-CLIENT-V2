import { useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
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

function SortHeaderButton({
  label,
  active = false,
  direction = "asc",
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-extrabold uppercase leading-tight transition",
        active
          ? "bg-[#EAF2FB] text-sibs-primary-1"
          : "text-sibs-primary-90 hover:bg-slate-100 hover:text-sibs-primary-1",
      ].join(" ")}
    >
      <span>{label}</span>

      <span className="relative flex h-4 w-3 shrink-0 flex-col items-center justify-center">
        <span
          className={[
            "h-0 w-0 border-x-[4px] border-b-[5px] border-x-transparent transition",
            active && direction === "asc"
              ? "border-b-sibs-primary-1"
              : "border-b-slate-300 group-hover:border-b-sibs-primary-1/70",
          ].join(" ")}
        />

        <span
          className={[
            "mt-0.5 h-0 w-0 border-x-[4px] border-t-[5px] border-x-transparent transition",
            active && direction === "desc"
              ? "border-t-sibs-primary-1"
              : "border-t-slate-300 group-hover:border-t-sibs-primary-1/70",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

function getSortableText(row = {}, key = "") {
  if (key === "cluster") {
    return String(row.cluster || "").trim();
  }

  if (key === "account") {
    return String(row.account || "").trim();
  }

  return "";
}

function toNumber(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getPercent(numerator, denominator) {
  return denominator ? (numerator / denominator) * 100 : 0;
}

function buildFilteredTotals(rows = [], fallbackTotals = {}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return fallbackTotals;
  }

  const sum = rows.reduce(
    (total, row) => {
      total.requiredHeadcount += toNumber(row.requiredHeadcount);
      total.actualHeadcount += toNumber(row.actualHeadcount);
      total.absenteeism += toNumber(row.absenteeism);
      total.attrition += toNumber(row.attrition);
      total.acceptedJo += toNumber(row.acceptedJo);
      total.nho += toNumber(row.nho);
      total.fst += toNumber(row.fst);
      total.pst += toNumber(row.pst);
      total.goLive += toNumber(row.goLive);
      total.joNhoCount += toNumber(row.joNhoCount);
      total.nhoFstCount += toNumber(row.nhoFstCount);
      total.fstPstCount += toNumber(row.fstPstCount);
      total.nhoPstCount += toNumber(row.nhoPstCount);
      total.pstGoLiveCount += toNumber(row.pstGoLiveCount);
      total.hiredCount += toNumber(row.hiredCount);

      return total;
    },
    {
      requiredHeadcount: 0,
      actualHeadcount: 0,
      absenteeism: 0,
      attrition: 0,
      acceptedJo: 0,
      nho: 0,
      fst: 0,
      pst: 0,
      goLive: 0,
      joNhoCount: 0,
      nhoFstCount: 0,
      fstPstCount: 0,
      nhoPstCount: 0,
      pstGoLiveCount: 0,
      hiredCount: 0,
    },
  );

  const netActualHc = sum.actualHeadcount - sum.absenteeism - sum.attrition;
  const hiringNeeded = Math.max(0, sum.requiredHeadcount - netActualHc);

  return {
    ...fallbackTotals,
    ...sum,
    cluster: "TOTAL / AVERAGE",
    account: "",
    bufferPercentage: getPercent(
      netActualHc - sum.requiredHeadcount,
      sum.requiredHeadcount,
    ),
    absenteeismPercentage: getPercent(sum.absenteeism, sum.actualHeadcount),
    attritionPercentage: getPercent(sum.attrition, sum.actualHeadcount),
    netActualHc,
    hiringNeeded,
    joNhoPercentage: getPercent(sum.joNhoCount, sum.acceptedJo),
    nhoFstPercentage: getPercent(sum.nhoFstCount, sum.nho),
    fstPstPercentage: getPercent(sum.fstPstCount, sum.fst),
    nhoPstPercentage: getPercent(sum.nhoPstCount, sum.nho),
    pstGoLivePercentage: getPercent(sum.pstGoLiveCount, sum.pst),
    hiringRate: getPercent(sum.hiredCount, sum.acceptedJo),
  };
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "cluster",
    direction: "asc",
  });

  const sourceRows = Array.isArray(detailRows) ? detailRows : [];

  function handleSort(nextKey) {
    setSortConfig((current) => {
      if (current.key === nextKey) {
        return {
          key: nextKey,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key: nextKey,
        direction: "asc",
      };
    });
  }

  const visibleRows = useMemo(() => {
    const cleanSearch = searchQuery.trim().toLowerCase();

    const filteredRows = cleanSearch
      ? sourceRows.filter((row) => {
          const cluster = getSortableText(row, "cluster").toLowerCase();
          const account = getSortableText(row, "account").toLowerCase();

          return cluster.includes(cleanSearch) || account.includes(cleanSearch);
        })
      : sourceRows;

    return [...filteredRows].sort((firstRow, secondRow) => {
      const firstValue = getSortableText(firstRow, sortConfig.key);
      const secondValue = getSortableText(secondRow, sortConfig.key);

      const comparison = firstValue.localeCompare(secondValue, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [searchQuery, sortConfig.direction, sortConfig.key, sourceRows]);

  const activeTotals = useMemo(
    () =>
      searchQuery.trim() ? buildFilteredTotals(visibleRows, totals) : totals,
    [searchQuery, totals, visibleRows],
  );

  const rows = [...visibleRows, activeTotals];

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
      <div className="mb-4 border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-base font-extrabold uppercase tracking-tight text-sibs-primary-90">
                Detailed Performance by Cluster / Account
              </h2>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                {sourceRows.length > 0
                  ? `${visibleRows.length} of ${sourceRows.length} account rows`
                  : "No rows"}
              </span>
            </div>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              Main table view grouped by cluster and account for the selected
              weekly version.
            </p>
          </div>

          <div className="w-full xl:w-[520px]">
            <div className="relative">
              <Search
                size={20}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sibs-primary-70"
                strokeWidth={2.25}
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search cluster or account then press Enter..."
                className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-12 pr-24 text-sm font-semibold text-sibs-primary-90 outline-none transition placeholder:text-slate-400 hover:border-sibs-primary-1/40 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              />

              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-extrabold text-slate-500 transition hover:bg-slate-100 hover:text-sibs-primary-90"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

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
                <HeaderTh rowSpan={2}>
                  <SortHeaderButton
                    label="Cluster"
                    active={sortConfig.key === "cluster"}
                    direction={sortConfig.direction}
                    onClick={() => handleSort("cluster")}
                  />
                </HeaderTh>
                <HeaderTh rowSpan={2}>
                  <SortHeaderButton
                    label="Account"
                    active={sortConfig.key === "account"}
                    direction={sortConfig.direction}
                    onClick={() => handleSort("account")}
                  />
                </HeaderTh>

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
                const isTotalRow = index === visibleRows.length;

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
