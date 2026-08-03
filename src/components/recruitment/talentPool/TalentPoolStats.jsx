import {
  Ban,
  BriefcaseBusiness,
  ExternalLink,
  RefreshCcw,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { useTalentPool } from "@/services/context/TalentPoolContext";

function StatCard({
  title,
  value,
  icon,
  description,
  tone = "navy",
}) {
  const IconComponent = icon;

  return (
    <article className="sibs-metric-card overflow-hidden">
      <div className="flex h-full items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-[10px] font-extrabold uppercase tracking-normal sibs-tone-${tone}-label`}
          >
            {title}
          </p>

          <p
            className={`mt-2.5 truncate text-[30px] font-extrabold leading-none tabular-nums tracking-normal sibs-tone-${tone}-label`}
          >
            {value ?? 0}
          </p>

          <p className="mt-1.5 line-clamp-2 text-xs font-bold leading-4 text-[#667085]">
            {description}
          </p>
        </div>

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sibs-tone-${tone}-icon`}
        >
          <IconComponent size={17} strokeWidth={2} />
        </span>
      </div>
    </article>
  );
}

export default function TalentPoolStats() {
  const { stats } = useTalentPool();

  return (
    <section aria-labelledby="talent-pool-summary-title">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          title="Total Candidates"
          value={stats.total}
          icon={UsersRound}
          description="Database profiles"
          tone="navy"
        />
        <StatCard
          title="Silver Pool"
          value={stats.silverPool}
          icon={UserCheck}
          description="Passed, no opening"
          tone="indigo"
        />
        <StatCard
          title="Recyclable"
          value={stats.recyclable}
          icon={RefreshCcw}
          description="Can be reconsidered"
          tone="amber"
        />
        <StatCard
          title="Do Not Reprocess"
          value={stats.doNotReprocess}
          icon={Ban}
          description="Not fit"
          tone="red"
        />
        <StatCard
          title="Hired / Active"
          value={stats.hiredActive}
          icon={BriefcaseBusiness}
          description="Converted"
          tone="green"
        />
        <StatCard
          title="Public Entries"
          value={stats.publicSubmissions}
          icon={ExternalLink}
          description="From outside form"
          tone="indigo"
        />
      </div>
    </section>
  );
}
