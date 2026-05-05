import { useEffect, useRef, useState } from "react";
import {
  UserPlus,
  Shield,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";

const adminAccessOptions = [
  { value: "1", label: "TA" },
  { value: "2", label: "HR" },
  { value: "3", label: "HR Admin" },
  { value: "4", label: "Finance" },
  { value: "5", label: "Manager" },
  { value: "6", label: "Executive" },
  { value: "7", label: "Super Admin" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function UserModal({
  mode = "add", // add | edit | delete
  open,
  onClose,
  onSubmit,
  onConfirmDelete,

  employeeSearch = "",
  onEmployeeSearchChange,
  showEmployeeDropdown = false,
  setShowEmployeeDropdown,
  employeeResults = [],
  searchingEmployees = false,
  onSelectEmployee,

  form,
  onChange,
  saving = false,
  deleting = false,

  selectedUser = null,
  formatAdminAccess,
}) {
  const isEdit = mode === "edit";
  const isDelete = mode === "delete";
  const isAdd = mode === "add";

  const employeeSearchRef = useRef(null);
  const adminAccessRef = useRef(null);
  const statusRef = useRef(null);

  const [adminAccessOpen, setAdminAccessOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setAdminAccessOpen(false);
        setStatusOpen(false);
        onClose();
      }
    };

    const handleClickOutside = (event) => {
      if (
        employeeSearchRef.current &&
        !employeeSearchRef.current.contains(event.target)
      ) {
        setShowEmployeeDropdown?.(false);
      }

      if (
        adminAccessRef.current &&
        !adminAccessRef.current.contains(event.target)
      ) {
        setAdminAccessOpen(false);
      }

      if (statusRef.current && !statusRef.current.contains(event.target)) {
        setStatusOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [open, onClose, setShowEmployeeDropdown]);

  if (!open) return null;
  if ((isEdit || isDelete) && !selectedUser) return null;

  const selectedAdminAccessValue = Array.isArray(form?.adminAccess)
    ? String(form.adminAccess[0] || "")
    : String(form?.adminAccess || "");

  const selectedAdminAccess =
    adminAccessOptions.find(
      (option) => option.value === selectedAdminAccessValue,
    )?.label || "";

  const selectedStatus =
    statusOptions.find((option) => option.value === String(form?.status || ""))
      ?.label || "";

  const fullName =
    isEdit || isDelete
      ? `${selectedUser?.lastName || ""}${selectedUser?.lastName ? ", " : ""}${
          selectedUser?.firstName || ""
        }${
          selectedUser?.middleName ? " " + selectedUser.middleName : ""
        }`.trim()
      : "";

  const title = isDelete ? "Delete User" : isEdit ? "Edit User" : "Add User";

  const subtitle = isDelete
    ? "This action cannot be undone"
    : isEdit
      ? "Update user access and permissions"
      : "Search employee and assign admin access";

  const Icon = isDelete ? AlertTriangle : isEdit ? Shield : UserPlus;

  const headerIconClass = isDelete
    ? "bg-red-100 text-red-600"
    : "bg-[var(--sibs-primary-1)]/10 text-sibs-primary-1";

  const titleClass = isDelete
    ? "text-2xl font-bold text-red-600"
    : "text-2xl font-bold text-sibs-primary-1";

  const isBusy = saving || deleting;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-modal-title"
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-sibs-tertiary-9 bg-white shadow-2xl"
      >
        <div className="shrink-0 border-b border-sibs-tertiary-9 px-6 py-5">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${headerIconClass}`}
            >
              <Icon size={22} />
            </div>

            <div>
              <h2 id="user-modal-title" className={titleClass}>
                {title}
              </h2>

              <p className="text-sm text-sibs-tertiary-5">{subtitle}</p>
            </div>
          </div>
        </div>

        {isDelete ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-5">
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-700">
                    Are you sure you want to delete this user account?
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <ReadOnlyField label="SiBS ID" value={selectedUser.sibsId} />
                  <ReadOnlyField
                    label="Employee ID"
                    value={selectedUser.gyEmpId}
                  />
                  <ReadOnlyField label="Full Name" value={fullName} />
                  <ReadOnlyField label="Email" value={selectedUser.email} />
                  <ReadOnlyField label="Account" value={selectedUser.account} />
                  <ReadOnlyField
                    label="Department"
                    value={selectedUser.department}
                  />
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-sibs-tertiary-9 bg-white p-6">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={deleting}
                  className="w-full rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm font-semibold text-sibs-tertiary-5 transition hover:bg-sibs-tertiary-10 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={onConfirmDelete}
                  disabled={deleting}
                  className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete User"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-5">
                {isAdd && (
                  <div ref={employeeSearchRef} className="relative z-50">
                    <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
                      SiBS ID / Employee Name
                    </label>

                    <input
                      type="text"
                      value={employeeSearch}
                      onChange={onEmployeeSearchChange}
                      onFocus={() => {
                        setShowEmployeeDropdown?.(true);
                        setAdminAccessOpen(false);
                        setStatusOpen(false);
                      }}
                      placeholder="Search SiBS ID or employee name"
                      disabled={saving}
                      autoComplete="off"
                      className="w-full rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none focus:border-[var(--sibs-primary-1)]"
                    />

                    {showEmployeeDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-2 max-h-60 overflow-y-auto rounded-xl border border-sibs-tertiary-9 bg-white shadow-2xl">
                        {searchingEmployees ? (
                          <div className="px-4 py-3 text-sm text-sibs-tertiary-5">
                            Searching...
                          </div>
                        ) : employeeResults.length > 0 ? (
                          employeeResults.map((item) => (
                            <button
                              key={item.gyEmpId}
                              type="button"
                              onClick={() => onSelectEmployee?.(item)}
                              className="block w-full border-b border-sibs-tertiary-9 px-4 py-3 text-left transition last:border-b-0 hover:bg-sibs-tertiary-10"
                            >
                              <div className="text-sm font-semibold text-sibs-primary-1">
                                {item.sibsId}
                              </div>

                              <div className="text-xs text-sibs-tertiary-5">
                                {`${item.lastName || ""}${
                                  item.lastName ? ", " : ""
                                }${item.firstName || ""}${
                                  item.middleName
                                    ? " " + item.middleName
                                    : ""
                                }`.trim()}
                              </div>
                            </button>
                          ))
                        ) : employeeSearch.trim() ? (
                          <div className="px-4 py-3 text-sm text-sibs-tertiary-5">
                            No employees found
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-sm text-sibs-tertiary-5">
                            Type to search
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {isEdit ? (
                    <>
                      <ReadOnlyField
                        label="SiBS ID"
                        value={selectedUser.sibsId}
                      />

                      <ReadOnlyField
                        label="Employee ID"
                        value={selectedUser.gyEmpId}
                      />

                      <ReadOnlyField label="Full Name" value={fullName} />

                      <ReadOnlyField
                        label="Email"
                        value={selectedUser.email}
                      />

                      <ReadOnlyField
                        label="Account"
                        value={selectedUser.account}
                      />

                      <ReadOnlyField
                        label="Department"
                        value={selectedUser.department}
                      />
                    </>
                  ) : (
                    <>
                      <ReadOnlyField label="Last Name" value={form?.lastName} />

                      <ReadOnlyField
                        label="First Name"
                        value={form?.firstName}
                      />

                      <ReadOnlyField
                        label="Middle Name"
                        value={form?.middleName}
                      />

                      <ReadOnlyField label="Email" value={form?.email} />

                      <ReadOnlyField label="Account" value={form?.account} />

                      <ReadOnlyField
                        label="Department"
                        value={form?.department}
                      />
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SingleSelect
                    refBox={adminAccessRef}
                    label="Admin Access"
                    value={selectedAdminAccess}
                    placeholder="Select admin access"
                    open={adminAccessOpen}
                    setOpen={setAdminAccessOpen}
                    disabled={saving}
                    options={adminAccessOptions}
                    selectedValue={selectedAdminAccessValue}
                    zIndex="z-40"
                    onBeforeOpen={() => {
                      setStatusOpen(false);
                      setShowEmployeeDropdown?.(false);
                    }}
                    onSelect={(value) => {
                      onChange?.({
                        target: {
                          name: "adminAccess",
                          value,
                          type: "text",
                        },
                      });

                      setAdminAccessOpen(false);
                      setStatusOpen(false);
                      setShowEmployeeDropdown?.(false);
                    }}
                  />

                  {isEdit && (
                    <SingleSelect
                      refBox={statusRef}
                      label="Status"
                      value={selectedStatus}
                      placeholder="Select status"
                      open={statusOpen}
                      setOpen={setStatusOpen}
                      disabled={saving}
                      options={statusOptions}
                      selectedValue={form?.status}
                      zIndex="z-30"
                      onBeforeOpen={() => {
                        setAdminAccessOpen(false);
                        setShowEmployeeDropdown?.(false);
                      }}
                      onSelect={(value) => {
                        onChange?.({
                          target: {
                            name: "status",
                            value,
                            type: "text",
                          },
                        });

                        setStatusOpen(false);
                        setAdminAccessOpen(false);
                        setShowEmployeeDropdown?.(false);
                      }}
                    />
                  )}
                </div>

                {isEdit && (
                  <div className="rounded-xl border border-sibs-tertiary-9 bg-sibs-tertiary-10 p-4">
                    <p className="text-sm text-sibs-tertiary-5">
                      Current Role Preview:
                      <span className="ml-2 font-semibold text-sibs-primary-1">
                        {formatAdminAccess
                          ? formatAdminAccess(selectedAdminAccessValue)
                          : selectedAdminAccess || "-"}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-sibs-tertiary-9 bg-white p-6">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="w-full rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm font-semibold text-sibs-tertiary-5 transition hover:bg-sibs-tertiary-10 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-[var(--sibs-primary-1)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Saving..." : isEdit ? "Save Changes" : "Add User"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function SingleSelect({
  refBox,
  label,
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
    <div ref={refBox} className={`relative ${zIndex}`}>
      <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
        {label}
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
                    String(selectedValue || "") === option.value
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

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
        {label}
      </label>

      <input
        type="text"
        value={value || "-"}
        readOnly
        className="w-full rounded-xl border border-sibs-tertiary-8 bg-sibs-tertiary-10 px-4 py-3 text-sm text-sibs-tertiary-5 outline-none"
      />
    </div>
  );
}