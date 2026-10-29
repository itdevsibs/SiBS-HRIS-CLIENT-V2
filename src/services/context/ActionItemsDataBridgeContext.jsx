import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

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
      ...row,
      weekStart: getWeekStart(row) || getWeekStart(group),
      weekEnd: getWeekEnd(row) || getWeekEnd(group),
      weekNumber: getWeekNumber(row) || getWeekNumber(group),
    }));
  });
}

function extractWorkforceRecords(workforceHiring = {}) {
  const tables = workforceHiring.tables || {};
  const currentPlan =
    workforceHiring.currentPlan ||
    workforceHiring.hiringPlan ||
    workforceHiring.plan ||
    {};

  const weeklyPlanCandidates = [
    workforceHiring.weeklyPlan,
    tables.weeklyPlan,
    currentPlan.weeklyPlan,
    workforceHiring.planRows,
    workforceHiring.weeklyRows,
    workforceHiring.weeks,
    currentPlan.weeks,
    currentPlan.rows,
  ];

  const actionItemsCandidates = [
    workforceHiring.weeklyActionItems,
    workforceHiring.actionItems,
    tables.weeklyActionItems,
    currentPlan.actionItems,
    currentPlan.weeklyActionItems,
  ];

  const weeklyPlan = flattenWeekGroups(firstArray(...weeklyPlanCandidates));
  const weeklyActionItems = flattenWeekGroups(
    firstArray(...actionItemsCandidates),
  );

  return {
    weeklyPlan,
    weeklyActionItems,
  };
}

function getFirstFunction(source, candidateNames = []) {
  if (!source || typeof source !== "object") return null;

  for (const name of candidateNames) {
    if (typeof source[name] === "function") {
      return source[name];
    }
  }

  return null;
}

function dedupeRecords(records = []) {
  const seen = new Set();

  return cleanArray(records).filter((record) => {
    const key =
      record?.id ??
      record?.offerId ??
      record?.offer_id ??
      record?.candidateId ??
      record?.candidate_id ??
      record?.pipelineId ??
      record?.candidatePipelineId ??
      record?.name ??
      JSON.stringify(record);

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeHiringNeedRecord(item = {}) {
  return {
    ...item,
    id: item.id ?? item.hiringNeedId ?? item.hiring_need_id,
    account: item.account || item.accountName || item.account_name || "",
    roleTitle:
      item.roleTitle || item.role_title || item.position || item.title || "",
    headcount: Number(
      item.headcount ??
        item.requiredHeadcount ??
        item.required_headcount ??
        item.approvedRequirement ??
        item.approved_requirement ??
        0,
    ),
    hiringManager:
      item.hiringManager || item.hiring_manager || item.manager || "",
    targetDate:
      item.targetDate ||
      item.target_date ||
      item.dueDate ||
      item.due_date ||
      item.requestedStartDate ||
      item.requested_start_date ||
      "",
    status:
      item.status || item.approvalStatus || item.approval_status || "Pending",
  };
}

export default function ActionItemsDataBridge({ children }) {
  const location = useLocation();
  const isActionItemsRoute =
    location.pathname.startsWith("/recruitment/action-item") ||
    location.pathname.startsWith("/action-item");

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

  const refreshLiveSources = useCallback(
    async ({ force = false } = {}) => {
      const pathname =
        typeof window !== "undefined" ? window.location.pathname : "";
      const isPublicRoute = isPublicActionItemsPath(pathname);

      if (isPublicRoute || userLoading || !user || !canLoadActionItems) {
        return;
      }

      if (!isActionItemsRoute && !force) {
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
    },
    [
      canLoadActionItems,
      canRefreshSourcing,
      fetchHiringNeeds,
      isActionItemsRoute,
      refreshCandidatePipeline,
      refreshOffers,
      refreshOnboarding,
      refreshSourcing,
      refreshWorkforceHiring,
      user,
      userLoading,
    ],
  );

  useEffect(() => {
    if (isActionItemsRoute) {
      refreshLiveSources();
    }
  }, [isActionItemsRoute, refreshLiveSources]);

  useEffect(() => {
    function handleSourceRefresh() {
      refreshLiveSources({ force: true });
    }

    function handleSourceUpdated() {
      if (isActionItemsRoute) {
        setBridgeVersion((value) => value + 1);
      }
    }

    window.addEventListener(SOURCE_REFRESH_EVENT, handleSourceRefresh);

    const refreshEvents = [
      "storage",
      "ta-hiring-needs-updated",
      "ta-workforce-hiring-plan-updated",
      "ta-weekly-hiring-action-items-updated",
      "ta-pipeline-candidates-updated",
      "ta-offers-updated",
      "ta-onboarding-updated",
      "ta-talent-pool-updated",
    ];

    refreshEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleSourceUpdated);
    });

    return () => {
      window.removeEventListener(SOURCE_REFRESH_EVENT, handleSourceRefresh);

      refreshEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleSourceUpdated);
      });
    };
  }, [isActionItemsRoute, refreshLiveSources]);

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
