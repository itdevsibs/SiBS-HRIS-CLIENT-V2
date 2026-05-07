import React, { useMemo, useRef, useState } from "react";
import Header from "../../components/layout/Header";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Eye,
  Lock,
  PieChart,
  Plus,
  RotateCcw,
  Search,
  Unlock,
  UserRound,
  X,
} from "lucide-react";

const initialWeeklyVersions = [
  {
    id: "WEEK-2026-08-11",
    label: "Week 33",
    weekRange: "Aug 11 - Aug 17, 2026",
    createdAt: "2026-08-11",
    locked: false,
    type: "current",
    records: [
      {
        id: 1,
        week: "Week 33",
        cluster: "Coast Dental",
        account: "Collect IV",
        requiredHeadcount: 30,
        actualHeadcount: 28,
        bufferHeadcount: 3,
        bufferPercent: 10,
        absenteeismCount: 6,
        absenteeismPercent: 19.38,
        attritionPastCount: 4,
        attritionPastPercent: 10.69,
        opsPrf: 16,
        attritionFstToPstCount: 21,
        attritionFstToPstPercent: 25,
        attritionNhoToFstPstCount: 24,
        attritionNhoToFstPstPercent: 10,
        attritionInterviewToNhoCount: 26,
        attritionInterviewToNhoPercent: 10,
        leadsToInterview: 38,
        hiringRate: 70,
        pipelineStatus: "At Risk",
        statusNote: "Low interview show rate",
        owner: "John D.",
        actionItems: [
          {
            id: 1,
            actionItem: "Increase sourcing for Collect IV.",
            roleAccount: "Collect IV / Coast Dental",
            owner: "John D.",
            deadline: "2026-08-14",
            status: "In Progress",
            remarks: "Need additional qualified screened candidates.",
          },
        ],
      },
      {
        id: 2,
        week: "Week 33",
        cluster: "Coast Dental",
        account: "Collect AR",
        requiredHeadcount: 55,
        actualHeadcount: 42,
        bufferHeadcount: 6,
        bufferPercent: 10,
        absenteeismCount: 7,
        absenteeismPercent: 11.76,
        attritionPastCount: 11,
        attritionPastPercent: 18.18,
        opsPrf: 37,
        attritionFstToPstCount: 49,
        attritionFstToPstPercent: 25,
        attritionNhoToFstPstCount: 55,
        attritionNhoToFstPstPercent: 10,
        attritionInterviewToNhoCount: 61,
        attritionInterviewToNhoPercent: 10,
        leadsToInterview: 1218,
        hiringRate: 5,
        pipelineStatus: "At Risk",
        statusNote: "High leads needed",
        owner: "Jane S.",
        actionItems: [
          {
            id: 1,
            actionItem: "Add sourcing channels for Collect AR.",
            roleAccount: "Collect AR / Coast Dental",
            owner: "Jane S.",
            deadline: "2026-08-15",
            status: "Pending",
            remarks: "High interview volume required because of low hiring rate.",
          },
        ],
      },
      {
        id: 3,
        week: "Week 33",
        cluster: "Coast Dental",
        account: "Connect",
        requiredHeadcount: 57,
        actualHeadcount: 47,
        bufferHeadcount: 6,
        bufferPercent: 10,
        absenteeismCount: 4,
        absenteeismPercent: 5.77,
        attritionPastCount: 9,
        attritionPastPercent: 15.38,
        opsPrf: 29,
        attritionFstToPstCount: 39,
        attritionFstToPstPercent: 25,
        attritionNhoToFstPstCount: 43,
        attritionNhoToFstPstPercent: 10,
        attritionInterviewToNhoCount: 48,
        attritionInterviewToNhoPercent: 10,
        leadsToInterview: 955,
        hiringRate: 5,
        pipelineStatus: "At Risk",
        statusNote: "Insufficient pipeline",
        owner: "Maria R.",
        actionItems: [],
      },
      {
        id: 4,
        week: "Week 33",
        cluster: "Coast Dental",
        account: "DentistRX",
        requiredHeadcount: 1,
        actualHeadcount: 1,
        bufferHeadcount: 0,
        bufferPercent: 0,
        absenteeismCount: 0,
        absenteeismPercent: 0,
        attritionPastCount: 0,
        attritionPastPercent: 0,
        opsPrf: 0,
        attritionFstToPstCount: 0,
        attritionFstToPstPercent: 25,
        attritionNhoToFstPstCount: 0,
        attritionNhoToFstPstPercent: 10,
        attritionInterviewToNhoCount: 0,
        attritionInterviewToNhoPercent: 10,
        leadsToInterview: 0,
        hiringRate: 5,
        pipelineStatus: "On Track",
        statusNote: "-",
        owner: "Mark T.",
        actionItems: [],
      },
      {
        id: 5,
        week: "Week 33",
        cluster: "Coast Dental",
        account: "Reconciliation",
        requiredHeadcount: 2,
        actualHeadcount: 2,
        bufferHeadcount: 0,
        bufferPercent: 0,
        absenteeismCount: 0,
        absenteeismPercent: 0,
        attritionPastCount: 0,
        attritionPastPercent: 0,
        opsPrf: 0,
        attritionFstToPstCount: 0,
        attritionFstToPstPercent: 25,
        attritionNhoToFstPstCount: 0,
        attritionNhoToFstPstPercent: 10,
        attritionInterviewToNhoCount: 0,
        attritionInterviewToNhoPercent: 10,
        leadsToInterview: 0,
        hiringRate: 5,
        pipelineStatus: "On Track",
        statusNote: "-",
        owner: "Kim D.",
        actionItems: [],
      },
      {
        id: 6,
        week: "Week 33",
        cluster: "Coast Dental",
        account: "TeleDentistry",
        requiredHeadcount: 3,
        actualHeadcount: 3,
        bufferHeadcount: 0,
        bufferPercent: 0,
        absenteeismCount: 0,
        absenteeismPercent: 0,
        attritionPastCount: 0,
        attritionPastPercent: 0,
        opsPrf: 0,
        attritionFstToPstCount: 0,
        attritionFstToPstPercent: 25,
        attritionNhoToFstPstCount: 0,
        attritionNhoToFstPstPercent: 10,
        attritionInterviewToNhoCount: 0,
        attritionInterviewToNhoPercent: 10,
        leadsToInterview: 0,
        hiringRate: 5,
        pipelineStatus: "On Track",
        statusNote: "-",
        owner: "Paul G.",
        actionItems: [],
      },
      {
        id: 7,
        week: "Week 33",
        cluster: "Coast Dental",
        account: "Cash",
        requiredHeadcount: 2,
        actualHeadcount: 2,
        bufferHeadcount: 0,
        bufferPercent: 0,
        absenteeismCount: 0,
        absenteeismPercent: 0,
        attritionPastCount: 0,
        attritionPastPercent: 0,
        opsPrf: 0,
        attritionFstToPstCount: 0,
        attritionFstToPstPercent: 25,
        attritionNhoToFstPstCount: 0,
        attritionNhoToFstPstPercent: 10,
        attritionInterviewToNhoCount: 0,
        attritionInterviewToNhoPercent: 10,
        leadsToInterview: 0,
        hiringRate: 5,
        pipelineStatus: "On Track",
        statusNote: "-",
        owner: "Grace L.",
        actionItems: [],
      },
      {
        id: 8,
        week: "Week 33",
        cluster: "US Visa",
        account: "US Visa",
        requiredHeadcount: 20,
        actualHeadcount: 15,
        bufferHeadcount: 2,
        bufferPercent: 10,
        absenteeismCount: 2,
        absenteeismPercent: 8,
        attritionPastCount: 3,
        attritionPastPercent: 12,
        opsPrf: 12,
        attritionFstToPstCount: 16,
        attritionFstToPstPercent: 25,
        attritionNhoToFstPstCount: 18,
        attritionNhoToFstPstPercent: 10,
        attritionInterviewToNhoCount: 20,
        attritionInterviewToNhoPercent: 10,
        leadsToInterview: 120,
        hiringRate: 15,
        pipelineStatus: "At Risk",
        statusNote: "Need additional sourcing",
        owner: "Lara M.",
        actionItems: [],
      },
      {
        id: 9,
        week: "Week 33",
        cluster: "SME",
        account: "Channel Assist",
        requiredHeadcount: 12,
        actualHeadcount: 10,
        bufferHeadcount: 1,
        bufferPercent: 10,
        absenteeismCount: 1,
        absenteeismPercent: 7.5,
        attritionPastCount: 1,
        attritionPastPercent: 8,
        opsPrf: 5,
        attritionFstToPstCount: 7,
        attritionFstToPstPercent: 25,
        attritionNhoToFstPstCount: 8,
        attritionNhoToFstPstPercent: 10,
        attritionInterviewToNhoCount: 9,
        attritionInterviewToNhoPercent: 10,
        leadsToInterview: 45,
        hiringRate: 20,
        pipelineStatus: "On Track",
        statusNote: "-",
        owner: "Nina P.",
        actionItems: [],
      },
      {
        id: 10,
        week: "Week 33",
        cluster: "Yomdel",
        account: "Yomdel",
        requiredHeadcount: 18,
        actualHeadcount: 12,
        bufferHeadcount: 2,
        bufferPercent: 10,
        absenteeismCount: 2,
        absenteeismPercent: 9,
        attritionPastCount: 3,
        attritionPastPercent: 14,
        opsPrf: 13,
        attritionFstToPstCount: 18,
        attritionFstToPstPercent: 25,
        attritionNhoToFstPstCount: 20,
        attritionNhoToFstPstPercent: 10,
        attritionInterviewToNhoCount: 22,
        attritionInterviewToNhoPercent: 10,
        leadsToInterview: 147,
        hiringRate: 15,
        pipelineStatus: "At Risk",
        statusNote: "Pipeline gap",
        owner: "Rex C.",
        actionItems: [],
      },
    ],
  },
  {
    id: "WEEK-2026-08-04",
    label: "Week 32",
    weekRange: "Aug 4 - Aug 10, 2026",
    createdAt: "2026-08-04",
    locked: true,
    type: "previous",
    records: [
      {
        id: 101,
        week: "Week 32",
        cluster: "Coast Dental",
        account: "Collect IV",
        requiredHeadcount: 30,
        actualHeadcount: 27,
        bufferHeadcount: 3,
        bufferPercent: 10,
        absenteeismCount: 5,
        absenteeismPercent: 17,
        attritionPastCount: 4,
        attritionPastPercent: 10,
        opsPrf: 15,
        attritionFstToPstCount: 20,
        attritionFstToPstPercent: 25,
        attritionNhoToFstPstCount: 22,
        attritionNhoToFstPstPercent: 10,
        attritionInterviewToNhoCount: 24,
        attritionInterviewToNhoPercent: 10,
        leadsToInterview: 35,
        hiringRate: 70,
        pipelineStatus: "At Risk",
        statusNote: "Final interviews pending",
        owner: "John D.",
        actionItems: [],
      },
    ],
  },
];

const initialActionItemForm = {
  actionItem: "",
  owner: "",
  deadline: "",
  status: "Pending",
  remarks: "",
};

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPercent(value) {
  const numberValue = Number(value || 0);

  if (numberValue > 0 && numberValue <= 1) {
    return `${(numberValue * 100).toFixed(2)}%`;
  }

  return `${numberValue.toFixed(2)}%`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function getNextWeekRange() {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);

  end.setDate(start.getDate() + 6);

  const startText = start.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });

  const endText = end.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startText} - ${endText}`;
}

function getNextWeekLabel(currentLabel) {
  const weekNumber = Number(String(currentLabel).replace(/\D/g, ""));
  if (!weekNumber) return "Current Week";
  return `Week ${weekNumber + 1}`;
}

function getOverallStatus(records) {
  const delayed = records.some((item) => item.pipelineStatus === "Delayed");
  const atRisk = records.some((item) => item.pipelineStatus === "At Risk");

  if (delayed || atRisk) return "AT RISK";

  const completed =
    records.length > 0 &&
    records.every(
      (item) => Number(item.actualHeadcount) >= Number(item.requiredHeadcount)
    );

  if (completed) return "COMPLETED";

  return "ON TRACK";
}

function calculatePipelineStatus(item) {
  if (Number(item.actualHeadcount) >= Number(item.requiredHeadcount)) {
    return "Completed";
  }

  const gap =
    Number(item.requiredHeadcount || 0) - Number(item.actualHeadcount || 0);

  if (gap <= 0) return "Completed";

  if (Number(item.leadsToInterview || 0) === 0 && gap > 0) {
    return "Delayed";
  }

  if (Number(item.leadsToInterview || 0) < Number(item.opsPrf || 0)) {
    return "At Risk";
  }

  return "On Track";
}

function getStatusClass(status) {
  switch (status) {
    case "On Track":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "At Risk":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Delayed":
      return "border-red-200 bg-red-50 text-red-700";
    case "Completed":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "In Progress":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case "Pending":
      return "border-gray-200 bg-gray-50 text-gray-700";
    case "Not Started":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function MetricCard({
  title,
  value,
  icon: Icon,
  iconClassName = "bg-blue-50 text-sibs-primary-1",
  valueClassName = "text-sibs-primary-1",
}) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconClassName}`}
        >
          <Icon size={22} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-[#101828]">{title}</p>
          <h3 className={`mt-1 truncate text-3xl font-bold ${valueClassName}`}>
            {value}
          </h3>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className="text-sm font-bold text-[#344054]">{value ?? "—"}</div>
    </div>
  );
}

function PercentageGraphSection({ filteredPlans, overallStatus }) {
  const [openMetric, setOpenMetric] = useState("attritionPastPercent");

  const percentageMetrics = [
    {
      countKey: "absenteeismCount",
      percentKey: "absenteeismPercent",
      label: "Absenteeism",
    },
    {
      countKey: "attritionPastCount",
      percentKey: "attritionPastPercent",
      label: "Attrition - Past 6 Weeks",
    },
    {
      countKey: "attritionFstToPstCount",
      percentKey: "attritionFstToPstPercent",
      label: "Attrition - FST to PST / c/o QDS",
    },
    {
      countKey: "attritionNhoToFstPstCount",
      percentKey: "attritionNhoToFstPstPercent",
      label: "Attrition - NHO to FST-PST / c/o TA",
    },
    {
      countKey: "attritionInterviewToNhoCount",
      percentKey: "attritionInterviewToNhoPercent",
      label: "Attrition - Interview to NHO / c/o TA",
    },
  ];

  const graphData = percentageMetrics.map((metric) => {
    const totalCount = filteredPlans.reduce(
      (sum, item) => sum + Number(item[metric.countKey] || 0),
      0
    );

    const averagePercent =
      filteredPlans.length > 0
        ? filteredPlans.reduce(
            (sum, item) => sum + Number(item[metric.percentKey] || 0),
            0
          ) / filteredPlans.length
        : 0;

    return {
      ...metric,
      totalCount,
      averagePercent,
    };
  });

  const maxPercent = Math.max(
    25,
    ...graphData.map((item) => Number(item.averagePercent || 0))
  );

  function getBarColor(value) {
    if (value >= 20) return "bg-red-500";
    if (value >= 10) return "bg-orange-400";
    return "bg-emerald-500";
  }

  return (
    <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-base font-bold text-[#101828]">
            Percentage Risk Graph
          </h2>

          <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
            Combined count and average percentage based on the selected account
            or cluster filter. Click each item to view account details.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="inline-flex w-fit rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#344054]">
            Accounts Included: {filteredPlans.length}
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${
              overallStatus === "AT RISK"
                ? "border-orange-200 bg-orange-50 text-orange-600"
                : overallStatus === "COMPLETED"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            <AlertTriangle size={17} />
            Overall Status: {overallStatus}
          </div>
        </div>
      </div>

      {filteredPlans.length > 0 ? (
        <div className="space-y-3">
          {graphData.map((metric) => {
            const isOpen = openMetric === metric.percentKey;
            const width = Math.min(
              (metric.averagePercent / maxPercent) * 100,
              100
            );

            return (
              <div
                key={metric.percentKey}
                className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-[#F8FAFC]"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenMetric(isOpen ? "" : metric.percentKey)
                  }
                  className="w-full p-4 text-left transition hover:bg-white"
                >
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-sibs-primary-1 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#101828]">
                          {metric.label}
                        </p>

                        <p className="text-xs font-semibold text-sibs-tertiary-5">
                          Total Count: {formatNumber(metric.totalCount)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-sm font-bold text-sibs-primary-1">
                        {formatPercent(metric.averagePercent)}
                      </p>

                      <p className="text-xs font-semibold text-sibs-tertiary-5">
                        Average %
                      </p>
                    </div>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-[#E6ECF2]">
                    <div
                      className={`h-full rounded-full ${getBarColor(
                        metric.averagePercent
                      )}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-[#E6ECF2] bg-white p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[520px] border-collapse text-left">
                        <thead>
                          <tr className="border-b border-[#E6ECF2] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                            <th className="px-3 py-3">Account</th>
                            <th className="px-3 py-3">Cluster</th>
                            <th className="px-3 py-3 text-center">Count</th>
                            <th className="px-3 py-3 text-center">
                              Percentage
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-[#E6ECF2]">
                          {filteredPlans.map((item) => (
                            <tr key={`${metric.percentKey}-${item.id}`}>
                              <td className="px-3 py-3 text-sm font-bold text-[#101828]">
                                {item.account}
                              </td>

                              <td className="px-3 py-3 text-sm font-semibold text-[#344054]">
                                {item.cluster}
                              </td>

                              <td className="px-3 py-3 text-center text-sm font-semibold text-[#344054]">
                                {formatNumber(item[metric.countKey])}
                              </td>

                              <td className="px-3 py-3 text-center text-sm font-bold text-sibs-primary-1">
                                {formatPercent(item[metric.percentKey])}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-10 text-center text-sm font-bold text-gray-500">
          No graph data available for the selected filter.
        </div>
      )}
    </section>
  );
}

function ActionItemModal({
  open,
  item,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  if (!open || !item) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Add Action Item
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Add a weekly action item for {item.account} / {item.cluster}.
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

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-bold text-sibs-primary-1">
              {item.account} / {item.cluster}
            </p>
            <p className="mt-1 text-xs font-semibold text-sibs-primary-1/70">
              Required: {item.requiredHeadcount} / Actual:{" "}
              {item.actualHeadcount} / Leads: {item.leadsToInterview}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Action Item <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.actionItem}
                onChange={(e) =>
                  setForm({ ...form, actionItem: e.target.value })
                }
                placeholder="Example: Increase sourcing volume."
                className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Owner <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                placeholder="TA Owner"
                className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Deadline <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm({ ...form, deadline: e.target.value })
                }
                className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              >
                <option value="Not Started">Not Started</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Remarks
              </label>
              <textarea
                rows={3}
                value={form.remarks}
                onChange={(e) =>
                  setForm({ ...form, remarks: e.target.value })
                }
                placeholder="Add notes or next steps."
                className="w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <Plus size={17} />
              Save Action Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ViewPlanModal({
  open,
  item,
  locked,
  previousWeekItem,
  onClose,
  onOpenActionItem,
}) {
  if (!open || !item) return null;

  const previousLeadsNeeded = Number(previousWeekItem?.leadsToInterview || 0);
  const currentLeadsNeeded = Number(item.leadsToInterview || 0);
  const remaining = Math.max(currentLeadsNeeded - previousLeadsNeeded, 0);

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Weekly Hiring Plan Details
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              {item.account} / {item.cluster}
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-[#101828] sm:text-xl">
                      {item.account}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                      {item.week} / {item.cluster}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                          item.pipelineStatus
                        )}`}
                      >
                        {item.pipelineStatus}
                      </span>

                      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
                        Owner: {item.owner}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1/70">
                      Leads Gap vs Previous Week
                    </p>

                    <p className="mt-1 text-2xl font-bold text-sibs-primary-1">
                      {remaining}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-sibs-primary-1/70">
                      Prev: {previousLeadsNeeded} / This Week:{" "}
                      {currentLeadsNeeded}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <InfoBox
                  label="Required Headcount"
                  value={item.requiredHeadcount}
                />
                <InfoBox
                  label="Actual Headcount"
                  value={item.actualHeadcount}
                />
                <InfoBox
                  label="Buffer"
                  value={`${item.bufferHeadcount} / ${formatPercent(
                    item.bufferPercent
                  )}`}
                />
                <InfoBox
                  label="Absenteeism"
                  value={`${item.absenteeismCount} / ${formatPercent(
                    item.absenteeismPercent
                  )}`}
                />
                <InfoBox
                  label="Attrition Past 6 Weeks"
                  value={`${item.attritionPastCount} / ${formatPercent(
                    item.attritionPastPercent
                  )}`}
                />
                <InfoBox label="OPS PRF" value={item.opsPrf} />
                <InfoBox
                  label="FST to PST"
                  value={`${item.attritionFstToPstCount} / ${formatPercent(
                    item.attritionFstToPstPercent
                  )}`}
                />
                <InfoBox
                  label="NHO to FST-PST"
                  value={`${item.attritionNhoToFstPstCount} / ${formatPercent(
                    item.attritionNhoToFstPstPercent
                  )}`}
                />
                <InfoBox
                  label="Interview to NHO"
                  value={`${item.attritionInterviewToNhoCount} / ${formatPercent(
                    item.attritionInterviewToNhoPercent
                  )}`}
                />
                <InfoBox
                  label="Leads to Interview"
                  value={item.leadsToInterview}
                />
                <InfoBox
                  label="Hiring Rate"
                  value={formatPercent(item.hiringRate)}
                />
                <InfoBox label="Status Note" value={item.statusNote} />
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Excel Logic
                </h3>
                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  Required HC vs Actual HC plus buffer, absenteeism, attrition,
                  and conversion attrition determines OPS PRF and leads to
                  interview.
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Record State
                </h3>

                <div className="mt-4 flex items-center gap-2">
                  {locked ? (
                    <>
                      <Lock size={17} className="text-gray-500" />
                      <p className="text-sm font-bold text-gray-600">
                        Locked historical version
                      </p>
                    </>
                  ) : (
                    <>
                      <Unlock size={17} className="text-emerald-600" />
                      <p className="text-sm font-bold text-emerald-700">
                        Editable current version
                      </p>
                    </>
                  )}
                </div>
              </div>

              {!locked && (
                <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-[#101828]">Actions</h3>

                  <div className="mt-4 space-y-2">
                    <button
                      type="button"
                      onClick={() => onOpenActionItem(item)}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5"
                    >
                      <ClipboardList size={16} />
                      Add Action Item
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[var(--sibs-primary-1)] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiSnapshotModal({ open, week, onClose }) {
  if (!open || !week) return null;

  const records = week.records || [];

  const required = records.reduce(
    (sum, item) => sum + Number(item.requiredHeadcount || 0),
    0
  );

  const actual = records.reduce(
    (sum, item) => sum + Number(item.actualHeadcount || 0),
    0
  );

  const opsPrf = records.reduce(
    (sum, item) => sum + Number(item.opsPrf || 0),
    0
  );

  const leads = records.reduce(
    (sum, item) => sum + Number(item.leadsToInterview || 0),
    0
  );

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Weekly KPI Snapshot
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Weekly manpower requirement, OPS PRF, and leads needed.
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <InfoBox label="Required Headcount" value={required} />
            <InfoBox label="Actual Headcount" value={actual} />
            <InfoBox label="OPS PRF" value={opsPrf} />
            <InfoBox label="Leads to Interview" value={leads} />
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[var(--sibs-primary-1)] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WeeklyHiringPlanPage() {
  const mainScrollRef = useRef(null);

  const [weeklyVersions, setWeeklyVersions] = useState(initialWeeklyVersions);
  const [activeWeekId, setActiveWeekId] = useState(initialWeeklyVersions[0].id);
  const [search, setSearch] = useState("");
  const [clusterFilter, setClusterFilter] = useState("All");
  const [accountFilter, setAccountFilter] = useState("All");

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [actionItemTarget, setActionItemTarget] = useState(null);
  const [actionItemForm, setActionItemForm] = useState(initialActionItemForm);
  const [showKpiSnapshot, setShowKpiSnapshot] = useState(false);

  const activeWeek =
    weeklyVersions.find((week) => week.id === activeWeekId) ||
    weeklyVersions[0];

  const activeData = activeWeek?.records || [];
  const isLocked = !!activeWeek?.locked;

  const clusterOptions = useMemo(() => {
    const clusters = activeData
      .map((item) => item.cluster || "Unassigned Cluster")
      .filter(Boolean);

    return ["All", ...Array.from(new Set(clusters))];
  }, [activeData]);

  const accountOptions = useMemo(() => {
    const accounts = activeData
      .filter((item) => {
        if (clusterFilter === "All") return true;
        return (item.cluster || "Unassigned Cluster") === clusterFilter;
      })
      .map((item) => item.account || "Unassigned Account")
      .filter(Boolean);

    return ["All", ...Array.from(new Set(accounts))];
  }, [activeData, clusterFilter]);

  const filteredPlans = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return activeData.filter((item) => {
      const cluster = item.cluster || "Unassigned Cluster";
      const account = item.account || "Unassigned Account";

      const matchesCluster =
        clusterFilter === "All" || cluster === clusterFilter;

      const matchesAccount =
        accountFilter === "All" || account === accountFilter;

      const matchesKeyword =
        !keyword ||
        String(item.week || activeWeek.label || "")
          .toLowerCase()
          .includes(keyword) ||
        cluster.toLowerCase().includes(keyword) ||
        account.toLowerCase().includes(keyword) ||
        String(item.pipelineStatus || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.statusNote || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.owner || "")
          .toLowerCase()
          .includes(keyword);

      return matchesCluster && matchesAccount && matchesKeyword;
    });
  }, [activeData, activeWeek.label, search, clusterFilter, accountFilter]);

  const totals = useMemo(() => {
    const totalRequired = filteredPlans.reduce(
      (sum, item) => sum + Number(item.requiredHeadcount || 0),
      0
    );

    const actualHeadcount = filteredPlans.reduce(
      (sum, item) => sum + Number(item.actualHeadcount || 0),
      0
    );

    const opsPrf = filteredPlans.reduce(
      (sum, item) => sum + Number(item.opsPrf || 0),
      0
    );

    const leadsToInterview = filteredPlans.reduce(
      (sum, item) => sum + Number(item.leadsToInterview || 0),
      0
    );

    const overallStatus = getOverallStatus(filteredPlans);

    return {
      totalRequired,
      actualHeadcount,
      opsPrf,
      leadsToInterview,
      overallStatus,
    };
  }, [filteredPlans]);

  const activeWeekIndex = weeklyVersions.findIndex(
    (week) => week.id === activeWeekId
  );

  const previousWeek = weeklyVersions[activeWeekIndex + 1];

  const previousSelectedPlan = selectedPlan
    ? previousWeek?.records?.find(
        (record) =>
          record.account === selectedPlan.account &&
          record.cluster === selectedPlan.cluster
      )
    : null;

  function handleCreateNewWeeklyVersion() {
    const today = getTodayDate();
    const newWeekId = `WEEK-${today}-${Date.now()}`;
    const currentWeek = activeWeek;
    const newWeekLabel = getNextWeekLabel(currentWeek.label);

    const clonedRecords = (currentWeek.records || []).map((item, index) => {
      const nextItem = {
        ...item,
        id: Date.now() + index,
        week: newWeekLabel,
        actionItems: [],
      };

      return {
        ...nextItem,
        pipelineStatus: calculatePipelineStatus(nextItem),
      };
    });

    setWeeklyVersions((prev) => {
      const lockedPrevious = prev.map((week) =>
        week.id === currentWeek.id
          ? {
              ...week,
              locked: true,
              label: "Previous Week",
              type: "previous",
            }
          : {
              ...week,
              type: week.type === "previous" ? "archive" : week.type,
            }
      );

      const newWeek = {
        id: newWeekId,
        label: newWeekLabel,
        weekRange: getNextWeekRange(),
        createdAt: today,
        locked: false,
        type: "current",
        records: clonedRecords,
      };

      return [newWeek, ...lockedPrevious];
    });

    setActiveWeekId(newWeekId);
    setClusterFilter("All");
    setAccountFilter("All");
    setSearch("");

    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  function updateActiveWeekRecords(nextRecords) {
    setWeeklyVersions((prev) =>
      prev.map((week) =>
        week.id === activeWeekId
          ? {
              ...week,
              records: nextRecords,
            }
          : week
      )
    );
  }

  function handleOpenActionItemModal(item) {
    setActionItemTarget(item);
    setActionItemForm({
      ...initialActionItemForm,
      owner: item.owner || "",
    });
  }

  function handleCloseActionItemModal() {
    setActionItemTarget(null);
    setActionItemForm(initialActionItemForm);
  }

  function handleSubmitActionItem(e) {
    e.preventDefault();

    if (!actionItemTarget) return;

    const newActionItem = {
      id: Date.now(),
      actionItem: actionItemForm.actionItem.trim(),
      roleAccount: `${actionItemTarget.account} / ${actionItemTarget.cluster}`,
      owner: actionItemForm.owner.trim(),
      deadline: actionItemForm.deadline,
      status: actionItemForm.status,
      remarks: actionItemForm.remarks.trim(),
    };

    const updatedItem = {
      ...actionItemTarget,
      actionItems: [...(actionItemTarget.actionItems || []), newActionItem],
    };

    const nextRecords = activeData.map((item) =>
      item.id === actionItemTarget.id ? updatedItem : item
    );

    updateActiveWeekRecords(nextRecords);
    setSelectedPlan(updatedItem);
    handleCloseActionItemModal();
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main
        ref={mainScrollRef}
        className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6"
      >
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-sibs-primary-1 sm:text-3xl">
                Weekly Hiring Plan
              </h1>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Manage weekly manpower requirement, OPS PRF, leads needed, and
                action items.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setShowKpiSnapshot(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5"
              >
                <Eye size={17} />
                KPI Snapshot
              </button>

              <button
                type="button"
                onClick={handleCreateNewWeeklyVersion}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5"
              >
                <RotateCcw size={17} />
                Create New Week
              </button>

              {!isLocked && (
                <button
                  type="button"
                  onClick={handleCreateNewWeeklyVersion}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
                >
                  <Plus size={18} />
                  New Version
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.1fr_1fr_1fr_1fr] xl:items-end">
              <div>
                <label className="mb-1 block text-sm font-bold text-[#101828]">
                  Weekly Version
                </label>

                <div className="relative">
                  <select
                    value={activeWeekId}
                    onChange={(e) => {
                      setActiveWeekId(e.target.value);
                      setClusterFilter("All");
                      setAccountFilter("All");
                    }}
                    className="h-12 w-full appearance-none rounded-xl border border-[#D0D5DD] bg-white px-4 pr-11 text-sm font-bold text-[#344054] outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                  >
                    {weeklyVersions.map((week) => (
                      <option key={week.id} value={week.id}>
                        {week.weekRange} ({week.label})
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-[#101828]">
                  Cluster
                </label>

                <div className="relative">
                  <select
                    value={clusterFilter}
                    onChange={(e) => {
                      setClusterFilter(e.target.value);
                      setAccountFilter("All");
                    }}
                    className="h-12 w-full appearance-none rounded-xl border border-[#D0D5DD] bg-white px-4 pr-11 text-sm font-bold text-[#344054] outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                  >
                    {clusterOptions.map((cluster) => (
                      <option key={cluster} value={cluster}>
                        {cluster === "All" ? "All Clusters" : cluster}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-[#101828]">
                  Account
                </label>

                <div className="relative">
                  <select
                    value={accountFilter}
                    onChange={(e) => setAccountFilter(e.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border border-[#D0D5DD] bg-white px-4 pr-11 text-sm font-bold text-[#344054] outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                  >
                    {accountOptions.map((account) => (
                      <option key={account} value={account}>
                        {account === "All" ? "All Accounts" : account}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-[#101828]">
                  Search
                </label>

                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search hiring plan..."
                    className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${
                  isLocked
                    ? "border-gray-200 bg-gray-50 text-gray-600"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {isLocked ? <Lock size={13} /> : <Unlock size={13} />}
                {isLocked ? "Locked" : "Editable"}
              </span>

              {(clusterFilter !== "All" || accountFilter !== "All" || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setClusterFilter("All");
                    setAccountFilter("All");
                    setSearch("");
                  }}
                  className="inline-flex rounded-full border border-[#E6ECF2] bg-white px-3 py-1 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              title="Required Headcount"
              value={totals.totalRequired}
              icon={ClipboardList}
              iconClassName="bg-blue-50 text-sibs-primary-1"
              valueClassName="text-sibs-primary-1"
            />

            <MetricCard
              title="Actual Headcount"
              value={totals.actualHeadcount}
              icon={UserRound}
              iconClassName="bg-indigo-50 text-sibs-primary-1"
              valueClassName="text-sibs-primary-1"
            />

            <MetricCard
              title="OPS PRF"
              value={totals.opsPrf}
              icon={CheckCircle2}
              iconClassName="bg-emerald-50 text-emerald-600"
              valueClassName="text-emerald-600"
            />

            <MetricCard
              title="Leads Needed"
              value={totals.leadsToInterview}
              icon={PieChart}
              iconClassName="bg-violet-50 text-sibs-primary-1"
              valueClassName="text-sibs-primary-1"
            />

            <MetricCard
              title="Overall Status"
              value={totals.overallStatus}
              icon={AlertTriangle}
              iconClassName="bg-orange-50 text-orange-500"
              valueClassName={
                totals.overallStatus === "AT RISK"
                  ? "text-orange-500"
                  : totals.overallStatus === "COMPLETED"
                    ? "text-blue-600"
                    : "text-emerald-600"
              }
            />
          </div>

          <PercentageGraphSection
            filteredPlans={filteredPlans}
            overallStatus={totals.overallStatus}
          />

          <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
            <div className="hidden lg:block">
              <div className="overflow-x-auto p-6">
                <table className="w-full min-w-[1200px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
                  <thead>
                    <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                      <th className="px-5 py-4 first:rounded-tl-2xl">
                        Account
                      </th>
                      <th className="px-5 py-4 text-center">
                        Required
                        <br />
                        Headcount
                      </th>
                      <th className="px-5 py-4 text-center">
                        Actual
                        <br />
                        Headcount
                      </th>
                      <th className="px-5 py-4 text-center">
                        Buffer
                        <br />
                        Count
                      </th>
                      <th className="px-5 py-4 text-center">
                        Buffer
                        <br />%
                      </th>
                      <th className="px-5 py-4 text-center">OPS PRF</th>
                      <th className="px-5 py-4 text-center">
                        Leads to
                        <br />
                        Interview
                      </th>
                      <th className="px-5 py-4 text-center">
                        Hiring
                        <br />
                        Rate
                      </th>
                      <th className="px-5 py-4 text-center">Status</th>
                      <th className="px-5 py-4">Status Note</th>
                      <th className="px-5 py-4 text-right last:rounded-tr-2xl">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPlans.length > 0 ? (
                      filteredPlans.map((item) => (
                        <tr
                          key={item.id}
                          className="transition hover:bg-[#FAFBFC]"
                        >
                          <td className="border-b border-[#E6ECF2] px-5 py-5 align-middle">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#0F172A]">
                                {item.account}
                              </p>
                              <p className="mt-1 text-xs font-medium text-[#174A7C]">
                                {item.cluster}
                              </p>
                            </div>
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-semibold text-[#1E293B]">
                            {item.requiredHeadcount}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-semibold text-[#1E293B]">
                            {item.actualHeadcount}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-semibold text-[#1E293B]">
                            {item.bufferHeadcount}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-semibold text-[#1E293B]">
                            {formatPercent(item.bufferPercent)}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-sibs-primary-1">
                            {item.opsPrf}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-semibold text-[#1E293B]">
                            {item.leadsToInterview}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-semibold text-[#1E293B]">
                            {formatPercent(item.hiringRate)}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
                            <span
                              className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                item.pipelineStatus
                              )}`}
                            >
                              {item.pipelineStatus}
                            </span>
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5">
                            <span className="text-sm font-medium text-sibs-tertiary-5">
                              {item.statusNote || "-"}
                            </span>
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedPlan(item)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 py-2 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] hover:shadow-sm"
                            >
                              <Eye size={16} />
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={11}
                          className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                        >
                          No weekly hiring plan records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-[#E6ECF2] px-6 py-4">
                <p className="text-sm font-medium text-sibs-primary-1">
                  Showing 1 to {filteredPlans.length} of {filteredPlans.length}{" "}
                  hiring plan
                  {filteredPlans.length === 1 ? " record" : " records"}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-tertiary-5"
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sibs-primary-1 text-sm font-bold text-white"
                  >
                    1
                  </button>

                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-tertiary-5"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 lg:hidden">
              {filteredPlans.length > 0 ? (
                filteredPlans.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedPlan(item)}
                    className="w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-[var(--sibs-primary-1)]/40 hover:bg-[#FAFBFC]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#0F172A]">
                          {item.account}
                        </h3>

                        <p className="mt-1 text-xs font-medium text-sibs-tertiary-5">
                          {item.cluster}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
                          item.pipelineStatus
                        )}`}
                      >
                        {item.pipelineStatus}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="rounded-xl bg-[#F8FAFC] p-3">
                        <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
                          Required
                        </p>
                        <p className="mt-1 text-sm font-bold text-sibs-primary-1">
                          {item.requiredHeadcount}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#F8FAFC] p-3">
                        <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
                          Actual
                        </p>
                        <p className="mt-1 text-sm font-bold text-sibs-primary-1">
                          {item.actualHeadcount}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#F8FAFC] p-3">
                        <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
                          Leads
                        </p>
                        <p className="mt-1 text-sm font-bold text-emerald-600">
                          {item.leadsToInterview}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#F8FAFC] p-3">
                        <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
                          Rate
                        </p>
                        <p className="mt-1 text-sm font-bold text-[#1E293B]">
                          {formatPercent(item.hiringRate)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs font-medium text-[#475467]">
                      Status Note: {item.statusNote || "-"}
                    </p>
                  </button>
                ))
              ) : (
                <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                  No weekly hiring plan records found.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <ViewPlanModal
        open={!!selectedPlan}
        item={selectedPlan}
        locked={isLocked}
        previousWeekItem={previousSelectedPlan}
        onClose={() => setSelectedPlan(null)}
        onOpenActionItem={handleOpenActionItemModal}
      />

      <ActionItemModal
        open={!!actionItemTarget}
        item={actionItemTarget}
        form={actionItemForm}
        setForm={setActionItemForm}
        onClose={handleCloseActionItemModal}
        onSubmit={handleSubmitActionItem}
      />

      <KpiSnapshotModal
        open={showKpiSnapshot}
        week={activeWeek}
        onClose={() => setShowKpiSnapshot(false)}
      />
    </div>
  );
}