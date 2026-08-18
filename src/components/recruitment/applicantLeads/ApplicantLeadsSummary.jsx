import React from "react";
import {
  CheckCircle2,
  ClipboardList,
  MailCheck,
  Send,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";

function StatCard({
  title,
  value,
  icon,
  description,
  tone = "navy",
  delay = 0,
}) {
  const IconComponent = icon;

  return (
    <article
      className="sibs-metric-card sibs-page-card-in flex h-[104px] 2xl:h-[116px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
        <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
          <div>
            <p
              className={`m-0 truncate sibs-text-micro font-extrabold uppercase sibs-tone-${tone}-label`}
            >
              {title}
            </p>

            <p
              className={`mt-1 text-2xl 2xl:text-3xl font-extrabold leading-none tabular-nums sibs-tone-${tone}-label`}
            >
              {value ?? 0}
            </p>
          </div>

          <p className="line-clamp-1 truncate sibs-text-micro font-bold text-[#667085]">
            {description}
          </p>
        </div>

        <span
          className={`flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full sibs-tone-${tone}-icon`}
        >
          <IconComponent
            className="h-4 w-4 2xl:h-4.5 2xl:w-4.5"
            strokeWidth={2}
          />
        </span>
      </div>
    </article>
  );
}

export default function ApplicantLeadsSummary() {
  const { metrics } = useApplicantLeadsPage();

  return (
    <section aria-labelledby="applicant-leads-summary-title">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Total Leads"
          value={metrics.total}
          icon={UsersRound}
          description="Active Roster"
          tone="navy"
          delay={0}
        />

        <StatCard
          title="New Leads"
          value={metrics.newCount}
          icon={UserPlus}
          description="Pending Call"
          tone="indigo"
          delay={45}
        />

        <StatCard
          title="Link Sent"
          value={metrics.linkSentCount}
          icon={Send}
          description="SMS / Email"
          tone="purple"
          delay={90}
        />

        <StatCard
          title="Converted"
          value={metrics.convertedCount}
          icon={UserCheck}
          description="Talent Pool"
          tone="green"
          delay={135}
        />

        <StatCard
          title="Conversion Rate"
          value={metrics.conversionRate}
          icon={TrendingUp}
          description="Lead Yield"
          tone="orange"
          delay={180}
        />
      </div>
    </section>
  );
}
