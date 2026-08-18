import { useState } from "react";
import {
  Award,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";

import { RECORD_SCHEMAS } from "../../../../lib/utils/employees/employeeProfileSchemas.js";
import { formatDisplayDate, hasValue, toInputDate } from "../../../../lib/utils/employees/employeeProfileHelpers.js";
import ProfileSectionHeader from "../shared/ProfileSectionHeader.jsx";
import ProfilePanel from "../shared/ProfilePanel.jsx";
import { ProfileFieldControl, ProfileReadField } from "../shared/ProfileFields.jsx";
import ProfileEmptyState from "../shared/ProfileEmptyState.jsx";
import ProfileSaveBar from "../shared/ProfileSaveBar.jsx";

function normalizeRecordValue(record, keys) {
  for (const key of keys) {
    if (hasValue(record?.[key])) return record[key];
  }
  return "";
}

function licenseStatus(value) {
  if (!value) return ["No Expiry", "bg-slate-50 text-slate-600 border-slate-200"];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return ["Review", "bg-amber-50 text-amber-700 border-amber-200"];
  const now = new Date();
  const soon = new Date();
  soon.setMonth(soon.getMonth() + 6);
  if (date < now) return ["Expired", "bg-red-50 text-red-700 border-red-200"];
  if (date <= soon) return ["Expiring Soon", "bg-amber-50 text-amber-700 border-amber-200"];
  return ["Valid", "bg-emerald-50 text-emerald-700 border-emerald-200"];
}

function GenericRecordEditor({ schema, records, onChange }) {
  function addRecord() {
    onChange([...records, { ...schema.newRecord, id: `${schema.listKey}_${Date.now()}` }]);
  }

  function updateRecord(index, field, value) {
    onChange(records.map((record, recordIndex) => recordIndex === index ? { ...record, [field]: value } : record));
  }

  function removeRecord(index) {
    onChange(records.filter((_, recordIndex) => recordIndex !== index));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={addRecord} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white">
          <Plus size={14} /> {schema.addLabel}
        </button>
      </div>

      {records.length === 0 ? (
        <ProfileEmptyState message={schema.empty} actionLabel={schema.addLabel} onAction={addRecord} />
      ) : (
        records.map((record, index) => (
          <ProfilePanel key={record?.id || index} title={`${schema.title.replace(" Chronological Records", "")} #${index + 1}`} accent={index % 2 ? "navy" : "orange"}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {schema.fields.map(([field, label, type = "text", options = []]) => (
                <ProfileFieldControl
                  key={field}
                  label={label}
                  type={type}
                  options={options}
                  value={type === "date" ? toInputDate(record?.[field]) : record?.[field]}
                  onChange={(value) => updateRecord(index, field, value)}
                  className={type === "textarea" ? "md:col-span-2 xl:col-span-3" : ""}
                />
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={() => removeRecord(index)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-extrabold text-red-600 hover:bg-red-100">
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </ProfilePanel>
        ))
      )}
    </div>
  );
}

export function TimelineSection({
  employee,
  activeSection,
  isEditing,
  onEdit,
  onListChange,
  onSave,
  onCancel,
}) {
  const schema = RECORD_SCHEMAS[activeSection] || RECORD_SCHEMAS.education;
  const records = Array.isArray(employee?.[schema.listKey]) ? employee[schema.listKey] : [];
  const [expanded, setExpanded] = useState({});

  return (
    <div className="space-y-4">
      <ProfileSectionHeader title={schema.title} subtitle={schema.subtitle} icon={schema.icon} isEditing={isEditing} onEdit={onEdit} />

      {isEditing ? (
        <GenericRecordEditor schema={schema} records={records} onChange={(next) => onListChange(schema.listKey, next)} />
      ) : activeSection === "education" ? (
        <div className="relative ml-2 sm:ml-3 space-y-3.5 border-l-2 border-slate-200 pl-4 sm:pl-6">
          {records.length === 0 ? <ProfileEmptyState message={schema.empty} actionLabel={schema.addLabel} onAction={onEdit} /> : records.map((record, index) => {
            const level = normalizeRecordValue(record, ["level"]);
            const school = normalizeRecordValue(record, ["school", "schoolName"]);
            const degree = normalizeRecordValue(record, ["degree", "degreeCourse"]);
            const honors = normalizeRecordValue(record, ["honors", "honorsReceived"]);
            return (
              <article key={record?.id || index} className="relative rounded-xl border border-[#D6E0EA] bg-white p-3.5 2xl:p-4 shadow-sm">
                <span className="absolute -left-[25px] sm:-left-[33px] top-5 h-3.5 w-3.5 rounded-full border-3 border-white bg-[#042C51] shadow" />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 sibs-text-micro font-extrabold uppercase tracking-wide text-[#042C51]">{level || "Education"}</span>
                      {honors && <span className="inline-flex items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-2 py-0.5 sibs-text-micro font-extrabold text-[#FF5C28]"><Award size={11} />{honors}</span>}
                    </div>
                    <h3 className="mt-2 sibs-text-xs 2xl:sibs-text-sm font-extrabold text-[#042C51]">{degree || "Academic Program"}</h3>
                    <p className="mt-0.5 sibs-text-micro font-bold text-[#667085]">{school || "—"}</p>
                  </div>
                  <div className="rounded-lg bg-[#F3F6FA] px-2.5 py-1.5 sibs-text-micro font-extrabold text-[#042C51]">{record?.from || "—"} — {record?.to || "Present"}</div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <ProfileReadField label="Highest Level / Units Earned" value={normalizeRecordValue(record, ["highestLevel", "highestLevelUnits"])} />
                  <ProfileReadField label="Year Graduated" value={record?.yearGraduated} />
                </div>
              </article>
            );
          })}
        </div>
      ) : activeSection === "eligibility" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {records.length === 0 ? <div className="sm:col-span-2"><ProfileEmptyState message={schema.empty} actionLabel={schema.addLabel} onAction={onEdit} /></div> : records.map((record, index) => {
            const [status, statusClass] = licenseStatus(record?.validityDate);
            return (
              <ProfilePanel key={record?.id || index} className="p-3.5 2xl:p-4">
                <div className="flex items-start justify-between gap-2 border-b border-[#E6ECF2] pb-2.5">
                  <div className="min-w-0">
                    <h3 className="break-words text-xs font-extrabold uppercase tracking-wide text-[#042C51]">{normalizeRecordValue(record, ["title", "eligibilityLicense"]) || "Eligibility / License"}</h3>
                    <p className="mt-0.5 font-mono sibs-text-micro text-[#667085]">License: {record?.licenseNumber || "—"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 sibs-text-micro font-extrabold uppercase tracking-wide ${statusClass}`}>{status}</span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <ProfileReadField label="Rating" value={record?.rating} />
                  <ProfileReadField label="Validity Date" value={formatDisplayDate(record?.validityDate)} />
                  <ProfileReadField label="Date of Exam / Conferment" value={formatDisplayDate(normalizeRecordValue(record, ["examDate", "dateOfExam"]))} />
                  <ProfileReadField label="Place of Exam / Conferment" value={normalizeRecordValue(record, ["examPlace", "placeOfExam"])} />
                </div>
              </ProfilePanel>
            );
          })}
        </div>
      ) : activeSection === "experience" ? (
        <div className="relative ml-2 sm:ml-3 space-y-3.5 border-l-2 border-slate-200 pl-4 sm:pl-6">
          {records.length === 0 ? <ProfileEmptyState message={schema.empty} actionLabel={schema.addLabel} onAction={onEdit} /> : records.map((record, index) => {
            const position = normalizeRecordValue(record, ["position", "positionTitle"]);
            const company = normalizeRecordValue(record, ["company", "companyOffice"]);
            const isOpen = expanded[index];
            return (
              <article key={record?.id || index} className="relative rounded-xl border border-[#D6E0EA] bg-white p-3.5 2xl:p-4 shadow-sm">
                <span className="absolute -left-[25px] sm:-left-[33px] top-5 h-3.5 w-3.5 rounded-full border-3 border-white bg-indigo-600 shadow" />
                <div className="flex flex-col gap-2 border-b border-[#E6ECF2] pb-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="sibs-text-xs 2xl:sibs-text-sm font-extrabold text-[#042C51]">{position || "—"}</h3>
                    <p className="mt-0.5 flex items-center gap-1.5 sibs-text-micro font-bold text-[#667085]"><Building2 size={13} />{company || "—"}</p>
                  </div>
                  <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 sibs-text-micro font-extrabold text-indigo-700">{record?.from || "—"} — {record?.to || "Present"}</span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <ProfileReadField label="Monthly Salary" value={normalizeRecordValue(record, ["salary", "monthlySalary"])} />
                  <ProfileReadField label="Salary / Job Grade" value={normalizeRecordValue(record, ["salaryGrade", "salaryJobGrade"])} />
                  <ProfileReadField label="Government Service" value={record?.governmentService} />
                </div>
                {record?.duties && (
                  <div className="mt-3 border-t border-[#E6ECF2] pt-2.5">
                    <button type="button" onClick={() => setExpanded((current) => ({ ...current, [index]: !current[index] }))} className="inline-flex items-center gap-1.5 sibs-text-micro font-extrabold text-[#042C51] hover:text-[#FF5C28]">
                      {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      {isOpen ? "Collapse Duties" : "Expand Duties & Responsibilities"}
                    </button>
                    {isOpen && <p className="mt-2 rounded-lg bg-[#F8FAFC] p-3 sibs-text-xs font-medium leading-relaxed text-[#52637A]">{record.duties}</p>}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : activeSection === "training" ? (
        <div className="space-y-3.5">
          {records.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ProfilePanel className="p-3"><p className="sibs-text-micro font-extrabold uppercase tracking-wide text-[#667085]">Total Programs</p><p className="mt-1 text-xl font-extrabold tabular-nums text-[#042C51]">{records.length}</p></ProfilePanel>
              <ProfilePanel className="p-3"><p className="sibs-text-micro font-extrabold uppercase tracking-wide text-[#667085]">Total LD Hours</p><p className="mt-1 text-xl font-extrabold tabular-nums text-[#FF5C28]">{records.reduce((sum, item) => sum + (Number(item?.hours || item?.hoursNumber) || 0), 0)}</p></ProfilePanel>
              <ProfilePanel className="p-3"><p className="sibs-text-micro font-extrabold uppercase tracking-wide text-[#667085]">Latest Training</p><p className="mt-1 truncate sibs-text-xs font-extrabold text-[#042C51]">{normalizeRecordValue(records[0], ["title", "trainingTitle"]) || "—"}</p></ProfilePanel>
            </div>
          )}
          {records.length === 0 ? <ProfileEmptyState message={schema.empty} actionLabel={schema.addLabel} onAction={onEdit} /> : records.map((record, index) => (
            <ProfilePanel key={record?.id || index} className="p-3.5 2xl:p-4">
              <div className="flex flex-col gap-2 border-b border-[#E6ECF2] pb-2.5 sm:flex-row sm:items-start sm:justify-between">
                <div><h3 className="sibs-text-xs 2xl:sibs-text-sm font-extrabold text-[#042C51]">{normalizeRecordValue(record, ["title", "trainingTitle"]) || "—"}</h3><p className="mt-0.5 sibs-text-micro font-semibold text-[#667085]">Conducted by <strong className="font-extrabold text-[#042C51]">{record?.conductedBy || "—"}</strong></p></div>
                <div className="text-left sm:text-right"><span className="rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 sibs-text-micro font-extrabold text-sky-700">{normalizeRecordValue(record, ["type", "typeOfLD"]) || "Learning & Development"}</span><p className="mt-1 font-mono sibs-text-micro font-bold text-[#667085]">{normalizeRecordValue(record, ["hours", "hoursNumber"]) || "0"} hours</p></div>
              </div>
              <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#F3F6FA] px-2.5 py-1.5 sibs-text-micro font-bold text-[#042C51]"><CalendarDays size={13} className="text-[#FF5C28]" />{formatDisplayDate(record?.from)} to {formatDisplayDate(record?.to)}</p>
            </ProfilePanel>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {records.length === 0 ? <div className="sm:col-span-2"><ProfileEmptyState message={schema.empty} actionLabel={schema.addLabel} onAction={onEdit} /></div> : records.map((record, index) => (
            <ProfilePanel key={record?.id || index} className="p-3.5 2xl:p-4">
              <h3 className="border-b border-[#E6ECF2] pb-2.5 sibs-text-xs 2xl:sibs-text-sm font-extrabold text-[#042C51]">{record?.name || "—"}</h3>
              <div className="mt-3 space-y-2">
                <ProfileReadField label="Address" value={record?.address} />
                <ProfileReadField label="Contact Number" value={record?.telNo || record?.contact} />
              </div>
            </ProfilePanel>
          ))}
        </div>
      )}

      {isEditing && <ProfileSaveBar label={schema.title} onCancel={onCancel} onSave={onSave} />}
    </div>
  );
}

