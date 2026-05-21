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
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-extrabold text-[#101828]">
          Related Recruitment Settings
        </h3>
        <BriefcaseBusiness size={18} className="text-sibs-tertiary-5" />
      </div>

      <div className="mt-4 space-y-3">
        {relatedSettings.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
          >
            <p className="text-sm font-extrabold text-[#101828]">
              {item.title}
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
