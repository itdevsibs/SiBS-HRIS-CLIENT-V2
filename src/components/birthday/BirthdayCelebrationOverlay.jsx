import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X } from "lucide-react";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion.js";

const RainbowConfettiCanvas = lazy(
  () => import("./RainbowConfettiCanvas.jsx"),
);

export default function BirthdayCelebrationOverlay({ firstName = "", onDismiss }) {
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const dismissTimerRef = useRef(null);
  const exitTimerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(5000);

  const cleanFirstName = String(firstName || "").trim();
  const titleText = cleanFirstName
    ? `HAPPY BIRTHDAY, ${cleanFirstName.toUpperCase()}!`
    : "HAPPY BIRTHDAY!";

  const handleClose = () => {
    if (isExiting) return;
    setIsExiting(true);
    exitTimerRef.current = window.setTimeout(() => {
      onDismiss?.();
    }, 220);
  };

  useEffect(() => {
    if (isExiting) return;

    if (isPaused) {
      if (dismissTimerRef.current) {
        window.clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
      return;
    }

    startTimeRef.current = Date.now();
    dismissTimerRef.current = window.setTimeout(() => {
      handleClose();
    }, remainingTimeRef.current);

    return () => {
      if (dismissTimerRef.current) {
        window.clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    };
  }, [isExiting, isPaused]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onDismiss?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    remainingTimeRef.current = Math.max(
      1000,
      remainingTimeRef.current - (Date.now() - startTimeRef.current),
    );
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const overlayContent = (
    <div
      role="status"
      aria-live="polite"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#042C51]/92 p-4 font-jakarta backdrop-blur-sm transition-opacity ${
        isExiting ? "sibs-birthday-overlay-out" : "sibs-birthday-overlay-in"
      }`}
    >
      <span className="sr-only">
        {cleanFirstName
          ? `Happy Birthday, ${cleanFirstName}! Wishing you a wonderful day from SiBS.`
          : "Happy Birthday! Wishing you a wonderful day from SiBS."}
      </span>

      {!prefersReducedMotion ? (
        <Suspense fallback={null}>
          <RainbowConfettiCanvas />
        </Suspense>
      ) : (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-12 left-12 h-3 w-3 rounded-full bg-[#FF5C28] opacity-70" />
          <div className="absolute top-24 right-16 h-4 w-4 rounded-sm bg-[#FFB020] opacity-70" />
          <div className="absolute bottom-20 left-20 h-4 w-4 rounded-full bg-[#38BDF8] opacity-70" />
          <div className="absolute bottom-16 right-24 h-3 w-3 rounded-sm bg-[#34D399] opacity-70" />
        </div>
      )}

      {/* Top right Skip button */}
      <button
        type="button"
        onClick={handleClose}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label="Skip birthday celebration"
        className="absolute top-5 right-5 z-20 flex h-11 min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 text-xs font-bold text-white shadow-sm backdrop-blur-md transition hover:border-white/40 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C28]"
      >
        <span>Skip</span>
        <X size={15} />
      </button>

      {/* Center Card */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="sibs-birthday-message-in relative z-20 mx-auto max-w-lg text-center"
      >
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-gradient-to-tr from-[#FF5C28] to-[#FF8C66] text-white shadow-lg shadow-[#FF5C28]/30">
          <Sparkles size={24} className="animate-pulse" />
        </div>

        <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-md sm:text-4xl">
          {titleText}
        </h1>

        <p className="mt-3 text-sm font-semibold text-white/90 drop-shadow sm:text-base">
          Wishing you the happiest day from everyone at SiBS!
        </p>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#FF5C28] px-6 text-xs font-extrabold text-white shadow-md shadow-[#FF5C28]/40 transition hover:bg-[#ff480e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Thank You!
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(overlayContent, document.body);
}
