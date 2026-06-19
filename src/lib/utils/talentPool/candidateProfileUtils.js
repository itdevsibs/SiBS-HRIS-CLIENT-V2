import { formatCurrency } from "./talentPoolHelpers";

export function getNormalizedHistoryDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).trim();
  }
  return date.toISOString().slice(0, 16);
}

export function getCandidateStageValue(candidate = {}) {
  return (
    candidate.currentStage ||
    candidate.currentPipelineStage ||
    candidate.pipelineStage ||
    candidate.stage ||
    ""
  );
}

export function isCandidateLinkedToPipeline(candidate = {}) {
  return Boolean(
    candidate?.pipelineStatus ||
      candidate?.currentPipelineStage ||
      candidate?.currentTaOwner ||
      candidate?.pipelineStage ||
      candidate?.currentStage ||
      candidate?.movedToPipeline ||
      candidate?.pipelineCandidate ||
      candidate?.pipelineId ||
      candidate?.pipelineDbId,
  );
}

export function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

export function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

export function cleanText(value) {
  return String(value ?? "").trim();
}

export function getApiErrorMessage(error, fallback = "Request failed.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export function getCandidatePipelineLookupId(candidate = {}) {
  const safeCandidate = safeObject(candidate);
  const pipelineCandidate = safeObject(safeCandidate.pipelineCandidate);
  const metadata = safeObject(safeCandidate.metadata);
  const candidateSnapshot = safeObject(safeCandidate.candidateSnapshot);

  return (
    pipelineCandidate.dbId ||
    pipelineCandidate.id ||
    safeCandidate.pipelineDbId ||
    safeCandidate.pipelineId ||
    safeCandidate.dbId ||
    safeCandidate.pipelineCandidateId ||
    metadata.pipelineId ||
    metadata.pipelineDbId ||
    metadata.candidatePipelineId ||
    candidateSnapshot.pipelineId ||
    candidateSnapshot.dbId ||
    safeCandidate.candidateId ||
    safeCandidate.candidateApplicationId ||
    safeCandidate.applicationId ||
    safeCandidate.id ||
    ""
  );
}

export function getResolvedFileUrl(fileUrl = "") {
  const value = cleanText(fileUrl);
  if (!value) return "";
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }
  const apiBaseUrl = cleanText(import.meta.env.VITE_API_URL).replace(/\/+$/, "");   
  if (value.startsWith("/api/") && apiBaseUrl) {
    return `${apiBaseUrl}${value}`;
  }
  return value;
}

export function buildCandidatePipelineFileUrl(candidate = {}, file = {}) {
  const lookupId = getCandidatePipelineLookupId(candidate);
  const filename =
    file.savedFileName ||
    file.filename ||
    file.saved_file_name ||
    file.fileName ||
    file.name ||
    "";
  if (!lookupId || !filename) return "";
  return `/api/candidate-pipeline/file/${encodeURIComponent(
    lookupId,
  )}/${encodeURIComponent(filename)}`;
}

export function normalizeCandidateFile(file = {}, candidate = {}) {
  const fileName =
    file.fileName ||
    file.name ||
    file.originalName ||
    file.originalname ||
    file.attachmentFileName ||
    file.audioFileName ||
    "";
  const savedFileName =
    file.savedFileName || file.filename || file.saved_file_name || "";
  const fileUrl =
    file.fileUrl ||
    file.url ||
    file.dataUrl ||
    file.attachmentFileUrl ||
    file.audioFileUrl ||
    buildCandidatePipelineFileUrl(candidate, file);
  return {
    id:
      file.id ||
      file.fileId ||
      `${file.requirement || file.label || "file"}-${fileName}-${savedFileName}`,   
    requirement:
      file.requirement ||
      file.label ||
      file.title ||
      file.category ||
      "Uploaded File",
    fileName,
    savedFileName,
    filename: file.filename || savedFileName,
    fileUrl: getResolvedFileUrl(fileUrl),
    fileType:
      file.fileType ||
      file.type ||
      file.mimetype ||
      file.mimeType ||
      file.attachmentFileType ||
      file.audioFileType ||
      "",
    fileSize:
      file.fileSize ||
      file.size ||
      file.attachmentFileSize ||
      file.audioFileSize ||
      0,
    uploadedAt: file.uploadedAt || file.createdAt || file.updatedAt || "",
    uploadedBy: file.uploadedBy || file.createdBy || file.updatedBy || "",
    applicantFolderName: file.applicantFolderName || "",
  };
}

export function dedupeCandidateFiles(files = []) {
  const map = new Map();
  files.filter(Boolean).forEach((file) => {
    const key = [
      file.requirement,
      file.fileName,
      file.savedFileName,
      file.filename,
      file.fileUrl,
    ]
      .map((value) => cleanText(value).toLowerCase())
      .join("|");
    if (!key.replace(/\|/g, "")) return;
    if (!map.has(key)) {
      map.set(key, file);
    }
  });
  return Array.from(map.values());
}

export function getCandidatePreEmploymentFiles(candidate = {}) {
  const safeCandidate = safeObject(candidate);
  const metadata = safeObject(safeCandidate.metadata);
  const candidateSnapshot = safeObject(safeCandidate.candidateSnapshot);
  const pipelineCandidate = safeObject(safeCandidate.pipelineCandidate);
  const sources = [
    safeCandidate.nhoFiles,
    safeCandidate.nho_files,
    safeCandidate.preEmploymentFiles,
    safeCandidate.pre_employment_files,
    safeCandidate.uploadedFiles,
    safeCandidate.files,
    metadata.nhoFiles,
    metadata.nho_files,
    metadata.preEmploymentFiles,
    candidateSnapshot.nhoFiles,
    candidateSnapshot.preEmploymentFiles,
    pipelineCandidate.nhoFiles,
    pipelineCandidate.nho_files,
    pipelineCandidate.preEmploymentFiles,
  ];
  return dedupeCandidateFiles(
    sources
      .flatMap((source) => safeArray(source))
      .map((file) => normalizeCandidateFile(file, safeCandidate)),
  );
}

export function isValidTimelineValue(value) {
  const text = String(value || "")
    .trim()
    .toLowerCase();
  return (
    text &&
    text !== "—" &&
    text !== "--" &&
    text !== "not assigned yet" &&
    text !== "n/a" &&
    text !== "na" &&
    text !== "null" &&
    text !== "undefined"
  );
}

export function getHistoryTitle(item = {}) {
  const rawTitle =
    item.stage ||
    item.pipelineStage ||
    item.currentStage ||
    item.outcome ||
    item.title ||
    "Application Update";
  const title = String(rawTitle || "").trim();
  if (title.includes("PRF status changed")) return "Initial Screening";
  if (title.includes("Assessment marked")) return "Online Assessment";
  if (title.includes("interview schedule")) return "Interview Scheduled";
  if (title.includes("Final interview")) return "Interviewed";
  if (title.includes("Offer details")) return "Offered";
  return title || "Application Update";
}

export function getHistoryDate(item = {}) {
  return (
    item.date ||
    item.createdAt ||
    item.updatedAt ||
    item.activityDate ||
    item.timestamp ||
    ""
  );
}

export function getHistoryOwner(item = {}, candidate = {}, fallbackOwner = "—") {   
  return (
    item.owner ||
    item.taOwner ||
    item.updatedBy ||
    item.createdBy ||
    candidate.currentTaOwner ||
    candidate.taOwner ||
    candidate.owner ||
    fallbackOwner ||
    "—"
  );
}

export function getHistoryDescription(item = {}) {
  const directDescription =
    item.description ||
    item.reason ||
    item.message ||
    item.note ||
    item.outcome ||
    "";
  if (directDescription) return directDescription;
  const title = getHistoryTitle(item);
  if (title === "Initial Screening") {
    return "PRF status changed to Matched. Candidate is ready to move to Online Assessment.";
  }
  if (title === "Online Assessment") {
    return "Assessment marked as Taken and tagged as Assessment Fit.";
  }
  if (title === "Interview Scheduled") {
    return "Candidate passed assessment and interview schedule was set.";
  }
  if (title === "Interviewed") {
    return "Final interview form was submitted. Candidate moved from Interview Scheduled to Interviewed.";
  }
  if (title === "Offered") {
    return "Interview completed. Offer details prepared and sent for approval.";   
  }
  if (title === "Accepted") {
    return "Candidate accepted the offer and moved to Accepted.";
  }
  if (title === "For NHO") {
    return "Candidate moved to For NHO.";
  }
  if (title === "Drop-off" || title === "Drop-offs") {
    return "Candidate was moved to Drop-off.";
  }
  return "Candidate application record updated.";
}

export function getOfferDetail(item = {}) {
  const role =
    item.offerRole ||
    item.finalRole ||
    item.currentAppliedRole ||
    item.appliedRole ||
    item.role ||
    item.roleTitle ||
    item.offerDetails?.roleTitle ||
    "";
  const account =
    item.offerAccount ||
    item.finalAccount ||
    item.currentAppliedAccount ||
    item.appliedAccount ||
    item.account ||
    item.offerDetails?.account ||
    "";
  const basicPay =
    item.basicPay || item.offerDetails?.basicPay || item.compensation || "";        
  const deminimisDailyRate =
    item.deminimisDailyRate || item.offerDetails?.deminimisDailyRate || "";
  const hiringRequirement =
    item.hiringRequirementId || item.offerDetails?.hiringRequirementId || "";       
  const details = [];
  if (isValidTimelineValue(hiringRequirement)) {
    details.push(`Hiring Requirement: ${hiringRequirement}`);
  }
  if (isValidTimelineValue(role)) {
    details.push(`Final Role: ${role}`);
  }
  if (isValidTimelineValue(account)) {
    details.push(`Final Account: ${account}`);
  }
  if (isValidTimelineValue(basicPay)) {
    details.push(
      `Basic Pay: ${
        String(basicPay).includes("₱") ? basicPay : formatCurrency(basicPay)        
      }`,
    );
  }
  if (isValidTimelineValue(deminimisDailyRate)) {
    details.push(
      `Deminimis / Daily Rate: ${
        String(deminimisDailyRate).includes("₱")
          ? deminimisDailyRate
          : formatCurrency(deminimisDailyRate)
      }`,
    );
  }
  return details.join(", ");
}

export function getHistoryRemarks(item = {}) {
  return item.remarks || item.dropOffReason || item.dropOffCategory || "";
}

export function normalizeHistoryItem(item = {}, candidate = {}, fallbackOwner = "—") {
  const historyTitle = getHistoryTitle(item);
  const historyDate = getHistoryDate(item);
  const historyDescription = getHistoryDescription(item);
  const historyRemarks = getHistoryRemarks(item);
  const offerDetail = getOfferDetail(item);
  const savedFormLink = item.savedFormLink || item.jobEvaluationLink || "";
  return {
    ...item,
    stage: historyTitle,
    date: historyDate,
    owner: getHistoryOwner(item, candidate, fallbackOwner),
    description: historyDescription,
    remarks: historyRemarks,
    offerDetail,
    savedFormLink,
    _dedupeKey: [
      historyTitle,
      historyDescription,
      historyRemarks,
      offerDetail,
      savedFormLink,
    ]
      .join("|")
      .toLowerCase()
      .trim(),
    _sortDate: getNormalizedHistoryDate(historyDate),
  };
}

export function getCandidateApplicationHistory(candidate = {}, fallbackOwner = "—") {
  const sources = [
    candidate.applicationHistory,
    candidate.movementTimeline,
    candidate.movementHistory,
    candidate.pipelineHistory,
    candidate.stageHistory,
    candidate.timeline,
    candidate.history,
    candidate.activityHistory,
    candidate.candidateSnapshot?.applicationHistory,
    candidate.candidateSnapshot?.timeline,
  ];
  const merged = sources
    .filter(Array.isArray)
    .flat()
    .filter(Boolean)
    .map((item) => normalizeHistoryItem(item, candidate, fallbackOwner))
    .filter((item) => item.stage || item.description);
  const uniqueMap = new Map();
  merged.forEach((item) => {
    const key = item._dedupeKey;
    if (!key) return;
    const existing = uniqueMap.get(key);
    if (!existing) {
      uniqueMap.set(key, item);
      return;
    }
    const existingDate = new Date(existing.date || 0).getTime();
    const itemDate = new Date(item.date || 0).getTime();
    if (
      Number.isFinite(itemDate) &&
      (!Number.isFinite(existingDate) || itemDate > existingDate)
    ) {
      uniqueMap.set(key, item);
    }
  });
  return Array.from(uniqueMap.values()).sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();
    if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0;
    if (Number.isNaN(dateA)) return -1;
    if (Number.isNaN(dateB)) return 1;
    return dateA - dateB;
  });
}