import {
  Heart,
  Mail,
  Phone,
  Plus,
  ShieldAlert,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";

import { cleanText, formatDisplayDate, toInputDate } from "../../../../lib/utils/employees/employeeProfileHelpers.js";
import ProfileSectionHeader from "../shared/ProfileSectionHeader.jsx";
import ProfilePanel from "../shared/ProfilePanel.jsx";
import { ProfileFieldControl, ProfileReadField } from "../shared/ProfileFields.jsx";
import ProfileEmptyState from "../shared/ProfileEmptyState.jsx";
import ProfileSaveBar from "../shared/ProfileSaveBar.jsx";

function calculateAge(value) {
  if (!value) return "—";
  const dateKey = toInputDate(value);
  const [year, month, day] = dateKey.split("-").map(Number);
  const birth = new Date(year, month - 1, day);
  if (Number.isNaN(birth.getTime())) return "—";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDifference = today.getMonth() - birth.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) age -= 1;
  return `${Math.max(age, 0)} yrs old`;
}

export function FamilySection({
  employee,
  selectedSubTab,
  isEditing,
  onEdit,
  onChange,
  onListChange,
  onSave,
  onCancel,
}) {
  const titleMap = {
    spouse: ["Spouse Information", "Official spouse and employment declarations.", Heart],
    parents: ["Parents Declaration", "Official father and mother details.", Users],
    children: ["Children Registered Records", "Dependent children records for benefits and tax allocations.", Sparkles],
    emergency: ["Emergency Contact Person", "Critical next-of-kin contact information.", ShieldAlert],
  };
  const [title, subtitle, Icon] = titleMap[selectedSubTab] || titleMap.spouse;
  const children = Array.isArray(employee?.children) ? employee.children : [];

  function updateChild(index, field, value) {
    onListChange(
      "children",
      children.map((child, childIndex) =>
        childIndex === index ? { ...child, [field]: value } : child,
      ),
    );
  }

  return (
    <div className="space-y-4">
      <ProfileSectionHeader title={title} subtitle={subtitle} icon={Icon} isEditing={isEditing} onEdit={onEdit} />

      {selectedSubTab === "spouse" && (
        isEditing ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ProfileFieldControl label="Surname" value={employee?.spouseSurname} onChange={(v) => onChange("spouseSurname", v)} />
            <ProfileFieldControl label="First Name" value={employee?.spouseFirstName} onChange={(v) => onChange("spouseFirstName", v)} />
            <ProfileFieldControl label="Middle Name" value={employee?.spouseMiddleName} onChange={(v) => onChange("spouseMiddleName", v)} />
            <ProfileFieldControl label="Occupation" value={employee?.spouseOccupation} onChange={(v) => onChange("spouseOccupation", v)} />
            <ProfileFieldControl label="Employer / Business" value={employee?.spouseEmployer} onChange={(v) => onChange("spouseEmployer", v)} />
            <ProfileFieldControl label="Telephone" value={employee?.spouseTelephone} onChange={(v) => onChange("spouseTelephone", v)} />
            <ProfileFieldControl label="Business Address" type="textarea" value={employee?.spouseBusinessAddress} onChange={(v) => onChange("spouseBusinessAddress", v)} className="md:col-span-3" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <ProfileReadField label="Surname" value={employee?.spouseSurname} />
            <ProfileReadField label="First Name" value={employee?.spouseFirstName} />
            <ProfileReadField label="Middle Name" value={employee?.spouseMiddleName} />
            <ProfileReadField label="Occupation" value={employee?.spouseOccupation} />
            <ProfileReadField label="Employer / Business" value={employee?.spouseEmployer} />
            <ProfileReadField label="Telephone" value={employee?.spouseTelephone} />
            <ProfileReadField label="Business Address" value={employee?.spouseBusinessAddress} className="sm:col-span-2 lg:col-span-3" />
          </div>
        )
      )}

      {selectedSubTab === "parents" && (
        isEditing ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ProfilePanel title="Father's Name Information" accent="navy">
              <div className="space-y-4">
                <ProfileFieldControl label="Surname" value={employee?.fatherSurname} onChange={(v) => onChange("fatherSurname", v)} />
                <ProfileFieldControl label="First Name" value={employee?.fatherFirstName} onChange={(v) => onChange("fatherFirstName", v)} />
                <ProfileFieldControl label="Middle Name" value={employee?.fatherMiddleName} onChange={(v) => onChange("fatherMiddleName", v)} />
              </div>
            </ProfilePanel>
            <ProfilePanel title="Mother's Maiden Name Information">
              <div className="space-y-4">
                <ProfileFieldControl label="Maiden Surname" value={employee?.motherMaidenSurname} onChange={(v) => onChange("motherMaidenSurname", v)} />
                <ProfileFieldControl label="First Name" value={employee?.motherFirstName} onChange={(v) => onChange("motherFirstName", v)} />
                <ProfileFieldControl label="Middle Name" value={employee?.motherMiddleName} onChange={(v) => onChange("motherMiddleName", v)} />
              </div>
            </ProfilePanel>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ProfilePanel title="Father's Details" accent="navy">
              <div className="space-y-5">
                <ProfileReadField label="Surname" value={employee?.fatherSurname} />
                <ProfileReadField label="First Name" value={employee?.fatherFirstName} />
                <ProfileReadField label="Middle Name" value={employee?.fatherMiddleName} />
              </div>
            </ProfilePanel>
            <ProfilePanel title="Mother's Details (Maiden Name)">
              <div className="space-y-5">
                <ProfileReadField label="Maiden Surname" value={employee?.motherMaidenSurname} />
                <ProfileReadField label="First Name" value={employee?.motherFirstName} />
                <ProfileReadField label="Middle Name" value={employee?.motherMiddleName} />
              </div>
            </ProfilePanel>
          </div>
        )
      )}

      {selectedSubTab === "children" && (
        isEditing ? (
          <ProfilePanel title={`Children Dependents (${children.length})`}>
            <div className="mb-4 flex justify-end">
              <button type="button" onClick={() => onListChange("children", [...children, { id: `child_${Date.now()}`, name: "", birthDate: "" }])} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white">
                <Plus size={14} /> Add Dependent
              </button>
            </div>
            {children.length === 0 ? (
              <ProfileEmptyState message="No children records. Add a dependent to begin." />
            ) : (
              <div className="space-y-4">
                {children.map((child, index) => (
                  <div key={child?.id || index} className="grid grid-cols-1 gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
                    <ProfileFieldControl label="Child's Full Name" value={child?.name} onChange={(v) => updateChild(index, "name", v)} required />
                    <ProfileFieldControl label="Birth Date" type="date" value={toInputDate(child?.birthDate)} onChange={(v) => updateChild(index, "birthDate", v)} required />
                    <button type="button" onClick={() => onListChange("children", children.filter((_, childIndex) => childIndex !== index))} className="flex h-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 px-3 text-red-600 hover:bg-red-100" title="Remove child">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ProfilePanel>
        ) : (
          <ProfilePanel>
            {children.length === 0 ? (
              <ProfileEmptyState message="No children registered." actionLabel="Register a dependent child" onAction={onEdit} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E6ECF2] bg-[#F8FAFC] text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
                      <th className="rounded-l-xl px-4 py-3">Child's Complete Name</th>
                      <th className="px-4 py-3">Birth Date</th>
                      <th className="rounded-r-xl px-4 py-3">Calculated Age</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6ECF2]">
                    {children.map((child, index) => (
                      <tr key={child?.id || index}>
                        <td className="px-4 py-4 font-extrabold text-[#344054]">{child?.name || "—"}</td>
                        <td className="px-4 py-4 font-semibold text-[#667085]">{formatDisplayDate(child?.birthDate)}</td>
                        <td className="px-4 py-4"><span className="rounded-full bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold text-[#042C51]">{calculateAge(child?.birthDate)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ProfilePanel>
        )
      )}

      {selectedSubTab === "emergency" && (
        isEditing ? (
          <ProfilePanel title="Modify Emergency Contact">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ProfileFieldControl label="Name" value={employee?.emergencyName} onChange={(v) => onChange("emergencyName", v)} required />
              <ProfileFieldControl label="Relationship" value={employee?.emergencyRelationship} onChange={(v) => onChange("emergencyRelationship", v)} required />
              <ProfileFieldControl label="Phone Number" value={employee?.emergencyPhone} onChange={(v) => onChange("emergencyPhone", v)} required />
              <ProfileFieldControl label="Email" type="email" value={employee?.emergencyEmail} onChange={(v) => onChange("emergencyEmail", v)} />
            </div>
          </ProfilePanel>
        ) : (
          <ProfilePanel className="max-w-2xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-red-100 bg-red-50 text-lg font-extrabold text-red-600">
                {cleanText(employee?.emergencyName).slice(0, 2).toUpperCase() || "EC"}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-extrabold text-[#042C51]">{employee?.emergencyName || "—"}</h3>
                <span className="mt-1 inline-flex rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-red-700">{employee?.emergencyRelationship || "Emergency Contact"}</span>
                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[#E6ECF2] pt-4 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#344054]"><Phone size={15} className="text-[#667085]" />{employee?.emergencyPhone || "—"}</div>
                  <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-[#52637A]"><Mail size={15} className="shrink-0 text-[#667085]" /><span className="truncate">{employee?.emergencyEmail || "—"}</span></div>
                </div>
              </div>
            </div>
          </ProfilePanel>
        )
      )}

      {isEditing && <ProfileSaveBar label={title} onCancel={onCancel} onSave={onSave} />}
    </div>
  );
}

