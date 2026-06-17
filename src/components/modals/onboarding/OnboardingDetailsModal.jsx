import React from "react";
import { X, CalendarDays, UserCheck, UserX, CircleX, Eye, AlertTriangle } from "lucide-react";

export default function OnboardingDetailsModal({ 
   open, 
   item: record, 
   onClose, 
   onOpenOutcomeModal,
   formatDate,
   getShowStatusClass,
   getOutcomeClass,
   getDaysToStart
}) {
   if (!open || !record) return null;

   const normalizedRecord = record; 
   const isFinal = ["True Hire", "No Show", "Pre-start Withdrawal"].includes(normalizedRecord.finalOutcome);

   return (
     <div className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4" onClick={onClose}>
       <div className="sibs-profile-tab-panel flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>

         {/* HEADER */}
         <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
           <div className="min-w-0">
             <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">Onboarding Transition Details</h2>
             <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">Track accepted offer to actual start, show/no-show, and pre-start withdrawal.</p>
           </div>
           <button onClick={onClose} className="shrink-0 rounded-full p-2 text-gray-400 hover:bg-gray-100 active:scale-[0.98]">
             <X size={20} />
           </button>
         </div>

         {/* BODY */}
         <div className="flex-1 overflow-y-auto p-4 sm:p-6">
           <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">

             {/* LEFT COLUMN */}
             <div className="space-y-5">
               {/* Candidate Info Card */}
               <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                 <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                   <div className="min-w-0">
                     <h3 className="text-lg font-bold text-[#101828] sm:text-xl">{normalizedRecord.candidateName}</h3>
                     <p className="mt-1 break-words text-sm font-semibold text-sibs-tertiary-5">{normalizedRecord.candidateEmail}</p>
                     <div className="mt-3 flex flex-wrap gap-2"> 
                       <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getShowStatusClass(normalizedRecord.showStatus)}`}>
                         {normalizedRecord.showStatus}
                       </span>
                       <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getOutcomeClass(normalizedRecord.finalOutcome)}`}>
                         {normalizedRecord.finalOutcome}
                       </span>
                     </div>
                   </div>
                   <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
                     <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1/70">Expected Start</p>
                     <p className="mt-1 text-2xl font-bold text-sibs-primary-1">{formatDate(normalizedRecord.expectedStartDate)}</p>
                   </div>
                 </div>
               </div>

               {/* Onboarding Timeline Card */}
               <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                 <h3 className="mb-4 text-sm font-bold text-[#101828]">Onboarding Timeline</h3>
                 <div className="space-y-4">
                   <TimelineStep num="1" color="blue" label="Offer Accepted" value={formatDate(normalizedRecord.acceptedOfferDate)} />
                   <TimelineStep num="2" color="amber" label="Expected Start Date" value={formatDate(normalizedRecord.expectedStartDate)} />
                   
                   <div className="flex gap-4">
                     <div className="flex flex-col items-center"> 
                       <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold ${getShowStatusClass(normalizedRecord.showStatus)}`}>3</div>
                     </div>
                     <div className="flex-1 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                       <p className="text-sm font-bold text-[#101828]">Final Start Outcome</p>
                       <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                         {normalizedRecord.actualStartDate ? formatDate(normalizedRecord.actualStartDate) : normalizedRecord.finalOutcome}
                       </p>
                       {(normalizedRecord.showStatus === "No Show" || normalizedRecord.preStartWithdrawal === "Yes") && ( 
                         <div className={`mt-3 rounded-xl border p-3 text-sm font-semibold leading-6 ${normalizedRecord.showStatus === "No Show" ? "bg-red-50 border-red-100 text-red-700" : "bg-orange-50 border-orange-100 text-orange-700"}`}>
                           {normalizedRecord.showStatus === "No Show" ? "No Show reason: " : "Withdrawal reason: "}{normalizedRecord.withdrawalReason}
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
               </div>

               {/* Experience Data */}
               {(normalizedRecord.showStatus === "No Show" || normalizedRecord.showStatus === "Withdrawn") && (
                 <div className="rounded-xl border border-red-100 bg-red-50 p-5">
                   <h3 className="text-sm font-bold text-red-700">Candidate Experience Data</h3>
                   <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                     <div className="rounded-xl border border-red-100 bg-white p-4">
                       <p className="text-[11px] font-bold uppercase text-red-400">Reason Category</p>
                       <p className="mt-1 text-sm font-bold text-red-700">{normalizedRecord.reasonCategory || "—"}</p>
                     </div>
                     <div className="rounded-xl border border-red-100 bg-white p-4">
                       <p className="text-[11px] font-bold uppercase text-red-400">Experience Rating</p>
                       <p className="mt-1 text-sm font-bold text-red-700">{normalizedRecord.experienceRating ? `${normalizedRecord.experienceRating}/5` : "—"}</p>
                     </div>
                   </div>
                 </div>
               )}

               {/* Remarks Card */}
               <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                 <h3 className="text-sm font-bold text-[#101828]">Remarks</h3>
                 <p className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]">
                   {normalizedRecord.remarks || "No remarks provided."}
                 </p>
               </div>
             </div>

             {/* RIGHT COLUMN (SIDEBAR) */}
             <div className="space-y-5">
               <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                 <h3 className="text-sm font-bold text-[#101828]">Onboarding Summary</h3>
                 <div className="mt-4 space-y-0">
                   <DetailRow label="Onboarding ID" value={normalizedRecord.onboardingId} />
                   <DetailRow label="Offer ID" value={normalizedRecord.offerId} />
                   <DetailRow label="Role" value={normalizedRecord.roleTitle} />
                   <DetailRow label="Account" value={normalizedRecord.account} />
                   <DetailRow label="Location" value={normalizedRecord.location} />
                   <DetailRow label="Accepted Offer Date" value={formatDate(normalizedRecord.acceptedOfferDate)} />
                   <DetailRow label="Expected Start Date" value={formatDate(normalizedRecord.expectedStartDate)} />
                   <DetailRow label="Actual Start Date" value={formatDate(normalizedRecord.actualStartDate)} />
                   <DetailRow label="Days to Start" value={getDaysToStart(normalizedRecord.acceptedOfferDate, normalizedRecord.expectedStartDate)} />
                   <DetailRow label="Owner" value={normalizedRecord.owner} />
                 </div>
               </div>

               {!isFinal && (
                 <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                   <h3 className="text-sm font-bold text-[#101828]">Update Outcome</h3>
                   <div className="mt-4 space-y-3">
                     <button
                       onClick={() => onOpenOutcomeModal(normalizedRecord, "Show")}
                       className="inline-flex w-full items-center justify-center gap-2
                      rounded-xl bg-sibs-primary-1 px-4 py-2.5 text-sm font-bold text-white
                      shadow-sm transition-all duration-200 hover:-translate-y-0.5
                      hover:bg-emerald-700 hover:shadow-md active:scale-[0.98]"
                     >
                       <UserCheck size={16} /> Mark as Show
                     </button>

                     <button
                       onClick={() => onOpenOutcomeModal(normalizedRecord, "No Show")}
                       className="inline-flex w-full items-center justify-center gap-2
                      rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold
                      text-red-600 shadow-sm transition-all duration-200
                      hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-md
                      active:scale-[0.98]"
                     >
                       <UserX size={16} /> Mark as No Show
                     </button>

                     <button
                       onClick={() => onOpenOutcomeModal(normalizedRecord, "Withdrawn")}
                       className="inline-flex w-full items-center justify-center gap-2
                      rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm
                      font-bold text-orange-600 shadow-sm transition-all duration-200
                      hover:-translate-y-0.5 hover:bg-orange-100 hover:shadow-md
                      active:scale-[0.98]"
                     >
                       <CircleX size={16} /> Mark as Withdrawn
                     </button>
                   </div>
                 </div>
               )}

               <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                 <h3 className="text-sm font-bold text-sibs-primary-1">Onboarding Rule</h3>
                 <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                   Accepted offer creates onboarding. Show creates true hire. No Show and Pre-start Withdrawal create Candidate Experience records and do not count as hired.
                 </p>
               </div>
             </div>

           </div>
         </div>

         {/* FOOTER */}
         <div className="border-t border-gray-100 px-5 py-4 sm:px-6 flex justify-end">
           <button 
             onClick={onClose} 
             className="rounded-xl bg-white border border-[#E6ECF2] text-gray-600 hover:bg-gray-50 hover:text-gray-900 px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98]"
           >
             Close Details
           </button>
         </div>
       </div>
     </div>
   );
}

function TimelineStep({ num, color, label, value }) {
   const colorMap = {
     blue: "bg-blue-50 border-blue-100 text-blue-700",
     amber: "bg-amber-50 border-amber-100 text-amber-700"
   };
   return (
     <div className="flex gap-4">
       <div className="flex flex-col items-center">
         <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold ${colorMap[color]}`}>{num}</div>
         <div className="my-1 h-full min-h-8 w-px bg-gray-200" />
       </div>
       <div className="flex-1 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
         <p className="text-sm font-bold text-[#101828]">{label}</p>
         <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">{value}</p>
       </div>
     </div>
   );
}

function DetailRow({ label, value }) {
   return (
     <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
       <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">{label}</p>
       <div className="max-w-[60%] break-words text-right text-sm font-bold text-[#344054]">{value || "—"}</div>
     </div>
   );
}