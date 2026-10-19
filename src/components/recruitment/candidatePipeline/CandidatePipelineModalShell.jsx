import React, { useEffect, useMemo, useRef, useState } from "react";
import { History } from "lucide-react";

import { useCandidatePipeline } from "../../../services/context/CandidatePipelineContext";
import CandidateMovementHistoryDrawer, {
  getMovementHistoryItems,
} from "./CandidateMovementHistoryDrawer";
import ModalShell from "../../ui/ModalShell";

const PRIMARY_VARIANTS = {
  orange: "bg-sibs-orange hover:bg-sibs-orange-deep focus-visible:ring-sibs-orange/20",
  navy: "bg-sibs-navy hover:bg-sibs-navy/90 focus-visible:ring-sibs-navy/20",
  emerald: "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500/20",
  red: "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500/20",
};

export function CandidateModalPrimaryButton({
  children,
  className = "",
  variant = "orange",
  icon = null,
  ...props
}) {
  const variantClass = PRIMARY_VARIANTS[variant] || PRIMARY_VARIANTS.orange;

  return (
    <button
      {...props}
      className={`sibs-modal-btn-primary w-full sm:w-auto justify-center gap-2 ${variant !== "orange" ? variantClass : ""} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

export function CandidateModalSecondaryButton({
  children,
  className = "",
  ...props
}) {
  return (
    <button
      {...props}
      className={`sibs-modal-btn-secondary w-full sm:w-auto justify-center gap-2 ${className}`}
    >
      {children}
    </button>
  );
}

export function CandidateModalSection({
  title,
  subtitle = "",
  children,
  className = "",
  headerAction = null,
  icon = null,
}) {
  return (
    <section
      className={`sibs-card p-3.5 sm:p-4 2xl:p-4.5 ${className}`}
    >
      {title || subtitle ? (
        <div className="mb-3.5 flex flex-col gap-3 border-b border-sibs-border pb-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-2.5">
            {icon ? (
              <span className="sibs-tone-navy-icon inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]">
                {icon}
              </span>
            ) : null}
            <div className="min-w-0 pt-0.5">
              {title ? (
                <h3 className="sibs-modal-section-title text-sibs-navy">
                  {title}
                </h3>
              ) : null}
              {subtitle ? (
                <p className="sibs-modal-section-subtitle mt-0.5 text-sibs-muted">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          {headerAction ? (
            <div className="shrink-0 sm:pt-0.5">{headerAction}</div>
          ) : null}
        </div>
      ) : null}

      {children}
    </section>
  );
}

function getCandidateIdentity(candidate = {}) {
  return String(
    candidate.dbId ||
      candidate.id ||
      candidate.pipelineId ||
      candidate.pipeline_id ||
      candidate.candidateId ||
      candidate.candidate_id ||
      candidate.candidateApplicationId ||
      candidate.candidate_application_id ||
      "",
  );
}

export default function CandidatePipelineModalShell({
  icon: Icon,
  title,
  subtitle,
  badge = "",
  onClose,
  closeDisabled = false,
  maxWidth = "max-w-2xl",
  zIndex = "z-[10000]",
  footer = null,
  children,
  closeOnBackdrop = false,
  headerContent = null,
  movementHistoryCandidate = null,
  showMovementHistory = undefined,
  onBeforeOpenMovementHistory = null,
}) {
  const movementTriggerRef = useRef(null);
  const [movementHistoryOpen, setMovementHistoryOpen] = useState(false);
  const [movementHistoryRefreshing, setMovementHistoryRefreshing] = useState(false);
  const [realtimeCandidate, setRealtimeCandidate] = useState(null);
  const lastHistoryCandidateIdRef = useRef("");

  const pipeline = useCandidatePipeline();
  const selectedCandidate = pipeline?.selectedCandidate || null;

  const candidateForMovementHistory =
    realtimeCandidate || movementHistoryCandidate || selectedCandidate || {};

  const movementHistoryEnabled =
    showMovementHistory === undefined
      ? Boolean(getCandidateIdentity(candidateForMovementHistory))
      : Boolean(showMovementHistory);

  const movementHistoryItems = useMemo(
    () => getMovementHistoryItems(candidateForMovementHistory),
    [candidateForMovementHistory],
  );

  // Updating the same candidate during realtime stage movement must NOT dismiss
  // an open history panel. Reset only when the selected candidate really changes.
  useEffect(() => {
    const incoming = movementHistoryCandidate || selectedCandidate || null;
    const incomingId = getCandidateIdentity(incoming || {});
    const isDifferentCandidate = lastHistoryCandidateIdRef.current !== incomingId;
    lastHistoryCandidateIdRef.current = incomingId;
    setRealtimeCandidate((current) => {
      if (isDifferentCandidate || !current) return incoming;
      return incoming ? { ...current, ...incoming } : null;
    });
    if (isDifferentCandidate) setMovementHistoryOpen(false);
  }, [movementHistoryCandidate, selectedCandidate]);

  useEffect(() => {
    if (!movementHistoryEnabled) return undefined;

    function handleCandidateUpdate(event) {
      const incoming =
        event?.detail?.candidate || event?.detail?.data?.candidate || null;

      if (!incoming || typeof incoming !== "object") return;

      const currentIdentity = getCandidateIdentity(candidateForMovementHistory);
      const incomingIdentity = getCandidateIdentity(incoming);

      if (
        currentIdentity &&
        incomingIdentity &&
        String(currentIdentity) !== String(incomingIdentity)
      ) {
        return;
      }

      setRealtimeCandidate((current) => ({
        ...(current || candidateForMovementHistory),
        ...incoming,
      }));
    }

    window.addEventListener("ta-pipeline-candidates-updated", handleCandidateUpdate);
    window.addEventListener("ta-interview-schedule-updated", handleCandidateUpdate);

    return () => {
      window.removeEventListener(
        "ta-pipeline-candidates-updated",
        handleCandidateUpdate,
      );
      window.removeEventListener(
        "ta-interview-schedule-updated",
        handleCandidateUpdate,
      );
    };
  }, [candidateForMovementHistory, movementHistoryEnabled]);

  async function handleMovementHistoryToggle() {
    if (movementHistoryOpen) {
      setMovementHistoryOpen(false);
      return;
    }

    if (movementHistoryRefreshing) return;

    let refreshedCandidate = null;

    if (typeof onBeforeOpenMovementHistory === "function") {
      setMovementHistoryRefreshing(true);

      try {
        refreshedCandidate =
          await onBeforeOpenMovementHistory(
            candidateForMovementHistory,
          );
      } catch (error) {
        console.error(
          "Refresh Movement History candidate error:",
          error,
        );
      } finally {
        setMovementHistoryRefreshing(false);
      }
    }

    if (
      refreshedCandidate &&
      typeof refreshedCandidate === "object"
    ) {
      setRealtimeCandidate((current) => ({
        ...(current || candidateForMovementHistory),
        ...refreshedCandidate,
      }));
    }

    setMovementHistoryOpen(true);
  }

  const movementHistoryAction = movementHistoryEnabled ? (
    <button
      ref={movementTriggerRef}
      type="button"
      onClick={handleMovementHistoryToggle}
      disabled={movementHistoryRefreshing}
      aria-busy={movementHistoryRefreshing || undefined}
      aria-expanded={movementHistoryOpen}
      aria-label={
        movementHistoryOpen
          ? "Close Movement History"
          : `Open Movement History, ${movementHistoryItems.length} records`
      }
      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-[10px] border px-2.5 text-[9px] font-extrabold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sibs-orange/40 2xl:h-8.5 2xl:text-[10px] ${
        movementHistoryOpen
          ? "border-orange-300/70 bg-white/10 shadow-[0_0_14px_rgba(255,92,40,0.16)]"
          : "border-white/15 bg-white/[0.06] hover:border-orange-300/55 hover:bg-white/10"
      }`}
    >
      <History size={12} className="text-sibs-orange" />
      <span className="hidden sm:inline">Movement History</span>
      <span>({movementHistoryItems.length})</span>
    </button>
  ) : null;

  return (
    <>
      <ModalShell
        open={true}
        onClose={onClose}
        title={headerContent ? null : title}
        subtitle={headerContent ? null : subtitle}
        icon={headerContent ? null : Icon}
        badge={headerContent ? null : badge}
        maxWidth={maxWidth}
        zIndex={zIndex}
        footer={footer}
        closeOnBackdrop={closeOnBackdrop}
        hideCloseButton={closeDisabled}
        variant="navy"
        headerActions={movementHistoryAction}
        headerMeta={headerContent}
        className="rounded-[14px]"
        headerClassName="bg-sibs-navy"
        bodyClassName="bg-sibs-surface p-3 sm:p-4 2xl:p-5"
        closeButtonClassName="sibs-modal-close-btn"
      >
        <div data-dropdown-boundary="true">
          {children}
        </div>
      </ModalShell>

      {movementHistoryEnabled && movementHistoryOpen ? (
        <CandidateMovementHistoryDrawer
          open={movementHistoryOpen}
          candidate={candidateForMovementHistory}
          onClose={() => setMovementHistoryOpen(false)}
          triggerRef={movementTriggerRef}
        />
      ) : null}
    </>
  );
}
