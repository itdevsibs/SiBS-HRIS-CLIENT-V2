import React, { useState, useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { ModalShell } from "@/components/ui";

const REQUEST_TYPES = [
  "Independent QA recheck",
  "Trainer coaching review",
  "Targeted trainee support",
];

const ASSIGNED_OPTIONS = [
  "Elena Santos (Quality Lead)",
  "Marcus Aurelius (Senior QDS)",
  "Maria Cruz (Lead Trainer)",
];

export default function QDSCreateRequestModal({
  open,
  onClose,
  onSubmit,
  trainees = [],
  defaultDate = "2026-10-25",
}) {
  const [targetEmp, setTargetEmp] = useState("");
  const [requestType, setRequestType] = useState(REQUEST_TYPES[0]);
  const [assignedTo, setAssignedTo] = useState(ASSIGNED_OPTIONS[0]);
  const [dueDate, setDueDate] = useState(defaultDate);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (trainees.length > 0 && !targetEmp) {
      setTargetEmp(trainees[0]?.sibsEmployeeId || trainees[0]?.id || "");
    }
  }, [trainees, targetEmp]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedTrainee = trainees.find(
      (t) => (t.sibsEmployeeId || t.id) === targetEmp
    );

    onSubmit?.({
      emp: targetEmp,
      trainer: selectedTrainee?.trainerName || "Maria Cruz",
      assignedTo,
      type: requestType,
      notes,
      due: dueDate,
    });

    // Reset notes
    setNotes("");
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      variant="navy"
      maxWidth="max-w-lg"
      icon={ShieldCheck}
      title="Create Quality Follow-Up Request"
      subtitle="Escalate to Quality Lead for independent audit or calibration"
      bodyClassName="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-white p-5 font-jakarta space-y-4"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="sibs-modal-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-qds-request-form"
            className="sibs-modal-btn-primary"
          >
            Create Request
          </button>
        </div>
      }
    >
      <form
        id="create-qds-request-form"
        onSubmit={handleSubmit}
        className="space-y-4 text-xs font-jakarta"
      >
        <div>
          <label className="sibs-modal-field-label">Select Trainee</label>
          <select
            value={targetEmp}
            onChange={(e) => setTargetEmp(e.target.value)}
            className="sibs-modal-input"
            required
          >
            {trainees.map((t) => {
              const id = t.sibsEmployeeId || t.id;
              return (
                <option key={id} value={id}>
                  {t.fullName} ({id}) — {t.trainerName || "No Trainer"}
                </option>
              );
            })}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="sibs-modal-field-label">Request Type</label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="sibs-modal-input"
            >
              {REQUEST_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="sibs-modal-field-label">Assign To</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="sibs-modal-input"
            >
              {ASSIGNED_OPTIONS.map((person) => (
                <option key={person} value={person}>
                  {person}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="sibs-modal-field-label">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="sibs-modal-input"
            required
          >
          </input>
        </div>

        <div>
          <label className="sibs-modal-field-label">Notes / Audit Instructions</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Specify audit focal points, calibration notes, or performance triggers..."
            className="sibs-modal-textarea"
            required
          />
        </div>
      </form>
    </ModalShell>
  );
}
