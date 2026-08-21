import { X, RefreshCcw, Loader2 } from "lucide-react";
import { useTalentPool } from "../../../services/context/TalentPoolContext";
import {
  inputClass,
  textareaClass,
} from "../../../lib/utils/talentPool/talentPoolHelpers";

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
      className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[10003] flex h-dvh items-center justify-center p-2 font-jakarta sm:p-4"
      onClick={closeStatus}
    >
      <div
        className="sibs-modal-pop-in relative flex w-full max-w-lg flex-col overflow-visible rounded-2xl border border-sibs-border bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* SiBS Standard Dark Navy Modal Header */}
        <header className="shrink-0 rounded-t-2xl bg-sibs-navy px-4 py-3 text-white sm:px-6 2xl:py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex h-8.5 w-8.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-xl bg-sibs-orange text-white shadow-xs">
                <RefreshCcw size={16} />
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xs 2xl:text-sm font-extrabold text-white">
                    Update Candidate Status
                  </h2>

                  <span className="rounded bg-white/10 px-2 py-0.5 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-white/90 ring-1 ring-white/15">
                    Talent Pool Status
                  </span>
                </div>

                <p className="mt-0.5 truncate text-[10px] 2xl:text-[11px] font-semibold text-blue-100">
                  Update classification and recruitment stage for this candidate.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeStatus}
              disabled={isSaving}
              className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white/80 transition hover:border-sibs-orange/60 hover:bg-sibs-orange hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Modal Body with Section Cards */}
        <div className="overflow-visible bg-[#F7F9FC] p-4 sm:p-5 space-y-3.5">
          {/* Candidate Summary Card */}
          <div className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-[0_8px_22px_rgba(4,44,81,0.04)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#667085]">
                  Candidate
                </p>
                <h3 className="mt-0.5 truncate text-sm font-extrabold text-[#042C51]">
                  {statusTarget.name}
                </h3>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#667085]">
                  Current Status
                </p>
                <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-[#DCE6F1] bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-extrabold text-[#042C51]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF5C28]" />
                  {statusTarget.status || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="relative z-[50] overflow-visible rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-[0_8px_22px_rgba(4,44,81,0.04)]">
            <form
              id="update-status-form"
              onSubmit={submitStatus}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-[#042C51]">
                  New Status <span className="text-red-500">*</span>
                </label>
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
                <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-[#042C51]">
                  Remarks
                </label>
                <textarea
                  rows={3}
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
          </div>
        </div>

        {/* Standard SiBS Modal Footer */}
        <footer className="relative z-[10] shrink-0 rounded-b-2xl border-t border-sibs-border bg-white px-4 py-2.5 sm:px-6 sm:py-3">
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={closeStatus}
              disabled={isSaving}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 2xl:gap-2 rounded-lg border border-sibs-border bg-white px-4 sibs-text-xs font-extrabold text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-sibs-cream-subtle hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="update-status-form"
              disabled={isSaving || !statusForm.status}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 2xl:gap-2 rounded-lg bg-sibs-orange px-4.5 sibs-text-xs font-extrabold text-white shadow-xs transition hover:bg-sibs-orange/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sibs-orange/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <RefreshCcw size={15} />
              )}
              {isSaving ? "Saving..." : "Save Status"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
