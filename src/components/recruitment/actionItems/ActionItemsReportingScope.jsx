import React from "react";
import { AlertTriangle, Filter, RotateCcw, X } from "lucide-react";
import { useActionItemsReport } from "../../../services/context/ActionItemsReportContext.jsx";
import ThemedDropdown from "../../layout/dropdown/ThemedDropdown.jsx";

export default function ActionItemsReportingScope() {
  const {
    reportingScope,
    setReportingFilter,
    clearReportingScope,
    weekOptions,
    previousWeekLabel,
    scopeOptions,
    selectedRoleAccount,
    setSelectedRoleAccount,
  } = useActionItemsReport();

  const formattedWeekOptions = weekOptions.map((opt) => ({
    label: opt.label,
    value: opt.value,
  }));

  const formattedClusterOptions = (scopeOptions.clusters || []).map((opt) => ({
    label: opt === "All" ? "All Clusters" : opt,
    value: opt,
  }));

  const formattedAccountOptions = (scopeOptions.accounts || []).map((opt) => ({
    label: opt === "All" ? "All Accounts" : opt,
    value: opt,
  }));

  const formattedRoleOptions = (scopeOptions.roles || []).map((opt) => ({
    label: opt === "All" ? "All Roles" : opt,
    value: opt,
  }));

  const formattedOwnerOptions = (scopeOptions.owners || []).map((opt) => ({
    label: opt === "All" ? "All TA Owners" : opt,
    value: opt,
  }));

  return (
    <section
      className="relative z-30 overflow-visible sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-3.5 sm:p-4 2xl:p-5 font-jakarta shadow-sm"
      style={{ animationDelay: "60ms", animationFillMode: "both" }}
    >
      <div className="grid grid-cols-1 gap-2.5 2xl:gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[minmax(180px,1.2fr)_minmax(180px,1.2fr)_minmax(110px,1fr)_minmax(110px,1fr)_minmax(110px,1fr)_minmax(110px,1fr)_auto_auto] xl:items-end">
        <div className="min-w-0 space-y-1.5">
          <label className="block font-jakarta text-[10px] font-extrabold uppercase tracking-wider text-[#667085]">
            Reporting Week
          </label>
          <ThemedDropdown
            value={reportingScope.week}
            options={formattedWeekOptions}
            onChange={(val) => setReportingFilter("week", val)}
            searchable={false}
            showPlaceholderOption={false}
            className="w-full"
          />
        </div>

        <div className="min-w-0 space-y-1.5">
          <label className="block font-jakarta text-[10px] font-extrabold uppercase tracking-wider text-[#667085]">
            Previous Week
          </label>
          <div className="flex h-8.5 2xl:h-10 items-center truncate rounded-lg 2xl:rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3 font-jakarta text-xs font-semibold text-[#667085]" title={previousWeekLabel}>
            {previousWeekLabel}
          </div>
        </div>

        <div className="min-w-0 space-y-1.5">
          <label className="block font-jakarta text-[10px] font-extrabold uppercase tracking-wider text-[#667085]">
            Cluster
          </label>
          <ThemedDropdown
            value={reportingScope.cluster}
            options={formattedClusterOptions}
            onChange={(val) => setReportingFilter("cluster", val)}
            searchable={false}
            showPlaceholderOption={false}
            className="w-full"
          />
        </div>

        <div className="min-w-0 space-y-1.5">
          <label className="block font-jakarta text-[10px] font-extrabold uppercase tracking-wider text-[#667085]">
            Account
          </label>
          <ThemedDropdown
            value={reportingScope.account}
            options={formattedAccountOptions}
            onChange={(val) => setReportingFilter("account", val)}
            searchable={true}
            showPlaceholderOption={false}
            className="w-full"
          />
        </div>

        <div className="min-w-0 space-y-1.5">
          <label className="block font-jakarta text-[10px] font-extrabold uppercase tracking-wider text-[#667085]">
            Role
          </label>
          <ThemedDropdown
            value={reportingScope.role}
            options={formattedRoleOptions}
            onChange={(val) => setReportingFilter("role", val)}
            searchable={true}
            showPlaceholderOption={false}
            className="w-full"
          />
        </div>

        <div className="min-w-0 space-y-1.5">
          <label className="block font-jakarta text-[10px] font-extrabold uppercase tracking-wider text-[#667085]">
            TA Owner
          </label>
          <ThemedDropdown
            value={reportingScope.owner}
            options={formattedOwnerOptions}
            onChange={(val) => setReportingFilter("owner", val)}
            searchable={false}
            showPlaceholderOption={false}
            className="w-full"
          />
        </div>

        <div className="flex min-w-0 flex-col justify-end space-y-1.5">
          <span className="font-jakarta text-[10px] font-extrabold uppercase tracking-wider text-[#667085]">Risk Scope</span>
          <button
            type="button"
            onClick={() => setReportingFilter("atRiskOnly", !reportingScope.atRiskOnly)}
            aria-pressed={reportingScope.atRiskOnly}
            className={`inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-lg 2xl:rounded-xl border px-2.5 2xl:px-3 font-jakarta text-[11px] 2xl:text-xs font-bold transition ${
              reportingScope.atRiskOnly
                ? "border-rose-300 bg-rose-50 text-rose-700 shadow-sm"
                : "border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F8FAFC]"
            }`}
          >
            <AlertTriangle size={14} className={reportingScope.atRiskOnly ? "text-rose-600" : "text-[#667085]"} />
            {reportingScope.atRiskOnly ? "At Risk Only: On" : "At Risk Only"}
          </button>
        </div>

        <div className="flex min-w-0 flex-col justify-end space-y-1.5">
          <span className="font-jakarta text-[10px] font-extrabold uppercase tracking-wider text-[#667085]">Reset</span>
          <button
            type="button"
            onClick={clearReportingScope}
            title="Clear Selection"
            aria-label="Clear Selection"
            className="inline-flex h-8.5 2xl:h-10 w-8.5 2xl:w-10 shrink-0 items-center justify-center rounded-lg 2xl:rounded-xl border border-[#D0D5DD] bg-white text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28]"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {selectedRoleAccount ? (
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-blue-100 bg-[#E9F0FC] px-3 py-2 text-[11px] font-bold text-[#042C51] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <Filter size={14} className="shrink-0 text-[#FF5C28]" />
            <span className="truncate">
              Viewing Filter: {selectedRoleAccount.role} ({selectedRoleAccount.account})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedRoleAccount(null)}
            className="inline-flex shrink-0 items-center gap-1 text-rose-600 hover:underline"
          >
            <X size={13} /> Clear Filter
          </button>
        </div>
      ) : null}
    </section>
  );
}
