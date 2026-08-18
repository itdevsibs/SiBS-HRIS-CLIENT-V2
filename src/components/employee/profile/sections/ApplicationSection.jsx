import {
  BadgeCheck,
  Briefcase,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  FileText,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
} from "lucide-react";

import { PIPELINE_STAGES } from "../../../../lib/utils/employees/employeeProfileSchemas.js";
import { formatDisplayDate, toInputDate } from "../../../../lib/utils/employees/employeeProfileHelpers.js";
import ProfileSectionHeader from "../shared/ProfileSectionHeader.jsx";
import ProfilePanel from "../shared/ProfilePanel.jsx";
import { ProfileFieldControl, ProfileReadField } from "../shared/ProfileFields.jsx";
import ProfileEmptyState from "../shared/ProfileEmptyState.jsx";
import ProfileSaveBar from "../shared/ProfileSaveBar.jsx";

function ApplicationFieldGrid({ fields, employee, isEditing, onChange }) {
  if (isEditing) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {fields.map(([field, label, type = "text"]) => (
          <ProfileFieldControl
            key={field}
            label={label}
            type={type}
            value={employee?.[field]}
            onChange={(value) => onChange(field, value)}
            className={type === "textarea" ? "md:col-span-2 xl:col-span-3" : ""}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
      {fields.map(([field, label]) => (
        <ProfileReadField key={field} label={label} value={employee?.[field]} />
      ))}
    </div>
  );
}

export function ApplicationSection({
  employee,
  selectedSubTab,
  isEditing,
  onEdit,
  onChange,
  onListChange,
  onSave,
  onCancel,
}) {
  const config = {
    overview: ["Application Overview", "Candidate source, role preference, and recruitment application details.", Briefcase],
    schedule: ["Work Schedule & Shifts", "Assigned shift timing, weekly roster arrangements, and working hours.", CalendarClock],
    pipeline: ["Pipeline Link", "Current pipeline status, assignment, and TA ownership.", UserCheck],
    assessment: ["Assessment Results", "Testing scores, evaluations, and outcome status.", BadgeCheck],
    readiness: ["Readiness and Compliance", "Availability, work setup, and compliance readiness.", ShieldCheck],
    history: ["Status History", "Chronological application status and stage audit trail.", FileText],
  }[selectedSubTab] || ["Application", "Recruitment details.", Briefcase];

  const [title, subtitle, Icon] = config;

  const statusHistory = (() => {
    const primary = Array.isArray(employee?.statusHistory) && employee.statusHistory.length > 0
      ? employee.statusHistory
      : [];
    if (primary.length > 0) return primary;

    const appHistory = Array.isArray(employee?.applicationHistory) && employee.applicationHistory.length > 0
      ? employee.applicationHistory
      : [];

    if (appHistory.length > 0) {
      return appHistory.map((item, index) => ({
        id: item.id || item._dedupeKey || `app_hist_${index}`,
        date: item.date || item.createdAt || item.updatedAt || "",
        status: item.statusLabel || item.status || item.outcome || item.stage || "Recruitment Movement",
        stage: item.stage || item.pipelineStage || item.role || "Talent Pool Pipeline",
        remarks: item.description || item.remarks || item.notes || item.reason || "Log recorded during recruitment process.",
      }));
    }

    return [];
  })();

  const currentStage = employee?.pipelineStage || employee?.currentStage || "Sourcing";
  const currentIndex = Math.max(PIPELINE_STAGES.findIndex((stage) => stage === currentStage), 0);

  return (
    <div className="space-y-4">
      <ProfileSectionHeader
        title={title}
        subtitle={subtitle}
        icon={Icon}
        isEditing={isEditing}
        onEdit={selectedSubTab === "history" ? null : onEdit}
      />

      {selectedSubTab === "overview" && (
        <div className="space-y-5">
          <ProfilePanel title="Candidate & Application Identification">
            <ApplicationFieldGrid
              employee={employee}
              isEditing={isEditing}
              onChange={onChange}
              fields={[
                ["candidateId", "Candidate ID"],
                ["candidateStatus", "Candidate Status"],
                ["age", "Age as of Application"],
                ["encodedBy", "Encoded By"],
                ["appliedPosition", "Applied Position"],
                ["preferredLocation", "Preferred Location"],
                ["source", "Source"],
                ["howDidYouHearAboutUs", "How Did You Hear About Us"],
                ["referredBy", "Referred By"],
                ["sibsId", "Employee ID"],
                ["expectedSalary", "Expected Salary"],
                ["availability", "Availability"],
                ["recruiter", "Recruiter"],
                ["createdAt", "Created At"],
              ]}
            />
          </ProfilePanel>
        </div>
      )}

      {selectedSubTab === "schedule" && (
        <div className="space-y-5">
          {isEditing ? (
            <ProfilePanel title="Edit Work Schedule & Shift Details">
              <ApplicationFieldGrid
                employee={employee}
                isEditing
                onChange={onChange}
                fields={[
                  ["shift", "Shift Name / Schedule Type"],
                  ["shiftStart", "Shift Start Time"],
                  ["shiftEnd", "Shift End Time"],
                  ["workArrangement", "Work Arrangement (e.g. On-site, Hybrid, WFH)"],
                  ["workDays", "Scheduled Working Days (e.g. Mon - Fri)"],
                  ["restDays", "Designated Rest Days (e.g. Sat, Sun)"],
                  ["site", "Assigned Location / Site"],
                  ["gracePeriod", "Grace Period (Minutes)"],
                  ["overtimeEligible", "Overtime Eligible (Yes / No)"],
                  ["scheduleRemarks", "Schedule Notes / Instructions", "textarea"],
                ]}
              />
            </ProfilePanel>
          ) : (
            <>
              <ProfilePanel title="Shift Timing & Work Setup Overview">
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-4">
                  <ProfileReadField
                    label="Current Shift"
                    value={employee?.shift || employee?.shiftSchedule || "Regular Day Shift"}
                  />
                  <ProfileReadField
                    label="Working Hours"
                    value={
                      employee?.shiftStart && employee?.shiftEnd
                        ? `${employee.shiftStart} – ${employee.shiftEnd}`
                        : "08:00 AM – 05:00 PM"
                    }
                  />
                  <ProfileReadField
                    label="Work Setup"
                    value={employee?.workArrangement || employee?.workSetup || "On-site"}
                  />
                  <ProfileReadField
                    label="Assigned Site"
                    value={employee?.site || employee?.workLocation || "Tagum Site"}
                  />
                  <ProfileReadField
                    label="Working Days"
                    value={employee?.workDays || "Monday – Friday"}
                  />
                  <ProfileReadField
                    label="Designated Rest Days"
                    value={employee?.restDays || "Saturday, Sunday"}
                  />
                  <ProfileReadField
                    label="Grace Period"
                    value={employee?.gracePeriod ? `${employee.gracePeriod} mins` : "15 mins"}
                  />
                  <ProfileReadField
                    label="Overtime Policy"
                    value={employee?.overtimeEligible || "Eligible"}
                  />
                </div>
              </ProfilePanel>

              <ProfilePanel title="Standard Weekly Shift Roster">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
                  {[
                    { day: "Mon", full: "Monday", type: "work", time: employee?.shiftStart && employee?.shiftEnd ? `${employee.shiftStart} - ${employee.shiftEnd}` : "08:00 AM - 05:00 PM" },
                    { day: "Tue", full: "Tuesday", type: "work", time: employee?.shiftStart && employee?.shiftEnd ? `${employee.shiftStart} - ${employee.shiftEnd}` : "08:00 AM - 05:00 PM" },
                    { day: "Wed", full: "Wednesday", type: "work", time: employee?.shiftStart && employee?.shiftEnd ? `${employee.shiftStart} - ${employee.shiftEnd}` : "08:00 AM - 05:00 PM" },
                    { day: "Thu", full: "Thursday", type: "work", time: employee?.shiftStart && employee?.shiftEnd ? `${employee.shiftStart} - ${employee.shiftEnd}` : "08:00 AM - 05:00 PM" },
                    { day: "Fri", full: "Friday", type: "work", time: employee?.shiftStart && employee?.shiftEnd ? `${employee.shiftStart} - ${employee.shiftEnd}` : "08:00 AM - 05:00 PM" },
                    { day: "Sat", full: "Saturday", type: "rest", time: "Rest Day" },
                    { day: "Sun", full: "Sunday", type: "rest", time: "Rest Day" },
                  ].map((item) => (
                    <div
                      key={item.day}
                      className={`rounded-xl border p-3 text-center transition ${
                        item.type === "work"
                          ? "border-[#E6ECF2] bg-white shadow-xs"
                          : "border-dashed border-[#D7DEE8] bg-[#F8FAFC]"
                      }`}
                    >
                      <span className="block text-[10px] font-black uppercase tracking-wider text-[#042C51]">
                        {item.full}
                      </span>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${
                          item.type === "work"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.type === "work" ? "Work Day" : "Rest Day"}
                      </span>
                      <p className="mt-2 text-[10px] font-semibold text-[#667085]">
                        {item.time}
                      </p>
                    </div>
                  ))}
                </div>
              </ProfilePanel>
            </>
          )}
        </div>
      )}

      {selectedSubTab === "pipeline" && (
        <div className="space-y-5">
          {isEditing ? (
            <ProfilePanel title="Modify Pipeline Assignment">
              <ApplicationFieldGrid
                employee={employee}
                isEditing
                onChange={onChange}
                fields={[
                  ["pipelineId", "Pipeline ID"],
                  ["pipelineStatus", "Pipeline Status"],
                  ["pipelineStage", "Current Stage"],
                  ["finalRole", "Final Role"],
                  ["finalAccount", "Final Account"],
                  ["taOwner", "TA Owner"],
                  ["prfMatchStatus", "PRF Match Status"],
                  ["remarks", "Recruitment Remarks", "textarea"],
                ]}
              />
            </ProfilePanel>
          ) : (
            <>
              <ProfilePanel title="Active Recruitment Funnel Tracker">
                <div className="relative py-6">
                  <div className="absolute left-8 right-8 top-[42px] hidden h-1 bg-slate-100 md:block" />
                  <div className="relative grid grid-cols-2 gap-6 md:grid-cols-6">
                    {PIPELINE_STAGES.map((stage, index) => {
                      const state = index < currentIndex ? "completed" : index === currentIndex ? "active" : "pending";
                      return (
                        <div key={stage} className="flex flex-col items-center text-center">
                          <span className={`z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-extrabold ${state === "completed" ? "border-emerald-500 bg-emerald-500 text-white" : state === "active" ? "border-[#042C51] bg-[#042C51] text-white ring-4 ring-[#E9F0FC]" : "border-slate-200 bg-white text-slate-400"}`}>
                            {state === "completed" ? <CheckCircle2 size={18} /> : index + 1}
                          </span>
                          <span className={`mt-2 max-w-[110px] text-[10px] font-extrabold ${state === "active" ? "text-[#042C51]" : "text-[#667085]"}`}>
                            {stage}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ProfilePanel>

              <ProfilePanel title="Pipeline Details & TA Ownership">
                <ApplicationFieldGrid
                  employee={employee}
                  isEditing={false}
                  onChange={onChange}
                  fields={[
                    ["pipelineId", "Pipeline ID"],
                    ["pipelineStatus", "Pipeline Status"],
                    ["pipelineStage", "Current Stage"],
                    ["finalRole", "Final Role"],
                    ["finalAccount", "Final Account"],
                    ["taOwner", "TA Owner"],
                  ]}
                />
                <div className="mt-4 grid grid-cols-1 gap-4 border-t border-[#E6ECF2] pt-4 sm:grid-cols-2">
                  <ProfileReadField label="PRF Match Status" value={employee?.prfMatchStatus} />
                  <ProfileReadField label="Recruitment Remarks" value={employee?.remarks} />
                </div>
              </ProfilePanel>
            </>
          )}
        </div>
      )}

      {selectedSubTab === "assessment" && (
        isEditing ? (
          <ProfilePanel title="Modify Assessment Results">
            <ApplicationFieldGrid
              employee={employee}
              isEditing
              onChange={onChange}
              fields={[
                ["assessmentStatus", "Assessment Status"],
                ["assessmentScore", "Assessment Score"],
                ["assessmentRemarks", "Evaluation Remarks", "textarea"],
              ]}
            />
          </ProfilePanel>
        ) : (
          <ProfilePanel>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
              <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-[#D6E0EA] bg-[#F8FAFC] text-center">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">Weighted Score</p>
                <p className="mt-2 text-4xl font-extrabold text-[#042C51]">{employee?.assessmentScore || "—"}</p>
                <span className="mt-2 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
                  {employee?.assessmentStatus || "Pending"}
                </span>
              </div>
              <div className="rounded-xl border border-blue-100 bg-[#E9F0FC]/60 p-5">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#042C51]">Evaluation Summary Remarks</p>
                <p className="mt-3 text-sm font-semibold leading-7 text-[#344054]">
                  {employee?.assessmentRemarks || employee?.remarks || "No assessment remarks recorded."}
                </p>
                <div className="mt-5 flex items-center gap-2 border-t border-blue-100 pt-4 text-xs font-semibold text-[#667085]">
                  <UserCheck size={16} className="text-[#042C51]" />
                  Verified assessment information
                </div>
              </div>
            </div>
          </ProfilePanel>
        )
      )}

      {selectedSubTab === "readiness" && (
        <ProfilePanel title="Compliance & Operational Readiness">
          <ApplicationFieldGrid
            employee={employee}
            isEditing={isEditing}
            onChange={onChange}
            fields={[
              ["vaccinated", "Vaccinated"],
              ["onSiteReady", "On-site Ready"],
              ["graveyardShift", "Graveyard Shift"],
              ["employmentType", "Employment Type"],
              ["remoteAccess", "Remote Access"],
              ["drugTest", "Drug Test"],
              ["backgroundCheck", "Background Check"],
            ]}
          />
        </ProfilePanel>
      )}

      {selectedSubTab === "history" && (
        <div className="space-y-4">
          {isEditing && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  onListChange("statusHistory", [
                    ...statusHistory,
                    { id: `history_${Date.now()}`, date: "", status: "", stage: "", remarks: "" },
                  ])
                }
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white"
              >
                <Plus size={14} />
                Add History Entry
              </button>
            </div>
          )}

          {statusHistory.length === 0 ? (
            <ProfileEmptyState
              message="No application status history recorded."
              actionLabel={isEditing ? "Add history entry" : undefined}
              onAction={
                isEditing
                  ? () =>
                      onListChange("statusHistory", [
                        { id: `history_${Date.now()}`, date: "", status: "", stage: "", remarks: "" },
                      ])
                  : undefined
              }
            />
          ) : isEditing ? (
            statusHistory.map((entry, index) => (
              <ProfilePanel key={entry?.id || index} title={`Status Entry #${index + 1}`}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <ProfileFieldControl
                    label="Date"
                    type="date"
                    value={toInputDate(entry?.date)}
                    onChange={(value) =>
                      onListChange(
                        "statusHistory",
                        statusHistory.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, date: value } : item,
                        ),
                      )
                    }
                  />
                  <ProfileFieldControl
                    label="Status"
                    value={entry?.status}
                    onChange={(value) =>
                      onListChange(
                        "statusHistory",
                        statusHistory.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, status: value } : item,
                        ),
                      )
                    }
                  />
                  <ProfileFieldControl
                    label="Stage"
                    value={entry?.stage}
                    onChange={(value) =>
                      onListChange(
                        "statusHistory",
                        statusHistory.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, stage: value } : item,
                        ),
                      )
                    }
                  />
                  <ProfileFieldControl
                    label="Remarks"
                    type="textarea"
                    value={entry?.remarks}
                    onChange={(value) =>
                      onListChange(
                        "statusHistory",
                        statusHistory.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, remarks: value } : item,
                        ),
                      )
                    }
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      onListChange(
                        "statusHistory",
                        statusHistory.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-extrabold text-red-600"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              </ProfilePanel>
            ))
          ) : (
            <div className="relative ml-3 space-y-5 border-l-2 border-slate-200 pl-6">
              {statusHistory.map((entry, index) => (
                <article
                  key={entry?.id || index}
                  className="relative rounded-2xl border border-[#D6E0EA] bg-[#F8FAFC] p-4"
                >
                  <span className="absolute -left-[31px] top-5 h-3.5 w-3.5 rounded-full border-4 border-white bg-slate-300" />
                  <div className="flex flex-col gap-2 border-b border-[#E6ECF2] pb-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold text-[#042C51]">
                        {entry?.status || "—"}
                      </span>
                      <span className="rounded bg-[#E9F0FC] px-2 py-1 text-[9px] font-extrabold text-[#042C51]">
                        Stage: {entry?.stage || "—"}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#667085]">
                      <CalendarDays size={13} />
                      {formatDisplayDate(entry?.date)}
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-medium italic leading-6 text-[#52637A]">
                    {entry?.remarks || "—"}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {isEditing && <ProfileSaveBar label={title} onCancel={onCancel} onSave={onSave} />}
    </div>
  );
}
