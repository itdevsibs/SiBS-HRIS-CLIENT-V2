import {
  UsersRound,
  UserCheck,
  RefreshCcw,
  Ban,
  BriefcaseBusiness,
  ExternalLink,
} from "lucide-react";
import { useTalentPool } from "../../../services/context/TalentPoolContext";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  valueClassName = "text-sibs-primary-1",
}) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
            {title}
          </p>

          <p
            className={`mt-3 truncate text-3xl font-extrabold ${valueClassName}`}
          >
            {value ?? 0}
          </p>

          {description && (
            <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function TalentPoolStats() {
  const { stats, isLoading } = useTalentPool();

  return (
    <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-[#101828]">
          Talent Pool Summary
        </h2>

        {isLoading && (
          <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
            Loading database data...
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard
          title="Total Candidates"
          value={stats.total}
          icon={UsersRound}
          description="Database profiles"
        />
        <StatCard
          title="Silver Pool"
          value={stats.silverPool}
          icon={UserCheck}
          description="Passed, no opening"
        />
        <StatCard
          title="Recyclable"
          value={stats.recyclable}
          icon={RefreshCcw}
          description="Can be reconsidered"
        />
        <StatCard
          title="Do Not Reprocess"
          value={stats.doNotReprocess}
          icon={Ban}
          description="Not fit"
        />
        <StatCard
          title="Hired / Active"
          value={stats.hiredActive}
          icon={BriefcaseBusiness}
          description="Converted"
          valueClassName="text-emerald-600"
        />
        <StatCard
          title="Public Entries"
          value={stats.publicSubmissions}
          icon={ExternalLink}
          description="From outside form"
        />
      </div>
    </section>
  );
}