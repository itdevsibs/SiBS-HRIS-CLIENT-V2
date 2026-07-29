import { useState } from "react";
import { Award, Plus, Sparkles, Star, Users, X } from "lucide-react";

import { cleanText } from "../../../../lib/utils/employees/employeeProfileHelpers.js";
import ProfileSectionHeader from "../shared/ProfileSectionHeader.jsx";
import ProfilePanel from "../shared/ProfilePanel.jsx";
import ProfileEmptyState from "../shared/ProfileEmptyState.jsx";
import ProfileSaveBar from "../shared/ProfileSaveBar.jsx";

function StringListEditor({ items, placeholder, addLabel, onChange }) {
  const [draft, setDraft] = useState("");

  function addItem(event) {
    event.preventDefault();
    const next = cleanText(draft);
    if (!next || items.includes(next)) return;
    onChange([...items, next]);
    setDraft("");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addItem} className="flex flex-col gap-2 sm:flex-row">
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={placeholder} className="h-10 flex-1 rounded-xl border border-[#D0D5DD] bg-[#F8FAFC] px-3 text-xs font-semibold outline-none focus:border-[#042C51] focus:bg-white" />
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white"><Plus size={14} />{addLabel}</button>
      </form>
      <div className="flex flex-wrap gap-2 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
        {items.length === 0 ? <p className="text-xs font-semibold text-[#98A2B3]">No entries added.</p> : items.map((item, index) => (
          <span key={`${item}-${index}`} className="inline-flex max-w-full items-center gap-2 rounded-xl border border-[#D6E0EA] bg-white px-3 py-2 text-xs font-extrabold text-[#042C51]">
            <span className="break-words">{typeof item === "string" ? item : item?.name || "—"}</span>
            <button type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="text-red-500"><X size={13} /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

export function SkillsSection({
  employee,
  selectedSubTab,
  isEditing,
  onEdit,
  onListChange,
  onSave,
  onCancel,
}) {
  const config = {
    skills: ["Skills Inventory", "Documented technical, soft-skill, and operational proficiencies.", Sparkles, "skills"],
    recognitions: ["Honors & Recognition", "Awards, distinctions, and employee achievements.", Award, "recognitions"],
    organizations: ["Professional Affiliations", "Associations, organizations, and active memberships.", Users, "organizations"],
  }[selectedSubTab] || ["Skills Inventory", "Documented proficiencies.", Sparkles, "skills"];
  const [title, subtitle, Icon, listKey] = config;
  const items = Array.isArray(employee?.[listKey]) ? employee[listKey] : [];

  return (
    <div className="space-y-4">
      <ProfileSectionHeader title={title} subtitle={subtitle} icon={Icon} isEditing={isEditing} onEdit={onEdit} />

      {isEditing ? (
        <ProfilePanel title={`Manage ${title}`}>
          <StringListEditor items={items} placeholder={`Enter ${selectedSubTab === "skills" ? "a skill" : "a record"}...`} addLabel="Add Entry" onChange={(next) => onListChange(listKey, next)} />
        </ProfilePanel>
      ) : selectedSubTab === "skills" ? (
        <ProfilePanel title="Recognized Competencies">
          {items.length === 0 ? <ProfileEmptyState message="No skills logged yet." actionLabel="Add skills" onAction={onEdit} /> : (
            <div className="flex flex-wrap gap-2">
              {items.map((item, index) => (
                <span key={index} className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-[#E9F0FC] px-3.5 py-2 text-xs font-extrabold text-[#042C51] transition hover:bg-[#042C51] hover:text-white"><Star size={14} className="fill-[#FF5C28] text-[#FF5C28]" />{typeof item === "string" ? item : item?.name || "—"}</span>
              ))}
            </div>
          )}
        </ProfilePanel>
      ) : selectedSubTab === "recognitions" ? (
        <ProfilePanel>
          {items.length === 0 ? <ProfileEmptyState message="No recognition records logged." actionLabel="Add recognition" onAction={onEdit} /> : <div className="space-y-3">{items.map((item, index) => <div key={index} className="flex items-start gap-3 rounded-xl bg-[#F8FAFC] p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#FF5C28]"><Award size={16} /></span><p className="text-xs font-bold leading-6 text-[#344054]">{typeof item === "string" ? item : item?.name || "—"}</p></div>)}</div>}
        </ProfilePanel>
      ) : (
        <ProfilePanel>
          {items.length === 0 ? <ProfileEmptyState message="No organization memberships logged." actionLabel="Add organization" onAction={onEdit} /> : <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{items.map((item, index) => <div key={index} className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] p-4"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Users size={17} /></span><p className="text-xs font-extrabold text-[#344054]">{typeof item === "string" ? item : item?.name || "—"}</p></div>)}</div>}
        </ProfilePanel>
      )}

      {isEditing && <ProfileSaveBar label={title} onCancel={onCancel} onSave={onSave} />}
    </div>
  );
}

