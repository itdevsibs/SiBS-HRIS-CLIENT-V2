import React, { useState } from "react";
import { BookOpen } from "lucide-react";
import { ModalShell } from "@/components/ui";

export default function AssignTrainingActivityModal({
  isOpen,
  onClose,
  trainingDate,
  availableTrainers = [],
  defaultTrainer = "",
  userRole = "",
  userName = "Demo staff",
  onSave,
}) {
  const [activity, setActivity] = useState({
    type: "Material",
    title: "",
    details: "",
    duration: "20 min",
    priority: "Normal",
    trainer: defaultTrainer || availableTrainers[0] || "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!activity.title.trim() || !activity.details.trim() || !activity.duration.trim()) {
      return;
    }

    onSave?.({
      type: activity.type,
      title: activity.title.trim(),
      description: activity.details.trim().slice(0, 145),
      details: activity.details.trim(),
      category: activity.type === "Material" ? "Learning" : "Practice",
      duration: activity.duration.trim(),
      priority: activity.priority,
      trainer: activity.trainer || defaultTrainer,
      owner: userName,
    });

    onClose();
  };

  const filteredTrainers = availableTrainers.filter(
    (name) => userRole !== "Trainer" || name === defaultTrainer
  );

  return (
    <ModalShell
      open={isOpen}
      onClose={onClose}
      variant="navy"
      maxWidth="max-w-lg"
      icon={BookOpen}
      title="New Training Activity"
      badge={trainingDate}
      subtitle="Assign learning material, practical module, or task criteria to trainee"
      footerMeta={
        <p className="sibs-text-xs text-sibs-muted">
          Activities are recorded under trainee learning milestone records.
        </p>
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="sibs-modal-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="assign-training-activity-form"
            className="sibs-modal-btn-primary"
          >
            Save Activity
          </button>
        </>
      }
    >
      <form
        id="assign-training-activity-form"
        onSubmit={handleSubmit}
        className="space-y-4 p-4 sm:p-6"
        aria-label="Assign training activity form"
      >
        <div>
          <label
            htmlFor="assign-activity-type"
            className="block text-xs font-extrabold text-sibs-navy mb-1"
          >
            Activity Type
          </label>
          <select
            id="assign-activity-type"
            value={activity.type}
            onChange={(e) =>
              setActivity((p) => ({ ...p, type: e.target.value }))
            }
            className="block w-full rounded-xl border border-sibs-border bg-white p-2.5 text-xs font-semibold text-sibs-navy outline-none focus:border-sibs-orange focus:ring-1 focus:ring-sibs-orange"
          >
            <option value="Material">Learning Material</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="assign-activity-title"
            className="block text-xs font-extrabold text-sibs-navy mb-1"
          >
            Activity Title <span className="text-sibs-orange">*</span>
          </label>
          <input
            id="assign-activity-title"
            required
            maxLength={140}
            value={activity.title}
            onChange={(e) =>
              setActivity((p) => ({ ...p, title: e.target.value }))
            }
            className="block w-full rounded-xl border border-sibs-border bg-white p-2.5 text-xs font-semibold text-sibs-navy placeholder:text-slate-400 outline-none focus:border-sibs-orange focus:ring-1 focus:ring-sibs-orange"
            placeholder="Module or assignment title..."
          />
        </div>

        <div>
          <label
            htmlFor="assign-activity-details"
            className="block text-xs font-extrabold text-sibs-navy mb-1"
          >
            Learning Instructions &amp; Success Criteria{" "}
            <span className="text-sibs-orange">*</span>
          </label>
          <textarea
            id="assign-activity-details"
            required
            rows={4}
            value={activity.details}
            onChange={(e) =>
              setActivity((p) => ({ ...p, details: e.target.value }))
            }
            className="block w-full rounded-xl border border-sibs-border bg-white p-2.5 text-xs text-sibs-navy placeholder:text-slate-400 outline-none focus:border-sibs-orange focus:ring-1 focus:ring-sibs-orange leading-relaxed"
            placeholder="Enter clear instructions or success metrics..."
          />
        </div>

        <div>
          <label
            htmlFor="assign-activity-trainer"
            className="block text-xs font-extrabold text-sibs-navy mb-1"
          >
            Assigned Trainer
          </label>
          <select
            id="assign-activity-trainer"
            required
            value={activity.trainer}
            onChange={(e) =>
              setActivity((p) => ({ ...p, trainer: e.target.value }))
            }
            className="block w-full rounded-xl border border-sibs-border bg-white p-2.5 text-xs font-semibold text-sibs-navy outline-none focus:border-sibs-orange focus:ring-1 focus:ring-sibs-orange"
          >
            {filteredTrainers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="assign-activity-duration"
              className="block text-xs font-extrabold text-sibs-navy mb-1"
            >
              Estimated Duration
            </label>
            <input
              id="assign-activity-duration"
              value={activity.duration}
              required
              onChange={(e) =>
                setActivity((p) => ({ ...p, duration: e.target.value }))
              }
              className="block w-full rounded-xl border border-sibs-border bg-white p-2.5 text-xs font-semibold text-sibs-navy outline-none focus:border-sibs-orange focus:ring-1 focus:ring-sibs-orange"
            />
          </div>

          <div>
            <label
              htmlFor="assign-activity-priority"
              className="block text-xs font-extrabold text-sibs-navy mb-1"
            >
              Priority
            </label>
            <select
              id="assign-activity-priority"
              value={activity.priority}
              onChange={(e) =>
                setActivity((p) => ({ ...p, priority: e.target.value }))
              }
              className="block w-full rounded-xl border border-sibs-border bg-white p-2.5 text-xs font-semibold text-sibs-navy outline-none focus:border-sibs-orange focus:ring-1 focus:ring-sibs-orange"
            >
              <option value="Normal">Normal</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
