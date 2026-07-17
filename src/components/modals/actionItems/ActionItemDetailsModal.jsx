import React from "react";
import { ArrowRight, CheckCircle2, X } from "lucide-react";
import {
  formatDate,
  getCompletionPercent,
  getDaysLeft,
  getGapClass,
  getModuleClass,
  getRiskClass,
  getStatusClass,
} from "../../../lib/utils/actionItems/actionItemsHelpers.js";

function ProgressBar({ label, value, total, helper, delay = 0 }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="sibs-page-card-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#344054]">{label}</p>

          {helper && (
            <p className="truncate text-xs font-medium text-sibs-tertiary-5">
              {helper}
            </p>
          )}
        </div>

        <p className="shrink-0 text-sm font-bold text-sibs-primary-1">
          {percentage}%
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div
          className="h-full rounded-full bg-sibs-primary-1 transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className="max-w-[62%] whitespace-pre-line break-words text-right text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}


export default function ActionItemDetailsModal({ open, item, onClose, onComplete }) {
  if (!open || !item) return null;

  const progress = getCompletionPercent(item.filled, item.requirement);
  const isCompleted = item.status === "Completed";

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="sibs-profile-tab-panel flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getModuleClass(
                  item.module,
                )}`}
              >
                {item.module || "Recruitment"}
              </span>

              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                  item.status,
                )}`}
              >
                {item.status}
              </span>

              {item.systemGenerated && (
                <span className="inline-flex rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                  System Suggested
                </span>
              )}
            </div>

            <h2 className="mt-3 text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Action Item Details
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Connected recruitment action, linked gap, owner, deadline, and
              progress.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-100 hover:text-gray-700 active:scale-[0.98]"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      {item.actionId}
                    </p>

                    <h3 className="mt-2 text-lg font-bold leading-7 text-[#101828] sm:text-xl">
                      {item.actionItem}
                    </h3>

                    <p className="mt-2 text-sm font-semibold text-sibs-tertiary-5">
                      {item.roleAccount || `${item.roleTitle} / ${item.account}`}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getRiskClass(
                          item.riskLevel,
                        )}`}
                      >
                        {item.riskLevel} Risk
                      </span>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getGapClass(
                          item.linkedGap,
                        )}`}
                      >
                        {item.linkedGap}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1/70">
                      Deadline
                    </p>

                    <p className="mt-1 text-2xl font-bold text-sibs-primary-1">
                      {formatDate(item.deadline)}
                    </p>

                    <p className="mt-1 text-xs font-bold text-sibs-primary-1/70">
                      {getDaysLeft(item.deadline)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#101828]">
                      Recruitment Link
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                      This tells which module created or needs this action.
                    </p>
                  </div>

                  <ArrowRight size={18} className="text-sibs-tertiary-5" />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Module
                    </p>

                    <p className="mt-2 text-sm font-bold text-sibs-primary-1">
                      {item.module || "Recruitment"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Gap Type
                    </p>

                    <p className="mt-2 text-sm font-bold text-sibs-primary-1">
                      {item.linkedGap || "—"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Source
                    </p>

                    <p className="mt-2 text-sm font-bold text-sibs-primary-1">
                      {item.sourceType || "Manual"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#101828]">Remarks</h3>

                <p className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm font-medium leading-6 text-[#344054]">
                  {item.remarks || "No remarks provided."}
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-5 text-sm font-bold text-[#101828]">
                  Related Progress
                </h3>

                <ProgressBar
                  label="Filled vs Required"
                  value={Number(item.filled || 0)}
                  total={Number(item.requirement || 0)}
                  helper={`${Number(item.filled || 0)} filled out of ${Number(
                    item.requirement || 0,
                  )} required`}
                />

                <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-[#344054]">
                      Current Progress
                    </p>

                    <p className="text-sm font-bold text-sibs-primary-1">
                      {progress}%
                    </p>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
                    Progress is based on the filled and required values attached
                    to this action item.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Action Summary
                </h3>

                <div className="mt-4">
                  <DetailRow label="Action ID" value={item.actionId} />
                  <DetailRow label="Role" value={item.roleTitle} />
                  <DetailRow label="Account" value={item.account} />
                  <DetailRow label="Owner" value={item.owner} />
                  <DetailRow
                    label="Created Date"
                    value={formatDate(item.createdDate)}
                  />
                  <DetailRow
                    label="Deadline"
                    value={formatDate(item.deadline)}
                  />
                  <DetailRow label="Days Left" value={getDaysLeft(item.deadline)} />
                  <DetailRow label="Status" value={item.status} />
                  <DetailRow label="Risk Level" value={item.riskLevel} />
                  <DetailRow label="Linked Gap" value={item.linkedGap} />
                  <DetailRow label="Module" value={item.module} />
                  <DetailRow
                    label="Completed Date"
                    value={formatDate(item.completedDate)}
                  />
                </div>
              </div>

              {!isCompleted && !item.systemGenerated && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                  <h3 className="text-sm font-bold text-emerald-700">
                    Complete Action
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-emerald-700/90">
                    Mark this item as completed when the action has already been
                    executed or reported in the weekly hiring call.
                  </p>

                  <button
                    type="button"
                    onClick={() => onComplete(item)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98]"
                  >
                    <CheckCircle2 size={16} />
                    Mark as Completed
                  </button>
                </div>
              )}

              {item.systemGenerated && (
                <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
                  <h3 className="text-sm font-bold text-purple-700">
                    System Suggested
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-purple-700/90">
                    This item is generated from recruitment module data. It will
                    disappear once the related module data no longer triggers
                    the risk or pending condition.
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <h3 className="text-sm font-bold text-amber-700">
                  Required Rule
                </h3>

                <p className="mt-2 text-sm leading-6 text-amber-700/90">
                  Every role that is not fully hired must have at least one
                  active action item connected to a hiring gap.
                </p>
              </div>

              <div className="rounded-xl border border-red-100 bg-red-50 p-5">
                <h3 className="text-sm font-bold text-red-700">
                  Risk Reminder
                </h3>

                <p className="mt-2 text-sm leading-6 text-red-700/90">
                  High-risk items should be prioritized before the next weekly
                  report or leadership update.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-sibs-primary-1 px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

