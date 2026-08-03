import React from "react";
import { useOnboarding } from "@/services/context/OnboardingContext";
import { 
   UsersRound, 
   UserCheck, 
   UserX, 
   Clock3, 
   CheckCircle2,
   CircleX 
} from "lucide-react";

function StatCard({ title, value, icon: Icon, description, tone = "navy", delay = 0 }) {
   return (
     <div 
       className="sibs-metric-card"
       style={{ animationDelay: `${delay}ms` }}
     >
       <div className="flex items-start justify-between gap-4">
         <div className="min-w-0 flex-1">
           <p className={`truncate text-[10px] font-extrabold uppercase tracking-normal sibs-tone-${tone}-label`}>{title}</p>
           <p className={`mt-2.5 truncate text-3xl font-extrabold leading-none tabular-nums sibs-tone-${tone}-label`}>{value}</p>
           {description && <p className="mt-1.5 truncate text-xs font-semibold text-[#667085]">{description}</p>}
         </div>
         <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sibs-tone-${tone}-icon`}>
           <Icon size={17} strokeWidth={2} />
         </div>
       </div>
     </div>
   );
}

export default function OnboardingStats() {
   const { stats } = useOnboarding();

   return (
     <section 
       className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
       style={{ animationDelay: "60ms" }}
     >
       <h2 className="text-base font-bold text-[#101828]">Onboarding Summary</h2>
       
       <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
         <StatCard title="Total PR" value={stats.total} icon={UsersRound} description="Total records" tone="navy" delay={0} />

         <StatCard title="True Hires" value={stats.trueHires} icon={UserCheck} description={`${stats.showRate}% show rate`} tone="green" delay={60} />

         <StatCard title="Pending Start" value={stats.pending} icon={Clock3} tone="amber" description="Waiting for start" delay={120} />

         <StatCard title="No Show" value={stats.noShow} icon={UserX} tone="red" description="Did not start" delay={180} />

         <StatCard title="Withdrawal" value={stats.withdrawals} icon={CircleX} tone="orange" description="Needs reason" delay={240} />

         <StatCard title="Show Rate" value={`${stats.showRate}%`} icon={CheckCircle2} description="Onboarding KPI" tone="indigo" delay={300} />
       </div>
     </section>
   );
}