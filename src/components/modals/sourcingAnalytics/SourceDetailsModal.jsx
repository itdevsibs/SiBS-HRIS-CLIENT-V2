import React from "react";
import { Activity, CheckCircle2, ReceiptText, Target, UsersRound, X } from "lucide-react";

function formatCurrency(value) {
  const amount = Number(value || 0);

  return amount.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className="break-words text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}

function FunnelRow({ label, value, max }) {
  const safeValue = Number(value || 0);
  const safeMax = Number(max || 0);
  const percentage = safeMax > 0 ? Math.round((safeValue / safeMax) * 100) : 0;

  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-[#344054]">{label}</p>

        <p className="text-sm font-bold text-sibs-primary-1">{safeValue}</p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-sibs-primary-1 transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function SummaryMetric({ label, value, icon, valueClassName = "text-sibs-primary-1" }) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
            {label}
          </p>

          <p className={`mt-2 truncate text-xl font-extrabold ${valueClassName}`}>
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2F6FA] text-sibs-primary-1">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function SourceDetailsModal({ open, source, onClose }) {
  if (!open || !source) return null;

  const costEntries = Array.isArray(source.costEntries)
    ? source.costEntries
    : [];

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-sibs-primary-1 sm:text-xl">
              Source Performance Details
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              {source.source || "—"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Sourcing Platform
                    </p>

                    <h3 className="mt-1 text-xl font-extrabold text-[#101828]">
                      {source.source || "—"}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
                        Total Cost: {formatCurrency(source.sourceCost)}
                      </span>

                      <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        {costEntries.length} Cost Entries
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1/70">
                      Cost per Hire
                    </p>

                    <p className="mt-1 text-3xl font-extrabold text-sibs-primary-1">
                      {formatCurrency(source.costPerHire)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryMetric
                  label="Applicants"
                  value={source.volume || 0}
                  icon={<UsersRound size={20} />}
                />

                <SummaryMetric
                  label="Hired"
                  value={source.hired || 0}
                  valueClassName="text-emerald-600"
                  icon={<CheckCircle2 size={20} />}
                />

                <SummaryMetric
                  label="Conversion"
                  value={`${Number(source.conversionRate || 0).toFixed(1)}%`}
                  icon={<Activity size={20} />}
                />

                <SummaryMetric
                  label="Source Cost"
                  value={formatCurrency(source.sourceCost)}
                  icon={<ReceiptText size={20} />}
                />
              </div>

              <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-5 text-sm font-extrabold text-[#101828]">
                  Source Funnel
                </h3>

                <div className="space-y-3">
                  <FunnelRow
                    label="Candidate Volume"
                    value={source.volume}
                    max={source.volume}
                  />

                  <FunnelRow
                    label="Screened"
                    value={source.screened}
                    max={source.volume}
                  />

                  <FunnelRow
                    label="Interviewed"
                    value={source.interviewed}
                    max={source.volume}
                  />

                  <FunnelRow
                    label="Offered"
                    value={source.offered}
                    max={source.volume}
                  />

                  <FunnelRow
                    label="Hired"
                    value={source.hired}
                    max={source.volume}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-[#101828]">
                  Source Cost Entries
                </h3>

                <div className="mt-4 space-y-3">
                  {costEntries.length > 0 ? (
                    costEntries.map((entry) => (
                      <div
                        key={entry.id || `${entry.description}-${entry.dateSpent}`}
                        className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-extrabold text-[#101828]">
                              {entry.description || "—"}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                              Date Spent: {formatDate(entry.dateSpent)}
                            </p>
                          </div>

                          <p className="text-sm font-extrabold text-sibs-primary-1">
                            {formatCurrency(entry.amount)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-8 text-center text-sm font-bold text-gray-500">
                      No cost entries tagged to this source yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-[#101828]">
                  Source Summary
                </h3>

                <div className="mt-4 grid grid-cols-1 gap-3">
                  <InfoBox label="Source" value={source.source} />
                  <InfoBox
                    label="Total Source Cost"
                    value={formatCurrency(source.sourceCost)}
                  />
                  <InfoBox
                    label="Cost per Hire"
                    value={formatCurrency(source.costPerHire)}
                  />
                  <InfoBox label="Applicants" value={source.volume} />
                  <InfoBox label="Screened" value={source.screened} />
                  <InfoBox label="Interviewed" value={source.interviewed} />
                  <InfoBox label="Offered" value={source.offered} />
                  <InfoBox label="Hired" value={source.hired} />
                  <InfoBox
                    label="Conversion"
                    value={`${Number(source.conversionRate || 0).toFixed(1)}%`}
                  />
                  <InfoBox label="Cost Entries" value={costEntries.length} />
                  <InfoBox
                    label="Latest Applicant"
                    value={source.latestCandidate}
                  />
                  <InfoBox
                    label="Last Activity"
                    value={formatDate(source.lastActivity)}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sibs-primary-1">
                    <Target size={18} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-sibs-primary-1">
                      Cost per Hire Rule
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                      Cost per Hire is calculated by dividing the total source
                      cost by the number of hired candidates from the same
                      source.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 bg-white px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}