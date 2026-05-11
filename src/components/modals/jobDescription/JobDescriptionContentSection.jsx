import { useJobDescription } from "../../../services/context/JobDescriptionContext";

export default function JobDescriptionContentSection() {
  const { form, setForm } = useJobDescription();

  return (
    <div className="mt-5 rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold text-[#101828]">
        Job Description Content
      </h3>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
            Job Summary / Description <span className="text-red-500">*</span>
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
            Key Responsibilities <span className="text-red-500">*</span>
          </label>

          <textarea
            required
            rows={4}
            value={form.responsibilities}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                responsibilities: e.target.value,
              }))
            }
            placeholder="List the main responsibilities for this role."
            className="w-full resize-none rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none focus:border-[var(--sibs-primary-1)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
            Qualifications / Requirements{" "}
            <span className="text-red-500">*</span>
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
            placeholder="List required skills, experience, education, tools, or certifications."
            className="w-full resize-none rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none focus:border-[var(--sibs-primary-1)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
            Remarks
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
            placeholder="Optional notes for HR, TA, or Hiring Manager."
            className="w-full resize-none rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none focus:border-[var(--sibs-primary-1)]"
          />
        </div>
      </div>
    </div>
  );
}
