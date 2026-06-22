import React from "react";
import { Activity, ReceiptText, UsersRound } from "lucide-react";
import { useSourcingAnalytics } from "../../../services/context/SourcingContext";
function formatCurrency(value) {
  const amount = Number(value || 0);

  return amount.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function VolumeBar({ label, value, max, delay = 0 }) {
  const percentage = max > 0 ? Math.round((Number(value || 0) / max) * 100) : 0;

  return (
    <div className="sibs-page-card-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="truncate text-sm font-bold text-[#344054]">{label}</p>

        <p className="shrink-0 text-sm font-bold text-sibs-primary-1">
          {value || 0}
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div
          className="h-full rounded-full bg-sibs-primary-1 transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ConversionBar({ label, value, max, delay = 0 }) {
  const percentage = max > 0 ? Math.round((Number(value || 0) / max) * 100) : 0;

  return (
    <div className="sibs-page-card-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="truncate text-sm font-bold text-[#344054]">{label}</p>

        <p className="shrink-0 text-sm font-bold text-sibs-primary-1">
          {Number(value || 0).toFixed(1)}%
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div
          className="h-full rounded-full bg-sibs-primary-1 transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function CostBar({ label, value, max, delay = 0 }) {
  const percentage = max > 0 ? Math.round((Number(value || 0) / max) * 100) : 0;

  return (
    <div className="sibs-page-card-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="truncate text-sm font-bold text-[#344054]">{label}</p>

        <p className="shrink-0 text-sm font-bold text-sibs-primary-1">
          {formatCurrency(value)}
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div
          className="h-full rounded-full bg-sibs-primary-1 transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ChartCard({
  title,
  description,
  icon,
  children,
  delay = 0,
}) {
  return (
    <section
      className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#101828]">{title}</h2>

          <p className="text-sm font-medium text-sibs-tertiary-5">
            {description}
          </p>
        </div>

        <div className="shrink-0 text-gray-400">{icon}</div>
      </div>

      <div className="max-h-[420px] space-y-5 overflow-y-auto pr-4">
        {children}
      </div>
    </section>
  );
}

export default function SourcingAnalyticsCharts({ data = [] }) {
  const safeData = Array.isArray(data) ? data : [];

  const maxVolume = Math.max(
    1,
    ...safeData.map((source) => Number(source?.volume || 0)),
  );

  const maxConversion = Math.max(
    1,
    ...safeData.map((source) => Number(source?.conversionRate || 0)),
  );

  const maxCost = Math.max(
    1,
    ...safeData.map((source) => Number(source?.sourceCost || 0)),
  );

  const hasData = safeData.length > 0;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <ChartCard
        title="Applicant Volume per Source"
        description="Counted from public form source answers."
        icon={<UsersRound size={20} />}
        delay={60}
      >
        {hasData ? (
          safeData.map((source, index) => (
            <VolumeBar
              key={source?.id || source?.source || index}
              label={source?.source || "—"}
              value={source?.volume || 0}
              max={maxVolume}
              delay={index * 35}
            />
          ))
        ) : (
          <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-10 text-center text-sm font-bold text-gray-500">
            No source data found.
          </div>
        )}
      </ChartCard>

      <ChartCard
        title="Conversion to Hire"
        description="Hired divided by applicants."
        icon={<Activity size={20} />}
        delay={120}
      >
        {hasData ? (
          safeData.map((source, index) => (
            <ConversionBar
              key={source?.id || source?.source || index}
              label={source?.source || "—"}
              value={source?.conversionRate || 0}
              max={maxConversion}
              delay={index * 35}
            />
          ))
        ) : (
          <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-10 text-center text-sm font-bold text-gray-500">
            No conversion data found.
          </div>
        )}
      </ChartCard>

      <ChartCard
        title="Source Cost"
        description="Total cost tagged per source."
        icon={<ReceiptText size={20} />}
        delay={180}
      >
        {hasData ? (
          safeData.map((source, index) => (
            <CostBar
              key={source?.id || source?.source || index}
              label={source?.source || "—"}
              value={source?.sourceCost || 0}
              max={maxCost}
              delay={index * 35}
            />
          ))
        ) : (
          <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-10 text-center text-sm font-bold text-gray-500">
            No source cost data found.
          </div>
        )}
      </ChartCard>
    </div>
  );
}