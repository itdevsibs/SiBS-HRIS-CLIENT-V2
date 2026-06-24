import React from "react";
import { Timer, AlertTriangle } from "lucide-react";
import { useOnboarding } from "../../../services/context/OnboardingContext";

function ProgressBar({ label, value, total, delay = 0 }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="sibs-page-card-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="min-w-0 truncate text-sm font-bold text-[#344054]">{label}</p>
        <p className="shrink-0 text-sm font-bold text-sibs-primary-1">{percentage}%</p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div className="h-full rounded-full bg-sibs-primary-1 transition-all duration-700 ease-out" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default function OnboardingOutcomeOverview() {
  const { stats } = useOnboarding();
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_420px]">
      <section className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5" style={{ animationDelay: "120ms" }}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#101828]">Onboarding Outcome Summary</h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">Tracks true hires versus accepted offers.</p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
            <Timer size={22} />
          </div>
        </div>
        <div className="space-y-5">
          <ProgressBar label="True Hires" value={stats.trueHires} total={stats.total} delay={0} />
          <ProgressBar label="Pending Start" value={stats.pending} total={stats.total} delay={60} />
          <ProgressBar label="No Show" value={stats.noShow} total={stats.total} delay={120} />
          <ProgressBar label="Pre-start Withdrawal" value={stats.withdrawals} total={stats.total} delay={180} />
        </div>
      </section>

      <section className="sibs-profile-tab-panel rounded-xl border border-blue-100 bg-blue-50 p-5 shadow-sm sm:p-6" style={{ animationDelay: "180ms" }}>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-white p-3 text-sibs-primary-1"><AlertTriangle size={22} /></div>
          <div>
            <h3 className="text-lg font-bold text-sibs-primary-1">Correct Onboarding Flow</h3>
            <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
              Accepted Offer creates onboarding. Onboarding determines if the candidate becomes a True Hire. Only Show should move the candidate to Hired and count as filled.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}