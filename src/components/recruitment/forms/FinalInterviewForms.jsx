import React from "react";
import { useSearchParams } from "react-router-dom";
import { useRecruitmentSettings } from "../../../services/context/RecruitmentSettingsContext";

const FinalInterviewForms = () => {
  const [searchParams] = useSearchParams();
  const { getFinalInterviewForm } = useRecruitmentSettings();

  const candidateId = searchParams.get("candidateId");
  const candidateApplicationId = searchParams.get("candidateApplicationId");

  const finalInterviewForm = getFinalInterviewForm();
  const fields =
    finalInterviewForm?.fields?.filter((field) => field.enabled) || [];

  return (
    <div className="min-h-screen bg-sibs-tertiary-10 p-6 font-jakarta">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="rounded-2xl border border-[#E6ECF2] bg-white p-6 shadow-sm">
          <p className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
            Final Interview
          </p>

          <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1">
            {finalInterviewForm?.name || "Final Interview Form"}
          </h1>

          <p className="mt-1 text-sm font-semibold leading-6 text-sibs-tertiary-5">
            Candidate ID: {candidateId || "—"} · Application ID:{" "}
            {candidateApplicationId || "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E6ECF2] bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <div
                key={field.id}
                className={field.type === "Paragraph" ? "md:col-span-2" : ""}
              >
                <label className="mb-1 block text-sm font-bold text-[#101828]">
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </label>

                {field.type === "Paragraph" ? (
                  <textarea
                    rows={4}
                    required={field.required}
                    className="w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                  />
                ) : field.type === "Dropdown" ? (
                  <select
                    required={field.required}
                    className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                  >
                    <option value="">Select option</option>
                    <option>Recommended</option>
                    <option>For Pooling</option>
                    <option>Not Recommended</option>
                  </select>
                ) : field.type === "Rating" ? (
                  <select
                    required={field.required}
                    className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                  >
                    <option value="">Select rating</option>
                    <option>1 - Poor</option>
                    <option>2 - Needs Improvement</option>
                    <option>3 - Average</option>
                    <option>4 - Good</option>
                    <option>5 - Excellent</option>
                  </select>
                ) : (
                  <input
                    type={field.type === "Date" ? "date" : "text"}
                    required={field.required}
                    className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-sibs-primary-1 px-6 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95"
            >
              Submit Interview Form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalInterviewForms;
