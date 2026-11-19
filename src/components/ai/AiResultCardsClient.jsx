import { Building2, CalendarDays, ChevronDown, ClipboardCheck, Clock3, Coffee, LogOut, Network, UserRound } from "lucide-react";

import { formatAiDisplayDates } from "@/lib/utils/ai/aiDateDisplayClient";
import { toPublicAiAnswerClient } from "@/lib/utils/ai/aiPublicAnswerClient";
import { parseAiResultBlocks } from "@/lib/utils/ai/aiResultPresentationClient";

function InlineEmphasis({ text }) {
  return String(text || "").split(/(\*\*[^*\n]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index} className="font-bold text-sibs-navy">{part.slice(2, -2)}</strong>
    ) : <span key={index}>{part}</span>,
  );
}

/**
 * An employee submenu uses native details/summary for keyboard support.
 * It is expanded by default so the three key facts remain visible in chat.
 */
function EmployeeProfileSubmenu({ heading = "Based on SiBS HRIS records", name, sibsId, items = [] }) {
  return (
    <section className="min-w-0 space-y-2" aria-label={`Employee information: ${name}`}>
      <h3 className="border-l-[3px] border-sibs-orange pl-2.5 text-[12px] font-bold leading-5 text-sibs-navy">
        {heading}
      </h3>
      <details open className="group min-w-0 overflow-hidden rounded-xl border border-sibs-border bg-white">
        <summary className="flex cursor-pointer list-none items-center gap-2.5 bg-sibs-surface/60 px-3 py-3 text-sibs-navy hover:bg-sibs-surface focus-visible:outline-2 focus-visible:outline-sibs-orange [&::-webkit-details-marker]:hidden">
          <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sibs-navy text-white">
            <UserRound size={17} />
          </span>
          <span className="min-w-0 flex-1 break-words text-[12px] font-bold leading-5">
            {name} <span className="font-semibold text-sibs-secondary">(SiBS ID: {sibsId})</span>
          </span>
          <ChevronDown aria-hidden="true" size={16} className="shrink-0 text-sibs-muted transition-transform group-open:rotate-180" />
        </summary>
        {items.length > 0 && (
          <ul className="space-y-2 border-t border-sibs-border-subtle px-3 py-3" aria-label="Employee details">
            {items.map((item, index) => (
              <li key={index} className="flex min-w-0 items-start gap-2 text-[12px] font-semibold leading-[1.65] text-sibs-secondary">
                <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sibs-orange" />
                <span className="min-w-0 flex-1 break-words"><InlineEmphasis text={item} /></span>
              </li>
            ))}
          </ul>
        )}
      </details>
    </section>
  );
}

/** A scoped HRIS employee-name collision is a compact, readable choice. */
function EmployeeChoices({ title, options = [], hasMore, prompt }) {
  return (
    <section aria-label="Matching authorized HRIS employees" className="min-w-0 space-y-2.5">
      <h3 className="border-l-[3px] border-sibs-orange pl-2.5 text-[12px] font-bold leading-5 text-sibs-navy">
        {title || "Which employee do you mean?"}
      </h3>
      <div className="min-w-0 overflow-hidden rounded-xl border border-sibs-border bg-white">
        <ul className="divide-y divide-sibs-border-subtle" aria-label="Employee options">
          {options.map(({ name, sibsId }) => (
            <li key={sibsId} className="flex min-w-0 items-center gap-2.5 px-3 py-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sibs-surface text-sibs-navy" aria-hidden="true">
                <UserRound size={14} />
              </span>
              <span className="min-w-0 flex-1 break-words text-[12px] font-semibold leading-5 text-sibs-navy">{name}</span>
              <span className="shrink-0 rounded-md border border-sibs-border px-2 py-1 text-[11px] font-medium text-sibs-secondary">
                ID {sibsId}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {hasMore && <p className="text-[11px] leading-5 text-sibs-muted">Additional matching employees are not shown.</p>}
      <p className="text-[12px] leading-5 text-sibs-secondary">{prompt || "Reply with a SiBS ID to continue."}</p>
    </section>
  );
}

/** Compact HRIS hierarchy: calm navy/white design, no prose data dump. */
function EmployeeReportingLine({ employee, manager }) {
  return (
    <section className="min-w-0 space-y-2" aria-label="Employee reporting line">
      <h3 className="flex items-center gap-2 border-l-[3px] border-sibs-orange pl-2.5 text-[12px] font-bold leading-5 text-sibs-navy">
        <Network aria-hidden="true" size={15} className="shrink-0" />
        Reporting line
      </h3>
      <div className="min-w-0 overflow-hidden rounded-xl border border-sibs-border bg-white">
        <div className="flex min-w-0 items-start gap-2.5 px-3 py-3">
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sibs-surface text-sibs-navy">
            <UserRound size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sibs-muted">Employee</p>
            <p className="mt-0.5 break-words text-[12px] font-bold leading-5 text-sibs-navy">{employee.name}</p>
            {employee.sibsId && <p className="mt-0.5 text-[11px] font-medium text-sibs-secondary">SiBS ID: {employee.sibsId}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 border-y border-sibs-border-subtle bg-sibs-surface/50 px-3 py-1.5">
          <span aria-hidden="true" className="ml-[17px] h-3 border-l-2 border-sibs-orange" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-sibs-muted">Reports to</span>
        </div>
        <div className="flex min-w-0 items-start gap-2.5 px-3 py-3">
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sibs-navy text-white">
            <UserRound size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sibs-muted">Direct manager / supervisor</p>
            <p className={`mt-0.5 break-words text-[12px] leading-5 ${manager.unavailable || manager.nameNotReturned ? "font-medium text-sibs-secondary" : "font-bold text-sibs-navy"}`}>
              {manager.unavailable ? "No verified manager information available" : manager.nameNotReturned ? "Name not available in the HRIS result" : manager.name}
            </p>
            {manager.sibsId && <p className="mt-0.5 text-[11px] font-medium text-sibs-secondary">SiBS ID: {manager.sibsId}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Single-employee date-specific check with no speculative absence/presence. */
function EmployeeAttendanceStatus({ employee, date, status, note, schedule, loginTime }) {
  const labels = {
    recorded: "Attendance recorded",
    notRecorded: "No attendance recorded",
    unavailable: "Unable to verify",
  };
  return (
    <section className="min-w-0 space-y-2" aria-label="Employee attendance status">
      <h3 className="flex items-center gap-2 border-l-[3px] border-sibs-orange pl-2.5 text-[12px] font-bold leading-5 text-sibs-navy">
        <ClipboardCheck aria-hidden="true" size={15} className="shrink-0" />
        Attendance check
      </h3>
      <div className="min-w-0 overflow-hidden rounded-xl border border-sibs-border bg-white">
        <div className="flex min-w-0 items-start gap-2.5 px-3 py-3">
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sibs-surface text-sibs-navy">
            <UserRound size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sibs-muted">Employee</p>
            <p className="mt-0.5 break-words text-[12px] font-bold leading-5 text-sibs-navy">{employee.name}</p>
            <p className="mt-0.5 text-[11px] font-medium text-sibs-secondary">SiBS ID: {employee.sibsId}</p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2 border-y border-sibs-border-subtle bg-sibs-surface/50 px-3 py-2 text-[11px] font-medium text-sibs-secondary">
          <CalendarDays aria-hidden="true" size={14} />
          <span className="min-w-0 break-words">{date}</span>
        </div>
        <div className="space-y-2 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-sibs-muted">Attendance status</p>
          <p className="flex items-center gap-2 text-[12px] font-bold text-sibs-navy">
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-sibs-orange" />
            {labels[status] || labels.unavailable}
          </p>
          {status === "recorded" && loginTime && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-sibs-border-subtle bg-sibs-surface/50 px-3 py-2">
              <span className="text-[11px] font-medium text-sibs-muted">Login time</span>
              <span className="text-[12px] font-bold tabular-nums text-sibs-navy">{loginTime}</span>
            </div>
          )}
          <p className="text-[11px] leading-5 text-sibs-secondary">{note}</p>
        </div>
        {schedule && (
          <div className="border-t border-sibs-border-subtle px-3 py-3" aria-label="Today's employee schedule">
            <div className="mb-2 flex items-center gap-2 text-sibs-navy">
              <Clock3 aria-hidden="true" size={14} className="shrink-0" />
              <p className="text-[11px] font-bold">Today's schedule</p>
            </div>
            {schedule.status === "scheduled" ? (
              <div className="space-y-2">
                {schedule.shifts.map((shift, index) => (
                  <div key={index} className="min-w-0 rounded-lg border border-sibs-border-subtle bg-sibs-surface/40 px-3 py-2.5">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <span className="shrink-0 text-[10px] font-medium text-sibs-muted">{schedule.shifts.length > 1 ? `Shift ${index + 1}` : "Shift"}</span>
                      <span className="min-w-0 text-right text-[12px] font-bold text-sibs-navy">{shift.time}</span>
                    </div>
                    {shift.breakTime && (
                      <div className="mt-1.5 flex min-w-0 items-start justify-between gap-2">
                        <span className="shrink-0 text-[10px] font-medium text-sibs-muted">Break</span>
                        <span className="min-w-0 text-right text-[11px] font-medium text-sibs-secondary">{shift.breakTime}</span>
                      </div>
                    )}
                  </div>
                ))}
                {schedule.notice && <p className="text-[10px] leading-4 text-sibs-muted">{schedule.notice}</p>}
              </div>
            ) : (
              <p className="text-[11px] font-medium leading-5 text-sibs-secondary">
                {{ notRecorded: "No schedule recorded for today", restDay: "Rest day recorded", timeUnavailable: "Today's shift times are not available", unavailable: "Unable to verify today's schedule", notAuthorized: "Schedule details are not available under your current permissions" }[schedule.status] || "Schedule unavailable"}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/** Verified schedule-only replies follow the same restrained card system as attendance. */
function EmployeeScheduleCard({ employee, date, schedule }) {
  const labels = {
    notRecorded: "No schedule recorded for today",
    restDay: "Rest day recorded",
    timeUnavailable: "Today's shift times are not available",
    unavailable: "Unable to verify today's schedule",
    notAuthorized: "Schedule details are not available under your current permissions",
  };
  return (
    <section className="min-w-0 space-y-2" aria-label="Employee schedule">
      <h3 className="flex items-center gap-2 border-l-[3px] border-sibs-orange pl-2.5 text-[12px] font-bold leading-5 text-sibs-navy">
        <Clock3 aria-hidden="true" size={15} className="shrink-0" />
        Today's schedule
      </h3>
      <div className="min-w-0 overflow-hidden rounded-xl border border-sibs-border bg-white">
        <div className="flex min-w-0 items-start gap-2.5 px-3 py-3">
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sibs-surface text-sibs-navy">
            <UserRound size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sibs-muted">Employee</p>
            <p className="mt-0.5 break-words text-[12px] font-bold leading-5 text-sibs-navy">{employee.name}</p>
            <p className="mt-0.5 text-[11px] font-medium text-sibs-secondary">SiBS ID: {employee.sibsId}</p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2 border-y border-sibs-border-subtle bg-sibs-surface/50 px-3 py-2 text-[11px] font-medium text-sibs-secondary">
          <CalendarDays aria-hidden="true" size={14} />
          <span className="min-w-0 break-words">{date}</span>
        </div>
        <div className="space-y-2 px-3 py-3">
          {schedule.status === "scheduled" ? (
            schedule.shifts.map((shift, index) => (
              <div key={index} className="min-w-0 rounded-lg border border-sibs-border-subtle bg-sibs-surface/40 px-3 py-2.5">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <span className="shrink-0 text-[11px] font-medium text-sibs-muted">{schedule.shifts.length > 1 ? `Shift ${index + 1}` : "Shift"}</span>
                  <span className="min-w-0 text-right text-[12px] font-bold tabular-nums text-sibs-navy">{shift.time}</span>
                </div>
                {shift.breakTime && (
                  <div className="mt-1.5 flex min-w-0 items-start justify-between gap-2">
                    <span className="shrink-0 text-[11px] font-medium text-sibs-muted">Break</span>
                    <span className="min-w-0 text-right text-[11px] font-medium text-sibs-secondary">{shift.breakTime}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-[11px] font-medium leading-5 text-sibs-secondary">{labels[schedule.status] || "Schedule unavailable"}</p>
          )}
          {schedule.notice && <p className="text-[10px] leading-4 text-sibs-muted">{schedule.notice}</p>}
        </div>
      </div>
    </section>
  );
}

/** A concise, structured view of explicit schedule facts already in the answer. */
function NarrativeScheduleCard({ employee, date, loginTime, breakStatus, logoutStatus, department, account }) {
  return (
    <section className="min-w-0 space-y-2" aria-label="Employee schedule details">
      <h3 className="flex items-center gap-2 border-l-[3px] border-sibs-orange pl-2.5 text-[12px] font-bold leading-5 text-sibs-navy">
        <Clock3 size={15} className="shrink-0" aria-hidden="true" /> Employee schedule
      </h3>
      <div className="min-w-0 overflow-hidden rounded-xl border border-sibs-border bg-white">
        <div className="flex min-w-0 items-center gap-2.5 bg-sibs-surface/65 px-3 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sibs-navy text-white" aria-hidden="true">
            <UserRound size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="break-words text-[12px] font-bold leading-5 text-sibs-navy">{employee.name}</p>
            <p className="text-[11px] font-medium text-sibs-secondary">SiBS ID: {employee.sibsId}</p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2 border-y border-sibs-border-subtle px-3 py-2 text-sibs-secondary">
          <CalendarDays size={14} className="shrink-0 text-sibs-navy" aria-hidden="true" />
          <span className="min-w-0 break-words text-[11px] font-semibold">{date}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 px-3 py-3">
          <div className="col-span-2 flex min-w-0 items-center justify-between gap-3 rounded-lg border border-sibs-border-subtle bg-sibs-surface/50 px-3 py-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-sibs-muted">
              <Clock3 size={14} className="shrink-0 text-sibs-navy" aria-hidden="true" /> Scheduled login
            </div>
            <strong className="shrink-0 text-[17px] font-extrabold tabular-nums text-sibs-navy">{loginTime}</strong>
          </div>
          {breakStatus && (
            <div className="min-w-0 rounded-lg border border-sibs-border-subtle px-2.5 py-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-sibs-muted"><Coffee size={13} aria-hidden="true" /> Break</div>
              <p className="mt-1 break-words text-[11px] font-bold leading-4 text-sibs-navy">{breakStatus}</p>
            </div>
          )}
          {logoutStatus && (
            <div className="min-w-0 rounded-lg border border-sibs-border-subtle px-2.5 py-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-sibs-muted"><LogOut size={13} aria-hidden="true" /> Logout</div>
              <p className="mt-1 break-words text-[11px] font-bold leading-4 text-sibs-navy">{logoutStatus}</p>
            </div>
          )}
        </div>
        {(department || account) && (
          <dl className="space-y-0 border-t border-sibs-border-subtle" aria-label="Employee organizational details">
            {department && <div className="flex min-w-0 items-start gap-2.5 px-3 py-2.5">
              <Building2 size={14} className="mt-0.5 shrink-0 text-sibs-muted" aria-hidden="true" />
              <dt className="w-[74px] shrink-0 text-[11px] font-medium text-sibs-muted">Department</dt>
              <dd className="min-w-0 flex-1 break-words text-right text-[11px] font-bold text-sibs-navy">{department}</dd>
            </div>}
            {account && <div className={`flex min-w-0 items-start gap-2.5 px-3 py-2.5 ${department ? "border-t border-sibs-border-subtle" : ""}`}>
              <Building2 size={14} className="mt-0.5 shrink-0 text-sibs-muted" aria-hidden="true" />
              <dt className="w-[74px] shrink-0 text-[11px] font-medium text-sibs-muted">Account</dt>
              <dd className="min-w-0 flex-1 break-words text-right text-[11px] font-bold text-sibs-navy">{account}</dd>
            </div>}
          </dl>
        )}
      </div>
    </section>
  );
}

/** Department-first workforce summary. Uses native details for accessible
 * expand/collapse; all numbers were verified against the active directory. */
function ActiveHeadcount({ total, date, departments }) {
  return (
    <section className="min-w-0 space-y-2.5" aria-label="Active employee headcount by department">
      <h3 className="border-l-[3px] border-sibs-orange pl-2.5 text-[12px] font-bold text-sibs-navy">Active employees</h3>
      <div className="rounded-xl border border-sibs-border bg-white px-3 py-3">
        <p className="text-[28px] font-bold leading-8 tabular-nums text-sibs-navy">{total.toLocaleString("en-PH")}</p>
        <p className="mt-0.5 text-[11px] font-medium text-sibs-secondary">Active employees across {departments.length} {departments.length === 1 ? "department" : "departments"}</p>
        <p className="mt-1 text-[10px] text-sibs-muted">As of {date}</p>
      </div>
      <div className="min-w-0 overflow-hidden rounded-xl border border-sibs-border bg-white">
        <div className="border-b border-sibs-border-subtle bg-sibs-surface/60 px-3 py-2.5 text-[11px] font-bold text-sibs-navy">Department breakdown</div>
        {departments.map((dept, index) => (
          <details key={`${dept.name}-${index}`} className="group border-b border-sibs-border-subtle last:border-b-0">
            <summary className="flex min-w-0 cursor-pointer list-none items-center gap-2 px-3 py-3 hover:bg-sibs-surface focus-visible:outline-2 focus-visible:outline-sibs-orange [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 flex-1 break-words text-[12px] font-semibold text-sibs-navy">{dept.name}</span>
              <span className="shrink-0 rounded-md border border-sibs-border px-2 py-0.5 text-[11px] font-bold tabular-nums text-sibs-navy">{dept.count.toLocaleString("en-PH")}</span>
              <ChevronDown size={14} className="shrink-0 text-sibs-muted transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="border-t border-sibs-border-subtle bg-sibs-surface/30 px-3 py-2" aria-label={`Accounts in ${dept.name}`}>
              {dept.accounts.map((acc, accIndex) => (
                <div key={`${acc.name}-${accIndex}`} className="flex min-w-0 items-start justify-between gap-3 py-1.5">
                  <span className="min-w-0 break-words text-[11px] text-sibs-secondary">{acc.name}</span>
                  <span className="shrink-0 text-[11px] font-semibold tabular-nums text-sibs-navy">{acc.count.toLocaleString("en-PH")}</span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

/** Shared restrained styling for authorized summary cards. */
function SummaryHeading({ icon: Icon, children }) {
  return (
    <h3 className="flex items-center gap-2 border-l-[3px] border-sibs-orange pl-2.5 text-[12px] font-bold leading-5 text-sibs-navy">
      <Icon size={15} aria-hidden="true" className="shrink-0" />
      {children}
    </h3>
  );
}

function SummaryMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg border border-sibs-border-subtle bg-sibs-surface/40 px-3 py-2.5">
      <p className="text-[10px] font-medium leading-4 text-sibs-muted">{label}</p>
      <p className="mt-1 break-words text-[16px] font-bold leading-6 tabular-nums text-sibs-navy">{value == null ? "Not verified" : value}</p>
    </div>
  );
}

function SummaryPeriod({ period }) {
  return (
    <div className="flex min-w-0 items-start gap-2 border-b border-sibs-border-subtle bg-sibs-surface/50 px-3 py-2.5 text-[11px] font-medium text-sibs-secondary">
      <CalendarDays size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
      <span className="min-w-0 break-words">{period.from} – {period.to}</span>
    </div>
  );
}

function MonthlyAttendanceSummary({ period, tracked, present, missing, late, lateIsMinimum, daily = [], note }) {
  return (
    <section aria-label="Monthly attendance summary" className="min-w-0 space-y-2">
      <SummaryHeading icon={ClipboardCheck}>My attendance this month</SummaryHeading>
      <div className="min-w-0 overflow-hidden rounded-xl border border-sibs-border bg-white">
        <SummaryPeriod period={period} />
        <div className="grid grid-cols-2 gap-2 p-3">
          <SummaryMetric label="Days with login" value={present} />
          <SummaryMetric label="Tracked days" value={tracked} />
          <SummaryMetric label="Missing login (tracked days)" value={missing} />
          <SummaryMetric label="Verified late days" value={late == null ? null : `${late}${lateIsMinimum ? "+" : ""}`} />
        </div>
        {lateIsMinimum && <p className="px-3 pb-2 text-[10px] leading-4 text-sibs-muted">Late count is a confirmed minimum when some shifts cannot be compared with their schedule.</p>}
        {daily.length > 0 && (
          <details open className="group border-t border-sibs-border-subtle" aria-label="Daily attendance records">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 bg-sibs-surface/40 px-3 py-2.5 text-[11px] font-bold text-sibs-navy focus-visible:outline-2 focus-visible:outline-sibs-orange [&::-webkit-details-marker]:hidden">
              <span>Daily attendance details ({daily.length} days)</span>
              <ChevronDown aria-hidden="true" size={15} className="shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="divide-y divide-sibs-border-subtle">
              {daily.map((row) => (
                <div key={row.date} className="space-y-1.5 px-3 py-2.5">
                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <span className="text-[11px] font-bold text-sibs-navy">{row.date}</span>
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${row.punctuality === "Late" ? "border-sibs-orange/40 bg-sibs-orange/10 text-sibs-orange" : "border-sibs-border bg-sibs-surface/40 text-sibs-secondary"}`}>
                      {row.punctuality === "Late" ? "Late clock-in" : row.punctuality === "On time" ? "On time" : ["Day off", "Rest day", "Holiday"].includes(row.dayType) ? row.dayType : row.attendance}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <p className="text-sibs-secondary">Login: <span className="font-semibold text-sibs-navy">{row.login}</span></p>
                    <p className="text-sibs-secondary">Logout: <span className="font-semibold text-sibs-navy">{row.logout}</span></p>
                  </div>
                  {(row.dayType !== "Not recorded" || row.holiday) && (
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[10px] leading-4">
                      {row.dayType !== "Not recorded" && (
                        <span className="rounded-md border border-sibs-border bg-sibs-surface/50 px-2 py-0.5 font-semibold text-sibs-navy">{row.dayType}</span>
                      )}
                      {row.holiday && (
                        <span className="rounded-md border border-sibs-border bg-white px-2 py-0.5 font-medium text-sibs-secondary">Holiday: {row.holiday}</span>
                      )}
                    </div>
                  )}
                  {row.shift && <p className="text-[10px] leading-4 text-sibs-secondary">Scheduled shift: <span className="font-semibold text-sibs-navy">{row.shift}</span></p>}
                  {row.attendance === "No tracker record" && row.dayType !== "Day off" && row.dayType !== "Rest day" && row.dayType !== "Holiday" && (
                    <p className="text-[10px] leading-4 text-sibs-muted">No tracker record; absence not determined</p>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}
        <p className="border-t border-sibs-border-subtle px-3 py-2.5 text-[11px] leading-[1.6] text-sibs-secondary">{note}</p>
      </div>
    </section>
  );
}

function LeaveBalanceSummary({ remaining, total, plotted, snapshot, note }) {
  const fmt = (value) => value == null ? "Not verified" : `${value.toLocaleString("en-PH", { maximumFractionDigits: 2 })}`;
  return (
    <section aria-label="Leave credit balance" className="min-w-0 space-y-2">
      <SummaryHeading icon={CalendarDays}>My leave balance</SummaryHeading>
      <div className="min-w-0 overflow-hidden rounded-xl border border-sibs-border bg-white">
        <div className="px-3 py-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-sibs-muted">Remaining leave credits</p>
          <p className="mt-1 text-[28px] font-bold leading-9 tabular-nums text-sibs-navy">{fmt(remaining)}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-sibs-border-subtle px-3 py-3">
          <SummaryMetric label="Total leave credits" value={fmt(total)} />
          <SummaryMetric label="Plotted leaves" value={fmt(plotted)} />
        </div>
        {snapshot && <div className="border-t border-sibs-border-subtle px-3 py-2 text-[11px] text-sibs-secondary">Snapshot date: {snapshot}</div>}
        <p className="border-t border-sibs-border-subtle px-3 py-2.5 text-[11px] leading-[1.6] text-sibs-secondary">{note}</p>
      </div>
    </section>
  );
}

function ApplicantLeadsSummary({ total, period, statuses, note }) {
  return (
    <section aria-label="Applicant leads summary" className="min-w-0 space-y-2">
      <SummaryHeading icon={ClipboardCheck}>Recent applicant leads</SummaryHeading>
      <div className="min-w-0 overflow-hidden rounded-xl border border-sibs-border bg-white">
        <SummaryPeriod period={period} />
        <div className="px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-sibs-muted">Total applicant leads</p>
          <p className="mt-1 text-[28px] font-bold leading-9 tabular-nums text-sibs-navy">{total.toLocaleString("en-PH")}</p>
        </div>
        <div className="border-t border-sibs-border-subtle px-3 py-2.5">
          <p className="mb-1 text-[11px] font-semibold text-sibs-navy">By lead status</p>
          {statuses.length ? statuses.map(({ status, count }, index) => (
            <div key={`${status}-${index}`} className="flex min-w-0 items-start justify-between gap-3 py-1.5">
              <span className="min-w-0 break-words text-[11px] text-sibs-secondary">{status}</span>
              <span className="shrink-0 rounded-md border border-sibs-border px-2 py-0.5 text-[11px] font-bold tabular-nums text-sibs-navy">{count.toLocaleString("en-PH")}</span>
            </div>
          )) : <p className="text-[11px] text-sibs-secondary">No leads recorded in this period.</p>}
        </div>
        <p className="border-t border-sibs-border-subtle px-3 py-2.5 text-[11px] leading-[1.6] text-sibs-secondary">{note}</p>
      </div>
    </section>
  );
}

/** Readable, accessible chat content. Cards are reserved for real grouped facts. */
export default function AiResultCardsClient({ content }) {
  const publicAnswer = formatAiDisplayDates(
    toPublicAiAnswerClient(String(content || "")),
  );
  const blocks = parseAiResultBlocks(publicAnswer);
  if (!blocks.length) return null;

  return (
    <div className="min-w-0 space-y-3 text-sibs-navy" aria-label="AI response">
      {blocks.map((block, blockIndex) => {
        if (block.type === "monthlyAttendanceSummary") {
          return <MonthlyAttendanceSummary key={`monthly-attendance-${blockIndex}`} {...block} />;
        }
        if (block.type === "leaveBalanceSummary") {
          return <LeaveBalanceSummary key={`leave-balance-${blockIndex}`} {...block} />;
        }
        if (block.type === "applicantLeadsSummary") {
          return <ApplicantLeadsSummary key={`applicant-leads-${blockIndex}`} {...block} />;
        }
        if (block.type === "activeHeadcount") {
          return <ActiveHeadcount key={`headcount-${blockIndex}`} {...block} />;
        }
        if (block.type === "heading") {
          return (
            <h3 key={`heading-${blockIndex}`}
              className="border-l-[3px] border-sibs-orange pl-2.5 text-[12px] font-bold leading-5 text-sibs-navy">
              <InlineEmphasis text={block.text} />
            </h3>
          );
        }
        if (block.type === "attendanceStatus") {
          return <EmployeeAttendanceStatus key={`attendance-status-${blockIndex}`} {...block} />;
        }
        if (block.type === "employeeSchedule") {
          return <EmployeeScheduleCard key={`employee-schedule-${blockIndex}`} {...block} />;
        }
        if (block.type === "narrativeSchedule") {
          return <NarrativeScheduleCard key={`narrative-schedule-${blockIndex}`} {...block} />;
        }
        if (block.type === "reportingLine") {
          return <EmployeeReportingLine key={`reporting-line-${blockIndex}`} {...block} />;
        }
        if (block.type === "employeeSubmenu") {
          return <EmployeeProfileSubmenu key={`profile-${blockIndex}`} {...block} />;
        }
        if (block.type === "employeeChoices") {
          return <EmployeeChoices key={`choices-${blockIndex}`} {...block} />;
        }
        if (block.type === "employeeProfile") {
          return (
            <EmployeeProfileSubmenu key={`employee-${blockIndex}`}
              name={block.name} sibsId={block.sibsId}
              items={block.description ? [block.description] : []} />
          );
        }
        if (block.type === "facts") {
          return (
            <dl key={`facts-${blockIndex}`} className="min-w-0 overflow-hidden rounded-xl border border-sibs-border bg-sibs-surface/70">
              {block.items.map(({ label, value }, itemIndex) => (
                <div key={`${blockIndex}-${itemIndex}`}
                  className={`grid min-w-0 grid-cols-[minmax(95px,36%)_minmax(0,1fr)] gap-2 px-3 py-2 text-[12px] leading-5 ${itemIndex ? "border-t border-sibs-border-subtle" : ""}`}>
                  <dt className="break-words font-medium text-sibs-muted">{label}</dt>
                  <dd className="min-w-0 break-words font-semibold text-sibs-navy"><InlineEmphasis text={value} /></dd>
                </div>
              ))}
            </dl>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={`list-${blockIndex}`} className="space-y-2 pl-0.5" aria-label="AI result items">
              {block.items.map((item, itemIndex) => {
                const label = typeof item === "string" ? item : item.text;
                const children = typeof item === "string" ? [] : item.children || [];
                return (
                  <li key={`${blockIndex}-${itemIndex}`} className="min-w-0">
                    {children.length ? (
                      <details className="group overflow-hidden rounded-lg border border-sibs-border bg-white">
                        <summary className="flex cursor-pointer list-none items-start gap-2 px-3 py-2.5 text-[12px] font-semibold leading-5 text-sibs-navy hover:bg-sibs-surface focus-visible:outline-2 focus-visible:outline-sibs-orange [&::-webkit-details-marker]:hidden">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sibs-orange" />
                          <span className="min-w-0 flex-1 break-words"><InlineEmphasis text={label} />
                            <span className="block text-[11px] font-normal text-sibs-muted">{children.length} specific {children.length === 1 ? "issue" : "issues"}</span>
                          </span>
                          <ChevronDown size={15} className="mt-1 shrink-0 text-sibs-muted transition-transform group-open:rotate-180" aria-hidden="true" />
                        </summary>
                        <ul className="space-y-2 border-t border-sibs-border-subtle bg-sibs-surface/50 px-3 py-2.5">
                          {children.map((child, childIndex) => (
                            <li key={`${blockIndex}-${itemIndex}-${childIndex}`} className="flex min-w-0 items-start gap-2 text-[12px] leading-5 text-sibs-secondary">
                              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sibs-orange" />
                              <span className="min-w-0 break-words"><InlineEmphasis text={child} /></span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : (
                      <div className="flex min-w-0 items-start gap-2 text-[12px] leading-5 text-sibs-secondary">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sibs-orange" />
                        <span className="min-w-0 flex-1 break-words"><InlineEmphasis text={label} /></span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          );
        }
        return (
          <p key={`paragraph-${blockIndex}`} className="min-w-0 whitespace-pre-wrap break-words text-[12px] font-medium leading-[1.7] text-sibs-secondary">
            <InlineEmphasis text={block.text} />
          </p>
        );
      })}
    </div>
  );
}
