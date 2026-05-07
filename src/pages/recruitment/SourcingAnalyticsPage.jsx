import React, { useMemo, useState } from "react";
import Header from "../../components/layout/Header";
import {
  BarChart3,
  Search,
  Eye,
  UsersRound,
  UserCheck,
  TrendingUp,
  MousePointerClick,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Target,
  Activity,
} from "lucide-react";

const sourcingData = [
  {
    id: 1,
    source: "JobStreet",
    sourceType: "Job Board",
    volume: 120,
    screened: 78,
    interviewed: 38,
    offered: 14,
    hired: 15,
    conversionRate: 12.5,
    topRole: "CSR",
    topAccount: "SIBS Operations",
    owner: "Maria Reyes",
    costLabel: "Paid Channel",
    lastActivity: "2026-05-06",
    notes:
      "Highest applicant volume. Good for CSR roles but conversion requires screening quality review.",
  },
  {
    id: 2,
    source: "LinkedIn",
    sourceType: "Professional Network",
    volume: 80,
    screened: 52,
    interviewed: 26,
    offered: 10,
    hired: 10,
    conversionRate: 12.5,
    topRole: "System Developer",
    topAccount: "SIBS IT",
    owner: "Kim Domingo",
    costLabel: "Paid Channel",
    lastActivity: "2026-05-05",
    notes:
      "Stronger for specialized and professional roles. Useful for IT and leadership sourcing.",
  },
  {
    id: 3,
    source: "Referral",
    sourceType: "Employee Referral",
    volume: 35,
    screened: 30,
    interviewed: 22,
    offered: 12,
    hired: 9,
    conversionRate: 25.7,
    topRole: "CSR",
    topAccount: "SIBS Operations",
    owner: "John Dela Cruz",
    costLabel: "Internal Channel",
    lastActivity: "2026-05-04",
    notes:
      "Lower volume but strongest conversion to hire. Good channel for urgent backfills.",
  },
  {
    id: 4,
    source: "Facebook",
    sourceType: "Social Media",
    volume: 65,
    screened: 36,
    interviewed: 14,
    offered: 5,
    hired: 4,
    conversionRate: 6.2,
    topRole: "CSR",
    topAccount: "SIBS Operations",
    owner: "Paul Garcia",
    costLabel: "Organic / Campaign",
    lastActivity: "2026-05-03",
    notes:
      "Good for awareness and candidate volume, but lower conversion after screening.",
  },
  {
    id: 5,
    source: "Walk-in",
    sourceType: "Direct Applicant",
    volume: 28,
    screened: 18,
    interviewed: 9,
    offered: 4,
    hired: 3,
    conversionRate: 10.7,
    topRole: "HR Assistant",
    topAccount: "SIBS HR",
    owner: "Maria Reyes",
    costLabel: "Organic Channel",
    lastActivity: "2026-05-02",
    notes: "Useful for local hiring needs and immediate availability.",
  },
  {
    id: 6,
    source: "Talent Pool Reactivation",
    sourceType: "Internal Database",
    volume: 42,
    screened: 34,
    interviewed: 20,
    offered: 11,
    hired: 8,
    conversionRate: 19.0,
    topRole: "RCM Analyst",
    topAccount: "SIBS RCM",
    owner: "Kim Domingo",
    costLabel: "Internal Channel",
    lastActivity: "2026-05-01",
    notes:
      "Strong reusable source because candidate history already exists in the HRIS.",
  },
];

const sourceTypeOptions = [
  "All Types",
  "Job Board",
  "Professional Network",
  "Employee Referral",
  "Social Media",
  "Direct Applicant",
  "Internal Database",
];

const ownerOptions = [
  "All Owners",
  "Maria Reyes",
  "John Dela Cruz",
  "Kim Domingo",
  "Paul Garcia",
];

const roleOptions = [
  "All Roles",
  "CSR",
  "System Developer",
  "HR Assistant",
  "RCM Analyst",
];

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getSourceTypeClass(type) {
  switch (type) {
    case "Employee Referral":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Internal Database":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Job Board":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "Professional Network":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "Social Media":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Direct Applicant":
      return "border-gray-200 bg-gray-50 text-gray-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sibs-primary-1 text-white">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs text-sibs-tertiary-5">{title}</p>

        <h2 className="truncate text-lg font-bold text-sibs-primary-1">
          {value}
        </h2>

        {description && (
          <p className="truncate text-xs text-sibs-tertiary-5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function ConversionBar({ label, value, max }) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-[#344054]">{label}</p>

        <p className="text-sm font-bold text-sibs-primary-1">
          {value.toFixed(1)}%
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div
          className="h-full rounded-full bg-sibs-primary-1"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function VolumeBar({ label, value, max }) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-[#344054]">{label}</p>

        <p className="text-sm font-bold text-sibs-primary-1">{value}</p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div
          className="h-full rounded-full bg-sibs-primary-1"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function FunnelRow({ label, value, max }) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-[#344054]">{label}</p>

        <p className="text-sm font-bold text-sibs-primary-1">{value}</p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-sibs-primary-1"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className="max-w-[60%] text-right text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}

function SourceMobileCard({ source, onView }) {
  return (
    <button
      type="button"
      onClick={onView}
      className="w-full rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#101828]">{source.source}</h3>

          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
            {source.costLabel}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getSourceTypeClass(
            source.sourceType
          )}`}
        >
          {source.sourceType}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Volume
          </p>

          <p className="mt-1 text-sm font-bold text-sibs-primary-1">
            {source.volume}
          </p>
        </div>

        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Hired
          </p>

          <p className="mt-1 text-sm font-bold text-emerald-600">
            {source.hired}
          </p>
        </div>

        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Conv.
          </p>

          <p className="mt-1 text-sm font-bold text-sibs-primary-1">
            {source.conversionRate.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <p className="font-semibold text-sibs-tertiary-5">
          Role:{" "}
          <span className="font-bold text-[#344054]">{source.topRole}</span>
        </p>

        <p className="font-semibold text-sibs-tertiary-5">
          Owner: <span className="font-bold text-[#344054]">{source.owner}</span>
        </p>
      </div>
    </button>
  );
}

function SourceDetailsModal({ open, source, onClose }) {
  if (!open || !source) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Source Performance Details
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Source volume, pipeline conversion, and hiring effectiveness.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-[#101828] sm:text-xl">
                      {source.source}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                      {source.sourceType}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getSourceTypeClass(
                          source.sourceType
                        )}`}
                      >
                        {source.sourceType}
                      </span>

                      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
                        {source.costLabel}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1/70">
                      Conversion to Hire
                    </p>

                    <p className="mt-1 text-2xl font-bold text-sibs-primary-1">
                      {source.conversionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-5 text-sm font-bold text-[#101828]">
                  Source Funnel
                </h3>

                <div className="space-y-3">
                  <FunnelRow
                    label="Candidate Volume"
                    value={source.volume}
                    max={source.volume}
                  />
                  <FunnelRow
                    label="Screened"
                    value={source.screened}
                    max={source.volume}
                  />
                  <FunnelRow
                    label="Interviewed"
                    value={source.interviewed}
                    max={source.volume}
                  />
                  <FunnelRow
                    label="Offered"
                    value={source.offered}
                    max={source.volume}
                  />
                  <FunnelRow
                    label="Hired"
                    value={source.hired}
                    max={source.volume}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Source Notes
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  {source.notes}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Source Summary
                </h3>

                <div className="mt-4">
                  <DetailRow label="Source" value={source.source} />
                  <DetailRow label="Source Type" value={source.sourceType} />
                  <DetailRow label="Owner" value={source.owner} />
                  <DetailRow label="Top Role" value={source.topRole} />
                  <DetailRow label="Top Account" value={source.topAccount} />
                  <DetailRow label="Volume" value={source.volume} />
                  <DetailRow label="Hired" value={source.hired} />
                  <DetailRow
                    label="Last Activity"
                    value={formatDate(source.lastActivity)}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                <h3 className="text-sm font-bold text-emerald-700">
                  Interpretation
                </h3>

                <p className="mt-2 text-sm leading-6 text-emerald-700/90">
                  High-volume sources help sourcing coverage, while
                  high-conversion sources should be prioritized for urgent
                  hiring requirements.
                </p>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <h3 className="text-sm font-bold text-amber-700">Data Rule</h3>

                <p className="mt-2 text-sm leading-6 text-amber-700/90">
                  Source must be captured at candidate entry and preserved
                  across the full pipeline.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-sibs-primary-1 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SourcingAnalyticsPage() {
  const [search, setSearch] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("All Types");
  const [ownerFilter, setOwnerFilter] = useState("All Owners");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [selectedSource, setSelectedSource] = useState(null);

  const filteredSources = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return sourcingData.filter((source) => {
      const matchesSearch =
        !keyword ||
        source.source.toLowerCase().includes(keyword) ||
        source.sourceType.toLowerCase().includes(keyword) ||
        source.topRole.toLowerCase().includes(keyword) ||
        source.topAccount.toLowerCase().includes(keyword) ||
        source.owner.toLowerCase().includes(keyword);

      const matchesType =
        sourceTypeFilter === "All Types" ||
        source.sourceType === sourceTypeFilter;

      const matchesOwner =
        ownerFilter === "All Owners" || source.owner === ownerFilter;

      const matchesRole =
        roleFilter === "All Roles" || source.topRole === roleFilter;

      return matchesSearch && matchesType && matchesOwner && matchesRole;
    });
  }, [search, sourceTypeFilter, ownerFilter, roleFilter]);

  const totals = useMemo(() => {
    const totalVolume = sourcingData.reduce(
      (sum, source) => sum + source.volume,
      0
    );

    const totalHired = sourcingData.reduce(
      (sum, source) => sum + source.hired,
      0
    );

    const averageConversion =
      totalVolume > 0 ? ((totalHired / totalVolume) * 100).toFixed(1) : "0.0";

    const bestSource = [...sourcingData].sort(
      (a, b) => b.conversionRate - a.conversionRate
    )[0];

    const topVolumeSource = [...sourcingData].sort(
      (a, b) => b.volume - a.volume
    )[0];

    return {
      totalSources: sourcingData.length,
      totalVolume,
      totalHired,
      averageConversion,
      bestSource,
      topVolumeSource,
    };
  }, []);

  const maxVolume = Math.max(...sourcingData.map((source) => source.volume));
  const maxConversion = Math.max(
    ...sourcingData.map((source) => source.conversionRate)
  );

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 size={28} className="shrink-0 text-sibs-primary-1" />

            <h1 className="min-w-0 break-words text-2xl font-bold text-sibs-primary-1 sm:text-4xl">
              Sourcing Analytics
            </h1>
          </div>

          <p className="mt-1 text-sm text-sibs-tertiary-5">
            Track candidate source performance and conversion to hire
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Tracked Sources"
            value={totals.totalSources}
            icon={MousePointerClick}
            description="Active candidate channels"
          />
          <StatCard
            title="Candidate Volume"
            value={totals.totalVolume}
            icon={UsersRound}
            description={`${totals.topVolumeSource?.source} leads volume`}
          />
          <StatCard
            title="Hired From Sources"
            value={totals.totalHired}
            icon={UserCheck}
            description="Converted to hires"
          />
          <StatCard
            title="Avg. Conversion"
            value={`${totals.averageConversion}%`}
            icon={TrendingUp}
            description="Volume to hire"
          />
          <StatCard
            title="Best Source"
            value={totals.bestSource?.source || "—"}
            icon={Target}
            description={`${totals.bestSource?.conversionRate || 0}% conversion`}
          />
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-sibs-primary-1">
                  Volume per Source
                </h2>

                <p className="text-sm text-sibs-tertiary-5">
                  Candidate count captured at entry point.
                </p>
              </div>

              <UsersRound size={20} className="shrink-0 text-gray-400" />
            </div>

            <div className="space-y-5">
              {sourcingData.map((source) => (
                <VolumeBar
                  key={source.id}
                  label={source.source}
                  value={source.volume}
                  max={maxVolume}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-sibs-primary-1">
                  Conversion to Hire per Source
                </h2>

                <p className="text-sm text-sibs-tertiary-5">
                  Shows which channels generate hires, not only volume.
                </p>
              </div>

              <Activity size={20} className="shrink-0 text-gray-400" />
            </div>

            <div className="space-y-5">
              {sourcingData.map((source) => (
                <ConversionBar
                  key={source.id}
                  label={source.source}
                  value={source.conversionRate}
                  max={maxConversion}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_300px_180px_180px_160px_auto] xl:items-center">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-sibs-primary-1">
                  Source Performance Table
                </h2>

                <p className="text-sm text-sibs-tertiary-5">
                  Source volume, conversion, owner, and top role visibility.
                </p>
              </div>

              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search source, owner, role..."
                  className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                />
              </div>

              <select
                value={sourceTypeFilter}
                onChange={(e) => setSourceTypeFilter(e.target.value)}
                className="h-11 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              >
                {sourceTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="h-11 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              >
                {ownerOptions.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-11 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5"
              >
                <Filter size={17} />
                Filters
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="space-y-3 lg:hidden">
              {filteredSources.length > 0 ? (
                filteredSources.map((source) => (
                  <SourceMobileCard
                    key={source.id}
                    source={source}
                    onView={() => setSelectedSource(source)}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                  No source performance records found.
                </div>
              )}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-[#E6ECF2] lg:block">
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full min-w-[1180px] border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                    <tr className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      <th className="px-5 py-4">Source</th>
                      <th className="px-5 py-4">Type</th>
                      <th className="px-5 py-4 text-center">Volume</th>
                      <th className="px-5 py-4 text-center">Screened</th>
                      <th className="px-5 py-4 text-center">Interviewed</th>
                      <th className="px-5 py-4 text-center">Hired</th>
                      <th className="px-5 py-4 text-center">Conversion</th>
                      <th className="px-5 py-4">Top Role</th>
                      <th className="px-5 py-4">Owner</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredSources.length > 0 ? (
                      filteredSources.map((source) => (
                        <tr
                          key={source.id}
                          className="transition hover:bg-[#F8FAFC]"
                        >
                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-[#101828]">
                              {source.source}
                            </p>

                            <p className="text-xs font-semibold text-sibs-tertiary-5">
                              {source.costLabel}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getSourceTypeClass(
                                source.sourceType
                              )}`}
                            >
                              {source.sourceType}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center text-sm font-bold text-[#344054]">
                            {source.volume}
                          </td>

                          <td className="px-5 py-4 text-center text-sm font-bold text-[#344054]">
                            {source.screened}
                          </td>

                          <td className="px-5 py-4 text-center text-sm font-bold text-[#344054]">
                            {source.interviewed}
                          </td>

                          <td className="px-5 py-4 text-center text-sm font-bold text-emerald-600">
                            {source.hired}
                          </td>

                          <td className="px-5 py-4 text-center text-sm font-bold text-sibs-primary-1">
                            {source.conversionRate.toFixed(1)}%
                          </td>

                          <td className="px-5 py-4 text-sm font-bold text-[#344054]">
                            {source.topRole}
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                            {source.owner}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedSource(source)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 py-2 text-xs font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5"
                            >
                              <Eye size={15} />
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                        >
                          No source performance records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <p className="text-sm font-semibold text-sibs-tertiary-5">
                Showing 1 to {filteredSources.length} of {sourcingData.length}{" "}
                source records
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-sibs-primary-1 text-sm font-bold text-white"
                >
                  1
                </button>

                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h3 className="text-sm font-bold text-sibs-primary-1">
            Sourcing Engine Rule
          </h3>

          <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
            Source must be captured at candidate entry and preserved across the
            entire pipeline. Reports should show both volume per source and
            conversion to hire per source, not only manual tags.
          </p>
        </section>
      </main>

      <SourceDetailsModal
        open={!!selectedSource}
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
      />
    </div>
  );
}