import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { UserPlus, ChevronDown, Plus, RotateCcw, X } from "lucide-react";
import StatusGuide from "../../../lib/utils/react-utils/StatusGuide";
import DesiredCompetenciesTable from "../../tables/jobDescription/DesiredCompetenciesTable";

const jdStatusOptions = [
  { value: "Existing", label: "Existing" },
  { value: "For Revision", label: "For Revision" },
  { value: "New Job Description", label: "New Job Description" },
];

function SingleSelect({
  refBox,
  label,
  required = false,
  value,
  placeholder,
  open,
  setOpen,
  disabled,
  options,
  selectedValue,
  onSelect,
  onBeforeOpen,
  zIndex = "z-20",
}) {
  return (
    <div ref={refBox} className={`relative self-start ${zIndex}`}>
      <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (disabled) return;

            if (!open) {
              onBeforeOpen?.();
            }

            setOpen((prev) => !prev);
          }}
          disabled={disabled}
          className="flex w-full items-center justify-between rounded-xl border border-[#D7DEE8] bg-white px-4 py-3 text-left text-sm outline-none transition focus:border-[var(--sibs-primary-1)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className={value ? "text-sibs-primary-1" : "text-gray-400"}>
            {value || placeholder}
          </span>

          <ChevronDown
            size={18}
            className={`text-sibs-tertiary-5 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full mt-2 max-h-60 overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl">
            <div className="max-h-60 overflow-y-auto py-2">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSelect(option.value)}
                  className={`block w-full px-4 py-3 text-left text-sm transition ${
                    String(selectedValue || "") === String(option.value)
                      ? "bg-[#EAF2FB] font-medium text-sibs-primary-1"
                      : "text-sibs-primary-1 hover:bg-[#F8FAFC]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchDropdown({
  refBox,
  label,
  required = false,
  value,
  searchValue,
  setSearchValue,
  placeholder,
  open,
  setOpen,
  disabled,
  loading,
  loadingText,
  options,
  selectedValue,
  getOptionValue,
  getOptionLabel,
  getOptionSubLabel,
  onSelect,
  onBeforeOpen,
  zIndex = "z-20",
}) {
  const filteredOptions = useMemo(() => {
    const keyword = String(searchValue || "")
      .trim()
      .toLowerCase();

    if (!keyword) return options;

    return options.filter((option) => {
      const labelText = String(getOptionLabel(option) || "").toLowerCase();
      const subLabelText = String(
        getOptionSubLabel?.(option) || "",
      ).toLowerCase();

      return labelText.includes(keyword) || subLabelText.includes(keyword);
    });
  }, [options, searchValue, getOptionLabel, getOptionSubLabel]);

  return (
    <div ref={refBox} className={`relative self-start ${zIndex}`}>
      <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <input
        type="text"
        required={required}
        value={open ? searchValue : value || ""}
        onChange={(e) => {
          setSearchValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (disabled || loading) return;

          onBeforeOpen?.();
          setSearchValue(value || "");
          setOpen(true);
        }}
        placeholder={loading ? loadingText : placeholder}
        disabled={disabled || loading}
        autoComplete="off"
        className="w-full rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none focus:border-[var(--sibs-primary-1)] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-sibs-tertiary-5"
      />

      {open && !disabled && !loading && (
        <div className="absolute left-0 right-0 top-full mt-2 max-h-60 overflow-y-auto rounded-xl border border-sibs-tertiary-9 bg-white shadow-2xl">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const optionValue = getOptionValue(option);
              const optionLabel = getOptionLabel(option);
              const optionSubLabel = getOptionSubLabel?.(option);
              const isSelected =
                String(selectedValue || "") === String(optionValue || "");

              return (
                <button
                  key={String(optionValue)}
                  type="button"
                  onClick={() => {
                    onSelect(option);
                    setSearchValue(optionLabel || "");
                    setOpen(false);
                  }}
                  className={`block w-full border-b border-sibs-tertiary-9 px-4 py-3 text-left transition last:border-b-0 ${
                    isSelected
                      ? "bg-[#EAF2FB] font-medium text-sibs-primary-1"
                      : "text-sibs-primary-1 hover:bg-sibs-tertiary-10"
                  }`}
                >
                  <div className="text-sm font-semibold text-sibs-primary-1">
                    {optionLabel}
                  </div>

                  {optionSubLabel && (
                    <div className="text-xs text-sibs-tertiary-5">
                      {optionSubLabel}
                    </div>
                  )}
                </button>
              );
            })
          ) : searchValue.trim() ? (
            <div className="px-4 py-3 text-sm text-sibs-tertiary-5">
              No results found
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-sibs-tertiary-5">
              Type to search
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AddJobDescription({
  open,
  form,
  setForm,
  accounts = [],
  departments = [],
  requestedByUsers = [],
  dropdownLoading,
  dropdownError,
  onClose,
  onSubmit,
  onReset,
}) {
  const linkedRequirementRef = useRef(null);
  const accountSearchRef = useRef(null);
  const departmentSearchRef = useRef(null);
  const jdStatusRef = useRef(null);
  const requestedByRef = useRef(null);

  const [mounted, setMounted] = useState(false);

  const [linkedRequirementOpen, setLinkedRequirementOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [jdStatusOpen, setJdStatusOpen] = useState(false);
  const [requestedByOpen, setRequestedByOpen] = useState(false);

  const [accountSearch, setAccountSearch] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [requestedBySearch, setRequestedBySearch] = useState("");

  const hasLinkedHiringRequirement = !!form.linkedHiringRequirement;

  const linkedRequirementOptions = useMemo(
    () => [
      {
        value: "",
        label: "No linked hiring requirement — New Job Description",
      },
    ],
    [],
  );

  const selectedLinkedRequirement =
    linkedRequirementOptions.find(
      (option) => option.value === String(form.linkedHiringRequirement || ""),
    )?.label || "";

  const selectedJdStatus =
    jdStatusOptions.find(
      (option) => option.value === String(form.jdStatus || ""),
    )?.label || "";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeAllDropdowns();
        onClose?.();
      }
    };

    const handleClickOutside = (event) => {
      if (
        linkedRequirementRef.current &&
        !linkedRequirementRef.current.contains(event.target)
      ) {
        setLinkedRequirementOpen(false);
      }

      if (
        accountSearchRef.current &&
        !accountSearchRef.current.contains(event.target)
      ) {
        setAccountOpen(false);
      }

      if (
        departmentSearchRef.current &&
        !departmentSearchRef.current.contains(event.target)
      ) {
        setDepartmentOpen(false);
      }

      if (jdStatusRef.current && !jdStatusRef.current.contains(event.target)) {
        setJdStatusOpen(false);
      }

      if (
        requestedByRef.current &&
        !requestedByRef.current.contains(event.target)
      ) {
        setRequestedByOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open, onClose]);

  function closeAllDropdowns() {
    setLinkedRequirementOpen(false);
    setAccountOpen(false);
    setDepartmentOpen(false);
    setJdStatusOpen(false);
    setRequestedByOpen(false);
  }

  function handleRequirementChange() {
    setForm((prev) => ({
      ...prev,
      linkedHiringRequirement: "",
      roleTitle: "",
      accountId: "",
      account: "",
      departmentId: "",
      department: "",
      jdStatus: "New Job Description",
      requestedBySibsId: "",
      requestedBy: "",
    }));

    setAccountSearch("");
    setDepartmentSearch("");
    setRequestedBySearch("");
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-job-description-modal-title"
        className="relative flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-sibs-tertiary-9 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-sibs-tertiary-9 bg-white px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--sibs-primary-1)]/10 text-sibs-primary-1">
                <UserPlus size={22} />
              </div>

              <div className="min-w-0">
                <h2
                  id="add-job-description-modal-title"
                  className="truncate text-xl font-bold text-sibs-primary-1 sm:text-2xl"
                >
                  Add Job Description
                </h2>

                <p className="truncate text-sm text-sibs-tertiary-5">
                  Create or track Job Description status for hiring requirements
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto p-5 pb-8 sm:p-6 sm:pb-8">
            <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-sm font-bold text-sibs-primary-1">
                Module Relationship
              </p>

              <p className="mt-1 text-sm leading-6 text-sibs-primary-1/80">
                Hiring Needs Intake links to this Job Description page. This
                page stores the actual JD record used by Weekly Hiring Plan and
                Candidate Pipeline.
              </p>
            </div>
            <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-[#101828]">
                Hiring Requirement Link
              </h3>

              {dropdownError && (
                <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {dropdownError}
                </div>
              )}

              <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <SingleSelect
                    refBox={linkedRequirementRef}
                    label="Linked Hiring Requirement"
                    value={selectedLinkedRequirement}
                    placeholder="Select hiring requirement"
                    open={linkedRequirementOpen}
                    setOpen={setLinkedRequirementOpen}
                    disabled={false}
                    options={linkedRequirementOptions}
                    selectedValue={form.linkedHiringRequirement}
                    zIndex="z-50"
                    onBeforeOpen={() => {
                      setAccountOpen(false);
                      setDepartmentOpen(false);
                      setJdStatusOpen(false);
                      setRequestedByOpen(false);
                    }}
                    onSelect={() => {
                      handleRequirementChange();
                      setLinkedRequirementOpen(false);
                    }}
                  />

                  <div className="mt-2 self-start">
                    <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
                      Document Title <span className="text-red-500">*</span>
                    </label>

                    <input
                      required
                      value={form.documentTitle}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          documentTitle: e.target.value,
                        }))
                      }
                      placeholder="New Document Title"
                      className="w-full rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none focus:border-[var(--sibs-primary-1)]"
                    />
                  </div>
                </div>

                <div className="self-start">
                  <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
                    Role Title <span className="text-red-500">*</span>
                  </label>

                  <input
                    required
                    value={form.roleTitle}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        roleTitle: e.target.value,
                      }))
                    }
                    placeholder="New Role Title"
                    className="w-full rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none focus:border-[var(--sibs-primary-1)]"
                  />
                </div>

                <SearchDropdown
                  refBox={accountSearchRef}
                  label="Account"
                  required
                  value={form.account}
                  searchValue={accountSearch}
                  setSearchValue={setAccountSearch}
                  placeholder="Search account"
                  open={accountOpen}
                  setOpen={setAccountOpen}
                  disabled={false}
                  loading={dropdownLoading}
                  loadingText="Loading accounts..."
                  options={accounts}
                  selectedValue={form.accountId}
                  getOptionValue={(item) => item.gy_acc_id}
                  getOptionLabel={(item) => item.gy_acc_name}
                  onBeforeOpen={() => {
                    setLinkedRequirementOpen(false);
                    setDepartmentOpen(false);
                    setJdStatusOpen(false);
                    setRequestedByOpen(false);
                  }}
                  onSelect={(selectedAccount) => {
                    setForm((prev) => ({
                      ...prev,
                      accountId: selectedAccount
                        ? selectedAccount.gy_acc_id
                        : "",
                      account: selectedAccount
                        ? selectedAccount.gy_acc_name
                        : "",
                    }));
                  }}
                  zIndex="z-40"
                />

                <SearchDropdown
                  refBox={departmentSearchRef}
                  label="Department"
                  required
                  value={form.department}
                  searchValue={departmentSearch}
                  setSearchValue={setDepartmentSearch}
                  placeholder="Search department"
                  open={departmentOpen}
                  setOpen={setDepartmentOpen}
                  disabled={false}
                  loading={dropdownLoading}
                  loadingText="Loading departments..."
                  options={departments}
                  selectedValue={form.departmentId}
                  getOptionValue={(item) => item.id_department}
                  getOptionLabel={(item) => item.name_department}
                  onBeforeOpen={() => {
                    setLinkedRequirementOpen(false);
                    setAccountOpen(false);
                    setJdStatusOpen(false);
                    setRequestedByOpen(false);
                  }}
                  onSelect={(selectedDepartment) => {
                    setForm((prev) => ({
                      ...prev,
                      departmentId: selectedDepartment
                        ? selectedDepartment.id_department
                        : "",
                      department: selectedDepartment
                        ? selectedDepartment.name_department
                        : "",
                    }));
                  }}
                  zIndex="z-30"
                />

                {hasLinkedHiringRequirement ? (
                  <SingleSelect
                    refBox={jdStatusRef}
                    label="Job Description Status"
                    required
                    value={selectedJdStatus}
                    placeholder="Select Job Description status"
                    open={jdStatusOpen}
                    setOpen={setJdStatusOpen}
                    disabled={false}
                    options={jdStatusOptions}
                    selectedValue={form.jdStatus}
                    zIndex="z-20"
                    onBeforeOpen={() => {
                      setLinkedRequirementOpen(false);
                      setAccountOpen(false);
                      setDepartmentOpen(false);
                      setRequestedByOpen(false);
                    }}
                    onSelect={(value) => {
                      setForm((prev) => ({
                        ...prev,
                        jdStatus: value,
                      }));

                      setJdStatusOpen(false);
                    }}
                  />
                ) : (
                  <div className="self-start">
                    <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
                      Job Description Status{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      readOnly
                      value="New Job Description"
                      className="w-full cursor-not-allowed rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 outline-none"
                    />

                    <p className="mt-2 text-xs font-semibold text-blue-700">
                      Since this Job Description has no linked hiring
                      requirement, the only valid status is New Job Description.
                    </p>
                  </div>
                )}

                <div className="md:col-span-2">
                  <StatusGuide />
                </div>

                <div className="self-start">
                  <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
                    Owner <span className="text-red-500">*</span>
                  </label>

                  <input
                    readOnly
                    value={form.owner || ""}
                    placeholder="Logged-in user account"
                    className="w-full cursor-not-allowed rounded-xl border border-sibs-tertiary-8 bg-gray-50 px-4 py-3 text-sm font-semibold uppercase text-sibs-primary-1 outline-none"
                  />

                  <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
                    Owner is automatically set based on the logged-in user
                    account.
                  </p>
                </div>

                <SearchDropdown
                  refBox={requestedByRef}
                  label="Requested By"
                  required
                  value={form.requestedBy}
                  searchValue={requestedBySearch}
                  setSearchValue={setRequestedBySearch}
                  placeholder="Search requested by"
                  open={requestedByOpen}
                  setOpen={setRequestedByOpen}
                  disabled={false}
                  loading={dropdownLoading}
                  loadingText="Loading requested by..."
                  options={requestedByUsers}
                  selectedValue={form.requestedBySibsId}
                  getOptionValue={(item) => item.sibs_id}
                  getOptionLabel={(item) => item.display_name}
                  getOptionSubLabel={(item) => `SIBS ID: ${item.sibs_id}`}
                  onBeforeOpen={() => {
                    setLinkedRequirementOpen(false);
                    setAccountOpen(false);
                    setDepartmentOpen(false);
                    setJdStatusOpen(false);
                  }}
                  onSelect={(selectedRequester) => {
                    setForm((prev) => ({
                      ...prev,
                      requestedBySibsId: selectedRequester
                        ? selectedRequester.sibs_id
                        : "",
                      requestedBy: selectedRequester
                        ? selectedRequester.display_name
                        : "",
                    }));
                  }}
                  zIndex="z-10"
                />

                <div className="self-start">
                  <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
                    Date Requested
                  </label>

                  <input
                    type="date"
                    value={form.dateRequested}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        dateRequested: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none focus:border-[var(--sibs-primary-1)]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-[#101828]">
                Job Description Content
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
                    Job Summary / Description{" "}
                    <span className="text-red-500">*</span>
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

            <DesiredCompetenciesTable />
          </div>

          <div className="shrink-0 border-t border-sibs-tertiary-9 bg-white px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onReset}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-sibs-tertiary-8 bg-white px-5 text-sm font-semibold text-sibs-tertiary-5 transition hover:bg-sibs-tertiary-10"
              >
                <RotateCcw size={17} />
                Reset
              </button>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-sibs-tertiary-8 bg-white px-5 text-sm font-semibold text-sibs-tertiary-5 transition hover:bg-sibs-tertiary-10"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Plus size={17} />
                Save Job Description
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
