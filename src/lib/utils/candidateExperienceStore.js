import {
  RECRUITMENT_EVENTS,
  RECRUITMENT_KEYS,
  dispatchRecruitmentEvent,
  getTodayDate,
  readArray,
  writeArray,
} from "@/lib/utils/recruitmentStore";
import {
  normalizeCandidateExperienceRecord,
  RESPONSE_SOURCE,
} from "@/lib/utils/candidateExperience/index.js";

export function getCandidateExperienceRecords() {
  return readArray(RECRUITMENT_KEYS.CANDIDATE_EXPERIENCE).map(
    normalizeCandidateExperienceRecord,
  );
}

export function saveCandidateExperienceRecord(record) {
  const current = getCandidateExperienceRecords();
  const normalized = normalizeCandidateExperienceRecord({
    ...record,
    responseSource:
      record?.responseSource || record?.response_source || RESPONSE_SOURCE.TA_MANUAL,
    dateRecorded: record?.dateRecorded || record?.date_recorded || getTodayDate(),
  });

  const existingIndex = current.findIndex((item) => String(item.id) === String(normalized.id));
  const next = existingIndex >= 0
    ? current.map((item, index) => (index === existingIndex ? normalized : item))
    : [normalized, ...current];

  writeArray(RECRUITMENT_KEYS.CANDIDATE_EXPERIENCE, next);
  dispatchRecruitmentEvent(RECRUITMENT_EVENTS.EXPERIENCE_UPDATED, normalized);
  return normalized;
}

export function saveCandidateExperienceRecords(records) {
  const normalized = (Array.isArray(records) ? records : []).map(
    normalizeCandidateExperienceRecord,
  );
  writeArray(RECRUITMENT_KEYS.CANDIDATE_EXPERIENCE, normalized);
  dispatchRecruitmentEvent(RECRUITMENT_EVENTS.EXPERIENCE_UPDATED, normalized);
  return normalized;
}
