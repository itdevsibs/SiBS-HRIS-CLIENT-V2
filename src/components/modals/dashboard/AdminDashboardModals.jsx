import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  Clock,
  CreditCard,
  LoaderCircle,
  Search,
  Users,
  X,
} from "lucide-react";

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
  "h-10 w-full rounded-xl border border-[#D6E0EA] bg-[#F8FAFC] px-3 text-sm font-semibold text-[#101828] outline-none transition focus:border-[#FF5C28] focus:bg-white focus:ring-2 focus:ring-[#FF5C28]/10";

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

function ModalShell({ activeModal, onClose, generatedAt, children }) {
  const meta = modalMeta[activeModal] || modalMeta.employees;
  const Icon = meta.icon;

  useEffect(() => {
    if (!activeModal) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeModal, onClose]);

  if (!activeModal) return null;

  return (
    <div
      className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[1100] flex items-center justify-center p-2 font-jakarta sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dashboard-modal-title"
        className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#042C51] font-jakarta shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 bg-[#042C51] px-4 py-3.5 text-white sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28]">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <h2 id="admin-dashboard-modal-title" className="truncate text-base font-extrabold">
                {meta.title}
              </h2>
              <p className="mt-0.5 truncate text-xs text-slate-300">
                {meta.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white p-4 text-[#101828] sm:p-6">
          {children}
        </div>

        <footer className="shrink-0 border-t border-[#E6ECF2] bg-[#F8FAFC] px-4 py-2.5 text-[10px] font-semibold text-[#667085] sm:px-6">
          Read-only dashboard records. {formatUpdatedAt(generatedAt)}.
        </footer>
      </section>
    </div>
  );
}

function EmptyTableRow({ colSpan, message }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm font-semibold text-[#667085]">
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
      onSearch(search);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search, onSearch]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search live records..."
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
    <div className="flex flex-col gap-2 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between">
      <span className="font-semibold text-[#667085]">
        {formatNumber(total)} total record{total === 1 ? "" : "s"}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-8 rounded-lg border border-[#D6E0EA] bg-white px-3 font-extrabold text-[#042C51] transition hover:border-[#FF5C28] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span className="min-w-20 text-center font-bold text-[#042C51]">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          disabled={disabled || currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-8 rounded-lg border border-[#D6E0EA] bg-white px-3 font-extrabold text-[#042C51] transition hover:border-[#FF5C28] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center text-center">
      <LoaderCircle className="h-8 w-8 animate-spin text-[#FF5C28]" />
      <p className="mt-3 text-sm font-extrabold text-[#042C51]">Loading live HRIS records...</p>
    </div>
  );
}

function ErrorState({ error }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-8 text-center">
      <p className="text-sm font-extrabold text-rose-700">Unable to load this dashboard detail.</p>
      <p className="mt-1 text-xs text-rose-600">{error || "Please close the modal and try again."}</p>
    </div>
  );
}

function EmployeesModal({ rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#E6ECF2]">
      <table className="min-w-[900px] w-full border-collapse text-left text-xs">
        <thead className="bg-[#F8FAFC] text-[10px] font-bold uppercase tracking-wide text-[#667085]">
          <tr>
            <th className="px-4 py-3">SIBS ID</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Account / Role</th>
            <th className="px-4 py-3">Shift</th>
            <th className="px-4 py-3">Today</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF2F6]">
          {rows.length === 0 ? (
            <EmptyTableRow colSpan={6} message="No active employees match the search." />
          ) : (
            rows.map((employee) => (
              <tr key={employee.id || employee.sibsId} className="transition hover:bg-slate-50/70">
                <td className="whitespace-nowrap px-4 py-3 tabular-nums font-bold text-[#667085]">{employee.sibsId || employee.id}</td>
                <td className="px-4 py-3 font-extrabold text-[#042C51]">{employee.name}</td>
                <td className="px-4 py-3 text-[#344054]">{employee.department}</td>
                <td className="px-4 py-3 text-[#667085]">{employee.role}</td>
                <td className="whitespace-nowrap px-4 py-3 text-[#667085]">{employee.shift}</td>
                <td className="px-4 py-3"><StatusBadge status={employee.status} /></td>
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
    <div className="overflow-x-auto rounded-xl border border-[#E6ECF2]">
      <table className="min-w-[720px] w-full border-collapse text-left text-sm">
        <thead className="bg-[#F8FAFC] text-xs font-bold uppercase tracking-wide text-[#667085]">
          <tr>
            <th className="px-4 py-3">Department ID</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Active Headcount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF2F6]">
          {rows.length === 0 ? (
            <EmptyTableRow colSpan={3} message="No active departments match the search." />
          ) : (
            rows.map((department) => (
              <tr key={department.id} className="transition hover:bg-slate-50/70">
                <td className="px-4 py-3 tabular-nums font-bold text-[#667085]">{department.id}</td>
                <td className="px-4 py-3 font-extrabold text-[#042C51]">{department.name}</td>
                <td className="px-4 py-3 font-extrabold text-[#042C51]">{formatNumber(department.headcount)}</td>
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
    ["Scheduled", attendance.scheduled, "border-blue-100 bg-blue-50 text-blue-700"],
    ["Present", attendance.present, "border-emerald-100 bg-emerald-50 text-emerald-700"],
    ["On Leave", attendance.onLeave, "border-amber-100 bg-amber-50 text-amber-700"],
    ["Late", attendance.late, "border-rose-100 bg-rose-50 text-rose-700"],
    ["Absent", attendance.absent, "border-slate-200 bg-slate-50 text-slate-700"],
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map(([label, value, className]) => (
          <div key={label} className={`rounded-xl border p-4 text-center ${className}`}>
            <span className="text-[10px] font-extrabold uppercase tracking-wide">{label}</span>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">{formatNumber(value)}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-[#E6ECF2] p-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#667085]">Shift Coverage Details</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(attendance.shifts || []).length === 0 ? (
            <p className="text-xs font-semibold text-[#667085]">No shift attendance has been recorded today.</p>
          ) : (
            attendance.shifts.map((shift) => (
              <div key={shift.label} className="flex items-center justify-between gap-3 border-b border-[#EEF2F6] py-2 text-xs">
                <span className="text-[#667085]">{shift.label}</span>
                <span className="font-extrabold text-[#042C51]">{formatNumber(shift.value)} Employees</span>
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
    <div className="overflow-x-auto rounded-xl border border-[#E6ECF2]">
      <table className="min-w-[880px] w-full border-collapse text-left text-sm">
        <thead className="bg-[#F8FAFC] text-xs font-bold uppercase tracking-wide text-[#667085]">
          <tr>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Candidate</th>
            <th className="px-4 py-3">Position</th>
            <th className="px-4 py-3">Account</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF2F6]">
          {rows.length === 0 ? (
            <EmptyTableRow colSpan={6} message="No interviews are scheduled today." />
          ) : (
            rows.map((interview) => (
              <tr key={interview.id} className="transition hover:bg-slate-50/70">
                <td className="whitespace-nowrap px-4 py-3 tabular-nums font-extrabold text-indigo-600">{interview.time}</td>
                <td className="px-4 py-3 font-extrabold text-[#042C51]">{interview.candidate}</td>
                <td className="px-4 py-3 text-[#344054]">{interview.position}</td>
                <td className="px-4 py-3 text-[#667085]">{interview.account || "—"}</td>
                <td className="px-4 py-3 text-[#667085]">{interview.type}</td>
                <td className="px-4 py-3"><StatusBadge status={interview.status} /></td>
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
    <div className="overflow-x-auto rounded-xl border border-[#E6ECF2]">
      <table className="min-w-[760px] w-full border-collapse text-left text-sm">
        <thead className="bg-[#F8FAFC] text-xs font-bold uppercase tracking-wide text-[#667085]">
          <tr>
            <th className="px-4 py-3">SIBS ID</th>
            <th className="px-4 py-3">Employee</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Account</th>
            <th className="px-4 py-3">Eligibility</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF2F6]">
          {rows.length === 0 ? (
            <EmptyTableRow colSpan={5} message="No payroll-eligible employees match the search." />
          ) : (
            rows.map((employee) => (
              <tr key={employee.id || employee.sibsId} className="transition hover:bg-slate-50/70">
                <td className="px-4 py-3 tabular-nums font-bold text-[#667085]">{employee.sibsId || employee.id}</td>
                <td className="px-4 py-3 font-extrabold text-[#042C51]">{employee.name}</td>
                <td className="px-4 py-3 text-[#344054]">{employee.department}</td>
                <td className="px-4 py-3 text-[#667085]">{employee.account}</td>
                <td className="px-4 py-3"><StatusBadge status="Eligible" /></td>
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
          <div className="flex items-center gap-2 text-xs font-bold text-[#667085]">
            <LoaderCircle className="h-4 w-4 animate-spin text-[#FF5C28]" />
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
    <ModalShell activeModal={activeModal} onClose={onClose} generatedAt={generatedAt}>
      {isPaged || activeModal === "attendance" ? content : null}
    </ModalShell>
  );
}
