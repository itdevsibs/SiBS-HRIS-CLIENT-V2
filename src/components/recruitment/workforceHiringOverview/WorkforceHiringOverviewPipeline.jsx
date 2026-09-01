import {
  ArrowRight,
  FileText,
  Handshake,
  Laptop,
  Rocket,
  Users,
} from "lucide-react";
import { useWorkforceHiringView } from "../../../services/context/WorkforceHiringContextAdapter";
import { formatOverviewNumber } from "../../../lib/utils/workforceHiringOverview/workforceHiringOverviewHelpers";
import AnimatedNumber from "./shared/AnimatedNumber";
import FunnelShape from "./shared/FunnelShape";
import { SmallTd, SmallTh } from "./shared/TableCells";

const PIPELINE_ICONS = {
  fileText: FileText,
  handshake: Handshake,
  laptop: Laptop,
  rocket: Rocket,
  users: Users,
};

const STAGE_TONES = [
  "border-blue-100 bg-[#E9F0FC] text-[#042C51]",
  "border-indigo-100 bg-indigo-50 text-indigo-700",
  "border-cyan-100 bg-cyan-50 text-cyan-700",
  "border-amber-100 bg-amber-50 text-amber-700",
  "border-emerald-100 bg-emerald-50 text-emerald-700",
];

export function WorkforceHiringOverviewPipelineStrip() {
  const {
    overview: { pipeline, summary },
  } = useWorkforceHiringView();

  return (
    <section className="sibs-page-card-in sibs-card overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-3.5 shadow-sm 2xl:p-5">
      <div className="flex flex-col gap-3 2xl:gap-4 2xl:flex-row 2xl:items-center">
        <div className="grid min-w-0 flex-1 grid-cols-1 items-center gap-2 sm:grid-cols-2 xl:grid-cols-[1fr_20px_1fr_20px_1fr_20px_1fr_20px_1fr] 2xl:grid-cols-[1fr_26px_1fr_26px_1fr_26px_1fr_26px_1fr]">
          {pipeline.map((stage, index) => {
            const StageIcon = PIPELINE_ICONS[stage.iconKey] || Users;
            const tone = STAGE_TONES[index] || STAGE_TONES[0];

            return (
              <div className="contents" key={stage.stage}>
                <article
                  className={`flex min-h-[64px] 2xl:min-h-[78px] items-center gap-2.5 2xl:gap-3 rounded-xl border px-2.5 py-2 2xl:px-3 2xl:py-2.5 ${tone}`}
                >
                  <span className="flex h-7.5 w-7.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full bg-white/80 shadow-sm">
                    <StageIcon className="h-3.5 w-3.5 2xl:h-4.5 2xl:w-4.5" strokeWidth={2.2} />
                  </span>

                  <div className="min-w-0">
                    <p className="truncate sibs-text-micro font-extrabold uppercase tracking-wider opacity-75">
                      {stage.short || stage.stage}
                    </p>
                    <div className="mt-0.5 2xl:mt-1 flex items-baseline gap-1.5 2xl:gap-2">
                      <AnimatedNumber
                        value={stage.count}
                        className="text-lg 2xl:text-xl font-extrabold leading-none tabular-nums"
                      />
                      <span className="rounded bg-white/80 px-1 py-0.5 2xl:px-1.5 sibs-text-micro font-extrabold tabular-nums">
                        {Number(stage.cumulative || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </article>

                {index < pipeline.length - 1 ? (
                  <ArrowRight className="mx-auto hidden h-3.5 w-3.5 text-slate-300 xl:block" />
                ) : null}
              </div>
            );
          })}
        </div>

        <aside className="grid shrink-0 grid-cols-2 gap-3 border-t border-[#E6ECF2] pt-3 2xl:w-[260px] 2xl:border-l 2xl:border-t-0 2xl:pl-5 2xl:pt-0">
          <div>
            <p className="sibs-text-micro font-extrabold uppercase tracking-wider text-[#667085]">
              Leads to Interview
            </p>
            <AnimatedNumber
              value={formatOverviewNumber(summary.leadsToInterview)}
              className="mt-0.5 2xl:mt-1 block text-lg 2xl:text-xl font-extrabold text-[#042C51]"
            />
          </div>
          <div className="text-right">
            <p className="sibs-text-micro font-extrabold uppercase tracking-wider text-[#667085]">
              Hiring Rate
            </p>
            <AnimatedNumber
              value={`${Number(summary.hiringRate || 0).toFixed(1)}%`}
              className="mt-0.5 2xl:mt-1 block text-lg 2xl:text-xl font-extrabold text-[#FF5C28]"
            />
          </div>
        </aside>
      </div>
    </section>
  );
}

export function HiringFunnelCard() {
  const {
    overview: { pipeline, summary },
  } = useWorkforceHiringView();

  return (
    <section className="sibs-page-card-in sibs-card flex h-full min-h-[480px] flex-col rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
      <div>
        <h3 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
          Hiring Funnel
        </h3>
        <p className="mt-0.5 sibs-text-xs font-semibold text-[#667085]">
          Visual stacked funnel depicting active candidate volume and sequential conversion rates.
        </p>
      </div>

      <div className="mt-4 flex min-h-[220px] items-center justify-center rounded-xl border border-[#DDE5EE] bg-[#F8FAFC] px-4 py-5">
        <FunnelShape pipeline={pipeline} />
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-[#DDE5EE] bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <SmallTh className="text-left">Stage</SmallTh>
              <SmallTh>Count</SmallTh>
              <SmallTh>Step Conv</SmallTh>
              <SmallTh>Cum Conv</SmallTh>
            </tr>
          </thead>
          <tbody>
            {pipeline.map((stage) => (
              <tr key={stage.stage}>
                <SmallTd className="text-left font-extrabold text-[#042C51]">
                  {stage.short || stage.stage}
                </SmallTd>
                <SmallTd className="font-extrabold text-[#042C51]">
                  <AnimatedNumber value={stage.count} />
                </SmallTd>
                <SmallTd>
                  {stage.stepConversion ? (
                    <AnimatedNumber
                      value={`${Number(stage.stepConversion || 0).toFixed(1)}%`}
                    />
                  ) : (
                    "—"
                  )}
                </SmallTd>
                <SmallTd className="font-extrabold text-[#FF5C28]">
                  <AnimatedNumber
                    value={`${Number(stage.cumulative || 0).toFixed(1)}%`}
                  />
                </SmallTd>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-auto border-t border-[#E6ECF2] pt-3 text-center text-[10px] font-bold text-[#042C51]">
        Hiring Rate (Leads to JO):{" "}
        <AnimatedNumber
          value={`${Number(summary.hiringRate || 0).toFixed(1)}%`}
          className="text-xs font-black text-[#FF5C28]"
        />
      </div>
    </section>
  );
}
