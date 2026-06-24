import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserCheck,
} from "lucide-react";

import StatusModal from "../../modals/StatusModal";

import {
  getOfferApprovalUsers,
  saveOfferApprovalUsers,
  searchOfferApprovalEmployees,
} from "../../../lib/axios/getOfferApprovalRules";

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function normalizeApprovalUser(user = {}) {
  const sibsId = cleanText(user.sibsId || user.sibs_id);
  const firstName = cleanText(user.firstName || user.first_name);
  const middleName = cleanText(user.middleName || user.middle_name);
  const lastName = cleanText(user.lastName || user.last_name);
  const displayName = cleanText(user.displayName || user.display_name);

  return {
    id: user.id,
    sibsId,
    displayName: displayName.toUpperCase(),
    firstName,
    middleName,
    lastName,
    isActive: user.isActive ?? user.is_active ?? true,
    sortOrder: Number(user.sortOrder ?? user.sort_order ?? 0),
  };
}

function EmployeeSearchDropdown({
  value,
  options = [],
  loading = false,
  disabled = false,
  onSearch,
  onSelect,
}) {
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  const selectedLabel = value?.displayName || "";

  const filteredOptions = useMemo(() => {
    const keywordKey = normalizeKey(keyword);

    if (!keywordKey) return options;

    return options.filter((option) => {
      const haystack = normalizeKey(
        [
          option.sibsId,
          option.displayName,
          option.firstName,
          option.middleName,
          option.lastName,
        ]
          .filter(Boolean)
          .join(" "),
      );

      return haystack.includes(keywordKey);
    });
  }, [keyword, options]);

  const inputValue = open ? keyword : selectedLabel;

  useEffect(() => {
    function handleClickOutside(event) {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(event.target)) {
        setOpen(false);
        setKeyword("");
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
        setKeyword("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleFocus() {
    if (disabled) return;

    setOpen(true);
    setKeyword("");
    onSearch?.("");
  }

  function handleChange(event) {
    const nextKeyword = event.target.value;

    setKeyword(nextKeyword);
    setOpen(true);
    onSearch?.(nextKeyword);
  }

  function handleToggle(event) {
    event.preventDefault();
    event.stopPropagation();

    if (disabled) return;

    setOpen((previous) => {
      const nextOpen = !previous;

      if (nextOpen) {
        setKeyword("");
        onSearch?.("");

        window.setTimeout(() => {
          inputRef.current?.focus?.();
        }, 50);
      }

      return nextOpen;
    });
  }

  function handleSelect(option) {
    onSelect?.({
      ...option,
      displayName: String(option.displayName || "").toUpperCase(),
    });

    setKeyword("");
    setOpen(false);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      setOpen(false);
      setKeyword("");
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      }
    }
  }

  return (
    <div ref={wrapperRef} className="relative min-w-0">
      <div
        onClick={() => {
          if (disabled) return;

          setOpen(true);
          inputRef.current?.focus?.();
        }}
        className={`flex h-11 w-full min-w-0 items-center gap-3 rounded-xl border bg-white px-4 text-left text-sm font-semibold shadow-sm outline-none transition ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D0D5DD] hover:border-sibs-primary-1/50"
        } ${
          disabled
            ? "cursor-not-allowed bg-[#F8FAFC] text-sibs-tertiary-5"
            : "cursor-text text-sibs-primary-1"
        }`}
      >
        <Search size={17} className="shrink-0 text-sibs-primary-1" />

        <input
          ref={inputRef}
          value={inputValue}
          disabled={disabled}
          onFocus={handleFocus}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Search SIBS ID or employee name..."
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold text-sibs-primary-1 outline-none placeholder:text-sibs-tertiary-5 disabled:cursor-not-allowed"
        />

        {loading ? (
          <Loader2
            size={17}
            className="shrink-0 animate-spin text-sibs-primary-1"
          />
        ) : (
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleToggle}
            className="shrink-0 rounded-lg p-1 text-sibs-primary-1 transition hover:bg-[#EAF4FF]"
          >
            <ChevronDown
              size={18}
              className={`transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[80] overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="max-h-72 overflow-y-auto py-2">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm font-bold text-sibs-tertiary-5">
                <Loader2 size={17} className="animate-spin" />
                Searching employees...
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const active =
                  String(option.sibsId) === String(value?.sibsId || "");

                return (
                  <button
                    key={`${option.sibsId}-${option.displayName}`}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition ${
                      active
                        ? "bg-[#EAF4FF] text-sibs-primary-1"
                        : "bg-white text-[#344054] hover:bg-[#F5F9FF] hover:text-sibs-primary-1"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold">
                        {String(option.displayName || "").toUpperCase()}
                      </span>

                      <span className="mt-0.5 block truncate text-xs font-semibold text-sibs-tertiary-5">
                        SIBS ID: {option.sibsId}
                      </span>
                    </span>

                    {active && (
                      <Check
                        size={17}
                        className="mt-0.5 shrink-0 text-sibs-primary-1"
                      />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-sm font-bold text-sibs-tertiary-5">
                No employees found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApprovalRulesSettings() {
  const [approvalUsers, setApprovalUsers] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchingEmployees, setSearchingEmployees] = useState(false);
  const [saving, setSaving] = useState(false);

  const searchRequestRef = useRef(0);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  function showStatusModal({ type = "success", title = "", message = "" }) {
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

  function buildSavePayload(users = []) {
    return users.map((user, index) => ({
      sibsId: user.sibsId,
      displayName: String(user.displayName || "").toUpperCase(),
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      sortOrder: index,
    }));
  }

  function getSavedRows(response, fallbackUsers = []) {
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.users)) return response.users;

    return fallbackUsers;
  }

  async function persistApprovalUsers(nextUsers = [], successMessage = "") {
    setSaving(true);

    try {
      const payload = buildSavePayload(nextUsers);
      const response = await saveOfferApprovalUsers(payload);
      const rows = getSavedRows(response, payload);

      setApprovalUsers(rows.map(normalizeApprovalUser));

      showStatusModal({
        type: "success",
        title: "Approval Rules Updated",
        message:
          successMessage ||
          "Offer approval users were automatically saved to the database.",
      });

      return true;
    } catch (error) {
      console.error("Auto-save approval rules error:", error);

      showStatusModal({
        type: "error",
        title: "Auto-save Failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to save approval rules to the database.",
      });

      return false;
    } finally {
      setSaving(false);
    }
  }

  async function loadApprovalUsers() {
    try {
      setLoadingUsers(true);

      const response = await getOfferApprovalUsers();

      const rows = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.users)
          ? response.users
          : [];

      setApprovalUsers(rows.map(normalizeApprovalUser));
    } catch (error) {
      console.error("Load offer approval users error:", error);

      setApprovalUsers([]);

      showStatusModal({
        type: "error",
        title: "Load Failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load approval users.",
      });
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadEmployeeOptions(search = "") {
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;

    try {
      setSearchingEmployees(true);

      const response = await searchOfferApprovalEmployees(search);

      if (requestId !== searchRequestRef.current) return;

      const rows = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.employees)
          ? response.employees
          : [];

      setEmployeeOptions(rows.map(normalizeApprovalUser));
    } catch (error) {
      if (requestId !== searchRequestRef.current) return;

      console.error("Search offer approval employees error:", error);

      setEmployeeOptions([]);

      showStatusModal({
        type: "error",
        title: "Employee Search Failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to search employees.",
      });
    } finally {
      if (requestId === searchRequestRef.current) {
        setSearchingEmployees(false);
      }
    }
  }

  useEffect(() => {
    loadApprovalUsers();
    loadEmployeeOptions("");
  }, []);

  async function handleAddUser() {
    if (saving || loadingUsers) return;

    if (!selectedEmployee?.sibsId) {
      showStatusModal({
        type: "error",
        title: "No Employee Selected",
        message: "Please select an employee from the searchable dropdown.",
      });

      return;
    }

    const normalizedSelectedEmployee = normalizeApprovalUser(selectedEmployee);

    const exists = approvalUsers.some(
      (user) =>
        String(user.sibsId).toLowerCase() ===
        String(normalizedSelectedEmployee.sibsId).toLowerCase(),
    );

    if (exists) {
      showStatusModal({
        type: "error",
        title: "Already Added",
        message: `${normalizedSelectedEmployee.displayName} is already in the approval rules.`,
      });

      setSelectedEmployee(null);
      return;
    }

    const nextUsers = [
      ...approvalUsers,
      {
        ...normalizedSelectedEmployee,
        sortOrder: approvalUsers.length,
      },
    ];

    const saved = await persistApprovalUsers(
      nextUsers,
      "The selected employee was added and saved to the database.",
    );

    if (saved) {
      setSelectedEmployee(null);
    }
  }

  async function handleRemoveUser(sibsId) {
    if (saving || loadingUsers) return;

    const nextUsers = approvalUsers
      .filter((user) => String(user.sibsId) !== String(sibsId))
      .map((user, index) => ({
        ...user,
        sortOrder: index,
      }));

    await persistApprovalUsers(
      nextUsers,
      "The approval user was removed and saved to the database.",
    );
  }

  return (
    <>
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
              <UserCheck size={22} />
            </div>

            <h3 className="mt-4 text-xl font-extrabold text-[#101828]">
              Offer Approval Rules
            </h3>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-sibs-tertiary-5">
              Add the users who are allowed to approve or reject offers. The
              Offers page will show only one Approve and one Reject button, and
              the action will be recorded under the logged-in user.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
          <label className="text-sm font-extrabold text-[#101828]">
            Add Approval User
          </label>

          <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
            <EmployeeSearchDropdown
              value={selectedEmployee}
              options={employeeOptions}
              loading={searchingEmployees}
              disabled={loadingUsers || saving}
              onSearch={loadEmployeeOptions}
              onSelect={setSelectedEmployee}
            />

            <button
              type="button"
              onClick={handleAddUser}
              disabled={loadingUsers || saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-5 text-sm font-extrabold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Plus size={17} />
              )}
              {saving ? "Saving..." : "Add User"}
            </button>
          </div>

          <p className="mt-2 text-xs font-bold text-sibs-primary-1">
            Adding or removing a user automatically saves the approval rules to
            the database.
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E6ECF2]">
          <div className="grid grid-cols-[1fr_auto] bg-[#F5F7FA] px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
            <span>Approval User</span>
            <span>Action</span>
          </div>

          {loadingUsers ? (
            <div className="bg-white px-5 py-10 text-center">
              <Loader2
                size={28}
                className="mx-auto mb-3 animate-spin text-sibs-primary-1"
              />

              <p className="text-sm font-extrabold text-[#344054]">
                Loading approval users...
              </p>
            </div>
          ) : approvalUsers.length > 0 ? (
            approvalUsers.map((user) => (
              <div
                key={user.sibsId}
                className="grid grid-cols-[1fr_auto] items-center border-t border-[#E6ECF2] bg-white px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-[#101828]">
                    {String(user.displayName || "").toUpperCase()}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                    Can approve or reject offers from the Offers page.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveUser(user.sibsId)}
                  disabled={saving}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          ) : (
            <div className="bg-white px-5 py-10 text-center text-sm font-bold text-sibs-tertiary-5">
              No approval users added yet.
            </div>
          )}
        </div>
      </section>

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={closeStatusModal}
        lockScroll
      />
    </>
  );
}