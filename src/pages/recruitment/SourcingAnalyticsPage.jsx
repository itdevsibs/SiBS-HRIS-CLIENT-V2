import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/layout/Header";
import {
  Activity,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  MousePointerClick,
  Plus,
  ReceiptText,
  Search,
  Target,
  TrendingUp,
  UserCheck,
  UsersRound,
  X,
} from "lucide-react";

const PUBLIC_SUBMISSIONS_KEY = "ta_public_candidate_submissions";
const SOURCE_COST_ENTRIES_KEY = "ta_sourcing_cost_entries";

const sourcingOptions = [
  "Employee Referral Program",
  "Print Ads (Billboards, Brochures, Flyers, Posters)",
  "Social Media Pages",
  "Social Media Ads",
  "Online Job Portals",
  "Walk In",
  "Word of Mouth",
  "Institutional Partnership",
  "External Referral Listings",
  "Job Fairs",
  "Employee Retention Program",
  "Others",
];

const samplePublicSubmissions = [
  {
    id: 1001,
    candidateId: "PUB-SAMPLE-001",
    name: "Juan Dela Cruz",
    email: "juan.delacruz@email.com",
    hearAboutUs: ["Social Media Ads"],
    openPosition: "CSR",
    applyingLocation: "Davao Site",
    status: "Hired",
    submittedAt: "2026-05-01",
    isPublicSubmission: true,
  },
  {
    id: 1002,
    candidateId: "PUB-SAMPLE-002",
    name: "Maria Santos",
    email: "maria.santos@email.com",
    hearAboutUs: ["Social Media Ads", "Online Job Portals"],
    openPosition: "CSR",
    applyingLocation: "Davao Site",
    status: "Hired",
    submittedAt: "2026-05-02",
    isPublicSubmission: true,
  },
  {
    id: 1003,
    candidateId: "PUB-SAMPLE-003",
    name: "Carlo Reyes",
    email: "carlo.reyes@email.com",
    hearAboutUs: ["Employee Referral Program"],
    openPosition: "RCM Analyst",
    applyingLocation: "Tagum Site",
    status: "Interviewed",
    submittedAt: "2026-05-03",
    isPublicSubmission: true,
  },
  {
    id: 1004,
    candidateId: "PUB-SAMPLE-004",
    name: "Angela Lim",
    email: "angela.lim@email.com",
    hearAboutUs: ["Walk In"],
    openPosition: "HR Assistant",
    applyingLocation: "Davao Site",
    status: "Initial Screening",
    submittedAt: "2026-05-04",
    isPublicSubmission: true,
  },
  {
    id: 1005,
    candidateId: "PUB-SAMPLE-005",
    name: "Mark Villanueva",
    email: "mark.villanueva@email.com",
    hearAboutUs: ["Job Fairs"],
    openPosition: "CSR",
    applyingLocation: "Mabini Site",
    status: "Hired",
    submittedAt: "2026-05-05",
    isPublicSubmission: true,
  },
  {
    id: 1006,
    candidateId: "PUB-SAMPLE-006",
    name: "Christine Gomez",
    email: "christine.gomez@email.com",
    hearAboutUs: ["Social Media Pages"],
    openPosition: "QA",
    applyingLocation: "Davao Site",
    status: "Offered",
    submittedAt: "2026-05-06",
    isPublicSubmission: true,
  },
  {
    id: 1007,
    candidateId: "PUB-SAMPLE-007",
    name: "Paolo Garcia",
    email: "paolo.garcia@email.com",
    hearAboutUs: ["Word of Mouth"],
    openPosition: "IT Support",
    applyingLocation: "Davao Site",
    status: "New Applicant",
    submittedAt: "2026-05-07",
    isPublicSubmission: true,
  },
  {
    id: 1008,
    candidateId: "PUB-SAMPLE-008",
    name: "Rica Mendoza",
    email: "rica.mendoza@email.com",
    hearAboutUs: ["Institutional Partnership"],
    openPosition: "CSR",
    applyingLocation: "Tagum Site",
    status: "Interview Scheduled",
    submittedAt: "2026-05-08",
    isPublicSubmission: true,
  },
  {
    id: 1009,
    candidateId: "PUB-SAMPLE-009",
    name: "Lester Ramos",
    email: "lester.ramos@email.com",
    hearAboutUs: ["Print Ads (Billboards, Brochures, Flyers, Posters)"],
    openPosition: "CSR",
    applyingLocation: "Davao Site",
    status: "Interviewed",
    submittedAt: "2026-05-09",
    isPublicSubmission: true,
  },
  {
    id: 1010,
    candidateId: "PUB-SAMPLE-010",
    name: "Jessa Navarro",
    email: "jessa.navarro@email.com",
    hearAboutUs: ["External Referral Listings"],
    openPosition: "RCM Analyst",
    applyingLocation: "Tagum Site",
    status: "Hired",
    submittedAt: "2026-05-10",
    isPublicSubmission: true,
  },
  {
    id: 1011,
    candidateId: "PUB-SAMPLE-011",
    name: "Nico Flores",
    email: "nico.flores@email.com",
    hearAboutUs: ["Employee Retention Program"],
    openPosition: "CSR",
    applyingLocation: "Davao Site",
    status: "Accepted",
    submittedAt: "2026-05-11",
    isPublicSubmission: true,
  },
  {
    id: 1012,
    candidateId: "PUB-SAMPLE-012",
    name: "Arlene Dizon",
    email: "arlene.dizon@email.com",
    hearAboutUs: ["Others"],
    openPosition: "Accounting",
    applyingLocation: "Davao Site",
    status: "Screened",
    submittedAt: "2026-05-12",
    isPublicSubmission: true,
  },
];

const sampleSourceCostEntries = [
  {
    id: 2001,
    source: "Social Media Ads",
    description: "Facebook Ads - CSR Hiring Campaign May 2026",
    amount: 10000,
    dateSpent: "2026-05-01",
    createdAt: "2026-05-01",
  },
  {
    id: 2002,
    source: "Online Job Portals",
    description: "Job portal posting package for CSR hiring",
    amount: 7500,
    dateSpent: "2026-05-02",
    createdAt: "2026-05-02",
  },
  {
    id: 2003,
    source: "Job Fairs",
    description: "Booth setup and materials for local job fair",
    amount: 5000,
    dateSpent: "2026-05-05",
    createdAt: "2026-05-05",
  },
  {
    id: 2004,
    source: "Print Ads (Billboards, Brochures, Flyers, Posters)",
    description: "Flyers and poster printing for recruitment campaign",
    amount: 3500,
    dateSpent: "2026-05-06",
    createdAt: "2026-05-06",
  },
  {
    id: 2005,
    source: "External Referral Listings",
    description: "External referral listing boost",
    amount: 4000,
    dateSpent: "2026-05-08",
    createdAt: "2026-05-08",
  },
];

const initialCostForm = {
  source: "",
  description: "",
  amount: "",
  dateSpent: "",
};

function readLocalStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalStorage(key, value) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // frontend-only fallback
  }
}

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
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

function formatCurrency(value) {
  const amount = Number(value || 0);

  return amount.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function calculateConversionRate(hired, volume) {
  const safeHired = Number(hired || 0);
  const safeVolume = Number(volume || 0);

  if (safeVolume <= 0) return 0;

  return Number(((safeHired / safeVolume) * 100).toFixed(1));
}

function calculateCostPerHire(sourceCost, hired) {
  const safeCost = Number(sourceCost || 0);
  const safeHired = Number(hired || 0);

  if (safeCost <= 0 || safeHired <= 0) return 0;

  return Number((safeCost / safeHired).toFixed(2));
}

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function isScreenedCandidate(candidate) {
  const status = normalizeStatus(candidate.status);

  return [
    "screened",
    "initial screening",
    "for interview",
    "interview scheduled",
    "interviewed",
    "online assessment",
    "assessment taken",
    "offered",
    "accepted",
    "hired",
  ].includes(status);
}

function isInterviewedCandidate(candidate) {
  const status = normalizeStatus(candidate.status);

  return [
    "interviewed",
    "online assessment",
    "assessment taken",
    "offered",
    "accepted",
    "hired",
  ].includes(status);
}

function isOfferedCandidate(candidate) {
  const status = normalizeStatus(candidate.status);

  return ["offered", "accepted", "hired"].includes(status);
}

function isHiredCandidate(candidate) {
  const status = normalizeStatus(candidate.status);

  return ["hired", "accepted"].includes(status);
}

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

function TextInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${className}`}
    />
  );
}

function TextArea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={`min-h-[110px] w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${className}`}
    />
  );
}

function SelectInput({ children, className = "", ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`h-12 w-full appearance-none rounded-xl border border-[#D0D5DD] bg-white px-4 pr-11 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${className}`}
      >
        {children}
      </select>

      <ChevronDown
        size={18}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
      />
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  valueClassName = "text-sibs-primary-1",
  description,
}) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
            {title}
          </p>

          <p
            className={`mt-3 truncate text-3xl font-extrabold ${valueClassName}`}
          >
            {value}
          </p>

          {description && (
            <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
          {icon}
        </div>
      </div>
    </div>
  );
}

function VolumeBar({ label, value, max }) {
  const percentage = max > 0 ? Math.round((Number(value || 0) / max) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="truncate text-sm font-bold text-[#344054]">{label}</p>

        <p className="shrink-0 text-sm font-bold text-sibs-primary-1">
          {value}
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div
          className="h-full rounded-full bg-sibs-primary-1"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ConversionBar({ label, value, max }) {
  const percentage = max > 0 ? Math.round((Number(value || 0) / max) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="truncate text-sm font-bold text-[#344054]">{label}</p>

        <p className="shrink-0 text-sm font-bold text-sibs-primary-1">
          {Number(value || 0).toFixed(1)}%
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div
          className="h-full rounded-full bg-sibs-primary-1"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function CostBar({ label, value, max }) {
  const percentage = max > 0 ? Math.round((Number(value || 0) / max) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="truncate text-sm font-bold text-[#344054]">{label}</p>

        <p className="shrink-0 text-sm font-bold text-sibs-primary-1">
          {formatCurrency(value)}
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div
          className="h-full rounded-full bg-sibs-primary-1"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function FunnelRow({ label, value, max }) {
  const percentage = max > 0 ? Math.round((Number(value || 0) / max) * 100) : 0;

  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-[#344054]">{label}</p>

        <p className="text-sm font-bold text-sibs-primary-1">{value}</p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-sibs-primary-1"
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

      <div className="max-w-[60%] text-right text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}

function SourceMobileCard({ source, onView }) {
  return (
    <button
      type="button"
      onClick={onView}
      className="w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-[var(--sibs-primary-1)]/40 hover:bg-[#FAFBFC]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#101828]">{source.source}</h3>

          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
            Total Cost: {formatCurrency(source.sourceCost)}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-sibs-primary-1">
          {source.costEntries.length} cost entries
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Applicants
          </p>

          <p className="mt-1 text-sm font-bold text-sibs-primary-1">
            {source.volume}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Hired
          </p>

          <p className="mt-1 text-sm font-bold text-emerald-600">
            {source.hired}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            CPH
          </p>

          <p className="mt-1 text-sm font-bold text-sibs-primary-1">
            {formatCurrency(source.costPerHire)}
          </p>
        </div>
      </div>

      <div className="mt-4 text-xs font-semibold text-sibs-tertiary-5">
        Latest Applicant:{" "}
        <span className="font-bold text-[#344054]">
          {source.latestCandidate || "—"}
        </span>
      </div>
    </button>
  );
}

function AddSourceCostModal({
  open,
  form,
  setForm,
  onClose,
  onSubmit,
  onReset,
}) {
  if (!open) return null;

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/45 px-4 py-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="border-b border-[#E6ECF2] bg-gradient-to-r from-[#F8FAFC] via-white to-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <ReceiptText size={14} />
                New Source Cost
              </div>

              <h2 className="mt-3 text-2xl font-extrabold text-sibs-primary-1">
                ADD SOURCE COST
              </h2>

              <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-sibs-tertiary-5">
                Add a cost entry and tag it to one sourcing option. Candidates
                who selected the same source in the public form will be included
                in that source’s cost per hire calculation.
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
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-5 sm:p-6">
          <div className="rounded-3xl border border-[#E6ECF2] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6">
              <h3 className="text-base font-extrabold text-[#101828]">
                Cost Information
              </h3>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Example: tag Facebook ads spend to Social Media Ads.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div>
                <FieldLabel required>Sourcing Option</FieldLabel>
                <SelectInput
                  value={form.source}
                  onChange={(e) => updateField("source", e.target.value)}
                >
                  <option value="">Select sourcing option</option>
                  {sourcingOptions.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </SelectInput>
              </div>

              <div>
                <FieldLabel required>Description</FieldLabel>
                <TextArea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Example: Facebook Ads - CSR Hiring Campaign May 2026"
                />
              </div>

              <div>
                <FieldLabel required>Amount</FieldLabel>
                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => updateField("amount", e.target.value)}
                  placeholder="Example: 10000"
                />
              </div>

              <div>
                <FieldLabel required>Date Spent</FieldLabel>
                <TextInput
                  type="date"
                  value={form.dateSpent}
                  onChange={(e) => updateField("dateSpent", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-bold text-sibs-primary-1">
              Cost per Hire Formula
            </p>

            <p className="mt-1 text-sm font-semibold leading-6 text-sibs-primary-1/80">
              Cost per Hire = Total Source Cost / Hires from candidates who
              selected that source.
            </p>
          </div>
        </div>

        <div className="border-t border-[#E6ECF2] bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            >
              <Plus size={17} />
              Add Source Cost
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function SourceDetailsModal({ open, source, onClose }) {
  if (!open || !source) return null;

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
            <h2 className="text-lg font-extrabold text-sibs-primary-1 sm:text-xl">
              SOURCE PERFORMANCE DETAILS
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Auto-generated from public application form submissions and source
              cost entries.
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
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Sourcing Platform
                    </p>

                    <h3 className="mt-1 text-xl font-extrabold text-[#101828]">
                      {source.source}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
                        Total Cost: {formatCurrency(source.sourceCost)}
                      </span>

                      <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        {source.costEntries.length} Cost Entries
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
                  {source.costEntries.length > 0 ? (
                    source.costEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-extrabold text-[#101828]">
                              {entry.description}
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

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Data Source
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  Candidate counts are generated from public application form
                  submissions. Cost entries are frontend-only and tagged to a
                  sourcing option.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-extrabold text-[#101828]">
                  Source Summary
                </h3>

                <div className="mt-4">
                  <DetailRow label="Source" value={source.source} />
                  <DetailRow
                    label="Total Source Cost"
                    value={formatCurrency(source.sourceCost)}
                  />
                  <DetailRow
                    label="Cost per Hire"
                    value={formatCurrency(source.costPerHire)}
                  />
                  <DetailRow label="Volume" value={source.volume} />
                  <DetailRow label="Screened" value={source.screened} />
                  <DetailRow label="Interviewed" value={source.interviewed} />
                  <DetailRow label="Offered" value={source.offered} />
                  <DetailRow label="Hired" value={source.hired} />
                  <DetailRow
                    label="Conversion"
                    value={`${Number(source.conversionRate || 0).toFixed(1)}%`}
                  />
                  <DetailRow
                    label="Cost Entries"
                    value={source.costEntries.length}
                  />
                  <DetailRow
                    label="Latest Applicant"
                    value={source.latestCandidate}
                  />
                  <DetailRow
                    label="Last Activity"
                    value={formatDate(source.lastActivity)}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                <h3 className="text-sm font-bold text-amber-700">Important</h3>

                <p className="mt-2 text-sm leading-6 text-amber-700/90">
                  Since this is frontend-only, cost entries and public
                  submissions are read from browser localStorage only.
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
              className="rounded-xl bg-sibs-primary-1 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SourcingAnalyticsPage() {
  const [publicSubmissions, setPublicSubmissions] = useState([]);
  const [costEntries, setCostEntries] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState(null);

  const [showAddCostModal, setShowAddCostModal] = useState(false);
  const [costForm, setCostForm] = useState({
    ...initialCostForm,
    dateSpent: getTodayISO(),
  });

  useEffect(() => {
    refreshFromLocalStorage();
  }, []);

  const sourceRows = useMemo(() => {
    return sourcingOptions.map((sourceName, index) => {
      const matchedCandidates = publicSubmissions.filter((candidate) => {
        const candidateSources = Array.isArray(candidate.hearAboutUs)
          ? candidate.hearAboutUs
          : [];

        return candidateSources.includes(sourceName);
      });

      const matchedCostEntries = costEntries.filter((entry) => {
        return entry.source === sourceName;
      });

      const volume = matchedCandidates.length;
      const screened = matchedCandidates.filter(isScreenedCandidate).length;
      const interviewed = matchedCandidates.filter(
        isInterviewedCandidate
      ).length;
      const offered = matchedCandidates.filter(isOfferedCandidate).length;
      const hired = matchedCandidates.filter(isHiredCandidate).length;

      const sourceCost = matchedCostEntries.reduce((sum, entry) => {
        return sum + Number(entry.amount || 0);
      }, 0);

      const latestCandidate = matchedCandidates[0];

      return {
        id: `${sourceName}-${index}`,
        source: sourceName,
        sourceCost,
        costEntries: matchedCostEntries,
        volume,
        screened,
        interviewed,
        offered,
        hired,
        conversionRate: calculateConversionRate(hired, volume),
        costPerHire: calculateCostPerHire(sourceCost, hired),
        latestCandidate:
          latestCandidate?.name ||
          latestCandidate?.candidateName ||
          latestCandidate?.email ||
          "",
        lastActivity: latestCandidate?.submittedAt || "",
      };
    });
  }, [publicSubmissions, costEntries]);

  const filteredSources = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return sourceRows.filter((source) => {
      return (
        !keyword ||
        String(source.source || "").toLowerCase().includes(keyword) ||
        String(source.latestCandidate || "").toLowerCase().includes(keyword)
      );
    });
  }, [sourceRows, search]);

  const totals = useMemo(() => {
    const activeSourceRows = sourceRows.filter((source) => source.volume > 0);

    const totalVolume = sourceRows.reduce(
      (sum, source) => sum + Number(source.volume || 0),
      0
    );

    const totalHired = sourceRows.reduce(
      (sum, source) => sum + Number(source.hired || 0),
      0
    );

    const totalSourceCost = sourceRows.reduce(
      (sum, source) => sum + Number(source.sourceCost || 0),
      0
    );

    const averageConversion =
      totalVolume > 0 ? ((totalHired / totalVolume) * 100).toFixed(1) : "0.0";

    const overallCostPerHire =
      totalHired > 0 ? totalSourceCost / totalHired : 0;

    const topVolumeSource = [...sourceRows].sort(
      (a, b) => Number(b.volume || 0) - Number(a.volume || 0)
    )[0];

    const highestCostSource = [...sourceRows].sort(
      (a, b) => Number(b.sourceCost || 0) - Number(a.sourceCost || 0)
    )[0];

    return {
      totalSources: sourceRows.length,
      activeSources: activeSourceRows.length,
      totalVolume,
      totalHired,
      totalSourceCost,
      averageConversion,
      overallCostPerHire,
      topVolumeSource,
      highestCostSource,
    };
  }, [sourceRows]);

  const maxVolume = useMemo(() => {
    return Math.max(
      1,
      ...sourceRows.map((source) => Number(source.volume || 0))
    );
  }, [sourceRows]);

  const maxConversion = useMemo(() => {
    return Math.max(
      1,
      ...sourceRows.map((source) => Number(source.conversionRate || 0))
    );
  }, [sourceRows]);

  const maxCost = useMemo(() => {
    return Math.max(
      1,
      ...sourceRows.map((source) => Number(source.sourceCost || 0))
    );
  }, [sourceRows]);

  function refreshFromLocalStorage() {
    const storedSubmissions = readLocalStorage(PUBLIC_SUBMISSIONS_KEY, []);
    const storedCostEntries = readLocalStorage(SOURCE_COST_ENTRIES_KEY, []);

    setPublicSubmissions(
      Array.isArray(storedSubmissions) ? storedSubmissions : []
    );

    setCostEntries(Array.isArray(storedCostEntries) ? storedCostEntries : []);
  }

  function loadSampleData() {
    writeLocalStorage(PUBLIC_SUBMISSIONS_KEY, samplePublicSubmissions);
    writeLocalStorage(SOURCE_COST_ENTRIES_KEY, sampleSourceCostEntries);

    setPublicSubmissions(samplePublicSubmissions);
    setCostEntries(sampleSourceCostEntries);
  }

  function resetCostForm() {
    setCostForm({
      ...initialCostForm,
      dateSpent: getTodayISO(),
    });
  }

  function handleOpenAddCostModal() {
    resetCostForm();
    setShowAddCostModal(true);
  }

  function handleCloseAddCostModal() {
    setShowAddCostModal(false);
    resetCostForm();
  }

  function handleAddSourceCost(e) {
    e.preventDefault();

    if (!costForm.source) {
      alert("Sourcing Option is required.");
      return;
    }

    if (!costForm.description.trim()) {
      alert("Description is required.");
      return;
    }

    if (costForm.amount === "" || Number(costForm.amount) <= 0) {
      alert("Amount must be greater than 0.");
      return;
    }

    if (!costForm.dateSpent) {
      alert("Date Spent is required.");
      return;
    }

    const newEntry = {
      id: Date.now(),
      source: costForm.source,
      description: costForm.description.trim(),
      amount: Number(costForm.amount || 0),
      dateSpent: costForm.dateSpent,
      createdAt: getTodayISO(),
    };

    const updatedEntries = [newEntry, ...costEntries];

    setCostEntries(updatedEntries);
    writeLocalStorage(SOURCE_COST_ENTRIES_KEY, updatedEntries);

    setShowAddCostModal(false);
    resetCostForm();
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <BarChart3 size={14} />
                Sourcing Analytics
              </div>

              <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
                Sourcing Analytics
              </h1>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Automatically tracks candidate source volume from public
                application form submissions and calculates cost per hire from
                tagged source costs.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={refreshFromLocalStorage}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
              >
                <Activity size={18} />
                Refresh Data
              </button>

              <button
                type="button"
                onClick={loadSampleData}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
              >
                <ReceiptText size={18} />
                Load Sample Data
              </button>

              <button
                type="button"
                onClick={handleOpenAddCostModal}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
              >
                <Plus size={18} />
                Add Source Cost
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_auto] xl:items-end">
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
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search source or latest applicant..."
                    className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSearch("")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
              >
                <Filter size={17} />
                Clear
              </button>
            </div>
          </div>

          <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-bold text-[#101828]">
              Sourcing Performance Summary
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryCard
                title="Tracked Sources"
                value={totals.totalSources}
                icon={<MousePointerClick size={22} />}
                description={`${totals.activeSources} with applicants`}
              />

              <SummaryCard
                title="Public Applicants"
                value={totals.totalVolume}
                icon={<UsersRound size={22} />}
                description="From public form"
              />

              <SummaryCard
                title="Hired From Sources"
                value={totals.totalHired}
                valueClassName="text-emerald-600"
                icon={<UserCheck size={22} />}
                description="Based on frontend status"
              />

              <SummaryCard
                title="Total Source Cost"
                value={formatCurrency(totals.totalSourceCost)}
                valueClassName="text-blue-600"
                icon={<TrendingUp size={22} />}
                description={`${costEntries.length} cost entries`}
              />

              <SummaryCard
                title="Overall Cost per Hire"
                value={formatCurrency(totals.overallCostPerHire)}
                icon={<Target size={22} />}
                description="Total cost / total hired"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[#101828]">
                    Applicant Volume per Source
                  </h2>

                  <p className="text-sm font-medium text-sibs-tertiary-5">
                    Counted from public form source answers.
                  </p>
                </div>

                <UsersRound size={20} className="shrink-0 text-gray-400" />
              </div>

              <div className="max-h-[420px] space-y-5 overflow-y-auto pr-1">
                {sourceRows.map((source) => (
                  <VolumeBar
                    key={source.id}
                    label={source.source}
                    value={source.volume}
                    max={maxVolume}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[#101828]">
                    Conversion to Hire
                  </h2>

                  <p className="text-sm font-medium text-sibs-tertiary-5">
                    Hired divided by applicants.
                  </p>
                </div>

                <Activity size={20} className="shrink-0 text-gray-400" />
              </div>

              <div className="max-h-[420px] space-y-5 overflow-y-auto pr-1">
                {sourceRows.map((source) => (
                  <ConversionBar
                    key={source.id}
                    label={source.source}
                    value={source.conversionRate}
                    max={maxConversion}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[#101828]">
                    Source Cost
                  </h2>

                  <p className="text-sm font-medium text-sibs-tertiary-5">
                    Total cost tagged per source.
                  </p>
                </div>

                <ReceiptText size={20} className="shrink-0 text-gray-400" />
              </div>

              <div className="max-h-[420px] space-y-5 overflow-y-auto pr-1">
                {sourceRows.map((source) => (
                  <CostBar
                    key={source.id}
                    label={source.source}
                    value={source.sourceCost}
                    max={maxCost}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
            <div className="hidden lg:block">
              <div className="overflow-x-auto p-6">
                <table className="w-full min-w-[1350px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
                  <thead>
                    <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                      <th className="px-5 py-4 first:rounded-tl-2xl">
                        Source
                      </th>
                      <th className="px-5 py-4 text-center">Source Cost</th>
                      <th className="px-5 py-4 text-center">Cost Entries</th>
                      <th className="px-5 py-4 text-center">Applicants</th>
                      <th className="px-5 py-4 text-center">Screened</th>
                      <th className="px-5 py-4 text-center">Interviewed</th>
                      <th className="px-5 py-4 text-center">Offered</th>
                      <th className="px-5 py-4 text-center">Hired</th>
                      <th className="px-5 py-4 text-center">Conversion</th>
                      <th className="px-5 py-4 text-center">Cost per Hire</th>
                      <th className="px-5 py-4">Latest Applicant</th>
                      <th className="px-5 py-4">Last Activity</th>
                      <th className="px-5 py-4 text-right last:rounded-tr-2xl">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSources.length > 0 ? (
                      filteredSources.map((source) => (
                        <tr
                          key={source.id}
                          className="transition hover:bg-[#FAFBFC]"
                        >
                          <td className="border-b border-[#E6ECF2] px-5 py-5">
                            <p className="text-sm font-bold text-[#0F172A]">
                              {source.source}
                            </p>
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
                            {formatCurrency(source.sourceCost)}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
                            {source.costEntries.length}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-sibs-primary-1">
                            {source.volume}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
                            {source.screened}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
                            {source.interviewed}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
                            {source.offered}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-emerald-600">
                            {source.hired}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-sibs-primary-1">
                            {Number(source.conversionRate || 0).toFixed(1)}%
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-sibs-primary-1">
                            {formatCurrency(source.costPerHire)}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                            {source.latestCandidate || "—"}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                            {formatDate(source.lastActivity)}
                          </td>

                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedSource(source)}
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
                          No source performance records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-[#E6ECF2] px-6 py-4">
                <p className="text-sm font-medium text-sibs-primary-1">
                  Showing 1 to {filteredSources.length} of {sourceRows.length}{" "}
                  source records
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-tertiary-5"
                  >
                    <ChevronLeft size={16} />
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
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 lg:hidden">
              {filteredSources.length > 0 ? (
                filteredSources.map((source) => (
                  <SourceMobileCard
                    key={source.id}
                    source={source}
                    onView={() => setSelectedSource(source)}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                  No source performance records found.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <h3 className="text-sm font-bold text-sibs-primary-1">
              Cost per Hire Rule
            </h3>

            <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
              Candidate volume is counted from the public application form
              source selection. Source cost is added separately and tagged to the
              same sourcing option. Cost per Hire is calculated as{" "}
              <span className="font-extrabold">
                Total Cost Tagged to Source / Hired Candidates From That Source
              </span>
              .
            </p>
          </section>
        </div>
      </main>

      <AddSourceCostModal
        open={showAddCostModal}
        form={costForm}
        setForm={setCostForm}
        onClose={handleCloseAddCostModal}
        onSubmit={handleAddSourceCost}
        onReset={resetCostForm}
      />

      <SourceDetailsModal
        open={!!selectedSource}
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
      />
    </div>
  );
}