import React from "react";
import {
  X,
  Tags,
  History,
  Mail,
  Phone,
  CalendarDays,
  UserPlus,
  RotateCcw,
  Pencil,
  ArrowRight,
  KanbanSquare,
  MapPin,
  GraduationCap,
  ShieldCheck,
  ClipboardList,
  BriefcaseBusiness,
} from "lucide-react";

export const hiringRequirementOptions = [
  {
    id: "HIR-001",
    roleTitle: "Customer Service Representative",
    account: "SIBS Operations",
    jobDescriptionId: "JD-001",
    jobDescription: "JD-001 — Customer Service Representative",
    taOwner: "Maria Reyes",
  },
  {
    id: "HIR-002",
    roleTitle: "QA Specialist",
    account: "SIBS Operations",
    jobDescriptionId: "JD-002",
    jobDescription: "JD-002 — QA Specialist",
    taOwner: "John Dela Cruz",
  },
  {
    id: "HIR-003",
    roleTitle: "RCM Analyst",
    account: "SIBS RCM",
    jobDescriptionId: "JD-003",
    jobDescription: "JD-003 — RCM Analyst",
    taOwner: "Kim Domingo",
  },
  {
    id: "HIR-004",
    roleTitle: "System Developer",
    account: "SIBS IT",
    jobDescriptionId: "JD-004",
    jobDescription: "JD-004 — System Developer",
    taOwner: "Paul Garcia",
  },
];

const roleOptions = [
  "All",
  "CSR",
  "QA",
  "RCM Analyst",
  "IT Support",
  "HR Assistant",
  "System Developer",
  "Accounting",
];

const statusOptions = [
  "All",
  "Silver Pool",
  "Recyclable",
  "Do Not Reprocess",
  "Hired / Active",
  "Withdrawn",
  "Failed",
  "New Applicant",
];

const availabilityOptions = [
  "All",
  "Available",
  "Available in 2 weeks",
  "Available in 30 days",
  "Unavailable",
];

const sourceOptions = [
  "Referral",
  "JobStreet",
  "LinkedIn",
  "Facebook",
  "Walk-in",
  "Public Application",
  "Talent Pool Reactivation",
];

const educationalAttainmentOptions = [
  "Secondary (Grade 11 and Grade 12)",
  "Tertiary (College Level or College Degree Holder)",
  "Tertiary (Graduate School Level or Graduate Holder)",
  "Tertiary (Doctorate Level or Doctorate Holder or equivalent)",
];

function inputClass(extra = "") {
  return `h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function textareaClass(extra = "") {
  return `w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusClass(status) {
  switch (status) {
    case "Silver Pool":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Recyclable":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Do Not Reprocess":
      return "border-red-200 bg-red-50 text-red-700";
    case "Hired / Active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Withdrawn":
      return "border-gray-200 bg-gray-50 text-gray-600";
    case "Failed":
      return "border-red-200 bg-red-50 text-red-700";
    case "New Applicant":
      return "border-purple-200 bg-purple-50 text-purple-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function InfoBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <Icon size={16} className="text-sibs-primary-1" />

        <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
          {label}
        </p>
      </div>

      <p className="whitespace-pre-line break-words text-sm font-bold text-[#344054]">
        {value || "—"}
      </p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <p className="max-w-[60%] break-words text-right text-sm font-bold text-[#344054]">
        {value || "—"}
      </p>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
      {children}
    </label>
  );
}

export function AddCandidateModal({ open, form, setForm, onClose, onSubmit, onReset }) {
  if (!open) return null;

  const age = calculateAge(form.dateOfBirth);
  const isMinor = age !== null && age < 18;

  function updateCheckbox(field, checked) {
    setForm({
      ...form,
      [field]: checked,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Add Candidate
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              New candidates are saved as New Applicant first, then TA can
              update the classification after review.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <FieldLabel>
                      First Name <span className="text-red-500">*</span>
                    </FieldLabel>

                    <input
                      required
                      value={form.firstName}
                      onChange={(e) =>
                        setForm({ ...form, firstName: e.target.value })
                      }
                      placeholder="Juan"
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <FieldLabel>Middle Name</FieldLabel>

                    <input
                      value={form.middleName}
                      onChange={(e) =>
                        setForm({ ...form, middleName: e.target.value })
                      }
                      placeholder="Santos"
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Last Name <span className="text-red-500">*</span>
                    </FieldLabel>

                    <input
                      required
                      value={form.lastName}
                      onChange={(e) =>
                        setForm({ ...form, lastName: e.target.value })
                      }
                      placeholder="Dela Cruz"
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <FieldLabel>Extension</FieldLabel>

                    <input
                      value={form.extension}
                      onChange={(e) =>
                        setForm({ ...form, extension: e.target.value })
                      }
                      placeholder="Jr., Sr., III"
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Date of Birth <span className="text-red-500">*</span>
                    </FieldLabel>

                    <input
                      required
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) =>
                        setForm({ ...form, dateOfBirth: e.target.value })
                      }
                      className={`h-11 w-full rounded-xl border bg-white px-4 text-sm font-semibold outline-none transition focus:ring-4 ${
                        isMinor
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                          : "border-[#E6ECF2] focus:border-sibs-primary-1 focus:ring-sibs-primary-1/10"
                      }`}
                    />

                    {age !== null && (
                      <p
                        className={`mt-2 text-xs font-bold ${
                          isMinor ? "text-red-600" : "text-emerald-600"
                        }`}
                      >
                        Age as of application date: {age}
                        {isMinor ? " — Applicant is below 18 years old." : ""}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <FieldLabel>
                      Physical Address <span className="text-red-500">*</span>
                    </FieldLabel>

                    <input
                      required
                      value={form.physicalAddress}
                      onChange={(e) =>
                        setForm({ ...form, physicalAddress: e.target.value })
                      }
                      placeholder="Complete physical address"
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Email Address <span className="text-red-500">*</span>
                    </FieldLabel>

                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="candidate@email.com"
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Phone Number 1 <span className="text-red-500">*</span>
                    </FieldLabel>

                    <input
                      required
                      value={form.phoneNumber1}
                      onChange={(e) =>
                        setForm({ ...form, phoneNumber1: e.target.value })
                      }
                      placeholder="09xxxxxxxxx"
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <FieldLabel>Phone Number 2</FieldLabel>

                    <input
                      value={form.phoneNumber2}
                      onChange={(e) =>
                        setForm({ ...form, phoneNumber2: e.target.value })
                      }
                      placeholder="Optional"
                      className={inputClass()}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Candidate Classification
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel>
                      Role Capability <span className="text-red-500">*</span>
                    </FieldLabel>

                    <select
                      required
                      value={form.roleCapability}
                      onChange={(e) =>
                        setForm({ ...form, roleCapability: e.target.value })
                      }
                      className={inputClass()}
                    >
                      <option value="">Select role capability</option>
                      {roleOptions
                        .filter((role) => role !== "All")
                        .map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel>
                      Skills / Language <span className="text-red-500">*</span>
                    </FieldLabel>

                    <input
                      required
                      value={form.skillsLanguage}
                      onChange={(e) =>
                        setForm({ ...form, skillsLanguage: e.target.value })
                      }
                      placeholder="English, Chat, RCM"
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <FieldLabel>Status Classification</FieldLabel>

                    <input
                      readOnly
                      value="New Applicant"
                      className="h-11 w-full cursor-not-allowed rounded-xl border border-purple-200 bg-purple-50 px-4 text-sm font-bold text-purple-700 outline-none"
                    />
                  </div>

                  <div>
                    <FieldLabel>Availability</FieldLabel>

                    <select
                      required
                      value={form.availability}
                      onChange={(e) =>
                        setForm({ ...form, availability: e.target.value })
                      }
                      className={inputClass()}
                    >
                      {availabilityOptions
                        .filter((availability) => availability !== "All")
                        .map((availability) => (
                          <option key={availability} value={availability}>
                            {availability}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel>
                      Source <span className="text-red-500">*</span>
                    </FieldLabel>

                    <select
                      required
                      value={form.source}
                      onChange={(e) =>
                        setForm({ ...form, source: e.target.value })
                      }
                      className={inputClass()}
                    >
                      <option value="">Select source</option>
                      {sourceOptions.map((source) => (
                        <option key={source} value={source}>
                          {source}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel>Account Fit</FieldLabel>

                    <input
                      value={form.accountFit}
                      onChange={(e) =>
                        setForm({ ...form, accountFit: e.target.value })
                      }
                      placeholder="SIBS Operations"
                      className={inputClass()}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Educational Attainment
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {educationalAttainmentOptions.map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                    >
                      <input
                        type="radio"
                        name="educationalAttainment"
                        value={item}
                        checked={form.educationalAttainment === item}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            educationalAttainment: e.target.value,
                          })
                        }
                        className="h-4 w-4"
                      />

                      <span className="text-sm font-semibold text-[#344054]">
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Affiliations and Certifications
                </h3>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {[
                    ["cpa", "CPA"],
                    ["lpt", "LPT"],
                    ["masterDegreeHolder", "Master Degree Holder"],
                    ["doctorateHolder", "Doctorate Holder"],
                    ["leanSixSigmaBeltHolder", "Lean Six Sigma Belt Holder"],
                  ].map(([field, label]) => (
                    <label
                      key={field}
                      className="flex items-center gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                    >
                      <input
                        type="checkbox"
                        checked={form[field]}
                        onChange={(e) =>
                          updateCheckbox(field, e.target.checked)
                        }
                        className="h-4 w-4"
                      />

                      <span className="text-sm font-semibold text-[#344054]">
                        {label}
                      </span>
                    </label>
                  ))}

                  <div className="md:col-span-2">
                    <FieldLabel>Other Specify</FieldLabel>

                    <input
                      value={form.otherAffiliation}
                      onChange={(e) =>
                        setForm({ ...form, otherAffiliation: e.target.value })
                      }
                      placeholder="Other affiliation or certification"
                      className={inputClass()}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Training Attended
                </h3>

                <textarea
                  value={form.trainingAttended}
                  onChange={(e) =>
                    setForm({ ...form, trainingAttended: e.target.value })
                  }
                  placeholder="List trainings attended"
                  rows={4}
                  className={textareaClass()}
                />
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Work Readiness Questions
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[
                    ["fullyVaccinated", "Are you fully vaccinated?"],
                    ["comfortableOnSite", "Are you comfortable working on site?"],
                    [
                      "willingGraveyard",
                      "Are you willing to work in graveyard shift?",
                    ],
                    [
                      "remoteWorkAccess",
                      "If this is a remote position, do you have access to a computer, Internet connection, and a private space?",
                    ],
                    [
                      "willingDrugTest",
                      "Are you willing to undertake a drug test as part of this hiring process?",
                    ],
                    [
                      "willingBackgroundCheck",
                      "Are you willing to undergo a background check as part of this hiring process?",
                    ],
                  ].map(([field, label]) => (
                    <div key={field}>
                      <FieldLabel>{label}</FieldLabel>

                      <select
                        value={form[field]}
                        onChange={(e) =>
                          setForm({ ...form, [field]: e.target.value })
                        }
                        className={inputClass()}
                      >
                        <option value="">Select answer</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  ))}

                  <div className="md:col-span-2">
                    <FieldLabel>
                      Are you interested in full-time employment, part-time, or
                      either?
                    </FieldLabel>

                    <select
                      value={form.employmentInterest}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          employmentInterest: e.target.value,
                        })
                      }
                      className={inputClass()}
                    >
                      <option value="">Select employment preference</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Either">Either</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <FieldLabel>
                      Please list three references and their contact information
                    </FieldLabel>

                    <textarea
                      value={form.references}
                      onChange={(e) =>
                        setForm({ ...form, references: e.target.value })
                      }
                      placeholder={
                        "Reference 1: Name / Contact / Relationship\nReference 2: Name / Contact / Relationship\nReference 3: Name / Contact / Relationship"
                      }
                      rows={5}
                      className={textareaClass()}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FieldLabel>Recruiter Remarks</FieldLabel>

                    <textarea
                      value={form.remarks}
                      onChange={(e) =>
                        setForm({ ...form, remarks: e.target.value })
                      }
                      placeholder="Internal TA notes."
                      rows={4}
                      className={textareaClass()}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div
                className={`rounded-xl border p-5 ${
                  isMinor
                    ? "border-red-100 bg-red-50"
                    : "border-blue-100 bg-blue-50"
                }`}
              >
                <h3
                  className={`text-sm font-bold ${
                    isMinor ? "text-red-700" : "text-sibs-primary-1"
                  }`}
                >
                  Age Validation
                </h3>

                <p
                  className={`mt-2 text-sm leading-6 ${
                    isMinor ? "text-red-700/90" : "text-sibs-primary-1/80"
                  }`}
                >
                  {age === null
                    ? "Enter date of birth to calculate age as of application date."
                    : isMinor
                      ? `Applicant is ${age} years old and below 18 years old. The system will prevent saving.`
                      : `Applicant is ${age} years old and meets the 18 years old age validation.`}
                </p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Candidate Entry Rule
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  Every manually added candidate starts as{" "}
                  <span className="font-bold">New Applicant</span>. TA should
                  update the classification only after review.
                </p>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <h3 className="text-sm font-bold text-amber-700">
                  Backend Later
                </h3>

                <p className="mt-2 text-sm leading-6 text-amber-700/90">
                  The backend should also validate age using date of birth and
                  application date, not only frontend validation.
                </p>
              </div>
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5"
            >
              <RotateCcw size={16} />
              Reset
            </button>

            <button
              type="submit"
              onClick={onSubmit}
              disabled={isMinor}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UserPlus size={16} />
              Save Candidate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MoveToPipelineModal({
  open,
  candidate,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  if (!open || !candidate) return null;

  function handleRequirementChange(hiringRequirementId) {
    const selectedRequirement = hiringRequirementOptions.find(
      (item) => item.id === hiringRequirementId
    );

    if (!selectedRequirement) {
      setForm({
        ...form,
        hiringRequirementId: "",
        jobDescriptionId: "",
        roleTitle: "",
        account: "",
        taOwner: "",
      });
      return;
    }

    setForm({
      ...form,
      hiringRequirementId: selectedRequirement.id,
      jobDescriptionId: selectedRequirement.jobDescriptionId,
      roleTitle: selectedRequirement.roleTitle,
      account: selectedRequirement.account,
      taOwner: selectedRequirement.taOwner,
    });
  }

  const selectedRequirement = hiringRequirementOptions.find(
    (item) => item.id === form.hiringRequirementId
  );

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Move Candidate to Pipeline
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              This creates an active candidate application for a specific hiring
              requirement.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-sm font-bold text-sibs-primary-1">
                  {candidate.candidateId} — {candidate.name}
                </p>

                <p className="mt-1 text-xs font-semibold text-sibs-primary-1/70">
                  {candidate.roleCapability} / {candidate.skillsLanguage} /
                  Source: {candidate.source}
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Pipeline Assignment
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <FieldLabel>
                      Hiring Requirement <span className="text-red-500">*</span>
                    </FieldLabel>

                    <select
                      required
                      value={form.hiringRequirementId}
                      onChange={(e) => handleRequirementChange(e.target.value)}
                      className={inputClass()}
                    >
                      <option value="">Select hiring requirement</option>
                      {hiringRequirementOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.id} — {item.roleTitle} / {item.account}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel>Role Title</FieldLabel>

                    <input
                      readOnly
                      value={form.roleTitle}
                      className="h-11 w-full cursor-not-allowed rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-semibold text-gray-500 outline-none"
                    />
                  </div>

                  <div>
                    <FieldLabel>Account</FieldLabel>

                    <input
                      readOnly
                      value={form.account}
                      className="h-11 w-full cursor-not-allowed rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-semibold text-gray-500 outline-none"
                    />
                  </div>

                  <div>
                    <FieldLabel>Job Description</FieldLabel>

                    <input
                      readOnly
                      value={selectedRequirement?.jobDescription || ""}
                      className="h-11 w-full cursor-not-allowed rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-semibold text-gray-500 outline-none"
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      TA Owner <span className="text-red-500">*</span>
                    </FieldLabel>

                    <input
                      required
                      value={form.taOwner}
                      onChange={(e) =>
                        setForm({ ...form, taOwner: e.target.value })
                      }
                      placeholder="Recruiter / TA Owner"
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <FieldLabel>Initial Stage</FieldLabel>

                    <select
                      value={form.initialStage}
                      onChange={(e) =>
                        setForm({ ...form, initialStage: e.target.value })
                      }
                      className={inputClass()}
                    >
                      <option value="Sourced">Sourced</option>
                      <option value="Screened">Screened</option>
                      <option value="Interviewed">Interviewed</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <FieldLabel>Remarks</FieldLabel>

                    <textarea
                      rows={4}
                      value={form.remarks}
                      onChange={(e) =>
                        setForm({ ...form, remarks: e.target.value })
                      }
                      placeholder="Example: Reactivated from New Applicant for urgent CSR backfill."
                      className={textareaClass()}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  What will happen?
                </h3>

                <div className="mt-4">
                  <DetailRow
                    label="Candidate Master"
                    value="Kept as one record"
                  />
                  <DetailRow
                    label="Application Record"
                    value="Created in Pipeline"
                  />
                  <DetailRow label="Initial Stage" value={form.initialStage} />
                  <DetailRow
                    label="Status"
                    value="Active candidate application"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <h3 className="text-sm font-bold text-amber-700">Important</h3>

                <p className="mt-2 text-sm leading-6 text-amber-700/90">
                  This does not duplicate the candidate. It only creates a new
                  application record connected to the selected hiring
                  requirement.
                </p>
              </div>
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              onClick={onSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <ArrowRight size={16} />
              Move to Pipeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CandidateProfileModal({
  open,
  candidate,
  onClose,
  onOpenStatus,
  onOpenMoveToPipeline,
}) {
  if (!open || !candidate) return null;

  const affiliationsText =
    candidate.affiliations && candidate.affiliations.length > 0
      ? candidate.affiliations.join(", ")
      : "—";

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Candidate Profile
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Persistent candidate record and reusable talent profile.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-sibs-primary-1 text-xl font-bold text-white">
                    {candidate.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .slice(0, 2)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-xl font-bold text-[#101828]">
                      {candidate.name}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                      {candidate.candidateId}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                          candidate.status
                        )}`}
                      >
                        {candidate.status}
                      </span>

                      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
                        {candidate.roleCapability}
                      </span>

                      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
                        {candidate.source}
                      </span>

                      {candidate.isPublicSubmission && (
                        <span className="inline-flex rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                          Public Submission
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoBox icon={Mail} label="Email" value={candidate.email} />
                <InfoBox
                  icon={Phone}
                  label="Phone Number 1"
                  value={candidate.phoneNumber1 || candidate.contactNumber}
                />
                <InfoBox
                  icon={Phone}
                  label="Phone Number 2"
                  value={candidate.phoneNumber2}
                />
                <InfoBox
                  icon={CalendarDays}
                  label="Date of Birth / Age"
                  value={`${formatDate(candidate.dateOfBirth)} / ${
                    candidate.ageAsOfApplication || "—"
                  }`}
                />
                <InfoBox
                  icon={MapPin}
                  label="Physical Address"
                  value={candidate.physicalAddress}
                />
                <InfoBox
                  icon={BriefcaseBusiness}
                  label="Role Capability"
                  value={candidate.roleCapability}
                />
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <GraduationCap size={18} className="text-sibs-primary-1" />
                  <h3 className="text-sm font-bold text-[#101828]">
                    Education, Certifications, and Trainings
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InfoBox
                    icon={GraduationCap}
                    label="Educational Attainment"
                    value={candidate.educationalAttainment}
                  />
                  <InfoBox
                    icon={ShieldCheck}
                    label="Affiliations / Certifications"
                    value={affiliationsText}
                  />
                  <InfoBox
                    icon={ClipboardList}
                    label="Training Attended"
                    value={candidate.trainingAttended}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Tags size={18} className="text-sibs-primary-1" />
                  <h3 className="text-sm font-bold text-[#101828]">
                    Skills / Language Tags
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(candidate.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <History size={18} className="text-sibs-primary-1" />
                  <h3 className="text-sm font-bold text-[#101828]">
                    Application History
                  </h3>
                </div>

                <div className="space-y-3">
                  {candidate.applicationHistory &&
                  candidate.applicationHistory.length > 0 ? (
                    candidate.applicationHistory.map((item, index) => (
                      <div
                        key={`${item.role}-${index}`}
                        className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                      >
                        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                          <div>
                            <p className="text-sm font-bold text-[#101828]">
                              {item.role}
                            </p>

                            <p className="text-xs font-semibold text-sibs-tertiary-5">
                              {item.account}
                            </p>
                          </div>

                          <div className="text-left md:text-right">
                            <p className="text-xs font-bold text-sibs-primary-1">
                              {item.outcome}
                            </p>

                            <p className="text-xs text-sibs-tertiary-5">
                              {formatDate(item.date)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#E6ECF2] bg-[#F8FAFC] p-5 text-center text-xs font-bold text-sibs-tertiary-5">
                      No application history yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Talent Pool Details
                </h3>

                <div className="mt-4">
                  <DetailRow label="Account Fit" value={candidate.accountFit} />
                  <DetailRow
                    label="Availability"
                    value={candidate.availability}
                  />
                  <DetailRow label="Source" value={candidate.source} />
                  <DetailRow label="Status" value={candidate.status} />
                  <DetailRow
                    label="Last Activity"
                    value={formatDate(candidate.lastActivity)}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Work Readiness
                </h3>

                <div className="mt-4">
                  <DetailRow
                    label="Fully Vaccinated"
                    value={candidate.fullyVaccinated}
                  />
                  <DetailRow
                    label="Comfortable On Site"
                    value={candidate.comfortableOnSite}
                  />
                  <DetailRow
                    label="Graveyard Shift"
                    value={candidate.willingGraveyard}
                  />
                  <DetailRow
                    label="Employment Interest"
                    value={candidate.employmentInterest}
                  />
                  <DetailRow
                    label="Remote Access"
                    value={candidate.remoteWorkAccess}
                  />
                  <DetailRow
                    label="Drug Test"
                    value={candidate.willingDrugTest}
                  />
                  <DetailRow
                    label="Background Check"
                    value={candidate.willingBackgroundCheck}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#101828]">References</h3>

                <p className="mt-3 whitespace-pre-line rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]">
                  {candidate.references || "No references provided."}
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#101828]">
                  Recruiter Remarks
                </h3>

                <p className="mt-3 whitespace-pre-line rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]">
                  {candidate.remarks || "No remarks provided."}
                </p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Pipeline Rule
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  Move to Pipeline creates an active application for a specific
                  hiring requirement. The candidate master profile remains here.
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#101828]">Actions</h3>

                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => onOpenStatus(candidate)}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5"
                  >
                    <Pencil size={16} />
                    Update Status
                  </button>

                  {candidate.status !== "Do Not Reprocess" ? (
                    <button
                      type="button"
                      onClick={() => onOpenMoveToPipeline(candidate)}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
                    >
                      <KanbanSquare size={16} />
                      Move to Pipeline
                    </button>
                  ) : (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                      <p className="text-xs font-bold text-red-700">
                        This candidate is marked Do Not Reprocess and cannot be
                        moved to pipeline.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-sibs-primary-1 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UpdateStatusModal({
  open,
  candidate,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  if (!open || !candidate) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Update Candidate Status
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Change candidate classification after TA review.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-bold text-sibs-primary-1">
              {candidate.candidateId} — {candidate.name}
            </p>

            <p className="mt-1 text-xs font-semibold text-sibs-primary-1/70">
              Current Status: {candidate.status}
            </p>
          </div>

          <div className="mt-5">
            <FieldLabel>Status</FieldLabel>

            <select
              required
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className={inputClass()}
            >
              {statusOptions
                .filter((status) => status !== "All")
                .map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
            </select>
          </div>

          <div className="mt-5">
            <FieldLabel>Status Remarks</FieldLabel>

            <textarea
              rows={4}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Explain why this status was changed."
              className={textareaClass()}
            />
          </div>

          <div className="mt-6 flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <Pencil size={16} />
              Save Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

