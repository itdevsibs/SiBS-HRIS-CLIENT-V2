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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-xl bg-sibs-primary-1 px-4 py-4 text-white">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-normal text-[#FF5C28]">
            Selected Position
          </p>

          <h3 className="mt-1 truncate text-base font-extrabold leading-5">
            {activePosition?.position || "-"}
          </h3>

          <p className="mt-1 truncate text-xs font-semibold text-white/85">
            {activePosition?.code || "-"} - {activePosition?.department || "-"} -{" "}
            {activePosition?.location || "-"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleViewForm}
          className="inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-extrabold text-white transition hover:bg-white/15"
        >
          <Eye size={15} />
          View Form
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-extrabold text-[#101828]">
            Form Name
          </label>

          <input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="h-10 w-full rounded-[10px] border border-[#D0D5DD] bg-white px-3 text-xs font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-extrabold text-[#101828]">
              Status
            </label>

            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
              className="h-10 w-full rounded-[10px] border border-[#D0D5DD] bg-white px-3 text-xs font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            >
              <option>Active</option>
              <option>Draft</option>
              <option>Archived</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-extrabold text-[#101828]">
              Passing Score (%)
            </label>

            <input
              type="number"
              value={passingScore}
              onChange={(e) => setPassingScore(e.target.value)}
              className="h-10 w-full rounded-[10px] border border-[#D0D5DD] bg-white px-3 text-xs font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-extrabold text-[#101828]">
            Description
          </label>

          <textarea
            rows={3}
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            className="w-full resize-none rounded-[10px] border border-[#D0D5DD] bg-white px-3 py-2.5 text-xs font-semibold leading-5 text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
          />
        </div>
      </div>
    </div>
  );
}
