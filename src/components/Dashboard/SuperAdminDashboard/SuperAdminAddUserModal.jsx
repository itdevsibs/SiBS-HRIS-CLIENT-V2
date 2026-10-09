import React, { useState } from "react";
import { UserPlus } from "lucide-react";

import { ModalShell, SelectDropdown } from "@/components/ui";
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

export default function SuperAdminAddUserModal({ open, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);

  if (!open) return null;

  function handleClose() {
    setForm(EMPTY_FORM);
    onClose?.();
  }

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

    handleClose();
  }

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      title="Add Admin User"
      subtitle="Frontend account setup and access tier preview"
      icon={UserPlus}
      maxWidth="max-w-md"
      variant="navy"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            className="sibs-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="super-admin-add-user-form"
            className="sibs-btn-primary"
          >
            Save Admin Account
          </button>
        </>
      }
    >
      <form
        id="super-admin-add-user-form"
        onSubmit={handleSubmit}
        className="space-y-3 font-jakarta"
      >
        <label className="block">
          <span className="sibs-modal-field-label">
            Full Name <span className="text-sibs-orange">*</span>
          </span>
          <input
            required
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="e.g. Maria Santos"
            className="sibs-modal-input"
          />
        </label>

        <label className="block">
          <span className="sibs-modal-field-label">
            Work Email <span className="text-sibs-orange">*</span>
          </span>
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="name@thesiblingssolutions.com"
            className="sibs-modal-input"
          />
        </label>

        <div className="space-y-1">
          <SelectDropdown
            label="Grounded Access Level (1-7)"
            value={form.accessLevel}
            options={ACCESS_LEVELS}
            onChange={(value) => updateField("accessLevel", value)}
            searchable={false}
          />
        </div>

        <label className="block">
          <span className="sibs-modal-field-label">
            Department
          </span>
          <input
            value={form.department}
            onChange={(event) => updateField("department", event.target.value)}
            className="sibs-modal-input"
          />
        </label>

        <div className="space-y-1">
          <SelectDropdown
            label="Account Group"
            value={form.accountGroup}
            options={ACCOUNT_GROUPS}
            onChange={(value) => updateField("accountGroup", value)}
            searchable={false}
          />
        </div>
      </form>
    </ModalShell>
  );
}
