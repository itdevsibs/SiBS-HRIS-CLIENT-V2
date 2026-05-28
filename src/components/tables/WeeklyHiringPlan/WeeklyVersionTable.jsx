import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Filter,
  Lock,
  RotateCcw,
  Search,
  Unlock,
} from "lucide-react";

const CLUSTER_OPTIONS = [
  "Coast Dental",
  "US Visa",
  "SME",
  "Yomdel",
  "Corporate",
];

const FULL_ACCESS_ROLES = new Set(["ta", "hr", "hr_admin", "super_admin"]);

const HIRING_PLAN_PERCENT_OPTIONS = Array.from(
  { length: 20 },
  (_, index) => (index + 1) * 5
);

function getText(value) {
  return String(value || "").trim();
}

function getAccountName(account) {
  return getText(
    account?.accountName ||
      account?.account ||
      account?.gy_acc_name ||
      account?.account_name ||
      account?.name
  );
}

function getGhlName(account) {
  return getText(
    account?.ghlName || account?.gy_acc_ghl_name || account?.ghl_name
  );
}

function getClusterNameFromAccount(account) {
  const accountName = getAccountName(account);
  const ghlName = getGhlName(account);
  const text = `${accountName} ${ghlName}`.toLowerCase();

  if (
    text.includes("cd -") ||
    text.includes("cd-") ||
    text.includes("coast dental")
  ) {
    return "Coast Dental";
  }

  if (text.includes("us visa")) {
    return "US Visa";
  }

  if (
    text.includes("sme-") ||
    text.includes("sme -") ||
    text.includes("frontsteps") ||
    text.includes("front steps")
  ) {
    return "SME";
  }

  if (text.includes("yomdel")) {
    return "Yomdel";
  }

  const explicitCluster = getText(account?.clusterName || account?.cluster);

  if (explicitCluster) return explicitCluster;

  return "Corporate";
}

function getRoleValue(user) {
  return getText(user?.role || user?.userRole || user?.adminRole).toLowerCase();
}

function canViewAllWeeklyAccounts(user) {
  return FULL_ACCESS_ROLES.has(getRoleValue(user));
}

function normalizeAssignedAccounts(user, assignedAccounts = []) {
  if (Array.isArray(assignedAccounts) && assignedAccounts.length > 0) {
    return assignedAccounts;
  }

  if (Array.isArray(user?.assignedAccounts) && user.assignedAccounts.length > 0) {
    return user.assignedAccounts;
  }

  if (user?.account || user?.accountName || user?.gy_acc_name) {
    return [user];
  }

  return [];
}

function getClusterFilterLabel(selectedClusters = [], restricted = false) {
  if (!selectedClusters.length || selectedClusters.includes("All")) {
    return restricted ? "All Assigned Clusters" : "All Clusters";
  }

  if (selectedClusters.length === 1) {
    return selectedClusters[0];
  }

  return `${selectedClusters.length} Clusters Selected`;
}

function getAccountFilterLabel(selectedAccounts = [], restricted = false) {
  if (!selectedAccounts.length || selectedAccounts.includes("All")) {
    return restricted ? "All Assigned Accounts" : "All Accounts";
  }

  if (selectedAccounts.length === 1) {
    return selectedAccounts[0];
  }

  return `${selectedAccounts.length} Accounts Selected`;
}

function formatWeekLabel(week) {
  const rawLabel = String(week?.label || "").trim();

  if (week?.year && week?.weekNumber) {
    return `${week.year} - Week ${week.weekNumber}`;
  }

  if (week?.weekNumber && rawLabel.match(/^\d{4}$/)) {
    return `${rawLabel} - Week ${week.weekNumber}`;
  }

  const match = rawLabel.match(/^(\d{4})\s*-?\s*week\s*(\d+)$/i);

  if (match) {
    return `${match[1]} - Week ${match[2]}`;
  }

  return rawLabel || "Weekly Version";
}

function formatWeeklyVersionDisplay(week) {
  if (!week) return "";

  const label = formatWeekLabel(week);
  const weekRange = week.weekRange || "";

  return weekRange ? `${label} | ${weekRange}` : label;
}

function AnimatedDropdown({ open, children, className = "" }) {
  return (
    <div
      className={`absolute left-0 right-0 top-full mt-2 grid transition-all duration-300 ease-out ${
        open
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0"
      } ${className}`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl transition-all duration-300 ease-out ${
            open ? "translate-y-0 scale-100" : "-translate-y-2 scale-[0.98]"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
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

  selectedHiringPlanPercent = 5,
  setSelectedHiringPlanPercent,

  search,
  setSearch,

  isLocked = false,
  canEditRequiredHeadcount = false,

  isAllClustersSelected,
  isAllAccountsSelected,
  handleToggleCluster,
  handleToggleAccount,

  user = null,
  assignedAccounts = [],
}) {
  const [showHiringPlanDropdown, setShowHiringPlanDropdown] = useState(false);
  const hiringPlanDropdownRef = useRef(null);

  const canViewAllAccounts = canViewAllWeeklyAccounts(user);
  const isRestrictedManager = !canViewAllAccounts;

  const normalizedAssignedAccounts = useMemo(
    () => normalizeAssignedAccounts(user, assignedAccounts),
    [user, assignedAccounts]
  );

  const assignedAccountNames = useMemo(() => {
    return new Set(
      normalizedAssignedAccounts
        .map((account) => getAccountName(account))
        .filter(Boolean)
    );
  }, [normalizedAssignedAccounts]);

  const assignedClusterNames = useMemo(() => {
    return new Set(
      normalizedAssignedAccounts
        .map((account) => getClusterNameFromAccount(account))
        .filter(Boolean)
    );
  }, [normalizedAssignedAccounts]);

  const visibleClusterOptions = useMemo(() => {
    if (canViewAllAccounts) return CLUSTER_OPTIONS;

    return CLUSTER_OPTIONS.filter((cluster) =>
      assignedClusterNames.has(cluster)
    );
  }, [canViewAllAccounts, assignedClusterNames]);

  const visibleAccountOptions = useMemo(() => {
    if (canViewAllAccounts) return filteredAccountOptions;

    return filteredAccountOptions.filter((account) => {
      const accountName = getAccountName(account);
      return assignedAccountNames.has(accountName);
    });
  }, [canViewAllAccounts, filteredAccountOptions, assignedAccountNames]);

  const safeIsAllClustersSelected = () => {
    if (typeof isAllClustersSelected === "function") {
      return isAllClustersSelected();
    }

    return selectedClusters.includes("All") || selectedClusters.length === 0;
  };

  const safeIsAllAccountsSelected = () => {
    if (typeof isAllAccountsSelected === "function") {
      return isAllAccountsSelected();
    }

    return selectedAccounts.includes("All") || selectedAccounts.length === 0;
  };

  const hasActiveFilters =
    !safeIsAllClustersSelected() ||
    !safeIsAllAccountsSelected() ||
    search ||
    Number(selectedHiringPlanPercent) !== 5;

  useEffect(() => {
    if (canViewAllAccounts) return;

    const selectedRealClusters = selectedClusters.filter(
      (cluster) => cluster !== "All"
    );

    const hasInvalidCluster = selectedRealClusters.some(
      (cluster) => !assignedClusterNames.has(cluster)
    );

    if (hasInvalidCluster) {
      setSelectedClusters(["All"]);
    }

    const selectedRealAccounts = selectedAccounts.filter(
      (account) => account !== "All"
    );

    const hasInvalidAccount = selectedRealAccounts.some(
      (account) => !assignedAccountNames.has(account)
    );

    if (hasInvalidAccount) {
      setSelectedAccounts(["All"]);
    }
  }, [
    canViewAllAccounts,
    selectedClusters,
    selectedAccounts,
    assignedClusterNames,
    assignedAccountNames,
    setSelectedClusters,
    setSelectedAccounts,
  ]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        hiringPlanDropdownRef.current &&
        !hiringPlanDropdownRef.current.contains(e.target)
      ) {
        setShowHiringPlanDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleClearFilters() {
    setSelectedClusters(["All"]);
    setSelectedAccounts(["All"]);
    setAccountSearch("");
    setSearch("");
    setSelectedHiringPlanPercent?.(5);
    setShowHiringPlanDropdown(false);
  }

  function handleWeeklyVersionChange(week) {
    setActiveWeekId(week.id);
    setSelectedClusters(["All"]);
    setSelectedAccounts(["All"]);
    setSearch("");
    setWeekSearch("");
    setShowWeekDropdown(false);
    setShowHiringPlanDropdown(false);
  }

  function handleClusterClick(cluster) {
    if (
      cluster !== "All" &&
      isRestrictedManager &&
      !assignedClusterNames.has(cluster)
    ) {
      return;
    }

    handleToggleCluster(cluster);
  }

  function handleAccountClick(accountName) {
    if (
      accountName !== "All" &&
      isRestrictedManager &&
      !assignedAccountNames.has(accountName)
    ) {
      return;
    }

    handleToggleAccount(accountName);
    setAccountSearch("");
  }

  return (
    <section className="overflow-visible rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
      <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <Filter size={14} />
              Weekly Filters
            </div>

            <h2 className="mt-3 text-base font-extrabold text-[#101828]">
              Weekly Hiring Plan Filters
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Select weekly version, cluster, account, hiring plan percentage,
              and keyword to refine the hiring plan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

            {isRestrictedManager && (
              <span className="inline-flex rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                Manager View: Assigned Accounts Only
              </span>
            )}

            {!canEditRequiredHeadcount && (
              <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                View only: Required Headcount
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.1fr_1fr_1fr_1fr_1fr_auto] xl:items-end">
          <div ref={weekDropdownRef} className="relative z-50">
            <label className="mb-1 block text-sm font-bold text-[#101828]">
              Weekly Version
            </label>

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
              />

              <input
                type="text"
                value={
                  showWeekDropdown
                    ? weekSearch
                    : formatWeeklyVersionDisplay(activeWeek)
                }
                onChange={(e) => {
                  setWeekSearch(e.target.value);
                  setShowWeekDropdown(true);
                }}
                onFocus={() => {
                  setShowWeekDropdown(true);
                  setWeekSearch("");
                  setShowHiringPlanDropdown(false);
                }}
                placeholder={
                  weeksLoading
                    ? "Loading weekly versions..."
                    : "Search weekly version..."
                }
                autoComplete="off"
                className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 pr-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              />

              <ChevronDown
                size={18}
                onClick={() => {
                  setShowWeekDropdown((prev) => !prev);
                  setWeekSearch("");
                  setShowHiringPlanDropdown(false);
                }}
                className={`absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-sibs-tertiary-5 transition-transform duration-300 ${
                  showWeekDropdown ? "rotate-180" : ""
                }`}
              />

              <AnimatedDropdown open={showWeekDropdown}>
                <div className="max-h-72 overflow-y-auto py-2 sibs-scrollbar">
                  {filteredWeeklyVersions.length > 0 ? (
                    filteredWeeklyVersions.map((week) => {
                      const isSelected = week.id === activeWeekId;

                      return (
                        <button
                          key={week.id}
                          type="button"
                          onClick={() => handleWeeklyVersionChange(week)}
                          className={`block w-full px-4 py-3 text-left text-sm transition ${
                            isSelected
                              ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                              : "text-sibs-primary-1 hover:bg-[#F8FAFC]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-bold">
                                {formatWeekLabel(week)}
                              </p>

                              <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
                                {week.weekRange || "—"}
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
                    <div className="px-4 py-3 text-sm font-semibold text-sibs-tertiary-5">
                      No weekly version found.
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm font-semibold text-sibs-tertiary-5">
                      No weekly versions available.
                    </div>
                  )}
                </div>
              </AnimatedDropdown>
            </div>
          </div>

          <div ref={clusterDropdownRef} className="relative z-40">
            <label className="mb-1 block text-sm font-bold text-[#101828]">
              Cluster
            </label>

            <button
              type="button"
              onClick={() => {
                setShowClusterDropdown((prev) => !prev);
                setShowHiringPlanDropdown(false);
              }}
              className="flex h-12 w-full items-center justify-between rounded-xl border border-[#D0D5DD] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            >
              <span className="truncate">
                {getClusterFilterLabel(selectedClusters, isRestrictedManager)}
              </span>

              <ChevronDown
                size={18}
                className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
                  showClusterDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatedDropdown open={showClusterDropdown}>
              <div className="max-h-64 overflow-y-auto py-2 sibs-scrollbar">
                <button
                  type="button"
                  onClick={() => handleClusterClick("All")}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                    safeIsAllClustersSelected()
                      ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                      : "text-[#344054] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={safeIsAllClustersSelected()}
                    readOnly
                    className="h-4 w-4 rounded border-[#D0D5DD] accent-sibs-primary-1"
                  />

                  <span>
                    {isRestrictedManager
                      ? "All Assigned Clusters"
                      : "All Clusters"}
                  </span>
                </button>

                {visibleClusterOptions.length > 0 ? (
                  visibleClusterOptions.map((cluster) => {
                    const checked =
                      !safeIsAllClustersSelected() &&
                      selectedClusters.includes(cluster);

                    return (
                      <button
                        key={cluster}
                        type="button"
                        onClick={() => handleClusterClick(cluster)}
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
                  })
                ) : (
                  <div className="px-4 py-3 text-sm font-semibold text-sibs-tertiary-5">
                    No assigned clusters found.
                  </div>
                )}
              </div>
            </AnimatedDropdown>
          </div>

          <div ref={accountDropdownRef} className="relative z-30">
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
                      : getAccountFilterLabel(
                          selectedAccounts,
                          isRestrictedManager
                        )
                }
                onChange={(e) => {
                  setAccountSearch(e.target.value);
                  setShowAccountDropdown(true);
                }}
                onFocus={() => {
                  if (!accountsLoading) {
                    setShowAccountDropdown(true);
                    setAccountSearch("");
                    setShowHiringPlanDropdown(false);
                  }
                }}
                disabled={accountsLoading}
                placeholder="Search accounts..."
                autoComplete="off"
                className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pr-11 text-sm font-bold text-[#344054] outline-none transition disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              />

              <ChevronDown
                size={18}
                onClick={() => {
                  if (!accountsLoading) {
                    setShowAccountDropdown((prev) => !prev);
                    setAccountSearch("");
                    setShowHiringPlanDropdown(false);
                  }
                }}
                className={`absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-sibs-tertiary-5 transition-transform duration-300 ${
                  showAccountDropdown ? "rotate-180" : ""
                }`}
              />

              <AnimatedDropdown open={showAccountDropdown && !accountsLoading}>
                <div className="max-h-64 overflow-y-auto py-2 sibs-scrollbar">
                  <button
                    type="button"
                    onClick={() => handleAccountClick("All")}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                      safeIsAllAccountsSelected()
                        ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                        : "text-[#344054] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={safeIsAllAccountsSelected()}
                      readOnly
                      className="h-4 w-4 rounded border-[#D0D5DD] accent-sibs-primary-1"
                    />

                    <span>
                      {isRestrictedManager
                        ? "All Assigned Accounts"
                        : "All Accounts"}
                    </span>
                  </button>

                  {visibleAccountOptions.length > 0 ? (
                    visibleAccountOptions.map((account, index) => {
                      const accountName = getAccountName(account);
                      const checked =
                        !safeIsAllAccountsSelected() &&
                        selectedAccounts.includes(accountName);

                      return (
                        <button
                          key={`${account.id || accountName}-${index}`}
                          type="button"
                          onClick={() => handleAccountClick(accountName)}
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
                      {isRestrictedManager
                        ? "No assigned accounts found."
                        : "No accounts found."}
                    </div>
                  )}
                </div>
              </AnimatedDropdown>
            </div>
          </div>

          <div ref={hiringPlanDropdownRef} className="relative z-20">
            <label className="mb-1 block text-sm font-bold text-[#101828]">
              Hiring Plan (%)
            </label>

            <button
              type="button"
              onClick={() => {
                setShowHiringPlanDropdown((prev) => !prev);
                setShowWeekDropdown(false);
                setShowClusterDropdown(false);
                setShowAccountDropdown(false);
              }}
              className="flex h-12 w-full items-center justify-between rounded-xl border border-[#D0D5DD] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            >
              <span className="truncate">{selectedHiringPlanPercent}%</span>

              <ChevronDown
                size={18}
                className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
                  showHiringPlanDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatedDropdown open={showHiringPlanDropdown}>
              <div className="max-h-64 overflow-y-auto py-2 sibs-scrollbar">
                {HIRING_PLAN_PERCENT_OPTIONS.map((percent) => {
                  const checked =
                    Number(selectedHiringPlanPercent) === Number(percent);

                  return (
                    <button
                      key={percent}
                      type="button"
                      onClick={() => {
                        setSelectedHiringPlanPercent?.(percent);
                        setShowHiringPlanDropdown(false);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                        checked
                          ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                          : "text-[#344054] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={checked}
                        readOnly
                        className="h-4 w-4 border-[#D0D5DD] accent-sibs-primary-1"
                      />

                      <span>{percent}%</span>
                    </button>
                  );
                })}
              </div>
            </AnimatedDropdown>
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

          <button
            type="button"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={17} />
            Clear
          </button>
        </div>
      </div>
    </section>
  );
}