import React from "react";
import { X, CheckCircle2, CircleX, UserX, AlertCircle, Info } from "lucide-react";


const reasonCategoryOptions = [
  "No Response", "Personal Reason", "Schedule", "Accepted Other Offer",
  "Location Issue", "Incomplete Requirements", "Others"
];

// Reusable standard inputs from project theme
function inputClass(color = "sibs-primary-1") {
  return `h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-${color} focus:ring-4 focus:ring-${color}/10`;
}

function textareaClass(color = "sibs-primary-1") {
  return `w-full resize-none rounded-xl border border-[#E6ECF2] bg-white p-4 text-sm font-semibold outline-none transition focus:border-${color} focus:ring-4 focus:ring-${color}/10`;
}

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
};

export default function OutcomeModal({ open, record, type, form, setForm, onClose, onSubmit }) {
  if (!open || !record) return null;

  const isShow = type === "Show";
  const isNoShow = type === "No Show";
  const isWithdraw = type === "Withdrawn";

  // Dynamic Theme Colors based on action type
  const themeColor = isShow ? "emerald-600" : isNoShow ? "red-600" : "orange-600";
  const themeBg = isShow ? "bg-emerald-50 border-emerald-100" : isNoShow ? "bg-red-50 border-red-100" : "bg-orange-50 border-orange-100";
  const themeText = isShow ? "text-emerald-700" : isNoShow ? "text-red-700" : "text-orange-700";
  const Icon = isShow ? CheckCircle2 : isNoShow ? UserX : CircleX;

  return (
    // 1. Premium Backdrop
    <div className="sibs-modal-blur fixed inset-0 z-[10000] flex h-dvh items-center justify-center px-4 py-4 font-jakarta" onClick={onClose}>
      
      {/* 2. Premium Container with Pop-in Animation */}
      <div className="sibs-modal-pop-in flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide border ${themeBg} ${themeText}`}>
              <Icon size={14} /> Update Final Outcome
            </div>
            <h2 className="mt-3 text-xl font-extrabold text-[#101828]">
              {isShow ? "Mark as True Hire" : isNoShow ? "Mark as No Show" : "Mark as Pre-start Withdrawal"}
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Update the final onboarding status and provide necessary remarks.
            </p>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-[0.98]">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form id="outcome-form" onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-6">

            {/* 3. Candidate Context Card (Grounds the user) */}
            <div className={`rounded-xl border p-5 ${themeBg}`}>
              <h3 className={`text-lg font-extrabold ${themeText}`}>{record.candidateName}</h3>
              <p className={`mt-1 text-sm font-semibold opacity-80 ${themeText}`}>{record.roleTitle} / {record.account}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/60 bg-white/60 px-3 py-1 text-xs font-bold text-gray-700 backdrop-blur-sm">
                  Expected Start: {formatDateDisplay(record.expectedStartDate)}
                </span>
                <span className="rounded-full border border-white/60 bg-white/60 px-3 py-1 text-xs font-bold text-gray-700 backdrop-blur-sm">
                  Current: {record.showStatus}
                </span>
              </div>
            </div>

            {/* Dynamic Form Fields */}
            {isShow && (
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Actual Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  required 
                  type="date" 
                  value={form.actualStartDate}
                  onChange={(e) => setForm({ ...form, actualStartDate: e.target.value })}
                  className={inputClass("emerald-500")}
                />
              </div>
            )}

            {(isNoShow || isWithdraw) && (
              <>
                {/* Replaced with standard HTML Select element variant */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                    Reason Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.reasonCategory}
                    onChange={(e) => setForm({ ...form, reasonCategory: e.target.value })}
                    className={inputClass(isNoShow ? "red-500" : "orange-500")}
                  >
                    <option value="" disabled>Select reason category</option>
                    {reasonCategoryOptions.map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                    {isNoShow ? "No Show Reason" : "Withdrawal Reason"} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required 
                    rows={3} 
                    value={form.withdrawalReason}
                    onChange={(e) => setForm({ ...form, withdrawalReason: e.target.value })}
                    placeholder={isNoShow ? "Provide details on why candidate did not appear." : "Provide details on why candidate withdrew."}
                    className={textareaClass(isNoShow ? "red-500" : "orange-500")}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Replaced with standardized text rating descriptive select field */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Experience Rating
                    </label>
                    <select
                      value={String(form.experienceRating)}
                      onChange={(e) => setForm({ ...form, experienceRating: Number(e.target.value) })}
                      className={inputClass(isNoShow ? "red-500" : "orange-500")}
                    >
                      <option value="5">5 (Excellent)</option>
                      <option value="4">4 (Good)</option>
                      <option value="3">3 (Average)</option>
                      <option value="2">2 (Poor)</option>
                      <option value="1">1 (Terrible)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">Feedback Tag</label>
                    <input
                      value={form.feedbackTag}
                      onChange={(e) => setForm({ ...form, feedbackTag: e.target.value })}
                      placeholder="e.g. No Show"
                      className={inputClass(isNoShow ? "red-500" : "orange-500")}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">Candidate Feedback</label>
                  <textarea
                    rows={2} 
                    value={form.candidateFeedback}
                    onChange={(e) => setForm({ ...form, candidateFeedback: e.target.value })}
                    placeholder="Optional feedback from the candidate."
                    className={textareaClass(isNoShow ? "red-500" : "orange-500")}
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">Internal Remarks</label>
              <textarea
                rows={2} 
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="Optional internal notes for recruiters."
                className={textareaClass(isShow ? "emerald-500" : isNoShow ? "red-500" : "orange-500")}
              />
            </div>

            {/* 4. System Action Info Box */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-[#F5F8FF] p-4">
              <div className="text-blue-500 mt-0.5"><Info size={18} /></div>
              <div>
                <h4 className="text-sm font-bold text-[#174A7C]">System Action</h4>
                <p className="mt-1 text-xs font-medium leading-relaxed text-[#174A7C]/80">
                  {isShow && "Confirming will mark candidate as a True Hire. They will be added to the final placement count."}
                  {(isNoShow || isWithdraw) && "Confirming will move the candidate to Drop-offs in the Pipeline and generate a Candidate Experience record."}
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* 5. Footer Buttons (Tactile Lift pattern) */}
        <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-3 sm:flex-row">
            <button
              type="button" 
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-6 text-sm font-bold text-gray-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit" 
              form="outcome-form"
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-90 active:scale-[0.98] bg-${themeColor}`}
            >
              <AlertCircle size={16} /> Confirm Outcome
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
