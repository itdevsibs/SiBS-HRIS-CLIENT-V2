import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion.js";

const RainbowConfettiCanvas = lazy(
  () => import("./RainbowConfettiCanvas.jsx"),
);

const DODGE_TEXTS = [
  "Salamat po! 🎉",
  "Oops, nahuli mo ba? 🏃‍♂️",
  "Hulihin mo ako! 🤪",
  "Dito ako! 😂",
  "Sobrang bilis ko! 💨",
  "Sige na nga, Happy Birthday! 🥳",
];

function useBlackBackgroundCutout(imageSrc, threshold = 28) {
  const [transparentSrc, setTransparentSrc] = useState(imageSrc);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Check if dark/black background pixel
          if (r <= threshold && g <= threshold && b <= threshold) {
            data[i + 3] = 0; // Alpha = 0 (Transparent)
          } else if (r <= threshold + 20 && g <= threshold + 20 && b <= threshold + 20) {
            // Smooth edge feathering
            const maxVal = Math.max(r, g, b);
            const alphaFactor = (maxVal - threshold) / 20;
            data[i + 3] = Math.floor(data[i + 3] * alphaFactor);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        setTransparentSrc(canvas.toDataURL("image/png"));
      } catch {
        // Fallback to original
      }
    };
  }, [imageSrc, threshold]);

  return transparentSrc;
}

export default function BirthdayCelebrationOverlay({ firstName = "", onDismiss }) {
  const [isExiting, setIsExiting] = useState(false);
  const [btnPos, setBtnPos] = useState({ x: 0, y: 0 });
  const [dodgeCount, setDodgeCount] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Dynamically remove black background from lechon image
  const transparentLechonSrc = useBlackBackgroundCutout("/assets/birthday/lechon.png", 28);

  const exitTimerRef = useRef(null);

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

  const handleButtonDodge = () => {
    if (prefersReducedMotion) return;
    if (dodgeCount >= 5) return; // Stop running away after 5 dodges so user can click it!

    // Random dodge offset
    const maxOffset = Math.min(window.innerWidth * 0.35, 260);
    const maxYOffset = Math.min(window.innerHeight * 0.25, 160);

    const randomX = (Math.random() - 0.5) * maxOffset * 2;
    const randomY = (Math.random() - 0.5) * maxYOffset * 2;

    setBtnPos({ x: randomX, y: randomY });
    setDodgeCount((c) => c + 1);
  };

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  const buttonLabel =
    DODGE_TEXTS[Math.min(dodgeCount, DODGE_TEXTS.length - 1)];

  const overlayContent = (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#042C51]/90 p-4 font-jakarta backdrop-blur-md transition-opacity ${
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

      {/* Floating Pure PNG 1: Crispy Whole Roasted Lechon with Auto-Transparent Cutout */}
      <div className="sibs-drift-1 pointer-events-none absolute top-0 left-0 z-20 w-48 sm:w-64 md:w-80 select-none">
        <img
          src={transparentLechonSrc}
          alt="Crispy Lechon"
          className="w-full object-contain filter drop-shadow-[0_25px_35px_rgba(0,0,0,0.85)]"
        />
      </div>

      {/* Floating Pure PNG 2: Special Birthday Cake with Sardine & Candle Drifting */}
      <div className="sibs-drift-2 pointer-events-none absolute top-0 left-0 z-20 w-44 sm:w-56 md:w-64 select-none">
        <img
          src="/assets/birthday/bday-cake.png"
          alt="Birthday Cake with Candle"
          className="w-full object-contain rounded-3xl filter drop-shadow-[0_25px_35px_rgba(0,0,0,0.85)]"
        />
      </div>

      {/* Floating Pure PNG 3: Lechon Bread with Piglets Drifting */}
      <div className="sibs-drift-3 pointer-events-none absolute top-0 left-0 z-20 w-36 sm:w-48 md:w-56 select-none">
        <img
          src="/assets/birthday/lechon-bread.png"
          alt="Lechon Bread"
          className="w-full object-contain rounded-3xl filter drop-shadow-[0_25px_35px_rgba(0,0,0,0.85)]"
        />
      </div>

      {/* Floating Pure PNG 4: Bonus Flying Lechon Clone Drifting */}
      <div className="sibs-drift-4 pointer-events-none absolute top-0 left-0 z-20 hidden w-40 md:block md:w-52 select-none opacity-90">
        <img
          src={transparentLechonSrc}
          alt="Floating Lechon"
          className="w-full scale-x-[-1] object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
        />
      </div>

      {/* Center Birthday Message (Pure Floating Typography & Runaway Button) */}
      <div className="sibs-birthday-message-in relative z-30 mx-auto max-w-2xl text-center select-none">
        <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-[0_6px_16px_rgba(0,0,0,0.9)] sm:text-5xl md:text-6xl">
          {titleText}
        </h1>

        <p className="mt-4 text-base font-bold text-white/95 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] sm:text-xl">
          Wishing you the happiest day from everyone at SiBS!
        </p>

        {/* The Crazy Runaway Button */}
        <div className="relative mt-10 flex h-16 items-center justify-center">
          <button
            type="button"
            onClick={handleClose}
            onMouseEnter={handleButtonDodge}
            style={{
              transform: `translate(${btnPos.x}px, ${btnPos.y}px)`,
              transition: "transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
            className="inline-flex h-13 items-center justify-center whitespace-nowrap rounded-2xl bg-gradient-to-r from-[#FF5C28] via-[#FF7A45] to-[#FF5C28] px-9 text-base font-black text-white shadow-[0_15px_30px_rgba(255,92,40,0.6)] cursor-pointer transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(overlayContent, document.body);
}
