import { useJobDescription } from "../../../services/context/JobDescriptionContext";
import ThemedDropdown from "../../layout/dropdown/ThemedDropdown";
import {
  getThemedDropdownOptionLabel,
  getThemedDropdownOptionValue,
} from "../../layout/dropdown/themedDropdownUtils";

const fieldLabelClass =
  "mb-1.5 flex items-center justify-between gap-3 text-xs font-extrabold text-sibs-primary-1";

const inputClass =
  "h-10 w-full rounded-[10px] border border-sibs-tertiary-8 bg-[#F8FAFC] px-3 text-xs font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#EEF2F6] disabled:text-sibs-primary-1";

function CompactInput({
  label,
  required = false,
  value,
  placeholder,
  type = "text",
  disabled = false,
  onChange,
}) {
  return (
    <label className="block min-w-0">
      <span className={fieldLabelClass}>
        <span>
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      </span>

      <input
        type={type}
        value={value || ""}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </label>
  );
}

export default function HiringRequirementSection({
  approvedJdOptions = [],
  approvedJdLoading = false,
  handleLinkedRequirementChange,
}) {
  const {
    form,
    setForm,
    accounts = [],
    departments = [],
  } = useJobDescription();

  const selectedExistingJd =
    form.existingJdId || form.existing_jd_id || form.linkedHiringRequirement || "";

  const selectedAccount =
    form.accountId || form.account_id || form.preparedForId || "";

  const selectedDepartment =
    form.departmentId || form.department_id || "";

  function updateField(field, value, aliases = []) {
    setForm((previous) => {
      const nextForm = {
        ...previous,
        [field]: value,
      };

      aliases.forEach((alias) => {
        nextForm[alias] = value;
      });

      return nextForm;
    });
  }

  function handleAccountChange(value) {
    const selectedOption = accounts.find(
      (option) => String(getThemedDropdownOptionValue(option)) === String(value),
    );
    const label = getThemedDropdownOptionLabel(selectedOption);

    setForm((previous) => ({
      ...previous,
      accountId: value,
      account_id: value,
      preparedForId: value,
      prepared_for_id: value,
      account: label,
      preparedFor: label,
      prepared_for: label,
    }));
  }

  function handleDepartmentChange(value) {
    const selectedOption = departments.find(
      (option) => String(getThemedDropdownOptionValue(option)) === String(value),
    );
    const label = getThemedDropdownOptionLabel(selectedOption);

    setForm((previous) => ({
      ...previous,
      departmentId: value,
      department_id: value,
      department: label,
      departmentName: label,
      department_name: label,
    }));
  }

  return (
    <div className="space-y-3.5">
      <ThemedDropdown
        label="Existing Job Description Template"
        helper="Select template or create new"
        value={selectedExistingJd}
        options={approvedJdOptions}
        disabled={approvedJdLoading}
        showPlaceholderOption
        placeholder={
          approvedJdLoading
            ? "Loading approved templates..."
            : "No Existing Job Description - New Job Description"
        }
        searchable
        onChange={(value) => {
          handleLinkedRequirementChange?.(value);
        }}
      />

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        <CompactInput
          label="Document Title"
          required
          value={form.documentTitle || form.document_title || ""}
          placeholder="e.g. JD_Senior_Support_v1.0.pdf"
          onChange={(value) =>
            updateField("documentTitle", value, ["document_title"])
          }
        />

        <CompactInput
          label="Role Title"
          required
          value={form.roleTitle || form.role_title || ""}
          placeholder="e.g. Senior Customer Support Representative"
          onChange={(value) => updateField("roleTitle", value, ["role_title"])}
        />

        <ThemedDropdown
          label="Account / Client"
          required
          value={selectedAccount}
          options={accounts}
          placeholder="Search account"
          searchable
          onChange={handleAccountChange}
        />

        <ThemedDropdown
          label="Department"
          required
          value={selectedDepartment}
          options={departments}
          placeholder="Search department"
          searchable
          onChange={handleDepartmentChange}
        />

        <CompactInput
          label="Date Requested"
          required
          type="date"
          value={form.dateRequested || form.date_requested || ""}
          onChange={(value) =>
            updateField("dateRequested", value, ["date_requested"])
          }
        />

        <CompactInput
          label="Prepared By / Requested By"
          required
          value={
            form.requestedBy ||
            form.requested_by ||
            form.owner ||
            form.preparedBy ||
            ""
          }
          disabled
          onChange={() => {}}
        />
      </div>
    </div>
  );
}
