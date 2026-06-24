import React, { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";

import { useRecruitmentSettings } from "../../../services/context/RecruitmentSettingsContext";

const emptyQuestion = {
  label: "",
  type: "Rating",
  required: true,
};

export default function AddFieldCard() {
  const [open, setOpen] = useState(false);
  const [sectionTitle, setSectionTitle] = useState("");
  const [questions, setQuestions] = useState([{ ...emptyQuestion }]);

  const {
    newField,
    fieldTypes,
    editingFieldId,
    handleAddFieldGroup,
    handleUpdateFieldFromModal,
    handleCancelFieldEdit,
  } = useRecruitmentSettings();

  const isEditing = Boolean(editingFieldId);

  useEffect(() => {
    if (isEditing) {
      setOpen(true);
      setSectionTitle(newField.section || "");
      setQuestions([
        {
          label: newField.label || "",
          type: newField.type || "Rating",
          required: Boolean(newField.required),
        },
      ]);
    }
  }, [isEditing, newField]);

  const previewTitle = sectionTitle || "INDEPENDENCE & INITIATIVE";

  const validQuestionCount = useMemo(() => {
    return questions.filter((question) => question.label.trim()).length;
  }, [questions]);

  function handleOpen() {
    setSectionTitle("");
    setQuestions([{ ...emptyQuestion }]);
    setOpen(true);
  }

  function handleClose() {
    handleCancelFieldEdit?.();
    setSectionTitle("");
    setQuestions([{ ...emptyQuestion }]);
    setOpen(false);
  }

  function updateQuestion(index, patch) {
    setQuestions((prev) =>
      prev.map((question, questionIndex) =>
        questionIndex === index
          ? {
              ...question,
              ...patch,
            }
          : question,
      ),
    );
  }

  function addQuestionRow() {
    setQuestions((prev) => [...prev, { ...emptyQuestion }]);
  }

  function removeQuestionRow(index) {
    setQuestions((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, questionIndex) => questionIndex !== index);
    });
  }

  function handleSubmit() {
    const cleanSection = sectionTitle.trim();

    if (!cleanSection) return;

    if (isEditing) {
      const firstQuestion = questions[0];

      if (!firstQuestion?.label?.trim()) return;

      const saved = handleUpdateFieldFromModal(editingFieldId, {
        section: cleanSection,
        label: firstQuestion.label.trim(),
        type: firstQuestion.type || "Rating",
        required: Boolean(firstQuestion.required),
      });

      if (saved) {
        handleClose();
      }

      return;
    }

    const saved = handleAddFieldGroup(cleanSection, questions);

    if (saved) {
      handleClose();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-200 bg-blue-50/60 text-sm font-extrabold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
      >
        <Plus size={18} />
        Add Field
      </button>

      {open && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/45 p-4">
          <div className="flex max-h-[92vh] w-full max-w-[1280px] flex-col overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E6ECF2] px-6 py-5">
              <div>
                <h3 className="text-lg font-extrabold text-[#101828]">
                  {isEditing ? "Edit Form Question" : "Add Form Questions"}
                </h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-sibs-tertiary-5">
                  Create one title and add one or more questions under it.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] p-6">
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
                <div className="space-y-5">
                  <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                    <label className="mb-1 block text-sm font-bold text-[#101828]">
                      Title <span className="text-red-500">*</span>
                    </label>

                    <input
                      value={sectionTitle}
                      onChange={(e) => setSectionTitle(e.target.value)}
                      placeholder="Example: INDEPENDENCE & INITIATIVE"
                      className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold uppercase text-sibs-primary-1 outline-none transition placeholder:normal-case placeholder:text-[#98A2B3] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                    />
                  </div>

                  <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-base font-extrabold text-[#101828]">
                          Questions
                        </h4>
                        <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                          {isEditing
                            ? "Editing supports one question at a time."
                            : "Add multiple questions under the same title."}
                        </p>
                      </div>

                      {!isEditing && (
                        <button
                          type="button"
                          onClick={addQuestionRow}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                        >
                          <Plus size={16} />
                          Add Row
                        </button>
                      )}
                    </div>

                    <div className="mt-5 space-y-4">
                      {questions.map((question, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                              Question {index + 1}
                            </p>

                            {!isEditing && questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeQuestionRow(index)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="mb-1 block text-sm font-bold text-[#101828]">
                                Question Title{" "}
                                <span className="text-red-500">*</span>
                              </label>

                              <textarea
                                rows={3}
                                value={question.label}
                                onChange={(e) =>
                                  updateQuestion(index, {
                                    label: e.target.value,
                                  })
                                }
                                placeholder="Example: Discuss an experience you had at work when the expectations or goals for your performance were unclear. How did you feel and what did you do?"
                                className="w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold leading-6 text-sibs-primary-1 outline-none transition placeholder:text-[#98A2B3] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                              />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_180px]">
                              <div>
                                <label className="mb-1 block text-sm font-bold text-[#101828]">
                                  Input Type
                                </label>

                                <select
                                  value={question.type}
                                  onChange={(e) =>
                                    updateQuestion(index, {
                                      type: e.target.value,
                                    })
                                  }
                                  className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                                >
                                  {fieldTypes.map((type) => (
                                    <option key={type}>{type}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="mb-1 block text-sm font-bold text-[#101828]">
                                  Rating Scale
                                </label>

                                <select
                                  disabled={question.type !== "Rating"}
                                  className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition disabled:cursor-not-allowed disabled:border-[#E6ECF2] disabled:bg-white disabled:text-sibs-tertiary-5"
                                >
                                  <option>1 to 5</option>
                                </select>
                              </div>

                              <div className="flex flex-col justify-end">
                                <label className="flex h-12 items-center gap-3 rounded-xl border border-[#E6ECF2] bg-white px-4">
                                  <input
                                    type="checkbox"
                                    checked={question.required}
                                    onChange={(e) =>
                                      updateQuestion(index, {
                                        required: e.target.checked,
                                      })
                                    }
                                    className="h-4 w-4 accent-sibs-primary-1"
                                  />

                                  <span className="text-sm font-bold text-[#344054]">
                                    Required
                                  </span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E6ECF2] bg-[#FFFDF8] p-5 shadow-sm">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-[#101828]">
                    Preview
                  </p>

                  <div className="mt-5 rounded-xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-extrabold uppercase text-[#101828]">
                      {previewTitle}:
                    </p>

                    <div className="mt-5 space-y-5">
                      {questions.map((question, index) => (
                        <div key={index}>
                          <p className="text-sm font-medium leading-7 text-sibs-primary-1">
                            {question.label ||
                              "Discuss an experience you had at work when the expectations or goals for your performance were unclear. How did you feel and what did you do?"}
                            {question.required && (
                              <span className="text-red-500"> *</span>
                            )}
                          </p>

                          {question.type === "Rating" ? (
                            <select className="mt-2 h-11 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 text-sm font-semibold text-[#344054] outline-none">
                              <option value="">Select rating</option>
                              <option>1</option>
                              <option>2</option>
                              <option>3</option>
                              <option>4</option>
                              <option>5</option>
                            </select>
                          ) : question.type === "Paragraph" ? (
                            <textarea
                              disabled
                              rows={3}
                              placeholder="Paragraph answer"
                              className="mt-2 w-full resize-none rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm font-semibold text-[#344054] outline-none"
                            />
                          ) : (
                            <input
                              disabled
                              placeholder={question.type}
                              className="mt-2 h-11 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 text-sm font-semibold text-[#344054] outline-none"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="mt-4 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                    {validQuestionCount} question
                    {validQuestionCount === 1 ? "" : "s"} will be saved under
                    this title.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t border-[#E6ECF2] bg-white px-6 py-4">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-6 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95"
              >
                {isEditing ? <Save size={18} /> : <Plus size={18} />}
                {isEditing ? "Save Changes" : "Save Questions"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
