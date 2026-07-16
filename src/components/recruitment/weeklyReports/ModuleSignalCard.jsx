import { formatNumber } from "../../../lib/utils/weeklyReports/weeklyReportsHelpers.js";

export default function ModuleSignalCard({ item, delay = 0 }) {
  const Icon = item.icon;

  return (
    <div
      className="sibs-page-card-in group rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
            {item.title}
          </p>

          <p
            className={`mt-3 truncate text-3xl font-extrabold ${
              item.hasRisk ? "text-red-600" : "text-sibs-primary-1"
            }`}
          >
            {formatNumber(item.value)}
          </p>

          <p
            className={`mt-1 truncate text-xs font-semibold ${
              item.hasRisk ? "text-red-600" : "text-sibs-tertiary-5"
            }`}
          >
            {item.description}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 ${
            item.hasRisk
              ? "bg-red-50 text-red-600"
              : "bg-[#F2F6FA] text-sibs-primary-1"
          }`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
