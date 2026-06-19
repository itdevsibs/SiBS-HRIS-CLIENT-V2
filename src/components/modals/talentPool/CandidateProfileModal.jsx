import { useEffect, useMemo, useState } from "react";
import {
  X,
  ArrowRight,
  Pencil,
  RefreshCcw,
  UserRound,
  BriefcaseBusiness,
  GraduationCap,
  ShieldCheck,
  Phone,
  FileText,
  ChevronDown,
  Network,
} from "lucide-react";

import {
  getCandidatePipelineLookupId,
  getCandidatePreEmploymentFiles,
  isCandidateLinkedToPipeline,
  safeArray,
  normalizeCandidateFile,
  dedupeCandidateFiles,
  getApiErrorMessage,
  getCandidateApplicationHistory,
  getCandidateStageValue,
} from "../../../lib/utils/talentPool/candidateProfileUtils";

import { useTalentPool } from "../../../services/context/TalentPoolContext";
import {
  formatCurrency,
  formatDate,
  formatList,
  getEncodedByName,
  getStatusClass,
} from "../../../lib/utils/talentPool/talentPoolHelpers";

import {
  ReferenceCard,
  StatusTile,
  ViewableFileRow,
} from "../../recruitment/talentPool/TalentPoolShared";

import GetAssessmentTimelineFiles from "../../../lib/utils/candidatePipeline/react-utils/GetAssessmentTimelineFiles";
import StatusModal from "../StatusModal";
import api from "../../../lib/axios/api-template";

function CompactInfoRow({ label, value }) {
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-[#E6ECF2] py-4 last:border-b-0 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-start">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
        {label}
      </p>

      <p className="min-w-0 break-words text-sm font-extrabold leading-6 text-[#101828] sm:text-right">
        {value || "—"}
      </p>
    </div>
  );
}

function ProfileInfoCard({ label, value, wide = false }) {
  return (
    <div
      className={`rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
        {label}
      </p>

      <p className="mt-2 min-w-0 break-words text-sm font-extrabold leading-6 text-[#101828]">
        {value || "—"}
      </p>
    </div>
  );
}

function TabSectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF3F8] text-sibs-primary-1">
        <Icon size={19} />
      </div>

      <div className="min-w-0">
        <h3 className="text-base font-extrabold uppercase tracking-wide text-sibs-primary-1">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-sm font-semibold leading-5 text-sibs-tertiary-5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function CandidateProfileModal() {
  const {
    selectedCandidate,
    setSelectedCandidate,
    currentTaOwner,
    openEditCandidate,
    openStatus,
    openMoveToPipeline,
  } = useTalentPool();

  const [showFullApplicationHistory, setShowFullApplicationHistory] =
    useState(false);

  const [activeTab, setActiveTab] = useState("personal");

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const [candidatePipelineFiles, setCandidatePipelineFiles] = useState([]);
  const [candidatePipelineFilesLoading, setCandidatePipelineFilesLoading] =
    useState(false);
  const [candidatePipelineFilesError, setCandidatePipelineFilesError] =
    useState("");

  const candidatePipelineLookupId = useMemo(
    () => getCandidatePipelineLookupId(selectedCandidate),
    [selectedCandidate],
  );

  const profilePreEmploymentFiles = useMemo(
    () => getCandidatePreEmploymentFiles(selectedCandidate),
    [selectedCandidate],
  );

  const isPipelineLinkedForFiles = useMemo(
    () => isCandidateLinkedToPipeline(selectedCandidate),
    [selectedCandidate],
  );

  useEffect(() => {
    setActiveTab("personal");
    setShowFullApplicationHistory(false);
  }, [selectedCandidate?.id, selectedCandidate?.candidateId]);

  useEffect(() => {
    let isActive = true;

    setCandidatePipelineFiles(profilePreEmploymentFiles);
    setCandidatePipelineFilesError("");

    if (
      !selectedCandidate ||
      !candidatePipelineLookupId ||
      !isPipelineLinkedForFiles
    ) {
      setCandidatePipelineFilesLoading(false);
      return () => {
        isActive = false;
      };
    }

    setCandidatePipelineFilesLoading(true);

    api
      .get(
        `/api/candidate-pipeline/${encodeURIComponent(
          candidatePipelineLookupId,
        )}/nho/files`,
        {
          withCredentials: true,
        },
      )
      .then((response) => {
        if (!isActive) return;

        const responseFiles =
          response?.data?.data?.files || response?.data?.files || [];

        const normalizedFiles = safeArray(responseFiles).map((file) =>
          normalizeCandidateFile(file, selectedCandidate),
        );

        setCandidatePipelineFiles(
          dedupeCandidateFiles([
            ...profilePreEmploymentFiles,
            ...normalizedFiles,
          ]),
        );
      })
      .catch((error) => {
        if (!isActive) return;

        if (profilePreEmploymentFiles.length > 0) {
          setCandidatePipelineFiles(profilePreEmploymentFiles);
          setCandidatePipelineFilesError("");
          return;
        }

        setCandidatePipelineFilesError(
          getApiErrorMessage(
            error,
            "Unable to load pre-employment files from Candidate Pipeline.",
          ),
        );
      })
      .finally(() => {
        if (isActive) {
          setCandidatePipelineFilesLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    selectedCandidate,
    candidatePipelineLookupId,
    isPipelineLinkedForFiles,
    profilePreEmploymentFiles,
  ]);

  const displayedPreEmploymentFiles = useMemo(
    () => dedupeCandidateFiles(candidatePipelineFiles),
    [candidatePipelineFiles],
  );

  function showStatusModal({ type = "success", title = "", message = "" }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
  }

  function closeStatusModal() {
    setStatusModal((previous) => ({
      ...previous,
      open: false,
    }));
  }

  if (!selectedCandidate) return null;

  const encodedBy = getEncodedByName(selectedCandidate, currentTaOwner);
  const isDoNotReprocess = selectedCandidate.status === "Do Not Reprocess";

  const candidateInitials =
    selectedCandidate.name
      ?.split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("") || "C";

  const validReferences = Array.isArray(selectedCandidate.references)
    ? selectedCandidate.references.filter(
        (reference) => reference?.name || reference?.phone,
      )
    : [];

  const workExperiences = Array.isArray(selectedCandidate.workExperiences)
    ? selectedCandidate.workExperiences.filter(Boolean)
    : [];

  const applicationHistory = getCandidateApplicationHistory(
    selectedCandidate,
    encodedBy,
  );

  const collapsedHistoryLimit = 3;

  const visibleApplicationHistory = showFullApplicationHistory
    ? applicationHistory
    : applicationHistory.slice(0, collapsedHistoryLimit);

  const hasMoreApplicationHistory =
    applicationHistory.length > collapsedHistoryLimit;

  const currentStage = getCandidateStageValue(selectedCandidate);
  const isAlreadyInPipeline = isPipelineLinkedForFiles;

  const profileTabs = [
    {
      id: "personal",
      label: "Personal Information",
      icon: UserRound,
    },
    {
      id: "applicationSource",
      label: "Application Source",
      icon: BriefcaseBusiness,
    },
    {
      id: "pipeline",
      label: "Pipeline Link",
      icon: Network,
    },
    {
      id: "qualifications",
      label: "Qualifications",
      icon: GraduationCap,
    },
    {
      id: "workExperience",
      label: "Work Experience",
      icon: BriefcaseBusiness,
    },
    {
      id: "readiness",
      label: "Readiness",
      icon: ShieldCheck,
    },
    {
      id: "references",
      label: "References",
      icon: Phone,
    },
    {
      id: "files",
      label: "Files",
      icon: FileText,
    },
    {
      id: "preEmploymentFiles",
      label: "Pre-Employment Files",
      icon: FileText,
    },
    {
      id: "applicationHistory",
      label: "Application History",
      icon: Network,
    },
    {
      id: "remarks",
      label: "General Remarks",
      icon: FileText,
    },
  ];

  function handleCloseCandidateProfile() {
    setSelectedCandidate(null);
  }

  function handleEditCandidate() {
    if (typeof openEditCandidate !== "function") {
      showStatusModal({
        type: "error",
        title: "Action Unavailable",
        message: "Edit Profile action is not available right now.",
      });
      return;
    }

    openEditCandidate(selectedCandidate);
  }

  function handleUpdateCandidateStatus() {
    if (typeof openStatus !== "function") {
      showStatusModal({
        type: "error",
        title: "Action Unavailable",
        message: "Update Status action is not available right now.",
      });
      return;
    }

    openStatus(selectedCandidate);
  }

  function handleMoveToPipeline() {
    if (isDoNotReprocess) {
      showStatusModal({
        type: "error",
        title: "Cannot Move Candidate",
        message:
          "This candidate is marked as Do Not Reprocess. Please update the candidate status before moving to the pipeline.",
      });
      return;
    }

    if (isAlreadyInPipeline) {
      showStatusModal({
        type: "success",
        title: "Already Linked",
        message: "This candidate is already linked to the Candidate Pipeline.",
      });
      return;
    }

    if (typeof openMoveToPipeline !== "function") {
      showStatusModal({
        type: "error",
        title: "Action Unavailable",
        message: "Move to Pipeline action is not available right now.",
      });
      return;
    }

    openMoveToPipeline(selectedCandidate);
  }

  function renderTabContent() {
    if (activeTab === "personal") {
      const personalRows = [
        {
          label: "Date of Birth",
          value: formatDate(selectedCandidate.dateOfBirth),
        },
        {
          label: "Age",
          value: selectedCandidate.ageAsOfApplication
            ? `${selectedCandidate.ageAsOfApplication}`
            : "—",
        },
        {
          label: "Encoded By",
          value: encodedBy || "—",
        },
        {
          label: "Created At",
          value: formatDate(selectedCandidate.createdAt),
        },
        {
          label: "Address",
          value: selectedCandidate.physicalAddress || "—",
          wide: true,
        },
      ];

      return (
        <>
          <TabSectionHeader
            icon={UserRound}
            title="Personal Information"
            description="Additional candidate profile details."
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {personalRows.map((item) => (
              <ProfileInfoCard
                key={item.label}
                label={item.label}
                value={item.value}
                wide={item.wide}
              />
            ))}
          </div>
        </>
      );
    }

    if (activeTab === "applicationSource") {
      const sourceRows = [
        {
          label: "Applied Position",
          value:
            selectedCandidate.openPosition ||
            selectedCandidate.roleCapability ||
            "—",
        },
        {
          label: "How Heard About Us",
          value: formatList(selectedCandidate.hearAboutUs),
        },
        {
          label: "Source",
          value: selectedCandidate.source || "—",
        },
        {
          label: "Referred By",
          value: selectedCandidate.referredBy || "—",
        },
        {
          label: "Employee ID",
          value: selectedCandidate.employeeId || "—",
        },
      ];

      return (
        <>
          <TabSectionHeader
            icon={BriefcaseBusiness}
            title="Application Source"
            description="Source information and referral details."
          />

          <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
            {sourceRows.map((item) => (
              <CompactInfoRow
                key={item.label}
                label={item.label}
                value={item.value}
              />
            ))}
          </div>
        </>
      );
    }

    if (activeTab === "pipeline") {
      const pipelineRows = [
        {
          label: "Pipeline Status",
          value: selectedCandidate.pipelineStatus || "—",
        },
        {
          label: "Current Stage",
          value:
            selectedCandidate.currentPipelineStage ||
            selectedCandidate.currentStage ||
            selectedCandidate.pipelineStage ||
            "—",
        },
        {
          label: "Final Role",
          value: selectedCandidate.currentAppliedRole || "Not assigned yet",
        },
        {
          label: "Final Account",
          value: selectedCandidate.currentAppliedAccount || "Not assigned yet",
        },
        {
          label: "TA Owner",
          value: selectedCandidate.currentTaOwner || "—",
        },
      ];

      return (
        <>
          <TabSectionHeader
            icon={Network}
            title="Pipeline Link"
            description="Current pipeline status, assignment, and TA ownership."
          />

          <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
            {pipelineRows.map((item) => (
              <CompactInfoRow
                key={item.label}
                label={item.label}
                value={item.value}
              />
            ))}
          </div>
        </>
      );
    }

    if (activeTab === "qualifications") {
      return (
        <>
          <TabSectionHeader
            icon={GraduationCap}
            title="Qualifications"
            description="Education, work experience, skills, and certifications."
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ProfileInfoCard
              label="Educational Attainment"
              value={selectedCandidate.educationalAttainment || "—"}
            />

            <ProfileInfoCard
              label="Skills / Language"
              value={selectedCandidate.skillsLanguage || "—"}
            />

            <ProfileInfoCard
              label="Affiliations"
              value={formatList(selectedCandidate.affiliations)}
            />

            <ProfileInfoCard
              label="Training Attended"
              value={selectedCandidate.trainingAttended || "—"}
            />
          </div>
        </>
      );
    }

    if (activeTab === "workExperience") {
      return (
        <>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <TabSectionHeader
              icon={BriefcaseBusiness}
              title="Work Experience"
              description="Candidate employment background and compensation."
            />

            <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
              {selectedCandidate.workExperience || "—"}
            </span>
          </div>

          {workExperiences.length > 0 ? (
            <div className="space-y-4">
              {workExperiences.map((experience, index) => (
                <div
                  key={`experience-${index}`}
                  className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                        Experience {index + 1}
                      </p>

                      <h5 className="mt-1 break-words text-base font-extrabold text-[#101828]">
                        {experience.role || experience.industry || "—"}
                      </h5>

                      <p className="mt-1 break-words text-sm font-bold text-sibs-primary-1">
                        {experience.company || "Company not provided"}
                      </p>
                    </div>

                    <span className="inline-flex w-fit shrink-0 rounded-full border border-[#D6E9FF] bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                      {experience.years
                        ? `${experience.years} year(s)`
                        : "No duration"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-xl bg-[#F8FAFC] p-3">
                      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                        Industry
                      </p>
                      <p className="mt-1 break-words text-sm font-bold text-[#344054]">
                        {experience.industry || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#F8FAFC] p-3">
                      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                        Compensation
                      </p>
                      <p className="mt-1 break-words text-sm font-bold text-[#344054]">
                        {experience.monthlyCompensation
                          ? formatCurrency(experience.monthlyCompensation)
                          : "—"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#F8FAFC] p-3">
                      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                        Length of Experience
                      </p>
                      <p className="mt-1 break-words text-sm font-bold text-[#344054]">
                        {experience.lengthOfWorkExperience || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#F8FAFC] p-3 md:col-span-3">
                      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                        Reason for Leaving
                      </p>
                      <p className="mt-1 whitespace-pre-line break-words text-sm font-bold leading-6 text-[#344054]">
                        {experience.reasonForLeaving || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#C9D6E4] bg-[#F8FAFC] px-4 py-4 text-center text-sm font-bold text-gray-500">
              {selectedCandidate.workExperience ||
                "No work experience provided."}
            </div>
          )}
        </>
      );
    }

    if (activeTab === "readiness") {
      return (
        <>
          <TabSectionHeader
            icon={ShieldCheck}
            title="Readiness and Compliance"
            description="Availability, work setup, and compliance readiness."
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <StatusTile
              label="Vaccinated"
              value={selectedCandidate.fullyVaccinated}
            />
            <StatusTile
              label="On-site Ready"
              value={selectedCandidate.comfortableOnSite}
            />
            <StatusTile
              label="Graveyard Shift"
              value={selectedCandidate.willingGraveyard}
            />
            <StatusTile
              label="Employment Type"
              value={selectedCandidate.employmentInterest}
            />
            <StatusTile
              label="Remote Access"
              value={selectedCandidate.remoteWorkAccess}
            />
            <StatusTile
              label="Drug Test"
              value={selectedCandidate.willingDrugTest}
            />
            <div className="sm:col-span-2 xl:col-span-3">
              <StatusTile
                label="Background Check"
                value={selectedCandidate.willingBackgroundCheck}
              />
            </div>
          </div>
        </>
      );
    }

    if (activeTab === "references") {
      return (
        <>
          <TabSectionHeader
            icon={Phone}
            title="References"
            description="Candidate character or work references."
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {validReferences.length > 0 ? (
              validReferences.map((reference, index) => (
                <ReferenceCard
                  key={`reference-${index}`}
                  reference={reference}
                  index={index}
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[#C9D6E4] bg-[#F8FAFC] p-5 text-center text-sm font-bold text-gray-500 md:col-span-2">
                No references provided.
              </div>
            )}
          </div>
        </>
      );
    }

    if (activeTab === "files") {
      return (
        <>
          <TabSectionHeader
            icon={FileText}
            title="Files"
            description="Uploaded audio and supporting attachments."
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ViewableFileRow
              label="Audio Recording"
              fileName={selectedCandidate.audioFileName}
              fileUrl={selectedCandidate.audioFileUrl}
              fileType={selectedCandidate.audioFileType}
              audio
            />

            <ViewableFileRow
              label="Attachment"
              fileName={selectedCandidate.attachmentFileName}
              fileUrl={selectedCandidate.attachmentFileUrl}
              fileType={selectedCandidate.attachmentFileType}
            />
          </div>
        </>
      );
    }

    if (activeTab === "preEmploymentFiles") {
      return (
        <>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <TabSectionHeader
              icon={FileText}
              title="Pre-Employment / NHO Files"
              description="Files uploaded from Candidate Pipeline."
            />

            <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
              {candidatePipelineFilesLoading
                ? "Loading..."
                : `${displayedPreEmploymentFiles.length} file${
                    displayedPreEmploymentFiles.length === 1 ? "" : "s"
                  }`}
            </span>
          </div>

          {candidatePipelineFilesError && (
            <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-700">
              {candidatePipelineFilesError}
            </div>
          )}

          {candidatePipelineFilesLoading &&
          displayedPreEmploymentFiles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#C9D6E4] bg-[#F8FAFC] p-5 text-center text-sm font-bold text-gray-500">
              Loading pre-employment files...
            </div>
          ) : displayedPreEmploymentFiles.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {displayedPreEmploymentFiles.map((file, index) => (
                <ViewableFileRow
                  key={`${file.id || file.fileName}-${index}`}
                  label={file.requirement || `Uploaded File ${index + 1}`}
                  fileName={file.fileName || file.savedFileName}
                  fileUrl={file.fileUrl}
                  fileType={file.fileType}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#C9D6E4] bg-[#F8FAFC] p-5 text-center text-sm font-bold text-gray-500">
              No pre-employment files uploaded yet.
            </div>
          )}
        </>
      );
    }

    if (activeTab === "applicationHistory") {
      return (
        <>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <TabSectionHeader
              icon={Network}
              title="Application History"
              description="Candidate movement and application timeline."
            />

            {applicationHistory.length > 0 && (
              <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                {applicationHistory.length} record
                {applicationHistory.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {applicationHistory.length > 0 ? (
            <>
              <div className="relative space-y-4">
                {visibleApplicationHistory.map((item, index) => {
                  const historyTitle = item.stage || "Application Update";
                  const historyDate =
                    item.date || selectedCandidate.lastActivity;
                  const historyOwner = item.owner || encodedBy || "—";
                  const historyDescription = item.description;
                  const offerDetail = item.offerDetail;

                  const absoluteHistoryIndex = applicationHistory.findIndex(
                    (historyItem) =>
                      historyItem._dedupeKey === item._dedupeKey,
                  );

                  const safeHistoryIndex =
                    absoluteHistoryIndex >= 0 ? absoluteHistoryIndex : index;

                  const isRealLastNode =
                    safeHistoryIndex === applicationHistory.length - 1;

                  const shouldShowLine = !isRealLastNode;

                  return (
                    <div
                      key={`${item._dedupeKey}-${historyDate}-${index}`}
                      className="relative grid grid-cols-[42px_minmax(0,1fr)] gap-4"
                    >
                      <div className="relative flex justify-center">
                        {shouldShowLine && (
                          <span className="absolute left-1/2 top-10 -bottom-4 w-px -translate-x-1/2 bg-[#DCE8F5]" />
                        )}

                        <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-extrabold text-blue-700 shadow-[0_0_0_6px_#FFFFFF]">
                          {safeHistoryIndex + 1}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#D9E2EC] bg-[#F8FAFC] p-4 transition hover:border-sibs-primary-1/30 hover:bg-white hover:shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h5
                              title={historyTitle}
                              className="line-clamp-2 text-sm font-extrabold leading-6 text-[#101828]"
                            >
                              {historyTitle}
                            </h5>

                            <p className="mt-1 text-sm font-bold text-sibs-primary-1">
                              {formatDate(historyDate)}
                            </p>
                          </div>

                          <span
                            title={historyOwner}
                            className="inline-flex max-w-full shrink-0 items-center justify-center truncate rounded-full border border-[#D6DEE8] bg-white px-3 py-1 text-xs font-bold text-[#475467]"
                          >
                            {historyOwner}
                          </span>
                        </div>

                        <p className="mt-4 whitespace-pre-line break-words text-sm font-medium leading-6 text-[#475467]">
                          {historyDescription}
                        </p>

                        {item.remarks && (
                          <div className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#344054]">
                            {item.remarks}
                          </div>
                        )}

                        <GetAssessmentTimelineFiles
                          item={item}
                          candidate={selectedCandidate}
                        />

                        {offerDetail && (
                          <div className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#344054]">
                            {offerDetail}
                          </div>
                        )}

                        {item.savedFormLink && (
                          <div className="mt-4 min-w-0">
                            <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                              Job Evaluation Link
                            </p>

                            <a
                              href={item.savedFormLink}
                              target="_blank"
                              rel="noreferrer"
                              title={item.savedFormLink}
                              dir="ltr"
                              className="mt-2 block w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-xl border border-[#D9E2EC] bg-white px-3 py-2 text-left text-sm text-blue-700 underline"
                            >
                              {window.location.origin}
                              {item.savedFormLink}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMoreApplicationHistory && (
                <div className="mt-5 flex justify-center border-t border-[#E6ECF2] pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      setShowFullApplicationHistory(
                        (previousValue) => !previousValue,
                      )
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-sibs-primary-1 transition hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC]"
                  >
                    {showFullApplicationHistory
                      ? "Show Less History"
                      : "View Full History"}

                    <ChevronDown
                      size={16}
                      className={`transition ${
                        showFullApplicationHistory ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-[#C9D6E4] bg-[#F8FAFC] p-5 text-center text-sm font-bold text-gray-500">
              No application history yet.
            </div>
          )}
        </>
      );
    }

    if (activeTab === "remarks") {
      return (
        <>
          <TabSectionHeader
            icon={FileText}
            title="General Remarks"
            description="Additional notes for this candidate."
          />

          <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm font-medium leading-6 text-[#475467]">
            {selectedCandidate.remarks || "No additional remarks."}
          </div>
        </>
      );
    }

    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/45 px-3 py-3 sm:px-4"
        onClick={handleCloseCandidateProfile}
      >
        <div
          className="flex h-[calc(100dvh-24px)] w-[calc(100vw-24px)] max-w-[92rem] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:h-[94dvh] sm:w-full"
          onClick={(event) => event.stopPropagation()}
        >
          {/* MODAL HEADER */}
          <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] bg-white px-5 py-4 sm:px-7">
            <div className="min-w-0">
              <h2 className="line-clamp-1 text-xl font-extrabold text-sibs-primary-1 sm:text-2xl">
                Candidate Profile
              </h2>

              <p className="mt-1 line-clamp-3 text-sm font-semibold leading-5 text-sibs-primary-1/80 sm:line-clamp-none">
                View the master candidate profile before moving to the pipeline.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCloseCandidateProfile}
              className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={21} />
            </button>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 pb-36 sm:p-6 sm:pb-28">
            <div className="overflow-hidden rounded-2xl border border-[#DDE7F1] bg-white shadow-sm">
              {/* CANDIDATE TOP HEADER */}
              <section className="border-b border-[#E6ECF2] bg-white px-5 py-6 sm:px-7">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-sibs-primary-1 text-2xl font-extrabold text-white shadow-sm sm:h-24 sm:w-24 sm:text-3xl">
                      {candidateInitials}
                    </div>

                    <div className="min-w-0 max-w-full">
                      <h3 className="line-clamp-4 break-words text-xl font-extrabold uppercase leading-tight tracking-wide text-[#101828] sm:line-clamp-3 sm:text-2xl">
                        {selectedCandidate.name || "Unnamed Candidate"}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-sm font-extrabold text-[#101828] sm:text-base">
                        {selectedCandidate.openPosition ||
                          selectedCandidate.roleCapability ||
                          selectedCandidate.currentAppliedRole ||
                          "No applied role"}
                      </p>

                      <div className="mt-4 flex flex-col gap-2 text-sm font-semibold text-[#344054] sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
                        <span className="inline-flex min-w-0 items-center justify-center gap-2 sm:justify-start">
                          <span className="shrink-0 text-sibs-primary-1">
                            Nickname:
                          </span>
                          <span className="min-w-0 break-words">
                            {selectedCandidate.nickname || "—"}
                          </span>
                        </span>

                        <span className="inline-flex min-w-0 items-center justify-center gap-2 sm:justify-start">
                          <span className="shrink-0 text-sibs-primary-1">
                            Email:
                          </span>
                          <span className="min-w-0 break-all">
                            {selectedCandidate.email || "—"}
                          </span>
                        </span>

                        <span className="inline-flex min-w-0 items-center justify-center gap-2 sm:justify-start">
                          <span className="shrink-0 text-sibs-primary-1">
                            Phone 1:
                          </span>
                          <span className="min-w-0 break-words">
                            {selectedCandidate.phoneNumber1 ||
                              selectedCandidate.contactNumber ||
                              "—"}
                          </span>
                        </span>

                        {selectedCandidate.phoneNumber2 && (
                          <span className="inline-flex min-w-0 items-center justify-center gap-2 sm:justify-start">
                            <span className="shrink-0 text-sibs-primary-1">
                              Phone 2:
                            </span>
                            <span className="min-w-0 break-words">
                              {selectedCandidate.phoneNumber2}
                            </span>
                          </span>
                        )}

                        <span className="inline-flex min-w-0 items-center justify-center gap-2 sm:justify-start">
                          <span className="shrink-0 text-sibs-primary-1">
                            Location:
                          </span>
                          <span className="min-w-0 break-words">
                            {selectedCandidate.applyingLocation ||
                              selectedCandidate.physicalAddress ||
                              "—"}
                          </span>
                        </span>

                        <span className="inline-flex min-w-0 items-center justify-center gap-2 sm:justify-start">
                          <span className="shrink-0 text-sibs-primary-1">
                            Last Activity:
                          </span>
                          <span className="min-w-0 break-words">
                            {formatDate(selectedCandidate.lastActivity)}
                          </span>
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                        <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                          {selectedCandidate.candidateId || "—"}
                        </span>

                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${getStatusClass(
                            selectedCandidate.status,
                          )}`}
                        >
                          {selectedCandidate.status || "—"}
                        </span>

                        {currentStage && (
                          <span className="inline-flex rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-extrabold text-cyan-700">
                            {currentStage}
                          </span>
                        )}

                        {selectedCandidate.isPublicSubmission && (
                          <span className="inline-flex rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-extrabold text-purple-700">
                            Public Submission
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row xl:pt-2">
                    <button
                      type="button"
                      onClick={handleEditCandidate}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] hover:shadow-sm sm:w-auto"
                    >
                      <Pencil size={16} />
                      Edit Profile
                    </button>

                    <button
                      type="button"
                      onClick={handleUpdateCandidateStatus}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#F3D8A8] bg-[#FFF8E8] px-5 text-sm font-extrabold text-[#B45309] transition hover:bg-[#FFF3D6] hover:shadow-sm sm:w-auto"
                    >
                      <RefreshCcw size={16} />
                      Update Status
                    </button>
                  </div>
                </div>

                {isDoNotReprocess && (
                  <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">
                    This candidate is marked as Do Not Reprocess and cannot be
                    moved to the pipeline unless the status is updated.
                  </div>
                )}
              </section>

              {/* TABBED CONTENT */}
              <section className="grid grid-cols-1 gap-0 border-t border-[#E6ECF2] lg:grid-cols-[240px_minmax(0,1fr)]">
                {/* LEFT TABS */}
                <aside className="border-b border-[#E6ECF2] bg-white p-4 lg:border-b-0 lg:border-r lg:p-5">
                  <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
                    {profileTabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`inline-flex min-w-max items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-extrabold transition lg:min-w-0 ${
                            isActive
                              ? "bg-[#EEF3F8] text-sibs-primary-1"
                              : "text-[#667085] hover:bg-[#F8FAFC] hover:text-sibs-primary-1"
                          }`}
                        >
                          <Icon
                            size={18}
                            className={
                              isActive
                                ? "text-sibs-primary-1"
                                : "text-[#98A2B3]"
                            }
                          />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                {/* RIGHT TAB PANEL */}
                <div className="min-w-0 bg-white p-5 sm:p-7">
                  {renderTabContent()}
                </div>
              </section>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex flex-col-reverse gap-4 border-t border-[#E6ECF2] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-xs font-bold leading-5 text-sibs-tertiary-5">
              {isAlreadyInPipeline ? (
                <span className="font-extrabold text-emerald-600">
                  Candidate is already linked to the Candidate Pipeline.
                </span>
              ) : isDoNotReprocess ? (
                <span className="font-extrabold text-red-600">
                  Update the candidate status before moving to pipeline.
                </span>
              ) : (
                "Review all candidate details before moving to pipeline."
              )}
            </p>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleCloseCandidateProfile}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-[#475467] transition hover:bg-[#F8FAFC] hover:shadow-sm"
              >
                Close
              </button>

              <button
                type="button"
                disabled={isDoNotReprocess}
                onClick={handleMoveToPipeline}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-white"
              >
                <ArrowRight size={16} />
                {isAlreadyInPipeline ? "Already Linked" : "Move to Pipeline"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={closeStatusModal}
        lockScroll={false}
      />
    </>
  );
}