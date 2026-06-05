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
  dispatchTalentPoolSync,
  getActiveAvailablePositions,
} from "../../lib/utils/talentPool/talentPoolStorage";

import {
  buildFullName,
  buildLeadUploadCsvTemplate,
  calculateAge,
  candidateToForm,
  formatList,
  formatReferences,
  generateApplicationId,
  generateCandidateId,
  getLoggedInUserName,
  getPrimaryExperienceSummary,
  getReadinessSummary,
  getTodayDate,
  normalizeCandidateRecord,
  normalizeTags,
  mergeCandidateLists,
  mergePipelineCandidatesIntoTalentPool,
  parseLeadUploadCsvText,
  parseUploadedLeadRow,
  readFileAsDataUrl,
  toDisplayPersonName,
} from "../../lib/utils/talentPool/talentPoolHelpers";

const TalentPoolContext = createContext(null);

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

      const mergedPublicCandidates = mergeCandidateLists(
        baseCandidates,
        publicSubmissions,
      );

      const mergedWithPipeline = mergePipelineCandidatesIntoTalentPool(
        mergedPublicCandidates,
        Array.isArray(pipelineCandidates) ? pipelineCandidates : [],
      );

      const normalizedCandidates = mergedWithPipeline.map(
        normalizeCandidateRecord,
      );

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

    setCandidateList((prev) => [newCandidate, ...prev]);
    setSelectedCandidate(newCandidate);
    setCandidateForm(emptyCandidateForm);
    setShowAddModal(false);
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
      prev.map((candidate) =>
        candidate.id === editCandidate.id ? updatedCandidate : candidate,
      ),
    );

    setSelectedCandidate(updatedCandidate);
    closeEditCandidate();
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
      prev.map((candidate) =>
        candidate.id === statusTarget.id ? updatedCandidate : candidate,
      ),
    );

    setSelectedCandidate(updatedCandidate);
    closeStatus();
  }

  function openMoveToPipeline(candidate) {
    setPipelineTarget(candidate);
    setMoveToPipelineForm({
      ...emptyMoveToPipelineForm,
      roleTitle: "Not assigned yet",
      account: "Not assigned yet",
      hiringRequirementId: "",
      jobDescriptionId: "",
      taOwner: currentTaOwner,
    });
  }

  function closeMoveToPipeline() {
    setPipelineTarget(null);
    setMoveToPipelineForm(emptyMoveToPipelineForm);
  }

  function submitMoveToPipeline(event) {
    event.preventDefault();

    if (!pipelineTarget) return;

    if (pipelineTarget.status === "Do Not Reprocess") {
      alert("This candidate is marked Do Not Reprocess.");
      return;
    }

    const today = getTodayDate();

    const existingApplications = readLocalStorage(
      CANDIDATE_APPLICATIONS_KEY,
      [],
    );

    const existingPipelineCandidates = readLocalStorage(
      PIPELINE_CANDIDATES_STORAGE_KEY,
      [],
    );

    const duplicateActiveApplication = existingApplications.some(
      (application) =>
        application.candidateId === pipelineTarget.candidateId &&
        application.applicationStatus === "Active" &&
        application.currentStage !== "Accepted" &&
        application.currentStage !== "For NHO" &&
        application.currentStage !== "Drop-off",
    );

    if (duplicateActiveApplication) {
      alert("This candidate already has an active pipeline application.");
      return;
    }

    const owner = toDisplayPersonName(
      currentTaOwner || moveToPipelineForm.taOwner,
      "Current User",
    );

    const initialStage = "Initial Screening";

    const movementReason =
      moveToPipelineForm.remarks.trim() ||
      "Moved from Talent Pool to Candidate Pipeline. Hiring requirement, final role, and final account are not assigned yet.";

    const generatedApplicationId = generateApplicationId();

    const newApplication = {
      id: Date.now(),
      applicationId: generatedApplicationId,
      candidateApplicationId: generatedApplicationId,

      candidateId: pipelineTarget.candidateId,
      candidateMasterId: pipelineTarget.id,
      candidateName: pipelineTarget.name,
      name: pipelineTarget.name,
      email: pipelineTarget.email,
      candidateEmail: pipelineTarget.email,
      contactNumber:
        pipelineTarget.phoneNumber1 || pipelineTarget.contactNumber,

      hiringRequirementId: "",
      jobDescriptionId: "",
      jobDescription: "",
      roleTitle: "Not assigned yet",
      account: "Not assigned yet",
      roleAccount: "Not assigned yet - Not assigned yet",

      taOwner: owner,
      owner,

      currentStage: initialStage,
      stage: initialStage,
      pipelineStage: initialStage,
      previousStage: "Talent Pool",
      applicationStatus: "Active",

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

      offerDetails: null,
      offerApprovalStatus: "For Review",
      offerDecision: "",

      dateMoved: today,
      reasonForMovement: movementReason,
      source: pipelineTarget.source,
      fromTalentPool: true,
      remarks: moveToPipelineForm.remarks.trim(),
      createdAt: today,
      updatedAt: today,

      stageHistory: [
        {
          fromStage: "Talent Pool",
          toStage: initialStage,
          owner,
          reason: movementReason,
          timestamp: new Date().toISOString(),
        },
      ],

      timeline: [
        {
          stage: initialStage,
          owner,
          source: "Talent Pool",
          reason: movementReason,
          timestamp: new Date().toLocaleString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
        },
      ],

      candidateSnapshot: pipelineTarget,
    };

    writeLocalStorage(CANDIDATE_APPLICATIONS_KEY, [
      newApplication,
      ...existingApplications,
    ]);

    writeLocalStorage(PIPELINE_CANDIDATES_STORAGE_KEY, [
      newApplication,
      ...existingPipelineCandidates,
    ]);

    const updatedCandidate = normalizeCandidateRecord({
      ...pipelineTarget,
      status: pipelineTarget.status,
      pipelineStatus: "Active",
      currentApplicationId: newApplication.applicationId,
      currentCandidateApplicationId: newApplication.candidateApplicationId,
      currentHiringRequirementId: "",
      currentPipelineStage: initialStage,
      currentApplicationStatus: "Active",
      currentAppliedRole: "Not assigned yet",
      currentAppliedAccount: "Not assigned yet",
      currentTaOwner: owner,
      currentPrfStatus: "Review",
      currentAssessmentStatus: "Not Take",
      currentAssessmentResult: "",
      currentInterviewStatus: "For Assessment",
      currentOfferStatus: "For Review",
      currentOfferDecision: "",
      lastPipelineUpdate: today,
      lastActivity: today,
      applicationHistory: [
        ...(pipelineTarget.applicationHistory || []),
        {
          role: "Not assigned yet",
          account: "Not assigned yet",
          outcome: `Moved to Pipeline - ${initialStage}`,
          date: today,
        },
      ],
      remarks: moveToPipelineForm.remarks.trim()
        ? `${pipelineTarget.remarks || ""}\n\nMoved to Pipeline (${today}): ${moveToPipelineForm.remarks.trim()}`
        : pipelineTarget.remarks,
    });

    setCandidateList((prev) =>
      prev.map((candidate) =>
        candidate.id === pipelineTarget.id ? updatedCandidate : candidate,
      ),
    );

    setSelectedCandidate(updatedCandidate);
    closeMoveToPipeline();
    dispatchTalentPoolSync();

    alert(
      "Candidate moved to Candidate Pipeline without hiring requirement, final role, or final account assignment.",
    );
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

        setCandidateList((prev) => [...importedCandidates, ...prev]);
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
