import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getWorkforceHiringPlanAccounts,
  getWorkforceHiringPlanAccountTrends,
  getWorkforceHiringPlanSixWeekTable,
  getWorkforceHiringPlanForecast,
  getWorkforceHiringPlanWeeks,
  lockWorkforceHiringPlanSnapshot,
  openWorkforceHiringPlanFile,
  saveRequiredHeadcount,
  saveWorkforceHiringPlanActionItem,
  updateWorkforceHiringPlanFile,
} from "../../lib/axios/getWorkforceHiringPlan";
import { useUser } from "../../services/context/UserContext";
import { useRegisterWorkforceHiringPage } from "../../services/context/WorkforceHiringContext";
import useWorkforceHiringAi from "./useWorkforceHiringAi";
import {
  allWeeklyAccountOption,
  FULL_WEEKLY_ACCESS_ROLES,
  initialWeeklyActionItemForm,
} from "../../lib/utils/workforceHiringPlan/workforceHiringPlanConstants";
import {
  buildWeekKey,
  buildWeeklyAccess,
  calculateActualHiringRatePercent,
  calculateLeadsFromInterview,
  calculatePipelineStatus,
  canManageHiringPlanByRole,
  canManagerUpdateApprovedHeadcount,
  getAccountIdFromAny,
  getAccountNameFromAny,
  getBackendNumber,
  getBackendSixWeekSeries,
  getClusterFromAny,
  getCurrentAdminAccess,
  getCurrentRoleKey,
  getDisplayRequiredHeadcount,
  getGhlNameFromAny,
  getHeadcountApprovalStatus,
  getLocalStorageValue,
  getLoggedInOwnerDisplay,
  getRecruitmentSettingsStatus,
  getSelectedWeekEnd,
  getSelectedWeekStart,
  getUpdateHeadcountStatus,
  getWeekHiringPlanPercent,
  hasActiveRecruitmentSettingsRequest,
  isApprovedRecruitmentSettingsRequest,
  isHrEditorByUser,
} from "../../lib/utils/workforceHiringPlan/workforceHiringPlanHelpers";

function formatForecastWeekDate(value, includeYear = false) {
  if (!value) return "";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  });
}

function formatForecastWeekRange(startDate, endDate) {
  const startLabel = formatForecastWeekDate(startDate, false);
  const endLabel = formatForecastWeekDate(endDate, true);

  if (!startLabel || !endLabel) return "";

  return `${startLabel} - ${endLabel}`;
}

function isAllWorkforceFilterValue(value) {
  const cleanValue = String(value || "").trim();

  return (
    !cleanValue ||
    cleanValue === "All" ||
    cleanValue === "All Clusters" ||
    cleanValue === "All Accounts"
  );
}

function normalizeWorkforceFilterRequestValue(values, fallback = "All") {
  const cleanValues = (Array.isArray(values) ? values : [values])
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  const realValues = cleanValues.filter(
    (value) => !isAllWorkforceFilterValue(value),
  );

  if (realValues.length > 0) {
    return realValues.join(",");
  }

  return fallback;
}

export default function useWorkforceHiringPage() {
  const { user } = useUser();

  const canManageHiringPlanPercent = canManageHiringPlanByRole(user);

  const mainScrollRef = useRef(null);
  const weekDropdownRef = useRef(null);
  const clusterDropdownRef = useRef(null);
  const accountDropdownRef = useRef(null);
  const editedRequiredInputsRef = useRef(new Set());

  const adminAccessValue = getCurrentAdminAccess(user);

  const assignedAccountAccessValues = Array.isArray(user?.assignedAccounts)
    ? user.assignedAccounts.map((account) =>
        Number(
          account?.adminAccess ?? account?.admin_access ?? account?.access ?? 0,
        ),
      )
    : [];

  const hasManagerAssignedAccess = assignedAccountAccessValues.includes(5);
  const userRoleValue = getCurrentRoleKey(user);

  const isHrOrHrAdmin = isHrEditorByUser(user);

  const isManagerOrOps =
    adminAccessValue === 5 ||
    hasManagerAssignedAccess ||
    userRoleValue.includes("manager") ||
    userRoleValue === "om" ||
    userRoleValue === "som" ||
    userRoleValue === "operation_manager" ||
    userRoleValue === "operations_manager" ||
    userRoleValue === "senior_operations_manager";

  const canEditRequiredHeadcount = Boolean(isHrOrHrAdmin || isManagerOrOps);

  const [weeklyVersions, setWeeklyVersions] = useState([]);
  const [activeWeekId, setActiveWeekId] = useState("");
  const [weeksLoading, setWeeksLoading] = useState(false);
  const [, setLockingWeeklyPlan] = useState(false);
  const [databaseLockedWeekKeys, setDatabaseLockedWeekKeys] = useState(
    new Set(),
  );

  const [search] = useState("");
  const [weekSearch, setWeekSearch] = useState("");
  const [showWeekDropdown, setShowWeekDropdown] = useState(false);

  const [selectedClusters, setSelectedClusters] = useState(["All"]);
  const [showClusterDropdown, setShowClusterDropdown] = useState(false);

  const [selectedAccounts, setSelectedAccounts] = useState(["All"]);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");

  const [selectedHiringPlanPercent, setSelectedHiringPlanPercent] = useState(5);

  const [accountOptions, setAccountOptions] = useState([
    allWeeklyAccountOption,
  ]);

  const [remoteAccounts, setRemoteAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [actionItemTarget, setActionItemTarget] = useState(null);
  const [actionItemForm, setActionItemForm] = useState(
    initialWeeklyActionItemForm,
  );
  const [actionItemSubmitting, setActionItemSubmitting] = useState(false);
  const [showKpiSnapshot, setShowKpiSnapshot] = useState(false);

  const [requiredInputs, setRequiredInputs] = useState({});
  const [savingRequiredId, setSavingRequiredId] = useState("");
  const [weeklyPlanFiles, setWeeklyPlanFiles] = useState({});
  const [savingFileId, setSavingFileId] = useState("");
  const [openingFile, setOpeningFile] = useState(false);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });
  const [trendData, setTrendData] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState("");
  const [sixWeekTableRows, setSixWeekTableRows] = useState([]);
  const [sixWeekTableWeeks, setSixWeekTableWeeks] = useState([]);
  const [sixWeekTableLoading, setSixWeekTableLoading] = useState(false);
  const [sixWeekTableError, setSixWeekTableError] = useState("");

  const [forecastRows, setForecastRows] = useState([]);
  const [forecastWeeks, setForecastWeeks] = useState([]);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState("");
  const [selectedForecastWeekId, setSelectedForecastWeekId] = useState("");

  const activeWeek =
    weeklyVersions.find((week) => week.id === activeWeekId) ||
    weeklyVersions[0];

  const selectedForecastWeek =
    forecastWeeks.find((week) => week.id === selectedForecastWeekId) ||
    forecastWeeks[0] ||
    null;

  const activeWeekKey = buildWeekKey(activeWeek);

  const isHiringPlanSnapshotLocked = Boolean(
    activeWeek?.lockedByDatabase || databaseLockedWeekKeys.has(activeWeekKey),
  );

  const activeWeekStartDate = activeWeek?.startDate || "";
  const activeWeekEndDate = activeWeek?.endDate || "";

  const weeklyAccess = useMemo(() => buildWeeklyAccess(user), [user]);

  const userAccessReady = useMemo(() => {
    if (!user && !getLocalStorageValue(["role", "userRole", "adminRole"])) {
      return false;
    }

    const role = getCurrentRoleKey(user);

    if (FULL_WEEKLY_ACCESS_ROLES.includes(role)) {
      return true;
    }

    return Array.isArray(user?.assignedAccounts);
  }, [user]);

  const filteredWeeklyVersions = useMemo(() => {
    const keyword = weekSearch.trim().toLowerCase();

    if (!keyword) return weeklyVersions;

    return weeklyVersions.filter((week) => {
      const searchableText = [
        week.label,
        week.weekRange,
        week.startDate,
        week.endDate,
        week.locked ? "Locked" : "Editable",
        week.lockedByDatabase ? "Saved Snapshot" : "No Snapshot",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [weeklyVersions, weekSearch]);

  const selectedClusterRequestValue = useMemo(
    () => normalizeWorkforceFilterRequestValue(selectedClusters, "All"),
    [selectedClusters],
  );

  const selectedAccountRequestValue = useMemo(
    () => normalizeWorkforceFilterRequestValue(selectedAccounts, "All"),
    [selectedAccounts],
  );

  const fetchSixWeekTrends = useCallback(async () => {
    const weekStart = getSelectedWeekStart(activeWeek);
    const weekEnd = getSelectedWeekEnd(activeWeek);

    if (!weekStart || !weekEnd) {
      setTrendData(null);
      return;
    }

    try {
      setTrendsLoading(true);
      setTrendsError("");

      const result = await getWorkforceHiringPlanAccountTrends({
        cluster: selectedClusterRequestValue,
        account: selectedAccountRequestValue,
        weekStart,
        weekEnd,
        startDate: weekStart,
        endDate: weekEnd,
      });

      setTrendData(result);
    } catch (error) {
      console.error("FETCH 6-WEEK TRENDS ERROR:", error);
      setTrendData(null);
      setTrendsError(error?.message || "Failed to fetch 6-week trends.");
    } finally {
      setTrendsLoading(false);
    }
  }, [activeWeek, selectedAccountRequestValue, selectedClusterRequestValue]);

  useEffect(() => {
    fetchSixWeekTrends();
  }, [fetchSixWeekTrends]);

  useEffect(() => {
    let cancelled = false;

    async function fetchSixWeekTable() {
      const selectedWeek = activeWeek;

      if (!selectedWeek?.weekStart && !selectedWeek?.startDate) {
        setSixWeekTableRows([]);
        setSixWeekTableWeeks([]);
        setSixWeekTableError("");
        return;
      }

      const weekStart = selectedWeek.weekStart || selectedWeek.startDate;
      const weekEnd = selectedWeek.weekEnd || selectedWeek.endDate;

      const selectedCluster = selectedClusterRequestValue;
      const selectedAccount = selectedAccountRequestValue;

      setSixWeekTableLoading(true);
      setSixWeekTableError("");

      try {
        const result = await getWorkforceHiringPlanSixWeekTable({
          cluster: selectedCluster || "All",
          account: selectedAccount || "All",
          weekStart,
          weekEnd,
          startDate: weekStart,
          endDate: weekEnd,
        });

        if (cancelled) return;

        if (!result?.success) {
          setSixWeekTableRows([]);
          setSixWeekTableWeeks([]);
          setSixWeekTableError(
            result?.message || "Failed to load six-week table data.",
          );
          return;
        }

        setSixWeekTableRows(Array.isArray(result.data) ? result.data : []);
        setSixWeekTableWeeks(Array.isArray(result.weeks) ? result.weeks : []);
        setSixWeekTableError("");
      } catch (error) {
        if (cancelled) return;

        console.error("Fetch six-week table error:", error);

        setSixWeekTableRows([]);
        setSixWeekTableWeeks([]);
        setSixWeekTableError(
          error?.message || "Failed to load six-week table data.",
        );
      } finally {
        if (!cancelled) {
          setSixWeekTableLoading(false);
        }
      }
    }

    fetchSixWeekTable();

    return () => {
      cancelled = true;
    };
  }, [activeWeek, selectedAccountRequestValue, selectedClusterRequestValue]);

  useEffect(() => {
    let cancelled = false;

    async function fetchForecastData() {
      const selectedWeek = activeWeek;

      if (!selectedWeek?.weekStart && !selectedWeek?.startDate) {
        setForecastRows([]);
        setForecastWeeks([]);
        setForecastError("");
        setSelectedForecastWeekId("");
        return;
      }

      const weekStart = selectedWeek.weekStart || selectedWeek.startDate;
      const weekEnd = selectedWeek.weekEnd || selectedWeek.endDate;

      const selectedCluster = selectedClusterRequestValue;
      const selectedAccount = selectedAccountRequestValue;

      setForecastLoading(true);
      setForecastError("");

      try {
        const result = await getWorkforceHiringPlanForecast({
          cluster: selectedCluster || "All",
          account: selectedAccount || "All",
          weekStart,
          weekEnd,
          startDate: weekStart,
          endDate: weekEnd,
          basisWeeks: 6,
          forecastWeeks: 6,
          gapWeeks: 4,
        });

        if (cancelled) return;

        if (!result?.success) {
          setForecastRows([]);
          setForecastWeeks([]);
          setForecastError(result?.message || "Failed to load forecast data.");
          setSelectedForecastWeekId("");
          return;
        }

        const rows = Array.isArray(result.data) ? result.data : [];

        const weeksFromResponse = Array.isArray(result.forecastWeeksData)
          ? result.forecastWeeksData
          : Array.isArray(result.forecast_weeks_data)
            ? result.forecast_weeks_data
            : rows;

        const nextForecastWeeks = weeksFromResponse.map((week, index) => {
          const row = rows[index] || {};
          const weekStartValue =
            week.weekStart ||
            week.week_start ||
            row.weekStart ||
            row.week_start ||
            "";
          const weekEndValue =
            week.weekEnd || week.week_end || row.weekEnd || row.week_end || "";
          const weekNumber =
            week.weekNumber ||
            week.week_number ||
            row.weekNumber ||
            row.week_number ||
            index + 1;
          const year =
            week.year ||
            row.year ||
            (weekStartValue
              ? new Date(`${weekStartValue}T00:00:00`).getFullYear()
              : "");

          return {
            id: `FORECAST-WEEK-${weekNumber}-${weekStartValue || index}`,
            originalId: `FORECAST-WEEK-${weekNumber}-${weekStartValue || index}`,
            year,
            weekNumber,
            label: `${year} Week ${weekNumber}`,
            weekRange:
              weekStartValue && weekEndValue
                ? formatForecastWeekRange(weekStartValue, weekEndValue)
                : week.label || row.label || `Forecast Week ${index + 1}`,
            startDate: weekStartValue,
            endDate: weekEndValue,
            weekStart: weekStartValue,
            weekEnd: weekEndValue,
            week_start: weekStartValue,
            week_end: weekEndValue,
            type: "forecast",
            forecast: true,
            isForecast: true,
            sourceRow: row,
          };
        });

        setForecastRows(rows);
        setForecastWeeks(nextForecastWeeks);
        setForecastError("");

        setSelectedForecastWeekId((currentId) => {
          const stillExists = nextForecastWeeks.some(
            (week) => week.id === currentId,
          );

          return stillExists ? currentId : nextForecastWeeks[0]?.id || "";
        });
      } catch (error) {
        if (cancelled) return;

        console.error("Fetch forecast data error:", error);

        setForecastRows([]);
        setForecastWeeks([]);
        setForecastError(error?.message || "Failed to load forecast data.");
        setSelectedForecastWeekId("");
      } finally {
        if (!cancelled) {
          setForecastLoading(false);
        }
      }
    }

    fetchForecastData();

    return () => {
      cancelled = true;
    };
  }, [activeWeek, selectedAccountRequestValue, selectedClusterRequestValue]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        weekDropdownRef.current &&
        !weekDropdownRef.current.contains(e.target)
      ) {
        setShowWeekDropdown(false);
      }

      if (
        clusterDropdownRef.current &&
        !clusterDropdownRef.current.contains(e.target)
      ) {
        setShowClusterDropdown(false);
      }

      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(e.target)
      ) {
        setShowAccountDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function fetchWeeklyVersions() {
      try {
        setWeeksLoading(true);

        const weeks = await getWorkforceHiringPlanWeeks();

        const formattedWeeks = (weeks || []).map((week, index) => {
          const startDate = week?.startDate || week?.weekStart || "";
          const endDate = week?.endDate || week?.weekEnd || "";
          const weekKey = `${startDate}__${endDate}`;

          const rawHiringPlanPercent = week?.hiring_plan_percent ?? null;

          const hasHiringPlanPercent =
            rawHiringPlanPercent !== null &&
            rawHiringPlanPercent !== undefined &&
            rawHiringPlanPercent !== "" &&
            Number(rawHiringPlanPercent) > 0;

          const displayHiringPlanPercent =
            week?.displayHiringPlanPercent ??
            week?.display_hiring_plan_percent ??
            week?.hiringPlanPercent ??
            week?.hiringRate ??
            5;

          const hiringPlanPercent = hasHiringPlanPercent
            ? Number(rawHiringPlanPercent)
            : getWeekHiringPlanPercent({
                hiringPlanPercent: displayHiringPlanPercent,
              });

          return {
            ...week,
            id: weekKey || week?.id || `week-${index}`,
            originalId: week?.id || "",
            startDate,
            endDate,
            weekKey,
            records: [],

            locked: Boolean(week?.locked),

            lockedByDatabase: Boolean(
              hasHiringPlanPercent ||
              week?.locked_by_database ||
              week?.is_hiring_plan_locked,
            ),

            isHiringPlanLocked: Boolean(
              hasHiringPlanPercent || week?.is_hiring_plan_locked,
            ),

            is_hiring_plan_locked: Boolean(
              hasHiringPlanPercent || week?.is_hiring_plan_locked,
            ),

            hasHiringPlanPercent,
            has_hiring_plan_percent: hasHiringPlanPercent,

            hasSavedSnapshot: Boolean(
              week?.hasSavedSnapshot ||
              week?.has_saved_snapshot ||
              Number(
                week?.savedSnapshotCount || week?.saved_snapshot_count || 0,
              ) > 0,
            ),

            hiringPlanPercent,
            hiringRate: hiringPlanPercent,
            hiring_rate: hiringPlanPercent,

            hiring_plan_percent: hasHiringPlanPercent
              ? hiringPlanPercent
              : null,
          };
        });

        const initialDatabaseLockedWeekKeys = new Set(
          formattedWeeks
            .filter((week) => week.lockedByDatabase)
            .map((week) => buildWeekKey(week))
            .filter((key) => key && key !== "__"),
        );

        if (!ignore) {
          setWeeklyVersions(formattedWeeks);
          setDatabaseLockedWeekKeys(initialDatabaseLockedWeekKeys);
          setActiveWeekId(formattedWeeks[0]?.id || "");
        }
      } catch (error) {
        console.error("FETCH WEEKLY VERSIONS ERROR:", error);

        if (!ignore) {
          setWeeklyVersions([]);
          setActiveWeekId("");
          setDatabaseLockedWeekKeys(new Set());
        }
      } finally {
        if (!ignore) {
          setWeeksLoading(false);
        }
      }
    }

    fetchWeeklyVersions();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!activeWeek) return;

    const weekPercent = getWeekHiringPlanPercent(activeWeek);

    setSelectedHiringPlanPercent(weekPercent);
  }, [
    activeWeek,
    activeWeekId,
    activeWeek?.hiringPlanPercent,
    activeWeek?.hiring_plan_percent,
  ]);

  function isAllClustersSelected() {
    return selectedClusters.includes("All") || selectedClusters.length === 0;
  }

  function isAllAccountsSelected() {
    return selectedAccounts.includes("All") || selectedAccounts.length === 0;
  }

  function handleToggleCluster(cluster) {
    setSelectedClusters((prev) => {
      if (cluster === "All") {
        return ["All"];
      }

      const current = prev.includes("All") ? [] : prev;
      const alreadySelected = current.includes(cluster);

      const next = alreadySelected
        ? current.filter((item) => item !== cluster)
        : [...current, cluster];

      return next.length > 0 ? next : ["All"];
    });

    setSelectedAccounts(["All"]);
    setAccountSearch("");
  }

  function handleToggleAccount(accountName) {
    setSelectedAccounts((prev) => {
      if (accountName === "All") {
        return ["All"];
      }

      const current = prev.includes("All") ? [] : prev;
      const alreadySelected = current.includes(accountName);

      const next = alreadySelected
        ? current.filter((item) => item !== accountName)
        : [...current, accountName];

      return next.length > 0 ? next : ["All"];
    });
  }

  function markActiveWeekLocked(
    savedHiringPlanPercent = selectedHiringPlanPercent,
  ) {
    const selectedWeekKey = buildWeekKey(activeWeek);
    const cleanHiringPlanPercent = Number(savedHiringPlanPercent || 5);

    if (!selectedWeekKey || selectedWeekKey === "__") return;

    setDatabaseLockedWeekKeys((prev) => {
      const next = new Set(prev);
      next.add(selectedWeekKey);
      return next;
    });

    setWeeklyVersions((prev) =>
      prev.map((week) => {
        const sameWeek = buildWeekKey(week) === selectedWeekKey;

        if (!sameWeek) return week;

        return {
          ...week,
          locked: true,
          lockedByDatabase: true,
          isHiringPlanLocked: true,
          is_hiring_plan_locked: true,
          hasHiringPlanPercent: true,
          has_hiring_plan_percent: true,
          hasSavedSnapshot: true,
          hiringPlanPercent: cleanHiringPlanPercent,
          hiring_plan_percent: cleanHiringPlanPercent,
          hiringRate: cleanHiringPlanPercent,
          hiring_rate: cleanHiringPlanPercent,
        };
      }),
    );

    setSelectedHiringPlanPercent(cleanHiringPlanPercent);
  }

  async function fetchAccountsByCluster({ resetAccountFilter = true } = {}) {
    if (!activeWeekStartDate || !activeWeekEndDate) {
      return [];
    }

    if (!userAccessReady) {
      return [];
    }

    try {
      setAccountsLoading(true);

      let accounts = [];

      if (isAllClustersSelected()) {
        accounts = await getWorkforceHiringPlanAccounts(
          "All",
          activeWeekStartDate,
          activeWeekEndDate,
        );
      } else {
        const results = await Promise.all(
          selectedClusters.map((cluster) =>
            getWorkforceHiringPlanAccounts(
              cluster,
              activeWeekStartDate,
              activeWeekEndDate,
            ),
          ),
        );

        accounts = results.flat();
      }

      if (!weeklyAccess.hasFullAccess) {
        const assignedAccountIds = weeklyAccess.assignedAccountIds;
        const assignedAccountNames = weeklyAccess.assignedAccountNames;

        accounts = (accounts || []).filter((account) => {
          const accountId = getAccountIdFromAny(account);
          const accountName = getAccountNameFromAny(account);

          return (
            assignedAccountIds.has(accountId) ||
            assignedAccountNames.has(accountName)
          );
        });
      }

      const uniqueAccountsMap = new Map();

      (accounts || []).forEach((account, index) => {
        const rawAccountId = String(
          account?.id ||
            account?.accountId ||
            account?.account_id ||
            account?.backendAccountId ||
            account?.gy_acc_id ||
            "",
        ).trim();

        const accountName = String(
          account?.accountName ||
            account?.account ||
            account?.account_name ||
            account?.gy_acc_name ||
            "",
        ).trim();

        const clusterName = getClusterFromAny(account);

        if (!accountName) return;

        const key = `${
          rawAccountId || `manual-${index}`
        }-${accountName.toLowerCase()}-${clusterName.toLowerCase()}`;

        if (!uniqueAccountsMap.has(key)) {
          const recruitmentSettingsStatus =
            getRecruitmentSettingsStatus(account);
          const updateHeadcountStatus = getUpdateHeadcountStatus(account);
          const headcountStatus = getHeadcountApprovalStatus(account);

          const kronosRequiredHeadcount = getBackendNumber(
            account,
            [
              "kronosRequiredHeadcount",
              "kronos_required_headcount",
              "kronosBasedRequiredHeadcount",
              "kronos_based_required_headcount",
              "kronosHeadcount",
              "kronos_headcount",
            ],
            getBackendNumber(account, [
              "requiredHeadcount",
              "required_headcount",
            ]),
          );

          const requestedRequiredHeadcount = getBackendNumber(account, [
            "requestedRequiredHeadcount",
            "requested_required_headcount",
            "savedRequiredHeadcount",
            "saved_required_headcount",
            "pendingRequiredHeadcount",
            "pending_required_headcount",
          ]);

          const requiredHeadcount = getDisplayRequiredHeadcount(account);

          uniqueAccountsMap.set(key, {
            ...account,
            id: rawAccountId || account?.id || `manual-${index}`,
            accountId: rawAccountId || account?.accountId || "",
            backendAccountId:
              account?.backendAccountId ||
              account?.backend_account_id ||
              rawAccountId ||
              "",
            accountName,
            account: accountName,
            clusterName,
            cluster: clusterName,

            requiredHeadcount,
            required_headcount: requiredHeadcount,

            kronosRequiredHeadcount,
            kronos_required_headcount: kronosRequiredHeadcount,

            requestedRequiredHeadcount,
            requested_required_headcount: requestedRequiredHeadcount,

            recruitmentSettingsStatus,
            recruitment_settings_status: recruitmentSettingsStatus,

            updateHeadcountStatus,
            update_headcount_status: updateHeadcountStatus,

            headcountStatus,
            headcount_status: headcountStatus,

            canManagerUpdateHeadcount: isApprovedRecruitmentSettingsRequest({
              recruitmentSettingsStatus,
            }),
            can_manager_update_headcount: isApprovedRecruitmentSettingsRequest({
              recruitmentSettingsStatus,
            }),
          });
        }
      });

      accounts = Array.from(uniqueAccountsMap.values());

      const uniqueAccountOptionsMap = new Map();

      accounts.forEach((account, index) => {
        const rawAccountId = String(
          account?.id ||
            account?.accountId ||
            account?.account_id ||
            account?.backendAccountId ||
            account?.gy_acc_id ||
            "",
        ).trim();

        const accountName = String(
          account?.accountName ||
            account?.account ||
            account?.account_name ||
            account?.gy_acc_name ||
            "",
        ).trim();

        if (!accountName) return;

        const key = accountName.toLowerCase();

        if (!uniqueAccountOptionsMap.has(key)) {
          uniqueAccountOptionsMap.set(key, {
            ...account,
            id: rawAccountId || `manual-option-${index}`,
            accountName,
            account: accountName,
            clusterName: getClusterFromAny(account),
          });
        }
      });

      setRemoteAccounts(accounts || []);

      setAccountOptions([
        allWeeklyAccountOption,
        ...Array.from(uniqueAccountOptionsMap.values()),
      ]);

      if (resetAccountFilter) {
        setSelectedAccounts(["All"]);
      }

      return accounts || [];
    } catch (error) {
      console.error("FETCH ACCOUNTS BY CLUSTER ERROR:", error);

      setRemoteAccounts([]);
      setAccountOptions([allWeeklyAccountOption]);

      if (resetAccountFilter) {
        setSelectedAccounts(["All"]);
      }

      return [];
    } finally {
      setAccountsLoading(false);
    }
  }

  useEffect(() => {
    if (activeWeekStartDate && activeWeekEndDate && userAccessReady) {
      fetchAccountsByCluster();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedClusters,
    activeWeekStartDate,
    activeWeekEndDate,
    userAccessReady,
    user?.role,
    user?.adminAccess,
    user?.assignedAccounts,
  ]);

  const displayData = useMemo(() => {
    return (remoteAccounts || []).map((account, index) => {
      const accountName =
        account.accountName ||
        account.account ||
        account.gy_acc_name ||
        "Unassigned Account";

      const accountCluster =
        getClusterFromAny(account) ||
        (isAllClustersSelected()
          ? "Unassigned"
          : selectedClusters.length === 1
            ? selectedClusters[0]
            : "Unassigned");

      const recruitmentSettingsStatus = getRecruitmentSettingsStatus(account);
      const updateHeadcountStatus = getUpdateHeadcountStatus(account);
      const headcountStatus = getHeadcountApprovalStatus(account);

      const kronosRequiredHeadcount = getBackendNumber(
        account,
        [
          "kronosRequiredHeadcount",
          "kronos_required_headcount",
          "kronosBasedRequiredHeadcount",
          "kronos_based_required_headcount",
          "kronosHeadcount",
          "kronos_headcount",
        ],
        getBackendNumber(account, ["requiredHeadcount", "required_headcount"]),
      );

      const requestedRequiredHeadcount = getBackendNumber(account, [
        "requestedRequiredHeadcount",
        "requested_required_headcount",
        "savedRequiredHeadcount",
        "saved_required_headcount",
        "pendingRequiredHeadcount",
        "pending_required_headcount",
      ]);

      const requiredHeadcount = getDisplayRequiredHeadcount(account);

      const actualHeadcount = getBackendNumber(account, [
        "actualHeadcount",
        "actual_headcount",
      ]);

      const bufferHeadcount = getBackendNumber(account, [
        "bufferHeadcount",
        "buffer_headcount",
        "buffer_head_count",
      ]);

      const bufferPercent = getBackendNumber(account, [
        "bufferPercent",
        "buffer_percent",
      ]);

      const absenteeismSeries = getBackendSixWeekSeries(account, "absenteeism");
      const attritionSeries = getBackendSixWeekSeries(account, "attrition");

      const absenteeismTrendTotal = absenteeismSeries.reduce(
        (sum, value) => sum + Number(value || 0),
        0,
      );

      const attritionTrendTotal = attritionSeries.reduce(
        (sum, value) => sum + Number(value || 0),
        0,
      );

      /*
  Current selected-week absenteeism.
  Backend now returns absenteeismCount as selected-week total.
*/
      const absenteeismCount = getBackendNumber(account, [
        "absenteeismCount",
        "absenteeism_count",
        "currentWeekAbsenteeismCount",
        "current_week_absenteeism_count",
        "absenteeismCurrentWeekCount",
        "absenteeism_current_week_count",
      ]);

      /*
  Six-week absenteeism is only for trend/history.
*/
      const absenteeismSixWeeks =
        getBackendNumber(account, [
          "absenteeismSixWeeks",
          "absenteeism_6_weeks",
        ]) || absenteeismTrendTotal;

      const absenteeismPastSixWeeksAverage =
        absenteeismSixWeeks > 0 ? absenteeismSixWeeks / 6 : 0;

      const averageAbsentHeadcount = getBackendNumber(account, [
        "averageAbsentHeadcount",
        "average_absent_headcount",
      ]);

      const currentWeekAbsenteeismCount = getBackendNumber(account, [
        "currentWeekAbsenteeismCount",
        "current_week_absenteeism_count",
        "absenteeismCurrentWeekCount",
        "absenteeism_current_week_count",
      ]);

      const scheduledCount = getBackendNumber(account, [
        "scheduledCount",
        "scheduled_count",
      ]);

      const averageAbsenteeismPercent =
        scheduledCount > 0
          ? (currentWeekAbsenteeismCount / scheduledCount) * 100
          : 0;

      const attritionPastCount =
        attritionTrendTotal > 0
          ? attritionTrendTotal
          : getBackendNumber(account, [
              "attritionSixWeeks",
              "attrition_6_weeks",
              "attritionPastSixWeeks",
              "attrition_past_six_weeks",
              "totalAttrition",
              "total_attrition",
              "attritionPastCount",
              "attrition_past_count",
              "attritionCount",
              "attrition_count",
            ]);

      const attritionPastSixWeeksAverage =
        attritionPastCount > 0 ? attritionPastCount / 6 : 0;

      const opsPrf = getBackendNumber(account, [
        "opsPrf",
        "ops_prf",
        "prfCount",
        "prf_count",
        "hiringIntakeHeadcount",
        "hiring_intake_headcount",
        "hiringIntake",
        "hiring_intake",
      ]);

      /*
  Use selected-week average absent headcount here.
  Do not use absenteeismCount because absenteeismCount is 6-week total.
*/
      const netActualHeadcount =
        actualHeadcount - averageAbsentHeadcount - attritionPastCount;

      const coverageNeeded = Math.max(
        0,
        requiredHeadcount - netActualHeadcount,
      );

      const interviewPopulationCount = getBackendNumber(account, [
        "interviewPopulationCount",
        "interview_population_count",
        "interviewCount",
        "interview_count",
        "alreadyInterviewed",
        "already_interviewed",
      ]);

      const nhoCount = getBackendNumber(account, [
        "nhoCount",
        "nho_count",
        "nhoPopulationCount",
        "nho_population_count",
        "nhoTotal",
        "nho_total",
        "trainingNho",
        "training_nho",
        "pipelineNho",
        "pipeline_nho",
      ]);

      const fstCount = getBackendNumber(account, [
        "fstCount",
        "fst_count",
        "fstPopulationCount",
        "fst_population_count",
        "fstTotal",
        "fst_total",
        "trainingFst",
        "training_fst",
        "pipelineFst",
        "pipeline_fst",
      ]);

      const pstCount = getBackendNumber(account, [
        "pstCount",
        "pst_count",
        "pstPopulationCount",
        "pst_population_count",
        "pstTotal",
        "pst_total",
        "trainingPst",
        "training_pst",
        "pipelinePst",
        "pipeline_pst",
      ]);

      const hiredCount = fstCount;

      const actualHeadcountNeeds = Math.max(
        0,
        coverageNeeded + opsPrf - hiredCount,
      );

      const projectedEmployeeNeeds = actualHeadcountNeeds;

      const rowHiringPlanPercent = calculateActualHiringRatePercent({
        fstCount: hiredCount,
        interviewCount: interviewPopulationCount,
      });

      const leadsToInterview = calculateLeadsFromInterview({
        interviewCount: interviewPopulationCount,
        hiringRate: rowHiringPlanPercent,
      });

      const actionItem = account.actionItem || account.action_item || "";
      const actionItemOwner =
        account.actionItemOwner || account.action_item_owner || "";
      const actionItemOwnerSibsId =
        account.actionItemOwnerSibsId ||
        account.action_item_owner_sibs_id ||
        "";
      const actionItemDeadline =
        account.actionItemDeadline || account.action_item_deadline || "";
      const actionItemStatus =
        account.actionItemStatus || account.action_item_status || "Pending";
      const actionItemRemarks =
        account.actionItemRemarks || account.action_item_remarks || "";

      const actionItems =
        Array.isArray(account.actionItems) && account.actionItems.length
          ? account.actionItems
          : actionItem
            ? [
                {
                  actionItem,
                  action_item: actionItem,
                  owner: actionItemOwner,
                  actionItemOwner,
                  action_item_owner: actionItemOwner,
                  ownerSibsId: actionItemOwnerSibsId,
                  actionItemOwnerSibsId,
                  action_item_owner_sibs_id: actionItemOwnerSibsId,
                  deadline: actionItemDeadline,
                  actionItemDeadline,
                  action_item_deadline: actionItemDeadline,
                  status: actionItemStatus,
                  actionItemStatus,
                  action_item_status: actionItemStatus,
                  actionItemRemarks,
                  action_item_remarks: actionItemRemarks,
                },
              ]
            : [];

      const projectedToBeEndorsed = getBackendNumber(
        account,
        [
          "projectedToBeEndorsed",
          "projected_to_be_endorsed",
          "projectedToBeEndorsedCount",
          "projected_to_be_endorsed_count",
          "projectedEndorsed",
          "projected_endorsed",
          "projectEndorsed",
          "project_endorsed",
          "pstEndorsedCount",
          "pst_endorsed_count",
        ],
        pstCount,
      );

      const row = {
        id: String(
          account.id ||
            account.accountId ||
            account.account_id ||
            account.requiredHeadcountId ||
            account.required_headcount_id ||
            `db-${accountCluster}-${accountName}-${index}`,
        ),
        backendAccountId: account.id || account.accountId || account.gy_acc_id,
        accountId: account.id || account.accountId || account.gy_acc_id,
        week: activeWeek?.label || "Current Week",
        cluster: accountCluster,
        account: accountName,

        requiredHeadcount,
        required_headcount: requiredHeadcount,

        kronosRequiredHeadcount,
        kronos_required_headcount: kronosRequiredHeadcount,

        requestedRequiredHeadcount,
        requested_required_headcount: requestedRequiredHeadcount,

        recruitmentSettingsStatus,
        recruitment_settings_status: recruitmentSettingsStatus,

        updateHeadcountStatus,
        update_headcount_status: updateHeadcountStatus,

        headcountStatus,
        headcount_status: headcountStatus,

        canManagerUpdateHeadcount: isApprovedRecruitmentSettingsRequest({
          recruitmentSettingsStatus,
        }),
        can_manager_update_headcount: isApprovedRecruitmentSettingsRequest({
          recruitmentSettingsStatus,
        }),

        actualHeadcount,
        actual_headcount: actualHeadcount,

        bufferHeadcount,
        bufferPercent,
        missingHeadcount: requiredHeadcount + bufferHeadcount - actualHeadcount,
        netActualHeadcount,
        net_actual_headcount: netActualHeadcount,
        coverageNeeded,
        coverage_needed: coverageNeeded,

        scheduledDays: getBackendNumber(account, [
          "scheduledDays",
          "scheduled_days",
        ]),

        scheduledCount,
        scheduled_count: scheduledCount,

        presentCount: getBackendNumber(account, [
          "presentCount",
          "present_count",
        ]),

        currentWeekAbsenteeismCount,
        current_week_absenteeism_count: currentWeekAbsenteeismCount,

        averageScheduledHeadcount: getBackendNumber(account, [
          "averageScheduledHeadcount",
          "average_scheduled_headcount",
        ]),

        average_scheduled_headcount: getBackendNumber(account, [
          "averageScheduledHeadcount",
          "average_scheduled_headcount",
        ]),

        averagePresentHeadcount: getBackendNumber(account, [
          "averagePresentHeadcount",
          "average_present_headcount",
        ]),

        average_present_headcount: getBackendNumber(account, [
          "averagePresentHeadcount",
          "average_present_headcount",
        ]),

        averageAbsentHeadcount,
        average_absent_headcount: averageAbsentHeadcount,

        averageAbsenteeismPercent,
        average_absenteeism_percent: averageAbsenteeismPercent,

        /*
  Keep these for 6-week trend/table usage.
  Do not use absenteeismCount for the KPI card.
*/
        absenteeismCount,
        absenteeism_count: absenteeismCount,

        absenteeismSixWeeks,
        absenteeism_6_weeks: absenteeismSixWeeks,

        absenteeismPercent: getBackendNumber(account, [
          "averageAbsenteeismPercent",
          "average_absenteeism_percent",
          "absenteeismPercent",
          "absenteeism_percent",
        ]),

        absenteeismPastSixWeeksAverage,
        absenteeism_past_six_weeks_average: absenteeismPastSixWeeksAverage,

        attritionPastCount,
        attritionPastPercent: Number(account.attritionPastPercent || 0),
        attritionPastSixWeeksAverage,
        attrition_past_six_weeks_average: attritionPastSixWeeksAverage,

        absenteeismTrend: absenteeismSeries,
        absenteeism_trend: absenteeismSeries,
        absenteeismWeeklyCounts: absenteeismSeries,
        absenteeism_weekly_counts: absenteeismSeries,

        attritionTrend: attritionSeries,
        attrition_trend: attritionSeries,
        attritionWeeklyCounts: attritionSeries,
        attrition_weekly_counts: attritionSeries,

        absenteeismWeek1: absenteeismSeries[0] || 0,
        absenteeism_week_1: absenteeismSeries[0] || 0,
        absenteeismWeek2: absenteeismSeries[1] || 0,
        absenteeism_week_2: absenteeismSeries[1] || 0,
        absenteeismWeek3: absenteeismSeries[2] || 0,
        absenteeism_week_3: absenteeismSeries[2] || 0,
        absenteeismWeek4: absenteeismSeries[3] || 0,
        absenteeism_week_4: absenteeismSeries[3] || 0,
        absenteeismWeek5: absenteeismSeries[4] || 0,
        absenteeism_week_5: absenteeismSeries[4] || 0,
        absenteeismWeek6: absenteeismSeries[5] || 0,
        absenteeism_week_6: absenteeismSeries[5] || 0,

        attritionWeek1: attritionSeries[0] || 0,
        attrition_week_1: attritionSeries[0] || 0,
        attritionWeek2: attritionSeries[1] || 0,
        attrition_week_2: attritionSeries[1] || 0,
        attritionWeek3: attritionSeries[2] || 0,
        attrition_week_3: attritionSeries[2] || 0,
        attritionWeek4: attritionSeries[3] || 0,
        attrition_week_4: attritionSeries[3] || 0,
        attritionWeek5: attritionSeries[4] || 0,
        attrition_week_5: attritionSeries[4] || 0,
        attritionWeek6: attritionSeries[5] || 0,
        attrition_week_6: attritionSeries[5] || 0,

        opsPrf,
        projectedEmployeeNeeds,
        projected_employee_needs: projectedEmployeeNeeds,

        actualHeadcountNeeds,
        actual_headcount_needs: actualHeadcountNeeds,

        attritionFstToPstCount: getBackendNumber(account, [
          "attritionFstToPstCount",
          "attrition_fst_to_pst_count",
          "fstToPstAttritionCount",
          "fst_to_pst_attrition_count",
        ]),
        attritionFstToPstPercent: getBackendNumber(account, [
          "attritionFstToPstPercent",
          "attrition_fst_to_pst_percent",
        ]),

        attritionNhoToFstPstCount: getBackendNumber(account, [
          "attritionNhoToFstPstCount",
          "attrition_nho_to_fst_pst_count",
          "attritionNhoToFstCount",
          "attrition_nho_to_fst_count",
          "nhoToFstAttritionCount",
          "nho_to_fst_attrition_count",
        ]),
        attritionNhoToFstPstPercent: getBackendNumber(account, [
          "attritionNhoToFstPstPercent",
          "attrition_nho_to_fst_pst_percent",
          "attritionNhoToFstPercent",
          "attrition_nho_to_fst_percent",
        ]),

        attritionInterviewToNhoCount: getBackendNumber(account, [
          "attritionInterviewToNhoCount",
          "attrition_interview_to_nho_count",
          "interviewToNhoAttritionCount",
          "interview_to_nho_attrition_count",
        ]),
        attritionInterviewToNhoPercent: getBackendNumber(account, [
          "attritionInterviewToNhoPercent",
          "attrition_interview_to_nho_percent",
        ]),

        interviewPopulationCount,
        interview_population_count: interviewPopulationCount,
        interviewCount: interviewPopulationCount,
        interview_count: interviewPopulationCount,

        nhoPopulationCount: nhoCount,
        nho_population_count: nhoCount,
        nhoCount,
        nho_count: nhoCount,

        fstPopulationCount: fstCount,
        fst_population_count: fstCount,
        fstCount,
        fst_count: fstCount,

        pstPopulationCount: pstCount,
        pst_population_count: pstCount,
        pstCount,
        pst_count: pstCount,

        projectedToBeEndorsed,
        projected_to_be_endorsed: projectedToBeEndorsed,
        projectedToBeEndorsedCount: projectedToBeEndorsed,
        projected_to_be_endorsed_count: projectedToBeEndorsed,
        projectedEndorsed: projectedToBeEndorsed,
        projected_endorsed: projectedToBeEndorsed,
        projectEndorsed: projectedToBeEndorsed,
        project_endorsed: projectedToBeEndorsed,

        hiredCount,
        hired_count: hiredCount,

        leadsToInterview,
        leads_to_interview: leadsToInterview,

        hiringRate: rowHiringPlanPercent,
        hiring_rate: rowHiringPlanPercent,
        hiringPlanPercent: rowHiringPlanPercent,
        hiring_plan_percent: rowHiringPlanPercent,

        pipelineStatus: account.pipelineStatus || "Pending",
        statusNote: account.headcountRemarks || account.departmentName || "-",

        owner: actionItemOwner || account.owner || "-",

        actionItem,
        action_item: actionItem,

        actionItemOwner,
        action_item_owner: actionItemOwner,

        actionItemOwnerSibsId,
        action_item_owner_sibs_id: actionItemOwnerSibsId,

        actionItemDeadline,
        action_item_deadline: actionItemDeadline,

        actionItemStatus,
        action_item_status: actionItemStatus,

        actionItemRemarks,
        action_item_remarks: actionItemRemarks,

        actionItems,

        departmentName: account.departmentName || "",
        priorityLevel: account.priorityLevel || "",
        headcountRemarks: account.headcountRemarks || "",
        uploadedFile: account.uploadedFile || account.uploaded_file || "",
        uploadedBySibsId:
          account.uploadedBySibsId || account.uploaded_by_sibs_id || "",
        lastEditSibsId:
          account.lastEditSibsId || account.last_edit_sibs_id || "",
        lastEditName: account.lastEditName || account.last_edit_name || "",
      };

      return {
        ...row,
        pipelineStatus: account.pipelineStatus || calculatePipelineStatus(row),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeWeek?.label,
    activeWeek?.hiringPlanPercent,
    activeWeek?.hiring_plan_percent,
    selectedClusters,
    remoteAccounts,
  ]);

  const hiringPlanAdjustedData = useMemo(() => {
    /*
      Do not overwrite row hiring rate with selected/default Hiring Plan %.
      Hiring Rate is actual conversion only:
      FST Count / Interview Count.
    */
    return displayData.map((item) => {
      const interviewCount = getBackendNumber(item, [
        "interviewCount",
        "interview_count",
        "interviewPopulationCount",
        "interview_population_count",
      ]);

      const fstCount = getBackendNumber(item, [
        "fstCount",
        "fst_count",
        "fstPopulationCount",
        "fst_population_count",
      ]);

      const hiringRate = calculateActualHiringRatePercent({
        fstCount,
        interviewCount,
      });

      const actualHeadcountNeeds = Number(
        item.actualHeadcountNeeds ??
          item.actual_headcount_needs ??
          item.hiringNeeded ??
          item.hiring_needed ??
          0,
      );

      const leadsToInterview = calculateLeadsFromInterview({
        interviewCount,
        hiringRate,
      });

      return {
        ...item,

        actualHeadcountNeeds,
        actual_headcount_needs: actualHeadcountNeeds,

        projectedEmployeeNeeds: actualHeadcountNeeds,
        projected_employee_needs: actualHeadcountNeeds,

        leadsToInterview,
        leads_to_interview: leadsToInterview,

        hiredCount: fstCount,
        hired_count: fstCount,

        hiringRate,
        hiring_rate: hiringRate,
        hiringPlanPercent: hiringRate,
        hiring_plan_percent: hiringRate,

        pipelineStatus: calculatePipelineStatus({
          ...item,
          actualHeadcountNeeds,
          hiringNeeded: actualHeadcountNeeds,
          projectedEmployeeNeeds: actualHeadcountNeeds,
          leadsToInterview,
          hiringRate,
        }),
      };
    });
  }, [displayData]);

  const managerDisplayData = useMemo(() => {
    if (weeklyAccess.hasFullAccess) {
      return hiringPlanAdjustedData;
    }

    const assignedAccounts = weeklyAccess.assignedAccounts || [];

    if (!assignedAccounts.length) {
      return [];
    }

    const existingAccountKeys = new Set(
      hiringPlanAdjustedData
        .map((item) =>
          String(getAccountIdFromAny(item) || item.account || "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    );

    const emptyAssignedRows = assignedAccounts
      .map((account) => {
        const accountId = getAccountIdFromAny(account);
        const accountName = getAccountNameFromAny(account);
        const ghlName = getGhlNameFromAny(account);
        const cluster = getClusterFromAny(account);

        const accountKey = String(accountId || accountName)
          .trim()
          .toLowerCase();

        if (!accountName || existingAccountKeys.has(accountKey)) {
          return null;
        }

        return {
          id: `assigned-empty-${accountId || accountName}`,
          backendAccountId: accountId,
          accountId,
          isAssignedEmptyRow: true,

          week: activeWeek?.label || "Current Week",
          weekId: activeWeek?.id || activeWeekId || "",

          cluster,
          account: accountName,

          requiredHeadcount: 0,
          required_headcount: 0,

          kronosRequiredHeadcount: 0,
          kronos_required_headcount: 0,

          requestedRequiredHeadcount: 0,
          requested_required_headcount: 0,

          recruitmentSettingsStatus: "Kronos",
          recruitment_settings_status: "Kronos",

          updateHeadcountStatus: "",
          update_headcount_status: "",

          headcountStatus: "Kronos",
          headcount_status: "Kronos",

          canManagerUpdateHeadcount: false,
          can_manager_update_headcount: false,

          actualHeadcount: 0,
          actual_headcount: 0,
          bufferHeadcount: 0,
          bufferPercent: 0,
          missingHeadcount: 0,

          scheduledCount: 0,
          presentCount: 0,

          absenteeismCount: 0,
          absenteeismPercent: 0,
          absenteeismPastSixWeeksAverage: 0,
          absenteeism_past_six_weeks_average: 0,

          attritionPastCount: 0,
          attritionPastPercent: 0,
          attritionPastSixWeeksAverage: 0,
          attrition_past_six_weeks_average: 0,

          opsPrf: 0,
          ops_prf: 0,

          projectedEmployeeNeeds: 0,
          projected_employee_needs: 0,

          actualHeadcountNeeds: 0,
          actual_headcount_needs: 0,

          attritionFstToPstCount: 0,
          attritionFstToPstPercent: 0,
          attritionNhoToFstPstCount: 0,
          attritionNhoToFstPstPercent: 0,
          attritionInterviewToNhoCount: 0,
          attritionInterviewToNhoPercent: 0,

          interviewPopulationCount: 0,
          interview_population_count: 0,
          interviewCount: 0,
          interview_count: 0,

          nhoPopulationCount: 0,
          nho_population_count: 0,
          nhoCount: 0,
          nho_count: 0,

          fstPopulationCount: 0,
          fst_population_count: 0,
          fstCount: 0,
          fst_count: 0,

          pstPopulationCount: 0,
          pst_population_count: 0,
          pstCount: 0,
          pst_count: 0,

          projectedToBeEndorsed: 0,
          projected_to_be_endorsed: 0,
          projectedToBeEndorsedCount: 0,
          projected_to_be_endorsed_count: 0,
          projectedEndorsed: 0,
          projected_endorsed: 0,
          projectEndorsed: 0,
          project_endorsed: 0,

          hiredCount: 0,
          hired_count: 0,

          leadsToInterview: 0,
          leads_to_interview: 0,

          hiringRate: 0,
          hiring_rate: 0,
          hiringPlanPercent: 0,
          hiring_plan_percent: 0,

          pipelineStatus: "Pending",
          statusNote: ghlName || "-",

          owner: "-",

          actionItem: "",
          action_item: "",
          actionItemOwner: "",
          action_item_owner: "",
          actionItemOwnerSibsId: "",
          action_item_owner_sibs_id: "",
          actionItemDeadline: "",
          action_item_deadline: "",
          actionItemStatus: "Pending",
          action_item_status: "Pending",
          actionItemRemarks: "",
          action_item_remarks: "",
          actionItems: [],

          departmentName: "",
          priorityLevel: "",
          headcountRemarks: "",
          uploadedFile: "",
          uploadedBySibsId: "",
          lastEditSibsId: "",
          lastEditName: "",
        };
      })
      .filter(Boolean);

    return [...hiringPlanAdjustedData, ...emptyAssignedRows];
  }, [activeWeek, activeWeekId, hiringPlanAdjustedData, weeklyAccess]);

  useEffect(() => {
    setRequiredInputs((prev) => {
      const next = { ...prev };

      managerDisplayData.forEach((item) => {
        if (editedRequiredInputsRef.current.has(item.id)) return;

        next[item.id] = String(
          item.requiredHeadcount ?? item.required_headcount ?? 0,
        );
      });

      return next;
    });
  }, [managerDisplayData]);

  const allAccountsSelected = isAllAccountsSelected();

  const filteredPlans = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const plans = managerDisplayData.filter((item) => {
      if (!allAccountsSelected) {
        const accountName = item.account || item.accountName || "";

        if (!selectedAccounts.includes(accountName)) {
          return false;
        }
      }

      if (!keyword) return true;

      const searchableText = [
        item.account,
        item.accountName,
        item.cluster,
        item.clusterName,
        item.pipelineStatus,
        item.statusNote,
        item.departmentName,
        item.recruitmentSettingsStatus,
        item.recruitment_settings_status,
        item.updateHeadcountStatus,
        item.update_headcount_status,
        item.headcountStatus,
        item.headcount_status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });

    return plans;
  }, [allAccountsSelected, managerDisplayData, search, selectedAccounts]);

  const previousWeekData = useMemo(() => {
    if (!weeklyVersions.length || !activeWeek) return [];

    const currentIndex = weeklyVersions.findIndex(
      (week) => week.id === activeWeek.id,
    );

    const previousWeek = weeklyVersions[currentIndex + 1];

    if (!previousWeek) return [];

    return previousWeek.records || [];
  }, [weeklyVersions, activeWeek]);

  const previousSelectedPlan = selectedPlan
    ? previousWeekData.find(
        (record) =>
          record.account === selectedPlan.account &&
          record.cluster === selectedPlan.cluster,
      )
    : null;

  useEffect(() => {
    if (!selectedPlan) return;

    const refreshedPlan = filteredPlans.find(
      (plan) => String(plan.id) === String(selectedPlan.id),
    );

    if (refreshedPlan) {
      setSelectedPlan((prev) => ({
        ...prev,
        ...refreshedPlan,
      }));
    }
  }, [filteredPlans, selectedPlan]);

  function openStatusModal({
    type = "success",
    title = "",
    message = "",
    closeViewModalOnSuccess = false,
  }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
      closeViewModalOnSuccess,
    });
  }

  function closeStatusModal() {
    const shouldCloseViewModal =
      statusModal.type === "success" && statusModal.closeViewModalOnSuccess;

    setStatusModal((prev) => ({
      ...prev,
      open: false,
    }));

    if (shouldCloseViewModal) {
      setSelectedPlan(null);
    }
  }

  async function handleLockWorkforceHiringPlan() {
    if (!canManageHiringPlanPercent) {
      openStatusModal({
        type: "error",
        title: "Permission Denied",
        message: "Only HR and HR Admin can lock the hiring plan percentage.",
      });
      return;
    }

    if (hasActiveRecruitmentSettingsRequest(filteredPlans)) {
      openStatusModal({
        type: "error",
        title: "Pending Headcount Request",
        message:
          "Please approve or reject pending Recruitment Settings or Update Headcount requests before locking the hiring plan percentage.",
      });
      return;
    }

    if (isHiringPlanSnapshotLocked) {
      openStatusModal({
        type: "error",
        title: "Already Locked",
        message:
          "This workforce hiring plan percentage is already locked for the selected week.",
      });
      return;
    }

    const recordsToSave = (filteredPlans || [])
      .filter((item) => item.account)
      .map((item) => {
        const cleanRequiredHeadcount = Number(
          item.requiredHeadcount || item.required_headcount || 0,
        );

        const cleanActualHeadcount = Number(
          item.actualHeadcount || item.actual_headcount || 0,
        );

        const cleanOpsPrf = Number(item.opsPrf || item.ops_prf || 0);

        const cleanActualHeadcountNeeds = Number(
          item.actualHeadcountNeeds || item.actual_headcount_needs || 0,
        );

        const cleanLeadsToInterview = Number(
          item.leadsToInterview || item.leads_to_interview || 0,
        );

        const recruitmentStatus = getRecruitmentSettingsStatus(item);

        return {
          weekNumber: activeWeek?.weekNumber || null,
          weekLabel: activeWeek?.label || null,
          weekStart: activeWeekStartDate,
          weekEnd: activeWeekEndDate,
          clusterName: item.cluster || item.clusterName || "",
          accountName: item.account || item.accountName || "",

          requiredHeadcount: cleanRequiredHeadcount,
          actualHeadcount: cleanActualHeadcount,
          opsPrf: cleanOpsPrf,
          actualHeadcountNeeds: cleanActualHeadcountNeeds,
          leadsToInterview: cleanLeadsToInterview,

          hiringPlanPercent: Number(item.hiringRate || item.hiring_rate || 0),
          hiring_plan_percent: Number(item.hiringRate || item.hiring_rate || 0),

          priorityLevel: item.priorityLevel || item.priority_level || "",

          remarks:
            item.headcountRemarks ||
            item.remarks ||
            item.statusNote ||
            `Locked hiring plan at ${selectedHiringPlanPercent}%`,

          uploadedFile: item.uploadedFile || item.uploaded_file || "",
          uploadedBySibsId:
            item.uploadedBySibsId || item.uploaded_by_sibs_id || "",

          status:
            String(recruitmentStatus).toLowerCase() === "approved"
              ? "Approved"
              : "Pending",
        };
      });

    if (!recordsToSave.length) {
      openStatusModal({
        type: "error",
        title: "No Records Found",
        message: "There are no affected account records to lock for this week.",
      });
      return;
    }

    try {
      setLockingWeeklyPlan(true);

      const result = await lockWorkforceHiringPlanSnapshot({
        weekNumber: activeWeek?.weekNumber || null,
        weekLabel: activeWeek?.label || null,
        weekStart: activeWeekStartDate,
        weekEnd: activeWeekEndDate,
        hiringPlanPercent: selectedHiringPlanPercent,
        records: recordsToSave,
      });

      if (!result?.success) {
        if (result?.locked) {
          markActiveWeekLocked(
            result?.data?.hiringPlanPercent || selectedHiringPlanPercent,
          );
        }

        openStatusModal({
          type: "error",
          title: result?.locked ? "Already Locked" : "Lock Failed",
          message: result?.message || "Failed to lock workforce hiring plan.",
        });

        return;
      }

      markActiveWeekLocked(
        result?.data?.hiringPlanPercent || selectedHiringPlanPercent,
      );

      await fetchAccountsByCluster({
        resetAccountFilter: false,
      });

      openStatusModal({
        type: "success",
        title: "Workforce Hiring Plan Locked",
        message:
          result?.message ||
          `Saved ${recordsToSave.length} affected account records for the selected week.`,
      });
    } catch (error) {
      console.error("LOCK WORKFORCE HIRING PLAN ERROR:", error);

      const responseData = error?.response?.data;

      if (responseData?.locked) {
        markActiveWeekLocked(
          responseData?.data?.hiringPlanPercent || selectedHiringPlanPercent,
        );
      }

      openStatusModal({
        type: "error",
        title: responseData?.locked ? "Already Locked" : "Lock Failed",
        message:
          responseData?.message ||
          responseData?.error ||
          error?.message ||
          "Failed to lock workforce hiring plan.",
      });
    } finally {
      setLockingWeeklyPlan(false);
    }
  }

  function handleRequiredInputChange(itemId, value) {
    editedRequiredInputsRef.current.add(itemId);

    setRequiredInputs((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  }

  function handleWeeklyPlanFileChange(itemId, file) {
    setWeeklyPlanFiles((prev) => ({
      ...prev,
      [itemId]: file,
    }));
  }

  async function handleSaveRequiredHeadcount(item, options = {}) {
    const { silent = false, overrideRequiredHeadcount } = options;

    const canUpdateThisRequest =
      !isHrOrHrAdmin &&
      isManagerOrOps &&
      canManagerUpdateApprovedHeadcount({
        item,
        canEditRequiredHeadcount,
        weeklyAccess,
      });

    if (!canUpdateThisRequest) {
      if (!silent) {
        openStatusModal({
          type: "error",
          title: "Approval Required",
          message:
            "Manager updates are allowed only after the Recruitment Settings headcount request is approved.",
        });
      }

      return;
    }

    if (!activeWeekStartDate || !activeWeekEndDate) {
      if (!silent) {
        openStatusModal({
          type: "error",
          title: "Unable to Save",
          message:
            "Missing weekly date range. Please select a valid weekly version.",
        });
      }
      return;
    }

    const rawValue =
      overrideRequiredHeadcount !== undefined &&
      overrideRequiredHeadcount !== null &&
      overrideRequiredHeadcount !== ""
        ? overrideRequiredHeadcount
        : requiredInputs[item.id];

    const requiredHeadcount =
      rawValue === "" || rawValue === null || rawValue === undefined
        ? null
        : Number(rawValue);

    if (requiredHeadcount !== null && !Number.isFinite(requiredHeadcount)) {
      if (!silent) {
        openStatusModal({
          type: "error",
          title: "Invalid Input",
          message: "Invalid required headcount.",
        });
      }
      return;
    }

    try {
      setSavingRequiredId(item.id);

      await saveRequiredHeadcount({
        weekNumber: activeWeek?.weekNumber || null,
        weekLabel: activeWeek?.label || null,
        weekStart: activeWeekStartDate,
        weekEnd: activeWeekEndDate,
        clusterName: item.cluster || item.clusterName || item.cluster_name,
        accountName: item.account || item.accountName || item.account_name,
        requiredHeadcount,
        actualHeadcount: Number(
          item.actualHeadcount || item.actual_headcount || 0,
        ),
        opsPrf: Number(item.opsPrf || item.ops_prf || 0),
        actualHeadcountNeeds: Number(
          item.actualHeadcountNeeds || item.actual_headcount_needs || 0,
        ),
        priorityLevel: item.priorityLevel || item.priority_level || null,
        remarks:
          item.headcountRemarks || item.remarks || item.statusNote || null,
        status: "Pending",
      });

      setRequiredInputs((prev) => ({
        ...prev,
        [item.id]: String(
          item.requiredHeadcount ?? item.required_headcount ?? 0,
        ),
      }));

      editedRequiredInputsRef.current.delete(item.id);

      await fetchAccountsByCluster({ resetAccountFilter: false });

      if (!silent) {
        openStatusModal({
          type: "success",
          title: "Update Headcount Submitted",
          message: `Update Headcount request for ${item.account} was submitted for approval. The table will continue showing the approved headcount until the update is approved.`,
          closeViewModalOnSuccess: true,
        });
      }
    } catch (error) {
      console.error("SAVE REQUIRED HEADCOUNT ERROR:", error);

      if (!silent) {
        openStatusModal({
          type: "error",
          title: "Save Failed",
          message:
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            "Failed to save required headcount.",
        });
      }

      throw error;
    } finally {
      setSavingRequiredId("");
    }
  }

  async function handleUpdateWeeklyPlanFile(item, overrideRequiredHeadcount) {
    const canUpdateThisRequest =
      !isHrOrHrAdmin &&
      isManagerOrOps &&
      canManagerUpdateApprovedHeadcount({
        item,
        canEditRequiredHeadcount,
        weeklyAccess,
      });

    if (!canUpdateThisRequest) {
      openStatusModal({
        type: "error",
        title: "Approval Required",
        message:
          "Manager file updates are allowed only after the Recruitment Settings headcount request is approved.",
      });

      return;
    }

    const file = weeklyPlanFiles[item.id];

    if (!file) {
      openStatusModal({
        type: "error",
        title: "No File Selected",
        message: "Please select a file before uploading.",
      });
      return;
    }

    if (!activeWeekStartDate || !activeWeekEndDate) {
      openStatusModal({
        type: "error",
        title: "Unable to Upload",
        message:
          "Missing weekly date range. Please select a valid weekly version.",
      });
      return;
    }

    const rawRequiredValue =
      overrideRequiredHeadcount !== undefined &&
      overrideRequiredHeadcount !== null &&
      overrideRequiredHeadcount !== ""
        ? overrideRequiredHeadcount
        : requiredInputs[item.id] !== undefined &&
            requiredInputs[item.id] !== null &&
            requiredInputs[item.id] !== ""
          ? requiredInputs[item.id]
          : (item.requiredHeadcount ?? item.required_headcount ?? 0);

    const requiredHeadcount = Number(rawRequiredValue);

    if (!Number.isFinite(requiredHeadcount)) {
      openStatusModal({
        type: "error",
        title: "Invalid Input",
        message: "Invalid required headcount.",
      });
      return;
    }

    try {
      setSavingFileId(item.id);

      await updateWorkforceHiringPlanFile({
        weekNumber: activeWeek?.weekNumber || null,
        weekLabel: activeWeek?.label || null,
        weekStart: activeWeekStartDate,
        weekEnd: activeWeekEndDate,
        clusterName: item.cluster || item.clusterName || item.cluster_name,
        accountName: item.account || item.accountName || item.account_name,
        requiredHeadcount,
        actualHeadcount: Number(
          item.actualHeadcount || item.actual_headcount || 0,
        ),
        opsPrf: Number(item.opsPrf || item.ops_prf || 0),
        actualHeadcountNeeds: Number(
          item.actualHeadcountNeeds || item.actual_headcount_needs || 0,
        ),
        priorityLevel: item.priorityLevel || item.priority_level || null,
        remarks:
          item.headcountRemarks || item.remarks || item.statusNote || null,
        status: "Pending",
        uploadedFile: file,
      });

      setRequiredInputs((prev) => ({
        ...prev,
        [item.id]: String(
          item.requiredHeadcount ?? item.required_headcount ?? 0,
        ),
      }));

      editedRequiredInputsRef.current.delete(item.id);

      await fetchAccountsByCluster({ resetAccountFilter: false });

      setWeeklyPlanFiles((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });

      openStatusModal({
        type: "success",
        title: "Update Submitted",
        message: `Workforce hiring plan update for ${item.account} was submitted for approval. The table will continue showing the approved headcount until the new update is approved.`,
        closeViewModalOnSuccess: true,
      });
    } catch (error) {
      console.error("UPDATE WEEKLY PLAN FILE ERROR:", error);

      openStatusModal({
        type: "error",
        title: "Upload Failed",
        message:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to upload workforce hiring plan file.",
      });

      throw error;
    } finally {
      setSavingFileId("");
    }
  }

  async function handleOpenUploadedFile({ sibsId, filename }) {
    try {
      setOpeningFile(true);

      await openWorkforceHiringPlanFile({
        sibsId,
        filename,
      });
    } catch (error) {
      console.error("OPEN WEEKLY PLAN FILE ERROR:", error);

      openStatusModal({
        type: "error",
        title: "Unable to Open File",
        message:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to open file.",
      });
    } finally {
      setOpeningFile(false);
    }
  }

  function handleOpenActionItemModal(item) {
    setActionItemTarget(item);

    setActionItemForm({
      ...initialWeeklyActionItemForm,
      owner:
        item.actionItemOwner ||
        item.action_item_owner ||
        getLoggedInOwnerDisplay(user),
    });
  }

  function handleCloseActionItemModal() {
    setActionItemTarget(null);
    setActionItemForm(initialWeeklyActionItemForm);
    setActionItemSubmitting(false);
  }

  async function handleSubmitActionItem(e) {
    e.preventDefault();

    if (!actionItemTarget || actionItemSubmitting) return;

    if (!actionItemForm.actionItem?.trim()) {
      openStatusModal({
        type: "error",
        title: "Missing Action Item",
        message: "Please enter an action item.",
      });
      return;
    }

    if (!actionItemForm.deadline) {
      openStatusModal({
        type: "error",
        title: "Missing Deadline",
        message: "Please select a deadline.",
      });
      return;
    }

    if (!activeWeekStartDate || !activeWeekEndDate) {
      openStatusModal({
        type: "error",
        title: "Missing Weekly Date",
        message: "Please select a valid weekly version.",
      });
      return;
    }

    try {
      setActionItemSubmitting(true);

      const result = await saveWorkforceHiringPlanActionItem({
        weekStart: activeWeekStartDate,
        weekEnd: activeWeekEndDate,
        clusterName: actionItemTarget.cluster || actionItemTarget.clusterName,
        accountName: actionItemTarget.account || actionItemTarget.accountName,
        actionItem: actionItemForm.actionItem,
        deadline: actionItemForm.deadline,
        status: actionItemForm.status || "Pending",
        actionItemRemarks: actionItemForm.actionItemRemarks || "",
      });

      if (!result?.success) {
        openStatusModal({
          type: "error",
          title: "Save Failed",
          message: result?.message || "Failed to save action item.",
        });
        return;
      }

      const savedActionItem = {
        actionItem: result.data?.actionItem || actionItemForm.actionItem,
        action_item: result.data?.action_item || actionItemForm.actionItem,

        owner:
          result.data?.owner ||
          result.data?.actionItemOwner ||
          result.data?.action_item_owner ||
          actionItemForm.owner,
        actionItemOwner:
          result.data?.actionItemOwner ||
          result.data?.action_item_owner ||
          actionItemForm.owner,
        action_item_owner:
          result.data?.action_item_owner ||
          result.data?.actionItemOwner ||
          actionItemForm.owner,

        ownerSibsId:
          result.data?.actionItemOwnerSibsId ||
          result.data?.action_item_owner_sibs_id ||
          "",
        actionItemOwnerSibsId:
          result.data?.actionItemOwnerSibsId ||
          result.data?.action_item_owner_sibs_id ||
          "",
        action_item_owner_sibs_id:
          result.data?.action_item_owner_sibs_id ||
          result.data?.actionItemOwnerSibsId ||
          "",

        deadline:
          result.data?.deadline ||
          result.data?.actionItemDeadline ||
          result.data?.action_item_deadline ||
          actionItemForm.deadline,
        actionItemDeadline:
          result.data?.actionItemDeadline ||
          result.data?.action_item_deadline ||
          actionItemForm.deadline,
        action_item_deadline:
          result.data?.action_item_deadline ||
          result.data?.actionItemDeadline ||
          actionItemForm.deadline,

        status:
          result.data?.status ||
          result.data?.actionItemStatus ||
          result.data?.action_item_status ||
          actionItemForm.status,
        actionItemStatus:
          result.data?.actionItemStatus ||
          result.data?.action_item_status ||
          actionItemForm.status,
        action_item_status:
          result.data?.action_item_status ||
          result.data?.actionItemStatus ||
          actionItemForm.status,

        actionItemRemarks:
          result.data?.actionItemRemarks ||
          result.data?.action_item_remarks ||
          actionItemForm.actionItemRemarks,
        action_item_remarks:
          result.data?.action_item_remarks ||
          result.data?.actionItemRemarks ||
          actionItemForm.actionItemRemarks,
      };

      const updatedItem = {
        ...actionItemTarget,
        actionItem: savedActionItem.actionItem,
        action_item: savedActionItem.action_item,
        actionItemOwner: savedActionItem.actionItemOwner,
        action_item_owner: savedActionItem.action_item_owner,
        owner: savedActionItem.owner,
        actionItemOwnerSibsId: savedActionItem.actionItemOwnerSibsId,
        action_item_owner_sibs_id: savedActionItem.action_item_owner_sibs_id,
        actionItemDeadline: savedActionItem.actionItemDeadline,
        action_item_deadline: savedActionItem.action_item_deadline,
        actionItemStatus: savedActionItem.actionItemStatus,
        action_item_status: savedActionItem.action_item_status,
        actionItemRemarks: savedActionItem.actionItemRemarks,
        action_item_remarks: savedActionItem.action_item_remarks,
        actionItems: [savedActionItem],
      };

      setSelectedPlan((prev) => {
        if (!prev) return prev;

        const sameAccount =
          String(prev.account || "")
            .trim()
            .toLowerCase() ===
          String(actionItemTarget.account || "")
            .trim()
            .toLowerCase();

        if (!sameAccount) return prev;

        return {
          ...prev,
          ...updatedItem,
        };
      });

      setRemoteAccounts((prev) =>
        prev.map((account) => {
          const sameAccount =
            String(account.accountName || account.account || "")
              .trim()
              .toLowerCase() ===
            String(actionItemTarget.account || "")
              .trim()
              .toLowerCase();

          if (!sameAccount) return account;

          return {
            ...account,
            ...updatedItem,
          };
        }),
      );

      handleCloseActionItemModal();

      openStatusModal({
        type: "success",
        title: "Action Item Saved",
        message: "The weekly hiring action item was saved successfully.",
      });
    } catch (error) {
      console.error("SAVE ACTION ITEM ERROR:", error);

      openStatusModal({
        type: "error",
        title: "Save Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to save action item.",
      });
    } finally {
      setActionItemSubmitting(false);
    }
  }

  const filteredAccountOptions = useMemo(() => {
    const keyword = accountSearch.trim().toLowerCase();

    return (accountOptions || [])
      .filter((account) => account.id !== "All")
      .filter((account) => {
        if (!keyword) return true;

        const searchableText = [
          account.accountName,
          account.gy_acc_name,
          account.ghlName,
          account.gy_acc_ghl_name,
          account.clusterName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(keyword);
      });
  }, [accountOptions, accountSearch]);

  const selectedPlanCanEditRequiredHeadcount = selectedPlan
    ? !isHrOrHrAdmin &&
      isManagerOrOps &&
      canManagerUpdateApprovedHeadcount({
        item: selectedPlan,
        canEditRequiredHeadcount,
        weeklyAccess,
      })
    : false;

  const {
    aiInsightOpen,
    aiInsightLoading,
    aiInsightError,
    aiInsightResult,
    aiInsightQuestion,
    setAiInsightQuestion,
    aiInsightConversation,
    setAiInsightOpen,
    handleAskAiInsight,
    handleAskAiFollowUp,
    handleOpenAiInsight,
  } = useWorkforceHiringAi({
    activeWeekId,
    activeWeek,
    activeWeekStartDate,
    activeWeekEndDate,
    selectedClusters,
    selectedAccounts,
    search,
    accountSearch,
    filteredPlans,
  });
  useRegisterWorkforceHiringPage({
    pageHeader: {
      aiInsightLoading,
      accountsLoading,
      hasAiSession:
        Boolean(aiInsightResult.insight) || aiInsightConversation.length > 0,
      handleOpenAiInsight,
      handleLockWorkforceHiringPlan,
    },
    weeklyVersion: {
      weekDropdownRef,
      clusterDropdownRef,
      accountDropdownRef,
      activeWeek,
      activeWeekId,
      setActiveWeekId,

      selectedForecastWeek,
      selectedForecastWeekId,
      setSelectedForecastWeekId,
      forecastWeeklyVersions: forecastWeeks,
      forecastRows,
      forecastLoading,
      forecastError,

      weeksLoading,
      weekSearch,
      setWeekSearch,
      showWeekDropdown,
      setShowWeekDropdown,
      filteredWeeklyVersions,
      selectedClusters,
      setSelectedClusters,
      showClusterDropdown,
      setShowClusterDropdown,
      selectedAccounts,
      setSelectedAccounts,
      showAccountDropdown,
      setShowAccountDropdown,
      accountSearch,
      setAccountSearch,
      accountsLoading,
      filteredAccountOptions,
      isAllClustersSelected,
      isAllAccountsSelected,
      handleToggleCluster,
      handleToggleAccount,
      user,
      assignedAccounts: user?.assignedAccounts || [],
    },
    viewPlanModal: {
      open: !!selectedPlan,
      item: selectedPlan,
      locked: isHiringPlanSnapshotLocked,
      canEditRequiredHeadcount: selectedPlanCanEditRequiredHeadcount,
      previousWeekItem: previousSelectedPlan,
      requiredInputValue: selectedPlan ? requiredInputs[selectedPlan.id] : "",
      savingRequiredId,
      savingFileId,
      weeklyPlanFile: selectedPlan ? weeklyPlanFiles[selectedPlan.id] : null,
      existingUploadedFile: selectedPlan?.uploadedFile || "",
      uploadedBySibsId:
        selectedPlan?.uploadedBySibsId || user?.username || user?.sibsId || "",
      openingFile,
      onRequiredInputChange: handleRequiredInputChange,
      onWeeklyPlanFileChange: handleWeeklyPlanFileChange,
      onSaveRequiredHeadcount: handleSaveRequiredHeadcount,
      onUpdateWeeklyPlanFile: handleUpdateWeeklyPlanFile,
      onOpenUploadedFile: handleOpenUploadedFile,
      onClose: () => setSelectedPlan(null),
      onOpenActionItem: handleOpenActionItemModal,
      actionItemOpen: !!actionItemTarget,
      actionItemTarget,
      actionItemForm,
      setActionItemForm,
      onCloseActionItem: handleCloseActionItemModal,
      onSubmitActionItem: handleSubmitActionItem,
      actionItemSubmitting,
    },
    tables: {
      activeWeek,
      activeWeekId,
      selectedClusters,
      selectedAccounts,
      selectedClusterRequestValue,
      selectedAccountRequestValue,
      selectedForecastWeek,
      selectedForecastWeekId,

      filteredPlans,
      displayData,
      hiringPlanAdjustedData,

      forecastRows,
      forecastWeeks,
      forecastLoading,
      forecastError,

      trendData,
      trendsLoading,
      trendsError,

      sixWeekTableRows,
      sixWeekTableWeeks,
      sixWeekTableLoading,
      sixWeekTableError,

      onViewPlan: setSelectedPlan,
      tableKey: `${activeWeekId}-${selectedClusters.join(
        "-",
      )}-${selectedAccounts.join("-")}-${search}-${selectedHiringPlanPercent}`,
    },
  });

  return {
    mainScrollRef,
    statusModal,
    closeStatusModal,
    showKpiSnapshot,
    activeWeek,
    filteredPlans,
    setShowKpiSnapshot,
    aiInsightOpen,
    aiInsightLoading,
    aiInsightResult,
    aiInsightError,
    aiInsightQuestion,
    setAiInsightQuestion,
    aiInsightConversation,
    setAiInsightOpen,
    handleAskAiInsight,
    handleAskAiFollowUp,
  };
}
