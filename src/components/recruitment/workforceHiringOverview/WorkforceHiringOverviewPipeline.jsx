import { useEffect, useMemo, useState } from "react";
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

function useAnimatedNumber(value, duration = 850) {
  const meta = useMemo(() => parseAnimatedValue(value), [value]);

  const [displayValue, setDisplayValue] = useState(() =>
    formatAnimatedValue(0, meta),
  );

  useEffect(() => {
    if (!meta.isNumeric) {
      setDisplayValue(meta.raw);
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
  }, [duration, meta]);

  return displayValue;
}

function AnimatedNumber({ value, className = "" }) {
  const displayValue = useAnimatedNumber(value);

  return <span className={className}>{displayValue}</span>;
}

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
                  <AnimatedNumber
                    value={stage.count}
                    className="text-[30px] font-bold leading-none"
                  />
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
            <AnimatedNumber
              value={formatOverviewNumber(summary.leadsToInterview)}
            />
          </strong>

          <div className="mx-2 my-2 h-px bg-slate-200" />

          <span className="block text-xs font-medium">
            Accepted JO to Leads Rate
          </span>

          <b className="block text-lg font-bold">
            <AnimatedNumber value={`${summary.hiringRate.toFixed(1)}%`} />
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
    <div className="flex h-full min-h-[330px] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-bold uppercase text-sibs-primary-90">
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

                <SmallTd className={stage.text}>
                  <AnimatedNumber value={stage.count} />
                </SmallTd>

                <SmallTd>
                  {stage.stepConversion ? (
                    <AnimatedNumber
                      value={`${stage.stepConversion.toFixed(2)}%`}
                    />
                  ) : (
                    "-"
                  )}
                </SmallTd>

                <SmallTd>
                  <AnimatedNumber value={`${stage.cumulative.toFixed(1)}%`} />
                </SmallTd>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-auto grid h-[50px] place-items-center rounded-xl bg-slate-50 text-sm font-bold text-sibs-primary-90">
        <span>
          Hiring Rate (Leads to JO):{" "}
          <AnimatedNumber value={`${summary.hiringRate.toFixed(1)}%`} />
        </span>
      </div>
    </div>
  );
}
