import { useMemo, useState } from "react";
import { Plus, Search, Sparkles, Star, X } from "lucide-react";

import { useUser } from "@/services/context/UserContext";
import ThemedDropdown from "@/components/layout/dropdown/ThemedDropdown.jsx";
import {
  EXPERIENCE_CATEGORIES,
  OUTCOME,
  RESPONSE_SOURCE,
  SURVEY_STATUS,
} from "@/lib/utils/candidateExperience/index.js";

const EVENT_OPTIONS = [
  "Candidate Feedback",
  "Pipeline Drop-off",
  "Offer Declined",
  "Pre-start Withdrawal",
  "No Show",
  "NHO Completed",
  "Process Completed",
];

const DEFAULT_STAGE_OPTIONS = [
  "Sourced",
  "Screened",
  "Interviewed",
  "Final Interview",
  "Offered",
  "Accepted",
  "For NHO",
  "Onboarding",
  "Hired",
  "NHO Completed",
];

const emptyForm = {
  candidatePipelineId: "",
  candidateId: "",
  applicationId: "",
  candidateName: "",
  candidateEmail: "",
  roleTitle: "",
  account: "",
  source: "",
  owner: "",
  currentStage: "",
  outcome: OUTCOME.DROP_OFF,
  eventType: "Offer Declined",
  finalStage: "",
  dropOffCategory: "",
  dropOffReason: "",
  experienceRating: 3,
  feedbackCategory: "Compensation",
  feedback: "",
  feedbackTag: "",
  internalNote: "",
  stageTimeline: [],
};

function text(value) {
  return String(value ?? "").trim();
}

function first(candidate, keys) {
  for (const key of keys) {
    const value = candidate?.[key];
    if (value !== null && value !== undefined && String(value).trim()) {
      return value;
    }
  }
  return "";
}

function normalizeStage(candidate) {
  return text(
    first(candidate, [
      "currentStage",
      "current_stage",
      "pipelineStage",
      "pipeline_stage",
      "stage",
    ]),
  );
}

function normalizeCandidate(candidate = {}) {
  const currentStage = normalizeStage(candidate);
  const outcome = currentStage.toLowerCase().includes("drop")
    ? OUTCOME.DROP_OFF
    : OUTCOME.COMPLETED;

  return {
    candidatePipelineId: text(
      first(candidate, [
        "id",
        "candidatePipelineId",
        "candidate_pipeline_id",
        "pipelineId",
        "pipeline_id",
      ]),
    ),
    candidateId: text(
      first(candidate, [
        "candidateId",
        "candidate_id",
        "candidateCode",
        "candidate_code",
      ]),
    ),
    applicationId: text(
      first(candidate, [
        "candidateApplicationId",
        "candidate_application_id",
        "applicationId",
        "application_id",
      ]),
    ),
    candidateName: text(
      first(candidate, [
        "name",
        "fullName",
        "full_name",
        "candidateName",
        "candidate_name",
      ]),
    ),
    candidateEmail: text(
      first(candidate, ["email", "candidateEmail", "candidate_email"]),
    ),
    roleTitle: text(
      first(candidate, [
        "roleTitle",
        "role_title",
        "openPosition",
        "open_position",
        "role",
      ]),
    ),
    account: text(
      first(candidate, [
        "account",
        "finalAccount",
        "final_account",
        "currentAppliedAccount",
        "current_applied_account",
      ]),
    ),
    source:
      text(first(candidate, ["source", "leadSource", "lead_source"])) ||
      "Candidate Pipeline",
    owner: text(
      first(candidate, [
        "owner",
        "taOwner",
        "ta_owner",
        "recruiter",
        "assignedTa",
        "assigned_ta",
      ]),
    ),
    currentStage,
    outcome,
    finalStage: currentStage,
    dropOffCategory: text(
      first(candidate, ["dropOffCategory", "drop_off_category"]),
    ),
    dropOffReason: text(
      first(candidate, [
        "dropOffReason",
        "drop_off_reason",
        "reasonForMovement",
        "reason_for_movement",
      ]),
    ),
    stageTimeline:
      first(candidate, [
        "timeline",
        "timeline_json",
        "stageTimeline",
        "stage_timeline",
        "applicationHistory",
        "application_history",
      ]) || [],
  };
}

function userName(user = {}) {
  return text(
    user.fullName ||
      user.full_name ||
      user.name ||
      [user.firstName, user.middleName, user.lastName]
        .filter(Boolean)
        .join(" ") ||
      user.email ||
      user.sibsId ||
      user.sibs_id ||
      "Talent Acquisition",
  );
}

const labelClass =
  "mb-1 block font-jakarta sibs-text-micro font-extrabold uppercase tracking-wider text-[#667085]";

const inputClass =
  "h-8.5 2xl:h-10 w-full rounded-lg 2xl:rounded-xl border border-[#D7E0EA] bg-[#F8FAFC] px-3 font-jakarta sibs-text-xs font-semibold text-[#082E55] outline-none transition placeholder:text-[#8CA0BA] focus:border-[#4B6F95] focus:bg-white focus:ring-2 focus:ring-[#4B6F95]/10";

const readOnlyClass = `${inputClass} cursor-default bg-[#F4F7FA] text-[#082E55]`;

const textareaClass =
  "w-full resize-none rounded-lg 2xl:rounded-xl border border-[#D7E0EA] bg-[#F8FAFC] px-3 py-2 font-jakarta sibs-text-xs font-semibold leading-5 text-[#082E55] outline-none transition placeholder:text-[#8CA0BA] focus:border-[#4B6F95] focus:bg-white focus:ring-2 focus:ring-[#4B6F95]/10";

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export default function AddExperienceModal({
  open,
  candidates = [],
  candidatesLoading = false,
  onClose,
  onSave,
}) {
  const { user } = useUser();
  const [form, setForm] = useState(emptyForm);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateMenuOpen, setCandidateMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const candidateOptions = useMemo(() => {
    const keyword = candidateSearch.toLowerCase().trim();

    return candidates
      .map(normalizeCandidate)
      .filter((candidate) => {
        if (!keyword) return true;

        return [
          candidate.candidateName,
          candidate.candidateEmail,
          candidate.candidateId,
          candidate.roleTitle,
          candidate.account,
          candidate.currentStage,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      });
  }, [candidates, candidateSearch]);

  const stageOptions = useMemo(
    () => unique([form.currentStage, form.finalStage, ...DEFAULT_STAGE_OPTIONS]),
    [form.currentStage, form.finalStage],
  );

  const eventClassificationDropdownOptions = useMemo(
    () => EVENT_OPTIONS.map((val) => ({ label: val, value: val })),
    [],
  );

  const finalStatusDropdownOptions = useMemo(
    () => [
      { label: "Drop-off", value: OUTCOME.DROP_OFF },
      { label: "Completed", value: OUTCOME.COMPLETED },
    ],
    [],
  );

  const exitStageDropdownOptions = useMemo(
    () => stageOptions.map((val) => ({ label: val, value: val })),
    [stageOptions],
  );

  const reasonCategoryDropdownOptions = useMemo(
    () => EXPERIENCE_CATEGORIES.map((val) => ({ label: val, value: val })),
    [],
  );

  if (!open) return null;

  const isDropOff = form.outcome === OUTCOME.DROP_OFF;
  const taOwner = form.owner || userName(user);

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function selectCandidate(candidate) {
    const feedbackCategory =
      candidate.dropOffCategory || form.feedbackCategory || "";

    setForm((current) => ({
      ...current,
      ...candidate,
      owner: candidate.owner || userName(user),
      feedbackCategory,
      dropOffCategory:
        candidate.outcome === OUTCOME.DROP_OFF
          ? candidate.dropOffCategory || feedbackCategory
          : "",
      eventType:
        candidate.outcome === OUTCOME.DROP_OFF
          ? "Pipeline Drop-off"
          : "Candidate Feedback",
    }));

    setCandidateSearch(candidate.candidateName);
    setCandidateMenuOpen(false);
    setError("");
  }

  function handleOutcomeChange(value) {
    setForm((current) => ({
      ...current,
      outcome: value,
      finalStage: current.finalStage || current.currentStage,
      dropOffCategory:
        value === OUTCOME.DROP_OFF
          ? current.dropOffCategory || current.feedbackCategory
          : "",
      dropOffReason:
        value === OUTCOME.DROP_OFF ? current.dropOffReason : "",
    }));
  }

  function handleCategoryChange(value) {
    setForm((current) => ({
      ...current,
      feedbackCategory: value,
      dropOffCategory:
        current.outcome === OUTCOME.DROP_OFF ? value : current.dropOffCategory,
    }));
    setError("");
  }

  function reset() {
    setForm(emptyForm);
    setCandidateSearch("");
    setCandidateMenuOpen(false);
    setError("");
  }

  async function submit(event) {
    event.preventDefault();

    if (!form.candidatePipelineId && !form.candidateId) {
      setError("Select a Candidate Pipeline record first.");
      return;
    }

    if (!form.candidateEmail) {
      setError("The selected candidate does not have an email address.");
      return;
    }

    if (!form.outcome) {
      setError("Final status is required.");
      return;
    }

    if (!form.eventType) {
      setError("Event classification is required.");
      return;
    }

    if (!form.finalStage) {
      setError("Exit/final stage is required.");
      return;
    }

    if (
      !form.experienceRating ||
      form.experienceRating < 1 ||
      form.experienceRating > 5
    ) {
      setError("Candidate rating must be from 1 to 5.");
      return;
    }

    if (!form.feedbackCategory) {
      setError("Reason category is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await onSave?.({
        ...form,
        owner: taOwner,
        dropOffCategory: isDropOff
          ? form.dropOffCategory || form.feedbackCategory
          : null,
        dropOffReason: isDropOff ? form.dropOffReason : null,
        internalNote: isDropOff
          ? form.internalNote
          : form.dropOffReason || form.internalNote,
        responseSource: "ta_manual",
        response_source: RESPONSE_SOURCE.TA_MANUAL,
        surveyStatus: SURVEY_STATUS.NOT_SENT,
        finalStatus: form.outcome,
        stageTimeline: form.stageTimeline,
        recordedBy: userName(user),
        dateRecorded: new Date().toISOString(),
        eventType:
          form.eventType ||
          (isDropOff ? "Pipeline Drop-off" : "Manual Candidate Feedback"),
      });

      if (response?.success === false) {
        setError(
          response.message || "Manual candidate experience entry was not saved.",
        );
        return;
      }

      reset();
    } catch (saveError) {
      setError(
        saveError?.message || "Manual candidate experience entry was not saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[10000] flex h-dvh items-center justify-center p-2 font-jakarta sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Log Candidate Experience Record"
        className="sibs-modal-pop-in flex max-h-[90dvh] w-full max-w-4xl 2xl:max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl font-jakarta"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5 font-jakarta">
          <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
            <span className="flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
              <Sparkles size={16} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base sm:text-lg 2xl:text-xl font-extrabold text-white">
                  Log Candidate Experience Record
                </h2>
                <span className="hidden rounded-md border border-[#FF5C28]/35 bg-[#FF5C28]/15 px-2 py-0.5 text-[8.5px] 2xl:text-[9.5px] font-extrabold uppercase tracking-wider text-[#FFB69E] sm:inline-flex">
                  TA Manual Entry
                </span>
              </div>
              <p className="mt-0.5 truncate sibs-text-xs font-semibold text-white/75">
                Capture direct candidate feedback, ratings, and drop-off timeline
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </header>

        <form
          onSubmit={submit}
          className="flex-1 overflow-y-auto bg-white px-6 py-5 font-jakarta"
        >
          <div className="grid grid-cols-1 gap-x-3 gap-y-3.5 md:grid-cols-2">
            {/* Candidate Search Dropdown */}
            <div className="relative">
              <label className={labelClass}>
                CANDIDATE FULL NAME <span className="text-[#FF5C28]">*</span>
              </label>

              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8CA0BA]"
                />
                <input
                  value={candidateSearch}
                  onFocus={() => setCandidateMenuOpen(true)}
                  onChange={(event) => {
                    setCandidateSearch(event.target.value);
                    setCandidateMenuOpen(true);
                  }}
                  placeholder="e.g. Juan Dela Cruz"
                  className={`${inputClass} pl-9`}
                  autoComplete="off"
                />
              </div>

              {candidateMenuOpen ? (
                <div className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-52 overflow-y-auto rounded-xl border border-[#D7E0EA] bg-white p-1.5 shadow-xl">
                  {candidatesLoading ? (
                    <p className="px-3 py-4 text-center text-xs font-semibold text-[#8CA0BA]">
                      Loading Candidate Pipeline...
                    </p>
                  ) : candidateOptions.length ? (
                    candidateOptions.slice(0, 80).map((candidate) => (
                      <button
                        key={
                          candidate.candidatePipelineId ||
                          candidate.candidateId ||
                          candidate.candidateEmail
                        }
                        type="button"
                        onClick={() => selectCandidate(candidate)}
                        className={`mb-1 w-full rounded-lg px-3 py-2 text-left transition last:mb-0 ${
                          form.candidatePipelineId === candidate.candidatePipelineId
                            ? "bg-[#E9F0FC]"
                            : "hover:bg-[#F8FAFC]"
                        }`}
                      >
                        <p className="truncate text-xs font-black text-[#082E55]">
                          {candidate.candidateName || "Unnamed Candidate"}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] font-semibold text-[#7D90A9]">
                          {candidate.roleTitle || "No role"} / {candidate.account || "No account"}
                          {candidate.currentStage
                            ? ` • ${candidate.currentStage}`
                            : ""}
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-4 text-center text-xs font-semibold text-[#8CA0BA]">
                      No Candidate Pipeline records found.
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            <Field label="CANDIDATE EMAIL" required>
              <input
                readOnly
                value={form.candidateEmail}
                placeholder="e.g. juan.delacruz@email.com"
                className={readOnlyClass}
              />
            </Field>

            <Field label="TARGET POSITION / ROLE">
              <input
                readOnly
                value={form.roleTitle}
                placeholder="Candidate position"
                className={readOnlyClass}
              />
            </Field>

            <Field label="TARGET ACCOUNT">
              <input
                readOnly
                value={form.account}
                placeholder="Candidate account"
                className={readOnlyClass}
              />
            </Field>

            {/* Dropdown Row: Event Classification, Final Status, Exit Stage */}
            <div className="grid grid-cols-1 gap-3 md:col-span-2 md:grid-cols-3">
              <div>
                <label className={labelClass}>EVENT CLASSIFICATION</label>
                <ThemedDropdown
                  value={form.eventType}
                  options={eventClassificationDropdownOptions}
                  onChange={(val) => setField("eventType", val)}
                  searchable={false}
                  showPlaceholderOption={false}
                  className="w-full"
                  zIndex="z-[90]"
                />
              </div>

              <div>
                <label className={labelClass}>FINAL STATUS</label>
                <ThemedDropdown
                  value={form.outcome}
                  options={finalStatusDropdownOptions}
                  onChange={(val) => handleOutcomeChange(val)}
                  searchable={false}
                  showPlaceholderOption={false}
                  className="w-full"
                  zIndex="z-[90]"
                />
              </div>

              <div>
                <label className={labelClass}>EXIT STAGE</label>
                <ThemedDropdown
                  value={form.finalStage}
                  options={exitStageDropdownOptions}
                  onChange={(val) => setField("finalStage", val)}
                  searchable={true}
                  showPlaceholderOption={false}
                  placeholder="Select stage"
                  className="w-full"
                  zIndex="z-[90]"
                />
              </div>
            </div>

            {/* Reason Category Dropdown & Feedback Tag */}
            <div>
              <label className={labelClass}>REASON CATEGORY</label>
              <ThemedDropdown
                value={form.feedbackCategory}
                options={reasonCategoryDropdownOptions}
                onChange={(val) => handleCategoryChange(val)}
                searchable={false}
                showPlaceholderOption={false}
                placeholder="Select category"
                className="w-full"
                zIndex="z-[80]"
              />
            </div>

            <Field label="FEEDBACK TAG">
              <input
                value={form.feedbackTag}
                onChange={(event) => setField("feedbackTag", event.target.value)}
                placeholder="e.g. Compensation Concern"
                className={inputClass}
              />
            </Field>

            {/* Star Rating */}
            <div>
              <label className={labelClass}>CANDIDATE RATING (1–5 STARS)</label>
              <div className="flex h-10 items-center gap-1.5 rounded-xl border border-[#D7E0EA] bg-[#F8FAFC] px-3">
                {[1, 2, 3, 4, 5].map((rating) => {
                  const active = rating <= Number(form.experienceRating || 0);

                  return (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setField("experienceRating", rating)}
                      className="rounded-md p-0.5 transition hover:-translate-y-0.5"
                      aria-label={`${rating} star`}
                    >
                      <Star
                        size={21}
                        className={
                          active
                            ? "fill-amber-400 text-amber-400"
                            : "text-[#D8E1EB]"
                        }
                      />
                    </button>
                  );
                })}

                <span className="ml-2 text-xs font-black text-[#526983]">
                  ({Number(form.experienceRating || 0)} Stars)
                </span>
              </div>
            </div>

            <Field label="TA OWNER">
              <input readOnly value={taOwner} className={readOnlyClass} />
            </Field>

            <div className="md:col-span-2">
              <label className={labelClass}>
                {isDropOff
                  ? "DROP-OFF REASON / DESCRIPTION"
                  : "EXPERIENCE REASON / DESCRIPTION"}
              </label>
              <textarea
                rows={2}
                value={form.dropOffReason}
                onChange={(event) => setField("dropOffReason", event.target.value)}
                placeholder="Provide root-cause description..."
                className={textareaClass}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>
                QUALITATIVE CANDIDATE FEEDBACK (VOC)
              </label>
              <textarea
                rows={2}
                value={form.feedback}
                onChange={(event) => setField("feedback", event.target.value)}
                placeholder="Direct quotes or candidate comments..."
                className={textareaClass}
              />
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 font-jakarta text-xs font-semibold text-rose-700">
              {error}
            </div>
          ) : null}
        </form>

        <footer className="shrink-0 flex items-center justify-end gap-2.5 border-t border-[#DDE5EE] bg-[#F1F5F9] px-5 py-3 2xl:py-3.5 sm:px-6 font-jakarta">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#667085] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28]"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={submit}
            className="inline-flex h-8.5 2xl:h-10 min-w-[130px] items-center justify-center gap-1.5 rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={14} />
            {saving ? "Saving..." : "Save Record"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Field({ label, required = false, children }) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required ? <span className="text-[#FF5C28]"> *</span> : null}
      </label>
      {children}
    </div>
  );
}