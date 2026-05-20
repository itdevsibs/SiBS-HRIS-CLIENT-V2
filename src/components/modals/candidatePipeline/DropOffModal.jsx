import React from "react";
import {
  inputClass,
  textareaClass,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";
import { dropOffCategoryOptions } from "../../../lib/utils/candidatePipeline/candidatePipelineConstants";
import { UserX, X } from "lucide-react";

const DropOffModal = ({
  open,
  candidate,
  form,
  setForm,
  onClose,
  onSubmit,
}) => {
  if (!open || !candidate) return null;

  return (
    <div
      className="fixed inset-0 z-[10003] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Mark Candidate as Drop-off
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Capture reason before removing from active pipeline.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-5">
            <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
              <h3 className="text-lg font-bold text-sibs-primary-1">
                {candidate.name}
              </h3>
              <p className="mt-1 text-sm font-semibold text-sibs-primary-1/80">
                {candidate.roleAccount}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Reason Category <span className="text-red-500">*</span>
              </label>

              <select
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputClass()}
              >
                <option value="">Select category</option>
                {dropOffCategoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Drop-off Reason <span className="text-red-500">*</span>
              </label>

              <textarea
                required
                rows={4}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className={textareaClass()}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Remarks
              </label>

              <textarea
                rows={3}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className={textareaClass()}
              />
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700"
            >
              <UserX size={16} />
              Confirm Drop-off
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DropOffModal;
