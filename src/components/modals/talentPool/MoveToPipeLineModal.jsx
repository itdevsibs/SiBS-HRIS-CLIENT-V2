import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ArrowRight, ChevronDown } from "lucide-react";

import { useTalentPool } from "../../../services/context/TalentPoolContext";
import {
  inputClass,
  textareaClass,
  toDisplayPersonName,
} from "../../../lib/utils/talentPool/talentPoolHelpers";
import { FieldLabel } from "../../recruitment/talentPool/TalentPoolShared";
import { moveTalentPoolCandidateToPipeline } from "../../../lib/axios/getTalentPool";
import StatusModal from "../StatusModal";

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function uniqueByKey(items = [], keyGetter) {
  const map = new Map();

  items.forEach((item) => {
    const key = keyGetter(item);
    if (!key) return;

    if (!map.has(key)) {
      map.set(key, item);
    }
  });

  return Array.from(map.values());
}

function normalizeDepartmentOption(item) {
  if (!item) return null;

  if (typeof item === "string" || typeof item === "number") {
    const name = cleanText(item);

    if (!name) return null;

    return {
      departmentId: name,
      departmentName: name,
      departmentKey: normalizeKey(name),
      departmentIds: [name],
      departmentNames: [name],
    };
  }

  const departmentId =
    item.departmentId ??
    item.department_id ??
    item.gy_dept_id ??
    item.id_department ??
    item.id ??
    item.positionDepartmentId ??
    item.position_department_id ??
    "";

  const departmentName =
    item.departmentName ||
    item.department_name ||
    item.name_department ||
    item.department ||
    item.positionDepartment ||
    item.position_department ||
    item.label ||
    item.value ||
    item.name ||
    "";

  const finalName = cleanText(departmentName || departmentId);
  const finalId = cleanText(departmentId || finalName);

  if (!finalName && !finalId) return null;

  return {
    departmentId: finalId,
    departmentName: finalName,
    departmentKey: normalizeKey(finalName || finalId),
    departmentIds: [finalId].filter(Boolean),
    departmentNames: [finalName].filter(Boolean),
  };
}

function normalizeAccountOption(item) {
  if (!item) return null;

  if (typeof item === "string" || typeof item === "number") {
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
    item.positionAccountId ??
    item.position_account_id ??
    "";

  const accountName =
    item.accountName ||
    item.account_name ||
    item.gy_acc_name ||
    item.account ||
    item.name ||
    item.label ||
    item.value ||
    item.leadAccount ||
    item.currentAppliedAccount ||
    item.appliedAccount ||
    item.positionAccountName ||
    item.position_account_name ||
    "";

  const accountGhlName =
    item.accountGhlName ||
    item.account_ghl_name ||
    item.gy_acc_ghl_name ||
    item.ghlName ||
    item.ghl_name ||
    item.positionAccountGhlName ||
    item.position_account_ghl_name ||
    "";

  const departmentId =
    item.departmentId ??
    item.department_id ??
    item.gy_dept_id ??
    item.id_department ??
    item.positionDepartmentId ??
    item.position_department_id ??
    "";

  const departmentName =
    item.departmentName ||
    item.department_name ||
    item.name_department ||
    item.department ||
    item.positionDepartment ||
    item.position_department ||
    "";

  const finalAccountName = cleanText(accountName || accountId);
  const finalAccountId = cleanText(accountId || finalAccountName);
  const finalDepartmentId = cleanText(departmentId);
  const finalDepartmentName = cleanText(departmentName);

  if (!finalAccountName && !finalAccountId) return null;

  return {
    accountId: finalAccountId,
    accountName: finalAccountName,
    accountGhlName: cleanText(accountGhlName),
    departmentId: finalDepartmentId,
    departmentName: finalDepartmentName,
    departmentKey: normalizeKey(finalDepartmentName || finalDepartmentId),
    accountKey: normalizeKey(
      `${finalDepartmentId || finalDepartmentName || "no-department"}-${
        finalAccountId || finalAccountName
      }`,
    ),
  };
}

function normalizePositionOption(item) {
  if (!item) return null;

  const positionId =
    item.positionId ||
    item.position_id ||
    item.positionCode ||
    item.position_code ||
    item.id ||
    "";

  const positionTitle =
    item.positionTitle ||
    item.position_title ||
    item.title ||
    item.position ||
    item.openPosition ||
    item.roleCapability ||
    item.name ||
    "";

  const departmentId =
    item.departmentId ||
    item.department_id ||
    item.gy_dept_id ||
    item.id_department ||
    item.positionDepartmentId ||
    "";

  const departmentName =
    item.departmentName ||
    item.department_name ||
    item.name_department ||
    item.department ||
    item.positionDepartment ||
    "";

  const accountId =
    item.accountId ||
    item.account_id ||
    item.gy_acc_id ||
    item.positionAccountId ||
    "";

  const accountName =
    item.accountName ||
    item.account_name ||
    item.gy_acc_name ||
    item.account ||
    item.leadAccount ||
    item.accountFit ||
    item.appliedAccount ||
    item.currentAppliedAccount ||
    item.positionAccountName ||
    "";

  const accountGhlName =
    item.accountGhlName ||
    item.account_ghl_name ||
    item.gy_acc_ghl_name ||
    item.positionAccountGhlName ||
    "";

  const finalPositionTitle = cleanText(positionTitle || positionId);

  if (!finalPositionTitle) return null;

  return {
    positionId: cleanText(positionId),
    positionTitle: finalPositionTitle,
    departmentId: cleanText(departmentId),
    departmentName: cleanText(departmentName),
    accountId: cleanText(accountId),
    accountName: cleanText(accountName),
    accountGhlName: cleanText(accountGhlName),
  };
}

function mergeDepartmentItems(items = []) {
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
      ...existing,
      departmentId: existing.departmentId || department.departmentId,
      departmentName: existing.departmentName || department.departmentName,
      departmentIds: uniqueByKey(
        [...existing.departmentIds, ...department.departmentIds].map((id) => ({
          id,
        })),
        (itemValue) => cleanText(itemValue.id),
      ).map((itemValue) => itemValue.id),
      departmentNames: uniqueByKey(
        [
          ...existing.departmentNames,
          ...department.departmentNames,
        ].map((name) => ({
          name,
        })),
        (itemValue) => normalizeKey(itemValue.name),
      ).map((itemValue) => itemValue.name),
    });
  });

  return Array.from(map.values()).sort((a, b) =>
    a.departmentName.localeCompare(b.departmentName),
  );
}

function mergeAccountItems(items = []) {
  const map = new Map();

  items.forEach((item) => {
    const account = normalizeAccountOption(item);
    if (!account) return;

    const key =
      account.accountKey ||
      normalizeKey(`${account.departmentId}-${account.accountName}`);

    if (!key) return;

    const existing = map.get(key);

    if (!existing) {
      map.set(key, account);
      return;
    }

    map.set(key, {
      ...existing,
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

function getDepartmentItemsFromAccounts(accounts = []) {
  return accounts
    .map((account) => {
      if (!account?.departmentId && !account?.departmentName) return null;

      return {
        departmentId: account.departmentId || account.departmentName,
        departmentName: account.departmentName || account.departmentId,
      };
    })
    .filter(Boolean);
}

function getDepartmentItemsFromPositions(positions = []) {
  return positions
    .map((position) => {
      const normalizedPosition = normalizePositionOption(position);

      if (!normalizedPosition) return null;

      if (
        !normalizedPosition.departmentId &&
        !normalizedPosition.departmentName
      ) {
        return null;
      }

      return {
        departmentId:
          normalizedPosition.departmentId || normalizedPosition.departmentName,
        departmentName:
          normalizedPosition.departmentName || normalizedPosition.departmentId,
      };
    })
    .filter(Boolean);
}

function getAccountItemsFromPositions(positions = []) {
  return positions
    .map((position) => {
      const normalizedPosition = normalizePositionOption(position);

      if (!normalizedPosition) return null;

      if (!normalizedPosition.accountId && !normalizedPosition.accountName) {
        return null;
      }

      return {
        accountId: normalizedPosition.accountId,
        accountName: normalizedPosition.accountName,
        accountGhlName: normalizedPosition.accountGhlName,
        departmentId: normalizedPosition.departmentId,
        departmentName: normalizedPosition.departmentName,
      };
    })
    .filter(Boolean);
}

function findMatchingPosition(positions = [], candidate = {}) {
  const normalizedPositions = positions
    .map(normalizePositionOption)
    .filter(Boolean);

  const targetPositionId = cleanText(
    candidate.positionId ||
      candidate.openPositionId ||
      candidate.availablePositionId ||
      "",
  );

  const targetPositionTitle = normalizeKey(
    candidate.openPosition ||
      candidate.roleCapability ||
      candidate.currentAppliedRole ||
      candidate.roleTitle ||
      candidate.appliedPosition ||
      "",
  );

  return (
    normalizedPositions.find(
      (position) =>
        targetPositionId &&
        cleanText(position.positionId) === targetPositionId,
    ) ||
    normalizedPositions.find(
      (position) =>
        targetPositionTitle &&
        normalizeKey(position.positionTitle) === targetPositionTitle,
    ) ||
    null
  );
}

function departmentMatchesAccount(department, account) {
  if (!department || !account) return false;

  const departmentIds = new Set(
    [
      department.departmentId,
      ...(Array.isArray(department.departmentIds)
        ? department.departmentIds
        : []),
    ]
      .map(cleanText)
      .filter(Boolean),
  );

  const departmentNames = new Set(
    [
      department.departmentName,
      ...(Array.isArray(department.departmentNames)
        ? department.departmentNames
        : []),
    ]
      .map(normalizeKey)
      .filter(Boolean),
  );

  const accountDepartmentId = cleanText(account.departmentId);
  const accountDepartmentName = normalizeKey(account.departmentName);
  const accountDepartmentKey = normalizeKey(
    account.departmentName || account.departmentId,
  );

  if (accountDepartmentId && departmentIds.has(accountDepartmentId)) {
    return true;
  }

  if (accountDepartmentName && departmentNames.has(accountDepartmentName)) {
    return true;
  }

  if (
    accountDepartmentKey &&
    accountDepartmentKey === department.departmentKey
  ) {
    return true;
  }

  return false;
}

function toDropdownOptions(items = [], valueKey, labelKey) {
  return items.map((item) => ({
    id: item[valueKey] || item[labelKey],
    value: item[valueKey] || item[labelKey],
    label: item[labelKey] || item[valueKey],
  }));
}

function getPipelineApplicationId(candidate = {}) {
  return (
    candidate.rawId ||
    candidate.applicationRawId ||
    candidate.applicationId ||
    candidate.application_id ||
    candidate.dbId ||
    candidate.databaseId ||
    candidate.id ||
    candidate.candidateId ||
    ""
  );
}

function CustomDropdown({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Select",
  disabled = false,
  zIndex = "z-[100]",
}) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value || ""),
  );

  const displayLabel = selectedOption?.label || placeholder;

  useEffect(() => {
    function handleClickOutside(event) {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSelect(nextValue) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div
      ref={dropdownRef}
      className={`relative min-w-0 ${open ? zIndex : "z-[1]"}`}
    >
      <FieldLabel>{label}</FieldLabel>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-bold shadow-sm outline-none transition ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D0D5DD] hover:border-sibs-primary-1"
        } ${
          disabled
            ? "cursor-not-allowed bg-[#F8FAFC] text-gray-400 opacity-70"
            : "text-[#344054]"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedOption ? "text-[#344054]" : "text-sibs-tertiary-5"
          }`}
        >
          {displayLabel}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-primary-1 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[99999] overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="max-h-72 overflow-y-auto">
            {options.length > 0 ? (
              options.map((option) => {
                const active = String(option.value) === String(value || "");

                return (
                  <button
                    key={option.id || option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`block w-full px-4 py-3.5 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-[#EAF4FF] text-sibs-primary-1"
                        : "bg-white text-[#344054] hover:bg-[#F5F9FF] hover:text-sibs-primary-1"
                    }`}
                  >
                    <span className="block min-w-0 truncate">
                      {option.label}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3.5 text-sm font-semibold text-sibs-tertiary-5">
                No options found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MoveToPipeLineModal() {
  const navigate = useNavigate();

  const {
    pipelineTarget,
    moveToPipelineForm,
    setMoveToPipelineForm,
    currentTaOwner,
    closeMoveToPipeline,
    departmentOptions = [],
    accountOptions = [],
    activePositionOptions = [],
    availablePositionOptions = [],
    openPositionOptions = [],
    refreshTalentPool,
  } = useTalentPool();

  const [localSaving, setLocalSaving] = useState(false);
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "error",
    title: "",
    message: "",
  });

  const positionSources = useMemo(
    () => [
      ...activePositionOptions,
      ...availablePositionOptions,
      ...openPositionOptions,
    ],
    [activePositionOptions, availablePositionOptions, openPositionOptions],
  );

  const matchedPosition = useMemo(() => {
    if (!pipelineTarget) return null;

    return findMatchingPosition(positionSources, pipelineTarget);
  }, [positionSources, pipelineTarget]);

  const normalizedAccounts = useMemo(() => {
    return mergeAccountItems(
      [
        ...(Array.isArray(accountOptions) ? accountOptions : []),
        ...getAccountItemsFromPositions(positionSources),
        matchedPosition
          ? {
              accountId: matchedPosition.accountId,
              accountName: matchedPosition.accountName,
              accountGhlName: matchedPosition.accountGhlName,
              departmentId: matchedPosition.departmentId,
              departmentName: matchedPosition.departmentName,
            }
          : null,
      ].filter(Boolean),
    );
  }, [accountOptions, positionSources, matchedPosition]);

  const normalizedDepartments = useMemo(() => {
    return mergeDepartmentItems(
      [
        ...(Array.isArray(departmentOptions) ? departmentOptions : []),
        ...getDepartmentItemsFromAccounts(normalizedAccounts),
        ...getDepartmentItemsFromPositions(positionSources),
        matchedPosition
          ? {
              departmentId: matchedPosition.departmentId,
              departmentName: matchedPosition.departmentName,
            }
          : null,
      ].filter(Boolean),
    );
  }, [departmentOptions, normalizedAccounts, positionSources, matchedPosition]);

  if (!pipelineTarget) return null;

  const isSaving = localSaving;

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
    matchedPosition?.departmentId ||
    "";

  const targetDepartmentName =
    moveToPipelineForm.leadDepartment ||
    moveToPipelineForm.department ||
    pipelineTarget.leadDepartment ||
    pipelineTarget.department ||
    pipelineTarget.departmentName ||
    matchedPosition?.departmentName ||
    "";

  const selectedDepartment =
    normalizedDepartments.find(
      (department) =>
        cleanText(targetDepartmentId) &&
        [
          department.departmentId,
          ...(department.departmentIds || []),
        ].some((id) => String(id) === String(targetDepartmentId)),
    ) ||
    normalizedDepartments.find(
      (department) =>
        normalizeKey(targetDepartmentName) &&
        department.departmentKey === normalizeKey(targetDepartmentName),
    ) ||
    null;

  const selectedDepartmentValue = selectedDepartment?.departmentKey || "";

  const strictFilteredAccounts = selectedDepartment
    ? normalizedAccounts.filter((account) =>
        departmentMatchesAccount(selectedDepartment, account),
      )
    : [];

  const filteredAccounts = strictFilteredAccounts;

  const targetAccountId =
    moveToPipelineForm.leadAccountId ||
    moveToPipelineForm.accountId ||
    pipelineTarget.leadAccountId ||
    pipelineTarget.accountId ||
    pipelineTarget.account_id ||
    pipelineTarget.gy_acc_id ||
    matchedPosition?.accountId ||
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
    matchedPosition?.accountName ||
    "";

  const selectedAccount =
    filteredAccounts.find(
      (account) =>
        cleanText(targetAccountId) &&
        String(account.accountId) === String(targetAccountId),
    ) ||
    filteredAccounts.find(
      (account) =>
        normalizeKey(account.accountName) === normalizeKey(targetAccountName),
    ) ||
    null;

  const selectedAccountValue = selectedAccount?.accountKey || "";

  const departmentDropdownOptions = toDropdownOptions(
    normalizedDepartments,
    "departmentKey",
    "departmentName",
  );

  const accountDropdownOptions = toDropdownOptions(
    filteredAccounts,
    "accountKey",
    "accountName",
  );

  function openErrorModal(message) {
    setStatusModal({
      open: true,
      type: "error",
      title: "Candidate not moved",
      message,
    });
  }

  function closeStatusModal() {
    setStatusModal((prev) => ({
      ...prev,
      open: false,
    }));
  }

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
      normalizedDepartments.find((department) =>
        departmentMatchesAccount(department, selected),
      ) || selectedDepartment;

    setMoveToPipelineForm({
      ...moveToPipelineForm,
      leadDepartmentId:
        matchedDepartment?.departmentId || selected?.departmentId || "",
      leadDepartment:
        matchedDepartment?.departmentName || selected?.departmentName || "",
      departmentId:
        matchedDepartment?.departmentId || selected?.departmentId || "",
      department:
        matchedDepartment?.departmentName || selected?.departmentName || "",
      leadAccountId: selected?.accountId || "",
      leadAccount: selected?.accountName || "",
      accountId: selected?.accountId || "",
      accountName: selected?.accountName || "",
      accountGhlName: selected?.accountGhlName || "",
    });
  }

  async function handleMoveCandidate(event) {
    event?.preventDefault?.();

    if (isSaving) return;

    const applicationId = getPipelineApplicationId(pipelineTarget);

    if (!applicationId) {
      openErrorModal("Missing candidate application ID.");
      return;
    }

    if (!selectedDepartment) {
      openErrorModal("Please select a department.");
      return;
    }

    if (!selectedAccount) {
      openErrorModal("Please select a lead account.");
      return;
    }

    setLocalSaving(true);

    try {
      const payload = {
        candidateId: pipelineTarget.candidateId || "",
        applicationId,
        candidateName: pipelineTarget.name || pipelineTarget.candidateName || "",
        email: pipelineTarget.email || "",
        openPosition:
          pipelineTarget.openPosition ||
          pipelineTarget.appliedPosition ||
          pipelineTarget.roleCapability ||
          matchedPosition?.positionTitle ||
          "",
        positionId:
          pipelineTarget.positionId ||
          pipelineTarget.openPositionId ||
          matchedPosition?.positionId ||
          "",
        leadDepartmentId: selectedDepartment.departmentId || "",
        leadDepartment: selectedDepartment.departmentName || "",
        departmentId: selectedDepartment.departmentId || "",
        department: selectedDepartment.departmentName || "",
        leadAccountId: selectedAccount.accountId || "",
        leadAccount: selectedAccount.accountName || "",
        accountId: selectedAccount.accountId || "",
        accountName: selectedAccount.accountName || "",
        accountGhlName: selectedAccount.accountGhlName || "",
        taOwner: moveToPipelineForm.taOwner || currentTaOwner || "Current User",
        currentTaOwner:
          moveToPipelineForm.taOwner || currentTaOwner || "Current User",
        currentStage: "Initial Screening",
        pipelineStage: "Initial Screening",
        currentPipelineStage: "Initial Screening",
        status: "Initial Screening",
        remarks: moveToPipelineForm.remarks || "",
      };

      const response = await moveTalentPoolCandidateToPipeline(
        applicationId,
        payload,
      );

      if (!response?.success) {
        openErrorModal(
          response?.message || "Failed to move candidate to pipeline.",
        );
        return;
      }

      window.dispatchEvent(
        new CustomEvent("ta-pipeline-candidates-updated", {
          detail: response.data || payload,
        }),
      );

      window.dispatchEvent(
        new CustomEvent("ta-talent-pool-updated", {
          detail: response.data || payload,
        }),
      );

      if (typeof refreshTalentPool === "function") {
        await refreshTalentPool();
      }

      closeMoveToPipeline?.();

      navigate("/recruitment/candidate-pipeline", {
        replace: true,
        state: {
          movedCandidate:
            response?.candidate ||
            response?.data?.pipelineCandidate ||
            response?.data ||
            payload,
        },
      });
    } catch (error) {
      console.error("Move candidate to pipeline error:", error);

      openErrorModal(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to move candidate to pipeline.",
      );
    } finally {
      setLocalSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[10002] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={isSaving ? undefined : closeMoveToPipeline}
    >
      <div
        className="w-full max-w-2xl overflow-visible rounded-2xl bg-white shadow-2xl"
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

        <form onSubmit={handleMoveCandidate} className="space-y-4 p-5">
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
            <CustomDropdown
              label="Department"
              value={selectedDepartmentValue}
              options={departmentDropdownOptions}
              onChange={handleDepartmentChange}
              placeholder="Select department"
              disabled={isSaving}
              zIndex="z-[180]"
            />

            <CustomDropdown
              label="Lead Account"
              value={selectedAccountValue}
              options={accountDropdownOptions}
              onChange={handleAccountChange}
              placeholder={
                selectedDepartmentValue
                  ? "Select lead account"
                  : "Select department first"
              }
              disabled={isSaving || !selectedDepartmentValue}
              zIndex="z-[170]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <p className="text-xs font-semibold leading-5 text-sibs-tertiary-5">
              Department options are loaded from database records.
            </p>

            <div>
              <p className="text-xs font-semibold leading-5 text-sibs-tertiary-5">
                Accounts are filtered based on the selected department.
              </p>

              {selectedDepartmentValue && filteredAccounts.length === 0 && (
                <p className="mt-1 text-xs font-bold text-red-600">
                  No accounts found under this department.
                </p>
              )}
            </div>
          </div>

          {(selectedDepartment || selectedAccount) && (
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 md:grid-cols-2">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  Selected Department
                </p>
                <p className="mt-1 text-sm font-bold text-[#344054]">
                  {selectedDepartment?.departmentName || "—"}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  Selected Account
                </p>
                <p className="mt-1 text-sm font-bold text-[#344054]">
                  {selectedAccount?.accountName || "—"}
                </p>
              </div>
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
              disabled={
                isSaving || !selectedDepartmentValue || !selectedAccountValue
              }
              onClick={handleMoveCandidate}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowRight size={16} />
              {isSaving ? "Moving..." : "Move Candidate"}
            </button>
          </div>
        </div>
      </div>

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={closeStatusModal}
        variant="center"
        lockScroll={false}
      />
    </div>
  );
}