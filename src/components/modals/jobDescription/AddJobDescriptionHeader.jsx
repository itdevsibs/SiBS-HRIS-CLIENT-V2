import { UserPlus, X } from "lucide-react";

export default function AddJobDescriptionHeader({ onClose }) {
  return (
    <div className="shrink-0 border-b border-sibs-tertiary-9 bg-white px-5 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sibs-primary-1/10 text-sibs-primary-1">
            <UserPlus size={22} />
          </div>

          <div className="min-w-0">
            <h2
              id="add-job-description-modal-title"
              className="truncate text-xl font-bold text-sibs-primary-1 sm:text-2xl"
            >
              Add Job Description
            </h2>

            <p className="truncate text-sm text-sibs-tertiary-5">
              Create or track Job Description status for hiring requirements
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
