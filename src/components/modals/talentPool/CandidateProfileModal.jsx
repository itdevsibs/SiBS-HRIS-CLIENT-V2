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

export default function CandidateProfileModal() {
  const {
    selectedCandidate,
    setSelectedCandidate,
    currentTaOwner,
    openEditCandidate,
    openStatus,
    openMoveToPipeline,
  } = useTalentPool();

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
                  title="Application Source and Pipeline Link"
                  description="Talent Pool source data and current pipeline information."
                />

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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
                    <DetailRow
                      label="Source"
                      value={selectedCandidate.source}
                    />
                    <DetailRow
                      label="Referred By"
                      value={selectedCandidate.referredBy}
                    />
                    <DetailRow
                      label="Employee ID"
                      value={selectedCandidate.employeeId}
                    />
                  </div>

                  <div className="rounded-xl bg-[#F8FAFC] p-4">
                    <DetailRow
                      label="Pipeline Status"
                      value={selectedCandidate.pipelineStatus || "—"}
                    />
                    <DetailRow
                      label="Current Stage"
                      value={selectedCandidate.currentPipelineStage || "—"}
                    />
                    <DetailRow
                      label="Final Role"
                      value={
                        selectedCandidate.currentAppliedRole ||
                        "Not assigned yet"
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
                <h3 className="text-sm font-extrabold text-[#101828]">
                  Application History
                </h3>

                <div className="mt-4 space-y-3">
                  {(selectedCandidate.applicationHistory || []).length > 0 ? (
                    selectedCandidate.applicationHistory.map((item, index) => (
                      <div
                        key={`${item.outcome}-${index}`}
                        className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                      >
                        <p className="text-sm font-bold text-[#101828]">
                          {item.outcome}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                          {item.role || "—"} • {item.account || "—"}
                        </p>
                        <p className="mt-2 text-xs font-bold text-sibs-primary-1">
                          {formatDate(item.date)}
                        </p>
                      </div>
                    ))
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
              Review candidate details before moving to the pipeline.
            </p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-extrabold text-[#475467] transition hover:bg-[#F8FAFC]"
              >
                Close
              </button>

              <button
                type="button"
                disabled={isDoNotReprocess}
                onClick={() => openMoveToPipeline(selectedCandidate)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-white"
              >
                <ArrowRight size={16} />
                Move to Pipeline
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
