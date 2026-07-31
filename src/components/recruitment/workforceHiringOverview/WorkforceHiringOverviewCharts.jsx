import { useEffect, useMemo, useState } from "react";
import { Maximize2, X } from "lucide-react";
import WorkforceHiringTrendDetailsModal from "../../modals/workforceHiringOverview/WorkforceHiringTrendDetailsModal";
import { useWorkforceHiringView } from "../../../services/context/WorkforceHiringContextAdapter";
import AnimatedNumber from "./shared/AnimatedNumber";
import TrendSvg from "./shared/TrendSvg";
import { HiringFunnelCard } from "./WorkforceHiringOverviewPipeline";

function Legend({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-[3px] w-[14px] rounded-full ${color}`} />
      {label}
    </span>
  );
}

function TrendSummaryBox({ label, value, tone, loading = false, animate = true }) {
  const palettes = {
    blue: "text-blue-700",
    orange: "text-orange-600",
    red: "text-rose-700",
    green: "text-emerald-700",
  };

  return (
    <div className="min-h-[64px] rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2.5 text-center">
      <span className="block text-[9px] font-extrabold uppercase tracking-wider text-[#667085]">
        {label}
      </span>

      {loading ? (
        <strong className="mt-2 block text-lg font-extrabold text-slate-300">
          —
        </strong>
      ) : (
        <AnimatedNumber
          value={value}
          enabled={animate}
          className={`mt-1 block text-lg font-black tabular-nums ${
            palettes[tone] || palettes.blue
          }`}
        />
      )}
    </div>
  );
}

function parseWeekInfo(selectedWeek) {
  if (!selectedWeek) return { weekNumber: 0, year: 0 };

  if (typeof selectedWeek === "object") {
    const weekNumber = Number(
      selectedWeek.weekNumber ||
        selectedWeek.week_number ||
        selectedWeek.week ||
        0,
    );
    const year = Number(selectedWeek.year || selectedWeek.weekYear || 0);

    if (weekNumber > 0) return { weekNumber, year };

    const rawString = String(
      selectedWeek.label ||
        selectedWeek.weeklyVersion ||
        selectedWeek.value ||
        "",
    );
    const weekMatch = rawString.match(/(?:week|wk)\s*-?\s*(\d+)/i);
    const yearMatch = rawString.match(/\b(20\d\d)\b/);

    return {
      weekNumber: weekMatch ? Number(weekMatch[1]) : 0,
      year: yearMatch ? Number(yearMatch[1]) : 0,
    };
  }

  if (typeof selectedWeek === "string") {
    const weekMatch = selectedWeek.match(/(?:week|wk)\s*-?\s*(\d+)/i);
    const yearMatch = selectedWeek.match(/\b(20\d\d)\b/);

    return {
      weekNumber: weekMatch ? Number(weekMatch[1]) : 0,
      year: yearMatch ? Number(yearMatch[1]) : 0,
    };
  }

  return { weekNumber: 0, year: 0 };
}

function getTrendWeekNumberRange(selectedWeek) {
  const { weekNumber, year } = parseWeekInfo(selectedWeek);

  if (!weekNumber || weekNumber <= 0) return "";

  const startWeek = Math.max(1, weekNumber - 5);

  return year
    ? `Week ${startWeek} - Week ${weekNumber}, ${year}`
    : `Week ${startWeek} - Week ${weekNumber}`;
}

function getTrendWeekLabels(selectedWeek, fallbackWeeks = []) {
  const { weekNumber } = parseWeekInfo(selectedWeek);

  if (!weekNumber || weekNumber <= 0) {
    return fallbackWeeks;
  }

  const startWeek = Math.max(1, weekNumber - 5);
  return Array.from({ length: 6 }, (_, index) => `Week ${startWeek + index}`);
}

function AttritionBetweenStagesCard() {
  const {
    overview: { attritionStages, summary },
  } = useWorkforceHiringView();

  return (
    <section className="sibs-page-card-in sibs-card flex h-full min-h-[520px] flex-col rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
          Attrition Between Stages
        </h3>
        <p className="mt-1 text-xs font-semibold text-[#667085]">
          Identifies candidate drop-off metrics between consecutive milestone stages.
        </p>
      </div>

      <div className="mt-4 flex flex-1 flex-col justify-around gap-3 rounded-xl border border-[#DDE5EE] bg-[#F8FAFC] p-3">
        {attritionStages.length === 0 ? (
          <div className="sibs-empty-panel rounded-xl border border-dashed border-[#D6E0EA] bg-white px-5 py-10 text-center text-xs font-bold text-[#667085]">
            No stage attrition data available.
          </div>
        ) : (
          attritionStages.map((row) => (
            <article
              key={row.fromTo}
              className="rounded-lg border border-[#DDE5EE] bg-white px-3 py-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-1.5 truncate text-[10px] font-extrabold text-[#344054]">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#E74C3C]" />
                  {row.fromTo}
                </span>

                <span className="shrink-0 font-mono text-[9px] font-bold text-[#98A2B3]">
                  Loss:{" "}
                  <b className="text-[#E74C3C]">
                    <AnimatedNumber value={row.count} />
                  </b>{" "}
                  <span className="mx-1 text-[#D0D5DD]">|</span>
                  <b className="text-[#E74C3C]">
                    <AnimatedNumber
                      value={`${Number(row.percentage || 0).toFixed(1)}%`}
                    />
                  </b>
                </span>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full border border-slate-200/70 bg-slate-100">
                <span
                  className="block h-full rounded-full bg-[#E74C3C] transition-all duration-500"
                  style={{ width: row.width }}
                />
              </div>
            </article>
          ))
        )}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-[#E74C3C]">
            <X className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[8px] font-extrabold uppercase tracking-wider text-rose-500">
              Total Attrition
            </p>
            <p className="text-[10px] font-black text-rose-950">
              Aggregate Loss
            </p>
          </div>
        </div>

        <div className="text-right">
          <AnimatedNumber
            value={summary.attrition}
            className="block text-base font-black leading-none text-[#E74C3C]"
          />
          <span className="mt-1 block text-[9px] font-bold text-[#E74C3C]">
            <AnimatedNumber
              value={`${Number(summary.attritionPercentage || 0).toFixed(2)}%`}
            />{" "}
            rate
          </span>
        </div>
      </div>
    </section>
  );
}

function SixWeekTrendsCard() {
  const {
    filters,
    overview: {
      summary,
      trendSummary,
      trends,
      trendWeeks,
      trendDetails,
      trendMeta,
      trendsLoading,
      trendsError,
    },
  } = useWorkforceHiringView();

  const [trendModalOpen, setTrendModalOpen] = useState(false);
  const [summaryReady, setSummaryReady] = useState(false);
  const footerSummary = trendSummary || summary;
  const trendRangeLabel = getTrendWeekNumberRange(filters?.selectedWeek);
  const displayTrendWeeks = getTrendWeekLabels(
    filters?.selectedWeek,
    trendWeeks,
  );
  const trendAnimationKey = useMemo(
    () =>
      JSON.stringify({
        weeks: trendWeeks || [],
        absenteeism: trends?.absenteeism || [],
        attrition: trends?.attrition || [],
        buffer: trends?.buffer || [],
      }),
    [trendWeeks, trends],
  );

  useEffect(() => {
    setSummaryReady(false);

    if (trendsLoading || trendsError) return undefined;

    const timer = window.setTimeout(() => setSummaryReady(true), 900);
    return () => window.clearTimeout(timer);
  }, [trendAnimationKey, trendsError, trendsLoading]);

  const summaryLoading = trendsLoading || Boolean(trendsError) || !summaryReady;

  return (
    <section className="sibs-page-card-in sibs-card flex h-full min-h-0 flex-col rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm xl:min-h-[520px]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
            6-Week Trends
          </h3>
          <p className="mt-1 text-xs font-semibold text-[#667085]">
            {trendRangeLabel || "Historical trajectory of core operational metrics."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setTrendModalOpen(true)}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#042C51] px-3 text-[9px] font-extrabold text-white shadow-sm transition hover:bg-[#073D6F]"
          >
            <Maximize2 className="h-3 w-3 text-[#FF5C28]" />
            View Trend Details
          </button>
        </div>
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-xl border border-[#DDE5EE] bg-[#F8FAFC] p-3 xl:min-h-[350px]">
        <div className="mb-1 flex flex-wrap justify-center gap-4 text-[9px] font-extrabold uppercase tracking-wide text-[#344054]">
          <Legend color="bg-blue-600" label="ABS %" />
          <Legend color="bg-orange-600" label="ATT %" />
          <Legend color="bg-emerald-600" label="BUF %" />
        </div>

        {trendsLoading ? (
          <div className="flex min-h-[200px] items-center justify-center text-xs font-semibold text-[#667085] xl:min-h-[300px]">
            Loading six-week trends...
          </div>
        ) : trendsError ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-rose-100 bg-rose-50 px-4 text-center text-xs font-semibold text-rose-700 xl:min-h-[300px]">
            {trendsError}
          </div>
        ) : (
          <TrendSvg
            weeks={displayTrendWeeks}
            trends={trends}
            variant="dashboard"
          />
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <TrendSummaryBox
          label="ABS AVG"
          value={`${Number(footerSummary.absenteeismPercentage || 0).toFixed(2)}%`}
          tone="blue"
          loading={summaryLoading}
          animate={summaryReady}
        />
        <TrendSummaryBox
          label="ATT AVG"
          value={`${Number(footerSummary.attritionPercentage || 0).toFixed(2)}%`}
          tone="orange"
          loading={summaryLoading}
          animate={summaryReady}
        />
        <TrendSummaryBox
          label="BUFFER AVG"
          value={`${Number(footerSummary.bufferPercentage || 0).toFixed(2)}%`}
          tone={
            Number(footerSummary.bufferPercentage || 0) < 0 ? "red" : "green"
          }
          loading={summaryLoading}
          animate={summaryReady}
        />
      </div>

      <WorkforceHiringTrendDetailsModal
        open={trendModalOpen}
        onClose={() => setTrendModalOpen(false)}
        trendWeeks={displayTrendWeeks}
        trends={trends}
        trendDetails={trendDetails}
        trendSummary={footerSummary}
        trendMeta={trendMeta}
      />
    </section>
  );
}

export default function WorkforceHiringOverviewCharts() {
  return (
    <section className="grid grid-cols-1 items-stretch gap-4 2xl:grid-cols-12">
      <div className="2xl:col-span-4">
        <HiringFunnelCard />
      </div>
      <div className="2xl:col-span-3">
        <AttritionBetweenStagesCard />
      </div>
      <div className="2xl:col-span-5">
        <SixWeekTrendsCard />
      </div>
    </section>
  );
}