import React from "react";
import { CalendarDays } from "lucide-react";

const launchRules = [
  "Open from Candidate Pipeline Start Interview button",
  "Require candidate ID and application ID in URL",
  "Auto-save interview draft before final submission",
  "Lock form after final recommendation is submitted",
];

export default function FormLaunchRulesCard() {
  return (
    <div className="sibs-card p-4 sm:p-5 font-jakarta">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm sm:text-base font-bold text-sibs-navy">
          Form Launch Rules
        </h3>
        <CalendarDays size={18} className="text-sibs-grey-4" />
      </div>

      <div className="mt-4 space-y-3">
        {launchRules.map((rule) => (
          <label
            key={rule}
            className="flex items-start gap-3 rounded-xl border border-sibs-border bg-sibs-surface px-4 py-3"
          >
            <input
              type="checkbox"
              defaultChecked
              className="mt-0.5 h-4 w-4 accent-sibs-primary-1"
            />
            <span className="text-xs font-semibold leading-5 text-sibs-navy">
              {rule}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
