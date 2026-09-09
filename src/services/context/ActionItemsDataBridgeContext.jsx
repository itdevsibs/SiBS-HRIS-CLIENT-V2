import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useHiringNeeds } from "./HiringNeedsContext";
import { useUser } from "./UserContext";
import { useCandidatePipeline } from "./CandidatePipelineContext";
import { useOffers } from "./OffersContext";
import { useOnboarding } from "./OnboardingContext";
import { useSourcingAnalytics } from "./SourcingContext";
import { useWorkforceHiring } from "./WorkforceHiringContext";
import { ActionItemsProvider } from "./ActionItemsContext";

const SOURCE_REFRESH_EVENT = "ta-action-items-source-refresh-requested";
const ACTION_ITEMS_ALLOWED_ACCESS = new Set([1, 2, 3, 6, 7]);
const PUBLIC_ACTION_ITEMS_PATHS = [
  "/",
  "/login",
  "/online-assessment",
  "/apply",
  "/recruitment/talent-pool/apply",
  "/public/talent-pool/apply",
  "/public/offer-response",
  "/public/interview-date",
  "/public/job-description",
];

function isPublicActionItemsPath(pathname = "") {
  const normalizedPath = String(pathname || "/").trim() || "/";

  return PUBLIC_ACTION_ITEMS_PATHS.some((publicPath) => {
    if (publicPath === "/") return normalizedPath === "/";

    return (
      normalizedPath === publicPath ||
      normalizedPath.startsWith(`${publicPath}/`)
    );
  });
}

function cleanArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function firstArray(...values) {
  let firstEmptyArray = null;

  for (const value of values) {
    if (!Array.isArray(value)) continue;

    const cleaned = value.filter(Boolean);
    if (cleaned.length > 0) return cleaned;
    if (!firstEmptyArray) firstEmptyArray = cleaned;
  }

  return firstEmptyArray || [];
}

function getWeekStart(record = {}) {
  return String(
    record.weekStart ||
      record.week_start ||
      record.startDate ||
      record.start_date ||
      record.dateStart ||
      record.date_start ||
      "",
  ).slice(0, 10);
}

function getWeekEnd(record = {}) {
  return String(
    record.weekEnd ||
      record.week_end ||
      record.endDate ||
      record.end_date ||
      record.dateEnd ||
      record.date_end ||
      "",
  ).slice(0, 10);
}

function getWeekNumber(record = {}) {
  return String(record.weekNumber || record.week_number || "");
}

function getNestedRows(group = {}) {
  return firstArray(
    group.rows,
    group.accountRows,
    group.account_rows,
    group.accounts,
    group.items,
    group.records,
    group.data,
  );
}

function flattenWeekGroups(groups = []) {
  return cleanArray(groups).flatMap((group) => {
    const rows = getNestedRows(group);
    if (!rows.length) return [group];

    return rows.map((row) => ({
      ...group,
      ...row,
      weekStart: row.weekStart || row.week_start || getWeekStart(group),
      weekEnd: row.weekEnd || row.week_end || getWeekEnd(group),
      weekNumber: row.weekNumber || row.week_number || getWeekNumber(group),
      reportingWeek:
        row.reportingWeek ||
        row.weekLabel ||
        group.reportingWeek ||
        group.weekLabel ||
        group.label ||
        "",
    }));
  });
}

function getActiveWorkforceWeek(workforce = {}) {
  const tables = workforce.tables || {};
  const weeklyVersion = workforce.weeklyVersion || {};

  return (
    tables.activeWeek ||
    weeklyVersion.activeWeek ||
    weeklyVersion.selectedWeek ||
    weeklyVersion.currentWeek ||
    workforce.activeWeek ||
    workforce.selectedWeek ||
    {}
  );
}

function selectRowsForActiveWeek(groups = [], activeWeek = {}) {
  const safeGroups = cleanArray(groups);
  if (!safeGroups.length) return [];

  const targetStart = getWeekStart(activeWeek);
  const targetEnd = getWeekEnd(activeWeek);
  const targetNumber = getWeekNumber(activeWeek);

  const matched = safeGroups.find((group) => {
    const sameDates =
      targetStart &&
      targetEnd &&
      getWeekStart(group) === targetStart &&
      getWeekEnd(group) === targetEnd;

    const sameNumber =
      targetNumber && getWeekNumber(group) === targetNumber;

    return sameDates || sameNumber;
  });

  return getNestedRows(matched || safeGroups[0]);
}

function extractWorkforceRecords(workforce = {}) {
  const tables = workforce.tables || {};
  const weeklyVersion = workforce.weeklyVersion || {};
  const overview = workforce.overview || {};
  const forecast = workforce.forecast || workforce.forecastData || {};

  const weekGroups = firstArray(
    workforce.accountRowsByWeek,
    workforce.accountForecastRowsByWeek,
    tables.accountRowsByWeek,
    tables.accountForecastRowsByWeek,
    weeklyVersion.accountRowsByWeek,
    weeklyVersion.accountForecastRowsByWeek,
    forecast.accountRowsByWeek,
    forecast.accountForecastRowsByWeek,
  );

  const directWeeklyPlan = firstArray(
    workforce.weeklyPlan,
    workforce.plans,
    workforce.rows,
    workforce.accountRows,
    workforce.forecastRows,
    tables.weeklyPlan,
    tables.rows,
    tables.accountRows,
    weeklyVersion.weeklyPlan,
    weeklyVersion.rows,
    weeklyVersion.accountRows,
    overview.rows,
    forecast.rows,
    forecast.forecastRows,
  );

  const weeklyPlan = directWeeklyPlan.length
    ? directWeeklyPlan
    : selectRowsForActiveWeek(weekGroups, getActiveWorkforceWeek(workforce));

  const directHistory = firstArray(
    workforce.weeklyActionItems,
    workforce.historicalRows,
    workforce.historyRows,
    tables.weeklyActionItems,
    tables.historicalRows,
    weeklyVersion.weeklyActionItems,
    weeklyVersion.historicalRows,
  );

  return {
    weeklyPlan,
    weeklyActionItems: directHistory.length
      ? directHistory
      : flattenWeekGroups(weekGroups),
  };
}


function normalizeHiringNeedRecord(record = {}) {
  const departmentAccount = String(
    record.departmentAccount || record.department_account || "",
  ).trim();
  const departmentParts = departmentAccount
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    ...record,
    hiringNeedId:
      record.hiringNeedId ||
      record.hiring_need_id ||
      record.rawId ||
      record.raw_id ||
      record.prfId ||
      record.prf_id ||
      record.id ||
      "",
    roleTitle:
      record.roleTitle ||
      record.role_title ||
      record.positionTitle ||
      record.position_title ||
      record.jobDescriptionTitle ||
      "",
    account:
      record.account ||
      record.accountName ||
      record.account_name ||
      departmentParts.at(-1) ||
      departmentAccount ||
      "Recruitment",
    cluster:
      record.cluster ||
      record.clusterName ||
      record.department ||
      (departmentParts.length > 1 ? departmentParts[0] : "") ||
      "Unassigned Cluster",
    requiredHeadcount:
      record.requiredHeadcount ||
      record.required_headcount ||
      record.headcount ||
      record.required_hc ||
      0,
    openDate:
      record.openDate ||
      record.createdDate ||
      record.createdAt ||
      record.created_at ||
      "",
    dueDate:
      record.dueDate ||
      record.dateNeeded ||
      record.date_needed ||
      record.requiredDate ||
      "",
    taOwner:
      record.taOwner ||
      record.owner ||
      record.preparedBy ||
      record.prepared_by ||
      record.requestedBy ||
      record.requested_by ||
      "Unassigned",
  };
}

function dedupeRecords(records = []) {
  const map = new Map();

  cleanArray(records).forEach((record, index) => {
    const key = String(
      record.id ||
        record.dbId ||
        record.rawId ||
        record.candidatePipelineId ||
        record.candidateApplicationId ||
        record.candidateId ||
        record.email ||
        `record-${index}`,
    );

    map.set(key, { ...(map.get(key) || {}), ...record });
  });

  return Array.from(map.values());
}

function getFirstFunction(source = {}, names = []) {
  for (const name of names) {
    if (typeof source?.[name] === "function") return source[name];
  }
  return null;
}

export default function ActionItemsDataBridge({ children }) {
  const { user, loading: userLoading } = useUser() || {};
  const hiringNeeds = useHiringNeeds();
  const candidatePipeline = useCandidatePipeline();
  const offers = useOffers();
  const onboarding = useOnboarding();
  const sourcing = useSourcingAnalytics();
  const workforceHiring = useWorkforceHiring();
  const [bridgeVersion, setBridgeVersion] = useState(0);

  const userAdminAccess = Number(
    user?.adminAccess ?? user?.admin_access ?? 0,
  );
  const canLoadActionItems =
    ACTION_ITEMS_ALLOWED_ACCESS.has(userAdminAccess);

  const fetchHiringNeeds = hiringNeeds?.fetchList;
  const refreshCandidatePipeline = candidatePipeline?.refreshCandidatePipeline;
  const refreshOffers = offers?.refreshOffers;
  const refreshOnboarding = onboarding?.refreshOnboarding || onboarding?.fetchList;

  const refreshSourcing = getFirstFunction(sourcing, [
    "refreshSourcing",
    "refreshAnalytics",
    "fetchList",
    "loadSources",
  ]);
  const canRefreshSourcing =
    sourcing?.canAccessSourcingAnalytics === true;

  const refreshWorkforceHiring = getFirstFunction(workforceHiring, [
    "refreshWorkforceHiring",
    "refreshHiringPlan",
    "fetchList",
    "loadWeeklyPlan",
    "reload",
  ]);

  const refreshLiveSources = useCallback(async () => {
    const isPublicRoute =
      typeof window !== "undefined" &&
      isPublicActionItemsPath(window.location.pathname);

    if (isPublicRoute || userLoading || !user || !canLoadActionItems) {
      return;
    }

    const refreshers = [
      fetchHiringNeeds,
      refreshCandidatePipeline,
      refreshOffers,
      refreshOnboarding,
      ...(canRefreshSourcing ? [refreshSourcing] : []),
      refreshWorkforceHiring,
    ].filter((callback) => typeof callback === "function");

    await Promise.allSettled(refreshers.map((callback) => callback()));
    setBridgeVersion((value) => value + 1);
  }, [
    canLoadActionItems,
    fetchHiringNeeds,
    refreshCandidatePipeline,
    refreshOffers,
    refreshOnboarding,
    canRefreshSourcing,
    refreshSourcing,
    refreshWorkforceHiring,
    user,
    userLoading,
  ]);

  useEffect(() => {
    refreshLiveSources();
  }, [refreshLiveSources]);

  useEffect(() => {
    function handleSourceRefresh() {
      refreshLiveSources();
    }

    function handleSourceUpdated() {
      setBridgeVersion((value) => value + 1);
    }

    window.addEventListener(SOURCE_REFRESH_EVENT, handleSourceRefresh);

    [
      "storage",
      "focus",
      "ta-hiring-needs-updated",
      "ta-workforce-hiring-plan-updated",
      "ta-weekly-hiring-action-items-updated",
      "ta-pipeline-candidates-updated",
      "ta-offers-updated",
      "ta-onboarding-updated",
      "ta-talent-pool-updated",
    ].forEach((eventName) => {
      window.addEventListener(eventName, handleSourceUpdated);
    });

    return () => {
      window.removeEventListener(SOURCE_REFRESH_EVENT, handleSourceRefresh);

      [
        "storage",
        "focus",
        "ta-hiring-needs-updated",
        "ta-workforce-hiring-plan-updated",
        "ta-weekly-hiring-action-items-updated",
        "ta-pipeline-candidates-updated",
        "ta-offers-updated",
        "ta-onboarding-updated",
        "ta-talent-pool-updated",
      ].forEach((eventName) => {
        window.removeEventListener(eventName, handleSourceUpdated);
      });
    };
  }, [refreshLiveSources]);

  const moduleRecords = useMemo(() => {
    const candidateList = cleanArray(
      candidatePipeline?.candidateList || candidatePipeline?.candidates,
    );
    const offerList = cleanArray(offers?.offerList);
    const onboardingList = cleanArray(
      onboarding?.list || onboarding?.records,
    );
    const hiringNeedsList = cleanArray(hiringNeeds?.list);
    const workforce = extractWorkforceRecords(workforceHiring || {});

    return {
      publicSubmissions: firstArray(
        sourcing?.publicSubmissions,
        sourcing?.submissions,
        sourcing?.publicApplicants,
      ),
      internalCandidates: firstArray(
        sourcing?.internalCandidates,
        sourcing?.candidates,
      ),

      // Candidate Pipeline already contains the live application records.
      // Keep candidateApplications empty so stage counts are not doubled.
      candidateApplications: [],
      pipelineCandidates: candidateList,
      offers: dedupeRecords(offerList),
      onboarding: onboardingList,
      hiringNeeds: hiringNeedsList.map(normalizeHiringNeedRecord),
      weeklyPlan: workforce.weeklyPlan,
      weeklyActionItems: workforce.weeklyActionItems,
      sourceState: {
        pipeline: {
          loaded: Boolean(
            candidatePipeline?.hasLoadedStorage &&
              !candidatePipeline?.isLoading,
          ),
          loading: Boolean(candidatePipeline?.isLoading),
          error: String(candidatePipeline?.loadError || "").trim(),
        },
      },
      bridgeVersion,
    };
  }, [
    bridgeVersion,
    candidatePipeline?.candidateList,
    candidatePipeline?.candidates,
    candidatePipeline?.hasLoadedStorage,
    candidatePipeline?.isLoading,
    candidatePipeline?.loadError,
    hiringNeeds?.list,
    offers?.offerList,
    onboarding?.list,
    onboarding?.records,
    sourcing,
    workforceHiring,
  ]);

  return (
    <ActionItemsProvider moduleRecords={moduleRecords}>
      {children}
    </ActionItemsProvider>
  );
}