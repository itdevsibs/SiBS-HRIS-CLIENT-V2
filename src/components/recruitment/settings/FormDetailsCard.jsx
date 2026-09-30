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
      <div className="flex items-center justify-between gap-3 rounded-xl bg-sibs-navy px-4 py-4 text-white">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-normal text-sibs-orange">
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
          <label className="mb-1 block text-xs font-bold text-sibs-navy">
            Form Name
          </label>

          <input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="sibs-dashboard-input h-10 w-full text-xs sm:text-sm text-sibs-navy"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-sibs-navy">
              Status
            </label>

            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
              className="sibs-dashboard-input h-10 w-full text-xs sm:text-sm font-semibold text-sibs-navy bg-white cursor-pointer"
            >
              <option>Active</option>
              <option>Draft</option>
              <option>Archived</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-sibs-navy">
              Passing Score (%)
            </label>

            <input
              type="number"
              value={passingScore}
              onChange={(e) => setPassingScore(e.target.value)}
              className="sibs-dashboard-input h-10 w-full text-xs sm:text-sm text-sibs-navy"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-sibs-navy">
            Description
          </label>

          <textarea
            rows={3}
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            className="w-full resize-none rounded-xl border border-sibs-border bg-white px-3 py-2.5 text-xs font-medium leading-5 text-sibs-navy outline-none transition focus:border-sibs-border focus:ring-2 focus:ring-sibs-border/30"
          />
        </div>
      </div>
    </div>
  );
}
