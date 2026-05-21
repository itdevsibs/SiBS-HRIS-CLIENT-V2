import {
  CANDIDATE_APPLICATIONS_STORAGE_KEY,
  PIPELINE_CANDIDATES_STORAGE_KEY,
} from "./candidatePipelineConstants";

export function safeReadArray(key) {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function safeWriteArray(key, value) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage only
  }
}

export function loadPipelineCandidateData() {
  const applicationCandidates = safeReadArray(
    CANDIDATE_APPLICATIONS_STORAGE_KEY,
  );

  const pipelineCandidatesFromStorage = safeReadArray(
    PIPELINE_CANDIDATES_STORAGE_KEY,
  );

  return applicationCandidates.length > 0
    ? applicationCandidates
    : pipelineCandidatesFromStorage;
}

export function savePipelineCandidateData(candidates) {
  safeWriteArray(PIPELINE_CANDIDATES_STORAGE_KEY, candidates);
  safeWriteArray(CANDIDATE_APPLICATIONS_STORAGE_KEY, candidates);
}