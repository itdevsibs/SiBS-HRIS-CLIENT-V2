import {
  X,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  UploadCloud,
  UserRound,
  BriefcaseBusiness,
  GraduationCap,
  ShieldCheck,
  Phone,
  FileText,
} from "lucide-react";

import { useTalentPool } from "../../../services/context/TalentPoolContext";

import {
  affiliationOptions,
  educationalAttainmentOptions,
  employmentInterestOptions,
  emptyExperience,
  hearAboutUsOptions,
  lengthOfWorkExperienceOptions,
  locationOptions,
  statusOptions,
  workExperienceOptions,
  yesNoOptions,
} from "../../../lib/utils/talentPool/talentPoolConstants";

import {
  getActiveOpenPositionOptions,
  inputClass,
  textareaClass,
} from "../../../lib/utils/talentPool/talentPoolHelpers";

import {
  FieldLabel,
  MultiCheckGroup,
  TimelineSectionHeader,
} from "../../recruitment/talentPool/TalentPoolShared";

function SelectField({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select",
  required = false,
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={onChange}
        required={required}
        className={inputClass()}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  required = false,
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={inputClass()}
      />
    </div>
  );
}

export default function AddCandidateModal() {
  const {
    showAddModal,
    candidateForm,
    setCandidateForm,
    closeAddCandidateModal,
    resetCandidateForm,
    addCandidate,
    handleCandidateFileChange,
  } = useTalentPool();

  if (!showAddModal) return null;

  const openPositionOptions = getActiveOpenPositionOptions();

  function updateField(field, value) {
    setCandidateForm({
      ...candidateForm,
      [field]: value,
    });
  }

  function updateReference(index, field, value) {
    setCandidateForm({
      ...candidateForm,
      references: candidateForm.references.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    });
  }

  function updateExperience(index, field, value) {
    setCandidateForm({
      ...candidateForm,
      workExperiences: candidateForm.workExperiences.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    });
  }

  function addExperience() {
    setCandidateForm({
      ...candidateForm,
      workExperiences: [
        ...candidateForm.workExperiences,
        {
          ...emptyExperience,
          id: Date.now(),
        },
      ],
    });
  }

  function removeExperience(index) {
    const nextExperiences = candidateForm.workExperiences.filter(
      (_, itemIndex) => itemIndex !== index,
    );

    setCandidateForm({
      ...candidateForm,
      workExperiences:
        nextExperiences.length > 0 ? nextExperiences : [{ ...emptyExperience }],
    });
  }

  const hasWorkExperience =
    candidateForm.workExperience === workExperienceOptions[0];

  return (
    <div
      className="fixed inset-0 z-[10001] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={closeAddCandidateModal}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-extrabold text-sibs-primary-1">
              Add Candidate
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Create a reusable Talent Pool candidate profile.
            </p>
          </div>

          <button
            type="button"
            onClick={closeAddCandidateModal}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form
          id="add-candidate-form"
          onSubmit={addCandidate}
          className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6"
        >
          <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5">
            <TimelineSectionHeader
              step="1"
              icon={UserRound}
              title="Candidate Information"
              description="Basic profile details from public form or manual entry."
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TextField
                label="First Name"
                value={candidateForm.firstName}
                onChange={(event) =>
                  updateField("firstName", event.target.value)
                }
                required
              />

              <TextField
                label="Last Name"
                value={candidateForm.lastName}
                onChange={(event) =>
                  updateField("lastName", event.target.value)
                }
                required
              />

              <TextField
                label="Middle Name"
                value={candidateForm.middleName}
                onChange={(event) =>
                  updateField("middleName", event.target.value)
                }
              />

              <TextField
                label="Suffix"
                value={candidateForm.suffix}
                onChange={(event) => updateField("suffix", event.target.value)}
                placeholder="Jr., Sr., III"
              />

              <TextField
                label="Nickname"
                value={candidateForm.nickname}
                onChange={(event) =>
                  updateField("nickname", event.target.value)
                }
              />

              <TextField
                label="Date of Birth"
                type="date"
                value={candidateForm.dateOfBirth}
                onChange={(event) =>
                  updateField("dateOfBirth", event.target.value)
                }
                required
              />

              <TextField
                label="Email"
                type="email"
                value={candidateForm.email}
                onChange={(event) => updateField("email", event.target.value)}
                required
              />

              <TextField
                label="Phone Number 1"
                value={candidateForm.phoneNumber1}
                onChange={(event) =>
                  updateField("phoneNumber1", event.target.value)
                }
                required
              />

              <TextField
                label="Phone Number 2"
                value={candidateForm.phoneNumber2}
                onChange={(event) =>
                  updateField("phoneNumber2", event.target.value)
                }
              />

              <SelectField
                label="Applying Location"
                value={candidateForm.applyingLocation}
                onChange={(event) =>
                  updateField("applyingLocation", event.target.value)
                }
                options={locationOptions}
                placeholder="Select location"
                required
              />

              <TextField
                label="Physical Address"
                value={candidateForm.physicalAddress}
                onChange={(event) =>
                  updateField("physicalAddress", event.target.value)
                }
                required
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5">
            <TimelineSectionHeader
              step="2"
              icon={BriefcaseBusiness}
              title="Application Source and Position"
              description="This is the master profile preference. Final role and account are assigned later in the pipeline."
            />

            <div className="space-y-4">
              <div>
                <FieldLabel>
                  How did the applicant first hear about us?
                </FieldLabel>
                <MultiCheckGroup
                  options={hearAboutUsOptions}
                  value={candidateForm.hearAboutUs}
                  onChange={(value) => updateField("hearAboutUs", value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SelectField
                  label="Open Position"
                  value={candidateForm.openPosition}
                  onChange={(event) =>
                    updateField("openPosition", event.target.value)
                  }
                  options={openPositionOptions}
                  placeholder="Select position"
                  required
                />

                <TextField
                  label="Referred By"
                  value={candidateForm.referredBy}
                  onChange={(event) =>
                    updateField("referredBy", event.target.value)
                  }
                  placeholder="Employee name or N/A"
                />

                <TextField
                  label="Employee ID"
                  value={candidateForm.employeeId}
                  onChange={(event) =>
                    updateField("employeeId", event.target.value)
                  }
                  placeholder="If referral is employee-based"
                />

                <SelectField
                  label="Status"
                  value={candidateForm.status}
                  onChange={(event) =>
                    updateField("status", event.target.value)
                  }
                  options={statusOptions.filter((status) => status !== "All")}
                  placeholder="Select status"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5">
            <TimelineSectionHeader
              step="3"
              icon={GraduationCap}
              title="Experience and Qualifications"
              description="Capture education, skills, experience, certifications, and training."
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SelectField
                label="Work Experience"
                value={candidateForm.workExperience}
                onChange={(event) =>
                  updateField("workExperience", event.target.value)
                }
                options={workExperienceOptions}
                placeholder="Select work experience"
                required
              />

              <SelectField
                label="Educational Attainment"
                value={candidateForm.educationalAttainment}
                onChange={(event) =>
                  updateField("educationalAttainment", event.target.value)
                }
                options={educationalAttainmentOptions}
                placeholder="Select education"
                required
              />

              <TextField
                label="Skills / Language"
                value={candidateForm.skillsLanguage}
                onChange={(event) =>
                  updateField("skillsLanguage", event.target.value)
                }
                placeholder="English, Chat, Voice, Excel"
              />

              <TextField
                label="Training Attended"
                value={candidateForm.trainingAttended}
                onChange={(event) =>
                  updateField("trainingAttended", event.target.value)
                }
              />
            </div>

            <div className="mt-4">
              <FieldLabel>Affiliations and Certifications</FieldLabel>
              <MultiCheckGroup
                options={affiliationOptions}
                value={candidateForm.affiliations}
                onChange={(value) => updateField("affiliations", value)}
              />
            </div>

            {hasWorkExperience && (
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-extrabold text-[#101828]">
                    Work Experience Details
                  </h4>

                  <button
                    type="button"
                    onClick={addExperience}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                  >
                    <Plus size={14} />
                    Add Experience
                  </button>
                </div>

                {candidateForm.workExperiences.map((experience, index) => (
                  <div
                    key={experience.id || index}
                    className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-sibs-primary-1">
                        Experience {index + 1}
                      </p>

                      {candidateForm.workExperiences.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExperience(index)}
                          className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <TextField
                        label="Industry"
                        value={experience.industry}
                        onChange={(event) =>
                          updateExperience(
                            index,
                            "industry",
                            event.target.value,
                          )
                        }
                      />

                      <SelectField
                        label="Length of Work Experience"
                        value={experience.lengthOfWorkExperience}
                        onChange={(event) =>
                          updateExperience(
                            index,
                            "lengthOfWorkExperience",
                            event.target.value,
                          )
                        }
                        options={lengthOfWorkExperienceOptions}
                      />

                      <TextField
                        label="Years"
                        value={experience.years}
                        onChange={(event) =>
                          updateExperience(index, "years", event.target.value)
                        }
                      />

                      <TextField
                        label="Role"
                        value={experience.role}
                        onChange={(event) =>
                          updateExperience(index, "role", event.target.value)
                        }
                      />

                      <TextField
                        label="Company"
                        value={experience.company}
                        onChange={(event) =>
                          updateExperience(index, "company", event.target.value)
                        }
                      />

                      <TextField
                        label="Monthly Compensation"
                        value={experience.monthlyCompensation}
                        onChange={(event) =>
                          updateExperience(
                            index,
                            "monthlyCompensation",
                            event.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="mt-4">
                      <FieldLabel>Reason for Leaving</FieldLabel>
                      <textarea
                        rows={3}
                        value={experience.reasonForLeaving}
                        onChange={(event) =>
                          updateExperience(
                            index,
                            "reasonForLeaving",
                            event.target.value,
                          )
                        }
                        className={textareaClass()}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5">
            <TimelineSectionHeader
              step="4"
              icon={ShieldCheck}
              title="Readiness and Compliance"
              description="Work setup, health, and background requirements."
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SelectField
                label="Fully Vaccinated"
                value={candidateForm.fullyVaccinated}
                onChange={(event) =>
                  updateField("fullyVaccinated", event.target.value)
                }
                options={yesNoOptions}
              />

              <SelectField
                label="Comfortable Working On-site"
                value={candidateForm.comfortableOnSite}
                onChange={(event) =>
                  updateField("comfortableOnSite", event.target.value)
                }
                options={yesNoOptions}
              />

              <SelectField
                label="Willing to Work Graveyard / Shifting"
                value={candidateForm.willingGraveyard}
                onChange={(event) =>
                  updateField("willingGraveyard", event.target.value)
                }
                options={yesNoOptions}
              />

              <SelectField
                label="Employment Interest"
                value={candidateForm.employmentInterest}
                onChange={(event) =>
                  updateField("employmentInterest", event.target.value)
                }
                options={employmentInterestOptions}
              />

              <SelectField
                label="Has Remote Work Access"
                value={candidateForm.remoteWorkAccess}
                onChange={(event) =>
                  updateField("remoteWorkAccess", event.target.value)
                }
                options={yesNoOptions}
              />

              <SelectField
                label="Willing to Take Drug Test"
                value={candidateForm.willingDrugTest}
                onChange={(event) =>
                  updateField("willingDrugTest", event.target.value)
                }
                options={yesNoOptions}
              />

              <SelectField
                label="Willing Background Check"
                value={candidateForm.willingBackgroundCheck}
                onChange={(event) =>
                  updateField("willingBackgroundCheck", event.target.value)
                }
                options={yesNoOptions}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5">
            <TimelineSectionHeader
              step="5"
              icon={Phone}
              title="References"
              description="Capture up to three character or work references."
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {candidateForm.references.map((reference, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                >
                  <p className="mb-3 text-sm font-bold text-sibs-primary-1">
                    Reference {index + 1}
                  </p>

                  <div className="space-y-3">
                    <TextField
                      label="Name"
                      value={reference.name}
                      onChange={(event) =>
                        updateReference(index, "name", event.target.value)
                      }
                    />

                    <TextField
                      label="Phone"
                      value={reference.phone}
                      onChange={(event) =>
                        updateReference(index, "phone", event.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5">
            <TimelineSectionHeader
              step="6"
              icon={FileText}
              title="Attachments and Remarks"
              description="Optional audio and supporting file for the candidate profile."
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Audio File</FieldLabel>
                <label className="flex h-12 cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-[#C9D6E4] bg-[#F8FAFC] px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-white">
                  <span className="truncate">
                    {candidateForm.audioFileName || "Upload audio"}
                  </span>
                  <UploadCloud size={18} />
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(event) =>
                      handleCandidateFileChange(
                        event,
                        "audio",
                        candidateForm,
                        setCandidateForm,
                      )
                    }
                  />
                </label>
              </div>

              <div>
                <FieldLabel>Attachment</FieldLabel>
                <label className="flex h-12 cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-[#C9D6E4] bg-[#F8FAFC] px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-white">
                  <span className="truncate">
                    {candidateForm.attachmentFileName || "Upload attachment"}
                  </span>
                  <UploadCloud size={18} />
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                    className="hidden"
                    onChange={(event) =>
                      handleCandidateFileChange(
                        event,
                        "attachment",
                        candidateForm,
                        setCandidateForm,
                      )
                    }
                  />
                </label>
              </div>
            </div>

            <div className="mt-4">
              <FieldLabel>Remarks</FieldLabel>
              <textarea
                rows={4}
                value={candidateForm.remarks}
                onChange={(event) => updateField("remarks", event.target.value)}
                className={textareaClass()}
                placeholder="Candidate notes, screening observations, or other details."
              />
            </div>

            <label className="mt-4 flex items-start gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm font-semibold text-[#344054]">
              <input
                type="checkbox"
                checked={candidateForm.consent}
                onChange={(event) =>
                  updateField("consent", event.target.checked)
                }
                className="mt-1 h-4 w-4"
              />
              I confirm that the candidate consented to the collection and use
              of these details for recruitment processing.
            </label>
          </section>
        </form>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetCandidateForm}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-[#F8FAFC]"
            >
              <RotateCcw size={16} />
              Reset
            </button>

            <button
              type="submit"
              form="add-candidate-form"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <Save size={16} />
              Save Candidate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
