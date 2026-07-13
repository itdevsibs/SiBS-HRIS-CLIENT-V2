import { useWorkforceHiringView } from "../../../services/context/WorkforceHiringContextAdapter";
import TrendSvg from "./shared/TrendSvg";
import { SmallTd, SmallTh } from "./shared/TableCells";
import { HiringFunnelCard } from "./WorkforceHiringOverviewPipeline";

function Legend({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-[3px] w-[18px] rounded-full ${color}`} />
      {label}
    </span>
  );
}

function TrendSummaryBox({ label, value, percent, className }) {
  return (
    <div className="min-h-[58px] rounded-lg border border-slate-200 p-2 text-center">
      <span className="block text-xs font-semibold text-slate-700">
        {label}
      </span>
      <strong className={`block text-xl font-bold ${className}`}>
        {value}
      </strong>
      {percent ? (
        <b className={`block text-[13px] font-semibold ${className}`}>
          {percent}
        </b>
      ) : null}
    </div>
  );
}

function AttritionBetweenStagesCard() {
  const {
    overview: { attritionStages, summary },
  } = useWorkforceHiringView();

  return (
    <div className="min-h-[330px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-base font-bold uppercase text-sibs-primary-90">
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
              <SmallTd className="text-red-600">{row.count}</SmallTd>
              <SmallTd>{row.percentage.toFixed(2)}%</SmallTd>
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

      <div className="mt-5 grid h-[54px] grid-cols-[1fr_70px_70px] items-center rounded-xl bg-slate-50 px-3.5 text-xs font-bold">
        <span>Total Attrition (6 weeks)</span>
        <strong className="text-center text-lg font-bold text-red-600">
          {summary.attrition}
        </strong>
        <b className="text-center text-lg font-bold text-red-600">
          {summary.attritionPercentage.toFixed(2)}%
        </b>
      </div>
    </div>
  );
}

function SixWeekTrendsCard() {
  const {
    overview: { summary, trends, trendWeeks },
  } = useWorkforceHiringView();

  return (
    <div className="min-h-[330px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-base font-bold uppercase text-sibs-primary-90">
        6-Week Trends
      </h3>

      <div className="flex flex-wrap justify-center gap-5 text-[11px] font-semibold text-slate-700">
        <Legend color="bg-blue-600" label="Absenteeism %" />
        <Legend color="bg-red-600" label="Attrition %" />
        <Legend color="bg-green-600" label="Buffer %" />
      </div>

      <TrendSvg weeks={trendWeeks} trends={trends} />

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <TrendSummaryBox
          label="Absenteeism"
          value={summary.absenteeism}
          percent={`${summary.absenteeismPercentage.toFixed(2)}%`}
          className="text-sibs-primary-80"
        />

        <TrendSummaryBox
          label="Attrition"
          value={summary.attrition}
          percent={`${summary.attritionPercentage.toFixed(2)}%`}
          className="text-red-600"
        />

        <TrendSummaryBox
          label="Buffer % (vs Required HC)"
          value={`${summary.bufferPercentage.toFixed(2)}%`}
          className="text-green-600"
        />
      </div>
    </div>
  );
}

export default function WorkforceHiringOverviewCharts() {
  return (
    <section className="mb-4 grid grid-cols-1 gap-4 2xl:grid-cols-[1.15fr_0.9fr_1.3fr]">
      <HiringFunnelCard />
      <AttritionBetweenStagesCard />
      <SixWeekTrendsCard />
    </section>
  );
}
