import React, { useEffect, useMemo, useState } from "react";
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
  Mic,
  UploadCloud,
  Users,
  MapPin,
} from "lucide-react";

const PUBLIC_SUBMISSIONS_KEY = "ta_public_candidate_submissions";

const hearAboutUsOptions = [
  "Employee Referral Program",
  "Print Ads (Billboards, Brochures, Flyers, Posters)",
  "Social Media Pages",
  "Social Media Ads",
  "Online Job Portals",
  "Walk In",
  "Word of Mouth",
  "Institutional Partnership",
  "External Referral Listings",
  "Job Fairs",
  "Employee Retention Program",
  "Others",
];

const openPositionOptions = [
  "CSR",
  "QA",
  "RCM Analyst",
  "IT Support",
  "HR Assistant",
  "System Developer",
  "Accounting",
];

const locationOptions = ["Davao Site", "Tagum Site", "Mabini Site"];

const workExperienceOptions = [
  "Has work Experience (at least 6 months relevant work experience)",
  "No work Experience",
];

const lengthOfExperienceOptions = [
  "6 months to less than 1 year",
  "1 year to less than 2 years",
  "2 years to less than 3 years",
  "3 years to less than 5 years",
  "5 years and above",
];

const educationalAttainmentOptions = [
  "High School Graduate",
  "Senior High School Graduate",
  "College Level",
  "College Graduate",
  "Vocational / Technical Graduate",
  "Graduate School Level",
  "Master's Degree Holder",
  "Doctorate Degree Holder",
];

const affiliationCertificationOptions = [
  "CPA",
  "LPT",
  "Master Degree Holder",
  "Doctorate Holder",
  "Lean Six Sigma Belt Holder",
  "NC II",
  "BOSH / COSH",
  "First Aid Certification",
  "Other",
];

const yesNoOptions = ["Yes", "No"];

const employmentInterestOptions = [
  "Full Time",
  "Part Time",
  "Full Time or Part Time",
];

const acceptedDocumentTypes =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif";

function createEmptyExperience() {
  return {
    industryRelevantExperience: "",
    lengthOfWorkExperience: "",
    years: "",
    role: "",
    company: "",
    monthlyCompensation: "",
    reasonForLeaving: "",
  };
}

const emptyPublicForm = {
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
  phone1: "",
  phone2: "",

  industryRelevantExperience: "",
  lengthOfWorkExperience: "",
  years: "",
  role: "",
  company: "",
  monthlyCompensation: "",
  reasonForLeaving: "",
  hasOtherExperience: "",
  otherExperiences: [],

  highestEducationalAttainment: "",
  affiliationsAndCertifications: [],
  trainingAttended: "",

  fullyVaccinated: "",
  comfortableOnSite: "",
  willingGraveyard: "",
  employmentInterest: "",
  remoteWorkAccess: "",
  willingDrugTest: "",
  willingBackgroundCheck: "",

  reference1Name: "",
  reference1Phone: "",
  reference2Name: "",
  reference2Phone: "",
  reference3Name: "",
  reference3Phone: "",

  audioFile: null,
  attachmentFile: null,
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
    candidate.suffix,
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

function inputClass(extra = "") {
  return `h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10 ${extra}`;
}

function textareaClass(extra = "") {
  return `w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10 ${extra}`;
}

function FieldLabel({ children }) {
  return (
    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-400">
      {children}
    </label>
  );
}

function RequiredMark() {
  return <span className="text-red-500">*</span>;
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

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        {Icon && (
          <div className="rounded-2xl bg-[var(--sibs-primary-1)]/10 p-3 text-sibs-primary-1">
            <Icon size={18} />
          </div>
        )}

        <div>
          <h3 className="text-sm font-extrabold text-gray-900">{title}</h3>
          {description && (
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}

function MultiSelectCheckboxGroup({ options, values, onChange }) {
  function toggleValue(option) {
    if (values.includes(option)) {
      onChange(values.filter((item) => item !== option));
      return;
    }

    onChange([...values, option]);
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {options.map((option) => (
        <label
          key={option}
          className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4"
        >
          <input
            type="checkbox"
            checked={values.includes(option)}
            onChange={() => toggleValue(option)}
            className="h-4 w-4"
          />
          <span className="text-sm font-semibold text-gray-700">{option}</span>
        </label>
      ))}
    </div>
  );
}

function YesNoSelect({ value, onChange, required = true }) {
  return (
    <select
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass()}
    >
      <option value="">Select answer</option>
      {yesNoOptions.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function ExperienceFields({
  experience,
  onChange,
  title = "Industry or Relevant Experience",
  showRemove = false,
  onRemove,
}) {
  return (
    <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="text-sm font-extrabold text-sibs-primary-1">
          {title}
        </h4>

        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-red-100 bg-white px-4 text-xs font-bold text-red-600 transition hover:bg-red-50"
          >
            Remove
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <FieldLabel>Industry or Relevant Experience</FieldLabel>
          <input
            value={experience.industryRelevantExperience}
            onChange={(e) =>
              onChange({
                ...experience,
                industryRelevantExperience: e.target.value,
              })
            }
            placeholder="Example: BPO, Healthcare, RCM, Finance"
            className={inputClass()}
          />
        </div>

        <div>
          <FieldLabel>
            Length of work experience <RequiredMark />
          </FieldLabel>
          <select
            required
            value={experience.lengthOfWorkExperience}
            onChange={(e) =>
              onChange({
                ...experience,
                lengthOfWorkExperience: e.target.value,
              })
            }
            className={inputClass()}
          >
            <option value="">Select length</option>
            {lengthOfExperienceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>
            Years <RequiredMark />
          </FieldLabel>
          <input
            required
            type="number"
            min="0"
            step="0.1"
            value={experience.years}
            onChange={(e) =>
              onChange({ ...experience, years: e.target.value })
            }
            placeholder="Example: 2"
            className={inputClass()}
          />
        </div>

        <div>
          <FieldLabel>
            Role <RequiredMark />
          </FieldLabel>
          <input
            required
            value={experience.role}
            onChange={(e) =>
              onChange({ ...experience, role: e.target.value })
            }
            placeholder="Previous role"
            className={inputClass()}
          />
        </div>

        <div>
          <FieldLabel>
            Company <RequiredMark />
          </FieldLabel>
          <input
            required
            value={experience.company}
            onChange={(e) =>
              onChange({ ...experience, company: e.target.value })
            }
            placeholder="Previous company"
            className={inputClass()}
          />
        </div>

        <div>
          <FieldLabel>
            Monthly Compensation <RequiredMark />
          </FieldLabel>
          <input
            required
            type="number"
            min="0"
            value={experience.monthlyCompensation}
            onChange={(e) =>
              onChange({
                ...experience,
                monthlyCompensation: e.target.value,
              })
            }
            placeholder="Example: 20000"
            className={inputClass()}
          />
        </div>

        <div>
          <FieldLabel>
            Reason for leaving <RequiredMark />
          </FieldLabel>
          <input
            required
            value={experience.reasonForLeaving}
            onChange={(e) =>
              onChange({
                ...experience,
                reasonForLeaving: e.target.value,
              })
            }
            placeholder="Reason for leaving"
            className={inputClass()}
          />
        </div>
      </div>
    </div>
  );
}

export default function PublicTalentPoolApplicationPage() {
  useEffect(() => {
    const styleId = "public-talent-pool-hide-sidebar-style";

    document.body.classList.add("public-talent-pool-form-page");
    document.documentElement.classList.add("public-talent-pool-form-page");

    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        body.public-talent-pool-form-page aside,
        body.public-talent-pool-form-page .sidebar,
        body.public-talent-pool-form-page [data-sidebar],
        body.public-talent-pool-form-page nav.sidebar,
        body.public-talent-pool-form-page .app-sidebar,
        body.public-talent-pool-form-page .main-sidebar {
          display: none !important;
          width: 0 !important;
          min-width: 0 !important;
          max-width: 0 !important;
        }

        body.public-talent-pool-form-page main,
        body.public-talent-pool-form-page .main-content,
        body.public-talent-pool-form-page .content-wrapper,
        body.public-talent-pool-form-page .page-content,
        body.public-talent-pool-form-page #root > div {
          width: 100% !important;
          max-width: 100% !important;
          margin-left: 0 !important;
          padding-left: 0 !important;
        }

        body.public-talent-pool-form-page {
          overflow-x: hidden !important;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      document.body.classList.remove("public-talent-pool-form-page");
      document.documentElement.classList.remove("public-talent-pool-form-page");
    };
  }, []);

  const [form, setForm] = useState(emptyPublicForm);
  const [submittedRecord, setSubmittedRecord] = useState(null);

  const age = calculateAge(form.dateOfBirth);
  const isMinor = age !== null && age < 18;

  const hasRelevantExperience =
    form.workExperience ===
    "Has work Experience (at least 6 months relevant work experience)";

  const canSubmit = useMemo(() => {
    if (isMinor) return false;
    return true;
  }, [isMinor]);

  function handleReset() {
    setForm(emptyPublicForm);
    setSubmittedRecord(null);
  }

  function handleFileChange(field, file) {
    setForm({
      ...form,
      [field]: file || null,
    });
  }

  function updatePrimaryExperience(nextExperience) {
    setForm({
      ...form,
      industryRelevantExperience: nextExperience.industryRelevantExperience,
      lengthOfWorkExperience: nextExperience.lengthOfWorkExperience,
      years: nextExperience.years,
      role: nextExperience.role,
      company: nextExperience.company,
      monthlyCompensation: nextExperience.monthlyCompensation,
      reasonForLeaving: nextExperience.reasonForLeaving,
    });
  }

  function updateOtherExperience(index, nextExperience) {
    setForm({
      ...form,
      otherExperiences: form.otherExperiences.map((experience, itemIndex) =>
        itemIndex === index ? nextExperience : experience
      ),
    });
  }

  function addOtherExperience() {
    setForm({
      ...form,
      hasOtherExperience: "Yes",
      otherExperiences: [...form.otherExperiences, createEmptyExperience()],
    });
  }

  function removeOtherExperience(index) {
    const nextOtherExperiences = form.otherExperiences.filter(
      (_, itemIndex) => itemIndex !== index
    );

    setForm({
      ...form,
      otherExperiences: nextOtherExperiences,
      hasOtherExperience:
        nextOtherExperiences.length > 0 ? form.hasOtherExperience : "No",
    });
  }

  function handleOtherExperienceAnswer(value) {
    setForm({
      ...form,
      hasOtherExperience: value,
      otherExperiences:
        value === "Yes"
          ? form.otherExperiences.length > 0
            ? form.otherExperiences
            : [createEmptyExperience()]
          : [],
    });
  }

  function validateBeforeSubmit() {
    if (form.hearAboutUs.length === 0) {
      alert("Please select at least one source under How did you first hear about us?");
      return false;
    }

    if (isMinor) {
      alert("Applicant is below 18 years old as of date of application.");
      return false;
    }

    if (hasRelevantExperience) {
      const requiredExperienceFields = [
        [form.lengthOfWorkExperience, "Length of work experience"],
        [form.years, "Years"],
        [form.role, "Role"],
        [form.company, "Company"],
        [form.monthlyCompensation, "Monthly Compensation"],
        [form.reasonForLeaving, "Reason for leaving"],
        [form.highestEducationalAttainment, "Highest Educational Attainment"],
      ];

      const missingField = requiredExperienceFields.find(
        ([value]) => !String(value || "").trim()
      );

      if (missingField) {
        alert(`${missingField[1]} is required.`);
        return false;
      }

      if (form.hasOtherExperience === "Yes") {
        if (!form.otherExperiences.length) {
          alert("Please add your other work experience details.");
          return false;
        }

        const requiredOtherExperienceFields = [
          "lengthOfWorkExperience",
          "years",
          "role",
          "company",
          "monthlyCompensation",
          "reasonForLeaving",
        ];

        const hasIncompleteOtherExperience = form.otherExperiences.some(
          (experience) =>
            requiredOtherExperienceFields.some(
              (field) => !String(experience[field] || "").trim()
            )
        );

        if (hasIncompleteOtherExperience) {
          alert("Please complete all required fields in your other work experience.");
          return false;
        }
      }
    }

    if (!form.audioFile) {
      alert("Please upload a single audio file for the interview questions.");
      return false;
    }

    if (!form.attachmentFile) {
      alert("Please upload your supporting document or file.");
      return false;
    }

    if (!form.consent) {
      alert("Please agree to the terms and conditions before submitting.");
      return false;
    }

    return true;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!validateBeforeSubmit()) return;

    const today = getTodayDate();

    const newSubmission = {
      id: Date.now(),
      candidateId: generatePublicCandidateId(),

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
      name: buildFullName(form),
      dateOfBirth: form.dateOfBirth,
      ageAsOfApplication: age,
      email: form.email.trim(),
      physicalAddress: form.physicalAddress.trim(),
      workExperience: form.workExperience,
      contactNumber: form.phone1.trim(),
      phone1: form.phone1.trim(),
      phone2: form.phone2.trim(),

      industryRelevantExperience: form.industryRelevantExperience.trim(),
      lengthOfWorkExperience: hasRelevantExperience
        ? form.lengthOfWorkExperience
        : "",
      years: hasRelevantExperience ? form.years.trim() : "",
      role: hasRelevantExperience ? form.role.trim() : "",
      company: hasRelevantExperience ? form.company.trim() : "",
      monthlyCompensation: hasRelevantExperience
        ? form.monthlyCompensation.trim()
        : "",
      reasonForLeaving: hasRelevantExperience
        ? form.reasonForLeaving.trim()
        : "",
      hasOtherExperience: hasRelevantExperience ? form.hasOtherExperience : "",
      workExperiences: hasRelevantExperience
        ? [
            {
              industryRelevantExperience:
                form.industryRelevantExperience.trim(),
              lengthOfWorkExperience: form.lengthOfWorkExperience,
              years: form.years.trim(),
              role: form.role.trim(),
              company: form.company.trim(),
              monthlyCompensation: form.monthlyCompensation.trim(),
              reasonForLeaving: form.reasonForLeaving.trim(),
            },
            ...(form.hasOtherExperience === "Yes"
              ? form.otherExperiences.map((experience) => ({
                  industryRelevantExperience:
                    experience.industryRelevantExperience.trim(),
                  lengthOfWorkExperience:
                    experience.lengthOfWorkExperience,
                  years: experience.years.trim(),
                  role: experience.role.trim(),
                  company: experience.company.trim(),
                  monthlyCompensation:
                    experience.monthlyCompensation.trim(),
                  reasonForLeaving:
                    experience.reasonForLeaving.trim(),
                }))
              : []),
          ]
        : [],
      otherExperiences: hasRelevantExperience && form.hasOtherExperience === "Yes"
        ? form.otherExperiences.map((experience) => ({
            industryRelevantExperience:
              experience.industryRelevantExperience.trim(),
            lengthOfWorkExperience: experience.lengthOfWorkExperience,
            years: experience.years.trim(),
            role: experience.role.trim(),
            company: experience.company.trim(),
            monthlyCompensation: experience.monthlyCompensation.trim(),
            reasonForLeaving: experience.reasonForLeaving.trim(),
          }))
        : [],

      highestEducationalAttainment: form.highestEducationalAttainment,
      affiliationsAndCertifications: form.affiliationsAndCertifications,
      trainingAttended: form.trainingAttended.trim(),

      fullyVaccinated: form.fullyVaccinated,
      comfortableOnSite: form.comfortableOnSite,
      willingGraveyard: form.willingGraveyard,
      employmentInterest: form.employmentInterest,
      remoteWorkAccess: form.remoteWorkAccess,
      willingDrugTest: form.willingDrugTest,
      willingBackgroundCheck: form.willingBackgroundCheck,

      references: [
        {
          name: form.reference1Name.trim(),
          phone: form.reference1Phone.trim(),
        },
        {
          name: form.reference2Name.trim(),
          phone: form.reference2Phone.trim(),
        },
        {
          name: form.reference3Name.trim(),
          phone: form.reference3Phone.trim(),
        },
      ],

      audioFileName: form.audioFile?.name || "",
      audioFileType: form.audioFile?.type || "",
      audioFileSize: form.audioFile?.size || 0,
      attachmentFileName: form.attachmentFile?.name || "",
      attachmentFileType: form.attachmentFile?.type || "",
      attachmentFileSize: form.attachmentFile?.size || 0,

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

      Use FormData because this form has file uploads.

      POST /api/public/recruitment/candidates

      Backend should store:
      - candidate profile fields
      - audio file
      - attachment file
      - source = Public Application
      - status = New Applicant
      - is_public_submission = true
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
                  Public Application Form
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
                  Complete your candidate profile for current and future SiBS
                  openings. Fields marked with * are required.
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-white/70">
                  Application Type
                </p>
                <p className="mt-1 text-lg font-extrabold">
                  Public Talent Pool
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
                  . Our Talent Acquisition team will review your profile.
                </p>
              </div>
            </div>
          </section>
        )}

        <section>
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-3xl bg-white p-6 shadow-sm"
          >
            <div>
              <h2 className="text-xl font-extrabold text-sibs-primary-1">
                Candidate Information
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Please complete the required details before submitting.
              </p>
            </div>

            <SectionCard
              icon={BriefcaseBusiness}
              title="Application Source and Position"
              description="Tell us where you learned about SiBS and what position you are applying for."
            >
              <div className="space-y-4">
                <div>
                  <FieldLabel>
                    How did you first hear about us? <RequiredMark />
                  </FieldLabel>
                  <MultiSelectCheckboxGroup
                    options={hearAboutUsOptions}
                    values={form.hearAboutUs}
                    onChange={(values) =>
                      setForm({ ...form, hearAboutUs: values })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel>
                      Check our open positions <RequiredMark />
                    </FieldLabel>
                    <select
                      required
                      value={form.openPosition}
                      onChange={(e) =>
                        setForm({ ...form, openPosition: e.target.value })
                      }
                      className={inputClass()}
                    >
                      <option value="">Select open position</option>
                      {openPositionOptions.map((position) => (
                        <option key={position} value={position}>
                          {position}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel>Nickname</FieldLabel>
                    <input
                      value={form.nickname}
                      onChange={(e) =>
                        setForm({ ...form, nickname: e.target.value })
                      }
                      placeholder="Preferred nickname"
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Which location are you applying for? <RequiredMark />
                    </FieldLabel>
                    <select
                      required
                      value={form.applyingLocation}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          applyingLocation: e.target.value,
                        })
                      }
                      className={inputClass()}
                    >
                      <option value="">Select location</option>
                      {locationOptions.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel>
                      Who referred you to us? <RequiredMark />
                    </FieldLabel>
                    <input
                      required
                      value={form.referredBy}
                      onChange={(e) =>
                        setForm({ ...form, referredBy: e.target.value })
                      }
                      placeholder="Referrer name or N/A"
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Employee ID <RequiredMark />
                    </FieldLabel>
                    <input
                      required
                      value={form.employeeId}
                      onChange={(e) =>
                        setForm({ ...form, employeeId: e.target.value })
                      }
                      placeholder="Referrer employee ID or N/A"
                      className={inputClass()}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={UserPlus}
              title="Personal Information"
              description="Enter your legal name, contact details, and address."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <FieldLabel>
                    First Name <RequiredMark />
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
                  <FieldLabel>
                    Last Name <RequiredMark />
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
                  <FieldLabel>Suffix</FieldLabel>
                  <input
                    value={form.suffix}
                    onChange={(e) =>
                      setForm({ ...form, suffix: e.target.value })
                    }
                    placeholder="Jr., Sr., III"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>
                    Date of Birth <RequiredMark />
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

                <div>
                  <FieldLabel>
                    Email <RequiredMark />
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
                  <FieldLabel>Phone 1</FieldLabel>
                  <input
                    value={form.phone1}
                    onChange={(e) =>
                      setForm({ ...form, phone1: e.target.value })
                    }
                    placeholder="09xxxxxxxxx"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>Phone 2</FieldLabel>
                  <input
                    value={form.phone2}
                    onChange={(e) =>
                      setForm({ ...form, phone2: e.target.value })
                    }
                    placeholder="Optional"
                    className={inputClass()}
                  />
                </div>

                <div className="md:col-span-4">
                  <FieldLabel>
                    Physical Address <RequiredMark />
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
              </div>
            </SectionCard>

            <SectionCard
              icon={BriefcaseBusiness}
              title="Work Experience"
              description="Additional work experience fields will appear when you select Has work Experience."
            >
              <div className="space-y-4">
                <div>
                  <FieldLabel>
                    Work experience <RequiredMark />
                  </FieldLabel>
                  <select
                    required
                    value={form.workExperience}
                    onChange={(e) =>
                      setForm({ ...form, workExperience: e.target.value })
                    }
                    className={inputClass()}
                  >
                    <option value="">Select work experience</option>
                    {workExperienceOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {hasRelevantExperience && (
                  <div className="space-y-4">
                    <ExperienceFields
                      title="Industry or Relevant Experience"
                      experience={{
                        industryRelevantExperience:
                          form.industryRelevantExperience,
                        lengthOfWorkExperience:
                          form.lengthOfWorkExperience,
                        years: form.years,
                        role: form.role,
                        company: form.company,
                        monthlyCompensation: form.monthlyCompensation,
                        reasonForLeaving: form.reasonForLeaving,
                      }}
                      onChange={updatePrimaryExperience}
                    />

                    <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px] md:items-end">
                        <div>
                          <FieldLabel>Do you have other experience?</FieldLabel>
                          <YesNoSelect
                            required={false}
                            value={form.hasOtherExperience}
                            onChange={handleOtherExperienceAnswer}
                          />
                        </div>

                        {form.hasOtherExperience === "Yes" && (
                          <button
                            type="button"
                            onClick={addOtherExperience}
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--sibs-primary-1)] px-4 text-sm font-bold text-white transition hover:opacity-90"
                          >
                            Add Other Experience
                          </button>
                        )}
                      </div>
                    </div>

                    {form.hasOtherExperience === "Yes" &&
                      form.otherExperiences.map((experience, index) => (
                        <ExperienceFields
                          key={`other-experience-${index}`}
                          title={`Other Experience ${index + 1}`}
                          experience={experience}
                          onChange={(nextExperience) =>
                            updateOtherExperience(index, nextExperience)
                          }
                          showRemove
                          onRemove={() => removeOtherExperience(index)}
                        />
                      ))}
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
                <div>
                  <FieldLabel>
                    Highest Educational Attainment <RequiredMark />
                  </FieldLabel>
                  <select
                    required
                    value={form.highestEducationalAttainment}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        highestEducationalAttainment: e.target.value,
                      })
                    }
                    className={inputClass()}
                  >
                    <option value="">Select educational attainment</option>
                    {educationalAttainmentOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>Affiliations and Certifications</FieldLabel>
                  <MultiSelectCheckboxGroup
                    options={affiliationCertificationOptions}
                    values={form.affiliationsAndCertifications}
                    onChange={(values) =>
                      setForm({
                        ...form,
                        affiliationsAndCertifications: values,
                      })
                    }
                  />
                </div>

                <div>
                  <FieldLabel>Training Attended</FieldLabel>
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
              </div>
            </SectionCard>

            <SectionCard
              icon={ShieldCheck}
              title="Work Readiness Questions"
              description="These questions help Talent Acquisition review work setup and compliance readiness."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>
                    Are you fully vaccinated? <RequiredMark />
                  </FieldLabel>
                  <YesNoSelect
                    value={form.fullyVaccinated}
                    onChange={(value) =>
                      setForm({ ...form, fullyVaccinated: value })
                    }
                  />
                </div>

                <div>
                  <FieldLabel>
                    Are you comfortable working on site? <RequiredMark />
                  </FieldLabel>
                  <YesNoSelect
                    value={form.comfortableOnSite}
                    onChange={(value) =>
                      setForm({ ...form, comfortableOnSite: value })
                    }
                  />
                </div>

                <div>
                  <FieldLabel>
                    Are you willing to work in graveyard shift? <RequiredMark />
                  </FieldLabel>
                  <YesNoSelect
                    value={form.willingGraveyard}
                    onChange={(value) =>
                      setForm({ ...form, willingGraveyard: value })
                    }
                  />
                </div>

                <div>
                  <FieldLabel>
                    Full-time, part-time, or either? <RequiredMark />
                  </FieldLabel>
                  <select
                    required
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
                    {employmentInterestOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>
                    If this is a remote position, do you have access to a
                    computer, Internet connection, and a private space to work
                    remotely? <RequiredMark />
                  </FieldLabel>
                  <YesNoSelect
                    value={form.remoteWorkAccess}
                    onChange={(value) =>
                      setForm({ ...form, remoteWorkAccess: value })
                    }
                  />
                </div>

                <div>
                  <FieldLabel>
                    Are you willing to undertake a drug test as part of this
                    hiring process? <RequiredMark />
                  </FieldLabel>
                  <YesNoSelect
                    value={form.willingDrugTest}
                    onChange={(value) =>
                      setForm({ ...form, willingDrugTest: value })
                    }
                  />
                </div>

                <div>
                  <FieldLabel>
                    Are you willing to allow SiBS to undergo a background check
                    as part of this hiring process? <RequiredMark />
                  </FieldLabel>
                  <YesNoSelect
                    value={form.willingBackgroundCheck}
                    onChange={(value) =>
                      setForm({ ...form, willingBackgroundCheck: value })
                    }
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={Users}
              title="References"
              description="Please list at least three references and their contact information."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>
                    Reference 1 <RequiredMark />
                  </FieldLabel>
                  <input
                    required
                    value={form.reference1Name}
                    onChange={(e) =>
                      setForm({ ...form, reference1Name: e.target.value })
                    }
                    placeholder="Reference 1 name"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>Phone</FieldLabel>
                  <input
                    value={form.reference1Phone}
                    onChange={(e) =>
                      setForm({ ...form, reference1Phone: e.target.value })
                    }
                    placeholder="Reference 1 phone"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>
                    Reference 2 <RequiredMark />
                  </FieldLabel>
                  <input
                    required
                    value={form.reference2Name}
                    onChange={(e) =>
                      setForm({ ...form, reference2Name: e.target.value })
                    }
                    placeholder="Reference 2 name"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>Phone</FieldLabel>
                  <input
                    value={form.reference2Phone}
                    onChange={(e) =>
                      setForm({ ...form, reference2Phone: e.target.value })
                    }
                    placeholder="Reference 2 phone"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>
                    Reference 3 <RequiredMark />
                  </FieldLabel>
                  <input
                    required
                    value={form.reference3Name}
                    onChange={(e) =>
                      setForm({ ...form, reference3Name: e.target.value })
                    }
                    placeholder="Reference 3 name"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>Phone</FieldLabel>
                  <input
                    value={form.reference3Phone}
                    onChange={(e) =>
                      setForm({ ...form, reference3Phone: e.target.value })
                    }
                    placeholder="Reference 3 phone"
                    className={inputClass()}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={Mic}
              title="Audio and File Upload"
              description="Upload a single audio file answering the listed questions and one supporting document/file."
            >
              <div className="space-y-5">
                <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-sm font-semibold leading-7 text-amber-800">
                  <p className="font-extrabold">
                    Your audio file must answer these questions:
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
                  <FieldLabel>
                    Upload single audio file <RequiredMark />
                  </FieldLabel>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5">
                    <Mic size={26} className="text-sibs-primary-1" />
                    <p className="mt-2 text-sm font-extrabold text-gray-800">
                      {form.audioFile?.name || "Choose audio file"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-gray-500">
                      Accepted: audio files only
                    </p>
                    <input
                      required
                      type="file"
                      accept="audio/*"
                      onChange={(e) =>
                        handleFileChange("audioFile", e.target.files?.[0])
                      }
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <FieldLabel>
                    Upload supporting file <RequiredMark />
                  </FieldLabel>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5">
                    <UploadCloud size={26} className="text-sibs-primary-1" />
                    <p className="mt-2 text-sm font-extrabold text-gray-800">
                      {form.attachmentFile?.name || "Choose file"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-gray-500">
                      PDF, DOC/DOCX, XLS/CSV, JPG/JPEG, PNG, GIF
                    </p>
                    <input
                      required
                      type="file"
                      accept={acceptedDocumentTypes}
                      onChange={(e) =>
                        handleFileChange("attachmentFile", e.target.files?.[0])
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </SectionCard>

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
                  I agree to terms & conditions provided by the company. By
                  providing my phone number, I agree to receive text messages
                  from the business.
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
                disabled={!canSubmit}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
                Submit Application
              </button>
            </div>
          </form>

        </section>
      </div>
    </div>
  );
}
