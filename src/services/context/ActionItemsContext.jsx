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
} from "../../lib/utils/actionItems/actionItemsConstants.js";
import {
  getActionItemsStats,
  getTodayDate,
  getTopRisks,
} from "../../lib/utils/actionItems/actionItemsHelpers.js";
import {
  buildManualActionItem,
  buildSystemGeneratedActions,
  getModuleInsightCards,
} from "../../lib/utils/actionItems/actionItemsGenerator.js";
import {
  buildModuleContext,
  getLinkedActionOptions,
} from "../../lib/utils/actionItems/actionItemsModuleContext.js";
import {
  safeReadArray,
  safeWriteArray,
} from "../../lib/utils/actionItems/actionItemsStorage.js";
import { INITIAL_ACTION_ITEMS } from "../../lib/utils/actionItems/initialActionItems.js";

const ActionItemsContext = createContext(null);

function getNextActionNumber(items) {
  const numericIds = items
    .map((item) => Number(String(item.actionId || "").replace(/\D/g, "")))
    .filter((value) => Number.isFinite(value));

  return numericIds.length > 0 ? Math.max(...numericIds) + 1 : items.length + 1;
}

export function ActionItemsProvider({ children }) {
  const [actionItemList, setActionItemList] = useState(() => {
    const stored = safeReadArray(ACTION_ITEMS_STORAGE_KEY, []);
    return stored.length > 0 ? stored : INITIAL_ACTION_ITEMS;
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionForm, setActionForm] = useState({ ...EMPTY_ACTION_FORM });

  useEffect(() => {
    safeWriteArray(ACTION_ITEMS_STORAGE_KEY, actionItemList);
  }, [actionItemList]);

  const refreshSignals = useCallback(() => {
    setRefreshKey((previous) => previous + 1);
  }, []);

  useEffect(() => {
    const handler = () => refreshSignals();

    ACTION_ITEMS_REFRESH_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handler);
    });

    return () => {
      ACTION_ITEMS_REFRESH_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handler);
      });
    };
  }, [refreshSignals]);

  const moduleContext = useMemo(() => buildModuleContext(), [refreshKey]);
  const linkedActionOptions = useMemo(
    () => getLinkedActionOptions(moduleContext),
    [moduleContext],
  );
  const systemGeneratedActions = useMemo(
    () => buildSystemGeneratedActions(moduleContext),
    [moduleContext],
  );

  const combinedItems = useMemo(() => {
    const existingIds = new Set(actionItemList.map((item) => item.actionId));
    const cleanSystemActions = systemGeneratedActions.filter(
      (item) => !existingIds.has(item.actionId),
    );

    return [...cleanSystemActions, ...actionItemList];
  }, [actionItemList, systemGeneratedActions]);

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

  const openAddModal = useCallback(() => {
    setActionForm({ ...EMPTY_ACTION_FORM });
    setShowAddModal(true);
  }, []);

  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
    setActionForm({ ...EMPTY_ACTION_FORM });
  }, []);

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
          roleAccount: "",
          roleTitle: "",
          account: "",
          requirement: 0,
          filled: 0,
        }));
        return;
      }

      setActionForm((previous) => ({
        ...previous,
        weeklyPlanItemId: selected.source === "weekly" ? selected.id : "",
        hiringNeedId: selected.source === "hiring" ? selected.id : "",
        roleAccount: selected.roleAccount,
        roleTitle: selected.label,
        account: selected.account,
        requirement: selected.requirement,
        filled: selected.filled,
      }));
    },
    [linkedActionOptions],
  );

  const addActionItem = useCallback(
    (event) => {
      event?.preventDefault?.();

      if (!actionForm.weeklyPlanItemId && !actionForm.hiringNeedId) {
        alert("Role / Account with hiring gap is required.");
        return false;
      }

      if (!actionForm.actionItem.trim()) {
        alert("Action item is required.");
        return false;
      }

      if (!actionForm.owner) {
        alert("Owner is required.");
        return false;
      }

      if (!actionForm.deadline) {
        alert("Deadline is required.");
        return false;
      }

      if (!actionForm.linkedGap) {
        alert("Linked gap is required.");
        return false;
      }

      const newActionItem = buildManualActionItem({
        form: actionForm,
        nextNumber: getNextActionNumber(actionItemList),
        today: getTodayDate(),
      });

      setActionItemList((previous) => [newActionItem, ...previous]);
      setSelectedItem(newActionItem);
      closeAddModal();
      return true;
    },
    [actionForm, actionItemList, closeAddModal],
  );

  const completeActionItem = useCallback((item) => {
    if (!item || item.systemGenerated) return;

    const updatedItem = {
      ...item,
      status: "Completed",
      completedDate: getTodayDate(),
      remarks:
        item.remarks ||
        "Action item completed and ready for weekly report update.",
    };

    setActionItemList((previous) =>
      previous.map((record) =>
        record.actionId === item.actionId ? updatedItem : record,
      ),
    );
    setSelectedItem(updatedItem);
  }, []);

  const value = useMemo(
    () => ({
      actionItemList,
      combinedItems,
      moduleContext,
      linkedActionOptions,
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
      selectLinkedRecord,
      addActionItem,
      completeActionItem,
      refreshSignals,
    }),
    [
      actionItemList,
      combinedItems,
      moduleContext,
      linkedActionOptions,
      moduleInsightCards,
      moduleRiskTotal,
      stats,
      topRisks,
      selectedItem,
      showAddModal,
      actionForm,
      openAddModal,
      closeAddModal,
      selectLinkedRecord,
      addActionItem,
      completeActionItem,
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
