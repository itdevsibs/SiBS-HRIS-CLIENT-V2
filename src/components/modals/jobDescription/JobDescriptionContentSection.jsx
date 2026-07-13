import { useRef, useState } from "react";
import { useJobDescription } from "../../../services/context/JobDescriptionContext";
import SingleSelectDropdown from "../../layout/dropdown/SingleSelectDropdown";
import MultiSelectDropdown from "../../layout/dropdown/MultiSelectDropdown";
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

export default function JobDescriptionContentSection() {
  const { form, setForm } = useJobDescription();

  const reportsToRef = useRef(null);
  const personalityTypeRef = useRef(null);

  const [personalityTypeOpen, setPersonalityTypeOpen] =
    useState(false);

  const [reportsToOpen, setReportsToOpen] =
    useState(false);

  const selectedReportsTo =
    reportToOptions.find(
      (option) =>
        option.value === String(form.reportsTo || ""),
    )?.label || "";

  function closeDropdowns() {
    setReportsToOpen(false);
    setPersonalityTypeOpen(false);
  }

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
    <div className="relative z-[1] mt-5 overflow-visible rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <style>{`
        .jd-rich-text-editor .ProseMirror {
          min-height: inherit;
          color: var(--sibs-primary-1);
          font-size: 0.875rem;
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

      <h3 className="mb-4 text-sm font-bold text-[#101828]">
        Job Description Content
      </h3>

      <div className="space-y-4 overflow-visible">
        <div className="grid grid-cols-1 gap-4 overflow-visible md:grid-cols-2 md:items-start">
          <div className="relative z-[40] min-w-0 overflow-visible">
            <SingleSelectDropdown
              refBox={reportsToRef}
              required
              label="Reports to"
              value={selectedReportsTo}
              placeholder="Select reporting line"
              open={reportsToOpen}
              setOpen={setReportsToOpen}
              disabled={false}
              options={reportToOptions}
              selectedValue={form.reportsTo}
              zIndex="z-[40]"
              onBeforeOpen={() => {
                setPersonalityTypeOpen(false);
              }}
              onSelect={(value) => {
                setForm((previous) => ({
                  ...previous,
                  reportsTo: value,
                }));

                setReportsToOpen(false);
              }}
            />
          </div>

          <div className="relative z-[10] min-w-0">
            <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
              Supervisory{" "}
              <span className="text-red-500">*</span>
            </label>

            <div className="relative grid h-12 w-full grid-cols-2 overflow-hidden rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] shadow-sm">
              <div
                className={`absolute inset-y-0 left-0 w-1/2 rounded-xl bg-sibs-primary-1 shadow-2xs transition-transform duration-300 ease-in-out ${
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
                    className={`relative z-10 inline-flex h-full items-center justify-center rounded-lg text-sm font-extrabold transition-colors duration-300 ${
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
          <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
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
          <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
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
          <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
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
          <MultiSelectDropdown
            refBox={personalityTypeRef}
            label="Preferred Personality Type"
            value={form.personalityTypes || []}
            values={form.personalityTypes || []}
            placeholder="Select personality types"
            open={personalityTypeOpen}
            setOpen={setPersonalityTypeOpen}
            disabled={false}
            options={personalityTypeOptions}
            zIndex="z-[30]"
            required
            onBeforeOpen={() => {
              setReportsToOpen(false);
            }}
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
