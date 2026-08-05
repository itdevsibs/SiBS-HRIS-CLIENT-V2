import React, { useEffect } from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  ClipboardList,
  Info,
  Plus,
  RotateCcw,
  Target,
  X,
} from "lucide-react";
import { useActionItems } from "../../../services/context/ActionItemsContext.jsx";
import {
  GAP_OPTIONS,
  RISK_OPTIONS,
} from "../../../lib/utils/actionItems/actionItemsConstants.js";

const STATUS_OPTIONS = ["Planned", "Ongoing", "Completed"];

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.04em] text-[#174A7C]">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10";

const readOnlyInputClass =
  "h-11 w-full rounded-xl border border-[#E1E7EF] bg-[#F8FAFC] px-4 text-sm font-bold text-[#475467] outline-none";

const textAreaClass =
  "w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold leading-6 text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10";

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h3 className="text-sm font-extrabold text-[#101828]">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
            {description}
          </p>
        ) : null}
      </div>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FA] text-sibs-primary-1">
        <Icon size={19} />
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  const displayValue =
    value === 0 || value === "0" ? "0" : value || "—";

  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#E9EEF4] py-3 last:border-b-0">
      <p className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.04em] text-sibs-tertiary-5">
        {label}
      </p>

      <div className="max-w-[62%] break-words text-right text-[13px] font-bold leading-5 text-[#344054]">
        {displayValue}
      </div>
    </div>
  );
}

export default function AddActionItemModal() {
  const {
    showAddModal,
    closeAddModal,
    actionForm,
    setActionForm,
    linkedActionOptions,
    ownerOptions,
    selectLinkedRecord,
    resetActionForm,
    addActionItem,
  } = useActionItems();

  useEffect(() => {
    if (!showAddModal) return undefined;

    const previousOverflow = document.body.style.overflow;

    function handleEscape(event) {
      if (event.key === "Escape") {
        closeAddModal();
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showAddModal, closeAddModal]);

  if (!showAddModal) return null;

  const selectedKey = actionForm.weeklyPlanItemId
    ? `weekly-${actionForm.weeklyPlanItemId}`
    : actionForm.hiringNeedId
      ? `hiring-${actionForm.hiringNeedId}`
      : "";

  const selectedRole = linkedActionOptions.find(
    (option) => option.key === selectedKey,
  );

  const requirement = Number(actionForm.requirement || 0);
  const filled = Number(actionForm.filled || 0);
  const remainingGap = Math.max(requirement - filled, 0);

  function updateField(field, value) {
    setActionForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleReset() {
    resetActionForm();
  }

  return (
    <div
      className="sibs-modal-blur fixed inset-0 z-[10000] flex h-dvh items-center justify-center p-3 font-jakarta sm:p-5"
      onMouseDown={closeAddModal}
      role="presentation"
    >
      <form
        onSubmit={addActionItem}
        onMouseDown={(event) => event.stopPropagation()}
        className="sibs-modal-pop-in flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-action-item-title"
      >
        <header className="shrink-0 border-b border-[#E6ECF2] bg-white px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FA] text-sibs-primary-1 sm:flex">
                <ClipboardList size={21} />
              </div>

              <div className="min-w-0">
                <h2
                  id="add-action-item-title"
                  className="text-lg font-extrabold text-sibs-primary-1 sm:text-xl"
                >
                  Add Action Item
                </h2>

                <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-sibs-tertiary-5">
                  Create an action item linked to a hiring gap, role, owner, and
                  weekly hiring plan item.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeAddModal}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-[#F1F5F9] hover:text-gray-700 active:scale-[0.98]"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-[#F5F7FA] p-4 sibs-scrollbar sm:p-5">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
            <div className="space-y-4">
              <section className="rounded-2xl border border-[#DDE5EE] bg-white p-4 shadow-sm sm:p-5">
                <SectionHeading
                  icon={BriefcaseBusiness}
                  title="Link to Hiring Gap"
                  description="Choose the role or account that needs a linked recruitment action."
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <FieldLabel required>
                      Role / Account with Hiring Gap
                    </FieldLabel>

                    <select
                      required
                      value={selectedKey}
                      onChange={(event) =>
                        selectLinkedRecord(event.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="">Select role with hiring gap</option>

                      {linkedActionOptions.map((option) => {
                        const gap = Math.max(
                          Number(option.requirement || 0) -
                            Number(option.filled || 0),
                          0,
                        );

                        return (
                          <option key={option.key} value={option.key}>
                            {option.displayLabel} — {option.filled}/
                            {option.requirement} filled, {gap} remaining
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <FieldLabel>Role Title</FieldLabel>
                    <input
                      readOnly
                      value={actionForm.roleTitle || ""}
                      className={readOnlyInputClass}
                    />
                  </div>

                  <div>
                    <FieldLabel>Account</FieldLabel>
                    <input
                      readOnly
                      value={actionForm.account || ""}
                      className={readOnlyInputClass}
                    />
                  </div>

                  <div>
                    <FieldLabel>Approved Requirement</FieldLabel>
                    <input
                      readOnly
                      value={actionForm.requirement || ""}
                      className={readOnlyInputClass}
                    />
                  </div>

                  <div>
                    <FieldLabel>Current Filled</FieldLabel>
                    <input
                      readOnly
                      value={actionForm.filled || ""}
                      className={readOnlyInputClass}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#DDE5EE] bg-white p-4 shadow-sm sm:p-5">
                <SectionHeading
                  icon={Target}
                  title="Action Details"
                  description="Define the action, owner, deadline, status, risk, and linked hiring gap."
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <FieldLabel required>Action Item</FieldLabel>
                    <textarea
                      required
                      value={actionForm.actionItem}
                      onChange={(event) =>
                        updateField("actionItem", event.target.value)
                      }
                      rows={4}
                      placeholder="Example: Add 50 sourced candidates for CSR role before Friday."
                      className={`${textAreaClass} min-h-[112px]`}
                    />
                  </div>

                  <div>
                    <FieldLabel required>Owner</FieldLabel>
                    <select
                      required
                      value={actionForm.owner}
                      onChange={(event) =>
                        updateField("owner", event.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="">Select owner</option>
                      {ownerOptions
                        .filter((option) => option !== "All Owners")
                        .map((owner) => (
                        <option key={owner} value={owner}>
                          {owner}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel required>Deadline</FieldLabel>
                    <input
                      required
                      type="date"
                      value={actionForm.deadline}
                      onChange={(event) =>
                        updateField("deadline", event.target.value)
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <FieldLabel required>Status</FieldLabel>
                    <select
                      required
                      value={actionForm.status}
                      onChange={(event) =>
                        updateField("status", event.target.value)
                      }
                      className={inputClass}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel required>Risk Level</FieldLabel>
                    <select
                      required
                      value={actionForm.riskLevel}
                      onChange={(event) =>
                        updateField("riskLevel", event.target.value)
                      }
                      className={inputClass}
                    >
                      {RISK_OPTIONS.filter(
                        (option) => option !== "All Risk",
                      ).map((risk) => (
                        <option key={risk} value={risk}>
                          {risk}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <FieldLabel required>Linked Gap</FieldLabel>
                    <select
                      required
                      value={actionForm.linkedGap}
                      onChange={(event) =>
                        updateField("linkedGap", event.target.value)
                      }
                      className={inputClass}
                    >
                      {GAP_OPTIONS.filter(
                        (option) => option !== "All Gaps",
                      ).map((gap) => (
                        <option key={gap} value={gap}>
                          {gap}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <FieldLabel>Remarks</FieldLabel>
                    <textarea
                      value={actionForm.remarks}
                      onChange={(event) =>
                        updateField("remarks", event.target.value)
                      }
                      rows={3}
                      placeholder="Optional notes for weekly hiring call or report."
                      className={`${textAreaClass} min-h-[96px]`}
                    />
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-4 xl:sticky xl:top-0">
              <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sibs-primary-1 shadow-sm">
                    <Info size={19} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-sibs-primary-1">
                      How this connects to TA-HRIS
                    </h3>

                    <p className="mt-2 text-sm font-medium leading-6 text-sibs-primary-1/80">
                      Action Items are created when a role is not fully hired.
                      They connect the weekly hiring plan to execution and make
                      sure every gap has an owner, deadline, and follow-up
                      action.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#DDE5EE] bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-[#101828]">
                      Selected Hiring Gap
                    </h3>
                    <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                      Current details linked to this action item.
                    </p>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FA] text-sibs-primary-1">
                    <BriefcaseBusiness size={17} />
                  </div>
                </div>

                {selectedRole ? (
                  <div className="mb-3 rounded-xl border border-[#D9E7F5] bg-[#F5F9FD] px-4 py-3">
                    <p className="text-sm font-extrabold leading-5 text-sibs-primary-1">
                      {actionForm.roleTitle}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-sibs-primary-1/70">
                      {actionForm.account}
                    </p>
                  </div>
                ) : null}

                <div>
                  <DetailRow
                    label="Role / Account"
                    value={actionForm.roleAccount}
                  />
                  <DetailRow label="Requirement" value={requirement} />
                  <DetailRow label="Filled" value={filled} />
                  <DetailRow
                    label="Remaining Gap"
                    value={
                      selectedRole ? `${remainingGap} headcount` : "—"
                    }
                  />
                  <DetailRow
                    label="Suggested Gap"
                    value={actionForm.linkedGap}
                  />
                  <DetailRow
                    label="Risk Level"
                    value={actionForm.riskLevel}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                    <AlertTriangle size={19} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-amber-700">
                      Required Rule
                    </h3>

                    <p className="mt-2 text-sm font-medium leading-6 text-amber-700/90">
                      Every role where Current Filled is lower than Approved
                      Requirement should have at least one Planned or Ongoing
                      action item before the weekly report is generated.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-red-100 bg-red-50 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm">
                    <AlertTriangle size={19} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-extrabold text-red-700">
                        Backend Later
                      </h3>

                      <span className="rounded-full border border-red-200 bg-white px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-red-600">
                        Temporary
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-medium leading-6 text-red-700/90">
                      This form should later call POST
                      /api/recruitment/action-items and save
                      weekly_plan_item_id, hiring_need_id, linked_gap, owner,
                      deadline, status, and risk level.
                    </p>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </main>

        <footer className="shrink-0 border-t border-[#E6ECF2] bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
            >
              <RotateCcw size={17} />
              Reset
            </button>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={closeAddModal}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-[#F8FAFC] hover:text-sibs-primary-1 active:scale-[0.98]"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
              >
                <Plus size={17} />
                Save Action Item
              </button>
            </div>
          </div>
        </footer>
      </form>
    </div>
  );
}
