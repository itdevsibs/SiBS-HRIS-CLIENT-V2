import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  Clock,
  CreditCard,
  LoaderCircle,
  Search,
  Users,
} from "lucide-react";
import { ModalShell } from "@/components/ui";

const modalMeta = {
  employees: {
    title: "Active Employee Directory",
    subtitle: "Live employee, department, schedule, and attendance status records",
    icon: Users,
  },
  departments: {
    title: "Active Departments",
    subtitle: "Live department headcount based on active employee records",
    icon: Building2,
  },
  attendance: {
    title: "Attendance Analytics",
    subtitle: "Today’s live schedule, attendance, leave, late, and absence totals",
    icon: Clock,
  },
  interviews: {
    title: "Interviews Today",
    subtitle: "Read-only interview schedule from the candidate pipeline",
    icon: Calendar,
  },
  payroll: {
    title: "Payroll-Eligible Employees",
    subtitle: "Active employees currently counted as payroll eligible",
    icon: CreditCard,
  },
};

const inputClass =
  "h-8.5 2xl:h-10 w-full rounded-xl border border-sibs-border-subtle bg-sibs-surface px-3 2xl:px-3.5 font-jakarta sibs-text-xs font-semibold text-sibs-navy outline-none transition placeholder:text-sibs-faint hover:border-sibs-orange/40 hover:bg-white focus:border-sibs-orange focus:bg-white focus:ring-4 focus:ring-sibs-orange/10";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function formatUpdatedAt(value) {
  if (!value) return "Live HRIS data";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Live HRIS data";

  return `Last updated ${date.toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  })}`;
}

function EmptyTableRow({ colSpan, message }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center sibs-text-sm font-semibold text-sibs-muted">
        {message}
      </td>
    </tr>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();
  const className =
    normalized === "present" || normalized === "completed" || normalized === "eligible"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "on leave" || normalized === "in progress" || normalized === "scheduled"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : normalized === "late" || normalized === "absent"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-extrabold uppercase ${className}`}>
      {status || "Unknown"}
    </span>
  );
}

function SearchBox({ onSearch }) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onSearch?.(search);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search, onSearch]);

  return (
    <div className="relative">
      <label htmlFor="admin-modal-search" className="sibs-field-label sr-only">
        Search live records
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-muted" />
      <input
        id="admin-modal-search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search live records..."
        aria-label="Search live records"
        className={`${inputClass} pl-9`}
      />
    </div>
  );
}

function PaginationControls({ pagination, onPageChange, disabled }) {
  const currentPage = Number(pagination?.currentPage || pagination?.page || 1);
  const totalPages = Number(pagination?.totalPages || 1);
  const total = Number(pagination?.total || 0);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-sibs-border bg-sibs-surface px-3.5 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between font-jakarta">
      <span className="font-jakarta sibs-text-xs font-semibold text-sibs-muted">
        {formatNumber(total)} total record{total === 1 ? "" : "s"}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || currentPage <= 1}
          onClick={() => onPageChange?.(currentPage - 1)}
          className="sibs-btn-secondary !h-8 2xl:!h-8.5 !px-3 sibs-text-xs disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span className="min-w-20 text-center font-jakarta sibs-text-xs font-bold text-sibs-navy">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          disabled={disabled || currentPage >= totalPages}
          onClick={() => onPageChange?.(currentPage + 1)}
          className="sibs-btn-secondary !h-8 2xl:!h-8.5 !px-3 sibs-text-xs disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center text-center font-jakarta">
      <LoaderCircle className="h-8 w-8 animate-spin text-sibs-orange" />
      <p className="mt-3 text-sm font-extrabold text-sibs-navy">Loading live HRIS records...</p>
    </div>
  );
}

function ErrorState({ error }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-8 text-center font-jakarta">
      <p className="text-sm font-extrabold text-rose-700">Unable to load this dashboard detail.</p>
      <p className="mt-1 sibs-text-xs font-semibold text-rose-600">{error || "Please close the modal and try again."}</p>
    </div>
  );
}

function EmployeesModal({ rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-sibs-border font-jakarta">
      <table className="min-w-[900px] w-full border-collapse text-left">
        <thead className="bg-sibs-surface text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
          <tr>
            <th className="px-3.5 py-2.5 2xl:px-4 2xl:py-3">SIBS ID</th>
            <th className="px-3.5 py-2.5 2xl:px-4 2xl:py-3">Name</th>
            <th className="px-3.5 py-2.5 2xl:px-4 2xl:py-3">Department</th>
            <th className="px-3.5 py-2.5 2xl:px-4 2xl:py-3">Account / Role</th>
            <th className="px-3.5 py-2.5 2xl:px-4 2xl:py-3">Shift</th>
            <th className="px-3.5 py-2.5 2xl:px-4 2xl:py-3">Today</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sibs-border">
          {rows.length === 0 ? (
            <EmptyTableRow colSpan={6} message="No active employees match the search." />
          ) : (
            rows.map((employee) => (
              <tr key={employee.id || employee.sibsId} className="transition hover:bg-sibs-cream-subtle/50">
                <td className="whitespace-nowrap px-3.5 py-2.5 2xl:px-4 2xl:py-3 tabular-nums font-bold text-sibs-muted sibs-text-xs">{employee.sibsId || employee.id}</td>
                <td className="px-3.5 py-2.5 2xl:px-4 2xl:py-3 font-extrabold text-sibs-navy sibs-text-xs">{employee.name}</td>
                <td className="px-3.5 py-2.5 2xl:px-4 2xl:py-3 text-sibs-text-secondary sibs-text-xs">{employee.department}</td>
                <td className="px-3.5 py-2.5 2xl:px-4 2xl:py-3 text-sibs-muted sibs-text-xs">{employee.role}</td>
                <td className="whitespace-nowrap px-3.5 py-2.5 2xl:px-4 2xl:py-3 text-sibs-muted sibs-text-xs">{employee.shift}</td>
                <td className="px-3.5 py-2.5 2xl:px-4 2xl:py-3"><StatusBadge status={employee.status} /></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function DepartmentsModal({ rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-sibs-border font-jakarta">
      <table className="min-w-[720px] w-full border-collapse text-left">
        <thead className="bg-sibs-surface text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
          <tr>
            <th className="px-3.5 py-2.5 2xl:px-4 2xl:py-3">Department ID</th>
            <th className="px-3.5 py-2.5 2xl:px-4 2xl:py-3">Department</th>
            <th className="px-3.5 py-2.5 2xl:px-4 2xl:py-3">Active Headcount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sibs-border">
          {rows.length === 0 ? (
            <EmptyTableRow colSpan={3} message="No active departments match the search." />
          ) : (
            rows.map((department) => (
              <tr key={department.id} className="transition hover:bg-sibs-cream-subtle/50">
                <td className="px-3.5 py-2.5 2xl:px-4 2xl:py-3 tabular-nums font-bold text-sibs-muted sibs-text-xs">{department.id}</td>
                <td className="px-3.5 py-2.5 2xl:px-4 2xl:py-3 font-extrabold text-sibs-navy sibs-text-xs">{department.name}</td>
                <td className="px-3.5 py-2.5 2xl:px-4 2xl:py-3 font-extrabold text-sibs-navy sibs-text-xs">{formatNumber(department.headcount)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function AttendanceModal({ attendance }) {
  const cards = [
    ["Scheduled", attendance?.scheduled, "border-blue-100 bg-blue-50 text-blue-700"],
    ["Present", attendance?.present, "border-emerald-100 bg-emerald-50 text-emerald-700"],
    ["On Leave", attendance?.onLeave, "border-amber-100 bg-amber-50 text-amber-700"],
    ["Late", attendance?.late, "border-rose-100 bg-rose-50 text-rose-700"],
    ["Absent", attendance?.absent, "border-slate-200 bg-slate-50 text-slate-700"],
  ];

  return (
    <div className="space-y-6 font-jakarta">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map(([label, value, className]) => (
          <div key={label} className={`rounded-xl border p-4 text-center ${className}`}>
            <span className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide">{label}</span>
            <p className="mt-1 font-heading text-2xl 2xl:text-3xl font-bold tabular-nums">{formatNumber(value)}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-sibs-border p-4">
        <h3 className="sibs-modal-section-title font-heading text-sm 2xl:text-base font-bold tracking-tight text-sibs-navy">Shift Coverage Details</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(attendance?.shifts || []).length === 0 ? (
            <p className="sibs-text-xs font-semibold text-sibs-muted">No shift attendance has been recorded today.</p>
          ) : (
            attendance.shifts.map((shift) => (
              <div key={shift.label} className="flex items-center justify-between gap-3 border-b border-sibs-border py-2 sibs-text-xs">
                <span className="text-sibs-muted">{shift.label}</span>
                <span className="font-heading font-bold text-sibs-navy">{formatNumber(shift.value)} Employees</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function InterviewsModal({ rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-sibs-border font-jakarta">
      <table className="min-w-[880px] w-full border-collapse text-left">
        <thead className="bg-sibs-surface text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
          <tr>
            <th className="px-3.5 py-2.5 2xl:px-4 2xl:py-3">Time</th>
            <th className="px-3.5 py-2.5 2xl:px-4 2xl:py-3">Candidate</th>
            <th className="px-3.5 py-2.5 2xl:px-4 2xl:py-3">Position</th>
            <th className="px-3.5 py-2.5 2xl:px-4 2xl:py-3">Account</th>
            <th className="px-3.5 py-2.5 2xl:px-4 2xl:py-3">Type</th>
            <th className="px-3.5 py-2.5 2xl:px-4 2xl:py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sibs-border">
          {rows.length === 0 ? (
            <EmptyTableRow colSpan={6} message="No interviews are scheduled today." />
          ) : (
            rows.map((interview) => (
              <tr key={interview.id} className="transition hover:bg-sibs-cream-subtle/50">
                <td className="whitespace-nowrap px-3.5 py-2.5 2xl:px-4 2xl:py-3 tabular-nums font-extrabold text-indigo-600 sibs-text-xs">{interview.time}</td>
                <td className="px-3.5 py-2.5 2xl:px-4 2xl:py-3 font-extrabold text-sibs-navy sibs-text-xs">{interview.candidate}</td>
                <td className="px-3.5 py-2.5 2xl:px-4 2xl:py-3 text-sibs-text-secondary sibs-text-xs">{interview.position}</td>
                <td className="px-3.5 py-2.5 2xl:px-4 2xl:py-3 text-sibs-muted sibs-text-xs">{interview.account || "—"}</td>
                <td className="px-3.5 py-2.5 2xl:px-4 2xl:py-3 text-sibs-muted sibs-text-xs">{interview.type}</td>
                <td className="px-3.5 py-2.5 2xl:px-4 2xl:py-3"><StatusBadge status={interview.status} /></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function PayrollModal({ rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-sibs-border font-jakarta">
      <table className="min-w-[760px] w-full border-collapse text-left">
        <thead className="bg-sibs-surface text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
          <tr>
            <th className="px-3.5 py-2.5 2xl:px-4 2xl:py-3">SIBS ID</th>
            <th className="px-3.5 py-2.5 2xl:px-4 2xl:py-3">Employee</th>
            <th className="px-3.5 py-2.5 2xl:px-4 2xl:py-3">Department</th>
            <th className="px-3.5 py-2.5 2xl:px-4 2xl:py-3">Account</th>
            <th className="px-3.5 py-2.5 2xl:px-4 2xl:py-3">Eligibility</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sibs-border">
          {rows.length === 0 ? (
            <EmptyTableRow colSpan={5} message="No payroll-eligible employees match the search." />
          ) : (
            rows.map((employee) => (
              <tr key={employee.id || employee.sibsId} className="transition hover:bg-sibs-cream-subtle/50">
                <td className="px-3.5 py-2.5 2xl:px-4 2xl:py-3 tabular-nums font-bold text-sibs-muted sibs-text-xs">{employee.sibsId || employee.id}</td>
                <td className="px-3.5 py-2.5 2xl:px-4 2xl:py-3 font-extrabold text-sibs-navy sibs-text-xs">{employee.name}</td>
                <td className="px-3.5 py-2.5 2xl:px-4 2xl:py-3 text-sibs-text-secondary sibs-text-xs">{employee.department}</td>
                <td className="px-3.5 py-2.5 2xl:px-4 2xl:py-3 text-sibs-muted sibs-text-xs">{employee.account}</td>
                <td className="px-3.5 py-2.5 2xl:px-4 2xl:py-3"><StatusBadge status="Eligible" /></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardModalManager({
  activeModal,
  onClose,
  detail,
  loading,
  error,
  onSearch,
  onPageChange,
  generatedAt,
}) {
  const rows = useMemo(
    () => (Array.isArray(detail?.data) ? detail.data : []),
    [detail],
  );
  const isPaged = activeModal !== "attendance";

  if (!activeModal) return null;

  const meta = modalMeta[activeModal] || modalMeta.employees;

  let content = null;

  if (loading && !detail) {
    content = <LoadingState />;
  } else if (error && !detail) {
    content = <ErrorState error={error} />;
  } else if (activeModal === "attendance") {
    content = <AttendanceModal attendance={detail?.data || {}} />;
  } else {
    const table =
      activeModal === "employees" ? (
        <EmployeesModal rows={rows} />
      ) : activeModal === "departments" ? (
        <DepartmentsModal rows={rows} />
      ) : activeModal === "interviews" ? (
        <InterviewsModal rows={rows} />
      ) : (
        <PayrollModal rows={rows} />
      );

    content = (
      <div className="space-y-4">
        <SearchBox key={activeModal} onSearch={onSearch} />
        {loading ? (
          <div className="flex items-center gap-2 sibs-text-xs font-bold text-sibs-muted">
            <LoaderCircle className="h-4 w-4 animate-spin text-sibs-orange" />
            Updating records...
          </div>
        ) : null}
        {error ? <ErrorState error={error} /> : null}
        {table}
        <PaginationControls
          pagination={detail?.pagination}
          onPageChange={onPageChange}
          disabled={loading}
        />
      </div>
    );
  }

  return (
    <ModalShell
      open={Boolean(activeModal)}
      onClose={onClose}
      title={meta.title}
      subtitle={meta.subtitle}
      icon={meta.icon}
      maxWidth="max-w-5xl 2xl:max-w-6xl"
      variant="navy"
      footer={
        <span className="font-jakarta text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
          Read-only dashboard records. {formatUpdatedAt(generatedAt)}.
        </span>
      }
      footerClassName="!justify-start"
    >
      {isPaged || activeModal === "attendance" ? content : null}
    </ModalShell>
  );
}
