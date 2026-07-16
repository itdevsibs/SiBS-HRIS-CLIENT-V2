import { useEffect, useMemo, useState } from "react";
import { useWorkforceHiringView } from "../../../services/context/WorkforceHiringContextAdapter";
import TrendSvg from "./shared/TrendSvg";
import { SmallTd, SmallTh } from "./shared/TableCells";
import { HiringFunnelCard } from "./WorkforceHiringOverviewPipeline";
import { MoveRight } from "lucide-react";
import WorkforceHiringTrendDetailsModal from "../../modals/workforceHiringOverview/WorkforceHiringTrendDetailsModal";

function parseAnimatedValue(value) {
  const cleanValue = String(value ?? "").trim();
  const numericValue = Number(cleanValue.replace(/,/g, "").replace("%", ""));

  return {
    raw: cleanValue,
    number: Number.isFinite(numericValue) ? numericValue : 0,
    isNumeric: Number.isFinite(numericValue),
    hasPercent: cleanValue.includes("%"),
    hasComma:
      typeof value === "number" ||
      cleanValue.includes(",") ||
      Math.abs(numericValue) >= 1000,
    decimals: cleanValue.includes(".")
      ? cleanValue.split(".")[1]?.replace("%", "").length || 0
      : 0,
  };
}

function formatAnimatedValue(value, meta) {
  if (!meta.isNumeric) return meta.raw;

  const formattedNumber = meta.hasComma
    ? value.toLocaleString("en-US", {
        minimumFractionDigits: meta.decimals,
        maximumFractionDigits: meta.decimals,
      })
    : value.toFixed(meta.decimals);

  return meta.hasPercent ? `${formattedNumber}%` : formattedNumber;
}

function useAnimatedNumber(value, enabled = true, duration = 850) {
  const meta = useMemo(() => parseAnimatedValue(value), [value]);

  const [displayValue, setDisplayValue] = useState(() =>
    formatAnimatedValue(0, meta),
  );

  useEffect(() => {
    if (!meta.isNumeric) {
      setDisplayValue(meta.raw);
      return;
    }

    if (!enabled) {
      setDisplayValue(formatAnimatedValue(0, meta));
      return;
    }

    let animationFrameId;
    const startTime = performance.now();
    const startValue = 0;
    const endValue = meta.number;

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + (endValue - startValue) * easedProgress;

      setDisplayValue(formatAnimatedValue(currentValue, meta));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    }

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [duration, enabled, meta]);

  return displayValue;
}

function AnimatedNumber({ value, enabled = true }) {
  const displayValue = useAnimatedNumber(value, enabled);

  return <>{displayValue}</>;
}

function Legend({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-[3px] w-[18px] rounded-full ${color}`} />
      {label}
    </span>
  );
}

function TrendSummaryBox({
  label,
  value,
  percent,
  className,
  loading = false,
  animate = true,
}) {
  return (
    <div className="flex min-h-[58px] flex-col items-center justify-start rounded-lg border border-slate-200 p-2 text-center">
      <span className="block text-xs font-semibold text-slate-700">
        {label}
      </span>

      <div className="flex h-full items-center justify-center">
        {loading ? (
          <strong className="block text-xl font-bold leading-tight text-slate-300">
            —
          </strong>
        ) : (
          <strong
            className={`block text-xl font-bold leading-tight ${className}`}
          >
            <AnimatedNumber value={value} enabled={animate} />
          </strong>
        )}
      </div>

      {percent ? (
        loading ? (
          <b className="block text-[13px] font-semibold leading-tight text-slate-300">
            —
          </b>
        ) : (
          <b
            className={`block text-[13px] font-semibold leading-tight ${className}`}
          >
            <AnimatedNumber value={percent} enabled={animate} />
          </b>
        )
      ) : null}
    </div>
  );
}

function getTrendWeekNumberRange(selectedWeek) {
  if (!selectedWeek || typeof selectedWeek !== "object") return "";

  const weekNumber = Number(
    selectedWeek.weekNumber ||
      selectedWeek.week_number ||
      selectedWeek.week ||
      0,
  );

  const year = Number(selectedWeek.year || selectedWeek.weekYear || 0);

  if (!Number.isFinite(weekNumber) || weekNumber <= 0) return "";

  const startWeek = Math.max(1, weekNumber - 5);
  const endWeek = weekNumber;

  return year
    ? `Week ${startWeek} - Week ${endWeek}, ${year}`
    : `Week ${startWeek} - Week ${endWeek}`;
}

function getTrendWeekLabels(selectedWeek, fallbackWeeks = []) {
  if (!selectedWeek || typeof selectedWeek !== "object") {
    return fallbackWeeks;
  }

  const weekNumber = Number(
    selectedWeek.weekNumber ||
      selectedWeek.week_number ||
      selectedWeek.week ||
      0,
  );

  if (!Number.isFinite(weekNumber) || weekNumber <= 0) {
    return fallbackWeeks; 
  }

  const startWeek = Math.max(1, weekNumber - 5);

  return Array.from({ length: 6 }, (_, index) => `Wk ${startWeek + index}`);
}

function getTrendAnimationKey(trends, trendWeeks) {
  return JSON.stringify({
    weeks: trendWeeks || [],
    absenteeism: trends?.absenteeism || [],
    attrition: trends?.attrition || [],
    buffer: trends?.buffer || [],
  });
}

function AttritionBetweenStagesCard() {
  const {
    overview: { attritionStages, summary },
  } = useWorkforceHiringView();

  return (
    <div className="flex h-full min-h-[330px] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-bold uppercase text-sibs-primary-90">
        Attrition Between Stages
      </h3>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <SmallTh className="text-left">From - To</SmallTh>
            <SmallTh>Attrition Count</SmallTh>
            <SmallTh>Attrition %</SmallTh>
            <SmallTh />
          </tr>
        </thead>

        <tbody>
          {attritionStages.map((row) => (
            <tr key={row.fromTo}>
              <SmallTd className="text-left">{row.fromTo}</SmallTd>

              <SmallTd className="text-red-600">
                <AnimatedNumber value={row.count} />
              </SmallTd>

              <SmallTd>
                <AnimatedNumber value={`${row.percentage.toFixed(2)}%`} />
              </SmallTd>

              <SmallTd>
                <div className="h-1.5 w-[58px] overflow-hidden rounded-full bg-red-100">
                  <span
                    className="block h-full rounded-full bg-red-600"
                    style={{ width: row.width }}
                  />
                </div>
              </SmallTd>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-auto grid h-[54px] grid-cols-[1fr_70px_70px] items-center rounded-xl bg-slate-50 px-3.5 text-xs font-bold">
        <span>Total Attrition (6 weeks)</span>

        <strong className="text-center text-lg font-bold text-red-600">
          <AnimatedNumber value={summary.attrition} />
        </strong>

        <b className="text-center text-lg font-bold text-red-600">
          <AnimatedNumber
            value={`${summary.attritionPercentage.toFixed(2)}%`}
          />
        </b>
      </div>
    </div>
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

  const footerSummary = trendSummary || summary;
  const trendRangeLabel = getTrendWeekNumberRange(filters?.selectedWeek);

  const displayTrendWeeks = getTrendWeekLabels(
    filters?.selectedWeek,
    trendWeeks,
  );

  const trendAnimationKey = useMemo(
    () => getTrendAnimationKey(trends, trendWeeks),
    [trends, trendWeeks],
  );

  const [summaryReady, setSummaryReady] = useState(false);

  useEffect(() => {
    setSummaryReady(false);

    if (trendsLoading || trendsError) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setSummaryReady(true);
    }, 1100);

    return () => {
      window.clearTimeout(timer);
    };
  }, [trendAnimationKey, trendsLoading, trendsError]);

  const summaryLoading = trendsLoading || Boolean(trendsError) || !summaryReady;

  return (
    <div className="flex h-full min-h-[330px] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold uppercase tracking-tight text-sibs-primary-90">
            6-Week Trends{" "}
            {trendRangeLabel ? (
              <span className="text-lg font-bold normal-case text-slate-500">
                ({trendRangeLabel})
              </span>
            ) : null}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setTrendModalOpen(true)}
          className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-80 shadow-sm transition hover:border-sibs-primary-40 hover:bg-white hover:text-sibs-primary-90 active:translate-y-[1px]"
        >
          <span>View Trend Details</span>
          <MoveRight className="h-3.5 w-3.5" strokeWidth={2.4} />
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-5 text-[11px] font-semibold text-slate-700">
        <Legend color="bg-blue-600" label="Absenteeism %" />
        <Legend color="bg-red-600" label="Attrition %" />
        <Legend color="bg-green-600" label="Buffer %" />
      </div>

      <div className="flex-1">
        {trendsLoading ? (
          <div className="flex min-h-[210px] items-center justify-center text-sm font-semibold text-slate-500">
            Loading 6-week trends...
          </div>
        ) : trendsError ? (
          <div className="flex min-h-[210px] items-center justify-center rounded-xl border border-red-100 bg-red-50 px-4 text-center text-sm font-semibold text-red-600">
            {trendsError}
          </div>
        ) : (
          <TrendSvg weeks={displayTrendWeeks} trends={trends} />
        )}
      </div>

      <div className="mt-auto grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <TrendSummaryBox
          label="Absenteeism AVG"
          value={footerSummary.absenteeism}
          percent={`${footerSummary.absenteeismPercentage.toFixed(2)}%`}
          className="text-blue-600"
          loading={summaryLoading}
          animate={summaryReady}
        />

        <TrendSummaryBox
          label="Attrition AVG"
          value={footerSummary.attrition}
          percent={`${footerSummary.attritionPercentage.toFixed(2)}%`}
          className="text-red-600"
          loading={summaryLoading}
          animate={summaryReady}
        />

        <TrendSummaryBox
          label="Buffer % AVG"
          value={`${footerSummary.bufferPercentage.toFixed(2)}%`}
          className="text-green-600"
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
    </div>
  );
}

export default function WorkforceHiringOverviewCharts() {
  return (
    <section className="mb-4 grid grid-cols-1 items-stretch gap-4 2xl:grid-cols-[1.15fr_0.9fr_1.3fr]">
      <HiringFunnelCard />
      <AttritionBetweenStagesCard />
      <SixWeekTrendsCard />
    </section>
  );
}
