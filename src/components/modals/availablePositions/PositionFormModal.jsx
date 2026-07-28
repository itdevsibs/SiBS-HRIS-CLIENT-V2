import React, { useMemo } from "react";
import {
  BriefcaseBusiness,
  Building2,
  FileCheck2,
  Loader2,
  RotateCcw,
  Save,
  Settings2,
  X,
} from "lucide-react";

import { LOCATION_SITE_OPTIONS } from "../../../lib/utils/availablePositions/availablePositionsConstants";
import {
  cleanText,
} from "../../../lib/utils/availablePositions/availablePositionsHelpers";
import DropdownField from "../../recruitment/availablePositions/DropdownField";

const INPUT_CLASS =
  "h-10 w-full rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#667085]";

const TEXTAREA_CLASS =
  "min-h-28 w-full resize-none rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] px-3 py-2.5 text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#667085]";

function FieldLabel({
  children,
  required = false,
}) {
  return (
    <label className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
      {children}
      {required ? (
        <span className="ml-1 text-red-500">*</span>
      ) : null}
    </label>
  );
}

function PositionFormSection({
  title,
  subtitle,
  icon: Icon,
  children,
}) {
  return (
    <section className="rounded-2xl border border-[#DCE6F1] bg-white p-4 shadow-[0_8px_24px_rgba(4,44,81,0.04)] sm:p-5">
      <div className="mb-4 flex items-start gap-2.5 border-b border-[#EEF2F6] pb-3">
        <Icon
          size={17}
          className="mt-0.5 shrink-0 text-[#FF5C28]"
        />

        <div className="min-w-0">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
            {title}
          </h3>

          <p className="mt-1 text-xs font-semibold leading-5 text-[#667085]">
            {subtitle}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

export default function PositionFormModal({
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
}) {
  const isEditMode = mode === "edit";

  const statusDropdownOptions = useMemo(
    () =>
      (Array.isArray(meta?.statusOptions)
        ? meta.statusOptions
        : []
      ).map((status) => ({
        id: status,
        value: status,
        label: status,
      })),
    [meta?.statusOptions],
  );

  const locationDropdownOptions = useMemo(
    () =>
      LOCATION_SITE_OPTIONS.map((location) => ({
        id: location,
        value: location,
        label: location,
      })),
    [],
  );

  const departmentDropdownOptions = useMemo(
    () =>
      (Array.isArray(meta?.departments)
        ? meta.departments
        : []
      )
        .filter(Boolean)
        .map((department) => ({
          id:
            department.departmentId ||
            department.id ||
            department.departmentName,
          value:
            department.departmentId ||
            department.id ||
            "",
          label:
            department.departmentName ||
            department.name ||
            "Unnamed Department",
          searchText: [
            department.departmentId,
            department.departmentName,
            department.name,
          ]
            .filter(Boolean)
            .join(" "),
          raw: department,
        })),
    [meta?.departments],
  );

  const accountDropdownOptions = useMemo(() => {
    const accounts = Array.isArray(meta?.accounts)
      ? meta.accounts
      : [];

    return accounts
      .filter((account) => {
        if (!form?.departmentId) return false;

        return (
          String(account.departmentId || "") ===
          String(form.departmentId)
        );
      })
      .map((account) => ({
        id:
          account.accountId ||
          account.id ||
          account.accountName,
        value:
          account.accountId ||
          account.id ||
          "",
        label:
          account.accountName ||
          account.name ||
          "Unnamed Account",
        description:
          account.accountGhlName ||
          account.account_ghl_name ||
          "",
        searchText: [
          account.accountId,
          account.accountName,
          account.accountGhlName,
          account.departmentId,
        ]
          .filter(Boolean)
          .join(" "),
        raw: account,
      }));
  }, [
    form?.departmentId,
    meta?.accounts,
  ]);

  const approvedJdDropdownOptions = useMemo(
    () =>
      approvedJdPositions
        .map((jd) => {
          const roleTitle =
            jd.roleTitle ||
            jd.role_title ||
            jd.title ||
            jd.documentTitle ||
            jd.document_title ||
            "";

          if (!cleanText(roleTitle)) return null;

          const jdCode =
            jd.jdCode || jd.jd_code || "";
          const documentTitle =
            jd.documentTitle ||
            jd.document_title ||
            "";
          const department =
            jd.department ||
            jd.departmentName ||
            jd.department_name ||
            "";
          const account =
            jd.account ||
            jd.accountName ||
            jd.account_name ||
            jd.preparedFor ||
            jd.prepared_for ||
            "";

          return {
            id:
              jd.id ||
              jd.rawId ||
              jd.raw_id ||
              roleTitle,
            value: roleTitle,
            label: `${roleTitle}${
              jdCode ? ` (${jdCode})` : ""
            }`,
            description: [
              documentTitle,
              department,
              account,
            ]
              .filter(Boolean)
              .join(" • "),
            searchText: [
              roleTitle,
              jdCode,
              documentTitle,
              department,
              account,
            ]
              .filter(Boolean)
              .join(" "),
            raw: jd,
          };
        })
        .filter(Boolean),
    [approvedJdPositions],
  );

  if (!open) return null;

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleApprovedJdPositionChange(
    positionTitle,
    selectedOption,
  ) {
    const selectedJd = selectedOption?.raw;

    if (!selectedJd) {
      setForm((previous) => ({
        ...previous,
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
      }));
      return;
    }

    const jdId =
      selectedJd.id ||
      selectedJd.rawId ||
      selectedJd.raw_id ||
      "";

    const jdCode =
      selectedJd.jdCode ||
      selectedJd.jd_code ||
      "";

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

    setForm((previous) => ({
      ...previous,

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
        previous.accountGhlName ||
        "",

      description:
        selectedJd.description ||
        previous.description ||
        "",

      preferredSkills:
        selectedJd.qualifications ||
        selectedJd.preferredSkills ||
        selectedJd.preferred_skills ||
        previous.preferredSkills ||
        "",
    }));
  }

  function handleDepartmentChange(
    departmentId,
    selectedOption,
  ) {
    const department =
      selectedOption?.raw;

    setForm((previous) => ({
      ...previous,
      departmentId,
      department:
        department?.departmentName ||
        department?.name ||
        selectedOption?.label ||
        "",
      accountId: "",
      accountName: "",
      accountGhlName: "",
    }));
  }

  function handleAccountChange(
    accountId,
    selectedOption,
  ) {
    const account = selectedOption?.raw;

    setForm((previous) => ({
      ...previous,
      accountId,
      accountName:
        account?.accountName ||
        account?.name ||
        selectedOption?.label ||
        "",
      accountGhlName:
        account?.accountGhlName ||
        account?.account_ghl_name ||
        selectedOption?.description ||
        "",
    }));
  }

  return (
    <div
      className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[10000] flex h-dvh items-center justify-center p-2 font-jakarta sm:p-4"
      onClick={() => {
        if (!isSaving) onClose?.();
      }}
    >
      <form
        id="available-position-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="available-position-modal-title"
        onSubmit={onSubmit}
        onClick={(event) =>
          event.stopPropagation()
        }
        className="sibs-modal-pop-in flex max-h-[92dvh] w-full max-w-[1050px] flex-col overflow-hidden rounded-2xl border border-[#9FB3C8] bg-[#F7F9FC] shadow-[0_30px_90px_rgba(2,26,48,0.42)]"
      >
        <header className="shrink-0 bg-[#07365F] px-4 py-4 text-white sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#FF5C28]">
                <BriefcaseBusiness size={20} />
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="available-position-modal-title"
                    className="text-base font-extrabold text-white"
                  >
                    {isEditMode
                      ? "Edit Available Position"
                      : "Register Available Position"}
                  </h2>
                  <span className="inline-flex rounded bg-[#FF5C28] px-2.5 py-1 text-[9px] font-extrabold uppercase text-white">
                    {isEditMode ? "Edit Mode" : "New Registration"}
                  </span>
                </div>

                <p className="mt-0.5 text-xs font-semibold leading-relaxed text-blue-100">
                  Link an approved JD, confirm the organizational mapping, and manage applicant visibility.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={onReset}
                disabled={isSaving}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-white/10 bg-white/10 px-3 text-[10px] font-extrabold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={14} />
                Reset
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-[#FF5C28] px-3.5 text-[10px] font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#E95324] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={14} />
                )}

                {isSaving
                  ? "Saving..."
                  : isEditMode
                    ? "Update Position"
                    : "Save Position"}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                aria-label="Close Available Position modal"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-blue-100 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto bg-[#F7F9FC] p-3 sm:p-5">
          <div className="space-y-4">
            <PositionFormSection
              title="Approved JD Link"
              subtitle="Select an approved Job Description and retain its canonical document identifiers."
              icon={FileCheck2}
            >
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div className="lg:col-span-3">
                  <DropdownField
                    label="Approved Job Description"
                    required
                    value={form.positionTitle}
                    displayValue={form.positionTitle}
                    onChange={
                      handleApprovedJdPositionChange
                    }
                    options={
                      approvedJdDropdownOptions
                    }
                    placeholder="Search approved JD position"
                    searchPlaceholder="Search approved JD position..."
                    emptyMessage="No approved JD positions found."
                    disabled={isSaving}
                    searchable
                    zIndex="z-[190]"
                  />
                </div>

                <div>
                  <FieldLabel>JD ID</FieldLabel>
                  <input
                    value={
                      form.jdId ||
                      form.jd_id ||
                      ""
                    }
                    readOnly
                    className={INPUT_CLASS}
                    placeholder="Approved JD database ID"
                  />
                </div>

                <div>
                  <FieldLabel>JD Code</FieldLabel>
                  <input
                    value={
                      form.jdCode ||
                      form.jd_code ||
                      ""
                    }
                    readOnly
                    className={INPUT_CLASS}
                    placeholder="Approved JD code"
                  />
                </div>

                <div>
                  <FieldLabel required>
                    Position Title
                  </FieldLabel>
                  <input
                    value={
                      form.positionTitle || ""
                    }
                    onChange={(event) =>
                      updateField(
                        "positionTitle",
                        event.target.value,
                      )
                    }
                    disabled={isSaving}
                    className={INPUT_CLASS}
                    placeholder="Canonical position title"
                  />
                </div>

                <div className="lg:col-span-3">
                  <FieldLabel>
                    Document Title
                  </FieldLabel>
                  <input
                    value={
                      form.documentTitle ||
                      form.document_title ||
                      ""
                    }
                    readOnly
                    className={INPUT_CLASS}
                    placeholder="Approved JD document title"
                  />
                </div>
              </div>
            </PositionFormSection>

            <PositionFormSection
              title="Organizational Mapping"
              subtitle="Map the position to a database department, account, and applicant-facing site."
              icon={Building2}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DropdownField
                  label="Department"
                  required
                  value={form.departmentId}
                  displayValue={form.department}
                  onChange={
                    handleDepartmentChange
                  }
                  options={
                    departmentDropdownOptions
                  }
                  placeholder="Select department"
                  searchPlaceholder="Search departments..."
                  emptyMessage="No departments found."
                  disabled={isSaving}
                  searchable
                  zIndex="z-[180]"
                />

                <DropdownField
                  label="Account"
                  required
                  value={form.accountId}
                  displayValue={form.accountName}
                  onChange={handleAccountChange}
                  options={accountDropdownOptions}
                  placeholder={
                    form.departmentId
                      ? "Select account"
                      : "Select department first"
                  }
                  searchPlaceholder="Search accounts..."
                  emptyMessage="No accounts found for this department."
                  disabled={
                    isSaving ||
                    !form.departmentId
                  }
                  searchable
                  zIndex="z-[170]"
                />

                <div>
                  <FieldLabel>
                    Account GHL Name
                  </FieldLabel>
                  <input
                    value={
                      form.accountGhlName || ""
                    }
                    onChange={(event) =>
                      updateField(
                        "accountGhlName",
                        event.target.value,
                      )
                    }
                    disabled={isSaving}
                    className={INPUT_CLASS}
                    placeholder="Account GHL name"
                  />
                </div>

                <DropdownField
                  label="Location / Site"
                  required
                  value={form.locationSite}
                  onChange={(value) =>
                    updateField(
                      "locationSite",
                      value,
                    )
                  }
                  options={
                    locationDropdownOptions
                  }
                  placeholder="Select location / site"
                  disabled={isSaving}
                  zIndex="z-[160]"
                />
              </div>
            </PositionFormSection>

            <PositionFormSection
              title="Position Information"
              subtitle="Maintain the role description, searchable skills, status, and internal remarks."
              icon={Settings2}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FieldLabel>
                    Description
                  </FieldLabel>

                  <textarea
                    rows={4}
                    value={
                      form.description || ""
                    }
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value,
                      )
                    }
                    disabled={isSaving}
                    placeholder="Describe the position and its operational purpose."
                    className={TEXTAREA_CLASS}
                  />
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>
                    Preferred Skills
                  </FieldLabel>

                  <textarea
                    rows={3}
                    value={
                      form.preferredSkills || ""
                    }
                    onChange={(event) =>
                      updateField(
                        "preferredSkills",
                        event.target.value,
                      )
                    }
                    disabled={isSaving}
                    placeholder="Separate skills with commas, semicolons, or new lines."
                    className={TEXTAREA_CLASS}
                  />
                </div>

                <DropdownField
                  label="Status"
                  required
                  value={form.status}
                  onChange={(value) =>
                    updateField(
                      "status",
                      value,
                    )
                  }
                  options={
                    statusDropdownOptions
                  }
                  placeholder="Select status"
                  disabled={isSaving}
                  zIndex="z-[150]"
                />

                <div>
                  <FieldLabel>
                    Remarks
                  </FieldLabel>

                  <textarea
                    rows={3}
                    value={
                      form.remarks || ""
                    }
                    onChange={(event) =>
                      updateField(
                        "remarks",
                        event.target.value,
                      )
                    }
                    disabled={isSaving}
                    placeholder="Internal notes only."
                    className={`${TEXTAREA_CLASS} min-h-10`}
                  />
                </div>
              </div>
            </PositionFormSection>
          </div>
        </div>
      </form>
    </div>
  );
}
