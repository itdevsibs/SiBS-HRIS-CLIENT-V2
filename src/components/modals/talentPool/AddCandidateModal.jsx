import {
  X,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  UploadCloud,
  UserPlus,
  BriefcaseBusiness,
  GraduationCap,
  ShieldCheck,
  Users,
  Mic,
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
} from "../../recruitment/talentPool/TalentPoolShared";

const ACCEPTED_DOCUMENT_TYPES =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif";

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        {Icon && (
          <div className="rounded-2xl bg-sibs-primary-1/10 p-3 text-sibs-primary-1">
            <Icon size={18} />
          </div>
        )}

        <div>
          <h3 className="text-sm font-extrabold text-[#101828]">{title}</h3>

          {description && (
            <p className="mt-1 text-sm font-medium leading-6 text-sibs-tertiary-5">
              {description}
            </p>
          )}
        </div>
      </div>

      {children}
    </section>
  );
}

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
      <FieldLabel>
        {label} {required && <RequiredMark />}
      </FieldLabel>

      <select
        value={value || ""}
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
  extra = "",
}) {
  return (
    <div className={extra}>
      <FieldLabel>
        {label} {required && <RequiredMark />}
      </FieldLabel>

      <input
        type={type}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={inputClass()}
      />
    </div>
  );
}

function YesNoSelect({ label, value, onChange, required = true }) {
  return (
    <SelectField
      label={label}
      value={value}
      onChange={onChange}
      options={yesNoOptions}
      placeholder="Select answer"
      required={required}
    />
  );
}

function createEmptyExperience() {
  return {
    ...emptyExperience,
    id: Date.now(),
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
}

function normalizeExperienceForForm(experience = {}) {
  return {
    ...experience,
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

function ExperienceFields({
  experience,
  index,
  title,
  onChange,
  showRemove = false,
  onRemove,
}) {
  const normalizedExperience = normalizeExperienceForForm(experience);

  function updateExperienceField(field, value) {
    const nextExperience = {
      ...normalizedExperience,
      [field]: value,
    };

    if (field === "industryRelevantExperience") {
      nextExperience.industry = value;
    }

    if (field === "industry") {
      nextExperience.industryRelevantExperience = value;
    }

    onChange(index, nextExperience);
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="text-sm font-extrabold text-sibs-primary-1">{title}</h4>

        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-4 text-xs font-bold text-red-600 transition hover:bg-red-50"
          >
            <Trash2 size={14} />
            Remove
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField
          label="Industry or Relevant Experience"
          value={normalizedExperience.industryRelevantExperience}
          onChange={(event) =>
            updateExperienceField(
              "industryRelevantExperience",
              event.target.value,
            )
          }
          placeholder="Example: BPO, Healthcare, RCM, Finance"
          extra="md:col-span-2"
        />

        <SelectField
          label="Length of Work Experience"
          value={normalizedExperience.lengthOfWorkExperience}
          onChange={(event) =>
            updateExperienceField("lengthOfWorkExperience", event.target.value)
          }
          options={lengthOfWorkExperienceOptions}
          placeholder="Select length"
          required
        />

        <TextField
          label="Years"
          type="number"
          value={normalizedExperience.years}
          onChange={(event) =>
            updateExperienceField("years", event.target.value)
          }
          placeholder="Example: 2"
          required
        />

        <TextField
          label="Role"
          value={normalizedExperience.role}
          onChange={(event) =>
            updateExperienceField("role", event.target.value)
          }
          placeholder="Previous role"
          required
        />

        <TextField
          label="Company"
          value={normalizedExperience.company}
          onChange={(event) =>
            updateExperienceField("company", event.target.value)
          }
          placeholder="Previous company"
          required
        />

        <TextField
          label="Monthly Compensation"
          type="number"
          value={normalizedExperience.monthlyCompensation}
          onChange={(event) =>
            updateExperienceField("monthlyCompensation", event.target.value)
          }
          placeholder="Example: 20000"
          required
        />

        <TextField
          label="Reason for Leaving"
          value={normalizedExperience.reasonForLeaving}
          onChange={(event) =>
            updateExperienceField("reasonForLeaving", event.target.value)
          }
          placeholder="Reason for leaving"
          required
        />
      </div>
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

  const hasRelevantExperience =
    candidateForm.workExperience === workExperienceOptions[0];

  const hasOtherExperience =
    hasRelevantExperience && candidateForm.workExperiences?.length > 1;

  function updateField(field, value) {
    setCandidateForm({
      ...candidateForm,
      [field]: value,
    });
  }

  function updateReference(index, field, value) {
    const references = Array.isArray(candidateForm.references)
      ? candidateForm.references
      : [
          { name: "", phone: "" },
          { name: "", phone: "" },
          { name: "", phone: "" },
        ];

    setCandidateForm({
      ...candidateForm,
      references: references.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    });
  }

  function updateExperience(index, nextExperience) {
    const currentExperiences = Array.isArray(candidateForm.workExperiences)
      ? candidateForm.workExperiences
      : [createEmptyExperience()];

    setCandidateForm({
      ...candidateForm,
      workExperiences: currentExperiences.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...nextExperience,
              industry:
                nextExperience.industry ||
                nextExperience.industryRelevantExperience ||
                "",
              industryRelevantExperience:
                nextExperience.industryRelevantExperience ||
                nextExperience.industry ||
                "",
            }
          : item,
      ),
    });
  }

  function ensurePrimaryExperience() {
    const currentExperiences = Array.isArray(candidateForm.workExperiences)
      ? candidateForm.workExperiences
      : [];

    if (currentExperiences.length > 0) return currentExperiences;

    return [createEmptyExperience()];
  }

  function handleWorkExperienceChange(value) {
    setCandidateForm({
      ...candidateForm,
      workExperience: value,
      workExperiences:
        value === workExperienceOptions[0]
          ? ensurePrimaryExperience()
          : [{ ...emptyExperience }],
    });
  }

  function addOtherExperience() {
    const currentExperiences = ensurePrimaryExperience();

    setCandidateForm({
      ...candidateForm,
      workExperiences: [
        ...currentExperiences,
        {
          ...createEmptyExperience(),
          id: Date.now(),
          hasOtherExperience: "No",
        },
      ],
    });
  }

  function removeExperience(index) {
    const currentExperiences = ensurePrimaryExperience();

    const nextExperiences = currentExperiences.filter(
      (_, itemIndex) => itemIndex !== index,
    );

    setCandidateForm({
      ...candidateForm,
      workExperiences:
        nextExperiences.length > 0
          ? nextExperiences
          : [createEmptyExperience()],
    });
  }

  function handleOtherExperienceAnswer(value) {
    const currentExperiences = ensurePrimaryExperience();

    if (value === "Yes") {
      setCandidateForm({
        ...candidateForm,
        workExperiences:
          currentExperiences.length > 1
            ? currentExperiences
            : [
                currentExperiences[0],
                {
                  ...createEmptyExperience(),
                  id: Date.now(),
                },
              ],
      });

      return;
    }

    setCandidateForm({
      ...candidateForm,
      workExperiences: [currentExperiences[0]],
    });
  }

  const references = Array.isArray(candidateForm.references)
    ? candidateForm.references
    : [
        { name: "", phone: "" },
        { name: "", phone: "" },
        { name: "", phone: "" },
      ];

  const workExperiences = ensurePrimaryExperience();

  return (
    <div
      className="fixed inset-0 z-[10001] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={closeAddCandidateModal}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-extrabold text-sibs-primary-1">
              Add Candidate
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Create a reusable Talent Pool candidate profile using the same
              content as the public application form.
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
          className="flex-1 space-y-5 overflow-y-auto bg-[#F8FAFC] px-5 py-5 sm:px-6"
        >
          <SectionCard
            icon={BriefcaseBusiness}
            title="Application Source and Position"
            description="Tell us where the applicant learned about SiBS and what position they are applying for."
          >
            <div className="space-y-4">
              <div>
                <FieldLabel>
                  How did the applicant first hear about us? <RequiredMark />
                </FieldLabel>

                <MultiCheckGroup
                  options={hearAboutUsOptions}
                  value={candidateForm.hearAboutUs}
                  onChange={(value) => updateField("hearAboutUs", value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SelectField
                  label="Check our open positions"
                  value={candidateForm.openPosition}
                  onChange={(event) =>
                    updateField("openPosition", event.target.value)
                  }
                  options={openPositionOptions}
                  placeholder="Select open position"
                  required
                />

                <TextField
                  label="Nickname"
                  value={candidateForm.nickname}
                  onChange={(event) =>
                    updateField("nickname", event.target.value)
                  }
                  placeholder="Preferred nickname"
                />

                <SelectField
                  label="Which location are you applying for?"
                  value={candidateForm.applyingLocation}
                  onChange={(event) =>
                    updateField("applyingLocation", event.target.value)
                  }
                  options={locationOptions}
                  placeholder="Select location"
                  required
                />

                <TextField
                  label="Who referred you to us?"
                  value={candidateForm.referredBy}
                  onChange={(event) =>
                    updateField("referredBy", event.target.value)
                  }
                  placeholder="Referrer name or N/A"
                  required
                />

                <TextField
                  label="Employee ID"
                  value={candidateForm.employeeId}
                  onChange={(event) =>
                    updateField("employeeId", event.target.value)
                  }
                  placeholder="Referrer employee ID or N/A"
                  required
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={UserPlus}
            title="Personal Information"
            description="Enter the applicant legal name, contact details, and address."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <TextField
                label="First Name"
                value={candidateForm.firstName}
                onChange={(event) =>
                  updateField("firstName", event.target.value)
                }
                placeholder="Juan"
                required
              />

              <TextField
                label="Last Name"
                value={candidateForm.lastName}
                onChange={(event) =>
                  updateField("lastName", event.target.value)
                }
                placeholder="Dela Cruz"
                required
              />

              <TextField
                label="Middle Name"
                value={candidateForm.middleName}
                onChange={(event) =>
                  updateField("middleName", event.target.value)
                }
                placeholder="Santos"
              />

              <TextField
                label="Suffix"
                value={candidateForm.suffix}
                onChange={(event) => updateField("suffix", event.target.value)}
                placeholder="Jr., Sr., III"
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
                placeholder="candidate@email.com"
                required
              />

              <TextField
                label="Phone 1"
                value={candidateForm.phoneNumber1}
                onChange={(event) =>
                  updateField("phoneNumber1", event.target.value)
                }
                placeholder="09xxxxxxxxx"
              />

              <TextField
                label="Phone 2"
                value={candidateForm.phoneNumber2}
                onChange={(event) =>
                  updateField("phoneNumber2", event.target.value)
                }
                placeholder="Optional"
              />

              <TextField
                label="Physical Address"
                value={candidateForm.physicalAddress}
                onChange={(event) =>
                  updateField("physicalAddress", event.target.value)
                }
                placeholder="Complete physical address"
                required
                extra="md:col-span-4"
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={BriefcaseBusiness}
            title="Work Experience"
            description="Additional work experience fields will appear when Has work Experience is selected."
          >
            <div className="space-y-4">
              <SelectField
                label="Work Experience"
                value={candidateForm.workExperience}
                onChange={(event) =>
                  handleWorkExperienceChange(event.target.value)
                }
                options={workExperienceOptions}
                placeholder="Select work experience"
                required
              />

              {hasRelevantExperience && (
                <div className="space-y-4">
                  <ExperienceFields
                    index={0}
                    title="Industry or Relevant Experience"
                    experience={workExperiences[0]}
                    onChange={updateExperience}
                  />

                  <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px] md:items-end">
                      <SelectField
                        label="Do you have other experience?"
                        value={hasOtherExperience ? "Yes" : "No"}
                        onChange={(event) =>
                          handleOtherExperienceAnswer(event.target.value)
                        }
                        options={yesNoOptions}
                        placeholder="Select answer"
                      />

                      {hasOtherExperience && (
                        <button
                          type="button"
                          onClick={addOtherExperience}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-4 text-sm font-bold text-white transition hover:opacity-90"
                        >
                          <Plus size={16} />
                          Add Other Experience
                        </button>
                      )}
                    </div>
                  </div>

                  {hasOtherExperience &&
                    workExperiences.slice(1).map((experience, itemIndex) => {
                      const actualIndex = itemIndex + 1;

                      return (
                        <ExperienceFields
                          key={experience.id || actualIndex}
                          index={actualIndex}
                          title={`Other Experience ${itemIndex + 1}`}
                          experience={experience}
                          onChange={updateExperience}
                          showRemove
                          onRemove={() => removeExperience(actualIndex)}
                        />
                      );
                    })}
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            icon={GraduationCap}
            title="Education, Affiliations, and Training"
            description="Select educational attainment and any applicable affiliations or certifications."
          >
            <div className="space-y-5">
              <SelectField
                label="Highest Educational Attainment"
                value={candidateForm.educationalAttainment}
                onChange={(event) =>
                  updateField("educationalAttainment", event.target.value)
                }
                options={educationalAttainmentOptions}
                placeholder="Select educational attainment"
                required
              />

              <div>
                <FieldLabel>Affiliations and Certifications</FieldLabel>

                <MultiCheckGroup
                  options={affiliationOptions}
                  value={candidateForm.affiliations}
                  onChange={(value) => updateField("affiliations", value)}
                />
              </div>

              <div>
                <FieldLabel>Training Attended</FieldLabel>

                <textarea
                  value={candidateForm.trainingAttended || ""}
                  onChange={(event) =>
                    updateField("trainingAttended", event.target.value)
                  }
                  placeholder="List trainings attended"
                  rows={4}
                  className={textareaClass()}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={ShieldCheck}
            title="Work Readiness Questions"
            description="These questions help Talent Acquisition review work setup and compliance readiness."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <YesNoSelect
                label="Are you fully vaccinated?"
                value={candidateForm.fullyVaccinated}
                onChange={(event) =>
                  updateField("fullyVaccinated", event.target.value)
                }
              />

              <YesNoSelect
                label="Are you comfortable working on site?"
                value={candidateForm.comfortableOnSite}
                onChange={(event) =>
                  updateField("comfortableOnSite", event.target.value)
                }
              />

              <YesNoSelect
                label="Are you willing to work in graveyard shift?"
                value={candidateForm.willingGraveyard}
                onChange={(event) =>
                  updateField("willingGraveyard", event.target.value)
                }
              />

              <SelectField
                label="Full-time, part-time, or either?"
                value={candidateForm.employmentInterest}
                onChange={(event) =>
                  updateField("employmentInterest", event.target.value)
                }
                options={employmentInterestOptions}
                placeholder="Select employment preference"
                required
              />

              <div className="md:col-span-2">
                <YesNoSelect
                  label="If this is a remote position, do you have access to a computer, Internet connection, and a private space to work remotely?"
                  value={candidateForm.remoteWorkAccess}
                  onChange={(event) =>
                    updateField("remoteWorkAccess", event.target.value)
                  }
                />
              </div>

              <YesNoSelect
                label="Are you willing to undertake a drug test as part of this hiring process?"
                value={candidateForm.willingDrugTest}
                onChange={(event) =>
                  updateField("willingDrugTest", event.target.value)
                }
              />

              <YesNoSelect
                label="Are you willing to allow SiBS to undergo a background check as part of this hiring process?"
                value={candidateForm.willingBackgroundCheck}
                onChange={(event) =>
                  updateField("willingBackgroundCheck", event.target.value)
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={Users}
            title="References"
            description="Please list at least three references and their contact information."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {references.map((reference, index) => (
                <div key={`reference-${index}`} className="contents">
                  <TextField
                    label={`Reference ${index + 1}`}
                    value={reference.name}
                    onChange={(event) =>
                      updateReference(index, "name", event.target.value)
                    }
                    placeholder={`Reference ${index + 1} name`}
                    required
                  />

                  <TextField
                    label="Phone"
                    value={reference.phone}
                    onChange={(event) =>
                      updateReference(index, "phone", event.target.value)
                    }
                    placeholder={`Reference ${index + 1} phone`}
                  />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            icon={Mic}
            title="Audio and File Upload"
            description="Optional audio file and one supporting document/file."
          >
            <div className="space-y-5">
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 text-sm font-semibold leading-7 text-amber-800">
                <p className="font-extrabold">
                  The audio file may answer these questions:
                </p>

                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Why did you apply for this position?</li>
                  <li>Why would you like to work with our company?</li>
                  <li>
                    How does this position fit in with your long-term goals?
                  </li>
                  <li>How did you learn about this job or source card?</li>
                </ul>
              </div>

              <div>
                <FieldLabel>Upload single audio file</FieldLabel>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#C9D6E4] bg-[#F8FAFC] px-5 py-8 text-center transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5">
                  <Mic size={26} className="text-sibs-primary-1" />

                  <p className="mt-2 max-w-full truncate text-sm font-extrabold text-[#101828]">
                    {candidateForm.audioFileName || "Choose audio file"}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                    Accepted: audio files only
                  </p>

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
                <FieldLabel>Upload supporting file</FieldLabel>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#C9D6E4] bg-[#F8FAFC] px-5 py-8 text-center transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5">
                  <UploadCloud size={26} className="text-sibs-primary-1" />

                  <p className="mt-2 max-w-full truncate text-sm font-extrabold text-[#101828]">
                    {candidateForm.attachmentFileName || "Choose file"}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                    PDF, DOC/DOCX, XLS/CSV, JPG/JPEG, PNG, GIF
                  </p>

                  <input
                    type="file"
                    accept={ACCEPTED_DOCUMENT_TYPES}
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
          </SectionCard>

          <SectionCard
            title="Remarks"
            description="Optional internal notes, screening observations, or other details."
          >
            <textarea
              rows={4}
              value={candidateForm.remarks || ""}
              onChange={(event) => updateField("remarks", event.target.value)}
              className={textareaClass()}
              placeholder="Candidate notes, screening observations, or other details."
            />
          </SectionCard>

          <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={Boolean(candidateForm.consent)}
                onChange={(event) =>
                  updateField("consent", event.target.checked)
                }
                className="mt-1 h-4 w-4"
              />

              <span className="text-sm font-medium leading-6 text-[#344054]">
                I agree to terms & conditions provided by the company. By
                providing the candidate phone number, I confirm that the
                candidate agreed to the collection and use of these details for
                recruitment processing.
              </span>
            </label>
          </div>
        </form>

        <div className="border-t border-gray-100 bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetCandidateForm}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5"
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
