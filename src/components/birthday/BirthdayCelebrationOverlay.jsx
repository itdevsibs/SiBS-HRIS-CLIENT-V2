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
  const remainingTimeRef = useRef(7000); // 7s so user can enjoy floating lechon & cake

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
      1500,
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
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#042C51]/92 p-4 font-jakarta backdrop-blur-md transition-opacity ${
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

      {/* Floating Lechon (Crispy Whole Roasted Pig) on Bottom-Left */}
      <div className="sibs-float-slow pointer-events-none absolute bottom-6 left-4 z-20 w-44 sm:bottom-10 sm:left-10 sm:w-60 md:w-72 drop-shadow-[0_25px_35px_rgba(0,0,0,0.7)]">
        <div className="relative rounded-2xl border-2 border-amber-400/50 bg-[#042C51]/60 p-1.5 shadow-2xl backdrop-blur-sm">
          <img
            src="/assets/birthday/lechon.png"
            alt="Crispy Lechon"
            className="h-28 w-full rounded-xl object-contain sm:h-36 md:h-44"
          />
          <div className="mt-1 flex items-center justify-center gap-1 rounded-lg bg-amber-500/20 py-0.5 text-center text-[10px] font-black uppercase tracking-wider text-amber-300 sm:text-xs">
            <span>Crispy Lechon</span>
            <span>🍖🔥</span>
          </div>
        </div>
      </div>

      {/* Floating Birthday Cake with Candle & Sardine on Bottom-Right */}
      <div className="sibs-float-reverse pointer-events-none absolute bottom-6 right-4 z-20 w-40 sm:bottom-10 sm:right-10 sm:w-56 md:w-64 drop-shadow-[0_25px_35px_rgba(0,0,0,0.7)]">
        <div className="relative rounded-2xl border-2 border-yellow-400/50 bg-[#042C51]/60 p-1.5 shadow-2xl backdrop-blur-sm">
          <img
            src="/assets/birthday/bday-cake.png"
            alt="Birthday Cake with Candle"
            className="h-28 w-full rounded-xl object-contain sm:h-36 md:h-44"
          />
          <div className="mt-1 flex items-center justify-center gap-1 rounded-lg bg-yellow-500/20 py-0.5 text-center text-[10px] font-black uppercase tracking-wider text-yellow-300 sm:text-xs">
            <span>Special B-Day Cake</span>
            <span>🎂🕯️</span>
          </div>
        </div>
      </div>

      {/* Floating Lechon Bread with Piglets on Top-Left */}
      <div className="sibs-float-gentle pointer-events-none absolute top-14 left-4 z-20 hidden w-36 sm:block sm:top-16 sm:left-12 sm:w-48 md:w-52 drop-shadow-[0_25px_35px_rgba(0,0,0,0.7)]">
        <div className="relative rounded-2xl border-2 border-orange-400/40 bg-[#042C51]/60 p-1.5 shadow-2xl backdrop-blur-sm">
          <img
            src="/assets/birthday/lechon-bread.png"
            alt="Lechon Bread"
            className="h-24 w-full rounded-xl object-contain sm:h-28 md:h-32"
          />
          <div className="mt-1 flex items-center justify-center gap-1 rounded-lg bg-orange-500/20 py-0.5 text-center text-[9px] font-black uppercase tracking-wider text-orange-200 sm:text-[10px]">
            <span>Lechon Bread</span>
            <span>🍞✨</span>
          </div>
        </div>
      </div>

      {/* Top right Skip button */}
      <button
        type="button"
        onClick={handleClose}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label="Skip birthday celebration"
        className="absolute top-5 right-5 z-30 flex h-11 min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/25 bg-white/15 px-4 text-xs font-black text-white shadow-lg backdrop-blur-md transition hover:border-white/50 hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C28]"
      >
        <span>Skip</span>
        <X size={16} />
      </button>

      {/* Center Card */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="sibs-birthday-message-in relative z-20 mx-auto max-w-lg rounded-3xl border border-white/20 bg-gradient-to-b from-white/15 to-white/5 p-6 text-center shadow-2xl backdrop-blur-xl sm:p-8"
      >
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-gradient-to-tr from-[#FF5C28] to-[#FF8C66] text-white shadow-xl shadow-[#FF5C28]/40">
          <Sparkles size={28} className="animate-pulse" />
        </div>

        <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-lg sm:text-4xl">
          {titleText}
        </h1>

        <p className="mt-3 text-sm font-bold text-white/95 drop-shadow sm:text-base">
          Wishing you the happiest day from everyone at SiBS!
        </p>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#FF5C28] px-8 text-sm font-black text-white shadow-xl shadow-[#FF5C28]/50 transition hover:bg-[#ff480e] hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Salamat po! 🎉
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(overlayContent, document.body);
}
