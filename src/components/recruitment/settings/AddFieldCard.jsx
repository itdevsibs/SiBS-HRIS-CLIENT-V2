import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

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

const RATING_SCALE_OPTIONS = [
  {
    value: "1-5",
    label: "1 to 5",
  },
];

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
  const rawOptions = Array.isArray(fieldTypes)
    ? fieldTypes
    : [];

  const normalized = rawOptions
    .map((item) => {
      if (typeof item === "string") {
        const value = item.trim();

        return value
          ? {
              value,
              label: value,
            }
          : null;
      }

      if (!item || typeof item !== "object") {
        return null;
      }

      const value = String(
        item.value ||
          item.type ||
          item.key ||
          item.label ||
          "",
      ).trim();

      const label = String(
        item.label ||
          item.name ||
          value,
      ).trim();

      return value
        ? {
            value,
            label: label || value,
          }
        : null;
    })
    .filter(Boolean);

  const options = normalized.length
    ? normalized
    : FALLBACK_FIELD_TYPES.map((value) => ({
        value,
        label: value,
      }));

  const seen = new Set();

  return options.filter((option) => {
    const key = option.value.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

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
        onChange={(event) =>
          onChange?.(event.target.value)
        }
        className="
          h-10
          w-full
          cursor-pointer
          appearance-none
          rounded-[10px]
          border
          border-[#D6E0EA]
          bg-[#F8FAFC]
          pl-3.5
          pr-10
          text-xs
          font-bold
          text-[#183B61]
          outline-none
          transition
          hover:border-[#AFC8E0]
          hover:bg-white
          focus:border-[#0B3C68]
          focus:bg-white
          focus:ring-4
          focus:ring-[#0B3C68]/10
          disabled:cursor-not-allowed
          disabled:bg-[#F2F4F7]
          disabled:text-[#98A2B3]
        "
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={15}
        className="
          pointer-events-none
          absolute
          right-3.5
          top-1/2
          -translate-y-1/2
          text-[#0B3C68]
        "
      />
    </div>
  );
}

/* =====================================================
   AUTO RESIZE QUESTION TEXTAREA

   - Minimum 7 visible lines
   - Automatically expands based on content
   - No manual resizing
   - No internal scrollbar
===================================================== */

function AutoResizeQuestionTextarea({
  value,
  onChange,
  disabled = false,
  placeholder = "",
}) {
  const textareaRef = useRef(null);

  const MIN_HEIGHT = 164;

  function resizeTextarea(textarea) {
    if (!textarea) return;

    textarea.style.height = "auto";

    const nextHeight = Math.max(
      textarea.scrollHeight,
      MIN_HEIGHT,
    );

    textarea.style.height = `${nextHeight}px`;
  }

  useEffect(() => {
    resizeTextarea(textareaRef.current);
  }, [value]);

  function handleChange(event) {
    resizeTextarea(event.currentTarget);

    onChange?.(event);
  }

  function handleInput(event) {
    resizeTextarea(event.currentTarget);
  }

  return (
    <textarea
      ref={textareaRef}
      rows={7}
      value={value}
      disabled={disabled}
      onChange={handleChange}
      onInput={handleInput}
      placeholder={placeholder}
      className="
        mt-2
        min-h-[164px]
        w-full
        resize-none
        overflow-hidden
        rounded-[10px]
        border
        border-[#D6E0EA]
        bg-white
        px-3
        py-3
        text-xs
        font-medium
        leading-5
        text-[#273B53]
        outline-none
        transition
        placeholder:text-[#98A2B3]
        hover:border-[#AFC8E0]
        focus:border-[#073B68]
        focus:ring-4
        focus:ring-[#073B68]/10
        disabled:cursor-not-allowed
        disabled:bg-[#F2F4F7]
      "
    />
  );
}

function PreviewRatingControl() {
  return (
    <div>
      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-[#9AAAC0]">
        Rating Scale (1 to 5)
      </p>

      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((rating) => {
          const active = rating === 4;

          return (
            <div
              key={rating}
              className={`flex h-9 w-11 items-center justify-center rounded-lg border text-xs font-extrabold ${
                active
                  ? "border-[#073B68] bg-[#073B68] text-white"
                  : "border-[#D6E0EA] bg-[#F8FAFC] text-[#40536B]"
              }`}
            >
              {rating}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PreviewAnswerControl({ type }) {
  const normalizedType = String(
    type || "Text",
  )
    .trim()
    .toLowerCase();

  if (normalizedType === "rating") {
    return <PreviewRatingControl />;
  }

  if (normalizedType === "paragraph") {
    return (
      <textarea
        rows={3}
        disabled
        placeholder="Type answer here..."
        className="
          w-full
          resize-none
          rounded-[10px]
          border
          border-[#D6E0EA]
          bg-[#F8FAFC]
          px-3
          py-2.5
          text-xs
          font-semibold
          text-[#40536B]
          outline-none
          placeholder:text-[#98A2B3]
        "
      />
    );
  }

  if (normalizedType === "dropdown") {
    return (
      <SelectField
        value=""
        disabled
        ariaLabel="Preview dropdown"
        options={[
          {
            value: "",
            label: "Select answer",
          },
        ]}
      />
    );
  }

  if (normalizedType === "checkbox") {
    return (
      <label className="flex h-10 items-center gap-3 rounded-[10px] border border-[#D6E0EA] bg-[#F8FAFC] px-3 text-xs font-bold text-[#40536B]">
        <input
          type="checkbox"
          disabled
          className="h-4 w-4"
        />
        Yes
      </label>
    );
  }

  if (normalizedType === "date") {
    return (
      <input
        type="date"
        disabled
        className="h-10 w-full rounded-[10px] border border-[#D6E0EA] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#40536B] outline-none"
      />
    );
  }

  if (normalizedType === "number") {
    return (
      <input
        type="number"
        disabled
        placeholder="Enter number..."
        className="h-10 w-full rounded-[10px] border border-[#D6E0EA] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#40536B] outline-none placeholder:text-[#98A2B3]"
      />
    );
  }

  return (
    <input
      type="text"
      disabled
      placeholder="Type answer here..."
      className="h-10 w-full rounded-[10px] border border-[#D6E0EA] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#40536B] outline-none placeholder:text-[#98A2B3]"
    />
  );
}

function QuestionPreview({
  sectionTitle,
  questions,
}) {
  const completedQuestions = questions.filter(
    (question) =>
      String(question.label || "").trim(),
  );

  return (
    <aside className="flex min-h-0 flex-col rounded-2xl border border-[#DCE4ED] bg-white p-5 shadow-[0_8px_22px_rgba(4,44,81,0.05)]">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#9AAAC0]">
        Preview
      </p>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-xl border border-[#E5EBF2] bg-[#FAFBFC] p-4 sibs-scrollbar">
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#9AAAC0]">
          Question Title:
        </p>

        <h3 className="mt-1 break-words text-xs font-extrabold uppercase leading-5 text-[#073B68]">
          {String(sectionTitle || "").trim() ||
            "QUESTION TITLE"}
        </h3>

        <div className="mt-3 space-y-4">
          {completedQuestions.length ? (
            completedQuestions.map(
              (question, index) => (
                <div
                  key={question.rowId}
                  className="rounded-xl border-2 border-dashed border-[#E0E7EF] bg-white p-4"
                >
                  <p className="break-words text-xs font-bold leading-5 text-[#173B61]">
                    {question.label}
                  </p>

                  <div className="mt-5">
                    <PreviewAnswerControl
                      type={question.type}
                    />
                  </div>

                  {index <
                    completedQuestions.length -
                      1 && (
                    <div className="mt-4 border-t border-[#E7EDF3]" />
                  )}
                </div>
              ),
            )
          ) : (
            <div className="rounded-xl border-2 border-dashed border-[#E0E7EF] bg-white px-4 py-8 text-center">
              <p className="text-xs font-bold leading-5 text-[#7C8EA3]">
                Enter a question title to
                display its preview.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[#CFE0FF] bg-[#EEF5FF] px-4 py-3 text-center">
        <p className="text-xs font-bold text-[#244CC8]">
          {completedQuestions.length}{" "}
          question
          {completedQuestions.length === 1
            ? ""
            : "s"}{" "}
          will be saved under this title.
        </p>
      </div>
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

  const [sectionTitle, setSectionTitle] =
    useState("");

  const [questions, setQuestions] =
    useState(() => [
      createQuestionRow(),
    ]);

  const [errorMessage, setErrorMessage] =
    useState("");

  const editingIdRef = useRef(null);

  const typeOptions = useMemo(
    () =>
      normalizeFieldTypeOptions(
        fieldTypes,
      ),
    [fieldTypes],
  );

  useEffect(() => {
    if (!editingFieldId) {
      editingIdRef.current = null;
      return;
    }

    if (
      editingIdRef.current ===
        editingFieldId &&
      open
    ) {
      return;
    }

    editingIdRef.current =
      editingFieldId;

    setSectionTitle(
      String(newField?.section || ""),
    );

    setQuestions([
      createQuestionRow({
        label: String(
          newField?.label || "",
        ),

        type: String(
          newField?.type || "Rating",
        ),
      }),
    ]);

    setErrorMessage("");

    setOpen(true);
  }, [
    editingFieldId,
    newField,
    open,
  ]);

  useEffect(() => {
    if (
      !open ||
      typeof document === "undefined"
    ) {
      return undefined;
    }

    const body = document.body;

    const html =
      document.documentElement;

    const previousBodyOverflow =
      body.style.overflow;

    const previousHtmlOverflow =
      html.style.overflow;

    body.style.overflow = "hidden";

    html.style.overflow = "hidden";

    function handleEscape(event) {
      if (
        event.key === "Escape" &&
        !questionsSaving
      ) {
        closeModal();
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      body.style.overflow =
        previousBodyOverflow;

      html.style.overflow =
        previousHtmlOverflow;

      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [open, questionsSaving]);

  function resetModalState() {
    setSectionTitle("");

    setQuestions([
      createQuestionRow(),
    ]);

    setErrorMessage("");

    editingIdRef.current = null;
  }

  function openAddModal() {
    if (
      !activePosition ||
      questionsSaving
    ) {
      return;
    }

    handleCancelFieldEdit?.();

    resetModalState();

    setOpen(true);
  }

  function closeModal() {
    if (questionsSaving) {
      return;
    }

    setOpen(false);

    handleCancelFieldEdit?.();

    resetModalState();
  }

  function updateQuestion(
    rowId,
    patch,
  ) {
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
    setQuestions((previous) => [
      ...previous,
      createQuestionRow(),
    ]);

    setErrorMessage("");
  }

  function removeQuestionRow(rowId) {
    setQuestions((previous) => {
      if (previous.length <= 1) {
        return [
          createQuestionRow(),
        ];
      }

      return previous.filter(
        (question) =>
          question.rowId !== rowId,
      );
    });

    setErrorMessage("");
  }

  async function handleSave() {
    const cleanSectionTitle =
      String(
        sectionTitle || "",
      ).trim();

    const cleanQuestions =
      questions.map((question) => ({
        label: String(
          question.label || "",
        ).trim(),

        type:
          String(
            question.type || "Rating",
          ).trim() || "Rating",

        required: false,
      }));

    if (!cleanSectionTitle) {
      setErrorMessage(
        "Title is required.",
      );

      return;
    }

    const firstEmptyQuestionIndex =
      cleanQuestions.findIndex(
        (question) =>
          !question.label,
      );

    if (
      firstEmptyQuestionIndex >= 0
    ) {
      setErrorMessage(
        `Question ${
          firstEmptyQuestionIndex + 1
        } title is required.`,
      );

      return;
    }

    if (!cleanQuestions.length) {
      setErrorMessage(
        "Add at least one question.",
      );

      return;
    }

    try {
      setErrorMessage("");

      const result = editingFieldId
        ? await Promise.resolve(
            handleUpdateFieldFromModal?.(
              editingFieldId,
              {
                section:
                  cleanSectionTitle,

                label:
                  cleanQuestions[0]
                    .label,

                type:
                  cleanQuestions[0]
                    .type,

                required: false,
              },
            ),
          )
        : await Promise.resolve(
            handleAddFieldGroup?.(
              cleanSectionTitle,
              cleanQuestions,
            ),
          );

      if (result === false) {
        setErrorMessage(
          questionsSaveError ||
            "The questions could not be saved.",
        );

        return;
      }

      setOpen(false);

      resetModalState();
    } catch (error) {
      setErrorMessage(
        error?.response?.data
          ?.message ||
          error?.message ||
          "The questions could not be saved.",
      );
    }
  }

  const modal = open ? (
    <div
      className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[100000] flex items-center justify-center p-2 font-jakarta sm:p-4"
      onClick={closeModal}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-form-questions-title"
        onClick={(event) => event.stopPropagation()}
        className="sibs-modal-pop-in flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl font-jakarta"
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="flex shrink-0 items-center justify-between gap-4 bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5 font-jakarta">
          <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
            <span className="flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
              <Plus size={16} />
            </span>
            <div className="min-w-0">
              <h2
                id="add-form-questions-title"
                className="truncate text-base sm:text-lg 2xl:text-xl font-extrabold text-white"
              >
                {editingFieldId
                  ? "Edit Form Question"
                  : "Add Form Questions"}
              </h2>

              <p className="mt-0.5 truncate sibs-text-xs font-semibold text-white/75">
                {editingFieldId
                  ? "Update the title, question, and input type."
                  : "Create one title and add one or more questions under it."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={questionsSaving}
            aria-label="Close question modal"
            className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </header>

          {/* =================================================
              CONTENT
          ================================================= */}

          <div className="min-h-0 flex-1 overflow-y-auto bg-[#F6F9FC] p-5 sibs-scrollbar sm:p-6">
            <div className="grid min-h-full grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,1fr)]">
              {/* =================================================
                  LEFT SIDE
              ================================================= */}

              <div className="space-y-5">
                {/* ================= TITLE ================= */}

                <section className="rounded-2xl border border-[#DCE4ED] bg-white p-5 shadow-[0_6px_18px_rgba(4,44,81,0.04)]">
                  <label className="block text-xs font-extrabold text-[#173B61]">
                    Title{" "}
                    <span className="text-[#E5484D]">
                      *
                    </span>
                  </label>

                  <input
                    value={sectionTitle}
                    disabled={
                      questionsSaving
                    }
                    onChange={(
                      event,
                    ) => {
                      setSectionTitle(
                        event.target
                          .value,
                      );

                      setErrorMessage(
                        "",
                      );
                    }}
                    placeholder="Example: INDEPENDENCE & INITIATIVE"
                    className="
                      mt-2
                      h-10
                      w-full
                      rounded-[10px]
                      border
                      border-[#D6E0EA]
                      bg-[#F8FAFC]
                      px-3.5
                      text-xs
                      font-bold
                      text-[#173B61]
                      outline-none
                      transition
                      placeholder:text-[#98A2B3]
                      hover:border-[#AFC8E0]
                      hover:bg-white
                      focus:border-[#073B68]
                      focus:bg-white
                      focus:ring-4
                      focus:ring-[#073B68]/10
                      disabled:cursor-not-allowed
                      disabled:bg-[#F2F4F7]
                    "
                  />
                </section>

                {/* ================= QUESTIONS ================= */}

                <section className="rounded-2xl border border-[#DCE4ED] bg-white p-5 shadow-[0_6px_18px_rgba(4,44,81,0.04)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-[#173B61]">
                        Questions
                      </h3>

                      <p className="mt-0.5 text-[11px] font-medium text-[#77899F]">
                        Add multiple questions under the same title.
                      </p>
                    </div>

                    {!editingFieldId && (
                      <button
                        type="button"
                        onClick={
                          addQuestionRow
                        }
                        disabled={
                          questionsSaving
                        }
                        className="
                          inline-flex
                          h-8
                          cursor-pointer
                          items-center
                          justify-center
                          gap-1.5
                          rounded-xl
                          border
                          border-[#B8D4FF]
                          bg-[#EFF6FF]
                          px-3
                          text-xs
                          font-extrabold
                          text-[#173B61]
                          transition
                          hover:border-[#8EB8F1]
                          hover:bg-[#E6F1FF]
                          disabled:cursor-not-allowed
                          disabled:opacity-60
                        "
                      >
                        <Plus
                          size={14}
                          className="text-[#FF5C28]"
                        />

                        Add Row
                      </button>
                    )}
                  </div>

                  <div className="mt-4 space-y-4">
                    {questions.map(
                      (
                        question,
                        questionIndex,
                      ) => (
                        <div
                          key={
                            question.rowId
                          }
                          className="rounded-xl border border-[#073B68] bg-[#FAFCFE] p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#173B61]">
                              Question{" "}
                              {questionIndex +
                                1}
                            </p>

                            {!editingFieldId &&
                              questions.length >
                                1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeQuestionRow(
                                      question.rowId,
                                    )
                                  }
                                  disabled={
                                    questionsSaving
                                  }
                                  aria-label={`Remove question ${
                                    questionIndex +
                                    1
                                  }`}
                                  className="
                                    inline-flex
                                    h-8
                                    w-8
                                    cursor-pointer
                                    items-center
                                    justify-center
                                    rounded-lg
                                    border
                                    border-red-100
                                    bg-red-50
                                    text-red-500
                                    transition
                                    hover:bg-red-100
                                    disabled:cursor-not-allowed
                                    disabled:opacity-60
                                  "
                                >
                                  <Trash2
                                    size={
                                      14
                                    }
                                  />
                                </button>
                              )}
                          </div>

                          <label className="mt-3 block text-[11px] font-extrabold text-[#40536B]">
                            Question Title{" "}
                            <span className="text-[#E5484D]">
                              *
                            </span>
                          </label>

                          {/* =====================================
                              AUTO RESIZE 7-LINE TEXTAREA
                          ===================================== */}

                          <AutoResizeQuestionTextarea
                            value={
                              question.label
                            }
                            disabled={
                              questionsSaving
                            }
                            onChange={(
                              event,
                            ) =>
                              updateQuestion(
                                question.rowId,
                                {
                                  label:
                                    event
                                      .target
                                      .value,
                                },
                              )
                            }
                            placeholder="Example: Discuss an experience you had at work when the expectations or goals for your performance were unclear. How did you feel and what did you do?"
                          />

                          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div>
                              <label className="mb-1.5 block text-[11px] font-extrabold text-[#40536B]">
                                Input Type
                              </label>

                              <SelectField
                                value={
                                  question.type
                                }
                                options={
                                  typeOptions
                                }
                                disabled={
                                  questionsSaving
                                }
                                ariaLabel={`Question ${
                                  questionIndex +
                                  1
                                } input type`}
                                onChange={(
                                  nextType,
                                ) =>
                                  updateQuestion(
                                    question.rowId,
                                    {
                                      type: nextType,
                                    },
                                  )
                                }
                              />
                            </div>

                            {String(
                              question.type,
                            ).toLowerCase() ===
                              "rating" && (
                              <div>
                                <label className="mb-1.5 block text-[11px] font-extrabold text-[#40536B]">
                                  Rating Scale
                                </label>

                                <SelectField
                                  value={
                                    question.ratingScale
                                  }
                                  options={
                                    RATING_SCALE_OPTIONS
                                  }
                                  disabled
                                  ariaLabel={`Question ${
                                    questionIndex +
                                    1
                                  } rating scale`}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  {(errorMessage ||
                    questionsSaveError) && (
                    <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold leading-5 text-red-600">
                      {errorMessage ||
                        questionsSaveError}
                    </div>
                  )}
                </section>
              </div>

              {/* =================================================
                  RIGHT SIDE / PREVIEW
              ================================================= */}

              <QuestionPreview
                sectionTitle={
                  sectionTitle
                }
                questions={questions}
              />
            </div>
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="flex shrink-0 items-center justify-end gap-2.5 border-t border-[#DDE5EE] bg-[#F1F5F9] px-5 py-3 2xl:py-3.5 sm:px-6 font-jakarta">
            <button
              type="button"
              onClick={closeModal}
              disabled={questionsSaving}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#667085] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={questionsSaving}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {questionsSaving ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : editingFieldId ? (
                <Save size={15} />
              ) : (
                <Plus
                  size={15}
                />
              )}

              {questionsSaving
                ? "Saving..."
                : editingFieldId
                  ? "Save Changes"
                  : "Save Questions"}
            </button>
          </footer>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={openAddModal}
        disabled={
          !activePosition ||
          questionsSaving
        }
        className="
          mt-4
          inline-flex
          h-12
          w-full
          cursor-pointer
          items-center
          justify-center
          gap-2
          rounded-xl
          border
          border-dashed
          border-blue-200
          bg-blue-50/50
          px-5
          text-sm
          font-extrabold
          text-blue-700
          transition
          hover:border-blue-300
          hover:bg-blue-50
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >
        {questionsSaving ? (
          <Loader2
            size={17}
            className="animate-spin"
          />
        ) : (
          <Plus size={18} />
        )}

        {questionsSaving
          ? "Saving Questions..."
          : "Add Field"}
      </button>

      {typeof document !==
        "undefined" && modal
        ? createPortal(
            modal,
            document.body,
          )
        : null}
    </>
  );
}