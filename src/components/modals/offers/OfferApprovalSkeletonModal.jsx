import React from "react";
import { createPortal } from "react-dom";

function SkeletonBlock({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-slate-200 ${className}`}
    />
  );
}

export default function OfferApprovalSkeletonModal({
  open,
  candidateName = "",
}) {
  if (!open || typeof document === "undefined") return null;

  const cleanCandidateName = String(candidateName || "").trim();

  return createPortal(
    <div
      className="pointer-events-auto fixed inset-0 z-[12050] flex h-dvh items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Approving offer"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <div className="border-b border-[#E6ECF2] px-6 py-5">
          <div className="flex items-center gap-4">
            <SkeletonBlock className="h-12 w-12 shrink-0 rounded-full bg-emerald-100" />

            <div className="min-w-0 flex-1 space-y-2.5">
              <SkeletonBlock className="h-4 w-40" />
              <SkeletonBlock className="h-3 w-64 max-w-full" />
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-6">
          <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
            <div className="flex items-center justify-between gap-4">
              <SkeletonBlock className="h-3 w-28" />
              <SkeletonBlock className="h-7 w-20 rounded-full bg-emerald-100" />
            </div>

            <div className="mt-5 space-y-3">
              <SkeletonBlock className="h-3 w-full" />
              <SkeletonBlock className="h-3 w-5/6" />
              <SkeletonBlock className="h-3 w-2/3" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SkeletonBlock className="h-12 w-full" />
            <SkeletonBlock className="h-12 w-full bg-emerald-100" />
          </div>

          <div className="pt-1 text-center">
            <p className="text-sm font-extrabold text-sibs-primary-1">
              Approving offer
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              {cleanCandidateName
                ? `Saving ${cleanCandidateName}'s approval and preparing the candidate email.`
                : "Saving the approval and preparing the candidate email."}
            </p>

            <p className="mt-2 text-[11px] font-bold text-slate-400">
              Please keep this window open.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
