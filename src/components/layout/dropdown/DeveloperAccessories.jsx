import React from "react";

/**
 * Developer accessories share MR. SIBS's unchanged header/hover layout.
 * The crown is deliberately only used for MR. SIBS (6784).
 * All six developer symbols are served from exactly the same artwork used
 * in the included visual proof/preview, avoiding SVG/mockup drift.
 */
export function MrSibsCrown({ className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 20"
      className={`${className} drop-shadow-[0_2px_3px_rgba(180,83,9,0.45)]`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="mrSibsCrownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="mrSibsBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>

      {/* Main Crown Body with 3 Peaks */}
      <path
        d="M2.5 15.5 C 7 14, 17 14, 21.5 15.5 L 20 6 L 14.5 11 L 12 2.5 L 9.5 11 L 4 6 Z"
        fill="url(#mrSibsCrownGrad)"
        stroke="#B45309"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />

      {/* Crown Base Arc */}
      <path
        d="M2.5 15.5 C 7 14, 17 14, 21.5 15.5 L 21 17.5 C 17 16, 7 16, 3 17.5 Z"
        fill="url(#mrSibsBaseGrad)"
      />

      {/* Golden Spheres on the 3 Peaks */}
      <circle cx="4" cy="6" r="1.5" fill="#FEF08A" stroke="#B45309" strokeWidth="0.5" />
      <circle cx="12" cy="2.5" r="1.8" fill="#FFFBEB" stroke="#B45309" strokeWidth="0.5" />
      <circle cx="20" cy="6" r="1.5" fill="#FEF08A" stroke="#B45309" strokeWidth="0.5" />

      {/* Center 4-Point Star Sparkle */}
      <path
        d="M12 8 C 12 10.2, 10.5 11.5, 8.5 11.5 C 10.5 11.5, 12 12.8, 12 15 C 12 12.8, 13.5 11.5, 15.5 11.5 C 13.5 11.5, 12 10.2, 12 8 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

const DEV_ACCESSORY_FILES = Object.freeze({
  engineer: "/assets/avatar-accessories/6496_engineer.svg",
  backend_god: "/assets/avatar-accessories/6495_backend.svg",
  queen_manager: "/assets/avatar-accessories/6099_manager.svg",
  gambler: "/assets/avatar-accessories/6892_gambler.svg",
  sleeper: "/assets/avatar-accessories/6890_sleeper.svg",
  carziqo_donater: "/assets/avatar-accessories/6891_carziqo.svg",
});

export function DeveloperAccessory({ accessoryKey, className = "h-4 w-4" }) {
  if (accessoryKey === "mrsibs") {
    return <MrSibsCrown className={className} />;
  }

  const src = DEV_ACCESSORY_FILES[accessoryKey];
  if (!src) return null;

  return <img src={src} className={`${className} object-contain drop-shadow-[0_2px_3px_rgba(4,44,81,0.22)]`} alt="" draggable={false} />;
}
