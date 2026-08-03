import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { useJobDescription } from "../../../services/context/JobDescriptionContext";
import RichTextEditor from "./RichTextEditor";

const reportToOptions = [
  { value: "Team Supervisor", label: "Team Supervisor" },
  { value: "Operations Manager", label: "Operations Manager" },
  {
    value: "Senior Operations Manager",
    label: "Senior Operations Manager",
  },
  { value: "Department Head", label: "Department Head" },
  { value: "HR Manager", label: "HR Manager" },
];

const supervisoryOptions = ["Yes", "No"];

const personalityTypeOptions = [
  { value: "INTJ", label: "INTJ (Architect)" },
  { value: "INTP", label: "INTP (Logician)" },
  { value: "ENTJ", label: "ENTJ (Commander)" },
  { value: "ENTP", label: "ENTP (Debater)" },

  { value: "INFJ", label: "INFJ (Advocate)" },
  { value: "INFP", label: "INFP (Mediator)" },
  { value: "ENFJ", label: "ENFJ (Protagonist)" },
  { value: "ENFP", label: "ENFP (Campaigner)" },

  { value: "ISTJ", label: "ISTJ (Logistician)" },
  { value: "ISFJ", label: "ISFJ (Defender)" },
  { value: "ESTJ", label: "ESTJ (Executive)" },
  { value: "ESFJ", label: "ESFJ (Consul)" },

  { value: "ISTP", label: "ISTP (Virtuoso)" },
  { value: "ISFP", label: "ISFP (Adventurer)" },
  { value: "ESTP", label: "ESTP (Entrepreneur)" },
  { value: "ESFP", label: "ESFP (Entertainer)" },
];

const fieldLabelClass =
  "mb-1.5 block text-xs font-extrabold text-sibs-primary-1";

const fieldButtonClass =
  "flex h-10 w-full items-center justify-between gap-3 rounded-[10px] border border-sibs-tertiary-8 bg-[#F8FAFC] px-3 text-left text-xs font-semibold text-sibs-primary-1 outline-none transition hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:opacity-60";

const fieldInputClass =
  "h-10 w-full rounded-[10px] border border-sibs-tertiary-8 bg-[#F8FAFC] px-3 pr-9 text-xs font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:opacity-60";

function CompactMultiSelect({
  refBox,
  label,
  required = false,
  values = [],
  placeholder,
  open,
  setOpen,
  options,
  onChange,
  onBeforeOpen,
  zIndex = "z-20",
}) {
  const selectedOptions = options.filter((option) =>
    values.includes(option.value),
  );

  function toggleOption(optionValue) {
    if (values.includes(optionValue)) {
      onChange(values.filter((value) => value !== optionValue));
      return;
    }

    onChange([...values, optionValue]);
  }

  function removeOption(optionValue, event) {
    event.stopPropagation();
    onChange(values.filter((value) => value !== optionValue));
  }

  return (
    <div
      ref={refBox}
      className={`relative self-start ${open ? "z-[9999]" : zIndex}`}
    >
      <label className={fieldLabelClass}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <button
        type="button"
        onClick={() => {
          if (!open) {
            onBeforeOpen?.();
          }

          setOpen((previous) => !previous);
        }}
        className={`${fieldButtonClass} min-h-10 h-auto py-1.5`}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((option) => (
              <span
                key={option.value}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#D7DEE8] bg-white px-2.5 py-1 text-[10px] font-extrabold text-sibs-primary-1"
              >
                <span className="truncate">{option.label}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => removeOption(option.value, event)}
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-sibs-primary-1/70 transition hover:bg-sibs-primary-1 hover:text-white"
                >
                  <X size={11} />
                </span>
              </span>
            ))
          ) : (
            <span className="truncate text-sibs-tertiary-5">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          size={16}
          className={`shrink-0 text-sibs-primary-1 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`absolute left-0 right-0 top-full z-[9999] mt-2 grid transition-all duration-200 ease-out ${
          open
            ? "grid-rows-[1fr] opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`max-h-72 overflow-hidden rounded-[10px] border border-[#D7DEE8] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] transition-all duration-200 ease-out ${
              open ? "translate-y-0 scale-100" : "-translate-y-1 scale-[0.99]"
            }`}
          >
            <div className="max-h-72 overflow-y-auto py-1.5">
              {options.map((option) => {
                const active = values.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleOption(option.value)}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-xs font-semibold transition ${
                      active
                        ? "bg-[#EAF2FB] text-sibs-primary-1"
                        : "text-sibs-primary-1 hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <span>{option.label}</span>
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-extrabold ${
                        active
                          ? "border-sibs-primary-1 bg-sibs-primary-1 text-white"
                          : "border-sibs-tertiary-8 bg-white text-transparent"
                      }`}
                    >
                      <Check size={11} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobDescriptionContentSection() {
  const { form, setForm } = useJobDescription();

  const personalityTypeRef = useRef(null);
  const reportsToRef = useRef(null);

  const [reportsToOpen, setReportsToOpen] = useState(false);
  const [personalityTypeOpen, setPersonalityTypeOpen] =
    useState(false);

  function closeDropdowns() {
    setReportsToOpen(false);
    setPersonalityTypeOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        reportsToRef.current &&
        !reportsToRef.current.contains(event.target)
      ) {
        setReportsToOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredReportToOptions = useMemo(() => {
    const query = String(form.reportsTo || "")
      .trim()
      .toLowerCase();

    if (!query) return reportToOptions;

    return reportToOptions.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [form.reportsTo]);

  function updateRichTextField(
    field,
    html,
    plainText,
  ) {
    setForm((previous) => {
      const nextForm = {
        ...previous,
        [field]: html,
        [`${field}PlainText`]: plainText,
      };

      /*
       * Keep the older aliases populated while the rest of the project is
       * migrated to the correct responsibilities and qualifications fields.
       */
      if (field === "responsibilities") {
        nextForm.dutiesResponsibilities = html;
        nextForm.duties = html;
      }

      if (field === "qualifications") {
        nextForm.qualificationDetails = html;
        nextForm.qualificationCharacteristics = html;
        nextForm.characteristics = html;
      }

      return nextForm;
    });
  }

  return (
    <div className="relative z-[1] overflow-visible">
      <style>{`
        .jd-rich-text-editor .ProseMirror {
          min-height: inherit;
          color: var(--sibs-primary-1);
          font-size: 0.8125rem;
          line-height: 1.5;
          outline: none;
          overflow-wrap: anywhere;
        }

        .jd-rich-text-editor .ProseMirror > * + * {
          margin-top: 0.55rem;
        }

        .jd-rich-text-editor .ProseMirror p {
          margin: 0;
          line-height: 1.5;
        }

        .jd-rich-text-editor .ProseMirror ol,
        .jd-rich-text-editor .ProseMirror ul {
          margin: 0.55rem 0;
          padding-left: 2.25rem;
        }

        .jd-rich-text-editor .ProseMirror ol {
          list-style-type: decimal;
        }

        .jd-rich-text-editor .ProseMirror ol ol {
          list-style-type: lower-alpha;
          padding-left: 2.5rem;
        }

        .jd-rich-text-editor .ProseMirror ol ol ol {
          list-style-type: lower-roman;
        }

        .jd-rich-text-editor .ProseMirror ul {
          list-style-type: disc;
        }

        .jd-rich-text-editor .ProseMirror ul ul {
          list-style-type: circle;
        }

        .jd-rich-text-editor .ProseMirror li {
          padding-left: 0.4rem;
          line-height: 1.5;
        }

        .jd-rich-text-editor .ProseMirror li + li {
          margin-top: 0.45rem;
        }

        .jd-rich-text-editor .ProseMirror li > p {
          margin: 0;
        }

        .jd-rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
          float: left;
          height: 0;
          color: #91A4B7;
          content: attr(data-placeholder);
          pointer-events: none;
        }

        .jd-rich-text-editor .ProseMirror [style*="text-align: justify"] {
          text-align: justify;
          text-justify: inter-word;
        }
      `}</style>

      <div className="space-y-4 overflow-visible">
        <div className="grid grid-cols-1 gap-4 overflow-visible md:grid-cols-2 md:items-start">
          <div
            ref={reportsToRef}
            className={`relative min-w-0 overflow-visible ${
              reportsToOpen ? "z-[9999]" : "z-[40]"
            }`}
          >
            <label
              htmlFor="job-description-reports-to"
              className={fieldLabelClass}
            >
              Reports to <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input
                id="job-description-reports-to"
                value={form.reportsTo || ""}
                placeholder="Type or choose reporting line"
                className={fieldInputClass}
                autoComplete="off"
                onFocus={() => {
                  setReportsToOpen(true);
                  setPersonalityTypeOpen(false);
                }}
                onClick={() => {
                  setReportsToOpen(true);
                  setPersonalityTypeOpen(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setReportsToOpen(false);
                  }
                }}
                onChange={(event) => {
                  const value = event.target.value;

                  setForm((previous) => ({
                    ...previous,
                    reportsTo: value,
                  }));
                  setReportsToOpen(true);
                }}
              />

              <button
                type="button"
                onClick={() => {
                  setReportsToOpen((previous) => !previous);
                  setPersonalityTypeOpen(false);
                }}
                className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-sibs-primary-1 transition hover:bg-[#EAF0F7]"
                aria-label="Show reporting line suggestions"
              >
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    reportsToOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`absolute left-0 right-0 top-full z-[9999] mt-2 grid transition-all duration-200 ease-out ${
                  reportsToOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "pointer-events-none grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <div
                    className={`max-h-72 overflow-hidden rounded-[10px] border border-[#D7DEE8] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] transition-all duration-200 ease-out ${
                      reportsToOpen
                        ? "translate-y-0 scale-100"
                        : "-translate-y-1 scale-[0.99]"
                    }`}
                  >
                    <div className="max-h-72 overflow-y-auto py-1.5">
                      {filteredReportToOptions.length > 0 ? (
                        filteredReportToOptions.map((option) => {
                          const active = form.reportsTo === option.value;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setForm((previous) => ({
                                  ...previous,
                                  reportsTo: option.value,
                                }));
                                setReportsToOpen(false);
                              }}
                              className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-xs font-semibold transition ${
                                active
                                  ? "bg-[#EAF2FB] text-sibs-primary-1"
                                  : "text-sibs-primary-1 hover:bg-[#F8FAFC]"
                              }`}
                            >
                              <span>{option.label}</span>
                              {active ? (
                                <Check
                                  size={14}
                                  className="shrink-0 text-sibs-primary-1"
                                />
                              ) : null}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-3 py-3 text-xs font-semibold text-sibs-tertiary-5">
                          No matching suggestion. Custom value will be saved.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* {!String(form.reportsTo || "").trim() && (
              <p className="mt-2 text-xs font-semibold text-red-500">
                Please enter a reporting line.
              </p>
            )} */}
          </div>

          <div className="relative z-[10] min-w-0">
            <label className={fieldLabelClass}>
              Supervisory{" "}
              <span className="text-red-500">*</span>
            </label>

            <div className="relative grid h-10 w-full grid-cols-2 overflow-hidden rounded-[10px] border border-sibs-tertiary-8 bg-[#F8FAFC] transition focus-within:border-[#FF5C28] focus-within:ring-4 focus-within:ring-[#FF5C28]/10">
              <div
                className={`absolute inset-y-0 left-0 w-1/2 rounded-[9px] bg-sibs-primary-1 transition-transform duration-300 ease-in-out ${
                  form.supervisory === "No"
                    ? "translate-x-full"
                    : "translate-x-0"
                }`}
              />

              {supervisoryOptions.map((option) => {
                const isActive =
                  form.supervisory === option;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setForm((previous) => ({
                        ...previous,
                        supervisory: option,
                      }))
                    }
                    className={`relative z-10 inline-flex h-full items-center justify-center rounded-lg text-xs font-extrabold transition-colors duration-300 ${
                      isActive
                        ? "text-white"
                        : "text-sibs-primary-1 hover:text-sibs-primary-1"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {!form.supervisory && (
              <p className="mt-2 text-xs font-semibold text-red-500">
                Please select Yes or No.
              </p>
            )}
          </div>
        </div>

        <div className="relative z-[1]">
          <label className="mb-1.5 block text-xs font-extrabold text-sibs-primary-1">
            Position Overview{" "}
            <span className="text-red-500">*</span>
          </label>

          <RichTextEditor
            id="job-description-position-overview"
            value={form.description || ""}
            onFocus={closeDropdowns}
            onChange={(html, plainText) =>
              updateRichTextField(
                "description",
                html,
                plainText,
              )
            }
            placeholder="Describe the main purpose of the role."
            minHeight={120}
          />
        </div>

        <div className="relative z-[1]">
          <label className="mb-1.5 block text-xs font-extrabold text-sibs-primary-1">
            Duties & Responsibilities{" "}
            <span className="text-red-500">*</span>
          </label>

          <RichTextEditor
            id="job-description-responsibilities"
            value={
              form.responsibilities ||
              form.dutiesResponsibilities ||
              form.duties ||
              ""
            }
            onFocus={closeDropdowns}
            onChange={(html, plainText) =>
              updateRichTextField(
                "responsibilities",
                html,
                plainText,
              )
            }
            placeholder="List duties and responsibilities for this role."
            minHeight={150}
          />
        </div>

        <div className="relative z-[1]">
          <label className="mb-1.5 block text-xs font-extrabold text-sibs-primary-1">
            Qualifications & Characteristics{" "}
            <span className="text-red-500">*</span>
          </label>

          <RichTextEditor
            id="job-description-qualifications"
            value={
              form.qualifications ||
              form.qualificationDetails ||
              form.qualificationCharacteristics ||
              form.characteristics ||
              ""
            }
            onFocus={closeDropdowns}
            onChange={(html, plainText) =>
              updateRichTextField(
                "qualifications",
                html,
                plainText,
              )
            }
            placeholder="Enter qualifications, characteristics, or notes."
            minHeight={130}
          />
        </div>

        <div className="relative z-[30] overflow-visible">
          <CompactMultiSelect
            refBox={personalityTypeRef}
            label="Preferred Personality Type"
            values={form.personalityTypes || []}
            placeholder="Select personality types"
            open={personalityTypeOpen}
            setOpen={setPersonalityTypeOpen}
            disabled={false}
            options={personalityTypeOptions}
            zIndex="z-[30]"
            required
            onChange={(values) => {
              setForm((previous) => ({
                ...previous,
                personalityTypes: values,
                personalityType: values.join(", "),
                personality_type: values.join(", "),
              }));
            }}
          />
        </div>
      </div>
    </div>
  );
}
