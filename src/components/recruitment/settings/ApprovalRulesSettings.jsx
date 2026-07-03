import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserRoundCheck,
} from "lucide-react";

import api from "../../../lib/axios/api-template";
import StatusModal from "../../modals/StatusModal";
import { useUser } from "../../../services/context/UserContext";

const APPROVAL_RULE_TABS = [
  {
    key: "offers",
    title: "Offer Approval",
    shortTitle: "Offers",
    description:
      "Add the users who can approve or reject offers. The Offers page will show approval actions only for authorized users.",
    icon: BriefcaseBusiness,
    badgeText: "Offer Rules",
    endpointBases: [
      "/api/offer-approval-settings",
      "/api/offer-approval-rules",
      "/api/recruitment-approval-rules/offers",
    ],
    emptyText: "No offer approval users added yet.",
    rowDescription: "Can approve or reject offers from the Offers page.",
  },
  {
    key: "jobDescription",
    title: "Job Description Approval",
    shortTitle: "Job Description",
    description:
      "Add the users who can approve, reject, or tag Job Descriptions for revision from the Approval Requests page.",
    icon: FileText,
    badgeText: "JD Rules",
    endpointBases: [
      "/api/job-description-approval-settings",
      "/api/job-description-approval-rules",
      "/api/recruitment-approval-rules/job-description",
    ],
    emptyText: "No Job Description approval users added yet.",
    rowDescription:
      "Can approve, reject, or tag Job Descriptions for revision.",
  },
];

function cleanText(value) {
  return String(value ?? "").trim();
}

function getUserDisplayName(user = {}) {
  return cleanText(
    user.fullName ||
      user.fullname ||
      user.name ||
      user.employeeName ||
      user.employee_name ||
      user.gy_emp_fullname ||
      user.username ||
      user.email ||
      "Current User",
  );
}

function normalizeSibsId(value = "") {
  return cleanText(value).replace(/^SIBS[-_ ]?/i, "");
}

function getEmployeeSibsId(item = {}) {
  return normalizeSibsId(
    item.sibsId ||
      item.sibs_id ||
      item.employeeSibsId ||
      item.employee_sibs_id ||
      item.gy_emp_code ||
      item.gy_user_code ||
      item.userCode ||
      item.user_code ||
      item.username ||
      "",
  );
}

function getEmployeeName(item = {}) {
  const fullName = cleanText(
    item.employeeName ||
      item.employee_name ||
      item.fullName ||
      item.full_name ||
      item.name ||
      item.displayName ||
      item.display_name ||
      item.gy_emp_fullname ||
      "",
  );

  if (fullName) return fullName;

  const lastName = cleanText(
    item.lastName || item.last_name || item.gy_emp_lname || "",
  );
  const firstName = cleanText(
    item.firstName || item.first_name || item.gy_emp_fname || "",
  );
  const middleName = cleanText(
    item.middleName || item.middle_name || item.gy_emp_mname || "",
  );

  const formatted =
    `${lastName}${lastName && firstName ? ", " : ""}${firstName}${
      middleName ? ` ${middleName}` : ""
    }`
      .replace(/\s+/g, " ")
      .trim();

  return formatted || "Unnamed Employee";
}

function normalizeApprovalUser(item = {}) {
  const sibsId = getEmployeeSibsId(item);
  const employeeName = getEmployeeName(item);

  return {
    id:
      item.id ||
      item.ruleId ||
      item.rule_id ||
      item.approvalUserId ||
      item.approval_user_id ||
      sibsId,
    sibsId,
    employeeName,
    label: `${sibsId}${employeeName ? ` - ${employeeName}` : ""}`,
    raw: item,
  };
}

function normalizeCandidate(item = {}) {
  const sibsId = getEmployeeSibsId(item);
  const employeeName = getEmployeeName(item);

  if (!sibsId) return null;

  return {
    id: item.id || item.employeeId || item.employee_id || sibsId,
    sibsId,
    employeeName,
    label: `${sibsId} - ${employeeName}`,
    raw: item,
  };
}

function normalizeRows(responseData) {
  const rows =
    responseData?.data?.users ||
    responseData?.data?.rows ||
    responseData?.data ||
    responseData?.users ||
    responseData?.rows ||
    [];

  return Array.isArray(rows) ? rows : [];
}

async function apiGetWithFallback(urls = [], config = {}) {
  let lastError = null;

  for (const url of urls) {
    try {
      const res = await api.get(url, {
        ...config,
        withCredentials: true,
      });

      return res.data;
    } catch (error) {
      lastError = error;

      if (error?.response?.status && error.response.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Endpoint is not available.");
}

async function apiPostWithFallback(urls = [], payload = {}) {
  let lastError = null;

  for (const url of urls) {
    try {
      const res = await api.post(url, payload, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });

      return res.data;
    } catch (error) {
      lastError = error;

      if (error?.response?.status && error.response.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Endpoint is not available.");
}

async function apiDeleteWithFallback(urls = [], payload = {}) {
  let lastError = null;

  for (const url of urls) {
    try {
      const res = await api.delete(url, {
        data: payload,
        withCredentials: true,
      });

      return res.data;
    } catch (error) {
      lastError = error;

      if (error?.response?.status && error.response.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Endpoint is not available.");
}

function getListUrls(rule) {
  return rule.endpointBases.map((base) => `${base}/users`);
}

function getSearchUrls(rule) {
  return rule.endpointBases.map((base) => `${base}/search-users`);
}

function getAddUrls(rule) {
  return rule.endpointBases.map((base) => `${base}/users`);
}

function getDeleteUrls(rule, user) {
  const id = encodeURIComponent(user.id || user.sibsId);
  return rule.endpointBases.map((base) => `${base}/users/${id}`);
}

function RuleInnerNav({ activeRuleKey, counts, onChange }) {
  return (
    <aside className="shrink-0 rounded-2xl border border-[#E6ECF2] bg-white p-3 lg:w-[270px]">
      <div className="mb-3 rounded-xl bg-[#F8FAFC] px-3 py-3">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
          Approval Modules
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
          Choose which approval rule to configure.
        </p>
      </div>

      <div className="space-y-2">
        {APPROVAL_RULE_TABS.map((rule) => {
          const isActive = activeRuleKey === rule.key;
          const RuleIcon = rule.icon;

          return (
            <button
              key={rule.key}
              type="button"
              onClick={() => onChange(rule.key)}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 ${
                isActive
                  ? "bg-sibs-primary-1 text-white shadow-[0_10px_22px_rgba(13,70,118,0.20)]"
                  : "bg-white text-[#344054] hover:bg-[#F8FAFC] hover:text-sibs-primary-1"
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "bg-blue-50 text-sibs-primary-1 group-hover:bg-white"
                }`}
              >
                <RuleIcon size={18} strokeWidth={2.4} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold">
                  {rule.shortTitle}
                </span>

                <span
                  className={`mt-0.5 block text-xs font-semibold ${
                    isActive ? "text-white/75" : "text-sibs-tertiary-5"
                  }`}
                >
                  {counts[rule.key] || 0} approval user
                  {Number(counts[rule.key] || 0) === 1 ? "" : "s"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function EmployeeSearchDropdown({
  search,
  setSearch,
  selectedCandidate,
  candidates,
  loading,
  onSelect,
  placeholder,
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const inputValue = open ? search : selectedCandidate?.label || search;

  return (
    <div ref={dropdownRef} className="relative min-w-0 flex-1">
      <div
        className={`flex h-12 items-center gap-3 rounded-xl border bg-white px-4 shadow-sm transition ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D0D5DD] hover:border-sibs-primary-1/30"
        }`}
      >
        <Search size={18} className="shrink-0 text-sibs-primary-1" />

        <input
          value={inputValue}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm font-bold text-sibs-primary-1 outline-none placeholder:text-sibs-tertiary-5"
        />

        {loading ? (
          <Loader2
            size={18}
            className="shrink-0 animate-spin text-sibs-primary-1"
          />
        ) : (
          <ChevronDown
            size={18}
            className={`shrink-0 text-sibs-primary-1 transition ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[80] overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="max-h-72 overflow-y-auto py-2">
            {loading ? (
              <div className="px-4 py-3 text-sm font-bold text-sibs-primary-1">
                Searching employees...
              </div>
            ) : candidates.length > 0 ? (
              candidates.map((candidate) => (
                <button
                  key={`${candidate.sibsId}-${candidate.employeeName}`}
                  type="button"
                  onClick={() => {
                    onSelect(candidate);
                    setOpen(false);
                  }}
                  className="block w-full px-4 py-3 text-left transition hover:bg-[#F8FAFC]"
                >
                  <span className="block text-sm font-extrabold text-[#101828]">
                    {candidate.sibsId} - {candidate.employeeName}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold text-sibs-tertiary-5">
                    Add as approval user
                  </span>
                </button>
              ))
            ) : cleanText(search).length >= 2 ? (
              <div className="px-4 py-3 text-sm font-bold text-sibs-tertiary-5">
                No matching employee found.
              </div>
            ) : (
              <div className="px-4 py-3 text-sm font-bold text-sibs-tertiary-5">
                Type at least 2 characters to search.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ApprovalUserRow({ user, description, removing, onRemove }) {
  return (
    <tr className="transition hover:bg-[#FAFBFC]">
      <td className="border-b border-[#E6ECF2] px-5 py-4">
        <p className="text-sm font-extrabold text-[#101828]">
          {user.sibsId} - {user.employeeName}
        </p>

        <p className="mt-1 text-xs font-bold text-sibs-primary-1">
          {description}
        </p>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-4 text-right">
        <button
          type="button"
          onClick={() => onRemove(user)}
          disabled={removing}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:border-red-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          title="Remove approval user"
        >
          {removing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      </td>
    </tr>
  );
}

function ApprovalRulePanel({
  rule,
  users,
  candidates,
  search,
  selectedCandidate,
  loading,
  searching,
  adding,
  removingId,
  onSearchChange,
  onSelectCandidate,
  onAddUser,
  onRemoveUser,
}) {
  const RuleIcon = rule.icon;

  return (
    <section className="min-w-0 flex-1 rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-sibs-primary-1">
              <RuleIcon size={22} strokeWidth={2.4} />
            </span>

            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                {rule.badgeText}
              </p>

              <h2 className="mt-1 text-xl font-extrabold text-[#101828]">
                {rule.title}
              </h2>
            </div>
          </div>

          <p className="mt-4 max-w-4xl text-sm font-semibold leading-6 text-sibs-primary-1">
            {rule.description}
          </p>
        </div>

        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
          <CheckCircle2 size={14} />
          {users.length} User{users.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
        <label className="mb-2 block text-sm font-extrabold text-[#101828]">
          Add Approval User
        </label>

        <div className="flex flex-col gap-3 lg:flex-row">
          <EmployeeSearchDropdown
            search={search}
            setSearch={onSearchChange}
            selectedCandidate={selectedCandidate}
            candidates={candidates}
            loading={searching}
            onSelect={onSelectCandidate}
            placeholder="Search SIBS ID or employee name..."
          />

          <button
            type="button"
            onClick={onAddUser}
            disabled={adding || !selectedCandidate}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-6 text-sm font-extrabold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {adding ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Plus size={17} />
            )}
            Add User
          </button>
        </div>

        <p className="mt-2 text-xs font-bold text-sibs-primary-1">
          Adding or removing a user automatically saves this approval rule to
          the database.
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white">
        <table className="w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr className="bg-[#F5F7FA] text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
              <th className="px-5 py-4">Approval User</th>
              <th className="w-[120px] px-5 py-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={2}
                  className="border-b border-[#E6ECF2] px-5 py-10 text-center text-sm font-bold text-sibs-primary-1"
                >
                  <Loader2
                    size={20}
                    className="mx-auto mb-2 animate-spin text-sibs-primary-1"
                  />
                  Loading approval users...
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((user) => (
                <ApprovalUserRow
                  key={`${rule.key}-${user.id}-${user.sibsId}`}
                  user={user}
                  description={rule.rowDescription}
                  removing={String(removingId) === String(user.id)}
                  onRemove={onRemoveUser}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan={2}
                  className="px-5 py-12 text-center text-sm font-bold text-sibs-tertiary-5"
                >
                  {rule.emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ApprovalRulesSettings() {
  const { user } = useUser();

  const [activeRuleKey, setActiveRuleKey] = useState("offers");

  const [usersByRule, setUsersByRule] = useState({
    offers: [],
    jobDescription: [],
  });

  const [loadingByRule, setLoadingByRule] = useState({
    offers: false,
    jobDescription: false,
  });

  const [searchByRule, setSearchByRule] = useState({
    offers: "",
    jobDescription: "",
  });

  const [candidatesByRule, setCandidatesByRule] = useState({
    offers: [],
    jobDescription: [],
  });

  const [selectedByRule, setSelectedByRule] = useState({
    offers: null,
    jobDescription: null,
  });

  const [searchingByRule, setSearchingByRule] = useState({
    offers: false,
    jobDescription: false,
  });

  const [addingByRule, setAddingByRule] = useState({
    offers: false,
    jobDescription: false,
  });

  const [removingId, setRemovingId] = useState("");

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const activeRule = useMemo(() => {
    return (
      APPROVAL_RULE_TABS.find((rule) => rule.key === activeRuleKey) ||
      APPROVAL_RULE_TABS[0]
    );
  }, [activeRuleKey]);

  const activeSearch = searchByRule[activeRule.key] || "";

  const counts = useMemo(() => {
    return {
      offers: usersByRule.offers.length,
      jobDescription: usersByRule.jobDescription.length,
    };
  }, [usersByRule]);

  function openStatusModal(type, title, message) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
  }

  function closeStatusModal() {
    setStatusModal((previous) => ({
      ...previous,
      open: false,
    }));
  }

  async function loadUsers(rule) {
    setLoadingByRule((previous) => ({
      ...previous,
      [rule.key]: true,
    }));

    try {
      const result = await apiGetWithFallback(getListUrls(rule));

      const rows = normalizeRows(result)
        .map(normalizeApprovalUser)
        .filter((item) => item.sibsId);

      setUsersByRule((previous) => ({
        ...previous,
        [rule.key]: rows,
      }));
    } catch (error) {
      console.error(`LOAD ${rule.key} APPROVAL USERS ERROR:`, error);

      openStatusModal(
        "error",
        "Load Failed",
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          `Failed to load ${rule.title}.`,
      );
    } finally {
      setLoadingByRule((previous) => ({
        ...previous,
        [rule.key]: false,
      }));
    }
  }

  async function searchEmployees(rule, keyword) {
    const cleanKeyword = cleanText(keyword);

    if (cleanKeyword.length < 2) {
      setCandidatesByRule((previous) => ({
        ...previous,
        [rule.key]: [],
      }));
      return;
    }

    setSearchingByRule((previous) => ({
      ...previous,
      [rule.key]: true,
    }));

    try {
      const result = await apiGetWithFallback(getSearchUrls(rule), {
        params: {
          search: cleanKeyword,
          q: cleanKeyword,
          keyword: cleanKeyword,
          limit: 20,
        },
      });

      const candidates = normalizeRows(result)
        .map(normalizeCandidate)
        .filter(Boolean);

      setCandidatesByRule((previous) => ({
        ...previous,
        [rule.key]: candidates,
      }));
    } catch (error) {
      console.error(`SEARCH ${rule.key} APPROVAL USERS ERROR:`, error);

      setCandidatesByRule((previous) => ({
        ...previous,
        [rule.key]: [],
      }));
    } finally {
      setSearchingByRule((previous) => ({
        ...previous,
        [rule.key]: false,
      }));
    }
  }

  async function handleAddUser() {
    const selected = selectedByRule[activeRule.key];

    if (!selected) {
      openStatusModal(
        "error",
        "No User Selected",
        "Please select an employee first.",
      );
      return;
    }

    const alreadyAdded = usersByRule[activeRule.key].some(
      (item) => String(item.sibsId) === String(selected.sibsId),
    );

    if (alreadyAdded) {
      openStatusModal(
        "error",
        "Already Added",
        "This user is already included in this approval rule.",
      );
      return;
    }

    setAddingByRule((previous) => ({
      ...previous,
      [activeRule.key]: true,
    }));

    try {
      const result = await apiPostWithFallback(getAddUrls(activeRule), {
        sibsId: selected.sibsId,
        sibs_id: selected.sibsId,
        employeeName: selected.employeeName,
        employee_name: selected.employeeName,
        createdBy: getUserDisplayName(user),
        created_by: getUserDisplayName(user),
      });

      if (result?.success === false) {
        throw new Error(result.message || "Failed to add approval user.");
      }

      setSearchByRule((previous) => ({
        ...previous,
        [activeRule.key]: "",
      }));

      setSelectedByRule((previous) => ({
        ...previous,
        [activeRule.key]: null,
      }));

      setCandidatesByRule((previous) => ({
        ...previous,
        [activeRule.key]: [],
      }));

      await loadUsers(activeRule);

      openStatusModal(
        "success",
        "Approval User Added",
        `${selected.employeeName} was added to ${activeRule.title}.`,
      );
    } catch (error) {
      console.error(`ADD ${activeRule.key} APPROVAL USER ERROR:`, error);

      openStatusModal(
        "error",
        "Add Failed",
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to add approval user.",
      );
    } finally {
      setAddingByRule((previous) => ({
        ...previous,
        [activeRule.key]: false,
      }));
    }
  }

  async function handleRemoveUser(targetUser) {
    if (!targetUser) return;

    setRemovingId(targetUser.id);

    try {
      const result = await apiDeleteWithFallback(
        getDeleteUrls(activeRule, targetUser),
        {
          sibsId: targetUser.sibsId,
          sibs_id: targetUser.sibsId,
          deletedBy: getUserDisplayName(user),
          deleted_by: getUserDisplayName(user),
        },
      );

      if (result?.success === false) {
        throw new Error(result.message || "Failed to remove approval user.");
      }

      setUsersByRule((previous) => ({
        ...previous,
        [activeRule.key]: previous[activeRule.key].filter(
          (item) =>
            String(item.id) !== String(targetUser.id) &&
            String(item.sibsId) !== String(targetUser.sibsId),
        ),
      }));

      openStatusModal(
        "success",
        "Approval User Removed",
        `${targetUser.employeeName} was removed from ${activeRule.title}.`,
      );
    } catch (error) {
      console.error(`REMOVE ${activeRule.key} APPROVAL USER ERROR:`, error);

      openStatusModal(
        "error",
        "Remove Failed",
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to remove approval user.",
      );
    } finally {
      setRemovingId("");
    }
  }

  useEffect(() => {
    APPROVAL_RULE_TABS.forEach((rule) => {
      loadUsers(rule);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      searchEmployees(activeRule, activeSearch);
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRuleKey, activeSearch]);

  return (
    <div className="rounded-2xl border border-[#D9E2EC] bg-white p-4 shadow-sm">
      <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <UserRoundCheck size={14} />
              Approval Configuration
            </div>

            <h2 className="mt-3 text-lg font-extrabold text-sibs-primary-1">
              Recruitment Approval Rules
            </h2>

            <p className="mt-1 text-sm font-semibold leading-6 text-sibs-primary-1/80">
              Configure approval users for Offers and Job Descriptions from one
              settings panel.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row">
        <RuleInnerNav
          activeRuleKey={activeRuleKey}
          counts={counts}
          onChange={(nextKey) => {
            setActiveRuleKey(nextKey);
          }}
        />

        <ApprovalRulePanel
          rule={activeRule}
          users={usersByRule[activeRule.key]}
          candidates={candidatesByRule[activeRule.key]}
          search={searchByRule[activeRule.key]}
          selectedCandidate={selectedByRule[activeRule.key]}
          loading={loadingByRule[activeRule.key]}
          searching={searchingByRule[activeRule.key]}
          adding={addingByRule[activeRule.key]}
          removingId={removingId}
          onSearchChange={(nextSearch) => {
            setSearchByRule((previous) => ({
              ...previous,
              [activeRule.key]: nextSearch,
            }));

            setSelectedByRule((previous) => ({
              ...previous,
              [activeRule.key]: null,
            }));
          }}
          onSelectCandidate={(candidate) => {
            setSelectedByRule((previous) => ({
              ...previous,
              [activeRule.key]: candidate,
            }));

            setSearchByRule((previous) => ({
              ...previous,
              [activeRule.key]: candidate.label,
            }));
          }}
          onAddUser={handleAddUser}
          onRemoveUser={handleRemoveUser}
        />
      </div>

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={closeStatusModal}
        lockScroll
      />
    </div>
  );
}
