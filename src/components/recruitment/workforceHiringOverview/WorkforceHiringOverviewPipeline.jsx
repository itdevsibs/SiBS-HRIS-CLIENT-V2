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
import FunnelShape from "./shared/FunnelShape";
import { SmallTd, SmallTh } from "./shared/TableCells";

const pipelineIcons = {
  fileText: FileText,
  handshake: Handshake,
  laptop: Laptop,
  rocket: Rocket,
  users: Users,
};

export function WorkforceHiringOverviewPipelineStrip() {
  const {
    overview: { pipeline, summary },
  } = useWorkforceHiringView();

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid min-h-[118px] grid-cols-1 items-center gap-4 xl:grid-cols-[1fr_40px_1fr_40px_1fr_40px_1fr_40px_1fr_220px]">
        {pipeline.map((stage, index) => {
          const StageIcon = pipelineIcons[stage.iconKey] || Users;

          return (
            <div className="contents" key={stage.stage}>
              <div className={`text-center ${stage.text}`}>
                <div className="mb-3 text-sm font-bold text-slate-900">
                  {stage.short}
                </div>

                <div className="flex items-center justify-center gap-2.5">
                  <span className="text-[30px] font-bold leading-none">
                    {stage.count}
                  </span>
                  <StageIcon className="h-8 w-8" strokeWidth={2.4} />
                </div>
              </div>

              {index < pipeline.length - 1 ? (
                <div className="hidden text-center text-slate-400 xl:block">
                  <ArrowRight className="mx-auto h-7 w-7" strokeWidth={2.3} />
                </div>
              ) : null}
            </div>
          );
        })}

        <div className="rounded-lg border border-slate-200 p-3 text-center text-slate-800">
          <h4 className="text-sm font-bold">Leads to Interview</h4>
          <strong className="mt-1 block text-2xl font-bold leading-none">
            {formatOverviewNumber(summary.leadsToInterview)}
          </strong>
          <div className="mx-2 my-2 h-px bg-slate-200" />
          <span className="block text-xs font-medium">
            Accepted JO to Leads Rate
          </span>
          <b className="block text-lg font-bold">
            {summary.hiringRate.toFixed(1)}%
          </b>
        </div>
      </div>
    </section>
  );
}

export function HiringFunnelCard() {
  const {
    overview: { pipeline, summary },
  } = useWorkforceHiringView();

  return (
    <div className="min-h-[330px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-base font-bold uppercase text-sibs-primary-90">
        Hiring Funnel
      </h3>

      <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[170px_1fr]">
        <div className="justify-self-center">
          <FunnelShape pipeline={pipeline} />
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              <SmallTh>Stage</SmallTh>
              <SmallTh>Count</SmallTh>
              <SmallTh>Step Conversion</SmallTh>
              <SmallTh>Cumulative Conversion %</SmallTh>
            </tr>
          </thead>

          <tbody>
            {pipeline.map((stage) => (
              <tr key={stage.stage}>
                <SmallTd className={`text-left ${stage.text}`}>
                  {stage.stage}
                </SmallTd>
                <SmallTd className={stage.text}>{stage.count}</SmallTd>
                <SmallTd>
                  {stage.stepConversion
                    ? `${stage.stepConversion.toFixed(2)}%`
                    : "-"}
                </SmallTd>
                <SmallTd>{stage.cumulative.toFixed(1)}%</SmallTd>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 grid h-[50px] place-items-center rounded-xl bg-slate-50 text-sm font-bold text-sibs-primary-90">
        Hiring Rate (Leads to JO): {summary.hiringRate.toFixed(1)}%
      </div>
    </div>
  );
}
