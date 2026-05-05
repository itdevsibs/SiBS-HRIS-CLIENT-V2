import {
  RECRUITMENT_EVENTS,
  RECRUITMENT_KEYS,
  dispatchRecruitmentEvent,
  getTodayDate,
  readArray,
  writeArray,
} from "@/lib/utils/recruitmentStore";

export function normalizeCandidateExperienceRecord(record) {
  const id =
    record.id ||
    record.experienceId ||
    `EXP-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  return {
    id,
    experienceId: id,
    candidateId: record.candidateId || "",
    candidateName: record.candidateName || record.name || "",
    candidateEmail: record.candidateEmail || record.email || "",
    applicationId: record.applicationId || record.candidateApplicationId || null,
    roleTitle: record.roleTitle || "",
    account: record.account || "",
    source: record.source || "Manual Entry",
    eventType: record.eventType || "Manual Candidate Experience",
    currentStage: record.currentStage || record.dropOffStage || "",
    finalStatus: record.finalStatus || "Drop-off",
    dropOffStage: record.dropOffStage || record.currentStage || "",
    dropOffCategory: record.dropOffCategory || record.reasonCategory || "Others",
    dropOffReason: record.dropOffReason || record.withdrawalReason || "",
    feedback: record.feedback || record.candidateFeedback || "",
    experienceRating: Number(record.experienceRating || 3),
    feedbackTag:
      record.feedbackTag ||
      record.dropOffCategory ||
      record.reasonCategory ||
      record.eventType ||
      "Candidate Experience",
    owner: record.owner || "Unassigned",
    dateRecorded: record.dateRecorded || getTodayDate(),
    stageTimeline: Array.isArray(record.stageTimeline)
      ? record.stageTimeline
      : [],
  };
}

export function getCandidateExperienceRecords() {
  return readArray(RECRUITMENT_KEYS.CANDIDATE_EXPERIENCE);
}

export function saveCandidateExperienceRecord(record) {
  const current = getCandidateExperienceRecords();
  const normalized = normalizeCandidateExperienceRecord(record);

  const existingIndex = current.findIndex(
    (item) =>
      String(item.id) === String(normalized.id) ||
      (item.candidateEmail === normalized.candidateEmail &&
        item.eventType === normalized.eventType &&
        item.dateRecorded === normalized.dateRecorded)
  );

  const next =
    existingIndex >= 0
      ? current.map((item, index) => (index === existingIndex ? normalized : item))
      : [normalized, ...current];

  writeArray(RECRUITMENT_KEYS.CANDIDATE_EXPERIENCE, next);
  dispatchRecruitmentEvent(RECRUITMENT_EVENTS.EXPERIENCE_UPDATED, normalized);

  return normalized;
}

export function saveCandidateExperienceRecords(records) {
  const normalized = records.map((record) => normalizeCandidateExperienceRecord(record));
  writeArray(RECRUITMENT_KEYS.CANDIDATE_EXPERIENCE, normalized);
  dispatchRecruitmentEvent(RECRUITMENT_EVENTS.EXPERIENCE_UPDATED, normalized);
  return normalized;
}
