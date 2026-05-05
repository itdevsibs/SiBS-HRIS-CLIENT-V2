import React, { useState } from "react";
import {
  Send,
  UserPlus,
  CheckCircle2,
  RotateCcw,
  BriefcaseBusiness,
  Mail,
  Phone,
  GraduationCap,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";

const PUBLIC_SUBMISSIONS_KEY = "ta_public_candidate_submissions";

const roleOptions = [
  "CSR",
  "QA",
  "RCM Analyst",
  "IT Support",
  "HR Assistant",
  "System Developer",
  "Accounting",
];

const availabilityOptions = [
  "Available",
  "Available in 2 weeks",
  "Available in 30 days",
  "Unavailable",
];

const educationalAttainmentOptions = [
  "Secondary (Grade 11 and Grade 12)",
  "Tertiary (College Level or College Degree Holder)",
  "Tertiary (Graduate School Level or Graduate Holder)",
  "Tertiary (Doctorate Level or Doctorate Holder or equivalent)",
];

const emptyPublicForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  extension: "",

  dateOfBirth: "",
  physicalAddress: "",
  email: "",
  phoneNumber1: "",
  phoneNumber2: "",

  roleCapability: "",
  skillsLanguage: "",
  availability: "Available",

  educationalAttainment: "",

  cpa: false,
  lpt: false,
  masterDegreeHolder: false,
  doctorateHolder: false,
  leanSixSigmaBeltHolder: false,
  otherAffiliation: "",

  trainingAttended: "",

  fullyVaccinated: "",
  comfortableOnSite: "",
  willingGraveyard: "",
  employmentInterest: "",
  remoteWorkAccess: "",
  willingDrugTest: "",
  willingBackgroundCheck: "",
  references: "",

  consent: false,
};

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function generatePublicCandidateId() {
  return `PUB-${Date.now()}`;
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

function buildFullName(candidate) {
  return [
    candidate.firstName,
    candidate.middleName,
    candidate.lastName,
    candidate.extension,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function readLocalStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalStorage(key, value) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // temporary frontend-only storage
  }
}

function FieldLabel({ children }) {
  return (
    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-400">
      {children}
    </label>
  );
}

function InfoCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-[var(--sibs-primary-1)]/10 p-3 text-sibs-primary-1">
          <Icon size={20} />
        </div>

        <div>
          <h3 className="text-sm font-extrabold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function PublicTalentPoolApplicationPage() {
  const [form, setForm] = useState(emptyPublicForm);
  const [submittedRecord, setSubmittedRecord] = useState(null);

  const age = calculateAge(form.dateOfBirth);
  const isMinor = age !== null && age < 18;

  function handleReset() {
    setForm(emptyPublicForm);
    setSubmittedRecord(null);
  }

  function updateCheckbox(field, checked) {
    setForm({
      ...form,
      [field]: checked,
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (isMinor) {
      alert("Applicant is below 18 years old as of date of application.");
      return;
    }

    if (!form.consent) {
      alert("Please confirm the data privacy consent before submitting.");
      return;
    }

    const today = getTodayDate();

    const affiliations = [
      form.cpa ? "CPA" : null,
      form.lpt ? "LPT" : null,
      form.masterDegreeHolder ? "Master Degree Holder" : null,
      form.doctorateHolder ? "Doctorate Holder" : null,
      form.leanSixSigmaBeltHolder ? "Lean Six Sigma Belt Holder" : null,
      form.otherAffiliation?.trim() || null,
    ].filter(Boolean);

    const newSubmission = {
      id: Date.now(),
      candidateId: generatePublicCandidateId(),

      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
      lastName: form.lastName.trim(),
      extension: form.extension.trim(),
      name: buildFullName(form),

      dateOfBirth: form.dateOfBirth,
      ageAsOfApplication: age,
      physicalAddress: form.physicalAddress.trim(),

      email: form.email.trim(),
      contactNumber: form.phoneNumber1.trim(),
      phoneNumber1: form.phoneNumber1.trim(),
      phoneNumber2: form.phoneNumber2.trim(),

      roleCapability: form.roleCapability,
      skillsLanguage: form.skillsLanguage.trim(),
      availability: form.availability,

      educationalAttainment: form.educationalAttainment,

      affiliations,
      cpa: form.cpa,
      lpt: form.lpt,
      masterDegreeHolder: form.masterDegreeHolder,
      doctorateHolder: form.doctorateHolder,
      leanSixSigmaBeltHolder: form.leanSixSigmaBeltHolder,
      otherAffiliation: form.otherAffiliation.trim(),

      trainingAttended: form.trainingAttended.trim(),

      fullyVaccinated: form.fullyVaccinated,
      comfortableOnSite: form.comfortableOnSite,
      willingGraveyard: form.willingGraveyard,
      employmentInterest: form.employmentInterest,
      remoteWorkAccess: form.remoteWorkAccess,
      willingDrugTest: form.willingDrugTest,
      willingBackgroundCheck: form.willingBackgroundCheck,
      references: form.references.trim(),

      source: "Public Application",
      status: "New Applicant",
      submittedAt: today,
      isPublicSubmission: true,
    };

    const existing = readLocalStorage(PUBLIC_SUBMISSIONS_KEY, []);
    const updated = [newSubmission, ...existing];

    writeLocalStorage(PUBLIC_SUBMISSIONS_KEY, updated);

    setSubmittedRecord(newSubmission);
    setForm(emptyPublicForm);

    /*
      BACKEND LATER:

      POST /api/public/recruitment/candidates

      Backend should set:
      source = Public Application
      status = New Applicant
      is_public_submission = true
    */
  }

  return (
    <div className="min-h-screen bg-[var(--sibs-tertiary-10)] px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="bg-[var(--sibs-primary-1)] px-6 py-8 text-white">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wide">
                  <UserPlus size={15} />
                  Candidate Talent Pool
                </div>

                <h1 className="mt-4 text-3xl font-extrabold">
                  Submit Your Candidate Profile
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
                  Complete this form so our Talent Acquisition team can review
                  your profile for current and future hiring opportunities.
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-white/70">
                  Application Type
                </p>
                <p className="mt-1 text-lg font-extrabold">
                  Public Application
                </p>
              </div>
            </div>
          </div>
        </section>

        {submittedRecord && (
          <section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <CheckCircle2 size={22} />
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-emerald-700">
                  Application submitted successfully
                </h2>
                <p className="mt-1 text-sm leading-6 text-emerald-700/80">
                  Your temporary tracking ID is{" "}
                  <span className="font-extrabold">
                    {submittedRecord.candidateId}
                  </span>
                  . Our recruitment team will review your profile.
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-3xl bg-white p-6 shadow-sm"
          >
            <div>
              <h2 className="text-xl font-extrabold text-sibs-primary-1">
                Candidate Information
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Fields marked with * are required.
              </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-extrabold text-gray-900">
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
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
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
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
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
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
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
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
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
                        : "border-gray-200 focus:border-[var(--sibs-primary-1)] focus:ring-[var(--sibs-primary-1)]/10"
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
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
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
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
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
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
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
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-extrabold text-gray-900">
                Role and Availability
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
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                  >
                    <option value="">Select role capability</option>
                    {roleOptions.map((role) => (
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
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                  />
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>Availability</FieldLabel>
                  <select
                    value={form.availability}
                    onChange={(e) =>
                      setForm({ ...form, availability: e.target.value })
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                  >
                    {availabilityOptions.map((availability) => (
                      <option key={availability} value={availability}>
                        {availability}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <GraduationCap size={18} className="text-sibs-primary-1" />
                <h3 className="text-sm font-extrabold text-gray-900">
                  Educational Attainment
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {educationalAttainmentOptions.map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4"
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
                    <span className="text-sm font-semibold text-gray-700">
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck size={18} className="text-sibs-primary-1" />
                <h3 className="text-sm font-extrabold text-gray-900">
                  Affiliations and Certifications
                </h3>
              </div>

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
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <input
                      type="checkbox"
                      checked={form[field]}
                      onChange={(e) => updateCheckbox(field, e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-semibold text-gray-700">
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
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <ClipboardList size={18} className="text-sibs-primary-1" />
                <h3 className="text-sm font-extrabold text-gray-900">
                  Training Attended
                </h3>
              </div>

              <textarea
                value={form.trainingAttended}
                onChange={(e) =>
                  setForm({ ...form, trainingAttended: e.target.value })
                }
                placeholder="List trainings attended"
                rows={4}
                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              />
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-extrabold text-gray-900">
                Work Readiness Questions
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  ["fullyVaccinated", "Are you fully vaccinated?"],
                  [
                    "comfortableOnSite",
                    "Are you comfortable working on site?",
                  ],
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
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
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
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
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
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) =>
                    setForm({ ...form, consent: e.target.checked })
                  }
                  className="mt-1 h-4 w-4"
                />
                <span className="text-sm leading-6 text-gray-600">
                  I confirm that the information I provided is true and I
                  consent to having my candidate profile stored for current and
                  future recruitment opportunities.
                </span>
              </label>
            </div>

            <div className="flex flex-col justify-end gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5"
              >
                <RotateCcw size={16} />
                Reset
              </button>

              <button
                type="submit"
                disabled={isMinor}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
                Submit Profile
              </button>
            </div>
          </form>

          <div className="space-y-5">
            <div
              className={`rounded-3xl border p-5 ${
                isMinor
                  ? "border-red-100 bg-red-50"
                  : "border-blue-100 bg-blue-50"
              }`}
            >
              <h3
                className={`text-sm font-extrabold ${
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
                    ? `Applicant is ${age} years old and below 18 years old. The system will prevent submission.`
                    : `Applicant is ${age} years old and meets the 18 years old age validation.`}
              </p>
            </div>

            <InfoCard
              icon={BriefcaseBusiness}
              title="Reusable Candidate Profile"
              description="Your profile may be matched with current or future openings based on role capability and skills."
            />

            <InfoCard
              icon={Mail}
              title="Recruitment Contact"
              description="The Talent Acquisition team may contact you through the email or phone number you provide."
            />

            <InfoCard
              icon={Phone}
              title="Talent Pool"
              description="Submitting this form does not guarantee immediate hiring, but it allows your profile to be considered for future requirements."
            />
          </div>
        </section>
      </div>
    </div>
  );
}