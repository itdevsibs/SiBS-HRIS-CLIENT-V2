import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  Calendar,
  Clock,
  CreditCard,
  Info,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";

const DEFAULT_EMPLOYEE_FORM = {
  name: "",
  email: "",
  department: "Telecom & Tech",
  role: "",
  shift: "08:00 AM - 05:00 PM",
  status: "Present",
};

const DEFAULT_DEPARTMENT_FORM = {
  name: "",
  head: "",
  budget: "",
  location: "",
  headcount: "",
};

const modalMeta = {
  employees: {
    title: "Employee Roster Ledger",
    subtitle: "Frontend directory preview with local status records",
    icon: Users,
  },
  departments: {
    title: "Active Departments Portfolio",
    subtitle: "Frontend department, headcount, budget, and location preview",
    icon: Building2,
  },
  attendance: {
    title: "Attendance Analytics",
    subtitle: "Frontend attendance and shift coverage scenario",
    icon: Clock,
  },
  interviews: {
    title: "Interviews Today",
    subtitle: "Frontend interview schedule and status preview",
    icon: Calendar,
  },
  payroll: {
    title: "Payroll Administration",
    subtitle: "Frontend payroll distribution and schedule preview",
    icon: CreditCard,
  },
  reports: {
    title: "HR Intelligence & KPI Report",
    subtitle: "Frontend-only workforce distribution and conversion indicators",
    icon: BarChart3,
  },
  "add-employee": {
    title: "Add Employee Record",
    subtitle: "Creates a temporary frontend employee record",
    icon: UserPlus,
  },
  "create-department": {
    title: "Create Department Structure",
    subtitle: "Creates a temporary frontend department record",
    icon: Building2,
  },
};

const inputClass =
  "h-10 w-full rounded-xl border border-[#D6E0EA] bg-[#F8FAFC] px-3 text-sm font-semibold text-[#101828] outline-none transition focus:border-[#FF5C28] focus:bg-white focus:ring-2 focus:ring-[#FF5C28]/10";

const labelClass =
  "mb-1.5 block text-xs font-bold text-[#667085]";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function ModalShell({ activeModal, onClose, children }) {
  const meta = modalMeta[activeModal] || modalMeta.reports;
  const Icon = meta.icon;

  const isQuickActionModal = ["add-employee", "create-department"].includes(
    activeModal,
  );
  const modalWidth = isQuickActionModal ? "max-w-3xl" : "max-w-5xl";

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
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#042C51]/80 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dashboard-modal-title"
        className={`flex max-h-[88vh] w-full ${modalWidth} flex-col overflow-hidden rounded-2xl bg-[#042C51] font-jakarta shadow-2xl`}
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
          Frontend-only demonstration data. Changes in this dialog reset after page refresh.
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
  const className =
    status === "Present" || status === "Completed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "On Leave" || status === "In Progress"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : status === "Late"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-extrabold uppercase ${className}`}>
      {status}
    </span>
  );
}

function EmployeesModal({ employees }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch =
        !query ||
        employee.id.toLowerCase().includes(query) ||
        employee.name.toLowerCase().includes(query) ||
        employee.role.toLowerCase().includes(query) ||
        employee.department.toLowerCase().includes(query);
      const matchesStatus = status === "All" || employee.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [employees, search, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employees by name, role, department, or ID..."
            className={`${inputClass} pl-9`}
          />
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className={`${inputClass} sm:w-44`}>
          <option value="All">All Statuses</option>
          <option value="Present">Present</option>
          <option value="On Leave">On Leave</option>
          <option value="Off Duty">Off Duty</option>
          <option value="Late">Late</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E6ECF2]">
        <table className="min-w-[900px] w-full border-collapse text-left text-xs">
          <thead className="bg-[#F8FAFC] text-[10px] font-bold uppercase tracking-wide text-[#667085]">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Shift</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F6]">
            {filtered.length === 0 ? (
              <EmptyTableRow colSpan={6} message="No employees match the selected filters." />
            ) : (
              filtered.map((employee) => (
                <tr key={employee.id} className="transition hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums font-bold text-[#667085]">{employee.id}</td>
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
    </div>
  );
}

function DepartmentsModal({ departments }) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const filtered = departments.filter((department) =>
    !query ||
    department.id.toLowerCase().includes(query) ||
    department.name.toLowerCase().includes(query) ||
    department.head.toLowerCase().includes(query) ||
    department.location.toLowerCase().includes(query),
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search departments, managers, IDs, or locations..."
          className={`${inputClass} pl-9`}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E6ECF2]">
        <table className="min-w-[900px] w-full border-collapse text-left text-sm">
          <thead className="bg-[#F8FAFC] text-xs font-bold uppercase tracking-wide text-[#667085]">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Department Unit</th>
              <th className="px-4 py-3">Lead Manager</th>
              <th className="px-4 py-3">Total Staff</th>
              <th className="px-4 py-3">Annual Budget</th>
              <th className="px-4 py-3">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F6]">
            {filtered.length === 0 ? (
              <EmptyTableRow colSpan={6} message="No departments match this search." />
            ) : (
              filtered.map((department) => (
                <tr key={department.id} className="transition hover:bg-slate-50/70">
                  <td className="px-4 py-3 tabular-nums font-bold text-[#667085]">{department.id}</td>
                  <td className="px-4 py-3 font-extrabold text-[#042C51]">{department.name}</td>
                  <td className="px-4 py-3 text-[#344054]">{department.head}</td>
                  <td className="px-4 py-3 font-bold text-[#042C51]">{formatNumber(department.headcount)}</td>
                  <td className="px-4 py-3 font-extrabold text-emerald-700">{department.budget}</td>
                  <td className="px-4 py-3 text-[#667085]">{department.location}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AttendanceModal({ attendance }) {
  const cards = [
    ["Present", attendance.present, "border-emerald-100 bg-emerald-50 text-emerald-700"],
    ["On Leave", attendance.onLeave, "border-amber-100 bg-amber-50 text-amber-700"],
    ["Late", attendance.late, "border-rose-100 bg-rose-50 text-rose-700"],
    ["Absent", attendance.absent, "border-slate-200 bg-slate-50 text-slate-700"],
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([label, value, className]) => (
          <div key={label} className={`rounded-xl border p-4 text-center ${className}`}>
            <span className="text-[10px] font-extrabold uppercase tracking-wide">{label}</span>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">{formatNumber(value)}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Clock className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h3 className="text-xs font-extrabold text-[#042C51]">Biometric Integration Stats</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#667085]">
              Frontend status is <span className="font-extrabold text-emerald-600">ACTIVE</span>.
              Last scenario synchronization: <span className="font-bold text-[#042C51]">{attendance.lastSync}</span>.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#E6ECF2] p-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#667085]">Shift Coverage Details</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {attendance.shifts.map((shift) => (
            <div key={shift.label} className="flex items-center justify-between gap-3 border-b border-[#EEF2F6] py-2 text-xs">
              <span className="text-[#667085]">{shift.label}</span>
              <span className="font-extrabold text-[#042C51]">{formatNumber(shift.value)} Employees</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function InterviewsModal({ interviews, onCompleteInterview, onToast }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
        This is a frontend schedule preview. Completing an interview updates only this page session.
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E6ECF2]">
        <table className="min-w-[880px] w-full border-collapse text-left text-sm">
          <thead className="bg-[#F8FAFC] text-xs font-bold uppercase tracking-wide text-[#667085]">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Interviewer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F6]">
            {interviews.map((interview) => (
              <tr key={interview.id} className="transition hover:bg-slate-50/70">
                <td className="whitespace-nowrap px-4 py-3 tabular-nums font-extrabold text-indigo-600">{interview.time}</td>
                <td className="px-4 py-3 font-extrabold text-[#042C51]">{interview.candidate}</td>
                <td className="px-4 py-3 text-[#344054]">{interview.position}</td>
                <td className="px-4 py-3 text-[#667085]">{interview.interviewer}</td>
                <td className="px-4 py-3"><StatusBadge status={interview.status} /></td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={interview.status === "Completed"}
                    onClick={() => {
                      onCompleteInterview(interview.id);
                      onToast({
                        title: "Interview Updated",
                        message: `${interview.candidate} was marked completed in frontend state.`,
                      });
                    }}
                    className="text-xs font-extrabold text-[#FF5C28] transition hover:text-[#042C51] disabled:cursor-not-allowed disabled:text-[#98A2B3]"
                  >
                    Complete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PayrollModal({ payroll, onToast }) {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-700">Monthly Disbursement</span>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#042C51]">{payroll.total}</p>
        </div>
        <div className="sm:text-right">
          <span className="block text-[10px] font-bold uppercase text-[#667085]">Status</span>
          <span className="mt-1 inline-flex rounded bg-emerald-100 px-2 py-1 text-[10px] font-extrabold uppercase text-emerald-800">
            {payroll.status}
          </span>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-extrabold text-[#042C51]">Disbursement Details per Cluster</h3>
        <div className="mt-3 overflow-hidden rounded-xl border border-[#E6ECF2] bg-[#F8FAFC]">
          {payroll.clusters.map((cluster) => (
            <div key={cluster.name} className="flex flex-col gap-1 border-b border-[#E6ECF2] px-4 py-3 text-xs last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[#667085]">{cluster.name} ({formatNumber(cluster.staff)} staff)</span>
              <span className="font-extrabold text-[#042C51]">{cluster.amount}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold leading-relaxed text-blue-900">
          Next frontend scenario run: <span className="font-extrabold">{payroll.nextRun}</span>.
        </p>
        <button
          type="button"
          onClick={() => onToast({ title: "Export Prepared", message: "Frontend payroll preview was prepared for export." })}
          className="h-9 shrink-0 rounded-lg bg-[#042C51] px-3 text-xs font-extrabold uppercase text-white transition hover:bg-[#FF5C28]"
        >
          Export Preview
        </button>
      </section>
    </div>
  );
}

function ReportsModal({ reports }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#667085]">Headcount Share per Cluster</h3>
          <div className="mt-4 space-y-3">
            {reports.distribution.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between gap-3 text-xs font-bold text-[#042C51]">
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-[#FF5C28]" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#667085]">Yield Conversion Stats</h3>
          <div className="mt-4 space-y-1">
            {reports.conversion.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 border-b border-[#E6ECF2] py-2.5 text-xs last:border-b-0">
                <span className="text-[#667085]">{item.label}</span>
                <span className={`font-extrabold ${item.tone || "text-[#042C51]"}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <BarChart3 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-indigo-600" />
        <p className="text-xs font-semibold leading-relaxed text-indigo-900">
          {reports.forecast}
        </p>
      </section>
    </div>
  );
}

function AddEmployeeModal({ departments, onCreateEmployee, onClose, onToast }) {
  const [form, setForm] = useState(DEFAULT_EMPLOYEE_FORM);

  const update = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.role.trim()) {
      onToast({ title: "Missing Information", message: "Full name, email, and role are required." });
      return;
    }

    onCreateEmployee(form);
    setForm(DEFAULT_EMPLOYEE_FORM);
    onClose();
  };

  const departmentOptions = Array.from(
    new Set([
      "Telecom & Tech",
      "Financial Services",
      "Healthcare & Insurance",
      "Retail & E-Commerce",
      "Management",
      "Core HR",
      "Talent Acquisition",
      ...departments.map((department) => department.name),
    ]),
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Full Name *</span>
          <input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="DOE, JOHN SMITH" className={inputClass} />
        </label>
        <label>
          <span className={labelClass}>Email Address *</span>
          <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="john.doe@thesiblings.com" className={inputClass} />
        </label>
        <label>
          <span className={labelClass}>Department / Cluster *</span>
          <select value={form.department} onChange={(event) => update("department", event.target.value)} className={inputClass}>
            {departmentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span className={labelClass}>Role / Designation *</span>
          <input value={form.role} onChange={(event) => update("role", event.target.value)} placeholder="Support Specialist" className={inputClass} />
        </label>
        <label>
          <span className={labelClass}>Assigned Work Shift *</span>
          <select value={form.shift} onChange={(event) => update("shift", event.target.value)} className={inputClass}>
            <option value="08:00 AM - 05:00 PM">08:00 AM - 05:00 PM</option>
            <option value="09:00 AM - 06:00 PM">09:00 AM - 06:00 PM</option>
            <option value="01:00 PM - 10:00 PM">01:00 PM - 10:00 PM</option>
            <option value="10:00 PM - 07:00 AM">10:00 PM - 07:00 AM</option>
          </select>
        </label>
        <label>
          <span className={labelClass}>Status *</span>
          <select value={form.status} onChange={(event) => update("status", event.target.value)} className={inputClass}>
            <option value="Present">Present</option>
            <option value="On Leave">On Leave</option>
            <option value="Off Duty">Off Duty</option>
            <option value="Late">Late</option>
          </select>
        </label>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-[#E6ECF2] pt-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className="h-10 rounded-lg bg-slate-100 px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-200">Cancel</button>
        <button type="submit" className="h-10 rounded-lg bg-[#FF5C28] px-4 text-xs font-extrabold text-white transition hover:bg-[#E64F21]">Create Frontend Record</button>
      </div>
    </form>
  );
}

function CreateDepartmentModal({ onCreateDepartment, onClose, onToast }) {
  const [form, setForm] = useState(DEFAULT_DEPARTMENT_FORM);
  const update = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.head.trim() || !form.budget.trim() || !form.location.trim()) {
      onToast({ title: "Missing Information", message: "Department name, manager, budget, and location are required." });
      return;
    }

    onCreateDepartment(form);
    setForm(DEFAULT_DEPARTMENT_FORM);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Department Name *</span>
          <input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Quality Assurance Unit" className={inputClass} />
        </label>
        <label>
          <span className={labelClass}>Lead Manager *</span>
          <input value={form.head} onChange={(event) => update("head", event.target.value)} placeholder="ALENA BATACAN" className={inputClass} />
        </label>
        <label>
          <span className={labelClass}>Annual Operating Budget *</span>
          <input value={form.budget} onChange={(event) => update("budget", event.target.value)} placeholder="$450,000" className={inputClass} />
        </label>
        <label>
          <span className={labelClass}>Office Location *</span>
          <input value={form.location} onChange={(event) => update("location", event.target.value)} placeholder="Building 2, Floor 3" className={inputClass} />
        </label>
        <label className="sm:col-span-2">
          <span className={labelClass}>Initial Staff Headcount</span>
          <input type="number" min="0" value={form.headcount} onChange={(event) => update("headcount", event.target.value)} placeholder="15" className={inputClass} />
        </label>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-[#E6ECF2] pt-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className="h-10 rounded-lg bg-slate-100 px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-200">Cancel</button>
        <button type="submit" className="h-10 rounded-lg bg-[#FF5C28] px-4 text-xs font-extrabold text-white transition hover:bg-[#E64F21]">Create Frontend Department</button>
      </div>
    </form>
  );
}

export function DashboardModalManager({
  activeModal,
  onClose,
  employees,
  departments,
  attendance,
  interviews,
  payroll,
  reports,
  onCreateEmployee,
  onCreateDepartment,
  onCompleteInterview,
  onToast,
}) {
  if (!activeModal) return null;

  let content = null;

  if (activeModal === "employees") {
    content = <EmployeesModal employees={employees} />;
  } else if (activeModal === "departments") {
    content = <DepartmentsModal departments={departments} />;
  } else if (activeModal === "attendance") {
    content = <AttendanceModal attendance={attendance} />;
  } else if (activeModal === "interviews") {
    content = (
      <InterviewsModal
        interviews={interviews}
        onCompleteInterview={onCompleteInterview}
        onToast={onToast}
      />
    );
  } else if (activeModal === "payroll") {
    content = <PayrollModal payroll={payroll} onToast={onToast} />;
  } else if (activeModal === "reports") {
    content = <ReportsModal reports={reports} />;
  } else if (activeModal === "add-employee") {
    content = (
      <AddEmployeeModal
        departments={departments}
        onCreateEmployee={onCreateEmployee}
        onClose={onClose}
        onToast={onToast}
      />
    );
  } else if (activeModal === "create-department") {
    content = (
      <CreateDepartmentModal
        onCreateDepartment={onCreateDepartment}
        onClose={onClose}
        onToast={onToast}
      />
    );
  }

  return (
    <ModalShell activeModal={activeModal} onClose={onClose}>
      {content}
    </ModalShell>
  );
}