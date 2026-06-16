import { X, ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { useTalentPool } from "../../../services/context/TalentPoolContext";
import {
  inputClass,
  textareaClass,
  toDisplayPersonName,
} from "../../../lib/utils/talentPool/talentPoolHelpers";
import { FieldLabel } from "../../recruitment/talentPool/TalentPoolShared";

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function normalizeDepartmentOption(item) {
  if (!item) return null;

  if (typeof item === "string") {
    const name = cleanText(item);

    if (!name) return null;

    return {
      departmentId: name,
      departmentName: name,
      departmentKey: normalizeKey(name),
    };
  }

  const departmentId =
    item.departmentId ??
    item.department_id ??
    item.id_department ??
    item.gy_dept_id ??
    item.id ??
    "";

  const departmentName =
    item.departmentName ||
    item.department_name ||
    item.name_department ||
    item.department ||
    item.name ||
    item.label ||
    item.value ||
    "";

  const finalName = cleanText(departmentName || departmentId);
  const finalId = cleanText(departmentId || finalName);

  if (!finalName && !finalId) return null;

  return {
    departmentId: finalId,
    departmentName: finalName,
    departmentKey: normalizeKey(finalName || finalId),
  };
}

function normalizeAccountOption(item) {
  if (!item) return null;

  if (typeof item === "string") {
    const name = cleanText(item);

    if (!name) return null;

    return {
      accountId: name,
      accountName: name,
      accountGhlName: "",
      departmentId: "",
      departmentName: "",
      departmentKey: "",
      accountKey: normalizeKey(name),
    };
  }

  const accountId =
    item.accountId ??
    item.account_id ??
    item.gy_acc_id ??
    item.id ??
    "";

  const accountName =
    item.accountName ||
    item.account_name ||
    item.gy_acc_name ||
    item.account ||
    item.name ||
    item.label ||
    item.value ||
    "";

  const accountGhlName =
    item.accountGhlName ||
    item.account_ghl_name ||
    item.gy_acc_ghl_name ||
    item.ghlName ||
    item.ghl_name ||
    "";

  const departmentId =
    item.departmentId ??
    item.department_id ??
    item.gy_dept_id ??
    item.id_department ??
    "";

  const departmentName =
    item.departmentName ||
    item.department_name ||
    item.name_department ||
    item.department ||
    "";

  const finalAccountName = cleanText(accountName || accountId);
  const finalAccountId = cleanText(accountId || finalAccountName);
  const finalDepartmentName = cleanText(departmentName);
  const finalDepartmentId = cleanText(departmentId);

  if (!finalAccountName && !finalAccountId) return null;

  return {
    accountId: finalAccountId,
    accountName: finalAccountName,
    accountGhlName: cleanText(accountGhlName),
    departmentId: finalDepartmentId,
    departmentName: finalDepartmentName,
    departmentKey: normalizeKey(finalDepartmentName || finalDepartmentId),
    accountKey: normalizeKey(`${finalDepartmentId || finalDepartmentName}-${finalAccountId || finalAccountName}`),
  };
}

function getUniqueDepartments(items = []) {
  const map = new Map();

  items.forEach((item) => {
    const department = normalizeDepartmentOption(item);

    if (!department) return;

    const key = department.departmentKey;

    if (!key) return;

    const existing = map.get(key);

    if (!existing) {
      map.set(key, department);
      return;
    }

    map.set(key, {
      departmentId: existing.departmentId || department.departmentId,
      departmentName: existing.departmentName || department.departmentName,
      departmentKey: key,
    });
  });

  return Array.from(map.values()).sort((a, b) =>
    a.departmentName.localeCompare(b.departmentName),
  );
}

function getUniqueAccounts(items = []) {
  const map = new Map();

  items.forEach((item) => {
    const account = normalizeAccountOption(item);

    if (!account) return;

    const key = account.accountKey || normalizeKey(account.accountName);

    if (!key) return;

    const existing = map.get(key);

    if (!existing) {
      map.set(key, account);
      return;
    }

    map.set(key, {
      accountId: existing.accountId || account.accountId,
      accountName: existing.accountName || account.accountName,
      accountGhlName: existing.accountGhlName || account.accountGhlName,
      departmentId: existing.departmentId || account.departmentId,
      departmentName: existing.departmentName || account.departmentName,
      departmentKey: existing.departmentKey || account.departmentKey,
      accountKey: key,
    });
  });

  return Array.from(map.values()).sort((a, b) =>
    a.accountName.localeCompare(b.accountName),
  );
}

function getPositionSourceDepartments(items = []) {
  return items
    .map((item) => {
      const account = normalizeAccountOption(item);

      if (account?.departmentId || account?.departmentName) {
        return {
          departmentId: account.departmentId || account.departmentName,
          departmentName: account.departmentName || account.departmentId,
        };
      }

      return normalizeDepartmentOption(item);
    })
    .filter(Boolean);
}

export default function MoveToPipeLineModal() {
  const {
    pipelineTarget,
    moveToPipelineForm,
    setMoveToPipelineForm,
    currentTaOwner,
    closeMoveToPipeline,
    submitMoveToPipeline,
    departmentOptions = [],
    accountOptions = [],
    activePositionOptions = [],
    availablePositionOptions = [],
    openPositionOptions = [],
    isSaving,
  } = useTalentPool();

  const positionSources = useMemo(
    () => [
      ...activePositionOptions,
      ...availablePositionOptions,
      ...openPositionOptions,
    ],
    [activePositionOptions, availablePositionOptions, openPositionOptions],
  );

  const normalizedAccounts = useMemo(() => {
    const primaryAccounts =
      Array.isArray(accountOptions) && accountOptions.length > 0
        ? accountOptions
        : positionSources;

    return getUniqueAccounts(primaryAccounts);
  }, [accountOptions, positionSources]);

  const normalizedDepartments = useMemo(() => {
    const primaryDepartments =
      Array.isArray(departmentOptions) && departmentOptions.length > 0
        ? departmentOptions
        : getPositionSourceDepartments([...normalizedAccounts, ...positionSources]);

    return getUniqueDepartments(primaryDepartments);
  }, [departmentOptions, normalizedAccounts, positionSources]);

  if (!pipelineTarget) return null;

  const ownerName = toDisplayPersonName(
    moveToPipelineForm.taOwner || currentTaOwner,
    "Current User",
  );

  const targetDepartmentId =
    moveToPipelineForm.leadDepartmentId ||
    moveToPipelineForm.departmentId ||
    pipelineTarget.leadDepartmentId ||
    pipelineTarget.departmentId ||
    pipelineTarget.department_id ||
    pipelineTarget.gy_dept_id ||
    "";

  const targetDepartmentName =
    moveToPipelineForm.leadDepartment ||
    moveToPipelineForm.department ||
    pipelineTarget.leadDepartment ||
    pipelineTarget.department ||
    pipelineTarget.departmentName ||
    "";

  const selectedDepartment =
    normalizedDepartments.find(
      (department) =>
        cleanText(department.departmentId) &&
        String(department.departmentId) === String(targetDepartmentId),
    ) ||
    normalizedDepartments.find(
      (department) =>
        department.departmentKey === normalizeKey(targetDepartmentName),
    ) ||
    null;

  const selectedDepartmentValue = selectedDepartment?.departmentKey || "";

  const filteredAccounts = selectedDepartment
    ? normalizedAccounts.filter((account) => {
        const accountDepartmentId = cleanText(account.departmentId);
        const accountDepartmentKey = normalizeKey(
          account.departmentName || account.departmentId,
        );

        return (
          String(accountDepartmentId) === String(selectedDepartment.departmentId) ||
          accountDepartmentKey === selectedDepartment.departmentKey
        );
      })
    : [];

  const targetAccountId =
    moveToPipelineForm.leadAccountId ||
    moveToPipelineForm.accountId ||
    pipelineTarget.leadAccountId ||
    pipelineTarget.accountId ||
    pipelineTarget.account_id ||
    pipelineTarget.gy_acc_id ||
    "";

  const targetAccountName =
    moveToPipelineForm.leadAccount ||
    moveToPipelineForm.account ||
    pipelineTarget.leadAccount ||
    pipelineTarget.accountFit ||
    pipelineTarget.appliedAccount ||
    pipelineTarget.currentAppliedAccount ||
    pipelineTarget.accountName ||
    pipelineTarget.account ||
    "";

  const selectedAccount =
    filteredAccounts.find(
      (account) =>
        cleanText(account.accountId) &&
        String(account.accountId) === String(targetAccountId),
    ) ||
    filteredAccounts.find(
      (account) => normalizeKey(account.accountName) === normalizeKey(targetAccountName),
    ) ||
    null;

  const selectedAccountValue = selectedAccount?.accountKey || "";

  function handleDepartmentChange(departmentKey) {
    const selected = normalizedDepartments.find(
      (department) => department.departmentKey === departmentKey,
    );

    setMoveToPipelineForm({
      ...moveToPipelineForm,
      leadDepartmentId: selected?.departmentId || "",
      leadDepartment: selected?.departmentName || "",
      departmentId: selected?.departmentId || "",
      department: selected?.departmentName || "",
      leadAccountId: "",
      leadAccount: "",
      accountId: "",
      accountName: "",
      accountGhlName: "",
    });
  }

  function handleAccountChange(accountKey) {
    const selected = filteredAccounts.find(
      (account) => account.accountKey === accountKey,
    );

    const matchedDepartment =
      normalizedDepartments.find(
        (department) =>
          String(department.departmentId) === String(selected?.departmentId),
      ) ||
      normalizedDepartments.find(
        (department) =>
          department.departmentKey ===
          normalizeKey(selected?.departmentName || selected?.departmentId),
      ) ||
      selectedDepartment;

    setMoveToPipelineForm({
      ...moveToPipelineForm,
      leadDepartmentId:
        matchedDepartment?.departmentId || selected?.departmentId || "",
      leadDepartment:
        matchedDepartment?.departmentName || selected?.departmentName || "",
      departmentId:
        matchedDepartment?.departmentId || selected?.departmentId || "",
      department: matchedDepartment?.departmentName || selected?.departmentName || "",
      leadAccountId: selected?.accountId || "",
      leadAccount: selected?.accountName || "",
      accountId: selected?.accountId || "",
      accountName: selected?.accountName || "",
      accountGhlName: selected?.accountGhlName || "",
    });
  }

  return (
    <div
      className="fixed inset-0 z-[10002] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={isSaving ? undefined : closeMoveToPipeline}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1">
              Move to Candidate Pipeline
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              {pipelineTarget.name}
            </p>
          </div>

          <button
            type="button"
            onClick={closeMoveToPipeline}
            disabled={isSaving}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submitMoveToPipeline} className="space-y-4 p-5">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold leading-6 text-sibs-primary-1">
            This will create a pipeline application directly under Initial
            Screening. Select the lead department first, then choose the matching
            lead account for tracking.
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>TA Owner</FieldLabel>
              <input
                value={ownerName}
                readOnly
                className={inputClass("bg-[#F8FAFC]")}
              />
              <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                Automatically captured from the logged-in user.
              </p>
            </div>

            <div>
              <FieldLabel>Initial Stage</FieldLabel>
              <input
                value="Initial Screening"
                readOnly
                className={inputClass("bg-[#F8FAFC]")}
              />
              <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                Match tagging starts in Candidate Pipeline.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Department</FieldLabel>
              <select
                value={selectedDepartmentValue}
                disabled={isSaving}
                onChange={(event) => handleDepartmentChange(event.target.value)}
                className={inputClass(
                  isSaving ? "cursor-not-allowed bg-[#F8FAFC]" : "",
                )}
              >
                <option value="">Select department</option>

                {normalizedDepartments.map((department) => (
                  <option
                    key={department.departmentKey}
                    value={department.departmentKey}
                  >
                    {department.departmentName}
                  </option>
                ))}
              </select>

              <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                Department options are loaded from database records.
              </p>
            </div>

            <div>
              <FieldLabel>Lead Account</FieldLabel>
              <select
                value={selectedAccountValue}
                disabled={isSaving || !selectedDepartmentValue}
                onChange={(event) => handleAccountChange(event.target.value)}
                className={inputClass(
                  isSaving || !selectedDepartmentValue
                    ? "cursor-not-allowed bg-[#F8FAFC]"
                    : "",
                )}
              >
                <option value="">
                  {selectedDepartmentValue
                    ? "Select lead account"
                    : "Select department first"}
                </option>

                {filteredAccounts.map((account) => (
                  <option key={account.accountKey} value={account.accountKey}>
                    {account.accountName}
                  </option>
                ))}
              </select>

              <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                Accounts are filtered based on the selected department.
              </p>

              {selectedDepartmentValue && filteredAccounts.length === 0 && (
                <p className="mt-1 text-xs font-bold text-red-600">
                  No accounts found under this department.
                </p>
              )}
            </div>
          </div>

          {selectedAccount?.accountGhlName && (
            <div>
              <FieldLabel>Account GHL Name</FieldLabel>
              <input
                value={selectedAccount.accountGhlName}
                readOnly
                className={inputClass("bg-[#F8FAFC]")}
              />
            </div>
          )}

          <div>
            <FieldLabel>Remarks</FieldLabel>
            <textarea
              rows={4}
              value={moveToPipelineForm.remarks || ""}
              onChange={(event) =>
                setMoveToPipelineForm({
                  ...moveToPipelineForm,
                  remarks: event.target.value,
                })
              }
              className={textareaClass()}
              placeholder="Optional notes before moving this candidate to Initial Screening."
            />
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeMoveToPipeline}
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSaving || !selectedDepartmentValue || !selectedAccountValue}
              onClick={submitMoveToPipeline}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowRight size={16} />
              {isSaving ? "Moving..." : "Move Candidate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}