import { X } from "lucide-react";
// import {
//   inputClass,
//   textareaClass,
// } from "../../../lib/utils/offers/offerHelpers";
// import { declineCategoryOptions } from "../../../lib/utils/offers/offerConstants";

export default function DeclineResponseModal({
  open,
  offer,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  if (!open || !offer) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-red-700">
              Candidate Declined Contract
            </h2>
            <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
              {offer.candidateName}
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

        <form onSubmit={onSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
              Decline Category *
            </label>
            {/* <select
              required
              value={form.declineCategory}
              onChange={(e) =>
                setForm({ ...form, declineCategory: e.target.value })
              }
              className={inputClass()}
            >
              <option value="">Select category</option>
              {declineCategoryOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select> */}
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
              Decline Reason *
            </label>
            {/* <textarea
              required
              rows={4}
              value={form.declineReason}
              onChange={(e) =>
                setForm({ ...form, declineReason: e.target.value })
              }
              className={textareaClass()}
              placeholder="Reason from candidate"
            /> */}
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Save Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
