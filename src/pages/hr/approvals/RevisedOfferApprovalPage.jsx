import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FileCheck, AlertCircle } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  approveRevisedOffer,
  getRevisedOfferApproval,
  rejectRevisedOffer,
} from "../../../lib/axios/candidateOfferRevisions";

const peso = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function RevisedOfferApprovalPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    getRevisedOfferApproval(token)
      .then((r) => setData(r.approval))
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function approve() {
    setBusy(true);
    setError("");
    try {
      const r = await approveRevisedOffer(token);
      setMessage(r.message);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRejectConfirm() {
    if (!rejectionReason.trim()) return;
    setBusy(true);
    setError("");
    try {
      const r = await rejectRevisedOffer(token, rejectionReason.trim());
      setMessage(r.message);
      setRejectModalOpen(false);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-sibs-canvas text-sm font-bold text-sibs-navy font-jakarta">
        <div className="flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-sibs-orange border-t-transparent" />
          <span>Loading revised offer...</span>
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="grid min-h-screen place-items-center bg-sibs-canvas p-6 font-jakarta">
        <div className="max-w-md rounded-[14px] border border-sibs-border bg-white p-6 text-center shadow">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[10px] bg-red-50 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="font-heading text-lg font-extrabold text-red-700">
            Unable to Open Approval
          </h1>
          <p className="mt-2 text-sm text-sibs-muted">{error}</p>
        </div>
      </main>
    );
  }

  const c = data?.currentOffer || {};
  const r = data?.revisedOffer || {};

  return (
    <main className="min-h-screen bg-sibs-canvas p-6 font-jakarta">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-[14px] border border-sibs-border bg-white shadow-xl">
        <header className="rounded-t-[14px] bg-sibs-navy p-6 text-white">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white/10 text-white">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-white/70">
                SiBS HRIS Approval
              </p>
              <h1 className="mt-1 font-heading text-2xl font-extrabold text-white">
                Revised Offer Review
              </h1>
              <p className="mt-0.5 text-sm text-white/80">
                {data?.candidate?.name}
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[10px] border border-sibs-border bg-sibs-canvas p-4">
              <h2 className="font-heading text-xs font-extrabold uppercase text-sibs-muted">
                Current Compensation
              </h2>
              <p className="mt-3 text-sm font-bold text-sibs-navy">
                Basic Daily Rate: {peso(c.basicDailyRate)}
              </p>
              <p className="mt-2 text-sm font-bold text-sibs-navy">
                Daily De Minimis: {peso(c.dailyDeMinimis)}
              </p>
            </div>

            <div className="rounded-[10px] border border-sibs-orange/30 bg-sibs-orange/5 p-4">
              <h2 className="font-heading text-xs font-extrabold uppercase text-sibs-orange">
                Proposed Compensation
              </h2>
              <p className="mt-3 text-sm font-bold text-sibs-navy">
                Basic Daily Rate: {peso(r.basicDailyRate)}
              </p>
              <p className="mt-2 text-sm font-bold text-sibs-navy">
                Daily De Minimis: {peso(r.dailyDeMinimis)}
              </p>
            </div>
          </div>

          {r.remarks && (
            <div className="rounded-[10px] border border-sibs-border p-4">
              <p className="font-heading text-xs font-extrabold uppercase text-sibs-muted">
                Recruiter remarks
              </p>
              <p className="mt-2 text-sm font-semibold text-sibs-text-secondary">
                {r.remarks}
              </p>
            </div>
          )}

          {message && (
            <p className="rounded-[10px] border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              {message}
            </p>
          )}

          {error && (
            <p className="rounded-[10px] border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={busy || !!message}
              onClick={() => setRejectModalOpen(true)}
              className="h-11 rounded-[10px] border border-red-200 px-5 text-sm font-extrabold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reject
            </button>
            <button
              type="button"
              disabled={busy || !!message}
              onClick={approve}
              className="h-11 rounded-[10px] bg-sibs-navy px-5 text-sm font-extrabold text-white transition hover:bg-sibs-button-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Processing..." : "Approve Revised Offer"}
            </button>
          </div>
        </div>
      </section>

      <ConfirmModal
        open={rejectModalOpen}
        title="Reject Revised Offer?"
        subtitle={data?.candidate?.name || "Revised Offer"}
        description="Please provide the reason for rejecting this revised offer."
        confirmLabel={busy ? "Rejecting..." : "Reject Offer"}
        cancelLabel="Cancel"
        variant="danger"
        loading={busy}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleRejectConfirm}
      >
        <div className="mt-3">
          <label className="block text-xs font-bold uppercase text-sibs-muted mb-1">
            Rejection Reason *
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter reason for rejection..."
            rows={3}
            className="w-full rounded-[10px] border border-sibs-border bg-white px-3 py-2 text-sm text-sibs-navy placeholder:text-sibs-muted focus:border-sibs-orange focus:outline-none"
          />
        </div>
      </ConfirmModal>
    </main>
  );
}
