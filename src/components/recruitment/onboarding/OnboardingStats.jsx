import React from "react";
import { useOnboarding } from "../../../services/context/OnboardingContext";
import { 
   UsersRound, 
   UserCheck, 
   UserX, 
   Clock3, 
   CheckCircle2,
   CircleX 
} from "lucide-react";

function StatCard({ title, value, icon: Icon, description, valueClassName = "text-sibs-primary-1", delay = 0 }) {
   return (
     <div 
       className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md"
       style={{ animationDelay: `${delay}ms` }}
     >
       <div className="flex items-center justify-between gap-4">
         <div className="min-w-0">
           <p className="truncate text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">{title}</p>
           <p className={`mt-3 truncate text-3xl font-extrabold ${valueClassName}`}>{value}</p>
           {description && <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">{description}</p>}
         </div>
         <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
           <Icon size={22} />
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
         <StatCard title="Total PR" value={stats.total} icon={UsersRound} description="Total records" delay={0} />

         <StatCard title="True Hires" value={stats.trueHires} icon={UserCheck} description={`${stats.showRate}% show rate`} valueClassName="text-emerald-600" delay={60} />

         <StatCard title="Pending Start" value={stats.pending} icon={Clock3} valueClassName="text-amber-500" description="Waiting for start" delay={120} />

         <StatCard title="No Show" value={stats.noShow} icon={UserX} valueClassName="text-red-600" description="Did not start" delay={180} />

         <StatCard title="Withdrawal" value={stats.withdrawals} icon={CircleX} valueClassName="text-orange-600" description="Needs reason" delay={240} />

         <StatCard title="Show Rate" value={`${stats.showRate}%`} icon={CheckCircle2} description="Onboarding KPI" delay={300} />
       </div>
     </section>
   );
}