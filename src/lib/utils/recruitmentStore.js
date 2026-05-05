/**
 * Temporary frontend recruitment data store.
 *
 * Use this while backend tables/endpoints are not yet ready.
 * Later, replace these functions with API calls.
 */

export const RECRUITMENT_KEYS = {
  CANDIDATES: "ta_candidates",
  PUBLIC_SUBMISSIONS: "ta_public_candidate_submissions",
  INTERNAL_CANDIDATES: "ta_internal_candidates",
  CANDIDATE_APPLICATIONS: "ta_candidate_applications",
  PIPELINE_CANDIDATES: "ta_pipeline_candidates",
  PIPELINE_HISTORY: "ta_candidate_stage_history",
  OFFER_ELIGIBLE: "ta_offer_eligible_candidates",
  OFFER_RECORDS: "ta_offer_records",
  PIPELINE_SYNC_EVENTS: "ta_pipeline_sync_events",
  ONBOARDING_RECORDS: "ta_onboarding_records",
  CANDIDATE_EXPERIENCE: "ta_candidate_experience_records",
  HIRING_NEEDS: "ta_hiring_needs",
  WEEKLY_HIRING_PLANS: "ta_weekly_hiring_plans",
  ACTION_ITEMS: "ta_action_items",
};

export const RECRUITMENT_EVENTS = {
  PIPELINE_SYNC_UPDATED: "ta-pipeline-sync-updated",
  APPLICATIONS_UPDATED: "ta-candidate-applications-updated",
  OFFERS_UPDATED: "ta-offers-updated",
  ONBOARDING_UPDATED: "ta-onboarding-updated",
  EXPERIENCE_UPDATED: "ta-candidate-experience-updated",
};

export const PIPELINE_STAGES = [
  "Sourced",
  "Screened",
  "Interviewed",
  "Offered",
  "Accepted",
  "Hired",
  "Drop-offs",
];

export const NORMAL_STAGE_FLOW = [
  "Sourced",
  "Screened",
  "Interviewed",
  "Offered",
  "Accepted",
  "Hired",
];

export function readArray(key) {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeArray(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value : []));
}

export function dispatchRecruitmentEvent(name, detail = null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export function getCurrentTimestamp() {
  return new Date().toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getRoleTitle(roleAccount = "") {
  return roleAccount.split(" - ")?.[0] || roleAccount || "";
}

export function getAccount(roleAccount = "") {
  return roleAccount.split(" - ")?.[1] || "SIBS";
}

export function getNextStage(currentStage) {
  if (currentStage === "Offered") return null;

  const currentIndex = NORMAL_STAGE_FLOW.indexOf(currentStage);

  if (currentIndex === -1) return null;
  if (currentIndex === NORMAL_STAGE_FLOW.length - 1) return null;

  return NORMAL_STAGE_FLOW[currentIndex + 1];
}

export function getCandidateApplicationKey(record) {
  return String(
    record?.candidateApplicationId ||
      record?.applicationId ||
      record?.id ||
      record?.candidateId ||
      record?.candidateEmail ||
      record?.email ||
      ""
  );
}

export function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function normalizeCandidateName(candidate) {
  if (candidate?.name) return candidate.name;

  return [candidate?.firstName, candidate?.middleName, candidate?.lastName, candidate?.extension]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Candidate profile -> candidate application.
 * Talent Pool should call this when moving a candidate to Pipeline.
 */
export function createCandidateApplicationFromCandidate(candidate, hiringRequirement) {
  const applications = readArray(RECRUITMENT_KEYS.CANDIDATE_APPLICATIONS);

  const nextId =
    applications.length > 0
      ? Math.max(...applications.map((item) => Number(item.id) || 0)) + 1
      : 1;

  const roleTitle =
    hiringRequirement?.roleTitle ||
    candidate?.roleTitle ||
    candidate?.roleCapability ||
    getRoleTitle(candidate?.roleAccount);

  const account =
    hiringRequirement?.account ||
    candidate?.account ||
    getAccount(candidate?.roleAccount);

  const roleAccount =
    hiringRequirement?.roleAccount ||
    candidate?.roleAccount ||
    `${roleTitle} - ${account}`;

  const application = {
    id: nextId,
    candidateApplicationId: nextId,
    applicationId: `APP-${String(nextId).padStart(3, "0")}`,
    candidateId: candidate?.candidateId || `CAND-${String(candidate?.id || nextId).padStart(3, "0")}`,
    candidateName: normalizeCandidateName(candidate),
    name: normalizeCandidateName(candidate),
    candidateEmail: candidate?.candidateEmail || candidate?.email,
    email: candidate?.candidateEmail || candidate?.email,
    roleTitle,
    account,
    roleAccount,
    source: candidate?.source || "Talent Pool",
    owner: hiringRequirement?.taOwner || candidate?.owner || "Unassigned",
    hiringRequirementId: hiringRequirement?.id || candidate?.hiringRequirementId || null,
    jobDescriptionId: hiringRequirement?.jobDescriptionId || candidate?.jobDescriptionId || null,
    currentStage: "Sourced",
    previousStage: null,
    dateMoved: getTodayDate(),
    reasonForMovement: "Candidate moved from Talent Pool to Candidate Pipeline.",
    status: "Active",
    dropOffReason: null,
    dropOffCategory: null,
    timeline: [
      {
        stage: "Sourced",
        owner: hiringRequirement?.taOwner || candidate?.owner || "Unassigned",
        source: candidate?.source || "Talent Pool",
        timestamp: getCurrentTimestamp(),
        reason: "Candidate application created from Talent Pool.",
      },
    ],
    createdAt: getCurrentTimestamp(),
  };

  const updatedApplications = [application, ...applications];
  writeArray(RECRUITMENT_KEYS.CANDIDATE_APPLICATIONS, updatedApplications);
  dispatchRecruitmentEvent(RECRUITMENT_EVENTS.APPLICATIONS_UPDATED, application);

  return application;
}

export function upsertOfferEligibleCandidate(candidate) {
  const current = readArray(RECRUITMENT_KEYS.OFFER_ELIGIBLE);

  const payload = {
    candidateApplicationId: candidate.candidateApplicationId || candidate.id,
    candidateId: candidate.candidateId,
    candidateName: candidate.candidateName || candidate.name,
    candidateEmail: candidate.candidateEmail || candidate.email,
    roleTitle: candidate.roleTitle || getRoleTitle(candidate.roleAccount),
    account: candidate.account || getAccount(candidate.roleAccount),
    roleAccount: candidate.roleAccount,
    owner: candidate.owner,
    currentStage: "Offered",
    source: candidate.source,
  };

  const next = current.some(
    (item) =>
      String(item.candidateApplicationId) === String(payload.candidateApplicationId) ||
      item.candidateEmail === payload.candidateEmail
  )
    ? current.map((item) =>
        String(item.candidateApplicationId) === String(payload.candidateApplicationId) ||
        item.candidateEmail === payload.candidateEmail
          ? payload
          : item
      )
    : [payload, ...current];

  writeArray(RECRUITMENT_KEYS.OFFER_ELIGIBLE, next);
}

export function removeOfferEligibleCandidate(candidate) {
  const current = readArray(RECRUITMENT_KEYS.OFFER_ELIGIBLE);

  const next = current.filter(
    (item) =>
      String(item.candidateApplicationId) !==
        String(candidate.candidateApplicationId || candidate.id) &&
      item.candidateEmail !== (candidate.candidateEmail || candidate.email)
  );

  writeArray(RECRUITMENT_KEYS.OFFER_ELIGIBLE, next);
}

export function appendPipelineSyncEvent(event) {
  const current = readArray(RECRUITMENT_KEYS.PIPELINE_SYNC_EVENTS);
  const next = [event, ...current];

  writeArray(RECRUITMENT_KEYS.PIPELINE_SYNC_EVENTS, next);
  dispatchRecruitmentEvent(RECRUITMENT_EVENTS.PIPELINE_SYNC_UPDATED, event);

  return event;
}

export function applyOfferSyncEvents(candidates) {
  const syncEvents = readArray(RECRUITMENT_KEYS.PIPELINE_SYNC_EVENTS);

  if (!syncEvents.length) return candidates;

  return candidates.map((candidate) => {
    const candidateKey = getCandidateApplicationKey(candidate);

    const matchingEvents = syncEvents
      .filter((event) => {
        const eventKey = getCandidateApplicationKey(event);

        return (
          eventKey === candidateKey ||
          String(event.candidateEmail || "") ===
            String(candidate.candidateEmail || candidate.email || "")
        );
      })
      .reverse();

    if (!matchingEvents.length) return candidate;

    let updatedCandidate = { ...candidate };

    matchingEvents.forEach((event) => {
      const alreadyApplied = updatedCandidate.timeline?.some(
        (item) => item.pipelineSyncId === event.syncId
      );

      if (alreadyApplied) return;

      const fromStage = event.fromStage || updatedCandidate.currentStage || "Offered";
      const toStage = event.toStage || event.currentStage;

      if (!toStage) return;

      updatedCandidate = {
        ...updatedCandidate,
        previousStage: fromStage,
        currentStage: toStage,
        dateMoved: event.dateMoved || getTodayDate(),
        status:
          toStage === "Drop-offs"
            ? "Drop-off"
            : toStage === "Accepted" || toStage === "Hired"
              ? toStage
              : updatedCandidate.status,
        reasonForMovement:
          event.reasonForMovement || `Candidate moved from ${fromStage} to ${toStage}.`,
        dropOffCategory:
          toStage === "Drop-offs"
            ? event.dropOffCategory || updatedCandidate.dropOffCategory
            : null,
        dropOffReason:
          toStage === "Drop-offs"
            ? event.dropOffReason || updatedCandidate.dropOffReason
            : null,
        dropOffRemarks:
          toStage === "Drop-offs"
            ? event.remarks || updatedCandidate.dropOffRemarks
            : null,
        candidateFeedback:
          toStage === "Drop-offs"
            ? event.candidateFeedback || updatedCandidate.candidateFeedback
            : null,
        experienceRating:
          toStage === "Drop-offs"
            ? event.experienceRating || updatedCandidate.experienceRating
            : null,
        feedbackTag:
          toStage === "Drop-offs"
            ? event.feedbackTag || updatedCandidate.feedbackTag
            : null,
        timeline: [
          ...(updatedCandidate.timeline || []),
          {
            stage: toStage,
            owner: event.owner || updatedCandidate.owner,
            source: event.source || "Offer Management",
            timestamp: event.timestamp || getCurrentTimestamp(),
            reason:
              event.reasonForMovement || `Candidate moved to ${toStage} from Offers.`,
            dropOffReason: toStage === "Drop-offs" ? event.dropOffReason : null,
            dropOffCategory: toStage === "Drop-offs" ? event.dropOffCategory : null,
            remarks: event.remarks || "",
            pipelineSyncId: event.syncId,
          },
        ],
      };
    });

    return updatedCandidate;
  });
}

export function loadPipelineApplications(defaultApplications = []) {
  const storedPipeline = readArray(RECRUITMENT_KEYS.PIPELINE_CANDIDATES);
  const storedApplications = readArray(RECRUITMENT_KEYS.CANDIDATE_APPLICATIONS);

  const base = storedApplications.length
    ? storedApplications
    : storedPipeline.length
      ? storedPipeline
      : defaultApplications;

  const normalized = base.map((item) => ({
    ...item,
    candidateApplicationId: item.candidateApplicationId || item.id,
    candidateName: item.candidateName || item.name,
    name: item.name || item.candidateName,
    candidateEmail: item.candidateEmail || item.email,
    email: item.email || item.candidateEmail,
    roleTitle: item.roleTitle || getRoleTitle(item.roleAccount),
    account: item.account || getAccount(item.roleAccount),
    roleAccount: item.roleAccount || `${item.roleTitle} - ${item.account || "SIBS"}`,
    timeline: Array.isArray(item.timeline) ? item.timeline : [],
  }));

  const synced = applyOfferSyncEvents(normalized);

  writeArray(RECRUITMENT_KEYS.CANDIDATE_APPLICATIONS, synced);
  writeArray(RECRUITMENT_KEYS.PIPELINE_CANDIDATES, synced);

  synced
    .filter((candidate) => candidate.currentStage === "Offered")
    .forEach((candidate) => upsertOfferEligibleCandidate(candidate));

  return synced;
}

export function savePipelineApplications(applications) {
  writeArray(RECRUITMENT_KEYS.CANDIDATE_APPLICATIONS, applications);
  writeArray(RECRUITMENT_KEYS.PIPELINE_CANDIDATES, applications);
  dispatchRecruitmentEvent(RECRUITMENT_EVENTS.APPLICATIONS_UPDATED, applications);
}

export function loadOffers(defaultOffers = []) {
  const stored = readArray(RECRUITMENT_KEYS.OFFER_RECORDS);
  const offers = stored.length ? stored : defaultOffers;

  writeArray(RECRUITMENT_KEYS.OFFER_RECORDS, offers);
  return offers;
}

export function saveOffers(offers) {
  writeArray(RECRUITMENT_KEYS.OFFER_RECORDS, offers);
  dispatchRecruitmentEvent(RECRUITMENT_EVENTS.OFFERS_UPDATED, offers);
}

export function getAcceptedOffersWithoutOnboarding(onboardingRecords = []) {
  const offers = readArray(RECRUITMENT_KEYS.OFFER_RECORDS);
  const usedCandidateEmails = new Set(
    onboardingRecords.map((record) => record.candidateEmail)
  );

  return offers
    .filter((offer) => offer.status === "Accepted")
    .filter((offer) => !usedCandidateEmails.has(offer.candidateEmail))
    .map((offer) => ({
      offerId: offer.offerId,
      candidateApplicationId: offer.candidateApplicationId,
      candidateId: offer.candidateId,
      candidateName: offer.candidateName,
      candidateEmail: offer.candidateEmail,
      roleTitle: offer.roleTitle,
      account: offer.account,
      roleAccount: offer.roleAccount,
      acceptedOfferDate: offer.acceptedDate,
      owner: offer.owner,
    }));
}

export function appendOnboardingRecord(record) {
  const current = readArray(RECRUITMENT_KEYS.ONBOARDING_RECORDS);
  const next = [record, ...current];

  writeArray(RECRUITMENT_KEYS.ONBOARDING_RECORDS, next);
  dispatchRecruitmentEvent(RECRUITMENT_EVENTS.ONBOARDING_UPDATED, record);

  return record;
}

export function saveOnboardingRecords(records) {
  writeArray(RECRUITMENT_KEYS.ONBOARDING_RECORDS, records);
  dispatchRecruitmentEvent(RECRUITMENT_EVENTS.ONBOARDING_UPDATED, records);
}

export function markPipelineCandidateAsHired(onboardingRecord) {
  const applications = loadPipelineApplications();

  const nextApplications = applications.map((candidate) => {
    const isMatch =
      String(candidate.candidateApplicationId || "") ===
        String(onboardingRecord.candidateApplicationId || "") ||
      String(candidate.candidateEmail || candidate.email || "") ===
        String(onboardingRecord.candidateEmail || "");

    if (!isMatch) return candidate;

    const alreadyHired = candidate.timeline?.some(
      (item) => item.onboardingId === onboardingRecord.onboardingId
    );

    if (alreadyHired) return candidate;

    return {
      ...candidate,
      previousStage: candidate.currentStage,
      currentStage: "Hired",
      status: "Hired",
      dateMoved: onboardingRecord.actualStartDate || getTodayDate(),
      reasonForMovement: "Candidate showed up and was marked as True Hire.",
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: "Hired",
          owner: onboardingRecord.owner,
          source: "Onboarding",
          timestamp: getCurrentTimestamp(),
          reason: "Candidate showed up and was marked as True Hire.",
          onboardingId: onboardingRecord.onboardingId,
        },
      ],
    };
  });

  savePipelineApplications(nextApplications);

  return nextApplications;
}

export function resetRecruitmentDemoStorage() {
  Object.values(RECRUITMENT_KEYS).forEach((key) => {
    window.localStorage.removeItem(key);
  });
}
