import React from "react";
import { Plus } from "lucide-react";
import { useRecruitmentSettings } from "../../../services/context/RecruitmentSettingsContext";

export default function AddFieldCard() {
  const { newField, setNewField, fieldTypes, handleAddField } =
    useRecruitmentSettings();

  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <h3 className="text-base font-extrabold text-[#101828]">
        Add Form Field
      </h3>
      <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
        Add custom questions for the final interview form.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-bold text-[#101828]">
            Field Label
          </label>
          <input
            value={newField.label}
            onChange={(e) =>
              setNewField((prev) => ({
                ...prev,
                label: e.target.value,
              }))
            }
            placeholder="Example: Attendance Reliability"
            className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-bold text-[#101828]">
              Field Type
            </label>
            <select
              value={newField.type}
              onChange={(e) =>
                setNewField((prev) => ({
                  ...prev,
                  type: e.target.value,
                }))
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
              Section
            </label>
            <select
              value={newField.section}
              onChange={(e) =>
                setNewField((prev) => ({
                  ...prev,
                  section: e.target.value,
                }))
              }
              className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            >
              <option>Candidate Information</option>
              <option>Interview Assessment</option>
              <option>Final Decision</option>
              <option>Operations Review</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3">
          <input
            type="checkbox"
            checked={newField.required}
            onChange={(e) =>
              setNewField((prev) => ({
                ...prev,
                required: e.target.checked,
              }))
            }
            className="h-4 w-4 accent-sibs-primary-1"
          />
          <span className="text-sm font-bold text-[#344054]">
            Required field
          </span>
        </label>

        <button
          type="button"
          onClick={handleAddField}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95"
        >
          <Plus size={18} />
          Add Field
        </button>
      </div>
    </div>
  );
}
