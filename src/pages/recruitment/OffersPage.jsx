import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/layout/Header";
import { useUser } from "../../services/context/UserContext";
import {
  Gift,
  Search,
  Eye,
  X,
  CalendarDays,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  FileText,
  Timer,
  Mail,
  ShieldCheck,
  Send,
} from "lucide-react";

const OFFER_ELIGIBLE_STORAGE_KEY = "ta_offer_eligible_candidates";
const OFFER_RECORDS_STORAGE_KEY = "ta_offer_records";
const PIPELINE_SYNC_EVENTS_KEY = "ta_pipeline_sync_events";

const offerApprovers = ["Raul Nadela", "Haasanor"];
const statusOptions = [
  "All Status",
  "For Review",
  "Approved",
  "Rejected",
  "Contract Sent",
  "Accepted",
  "Declined",
];
const accountOptions = [
  "All Accounts",
  "Collect IV",
  "Collect AR",
  "Connect",
  "DentistRX",
  "Reconciliation",
  "TeleDentistry",
  "Cash",
  "US Visa",
  "Channel Assist",
  "Yomdel",
  "SIBS IT",
];
const declineCategoryOptions = [
  "Compensation",
  "Schedule",
  "Accepted Other Offer",
  "Location Issue",
  "Personal Reason",
  "Incomplete Requirements",
  "No Response",
  "Others",
];

const sampleOfferRecords = [
  {
    id: 1,
    offerId: "OFF-001",
    candidateApplicationId: 4,
    candidateId: "CAND-004",
    candidateName: "Kim Cruz",
    candidateEmail: "kim.cruz@email.com",
    roleTitle: "Customer Service Representative",
    account: "Collect IV",
    hiringRequirementId: "PRF-2026-001",
    basicPay: 22000,
    deminimisDailyRate: 3000,
    dailyRate: 25000,
    owner: "Maria Reyes",
    source: "Employee Referral Program",
    status: "For Review",
    offerDate: "2026-05-06",
    contractSent: false,
    contractSentAt: null,
    candidateResponse: "Pending",
    responseDate: null,
    declineCategory: "",
    declineReason: "",
    remarks: "Offer prepared from Candidate Pipeline and waiting for approval.",
    approvals: {
      "Raul Nadela": { status: "For Review", updatedAt: null, remarks: "" },
      Haasanor: { status: "For Review", updatedAt: null, remarks: "" },
    },
  },
  {
    id: 2,
    offerId: "OFF-002",
    candidateApplicationId: 5,
    candidateId: "CAND-005",
    candidateName: "Angela Lim",
    candidateEmail: "angela.lim@email.com",
    roleTitle: "RCM Analyst",
    account: "US Visa",
    hiringRequirementId: "PRF-2026-002",
    basicPay: 28000,
    deminimisDailyRate: 3000,
    dailyRate: 31000,
    owner: "John Dela Cruz",
    source: "Online Job Portals",
    status: "Approved",
    offerDate: "2026-05-07",
    contractSent: false,
    contractSentAt: null,
    candidateResponse: "Pending",
    responseDate: null,
    declineCategory: "",
    declineReason: "",
    remarks: "Approved and ready for contract sending.",
    approvals: {
      "Raul Nadela": { status: "Approved", updatedAt: "May 7, 2026, 10:10 AM", remarks: "" },
      Haasanor: { status: "Approved", updatedAt: "May 7, 2026, 10:25 AM", remarks: "" },
    },
  },
  {
    id: 3,
    offerId: "OFF-003",
    candidateApplicationId: 6,
    candidateId: "CAND-006",
    candidateName: "Carlo Reyes",
    candidateEmail: "carlo.reyes@email.com",
    roleTitle: "System Developer",
    account: "SIBS IT",
    hiringRequirementId: "PRF-2026-003",
    basicPay: 42000,
    deminimisDailyRate: 5000,
    dailyRate: 47000,
    owner: "Kim Domingo",
    source: "Social Media Ads",
    status: "Contract Sent",
    offerDate: "2026-05-08",
    contractSent: true,
    contractSentAt: "May 8, 2026, 2:15 PM",
    candidateResponse: "Pending",
    responseDate: null,
    declineCategory: "",
    declineReason: "",
    remarks: "Contract sent to candidate. Awaiting response.",
    approvals: {
      "Raul Nadela": { status: "Approved", updatedAt: "May 8, 2026, 1:00 PM", remarks: "" },
      Haasanor: { status: "Approved", updatedAt: "May 8, 2026, 1:30 PM", remarks: "" },
    },
  },
  {
    id: 4,
    offerId: "OFF-004",
    candidateApplicationId: 7,
    candidateId: "CAND-007",
    candidateName: "Mika Santos",
    candidateEmail: "mika.santos@email.com",
    roleTitle: "QA Specialist",
    account: "Connect",
    hiringRequirementId: "PRF-2026-004",
    basicPay: 26000,
    deminimisDailyRate: 3000,
    dailyRate: 29000,
    owner: "Paul Garcia",
    source: "Walk In",
    status: "Accepted",
    offerDate: "2026-05-04",
    contractSent: true,
    contractSentAt: "May 4, 2026, 3:30 PM",
    candidateResponse: "Accepted",
    responseDate: "2026-05-05",
    declineCategory: "",
    declineReason: "",
    remarks: "Candidate accepted the contract.",
    approvals: {
      "Raul Nadela": { status: "Approved", updatedAt: "May 4, 2026, 2:00 PM", remarks: "" },
      Haasanor: { status: "Approved", updatedAt: "May 4, 2026, 2:45 PM", remarks: "" },
    },
  },
  {
    id: 5,
    offerId: "OFF-005",
    candidateApplicationId: 8,
    candidateId: "CAND-008",
    candidateName: "Ryan Tan",
    candidateEmail: "ryan.tan@email.com",
    roleTitle: "IT Support",
    account: "SIBS IT",
    hiringRequirementId: "PRF-2026-005",
    basicPay: 24000,
    deminimisDailyRate: 3000,
    dailyRate: 27000,
    owner: "Maria Reyes",
    source: "Job Fairs",
    status: "Declined",
    offerDate: "2026-05-02",
    contractSent: true,
    contractSentAt: "May 2, 2026, 11:00 AM",
    candidateResponse: "Declined",
    responseDate: "2026-05-03",
    declineCategory: "Schedule",
    declineReason: "Candidate declined because the available shift conflicted with school schedule.",
    remarks: "Declined after receiving contract.",
    approvals: {
      "Raul Nadela": { status: "Approved", updatedAt: "May 2, 2026, 9:30 AM", remarks: "" },
      Haasanor: { status: "Approved", updatedAt: "May 2, 2026, 10:00 AM", remarks: "" },
    },
  },
];

function inputClass(extra = "") {
  return `h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function textareaClass(extra = "") {
  return `w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function safeReadArray(key) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWriteArray(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // local storage only
  }
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getCurrentTimestamp() {
  return new Date().toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateDailyRate(basicPay, deminimisDailyRate) {
  return toNumber(basicPay) + toNumber(deminimisDailyRate);
}

function generateOfferId(nextNumber) {
  return `OFF-${String(nextNumber).padStart(3, "0")}`;
}

function getOfferApprovalSummary(offer) {
  const approvals = offer?.approvals || {};
  const statuses = offerApprovers.map((name) => approvals?.[name]?.status || "For Review");
  if (statuses.includes("Rejected")) return "Rejected";
  if (statuses.every((status) => status === "Approved")) return "Approved";
  return "For Review";
}

function normalizeEligibleCandidate(candidate, index, existingCount) {
  const offerDetails = candidate.offerDetails || {};
  const id = existingCount + index + 1;
  const basicPay = toNumber(offerDetails.basicPay || candidate.basicPay);
  const deminimisDailyRate = toNumber(offerDetails.deminimisDailyRate || candidate.deminimisDailyRate || candidate.deMinimis);

  return {
    id,
    offerId: generateOfferId(id),
    candidateApplicationId: candidate.candidateApplicationId || candidate.id,
    candidateId: candidate.candidateId,
    candidateName: candidate.candidateName || candidate.name,
    candidateEmail: candidate.candidateEmail || candidate.email,
    roleTitle: offerDetails.roleTitle || candidate.roleTitle || "Not assigned yet",
    account: offerDetails.account || candidate.account || "Not assigned yet",
    hiringRequirementId: offerDetails.hiringRequirementId || candidate.hiringRequirementId || "—",
    basicPay,
    deminimisDailyRate,
    dailyRate: calculateDailyRate(basicPay, deminimisDailyRate),
    owner: candidate.owner || candidate.taOwner || "Current User",
    source: candidate.source || "Candidate Pipeline",
    status: candidate.offerApprovalStatus === "Rejected" ? "Rejected" : "For Review",
    offerDate: getTodayDate(),
    contractSent: Boolean(candidate.offerEmailSent),
    contractSentAt: candidate.offerEmailSentAt || null,
    candidateResponse: candidate.offerDecision || "Pending",
    responseDate: candidate.offerDecisionAt || null,
    declineCategory: candidate.dropOffCategory || "",
    declineReason: candidate.dropOffReason || "",
    remarks: "Offer received from Candidate Pipeline.",
    approvals: candidate.offerApprovals || {
      "Raul Nadela": { status: "For Review", updatedAt: null, remarks: "" },
      Haasanor: { status: "For Review", updatedAt: null, remarks: "" },
    },
  };
}

function normalizeOffer(offer) {
  const basicPay = toNumber(offer.basicPay);
  const deminimisDailyRate = toNumber(offer.deminimisDailyRate || offer.deMinimis);
  const approvalSummary = getOfferApprovalSummary(offer);
  let status = offer.status || approvalSummary;

  if (offer.candidateResponse === "Accepted") status = "Accepted";
  if (offer.candidateResponse === "Declined") status = "Declined";
  if (offer.contractSent && offer.candidateResponse === "Pending") status = "Contract Sent";
  if (!offer.contractSent && approvalSummary === "Approved" && offer.candidateResponse === "Pending") status = "Approved";
  if (approvalSummary === "Rejected") status = "Rejected";

  return {
    ...offer,
    basicPay,
    deminimisDailyRate,
    dailyRate: calculateDailyRate(basicPay, deminimisDailyRate),
    approvals: offer.approvals || {
      "Raul Nadela": { status: "For Review", updatedAt: null, remarks: "" },
      Haasanor: { status: "For Review", updatedAt: null, remarks: "" },
    },
    candidateResponse: offer.candidateResponse || "Pending",
    contractSent: Boolean(offer.contractSent),
    status,
  };
}

function getStatusClass(status) {
  switch (status) {
    case "Accepted":
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Declined":
    case "Rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "Contract Sent":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "For Review":
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function useConfirmDialog() {
  const [config, setConfig] = useState(null);

  function confirmAction(message, options = {}) {
    return new Promise((resolve) => {
      setConfig({
        title: options.title || "Confirm Action",
        message,
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        variant: options.variant || "default",
        resolve,
      });
    });
  }

  function close(answer) {
    if (config?.resolve) config.resolve(answer);
    setConfig(null);
  }

  function ConfirmationDialog() {
    if (!config) return null;

    const isDanger = config.variant === "danger";

    return (
      <div className="fixed inset-0 z-[11000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-sibs-primary-1">{config.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#475467]">{config.message}</p>
            </div>
            <button type="button" onClick={() => close(false)} className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
              <X size={18} />
            </button>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => close(false)} className="inline-flex h-10 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-gray-600 transition hover:bg-[#F8FAFC]">
              {config.cancelText}
            </button>
            <button type="button" onClick={() => close(true)} className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${isDanger ? "bg-red-600" : "bg-sibs-primary-1"}`}>
              {config.confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return { confirmAction, ConfirmationDialog };
}

function StatCard({ title, value, icon: Icon, description, valueClassName = "text-sibs-primary-1" }) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">{title}</p>
          <p className={`mt-3 truncate text-3xl font-extrabold ${valueClassName}`}>{value}</p>
          {description && <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">{description}</p>}
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">{label}</p>
      <div className="max-w-[62%] break-words text-right text-sm font-bold text-[#344054]">{value || "—"}</div>
    </div>
  );
}

function OfferDetailsModal({ open, offer, onClose }) {
  if (!open || !offer) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4" onClick={onClose}>
      <div className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-extrabold text-sibs-primary-1 sm:text-xl">Offer Details</h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">Approval status, final assignment, contract sending, and candidate response.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-bold text-sibs-primary-1">{offer.offerId}</p>
                    <h3 className="mt-1 text-2xl font-extrabold text-[#101828]">{offer.candidateName}</h3>
                    <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">{offer.roleTitle} / {offer.account}</p>
                  </div>
                  <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(offer.status)}`}>{offer.status}</span>
                </div>
              </section>

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-[#101828]">Approval Details</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {offerApprovers.map((approver) => (
                    <div key={approver} className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                      <p className="text-sm font-bold text-[#101828]">{approver}</p>
                      <span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(offer.approvals?.[approver]?.status || "For Review")}`}>
                        {offer.approvals?.[approver]?.status || "For Review"}
                      </span>
                      <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">{offer.approvals?.[approver]?.updatedAt || "No update yet"}</p>
                    </div>
                  ))}
                </div>
              </section>

              {offer.status === "Declined" && offer.declineReason && (
                <section className="rounded-2xl border border-red-100 bg-red-50 p-5">
                  <h3 className="text-sm font-extrabold text-red-700">Decline Reason</h3>
                  <p className="mt-3 text-sm font-semibold leading-6 text-red-700">{offer.declineReason}</p>
                </section>
              )}

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-[#101828]">Remarks</h3>
                <p className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm font-semibold leading-6 text-[#344054]">{offer.remarks || "—"}</p>
              </section>
            </div>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-extrabold text-[#101828]">Offer Summary</h3>
                <div className="mt-4">
                  <DetailRow label="Candidate ID" value={offer.candidateId} />
                  <DetailRow label="Hiring Requirement" value={offer.hiringRequirementId} />
                  <DetailRow label="Final Role" value={offer.roleTitle} />
                  <DetailRow label="Final Account" value={offer.account} />
                  <DetailRow label="Basic Pay" value={formatCurrency(offer.basicPay)} />
                  <DetailRow label="Deminimis / Daily Rate" value={formatCurrency(offer.deminimisDailyRate)} />
                  <DetailRow label="Total Daily Rate" value={formatCurrency(offer.dailyRate)} />
                  <DetailRow label="Contract Sent" value={offer.contractSent ? "Yes" : "No"} />
                  <DetailRow label="Candidate Response" value={offer.candidateResponse} />
                  <DetailRow label="Owner" value={offer.owner} />
                </div>
              </section>
            </aside>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="inline-flex h-11 items-center justify-center rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeclineResponseModal({ open, offer, form, setForm, onClose, onSubmit }) {
  if (!open || !offer) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-red-700">Candidate Declined Contract</h2>
            <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">{offer.candidateName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"><X size={20} /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">Decline Category *</label>
            <select required value={form.declineCategory} onChange={(e) => setForm({ ...form, declineCategory: e.target.value })} className={inputClass()}>
              <option value="">Select category</option>
              {declineCategoryOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">Decline Reason *</label>
            <textarea required rows={4} value={form.declineReason} onChange={(e) => setForm({ ...form, declineReason: e.target.value })} className={textareaClass()} placeholder="Reason from candidate" />
          </div>
        </form>
        <div className="border-t border-gray-100 px-5 py-4">
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 hover:bg-[#F8FAFC]">Cancel</button>
            <button type="button" onClick={onSubmit} className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">Save Decline</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OffersPage() {
  const { user } = useUser();
  const { confirmAction, ConfirmationDialog } = useConfirmDialog();
  const currentUserName =
    user?.name ||
    user?.fullName ||
    user?.employeeName ||
    user?.displayName ||
    user?.username ||
    "Current User";

  const [offerList, setOfferList] = useState(sampleOfferRecords.map(normalizeOffer));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [accountFilter, setAccountFilter] = useState("All Accounts");
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [declineOffer, setDeclineOffer] = useState(null);
  const [declineForm, setDeclineForm] = useState({ declineCategory: "", declineReason: "" });

  useEffect(() => {
    const storedOffers = safeReadArray(OFFER_RECORDS_STORAGE_KEY);
    const eligibleCandidates = safeReadArray(OFFER_ELIGIBLE_STORAGE_KEY);
    const baseOffers = storedOffers.length ? storedOffers : sampleOfferRecords;
    const existingKeys = new Set(baseOffers.map((offer) => String(offer.candidateApplicationId || offer.candidateEmail)));
    const newFromPipeline = eligibleCandidates
      .filter((candidate) => !existingKeys.has(String(candidate.candidateApplicationId || candidate.candidateEmail)))
      .map((candidate, index) => normalizeEligibleCandidate(candidate, index, baseOffers.length));
    const next = [...newFromPipeline, ...baseOffers].map(normalizeOffer);
    setOfferList(next);
    safeWriteArray(OFFER_RECORDS_STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    safeWriteArray(OFFER_RECORDS_STORAGE_KEY, offerList.map(normalizeOffer));
  }, [offerList]);

  function updateOffer(updatedOffer) {
    const normalized = normalizeOffer(updatedOffer);
    setOfferList((prev) => prev.map((offer) => offer.id === normalized.id ? normalized : offer));
    setSelectedOffer((prev) => prev?.id === normalized.id ? normalized : prev);
  }

  function appendPipelineSyncEvent(event) {
    const current = safeReadArray(PIPELINE_SYNC_EVENTS_KEY);
    safeWriteArray(PIPELINE_SYNC_EVENTS_KEY, [event, ...current]);
  }

  async function handleApproval(offer, approver, status) {
    const action = status === "Approved" ? "approve" : "reject";
    if (!(await confirmAction(`${approver} will ${action} the offer for ${offer.candidateName}. Continue?`, {
      title: status === "Approved" ? "Approve Offer" : "Reject Offer",
      confirmText: status === "Approved" ? "Approve" : "Reject",
      variant: status === "Approved" ? "default" : "danger",
    }))) return;

    const updatedApprovals = {
      ...(offer.approvals || {}),
      [approver]: {
        status,
        updatedAt: getCurrentTimestamp(),
        remarks: `Updated by ${currentUserName}`,
      },
    };

    const updatedOffer = normalizeOffer({
      ...offer,
      approvals: updatedApprovals,
      remarks: `${approver} marked the offer as ${status}.`,
    });

    updateOffer(updatedOffer);
  }

  async function handleSendContract(offer) {
    if (getOfferApprovalSummary(offer) !== "Approved") {
      await confirmAction("Offer must be approved by Raul Nadela and Haasanor before sending the contract.", {
        title: "Approval Required",
        confirmText: "OK",
      });
      return;
    }

    if (!(await confirmAction(`Send contract email to ${offer.candidateName}?`, {
      title: "Send Contract Email",
      confirmText: "Send Email",
    }))) return;

    const updatedOffer = normalizeOffer({
      ...offer,
      contractSent: true,
      contractSentAt: getCurrentTimestamp(),
      candidateResponse: "Pending",
      remarks: "Contract email sent to candidate. Awaiting candidate response.",
    });

    updateOffer(updatedOffer);

    const subject = encodeURIComponent(`Offer Contract - ${offer.roleTitle}`);
    const body = encodeURIComponent(`Hi ${offer.candidateName},\n\nYour offer contract is ready for review.\n\nFinal Role: ${offer.roleTitle}\nFinal Account: ${offer.account}\nBasic Pay: ${formatCurrency(offer.basicPay)}\nDeminimis / Daily Rate: ${formatCurrency(offer.deminimisDailyRate)}\nTotal Daily Rate: ${formatCurrency(offer.dailyRate)}\n\nPlease review the contract and choose Accept or Decline.\n\nThank you,\nSIBS Talent Acquisition`);
    if (typeof window !== "undefined") {
      window.location.href = `mailto:${offer.candidateEmail}?subject=${subject}&body=${body}`;
    }
  }

  async function handleCandidateAccept(offer) {
    if (!offer.contractSent) {
      await confirmAction("Send the contract email first before recording candidate acceptance.", { title: "Contract Not Sent", confirmText: "OK" });
      return;
    }

    if (!(await confirmAction(`${offer.candidateName} accepted the contract. Move candidate to Accepted?`, {
      title: "Candidate Accepted",
      confirmText: "Mark Accepted",
    }))) return;

    const updatedOffer = normalizeOffer({
      ...offer,
      candidateResponse: "Accepted",
      responseDate: getTodayDate(),
      remarks: "Candidate accepted the contract.",
    });

    updateOffer(updatedOffer);
    appendPipelineSyncEvent({
      syncId: `SYNC-${Date.now()}-${offer.candidateApplicationId}`,
      candidateApplicationId: offer.candidateApplicationId,
      candidateId: offer.candidateId,
      candidateEmail: offer.candidateEmail,
      toStage: "Accepted",
      status: "Accepted",
      dateMoved: getTodayDate(),
      timestamp: getCurrentTimestamp(),
      reasonForMovement: "Candidate accepted the offer contract.",
      owner: currentUserName,
      source: "Offers Page",
      remarks: "Candidate clicked/confirmed Accept.",
    });
  }

  function openDeclineModal(offer) {
    setDeclineOffer(offer);
    setDeclineForm({ declineCategory: "", declineReason: "" });
  }

  function closeDeclineModal() {
    setDeclineOffer(null);
    setDeclineForm({ declineCategory: "", declineReason: "" });
  }

  async function handleCandidateDecline(e) {
    e.preventDefault();
    if (!declineOffer) return;

    if (!declineForm.declineCategory || !declineForm.declineReason.trim()) {
      alert("Decline category and reason are required.");
      return;
    }

    if (!(await confirmAction(`${declineOffer.candidateName} declined the contract. Move candidate to Drop-off?`, {
      title: "Candidate Declined",
      confirmText: "Mark Declined",
      variant: "danger",
    }))) return;

    const updatedOffer = normalizeOffer({
      ...declineOffer,
      candidateResponse: "Declined",
      responseDate: getTodayDate(),
      declineCategory: declineForm.declineCategory,
      declineReason: declineForm.declineReason.trim(),
      remarks: "Candidate declined the contract.",
    });

    updateOffer(updatedOffer);
    appendPipelineSyncEvent({
      syncId: `SYNC-${Date.now()}-${declineOffer.candidateApplicationId}`,
      candidateApplicationId: declineOffer.candidateApplicationId,
      candidateId: declineOffer.candidateId,
      candidateEmail: declineOffer.candidateEmail,
      toStage: "Drop-off",
      status: "Declined",
      dateMoved: getTodayDate(),
      timestamp: getCurrentTimestamp(),
      reasonForMovement: "Candidate declined the offer contract.",
      dropOffStage: "Offered",
      dropOffCategory: declineForm.declineCategory,
      dropOffReason: declineForm.declineReason.trim(),
      owner: currentUserName,
      source: "Offers Page",
      remarks: declineForm.declineReason.trim(),
    });
    closeDeclineModal();
  }

  const filteredOffers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return offerList.map(normalizeOffer).filter((offer) => {
      const matchesSearch =
        !keyword ||
        String(offer.offerId || "").toLowerCase().includes(keyword) ||
        String(offer.candidateName || "").toLowerCase().includes(keyword) ||
        String(offer.roleTitle || "").toLowerCase().includes(keyword) ||
        String(offer.account || "").toLowerCase().includes(keyword) ||
        String(offer.hiringRequirementId || "").toLowerCase().includes(keyword) ||
        String(offer.owner || "").toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === "All Status" || offer.status === statusFilter;
      const matchesAccount = accountFilter === "All Accounts" || offer.account === accountFilter;
      return matchesSearch && matchesStatus && matchesAccount;
    });
  }, [accountFilter, offerList, search, statusFilter]);

  const stats = useMemo(() => {
    const normalized = offerList.map(normalizeOffer);
    const total = normalized.length;
    const forReview = normalized.filter((offer) => offer.status === "For Review").length;
    const approved = normalized.filter((offer) => offer.status === "Approved").length;
    const contractSent = normalized.filter((offer) => offer.status === "Contract Sent").length;
    const accepted = normalized.filter((offer) => offer.status === "Accepted").length;
    const declined = normalized.filter((offer) => offer.status === "Declined").length;
    const acceptanceRate = total ? Math.round((accepted / total) * 100) : 0;
    return { total, forReview, approved, contractSent, accepted, declined, acceptanceRate };
  }, [offerList]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6">
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <Gift size={14} />
                Offers
              </div>
              <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">Offers</h1>
              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">Approve offered candidates, send contract emails, and record candidate acceptance or decline.</p>
            </div>
          </div>

          <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-bold text-[#101828]">Offer Summary</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <StatCard title="Total Offers" value={stats.total} icon={FileText} description="Offer records" />
              <StatCard title="For Review" value={stats.forReview} icon={Clock3} description="Needs approval" />
              <StatCard title="Approved" value={stats.approved} icon={ShieldCheck} description="Ready to send" valueClassName="text-emerald-600" />
              <StatCard title="Contract Sent" value={stats.contractSent} icon={Send} description="Awaiting response" />
              <StatCard title="Accepted" value={stats.accepted} icon={UserCheck} description={`${stats.acceptanceRate}% rate`} valueClassName="text-emerald-600" />
              <StatCard title="Declined" value={stats.declined} icon={UserX} description="With reasons" valueClassName="text-red-600" />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
            <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_220px_220px_auto] xl:items-end">
                <div>
                  <label className="mb-1 block text-sm font-bold text-[#101828]">Search</label>
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidate, offer ID, role, account..." className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-[#101828]">Status</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10">
                    {statusOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-[#101828]">Account</label>
                  <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10">
                    {accountOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <button type="button" onClick={() => { setSearch(""); setStatusFilter("All Status"); setAccountFilter("All Accounts"); }} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]">
                  Clear
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="hidden lg:block">
                <div className="overflow-x-auto p-0">
                  <table className="w-full min-w-[1550px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
                    <thead>
                      <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                        <th className="px-5 py-4 first:rounded-tl-2xl">Candidate</th>
                        <th className="px-5 py-4">Final Role / Account</th>
                        <th className="px-5 py-4">Hiring Req.</th>
                        <th className="px-5 py-4 text-right">Basic Pay</th>
                        <th className="px-5 py-4 text-right">Deminimis / Daily Rate</th>
                        <th className="px-5 py-4">Approval</th>
                        <th className="px-5 py-4">Contract</th>
                        <th className="px-5 py-4">Candidate Response</th>
                        <th className="px-5 py-4">Owner</th>
                        <th className="px-5 py-4 text-right last:rounded-tr-2xl">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOffers.length > 0 ? filteredOffers.map((offer) => (
                        <tr key={offer.id} className="cursor-pointer transition hover:bg-[#FAFBFC]" onClick={() => setSelectedOffer(offer)}>
                          <td className="border-b border-[#E6ECF2] px-5 py-5">
                            <p className="text-sm font-bold text-[#101828]">{offer.candidateName}</p>
                            <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">{offer.offerId} • {offer.candidateId}</p>
                          </td>
                          <td className="border-b border-[#E6ECF2] px-5 py-5">
                            <p className="text-sm font-bold text-[#344054]">{offer.roleTitle}</p>
                            <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">{offer.account}</p>
                          </td>
                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">{offer.hiringRequirementId}</td>
                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-right text-sm font-bold text-[#344054]">{formatCurrency(offer.basicPay)}</td>
                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-right text-sm font-bold text-[#344054]">{formatCurrency(offer.deminimisDailyRate)}</td>
                          <td className="border-b border-[#E6ECF2] px-5 py-5">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(getOfferApprovalSummary(offer))}`}>{getOfferApprovalSummary(offer)}</span>
                          </td>
                          <td className="border-b border-[#E6ECF2] px-5 py-5">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${offer.contractSent ? "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-200 bg-gray-50 text-gray-600"}`}>{offer.contractSent ? "Sent" : "Not Sent"}</span>
                          </td>
                          <td className="border-b border-[#E6ECF2] px-5 py-5">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(offer.status)}`}>{offer.candidateResponse}</span>
                          </td>
                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">{offer.owner}</td>
                          <td className="border-b border-[#E6ECF2] px-5 py-5 text-right">
                            <div className="inline-flex flex-wrap items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <button type="button" onClick={() => setSelectedOffer(offer)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-primary-1 transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm" title="View"><Eye size={16} /></button>
                              {getOfferApprovalSummary(offer) === "For Review" && (
                                <>
                                  <button type="button" onClick={() => handleApproval(offer, "Raul Nadela", "Approved")} className="inline-flex h-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-sm">Raul Approve</button>
                                  <button type="button" onClick={() => handleApproval(offer, "Haasanor", "Approved")} className="inline-flex h-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-sm">Haasanor Approve</button>
                                </>
                              )}
                              {getOfferApprovalSummary(offer) === "Approved" && !offer.contractSent && (
                                <button type="button" onClick={() => handleSendContract(offer)} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-3 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><Mail size={14} /> Send</button>
                              )}
                              {offer.contractSent && offer.candidateResponse === "Pending" && (
                                <>
                                  <button type="button" onClick={() => handleCandidateAccept(offer)} className="inline-flex h-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-sm">Accepted</button>
                                  <button type="button" onClick={() => openDeclineModal(offer)} className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 transition hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm">Declined</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={10} className="px-5 py-12 text-center text-sm font-bold text-gray-500">No offer records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3 lg:hidden">
                {filteredOffers.length > 0 ? filteredOffers.map((offer) => (
                  <button key={offer.id} type="button" onClick={() => setSelectedOffer(offer)} className="w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-sibs-primary-1/40 hover:bg-[#FAFBFC]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-sibs-primary-1">{offer.offerId}</p>
                        <h3 className="mt-1 text-sm font-bold text-[#101828]">{offer.candidateName}</h3>
                        <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">{offer.roleTitle} / {offer.account}</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(offer.status)}`}>{offer.status}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-[#F8FAFC] p-3"><p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">Basic Pay</p><p className="mt-1 text-xs font-bold text-[#344054]">{formatCurrency(offer.basicPay)}</p></div>
                      <div className="rounded-xl bg-[#F8FAFC] p-3"><p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">Deminimis</p><p className="mt-1 text-xs font-bold text-[#344054]">{formatCurrency(offer.deminimisDailyRate)}</p></div>
                    </div>
                  </button>
                )) : <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">No offer records found.</div>}
              </div>

              <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <p className="text-sm font-semibold text-sibs-tertiary-5">Showing {filteredOffers.length} of {offerList.length} offer records</p>
                <div className="flex items-center gap-2">
                  <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50"><ChevronLeft size={16} /></button>
                  <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg bg-sibs-primary-1 text-sm font-bold text-white">1</button>
                  <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50"><ChevronRight size={16} /></button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-blue-100 bg-blue-50 p-5">
            <h3 className="text-sm font-bold text-sibs-primary-1">Offer Process Rule</h3>
            <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">Candidate Pipeline moves qualified candidates to Offered. This page approves the offer, sends the contract email, and records the candidate response. Accepted responses move the candidate to Accepted; declined responses move the candidate to Drop-off with a reason.</p>
          </section>
        </div>
      </main>

      <OfferDetailsModal open={!!selectedOffer} offer={selectedOffer} onClose={() => setSelectedOffer(null)} />
      <DeclineResponseModal open={!!declineOffer} offer={declineOffer} form={declineForm} setForm={setDeclineForm} onClose={closeDeclineModal} onSubmit={handleCandidateDecline} />
      <ConfirmationDialog />
    </div>
  );
}
