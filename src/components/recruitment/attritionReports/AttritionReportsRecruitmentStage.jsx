import React from "react";
import { AlertCircle, ArrowRight, GitCommit, X } from "lucide-react";
import { Skeleton } from "@/components/ui";

export default function AttritionReportsRecruitmentStage({ data, loading = false }) {
  if (loading) {
    return (
      <section className="sibs-page-card-in rounded-[14px] border border-sibs-border bg-white p-4 shadow-sm font-jakarta">
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-4 w-72 mb-4" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-20 rounded-lg border border-sibs-border bg-slate-50 p-3">
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const stageData = data?.recruitmentStageAttrition || {};
  const stages = stageData.stages || [];
  const aggregateLoss = stageData.aggregateLoss ?? 0;

  return (
    <section
      className="sibs-page-card-in rounded-[14px] border border-sibs-border bg-white p-4 sm:p-5 shadow-sm font-jakarta"
      style={{ animationDelay: "300ms", animationFillMode: "both" }}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
            Attrition Between Recruitment Stages
          </h3>
          <p className="mt-0.5 sibs-text-xs font-semibold text-sibs-muted">
            Identifies candidate drop-off metrics between consecutive milestone stages.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800 border border-amber-200">
          <AlertCircle className="h-3 w-3 shrink-0 text-amber-600" />
          <span>Stage losses represent hiring pipeline drop-offs, not employee resignations</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stages.map((stage) => {
          const width = Math.min(100, Math.max(0, stage.percentage || 0));
          return (
            <article
              key={stage.fromTo}
              className="flex flex-col justify-between rounded-xl border border-sibs-border bg-sibs-surface p-3 shadow-2xs transition hover:border-slate-300"
            >
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-800">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span className="truncate">{stage.fromTo}</span>
                </div>

                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className="text-[10px] font-extrabold text-sibs-muted uppercase">
                    Loss Count
                  </span>
                  <span className="font-mono text-sm font-black text-rose-600">
                    {Number(stage.lossCount || 0).toLocaleString()}
                  </span>
                </div>

                <div className="mt-0.5 flex items-baseline justify-between">
                  <span className="text-[10px] font-extrabold text-sibs-muted uppercase">
                    Drop-Off Rate
                  </span>
                  <span className="font-mono text-xs font-black text-rose-600">
                    {Number(stage.percentage || 0).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                <div
                  className="h-full rounded-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${width}%` }}
                />
              </div>
            </article>
          );
        })}
      </div>

      {/* Aggregate stage loss footer bar */}
      <div className="mt-3 flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/70 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <X className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-wider text-rose-600">
              Total Recruitment Drop-Offs
            </p>
            <p className="text-[11px] font-black text-rose-950">
              Aggregate Pipeline Loss
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-base font-black leading-none text-rose-600 font-mono">
            {Number(aggregateLoss).toLocaleString()}
          </span>
          <span className="block text-[9px] font-extrabold text-rose-500">
            candidates across 5 milestones
          </span>
        </div>
      </div>
    </section>
  );
}
