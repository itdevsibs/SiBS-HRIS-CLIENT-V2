import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCandidatePipeline } from "../../../services/context/CandidatePipelineContext";

const RECRUITMENT_SETTINGS_STORAGE_KEY = "sibs_recruitment_settings_temp";

function safeReadSettings() {
  try {
    const raw = localStorage.getItem(RECRUITMENT_SETTINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function groupFieldsBySection(fields = []) {
  const groups = new Map();

  fields
    .filter((field) => field.enabled !== false)
    .forEach((field) => {
      const section = field.section || "Untitled Section";

      if (!groups.has(section)) {
        groups.set(section, {
          section,
          questions: [],
        });
      }

      groups.get(section).questions.push(field);
    });

  return Array.from(groups.values());
}

function FieldInput({ field, value, onChange, readOnly = false }) {
  const disabledClass =
    "disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#475467]";

  if (field.type === "Rating") {
    return (
      <select
        value={value || ""}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 h-11 w-full rounded-lg border border-[#B8C2CF] bg-white px-3 text-sm font-semibold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${disabledClass}`}
      >
        <option value="">Select rating</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
      </select>
    );
  }

  if (field.type === "Paragraph") {
    return (
      <textarea
        rows={4}
        value={value || ""}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type answer here..."
        className={`mt-2 w-full resize-none rounded-lg border border-[#B8C2CF] bg-white px-3 py-2 text-sm font-semibold text-[#344054] outline-none transition placeholder:text-[#98A2B3] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${disabledClass}`}
      />
    );
  }

  if (field.type === "Dropdown") {
    return (
      <select
        value={value || ""}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 h-11 w-full rounded-lg border border-[#B8C2CF] bg-white px-3 text-sm font-semibold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${disabledClass}`}
      >
        <option value="">Select answer</option>
        <option value="Recommended">Recommended</option>
        <option value="For Review">For Review</option>
        <option value="Not Recommended">Not Recommended</option>
      </select>
    );
  }

  if (field.type === "Number") {
    return (
      <input
        type="number"
        value={value || ""}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter number..."
        className={`mt-2 h-11 w-full rounded-lg border border-[#B8C2CF] bg-white px-3 text-sm font-semibold text-[#344054] outline-none transition placeholder:text-[#98A2B3] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${disabledClass}`}
      />
    );
  }

  if (field.type === "Date") {
    return (
      <input
        type="date"
        value={value || ""}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 h-11 w-full rounded-lg border border-[#B8C2CF] bg-white px-3 text-sm font-semibold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${disabledClass}`}
      />
    );
  }

  if (field.type === "Checkbox") {
    return (
      <label className="mt-2 flex h-11 items-center gap-3 rounded-lg border border-[#B8C2CF] bg-white px-3 text-sm font-semibold text-[#344054]">
        <input
          type="checkbox"
          checked={Boolean(value)}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-sibs-primary-1 disabled:cursor-not-allowed"
        />
        Yes
      </label>
    );
  }

  return (
    <input
      value={value || ""}
      disabled={readOnly}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type answer here..."
      className={`mt-2 h-11 w-full rounded-lg border border-[#B8C2CF] bg-white px-3 text-sm font-semibold text-[#344054] outline-none transition placeholder:text-[#98A2B3] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${disabledClass}`}
    />
  );
}

export default function FinalInterviewForms() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { candidateList, handleSubmitFinalInterview } = useCandidatePipeline();

  const candidateId = searchParams.get("candidateId") || "—";
  const candidateApplicationId =
    searchParams.get("candidateApplicationId") || "—";
  const positionId = searchParams.get("positionId");
  const formId = searchParams.get("formId");
  const submissionId = searchParams.get("submissionId");
  const mode = searchParams.get("mode");

  const isViewMode = mode === "view";

  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentCandidate = useMemo(() => {
    return candidateList.find((candidate) => {
      return (
        String(candidate.candidateId || "") === String(candidateId || "") ||
        String(candidate.candidateApplicationId || "") ===
          String(candidateApplicationId || "") ||
        String(candidate.applicationId || "") ===
          String(candidateApplicationId || "") ||
        String(candidate.id || "") === String(candidateApplicationId || "")
      );
    });
  }, [candidateList, candidateId, candidateApplicationId]);

  const savedSubmission = useMemo(() => {
    if (!isViewMode || !submissionId || !currentCandidate) return null;

    return (currentCandidate.finalInterviewSubmittedForms || []).find(
      (item) => String(item.id) === String(submissionId),
    );
  }, [isViewMode, submissionId, currentCandidate]);

  const settings = useMemo(() => safeReadSettings(), []);

  const activeForm = useMemo(() => {
    if (savedSubmission) {
      return {
        id: savedSubmission.formId,
        name: savedSubmission.formName,
        fields: savedSubmission.fieldsSnapshot || [],
      };
    }

    if (!settings?.forms?.length) return null;

    const forms = settings.forms;

    const formById = forms.find((form) => String(form.id) === String(formId));

    if (formById) return formById;

    const formByPositionId = forms.find(
      (form) => String(form.positionId) === String(positionId),
    );

    if (formByPositionId) return formByPositionId;

    const activeFormWithFields = forms.find(
      (form) =>
        form.status === "Active" &&
        Array.isArray(form.fields) &&
        form.fields.length > 0,
    );

    if (activeFormWithFields) return activeFormWithFields;

    const anyFormWithFields = forms.find(
      (form) => Array.isArray(form.fields) && form.fields.length > 0,
    );

    if (anyFormWithFields) return anyFormWithFields;

    return forms[0];
  }, [settings, formId, positionId, savedSubmission]);

  const groupedFields = useMemo(() => {
    return groupFieldsBySection(activeForm?.fields || []);
  }, [activeForm]);

  useEffect(() => {
    if (savedSubmission?.answers) {
      setAnswers(savedSubmission.answers);
    }
  }, [savedSubmission]);

  function handleAnswerChange(fieldId, value) {
    if (isViewMode) return;

    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  }

  function validateRequiredFields() {
    const requiredFields = (activeForm?.fields || []).filter(
      (field) => field.enabled !== false && field.required,
    );

    const missingField = requiredFields.find((field) => {
      const value = answers[field.id];

      if (typeof value === "boolean") return false;

      return (
        value === undefined || value === null || String(value).trim() === ""
      );
    });

    if (missingField) {
      alert(`Please answer required question: ${missingField.label}`);
      return false;
    }

    return true;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (isViewMode) {
      navigate(-1);
      return;
    }

    if (isSubmitting) return;

    if (!validateRequiredFields()) return;

    setIsSubmitting(true);

    const didUpdateCandidate = handleSubmitFinalInterview({
      candidateId,
      candidateApplicationId,
      positionId,
      formId: formId || activeForm?.id || "",
      formName: activeForm?.name || "Final Interview Form",
      answers,
      fieldsSnapshot: activeForm?.fields || [],
    });

    console.log("Final Interview Answers:", {
      candidateId,
      candidateApplicationId,
      positionId,
      formId: formId || activeForm?.id || "",
      formName: activeForm?.name || "Final Interview Form",
      answers,
      didUpdateCandidate,
    });

    if (!didUpdateCandidate) {
      alert(
        "Interview form submitted, but the candidate record was not found in the pipeline.",
      );
      setIsSubmitting(false);
      return;
    }

    alert("Interview form submitted. Candidate moved to Interviewed.");

    navigate(-1);
  }

  return (
    <div className="min-h-screen bg-[#E9EEF5] px-4 py-8 font-jakarta text-sibs-primary-1">
      <div className="mx-auto max-w-[880px] space-y-5">
        <section className="rounded-2xl border border-[#E6ECF2] bg-white p-6 shadow-sm">
          <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
            {isViewMode ? "Submitted Final Interview" : "Final Interview"}
          </div>

          <h1 className="mt-4 text-2xl font-extrabold text-sibs-primary-1">
            {activeForm?.name || "Final Interview Form"}
          </h1>

          <p className="mt-2 text-sm font-semibold text-sibs-primary-1">
            Candidate ID: {candidateId} · Application ID:{" "}
            {candidateApplicationId}
          </p>

          {savedSubmission && (
            <p className="mt-2 text-xs font-bold text-sibs-tertiary-5">
              Submitted by {savedSubmission.submittedBy} ·{" "}
              {savedSubmission.submittedAt}
            </p>
          )}
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#E6ECF2] bg-white p-8 shadow-sm"
        >
          {groupedFields.length > 0 ? (
            <div className="space-y-8">
              {groupedFields.map((group) => (
                <section key={group.section}>
                  <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#101828]">
                    {group.section}:
                  </h2>

                  <div className="mt-6 space-y-6">
                    {group.questions.map((field) => (
                      <div key={field.id}>
                        <label className="block text-base font-medium leading-8 text-sibs-primary-1">
                          {field.label}
                          {field.required && (
                            <span className="text-red-500"> *</span>
                          )}
                        </label>

                        <FieldInput
                          field={field}
                          value={answers[field.id]}
                          readOnly={isViewMode}
                          onChange={(value) =>
                            handleAnswerChange(field.id, value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#D6DEE8] bg-white px-4 py-10 text-center">
              <p className="text-sm font-extrabold text-sibs-tertiary-5">
                {isViewMode
                  ? "No saved form questions found."
                  : "No form questions available."}
              </p>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-sibs-primary-1 px-6 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
            >
              {isViewMode
                ? "Back"
                : isSubmitting
                  ? "Submitting..."
                  : "Submit Interview Form"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
