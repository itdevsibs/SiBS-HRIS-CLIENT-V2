import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../components/layout/Header";
import api from "../../lib/axios/api-template";
import StatusModal from "../../components/modals/StatusModal";
import {
  getWeeklyHiringPlanAccounts,
  getWeeklyHiringPlanWeeks,
} from "../../lib/axios/getWeeklyHiringPlan";
import { useUser } from "../../services/context/UserContext";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  Eye,
  Lock,
  Paperclip,
  PieChart,
  Plus,
  Search,
  Unlock,
  Upload,
  UserRound,
  X,
} from "lucide-react";

const CLUSTER_OPTIONS = ["Coast Dental", "US Visa", "SME", "Yomdel", "Corporate"];

const initialActionItemForm = {
  actionItem: "",
  owner: "",
  deadline: "",
  status: "Pending",
  remarks: "",
};

function useLockBodyScroll(open) {
  useEffect(() => {
    if (!open) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function toDateKey(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().split("T")[0];
}

function formatWeekDate(date, includeYear = false) {
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  });
}

function formatPercent(value) {
  const numberValue = Number(value || 0);

  if (numberValue > 0 && numberValue <= 1) {
    return `${(numberValue * 100).toFixed(2)}%`;
  }

  return `${numberValue.toFixed(2)}%`;
}

function formatGraphPercent(value) {
  const numberValue = Number(value || 0);

  return `${numberValue.toFixed(2)}%`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function getBackendNumber(record, keys, fallback = 0) {
  for (const key of keys) {
    const rawValue = record?.[key];

    if (rawValue !== undefined && rawValue !== null && rawValue !== "") {
      const numberValue = Number(rawValue);

      if (Number.isFinite(numberValue)) {
        return numberValue;
      }
    }
  }

  const fallbackNumber = Number(fallback || 0);

  return Number.isFinite(fallbackNumber) ? fallbackNumber : 0;
}

function getClusterFilterLabel(selectedClusters = []) {
  if (!selectedClusters.length || selectedClusters.includes("All")) {
    return "All Clusters";
  }

  if (selectedClusters.length === 1) {
    return selectedClusters[0];
  }

  return `${selectedClusters.length} Clusters Selected`;
}

function getAccountFilterLabel(selectedAccounts = []) {
  if (!selectedAccounts.length || selectedAccounts.includes("All")) {
    return "All Accounts";
  }

  if (selectedAccounts.length === 1) {
    return selectedAccounts[0];
  }

  return `${selectedAccounts.length} Accounts Selected`;
}

function getFileExtension(filename) {
  return String(filename || "").split(".").pop()?.toLowerCase() || "";
}

function getFileTypeLabel(filename) {
  const ext = getFileExtension(filename);

  if (["doc", "docx"].includes(ext)) return "WORD";
  if (["xls", "xlsx", "csv"].includes(ext)) return "EXCEL";
  if (ext === "pdf") return "PDF";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "heic", "heif"].includes(ext)) {
    return "IMAGE";
  }

  return "FILE";
}

function getFileTypeIconClass(filename) {
  const ext = getFileExtension(filename);

  if (["doc", "docx"].includes(ext)) return "bg-blue-600";
  if (["xls", "xlsx", "csv"].includes(ext)) return "bg-green-600";
  if (ext === "pdf") return "bg-red-600";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "heic", "heif"].includes(ext)) {
    return "bg-purple-600";
  }

  return "bg-gray-600";
}

function FileTypeIcon({ filename }) {
  const label = getFileTypeLabel(filename);

  return (
    <div className="relative h-12 w-10 shrink-0">
      <div className="absolute inset-0 rounded-md border-2 border-gray-300 bg-white" />
      <div className="absolute right-0 top-0 h-3 w-3 border-b-2 border-l-2 border-gray-300 bg-gray-100" />
      <div className="absolute left-1 top-1/2 h-[2px] w-6 -translate-y-1/2 bg-gray-300" />
      <div className="absolute left-1 top-[60%] h-[2px] w-5 bg-gray-300" />

      <div
        className={`absolute -left-2 bottom-1 rounded-md px-2 py-1 text-[9px] font-bold text-white shadow ${getFileTypeIconClass(
          filename
        )}`}
      >
        {label}
      </div>
    </div>
  );
}

function getNextWeekRangeFromActiveWeek(activeWeek) {
  const nextStart = new Date(activeWeek?.endDate || getTodayDate());
  nextStart.setDate(nextStart.getDate() + 1);

  const nextEnd = new Date(nextStart);
  nextEnd.setDate(nextStart.getDate() + 6);

  return {
    startDate: toDateKey(nextStart),
    endDate: toDateKey(nextEnd),
    weekRange: `${formatWeekDate(nextStart)} - ${formatWeekDate(
      nextEnd,
      true
    )}`,
  };
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
  const requiredHeadcount = Number(item.requiredHeadcount || 0);
  const actualHeadcount = Number(item.actualHeadcount || 0);
  const leadsToInterview = Number(item.leadsToInterview || 0);
  const opsPrf = Number(item.opsPrf || 0);

  if (requiredHeadcount <= 0) return "Pending";

  /*
    Excel logic:
    Even if Actual HC is equal to or higher than Required HC,
    the account is still At Risk when OPS PRF / Leads Needed exists.
  */
  if (opsPrf > 0 || leadsToInterview > 0) {
    return "At Risk";
  }

  if (actualHeadcount >= requiredHeadcount) {
    return "Completed";
  }

  const gap = requiredHeadcount - actualHeadcount;

  if (leadsToInterview === 0 && gap > 0) {
    return "Delayed";
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

async function saveRequiredHeadcount(payload) {
  const res = await api.post("/api/weekly-hiring-plan/headcount", payload, {
    withCredentials: true,
  });

  return res.data;
}

async function updateWeeklyHiringPlanFile(payload) {
  const formData = new FormData();

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (key === "uploadedFile") return;

    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  if (payload?.uploadedFile) {
    formData.append("uploadedFile", payload.uploadedFile);
  }

  const res = await api.post("/api/weekly-hiring-plan/headcount/file", formData, {
    withCredentials: true,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}

async function openWeeklyHiringPlanFile({ sibsId, filename }) {
  if (!sibsId || !filename) {
    throw new Error("Missing file information.");
  }

  const res = await api.get(
    `/api/weekly-hiring-plan/file/${encodeURIComponent(
      sibsId
    )}/${encodeURIComponent(filename)}`,
    {
      responseType: "blob",
      withCredentials: true,
    }
  );

  const blobUrl = window.URL.createObjectURL(res.data);
  window.open(blobUrl, "_blank", "noopener,noreferrer");

  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 60_000);
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
  const [openMetric, setOpenMetric] = useState("absenteeismPercent");

  const maxActualPercent = 100;
  const maxDisplayPercent = 25;

  const percentageMetrics = [
    {
      countKey: "absenteeismCount",
      percentKey: "absenteeismPercent",
      denominatorKey: "scheduledCount",
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

  function scaleToDisplayPercent(actualPercent) {
    const safeActualPercent = Math.max(
      0,
      Math.min(Number(actualPercent || 0), 100)
    );

    return (safeActualPercent / maxActualPercent) * maxDisplayPercent;
  }

  function getItemPercent(item, metric) {
    const directPercent = Number(item[metric.percentKey] || 0);

    if (metric.denominatorKey) {
      const count = Number(item[metric.countKey] || 0);
      const denominator = Number(item[metric.denominatorKey] || 0);

      if (denominator > 0) {
        return (count / denominator) * 100;
      }

      return directPercent;
    }

    return directPercent;
  }

  const graphData = percentageMetrics.map((metric) => {
    const totalCount = filteredPlans.reduce(
      (sum, item) => sum + Number(item[metric.countKey] || 0),
      0
    );

    let actualPercent = 0;

    if (metric.denominatorKey) {
      const totalDenominator = filteredPlans.reduce(
        (sum, item) => sum + Number(item[metric.denominatorKey] || 0),
        0
      );

      actualPercent =
        totalDenominator > 0 ? (totalCount / totalDenominator) * 100 : 0;
    } else {
      actualPercent =
        filteredPlans.length > 0
          ? filteredPlans.reduce(
              (sum, item) => sum + Number(item[metric.percentKey] || 0),
              0
            ) / filteredPlans.length
          : 0;
    }

    return {
      ...metric,
      totalCount,
      actualPercent: Number(actualPercent || 0),
      displayPercent: scaleToDisplayPercent(actualPercent),
    };
  });

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
            Absenteeism is scaled from actual percentage into a 25% maximum risk
            scale.
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
              (metric.actualPercent / maxActualPercent) * 100,
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
                          {metric.denominatorKey
                            ? ` / Scheduled: ${formatNumber(
                                filteredPlans.reduce(
                                  (sum, item) =>
                                    sum +
                                    Number(item[metric.denominatorKey] || 0),
                                  0
                                )
                              )}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-sm font-bold text-sibs-primary-1">
                        {formatGraphPercent(metric.displayPercent)}
                      </p>

                      <p className="text-xs font-semibold text-sibs-tertiary-5">
                        25% Scale
                      </p>
                    </div>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-[#E6ECF2]">
                    <div
                      className={`h-full rounded-full ${getBarColor(
                        metric.displayPercent
                      )}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-[#E6ECF2] bg-white p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[620px] border-collapse text-left">
                        <thead>
                          <tr className="border-b border-[#E6ECF2] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                            <th className="px-3 py-3">Account</th>
                            <th className="px-3 py-3">Cluster</th>
                            <th className="px-3 py-3 text-center">Count</th>

                            {metric.denominatorKey && (
                              <th className="px-3 py-3 text-center">
                                Scheduled
                              </th>
                            )}

                            <th className="px-3 py-3 text-center">
                              Percentage
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-[#E6ECF2]">
                          {filteredPlans.map((item) => {
                            const rowActualPercent = getItemPercent(
                              item,
                              metric
                            );
                            const rowDisplayPercent =
                              scaleToDisplayPercent(rowActualPercent);

                            return (
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

                                {metric.denominatorKey && (
                                  <td className="px-3 py-3 text-center text-sm font-semibold text-[#344054]">
                                    {formatNumber(item[metric.denominatorKey])}
                                  </td>
                                )}

                                <td className="px-3 py-3 text-center text-sm font-bold text-sibs-primary-1">
                                  {formatGraphPercent(rowDisplayPercent)}
                                </td>
                              </tr>
                            );
                          })}
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

function ActionItemModal({ open, item, form, setForm, onClose, onSubmit }) {
  useLockBodyScroll(open);

  if (!open || !item) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
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
  canEditRequiredHeadcount,
  previousWeekItem,
  requiredInputValue,
  savingRequiredId,
  savingFileId,
  weeklyPlanFile,
  existingUploadedFile,
  uploadedBySibsId,
  openingFile,
  onRequiredInputChange,
  onWeeklyPlanFileChange,
  onSaveRequiredHeadcount,
  onUpdateWeeklyPlanFile,
  onOpenUploadedFile,
  onClose,
  onOpenActionItem,
}) {
  useLockBodyScroll(open);

  if (!open || !item) return null;

  const previousLeadsNeeded = Number(previousWeekItem?.leadsToInterview || 0);
  const currentLeadsNeeded = Number(item.leadsToInterview || 0);
  const remaining = Math.max(currentLeadsNeeded - previousLeadsNeeded, 0);

  const requiredHeadcountDisabled =
    !canEditRequiredHeadcount || savingRequiredId === item.id;

  const selectedUploadName = weeklyPlanFile?.name || "";
  const existingUploadName = existingUploadedFile || item.uploadedFile || "";
  const hasExistingUpload = !!existingUploadName;

  const submittingViewModal =
    savingRequiredId === item.id || savingFileId === item.id;

  const submitDisabled = !canEditRequiredHeadcount || submittingViewModal;

  async function handleSubmitViewModal() {
    if (submitDisabled) return;

    if (weeklyPlanFile) {
      await onUpdateWeeklyPlanFile(item);
      return;
    }

    await onSaveRequiredHeadcount(item);
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
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
                <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                    Required Headcount
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={requiredInputValue ?? ""}
                      disabled={requiredHeadcountDisabled}
                      onChange={(e) =>
                        onRequiredInputChange(item.id, e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();

                          if (!requiredHeadcountDisabled) {
                            onSaveRequiredHeadcount(item);
                          }
                        }
                      }}
                      className="h-10 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm font-bold text-[#1E293B] outline-none transition disabled:cursor-not-allowed disabled:bg-gray-50 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                    />
                  </div>

                  {!canEditRequiredHeadcount && (
                    <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
                      View only. TA and HR cannot edit required headcount.
                    </p>
                  )}

                  {locked && !canEditRequiredHeadcount && (
                    <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
                      This historical weekly version is locked.
                    </p>
                  )}

                  {locked && canEditRequiredHeadcount && (
                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                      Historical week. Required Headcount is editable for authorized managers.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-[#E6ECF2] bg-white p-4 md:col-span-2">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                        Upload File
                      </p>
                      <p className="text-xs font-semibold leading-5 text-sibs-tertiary-5">
                        Upload weekly hiring plan support file. Accepted file types: PDF, Word, Excel, CSV, and images.
                      </p>
                    </div>

                    {hasExistingUpload && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenUploadedFile({
                            sibsId: uploadedBySibsId,
                            filename: existingUploadName,
                          })
                        }
                        disabled={openingFile}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <ExternalLink size={15} />
                        {openingFile ? "Opening..." : "View File"}
                      </button>
                    )}
                  </div>

                  <label
                    className={`mt-3 flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                      canEditRequiredHeadcount
                        ? "cursor-pointer border-[#D7DEE8] bg-white hover:border-sibs-primary-1 hover:bg-[#F8FAFC]"
                        : "cursor-not-allowed border-[#E6ECF2] bg-gray-50"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {selectedUploadName || existingUploadName ? (
                        <FileTypeIcon filename={selectedUploadName || existingUploadName} />
                      ) : (
                        <Paperclip size={18} className="shrink-0 text-sibs-tertiary-5" />
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#344054]">
                          {selectedUploadName || existingUploadName || "Choose weekly hiring plan file"}
                        </p>
                        {selectedUploadName && (
                          <p className="mt-1 text-xs font-semibold text-emerald-700">
                            New file selected. Click Update File to upload.
                          </p>
                        )}
                        {!selectedUploadName && existingUploadName && (
                          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                            Existing uploaded file
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="ml-4 inline-flex shrink-0 items-center gap-2 rounded-lg bg-sibs-tertiary-9 px-3 py-1.5 text-xs font-bold text-sibs-primary-1">
                      <Upload size={14} />
                      Browse
                    </span>

                    <input
                      type="file"
                      disabled={!canEditRequiredHeadcount}
                      onChange={(e) => onWeeklyPlanFileChange(item.id, e.target.files?.[0] || null)}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp,.heic,image/heic,image/heif"
                    />
                  </label>
                </div>

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
                  label="Missing Headcount"
                  value={
                    <div>
                      <div>{formatNumber(item.missingHeadcount)}</div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                        Required + Buffer Count - Actual Headcount
                      </div>
                    </div>
                  }
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
                  label="Projected Employee Needs"
                  value={item.projectedEmployeeNeeds}
                />
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

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#101828]">
                  Last Required Headcount Edit
                </h3>

                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      SIBS ID
                    </p>
                    <p className="mt-1 break-words text-sm font-bold text-sibs-primary-1">
                      {item.lastEditSibsId || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Name
                    </p>
                    <p className="mt-1 break-words text-sm font-bold text-[#344054]">
                      {item.lastEditName || "—"}
                    </p>
                  </div>

                  {!item.lastEditSibsId && !item.lastEditName && (
                    <p className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold text-sibs-tertiary-5">
                      No required headcount edit record yet.
                    </p>
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
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleSubmitViewModal}
              disabled={submitDisabled}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submittingViewModal ? (
                weeklyPlanFile ? (
                  "Uploading..."
                ) : (
                  "Saving..."
                )
              ) : (
                <>
                  <Upload size={16} />
                  Submit
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#D6DEE8] bg-white px-5 py-2.5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiSnapshotModal({ open, week, records, onClose }) {
  useLockBodyScroll(open);

  if (!open || !week) return null;

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
  const { user } = useUser();

  const mainScrollRef = useRef(null);
  const weekDropdownRef = useRef(null);
  const clusterDropdownRef = useRef(null);
  const accountDropdownRef = useRef(null);

  const canEditRequiredHeadcount = [5, 7].includes(Number(user?.adminAccess));

  const [weeklyVersions, setWeeklyVersions] = useState([]);
  const [activeWeekId, setActiveWeekId] = useState("");
  const [weeksLoading, setWeeksLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [weekSearch, setWeekSearch] = useState("");
  const [showWeekDropdown, setShowWeekDropdown] = useState(false);

  const [selectedClusters, setSelectedClusters] = useState(["All"]);
  const [showClusterDropdown, setShowClusterDropdown] = useState(false);

  const [selectedAccounts, setSelectedAccounts] = useState(["All"]);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");

  const [accountOptions, setAccountOptions] = useState([
    {
      id: "All",
      accountName: "All Accounts",
      ghlName: "",
    },
  ]);

  const [remoteAccounts, setRemoteAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [actionItemTarget, setActionItemTarget] = useState(null);
  const [actionItemForm, setActionItemForm] = useState(initialActionItemForm);
  const [showKpiSnapshot, setShowKpiSnapshot] = useState(false);

  const [requiredInputs, setRequiredInputs] = useState({});
  const [savingRequiredId, setSavingRequiredId] = useState("");
  const [requiredSaveMessage, setRequiredSaveMessage] = useState("");
  const [weeklyPlanFiles, setWeeklyPlanFiles] = useState({});
  const [savingFileId, setSavingFileId] = useState("");
  const [openingFile, setOpeningFile] = useState(false);
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const activeWeek =
    weeklyVersions.find((week) => week.id === activeWeekId) ||
    weeklyVersions[0];

  const isLocked = !!activeWeek?.locked;
  const activeWeekStartDate = activeWeek?.startDate || "";
  const activeWeekEndDate = activeWeek?.endDate || "";

  const filteredWeeklyVersions = useMemo(() => {
    const keyword = weekSearch.trim().toLowerCase();

    if (!keyword) return weeklyVersions;

    return weeklyVersions.filter((week) => {
      const searchableText = [
        week.label,
        week.weekRange,
        week.startDate,
        week.endDate,
        week.locked ? "Locked" : "Editable",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [weeklyVersions, weekSearch]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        weekDropdownRef.current &&
        !weekDropdownRef.current.contains(e.target)
      ) {
        setShowWeekDropdown(false);
      }

      if (
        clusterDropdownRef.current &&
        !clusterDropdownRef.current.contains(e.target)
      ) {
        setShowClusterDropdown(false);
      }

      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(e.target)
      ) {
        setShowAccountDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function fetchWeeklyVersions() {
      try {
        setWeeksLoading(true);

        const weeks = await getWeeklyHiringPlanWeeks();

        const formattedWeeks = (weeks || []).map((week) => ({
          ...week,
          records: [],
        }));

        if (!ignore) {
          setWeeklyVersions(formattedWeeks);
          setActiveWeekId(formattedWeeks[0]?.id || "");
        }
      } catch (error) {
        console.error("FETCH WEEKLY VERSIONS ERROR:", error);

        if (!ignore) {
          setWeeklyVersions([]);
          setActiveWeekId("");
        }
      } finally {
        if (!ignore) {
          setWeeksLoading(false);
        }
      }
    }

    fetchWeeklyVersions();

    return () => {
      ignore = true;
    };
  }, []);

  function isAllClustersSelected() {
    return selectedClusters.includes("All") || selectedClusters.length === 0;
  }

  function isAllAccountsSelected() {
    return selectedAccounts.includes("All") || selectedAccounts.length === 0;
  }

  function handleToggleCluster(cluster) {
    setSelectedClusters((prev) => {
      if (cluster === "All") {
        return ["All"];
      }

      const current = prev.includes("All") ? [] : prev;
      const alreadySelected = current.includes(cluster);

      const next = alreadySelected
        ? current.filter((item) => item !== cluster)
        : [...current, cluster];

      return next.length > 0 ? next : ["All"];
    });

    setSelectedAccounts(["All"]);
    setAccountSearch("");
  }

  function handleToggleAccount(accountName) {
    setSelectedAccounts((prev) => {
      if (accountName === "All") {
        return ["All"];
      }

      const current = prev.includes("All") ? [] : prev;
      const alreadySelected = current.includes(accountName);

      const next = alreadySelected
        ? current.filter((item) => item !== accountName)
        : [...current, accountName];

      return next.length > 0 ? next : ["All"];
    });
  }

  async function fetchAccountsByCluster({ resetAccountFilter = true } = {}) {
    try {
      setAccountsLoading(true);

      let accounts = [];

      if (isAllClustersSelected()) {
        accounts = await getWeeklyHiringPlanAccounts(
          "All",
          activeWeekStartDate,
          activeWeekEndDate
        );
      } else {
        const results = await Promise.all(
          selectedClusters.map((cluster) =>
            getWeeklyHiringPlanAccounts(
              cluster,
              activeWeekStartDate,
              activeWeekEndDate
            )
          )
        );

        const mergedAccounts = results.flat();
        const uniqueMap = new Map();

        mergedAccounts.forEach((account) => {
          const accountId = Number(account?.id || 0);
          const accountName = String(account?.accountName || "").trim();
          const clusterName = String(
            account?.clusterName ||
              account?.cluster ||
              account?.ghlName ||
              account?.gy_acc_ghl_name ||
              ""
          ).trim();

          if (!accountId || !accountName) return;

          const key = `${accountId}-${accountName.toLowerCase()}-${clusterName.toLowerCase()}`;

          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, account);
          }
        });

        accounts = Array.from(uniqueMap.values());
      }

      const uniqueAccountOptionsMap = new Map();

      (accounts || []).forEach((account) => {
        const accountId = Number(account?.id || 0);
        const accountName = String(account?.accountName || "").trim();

        if (!accountId || !accountName) return;

        const key = accountName.toLowerCase();

        if (!uniqueAccountOptionsMap.has(key)) {
          uniqueAccountOptionsMap.set(key, account);
        }
      });

      setRemoteAccounts(accounts || []);

      setAccountOptions([
        {
          id: "All",
          accountName: "All Accounts",
          ghlName: "",
        },
        ...Array.from(uniqueAccountOptionsMap.values()),
      ]);

      if (resetAccountFilter) {
        setSelectedAccounts(["All"]);
      }

      return accounts || [];
    } catch (error) {
      console.error("FETCH ACCOUNTS BY CLUSTER ERROR:", error);

      setRemoteAccounts([]);
      setAccountOptions([
        {
          id: "All",
          accountName: "All Accounts",
          ghlName: "",
        },
      ]);

      if (resetAccountFilter) {
        setSelectedAccounts(["All"]);
      }

      return [];
    } finally {
      setAccountsLoading(false);
    }
  }

  useEffect(() => {
    if (activeWeekStartDate && activeWeekEndDate) {
      fetchAccountsByCluster();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClusters, activeWeekStartDate, activeWeekEndDate]);

  const displayData = useMemo(() => {
    return (remoteAccounts || []).map((account, index) => {
      const accountName = account.accountName || "Unassigned Account";

      const accountCluster =
        account.clusterName ||
        account.cluster ||
        account.ghlName ||
        account.gy_acc_ghl_name ||
        (isAllClustersSelected()
          ? "Unassigned"
          : selectedClusters.length === 1
            ? selectedClusters[0]
            : "Unassigned");

      const requiredHeadcount = getBackendNumber(account, [
        "requiredHeadcount",
        "required_headcount",
      ]);

      const actualHeadcount = getBackendNumber(account, [
        "actualHeadcount",
        "actual_headcount",
      ]);

      /*
        Backend-owned values:
        Buffer Count, Buffer %, Missing Headcount, OPS PRF,
        Projected Employee Needs, Leads to Interview, and Hiring Rate
        are calculated by weeklyHiringPlan.js.
        Frontend only displays the backend response.
      */
      const bufferHeadcount = getBackendNumber(account, [
        "bufferHeadcount",
        "buffer_headcount",
        "buffer_head_count",
      ]);

      const bufferPercent = getBackendNumber(account, [
        "bufferPercent",
        "buffer_percent",
      ]);

      const missingHeadcount = getBackendNumber(account, [
        "missingHeadcount",
        "missing_headcount",
        "missing_head_count",
      ]);

      const calculated = {
        opsPrf: getBackendNumber(account, ["opsPrf", "ops_prf"]),
        leadsToInterview: getBackendNumber(account, [
          "leadsToInterview",
          "leads_to_interview",
        ]),
        hiringRate: getBackendNumber(account, ["hiringRate", "hiring_rate"], 5),

        absenteeismCount:
          account.absenteeismOpsCount !== undefined &&
          account.absenteeismOpsCount !== null
            ? Number(account.absenteeismOpsCount || 0)
            : Number(account.absenteeismCount || 0),

        attritionPastCount: Number(account.attritionPastCount || 0),
      };

      const projectedEmployeeNeeds = getBackendNumber(
        account,
        [
          "projectedEmployeeNeeds",
          "projected_employee_needs",
          "projectedNeeds",
          "projected_needs",
        ],
        calculated.opsPrf
      );

      const row = {
        id: `db-${accountCluster}-${account.id || index}`,
        backendAccountId: account.id,
        week: activeWeek?.label || "Current Week",
        cluster: accountCluster,
        account: accountName,

        requiredHeadcount,
        actualHeadcount,

        bufferHeadcount,
        bufferPercent,
        missingHeadcount,
        missingHeadcount: requiredHeadcount + bufferHeadcount - actualHeadcount,

        scheduledCount: Number(account.scheduledCount || 0),
        presentCount: Number(account.presentCount || 0),

        absenteeismCount: calculated.absenteeismCount,
        absenteeismPercent: Number(account.absenteeismPercent || 0),

        attritionPastCount: calculated.attritionPastCount,
        attritionPastPercent: Number(account.attritionPastPercent || 0),

        opsPrf: calculated.opsPrf,
        projectedEmployeeNeeds,

        attritionFstToPstCount: Number(account.attritionFstToPstCount || 0),
        attritionFstToPstPercent: Number(account.attritionFstToPstPercent || 0),

        attritionNhoToFstPstCount: Number(
          account.attritionNhoToFstPstCount || 0
        ),
        attritionNhoToFstPstPercent: Number(
          account.attritionNhoToFstPstPercent || 0
        ),

        attritionInterviewToNhoCount: Number(
          account.attritionInterviewToNhoCount || 0
        ),
        attritionInterviewToNhoPercent: Number(
          account.attritionInterviewToNhoPercent || 0
        ),

        leadsToInterview: calculated.leadsToInterview,
        hiringRate: calculated.hiringRate,

        pipelineStatus: account.pipelineStatus || "Pending",
        statusNote: account.headcountRemarks || account.departmentName || "-",
        owner: account.owner || "-",
        actionItems: account.actionItems || [],
        departmentName: account.departmentName || "",
        priorityLevel: account.priorityLevel || "",
        headcountRemarks: account.headcountRemarks || "",
        uploadedFile: account.uploadedFile || account.uploaded_file || "",
        uploadedBySibsId:
          account.uploadedBySibsId || account.uploaded_by_sibs_id || "",
        lastEditSibsId:
          account.lastEditSibsId || account.last_edit_sibs_id || "",
        lastEditName:
          account.lastEditName || account.last_edit_name || "",
      };

      return {
        ...row,
        pipelineStatus: account.pipelineStatus || calculatePipelineStatus(row),
      };
    });
  }, [activeWeek?.label, selectedClusters, remoteAccounts]);

  useEffect(() => {
    const nextInputs = {};

    displayData.forEach((item) => {
      nextInputs[item.id] = String(item.requiredHeadcount ?? 0);
    });

    setRequiredInputs(nextInputs);
  }, [displayData]);

  const filteredPlans = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return displayData.filter((item) => {
      const cluster = item.cluster || "Unassigned Cluster";
      const account = item.account || "Unassigned Account";

      const matchesCluster =
        isAllClustersSelected() || selectedClusters.includes(cluster);

      const matchesAccount =
        isAllAccountsSelected() || selectedAccounts.includes(account);

      const matchesKeyword =
        !keyword ||
        String(item.week || activeWeek?.label || "")
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
  }, [
    displayData,
    activeWeek?.label,
    search,
    selectedClusters,
    selectedAccounts,
  ]);

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

  function openStatusModal({
    type = "success",
    title = "",
    message = "",
    closeViewModalOnSuccess = false,
  }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });

    if (type === "success" && closeViewModalOnSuccess) {
      setSelectedPlan(null);
    }
  }

  function closeStatusModal() {
    setStatusModal((current) => ({
      ...current,
      open: false,
    }));
  }

  async function handleSaveRequiredHeadcount(item) {
    if (!canEditRequiredHeadcount) {
      const message = "You do not have permission to edit required headcount.";
      setRequiredSaveMessage(message);
      openStatusModal({
        type: "error",
        title: "Permission Denied",
        message,
      });
      return;
    }


    if (!activeWeekStartDate || !activeWeekEndDate) {
      const message = "Missing weekly date range. Please select a valid weekly version.";
      setRequiredSaveMessage(message);
      openStatusModal({
        type: "error",
        title: "Unable to Save",
        message,
      });
      return;
    }

    const rawValue = requiredInputs[item.id];

    const requiredHeadcount =
      rawValue === "" || rawValue === null || rawValue === undefined
        ? null
        : Number(rawValue);

    if (requiredHeadcount !== null && !Number.isFinite(requiredHeadcount)) {
      const message = "Invalid required headcount.";
      setRequiredSaveMessage(message);
      openStatusModal({
        type: "error",
        title: "Invalid Input",
        message,
      });
      return;
    }

    try {
      setSavingRequiredId(item.id);
      setRequiredSaveMessage("");

      await saveRequiredHeadcount({
        weekNumber: activeWeek?.weekNumber || null,
        weekLabel: activeWeek?.label || null,
        weekStart: activeWeekStartDate,
        weekEnd: activeWeekEndDate,
        clusterName: item.cluster,
        accountName: item.account,
        requiredHeadcount,
        actualHeadcount: Number(item.actualHeadcount || 0),
        priorityLevel: item.priorityLevel || null,
        remarks: item.headcountRemarks || null,
      });

      const refreshedAccounts = await fetchAccountsByCluster({
        resetAccountFilter: false,
      });

      const refreshedAccount = (refreshedAccounts || []).find((account) => {
        const accountName = account.accountName || "Unassigned Account";
        const accountCluster =
          account.clusterName ||
          account.cluster ||
          account.ghlName ||
          account.gy_acc_ghl_name ||
          (isAllClustersSelected()
            ? "Unassigned"
            : selectedClusters.length === 1
              ? selectedClusters[0]
              : "Unassigned");

        return (
          String(accountName).toLowerCase() ===
            String(item.account).toLowerCase() &&
          String(accountCluster).toLowerCase() ===
            String(item.cluster).toLowerCase()
        );
      });

      if (refreshedAccount) {
        setSelectedPlan((current) => {
          if (!current) return current;

          const sameSelectedPlan =
            String(current.account).toLowerCase() ===
              String(item.account).toLowerCase() &&
            String(current.cluster).toLowerCase() ===
              String(item.cluster).toLowerCase();

          if (!sameSelectedPlan) return current;

          return {
            ...current,
            requiredHeadcount: getBackendNumber(refreshedAccount, [
              "requiredHeadcount",
              "required_headcount",
            ]),
            actualHeadcount: getBackendNumber(refreshedAccount, [
              "actualHeadcount",
              "actual_headcount",
            ]),
            bufferHeadcount: getBackendNumber(refreshedAccount, [
              "bufferHeadcount",
              "buffer_headcount",
              "buffer_head_count",
            ]),
            bufferPercent: getBackendNumber(refreshedAccount, [
              "bufferPercent",
              "buffer_percent",
            ]),
            missingHeadcount: getBackendNumber(refreshedAccount, [
              "missingHeadcount",
              "missing_headcount",
              "missing_head_count",
            ]),
            absenteeismCount:
              refreshedAccount.absenteeismOpsCount !== undefined &&
              refreshedAccount.absenteeismOpsCount !== null
                ? Number(refreshedAccount.absenteeismOpsCount || 0)
                : Number(refreshedAccount.absenteeismCount || 0),
            attritionPastCount: Number(refreshedAccount.attritionPastCount || 0),
            opsPrf: getBackendNumber(refreshedAccount, ["opsPrf", "ops_prf"]),
            projectedEmployeeNeeds: getBackendNumber(
              refreshedAccount,
              [
                "projectedEmployeeNeeds",
                "projected_employee_needs",
                "projectedNeeds",
                "projected_needs",
              ],
              getBackendNumber(refreshedAccount, ["opsPrf", "ops_prf"])
            ),
            leadsToInterview: getBackendNumber(refreshedAccount, [
              "leadsToInterview",
              "leads_to_interview",
            ]),
            hiringRate: getBackendNumber(
              refreshedAccount,
              ["hiringRate", "hiring_rate"],
              5
            ),
            pipelineStatus:
              refreshedAccount.pipelineStatus || current.pipelineStatus,
            priorityLevel: refreshedAccount.priorityLevel || null,
            headcountRemarks: refreshedAccount.headcountRemarks || null,
            uploadedFile:
              refreshedAccount.uploadedFile || refreshedAccount.uploaded_file || current.uploadedFile || "",
            uploadedBySibsId:
              refreshedAccount.uploadedBySibsId ||
              refreshedAccount.uploaded_by_sibs_id ||
              current.uploadedBySibsId ||
              "",
            lastEditSibsId:
              refreshedAccount.lastEditSibsId ||
              refreshedAccount.last_edit_sibs_id ||
              current.lastEditSibsId ||
              "",
            lastEditName:
              refreshedAccount.lastEditName ||
              refreshedAccount.last_edit_name ||
              current.lastEditName ||
              "",
            statusNote:
              refreshedAccount.headcountRemarks ||
              refreshedAccount.departmentName ||
              current.statusNote ||
              "-",
          };
        });
      }

      setWeeklyPlanFiles((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });

      const message = `Required headcount for ${item.account} was saved successfully.`;
      openStatusModal({
        type: "success",
        title: "Required Headcount Saved",
        message,
        closeViewModalOnSuccess: true,
      });
    } catch (error) {
      console.error("SAVE REQUIRED HEADCOUNT ERROR:", error);

      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to save required headcount.";

      setRequiredSaveMessage(message);
      openStatusModal({
        type: "error",
        title: "Save Failed",
        message,
      });
    } finally {
      setSavingRequiredId("");
    }
  }

  function handleRequiredInputChange(itemId, value) {
    setRequiredInputs((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  }

  function handleWeeklyPlanFileChange(itemId, file) {
    setWeeklyPlanFiles((prev) => ({
      ...prev,
      [itemId]: file,
    }));
  }

  async function handleUpdateWeeklyPlanFile(item) {
    if (!canEditRequiredHeadcount) {
      openStatusModal({
        type: "error",
        title: "Permission Denied",
        message: "You do not have permission to update the weekly hiring plan file.",
      });
      return;
    }

    if (!activeWeekStartDate || !activeWeekEndDate) {
      openStatusModal({
        type: "error",
        title: "Unable to Upload",
        message: "Missing weekly date range. Please select a valid weekly version.",
      });
      return;
    }

    const selectedFile = weeklyPlanFiles[item.id];

    if (!selectedFile) {
      openStatusModal({
        type: "error",
        title: "No File Selected",
        message: "Please choose a file before clicking Update File.",
      });
      return;
    }

    const rawValue = requiredInputs[item.id];
    const requiredHeadcount =
      rawValue === "" || rawValue === null || rawValue === undefined
        ? null
        : Number(rawValue);

    if (requiredHeadcount !== null && !Number.isFinite(requiredHeadcount)) {
      openStatusModal({
        type: "error",
        title: "Invalid Input",
        message: "Invalid required headcount.",
      });
      return;
    }

    try {
      setSavingFileId(item.id);

      await updateWeeklyHiringPlanFile({
        weekNumber: activeWeek?.weekNumber || null,
        weekLabel: activeWeek?.label || null,
        weekStart: activeWeekStartDate,
        weekEnd: activeWeekEndDate,
        clusterName: item.cluster,
        accountName: item.account,
        requiredHeadcount,
        actualHeadcount: Number(item.actualHeadcount || 0),
        priorityLevel: item.priorityLevel || null,
        remarks: item.headcountRemarks || null,
        uploadedFile: selectedFile,
      });

      const refreshedAccounts = await fetchAccountsByCluster({
        resetAccountFilter: false,
      });

      const refreshedAccount = (refreshedAccounts || []).find((account) => {
        const accountName = account.accountName || "Unassigned Account";
        const accountCluster =
          account.clusterName ||
          account.cluster ||
          account.ghlName ||
          account.gy_acc_ghl_name ||
          (isAllClustersSelected()
            ? "Unassigned"
            : selectedClusters.length === 1
              ? selectedClusters[0]
              : "Unassigned");

        return (
          String(accountName).toLowerCase() === String(item.account).toLowerCase() &&
          String(accountCluster).toLowerCase() === String(item.cluster).toLowerCase()
        );
      });

      if (refreshedAccount) {
        setSelectedPlan((current) => {
          if (!current) return current;

          const sameSelectedPlan =
            String(current.account).toLowerCase() === String(item.account).toLowerCase() &&
            String(current.cluster).toLowerCase() === String(item.cluster).toLowerCase();

          if (!sameSelectedPlan) return current;

          return {
            ...current,
            uploadedFile:
              refreshedAccount.uploadedFile || refreshedAccount.uploaded_file || "",
            uploadedBySibsId:
              refreshedAccount.uploadedBySibsId ||
              refreshedAccount.uploaded_by_sibs_id ||
              current.uploadedBySibsId ||
              "",
            lastEditSibsId:
              refreshedAccount.lastEditSibsId ||
              refreshedAccount.last_edit_sibs_id ||
              current.lastEditSibsId ||
              "",
            lastEditName:
              refreshedAccount.lastEditName ||
              refreshedAccount.last_edit_name ||
              current.lastEditName ||
              "",
          };
        });
      }

      setWeeklyPlanFiles((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });

      openStatusModal({
        type: "success",
        title: "File Updated",
        message: `Weekly hiring plan file for ${item.account} was updated successfully.`,
        closeViewModalOnSuccess: true,
      });
    } catch (error) {
      console.error("UPDATE WEEKLY HIRING PLAN FILE ERROR:", error);

      openStatusModal({
        type: "error",
        title: "Upload Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to update weekly hiring plan file.",
      });
    } finally {
      setSavingFileId("");
    }
  }

  async function handleOpenUploadedFile({ sibsId, filename }) {
    try {
      setOpeningFile(true);
      await openWeeklyHiringPlanFile({ sibsId, filename });
    } catch (error) {
      console.error("OPEN WEEKLY HIRING PLAN FILE ERROR:", error);
      openStatusModal({
        type: "error",
        title: "Unable to Open File",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to open uploaded weekly hiring plan file.",
      });
    } finally {
      setOpeningFile(false);
    }
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

    setSelectedPlan(updatedItem);
    handleCloseActionItemModal();
  }

  const filteredAccountOptions = useMemo(() => {
    const keyword = accountSearch.trim().toLowerCase();

    return (accountOptions || [])
      .filter((account) => account.id !== "All")
      .filter((account) => {
        if (!keyword) return true;

        const searchableText = [
          account.accountName,
          account.gy_acc_name,
          account.ghlName,
          account.gy_acc_ghl_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(keyword);
      });
  }, [accountOptions, accountSearch]);

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
          </div>

          <div className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.1fr_1fr_1fr_1fr] xl:items-end">
              <div ref={weekDropdownRef} className="relative z-40">
                <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
                  Weekly Version
                </label>

                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                  />

                  <input
                    type="text"
                    value={
                      showWeekDropdown
                        ? weekSearch
                        : activeWeek
                          ? `${activeWeek.label} | ${activeWeek.weekRange}`
                          : ""
                    }
                    onChange={(e) => {
                      setWeekSearch(e.target.value);
                      setShowWeekDropdown(true);
                    }}
                    onFocus={() => {
                      setShowWeekDropdown(true);
                      setWeekSearch("");
                    }}
                    placeholder={
                      weeksLoading
                        ? "Loading weekly versions..."
                        : "Search weekly version..."
                    }
                    autoComplete="off"
                    className="h-12 w-full rounded-xl border border-[#D7DEE8] bg-white px-4 pl-10 pr-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-gray-400 focus:border-[var(--sibs-primary-1)]"
                  />

                  <ChevronDown
                    size={18}
                    onClick={() => {
                      setShowWeekDropdown((prev) => !prev);
                      setWeekSearch("");
                    }}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-sibs-tertiary-5 transition-transform ${
                      showWeekDropdown ? "rotate-180" : ""
                    }`}
                  />

                  {showWeekDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-2 max-h-60 overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl">
                      <div className="max-h-60 overflow-y-auto py-2 sibs-scrollbar">
                        {filteredWeeklyVersions.length > 0 ? (
                          filteredWeeklyVersions.map((week) => {
                            const isSelected = week.id === activeWeekId;

                            return (
                              <button
                                key={week.id}
                                type="button"
                                onClick={() => {
                                  setActiveWeekId(week.id);
                                  setSelectedClusters(["All"]);
                                  setSelectedAccounts(["All"]);
                                  setSearch("");
                                  setWeekSearch("");
                                  setShowWeekDropdown(false);
                                }}
                                className={`block w-full px-4 py-3 text-left text-sm transition ${
                                  isSelected
                                    ? "bg-[#EAF2FB] font-medium text-sibs-primary-1"
                                    : "text-sibs-primary-1 hover:bg-[#F8FAFC]"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate font-semibold">
                                      {week.weekRange} ({week.label})
                                    </p>

                                    <p className="mt-1 text-xs text-sibs-tertiary-5">
                                      {week.label} | {week.weekRange}
                                    </p>
                                  </div>

                                  <span
                                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                                      week.locked
                                        ? "border-gray-200 bg-gray-50 text-gray-600"
                                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    }`}
                                  >
                                    {week.locked ? "Locked" : "Editable"}
                                  </span>
                                </div>
                              </button>
                            );
                          })
                        ) : weekSearch.trim() ? (
                          <div className="px-4 py-3 text-sm text-sibs-tertiary-5">
                            No weekly version found
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-sm text-sibs-tertiary-5">
                            No weekly versions available
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div ref={clusterDropdownRef} className="relative z-30">
                <label className="mb-1 block text-sm font-bold text-[#101828]">
                  Cluster
                </label>

                <button
                  type="button"
                  onClick={() => setShowClusterDropdown((prev) => !prev)}
                  className="flex h-12 w-full items-center justify-between rounded-xl border border-[#D0D5DD] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                >
                  <span className="truncate">
                    {getClusterFilterLabel(selectedClusters)}
                  </span>

                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-sibs-tertiary-5 transition-transform ${
                      showClusterDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showClusterDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl">
                    <div className="max-h-64 overflow-y-auto py-2 sibs-scrollbar">
                      <button
                        type="button"
                        onClick={() => handleToggleCluster("All")}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                          isAllClustersSelected()
                            ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                            : "text-[#344054] hover:bg-[#F8FAFC]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isAllClustersSelected()}
                          readOnly
                          className="h-4 w-4 rounded border-[#D0D5DD] accent-sibs-primary-1"
                        />
                        <span>All Clusters</span>
                      </button>

                      {CLUSTER_OPTIONS.map((cluster) => {
                        const checked =
                          !isAllClustersSelected() &&
                          selectedClusters.includes(cluster);

                        return (
                          <button
                            key={cluster}
                            type="button"
                            onClick={() => handleToggleCluster(cluster)}
                            className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                              checked
                                ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                                : "text-[#344054] hover:bg-[#F8FAFC]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              readOnly
                              className="h-4 w-4 rounded border-[#D0D5DD] accent-sibs-primary-1"
                            />
                            <span className="truncate">{cluster}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div ref={accountDropdownRef} className="relative z-20">
                <label className="mb-1 block text-sm font-bold text-[#101828]">
                  Account
                </label>

                <div className="relative">
                  <input
                    type="text"
                    value={
                      showAccountDropdown
                        ? accountSearch
                        : accountsLoading
                          ? "Loading accounts..."
                          : getAccountFilterLabel(selectedAccounts)
                    }
                    onChange={(e) => {
                      setAccountSearch(e.target.value);
                      setShowAccountDropdown(true);
                    }}
                    onFocus={() => {
                      if (!accountsLoading) {
                        setShowAccountDropdown(true);
                        setAccountSearch("");
                      }
                    }}
                    disabled={accountsLoading}
                    placeholder="Search accounts..."
                    autoComplete="off"
                    className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pr-11 text-sm font-bold text-[#344054] outline-none transition disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-sibs-tertiary-5 focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                  />

                  <ChevronDown
                    size={18}
                    onClick={() => {
                      if (!accountsLoading) {
                        setShowAccountDropdown((prev) => !prev);
                        setAccountSearch("");
                      }
                    }}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-sibs-tertiary-5 transition-transform ${
                      showAccountDropdown ? "rotate-180" : ""
                    }`}
                  />

                  {showAccountDropdown && !accountsLoading && (
                    <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl">
                      <div className="max-h-64 overflow-y-auto py-2 sibs-scrollbar">
                        <button
                          type="button"
                          onClick={() => {
                            handleToggleAccount("All");
                            setAccountSearch("");
                          }}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                            isAllAccountsSelected()
                              ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                              : "text-[#344054] hover:bg-[#F8FAFC]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isAllAccountsSelected()}
                            readOnly
                            className="h-4 w-4 rounded border-[#D0D5DD] accent-sibs-primary-1"
                          />

                          <span>All Accounts</span>
                        </button>

                        {filteredAccountOptions.length > 0 ? (
                          filteredAccountOptions.map((account, index) => {
                            const accountName = account.accountName;
                            const checked =
                              !isAllAccountsSelected() &&
                              selectedAccounts.includes(accountName);

                            return (
                              <button
                                key={`${account.id || accountName}-${index}`}
                                type="button"
                                onClick={() => {
                                  handleToggleAccount(accountName);
                                  setAccountSearch("");
                                }}
                                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                                  checked
                                    ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                                    : "text-[#344054] hover:bg-[#F8FAFC]"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  readOnly
                                  className="h-4 w-4 rounded border-[#D0D5DD] accent-sibs-primary-1"
                                />

                                <span className="truncate">{accountName}</span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-4 py-4 text-sm font-semibold text-sibs-tertiary-5">
                            No accounts found.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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

              {!canEditRequiredHeadcount && (
                <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  View only: Required Headcount
                </span>
              )}

              {(!isAllClustersSelected() || !isAllAccountsSelected() || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClusters(["All"]);
                    setSelectedAccounts(["All"]);
                    setAccountSearch("");
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
              value={formatNumber(totals.totalRequired)}
              icon={ClipboardList}
            />

            <MetricCard
              title="Actual Headcount"
              value={formatNumber(totals.actualHeadcount)}
              icon={UserRound}
              iconClassName="bg-indigo-50 text-sibs-primary-1"
            />

            <MetricCard
              title="OPS PRF"
              value={formatNumber(totals.opsPrf)}
              icon={CheckCircle2}
              iconClassName="bg-emerald-50 text-emerald-600"
              valueClassName="text-emerald-600"
            />

            <MetricCard
              title="Leads Needed"
              value={formatNumber(totals.leadsToInterview)}
              icon={PieChart}
              iconClassName="bg-violet-50 text-sibs-primary-1"
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
                <table className="w-full min-w-[1580px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
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
                      <th className="px-5 py-4 text-center">
                        Missing
                        <br />
                        Headcount
                        <div className="mt-1 text-[10px] font-bold normal-case tracking-normal text-sibs-tertiary-5">
                          Required + Buffer Count - Actual Headcount
                        </div>
                      </th>
                      <th className="px-5 py-4 text-center">OPS PRF</th>
                      <th className="px-5 py-4 text-center">
                        Projected
                        <br />
                        Employee Needs
                      </th>
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
                    {accountsLoading ? (
                      <tr>
                        <td
                          colSpan={13}
                          className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                        >
                          Loading weekly hiring plan records...
                        </td>
                      </tr>
                    ) : filteredPlans.length > 0 ? (
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

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#1E293B]">
                            {formatNumber(item.requiredHeadcount)}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-semibold text-[#1E293B]">
                            {formatNumber(item.actualHeadcount)}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-semibold text-[#1E293B]">
                            {formatNumber(item.bufferHeadcount)}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-semibold text-[#1E293B]">
                            {formatPercent(item.bufferPercent)}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-cyan-700">
                            {formatNumber(item.missingHeadcount)}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-sibs-primary-1">
                            {formatNumber(item.opsPrf)}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-violet-700">
                            {formatNumber(item.projectedEmployeeNeeds)}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-semibold text-[#1E293B]">
                            {formatNumber(item.leadsToInterview)}
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
                          colSpan={13}
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
              {accountsLoading ? (
                <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                  Loading weekly hiring plan records...
                </div>
              ) : filteredPlans.length > 0 ? (
                filteredPlans.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(item)}
                      className="w-full text-left"
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
                    </button>

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="rounded-xl bg-[#F8FAFC] p-3">
                        <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
                          Required
                        </p>
                        <p className="mt-1 text-sm font-bold text-sibs-primary-1">
                          {formatNumber(item.requiredHeadcount)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#F8FAFC] p-3">
                        <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
                          Actual
                        </p>
                        <p className="mt-1 text-sm font-bold text-sibs-primary-1">
                          {formatNumber(item.actualHeadcount)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#F8FAFC] p-3">
                        <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
                          Missing Headcount
                        </p>
                        <p className="mt-0.5 text-[9px] font-bold leading-tight text-sibs-tertiary-5">
                          Required + Buffer Count - Actual Headcount
                        </p>
                        <p className="mt-1 text-sm font-bold text-cyan-700">
                          {formatNumber(item.missingHeadcount)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#F8FAFC] p-3">
                        <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
                          OPS PRF
                        </p>
                        <p className="mt-1 text-sm font-bold text-sibs-primary-1">
                          {formatNumber(item.opsPrf)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#F8FAFC] p-3">
                        <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
                          Projected Needs
                        </p>
                        <p className="mt-1 text-sm font-bold text-violet-700">
                          {formatNumber(item.projectedEmployeeNeeds)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#F8FAFC] p-3">
                        <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
                          Leads
                        </p>
                        <p className="mt-1 text-sm font-bold text-emerald-600">
                          {formatNumber(item.leadsToInterview)}
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
                  </div>
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

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={closeStatusModal}
      />

      <ViewPlanModal
        open={!!selectedPlan}
        item={selectedPlan}
        locked={isLocked}
        canEditRequiredHeadcount={canEditRequiredHeadcount}
        previousWeekItem={previousSelectedPlan}
        requiredInputValue={selectedPlan ? requiredInputs[selectedPlan.id] : ""}
        savingRequiredId={savingRequiredId}
        savingFileId={savingFileId}
        weeklyPlanFile={selectedPlan ? weeklyPlanFiles[selectedPlan.id] : null}
        existingUploadedFile={selectedPlan?.uploadedFile || ""}
        uploadedBySibsId={selectedPlan?.uploadedBySibsId || user?.username || user?.sibsId || ""}
        openingFile={openingFile}
        onRequiredInputChange={handleRequiredInputChange}
        onWeeklyPlanFileChange={handleWeeklyPlanFileChange}
        onSaveRequiredHeadcount={handleSaveRequiredHeadcount}
        onUpdateWeeklyPlanFile={handleUpdateWeeklyPlanFile}
        onOpenUploadedFile={handleOpenUploadedFile}
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
        records={filteredPlans}
        onClose={() => setShowKpiSnapshot(false)}
      />
    </div>
  );
}