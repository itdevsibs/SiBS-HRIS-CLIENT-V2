import React from "react";

import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";

const summaryCards = [
  {
    key: "total",
    label: "Total Inquiries Logged",
    helper: "Active Roster",
    color: "text-[#042C51]",
    badge: "bg-blue-50 text-[#042C51]",
  },
  {
    key: "newCount",
    label: "New Uncontacted Leads",
    helper: "Pending Call",
    color: "text-blue-700",
    badge: "bg-blue-50 text-blue-700",
  },
  {
    key: "linkSentCount",
    label: "Application Form Sent",
    helper: "SMS / Email",
    color: "text-purple-700",
    badge: "bg-purple-50 text-purple-700",
  },
  {
    key: "convertedCount",
    label: "Converted Applicants",
    helper: "Talent Pool",
    color: "text-emerald-700",
    badge: "bg-emerald-50 text-emerald-700",
  },
  {
    key: "conversionRate",
    label: "Conversion Rate",
    helper: "Lead Yield",
    color: "text-[#FF5C28]",
    badge: "bg-orange-50 text-[#FF5C28]",
  },
];

export default function ApplicantLeadsSummary() {
  const { metrics } = useApplicantLeadsPage();

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {summaryCards.map((card) => (
        <article
          key={card.key}
          className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm"
        >
          <p className="text-[11px] font-extrabold uppercase tracking-normal text-[#667085]">
            {card.label}
          </p>

          <div className="mt-2 flex items-end justify-between gap-3">
            <span className={`text-3xl font-extrabold ${card.color}`}>
              {metrics[card.key]}
            </span>

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${card.badge}`}
            >
              {card.helper}
            </span>
          </div>
        </article>
      ))}
    </section>
  );
}
