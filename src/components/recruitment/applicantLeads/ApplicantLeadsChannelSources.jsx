import React from "react";

import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";
import { Skeleton } from "@/components/ui";

function SummaryBar({ item, total, accentClass = "bg-blue-600" }) {
  const percent = total > 0 ? Math.round((item.total / total) * 100) : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-extrabold text-sibs-navy">
        <span className="truncate">{item.label}</span>
        <span className="shrink-0">
          {item.total} leads ({percent}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-sibs-border/60">
        <div
          className={`h-full rounded-full ${accentClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function ApplicantLeadsChannelSources({ loading }) {
  const pageState = useApplicantLeadsPage();
  const isLoading = loading !== undefined ? loading : pageState.isLoading;
  const { channelSourceSummary = [], accountLeadSummary = [] } = pageState;

  const totalSources = channelSourceSummary.reduce(
    (sum, item) => sum + item.total,
    0,
  );
  const accents = [
    "bg-blue-600",
    "bg-purple-500",
    "bg-sibs-orange",
    "bg-emerald-500",
    "bg-amber-500",
  ];

  return (
    <div className="grid gap-3.5 2xl:gap-4 p-3.5 sm:p-4 2xl:p-5 lg:grid-cols-2 font-jakarta">
      <section className="rounded-2xl border border-sibs-border bg-white p-3.5 sm:p-4 2xl:p-5 shadow-xs">
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-sibs-navy">
          Lead Generation Channel Breakdown
        </h3>
        <p className="mt-0.5 text-xs font-semibold text-sibs-muted">
          Distribution of pre-applicant inquiries across recruitment channels.
        </p>

        {isLoading ? (
          <div className="mt-3.5 2xl:mt-4 space-y-3.5" data-testid="channel-breakdown-skeleton">
            {[1, 2, 3, 4].map((key) => (
              <div key={key}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3.5 w-16" />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-sibs-border/60">
                  <Skeleton className="h-full w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : channelSourceSummary.length > 0 ? (
          <div className="mt-3.5 2xl:mt-4 space-y-3">
            {channelSourceSummary.slice(0, 8).map((item, index) => (
              <SummaryBar
                key={item.label}
                item={item}
                total={totalSources}
                accentClass={accents[index % accents.length]}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-sibs-border bg-sibs-surface p-8 text-center text-xs font-semibold text-sibs-muted">
            No lead channel source data available.
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-sibs-border bg-white p-3.5 sm:p-4 2xl:p-5 shadow-xs">
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-sibs-navy">
          Account Lead Intake Volume
        </h3>
        <p className="mt-0.5 text-xs font-semibold text-sibs-muted">
          Target account client demand from inbound leads.
        </p>

        {isLoading ? (
          <div className="mt-3.5 2xl:mt-4 space-y-2.5" data-testid="account-intake-skeleton">
            {[1, 2, 3, 4].map((key) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-xl border border-sibs-border bg-sibs-surface px-3.5 py-2.5"
              >
                <div className="min-w-0 space-y-1">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-10 ml-auto" />
                  <Skeleton className="h-2.5 w-16 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : accountLeadSummary.length > 0 ? (
          <div className="mt-3.5 2xl:mt-4 space-y-2.5">
            {accountLeadSummary.slice(0, 8).map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-sibs-border bg-sibs-surface px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-sibs-navy">
                    {item.label}
                  </p>
                  <p className="text-[10px] font-semibold text-sibs-muted">
                    Target Account Client
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-sibs-navy">
                    {item.total}
                  </p>
                  <p className="text-[10px] font-semibold text-sibs-muted">
                    Total Inquiries
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-sibs-border bg-sibs-surface p-8 text-center text-xs font-semibold text-sibs-muted">
            No account lead intake data recorded.
          </div>
        )}
      </section>
    </div>
  );
}
