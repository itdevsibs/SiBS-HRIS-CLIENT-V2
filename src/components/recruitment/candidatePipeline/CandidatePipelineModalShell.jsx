import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { History, X } from "lucide-react";

import { useCandidatePipeline } from "../../../services/context/CandidatePipelineContext";
import CandidateMovementHistoryDrawer, {
  getMovementHistoryItems,
} from "./CandidateMovementHistoryDrawer";

const PRIMARY_VARIANTS = {
  orange: "bg-[#FF5C28] hover:bg-[#E94F1F] focus-visible:ring-[#FF5C28]/20",
  navy: "bg-[#042C51] hover:bg-[#063C69] focus-visible:ring-[#042C51]/20",
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
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-xs font-extrabold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${className}`}
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
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D6E0EA] bg-white px-4 text-xs font-extrabold text-sibs-primary-1 transition hover:border-[#FF5C28]/35 hover:bg-[#FFF8F5] hover:text-[#FF5C28] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#042C51]/10 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
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
      className={`rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-[0_8px_22px_rgba(4,44,81,0.04)] ${className}`}
    >
      {title || subtitle ? (
        <div className="mb-4 flex flex-col gap-3 border-b border-[#EEF2F6] pb-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-2.5">
            {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
            <div className="min-w-0">
              {title ? (
                <h3 className="text-sm font-extrabold text-[#042C51]">
                  {title}
                </h3>
              ) : null}
              {subtitle ? (
                <p className="mt-0.5 text-[10px] font-semibold leading-4 text-[#667085] sm:text-xs sm:leading-5">
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
}) {
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const movementTriggerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);
  const movementHistoryOpenRef = useRef(false);
  const [movementHistoryOpen, setMovementHistoryOpen] = useState(false);
  const [realtimeCandidate, setRealtimeCandidate] = useState(null);

  const pipeline = useCandidatePipeline();
  const selectedCandidate = pipeline?.selectedCandidate || null;

  onCloseRef.current = onClose;
  closeDisabledRef.current = closeDisabled;
  movementHistoryOpenRef.current = movementHistoryOpen;

  const reactId = useId();
  const titleId = `candidate-pipeline-modal-title-${String(reactId).replace(/:/g, "")}`;

  const candidateForMovementHistory =
    realtimeCandidate || movementHistoryCandidate || selectedCandidate || {};

  const movementHistoryEnabled =
    showMovementHistory === undefined
      ? Boolean(headerContent && getCandidateIdentity(candidateForMovementHistory))
      : Boolean(showMovementHistory);

  const movementHistoryItems = useMemo(
    () => getMovementHistoryItems(candidateForMovementHistory),
    [candidateForMovementHistory],
  );

  useEffect(() => {
    setRealtimeCandidate(movementHistoryCandidate || selectedCandidate || null);
    setMovementHistoryOpen(false);
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

  useEffect(() => {
    openerRef.current = document.activeElement;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const dialog = dialogRef.current;
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    window.requestAnimationFrame(() => {
      const firstFocusable = dialog?.querySelector(focusableSelector);
      (firstFocusable || dialog)?.focus?.();
    });

    function handleKeydown(event) {
      if (!dialog || !dialog.contains(document.activeElement)) return;

      if (event.key === "Escape") {
        if (movementHistoryOpenRef.current) {
          event.preventDefault();
          setMovementHistoryOpen(false);
          window.requestAnimationFrame(() => movementTriggerRef.current?.focus?.());
          return;
        }

        if (!closeDisabledRef.current) {
          event.preventDefault();
          onCloseRef.current?.();
        }
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(dialog.querySelectorAll(focusableSelector)).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-hidden") !== "true" &&
          element.getAttribute("tabindex") !== "-1",
      );

      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.body.style.overflow = previousBodyOverflow;

      const opener = openerRef.current;
      if (
        opener &&
        typeof opener.focus === "function" &&
        document.contains(opener)
      ) {
        window.requestAnimationFrame(() => opener.focus());
      }
    };
  }, []);

  function handleBackdrop(event) {
    if (!closeOnBackdrop || closeDisabled) return;
    if (event.target === event.currentTarget) onClose?.();
  }

  return (
    <div
      className={`sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 ${zIndex} flex h-dvh items-center justify-center px-2 py-2 font-jakarta sm:px-4 sm:py-4`}
      onMouseDown={handleBackdrop}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`sibs-modal-pop-in flex max-h-[88vh] w-full ${maxWidth} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl max-sm:max-h-[calc(100dvh-1rem)]`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="shrink-0 bg-[#042C51] px-5 py-4 text-white sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              {headerContent ? (
                <>
                  <h2 id={titleId} className="sr-only">
                    {title}
                  </h2>
                  {headerContent}
                </>
              ) : (
                <div className="flex min-w-0 items-center gap-3">
                  {Icon ? (
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF5C28] text-white shadow-sm">
                      <Icon size={17} />
                    </span>
                  ) : null}

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2
                        id={titleId}
                        className="truncate text-sm font-extrabold text-white sm:text-base"
                      >
                        {title}
                      </h2>

                      {badge ? (
                        <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-wide text-white/90 sm:text-[9px]">
                          {badge}
                        </span>
                      ) : null}
                    </div>

                    {subtitle ? (
                      <p className="mt-1 truncate text-[10px] font-semibold text-white/65 sm:text-xs">
                        {subtitle}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {movementHistoryEnabled ? (
                <button
                  ref={movementTriggerRef}
                  type="button"
                  onClick={() => setMovementHistoryOpen(true)}
                  aria-expanded={movementHistoryOpen}
                  aria-label={`Open Movement History, ${movementHistoryItems.length} records`}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-[#063560] px-3 text-[9px] font-extrabold text-white shadow-sm transition hover:border-[#FF5C28]/60 hover:bg-[#0D4676] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C28]/40 sm:h-9 sm:px-3.5 sm:text-[10px]"
                >
                  <History size={13} className="text-[#FF5C28]" />
                  <span className="hidden sm:inline">Movement History</span>
                  <span>({movementHistoryItems.length})</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={onClose}
                disabled={closeDisabled}
                className="sibs-modal-close-btn"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#F7F9FC]">
          <div className="sibs-scrollbar max-h-[calc(88vh-130px)] overflow-y-auto overscroll-contain p-4 sm:p-5">
            {children}
          </div>

          {movementHistoryEnabled ? (
            <CandidateMovementHistoryDrawer
              open={movementHistoryOpen}
              candidate={candidateForMovementHistory}
              onClose={() => setMovementHistoryOpen(false)}
              triggerRef={movementTriggerRef}
            />
          ) : null}
        </div>

        {footer ? (
          <footer className="shrink-0 border-t border-[#E6ECF2] bg-white px-5 py-3.5 sm:px-6">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
