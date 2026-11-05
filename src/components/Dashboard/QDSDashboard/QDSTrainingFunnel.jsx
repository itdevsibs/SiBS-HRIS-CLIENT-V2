import React from "react";
import {
  Compass,
  BookOpen,
  Layers,
  Headphones,
  Award,
  ChevronRight,
  UserX,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { Skeleton } from "@/components/ui";

/**
 * QDSTrainingFunnel Component
 * Tier 3 Strategic Analytics (right column of dual-column layout).
 * Visualizes candidate progression from Day 1 NHO through FST/PST to floor handover.
 */
export default function QDSTrainingFunnel({
  funnel = {},
  loading = false,
  className = "",
}) {
  const nhoCount = Number(funnel.nho || 0);
  const fstCount = Number(funnel.fst || 0);
  const pstCount = Number(funnel.pst || 0);
  const nestingCount = Number(funnel.nesting || 0);
  const floorReadyCount = Number(funnel.floorReady || 0);
  const dropouts = Number(funnel.dropouts || 0);

  const activeTrainees =
    funnel.activeTrainees !== undefined
      ? Number(funnel.activeTrainees)
      : nhoCount + fstCount + pstCount + nestingCount + floorReadyCount;

  const totalCohort = activeTrainees + dropouts;
  const conversionRate =
    funnel.conversionRate !== undefined
      ? Number(funnel.conversionRate)
      : totalCohort > 0
      ? Math.round(((totalCohort - dropouts) / totalCohort) * 100)
      : 0;

  const attritionRate =
    totalCohort > 0 ? Math.round((dropouts / totalCohort) * 100) : 0;

  const stages = [
    {
      id: "nho",
      step: "01",
      name: "Day 1 NHO",
      subtitle: "Orientation, Onboarding & Compliance",
      count: nhoCount,
      icon: Compass,
      tone: "navy",
      accentBg: "bg-blue-50 text-sibs-navy border-blue-200",
    },
    {
      id: "fst",
      step: "02",
      name: "Foundational (FST)",
      subtitle: "Core Competency & Communication",
      count: fstCount,
      icon: BookOpen,
      tone: "orange",
      accentBg: "bg-orange-50 text-sibs-orange border-orange-200",
    },
    {
      id: "pst",
      step: "03",
      name: "Product-Specific (PST)",
      subtitle: "Account Workflows & System Tools",
      count: pstCount,
      icon: Layers,
      tone: "indigo",
      accentBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
      id: "nesting",
      step: "04",
      name: "Day 30 Nesting",
      subtitle: "Simulated Floor Queue & Live Auditing",
      count: nestingCount,
      icon: Headphones,
      tone: "amber",
      accentBg: "bg-amber-50 text-amber-800 border-amber-200",
    },
    {
      id: "floor-ready",
      step: "05",
      name: "Floor Handover",
      subtitle: "Production Endorsed & Verified",
      count: floorReadyCount,
      icon: Award,
      tone: "emerald",
      accentBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
  ];

  const maxStageCount = Math.max(
    nhoCount,
    fstCount,
    pstCount,
    nestingCount,
    floorReadyCount,
    1,
  );

  return (
    <div
      className={`sibs-card min-w-0 p-4 sm:p-5 2xl:p-6 font-jakarta rounded-2xl border border-sibs-border bg-white shadow-xs ${className}`.trim()}
    >
      {/* Header with Title & Subtitle */}
      <div className="border-b border-sibs-border pb-4 mb-4">
        <h3 className="sibs-section-title">
          Cohort Training Progression Gateway
        </h3>
        <p className="sibs-section-subtitle">
          Candidate progression from Day 1 NHO orientation through FST/PST certification to floor handover.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Top KPI Metrics Strip */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-4">
            <div className="rounded-xl border border-sibs-border bg-sibs-surface p-3 text-center">
              <span className="block sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-muted">
                Active in Pipeline
              </span>
              <span className="font-heading text-lg sm:text-xl font-extrabold tabular-nums text-sibs-navy mt-0.5 block">
                {activeTrainees.toLocaleString()}
              </span>
            </div>

            <div className="rounded-xl border border-sibs-border bg-sibs-surface p-3 text-center">
              <span className="block sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-muted">
                Attrition / Drop-outs
              </span>
              <span className="font-heading text-lg sm:text-xl font-extrabold tabular-nums text-rose-600 mt-0.5 block">
                {dropouts.toLocaleString()} <span className="text-xs font-semibold text-rose-500">({attritionRate}%)</span>
              </span>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-center">
              <span className="block sibs-text-micro font-extrabold uppercase tracking-wide text-emerald-800">
                Conversion Rate
              </span>
              <span className="font-heading text-lg sm:text-xl font-extrabold tabular-nums text-emerald-700 mt-0.5 block">
                {conversionRate}%
              </span>
            </div>
          </div>

          {/* Stepper / Funnel Stage List */}
          <div className="space-y-2">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const fillPercentage = Math.round((stage.count / maxStageCount) * 100);

              return (
                <div
                  key={stage.id}
                  className="group relative overflow-hidden rounded-xl border border-sibs-border bg-white p-3 transition hover:border-sibs-orange/40 hover:bg-sibs-surface/30 shadow-2xs"
                >
                  {/* Subtle background progression fill */}
                  <div
                    className="absolute inset-y-0 left-0 bg-sibs-surface/80 transition-all duration-500 pointer-events-none"
                    style={{ width: `${Math.max(fillPercentage, 4)}%` }}
                  />

                  <div className="relative z-10 flex items-center justify-between gap-3">
                    {/* Left: Step pill, Icon, Stage Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-white shadow-xs">
                        <Icon className="h-4 w-4 text-sibs-navy" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-sibs-muted">
                            {stage.step}
                          </span>
                          <h4 className="font-heading text-xs sm:text-sm font-bold text-sibs-navy truncate">
                            {stage.name}
                          </h4>
                        </div>
                        <p className="sibs-text-micro text-sibs-muted truncate mt-0.5 font-medium">
                          {stage.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Right: Headcount Figure */}
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="text-right">
                        <span className="font-heading text-base sm:text-lg font-extrabold tabular-nums text-sibs-navy block">
                          {stage.count.toLocaleString()}
                        </span>
                        <span className="sibs-text-micro text-sibs-muted font-semibold block">
                          {stage.count === 1 ? "candidate" : "candidates"}
                        </span>
                      </div>
                      {index < stages.length - 1 && (
                        <ChevronRight className="h-3.5 w-3.5 text-sibs-border-subtle hidden sm:block" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conversion Callout Banner */}
          <div className="mt-4 rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-indigo-50/80 p-3.5 font-jakarta">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sibs-navy text-white shadow-2xs">
                <ShieldCheck className="h-4.5 w-4.5 text-sibs-orange" />
              </div>
              <div className="min-w-0 flex-1">
                <h5 className="font-heading text-xs sm:text-sm font-bold text-sibs-navy">
                  Operations Readiness Gateway ({conversionRate}% Handover)
                </h5>
                <p className="sibs-text-micro font-medium text-sibs-navy/80 leading-relaxed mt-0.5">
                  Trainees completing Day 30 Nesting and qualifying for Floor Handover are formally endorsed for production rosters. Quality Development ensures zero critical calibration defects prior to manager sign-off.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
