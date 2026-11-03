import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  Fingerprint,
  IdCard,
  Loader2,
  MapPin,
  UsersRound,
} from "lucide-react";
import { ModalShell } from "@/components/ui";
import { formatDate } from "@/components/layout/FormatDateTime";
import { sanitizeMiddleName, sanitizeDisplayFullName } from "@/lib/utils/employees/employeeNameDisplay.js";
import { getAssignedSite } from "@/lib/utils/attendance/attendanceHelpers";
import { getDepartments, getDepartmentDetails } from "@/lib/axios/getDepartments";
import { getDepartmentAccountEmployees } from "@/lib/axios/departments";
import { normalizeDepartmentDirectoryResponse, normalizeDepartmentDetailsResponse } from "@/lib/utils/departments/departmentDirectory";

const UNKNOWN = "—";
const DIRECTORY_CACHE_MS = 5 * 60 * 1000;
let directoryCache = null;
const detailsCache = new Map();
const bodPeopleCache = new Map();

const clean = (value) => {
  const text = String(value ?? "").trim();
  return text && !["n/a", "null", "undefined", "0000-00-00", "0000-00-00 00:00:00"].includes(text.toLowerCase())
    ? text : UNKNOWN;
};

function employeeName(row) {
  const last = clean(row?.gy_emp_lname);
  const first = clean(row?.gy_emp_fname);
  const middle = sanitizeMiddleName(row?.gy_emp_mname);
  if (last !== UNKNOWN || first !== UNKNOWN) {
    return `${last === UNKNOWN ? "" : last}${last !== UNKNOWN && first !== UNKNOWN ? ", " : ""}${first === UNKNOWN ? "" : first}${middle ? ` ${middle}` : ""}`.trim().toUpperCase();
  }
  return clean(sanitizeDisplayFullName(row?.gy_emp_fullname)).toUpperCase();
}

// Department Directory currently returns a combined manager name. Prefer separate
// Kronos name fields when available; otherwise keep the existing name and
// interpret its final word as the surname for display purposes.
function namePart(value) {
  const part = String(value ?? "").trim();
  return /^(?:n\s*\/?\s*a\.?|not\s+applicable|none|null|undefined)$/i.test(part) ? "" : part;
}

export function formatOperationsManagerName(manager) {
  const first = namePart(manager?.firstName ?? manager?.first_name ?? manager?.gy_emp_fname);
  const middle = namePart(manager?.middleName ?? manager?.middle_name ?? manager?.gy_emp_mname);
  const last = namePart(manager?.lastName ?? manager?.last_name ?? manager?.gy_emp_lname);
  if (last && first) {
    return `${last}, ${first}${middle ? ` ${middle}` : ""}`.toUpperCase();
  }

  const full = sanitizeDisplayFullName(manager?.name);
  if (!full) return UNKNOWN;
  // Already formatted names may come from another Departments response version.
  if (full.includes(",")) {
    const [surname, ...given] = full.split(",");
    const rest = given.join(",").trim().split(/\s+/).filter(namePart).join(" ");
    return `${namePart(surname)}${rest ? `, ${rest}` : ""}`.toUpperCase();
  }
  const parts = full.split(/\s+/).filter(namePart);
  if (parts.length < 2) return (parts[0] || UNKNOWN).toUpperCase();
  const surname = parts.pop();
  return `${surname}, ${parts.join(" ")}`.toUpperCase();
}

function employeeInitials(row) {
  const first = clean(row?.gy_emp_fname);
  const last = clean(row?.gy_emp_lname);
  if (first !== UNKNOWN && last !== UNKNOWN) return `${first[0]}${last[0]}`.toUpperCase();
  return employeeName(row).split(/[\s,]+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "?";
}

// Schedule times may be MySQL TIME strings, local DATETIME strings, or ISO timestamps.
// Do not shift a TIME-only string with the browser timezone.
export function formatAttendanceModalTime(value) {
  const raw = clean(value);
  if (raw === UNKNOWN || raw.startsWith("0000-00-00")) return UNKNOWN;
  const localTime = /^(?:\d{4}-\d{2}-\d{2}[ T])?(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(raw);
  if (localTime) {
    const hours = Number(localTime[1]);
    if (hours > 23) return UNKNOWN;
    return `${String(hours % 12 || 12).padStart(2, "0")}:${localTime[2]} ${hours >= 12 ? "PM" : "AM"}`;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return UNKNOWN;
  return parsed.toLocaleTimeString("en-PH", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", hour12: true });
}

function normalizeMatch(value) {
  return String(value ?? "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

// Display-only exception from the Departments page. Do not alter Kronos
// reporting relationships or hide this person from any other account.
export function hideSoftwareManagementJoburt(account, manager) {
  const accountId = account?.id ?? account?.accountId ?? account?.gy_acc_id;
  const isSoftwareManagement = [account?.name, account?.longName].some(
    (name) => normalizeMatch(name) === "software management",
  );
  if (!isSoftwareManagement || (accountId != null && accountId !== "" && Number(accountId) !== 42)) {
    return false;
  }

  const sibsId = String(
    manager?.sibsId ?? manager?.sibs_id ?? manager?.employeeSibsId ?? manager?.gy_emp_code ?? "",
  ).trim();
  const name = normalizeMatch(
    manager?.name || manager?.fullName ||
      [manager?.firstName ?? manager?.gy_emp_fname, manager?.middleName ?? manager?.gy_emp_mname, manager?.lastName ?? manager?.gy_emp_lname].filter(Boolean).join(" "),
  );
  const parts = name.split(" ");
  return sibsId === "2342" || (parts.includes("joburt") && parts.includes("ducao"));
}

async function cachedDirectory() {
  if (directoryCache && Date.now() - directoryCache.at < DIRECTORY_CACHE_MS) return directoryCache.promise;
  const promise = getDepartments({ page: 1, limit: 50, status: "all" })
    .then((response) => normalizeDepartmentDirectoryResponse(response));
  directoryCache = { at: Date.now(), promise };
  try { return await promise; } catch (error) { directoryCache = null; throw error; }
}

async function cachedDepartmentDetails(departmentId) {
  const key = String(departmentId);
  const cached = detailsCache.get(key);
  if (cached && Date.now() - cached.at < DIRECTORY_CACHE_MS) return cached.promise;
  const promise = getDepartmentDetails(key).then((response) => normalizeDepartmentDetailsResponse(response));
  detailsCache.set(key, { at: Date.now(), promise });
  try { return await promise; } catch (error) { detailsCache.delete(key); throw error; }
}

// Use the same Board of Directors source as the Departments page. BOD members
// are the employees with SIBS IDs 0001 or 0002 in the department's BOD account.
function isBodAccount(account) {
  return Number(account?.id) === 29 || [account?.name, account?.longName].some(
    (name) => ["bod", "board of directors", "board of director", "board of directors bod"].includes(normalizeMatch(name)),
  );
}

function isSeniorManagersAccount(account) {
  return [account?.name, account?.longName].some(
    (name) => ["senior managers", "senior manager", "senior operations managers", "senior operations manager"].includes(normalizeMatch(name)),
  );
}

async function cachedBodPeople(bodAccountId) {
  const key = String(bodAccountId);
  const cached = bodPeopleCache.get(key);
  if (cached && Date.now() - cached.at < DIRECTORY_CACHE_MS) return cached.promise;
  const promise = getDepartmentAccountEmployees(key).then((result) => {
    const employees = Array.isArray(result?.employees) ? result.employees
      : Array.isArray(result?.data) ? result.data : [];
    return employees
      .filter((employee) => ["0001", "0002"].includes(
        String(employee?.sibsId ?? employee?.sibs_id ?? "").padStart(4, "0"),
      ))
      .map((employee) => ({
        ...employee,
        name: employee?.name || employee?.employeeName || employee?.fullName || employee?.gy_emp_fullname || "",
      }));
  });
  bodPeopleCache.set(key, { at: Date.now(), promise });
  try { return await promise; } catch (error) { bodPeopleCache.delete(key); throw error; }
}

/** Resolve leadership from the same account hierarchy used on the Departments page. */
export async function getDepartmentAccountOperationsManagers(row) {
  const departmentName = normalizeMatch(row?.department);
  const accountName = normalizeMatch(row?.gy_emp_account);
  if (!departmentName || !accountName) return { managers: [], reason: "missing" };

  const directory = await cachedDirectory();
  const department = directory.departments.find((item) => normalizeMatch(item.name) === departmentName);
  if (!department?.id) return { managers: [], reason: "unmatched" };

  const details = await cachedDepartmentDetails(department.id);
  const account = details.accounts.find((item) =>
    [item.name, item.longName].some((value) => normalizeMatch(value) === accountName),
  );
  if (!account) return { managers: [], reason: "unmatched" };
  // Senior Managers report to BOD in the Departments hierarchy. Fetch the
  // BOD members from the BOD account itself, not the Senior Managers OM list.
  if (isSeniorManagersAccount(account)) {
    const bodAccount = details.accounts.find(isBodAccount);
    if (!bodAccount?.id) {
      return { managers: [], leadershipRole: "BOD", reason: "unassigned" };
    }
    const managers = (await cachedBodPeople(bodAccount.id)).filter(
      (manager) => clean(manager?.name) !== UNKNOWN,
    );
    return { managers, leadershipRole: "BOD", reason: managers.length ? "found" : "unassigned" };
  }

  // The Managers account is supervised by Senior Operations Managers.
  const isManagersAccount = [account.name, account.longName].some(
    (name) => normalizeMatch(name) === "managers" || normalizeMatch(name) === "manager",
  );
  const leadershipRole = isManagersAccount ? "Senior Operations Manager" : "Operations Manager";
  const assignedManagers = isManagersAccount
    ? account.seniorOperationsManagers
    : account.operationsManagers;
  const managers = (Array.isArray(assignedManagers) ? assignedManagers : []).filter(
    (manager) => clean(manager?.name) !== UNKNOWN && !hideSoftwareManagementJoburt(account, manager),
  );
  return { managers, leadershipRole, reason: managers.length ? "found" : "unassigned" };
}

/** Same image fields and hover-preview behavior as Employee Directory and Attendance rows. */
function AttendanceModalEmployeeAvatar({ row }) {
  const profilePictureUrl = String(
    row?.profilePictureUrl || row?.profile_picture_url || "",
  ).trim();
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(null);
  const avatarRef = useRef(null);
  const initials = employeeInitials(row);
  const showImage = Boolean(profilePictureUrl) && failedImageUrl !== profilePictureUrl;

  const updatePreviewPosition = () => {
    const rect = avatarRef.current?.getBoundingClientRect();
    if (!rect) return;
    const previewHeight = 176;
    const gap = 12;
    const placeBelow = rect.top < previewHeight + gap;
    setPreviewPosition({
      left: rect.left + rect.width / 2,
      top: placeBelow ? rect.bottom + gap : rect.top - gap,
      placeBelow,
    });
  };

  const showPreview = () => {
    updatePreviewPosition();
    setPreviewVisible(true);
  };

  useEffect(() => {
    if (!previewVisible) return undefined;
    const reposition = () => {
      const rect = avatarRef.current?.getBoundingClientRect();
      if (!rect) return;
      const gap = 12;
      const placeBelow = rect.top < 176 + gap;
      setPreviewPosition({
        left: rect.left + rect.width / 2,
        top: placeBelow ? rect.bottom + gap : rect.top - gap,
        placeBelow,
      });
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [previewVisible]);

  const profileImage = (sizeClass, preview = false) => (
    <span
      className={`relative flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sibs-navy font-extrabold text-white ${preview ? "text-2xl" : "text-base shadow-sm"}`}
    >
      <span aria-hidden="true">{initials}</span>
      {showImage && (
        <img
          src={profilePictureUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailedImageUrl(profilePictureUrl)}
        />
      )}
    </span>
  );

  return (
    <>
      <span
        ref={avatarRef}
        className="relative inline-flex shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-sibs-orange focus-visible:ring-offset-2 rounded-xl"
        tabIndex={0}
        aria-label={`${employeeName(row)} profile picture`}
        onMouseEnter={showPreview}
        onMouseLeave={() => setPreviewVisible(false)}
        onFocus={showPreview}
        onBlur={() => setPreviewVisible(false)}
      >
        {profileImage("h-14 w-14")}
      </span>
      {previewVisible && previewPosition && typeof document !== "undefined" && createPortal(
        <span
          className="employee-avatar-preview pointer-events-none fixed z-[9999] rounded-2xl border border-sibs-border bg-white p-2 shadow-[0_18px_45px_rgba(4,44,81,0.22)]"
          style={{
            left: previewPosition.left,
            top: previewPosition.top,
            transform: previewPosition.placeBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)",
          }}
          aria-hidden="true"
        >
          {profileImage("h-40 w-40", true)}
        </span>,
        document.body,
      )}
    </>
  );
}

function SectionCard({ icon: Icon, title, subtitle, children, side }) {
  return (
    <section className="sibs-card overflow-hidden rounded-2xl border border-sibs-border bg-white p-4 shadow-sm sm:p-5" aria-label={title}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-sibs-border pb-3.5">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="sibs-tone-navy-icon inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"><Icon size={17} /></span>
          <div>
            <h3 className="sibs-modal-section-title font-extrabold text-sibs-navy">{title}</h3>
            {subtitle && <p className="mt-0.5 sibs-modal-section-subtitle text-sibs-muted">{subtitle}</p>}
          </div>
        </div>
        {side}
      </div>
      {children}
    </section>
  );
}

function Detail({ icon: Icon, label, value, hint }) {
  return (
    <div className="flex min-w-0 items-start gap-3 py-1.5">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-sibs-navy"><Icon size={17} /></span>
      <dl className="min-w-0">
        <dt className="text-[11px] font-semibold text-sibs-muted">{label}</dt>
        <dd className="mt-0.5 break-words text-xs font-extrabold text-sibs-navy sm:text-sm">{React.isValidElement(value) ? value : clean(value)}</dd>
        {hint && <dd className="mt-1 text-[10px] text-sibs-secondary">{hint}</dd>}
      </dl>
    </div>
  );
}

function AttendanceStatusBadge({ status }) {
  const normalized = String(status ?? "").trim();
  const key = normalized.toLowerCase();
  const tone = key === "approved"
    ? { wrap: "border-emerald-200 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" }
    : key === "pending" || key === "pending review"
      ? { wrap: "border-amber-200 bg-amber-50 text-amber-700", dot: "bg-amber-500" }
      : key === "rejected" || key === "disapproved"
        ? { wrap: "border-rose-200 bg-rose-50 text-rose-700", dot: "bg-rose-500" }
        : { wrap: "border-sibs-border bg-white text-sibs-secondary", dot: "bg-sibs-secondary" };
  return (
    <span className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold ${tone.wrap}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      Status: {normalized || UNKNOWN}
    </span>
  );
}

function TimeTile({ label, value, highlight }) {
  return (
    <div className={`min-w-0 rounded-xl border px-3 py-3 ${highlight ? "border-blue-200 bg-blue-50/60" : "border-sibs-border bg-sibs-surface"}`}>
      <dt className="text-[10px] font-bold uppercase tracking-wide text-sibs-muted">{label}</dt>
      <dd className="mt-1 text-sm font-extrabold tabular-nums text-sibs-navy sm:text-base">{formatAttendanceModalTime(value)}</dd>
    </div>
  );
}

export default function AttendanceEmployeeDetailsModal({ row, onClose }) {
  const [omState, setOmState] = useState({ loading: false, managers: [], reason: "missing" });
  const department = String(row?.department ?? "");
  const account = String(row?.gy_emp_account ?? "");
  const rowId = String(row?.gy_emp_code ?? "");

  useEffect(() => {
    if (!row) return undefined;
    let live = true;
    setOmState({ loading: true, managers: [], reason: "loading" });
    getDepartmentAccountOperationsManagers({ department, gy_emp_account: account })
      .then((result) => { if (live) setOmState({ loading: false, ...result }); })
      .catch(() => { if (live) setOmState({ loading: false, managers: [], reason: "error" }); });
    return () => { live = false; };
  }, [rowId, department, account, Boolean(row)]);

  const hasSchedule = Boolean(row && [
    row.gy_sched_login, row.gy_sched_logout, row.schedule_start, row.schedule_end,
  ].some((value) => formatAttendanceModalTime(value) !== UNKNOWN));
  const date = row?.gy_tracker_date || row?.gy_sched_day;
  const site = row ? getAssignedSite(row) : "";

  const isSeniorManagers = ["senior managers", "senior manager", "senior operations managers", "senior operations manager"].includes(normalizeMatch(account));
  const isManagersAccount = normalizeMatch(account) === "managers" || normalizeMatch(account) === "manager";
  const leadershipLabel = omState.leadershipRole || (isSeniorManagers ? "BOD" : isManagersAccount ? "Senior Operations Manager" : "Operations Manager");
  const operationsManagerValue = useMemo(() => {
    if (omState.loading) return "Loading from Departments…";
    if (omState.reason === "error") return "Unable to load from Departments";
    if (!omState.managers.length) return "Not assigned in Departments";
    const names = [...new Set(omState.managers.map(formatOperationsManagerName).filter((name) => name !== UNKNOWN))];
    if (!names.length) return "Not assigned in Departments";
    return (
      <div className="space-y-1">
        {names.map((name) => <div key={name}>{name}</div>)}
      </div>
    );
  }, [omState]);

  return (
    <ModalShell
      open={Boolean(row)}
      onClose={onClose}
      title="Employee Schedule & Information"
      subtitle={date ? `Time & Attendance  /  ${formatDate(date)}` : "Time & Attendance"}
      icon={CalendarDays}
      maxWidth="max-w-6xl"
      variant="navy"
      className="rounded-[14px]"
      headerClassName="bg-sibs-navy"
      bodyClassName="bg-sibs-surface p-3 sm:p-4 2xl:p-5"
      closeOnBackdrop={false}
      footer={<button type="button" onClick={onClose} className="sibs-modal-btn-secondary px-5">Close</button>}
    >
      {row && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_290px]">
            <div className="sibs-card flex min-w-0 items-center gap-4 rounded-2xl border border-sibs-border bg-white px-4 py-5 sm:px-5">
              <AttendanceModalEmployeeAvatar row={row} />
              <div className="min-w-0">
                <h2 className="break-words text-base font-extrabold text-sibs-navy sm:text-lg">{employeeName(row)}</h2>
                <p className="mt-1 text-xs font-semibold text-sibs-secondary">SIBS ID: {clean(row.gy_emp_code)}</p>
                <p className="mt-1 text-xs text-sibs-muted">{clean(department)} · {clean(account)}</p>
              </div>
            </div>
            <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-orange-200 bg-orange-50/70 p-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-200 bg-white text-sibs-orange"><CalendarDays size={21} /></span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-sibs-muted">Selected tracker date</p>
                <p className="mt-0.5 text-base font-extrabold text-sibs-navy">{date ? formatDate(date) : UNKNOWN}</p>
                <p className="mt-1 text-[11px] text-sibs-secondary">Attendance and matched schedule</p>
              </div>
            </div>
          </div>

          <SectionCard icon={IdCard} title="Employee Information" subtitle="Employee master data and operations assignment from Departments">
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              <Detail icon={Fingerprint} label="SIBS ID" value={row.gy_emp_code} />
              <Detail icon={Building2} label="Department" value={department} />
              <Detail icon={BriefcaseBusiness} label="Account" value={account} />
              <Detail icon={MapPin} label="Site" value={site} />
              <Detail icon={UsersRound} label={leadershipLabel} value={omState.loading ? <span className="inline-flex items-center gap-2"><Loader2 size={13} className="animate-spin" /> Loading…</span> : operationsManagerValue} />
            </div>
          </SectionCard>

          <SectionCard
            icon={CalendarDays}
            title="Scheduled Shift"
            subtitle={`Kronos schedule for ${date ? formatDate(date) : "the selected tracker date"}`}
            side={<span className={`rounded-full border px-3 py-1 text-[11px] font-extrabold ${hasSchedule ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{hasSchedule ? "Schedule available" : "No schedule found"}</span>}
          >
            {hasSchedule ? (
              <dl className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                <TimeTile label="Scheduled Login" value={row.gy_sched_login || row.schedule_start} highlight />
                <TimeTile label="Break Out" value="—" />
                <TimeTile label="Break In" value="—" />
                <TimeTile label="Scheduled Logout" value={row.gy_sched_logout || row.schedule_end} highlight />
              </dl>
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">No matching Kronos schedule was returned for this employee on the selected day. Shift times cannot be confirmed.</p>
            )}
          </SectionCard>

          <SectionCard icon={Clock3} title="Actual Attendance" subtitle="Actual punches and recorded hours from Kronos">
            <dl className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
              <TimeTile label="Login" value={row.gy_tracker_login} />
              <TimeTile label="Break Out" value={row.gy_tracker_breakout} />
              <TimeTile label="Break In" value={row.gy_tracker_breakin} />
              <TimeTile label="Logout" value={row.gy_tracker_logout} />
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-sibs-secondary">
              <AttendanceStatusBadge status={row.gy_tracker_status} />
              <span className="rounded-lg border border-sibs-border bg-white px-3 py-1.5">Work Hours: {clean(row.gy_tracker_wh)}</span>
              <span className="rounded-lg border border-sibs-border bg-white px-3 py-1.5">Break Hours: {clean(row.gy_tracker_bh)}</span>
            </div>
          </SectionCard>
        </div>
      )}
    </ModalShell>
  );
}
