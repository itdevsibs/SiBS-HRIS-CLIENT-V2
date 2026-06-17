import React from "react";
import { Info } from "lucide-react";

export default function OnboardingProcessNote({ delay = 0 }) {
  return (
    <section
      className="sibs-profile-tab-panel mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5 shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h3 className="text-sm font-bold text-sibs-primary-1 flex items-center gap-2">
        <Info size={16} /> Onboarding Transition Rule
      </h3>
      <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
        Accepted Offer creates onboarding. Start Date, Show / No Show, and Pre-start Withdrawal must be captured. Only Show becomes True Hire and should move the candidate to Hired.
      </p>
    </section>
  );
}