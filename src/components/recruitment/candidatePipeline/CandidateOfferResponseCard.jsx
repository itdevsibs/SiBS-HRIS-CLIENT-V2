import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import RevisedOfferModal from "../../modals/candidatePipeline/RevisedOfferModal";
import { getLatestCandidateOfferVersion } from "../../../lib/axios/candidateOfferRevisions";
import { getCandidateOfferResponseState } from "../../../lib/utils/candidatePipeline/revisedOfferHelpers";

export default function CandidateOfferResponseCard({ candidate, offerDecisionOptions = [], onOfferDecision, onUpdated, showStatusModal }) {
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const candidateId = candidate?.id || candidate?.recordId || candidate?.candidatePipelineId;

  async function load({ silent = false } = {}) {
    if (!candidateId) return;
    if (!silent) setLoading(true);
    try {
      const result = await getLatestCandidateOfferVersion(candidateId);
      setLatest(result.latestOfferVersion || null);
    } catch (error) {
      if (!silent) showStatusModal?.({ type: "error", title: "Unable to Load Offer Status", message: error?.response?.data?.message || error?.message || "Unable to load the revised-offer status." });
    } finally { if (!silent) setLoading(false); }
  }

  useEffect(() => { load({ silent: true }); }, [candidateId]);
  const state = getCandidateOfferResponseState(candidate, latest);
  const badgeClass = state.statusKey.includes("rejected") ? "border-red-100 bg-red-50 text-red-700" : state.statusKey.includes("pending") ? "border-blue-100 bg-blue-50 text-blue-700" : state.statusKey === "revised_offer_sent" ? "border-violet-100 bg-violet-50 text-violet-700" : "border-amber-100 bg-amber-50 text-amber-700";
  const canCreateRevision = state.isNegotiating && state.statusKey !== "revised_offer_pending_approval";

  return <>
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">Candidate Offer Response</p><span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${badgeClass}`}>{state.displayStatus}</span></div><button type="button" onClick={()=>load()} disabled={loading} className="rounded-lg border border-[#E6ECF2] p-2 text-[#667085]"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/></button></div>
      {latest?.negotiationMessage && <div className="mt-3 rounded-xl bg-amber-50 p-3"><p className="text-[10px] font-extrabold uppercase text-amber-700">Candidate message</p><p className="mt-1 text-xs font-semibold leading-5 text-amber-900">{latest.negotiationMessage}</p></div>}
      {canCreateRevision ? <button type="button" onClick={()=>setModalOpen(true)} className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white">Create Revised Offer</button> : state.statusKey === "pending" ? <><p className="mt-3 text-xs font-semibold leading-5 text-sibs-tertiary-5">Use these buttons only when the candidate cannot access the email response link.</p><div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">{offerDecisionOptions.map((decision)=><button key={decision} type="button" onClick={()=>onOfferDecision?.(candidate,decision)} className="inline-flex h-9 items-center justify-center rounded-xl border border-[#D6E0EA] px-3 text-xs font-bold">{decision}</button>)}</div></> : null}
    </div>
    <RevisedOfferModal open={modalOpen} candidate={candidate} latestOfferVersion={latest} onClose={()=>setModalOpen(false)} onSubmitted={(result)=>{ load({silent:true}); onUpdated?.(result); showStatusModal?.({ type: "success", title: result.emailSent === false ? "Revised Offer Saved" : "Revised Offer Submitted", message: result.message || "Revised offer submitted for approval." }); }}/>
  </>;
}
