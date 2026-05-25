import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

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

function FieldInput({ field, value, onChange }) {
  if (field.type === "Rating") {
    return (
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-11 w-full rounded-lg border border-[#B8C2CF] bg-white px-3 text-sm font-semibold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
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
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type answer here..."
        className="mt-2 w-full resize-none rounded-lg border border-[#B8C2CF] bg-white px-3 py-2 text-sm font-semibold text-[#344054] outline-none transition placeholder:text-[#98A2B3] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
      />
    );
  }

  if (field.type === "Dropdown") {
    return (
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-11 w-full rounded-lg border border-[#B8C2CF] bg-white px-3 text-sm font-semibold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
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
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter number..."
        className="mt-2 h-11 w-full rounded-lg border border-[#B8C2CF] bg-white px-3 text-sm font-semibold text-[#344054] outline-none transition placeholder:text-[#98A2B3] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
      />
    );
  }

  if (field.type === "Date") {
    return (
      <input
        type="date"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-11 w-full rounded-lg border border-[#B8C2CF] bg-white px-3 text-sm font-semibold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
      />
    );
  }

  if (field.type === "Checkbox") {
    return (
      <label className="mt-2 flex h-11 items-center gap-3 rounded-lg border border-[#B8C2CF] bg-white px-3 text-sm font-semibold text-[#344054]">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-sibs-primary-1"
        />
        Yes
      </label>
    );
  }

  return (
    <input
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type answer here..."
      className="mt-2 h-11 w-full rounded-lg border border-[#B8C2CF] bg-white px-3 text-sm font-semibold text-[#344054] outline-none transition placeholder:text-[#98A2B3] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
    />
  );
}

export default function FinalInterviewForms() {
  const [searchParams] = useSearchParams();

  const candidateId = searchParams.get("candidateId") || "—";
  const candidateApplicationId =
    searchParams.get("candidateApplicationId") || "—";
  const positionId = searchParams.get("positionId");
  const formId = searchParams.get("formId");

  const [answers, setAnswers] = useState({});

  const settings = useMemo(() => safeReadSettings(), []);

  const activeForm = useMemo(() => {
    if (!settings?.forms?.length) return null;

    return (
      settings.forms.find((form) => form.id === formId) ||
      settings.forms.find((form) => form.positionId === positionId) ||
      settings.forms[0]
    );
  }, [settings, formId, positionId]);

  const groupedFields = useMemo(() => {
    return groupFieldsBySection(activeForm?.fields || []);
  }, [activeForm]);

  function handleAnswerChange(fieldId, value) {
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    console.log("Final Interview Answers:", {
      candidateId,
      candidateApplicationId,
      positionId,
      formId,
      answers,
    });

    alert("Interview form submitted.");
  }

  return (
    <div className="min-h-screen bg-[#E9EEF5] px-4 py-8 font-jakarta text-sibs-primary-1">
      <div className="mx-auto max-w-[880px] space-y-5">
        <section className="rounded-2xl border border-[#E6ECF2] bg-white p-6 shadow-sm">
          <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
            Final Interview
          </div>

          <h1 className="mt-4 text-2xl font-extrabold text-sibs-primary-1">
            {activeForm?.name || "Final Interview Form"}
          </h1>

          <p className="mt-2 text-sm font-semibold text-sibs-primary-1">
            Candidate ID: {candidateId} · Application ID:{" "}
            {candidateApplicationId}
          </p>
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
                No form questions available.
              </p>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-sibs-primary-1 px-6 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95"
            >
              Submit Interview Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
