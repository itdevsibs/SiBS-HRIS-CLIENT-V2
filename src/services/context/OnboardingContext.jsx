import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createOnboardingRecord,
  getOnboardingRecords,
  updateOnboardingOutcome,
} from "../../lib/axios/getOnboarding";

import { usePagination } from "./PaginationContext";

const OnboardingContext = createContext(null);

const DEFAULT_FILTERS = {
  search: "",
  showStatus: "All",
  finalOutcome: "All",
};

function cleanText(value) {
  return String(value ?? "").trim();
}

function getApiErrorMessage(error, fallback = "Request failed.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function normalizeStatus(value, fallback = "Pending") {
  const text = cleanText(value);

  if (!text) return fallback;

  const key = text.toLowerCase();

  if (key === "pending start") return "Pending Start";
  if (key === "pending") return "Pending Start";
  if (key === "true hire") return "True Hire";
  if (key === "no show") return "No Show";
  if (key === "pre-start withdrawal") return "Pre-start Withdrawal";
  if (key === "pre start withdrawal") return "Pre-start Withdrawal";
  if (key === "show") return "Show";

  return text;
}

function getRawOnboardingId(record = {}) {
  return (
    record.rawId ||
    record.raw_id ||
    record.id ||
    record.onboardingRecordId ||
    record.onboarding_record_id ||
    record.recordId ||
    record.record_id ||
    ""
  );
}

function buildOnboardingId(record = {}) {
  const existingId =
    record.onboardingId ||
    record.onboarding_id ||
    record.onboardingCode ||
    record.onboarding_code ||
    "";

  const rawId = getRawOnboardingId(record);

  const value = cleanText(existingId || rawId);

  if (!value) return "—";

  if (/^ONB-/i.test(value)) {
    return value.toUpperCase();
  }

  if (/^\d+$/.test(value)) {
    return `ONB-${value.padStart(6, "0")}`;
  }

  return value;
}

function normalizeRecord(row = {}) {
  const rawId = getRawOnboardingId(row);
  const onboardingId = buildOnboardingId({
    ...row,
    id: rawId,
  });

  const candidateName =
    row.candidateName ||
    row.candidate_name ||
    row.name ||
    row.fullName ||
    row.full_name ||
    "Unnamed Candidate";

  const candidateEmail =
    row.candidateEmail ||
    row.candidate_email ||
    row.email ||
    "";

  const roleTitle =
    row.roleTitle ||
    row.role_title ||
    row.currentAppliedRole ||
    row.current_applied_role ||
    row.openPosition ||
    row.open_position ||
    row.role ||
    "";

  const account =
    row.account ||
    row.currentAppliedAccount ||
    row.current_applied_account ||
    row.finalAccount ||
    row.final_account ||
    row.accountName ||
    row.account_name ||
    "";

  const roleAccount =
    row.roleAccount ||
    row.role_account ||
    [roleTitle, account].filter(Boolean).join(" - ");

  const finalOutcome = normalizeStatus(
    row.finalOutcome || row.final_outcome || row.outcome,
    "Pending Start",
  );

  const showStatus = normalizeStatus(
    row.showStatus || row.show_status,
    "Pending",
  );

  const acceptedOfferDate =
    row.acceptedOfferDate ||
    row.accepted_offer_date ||
    row.offerDecisionAt ||
    row.offer_decision_at ||
    row.offerAcceptedAt ||
    row.offer_accepted_at ||
    row.createdAt ||
    row.created_at ||
    "";

  const expectedStartDate =
    row.expectedStartDate ||
    row.expected_start_date ||
    row.nhoStartDate ||
    row.nho_start_date ||
    row.startDate ||
    row.start_date ||
    "";

  const actualStartDate =
    row.actualStartDate ||
    row.actual_start_date ||
    "";

  const owner =
    row.owner ||
    row.taOwner ||
    row.ta_owner ||
    row.currentTaOwner ||
    row.current_ta_owner ||
    "system";

  return {
    ...row,

    rawId,
    raw_id: rawId,

    id: rawId,

    onboardingId,
    onboarding_id: onboardingId,
    onboardingCode: onboardingId,
    onboarding_code: onboardingId,

    candidatePipelineId:
      row.candidatePipelineId ||
      row.candidate_pipeline_id ||
      row.pipelineId ||
      row.pipeline_id ||
      "",

    candidateApplicationId:
      row.candidateApplicationId ||
      row.candidate_application_id ||
      row.applicationId ||
      row.application_id ||
      "",

    candidateId: row.candidateId || row.candidate_id || "",

    candidateName,
    candidate_name: candidateName,
    name: candidateName,

    candidateEmail,
    candidate_email: candidateEmail,
    email: candidateEmail,

    roleTitle,
    role_title: roleTitle,

    account,

    roleAccount,
    role_account: roleAccount,

    acceptedOfferDate,
    accepted_offer_date: acceptedOfferDate,

    expectedStartDate,
    expected_start_date: expectedStartDate,

    actualStartDate,
    actual_start_date: actualStartDate,

    owner,

    location:
      row.location ||
      row.workLocation ||
      row.work_location ||
      row.nhoLocation ||
      row.nho_location ||
      "Davao",

    showStatus,
    show_status: showStatus,

    finalOutcome,
    final_outcome: finalOutcome,

    reasonCategory:
      row.reasonCategory ||
      row.reason_category ||
      "",

    withdrawalReason:
      row.withdrawalReason ||
      row.withdrawal_reason ||
      "",

    candidateFeedback:
      row.candidateFeedback ||
      row.candidate_feedback ||
      "",

    experienceRating:
      row.experienceRating ||
      row.experience_rating ||
      0,

    feedbackTag:
      row.feedbackTag ||
      row.feedback_tag ||
      "",

    remarks: row.remarks || "",

    createdAt: row.createdAt || row.created_at || "",
    created_at: row.createdAt || row.created_at || "",

    updatedAt: row.updatedAt || row.updated_at || "",
    updated_at: row.updatedAt || row.updated_at || "",
  };
}

function normalizeRecords(rows = []) {
  return Array.isArray(rows) ? rows.map(normalizeRecord) : [];
}

function buildSearchText(record = {}) {
  return [
    record.id,
    record.rawId,
    record.onboardingId,
    record.onboarding_id,
    record.candidatePipelineId,
    record.candidateId,
    record.candidateApplicationId,
    record.candidateName,
    record.candidateEmail,
    record.roleTitle,
    record.account,
    record.roleAccount,
    record.owner,
    record.location,
    record.showStatus,
    record.finalOutcome,
    record.reasonCategory,
    record.withdrawalReason,
    record.feedbackTag,
    record.remarks,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getRecordFromResponse(response = {}) {
  return (
    response?.record ||
    response?.data?.record ||
    response?.data?.onboarding ||
    response?.data ||
    response?.onboarding ||
    null
  );
}

function mergeUpdatedRecord(list = [], updatedRecord = {}) {
  const normalizedUpdated = normalizeRecord(updatedRecord);
  const updatedId = cleanText(normalizedUpdated.id);
  const updatedOnboardingId = cleanText(normalizedUpdated.onboardingId);
  const updatedPipelineId = cleanText(normalizedUpdated.candidatePipelineId);
  const updatedCandidateId = cleanText(normalizedUpdated.candidateId);
  const updatedEmail = cleanText(normalizedUpdated.candidateEmail).toLowerCase();

  let didUpdate = false;

  const nextList = list.map((record) => {
    const currentId = cleanText(record.id);
    const currentOnboardingId = cleanText(record.onboardingId);
    const currentPipelineId = cleanText(record.candidatePipelineId);
    const currentCandidateId = cleanText(record.candidateId);
    const currentEmail = cleanText(record.candidateEmail).toLowerCase();

    const isSame =
      (updatedId && currentId && updatedId === currentId) ||
      (updatedOnboardingId &&
        currentOnboardingId &&
        updatedOnboardingId === currentOnboardingId) ||
      (updatedPipelineId &&
        currentPipelineId &&
        updatedPipelineId === currentPipelineId) ||
      (updatedCandidateId &&
        currentCandidateId &&
        updatedCandidateId === currentCandidateId) ||
      (updatedEmail && currentEmail && updatedEmail === currentEmail);

    if (!isSame) return record;

    didUpdate = true;

    return normalizeRecord({
      ...record,
      ...updatedRecord,
      id: record.id || updatedRecord.id,
      rawId: record.rawId || updatedRecord.rawId || updatedRecord.id,
    });
  });

  if (didUpdate) return nextList;

  return [normalizedUpdated, ...nextList];
}

export const OnboardingProvider = ({ children }) => {
  const pagination = usePagination("onboarding");

  const [list, setList] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const fetchList = useCallback(
    async (params = {}) => {
      setLoading(true);
      setLoadError("");

      try {
        const res = await getOnboardingRecords({
          search: filters.search,
          showStatus: filters.showStatus,
          finalOutcome: filters.finalOutcome,
          ...params,
        });

        if (!res?.success) {
          throw new Error(res?.message || "Failed to load onboarding records.");
        }

        const rows = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.records)
            ? res.records
            : [];

        const normalizedRows = normalizeRecords(rows);

        setList(normalizedRows);

        return {
          success: true,
          data: normalizedRows,
          records: normalizedRows,
          pagination: res.pagination,
          counts: res.counts || {},
        };
      } catch (error) {
        console.error("FETCH ONBOARDING LIST ERROR:", error);

        const message = getApiErrorMessage(
          error,
          "Failed to load onboarding records.",
        );

        setList([]);
        setLoadError(message);

        return {
          success: false,
          data: [],
          records: [],
          message,
        };
      } finally {
        setLoading(false);
      }
    },
    [filters.finalOutcome, filters.search, filters.showStatus],
  );

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    let syncTimeout = null;

    function queueSync() {
      window.clearTimeout(syncTimeout);

      syncTimeout = window.setTimeout(() => {
        fetchList();
      }, 300);
    }

    function handleOnboardingUpdate(event) {
      const detail = event?.detail || {};
      const candidate = detail.candidate || detail.record || detail.data || null;

      if (candidate && typeof candidate === "object") {
        const candidateName =
          candidate.candidateName ||
          candidate.name ||
          candidate.fullName ||
          candidate.full_name ||
          "";

        const candidateEmail =
          candidate.candidateEmail ||
          candidate.email ||
          "";

        const roleTitle =
          candidate.roleTitle ||
          candidate.role_title ||
          candidate.currentAppliedRole ||
          candidate.current_applied_role ||
          candidate.openPosition ||
          candidate.open_position ||
          "";

        const account =
          candidate.account ||
          candidate.currentAppliedAccount ||
          candidate.current_applied_account ||
          candidate.finalAccount ||
          candidate.final_account ||
          "";

        const optimisticRecord = normalizeRecord({
          id:
            candidate.onboardingRecordId ||
            candidate.onboarding_record_id ||
            candidate.onboardingId ||
            candidate.onboarding_id ||
            candidate.id ||
            candidate.rawId ||
            "",
          candidatePipelineId:
            candidate.candidatePipelineId ||
            candidate.candidate_pipeline_id ||
            candidate.pipelineId ||
            candidate.pipeline_id ||
            candidate.dbId ||
            candidate.id ||
            "",
          candidateApplicationId:
            candidate.candidateApplicationId ||
            candidate.candidate_application_id ||
            candidate.applicationId ||
            candidate.application_id ||
            "",
          candidateId: candidate.candidateId || candidate.candidate_id || "",
          candidateName,
          candidateEmail,
          roleTitle,
          account,
          roleAccount: [roleTitle, account].filter(Boolean).join(" - "),
          acceptedOfferDate:
            candidate.acceptedOfferDate ||
            candidate.accepted_offer_date ||
            candidate.offerDecisionAt ||
            candidate.offer_decision_at ||
            candidate.createdAt ||
            candidate.created_at ||
            "",
          expectedStartDate:
            candidate.expectedStartDate ||
            candidate.expected_start_date ||
            candidate.nhoStartDate ||
            candidate.nho_start_date ||
            candidate.startDate ||
            candidate.start_date ||
            "",
          owner:
            candidate.owner ||
            candidate.currentTaOwner ||
            candidate.current_ta_owner ||
            candidate.taOwner ||
            candidate.ta_owner ||
            "system",
          showStatus: "Pending",
          finalOutcome: "Pending Start",
          remarks: candidate.remarks || "",
          createdAt:
            candidate.createdAt ||
            candidate.created_at ||
            new Date().toISOString(),
          updatedAt:
            candidate.updatedAt ||
            candidate.updated_at ||
            new Date().toISOString(),
        });

        setList((previousList) =>
          mergeUpdatedRecord(previousList, optimisticRecord),
        );
      }

      queueSync();
    }

    window.addEventListener("ta-onboarding-updated", handleOnboardingUpdate);
    window.addEventListener("ta-pipeline-candidates-updated", handleOnboardingUpdate);

    return () => {
      window.clearTimeout(syncTimeout);
      window.removeEventListener("ta-onboarding-updated", handleOnboardingUpdate);
      window.removeEventListener(
        "ta-pipeline-candidates-updated",
        handleOnboardingUpdate,
      );
    };
  }, [fetchList]);

  const createRecord = useCallback(
    async (payload = {}) => {
      setSaving(true);
      setActionError("");

      try {
        const res = await createOnboardingRecord(payload);

        if (!res?.success) {
          throw new Error(res?.message || "Failed to create onboarding record.");
        }

        const savedRecord = getRecordFromResponse(res);

        if (savedRecord && typeof savedRecord === "object") {
          setList((previousList) =>
            mergeUpdatedRecord(previousList, savedRecord),
          );
        }

        await fetchList();

        return res;
      } catch (error) {
        console.error("CREATE ONBOARDING RECORD ERROR:", error);

        const message = getApiErrorMessage(
          error,
          "Failed to create onboarding record.",
        );

        setActionError(message);

        return {
          success: false,
          message,
        };
      } finally {
        setSaving(false);
      }
    },
    [fetchList],
  );

  const updateOutcome = useCallback(
    async (id, data = {}) => {
      if (!id) {
        return {
          success: false,
          message: "Onboarding record ID is required.",
        };
      }

      setSaving(true);
      setActionError("");

      try {
        const res = await updateOnboardingOutcome(id, data);

        if (!res?.success) {
          throw new Error(
            res?.message || "Failed to update onboarding outcome.",
          );
        }

        const updatedRecord = getRecordFromResponse(res);

        if (updatedRecord && typeof updatedRecord === "object") {
          setList((previousList) =>
            mergeUpdatedRecord(previousList, updatedRecord),
          );
        } else {
          setList((previousList) =>
            previousList.map((record) => {
              if (String(record.id) !== String(id)) return record;

              return normalizeRecord({
                ...record,
                ...data,
                updatedAt: new Date().toISOString(),
              });
            }),
          );
        }

        await fetchList();

        return res;
      } catch (error) {
        console.error("UPDATE ONBOARDING OUTCOME ERROR:", error);

        const message = getApiErrorMessage(
          error,
          "Failed to update onboarding outcome.",
        );

        setActionError(message);

        return {
          success: false,
          message,
        };
      } finally {
        setSaving(false);
      }
    },
    [fetchList],
  );

  const setSearch = useCallback(
    (value) => {
      const nextValue = cleanText(value);

      setFilters((prev) => ({
        ...prev,
        search: nextValue,
      }));

      pagination?.setFilter?.("search", nextValue);
    },
    [pagination],
  );

  const setShowStatusFilter = useCallback(
    (value) => {
      const nextValue = value || "All";

      setFilters((prev) => ({
        ...prev,
        showStatus: nextValue,
      }));

      pagination?.setFilter?.("showStatus", nextValue);
    },
    [pagination],
  );

  const setOutcomeFilter = useCallback(
    (value) => {
      const nextValue = value || "All";

      setFilters((prev) => ({
        ...prev,
        finalOutcome: nextValue,
      }));

      pagination?.setFilter?.("finalOutcome", nextValue);
    },
    [pagination],
  );

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);

    pagination?.setFilter?.("search", "");
    pagination?.setFilter?.("showStatus", "All");
    pagination?.setFilter?.("finalOutcome", "All");
  }, [pagination]);

  const filteredList = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();

    return list.filter((item) => {
      const matchesSearch =
        !keyword || buildSearchText(item).includes(keyword);

      const matchesShowStatus =
        filters.showStatus === "All" ||
        item.showStatus === filters.showStatus;

      const matchesOutcome =
        filters.finalOutcome === "All" ||
        item.finalOutcome === filters.finalOutcome;

      return matchesSearch && matchesShowStatus && matchesOutcome;
    });
  }, [filters.finalOutcome, filters.search, filters.showStatus, list]);

  const stats = useMemo(() => {
    const total = list.length;

    const trueHires = list.filter(
      (item) => item.finalOutcome === "True Hire",
    ).length;

    const pending = list.filter(
      (item) =>
        item.finalOutcome === "Pending Start" ||
        item.finalOutcome === "Pending",
    ).length;

    const noShow = list.filter(
      (item) => item.finalOutcome === "No Show",
    ).length;

    const withdrawals = list.filter(
      (item) => item.finalOutcome === "Pre-start Withdrawal",
    ).length;

    const show = list.filter((item) => item.showStatus === "Show").length;

    const pendingShow = list.filter(
      (item) => item.showStatus === "Pending",
    ).length;

    const activeTotal = total - pending;
    const showRate =
      activeTotal > 0 ? Math.round((trueHires / activeTotal) * 100) : 0;

    return {
      total,

      trueHires,
      trueHire: trueHires,

      pending,
      pendingStart: pending,

      noShow,
      noShows: noShow,

      withdrawals,
      preStartWithdrawals: withdrawals,

      show,
      pendingShow,
      showRate,
    };
  }, [list]);

  const showStatusOptions = useMemo(() => {
    const values = Array.from(
      new Set(list.map((item) => item.showStatus).filter(Boolean)),
    );

    return ["All", ...values];
  }, [list]);

  const outcomeOptions = useMemo(() => {
    const values = Array.from(
      new Set(list.map((item) => item.finalOutcome).filter(Boolean)),
    );

    return ["All", ...values];
  }, [list]);

  const ownerOptions = useMemo(() => {
    const values = Array.from(
      new Set(list.map((item) => item.owner).filter(Boolean)),
    );

    return ["All", ...values];
  }, [list]);

  const value = {
    list,
    setList,

    filteredList,
    records: list,
    filteredRecords: filteredList,

    loading,
    isLoading: loading,

    saving,
    isSaving: saving,

    loadError,
    actionError,

    stats,

    filters,
    search: filters.search,
    setSearch,

    showStatusFilter: filters.showStatus,
    setShowStatusFilter,

    outcomeFilter: filters.finalOutcome,
    finalOutcomeFilter: filters.finalOutcome,
    setOutcomeFilter,
    setFinalOutcomeFilter: setOutcomeFilter,

    showStatusOptions,
    outcomeOptions,
    ownerOptions,

    fetchList,
    refreshOnboarding: fetchList,

    createRecord,
    updateOutcome,

    clearFilters,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error("useOnboarding must be used inside OnboardingProvider");
  }

  return context;
};