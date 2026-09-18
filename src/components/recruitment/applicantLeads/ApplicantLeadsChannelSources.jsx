import React from "react";

import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";
import { Skeleton } from "@/components/ui";

function SummaryBar({ item, total, accent = "#2563EB" }) {
  const percent = total > 0 ? Math.round((item.total / total) * 100) : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-extrabold text-[#042C51]">
        <span className="truncate">{item.label}</span>
        <span className="shrink-0">
          {item.total} leads ({percent}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: accent }}
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
  const accents = ["#2563EB", "#A855F7", "#FF5C28", "#10B981", "#F59E0B"];

  return (
    <div className="grid gap-3.5 2xl:gap-4 p-3.5 sm:p-4 2xl:p-5 lg:grid-cols-2 font-jakarta">
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-3.5 sm:p-4 2xl:p-5 shadow-xs">
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
          Lead Generation Channel Breakdown
        </h3>
        <p className="mt-0.5 text-xs font-semibold text-[#667085]">
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
                <div className="h-2 overflow-hidden rounded-full bg-[#EEF2F6]">
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
                accent={accents[index % accents.length]}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-[#D6DEE8] bg-[#F8FAFC] p-8 text-center text-xs font-semibold text-[#667085]">
            No lead channel source data available.
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-3.5 sm:p-4 2xl:p-5 shadow-xs">
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
          Account Lead Intake Volume
        </h3>
        <p className="mt-0.5 text-xs font-semibold text-[#667085]">
          Target account client demand from inbound leads.
        </p>

        {isLoading ? (
          <div className="mt-3.5 2xl:mt-4 space-y-2.5" data-testid="account-intake-skeleton">
            {[1, 2, 3, 4].map((key) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3.5 py-2.5"
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
                className="flex items-center justify-between gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-[#042C51]">
                    {item.label}
                  </p>
                  <p className="text-[10px] font-semibold text-[#91A2B8]">
                    Target Account Client
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-[#042C51]">
                    {item.total}
                  </p>
                  <p className="text-[10px] font-semibold text-[#91A2B8]">
                    Total Inquiries
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-[#D6DEE8] bg-[#F8FAFC] p-8 text-center text-xs font-semibold text-[#667085]">
            No account lead intake data recorded.
          </div>
        )}
      </section>
    </div>
  );
}
