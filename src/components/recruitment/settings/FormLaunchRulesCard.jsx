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
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-extrabold text-[#101828]">
          Form Launch Rules
        </h3>
        <CalendarDays size={18} className="text-sibs-tertiary-5" />
      </div>

      <div className="mt-4 space-y-3">
        {launchRules.map((rule) => (
          <label
            key={rule}
            className="flex items-start gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3"
          >
            <input
              type="checkbox"
              defaultChecked
              className="mt-0.5 h-4 w-4 accent-sibs-primary-1"
            />
            <span className="text-sm font-bold leading-5 text-[#344054]">
              {rule}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}