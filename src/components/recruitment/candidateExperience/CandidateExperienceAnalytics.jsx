import { BarChart3, Sparkles, Star, Tag } from "lucide-react";
import { buildCategoryBreakdown, buildDropOffStageBreakdown, buildRatingDistribution } from "@/lib/utils/candidateExperience/index.js";

function BarList({ rows, emptyText, accent = "bg-sibs-primary-1" }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-sibs-subtle-border bg-sibs-surface p-6 text-center text-xs font-bold text-sibs-tertiary-6">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-3 font-jakarta">
      {rows.slice(0, 6).map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-bold text-sibs-primary-1">{row.label}</span>
            <span className="font-mono font-extrabold text-sibs-primary-1">{row.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-sibs-surface">
            <div
              className={`h-full rounded-full ${accent} transition-all duration-300`}
              style={{ width: `${Math.max(row.value ? 8 : 0, Math.round((row.value / max) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CandidateExperienceAnalytics({ records, metrics }) {
  const stageRows = buildDropOffStageBreakdown(records);
  const categoryRows = buildCategoryBreakdown(records);
  const ratingRows = buildRatingDistribution(records);
  const topStage = stageRows[0]?.label || "No drop-off data";
  const topCategory = categoryRows[0]?.label || "No response category data";

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-4 font-jakarta">
      <Panel icon={BarChart3} title="Drop-offs by Stage" subtitle="Where candidates leave the recruitment journey.">
        <BarList rows={stageRows} emptyText="No drop-off stage data yet." />
      </Panel>

      <Panel icon={Tag} title="Experience Categories" subtitle="Most common reasons and feedback themes.">
        <BarList rows={categoryRows} emptyText="No experience categories yet." accent="bg-sibs-primary-2" />
      </Panel>

      <Panel icon={Star} title="Rating Distribution" subtitle="Candidate and manually recorded feedback ratings.">
        <BarList rows={ratingRows} emptyText="No ratings submitted yet." accent="bg-amber-500" />
      </Panel>

      <section className="relative overflow-hidden rounded-2xl bg-sibs-primary-1 p-5 text-white shadow-sm">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sibs-primary-2/15" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sibs-primary-2">
            <Sparkles size={17} />
            <h3 className="text-xs font-extrabold uppercase tracking-wider">Experience Insight</h3>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/10 p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-sibs-tertiary-9">Primary Drop-off Stage</p>
            <p className="mt-1 text-lg font-extrabold">{topStage}</p>

            <p className="mt-4 text-[10px] font-extrabold uppercase tracking-wider text-sibs-tertiary-9">Top Experience Category</p>
            <p className="mt-1 text-sm font-extrabold text-[#FFB69E]">{topCategory}</p>
          </div>

          <p className="mt-4 text-xs leading-5 text-sibs-tertiary-9">
            {metrics.responsesReceived
              ? `${metrics.responsesReceived} response${metrics.responsesReceived === 1 ? "" : "s"} recorded with an average rating of ${metrics.averageRating}/5.`
              : "Candidate experience insights will populate when survey or manual feedback is recorded."}
          </p>
        </div>
      </section>
    </div>
  );
}

function Panel({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-sibs-subtle-border bg-sibs-card p-5 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-sibs-subtle-border/60 pb-3">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">{title}</h3>
          <p className="mt-1 text-xs font-semibold leading-4 text-[#667085]">{subtitle}</p>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E9F0FC] text-[#042C51]">
          <Icon size={16} strokeWidth={2} />
        </span>
      </div>
      {children}
    </section>
  );
}
