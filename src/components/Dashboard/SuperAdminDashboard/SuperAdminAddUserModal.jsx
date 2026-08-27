import { useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";

import {
  ACCESS_LEVELS,
  ACCOUNT_GROUPS,
} from "../../../lib/utils/Dashboards/SuperAdminDashboard/superAdminDashboardHelpers.js";

const EMPTY_FORM = {
  name: "",
  email: "",
  accessLevel: "3 - HR Admin",
  department: "Human Resources",
  accountGroup: "Internal HR Ops",
};

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 2xl:px-3.5 sibs-text-xs font-semibold text-[#042C51] outline-none transition focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function SuperAdminAddUserModal({ open, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
    }
  }, [open]);

  if (!open) return null;

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim()) return;

    onSave({
      id: `ADM-${String(Date.now()).slice(-6)}`,
      name: form.name.trim(),
      email: form.email.trim(),
      accessLevel: form.accessLevel,
      department: form.department.trim() || "Human Resources",
      accountGroup: form.accountGroup,
      lastActive: "Just created",
      status: "Active",
    });
  }

  return (
    <div
      className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[10000] flex items-center justify-center p-2 font-jakarta sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="sibs-modal-pop-in flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl font-jakarta">
        <header className="flex shrink-0 items-center justify-between gap-4 bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5">
          <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
            <span className="flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
              <UserPlus size={16} />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-base sm:text-lg 2xl:text-xl font-extrabold text-white">Add Admin User</h3>
              <p className="mt-0.5 truncate sibs-text-xs font-semibold text-white/75">
                Frontend account setup preview
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close add admin modal"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 2xl:p-6 sibs-scrollbar space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                Full Name
              </span>
              <input
                required
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="e.g. Maria Santos"
                className="h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 2xl:px-3.5 sibs-text-xs font-semibold text-[#042C51] outline-none transition focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                Work Email
              </span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="name@thesiblingssolutions.com"
                className="h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 2xl:px-3.5 sibs-text-xs font-semibold text-[#042C51] outline-none transition focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10"
              />
            </label>

            <SelectField
              label="Grounded Access Level (1-7)"
              value={form.accessLevel}
              options={ACCESS_LEVELS}
              onChange={(value) => updateField("accessLevel", value)}
            />

            <label className="block">
              <span className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                Department
              </span>
              <input
                value={form.department}
                onChange={(event) => updateField("department", event.target.value)}
                className="h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 2xl:px-3.5 sibs-text-xs font-semibold text-[#042C51] outline-none transition focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10"
              />
            </label>

            <SelectField
              label="Account Group"
              value={form.accountGroup}
              options={ACCOUNT_GROUPS}
              onChange={(value) => updateField("accountGroup", value)}
            />
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-[#DDE5EE] bg-[#F1F5F9] px-5 py-3 2xl:py-3.5 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#667085] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] active:scale-[0.98]"
            >
              Save Admin Account
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
