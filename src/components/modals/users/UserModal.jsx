import { useEffect, useMemo, useRef, useState } from "react";
import {
  UserPlus,
  Shield,
  ChevronDown,
  AlertTriangle,
  Check,
  Search,
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

const CLUSTER_OPTIONS = [
  "Coast Dental",
  "US Visa",
  "SME",
  "Yomdel",
  "Corporate",
];

function getAccountId(account) {
  return String(
    account?.gy_acc_id ||
      account?.accountId ||
      account?.account_id ||
      account?.id ||
      ""
  ).trim();
}

function getAccountName(account) {
  return String(
    account?.gy_acc_name ||
      account?.accountName ||
      account?.account ||
      account?.account_name ||
      ""
  ).trim();
}

function getGhlName(account) {
  return String(
    account?.gy_acc_ghl_name ||
      account?.ghlName ||
      account?.ghl_name ||
      ""
  ).trim();
}

function getDepartmentId(account) {
  return String(
    account?.gy_dept_id ||
      account?.departmentId ||
      account?.department_id ||
      ""
  ).trim();
}

function getDepartmentName(account) {
  return String(
    account?.departmentName ||
      account?.department ||
      account?.name_department ||
      ""
  ).trim();
}

function getClusterName(account) {
  const explicitCluster = String(account?.clusterName || "").trim();

  if (explicitCluster) return explicitCluster;

  const accountName = getAccountName(account);
  const ghlName = getGhlName(account);
  const text = `${accountName} ${ghlName}`.toLowerCase();

  if (
    text.includes("cd -") ||
    text.includes("cd-") ||
    text.includes("coast dental")
  ) {
    return "Coast Dental";
  }

  if (text.includes("us visa")) {
    return "US Visa";
  }

  if (text.includes("sme-") || text.includes("sme -")) {
    return "SME";
  }

  if (text.includes("yomdel")) {
    return "Yomdel";
  }

  return "Corporate";
}

function normalizeAccount(account) {
  const accountId = getAccountId(account);
  const accountName = getAccountName(account);
  const ghlName = getGhlName(account);

  if (!accountId || !accountName) return null;

  return {
    accountId,
    account_id: accountId,
    gy_acc_id: accountId,

    accountName,
    account: accountName,
    gy_acc_name: accountName,

    ghlName,
    gy_acc_ghl_name: ghlName,

    departmentId: getDepartmentId(account),
    departmentName: getDepartmentName(account),

    clusterName: getClusterName(account),
  };
}

function getFullName(user) {
  return `${user?.lastName || ""}${user?.lastName ? ", " : ""}${
    user?.firstName || ""
  }${user?.middleName ? " " + user.middleName : ""}`.trim();
}

function getClusterFilterLabel(selectedClusters = []) {
  if (!selectedClusters.length || selectedClusters.includes("All")) {
    return "All Clusters";
  }

  if (selectedClusters.length === 1) {
    return selectedClusters[0];
  }

  return `${selectedClusters.length} Clusters Selected`;
}

function getAccountSelectLabel(accountOptions = [], selectedAccountIds = []) {
  const selectedSet = new Set(selectedAccountIds.map(String));

  const selectedAccounts = accountOptions
    .map(normalizeAccount)
    .filter(Boolean)
    .filter((account) => selectedSet.has(String(account.accountId)));

  if (selectedAccounts.length === 0) return "Select assigned accounts";
  if (selectedAccounts.length === 1) return selectedAccounts[0].gy_acc_name;

  return `${selectedAccounts.length} Accounts Selected`;
}

function getAssignedAccountsDisplay(
  selectedUser,
  accountOptions = [],
  selectedAccountIds = []
) {
  const selectedSet = new Set(selectedAccountIds.map(String));

  const selectedNames = accountOptions
    .map(normalizeAccount)
    .filter(Boolean)
    .filter((account) => selectedSet.has(String(account.accountId)))
    .map((account) => account.gy_acc_name)
    .filter(Boolean);

  if (selectedNames.length > 0) {
    return selectedNames.join(", ");
  }

  if (Array.isArray(selectedUser?.assignedAccounts)) {
    const assignedNames = selectedUser.assignedAccounts
      .map((account) => getAccountName(account))
      .filter(Boolean);

    if (assignedNames.length > 0) {
      return assignedNames.join(", ");
    }
  }

  return getAccountName(selectedUser) || "-";
}

function ModalAnimationStyles() {
  return (
    <style>
      {`
        @keyframes sibsUserModalBackdropIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes sibsUserModalBackdropOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes sibsUserModalIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes sibsUserModalOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(14px) scale(0.96);
          }
        }
      `}
    </style>
  );
}

function AnimatedDropdown({ open, children, maxHeight = "max-h-64" }) {
  return (
    <div
      className={`absolute left-0 right-0 top-full mt-2 grid transition-all duration-200 ease-out ${
        open
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl transition-all duration-200 ease-out ${
            open ? "translate-y-0 scale-100" : "-translate-y-2 scale-[0.98]"
          }`}
        >
          <div className={`${maxHeight} overflow-y-auto py-2 sibs-scrollbar`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserModal({
  mode = "add",
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

  onToggleAccount,
  accountOptions = [],

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
  const clusterDropdownRef = useRef(null);
  const accountDropdownRef = useRef(null);
  const closeTimerRef = useRef(null);

  const [shouldRender, setShouldRender] = useState(open);
  const [isClosing, setIsClosing] = useState(false);

  const [adminAccessOpen, setAdminAccessOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const [selectedClusters, setSelectedClusters] = useState(["All"]);
  const [showClusterDropdown, setShowClusterDropdown] = useState(false);

  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");

  const normalizedAccountOptions = useMemo(() => {
    const map = new Map();

    (accountOptions || []).forEach((account) => {
      const normalized = normalizeAccount(account);

      if (!normalized) return;

      if (!map.has(normalized.accountId)) {
        map.set(normalized.accountId, normalized);
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.gy_acc_name.localeCompare(b.gy_acc_name)
    );
  }, [accountOptions]);

  const selectedAccountIds = useMemo(() => {
    if (Array.isArray(form?.accountIds)) {
      return form.accountIds.map(String);
    }

    if (form?.accountId) {
      return [String(form.accountId)];
    }

    return [];
  }, [form?.accountIds, form?.accountId]);

  const assignedAccountsDisplay = useMemo(() => {
    return getAssignedAccountsDisplay(
      selectedUser,
      normalizedAccountOptions,
      selectedAccountIds
    );
  }, [selectedUser, normalizedAccountOptions, selectedAccountIds]);

  const filteredAccountOptions = useMemo(() => {
    const keyword = accountSearch.trim().toLowerCase();
    const selectedSet = new Set(selectedAccountIds.map(String));

    return normalizedAccountOptions
      .filter((account) => {
        const matchesCluster =
          selectedClusters.includes("All") ||
          selectedClusters.length === 0 ||
          selectedClusters.includes(account.clusterName);

        const searchableText = [
          account.gy_acc_id,
          account.gy_acc_name,
          account.gy_acc_ghl_name,
          account.departmentName,
          account.clusterName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesKeyword = !keyword || searchableText.includes(keyword);

        return matchesCluster && matchesKeyword;
      })
      .sort((a, b) => {
        const aSelected = selectedSet.has(String(a.accountId));
        const bSelected = selectedSet.has(String(b.accountId));

        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;

        return a.gy_acc_name.localeCompare(b.gy_acc_name);
      });
  }, [
    normalizedAccountOptions,
    selectedClusters,
    selectedAccountIds,
    accountSearch,
  ]);

  useEffect(() => {
    if (open) {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }

      setShouldRender(true);
      setIsClosing(false);
      return;
    }

    if (shouldRender) {
      setIsClosing(true);

      closeTimerRef.current = window.setTimeout(() => {
        setIsClosing(false);
        setShouldRender(false);
      }, 220);
    }

    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, [open, shouldRender]);

  useEffect(() => {
    if (!shouldRender) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleAnimatedClose();
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

      if (
        clusterDropdownRef.current &&
        !clusterDropdownRef.current.contains(event.target)
      ) {
        setShowClusterDropdown(false);
      }

      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(event.target)
      ) {
        setShowAccountDropdown(false);
      }
    };

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);

      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRender, isClosing, saving, deleting, setShowEmployeeDropdown]);

  useEffect(() => {
    if (!shouldRender) {
      setAdminAccessOpen(false);
      setStatusOpen(false);
      setShowClusterDropdown(false);
      setShowAccountDropdown(false);
      setAccountSearch("");
      setSelectedClusters(["All"]);
    }
  }, [shouldRender]);

  function handleAnimatedClose() {
    if (isClosing || saving || deleting) return;

    setAdminAccessOpen(false);
    setStatusOpen(false);
    setShowClusterDropdown(false);
    setShowAccountDropdown(false);
    setShowEmployeeDropdown?.(false);

    setIsClosing(true);

    window.setTimeout(() => {
      onClose?.();
    }, 220);
  }

  if (!shouldRender) return null;
  if ((isEdit || isDelete) && !selectedUser) return null;

  const selectedAdminAccessValue = Array.isArray(form?.adminAccess)
    ? String(form.adminAccess[0] || "")
    : String(form?.adminAccess || "");

  const selectedAdminAccess =
    adminAccessOptions.find(
      (option) => option.value === selectedAdminAccessValue
    )?.label || "";

  const selectedStatus =
    statusOptions.find((option) => option.value === String(form?.status || ""))
      ?.label || "";

  const fullName = isEdit || isDelete ? getFullName(selectedUser) : "";

  const title = isDelete ? "Delete User" : isEdit ? "Edit User" : "Add User";

  const subtitle = isDelete
    ? "This action cannot be undone"
    : isEdit
      ? "Update user access, permissions, and assigned accounts"
      : "Search employee and assign admin access";

  const Icon = isDelete ? AlertTriangle : isEdit ? Shield : UserPlus;

  const headerIconClass = isDelete
    ? "bg-red-100 text-red-600"
    : "bg-[var(--sibs-primary-1)]/10 text-sibs-primary-1";

  const titleClass = isDelete
    ? "text-2xl font-bold text-red-600"
    : "text-2xl font-bold text-sibs-primary-1";

  function closeNonEmployeeDropdowns() {
    setAdminAccessOpen(false);
    setStatusOpen(false);
    setShowClusterDropdown(false);
    setShowAccountDropdown(false);
  }

  function closeAllDropdowns() {
    closeNonEmployeeDropdowns();
    setShowEmployeeDropdown?.(false);
  }

  function isAllClustersSelected() {
    return selectedClusters.includes("All") || selectedClusters.length === 0;
  }

  function handleToggleCluster(cluster) {
    setSelectedClusters((prev) => {
      if (cluster === "All") {
        return ["All"];
      }

      const current = prev.includes("All") ? [] : prev;
      const alreadySelected = current.includes(cluster);

      const next = alreadySelected
        ? current.filter((item) => item !== cluster)
        : [...current, cluster];

      return next.length > 0 ? next : ["All"];
    });

    setAccountSearch("");
  }

  function handleToggleAccountLocal(account) {
    const accountId = String(account?.accountId || "");

    if (!accountId) return;

    if (onToggleAccount) {
      onToggleAccount(accountId);
      return;
    }

    const current = selectedAccountIds.map(String);
    const alreadySelected = current.includes(accountId);

    const nextAccountIds = alreadySelected
      ? current.filter((id) => id !== accountId)
      : [...current, accountId];

    const primaryAccount = normalizedAccountOptions.find(
      (item) => String(item.accountId) === String(nextAccountIds[0] || "")
    );

    onChange?.({
      target: {
        name: "accountIds",
        value: nextAccountIds,
      },
    });

    onChange?.({
      target: {
        name: "accountId",
        value: nextAccountIds[0] || "",
      },
    });

    onChange?.({
      target: {
        name: "account",
        value: primaryAccount?.gy_acc_name || "",
      },
    });

    onChange?.({
      target: {
        name: "departmentId",
        value: primaryAccount?.departmentId || form?.departmentId || "",
      },
    });

    onChange?.({
      target: {
        name: "department",
        value: primaryAccount?.departmentName || form?.department || "",
      },
    });
  }

  function renderClusterAndAccountSelectors() {
    if (!isAdd && !isEdit) return null;

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div ref={clusterDropdownRef} className="relative z-30">
          <label className="mb-1 block text-sm font-bold text-[#101828]">
            Cluster
          </label>

          <button
            type="button"
            onClick={() => {
              if (saving) return;

              setShowClusterDropdown((prev) => !prev);
              setShowAccountDropdown(false);
              setAdminAccessOpen(false);
              setStatusOpen(false);
              setShowEmployeeDropdown?.(false);
            }}
            disabled={saving}
            className="flex h-12 w-full items-center justify-between rounded-xl border border-[#D0D5DD] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="truncate">
              {getClusterFilterLabel(selectedClusters)}
            </span>

            <ChevronDown
              size={18}
              className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-200 ${
                showClusterDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatedDropdown open={showClusterDropdown}>
            <button
              type="button"
              onClick={() => handleToggleCluster("All")}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                isAllClustersSelected()
                  ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                  : "text-[#344054] hover:bg-[#F8FAFC]"
              }`}
            >
              <input
                type="checkbox"
                checked={isAllClustersSelected()}
                readOnly
                className="h-4 w-4 rounded border-[#D0D5DD] accent-sibs-primary-1"
              />

              <span>All Clusters</span>
            </button>

            {CLUSTER_OPTIONS.map((cluster) => {
              const checked =
                !isAllClustersSelected() && selectedClusters.includes(cluster);

              return (
                <button
                  key={cluster}
                  type="button"
                  onClick={() => handleToggleCluster(cluster)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                    checked
                      ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                      : "text-[#344054] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    readOnly
                    className="h-4 w-4 rounded border-[#D0D5DD] accent-sibs-primary-1"
                  />

                  <span className="truncate">{cluster}</span>
                </button>
              );
            })}
          </AnimatedDropdown>
        </div>

        <div ref={accountDropdownRef} className="relative z-20">
          <div className="mb-1 flex items-center justify-between gap-3">
            <label className="block text-sm font-bold text-[#101828]">
              Assigned Accounts
            </label>

            <span className="text-xs font-bold text-sibs-primary-1">
              Selected: {selectedAccountIds.length}
            </span>
          </div>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
            />

            <input
              type="text"
              value={
                showAccountDropdown
                  ? accountSearch
                  : getAccountSelectLabel(
                      normalizedAccountOptions,
                      selectedAccountIds
                    )
              }
              onChange={(e) => {
                setAccountSearch(e.target.value);
                setShowAccountDropdown(true);
              }}
              onFocus={() => {
                if (saving) return;

                setShowAccountDropdown(true);
                setAccountSearch("");
                setShowClusterDropdown(false);
                setAdminAccessOpen(false);
                setStatusOpen(false);
                setShowEmployeeDropdown?.(false);
              }}
              disabled={saving}
              placeholder="Search accounts..."
              autoComplete="off"
              className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 pr-11 text-sm font-bold text-[#344054] outline-none transition disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />

            <ChevronDown
              size={18}
              onClick={() => {
                if (saving) return;

                setShowAccountDropdown((prev) => !prev);
                setAccountSearch("");
                setShowClusterDropdown(false);
                setAdminAccessOpen(false);
                setStatusOpen(false);
                setShowEmployeeDropdown?.(false);
              }}
              className={`absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-sibs-tertiary-5 transition-transform duration-200 ${
                showAccountDropdown ? "rotate-180" : ""
              }`}
            />

            <AnimatedDropdown open={showAccountDropdown}>
              {filteredAccountOptions.length > 0 ? (
                filteredAccountOptions.map((account) => {
                  const checked = selectedAccountIds.includes(
                    String(account.accountId)
                  );

                  return (
                    <button
                      key={account.accountId}
                      type="button"
                      onClick={() => {
                        handleToggleAccountLocal(account);
                        setAccountSearch("");
                      }}
                      disabled={saving}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        checked
                          ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                          : "text-[#344054] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          checked
                            ? "border-sibs-primary-1 bg-sibs-primary-1 text-white"
                            : "border-[#D0D5DD] bg-white"
                        }`}
                      >
                        {checked && <Check size={12} />}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {account.gy_acc_name}
                        </p>

                        <p className="mt-0.5 truncate text-xs font-medium text-sibs-tertiary-5">
                          {[account.clusterName, account.gy_acc_ghl_name]
                            .filter(Boolean)
                            .join(" / ") || "No GHL name"}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-4 text-sm font-semibold text-sibs-tertiary-5">
                  No accounts found for the selected cluster.
                </div>
              )}
            </AnimatedDropdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-[#0F172A]/45 px-4 py-4 backdrop-blur-[2px]"
      onClick={handleAnimatedClose}
      style={{
        animation: isClosing
          ? "sibsUserModalBackdropOut 220ms ease-in both"
          : "sibsUserModalBackdropIn 180ms ease-out both",
      }}
    >
      <ModalAnimationStyles />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative z-[10000] flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-sibs-tertiary-9 bg-white shadow-2xl"
        style={{
          animation: isClosing
            ? "sibsUserModalOut 220ms ease-in both"
            : "sibsUserModalIn 240ms ease-out both",
        }}
      >
        <div className="shrink-0 border-b border-sibs-tertiary-9 px-6 py-5">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${headerIconClass}`}
            >
              <Icon size={22} />
            </div>

            <div className="min-w-0">
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
                  <p className="text-sm font-semibold text-red-700">
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
                  <ReadOnlyField
                    label="Assigned Accounts"
                    value={assignedAccountsDisplay}
                  />
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
                  onClick={handleAnimatedClose}
                  disabled={deleting || isClosing}
                  className="w-full rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm font-semibold text-sibs-tertiary-5 transition hover:bg-sibs-tertiary-10 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={onConfirmDelete}
                  disabled={deleting || isClosing}
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
                        closeNonEmployeeDropdowns();
                      }}
                      placeholder="Search SiBS ID or employee name"
                      disabled={saving}
                      autoComplete="off"
                      className="w-full rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none focus:border-[var(--sibs-primary-1)]"
                    />

                    <AnimatedDropdown open={showEmployeeDropdown} maxHeight="max-h-60">
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
                                item.middleName ? " " + item.middleName : ""
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
                    </AnimatedDropdown>
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
                      <ReadOnlyField label="Email" value={selectedUser.email} />
                      <ReadOnlyField
                        label="Default Account"
                        value={getAccountName(selectedUser)}
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
                      <ReadOnlyField
                        label="Default Account"
                        value={getAccountName(form)}
                      />
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
                      setShowClusterDropdown(false);
                      setShowAccountDropdown(false);
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

                      closeAllDropdowns();
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
                        setShowClusterDropdown(false);
                        setShowAccountDropdown(false);
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

                        closeAllDropdowns();
                      }}
                    />
                  )}
                </div>

                {renderClusterAndAccountSelectors()}

                {(isAdd || isEdit) && (
                  <div className="rounded-xl border border-sibs-tertiary-9 bg-sibs-tertiary-10 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Current Assigned Accounts
                    </p>

                    <p className="mt-1 text-sm font-semibold text-sibs-primary-1">
                      {assignedAccountsDisplay}
                    </p>
                  </div>
                )}

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
                  onClick={handleAnimatedClose}
                  disabled={saving || isClosing}
                  className="w-full rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm font-semibold text-sibs-tertiary-5 transition hover:bg-sibs-tertiary-10 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || isClosing}
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
            className={`text-sibs-tertiary-5 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatedDropdown open={open} maxHeight="max-h-60">
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
        </AnimatedDropdown>
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