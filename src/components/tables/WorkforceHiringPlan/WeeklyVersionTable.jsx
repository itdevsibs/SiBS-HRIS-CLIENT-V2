import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { useWorkforceHiring } from "../../../services/context/WorkforceHiringContext";

const CLUSTER_OPTIONS = [
  "Coast Dental",
  "US Visa",
  "SME",
  "Yomdel",
  "Corporate",
];

const FULL_ACCESS_ROLES = new Set([
  "ta",
  "talent_acquisition",
  "recruitment",
  "recruiter",
  "hr",
  "hr_admin",
  "hradmin",
  "hr_manager",
  "hr_staff",
  "human_resources",
  "human_resource",
  "human_resources_admin",
  "human_resource_admin",
  "super_admin",
  "superadmin",
]);

const EDGE = "rounded-[10px]";

function getText(value) {
  return String(value || "").trim();
}

function normalizeRoleKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getLocalStorageValue(keys = []) {
  if (typeof window === "undefined") return "";

  for (const key of keys) {
    const value = window.localStorage.getItem(key);

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }

  return "";
}

function getUserRoleCandidates(user) {
  return [
    user?.role,
    user?.userRole,
    user?.user_role,
    user?.adminRole,
    user?.admin_role,
    user?.roleName,
    user?.role_name,
    user?.userRoleName,
    user?.user_role_name,
    user?.position,
    user?.positionName,
    user?.position_name,
    user?.jobTitle,
    user?.job_title,
    user?.designation,
    user?.employeeRole,
    user?.employee_role,
    user?.department,
    user?.departmentName,
    user?.department_name,
    user?.deptName,
    user?.dept_name,
    getLocalStorageValue([
      "role",
      "userRole",
      "user_role",
      "adminRole",
      "admin_role",
      "roleName",
      "role_name",
      "userRoleName",
      "user_role_name",
      "position",
      "positionName",
      "position_name",
      "jobTitle",
      "job_title",
      "designation",
      "employeeRole",
      "employee_role",
      "department",
      "departmentName",
      "department_name",
      "deptName",
      "dept_name",
    ]),
  ].filter((value) => String(value ?? "").trim() !== "");
}

function getCurrentAdminAccess(user) {
  const value =
    user?.adminAccess ??
    user?.admin_access ??
    user?.gy_user_access ??
    user?.access ??
    user?.adminLevel ??
    user?.admin_level ??
    user?.adminAccessLevel ??
    user?.admin_access_level ??
    user?.isAdmin ??
    user?.is_admin ??
    getLocalStorageValue([
      "adminAccess",
      "admin_access",
      "gy_user_access",
      "access",
      "adminLevel",
      "admin_level",
      "adminAccessLevel",
      "admin_access_level",
      "isAdmin",
      "is_admin",
    ]) ??
    0;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function isFullAccessRoleValue(value) {
  const role = normalizeRoleKey(value);

  if (!role) return false;

  if (FULL_ACCESS_ROLES.has(role)) return true;
  if (role.includes("human_resource")) return true;
  if (role.includes("human_resources")) return true;

  return false;
}

function canViewAllWeeklyAccounts(user) {
  const roleCandidates = getUserRoleCandidates(user);
  const adminAccess = getCurrentAdminAccess(user);

  return roleCandidates.some(isFullAccessRoleValue) || adminAccess === 7;
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

function DropdownPortal({
  open,
  anchorRef,
  children,
  onClose,
  maxHeight = 256,
  minWidth = 0,
  className = "",
}) {
  const dropdownRef = useRef(null);
  const [style, setStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight,
  });

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) return undefined;

    function updatePosition() {
      const anchor = anchorRef.current;

      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const viewportWidth =
        window.innerWidth || document.documentElement.clientWidth || 0;
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight || 0;

      const gap = 8;
      const safePadding = 8;
      const dropdownWidth = Math.max(rect.width, minWidth);
      const spaceBelow = viewportHeight - rect.bottom - gap - safePadding;
      const spaceAbove = rect.top - gap - safePadding;
      const shouldOpenUp = spaceBelow < 180 && spaceAbove > spaceBelow;

      const availableHeight = shouldOpenUp ? spaceAbove : spaceBelow;
      const cleanMaxHeight = Math.max(
        160,
        Math.min(maxHeight, Math.max(availableHeight, 160)),
      );

      const top = shouldOpenUp
        ? Math.max(safePadding, rect.top - cleanMaxHeight - gap)
        : Math.min(
            rect.bottom + gap,
            viewportHeight - cleanMaxHeight - safePadding,
          );

      const maxLeft = Math.max(
        safePadding,
        viewportWidth - dropdownWidth - safePadding,
      );

      const left = Math.min(Math.max(safePadding, rect.left), maxLeft);

      setStyle({
        top,
        left,
        width: dropdownWidth,
        maxHeight: cleanMaxHeight,
      });
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, maxHeight, minWidth, open]);

  useEffect(() => {
    if (!open) return undefined;

    function handleClickOutside(e) {
      const clickedAnchor = anchorRef?.current?.contains(e.target);
      const clickedDropdown = dropdownRef.current?.contains(e.target);

      if (!clickedAnchor && !clickedDropdown) {
        onClose?.();
      }
    }

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [anchorRef, onClose, open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dropdownRef}
      onMouseDownCapture={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStartCapture={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className={`fixed z-[999999] overflow-hidden ${EDGE} border border-[#D7DEE8] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] ${className}`}
      style={{
        top: `${style.top}px`,
        left: `${style.left}px`,
        width: `${style.width}px`,
      }}
    >
      <div
        className="sibs-scrollbar overflow-y-auto py-2"
        style={{ maxHeight: `${style.maxHeight}px` }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export default function WeeklyVersionTable(props = {}) {
  const weeklyPlan = useWorkforceHiring(true) || {};
  const {
    weekDropdownRef,
    clusterDropdownRef,
    accountDropdownRef,

    activeWeek,
    activeWeekId,
    setActiveWeekId,

    weeksLoading = false,
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

    isAllClustersSelected,
    isAllAccountsSelected,
    handleToggleCluster,
    handleToggleAccount,

    user = null,
    assignedAccounts = [],
  } = {
    ...(weeklyPlan.weeklyVersion || {}),
    ...props,
  };
  const weekButtonRef = useRef(null);
  const clusterButtonRef = useRef(null);
  const accountInputRef = useRef(null);

  const canViewAllAccounts = canViewAllWeeklyAccounts(user);
  const isRestrictedManager = !canViewAllAccounts;

  const normalizedAssignedAccounts = normalizeAssignedAccounts(
    user,
    assignedAccounts,
  );

  const assignedAccountNames = new Set(
    normalizedAssignedAccounts
      .map((account) => getAccountName(account))
      .filter(Boolean),
  );

  const assignedClusterNames = new Set(
    normalizedAssignedAccounts
      .map((account) => getClusterNameFromAccount(account))
      .filter(Boolean),
  );

  const visibleClusterOptions = canViewAllAccounts
    ? CLUSTER_OPTIONS
    : CLUSTER_OPTIONS.filter((cluster) => assignedClusterNames.has(cluster));

  const visibleAccountOptions = canViewAllAccounts
    ? filteredAccountOptions
    : filteredAccountOptions.filter((account) => {
        const accountName = getAccountName(account);
        return assignedAccountNames.has(accountName);
      });

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

  useEffect(() => {
    if (canViewAllAccounts) return;

    const selectedRealClusters = selectedClusters.filter(
      (cluster) => cluster !== "All",
    );

    const hasInvalidCluster = selectedRealClusters.some(
      (cluster) => !assignedClusterNames.has(cluster),
    );

    if (hasInvalidCluster) {
      setSelectedClusters?.(["All"]);
    }

    const selectedRealAccounts = selectedAccounts.filter(
      (account) => account !== "All",
    );

    const hasInvalidAccount = selectedRealAccounts.some(
      (account) => !assignedAccountNames.has(account),
    );

    if (hasInvalidAccount) {
      setSelectedAccounts?.(["All"]);
    }
    // The assigned sets are derived directly from the current props above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canViewAllAccounts,
    selectedAccounts,
    selectedClusters,
    setSelectedAccounts,
    setSelectedClusters,
  ]);

  function closeOtherDropdowns(except = "") {
    if (except !== "week") setShowWeekDropdown?.(false);
    if (except !== "cluster") setShowClusterDropdown?.(false);
    if (except !== "account") setShowAccountDropdown?.(false);
  }

  function handleWeeklyVersionChange(week) {
    setActiveWeekId?.(week.id);
    setSelectedClusters?.(["All"]);
    setSelectedAccounts?.(["All"]);
    setWeekSearch?.("");
    setShowWeekDropdown?.(false);
  }

  function handleClusterClick(cluster) {
    if (
      cluster !== "All" &&
      isRestrictedManager &&
      !assignedClusterNames.has(cluster)
    ) {
      return;
    }

    handleToggleCluster?.(cluster);
  }

  function handleAccountClick(accountName) {
    if (
      accountName !== "All" &&
      isRestrictedManager &&
      !assignedAccountNames.has(accountName)
    ) {
      return;
    }

    handleToggleAccount?.(accountName);
    setAccountSearch?.("");
  }

  return (
    <div className="relative z-[100] w-full overflow-visible">
      <div className="flex w-full justify-start xl:justify-end">
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:w-auto xl:grid-cols-[minmax(280px,410px)_minmax(220px,290px)_minmax(240px,340px)] xl:items-end">
          <div
            ref={weekDropdownRef}
            className="relative z-[80] min-w-0 overflow-visible"
          >
            <label className="mb-1 block text-sm font-bold text-[#101828]">
              Weekly Version
            </label>

            <button
              ref={weekButtonRef}
              type="button"
              onClick={() => {
                if (weeksLoading) return;

                setShowWeekDropdown?.((prev) => !prev);
                setWeekSearch?.("");
                closeOtherDropdowns("week");
              }}
              disabled={weeksLoading}
              className={`flex h-11 w-full items-center justify-between ${EDGE} border border-[#D0D5DD] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10`}
            >
              <span className="min-w-0 truncate">
                {weeksLoading
                  ? "Loading weekly versions..."
                  : formatWeeklyVersionDisplay(activeWeek) ||
                    "Select weekly version"}
              </span>

              <ChevronDown
                size={18}
                className={`ml-2 shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
                  showWeekDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            <DropdownPortal
              open={showWeekDropdown && !weeksLoading}
              anchorRef={weekButtonRef}
              maxHeight={288}
              onClose={() => setShowWeekDropdown?.(false)}
            >
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
                      <p className="truncate font-bold">
                        {formatWeekLabel(week)}
                      </p>

                      <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
                        {week.weekRange || "—"}
                      </p>
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-3 text-sm font-semibold text-sibs-tertiary-5">
                  No weekly versions available.
                </div>
              )}
            </DropdownPortal>
          </div>

          <div
            ref={clusterDropdownRef}
            className="relative z-[70] min-w-0 overflow-visible"
          >
            <label className="mb-1 block text-sm font-bold text-[#101828]">
              Cluster
            </label>

            <button
              ref={clusterButtonRef}
              type="button"
              onClick={() => {
                setShowClusterDropdown?.((prev) => !prev);
                closeOtherDropdowns("cluster");
              }}
              className={`flex h-11 w-full items-center justify-between ${EDGE} border border-[#D0D5DD] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10`}
            >
              <span className="min-w-0 truncate">
                {getClusterFilterLabel(selectedClusters, isRestrictedManager)}
              </span>

              <ChevronDown
                size={18}
                className={`ml-2 shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
                  showClusterDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            <DropdownPortal
              open={showClusterDropdown}
              anchorRef={clusterButtonRef}
              maxHeight={256}
              onClose={() => setShowClusterDropdown?.(false)}
            >
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

                <span className="truncate">
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
            </DropdownPortal>
          </div>

          <div
            ref={accountDropdownRef}
            className="relative z-[60] min-w-0 overflow-visible sm:col-span-2 lg:col-span-1"
          >
            <label className="mb-1 block text-sm font-bold text-[#101828]">
              Account
            </label>

            <div className="relative overflow-visible">
              <input
                ref={accountInputRef}
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
                  setAccountSearch?.(e.target.value);
                  setShowAccountDropdown?.(true);
                  closeOtherDropdowns("account");
                }}
                onFocus={() => {
                  if (!accountsLoading) {
                    setShowAccountDropdown?.(true);
                    setAccountSearch?.("");
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
                    setShowAccountDropdown?.((prev) => !prev);
                    setAccountSearch?.("");
                    closeOtherDropdowns("account");
                  }
                }}
                className={`absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-sibs-tertiary-5 transition-transform duration-300 ${
                  showAccountDropdown ? "rotate-180" : ""
                }`}
              />

              <DropdownPortal
                open={showAccountDropdown && !accountsLoading}
                anchorRef={accountInputRef}
                maxHeight={256}
                onClose={() => setShowAccountDropdown?.(false)}
              >
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

                  <span className="truncate">
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
              </DropdownPortal>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
