import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  Clock,
  CreditCard,
  LoaderCircle,
  Users,
} from "lucide-react";
import {
  DataCard,
  ModalShell,
  ResponsiveTableShell,
  SearchInput,
  StatusBadge,
  TablePagination,
} from "@/components/ui";

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

function SearchBox({ onSearch }) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onSearch?.(search);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search, onSearch]);

  return (
    <SearchInput
      value={search}
      onChange={setSearch}
      placeholder="Search live records..."
      ariaLabel="Search live records"
      inputClassName="h-8.5 2xl:h-10"
    />
  );
}

function MobileRecordCard({ title, kicker, badge, fields, index }) {
  return (
    <DataCard index={index}>
      <DataCard.Header
        kicker={kicker}
        title={title}
        badge={badge ? <StatusBadge status={badge} /> : null}
      />
      <DataCard.Section label="Record details" contentClassName="grid grid-cols-2 gap-x-3 gap-y-2">
        {fields.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <p className="m-0 sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-muted">
              {label}
            </p>
            <p className="m-0 mt-0.5 break-words sibs-text-xs font-bold text-sibs-navy">
              {value || "—"}
            </p>
          </div>
        ))}
      </DataCard.Section>
    </DataCard>
  );
}

const emptyMobileMessages = {
  employees: ["No active employees match the search.", "Search for an employee or adjust the search terms."],
  departments: ["No active departments match the search.", "Search for a department or adjust the search terms."],
  interviews: ["No interviews are scheduled today.", "Scheduled interviews will appear here."],
  payroll: ["No payroll-eligible employees match the search.", "Search for an employee or adjust the search terms."],
};

function getMobileRecordDetails(modalId, record) {
  if (modalId === "employees") {
    return {
      title: record.name || "Employee",
      kicker: `SIBS ID · ${record.sibsId || record.id || "—"}`,
      badge: record.status || "Unknown",
      fields: [
        ["Department", record.department],
        ["Account / Role", record.role],
        ["Shift", record.shift],
      ],
    };
  }

  if (modalId === "departments") {
    return {
      title: record.name || "Department",
      kicker: `Department ID · ${record.id || "—"}`,
      fields: [["Active headcount", formatNumber(record.headcount)]],
    };
  }

  if (modalId === "interviews") {
    return {
      title: record.candidate || "Candidate",
      kicker: record.time || "Interview",
      badge: record.status || "Unknown",
      fields: [
        ["Position", record.position],
        ["Account", record.account],
        ["Type", record.type],
      ],
    };
  }

  return {
    title: record.name || "Employee",
    kicker: `SIBS ID · ${record.sibsId || record.id || "—"}`,
    badge: "Eligible",
    fields: [
      ["Department", record.department],
      ["Account", record.account],
    ],
  };
}

function MobileRecordCards({ modalId, rows }) {
  if (rows.length === 0) {
    const [title, description] = emptyMobileMessages[modalId] || emptyMobileMessages.employees;
    return <DataCard.Empty title={title} description={description} />;
  }

  return (
    <div className="space-y-3 p-3">
      {rows.map((record, index) => (
        <MobileRecordCard
          key={record.id || record.sibsId || record.name || record.candidate || index}
          index={index}
          {...getMobileRecordDetails(modalId, record)}
        />
      ))}
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
    <div className="sibs-data-table-shell font-jakarta !overflow-x-auto">
      <table className="min-w-[900px] w-full border-collapse text-left">
        <thead className="sibs-data-table-head">
          <tr className="sibs-data-table-head-row">
            <th className="sibs-data-table-th !px-3.5 !py-2.5 2xl:!px-4 2xl:!py-3">SIBS ID</th>
            <th className="sibs-data-table-th !px-3.5 !py-2.5 2xl:!px-4 2xl:!py-3">Name</th>
            <th className="sibs-data-table-th !px-3.5 !py-2.5 2xl:!px-4 2xl:!py-3">Department</th>
            <th className="sibs-data-table-th !px-3.5 !py-2.5 2xl:!px-4 2xl:!py-3">Account / Role</th>
            <th className="sibs-data-table-th !px-3.5 !py-2.5 2xl:!px-4 2xl:!py-3">Shift</th>
            <th className="sibs-data-table-th !px-3.5 !py-2.5 2xl:!px-4 2xl:!py-3">Today</th>
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
    <div className="sibs-data-table-shell font-jakarta !overflow-x-auto">
      <table className="min-w-[720px] w-full border-collapse text-left">
        <thead className="sibs-data-table-head">
          <tr className="sibs-data-table-head-row">
            <th className="sibs-data-table-th !px-3.5 !py-2.5 2xl:!px-4 2xl:!py-3">Department ID</th>
            <th className="sibs-data-table-th !px-3.5 !py-2.5 2xl:!px-4 2xl:!py-3">Department</th>
            <th className="sibs-data-table-th !px-3.5 !py-2.5 2xl:!px-4 2xl:!py-3">Active Headcount</th>
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
        <h3 className="sibs-modal-section-title">Shift Coverage Details</h3>
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
    <div className="sibs-data-table-shell font-jakarta !overflow-x-auto">
      <table className="min-w-[880px] w-full border-collapse text-left">
        <thead className="sibs-data-table-head">
          <tr className="sibs-data-table-head-row">
            <th className="sibs-data-table-th !px-3.5 !py-2.5 2xl:!px-4 2xl:!py-3">Time</th>
            <th className="sibs-data-table-th !px-3.5 !py-2.5 2xl:!px-4 2xl:!py-3">Candidate</th>
            <th className="sibs-data-table-th !px-3.5 !py-2.5 2xl:!px-4 2xl:!py-3">Position</th>
            <th className="sibs-data-table-th !px-3.5 !py-2.5 2xl:!px-4 2xl:!py-3">Account</th>
            <th className="sibs-data-table-th !px-3.5 !py-2.5 2xl:!px-4 2xl:!py-3">Type</th>
            <th className="sibs-data-table-th !px-3.5 !py-2.5 2xl:!px-4 2xl:!py-3">Status</th>
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
    <div className="sibs-data-table-shell font-jakarta !overflow-x-auto">
      <table className="min-w-[760px] w-full border-collapse text-left">
        <thead className="sibs-data-table-head">
          <tr className="sibs-data-table-head-row">
            <th className="sibs-data-table-th !px-3.5 !py-2.5 2xl:!px-4 2xl:!py-3">SIBS ID</th>
            <th className="sibs-data-table-th !px-3.5 !py-2.5 2xl:!px-4 2xl:!py-3">Employee</th>
            <th className="sibs-data-table-th !px-3.5 !py-2.5 2xl:!px-4 2xl:!py-3">Department</th>
            <th className="sibs-data-table-th !px-3.5 !py-2.5 2xl:!px-4 2xl:!py-3">Account</th>
            <th className="sibs-data-table-th !px-3.5 !py-2.5 2xl:!px-4 2xl:!py-3">Eligibility</th>
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
  const pagination = detail?.pagination || {};
  const totalRecords =
    pagination.total ?? pagination.totalRecords ?? pagination.totalItems ?? 0;
  const pageSize =
    pagination.limit ?? pagination.pageSize ?? pagination.perPage ?? 15;
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
    const responsiveTable = (
      <ResponsiveTableShell
        desktopContent={table}
        mobileContent={<MobileRecordCards modalId={activeModal} rows={rows} />}
      />
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
        {responsiveTable}
        <TablePagination
          currentPage={pagination.currentPage ?? pagination.page ?? 1}
          totalPages={pagination.totalPages ?? 1}
          totalRecords={totalRecords}
          limit={pageSize}
          loadedCount={rows.length}
          recordLabel="records"
          onPageChange={onPageChange}
          loading={loading}
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
      footerMeta={
        <span className="font-jakarta text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
          Read-only dashboard records. {formatUpdatedAt(generatedAt)}.
        </span>
      }
    >
      {isPaged || activeModal === "attendance" ? content : null}
    </ModalShell>
  );
}
