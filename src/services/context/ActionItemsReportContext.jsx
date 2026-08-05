import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useActionItems } from "./ActionItemsContext.jsx";
import { getDateAfterDays } from "../../lib/utils/actionItems/actionItemsHelpers.js";
import {
  buildCurrentStatusRows,
  buildExecutionMetrics,
  buildReportingWeekOptions,
  buildWeeklyPerformanceRows,
  filterActionItemsForReport,
  filterReportRows,
} from "../../lib/utils/actionItems/actionItemsReportHelpers.js";

const ActionItemsReportContext = createContext(null);

function uniqueSorted(values) {
  return [
    "All",
    ...Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
      a.localeCompare(b),
    ),
  ];
}

function createDefaultScope(weekOption) {
  return {
    week: weekOption?.value || "",
    weekLabel: weekOption?.label || "",
    cluster: "All",
    account: "All",
    role: "All",
    owner: "All",
    atRiskOnly: false,
  };
}

export function ActionItemsReportProvider({ children }) {
  const actionItems = useActionItems();
  const weekOptions = useMemo(() => buildReportingWeekOptions(10), []);
  const [reportingScope, setReportingScope] = useState(() =>
    createDefaultScope(weekOptions[0]),
  );
  const [selectedRoleAccount, setSelectedRoleAccount] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const selectedWeekIndex = Math.max(
    0,
    weekOptions.findIndex((item) => item.value === reportingScope.week),
  );
  const selectedWeek = weekOptions[selectedWeekIndex] || weekOptions[0];
  const previousWeek =
    weekOptions[selectedWeekIndex + 1] ||
    weekOptions[weekOptions.length - 1];

  const moduleContext = actionItems.moduleContext || {};

  const currentStatusRows = useMemo(
    () =>
      buildCurrentStatusRows(moduleContext, actionItems.combinedItems, {
        reportingWeekLabel: selectedWeek?.label || "",
      }),
    [moduleContext, actionItems.combinedItems, selectedWeek?.label],
  );

  const weeklyPerformanceRows = useMemo(
    () =>
      buildWeeklyPerformanceRows(moduleContext, {
        currentStatusRows,
        previousWeekLabel:
          previousWeek?.shortLabel ||
          previousWeek?.label ||
          "Previous week",
        previousWeekNumber: previousWeek?.weekNumber,
        previousWeekStart: previousWeek?.startDate || "",
        previousWeekEnd: previousWeek?.endDate || "",
      }),
    [
      moduleContext,
      currentStatusRows,
      previousWeek?.shortLabel,
      previousWeek?.label,
      previousWeek?.weekNumber,
      previousWeek?.startDate,
      previousWeek?.endDate,
    ],
  );

  const filteredCurrentStatusRows = useMemo(
    () =>
      filterReportRows(
        currentStatusRows,
        reportingScope,
        selectedRoleAccount,
      ),
    [currentStatusRows, reportingScope, selectedRoleAccount],
  );

  const filteredWeeklyPerformanceRows = useMemo(
    () =>
      filterReportRows(
        weeklyPerformanceRows,
        reportingScope,
        selectedRoleAccount,
      ),
    [weeklyPerformanceRows, reportingScope, selectedRoleAccount],
  );

  const filteredActionItems = useMemo(
    () =>
      filterActionItemsForReport(
        actionItems.combinedItems,
        reportingScope,
        selectedRoleAccount,
      ),
    [actionItems.combinedItems, reportingScope, selectedRoleAccount],
  );

  // System Suggested is derived only from generated action records.
  // Module signal categories remain a separate supporting dashboard panel.
  const executionMetrics = useMemo(
    () =>
      buildExecutionMetrics(
        filteredCurrentStatusRows,
        filteredActionItems,
      ),
    [filteredCurrentStatusRows, filteredActionItems],
  );

  const scopeOptions = useMemo(
    () => ({
      clusters: uniqueSorted(currentStatusRows.map((row) => row.cluster)),
      accounts: uniqueSorted(currentStatusRows.map((row) => row.account)),
      roles: uniqueSorted(currentStatusRows.map((row) => row.role)),
      owners: uniqueSorted(currentStatusRows.map((row) => row.taOwner)),
    }),
    [currentStatusRows],
  );

  const setReportingFilter = useCallback(
    (field, value) => {
      setReportingScope((previous) => {
        const next = { ...previous, [field]: value };

        if (field === "week") {
          const option = weekOptions.find((item) => item.value === value);
          next.weekLabel = option?.label || previous.weekLabel;
        }

        return next;
      });

      if (["cluster", "account", "role", "owner"].includes(field)) {
        setSelectedRoleAccount(null);
      }
    },
    [weekOptions],
  );

  const clearReportingScope = useCallback(() => {
    setReportingScope(createDefaultScope(weekOptions[0]));
    setSelectedRoleAccount(null);
  }, [weekOptions]);

  const selectReportRow = useCallback((row) => {
    const selection = row
      ? {
          role: row.role,
          account: row.account,
          roleAccountKey: row.roleAccountKey,
        }
      : null;

    setSelectedRoleAccount((previous) =>
      previous?.roleAccountKey &&
      previous.roleAccountKey === selection?.roleAccountKey
        ? null
        : selection,
    );
  }, []);

  const openAddModalForStatusRow = useCallback(
    (row) => {
      const prefill = {
        weeklyPlanItemId: row.weeklyPlanItemId || "",
        hiringNeedId: row.hiringNeedId || "",
        sourceModule: row.sourceModule || "Workforce Hiring Plan",
        sourceRecordId: row.sourceRecordId || "",
        currentStatusRowId: row.id || "",
        roleAccountKey: row.roleAccountKey || "",
        cluster: row.cluster || "",
        reportingWeek: selectedWeek?.label || "",
        roleAccount: `${row.role} - ${row.account}`,
        roleTitle: row.role,
        account: row.account,
        requirement: row.requiredHiring,
        filled: row.accepted,
        actionItem: row.reason
          ? `Address ${row.reason.toLowerCase()} for ${row.role}`
          : "",
        owner: row.taOwner === "Unassigned" ? "" : row.taOwner,
        deadline: getDateAfterDays(5),
        status: "Planned",
        riskLevel: row.suggestedRisk || "High",
        linkedGap: row.suggestedGap || "Capacity / Manpower",
        remarks: row.latestStatusNotes || "",
        atRiskReason: row.reason || "",
        latestStatusNote: row.latestStatusNotes || "",
      };

      actionItems.openAddModal(prefill);
    },
    [actionItems, selectedWeek?.label],
  );

  const openEmailModal = useCallback(() => setShowEmailModal(true), []);
  const closeEmailModal = useCallback(() => setShowEmailModal(false), []);

  const refreshReportSignals = useCallback(() => {
    actionItems.refreshSignals();
  }, [actionItems]);

  const value = useMemo(
    () => ({
      reportingScope,
      setReportingFilter,
      clearReportingScope,
      weekOptions,
      selectedWeek,
      previousWeek,
      previousWeekLabel: previousWeek?.label || "Previous week",
      scopeOptions,
      selectedRoleAccount,
      setSelectedRoleAccount,
      selectReportRow,
      weeklyPerformanceRows,
      currentStatusRows,
      filteredWeeklyPerformanceRows,
      filteredCurrentStatusRows,
      filteredActionItems,
      executionMetrics,
      openAddModalForStatusRow,
      showEmailModal,
      openEmailModal,
      closeEmailModal,
      refreshReportSignals,
    }),
    [
      reportingScope,
      setReportingFilter,
      clearReportingScope,
      weekOptions,
      selectedWeek,
      previousWeek,
      scopeOptions,
      selectedRoleAccount,
      selectReportRow,
      weeklyPerformanceRows,
      currentStatusRows,
      filteredWeeklyPerformanceRows,
      filteredCurrentStatusRows,
      filteredActionItems,
      executionMetrics,
      openAddModalForStatusRow,
      showEmailModal,
      openEmailModal,
      closeEmailModal,
      refreshReportSignals,
    ],
  );

  return (
    <ActionItemsReportContext.Provider value={value}>
      {children}
    </ActionItemsReportContext.Provider>
  );
}

export function useActionItemsReport() {
  const context = useContext(ActionItemsReportContext);

  if (!context) {
    throw new Error(
      "useActionItemsReport must be used within ActionItemsReportProvider",
    );
  }

  return context;
}

export default ActionItemsReportContext;
