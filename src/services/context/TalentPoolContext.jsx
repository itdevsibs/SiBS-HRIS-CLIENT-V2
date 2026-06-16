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
  createTalentPoolCandidate,
  getTalentPoolApplications,
  getTalentPoolFileUrl,
  getTalentPoolFormOptions,
  getTalentPoolOpenPositions,
  importTalentPoolCsvLeads,
  moveTalentPoolCandidateToPipeline,
  updateTalentPoolApplicationStatus,
  updateTalentPoolCandidate,
} from "../../lib/axios/getTalentPool";

const TalentPoolContext = createContext(null);

const emptyExperience = {
  id: 1,
  industry: "",
  industryRelevantExperience: "",
  lengthOfWorkExperience: "",
  years: "",
  role: "",
  company: "",
  monthlyCompensation: "",
  reasonForLeaving: "",
  hasOtherExperience: "No",
};

const emptyCandidateForm = {
  hearAboutUs: [],
  openPosition: "",
  nickname: "",
  applyingLocation: "",
  referredBy: "",
  employeeId: "",

  firstName: "",
  lastName: "",
  middleName: "",
  suffix: "",
  dateOfBirth: "",
  email: "",
  physicalAddress: "",
  workExperience: "",
  phoneNumber1: "",
  phoneNumber2: "",

  workExperiences: [{ ...emptyExperience }],

  educationalAttainment: "",
  affiliations: [],
  trainingAttended: "",

  fullyVaccinated: "",
  comfortableOnSite: "",
  willingGraveyard: "",
  employmentInterest: "",
  remoteWorkAccess: "",
  willingDrugTest: "",
  willingBackgroundCheck: "",

  references: [
    { name: "", phone: "" },
    { name: "", phone: "" },
    { name: "", phone: "" },
  ],

  audioFile: null,
  audioFileName: "",
  audioFileUrl: "",
  audioFileType: "",

  attachmentFile: null,
  attachmentFileName: "",
  attachmentFileUrl: "",
  attachmentFileType: "",

  skillsLanguage: "",
  status: "New Applicant",
  availability: "Available",
  remarks: "",
  consent: false,
};

const emptyStatusForm = {
  status: "",
  remarks: "",
};

const emptyMoveToPipelineForm = {
  leadAccount: "",
  remarks: "",
  taOwner: "",
  initialStage: "Initial Screening",
};

const defaultFormOptions = {
  hearAboutUs: [],
  locations: [],
  workExperience: [],
  lengthOfExperience: [],
  educationalAttainment: [],
  affiliationCertification: [],
  yesNo: [],
  employmentInterest: [],
  audioQuestions: [],
  statuses: [],
};

function getOptionValue(option) {
  if (typeof option === "string") return option;
  return option?.value || option?.option_value || "";
}

function getOptionLabel(option) {
  if (typeof option === "string") return option;
  return option?.label || option?.option_label || option?.value || "";
}

function optionValues(options = []) {
  return options.map(getOptionValue).filter(Boolean);
}

function normalizeOptionsPayload(payload) {
  const data = payload && typeof payload === "object" ? payload : {};

  return {
    hearAboutUs: Array.isArray(data.hearAboutUs) ? data.hearAboutUs : [],
    locations: Array.isArray(data.locations) ? data.locations : [],
    workExperience: Array.isArray(data.workExperience)
      ? data.workExperience
      : [],
    lengthOfExperience: Array.isArray(data.lengthOfExperience)
      ? data.lengthOfExperience
      : [],
    educationalAttainment: Array.isArray(data.educationalAttainment)
      ? data.educationalAttainment
      : [],
    affiliationCertification: Array.isArray(data.affiliationCertification)
      ? data.affiliationCertification
      : [],
    yesNo: Array.isArray(data.yesNo) ? data.yesNo : [],
    employmentInterest: Array.isArray(data.employmentInterest)
      ? data.employmentInterest
      : [],
    audioQuestions: Array.isArray(data.audioQuestions)
      ? data.audioQuestions
      : [],
    statuses: Array.isArray(data.statuses) ? data.statuses : [],
  };
}

function normalizePosition(position = {}) {
  return {
    id: position.id || position.positionId || position.position_id,
    positionId: position.positionId || position.position_id || "",
    positionTitle:
      position.positionTitle ||
      position.position_title ||
      position.title ||
      position.name ||
      "",
    department: position.department || "",
    locationSite: position.locationSite || position.location_site || "",
    account: position.account || position.accountName || "",
    status: position.status || "",
  };
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function formatList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }

  return String(value || "").trim();
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) return null;

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

function buildFullName(form = {}) {
  return [form.firstName, form.middleName, form.lastName, form.suffix]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
}

function getLoggedInUserName(user) {
  return (
    user?.fullName ||
    user?.full_name ||
    user?.name ||
    user?.employeeName ||
    user?.username ||
    "Current User"
  );
}

function isRelevantWorkExperience(value) {
  return String(value || "")
    .toLowerCase()
    .includes("has work experience");
}

function normalizeExperience(experience = {}, index = 0) {
  return {
    id: experience.id || index + 1,
    industry:
      experience.industry || experience.industryRelevantExperience || "",
    industryRelevantExperience:
      experience.industryRelevantExperience || experience.industry || "",
    lengthOfWorkExperience: experience.lengthOfWorkExperience || "",
    years: experience.years || "",
    role: experience.role || "",
    company: experience.company || "",
    monthlyCompensation: experience.monthlyCompensation || "",
    reasonForLeaving: experience.reasonForLeaving || "",
    hasOtherExperience: experience.hasOtherExperience || "No",
  };
}

function normalizeCandidateRecord(candidate = {}) {
  const workExperiences = normalizeArray(candidate.workExperiences).map(
    normalizeExperience,
  );

  const affiliations =
    candidate.affiliations ||
    candidate.affiliationsAndCertifications ||
    candidate.affiliations_certifications ||
    [];

  const references = normalizeArray(candidate.references).length
    ? normalizeArray(candidate.references)
    : [
        {
          name: candidate.reference1Name,
          phone: candidate.reference1Phone,
        },
        {
          name: candidate.reference2Name,
          phone: candidate.reference2Phone,
        },
        {
          name: candidate.reference3Name,
          phone: candidate.reference3Phone,
        },
      ];

  const phoneNumber1 =
    candidate.phoneNumber1 ||
    candidate.phone1 ||
    candidate.contactNumber ||
    candidate.contact_number ||
    "";

  const phoneNumber2 = candidate.phoneNumber2 || candidate.phone2 || "";

  const name =
    candidate.name ||
    candidate.fullName ||
    candidate.full_name ||
    buildFullName(candidate);

  const id = candidate.id || candidate.applicationId || candidate.rawId;

  return {
    ...candidate,
    id,
    candidateId: candidate.candidateId || candidate.candidate_id || "",
    name,
    firstName: candidate.firstName || candidate.first_name || "",
    lastName: candidate.lastName || candidate.last_name || "",
    middleName: candidate.middleName || candidate.middle_name || "",
    suffix: candidate.suffix || "",
    nickname: candidate.nickname || "",
    email: candidate.email || "",
    dateOfBirth: candidate.dateOfBirth || candidate.date_of_birth || "",
    ageAsOfApplication:
      candidate.ageAsOfApplication ||
      candidate.age_as_of_application ||
      calculateAge(candidate.dateOfBirth || candidate.date_of_birth),
    physicalAddress:
      candidate.physicalAddress || candidate.physical_address || "",
    phoneNumber1,
    phoneNumber2,
    contactNumber: candidate.contactNumber || phoneNumber1,
    openPosition:
      candidate.openPosition ||
      candidate.open_position ||
      candidate.roleCapability ||
      "",
    roleCapability:
      candidate.roleCapability ||
      candidate.role_capability ||
      candidate.openPosition ||
      "",
    applyingLocation:
      candidate.applyingLocation || candidate.applying_location || "",
    hearAboutUs: normalizeArray(candidate.hearAboutUs),
    source: candidate.source || formatList(candidate.hearAboutUs),
    referredBy: candidate.referredBy || candidate.referred_by || "",
    employeeId: candidate.employeeId || candidate.referrer_employee_id || "",
    workExperience:
      candidate.workExperience || candidate.work_experience || "",
    workExperiences,
    educationalAttainment:
      candidate.educationalAttainment ||
      candidate.highestEducationalAttainment ||
      candidate.highest_educational_attainment ||
      "",
    affiliations: normalizeArray(affiliations),
    trainingAttended:
      candidate.trainingAttended || candidate.training_attended || "",
    fullyVaccinated:
      candidate.fullyVaccinated || candidate.fully_vaccinated || "",
    comfortableOnSite:
      candidate.comfortableOnSite || candidate.comfortable_on_site || "",
    willingGraveyard:
      candidate.willingGraveyard || candidate.willing_graveyard || "",
    employmentInterest:
      candidate.employmentInterest || candidate.employment_interest || "",
    remoteWorkAccess:
      candidate.remoteWorkAccess || candidate.remote_work_access || "",
    willingDrugTest:
      candidate.willingDrugTest || candidate.willing_drug_test || "",
    willingBackgroundCheck:
      candidate.willingBackgroundCheck ||
      candidate.willing_background_check ||
      "",
    references,
    audioFileName: candidate.audioFileName || candidate.audio_file_name || "",
    audioFileUrl:
      candidate.audioFileUrl ||
      candidate.audio_file_url ||
      (candidate.audioFileName || candidate.audio_file_name
        ? getTalentPoolFileUrl(id, "audio")
        : ""),
    audioFileType: candidate.audioFileType || candidate.audio_file_type || "",
    attachmentFileName:
      candidate.attachmentFileName || candidate.attachment_file_name || "",
    attachmentFileUrl:
      candidate.attachmentFileUrl ||
      candidate.attachment_file_url ||
      (candidate.attachmentFileName || candidate.attachment_file_name
        ? getTalentPoolFileUrl(id, "attachment")
        : ""),
    attachmentFileType:
      candidate.attachmentFileType || candidate.attachment_file_type || "",
    skillsLanguage: candidate.skillsLanguage || candidate.skills_language || "",
    status: candidate.status || "New Applicant",
    availability: candidate.availability || "Available",
    accountFit: candidate.accountFit || candidate.account_fit || "",
    currentAppliedAccount:
      candidate.currentAppliedAccount || candidate.current_applied_account || "",
    currentAppliedRole:
      candidate.currentAppliedRole || candidate.current_applied_role || "",
    currentTaOwner:
      candidate.currentTaOwner || candidate.current_ta_owner || "",
    currentPipelineStage:
      candidate.currentPipelineStage || candidate.current_pipeline_stage || "",
    pipelineStage: candidate.pipelineStage || candidate.pipeline_stage || "",
    currentStage: candidate.currentStage || candidate.current_stage || "",
    pipelineStatus: candidate.pipelineStatus || candidate.pipeline_status || "",
    movedToPipeline: Boolean(
      candidate.movedToPipeline || candidate.moved_to_pipeline,
    ),
    isPublicSubmission: Boolean(
      candidate.isPublicSubmission || candidate.is_public_submission,
    ),
    applicationHistory: normalizeArray(candidate.applicationHistory),
    createdAt: candidate.createdAt || candidate.created_at || "",
    lastActivity:
      candidate.lastActivity ||
      candidate.last_activity ||
      candidate.updatedAt ||
      candidate.updated_at ||
      candidate.createdAt ||
      candidate.created_at ||
      "",
    remarks: candidate.remarks || "",
  };
}

function candidateToForm(candidate = {}) {
  const normalized = normalizeCandidateRecord(candidate);

  return {
    ...emptyCandidateForm,
    ...normalized,
    phoneNumber1: normalized.phoneNumber1 || normalized.contactNumber || "",
    phoneNumber2: normalized.phoneNumber2 || "",
    workExperiences: normalized.workExperiences.length
      ? normalized.workExperiences
      : [{ ...emptyExperience }],
    educationalAttainment: normalized.educationalAttainment || "",
    affiliations: normalized.affiliations || [],
    references:
      normalized.references && normalized.references.length
        ? normalized.references
        : [
            { name: "", phone: "" },
            { name: "", phone: "" },
            { name: "", phone: "" },
          ],
    consent: true,
    audioFile: null,
    attachmentFile: null,
  };
}

function createCsvRow(values = []) {
  return values
    .map((value) => {
      const text = String(value ?? "");
      const escaped = text.replace(/"/g, '""');

      if (/[",\n\r]/.test(escaped)) {
        return `"${escaped}"`;
      }

      return escaped;
    })
    .join(",");
}

function getFirstOptionValue(options = []) {
  return getOptionValue(options[0]) || "";
}

function getUniqueAccountOptions(positions = [], candidates = []) {
  const set = new Set();

  positions.forEach((position) => {
    [
      position.account,
      position.accountName,
      position.department,
      position.locationSite,
    ].forEach((value) => {
      const text = String(value || "").trim();

      if (text) set.add(text);
    });
  });

  candidates.forEach((candidate) => {
    [
      candidate.accountFit,
      candidate.leadAccount,
      candidate.currentAppliedAccount,
      candidate.department,
    ].forEach((value) => {
      const text = String(value || "").trim();

      if (
        text &&
        text !== "—" &&
        text.toLowerCase() !== "not assigned yet" &&
        text.toLowerCase() !== "n/a"
      ) {
        set.add(text);
      }
    });
  });

  return Array.from(set).sort((a, b) => a.localeCompare(b));
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

  const [candidateList, setCandidateList] = useState([]);
  const [activePositionOptions, setActivePositionOptions] = useState([]);
  const [formOptions, setFormOptions] = useState(defaultFormOptions);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [positionFilter, setPositionFilter] = useState("All");

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

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  async function refreshTalentPool() {
    setIsLoading(true);
    setLoadError("");

    try {
      const [optionsResponse, positionsResponse, applicationsResponse] =
        await Promise.all([
          getTalentPoolFormOptions(),
          getTalentPoolOpenPositions(),
          getTalentPoolApplications({
            page: 1,
            limit: 500,
            search: "",
            status: "All",
          }),
        ]);

      if (!optionsResponse?.success) {
        throw new Error(
          optionsResponse?.message || "Failed to load talent pool options.",
        );
      }

      if (!positionsResponse?.success) {
        throw new Error(
          positionsResponse?.message || "Failed to load open positions.",
        );
      }

      if (!applicationsResponse?.success) {
        throw new Error(
          applicationsResponse?.message || "Failed to load talent pool candidates.",
        );
      }

      setFormOptions(normalizeOptionsPayload(optionsResponse.data));

      setActivePositionOptions(
        normalizeArray(positionsResponse.data)
          .map(normalizePosition)
          .filter((position) => position.positionTitle),
      );

      setCandidateList(
        normalizeArray(applicationsResponse.data).map(normalizeCandidateRecord),
      );
    } catch (error) {
      console.error("Refresh Talent Pool error:", error);
      setLoadError(error?.message || "Failed to load Talent Pool data.");
      setCandidateList([]);
      setActivePositionOptions([]);
      setFormOptions(defaultFormOptions);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshTalentPool();
  }, []);

  const statusOptions = useMemo(() => {
    const dbStatuses = optionValues(formOptions.statuses);
    const candidateStatuses = candidateList
      .map((candidate) => candidate.status)
      .filter(Boolean);

    return ["All", ...new Set([...dbStatuses, ...candidateStatuses])];
  }, [formOptions.statuses, candidateList]);

  const accountOptions = useMemo(() => {
    return getUniqueAccountOptions(activePositionOptions, candidateList);
  }, [activePositionOptions, candidateList]);

  const filteredCandidates = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return candidateList.filter((candidate) => {
      const roleValue =
        candidate.openPosition || candidate.roleCapability || "";
      const normalizedRoleValue = String(roleValue).trim().toLowerCase();
      const normalizedPositionFilter = String(positionFilter)
        .trim()
        .toLowerCase();

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
        candidate.source,
        formatList(candidate.hearAboutUs),
        candidate.referredBy,
        candidate.employeeId,
        candidate.workExperience,
        candidate.educationalAttainment,
        formatList(candidate.affiliations),
        candidate.trainingAttended,
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
    setMoveToPipelineForm(emptyMoveToPipelineForm);
  }

  function openPublicForm() {
    window.open(
      "/recruitment/talent-pool/apply",
      "_blank",
      "noopener,noreferrer",
    );
  }

  function openAddCandidateModal() {
    setCandidateForm(emptyCandidateForm);
    setShowAddModal(true);
  }

  function closeAddCandidateModal() {
    setShowAddModal(false);
  }

  function resetCandidateForm() {
    setCandidateForm(emptyCandidateForm);
  }

  function resetEditCandidateForm() {
    if (!editCandidate) return;
    setEditCandidateForm(candidateToForm(editCandidate));
  }

  function handleCandidateFileChange(
    event,
    fileKind,
    targetForm,
    setTargetForm,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (fileKind === "audio") {
      setTargetForm({
        ...targetForm,
        audioFile: file,
        audioFileName: file.name,
        audioFileType: file.type || "audio/*",
      });
      return;
    }

    setTargetForm({
      ...targetForm,
      attachmentFile: file,
      attachmentFileName: file.name,
      attachmentFileType: file.type || "application/octet-stream",
    });
  }

  function validateCandidateForm(form) {
    const age = calculateAge(form.dateOfBirth);

    if (age !== null && age < 18) {
      alert("Applicant is below 18 years old as of date of application.");
      return false;
    }

    if (!form.hearAboutUs?.length) {
      alert("Please select how the applicant first heard about us.");
      return false;
    }

    if (!form.openPosition) {
      alert("Please select an open position.");
      return false;
    }

    if (!form.applyingLocation) {
      alert("Please select an applying location.");
      return false;
    }

    if (!form.firstName || !form.lastName || !form.email) {
      alert("First name, last name, and email are required.");
      return false;
    }

    if (!form.consent) {
      alert("Please confirm the terms and conditions consent.");
      return false;
    }

    return true;
  }

  async function addCandidate(event) {
    event.preventDefault();

    if (!validateCandidateForm(candidateForm)) return;

    setIsSaving(true);

    try {
      const response = await createTalentPoolCandidate(candidateForm);

      if (!response?.success) {
        alert(response?.message || "Failed to save candidate.");
        return;
      }

      await refreshTalentPool();
      setSelectedCandidate(null);
      closeAllTalentPoolModals();
    } finally {
      setIsSaving(false);
    }
  }

  function openEditCandidate(candidate) {
    setEditCandidate(candidate);
    setEditCandidateForm(candidateToForm(candidate));
    setSelectedCandidate(null);
  }

  function closeEditCandidate() {
    setEditCandidate(null);
    setEditCandidateForm(emptyCandidateForm);
  }

  async function submitEditCandidate(event) {
    event.preventDefault();

    if (!editCandidate) return;
    if (!validateCandidateForm(editCandidateForm)) return;

    setIsSaving(true);

    try {
      const response = await updateTalentPoolCandidate(
        editCandidate.id,
        editCandidateForm,
      );

      if (!response?.success) {
        alert(response?.message || "Failed to update candidate.");
        return;
      }

      await refreshTalentPool();
      setSelectedCandidate(null);
      closeAllTalentPoolModals();
    } finally {
      setIsSaving(false);
    }
  }

  function openStatus(candidate) {
    setStatusTarget(candidate);
    setStatusForm({
      status: candidate.status || "",
      remarks: "",
    });
  }

  function closeStatus() {
    setStatusTarget(null);
    setStatusForm(emptyStatusForm);
  }

  async function submitStatus(event) {
    event.preventDefault();

    if (!statusTarget) return;

    setIsSaving(true);

    try {
      const response = await updateTalentPoolApplicationStatus(
        statusTarget.id,
        statusForm,
      );

      if (!response?.success) {
        alert(response?.message || "Failed to update status.");
        return;
      }

      await refreshTalentPool();
      setSelectedCandidate(null);
      closeAllTalentPoolModals();
    } finally {
      setIsSaving(false);
    }
  }

  function openMoveToPipeline(candidate) {
    setPipelineTarget(candidate);
    setMoveToPipelineForm({
      ...emptyMoveToPipelineForm,
      leadAccount: candidate.leadAccount || candidate.accountFit || "",
      taOwner: currentTaOwner,
    });
  }

  function closeMoveToPipeline() {
    setPipelineTarget(null);
    setMoveToPipelineForm(emptyMoveToPipelineForm);
  }

  async function submitMoveToPipeline(event) {
    event?.preventDefault?.();

    if (!pipelineTarget) return;

    if (pipelineTarget.status === "Do Not Reprocess") {
      alert("This candidate is marked Do Not Reprocess.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await moveTalentPoolCandidateToPipeline(
        pipelineTarget.id,
        {
          ...moveToPipelineForm,
          taOwner: moveToPipelineForm.taOwner || currentTaOwner,
          initialStage:
            moveToPipelineForm.initialStage || "Initial Screening",
        },
      );

      if (!response?.success) {
        alert(response?.message || "Failed to move candidate to pipeline.");
        return;
      }

      await refreshTalentPool();
      setSelectedCandidate(null);
      closeAllTalentPoolModals();
    } finally {
      setIsSaving(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setPositionFilter("All");
  }

  function downloadLeadTemplate() {
    const headers = [
      "candidateId",
      "firstName",
      "middleName",
      "lastName",
      "suffix",
      "nickname",
      "email",
      "phoneNumber1",
      "phoneNumber2",
      "dateOfBirth",
      "physicalAddress",
      "openPosition",
      "applyingLocation",
      "hearAboutUs",
      "referredBy",
      "employeeId",
      "workExperience",
      "educationalAttainment",
      "skillsLanguage",
      "status",
      "availability",
      "remarks",
    ];

    const samplePosition = activePositionOptions[0]?.positionTitle || "";
    const sampleLocation = getFirstOptionValue(formOptions.locations);
    const sampleSource = getFirstOptionValue(formOptions.hearAboutUs);
    const sampleWorkExperience = getFirstOptionValue(formOptions.workExperience);
    const sampleEducation = getFirstOptionValue(
      formOptions.educationalAttainment,
    );
    const sampleStatus =
      statusOptions.find((status) => status !== "All") || "New Applicant";

    const sampleRow = [
      "",
      "Sample",
      "",
      "Candidate",
      "",
      "Sample",
      "sample.candidate@email.com",
      "09170000000",
      "",
      "1999-01-01",
      "Sample Address",
      samplePosition,
      sampleLocation,
      sampleSource,
      "N/A",
      "N/A",
      sampleWorkExperience,
      sampleEducation,
      "",
      sampleStatus,
      "Available",
      "Imported database-based sample lead",
    ];

    const csv = [createCsvRow(headers), createCsvRow(sampleRow)].join("\n");
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

  async function uploadLeadsFile(event) {
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

    setIsSaving(true);

    try {
      const response = await importTalentPoolCsvLeads(file);

      if (!response?.success) {
        alert(response?.message || "Failed to import CSV leads.");
        return;
      }

      await refreshTalentPool();

      alert(response?.message || "CSV leads imported successfully.");
    } finally {
      setIsSaving(false);

      if (uploadInputRef.current) {
        uploadInputRef.current.value = "";
      }
    }
  }

  const value = {
    user,
    currentTaOwner,
    uploadInputRef,

    candidateList,
    setCandidateList,
    filteredCandidates,
    stats,

    formOptions,
    statusOptions,
    accountOptions,
    activePositionOptions,

    isLoading,
    isSaving,
    loadError,
    refreshTalentPool,

    search,
    setSearch,
    statusFilter,
    setStatusFilter,

    positionFilter,
    setPositionFilter,

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

    emptyExperience,
    emptyCandidateForm,
    isRelevantWorkExperience,
    getOptionValue,
    getOptionLabel,
    optionValues,
    formatDate,
    formatList,

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