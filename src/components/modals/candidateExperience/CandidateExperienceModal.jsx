import React, { useEffect, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  ChevronDown,
  ClipboardList,
  MessageSquareText,
  Plus,
  RotateCcw,
  Star,
  UserRound,
  X,
} from "lucide-react";

const candidatesForExperience = [
  {
    candidateId: "CAND-006",
    candidateName: "Lara Mendoza",
    candidateEmail: "lara.mendoza@email.com",
    roleTitle: "Customer Service Representative",
    account: "SIBS Operations",
    source: "Referral",
    currentStage: "Interviewed",
    owner: "Maria Reyes",
  },
  {
    candidateId: "CAND-007",
    candidateName: "Renz Castillo",
    candidateEmail: "renz.castillo@email.com",
    roleTitle: "RCM Analyst",
    account: "SIBS RCM",
    source: "LinkedIn",
    currentStage: "Offered",
    owner: "Kim Domingo",
  },
  {
    candidateId: "CAND-008",
    candidateName: "Nicole Tan",
    candidateEmail: "nicole.tan@email.com",
    roleTitle: "QA Specialist",
    account: "SIBS Operations",
    source: "JobStreet",
    currentStage: "Screened",
    owner: "John Dela Cruz",
  },
];

const eventTypeOptions = [
  "Pipeline Drop-off",
  "Offer Declined",
  "Pre-start Withdrawal",
  "No Show",
  "Candidate Feedback",
];

const candidateStageOptions = [
  "Sourced",
  "Screened",
  "Interviewed",
  "Offered",
  "Accepted",
  "Hired",
];

const reasonCategoryOptions = [
  "Compensation",
  "Schedule",
  "Process Delay",
  "No Response",
  "Failed Assessment",
  "Failed Interview",
  "Accepted Other Offer",
  "Location Issue",
  "Personal Reason",
  "Incomplete Requirements",
  "Positive Experience",
  "Others",
];

const ownerOptions = [
  "Maria Reyes",
  "John Dela Cruz",
  "Kim Domingo",
  "Paul Garcia",
];

const emptyExperienceForm = {
  candidateId: "",
  candidateName: "",
  candidateEmail: "",
  roleTitle: "",
  account: "",
  source: "",
  owner: "",
  eventType: "Pipeline Drop-off",
  currentStage: "",
  dropOffStage: "",
  reasonCategory: "",
  reason: "",
  feedback: "",
  experienceRating: 3,
  feedbackTag: "",
};

function inputClass(extra = "") {
  return `h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function readonlyInputClass(extra = "") {
  return `h-12 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none ${extra}`;
}

function textareaClass(extra = "") {
  return `w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function AnimatedDropdown({ open, children, className = "" }) {
  return (
    <div
      className={`absolute left-0 right-0 top-full mt-2 grid transition-all duration-300 ease-out ${
        open
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0"
      } ${className}`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl transition-all duration-300 ease-out ${
            open ? "translate-y-0 scale-100" : "-translate-y-2 scale-[0.98]"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function CustomSelect({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Select",
  required = false,
  zIndex = "z-30",
  optionValue = (option) => option,
  optionLabel = (option) => option,
  optionDescription = null,
  icon: Icon,
  danger = false,
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(
    (option) => String(optionValue(option)) === String(value),
  );

  const displayValue = selectedOption ? optionLabel(selectedOption) : placeholder;

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${zIndex}`}>
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-12 w-full items-center justify-between rounded-xl border bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition-all duration-200 hover:bg-[#F8FAFC] focus:ring-4 ${
          danger
            ? "border-[#E6ECF2] hover:border-red-400 focus:border-red-500 focus:ring-red-500/10"
            : "border-[#D0D5DD] hover:border-sibs-primary-1/40 focus:border-sibs-primary-1 focus:ring-sibs-primary-1/10"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {Icon && (
            <Icon size={17} className="shrink-0 text-sibs-tertiary-5" />
          )}

          <span
            className={`truncate ${
              selectedOption ? "text-[#344054]" : "text-sibs-tertiary-5"
            }`}
          >
            {displayValue}
          </span>
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatedDropdown open={open}>
        <div className="max-h-64 overflow-y-auto py-2 sibs-scrollbar">
          {options.length > 0 ? (
            options.map((option) => {
              const currentValue = optionValue(option);
              const currentLabel = optionLabel(option);
              const currentDescription = optionDescription
                ? optionDescription(option)
                : "";
              const selected = String(value) === String(currentValue);

              return (
                <button
                  key={currentValue}
                  type="button"
                  onClick={() => {
                    onChange(currentValue, option);
                    setOpen(false);
                  }}
                  className={`block w-full px-4 py-3 text-left text-sm transition ${
                    selected
                      ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                      : "text-[#344054] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span className="block truncate">{currentLabel}</span>

                  {currentDescription && (
                    <span className="mt-1 block truncate text-xs font-semibold text-sibs-tertiary-5">
                      {currentDescription}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="px-4 py-4 text-sm font-semibold text-sibs-tertiary-5">
              No options available.
            </div>
          )}
        </div>
      </AnimatedDropdown>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className="max-w-[60%] break-words text-right text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}

function StarRatingInput({ value, onChange }) {
  const numericValue = Number(value || 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {Array.from({ length: 5 }).map((_, index) => {
        const ratingValue = index + 1;
        const active = ratingValue <= numericValue;

        return (
          <button
            key={ratingValue}
            type="button"
            onClick={() => onChange(ratingValue)}
            className="rounded-lg p-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-50 active:scale-[0.98]"
            aria-label={`${ratingValue} star`}
          >
            <Star
              size={28}
              className={active ? "text-amber-400" : "text-gray-300"}
              fill={active ? "currentColor" : "none"}
            />
          </button>
        );
      })}

      <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
        {numericValue}/5
      </span>
    </div>
  );
}

export function AddExperienceModal({
  open,
  form,
  setForm,
  onClose,
  onSubmit,
  onReset,
}) {
  if (!open) return null;

  const isExitEvent =
    form.eventType === "Pipeline Drop-off" ||
    form.eventType === "Offer Declined" ||
    form.eventType === "Pre-start Withdrawal" ||
    form.eventType === "No Show";

  function handleCandidateChange(candidateId) {
    const selectedCandidate = candidatesForExperience.find(
      (candidate) => String(candidate.candidateId) === String(candidateId),
    );

    if (!selectedCandidate) {
      setForm(emptyExperienceForm);
      return;
    }

    setForm({
      ...form,
      candidateId: selectedCandidate.candidateId,
      candidateName: selectedCandidate.candidateName,
      candidateEmail: selectedCandidate.candidateEmail,
      roleTitle: selectedCandidate.roleTitle,
      account: selectedCandidate.account,
      source: selectedCandidate.source,
      owner: selectedCandidate.owner,
      currentStage: selectedCandidate.currentStage,
      dropOffStage: selectedCandidate.currentStage,
    });
  }

  function handleEventTypeChange(eventType) {
    const isFeedbackOnly = eventType === "Candidate Feedback";

    setForm({
      ...form,
      eventType,
      reasonCategory: isFeedbackOnly ? "Positive Experience" : "",
      reason: "",
      dropOffStage: isFeedbackOnly ? "" : form.currentStage,
      feedbackTag: isFeedbackOnly ? "Positive Experience" : "",
      experienceRating: isFeedbackOnly ? 5 : form.experienceRating,
    });
  }

  function handleCurrentStageChange(stage) {
    setForm({
      ...form,
      currentStage: stage,
      dropOffStage: isExitEvent ? stage : form.dropOffStage,
    });
  }

  function handleResetClick() {
    if (onReset) {
      onReset();
      return;
    }

    setForm(emptyExperienceForm);
  }

  return (
    <div
      className="sibs-modal-blur fixed inset-0 z-[10000] flex h-dvh items-center justify-center px-4 py-4 font-jakarta"
      onClick={onClose}
    >
      <div
        className="sibs-profile-tab-panel flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <MessageSquareText size={14} />
              Candidate Experience
            </div>

            <h2 className="mt-3 text-lg font-extrabold text-sibs-primary-1 sm:text-xl">
              Add Candidate Experience Record
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Record candidate feedback, exit reason, and 1–5 star experience
              rating.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-100 hover:text-gray-700 active:scale-[0.98]"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#101828]">
                      Candidate Source Data
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                      Select the candidate and confirm the linked recruitment
                      information.
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2F6FA] text-sibs-primary-1">
                    <UserRound size={19} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <CustomSelect
                      label="Candidate"
                      required
                      value={form.candidateId}
                      options={candidatesForExperience}
                      onChange={handleCandidateChange}
                      placeholder="Select candidate"
                      zIndex="z-50"
                      icon={UserRound}
                      optionValue={(candidate) => candidate.candidateId}
                      optionLabel={(candidate) => candidate.candidateName}
                      optionDescription={(candidate) =>
                        `${candidate.roleTitle} / ${candidate.account} • ${candidate.currentStage}`
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Candidate Name
                    </label>

                    <input
                      readOnly
                      value={form.candidateName}
                      className={readonlyInputClass()}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Candidate Email
                    </label>

                    <input
                      readOnly
                      value={form.candidateEmail}
                      className={readonlyInputClass()}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Role
                    </label>

                    <input
                      readOnly
                      value={form.roleTitle}
                      className={readonlyInputClass()}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Account
                    </label>

                    <input
                      readOnly
                      value={form.account}
                      className={readonlyInputClass()}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Source
                    </label>

                    <input
                      readOnly
                      value={form.source}
                      className={readonlyInputClass()}
                    />
                  </div>

                  <CustomSelect
                    label="Owner"
                    value={form.owner}
                    options={ownerOptions}
                    onChange={(value) => setForm({ ...form, owner: value })}
                    placeholder="Select owner"
                    zIndex="z-40"
                    icon={UserRound}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#101828]">
                      Experience Details
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                      Record the event type, stage, reason, feedback, and star
                      rating.
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2F6FA] text-sibs-primary-1">
                    <ClipboardList size={19} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <CustomSelect
                    label="Event Type"
                    required
                    value={form.eventType}
                    options={eventTypeOptions}
                    onChange={handleEventTypeChange}
                    placeholder="Select event type"
                    zIndex="z-30"
                    icon={MessageSquareText}
                  />

                  <CustomSelect
                    label="Current Stage"
                    value={form.currentStage}
                    options={candidateStageOptions}
                    onChange={handleCurrentStageChange}
                    placeholder="Select stage"
                    zIndex="z-20"
                    icon={BriefcaseBusiness}
                  />

                  {isExitEvent && (
                    <CustomSelect
                      label="Drop-off / Exit Stage"
                      required
                      value={form.dropOffStage}
                      options={candidateStageOptions}
                      onChange={(value) =>
                        setForm({ ...form, dropOffStage: value })
                      }
                      placeholder="Select exit stage"
                      zIndex="z-10"
                      icon={BriefcaseBusiness}
                      danger
                    />
                  )}

                  <CustomSelect
                    label="Reason Category"
                    required
                    value={form.reasonCategory}
                    options={reasonCategoryOptions}
                    onChange={(value) =>
                      setForm({ ...form, reasonCategory: value })
                    }
                    placeholder="Select reason category"
                    zIndex="z-[5]"
                    icon={ClipboardList}
                  />

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Reason <span className="text-red-500">*</span>
                    </label>

                    <textarea
                      required
                      value={form.reason}
                      onChange={(e) =>
                        setForm({ ...form, reason: e.target.value })
                      }
                      rows={3}
                      placeholder="Example: Candidate declined due to salary expectation mismatch."
                      className={textareaClass()}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Candidate Feedback
                    </label>

                    <textarea
                      value={form.feedback}
                      onChange={(e) =>
                        setForm({ ...form, feedback: e.target.value })
                      }
                      rows={3}
                      placeholder="Example: The recruiter was responsive, but the offer process took too long."
                      className={textareaClass()}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Experience Rating <span className="text-red-500">*</span>
                    </label>

                    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                      <StarRatingInput
                        value={form.experienceRating}
                        onChange={(rating) =>
                          setForm({ ...form, experienceRating: rating })
                        }
                      />

                      <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
                        The selected stars are saved as a number from 1 to 5.
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Feedback Tag
                    </label>

                    <input
                      value={form.feedbackTag}
                      onChange={(e) =>
                        setForm({ ...form, feedbackTag: e.target.value })
                      }
                      placeholder="Example: Compensation Concern, Process Delay, Positive Experience"
                      className={inputClass()}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sibs-primary-1">
                    <MessageSquareText size={20} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-sibs-primary-1">
                      Where this data comes from
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                      This page reads records created by Candidate Pipeline,
                      Offers, Onboarding, and manual Candidate Experience
                      entries.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Star Rating Storage
                </h3>

                <div className="mt-4">
                  <DetailRow
                    label="Rating Value"
                    value={`${form.experienceRating}/5`}
                  />
                  <DetailRow label="Stored As" value="Integer number" />
                  <DetailRow label="Database Column" value="experience_rating" />
                  <DetailRow label="Display" value="Converted to stars in UI" />
                </div>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <h3 className="text-sm font-bold text-amber-700">
                  Backend Later
                </h3>

                <p className="mt-2 text-sm leading-6 text-amber-700/90">
                  Replace localStorage with GET/POST
                  /api/recruitment/candidate-experience when backend is ready.
                </p>
              </div>
            </div>
          </div>
        </form>

        <div className="border-t border-[#E6ECF2] px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleResetClick}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
            >
              <RotateCcw size={17} />
              Reset
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-gray-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
            >
              <Plus size={17} />
              Save Experience
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
