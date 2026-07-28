import { X, Save } from "lucide-react";
import { useTalentPool } from "../../../services/context/TalentPoolContext";
import {
  inputClass,
  textareaClass,
} from "../../../lib/utils/talentPool/talentPoolHelpers";
import { FieldLabel } from "../../recruitment/talentPool/TalentPoolShared";

export default function UpdateStatusModal() {
  const {
    statusTarget,
    statusForm,
    setStatusForm,
    closeStatus,
    submitStatus,
    statusOptions,
    isSaving,
  } = useTalentPool();

  if (!statusTarget) return null;

  return (
    <div
      className="sibs-modal-blur fixed inset-0 z-[10003] flex h-dvh items-center justify-center px-4 py-4"
      onClick={closeStatus}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1">
              Update Candidate Status
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              {statusTarget.name}
            </p>
          </div>

          <button
            type="button"
            onClick={closeStatus}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form
          id="update-status-form"
          onSubmit={submitStatus}
          className="space-y-4 p-5"
        >
          <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
              Current Status
            </p>
            <p className="mt-1 text-sm font-extrabold text-[#101828]">
              {statusTarget.status || "—"}
            </p>
          </div>

          <div>
            <FieldLabel>New Status</FieldLabel>
            <select
              value={statusForm.status}
              onChange={(event) =>
                setStatusForm({
                  ...statusForm,
                  status: event.target.value,
                })
              }
              required
              className={inputClass()}
            >
              <option value="">Select status</option>
              {statusOptions
                .filter((status) => status !== "All")
                .map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <FieldLabel>Remarks</FieldLabel>
            <textarea
              rows={4}
              value={statusForm.remarks}
              onChange={(event) =>
                setStatusForm({
                  ...statusForm,
                  remarks: event.target.value,
                })
              }
              placeholder="Add reason or notes for this status update."
              className={textareaClass()}
            />
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeStatus}
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="update-status-form"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />
              {isSaving ? "Saving..." : "Save Status"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
