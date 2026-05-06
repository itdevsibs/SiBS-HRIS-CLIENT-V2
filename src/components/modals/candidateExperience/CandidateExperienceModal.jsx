import React from "react";
import { X, Plus, RotateCcw, Star } from "lucide-react";

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
  return `h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function textareaClass(extra = "") {
  return `w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
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
            className="rounded-lg p-1 transition hover:bg-amber-50"
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
      (candidate) => candidate.candidateId === candidateId
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

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
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
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Candidate Source Data
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Candidate <span className="text-red-500">*</span>
                    </label>

                    <select
                      required
                      value={form.candidateId}
                      onChange={(e) => handleCandidateChange(e.target.value)}
                      className={inputClass()}
                    >
                      <option value="">Select candidate</option>

                      {candidatesForExperience.map((candidate) => (
                        <option
                          key={candidate.candidateId}
                          value={candidate.candidateId}
                        >
                          {candidate.candidateName} — {candidate.roleTitle} /{" "}
                          {candidate.account}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Candidate Name
                    </label>

                    <input
                      readOnly
                      value={form.candidateName}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Candidate Email
                    </label>

                    <input
                      readOnly
                      value={form.candidateEmail}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Role
                    </label>

                    <input
                      readOnly
                      value={form.roleTitle}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Account
                    </label>

                    <input
                      readOnly
                      value={form.account}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Source
                    </label>

                    <input
                      readOnly
                      value={form.source}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Owner
                    </label>

                    <select
                      value={form.owner}
                      onChange={(e) =>
                        setForm({ ...form, owner: e.target.value })
                      }
                      className={inputClass()}
                    >
                      <option value="">Select owner</option>

                      {ownerOptions.map((owner) => (
                        <option key={owner} value={owner}>
                          {owner}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Experience Details
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Event Type <span className="text-red-500">*</span>
                    </label>

                    <select
                      required
                      value={form.eventType}
                      onChange={(e) => handleEventTypeChange(e.target.value)}
                      className={inputClass()}
                    >
                      {eventTypeOptions.map((eventType) => (
                        <option key={eventType} value={eventType}>
                          {eventType}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Current Stage
                    </label>

                    <select
                      value={form.currentStage}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          currentStage: e.target.value,
                          dropOffStage: isExitEvent
                            ? e.target.value
                            : form.dropOffStage,
                        })
                      }
                      className={inputClass()}
                    >
                      <option value="">Select stage</option>

                      {candidateStageOptions.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isExitEvent && (
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                        Drop-off / Exit Stage{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <select
                        required
                        value={form.dropOffStage}
                        onChange={(e) =>
                          setForm({ ...form, dropOffStage: e.target.value })
                        }
                        className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      >
                        <option value="">Select exit stage</option>

                        {candidateStageOptions.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Reason Category <span className="text-red-500">*</span>
                    </label>

                    <select
                      required
                      value={form.reasonCategory}
                      onChange={(e) =>
                        setForm({ ...form, reasonCategory: e.target.value })
                      }
                      className={inputClass()}
                    >
                      <option value="">Select reason category</option>

                      {reasonCategoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

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
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Where this data comes from
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  This page reads records created by Candidate Pipeline, Offers,
                  Onboarding, and manual Candidate Experience entries.
                </p>
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

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5"
            >
              <RotateCcw size={17} />
              Reset
            </button>

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
              <Plus size={17} />
              Save Experience
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}