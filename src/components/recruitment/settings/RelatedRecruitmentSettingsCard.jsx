import React from "react";
import { BriefcaseBusiness } from "lucide-react";

const relatedSettings = [
  {
    title: "Candidate Pipeline",
    desc: "Controls stage movement and interview start action.",
  },
  {
    title: "Offers Page",
    desc: "Controls approval visibility and offer movement.",
  },
  {
    title: "Available Positions",
    desc: "Controls public form and talent pool position list.",
  },
  {
    title: "Email Templates",
    desc: "Controls assessment and offer email messages.",
  },
];

export default function RelatedRecruitmentSettingsCard() {
  return (
    <div className="sibs-card p-4 sm:p-5 font-jakarta">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm sm:text-base font-bold text-sibs-navy">
          Related Recruitment Settings
        </h3>
        <BriefcaseBusiness size={18} className="text-sibs-grey-4" />
      </div>

      <div className="mt-4 space-y-3">
        {relatedSettings.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-sibs-border bg-sibs-surface px-4 py-3"
          >
            <p className="text-xs font-bold text-sibs-navy">
              {item.title}
            </p>
            <p className="mt-0.5 text-xs text-sibs-grey-4">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
