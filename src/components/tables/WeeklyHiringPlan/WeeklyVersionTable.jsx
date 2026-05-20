import React from "react";
import { ChevronDown, Lock, Search, Unlock } from "lucide-react";

const CLUSTER_OPTIONS = ["Coast Dental", "US Visa", "SME", "Yomdel", "Corporate"];

function getClusterFilterLabel(selectedClusters = []) {
  if (!selectedClusters.length || selectedClusters.includes("All")) {
    return "All Clusters";
  }

  if (selectedClusters.length === 1) {
    return selectedClusters[0];
  }

  return `${selectedClusters.length} Clusters Selected`;
}

function getAccountFilterLabel(selectedAccounts = []) {
  if (!selectedAccounts.length || selectedAccounts.includes("All")) {
    return "All Accounts";
  }

  if (selectedAccounts.length === 1) {
    return selectedAccounts[0];
  }

  return `${selectedAccounts.length} Accounts Selected`;
}

export default function WeeklyVersionTable({
  weekDropdownRef,
  clusterDropdownRef,
  accountDropdownRef,

  activeWeek,
  activeWeekId,
  setActiveWeekId,

  weeksLoading = false,
  weekSearch,
  setWeekSearch,
  showWeekDropdown,
  setShowWeekDropdown,
  filteredWeeklyVersions = [],

  selectedClusters = ["All"],
  setSelectedClusters,
  showClusterDropdown,
  setShowClusterDropdown,

  selectedAccounts = ["All"],
  setSelectedAccounts,
  showAccountDropdown,
  setShowAccountDropdown,

  accountSearch,
  setAccountSearch,
  accountsLoading = false,
  filteredAccountOptions = [],

  search,
  setSearch,

  isLocked = false,
  canEditRequiredHeadcount = false,

  isAllClustersSelected,
  isAllAccountsSelected,
  handleToggleCluster,
  handleToggleAccount,
}) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.1fr_1fr_1fr_1fr] xl:items-end">
        <div ref={weekDropdownRef} className="relative z-40">
          <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
            Weekly Version
          </label>

          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
            />

            <input
              type="text"
              value={
                showWeekDropdown
                  ? weekSearch
                  : activeWeek
                    ? `${activeWeek.label} | ${activeWeek.weekRange}`
                    : ""
              }
              onChange={(e) => {
                setWeekSearch(e.target.value);
                setShowWeekDropdown(true);
              }}
              onFocus={() => {
                setShowWeekDropdown(true);
                setWeekSearch("");
              }}
              placeholder={
                weeksLoading
                  ? "Loading weekly versions..."
                  : "Search weekly version..."
              }
              autoComplete="off"
              className="h-12 w-full rounded-xl border border-[#D7DEE8] bg-white px-4 pl-10 pr-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-gray-400 focus:border-[var(--sibs-primary-1)]"
            />

            <ChevronDown
              size={18}
              onClick={() => {
                setShowWeekDropdown((prev) => !prev);
                setWeekSearch("");
              }}
              className={`absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-sibs-tertiary-5 transition-transform ${
                showWeekDropdown ? "rotate-180" : ""
              }`}
            />

            {showWeekDropdown && (
              <div className="absolute left-0 right-0 top-full mt-2 max-h-60 overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl">
                <div className="max-h-60 overflow-y-auto py-2 sibs-scrollbar">
                  {filteredWeeklyVersions.length > 0 ? (
                    filteredWeeklyVersions.map((week) => {
                      const isSelected = week.id === activeWeekId;

                      return (
                        <button
                          key={week.id}
                          type="button"
                          onClick={() => {
                            setActiveWeekId(week.id);
                            setSelectedClusters(["All"]);
                            setSelectedAccounts(["All"]);
                            setSearch("");
                            setWeekSearch("");
                            setShowWeekDropdown(false);
                          }}
                          className={`block w-full px-4 py-3 text-left text-sm transition ${
                            isSelected
                              ? "bg-[#EAF2FB] font-medium text-sibs-primary-1"
                              : "text-sibs-primary-1 hover:bg-[#F8FAFC]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold">
                                {week.weekRange} ({week.label})
                              </p>

                              <p className="mt-1 text-xs text-sibs-tertiary-5">
                                {week.label} | {week.weekRange}
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                                week.locked
                                  ? "border-gray-200 bg-gray-50 text-gray-600"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {week.locked ? "Locked" : "Editable"}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ) : weekSearch.trim() ? (
                    <div className="px-4 py-3 text-sm text-sibs-tertiary-5">
                      No weekly version found
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-sibs-tertiary-5">
                      No weekly versions available
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div ref={clusterDropdownRef} className="relative z-30">
          <label className="mb-1 block text-sm font-bold text-[#101828]">
            Cluster
          </label>

          <button
            type="button"
            onClick={() => setShowClusterDropdown((prev) => !prev)}
            className="flex h-12 w-full items-center justify-between rounded-xl border border-[#D0D5DD] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
          >
            <span className="truncate">
              {getClusterFilterLabel(selectedClusters)}
            </span>

            <ChevronDown
              size={18}
              className={`shrink-0 text-sibs-tertiary-5 transition-transform ${
                showClusterDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showClusterDropdown && (
            <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl">
              <div className="max-h-64 overflow-y-auto py-2 sibs-scrollbar">
                <button
                  type="button"
                  onClick={() => handleToggleCluster("All")}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                    isAllClustersSelected()
                      ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                      : "text-[#344054] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isAllClustersSelected()}
                    readOnly
                    className="h-4 w-4 rounded border-[#D0D5DD] accent-sibs-primary-1"
                  />
                  <span>All Clusters</span>
                </button>

                {CLUSTER_OPTIONS.map((cluster) => {
                  const checked =
                    !isAllClustersSelected() &&
                    selectedClusters.includes(cluster);

                  return (
                    <button
                      key={cluster}
                      type="button"
                      onClick={() => handleToggleCluster(cluster)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                        checked
                          ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                          : "text-[#344054] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        readOnly
                        className="h-4 w-4 rounded border-[#D0D5DD] accent-sibs-primary-1"
                      />
                      <span className="truncate">{cluster}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div ref={accountDropdownRef} className="relative z-20">
          <label className="mb-1 block text-sm font-bold text-[#101828]">
            Account
          </label>

          <div className="relative">
            <input
              type="text"
              value={
                showAccountDropdown
                  ? accountSearch
                  : accountsLoading
                    ? "Loading accounts..."
                    : getAccountFilterLabel(selectedAccounts)
              }
              onChange={(e) => {
                setAccountSearch(e.target.value);
                setShowAccountDropdown(true);
              }}
              onFocus={() => {
                if (!accountsLoading) {
                  setShowAccountDropdown(true);
                  setAccountSearch("");
                }
              }}
              disabled={accountsLoading}
              placeholder="Search accounts..."
              autoComplete="off"
              className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pr-11 text-sm font-bold text-[#344054] outline-none transition disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-sibs-tertiary-5 focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
            />

            <ChevronDown
              size={18}
              onClick={() => {
                if (!accountsLoading) {
                  setShowAccountDropdown((prev) => !prev);
                  setAccountSearch("");
                }
              }}
              className={`absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-sibs-tertiary-5 transition-transform ${
                showAccountDropdown ? "rotate-180" : ""
              }`}
            />

            {showAccountDropdown && !accountsLoading && (
              <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl">
                <div className="max-h-64 overflow-y-auto py-2 sibs-scrollbar">
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleAccount("All");
                      setAccountSearch("");
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                      isAllAccountsSelected()
                        ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                        : "text-[#344054] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isAllAccountsSelected()}
                      readOnly
                      className="h-4 w-4 rounded border-[#D0D5DD] accent-sibs-primary-1"
                    />

                    <span>All Accounts</span>
                  </button>

                  {filteredAccountOptions.length > 0 ? (
                    filteredAccountOptions.map((account, index) => {
                      const accountName = account.accountName;
                      const checked =
                        !isAllAccountsSelected() &&
                        selectedAccounts.includes(accountName);

                      return (
                        <button
                          key={`${account.id || accountName}-${index}`}
                          type="button"
                          onClick={() => {
                            handleToggleAccount(accountName);
                            setAccountSearch("");
                          }}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                            checked
                              ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                              : "text-[#344054] hover:bg-[#F8FAFC]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            readOnly
                            className="h-4 w-4 rounded border-[#D0D5DD] accent-sibs-primary-1"
                          />

                          <span className="truncate">{accountName}</span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-4 text-sm font-semibold text-sibs-tertiary-5">
                      No accounts found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-[#101828]">
            Search
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hiring plan..."
              className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${
            isLocked
              ? "border-gray-200 bg-gray-50 text-gray-600"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {isLocked ? <Lock size={13} /> : <Unlock size={13} />}
          {isLocked ? "Locked" : "Editable"}
        </span>

        {!canEditRequiredHeadcount && (
          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            View only: Required Headcount
          </span>
        )}

        {(!isAllClustersSelected() || !isAllAccountsSelected() || search) && (
          <button
            type="button"
            onClick={() => {
              setSelectedClusters(["All"]);
              setSelectedAccounts(["All"]);
              setAccountSearch("");
              setSearch("");
            }}
            className="inline-flex rounded-full border border-[#E6ECF2] bg-white px-3 py-1 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}