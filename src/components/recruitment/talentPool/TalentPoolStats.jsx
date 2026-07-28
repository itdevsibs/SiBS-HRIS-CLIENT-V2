import {
  Ban,
  BriefcaseBusiness,
  ExternalLink,
  RefreshCcw,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { useTalentPool } from "../../../services/context/TalentPoolContext";

function StatCard({
  title,
  value,
  icon,
  description,
  labelClassName,
  valueClassName,
  iconClassName,
}) {
  const IconComponent = icon;

  return (
    <article className="sibs-metric-card overflow-hidden">
      <div className="flex h-full items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-[10px] font-extrabold uppercase tracking-normal ${labelClassName}`}
          >
            {title}
          </p>

          <p
            className={`mt-2.5 truncate text-[30px] font-extrabold leading-none tabular-nums tracking-normal ${valueClassName}`}
          >
            {value ?? 0}
          </p>

          <p className="mt-1.5 line-clamp-2 text-xs font-bold leading-4 text-[#667085]">
            {description}
          </p>
        </div>

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconClassName}`}
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
          labelClassName="text-[#667085]"
          valueClassName="text-[#042C51]"
          iconClassName="bg-[#E9F0FC] text-[#042C51]"
        />
        <StatCard
          title="Silver Pool"
          value={stats.silverPool}
          icon={UserCheck}
          description="Passed, no opening"
          labelClassName="text-blue-600"
          valueClassName="text-blue-700"
          iconClassName="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="Recyclable"
          value={stats.recyclable}
          icon={RefreshCcw}
          description="Can be reconsidered"
          labelClassName="text-amber-600"
          valueClassName="text-amber-700"
          iconClassName="bg-amber-50 text-amber-700"
        />
        <StatCard
          title="Do Not Reprocess"
          value={stats.doNotReprocess}
          icon={Ban}
          description="Not fit"
          labelClassName="text-red-600"
          valueClassName="text-red-700"
          iconClassName="bg-red-50 text-red-700"
        />
        <StatCard
          title="Hired / Active"
          value={stats.hiredActive}
          icon={BriefcaseBusiness}
          description="Converted"
          labelClassName="text-emerald-600"
          valueClassName="text-emerald-700"
          iconClassName="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Public Entries"
          value={stats.publicSubmissions}
          icon={ExternalLink}
          description="From outside form"
          labelClassName="text-indigo-600"
          valueClassName="text-indigo-700"
          iconClassName="bg-indigo-50 text-indigo-700"
        />
      </div>
    </section>
  );
}
