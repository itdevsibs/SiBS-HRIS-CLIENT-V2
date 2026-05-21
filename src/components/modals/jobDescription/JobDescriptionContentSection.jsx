import { useRef, useState } from "react";
import { useJobDescription } from "../../../services/context/JobDescriptionContext";
import SingleSelectDropdown from "../../layout/dropdown/SingleSelectDropdown";
import MultiSelectDropdown from "../../layout/dropdown/MultiSelectDropdown";

const reportToOptions = [
  { value: "Team Supervisor", label: "Team Supervisor" },
  { value: "Operations Manager", label: "Operations Manager" },
  { value: "Senior Operations Manager", label: "Senior Operations Manager" },
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

  const [personalityTypeOpen, setPersonalityTypeOpen] = useState(false);
  const [reportsToOpen, setReportsToOpen] = useState(false);

  const selectedReportsTo =
    reportToOptions.find(
      (option) => option.value === String(form.reportsTo || ""),
    )?.label || "";

  return (
    <div className="mt-5 rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold text-[#101828]">
        Job Description Content
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
          <div className="min-w-0">
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
              zIndex="z-[999]"
              onSelect={(value) => {
                setForm((prev) => ({
                  ...prev,
                  reportsTo: value,
                }));

                setReportsToOpen(false);
              }}
            />
          </div>

          <div className="min-w-0">
            <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
              Supervisory <span className="text-red-500">*</span>
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
                const isActive = form.supervisory === option;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        supervisory: option,
                      }))
                    }
                    className={`relative z-10 inline-flex h-full items-center 
                        justify-center rounded-lg text-sm font-extrabold transition-colors 
                        duration-300 ${
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

        <div>
          <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
            Position Overview <span className="text-red-500">*</span>
          </label>

          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Describe the main purpose of the role."
            className="w-full resize-none rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none focus:border-[var(--sibs-primary-1)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
            Duties & Responsibilities <span className="text-red-500">*</span>
          </label>

          <textarea
            required
            rows={4}
            value={form.qualifications}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                qualifications: e.target.value,
              }))
            }
            placeholder="List duties and responsibilities for this role."
            className="w-full resize-none rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none focus:border-[var(--sibs-primary-1)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
            Qualifications & Characteristics{" "}
            <span className="text-red-500">*</span>
          </label>

          <textarea
            rows={3}
            value={form.remarks}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                remarks: e.target.value,
              }))
            }
            placeholder="Optional qualifications, characteristics, or notes."
            className="w-full resize-none rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none focus:border-[var(--sibs-primary-1)]"
          />
        </div>

        <div>
          <MultiSelectDropdown
            refBox={personalityTypeRef}
            label="Preferred Personality Type"
            value={form.personalityTypes}
            values={form.personalityTypes}
            placeholder="Select personality types"
            open={personalityTypeOpen}
            setOpen={setPersonalityTypeOpen}
            disabled={false}
            options={personalityTypeOptions}
            zIndex="z-[999]"
            required
            onChange={(values) => {
              setForm((prev) => ({
                ...prev,
                personalityTypes: values,
              }));
            }}
          />
        </div>
      </div>
    </div>
  );
}
