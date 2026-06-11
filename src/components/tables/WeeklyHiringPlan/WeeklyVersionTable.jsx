import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Filter, Lock, Save, Unlock } from "lucide-react";

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
  (_, index) => (index + 1) * 5,
);

const EDGE = "rounded-[10px]";

function getText(value) {
  return String(value || "").trim();
}

function getAccountName(account) {
  return getText(
    account?.accountName ||
      account?.account ||
      account?.gy_acc_name ||
      account?.account_name ||
      account?.name,
  );
}

function getGhlName(account) {
  return getText(
    account?.ghlName || account?.gy_acc_ghl_name || account?.ghl_name,
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

function getWeekHiringPlanPercent(week, fallback = 5) {
  const value =
    week?.hiringPlanPercent ??
    week?.hiring_plan_percent ??
    week?.hiringRate ??
    week?.hiring_rate ??
    fallback;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 5;
}

function AnimatedDropdown({ open, children, className = "" }) {
  return (
    <div
      className={`absolute left-0 right-0 top-full z-[9999] mt-2 grid transition-all duration-200 ease-out ${
        open
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0"
      } ${className}`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`overflow-hidden ${EDGE} border border-[#D7DEE8] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] transition-all duration-200 ease-out ${
            open ? "translate-y-0 scale-100" : "-translate-y-1 scale-[0.99]"
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

  /*
    isLocked = display lock only.
    This can be true for previous weeks.
  */
  isLocked = false,

  /*
    isHiringPlanSnapshotLocked = database snapshot lock or inherited latest rate lock.
    This disables Hiring Plan dropdown.
  */
  isHiringPlanSnapshotLocked = false,

  /*
    Only HR and HR Admin should be true.
    This controls:
    - Hiring Plan dropdown edit access
    - Lock button visibility
  */
  canManageHiringPlanPercent = false,

  canEditRequiredHeadcount = false,

  isAllClustersSelected,
  isAllAccountsSelected,
  handleToggleCluster,
  handleToggleAccount,

  user = null,
  assignedAccounts = [],

  onLockWeeklyHiringPlan,
  lockingWeeklyPlan = false,
  filteredPlansCount = 0,
}) {
  const [showHiringPlanDropdown, setShowHiringPlanDropdown] = useState(false);
  const hiringPlanDropdownRef = useRef(null);

  const canViewAllAccounts = canViewAllWeeklyAccounts(user);
  const isRestrictedManager = !canViewAllAccounts;

  /*
    Weekly version display lock:
    Previous weeks can show Locked here.
  */
  const weekLockedForDisplay = Boolean(isLocked || activeWeek?.locked);

  /*
    Database/inherited snapshot lock:
    This controls whether the hiring plan rate is static.
  */
  const weekAlreadySavedInDatabase = Boolean(
    isHiringPlanSnapshotLocked ||
      activeWeek?.lockedByDatabase ||
      activeWeek?.hasSavedSnapshot ||
      activeWeek?.lockedByInheritedLatestRate,
  );

  /*
    Hiring Plan dropdown is disabled when:
    - user is not HR / HR Admin, OR
    - selected week is already database/inherited locked.
  */
  const hiringPlanControlLocked =
    !canManageHiringPlanPercent || weekAlreadySavedInDatabase;

  const displayedHiringPlanPercent = weekAlreadySavedInDatabase
    ? getWeekHiringPlanPercent(activeWeek, selectedHiringPlanPercent)
    : Number(selectedHiringPlanPercent || 5);

  const normalizedAssignedAccounts = useMemo(
    () => normalizeAssignedAccounts(user, assignedAccounts),
    [user, assignedAccounts],
  );

  const assignedAccountNames = useMemo(() => {
    return new Set(
      normalizedAssignedAccounts
        .map((account) => getAccountName(account))
        .filter(Boolean),
    );
  }, [normalizedAssignedAccounts]);

  const assignedClusterNames = useMemo(() => {
    return new Set(
      normalizedAssignedAccounts
        .map((account) => getClusterNameFromAccount(account))
        .filter(Boolean),
    );
  }, [normalizedAssignedAccounts]);

  const visibleClusterOptions = useMemo(() => {
    if (canViewAllAccounts) return CLUSTER_OPTIONS;

    return CLUSTER_OPTIONS.filter((cluster) =>
      assignedClusterNames.has(cluster),
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

  const canLockWeeklyPlan =
    canManageHiringPlanPercent &&
    typeof onLockWeeklyHiringPlan === "function" &&
    !weekAlreadySavedInDatabase &&
    !lockingWeeklyPlan &&
    !accountsLoading &&
    !weeksLoading &&
    !!activeWeek &&
    !!selectedHiringPlanPercent &&
    Number(filteredPlansCount || 0) > 0;

  useEffect(() => {
    if (canViewAllAccounts) return;

    const selectedRealClusters = selectedClusters.filter(
      (cluster) => cluster !== "All",
    );

    const hasInvalidCluster = selectedRealClusters.some(
      (cluster) => !assignedClusterNames.has(cluster),
    );

    if (hasInvalidCluster) {
      setSelectedClusters(["All"]);
    }

    const selectedRealAccounts = selectedAccounts.filter(
      (account) => account !== "All",
    );

    const hasInvalidAccount = selectedRealAccounts.some(
      (account) => !assignedAccountNames.has(account),
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

  useEffect(() => {
    if (hiringPlanControlLocked) {
      setShowHiringPlanDropdown(false);
    }
  }, [hiringPlanControlLocked]);

  function closeOtherDropdowns(except = "") {
    if (except !== "week") setShowWeekDropdown(false);
    if (except !== "cluster") setShowClusterDropdown(false);
    if (except !== "account") setShowAccountDropdown(false);
    if (except !== "hiringPlan") setShowHiringPlanDropdown(false);
  }

  function handleWeeklyVersionChange(week) {
    setActiveWeekId(week.id);
    setSelectedClusters(["All"]);
    setSelectedAccounts(["All"]);
    setWeekSearch?.("");
    setShowWeekDropdown(false);
    setShowHiringPlanDropdown(false);

    const weekPercent = getWeekHiringPlanPercent(week, selectedHiringPlanPercent);
    setSelectedHiringPlanPercent?.(weekPercent);
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

  function getLockButtonTitle() {
    if (!canManageHiringPlanPercent) {
      return "Only HR and HR Admin can lock the hiring plan percentage.";
    }

    if (weekAlreadySavedInDatabase) {
      return "This selected week already has a saved hiring plan snapshot in the database.";
    }

    if (!activeWeek) {
      return "Select a weekly version first.";
    }

    if (!selectedHiringPlanPercent) {
      return "Select a hiring plan percentage first.";
    }

    if (accountsLoading || weeksLoading) {
      return "Please wait until weekly records are loaded.";
    }

    if (Number(filteredPlansCount || 0) <= 0) {
      return "No affected account records found for this selected week.";
    }

    return "Save all affected account records for the selected week.";
  }

  return (
    <div className="relative z-[100] overflow-visible bg-white">
      <div className="border-b border-[#E6ECF2] px-5 py-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <Filter size={14} />
              Weekly Filters
            </div>

            <h2 className="mt-3 text-lg font-extrabold text-sibs-primary-1">
              Weekly Hiring Plan Filters
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Select weekly version, cluster, account, and hiring plan
              percentage. HR and HR Admin can lock the latest editable hiring
              plan rate.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${
                weekLockedForDisplay
                  ? "border-gray-200 bg-gray-50 text-gray-600"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {weekLockedForDisplay ? <Lock size={13} /> : <Unlock size={13} />}
              {weekLockedForDisplay ? "Locked" : "Editable"}
            </span>

            {weekAlreadySavedInDatabase && (
              <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                Static Hiring Plan: {displayedHiringPlanPercent}%
              </span>
            )}

            {weekLockedForDisplay && !weekAlreadySavedInDatabase && (
              <span className="inline-flex w-fit rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                Previous Week Display Lock
              </span>
            )}

            {isRestrictedManager && (
              <span className="inline-flex rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                Manager View: Assigned Accounts Only
              </span>
            )}

            {!canManageHiringPlanPercent && (
              <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                View only: Hiring Plan %
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

      <div className="overflow-visible px-5 py-5">
        <div
          className={`grid grid-cols-1 gap-3 overflow-visible ${
            canManageHiringPlanPercent
              ? "xl:grid-cols-[1.25fr_1fr_1fr_1fr_auto]"
              : "xl:grid-cols-[1.25fr_1fr_1fr_1fr]"
          } xl:items-end`}
        >
          <div
            ref={weekDropdownRef}
            className="relative z-[80] overflow-visible"
          >
            <label className="mb-1 block text-sm font-bold text-[#101828]">
              Weekly Version
            </label>

            <button
              type="button"
              onClick={() => {
                if (weeksLoading) return;

                setShowWeekDropdown((prev) => !prev);
                setWeekSearch?.("");
                closeOtherDropdowns("week");
              }}
              disabled={weeksLoading}
              className={`flex h-11 w-full items-center justify-between ${EDGE} border border-[#D0D5DD] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10`}
            >
              <span className="truncate">
                {weeksLoading
                  ? "Loading weekly versions..."
                  : formatWeeklyVersionDisplay(activeWeek) ||
                    "Select weekly version"}
              </span>

              <ChevronDown
                size={18}
                className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
                  showWeekDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatedDropdown open={showWeekDropdown && !weeksLoading}>
              <div className="max-h-72 overflow-y-auto py-2 sibs-scrollbar">
                {filteredWeeklyVersions.length > 0 ? (
                  filteredWeeklyVersions.map((week) => {
                    const isSelected = week.id === activeWeekId;
                    const weekDisplayLocked = Boolean(week.locked);
                    const weekSavedInDatabase = Boolean(
                      week.lockedByDatabase ||
                        week.hasSavedSnapshot ||
                        week.lockedByInheritedLatestRate,
                    );

                    const weekPercent =
                      getWeekHiringPlanPercent(week) ||
                      Number(week.latestLockedHiringPlanPercent || 5);

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

                            {weekSavedInDatabase && (
                              <p className="mt-1 truncate text-[11px] font-bold text-sibs-tertiary-5">
                                Static Hiring Plan: {weekPercent}%
                              </p>
                            )}

                            {weekDisplayLocked && !weekSavedInDatabase && (
                              <p className="mt-1 truncate text-[11px] font-bold text-amber-600">
                                No snapshot yet
                              </p>
                            )}
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                              weekDisplayLocked
                                ? "border-gray-200 bg-gray-50 text-gray-600"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {weekDisplayLocked ? "Locked" : "Editable"}
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-3 text-sm font-semibold text-sibs-tertiary-5">
                    No weekly versions available.
                  </div>
                )}
              </div>
            </AnimatedDropdown>
          </div>

          <div
            ref={clusterDropdownRef}
            className="relative z-[70] overflow-visible"
          >
            <label className="mb-1 block text-sm font-bold text-[#101828]">
              Cluster
            </label>

            <button
              type="button"
              onClick={() => {
                setShowClusterDropdown((prev) => !prev);
                closeOtherDropdowns("cluster");
              }}
              className={`flex h-11 w-full items-center justify-between ${EDGE} border border-[#D0D5DD] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10`}
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

          <div
            ref={accountDropdownRef}
            className="relative z-[60] overflow-visible"
          >
            <label className="mb-1 block text-sm font-bold text-[#101828]">
              Account
            </label>

            <div className="relative overflow-visible">
              <input
                type="text"
                value={
                  showAccountDropdown
                    ? accountSearch
                    : accountsLoading
                      ? "Loading accounts..."
                      : getAccountFilterLabel(
                          selectedAccounts,
                          isRestrictedManager,
                        )
                }
                onChange={(e) => {
                  setAccountSearch(e.target.value);
                  setShowAccountDropdown(true);
                  closeOtherDropdowns("account");
                }}
                onFocus={() => {
                  if (!accountsLoading) {
                    setShowAccountDropdown(true);
                    setAccountSearch("");
                    closeOtherDropdowns("account");
                  }
                }}
                disabled={accountsLoading}
                placeholder="Search accounts..."
                autoComplete="off"
                className={`h-11 w-full ${EDGE} border border-[#D0D5DD] bg-white px-4 pr-11 text-sm font-bold text-[#344054] outline-none transition disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-sibs-tertiary-5 hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10`}
              />

              <ChevronDown
                size={18}
                onClick={() => {
                  if (!accountsLoading) {
                    setShowAccountDropdown((prev) => !prev);
                    setAccountSearch("");
                    closeOtherDropdowns("account");
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

          <div
            ref={hiringPlanDropdownRef}
            className="relative z-[50] overflow-visible"
          >
            <label className="mb-1 block text-sm font-bold text-[#101828]">
              Hiring Plan (%)
            </label>

            <button
              type="button"
              onClick={() => {
                if (hiringPlanControlLocked) return;

                setShowHiringPlanDropdown((prev) => !prev);
                closeOtherDropdowns("hiringPlan");
              }}
              disabled={hiringPlanControlLocked}
              className={`flex h-11 w-full items-center justify-between ${EDGE} border px-4 text-left text-sm font-bold outline-none transition ${
                hiringPlanControlLocked
                  ? "cursor-not-allowed border-[#D6DEE8] bg-[#F2F4F7] text-sibs-tertiary-5"
                  : "border-[#D0D5DD] bg-white text-[#344054] hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              }`}
              title={
                !canManageHiringPlanPercent
                  ? "Only HR and HR Admin can edit the hiring plan percentage."
                  : weekAlreadySavedInDatabase
                    ? "This selected week already has a saved hiring plan snapshot. Hiring plan percentage can no longer be changed."
                    : "Select hiring plan percentage"
              }
            >
              <span className="truncate">{displayedHiringPlanPercent}%</span>

              <ChevronDown
                size={18}
                className={`shrink-0 transition-transform duration-300 ${
                  hiringPlanControlLocked
                    ? "text-sibs-tertiary-5/60"
                    : "text-sibs-tertiary-5"
                } ${
                  showHiringPlanDropdown && !hiringPlanControlLocked
                    ? "rotate-180"
                    : ""
                }`}
              />
            </button>

            <AnimatedDropdown open={showHiringPlanDropdown && !hiringPlanControlLocked}>
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

          {canManageHiringPlanPercent && (
            <button
              type="button"
              onClick={canLockWeeklyPlan ? onLockWeeklyHiringPlan : undefined}
              disabled={!canLockWeeklyPlan}
              className={`inline-flex h-11 items-center justify-center gap-2 ${EDGE} border px-5 text-sm font-bold transition active:scale-[0.98] ${
                canLockWeeklyPlan
                  ? "border-sibs-primary-1 bg-sibs-primary-1 text-white hover:bg-sibs-primary-1/95 hover:shadow-sm"
                  : weekAlreadySavedInDatabase
                    ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500"
                    : "cursor-not-allowed border-[#D6DEE8] bg-[#F2F4F7] text-sibs-tertiary-5"
              }`}
              title={getLockButtonTitle()}
            >
              {lockingWeeklyPlan ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving...
                </>
              ) : weekAlreadySavedInDatabase ? (
                <>
                  <Lock size={17} />
                  Locked
                </>
              ) : (
                <>
                  <Save size={17} />
                  Lock
                </>
              )}
            </button>
          )}
        </div>

        <p className="mt-3 text-xs font-semibold text-sibs-tertiary-5">
          Only HR and HR Admin can edit and lock the Hiring Plan %. Other users
          can view the selected/static hiring rate only.
        </p>
      </div>
    </div>
  );
}