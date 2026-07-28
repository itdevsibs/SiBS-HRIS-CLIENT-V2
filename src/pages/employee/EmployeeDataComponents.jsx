import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Award,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Edit3,
  FileCheck2,
  FileText,
  GraduationCap,
  Heart,
  Image as ImageIcon,
  Lock,
  MapPin,
  MoreHorizontal,
  Phone,
  RefreshCw,
  Sparkles,
  User,
  X,
} from "lucide-react";

export const PROFILE_TABS = [
  {
    key: "personal",
    label: "Personal Info",
    icon: User,
    children: [
      { key: "personal.basic", label: "Basic Info" },
      { key: "personal.contact", label: "Contact" },
      { key: "personal.address", label: "Address" },
      { key: "personal.ids", label: "Government IDs" },
    ],
  },
  {
    key: "family",
    label: "Family / Kin",
    icon: Heart,
    children: [
      { key: "family.spouse", label: "Spouse" },
      { key: "family.parents", label: "Parents" },
      { key: "family.children", label: "Children" },
      { key: "family.emergency", label: "Emergency Contact" },
    ],
  },
  { key: "education", label: "Education", icon: GraduationCap },
  { key: "eligibility", label: "Credentials", icon: Award },
  { key: "experience", label: "Experience", icon: Briefcase },
  { key: "training", label: "Trainings", icon: BookOpen },
  {
    key: "skills",
    label: "Skills / Awards",
    icon: Sparkles,
    children: [
      { key: "skills.skills", label: "Skills" },
      { key: "skills.recognitions", label: "Recognition" },
      { key: "skills.organizations", label: "Organizations" },
    ],
  },
  { key: "references", label: "References", icon: Phone },
  {
    key: "application",
    label: "Application & HR",
    icon: FileCheck2,
    children: [
      { key: "application.overview", label: "Overview" },
      { key: "application.pipeline", label: "Pipeline" },
      { key: "application.assessment", label: "Assessment" },
      { key: "application.history", label: "Status History" },
    ],
  },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "notes", label: "Profile Notes", icon: Lock },
];

export function cleanText(value) {
  return String(value ?? "").trim();
}

export function firstValue(...values) {
  return values.find((value) => cleanText(value)) || "";
}

function formatNamePart(value) {
  const cleaned = cleanText(value).toLowerCase();

  if (!cleaned) return "";

  return cleaned.replace(/(^|[\s'-])([a-z])/g, (match, separator, letter) => {
    return `${separator}${letter.toUpperCase()}`;
  });
}

export function getFullName(employee) {
  const lastName = cleanText(employee?.lastName).toUpperCase();
  const firstName = formatNamePart(employee?.firstName);
  const middleName = formatNamePart(employee?.middleName);
  const extension = cleanText(employee?.nameExtension).toUpperCase();

  const givenNames = [firstName, middleName, extension].filter(Boolean).join(" ");

  if (lastName && givenNames) return `${lastName}, ${givenNames}`;
  if (lastName) return lastName;
  return givenNames;
}

export function getProfileSibsId(employee) {
  const value = firstValue(
    employee?.sibsId,
    employee?.sibs_id,
    employee?.employeeSibsId,
    employee?.employee_sibs_id,
    employee?.gy_emp_code,
    employee?.gy_user_code,
    employee?.username,
    employee?.candidateCode,
    employee?.candidate_code,
  );

  const cleaned = cleanText(value);
  if (!cleaned || cleaned.includes("@")) return "";
  return cleaned;
}

export function getEmployeeInitials(employee) {
  const first = cleanText(employee?.firstName)?.[0] || "";
  const last = cleanText(employee?.lastName)?.[0] || "";
  return `${first}${last}`.toUpperCase() || "S";
}

export function getProfileImageUrl(employee, apiUrl) {
  const directUrl = firstValue(
    employee?.profilePictureUrl,
    employee?.profile_picture_url,
    employee?.profileUrl,
    employee?.profile_url,
  );

  if (directUrl) return directUrl;

  const filename = firstValue(
    employee?.profileFilename,
    employee?.profile_filename,
    employee?.profilePicture,
    employee?.profile_picture,
  );

  if (!filename) return "";
  if (String(filename).startsWith("http")) return filename;

  return `${apiUrl}/api/employee-profile/file/${encodeURIComponent(filename)}`;
}

export function formatDisplayDate(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getActivePrimaryKey(activeTab) {
  return String(activeTab || "personal.basic").split(".")[0];
}

export function getActiveProfileLabel(activeTab) {
  const [primaryKey, childKey] = String(activeTab || "personal.basic").split(".");
  const primary = PROFILE_TABS.find((tab) => tab.key === primaryKey);
  const child = primary?.children?.find(
    (item) => item.key === `${primaryKey}.${childKey}`,
  );

  return {
    primary: primary?.label || "Employee Profile",
    secondary: child?.label || "",
  };
}

function EmployeeAvatar({ employee, apiUrl, onClick }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getProfileImageUrl(employee, apiUrl);
  const shouldShowImage = Boolean(imageUrl) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-visible rounded-2xl bg-transparent text-xl font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.98]"
      title="View profile picture"
    >
      <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#042C51] to-[#084782] shadow-md transition group-hover:shadow-lg">
        {shouldShowImage ? (
          <img
            src={imageUrl}
            alt="Employee profile"
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span>{getEmployeeInitials(employee)}</span>
        )}

        <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 text-[10px] font-bold opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
          View
        </span>
      </span>

      <span
        className="pointer-events-none absolute -bottom-1 -right-1 z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-sm"
        title="Active account"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
      </span>
    </button>
  );
}

function HeaderFact({ icon: Icon, children }) {
  if (!children) return null;

  return (
    <span className="inline-flex min-w-0 items-center gap-1 text-[10px] font-semibold text-[#667085]">
      <Icon size={12} className="shrink-0 text-[#042C51]" />
      <span className="truncate">{children}</span>
    </span>
  );
}

export function EmployeeProfileHeader({
  employee,
  apiUrl,
  canEdit,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onRequestChange,
  onToggleMore,
  moreOpen,
  morePanel,
  onAvatarClick,
}) {
  const fullName = getFullName(employee) || "Employee Name";
  const role = firstValue(
    employee?.position,
    employee?.positionName,
    employee?.position_name,
    employee?.positionTitle,
    employee?.position_title,
    employee?.jobTitle,
    employee?.job_title,
    employee?.jobPosition,
    employee?.job_position,
    employee?.roleTitle,
    employee?.role_title,
    employee?.designation,
    employee?.employeePosition,
    employee?.employee_position,
    employee?.gy_emp_position,
    employee?.appliedPosition,
    employee?.applied_position,
  );
  const department = firstValue(
    employee?.department,
    employee?.departmentName,
    employee?.department_name,
    employee?.gy_department,
  );
  const account = firstValue(
    employee?.account,
    employee?.accountName,
    employee?.account_name,
    employee?.gy_account,
  );
  const location = firstValue(
    employee?.location,
    employee?.assignedLocation,
    employee?.assigned_location,
    employee?.site,
    employee?.gy_assignedloc,
  );

  return (
    <section className="relative overflow-visible rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
      <span
        className="pointer-events-none absolute left-[1px] right-[1px] top-[1px] h-1 overflow-hidden rounded-t-[15px]"
        aria-hidden="true"
      >
        <span className="block h-full w-full bg-gradient-to-r from-[#042C51] via-[#FF5C28] to-[#042C51]" />
      </span>

      <div className="mt-1 flex flex-col items-center justify-between gap-5 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <EmployeeAvatar
            employee={employee}
            apiUrl={apiUrl}
            onClick={onAvatarClick}
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="break-words text-lg font-black leading-tight tracking-tight text-[#042C51]">
                {fullName}
              </h1>

              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {employee?.status || "Active"}
              </span>

              <span className="rounded-full border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#042C51]">
                {getProfileSibsId(employee) || "SIBS ID N/A"}
              </span>
            </div>

            {role && (
              <p className="mt-0.5 text-xs font-semibold text-[#FF5C28]">
                {role}
              </p>
            )}

            <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 sm:justify-start">
              <HeaderFact icon={Briefcase}>{department}</HeaderFact>
              <HeaderFact icon={CalendarDays}>
                {employee?.hireDate
                  ? `Hired: ${formatDisplayDate(employee.hireDate)}`
                  : ""}
              </HeaderFact>
              <HeaderFact icon={FileCheck2}>
                {account ? `Account: ${account}` : ""}
              </HeaderFact>
              <HeaderFact icon={MapPin}>{location}</HeaderFact>
              <HeaderFact icon={RefreshCw}>{employee?.workSetup}</HeaderFact>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {canEdit ? (
            isEditing ? (
              <>
                <button
                  type="button"
                  onClick={onSave}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <CheckCircle2 size={14} />
                  Save Profile
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-100 px-3 text-xs font-black text-[#667085] transition hover:bg-slate-200"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#042C51] px-3 text-xs font-black text-white shadow-sm transition hover:bg-[#063560]"
              >
                <Edit3 size={14} className="text-[#FF5C28]" />
                Edit Profile Record
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={onRequestChange}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-[#D6E0EA] bg-white px-3 text-xs font-black text-[#042C51] transition hover:bg-slate-50"
            >
              Request a Change
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={onToggleMore}
              className="flex h-9 w-full items-center justify-center rounded-lg bg-slate-100 px-2.5 text-slate-600 transition hover:bg-slate-200 sm:w-9"
              aria-label="More employee actions"
              aria-expanded={moreOpen}
            >
              <MoreHorizontal size={17} />
            </button>

            {moreOpen && morePanel}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProfileNavigation({ activeTab, onTabChange }) {
  const activePrimaryKey = getActivePrimaryKey(activeTab);
  const activePrimary = PROFILE_TABS.find(
    (tab) => tab.key === activePrimaryKey,
  );
  const secondaryTabs = activePrimary?.children || [];

  function handlePrimaryClick(tab) {
    const nextKey = tab.children?.[0]?.key || tab.key;
    onTabChange(nextKey);
  }

  return (
    <nav
      className="rounded-2xl border border-[#E6ECF2] bg-white p-2.5 shadow-sm"
      aria-label="Employee profile navigation"
    >
      <div className="flex min-w-0 gap-1 overflow-x-auto pb-1 no-scrollbar">
        {PROFILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.key === activePrimaryKey;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handlePrimaryClick(tab)}
              aria-current={active ? "page" : undefined}
              className={`inline-flex h-9 min-w-max items-center justify-center gap-1.5 rounded-lg border px-3.5 text-xs font-bold transition-all ${
                active
                  ? "border-[#BFD3F2] bg-[#E9F0FC] text-[#042C51] shadow-sm"
                  : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                size={14}
                className={active ? "text-[#FF5C28]" : "text-slate-400"}
              />
              {tab.label}
            </button>
          );
        })}
      </div>

      {secondaryTabs.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto border-t border-[#F1F5F9] pt-2 no-scrollbar">
          <span className="shrink-0 px-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
            Subsections:
          </span>

          {secondaryTabs.map((child) => {
            const active = child.key === activeTab;

            return (
              <button
                key={child.key}
                type="button"
                onClick={() => onTabChange(child.key)}
                aria-selected={active}
                className={`h-7 min-w-max rounded-full px-3 text-[10px] font-bold transition-all ${
                  active
                    ? "bg-[#042C51] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {child.label}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}

function ContextCard({ title, children }) {
  return (
    <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
      <h3 className="mb-3 border-b border-[#F1F5F9] pb-2 text-[11px] font-black uppercase tracking-wider text-[#042C51]">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function ContextPanel({ employee, onNavigate, onAction }) {
  const score = useMemo(() => {
    let total = 75;
    if (employee?.spouseSurname || employee?.spouseFirstName) total += 5;
    if (Array.isArray(employee?.education) && employee.education.length > 0)
      total += 5;
    if (Array.isArray(employee?.experience) && employee.experience.length > 0)
      total += 5;
    if (Array.isArray(employee?.eligibility) && employee.eligibility.length > 0)
      total += 5;
    if (Array.isArray(employee?.documents) && employee.documents.length > 3)
      total += 5;
    return Math.min(total, 100);
  }, [employee]);

  const circumference = 2 * Math.PI * 48;
  const dashOffset = circumference * (1 - score / 100);

  const quickActions = [
    ["Request COE (Certificate of Employment)", "sync"],
    ["Export Profile", "print"],
    ["Synchronize Employee Record", "sync"],
    ["Generate Performance Snapshot", "print"],
  ];

  return (
    <aside className="space-y-5 xl:sticky xl:top-4">
      <ContextCard title="Profile Health Check">
        <div className="space-y-4 text-center">
          <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 112 112">
              <circle
                cx="56"
                cy="56"
                r="48"
                fill="transparent"
                stroke="#F1F5F9"
                strokeWidth="8"
              />
              <circle
                cx="56"
                cy="56"
                r="48"
                fill="transparent"
                stroke="#042C51"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-500"
              />
            </svg>

            <div className="absolute text-center">
              <p className="text-xl font-black text-[#042C51]">{score}%</p>
              <p className="text-[8px] font-black uppercase text-slate-400">
                Completed
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("documents")}
            className="w-full rounded-xl border border-slate-100 bg-[#F8FAFC] p-2.5 text-center transition hover:bg-[#E9F0FC]"
          >
            <p className="text-xs font-bold text-[#042C51]">
              Primary records complete
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Review the employee's attached documents and declarations.
            </p>
          </button>
        </div>
      </ContextCard>

      <ContextCard title="Profile Quick Actions">
        <div className="space-y-1.5">
          {quickActions.map(([label, action]) => (
            <button
              key={label}
              type="button"
              onClick={() => onAction(action)}
              className="flex w-full items-center justify-between rounded-lg bg-[#F1F5F9] px-3 py-2 text-left text-[11px] font-bold text-[#042C51] transition hover:bg-[#E9F0FC]"
            >
              <span>{label}</span>
              <ChevronRight size={14} className="shrink-0 text-[#FF5C28]" />
            </button>
          ))}
        </div>
      </ContextCard>

      <ContextCard title="Audit Trail Logs">
        <div className="space-y-2.5 text-[9px] font-semibold text-[#667085]">
          <div className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF5C28]" />
            <div>
              <p className="font-bold text-slate-800">Employee record opened</p>
              <p className="text-slate-400">Current HRIS session</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
            <div>
              <p className="font-bold text-slate-800">Profile state synchronized</p>
              <p className="text-slate-400">
                {formatDisplayDate(employee?.updatedAt || employee?.updated_at)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
            <div>
              <p className="font-bold text-slate-800">Official profile available</p>
              <p className="text-slate-400">
                Access is controlled by the existing HRIS permissions.
              </p>
            </div>
          </div>
        </div>
      </ContextCard>
    </aside>
  );
}

export function ProfilePictureViewModal({
  open,
  employee,
  apiUrl,
  onClose,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  const imageUrl = getProfileImageUrl(employee, apiUrl);

  return (
    <div
      className="sibs-modal-blur fixed inset-0 z-[99999] flex h-dvh items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#E6ECF2] px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#FF5C28]">
              <ImageIcon size={14} />
              Profile Picture
            </span>
            <h2 className="mt-3 break-words text-xl font-extrabold text-[#042C51] sm:text-2xl">
              {getFullName(employee) || "Employee Profile"}
            </h2>
            <p className="mt-1 text-xs font-semibold text-[#667085]">
              SIBS ID: {getProfileSibsId(employee) || "N/A"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close profile picture modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-[#F8FAFC] p-4 sm:p-6">
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-[#D0D5DD] bg-white p-4 sm:min-h-[460px]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Employee profile"
                className="max-h-[580px] w-full max-w-[620px] rounded-2xl object-contain"
              />
            ) : (
              <div className="text-center">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-[#E9F0FC] text-3xl font-extrabold text-[#042C51]">
                  {getEmployeeInitials(employee)}
                </div>
                <h3 className="mt-4 text-base font-extrabold text-[#042C51]">
                  No Profile Picture
                </h3>
                <p className="mt-1 text-sm font-medium text-[#667085]">
                  This employee has no uploaded profile picture.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
