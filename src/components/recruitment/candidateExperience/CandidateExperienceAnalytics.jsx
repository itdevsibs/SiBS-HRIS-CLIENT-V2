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
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-4 font-jakarta">
      <Panel icon={BarChart3} title="Drop-offs by Stage" subtitle="Where candidates leave the recruitment journey." delay={120}>
        <BarList rows={stageRows} emptyText="No drop-off stage data yet." />
      </Panel>

      <Panel icon={Tag} title="Experience Categories" subtitle="Most common reasons and feedback themes." delay={165}>
        <BarList rows={categoryRows} emptyText="No experience categories yet." accent="bg-sibs-primary-2" />
      </Panel>

      <Panel icon={Star} title="Rating Distribution" subtitle="Candidate and manually recorded feedback ratings." delay={210}>
        <BarList rows={ratingRows} emptyText="No ratings submitted yet." accent="bg-amber-500" />
      </Panel>

      <section
        className="sibs-page-card-in relative overflow-hidden rounded-xl 2xl:rounded-2xl bg-[#042C51] p-3.5 sm:p-4 2xl:p-5 text-white shadow-sm font-jakarta"
        style={{ animationDelay: "255ms", animationFillMode: "both" }}
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#FF5C28]/15" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[#FF5C28]">
            <Sparkles size={16} />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Experience Insight</h3>
          </div>

          <div className="mt-3 rounded-lg 2xl:rounded-xl border border-white/10 bg-white/10 p-3 2xl:p-3.5">
            <p className="text-[9px] 2xl:text-[10px] font-black uppercase tracking-wider text-blue-200">Primary Drop-off Stage</p>
            <p className="mt-0.5 text-base 2xl:text-lg font-extrabold text-white">{topStage}</p>

            <p className="mt-3 text-[9px] 2xl:text-[10px] font-black uppercase tracking-wider text-blue-200">Top Experience Category</p>
            <p className="mt-0.5 text-xs 2xl:text-sm font-extrabold text-[#FFB69E]">{topCategory}</p>
          </div>

          <p className="mt-3 sibs-text-xs leading-relaxed text-blue-200">
            {metrics.responsesReceived
              ? `${metrics.responsesReceived} response${metrics.responsesReceived === 1 ? "" : "s"} recorded with an average rating of ${metrics.averageRating}/5.`
              : "Candidate experience insights will populate when survey or manual feedback is recorded."}
          </p>
        </div>
      </section>
    </div>
  );
}

function Panel({ icon: Icon, title, subtitle, delay = 120, children }) {
  return (
    <section
      className="sibs-page-card-in rounded-xl 2xl:rounded-2xl border border-sibs-border bg-white p-3.5 sm:p-4 2xl:p-5 shadow-sm transition-all duration-200 hover:shadow-md font-jakarta"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="mb-3 flex items-start justify-between gap-3 border-b border-sibs-border pb-2.5">
        <div>
          <h3 className="sibs-card-title">{title}</h3>
          <p className="sibs-card-subtitle">{subtitle}</p>
        </div>
        <span className="flex h-7.5 w-7.5 2xl:h-8 2xl:w-8 shrink-0 items-center justify-center rounded-lg bg-[#E9F0FC] text-sibs-navy">
          <Icon size={15} strokeWidth={2} />
        </span>
      </div>
      {children}
    </section>
  );
}
