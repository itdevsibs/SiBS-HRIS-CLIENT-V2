import { useState } from "react";
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

import { useTalentPool } from "../../../services/context/TalentPoolContext";
import {
  formatCurrency,
  formatDate,
  formatList,
  getEncodedByName,
  getStatusClass,
} from "../../../lib/utils/talentPool/talentPoolHelpers";

import {
  DetailRow,
  ReferenceCard,
  SectionTitle,
  StatusTile,
  ViewableFileRow,
} from "../../recruitment/talentPool/TalentPoolShared";

function getNormalizedHistoryDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).trim();
  }

  return date.toISOString().slice(0, 16);
}

function getCandidateStageValue(candidate = {}) {
  return (
    candidate.currentStage ||
    candidate.currentPipelineStage ||
    candidate.pipelineStage ||
    candidate.stage ||
    ""
  );
}

function isValidTimelineValue(value) {
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

function getHistoryTitle(item = {}) {
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

function getHistoryDate(item = {}) {
  return (
    item.date ||
    item.createdAt ||
    item.updatedAt ||
    item.activityDate ||
    item.timestamp ||
    ""
  );
}

function getHistoryOwner(item = {}, candidate = {}, fallbackOwner = "—") {
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

function getHistoryDescription(item = {}) {
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

function getOfferDetail(item = {}) {
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

function getHistoryRemarks(item = {}) {
  return item.remarks || item.dropOffReason || item.dropOffCategory || "";
}

function normalizeHistoryItem(item = {}, candidate = {}, fallbackOwner = "—") {
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

function getCandidateApplicationHistory(candidate = {}, fallbackOwner = "—") {
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

  const isAlreadyInPipeline = Boolean(
    selectedCandidate.pipelineStatus ||
    selectedCandidate.currentPipelineStage ||
    selectedCandidate.currentTaOwner ||
    selectedCandidate.pipelineStage ||
    selectedCandidate.currentStage ||
    selectedCandidate.movedToPipeline,
  );

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={() => setSelectedCandidate(null)}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-white px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-extrabold text-sibs-primary-1">
              Candidate Profile
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              View the master candidate profile before moving to the pipeline.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedCandidate(null)}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5">
            <div className="min-w-0 space-y-5">
              <section className="overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm">
                <div className="border-b border-[#E6ECF2] bg-[#F8FAFC] px-5 py-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sibs-primary-1 text-lg font-extrabold text-white shadow-sm">
                        {candidateInitials}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-extrabold text-[#101828]">
                          {selectedCandidate.name || "Unnamed Candidate"}
                        </h3>

                        <p className="mt-1 truncate text-sm font-semibold text-sibs-primary-1">
                          {selectedCandidate.email || "No email provided"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            {selectedCandidate.candidateId || "—"}
                          </span>

                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                              selectedCandidate.status,
                            )}`}
                          >
                            {selectedCandidate.status || "—"}
                          </span>

                          {currentStage && (
                            <span className="inline-flex rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                              {currentStage}
                            </span>
                          )}

                          {selectedCandidate.isPublicSubmission && (
                            <span className="inline-flex rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                              Public Submission
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:items-center">
                      <button
                        type="button"
                        onClick={() => openEditCandidate(selectedCandidate)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] hover:shadow-sm"
                      >
                        <Pencil size={16} />
                        Edit Profile
                      </button>

                      <button
                        type="button"
                        onClick={() => openStatus(selectedCandidate)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#F3D8A8] bg-[#FFF8E8] px-5 text-sm font-extrabold text-[#B45309] transition hover:bg-[#FFF3D6] hover:shadow-sm"
                      >
                        <RefreshCcw size={16} />
                        Update Status
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 divide-y divide-[#E6ECF2] md:grid-cols-3 md:divide-x md:divide-y-0">
                  <div className="px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Applied Position
                    </p>

                    <p
                      title={
                        selectedCandidate.openPosition ||
                        selectedCandidate.roleCapability ||
                        "—"
                      }
                      className="mt-1 truncate text-sm font-extrabold text-[#101828]"
                    >
                      {selectedCandidate.openPosition ||
                        selectedCandidate.roleCapability ||
                        "—"}
                    </p>
                  </div>

                  <div className="px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Preferred Location
                    </p>

                    <p
                      title={selectedCandidate.applyingLocation || "—"}
                      className="mt-1 truncate text-sm font-extrabold text-[#101828]"
                    >
                      {selectedCandidate.applyingLocation || "—"}
                    </p>
                  </div>

                  <div className="px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Last Activity
                    </p>

                    <p
                      title={formatDate(selectedCandidate.lastActivity)}
                      className="mt-1 truncate text-sm font-extrabold text-[#101828]"
                    >
                      {formatDate(selectedCandidate.lastActivity)}
                    </p>
                  </div>
                </div>

                {isDoNotReprocess && (
                  <div className="border-t border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                    This candidate is marked as Do Not Reprocess and cannot be
                    moved to the pipeline unless the status is updated.
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <SectionTitle
                  icon={UserRound}
                  title="Personal Information"
                  description="Candidate master profile and contact information."
                />

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div className="rounded-xl bg-[#F8FAFC] p-4">
                    <DetailRow
                      label="First Name"
                      value={selectedCandidate.firstName}
                    />
                    <DetailRow
                      label="Middle Name"
                      value={selectedCandidate.middleName}
                    />
                    <DetailRow
                      label="Last Name"
                      value={selectedCandidate.lastName}
                    />
                    <DetailRow
                      label="Suffix"
                      value={selectedCandidate.suffix}
                    />
                    <DetailRow
                      label="Nickname"
                      value={selectedCandidate.nickname}
                    />
                    <DetailRow
                      label="Date of Birth"
                      value={formatDate(selectedCandidate.dateOfBirth)}
                    />
                    <DetailRow
                      label="Age"
                      value={
                        selectedCandidate.ageAsOfApplication
                          ? `${selectedCandidate.ageAsOfApplication}`
                          : "—"
                      }
                    />
                  </div>

                  <div className="rounded-xl bg-[#F8FAFC] p-4">
                    <DetailRow label="Email" value={selectedCandidate.email} />
                    <DetailRow
                      label="Phone 1"
                      value={
                        selectedCandidate.phoneNumber1 ||
                        selectedCandidate.contactNumber
                      }
                    />
                    <DetailRow
                      label="Phone 2"
                      value={selectedCandidate.phoneNumber2}
                    />
                    <DetailRow
                      label="Address"
                      value={selectedCandidate.physicalAddress}
                    />
                    <DetailRow
                      label="Preferred Location"
                      value={selectedCandidate.applyingLocation}
                    />
                    <DetailRow label="Encoded By" value={encodedBy} />
                    <DetailRow
                      label="Created At"
                      value={formatDate(selectedCandidate.createdAt)}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <SectionTitle
                  icon={BriefcaseBusiness}
                  title="Application Source"
                  description="Candidate source information and referral details."
                />

                <div className="rounded-xl bg-[#F8FAFC] p-4">
                  <DetailRow
                    label="Applied Position"
                    value={
                      selectedCandidate.openPosition ||
                      selectedCandidate.roleCapability
                    }
                  />
                  <DetailRow
                    label="How Heard About Us"
                    value={formatList(selectedCandidate.hearAboutUs)}
                  />
                  <DetailRow label="Source" value={selectedCandidate.source} />
                  <DetailRow
                    label="Referred By"
                    value={selectedCandidate.referredBy}
                  />
                  <DetailRow
                    label="Employee ID"
                    value={selectedCandidate.employeeId}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <SectionTitle
                  icon={Network}
                  title="Pipeline Link"
                  description="Current pipeline status, assignment, and TA ownership."
                />

                <div className="rounded-xl bg-[#F8FAFC] p-4">
                  <DetailRow
                    label="Pipeline Status"
                    value={selectedCandidate.pipelineStatus || "—"}
                  />
                  <DetailRow
                    label="Current Stage"
                    value={
                      selectedCandidate.currentPipelineStage ||
                      selectedCandidate.currentStage ||
                      selectedCandidate.pipelineStage ||
                      "—"
                    }
                  />
                  <DetailRow
                    label="Final Role"
                    value={
                      selectedCandidate.currentAppliedRole || "Not assigned yet"
                    }
                  />
                  <DetailRow
                    label="Final Account"
                    value={
                      selectedCandidate.currentAppliedAccount ||
                      "Not assigned yet"
                    }
                  />
                  <DetailRow
                    label="TA Owner"
                    value={selectedCandidate.currentTaOwner || "—"}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <SectionTitle
                  icon={GraduationCap}
                  title="Qualifications"
                  description="Education, work experience, skills, and certifications."
                />

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                        Educational Attainment
                      </p>

                      <p className="mt-2 text-sm font-extrabold leading-6 text-[#101828]">
                        {selectedCandidate.educationalAttainment || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                        Skills / Language
                      </p>

                      <p className="mt-2 text-sm font-extrabold leading-6 text-[#101828]">
                        {selectedCandidate.skillsLanguage || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                        Affiliations
                      </p>

                      <p className="mt-2 text-sm font-extrabold leading-6 text-[#101828]">
                        {formatList(selectedCandidate.affiliations)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                        Training Attended
                      </p>

                      <p className="mt-2 text-sm font-extrabold leading-6 text-[#101828]">
                        {selectedCandidate.trainingAttended || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white">
                    <div className="flex flex-col gap-3 border-b border-[#E6ECF2] bg-[#F8FAFC] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h4 className="text-sm font-extrabold text-[#101828]">
                          Work Experience
                        </h4>

                        <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                          Candidate employment background, previous role,
                          company, and compensation.
                        </p>
                      </div>

                      <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                        {selectedCandidate.workExperience || "—"}
                      </span>
                    </div>

                    <div className="p-4">
                      {workExperiences.length > 0 ? (
                        <div className="space-y-4">
                          {workExperiences.map((experience, index) => (
                            <div
                              key={`experience-${index}`}
                              className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                            >
                              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0">
                                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                                    Experience {index + 1}
                                  </p>

                                  <h5 className="mt-1 text-base font-extrabold text-[#101828]">
                                    {experience.role ||
                                      experience.industry ||
                                      "—"}
                                  </h5>

                                  <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                                    {experience.company ||
                                      "Company not provided"}
                                  </p>
                                </div>

                                <span className="inline-flex w-fit shrink-0 rounded-full border border-[#D6E9FF] bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                                  {experience.years
                                    ? `${experience.years} year(s)`
                                    : "No duration"}
                                </span>
                              </div>

                              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                                <div className="rounded-xl bg-white p-3">
                                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                                    Industry
                                  </p>

                                  <p className="mt-1 text-sm font-bold text-[#344054]">
                                    {experience.industry || "—"}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-white p-3">
                                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                                    Compensation
                                  </p>

                                  <p className="mt-1 text-sm font-bold text-[#344054]">
                                    {experience.monthlyCompensation
                                      ? formatCurrency(
                                          experience.monthlyCompensation,
                                        )
                                      : "—"}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-white p-3">
                                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                                    Length of Experience
                                  </p>

                                  <p className="mt-1 text-sm font-bold text-[#344054]">
                                    {experience.lengthOfWorkExperience || "—"}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-white p-3 md:col-span-3">
                                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                                    Reason for Leaving
                                  </p>

                                  <p className="mt-1 text-sm font-bold leading-6 text-[#344054]">
                                    {experience.reasonForLeaving || "—"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-[#C9D6E4] bg-[#F8FAFC] p-5 text-center text-sm font-bold text-gray-500">
                          {selectedCandidate.workExperience ||
                            "No work experience provided."}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <SectionTitle
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
              </section>

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <SectionTitle
                  icon={Phone}
                  title="References"
                  description="Candidate character or work references."
                />

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {validReferences.length > 0 ? (
                    validReferences.map((reference, index) => (
                      <ReferenceCard
                        key={`reference-${index}`}
                        reference={reference}
                        index={index}
                      />
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#C9D6E4] bg-[#F8FAFC] p-5 text-center text-sm font-bold text-gray-500 md:col-span-3">
                      No references provided.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <SectionTitle
                  icon={FileText}
                  title="Files"
                  description="Uploaded audio and supporting attachments."
                />

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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
              </section>

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#101828]">
                      Application History
                    </h3>

                    <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                      Candidate movement and application timeline.
                    </p>
                  </div>

                  {applicationHistory.length > 0 && (
                    <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                      {applicationHistory.length} record
                      {applicationHistory.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div className="mt-5">
                  {applicationHistory.length > 0 ? (
                    <>
                      <div className="relative space-y-4">
                        {visibleApplicationHistory.map((item, index) => {
                          const historyTitle =
                            item.stage || "Application Update";

                          const historyDate =
                            item.date || selectedCandidate.lastActivity;

                          const historyOwner = item.owner || encodedBy || "—";
                          const historyDescription = item.description;
                          const offerDetail = item.offerDetail;

                          const absoluteHistoryIndex =
                            applicationHistory.findIndex(
                              (historyItem) =>
                                historyItem._dedupeKey === item._dedupeKey,
                            );

                          const safeHistoryIndex =
                            absoluteHistoryIndex >= 0
                              ? absoluteHistoryIndex
                              : index;

                          const isRealLastNode =
                            safeHistoryIndex === applicationHistory.length - 1;

                          const isLastVisibleNode =
                            index === visibleApplicationHistory.length - 1;

                          const shouldShowLine = !isRealLastNode;

                          const lineClass =
                            isLastVisibleNode && !showFullApplicationHistory
                              ? "absolute left-1/2 top-10 bottom-0 w-px -translate-x-1/2 bg-[#DCE8F5]"
                              : "absolute left-1/2 top-10 -bottom-4 w-px -translate-x-1/2 bg-[#DCE8F5]";

                          return (
                            <div
                              key={`${item._dedupeKey}-${historyDate}-${index}`}
                              className="relative grid grid-cols-[42px_minmax(0,1fr)] gap-4"
                            >
                              <div className="relative flex justify-center">
                                {shouldShowLine && (
                                  <span className={lineClass} />
                                )}

                                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-extrabold text-blue-700 shadow-[0_0_0_6px_#FFFFFF]">
                                  {safeHistoryIndex + 1}
                                </div>
                              </div>

                              <div className="rounded-2xl border border-[#D9E2EC] bg-[#F8FAFC] p-4 transition hover:border-sibs-primary-1/30 hover:bg-white hover:shadow-sm">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <h4
                                      title={historyTitle}
                                      className="line-clamp-2 text-sm font-extrabold leading-6 text-[#101828]"
                                    >
                                      {historyTitle}
                                    </h4>

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

                                <p className="mt-4 whitespace-pre-line text-sm font-medium leading-6 text-[#475467]">
                                  {historyDescription}
                                </p>

                                {item.remarks && (
                                  <div className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#344054]">
                                    {item.remarks}
                                  </div>
                                )}

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
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-sibs-primary-1 transition hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
                          >
                            {showFullApplicationHistory
                              ? "Show Less"
                              : "Show All"}

                            <ChevronDown
                              size={17}
                              className={`transition-transform duration-200 ${
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
                </div>
              </section>

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-[#101828]">
                  Remarks
                </h3>

                <p className="mt-3 whitespace-pre-line rounded-xl bg-[#F8FAFC] p-4 text-sm font-medium leading-6 text-[#475467]">
                  {selectedCandidate.remarks || "—"}
                </p>
              </section>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-sibs-tertiary-5">
              {isAlreadyInPipeline
                ? "Candidate is already linked to the pipeline."
                : "Review candidate details before moving to the pipeline."}
            </p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-extrabold text-[#475467] transition hover:bg-[#F8FAFC]"
              >
                Close
              </button>

              {!isAlreadyInPipeline && (
                <button
                  type="button"
                  disabled={isDoNotReprocess}
                  onClick={() => openMoveToPipeline(selectedCandidate)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-white"
                >
                  <ArrowRight size={16} />
                  Move to Pipeline
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
