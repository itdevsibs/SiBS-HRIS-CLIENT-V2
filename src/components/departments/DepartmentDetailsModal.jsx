import { useState } from "react";

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

import { ModalShell } from "@/components/ui";
import DepartmentProfileAvatar from "./DepartmentProfileAvatar";
import { getDepartmentAccountEmployees } from "@/lib/axios/departments";

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "—";

  return `${parts[0][0] || ""}${
    parts.length > 1 ? parts.at(-1)[0] : ""
  }`.toUpperCase();
}

function PersonChip({ person, fallbackTitle }) {
  const displayName = person?.name || "Assignment unavailable";
  const title = person?.title || fallbackTitle;
  const sibsId = person?.sibsId || "";

  return (
    <div className="flex min-w-0 items-start gap-2.5 rounded-lg border border-sibs-border bg-white px-3 py-2.5">
      <DepartmentProfileAvatar employee={person} size="sm" />

      <div className="min-w-0">
        <p className="break-words text-[10px] font-extrabold leading-4 text-sibs-navy">
          {displayName}
        </p>
        <p className="mt-0.5 break-words text-[8px] font-semibold leading-3.5 text-sibs-muted">
          {title}
          {sibsId ? ` · ${sibsId}` : ""}
        </p>
      </div>
    </div>
  );
}

function LeadershipGroup({ title, icon: Icon, people, emptyText }) {
  return (
    <div className="min-w-0">
      <p className="mb-2 flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
        <Icon className="h-3.5 w-3.5" />
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
        <div className="rounded-lg border border-dashed border-sibs-border bg-white px-3 py-3 text-[9px] font-semibold text-sibs-muted">
          {emptyText}
        </div>
      )}
    </div>
  );
}


function EmployeeStatusBadge({ status }) {
  const active = String(status || "").toLowerCase() === "active";
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-extrabold uppercase ${active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}>
      {active ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function AccountEmployeesModal({ account, employees, summary, loading, error, onClose }) {
  if (!account) return null;

  return (
    <ModalShell
      open
      onClose={onClose}
      title={`${account.name} Employees`}
      subtitle={`Employees assigned to ${account.name} in Kronos.`}
      icon={UsersRound}
      badge={`${summary.totalEmployees || employees.length} employees`}
      maxWidth="max-w-4xl"
      bodyClassName="max-h-[68vh] overflow-y-auto"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <span className="text-[10px] font-bold text-sibs-muted">
            {summary.activeEmployees || 0} active · {summary.inactiveEmployees || 0} inactive
          </span>
          <button type="button" className="sibs-btn-primary" onClick={onClose}>
            Close Employees
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex min-h-52 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-sibs-orange" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-xs font-semibold text-rose-700">{error}</div>
      ) : employees.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {employees.map((employee, index) => (
            <article key={`${employee.sibsId || employee.employeeId || employee.id || "employee"}-${index}`} className="flex min-w-0 items-start gap-3 rounded-xl border border-sibs-border bg-white p-3">
              <DepartmentProfileAvatar employee={employee} />
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words text-[10px] font-extrabold leading-4 text-sibs-navy">{employee.name || "Unnamed Employee"}</p>
                    <p className="mt-0.5 text-[8px] font-semibold text-sibs-muted">SIBS ID: {employee.sibsId || "—"}</p>
                  </div>
                  <EmployeeStatusBadge status={employee.status} />
                </div>
                {employee.email ? (
                  <p className="mt-2 flex min-w-0 items-center gap-1.5 text-[9px] font-semibold text-sibs-secondary">
                    <Mail className="h-3 w-3 shrink-0 text-sibs-orange" />
                    <span className="truncate">{employee.email}</span>
                  </p>
                ) : null}
                <p className="mt-1 flex items-center gap-1.5 text-[8px] font-semibold text-sibs-muted">
                  <MapPin className="h-3 w-3 shrink-0 text-sibs-faint" />
                  {employee.location || "Location unavailable"}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-sibs-border p-8 text-center text-xs font-semibold text-sibs-muted">No employees are assigned to this account.</div>
      )}
    </ModalShell>
  );
}

function AccountCard({ account, onViewEmployees }) {
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

  function openEmployees() {
    onViewEmployees?.(account);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openEmployees();
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openEmployees}
      onKeyDown={handleKeyDown}
      title={`View all employees assigned to ${account.name}`}
      className="group overflow-hidden rounded-xl border border-sibs-border bg-sibs-surface transition hover:border-sibs-orange/40 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-sibs-orange/20"
    >
      <div className="flex items-start justify-between gap-3 border-b border-sibs-border bg-white px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-extrabold text-sibs-navy">
            {account.name}
          </p>
          <p className="mt-0.5 truncate text-[9px] font-semibold text-sibs-muted">
            {account.code}
            {account.longName ? ` · ${account.longName}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-lg border border-sibs-border bg-sibs-surface px-2.5 py-1.5 text-[9px] font-extrabold text-sibs-navy transition group-hover:border-sibs-orange/40 group-hover:bg-white group-hover:text-sibs-orange"
          >
            <UsersRound className="h-3.5 w-3.5" />
            {employeeCount} employee{employeeCount === 1 ? "" : "s"}
          </span>

          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[8px] font-extrabold uppercase ${
              active
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-100 text-slate-600"
            }`}
          >
            {active ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
            {active ? "Active" : "Inactive"}
          </span>
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

export default function DepartmentDetailsModal({ department, onClose }) {
  const [selectedEmployeeAccount, setSelectedEmployeeAccount] = useState(null);
  const [accountEmployees, setAccountEmployees] = useState([]);
  const [employeeSummary, setEmployeeSummary] = useState({ totalEmployees: 0, activeEmployees: 0, inactiveEmployees: 0 });
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState("");
  const [employeeCache, setEmployeeCache] = useState({});

  if (!department) return null;

  const active = department.status === "active";
  const accounts = Array.isArray(department.accounts) ? department.accounts : [];

  async function handleViewEmployees(account) {
    const accountId = String(account?.id ?? "").trim();
    if (!accountId) return;

    setSelectedEmployeeAccount(account);
    setEmployeesError("");

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
      inactiveEmployees: Math.max(0, (Number(account.employeeCount) || 0) - (Number(account.activeEmployeeCount) || 0)),
    });
    setEmployeesLoading(true);

    try {
      const result = await getDepartmentAccountEmployees(accountId);
      const employees = Array.isArray(result?.employees) ? result.employees : [];
      const summary = result?.summary || {
        totalEmployees: employees.length,
        activeEmployees: employees.filter((employee) => employee.status === "active").length,
        inactiveEmployees: employees.filter((employee) => employee.status !== "active").length,
      };
      setAccountEmployees(employees);
      setEmployeeSummary(summary);
      setEmployeeCache((current) => ({ ...current, [accountId]: { employees, summary } }));
    } catch (requestError) {
      setEmployeesError(requestError?.message || "Unable to load account employees.");
    } finally {
      setEmployeesLoading(false);
    }
  }

  function closeEmployeesModal() {
    setSelectedEmployeeAccount(null);
    setEmployeesError("");
  }

  return (
    <ModalShell
      open
      onClose={onClose}
      title={department.name}
      subtitle={department.description}
      icon={Layers3}
      badge={`${department.code} · Kronos Department`}
      maxWidth="max-w-6xl"
      bodyClassName="max-h-[72vh] overflow-y-auto"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-[10px] font-extrabold text-sibs-muted">
            <WalletCards className="h-4 w-4 text-emerald-600" />
            Budget data unavailable in Kronos
          </span>

          <button
            type="button"
            className="sibs-btn-primary"
            onClick={onClose}
          >
            Close Directory
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-3 rounded-xl border border-sibs-border bg-sibs-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <DepartmentProfileAvatar
              employee={department.lead || {}}
              size="lg"
            />

            <div className="min-w-0">
              <p className="sibs-field-label">Department Lead</p>
              <p className="truncate text-sm font-extrabold text-sibs-navy">
                {department.lead?.name || "Supervisor unavailable"}
              </p>
              <p className="text-[10px] font-semibold text-sibs-muted">
                {department.lead?.title || "No supervisor assignment found"}
              </p>

              {department.lead?.email ? (
                <p className="mt-1 flex items-center gap-1 truncate text-[9px] font-bold text-sibs-orange">
                  <Mail className="h-3 w-3" />
                  {department.lead.email}
                </p>
              ) : null}
            </div>
          </div>

          <span
            className={`inline-flex self-start items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold sm:self-auto ${
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
            ["Staff Coverage", `${department.staffCoverage}%`, "text-emerald-700"],
          ].map(([label, value, tone]) => (
            <div
              key={label}
              className="rounded-xl border border-sibs-border bg-white p-4 text-center"
            >
              <p className="text-[9px] font-extrabold uppercase text-sibs-muted">
                {label}
              </p>
              <p className={`mt-2 text-xl font-extrabold ${tone}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        <section>
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-sibs-navy">
              <BriefcaseBusiness className="h-4 w-4 text-sibs-orange" />
              Accounts
            </h3>

            <span className="rounded-lg border border-sibs-border bg-sibs-surface px-2.5 py-1 text-[9px] font-extrabold text-sibs-secondary">
              {accounts.length} account{accounts.length === 1 ? "" : "s"}
            </span>
          </div>

          {accounts.length ? (
            <div className="mt-3 space-y-3">
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onViewEmployees={handleViewEmployees}
                />
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-sibs-border p-7 text-center text-xs font-semibold text-sibs-muted">
              No accounts are linked to this department.
            </div>
          )}
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-sibs-navy">
            <MapPin className="h-4 w-4 text-sibs-orange" />
            Site Allocation
          </h3>

          <div className="mt-3 flex flex-wrap gap-2 rounded-xl border border-sibs-border bg-sibs-surface p-4">
            {department.locations.length ? (
              department.locations.map((location) => (
                <span
                  key={location}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sibs-border bg-white px-3 py-2 text-[10px] font-extrabold text-sibs-secondary"
                >
                  <MapPin className="h-3.5 w-3.5 text-sibs-orange" />
                  {location}
                </span>
              ))
            ) : (
              <span className="text-xs font-semibold text-sibs-muted">
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
        loading={employeesLoading}
        error={employeesError}
        onClose={closeEmployeesModal}
      />
    </ModalShell>
  );
}
