const ACTIVE_ACTION_STATUSES = new Set(["planned", "ongoing"]);
const COMPLETED_ACTION_STATUS = "completed";
const DAY_MS = 24 * 60 * 60 * 1000;

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeComparableText(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/\s*[/|]\s*/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeStatus(value) {
  return cleanText(value).toLowerCase();
}

function getRoleValue(record = {}) {
  return cleanText(
    record.role ||
      record.roleTitle ||
      record.role_title ||
      record.position ||
      record.positionTitle ||
      record.position_title ||
      "",
  );
}

function getAccountValue(record = {}) {
  return cleanText(
    record.account ||
      record.accountName ||
      record.account_name ||
      record.client ||
      record.campaign ||
      "",
  );
}

function getRoleAccountKey(record = {}) {
  const supplied = cleanText(record.roleAccountKey || record.role_account_key);

  if (supplied) {
    return normalizeComparableText(supplied);
  }

  return `${normalizeComparableText(getRoleValue(record))}::${normalizeComparableText(
    getAccountValue(record),
  )}`;
}

function getSourceModule(record = {}) {
  return normalizeComparableText(
    record.sourceModule || record.source_module || record.module || "",
  );
}

function isCompatibleSourceModule(row = {}, item = {}) {
  const rowModule = getSourceModule(row);
  const itemModule = getSourceModule(item);

  return !rowModule || !itemModule || rowModule === itemModule;
}

function sameFilledIdentifier(rowValue, itemValue) {
  const rowId = cleanText(rowValue);
  const itemId = cleanText(itemValue);

  return Boolean(rowId && itemId && rowId === itemId);
}

export function actionMatchesCurrentStatusRow(row = {}, item = {}) {
  if (!row || !item) return false;

  const sourceMatches =
    sameFilledIdentifier(row.weeklyPlanItemId, item.weeklyPlanItemId) ||
    sameFilledIdentifier(row.weeklyPlanItemId, item.weekly_plan_item_id) ||
    sameFilledIdentifier(row.hiringNeedId, item.hiringNeedId) ||
    sameFilledIdentifier(row.hiringNeedId, item.hiring_need_id) ||
    sameFilledIdentifier(row.sourceRecordId, item.sourceRecordId) ||
    sameFilledIdentifier(row.sourceRecordId, item.source_record_id) ||
    sameFilledIdentifier(row.id, item.currentStatusRowId) ||
    sameFilledIdentifier(row.id, item.current_status_row_id);

  if (sourceMatches && isCompatibleSourceModule(row, item)) {
    return true;
  }

  const rowKey = getRoleAccountKey(row);
  const itemKey = getRoleAccountKey(item);

  if (rowKey && itemKey && rowKey !== "::" && rowKey === itemKey) {
    return true;
  }

  return (
    normalizeComparableText(getRoleValue(row)) ===
      normalizeComparableText(getRoleValue(item)) &&
    normalizeComparableText(getAccountValue(row)) ===
      normalizeComparableText(getAccountValue(item))
  );
}

export function getMatchingActionsForRow(row = {}, items = []) {
  return (Array.isArray(items) ? items : []).filter((item) =>
    actionMatchesCurrentStatusRow(row, item),
  );
}

function getActionDateValue(item = {}) {
  const directValue =
    item.completedDate ||
    item.completed_date ||
    item.updatedAt ||
    item.updated_at ||
    item.modifiedAt ||
    item.modified_at ||
    "";

  if (directValue) return directValue;

  const history = Array.isArray(item.history) ? item.history : [];
  return history.at(-1)?.date || "";
}

function toLocalDayTimestamp(value) {
  const text = cleanText(value);
  if (!text) return Number.NaN;

  const dateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (dateOnly) {
    return new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
    ).getTime();
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return Number.NaN;

  return new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
  ).getTime();
}

function getTodayValue(today) {
  return today || new Date();
}

function getDaysSince(value, today) {
  const completedTimestamp = toLocalDayTimestamp(value);
  const todayTimestamp = toLocalDayTimestamp(getTodayValue(today));

  if (
    !Number.isFinite(completedTimestamp) ||
    !Number.isFinite(todayTimestamp)
  ) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, Math.floor((todayTimestamp - completedTimestamp) / DAY_MS));
}

function sortCompletedActionsNewestFirst(items = []) {
  return [...items].sort((a, b) => {
    const aTimestamp = toLocalDayTimestamp(getActionDateValue(a));
    const bTimestamp = toLocalDayTimestamp(getActionDateValue(b));

    return (Number.isFinite(bTimestamp) ? bTimestamp : 0) -
      (Number.isFinite(aTimestamp) ? aTimestamp : 0);
  });
}

export function getActionCoverageForRow(
  row = {},
  items = [],
  { today = new Date(), recentCompletedDays = 14 } = {},
) {
  const matchingActions = getMatchingActionsForRow(row, items);
  const activeActions = matchingActions.filter((item) =>
    ACTIVE_ACTION_STATUSES.has(normalizeStatus(item.status)),
  );
  const completedActions = sortCompletedActionsNewestFirst(
    matchingActions.filter(
      (item) => normalizeStatus(item.status) === COMPLETED_ACTION_STATUS,
    ),
  );

  const activeAction = activeActions[0] || null;
  const latestCompletedAction = completedActions[0] || null;
  const completedDaysAgo = latestCompletedAction
    ? getDaysSince(getActionDateValue(latestCompletedAction), today)
    : Number.POSITIVE_INFINITY;
  const hasRecentCompletedAction =
    Boolean(latestCompletedAction) &&
    completedDaysAgo <= Math.max(0, Number(recentCompletedDays) || 0);

  const requiredHiring = Math.max(0, Number(row.requiredHiring || 0));
  const accepted = Math.max(0, Number(row.accepted || 0));
  const remainingGap = Math.max(0, requiredHiring - accepted);
  const atRisk = Boolean(row.atRisk) && remainingGap > 0;

  if (activeAction) {
    return {
      state: "assigned",
      hasActiveAction: true,
      followUpNeeded: false,
      missingAction: false,
      activeAction,
      latestCompletedAction,
      completedDaysAgo,
      matchingActions,
      remainingGap,
    };
  }

  if (atRisk && hasRecentCompletedAction) {
    return {
      state: "follow-up",
      hasActiveAction: false,
      followUpNeeded: true,
      missingAction: false,
      activeAction: null,
      latestCompletedAction,
      completedDaysAgo,
      matchingActions,
      remainingGap,
    };
  }

  if (atRisk) {
    return {
      state: "missing",
      hasActiveAction: false,
      followUpNeeded: false,
      missingAction: true,
      activeAction: null,
      latestCompletedAction,
      completedDaysAgo,
      matchingActions,
      remainingGap,
    };
  }

  return {
    state: "not-required",
    hasActiveAction: false,
    followUpNeeded: false,
    missingAction: false,
    activeAction: null,
    latestCompletedAction,
    completedDaysAgo,
    matchingActions,
    remainingGap,
  };
}
