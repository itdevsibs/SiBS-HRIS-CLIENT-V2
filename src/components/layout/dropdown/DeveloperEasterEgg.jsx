import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import usePrefersReducedMotion from "../../../hooks/usePrefersReducedMotion.js";
import "./DeveloperEasterEgg.css";

// Static, theme-specific linework frames the supplied animation without adding
// another animation loop or loading another media asset.
const THEME_LINEWORK = {
  mrsibs: {
    flank: "M365 535 Q220 370 365 185 M321 472 Q262 472 270 426 Q310 426 321 472 M295 407 Q244 384 271 347 Q305 365 295 407 M298 335 Q258 294 294 267 Q321 298 298 335 M326 268 Q301 222 342 209 Q361 246 326 268",
    stage: "M390 180 A270 270 0 0 1 810 180 M350 490 A270 270 0 0 0 850 490 M600 72 V88 M600 632 V648 M312 360 H328 M872 360 H888",
    seal: "M84 20 L81 7 L91 13 L100 3 L109 13 L119 7 L116 20 Z M85 25 H115",
  },
  queen_manager: {
    flank: "M350 535 L245 360 L350 185 M315 485 L265 445 L279 393 L322 434 Z M267 360 L230 330 L267 300 L304 330 Z M315 251 L269 276 L283 224 L330 205 Z",
    stage: "M600 84 L876 360 L600 636 L324 360 Z M600 108 L852 360 L600 612 L348 360 Z M310 360 H290 M890 360 H910",
    seal: "M100 2 L114 14 L100 27 L86 14 Z M93 8 L100 21 L107 8 M73 14 Q80 5 86 14 Q80 23 73 14 M127 14 Q120 5 114 14 Q120 23 127 14",
  },
  engineer: {
    flank: "M365 560 L280 475 V245 L365 160 M300 505 H260 V455 M300 215 H260 V265 M280 300 H250 M280 340 H235 M280 380 H250 M280 420 H235 M350 185 L370 205 M350 535 L370 515",
    stage: "M340 240 V150 H430 M770 150 H860 V240 M340 480 V570 H430 M770 570 H860 V480 M352 240 V162 H430 M770 162 H848 V240 M352 480 V558 H430 M770 558 H848 V480",
    seal: "M83 8 H117 L111 16 H102 V22 H111 V26 H89 V22 H98 V16 H89 Z M94 3 H107",
  },
  backend_god: {
    flank: "M350 550 H285 V475 H245 V405 H285 V315 H245 V245 H350 M235 395 H255 V415 H235 Z M235 235 H255 V255 H235 Z M275 465 H295 V485 H275 Z M285 350 H225 V300 H195",
    stage: "M280 240 H350 L410 180 H480 M920 240 H850 L790 180 H720 M280 480 H350 L410 540 H480 M920 480 H850 L790 540 H720 M310 300 H380 M890 300 H820 M310 420 H380 M890 420 H820",
    seal: "M89 6 L79 14 L89 22 M111 6 L121 14 L111 22 M104 3 L96 25",
  },
  gambler: {
    flank: "M350 530 L265 450 L285 230 L350 220 M325 490 L290 450 L310 255 L350 250 M280 340 L298 365 L275 385 L257 360 Z M340 185 L352 200 L340 215 L328 200 Z",
    stage: "M600 85 L875 360 L600 635 L325 360 Z M600 105 L855 360 L600 615 L345 360 Z M300 350 L310 360 L300 370 L290 360 Z M900 350 L910 360 L900 370 L890 360 Z",
    seal: "M100 2 L112 14 L100 26 L88 14 Z M77 11 L80 14 L77 17 L74 14 Z M123 11 L126 14 L123 17 L120 14 Z",
  },
  sleeper: {
    flank: "M340 515 L265 425 L290 300 L355 210 M265 425 L230 355 M285 290 L290 300 L300 305 L290 310 L285 320 L280 310 L270 305 L280 300 Z M345 200 L350 215 L365 220 L350 225 L345 240 L340 225 L325 220 L340 215 Z",
    stage: "M740 140 A260 260 0 1 0 790 540 M750 166 A234 234 0 1 0 774 514 M841 199 L845 212 L858 216 L845 220 L841 233 L837 220 L824 216 L837 212 Z",
    seal: "M105 3 A12 12 0 1 0 112 23 A14 14 0 0 1 105 3 M120 5 V11 M117 8 H123",
  },
  carziqo_donater: {
    flank: "M190 505 H375 M230 480 H350 M165 455 H320 M220 430 H350 M275 405 H325 M225 260 H345 L385 220 M190 280 H320 M255 300 H345",
    stage: "M220 260 H360 L400 220 H510 M980 260 H840 L800 220 H690 M220 490 H400 M800 490 H980 M280 510 H460 M740 510 H920 M360 530 H520 M680 530 H840",
    seal: "M78 8 H93 L102 14 L93 20 H78 M99 8 L109 14 L99 20 M110 8 L120 14 L110 20",
  },
};

// Deterministic and shared: no random values during render, per-frame JS, or
// unbounded particle spawning. The first eight also cover the full mobile stage.
const PARTICLES = Array.from({ length: 24 }, (_, index) => {
  const angle = index * 2.399963;
  const radius = 24 + (index % 5) * 4;
  return {
    "--particle-x": `${(Math.cos(angle) * radius).toFixed(2)}vmin`,
    "--particle-y": `${(Math.sin(angle) * radius * .72).toFixed(2)}vmin`,
    "--particle-rotation": `${(index * 137) % 360}deg`,
    "--particle-delay": `${(index % 6) * 35}ms`,
    "--particle-size": `${2 + index % 3}px`,
  };
});

function showFinalFrame(video) {
  if (Number.isFinite(video.duration) && video.duration > 0) {
    video.currentTime = Math.max(0, video.duration - .05);
  }
}

function playMuted(video) {
  // Muted playback is permitted without an additional browser permission prompt.
  video.muted = true;
  video.play()?.catch(() => {});
}

export default function DeveloperEasterEgg({ collectible, onClose }) {
  const { title, easterEgg } = collectible;
  const linework = THEME_LINEWORK[collectible.accessoryKey] ?? THEME_LINEWORK.mrsibs;
  const overlayRef = useRef(null);
  const videoRef = useRef(null);
  const [showTitle, setShowTitle] = useState(false);
  const [finale, setFinale] = useState(false);
  const [exiting, setExiting] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const previousFocus = document.activeElement;
    const video = videoRef.current;
    overlayRef.current?.focus();
    overlayRef.current?.toggleAttribute("data-paused", document.hidden);
    if (reducedMotion || document.hidden) video.pause();
    if (reducedMotion) showFinalFrame(video);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      } else if (event.key === "Tab") {
        event.preventDefault();
        overlayRef.current?.focus();
      }
    };
    const syncVisibility = () => {
      overlayRef.current?.toggleAttribute("data-paused", document.hidden);
      if (document.hidden) video.pause();
      else if (!reducedMotion && !video.ended) playMuted(video);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      video.pause();
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", syncVisibility);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [onClose, reducedMotion]);

  // Hold the final composition, then dissolve it. Preserve the remaining time
  // across hidden tabs instead of closing the Easter egg while nobody sees it.
  useEffect(() => {
    if (!finale) return;
    let remaining = exiting ? 350 : Math.max(3000, easterEgg.endDelay ?? 0);
    let startedAt = 0;
    let timer = null;
    const syncTimer = () => {
      if (timer !== null) {
        window.clearTimeout(timer);
        remaining = Math.max(0, remaining - (Date.now() - startedAt));
        timer = null;
      }
      if (document.hidden) return;
      startedAt = Date.now();
      timer = window.setTimeout(() => {
        timer = null;
        if (exiting) onClose();
        else setExiting(true);
      }, remaining);
    };
    syncTimer();
    document.addEventListener("visibilitychange", syncTimer);
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", syncTimer);
    };
  }, [finale, exiting, onClose, easterEgg.endDelay]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <section ref={overlayRef} tabIndex={-1} className="developer-easter-egg" data-easter-egg-theme={collectible.accessoryKey}
      data-revealed={showTitle || reducedMotion ? "" : undefined}
      data-finale={finale ? "" : undefined}
      data-exiting={exiting ? "" : undefined}
      style={{ "--easter-egg-title": easterEgg.titleColor }}
      role="status" aria-label={`${title} Easter egg`} onClick={onClose}>
      <span className="sr-only">{title}. Press Escape or click to dismiss.</span>
      <svg className="developer-easter-egg-stage" viewBox="0 0 1200 720" aria-hidden="true" focusable="false">
        <path d={linework.stage} />
      </svg>
      <video
        ref={videoRef}
        className="developer-easter-egg-video"
        src={easterEgg.src}
        muted
        playsInline
        autoPlay={!reducedMotion}
        preload="auto"
        disablePictureInPicture
        onLoadedMetadata={(event) => { if (reducedMotion) showFinalFrame(event.currentTarget); }}
        onLoadedData={(event) => {
          overlayRef.current?.setAttribute("data-ready", "");
          if (!reducedMotion && !document.hidden) playMuted(event.currentTarget);
        }}
        onTimeUpdate={(event) => {
          const revealAt = easterEgg.revealAt ?? Math.max(0, (event.currentTarget.duration || 8) - 1.5);
          if (!showTitle && event.currentTarget.currentTime >= revealAt) setShowTitle(true);
        }}
        onEnded={() => {
          setShowTitle(true);
          setFinale(true);
        }}
        onError={onClose}
        aria-hidden="true"
      />
      <svg className="developer-easter-egg-finale-frame" viewBox="0 0 1200 720" aria-hidden="true" focusable="false">
        <path d={linework.flank} />
        <path d={linework.flank} transform="translate(1200 0) scale(-1 1)" />
        <path className="developer-easter-egg-finale-rail" d="M400 120 H540 L600 90 L660 120 H800 M400 600 H540 L600 630 L660 600 H800" />
        <path d={linework.seal} transform="translate(450 50) scale(1.5)" />
      </svg>
      {!reducedMotion && (
        <div className="developer-easter-egg-particles" aria-hidden="true">
          {PARTICLES.map((style, index) => (
            <span key={index} className="developer-easter-egg-particle" style={style} />
          ))}
        </div>
      )}
      <div className={`developer-easter-egg-heading${showTitle || reducedMotion ? " is-visible" : ""}`}>
        <h2>{title}</h2>
        <p>{easterEgg.subtitle}</p>
        <svg className="developer-easter-egg-seal" viewBox="0 0 200 28" aria-hidden="true" focusable="false">
          <path className="developer-easter-egg-rule" d="M0 14 H62 M138 14 H200" />
          <path d={linework.seal} />
        </svg>
      </div>
    </section>,
    document.body,
  );
}
