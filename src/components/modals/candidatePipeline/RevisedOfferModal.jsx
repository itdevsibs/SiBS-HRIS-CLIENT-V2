import React, { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { generateEmploymentOfferPdf } from "../../../lib/utils/candidatePipeline/employmentOfferPdf";
import { createCandidateOfferRevision } from "../../../lib/axios/candidateOfferRevisions";
import { getCurrentOfferCompensation, validateRevisedOfferForm } from "../../../lib/utils/candidatePipeline/revisedOfferHelpers";

const peso = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function RevisedOfferModal({ open, candidate, latestOfferVersion, onClose, onSubmitted }) {
  const current = useMemo(() => getCurrentOfferCompensation(candidate, latestOfferVersion), [candidate, latestOfferVersion]);
  const [form, setForm] = useState({ basicDailyRate: "", dailyDeMinimis: "", remarks: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({ basicDailyRate: String(current.basicDailyRate), dailyDeMinimis: String(current.dailyDeMinimis), remarks: "" });
      setError("");
    }
  }, [open, current.basicDailyRate, current.dailyDeMinimis]);

  if (!open) return null;
  const proposedTotal = Number(form.basicDailyRate || 0) + Number(form.dailyDeMinimis || 0);

  async function submit(event) {
    event.preventDefault();
    const validation = validateRevisedOfferForm(form, current);
    if (!validation.valid) { setError(validation.message); return; }
    setSubmitting(true); setError("");
    try {
      const pdf = await generateEmploymentOfferPdf({
        candidate,
        offer: {
          ...(candidate?.offerDetails || {}),
          roleTitle:
            latestOfferVersion?.roleTitle ||
            candidate?.offerDetails?.roleTitle ||
            candidate?.roleTitle,
          account:
            latestOfferVersion?.accountName ||
            candidate?.offerDetails?.account ||
            candidate?.account,
          basicPay: validation.values.basicDailyRate,
          deminimisDailyRate: validation.values.dailyDeMinimis,
        },
      });

      if (!pdf?.base64) {
        throw new Error("The revised employment-offer PDF could not be generated.");
      }
      const candidateId = candidate?.id || candidate?.recordId || candidate?.candidatePipelineId;
      const result = await createCandidateOfferRevision(candidateId, {
        ...validation.values,
        roleTitle: latestOfferVersion?.roleTitle || candidate?.offerDetails?.roleTitle || candidate?.roleTitle,
        accountName: latestOfferVersion?.accountName || candidate?.offerDetails?.account || candidate?.account,
        startDate: candidate?.offerDetails?.startDate || "",
        employmentOfferPdfBase64: pdf.base64,
        employmentOfferPdfFilename:
          pdf.filename || `Revised-Employment-Offer-${candidateId}.pdf`,
      });
      onSubmitted?.(result);
      onClose?.();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || "Unable to submit the revised offer.");
    } finally { setSubmitting(false); }
  }

  return <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/60 p-4" onClick={() => !submitting && onClose?.()}>
    <form onSubmit={submit} className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-[#E6ECF2] px-6 py-5"><div><h2 className="text-lg font-extrabold text-[#042C51]">Create Revised Offer</h2><p className="mt-1 text-xs font-semibold text-[#667085]">{candidate?.name || "Candidate"}</p></div><button type="button" disabled={submitting} onClick={onClose} className="rounded-lg p-2 text-[#667085] hover:bg-slate-100"><X size={18}/></button></div>
      <div className="space-y-5 p-6">
        <div className="grid gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 sm:grid-cols-3"><div><p className="text-[10px] font-extrabold uppercase text-[#667085]">Current Basic Daily Rate</p><p className="mt-1 text-sm font-extrabold text-[#042C51]">{peso(current.basicDailyRate)}</p></div><div><p className="text-[10px] font-extrabold uppercase text-[#667085]">Current Daily De Minimis</p><p className="mt-1 text-sm font-extrabold text-[#042C51]">{peso(current.dailyDeMinimis)}</p></div><div><p className="text-[10px] font-extrabold uppercase text-[#667085]">Current Total</p><p className="mt-1 text-sm font-extrabold text-[#042C51]">{peso(current.total)}</p></div></div>
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-extrabold text-[#344054]">New Basic Daily Rate<input type="number" min="0" step="0.01" value={form.basicDailyRate} onChange={(e)=>setForm((p)=>({...p,basicDailyRate:e.target.value}))} className="mt-2 h-11 w-full rounded-xl border border-[#D6E0EA] px-3 outline-none focus:border-[#042C51]" required/></label><label className="text-xs font-extrabold text-[#344054]">New Daily De Minimis<input type="number" min="0" step="0.01" value={form.dailyDeMinimis} onChange={(e)=>setForm((p)=>({...p,dailyDeMinimis:e.target.value}))} className="mt-2 h-11 w-full rounded-xl border border-[#D6E0EA] px-3 outline-none focus:border-[#042C51]" required/></label></div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-[10px] font-extrabold uppercase text-blue-700">Proposed Total Daily Compensation</p><p className="mt-1 text-xl font-extrabold text-[#042C51]">{peso(proposedTotal)}</p></div>
        <label className="block text-xs font-extrabold text-[#344054]">Remarks / justification <span className="font-semibold text-[#98A2B3]">(Optional)</span><textarea rows={4} value={form.remarks} onChange={(e)=>setForm((p)=>({...p,remarks:e.target.value}))} className="mt-2 w-full rounded-xl border border-[#D6E0EA] p-3 outline-none focus:border-[#042C51]" maxLength={2000}/></label>
        {error && <p className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
      </div>
      <div className="flex justify-end gap-3 border-t border-[#E6ECF2] px-6 py-4"><button type="button" disabled={submitting} onClick={onClose} className="h-10 rounded-xl border border-[#D6E0EA] px-5 text-xs font-extrabold text-[#475467]">Cancel</button><button type="submit" disabled={submitting} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#042C51] px-5 text-xs font-extrabold text-white disabled:opacity-60">{submitting && <Loader2 size={15} className="animate-spin"/>}{submitting ? "Submitting..." : "Submit Revised Offer for Approval"}</button></div>
    </form>
  </div>;
}
