import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ACTION_ITEMS_REFRESH_EVENTS,
  ACTION_ITEMS_STORAGE_KEY,
  EMPTY_ACTION_FORM,
  OWNER_OPTIONS,
} from "../../lib/utils/actionItems/actionItemsConstants.js";
import {
  buildManualActionItem,
  buildSystemGeneratedActions,
  getModuleInsightCards,
} from "../../lib/utils/actionItems/actionItemsGenerator.js";
import {
  getActionItemsStats,
  getTodayDate,
  getTopRisks,
} from "../../lib/utils/actionItems/actionItemsHelpers.js";
import {
  buildModuleContext,
  buildModuleContextFromRecords,
  getLinkedActionOptions,
} from "../../lib/utils/actionItems/actionItemsModuleContext.js";
import {
  safeReadArray,
  safeWriteArray,
} from "../../lib/utils/actionItems/actionItemsStorage.js";
import { getRoleAccountKey } from "../../lib/utils/actionItems/actionItemsReportHelpers.js";
import { INITIAL_ACTION_ITEMS } from "../../lib/utils/actionItems/initialActionItems.js";

const ActionItemsContext = createContext(null);

function isDemoDataEnabled() {
  return String(import.meta.env?.VITE_ENABLE_ACTION_ITEMS_DEMO_DATA || "")
    .trim()
    .toLowerCase() === "true";
}

function getSeedFingerprint(item = {}) {
  return [item.actionId, item.actionItem, item.createdDate]
    .map((value) => String(value || "").trim())
    .join("::");
}

const INITIAL_ACTION_ITEM_FINGERPRINTS = new Set(
  INITIAL_ACTION_ITEMS.map(getSeedFingerprint),
);

function getInitialManualItems() {
  const stored = safeReadArray(ACTION_ITEMS_STORAGE_KEY, []);

  if (isDemoDataEnabled()) {
    return stored.length > 0 ? stored : INITIAL_ACTION_ITEMS;
  }

  return stored.filter(
    (item) => !INITIAL_ACTION_ITEM_FINGERPRINTS.has(getSeedFingerprint(item)),
  );
}

function cloneForm(value = EMPTY_ACTION_FORM) {
  return { ...EMPTY_ACTION_FORM, ...value };
}

function getNextActionNumber(items = []) {
  const numericIds = items
    .map((item) => Number(String(item.actionId || "").replace(/\D/g, "")))
    .filter((value) => Number.isFinite(value));

  return numericIds.length > 0 ? Math.max(...numericIds) + 1 : items.length + 1;
}

function getItemIdentifier(itemOrId) {
  if (typeof itemOrId === "object" && itemOrId) {
    return itemOrId.id ?? itemOrId.actionId;
  }
  return itemOrId;
}

function sameItem(item, identifier) {
  return (
    String(item.id) === String(identifier) ||
    String(item.actionId) === String(identifier)
  );
}

function showValidationMessage(message) {
  if (
    typeof window !== "undefined" &&
    typeof window.alert === "function"
  ) {
    window.alert(message);
  }

  return {
    ok: false,
    error: "validation",
    message,
  };
}

function isSystemControlled(item) {
  return Boolean(
    item?.systemGenerated ||
      String(item?.sourceType || "").toLowerCase().includes("system"),
  );
}

function uniqueSorted(values = []) {
  return Array.from(
    new Set(values.map((value) => String(value || "").trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}

export function ActionItemsProvider({
  children,
  moduleRecords = null,
}) {
  const [manualItems, setManualItems] = useState(getInitialManualItems);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionForm, setActionForm] = useState(() => cloneForm());
  const [actionFormSeed, setActionFormSeed] = useState(() => cloneForm());

  useEffect(() => {
    safeWriteArray(ACTION_ITEMS_STORAGE_KEY, manualItems);
  }, [manualItems]);

  const refreshSignals = useCallback(() => {
    setRefreshKey((previous) => previous + 1);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("ta-action-items-source-refresh-requested"),
      );
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      setRefreshKey((previous) => previous + 1);
    };

    ACTION_ITEMS_REFRESH_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handler);
    });

    return () => {
      ACTION_ITEMS_REFRESH_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handler);
      });
    };
  }, []);

  const moduleContext = useMemo(() => {
    if (moduleRecords) {
      return buildModuleContextFromRecords(moduleRecords);
    }

    return buildModuleContext();
  }, [moduleRecords, refreshKey]);
  const linkedActionOptions = useMemo(
    () => getLinkedActionOptions(moduleContext),
    [moduleContext],
  );
  const generatedActions = useMemo(
    () => buildSystemGeneratedActions(moduleContext),
    [moduleContext],
  );
  const systemGeneratedItems = useMemo(() => {
    const existingIds = new Set(manualItems.map((item) => item.actionId));
    return generatedActions.filter((item) => !existingIds.has(item.actionId));
  }, [generatedActions, manualItems]);

  const combinedItems = useMemo(
    () => [...systemGeneratedItems, ...manualItems],
    [manualItems, systemGeneratedItems],
  );

  const ownerOptions = useMemo(() => {
    const liveOwners = [
      ...linkedActionOptions.map((option) => option.owner),
      ...combinedItems.map((item) => item.owner),
    ].filter((owner) => owner !== "System Suggested");

    const specialOwners = OWNER_OPTIONS.filter(
      (owner) => owner !== "All Owners" && owner !== "System Suggested",
    );

    return [
      "All Owners",
      ...uniqueSorted([...specialOwners, ...liveOwners]),
      "System Suggested",
    ];
  }, [combinedItems, linkedActionOptions]);

  const stats = useMemo(() => getActionItemsStats(combinedItems), [combinedItems]);
  const topRisks = useMemo(() => getTopRisks(combinedItems, 4), [combinedItems]);
  const moduleInsightCards = useMemo(
    () => getModuleInsightCards(moduleContext),
    [moduleContext],
  );
  const moduleRiskTotal = useMemo(
    () =>
      moduleInsightCards.reduce(
        (sum, item) => sum + Number(item.riskValue || 0),
        0,
      ),
    [moduleInsightCards],
  );

  const openAddModal = useCallback((prefill = null) => {
    const nextForm = cloneForm(prefill || EMPTY_ACTION_FORM);
    setActionForm(nextForm);
    setActionFormSeed(nextForm);
    setShowAddModal(true);
  }, []);

  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
    setActionForm(cloneForm());
    setActionFormSeed(cloneForm());
  }, []);

  const resetActionForm = useCallback(() => {
    setActionForm(cloneForm(actionFormSeed));
  }, [actionFormSeed]);

  const selectLinkedRecord = useCallback(
    (optionKey) => {
      const selected = linkedActionOptions.find(
        (option) => option.key === optionKey,
      );

      if (!selected) {
        setActionForm((previous) => ({
          ...previous,
          weeklyPlanItemId: "",
          hiringNeedId: "",
          sourceModule: "Workforce Hiring Plan",
          sourceRecordId: "",
          currentStatusRowId: "",
          roleAccountKey: "",
          cluster: "",
          roleAccount: "",
          roleTitle: "",
          account: "",
          requirement: 0,
          filled: 0,
          atRiskReason: "",
          latestStatusNote: "",
        }));
        return;
      }

      setActionForm((previous) => ({
        ...previous,
        weeklyPlanItemId: selected.source === "weekly" ? selected.id : "",
        hiringNeedId: selected.source === "hiring" ? selected.id : "",
        sourceModule:
          selected.source === "weekly" ? "Workforce Hiring Plan" : "Hiring Needs",
        sourceRecordId: selected.id,
        currentStatusRowId: "",
        roleAccountKey:
          selected.roleAccountKey ||
          `${String(selected.label).trim().toLowerCase()}::${String(
            selected.account,
          )
            .trim()
            .toLowerCase()}`,
        cluster: selected.cluster || "Unassigned Cluster",
        reportingWeek: selected.reportingWeek || previous.reportingWeek,
        roleAccount: selected.roleAccount,
        roleTitle: selected.label,
        account: selected.account,
        requirement: selected.requirement,
        filled: selected.filled,
        owner: previous.owner || selected.owner || "",
        atRiskReason: "",
        latestStatusNote: "",
      }));
    },
    [linkedActionOptions],
  );

  const findDuplicateAction = useCallback(
    (form = actionForm) =>
      combinedItems.find((item) => {
        const formKey =
          form.roleAccountKey ||
          getRoleAccountKey({
            roleTitle: form.roleTitle,
            account: form.account,
          });
        const itemKey = item.roleAccountKey || getRoleAccountKey(item);
        const sameStableKey = Boolean(formKey && itemKey && formKey === itemKey);
        const sameText = sameStableKey;

        return (
          ["Planned", "Ongoing"].includes(item.status) &&
          (sameStableKey || sameText) &&
          item.linkedGap === form.linkedGap
        );
      }) || null,
    [actionForm, combinedItems],
  );

  const addActionItem = useCallback(
    (event, options = {}) => {
      event?.preventDefault?.();

      if (
        !actionForm.weeklyPlanItemId &&
        !actionForm.hiringNeedId &&
        !actionForm.sourceRecordId &&
        !actionForm.currentStatusRowId &&
        !actionForm.roleAccountKey
      ) {
        return showValidationMessage("Role / Account with hiring gap is required.");
      }

      if (!String(actionForm.actionItem || "").trim()) {
        return showValidationMessage("Action item is required.");
      }

      if (!actionForm.owner) {
        return showValidationMessage("Owner is required.");
      }

      if (!actionForm.deadline) {
        return showValidationMessage("Deadline is required.");
      }

      if (!actionForm.linkedGap) {
        return showValidationMessage("Linked gap is required.");
      }

      const duplicate = findDuplicateAction(actionForm);
      if (duplicate && !options.allowDuplicate) {
        return { ok: false, duplicate };
      }

      const today = getTodayDate();
      const generatedItem = buildManualActionItem({
        form: actionForm,
        nextNumber: getNextActionNumber(manualItems),
        today,
      });
      const newActionItem = {
        ...generatedItem,
        cluster: actionForm.cluster || "Unassigned Cluster",
        systemGenerated: false,
        sourceModule: actionForm.sourceModule || generatedItem.module,
        sourceRecordId: actionForm.sourceRecordId || "",
        currentStatusRowId: actionForm.currentStatusRowId || "",
        roleAccountKey:
          actionForm.roleAccountKey ||
          `${String(actionForm.roleTitle || "").trim().toLowerCase()}::${String(
            actionForm.account || "",
          )
            .trim()
            .toLowerCase()}`,
        reportingWeek: actionForm.reportingWeek || "",
        atRiskReason: actionForm.atRiskReason || "",
        latestStatusNote: actionForm.latestStatusNote || "",
        history: [
          {
            date: today,
            action: `Manual action item created (${actionForm.status}).`,
            user: actionForm.owner || "Current User",
          },
        ],
      };

      setManualItems((previous) => [newActionItem, ...previous]);
      setSelectedItem(newActionItem);
      closeAddModal();
      return { ok: true, item: newActionItem };
    },
    [actionForm, closeAddModal, findDuplicateAction, manualItems],
  );

  const updateActionItem = useCallback(
    (itemOrId, changes = {}) => {
      const identifier = getItemIdentifier(itemOrId);
      const target = combinedItems.find((item) => sameItem(item, identifier));

      if (!target) {
        return false;
      }

      const today = getTodayDate();

      function applyChanges(item) {
        const next = {
          ...item,
          ...changes,
          completedDate:
            changes.status === "Completed"
              ? changes.completedDate || today
              : changes.status && changes.status !== "Completed"
                ? null
                : item.completedDate,
          history: [
            ...(Array.isArray(item.history) ? item.history : []),
            ...(changes.historyEntry
              ? [
                  {
                    date: today,
                    user: changes.historyEntry.user || "Current User",
                    action: changes.historyEntry.action,
                  },
                ]
              : []),
          ],
        };
        delete next.historyEntry;
        return next;
      }

      if (isSystemControlled(target)) {
        const updatedSystemItem = applyChanges({
          ...target,
          systemGenerated: false,
        });

        setManualItems((previous) => [
          updatedSystemItem,
          ...previous.filter((item) => !sameItem(item, identifier)),
        ]);
        setSelectedItem(updatedSystemItem);
        return true;
      }

      setManualItems((previous) =>
        previous.map((item) =>
          sameItem(item, identifier) ? applyChanges(item) : item,
        ),
      );
      setSelectedItem((previous) =>
        previous && sameItem(previous, identifier)
          ? applyChanges(previous)
          : previous,
      );
      return true;
    },
    [combinedItems],
  );

  const markActionOngoing = useCallback(
    (item) =>
      updateActionItem(item, {
        status: "Ongoing",
        historyEntry: {
          action: "Action item marked as ongoing.",
          user: item?.owner || "Current User",
        },
      }),
    [updateActionItem],
  );

  const completeActionItem = useCallback(
    (item) => {
      if (!item) return false;

      return updateActionItem(item, {
        status: "Completed",
        remarks:
          item.remarks ||
          "Action item completed and ready for weekly report update.",
        historyEntry: {
          action: "Action item marked as completed.",
          user: item.owner || "Current User",
        },
      });
    },
    [updateActionItem],
  );

  const addActionProgressNote = useCallback(
    (itemOrId, note, user = "Current User") => {
      const text = String(note || "").trim();
      if (!text) return false;

      const identifier = getItemIdentifier(itemOrId);
      const target = combinedItems.find((item) => sameItem(item, identifier));
      if (!target || isSystemControlled(target)) return false;

      const previousRemarks = String(target.remarks || "").trim();
      return updateActionItem(identifier, {
        remarks: previousRemarks ? `${previousRemarks}\n${text}` : text,
        historyEntry: {
          action: `Progress note added: ${text}`,
          user,
        },
      });
    },
    [combinedItems, updateActionItem],
  );

  const value = useMemo(
    () => ({
      actionItemList: manualItems,
      manualItems,
      systemGeneratedItems,
      combinedItems,
      moduleContext,
      linkedActionOptions,
      ownerOptions,
      moduleInsightCards,
      moduleRiskTotal,
      stats,
      topRisks,
      selectedItem,
      setSelectedItem,
      showAddModal,
      actionForm,
      setActionForm,
      openAddModal,
      closeAddModal,
      resetActionForm,
      selectLinkedRecord,
      findDuplicateAction,
      addActionItem,
      updateActionItem,
      markActionOngoing,
      completeActionItem,
      addActionProgressNote,
      refreshSignals,
    }),
    [
      manualItems,
      systemGeneratedItems,
      combinedItems,
      moduleContext,
      linkedActionOptions,
      ownerOptions,
      moduleInsightCards,
      moduleRiskTotal,
      stats,
      topRisks,
      selectedItem,
      showAddModal,
      actionForm,
      openAddModal,
      closeAddModal,
      resetActionForm,
      selectLinkedRecord,
      findDuplicateAction,
      addActionItem,
      updateActionItem,
      markActionOngoing,
      completeActionItem,
      addActionProgressNote,
      refreshSignals,
    ],
  );

  return (
    <ActionItemsContext.Provider value={value}>
      {children}
    </ActionItemsContext.Provider>
  );
}

export function useActionItems() {
  const context = useContext(ActionItemsContext);

  if (!context) {
    throw new Error("useActionItems must be used within ActionItemsProvider");
  }

  return context;
}

export default ActionItemsContext;