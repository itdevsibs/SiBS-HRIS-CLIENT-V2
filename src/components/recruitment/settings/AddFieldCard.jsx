import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Loader2, Plus, Save, Trash2, X } from "lucide-react";

import { useRecruitmentSettings } from "../../../services/context/RecruitmentSettingsContext";

const FALLBACK_FIELD_TYPES = [
  "Rating",
  "Text",
  "Paragraph",
  "Dropdown",
  "Checkbox",
  "Number",
  "Date",
];

const RATING_SCALE_OPTIONS = [{ value: "1-5", label: "1 to 5" }];

function createQuestionRow(overrides = {}) {
  return {
    rowId: `question-row-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    label: "",
    type: "Rating",
    ratingScale: "1-5",
    ...overrides,
  };
}

function normalizeFieldTypeOptions(fieldTypes = []) {
  const rawOptions = Array.isArray(fieldTypes) ? fieldTypes : [];

  const normalized = rawOptions
    .map((item) => {
      if (typeof item === "string") {
        const value = item.trim();
        return value ? { value, label: value } : null;
      }

      if (!item || typeof item !== "object") return null;

      const value = String(
        item.value || item.type || item.key || item.label || "",
      ).trim();

      const label = String(item.label || item.name || value).trim();

      return value ? { value, label: label || value } : null;
    })
    .filter(Boolean);

  const options = normalized.length
    ? normalized
    : FALLBACK_FIELD_TYPES.map((value) => ({ value, label: value }));

  const seen = new Set();

  return options.filter((option) => {
    const key = option.value.toLowerCase();

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function SelectField({
  value,
  options = [],
  onChange,
  disabled = false,
  ariaLabel = "Select option",
}) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-12 w-full appearance-none rounded-xl border border-[#D0D5DD] bg-white pl-4 pr-11 text-sm font-bold text-[#344054] outline-none transition hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#98A2B3]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={17}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sibs-primary-1"
      />
    </div>
  );
}

function PreviewAnswerControl({ type }) {
  const normalizedType = String(type || "Text").trim().toLowerCase();

  if (normalizedType === "rating") {
    return (
      <SelectField
        value=""
        disabled
        ariaLabel="Preview rating"
        options={[
          { value: "", label: "Select rating" },
          { value: "1", label: "1 - Poor" },
          { value: "2", label: "2 - Fair" },
          { value: "3", label: "3 - Good" },
          { value: "4", label: "4 - Very Good" },
          { value: "5", label: "5 - Excellent" },
        ]}
      />
    );
  }

  if (normalizedType === "paragraph") {
    return (
      <textarea
        rows={3}
        disabled
        placeholder="Type answer here..."
        className="w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-[#344054] outline-none placeholder:text-[#98A2B3] disabled:bg-[#F8FAFC]"
      />
    );
  }

  if (normalizedType === "dropdown") {
    return (
      <SelectField
        value=""
        disabled
        ariaLabel="Preview dropdown"
        options={[{ value: "", label: "Select answer" }]}
      />
    );
  }

  if (normalizedType === "checkbox") {
    return (
      <label className="flex h-12 items-center gap-3 rounded-xl border border-[#D0D5DD] bg-[#F8FAFC] px-4 text-sm font-bold text-[#475467]">
        <input type="checkbox" disabled className="h-4 w-4" />
        Yes
      </label>
    );
  }

  if (normalizedType === "date") {
    return (
      <input
        type="date"
        disabled
        className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-[#F8FAFC] px-4 text-sm font-semibold text-[#475467] outline-none"
      />
    );
  }

  if (normalizedType === "number") {
    return (
      <input
        type="number"
        disabled
        placeholder="Enter number..."
        className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-[#F8FAFC] px-4 text-sm font-semibold text-[#475467] outline-none placeholder:text-[#98A2B3]"
      />
    );
  }

  return (
    <input
      type="text"
      disabled
      placeholder="Type answer here..."
      className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-[#F8FAFC] px-4 text-sm font-semibold text-[#475467] outline-none placeholder:text-[#98A2B3]"
    />
  );
}

function QuestionPreview({ sectionTitle, questions }) {
  const completedQuestions = questions.filter((question) =>
    String(question.label || "").trim(),
  );

  return (
    <aside className="flex min-h-0 flex-col rounded-2xl border border-[#E4E7EC] bg-[#FFFCF7] p-5 shadow-sm">
      <p className="text-xs font-extrabold uppercase tracking-wide text-[#101828]">
        Preview
      </p>

      <div className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm sibs-scrollbar">
        <h3 className="break-words text-sm font-extrabold uppercase leading-6 text-[#101828]">
          {String(sectionTitle || "").trim() || "QUESTION TITLE"}:
        </h3>

        {completedQuestions.length ? (
          completedQuestions.map((question, index) => (
            <div key={question.rowId} className="space-y-3">
              <p className="break-words text-sm font-semibold leading-7 text-sibs-primary-1">
                {question.label}
              </p>

              <PreviewAnswerControl type={question.type} />

              {index < completedQuestions.length - 1 && (
                <div className="border-t border-[#EAECF0] pt-1" />
              )}
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-[#D0D5DD] bg-[#F8FAFC] px-4 py-8 text-center">
            <p className="text-sm font-bold text-[#667085]">
              Enter a question title to display its preview.
            </p>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs font-bold text-[#175CD3]">
        {completedQuestions.length} question
        {completedQuestions.length === 1 ? "" : "s"} will be saved under this
        title.
      </p>
    </aside>
  );
}

export default function AddFieldCard() {
  const {
    activePosition,
    fieldTypes,
    newField,
    editingFieldId,
    questionsSaving,
    questionsSaveError,
    handleAddFieldGroup,
    handleUpdateFieldFromModal,
    handleCancelFieldEdit,
  } = useRecruitmentSettings();

  const [open, setOpen] = useState(false);
  const [sectionTitle, setSectionTitle] = useState("");
  const [questions, setQuestions] = useState(() => [createQuestionRow()]);
  const [errorMessage, setErrorMessage] = useState("");
  const editingIdRef = useRef(null);

  const typeOptions = useMemo(
    () => normalizeFieldTypeOptions(fieldTypes),
    [fieldTypes],
  );

  useEffect(() => {
    if (!editingFieldId) {
      editingIdRef.current = null;
      return;
    }

    if (editingIdRef.current === editingFieldId && open) return;

    editingIdRef.current = editingFieldId;
    setSectionTitle(String(newField?.section || ""));
    setQuestions([
      createQuestionRow({
        label: String(newField?.label || ""),
        type: String(newField?.type || "Rating"),
      }),
    ]);
    setErrorMessage("");
    setOpen(true);
  }, [editingFieldId, newField, open]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;

    const body = document.body;
    const html = document.documentElement;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = html.style.overflow;

    body.style.overflow = "hidden";
    html.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape" && !questionsSaving) {
        closeModal();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      body.style.overflow = previousBodyOverflow;
      html.style.overflow = previousHtmlOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, questionsSaving]);

  function resetModalState() {
    setSectionTitle("");
    setQuestions([createQuestionRow()]);
    setErrorMessage("");
    editingIdRef.current = null;
  }

  function openAddModal() {
    if (!activePosition || questionsSaving) return;

    handleCancelFieldEdit?.();
    resetModalState();
    setOpen(true);
  }

  function closeModal() {
    if (questionsSaving) return;

    setOpen(false);
    handleCancelFieldEdit?.();
    resetModalState();
  }

  function updateQuestion(rowId, patch) {
    setQuestions((previous) =>
      previous.map((question) =>
        question.rowId === rowId
          ? {
              ...question,
              ...patch,
            }
          : question,
      ),
    );

    setErrorMessage("");
  }

  function addQuestionRow() {
    setQuestions((previous) => [...previous, createQuestionRow()]);
    setErrorMessage("");
  }

  function removeQuestionRow(rowId) {
    setQuestions((previous) => {
      if (previous.length <= 1) {
        return [createQuestionRow()];
      }

      return previous.filter((question) => question.rowId !== rowId);
    });

    setErrorMessage("");
  }

  async function handleSave() {
    const cleanSectionTitle = String(sectionTitle || "").trim();
    const cleanQuestions = questions.map((question) => ({
      label: String(question.label || "").trim(),
      type: String(question.type || "Rating").trim() || "Rating",
      required: false,
    }));

    if (!cleanSectionTitle) {
      setErrorMessage("Title is required.");
      return;
    }

    const firstEmptyQuestionIndex = cleanQuestions.findIndex(
      (question) => !question.label,
    );

    if (firstEmptyQuestionIndex >= 0) {
      setErrorMessage(
        `Question ${firstEmptyQuestionIndex + 1} title is required.`,
      );
      return;
    }

    if (!cleanQuestions.length) {
      setErrorMessage("Add at least one question.");
      return;
    }

    try {
      setErrorMessage("");

      const result = editingFieldId
        ? await Promise.resolve(
            handleUpdateFieldFromModal?.(editingFieldId, {
              section: cleanSectionTitle,
              label: cleanQuestions[0].label,
              type: cleanQuestions[0].type,
              required: false,
            }),
          )
        : await Promise.resolve(
            handleAddFieldGroup?.(cleanSectionTitle, cleanQuestions),
          );

      if (result === false) {
        setErrorMessage(
          questionsSaveError || "The questions could not be saved.",
        );
        return;
      }

      setOpen(false);
      resetModalState();
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "The questions could not be saved.",
      );
    }
  }

  const modal = open ? (
    <div className="fixed inset-0 z-[100000] overflow-y-auto bg-[#0F172A]/45 p-0 backdrop-blur-[1px] sm:p-4">
      <div className="flex min-h-full items-center justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-form-questions-title"
          className="flex h-dvh w-full max-w-[1280px] flex-col overflow-hidden bg-white shadow-2xl sm:h-[min(860px,calc(100vh-32px))] sm:rounded-2xl"
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E4E7EC] px-6 py-4">
            <div className="min-w-0">
              <h2
                id="add-form-questions-title"
                className="text-xl font-extrabold text-[#101828]"
              >
                {editingFieldId ? "Edit Form Question" : "Add Form Questions"}
              </h2>

              <p className="mt-1 text-sm font-semibold text-[#2E5B89]">
                {editingFieldId
                  ? "Update the title, question, and input type."
                  : "Create one title and add one or more questions under it."}
              </p>
            </div>

            <button
              type="button"
              onClick={closeModal}
              disabled={questionsSaving}
              aria-label="Close question modal"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X size={19} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] p-5 sm:p-6 sibs-scrollbar">
            <div className="grid min-h-full grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="space-y-5">
                <section className="rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-sm">
                  <label className="block text-sm font-extrabold text-[#101828]">
                    Title <span className="text-red-500">*</span>
                  </label>

                  <input
                    value={sectionTitle}
                    disabled={questionsSaving}
                    onChange={(event) => {
                      setSectionTitle(event.target.value);
                      setErrorMessage("");
                    }}
                    placeholder="Example: INDEPENDENCE & INITIATIVE"
                    className="mt-2 h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition placeholder:text-[#98A2B3] hover:border-sibs-primary-1/30 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7]"
                  />
                </section>

                <section className="rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-extrabold text-[#101828]">
                        Questions
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-[#2E5B89]">
                        Add multiple questions under the same title.
                      </p>
                    </div>

                    {!editingFieldId && (
                      <button
                        type="button"
                        onClick={addQuestionRow}
                        disabled={questionsSaving}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-5 text-sm font-extrabold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Plus size={17} />
                        Add Row
                      </button>
                    )}
                  </div>

                  <div className="mt-5 space-y-4">
                    {questions.map((question, questionIndex) => (
                      <div
                        key={question.rowId}
                        className="rounded-2xl border border-[#DCE4ED] bg-[#F8FAFC] p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                            Question {questionIndex + 1}
                          </p>

                          {!editingFieldId && questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuestionRow(question.rowId)}
                              disabled={questionsSaving}
                              aria-label={`Remove question ${questionIndex + 1}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        <label className="mt-4 block text-sm font-extrabold text-[#101828]">
                          Question Title <span className="text-red-500">*</span>
                        </label>

                        <textarea
                          rows={3}
                          value={question.label}
                          disabled={questionsSaving}
                          onChange={(event) =>
                            updateQuestion(question.rowId, {
                              label: event.target.value,
                            })
                          }
                          placeholder="Example: Discuss an experience you had at work when the expectations or goals for your performance were unclear. How did you feel and what did you do?"
                          className="mt-2 min-h-[98px] w-full resize-y rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#344054] outline-none transition placeholder:text-[#98A2B3] hover:border-sibs-primary-1/30 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7]"
                        />

                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-extrabold text-[#101828]">
                              Input Type
                            </label>

                            <SelectField
                              value={question.type}
                              options={typeOptions}
                              disabled={questionsSaving}
                              ariaLabel={`Question ${questionIndex + 1} input type`}
                              onChange={(nextType) =>
                                updateQuestion(question.rowId, {
                                  type: nextType,
                                })
                              }
                            />
                          </div>

                          {String(question.type).toLowerCase() === "rating" && (
                            <div>
                              <label className="mb-2 block text-sm font-extrabold text-[#101828]">
                                Rating Scale
                              </label>

                              <SelectField
                                value={question.ratingScale}
                                options={RATING_SCALE_OPTIONS}
                                disabled
                                ariaLabel={`Question ${questionIndex + 1} rating scale`}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {(errorMessage || questionsSaveError) && (
                    <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-600">
                      {errorMessage || questionsSaveError}
                    </div>
                  )}
                </section>
              </div>

              <QuestionPreview
                sectionTitle={sectionTitle}
                questions={questions}
              />
            </div>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-[#E4E7EC] bg-white px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              disabled={questionsSaving}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D0D5DD] bg-white px-5 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={questionsSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-6 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
            >
              {questionsSaving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : editingFieldId ? (
                <Save size={17} />
              ) : (
                <Plus size={17} />
              )}

              {questionsSaving
                ? "Saving..."
                : editingFieldId
                  ? "Save Changes"
                  : "Save Questions"}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={openAddModal}
        disabled={!activePosition || questionsSaving}
        className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 px-5 text-sm font-extrabold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {questionsSaving ? (
          <Loader2 size={17} className="animate-spin" />
        ) : (
          <Plus size={18} />
        )}
        {questionsSaving ? "Saving Questions..." : "Add Field"}
      </button>

      {typeof document !== "undefined" && modal
        ? createPortal(modal, document.body)
        : null}
    </>
  );
}
