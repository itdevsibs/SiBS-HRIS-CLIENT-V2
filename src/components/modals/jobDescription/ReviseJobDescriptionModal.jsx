import { PencilLine, X } from "lucide-react";
import InfoBox from "../../layout/InfoBox";

export default function ReviseJobDescriptionModal({
  open,
  item,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  if (!open || !item) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="revise-job-description-modal-title"
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2
              id="revise-job-description-modal-title"
              className="text-lg font-bold text-amber-700 sm:text-xl"
            >
              Update For Revision Job Description
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              After saving this revision, the JD will be tagged as Existing.
            </p>
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

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
              <div className="space-y-5">
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                  <h3 className="text-lg font-bold text-amber-700">
                    {item.roleTitle || "—"}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-amber-700/80">
                    {item.account || "—"} / {item.department || "—"}
                  </p>

                  <p className="mt-2 text-sm font-bold text-amber-700">
                    Current Status: {item.jdStatus || "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-bold text-[#101828]">
                    Revision Details
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                        Revised By <span className="text-red-500">*</span>
                      </label>

                      <input
                        readOnly
                        value={form.revisedBy || ""}
                        placeholder="Logged-in user account"
                        className="h-11 w-full cursor-not-allowed rounded-xl border border-[#E6ECF2] bg-gray-50 px-4 text-sm font-bold uppercase text-[#344054] outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                        New Status
                      </label>

                      <input
                        readOnly
                        value="Existing"
                        className="h-11 w-full cursor-not-allowed rounded-xl border border-emerald-100 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                        Revision Remarks <span className="text-red-500">*</span>
                      </label>

                      <textarea
                        required
                        rows={3}
                        value={form.revisionRemarks}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            revisionRemarks: e.target.value,
                          })
                        }
                        placeholder="Example: Updated QA coverage, responsibilities, and qualifications."
                        className="w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-bold text-[#101828]">
                    Updated JD Content
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                        Job Summary / Description{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <textarea
                        required
                        rows={4}
                        value={form.description}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            description: e.target.value,
                          })
                        }
                        className="w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                        Key Responsibilities{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <textarea
                        required
                        rows={4}
                        value={form.responsibilities}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            responsibilities: e.target.value,
                          })
                        }
                        className="w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                        Qualifications / Requirements{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <textarea
                        required
                        rows={4}
                        value={form.qualifications}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            qualifications: e.target.value,
                          })
                        }
                        className="w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                  <h3 className="text-sm font-bold text-sibs-primary-1">
                    Revision Rule
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                    A For Revision JD becomes Existing only after the revised
                    content is saved and the revision owner is recorded.
                  </p>
                </div>

                <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                  <h3 className="text-sm font-bold text-[#101828]">
                    Revision Audit
                  </h3>

                  <div className="mt-4 space-y-3">
                    <InfoBox label="JD Code" value={item.jdCode} />
                    <InfoBox label="Current Owner" value={item.owner} />
                    <InfoBox label="Requested By" value={item.requestedBy} />
                    <InfoBox label="Current Status" value={item.jdStatus} />
                    <InfoBox label="Next Status" value="Existing" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-gray-100 px-5 py-4 sm:px-6">
            <div className="flex flex-col justify-end gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white transition hover:opacity-90"
              >
                <PencilLine size={17} />
                Save Revision and Tag as Existing
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}