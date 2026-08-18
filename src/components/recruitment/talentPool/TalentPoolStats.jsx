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
  delay = 0,
}) {
  const IconComponent = icon;

  return (
    <article
      className="sibs-metric-card sibs-page-card-in flex h-[104px] 2xl:h-[116px] min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
        <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
          <div>
            <p
              className={`m-0 truncate sibs-text-micro font-extrabold uppercase sibs-tone-${tone}-label`}
            >
              {title}
            </p>

            <p
              className={`mt-1.5 2xl:mt-2 text-2xl 2xl:text-3xl font-extrabold leading-none tabular-nums sibs-tone-${tone}-label`}
            >
              {value ?? 0}
            </p>
          </div>

          <p className="mt-1 line-clamp-1 truncate sibs-text-micro font-semibold leading-tight text-[#667085]">
            {description}
          </p>
        </div>

        <span
          className={`flex h-7.5 w-7.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-lg 2xl:rounded-xl sibs-tone-${tone}-icon`}
        >
          <IconComponent className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" strokeWidth={2} />
        </span>
      </div>
    </article>
  );
}

export default function TalentPoolStats() {
  const { stats } = useTalentPool();

  return (
    <section aria-labelledby="talent-pool-summary-title">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          title="Total Candidates"
          value={stats.total}
          icon={UsersRound}
          description="Database profiles"
          tone="navy"
          delay={0}
        />
        <StatCard
          title="Silver Pool"
          value={stats.silverPool}
          icon={UserCheck}
          description="Passed, no opening"
          tone="indigo"
          delay={45}
        />
        <StatCard
          title="Recyclable"
          value={stats.recyclable}
          icon={RefreshCcw}
          description="Can be reconsidered"
          tone="amber"
          delay={90}
        />
        <StatCard
          title="Do Not Reprocess"
          value={stats.doNotReprocess}
          icon={Ban}
          description="Not fit"
          tone="red"
          delay={135}
        />
        <StatCard
          title="Hired / Active"
          value={stats.hiredActive}
          icon={BriefcaseBusiness}
          description="Converted"
          tone="green"
          delay={180}
        />
        <StatCard
          title="Public Entries"
          value={stats.publicSubmissions}
          icon={ExternalLink}
          description="From outside form"
          tone="indigo"
          delay={225}
        />
      </div>
    </section>
  );
}
