import React, { useState } from "react";
import { BookOpen, Send } from "lucide-react";
import { ModalShell, StatusBadge } from "@/components/ui";

export default function TraineeMaterialSubmissionModal({
  isOpen,
  onClose,
  activity,
  submission,
  status = "Not started",
  readableStatus = "Not started",
  statusExplanation = "",
  isEmployee = false,
  simulatedCurrentDate = "",
  assignedTrainerName = "",
  onSubmit,
}) {
  const [submissionNote, setSubmissionNote] = useState(
    submission?.note || ""
  );

  if (!isOpen || !activity) return null;

  const canSubmit =
    isEmployee &&
    activity.date <= simulatedCurrentDate &&
    ["Not started", "In progress", "Revision requested"].includes(status);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit || !submissionNote.trim()) return;
    onSubmit?.(submissionNote.trim());
    onClose();
  };

  return (
    <ModalShell
      open={isOpen}
      onClose={onClose}
      variant="navy"
      maxWidth="max-w-xl"
      icon={BookOpen}
      title={activity.title}
      badge={activity.category || "Learning Material"}
      subtitle={`${activity.duration || "20 min"} · Assigned by ${activity.owner || "Staff"}`}
      footerMeta={
        <p className="sibs-text-xs text-sibs-muted">
          Submissions are permanently recorded and reviewed by assigned trainers.
        </p>
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="sibs-modal-btn-secondary"
          >
            {canSubmit ? "Cancel" : "Close"}
          </button>
          {canSubmit ? (
            <button
              type="submit"
              form="trainee-material-submission-form"
              className="sibs-modal-btn-primary gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit to Trainer</span>
            </button>
          ) : null}
        </>
      }
    >
      <div className="space-y-4 p-4 sm:p-6 font-jakarta">
        {/* Status Pill & Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sibs-border bg-sibs-surface p-3.5">
          <div className="space-y-0.5">
            <span className="block sibs-text-micro font-bold uppercase tracking-wider text-sibs-muted">
              Current Activity Status
            </span>
            <p className="text-xs font-semibold text-sibs-navy">
              {readableStatus}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Description */}
        {activity.description ? (
          <div>
            <h4 className="sibs-text-micro font-extrabold uppercase tracking-wider text-sibs-muted mb-1">
              Description
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              {activity.description}
            </p>
          </div>
        ) : null}

        {/* Instructions */}
        <div className="rounded-xl border border-sibs-border bg-sibs-surface p-3.5 space-y-1">
          <strong className="block text-xs font-extrabold text-sibs-navy">
            Instructions &amp; Criteria:
          </strong>
          <p className="text-xs text-slate-600 leading-relaxed">
            {activity.details ||
              "Review guidelines, practice required steps, and upload or enter your completion notes below."}
          </p>
        </div>

        {/* Assignment Metadata */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-sibs-muted">
          <span>
            Assigned Trainer:{" "}
            <strong className="text-sibs-navy font-bold">
              {assignedTrainerName || "Not assigned"}
            </strong>
          </span>
          <span>•</span>
          <span>
            Scheduled Date:{" "}
            <strong className="text-sibs-navy font-bold">
              {activity.date}
            </strong>
          </span>
          <span>•</span>
          <span>
            Priority:{" "}
            <strong className="text-sibs-navy font-bold">
              {activity.priority || "Normal"}
            </strong>
          </span>
        </div>

        {statusExplanation ? (
          <p className="sibs-text-micro font-medium text-slate-500 italic">
            {statusExplanation}
          </p>
        ) : null}

        {/* Reviewer Feedback (if any) */}
        {submission?.feedback ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 space-y-1">
            <strong className="block sibs-text-micro uppercase font-extrabold text-sibs-navy">
              Trainer Feedback:
            </strong>
            <p className="text-xs text-sibs-navy leading-relaxed">
              {submission.feedback}
            </p>
          </div>
        ) : null}

        {/* Submission Form for Trainee */}
        {canSubmit ? (
          <form
            id="trainee-material-submission-form"
            onSubmit={handleSubmit}
            className="pt-2 border-t border-sibs-border space-y-2"
          >
            <label
              htmlFor="trainee-submission-notes"
              className="block text-xs font-extrabold text-sibs-navy"
            >
              Completion Notes / Submission Link{" "}
              <span className="text-sibs-orange">*</span>
            </label>
            <textarea
              id="trainee-submission-notes"
              rows={3}
              value={submissionNote}
              onChange={(e) => setSubmissionNote(e.target.value)}
              placeholder="Enter completion details, work simulation links, or questions for your trainer..."
              className="w-full rounded-xl border border-sibs-border p-2.5 text-xs text-sibs-navy placeholder:text-slate-400 outline-none focus:border-sibs-orange focus:ring-1 focus:ring-sibs-orange leading-relaxed"
              required
            />
          </form>
        ) : (
          <div className="pt-2 border-t border-sibs-border space-y-1">
            <span className="block sibs-text-micro font-bold uppercase tracking-wider text-sibs-muted">
              Trainee Submission Note
            </span>
            <p className="text-xs font-medium text-slate-700 bg-sibs-surface rounded-lg p-2.5 border border-sibs-border">
              {submission?.note || "No submission note recorded."}
            </p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
