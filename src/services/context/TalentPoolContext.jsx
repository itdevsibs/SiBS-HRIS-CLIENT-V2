import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useUser } from "./UserContext";

import {
  PUBLIC_SUBMISSIONS_KEY,
  INTERNAL_CANDIDATES_KEY,
  CANDIDATE_APPLICATIONS_KEY,
  PIPELINE_CANDIDATES_STORAGE_KEY,
  initialCandidates,
  emptyCandidateForm,
  emptyStatusForm,
  emptyMoveToPipelineForm,
  emptyExperience,
  workExperienceOptions,
  AVAILABLE_POSITIONS_STORAGE_KEY,
} from "../../lib/utils/talentPool/talentPoolConstants";

import {
  readLocalStorage,
  writeLocalStorage,
  getActiveAvailablePositions,
} from "../../lib/utils/talentPool/talentPoolStorage";

import {
  buildFullName,
  buildLeadUploadCsvTemplate,
  calculateAge,
  candidateToForm,
  formatList,
  formatReferences,
  generateCandidateId,
  getLoggedInUserName,
  getPrimaryExperienceSummary,
  getReadinessSummary,
  getTodayDate,
  normalizeCandidateRecord,
  normalizeTags,
  parseLeadUploadCsvText,
  parseUploadedLeadRow,
  readFileAsDataUrl,
  toDisplayPersonName,
} from "../../lib/utils/talentPool/talentPoolHelpers";

const TalentPoolContext = createContext(null);

function readStorage(key, fallback = []) {
  try {
    const value = localStorage.getItem(key);

    if (!value) return fallback;

    const parsed = JSON.parse(value);

    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function isTemporaryPipelineId(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .startsWith("PIPE-");
}

function normalizeMergeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getCandidateAliasKeys(candidate = {}) {
  const keys = [];

  const candidateId = String(candidate.candidateId || "").trim();
  const snapshotCandidateId = String(
    candidate.candidateSnapshot?.candidateId || "",
  ).trim();
  const email = normalizeMergeValue(
    candidate.email || candidate.candidateSnapshot?.email,
  );
  const name = normalizeMergeValue(
    candidate.name ||
      candidate.candidateName ||
      candidate.candidateSnapshot?.name,
  );

  if (snapshotCandidateId) keys.push(`candidateId:${snapshotCandidateId}`);

  if (candidateId && !isTemporaryPipelineId(candidateId)) {
    keys.push(`candidateId:${candidateId}`);
  }

  if (email) keys.push(`email:${email}`);

  if (name) keys.push(`name:${name}`);

  if (candidate.id && !isTemporaryPipelineId(candidateId)) {
    keys.push(`id:${candidate.id}`);
  }

  return [...new Set(keys)];
}

function isEmptyProfileValue(value) {
  if (value === null || value === undefined) return true;

  if (Array.isArray(value)) return value.length === 0;

  const text = String(value).trim().toLowerCase();

  return (
    text === "" ||
    text === "—" ||
    text === "--" ||
    text === "n/a" ||
    text === "na" ||
    text === "null" ||
    text === "undefined"
  );
}

function isEmptyObjectValue(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  );
}

function dedupeHistoryByContent(history = []) {
  const map = new Map();

  history.filter(Boolean).forEach((item) => {
    const key = [
      item.stage || "",
      item.outcome || "",
      item.description || "",
      item.reason || "",
      item.remarks || "",
      item.date || "",
      item.createdAt || "",
      item.timestamp || "",
    ]
      .join("|")
      .toLowerCase()
      .trim();

    if (!key) return;

    if (!map.has(key)) {
      map.set(key, item);
    }
  });

  return Array.from(map.values());
}

function stripNestedCandidateSnapshot(candidate = {}) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return {};
  }

  const { candidateSnapshot, ...rest } = candidate;

  return rest;
}

function mergeCandidateSnapshot(existingSnapshot = {}, incomingSnapshot = {}) {
  const existingClean = stripNestedCandidateSnapshot(existingSnapshot);
  const incomingClean = stripNestedCandidateSnapshot(incomingSnapshot);

  const mergedSnapshot = {
    ...existingClean,
    ...incomingClean,
  };

  Object.keys(mergedSnapshot).forEach((key) => {
    const existingValue = existingClean[key];
    const incomingValue = incomingClean[key];

    if (
      isEmptyProfileValue(incomingValue) &&
      !isEmptyProfileValue(existingValue)
    ) {
      mergedSnapshot[key] = existingValue;
    }

    if (
      isEmptyObjectValue(incomingValue) &&
      existingValue &&
      !isEmptyObjectValue(existingValue)
    ) {
      mergedSnapshot[key] = existingValue;
    }
  });

  return mergedSnapshot;
}

function mergeCandidateProfiles(
  existingCandidate = {},
  incomingCandidate = {},
) {
  const existingClean = stripNestedCandidateSnapshot(existingCandidate);
  const incomingClean = stripNestedCandidateSnapshot(incomingCandidate);

  const mergedCandidate = {
    ...existingClean,
    ...incomingClean,
  };

  const alwaysUseIncomingFields = new Set([
    "status",
    "pipelineStatus",
    "currentPipelineStage",
    "pipelineStage",
    "currentStage",
    "currentApplicationStatus",
    "currentApplicationId",
    "candidateApplicationId",
    "applicationId",
    "currentAppliedRole",
    "currentAppliedAccount",
    "currentTaOwner",
    "movedToPipeline",
    "lastActivity",
    "updatedAt",
    "dateMoved",
    "prfStatus",
    "prfReviewed",
    "prfReviewedAt",
    "assessmentStatus",
    "assessmentResult",
    "interviewStatus",
    "interviewDate",
    "interviewType",
    "offerApprovalStatus",
    "offerDecision",
  ]);

  Object.keys(mergedCandidate).forEach((key) => {
    if (alwaysUseIncomingFields.has(key)) return;

    const existingValue = existingClean[key];
    const incomingValue = incomingClean[key];

    if (
      isEmptyProfileValue(incomingValue) &&
      !isEmptyProfileValue(existingValue)
    ) {
      mergedCandidate[key] = existingValue;
      return;
    }

    if (
      isEmptyObjectValue(incomingValue) &&
      existingValue &&
      !isEmptyObjectValue(existingValue)
    ) {
      mergedCandidate[key] = existingValue;
    }
  });

  mergedCandidate.candidateId =
    existingClean.candidateId &&
    !isTemporaryPipelineId(existingClean.candidateId)
      ? existingClean.candidateId
      : incomingClean.candidateId &&
          !isTemporaryPipelineId(incomingClean.candidateId)
        ? incomingClean.candidateId
        : incomingCandidate.candidateSnapshot?.candidateId ||
          existingCandidate.candidateSnapshot?.candidateId ||
          existingClean.candidateId ||
          incomingClean.candidateId;

  mergedCandidate.applicationHistory = dedupeHistoryByContent([
    ...(Array.isArray(existingClean.applicationHistory)
      ? existingClean.applicationHistory
      : []),
    ...(Array.isArray(incomingClean.applicationHistory)
      ? incomingClean.applicationHistory
      : []),
  ]);

  mergedCandidate.timeline = dedupeHistoryByContent([
    ...(Array.isArray(existingClean.timeline) ? existingClean.timeline : []),
    ...(Array.isArray(incomingClean.timeline) ? incomingClean.timeline : []),
  ]);

  mergedCandidate.workExperiences =
    Array.isArray(incomingClean.workExperiences) &&
    incomingClean.workExperiences.length > 0
      ? incomingClean.workExperiences
      : existingClean.workExperiences;

  mergedCandidate.references =
    Array.isArray(incomingClean.references) &&
    incomingClean.references.length > 0
      ? incomingClean.references
      : existingClean.references;

  mergedCandidate.hearAboutUs =
    Array.isArray(incomingClean.hearAboutUs) &&
    incomingClean.hearAboutUs.length > 0
      ? incomingClean.hearAboutUs
      : existingClean.hearAboutUs;

  mergedCandidate.affiliations =
    Array.isArray(incomingClean.affiliations) &&
    incomingClean.affiliations.length > 0
      ? incomingClean.affiliations
      : existingClean.affiliations;

  mergedCandidate.candidateSnapshot = mergeCandidateSnapshot(
    existingCandidate.candidateSnapshot || {},
    incomingCandidate.candidateSnapshot || {},
  );

  return normalizeCandidateRecord(mergedCandidate);
}

function findMatchingCandidateInList(list = [], target = {}) {
  const targetCandidateId = String(target.candidateId || "").trim();
  const targetId = String(target.id || "").trim();
  const targetEmail = normalizeMergeValue(target.email);
  const targetName = normalizeMergeValue(target.name || target.candidateName);

  return list.find((candidate) => {
    const candidateId = String(candidate.candidateId || "").trim();
    const candidateSnapshotId = String(
      candidate.candidateSnapshot?.candidateId || "",
    ).trim();
    const id = String(candidate.id || "").trim();
    const email = normalizeMergeValue(
      candidate.email || candidate.candidateSnapshot?.email,
    );
    const name = normalizeMergeValue(
      candidate.name ||
        candidate.candidateName ||
        candidate.candidateSnapshot?.name,
    );

    return (
      (targetCandidateId &&
        (candidateId === targetCandidateId ||
          candidateSnapshotId === targetCandidateId)) ||
      (targetId && id === targetId) ||
      (targetEmail && email === targetEmail) ||
      (targetName && name === targetName)
    );
  });
}

function mergeCandidatesByCandidateId(...candidateGroups) {
  const mergedCandidates = [];
  const aliasToIndex = new Map();

  candidateGroups.flat().forEach((candidate) => {
    if (!candidate) return;

    const normalizedCandidate = normalizeCandidateRecord(candidate);
    const aliasKeys = getCandidateAliasKeys(normalizedCandidate);

    if (!aliasKeys.length) return;

    const existingIndex = aliasKeys
      .map((key) => aliasToIndex.get(key))
      .find((index) => typeof index === "number");

    if (typeof existingIndex === "number") {
      const existingCandidate = mergedCandidates[existingIndex] || {};

      mergedCandidates[existingIndex] = mergeCandidateProfiles(
        existingCandidate,
        normalizedCandidate,
      );

      getCandidateAliasKeys(mergedCandidates[existingIndex]).forEach((key) => {
        aliasToIndex.set(key, existingIndex);
      });

      return;
    }

    const nextIndex = mergedCandidates.length;

    mergedCandidates.push(normalizedCandidate);

    aliasKeys.forEach((key) => {
      aliasToIndex.set(key, nextIndex);
    });
  });

  return mergedCandidates;
}

function normalizePipelineCandidateForTalentPool(pipelineCandidate = {}) {
  const snapshot = pipelineCandidate.candidateSnapshot || {};

  const preferredCandidateId =
    snapshot.candidateId ||
    (!isTemporaryPipelineId(pipelineCandidate.candidateId)
      ? pipelineCandidate.candidateId
      : "") ||
    pipelineCandidate.candidateMasterId ||
    pipelineCandidate.candidateId;

  const currentStage =
    pipelineCandidate.currentPipelineStage ||
    pipelineCandidate.currentStage ||
    pipelineCandidate.pipelineStage ||
    pipelineCandidate.status ||
    snapshot.currentPipelineStage ||
    snapshot.currentStage ||
    snapshot.status ||
    "Initial Screening";

  const pipelineStatus =
    pipelineCandidate.pipelineStatus ||
    pipelineCandidate.applicationStatus ||
    snapshot.pipelineStatus ||
    "Active";

  const finalRole =
    pipelineCandidate.currentAppliedRole ||
    snapshot.currentAppliedRole ||
    pipelineCandidate.roleTitle ||
    snapshot.roleTitle ||
    "Not assigned yet";

  const finalAccount =
    pipelineCandidate.currentAppliedAccount ||
    snapshot.currentAppliedAccount ||
    pipelineCandidate.account ||
    snapshot.account ||
    "Not assigned yet";

  const taOwner =
    pipelineCandidate.currentTaOwner ||
    pipelineCandidate.taOwner ||
    pipelineCandidate.owner ||
    snapshot.currentTaOwner ||
    snapshot.taOwner ||
    snapshot.owner ||
    "";

  const timeline = Array.isArray(pipelineCandidate.timeline)
    ? pipelineCandidate.timeline
    : [];

  const pipelineHistory = timeline.map((item) => ({
    stage:
      item.stage ||
      item.currentStage ||
      pipelineCandidate.currentStage ||
      currentStage,
    owner: item.owner || item.taOwner || taOwner,
    date: item.date || item.createdAt || item.timestamp || item.updatedAt,
    createdAt: item.createdAt || item.date || item.timestamp,
    description:
      item.description ||
      item.reason ||
      item.remarks ||
      pipelineCandidate.reasonForMovement ||
      "Candidate moved in Candidate Pipeline.",
    remarks: item.remarks || "",
    savedFormLink: item.savedFormLink || "",
  }));

  const profilePayload = mergeCandidateProfiles(snapshot, pipelineCandidate);

  return normalizeCandidateRecord({
    ...profilePayload,

    id:
      snapshot.id ||
      pipelineCandidate.candidateMasterId ||
      profilePayload.id ||
      pipelineCandidate.id,

    candidateId: preferredCandidateId,

    name:
      snapshot.name ||
      pipelineCandidate.name ||
      pipelineCandidate.candidateName ||
      profilePayload.name ||
      "",

    email:
      snapshot.email ||
      pipelineCandidate.email ||
      pipelineCandidate.candidateEmail ||
      profilePayload.email ||
      "",

    contactNumber:
      snapshot.contactNumber ||
      snapshot.phoneNumber1 ||
      pipelineCandidate.contactNumber ||
      pipelineCandidate.phoneNumber1 ||
      profilePayload.contactNumber ||
      "",

    phoneNumber1:
      snapshot.phoneNumber1 ||
      pipelineCandidate.phoneNumber1 ||
      pipelineCandidate.contactNumber ||
      profilePayload.phoneNumber1 ||
      "",

    openPosition:
      snapshot.openPosition ||
      profilePayload.openPosition ||
      pipelineCandidate.openPosition ||
      pipelineCandidate.roleCapability ||
      "",

    roleCapability:
      snapshot.roleCapability ||
      profilePayload.roleCapability ||
      pipelineCandidate.roleCapability ||
      pipelineCandidate.openPosition ||
      "",

    applyingLocation:
      snapshot.applyingLocation ||
      profilePayload.applyingLocation ||
      pipelineCandidate.applyingLocation ||
      "",

    physicalAddress:
      snapshot.physicalAddress ||
      profilePayload.physicalAddress ||
      pipelineCandidate.physicalAddress ||
      "",

    source:
      snapshot.source ||
      profilePayload.source ||
      pipelineCandidate.source ||
      formatList(snapshot.hearAboutUs) ||
      "Talent Pool",

    hearAboutUs:
      Array.isArray(snapshot.hearAboutUs) && snapshot.hearAboutUs.length > 0
        ? snapshot.hearAboutUs
        : profilePayload.hearAboutUs,

    status: currentStage,
    pipelineStatus,
    currentPipelineStage: currentStage,
    pipelineStage: currentStage,
    currentStage,

    currentAppliedRole: finalRole,
    currentAppliedAccount: finalAccount,
    currentTaOwner: taOwner,

    leadAccount:
      pipelineCandidate.leadAccount ||
      snapshot.leadAccount ||
      profilePayload.leadAccount ||
      pipelineCandidate.accountFit ||
      snapshot.accountFit ||
      "",

    accountFit:
      pipelineCandidate.accountFit ||
      snapshot.accountFit ||
      profilePayload.accountFit ||
      pipelineCandidate.leadAccount ||
      snapshot.leadAccount ||
      "",

    movedToPipeline: true,

    candidateApplicationId:
      pipelineCandidate.candidateApplicationId ||
      pipelineCandidate.applicationId ||
      snapshot.candidateApplicationId ||
      "",

    applicationHistory: dedupeHistoryByContent([
      ...(Array.isArray(snapshot.applicationHistory)
        ? snapshot.applicationHistory
        : []),
      ...(Array.isArray(profilePayload.applicationHistory)
        ? profilePayload.applicationHistory
        : []),
      ...pipelineHistory,
    ]),

    lastActivity:
      pipelineCandidate.lastActivity ||
      pipelineCandidate.updatedAt ||
      pipelineCandidate.dateMoved ||
      snapshot.lastActivity ||
      profilePayload.lastActivity ||
      "",

    isPublicSubmission:
      snapshot.isPublicSubmission || profilePayload.isPublicSubmission || false,
  });
}

export function useTalentPool() {
  const context = useContext(TalentPoolContext);

  if (!context) {
    throw new Error("useTalentPool must be used inside TalentPoolProvider");
  }

  return context;
}

export function TalentPoolProvider({ children }) {
  const { user } = useUser();
  const uploadInputRef = useRef(null);

  const currentTaOwner = getLoggedInUserName(user);

  const [candidateList, setCandidateList] = useState(
    initialCandidates.map(normalizeCandidateRecord),
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [positionFilter, setPositionFilter] = useState("All");
  const [activePositionOptions, setActivePositionOptions] = useState([]);

  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [candidateForm, setCandidateForm] = useState(emptyCandidateForm);

  const [editCandidate, setEditCandidate] = useState(null);
  const [editCandidateForm, setEditCandidateForm] =
    useState(emptyCandidateForm);

  const [statusTarget, setStatusTarget] = useState(null);
  const [statusForm, setStatusForm] = useState(emptyStatusForm);

  const [pipelineTarget, setPipelineTarget] = useState(null);
  const [moveToPipelineForm, setMoveToPipelineForm] = useState(
    emptyMoveToPipelineForm,
  );

  useEffect(() => {
    function syncTalentPoolSources() {
      const savedCandidates = readLocalStorage(INTERNAL_CANDIDATES_KEY, null);
      const publicSubmissions = readLocalStorage(PUBLIC_SUBMISSIONS_KEY, []);
      const pipelineCandidates = readLocalStorage(
        PIPELINE_CANDIDATES_STORAGE_KEY,
        [],
      );

      const baseCandidates =
        Array.isArray(savedCandidates) && savedCandidates.length > 0
          ? savedCandidates
          : initialCandidates;

      const normalizedPipelineCandidates = Array.isArray(pipelineCandidates)
        ? pipelineCandidates.map(normalizePipelineCandidateForTalentPool)
        : [];

      const normalizedCandidates = mergeCandidatesByCandidateId(
        baseCandidates,
        Array.isArray(publicSubmissions) ? publicSubmissions : [],
        normalizedPipelineCandidates,
      ).map(normalizeCandidateRecord);

      setCandidateList(normalizedCandidates);
      writeLocalStorage(INTERNAL_CANDIDATES_KEY, normalizedCandidates);
    }

    syncTalentPoolSources();

    function handleTalentPoolSourceSync(event) {
      if (
        !event ||
        event.key === PUBLIC_SUBMISSIONS_KEY ||
        event.key === PIPELINE_CANDIDATES_STORAGE_KEY ||
        event.key === CANDIDATE_APPLICATIONS_KEY
      ) {
        syncTalentPoolSources();
      }
    }

    window.addEventListener("storage", handleTalentPoolSourceSync);
    window.addEventListener("focus", syncTalentPoolSources);
    window.addEventListener(
      "ta-public-submissions-updated",
      syncTalentPoolSources,
    );
    window.addEventListener(
      "ta-pipeline-candidates-updated",
      syncTalentPoolSources,
    );

    return () => {
      window.removeEventListener("storage", handleTalentPoolSourceSync);
      window.removeEventListener("focus", syncTalentPoolSources);
      window.removeEventListener(
        "ta-public-submissions-updated",
        syncTalentPoolSources,
      );
      window.removeEventListener(
        "ta-pipeline-candidates-updated",
        syncTalentPoolSources,
      );
    };
  }, []);

  useEffect(() => {
    function syncAvailablePositions() {
      setActivePositionOptions(getActiveAvailablePositions());
    }

    syncAvailablePositions();

    function handleAvailablePositionsSync(event) {
      if (!event || event.key === AVAILABLE_POSITIONS_STORAGE_KEY) {
        syncAvailablePositions();
      }
    }

    window.addEventListener("storage", handleAvailablePositionsSync);
    window.addEventListener("focus", syncAvailablePositions);
    window.addEventListener(
      "ta-available-positions-updated",
      syncAvailablePositions,
    );

    return () => {
      window.removeEventListener("storage", handleAvailablePositionsSync);
      window.removeEventListener("focus", syncAvailablePositions);
      window.removeEventListener(
        "ta-available-positions-updated",
        syncAvailablePositions,
      );
    };
  }, []);

  useEffect(() => {
    writeLocalStorage(INTERNAL_CANDIDATES_KEY, candidateList);
  }, [candidateList]);

  const filteredCandidates = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return candidateList.map(normalizeCandidateRecord).filter((candidate) => {
      const roleValue =
        candidate.openPosition || candidate.roleCapability || "";
      const normalizedRoleValue = String(roleValue).trim().toLowerCase();
      const normalizedPositionFilter = String(positionFilter)
        .trim()
        .toLowerCase();

      const sourceValue = candidate.source || formatList(candidate.hearAboutUs);
      const referencesText = formatReferences(candidate.references);
      const workExperiencesText = getPrimaryExperienceSummary(candidate);
      const readinessText = getReadinessSummary(candidate);

      const searchableText = [
        candidate.candidateId,
        candidate.name,
        candidate.nickname,
        candidate.email,
        candidate.phoneNumber1,
        candidate.phoneNumber2,
        candidate.physicalAddress,
        roleValue,
        candidate.applyingLocation,
        sourceValue,
        candidate.referredBy,
        candidate.employeeId,
        candidate.workExperience,
        workExperiencesText,
        candidate.educationalAttainment,
        formatList(candidate.affiliations),
        candidate.trainingAttended,
        readinessText,
        referencesText,
        candidate.status,
        candidate.remarks,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);

      const matchesStatus =
        statusFilter === "All" || candidate.status === statusFilter;

      const matchesPosition =
        positionFilter === "All" ||
        normalizedRoleValue === normalizedPositionFilter;

      return matchesSearch && matchesStatus && matchesPosition;
    });
  }, [candidateList, search, statusFilter, positionFilter]);

  const stats = useMemo(() => {
    return {
      total: candidateList.length,
      silverPool: candidateList.filter(
        (candidate) => candidate.status === "Silver Pool",
      ).length,
      recyclable: candidateList.filter(
        (candidate) => candidate.status === "Recyclable",
      ).length,
      doNotReprocess: candidateList.filter(
        (candidate) => candidate.status === "Do Not Reprocess",
      ).length,
      hiredActive: candidateList.filter(
        (candidate) => candidate.status === "Hired / Active",
      ).length,
      publicSubmissions: candidateList.filter(
        (candidate) => candidate.isPublicSubmission,
      ).length,
    };
  }, [candidateList]);

  function closeAllTalentPoolModals() {
    setShowAddModal(false);
    setCandidateForm(emptyCandidateForm);

    setEditCandidate(null);
    setEditCandidateForm(emptyCandidateForm);

    setStatusTarget(null);
    setStatusForm(emptyStatusForm);

    setPipelineTarget(null);
    setMoveToPipelineForm({ ...emptyMoveToPipelineForm });
  }

  function openPublicForm() {
    window.open(
      "/recruitment/talent-pool/apply",
      "_blank",
      "noopener,noreferrer",
    );
  }

  function openAddCandidateModal() {
    setShowAddModal(true);
  }

  function closeAddCandidateModal() {
    setShowAddModal(false);
  }

  function resetCandidateForm() {
    setCandidateForm(emptyCandidateForm);
  }

  async function handleCandidateFileChange(
    event,
    fileKind,
    targetForm,
    setTargetForm,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const fileUrl = await readFileAsDataUrl(file);

      if (fileKind === "audio") {
        setTargetForm({
          ...targetForm,
          audioFileName: file.name,
          audioFileUrl: fileUrl,
          audioFileType: file.type || "audio/*",
        });
        return;
      }

      setTargetForm({
        ...targetForm,
        attachmentFileName: file.name,
        attachmentFileUrl: fileUrl,
        attachmentFileType: file.type || "application/octet-stream",
      });
    } catch (error) {
      console.error("FILE PREVIEW ERROR:", error);
      alert(
        "Unable to prepare file preview. Please try uploading the file again.",
      );
    }
  }

  function buildCandidatePayload(form, baseCandidate = null) {
    const age = calculateAge(form.dateOfBirth);

    if (age !== null && age < 18) {
      alert("Applicant is below 18 years old as of date of application.");
      return null;
    }

    if (!form.hearAboutUs.length) {
      alert("Please select how the applicant first heard about us.");
      return null;
    }

    if (!form.consent) {
      alert("Please confirm the terms and conditions consent.");
      return null;
    }

    const hasExperience = form.workExperience === workExperienceOptions[0];

    const cleanedExperiences = hasExperience
      ? form.workExperiences.map((item, index) => ({
          ...item,
          id: item.id || index + 1,
          industry: String(item.industry || "").trim(),
          lengthOfWorkExperience: item.lengthOfWorkExperience,
          years: String(item.years || "").trim(),
          role: String(item.role || "").trim(),
          company: String(item.company || "").trim(),
          monthlyCompensation: String(item.monthlyCompensation || "").trim(),
          reasonForLeaving: String(item.reasonForLeaving || "").trim(),
          hasOtherExperience: item.hasOtherExperience || "No",
        }))
      : [];

    const today = getTodayDate();
    const roleCapability = form.openPosition;

    const nextId =
      candidateList.length > 0
        ? Math.max(
            ...candidateList.map((candidate) => Number(candidate.id) || 0),
          ) + 1
        : 1;

    return normalizeCandidateRecord({
      ...(baseCandidate || {}),
      id: baseCandidate?.id || nextId,
      candidateId: baseCandidate?.candidateId || generateCandidateId(nextId),
      hearAboutUs: form.hearAboutUs,
      openPosition: form.openPosition,
      nickname: form.nickname.trim(),
      applyingLocation: form.applyingLocation,
      referredBy: form.referredBy.trim(),
      employeeId: form.employeeId.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      middleName: form.middleName.trim(),
      suffix: form.suffix.trim(),
      extension: form.suffix.trim(),
      name: buildFullName(form),
      dateOfBirth: form.dateOfBirth,
      ageAsOfApplication: age,
      email: form.email.trim(),
      physicalAddress: form.physicalAddress.trim(),
      workExperience: form.workExperience,
      phoneNumber1: form.phoneNumber1.trim(),
      phoneNumber2: form.phoneNumber2.trim(),
      contactNumber: form.phoneNumber1.trim(),
      workExperiences: cleanedExperiences,
      roleCapability,
      skillsLanguage: form.skillsLanguage.trim(),
      educationalAttainment: form.educationalAttainment,
      affiliations: form.affiliations,
      trainingAttended: form.trainingAttended.trim(),
      fullyVaccinated: form.fullyVaccinated,
      comfortableOnSite: form.comfortableOnSite,
      willingGraveyard: form.willingGraveyard,
      employmentInterest: form.employmentInterest,
      remoteWorkAccess: form.remoteWorkAccess,
      willingDrugTest: form.willingDrugTest,
      willingBackgroundCheck: form.willingBackgroundCheck,
      references: form.references.map((item) => ({
        name: item.name.trim(),
        phone: item.phone.trim(),
      })),
      audioFileName: form.audioFileName,
      audioFileUrl: form.audioFileUrl,
      audioFileType: form.audioFileType,
      attachmentFileName: form.attachmentFileName,
      attachmentFileUrl: form.attachmentFileUrl,
      attachmentFileType: form.attachmentFileType,
      consent: form.consent,
      status: form.status || baseCandidate?.status || "New Applicant",
      source: form.hearAboutUs.join(", "),
      availability: form.availability,
      accountFit: baseCandidate?.accountFit || "Not assigned yet",
      pipelineStatus: baseCandidate?.pipelineStatus || "",
      currentPipelineStage: baseCandidate?.currentPipelineStage || "",
      pipelineStage: baseCandidate?.pipelineStage || "",
      currentStage: baseCandidate?.currentStage || "",
      currentAppliedRole: baseCandidate?.currentAppliedRole || "",
      currentAppliedAccount: baseCandidate?.currentAppliedAccount || "",
      currentTaOwner: baseCandidate?.currentTaOwner || "",
      movedToPipeline: Boolean(baseCandidate?.movedToPipeline),
      lastActivity: today,
      tags: normalizeTags(roleCapability, form.skillsLanguage),
      isPublicSubmission: baseCandidate?.isPublicSubmission || false,
      applicationHistory: baseCandidate
        ? [
            ...(baseCandidate.applicationHistory || []),
            {
              role: roleCapability,
              account:
                baseCandidate.currentAppliedAccount || "Not assigned yet",
              outcome: "Candidate Details Updated",
              date: today,
            },
          ]
        : [
            {
              role: form.openPosition,
              account: "Not assigned yet",
              outcome: form.applicationOutcome || "Initial Entry",
              date: today,
            },
          ],
      remarks: form.remarks.trim(),
    });
  }

  function addCandidate(event) {
    event.preventDefault();

    const newCandidate = buildCandidatePayload(candidateForm);

    if (!newCandidate) return;

    setCandidateList((prev) =>
      mergeCandidatesByCandidateId([newCandidate], prev),
    );

    setSelectedCandidate(null);
    closeAllTalentPoolModals();
  }

  function openEditCandidate(candidate) {
    setEditCandidate(candidate);
    setEditCandidateForm(
      candidateToForm(candidate, emptyCandidateForm, emptyExperience),
    );
    setSelectedCandidate(null);
  }

  function closeEditCandidate() {
    setEditCandidate(null);
    setEditCandidateForm(emptyCandidateForm);
  }

  function resetEditCandidateForm() {
    if (!editCandidate) return;

    setEditCandidateForm(
      candidateToForm(editCandidate, emptyCandidateForm, emptyExperience),
    );
  }

  function submitEditCandidate(event) {
    event.preventDefault();

    if (!editCandidate) return;

    const updatedCandidate = buildCandidatePayload(
      editCandidateForm,
      editCandidate,
    );

    if (!updatedCandidate) return;

    setCandidateList((prev) =>
      mergeCandidatesByCandidateId(
        prev.map((candidate) =>
          candidate.id === editCandidate.id ||
          candidate.candidateId === editCandidate.candidateId ||
          candidate.email === editCandidate.email
            ? updatedCandidate
            : candidate,
        ),
      ),
    );

    setSelectedCandidate(null);
    closeAllTalentPoolModals();
  }

  function openStatus(candidate) {
    setStatusTarget(candidate);
    setStatusForm({
      status: candidate.status,
      remarks: "",
    });
  }

  function closeStatus() {
    setStatusTarget(null);
    setStatusForm(emptyStatusForm);
  }

  function submitStatus(event) {
    event.preventDefault();

    if (!statusTarget) return;

    const today = getTodayDate();

    const updatedRemarks = statusForm.remarks.trim()
      ? `${statusTarget.remarks || ""}\n\nStatus updated to ${
          statusForm.status
        } on ${today}: ${statusForm.remarks.trim()}`
      : statusTarget.remarks;

    const updatedCandidate = normalizeCandidateRecord({
      ...statusTarget,
      status: statusForm.status,
      lastActivity: today,
      remarks: updatedRemarks,
      applicationHistory: [
        ...(statusTarget.applicationHistory || []),
        {
          role: statusTarget.openPosition || statusTarget.roleCapability,
          account: statusTarget.currentAppliedAccount || "Not assigned yet",
          outcome: `Status Updated: ${statusForm.status}`,
          date: today,
        },
      ],
    });

    setCandidateList((prev) =>
      mergeCandidatesByCandidateId(
        prev.map((candidate) =>
          candidate.id === statusTarget.id ||
          candidate.candidateId === statusTarget.candidateId ||
          candidate.email === statusTarget.email
            ? updatedCandidate
            : candidate,
        ),
      ),
    );

    setSelectedCandidate(null);
    closeAllTalentPoolModals();
  }

  function openMoveToPipeline(candidate) {
    setPipelineTarget(candidate);
    setMoveToPipelineForm({
      ...emptyMoveToPipelineForm,
      roleTitle: "Not assigned yet",
      account: "Not assigned yet",
      leadAccount: candidate.leadAccount || candidate.accountFit || "",
      hiringRequirementId: "",
      jobDescriptionId: "",
      taOwner: currentTaOwner,
      initialStage: "Initial Screening",
    });
  }

  function closeMoveToPipeline() {
    setPipelineTarget(null);
    setMoveToPipelineForm(emptyMoveToPipelineForm);
  }

  function submitMoveToPipeline(event) {
    event?.preventDefault?.();

    if (!pipelineTarget) return;

    const savedInternalCandidates = readStorage(INTERNAL_CANDIDATES_KEY, []);
    const savedPublicSubmissions = readStorage(PUBLIC_SUBMISSIONS_KEY, []);
    const savedPipelineCandidates = readStorage(
      PIPELINE_CANDIDATES_STORAGE_KEY,
      [],
    );
    const savedApplications = readStorage(CANDIDATE_APPLICATIONS_KEY, []);

    const savedInternalMatch = findMatchingCandidateInList(
      savedInternalCandidates,
      pipelineTarget,
    );

    const savedPublicMatch = findMatchingCandidateInList(
      savedPublicSubmissions,
      pipelineTarget,
    );

    const currentListMatch = findMatchingCandidateInList(
      candidateList,
      pipelineTarget,
    );

    const sourceCandidate = mergeCandidateProfiles(
      mergeCandidateProfiles(
        mergeCandidateProfiles(pipelineTarget, savedInternalMatch || {}),
        savedPublicMatch || {},
      ),
      currentListMatch || {},
    );

    if (sourceCandidate.status === "Do Not Reprocess") {
      alert("This candidate is marked Do Not Reprocess.");
      return;
    }

    const now = new Date();
    const nowIso = now.toISOString();

    const displayDate = now.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const targetCandidateId =
      sourceCandidate.candidateId &&
      !isTemporaryPipelineId(sourceCandidate.candidateId)
        ? sourceCandidate.candidateId
        : sourceCandidate.candidateSnapshot?.candidateId ||
          `CAND-${String(sourceCandidate.id || Date.now()).padStart(3, "0")}`;

    const existingApplicationId =
      sourceCandidate.candidateApplicationId ||
      sourceCandidate.applicationId ||
      "";

    const pipelineApplicationId = existingApplicationId || `APP-${Date.now()}`;
    const initialStage = moveToPipelineForm.initialStage || "Initial Screening";
    const leadAccount = moveToPipelineForm.leadAccount || "";

    const ownerName = toDisplayPersonName(
      moveToPipelineForm.taOwner || currentTaOwner,
      "Current User",
    );

    const movementReason =
      moveToPipelineForm.remarks?.trim() ||
      "Candidate moved from Talent Pool without final assignment.";

    const historyEntry = {
      stage: initialStage,
      owner: ownerName,
      date: nowIso,
      createdAt: nowIso,
      description: movementReason,
    };

    const updatedTalentPoolCandidate = normalizeCandidateRecord(
      mergeCandidateProfiles(sourceCandidate, {
        candidateId: targetCandidateId,

        status: initialStage,
        pipelineStatus: "Active",
        currentPipelineStage: initialStage,
        pipelineStage: initialStage,
        currentStage: initialStage,

        currentAppliedRole: "Not assigned yet",
        currentAppliedAccount: "Not assigned yet",
        currentTaOwner: ownerName,

        leadAccount,
        accountFit: leadAccount || sourceCandidate.accountFit || "",

        movedToPipeline: true,
        candidateApplicationId: pipelineApplicationId,
        applicationId: pipelineApplicationId,
        lastActivity: nowIso,

        applicationHistory: dedupeHistoryByContent([
          ...(Array.isArray(sourceCandidate.applicationHistory)
            ? sourceCandidate.applicationHistory
            : []),
          historyEntry,
        ]),
      }),
    );

    const pipelineCandidate = {
      id: Date.now(),
      candidateApplicationId: pipelineApplicationId,
      applicationId: pipelineApplicationId,

      candidateMasterId: sourceCandidate.id,
      candidateId: targetCandidateId,

      name: sourceCandidate.name,
      candidateName: sourceCandidate.name,
      email: sourceCandidate.email,
      candidateEmail: sourceCandidate.email,

      contactNumber:
        sourceCandidate.phoneNumber1 ||
        sourceCandidate.contactNumber ||
        sourceCandidate.phoneNumber2 ||
        "",

      phoneNumber1:
        sourceCandidate.phoneNumber1 || sourceCandidate.contactNumber || "",

      openPosition:
        sourceCandidate.openPosition || sourceCandidate.roleCapability || "",

      roleCapability:
        sourceCandidate.roleCapability || sourceCandidate.openPosition || "",

      applyingLocation: sourceCandidate.applyingLocation || "",
      physicalAddress: sourceCandidate.physicalAddress || "",

      roleTitle: "Not assigned yet",
      account: "Not assigned yet",
      roleAccount: "Not assigned yet - Not assigned yet",

      leadAccount,
      accountFit: leadAccount || sourceCandidate.accountFit || "",

      source:
        sourceCandidate.source ||
        formatList(sourceCandidate.hearAboutUs) ||
        "Talent Pool",

      hearAboutUs: sourceCandidate.hearAboutUs || [],

      owner: ownerName,
      taOwner: ownerName,
      currentTaOwner: ownerName,

      currentStage: initialStage,
      currentPipelineStage: initialStage,
      pipelineStage: initialStage,
      previousStage: "Talent Pool",

      applicationStatus: "Active",
      pipelineStatus: "Active",

      prfStatus: "Review",
      prfReviewed: false,
      prfReviewedAt: null,

      interviewDate: null,
      interviewType: "-",
      interviewStatus: "For Assessment",

      assessmentStatus: "Not Take",
      assessmentResult: "",
      assessmentEmailSent: false,
      assessmentEmailSentAt: null,
      assessmentTakenAt: null,
      assessmentTaggedAt: null,
      assessmentRemarks: "",

      dateMoved: nowIso,
      updatedAt: nowIso,
      lastActivity: nowIso,

      reasonForMovement: movementReason,

      avatarColor: "bg-sibs-primary-1",

      dropOffReason: null,
      dropOffCategory: null,
      dropOffRemarks: null,

      candidateSnapshot: {
        ...sourceCandidate,
        ...updatedTalentPoolCandidate,
        candidateId: targetCandidateId,
        status: initialStage,
        pipelineStatus: "Active",
        currentPipelineStage: initialStage,
        pipelineStage: initialStage,
        currentStage: initialStage,
        currentAppliedRole: "Not assigned yet",
        currentAppliedAccount: "Not assigned yet",
        currentTaOwner: ownerName,
        leadAccount,
        accountFit: leadAccount || sourceCandidate.accountFit || "",
        movedToPipeline: true,
        candidateApplicationId: pipelineApplicationId,
        applicationId: pipelineApplicationId,
      },

      timeline: [
        {
          stage: initialStage,
          owner: ownerName,
          source: "Talent Pool",
          timestamp: displayDate,
          date: nowIso,
          createdAt: nowIso,
          reason: movementReason,
          description: movementReason,
          remarks: moveToPipelineForm.remarks || "",
        },
      ],
    };

    const updateMatchingCandidate = (candidate) => {
      const isMatch = Boolean(
        findMatchingCandidateInList([candidate], {
          ...sourceCandidate,
          candidateId: targetCandidateId,
        }),
      );

      if (!isMatch) return candidate;

      return mergeCandidateProfiles(candidate, updatedTalentPoolCandidate);
    };

    const updatedInternalCandidates = savedInternalCandidates.map(
      updateMatchingCandidate,
    );

    const updatedPublicSubmissions = savedPublicSubmissions.map(
      updateMatchingCandidate,
    );

    const internalHasCandidate = updatedInternalCandidates.some((candidate) =>
      Boolean(
        findMatchingCandidateInList([candidate], {
          ...sourceCandidate,
          candidateId: targetCandidateId,
        }),
      ),
    );

    const publicHasCandidate = updatedPublicSubmissions.some((candidate) =>
      Boolean(
        findMatchingCandidateInList([candidate], {
          ...sourceCandidate,
          candidateId: targetCandidateId,
        }),
      ),
    );

    const finalInternalCandidates =
      internalHasCandidate || publicHasCandidate
        ? updatedInternalCandidates
        : [...updatedInternalCandidates, updatedTalentPoolCandidate];

    const existingPipelineIndex = savedPipelineCandidates.findIndex(
      (candidate) =>
        Boolean(
          findMatchingCandidateInList([candidate], {
            ...sourceCandidate,
            candidateId: targetCandidateId,
          }),
        ),
    );

    const finalPipelineCandidates =
      existingPipelineIndex >= 0
        ? savedPipelineCandidates.map((candidate, index) => {
            if (index !== existingPipelineIndex) return candidate;

            return {
              ...candidate,
              ...pipelineCandidate,
              id: candidate.id,
              candidateApplicationId:
                candidate.candidateApplicationId ||
                pipelineCandidate.candidateApplicationId,
              applicationId:
                candidate.applicationId || pipelineCandidate.applicationId,
              candidateSnapshot: mergeCandidateProfiles(
                candidate.candidateSnapshot || {},
                pipelineCandidate.candidateSnapshot || {},
              ),
              timeline: dedupeHistoryByContent([
                ...(Array.isArray(candidate.timeline)
                  ? candidate.timeline
                  : []),
                ...pipelineCandidate.timeline,
              ]),
            };
          })
        : [...savedPipelineCandidates, pipelineCandidate];

    const finalApplications = [
      ...savedApplications.filter(
        (application) =>
          application.candidateId !== targetCandidateId &&
          application.candidateMasterId !== sourceCandidate.id,
      ),
      {
        id: pipelineApplicationId,
        candidateApplicationId: pipelineApplicationId,
        applicationId: pipelineApplicationId,
        candidateId: targetCandidateId,
        candidateMasterId: sourceCandidate.id,
        candidateName: sourceCandidate.name,
        currentStage: initialStage,
        currentPipelineStage: initialStage,
        pipelineStage: initialStage,
        pipelineStatus: "Active",
        applicationStatus: "Active",
        leadAccount,
        accountFit: leadAccount || sourceCandidate.accountFit || "",
        taOwner: ownerName,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ];

    const normalizedPipelineForTalentPool = finalPipelineCandidates.map(
      normalizePipelineCandidateForTalentPool,
    );

    const finalMergedInternalCandidates = mergeCandidatesByCandidateId(
      finalInternalCandidates,
      [updatedTalentPoolCandidate],
      normalizedPipelineForTalentPool,
    );

    writeStorage(INTERNAL_CANDIDATES_KEY, finalMergedInternalCandidates);
    writeStorage(PUBLIC_SUBMISSIONS_KEY, updatedPublicSubmissions);
    writeStorage(PIPELINE_CANDIDATES_STORAGE_KEY, finalPipelineCandidates);
    writeStorage(CANDIDATE_APPLICATIONS_KEY, finalApplications);

    setCandidateList(
      mergeCandidatesByCandidateId(
        candidateList,
        finalMergedInternalCandidates,
        updatedPublicSubmissions,
        normalizedPipelineForTalentPool,
        [updatedTalentPoolCandidate],
      ),
    );

    setSelectedCandidate(null);
    closeAllTalentPoolModals();

    window.dispatchEvent(new Event("ta-pipeline-candidates-updated"));
    window.dispatchEvent(new Event("ta-public-submissions-updated"));
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setPositionFilter("All");
  }

  function downloadLeadTemplate() {
    const csv = buildLeadUploadCsvTemplate();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "talent-pool-leads-template.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function uploadLeadsFile(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const isCsv =
      file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv");

    if (!isCsv) {
      alert("Please upload a CSV file only.");

      if (uploadInputRef.current) {
        uploadInputRef.current.value = "";
      }

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const rows = parseLeadUploadCsvText(String(reader.result || ""));

        if (!rows.length) {
          alert("The uploaded CSV has no rows to import.");
          return;
        }

        const nextId =
          candidateList.length > 0
            ? Math.max(
                ...candidateList.map((candidate) => Number(candidate.id) || 0),
              ) + 1
            : 1;

        const importedCandidates = rows
          .map((row, index) => parseUploadedLeadRow(row, nextId, index))
          .filter((candidate) => candidate.name && candidate.email);

        if (!importedCandidates.length) {
          alert(
            "No valid leads were imported. Please make sure firstName, lastName/name, and email are provided.",
          );
          return;
        }

        setCandidateList((prev) =>
          mergeCandidatesByCandidateId(importedCandidates, prev),
        );

        closeAllTalentPoolModals();

        alert(`${importedCandidates.length} lead(s) imported successfully.`);
      } catch (error) {
        console.error("LEAD CSV UPLOAD ERROR:", error);
        alert(
          "Unable to import the CSV file. Please use the provided CSV template.",
        );
      } finally {
        if (uploadInputRef.current) {
          uploadInputRef.current.value = "";
        }
      }
    };

    reader.onerror = () => {
      alert("Unable to read the CSV file.");

      if (uploadInputRef.current) {
        uploadInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  }

  const value = {
    user,
    currentTaOwner,
    uploadInputRef,

    candidateList,
    setCandidateList,
    filteredCandidates,
    stats,

    search,
    setSearch,
    statusFilter,
    setStatusFilter,

    positionFilter,
    setPositionFilter,
    activePositionOptions,

    selectedCandidate,
    setSelectedCandidate,

    showAddModal,
    setShowAddModal,
    candidateForm,
    setCandidateForm,

    editCandidate,
    editCandidateForm,
    setEditCandidateForm,

    statusTarget,
    statusForm,
    setStatusForm,

    pipelineTarget,
    moveToPipelineForm,
    setMoveToPipelineForm,

    openPublicForm,
    openAddCandidateModal,
    closeAddCandidateModal,
    resetCandidateForm,
    addCandidate,
    handleCandidateFileChange,

    openEditCandidate,
    closeEditCandidate,
    resetEditCandidateForm,
    submitEditCandidate,

    openStatus,
    closeStatus,
    submitStatus,

    openMoveToPipeline,
    closeMoveToPipeline,
    submitMoveToPipeline,

    clearFilters,
    downloadLeadTemplate,
    uploadLeadsFile,
  };

  return (
    <TalentPoolContext.Provider value={value}>
      {children}
    </TalentPoolContext.Provider>
  );
}
