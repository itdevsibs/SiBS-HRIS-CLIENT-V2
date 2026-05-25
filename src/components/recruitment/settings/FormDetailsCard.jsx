import React from "react";
import { Eye } from "lucide-react";
import { useRecruitmentSettings } from "../../../services/context/RecruitmentSettingsContext";

export default function FormDetailsCard() {
  const {
    activePosition,
    activeForm,
    formName,
    formStatus,
    passingScore,
    formDescription,
    setFormName,
    setFormStatus,
    setPassingScore,
    setFormDescription,
  } = useRecruitmentSettings();

  function handleViewForm() {
    const params = new URLSearchParams({
      positionId: activePosition?.id || "",
      formId: activeForm?.id || "",
      mode: "preview",
    });

    window.open(
      `/recruitment/final-interview-form?${params.toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-[#101828]">
            Role Form Details
          </h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
            Configure the final interview form for the selected available
            position.
          </p>
        </div>

        <button
          type="button"
          onClick={handleViewForm}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 text-xs font-extrabold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm"
        >
          <Eye size={15} />
          View Form
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
          Selected Position
        </p>

        <p className="mt-1 text-base font-extrabold text-[#101828]">
          {activePosition?.position || "—"}
        </p>

        <p className="mt-1 text-xs font-bold text-sibs-primary-1">
          {activePosition?.code || "—"} · {activePosition?.department || "—"} ·{" "}
          {activePosition?.location || "—"}
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-bold text-[#101828]">
            Form Name
          </label>

          <input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-bold text-[#101828]">
              Status
            </label>

            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
              className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            >
              <option>Active</option>
              <option>Draft</option>
              <option>Archived</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-[#101828]">
              Passing Score
            </label>

            <div className="relative">
              <input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
                className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pr-10 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-sibs-tertiary-5">
                %
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-[#101828]">
            Description
          </label>

          <textarea
            rows={4}
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            className="w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold leading-6 text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
          />
        </div>
      </div>
    </div>
  );
}
