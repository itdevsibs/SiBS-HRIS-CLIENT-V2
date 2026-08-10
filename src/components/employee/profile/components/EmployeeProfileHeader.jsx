import {
  Briefcase,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Edit3,
  FileCheck2,
  MapPin,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";

import {
  firstValue,
  formatDisplayDate,
  getFullName,
  getProfileSibsId,
  getRegularizationDate,
} from "../../../../lib/utils/employees/employeeProfileHelpers.js";
import EmployeeProfileAvatar from "./EmployeeProfileAvatar.jsx";

function HeaderFact({ icon: Icon, children }) {
  if (!children) return null;

  return (
    <span className="inline-flex min-w-0 items-center gap-1 text-[10px] 2xl:text-xs font-semibold text-[#667085]">
      <Icon size={13} className="shrink-0 text-[#042C51]" />
      <span className="truncate max-w-[200px] 2xl:max-w-none">{children}</span>
    </span>
  );
}

export default function EmployeeProfileHeader({
  employee,
  apiUrl,
  canEdit,
  isEditing,
  isSaving = false,
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
  const regularizationDate = getRegularizationDate(employee);

  return (
    <section className="sibs-page-header-in sibs-card relative overflow-visible p-3.5 2xl:p-4">
      <span className="sibs-top-accent pointer-events-none absolute left-[1px] right-[1px] top-[1px] h-1 rounded-t-[15px] bg-gradient-to-r from-[#042C51] via-[#FF5C28] to-[#042C51]" aria-hidden="true" />

      <div className="mt-0.5 flex flex-col items-center justify-between gap-4 2xl:gap-5 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-col items-center gap-3.5 2xl:gap-4 text-center sm:flex-row sm:text-left">
          <EmployeeProfileAvatar
            employee={employee}
            apiUrl={apiUrl}
            onClick={onAvatarClick}
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="break-words text-base 2xl:text-lg font-black leading-tight tracking-tight text-[#042C51]">
                {fullName}
              </h1>

              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] 2xl:text-[10px] font-extrabold uppercase text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {employee?.employmentStatus || employee?.status || "Active"}
              </span>

              <span className="rounded-full border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 text-[9px] 2xl:text-[10px] font-extrabold uppercase text-[#042C51]">
                {getProfileSibsId(employee) || "SIBS ID N/A"}
              </span>
            </div>

            {role ? (
              <p className="mt-0.5 text-xs font-semibold text-[#FF5C28]">
                {role}
              </p>
            ) : null}

            <div className="mt-2 flex flex-wrap justify-center gap-x-3.5 2xl:gap-x-4 gap-y-1 sm:justify-start">
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
              <HeaderFact icon={CalendarCheck}>
                {regularizationDate
                  ? `Regularization: ${formatDisplayDate(regularizationDate)}`
                  : ""}
              </HeaderFact>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center shrink-0">
          {canEdit ? (
            isEditing ? (
              <>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isSaving}
                  className="inline-flex h-8 2xl:h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 2xl:px-3 text-[11px] 2xl:text-xs font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  <CheckCircle2 size={13} className="2xl:h-[14px] 2xl:w-[14px]" />
                  {isSaving ? "Saving..." : "Save Profile"}
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSaving}
                  className="inline-flex h-8 2xl:h-9 items-center justify-center rounded-lg bg-slate-100 px-2.5 2xl:px-3 text-[11px] 2xl:text-xs font-black text-[#667085] transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex h-8 2xl:h-9 items-center justify-center gap-1.5 rounded-lg bg-[#042C51] px-2.5 2xl:px-3 text-[11px] 2xl:text-xs font-black text-white shadow-sm transition hover:bg-[#063560]"
              >
                <Edit3 size={13} className="text-[#FF5C28] 2xl:h-[14px] 2xl:w-[14px]" />
                Edit Profile Record
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={onRequestChange}
              className="inline-flex h-8 2xl:h-9 items-center justify-center rounded-lg border border-[#D6E0EA] bg-white px-2.5 2xl:px-3 text-[11px] 2xl:text-xs font-black text-[#042C51] transition hover:bg-slate-50"
            >
              Request a Change
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={onToggleMore}
              className="flex h-8 2xl:h-9 w-full items-center justify-center rounded-lg bg-slate-100 px-2 text-slate-600 transition hover:bg-slate-200 sm:w-8 2xl:sm:w-9"
              aria-label="More employee actions"
              aria-expanded={moreOpen}
            >
              <MoreHorizontal size={16} className="2xl:h-[17px] 2xl:w-[17px]" />
            </button>

            {moreOpen ? morePanel : null}
          </div>
        </div>
      </div>
    </section>
  );
}



