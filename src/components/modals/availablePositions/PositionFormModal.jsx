import React from "react";
import { LOCATION_SITE_OPTIONS } from "../../../lib/utils/availablePositions/availablePositionsConstants";
import { cleanText, textareaClass } from "../../../lib/utils/availablePositions/availablePositionsHelpers";
import { RotateCcw, Save, X } from "lucide-react";
import DropdownField from "../../recruitment/availablePositions/DropdownField";
import { FieldLabel } from "../../../lib/utils/availablePositions/reactComponents/reactHelpers";

const PositionFormModal = ({
  open,
  mode,
  form,
  setForm,
  onClose,
  onSubmit,
  onReset,
  meta,
  approvedJdPositions = [],
  isSaving,
}) => {
  if (!open) return null;

  const title =
    mode === "edit" ? "Edit Available Position" : "Add Available Position";

  const statusOptions = Array.isArray(meta.statusOptions)
    ? meta.statusOptions
    : [];

  const statusDropdownOptions = statusOptions.map((status) => ({
    id: status,
    value: status,
    label: status,
  }));

  const locationDropdownOptions = LOCATION_SITE_OPTIONS.map((location) => ({
    id: location,
    value: location,
    label: location,
  }));

  const approvedJdDropdownOptions = approvedJdPositions
    .map((jd) => {
      const roleTitle =
        jd.roleTitle ||
        jd.role_title ||
        jd.title ||
        jd.documentTitle ||
        jd.document_title ||
        "";

      if (!cleanText(roleTitle)) return null;

      const jdCode = jd.jdCode || jd.jd_code || "";
      const documentTitle = jd.documentTitle || jd.document_title || "";
      const department =
        jd.department || jd.departmentName || jd.department_name || "";
      const account = jd.account || jd.preparedFor || jd.prepared_for || "";

      return {
        id: jd.id || jd.rawId || jd.raw_id || roleTitle,
        value: roleTitle,
        label: `${roleTitle}${jdCode ? ` (${jdCode})` : ""}`,
        description: [documentTitle, department, account]
          .filter(Boolean)
          .join(" • "),
        searchText: [roleTitle, jdCode, documentTitle, department, account]
          .filter(Boolean)
          .join(" "),
        raw: jd,
      };
    })
    .filter(Boolean);

  function handleApprovedJdPositionChange(positionTitle, selectedOption) {
    const selectedJd = selectedOption?.raw;

    if (!selectedJd) {
      setForm({
        ...form,
        jdId: "",
        jd_id: "",
        jdCode: "",
        jd_code: "",
        documentTitle: "",
        document_title: "",
        positionTitle,
        departmentId: "",
        department: "",
        accountId: "",
        accountName: "",
        accountGhlName: "",
        description: "",
        preferredSkills: "",
      });
      return;
    }

    const jdId = selectedJd.id || selectedJd.rawId || selectedJd.raw_id || "";
    const jdCode = selectedJd.jdCode || selectedJd.jd_code || "";

    const documentTitle =
      selectedJd.documentTitle ||
      selectedJd.document_title ||
      selectedJd.raw?.documentTitle ||
      selectedJd.raw?.document_title ||
      selectedJd.title ||
      selectedJd.roleTitle ||
      selectedJd.role_title ||
      positionTitle ||
      "";

    const departmentId =
      selectedJd.departmentId ||
      selectedJd.department_id ||
      selectedJd.raw?.departmentId ||
      selectedJd.raw?.department_id ||
      "";

    const department =
      selectedJd.department ||
      selectedJd.departmentName ||
      selectedJd.department_name ||
      selectedJd.raw?.department ||
      selectedJd.raw?.departmentName ||
      selectedJd.raw?.department_name ||
      "";

    const accountId =
      selectedJd.accountId ||
      selectedJd.account_id ||
      selectedJd.raw?.accountId ||
      selectedJd.raw?.account_id ||
      "";

    const accountName =
      selectedJd.account ||
      selectedJd.accountName ||
      selectedJd.account_name ||
      selectedJd.preparedFor ||
      selectedJd.prepared_for ||
      selectedJd.raw?.account ||
      selectedJd.raw?.accountName ||
      selectedJd.raw?.account_name ||
      selectedJd.raw?.preparedFor ||
      selectedJd.raw?.prepared_for ||
      "";

    setForm({
      ...form,

      jdId,
      jd_id: jdId,

      jdCode,
      jd_code: jdCode,

      documentTitle,
      document_title: documentTitle,

      positionTitle,

      departmentId,
      department,

      accountId,
      accountName,
      accountGhlName:
        selectedJd.accountGhlName ||
        selectedJd.account_ghl_name ||
        form.accountGhlName ||
        "",

      description: selectedJd.description || form.description || "",
      preferredSkills:
        selectedJd.qualifications ||
        selectedJd.preferredSkills ||
        selectedJd.preferred_skills ||
        form.preferredSkills ||
        "",
    });
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={isSaving ? undefined : onClose}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="sibs-profile-tab-panel flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-extrabold text-sibs-primary-1">
              {title}
            </h2>

            <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
              Select an approved job description, then set its public position
              availability.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <DropdownField
                  label="Position Title"
                  required
                  value={form.positionTitle}
                  displayValue={form.positionTitle}
                  onChange={handleApprovedJdPositionChange}
                  options={approvedJdDropdownOptions}
                  placeholder="Search approved JD position"
                  searchPlaceholder="Search approved JD position..."
                  emptyMessage="No approved JD positions found."
                  disabled={isSaving}
                  searchable
                  zIndex="z-[190]"
                />

                {(form.documentTitle ||
                  form.department ||
                  form.accountName ||
                  form.jdCode) && (
                  <div className="mt-3 space-y-2">
                    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#174A7C]">
                        Document Title
                      </p>

                      <p className="mt-1 text-sm font-bold text-[#344054]">
                        {form.documentTitle || "—"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                      <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#174A7C]">
                          JD Code
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#344054]">
                          {form.jdCode || "—"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#174A7C]">
                          Department
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#344054]">
                          {form.department || "—"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#174A7C]">
                          Account
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#344054]">
                          {form.accountName || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DropdownField
                label="Status"
                required
                value={form.status}
                onChange={(value) => setForm({ ...form, status: value })}
                options={statusDropdownOptions}
                placeholder="Select status"
                disabled={isSaving}
                zIndex="z-[160]"
              />

              <DropdownField
                label="Location / Site"
                required
                value={form.locationSite}
                onChange={(value) => setForm({ ...form, locationSite: value })}
                options={locationDropdownOptions}
                placeholder="Select location / site"
                disabled={isSaving}
                zIndex="z-[150]"
              />

              <div className="md:col-span-2">
                <FieldLabel>Remarks</FieldLabel>

                <textarea
                  rows={3}
                  value={form.remarks}
                  onChange={(e) =>
                    setForm({ ...form, remarks: e.target.value })
                  }
                  placeholder="Internal notes only."
                  className={textareaClass()}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="border-t border-[#E6ECF2] px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onReset}
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw size={16} />
              Reset
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {isSaving
                ? "Saving..."
                : mode === "edit"
                  ? "Update Position"
                  : "Save Position"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PositionFormModal;
