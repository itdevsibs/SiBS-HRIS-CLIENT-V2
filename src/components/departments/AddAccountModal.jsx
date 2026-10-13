import { useEffect, useRef, useState } from "react";
import { Building2, ChevronDown, Loader2, Search } from "lucide-react";

import { ModalShell } from "@/components/ui";
import DropdownPortal from "@/components/ui/DropdownPortal";
import { getAccountCreationDepartments } from "@/lib/axios/getDepartments";

export default function AddAccountModal({ open, onClose, onSubmit, submitting = false }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [ghlName, setGhlName] = useState("");
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [activeOptionIndex, setActiveOptionIndex] = useState(0);
  const dropdownRef = useRef(null);
  const accountRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    setDepartmentId("");
    setAccountName("");
    setGhlName("");
    setError("");
    setDropdownOpen(false);
    setDepartmentSearch("");
    setActiveOptionIndex(0);
    setLoading(true);
    setLoadError("");

    getAccountCreationDepartments()
      .then((result) => {
        if (active) setDepartments(Array.isArray(result) ? result : []);
      })
      .catch((requestError) => {
        if (active) {
          setDepartments([]);
          setLoadError(requestError?.message || "Unable to load approved departments.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [open]);

  useEffect(() => {
    if (departmentId) accountRef.current?.focus();
  }, [departmentId]);

  const selectedDepartment = departments.find((item) => String(item.id) === departmentId);
  const matches = departments.filter((item) =>
    String(item.departmentName || "").toLowerCase().includes(departmentSearch.trim().toLowerCase()),
  );

  function chooseDepartment(department) {
    setDepartmentId(String(department.id));
    setAccountName("");
    setGhlName("");
    setError("");
    setDropdownOpen(false);
    setDepartmentSearch("");
    setActiveOptionIndex(0);
  }

  function handleDepartmentKeyDown(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!dropdownOpen) {
        setDepartmentSearch("");
        setActiveOptionIndex(event.key === "ArrowDown" ? 0 : Math.max(departments.length - 1, 0));
        setDropdownOpen(true);
      } else {
        setActiveOptionIndex((index) => matches.length
          ? (index + (event.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length
          : 0);
      }
    } else if (event.key === "Enter" && dropdownOpen) {
      event.preventDefault(); // Do not submit the form while selecting a department.
      if (matches.length) chooseDepartment(matches[Math.min(activeOptionIndex, matches.length - 1)]);
    } else if (event.key === "Escape" && dropdownOpen) {
      event.preventDefault();
      event.stopPropagation(); // Close the department options, not the entire modal.
      setDropdownOpen(false);
    } else if (event.key === "Tab") {
      setDropdownOpen(false);
    }
  }

  function handleClose() {
    if (submitting) return;
    setDropdownOpen(false);
    onClose?.();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedDepartment) {
      setError("Select an approved department before entering the account name.");
      return;
    }
    const name = accountName.trim().replace(/\s+/g, " ");
    if (!name) {
      setError("Account name is required.");
      return;
    }
    setError("");
    try {
      await onSubmit?.({ departmentId: selectedDepartment.id, accountName: name, ghlName: ghlName.trim() });
    } catch (submitError) {
      setError(submitError?.message || "Unable to submit the account request.");
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={submitting ? undefined : handleClose}
      title="Add Account"
      subtitle="Select an approved department, then submit the account for approval."
      icon={Building2}
      maxWidth="max-w-xl"
      closeOnBackdrop={!submitting}
      closeOnEscape={!submitting}
      footer={
        <>
          <button type="button" className="sibs-btn-secondary" onClick={handleClose} disabled={submitting}>Cancel</button>
          <button
            type="submit"
            form="add-account-form"
            className="sibs-btn-primary"
            disabled={submitting || loading || !selectedDepartment || !accountName.trim()}
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</> : "Submit for Approval"}
          </button>
        </>
      }
    >
      <form id="add-account-form" className="space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-sibs-border bg-sibs-surface/60 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sibs-orange shadow-sm ring-1 ring-sibs-border">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-sibs-navy">Account Information</p>
              <p className="mt-0.5 text-[11px] font-semibold leading-relaxed text-sibs-muted">
                Every account belongs to one approved department. The GHL name is an optional alias; Lines of Business can be added after approval.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="add-account-department" className="mb-1.5 block text-xs font-extrabold text-sibs-navy">
            1. Department <span className="text-rose-500">*</span>
          </label>
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-faint" />
              <input
                id="add-account-department"
                type="text"
                role="combobox"
                autoComplete="off"
                aria-autocomplete="list"
                aria-haspopup="listbox"
                aria-controls="add-account-department-options"
                aria-expanded={dropdownOpen}
                aria-activedescendant={dropdownOpen && matches.length
                  ? `add-account-department-option-${matches[Math.min(activeOptionIndex, matches.length - 1)].id}`
                  : undefined}
                disabled={submitting || loading || Boolean(loadError)}
                value={dropdownOpen ? departmentSearch : selectedDepartment?.departmentName || ""}
                onFocus={() => {
                  setDepartmentSearch("");
                  setActiveOptionIndex(0);
                  setDropdownOpen(true);
                }}
                onClick={() => {
                  if (!dropdownOpen) {
                    setDepartmentSearch("");
                    setActiveOptionIndex(0);
                    setDropdownOpen(true);
                  }
                }}
                onChange={(event) => {
                  setDepartmentSearch(event.target.value);
                  setActiveOptionIndex(0);
                  setDropdownOpen(true);
                  // A typed value is not a validated department selection.
                  setDepartmentId("");
                  setAccountName("");
                  setGhlName("");
                  setError("");
                }}
                onKeyDown={handleDepartmentKeyDown}
                placeholder={loading ? "Loading approved departments..." : "Search or select department..."}
                className="h-11 w-full rounded-xl border border-sibs-border bg-white pl-10 pr-10 text-sm font-semibold text-sibs-navy outline-none transition placeholder:text-sibs-faint focus:border-sibs-orange focus:ring-2 focus:ring-sibs-orange/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <ChevronDown className={`pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-muted transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </div>
            <DropdownPortal
              open={dropdownOpen && !loading && !loadError}
              anchorRef={dropdownRef}
              onClose={() => setDropdownOpen(false)}
              matchAnchorWidth
              maxHeight={224}
              offset={6}
              className="overflow-y-auto py-1"
            >
              <div
                id="add-account-department-options"
                role="listbox"
                aria-label="Approved departments"
              >
                {matches.length ? matches.map((department, index) => (
                  <button
                    id={`add-account-department-option-${department.id}`}
                    key={department.id}
                    type="button"
                    role="option"
                    aria-selected={departmentId === String(department.id)}
                    onMouseEnter={() => setActiveOptionIndex(index)}
                    onClick={() => chooseDepartment(department)}
                    className={`block w-full px-3.5 py-2.5 text-left text-xs font-bold hover:bg-sibs-surface ${
                      departmentId === String(department.id) ? "text-sibs-orange" : "text-sibs-navy"
                    } ${index === activeOptionIndex ? "bg-sibs-surface" : ""}`}
                  >
                    {department.departmentName}
                  </button>
                )) : (
                  <p className="px-3.5 py-3 text-xs font-semibold text-sibs-muted">No matching approved departments.</p>
                )}
              </div>
            </DropdownPortal>
          </div>
          {loadError ? <p role="alert" className="mt-2 text-xs font-semibold text-rose-700">{loadError}. Close and reopen to retry.</p> : null}
        </div>

        {selectedDepartment ? (
          <>
            <div>
              <label htmlFor="new-account-name" className="mb-1.5 block text-xs font-extrabold text-sibs-navy">
                2. Account Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-faint" />
                <input
                  id="new-account-name"
                  ref={accountRef}
                  type="text"
                  value={accountName}
                  onChange={(event) => { setAccountName(event.target.value); if (error) setError(""); }}
                  placeholder="Enter account name"
                  maxLength={255}
                  disabled={submitting}
                  required
                  className="h-11 w-full rounded-xl border border-sibs-border bg-white pl-10 pr-3.5 text-sm font-semibold text-sibs-navy outline-none transition placeholder:text-sibs-faint focus:border-sibs-orange focus:ring-2 focus:ring-sibs-orange/10 disabled:cursor-not-allowed disabled:bg-sibs-surface disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label htmlFor="new-account-ghl-name" className="mb-1.5 block text-xs font-extrabold text-sibs-navy">
                3. GHL Name <span className="font-semibold text-sibs-muted">(Optional)</span>
              </label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-faint" />
                <input
                  id="new-account-ghl-name"
                  type="text"
                  value={ghlName}
                  onChange={(event) => { setGhlName(event.target.value); if (error) setError(""); }}
                  placeholder="Enter GHL name or aliases (optional)"
                  maxLength={255}
                  disabled={submitting}
                  className="h-11 w-full rounded-xl border border-sibs-border bg-white pl-10 pr-3.5 text-sm font-semibold text-sibs-navy outline-none transition placeholder:text-sibs-faint focus:border-sibs-orange focus:ring-2 focus:ring-sibs-orange/10 disabled:cursor-not-allowed disabled:bg-sibs-surface disabled:opacity-60"
                />
              </div>
            </div>

          </>
        ) : null}

        {error ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">{error}</div> : null}

      </form>
    </ModalShell>
  );
}
