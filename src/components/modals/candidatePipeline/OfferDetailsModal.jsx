import React from "react";
import {
  accountOptions,
  hiringRequirementOptions,
} from "../../../lib/utils/candidatePipeline/candidatePipelineConstants";
import {
  inputClass,
  textareaClass,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";
import { ArrowRight, X } from "lucide-react";

const OfferDetailsModal = ({
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
      className="fixed inset-0 z-[10004] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Offer Details for Approval
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Add the final assignment and pay details. Approval will be managed
              in the Offers page.
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
                Hiring Requirement / PRF <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.hiringRequirementId}
                onChange={(e) => {
                  const selectedRequirement = hiringRequirementOptions.find(
                    (item) => item.id === e.target.value,
                  );
                  setForm({
                    ...form,
                    hiringRequirementId: e.target.value,
                    roleTitle: selectedRequirement?.roleTitle || form.roleTitle,
                    account: selectedRequirement?.account || form.account,
                  });
                }}
                className={inputClass()}
              >
                <option value="">Select hiring requirement / PRF</option>
                {hiringRequirementOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                Final role and final account are assigned here, not when the
                candidate enters the pipeline.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Final Role Title <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.roleTitle}
                  onChange={(e) =>
                    setForm({ ...form, roleTitle: e.target.value })
                  }
                  className={inputClass()}
                  placeholder="Example: Customer Service Representative"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Final Account <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.account}
                  onChange={(e) =>
                    setForm({ ...form, account: e.target.value })
                  }
                  className={inputClass()}
                >
                  <option value="">Select account</option>
                  {accountOptions
                    .filter(
                      (account) =>
                        account !== "All Accounts" &&
                        account !== "Not assigned yet",
                    )
                    .map((account) => (
                      <option key={account} value={account}>
                        {account}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Basic Pay <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.basicPay}
                  onChange={(e) =>
                    setForm({ ...form, basicPay: e.target.value })
                  }
                  className={inputClass()}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Deminimis / Daily Rate <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.deminimisDailyRate}
                  onChange={(e) =>
                    setForm({ ...form, deminimisDailyRate: e.target.value })
                  }
                  className={inputClass()}
                  placeholder="0.00"
                />
              </div>
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
                placeholder="Example: Offer prepared after passed interview."
              />
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold leading-6 text-sibs-primary-1">
              After proceeding, the candidate will move to Offered and will be
              available in the Offers page for approval and contract sending.
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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <ArrowRight size={16} />
              Proceed for Approval
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferDetailsModal;
