import React from "react";

function DonutChart({ data = [] }) {
   const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
   let current = 0;

   const gradient = total > 0
       ? data.map((item) => {
             const start = current;
             const size = (Number(item.value || 0) / total) * 100;
             current += size;
             return `${item.color} ${start}% ${current}%`;
           }).join(", ")
       : "#E6ECF2 0% 100%";

   return (
     // Changed: Better gap and alignment for responsive stacking
     <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-center lg:flex-col xl:flex-row xl:items-center">
       <div
         className="relative h-28 w-28 shrink-0 rounded-full lg:h-32 lg:w-32"
         style={{ background: `conic-gradient(${gradient})` }}
       >
         <div className="absolute inset-6 rounded-full bg-white lg:inset-7" />
       </div>

       <div className="w-full space-y-2.5">
         {data.length > 0 ? (
           data.map((item) => {
             const percent = total > 0 ? Math.round((Number(item.value || 0) / total) * 100) : 0;
             return (
               <div key={item.label} className="flex items-start justify-between gap-3 text-sm">
                 <div className="flex min-w-0 items-start gap-2">
                   <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                   {/* Changed: Removed truncate, added leading-tight for long names */}
                   <span className="font-semibold leading-tight text-[#344054]">
                     {item.label}
                   </span>
                 </div>
                 <span className="shrink-0 font-bold text-[#101828]">
                   {item.value} <span className="text-[10px] text-gray-400">({percent}%)</span>
                 </span>
               </div>
             );
           })
         ) : (
           <p className="text-center text-sm font-bold text-gray-500 italic">No data available.</p>
         )}
       </div>
     </div>
   );
}

export default function ReasonForHiringTable({ data = [] , delay = 0}) {
  return (
    <section className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5" style={{animationDelay: `${delay}ms`}}>
      <h2 className="text-base font-bold text-[#101828]">
        Requisition by Reason for Hiring
      </h2>

      <div className="mt-5">
        <DonutChart data={data} />
      </div>
    </section>
  );
}