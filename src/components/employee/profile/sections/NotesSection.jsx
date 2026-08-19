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
      <ProfileSectionHeader
        title="Private Operational Notes"
        subtitle="Confidential administrative notes visible only to authorized HR users."
        icon={FileText}
      />
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 2xl:p-4 text-xs leading-5 text-rose-800">
        <Lock size={16} className="mt-0.5 shrink-0 text-rose-600" />
        <div>
          <p className="sibs-text-micro font-extrabold uppercase tracking-wider text-rose-800">
            Restricted HR Information
          </p>
          <p className="mt-0.5 sibs-text-xs font-semibold text-rose-900">
            Keep employee notes factual, work-related, and limited to authorized administrative use.
          </p>
        </div>
      </div>
      {canEditDetails ? (
        <ProfilePanel title="Compose New Administrative Note">
          <form onSubmit={saveNote} className="space-y-3">
            <textarea
              rows={4}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Document a private administrative note..."
              className="w-full resize-y rounded-xl border border-[#D0D5DD] bg-[#F8FAFC] p-3 sibs-text-xs font-semibold leading-relaxed outline-none transition focus:border-[#042C51] focus:bg-white"
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="sibs-text-micro font-semibold text-[#667085]">
                The entry will be timestamped under the current HR user.
              </span>
              <button
                type="submit"
                className="inline-flex h-8.5 2xl:h-9 items-center justify-center gap-2 rounded-lg bg-[#042C51] px-4 sibs-text-micro 2xl:sibs-text-xs font-extrabold text-white transition hover:bg-[#063c6d]"
              >
                <Save size={14} className="text-[#FF5C28]" />
                Log Internal Note
              </button>
            </div>
          </form>
        </ProfilePanel>
      ) : null}
      <div className="mt-5 space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
          Confidential History ({history.length})
        </h3>
        {history.length === 0 ? (
          <ProfileEmptyState message="No private notes logged." />
        ) : (
          history.map((note) => (
            <article
              key={note.id}
              className="group relative rounded-xl border border-[#D6E0EA] bg-white p-4"
            >
              <div className="flex flex-col gap-1 border-b border-[#E6ECF2] pb-2.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2 sibs-text-xs font-extrabold text-[#042C51]">
                  <User size={13} className="text-[#667085]" />
                  {note.author || "HR User"}
                </span>
                <span className="flex items-center gap-1.5 font-mono sibs-text-micro text-[#667085]">
                  <CalendarDays size={12} />
                  {formatDisplayDate(note.date)}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap sibs-text-xs font-semibold leading-relaxed text-[#52637A]">
                {note.content}
              </p>
              {canEditDetails ? (
                <button
                  type="button"
                  onClick={() => removeNote(note.id)}
                  className="absolute bottom-3 right-3 rounded-lg p-1.5 text-rose-500 opacity-0 transition hover:bg-rose-50 group-hover:opacity-100"
                  title="Delete note"
                >
                  <Trash2 size={13} />
                </button>
              ) : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
