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
      <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-3 text-xs font-extrabold text-[#042C51] outline-none transition focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10"
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
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/65 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="sibs-modal-pop-in max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E6ECF2] bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-4 bg-[#042C51] px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#FF5C28]">
              <UserPlus size={17} />
            </span>
            <div>
              <h3 className="text-sm font-extrabold">Add Admin User</h3>
              <p className="mt-0.5 text-xs text-slate-300">
                Frontend account setup preview
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Close add admin modal"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-3 p-5">
          <label className="block">
            <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
              Full Name
            </span>
            <input
              required
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="e.g. Maria Santos"
              className="h-11 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#042C51] outline-none focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
              Work Email
            </span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="name@thesiblingssolutions.com"
              className="h-11 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#042C51] outline-none focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10"
            />
          </label>

          <SelectField
            label="Grounded Access Level (1-7)"
            value={form.accessLevel}
            options={ACCESS_LEVELS}
            onChange={(value) => updateField("accessLevel", value)}
          />

          <label className="block">
            <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
              Department
            </span>
            <input
              value={form.department}
              onChange={(event) => updateField("department", event.target.value)}
              className="h-11 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#042C51] outline-none focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10"
            />
          </label>

          <SelectField
            label="Account Group"
            value={form.accountGroup}
            options={ACCOUNT_GROUPS}
            onChange={(value) => updateField("accountGroup", value)}
          />

          <div className="flex justify-end gap-2 border-t border-[#EEF2F6] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-[#042C51] hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white transition hover:bg-[#FF5C28]"
            >
              Save Admin Account
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
