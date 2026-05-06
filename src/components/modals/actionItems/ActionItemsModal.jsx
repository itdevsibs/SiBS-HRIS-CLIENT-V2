import React from "react";
import { X, Plus, RotateCcw } from "lucide-react";

const activeHiringGaps = [
  {
    weeklyPlanItemId: 1,
    hiringNeedId: 101,
    roleAccount: "CSR - SIBS Operations",
    roleTitle: "Customer Service Representative",
    account: "SIBS Operations",
    requirement: 20,
    filled: 12,
    suggestedGap: "Pipeline",
    suggestedRisk: "High",
    taOwner: "Maria Reyes",
    roleStatus: "At Risk",
  },
  {
    weeklyPlanItemId: 2,
    hiringNeedId: 102,
    roleAccount: "QA - SIBS Operations",
    roleTitle: "QA Specialist",
    account: "SIBS Operations",
    requirement: 5,
    filled: 2,
    suggestedGap: "Interview",
    suggestedRisk: "High",
    taOwner: "John Dela Cruz",
    roleStatus: "Delayed",
  },
  {
    weeklyPlanItemId: 3,
    hiringNeedId: 103,
    roleAccount: "System Developer - SIBS IT",
    roleTitle: "System Developer",
    account: "SIBS IT",
    requirement: 3,
    filled: 1,
    suggestedGap: "Offer",
    suggestedRisk: "Medium",
    taOwner: "Kim Domingo",
    roleStatus: "At Risk",
  },
  {
    weeklyPlanItemId: 4,
    hiringNeedId: 104,
    roleAccount: "RCM Analyst - SIBS RCM",
    roleTitle: "RCM Analyst",
    account: "SIBS RCM",
    requirement: 5,
    filled: 3,
    suggestedGap: "Pipeline",
    suggestedRisk: "Medium",
    taOwner: "Paul Garcia",
    roleStatus: "On Track",
  },
  {
    weeklyPlanItemId: 5,
    hiringNeedId: 105,
    roleAccount: "HR Assistant - SIBS HR",
    roleTitle: "HR Assistant",
    account: "SIBS HR",
    requirement: 2,
    filled: 0,
    suggestedGap: "Approval",
    suggestedRisk: "Medium",
    taOwner: "Maria Reyes",
    roleStatus: "Delayed",
  },
];

const actionStatusOptions = ["Planned", "Ongoing", "Completed"];
const actionRiskOptions = ["High", "Medium", "Low"];

const actionGapOptions = [
  "Pipeline",
  "Screening",
  "Interview",
  "Offer",
  "JD",
  "Approval",
  "Capacity / Manpower",
];

const actionOwnerOptions = [
  "Maria Reyes",
  "John Dela Cruz",
  "Kim Domingo",
  "Paul Garcia",
];

const emptyActionForm = {
  weeklyPlanItemId: "",
  hiringNeedId: "",
  roleAccount: "",
  roleTitle: "",
  account: "",
  requirement: 0,
  filled: 0,
  actionItem: "",
  owner: "",
  deadline: "",
  status: "Planned",
  riskLevel: "Medium",
  linkedGap: "Pipeline",
  remarks: "",
};

function inputClass(extra = "") {
  return `h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function textareaClass(extra = "") {
  return `w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className="max-w-[60%] break-words text-right text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}

export function AddActionItemModal({
  open,
  form,
  setForm,
  onClose,
  onSubmit,
  onReset,
}) {
  if (!open) return null;

  const selectedRole = activeHiringGaps.find(
    (role) => String(role.weeklyPlanItemId) === String(form.weeklyPlanItemId)
  );

  const remainingGap =
    Number(form.requirement || 0) - Number(form.filled || 0);

  function handleRoleChange(weeklyPlanItemId) {
    const selectedGap = activeHiringGaps.find(
      (role) => String(role.weeklyPlanItemId) === String(weeklyPlanItemId)
    );

    if (!selectedGap) {
      setForm(emptyActionForm);
      return;
    }

    setForm({
      ...form,
      weeklyPlanItemId: selectedGap.weeklyPlanItemId,
      hiringNeedId: selectedGap.hiringNeedId,
      roleAccount: selectedGap.roleAccount,
      roleTitle: selectedGap.roleTitle,
      account: selectedGap.account,
      requirement: selectedGap.requirement,
      filled: selectedGap.filled,
      owner: selectedGap.taOwner,
      linkedGap: selectedGap.suggestedGap,
      riskLevel: selectedGap.suggestedRisk,
      status: "Planned",
    });
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Add Action Item
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Create an action item linked to a hiring gap, role, owner, and
              weekly hiring plan item.
            </p>
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

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Link to Hiring Gap
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Role / Account with Hiring Gap{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <select
                      required
                      value={form.weeklyPlanItemId}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      className={inputClass()}
                    >
                      <option value="">Select role with hiring gap</option>

                      {activeHiringGaps.map((role) => {
                        const gap = role.requirement - role.filled;

                        return (
                          <option
                            key={role.weeklyPlanItemId}
                            value={role.weeklyPlanItemId}
                          >
                            {role.roleAccount} — {role.filled}/
                            {role.requirement} filled, {gap} remaining
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Role Title
                    </label>

                    <input
                      readOnly
                      value={form.roleTitle}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Account
                    </label>

                    <input
                      readOnly
                      value={form.account}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Approved Requirement
                    </label>

                    <input
                      readOnly
                      value={form.requirement || ""}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Current Filled
                    </label>

                    <input
                      readOnly
                      value={form.filled || ""}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Action Details
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Action Item <span className="text-red-500">*</span>
                    </label>

                    <textarea
                      required
                      value={form.actionItem}
                      onChange={(e) =>
                        setForm({ ...form, actionItem: e.target.value })
                      }
                      rows={4}
                      placeholder="Example: Add 50 sourced candidates for CSR role before Friday."
                      className={textareaClass()}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Owner <span className="text-red-500">*</span>
                    </label>

                    <select
                      required
                      value={form.owner}
                      onChange={(e) =>
                        setForm({ ...form, owner: e.target.value })
                      }
                      className={inputClass()}
                    >
                      <option value="">Select owner</option>

                      {actionOwnerOptions.map((owner) => (
                        <option key={owner} value={owner}>
                          {owner}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Deadline <span className="text-red-500">*</span>
                    </label>

                    <input
                      required
                      type="date"
                      value={form.deadline}
                      onChange={(e) =>
                        setForm({ ...form, deadline: e.target.value })
                      }
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Status <span className="text-red-500">*</span>
                    </label>

                    <select
                      required
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                      className={inputClass()}
                    >
                      {actionStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Risk Level <span className="text-red-500">*</span>
                    </label>

                    <select
                      required
                      value={form.riskLevel}
                      onChange={(e) =>
                        setForm({ ...form, riskLevel: e.target.value })
                      }
                      className={inputClass()}
                    >
                      {actionRiskOptions.map((risk) => (
                        <option key={risk} value={risk}>
                          {risk}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Linked Gap <span className="text-red-500">*</span>
                    </label>

                    <select
                      required
                      value={form.linkedGap}
                      onChange={(e) =>
                        setForm({ ...form, linkedGap: e.target.value })
                      }
                      className={inputClass()}
                    >
                      {actionGapOptions.map((gap) => (
                        <option key={gap} value={gap}>
                          {gap}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Remarks
                    </label>

                    <textarea
                      value={form.remarks}
                      onChange={(e) =>
                        setForm({ ...form, remarks: e.target.value })
                      }
                      rows={3}
                      placeholder="Optional notes for weekly hiring call or report."
                      className={textareaClass()}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  How this connects to TA-HRIS
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  Action Items are created when a role is not fully hired. They
                  connect the weekly hiring plan to execution and make sure
                  every gap has an owner, deadline, and follow-up action.
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Selected Hiring Gap
                </h3>

                <div className="mt-4">
                  <DetailRow label="Role / Account" value={form.roleAccount} />
                  <DetailRow label="Requirement" value={form.requirement} />
                  <DetailRow label="Filled" value={form.filled} />
                  <DetailRow
                    label="Remaining Gap"
                    value={
                      selectedRole
                        ? `${Math.max(remainingGap, 0)} headcount`
                        : "—"
                    }
                  />
                  <DetailRow label="Suggested Gap" value={form.linkedGap} />
                  <DetailRow label="Risk Level" value={form.riskLevel} />
                </div>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <h3 className="text-sm font-bold text-amber-700">
                  Required Rule
                </h3>

                <p className="mt-2 text-sm leading-6 text-amber-700/90">
                  Every role where Current Filled is lower than Approved
                  Requirement should have at least one Planned or Ongoing action
                  item before the weekly report is generated.
                </p>
              </div>

              <div className="rounded-xl border border-red-100 bg-red-50 p-5">
                <h3 className="text-sm font-bold text-red-700">
                  Backend Later
                </h3>

                <p className="mt-2 text-sm leading-6 text-red-700/90">
                  This form should later call POST /api/recruitment/action-items
                  and save weekly_plan_item_id, hiring_need_id, linked_gap,
                  owner, deadline, status, and risk level.
                </p>
              </div>
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5"
            >
              <RotateCcw size={17} />
              Reset
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              onClick={onSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <Plus size={17} />
              Save Action Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}