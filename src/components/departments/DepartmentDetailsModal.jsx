import { createElement, useCallback, useRef, useState } from "react";

import {
  BriefcaseBusiness,
  CheckCircle2,
  Layers3,
  Loader2,
  Mail,
  MapPin,
  ShieldCheck,
  UserRoundCog,
  UsersRound,
  WalletCards,
  XCircle,
} from "lucide-react";

import { ModalShell, SelectDropdown } from "@/components/ui";
import AccountLobManagementModal from "./AccountLobManagementModal";
import DepartmentProfileAvatar from "./DepartmentProfileAvatar";
import {
  assignEmployeeLob,
  getAccountLobs,
  getDepartmentAccountEmployees,
} from "@/lib/axios/departments";

function PersonChip({ person, fallbackTitle }) {
  const displayName = person?.name || "Assignment unavailable";
  const title = person?.title || fallbackTitle;
  const sibsId = person?.sibsId || "";

  return (
    <div className="flex min-w-0 items-start gap-2.5 rounded-lg border border-sibs-border bg-white px-3 py-2.5">
      <DepartmentProfileAvatar employee={person} size="sm" />

      <div className="min-w-0">
        <p className="break-words text-xs font-extrabold leading-5 text-sibs-navy">
          {displayName}
        </p>
        <p className="mt-0.5 break-words text-[10px] font-semibold leading-4 text-sibs-muted">
          {title}
          {sibsId ? ` · ${sibsId}` : ""}
        </p>
      </div>
    </div>
  );
}

function LeadershipGroup({ title, icon, people, emptyText }) {
  return (
    <div className="min-w-0">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-sibs-faint">
        {createElement(icon, { className: "h-3.5 w-3.5" })}
        {title}
      </p>

      {people.length ? (
        <div className="grid gap-2">
          {people.map((person, index) => (
            <PersonChip
              key={`${person?.sibsId || person?.name || title}-${index}`}
              person={person}
              fallbackTitle={title}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-sibs-border bg-white px-3 py-3 text-[11px] font-semibold text-sibs-muted">
          {emptyText}
        </div>
      )}
    </div>
  );
}

function EmployeeStatusBadge({ status }) {
  const active = String(status || "").toLowerCase() === "active";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-600"
      }`}
    >
      {active ? (
        <CheckCircle2 className="h-2.5 w-2.5" />
      ) : (
        <XCircle className="h-2.5 w-2.5" />
      )}
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function AccountEmployeesModal({
  account,
  employees,
  summary,
  lobFilter,
  loading,
  error,
  lobs,
  lobsLoading,
  canManageLobs,
  assignmentSavingSibsId,
  assignmentError,
  onAssignLob,
  onClose,
}) {
  if (!account) return null;

  const activeLobs = (Array.isArray(lobs) ? lobs : []).filter(
    (lob) => lob.isActive,
  );
  const normalizedLobFilter = String(lobFilter || "").trim().toLowerCase();
  const filteredByLob = Boolean(normalizedLobFilter);
  const visibleEmployees = filteredByLob
    ? employees.filter((employee) => {
        const lobNames = Array.isArray(employee?.lobNames)
          ? employee.lobNames
          : employee?.lobName
            ? [employee.lobName]
            : [];

        return lobNames.some(
          (lobName) =>
            String(lobName || "").trim().toLowerCase() === normalizedLobFilter,
        );
      })
    : employees;
  const visibleEmployeeCount = visibleEmployees.length;

  return (
    <ModalShell
      open
      onClose={onClose}
      title={filteredByLob ? `${lobFilter} Employees` : `${account.name} Employees`}
      subtitle={
        filteredByLob
          ? `Employees assigned to ${lobFilter} under ${account.name}.`
          : `Employees assigned to ${account.name}. Assign each employee to the correct account-specific Line of Business.`
      }
      icon={UsersRound}
      badge={`${
        filteredByLob
          ? visibleEmployeeCount
          : summary.totalEmployees || employees.length
      } employee${
        (filteredByLob
          ? visibleEmployeeCount
          : summary.totalEmployees || employees.length) === 1
          ? ""
          : "s"
      }`}
      maxWidth="max-w-5xl"
      className="sibs-account-employees-modal"
      headerClassName="sibs-account-employees-modal-header"
      bodyClassName="max-h-[70vh] overflow-y-auto"
      closeOnBackdrop={false}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <span className="text-xs font-bold text-sibs-muted">
            {filteredByLob
              ? `${visibleEmployeeCount} employee${visibleEmployeeCount === 1 ? "" : "s"} assigned to ${lobFilter}`
              : `${summary.lobAssignedEmployees || 0} with LOB · ${
                  summary.lobUnassignedEmployees ??
                  Math.max(
                    0,
                    employees.length - (summary.lobAssignedEmployees || 0),
                  )
                } unassigned`}
          </span>
          <button type="button" className="sibs-btn-primary !text-sm" onClick={onClose}>
            Close Employees
          </button>
        </div>
      }
    >
      {assignmentError ? (
        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {assignmentError}
        </div>
      ) : null}

      {lobsLoading ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-sibs-border bg-sibs-surface px-4 py-3 text-xs font-bold text-sibs-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-sibs-orange" />
          Loading account Lines of Business...
        </div>
      ) : !activeLobs.length ? (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
          No active LOBs are configured for this Account yet. Add an LOB from Account details before assigning employees.
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-52 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-sibs-orange" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : visibleEmployees.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {visibleEmployees.map((employee, index) => {
            const savingAssignment = Boolean(
              assignmentSavingSibsId?.[String(employee.sibsId)],
            );
            const currentLobIds = Array.isArray(employee.lobIds)
              ? employee.lobIds.map((id) => String(id))
              : employee.lobId
                ? [String(employee.lobId)]
                : [];
            const currentLobIdSet = new Set(currentLobIds);
            const selectedLobs = (Array.isArray(lobs) ? lobs : []).filter((lob) =>
              currentLobIdSet.has(String(lob.id)),
            );

            return (
              <article
                key={`${employee.sibsId || employee.employeeId || employee.id || "employee"}-${index}`}
                className="flex min-w-0 items-start gap-3 rounded-xl border border-sibs-border bg-white p-3"
              >
                <DepartmentProfileAvatar employee={employee} />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-words text-xs font-extrabold leading-5 text-sibs-navy">
                        {employee.name || "Unnamed Employee"}
                      </p>
                      <p className="mt-0.5 text-[10px] font-semibold text-sibs-muted">
                        SIBS ID: {employee.sibsId || "—"}
                      </p>
                    </div>
                    <EmployeeStatusBadge status={employee.status} />
                  </div>

                  {employee.email ? (
                    <p className="mt-2 flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-sibs-secondary">
                      <Mail className="h-3 w-3 shrink-0 text-sibs-orange" />
                      <span className="truncate">{employee.email}</span>
                    </p>
                  ) : null}

                  <p className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-sibs-muted">
                    <MapPin className="h-3 w-3 shrink-0 text-sibs-faint" />
                    {employee.location || "Location unavailable"}
                  </p>

                  <div className="mt-3 rounded-lg border border-sibs-border bg-sibs-surface p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-sibs-faint">
                        <BriefcaseBusiness className="h-3 w-3" />
                        Line of Business
                      </p>
                      {savingAssignment ? (
                        <Loader2 className="h-3 w-3 animate-spin text-sibs-orange" />
                      ) : null}
                    </div>

                    {canManageLobs ? (
                      <div className="mt-1.5">
                        <SelectDropdown
                          multiple
                          value={currentLobIds}
                          onChange={(selectedValues) =>
                            onAssignLob?.(employee, selectedValues)
                          }
                          disabled={lobsLoading}
                          placeholder="Unassigned"
                          clearable={false}
                          searchable={false}
                          options={[
                            { value: "All", label: "Unassigned" },
                            ...(lobs || []).map((lob) => ({
                              value: String(lob.id),
                              label: `${lob.lobName}${
                                lob.lobCode ? ` (${lob.lobCode})` : ""
                              }${!lob.isActive ? " — Inactive" : ""}`,
                              disabled:
                                !lob.isActive && !currentLobIdSet.has(String(lob.id)),
                            })),
                          ]}
                          buttonClassName="!h-9 !rounded-lg !border-[#E6ECF2] !bg-[#F8FAFC] !px-3 !text-xs !font-bold !text-[#042C51] hover:!border-[#FF5C28]/40 hover:!bg-white"
                          menuClassName="sibs-employee-lob-dropdown !rounded-[10px] !border-[#D7DEE8]"
                        />

                        {selectedLobs.length ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {selectedLobs.map((lob) => (
                              <span
                                key={lob.id}
                                className="inline-flex max-w-full items-center rounded-md border border-sibs-border bg-white px-2.5 py-1.5 text-[10px] font-bold text-sibs-secondary"
                                title={lob.lobName}
                              >
                                <span className="truncate">{lob.lobName}</span>
                                {lob.lobCode ? (
                                  <span className="ml-1 text-sibs-faint">({lob.lobCode})</span>
                                ) : null}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {(Array.isArray(employee.lobs) && employee.lobs.length
                          ? employee.lobs
                          : employee.lob
                            ? [employee.lob]
                            : []
                        ).length ? (
                          (Array.isArray(employee.lobs) && employee.lobs.length
                            ? employee.lobs
                            : [employee.lob]
                          ).map((lob) => (
                            <span
                              key={lob.id || lob.lobName}
                              className="rounded-md border border-sibs-border bg-white px-2.5 py-1.5 text-[10px] font-bold text-sibs-secondary"
                            >
                              {lob.lobName || "LOB"}
                              {lob.lobCode ? ` (${lob.lobCode})` : ""}
                            </span>
                          ))
                        ) : (
                          <p className="text-xs font-extrabold text-sibs-navy">
                            Unassigned
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-sibs-border p-8 text-center text-sm font-semibold text-sibs-muted">
          {filteredByLob
            ? `No employees are currently assigned to ${lobFilter}.`
            : "No employees are assigned to this account."}
        </div>
      )}
    </ModalShell>
  );
}

function AccountCard({
  account,
  onViewEmployees,
  onViewLobEmployees,
  onManageLobs,
  lobCount,
  lobNames = [],
  canManageLobs,
}) {
  const active = account.status === "active";
  const operationsManagers = Array.isArray(account.operationsManagers)
    ? account.operationsManagers
    : [];
  const teamLeaders = Array.isArray(account.teamLeaders)
    ? account.teamLeaders
    : [];
  const seniorOperationsManagers = Array.isArray(
    account.seniorOperationsManagers,
  )
    ? account.seniorOperationsManagers
    : [];
  const employeeCount = Number(account.employeeCount) || 0;

  return (
    <article
      title={`View ${account.name} employees`}
      onClick={() => onViewEmployees?.(account)}
      className="cursor-pointer overflow-hidden rounded-xl border border-sibs-border bg-sibs-surface transition hover:border-sibs-orange/50 hover:shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b border-sibs-border bg-white px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-base font-extrabold text-sibs-navy">
            {account.name}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-sibs-muted">
            {account.code}
            {account.longName ? ` · ${account.longName}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-sibs-border bg-sibs-surface px-3 py-2 text-[11px] font-extrabold text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-white hover:text-sibs-orange"
            onClick={(event) => {
              event.stopPropagation();
              onViewEmployees?.(account);
            }}
          >
            <UsersRound className="h-3.5 w-3.5" />
            {employeeCount} employee{employeeCount === 1 ? "" : "s"}
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-sibs-border bg-white px-3 py-2 text-[11px] font-extrabold text-sibs-navy transition hover:border-sibs-orange/40 hover:text-sibs-orange"
            onClick={(event) => {
              event.stopPropagation();
              onManageLobs?.(account);
            }}
          >
            <BriefcaseBusiness className="h-3.5 w-3.5" />
            {typeof lobCount === "number"
              ? `${lobCount} LOB${lobCount === 1 ? "" : "s"}`
              : canManageLobs
                ? "Manage LOBs"
                : "View LOBs"}
          </button>

          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1.5 text-[10px] font-extrabold uppercase ${
              active
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-100 text-slate-600"
            }`}
          >
            {active ? (
              <CheckCircle2 className="h-2.5 w-2.5" />
            ) : (
              <XCircle className="h-2.5 w-2.5" />
            )}
            {active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="border-b border-sibs-border bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-faint">
            Line of Business
          </span>
          {lobNames.length ? (
            <>
              {lobNames.slice(0, 3).map((lobName) => (
                <button
                  key={lobName}
                  type="button"
                  title={`View employees in ${lobName}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onViewLobEmployees?.(account, lobName);
                  }}
                  className="cursor-pointer rounded-md border border-sibs-border bg-sibs-surface px-2.5 py-1.5 text-[10px] font-bold text-sibs-secondary transition hover:border-sibs-orange/40 hover:bg-sibs-orange/5 hover:text-sibs-orange focus:outline-none focus-visible:border-sibs-orange focus-visible:ring-2 focus-visible:ring-sibs-orange/20"
                >
                  {lobName}
                </button>
              ))}
              {lobNames.length > 3 ? (
                <button
                  type="button"
                  title="View all Lines of Business"
                  onClick={(event) => {
                    event.stopPropagation();
                    onManageLobs?.(account);
                  }}
                  className="cursor-pointer rounded-md border border-sibs-border bg-sibs-surface px-2.5 py-1.5 text-[10px] font-bold text-sibs-muted transition hover:border-sibs-orange/40 hover:bg-white hover:text-sibs-orange focus:outline-none focus-visible:border-sibs-orange focus-visible:ring-2 focus-visible:ring-sibs-orange/20"
                >
                  +{lobNames.length - 3} more
                </button>
              ) : null}
            </>
          ) : (
            <span className="text-[11px] font-semibold text-sibs-muted">
              No active LOBs configured
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-3">
        <LeadershipGroup
          title="Team Leaders"
          icon={UsersRound}
          people={teamLeaders}
          emptyText="No Team Leader resolved for this account."
        />

        <LeadershipGroup
          title="Operations Manager"
          icon={UserRoundCog}
          people={operationsManagers}
          emptyText="No Operations Manager resolved for this account."
        />

        <LeadershipGroup
          title="Senior Operations Manager"
          icon={ShieldCheck}
          people={seniorOperationsManagers}
          emptyText="No Senior Operations Manager resolved for this account."
        />
      </div>
    </article>
  );
}

function normalizeEmployeeLobs(employee = {}, availableLobs = []) {
  const lobMap = new Map(
    (Array.isArray(availableLobs) ? availableLobs : []).map((lob) => [
      String(lob.id),
      lob,
    ]),
  );
  const sourceLobs = Array.isArray(employee.lobs)
    ? employee.lobs
    : employee.lob
      ? [employee.lob]
      : [];
  const sourceIds = Array.isArray(employee.lobIds)
    ? employee.lobIds
    : employee.lobId
      ? [employee.lobId]
      : sourceLobs.map((lob) => lob?.id).filter(Boolean);

  const normalized = [];
  const seen = new Set();

  sourceIds.forEach((id) => {
    const key = String(id || "");
    if (!key || seen.has(key)) return;
    seen.add(key);

    const existing = sourceLobs.find((lob) => String(lob?.id || "") === key) || {};
    const current = lobMap.get(key);
    normalized.push(current ? { ...existing, ...current } : existing);
  });

  return normalized.filter((lob) => lob?.id);
}

function withEmployeeLobs(employee, selectedLobs) {
  const normalized = Array.isArray(selectedLobs) ? selectedLobs : [];
  const primaryLob = normalized[0] || null;

  return {
    ...employee,
    lobIds: normalized.map((lob) => lob.id),
    lobNames: normalized.map((lob) => lob.lobName).filter(Boolean),
    lobCodes: normalized.map((lob) => lob.lobCode).filter(Boolean),
    lobs: normalized,
    lobId: primaryLob?.id || null,
    lobName: primaryLob?.lobName || "",
    lobCode: primaryLob?.lobCode || "",
    lobIsActive: primaryLob ? Boolean(primaryLob.isActive) : null,
    lob: primaryLob,
  };
}

function applyLobNamesToEmployees(employees, lobs) {
  return (Array.isArray(employees) ? employees : []).map((employee) =>
    withEmployeeLobs(employee, normalizeEmployeeLobs(employee, lobs)),
  );
}

export default function DepartmentDetailsModal({
  department,
  canManageLobs = false,
  onClose,
}) {
  const [selectedEmployeeAccount, setSelectedEmployeeAccount] = useState(null);
  const [selectedLobFilter, setSelectedLobFilter] = useState("");
  const [selectedLobAccount, setSelectedLobAccount] = useState(null);
  const [accountEmployees, setAccountEmployees] = useState([]);
  const [employeeSummary, setEmployeeSummary] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    lobAssignedEmployees: 0,
    lobUnassignedEmployees: 0,
  });
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState("");
  const [employeeCache, setEmployeeCache] = useState({});
  const [accountLobCache, setAccountLobCache] = useState({});
  const [employeeLobs, setEmployeeLobs] = useState([]);
  const [lobsLoading, setLobsLoading] = useState(false);
  const [assignmentSavingSibsId, setAssignmentSavingSibsId] = useState({});
  const assignmentQueuesRef = useRef({});
  const assignmentVersionsRef = useRef({});
  const [assignmentError, setAssignmentError] = useState("");

  const active = department?.status === "active";
  const accounts = Array.isArray(department?.accounts) ? department.accounts : [];

  const handleLobsChanged = useCallback(
    (accountId, lobs) => {
      const key = String(accountId || "").trim();
      if (!key) return;

      setAccountLobCache((current) => ({ ...current, [key]: lobs }));

      if (String(selectedEmployeeAccount?.id ?? "") === key) {
        setEmployeeLobs(lobs);
        setAccountEmployees((current) =>
          applyLobNamesToEmployees(current, lobs),
        );
      }
    },
    [selectedEmployeeAccount],
  );

  if (!department) return null;

  async function loadAccountLobs(accountId) {
    const key = String(accountId ?? "").trim();
    if (!key) return [];

    const cached = accountLobCache[key];
    if (Array.isArray(cached)) {
      setEmployeeLobs(cached);
      return cached;
    }

    setLobsLoading(true);

    try {
      const result = await getAccountLobs(key, { includeInactive: true });
      const lobs = Array.isArray(result?.lobs) ? result.lobs : [];
      setEmployeeLobs(lobs);
      setAccountLobCache((current) => ({ ...current, [key]: lobs }));
      return lobs;
    } catch (requestError) {
      setAssignmentError(
        requestError?.message || "Unable to load Lines of Business for this account.",
      );
      setEmployeeLobs([]);
      return [];
    } finally {
      setLobsLoading(false);
    }
  }

  async function handleViewEmployees(account, lobFilter = "") {
    const accountId = String(account?.id ?? "").trim();
    if (!accountId) return;

    setSelectedEmployeeAccount(account);
    setSelectedLobFilter(String(lobFilter || "").trim());
    setEmployeesError("");
    setAssignmentError("");
    setEmployeeLobs([]);

    loadAccountLobs(accountId);

    const cached = employeeCache[accountId];
    if (cached) {
      setAccountEmployees(cached.employees);
      setEmployeeSummary(cached.summary);
      return;
    }

    setAccountEmployees([]);
    setEmployeeSummary({
      totalEmployees: Number(account.employeeCount) || 0,
      activeEmployees: Number(account.activeEmployeeCount) || 0,
      inactiveEmployees: Math.max(
        0,
        (Number(account.employeeCount) || 0) -
          (Number(account.activeEmployeeCount) || 0),
      ),
      lobAssignedEmployees: 0,
      lobUnassignedEmployees: Number(account.employeeCount) || 0,
    });
    setEmployeesLoading(true);

    try {
      const result = await getDepartmentAccountEmployees(accountId);
      const employees = Array.isArray(result?.employees) ? result.employees : [];
      const summary = result?.summary || {
        totalEmployees: employees.length,
        activeEmployees: employees.filter(
          (employee) => employee.status === "active",
        ).length,
        inactiveEmployees: employees.filter(
          (employee) => employee.status !== "active",
        ).length,
        lobAssignedEmployees: employees.filter((employee) =>
          Array.isArray(employee.lobIds)
            ? employee.lobIds.length > 0
            : Boolean(employee.lobId),
        ).length,
        lobUnassignedEmployees: employees.filter((employee) =>
          Array.isArray(employee.lobIds)
            ? employee.lobIds.length === 0
            : !employee.lobId,
        ).length,
      };
      setAccountEmployees(employees);
      setEmployeeSummary(summary);
      setEmployeeCache((current) => ({
        ...current,
        [accountId]: { employees, summary },
      }));
    } catch (requestError) {
      setEmployeesError(
        requestError?.message || "Unable to load account employees.",
      );
    } finally {
      setEmployeesLoading(false);
    }
  }

  function buildSelectedLobs(lobIds) {
    const selectedIdSet = new Set(
      (Array.isArray(lobIds) ? lobIds : [])
        .map((id) => String(id || ""))
        .filter(Boolean),
    );

    return employeeLobs.filter((lob) => selectedIdSet.has(String(lob.id)));
  }

  function updateEmployeeAssignmentState(accountId, sibsId, selectedLobs) {
    const nextEmployees = accountEmployees.map((item) =>
      String(item.sibsId) === sibsId
        ? withEmployeeLobs(item, selectedLobs)
        : item,
    );

    if (!nextEmployees.length) return;

    setAccountEmployees(nextEmployees);

    const assignedCount = nextEmployees.filter((item) =>
      Array.isArray(item.lobIds) ? item.lobIds.length > 0 : Boolean(item.lobId),
    ).length;
    const nextSummary = {
      ...employeeSummary,
      lobAssignedEmployees: assignedCount,
      lobUnassignedEmployees: Math.max(0, nextEmployees.length - assignedCount),
    };

    setEmployeeSummary(nextSummary);
    setEmployeeCache((current) => ({
      ...current,
      [accountId]: { employees: nextEmployees, summary: nextSummary },
    }));
  }

  async function reloadEmployeeAssignments(accountId) {
    const result = await getDepartmentAccountEmployees(accountId);
    const employees = Array.isArray(result?.employees) ? result.employees : [];
    const summary = result?.summary || {
      totalEmployees: employees.length,
      activeEmployees: employees.filter((employee) => employee.status === "active").length,
      inactiveEmployees: employees.filter((employee) => employee.status !== "active").length,
      lobAssignedEmployees: employees.filter((employee) =>
        Array.isArray(employee.lobIds) ? employee.lobIds.length > 0 : Boolean(employee.lobId),
      ).length,
      lobUnassignedEmployees: employees.filter((employee) =>
        Array.isArray(employee.lobIds) ? employee.lobIds.length === 0 : !employee.lobId,
      ).length,
    };

    setAccountEmployees(employees);
    setEmployeeSummary(summary);
    setEmployeeCache((current) => ({
      ...current,
      [accountId]: { employees, summary },
    }));
  }

  function handleAssignEmployeeLob(employee, lobIds) {
    const accountId = String(selectedEmployeeAccount?.id ?? "").trim();
    const sibsId = String(employee?.sibsId ?? "").trim();
    if (!accountId || !sibsId || !canManageLobs) return;

    const normalizedIds = [
      ...new Set(
        (Array.isArray(lobIds) ? lobIds : [])
          .map((id) => String(id || "").trim())
          .filter(Boolean),
      ),
    ];
    const selectedLobs = buildSelectedLobs(normalizedIds);

    // Update immediately so the multi-select remains open and can accept more choices.
    updateEmployeeAssignmentState(accountId, sibsId, selectedLobs);
    setAssignmentError("");
    setAssignmentSavingSibsId((current) => ({ ...current, [sibsId]: true }));

    const version = (assignmentVersionsRef.current[sibsId] || 0) + 1;
    assignmentVersionsRef.current[sibsId] = version;

    const previousQueue = assignmentQueuesRef.current[sibsId] || Promise.resolve();
    const nextQueue = previousQueue
      .catch(() => undefined)
      .then(async () => {
        const result = await assignEmployeeLob(accountId, sibsId, normalizedIds);

        if (assignmentVersionsRef.current[sibsId] !== version) return;

        const savedLobs = Array.isArray(result?.data?.lobs)
          ? result.data.lobs
          : result?.data?.lob
            ? [result.data.lob]
            : [];
        updateEmployeeAssignmentState(accountId, sibsId, savedLobs);

        const refreshed = await getAccountLobs(accountId, { includeInactive: true });
        handleLobsChanged(
          accountId,
          Array.isArray(refreshed?.lobs) ? refreshed.lobs : [],
        );
      })
      .catch(async (requestError) => {
        if (assignmentVersionsRef.current[sibsId] !== version) return;

        setAssignmentError(
          requestError?.message || "Unable to update the employee LOB assignments.",
        );

        try {
          await reloadEmployeeAssignments(accountId);
        } catch {
          // Keep the original assignment error visible if the refresh also fails.
        }
      })
      .finally(() => {
        if (assignmentVersionsRef.current[sibsId] === version) {
          setAssignmentSavingSibsId((current) => {
            const next = { ...current };
            delete next[sibsId];
            return next;
          });
        }
      });

    assignmentQueuesRef.current[sibsId] = nextQueue;
  }

  function closeEmployeesModal() {
    setSelectedEmployeeAccount(null);
    setSelectedLobFilter("");
    setEmployeesError("");
    setAssignmentError("");
    setEmployeeLobs([]);
  }

  return (
    <ModalShell
      open
      onClose={onClose}
      title={department.name}
      subtitle={department.description}
      icon={Layers3}
      badge={`${department.code} · HRIS Department`}
      maxWidth="max-w-6xl"
      className="sibs-department-details-modal"
      headerClassName="sibs-department-details-modal-header"
      bodyClassName="max-h-[72vh] overflow-y-auto"
      closeOnBackdrop={false}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-extrabold text-sibs-muted">
            <WalletCards className="h-4 w-4 text-emerald-600" />
            Account and department master data from SiBS HRIS
          </span>

          <button type="button" className="sibs-btn-primary !text-sm" onClick={onClose}>
            Close Directory
          </button>
        </div>
      }
    >
      <style>{`
        .sibs-department-details-modal .sibs-modal-title,
        .sibs-account-employees-modal .sibs-modal-title {
          font-size: 1.25rem !important;
          line-height: 1.75rem !important;
        }

        .sibs-department-details-modal .sibs-modal-subtitle,
        .sibs-account-employees-modal .sibs-modal-subtitle {
          font-size: 0.875rem !important;
          line-height: 1.25rem !important;
        }

        .sibs-department-details-modal-header span.rounded-full,
        .sibs-account-employees-modal-header span.rounded-full {
          font-size: 0.625rem !important;
          line-height: 0.875rem !important;
        }

        .sibs-employee-lob-dropdown [role="option"] span.block.truncate {
          font-size: 0.875rem !important;
          line-height: 1.25rem !important;
        }
      `}</style>

      <div className="space-y-5">
        <div className="flex flex-col gap-3 rounded-xl border border-sibs-border bg-sibs-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <DepartmentProfileAvatar
              employee={department.lead || {}}
              size="lg"
            />

            <div className="min-w-0">
              <p className="sibs-field-label !text-xs">Department Lead</p>
              <p className="truncate text-base font-extrabold text-sibs-navy">
                {department.lead?.name || "Supervisor unavailable"}
              </p>
              <p className="text-xs font-semibold text-sibs-muted">
                {department.lead?.title || "No supervisor assignment found"}
              </p>

              {department.lead?.email ? (
                <p className="mt-1 flex items-center gap-1 truncate text-[11px] font-bold text-sibs-orange">
                  <Mail className="h-3 w-3" />
                  {department.lead.email}
                </p>
              ) : null}
            </div>
          </div>

          <span
            className={`inline-flex self-start items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-extrabold sm:self-auto ${
              active
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {active ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {active ? "Active & Staffed" : "No Active Accounts"}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Active Staff", department.activeStaff, "text-sibs-navy"],
            ["Total Staff", department.totalStaff, "text-blue-700"],
            [
              "Staff Coverage",
              `${department.staffCoverage}%`,
              "text-emerald-700",
            ],
          ].map(([label, value, tone]) => (
            <div
              key={label}
              className="rounded-xl border border-sibs-border bg-white p-4 text-center"
            >
              <p className="text-[11px] font-extrabold uppercase text-sibs-muted">
                {label}
              </p>
              <p className={`mt-2 text-2xl font-extrabold ${tone}`}>{value}</p>
            </div>
          ))}
        </div>

        <section>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-base font-extrabold text-sibs-navy">
                <BriefcaseBusiness className="h-4 w-4 text-sibs-orange" />
                Accounts & Lines of Business
              </h3>
              <p className="mt-1 text-xs font-semibold text-sibs-muted">
                Each Account can have multiple manually managed LOBs. Employees in the same Account can be assigned to different LOBs.
              </p>
            </div>

            <span className="rounded-lg border border-sibs-border bg-sibs-surface px-3 py-1.5 text-[11px] font-extrabold text-sibs-secondary">
              {accounts.length} account{accounts.length === 1 ? "" : "s"}
            </span>
          </div>

          {accounts.length ? (
            <div className="mt-3 space-y-3">
              {accounts.map((account) => {
                const cachedLobs = accountLobCache[String(account.id)];
                const activeCachedLobs = Array.isArray(cachedLobs)
                  ? cachedLobs.filter((lob) => lob.isActive)
                  : null;
                const lobNames = activeCachedLobs
                  ? activeCachedLobs.map((lob) => lob.lobName).filter(Boolean)
                  : Array.isArray(account.lobNames)
                    ? account.lobNames
                    : [];

                return (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onViewEmployees={handleViewEmployees}
                    onViewLobEmployees={(selectedAccount, lobName) =>
                      handleViewEmployees(selectedAccount, lobName)
                    }
                    onManageLobs={setSelectedLobAccount}
                    canManageLobs={canManageLobs}
                    lobCount={activeCachedLobs ? activeCachedLobs.length : Number(account.lobCount) || 0}
                    lobNames={lobNames}
                  />
                );
              })}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-sibs-border p-7 text-center text-sm font-semibold text-sibs-muted">
              No accounts are linked to this department.
            </div>
          )}
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-base font-extrabold text-sibs-navy">
            <MapPin className="h-4 w-4 text-sibs-orange" />
            Site Allocation
          </h3>

          <div className="mt-3 flex flex-wrap gap-2 rounded-xl border border-sibs-border bg-sibs-surface p-4">
            {department.locations.length ? (
              department.locations.map((location) => (
                <span
                  key={location}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sibs-border bg-white px-3.5 py-2.5 text-xs font-extrabold text-sibs-secondary"
                >
                  <MapPin className="h-3.5 w-3.5 text-sibs-orange" />
                  {location}
                </span>
              ))
            ) : (
              <span className="text-sm font-semibold text-sibs-muted">
                Location information unavailable.
              </span>
            )}
          </div>
        </section>
      </div>

      <AccountEmployeesModal
        account={selectedEmployeeAccount}
        employees={accountEmployees}
        summary={employeeSummary}
        lobFilter={selectedLobFilter}
        loading={employeesLoading}
        error={employeesError}
        lobs={employeeLobs}
        lobsLoading={lobsLoading}
        canManageLobs={canManageLobs}
        assignmentSavingSibsId={assignmentSavingSibsId}
        assignmentError={assignmentError}
        onAssignLob={handleAssignEmployeeLob}
        onClose={closeEmployeesModal}
      />

      <AccountLobManagementModal
        account={selectedLobAccount}
        canManage={canManageLobs}
        onChanged={handleLobsChanged}
        onClose={() => setSelectedLobAccount(null)}
      />
    </ModalShell>
  );
}
