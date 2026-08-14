import { useState } from "react";
import { CalendarDays, FileText, Lock, Save, Trash2, User } from "lucide-react";

import { cleanText, formatDisplayDate } from "../../../../lib/utils/employees/employeeProfileHelpers.js";
import ProfileSectionHeader from "../shared/ProfileSectionHeader.jsx";
import ProfilePanel from "../shared/ProfilePanel.jsx";
import ProfileEmptyState from "../shared/ProfileEmptyState.jsx";

export function NotesSection({ employee, onCommitNote, onFeedback, canEditDetails = false }) {
  const existingHistory = Array.isArray(employee?.notesHistory) ? employee.notesHistory : [];
  const seedHistory = existingHistory.length > 0 ? existingHistory : employee?.notes ? [{ id: "current_note", content: employee.notes, date: employee?.updatedAt || employee?.updated_at || "", author: employee?.updatedBy || "HR Administrator" }] : [];
  const [history, setHistory] = useState(seedHistory);
  const [draft, setDraft] = useState("");

  function saveNote(event) {
    event.preventDefault();
    if (!canEditDetails) return;
    if (!cleanText(draft)) {
      onFeedback?.("Write a note before saving.", "error");
      return;
    }
    const note = { id: `note_${Date.now()}`, content: draft.trim(), date: new Date().toISOString(), author: "Current HR User" };
    const nextHistory = [note, ...history];
    setHistory(nextHistory);
    setDraft("");
    onCommitNote?.(note.content, nextHistory);
    onFeedback?.("Private note logged locally.", "success");
  }

  function removeNote(id) {
    if (!canEditDetails) return;
    if (!window.confirm("Remove this private note?")) return;
    const nextHistory = history.filter((item) => item.id !== id);
    setHistory(nextHistory);
    onCommitNote?.(nextHistory[0]?.content || "", nextHistory);
    onFeedback?.("Private note deleted locally.", "success");
  }

  return (
    <div className="space-y-4">
      <ProfileSectionHeader title="Private Operational Notes" subtitle="Confidential administrative notes visible only to authorized HR users." icon={FileText} />
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs leading-5 text-red-800"><Lock size={18} className="mt-0.5 shrink-0 text-red-600" /><div><p className="font-extrabold uppercase tracking-wide">Restricted HR information</p><p className="mt-1 font-medium">Keep employee notes factual, work-related, and limited to authorized administrative use.</p></div></div>
      {canEditDetails ? (
        <ProfilePanel title="Compose New Administrative Note">
          <form onSubmit={saveNote} className="space-y-3"><textarea rows={5} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Document a private administrative note..." className="w-full resize-y rounded-xl border border-[#D0D5DD] bg-[#F8FAFC] p-3.5 text-xs font-semibold leading-6 outline-none focus:border-[#042C51] focus:bg-white" /><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><span className="text-[10px] font-medium text-[#667085]">The entry will be timestamped under the current HR user.</span><button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#042C51] px-5 text-xs font-extrabold text-white"><Save size={14} className="text-[#FF5C28]" />Log Internal Note</button></div></form>
        </ProfilePanel>
      ) : null}
      <div className="mt-6 space-y-4"><h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">Confidential History ({history.length})</h3>{history.length === 0 ? <ProfileEmptyState message="No private notes logged." /> : history.map((note) => <article key={note.id} className="group relative rounded-2xl border border-[#D6E0EA] bg-white p-5"><div className="flex flex-col gap-1 border-b border-[#E6ECF2] pb-3 sm:flex-row sm:items-center sm:justify-between"><span className="flex items-center gap-2 text-xs font-extrabold text-[#042C51]"><User size={14} className="text-[#667085]" />{note.author || "HR User"}</span><span className="flex items-center gap-1.5 font-mono text-[10px] text-[#667085]"><CalendarDays size={13} />{formatDisplayDate(note.date)}</span></div><p className="mt-4 whitespace-pre-wrap text-xs font-semibold leading-6 text-[#52637A]">{note.content}</p>{canEditDetails ? <button type="button" onClick={() => removeNote(note.id)} className="absolute bottom-4 right-4 rounded-lg p-1.5 text-red-500 opacity-0 hover:bg-red-50 group-hover:opacity-100" title="Delete note"><Trash2 size={14} /></button> : null}</article>)}</div>
    </div>
  );
}
